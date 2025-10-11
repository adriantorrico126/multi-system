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

async function verificarEstructuraTablas() {
    try {
        console.log('=== ESTRUCTURA DE TABLA contadores_uso ===');
        const contadoresResult = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'contadores_uso'
            ORDER BY ordinal_position
        `);
        
        contadoresResult.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        console.log('\n=== ESTRUCTURA DE TABLA arqueos_caja ===');
        const arqueosResult = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'arqueos_caja'
            ORDER BY ordinal_position
        `);
        
        arqueosResult.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

verificarEstructuraTablas();
