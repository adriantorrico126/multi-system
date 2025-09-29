const { Client } = require('pg');

// Configuración de la base de datos de producción
const PRODUCTION_CONFIG = {
    host: process.env.PROD_DB_HOST || 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
    port: process.env.PROD_DB_PORT || 25060,
    user: process.env.PROD_DB_USER || 'doadmin',
    password: process.env.PROD_DB_PASSWORD || 'placeholder_password',
    database: process.env.PROD_DB_NAME || 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    }
};

async function verificarRestaurantes() {
    const client = new Client(PRODUCTION_CONFIG);
    
    try {
        await client.connect();
        console.log('✅ Conectado a base de datos de producción');

        // Consultar estructura de tabla restaurantes
        console.log('\n🔍 Verificando estructura de tabla restaurantes...');
        const estructura = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'restaurantes'
            ORDER BY ordinal_position
        `);
        
        console.log('📊 Estructura de tabla restaurantes:');
        estructura.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Consultar todos los restaurantes
        console.log('\n🔍 Listando todos los restaurantes...');
        const restaurantes = await client.query(`
            SELECT id_restaurante, nombre, ciudad, activo
            FROM restaurantes 
            ORDER BY id_restaurante
        `);
        
        console.log(`📋 Total restaurantes: ${restaurantes.rows.length}`);
        restaurantes.rows.forEach(r => {
            console.log(`  ID ${r.id_restaurante}: ${r.nombre} (${r.ciudad}) - Activo: ${r.activo}`);
        });

        // Buscar restaurantes cerca del ID 10
        console.log('\n🔍 Buscando restaurantes cerca del ID 10...');
        const restaurantCerca = await client.query(`
            SELECT id_restaurante, nombre, ciudad, activo
            FROM restaurantes 
            WHERE id_restaurante BETWEEN 1 AND 20
            ORDER BY ABS(id_restaurante - 10)
        `);
        
        restaurantCerca.rows.forEach(r => {
            const diferencia = Math.abs(r.id_restaurante - 10);
            console.log(`  ID ${r.id_restaurante} (diferencia: ${diferencia}): ${r.nombre}`);
        });

        // Verificar tabla planes
        console.log('\n🔍 Verificando tabla planes...');
        const planes = await client.query(`
            SELECT id_plan, nombre, descripcion, precio
            FROM planes 
            ORDER BY precio ASC
        `);
        
        console.log('📊 Planes disponibles:');
        planes.rows.forEach(p => {
            console.log(`  ID ${p.id_plan}: ${p.nombre} - $${p.precio}`);
        });

        // Verificar tabla vendedores
        console.log('\n🔍 Verificando usuarios/vendedores...');
        const vendedores = await client.query(`
            SELECT id_vendedor, nombre, username, rol, id_restaurante
            FROM vendedores 
            WHERE id_restaurante BETWEEN 1 AND 20
            ORDER BY id_restaurante, id_vendedor
        `);
        
        console.log('👥 Usuarios encontrados (restaurantes 1-20):');
        vendedores.rows.forEach(v => {
            console.log(`  ID ${v.id_vendedor}: ${v.nombre} (@${v.username}) - Rol: ${v.rol} - Restaurante: ${v.id_restaurante}`);
        });

        // Buscar información específica del usuario actual
        console.log('\n🔍 Buscando usuarios en restaurante con ID cercano a 10...');
        const usuariosCerca10 = await client.query(`
            SELECT v.id_vendedor, v.nombre, v.username, v.rol, 
                   v.id_restaurante, r.nombre as restaurante_nombre
            FROM vendedores v
            LEFT JOIN restaurantes r ON v.id_restaurante = r.id_restaurante
            WHERE v.id_restaurante BETWEEN 1 AND 20
            ORDER BY ABS(v.id_restaurante - 10), v.id_vendedor
        `);
        
        usuariosCerca10.rows.forEach(v => {
            console.log(`  Usuario: ${v.nombre} (@${v.username})`);
            console.log(`    Restaurante ID ${v.id_restaurante}: ${v.restaurante_nombre}`);
            console.log(`    Rol: ${v.rol}`);
            console.log('  ---');
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

verificarRestaurantes();
