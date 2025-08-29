#!/bin/bash

echo "🐳 EJECUTANDO SQL DIRECTAMENTE EN SUPABASE CON DOCKER"
echo "=================================================="
echo ""

# Configuración de Supabase
PGHOST="db.cwulvffuheotxzpocxla.supabase.co"
PGPORT="5432"
PGDATABASE="postgres"
PGUSER="postgres"

# Función para obtener la contraseña
get_password() {
    echo "🔑 NECESITO LA CONTRASEÑA DE LA BASE DE DATOS DE SUPABASE"
    echo ""
    echo "📍 Para obtenerla:"
    echo "   1. Ve a: https://supabase.com/dashboard"
    echo "   2. Selecciona tu proyecto"
    echo "   3. Settings → Database"
    echo "   4. Connection string"
    echo "   5. Copia la contraseña (la parte después de 'postgres://postgres:')"
    echo ""
    
    # Intentar leer desde archivo .pgpass si existe
    if [ -f "/workspace/.pgpass" ]; then
        echo "📄 Encontré archivo .pgpass, usando contraseña guardada..."
        export PGPASSWORD=$(cat /workspace/.pgpass)
        return 0
    fi
    
    echo "🔒 Ingresa la contraseña:"
    read -s password
    export PGPASSWORD="$password"
    echo ""
    
    # Guardar contraseña para futuros usos
    echo "$password" > /workspace/.pgpass
    chmod 600 /workspace/.pgpass
}

# Función para probar conectividad
test_connection() {
    echo "🔍 Probando conectividad con Supabase..."
    
    if timeout 10 pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"; then
        echo "✅ Conectividad exitosa"
        return 0
    else
        echo "❌ No se pudo conectar"
        echo "   Posibles causas:"
        echo "   - Contraseña incorrecta"
        echo "   - Problemas de red/firewall"
        echo "   - Supabase temporal no disponible"
        return 1
    fi
}

# Función para ejecutar el SQL
execute_rls_sql() {
    echo "📋 Ejecutando configuración RLS..."
    echo ""
    
    # Mostrar el SQL que se va a ejecutar
    echo "📝 SQL a ejecutar:"
    echo "----------------------------------------"
    cat /workspace/manual-rls-setup.sql
    echo "----------------------------------------"
    echo ""
    
    # Ejecutar el archivo SQL
    if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f /workspace/manual-rls-setup.sql; then
        echo ""
        echo "✅ ¡SQL EJECUTADO EXITOSAMENTE!"
        echo ""
        return 0
    else
        echo ""
        echo "❌ Error al ejecutar SQL"
        return 1
    fi
}

# Función para verificar las políticas creadas
verify_policies() {
    echo "🔍 Verificando que las políticas se crearon correctamente..."
    echo ""
    
    # SQL para verificar políticas
    VERIFY_SQL="SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%categorias%' ORDER BY policyname;"
    
    echo "📊 Políticas encontradas:"
    echo "----------------------------------------"
    if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "$VERIFY_SQL"; then
        echo "----------------------------------------"
        echo "✅ Verificación completada"
        return 0
    else
        echo "⚠️ No se pudo verificar las políticas"
        return 1
    fi
}

# Función principal
main() {
    echo "🚀 Iniciando configuración automática..."
    echo ""
    
    # Paso 1: Obtener contraseña
    get_password
    
    # Paso 2: Probar conectividad
    if ! test_connection; then
        echo ""
        echo "💡 SOLUCIÓN ALTERNATIVA:"
        echo "   Si Docker no puede conectar, puedes:"
        echo "   1. Ejecutar manualmente en Dashboard de Supabase"
        echo "   2. Usar herramientas locales como pgAdmin"
        echo "   3. Verificar configuración de firewall/VPN"
        return 1
    fi
    
    # Paso 3: Ejecutar SQL
    if execute_rls_sql; then
        echo "🎉 CONFIGURACIÓN EXITOSA"
        
        # Paso 4: Verificar políticas
        verify_policies
        
        echo ""
        echo "🏁 PROCESO COMPLETADO"
        echo ""
        echo "✅ Las políticas RLS han sido configuradas"
        echo "✅ El bucket 'categorias' ahora acepta usuarios anónimos"
        echo "✅ Puedes crear categorías con imágenes"
        echo ""
        echo "🔄 SIGUIENTE PASO:"
        echo "   1. Recarga tu panel de administración"
        echo "   2. Prueba crear una categoría con imagen"
        echo "   3. ¡Debería funcionar sin errores!"
        
    else
        echo ""
        echo "❌ CONFIGURACIÓN FALLÓ"
        echo ""
        echo "🔧 SOLUCIÓN MANUAL:"
        echo "   1. Ve al Dashboard de Supabase"
        echo "   2. SQL Editor"
        echo "   3. Ejecuta el contenido de manual-rls-setup.sql"
    fi
}

# Ejecutar función principal
main
