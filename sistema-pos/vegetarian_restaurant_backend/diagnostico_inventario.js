const { pool } = require('./src/config/database');

async function diagnosticoInventario() {
  const client = await pool.connect();
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO DEL SISTEMA DE INVENTARIO\n');
    
    // 1. VERIFICAR EXISTENCIA DE TABLAS
    console.log('1️⃣ VERIFICANDO EXISTENCIA DE TABLAS...');
    
    const tablasInventario = [
      'inventario_lotes',
      'categorias_almacen',
      'movimientos_inventario',
      'alertas_inventario'
    ];
    
    for (const tabla of tablasInventario) {
      try {
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tabla]);
        
        if (tableExists.rows[0].exists) {
          console.log(`  ✅ Tabla ${tabla}: EXISTE`);
          
          // Contar registros
          const countResult = await client.query(`SELECT COUNT(*) as total FROM ${tabla}`);
          console.log(`     📊 Registros: ${countResult.rows[0].total}`);
        } else {
          console.log(`  ❌ Tabla ${tabla}: NO EXISTE`);
        }
      } catch (error) {
        console.log(`  ⚠️ Error verificando ${tabla}: ${error.message}`);
      }
    }
    
    // 2. VERIFICAR ESTRUCTURA DE TABLAS
    console.log('\n2️⃣ VERIFICANDO ESTRUCTURA DE TABLAS...');
    
    try {
      // Verificar estructura de inventario_lotes
      const estructuraLotes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'inventario_lotes' 
        ORDER BY ordinal_position
      `);
      
      if (estructuraLotes.rows.length > 0) {
        console.log('  📊 Estructura de inventario_lotes:');
        estructuraLotes.rows.forEach(col => {
          console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
      }
    } catch (error) {
      console.log(`  ⚠️ Error verificando estructura: ${error.message}`);
    }
    
    // 3. VERIFICAR DATOS DE PRODUCTOS
    console.log('\n3️⃣ VERIFICANDO DATOS DE PRODUCTOS...');
    
    try {
      const productos = await client.query(`
        SELECT 
          COUNT(*) as total_productos,
          COUNT(CASE WHEN stock_actual > 0 THEN 1 END) as con_stock,
          COUNT(CASE WHEN stock_actual = 0 THEN 1 END) as sin_stock,
          COUNT(CASE WHEN stock_actual <= 10 THEN 1 END) as stock_bajo,
          SUM(stock_actual) as stock_total,
          AVG(stock_actual) as stock_promedio
        FROM productos
        WHERE activo = true
      `);
      
      if (productos.rows.length > 0) {
        const p = productos.rows[0];
        console.log(`  📊 Total productos: ${p.total_productos}`);
        console.log(`  📊 Con stock: ${p.con_stock}`);
        console.log(`  📊 Sin stock: ${p.sin_stock}`);
        console.log(`  📊 Stock bajo (≤10): ${p.stock_bajo}`);
        console.log(`  📊 Stock total: ${p.stock_total || 0}`);
        console.log(`  📊 Stock promedio: ${Math.round(p.stock_promedio || 0)}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Error verificando productos: ${error.message}`);
    }
    
    // 4. VERIFICAR LOTES EXISTENTES
    console.log('\n4️⃣ VERIFICANDO LOTES EXISTENTES...');
    
    try {
      const lotes = await client.query(`
        SELECT 
          COUNT(*) as total_lotes,
          COUNT(CASE WHEN cantidad_actual > 0 THEN 1 END) as lotes_activos,
          COUNT(CASE WHEN cantidad_actual = 0 THEN 1 END) as lotes_vacios,
          COUNT(CASE WHEN fecha_caducidad < NOW() THEN 1 END) as lotes_vencidos,
          COUNT(CASE WHEN fecha_caducidad < NOW() + INTERVAL '7 days' THEN 1 END) as lotes_por_vencer,
          COUNT(CASE WHEN fecha_caducidad < NOW() + INTERVAL '30 days' THEN 1 END) as lotes_proximo_vencer,
          SUM(cantidad_actual) as stock_total_lotes,
          AVG(cantidad_actual) as stock_promedio_lotes
        FROM inventario_lotes
        WHERE activo = true
      `);
      
      if (lotes.rows.length > 0) {
        const l = lotes.rows[0];
        console.log(`  📊 Total lotes: ${l.total_lotes}`);
        console.log(`  📊 Lotes activos: ${l.lotes_activos}`);
        console.log(`  📊 Lotes vacíos: ${l.lotes_vacios}`);
        console.log(`  📊 Lotes vencidos: ${l.lotes_vencidos}`);
        console.log(`  📊 Por vencer (7 días): ${l.lotes_por_vencer}`);
        console.log(`  📊 Próximo vencer (30 días): ${l.lotes_proximo_vencer}`);
        console.log(`  📊 Stock total en lotes: ${l.stock_total_lotes || 0}`);
        console.log(`  📊 Stock promedio por lote: ${Math.round(l.stock_promedio_lotes || 0)}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Error verificando lotes: ${error.message}`);
    }
    
    // 5. VERIFICAR MOVIMIENTOS DE INVENTARIO
    console.log('\n5️⃣ VERIFICANDO MOVIMIENTOS DE INVENTARIO...');
    
    try {
      const movimientos = await client.query(`
        SELECT 
          COUNT(*) as total_movimientos,
          COUNT(CASE WHEN tipo_movimiento = 'entrada' THEN 1 END) as entradas,
          COUNT(CASE WHEN tipo_movimiento = 'salida' THEN 1 END) as salidas,
          COUNT(CASE WHEN tipo_movimiento = 'ajuste' THEN 1 END) as ajustes,
          COUNT(CASE WHEN fecha_movimiento >= NOW() - INTERVAL '7 days' THEN 1 END) as ultimos_7_dias,
          COUNT(CASE WHEN fecha_movimiento >= NOW() - INTERVAL '30 days' THEN 1 END) as ultimos_30_dias
        FROM movimientos_inventario
      `);
      
      if (movimientos.rows.length > 0) {
        const m = movimientos.rows[0];
        console.log(`  📊 Total movimientos: ${m.total_movimientos}`);
        console.log(`  📊 Entradas: ${m.entradas}`);
        console.log(`  📊 Salidas: ${m.salidas}`);
        console.log(`  📊 Ajustes: ${m.ajustes}`);
        console.log(`  📊 Últimos 7 días: ${m.ultimos_7_dias}`);
        console.log(`  📊 Últimos 30 días: ${m.ultimos_30_dias}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Error verificando movimientos: ${error.message}`);
    }
    
    // 6. VERIFICAR CATEGORÍAS DE ALMACÉN
    console.log('\n6️⃣ VERIFICANDO CATEGORÍAS DE ALMACÉN...');
    
    try {
      const categoriasAlmacen = await client.query(`
        SELECT 
          ca.id_categoria_almacen,
          ca.nombre,
          ca.tipo_almacen,
          ca.condiciones_especiales,
          ca.rotacion_recomendada,
          COUNT(il.id_lote) as total_lotes,
          SUM(il.cantidad_actual) as stock_total
        FROM categorias_almacen ca
        LEFT JOIN inventario_lotes il ON ca.id_categoria_almacen = il.id_categoria_almacen
        WHERE ca.activo = true
        GROUP BY ca.id_categoria_almacen, ca.nombre, ca.tipo_almacen, ca.condiciones_especiales, ca.rotacion_recomendada
        ORDER BY ca.nombre
      `);
      
      if (categoriasAlmacen.rows.length > 0) {
        console.log(`  📊 Categorías de almacén encontradas: ${categoriasAlmacen.rows.length}`);
        categoriasAlmacen.rows.forEach(cat => {
          console.log(`     - ${cat.nombre} (${cat.tipo_almacen}): ${cat.total_lotes} lotes, ${cat.stock_total || 0} stock`);
        });
      } else {
        console.log('  ⚠️ No hay categorías de almacén configuradas');
      }
    } catch (error) {
      console.log(`  ⚠️ Error verificando categorías: ${error.message}`);
    }
    
    // 7. VERIFICAR ALERTAS DE INVENTARIO
    console.log('\n7️⃣ VERIFICANDO ALERTAS DE INVENTARIO...');
    
    try {
      const alertas = await client.query(`
        SELECT 
          COUNT(*) as total_alertas,
          COUNT(CASE WHEN resuelta = false THEN 1 END) as alertas_pendientes,
          COUNT(CASE WHEN nivel_urgencia = 'alta' THEN 1 END) as alertas_altas,
          COUNT(CASE WHEN nivel_urgencia = 'media' THEN 1 END) as alertas_medias,
          COUNT(CASE WHEN nivel_urgencia = 'baja' THEN 1 END) as alertas_bajas
        FROM alertas_inventario
      `);
      
      if (alertas.rows.length > 0) {
        const a = alertas.rows[0];
        console.log(`  📊 Total alertas: ${a.total_alertas}`);
        console.log(`  📊 Pendientes: ${a.alertas_pendientes}`);
        console.log(`  📊 Alta urgencia: ${a.alertas_altas}`);
        console.log(`  📊 Media urgencia: ${a.alertas_medias}`);
        console.log(`  📊 Baja urgencia: ${a.alertas_bajas}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Error verificando alertas: ${error.message}`);
    }
    
    // 8. DIAGNÓSTICO GENERAL
    console.log('\n8️⃣ DIAGNÓSTICO GENERAL...');
    
    try {
      // Verificar si hay productos sin lotes
      const productosSinLotes = await client.query(`
        SELECT COUNT(*) as total
        FROM productos p
        LEFT JOIN inventario_lotes il ON p.id_producto = il.id_producto
        WHERE p.activo = true AND il.id_lote IS NULL
      `);
      
      // Verificar si hay lotes sin productos
      const lotesSinProductos = await client.query(`
        SELECT COUNT(*) as total
        FROM inventario_lotes il
        LEFT JOIN productos p ON il.id_producto = p.id_producto
        WHERE il.activo = true AND p.id_producto IS NULL
      `);
      
      console.log(`  📊 Productos sin lotes: ${productosSinLotes.rows[0].total}`);
      console.log(`  📊 Lotes sin productos: ${lotesSinProductos.rows[0].total}`);
      
      if (parseInt(productosSinLotes.rows[0].total) > 0) {
        console.log('  ⚠️ PROBLEMA: Hay productos sin lotes configurados');
      }
      
      if (parseInt(lotesSinProductos.rows[0].total) > 0) {
        console.log('  ⚠️ PROBLEMA: Hay lotes sin productos válidos');
      }
      
    } catch (error) {
      console.log(`  ⚠️ Error en diagnóstico general: ${error.message}`);
    }
    
    // 9. RECOMENDACIONES
    console.log('\n9️⃣ RECOMENDACIONES...');
    
    console.log('  💡 Para un sistema de inventario profesional se recomienda:');
    console.log('     - Configurar categorías de almacén');
    console.log('     - Establecer alertas automáticas de stock bajo');
    console.log('     - Implementar sistema de rotación FIFO/LIFO');
    console.log('     - Configurar notificaciones de caducidad');
    console.log('     - Establecer niveles mínimos de stock');
    console.log('     - Implementar auditoría de movimientos');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar diagnóstico
diagnosticoInventario()
  .then(() => {
    console.log('\n🏁 Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en diagnóstico:', error);
    process.exit(1);
  });
