const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log';

console.log('🔐 Solucionando problema de RLS para usuarios anónimos...');

async function fixRLSForAnon() {
    try {
        // Cliente con permisos de administrador para configurar políticas
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Cliente anónimo para probar
        const supabaseAnon = createClient(supabaseUrl, anonKey);

        console.log('🧪 Probando acceso actual con usuario anónimo...');
        
        // Test inicial con usuario anónimo
        const testFile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        const testFileName = `test_anon_${Date.now()}.png`;
        
        const { error: initialError } = await supabaseAnon.storage
            .from('categorias')
            .upload(`test/${testFileName}`, testFile, {
                contentType: 'image/png'
            });

        if (initialError) {
            console.log('❌ Error confirmado con usuario anónimo:', initialError.message);
            
            if (initialError.message.includes('row-level security policy')) {
                console.log('🔧 Configurando políticas específicas para usuarios anónimos...');
                
                // Usar fetch directo para evitar problemas con RPC
                const policies = [
                    `CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias');`,
                    `CREATE POLICY "Allow anon access to categorias bucket" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'categorias');`,
                    `CREATE POLICY "Allow anon updates to categorias bucket" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'categorias') WITH CHECK (bucket_id = 'categorias');`,
                    `CREATE POLICY "Allow anon deletes from categorias bucket" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'categorias');`
                ];

                for (const [index, policy] of policies.entries()) {
                    console.log(`📋 Configurando política ${index + 1}/4...`);
                    
                    try {
                        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'Content-Type': 'application/json',
                                'apikey': serviceRoleKey
                            },
                            body: JSON.stringify({ query: policy })
                        });

                        if (response.ok) {
                            console.log(`✅ Política ${index + 1} configurada`);
                        } else {
                            // Intentar método alternativo con REST API directo
                            console.log(`⚠️ Método 1 falló, probando método alternativo...`);
                            
                            // Dividir la política en partes más simples
                            const simplePolicies = [
                                `DROP POLICY IF EXISTS "Allow anon uploads to categorias bucket" ON storage.objects;`,
                                `CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias');`
                            ];
                            
                            for (const simplePolicy of simplePolicies) {
                                try {
                                    await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer ${serviceRoleKey}`,
                                            'Content-Type': 'application/json',
                                            'apikey': serviceRoleKey
                                        },
                                        body: JSON.stringify({ sql: simplePolicy })
                                    });
                                } catch (e) {
                                    // Ignorar errores de método alternativo
                                }
                            }
                        }
                    } catch (err) {
                        console.log(`⚠️ Error al configurar política ${index + 1}:`, err.message);
                    }
                }

                // Esperar un momento para que se propaguen las políticas
                console.log('⏳ Esperando propagación de políticas...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Test después de configurar políticas
                console.log('🧪 Probando acceso después de configurar políticas...');
                
                const testFileName2 = `test_anon_after_${Date.now()}.png`;
                const { error: afterError } = await supabaseAnon.storage
                    .from('categorias')
                    .upload(`test/${testFileName2}`, testFile, {
                        contentType: 'image/png'
                    });

                if (afterError) {
                    console.log('❌ Error persiste después de configurar políticas:', afterError.message);
                    console.log('');
                    console.log('🔧 SOLUCIÓN MANUAL REQUERIDA:');
                    console.log('1. Ve al Dashboard de Supabase');
                    console.log('2. Ve a Storage → Policies');
                    console.log('3. Busca el bucket "categorias"');
                    console.log('4. Crea una nueva política:');
                    console.log('   - Policy name: Allow anon uploads to categorias bucket');
                    console.log('   - Allowed operation: INSERT');
                    console.log('   - Target roles: anon');
                    console.log('   - WITH CHECK expression: bucket_id = \'categorias\'');
                    console.log('');
                    console.log('5. Repite para SELECT, UPDATE y DELETE operations');
                } else {
                    console.log('✅ ¡Políticas configuradas exitosamente!');
                    
                    // Limpiar archivo de test
                    await supabaseAnon.storage
                        .from('categorias')
                        .remove([`test/${testFileName2}`]);
                        
                    console.log('🎉 El bucket categorias ahora funciona con usuarios anónimos');
                }
            }
        } else {
            console.log('✅ El acceso anónimo ya funciona correctamente');
            
            // Limpiar archivo de test
            await supabaseAnon.storage
                .from('categorias')
                .remove([`test/${testFileName}`]);
        }

    } catch (error) {
        console.error('❌ Error general:', error);
        console.log('');
        console.log('🔧 CONFIGURACIÓN MANUAL:');
        console.log('En el SQL Editor de Supabase, ejecuta:');
        console.log('');
        console.log(`CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias');`);
        console.log(`CREATE POLICY "Allow anon access to categorias bucket" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'categorias');`);
    }
}

// Ejecutar
fixRLSForAnon()
    .then(() => {
        console.log('🏁 Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });

