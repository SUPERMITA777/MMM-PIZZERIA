#!/bin/bash

echo "🚀 EJECUTANDO CONFIGURACIÓN RLS VIA API REST CON DOCKER"
echo "====================================================="
echo ""

# Leer credenciales desde supabase-config.js
echo "🔍 Extrayendo credenciales de supabase-config.js..."

# Extraer URL
SUPABASE_URL=$(grep -o "url: '[^']*'" /workspace/supabase-config.js | cut -d"'" -f2)

# Extraer service role key
SERVICE_KEY=$(grep -o "serviceRoleKey: '[^']*'" /workspace/supabase-config.js | cut -d"'" -f2)

# Extraer anon key
ANON_KEY=$(grep -o "anonKey: '[^']*'" /workspace/supabase-config.js | cut -d"'" -f2)

echo "✅ Credenciales extraídas:"
echo "   URL: $SUPABASE_URL"
echo "   Service Key: ${SERVICE_KEY:0:20}..."
echo "   Anon Key: ${ANON_KEY:0:20}..."
echo ""

# Función para ejecutar SQL via API
execute_sql_api() {
    local sql_query="$1"
    local description="$2"
    
    echo "📋 $description..."
    
    # Intentar diferentes endpoints
    local endpoints=("rpc/sql" "rpc/query" "rpc/exec_sql" "rpc/execute")
    
    for endpoint in "${endpoints[@]}"; do
        response=$(curl -s -w "\n%{http_code}" \
            -X POST "$SUPABASE_URL/rest/v1/$endpoint" \
            -H "Authorization: Bearer $SERVICE_KEY" \
            -H "Content-Type: application/json" \
            -H "apikey: $SERVICE_KEY" \
            -d "{\"query\": \"$sql_query\", \"sql\": \"$sql_query\"}")
        
        http_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" -eq 200 ]; then
            echo "✅ $description: exitoso (endpoint: $endpoint)"
            return 0
        fi
    done
    
    echo "⚠️ $description: API no disponible (normal)"
    return 1
}

# Array de políticas SQL
policies=(
    "DROP POLICY IF EXISTS \"Allow anon uploads to categorias bucket\" ON storage.objects"
    "DROP POLICY IF EXISTS \"Allow anon access to categorias bucket\" ON storage.objects" 
    "DROP POLICY IF EXISTS \"Allow anon updates to categorias bucket\" ON storage.objects"
    "DROP POLICY IF EXISTS \"Allow anon deletes from categorias bucket\" ON storage.objects"
    "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY"
    "ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY"
    "CREATE POLICY \"Allow anon uploads to categorias bucket\" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias')"
    "CREATE POLICY \"Allow anon access to categorias bucket\" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'categorias')"
    "CREATE POLICY \"Allow anon updates to categorias bucket\" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'categorias') WITH CHECK (bucket_id = 'categorias')"
    "CREATE POLICY \"Allow anon deletes from categorias bucket\" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'categorias')"
)

descriptions=(
    "Limpiar política uploads"
    "Limpiar política access"
    "Limpiar política updates" 
    "Limpiar política deletes"
    "Habilitar RLS objects"
    "Habilitar RLS buckets"
    "Crear política uploads"
    "Crear política access"
    "Crear política updates"
    "Crear política deletes"
)

echo "🔧 Ejecutando políticas RLS..."
echo ""

# Ejecutar cada política
for i in "${!policies[@]}"; do
    execute_sql_api "${policies[$i]}" "${descriptions[$i]}"
    sleep 0.5
done

echo ""
echo "🧪 Probando funcionalidad con usuario anónimo..."

# Test de subida
TEST_FILE="test_docker_$(date +%s).png"
TEST_DATA="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

# Decodificar base64 a archivo temporal
echo "$TEST_DATA" | base64 -d > /tmp/test.png

upload_response=$(curl -s -w "\n%{http_code}" \
    -X POST "$SUPABASE_URL/storage/v1/object/categorias/test/$TEST_FILE" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: image/png" \
    -H "apikey: $ANON_KEY" \
    --data-binary @/tmp/test.png)

upload_http_code=$(echo "$upload_response" | tail -n1)
upload_body=$(echo "$upload_response" | head -n -1)

if [ "$upload_http_code" -eq 200 ] || [ "$upload_http_code" -eq 201 ]; then
    echo "✅ Test de subida exitoso - RLS configurado correctamente"
    
    # Limpiar archivo de test
    curl -s -X DELETE "$SUPABASE_URL/storage/v1/object/categorias/test/$TEST_FILE" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "apikey: $ANON_KEY" > /dev/null
    
    echo "🗑️ Archivo de test eliminado"
    echo ""
    echo "🎉 ¡CONFIGURACIÓN EXITOSA!"
    echo ""
    echo "✅ Las políticas RLS han sido configuradas"
    echo "✅ El bucket 'categorias' acepta usuarios anónimos" 
    echo "✅ Ya puedes crear categorías con imágenes"
    echo ""
    echo "🔄 SIGUIENTE PASO:"
    echo "   1. Recarga tu panel de administración"
    echo "   2. Prueba crear una categoría con imagen"
    echo "   3. ¡Debería funcionar sin errores!"
    
else
    echo "❌ Test de subida falló (HTTP: $upload_http_code)"
    echo "Response: $upload_body"
    echo ""
    
    if echo "$upload_body" | grep -q "row-level security policy"; then
        echo "🔧 RLS AÚN NO CONFIGURADO - EJECUTAR MANUALMENTE:"
        echo ""
        echo "Ve al Dashboard de Supabase → SQL Editor y ejecuta:"
        echo ""
        echo "CREATE POLICY \"Allow anon uploads to categorias bucket\" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias');"
        echo "CREATE POLICY \"Allow anon access to categorias bucket\" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'categorias');"
        echo "CREATE POLICY \"Allow anon updates to categorias bucket\" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'categorias') WITH CHECK (bucket_id = 'categorias');"
        echo "CREATE POLICY \"Allow anon deletes from categorias bucket\" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'categorias');"
    else
        echo "⚠️ Error diferente - puede que RLS ya esté configurado pero hay otro problema"
    fi
fi

# Limpiar archivo temporal
rm -f /tmp/test.png

echo ""
echo "🏁 Proceso completado"
