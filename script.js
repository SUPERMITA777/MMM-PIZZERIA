// =====================================================
// PANEL DE ADMINISTRACIÓN - INTEGRADO CON SUPABASE
// =====================================================

// Variables globales
let currentRestaurante = null;
let categorias = [];
let productos = [];
let pedidos = [];

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando panel de administración...');
    
    // Configurar event listeners primero (para que la navegación funcione)
    configurarEventListeners();
    
    // Configurar event listeners específicos para productos
    configurarEventListenersProductos();
    
    // Configurar la sección MENÚ estilo Pedisy
    configurarMenuPedisy();
    
    // Configurar modal de crear categoría
    configurarModalCategoria();
    
    try {
        // Cargar datos del restaurante
        await cargarDatosRestaurante();
        console.log('✅ Restaurante cargado');
        
        // Cargar categorías y productos
        await cargarCategorias();
        console.log('✅ Categorías cargadas');
        
        // Cargar categorías en la interfaz del menú
        await cargarCategoriasDesdeDB();
        
        await cargarProductos();
        console.log('✅ Productos cargados');
        
        // Cargar pedidos (no detener si falla)
        try {
            await cargarPedidos();
            console.log('✅ Pedidos cargados');
        } catch (pedidosError) {
            console.warn('⚠️ Error al cargar pedidos (continuando):', pedidosError);
        }
        
        // Actualizar dashboard con datos reales
        actualizarDashboard();
        
        // Inicializar formulario de crear producto
        inicializarFormularioCrearProducto();
        
        console.log('✅ Panel de administración inicializado correctamente');
        
        // Inicializar carta online
        inicializarCartaOnline();
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        showNotification('Algunos datos no se pudieron cargar, pero el sistema está funcional', 'warning');
    }
});

// =====================================================
// FUNCIONES DE CARTA ONLINE
// =====================================================

function inicializarCartaOnline() {
    // Configurar tabs de carta online
    const cartaTabs = document.querySelectorAll('.carta-tab');
    const cartaPanels = document.querySelectorAll('.carta-panel');
    
    cartaTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remover clase active de todos los tabs
            cartaTabs.forEach(t => t.classList.remove('active'));
            cartaPanels.forEach(p => p.classList.remove('active'));
            
            // Agregar clase active al tab clickeado
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
    
    // Configurar selectores de color
    configurarSelectoresColor();
    
    // Configurar uploads de imágenes
    configurarUploadsCartaOnline();
    
    // Cargar categorías en la lista de carta online
    cargarCategoriasCartaOnline();
}

function configurarSelectoresColor() {
    const primaryColorInput = document.getElementById('primary-color');
    const secondaryColorInput = document.getElementById('secondary-color');
    const backgroundColorInput = document.getElementById('background-color');
    
    if (primaryColorInput) {
        primaryColorInput.addEventListener('change', function() {
            const preview = this.parentElement.querySelector('.color-preview');
            if (preview) {
                preview.style.background = this.value;
            }
            actualizarColoresCarta('primary', this.value);
        });
    }
    
    if (secondaryColorInput) {
        secondaryColorInput.addEventListener('change', function() {
            const preview = this.parentElement.querySelector('.color-preview');
            if (preview) {
                preview.style.background = this.value;
            }
            actualizarColoresCarta('secondary', this.value);
        });
    }
    
    if (backgroundColorInput) {
        backgroundColorInput.addEventListener('change', function() {
            const preview = this.parentElement.querySelector('.color-preview');
            if (preview) {
                preview.style.background = this.value;
            }
            actualizarColoresCarta('background', this.value);
        });
    }
}

function configurarUploadsCartaOnline() {
    const logoUpload = document.getElementById('logo-upload');
    const bannerUpload = document.getElementById('banner-upload');
    
    if (logoUpload && !logoUpload.dataset.configured) {
        logoUpload.dataset.configured = 'true';
        logoUpload.addEventListener('change', function(e) {
            manejarUploadLogo(e.target.files[0]);
        });
    }
    
    if (bannerUpload && !bannerUpload.dataset.configured) {
        bannerUpload.dataset.configured = 'true';
        bannerUpload.addEventListener('change', function(e) {
            manejarUploadBanner(e.target.files[0]);
        });
    }
}

function manejarUploadLogo(file) {
    if (!file) return;
    
    // Validaciones
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona un archivo de imagen válido', 'error');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB
        showNotification('El archivo es muy grande. Máximo 2MB', 'error');
        return;
    }
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('logo-preview');
        const img = document.getElementById('logo-img');
        
        if (preview && img) {
            img.src = e.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
    
    console.log('📷 Logo cargado:', file.name);
}

function manejarUploadBanner(file) {
    if (!file) return;
    
    // Validaciones
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona un archivo de imagen válido', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
        showNotification('El archivo es muy grande. Máximo 5MB', 'error');
        return;
    }
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('banner-preview');
        const img = document.getElementById('banner-img');
        
        if (preview && img) {
            img.src = e.target.result;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
    
    console.log('📷 Banner cargado:', file.name);
}

async function cargarCategoriasCartaOnline() {
    const container = document.getElementById('carta-categories-list');
    if (!container) return;
    
    try {
        // Esperar a que currentCategorias esté disponible
        if (currentCategorias.length === 0) {
            await cargarCategorias();
        }
        
        container.innerHTML = '';
        
        if (currentCategorias.length === 0) {
            container.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">No hay categorías disponibles</p>';
            return;
        }
        
        currentCategorias.forEach(categoria => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 8px;';
            
            item.innerHTML = `
                <div>
                    <h5 style="margin: 0 0 4px 0; font-weight: 600;">${categoria.nombre}</h5>
                    <p style="margin: 0; color: #6c757d; font-size: 0.9rem;">
                        ${categoria.descripcion || 'Sin descripción'}
                    </p>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label class="checkbox-label">
                        <input type="checkbox" ${categoria.activo ? 'checked' : ''} 
                               onchange="toggleCategoriaEnCarta('${categoria.id}', this.checked)">
                        <span class="checkmark"></span>
                        Mostrar
                    </label>
                </div>
            `;
            
            container.appendChild(item);
        });
        
    } catch (error) {
        console.error('❌ Error cargando categorías para carta online:', error);
        if (container) {
            container.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error cargando categorías</p>';
        }
    }
}

function toggleCategoriaEnCarta(categoriaId, mostrar) {
    console.log(`📝 Categoría ${categoriaId} ${mostrar ? 'habilitada' : 'deshabilitada'} en carta online`);
    // Aquí iría la lógica para actualizar la configuración en la base de datos
    showNotification(`Categoría ${mostrar ? 'habilitada' : 'deshabilitada'} en carta online`, 'info');
}

function actualizarColoresCarta(tipo, color) {
    console.log(`🎨 Color ${tipo} actualizado a:`, color);
    
    // Guardar en localStorage para persistencia temporal
    const configuracionColores = JSON.parse(localStorage.getItem('carta-colores') || '{}');
    configuracionColores[tipo] = color;
    localStorage.setItem('carta-colores', JSON.stringify(configuracionColores));
    
    // Aplicar inmediatamente a la carta online si está abierta
    aplicarColoresACarta(configuracionColores);
    
    showNotification(`Color ${tipo} actualizado`, 'success');
}

function aplicarColoresACarta(colores) {
    // Esta función se puede llamar desde la carta online para aplicar los colores
    if (typeof window !== 'undefined' && window.opener) {
        // Si la carta online está abierta en otra ventana
        try {
            window.opener.postMessage({
                type: 'ACTUALIZAR_COLORES',
                colores: colores
            }, '*');
        } catch (e) {
            console.log('No se pudo comunicar con la carta online');
        }
    }
}

function previsualizarCarta() {
    console.log('👁️ Abriendo vista previa de carta online...');
    
    // Abrir carta online en nueva ventana
    const url = 'carta-online.html';
    window.open(url, '_blank', 'width=1200,height=800');
    
    showNotification('Vista previa abierta en nueva ventana', 'info');
}

function publicarCarta() {
    console.log('🚀 Publicando carta online...');
    
    // Aquí iría la lógica para publicar la carta
    showNotification('Carta online publicada exitosamente', 'success');
}

function copiarURL() {
    const slugInput = document.getElementById('carta-slug');
    if (!slugInput) return;
    
    const url = `https://carta.mmm.com/${slugInput.value}`;
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(url).then(() => {
        showNotification('URL copiada al portapapeles', 'success');
    }).catch(() => {
        // Fallback para navegadores que no soportan navigator.clipboard
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        showNotification('URL copiada al portapapeles', 'success');
    });
}

// =====================================================
// FUNCIONES DE CARGA DE DATOS
// =====================================================

