const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');

async function fixPromocionesConstraints() {
  try {
    console.log('🔧 Corrigiendo restricciones de la tabla promociones...');
    
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'fix_promociones_constraints.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📋 Ejecutando script de corrección...');
    
    // Ejecutar el script SQL
    await pool.query(sqlContent);
    
    console.log('✅ Restricciones corregidas exitosamente!');
    
    // Verificar que todo funciona
    console.log('🔍 Verificando corrección...');
    
    // Verificar la nueva restricción
    const checkConstraintQuery = `
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'promociones'::regclass 
        AND conname = 'promociones_tipo_check';
    `;
    
    const { rows: constraint } = await pool.query(checkConstraintQuery);
    if (constraint.length > 0) {
      console.log('✅ Nueva restricción aplicada:');
      console.log(`   - ${constraint[0].constraint_name}: ${constraint[0].constraint_definition}`);
    }
    
    // Probar inserción con los nuevos tipos (usando IDs válidos)
    console.log('🧪 Probando inserción con nuevos tipos...');
    
    const testInsertQuery = `
      INSERT INTO promociones (nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto)
      VALUES 
        ('Test Porcentaje', 'porcentaje', 15.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 60),
        ('Test Monto Fijo', 'monto_fijo', 5.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 61),
        ('Test Precio Fijo', 'precio_fijo', 10.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 62)
      ON CONFLICT (id_promocion) DO NOTHING
      RETURNING id_promocion, nombre, tipo;
    `;
    
    const { rows: testResults } = await pool.query(testInsertQuery);
    console.log('✅ Pruebas de inserción exitosas:');
    testResults.forEach(row => {
      console.log(`   - ID: ${row.id_promocion}, Nombre: ${row.nombre}, Tipo: ${row.tipo}`);
    });
    
    // Limpiar datos de prueba
    await pool.query(`
      DELETE FROM promociones 
      WHERE nombre LIKE 'Test %'
    `);
    console.log('🧹 Datos de prueba eliminados');
    
    console.log('🎉 Restricciones corregidas y verificadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error corrigiendo restricciones:', error);
    console.error('Detalles del error:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixPromocionesConstraints();
}

module.exports = { fixPromocionesConstraints }; 