// =====================================================
// CONFIGURACIÓN DE SUPABASE PARA EL FRONTEND
// =====================================================

// Importar el cliente de Supabase (agregar en el HTML)
// <script src="https://unpkg.com/@supabase/supabase-js@2"></script>

// Configuración de Supabase
const SUPABASE_CONFIG = {
    url: 'https://cwulvffuheotxzpocxla.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM',
    database: {
        host: 'db.cwulvffuheotxzpocxla.supabase.co',
        port: '5432',
        database: 'postgres',
        user: 'postgres',
        password: 'SoleyEma2711'
    }
};

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Hacer supabase disponible globalmente para testing
window.supabaseClient = supabase;

// =====================================================
// FUNCIONES PARA INTERACTUAR CON LA BASE DE DATOS
// =====================================================

// FUNCIONES DE RESTAURANTES
const restaurantesAPI = {
    // Obtener información del restaurante
    async getRestaurante() {
        const { data, error } = await supabase
            .from('restaurantes')
            .select('*')
            .eq('activo', true)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Actualizar información del restaurante
    async updateRestaurante(id, updates) {
        const { data, error } = await supabase
            .from('restaurantes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// FUNCIONES DE CATEGORÍAS
const categoriasAPI = {
    // Obtener todas las categorías activas
    async getCategorias() {
        const { data, error } = await supabase
            .from('categorias_menu')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    // Crear nueva categoría
    async createCategoria(categoria) {
        const { data, error } = await supabase
            .from('categorias_menu')
            .insert(categoria)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Actualizar categoría
    async updateCategoria(id, updates) {
        const { data, error } = await supabase
            .from('categorias_menu')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Eliminar categoría (marcar como inactiva)
    async deleteCategoria(id) {
        const { data, error } = await supabase
            .from('categorias_menu')
            .update({ activo: false })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Subir imagen de categoría
    async subirImagenCategoria(file, categoriaId) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${categoriaId}/categoria.${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from('categorias')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });
            
            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage
                .from('categorias')
                .getPublicUrl(fileName);
            
            return { url: publicUrl };
        } catch (error) {
            console.error('Error al subir imagen de categoría:', error);
            throw error;
        }
    }
};

// FUNCIONES DE PRODUCTOS
const productosAPI = {
    // Obtener todos los productos disponibles
    async getProductos() {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('disponible', true)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    // Obtener productos por categoría
    async getProductosPorCategoria(categoriaId) {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('categoria_id', categoriaId)
            .eq('disponible', true)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    // Obtener producto por ID
    async getProductoById(productoId) {
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .eq('id', productoId)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Crear nuevo producto
    async createProducto(producto) {
        const { data, error } = await supabase
            .from('productos')
            .insert(producto)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Actualizar producto
    async updateProducto(id, updates) {
        const { data, error } = await supabase
            .from('productos')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Eliminar producto (marcar como no disponible)
    async deleteProducto(id) {
        const { data, error } = await supabase
            .from('productos')
            .update({ disponible: false })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Subir imagen de producto
    async subirImagenProducto(productoId, archivo) {
        try {
            // Generar nombre único para el archivo
            const fileExt = archivo.name.split('.').pop();
            const fileName = `producto_${productoId}.${fileExt}`;
            const filePath = `${productoId}/${fileName}`;

            console.log('📤 Subiendo imagen a productos bucket:', filePath);

            // Subir archivo al bucket "productos" 
            const { data, error } = await supabase.storage
                .from('productos')
                .upload(filePath, archivo, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('❌ Error al subir imagen:', error);
                throw error;
            }

            console.log('✅ Imagen subida exitosamente:', data);

            // Obtener URL pública de la imagen
            const { data: urlData } = supabase.storage
                .from('productos')
                .getPublicUrl(filePath);

            console.log('🔗 URL pública generada:', urlData.publicUrl);
            return urlData.publicUrl;

        } catch (error) {
            console.error('❌ Error en subirImagenProducto:', error);
            throw error;
        }
    }
};

// FUNCIONES DE CLIENTES
const clientesAPI = {
    // Crear nuevo cliente
    async createCliente(cliente) {
        const { data, error } = await supabase
            .from('clientes')
            .insert(cliente)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Buscar cliente por email
    async getClientePorEmail(email) {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Actualizar cliente
    async updateCliente(id, updates) {
        const { data, error } = await supabase
            .from('clientes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// FUNCIONES DE PEDIDOS
const pedidosAPI = {
    // Crear nuevo pedido
    async createPedido(pedido) {
        const { data, error } = await supabase
            .from('pedidos')
            .insert(pedido)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    // Crear detalles del pedido
    async createDetallesPedido(detalles) {
        const { data, error } = await supabase
            .from('detalles_pedido')
            .insert(detalles)
            .select();
        
        if (error) throw error;
        return data;
    },

    // Obtener pedidos del restaurante
    async getPedidos(restauranteId) {
        const { data, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Actualizar estado del pedido
    async updateEstadoPedido(id, nuevoEstado) {
        const { data, error } = await supabase
            .from('pedidos')
            .update({ estado: nuevoEstado })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// FUNCIONES DE CONFIGURACIONES
const configuracionesAPI = {
    // Obtener configuración de delivery
    async getConfiguracionDelivery(restauranteId) {
        const { data, error } = await supabase
            .from('configuraciones_delivery')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .eq('activo', true)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Obtener configuración de marketing
    async getConfiguracionMarketing(restauranteId) {
        const { data, error } = await supabase
            .from('configuraciones_marketing')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Obtener configuración de pagos
    async getConfiguracionPagos(restauranteId) {
        const { data, error } = await supabase
            .from('configuraciones_pagos')
            .select('*')
            .eq('restaurante_id', restauranteId)
            .single();
        
        if (error) throw error;
        return data;
    },

    // Actualizar configuración
    async updateConfiguracion(tabla, id, updates) {
        const { data, error } = await supabase
            .from(tabla)
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// FUNCIONES DE AUTENTICACIÓN
const authAPI = {
    // Iniciar sesión
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return data;
    },

    // Cerrar sesión
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Obtener usuario actual
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    }
};

// =====================================================
// EXPORTAR FUNCIONES PARA USO EN OTROS ARCHIVOS
// =====================================================

window.PedisyAPI = {
    restaurantes: restaurantesAPI,
    categorias: categoriasAPI,
    productos: productosAPI,
    clientes: clientesAPI,
    pedidos: pedidosAPI,
    configuraciones: configuracionesAPI,
    auth: authAPI,
    supabase: supabase
};

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Implementar según tu sistema de notificaciones
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Función para manejar errores de API
function handleAPIError(error, context = '') {
    console.error(`Error en ${context}:`, error);
    showNotification(`Error: ${error.message}`, 'error');
}

// Función para validar datos antes de enviar
function validateData(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
        throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
    }
    return true;
}

// =====================================================
// API PARA CATEGORÍAS (MEJORADA)
// =====================================================

const categoriasAPImejorada = {
    // Obtener todas las categorías
    async getCategorias() {
        try {
            const { data, error } = await supabase
                .from('categorias_menu')
                .select('*')
                .eq('activo', true)
                .order('orden', { ascending: true });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            throw error;
        }
    },

    // Crear nueva categoría
    async createCategoria(categoriaData) {
        try {
            const { data, error } = await supabase
                .from('categorias_menu')
                .insert([{
                    nombre: categoriaData.nombre,
                    nombre_interno: categoriaData.nombre_interno,
                    descripcion: categoriaData.descripcion,
                    activo: categoriaData.activo !== false,
                    orden: categoriaData.orden || 0,
                    imagen_url: categoriaData.imagen_url || null,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al crear categoría:', error);
            throw error;
        }
    },

    // Actualizar categoría
    async updateCategoria(id, categoriaData) {
        try {
            const { data, error } = await supabase
                .from('categorias_menu')
                .update({
                    nombre: categoriaData.nombre,
                    nombre_interno: categoriaData.nombre_interno,
                    descripcion: categoriaData.descripcion,
                    activo: categoriaData.activo,
                    orden: categoriaData.orden,
                    imagen_url: categoriaData.imagen_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al actualizar categoría:', error);
            throw error;
        }
    },

    // Eliminar categoría (soft delete)
    async deleteCategoria(id) {
        try {
            const { data, error } = await supabase
                .from('categorias_menu')
                .update({ 
                    activo: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            throw error;
        }
    },

    // Subir imagen de categoría
    async subirImagenCategoria(file, categoriaId) {
        try {
            console.log('🔧 Iniciando subida de imagen:', file.name, file.type, file.size);
            
            // Validar archivo
            if (!file.type.startsWith('image/')) {
                throw new Error('El archivo debe ser una imagen');
            }
            
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('El archivo es demasiado grande (máximo 10MB)');
            }
            
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileName = `categoria_${categoriaId || 'temp'}_${Date.now()}.${fileExt}`;
            const filePath = `categorias/${fileName}`;
            
            console.log('📂 Subiendo a path:', filePath);

            // Subir archivo a Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('imagenes')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type
                });

            if (uploadError) {
                console.error('❌ Error en upload:', uploadError);
                throw new Error(`Error al subir archivo: ${uploadError.message}`);
            }
            
            console.log('✅ Upload exitoso:', uploadData);

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('imagenes')
                .getPublicUrl(filePath);
            
            console.log('🔗 URL generada:', urlData.publicUrl);

            return {
                url: urlData.publicUrl,
                path: filePath,
                uploadData: uploadData
            };
        } catch (error) {
            console.error('❌ Error completo al subir imagen:', error);
            throw error;
        }
    }
};

// Reemplazar la API original con la mejorada
window.categoriasAPI = categoriasAPImejorada;
