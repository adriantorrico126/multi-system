const { Pool } = require('pg');
const fs = require('fs');

// Configuración de base de datos de producción
const pool = new Pool({
    host: process.env.PROD_DB_HOST || 'db-postgresql-nyc3-64232-do-user-24932517-0.j.db.ondigitalocean.com',
    port: process.env.PROD_DB_PORT || 25060,
    user: process.env.PROD_DB_USER || 'doadmin',
    password: process.env.PROD_DB_PASSWORD || 'placeholder_password',
    database: process.env.PROD_DB_NAME || 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

async function createAlertaLimiteTable() {
    console.log('🚀 CREANDO TABLA alertas_limite EN PRODUCCIÓN');
    console.log('=' .repeat(60));
    
    try {
        // Leer el script SQL
        const sqlScript = fs.readFileSync('create_alertas_limite_table.sql', 'utf8');
        
        console.log('📋 Ejecutando script SQL...');
        console.log('🔍 Script:', sqlScript.substring(0, 200) + '...');
        
        // Ejecutar el script
        const result = await pool.query(sqlScript);
        
        console.log('✅ Tabla alertas_limite creada exitosamente');
        
        // Verificar que la tabla fue creada
        const verifyQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'alertas_limite'
            );
        `;
        
        const verifyResult = await pool.query(verifyQuery);
        
        if (verifyResult.rows[0].exists) {
            console.log('✅ Verificación: La tabla alertas_limite existe');
            
            // Mostrar estructura de la tabla
            const structureQuery = `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'alertas_limite'
                ORDER BY ordinal_position;
            `;
            
            const structure = await pool.query(structureQuery);
            console.log('\n📊 Estructura de la tabla alertas_limite:');
            console.table(structure.rows);
            
        } else {
            console.log('❌ Error: La tabla no fue creada correctamente');
        }
        
    } catch (error) {
        console.error('❌ Error creando tabla:', error.message);
        console.error('🔍 Detalles del error:', error);
    } finally {
        await pool.end();
    }
    
    console.log('\n🏁 PROCESO COMPLETADO');
    console.log('=' .repeat(60));
}

createAlertaLimiteTable().catch(console.error);
