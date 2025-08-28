const { Pool } = require('pg');
const dbConfig = require('./config_db_local');

const pool = new Pool(dbConfig);

async function fixMesas() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 CORRIGIENDO MESAS DEL SISTEMA POS\n');
    console.log('=' .repeat(60));
    
    // 1. VERIFICAR ESTRUCTURA EXACTA DE MESAS
    console.log('\n🔍 1. VERIFICANDO ESTRUCTURA EXACTA DE MESAS...');
    
    const mesaStructure = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'mesas' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estructura de mesas:');
    mesaStructure.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   - ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultValue}`);
    });
    
    // 2. VERIFICAR DATOS EXISTENTES
    console.log('\n📊 2. VERIFICANDO DATOS EXISTENTES...');
    
    const mesasCount = await client.query('SELECT COUNT(*) FROM mesas');
    console.log(`   📊 Mesas existentes: ${mesasCount.rows[0].count}`);
    
    if (parseInt(mesasCount.rows[0].count) > 0) {
      const mesasSample = await client.query('SELECT * FROM mesas LIMIT 3');
      console.log('   📝 Ejemplos de mesas:');
      mesasSample.rows.forEach((mesa, index) => {
        const sample = Object.entries(mesa).slice(0, 4).map(([key, value]) => `${key}: ${value}`).join(', ');
        console.log(`      Mesa ${index + 1}: ${sample}...`);
      });
    }
    
    // 3. INSERTAR MESAS CORRECTAMENTE
    console.log('\n📝 3. INSERTANDO MESAS CORRECTAMENTE...');
    
    try {
      // Obtener IDs de sucursal y restaurante
      const sucursalResult = await client.query('SELECT id_sucursal, id_restaurante FROM sucursales LIMIT 1');
      if (sucursalResult.rows.length === 0) {
        throw new Error('No hay sucursales en el sistema');
      }
      
      const { id_sucursal, id_restaurante } = sucursalResult.rows[0];
      console.log(`   🏪 Usando sucursal ID: ${id_sucursal}, restaurante ID: ${id_restaurante}`);
      
      // Limpiar mesas existentes (opcional)
      const deleteResult = await client.query('DELETE FROM mesas');
      console.log(`   🗑️  Mesas existentes eliminadas: ${deleteResult.rowCount}`);
      
      // Insertar 10 mesas por defecto
      for (let i = 1; i <= 10; i++) {
        const mesaSQL = `
          INSERT INTO mesas (numero_mesa, capacidad, estado, id_sucursal, id_restaurante, activa)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await client.query(mesaSQL, [i, 4, 'libre', id_sucursal, id_restaurante, true]);
        console.log(`   ✅ Mesa ${i} creada`);
      }
      
      console.log(`   🎉 ${10} mesas creadas exitosamente`);
      
    } catch (error) {
      console.log(`   ⚠️  Error insertando mesas: ${error.message}`);
    }
    
    // 4. VERIFICAR RESULTADO FINAL
    console.log('\n🔍 4. VERIFICANDO RESULTADO FINAL...');
    
    const finalCount = await client.query('SELECT COUNT(*) FROM mesas');
    console.log(`   📊 Total de mesas: ${finalCount.rows[0].count}`);
    
    if (parseInt(finalCount.rows[0].count) > 0) {
      const finalSample = await client.query('SELECT * FROM mesas ORDER BY numero_mesa LIMIT 3');
      console.log('   📝 Muestra final de mesas:');
      finalSample.rows.forEach(mesa => {
        console.log(`      Mesa ${mesa.numero_mesa}: ${mesa.estado}, Capacidad: ${mesa.capacidad}, Activa: ${mesa.activa}`);
      });
    }
    
    console.log('\n🎉 ¡MESAS CORREGIDAS EXITOSAMENTE!');
    
  } catch (error) {
    console.error('❌ Error durante la corrección de mesas:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección
if (require.main === module) {
  fixMesas()
    .then(() => {
      console.log('\n✅ Corrección de mesas finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Corrección de mesas falló:', error);
      process.exit(1);
    });
}

module.exports = { fixMesas };
