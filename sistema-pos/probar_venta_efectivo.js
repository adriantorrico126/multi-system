const axios = require('axios');

async function probarVentaEfectivo() {
  try {
    console.log('🧪 [PRUEBA] Registro de venta con Efectivo');
    console.log('========================================');

    // 1. Primero hacer login para obtener token
    console.log('\n🔐 Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');

    // 2. Crear una venta con Efectivo
    console.log('\n💰 Creando venta con Efectivo...');
    const ventaData = {
      productos: [
        {
          id_producto: 1,
          cantidad: 1,
          precio: 15.50,
          nombre: 'Producto Test Efectivo'
        }
      ],
      total: 15.50,
      tipo_servicio: 'Mostrador',
      paymentMethod: 'Efectivo',
      id_restaurante: 1,
      id_sucursal: 1, // Usar sucursal válida
      id_vendedor: 1
    };

    const ventaResponse = await axios.post('http://localhost:3000/api/v1/ventas', ventaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Venta creada exitosamente');
    console.log('📊 Datos de la venta:', {
      id_venta: ventaResponse.data.data?.id_venta,
      total: ventaResponse.data.data?.total,
      estado: ventaResponse.data.data?.estado,
      metodo_pago: ventaResponse.data.data?.id_pago
    });

    // 3. Probar venta con pago diferido
    console.log('\n💳 Probando venta con pago diferido...');
    const ventaDiferidaData = {
      productos: [
        {
          id_producto: 1,
          cantidad: 2,
          precio: 10.00,
          nombre: 'Producto Test Diferido'
        }
      ],
      total: 20.00,
      tipo_servicio: 'Mesa',
      tipo_pago: 'diferido',
      id_mesa: 1,
      id_restaurante: 1,
      id_sucursal: 1,
      id_vendedor: 1
    };

    const ventaDiferidaResponse = await axios.post('http://localhost:3000/api/v1/ventas', ventaDiferidaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Venta diferida creada exitosamente');
    console.log('📊 Datos de la venta diferida:', {
      id_venta: ventaDiferidaResponse.data.data?.id_venta,
      total: ventaDiferidaResponse.data.data?.total,
      estado: ventaDiferidaResponse.data.data?.estado,
      metodo_pago: ventaDiferidaResponse.data.data?.id_pago,
      tipo_pago: ventaDiferidaResponse.data.data?.tipo_pago
    });

    console.log('\n🎉 [PRUEBA COMPLETADA] Ventas funcionando correctamente');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 Detalles del error del servidor:');
      console.log(error.response.data);
    }
  }
}

probarVentaEfectivo();

async function probarVentaEfectivo() {
  try {
    console.log('🧪 [PRUEBA] Registro de venta con Efectivo');
    console.log('========================================');

    // 1. Primero hacer login para obtener token
    console.log('\n🔐 Haciendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso, token obtenido');

    // 2. Crear una venta con Efectivo
    console.log('\n💰 Creando venta con Efectivo...');
    const ventaData = {
      productos: [
        {
          id_producto: 1,
          cantidad: 1,
          precio: 15.50,
          nombre: 'Producto Test Efectivo'
        }
      ],
      total: 15.50,
      tipo_servicio: 'Mostrador',
      paymentMethod: 'Efectivo',
      id_restaurante: 1,
      id_sucursal: 1, // Usar sucursal válida
      id_vendedor: 1
    };

    const ventaResponse = await axios.post('http://localhost:3000/api/v1/ventas', ventaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Venta creada exitosamente');
    console.log('📊 Datos de la venta:', {
      id_venta: ventaResponse.data.data?.id_venta,
      total: ventaResponse.data.data?.total,
      estado: ventaResponse.data.data?.estado,
      metodo_pago: ventaResponse.data.data?.id_pago
    });

    // 3. Probar venta con pago diferido
    console.log('\n💳 Probando venta con pago diferido...');
    const ventaDiferidaData = {
      productos: [
        {
          id_producto: 1,
          cantidad: 2,
          precio: 10.00,
          nombre: 'Producto Test Diferido'
        }
      ],
      total: 20.00,
      tipo_servicio: 'Mesa',
      tipo_pago: 'diferido',
      id_mesa: 1,
      id_restaurante: 1,
      id_sucursal: 1,
      id_vendedor: 1
    };

    const ventaDiferidaResponse = await axios.post('http://localhost:3000/api/v1/ventas', ventaDiferidaData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Venta diferida creada exitosamente');
    console.log('📊 Datos de la venta diferida:', {
      id_venta: ventaDiferidaResponse.data.data?.id_venta,
      total: ventaDiferidaResponse.data.data?.total,
      estado: ventaDiferidaResponse.data.data?.estado,
      metodo_pago: ventaDiferidaResponse.data.data?.id_pago,
      tipo_pago: ventaDiferidaResponse.data.data?.tipo_pago
    });

    console.log('\n🎉 [PRUEBA COMPLETADA] Ventas funcionando correctamente');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 Detalles del error del servidor:');
      console.log(error.response.data);
    }
  }
}

probarVentaEfectivo();


