#!/bin/bash

# Script para inicializar Git y subir a GitHub
echo "🚀 Inicializando repositorio Git para MMM Pizzería..."

# Verificar si ya existe un repositorio Git
if [ -d ".git" ]; then
    echo "⚠️  Ya existe un repositorio Git. Continuando..."
else
    echo "📁 Inicializando repositorio Git..."
    git init
fi

# Configurar repositorio remoto
echo "🔗 Configurando repositorio remoto..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/SUPERMITA777/MMM-PIZZERIA.git

# Crear rama principal
echo "🌿 Configurando rama principal..."
git branch -M main

# Agregar todos los archivos
echo "📦 Agregando archivos al staging..."
git add .

# Hacer commit inicial
echo "💾 Creando commit inicial..."
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
echo "⬆️  Subiendo a GitHub..."
git push -u origin main

echo "✅ ¡Repositorio subido exitosamente a GitHub!"
echo "🌐 URL: https://github.com/SUPERMITA777/MMM-PIZZERIA"
echo ""
echo "📝 Próximos pasos:"
echo "1. Ve a https://vercel.com"
echo "2. Conecta tu repositorio de GitHub"
echo "3. Configura las variables de entorno"
echo "4. ¡Deploy automático!"
