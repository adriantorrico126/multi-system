const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'password',
    host: 'localhost',
    port: 5432,
    database: 'sistempos'
});

async function verificar() {
    try {
        console.log('=== VERIFICANDO TABLA planes ===');
        const columns = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'planes\' ORDER BY ordinal_position');
        console.log('Columnas:');
        columns.rows.forEach(r => console.log('  -', r.column_name));
        
        console.log('\n=== DATOS EN TABLA planes ===');
        const data = await pool.query('SELECT id_plan, nombre, precio_mensual FROM planes ORDER BY id_plan');
        data.rows.forEach(p => console.log(`  [${p.id_plan}] ${p.nombre} - $${p.precio_mensual}`));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

verificar();
