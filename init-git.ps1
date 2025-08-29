# Script PowerShell para inicializar Git y subir a GitHub
Write-Host "🚀 Inicializando repositorio Git para MMM Pizzería..." -ForegroundColor Green

# Verificar si ya existe un repositorio Git
if (Test-Path ".git") {
    Write-Host "⚠️  Ya existe un repositorio Git. Continuando..." -ForegroundColor Yellow
} else {
    Write-Host "📁 Inicializando repositorio Git..." -ForegroundColor Cyan
    git init
}

# Configurar repositorio remoto
Write-Host "🔗 Configurando repositorio remoto..." -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin https://github.com/SUPERMITA777/MMM-PIZZERIA.git

# Crear rama principal
Write-Host "🌿 Configurando rama principal..." -ForegroundColor Cyan
git branch -M main

# Agregar todos los archivos
Write-Host "📦 Agregando archivos al staging..." -ForegroundColor Cyan
git add .

# Hacer commit inicial
Write-Host "💾 Creando commit inicial..." -ForegroundColor Cyan
git commit -m "🍕 Initial commit: MMM Pizzería Management System

✨ Features:
- Panel de administración completo
- Gestión de categorías y productos
- Editor de imágenes interactivo
- Carta online responsive
- Configuración de colores dinámicos
- Sistema de carrito de compras

🛠️ Tech Stack:
- JavaScript ES6+
- Supabase (PostgreSQL + Storage)
- HTML5 + CSS3
- Vercel ready

🚀 Ready for deployment!"

# Subir a GitHub
Write-Host "⬆️  Subiendo a GitHub..." -ForegroundColor Cyan
git push -u origin main

Write-Host "✅ ¡Repositorio subido exitosamente a GitHub!" -ForegroundColor Green
Write-Host "🌐 URL: https://github.com/SUPERMITA777/MMM-PIZZERIA" -ForegroundColor Blue
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Ve a https://vercel.com" -ForegroundColor White
Write-Host "2. Conecta tu repositorio de GitHub" -ForegroundColor White
Write-Host "3. Configura las variables de entorno" -ForegroundColor White
Write-Host "4. ¡Deploy automático!" -ForegroundColor White