async function cargarDatosRestaurante() {
    try {
        currentRestaurante = await PedisyAPI.restaurantes.getRestaurante();
        console.log('✅ Restaurante cargado:', currentRestaurante);
        
        // Actualizar información en la UI
        if (currentRestaurante) {
            document.querySelector('.user-name').textContent = `${currentRestaurante.nombre}`;
            document.title = `MMM | ${currentRestaurante.nombre}`;
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
        
        // Actualizar lista de categorías en la UI
        actualizarListaCategorias();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        throw error;
    }
}

async function cargarProductos() {
    try {
        productos = await PedisyAPI.productos.getProductos();
        console.log('✅ Productos cargados:', productos);
        
        // Actualizar lista de productos en la UI
        actualizarListaProductos();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        throw error;
    }
}

async function cargarPedidos() {
    try {
        if (currentRestaurante) {
            pedidos = await PedisyAPI.pedidos.getPedidos(currentRestaurante.id);
            console.log('✅ Pedidos cargados:', pedidos);
            
            // Actualizar lista de pedidos en la UI
            actualizarListaPedidos();
        }
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        throw error;
    }
}

// =====================================================
// FUNCIONES DE ACTUALIZACIÓN DE UI
// =====================================================

function actualizarListaCategorias() {
    const categoriasContainer = document.querySelector('#categories-list');
    if (!categoriasContainer) return;
    
    categoriasContainer.innerHTML = categorias.map(categoria => `
        <div class="categoria-item" data-id="${categoria.id}">
            <div class="categoria-info">
                <div class="categoria-header">
                    <h4>${categoria.nombre}</h4>
                    <span class="categoria-status ${categoria.activo ? 'active' : 'inactive'}">
                        ${categoria.activo ? 'Activa' : 'Inactiva'}
                    </span>
                </div>
                <p class="categoria-descripcion">${categoria.descripcion || 'Sin descripción'}</p>
                <div class="categoria-meta">
                    <span class="categoria-orden">Orden: ${categoria.orden}</span>
                    <span class="categoria-productos">${getProductosPorCategoria(categoria.id)} productos</span>
                </div>
            </div>
            <div class="categoria-actions">
                <button class="btn btn-secondary btn-sm edit-categoria" data-id="${categoria.id}" title="Editar categoría">
                    <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="btn btn-danger btn-sm delete-categoria" data-id="${categoria.id}" title="Eliminar categoría">
                    <span class="material-symbols-rounded">delete</span>
                </button>
                <button class="btn btn-sm toggle-categoria ${categoria.activo ? 'btn-warning' : 'btn-success'}" 
                        data-id="${categoria.id}" title="${categoria.activo ? 'Desactivar' : 'Activar'}">
                    <span class="material-symbols-rounded">${categoria.activo ? 'visibility_off' : 'visibility'}</span>
                </button>
            </div>
        </div>
    `).join('');
    
    // Actualizar filtro de categorías en productos
    actualizarFiltroCategorias();
}

function actualizarListaProductos() {
    const productosContainer = document.querySelector('#products-list');
    if (!productosContainer) return;
    
    productosContainer.innerHTML = productos.map(producto => `
        <div class="producto-item" data-id="${producto.id}">
            <div class="producto-image">
                <img src="${producto.imagen_url || window.IMAGE_PLACEHOLDERS?.placeholder || '#'}" 
                     alt="${producto.nombre}" onerror="this.src=window.IMAGE_PLACEHOLDERS?.error || '#'">
            </div>
            <div class="producto-info">
                <div class="producto-header">
                    <h4>${producto.nombre}</h4>
                    <span class="producto-status ${producto.disponible ? 'available' : 'unavailable'}">
                        ${producto.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                </div>
                <p class="producto-descripcion">${producto.descripcion || 'Sin descripción'}</p>
                <div class="producto-meta">
                    <span class="producto-precio">$${producto.precio.toFixed(2)}</span>
                    <span class="producto-categoria">${getCategoriaNombre(producto.categoria_id)}</span>
                    <span class="producto-orden">Orden: ${producto.orden}</span>
                </div>
                <div class="producto-flags">
                    ${producto.destacado ? '<span class="flag destacado">Destacado</span>' : ''}
                    ${producto.nuevo ? '<span class="flag nuevo">Nuevo</span>' : ''}
                </div>
            </div>
            <div class="producto-actions">
                <button class="btn btn-secondary btn-sm edit-producto" data-id="${producto.id}" title="Editar producto">
                    <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="btn btn-danger btn-sm delete-producto" data-id="${producto.id}" title="Eliminar producto">
                    <span class="material-symbols-rounded">delete</span>
                </button>
                <button class="btn btn-sm toggle-producto ${producto.disponible ? 'btn-warning' : 'btn-success'}" 
                        data-id="${producto.id}" title="${producto.disponible ? 'Desactivar' : 'Activar'}">
                    <span class="material-symbols-rounded">${producto.disponible ? 'visibility_off' : 'visibility'}</span>
                </button>
                <button class="btn btn-sm toggle-destacado ${producto.destacado ? 'btn-primary' : 'btn-outline'}" 
                        data-id="${producto.id}" title="${producto.destacado ? 'Quitar destacado' : 'Marcar destacado'}">
                    <span class="material-symbols-rounded">${producto.destacado ? 'star' : 'star_outline'}</span>
                </button>
            </div>
        </div>
    `).join('');
}

function actualizarListaPedidos() {
    const pedidosContainer = document.querySelector('#pedidos .pedidos-list');
    if (!pedidosContainer) return;
    
    pedidosContainer.innerHTML = pedidos.map(pedido => `
        <div class="pedido-item" data-id="${pedido.id}">
            <div class="pedido-header">
                <h4>Pedido #${pedido.numero_pedido}</h4>
                <span class="pedido-estado ${pedido.estado}">${pedido.estado}</span>
            </div>
            <div class="pedido-info">
                <p><strong>Cliente:</strong> ${pedido.clientes?.nombre} ${pedido.clientes?.apellido}</p>
                <p><strong>Total:</strong> $${pedido.total}</p>
                <p><strong>Método de pago:</strong> ${pedido.metodo_pago}</p>
                <p><strong>Fecha:</strong> ${new Date(pedido.created_at).toLocaleString()}</p>
            </div>
            <div class="pedido-actions">
                <button class="btn btn-primary btn-sm update-estado" data-id="${pedido.id}">
                    Actualizar Estado
                </button>
                <button class="btn btn-secondary btn-sm ver-detalles" data-id="${pedido.id}">
                    Ver Detalles
                </button>
            </div>
        </div>
    `).join('');
}

function actualizarDashboard() {
    if (!currentRestaurante) return;
    
    // Actualizar estadísticas con datos reales
    const pedidosHoy = pedidos.filter(p => {
        const hoy = new Date().toDateString();
        const fechaPedido = new Date(p.created_at).toDateString();
        return hoy === fechaPedido;
    }).length;
    
    const ventasHoy = pedidos.filter(p => {
        const hoy = new Date().toDateString();
        const fechaPedido = new Date(p.created_at).toDateString();
        return hoy === fechaPedido;
    }).reduce((total, p) => total + parseFloat(p.total), 0);
    
    const deliveriesHoy = pedidos.filter(p => {
        const hoy = new Date().toDateString();
        const fechaPedido = new Date(p.created_at).toDateString();
        return hoy === fechaPedido && p.tipo_entrega === 'delivery';
    }).length;
    
    // Actualizar UI
    const pedidosElement = document.querySelector('#dashboard .stat-card:nth-child(1) .stat-number');
    const ventasElement = document.querySelector('#dashboard .stat-card:nth-child(2) .stat-number');
    const deliveriesElement = document.querySelector('#dashboard .stat-card:nth-child(3) .stat-number');
    
    if (pedidosElement) pedidosElement.textContent = pedidosHoy;
    if (ventasElement) ventasElement.textContent = `$${ventasHoy.toFixed(2)}`;
    if (deliveriesElement) deliveriesElement.textContent = deliveriesHoy;
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

function getCategoriaNombre(categoriaId) {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin categoría';
}

function getProductosPorCategoria(categoriaId) {
    return productos.filter(p => p.categoria_id === categoriaId).length;
}

function actualizarFiltroCategorias() {
    const filterSelect = document.getElementById('category-filter');
    if (!filterSelect) return;
    
    // Mantener la opción seleccionada actual
    const currentValue = filterSelect.value;
    
    filterSelect.innerHTML = '<option value="">Todas las categorías</option>' +
        categorias.filter(c => c.activo).map(c => 
            `<option value="${c.id}" ${c.id == currentValue ? 'selected' : ''}>${c.nombre}</option>`
        ).join('');
}

function filtrarProductos() {
    const categoriaFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;
    
    let productosFiltrados = [...productos];
    
    // Filtro por categoría
    if (categoriaFilter) {
        productosFiltrados = productosFiltrados.filter(p => p.categoria_id == categoriaFilter);
    }
    
    // Filtro por estado
    if (statusFilter) {
        productosFiltrados = productosFiltrados.filter(p => 
            statusFilter === 'disponible' ? p.disponible : !p.disponible
        );
    }
    
    // Ordenamiento
    productosFiltrados.sort((a, b) => {
        switch (sortFilter) {
            case 'precio':
                return a.precio - b.precio;
            case 'orden':
                return a.orden - b.orden;
            case 'nombre':
            default:
                return a.nombre.localeCompare(b.nombre);
        }
    });
    
    // Actualizar la lista con productos filtrados
    actualizarListaProductosFiltrados(productosFiltrados);
}

function actualizarListaProductosFiltrados(productosFiltrados) {
    const productosContainer = document.querySelector('#products-list');
    if (!productosContainer) return;
    
    if (productosFiltrados.length === 0) {
        productosContainer.innerHTML = `
            <div class="no-products">
                <span class="material-symbols-rounded">search_off</span>
                <p>No se encontraron productos con los filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    // Usar la función existente pero con los productos filtrados
    const productosOriginales = [...productos];
    productos = productosFiltrados;
    actualizarListaProductos();
    productos = productosOriginales;
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
    // Sidebar toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Navegación
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover clase active de todos los items
            navItems.forEach(nav => nav.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Agregar clase active al item clickeado
            item.classList.add('active');
            
            // Mostrar sección correspondiente
            const targetId = item.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                pageTitle.textContent = item.textContent;
            }
        });
    });
    
         // Tabs de configuraciones
     const configTabs = document.querySelectorAll('.config-tab');
     const configPanels = document.querySelectorAll('.config-panel');
     
     configTabs.forEach(tab => {
         tab.addEventListener('click', () => {
             const targetTab = tab.getAttribute('data-tab');
             
             // Remover clase active de todos los tabs y panels
             configTabs.forEach(t => t.classList.remove('active'));
             configPanels.forEach(p => p.classList.remove('active'));
             
             // Agregar clase active al tab clickeado
             tab.classList.add('active');
             const targetPanel = document.getElementById(targetTab);
             if (targetPanel) {
                 targetPanel.classList.add('active');
             }
         });
     });
     
     // Tabs del menú
     const menuTabs = document.querySelectorAll('.menu-tab');
     const menuPanels = document.querySelectorAll('.menu-panel');
     
     menuTabs.forEach(tab => {
         tab.addEventListener('click', () => {
             const targetTab = tab.getAttribute('data-tab');
             
             // Remover clase active de todos los tabs y panels
             menuTabs.forEach(t => t.classList.remove('active'));
             menuPanels.forEach(p => p.classList.remove('active'));
             
             // Agregar clase active al tab clickeado
             tab.classList.add('active');
             const targetPanel = document.getElementById(targetTab);
             if (targetPanel) {
                 targetPanel.classList.add('active');
             }
         });
     });
     
     // Tabs de delivery del menú
     const deliveryTabs = document.querySelectorAll('.delivery-tab');
     
     deliveryTabs.forEach(tab => {
         tab.addEventListener('click', () => {
             // Remover clase active de todos los tabs
             deliveryTabs.forEach(t => t.classList.remove('active'));
             
             // Agregar clase active al tab clickeado
             tab.classList.add('active');
         });
     });
     
     // Interacción entre categorías y productos
     const categoryItems = document.querySelectorAll('.category-item');
     const productItems = document.querySelectorAll('.product-item');
     
     categoryItems.forEach(category => {
         category.addEventListener('click', () => {
             // Remover clase active de todas las categorías
             categoryItems.forEach(c => c.classList.remove('active'));
             
             // Agregar clase active a la categoría clickeada
             category.classList.add('active');
             
             // Filtrar productos por categoría (simulado)
             const categoryType = category.getAttribute('data-category');
             filterProductsByCategory(categoryType);
         });
     });
     
     productItems.forEach(product => {
         product.addEventListener('click', () => {
             // Remover clase active de todos los productos
             productItems.forEach(p => p.classList.remove('active'));
             
             // Agregar clase active al producto clickeado
             product.classList.add('active');
             
             // Cargar datos del producto en el panel de edición
             const productType = product.getAttribute('data-product');
             loadProductForEditing(productType);
         });
     });
     
     // Contador de caracteres para la descripción
     const descriptionTextarea = document.querySelector('#product-description');
     if (descriptionTextarea) {
         descriptionTextarea.addEventListener('input', updateCharCounter);
     }
     
     // Botón de precio +
     const pricePlusBtn = document.querySelector('.price-plus');
     if (pricePlusBtn) {
         pricePlusBtn.addEventListener('click', incrementPrice);
     }
    
    // Formularios
    configurarFormularios();
    
         // Botones de acción
     configurarBotonesAccion();
     
     // Filtros del menú
     configurarFiltrosMenu();

        // =====================================================
        // FUNCIONALIDAD DE CAJAS
        // =====================================================
        
        // Tabs de cajas
        const cajaTabs = document.querySelectorAll('.caja-tab');
        const cajaPanels = document.querySelectorAll('.caja-panel');
        
        cajaTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetCaja = tab.getAttribute('data-caja');
                
                // Remover clase active de todos los tabs
                cajaTabs.forEach(t => t.classList.remove('active'));
                
                // Agregar clase active al tab clickeado
                tab.classList.add('active');
                
                // Mostrar el panel correspondiente
                cajaPanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.getAttribute('data-caja') === targetCaja) {
                        panel.classList.add('active');
                    }
                });
            });
        });
        
        // Botones de acción de cajas
        const nuevaCajaBtn = document.querySelector('.cajas-actions .btn-primary');
        if (nuevaCajaBtn) {
            nuevaCajaBtn.addEventListener('click', () => {
                showNotification('Función de nueva caja en desarrollo', 'info');
            });
        }
        
        const eliminarCajaBtn = document.querySelector('.cajas-actions .btn-danger');
        if (eliminarCajaBtn) {
            eliminarCajaBtn.addEventListener('click', () => {
                showNotification('Función de eliminar caja en desarrollo', 'info');
            });
        }
        
        const editarCajaBtn = document.querySelector('.cajas-actions .btn-secondary');
        if (editarCajaBtn) {
            editarCajaBtn.addEventListener('click', () => {
                showNotification('Función de editar caja en desarrollo', 'info');
            });
        }
        
        // Botones de cerrar arqueo
        const cerrarArqueoBtns = document.querySelectorAll('.btn-danger.btn-full');
        cerrarArqueoBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres cerrar este arqueo?')) {
                    showNotification('Arqueo cerrado exitosamente', 'success');
                    // Aquí se implementaría la lógica real de cierre de arqueo
                }
            });
        });
        
        // Botones de nuevo movimiento
        const nuevoMovimientoBtns = document.querySelectorAll('.movimientos-card .btn-primary');
        nuevoMovimientoBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                showNotification('Función de nuevo movimiento en desarrollo', 'info');
            });
        });
        
        // =====================================================
        // FUNCIONALIDAD DE REPORTES
        // =====================================================
        
        // Tabs de reportes
        const reporteTabs = document.querySelectorAll('.reporte-tab');
        const reportePanels = document.querySelectorAll('.reporte-panel');
        
        reporteTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetReporte = tab.getAttribute('data-reporte');
                
                // Remover clase active de todos los tabs
                reporteTabs.forEach(t => t.classList.remove('active'));
                
                // Agregar clase active al tab clickeado
                tab.classList.add('active');
                
                // Mostrar el panel correspondiente
                reportePanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.getAttribute('data-reporte') === targetReporte) {
                        panel.classList.add('active');
                    }
                });
            });
        });
        
        // Botón exportar reporte
        const exportarReporteBtn = document.querySelector('.delivery-report .btn-secondary');
        if (exportarReporteBtn) {
            exportarReporteBtn.addEventListener('click', () => {
                showNotification('Exportando reporte de delivery...', 'info');
                // Aquí se implementaría la lógica real de exportación
            });
        }
        
        // Filtros de reportes
        const filterSelects = document.querySelectorAll('.reportes-filters select');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                // Simular actualización de reportes
                showNotification('Filtros aplicados, actualizando reportes...', 'info');
            });
        });
        
        const filterCheckbox = document.querySelector('.reportes-filters input[type="checkbox"]');
        if (filterCheckbox) {
            filterCheckbox.addEventListener('change', () => {
                showNotification('Filtro de pedidos programados actualizado', 'info');
            });
        }
        
        // =====================================================
        // FUNCIONALIDAD DE DESCUENTOS
        // =====================================================
        
        // Botones de crear descuento
        const crearDescuentoBtns = document.querySelectorAll('.descuento-card .btn-primary');
        crearDescuentoBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cardTitle = btn.closest('.descuento-card').querySelector('h3').textContent;
                showNotification(`Función de crear ${cardTitle.toLowerCase()} en desarrollo`, 'info');
            });
        });
        
        // Toggle switches de descuentos
        const toggleSwitches = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
        toggleSwitches.forEach(toggle => {
            toggle.addEventListener('change', () => {
                const isActive = toggle.checked;
                const toggleSlider = toggle.nextElementSibling;
                
                if (isActive) {
                    toggleSlider.classList.add('active');
                    showNotification('Descuento activado', 'success');
                } else {
                    toggleSlider.classList.remove('active');
                    showNotification('Descuento desactivado', 'warning');
                }
            });
        });
        
        // Menús de acciones (tres puntos)
        const actionMenus = document.querySelectorAll('.material-symbols-rounded');
        actionMenus.forEach(menu => {
            if (menu.textContent === 'more_vert') {
                menu.addEventListener('click', () => {
                    showNotification('Menú de acciones en desarrollo', 'info');
                });
            }
        });
        
        // =====================================================
        // FUNCIONES AUXILIARES
        // =====================================================
        
        function showNotification(message, type = 'info') {
            // Crear elemento de notificación
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            `;
            
            // Agregar estilos
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : type === 'error' ? '#dc3545' : '#17a2b8'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 1rem;
                min-width: 300px;
                animation: slideIn 0.3s ease;
            `;
            
            // Agregar al DOM
            document.body.appendChild(notification);
            
            // Botón de cerrar
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
            
            // Auto-remover después de 5 segundos
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }
        
        // Agregar estilos CSS para las notificaciones
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    margin: 0;
                    line-height: 1;
                }
                
                .notification-close:hover {
                    opacity: 0.8;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Formularios
}

function configurarFormularios() {
    // Formulario de restaurante
    const formRestaurante = document.querySelector('#restaurante .config-form');
    if (formRestaurante) {
        formRestaurante.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarConfiguracionRestaurante();
        });
    }
    
    // Formulario de categorías
    const formCategorias = document.querySelector('#menu .config-form');
    if (formCategorias) {
        formCategorias.addEventListener('submit', async (e) => {
            e.preventDefault();
            await crearCategoria();
        });
    }
}

function configurarBotonesAccion() {
    // Botones de editar categoría
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.edit-categoria')) {
            const categoriaId = e.target.closest('.edit-categoria').getAttribute('data-id');
            await editarCategoria(categoriaId);
        }
        
        if (e.target.closest('.delete-categoria')) {
            const categoriaId = e.target.closest('.delete-categoria').getAttribute('data-id');
            await eliminarCategoria(categoriaId);
        }
        
        if (e.target.closest('.toggle-categoria')) {
            const categoriaId = e.target.closest('.toggle-categoria').getAttribute('data-id');
            await toggleCategoria(categoriaId);
        }
        
        if (e.target.closest('.edit-producto')) {
            const productoId = e.target.closest('.edit-producto').getAttribute('data-id');
            await editarProducto(productoId);
        }
        
        if (e.target.closest('.delete-producto')) {
            const productoId = e.target.closest('.delete-producto').getAttribute('data-id');
            await eliminarProducto(productoId);
        }
        
        if (e.target.closest('.toggle-producto')) {
            const productoId = e.target.closest('.toggle-producto').getAttribute('data-id');
            await toggleProducto(productoId);
        }
        
        if (e.target.closest('.toggle-destacado')) {
            const productoId = e.target.closest('.toggle-destacado').getAttribute('data-id');
            await toggleDestacado(productoId);
        }
        
        if (e.target.closest('.update-estado')) {
            const pedidoId = e.target.closest('.update-estado').getAttribute('data-id');
            await actualizarEstadoPedido(pedidoId);
        }
    });
}

function configurarFiltrosMenu() {
    // Filtros de productos
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filtrarProductos);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filtrarProductos);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', filtrarProductos);
    }
    
    // Filtros de pedidos
    const orderStatusFilter = document.getElementById('order-status-filter');
    const deliveryTypeFilter = document.getElementById('delivery-type-filter');
    const orderDateFilter = document.getElementById('order-date-filter');
    
    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', filtrarPedidos);
    }
    if (deliveryTypeFilter) {
        deliveryTypeFilter.addEventListener('change', filtrarPedidos);
    }
    if (orderDateFilter) {
        orderDateFilter.addEventListener('change', filtrarPedidos);
    }
    
    // Botones de agregar
    const addCategoryBtn = document.getElementById('add-category-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', mostrarModalCategoria);
    }
    if (addProductBtn) {
        addProductBtn.addEventListener('click', mostrarModalProducto);
    }
}

// =====================================================
// FUNCIONES DE GESTIÓN DE DATOS
// =====================================================

async function guardarConfiguracionRestaurante() {
    try {
        const formData = new FormData(document.querySelector('#restaurante .config-form'));
        const updates = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            horario_apertura: formData.get('horario_apertura'),
            horario_cierre: formData.get('horario_cierre')
        };
        
        await PedisyAPI.restaurantes.updateRestaurante(currentRestaurante.id, updates);
        showNotification('Configuración del restaurante actualizada correctamente', 'success');
        
        // Recargar datos
        await cargarDatosRestaurante();
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        showNotification('Error al guardar la configuración', 'error');
    }
}

async function crearCategoria() {
    try {
        const formData = new FormData(document.querySelector('#menu .config-form'));
        const nuevaCategoria = {
            restaurante_id: currentRestaurante.id,
            nombre: formData.get('nombre_categoria'),
            descripcion: formData.get('descripcion_categoria'),
            orden: categorias.length + 1
        };
        
        await PedisyAPI.categorias.createCategoria(nuevaCategoria);
        showNotification('Categoría creada correctamente', 'success');
        
        // Recargar categorías
        await cargarCategorias();
        
        // Limpiar formulario
        document.querySelector('#menu .config-form').reset();
    } catch (error) {
        console.error('Error al crear categoría:', error);
        showNotification('Error al crear la categoría', 'error');
    }
}

async function editarCategoria(categoriaId) {
    const categoria = categorias.find(c => c.id === categoriaId);
    if (!categoria) return;
    
    mostrarModalCategoria(categoria);
}

async function eliminarCategoria(categoriaId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return;
    
    try {
        await PedisyAPI.categorias.deleteCategoria(categoriaId);
        showNotification('Categoría eliminada correctamente', 'success');
        
        // Recargar categorías
        await cargarCategorias();
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        showNotification('Error al eliminar la categoría', 'error');
    }
}

async function editarProducto(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;
    
    mostrarModalProducto(producto);
}

async function eliminarProducto(productoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
        await PedisyAPI.productos.deleteProducto(productoId);
        showNotification('Producto eliminado correctamente', 'success');
        
        // Recargar productos
        await cargarProductos();
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showNotification('Error al eliminar el producto', 'error');
    }
}

async function actualizarEstadoPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    
    const estados = ['pendiente', 'confirmado', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'cancelado'];
    const nuevoEstado = prompt(`Selecciona el nuevo estado:\n${estados.join('\n')}`, pedido.estado);
    
    if (!nuevoEstado || !estados.includes(nuevoEstado)) return;
    
    try {
        await PedisyAPI.pedidos.updateEstadoPedido(pedidoId, nuevoEstado);
        showNotification('Estado del pedido actualizado correctamente', 'success');
        
        // Recargar pedidos
        await cargarPedidos();
        actualizarDashboard();
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        showNotification('Error al actualizar el estado del pedido', 'error');
    }
}

async function toggleCategoria(categoriaId) {
    const categoria = categorias.find(c => c.id === categoriaId);
    if (!categoria) return;
    
    try {
        const nuevoEstado = !categoria.activo;
        await PedisyAPI.categorias.updateCategoria(categoriaId, { activo: nuevoEstado });
        showNotification(`Categoría ${nuevoEstado ? 'activada' : 'desactivada'} correctamente`, 'success');
        
        // Recargar categorías
        await cargarCategorias();
    } catch (error) {
        console.error('Error al cambiar estado de categoría:', error);
        showNotification('Error al cambiar el estado de la categoría', 'error');
    }
}

async function toggleProducto(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;
    
    try {
        const nuevoEstado = !producto.disponible;
        await PedisyAPI.productos.updateProducto(productoId, { disponible: nuevoEstado });
        showNotification(`Producto ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`, 'success');
        
        // Recargar productos
        await cargarProductos();
    } catch (error) {
        console.error('Error al cambiar estado de producto:', error);
        showNotification('Error al cambiar el estado del producto', 'error');
    }
}

async function toggleDestacado(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;
    
    try {
        const nuevoEstado = !producto.destacado;
        await PedisyAPI.productos.updateProducto(productoId, { destacado: nuevoEstado });
        showNotification(`Producto ${nuevoEstado ? 'marcado como' : 'quitado de'} destacado correctamente`, 'success');
        
        // Recargar productos
        await cargarProductos();
    } catch (error) {
        console.error('Error al cambiar estado destacado:', error);
        showNotification('Error al cambiar el estado destacado del producto', 'error');
    }
}

function filtrarPedidos() {
    const statusFilter = document.getElementById('order-status-filter').value;
    const deliveryTypeFilter = document.getElementById('delivery-type-filter').value;
    const dateFilter = document.getElementById('order-date-filter').value;
    
    let pedidosFiltrados = [...pedidos];
    
    // Filtro por estado
    if (statusFilter) {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.estado === statusFilter);
    }
    
    // Filtro por tipo de entrega
    if (deliveryTypeFilter) {
        pedidosFiltrados = pedidosFiltrados.filter(p => p.tipo_entrega === deliveryTypeFilter);
    }
    
    // Filtro por fecha
    if (dateFilter) {
        const fechaFiltro = new Date(dateFilter);
        pedidosFiltrados = pedidosFiltrados.filter(p => {
            const fechaPedido = new Date(p.created_at);
            return fechaPedido.toDateString() === fechaFiltro.toDateString();
        });
    }
    
    // Actualizar la lista con pedidos filtrados
    actualizarListaPedidosFiltrados(pedidosFiltrados);
}

function actualizarListaPedidosFiltrados(pedidosFiltrados) {
    const pedidosContainer = document.querySelector('#orders-list');
    if (!pedidosContainer) return;
    
    if (pedidosFiltrados.length === 0) {
        pedidosContainer.innerHTML = `
            <div class="no-orders">
                <span class="material-symbols-rounded">search_off</span>
                <p>No se encontraron pedidos con los filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    // Usar la función existente pero con los pedidos filtrados
    const pedidosOriginales = [...pedidos];
    pedidos = pedidosFiltrados;
    actualizarListaPedidos();
    pedidos = pedidosOriginales;
}

// =====================================================
// FUNCIONES DE VALIDACIÓN
// =====================================================

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldName = field.previousElementSibling.textContent;
    
    clearFieldError(e);
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, `${fieldName} es requerido`);
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Email inválido');
        return false;
    }
    
    if (field.type === 'tel' && value && !isValidPhone(value)) {
        showFieldError(field, 'Teléfono inválido');
        return false;
    }
    
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
    field.classList.add('error');
}

