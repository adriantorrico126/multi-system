const { pool } = require('./src/config/database');

async function testExportFunction() {
  try {
    console.log('🧪 Probando función getVentasFiltradas...');
    
    // Simular los filtros que enviaría el frontend
    const filtros = {
      fecha_inicio: '2025-07-18',
      fecha_fin: '2025-07-28',
      id_sucursal: null,
      id_producto: null,
      metodo_pago: null,
      cajero: null
    };
    
    const id_restaurante = 1;
    
    console.log('📋 Filtros de prueba:', filtros);
    console.log('🏪 ID Restaurante:', id_restaurante);
    
    // Importar el modelo de ventas
    const VentaModel = require('./src/models/ventaModel');
    
    // Probar la función getVentasFiltradas
    console.log('🔄 Ejecutando getVentasFiltradas...');
    const ventas = await VentaModel.getVentasFiltradas(filtros, id_restaurante);
    
    console.log('✅ Ventas obtenidas:', ventas.length);
    
    if (ventas.length > 0) {
      console.log('📊 Primeras 5 ventas con sus métodos de pago:');
      ventas.slice(0, 5).forEach((venta, index) => {
        console.log(`  ${index + 1}. ID: ${venta.id}, Método: "${venta.paymentMethod}", Total: Bs${venta.total}`);
      });
      
      // Verificar si hay ventas con "No especificado"
      const ventasSinMetodo = ventas.filter(v => v.paymentMethod === 'No especificado');
      console.log(`⚠️ Ventas con "No especificado": ${ventasSinMetodo.length}`);
      
      if (ventasSinMetodo.length > 0) {
        console.log('🔍 Detalles de ventas con "No especificado":');
        ventasSinMetodo.slice(0, 3).forEach(venta => {
          console.log(`  ID: ${venta.id}, Total: Bs${venta.total}, Fecha: ${venta.timestamp}`);
        });
      }
    } else {
      console.log('⚠️ No se encontraron ventas para los filtros especificados');
    }
    
    // Probar la consulta SQL directamente
    console.log('\n🔍 Probando consulta SQL directamente...');
    const query = `
      SELECT 
        v.id_venta as id,
        v.fecha as timestamp,
        u.nombre as cashier,
        s.nombre as branch,
        v.total,
        v.id_pago,
        COALESCE(mp.descripcion, 'No especificado') as paymentMethod,
        v.tipo_servicio,
        v.estado,
        v.mesa_numero,
        v.created_at
      FROM ventas v
      JOIN usuarios u ON v.id_vendedor = u.id_usuario
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE v.id_restaurante = $1
      ORDER BY v.fecha DESC
      LIMIT 5
    `;
    
    const { rows } = await pool.query(query, [id_restaurante]);
    console.log('📋 Resultado de consulta SQL directa:');
    rows.forEach((venta, index) => {
      console.log(`  ${index + 1}. ID: ${venta.id}, id_pago: ${venta.id_pago}, Método: "${venta.paymentmethod}"`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await pool.end();
  }
}

testExportFunction(); 