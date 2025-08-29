# 🗄️ Configuración de Base de Datos - Sistema Pedisy

## 📋 Resumen

Este documento explica cómo configurar la base de datos de Supabase para el sistema Pedisy, incluyendo la creación de tablas, inserción de datos de ejemplo y configuración de la conexión con el frontend.

## 🚀 Pasos para Configurar la Base de Datos

### 1. Acceder al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: `cwulvffuheotxzpocxla`

### 2. Crear las Tablas

1. En el menú lateral, ve a **SQL Editor**
2. Crea un nuevo query
3. Copia y pega todo el contenido del archivo `create-tables.sql`
4. Ejecuta el script completo

### 3. Verificar la Creación

El script incluye una consulta final que verifica que todas las tablas se crearon correctamente. Deberías ver algo como:

```
table_name              | estado
---------------------- | -------
categorias_menu        | ✅ CREADA
clientes               | ✅ CREADA
configuraciones_delivery| ✅ CREADA
configuraciones_marketing| ✅ CREADA
configuraciones_pagos  | ✅ CREADA
detalles_pedido        | ✅ CREADA
pedidos                | ✅ CREADA
productos              | ✅ CREADA
restaurantes           | ✅ CREADA
usuarios               | ✅ CREADA
```

## 🗂️ Estructura de la Base de Datos

### Tablas Principales

#### 1. **restaurantes**
- Información básica del restaurante
- Horarios, contacto, ubicación
- Logo y banner

#### 2. **categorias_menu**
- Categorías de productos (Entradas, Principales, Postres, etc.)
- Orden de visualización
- Imágenes de categoría

#### 3. **productos**
- Productos del menú
- Precios, descripciones, imágenes
- Relación con categorías y restaurante

#### 4. **clientes**
- Información de los clientes
- Datos de contacto y ubicación
- Coordenadas GPS para delivery

#### 5. **pedidos**
- Pedidos realizados por los clientes
- Estado del pedido, tipo de entrega
- Información de pago y delivery

#### 6. **detalles_pedido**
- Productos específicos en cada pedido
- Cantidades y precios
- Notas especiales

### Tablas de Configuración

#### 7. **configuraciones_delivery**
- Radio de delivery
- Costos por distancia
- Horarios y días de delivery

#### 8. **configuraciones_marketing**
- Redes sociales
- Newsletter y descuentos
- Programa de fidelidad

#### 9. **configuraciones_pagos**
- Métodos de pago habilitados
- Requisitos de anticipo
- Configuración de pagos digitales

#### 10. **usuarios**
- Usuarios del sistema administrativo
- Roles y permisos
- Autenticación

## 🔐 Configuración de Seguridad

### Row Level Security (RLS)

Para activar RLS en las tablas:

```sql
-- Activar RLS en todas las tablas
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
```

### Políticas de Acceso

```sql
-- Ejemplo: Solo usuarios autenticados pueden ver productos
CREATE POLICY "Usuarios autenticados pueden ver productos" ON productos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Ejemplo: Solo administradores pueden modificar configuraciones
CREATE POLICY "Solo administradores pueden modificar configuraciones" ON configuraciones_delivery
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

## 🔌 Integración con el Frontend

### 1. Incluir Supabase en el HTML

```html
<!-- Agregar en el <head> de tus archivos HTML -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
```

### 2. Usar las APIs

```javascript
// Ejemplo: Obtener productos
try {
    const productos = await PedisyAPI.productos.getProductos();
    console.log('Productos:', productos);
} catch (error) {
    console.error('Error:', error);
}

// Ejemplo: Crear un pedido
try {
    const pedido = await PedisyAPI.pedidos.createPedido({
        cliente_id: clienteId,
        restaurante_id: restauranteId,
        numero_pedido: 'PED-001',
        tipo_entrega: 'delivery',
        subtotal: 25.50,
        total: 30.00,
        metodo_pago: 'efectivo'
    });
    console.log('Pedido creado:', pedido);
} catch (error) {
    console.error('Error:', error);
}
```

## 📊 Datos de Ejemplo

El script incluye la inserción automática de:

- **Restaurante**: "Restaurante Pedisy" con información básica
- **Usuario**: "emanuel.cotta@gmail.com" con rol de administrador

## 🛠️ Comandos Útiles

### Verificar Estructura de una Tabla

```sql
-- Ver estructura de la tabla productos
\d productos

-- Ver datos de ejemplo
SELECT * FROM productos LIMIT 5;
```

### Limpiar Datos de Prueba

```sql
-- Eliminar todos los datos (¡CUIDADO!)
TRUNCATE TABLE detalles_pedido CASCADE;
TRUNCATE TABLE pedidos CASCADE;
TRUNCATE TABLE productos CASCADE;
TRUNCATE TABLE categorias_menu CASCADE;
TRUNCATE TABLE clientes CASCADE;
TRUNCATE TABLE usuarios CASCADE;
TRUNCATE TABLE restaurantes CASCADE;
```

### Backup y Restauración

```sql
-- Exportar estructura (desde psql)
pg_dump -h db.cwulvffuheotxzpocxla.supabase.co -U postgres -s pedisy > estructura.sql

-- Exportar datos
pg_dump -h db.cwulvffuheotxzpocxla.supabase.co -U postgres -a pedisy > datos.sql
```

## 🔍 Solución de Problemas

### Error: "relation does not exist"
- Verifica que hayas ejecutado el script completo
- Revisa que no haya errores de sintaxis
- Asegúrate de estar en el esquema correcto (`public`)

### Error: "permission denied"
- Verifica que tu usuario tenga permisos de administrador
- Revisa las políticas de RLS
- Confirma que estés usando la clave correcta

### Error: "duplicate key value"
- Los datos ya existen, es normal
- Usa `ON CONFLICT DO NOTHING` para evitar duplicados

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs de error en la consola
2. Verifica la documentación de Supabase
3. Consulta los mensajes de error específicos
4. Revisa que las credenciales sean correctas

## 🎯 Próximos Pasos

1. ✅ Crear las tablas (ejecutar `create-tables.sql`)
2. 🔄 Configurar políticas de seguridad (RLS)
3. 🔄 Insertar datos de productos y categorías
4. 🔄 Probar la conexión desde el frontend
5. 🔄 Implementar autenticación de usuarios
6. 🔄 Configurar notificaciones en tiempo real

---

**Nota**: Este sistema está diseñado para ser escalable. Puedes agregar más tablas según las necesidades específicas de tu restaurante.
