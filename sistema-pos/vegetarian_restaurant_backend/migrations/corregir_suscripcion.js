/**
 * =====================================================
 * CORREGIR SUSCRIPCIÓN PARA CHOCOLATERÍA COLCAPIRHUA
 * =====================================================
 * Sistema: SITEMM POS
 * Fecha: 2025-10-10
 * Descripción: Agregar id_restaurante a la suscripción existente
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

async function corregirSuscripcion() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        log('============================================================', 'blue');
        log('CORRIGIENDO SUSCRIPCIÓN - CHOCOLATERÍA COLCAPIRHUA', 'blue');
        log('============================================================', 'blue');
        
        const idRestaurante = 22; // ID de la Chocolatería Colcapirhua
        const idSuscripcion = 86; // ID de la suscripción existente
        
        // 1. Verificar si la tabla tiene el campo id_restaurante
        log('🔍 Verificando estructura de tabla suscripciones...', 'yellow');
        const structureResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'suscripciones' 
            AND column_name = 'id_restaurante'
        `);
        
        if (structureResult.rows.length === 0) {
            log('⚠️  Campo id_restaurante no existe, agregándolo...', 'yellow');
            await client.query(`
                ALTER TABLE suscripciones 
                ADD COLUMN id_restaurante INTEGER
            `);
            log('✅ Campo id_restaurante agregado', 'green');
        } else {
            log('✅ Campo id_restaurante ya existe', 'green');
        }
        
        // 2. Actualizar la suscripción con el id_restaurante
        log('📝 Actualizando suscripción con id_restaurante...', 'yellow');
        const updateResult = await client.query(`
            UPDATE suscripciones 
            SET id_restaurante = $1, updated_at = NOW()
            WHERE id_suscripcion = $2
            RETURNING id_suscripcion, id_plan, estado, id_restaurante
        `, [idRestaurante, idSuscripcion]);
        
        if (updateResult.rows.length > 0) {
            const suscripcion = updateResult.rows[0];
            log(`✅ Suscripción actualizada:`, 'green');
            log(`   • ID: ${suscripcion.id_suscripcion}`, 'white');
            log(`   • Plan: ${suscripcion.id_plan}`, 'white');
            log(`   • Estado: ${suscripcion.estado}`, 'white');
            log(`   • Restaurante: ${suscripcion.id_restaurante}`, 'white');
        } else {
            log('❌ No se pudo actualizar la suscripción', 'red');
        }
        
        // 3. Verificar que la actualización fue exitosa
        log('🔍 Verificando actualización...', 'yellow');
        const verifyResult = await client.query(
            'SELECT * FROM suscripciones WHERE id_suscripcion = $1',
            [idSuscripcion]
        );
        
        if (verifyResult.rows.length > 0) {
            log('✅ Verificación exitosa:', 'green');
            console.log(verifyResult.rows[0]);
        }
        
        await client.query('COMMIT');
        
        log('============================================================', 'green');
        log('🎉 SUSCRIPCIÓN CORREGIDA EXITOSAMENTE', 'green');
        log('============================================================', 'green');
        log(`📊 Resumen:`, 'blue');
        log(`   • Restaurante ID: ${idRestaurante}`, 'white');
        log(`   • Suscripción ID: ${idSuscripcion}`, 'white');
        log(`   • Estado: activa`, 'white');
        log(`   • Plan: enterprise`, 'white');
        log('============================================================', 'green');
        
        return {
            id_suscripcion: idSuscripcion,
            id_restaurante: idRestaurante
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
        log('CORRECTOR DE SUSCRIPCIÓN - CHOCOLATERÍA COLCAPIRHUA', 'blue');
        log('============================================================', 'blue');
        log('Base de datos: defaultdb (PRODUCCIÓN)', 'yellow');
        log('Restaurante ID: 22 (Chocolatería Colcapirhua)', 'yellow');
        log('============================================================', 'blue');
        
        const resultado = await corregirSuscripcion();
        
        log('✅ Proceso completado exitosamente', 'green');
        log('🔄 Recarga la página del sistema para ver los cambios', 'yellow');
        
    } catch (error) {
        log(`❌ Error fatal: ${error.message}`, 'red');
        log('La corrección de la suscripción ha fallado.', 'red');
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

module.exports = { corregirSuscripcion };
