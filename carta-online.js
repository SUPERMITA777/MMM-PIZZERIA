// Estado global de la aplicación
let appState = {
    categorias: [],
    productos: [],
    carrito: [],
    configuracion: {
        restauranteId: '10aa906d-24c5-40c0-a960-f5992fa6c1ac',
        tipoEntrega: 'delivery',
        mostrarPrecios: true,
        mostrarDescripciones: true,
        mostrarBanners: true
    }
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Carta Online...');
    
    // Configurar eventos
    configurarEventos();
    
    // Cargar datos
    cargarDatosRestaurante();
    
    // Cargar configuración de colores
    cargarConfiguracionColores();
});

// Escuchar mensajes de cambios de color desde el panel de administración
window.addEventListener('message', function(event) {
    if (event.data.type === 'ACTUALIZAR_COLORES') {
        aplicarColores(event.data.colores);
    }
});

// Cargar configuración de colores desde localStorage
function cargarConfiguracionColores() {
    try {
        const configuracionColores = JSON.parse(localStorage.getItem('carta-colores') || '{}');
        if (Object.keys(configuracionColores).length > 0) {
            aplicarColores(configuracionColores);
        }
    } catch (e) {
        console.log('No se pudo cargar configuración de colores');
    }
}

// Aplicar colores a la carta online
function aplicarColores(colores) {
    console.log('🎨 Aplicando colores a la carta:', colores);
    
    const root = document.documentElement;
    
    if (colores.primary) {
        root.style.setProperty('--color-primary', colores.primary);
    }
    
    if (colores.secondary) {
        root.style.setProperty('--color-secondary', colores.secondary);
    }
    
    if (colores.background) {
        root.style.setProperty('--color-background', colores.background);
        document.body.style.backgroundColor = colores.background;
    }
}

