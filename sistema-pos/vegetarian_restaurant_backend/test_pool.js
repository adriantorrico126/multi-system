const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistempos',
  password: '69512310Anacleta', // Reemplaza por tu contraseña real
  port: 5432,
  // options: '-c timezone=America/Caracas', // Puedes comentar esta línea si da problemas
});

pool.connect()
  .then((client) => {
    console.log('¡Conexión exitosa a PostgreSQL usando Pool!');
    client.release();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error de conexión con Pool:', err.message);
    process.exit(1);
  }); 