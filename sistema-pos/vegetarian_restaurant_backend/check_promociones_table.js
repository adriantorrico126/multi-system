const { pool } = require('./src/config/database');

async function checkPromocionesTable() {
  try {
    console.log('🔍 Verificando tabla promociones...');
    
    // Verificar si la tabla existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'promociones'
      );
    `;
    
    const { rows: tableExists } = await pool.query(tableExistsQuery);
    console.log('✅ Tabla promociones existe:', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      // Obtener estructura de la tabla
      const structureQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'promociones'
        ORDER BY ordinal_position;
      `;
      
      const { rows: structure } = await pool.query(structureQuery);
      console.log('📋 Estructura de la tabla promociones:');
      structure.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Verificar si hay datos
      const countQuery = 'SELECT COUNT(*) as total FROM promociones;';
      const { rows: count } = await pool.query(countQuery);
      console.log(`📊 Total de promociones: ${count[0].total}`);
      
      // Mostrar algunos datos de ejemplo
      const sampleQuery = 'SELECT * FROM promociones LIMIT 3;';
      const { rows: sample } = await pool.query(sampleQuery);
      console.log('📝 Datos de ejemplo:');
      sample.forEach(row => {
        console.log(`  - ID: ${row.id_promocion}, Nombre: ${row.nombre}, Tipo: ${row.tipo}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando tabla promociones:', error);
  } finally {
    await pool.end();
  }
}

checkPromocionesTable(); 