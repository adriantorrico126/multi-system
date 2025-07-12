require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function testVentaDirect() {
  try {
    console.log('🚀 Probando creación directa de venta...\n');
    
    const client = await pool.connect();
    console.log('✅ Conectado a la base de datos PostgreSQL exitosamente.\n');

    // Obtener datos necesarios
    console.log('1. Obteniendo datos necesarios...');
    
    // Obtener vendedor
    const vendedorQuery = "SELECT id_vendedor FROM vendedores WHERE username = 'admin' LIMIT 1";
    const vendedorResult = await client.query(vendedorQuery);
    const vendedor = vendedorResult.rows[0];
    console.log('Vendedor:', vendedor);
    
    // Obtener método de pago
    const pagoQuery = "SELECT id_pago FROM metodos_pago WHERE descripcion = 'Efectivo' LIMIT 1";
    const pagoResult = await client.query(pagoQuery);
    const pago = pagoResult.rows[0];
    console.log('Método de pago:', pago);
    
    // Obtener sucursal
    const sucursalQuery = "SELECT id_sucursal FROM sucursales WHERE nombre = 'Sucursal 16 de Julio' LIMIT 1";
    const sucursalResult = await client.query(sucursalQuery);
    const sucursal = sucursalResult.rows[0];
    console.log('Sucursal:', sucursal);
    
    if (!vendedor || !pago || !sucursal) {
      console.log('❌ No se encontraron los datos necesarios');
      return;
    }
    
    console.log('');

    // 2. Crear venta directamente
    console.log('2. Creando venta directamente...');
    
    await client.query('BEGIN');
    
    try {
      // Insertar venta
      const ventaQuery = `
        INSERT INTO ventas (fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado)
        VALUES (NOW(), $1, $2, $3, $4, $5, $6, 'recibido')
        RETURNING id_venta, fecha, estado, mesa_numero, total;
      `;
      const ventaValues = [vendedor.id_vendedor, pago.id_pago, sucursal.id_sucursal, 'Mesa', 12.00, 7];
      
      const ventaResult = await client.query(ventaQuery, ventaValues);
      const venta = ventaResult.rows[0];
      console.log('✅ Venta creada:', venta);
      
      // Insertar detalle de venta
      const detalleQuery = `
        INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, observaciones)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_detalle, id_venta, id_producto, cantidad, precio_unitario;
      `;
      const detalleValues = [venta.id_venta, 93, 2, 6.00, 'Prueba directa'];
      
      const detalleResult = await client.query(detalleQuery, detalleValues);
      const detalle = detalleResult.rows[0];
      console.log('✅ Detalle creado:', detalle);
      
      await client.query('COMMIT');
      console.log('✅ Transacción completada exitosamente');
      
      // 3. Verificar que aparece en la comanda
      console.log('\n3. Verificando comanda...');
      const comandaQuery = `
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
      
      const comandaResult = await client.query(comandaQuery);
      console.log('📋 Pedidos en comanda:', comandaResult.rows.length);
      
      if (comandaResult.rows.length > 0) {
        comandaResult.rows.forEach((pedido, index) => {
          console.log(`- Pedido ${index + 1}: Venta ${pedido.id_venta}, Estado: ${pedido.estado}, Mesa: ${pedido.mesa_numero}`);
        });
      } else {
        console.log('❌ No hay pedidos en la comanda');
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error en la transacción:', error.message);
    }
    
    client.release();
    console.log('\n🏁 Prueba completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testVentaDirect(); 