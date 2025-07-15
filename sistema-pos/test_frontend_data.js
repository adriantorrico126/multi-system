const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testFrontendData() {
  try {
    console.log('🚀 Probando datos exactos del frontend...\n');

    // 1. Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('');

    // 2. Simular datos exactos del frontend
    console.log('2. Simulando datos del frontend...');
    
    // Datos como los envía el frontend
    const frontendSaleData = {
      items: [
        {
          id: "93", // String como lo envía el frontend
          quantity: 1,
          price: 6.00,
          notes: "Prueba frontend"
        }
      ],
      total: 6.00,
      paymentMethod: "Efectivo",
      cashier: "admin",
      branch: "Sucursal 16 de Julio",
      mesa_numero: 11
    };

    console.log('Datos del frontend:', JSON.stringify(frontendSaleData, null, 2));
    console.log('');

    // 3. Mapear como lo hace el frontend
    console.log('3. Mapeando datos como el frontend...');
    const items = frontendSaleData.items.map(item => ({
      id_producto: parseInt(item.id, 10),
      cantidad: item.quantity,
      precio_unitario: item.price,
      observaciones: item.notes || ''
    }));
    
    const payload = {
      items,
      total: frontendSaleData.total,
      paymentMethod: frontendSaleData.paymentMethod,
      cashier: frontendSaleData.cashier,
      branch: frontendSaleData.branch,
      tipo_servicio: 'Mesa',
      mesa_numero: frontendSaleData.mesa_numero
    };

    console.log('Payload mapeado:', JSON.stringify(payload, null, 2));
    console.log('');

    // 4. Enviar al backend
    console.log('4. Enviando al backend...');
    const saleResponse = await axios.post(`${API_URL}/ventas`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Venta registrada exitosamente');
    console.log('Respuesta:', JSON.stringify(saleResponse.data, null, 2));
    console.log('');

    // 5. Verificar comanda
    console.log('5. Verificando comanda...');
    const comandaResponse = await axios.get(`${API_URL}/ventas/cocina`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Comanda obtenida');
    console.log('Número de pedidos en comanda:', comandaResponse.data.data?.length || 0);
    
    if (comandaResponse.data.data && comandaResponse.data.data.length > 0) {
      console.log('Pedidos en comanda:');
      comandaResponse.data.data.forEach((pedido, index) => {
        console.log(`- Pedido ${index + 1}: Venta ${pedido.id_venta}, Estado: ${pedido.estado}, Mesa: ${pedido.mesa_numero}`);
      });
    } else {
      console.log('❌ No hay pedidos en la comanda');
    }

    console.log('\n🏁 Prueba completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFrontendData(); 