const db = require('./src/config/database');

async function checkDBTriggers() {
  try {
    console.log('=== VERIFICANDO TRIGGERS Y FUNCIONES DE LA BD ===');
    
    // Verificar triggers en la tabla ventas
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'ventas';
    `;
    
    const { rows: triggers } = await db.query(triggersQuery);
    console.log('\n1. TRIGGERS EN TABLA VENTAS:');
    if (triggers.length > 0) {
      console.table(triggers);
    } else {
      console.log('No hay triggers en la tabla ventas');
    }
    
    // Verificar funciones que podrían afectar ventas
    const functionsQuery = `
      SELECT 
        routine_name,
        routine_type,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_definition LIKE '%ventas%' 
      OR routine_definition LIKE '%estado%';
    `;
    
    const { rows: functions } = await db.query(functionsQuery);
    console.log('\n2. FUNCIONES QUE MENCIONAN VENTAS O ESTADO:');
    if (functions.length > 0) {
      console.table(functions.map(f => ({
        routine_name: f.routine_name,
        routine_type: f.routine_type,
        has_ventas: f.routine_definition.includes('ventas'),
        has_estado: f.routine_definition.includes('estado')
      })));
    } else {
      console.log('No hay funciones que mencionen ventas o estado');
    }
    
    // Verificar si hay algún constraint o regla que cambie el estado
    const constraintsQuery = `
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'ventas'::regclass;
    `;
    
    const { rows: constraints } = await db.query(constraintsQuery);
    console.log('\n3. CONSTRAINTS EN TABLA VENTAS:');
    if (constraints.length > 0) {
      console.table(constraints);
    } else {
      console.log('No hay constraints especiales en la tabla ventas');
    }
    
    // Verificar la estructura de la tabla ventas
    const tableStructureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'ventas'
      ORDER BY ordinal_position;
    `;
    
    const { rows: tableStructure } = await db.query(tableStructureQuery);
    console.log('\n4. ESTRUCTURA DE TABLA VENTAS:');
    console.table(tableStructure);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

checkDBTriggers(); 