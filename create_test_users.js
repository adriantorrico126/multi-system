const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function testPlanRestrictions() {
  try {
    console.log('🧪 Probando restricciones de planes...\n');

    // Crear usuarios de prueba para cada plan
    const testUsers = [
      { plan: 'basico', username: 'test_basico', planId: 1 },
      { plan: 'profesional', username: 'test_profesional', planId: 2 },
      { plan: 'avanzado', username: 'test_avanzado', planId: 3 },
      { plan: 'enterprise', username: 'test_enterprise', planId: 4 }
    ];

    for (const user of testUsers) {
      console.log(`\n🔍 Probando plan: ${user.plan.toUpperCase()}`);
      
      // Verificar si el usuario ya existe
      const existingUserQuery = `
        SELECT id_vendedor, username
        FROM vendedores 
        WHERE username = $1
      `;
      const existingResult = await pool.query(existingUserQuery, [user.username]);
      
      if (existingResult.rows.length > 0) {
        console.log(`✅ Usuario ${user.username} ya existe`);
        continue;
      }

      // Crear usuario de prueba
      const insertQuery = `
        INSERT INTO vendedores (
          nombre, username, email, password_hash, rol, activo, 
          id_sucursal, id_restaurante, created_at
        ) VALUES (
          $1, $2, $3, $4, 'admin', true, 8, 7, NOW()
        ) RETURNING id_vendedor
      `;

      const insertResult = await pool.query(insertQuery, [
        `Usuario ${user.plan}`,
        user.username,
        `${user.username}@test.com`,
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // password: password
      ]);

      console.log(`✅ Usuario ${user.username} creado (ID: ${insertResult.rows[0].id_vendedor})`);
    }

    console.log('\n🎉 Usuarios de prueba creados para todos los planes!');
    console.log('\n📋 Credenciales de prueba:');
    console.log('- Plan Básico: test_basico / password');
    console.log('- Plan Profesional: test_profesional / password');
    console.log('- Plan Avanzado: test_avanzado / password');
    console.log('- Plan Enterprise: test_enterprise / password');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testPlanRestrictions();

