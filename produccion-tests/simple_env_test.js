// Script simplificado para probar conexión con variables de entorno de producción
const { Pool } = require('pg');

console.log('🔍 PROBANDO CONEXIÓN DIRECTA A PRODUCCIÓN');
console.log('=' .repeat(50));

async function testProductionConnection() {
    // Variables de entorno exactas de producción
    const poolConfig = {
        host: process.env.PROD_DB_HOST || 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
        port: process.env.PROD_DB_PORT || 25060,
        user: process.env.PROD_DB_USER || 'doadmin',
        password: process.env.PROD_DB_PASSWORD || 'placeholder_password',
        database: process.env.PROD_DB_NAME || 'defaultdb',
        ssl: { rejectUnauthorized: false }
    };
    
    console.log('📋 Configuración:', JSON.stringify({
        ...poolConfig,
        password: '***HIDDEN***'
    }, null, 2));
    
    const pool = new Pool(poolConfig);
    
    try {
        const client = await pool.connect();
        console.log('✅ Conexión establecida');
        
        // Probar la consulta exacta que está fallando
        const query = `
            SELECT 
                sa.id_suscripcion,
                sa.id_restaurante,
                sa.id_plan,
                sa.estado,
                sa.fecha_inicio,
                sa.fecha_fin,
                sa.fecha_renovacion,
                sa.created_at,
                sa.updated_at,
                p.nombre as nombre_plan,
                p.precio_mensual,
                p.precio_anual,
                p.max_sucursales,
                p.max_usuarios,
                p.max_productos,
                p.max_transacciones_mes,
                p.almacenamiento_gb
            FROM suscripciones sa
            JOIN planes p ON sa.id_plan = p.id_plan
            WHERE sa.id_restaurante = $1 
            AND sa.estado = 'activa'
            AND (sa.fecha_fin IS NULL OR sa.fecha_fin >= CURRENT_DATE)
        `;
        
        const result = await pool.query(query, [1]);
        console.log(`✅ Consulta exitosa - Registros encontrados: ${result.rows.length}`);
        
        if (result.rows.length > 0) {
            console.log('📄 Suscripción encontrada:', JSON.stringify(result.rows[0], null, 2));
        } else {
            console.log('⚠️ No se encontraron suscripciones activas');
        }
        
        client.release();
        
    } catch (error) {
        console.log('❌ Error de conexión/consulta:', error.message);
        console.log('🔍 Código de error:', error.code);
        console.log('📍 Detalle:', error);
    } finally {
        await pool.end();
    }
    
    console.log('\n🏁 TEST COMPLETADO');
    console.log('=' .repeat(50));
}

testProductionConnection().catch(console.error);
