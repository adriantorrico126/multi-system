/**
 * =====================================================
 * EJECUTOR DE MIGRACIONES - SISTEMA DE TOPPINGS
 * =====================================================
 * Sistema: SITEMM POS
 * Fecha: 2025-10-10
 * Descripción: Ejecuta migraciones de forma segura y ordenada
 * =====================================================
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos - PRODUCCIÓN
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

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60) + '\n');
}

// Lista de migraciones en orden
const migrations = [
    {
        id: 1,
        file: '001_grupos_modificadores.sql',
        description: 'Crear tabla grupos_modificadores',
        critical: true
    },
    {
        id: 2,
        file: '002_mejorar_productos_modificadores.sql',
        description: 'Mejorar tabla productos_modificadores',
        critical: true
    },
    {
        id: 3,
        file: '003_productos_grupos_modificadores.sql',
        description: 'Crear relación productos-grupos',
        critical: true
    },
    {
        id: 4,
        file: '004_mejorar_detalle_ventas_modificadores.sql',
        description: 'Mejorar detalle_ventas_modificadores',
        critical: false
    },
    {
        id: 5,
        file: '005_vistas_y_funciones.sql',
        description: 'Crear vistas y funciones de validación',
        critical: false
    }
];

/**
 * Crear tabla de control de migraciones si no existe
 */
async function crearTablaMigraciones() {
    const query = `
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            description TEXT,
            status VARCHAR(20) DEFAULT 'completed' 
                CHECK (status IN ('pending', 'completed', 'failed', 'rolled_back'))
        );
    `;
    
    await pool.query(query);
    log('✓ Tabla de migraciones verificada', 'green');
}

/**
 * Verificar si una migración ya fue ejecutada
 */
async function migracionEjecutada(migrationName) {
    const result = await pool.query(
        'SELECT * FROM migrations WHERE migration_name = $1 AND status = $2',
        [migrationName, 'completed']
    );
    return result.rows.length > 0;
}

/**
 * Registrar migración ejecutada
 */
async function registrarMigracion(migrationName, description, status = 'completed') {
    await pool.query(
        `INSERT INTO migrations (migration_name, description, status, executed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (migration_name) 
         DO UPDATE SET status = $3, executed_at = NOW()`,
        [migrationName, description, status]
    );
}

/**
 * Ejecutar una migración SQL
 */
