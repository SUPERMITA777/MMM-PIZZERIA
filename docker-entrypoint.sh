#!/bin/bash

echo "🐳 Iniciando configuración de políticas RLS para Supabase..."
echo "📡 Conectando a: $PGHOST:$PGPORT"
echo "🗄️  Base de datos: $PGDATABASE"
echo "👤 Usuario: $PGUSER"
echo ""

# Esperar un momento para asegurar conectividad
sleep 2

# Verificar conectividad
echo "🔍 Verificando conectividad..."
if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"; then
    echo "✅ Conexión establecida exitosamente"
else
    echo "❌ Error de conectividad"
    exit 1
fi

echo ""
echo "📋 Ejecutando script de configuración RLS..."
echo "----------------------------------------"

# Ejecutar el script SQL
if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f /scripts/setup-categorias-rls.sql; then
    echo ""
    echo "✅ ¡Políticas RLS configuradas exitosamente!"
    echo ""
    echo "🎉 El bucket 'categorias' ahora debería funcionar correctamente"
    echo "   Puedes probar crear una categoría con imagen en tu aplicación"
else
    echo ""
    echo "❌ Error al ejecutar script SQL"
    exit 1
fi

echo ""
echo "🏁 Configuración completada"
