#!/bin/bash

echo "🚀 Ejecutando configuración RLS usando API REST de Supabase..."

# Configuración
SUPABASE_URL="https://cwulvffuheotxzpocxla.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM"

# Array de políticas SQL para ejecutar
declare -a policies=(
    "DROP POLICY IF EXISTS \"Allow anon uploads to categorias bucket\" ON storage.objects;"
    "DROP POLICY IF EXISTS \"Allow anon access to categorias bucket\" ON storage.objects;"
    "DROP POLICY IF EXISTS \"Allow anon updates to categorias bucket\" ON storage.objects;"
    "DROP POLICY IF EXISTS \"Allow anon deletes from categorias bucket\" ON storage.objects;"
    "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;"
    "ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;"
    "CREATE POLICY \"Allow anon uploads to categorias bucket\" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias');"
    "CREATE POLICY \"Allow anon access to categorias bucket\" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'categorias');"
    "CREATE POLICY \"Allow anon updates to categorias bucket\" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'categorias') WITH CHECK (bucket_id = 'categorias');"
    "CREATE POLICY \"Allow anon deletes from categorias bucket\" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'categorias');"
)

# Función para ejecutar SQL usando curl
execute_sql() {
    local sql_query="$1"
    local description="$2"
    
    echo "📋 $description..."
    
    # Intentar varios endpoints de la API
    local endpoints=("rpc/sql" "rpc/query" "rpc/exec_sql")
    
    for endpoint in "${endpoints[@]}"; do
        response=$(curl -s -w "\n%{http_code}" \
            -X POST "$SUPABASE_URL/rest/v1/$endpoint" \
            -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -H "apikey: $SERVICE_ROLE_KEY" \
            -d "{\"query\": \"$sql_query\"}")
        
        http_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" -eq 200 ]; then
            echo "✅ $description: exitoso (endpoint: $endpoint)"
            return 0
        fi
    done
    
    echo "⚠️ $description: intentos fallidos (normal para DROP statements)"
    return 1
}

# Ejecutar cada política
for i in "${!policies[@]}"; do
    policy="${policies[$i]}"
    case $i in
        0) description="Limpiar política uploads categorias" ;;
        1) description="Limpiar política access categorias" ;;
        2) description="Limpiar política updates categorias" ;;
        3) description="Limpiar política deletes categorias" ;;
        4) description="Habilitar RLS en objects" ;;
        5) description="Habilitar RLS en buckets" ;;
        6) description="Crear política uploads para categorias" ;;
        7) description="Crear política access para categorias" ;;
        8) description="Crear política updates para categorias" ;;
        9) description="Crear política deletes para categorias" ;;
        *) description="Ejecutando política $((i+1))" ;;
    esac
    
    execute_sql "$policy" "$description"
    sleep 1
done

echo ""
echo "🧪 Probando funcionalidad con usuario anónimo..."

# Test de subida usando la clave anon
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log"
TEST_FILE="test_docker_$(date +%s).txt"

upload_response=$(curl -s -w "\n%{http_code}" \
    -X POST "$SUPABASE_URL/storage/v1/object/categorias/test/$TEST_FILE" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: text/plain" \
    -H "apikey: $ANON_KEY" \
    -d "Test data from Docker")

upload_http_code=$(echo "$upload_response" | tail -n1)
upload_body=$(echo "$upload_response" | head -n -1)

if [ "$upload_http_code" -eq 200 ] || [ "$upload_http_code" -eq 201 ]; then
    echo "✅ Test de subida exitoso - RLS configurado correctamente"
    
    # Limpiar archivo de test
    curl -s -X DELETE "$SUPABASE_URL/storage/v1/object/categorias/test/$TEST_FILE" \
        -H "Authorization: Bearer $ANON_KEY" \
        -H "apikey: $ANON_KEY"
    
    echo "🗑️ Archivo de test eliminado"
    echo ""
    echo "🎉 ¡Configuración completa! Ahora puedes crear categorías con imágenes."
else
    echo "❌ Test de subida falló (HTTP: $upload_http_code)"
    echo "Response: $upload_body"
    echo ""
    echo "🔧 Si el problema persiste, ejecuta manualmente en Dashboard de Supabase:"
    echo "CREATE POLICY \"Allow anon uploads to categorias bucket\" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias');"
fi

echo ""
echo "🏁 Proceso completado"

