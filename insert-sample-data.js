// =====================================================
// SCRIPT PARA INSERTAR DATOS DE EJEMPLO EN SUPABASE
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSampleData() {
    console.log('🚀 Iniciando inserción de datos de ejemplo...');
    
    try {
        // 1. Obtener el restaurante existente
        console.log('📋 Obteniendo restaurante...');
        const { data: restaurante, error: restauranteError } = await supabase
            .from('restaurantes')
            .select('*')
            .eq('nombre', 'Restaurante Pedisy')
            .single();
        
        if (restauranteError || !restaurante) {
            console.log('❌ No se encontró el restaurante. Ejecuta primero create-tables.sql');
            return;
        }
        
        console.log('✅ Restaurante encontrado:', restaurante.nombre);
        
        // 2. Insertar categorías de menú
        console.log('📋 Insertando categorías de menú...');
        const categorias = [
            {
                restaurante_id: restaurante.id,
                nombre: 'Entradas',
                descripcion: 'Platos para comenzar tu experiencia gastronómica',
                orden: 1,
                activo: true
            },
            {
                restaurante_id: restaurante.id,
                nombre: 'Platos Principales',
                descripcion: 'Nuestros platos más destacados y deliciosos',
                orden: 2,
                activo: true
            },
            {
                restaurante_id: restaurante.id,
                nombre: 'Pastas',
                descripcion: 'Pastas frescas con las mejores salsas italianas',
                orden: 3,
                activo: true
            },
            {
                restaurante_id: restaurante.id,
                nombre: 'Pizzas',
                descripcion: 'Pizzas artesanales con ingredientes frescos',
                orden: 4,
                activo: true
            },
            {
                restaurante_id: restaurante.id,
                nombre: 'Postres',
                descripcion: 'Dulces delicias para terminar tu comida',
                orden: 5,
                activo: true
            },
            {
                restaurante_id: restaurante.id,
                nombre: 'Bebidas',
                descripcion: 'Refrescos, jugos y bebidas especiales',
                orden: 6,
                activo: true
            }
        ];
        
        const { data: categoriasInsertadas, error: categoriasError } = await supabase
            .from('categorias_menu')
            .insert(categorias)
            .select();
        
        if (categoriasError) {
            console.log('⚠️ Algunas categorías ya existen o hubo un error:', categoriasError.message);
        } else {
            console.log('✅ Categorías insertadas:', categoriasInsertadas.length);
        }
        
        // 3. Obtener categorías para usar en productos
        const { data: categoriasExistentes, error: categoriasGetError } = await supabase
            .from('categorias_menu')
            .select('*')
            .eq('restaurante_id', restaurante.id)
            .eq('activo', true);
        
        if (categoriasGetError) {
            console.log('❌ Error al obtener categorías:', categoriasGetError);
            return;
        }
        
        // 4. Insertar productos
        console.log('📋 Insertando productos...');
        const productos = [
            // Entradas
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Entradas')?.id,
                nombre: 'Ensalada César',
                descripcion: 'Lechuga romana, crutones, parmesano y aderezo César',
                precio: 12.50,
                disponible: true,
                destacado: true,
                orden: 1
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Entradas')?.id,
                nombre: 'Bruschetta',
                descripcion: 'Pan tostado con tomate, albahaca y mozzarella',
                precio: 8.50,
                disponible: true,
                destacado: false,
                orden: 2
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Entradas')?.id,
                nombre: 'Caprese',
                descripcion: 'Tomate, mozzarella y albahaca con aceite de oliva',
                precio: 10.00,
                disponible: true,
                destacado: false,
                orden: 3
            },
            
            // Platos Principales
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Platos Principales')?.id,
                nombre: 'Pollo a la Parmigiana',
                descripcion: 'Pechuga de pollo empanizada con salsa de tomate y mozzarella',
                precio: 18.50,
                disponible: true,
                destacado: true,
                orden: 1
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Platos Principales')?.id,
                nombre: 'Salmón a la Plancha',
                descripcion: 'Filete de salmón fresco con vegetales de temporada',
                precio: 22.00,
                disponible: true,
                destacado: true,
                orden: 2
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Platos Principales')?.id,
                nombre: 'Bife de Chorizo',
                descripcion: 'Bife de chorizo argentino con papas rústicas',
                precio: 25.00,
                disponible: true,
                destacado: false,
                orden: 3
            },
            
            // Pastas
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Pastas')?.id,
                nombre: 'Spaghetti Carbonara',
                descripcion: 'Pasta con huevo, panceta, parmesano y pimienta negra',
                precio: 16.50,
                disponible: true,
                destacado: true,
                orden: 1
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Pastas')?.id,
                nombre: 'Fettuccine Alfredo',
                descripcion: 'Pasta con crema, mantequilla y parmesano',
                precio: 15.00,
                disponible: true,
                destacado: false,
                orden: 2
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Pastas')?.id,
                nombre: 'Lasagna Bolognesa',
                descripcion: 'Capas de pasta con carne, salsa de tomate y bechamel',
                precio: 19.50,
                disponible: true,
                destacado: true,
                orden: 3
            },
            
            // Pizzas
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Pizzas')?.id,
                nombre: 'Margherita',
                descripcion: 'Salsa de tomate, mozzarella y albahaca',
                precio: 14.00,
                disponible: true,
                destacado: true,
                orden: 1
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Pizzas')?.id,
                nombre: 'Pepperoni',
                descripcion: 'Salsa de tomate, mozzarella y pepperoni',
                precio: 16.50,
                disponible: true,
                destacado: false,
                orden: 2
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Pizzas')?.id,
                nombre: 'Cuatro Quesos',
                descripcion: 'Mozzarella, gorgonzola, parmesano y provolone',
                precio: 18.00,
                disponible: true,
                destacado: false,
                orden: 3
            },
            
            // Postres
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Postres')?.id,
                nombre: 'Tiramisú',
                descripcion: 'Postre italiano con café, mascarpone y cacao',
                precio: 9.50,
                disponible: true,
                destacado: true,
                orden: 1
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Postres')?.id,
                nombre: 'Panna Cotta',
                descripcion: 'Crema cocida con frutos rojos',
                precio: 8.00,
                disponible: true,
                destacado: false,
                orden: 2
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Postres')?.id,
                nombre: 'Gelato',
                descripcion: 'Helado artesanal italiano (vainilla, chocolate, fresa)',
                precio: 6.50,
                disponible: true,
                destacado: false,
                orden: 3
            },
            
            // Bebidas
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Bebidas')?.id,
                nombre: 'Limonada Natural',
                descripcion: 'Limonada fresca con menta',
                precio: 4.50,
                disponible: true,
                destacado: false,
                orden: 1
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Bebidas')?.id,
                nombre: 'Agua Mineral',
                descripcion: 'Agua mineral con gas o sin gas',
                precio: 3.00,
                disponible: true,
                destacado: false,
                orden: 2
            },
            {
                restaurante_id: restaurante.id,
                categoria_id: categoriasExistentes.find(c => c.nombre === 'Bebidas')?.id,
                nombre: 'Café Espresso',
                descripcion: 'Café espresso italiano',
                precio: 3.50,
                disponible: true,
                destacado: false,
                orden: 3
            }
        ];
        
        const { data: productosInsertados, error: productosError } = await supabase
            .from('productos')
            .insert(productos)
            .select();
        
        if (productosError) {
            console.log('⚠️ Algunos productos ya existen o hubo un error:', productosError.message);
        } else {
            console.log('✅ Productos insertados:', productosInsertados.length);
        }
        
        // 5. Insertar configuraciones de delivery
        console.log('📋 Insertando configuración de delivery...');
        const configDelivery = {
            restaurante_id: restaurante.id,
            radio_delivery: 5000,
            costo_delivery_base: 5.00,
            costo_por_km: 1.50,
            tiempo_entrega_estimado: 45,
            horario_delivery_inicio: '08:00:00',
            horario_delivery_fin: '23:00:00',
            dias_delivery: [1, 2, 3, 4, 5, 6, 7],
            activo: true
        };
        
        const { data: deliveryConfig, error: deliveryError } = await supabase
            .from('configuraciones_delivery')
            .insert(configDelivery)
            .select()
            .single();
        
        if (deliveryError) {
            console.log('⚠️ Configuración de delivery ya existe o hubo un error:', deliveryError.message);
        } else {
            console.log('✅ Configuración de delivery insertada');
        }
        
        // 6. Insertar configuraciones de marketing
        console.log('📋 Insertando configuración de marketing...');
        const configMarketing = {
            restaurante_id: restaurante.id,
            redes_sociales: {
                facebook: 'https://facebook.com/pedisy',
                instagram: 'https://instagram.com/pedisy',
                twitter: 'https://twitter.com/pedisy'
            },
            newsletter_activo: true,
            descuentos_activos: true,
            programa_fidelidad: true,
            puntos_por_compra: 10
        };
        
        const { data: marketingConfig, error: marketingError } = await supabase
            .from('configuraciones_marketing')
            .insert(configMarketing)
            .select()
            .single();
        
        if (marketingError) {
            console.log('⚠️ Configuración de marketing ya existe o hubo un error:', marketingError.message);
        } else {
            console.log('✅ Configuración de marketing insertada');
        }
        
        // 7. Insertar configuraciones de pagos
        console.log('📋 Insertando configuración de pagos...');
        const configPagos = {
            restaurante_id: restaurante.id,
            efectivo: true,
            tarjeta: true,
            transferencia: true,
            pago_digital: true,
            requiere_anticipo: false,
            porcentaje_anticipo: 0
        };
        
        const { data: pagosConfig, error: pagosError } = await supabase
            .from('configuraciones_pagos')
            .insert(configPagos)
            .select()
            .single();
        
        if (pagosError) {
            console.log('⚠️ Configuración de pagos ya existe o hubo un error:', pagosError.message);
        } else {
            console.log('✅ Configuración de pagos insertada');
        }
        
        // 8. Insertar clientes de ejemplo
        console.log('📋 Insertando clientes de ejemplo...');
        const clientes = [
            {
                nombre: 'María',
                apellido: 'González',
                email: 'maria.gonzalez@email.com',
                telefono: '+54 11 1234-5678',
                direccion: 'Av. Corrientes 1234, Buenos Aires'
            },
            {
                nombre: 'Carlos',
                apellido: 'Rodríguez',
                email: 'carlos.rodriguez@email.com',
                telefono: '+54 11 2345-6789',
                direccion: 'Calle Florida 567, Buenos Aires'
            },
            {
                nombre: 'Ana',
                apellido: 'López',
                email: 'ana.lopez@email.com',
                telefono: '+54 11 3456-7890',
                direccion: 'Av. Santa Fe 890, Buenos Aires'
            }
        ];
        
        const { data: clientesInsertados, error: clientesError } = await supabase
            .from('clientes')
            .insert(clientes)
            .select();
        
        if (clientesError) {
            console.log('⚠️ Algunos clientes ya existen o hubo un error:', clientesError.message);
        } else {
            console.log('✅ Clientes insertados:', clientesInsertados.length);
        }
        
        // 9. Insertar pedidos de ejemplo
        console.log('📋 Insertando pedidos de ejemplo...');
        const pedidos = [
            {
                cliente_id: clientesInsertados?.[0]?.id || null,
                restaurante_id: restaurante.id,
                numero_pedido: 'PED-001',
                estado: 'entregado',
                tipo_entrega: 'delivery',
                direccion_entrega: 'Av. Corrientes 1234, Buenos Aires',
                subtotal: 35.00,
                costo_delivery: 5.00,
                total: 40.00,
                metodo_pago: 'efectivo',
                notas: 'Entregar en puerta principal'
            },
            {
                cliente_id: clientesInsertados?.[1]?.id || null,
                restaurante_id: restaurante.id,
                numero_pedido: 'PED-002',
                estado: 'en_preparacion',
                tipo_entrega: 'retiro',
                direccion_entrega: null,
                subtotal: 28.50,
                costo_delivery: 0,
                total: 28.50,
                metodo_pago: 'tarjeta',
                notas: 'Sin cebolla'
            }
        ];
        
        const { data: pedidosInsertados, error: pedidosError } = await supabase
            .from('pedidos')
            .insert(pedidos)
            .select();
        
        if (pedidosError) {
            console.log('⚠️ Algunos pedidos ya existen o hubo un error:', pedidosError.message);
        } else {
            console.log('✅ Pedidos insertados:', pedidosInsertados.length);
        }
        
        console.log('\n🎉 ¡Datos de ejemplo insertados exitosamente!');
        console.log('\n📊 Resumen de datos insertados:');
        console.log(`   • Categorías: ${categorias.length}`);
        console.log(`   • Productos: ${productos.length}`);
        console.log(`   • Clientes: ${clientes.length}`);
        console.log(`   • Pedidos: ${pedidos.length}`);
        console.log(`   • Configuraciones: 3 (delivery, marketing, pagos)`);
        
        console.log('\n🚀 Tu sistema Pedisy está listo para usar!');
        console.log('   • Abre index.html para el panel de administración');
        console.log('   • Abre cliente.html para el menú digital');
        
    } catch (error) {
        console.error('❌ Error durante la inserción:', error);
    }
}

// Ejecutar la inserción
insertSampleData();