function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    field.classList.remove('error');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    return phoneRegex.test(phone);
}

// =====================================================
// FUNCIONES DE RESPONSIVE
// =====================================================

function handleResize() {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 768) {
        sidebar.classList.add('collapsed');
    }
}

// Event listeners para responsive
window.addEventListener('resize', handleResize);
window.addEventListener('load', handleResize);

// =====================================================
// FUNCIONES DE TOOLTIP
// =====================================================

function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltipText = e.target.getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltipText;
    
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    
    e.target.tooltip = tooltip;
}

function hideTooltip(e) {
    if (e.target.tooltip) {
        e.target.tooltip.remove();
        e.target.tooltip = null;
    }
}

// Inicializar tooltips cuando se carga la página
document.addEventListener('DOMContentLoaded', initTooltips);

// =====================================================
// FUNCIONES DEL MENÚ
// =====================================================

function filterProductsByCategory(categoryType) {
    // Simular filtrado de productos por categoría
    console.log(`Filtrando productos por categoría: ${categoryType}`);
    
    // En una implementación real, aquí se filtrarían los productos
    // desde la base de datos según la categoría seleccionada
}

function loadProductForEditing(productType) {
    // Simular carga de datos del producto para edición
    console.log(`Cargando producto para edición: ${productType}`);
    
    // En una implementación real, aquí se cargarían los datos del producto
    // desde la base de datos y se actualizarían los campos del formulario
}

function updateCharCounter() {
    const textarea = document.querySelector('#product-description');
    const counter = document.querySelector('.char-counter');
    
    if (textarea && counter) {
        const currentLength = textarea.value.length;
        const maxLength = 255;
        counter.textContent = `${currentLength} / ${maxLength}`;
        
        // Cambiar color si se excede el límite
        if (currentLength > maxLength) {
            counter.style.color = '#dc3545';
        } else {
            counter.style.color = '#6c757d';
        }
    }
}

function incrementPrice() {
    const priceInput = document.querySelector('#product-sale-price');
    if (priceInput) {
        // Extraer el valor numérico del precio
        let currentPrice = priceInput.value.replace(/[^\d]/g, '');
        currentPrice = parseInt(currentPrice) || 0;
        
        // Incrementar en 1000 (simulando incremento de $1000)
        const newPrice = currentPrice + 1000;
        
        // Formatear el precio
        priceInput.value = `$ ${newPrice.toLocaleString()}`;
    }
}

// =====================================================
// FUNCIONES DE MODALES
// =====================================================

