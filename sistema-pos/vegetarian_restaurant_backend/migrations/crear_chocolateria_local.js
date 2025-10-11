/**
 * =====================================================
 * SCRIPT DE CREACIÓN DE RESTAURANTE - CHOCOLATERÍA COLCAPIRHUA (LOCAL)
 * =====================================================
 * Sistema: SITEMM POS
 * Autor: Sistema de Migración Automatizada
 * Fecha: 2025-10-10
 * Descripción: Crear nuevo restaurante completo en base de datos LOCAL
 * =====================================================
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const datos = require('./datos_restaurante');

// =====================================================
// CONFIGURACIÓN DE BASE DE DATOS LOCAL
// =====================================================
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sistempos'
});

// =====================================================
// FUNCIONES DE LOG CON COLORES
// =====================================================
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
    log(`\n============================================================`, 'cyan');
    log(`${title}`, 'cyan');
    log(`============================================================`, 'cyan');
};

// =====================================================
// DATOS DE LOS PRODUCTOS DE CHOCOLATE
// =====================================================
const categoriasChocolates = [
    { nombre: 'Bolsas' },
    { nombre: 'Cajas' },
    { nombre: 'Canastas' },
    { nombre: 'Tabletas' }
];

const productosChocolates = [
    // Bolsas
    { nombre: 'Bolsa de Bombones Surtidos 250g', precio: 35.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Chocolates con Leche 300g', precio: 40.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Chocolates Amargos 250g', precio: 45.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Trufas Variadas 200g', precio: 50.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Pralinés Surtidos 300g', precio: 55.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Chocolates Rellenos 250g', precio: 42.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Mini Chocolates 400g', precio: 38.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Chocolates con Almendras 300g', precio: 48.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Chocolates con Nuez 300g', precio: 48.00, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Bombones Licor 200g', precio: 60.00, categoria: 'Bolsas' },
    
    // Cajas
    { nombre: 'Caja de Bombones Premium 12 unidades', precio: 80.00, categoria: 'Cajas' },
    { nombre: 'Caja de Bombones Premium 24 unidades', precio: 150.00, categoria: 'Cajas' },
    { nombre: 'Caja de Trufas Gourmet 16 unidades', precio: 120.00, categoria: 'Cajas' },
    { nombre: 'Caja de Pralinés Finos 20 unidades', precio: 140.00, categoria: 'Cajas' },
    { nombre: 'Caja de Chocolates Artesanales 18 unidades', precio: 110.00, categoria: 'Cajas' },
    { nombre: 'Caja de Bombones Surtidos 30 unidades', precio: 180.00, categoria: 'Cajas' },
    { nombre: 'Caja de Chocolates Belgas 12 unidades', precio: 95.00, categoria: 'Cajas' },
    { nombre: 'Caja de Trufas con Licor 12 unidades', precio: 130.00, categoria: 'Cajas' },
    { nombre: 'Caja de Bombones Corazón 16 unidades', precio: 125.00, categoria: 'Cajas' },
    { nombre: 'Caja de Chocolates Especiales 24 unidades', precio: 160.00, categoria: 'Cajas' },
    { nombre: 'Caja de Pralinés con Nuez 15 unidades', precio: 115.00, categoria: 'Cajas' },
    { nombre: 'Caja de Bombones de Autor 10 unidades', precio: 100.00, categoria: 'Cajas' },
    { nombre: 'Caja de Chocolates Rellenos 20 unidades', precio: 135.00, categoria: 'Cajas' },
    { nombre: 'Caja de Bombones Gift 25 unidades', precio: 170.00, categoria: 'Cajas' },
    { nombre: 'Caja de Trufas Variadas 18 unidades', precio: 145.00, categoria: 'Cajas' },
    
    // Canastas
    { nombre: 'Canasta Pequeña de Chocolates', precio: 200.00, categoria: 'Canastas' },
    { nombre: 'Canasta Mediana de Chocolates', precio: 350.00, categoria: 'Canastas' },
    { nombre: 'Canasta Grande de Chocolates', precio: 500.00, categoria: 'Canastas' },
    { nombre: 'Canasta Premium de Chocolates', precio: 700.00, categoria: 'Canastas' },
    { nombre: 'Canasta de Lujo con Vino', precio: 850.00, categoria: 'Canastas' },
    { nombre: 'Canasta Romántica', precio: 450.00, categoria: 'Canastas' },
    { nombre: 'Canasta Empresarial', precio: 600.00, categoria: 'Canastas' },
    { nombre: 'Canasta Gourmet Deluxe', precio: 950.00, categoria: 'Canastas' },
    { nombre: 'Canasta de Celebración', precio: 550.00, categoria: 'Canastas' },
    { nombre: 'Canasta Personalizada', precio: 400.00, categoria: 'Canastas' },
    
    // Tabletas
    { nombre: 'Tableta de Chocolate con Leche 100g', precio: 25.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate Amargo 70% 100g', precio: 28.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate Amargo 85% 100g', precio: 30.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate Blanco 100g', precio: 26.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate con Almendras 100g', precio: 32.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate con Nuez 100g', precio: 32.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate con Maní 100g', precio: 28.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate con Pasas 100g', precio: 29.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate con Menta 100g', precio: 27.00, categoria: 'Tabletas' },
    { nombre: 'Tableta de Chocolate Premium 150g', precio: 45.00, categoria: 'Tabletas' }
];

// =====================================================
// FUNCIÓN PRINCIPAL DE CREACIÓN
// =====================================================
async function crearRestauranteLocal() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        logSection('CREANDO RESTAURANTE EN BASE DE DATOS LOCAL');
        log(`Base de datos: ${process.env.DB_NAME || 'sistempos'} (LOCAL)`, 'blue');
        log(`Restaurante: ${datos.restaurante.nombre}`, 'blue');
        log(`============================================================`, 'blue');
        
        // 1. CREAR RESTAURANTE
        log('🏢 Creando restaurante...', 'yellow');
        const restauranteResult = await client.query(`
            INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email, activo)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_restaurante
        `, [
            datos.restaurante.nombre,
            datos.restaurante.direccion,
            datos.restaurante.ciudad,
            datos.restaurante.telefono,
            datos.restaurante.email,
            true
        ]);
        
        const idRestaurante = restauranteResult.rows[0].id_restaurante;
        log(`✅ Restaurante creado (ID: ${idRestaurante})`, 'green');
        
        // 2. CREAR SUCURSAL PRINCIPAL
        log('🏪 Creando sucursal principal...', 'yellow');
        const sucursalResult = await client.query(`
            INSERT INTO sucursales (nombre, direccion, ciudad, id_restaurante, activo)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_sucursal
        `, [
            datos.sucursal.nombre,
            datos.sucursal.direccion,
            datos.sucursal.ciudad,
            idRestaurante,
            true
        ]);
        
        const idSucursal = sucursalResult.rows[0].id_sucursal;
        log(`✅ Sucursal creada (ID: ${idSucursal})`, 'green');
        
        // 3. CREAR USUARIO ADMINISTRADOR
        log('👤 Creando usuario administrador...', 'yellow');
        const hashedPassword = await bcrypt.hash(datos.admin.password, 10);
        const adminResult = await client.query(`
            INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, id_sucursal, id_restaurante, rol_admin_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_vendedor
        `, [
            datos.admin.nombre,
            datos.admin.username,
            datos.admin.email,
            hashedPassword,
            'admin',
            true,
            idSucursal,
            idRestaurante,
            1
        ]);
        
        const idAdmin = adminResult.rows[0].id_vendedor;
        log(`✅ Usuario administrador creado (ID: ${idAdmin})`, 'green');
        log(`   Username: ${datos.admin.username}`, 'white');
        log(`   Email: ${datos.admin.email}`, 'white');
        
        // 4. CREAR CATEGORÍAS
        log('📁 Creando categorías...', 'yellow');
        const categorias = {};
        for (const categoria of categoriasChocolates) {
            const result = await client.query(`
                INSERT INTO categorias (nombre, activo, id_restaurante)
                VALUES ($1, $2, $3)
                RETURNING id_categoria
            `, [categoria.nombre, true, idRestaurante]);
            
            categorias[categoria.nombre] = result.rows[0].id_categoria;
            log(`   ✓ ${categoria.nombre} (ID: ${result.rows[0].id_categoria})`, 'white');
        }
        log(`✅ ${Object.keys(categorias).length} categorías creadas`, 'green');
        
        // 5. CREAR PRODUCTOS
        log('🍫 Creando productos de chocolate...', 'yellow');
        let productosCreados = 0;
        for (const producto of productosChocolates) {
            const categoriaId = categorias[producto.categoria];
            await client.query(`
                INSERT INTO productos (nombre, precio, id_categoria, stock_actual, activo, id_restaurante)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                producto.nombre,
                producto.precio,
                categoriaId,
                100,
                true,
                idRestaurante
            ]);
            productosCreados++;
        }
        log(`✅ ${productosCreados} productos creados`, 'green');
        
        // 6. CREAR MESAS
        log('🪑 Creando mesas...', 'yellow');
        for (let i = 1; i <= 10; i++) {
            await client.query(`
                INSERT INTO mesas (numero, capacidad, estado, id_sucursal, id_restaurante)
                VALUES ($1, $2, $3, $4, $5)
            `, [i, 4, 'libre', idSucursal, idRestaurante]);
        }
        log(`✅ 10 mesas creadas`, 'green');
        
        // 7. CREAR SUSCRIPCIÓN (si existe la tabla planes_pos)
        try {
            log('💳 Creando suscripción...', 'yellow');
            
            // Verificar si existe el plan Enterprise
            const planResult = await client.query(`
                SELECT id FROM planes_pos WHERE nombre = 'Enterprise' LIMIT 1
            `);
            
            if (planResult.rows.length > 0) {
                const idPlan = planResult.rows[0].id;
                const fechaInicio = new Date();
                const fechaFin = new Date();
                fechaFin.setFullYear(fechaFin.getFullYear() + 1);
                
                await client.query(`
                    INSERT INTO suscripciones (id_restaurante, id_plan, estado, fecha_inicio, fecha_fin)
                    VALUES ($1, $2, $3, $4, $5)
                `, [idRestaurante, idPlan, 'activa', fechaInicio, fechaFin]);
                
                log(`✅ Suscripción creada (Plan Enterprise)`, 'green');
            } else {
                log(`⚠️  No se encontró el plan Enterprise en la BD local`, 'yellow');
            }
        } catch (error) {
            log(`⚠️  No se pudo crear suscripción: ${error.message}`, 'yellow');
        }
        
        await client.query('COMMIT');
        
        logSection('RESTAURANTE CREADO EXITOSAMENTE EN LOCAL');
        log('📊 Resumen:', 'green');
        log(`   • Restaurante ID: ${idRestaurante}`, 'white');
        log(`   • Sucursal ID: ${idSucursal}`, 'white');
        log(`   • Admin ID: ${idAdmin}`, 'white');
        log(`   • Categorías: ${Object.keys(categorias).length}`, 'white');
        log(`   • Productos: ${productosCreados}`, 'white');
        log(`   • Mesas: 10`, 'white');
        log('============================================================', 'green');
        log('🎉 ¡Restaurante listo para usar en desarrollo local!', 'green');
        log('============================================================', 'green');
        
    } catch (error) {
        await client.query('ROLLBACK');
        logSection('ERROR EN CREACIÓN DE RESTAURANTE');
        log(`❌ Error: ${error.message}`, 'red');
        console.error('Stack trace:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// =====================================================
// EJECUTAR SCRIPT
// =====================================================
if (require.main === module) {
    crearRestauranteLocal()
        .then(() => {
            log('\n✅ Script finalizado correctamente', 'green');
            process.exit(0);
        })
        .catch((error) => {
            log('\n❌ Script finalizado con errores', 'red');
            process.exit(1);
        });
}

module.exports = { crearRestauranteLocal };
