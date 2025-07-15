const db = require('./src/config/database');

async function checkDBStructure() {
  try {
    console.log('🔍 Verificando estructura de la base de datos...\n');
    
    // 1. Verificar tablas existentes
    console.log('1. Tablas existentes:');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tablesResult = await db.query(tablesQuery);
    tablesResult.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    console.log('');

    // 2. Verificar estructura de vendedores
    console.log('2. Estructura de tabla vendedores:');
    const vendedoresQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendedores' 
      ORDER BY ordinal_position;
    `;
    const vendedoresResult = await db.query(vendedoresQuery);
    vendedoresResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    // 3. Verificar datos de vendedores
    console.log('3. Datos de vendedores:');
    const vendedoresDataQuery = 'SELECT * FROM vendedores LIMIT 5';
    const vendedoresDataResult = await db.query(vendedoresDataQuery);
    vendedoresDataResult.rows.forEach(vendedor => {
      console.log(`- ID: ${vendedor.id_vendedor}, Username: ${vendedor.username}, Nombre: ${vendedor.nombre}`);
    });
    console.log('');

    // 4. Verificar estructura de sucursales
    console.log('4. Estructura de tabla sucursales:');
    const sucursalesQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sucursales' 
      ORDER BY ordinal_position;
    `;
    const sucursalesResult = await db.query(sucursalesQuery);
    sucursalesResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    // 5. Verificar datos de sucursales
    console.log('5. Datos de sucursales:');
    const sucursalesDataQuery = 'SELECT * FROM sucursales LIMIT 5';
    const sucursalesDataResult = await db.query(sucursalesDataQuery);
    sucursalesDataResult.rows.forEach(sucursal => {
      console.log(`- ID: ${sucursal.id_sucursal}, Nombre: ${sucursal.nombre}`);
    });
    console.log('');

    // 6. Verificar estructura de métodos de pago
    console.log('6. Estructura de tabla metodos_pago:');
    const metodosQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'metodos_pago' 
      ORDER BY ordinal_position;
    `;
    const metodosResult = await db.query(metodosQuery);
    metodosResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    // 7. Verificar datos de métodos de pago
    console.log('7. Datos de métodos de pago:');
    const metodosDataQuery = 'SELECT * FROM metodos_pago LIMIT 5';
    const metodosDataResult = await db.query(metodosDataQuery);
    metodosDataResult.rows.forEach(metodo => {
      console.log(`- ID: ${metodo.id_pago}, Descripción: ${metodo.descripcion}`);
    });

    console.log('\n🏁 Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDBStructure(); 