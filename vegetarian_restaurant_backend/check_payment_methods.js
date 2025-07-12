const db = require('./src/config/database');

async function checkPaymentMethods() {
  try {
    console.log('🔍 Verificando métodos de pago en la base de datos...');
    
    // Verificar todos los métodos de pago
    const result = await db.query('SELECT * FROM metodos_pago ORDER BY id_restaurante, descripcion');
    
    console.log('\n📊 Métodos de pago encontrados:');
    console.log('Total de métodos:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('❌ No hay métodos de pago registrados en la base de datos.');
      console.log('💡 Insertando métodos de pago por defecto...');
      
      // Insertar métodos de pago por defecto
      const insertResult = await db.query(`
        INSERT INTO metodos_pago (descripcion, id_restaurante, activo) VALUES 
        ('Efectivo', 1, true),
        ('Tarjeta de Crédito', 1, true),
        ('Tarjeta de Débito', 1, true),
        ('Transferencia', 1, true),
        ('Pago Móvil', 1, true)
        ON CONFLICT (id_restaurante, descripcion) DO NOTHING
        RETURNING *
      `);
      
      console.log('✅ Métodos de pago insertados:', insertResult.rows);
    } else {
      console.log('\n📋 Lista de métodos de pago:');
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id_pago}, Descripción: "${row.descripcion}", Restaurante: ${row.id_restaurante}, Activo: ${row.activo}`);
      });
    }
    
    // Verificar por restaurante específico
    console.log('\n🔍 Verificando métodos de pago por restaurante:');
    const restaurants = await db.query('SELECT id_restaurante, nombre FROM restaurantes ORDER BY id_restaurante');
    
    for (const restaurant of restaurants.rows) {
      const methodsResult = await db.query(
        'SELECT descripcion FROM metodos_pago WHERE id_restaurante = $1 AND activo = true ORDER BY descripcion',
        [restaurant.id_restaurante]
      );
      
      console.log(`\n🏪 Restaurante ${restaurant.id_restaurante} (${restaurant.nombre}):`);
      if (methodsResult.rows.length === 0) {
        console.log('  ❌ No hay métodos de pago activos');
      } else {
        methodsResult.rows.forEach((method, index) => {
          console.log(`  ${index + 1}. ${method.descripcion}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error verificando métodos de pago:', error);
  } finally {
    await db.pool.end();
  }
}

checkPaymentMethods(); 