const db = require('./src/config/database');

async function checkProducts() {
  try {
    console.log('🔍 Verificando productos en la base de datos...');
    
    // Verificar todos los productos
    const result = await db.query('SELECT * FROM productos ORDER BY id_producto');
    
    console.log('\n📊 Productos encontrados:');
    console.log('Total de productos:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('❌ No hay productos registrados en la base de datos.');
      console.log('💡 Insertando productos de ejemplo...');
      
      // Insertar productos de ejemplo
      const insertResult = await db.query(`
        INSERT INTO productos (nombre, precio, id_categoria, stock_actual, activo, id_restaurante) VALUES 
        ('Hamburguesa Vegetariana', 25.00, 1, 10, true, 1),
        ('Pizza Margherita', 30.00, 1, 8, true, 1),
        ('Ensalada César', 15.00, 2, 15, true, 1),
        ('Sopa de Verduras', 12.00, 2, 20, true, 1),
        ('Refresco Natural', 8.00, 3, 25, true, 1)
        ON CONFLICT (id_restaurante, nombre) DO NOTHING
        RETURNING *
      `);
      
      console.log('✅ Productos insertados:', insertResult.rows);
    } else {
      console.log('\n📋 Lista de productos:');
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id_producto}, Nombre: "${row.nombre}", Precio: Bs ${row.precio}, Categoría: ${row.id_categoria}, Stock: ${row.stock_actual}, Activo: ${row.activo}`);
      });
    }
    
    // Verificar categorías
    console.log('\n📂 Categorías disponibles:');
    const categoriasResult = await db.query('SELECT * FROM categorias WHERE id_restaurante = 1 ORDER BY id_categoria');
    categoriasResult.rows.forEach((cat, index) => {
      console.log(`${index + 1}. ID: ${cat.id_categoria}, Nombre: "${cat.nombre}", Activo: ${cat.activo}`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando productos:', error);
  } finally {
    await db.pool.end();
  }
}

checkProducts(); 