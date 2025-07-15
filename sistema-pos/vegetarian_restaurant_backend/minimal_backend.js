require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

// Configuración mínima del pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistempos',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

// Probar conexión al pool
pool.connect()
  .then((client) => {
    console.log('¡Conexión exitosa a PostgreSQL desde minimal_backend.js!');
    client.release();
  })
  .catch((err) => {
    console.error('❌ Error al conectar a PostgreSQL:', err);
  });

const app = express();
app.get('/', (req, res) => res.send('Backend mínimo funcionando'));

app.listen(3000, () => {
  console.log('Servidor mínimo corriendo en http://localhost:3000');
}); 