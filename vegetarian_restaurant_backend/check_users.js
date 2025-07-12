const db = require('./src/config/database');

async function checkUsers() {
  try {
    console.log('=== VERIFICANDO USUARIOS EN LA BD ===');
    
    // Verificar usuarios en la tabla vendedores
    const vendedoresQuery = `
      SELECT 
        id_vendedor,
        username,
        nombre,
        rol,
        activo
      FROM vendedores 
      ORDER BY id_vendedor;
    `;
    
    const { rows: vendedores } = await db.query(vendedoresQuery);
    console.log('\n1. USUARIOS EN TABLA VENDEDORES:');
    console.table(vendedores);
    
    // Verificar si hay algún usuario con rol 'cocinero'
    const cocinerosQuery = `
      SELECT 
        id_vendedor,
        username,
        nombre,
        rol,
        activo
      FROM vendedores 
      WHERE rol = 'cocinero'
      ORDER BY id_vendedor;
    `;
    
    const { rows: cocineros } = await db.query(cocinerosQuery);
    console.log('\n2. USUARIOS CON ROL "COCINERO":');
    if (cocineros.length > 0) {
      console.table(cocineros);
    } else {
      console.log('❌ No hay usuarios con rol "cocinero"');
    }
    
    // Verificar todos los roles disponibles
    const rolesQuery = `
      SELECT 
        rol,
        COUNT(*) as cantidad
      FROM vendedores 
      GROUP BY rol
      ORDER BY rol;
    `;
    
    const { rows: roles } = await db.query(rolesQuery);
    console.log('\n3. DISTRIBUCIÓN DE ROLES:');
    console.table(roles);
    
    // Verificar usuarios activos
    const activosQuery = `
      SELECT 
        username,
        nombre,
        rol,
        activo
      FROM vendedores 
      WHERE activo = true
      ORDER BY rol, username;
    `;
    
    const { rows: activos } = await db.query(activosQuery);
    console.log('\n4. USUARIOS ACTIVOS:');
    console.table(activos);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

checkUsers(); 