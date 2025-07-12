const bcrypt = require('bcrypt');
const db = require('./vegetarian_restaurant_backend/src/config/database');

async function checkAdminPassword() {
  try {
    console.log('🔍 Verificando contraseña del usuario admin...\n');
    
    // Obtener el hash de la contraseña del usuario admin
    const { rows } = await db.query(
      'SELECT username, password_hash FROM vendedores WHERE username = $1',
      ['admin']
    );
    
    if (rows.length === 0) {
      console.log('❌ Usuario admin no encontrado');
      return;
    }
    
    const adminUser = rows[0];
    console.log('Usuario admin encontrado');
    console.log('Hash de contraseña:', adminUser.password_hash);
    console.log('');
    
    // Probar diferentes contraseñas comunes
    const passwords = [
      'admin',
      'admin123',
      'password',
      '123456',
      'admin1234',
      'administrador',
      'root',
      'user',
      'test',
      'demo'
    ];
    
    console.log('Probando contraseñas...');
    for (const password of passwords) {
      try {
        const isValid = await bcrypt.compare(password, adminUser.password_hash);
        if (isValid) {
          console.log(`✅ Contraseña correcta: ${password}`);
          return;
        } else {
          console.log(`❌ Contraseña incorrecta: ${password}`);
        }
      } catch (error) {
        console.log(`❌ Error probando: ${password}`);
      }
    }
    
    console.log('\n❌ No se encontró la contraseña correcta');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAdminPassword(); 