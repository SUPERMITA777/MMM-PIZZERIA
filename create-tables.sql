-- =====================================================
-- SCRIPT PARA CREAR LAS TABLAS DE LA BASE DE DATOS PEDISY
-- =====================================================

-- 1. TABLA DE RESTAURANTES
CREATE TABLE IF NOT EXISTS restaurantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    horario_apertura TIME,
    horario_cierre TIME,
    logo_url TEXT,
    banner_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE CATEGORÍAS DE MENÚ
CREATE TABLE IF NOT EXISTS categorias_menu (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias_menu(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    precio_oferta DECIMAL(10,2),
    imagen_url TEXT,
    disponible BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    tipo_entrega VARCHAR(50) NOT NULL,
    direccion_entrega TEXT,
    latitud_entrega DECIMAL(10,8),
    longitud_entrega DECIMAL(11,8),
    subtotal DECIMAL(10,2) NOT NULL,
    costo_delivery DECIMAL(10,2) DEFAULT 0,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    notas TEXT,
    tiempo_estimado_entrega INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE DETALLES DE PEDIDO
CREATE TABLE IF NOT EXISTS detalles_pedido (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DE CONFIGURACIONES DE DELIVERY
CREATE TABLE IF NOT EXISTS configuraciones_delivery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    radio_delivery INTEGER DEFAULT 5000,
    costo_delivery_base DECIMAL(10,2) DEFAULT 0,
    costo_por_km DECIMAL(10,2) DEFAULT 0,
    tiempo_entrega_estimado INTEGER DEFAULT 45,
    horario_delivery_inicio TIME DEFAULT '08:00:00',
    horario_delivery_fin TIME DEFAULT '23:00:00',
    dias_delivery INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA DE CONFIGURACIONES DE MARKETING
CREATE TABLE IF NOT EXISTS configuraciones_marketing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    redes_sociales JSONB DEFAULT '{}',
    newsletter_activo BOOLEAN DEFAULT false,
    descuentos_activos BOOLEAN DEFAULT false,
    programa_fidelidad BOOLEAN DEFAULT false,
    puntos_por_compra INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLA DE CONFIGURACIONES DE PAGOS
CREATE TABLE IF NOT EXISTS configuraciones_pagos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    efectivo BOOLEAN DEFAULT true,
    tarjeta BOOLEAN DEFAULT true,
    transferencia BOOLEAN DEFAULT false,
    pago_digital BOOLEAN DEFAULT false,
    requiere_anticipo BOOLEAN DEFAULT false,
    porcentaje_anticipo DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'empleado',
    restaurante_id UUID REFERENCES restaurantes(id),
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_restaurante ON productos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_restaurante ON pedidos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_detalles_pedido ON detalles_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_categorias_restaurante ON categorias_menu(restaurante_id);

-- =====================================================
-- INSERTAR DATOS DE EJEMPLO
-- =====================================================

-- Insertar restaurante de ejemplo
INSERT INTO restaurantes (nombre, descripcion, direccion, telefono, email, horario_apertura, horario_cierre, activo)
VALUES (
    'Restaurante Pedisy',
    'Restaurante de comida italiana y mediterránea',
    'Av. Principal 123, Ciudad',
    '+54 11 1234-5678',
    'info@pedisy.com',
    '08:00:00',
    '23:00:00',
    true
) ON CONFLICT DO NOTHING;

-- Insertar usuario administrador
INSERT INTO usuarios (email, password_hash, nombre, apellido, rol, restaurante_id, activo)
SELECT 
    'emanuel.cotta@gmail.com',
    'hash_temporal_123',
    'Emanuel',
    'Cotta',
    'admin',
    r.id,
    true
FROM restaurantes r
WHERE r.nombre = 'Restaurante Pedisy'
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAR QUE LAS TABLAS SE CREARON CORRECTAMENTE
-- =====================================================

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'restaurantes', 'categorias_menu', 'productos', 'clientes',
            'pedidos', 'detalles_pedido', 'configuraciones_delivery',
            'configuraciones_marketing', 'configuraciones_pagos', 'usuarios'
        ) THEN '✅ CREADA'
        ELSE '❌ NO CREADA'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'restaurantes', 'categorias_menu', 'productos', 'clientes',
    'pedidos', 'detalles_pedido', 'configuraciones_delivery',
    'configuraciones_marketing', 'configuraciones_pagos', 'usuarios'
)
ORDER BY table_name;
