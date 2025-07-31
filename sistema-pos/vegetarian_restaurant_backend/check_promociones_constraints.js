const { pool } = require('./src/config/database');

async function checkPromocionesConstraints() {
  try {
    console.log('🔍 Verificando restricciones actuales de la tabla promociones...');
    
    // Verificar la estructura actual de la tabla
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'promociones'
      ORDER BY ordinal_position;
    `;
    
    const { rows: structure } = await pool.query(structureQuery);
    console.log('📋 Estructura actual de la tabla promociones:');
    structure.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Verificar constraints actuales
    const constraintsQuery = `
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'promociones'::regclass;
    `;
    
    const { rows: constraints } = await pool.query(constraintsQuery);
    console.log('📋 Constraints actuales:');
    constraints.forEach(constraint => {
      console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_definition}`);
    });
    
    // Verificar datos actuales
    const dataQuery = `
      SELECT id_promocion, nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto
      FROM promociones
      ORDER BY id_promocion;
    `;
    
    const { rows: data } = await pool.query(dataQuery);
    console.log('📋 Datos actuales en promociones:');
    data.forEach(row => {
      console.log(`   - ID: ${row.id_promocion}, Nombre: ${row.nombre}, Tipo: ${row.tipo}`);
    });
    
    // Verificar valores únicos en el campo tipo
    const tiposQuery = `
      SELECT DISTINCT tipo, COUNT(*) as cantidad
      FROM promociones
      GROUP BY tipo
      ORDER BY tipo;
    `;
    
    const { rows: tipos } = await pool.query(tiposQuery);
    console.log('📋 Tipos de promoción actuales:');
    tipos.forEach(tipo => {
      console.log(`   - ${tipo.tipo}: ${tipo.cantidad} promociones`);
    });
    
  } catch (error) {
    console.error('❌ Error verificando constraints:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkPromocionesConstraints();
}

module.exports = { checkPromocionesConstraints }; 