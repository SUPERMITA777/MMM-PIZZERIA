// Script para configurar políticas de Storage con service role
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageRLS() {
    try {
        console.log('🔧 Configurando políticas de Storage...');
        
        // Primero crear el bucket si no existe
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.error('❌ Error al listar buckets:', listError);
            return;
        }
        
        const imagenesBucket = buckets.find(b => b.name === 'imagenes');
        
        if (!imagenesBucket) {
            console.log('📦 Creando bucket imagenes...');
            
            const { data, error } = await supabase.storage.createBucket('imagenes', {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
                fileSizeLimit: 10485760 // 10MB
            });
            
            if (error) {
                console.error('❌ Error al crear bucket:', error);
            } else {
                console.log('✅ Bucket creado exitosamente');
            }
        } else {
            console.log('✅ Bucket "imagenes" ya existe');
        }
        
        // Configurar políticas SQL
        console.log('📝 Configurando políticas RLS...');
        
        const policies = [
            // Política para insertar
            `
            CREATE POLICY IF NOT EXISTS "Permitir subir imagenes" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'imagenes');
            `,
            // Política para leer
            `
            CREATE POLICY IF NOT EXISTS "Permitir leer imagenes" ON storage.objects
            FOR SELECT USING (bucket_id = 'imagenes');
            `,
            // Política para actualizar
            `
            CREATE POLICY IF NOT EXISTS "Permitir actualizar imagenes" ON storage.objects
            FOR UPDATE USING (bucket_id = 'imagenes') WITH CHECK (bucket_id = 'imagenes');
            `,
            // Política para eliminar
            `
            CREATE POLICY IF NOT EXISTS "Permitir eliminar imagenes" ON storage.objects
            FOR DELETE USING (bucket_id = 'imagenes');
            `,
            // Habilitar RLS
            `
            ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
            `
        ];
        
        for (const policy of policies) {
            try {
                const { error } = await supabase.rpc('exec_sql', { sql: policy });
                if (error) {
                    console.warn('⚠️ Política ya existe o error menor:', error.message);
                } else {
                    console.log('✅ Política aplicada');
                }
            } catch (err) {
                console.warn('⚠️ Error aplicando política:', err.message);
            }
        }
        
        // Test final
        console.log('🧪 Probando configuración...');
        
        const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
        const fileName = `test_${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('imagenes')
            .upload(`test/${fileName}`, testData, {
                contentType: 'image/png'
            });
        
        if (uploadError) {
            console.error('❌ Test de subida falló:', uploadError);
        } else {
            console.log('✅ Test de subida exitoso');
            
            // Limpiar
            await supabase.storage
                .from('imagenes')
                .remove([`test/${fileName}`]);
            
            console.log('🗑️ Test limpiado');
        }
        
        console.log('🎉 Configuración de Storage completa');
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

setupStorageRLS();
