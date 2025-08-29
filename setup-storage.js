// =====================================================
// CONFIGURACIÓN DE STORAGE PARA SUPABASE
// =====================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cwulvffuheotxzpocxla.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupStorage() {
    try {
        console.log('🚀 Configurando storage...');
        
        // Verificar si el bucket existe
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error('❌ Error al listar buckets:', listError);
            return;
        }
        
        console.log('📦 Buckets existentes:', buckets.map(b => b.name));
        
        // Verificar si el bucket 'imagenes' existe
        const imagenesBucket = buckets.find(bucket => bucket.name === 'imagenes');
        
        if (!imagenesBucket) {
            console.log('📦 Creando bucket "imagenes"...');
            
            // Crear bucket público
            const { data: bucketData, error: createError } = await supabase.storage.createBucket('imagenes', {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
                fileSizeLimit: 10485760 // 10MB
            });
            
            if (createError) {
                console.error('❌ Error al crear bucket:', createError);
                return;
            }
            
            console.log('✅ Bucket "imagenes" creado correctamente');
        } else {
            console.log('✅ Bucket "imagenes" ya existe');
        }
        
        // Probar subida de un archivo de prueba
        console.log('🧪 Probando subida de archivo...');
        
        // Crear un archivo de prueba (un pixel transparente)
        const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const blob = await fetch(testImageData).then(r => r.blob());
        
        const testFileName = `test_${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('imagenes')
            .upload(`test/${testFileName}`, blob);
        
        if (uploadError) {
            console.error('❌ Error al subir archivo de prueba:', uploadError);
            return;
        }
        
        console.log('✅ Archivo de prueba subido:', uploadData);
        
        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('imagenes')
            .getPublicUrl(`test/${testFileName}`);
        
        console.log('🔗 URL pública:', urlData.publicUrl);
        
        // Limpiar archivo de prueba
        const { error: deleteError } = await supabase.storage
            .from('imagenes')
            .remove([`test/${testFileName}`]);
        
        if (deleteError) {
            console.warn('⚠️ No se pudo eliminar archivo de prueba:', deleteError);
        } else {
            console.log('🗑️ Archivo de prueba eliminado');
        }
        
        console.log('✅ Storage configurado correctamente');
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Ejecutar configuración
setupStorage();
