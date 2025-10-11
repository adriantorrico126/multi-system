/**
 * =====================================================
 * CREAR CHOCOLATERÍA COLCAPIRHUA - SCRIPT SIMPLE
 * =====================================================
 * Sistema: SITEMM POS
 * Fecha: 2025-10-10
 * Descripción: Script directo para crear Chocolatería Colcapirhua
 * =====================================================
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

// Datos de la Chocolatería Colcapirhua
const datos = {
    restaurante: {
        nombre: 'Chocolatería Colcapirhua',
        direccion: 'Calle Principal #123',
        ciudad: 'Cochabamba',
        telefono: '+591 69453151',
        email: 'namenombret@gmail.com'
    },
    sucursal: {
        nombre: 'Sucursal Principal',
        direccion: 'Calle Principal #123',
        ciudad: 'Cochabamba'
    },
    admin: {
        nombre: 'Administrador',
        username: 'parati',
        email: 'colcapirhua.namenombret@gmail.com',
        password: 'C0lca2025#',
        telefono: '+591 69453151'
    }
};

// Productos de chocolate
const productosChocolate = [
    // BOLSAS
    { nombre: 'BOLSA ALFAJOR CON CHOCOLATE 1 UDD', precio: 13, categoria: 'Bolsas' },
    { nombre: 'BOLSA BOMBON CON CREMA 100 G', precio: 23, categoria: 'Bolsas' },
    { nombre: 'BOLSA BOMBON CON CREMA 200 G', precio: 42, categoria: 'Bolsas' },
    { nombre: 'BOLSA CHOCOLATE CON FRUTA 100 G', precio: 34, categoria: 'Bolsas' },
    { nombre: 'BOLSA CHOCOLATES RELLENOS 100 G', precio: 36, categoria: 'Bolsas' },
    { nombre: 'BOLSA CHOCOLATES CON SABORES 100 G', precio: 34, categoria: 'Bolsas' },
    { nombre: 'BOLSA GRAGEAS DE ARROZ 50 G', precio: 11, categoria: 'Bolsas' },
    { nombre: 'BOLSA GRAGEAS DE ARROZ 100 G', precio: 22, categoria: 'Bolsas' },
    { nombre: 'BOLSA GRAGEAS DE MANI 50 G', precio: 11, categoria: 'Bolsas' },
    { nombre: 'BOLSA GRAGEAS DE MANI 100 G', precio: 22, categoria: 'Bolsas' },
    { nombre: 'BOLSA GRAGEAS DE MACARRON 50 G', precio: 11, categoria: 'Bolsas' },
    { nombre: 'BOLSA GRAGEAS DE MACARRON 100 G', precio: 22, categoria: 'Bolsas' },
    { nombre: 'BOLSA GRAGEAS DE UVAS PASAS 50 G', precio: 11, categoria: 'Bolsas' },
    { nombre: 'BOLSA GRAGEAS DE UVAS PASAS 100 G', precio: 22, categoria: 'Bolsas' },
    { nombre: 'BOLSA MARSHMALLOWS 60 G', precio: 20, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Grageas uvas pasas y chocolates 100 gramos', precio: 20, categoria: 'Bolsas' },
    { nombre: 'Bolsa de Grageas de maní con chocolate de 100 gramos', precio: 20, categoria: 'Bolsas' },
    
    // CAJAS
    { nombre: 'CAJA BOMBON CON CREMA 150 G', precio: 38, categoria: 'Cajas' },
    { nombre: 'CAJA DORADA CON TRUFFAS DE LICOR 220 G', precio: 100, categoria: 'Cajas' },
    { nombre: 'CAJA RECTANGULAR CON SAMBITOS 220 G', precio: 70, categoria: 'Cajas' },
    { nombre: 'Grageas de Cherry con chocolate con leche en caja de 100 gramos', precio: 42, categoria: 'Cajas' },
    { nombre: 'Grageas de almendras con chocolate con leche en caja de 100 gramos', precio: 42, categoria: 'Cajas' },
    { nombre: 'Grageas de arándanos con chocolate semi amargo en caja de 100 gramos', precio: 42, categoria: 'Cajas' },
    
    // CANASTAS
    { nombre: 'CANASTA SURTIDA (CHOCOLATES Y BOMBONES) 280 G', precio: 77, categoria: 'Canastas' },
    
    // TABLETAS
    { nombre: 'TABLETA DE CHOCOLATE AMARGO INTENSO 50 G', precio: 22, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE AMARGO INTENSO 100 G', precio: 38, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE AMARGO 50 G', precio: 22, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE AMARGO 100 G', precio: 38, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE AMARGO TABU CON RELLENO', precio: 25, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE SEMIAMARGO 50 G', precio: 20, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE SEMIAMARGO 100 G', precio: 34, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON AMARANTO 50 G', precio: 17, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON AMARANTO 100 G', precio: 31, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON COCO RALLADO 50 G', precio: 17, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON COCO RALLADO 100 G', precio: 31, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON LECHE 50 G', precio: 17, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON MANI 50 G', precio: 17, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON MANI 100 G', precio: 31, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON QUINUA 50 G', precio: 17, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON QUINUA 100 G', precio: 31, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON SABOR NARANJA 50 G', precio: 17, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON SABOR NARANJA 100 G', precio: 31, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON UVA PASA DE 100G', precio: 31, categoria: 'Tabletas' },
    { nombre: 'TABLETA DE CHOCOLATE CON UVA PASA DE 50G', precio: 17, categoria: 'Tabletas' },
    { nombre: 'Tableta Semi Amargo y menta 100 gramos', precio: 28, categoria: 'Tabletas' }
];

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

async function crearChocolateria() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        log('============================================================', 'blue');
        log('CREANDO CHOCOLATERÍA COLCAPIRHUA', 'blue');
        log('============================================================', 'blue');
        
        // 1. Crear restaurante
        log('🍫 Creando restaurante...', 'yellow');
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
        log(`✅ Restaurante creado con ID: ${idRestaurante}`, 'green');
        
        // 2. Crear sucursal
        log('🏪 Creando sucursal...', 'yellow');
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
        log(`✅ Sucursal creada con ID: ${idSucursal}`, 'green');
        
        // 3. Crear usuario admin
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
            1 // rol_admin_id 1 = admin
        ]);
        
        const idAdmin = adminResult.rows[0].id_vendedor;
        log(`✅ Usuario admin creado con ID: ${idAdmin}`, 'green');
        
        // 4. Crear categorías de chocolate
        log('📂 Creando categorías...', 'yellow');
        const categorias = [
            { nombre: 'Bolsas' },
            { nombre: 'Cajas' },
            { nombre: 'Canastas' },
            { nombre: 'Tabletas' }
        ];
        
        const categoriasIds = {};
        for (const categoria of categorias) {
            const categoriaResult = await client.query(`
                INSERT INTO categorias (nombre, activo, id_restaurante)
                VALUES ($1, $2, $3)
                RETURNING id_categoria
            `, [categoria.nombre, true, idRestaurante]);
            
            categoriasIds[categoria.nombre] = categoriaResult.rows[0].id_categoria;
        }
        log(`✅ ${categorias.length} categorías creadas`, 'green');
        
        // 5. Crear productos de chocolate
        log('🍫 Creando productos de chocolate...', 'yellow');
        for (const producto of productosChocolate) {
            const categoriaId = categoriasIds[producto.categoria];
            
            await client.query(`
                INSERT INTO productos (nombre, precio, id_categoria, stock_actual, activo, id_restaurante)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                producto.nombre,
                producto.precio,
                categoriaId,
                100, // stock inicial de 100 unidades
                true,
                idRestaurante
            ]);
        }
        log(`✅ ${productosChocolate.length} productos creados`, 'green');
        
        // 6. Crear mesas básicas
        log('🪑 Creando mesas...', 'yellow');
        for (let i = 1; i <= 10; i++) {
            await client.query(`
                INSERT INTO mesas (numero, capacidad, estado, id_sucursal, id_restaurante)
                VALUES ($1, $2, $3, $4, $5)
            `, [i, 4, 'libre', idSucursal, idRestaurante]);
        }
        log(`✅ 10 mesas creadas`, 'green');
        
        await client.query('COMMIT');
        
        log('============================================================', 'green');
        log('🎉 CHOCOLATERÍA COLCAPIRHUA CREADA EXITOSAMENTE', 'green');
        log('============================================================', 'green');
        log(`📊 Resumen:`, 'blue');
        log(`   • Restaurante ID: ${idRestaurante}`, 'white');
        log(`   • Sucursal ID: ${idSucursal}`, 'white');
        log(`   • Usuario Admin ID: ${idAdmin}`, 'white');
        log(`   • Categorías: ${categorias.length}`, 'white');
        log(`   • Productos: ${productosChocolate.length}`, 'white');
        log(`   • Mesas: 10`, 'white');
        log('============================================================', 'green');
        
        return {
            id_restaurante: idRestaurante,
            id_sucursal: idSucursal,
            id_admin: idAdmin
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
        log('CREADOR DE CHOCOLATERÍA COLCAPIRHUA - PRODUCCIÓN', 'blue');
        log('============================================================', 'blue');
        log('Base de datos: defaultdb (PRODUCCIÓN)', 'yellow');
        log('Host: db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com:25060', 'yellow');
        log('Usuario: doadmin', 'yellow');
        log('============================================================', 'blue');
        
        const resultado = await crearChocolateria();
        
        log('✅ Proceso completado exitosamente', 'green');
        
    } catch (error) {
        log(`❌ Error fatal: ${error.message}`, 'red');
        log('La creación de la Chocolatería ha fallado.', 'red');
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

module.exports = { crearChocolateria };
