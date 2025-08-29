const { createClient } = require('@supabase/supabase-js');

// Credenciales desde supabase-config.js
const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0NjAsImV4cCI6MjA3MTg3OTQ2MH0.OQkNnoYz-inY9Chtr42PU6w9S9sS90gwmOVmz243Log';

console.log('🧪 VERIFICANDO RLS DESPUÉS DE EJECUTAR SQL...');
console.log('============================================');
console.log('');

async function verifyRLS() {
    try {
        const supabase = createClient(supabaseUrl, anonKey);
        
        // Crear imagen de prueba
        const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        const testFileName = `verification_${Date.now()}.png`;
        
        console.log('📋 Probando subida con usuario anónimo...');
        console.log(`📁 Archivo: ${testFileName}`);
        console.log('');
        
        const { data, error } = await supabase.storage
            .from('categorias')
            .upload(`test/${testFileName}`, testImageData, {
                contentType: 'image/png',
                cacheControl: '3600'
            });
            
        if (error) {
            console.log('❌ ERROR:', error.message);
            
            if (error.message.includes('row-level security policy')) {
                console.log('');
                console.log('🔧 RLS AÚN NO CONFIGURADO CORRECTAMENTE');
                console.log('   Verifica que ejecutaste el SQL correctamente');
                console.log('   Espera 1-2 minutos y prueba de nuevo');
            } else {
                console.log('');
                console.log('⚠️ Error diferente (no es RLS)');
                console.log('   Esto podría indicar que RLS ya funciona');
            }
            return false;
        } else {
            console.log('✅ ¡SUBIDA EXITOSA!');
            console.log('📊 Datos de respuesta:', data);
            
            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('categorias')
                .getPublicUrl(`test/${testFileName}`);
                
            console.log('🔗 URL pública:', urlData.publicUrl);
            
            // Limpiar archivo de test
            const { error: deleteError } = await supabase.storage
                .from('categorias')
                .remove([`test/${testFileName}`]);
                
            if (!deleteError) {
                console.log('🗑️ Archivo de test eliminado');
            }
            
            console.log('');
            console.log('🎉 ¡RLS CONFIGURADO CORRECTAMENTE!');
            console.log('✅ El bucket "categorias" acepta usuarios anónimos');
            console.log('✅ Ya puedes crear categorías con imágenes');
            console.log('');
            console.log('🔄 PRUEBA AHORA:');
            console.log('   1. Recarga tu panel de administración');
            console.log('   2. Ve a MENÚ → Crear categoría');
            console.log('   3. Llena el formulario y selecciona una imagen');
            console.log('   4. ¡Debería funcionar sin errores!');
            
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        return false;
    }
}

verifyRLS()
    .then((success) => {
        console.log('');
        if (success) {
            console.log('🏁 ✅ VERIFICACIÓN EXITOSA - TODO FUNCIONANDO');
        } else {
            console.log('🏁 ❌ VERIFICACIÓN FALLÓ - REVISAR CONFIGURACIÓN');
        }
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