async function ejecutarMigracion(migration) {
    const { id, file, description, critical } = migration;
    
    log(`\n[${id}/5] ${description}`, 'blue');
    log(`Archivo: ${file}`, 'gray');
    
    // Verificar si ya fue ejecutada
    if (await migracionEjecutada(file)) {
        log(`⊙ Ya ejecutada previamente (omitiendo)`, 'yellow');
        return { success: true, skipped: true };
    }
    
    try {
        // Leer archivo SQL
        const sqlPath = path.join(__dirname, file);
        
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Archivo no encontrado: ${sqlPath}`);
        }
        
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Ejecutar SQL
        log(`Ejecutando...`, 'gray');
        await pool.query(sqlContent);
        
        // Registrar como completada
        await registrarMigracion(file, description, 'completed');
        
        log(`✓ Completada exitosamente`, 'green');
        return { success: true, skipped: false };
        
    } catch (error) {
        log(`✗ ERROR: ${error.message}`, 'red');
        
        // Registrar como fallida si es crítica
        if (critical) {
            await registrarMigracion(file, description, 'failed');
            throw error; // Detener ejecución
        }
        
        return { success: false, error: error.message };
    }
}

/**
 * Verificar estado de la base de datos antes de migrar
 */
async function verificarPreRequisitos() {
    logSection('VERIFICACIÓN DE PRE-REQUISITOS');
    
    try {
        // Verificar conexión
        await pool.query('SELECT NOW()');
        log('✓ Conexión a base de datos establecida', 'green');
        
        // Verificar que existe la tabla restaurantes
        const restaurantesResult = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurantes')"
        );
        
        if (!restaurantesResult.rows[0].exists) {
            throw new Error('Tabla restaurantes no existe. Sistema no inicializado correctamente.');
        }
        log('✓ Tabla restaurantes existe', 'green');
        
        // Verificar que existe la tabla productos
        const productosResult = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'productos')"
        );
        
        if (!productosResult.rows[0].exists) {
            throw new Error('Tabla productos no existe. Sistema no inicializado correctamente.');
        }
        log('✓ Tabla productos existe', 'green');
        
        // Verificar que existe la tabla productos_modificadores
        const modificadoresResult = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'productos_modificadores')"
        );
        
        if (!modificadoresResult.rows[0].exists) {
            log('⚠ Tabla productos_modificadores no existe (se creará)', 'yellow');
        } else {
            log('✓ Tabla productos_modificadores existe', 'green');
        }
        
        // Verificar que hay al menos un restaurante
        const countRestaurantes = await pool.query('SELECT COUNT(*) as count FROM restaurantes');
        const numRestaurantes = parseInt(countRestaurantes.rows[0].count);
        
        if (numRestaurantes === 0) {
            log('⚠ No hay restaurantes en la base de datos', 'yellow');
        } else {
            log(`✓ Base de datos tiene ${numRestaurantes} restaurante(s)`, 'green');
        }
        
        return true;
        
    } catch (error) {
        log(`✗ Error en verificación: ${error.message}`, 'red');
        throw error;
    }
}

/**
 * Verificar estado después de migraciones
 */
async function verificarPostMigracion() {
    logSection('VERIFICACIÓN POST-MIGRACIÓN');
    
    try {
        // Verificar tablas creadas
        const tablasEsperadas = [
            'grupos_modificadores',
            'productos_grupos_modificadores',
            'productos_modificadores',
            'detalle_ventas_modificadores'
        ];
        
        for (const tabla of tablasEsperadas) {
            const result = await pool.query(
                `SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = $1
                )`,
                [tabla]
            );
            
            if (result.rows[0].exists) {
                // Contar registros
                const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tabla}`);
                const count = countResult.rows[0].count;
                log(`✓ ${tabla} - ${count} registro(s)`, 'green');
            } else {
                log(`✗ ${tabla} NO EXISTE`, 'red');
            }
        }
        
        // Verificar vistas
        const vistasEsperadas = [
            'vista_modificadores_completa',
            'vista_grupos_por_producto'
        ];
        
        console.log('\nVistas:');
        for (const vista of vistasEsperadas) {
            const result = await pool.query(
                `SELECT EXISTS (
                    SELECT 1 FROM information_schema.views 
                    WHERE table_name = $1
                )`,
                [vista]
            );
            
            if (result.rows[0].exists) {
                log(`✓ ${vista}`, 'green');
            } else {
                log(`⚠ ${vista} no creada`, 'yellow');
            }
        }
        
        // Verificar función de validación
        console.log('\nFunciones:');
        const funcionResult = await pool.query(
            `SELECT EXISTS (
                SELECT 1 FROM pg_proc 
                WHERE proname = 'validar_modificadores_producto'
            )`
        );
        
        if (funcionResult.rows[0].exists) {
            log('✓ validar_modificadores_producto', 'green');
        } else {
            log('⚠ validar_modificadores_producto no creada', 'yellow');
        }
        
    } catch (error) {
        log(`⚠ Error en verificación: ${error.message}`, 'yellow');
    }
}

/**
 * Función principal
 */
async function main() {
    logSection('SISTEMA DE MIGRACIONES - TOPPINGS PROFESIONAL');
    
    console.log('Base de datos: defaultdb (PRODUCCIÓN)');
    console.log('Host: db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com:25060');
    console.log('Usuario: doadmin');
    console.log('');
    
    try {
        // Paso 1: Verificar pre-requisitos
        await verificarPreRequisitos();
        
        // Paso 2: Crear tabla de control de migraciones
        await crearTablaMigraciones();
        
        // Paso 3: Ejecutar migraciones
        logSection('EJECUTANDO MIGRACIONES');
        
        let completadas = 0;
        let omitidas = 0;
        let fallidas = 0;
        
        for (const migration of migrations) {
            const result = await ejecutarMigracion(migration);
            
            if (result.skipped) {
                omitidas++;
            } else if (result.success) {
                completadas++;
            } else {
                fallidas++;
            }
        }
        
        // Paso 4: Verificar resultado
        await verificarPostMigracion();
        
        // Resumen final
        logSection('RESUMEN DE EJECUCIÓN');
        log(`✓ Migraciones completadas: ${completadas}`, 'green');
        if (omitidas > 0) log(`⊙ Migraciones omitidas: ${omitidas}`, 'yellow');
        if (fallidas > 0) log(`✗ Migraciones fallidas: ${fallidas}`, 'red');
        
        console.log('');
        log('========================================', 'green');
        log('MIGRACIONES COMPLETADAS EXITOSAMENTE', 'green');
        log('========================================', 'green');
        console.log('');
        
        log('Siguiente paso:', 'cyan');
        console.log('1. Verificar que todo funciona correctamente');
        console.log('2. Continuar con la implementación del backend');
        console.log('');
        
    } catch (error) {
        logSection('ERROR EN MIGRACIONES');
        log(`Error fatal: ${error.message}`, 'red');
        log(`Stack trace: ${error.stack}`, 'gray');
        console.log('');
        log('Las migraciones han sido detenidas.', 'yellow');
        log('Restaure el backup si es necesario.', 'yellow');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Ejecutar
main().catch(error => {
    console.error('Error no capturado:', error);
    process.exit(1);
});

