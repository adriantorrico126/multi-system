// Script para verificar la comunicación entre backend y frontend
const axios = require('axios');

async function testBackendFrontend() {
  console.log('🔍 Prueba de Comunicación Backend-Frontend');
  console.log('===========================================\n');

  try {
    // Simular la llamada al backend para obtener productos
    const response = await axios.get('http://localhost:3000/api/v1/productos', {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      params: {
        id_restaurante: 1,
        id_sucursal: 1
      }
    });

    console.log('📋 Respuesta del backend:');
    console.log('Status:', response.status);
    console.log('Data length:', response.data.data?.length || 0);
    
    // Buscar el producto HAMBURGUESA DOÑA ALVINA
    const productos = response.data.data || [];
    const hamburguesa = productos.find(p => p.nombre?.includes('HAMBURGUESA DOÑA ALVINA') || p.nombre?.includes('ALVINA'));
    
    if (hamburguesa) {
      console.log('\n🍔 Producto encontrado:');
      console.log('- ID:', hamburguesa.id_producto);
      console.log('- Nombre:', hamburguesa.nombre);
      console.log('- Precio original:', hamburguesa.precio);
      console.log('- Precio final:', hamburguesa.precio_final);
      console.log('- Descuento aplicado:', hamburguesa.descuento_aplicado);
      console.log('- Promoción aplicada:', hamburguesa.promocion_aplicada?.nombre);
      
      // Verificar si hay promociones activas
      const promocionesResponse = await axios.get('http://localhost:3000/api/v1/promociones', {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        params: {
          id_restaurante: 1
        }
      });
      
      console.log('\n🎯 Promociones activas:');
      const promociones = promocionesResponse.data.data || [];
      promociones.forEach(p => {
        console.log(`- ${p.nombre}: ${p.valor}% (Producto: ${p.id_producto})`);
      });
      
      // Verificar si el producto tiene promociones
      const promocionesProducto = promociones.filter(p => p.id_producto === hamburguesa.id_producto);
      console.log('\n📊 Promociones para este producto:', promocionesProducto.length);
      
    } else {
      console.log('❌ Producto HAMBURGUESA DOÑA ALVINA no encontrado');
    }

  } catch (error) {
    console.log('❌ Error al conectar con el backend:');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testBackendFrontend(); 