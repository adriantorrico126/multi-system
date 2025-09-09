const fs = require('fs');
const path = require('path');

// Crear archivo .env para producción
const envContent = `# Variables de entorno para PRODUCCIÓN
VITE_BACKEND_URL=https://api.forkast.vip
VITE_POS_API_URL=https://api.forkast.vip
VITE_PRINT_SERVER_URL=https://api.forkast.vip
VITE_SOCKET_URL=https://api.forkast.vip
`;

const envPath = path.join(__dirname, 'menta-resto-system-pro', '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado exitosamente para producción');
  console.log('📁 Ubicación:', envPath);
  console.log('🔗 URL del backend:', 'https://api.forkast.vip');
} catch (error) {
  console.error('❌ Error creando archivo .env:', error.message);
}

// También crear un archivo de configuración alternativa
const configContent = `// Configuración de producción para el sistema POS
export const PRODUCTION_CONFIG = {
  BACKEND_URL: 'https://api.forkast.vip',
  PRINT_SERVER_URL: 'https://api.forkast.vip',
  SOCKET_URL: 'https://api.forkast.vip',
  // Configuración SSL para desarrollo
  SSL_CONFIG: {
    rejectUnauthorized: false
  }
};

// Función para obtener la URL del backend
export const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || PRODUCTION_CONFIG.BACKEND_URL;
};

// Función para obtener la URL del servidor de impresión
export const getPrintServerUrl = () => {
  return import.meta.env.VITE_PRINT_SERVER_URL || PRODUCTION_CONFIG.PRINT_SERVER_URL;
};

// Función para obtener la URL del socket
export const getSocketUrl = () => {
  return import.meta.env.VITE_SOCKET_URL || PRODUCTION_CONFIG.SOCKET_URL;
};
`;

const configPath = path.join(__dirname, 'menta-resto-system-pro', 'src', 'config', 'production.ts');

try {
  // Crear directorio si no existe
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, configContent);
  console.log('✅ Archivo de configuración de producción creado');
  console.log('📁 Ubicación:', configPath);
} catch (error) {
  console.error('❌ Error creando archivo de configuración:', error.message);
}

console.log('\n🔧 CONFIGURACIÓN DE PRODUCCIÓN COMPLETADA');
console.log('=' .repeat(50));
console.log('📋 Pasos siguientes:');
console.log('1. Reiniciar el servidor de desarrollo');
console.log('2. Verificar que las variables de entorno se carguen correctamente');
console.log('3. Probar la conexión con el backend de producción');
console.log('4. Si persisten los errores SSL, considerar usar HTTP en lugar de HTTPS');
