// =====================================================
// PÁGINA DEL CLIENTE - INTEGRADA CON SUPABASE
// =====================================================

// Variables globales
let cart = [];
let currentRestaurante = null;
let productos = [];
let categorias = [];
let clienteActual = null;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando página del cliente...');
    
    try {
        // Cargar datos del restaurante
        await cargarDatosRestaurante();
        
        // Cargar categorías y productos
        await cargarCategorias();
        await cargarProductos();
        
        // Cargar carrito desde localStorage
        cargarCarrito();
        
        // Configurar event listeners
        configurarEventListeners();
        
        // Mostrar productos iniciales
        mostrarProductos();
        
        console.log('✅ Página del cliente inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showNotification('Error al cargar los datos', 'error');
    }
});

// =====================================================
// FUNCIONES DE CARGA DE DATOS
// =====================================================

async function cargarDatosRestaurante() {
    try {
        currentRestaurante = await PedisyAPI.restaurantes.getRestaurante();
        console.log('✅ Restaurante cargado:', currentRestaurante);
        
        // Actualizar información en la UI
        if (currentRestaurante) {
            document.querySelector('.hero h1').textContent = currentRestaurante.nombre;
            document.querySelector('.hero p').textContent = currentRestaurante.descripcion || 'Descubre nuestra deliciosa gastronomía';
            document.title = `${currentRestaurante.nombre} | Menú Digital`;
        }
    } catch (error) {
        console.error('Error al cargar restaurante:', error);
        throw error;
    }
}

async function cargarCategorias() {
    try {
        categorias = await PedisyAPI.categorias.getCategorias();
        console.log('✅ Categorías cargadas:', categorias);
        
        // Actualizar navegación de categorías
        actualizarNavegacionCategorias();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        throw error;
    }
}

async function cargarProductos() {
    try {
        productos = await PedisyAPI.productos.getProductos();
        console.log('✅ Productos cargados:', productos);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        throw error;
    }
}

// =====================================================
// FUNCIONES DE UI
// =====================================================

function actualizarNavegacionCategorias() {
    const navContainer = document.querySelector('.category-nav');
    if (!navContainer) return;
    
    // Agregar botón "Todos"
    let navHTML = '<button class="category-btn active" data-category="todos">Todos</button>';
    
    // Agregar categorías
    categorias.forEach(categoria => {
        navHTML += `
            <button class="category-btn" data-category="${categoria.id}">
                ${categoria.nombre}
            </button>
        `;
    });
    
    navContainer.innerHTML = navHTML;
    
    // Configurar event listeners para categorías
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos los botones
            categoryBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            btn.classList.add('active');
            
            // Filtrar productos
            const categoria = btn.getAttribute('data-category');
            filtrarProductos(categoria);
        });
    });
}

