
// check_db_connection.js
console.log('--- INICIANDO SCRIPT DE VERIFICACIÓN DE CONEXIÓN ---');

// 1. Cargar variables de entorno
require('dotenv').config();

// 2. Importar la configuración del pool desde tu archivo existente
const { pool } = require('./src/config/database');

// Función principal asíncrona para poder usar await
async function testConnection() {
  console.log('Variables de entorno cargadas:');
  console.log(`DB_USER: ${process.env.DB_USER}`);
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? 'Definida (oculta)' : 'NO Definida'}`);
  console.log('----------------------------------------------------');

  let client;
  try {
    console.log('Intentando obtener un cliente del pool...');
    // Intentar conectar con un timeout para evitar que se cuelgue indefinidamente
    client = await pool.connect();
    console.log('✅ ¡Conexión exitosa! El cliente ha sido obtenido del pool.');

    console.log('Realizando una consulta de prueba (SELECT NOW())...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ ¡Consulta de prueba exitosa! Respuesta de la BD:', result.rows[0]);

  } catch (error) {
    console.error('❌❌❌ ERROR DURANTE LA CONEXIÓN O CONSULTA ❌❌❌');
    console.error('El error completo es:');
    console.error(error); // Imprimimos el objeto de error COMPLETO
    console.error('----------------------------------------------------');
    console.error('ANÁLISIS DEL ERROR:');
    console.error(`- Código de Error: ${error.code}`);
    console.error(`- Mensaje: ${error.message}`);

  } finally {
    // 4. Asegurarse de cerrar la conexión
    if (client) {
      client.release();
      console.log('Cliente liberado de vuelta al pool.');
    }
    await pool.end();
    console.log('Pool de conexiones cerrado. Script finalizado.');
  }
}

// Ejecutar la función
testConnection();