function mostrarModalCategoria(categoria = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${categoria ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <button class="close-modal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form class="modal-form" id="categoria-form">
                <div class="form-group">
                    <label for="categoria-nombre">Nombre de la categoría *</label>
                    <input type="text" id="categoria-nombre" name="nombre" value="${categoria?.nombre || ''}" required>
                </div>
                <div class="form-group">
                    <label for="categoria-descripcion">Descripción</label>
                    <textarea id="categoria-descripcion" name="descripcion" rows="3">${categoria?.descripcion || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="categoria-orden">Orden</label>
                        <input type="number" id="categoria-orden" name="orden" value="${categoria?.orden || categorias.length + 1}" min="1">
                    </div>
                    <div class="form-group">
                        <label class="checkbox">
                            <input type="checkbox" id="categoria-activo" name="activo" ${categoria?.activo !== false ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Categoría activa
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary cancel-modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">${categoria ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-modal').addEventListener('click', () => modal.remove());
    
    modal.querySelector('#categoria-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarCategoria(categoria?.id, modal);
    });
}

function mostrarModalProducto(producto = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>${producto ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button class="close-modal">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <form class="modal-form" id="producto-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="producto-nombre">Nombre del producto *</label>
                        <input type="text" id="producto-nombre" name="nombre" value="${producto?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="producto-categoria">Categoría *</label>
                        <select id="producto-categoria" name="categoria_id" required>
                            <option value="">Selecciona una categoría</option>
                            ${categorias.filter(c => c.activo).map(c => 
                                `<option value="${c.id}" ${producto?.categoria_id === c.id ? 'selected' : ''}>${c.nombre}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="producto-descripcion">Descripción</label>
                    <textarea id="producto-descripcion" name="descripcion" rows="3">${producto?.descripcion || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="producto-precio">Precio *</label>
                        <input type="number" id="producto-precio" name="precio" value="${producto?.precio || ''}" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="producto-orden">Orden</label>
                        <input type="number" id="producto-orden" name="orden" value="${producto?.orden || productos.length + 1}" min="1">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="producto-imagen">URL de imagen</label>
                        <input type="url" id="producto-imagen" name="imagen_url" value="${producto?.imagen_url || ''}" placeholder="https://ejemplo.com/imagen.jpg">
                    </div>
                    <div class="form-group">
                        <label for="producto-stock">Stock disponible</label>
                        <input type="number" id="producto-stock" name="stock" value="${producto?.stock || 0}" min="0">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="checkbox">
                            <input type="checkbox" id="producto-disponible" name="disponible" ${producto?.disponible !== false ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Producto disponible
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox">
                            <input type="checkbox" id="producto-destacado" name="destacado" ${producto?.destacado ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Producto destacado
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox">
                            <input type="checkbox" id="producto-nuevo" name="nuevo" ${producto?.nuevo ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            Producto nuevo
                        </label>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary cancel-modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">${producto ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-modal').addEventListener('click', () => modal.remove());
    
    modal.querySelector('#producto-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarProducto(producto?.id, modal);
    });
}

async function guardarCategoria(categoriaId, modal) {
    try {
        const formData = new FormData(modal.querySelector('#categoria-form'));
        const categoriaData = {
            restaurante_id: currentRestaurante.id,
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            orden: parseInt(formData.get('orden')),
            activo: formData.get('activo') === 'on'
        };
        
        if (categoriaId) {
            await PedisyAPI.categorias.updateCategoria(categoriaId, categoriaData);
            showNotification('Categoría actualizada correctamente', 'success');
        } else {
            await PedisyAPI.categorias.createCategoria(categoriaData);
            showNotification('Categoría creada correctamente', 'success');
        }
        
        // Recargar categorías y cerrar modal
        await cargarCategorias();
        modal.remove();
        
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        showNotification('Error al guardar la categoría', 'error');
    }
}

async function guardarProducto(productoId, modal) {
    try {
        const formData = new FormData(modal.querySelector('#producto-form'));
        const productoData = {
            restaurante_id: currentRestaurante.id,
            categoria_id: formData.get('categoria_id'),
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            precio: parseFloat(formData.get('precio')),
            orden: parseInt(formData.get('orden')),
            imagen_url: formData.get('imagen_url'),
            stock: parseInt(formData.get('stock')),
            disponible: formData.get('disponible') === 'on',
            destacado: formData.get('destacado') === 'on',
            nuevo: formData.get('nuevo') === 'on'
        };
        
        if (productoId) {
            await PedisyAPI.productos.updateProducto(productoId, productoData);
            showNotification('Producto actualizado correctamente', 'success');
        } else {
            await PedisyAPI.productos.createProducto(productoData);
            showNotification('Producto creado correctamente', 'success');
        }
        
        // Recargar productos y cerrar modal
        await cargarProductos();
        modal.remove();
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        showNotification('Error al guardar el producto', 'error');
    }
}

// ===== FUNCIONES PARA GESTIÓN DE PRODUCTOS MEJORADAS =====

// Variables globales para el formulario de productos
let productoActual = null;
let categoriaActual = null;

// Función para crear un nuevo producto
function crearNuevoProducto() {
    productoActual = null;
    const title = document.getElementById('edit-panel-title');
    if (title) title.textContent = 'Crear producto';
    limpiarFormularioProducto();
}

// Función para editar un producto existente
function editarProducto(producto) {
    productoActual = producto;
    const title = document.getElementById('edit-panel-title');
    if (title) title.textContent = 'Editar producto';
    llenarFormularioProducto(producto);
}

// Función para cerrar el formulario de producto
function cerrarFormularioProducto() {
    productoActual = null;
    limpiarFormularioProducto();
}

// Función para limpiar el formulario
function limpiarFormularioProducto() {
    const form = document.getElementById('product-form');
    if (form) {
        form.reset();
        const counter = document.getElementById('description-counter');
        if (counter) counter.textContent = '0';
        const preview = document.getElementById('image-preview');
        if (preview) preview.style.display = 'none';
        const margin = document.getElementById('product-profit-margin');
        if (margin) margin.value = '';
    }
}

// Función para llenar el formulario con datos de un producto
function llenarFormularioProducto(producto) {
    if (!producto) return;
    
    const setValueIfExists = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.value = value || '';
    };
    
    const setCheckedIfExists = (id, checked) => {
        const element = document.getElementById(id);
        if (element) element.checked = checked;
    };
    
    setValueIfExists('product-category', producto.categoria_id);
    setValueIfExists('product-name', producto.nombre);
    setValueIfExists('product-internal-name', producto.nombre_interno);
    setValueIfExists('product-description', producto.descripcion);
    setValueIfExists('product-sale-price', producto.precio);
    setValueIfExists('product-cost-price', producto.precio_costo);
    setValueIfExists('product-image', producto.imagen_url);
    setValueIfExists('product-order', producto.orden);
    setCheckedIfExists('product-available', producto.disponible !== false);
    setCheckedIfExists('product-featured', producto.destacado || false);
    setValueIfExists('product-preparation-time', producto.tiempo_preparacion);
    setValueIfExists('product-calories', producto.calorias);
    setValueIfExists('product-allergens', producto.alergenos);
    setValueIfExists('product-tags', producto.etiquetas);
    
    actualizarContadorCaracteres();
    actualizarMargenGanancia();
    
    if (producto.imagen_url) {
        mostrarVistaPrevia(producto.imagen_url);
    }
}

// Función para actualizar el contador de caracteres de la descripción
function actualizarContadorCaracteres() {
    const descripcion = document.getElementById('product-description');
    const contador = document.getElementById('description-counter');
    if (descripcion && contador) {
        contador.textContent = descripcion.value.length;
    }
}

// Función para calcular y mostrar el margen de ganancia
function actualizarMargenGanancia() {
    const precioVentaEl = document.getElementById('product-sale-price');
    const precioCostoEl = document.getElementById('product-cost-price');
    const margenElement = document.getElementById('product-profit-margin');
    
    if (!precioVentaEl || !precioCostoEl || !margenElement) return;
    
    const precioVenta = parseFloat(precioVentaEl.value) || 0;
    const precioCosto = parseFloat(precioCostoEl.value) || 0;
    
    if (precioVenta > 0 && precioCosto > 0) {
        const margen = ((precioVenta - precioCosto) / precioVenta * 100).toFixed(2);
        margenElement.value = margen;
    } else {
        margenElement.value = '';
    }
}

// Función para mostrar vista previa de imagen
function mostrarVistaPrevia(url) {
    const preview = document.getElementById('image-preview');
    const img = document.getElementById('preview-img');
    
    if (preview && img && url && url.trim()) {
        img.src = url;
        preview.style.display = 'block';
        
        img.onerror = function() {
            preview.style.display = 'none';
            showNotification('No se pudo cargar la imagen', 'error');
        };
    } else if (preview) {
        preview.style.display = 'none';
    }
}

// Función para subir imagen (placeholder)
function subirImagen() {
    showNotification('Funcionalidad de subida de imágenes en desarrollo', 'info');
    // Aquí se implementaría la lógica para subir archivos
}

// Función para previsualizar producto
function previsualizarProducto() {
    const form = document.getElementById('product-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const producto = Object.fromEntries(formData.entries());
    
    showNotification('Vista previa del producto', 'info');
    console.log('Vista previa:', producto);
}

// Función para cancelar edición
function cancelarEdicion() {
    if (confirm('¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.')) {
        cerrarFormularioProducto();
    }
}

// Función para cargar categorías en el select
async function cargarCategoriasEnSelect() {
    try {
        const categorias = await categoriasAPI.getCategorias();
        const select = document.getElementById('product-category');
        
        if (select && categorias) {
            select.innerHTML = '<option value="">Seleccionar categoría</option>';
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showNotification('Error al cargar categorías', 'error');
    }
}

// Función para manejar el envío del formulario de producto
async function guardarProductoCompleto(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productoData = Object.fromEntries(formData.entries());
    
    // Convertir checkboxes a boolean
    productoData.disponible = formData.has('disponible');
    productoData.destacado = formData.has('destacado');
    
    // Convertir números
    if (productoData.precio) productoData.precio = parseFloat(productoData.precio);
    if (productoData.precio_costo) productoData.precio_costo = parseFloat(productoData.precio_costo);
    if (productoData.orden) productoData.orden = parseInt(productoData.orden);
    if (productoData.tiempo_preparacion) productoData.tiempo_preparacion = parseInt(productoData.tiempo_preparacion);
    if (productoData.calorias) productoData.calorias = parseInt(productoData.calorias);
    
    try {
        let resultado;
        if (productoActual) {
            // Actualizar producto existente
            resultado = await productosAPI.updateProducto(productoActual.id, productoData);
            showNotification('Producto actualizado correctamente', 'success');
        } else {
            // Crear nuevo producto
            resultado = await productosAPI.createProducto(productoData);
            showNotification('Producto creado correctamente', 'success');
        }
        
        // Recargar la lista de productos
        await cargarProductos();
        cerrarFormularioProducto();
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        showNotification('Error al guardar el producto', 'error');
    }
}

// Configurar event listeners adicionales cuando el DOM esté listo
function configurarEventListenersProductos() {
    // Contador de caracteres en descripción
    const descripcionTextarea = document.getElementById('product-description');
    if (descripcionTextarea) {
        descripcionTextarea.addEventListener('input', actualizarContadorCaracteres);
    }
    
    // Cálculo automático del margen
    const precioVentaInput = document.getElementById('product-sale-price');
    const precioCostoInput = document.getElementById('product-cost-price');
    if (precioVentaInput) {
        precioVentaInput.addEventListener('input', actualizarMargenGanancia);
    }
    if (precioCostoInput) {
        precioCostoInput.addEventListener('input', actualizarMargenGanancia);
    }
    
    // Vista previa de imagen
    const imagenInput = document.getElementById('product-image');
    if (imagenInput) {
        imagenInput.addEventListener('input', function() {
            mostrarVistaPrevia(this.value);
        });
    }
    
    // Formulario de producto mejorado
    const productForm = document.getElementById('product-form');
    if (productForm) {
        // Remover listener anterior si existe
        const existingHandler = productForm.getAttribute('data-handler-attached');
        if (!existingHandler) {
            productForm.addEventListener('submit', guardarProductoCompleto);
            productForm.setAttribute('data-handler-attached', 'true');
        }
    }
    
    // Cargar categorías
    cargarCategoriasEnSelect();
}

// ===== CONFIGURACIÓN MENÚ ESTILO PEDISY =====

function configurarMenuPedisy() {
    // Event listeners para tabs de delivery
    const deliveryTabs = document.querySelectorAll('.delivery-tab');
    deliveryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover active de todos los tabs
            deliveryTabs.forEach(t => t.classList.remove('active'));
            // Agregar active al tab clickeado
            this.classList.add('active');
            
            // Aquí se podría filtrar productos por delivery/takeaway
            const deliveryType = this.dataset.delivery;
            console.log('Cambiado a:', deliveryType);
        });
    });
    
    // Event listeners para categorías
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover selected de todas las categorías
            categoryItems.forEach(c => c.classList.remove('selected'));
            // Agregar selected a la categoría clickeada
            this.classList.add('selected');
            
            // Filtrar productos por categoría
            const categoryName = this.textContent.trim();
            filtrarProductosPorCategoria(categoryName);
        });
    });
    
    // Event listeners para productos
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover selected de todos los productos
            productItems.forEach(p => p.classList.remove('selected'));
            // Agregar selected al producto clickeado
            this.classList.add('selected');
            
            // Cargar datos del producto en el formulario
            const productName = this.textContent.trim();
            cargarProductoEnFormulario(productName);
        });
    });
    
    // Event listener para el formulario
    const editForm = document.getElementById('edit-product-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarProductoPedisy();
        });
    }
    
    // Event listener para el contador de caracteres
    const textarea = document.getElementById('product-description-textarea');
    if (textarea) {
        textarea.addEventListener('input', function() {
            const charCount = this.value.length;
            const counter = document.querySelector('.char-count');
            if (counter) {
                counter.textContent = `${charCount} / 255`;
            }
        });
    }
    
    // Event listener para el botón +
    const plusBtn = document.querySelector('.price-plus-btn');
    if (plusBtn) {
        plusBtn.addEventListener('click', function() {
            // Funcionalidad del botón + (incrementar precio, abrir calculadora, etc.)
            showNotification('Calculadora de precios', 'info');
        });
    }
    
    // Cargar categorías desde la base de datos
    cargarCategoriasDesdeDB();
}

function filtrarProductosPorCategoria(categoria) {
    // Aquí se filtrarían los productos por la categoría seleccionada
    console.log('Filtrando productos por categoría:', categoria);
    
    // Simular carga de productos para la categoría
    const productos = {
        'PROMOS': [
            '2 Muzzas e/napo',
            '2 Muzzas e/romanas', 
            'Promo estilos',
            'Muzza + 6 empanadas',
            '3 muzzas e/napo',
            '3 muzzas e/romana'
        ],
        'PIZZA ESTILO NAPOLETANO': [
            'Margarita Napoletana',
            'Quattro Stagioni',
            'Diavola',
            'Capricciosa'
        ],
        'PIZZA ESTILO ROMANA': [
            'Margherita Romana',
            'Quattro Formaggi',
            'Prosciutto e Funghi',
            'Marinara'
        ],
        'EMPANADAS': [
            'Empanada de Carne',
            'Empanada de Pollo',
            'Empanada de Jamón y Queso',
            'Empanada de Verdura'
        ],
        'BEBIDAS': [
            'Coca Cola',
            'Agua Mineral',
            'Cerveza Artesanal',
            'Jugo Natural'
        ]
    };
    
    const container = document.getElementById('products-container');
    if (container && productos[categoria]) {
        container.innerHTML = '';
        productos[categoria].forEach((producto, index) => {
            const item = document.createElement('div');
            item.className = 'product-item' + (index === 0 ? ' selected' : '');
            item.textContent = producto;
            item.addEventListener('click', function() {
                document.querySelectorAll('.product-item').forEach(p => p.classList.remove('selected'));
                this.classList.add('selected');
                cargarProductoEnFormulario(producto);
            });
            container.appendChild(item);
        });
    }
}

function cargarProductoEnFormulario(nombreProducto) {
    // Simular carga de datos del producto
    console.log('Cargando producto:', nombreProducto);
    
    // Datos de ejemplo
    const productData = {
        categoria: 'PROMOS',
        nombre: nombreProducto,
        nombreInterno: nombreProducto.replace(/\s+/g, '_').toLowerCase(),
        descripcion: '2 Pizzas artesanales de 6 porciones, mozzarella gratinada, salsa de tomate natural, aceitunas verdes, aceite macerado con ajo y especias.',
        precioVenta: '$ 19.000',
        precioCosto: '$ 14.000'
    };
    
    // Llenar el formulario
    const categorySelect = document.getElementById('product-category-select');
    const nameInput = document.getElementById('product-name-input');
    const internalNameInput = document.getElementById('product-internal-name-input');
    const descriptionTextarea = document.getElementById('product-description-textarea');
    const salePriceInput = document.getElementById('product-sale-price-input');
    const costPriceInput = document.getElementById('product-cost-price-input');
    
    if (categorySelect) categorySelect.value = productData.categoria;
    if (nameInput) nameInput.value = productData.nombre;
    if (internalNameInput) internalNameInput.value = productData.nombreInterno;
    if (descriptionTextarea) {
        descriptionTextarea.value = productData.descripcion;
        // Actualizar contador
        const counter = document.querySelector('.char-count');
        if (counter) {
            counter.textContent = `${productData.descripcion.length} / 255`;
        }
    }
    if (salePriceInput) salePriceInput.value = productData.precioVenta;
    if (costPriceInput) costPriceInput.value = productData.precioCosto;
}

function guardarProductoPedisy() {
    // Recopilar datos del formulario
    const formData = {
        categoria: document.getElementById('product-category-select')?.value,
        nombre: document.getElementById('product-name-input')?.value,
        nombreInterno: document.getElementById('product-internal-name-input')?.value,
        descripcion: document.getElementById('product-description-textarea')?.value,
        precioVenta: document.getElementById('product-sale-price-input')?.value,
        precioCosto: document.getElementById('product-cost-price-input')?.value,
        disponibilidad: document.getElementById('product-availability')?.value,
        maxSeleccion: document.getElementById('product-max-selection')?.value
    };
    
    console.log('Guardando producto:', formData);
    showNotification('Producto actualizado correctamente', 'success');
    
    // Aquí se enviarían los datos a Supabase
    // await productosAPI.updateProducto(productId, formData);
}

// ===== FUNCIONES PARA MODAL CREAR CATEGORÍA =====

function abrirModalCrearCategoria() {
    const modal = document.getElementById('modal-crear-categoria');
    if (modal) {
        modal.style.display = 'flex';
        // Limpiar formulario
        limpiarFormularioCategoria();
        // Focus en el primer campo
        setTimeout(() => {
            const nombreInput = document.getElementById('categoria-nombre');
            if (nombreInput) nombreInput.focus();
        }, 100);
    }
}

function cerrarModalCrearCategoria() {
    const modal = document.getElementById('modal-crear-categoria');
    if (modal) {
        modal.style.display = 'none';
        limpiarFormularioCategoria();
    }
}

function limpiarFormularioCategoria() {
    const form = document.getElementById('form-crear-categoria');
    if (form) {
        form.reset();
        
        // Limpiar archivo seleccionado
        window.archivoImagenSeleccionado = null;
        
        // Resetear toggle a activo
        const toggleActivo = document.getElementById('categoria-activa');
        if (toggleActivo) toggleActivo.checked = true;
        
        // Resetear radio button a "siempre disponible"
        const radioSiempre = document.querySelector('input[name="disponibilidad-tipo"][value="siempre"]');
        if (radioSiempre) radioSiempre.checked = true;
        
        // Limpiar área de imagen
        const uploadArea = document.getElementById('categoria-image-upload');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="upload-placeholder">
                    <span class="material-symbols-rounded">image</span>
                    <p>Selecciona o arrastra imagen</p>
                    <p class="upload-size">Tamaño máximo: 10 MB</p>
                </div>
                <input type="file" id="categoria-imagen" accept="image/*" style="display: none;">
            `;
            configurarUploadImagen();
        }
    }
}

function configurarUploadImagen() {
    const uploadArea = document.getElementById('categoria-image-upload');
    const fileInput = document.getElementById('categoria-imagen');
    
    if (uploadArea && fileInput) {
        // Verificar si ya está configurado para evitar duplicados
        if (uploadArea.dataset.configured === 'true') {
            return;
        }
        
        // Marcar como configurado
        uploadArea.dataset.configured = 'true';
        
        // Click en el área abre el selector de archivos
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Manejo de archivos seleccionados
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                manejarArchivoImagen(file);
            }
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#007bff';
            uploadArea.style.background = '#f0f8ff';
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.background = '#f8f9fa';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.background = '#f8f9fa';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    fileInput.files = files;
                    manejarArchivoImagen(file);
                } else {
                    showNotification('Por favor selecciona un archivo de imagen válido', 'error');
                }
            }
        });
    }
}

