const { pool } = require('./src/config/database');

async function checkPrefacturasStructure() {
  try {
    console.log('🔍 Verificando estructura de tabla prefacturas...');
    
    // Verificar estructura de la tabla prefacturas
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'prefacturas'
      ORDER BY ordinal_position
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('📋 Columnas de tabla prefacturas:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar prefacturas existentes
    const prefacturasQuery = `
      SELECT * FROM prefacturas WHERE id_mesa = 32
    `;
    
    const prefacturasResult = await pool.query(prefacturasQuery);
    console.log('\n📄 Prefacturas de Mesa 32:');
    if (prefacturasResult.rows.length > 0) {
      prefacturasResult.rows.forEach(prefactura => {
        console.log('  Prefactura:', prefactura);
      });
    } else {
      console.log('  ❌ No hay prefacturas para Mesa 32');
    }
    
    // Verificar todas las prefacturas
    const allPrefacturasQuery = `
      SELECT id_prefactura, id_mesa, estado, total_acumulado, created_at, fecha_apertura
      FROM prefacturas 
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const allPrefacturasResult = await pool.query(allPrefacturasQuery);
    console.log('\n📄 Últimas 5 prefacturas:');
    allPrefacturasResult.rows.forEach(prefactura => {
      console.log(`  - Prefactura ${prefactura.id_prefactura}: Mesa ${prefactura.id_mesa}, Estado: ${prefactura.estado}, Total: $${prefactura.total_acumulado}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkPrefacturasStructure(); 