function mostrarProductos(categoriaId = null) {
    const menuGrid = document.querySelector('.menu-grid');
    if (!menuGrid) return;
    
    let productosAMostrar = productos;
    
    if (categoriaId && categoriaId !== 'todos') {
        productosAMostrar = productos.filter(p => p.categoria_id === categoriaId);
    }
    
    // Filtrar solo productos disponibles
    productosAMostrar = productosAMostrar.filter(p => p.disponible);
    
    if (productosAMostrar.length === 0) {
        menuGrid.innerHTML = `
            <div class="no-products">
                <span class="material-symbols-rounded">restaurant</span>
                <h3>No hay productos disponibles</h3>
                <p>Pronto tendremos nuevos productos para ti</p>
            </div>
        `;
        return;
    }
    
    menuGrid.innerHTML = productosAMostrar.map(producto => `
        <div class="menu-item" data-category="${producto.categoria_id}">
            <div class="item-image">
                <img src="${producto.imagen_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'}" 
                     alt="${producto.nombre}"
                     loading="lazy">
            </div>
            <div class="item-content">
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion || 'Descripción no disponible'}</p>
                <div class="item-footer">
                    <span class="price">$${producto.precio}</span>
                    <button class="btn btn-primary add-to-cart" 
                            data-item="${producto.id}" 
                            data-name="${producto.nombre}" 
                            data-price="${producto.precio}">
                        <span class="material-symbols-rounded">add</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Configurar event listeners para botones de agregar al carrito
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
}

function filtrarProductos(categoriaId) {
    mostrarProductos(categoriaId);
}

// =====================================================
// FUNCIONES DEL CARRITO
// =====================================================

function addToCart(e) {
    const btn = e.currentTarget;
    const itemId = btn.getAttribute('data-item');
    const itemName = btn.getAttribute('data-name');
    const itemPrice = parseFloat(btn.getAttribute('data-price'));
    
    const existingItem = cart.find(item => item.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            id: itemId,
            name: itemName, 
            price: itemPrice, 
            quantity: 1 
        });
    }
    
    updateCartDisplay();
    saveCart();
    showNotification(`${itemName} agregado al carrito`, 'success');
    
    // Abrir carrito si no está abierto
    if (!document.querySelector('.cart-sidebar').classList.contains('open')) {
        toggleCart();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
    saveCart();
}

function updateQuantity(itemId, change) {
    const item = cart.find(item => item.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateCartDisplay();
            saveCart();
        }
    }
}

function updateCartDisplay() {
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const cartCount = document.querySelector('.cart-count');
    
    if (!cartItems || !cartTotal || !cartCount) return;
    
    // Actualizar contador del carrito
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (totalItems === 0) {
        cartCount.style.display = 'none';
    } else {
        cartCount.style.display = 'block';
    }
    
    // Actualizar lista de items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <span class="material-symbols-rounded">shopping_cart</span>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        cartTotal.innerHTML = '<p>Total: $0.00</p>';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price} x ${item.quantity}</p>
            </div>
            <div class="cart-item-actions">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        </div>
    `).join('');
    
    // Actualizar total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = calcularCostoDelivery();
    const total = subtotal + deliveryFee;
    
    cartTotal.innerHTML = `
        <div class="total-line">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="total-line">
            <span>Delivery:</span>
            <span>$${deliveryFee.toFixed(2)}</span>
        </div>
        <div class="total-line total">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        </div>
        <button class="btn btn-primary checkout-btn" onclick="abrirCheckout()">
            Proceder al Pedido
        </button>
    `;
}

function calcularCostoDelivery() {
    // Implementar lógica de cálculo de delivery basada en configuración
    // Por ahora, costo fijo de $5.00
    return 5.00;
}

function saveCart() {
    localStorage.setItem('pedisyCart', JSON.stringify(cart));
}

function cargarCarrito() {
    const savedCart = localStorage.getItem('pedisyCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
}

// =====================================================
// FUNCIONES DEL CHECKOUT
// =====================================================

function abrirCheckout() {
    if (cart.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }
    
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Llenar resumen del pedido
        llenarResumenPedido();
    }
}

function cerrarCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function llenarResumenPedido() {
    const orderSummary = document.querySelector('.order-summary');
    if (!orderSummary) return;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = calcularCostoDelivery();
    const total = subtotal + deliveryFee;
    
    orderSummary.innerHTML = `
        <h3>Resumen del Pedido</h3>
        <div class="order-items">
            ${cart.map(item => `
                <div class="order-item">
                    <span>${item.name} x${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        <div class="order-totals">
            <div class="total-line">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-line">
                <span>Delivery:</span>
                <span>$${deliveryFee.toFixed(2)}</span>
            </div>
            <div class="total-line total">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        </div>
    `;
}

async function procesarPedido() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;
    
    // Validar formulario
    if (!validarFormularioCheckout()) {
        return;
    }
    
    try {
        // Obtener datos del formulario
        const formData = new FormData(form);
        
        // Crear o actualizar cliente
        const clienteData = {
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            direccion: formData.get('direccion')
        };
        
        let cliente = await PedisyAPI.clientes.getClientePorEmail(clienteData.email);
        
        if (!cliente) {
            cliente = await PedisyAPI.clientes.createCliente(clienteData);
        } else {
            cliente = await PedisyAPI.clientes.updateCliente(cliente.id, clienteData);
        }
        
        // Crear pedido
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = calcularCostoDelivery();
        const total = subtotal + deliveryFee;
        
        const pedidoData = {
            cliente_id: cliente.id,
            restaurante_id: currentRestaurante.id,
            numero_pedido: generarNumeroPedido(),
            estado: 'pendiente',
            tipo_entrega: formData.get('tipo_entrega'),
            direccion_entrega: formData.get('direccion'),
            subtotal: subtotal,
            costo_delivery: deliveryFee,
            total: total,
            metodo_pago: formData.get('metodo_pago'),
            notas: formData.get('notas') || ''
        };
        
        const pedido = await PedisyAPI.pedidos.createPedido(pedidoData);
        
        // Crear detalles del pedido
        const detalles = cart.map(item => ({
            pedido_id: pedido.id,
            producto_id: item.id,
            cantidad: item.quantity,
            precio_unitario: item.price,
            subtotal: item.price * item.quantity
        }));
        
        await PedisyAPI.pedidos.createDetallesPedido(detalles);
        
        // Mostrar confirmación
        mostrarConfirmacionPedido(pedido);
        
        // Limpiar carrito
        clearCart();
        
        // Cerrar checkout
        cerrarCheckout();
        
    } catch (error) {
        console.error('Error al procesar pedido:', error);
        showNotification('Error al procesar el pedido. Inténtalo de nuevo.', 'error');
    }
}

function validarFormularioCheckout() {
    const requiredFields = ['nombre', 'apellido', 'email', 'telefono', 'direccion', 'metodo_pago'];
    let isValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field || !field.value.trim()) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });
    
    if (!isValid) {
        showNotification('Por favor, completa todos los campos requeridos', 'error');
    }
    
    return isValid;
}

function generarNumeroPedido() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PED-${timestamp}-${random}`;
}

function mostrarConfirmacionPedido(pedido) {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        // Actualizar información del pedido
        const pedidoInfo = successModal.querySelector('.pedido-info');
        if (pedidoInfo) {
            pedidoInfo.innerHTML = `
                <h3>¡Pedido Confirmado!</h3>
                <p><strong>Número de pedido:</strong> ${pedido.numero_pedido}</p>
                <p><strong>Total:</strong> $${pedido.total}</p>
                <p>Te notificaremos cuando tu pedido esté listo.</p>
            `;
        }
        
        successModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function cerrarConfirmacion() {
    const successModal = document.getElementById('successModal');
    if (successModal) {
        successModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

function toggleCart() {
    const cartSidebar = document.querySelector('.cart-sidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
    }
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="material-symbols-rounded">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
        <span>${message}</span>
        <button class="notification-close">
            <span class="material-symbols-rounded">close</span>
        </button>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Event listener para cerrar
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// =====================================================
// CONFIGURACIÓN DE EVENT LISTENERS
// =====================================================

function configurarEventListeners() {
    // Botón del carrito
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', toggleCart);
    }
    
    // Cerrar carrito
    const closeCartBtn = document.querySelector('.close-cart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', toggleCart);
    }
    
    // Botones de cerrar modales
    const closeCheckoutBtn = document.querySelector('.close-checkout');
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', cerrarCheckout);
    }
    
    const closeSuccessBtn = document.querySelector('.close-success');
    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', cerrarConfirmacion);
    }
    
    // Formulario de checkout
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            procesarPedido();
        });
    }
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        const checkoutModal = document.getElementById('checkoutModal');
        const successModal = document.getElementById('successModal');
        
        if (e.target === checkoutModal) {
            cerrarCheckout();
        }
        
        if (e.target === successModal) {
            cerrarConfirmacion();
        }
    });
    
    // Geolocalización
    const locationBtn = document.querySelector('.location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', obtenerUbicacion);
    }
}

// =====================================================
// FUNCIONES DE GEOLOCALIZACIÓN
// =====================================================

function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                
                // Actualizar campos de dirección
                const direccionField = document.querySelector('[name="direccion"]');
                if (direccionField) {
                    direccionField.value = `Ubicación GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                }
                
                showNotification('Ubicación obtenida correctamente', 'success');
            },
            (error) => {
                console.error('Error al obtener ubicación:', error);
                showNotification('No se pudo obtener tu ubicación', 'error');
            }
        );
    } else {
        showNotification('Tu navegador no soporta geolocalización', 'error');
    }
}

// =====================================================
// FUNCIONES DE LAZY LOADING
// =====================================================

function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Inicializar lazy loading cuando se carga la página
document.addEventListener('DOMContentLoaded', initLazyLoading);

// =====================================================
// FUNCIONES DE RESPONSIVE
// =====================================================

function handleResize() {
    const cartSidebar = document.querySelector('.cart-sidebar');
    if (window.innerWidth <= 768) {
        cartSidebar.classList.remove('open');
    }
}

// Event listeners para responsive
window.addEventListener('resize', handleResize);
window.addEventListener('load', handleResize);
