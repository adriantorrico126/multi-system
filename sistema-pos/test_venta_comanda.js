const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testVentaComanda() {
  try {
    console.log('🚀 Probando registro de venta y comanda...\n');

    // 1. Login
    console.log('1. Haciendo login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    console.log('');

    // 2. Registrar una venta
    console.log('2. Registrando venta de prueba...');
    const saleData = {
      items: [
        {
          id_producto: 93,
          cantidad: 2,
          precio_unitario: 6.00,
          observaciones: 'Prueba comanda'
        },
        {
          id_producto: 94,
          cantidad: 1,
          precio_unitario: 7.00,
          observaciones: 'Prueba comanda 2'
        }
      ],
      total: 19.00,
      paymentMethod: 'Efectivo',
      cashier: 'admin',
      branch: 'Sucursal 16 de Julio',
      tipo_servicio: 'Mesa',
      mesa_numero: 3
    };

    const saleResponse = await axios.post(`${API_URL}/ventas`, saleData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Venta registrada exitosamente');
    console.log('ID de venta:', saleResponse.data.venta?.id_venta);
    console.log('Estado de venta:', saleResponse.data.venta?.estado);
    console.log('');

    // 3. Verificar que aparece en la comanda
    console.log('3. Verificando comanda...');
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
        console.log('  Productos:', pedido.productos);
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

testVentaComanda(); 