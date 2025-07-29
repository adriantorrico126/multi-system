const { pool } = require('./src/config/database');

async function testExport() {
  try {
    console.log('🧪 Probando función de exportación...');
    
    // Simular los filtros que enviaría el frontend
    const filtros = {
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31',
      id_sucursal: null,
      id_producto: null,
      metodo_pago: null,
      cajero: null
    };
    
    const id_restaurante = 1; // Asumiendo que existe el restaurante 1
    
    console.log('📋 Filtros de prueba:', filtros);
    console.log('🏪 ID Restaurante:', id_restaurante);
    
    // Importar el modelo de ventas
    const VentaModel = require('./src/models/ventaModel');
    
    // Probar la función getVentasFiltradas
    console.log('🔄 Ejecutando getVentasFiltradas...');
    const ventas = await VentaModel.getVentasFiltradas(filtros, id_restaurante);
    
    console.log('✅ Ventas obtenidas:', ventas.length);
    
    if (ventas.length > 0) {
      console.log('📊 Primera venta como ejemplo:');
      console.log(JSON.stringify(ventas[0], null, 2));
    } else {
      console.log('⚠️ No se encontraron ventas para los filtros especificados');
    }
    
    // Verificar que las ventas tienen la estructura esperada
    const estructuraEsperada = {
      id: 'number',
      timestamp: 'string',
      cashier: 'string',
      branch: 'string',
      total: 'number',
      paymentMethod: 'string',
      items: 'array'
    };
    
    console.log('\n🔍 Verificando estructura de datos...');
    if (ventas.length > 0) {
      const primeraVenta = ventas[0];
      const camposRequeridos = Object.keys(estructuraEsperada);
      
      for (const campo of camposRequeridos) {
        if (primeraVenta.hasOwnProperty(campo)) {
          console.log(`✅ Campo "${campo}" presente`);
        } else {
          console.log(`❌ Campo "${campo}" faltante`);
        }
      }
    }
    
    console.log('\n✅ Prueba de exportación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

testExport(); 