async function manejarArchivoImagen(file) {
    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
        showNotification('El archivo es demasiado grande. Máximo 10MB.', 'error');
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona un archivo de imagen válido.', 'error');
        return;
    }
    
    // Mostrar preview inmediatamente
    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadArea = document.getElementById('categoria-image-upload');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="image-preview-container">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 6px;">
                    <div class="upload-status" style="margin-top: 12px;">
                        <p style="color: #6c757d; font-size: 14px;">Imagen seleccionada: ${file.name}</p>
                        <div class="image-actions">
                            <button type="button" class="btn btn-outline" onclick="cambiarImagen()">Cambiar imagen</button>
                            <button type="button" class="btn btn-outline" onclick="eliminarImagen()">Eliminar</button>
                        </div>
                    </div>
                </div>
                <input type="file" id="categoria-imagen" accept="image/*" style="display: none;">
            `;
            configurarUploadImagen();
            
            // Almacenar el archivo para subir después
            window.archivoImagenSeleccionado = file;
        }
    };
    reader.readAsDataURL(file);
    
    showNotification('Imagen seleccionada correctamente', 'success');
}

function cambiarImagen() {
    const fileInput = document.getElementById('categoria-imagen');
    if (fileInput) {
        fileInput.click();
    }
}

function eliminarImagen() {
    // Limpiar archivo seleccionado
    window.archivoImagenSeleccionado = null;
    limpiarFormularioCategoria();
    showNotification('Imagen eliminada', 'info');
}

// Función para cargar categorías desde la base de datos
async function cargarCategoriasDesdeDB() {
    try {
        const categorias = await categoriasAPI.getCategorias();
        const container = document.querySelector('.categories-container');
        
        if (container && categorias) {
            container.innerHTML = '';
            
            categorias.forEach((categoria, index) => {
                const item = document.createElement('div');
                item.className = 'category-item' + (index === 0 ? ' selected' : '');
                item.dataset.categoriaId = categoria.id;
                
                // Crear estructura HTML con botones de acción
                item.innerHTML = `
                    <div class="category-content" onclick="seleccionarCategoria('${categoria.id}', '${categoria.nombre}', this)">
                        <span class="category-name">${categoria.nombre.toUpperCase()}</span>
                    </div>
                    <div class="category-actions">
                        <button class="btn-action edit" onclick="editarCategoria('${categoria.id}')" title="Editar categoría">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button class="btn-action delete" onclick="eliminarCategoria('${categoria.id}', '${categoria.nombre}')" title="Eliminar categoría">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                `;
                
                container.appendChild(item);
                
                // Si es la primera categoría, cargar sus productos automáticamente
                if (index === 0) {
                    filtrarProductosPorCategoria(categoria.id, categoria.nombre);
                }
            });
            
            console.log('Categorías cargadas desde DB:', categorias);
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showNotification('Error al cargar categorías', 'error');
    }
}

// Función para seleccionar una categoría y filtrar productos
function seleccionarCategoria(categoriaId, categoriaNombre, elemento) {
    // Remover selección de todas las categorías
    document.querySelectorAll('.category-item').forEach(c => c.classList.remove('selected'));
    
    // Marcar como seleccionada la categoría clickeada
    elemento.closest('.category-item').classList.add('selected');
    
    // Filtrar productos por esta categoría
    filtrarProductosPorCategoria(categoriaId, categoriaNombre);
    
    // Si no hay productos seleccionados, heredar categoría en formulario crear
    const productosSeleccionados = document.querySelectorAll('.product-item.selected');
    if (productosSeleccionados.length === 0) {
        volverAModoCrear();
    }
}

// Función para filtrar productos por categoría
async function filtrarProductosPorCategoria(categoriaId, categoriaNombre) {
    try {
        console.log('Filtrando productos por categoría:', categoriaNombre, 'ID:', categoriaId);
        
        // Obtener productos de la categoría seleccionada
        const productosCategoria = await PedisyAPI.productos.getProductosPorCategoria(categoriaId);
        
        console.log('Productos encontrados:', productosCategoria);
        
        // Actualizar el contenedor de productos
        actualizarListaProductosFiltrados(productosCategoria, categoriaNombre);
        
    } catch (error) {
        console.error('Error al filtrar productos:', error);
        showNotification('Error al cargar productos de la categoría', 'error');
    }
}

// Función para actualizar la lista de productos filtrados
function actualizarListaProductosFiltrados(productos, categoriaNombre) {
    const productsContainer = document.querySelector('#products-container');
    if (!productsContainer) return;
    
    // Limpiar contenedor
    productsContainer.innerHTML = '';
    
    if (productos.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products">
                <span class="material-symbols-rounded">restaurant</span>
                <h3>No hay productos en ${categoriaNombre}</h3>
                <p>Crea el primer producto para esta categoría</p>
                <button class="btn btn-primary" onclick="crearNuevoProducto()">
                    <span class="material-symbols-rounded">add</span>
                    Crear Producto
                </button>
            </div>
        `;
        return;
    }
    
    // Mostrar productos de la categoría
    productos.forEach(producto => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.dataset.productId = producto.id;
        
        productItem.innerHTML = `
            <div class="product-content" onclick="seleccionarProducto('${producto.id}', this)">
                <div class="product-info">
                    <h4>${producto.nombre}</h4>
                    <p class="product-price">$${producto.precio}</p>
                    <p class="product-description">${producto.descripcion || 'Sin descripción'}</p>
                </div>
                ${producto.imagen_url ? `<img src="${producto.imagen_url}" alt="${producto.nombre}" class="product-thumbnail">` : ''}
            </div>
            <div class="product-actions">
                <button class="btn-action edit" onclick="editarProducto('${producto.id}')" title="Editar producto">
                    <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="btn-action delete" onclick="eliminarProducto('${producto.id}', '${producto.nombre}')" title="Eliminar producto">
                    <span class="material-symbols-rounded">delete</span>
                </button>
                <button class="btn-action toggle ${producto.disponible ? 'active' : 'inactive'}" onclick="toggleProductoDisponible('${producto.id}', ${producto.disponible})" title="${producto.disponible ? 'Desactivar' : 'Activar'} producto">
                    <span class="material-symbols-rounded">${producto.disponible ? 'visibility' : 'visibility_off'}</span>
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productItem);
    });
}


// Función para seleccionar un producto
async function seleccionarProducto(productoId, elemento) {
    // Remover selección de todos los productos
    document.querySelectorAll('.product-item').forEach(p => p.classList.remove('selected'));
    
    // Marcar como seleccionado el producto clickeado
    elemento.closest('.product-item').classList.add('selected');
    
    console.log('Producto seleccionado:', productoId);
    
    // Cambiar panel derecho a modo edición
    await cambiarPanelAEdicion(productoId);
}

// Función para cambiar panel derecho a modo edición
async function cambiarPanelAEdicion(productoId) {
    try {
        // Obtener datos del producto
        const producto = await PedisyAPI.productos.getProductoById(productoId);
        
        if (!producto) {
            showNotification('Producto no encontrado', 'error');
            return;
        }
        
        // Cambiar título del panel
        const panelTitle = document.querySelector('.edit-column .column-header h3');
        if (panelTitle) {
            panelTitle.textContent = 'EDITAR PRODUCTO';
        }
        
        // Ocultar formulario de crear
        const createForm = document.getElementById('create-product-form');
        if (createForm) {
            createForm.style.display = 'none';
        }
        
        // Mostrar/crear formulario de editar
        mostrarFormularioEdicion(producto);
        
        // Guardar producto en modo edición global
        window.productoEnEdicion = producto;
        
    } catch (error) {
        console.error('Error al cambiar a modo edición:', error);
        showNotification('Error al cargar datos del producto', 'error');
    }
}

// Función para mostrar formulario de edición
function mostrarFormularioEdicion(producto) {
    const container = document.querySelector('.create-form-container');
    if (!container) return;
    
    // Crear formulario de edición si no existe
    let editForm = document.getElementById('edit-product-form');
    if (!editForm) {
        editForm = createEditForm();
        container.appendChild(editForm);
    }
    
    // Mostrar formulario de edición
    editForm.style.display = 'block';
    
    // Precargar datos del producto
    precargarDatosProducto(producto);
}

// Función para crear formulario de edición
function createEditForm() {
    const form = document.createElement('form');
    form.id = 'edit-product-form';
    form.className = 'edit-product-form';
    form.style.display = 'none';
    
    form.innerHTML = `
        <!-- Categoría dropdown -->
        <div class="form-field">
            <select class="form-dropdown" id="edit-product-category" required>
                <option value="">Categoría</option>
            </select>
        </div>
        
        <!-- Nombre -->
        <div class="form-field">
            <input type="text" class="form-input" placeholder="Nombre" id="edit-product-name" required>
        </div>
        
        <!-- Nombre interno -->
        <div class="form-field">
            <input type="text" class="form-input" placeholder="Nombre interno" id="edit-product-internal-name">
        </div>
        
        <!-- Descripción -->
        <div class="form-field">
            <textarea class="form-textarea" placeholder="Descripción" id="edit-product-description" maxlength="255"></textarea>
            <div class="char-count"><span id="edit-description-count">0</span> / 255</div>
        </div>
        
        <!-- Precio venta -->
        <div class="form-field price-field">
            <input type="number" class="form-input price-input" placeholder="Precio venta" id="edit-product-price" step="0.01" min="0" required>
            <span class="currency-symbol">$</span>
        </div>
        
        <!-- Precio costo -->
        <div class="form-field">
            <input type="number" class="form-input" placeholder="Precio costo" id="edit-product-cost" step="0.01" min="0">
        </div>
        
        <!-- Adicionales dropdown -->
        <div class="form-field">
            <select class="form-dropdown" id="edit-product-adicionales" multiple>
                <option disabled>Adicionales</option>
            </select>
        </div>
        
        <!-- Tags -->
        <div class="form-field">
            <input type="text" class="form-input" placeholder="Tags (separados por comas)" id="edit-product-tags">
        </div>
        
        <!-- Disponible en -->
        <div class="form-field">
            <select class="form-dropdown" id="edit-product-availability">
                <option value="both" selected>Delivery, Take Away</option>
                <option value="delivery">Solo Delivery</option>
                <option value="takeaway">Solo Take Away</option>
            </select>
        </div>
        
        <!-- Selección máxima por pedido -->
        <div class="form-field">
            <input type="number" class="form-input" placeholder="Selección máxima por pedido" id="edit-product-max-selection" min="1" value="1">
        </div>
        
        <!-- Checkboxes de configuración -->
        <div class="form-field checkbox-group">
            <label class="checkbox-label">
                <input type="checkbox" id="edit-product-visible" checked>
                <span class="checkmark"></span>
                Visible en menú
            </label>
        </div>
        
        <div class="form-field checkbox-group">
            <label class="checkbox-label">
                <input type="checkbox" id="edit-product-destacado">
                <span class="checkmark"></span>
                Producto destacado
            </label>
        </div>
        
        <div class="form-field checkbox-group">
            <label class="checkbox-label">
                <input type="checkbox" id="edit-product-disponible" checked>
                <span class="checkmark"></span>
                Producto disponible
            </label>
        </div>
        
        <div class="form-field checkbox-group">
            <label class="checkbox-label">
                <input type="checkbox" id="edit-product-sugerencia">
                <span class="checkmark"></span>
                Producto sugerencia
            </label>
        </div>
        
        <!-- Editor de imagen -->
        <div class="form-field image-editor-field">
            <label class="image-field-label">Imagen del producto</label>
            
            <!-- Vista previa cuadrada -->
            <div class="image-preview-container">
                <div class="square-preview" id="edit-square-preview">
                    <img id="edit-preview-img" src="" alt="Vista previa" style="display: none;">
                    <div class="preview-placeholder" id="edit-preview-placeholder">
                        <span class="material-symbols-rounded">image</span>
                        <p>Vista previa del menú</p>
                    </div>
                </div>
                <div class="preview-label">Así se verá en el menú</div>
            </div>
            
            <!-- Editor de imagen interactivo -->
            <div class="image-editor" id="edit-image-editor" style="display: none;">
                <div class="editor-container">
                    <div class="interactive-editor" id="edit-interactive-editor">
                        <canvas id="edit-image-canvas"></canvas>
                        <div class="crop-box" id="edit-crop-box">
                            <div class="crop-frame">
                                <!-- Handles para redimensionar -->
                                <div class="resize-handle nw" data-direction="nw"></div>
                                <div class="resize-handle ne" data-direction="ne"></div>
                                <div class="resize-handle sw" data-direction="sw"></div>
                                <div class="resize-handle se" data-direction="se"></div>
                                
                                <!-- Bordes para redimensionar -->
                                <div class="resize-handle n" data-direction="n"></div>
                                <div class="resize-handle s" data-direction="s"></div>
                                <div class="resize-handle w" data-direction="w"></div>
                                <div class="resize-handle e" data-direction="e"></div>
                                
                                <!-- Área de arrastre -->
                                <div class="drag-area"></div>
                            </div>
                        </div>
                    </div>
                    <div class="editor-info">
                        <p>📏 Arrastra para mover • 🔲 Esquinas para redimensionar</p>
                        <div class="zoom-control">
                            <button type="button" class="btn-zoom" onclick="aplicarZoomEditor(-0.1)">-</button>
                            <span id="edit-zoom-display">100%</span>
                            <button type="button" class="btn-zoom" onclick="aplicarZoomEditor(0.1)">+</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Botones de acción de imagen -->
            <div class="image-actions">
                <button type="button" class="btn btn-outline btn-upload" id="edit-upload-btn">
                    <span class="material-symbols-rounded">upload</span>
                    Subir imagen
                </button>
                <button type="button" class="btn btn-primary btn-save-image" id="edit-save-btn" style="display: none;">
                    <span class="material-symbols-rounded">save</span>
                    Guardar imagen
                </button>
                <button type="button" class="btn btn-outline btn-change" id="edit-change-btn" style="display: none;">
                    <span class="material-symbols-rounded">edit</span>
                    Cambiar imagen
                </button>
                <button type="button" class="btn btn-outline btn-remove" id="edit-remove-btn" style="display: none;">
                    <span class="material-symbols-rounded">delete</span>
                    Quitar imagen
                </button>
            </div>
            
            <!-- Input file oculto -->
            <input type="file" id="edit-product-image" accept="image/*" style="display: none;">
        </div>
        
        <!-- Botones de acción -->
        <div class="form-actions">
            <button type="button" class="btn btn-outline btn-cancel" onclick="cancelarEdicion()">Cancelar</button>
            <button type="submit" class="btn btn-primary btn-update">Actualizar Producto</button>
        </div>
    `;
    
    // Configurar eventos del formulario de edición
    configurarFormularioEdicion(form);
    
    return form;
}

// Función para precargar datos del producto
async function precargarDatosProducto(producto) {
    // Cargar categorías en dropdown de edición
    const categoriasSelect = document.getElementById('edit-product-category');
    if (categoriasSelect && categoriasSelect.children.length <= 1) {
        try {
            const categorias = await PedisyAPI.categorias.getCategorias();
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre.toUpperCase();
                categoriasSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }
    
    // Precargar todos los valores del producto
    document.getElementById('edit-product-category').value = producto.categoria_id || '';
    document.getElementById('edit-product-name').value = producto.nombre || '';
    document.getElementById('edit-product-internal-name').value = producto.nombre_interno || '';
    document.getElementById('edit-product-description').value = producto.descripcion || '';
    document.getElementById('edit-product-price').value = producto.precio || '';
    document.getElementById('edit-product-cost').value = producto.precio_costo || '';
    document.getElementById('edit-product-tags').value = producto.tags || '';
    document.getElementById('edit-product-availability').value = producto.disponibilidad || 'both';
    document.getElementById('edit-product-max-selection').value = producto.seleccion_maxima || 1;
    
    // Checkboxes
    document.getElementById('edit-product-visible').checked = producto.visible !== false; // Default true
    document.getElementById('edit-product-destacado').checked = producto.destacado || false;
    document.getElementById('edit-product-disponible').checked = producto.disponible !== false; // Default true  
    document.getElementById('edit-product-sugerencia').checked = producto.sugerencia || false;
    
    // Actualizar contador de caracteres
    const description = producto.descripcion || '';
    const counter = document.getElementById('edit-description-count');
    if (counter) {
        counter.textContent = description.length;
        
        // Aplicar color según longitud
        if (description.length > 200) {
            counter.style.color = '#dc3545';
        } else if (description.length > 150) {
            counter.style.color = '#ffc107';
        } else {
            counter.style.color = '#6c757d';
        }
    }
    
    // TODO: Cargar adicionales si existen en el futuro
    // const adicionalesSelect = document.getElementById('edit-product-adicionales');
    // if (producto.adicionales && adicionalesSelect) {
    //     // Lógica para precargar adicionales seleccionados
    // }
    
    // Mostrar imagen actual si existe en la vista previa cuadrada
    const previewImg = document.getElementById('edit-preview-img');
    const placeholder = document.getElementById('edit-preview-placeholder');
    const changeBtn = document.getElementById('edit-change-btn');
    const removeBtn = document.getElementById('edit-remove-btn');
    const uploadBtn = document.getElementById('edit-upload-btn');
    
    if (producto.imagen_url && previewImg) {
        // Cargar imagen actual en vista previa
        previewImg.src = producto.imagen_url;
        previewImg.style.display = 'block';
        
        if (placeholder) placeholder.style.display = 'none';
        if (changeBtn) changeBtn.style.display = 'inline-flex';
        if (removeBtn) removeBtn.style.display = 'inline-flex';
        if (uploadBtn) uploadBtn.style.display = 'none';
        
        console.log('Imagen actual cargada en vista previa:', producto.imagen_url);
    } else {
        if (previewImg) previewImg.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        if (changeBtn) changeBtn.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'none';
        if (uploadBtn) uploadBtn.style.display = 'inline-flex';
    }
    
    console.log('Datos del producto precargados:', producto);
}

// Función para configurar eventos del formulario de edición
function configurarFormularioEdicion(form) {
    // Contador de caracteres para descripción
    const textarea = form.querySelector('#edit-product-description');
    const counter = form.querySelector('#edit-description-count');
    
    if (textarea && counter) {
        textarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            counter.textContent = currentLength;
            
            if (currentLength > 200) {
                counter.style.color = '#dc3545';
            } else if (currentLength > 150) {
                counter.style.color = '#ffc107';
            } else {
                counter.style.color = '#6c757d';
            }
        });
    }
    
    // Configurar editor de imagen
    configurarEditorImagenEdicion(form);
    
    // Submit del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        actualizarProducto();
    });
}

// Función para configurar el editor de imagen en edición
function configurarEditorImagenEdicion(form) {
    const fileInput = form.querySelector('#edit-product-image');
    const uploadBtn = form.querySelector('#edit-upload-btn');
    const saveBtn = form.querySelector('#edit-save-btn');
    const changeBtn = form.querySelector('#edit-change-btn');
    const removeBtn = form.querySelector('#edit-remove-btn');
    
    // Botón subir imagen
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => fileInput.click());
    }
    
    // Botón guardar imagen
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            await guardarImagenProducto();
        });
    }
    
    // Botón cambiar imagen
    if (changeBtn && fileInput) {
        changeBtn.addEventListener('click', () => fileInput.click());
    }
    
    // Botón quitar imagen
    if (removeBtn) {
        removeBtn.addEventListener('click', () => quitarImagenEdicion());
    }
    
    // Cambio de archivo
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                cargarImagenEnEditorEdicion(file);
            }
        });
    }
    
    // Los controles interactivos se configuran automáticamente en inicializarEditorImagenEdicion()
}

// Función para cargar imagen en el editor de edición
function cargarImagenEnEditorEdicion(file) {
    // Validaciones
    if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen no puede superar los 5MB', 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showNotification('Solo se permiten imágenes', 'error');
        return;
    }
    
    // Guardar archivo
    window.archivoImagenEdicionSeleccionado = file;
    
    // Cargar imagen en canvas
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Guardar imagen original
            window.imagenOriginalEdicion = img;
            
            // Inicializar editor
            inicializarEditorImagenEdicion(img);
            
            // Mostrar controles
            mostrarControlesEditorEdicion();
            
            showNotification('Imagen cargada. Ajusta el recorte y zoom.', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Función para inicializar el editor de imagen interactivo
function inicializarEditorImagenEdicion(img) {
    const canvas = document.getElementById('edit-image-canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('edit-interactive-editor');
    
    // Configurar canvas - tamaño fijo para el editor
    const editorWidth = 400;
    const editorHeight = 300;
    
    canvas.width = editorWidth;
    canvas.height = editorHeight;
    canvas.style.width = editorWidth + 'px';
    canvas.style.height = editorHeight + 'px';
    
    // Calcular escala para ajustar imagen al canvas manteniendo aspect ratio
    const scaleX = editorWidth / img.width;
    const scaleY = editorHeight / img.height;
    const scale = Math.min(scaleX, scaleY); // min para que toda la imagen sea visible
    
    // Centrar imagen
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (editorWidth - scaledWidth) / 2;
    const y = (editorHeight - scaledHeight) / 2;
    
    // Guardar datos para el editor
    window.editorDataEdicion = {
        img: img,
        canvas: canvas,
        ctx: ctx,
        container: container,
        baseScale: scale,
        zoom: 1.0,
        imgX: x,
        imgY: y,
        imgWidth: scaledWidth,
        imgHeight: scaledHeight,
        
        // Cuadrado de recorte (inicialmente centrado)
        cropX: editorWidth / 2 - 100,
        cropY: editorHeight / 2 - 100,
        cropSize: 200,
        
        // Estado de interacción
        isDragging: false,
        isResizing: false,
        dragStartX: 0,
        dragStartY: 0,
        cropStartX: 0,
        cropStartY: 0,
        cropStartSize: 0,
        resizeDirection: null
    };
    
    // Dibujar imagen inicial
    dibujarImagenEnEditorEdicion();
    
    // Configurar interacciones
    configurarInteraccionesEditor();
    
    // Posicionar cuadrado de recorte
    actualizarPosicionCropBox();
    
    // Actualizar vista previa
    actualizarVistaPreviewEdicion();
}

// Función para dibujar imagen en el editor
function dibujarImagenEnEditorEdicion() {
    const data = window.editorDataEdicion;
    if (!data) return;
    
    const { ctx, canvas, img, baseScale, zoom, imgX, imgY, imgWidth, imgHeight } = data;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar zoom
    const currentScale = baseScale * zoom;
    const currentWidth = img.width * currentScale;
    const currentHeight = img.height * currentScale;
    
    // Centrar imagen con zoom
    const x = imgX - (currentWidth - imgWidth) / 2;
    const y = imgY - (currentHeight - imgHeight) / 2;
    
    // Dibujar imagen
    ctx.drawImage(img, x, y, currentWidth, currentHeight);
    
    // Actualizar datos actuales
    data.currentX = x;
    data.currentY = y;
    data.currentWidth = currentWidth;
    data.currentHeight = currentHeight;
}

// Función para configurar interacciones del editor
function configurarInteraccionesEditor() {
    const cropBox = document.getElementById('edit-crop-box');
    const dragArea = cropBox.querySelector('.drag-area');
    const resizeHandles = cropBox.querySelectorAll('.resize-handle');
    
    // Variables para seguimiento de mouse
    let startX, startY, startCropX, startCropY, startCropSize;
    
    // Arrastrar el cuadrado completo
    dragArea.addEventListener('mousedown', function(e) {
        e.preventDefault();
        const data = window.editorDataEdicion;
        if (!data) return;
        
        data.isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startCropX = data.cropX;
        startCropY = data.cropY;
        
        document.body.style.cursor = 'move';
        cropBox.classList.add('dragging');
    });
    
    // Redimensionar con handles
    resizeHandles.forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const data = window.editorDataEdicion;
            if (!data) return;
            
            data.isResizing = true;
            data.resizeDirection = this.dataset.direction;
            startX = e.clientX;
            startY = e.clientY;
            startCropX = data.cropX;
            startCropY = data.cropY;
            startCropSize = data.cropSize;
            
            document.body.style.cursor = window.getComputedStyle(this).cursor;
            cropBox.classList.add('resizing');
        });
    });
    
    // Eventos globales de mouse
    document.addEventListener('mousemove', function(e) {
        const data = window.editorDataEdicion;
        if (!data) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        if (data.isDragging) {
            // Arrastrar cuadrado
            let newX = startCropX + deltaX;
            let newY = startCropY + deltaY;
            
            // Límites del canvas
            const maxX = data.canvas.width - data.cropSize;
            const maxY = data.canvas.height - data.cropSize;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            data.cropX = newX;
            data.cropY = newY;
            
            actualizarPosicionCropBox();
            actualizarVistaPreviewEdicion();
            
        } else if (data.isResizing) {
            // Redimensionar cuadrado
            const direction = data.resizeDirection;
            let newSize = startCropSize;
            let newX = startCropX;
            let newY = startCropY;
            
            if (direction.includes('e')) {
                newSize = startCropSize + deltaX;
            } else if (direction.includes('w')) {
                newSize = startCropSize - deltaX;
                newX = startCropX + deltaX;
            } else if (direction.includes('s')) {
                newSize = startCropSize + deltaY;
            } else if (direction.includes('n')) {
                newSize = startCropSize - deltaY;
                newY = startCropY + deltaY;
            }
            
            // Para esquinas, usar la menor distancia
            if (direction.includes('e') && direction.includes('s')) {
                newSize = startCropSize + Math.min(deltaX, deltaY);
            } else if (direction.includes('w') && direction.includes('n')) {
                const delta = Math.min(-deltaX, -deltaY);
                newSize = startCropSize + delta;
                newX = startCropX - delta;
                newY = startCropY - delta;
            } else if (direction.includes('e') && direction.includes('n')) {
                const delta = Math.min(deltaX, -deltaY);
                newSize = startCropSize + delta;
                newY = startCropY - delta;
            } else if (direction.includes('w') && direction.includes('s')) {
                const delta = Math.min(-deltaX, deltaY);
                newSize = startCropSize + delta;
                newX = startCropX - delta;
            }
            
            // Límites de tamaño
            newSize = Math.max(50, Math.min(newSize, 300));
            
            // Límites de posición
            const maxX = data.canvas.width - newSize;
            const maxY = data.canvas.height - newSize;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            data.cropSize = newSize;
            data.cropX = newX;
            data.cropY = newY;
            
            actualizarPosicionCropBox();
            actualizarVistaPreviewEdicion();
        }
    });
    
    document.addEventListener('mouseup', function() {
        const data = window.editorDataEdicion;
        if (data) {
            data.isDragging = false;
            data.isResizing = false;
            data.resizeDirection = null;
        }
        
        document.body.style.cursor = '';
        cropBox.classList.remove('dragging', 'resizing');
    });
}

// Función para actualizar posición del cuadrado de recorte
function actualizarPosicionCropBox() {
    const cropBox = document.getElementById('edit-crop-box');
    const data = window.editorDataEdicion;
    
    if (!cropBox || !data) return;
    
    cropBox.style.left = data.cropX + 'px';
    cropBox.style.top = data.cropY + 'px';
    cropBox.style.width = data.cropSize + 'px';
    cropBox.style.height = data.cropSize + 'px';
}

// Función para aplicar zoom desde botones
function aplicarZoomEditor(delta) {
    const data = window.editorDataEdicion;
    if (!data) return;
    
    data.zoom = Math.max(0.5, Math.min(2.0, data.zoom + delta));
    
    // Actualizar display
    const zoomDisplay = document.getElementById('edit-zoom-display');
    if (zoomDisplay) {
        zoomDisplay.textContent = Math.round(data.zoom * 100) + '%';
    }
    
    // Redibujar
    dibujarImagenEnEditorEdicion();
    actualizarVistaPreviewEdicion();
}

// Función para actualizar vista previa cuadrada
function actualizarVistaPreviewEdicion() {
    const previewImg = document.getElementById('edit-preview-img');
    const placeholder = document.getElementById('edit-preview-placeholder');
    const data = window.editorDataEdicion;
    
    if (!data || !previewImg) return;
    
    // Crear canvas temporal para el recorte
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Configurar canvas temporal como cuadrado de vista previa
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    
    // Obtener área recortada del canvas principal
    const imageData = data.ctx.getImageData(data.cropX, data.cropY, data.cropSize, data.cropSize);
    
    // Crear canvas temporal para redimensionar
    const resizeCanvas = document.createElement('canvas');
    const resizeCtx = resizeCanvas.getContext('2d');
    resizeCanvas.width = data.cropSize;
    resizeCanvas.height = data.cropSize;
    resizeCtx.putImageData(imageData, 0, 0);
    
    // Dibujar redimensionado en canvas final con suavizado
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(resizeCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Mostrar en vista previa
    previewImg.src = tempCanvas.toDataURL();
    previewImg.style.display = 'block';
    
    if (placeholder) {
        placeholder.style.display = 'none';
    }
}

// Función para mostrar controles del editor
function mostrarControlesEditorEdicion() {
    const editor = document.getElementById('edit-image-editor');
    const uploadBtn = document.getElementById('edit-upload-btn');
    const saveBtn = document.getElementById('edit-save-btn');
    const changeBtn = document.getElementById('edit-change-btn');
    const removeBtn = document.getElementById('edit-remove-btn');
    
    if (editor) editor.style.display = 'block';
    if (uploadBtn) uploadBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'inline-flex';
    if (changeBtn) changeBtn.style.display = 'inline-flex';
    if (removeBtn) removeBtn.style.display = 'inline-flex';
    
    // Actualizar marco inicial
    setTimeout(() => {
        actualizarMarcoRecorteEdicion();
    }, 100);
}

// Función para quitar imagen
function quitarImagenEdicion() {
    // Limpiar datos
    window.archivoImagenEdicionSeleccionado = null;
    window.imagenOriginalEdicion = null;
    window.editorDataEdicion = null;
    
    // Ocultar editor
    const editor = document.getElementById('edit-image-editor');
    const uploadBtn = document.getElementById('edit-upload-btn');
    const saveBtn = document.getElementById('edit-save-btn');
    const changeBtn = document.getElementById('edit-change-btn');
    const removeBtn = document.getElementById('edit-remove-btn');
    const previewImg = document.getElementById('edit-preview-img');
    const placeholder = document.getElementById('edit-preview-placeholder');
    const fileInput = document.getElementById('edit-product-image');
    
    if (editor) editor.style.display = 'none';
    if (uploadBtn) uploadBtn.style.display = 'inline-flex';
    if (saveBtn) saveBtn.style.display = 'none';
    if (changeBtn) changeBtn.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'none';
    if (previewImg) previewImg.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (fileInput) fileInput.value = '';
    
    showNotification('Imagen eliminada', 'info');
}

// Función para guardar imagen del producto
async function guardarImagenProducto() {
    try {
        if (!window.productoEnEdicion) {
            showNotification('No hay producto en edición', 'error');
            return;
        }
        
        if (!window.editorDataEdicion || !window.archivoImagenEdicionSeleccionado) {
            showNotification('No hay imagen para guardar', 'error');
            return;
        }
        
        console.log('💾 Guardando imagen del producto:', window.productoEnEdicion.nombre);
        console.log('📄 Archivo seleccionado:', window.archivoImagenEdicionSeleccionado?.name, window.archivoImagenEdicionSeleccionado?.size, 'bytes');
        
        // Obtener imagen recortada
        const imagenRecortada = await obtenerImagenRecortadaEdicion();
        
        if (!imagenRecortada) {
            showNotification('Error al procesar la imagen', 'error');
            return;
        }
        
        console.log('✂️ Imagen recortada obtenida:', imagenRecortada.size, 'bytes, tipo:', imagenRecortada.type);
        console.log('📤 Subiendo imagen recortada...');
        
        // Subir imagen al bucket
        const imagenUrl = await PedisyAPI.productos.subirImagenProducto(window.productoEnEdicion.id, imagenRecortada);
        
        console.log('🔗 URL de imagen generada:', imagenUrl);
        
        // Actualizar producto con la nueva imagen
        await PedisyAPI.productos.updateProducto(window.productoEnEdicion.id, { imagen_url: imagenUrl });
        
        console.log('✅ Producto actualizado con nueva imagen');
        
        // Actualizar datos locales
        window.productoEnEdicion.imagen_url = imagenUrl;
        
        // Actualizar vista previa cuadrada con la imagen guardada
        const previewImg = document.getElementById('edit-preview-img');
        if (previewImg) {
            previewImg.src = imagenUrl;
        }
        
        showNotification('Imagen guardada correctamente', 'success');
        
        // Recargar productos para actualizar la vista
        await cargarProductos();
        
        // Refrescar la vista de la categoría actual
        const categoriaSeleccionada = document.querySelector('.category-item.selected');
        if (categoriaSeleccionada) {
            const categoriaId = categoriaSeleccionada.dataset.categoriaId;
            const categoriaNombre = categoriaSeleccionada.querySelector('.category-name').textContent;
            filtrarProductosPorCategoria(categoriaId, categoriaNombre);
        }
        
    } catch (error) {
        console.error('❌ Error guardando imagen:', error);
        showNotification('Error al guardar la imagen: ' + error.message, 'error');
    }
}

// Función para obtener imagen recortada final
function obtenerImagenRecortadaEdicion() {
    const data = window.editorDataEdicion;
    if (!data) return null;
    
    // Crear canvas final con imagen recortada
    const finalCanvas = document.createElement('canvas');
    const finalCtx = finalCanvas.getContext('2d');
    
    // Configurar tamaño final (cuadrado de 400x400 para buena calidad)
    finalCanvas.width = 400;
    finalCanvas.height = 400;
    
    // Obtener datos de la imagen recortada del canvas principal
    const imageData = data.ctx.getImageData(data.cropX, data.cropY, data.cropSize, data.cropSize);
    
    // Crear canvas temporal con el área recortada
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = data.cropSize;
    tempCanvas.height = data.cropSize;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Dibujar en canvas final con mejor calidad
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(tempCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
    
    // Convertir a blob
    return new Promise(resolve => {
        finalCanvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
}

// Función para manejar archivo de imagen en edición
function manejarArchivoImagenEdicion(file) {
    // Validaciones
    if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen no puede superar los 5MB', 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showNotification('Solo se permiten imágenes', 'error');
        return;
    }
    
    // Guardar archivo
    window.archivoImagenEdicionSeleccionado = file;
    
    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadArea = document.getElementById('edit-product-image-upload');
        const preview = document.getElementById('edit-product-image-preview');
        const previewImg = document.getElementById('edit-product-preview-img');
        const currentImage = document.getElementById('edit-product-current-image');
        
        if (uploadArea && preview && previewImg) {
            uploadArea.style.display = 'none';
            preview.style.display = 'block';
            previewImg.src = e.target.result;
        }
        
        if (currentImage) {
            currentImage.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
    
    showNotification('Nueva imagen cargada', 'success');
}

// Función para eliminar imagen en edición
function removeEditProductImage() {
    window.archivoImagenEdicionSeleccionado = null;
    
    const uploadArea = document.getElementById('edit-product-image-upload');
    const preview = document.getElementById('edit-product-image-preview');
    const fileInput = document.getElementById('edit-product-image');
    const currentImage = document.getElementById('edit-product-current-image');
    
    if (uploadArea && preview && fileInput) {
        uploadArea.style.display = 'block';
        preview.style.display = 'none';
        fileInput.value = '';
    }
    
    // Mostrar imagen actual si existe
    if (currentImage && window.productoEnEdicion?.imagen_url) {
        currentImage.style.display = 'block';
    }
    
    showNotification('Imagen nueva eliminada', 'info');
}

// Función para actualizar producto
async function actualizarProducto() {
    try {
        if (!window.productoEnEdicion) {
            showNotification('No hay producto en edición', 'error');
            return;
        }
        
        // Recopilar datos del formulario (solo campos que existen en la tabla productos)
        const formData = {
            categoria_id: document.getElementById('edit-product-category')?.value,
            nombre: document.getElementById('edit-product-name')?.value,
            descripcion: document.getElementById('edit-product-description')?.value,
            precio: parseFloat(document.getElementById('edit-product-price')?.value) || 0,
            disponible: document.getElementById('edit-product-disponible')?.checked || false,
            destacado: document.getElementById('edit-product-destacado')?.checked || false
        };
        
        // Nota: Los campos adicionales como nombre_interno, precio_costo, tags, etc.
        // no se guardan porque no existen en la tabla actual de productos.
        // Se mantienen en el formulario para futura expansión de la base de datos.
        
        // Validaciones
        if (!formData.categoria_id) {
            showNotification('Debes seleccionar una categoría', 'error');
            return;
        }
        
        if (!formData.nombre) {
            showNotification('El nombre del producto es obligatorio', 'error');
            return;
        }
        
        if (formData.precio <= 0) {
            showNotification('El precio debe ser mayor a 0', 'error');
            return;
        }
        
        console.log('Actualizando producto:', window.productoEnEdicion.id, formData);
        
        // Actualizar producto en la base de datos
        const productoActualizado = await PedisyAPI.productos.updateProducto(window.productoEnEdicion.id, formData);
        
        // Si hay nueva imagen, procesar y subirla
        if (window.archivoImagenEdicionSeleccionado && window.editorDataEdicion) {
            try {
                // Obtener imagen recortada
                const imagenRecortada = await obtenerImagenRecortadaEdicion();
                
                if (imagenRecortada) {
                    const imagenUrl = await PedisyAPI.productos.subirImagenProducto(productoActualizado.id, imagenRecortada);
                    await PedisyAPI.productos.updateProducto(productoActualizado.id, { imagen_url: imagenUrl });
                    console.log('✅ Imagen recortada actualizada');
                } else {
                    throw new Error('No se pudo procesar la imagen recortada');
                }
            } catch (errorImagen) {
                console.error('❌ Error al subir nueva imagen:', errorImagen);
                showNotification('Producto actualizado pero hubo un error al subir la imagen', 'warning');
            }
        } else if (window.archivoImagenEdicionSeleccionado) {
            // Si hay archivo pero no editor (imagen simple)
            try {
                const imagenUrl = await PedisyAPI.productos.subirImagenProducto(productoActualizado.id, window.archivoImagenEdicionSeleccionado);
                await PedisyAPI.productos.updateProducto(productoActualizado.id, { imagen_url: imagenUrl });
                console.log('✅ Imagen simple actualizada');
            } catch (errorImagen) {
                console.error('❌ Error al subir imagen simple:', errorImagen);
                showNotification('Producto actualizado pero hubo un error al subir la imagen', 'warning');
            }
        }
        
        showNotification('Producto actualizado exitosamente', 'success');
        
        // Recargar vista
        await cargarProductos();
        const categoriaSeleccionada = document.querySelector('.category-item.selected');
        if (categoriaSeleccionada) {
            const categoriaId = categoriaSeleccionada.dataset.categoriaId;
            const categoriaNombre = categoriaSeleccionada.querySelector('.category-name').textContent;
            filtrarProductosPorCategoria(categoriaId, categoriaNombre);
        }
        
        // Volver a modo crear
        volverAModoCrear();
        
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        showNotification('Error al actualizar el producto', 'error');
    }
}

// Función para cancelar edición
function cancelarEdicion() {
    volverAModoCrear();
}

// Función para volver a modo crear
function volverAModoCrear() {
    // Limpiar selección de productos
    document.querySelectorAll('.product-item').forEach(p => p.classList.remove('selected'));
    
    // Cambiar título del panel
    const panelTitle = document.querySelector('.edit-column .column-header h3');
    if (panelTitle) {
        panelTitle.textContent = 'CREAR PRODUCTO';
    }
    
    // Mostrar formulario de crear
    const createForm = document.getElementById('create-product-form');
    if (createForm) {
        createForm.style.display = 'block';
    }
    
    // Ocultar formulario de editar
    const editForm = document.getElementById('edit-product-form');
    if (editForm) {
        editForm.style.display = 'none';
    }
    
    // Limpiar datos de edición
    window.productoEnEdicion = null;
    window.archivoImagenEdicionSeleccionado = null;
    
    // Heredar categoría seleccionada en el formulario de crear
    heredarCategoriaSeleccionada();
}

// Función para heredar categoría seleccionada
function heredarCategoriaSeleccionada() {
    const categoriaSeleccionada = document.querySelector('.category-item.selected');
    const newProductCategory = document.getElementById('new-product-category');
    
    if (categoriaSeleccionada && newProductCategory) {
        const categoriaId = categoriaSeleccionada.dataset.categoriaId;
        newProductCategory.value = categoriaId;
    }
}

// Función para editar categoría
async function editarCategoria(categoriaId) {
    try {
        // Buscar la categoría en la lista global
        const categoria = categorias.find(c => c.id === categoriaId);
        if (!categoria) {
            showNotification('Categoría no encontrada', 'error');
            return;
        }
        
        // Mostrar modal de edición usando el modal existente pero con datos precargados
        mostrarModalCrearCategoria(categoria);
        
    } catch (error) {
        console.error('Error al editar categoría:', error);
        showNotification('Error al cargar datos de la categoría', 'error');
    }
}

// Función para eliminar categoría
async function eliminarCategoria(categoriaId, categoriaNombre) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoriaNombre}"?`)) {
        return;
    }
    
    try {
        await PedisyAPI.categorias.deleteCategoria(categoriaId);
        showNotification('Categoría eliminada correctamente', 'success');
        
        // Recargar categorías
        await cargarCategorias();
        await cargarCategoriasDesdeDB();
        
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        showNotification('Error al eliminar la categoría', 'error');
    }
}

