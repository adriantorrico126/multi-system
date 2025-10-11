/**
 * =====================================================
 * CREADOR DE NUEVO RESTAURANTE - PRODUCCIÓN
 * =====================================================
 * Sistema: SITEMM POS
 * Fecha: 2025-10-10
 * Descripción: Crea un nuevo restaurante completo con datos básicos
 * =====================================================
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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

/**
 * Cargar datos del restaurante desde archivo de configuración
 */
let nuevoRestaurante;

try {
    // Intentar cargar datos personalizados
    nuevoRestaurante = require('./datos_restaurante.js');
} catch (error) {
    // Si no existe, usar datos de ejemplo
    console.log('⚠️  No se encontró archivo datos_restaurante.js');
    console.log('📝 Usando datos de ejemplo. Para personalizar:');
    console.log('   1. Copia datos_restaurante_template.js a datos_restaurante.js');
    console.log('   2. Modifica los datos en datos_restaurante.js');
    console.log('   3. Ejecuta nuevamente este script\n');
    
    nuevoRestaurante = {
        // Información básica del restaurante
        nombre: 'Restaurante de Ejemplo',
        direccion: 'Calle Principal #123',
        ciudad: 'La Paz',
        telefono: '+591 123456789',
        email: 'contacto@ejemplo.com',
        
        // Información de la sucursal principal
        sucursal: {
            nombre: 'Sucursal Principal',
            direccion: 'Calle Principal #123',
            ciudad: 'La Paz',
            telefono: '+591 123456789'
        },
        
        // Usuario administrador
        admin: {
            nombre: 'Administrador',
            username: 'admin',
            email: 'admin@ejemplo.com',
            password: 'admin123', // Se encriptará automáticamente
            telefono: '+591 123456789'
        }
    };
}

/**
 * Crear productos de chocolate para Chocolatería Colcapirhua
 */
