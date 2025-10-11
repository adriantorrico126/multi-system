const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'sistempos'
});

async function testPlanes() {
    try {
        console.log('=== TEST DE CONSULTA CON TABLA planes ===\n');
        
        const result = await pool.query(`
            SELECT 
                s.id_suscripcion,
                s.id_restaurante,
                s.id_plan,
                s.estado,
                p.nombre as plan_nombre,
                p.id_plan as plan_id_verificacion,
                r.nombre as restaurante_nombre
            FROM suscripciones s
            LEFT JOIN planes p ON s.id_plan = p.id_plan
            LEFT JOIN restaurantes r ON s.id_restaurante = r.id_restaurante
            WHERE s.estado = 'activa'
            LIMIT 5
        `);
        
        console.log('✅ Consulta ejecutada exitosamente!');
        console.log(`✅ ${result.rows.length} suscripciones encontradas\n`);
        
        result.rows.forEach(s => {
            const status = s.plan_nombre ? '✓' : '❌';
            console.log(`${status} Rest ${s.id_restaurante}: ${s.restaurante_nombre}`);
            console.log(`   Plan ${s.id_plan}: ${s.plan_nombre || 'ERROR - No encontrado'}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

testPlanes();
