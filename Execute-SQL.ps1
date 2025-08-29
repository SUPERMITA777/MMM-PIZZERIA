# Script PowerShell para ejecutar SQL en Supabase via Docker

param(
    [Parameter(Mandatory=$true)]
    [string]$SqlFile,
    
    [switch]$UseAPI = $false
)

# Configuración de conexión
$Config = @{
    Host = "db.cwulvffuheotxzpocxla.supabase.co"
    Port = "5432"
    Database = "postgres"
    User = "postgres"
    Password = "SoleyEma2711"
    ServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM"
}

function Execute-PostgreSQL {
    param([string]$SqlFile)
    
    Write-Host "🐳 Ejecutando $SqlFile via Docker PostgreSQL..." -ForegroundColor Cyan
    
    # Verificar que el archivo existe
    if (-not (Test-Path $SqlFile)) {
        throw "Archivo $SqlFile no encontrado"
    }
    
    # Obtener ruta absoluta del directorio actual
    $CurrentPath = (Get-Location).Path
    
    # Comando Docker para PostgreSQL
    $DockerCommand = @"
docker run --rm -i \
  -v "${CurrentPath}:/workspace" \
  postgres:15 \
  psql "postgresql://$($Config.User):$($Config.Password)@$($Config.Host):$($Config.Port)/$($Config.Database)?sslmode=require" \
  -f /workspace/$SqlFile
"@
    
    Write-Host "📦 Ejecutando comando Docker..." -ForegroundColor Yellow
    
    try {
        Invoke-Expression $DockerCommand
        Write-Host "✅ SQL ejecutado exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error al ejecutar SQL: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Message -match "could not connect|network") {
            Write-Host "🔄 Intentando método alternativo con API..." -ForegroundColor Yellow
            Execute-ViaAPI -SqlFile $SqlFile
        }
        else {
            throw
        }
    }
}

function Execute-ViaAPI {
    param([string]$SqlFile)
    
    Write-Host "🌐 Ejecutando $SqlFile via Supabase REST API..." -ForegroundColor Cyan
    
    # Leer contenido del archivo SQL
    $SqlContent = Get-Content $SqlFile -Raw
    
    # Escapar comillas para JSON
    $EscapedSql = $SqlContent -replace '"', '\"' -replace "`n", "\n" -replace "`r", ""
    
    # Crear payload JSON
    $Payload = @{
        query = $EscapedSql
    } | ConvertTo-Json -Depth 10
    
    # Comando curl via Docker
    $CurlCommand = @"
docker run --rm \
  curlimages/curl \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $($Config.ServiceKey)" \
  -H "apikey: $($Config.ServiceKey)" \
  -d '$Payload' \
  "https://cwulvffuheotxzpocxla.supabase.co/rest/v1/rpc/exec_sql"
"@
    
    Write-Host "📡 Ejecutando via API REST..." -ForegroundColor Yellow
    
    try {
        Invoke-Expression $CurlCommand
        Write-Host "✅ SQL ejecutado via API" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error en método API: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# Función principal
function Main {
    Write-Host "🚀 Iniciando ejecución de SQL..." -ForegroundColor Green
    
    try {
        if ($UseAPI) {
            Execute-ViaAPI -SqlFile $SqlFile
        }
        else {
            Execute-PostgreSQL -SqlFile $SqlFile
        }
        
        Write-Host "🎉 Proceso completado exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "💥 Error general: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Ejecutar función principal
Main
