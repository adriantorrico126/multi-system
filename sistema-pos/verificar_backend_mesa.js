const axios = require('axios');

async function verificarBackend() {
  try {
    console.log('🔍 Verificando estado del backend...\n');

    // 1. Verificar que el backend esté corriendo
    try {
      const healthResponse = await axios.get('http://localhost:3000/api/v1/health');
      console.log('✅ Backend corriendo:', healthResponse.status);
    } catch (error) {
      console.log('❌ Backend no disponible:', error.message);
      return;
    }

    // 2. Verificar mesas disponibles
    try {
      const mesasResponse = await axios.get('http://localhost:3000/api/v1/mesas', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Mesas disponibles:', mesasResponse.data?.length || 0);
      
      if (mesasResponse.data && mesasResponse.data.length > 0) {
        const mesaOcupada = mesasResponse.data.find(m => m.estado === 'en_uso' || m.estado === 'pendiente_cobro');
        if (mesaOcupada) {
          console.log('📋 Mesa ocupada encontrada:', {
            id: mesaOcupada.id_mesa,
            numero: mesaOcupada.numero,
            estado: mesaOcupada.estado,
            total_acumulado: mesaOcupada.total_acumulado
          });
        } else {
          console.log('⚠️ No hay mesas ocupadas para probar');
        }
      }
    } catch (error) {
      console.log('❌ Error obteniendo mesas:', error.response?.data || error.message);
    }

    // 3. Verificar productos disponibles
    try {
      const productosResponse = await axios.get('http://localhost:3000/api/v1/productos', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Productos disponibles:', productosResponse.data?.length || 0);
    } catch (error) {
      console.log('❌ Error obteniendo productos:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

verificarBackend();
