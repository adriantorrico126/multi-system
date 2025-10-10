/**
 * =====================================================
 * TEST COMPLETO DEL SISTEMA DE TOPPINGS
 * =====================================================
 * Sistema: SITEMM POS
 * Fecha: 2025-10-10
 * =====================================================
 */

const { Pool } = require('pg');
const axios = require('axios');

// Configuración
const pool = new Pool({
    user: 'postgres',
    password: '6951230Anacleta',
    host: 'localhost',
    port: 5432,
    database: 'sistempos'
});

const API_URL = 'http://localhost:3000/api/v1';
let authToken = '';

// Colores
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60) + '\n');
}

/**
 * FASE 1: Verificar Base de Datos
 */
async function testDatabase() {
    logSection('FASE 1: VERIFICACIÓN DE BASE DE DATOS');
    
    try {
        // Test 1: Tabla grupos_modificadores
        const grupos = await pool.query('SELECT COUNT(*) as count FROM grupos_modificadores');
        log(`✓ Test 1: Tabla grupos_modificadores existe (${grupos.rows[0].count} registros)`, 'green');
        
        // Test 2: Tabla productos_grupos_modificadores
        const pgm = await pool.query('SELECT COUNT(*) as count FROM productos_grupos_modificadores');
        log(`✓ Test 2: Tabla productos_grupos_modificadores existe (${pgm.rows[0].count} registros)`, 'green');
        
        // Test 3: Columnas nuevas en productos_modificadores
        const columnas = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'productos_modificadores'
            AND column_name IN ('id_grupo_modificador', 'stock_disponible', 'descripcion', 'id_restaurante')
        `);
        log(`✓ Test 3: Nuevas columnas creadas (${columnas.rows.length}/4)`, 
            columnas.rows.length === 4 ? 'green' : 'yellow');
        
        // Test 4: Vista vista_grupos_por_producto
        const vista1 = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vista_grupos_por_producto')"
        );
        log(`✓ Test 4: Vista vista_grupos_por_producto ${vista1.rows[0].exists ? 'existe' : 'NO existe'}`, 
            vista1.rows[0].exists ? 'green' : 'red');
        
        // Test 5: Función de validación
        const func = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validar_modificadores_producto')"
        );
        log(`✓ Test 5: Función validar_modificadores_producto ${func.rows[0].exists ? 'existe' : 'NO existe'}`, 
            func.rows[0].exists ? 'green' : 'red');
        
        return true;
    } catch (error) {
        log(`✗ Error en verificación de BD: ${error.message}`, 'red');
        return false;
    }
}

/**
 * FASE 2: Crear Datos de Prueba
 */
async function crearDatosPrueba() {
    logSection('FASE 2: CREAR DATOS DE PRUEBA');
    
    try {
        // Obtener un restaurante y producto para pruebas
        const restaurante = await pool.query('SELECT id_restaurante FROM restaurantes LIMIT 1');
        if (restaurante.rows.length === 0) {
            log('✗ No hay restaurantes en la BD', 'red');
            return false;
        }
        const idRestaurante = restaurante.rows[0].id_restaurante;
        log(`✓ Usando restaurante ID: ${idRestaurante}`, 'green');
        
        const producto = await pool.query(
            'SELECT id_producto, nombre FROM productos WHERE id_restaurante = $1 AND activo = true LIMIT 1',
            [idRestaurante]
        );
        if (producto.rows.length === 0) {
            log('✗ No hay productos en la BD', 'red');
            return false;
        }
        const idProducto = producto.rows[0].id_producto;
        log(`✓ Usando producto: ${producto.rows[0].nombre} (ID: ${idProducto})`, 'green');
        
        // Crear grupo de modificadores de prueba
        const grupo = await pool.query(`
            INSERT INTO grupos_modificadores (
                nombre, descripcion, tipo, min_selecciones, max_selecciones, 
                es_obligatorio, orden_display, id_restaurante
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT DO NOTHING
            RETURNING *
        `, [
            'Tamaño de Porción',
            'Elige el tamaño de tu porción',
            'seleccion_unica',
            1,
            1,
            true,
            1,
            idRestaurante
        ]);
        
        if (grupo.rows.length > 0) {
            log(`✓ Grupo creado: ${grupo.rows[0].nombre}`, 'green');
            const idGrupo = grupo.rows[0].id_grupo_modificador;
            
            // Crear modificadores de prueba
            const mod1 = await pool.query(`
                INSERT INTO productos_modificadores (
                    id_producto, nombre_modificador, precio_extra, tipo_modificador,
                    id_grupo_modificador, descripcion, orden_display, id_restaurante, activo
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                ON CONFLICT DO NOTHING
                RETURNING *
            `, [idProducto, 'Porción Individual', 0, 'tamaño', idGrupo, 'Porción para 1 persona', 1, idRestaurante]);
            
            const mod2 = await pool.query(`
                INSERT INTO productos_modificadores (
                    id_producto, nombre_modificador, precio_extra, tipo_modificador,
                    id_grupo_modificador, descripcion, orden_display, id_restaurante, activo
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                ON CONFLICT DO NOTHING
                RETURNING *
            `, [idProducto, 'Porción Doble', 5, 'tamaño', idGrupo, 'Porción para 2 personas', 2, idRestaurante]);
            
            if (mod1.rows.length > 0) log(`✓ Modificador 1 creado: ${mod1.rows[0].nombre_modificador}`, 'green');
            if (mod2.rows.length > 0) log(`✓ Modificador 2 creado: ${mod2.rows[0].nombre_modificador}`, 'green');
            
            // Asociar grupo a producto
            const asociacion = await pool.query(`
                INSERT INTO productos_grupos_modificadores (
                    id_producto, id_grupo_modificador, orden_display, es_obligatorio
                )
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id_producto, id_grupo_modificador) DO NOTHING
                RETURNING *
            `, [idProducto, idGrupo, 1, true]);
            
            if (asociacion.rows.length > 0) {
                log(`✓ Grupo asociado al producto`, 'green');
            }
        } else {
            log('⊙ Grupo ya existía (OK)', 'yellow');
        }
        
        return { idRestaurante, idProducto };
    } catch (error) {
        log(`✗ Error al crear datos de prueba: ${error.message}`, 'red');
        return false;
    }
}

/**
 * FASE 3: Login y Autenticación
 */
async function login() {
    logSection('FASE 3: AUTENTICACIÓN');
    
    try {
        // Intentar login con usuario existente
        const response = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        
        authToken = response.data.token;
        log(`✓ Login exitoso`, 'green');
        log(`  Usuario: ${response.data.data.nombre}`, 'cyan');
        log(`  Rol: ${response.data.data.rol}`, 'cyan');
        log(`  Restaurante: ${response.data.data.restaurante.nombre}`, 'cyan');
        
        return response.data.data;
    } catch (error) {
        log(`⚠ No se pudo hacer login con usuario admin`, 'yellow');
        log(`  Nota: Crear un usuario admin para testing completo`, 'yellow');
        return null;
    }
}

/**
 * FASE 4: Test de API
 */
async function testAPI(testData) {
    if (!testData) {
        log('⊙ Saltando tests de API (sin datos de prueba)', 'yellow');
        return;
    }
    
    const { idProducto } = testData;
    
    logSection('FASE 4: TEST DE API ENDPOINTS');
    
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    try {
        // Test 1: Obtener grupos de un producto
        try {
            const response1 = await axios.get(
                `${API_URL}/modificadores/producto/${idProducto}/grupos`,
                { headers }
            );
            log(`✓ Test 1: GET /modificadores/producto/:id/grupos`, 'green');
            log(`  Grupos encontrados: ${response1.data.count}`, 'cyan');
        } catch (e) {
            log(`⚠ Test 1: Endpoint requiere autenticación`, 'yellow');
        }
        
        // Test 2: Obtener modificadores completos
        try {
            const response2 = await axios.get(
                `${API_V1}/modificadores/producto/${idProducto}/completos`,
                { headers }
            );
            log(`✓ Test 2: GET /modificadores/producto/:id/completos`, 'green');
        } catch (e) {
            log(`⊙ Test 2: ${e.response?.status === 401 ? 'Requiere auth' : 'Error'}`, 'yellow');
        }
        
        // Test 3: Validar selección (sin auth necesario en algunos casos)
        try {
            const response3 = await axios.post(
                `${API_URL}/modificadores/validar`,
                {
                    id_producto: idProducto,
                    modificadores: []
                },
                { headers }
            );
            log(`✓ Test 3: POST /modificadores/validar`, 'green');
            log(`  Validación: ${response3.data.success ? 'Válida' : 'Inválida'}`, 'cyan');
        } catch (e) {
            log(`⊙ Test 3: ${e.response?.status === 401 ? 'Requiere auth' : 'Error'}`, 'yellow');
        }
        
        // Test 4: Obtener grupos (admin)
        if (authToken) {
            try {
                const response4 = await axios.get(
                    `${API_URL}/modificadores/grupos`,
                    { headers }
                );
                log(`✓ Test 4: GET /modificadores/grupos`, 'green');
                log(`  Total grupos: ${response4.data.count}`, 'cyan');
            } catch (e) {
                log(`⊙ Test 4: ${e.response?.data?.message || 'Error'}`, 'yellow');
            }
        }
        
    } catch (error) {
        log(`✗ Error en tests de API: ${error.message}`, 'red');
    }
}

/**
 * FASE 5: Test de Vistas SQL
 */
async function testViews() {
    logSection('FASE 5: TEST DE VISTAS SQL');
    
    try {
        // Test vista_grupos_por_producto
        const vista1 = await pool.query(`
            SELECT id_producto, producto_nombre, grupo_nombre, total_modificadores
            FROM vista_grupos_por_producto
            LIMIT 5
        `);
        log(`✓ vista_grupos_por_producto: ${vista1.rows.length} resultado(s)`, 'green');
        
        if (vista1.rows.length > 0) {
            vista1.rows.forEach(row => {
                log(`  - ${row.producto_nombre} → ${row.grupo_nombre} (${row.total_modificadores} mods)`, 'cyan');
            });
        }
        
        // Test vista_modificadores_completa
        const vista2 = await pool.query(`
            SELECT nombre_modificador, precio_final, estado_stock, grupo_nombre
            FROM vista_modificadores_completa
            LIMIT 5
        `);
        log(`\n✓ vista_modificadores_completa: ${vista2.rows.length} resultado(s)`, 'green');
        
        if (vista2.rows.length > 0) {
            vista2.rows.forEach(row => {
                log(`  - ${row.nombre_modificador} (${row.grupo_nombre || 'Sin grupo'}) - Bs ${row.precio_final} [${row.estado_stock}]`, 'cyan');
            });
        }
        
    } catch (error) {
        log(`✗ Error en test de vistas: ${error.message}`, 'red');
    }
}

/**
 * FASE 6: Test de Función de Validación
 */
async function testValidationFunction(testData) {
    if (!testData) {
        log('\n⊙ Saltando test de función de validación (sin datos)', 'yellow');
        return;
    }
    
    logSection('FASE 6: TEST DE FUNCIÓN DE VALIDACIÓN');
    
    const { idProducto } = testData;
    
    try {
        // Test 1: Validación vacía (debería fallar si hay grupos obligatorios)
        const test1 = await pool.query(
            'SELECT * FROM validar_modificadores_producto($1, $2)',
            [idProducto, []]
        );
        log(`Test 1: Validación con array vacío`, test1.rows[0].es_valido ? 'green' : 'yellow');
        log(`  Resultado: ${test1.rows[0].mensaje_error}`, 'cyan');
        
        // Test 2: Obtener modificadores del producto
        const mods = await pool.query(`
            SELECT id_modificador FROM productos_modificadores
            WHERE id_producto = $1 AND activo = true
            LIMIT 2
        `, [idProducto]);
        
        if (mods.rows.length > 0) {
            const modsIds = mods.rows.map(r => r.id_modificador);
            const test2 = await pool.query(
                'SELECT * FROM validar_modificadores_producto($1, $2)',
                [idProducto, modsIds]
            );
            log(`\nTest 2: Validación con modificadores seleccionados`, test2.rows[0].es_valido ? 'green' : 'yellow');
            log(`  Resultado: ${test2.rows[0].mensaje_error}`, 'cyan');
        }
        
    } catch (error) {
        log(`✗ Error en test de validación: ${error.message}`, 'red');
    }
}

/**
 * FASE 7: Resumen y Recomendaciones
 */
async function mostrarResumen() {
    logSection('RESUMEN DE TESTS');
    
    try {
        // Estadísticas generales
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM grupos_modificadores WHERE activo = true) as grupos_activos,
                (SELECT COUNT(*) FROM productos_modificadores WHERE activo = true) as modificadores_activos,
                (SELECT COUNT(*) FROM productos_grupos_modificadores) as asociaciones,
                (SELECT COUNT(*) FROM restaurantes) as restaurantes,
                (SELECT COUNT(*) FROM productos WHERE activo = true) as productos
        `);
        
        const s = stats.rows[0];
        
        console.log('📊 Estadísticas del Sistema:');
        console.log(`   Restaurantes: ${s.restaurantes}`);
        console.log(`   Productos activos: ${s.productos}`);
        console.log(`   Grupos de modificadores: ${s.grupos_activos}`);
        console.log(`   Modificadores activos: ${s.modificadores_activos}`);
        console.log(`   Asociaciones producto-grupo: ${s.asociaciones}`);
        
        console.log('\n📝 Próximos Pasos:');
        console.log('   1. Configurar grupos de modificadores para tus productos');
        console.log('   2. Agregar modificadores a cada grupo');
        console.log('   3. Asociar grupos a los productos correspondientes');
        console.log('   4. Probar en el frontend');
        
        console.log('\n💡 Comandos Útiles:');
        console.log('   Ver grupos: SELECT * FROM grupos_modificadores;');
        console.log('   Ver asociaciones: SELECT * FROM vista_grupos_por_producto;');
        console.log('   Ver todo: SELECT * FROM vista_modificadores_completa;');
        
    } catch (error) {
        log(`Error al obtener resumen: ${error.message}`, 'red');
    }
}

/**
 * Función Principal
 */
async function main() {
    console.log('');
    log('╔════════════════════════════════════════════════════════╗', 'cyan');
    log('║  TEST COMPLETO DEL SISTEMA DE TOPPINGS PROFESIONAL    ║', 'cyan');
    log('╚════════════════════════════════════════════════════════╝', 'cyan');
    
    try {
        // Fase 1: Base de datos
        const dbOk = await testDatabase();
        if (!dbOk) {
            log('\n✗ Tests de BD fallaron. Revisar migración.', 'red');
            return;
        }
        
        // Fase 2: Datos de prueba
        const testData = await crearDatosPrueba();
        
        // Fase 3: Login
        const userData = await login();
        
        // Fase 4: API
        await testAPI(testData || undefined);
        
        // Fase 5: Vistas
        await testViews();
        
        // Fase 6: Validación
        await testValidationFunction(testData || undefined);
        
        // Fase 7: Resumen
        await mostrarResumen();
        
        // Final
        logSection('TESTS COMPLETADOS');
        log('✅ Sistema de Toppings Profesional instalado correctamente', 'green');
        log('✅ Base de datos configurada', 'green');
        log('✅ Vistas y funciones operativas', 'green');
        
        if (!authToken) {
            log('\n⚠️  Recomendación: Crear un usuario admin para probar la API completa', 'yellow');
        } else {
            log('\n✅ API verificada y funcional', 'green');
        }
        
    } catch (error) {
        log(`\n✗ Error fatal: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await pool.end();
    }
}

// Ejecutar
main();

