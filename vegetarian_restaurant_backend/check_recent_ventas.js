const db = require('./src/config/database');

async function checkRecentVentas() {
  try {
    console.log('=== VERIFICANDO VENTAS MÁS RECIENTES ===');
    
    // Verificar las últimas 20 ventas con más detalle
    const ventasQuery = `
      SELECT 
        id_venta,
        fecha,
        mesa_numero,
        estado,
        total,
        tipo_servicio,
        id_vendedor,
        id_sucursal
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 20;
    `;
    
    const { rows: ventas } = await db.query(ventasQuery);
    console.log('\n1. ÚLTIMAS 20 VENTAS:');
    console.table(ventas);
    
    // Verificar si hay ventas con mesa_numero null (que podrían ser del frontend)
    const ventasSinMesaQuery = `
      SELECT 
        id_venta,
        fecha,
        mesa_numero,
        estado,
        total,
        tipo_servicio
      FROM ventas 
      WHERE mesa_numero IS NULL
      ORDER BY id_venta DESC 
      LIMIT 10;
    `;
    
    const { rows: ventasSinMesa } = await db.query(ventasSinMesaQuery);
    console.log('\n2. VENTAS SIN MESA (posiblemente del frontend):');
    if (ventasSinMesa.length > 0) {
      console.table(ventasSinMesa);
    } else {
      console.log('No hay ventas sin mesa');
    }
    
    // Verificar ventas de hoy específicamente
    const ventasHoyQuery = `
      SELECT 
        id_venta,
        fecha,
        mesa_numero,
        estado,
        total,
        tipo_servicio
      FROM ventas 
      WHERE DATE(fecha) = CURRENT_DATE
      ORDER BY id_venta DESC;
    `;
    
    const { rows: ventasHoy } = await db.query(ventasHoyQuery);
    console.log('\n3. VENTAS DE HOY:');
    if (ventasHoy.length > 0) {
      console.table(ventasHoy);
    } else {
      console.log('No hay ventas de hoy');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

checkRecentVentas(); 