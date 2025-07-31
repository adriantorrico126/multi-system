const { pool } = require('./src/config/database');

async function checkSucursales() {
  try {
    console.log('🔍 Verificando sucursales existentes...');
    
    // Verificar sucursales disponibles
    const sucursalesQuery = `
      SELECT id_sucursal, nombre, direccion, id_restaurante
      FROM sucursales
      ORDER BY id_sucursal;
    `;
    
    const { rows: sucursales } = await pool.query(sucursalesQuery);
    console.log('📋 Sucursales disponibles:');
    sucursales.forEach(sucursal => {
      console.log(`   - ID: ${sucursal.id_sucursal}, Nombre: ${sucursal.nombre}, Restaurante: ${sucursal.id_restaurante}`);
    });
    
    // Contar total de sucursales
    const countQuery = `
      SELECT COUNT(*) as total_sucursales
      FROM sucursales;
    `;
    
    const { rows: count } = await pool.query(countQuery);
    console.log(`📊 Total de sucursales: ${count[0].total_sucursales}`);
    
    // Verificar restaurantes
    const restaurantesQuery = `
      SELECT id_restaurante, nombre
      FROM restaurantes
      ORDER BY id_restaurante;
    `;
    
    const { rows: restaurantes } = await pool.query(restaurantesQuery);
    console.log('📋 Restaurantes disponibles:');
    restaurantes.forEach(restaurante => {
      console.log(`   - ID: ${restaurante.id_restaurante}, Nombre: ${restaurante.nombre}`);
    });
    
    if (sucursales.length === 0) {
      console.log('⚠️  No hay sucursales en la base de datos');
      console.log('💡 Necesitas crear sucursales antes de asignar promociones');
    } else {
      console.log('✅ Sucursales encontradas, puedes usar estos IDs para las promociones');
    }
    
  } catch (error) {
    console.error('❌ Error verificando sucursales:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkSucursales();
}

module.exports = { checkSucursales }; 
checkSucursales(); 