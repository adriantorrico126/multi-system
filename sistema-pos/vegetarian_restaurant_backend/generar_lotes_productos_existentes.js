const { pool } = require('./src/config/database');

async function generarLotesProductosExistentes() {
  const client = await pool.connect();
  try {
    console.log('🚀 GENERANDO LOTES AUTOMÁTICAMENTE PARA PRODUCTOS EXISTENTES\n');
    
    // 1. OBTENER PRODUCTOS SIN LOTES
    console.log('1️⃣ OBTENIENDO PRODUCTOS SIN LOTES...');
    
    const productosSinLotes = await client.query(`
      SELECT 
        p.id_producto,
        p.nombre,
        p.stock_actual,
        p.precio,
        c.nombre as categoria_nombre,
        c.id_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN inventario_lotes il ON p.id_producto = il.id_producto AND il.activo = true
      WHERE p.activo = true 
      AND il.id_lote IS NULL
      ORDER BY p.stock_actual DESC, p.nombre
    `);
    
    console.log(`  📊 Productos sin lotes encontrados: ${productosSinLotes.rows.length}`);
    
    if (productosSinLotes.rows.length === 0) {
      console.log('  ℹ️ Todos los productos ya tienen lotes configurados');
      return;
    }
    
    // 2. OBTENER CATEGORÍAS DE ALMACÉN DISPONIBLES
    console.log('\n2️⃣ OBTENIENDO CATEGORÍAS DE ALMACÉN...');
    
    const categoriasAlmacen = await client.query(`
      SELECT id_categoria_almacen, nombre, tipo_almacen
      FROM categorias_almacen 
      WHERE activo = true
      ORDER BY nombre
    `);
    
    console.log(`  📊 Categorías de almacén disponibles: ${categoriasAlmacen.rows.length}`);
    categoriasAlmacen.rows.forEach(cat => {
      console.log(`     - ${cat.nombre} (${cat.tipo_almacen})`);
    });
    
    // 3. MAPEO DE CATEGORÍAS DE PRODUCTOS A CATEGORÍAS DE ALMACÉN
    console.log('\n3️⃣ CONFIGURANDO MAPEO DE CATEGORÍAS...');
    
    const mapeoCategorias = {
      // Mapeo basado en nombres de categorías de productos
      'Bebidas': 'Almacén de Bebidas',
      'Platos Principales': 'Cámara Refrigerada',
      'Entradas': 'Cámara Refrigerada',
      'Postres': 'Cámara Refrigerada',
      'Ensaladas': 'Cámara Refrigerada',
      'Sopas': 'Cámara Refrigerada',
      'Panes': 'Almacén Seco',
      'Condimentos': 'Almacén Seco',
      'Granos': 'Almacén Seco',
      'Frutas': 'Cámara Refrigerada',
      'Verduras': 'Cámara Refrigerada',
      'Lácteos': 'Cámara Refrigerada',
      'Carnes': 'Cámara de Congelación',
      'Pescados': 'Cámara de Congelación',
      'Helados': 'Cámara de Congelación',
      'Utensilios': 'Almacén de Vajilla',
      'Limpieza': 'Almacén de Limpieza'
    };
    
    console.log('  📊 Mapeo de categorías configurado');
    
    // 4. GENERAR LOTES AUTOMÁTICAMENTE
    console.log('\n4️⃣ GENERANDO LOTES AUTOMÁTICAMENTE...');
    
    let lotesGenerados = 0;
    let errores = 0;
    
    for (const producto of productosSinLotes.rows) {
      try {
        // Determinar categoría de almacén
        let categoriaAlmacen = null;
        for (const [categoriaProducto, categoriaAlmacenNombre] of Object.entries(mapeoCategorias)) {
          if (producto.categoria_nombre && producto.categoria_nombre.toLowerCase().includes(categoriaProducto.toLowerCase())) {
            categoriaAlmacen = categoriasAlmacen.rows.find(ca => ca.nombre === categoriaAlmacenNombre);
            break;
          }
        }
        
        // Si no se encuentra mapeo, usar almacén seco por defecto
        if (!categoriaAlmacen) {
          categoriaAlmacen = categoriasAlmacen.rows.find(ca => ca.nombre === 'Almacén Seco');
        }
        
        if (!categoriaAlmacen) {
          console.log(`  ⚠️ No se pudo determinar categoría de almacén para ${producto.nombre}`);
          errores++;
          continue;
        }
        
        // Generar lote usando la función automática
        const loteResult = await client.query(`
          SELECT generar_lote_automatico($1, $2, $3, $4, $5)
        `, [
          producto.id_producto,
          producto.stock_actual || 0,
          producto.precio * 0.7, // Precio de compra estimado (70% del precio de venta)
          'Proveedor Automático',
          1 // id_restaurante por defecto
        ]);
        
        const idLote = loteResult.rows[0].generar_lote_automatico;
        
        // Actualizar el lote con la categoría de almacén correcta
        await client.query(`
          UPDATE inventario_lotes 
          SET id_categoria_almacen = $1
          WHERE id_lote = $2
        `, [categoriaAlmacen.id_categoria_almacen, idLote]);
        
        console.log(`  ✅ Lote generado para ${producto.nombre}: ID ${idLote}, Categoría: ${categoriaAlmacen.nombre}`);
        lotesGenerados++;
        
      } catch (error) {
        console.log(`  ❌ Error generando lote para ${producto.nombre}: ${error.message}`);
        errores++;
      }
    }
    
    // 5. VERIFICAR RESULTADOS
    console.log('\n5️⃣ VERIFICANDO RESULTADOS...');
    
    const lotesFinales = await client.query(`
      SELECT COUNT(*) as total_lotes
      FROM inventario_lotes 
      WHERE activo = true
    `);
    
    const productosConLotes = await client.query(`
      SELECT COUNT(DISTINCT p.id_producto) as total_productos
      FROM productos p
      JOIN inventario_lotes il ON p.id_producto = il.id_producto AND il.activo = true
      WHERE p.activo = true
    `);
    
    console.log(`  📊 Total lotes en el sistema: ${lotesFinales.rows[0].total_lotes}`);
    console.log(`  📊 Productos con lotes: ${productosConLotes.rows[0].total_productos}`);
    console.log(`  📊 Lotes generados en esta ejecución: ${lotesGenerados}`);
    console.log(`  📊 Errores encontrados: ${errores}`);
    
    // 6. VERIFICAR STOCK ACTUALIZADO
    console.log('\n6️⃣ VERIFICANDO ACTUALIZACIÓN DE STOCK...');
    
    const stockVerificacion = await client.query(`
      SELECT 
        COUNT(*) as total_productos,
        SUM(stock_actual) as stock_total,
        AVG(stock_actual) as stock_promedio
      FROM productos 
      WHERE activo = true
    `);
    
    if (stockVerificacion.rows.length > 0) {
      const stock = stockVerificacion.rows[0];
      console.log(`  📊 Total productos: ${stock.total_productos}`);
      console.log(`  📊 Stock total: ${stock.stock_total || 0}`);
      console.log(`  📊 Stock promedio: ${Math.round(stock.stock_promedio || 0)}`);
    }
    
    // 7. VERIFICAR ALERTAS GENERADAS
    console.log('\n7️⃣ VERIFICANDO ALERTAS GENERADAS...');
    
    const alertasGeneradas = await client.query(`
      SELECT 
        COUNT(*) as total_alertas,
        COUNT(CASE WHEN nivel_urgencia = 'alta' THEN 1 END) as alertas_altas,
        COUNT(CASE WHEN nivel_urgencia = 'media' THEN 1 END) as alertas_medias,
        COUNT(CASE WHEN nivel_urgencia = 'baja' THEN 1 END) as alertas_bajas
      FROM alertas_inventario
      WHERE resuelta = false
    `);
    
    if (alertasGeneradas.rows.length > 0) {
      const alertas = alertasGeneradas.rows[0];
      console.log(`  📊 Total alertas activas: ${alertas.total_alertas}`);
      console.log(`  📊 Alta urgencia: ${alertas.alertas_altas}`);
      console.log(`  📊 Media urgencia: ${alertas.alertas_medias}`);
      console.log(`  📊 Baja urgencia: ${alertas.alertas_bajas}`);
    }
    
    // 8. VERIFICAR MOVIMIENTOS REGISTRADOS
    console.log('\n8️⃣ VERIFICANDO MOVIMIENTOS REGISTRADOS...');
    
    const movimientosRecientes = await client.query(`
      SELECT 
        COUNT(*) as total_movimientos,
        COUNT(CASE WHEN tipo_movimiento = 'entrada' THEN 1 END) as entradas,
        COUNT(CASE WHEN fecha_movimiento >= NOW() - INTERVAL '1 hour' THEN 1 END) as ultima_hora
      FROM movimientos_inventario
    `);
    
    if (movimientosRecientes.rows.length > 0) {
      const movimientos = movimientosRecientes.rows[0];
      console.log(`  📊 Total movimientos: ${movimientos.total_movimientos}`);
      console.log(`  📊 Entradas: ${movimientos.entradas}`);
      console.log(`  📊 Última hora: ${movimientos.ultima_hora}`);
    }
    
    console.log('\n🎯 GENERACIÓN DE LOTES COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 RESUMEN:');
    console.log(`  ✅ Lotes generados: ${lotesGenerados}`);
    console.log(`  ⚠️ Errores: ${errores}`);
    console.log(`  📊 Total lotes en sistema: ${lotesFinales.rows[0].total_lotes}`);
    
    if (errores === 0) {
      console.log('\n🎉 ¡Todos los productos ahora tienen lotes configurados!');
      console.log('🚀 El sistema de inventario está completamente operativo');
    } else {
      console.log('\n⚠️ Algunos productos no pudieron ser procesados');
      console.log('🔧 Revisar errores y ejecutar nuevamente si es necesario');
    }
    
  } catch (error) {
    console.error('❌ Error generando lotes:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar generación de lotes
generarLotesProductosExistentes()
  .then(() => {
    console.log('\n🏁 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en el proceso:', error);
    process.exit(1);
  });
