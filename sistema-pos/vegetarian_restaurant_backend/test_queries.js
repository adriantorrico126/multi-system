const db = require('./src/config/database');

async function testQueries() {
  try {
    console.log('🚀 Probando consultas SQL directamente...\n');

    // 1. Probar consulta de vendedores
    console.log('1. Probando consulta de vendedores...');
    try {
      const vendedoresResult = await db.query('SELECT * FROM vendedores WHERE username = $1 LIMIT 1', ['admin']);
      console.log('✅ Vendedores query exitosa:', vendedoresResult.rows[0]);
    } catch (error) {
      console.error('❌ Error en vendedores query:', error.message);
    }

    // 2. Probar consulta de sucursales
    console.log('\n2. Probando consulta de sucursales...');
    try {
      const sucursalesResult = await db.query('SELECT * FROM sucursales WHERE nombre = $1 LIMIT 1', ['Sucursal 16 de Julio']);
      console.log('✅ Sucursales query exitosa:', sucursalesResult.rows[0]);
    } catch (error) {
      console.error('❌ Error en sucursales query:', error.message);
    }

    // 3. Probar consulta de métodos de pago
    console.log('\n3. Probando consulta de métodos de pago...');
    try {
      const metodosResult = await db.query('SELECT * FROM metodos_pago WHERE descripcion = $1 LIMIT 1', ['Efectivo']);
      console.log('✅ Métodos de pago query exitosa:', metodosResult.rows[0]);
    } catch (error) {
      console.error('❌ Error en métodos de pago query:', error.message);
    }

    // 4. Probar consulta con LIMIT sin WHERE
    console.log('\n4. Probando consulta con LIMIT...');
    try {
      const limitResult = await db.query('SELECT * FROM vendedores LIMIT 1');
      console.log('✅ LIMIT query exitosa:', limitResult.rows[0]);
    } catch (error) {
      console.error('❌ Error en LIMIT query:', error.message);
    }

    console.log('\n🏁 Pruebas completadas');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testQueries(); 