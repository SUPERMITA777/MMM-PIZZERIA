const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 EJECUTANDO SQL CON DOCKER USANDO CREDENCIALES COMPLETAS');
console.log('======================================================');
console.log('');

// Leer credenciales desde supabase-config.js
function extractSupabaseConfig() {
    try {
        const configContent = fs.readFileSync('supabase-config.js', 'utf8');
        
        // Extraer configuración usando regex
        const urlMatch = configContent.match(/url:\s*['"]([^'"]*)['"]/);
        const passwordMatch = configContent.match(/password:\s*['"]([^'"]*)['"]/);
        const hostMatch = configContent.match(/host:\s*['"]([^'"]*)['"]/);
        const serviceKeyMatch = configContent.match(/serviceRoleKey:\s*['"]([^'"]*)['"]/);
        const anonKeyMatch = configContent.match(/anonKey:\s*['"]([^'"]*)['"]/);
        
        if (!urlMatch || !passwordMatch || !hostMatch) {
            throw new Error('No se pudieron extraer todas las credenciales');
        }
        
        return {
            url: urlMatch[1],
            host: hostMatch[1],
            port: '5432',
            database: 'postgres',
            user: 'postgres',
            password: passwordMatch[1],
            serviceRoleKey: serviceKeyMatch ? serviceKeyMatch[1] : null,
            anonKey: anonKeyMatch ? anonKeyMatch[1] : null
        };
    } catch (error) {
        console.error('❌ Error al leer configuración:', error.message);
        process.exit(1);
    }
}

// Función para ejecutar Docker con PostgreSQL
function executeDockerSQL(config) {
    console.log('📋 Configuración extraída:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${'*'.repeat(config.password.length)}`);
    console.log('');
    
    // Verificar que el archivo SQL existe
    if (!fs.existsSync('manual-rls-setup.sql')) {
        console.error('❌ Archivo manual-rls-setup.sql no encontrado');
        process.exit(1);
    }
    
    console.log('🐳 Ejecutando Docker con PostgreSQL...');
    console.log('');
    
    // Construir comando Docker
    const dockerCommand = [
        'docker', 'run', '--rm', '-i',
        '-v', `"${process.cwd()}:/workspace"`,
        '-e', `PGPASSWORD=${config.password}`,
        'postgres:15',
        'psql',
        '-h', config.host,
        '-p', config.port,
        '-U', config.user,
        '-d', config.database,
        '-f', '/workspace/manual-rls-setup.sql'
    ].join(' ');
    
    console.log('📝 Comando Docker:');
    console.log(dockerCommand.replace(config.password, '*'.repeat(config.password.length)));
    console.log('');
    
    try {
        console.log('⚡ Ejecutando...');
        console.log('----------------------------------------');
        
        const result = execSync(dockerCommand, {
            stdio: 'inherit',
            shell: true,
            cwd: process.cwd()
        });
        
        console.log('----------------------------------------');
        console.log('✅ ¡SQL EJECUTADO EXITOSAMENTE!');
        console.log('');
        
        return true;
    } catch (error) {
        console.log('----------------------------------------');
        console.log('❌ Error al ejecutar Docker:', error.message);
        console.log('');
        return false;
    }
}

// Función para probar la configuración con Node.js
async function testWithNodeJS(config) {
    console.log('🧪 Probando configuración con Node.js...');
    
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        // Probar con usuario anónimo
        const supabaseAnon = createClient(config.url, config.anonKey);
        
        const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        const testFileName = `test_final_${Date.now()}.png`;
        
        const { data, error } = await supabaseAnon.storage
            .from('categorias')
            .upload(`test/${testFileName}`, testImageData, {
                contentType: 'image/png'
            });
            
        if (error) {
            if (error.message.includes('row-level security policy')) {
                console.log('❌ RLS aún no configurado correctamente');
                return false;
            } else {
                console.log('⚠️ Error diferente:', error.message);
                return false;
            }
        } else {
            console.log('✅ Test exitoso - RLS funcionando');
            
            // Limpiar archivo de test
            await supabaseAnon.storage
                .from('categorias')
                .remove([`test/${testFileName}`]);
                
            return true;
        }
    } catch (error) {
        console.log('⚠️ No se pudo probar con Node.js:', error.message);
        return false;
    }
}

// Función principal
async function main() {
    console.log('🔍 Extrayendo credenciales de supabase-config.js...');
    const config = extractSupabaseConfig();
    console.log('✅ Credenciales extraídas exitosamente');
    console.log('');
    
    // Ejecutar SQL con Docker
    const dockerSuccess = executeDockerSQL(config);
    
    if (dockerSuccess) {
        console.log('⏳ Esperando que se propaguen las políticas...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Probar configuración
        const testSuccess = await testWithNodeJS(config);
        
        console.log('');
        if (testSuccess) {
            console.log('🎉 ¡CONFIGURACIÓN COMPLETA Y FUNCIONANDO!');
            console.log('');
            console.log('✅ Las políticas RLS han sido configuradas exitosamente');
            console.log('✅ El bucket "categorias" acepta usuarios anónimos');
            console.log('✅ La aplicación puede subir imágenes sin errores');
            console.log('');
            console.log('🔄 PRÓXIMO PASO:');
            console.log('   1. Recarga tu panel de administración');
            console.log('   2. Prueba crear una categoría con imagen');
            console.log('   3. ¡Debería funcionar perfectamente!');
        } else {
            console.log('⚠️ SQL ejecutado pero test falló');
            console.log('   Puede que necesite unos minutos para propagarse');
            console.log('   Prueba crear una categoría en 2-3 minutos');
        }
    } else {
        console.log('🔧 ALTERNATIVA - Ejecutar manualmente:');
        console.log('   1. Ve al Dashboard de Supabase');
        console.log('   2. SQL Editor');
        console.log('   3. Ejecuta el contenido de manual-rls-setup.sql');
    }
    
    console.log('');
    console.log('🏁 Proceso completado');
}

// Ejecutar
main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
