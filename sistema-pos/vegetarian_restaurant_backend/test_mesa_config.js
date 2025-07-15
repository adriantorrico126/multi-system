const db = require('./src/config/database');

async function testMesaConfig() {
  try {
    console.log('🔍 Probando configuración de mesas...');
    
    // 1. Verificar estructura de la tabla
    console.log('\n1. Verificando estructura de la tabla mesas...');
    const structure = await db.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'mesas' 
      ORDER BY ordinal_position
    `);
    console.log('Columnas de la tabla mesas:', structure.rows);
    
    // 2. Verificar si hay mesas
    console.log('\n2. Verificando mesas existentes...');
    const mesas = await db.query('SELECT * FROM mesas LIMIT 5');
    console.log('Mesas encontradas:', mesas.rows.length);
    if (mesas.rows.length > 0) {
      console.log('Primera mesa:', mesas.rows[0]);
    }
    
    // 3. Verificar sucursales
    console.log('\n3. Verificando sucursales...');
    const sucursales = await db.query('SELECT * FROM sucursales');
    console.log('Sucursales encontradas:', sucursales.rows.length);
    if (sucursales.rows.length > 0) {
      console.log('Primera sucursal:', sucursales.rows[0]);
    }
    
    // 4. Probar query de configuración
    console.log('\n4. Probando query de configuración...');
    const configQuery = `
      SELECT 
        id_mesa,
        numero,
        capacidad,
        estado,
        created_at,
        updated_at
      FROM mesas 
      WHERE id_sucursal = $1
      ORDER BY numero
    `;
    
    const sucursalId = sucursales.rows[0]?.id_sucursal || 1;
    console.log('Usando sucursal ID:', sucursalId);
    
    const configResult = await db.query(configQuery, [sucursalId]);
    console.log('Resultado de configuración:', configResult.rows);
    
    console.log('\n✅ Test completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await db.end();
  }
}

testMesaConfig(); 