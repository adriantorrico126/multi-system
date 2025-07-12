console.log('=== INICIANDO SERVER.JS ===');
const app = require('./app');
console.log('app importado correctamente');
const envConfig = require('./config/envConfig');
console.log('envConfig importado correctamente');
// const db = require('./config/database'); // Ya se inicializa en database.js y se prueba en app.js healthcheck

const PORT = envConfig.PORT;

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Entorno: ${envConfig.NODE_ENV}`);
  console.log(`Prefijo de API: ${envConfig.API_PREFIX}`);
  // La conexión a la base de datos ya se intenta/verifica al importar `database.js`
  // y a través del healthcheck en `app.js`.
  // Si se necesita una lógica de conexión más explícita aquí, se puede agregar.
});

// Manejo de cierre ordenado del servidor
const gracefulShutdown = (signal) => {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor HTTP...`);
  server.close(async () => {
    console.log('Servidor HTTP cerrado.');
    // Aquí se podrían cerrar otras conexiones, como la de la base de datos si el pool no lo hace automáticamente.
    // Sin embargo, el pool de `pg` generalmente maneja sus conexiones.
    // Si se expusiera el pool directamente desde database.js, se podría llamar a pool.end() aquí.
    // Ejemplo:
    // if (db.pool && typeof db.pool.end === 'function') {
    //   try {
    //     await db.pool.end();
    //     console.log('Pool de base de datos cerrado.');
    //   } catch (err) {
    //     console.error('Error cerrando el pool de la base de datos:', err);
    //   }
    // }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Señal de terminación estándar
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C

module.exports = server; // Exportar por si se necesita para pruebas de integración del servidor mismo.