// Configurar todos los event listeners
function configurarEventos() {
    // Botones de tipo de entrega
    const deliveryBtns = document.querySelectorAll('.delivery-btn');
    deliveryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover clase active de todos los botones
            deliveryBtns.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Actualizar tipo de entrega
            appState.configuracion.tipoEntrega = this.dataset.type;
            
            console.log('🚚 Tipo de entrega cambiado a:', appState.configuracion.tipoEntrega);
        });
    });
    
    // Botones de tiempo de entrega
    const timeOptions = document.querySelectorAll('.time-option');
    timeOptions.forEach(btn => {
        btn.addEventListener('click', function() {
            timeOptions.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Cargar datos del restaurante desde Supabase
async function cargarDatosRestaurante() {
    try {
        mostrarLoading(true);
        
        console.log('📊 Cargando categorías y productos...');
        
        // Cargar categorías y productos en paralelo
        const [categoriasData, productosData] = await Promise.all([
            cargarCategorias(),
            cargarProductos()
        ]);
        
        console.log('✅ Categorías cargadas:', categoriasData.length);
        console.log('✅ Productos cargados:', productosData.length);
        console.log('📸 Productos con imagen_url:', productosData.filter(p => p.imagen_url).length);
        console.log('🔍 Productos detalle:', productosData.map(p => ({
            nombre: p.nombre,
            imagen_url: p.imagen_url || 'NO_IMAGE',
            categoria_id: p.categoria_id
        })));
        
        // Actualizar estado
        appState.categorias = categoriasData;
        appState.productos = productosData;
        
        // Renderizar interfaz
        renderizarNavegacionCategorias();
        renderizarMenu();
        
        mostrarLoading(false);
        
    } catch (error) {
        console.error('❌ Error cargando datos del restaurante:', error);
        mostrarError('Error cargando el menú. Por favor, recarga la página.');
        mostrarLoading(false);
    }
}

// Cargar categorías desde Supabase
async function cargarCategorias() {
    const { data, error } = await supabase
        .from('categorias_menu')
        .select('*')
        .eq('restaurante_id', appState.configuracion.restauranteId)
        .eq('activo', true)
        .order('orden', { ascending: true });
    
    if (error) {
        throw error;
    }
    
    return data || [];
}

// Cargar productos desde Supabase
async function cargarProductos() {
    const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('restaurante_id', appState.configuracion.restauranteId)
        .eq('disponible', true)
        .order('orden', { ascending: true });
    
    if (error) {
        throw error;
    }
    
    return data || [];
}

// Renderizar navegación de categorías
function renderizarNavegacionCategorias() {
    const container = document.querySelector('.categories-scroll');
    if (!container) return;
    
    container.innerHTML = '';
    
    appState.categorias.forEach((categoria, index) => {
        const link = document.createElement('a');
        link.href = `#categoria-${categoria.id}`;
        link.className = 'category-nav-item';
        link.textContent = categoria.nombre;
        
        // Primer categoría activa por defecto
        if (index === 0) {
            link.classList.add('active');
        }
        
        // Event listener para scroll suave
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Actualizar navegación
            document.querySelectorAll('.category-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            // Scroll a la categoría
            const categoriaSection = document.getElementById(`categoria-${categoria.id}`);
            if (categoriaSection) {
                categoriaSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
        
        container.appendChild(link);
    });
}

// Renderizar menú completo
function renderizarMenu() {
    const container = document.querySelector('.menu-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    appState.categorias.forEach(categoria => {
        const productosCategoria = appState.productos.filter(p => p.categoria_id === categoria.id);
        
        if (productosCategoria.length === 0) return;
        
        const sectionElement = crearSeccionCategoria(categoria, productosCategoria);
        container.appendChild(sectionElement);
    });
}

// Crear sección de categoría
function crearSeccionCategoria(categoria, productos) {
    const section = document.createElement('section');
    section.className = 'category-section';
    section.id = `categoria-${categoria.id}`;
    
    // Banner de categoría
    if (appState.configuracion.mostrarBanners && categoria.imagen_url) {
        const banner = document.createElement('div');
        banner.className = 'category-banner';
        
        banner.innerHTML = `
            <img src="${categoria.imagen_url}" alt="${categoria.nombre}" class="category-banner-image">
        `;
        
        section.appendChild(banner);
    } else {
        // Solo título si no hay banner
        const titulo = document.createElement('h2');
        titulo.className = 'category-title';
        titulo.textContent = categoria.nombre;
        titulo.style.marginBottom = '32px';
        titulo.style.color = '#333';
        titulo.style.fontSize = '2rem';
        titulo.style.fontWeight = '700';
        section.appendChild(titulo);
    }
    
    // Lista de productos
    const productsList = document.createElement('div');
    productsList.className = 'products-list';
    
    productos.forEach(producto => {
        const productoElement = crearElementoProducto(producto);
        productsList.appendChild(productoElement);
    });
    
    section.appendChild(productsList);
    
    return section;
}

// Crear elemento de producto
function crearElementoProducto(producto) {
    const item = document.createElement('div');
    item.className = 'product-item';
    
    // Marcar como destacado si corresponde
    if (producto.destacado) {
        item.classList.add('featured');
    }
    
    // Marcar como no disponible si corresponde
    if (!producto.disponible) {
        item.classList.add('unavailable');
    }
    
    item.innerHTML = `
        <div class="product-content">
            <div class="product-info">
                <h3 class="product-name">${producto.nombre}</h3>
                ${producto.descripcion && appState.configuracion.mostrarDescripciones ? 
                    `<p class="product-description">${producto.descripcion}</p>` : ''}
                ${appState.configuracion.mostrarPrecios ? 
                    `<div class="product-price">$${formatearPrecio(producto.precio)}</div>` : ''}
            </div>
            ${producto.imagen_url ? 
                `<img src="${producto.imagen_url}" alt="${producto.nombre}" class="product-image">` :
                `<div class="product-placeholder">
                    <span class="material-symbols-rounded">restaurant</span>
                </div>`
            }
        </div>
    `;
    
    // Event listener para abrir modal del producto
    if (producto.disponible) {
        item.addEventListener('click', function() {
            abrirModalProducto(producto);
        });
    }
    
    return item;
}

// Abrir modal de producto
function abrirModalProducto(producto) {
    const modal = document.getElementById('product-modal');
    const details = document.getElementById('product-details');
    
    details.innerHTML = `
        ${producto.imagen_url ? 
            `<img src="${producto.imagen_url}" alt="${producto.nombre}" style="width: 100%; height: 250px; object-fit: cover;">` : ''}
        <div style="padding: 24px;">
            <h2 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 16px; color: #333;">${producto.nombre}</h2>
            ${producto.descripcion ? 
                `<p style="color: #6c757d; margin-bottom: 20px; line-height: 1.6;">${producto.descripcion}</p>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <span style="font-size: 1.6rem; font-weight: 700; color: #ff6b35;">$${formatearPrecio(producto.precio)}</span>
            </div>
            <button onclick="agregarAlCarrito('${producto.id}')" style="width: 100%; background: #ff6b35; color: white; border: none; padding: 16px; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.3s ease;">
                Agregar al Carrito
            </button>
        </div>
    `;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de producto
function cerrarModalProducto() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Agregar producto al carrito
function agregarAlCarrito(productoId) {
    const producto = appState.productos.find(p => p.id === productoId);
    if (!producto) return;
    
    // Buscar si ya existe en el carrito
    const itemExistente = appState.carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        appState.carrito.push({
            ...producto,
            cantidad: 1
        });
    }
    
    actualizarCarritoFlotante();
    cerrarModalProducto();
    
    // Mostrar notificación
    showNotification(`${producto.nombre} agregado al carrito`, 'success');
}

// Actualizar carrito flotante
function actualizarCarritoFlotante() {
    const carritoFloating = document.getElementById('cart-floating');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    const totalItems = appState.carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrecio = appState.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    if (totalItems > 0) {
        carritoFloating.style.display = 'block';
        cartCount.textContent = totalItems;
        cartTotal.textContent = formatearPrecio(totalPrecio);
    } else {
        carritoFloating.style.display = 'none';
    }
}

// Abrir carrito
function abrirCarrito() {
    const modal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    const cartTotalDisplay = document.getElementById('cart-total-display');
    
    // Renderizar items del carrito
    cartItems.innerHTML = '';
    
    if (appState.carrito.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">Tu carrito está vacío</p>';
    } else {
        appState.carrito.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e9ecef;';
            
            itemElement.innerHTML = `
                <div>
                    <h4 style="margin: 0 0 4px 0; font-weight: 600;">${item.nombre}</h4>
                    <p style="margin: 0; color: #6c757d; font-size: 0.9rem;">$${formatearPrecio(item.precio)} x ${item.cantidad}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 600; color: #ff6b35;">$${formatearPrecio(item.precio * item.cantidad)}</span>
                    <button onclick="eliminarDelCarrito('${item.id}')" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">
                        <span class="material-symbols-rounded" style="font-size: 16px;">delete</span>
                    </button>
                </div>
            `;
            
            cartItems.appendChild(itemElement);
        });
    }
    
    // Actualizar total
    const total = appState.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    cartTotalDisplay.textContent = formatearPrecio(total);
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cerrar carrito
function cerrarCarrito() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Eliminar del carrito
function eliminarDelCarrito(productoId) {
    appState.carrito = appState.carrito.filter(item => item.id !== productoId);
    actualizarCarritoFlotante();
    abrirCarrito(); // Refrescar vista del carrito
}

// Proceder al pago
function procederAlPago() {
    if (appState.carrito.length === 0) {
        showNotification('Tu carrito está vacío', 'warning');
        return;
    }
    
    // Aquí iría la lógica para proceder al pago
    // Por ahora, solo mostramos un mensaje
    showNotification('Funcionalidad de pago en desarrollo', 'info');
    
    console.log('🛒 Carrito para checkout:', appState.carrito);
}

// Utilidades
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(precio);
}

function mostrarLoading(mostrar) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = mostrar ? 'flex' : 'none';
    }
}

function mostrarError(mensaje) {
    showNotification(mensaje, 'error');
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: ${type === 'warning' ? '#000' : '#fff'};
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Añadir estilos de animación al head
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Scroll spy para navegación de categorías
window.addEventListener('scroll', function() {
    const categorySections = document.querySelectorAll('.category-section');
    const navItems = document.querySelectorAll('.category-nav-item');
    
    let currentSection = '';
    
    categorySections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 150) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${currentSection}`) {
            item.classList.add('active');
        }
    });
});

// Hacer funciones globales para que puedan ser llamadas desde HTML
window.abrirCarrito = abrirCarrito;
window.cerrarCarrito = cerrarCarrito;
window.cerrarModalProducto = cerrarModalProducto;
window.agregarAlCarrito = agregarAlCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.procederAlPago = procederAlPago;
