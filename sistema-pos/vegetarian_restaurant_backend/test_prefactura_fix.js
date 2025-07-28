const { Pool } = require('pg');

// Usar las credenciales correctas
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos', // Base de datos correcta
  user: 'postgres',
  password: '69512310Anacleta' // Contraseña correcta
});

async function testPrefacturaQuery() {
  try {
    console.log('🔍 Testing prefactura query...');
    
    // Primero, vamos a ver qué bases de datos existen
    console.log('\n📋 Checking available databases:');
    const dbQuery = `SELECT datname FROM pg_database WHERE datistemplate = false;`;
    const dbResult = await pool.query(dbQuery);
    console.log('Available databases:');
    dbResult.rows.forEach(row => {
      console.log(`  - ${row.datname}`);
    });

    // Verificar si existe la base de datos sistempos
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = 'sistempos';`;
    const checkDbResult = await pool.query(checkDbQuery);
    
    if (checkDbResult.rows.length === 0) {
      console.log('\n❌ La base de datos "sistempos" no existe');
      console.log('💡 Vamos a crear la base de datos...');
      
      // Crear la base de datos
      const createDbQuery = `CREATE DATABASE sistempos;`;
      await pool.query(createDbQuery);
      console.log('✅ Base de datos "sistempos" creada exitosamente');
      
      // Cerrar la conexión actual y conectarse a la nueva base de datos
      await pool.end();
      
      const newPool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'sistempos',
        user: 'postgres',
        password: '69512310Anacleta'
      });
      
      // Ahora ejecutar las pruebas en la nueva base de datos
      await testInDatabase(newPool);
      await newPool.end();
    } else {
      console.log('\n✅ La base de datos "sistempos" existe');
      await testInDatabase(pool);
    }

  } catch (error) {
    console.error('❌ Error testing prefactura query:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await pool.end();
  }
}

async function testInDatabase(pool) {
  // First, let's check the actual schema of detalle_ventas
  console.log('\n📋 Checking detalle_ventas schema:');
  const schemaQuery = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'detalle_ventas'
    ORDER BY ordinal_position;
  `;
  const schemaResult = await pool.query(schemaQuery);
  console.log('Detalle_ventas columns:');
  schemaResult.rows.forEach(row => {
    console.log(`  ${row.column_name} (${row.data_type}) - nullable: ${row.is_nullable}`);
  });

  // Test the exact query that's failing
  console.log('\n🧪 Testing the failing query:');
  const testQuery = `
    SELECT 
      v.id_venta,
      v.mesa_numero,
      v.id_sucursal,
      v.estado,
      v.total,
      v.fecha,
      COUNT(dv.id_detalle) as items_count
    FROM ventas v
    LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
    WHERE v.mesa_numero = 1 
      AND v.id_sucursal = 1
      AND v.id_restaurante = 1
    GROUP BY v.id_venta, v.mesa_numero, v.id_sucursal, v.estado, v.total, v.fecha
    ORDER BY v.fecha DESC
    LIMIT 5;
  `;
  
  const testResult = await pool.query(testQuery);
  console.log(`✅ Query executed successfully! Found ${testResult.rows.length} records`);
  
  if (testResult.rows.length > 0) {
    console.log('Sample result:', testResult.rows[0]);
  }

  // Test the historial query
  console.log('\n🧪 Testing historial query:');
  const historialQuery = `
    SELECT 
      v.id_venta,
      v.fecha,
      v.total,
      v.estado,
      v.tipo_servicio,
      dv.cantidad,
      dv.precio_unitario,
      dv.subtotal,
      dv.observaciones,
      p.nombre as nombre_producto,
      vend.nombre as nombre_vendedor,
      dv.id_detalle,
      dv.id_producto
    FROM ventas v
    JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
    JOIN productos p ON dv.id_producto = p.id_producto
    JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
    WHERE v.mesa_numero = 1
      AND v.id_sucursal = 1
      AND v.id_restaurante = 1
      AND v.estado IN ('abierta', 'en_uso', 'pendiente_cobro', 'entregado', 'pagado')
    ORDER BY v.fecha DESC
    LIMIT 5;
  `;
  
  const historialResult = await pool.query(historialQuery);
  console.log(`✅ Historial query executed successfully! Found ${historialResult.rows.length} records`);
  
  if (historialResult.rows.length > 0) {
    console.log('Sample historial result:', historialResult.rows[0]);
  }

  // Check if there are any ventas for mesa 32
  console.log('\n🔍 Checking ventas for mesa 32:');
  const mesa32Query = `
    SELECT id_venta, mesa_numero, estado, total, fecha
    FROM ventas 
    WHERE mesa_numero = 32 AND id_restaurante = 1
    ORDER BY fecha DESC;
  `;
  
  const mesa32Result = await pool.query(mesa32Query);
  console.log(`Found ${mesa32Result.rows.length} ventas for mesa 32`);
  
  if (mesa32Result.rows.length > 0) {
    console.log('Sample venta for mesa 32:', mesa32Result.rows[0]);
  }
}

testPrefacturaQuery(); 