require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testUpdateEstadoVenta() {
  const client = await pool.connect();
  try {
    console.log('🧪 Probando actualización de estado de venta...');
    
    // 1. Verificar ventas existentes
    console.log('\n📋 Ventas existentes:');
    const ventasResult = await client.query(`
      SELECT 
        id_venta,
        fecha,
        estado,
        mesa_numero,
        total,
        id_restaurante,
        id_sucursal
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 5
    `);
    
    ventasResult.rows.forEach(venta => {
      console.log(`ID: ${venta.id_venta}, Estado: ${venta.estado}, Restaurante: ${venta.id_restaurante}, Sucursal: ${venta.id_sucursal}`);
    });
    
    if (ventasResult.rows.length === 0) {
      console.log('❌ No hay ventas para probar');
      return;
    }
    
    // 2. Probar actualización con una venta existente
    const ventaParaProbar = ventasResult.rows[0];
    console.log(`\n🔧 Probando actualización de venta ${ventaParaProbar.id_venta}...`);
    
    // Simular la función del modelo
    const testUpdateQuery = `
      UPDATE ventas 
      SET estado = $1
      WHERE id_venta = $2 AND id_restaurante = $3
      RETURNING *;
    `;
    
    const testParams = ['en_preparacion', ventaParaProbar.id_venta, ventaParaProbar.id_restaurante];
    console.log('Query:', testUpdateQuery);
    console.log('Params:', testParams);
    
    const updateResult = await client.query(testUpdateQuery, testParams);
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Actualización exitosa:', updateResult.rows[0]);
    } else {
      console.log('❌ No se pudo actualizar la venta');
      
      // Verificar si la venta existe
      const checkVenta = await client.query(`
        SELECT id_venta, id_restaurante, estado 
        FROM ventas 
        WHERE id_venta = $1
      `, [ventaParaProbar.id_venta]);
      
      if (checkVenta.rows.length === 0) {
        console.log('❌ La venta no existe');
      } else {
        console.log('🔍 Venta encontrada:', checkVenta.rows[0]);
        console.log('❌ El id_restaurante no coincide o hay otro problema');
      }
    }
    
    // 3. Verificar estados válidos
    console.log('\n📊 Estados válidos en la base de datos:');
    const estadosResult = await client.query(`
      SELECT DISTINCT estado 
      FROM ventas 
      WHERE estado IS NOT NULL
      ORDER BY estado
    `);
    
    console.log('Estados encontrados:', estadosResult.rows.map(r => r.estado));
    
    // 4. Verificar estructura de la tabla ventas
    console.log('\n🏗️ Estructura de la tabla ventas:');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ventas'
      ORDER BY ordinal_position
    `);
    
    structureResult.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
  }
  await pool.end();
}

testUpdateEstadoVenta(); 