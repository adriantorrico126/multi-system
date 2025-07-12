const db = require('./src/config/database');

async function checkRole() {
  try {
    const { rows } = await db.query('SELECT username, rol FROM vendedores WHERE username = $1', ['daniela.torrico']);
    console.log('Usuario daniela.torrico:', rows[0]);
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRole(); 