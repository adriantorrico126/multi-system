const db = require('./src/config/database');

async function createTestProducts() {
  try {
    console.log('📝 Creando productos de prueba...');
    
    // Verificar que existan categorías
    const categoriasResult = await db.query('SELECT id_categoria, nombre FROM categorias WHERE id_restaurante = 1');
    
    if (categoriasResult.rows.length === 0) {
      console.log('❌ No hay categorías. Creando categorías de prueba...');
      await db.query(`
        INSERT INTO categorias (nombre, activo, id_restaurante) VALUES 
        ('Bebidas', true, 1),
        ('Platos Principales', true, 1),
        ('Postres', true, 1),
        ('Entradas', true, 1)
      `);
    }
    
    // Obtener categorías
    const categorias = await db.query('SELECT id_categoria, nombre FROM categorias WHERE id_restaurante = 1');
    console.log('📂 Categorías disponibles:', categorias.rows.map(c => `${c.nombre} (ID: ${c.id_categoria})`));
    
    // Crear productos de prueba
    const testProducts = [
      {
        nombre: 'Coca Cola',
        precio: 15.00,
        id_categoria: categorias.rows.find(c => c.nombre === 'Bebidas')?.id_categoria || categorias.rows[0]?.id_categoria || 1,
        stock_actual: 50,
        activo: true,
        id_restaurante: 1
      },
      {
        nombre: 'Sprite',
        precio: 12.00,
        id_categoria: categorias.rows.find(c => c.nombre === 'Bebidas')?.id_categoria || categorias.rows[0]?.id_categoria || 1,
        stock_actual: 30,
        activo: true,
        id_restaurante: 1
      },
      {
        nombre: 'Ensalada César',
        precio: 45.00,
        id_categoria: categorias.rows.find(c => c.nombre === 'Entradas')?.id_categoria || categorias.rows[0]?.id_categoria || 1,
        stock_actual: 20,
        activo: true,
        id_restaurante: 1
      },
      {
        nombre: 'Pasta Carbonara',
        precio: 65.00,
        id_categoria: categorias.rows.find(c => c.nombre === 'Platos Principales')?.id_categoria || categorias.rows[0]?.id_categoria || 1,
        stock_actual: 15,
        activo: true,
        id_restaurante: 1
      },
      {
        nombre: 'Pizza Margherita',
        precio: 75.00,
        id_categoria: categorias.rows.find(c => c.nombre === 'Platos Principales')?.id_categoria || categorias.rows[0]?.id_categoria || 1,
        stock_actual: 25,
        activo: true,
        id_restaurante: 1
      },
      {
        nombre: 'Tiramisú',
        precio: 25.00,
        id_categoria: categorias.rows.find(c => c.nombre === 'Postres')?.id_categoria || categorias.rows[0]?.id_categoria || 1,
        stock_actual: 10,
        activo: true,
        id_restaurante: 1
      },
      {
        nombre: 'Flan Casero',
        precio: 20.00,
        id_categoria: categorias.rows.find(c => c.nombre === 'Postres')?.id_categoria || categorias.rows[0]?.id_categoria || 1,
        stock_actual: 8,
        activo: true,
        id_restaurante: 1
      }
    ];
    
    for (const producto of testProducts) {
      const query = `
        INSERT INTO productos (nombre, precio, id_categoria, stock_actual, activo, id_restaurante)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (nombre, id_restaurante) DO NOTHING
      `;
      await db.query(query, [
        producto.nombre,
        producto.precio,
        producto.id_categoria,
        producto.stock_actual,
        producto.activo,
        producto.id_restaurante
      ]);
    }
    
    console.log('✅ Productos de prueba creados exitosamente');
    
    // Mostrar resumen
    const productosResult = await db.query(`
      SELECT p.nombre, p.stock_actual, p.precio, c.nombre as categoria
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_restaurante = 1 AND p.activo = true
      ORDER BY c.nombre, p.nombre
    `);
    
    console.log('\n📦 Productos creados:');
    productosResult.rows.forEach((producto, index) => {
      console.log(`${index + 1}. ${producto.nombre} - ${producto.categoria} - Stock: ${producto.stock_actual} - Precio: Bs ${producto.precio}`);
    });
    
    // Verificar inventario
    const inventarioResult = await db.query(`
      SELECT p.id_producto, p.nombre, p.stock_actual, CAST(p.precio AS DECIMAL(10,2)) as precio, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.activo = true AND p.id_restaurante = 1
      ORDER BY p.nombre
    `);
    
    console.log(`\n📊 Total de productos en inventario: ${inventarioResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestProducts(); 