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

async function arreglarSecuenciaProductos() {
    try {
        await pool.query('SELECT setval(\'productos_id_producto_seq\', (SELECT MAX(id_producto) FROM productos) + 1)');
        console.log('✅ Secuencia de productos actualizada');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

arreglarSecuenciaProductos();