async function crearProductosChocolate(client, idRestaurante) {
    log(`🍫 Creando productos de chocolate...`, 'blue');
    
    // Primero crear las categorías específicas de chocolate
    const categoriasChocolate = [
        { nombre: 'Bolsas', descripcion: 'Bolsas de chocolates y grageas' },
        { nombre: 'Cajas', descripcion: 'Cajas de chocolates premium' },
        { nombre: 'Canastas', descripcion: 'Canastas surtidas' },
        { nombre: 'Tabletas', descripcion: 'Tabletas de chocolate' }
    ];
    
    const categoriasIds = {};
    
    for (const categoria of categoriasChocolate) {
        const categoriaResult = await client.query(`
            INSERT INTO categorias (nombre, descripcion, activo, id_restaurante)
            VALUES ($1, $2, $3, $4)
            RETURNING id_categoria
        `, [categoria.nombre, categoria.descripcion, true, idRestaurante]);
        
        categoriasIds[categoria.nombre] = categoriaResult.rows[0].id_categoria;
    }
    
    // Productos de chocolate
    const productos = [
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
    
    // Insertar productos
    for (const producto of productos) {
        const categoriaId = categoriasIds[producto.categoria];
        
        await client.query(`
            INSERT INTO productos (nombre, precio, descripcion, activo, id_categoria, id_restaurante)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            producto.nombre,
            producto.precio,
            `Delicioso producto de chocolate de Chocolatería Colcapirhua`,
            true,
            categoriaId,
            idRestaurante
        ]);
    }
    
    log(`✅ ${productos.length} productos de chocolate creados`, 'green');
    log(`✅ ${categoriasChocolate.length} categorías específicas creadas`, 'green');
}

/**
 * Crear el nuevo restaurante
 */
async function crearRestaurante(datos) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        logSection('CREANDO NUEVO RESTAURANTE');
        log(`Nombre: ${datos.restaurante.nombre}`, 'blue');
        log(`Ciudad: ${datos.restaurante.ciudad}`, 'blue');
        log(`Email: ${datos.restaurante.email}`, 'blue');
        
        // 1. Insertar restaurante
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
        
        // 2. Insertar sucursal principal
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
        
        // 3. Crear usuario administrador
        const passwordHash = await bcrypt.hash(datos.admin.password, 10);
        
        const adminResult = await client.query(`
            INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, id_sucursal, id_restaurante)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id_vendedor
        `, [
            datos.admin.nombre,
            datos.admin.username,
            datos.admin.email,
            passwordHash,
            'admin',
            true,
            idSucursal,
            idRestaurante
        ]);
        
        const idAdmin = adminResult.rows[0].id_vendedor;
        log(`✅ Usuario administrador creado con ID: ${idAdmin}`, 'green');
        log(`   Username: ${datos.admin.username}`, 'gray');
        log(`   Password: ${datos.admin.password}`, 'yellow');
        
        // 4. Crear métodos de pago básicos
        const metodosPago = [
            { nombre: 'Efectivo', descripcion: 'Efectivo', activo: true },
            { nombre: 'Pago Móvil', descripcion: 'Pago Móvil', activo: true },
            { nombre: 'Tarjeta de Débito', descripcion: 'Tarjeta de Débito', activo: true },
            { nombre: 'Tarjeta de Crédito', descripcion: 'Tarjeta de Crédito', activo: true }
        ];
        
        for (const metodo of metodosPago) {
            await client.query(`
                INSERT INTO metodos_pago (nombre, descripcion, activo, id_restaurante)
                VALUES ($1, $2, $3, $4)
            `, [metodo.nombre, metodo.descripcion, metodo.activo, idRestaurante]);
        }
        
        log(`✅ ${metodosPago.length} métodos de pago creados`, 'green');
        
        // 5. Crear categorías básicas
        const categorias = [
            { nombre: 'Bebidas', descripcion: 'Bebidas y refrescos' },
            { nombre: 'Platos Principales', descripcion: 'Platos principales del menú' },
            { nombre: 'Postres', descripcion: 'Postres y dulces' },
            { nombre: 'Entradas', descripcion: 'Entradas y aperitivos' }
        ];
        
        for (const categoria of categorias) {
            await client.query(`
                INSERT INTO categorias (nombre, descripcion, activo, id_restaurante)
                VALUES ($1, $2, $3, $4)
            `, [categoria.nombre, categoria.descripcion, true, idRestaurante]);
        }
        
        log(`✅ ${categorias.length} categorías básicas creadas`, 'green');
        
        // 6. Crear mesas básicas (10 mesas)
        for (let i = 1; i <= 10; i++) {
            await client.query(`
                INSERT INTO mesas (numero, capacidad, activa, id_sucursal, id_restaurante)
                VALUES ($1, $2, $3, $4, $5)
            `, [i, 4, true, idSucursal, idRestaurante]);
        }
        
        log(`✅ 10 mesas básicas creadas`, 'green');
        
        // 7. Crear productos de chocolate (si es Chocolatería Colcapirhua)
        if (datos.restaurante.nombre && datos.restaurante.nombre.toLowerCase().includes('chocolatería colcapirhua')) {
            await crearProductosChocolate(client, idRestaurante);
        }
        
        await client.query('COMMIT');
        
        return {
            id_restaurante: idRestaurante,
            id_sucursal: idSucursal,
            id_admin: idAdmin
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Verificar que el restaurante se creó correctamente
 */
async function verificarRestaurante(idRestaurante) {
    logSection('VERIFICACIÓN POST-CREACIÓN');
    
    try {
        // Verificar restaurante
        const restaurante = await pool.query(
            'SELECT * FROM restaurantes WHERE id_restaurante = $1',
            [idRestaurante]
        );
        
        if (restaurante.rows.length > 0) {
            log(`✅ Restaurante: ${restaurante.rows[0].nombre}`, 'green');
        }
        
        // Verificar sucursales
        const sucursales = await pool.query(
            'SELECT COUNT(*) as count FROM sucursales WHERE id_restaurante = $1',
            [idRestaurante]
        );
        log(`✅ Sucursales: ${sucursales.rows[0].count}`, 'green');
        
        // Verificar usuarios
        const usuarios = await pool.query(
            'SELECT COUNT(*) as count FROM vendedores WHERE id_restaurante = $1',
            [idRestaurante]
        );
        log(`✅ Usuarios: ${usuarios.rows[0].count}`, 'green');
        
        // Verificar métodos de pago
        const metodosPago = await pool.query(
            'SELECT COUNT(*) as count FROM metodos_pago WHERE id_restaurante = $1',
            [idRestaurante]
        );
        log(`✅ Métodos de pago: ${metodosPago.rows[0].count}`, 'green');
        
        // Verificar categorías
        const categorias = await pool.query(
            'SELECT COUNT(*) as count FROM categorias WHERE id_restaurante = $1',
            [idRestaurante]
        );
        log(`✅ Categorías: ${categorias.rows[0].count}`, 'green');
        
        // Verificar mesas
        const mesas = await pool.query(
            'SELECT COUNT(*) as count FROM mesas WHERE id_restaurante = $1',
            [idRestaurante]
        );
        log(`✅ Mesas: ${mesas.rows[0].count}`, 'green');
        
        // Verificar productos
        const productos = await pool.query(
            'SELECT COUNT(*) as count FROM productos WHERE id_restaurante = $1',
            [idRestaurante]
        );
        log(`✅ Productos: ${productos.rows[0].count}`, 'green');
        
    } catch (error) {
        log(`⚠ Error en verificación: ${error.message}`, 'yellow');
    }
}

/**
 * Función principal
 */
async function main() {
    logSection('CREADOR DE NUEVO RESTAURANTE - PRODUCCIÓN');
    
    console.log('Base de datos: defaultdb (PRODUCCIÓN)');
    console.log('Host: db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com:25060');
    console.log('');
    
    try {
        // Verificar conexión
        await pool.query('SELECT NOW()');
        log('✅ Conexión a base de datos establecida', 'green');
        
        // Crear restaurante
        const resultado = await crearRestaurante(nuevoRestaurante);
        
        // Verificar creación
        await verificarRestaurante(resultado.id_restaurante);
        
        // Resumen final
        logSection('RESUMEN DE CREACIÓN');
        log(`✅ Restaurante creado exitosamente:`, 'green');
        log(`   ID Restaurante: ${resultado.id_restaurante}`, 'blue');
        log(`   ID Sucursal: ${resultado.id_sucursal}`, 'blue');
        log(`   ID Admin: ${resultado.id_admin}`, 'blue');
        console.log('');
        log('Datos de acceso:', 'cyan');
        log(`   Username: ${nuevoRestaurante.admin.username}`, 'yellow');
        log(`   Password: ${nuevoRestaurante.admin.password}`, 'yellow');
        console.log('');
        log('========================================', 'green');
        log('RESTAURANTE CREADO EXITOSAMENTE', 'green');
        log('========================================', 'green');
        console.log('');
        log('Siguiente paso:', 'cyan');
        console.log('1. El restaurante ya está listo para usar');
        console.log('2. Puede acceder con las credenciales mostradas');
        console.log('3. Agregar productos desde el panel de administración');
        
    } catch (error) {
        logSection('ERROR EN CREACIÓN');
        log(`Error fatal: ${error.message}`, 'red');
        log(`Stack trace: ${error.stack}`, 'gray');
        console.log('');
        log('La creación del restaurante ha fallado.', 'yellow');
        log('Verifique los datos y vuelva a intentar.', 'yellow');
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
