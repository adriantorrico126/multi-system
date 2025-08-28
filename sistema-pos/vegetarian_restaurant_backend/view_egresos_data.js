const { Pool } = require('pg');
const dbConfig = require('./config_db_backend'); // Usar configuración local

const pool = new Pool(dbConfig);

async function viewEgresosData() {
  const client = await pool.connect();
  
  try {
    console.log('💰 VISUALIZANDO DATOS DE EGRESOS\n');
    console.log('=' .repeat(60));
    
    // 1. VERIFICAR CONEXIÓN
    console.log('\n🔍 1. VERIFICANDO CONEXIÓN...');
    
    const versionResult = await client.query('SELECT version()');
    const currentDBResult = await client.query('SELECT current_database()');
    
    console.log('✅ Conexión exitosa a PostgreSQL');
    console.log(`   Base de datos: ${currentDBResult.rows[0].current_database}`);
    console.log(`   Versión: ${versionResult.rows[0].version.split(' ')[0]}`);
    
    // 2. MOSTRAR TODOS LOS EGRESOS
    console.log('\n💰 2. TODOS LOS EGRESOS EN EL SISTEMA:');
    
    const egresosResult = await client.query(`
      SELECT 
        e.id_egreso,
        e.concepto,
        e.descripcion,
        e.monto,
        e.fecha_egreso,
        e.estado,
        e.metodo_pago,
        e.proveedor_nombre,
        ce.nombre as categoria_nombre,
        v.nombre as vendedor_nombre,
        s.nombre as sucursal_nombre,
        r.nombre as restaurante_nombre
      FROM egresos e
      LEFT JOIN categorias_egresos ce ON e.id_categoria_egreso = ce.id_categoria_egreso
      LEFT JOIN vendedores v ON e.registrado_por = v.id_vendedor
      LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
      LEFT JOIN restaurantes r ON e.id_restaurante = r.id_restaurante
      ORDER BY e.fecha_egreso DESC, e.id_egreso
    `);
    
    if (egresosResult.rows.length > 0) {
      console.log(`📊 Total de egresos: ${egresosResult.rows.length}`);
      console.log('');
      
      egresosResult.rows.forEach((egreso, index) => {
        console.log(`🔸 EGRESO ${index + 1}:`);
        console.log(`   ID: ${egreso.id_egreso}`);
        console.log(`   Concepto: ${egreso.concepto}`);
        console.log(`   Descripción: ${egreso.descripcion || 'Sin descripción'}`);
        console.log(`   Monto: $${egreso.monto}`);
        console.log(`   Fecha: ${egreso.fecha_egreso}`);
        console.log(`   Estado: ${egreso.estado}`);
        console.log(`   Método de pago: ${egreso.metodo_pago}`);
        console.log(`   Proveedor: ${egreso.proveedor_nombre || 'No especificado'}`);
        console.log(`   Categoría: ${egreso.categoria_nombre}`);
        console.log(`   Registrado por: ${egreso.vendedor_nombre}`);
        console.log(`   Sucursal: ${egreso.sucursal_nombre}`);
        console.log(`   Restaurante: ${egreso.restaurante_nombre}`);
        console.log('');
      });
    } else {
      console.log('❌ No hay egresos en el sistema');
    }
    
    // 3. MOSTRAR CATEGORÍAS DE EGRESOS
    console.log('\n📂 3. CATEGORÍAS DE EGRESOS:');
    
    const categoriasResult = await client.query(`
      SELECT 
        id_categoria_egreso,
        nombre,
        descripcion,
        activa,
        created_at
      FROM categorias_egresos
      ORDER BY nombre
    `);
    
    if (categoriasResult.rows.length > 0) {
      console.log(`📊 Total de categorías: ${categoriasResult.rows.length}`);
      console.log('');
      
      categoriasResult.rows.forEach(categoria => {
        const status = categoria.activa ? '✅ Activa' : '❌ Inactiva';
        console.log(`   ${status}: ${categoria.nombre}`);
        if (categoria.descripcion) {
          console.log(`      Descripción: ${categoria.descripcion}`);
        }
      });
    } else {
      console.log('❌ No hay categorías de egresos');
    }
    
    // 4. MOSTRAR PRESUPUESTOS
    console.log('\n📊 4. PRESUPUESTOS MENSUALES:');
    
    const presupuestosResult = await client.query(`
      SELECT 
        pe.id_presupuesto,
        pe.anio,
        pe.mes,
        pe.monto_presupuestado,
        ce.nombre as categoria_nombre,
        r.nombre as restaurante_nombre
      FROM presupuestos_egresos pe
      LEFT JOIN categorias_egresos ce ON pe.id_categoria_egreso = ce.id_categoria_egreso
      LEFT JOIN restaurantes r ON pe.id_restaurante = r.id_restaurante
      ORDER BY pe.anio DESC, pe.mes DESC, ce.nombre
    `);
    
    if (presupuestosResult.rows.length > 0) {
      console.log(`📊 Total de presupuestos: ${presupuestosResult.rows.length}`);
      console.log('');
      
      presupuestosResult.rows.forEach(presupuesto => {
        console.log(`   📅 ${presupuesto.mes}/${presupuesto.anio}: ${presupuesto.categoria_nombre}`);
        console.log(`      Monto presupuestado: $${presupuesto.monto_presupuestado}`);
        console.log(`      Restaurante: ${presupuesto.restaurante_nombre}`);
        console.log('');
      });
    } else {
      console.log('❌ No hay presupuestos configurados');
    }
    
    // 5. ESTADÍSTICAS GENERALES
    console.log('\n📈 5. ESTADÍSTICAS GENERALES:');
    
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_egresos,
        SUM(monto) as total_monto,
        COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as egresos_pagados,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as egresos_pendientes,
        AVG(monto) as promedio_monto
      FROM egresos
    `);
    
    const stats = statsResult.rows[0];
    console.log(`   📊 Total de egresos: ${stats.total_egresos}`);
    console.log(`   💰 Monto total: $${parseFloat(stats.total_monto).toFixed(2)}`);
    console.log(`   ✅ Pagados: ${stats.egresos_pagados}`);
    console.log(`   ⏳ Pendientes: ${stats.egresos_pendientes}`);
    console.log(`   📊 Promedio por egreso: $${parseFloat(stats.promedio_monto).toFixed(2)}`);
    
    console.log('\n🎉 ¡VISUALIZACIÓN DE DATOS COMPLETADA!');
    console.log('💡 Todos los datos están disponibles para el frontend');
    
  } catch (error) {
    console.error('❌ Error durante la visualización:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar visualización
if (require.main === module) {
  viewEgresosData()
    .then(() => {
      console.log('\n✅ Visualización finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Visualización falló:', error);
      process.exit(1);
    });
}

module.exports = { viewEgresosData };
