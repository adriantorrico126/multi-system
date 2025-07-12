// Este es el punto de entrada principal de la aplicación.
// Su única responsabilidad es iniciar el servidor.

// Importante: envConfig debe cargarse antes que cualquier otro módulo
// que dependa de variables de entorno, pero app.js ya lo hace.
// Si server.js o app.js no importaran envConfig indirectamente,
// se necesitaría aquí: require('./src/config/envConfig');

console.log('=== INICIANDO BACKEND ===');
require('dotenv').config();
console.log('dotenv configurado');

const server = require('./src/server');
console.log('server importado correctamente');

// Manejador global de promesas no capturadas
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa no capturada:', reason);
  console.error('Stack trace:', reason.stack);
});

process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  console.error('Stack trace:', error.stack);
});

// El servidor ya se inicia dentro de server.js
// y server.js ya imprime los mensajes de log al iniciar.

// Podríamos añadir un log aquí para indicar que index.js se ha ejecutado, si se desea.
// console.log('Ejecutando index.js - Iniciando aplicación...');

// Exportar el servidor puede ser útil si alguna vez se necesita
// requerir la aplicación desde otro script de nivel superior (poco común para el index.js principal).
module.exports = server;
