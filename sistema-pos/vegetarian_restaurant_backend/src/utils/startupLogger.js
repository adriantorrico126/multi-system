const logger = require('../config/logger');

class StartupLogger {
  constructor() {
    this.startTime = Date.now();
    this.steps = [];
  }

  logStep(step, status = 'info') {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    const stepInfo = {
      step,
      status,
      timestamp,
      elapsed: `${elapsed}ms`
    };
    
    this.steps.push(stepInfo);
    
    const emoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '🔧';
    const statusText = status === 'success' ? 'COMPLETADO' : status === 'error' ? 'ERROR' : 'INICIANDO';
    
    console.log(`${emoji} ${step} - ${statusText} (${elapsed}ms)`);
    
    if (status === 'error') {
      logger.error(`Startup Error: ${step}`);
    } else if (status === 'success') {
      logger.info(`Startup Success: ${step}`);
    } else {
      logger.debug(`Startup Step: ${step}`);
    }
  }

  logSection(section) {
    console.log(`\n📋 === ${section.toUpperCase()} ===`);
    logger.info(`Startup Section: ${section}`);
  }

  getSummary() {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.steps.filter(s => s.status === 'success').length;
    const errorCount = this.steps.filter(s => s.status === 'error').length;
    
    console.log(`\n📊 RESUMEN DE INICIALIZACIÓN:`);
    console.log(`   ⏱️  Tiempo total: ${totalTime}ms`);
    console.log(`   ✅ Pasos exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📋 Total de pasos: ${this.steps.length}`);
    
    if (errorCount === 0) {
      console.log(`   🎉 ¡Servidor iniciado correctamente!`);
    } else {
      console.log(`   ⚠️  Se encontraron ${errorCount} errores durante la inicialización`);
    }
    
    return {
      totalTime,
      successCount,
      errorCount,
      steps: this.steps
    };
  }
}

module.exports = StartupLogger; 