const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function analyzeCurrentStructure() {
  const client = await pool.connect();
  try {
    console.log('🔍 ANALIZANDO ESTRUCTURA ACTUAL DE LA BASE DE DATOS...\n');
    
    // 1. Analizar tabla productos
    console.log('1️⃣ ANÁLISIS TABLA PRODUCTOS:');
    const productosQuery = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
      ORDER BY ordinal_position
    `);
    console.log('Columnas:', productosQuery.rows);
    
    // 2. Verificar si existe id_sucursal
    const hasSucursal = productosQuery.rows.some(row => row.column_name === 'id_sucursal');
    console.log('¿Tiene id_sucursal?:', hasSucursal);
    
    // 3. Contar productos por restaurante
    const countQuery = await client.query(`
      SELECT id_restaurante, COUNT(*) as total_productos 
      FROM productos 
      GROUP BY id_restaurante
    `);
    console.log('Productos por restaurante:', countQuery.rows);
    
    // 4. Analizar tabla sucursales
    console.log('\n2️⃣ ANÁLISIS TABLA SUCURSALES:');
    const sucursalesQuery = await client.query(`
      SELECT id_sucursal, nombre, id_restaurante, activo 
      FROM sucursales 
      ORDER BY id_restaurante, id_sucursal
    `);
    console.log('Sucursales existentes:', sucursalesQuery.rows);
    
    // 5. Analizar tabla movimientos_inventario
    console.log('\n3️⃣ ANÁLISIS TABLA MOVIMIENTOS_INVENTARIO:');
    const movimientosQuery = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'movimientos_inventario' 
      ORDER BY ordinal_position
    `);
    console.log('Columnas movimientos_inventario:', movimientosQuery.rows);
    
    // 6. Verificar si existe tabla stock_sucursal
    console.log('\n4️⃣ VERIFICANDO TABLA STOCK_SUCURSAL:');
    const stockSucursalExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_sucursal'
      )
    `);
    console.log('¿Existe tabla stock_sucursal?:', stockSucursalExists.rows[0].exists);
    
    // 7. Analizar tabla inventario_lotes
    console.log('\n5️⃣ ANÁLISIS TABLA INVENTARIO_LOTES:');
    const lotesQuery = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'inventario_lotes' 
      ORDER BY ordinal_position
    `);
    console.log('Columnas inventario_lotes:', lotesQuery.rows);
    
    // 8. Analizar dependencias de productos
    console.log('\n6️⃣ ANÁLISIS DEPENDENCIAS DE PRODUCTOS:');
    
    // Verificar foreign keys
    const fkQuery = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('productos', 'movimientos_inventario', 'inventario_lotes')
    `);
    console.log('Foreign Keys encontradas:', fkQuery.rows);
    
    // 9. Analizar índices existentes
    console.log('\n7️⃣ ANÁLISIS ÍNDICES:');
    const indicesQuery = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('productos', 'movimientos_inventario', 'inventario_lotes')
      ORDER BY tablename, indexname
    `);
    console.log('Índices existentes:', indicesQuery.rows);
    
    // 10. Analizar triggers existentes
    console.log('\n8️⃣ ANÁLISIS TRIGGERS:');
    const triggersQuery = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table IN ('productos', 'movimientos_inventario', 'inventario_lotes')
      ORDER BY event_object_table, trigger_name
    `);
    console.log('Triggers existentes:', triggersQuery.rows);
    
    // 11. Analizar funciones relacionadas con inventario
    console.log('\n9️⃣ ANÁLISIS FUNCIONES:');
    const funcionesQuery = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_definition ILIKE '%inventario%' 
         OR routine_definition ILIKE '%stock%'
         OR routine_definition ILIKE '%producto%'
      ORDER BY routine_name
    `);
    console.log('Funciones relacionadas:', funcionesQuery.rows.map(r => ({
      name: r.routine_name,
      type: r.routine_type,
      hasDefinition: !!r.routine_definition
    })));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeCurrentStructure();






