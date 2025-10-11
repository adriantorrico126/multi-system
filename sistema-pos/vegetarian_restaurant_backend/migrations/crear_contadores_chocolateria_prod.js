/**
 * CREAR CONTADORES DE USO - CHOCOLATERÍA COLCAPIRHUA (PRODUCCIÓN)
 */

const { Pool } = require('pg');

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER_PROD,
    password: process.env.DB_PASSWORD_PROD,
    host: process.env.DB_HOST_PROD,
    port: process.env.DB_PORT_PROD,
    database: process.env.DB_NAME_PROD,
    ssl: {
        rejectUnauthorized: false
    }
});

async function crearContadores() {
    try {
        console.log('============================================================');
        console.log('CREANDO CONTADORES - CHOCOLATERÍA COLCAPIRHUA (PRODUCCIÓN)');
        console.log('============================================================\n');
        
        const idRestaurante = 22;
        const idPlan = 4; // Enterprise
        
        const recursos = [
            { recurso: 'sucursales', uso: 1, limite: 999999 },
            { recurso: 'usuarios', uso: 1, limite: 999999 },
            { recurso: 'productos', uso: 45, limite: 999999 },
            { recurso: 'transacciones', uso: 0, limite: 999999 },
            { recurso: 'almacenamiento', uso: 0, limite: 999999 }
        ];
        
        for (const r of recursos) {
            await pool.query(`
                INSERT INTO contadores_uso (
                    id_restaurante, id_plan, recurso, uso_actual, limite_plan, fecha_medicion
                ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
            `, [idRestaurante, idPlan, r.recurso, r.uso, r.limite]);
            
            console.log(`✓ ${r.recurso}: ${r.uso}/${r.limite}`);
        }
        
        console.log('\n✅ Contadores creados exitosamente (PRODUCCIÓN)');
        console.log('   Restaurante ID: 22');
        console.log('   Plan: Enterprise (ID: 4)');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

crearContadores();
