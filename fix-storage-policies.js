const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function configureStoragePolicies() {
    console.log('🚀 Configurando políticas de storage...');
    
    try {
        // 1. Verificar buckets existentes
        console.log('📦 Verificando buckets...');
        
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) throw listError;
        
        console.log('📦 Buckets disponibles:', buckets.map(b => b.name));
        
        // 2. Test de subida para ambos buckets
        console.log('🧪 Probando subida de archivos...');
        
        const testFile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        
        // Test bucket imagenes
        const fileNameImagenes = `test_imagenes_${Date.now()}.png`;
        const { error: uploadErrorImagenes } = await supabase.storage
            .from('imagenes')
            .upload(`test/${fileNameImagenes}`, testFile, {
                contentType: 'image/png'
            });
            
        if (uploadErrorImagenes) {
            console.log('⚠️ Error subiendo a "imagenes":', uploadErrorImagenes.message);
        } else {
            console.log('✅ Test de subida a "imagenes" exitoso');
        }
        
        // Test bucket categorias
        const fileNameCategorias = `test_categorias_${Date.now()}.png`;
        const { error: uploadErrorCategorias } = await supabase.storage
            .from('categorias')
            .upload(`test/${fileNameCategorias}`, testFile, {
                contentType: 'image/png'
            });
            
        if (uploadErrorCategorias) {
            console.log('⚠️ Error subiendo a "categorias":', uploadErrorCategorias.message);
            
            // Si hay error de RLS, necesitamos configurar las políticas manualmente
            if (uploadErrorCategorias.message.includes('row-level security policy')) {
                console.log('🔐 Error de RLS detectado. Necesitas configurar las políticas manualmente.');
                console.log('');
                console.log('📋 Para resolver esto, ejecuta en el SQL Editor de Supabase:');
                console.log('');
                console.log('-- Políticas para bucket categorias');
                console.log('CREATE POLICY "Allow public uploads to categorias bucket"');
                console.log('ON storage.objects FOR INSERT TO public');
                console.log('WITH CHECK (bucket_id = \'categorias\');');
                console.log('');
                console.log('CREATE POLICY "Allow public access to categorias bucket"');
                console.log('ON storage.objects FOR SELECT TO public');
                console.log('USING (bucket_id = \'categorias\');');
                console.log('');
                console.log('CREATE POLICY "Allow updates to categorias bucket"');
                console.log('ON storage.objects FOR UPDATE TO public');
                console.log('USING (bucket_id = \'categorias\');');
                console.log('');
                console.log('CREATE POLICY "Allow deletes from categorias bucket"');
                console.log('ON storage.objects FOR DELETE TO public');
                console.log('USING (bucket_id = \'categorias\');');
            }
        } else {
            console.log('✅ Test de subida a "categorias" exitoso');
        }
        
        // 3. Limpiar archivos de test si se subieron correctamente
        if (!uploadErrorImagenes) {
            await supabase.storage
                .from('imagenes')
                .remove([`test/${fileNameImagenes}`]);
            console.log('🗑️ Archivo de test de imagenes eliminado');
        }
        
        if (!uploadErrorCategorias) {
            await supabase.storage
                .from('categorias')
                .remove([`test/${fileNameCategorias}`]);
            console.log('🗑️ Archivo de test de categorias eliminado');
        }
        
        console.log('');
        console.log('📋 Estado actual:');
        console.log('   - Bucket "imagenes":', uploadErrorImagenes ? '❌ Con problemas' : '✅ Funcionando');
        console.log('   - Bucket "categorias":', uploadErrorCategorias ? '❌ Con problemas' : '✅ Funcionando');
        
        if (uploadErrorCategorias && uploadErrorCategorias.message.includes('row-level security policy')) {
            console.log('');
                        console.log('🔧 Para resolver el problema de RLS en categorias:');
            console.log('1. Ve al Dashboard de Supabase');
            console.log('2. SQL Editor');
            console.log('3. Ejecuta las políticas que se mostraron arriba');
        }
        
    } catch (error) {
        console.error('❌ Error en configuración:', error);
        throw error;
    }
}

// Ejecutar configuración
configureStoragePolicies()
    .then(() => {
        console.log('🏁 Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });

