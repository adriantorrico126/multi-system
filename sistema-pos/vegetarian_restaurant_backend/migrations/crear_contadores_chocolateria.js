/**
 * =====================================================
 * CREAR CONTADORES DE USO PARA CHOCOLATERÍA COLCAPIRHUA
 * =====================================================
 */

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: 'localhost',
    port: 5432,
    database: 'sistempos'
});

function log(message, color = 'white') {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m'
    };
    console.log(`${colors[color]}${message}\x1b[0m`);
}

async function crearContadores() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        log('============================================================', 'blue');
        log('CREANDO CONTADORES DE USO - CHOCOLATERÍA COLCAPIRHUA (LOCAL)', 'blue');
        log('============================================================', 'blue');
        
        const idRestaurante = 12;
        const idPlan = 3; // Enterprise
        
        // Recursos a crear
        const recursos = [
            { recurso: 'sucursales', uso_actual: 1, limite_plan: 999999 },
            { recurso: 'usuarios', uso_actual: 1, limite_plan: 999999 },
            { recurso: 'productos', uso_actual: 45, limite_plan: 999999 },
            { recurso: 'transacciones', uso_actual: 0, limite_plan: 999999 },
            { recurso: 'almacenamiento', uso_actual: 0, limite_plan: 999999 }
        ];
        
        log(`\n📊 Creando ${recursos.length} contadores...`, 'yellow');
        
        for (const rec of recursos) {
            await client.query(`
                INSERT INTO contadores_uso (
                    id_restaurante,
                    id_plan,
                    recurso,
                    uso_actual,
                    limite_plan,
                    fecha_medicion
                )
                VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
            `, [idRestaurante, idPlan, rec.recurso, rec.uso_actual, rec.limite_plan]);
            
            log(`   ✓ ${rec.recurso}: ${rec.uso_actual}/${rec.limite_plan}`, 'white');
        }
        
        await client.query('COMMIT');
        
        log('\n============================================================', 'green');
        log('🎉 CONTADORES CREADOS EXITOSAMENTE', 'green');
        log('============================================================', 'green');
        log(`   • Restaurante ID: ${idRestaurante}`, 'white');
        log(`   • Plan: Enterprise (ID: ${idPlan})`, 'white');
        log(`   • Contadores creados: ${recursos.length}`, 'white');
        log('============================================================', 'green');
        
    } catch (error) {
        await client.query('ROLLBACK');
        log(`❌ Error: ${error.message}`, 'red');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

crearContadores()
    .then(() => {
        log('\n✅ Script completado', 'green');
        process.exit(0);
    })
    .catch(error => {
        log('\n❌ Script fallido', 'red');
        process.exit(1);
    });
