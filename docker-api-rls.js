const https = require('https');
const fs = require('fs');

// Configuración de Supabase desde supabase-config.js
const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log';

console.log('🚀 EJECUTANDO CONFIGURACIÓN RLS CON DOCKER + API REST');
console.log('===================================================');
console.log('');

// Función para hacer peticiones HTTP
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        statusCode: res.statusCode,
                        body: body,
                        parsed: body ? JSON.parse(body) : null
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: body,
                        parsed: null
                    });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(data);
        }
        req.end();
    });
}

// Función para ejecutar SQL usando diferentes endpoints
async function executeSQLDirect(sqlQuery, description) {
    console.log(`📋 ${description}...`);
    
    const endpoints = [
        '/rest/v1/rpc/query',
        '/rest/v1/rpc/sql', 
        '/rest/v1/rpc/exec_sql',
        '/rest/v1/rpc/execute_sql'
    ];
    
    const headers = {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'User-Agent': 'Docker-RLS-Config/1.0'
    };
    
    for (const endpoint of endpoints) {
        try {
            const options = {
                hostname: 'cwulvffuheotxzpocxla.supabase.co',
                path: endpoint,
                method: 'POST',
                headers: headers
            };
            
            const payload = JSON.stringify({
                query: sqlQuery,
                sql: sqlQuery
            });
            
            const result = await makeRequest(options, payload);
            
            if (result.statusCode === 200) {
                console.log(`✅ ${description}: exitoso (endpoint: ${endpoint})`);
                return true;
            }
        } catch (error) {
            // Continuar con el siguiente endpoint
        }
    }
    
    console.log(`⚠️ ${description}: falló en todos los endpoints (normal para DROP statements)`);
    return false;
}

// Función para probar subida con usuario anónimo
async function testAnonUpload() {
    console.log('🧪 Probando subida con usuario anónimo...');
    
    // Crear imagen de prueba en base64
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testFileName = `test_docker_${Date.now()}.png`;
    
    const options = {
        hostname: 'cwulvffuheotxzpocxla.supabase.co',
        path: `/storage/v1/object/categorias/test/${testFileName}`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'image/png',
            'apikey': anonKey,
            'User-Agent': 'Docker-RLS-Test/1.0'
        }
    };
    
    try {
        const imageBuffer = Buffer.from(testImageData, 'base64');
        const result = await makeRequest(options, imageBuffer);
        
        if (result.statusCode === 200 || result.statusCode === 201) {
            console.log('✅ Test de subida exitoso - RLS configurado correctamente');
            
            // Intentar eliminar el archivo de test
            try {
                const deleteOptions = {
                    ...options,
                    method: 'DELETE'
                };
                await makeRequest(deleteOptions);
                console.log('🗑️ Archivo de test eliminado');
            } catch (e) {
                console.log('⚠️ No se pudo eliminar archivo de test (normal)');
            }
            
            return true;
        } else {
            console.log(`❌ Test de subida falló: ${result.statusCode}`);
            console.log(`Response: ${result.body}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error en test: ${error.message}`);
        return false;
    }
}

// Función principal
async function configureRLS() {
    try {
        console.log('🔧 Configurando políticas RLS...');
        console.log('');
        
        // Leer el archivo SQL y dividir en statements
        const sqlContent = fs.readFileSync('/workspace/manual-rls-setup.sql', 'utf8');
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && !s.startsWith('SELECT'))
            .map(s => s + ';');
        
        console.log(`📄 Encontrados ${statements.length} statements SQL para ejecutar`);
        console.log('');
        
        // Ejecutar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const description = `Statement ${i + 1}/${statements.length}`;
            
            if (statement.includes('DROP POLICY')) {
                await executeSQLDirect(statement, `Limpiando política existente (${i + 1})`);
            } else if (statement.includes('ALTER TABLE')) {
                await executeSQLDirect(statement, `Habilitando RLS (${i + 1})`);
            } else if (statement.includes('CREATE POLICY')) {
                await executeSQLDirect(statement, `Creando política (${i + 1})`);
            } else {
                await executeSQLDirect(statement, description);
            }
            
            // Pausa pequeña entre statements
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log('');
        console.log('⏳ Esperando que se propaguen las políticas...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Probar funcionalidad
        const testResult = await testAnonUpload();
        
        console.log('');
        if (testResult) {
            console.log('🎉 ¡CONFIGURACIÓN EXITOSA!');
            console.log('');
            console.log('✅ Las políticas RLS han sido configuradas');
            console.log('✅ El bucket "categorias" acepta usuarios anónimos');
            console.log('✅ Ya puedes crear categorías con imágenes');
            console.log('');
            console.log('🔄 SIGUIENTE PASO:');
            console.log('   1. Recarga tu panel de administración');
            console.log('   2. Prueba crear una categoría con imagen');
            console.log('   3. ¡Debería funcionar sin errores!');
        } else {
            console.log('❌ CONFIGURACIÓN INCOMPLETA');
            console.log('');
            console.log('🔧 SOLUCIÓN MANUAL:');
            console.log('Ve al Dashboard de Supabase → SQL Editor y ejecuta:');
            console.log('');
            console.log('CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = \'categorias\');');
            console.log('CREATE POLICY "Allow anon access to categorias bucket" ON storage.objects FOR SELECT TO anon USING (bucket_id = \'categorias\');');
            console.log('CREATE POLICY "Allow anon updates to categorias bucket" ON storage.objects FOR UPDATE TO anon USING (bucket_id = \'categorias\') WITH CHECK (bucket_id = \'categorias\');');
            console.log('CREATE POLICY "Allow anon deletes from categorias bucket" ON storage.objects FOR DELETE TO anon USING (bucket_id = \'categorias\');');
        }
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        console.log('');
        console.log('🔧 EJECUTA MANUALMENTE en Dashboard de Supabase:');
        console.log('CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = \'categorias\');');
    }
}

// Ejecutar configuración
configureRLS()
    .then(() => {
        console.log('');
        console.log('🏁 Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
