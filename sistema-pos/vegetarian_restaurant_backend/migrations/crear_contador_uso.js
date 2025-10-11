/**
 * =====================================================
 * CREAR CONTADOR DE USO PARA CHOCOLATERÍA COLCAPIRHUA
 * =====================================================
 * Sistema: SITEMM POS
 * Fecha: 2025-10-10
 * Descripción: Crear contador de uso para el restaurante ID 22
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

async function crearContadorUso() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        log('============================================================', 'blue');
        log('CREANDO CONTADOR DE USO - CHOCOLATERÍA COLCAPIRHUA', 'blue');
        log('============================================================', 'blue');
        
        const idRestaurante = 22; // ID de la Chocolatería Colcapirhua
        
        // 1. Verificar si ya existe un contador
        log('🔍 Verificando contador existente...', 'yellow');
        const existingResult = await client.query(
            'SELECT id_contador FROM contadores_uso WHERE id_restaurante = $1',
            [idRestaurante]
        );
        
        if (existingResult.rows.length > 0) {
            log(`⚠️  Ya existe un contador (ID: ${existingResult.rows[0].id_contador})`, 'yellow');
            log('✅ No se necesita crear un contador nuevo', 'green');
            await client.query('COMMIT');
            return;
        }
        
        // 2. Crear contador de uso
        log('📊 Creando contador de uso...', 'yellow');
        const contadorResult = await client.query(`
            INSERT INTO contadores_uso (
                id_restaurante,
                id_plan,
                recurso,
                uso_actual,
                limite_plan,
                fecha_medicion
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_contador
        `, [
            idRestaurante,
            4, // id_plan (enterprise)
            'productos', // recurso
            45, // uso_actual (45 productos creados)
            1000, // limite_plan (límite alto para enterprise)
            new Date() // fecha_medicion
        ]);
        
        const idContador = contadorResult.rows[0].id_contador;
        log(`✅ Contador de uso creado (ID: ${idContador})`, 'green');
        
        await client.query('COMMIT');
        
        log('============================================================', 'green');
        log('🎉 CONTADOR DE USO CREADO EXITOSAMENTE', 'green');
        log('============================================================', 'green');
        log(`📊 Resumen:`, 'blue');
        log(`   • Restaurante ID: ${idRestaurante}`, 'white');
        log(`   • Contador ID: ${idContador}`, 'white');
        log(`   • Recurso: productos`, 'white');
        log(`   • Uso actual: 45`, 'white');
        log(`   • Límite plan: 1000`, 'white');
        log('============================================================', 'green');
        
        return {
            id_contador: idContador,
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
        log('CREADOR DE CONTADOR DE USO - CHOCOLATERÍA COLCAPIRHUA', 'blue');
        log('============================================================', 'blue');
        log('Base de datos: defaultdb (PRODUCCIÓN)', 'yellow');
        log('Restaurante ID: 22 (Chocolatería Colcapirhua)', 'yellow');
        log('============================================================', 'blue');
        
        const resultado = await crearContadorUso();
        
        log('✅ Proceso completado exitosamente', 'green');
        log('🔄 Recarga la página del sistema para ver los cambios', 'yellow');
        
    } catch (error) {
        log(`❌ Error fatal: ${error.message}`, 'red');
        log('La creación del contador ha fallado.', 'red');
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

module.exports = { crearContadorUso };
