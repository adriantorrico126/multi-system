const { Pool } = require('pg');

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

async function arreglarTodasSecuencias() {
    try {
        console.log('🔧 Arreglando todas las secuencias...');
        
        // Arreglar secuencia de categorías
        await pool.query('SELECT setval(\'categorias_id_categoria_seq\', (SELECT MAX(id_categoria) FROM categorias) + 1)');
        console.log('✅ Secuencia de categorías actualizada');
        
        // Arreglar secuencia de productos
        await pool.query('SELECT setval(\'productos_id_producto_seq\', (SELECT MAX(id_producto) FROM productos) + 1)');
        console.log('✅ Secuencia de productos actualizada');
        
        // Arreglar secuencia de mesas
        await pool.query('SELECT setval(\'mesas_id_mesa_seq\', (SELECT MAX(id_mesa) FROM mesas) + 1)');
        console.log('✅ Secuencia de mesas actualizada');
        
        console.log('🎉 Todas las secuencias han sido actualizadas');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

arreglarTodasSecuencias();
