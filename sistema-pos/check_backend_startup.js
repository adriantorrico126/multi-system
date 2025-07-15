const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL BACKEND...\n');

// Función para verificar archivo .env
function checkEnvFile() {
  console.log('📄 Verificando archivo .env...');
  
  const envPath = path.join(__dirname, 'vegetarian_restaurant_backend', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ Archivo .env no encontrado');
    console.log('💡 Ejecuta: node setup_backend.js');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`⚠️  Variables faltantes en .env: ${missingVars.join(', ')}`);
    return false;
  }
  
  console.log('✅ Archivo .env configurado correctamente');
  return true;
}

// Función para verificar dependencias
function checkDependencies() {
  console.log('\n📦 Verificando dependencias...');
  
  const nodeModulesPath = path.join(__dirname, 'vegetarian_restaurant_backend', 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('❌ node_modules no encontrado');
    console.log('💡 Ejecuta: cd vegetarian_restaurant_backend && npm install');
    return false;
  }
  
  console.log('✅ Dependencias instaladas');
  return true;
}

// Función para verificar base de datos
async function checkDatabase() {
  console.log('\n🗄️  Verificando conexión a la base de datos...');
  
  try {
    // Cargar configuración
    const envPath = path.join(__dirname, 'vegetarian_restaurant_backend', '.env');
    if (!fs.existsSync(envPath)) {
      console.log('❌ No se puede verificar BD sin archivo .env');
      return false;
    }
    
    // Leer variables de entorno
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    // Verificar conexión usando psql
    const connectionString = `postgresql://${envVars.DB_USER}:${envVars.DB_PASSWORD}@${envVars.DB_HOST}:${envVars.DB_PORT}/${envVars.DB_NAME}`;
    
    try {
      execSync(`psql "${connectionString}" -c "SELECT version();"`, { stdio: 'pipe' });
      console.log('✅ Conexión a PostgreSQL exitosa');
      
      // Verificar tablas principales
      const tables = ['categorias', 'productos', 'vendedores', 'ventas'];
      for (const table of tables) {
        try {
          execSync(`psql "${connectionString}" -c "SELECT COUNT(*) FROM ${table};"`, { stdio: 'pipe' });
          console.log(`✅ Tabla ${table} existe`);
        } catch (error) {
          console.log(`⚠️  Tabla ${table} no existe o está vacía`);
        }
      }
      
      return true;
    } catch (error) {
      console.log('❌ No se pudo conectar a la base de datos');
      console.log('💡 Verifica las credenciales en .env y que PostgreSQL esté ejecutándose');
      return false;
    }
  } catch (error) {
    console.log('❌ Error verificando base de datos:', error.message);
    return false;
  }
}

// Función para verificar puertos
function checkPorts() {
  console.log('\n🔌 Verificando puertos...');
  
  try {
    // Verificar puerto 3000 (backend por defecto)
    const netstat = execSync('netstat -an | findstr :3000', { encoding: 'utf8' });
    if (netstat.includes('LISTENING')) {
      console.log('⚠️  Puerto 3000 ya está en uso');
    } else {
      console.log('✅ Puerto 3000 disponible');
    }
    
    // Verificar puerto 5432 (PostgreSQL)
    const pgPort = execSync('netstat -an | findstr :5432', { encoding: 'utf8' });
    if (pgPort.includes('LISTENING')) {
      console.log('✅ Puerto 5432 (PostgreSQL) activo');
    } else {
      console.log('⚠️  Puerto 5432 no está en uso (PostgreSQL puede no estar ejecutándose)');
    }
    
    return true;
  } catch (error) {
    console.log('⚠️  No se pudo verificar puertos');
    return false;
  }
}

// Función para verificar archivos de migración
function checkMigrationFiles() {
  console.log('\n📋 Verificando archivos de migración...');
  
  const migrationFiles = [
    'create_mesa_tables.sql',
    'init_mesas.sql',
    'update_tipo_servicio_constraint.sql'
  ];
  
  let allExist = true;
  
  migrationFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} encontrado`);
    } else {
      console.log(`❌ ${file} no encontrado`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Función para verificar estructura del proyecto
function checkProjectStructure() {
  console.log('\n📁 Verificando estructura del proyecto...');
  
  const requiredDirs = [
    'vegetarian_restaurant_backend',
    'vegetarian_restaurant_backend/src',
    'vegetarian_restaurant_backend/src/config',
    'vegetarian_restaurant_backend/src/controllers',
    'vegetarian_restaurant_backend/src/models',
    'vegetarian_restaurant_backend/src/routes'
  ];
  
  let allExist = true;
  
  requiredDirs.forEach(dir => {
    if (fs.existsSync(path.join(__dirname, dir))) {
      console.log(`✅ ${dir} existe`);
    } else {
      console.log(`❌ ${dir} no existe`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Función para mostrar recomendaciones
function showRecommendations(checks) {
  console.log('\n💡 RECOMENDACIONES:');
  
  if (!checks.env) {
    console.log('• Ejecuta: node setup_backend.js');
  }
  
  if (!checks.deps) {
    console.log('• Ejecuta: cd vegetarian_restaurant_backend && npm install');
  }
  
  if (!checks.db) {
    console.log('• Verifica que PostgreSQL esté ejecutándose');
    console.log('• Crea la base de datos: CREATE DATABASE menta_restobar_db;');
    console.log('• Ejecuta las migraciones: psql -U postgres -d menta_restobar_db -f create_mesa_tables.sql');
  }
  
  if (!checks.migrations) {
    console.log('• Asegúrate de que los archivos SQL estén en la raíz del proyecto');
  }
  
  if (checks.env && checks.deps && checks.db && checks.migrations) {
    console.log('• Todo listo! Ejecuta: cd vegetarian_restaurant_backend && npm start');
  }
}

// Función principal
async function checkBackendStartup() {
  console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DEL BACKEND...\n');
  
  const checks = {
    env: checkEnvFile(),
    deps: checkDependencies(),
    db: await checkDatabase(),
    ports: checkPorts(),
    migrations: checkMigrationFiles(),
    structure: checkProjectStructure()
  };
  
  // Resumen
  console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
  console.log(`✅ Archivo .env: ${checks.env ? 'OK' : 'FALTA'}`);
  console.log(`✅ Dependencias: ${checks.deps ? 'OK' : 'FALTA'}`);
  console.log(`✅ Base de datos: ${checks.db ? 'OK' : 'FALTA'}`);
  console.log(`✅ Puertos: ${checks.ports ? 'OK' : 'FALTA'}`);
  console.log(`✅ Migraciones: ${checks.migrations ? 'OK' : 'FALTA'}`);
  console.log(`✅ Estructura: ${checks.structure ? 'OK' : 'FALTA'}`);
  
  const allOk = Object.values(checks).every(check => check);
  
  if (allOk) {
    console.log('\n🎉 ¡TODO LISTO! El backend está configurado correctamente');
    console.log('💡 Para iniciar: cd vegetarian_restaurant_backend && npm start');
  } else {
    console.log('\n⚠️  Se encontraron problemas en la configuración');
    showRecommendations(checks);
  }
  
  return allOk;
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkBackendStartup().catch(console.error);
}

module.exports = { checkBackendStartup }; 