#!/bin/bash

echo "🔐 Ejecutando configuración RLS con Docker..."
echo "📡 Conectando a Supabase PostgreSQL..."

# Configuración
PGHOST="db.cwulvffuheotxzpocxla.supabase.co"
PGPORT="5432"
PGDATABASE="postgres"
PGUSER="postgres"

# Solicitar contraseña si no está en variable de entorno
if [ -z "$PGPASSWORD" ]; then
    echo "🔑 Ingresa la contraseña de la base de datos de Supabase:"
    echo "   (Puedes encontrarla en Dashboard → Settings → Database → Connection string)"
    read -s PGPASSWORD
    export PGPASSWORD
fi

# Verificar conectividad
echo "🔍 Verificando conectividad..."
if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"; then
    echo "✅ Conexión establecida"
else
    echo "❌ Error de conectividad"
    echo "   Verifica que la dirección y credenciales sean correctas"
    exit 1
fi

echo ""
echo "📋 Ejecutando script de configuración RLS..."
echo "----------------------------------------"

# Ejecutar el script SQL
if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f /workspace/manual-rls-setup.sql; then
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

