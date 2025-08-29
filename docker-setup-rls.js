const { execSync } = require('child_process');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM';

// Extraer información de conexión de la URL de Supabase
const projectRef = 'cwulvffuheotxzpocxla';
const dbHost = `db.${projectRef}.supabase.co`;
const dbPort = '5432';
const dbName = 'postgres';
const dbUser = 'postgres';

console.log('🐳 Configurando políticas RLS usando Docker...');

// Crear el archivo SQL con todas las políticas necesarias
const sqlContent = `
-- =====================================================
-- LIMPIAR POLÍTICAS EXISTENTES PARA CATEGORIAS
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow public uploads to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to view categorias bucket" ON storage.buckets;

-- =====================================================
-- CREAR POLÍTICAS RLS PARA BUCKET "CATEGORIAS"
-- =====================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Política para permitir que anon vea el bucket categorias
CREATE POLICY "Allow anon to view categorias bucket"
ON storage.buckets 
FOR SELECT 
TO anon
USING (name = 'categorias');

-- Política para permitir que cualquiera suba archivos al bucket categorias
CREATE POLICY "Allow public uploads to categorias bucket"
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'categorias');

-- Política para permitir que cualquiera lea archivos del bucket categorias
CREATE POLICY "Allow public access to categorias bucket"
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'categorias');

-- Política para permitir actualizar archivos del bucket categorias
CREATE POLICY "Allow updates to categorias bucket"
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'categorias')
WITH CHECK (bucket_id = 'categorias');

-- Política para permitir eliminar archivos del bucket categorias
CREATE POLICY "Allow deletes from categorias bucket"
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'categorias');

-- =====================================================
-- VERIFICAR POLÍTICAS CREADAS
-- =====================================================

-- Mostrar todas las políticas para storage.objects relacionadas con categorias
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%categorias%';

-- Mostrar todas las políticas para storage.buckets relacionadas con categorias
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'buckets' 
AND schemaname = 'storage' 
AND policyname LIKE '%categorias%';

\\echo '✅ Políticas RLS para bucket categorias configuradas exitosamente'
`;

// Escribir el archivo SQL
fs.writeFileSync('setup-categorias-rls.sql', sqlContent);
console.log('📄 Archivo SQL creado: setup-categorias-rls.sql');

async function setupRLSWithDocker() {
    try {
        console.log('🔐 Solicitando contraseña de base de datos...');
        console.log('');
        console.log('⚠️  IMPORTANTE: Necesitas la contraseña de la base de datos de Supabase');
        console.log('   Puedes encontrarla en: Dashboard → Settings → Database → Connection string');
        console.log('');
        
        // Crear comando Docker para conectar a Supabase PostgreSQL
        const dockerCommand = `docker run --rm -it \\
            -v "${process.cwd()}:/workspace" \\
            postgres:15 \\
            psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f /workspace/setup-categorias-rls.sql`;

        console.log('🐳 Comando Docker generado:');
        console.log('');
        console.log(dockerCommand);
        console.log('');
        
        console.log('📋 Para ejecutar manualmente:');
        console.log('1. Copia el comando de arriba');
        console.log('2. Pégalo en tu terminal');
        console.log('3. Ingresa la contraseña cuando se solicite');
        console.log('');
        
        // Intentar ejecutar automáticamente (puede requerir interacción del usuario)
        console.log('🚀 Intentando ejecutar automáticamente...');
        
        const result = execSync(dockerCommand, { 
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd()
        });
        
        console.log('✅ Políticas RLS configuradas exitosamente');
        
    } catch (error) {
        console.log('⚠️  Ejecución automática falló. Ejecuta manualmente:');
        console.log('');
        console.log(`docker run --rm -it -v "${process.cwd()}:/workspace" postgres:15 psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f /workspace/setup-categorias-rls.sql`);
        console.log('');
        console.log('O usa este comando alternativo con PowerShell:');
        console.log('');
        console.log(`docker run --rm -it -v "${process.cwd().replace(/\\/g, '/')}:/workspace" postgres:15 psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f /workspace/setup-categorias-rls.sql`);
    }
}

// Función alternativa usando curl para ejecutar SQL via API REST
async function setupRLSWithAPI() {
    console.log('');
    console.log('🌐 Alternativa: Usar API REST de Supabase');
    console.log('');
    
    const curlCommand = `curl -X POST "${supabaseUrl}/rest/v1/rpc/exec_sql" \\
  -H "Authorization: Bearer ${serviceRoleKey}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${serviceRoleKey}" \\
  -d '{"sql": "SELECT version();"}'`;
    
    console.log('📋 Comando curl para probar conexión:');
    console.log(curlCommand);
}

// Ejecutar configuración
console.log('');
console.log('🎯 Opciones disponibles:');
console.log('1. Usar Docker + PostgreSQL (recomendado)');
console.log('2. Usar API REST (alternativa)');
console.log('');

setupRLSWithDocker();
setupRLSWithAPI();

console.log('');
console.log('📝 Archivo SQL creado en: setup-categorias-rls.sql');
console.log('   Puedes ejecutarlo manualmente en el SQL Editor de Supabase si prefieres');
