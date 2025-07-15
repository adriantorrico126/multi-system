const db = require('./vegetarian_restaurant_backend/src/config/database');

async function testSystems() {
  console.log('🔍 TESTING SYSTEMS FUNCTIONALITY...\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing Database Connection...');
    const dbTest = await db.query('SELECT NOW()');
    console.log('✅ Database connection OK:', dbTest.rows[0].now);

    // Test 2: Check if movimientos_inventario table exists
    console.log('\n2. Checking movimientos_inventario table...');
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'movimientos_inventario'
        );
      `);
      const tableExists = tableCheck.rows[0].exists;
      console.log(tableExists ? '✅ Table exists' : '❌ Table does not exist');
      
      if (!tableExists) {
        console.log('⚠️  Creating movimientos_inventario table...');
        await db.query(`
          CREATE TABLE IF NOT EXISTS movimientos_inventario (
            id_movimiento SERIAL PRIMARY KEY,
            id_producto INTEGER REFERENCES productos(id_producto),
            tipo_movimiento VARCHAR(50) NOT NULL,
            cantidad INTEGER NOT NULL,
            stock_anterior INTEGER NOT NULL,
            stock_actual INTEGER NOT NULL,
            id_vendedor INTEGER REFERENCES vendedores(id_vendedor),
            fecha_movimiento TIMESTAMP DEFAULT NOW()
          );
        `);
        console.log('✅ Table created successfully');
      }
    } catch (err) {
      console.log('❌ Error checking/creating table:', err.message);
    }

    // Test 3: Check if ventas table has required columns
    console.log('\n3. Checking ventas table structure...');
    try {
      const ventasCheck = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'ventas' 
        AND column_name IN ('estado', 'total', 'fecha');
      `);
      console.log('✅ Ventas table columns:', ventasCheck.rows.map(r => `${r.column_name} (${r.data_type})`));
    } catch (err) {
      console.log('❌ Error checking ventas table:', err.message);
    }

    // Test 4: Check if productos table has stock_actual
    console.log('\n4. Checking productos table structure...');
    try {
      const productosCheck = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'stock_actual';
      `);
      console.log(productosCheck.rows.length > 0 ? '✅ stock_actual column exists' : '❌ stock_actual column missing');
    } catch (err) {
      console.log('❌ Error checking productos table:', err.message);
    }

    // Test 5: Check if there are any products
    console.log('\n5. Checking products data...');
    try {
      const productsCount = await db.query('SELECT COUNT(*) FROM productos');
      console.log(`✅ Found ${productsCount.rows[0].count} products`);
    } catch (err) {
      console.log('❌ Error checking products:', err.message);
    }

    // Test 6: Check if there are any sales
    console.log('\n6. Checking sales data...');
    try {
      const salesCount = await db.query('SELECT COUNT(*) FROM ventas');
      console.log(`✅ Found ${salesCount.rows[0].count} sales`);
    } catch (err) {
      console.log('❌ Error checking sales:', err.message);
    }

    console.log('\n🎯 SYSTEMS ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
  } finally {
    process.exit(0);
  }
}

testSystems(); 