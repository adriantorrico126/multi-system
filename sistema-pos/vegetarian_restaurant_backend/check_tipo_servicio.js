const db = require('./src/config/database');

async function checkTipoServicio() {
  try {
    console.log('=== VERIFICANDO RESTRICCIONES DE TIPO_SERVICIO ===');
    
    // Verificar la estructura de la tabla ventas
    const tableStructureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'ventas' AND column_name = 'tipo_servicio'
      ORDER BY ordinal_position;
    `;
    
    const { rows: tableStructure } = await db.query(tableStructureQuery);
    console.log('\n1. ESTRUCTURA DE COLUMNA TIPO_SERVICIO:');
    console.table(tableStructure);
    
    // Verificar constraints en la tabla ventas
    const constraintsQuery = `
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'ventas'::regclass AND conname LIKE '%tipo_servicio%';
    `;
    
    const { rows: constraints } = await db.query(constraintsQuery);
    console.log('\n2. CONSTRAINTS DE TIPO_SERVICIO:');
    if (constraints.length > 0) {
      console.table(constraints);
    } else {
      console.log('No hay constraints específicos para tipo_servicio');
    }
    
    // Verificar valores únicos en tipo_servicio
    const uniqueValuesQuery = `
      SELECT DISTINCT tipo_servicio, COUNT(*) as cantidad
      FROM ventas 
      GROUP BY tipo_servicio
      ORDER BY tipo_servicio;
    `;
    
    const { rows: uniqueValues } = await db.query(uniqueValuesQuery);
    console.log('\n3. VALORES ÚNICOS EN TIPO_SERVICIO:');
    console.table(uniqueValues);
    
    // Verificar si hay un enum o check constraint
    const checkConstraintsQuery = `
      SELECT 
        conname,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'ventas'::regclass 
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%tipo_servicio%';
    `;
    
    const { rows: checkConstraints } = await db.query(checkConstraintsQuery);
    console.log('\n4. CHECK CONSTRAINTS PARA TIPO_SERVICIO:');
    if (checkConstraints.length > 0) {
      console.table(checkConstraints);
    } else {
      console.log('No hay check constraints para tipo_servicio');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

checkTipoServicio(); 