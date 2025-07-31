const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');

async function setupPromociones() {
  try {
    console.log('🚀 Configurando sistema de promociones mejorado...');
    
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'add_id_restaurante_to_promociones.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📋 Ejecutando script SQL...');
    
    // Ejecutar el script SQL
    await pool.query(sqlContent);
    
    console.log('✅ Sistema de promociones configurado exitosamente!');
    
    // Verificar que todo funciona
    console.log('🔍 Verificando configuración...');
    
    // Verificar estructura de tablas
    const checkTablesQuery = `
      SELECT 
        table_name,
        COUNT(*) as total_columns
      FROM information_schema.columns 
      WHERE table_name IN ('promociones', 'promociones_sucursales')
      GROUP BY table_name
      ORDER BY table_name;
    `;
    
    const { rows: tables } = await pool.query(checkTablesQuery);
    console.log('📋 Estructura de tablas:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}: ${table.total_columns} columnas`);
    });
    
    // Verificar promociones creadas
    const checkPromocionesQuery = `
      SELECT 
        COUNT(*) as total_promociones,
        COUNT(CASE WHEN activa = true AND fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE THEN 1 END) as activas
      FROM promociones;
    `;
    
    const { rows: promociones } = await pool.query(checkPromocionesQuery);
    console.log(`📊 Promociones:`);
    console.log(`   - Total: ${promociones[0].total_promociones}`);
    console.log(`   - Activas: ${promociones[0].activas}`);
    
    // Verificar asignaciones
    const checkAsignacionesQuery = `
      SELECT 
        COUNT(*) as total_asignaciones,
        COUNT(DISTINCT id_restaurante) as restaurantes,
        COUNT(DISTINCT id_sucursal) as sucursales
      FROM promociones_sucursales;
    `;
    
    const { rows: asignaciones } = await pool.query(checkAsignacionesQuery);
    console.log(`📊 Asignaciones:`);
    console.log(`   - Total: ${asignaciones[0].total_asignaciones}`);
    console.log(`   - Restaurantes: ${asignaciones[0].restaurantes}`);
    console.log(`   - Sucursales: ${asignaciones[0].sucursales}`);
    
    // Verificar función personalizada
    const checkFunctionQuery = `
      SELECT routine_name, routine_type
      FROM information_schema.routines 
      WHERE routine_name = 'get_promociones_activas';
    `;
    
    const { rows: functions } = await pool.query(checkFunctionQuery);
    if (functions.length > 0) {
      console.log('✅ Función get_promociones_activas creada correctamente');
    } else {
      console.log('⚠️  Función get_promociones_activas no encontrada');
    }
    
    // Probar la función
    try {
      const testFunctionQuery = `SELECT * FROM get_promociones_activas(1, NULL) LIMIT 1;`;
      await pool.query(testFunctionQuery);
      console.log('✅ Función get_promociones_activas funciona correctamente');
    } catch (error) {
      console.log('⚠️  Error al probar función:', error.message);
    }
    
    // Mostrar índices creados
    const checkIndexesQuery = `
      SELECT 
        indexname,
        tablename
      FROM pg_indexes 
      WHERE tablename IN ('promociones', 'promociones_sucursales')
      ORDER BY tablename, indexname;
    `;
    
    const { rows: indexes } = await pool.query(checkIndexesQuery);
    console.log('📋 Índices creados:');
    indexes.forEach(index => {
      console.log(`   - ${index.indexname} (${index.tablename})`);
    });
    
    console.log('🎉 Sistema de promociones mejorado listo para usar!');
    console.log('');
    console.log('📝 Características implementadas:');
    console.log('   ✅ Promociones por restaurante y sucursal');
    console.log('   ✅ Tipos: porcentaje, monto_fijo, precio_fijo, x_uno_gratis');
    console.log('   ✅ Validaciones de fechas y valores');
    console.log('   ✅ Índices optimizados');
    console.log('   ✅ Función personalizada para consultas');
    console.log('   ✅ Transacciones seguras');
    
  } catch (error) {
    console.error('❌ Error configurando promociones:', error);
    console.error('Detalles del error:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupPromociones();
}

module.exports = { setupPromociones }; 