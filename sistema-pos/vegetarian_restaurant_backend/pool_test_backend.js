const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistempos',
  password: 'TU_CONTRASEÑA_AQUI', // Reemplaza por tu contraseña real
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.connect()
  .then((client) => {
    console.log('¡Conexión exitosa a PostgreSQL usando Pool en archivo aislado!');
    client.release();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
    process.exit(1);
  }); 