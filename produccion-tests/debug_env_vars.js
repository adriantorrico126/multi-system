// Script para verificar las variables de entorno en el modelo SuscripcionModel
// Simular lo que está pasando en producción

require('dotenv').config();

console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO');
console.log('=' .repeat(50));

console.log('\n📊 Variables disponibles:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***HIDDEN***' : 'NOT_SET');

console.log('\n📋 Variables que usa SuscripcionModel:');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('User:', process.env.DB_USER || 'postgres'); 
console.log('Database:', process.env.DB_NAME || 'sistempos');
console.log('Port:', process.env.DB_PORT || '5432');

console.log('\n🎯 ¿Están configuradas?');
console.log('DB_HOST configurada:', !!process.env.DB_HOST);
console.log('DB_USER configurada:', !!process.env.DB_USER);
console.log('DB_NAME configurada:', !!process.env.DB_NAME);
console.log('DB_PORT configurada:', !!process.env.DB_PORT);
console.log('DB_PASSWORD configurada:', !!process.env.DB_PASSWORD);

// Test de conexión con las variables actuales
const { Pool } = require('pg');

async function testConnection() {
    console.log('\n🚀 PROBANDO CONEXIÓN DIRECTA');
    console.log('=' .repeat(50));
    
    const poolConfig = {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'sistempos',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    };
    
    console.log('Configuración Pool:', JSON.stringify(poolConfig, null, 2));
    
    const pool = new Pool(poolConfig);
    
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version()');
        console.log('✅ Conexión exitosa:', result.rows[0].current_time);
        console.log('📊 Versión PostgreSQL:', result.rows.flat()[1].split(' ')[0] + ' ' + result.rows.flat()[1].split(' ')[1]);
        client.release();
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
        console.log('🔍 Detalles:', error.code);
    } finally {
        await pool.end();
    }
}

testConnection().catch(console.error);
