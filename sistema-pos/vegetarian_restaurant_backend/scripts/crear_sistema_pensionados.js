require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.POS_DB_USER || 'postgres',
  host: process.env.POS_DB_HOST || 'localhost',
  database: process.env.POS_DB_NAME || 'sistempos',
  password: process.env.POS_DB_PASSWORD || '6951230Anacleta',
  port: process.env.POS_DB_PORT || 5432,
});

async function crearSistemaPensionados() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando creación del sistema de pensionados...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../../../estructuradb/sistema_pensionados_sin_fk.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Archivo SQL leído correctamente');
    
    // Ejecutar el script SQL
    await client.query(sqlContent);
    console.log('✅ Tablas del sistema de pensionados creadas exitosamente');
    
    // Verificar que las tablas se crearon
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados')
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('📋 Tablas creadas:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Verificar índices
    const indexesQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE tablename IN ('pensionados', 'consumo_pensionados', 'prefacturas_pensionados')
      ORDER BY tablename, indexname;
    `;
    
    const indexesResult = await client.query(indexesQuery);
    console.log('🔍 Índices creados:');
    indexesResult.rows.forEach(row => {
      console.log(`  ✅ ${row.indexname} (${row.tablename})`);
    });
    
    // Verificar funciones
    const functionsQuery = `
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name LIKE '%pensionado%'
      ORDER BY routine_name;
    `;
    
    const functionsResult = await client.query(functionsQuery);
    console.log('⚙️ Funciones creadas:');
    functionsResult.rows.forEach(row => {
      console.log(`  ✅ ${row.routine_name} (${row.routine_type})`);
    });
    
    console.log('🎉 Sistema de pensionados instalado correctamente!');
    
  } catch (error) {
    console.error('❌ Error al crear el sistema de pensionados:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearSistemaPensionados()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { crearSistemaPensionados };
