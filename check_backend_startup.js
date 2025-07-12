const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL BACKEND...\n');

// Función para verificar configuración
function checkBackendConfig() {
  console.log('1. Verificando archivo .env...');
  const envPath = path.join(__dirname, 'vegetarian_restaurant_backend', '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env encontrado');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar variables importantes
    const hasJWT = envContent.includes('JWT_SECRET');
    const hasDB = envContent.includes('DB_PASSWORD');
    
    console.log('- JWT_SECRET configurado:', hasJWT);
    console.log('- DB_PASSWORD configurado:', hasDB);
    
    if (!hasJWT || !hasDB) {
      console.log('⚠️  Algunas variables importantes faltan en .env');
    }
  } else {
    console.log('❌ Archivo .env no encontrado');
  }
  
  console.log('\n2. Verificando package.json del backend...');
  const packagePath = path.join(__dirname, 'vegetarian_restaurant_backend', 'package.json');
  
  if (fs.existsSync(packagePath)) {
    console.log('✅ package.json encontrado');
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log(`📋 Versión: ${packageJson.version}`);
      console.log(`📦 Dependencias: ${Object.keys(packageJson.dependencies || {}).length}`);
    } catch (error) {
      console.log('❌ Error leyendo package.json:', error.message);
    }
  } else {
    console.log('❌ package.json no encontrado');
  }
  
  console.log('\n3. Verificando archivos de configuración...');
  const configFiles = [
    'src/config/database.js',
    'src/config/envConfig.js',
    'src/middlewares/authMiddleware.js',
    'src/controllers/mesaController.js',
    'src/routes/mesaRoutes.js'
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(__dirname, 'vegetarian_restaurant_backend', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - NO ENCONTRADO`);
    }
  });
  
  console.log('\n4. Verificando script SQL...');
  const sqlPath = path.join(__dirname, 'create_mesa_tables.sql');
  if (fs.existsSync(sqlPath)) {
    console.log('✅ Script SQL encontrado');
  } else {
    console.log('❌ Script SQL no encontrado');
  }
}

// Función para mostrar instrucciones
function showInstructions() {
  console.log('\n📋 INSTRUCCIONES PARA INICIAR EL BACKEND:');
  console.log('\n1. Ejecuta las migraciones de la base de datos:');
  console.log('   psql -U postgres -d menta_restobar_db -f create_mesa_tables.sql');
  
  console.log('\n2. Instala las dependencias:');
  console.log('   cd vegetarian_restaurant_backend');
  console.log('   npm install');
  
  console.log('\n3. Inicia el servidor:');
  console.log('   npm start');
  
  console.log('\n4. Verifica que el backend esté corriendo:');
  console.log('   curl http://localhost:3000/api/v1/test');
}

// Ejecutar verificación
async function checkBackendStartup() {
  console.log('🚀 INICIANDO VERIFICACIÓN DEL BACKEND...\n');
  
  checkBackendConfig();
  showInstructions();
  
  console.log('\n✅ VERIFICACIÓN COMPLETADA');
  console.log('💡 Sigue las instrucciones arriba para iniciar el backend');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkBackendStartup().catch(console.error);
}

module.exports = { checkBackendStartup }; 