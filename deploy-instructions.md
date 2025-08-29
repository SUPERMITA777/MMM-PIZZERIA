# 🚀 Instrucciones de Deployment - MMM Pizzería

## 📋 Checklist Pre-Deployment

### ✅ Archivos Preparados
- [x] `.gitignore` - Archivos excluidos
- [x] `package.json` - Dependencias y scripts
- [x] `vercel.json` - Configuración de Vercel
- [x] `README.md` - Documentación completa
- [x] `env.example` - Variables de entorno de ejemplo

## 🔧 Paso 1: Subir a GitHub

### Opción A: Script Automático (Windows)
```powershell
.\init-git.ps1
```

### Opción B: Script Automático (Linux/Mac)
```bash
chmod +x init-git.sh
./init-git.sh
```

### Opción C: Manual
```bash
git init
git remote add origin https://github.com/SUPERMITA777/MMM-PIZZERIA.git
git branch -M main
git add .
git commit -m "🍕 Initial commit: MMM Pizzería Management System"
git push -u origin main
```

## 🌐 Paso 2: Deployment en Vercel

### 2.1 Conectar Repositorio
1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio `SUPERMITA777/MMM-PIZZERIA`
5. Haz clic en "Import"

### 2.2 Configurar Variables de Entorno
En el dashboard de Vercel, ve a Settings > Environment Variables y agrega:

```
VITE_SUPABASE_URL=https://cwulvffuheotxzpocxla.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MVg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log
```

### 2.3 Deploy
1. Haz clic en "Deploy"
2. Espera a que termine el build
3. ¡Listo! Tu aplicación estará disponible en la URL asignada

## 📱 URLs Finales

Una vez deployado, tendrás acceso a:
- **Panel Admin**: `https://tu-proyecto.vercel.app/`
- **Carta Online**: `https://tu-proyecto.vercel.app/carta-online.html`

## 🔄 Actualizaciones Automáticas

Cada vez que hagas push a la rama `main`, Vercel automáticamente:
1. Detectará los cambios
2. Ejecutará el build
3. Deployará la nueva versión
4. Te notificará por email

## 🔒 Configuración de Dominio Personalizado (Opcional)

1. En Vercel, ve a Settings > Domains
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones
4. ¡Listo!

## 🐛 Troubleshooting

### Error de Build
- Verificar que `package.json` esté correcto
- Revisar que no haya errores de sintaxis en JavaScript
- Comprobar que todos los archivos estén commiteados

### Variables de Entorno
- Asegurar que las keys de Supabase sean correctas
- Verificar que no hayan expirado
- Confirmar que el formato sea exacto (sin espacios extra)

### Problemas de Storage
- Verificar que los buckets existan en Supabase
- Confirmar que las políticas RLS estén aplicadas
- Revisar permisos de los buckets

## 📞 Soporte

Si encuentras algún problema durante el deployment, revisa:
1. Los logs de build en Vercel
2. La consola del navegador para errores JavaScript
3. El dashboard de Supabase para problemas de backend

---

**¡Tu sistema MMM Pizzería está listo para producción! 🍕✨**
