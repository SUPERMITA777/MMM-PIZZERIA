# Script PowerShell para configurar políticas RLS en Supabase
param(
    [string]$Action = "setup"
)

# Configuración
$supabaseUrl = "https://cwulvffuheotxzpocxla.supabase.co"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM"

Write-Host "🔐 Configurando políticas RLS para bucket categorias..." -ForegroundColor Cyan

# Función para ejecutar SQL usando la API REST de Supabase
function Invoke-SupabaseSQL {
    param([string]$SqlQuery)
    
    $headers = @{
        "Authorization" = "Bearer $serviceRoleKey"
        "Content-Type" = "application/json"
        "apikey" = $serviceRoleKey
    }
    
    $body = @{
        "query" = $SqlQuery
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/query" -Method POST -Headers $headers -Body $body
        return $response
    } catch {
        Write-Host "⚠️ Error con método query, probando sql..." -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/sql" -Method POST -Headers $headers -Body $body
            return $response
        } catch {
            Write-Host "❌ Error ejecutando SQL: $($_.Exception.Message)" -ForegroundColor Red
            return $null
        }
    }
}

# Políticas SQL para configurar
$policies = @(
    @{
        name = "Limpiar política anon uploads categorias"
        sql = "DROP POLICY IF EXISTS `"Allow anon uploads to categorias bucket`" ON storage.objects;"
    },
    @{
        name = "Limpiar política anon access categorias"
        sql = "DROP POLICY IF EXISTS `"Allow anon access to categorias bucket`" ON storage.objects;"
    },
    @{
        name = "Habilitar RLS en storage.objects"
        sql = "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;"
    },
    @{
        name = "Habilitar RLS en storage.buckets"
        sql = "ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;"
    },
    @{
        name = "Crear política anon uploads para categorias"
        sql = "CREATE POLICY `"Allow anon uploads to categorias bucket`" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias');"
    },
    @{
        name = "Crear política anon access para categorias"
        sql = "CREATE POLICY `"Allow anon access to categorias bucket`" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'categorias');"
    },
    @{
        name = "Crear política anon updates para categorias"
        sql = "CREATE POLICY `"Allow anon updates to categorias bucket`" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'categorias') WITH CHECK (bucket_id = 'categorias');"
    },
    @{
        name = "Crear política anon deletes para categorias"
        sql = "CREATE POLICY `"Allow anon deletes from categorias bucket`" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'categorias');"
    }
)

# Ejecutar cada política
foreach ($policy in $policies) {
    Write-Host "📋 $($policy.name)..." -ForegroundColor Yellow
    
    $result = Invoke-SupabaseSQL -SqlQuery $policy.sql
    
    if ($result) {
        Write-Host "✅ $($policy.name): exitoso" -ForegroundColor Green
    } else {
        Write-Host "⚠️ $($policy.name): puede haber fallado (normal para DROP)" -ForegroundColor Yellow
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "🧪 Probando funcionalidad..." -ForegroundColor Cyan

# Test usando curl
$testHeaders = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log"
    "Content-Type" = "application/octet-stream"
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log"
}

$testFile = [System.Text.Encoding]::UTF8.GetBytes("test data")
$testPath = "test/test_powershell_$(Get-Date -Format 'yyyyMMddHHmmss').txt"

try {
    $uploadResponse = Invoke-RestMethod -Uri "$supabaseUrl/storage/v1/object/categorias/$testPath" -Method POST -Headers $testHeaders -Body $testFile
    Write-Host "✅ Test de subida exitoso - RLS configurado correctamente" -ForegroundColor Green
    
    # Limpiar archivo de test
    try {
        Invoke-RestMethod -Uri "$supabaseUrl/storage/v1/object/categorias/$testPath" -Method DELETE -Headers $testHeaders
        Write-Host "🗑️ Archivo de test eliminado" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️ No se pudo eliminar archivo de test (normal)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 ¡Configuración completa! Ahora puedes crear categorías con imágenes." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Test de subida falló: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 CONFIGURACIÓN MANUAL REQUERIDA:" -ForegroundColor Yellow
    Write-Host "1. Ve al Dashboard de Supabase (https://supabase.com/dashboard)" -ForegroundColor White
    Write-Host "2. Ve a Storage → Policies" -ForegroundColor White
    Write-Host "3. Busca el bucket 'categorias'" -ForegroundColor White
    Write-Host "4. Crea una nueva política:" -ForegroundColor White
    Write-Host "   - Policy name: Allow anon uploads to categorias bucket" -ForegroundColor White
    Write-Host "   - Allowed operation: INSERT" -ForegroundColor White
    Write-Host "   - Target roles: anon" -ForegroundColor White
    Write-Host "   - WITH CHECK expression: bucket_id = 'categorias'" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Repite para operaciones SELECT, UPDATE y DELETE" -ForegroundColor White
}

Write-Host ""
Write-Host "🏁 Proceso completado" -ForegroundColor Cyan

