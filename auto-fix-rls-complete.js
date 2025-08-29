const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('🔧 SOLUCIÓN DEFINITIVA: AUTO-CONFIGURACIÓN RLS');
console.log('==============================================');
console.log('');

// Leer credenciales desde supabase-config.js
function getSupabaseConfig() {
    try {
        const configContent = fs.readFileSync('supabase-config.js', 'utf8');
        
        const urlMatch = configContent.match(/url:\s*['"]([^'"]*)['"]/);
        const serviceKeyMatch = configContent.match(/serviceRoleKey:\s*['"]([^'"]*)['"]/);
        const anonKeyMatch = configContent.match(/anonKey:\s*['"]([^'"]*)['"]/);
        
        if (!urlMatch || !serviceKeyMatch || !anonKeyMatch) {
            throw new Error('No se pudieron extraer las credenciales');
        }
        
        return {
            url: urlMatch[1],
            serviceRoleKey: serviceKeyMatch[1],
            anonKey: anonKeyMatch[1]
        };
    } catch (error) {
        console.error('❌ Error al leer configuración:', error.message);
        process.exit(1);
    }
}

// Función para ejecutar políticas usando llamadas directas HTTP
async function executeRLSPolicies(config) {
    console.log('📋 Configurando políticas RLS...');
    
    // Crear cliente con service role para máximos privilegios
    const supabaseAdmin = createClient(config.url, config.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Políticas que necesitamos crear
    const policies = [
        {
            name: "Allow anon uploads to categorias bucket",
            sql: `CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias');`
        },
        {
            name: "Allow anon access to categorias bucket", 
            sql: `CREATE POLICY "Allow anon access to categorias bucket" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'categorias');`
        },
        {
            name: "Allow anon updates to categorias bucket",
            sql: `CREATE POLICY "Allow anon updates to categorias bucket" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'categorias') WITH CHECK (bucket_id = 'categorias');`
        },
        {
            name: "Allow anon deletes from categorias bucket",
            sql: `CREATE POLICY "Allow anon deletes from categorias bucket" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'categorias');`
        }
    ];

    // Intentar diferentes métodos para ejecutar SQL
    const methods = [
        // Método 1: Usar fetch directo a diferentes endpoints
        async (sql) => {
            const endpoints = [
                '/rest/v1/rpc/sql',
                '/rest/v1/rpc/query', 
                '/rest/v1/rpc/exec_sql',
                '/database/sql',
                '/sql'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${config.url}${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.serviceRoleKey}`,
                            'Content-Type': 'application/json',
                            'apikey': config.serviceRoleKey,
                            'X-Client-Info': 'supabase-js/2.0.0'
                        },
                        body: JSON.stringify({ 
                            query: sql,
                            sql: sql,
                            statement: sql
                        })
                    });
                    
                    if (response.ok) {
                        return { success: true, method: `fetch ${endpoint}` };
                    }
                } catch (e) {
                    // Continuar con el siguiente endpoint
                }
            }
            return { success: false, method: 'fetch' };
        },

        // Método 2: Usar el cliente de Supabase con diferentes RPC calls
        async (sql) => {
            const rpcCalls = ['sql', 'query', 'exec_sql', 'execute_sql', 'run_sql'];
            
            for (const rpcCall of rpcCalls) {
                try {
                    const { error } = await supabaseAdmin.rpc(rpcCall, { 
                        query: sql,
                        sql: sql,
                        statement: sql
                    });
                    
                    if (!error) {
                        return { success: true, method: `rpc ${rpcCall}` };
                    }
                } catch (e) {
                    // Continuar con el siguiente RPC
                }
            }
            return { success: false, method: 'rpc' };
        }
    ];

    // Ejecutar políticas
    let successCount = 0;
    for (const policy of policies) {
        console.log(`📝 Configurando: ${policy.name}...`);
        
        let policySuccess = false;
        for (const method of methods) {
            const result = await method(policy.sql);
            if (result.success) {
                console.log(`✅ ${policy.name}: exitoso (${result.method})`);
                policySuccess = true;
                successCount++;
                break;
            }
        }
        
        if (!policySuccess) {
            console.log(`⚠️ ${policy.name}: falló con métodos automáticos`);
        }
        
        // Pausa entre políticas
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return successCount;
}

// Función para probar la configuración
async function testConfiguration(config) {
    console.log('🧪 Probando configuración...');
    
    try {
        const supabaseAnon = createClient(config.url, config.anonKey);
        
        // Crear imagen de prueba
        const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        const testFileName = `test_final_${Date.now()}.png`;
        
        const { data, error } = await supabaseAnon.storage
            .from('categorias')
            .upload(`test/${testFileName}`, testImageData, {
                contentType: 'image/png'
            });
            
        if (error) {
            if (error.message.includes('row-level security policy')) {
                console.log('❌ RLS aún no configurado');
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
        console.log('❌ Error en test:', error.message);
        return false;
    }
}

// Función principal
async function main() {
    try {
        console.log('🔍 Cargando configuración desde supabase-config.js...');
        const config = getSupabaseConfig();
        console.log('✅ Configuración cargada');
        console.log('');
        
        // Ejecutar configuración automática
        const successCount = await executeRLSPolicies(config);
        
        console.log('');
        if (successCount > 0) {
            console.log(`✅ ${successCount}/4 políticas configuradas automáticamente`);
            console.log('⏳ Esperando propagación...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const testResult = await testConfiguration(config);
            
            if (testResult) {
                console.log('');
                console.log('🎉 ¡CONFIGURACIÓN EXITOSA!');
                console.log('✅ RLS configurado y funcionando');
                console.log('✅ Bucket "categorias" acepta usuarios anónimos');
                console.log('✅ Ya puedes crear categorías con imágenes');
                console.log('');
                console.log('🔄 SIGUIENTE PASO:');
                console.log('   Recarga tu panel y prueba crear una categoría');
            } else {
                console.log('');
                console.log('⚠️ Configuración parcial - requiere paso manual');
                showManualInstructions();
            }
        } else {
            console.log('❌ No se pudieron configurar políticas automáticamente');
            console.log('');
            showManualInstructions();
        }
        
    } catch (error) {
        console.error('💥 Error general:', error);
        showManualInstructions();
    }
}

function showManualInstructions() {
    console.log('🔧 CONFIGURACIÓN MANUAL REQUERIDA:');
    console.log('');
    console.log('1. Ve a: https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto');
    console.log('3. SQL Editor');
    console.log('4. Ejecuta este SQL:');
    console.log('');
    console.log('CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = \'categorias\');');
    console.log('CREATE POLICY "Allow anon access to categorias bucket" ON storage.objects FOR SELECT TO anon USING (bucket_id = \'categorias\');');
    console.log('CREATE POLICY "Allow anon updates to categorias bucket" ON storage.objects FOR UPDATE TO anon USING (bucket_id = \'categorias\') WITH CHECK (bucket_id = \'categorias\');');
    console.log('CREATE POLICY "Allow anon deletes from categorias bucket" ON storage.objects FOR DELETE TO anon USING (bucket_id = \'categorias\');');
    console.log('');
    console.log('5. ¡Después podrás crear categorías con imágenes!');
}

// Ejecutar
main()
    .then(() => {
        console.log('');
        console.log('🏁 Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
