const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');

async function setupPromocionesFinal() {
  try {
    console.log('🚀 Configurando sistema de promociones escalable...');
    console.log('📋 Estructura: promociones (principal) + promociones_sucursales (relacional)');
    
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, 'setup_promociones_final.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📋 Ejecutando script SQL...');
    
    // Ejecutar el script SQL
    await pool.query(sqlContent);
    
    console.log('✅ Sistema de promociones escalable configurado exitosamente!');
    
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
        COUNT(DISTINCT id_sucursal) as sucursales
      FROM promociones_sucursales;
    `;
    
    const { rows: asignaciones } = await pool.query(checkAsignacionesQuery);
    console.log(`📊 Asignaciones:`);
    console.log(`   - Total: ${asignaciones[0].total_asignaciones}`);
    console.log(`   - Sucursales: ${asignaciones[0].sucursales}`);
    
    // Probar la función
    try {
      const testFunctionQuery = `SELECT * FROM get_promociones_activas(1, NULL) LIMIT 1;`;
      await pool.query(testFunctionQuery);
      console.log('✅ Función get_promociones_activas funciona correctamente');
    } catch (error) {
      console.log('⚠️  Error al probar función:', error.message);
    }
    
    // Mostrar promociones por sucursal
    const promocionesPorSucursalQuery = `
      SELECT 
        s.nombre as sucursal,
        p.nombre as promocion,
        p.tipo,
        p.valor
      FROM promociones_sucursales ps
      JOIN promociones p ON ps.id_promocion = p.id_promocion
      JOIN sucursales s ON ps.id_sucursal = s.id_sucursal
      WHERE p.activa = true
      ORDER BY s.nombre, p.nombre;
    `;
    
    const { rows: promocionesPorSucursal } = await pool.query(promocionesPorSucursalQuery);
    console.log('📋 Promociones por sucursal:');
    promocionesPorSucursal.forEach(row => {
      console.log(`   - ${row.sucursal}: ${row.promocion} (${row.tipo}: ${row.valor})`);
    });
    
    console.log('🎉 Sistema de promociones escalable listo para usar!');
    console.log('');
    console.log('📝 Características implementadas:');
    console.log('   ✅ Estructura escalable: promociones + promociones_sucursales');
    console.log('   ✅ Multi-tenant por restaurante');
    console.log('   ✅ Asignación flexible a múltiples sucursales');
    console.log('   ✅ Tipos: porcentaje, monto_fijo, precio_fijo, x_uno_gratis, fijo');
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
  setupPromocionesFinal();
}

module.exports = { setupPromocionesFinal }; 