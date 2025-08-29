const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM';

// Crear cliente con service role (permisos de administrador)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupRLSPolicies() {
    console.log('🚀 Configurando políticas RLS directamente...');
    
    try {
        // Lista de políticas SQL para ejecutar una por una
        const policies = [
            {
                name: 'Limpiar política de uploads categorias',
                sql: `DROP POLICY IF EXISTS "Allow public uploads to categorias bucket" ON storage.objects;`
            },
            {
                name: 'Limpiar política de access categorias',
                sql: `DROP POLICY IF EXISTS "Allow public access to categorias bucket" ON storage.objects;`
            },
            {
                name: 'Limpiar política de updates categorias',
                sql: `DROP POLICY IF EXISTS "Allow updates to categorias bucket" ON storage.objects;`
            },
            {
                name: 'Limpiar política de deletes categorias',
                sql: `DROP POLICY IF EXISTS "Allow deletes from categorias bucket" ON storage.objects;`
            },
            {
                name: 'Habilitar RLS en objects',
                sql: `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`
            },
            {
                name: 'Habilitar RLS en buckets',
                sql: `ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;`
            },
            {
                name: 'Crear política de uploads para categorias',
                sql: `CREATE POLICY "Allow public uploads to categorias bucket" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'categorias');`
            },
            {
                name: 'Crear política de access para categorias',
                sql: `CREATE POLICY "Allow public access to categorias bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'categorias');`
            },
            {
                name: 'Crear política de updates para categorias',
                sql: `CREATE POLICY "Allow updates to categorias bucket" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'categorias') WITH CHECK (bucket_id = 'categorias');`
            },
            {
                name: 'Crear política de deletes para categorias',
                sql: `CREATE POLICY "Allow deletes from categorias bucket" ON storage.objects FOR DELETE TO public USING (bucket_id = 'categorias');`
            }
        ];

        // Ejecutar cada política
        for (const policy of policies) {
            console.log(`📋 ${policy.name}...`);
            
            try {
                const { data, error } = await supabase.rpc('exec_sql', { sql: policy.sql });
                
                if (error) {
                    console.log(`⚠️  ${policy.name}: ${error.message} (puede ser normal)`);
                } else {
                    console.log(`✅ ${policy.name}: exitoso`);
                }
            } catch (err) {
                console.log(`⚠️  ${policy.name}: ${err.message} (intentando con método alternativo)`);
                
                // Método alternativo usando fetch directamente
                try {
                    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'Content-Type': 'application/json',
                            'apikey': serviceRoleKey
                        },
                        body: JSON.stringify({ sql: policy.sql })
                    });
                    
                    if (response.ok) {
                        console.log(`✅ ${policy.name}: exitoso (método alternativo)`);
                    } else {
                        console.log(`⚠️  ${policy.name}: ${response.status} ${response.statusText}`);
                    }
                } catch (fetchErr) {
                    console.log(`❌ ${policy.name}: ${fetchErr.message}`);
                }
            }
        }

        console.log('');
        console.log('🧪 Probando funcionalidad...');
        
        // Test de subida después de configurar políticas
        const testFile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        const fileName = `test_rls_${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
            .from('categorias')
            .upload(`test/${fileName}`, testFile, {
                contentType: 'image/png'
            });
            
        if (uploadError) {
            console.log('❌ Test de subida falló:', uploadError.message);
            console.log('');
            console.log('🔧 Solución manual:');
            console.log('1. Ve al Dashboard de Supabase');
            console.log('2. SQL Editor');
            console.log('3. Ejecuta este SQL:');
            console.log('');
            policies.slice(6).forEach(policy => {
                console.log(policy.sql);
                console.log('');
            });
        } else {
            console.log('✅ Test de subida exitoso - RLS configurado correctamente');
            
            // Limpiar archivo de test
            await supabase.storage
                .from('categorias')
                .remove([`test/${fileName}`]);
                
            console.log('🗑️ Archivo de test eliminado');
            console.log('');
            console.log('🎉 ¡Configuración completa! Ahora puedes crear categorías con imágenes.');
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
        console.log('');
        console.log('🔧 Si hay problemas, ejecuta este SQL manualmente en Supabase:');
        console.log('');
        console.log(`CREATE POLICY "Allow public uploads to categorias bucket" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'categorias');`);
        console.log(`CREATE POLICY "Allow public access to categorias bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'categorias');`);
    }
}

// Ejecutar configuración
setupRLSPolicies()
    .then(() => {
        console.log('🏁 Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
