const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'vegetarian_restaurant',
  user: 'postgres',
  password: '123456'
});

async function checkVentaStates() {
  try {
    console.log('=== VERIFICANDO ESTADOS DE VENTAS ===');
    
    // 1. Verificar ventas recientes
    const ventasQuery = `
      SELECT 
        id_venta,
        fecha,
        mesa_numero,
        estado,
        total,
        tipo_servicio
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 10;
    `;
    
    const { rows: ventas } = await pool.query(ventasQuery);
    console.log('\n1. VENTAS RECIENTES:');
    console.table(ventas);
    
    // 2. Verificar pedidos para cocina (misma consulta que usa el backend)
    const pedidosQuery = `
      SELECT
          v.id_venta,
          v.fecha,
          v.mesa_numero,
          v.tipo_servicio,
          v.estado,
          v.total,
          json_agg(
              json_build_object(
                  'id_producto', p.id_producto,
                  'nombre_producto', p.nombre,
                  'cantidad', dv.cantidad,
                  'precio_unitario', dv.precio_unitario,
                  'observaciones', dv.observaciones
              )
          ) AS productos
      FROM
          ventas v
      JOIN
          detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN
          productos p ON dv.id_producto = p.id_producto
      WHERE
          v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
      GROUP BY
          v.id_venta, v.fecha, v.mesa_numero, v.tipo_servicio, v.estado, v.total
      ORDER BY
          v.fecha ASC;
    `;
    
    const { rows: pedidos } = await pool.query(pedidosQuery);
    console.log('\n2. PEDIDOS PARA COCINA:');
    console.log('Cantidad de pedidos encontrados:', pedidos.length);
    if (pedidos.length > 0) {
      console.table(pedidos.map(p => ({
        id_venta: p.id_venta,
        fecha: p.fecha,
        mesa_numero: p.mesa_numero,
        estado: p.estado,
        total: p.total,
        productos_count: p.productos.length
      })));
    } else {
      console.log('❌ NO HAY PEDIDOS PARA COCINA');
    }
    
    // 3. Verificar si hay ventas con estado 'recibido' que no aparecen en pedidos
    const ventasRecibidasQuery = `
      SELECT id_venta, fecha, mesa_numero, estado, total
      FROM ventas 
      WHERE estado = 'recibido'
      ORDER BY id_venta DESC;
    `;
    
    const { rows: ventasRecibidas } = await pool.query(ventasRecibidasQuery);
    console.log('\n3. VENTAS CON ESTADO "RECIBIDO":');
    console.log('Cantidad:', ventasRecibidas.length);
    if (ventasRecibidas.length > 0) {
      console.table(ventasRecibidas);
    }
    
    // 4. Verificar si hay detalles de venta para las ventas recientes
    const detallesQuery = `
      SELECT 
        dv.id_venta,
        COUNT(dv.id_detalle) as cantidad_detalles,
        p.nombre as producto_ejemplo
      FROM detalle_ventas dv
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta IN (
        SELECT id_venta FROM ventas ORDER BY id_venta DESC LIMIT 5
      )
      GROUP BY dv.id_venta, p.nombre
      ORDER BY dv.id_venta DESC;
    `;
    
    const { rows: detalles } = await pool.query(detallesQuery);
    console.log('\n4. DETALLES DE VENTAS RECIENTES:');
    console.table(detalles);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkVentaStates(); 