-- =====================================================
-- VERIFICACIÓN Y CREACIÓN DE TABLAS EN SUPABASE
-- =====================================================

-- 1. Verificar si las tablas existen
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'restaurantes',
    'categorias_menu', 
    'productos',
    'pedidos',
    'detalles_pedido',
    'clientes',
    'configuraciones_delivery',
    'configuraciones_marketing',
    'configuraciones_pagos',
    'usuarios'
);

-- 2. Si las tablas no existen, crearlas:

-- Tabla restaurantes
CREATE TABLE IF NOT EXISTS restaurantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla categorias_menu
CREATE TABLE IF NOT EXISTS categorias_menu (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    restaurante_id INTEGER REFERENCES restaurantes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    nombre_interno VARCHAR(255),
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    precio_costo DECIMAL(10,2),
    categoria_id INTEGER REFERENCES categorias_menu(id),
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    restaurante_id INTEGER REFERENCES restaurantes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE,
    cliente_id INTEGER REFERENCES clientes(id),
    restaurante_id INTEGER REFERENCES restaurantes(id),
    estado VARCHAR(50) DEFAULT 'pendiente',
    tipo_entrega VARCHAR(50) DEFAULT 'delivery',
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    direccion_entrega TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla detalles_pedido
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id),
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla configuraciones_delivery
CREATE TABLE IF NOT EXISTS configuraciones_delivery (
    id SERIAL PRIMARY KEY,
    restaurante_id INTEGER REFERENCES restaurantes(id),
    radio_entrega DECIMAL(5,2) DEFAULT 5.0,
    costo_envio_base DECIMAL(10,2) DEFAULT 0.00,
    tiempo_entrega_promedio INTEGER DEFAULT 45,
    horario_inicio TIME DEFAULT '09:00:00',
    horario_fin TIME DEFAULT '22:00:00',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla configuraciones_marketing
CREATE TABLE IF NOT EXISTS configuraciones_marketing (
    id SERIAL PRIMARY KEY,
    restaurante_id INTEGER REFERENCES restaurantes(id),
    descuento_primera_compra INTEGER DEFAULT 0,
    programa_fidelizacion BOOLEAN DEFAULT false,
    puntos_por_compra INTEGER DEFAULT 1,
    newsletter_semanal BOOLEAN DEFAULT false,
    cupones_descuento BOOLEAN DEFAULT false,
    notificaciones_push BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla configuraciones_pagos
CREATE TABLE IF NOT EXISTS configuraciones_pagos (
    id SERIAL PRIMARY KEY,
    restaurante_id INTEGER REFERENCES restaurantes(id),
    efectivo BOOLEAN DEFAULT true,
    tarjeta_credito BOOLEAN DEFAULT true,
    tarjeta_debito BOOLEAN DEFAULT true,
    transferencia_bancaria BOOLEAN DEFAULT false,
    mercado_pago BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'admin',
    restaurante_id INTEGER REFERENCES restaurantes(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_restaurante ON productos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_restaurante ON pedidos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_detalles_pedido_pedido ON detalles_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_detalles_pedido_producto ON detalles_pedido(producto_id);

-- 4. Insertar datos de ejemplo si las tablas están vacías

-- Insertar restaurante de ejemplo
INSERT INTO restaurantes (nombre, descripcion, direccion, telefono, email)
SELECT 'MMM Pizza', 'Pizzería artesanal con estilo napolitano y romano', 'Av. Principal 123', '+54 11 1234-5678', 'info@mmmpizza.com'
WHERE NOT EXISTS (SELECT 1 FROM restaurantes WHERE nombre = 'MMM Pizza');

-- Insertar categorías de ejemplo
INSERT INTO categorias_menu (nombre, descripcion, orden, restaurante_id)
SELECT 'PROMOS', 'Ofertas especiales y promociones', 1, r.id
FROM restaurantes r WHERE r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM categorias_menu WHERE nombre = 'PROMOS' AND restaurante_id = r.id);

INSERT INTO categorias_menu (nombre, descripcion, orden, restaurante_id)
SELECT 'PIZZA ESTILO NAPOLETANO', 'Pizzas tradicionales napolitanas', 2, r.id
FROM restaurantes r WHERE r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM categorias_menu WHERE nombre = 'PIZZA ESTILO NAPOLETANO' AND restaurante_id = r.id);

INSERT INTO categorias_menu (nombre, descripcion, orden, restaurante_id)
SELECT 'PIZZA ESTILO ROMANA', 'Pizzas estilo romano', 3, r.id
FROM restaurantes r WHERE r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM categorias_menu WHERE nombre = 'PIZZA ESTILO ROMANA' AND restaurante_id = r.id);

INSERT INTO categorias_menu (nombre, descripcion, orden, restaurante_id)
SELECT 'EMPANADAS', 'Empanadas caseras', 4, r.id
FROM restaurantes r WHERE r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM categorias_menu WHERE nombre = 'EMPANADAS' AND restaurante_id = r.id);

