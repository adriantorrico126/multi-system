const { pool } = require('./src/config/database');

async function checkProducts() {
  try {
    console.log('🔍 Verificando productos existentes...');
    
    // Verificar productos disponibles
    const productsQuery = `
      SELECT id_producto, nombre, precio, activo
      FROM productos
      ORDER BY id_producto
      LIMIT 10;
    `;
    
    const { rows: products } = await pool.query(productsQuery);
    console.log('📋 Productos disponibles:');
    products.forEach(product => {
      console.log(`   - ID: ${product.id_producto}, Nombre: ${product.nombre}, Precio: $${product.precio}, Activo: ${product.activo}`);
    });
    
    // Contar total de productos
    const countQuery = `
      SELECT COUNT(*) as total_productos
      FROM productos;
    `;
    
    const { rows: count } = await pool.query(countQuery);
    console.log(`📊 Total de productos: ${count[0].total_productos}`);
    
    // Verificar productos activos
    const activeQuery = `
      SELECT COUNT(*) as activos
      FROM productos
      WHERE activo = true;
    `;
    
    const { rows: active } = await pool.query(activeQuery);
    console.log(`📊 Productos activos: ${active[0].activos}`);
    
    if (products.length === 0) {
      console.log('⚠️  No hay productos en la base de datos');
      console.log('💡 Necesitas crear productos antes de crear promociones');
    } else {
      console.log('✅ Productos encontrados, puedes usar estos IDs para las promociones');
    }
    
  } catch (error) {
    console.error('❌ Error verificando productos:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkProducts();
}

module.exports = { checkProducts }; 