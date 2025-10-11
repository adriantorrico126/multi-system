/**
 * =====================================================
 * ANÁLISIS COMPLETO DEL SISTEMA DE PLANES
 * =====================================================
 * Verifica la integridad y consistencia del sistema de planes
 * =====================================================
 */

const { Pool } = require('pg');

// Configuración para base de datos local
const poolLocal = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: 'localhost',
    port: 5432,
    database: 'sistempos'
});

// Configuración para base de datos de producción
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

const log = (message, color = 'white') => {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
    log(`\n${'='.repeat(80)}`, 'cyan');
    log(title.toUpperCase(), 'cyan');
    log('='.repeat(80), 'cyan');
};

async function analizarBaseDatos(pool, nombre) {
    logSection(`ANÁLISIS DE BASE DE DATOS: ${nombre}`);
    
    try {
        // 1. Verificar existencia de tablas
        log('\n📋 1. VERIFICANDO EXISTENCIA DE TABLAS...', 'yellow');
        const tablas = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('planes', 'suscripciones', 'contadores_uso', 'alertas_limites')
            ORDER BY table_name
        `);
        
        tablas.rows.forEach(t => log(`   ✓ ${t.table_name}`, 'green'));
        
        if (tablas.rows.length < 4) {
            log(`   ⚠️  Faltan ${4 - tablas.rows.length} tablas`, 'yellow');
        }
        
        // 2. Estructura de planes
        log('\n📐 2. ESTRUCTURA DE TABLA planes:', 'yellow');
        const structPlanes = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'planes'
            ORDER BY ordinal_position
        `);
        
        structPlanes.rows.forEach(r => {
            log(`   ${r.column_name.padEnd(30)} ${r.data_type.padEnd(25)} ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`, 'white');
        });
        
        // 3. Planes existentes
        log('\n📊 3. PLANES EXISTENTES:', 'yellow');
        const planes = await pool.query('SELECT * FROM planes ORDER BY id_plan');
        
        if (planes.rows.length === 0) {
            log('   ❌ NO HAY PLANES EN LA BASE DE DATOS', 'red');
        } else {
            planes.rows.forEach(p => {
                log(`   [ID: ${p.id_plan}] ${p.nombre}`, 'green');
                log(`      Precio: $${p.precio_mensual}/mes | $${p.precio_anual}/año`, 'white');
                log(`      Límites: ${p.max_sucursales || '∞'} sucursales, ${p.max_usuarios || '∞'} usuarios`, 'white');
            });
        }
        
        // 4. Estructura de suscripciones
        log('\n📐 4. ESTRUCTURA DE TABLA suscripciones:', 'yellow');
        const structSusc = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'suscripciones'
            ORDER BY ordinal_position
        `);
        
        structSusc.rows.forEach(r => {
            log(`   ${r.column_name.padEnd(30)} ${r.data_type.padEnd(25)} ${r.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`, 'white');
        });
        
        // 5. Suscripciones activas y su relación con planes
        log('\n💳 5. SUSCRIPCIONES ACTIVAS:', 'yellow');
        const susc = await pool.query(`
            SELECT 
                s.id_suscripcion,
                s.id_restaurante,
                s.id_plan,
                s.estado,
                s.fecha_inicio,
                s.fecha_fin,
                p.nombre as plan_nombre,
                p.id as plan_id_real,
                r.nombre as restaurante_nombre
            FROM suscripciones s
            LEFT JOIN planes p ON s.id_plan = p.id_plan
            LEFT JOIN restaurantes r ON s.id_restaurante = r.id_restaurante
            WHERE s.estado = 'activa'
            ORDER BY s.id_restaurante
        `);
        
        if (susc.rows.length === 0) {
            log('   ⚠️  NO HAY SUSCRIPCIONES ACTIVAS', 'yellow');
        } else {
            susc.rows.forEach(s => {
                const planStatus = s.plan_nombre ? '✓' : '❌ PLAN NO EXISTE';
                const color = s.plan_nombre ? 'green' : 'red';
                log(`   [${planStatus}] Restaurante ${s.id_restaurante}: ${(s.restaurante_nombre || 'Sin nombre').substring(0, 40)}`, color);
                log(`      Plan ID: ${s.id_plan} -> ${s.plan_nombre || 'ERROR: Plan no encontrado en planes_pos'}`, color);
                log(`      Vigencia: ${s.fecha_inicio?.toISOString().split('T')[0]} a ${s.fecha_fin?.toISOString().split('T')[0]}`, 'white');
            });
        }
        
        // 6. Verificar integridad referencial
        log('\n🔗 6. VERIFICANDO INTEGRIDAD REFERENCIAL:', 'yellow');
        const suscSinPlan = await pool.query(`
            SELECT COUNT(*) as count
            FROM suscripciones s
            LEFT JOIN planes p ON s.id_plan = p.id_plan
            WHERE p.id IS NULL AND s.estado = 'activa'
        `);
        
        const count = parseInt(suscSinPlan.rows[0].count);
        if (count > 0) {
            log(`   ❌ ${count} suscripciones activas apuntan a planes inexistentes`, 'red');
        } else {
            log(`   ✓ Todas las suscripciones activas tienen planes válidos`, 'green');
        }
        
        // 7. Contadores de uso
        log('\n📈 7. CONTADORES DE USO:', 'yellow');
        const contadores = await pool.query(`
            SELECT 
                cu.id_contador,
                cu.id_restaurante,
                cu.id_plan,
                cu.recurso,
                cu.uso_actual,
                cu.limite_plan,
                p.nombre as plan_nombre
            FROM contadores_uso cu
            LEFT JOIN planes p ON cu.id_plan = p.id_plan
            ORDER BY cu.id_restaurante, cu.recurso
            LIMIT 20
        `);
        
        if (contadores.rows.length === 0) {
            log('   ⚠️  NO HAY CONTADORES DE USO', 'yellow');
        } else {
            const grouped = {};
            contadores.rows.forEach(c => {
                if (!grouped[c.id_restaurante]) grouped[c.id_restaurante] = [];
                grouped[c.id_restaurante].push(c);
            });
            
            Object.keys(grouped).slice(0, 5).forEach(rest => {
                log(`   Restaurante ${rest}:`, 'white');
                grouped[rest].forEach(c => {
                    const planStatus = c.plan_nombre ? `Plan: ${c.plan_nombre}` : `❌ Plan ${c.id_plan} no existe`;
                    log(`      ${c.recurso}: ${c.uso_actual}/${c.limite_plan} (${planStatus})`, c.plan_nombre ? 'white' : 'red');
                });
            });
        }
        
    } catch (error) {
        log(`\n❌ ERROR EN ANÁLISIS: ${error.message}`, 'red');
        console.error(error);
    }
}

async function analizarCodigo() {
    logSection('ANÁLISIS DE CÓDIGO FUENTE');
    
    const fs = require('fs');
    const path = require('path');
    
    log('\n🔍 8. VERIFICANDO ARCHIVOS DE MODELOS:', 'yellow');
    
    const modelos = [
        'PlanModel.js',
        'SuscripcionModel.js',
        'ContadorUsoModel.js',
        'AlertaLimiteModel.js'
    ];
    
    const basePath = path.join(__dirname, '../src/models');
    
    for (const modelo of modelos) {
        const filePath = path.join(basePath, modelo);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Verificar referencias incorrectas
            const badRefs = [
                { pattern: /FROM planes_pos/g, desc: 'FROM planes_pos (debería ser planes)' },
                { pattern: /JOIN planes_pos/g, desc: 'JOIN planes_pos (debería ser planes)' },
                { pattern: /INTO planes_pos/g, desc: 'INTO planes_pos (debería ser planes)' },
                { pattern: /UPDATE planes_pos/g, desc: 'UPDATE planes_pos (debería ser planes)' },
                { pattern: /p\.id(?! )/g, desc: 'p.id (debería ser p.id_plan)' }
            ];
            
            let hasErrors = false;
            badRefs.forEach(ref => {
                const matches = content.match(ref.pattern);
                if (matches) {
                    if (!hasErrors) {
                        log(`   ❌ ${modelo}:`, 'red');
                        hasErrors = true;
                    }
                    log(`      - ${matches.length} ocurrencias de ${ref.desc}`, 'red');
                }
            });
            
            if (!hasErrors) {
                log(`   ✓ ${modelo}`, 'green');
            }
        } else {
            log(`   ⚠️  ${modelo} no encontrado`, 'yellow');
        }
    }
}

async function main() {
    log('\n' + '█'.repeat(80), 'cyan');
    log('ANÁLISIS COMPLETO DEL SISTEMA DE PLANES - SITEMM POS'.padStart(50), 'cyan');
    log('█'.repeat(80) + '\n', 'cyan');
    
    try {
        // Analizar base de datos local
        await analizarBaseDatos(poolLocal, 'LOCAL (desarrollo)');
        await poolLocal.end();
        
        // Analizar base de datos de producción
        await analizarBaseDatos(poolProd, 'PRODUCCIÓN (DigitalOcean)');
        await poolProd.end();
        
        // Analizar código fuente
        await analizarCodigo();
        
        logSection('RESUMEN Y RECOMENDACIONES');
        log('\n✅ Análisis completado exitosamente', 'green');
        log('\n📋 Para aplicar cambios en producción:', 'yellow');
        log('   1. Hacer commit de los cambios en el código', 'white');
        log('   2. Push al repositorio', 'white');
        log('   3. Hacer pull en el servidor de producción', 'white');
        log('   4. Reiniciar el servidor backend en producción', 'white');
        log('\n' + '='.repeat(80) + '\n', 'cyan');
        
    } catch (error) {
        log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

main();
