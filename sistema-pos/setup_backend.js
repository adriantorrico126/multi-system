const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    // Crear directorio si no existe
    const envDir = path.dirname(envPath);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }
    
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
    console.log(`📦 Dependencias: ${Object.keys(packageJson.dependencies || {}).length}`);
    return true;
  } catch (error) {
    console.error('❌ Error leyendo package.json:', error.message);
    return false;
  }
}

// Función para verificar PostgreSQL
function checkPostgreSQL() {
  console.log('\n🗄️  Verificando PostgreSQL...');
  
  try {
    // Verificar si psql está disponible
    execSync('psql --version', { stdio: 'pipe' });
    console.log('✅ PostgreSQL CLI disponible');
    
    // Intentar conectar a PostgreSQL
    try {
      execSync('psql -U postgres -c "SELECT version();"', { stdio: 'pipe' });
      console.log('✅ Conexión a PostgreSQL exitosa');
      return true;
    } catch (error) {
      console.log('⚠️  No se pudo conectar a PostgreSQL automáticamente');
      console.log('💡 Asegúrate de que PostgreSQL esté ejecutándose');
      return false;
    }
  } catch (error) {
    console.log('❌ PostgreSQL CLI no encontrado');
    console.log('💡 Instala PostgreSQL desde: https://www.postgresql.org/download/');
    return false;
  }
}

// Función para verificar Node.js
function checkNodeJS() {
  console.log('\n🟢 Verificando Node.js...');
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js ${nodeVersion} instalado`);
    
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm ${npmVersion} instalado`);
    
    return true;
  } catch (error) {
    console.log('❌ Node.js no encontrado');
    console.log('💡 Instala Node.js desde: https://nodejs.org/');
    return false;
  }
}

// Función para crear script de instalación automática
function createInstallScript() {
  const installScript = `#!/bin/bash
# Script de instalación automática para el backend

echo "🚀 Instalando dependencias del backend..."

# Navegar al directorio del backend
cd vegetarian_restaurant_backend

# Instalar dependencias
npm install

echo "✅ Dependencias instaladas"

# Verificar que el archivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Archivo .env no encontrado"
    echo "💡 Ejecuta 'node setup_backend.js' desde la raíz del proyecto"
    exit 1
fi

echo "✅ Configuración completada"
echo "💡 Para iniciar el servidor: npm start"
`;

  const scriptPath = path.join(__dirname, 'install_backend.sh');
  fs.writeFileSync(scriptPath, installScript);
  fs.chmodSync(scriptPath, '755');
  console.log('✅ Script de instalación creado: install_backend.sh');
}

// Función para mostrar instrucciones
function showInstructions() {
  console.log('\n📋 INSTRUCCIONES PARA INICIAR EL BACKEND:');
  console.log('\n1. Edita el archivo .env con tus credenciales:');
  console.log('   cd vegetarian_restaurant_backend');
  console.log('   # Edita el archivo .env con tus credenciales reales');
  
  console.log('\n2. Crea la base de datos PostgreSQL:');
  console.log('   psql -U postgres -c "CREATE DATABASE menta_restobar_db;"');
  
  console.log('\n3. Ejecuta las migraciones de la base de datos:');
  console.log('   psql -U postgres -d menta_restobar_db -f create_mesa_tables.sql');
  
  console.log('\n4. Instala las dependencias:');
  console.log('   cd vegetarian_restaurant_backend');
  console.log('   npm install');
  
  console.log('\n5. Inicia el servidor:');
  console.log('   npm start');
  
  console.log('\n6. Verifica que todo funcione:');
  console.log('   node check_backend_startup.js');
  
  console.log('\n💡 O ejecuta el script automático:');
  console.log('   ./install_backend.sh');
}

// Función para mostrar información del sistema
function showSystemInfo() {
  console.log('\n📊 INFORMACIÓN DEL SISTEMA:');
  
  try {
    const os = require('os');
    console.log(`🖥️  Sistema Operativo: ${os.platform()} ${os.release()}`);
    console.log(`💾 Memoria Total: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
    console.log(`📁 Directorio Actual: ${process.cwd()}`);
  } catch (error) {
    console.log('⚠️  No se pudo obtener información del sistema');
  }
}

// Ejecutar configuración
async function setupBackend() {
  console.log('🚀 INICIANDO CONFIGURACIÓN DEL BACKEND...\n');
  
  // Mostrar información del sistema
  showSystemInfo();
  
  // 1. Verificar Node.js
  const nodeOk = checkNodeJS();
  
  // 2. Verificar PostgreSQL
  const pgOk = checkPostgreSQL();
  
  // 3. Crear archivo .env
  createEnvFile();
  
  // 4. Verificar dependencias
  const depsOk = checkDependencies();
  
  // 5. Crear script de instalación
  createInstallScript();
  
  // 6. Mostrar instrucciones
  showInstructions();
  
  // Resumen final
  console.log('\n📋 RESUMEN DE CONFIGURACIÓN:');
  console.log(`✅ Node.js: ${nodeOk ? 'OK' : 'FALTA'}`);
  console.log(`✅ PostgreSQL: ${pgOk ? 'OK' : 'FALTA'}`);
  console.log(`✅ Dependencias: ${depsOk ? 'OK' : 'FALTA'}`);
  console.log('✅ Archivo .env: CREADO');
  console.log('✅ Script de instalación: CREADO');
  
  if (nodeOk && pgOk && depsOk) {
    console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE');
    console.log('💡 Ejecuta "node check_backend_startup.js" para verificar todo');
  } else {
    console.log('\n⚠️  Algunos problemas detectados');
    console.log('💡 Revisa los errores arriba y completa la configuración manual');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupBackend().catch(console.error);
}

module.exports = { setupBackend }; 