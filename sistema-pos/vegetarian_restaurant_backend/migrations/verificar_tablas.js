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

async function verificarTablas() {
    try {
        // Buscar tablas relacionadas con contadores y arqueos
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name LIKE '%contador%' 
               OR table_name LIKE '%arqueo%'
               OR table_name LIKE '%usage%'
               OR table_name LIKE '%stats%'
            ORDER BY table_name
        `);
        
        console.log('Tablas relacionadas encontradas:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        if (result.rows.length === 0) {
            console.log('No se encontraron tablas relacionadas con contadores o arqueos');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

verificarTablas();
