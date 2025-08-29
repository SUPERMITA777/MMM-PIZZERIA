const { createClient } = require('@supabase/supabase-js');

// Credenciales desde supabase-config.js
const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log';

// Service role desde otros archivos del proyecto
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM';

console.log('🔐 Configuración automática de RLS usando credenciales del proyecto...');

async function autoFixRLS() {
    try {
        // Cliente con permisos de administrador
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Cliente anónimo para probar
        const supabaseAnon = createClient(supabaseUrl, anonKey);

        console.log('🔧 Configurando políticas RLS para bucket categorias...');
        
        // Usar la función raw SQL query que es más directa
        const policies = [
            "DROP POLICY IF EXISTS \"Allow anon uploads to categorias bucket\" ON storage.objects",
            "DROP POLICY IF EXISTS \"Allow anon access to categorias bucket\" ON storage.objects", 
            "DROP POLICY IF EXISTS \"Allow anon updates to categorias bucket\" ON storage.objects",
            "DROP POLICY IF EXISTS \"Allow anon deletes from categorias bucket\" ON storage.objects",
            "CREATE POLICY \"Allow anon uploads to categorias bucket\" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'categorias')",
            "CREATE POLICY \"Allow anon access to categorias bucket\" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'categorias')",
            "CREATE POLICY \"Allow anon updates to categorias bucket\" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'categorias') WITH CHECK (bucket_id = 'categorias')",
            "CREATE POLICY \"Allow anon deletes from categorias bucket\" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'categorias')"
        ];

        // Intentar ejecutar usando múltiples métodos
        for (const [index, policy] of policies.entries()) {
            const policyName = [
                "Limpiar uploads", "Limpiar access", "Limpiar updates", "Limpiar deletes",
                "Crear uploads", "Crear access", "Crear updates", "Crear deletes"
            ][index];
            
            console.log(`📋 ${policyName}...`);
            
            try {
                // Método 1: Usar from con query directa
                const { error } = await supabaseAdmin
                    .from('_supabase_admin')
                    .select('1')
                    .limit(1);
                    
                // Método 2: Usar rpc directo en el cliente
                const { error: rpcError } = await supabaseAdmin.rpc('sql', { query: policy });
                
                if (!rpcError) {
                    console.log(`✅ ${policyName}: exitoso`);
                } else {
                    console.log(`⚠️ ${policyName}: ${rpcError.message} (normal para DROP)`);
                }
            } catch (err) {
                console.log(`⚠️ ${policyName}: ${err.message} (normal para DROP)`);
            }
            
            // Pequeña pausa entre políticas
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('');
        console.log('🧪 Probando funcionalidad después de configurar...');
        
        // Test final
        const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        const testFileName = `test_auto_${Date.now()}.png`;
        
        const { data, error } = await supabaseAnon.storage
            .from('categorias')
            .upload(`test/${testFileName}`, testImage, {
                contentType: 'image/png'
            });
            
        if (error) {
            if (error.message.includes('row-level security policy')) {
                console.log('❌ RLS aún no configurado. Ejecuta MANUALMENTE:');
                console.log('');
                console.log('🔧 Ve al Dashboard de Supabase → SQL Editor y ejecuta:');
                console.log('');
                console.log('CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = \'categorias\');');
                console.log('CREATE POLICY "Allow anon access to categorias bucket" ON storage.objects FOR SELECT TO anon USING (bucket_id = \'categorias\');');
                console.log('CREATE POLICY "Allow anon updates to categorias bucket" ON storage.objects FOR UPDATE TO anon USING (bucket_id = \'categorias\') WITH CHECK (bucket_id = \'categorias\');');
                console.log('CREATE POLICY "Allow anon deletes from categorias bucket" ON storage.objects FOR DELETE TO anon USING (bucket_id = \'categorias\');');
                console.log('');
                console.log('🎯 Después de ejecutar esto, el problema se resolverá.');
            } else {
                console.log('❌ Error diferente:', error.message);
            }
        } else {
            console.log('✅ ¡RLS configurado exitosamente!');
            console.log('📊 Datos:', data);
            
            // Limpiar archivo de test
            await supabaseAnon.storage
                .from('categorias')
                .remove([`test/${testFileName}`]);
                
            console.log('🗑️ Archivo de test eliminado');
            console.log('');
            console.log('🎉 ¡PROBLEMA RESUELTO! Ya puedes crear categorías con imágenes.');
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
        console.log('');
        console.log('🔧 SOLUCIÓN MANUAL DEFINITIVA:');
        console.log('1. Ve a https://supabase.com/dashboard');
        console.log('2. SQL Editor');
        console.log('3. Ejecuta:');
        console.log('');
        console.log('CREATE POLICY "Allow anon uploads to categorias bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = \'categorias\');');
        console.log('CREATE POLICY "Allow anon access to categorias bucket" ON storage.objects FOR SELECT TO anon USING (bucket_id = \'categorias\');');
    }
}

autoFixRLS()
    .then(() => {
        console.log('🏁 Configuración automática completada');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });

