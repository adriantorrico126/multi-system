const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'sistempos',
  password: 'TU_CONTRASEÑA_AQUI', // Reemplaza por tu contraseña real
  port: 5432,
});

client.connect()
  .then(() => {
    console.log('¡Conexión exitosa a PostgreSQL desde Node.js!');
    return client.end();
  })
  .catch(err => {
    console.error('Error de conexión:', err.message);
  }); 