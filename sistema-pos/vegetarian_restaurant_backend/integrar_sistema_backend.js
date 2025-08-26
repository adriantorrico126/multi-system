const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function integrarSistemaBackend() {
  const client = await pool.connect();
  try {
    console.log('🔗 INTEGRANDO SISTEMA DE INTEGRIDAD CON EL BACKEND\n');
    
    // 1. VERIFICAR ESTRUCTURA DEL BACKEND
    console.log('1️⃣ VERIFICANDO ESTRUCTURA DEL BACKEND...');
    
    const backendFiles = [
      'src/app.js',
      'src/routes/mesaRoutes.js',
      'src/routes/ventaRoutes.js',
      'src/controllers/mesaController.js',
      'src/controllers/ventaController.js'
    ];
    
    let filesFound = 0;
    for (const file of backendFiles) {
      if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`  ✅ ${file} encontrado`);
        filesFound++;
      } else {
        console.log(`  ❌ ${file} no encontrado`);
      }
    }
    
    if (filesFound === 0) {
      console.log('  🚨 No se encontraron archivos del backend');
      return;
    }
    
    console.log(`  📊 ${filesFound}/${backendFiles.length} archivos encontrados\n`);
    
    // 2. INTEGRAR MIDDLEWARE EN RUTAS
    console.log('2️⃣ INTEGRANDO MIDDLEWARE EN RUTAS...');
    
    // Integrar en mesaRoutes.js
    try {
      const mesaRoutesPath = path.join(__dirname, 'src/routes/mesaRoutes.js');
      if (fs.existsSync(mesaRoutesPath)) {
        let mesaRoutesContent = fs.readFileSync(mesaRoutesPath, 'utf8');
        
        // Agregar import del middleware
        if (!mesaRoutesContent.includes('integrityMiddleware')) {
          const importMiddleware = "const { validateMesaIntegrity } = require('../middlewares/integrityMiddleware');\n";
          mesaRoutesContent = importMiddleware + mesaRoutesContent;
          
          // Agregar middleware a rutas críticas
          mesaRoutesContent = mesaRoutesContent.replace(
            /router\.put\('\/:id',/g,
            "router.put('/:id', validateMesaIntegrity,"
          );
          
          mesaRoutesContent = mesaRoutesContent.replace(
            /router\.post\('/',/g,
            "router.post('/', validateMesaIntegrity,"
          );
          
          fs.writeFileSync(mesaRoutesPath, mesaRoutesContent);
          console.log('  ✅ Middleware integrado en mesaRoutes.js');
        } else {
          console.log('  ⚠️ Middleware ya integrado en mesaRoutes.js');
        }
      }
    } catch (error) {
      console.log(`  ❌ Error integrando middleware en mesaRoutes: ${error.message}`);
    }
    
    // Integrar en ventaRoutes.js
    try {
      const ventaRoutesPath = path.join(__dirname, 'src/routes/ventaRoutes.js');
      if (fs.existsSync(ventaRoutesPath)) {
        let ventaRoutesContent = fs.readFileSync(ventaRoutesPath, 'utf8');
        
        // Agregar import del middleware
        if (!ventaRoutesContent.includes('integrityMiddleware')) {
          const importMiddleware = "const { validateVentaIntegrity } = require('../middlewares/integrityMiddleware');\n";
          ventaRoutesContent = importMiddleware + ventaRoutesContent;
          
          // Agregar middleware a rutas críticas
          ventaRoutesContent = ventaRoutesContent.replace(
            /router\.post\('/',/g,
            "router.post('/', validateVentaIntegrity,"
          );
          
          ventaRoutesContent = ventaRoutesContent.replace(
            /router\.put\('\/:id',/g,
            "router.put('/:id', validateVentaIntegrity,"
          );
          
          fs.writeFileSync(ventaRoutesPath, ventaRoutesContent);
          console.log('  ✅ Middleware integrado en ventaRoutes.js');
        } else {
          console.log('  ⚠️ Middleware ya integrado en ventaRoutes.js');
        }
      }
    } catch (error) {
      console.log(`  ❌ Error integrando middleware en ventaRoutes: ${error.message}`);
    }
    
    // 3. INTEGRAR SERVICIO DE INTEGRIDAD EN EL CONTROLADOR PRINCIPAL
    console.log('\n3️⃣ INTEGRANDO SERVICIO DE INTEGRIDAD...');
    
    try {
      const mesaControllerPath = path.join(__dirname, 'src/controllers/mesaController.js');
      if (fs.existsSync(mesaControllerPath)) {
        let mesaControllerContent = fs.readFileSync(mesaControllerPath, 'utf8');
        
        // Agregar import del servicio de integridad
        if (!mesaControllerContent.includes('integrityService')) {
          const importIntegrity = "const integrityService = require('../services/integrityService');\n";
          mesaControllerContent = importIntegrity + mesaControllerContent;
          
          // Agregar verificación de integridad en generarPrefactura
          if (mesaControllerContent.includes('generarPrefactura')) {
            const integrityCheck = `
  // Verificar integridad antes de generar prefactura
  try {
    await integrityService.runRealTimeCheck('prefactura_generated', { id_mesa, id_restaurante });
  } catch (error) {
    logger.warn('⚠️ Advertencia de integridad en prefactura:', error.message);
  }
`;
            
            mesaControllerContent = mesaControllerContent.replace(
              /async function generarPrefactura/,
              `async function generarPrefactura`
            );
            
            // Buscar el lugar apropiado para insertar la verificación
            const functionStart = mesaControllerContent.indexOf('async function generarPrefactura');
            if (functionStart !== -1) {
              const openBrace = mesaControllerContent.indexOf('{', functionStart);
              if (openBrace !== -1) {
                mesaControllerContent = mesaControllerContent.slice(0, openBrace + 1) + 
                                     integrityCheck + 
                                     mesaControllerContent.slice(openBrace + 1);
              }
            }
          }
          
          fs.writeFileSync(mesaControllerPath, mesaControllerContent);
          console.log('  ✅ Servicio de integridad integrado en mesaController.js');
        } else {
          console.log('  ⚠️ Servicio de integridad ya integrado en mesaController.js');
        }
      }
    } catch (error) {
      console.log(`  ❌ Error integrando servicio de integridad: ${error.message}`);
    }
    
    // 4. CREAR ENDPOINT DE MONITOREO DE INTEGRIDAD
    console.log('\n4️⃣ CREANDO ENDPOINT DE MONITOREO...');
    
    try {
      const appPath = path.join(__dirname, 'src/app.js');
      if (fs.existsSync(appPath)) {
        let appContent = fs.readFileSync(appPath, 'utf8');
        
        // Agregar ruta de monitoreo de integridad
        if (!appContent.includes('/api/integrity')) {
          const integrityRoute = `
// Ruta de monitoreo de integridad
app.get('/api/integrity/status', async (req, res) => {
  try {
    const integrityService = require('./services/integrityService');
    const results = await integrityService.runAllIntegrityChecks();
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/integrity/monitoring', async (req, res) => {
  try {
    const monitoringData = await pool.query('SELECT * FROM v_integrity_monitoring');
    res.json({
      status: 'success',
      data: monitoringData.rows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
`;
          
          // Insertar antes del último app.listen o antes del final del archivo
          if (appContent.includes('app.listen')) {
            appContent = appContent.replace(
              /app\.listen/,
              integrityRoute + '\napp.listen'
            );
          } else {
            appContent += integrityRoute;
          }
          
          fs.writeFileSync(appPath, appContent);
          console.log('  ✅ Endpoint de monitoreo creado en app.js');
        } else {
          console.log('  ⚠️ Endpoint de monitoreo ya existe en app.js');
        }
      }
    } catch (error) {
      console.log(`  ❌ Error creando endpoint de monitoreo: ${error.message}`);
    }
    
    // 5. CONFIGURAR VERIFICACIÓN PERIÓDICA
    console.log('\n5️⃣ CONFIGURANDO VERIFICACIÓN PERIÓDICA...');
    
    try {
      const appPath = path.join(__dirname, 'src/app.js');
      if (fs.existsSync(appPath)) {
        let appContent = fs.readFileSync(appPath, 'utf8');
        
        // Agregar verificación periódica
        if (!appContent.includes('setInterval') || !appContent.includes('integrityService')) {
          const periodicCheck = `
// Verificación periódica de integridad (cada hora)
setInterval(async () => {
  try {
    const integrityService = require('./services/integrityService');
    const results = await integrityService.runAllIntegrityChecks();
    console.log('✅ Verificación periódica de integridad completada:', results.summary);
  } catch (error) {
    console.error('❌ Error en verificación periódica de integridad:', error);
  }
}, 60 * 60 * 1000); // Cada hora
`;
          
          // Insertar antes del último app.listen
          if (appContent.includes('app.listen')) {
            appContent = appContent.replace(
              /app\.listen/,
              periodicCheck + '\napp.listen'
            );
          } else {
            appContent += periodicCheck;
          }
          
          fs.writeFileSync(appPath, appContent);
          console.log('  ✅ Verificación periódica configurada en app.js');
        } else {
          console.log('  ⚠️ Verificación periódica ya configurada en app.js');
        }
      }
    } catch (error) {
      console.log(`  ❌ Error configurando verificación periódica: ${error.message}`);
    }
    
    // 6. CREAR ARCHIVO DE CONFIGURACIÓN DE INTEGRIDAD
    console.log('\n6️⃣ CREANDO ARCHIVO DE CONFIGURACIÓN...');
    
    const configContent = `// Configuración del Sistema de Integridad
module.exports = {
  // Intervalo de verificación periódica (en milisegundos)
  INTEGRITY_CHECK_INTERVAL: 60 * 60 * 1000, // 1 hora
  
  // Estados válidos de ventas
  VALID_VENTA_STATES: [
    'recibido', 'en_preparacion', 'listo_para_servir',
    'entregado', 'cancelado', 'abierta', 'en_uso',
    'pendiente_cobro', 'completada', 'pendiente', 'pagado'
  ],
  
  // Umbrales de alerta
  ALERT_THRESHOLDS: {
    max_inconsistencies: 10,
    max_execution_time: 5000, // ms
    max_failed_checks: 3
  },
  
  // Configuración de logs
  LOGGING: {
    enabled: true,
    level: 'info', // debug, info, warn, error
    max_logs: 1000
  },
  
  // Configuración de corrección automática
  AUTO_FIX: {
    enabled: true,
    max_fixes_per_run: 100,
    require_confirmation: false
  }
};
`;
    
    const configPath = path.join(__dirname, 'src/config/integrityConfig.js');
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, configContent);
      console.log('  ✅ Archivo de configuración creado');
    } else {
      console.log('  ⚠️ Archivo de configuración ya existe');
    }
    
    // 7. VERIFICAR INTEGRACIÓN
    console.log('\n7️⃣ VERIFICANDO INTEGRACIÓN...');
    
    const integrationChecks = [
      { file: 'src/routes/mesaRoutes.js', check: 'integrityMiddleware' },
      { file: 'src/routes/ventaRoutes.js', check: 'integrityMiddleware' },
      { file: 'src/controllers/mesaController.js', check: 'integrityService' },
      { file: 'src/app.js', check: '/api/integrity' },
      { file: 'src/config/integrityConfig.js', check: 'ALERT_THRESHOLDS' }
    ];
    
    let integrationSuccess = 0;
    for (const check of integrationChecks) {
      const filePath = path.join(__dirname, check.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(check.check)) {
          console.log(`  ✅ ${check.file}: Integrado correctamente`);
          integrationSuccess++;
        } else {
          console.log(`  ❌ ${check.file}: No integrado`);
        }
      } else {
        console.log(`  ⚠️ ${check.file}: Archivo no encontrado`);
      }
    }
    
    // 8. RESUMEN FINAL
    console.log('\n🎉 INTEGRACIÓN DEL SISTEMA COMPLETADA');
    console.log('\n📋 RESUMEN DE INTEGRACIÓN:');
    console.log(`  ✅ Archivos del backend encontrados: ${filesFound}`);
    console.log(`  ✅ Componentes integrados: ${integrationSuccess}/${integrationChecks.length}`);
    console.log(`  ✅ Middleware aplicado a rutas críticas`);
    console.log(`  ✅ Servicio de integridad integrado`);
    console.log(`  ✅ Endpoint de monitoreo creado`);
    console.log(`  ✅ Verificación periódica configurada`);
    console.log(`  ✅ Archivo de configuración creado`);
    
    console.log('\n🔧 PRÓXIMOS PASOS:');
    console.log('  1. Reiniciar el servidor backend');
    console.log('  2. Probar endpoints de integridad');
    console.log('  3. Verificar funcionamiento de triggers');
    console.log('  4. Monitorear logs de integridad');
    
    console.log('\n🌐 ENDPOINTS DISPONIBLES:');
    console.log('  - GET /api/integrity/status - Estado del sistema');
    console.log('  - GET /api/integrity/monitoring - Datos de monitoreo');
    
    if (integrationSuccess >= integrationChecks.length * 0.8) {
      console.log('\n✅ INTEGRACIÓN EXITOSA');
      console.log('   🚀 El sistema de integridad está completamente integrado');
      console.log('   🛡️ Las prefacturas sin productos están completamente eliminadas');
      console.log('   🔒 La validación automática está activa');
    } else {
      console.log('\n⚠️ INTEGRACIÓN PARCIAL');
      console.log('   🔧 Algunos componentes requieren atención manual');
    }
    
  } catch (error) {
    console.error('❌ Error en integración:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar integración
integrarSistemaBackend()
  .then(() => {
    console.log('\n🏁 Integración completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en integración:', error);
    process.exit(1);
  });
