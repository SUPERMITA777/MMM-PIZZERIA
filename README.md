# 🍕 MMM Pizzería - Sistema de Gestión de Menú

Sistema completo de gestión de menú y carta online para MMM Pizzería, desarrollado con JavaScript vanilla y Supabase.

## 🌟 Características

### 📊 Panel de Administración
- **Gestión de Categorías**: Crear, editar y eliminar categorías con imágenes banner
- **Gestión de Productos**: CRUD completo de productos con editor de imágenes avanzado
- **Editor de Imágenes Interactivo**: Recorte drag & drop con vista previa cuadrada
- **Filtrado Dinámico**: Productos filtrados por categoría seleccionada
- **Configuración de Carta Online**: Personalización de colores, logo y banners

### 🌐 Carta Online
- **Diseño Responsive**: Optimizado para móviles y desktop
- **Layout 2 Columnas**: Productos con imágenes cuadradas (desktop)
- **Banners de Categorías**: Separadores visuales sin texto superpuesto
- **Carrito de Compras**: Funcionalidad completa de pedidos
- **Personalización**: Colores dinámicos y transparencias configurables

## 🚀 Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Hosting**: Vercel
- **Versionado**: Git + GitHub

## 📁 Estructura del Proyecto

```
MMM-PIZZERIA/
├── index.html              # Panel de administración
├── carta-online.html       # Carta online para clientes
├── styles.css              # Estilos del panel admin
├── carta-online.css        # Estilos de la carta online
├── script.js               # Lógica del panel admin
├── carta-online.js         # Lógica de la carta online
├── supabase-config.js      # Configuración y API de Supabase
├── create-tables.sql       # Esquema de base de datos
├── productos-rls-setup.sql # Políticas de seguridad
├── package.json            # Dependencias del proyecto
├── vercel.json            # Configuración de Vercel
└── README.md              # Documentación
```

## 🛠️ Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/SUPERMITA777/MMM-PIZZERIA.git
cd MMM-PIZZERIA
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Supabase
1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar el SQL de `create-tables.sql` en el SQL Editor
3. Ejecutar el SQL de `productos-rls-setup.sql` para las políticas
4. Actualizar credenciales en `supabase-config.js`

### 4. Crear Buckets de Storage
```bash
npm run setup
```

### 5. Ejecutar en Desarrollo
```bash
npm run dev
```

## 🌐 Despliegue en Vercel

### Opción 1: Desde GitHub (Recomendado)
1. Hacer push del código a GitHub
2. Conectar repositorio en [Vercel](https://vercel.com)
3. Configurar variables de entorno (ver sección Variables)
4. Deploy automático

### Opción 2: CLI de Vercel
```bash
npm install -g vercel
vercel --prod
```

## 🔧 Variables de Entorno para Vercel

Configurar las siguientes variables en el dashboard de Vercel:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 📱 URLs del Sistema

- **Panel Admin**: `https://tu-dominio.vercel.app/`
- **Carta Online**: `https://tu-dominio.vercel.app/carta-online.html`

## 🎯 Funcionalidades Principales

### Panel de Administración
1. **Gestión de Categorías**
   - Crear categorías con nombre e imagen banner
   - Editar y eliminar categorías existentes
   - Filtrado automático de productos

2. **Gestión de Productos**
   - Formulario completo (nombre, descripción, precio, categoría)
   - Editor de imágenes interactivo con drag & drop
   - Vista previa cuadrada en tiempo real
   - Botón "Guardar Imagen" para asociar al producto

3. **Configuración Carta Online**
   - Personalización de colores primario, secundario y fondo
   - Upload de logo y banners
   - Configuración de categorías visibles
   - Vista previa en tiempo real

### Carta Online
1. **Navegación por Categorías**
   - Navegación sticky con categorías
   - Banners visuales sin texto superpuesto
   - Scroll automático a secciones

2. **Visualización de Productos**
   - Layout responsive (2 columnas desktop, 1 móvil)
   - Imágenes cuadradas optimizadas
   - Transparencia 70% en pastillas de productos
   - Información completa (nombre, descripción, precio)

3. **Carrito de Compras**
   - Agregar/quitar productos
   - Cálculo automático de totales
   - Modal de checkout

## 🔒 Seguridad

- **RLS (Row Level Security)** configurado en Supabase
- **Políticas de Storage** para buckets de imágenes
- **Headers de seguridad** configurados en Vercel
- **Validación** de archivos de imagen (tipo y tamaño)

## 🐛 Troubleshooting

### Imágenes no se muestran
1. Verificar que el bucket "productos" existe en Supabase Storage
2. Confirmar que las políticas RLS están aplicadas
3. Usar el botón "Guardar Imagen" después de subir

### Error de credenciales
1. Verificar URLs y keys en `supabase-config.js`
2. Confirmar que las keys no han expirado
3. Revisar permisos del proyecto en Supabase

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo.

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Desarrollado con ❤️ para MMM Pizzería**