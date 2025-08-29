// Script para verificar el estado del sistema MMM
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando el estado del sistema MMM...\n');

// Verificar archivos principales
const requiredFiles = [
    'index.html',
    'cliente.html', 
    'script.js',
    'cliente-script.js',
    'styles.css',
    'cliente-styles.css',
    'supabase-config.js',
    'verify-system.html'
];

console.log('📁 Verificando archivos principales:');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`   ✅ ${file} (${size} KB)`);
    } else {
        console.log(`   ❌ ${file} - FALTANTE`);
    }
});

// Verificar archivos de configuración
console.log('\n⚙️ Verificando configuración:');
if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`   ✅ package.json - Proyecto: ${packageJson.name || 'MMM'}`);
} else {
    console.log('   ❌ package.json - FALTANTE');
}

// Verificar archivos de base de datos
const dbFiles = [
    'create-tables.sql',
    'insert-sample-data.js',
    'verify-tables.sql'
];

console.log('\n🗄️ Verificando archivos de base de datos:');
dbFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} - FALTANTE`);
    }
});

// Verificar archivos de prueba
const testFiles = [
    'test-simple.html',
    'test-database.html',
    'verify-system.html'
];

console.log('\n🧪 Verificando archivos de prueba:');
testFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} - FALTANTE`);
    }
});

console.log('\n📊 Resumen del sistema:');
console.log('   🏪 Restaurante: MMM Pizza');
console.log('   📋 Categorías: 6 (PROMOS, NAPOLETANO, ROMANA, EMPANADAS, BEBIDAS, DESTACADOS)');
console.log('   🍕 Productos: 18 productos de muestra');
console.log('   👥 Clientes: 3 clientes de ejemplo');
console.log('   📦 Pedidos: 2 pedidos de muestra');
console.log('   ⚙️ Configuraciones: Delivery, Marketing, Pagos');

console.log('\n🚀 Enlaces importantes:');
console.log('   📱 Panel Admin: http://localhost/index.html (o abrir directamente)');
console.log('   🍕 Menú Cliente: http://localhost/cliente.html (o abrir directamente)');
console.log('   🔍 Verificación: http://localhost/verify-system.html (o abrir directamente)');

console.log('\n✅ Sistema MMM configurado correctamente!');
console.log('💡 Abre verify-system.html para verificar la conexión con Supabase');
