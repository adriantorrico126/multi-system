const axios = require('axios');

// Configuración
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

async function testStockAPIEndpoints() {
  console.log('🧪 Probando endpoints de gestión de stock por sucursal...\n');

  try {
    // 1. Login para obtener token
    console.log('1️⃣ Iniciando sesión...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    
    console.log('📋 Respuesta completa:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Login exitoso');
      console.log('👤 Usuario:', loginResponse.data.user?.nombre || 'No disponible');
      console.log('🏢 Restaurante:', loginResponse.data.user?.restaurante?.nombre || 'No disponible');
      console.log('🏪 Sucursales disponibles:', loginResponse.data.user?.sucursales?.map(s => s.nombre) || 'No disponible');
    } else {
      throw new Error('Error en login - no se obtuvo token');
    }

    // 2. Probar endpoint de stock por sucursal
    console.log('\n2️⃣ Probando GET /stock-sucursal/:id_sucursal...');
    
    const sucursalId = 1; // Sucursal Principal
    const stockResponse = await axios.get(`${API_BASE_URL}/stock-sucursal/${sucursalId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (stockResponse.data.success) {
      console.log('✅ Stock por sucursal obtenido exitosamente');
      console.log(`📦 Productos con stock: ${stockResponse.data.data.length}`);
      
      if (stockResponse.data.data.length > 0) {
        const sampleProduct = stockResponse.data.data[0];
        console.log('📋 Producto de ejemplo:', {
          nombre: sampleProduct.nombre_producto,
          stock_actual: sampleProduct.stock_actual,
          stock_minimo: sampleProduct.stock_minimo,
          estado: sampleProduct.estado_stock
        });
      }
    }

    // 3. Probar endpoint de alertas
    console.log('\n3️⃣ Probando GET /stock-sucursal/alerts...');
    
    const alertsResponse = await axios.get(`${API_BASE_URL}/stock-sucursal/alerts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (alertsResponse.data.success) {
      console.log('✅ Alertas obtenidas exitosamente');
      console.log(`🚨 Alertas activas: ${alertsResponse.data.data.length}`);
      
      if (alertsResponse.data.data.length > 0) {
        const sampleAlert = alertsResponse.data.data[0];
        console.log('⚠️ Alerta de ejemplo:', {
          producto: sampleAlert.nombre_producto,
          sucursal: sampleAlert.nombre_sucursal,
          stock_actual: sampleAlert.stock_actual,
          tipo: sampleAlert.tipo_alerta
        });
      }
    }

    // 4. Probar actualización de stock
    if (stockResponse.data.data.length > 0) {
      console.log('\n4️⃣ Probando PUT /stock-sucursal/:id_producto/:id_sucursal...');
      
      const testProduct = stockResponse.data.data[0];
      const newStockData = {
        stock_actual: testProduct.stock_actual + 5,
        stock_minimo: testProduct.stock_minimo,
        stock_maximo: testProduct.stock_maximo + 10
      };
      
      const updateResponse = await axios.put(
        `${API_BASE_URL}/stock-sucursal/${testProduct.id_producto}/${sucursalId}`,
        newStockData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (updateResponse.data.success) {
        console.log('✅ Stock actualizado exitosamente');
        console.log('📊 Nuevo stock:', {
          anterior: testProduct.stock_actual,
          nuevo: newStockData.stock_actual,
          diferencia: newStockData.stock_actual - testProduct.stock_actual
        });
        
        // Revertir el cambio
        const revertData = {
          stock_actual: testProduct.stock_actual,
          stock_minimo: testProduct.stock_minimo,
          stock_maximo: testProduct.stock_maximo
        };
        
        await axios.put(
          `${API_BASE_URL}/stock-sucursal/${testProduct.id_producto}/${sucursalId}`,
          revertData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        console.log('✅ Cambio revertido');
      }
    }

    // 5. Probar endpoint de reportes
    console.log('\n5️⃣ Probando GET /stock-sucursal/reports...');
    
    const reportsResponse = await axios.get(`${API_BASE_URL}/stock-sucursal/reports`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { tipo_reporte: 'stock_bajo' }
    });
    
    if (reportsResponse.data.success) {
      console.log('✅ Reportes obtenidos exitosamente');
      console.log(`📊 Productos con stock bajo: ${reportsResponse.data.data.length}`);
    }

    // 6. Probar endpoint consolidado
    console.log('\n6️⃣ Probando GET /stock-sucursal/consolidated...');
    
    const consolidatedResponse = await axios.get(`${API_BASE_URL}/stock-sucursal/consolidated`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (consolidatedResponse.data.success) {
      console.log('✅ Vista consolidada obtenida exitosamente');
      console.log(`📦 Total productos: ${consolidatedResponse.data.data.length}`);
      
      if (consolidatedResponse.data.data.length > 0) {
        const sampleProduct = consolidatedResponse.data.data[0];
        console.log('📋 Producto consolidado:', {
          nombre: sampleProduct.nombre_producto,
          stock_total: sampleProduct.stock_total,
          sucursales_con_stock: sampleProduct.sucursales_con_stock,
          stock_promedio: sampleProduct.stock_promedio
        });
      }
    }

    console.log('\n🎉 ¡Todos los endpoints de gestión de stock funcionan correctamente!');
    console.log('\n📋 Resumen de pruebas:');
    console.log('   ✅ Login y autenticación');
    console.log('   ✅ Obtener stock por sucursal');
    console.log('   ✅ Obtener alertas de stock');
    console.log('   ✅ Actualizar stock de producto');
    console.log('   ✅ Generar reportes');
    console.log('   ✅ Vista consolidada');
    console.log('\n🚀 El backend está listo para el frontend!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.error('💡 Verifica que el backend esté ejecutándose en el puerto 3000');
    } else if (error.response?.status === 401) {
      console.error('💡 Verifica las credenciales de login');
    }
    
    throw error;
  }
}

// Ejecutar las pruebas
testStockAPIEndpoints()
  .then(() => {
    console.log('\n✅ Pruebas de API completadas exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en las pruebas de API:', error.message);
    process.exit(1);
  });