// Función para editar producto
async function editarProducto(productoId) {
    try {
        // Buscar el producto en la lista global
        const producto = productos.find(p => p.id === productoId);
        if (!producto) {
            showNotification('Producto no encontrado', 'error');
            return;
        }
        
        // Mostrar modal de edición con datos del producto
        mostrarModalProducto(producto);
        
    } catch (error) {
        console.error('Error al editar producto:', error);
        showNotification('Error al cargar datos del producto', 'error');
    }
}

// Función para eliminar producto
async function eliminarProducto(productoId, productoNombre) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${productoNombre}"?`)) {
        return;
    }
    
    try {
        await PedisyAPI.productos.deleteProducto(productoId);
        showNotification('Producto eliminado correctamente', 'success');
        
        // Recargar productos y recargar la vista filtrada actual
        await cargarProductos();
        const categoriaSeleccionada = document.querySelector('.category-item.selected');
        if (categoriaSeleccionada) {
            const categoriaId = categoriaSeleccionada.dataset.categoriaId;
            const categoriaNombre = categoriaSeleccionada.querySelector('.category-name').textContent;
            filtrarProductosPorCategoria(categoriaId, categoriaNombre);
        }
        
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showNotification('Error al eliminar el producto', 'error');
    }
}

// Función para toggle disponibilidad de producto
async function toggleProductoDisponible(productoId, disponibleActual) {
    try {
        const nuevoEstado = !disponibleActual;
        await PedisyAPI.productos.updateProducto(productoId, { disponible: nuevoEstado });
        
        showNotification(`Producto ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`, 'success');
        
        // Recargar productos y recargar la vista filtrada actual
        await cargarProductos();
        const categoriaSeleccionada = document.querySelector('.category-item.selected');
        if (categoriaSeleccionada) {
            const categoriaId = categoriaSeleccionada.dataset.categoriaId;
            const categoriaNombre = categoriaSeleccionada.querySelector('.category-name').textContent;
            filtrarProductosPorCategoria(categoriaId, categoriaNombre);
        }
        
    } catch (error) {
        console.error('Error al cambiar disponibilidad:', error);
        showNotification('Error al actualizar el producto', 'error');
    }
}

