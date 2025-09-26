const axios = require('axios');

async function probarVentaSimple() {
  try {
    console.log('🧪 [PRUEBA] Registro de venta simple');
    console.log('===================================');

    // 1. Primero hacer login para obtener token
    console.log('\n🔐 Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');

    // 2. Crear una venta simple
    console.log('\n💰 Creando venta simple...');
    const ventaData = {
      productos: [
        {
          id_producto: 1,
          cantidad: 2,
          precio: 10.50,
          nombre: 'Producto Test'
        }
      ],
      total: 21.00,
      tipo_servicio: 'Mostrador',
      paymentMethod: 'Efectivo',
      id_restaurante: 1,
      id_sucursal: 7,
      id_vendedor: 1
    };

    const ventaResponse = await axios.post('http://localhost:3000/api/v1/ventas', ventaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Venta creada exitosamente');
    console.log('📊 Datos de la venta:', ventaResponse.data);

    // 3. Verificar que la venta se guardó correctamente
    console.log('\n🔍 Verificando venta en base de datos...');
    const ventasResponse = await axios.get('http://localhost:3000/api/v1/ventas?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (ventasResponse.data.data && ventasResponse.data.data.length > 0) {
      const ultimaVenta = ventasResponse.data.data[0];
      console.log('✅ Venta encontrada en base de datos');
      console.log('📋 Detalles:', {
        id_venta: ultimaVenta.id_venta,
        total: ultimaVenta.total,
        estado: ultimaVenta.estado,
        metodo_pago: ultimaVenta.id_pago
      });
    } else {
      console.log('⚠️ No se encontraron ventas en la respuesta');
    }

    console.log('\n🎉 [PRUEBA COMPLETADA] Venta registrada exitosamente');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 Detalles del error del servidor:');
      console.log(error.response.data);
    }
  }
}

probarVentaSimple();
