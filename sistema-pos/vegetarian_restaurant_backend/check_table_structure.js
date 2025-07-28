const { pool } = require('./src/config/database');

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estructura de tablas...');
    
    // Verificar estructura de detalle_ventas
    const detalleVentasQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'detalle_ventas'
      ORDER BY ordinal_position
    `;
    const detalleVentasResult = await pool.query(detalleVentasQuery);
    console.log('📋 Estructura de detalle_ventas:');
    detalleVentasResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar estructura de ventas
    const ventasQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'ventas'
      ORDER BY ordinal_position
    `;
    const ventasResult = await pool.query(ventasQuery);
    console.log('\n📋 Estructura de ventas:');
    ventasResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar algunos registros de detalle_ventas
    const sampleQuery = `
      SELECT * FROM detalle_ventas LIMIT 3
    `;
    const sampleResult = await pool.query(sampleQuery);
    console.log('\n📋 Muestra de detalle_ventas:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  Registro ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure(); 