/**
 * =====================================================
 * CREAR SUSCRIPCIÓN PARA CHOCOLATERÍA COLCAPIRHUA
 * =====================================================
 * Sistema: SITEMM POS
 * Fecha: 2025-10-10
 * Descripción: Crear suscripción activa para el restaurante ID 22
 * =====================================================
 */

const { Pool } = require('pg');

// Configuración de la base de datos de producción
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

function log(message, color = 'white') {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        white: '\x1b[37m'
    };
    console.log(`${colors[color]}${message}\x1b[0m`);
}

async function crearSuscripcionChocolateria() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        log('============================================================', 'blue');
        log('CREANDO SUSCRIPCIÓN PARA CHOCOLATERÍA COLCAPIRHUA', 'blue');
        log('============================================================', 'blue');
        
        const idRestaurante = 22; // ID de la Chocolatería Colcapirhua
        
        // 1. Verificar si existe un plan enterprise (ID: 4)
        log('🔍 Verificando plan enterprise...', 'yellow');
        const planResult = await client.query(
            'SELECT id_plan FROM planes WHERE nombre = $1',
            ['enterprise']
        );
        
        if (planResult.rows.length === 0) {
            throw new Error('No se encontró el plan enterprise');
        }
        
        const idPlan = planResult.rows[0].id_plan;
        log(`✅ Plan enterprise encontrado (ID: ${idPlan})`, 'green');
        
        // 2. Crear suscripción activa
        log('💳 Creando suscripción activa...', 'yellow');
        const suscripcionResult = await client.query(`
            INSERT INTO suscripciones (
                id_restaurante, 
                id_plan, 
                estado, 
                fecha_inicio, 
                fecha_fin,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id_suscripcion
        `, [
            idRestaurante,
            idPlan,
            'activa',
            new Date(),
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año
        ]);
        
        const idSuscripcion = suscripcionResult.rows[0].id_suscripcion;
        log(`✅ Suscripción creada (ID: ${idSuscripcion})`, 'green');
        
        // 3. Crear contador inicial
        log('📊 Creando contador inicial...', 'yellow');
        await client.query(`
            INSERT INTO contadores_uso (
                id_restaurante,
                fecha,
                ventas_count,
                productos_vendidos_count,
                total_facturado,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
            idRestaurante,
            new Date().toISOString().split('T')[0], // fecha de hoy
            0, // ventas_count
            0, // productos_vendidos_count
            0.0  // total_facturado
        ]);
        
        log(`✅ Contador inicial creado`, 'green');
        
        // 4. Crear arqueo inicial
        log('💰 Creando arqueo inicial...', 'yellow');
        await client.query(`
            INSERT INTO arqueos_caja (
                id_restaurante,
                id_sucursal,
                fecha,
                monto_inicial,
                monto_final,
                estado,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
            idRestaurante,
            23, // ID de la sucursal principal
            new Date().toISOString().split('T')[0], // fecha de hoy
            0.0, // monto_inicial
            0.0, // monto_final
            'abierto'
        ]);
        
        log(`✅ Arqueo inicial creado`, 'green');
        
        await client.query('COMMIT');
        
        log('============================================================', 'green');
        log('🎉 SUSCRIPCIÓN CREADA EXITOSAMENTE', 'green');
        log('============================================================', 'green');
        log(`📊 Resumen:`, 'blue');
        log(`   • Restaurante ID: ${idRestaurante}`, 'white');
        log(`   • Plan ID: ${idPlan}`, 'white');
        log(`   • Suscripción ID: ${idSuscripcion}`, 'white');
        log(`   • Estado: activa`, 'white');
        log(`   • Duración: 1 año`, 'white');
        log(`   • Contador: creado`, 'white');
        log(`   • Arqueo: creado`, 'white');
        log('============================================================', 'green');
        
        return {
            id_suscripcion: idSuscripcion,
            id_plan: idPlan,
            estado: 'activa'
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        log(`❌ Error: ${error.message}`, 'red');
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        log('============================================================', 'blue');
        log('CREADOR DE SUSCRIPCIÓN - CHOCOLATERÍA COLCAPIRHUA', 'blue');
        log('============================================================', 'blue');
        log('Base de datos: defaultdb (PRODUCCIÓN)', 'yellow');
        log('Restaurante ID: 22 (Chocolatería Colcapirhua)', 'yellow');
        log('============================================================', 'blue');
        
        const resultado = await crearSuscripcionChocolateria();
        
        log('✅ Proceso completado exitosamente', 'green');
        log('🔄 Recarga la página del sistema para ver los cambios', 'yellow');
        
    } catch (error) {
        log(`❌ Error fatal: ${error.message}`, 'red');
        log('La creación de la suscripción ha fallado.', 'red');
        log('Verifique los datos y vuelva a intentar.', 'red');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Ejecutar el script
if (require.main === module) {
    main();
}

module.exports = { crearSuscripcionChocolateria };
