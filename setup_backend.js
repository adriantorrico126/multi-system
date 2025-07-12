const fs = require('fs');
const path = require('path');

console.log('🔧 CONFIGURANDO BACKEND...\n');

// Función para crear archivo .env si no existe
function createEnvFile() {
  const envPath = path.join(__dirname, 'vegetarian_restaurant_backend', '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env ya existe');
    return;
  }

  const envContent = `# Configuración del servidor
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Configuración de la base de datos
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_NAME=menta_restobar_db
DB_PORT=5432

# Configuración de JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_cambiar_en_produccion
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado');
    console.log('⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales');
  } catch (error) {
    console.error('❌ Error creando archivo .env:', error.message);
  }
}

// Función para verificar dependencias
function checkDependencies() {
  console.log('\n📦 Verificando dependencias...');
  
  const packagePath = path.join(__dirname, 'vegetarian_restaurant_backend', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json no encontrado');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log('✅ package.json encontrado');
    console.log(`📋 Versión: ${packageJson.version}`);
    return true;
  } catch (error) {
    console.error('❌ Error leyendo package.json:', error.message);
    return false;
  }
}

// Función para mostrar instrucciones
function showInstructions() {
  console.log('\n📋 INSTRUCCIONES PARA INICIAR EL BACKEND:');
  console.log('\n1. Edita el archivo .env con tus credenciales:');
  console.log('   - Cambia DB_PASSWORD por tu password de PostgreSQL');
  console.log('   - Cambia JWT_SECRET por una clave segura');
  
  console.log('\n2. Ejecuta las migraciones de la base de datos:');
  console.log('   psql -U postgres -d menta_restobar_db -f create_mesa_tables.sql');
  
  console.log('\n3. Instala las dependencias:');
  console.log('   cd vegetarian_restaurant_backend');
  console.log('   npm install');
  
  console.log('\n4. Inicia el servidor:');
  console.log('   npm start');
  
  console.log('\n5. Verifica que todo funcione:');
  console.log('   node check_backend_startup.js');
}

// Ejecutar configuración
async function setupBackend() {
  console.log('🚀 INICIANDO CONFIGURACIÓN DEL BACKEND...\n');
  
  // 1. Crear archivo .env
  createEnvFile();
  
  // 2. Verificar dependencias
  const depsOk = checkDependencies();
  
  // 3. Mostrar instrucciones
  showInstructions();
  
  if (depsOk) {
    console.log('\n✅ CONFIGURACIÓN COMPLETADA');
    console.log('💡 Ejecuta "node check_backend_startup.js" para verificar todo');
  } else {
    console.log('\n⚠️  Algunos problemas detectados');
    console.log('💡 Revisa los errores arriba');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupBackend().catch(console.error);
}

module.exports = { setupBackend }; 