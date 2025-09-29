const http = require('http');

function verificarBackend() {
  console.log('🔍 [VERIFICACIÓN BACKEND] Verificando si el backend está ejecutándose...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Backend respondiendo - Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📡 Respuesta del backend:', data);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Backend no disponible:', error.message);
    console.log('\n💡 Soluciones:');
    console.log('1. Verificar que el backend esté ejecutándose en puerto 3000');
    console.log('2. Ejecutar: cd vegetarian_restaurant_backend && npm start');
    console.log('3. Verificar logs del backend para errores');
  });

  req.setTimeout(5000, () => {
    console.error('⏰ Timeout: Backend no responde en 5 segundos');
    req.destroy();
  });

  req.end();
}

verificarBackend();

function verificarBackend() {
  console.log('🔍 [VERIFICACIÓN BACKEND] Verificando si el backend está ejecutándose...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Backend respondiendo - Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📡 Respuesta del backend:', data);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Backend no disponible:', error.message);
    console.log('\n💡 Soluciones:');
    console.log('1. Verificar que el backend esté ejecutándose en puerto 3000');
    console.log('2. Ejecutar: cd vegetarian_restaurant_backend && npm start');
    console.log('3. Verificar logs del backend para errores');
  });

  req.setTimeout(5000, () => {
    console.error('⏰ Timeout: Backend no responde en 5 segundos');
    req.destroy();
  });

  req.end();
}

verificarBackend();