INSERT INTO categorias_menu (nombre, descripcion, orden, restaurante_id)
SELECT 'BEBIDAS', 'Bebidas y refrescos', 5, r.id
FROM restaurantes r WHERE r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM categorias_menu WHERE nombre = 'BEBIDAS' AND restaurante_id = r.id);

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, nombre_interno, descripcion, precio, precio_costo, categoria_id, restaurante_id)
SELECT '2 Muzzas estilo napoletano', '2 Muzzas e/napo', '2 Pizzas artesanales de 6 porciones, mozzarella gratinada, salsa de tomate natural, aceitunas verdes, aceite macerado con ajo y especias.', 15000.00, 14000.00, c.id, r.id
FROM categorias_menu c, restaurantes r 
WHERE c.nombre = 'PROMOS' AND r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM productos WHERE nombre_interno = '2 Muzzas e/napo');

-- Insertar configuración de delivery
INSERT INTO configuraciones_delivery (restaurante_id, radio_entrega, costo_envio_base, tiempo_entrega_promedio, horario_inicio, horario_fin)
SELECT r.id, 5.0, 0.00, 45, '09:00:00', '22:00:00'
FROM restaurantes r WHERE r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM configuraciones_delivery WHERE restaurante_id = r.id);

-- Insertar configuración de marketing
INSERT INTO configuraciones_marketing (restaurante_id, descuento_primera_compra, programa_fidelizacion, puntos_por_compra, newsletter_semanal, cupones_descuento, notificaciones_push)
SELECT r.id, 10, true, 1, true, true, true
FROM restaurantes r WHERE r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM configuraciones_marketing WHERE restaurante_id = r.id);

-- Insertar configuración de pagos
INSERT INTO configuraciones_pagos (restaurante_id, efectivo, tarjeta_credito, tarjeta_debito, transferencia_bancaria, mercado_pago)
SELECT r.id, true, true, true, true, false
FROM restaurantes r WHERE r.nombre = 'MMM Pizza'
AND NOT EXISTS (SELECT 1 FROM configuraciones_pagos WHERE restaurante_id = r.id);

-- 5. Verificar que las tablas se crearon correctamente
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTE'
        ELSE 'NO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'restaurantes',
    'categorias_menu', 
    'productos',
    'pedidos',
    'detalles_pedido',
    'clientes',
    'configuraciones_delivery',
    'configuraciones_marketing',
    'configuraciones_pagos',
    'usuarios'
);

-- 6. Mostrar conteo de registros en cada tabla
SELECT 'restaurantes' as tabla, COUNT(*) as registros FROM restaurantes
UNION ALL
SELECT 'categorias_menu', COUNT(*) FROM categorias_menu
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL
SELECT 'detalles_pedido', COUNT(*) FROM detalles_pedido
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'configuraciones_delivery', COUNT(*) FROM configuraciones_delivery
UNION ALL
SELECT 'configuraciones_marketing', COUNT(*) FROM configuraciones_marketing
UNION ALL
SELECT 'configuraciones_pagos', COUNT(*) FROM configuraciones_pagos
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios;
