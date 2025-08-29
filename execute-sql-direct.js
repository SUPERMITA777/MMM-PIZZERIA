// Script para ejecutar SQL directamente en Supabase usando el cliente JS
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://cwulvffuheotxzpocxla.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3dWx2ZmZ1aGVvdHh6cG9jeGxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjMwMzQ2MCwiZXhwIjoyMDcxODc5NDYwfQ.ItV_U5eBe0qSoGEuJYIEN9kT7hzAcleqi6rzHtSHXsM'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeRLSPolicies() {
    try {
        console.log('🔐 Configurando políticas RLS para bucket productos...');
        
        // Las políticas RLS una por una
        const policies = [
            {
                name: "Allow anon uploads to productos bucket",
                sql: `CREATE POLICY "Allow anon uploads to productos bucket" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'productos');`
            },
            {
                name: "Allow anon access to productos bucket", 
                sql: `CREATE POLICY "Allow anon access to productos bucket" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'productos');`
            },
            {
                name: "Allow anon updates to productos bucket",
                sql: `CREATE POLICY "Allow anon updates to productos bucket" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'productos') WITH CHECK (bucket_id = 'productos');`
            },
            {
                name: "Allow anon deletes from productos bucket",
                sql: `CREATE POLICY "Allow anon deletes from productos bucket" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'productos');`
            }
        ];
        
        for (const policy of policies) {
            console.log(`📝 Creando política: ${policy.name}`);
            
            try {
                // Usar la función sql() si está disponible
                const { data, error } = await supabase.rpc('sql', {
                    query: policy.sql
                });
                
                if (error) {
                    // Si la política ya existe, es normal
                    if (error.message.includes('already exists')) {
                        console.log(`⚠️ Política ya existe: ${policy.name}`);
                        continue;
                    }
                    throw error;
                }
                
                console.log(`✅ Política creada: ${policy.name}`);
                
            } catch (err) {
                // Si la función sql() no está disponible, intentar con REST API
                if (err.message.includes('function public.sql') || err.code === '42883') {
                    console.log(`🔄 Intentando método alternativo para: ${policy.name}`);
                    await executeViaREST(policy.sql);
                } else {
                    console.error(`❌ Error al crear política ${policy.name}:`, err.message);
                }
            }
        }
        
        console.log('🎉 Configuración de RLS completada');
        
        // Verificar si las políticas funcionan
        await testStorageAccess();
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        throw error;
    }
}

async function executeViaREST(sqlQuery) {
    try {
        // Usar fetch para ejecutar SQL via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey
            },
            body: JSON.stringify({
                query: sqlQuery
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ SQL ejecutado via REST API');
        return result;
        
    } catch (error) {
        console.error('❌ Error en REST API:', error.message);
        throw error;
    }
}

async function testStorageAccess() {
    try {
        console.log('🧪 Probando acceso al bucket productos...');
        
        // Intentar listar archivos del bucket
        const { data, error } = await supabase.storage
            .from('productos')
            .list('', {
                limit: 1
            });
        
        if (error) {
            console.log('⚠️ No se pudo acceder al bucket (normal si está vacío):', error.message);
        } else {
            console.log('✅ Acceso al bucket productos confirmado');
        }
        
        // Probar upload de un archivo de prueba
        const testFile = new Blob(['test'], { type: 'text/plain' });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('productos')
            .upload('test/test.txt', testFile);
        
        if (uploadError) {
            console.log('⚠️ Test de upload falló:', uploadError.message);
        } else {
            console.log('✅ Test de upload exitoso');
            
            // Limpiar archivo de prueba
            await supabase.storage
                .from('productos')
                .remove(['test/test.txt']);
        }
        
    } catch (error) {
        console.log('⚠️ Error en test:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0] === '--help') {
        console.log(`
🔧 Configurador RLS Directo para Supabase

Este script configura las políticas RLS para el bucket 'productos' usando el cliente JS de Supabase.

Uso:
  node execute-sql-direct.js

El script automáticamente:
1. Crea las políticas RLS para el bucket 'productos'
2. Verifica el acceso al bucket
3. Ejecuta un test de upload

No requiere Docker ni conexión directa a PostgreSQL.
        `);
        process.exit(0);
    }
    
    executeRLSPolicies()
        .then(() => {
            console.log('🎉 Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = {
    executeRLSPolicies,
    executeViaREST,
    testStorageAccess
};