// =====================================================
// FUNCIONES PARA CREAR PRODUCTO
// =====================================================

// Función para inicializar el formulario de crear producto
function inicializarFormularioCrearProducto() {
    // Cargar categorías en el dropdown
    cargarCategoriasEnDropdown();
    
    // Configurar contador de caracteres para descripción
    configurarContadorCaracteres();
    
    // Configurar upload de imagen
    configurarUploadImagenProducto();
    
    // Configurar envío del formulario
    configurarEnvioFormularioProducto();
}

// Función para cargar categorías en el dropdown
async function cargarCategoriasEnDropdown() {
    try {
        const categoriasSelect = document.getElementById('new-product-category');
        if (!categoriasSelect) return;
        
        // Limpiar opciones existentes excepto la primera
        categoriasSelect.innerHTML = '<option value="">Categoría</option>';
        
        // Obtener categorías desde la base de datos
        const categorias = await PedisyAPI.categorias.getCategorias();
        
        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nombre.toUpperCase();
            categoriasSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error al cargar categorías en dropdown:', error);
    }
}

// Función para configurar contador de caracteres
function configurarContadorCaracteres() {
    const textarea = document.getElementById('new-product-description');
    const counter = document.getElementById('description-count');
    
    if (textarea && counter) {
        textarea.addEventListener('input', function() {
            const currentLength = this.value.length;
            counter.textContent = currentLength;
            
            // Cambiar color si se acerca al límite
            if (currentLength > 200) {
                counter.style.color = '#dc3545';
            } else if (currentLength > 150) {
                counter.style.color = '#ffc107';
            } else {
                counter.style.color = '#6c757d';
            }
        });
    }
}

