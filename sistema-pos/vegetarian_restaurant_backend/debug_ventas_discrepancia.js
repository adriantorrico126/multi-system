const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'menta_restobar_db',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function debugVentasDiscrepancia() {
  try {
    console.log('=== DEBUGGING DISCREPANCIA EN VENTAS ===');
    
    const fecha = '2025-07-06';
    
    // 1. Verificar todas las ventas del 6/7/2025 sin filtro de sucursal
    const queryTotal = `
      SELECT 
        id_sucursal,
        COUNT(*) as total_ventas,
        SUM(total) as total_ingresos
      FROM ventas 
      WHERE DATE(fecha) = $1
      GROUP BY id_sucursal
      ORDER BY id_sucursal;
    `;
    
    const { rows: totalVentas } = await pool.query(queryTotal, [fecha]);
    console.log('\n1. VENTAS TOTALES POR SUCURSAL (6/7/2025):');
    console.table(totalVentas);
    
    // 2. Verificar ventas por sucursal específica (ID 1)
    const querySucursal1 = `
      SELECT 
        COUNT(*) as total_ventas,
        SUM(total) as total_ingresos
      FROM ventas 
      WHERE DATE(fecha) = $1 AND id_sucursal = $2;
    `;
    
    const { rows: ventasSucursal1 } = await pool.query(querySucursal1, [fecha, 1]);
    console.log('\n2. VENTAS SUCURSAL 1 (6/7/2025):');
    console.table(ventasSucursal1);
    
    // 3. Verificar ventas por sucursal específica (ID 2)
    const { rows: ventasSucursal2 } = await pool.query(querySucursal1, [fecha, 2]);
    console.log('\n3. VENTAS SUCURSAL 2 (6/7/2025):');
    console.table(ventasSucursal2);
    
    // 4. Verificar todas las ventas del día con detalles
    const queryDetalles = `
      SELECT 
        id_venta,
        fecha,
        total,
        id_sucursal,
        tipo_servicio,
        estado
      FROM ventas 
      WHERE DATE(fecha) = $1
      ORDER BY id_venta;
    `;
    
    const { rows: ventasDetalles } = await pool.query(queryDetalles, [fecha]);
    console.log('\n4. DETALLES DE TODAS LAS VENTAS (6/7/2025):');
    console.table(ventasDetalles);
    
    // 5. Verificar sucursales disponibles
    const querySucursales = `
      SELECT 
        id_sucursal,
        nombre,
        ciudad
      FROM sucursales
      ORDER BY id_sucursal;
    `;
    
    const { rows: sucursales } = await pool.query(querySucursales);
    console.log('\n5. SUCURSALES DISPONIBLES:');
    console.table(sucursales);
    
    // 6. Simular la consulta del arqueo (getSalesSummary)
    const queryArqueo = `
      SELECT
          DATE(v.fecha) as fecha_venta,
          mp.descripcion as metodo_pago,
          SUM(v.total) as total_ventas,
          COUNT(v.id_venta) as numero_ventas
      FROM
          ventas v
      JOIN
          metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE
          v.fecha >= $1 AND v.fecha < ($2::date + INTERVAL '1 day')
          AND v.id_sucursal = $3
      GROUP BY
          DATE(v.fecha), mp.descripcion
      ORDER BY
          fecha_venta, metodo_pago;
    `;
    
    const { rows: arqueoSucursal1 } = await pool.query(queryArqueo, [fecha, '2025-07-07', 1]);
    console.log('\n6. ARQUEO SUCURSAL 1 (6/7/2025):');
    console.table(arqueoSucursal1);
    
    // 7. Simular la consulta del arqueo sin filtro de sucursal
    const queryArqueoSinFiltro = `
      SELECT
          DATE(v.fecha) as fecha_venta,
          mp.descripcion as metodo_pago,
          SUM(v.total) as total_ventas,
          COUNT(v.id_venta) as numero_ventas
      FROM
          ventas v
      JOIN
          metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE
          v.fecha >= $1 AND v.fecha < ($2::date + INTERVAL '1 day')
      GROUP BY
          DATE(v.fecha), mp.descripcion
      ORDER BY
          fecha_venta, metodo_pago;
    `;
    
    const { rows: arqueoSinFiltro } = await pool.query(queryArqueoSinFiltro, [fecha, '2025-07-07']);
    console.log('\n7. ARQUEO SIN FILTRO DE SUCURSAL (6/7/2025):');
    console.table(arqueoSinFiltro);
    
    console.log('\n✅ Debug completado');
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await pool.end();
  }
}

debugVentasDiscrepancia(); 