// Función para configurar upload de imagen del producto
function configurarUploadImagenProducto() {
    const uploadArea = document.getElementById('new-product-image-upload');
    const fileInput = document.getElementById('new-product-image');
    const preview = document.getElementById('new-product-image-preview');
    const previewImg = document.getElementById('new-product-preview-img');
    
    if (uploadArea && fileInput && preview && previewImg) {
        // Verificar si ya está configurado para evitar duplicados
        if (uploadArea.dataset.configured === 'true') {
            return;
        }
        
        // Marcar como configurado
        uploadArea.dataset.configured = 'true';
        
        // Click en el área abre el selector de archivos
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Manejo de archivos seleccionados
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                manejarArchivoImagenProducto(file);
            }
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#ff6b35';
            uploadArea.style.background = 'rgba(255, 107, 53, 0.1)';
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.background = '#f8f9fa';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#dee2e6';
            uploadArea.style.background = '#f8f9fa';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    manejarArchivoImagenProducto(file);
                } else {
                    showNotification('Solo se permiten imágenes', 'error');
                }
            }
        });
    }
}

// Función para manejar archivo de imagen del producto
function manejarArchivoImagenProducto(file) {
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen no puede superar los 5MB', 'error');
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showNotification('Solo se permiten imágenes', 'error');
        return;
    }
    
    // Guardar archivo en variable global
    window.archivoImagenProductoSeleccionado = file;
    
    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = function(e) {
        const uploadArea = document.getElementById('new-product-image-upload');
        const preview = document.getElementById('new-product-image-preview');
        const previewImg = document.getElementById('new-product-preview-img');
        
        if (uploadArea && preview && previewImg) {
            uploadArea.style.display = 'none';
            preview.style.display = 'block';
            previewImg.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
    
    showNotification('Imagen cargada correctamente', 'success');
}

// Función para eliminar imagen del producto
function removeProductImage() {
    window.archivoImagenProductoSeleccionado = null;
    
    const uploadArea = document.getElementById('new-product-image-upload');
    const preview = document.getElementById('new-product-image-preview');
    const fileInput = document.getElementById('new-product-image');
    
    if (uploadArea && preview && fileInput) {
        uploadArea.style.display = 'block';
        preview.style.display = 'none';
        fileInput.value = '';
    }
    
    showNotification('Imagen eliminada', 'info');
}

// Función para configurar envío del formulario
function configurarEnvioFormularioProducto() {
    const form = document.getElementById('create-product-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            crearNuevoProductoDesdeFormulario();
        });
    }
}

// Función para crear nuevo producto desde el formulario
async function crearNuevoProductoDesdeFormulario() {
    try {
        // Recopilar datos del formulario (solo campos que existen en la tabla productos)
        const formData = {
            restaurante_id: currentRestaurante.id,
            categoria_id: document.getElementById('new-product-category')?.value,
            nombre: document.getElementById('new-product-name')?.value,
            descripcion: document.getElementById('new-product-description')?.value,
            precio: parseFloat(document.getElementById('new-product-price')?.value) || 0,
            disponible: document.getElementById('new-product-disponible')?.checked || false,
            destacado: document.getElementById('new-product-destacado')?.checked || false,
            orden: 0 // Por defecto
        };
        
        // Validaciones básicas
        if (!formData.categoria_id) {
            showNotification('Debes seleccionar una categoría', 'error');
            return;
        }
        
        if (!formData.nombre) {
            showNotification('El nombre del producto es obligatorio', 'error');
            return;
        }
        
        if (formData.precio <= 0) {
            showNotification('El precio debe ser mayor a 0', 'error');
            return;
        }
        
        console.log('Creando producto:', formData);
        
        // Crear producto en la base de datos
        const nuevoProducto = await PedisyAPI.productos.createProducto(formData);
        
        console.log('Producto creado:', nuevoProducto);
        
        // Si hay imagen, subirla
        if (window.archivoImagenProductoSeleccionado) {
            try {
                console.log('📤 Subiendo imagen del producto...');
                console.log('📁 Archivo a subir:', {
                    nombre: window.archivoImagenProductoSeleccionado.name,
                    tamaño: window.archivoImagenProductoSeleccionado.size,
                    tipo: window.archivoImagenProductoSeleccionado.type
                });
                
                const imagenUrl = await PedisyAPI.productos.subirImagenProducto(nuevoProducto.id, window.archivoImagenProductoSeleccionado);
                
                console.log('🔗 URL de imagen generada:', imagenUrl);
                
                // Actualizar producto con la URL de la imagen
                const productoActualizado = await PedisyAPI.productos.updateProducto(nuevoProducto.id, { imagen_url: imagenUrl });
                
                console.log('✅ Imagen subida y producto actualizado:', productoActualizado);
            } catch (errorImagen) {
                console.error('❌ Error al subir imagen:', errorImagen);
                showNotification('Producto creado pero hubo un error al subir la imagen: ' + errorImagen.message, 'warning');
            }
        } else {
            console.log('ℹ️ No se seleccionó imagen para el producto');
        }
        
        showNotification('Producto creado exitosamente', 'success');
        
        // Limpiar formulario
        limpiarFormularioProducto();
        
        // Recargar productos y vista filtrada
        await cargarProductos();
        const categoriaSeleccionada = document.querySelector('.category-item.selected');
        if (categoriaSeleccionada) {
            const categoriaId = categoriaSeleccionada.dataset.categoriaId;
            const categoriaNombre = categoriaSeleccionada.querySelector('.category-name').textContent;
            filtrarProductosPorCategoria(categoriaId, categoriaNombre);
        }
        
    } catch (error) {
        console.error('Error al crear producto:', error);
        showNotification('Error al crear el producto', 'error');
    }
}

// Función para limpiar formulario de producto
function limpiarFormularioProducto() {
    const form = document.getElementById('create-product-form');
    if (form) {
        form.reset();
        
        // Resetear imagen
        removeProductImage();
        
        // Resetear contador de caracteres
        const counter = document.getElementById('description-count');
        if (counter) {
            counter.textContent = '0';
            counter.style.color = '#6c757d';
        }
        
        // Resetear valores por defecto
        document.getElementById('new-product-max-selection').value = '1';
        document.getElementById('new-product-visible').checked = true;
        document.getElementById('new-product-disponible').checked = true;
        document.getElementById('new-product-destacado').checked = false;
        document.getElementById('new-product-sugerencia').checked = false;
    }
}

async function guardarCategoria(event) {
    event.preventDefault();
    
    // Recopilar datos del formulario
    const formData = {
        nombre: document.getElementById('categoria-nombre')?.value,
        nombreInterno: document.getElementById('categoria-nombre-interno')?.value,
        descripcion: document.getElementById('categoria-descripcion')?.value,
        tags: document.getElementById('categoria-tags')?.value,
        activo: document.getElementById('categoria-activa')?.checked,
        disponibilidad: document.getElementById('categoria-disponibilidad')?.value,
        tipoDisponibilidad: document.querySelector('input[name="disponibilidad-tipo"]:checked')?.value
    };
    
    // Validar campos requeridos
    if (!formData.nombre || !formData.nombre.trim()) {
        showNotification('El nombre de la categoría es requerido', 'error');
        return;
    }
    
    try {
        console.log('Creando categoría:', formData);
        
        // Preparar datos de la categoría
        const categoriaData = {
            restaurante_id: currentRestaurante.id, // Agregar el ID del restaurante
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            activo: formData.activo,
            orden: 0 // Por defecto al final
        };
        
        // Crear la categoría primero
        const resultado = await PedisyAPI.categorias.createCategoria(categoriaData);
        console.log('Categoría creada:', resultado);
        
        // Si hay una imagen seleccionada, subirla
        if (window.archivoImagenSeleccionado) {
            try {
                showNotification('Subiendo imagen...', 'info');
                console.log('📤 Subiendo archivo:', window.archivoImagenSeleccionado.name, window.archivoImagenSeleccionado.size);
                
                const imageResult = await PedisyAPI.categorias.subirImagenCategoria(
                    window.archivoImagenSeleccionado, 
                    resultado.id
                );
                
                console.log('✅ Imagen subida exitosamente:', imageResult);
                
                // Actualizar la categoría con la URL de la imagen
                await PedisyAPI.categorias.updateCategoria(resultado.id, {
                    ...categoriaData,
                    imagen_url: imageResult.url
                });
                
                console.log('✅ Categoría actualizada con imagen URL:', imageResult.url);
                showNotification('Categoría e imagen guardadas correctamente', 'success');
                
                // Limpiar archivo seleccionado
                window.archivoImagenSeleccionado = null;
                
            } catch (imageError) {
                console.error('❌ Error detallado al subir imagen:', imageError);
                showNotification(`Error al subir imagen: ${imageError.message}`, 'error');
                
                // Si falla la imagen, eliminar la categoría creada para mantener consistencia
                try {
                    await PedisyAPI.categorias.deleteCategoria(resultado.id);
                    console.log('Categoría eliminada debido al error de imagen');
                } catch (deleteError) {
                    console.error('Error al eliminar categoría:', deleteError);
                }
            }
        } else {
            showNotification('Categoría creada correctamente', 'success');
        }
        
        // Recargar la lista de categorías desde la base de datos
        await cargarCategorias();
        await cargarCategoriasDesdeDB();
        
        // Cerrar modal
        cerrarModalCrearCategoria();
        
    } catch (error) {
        console.error('Error al crear categoría:', error);
        showNotification('Error al crear la categoría', 'error');
    }
}

function agregarCategoriaALista(categoria) {
    const container = document.querySelector('.categories-container');
    if (container) {
        const newItem = document.createElement('div');
        newItem.className = 'category-item';
        newItem.textContent = categoria.nombre.toUpperCase();
        
        // Event listener para la nueva categoría
        newItem.addEventListener('click', function() {
            document.querySelectorAll('.category-item').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            filtrarProductosPorCategoria(categoria.nombre.toUpperCase());
        });
        
        container.appendChild(newItem);
    }
}

// Configurar event listeners del modal cuando se carga la página
function configurarModalCategoria() {
    // Formulario de crear categoría
    const form = document.getElementById('form-crear-categoria');
    if (form) {
        form.addEventListener('submit', guardarCategoria);
    }
    
    // Configurar upload de imagen
    configurarUploadImagen();
    
    // Cerrar modal al hacer click fuera
    const modal = document.getElementById('modal-crear-categoria');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalCrearCategoria();
            }
        });
    }
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modal-crear-categoria');
            if (modal && modal.style.display === 'flex') {
                cerrarModalCrearCategoria();
            }
        }
    });
}
