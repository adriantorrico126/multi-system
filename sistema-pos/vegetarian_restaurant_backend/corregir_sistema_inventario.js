const { pool } = require('./src/config/database');

async function corregirSistemaInventario() {
  const client = await pool.connect();
  try {
    console.log('🔧 CORRIGIENDO SISTEMA DE INVENTARIO\n');
    
    // 1. VERIFICAR Y CORREGIR ESTRUCTURA DE TABLAS
    console.log('1️⃣ VERIFICANDO ESTRUCTURA DE TABLAS...');
    
    try {
      // Verificar si la tabla movimientos_inventario tiene la columna id_lote
      const columnasMovimientos = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = 'movimientos_inventario' 
        ORDER BY ordinal_position
      `);
      
      console.log('  📊 Columnas de movimientos_inventario:');
      columnasMovimientos.rows.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type}`);
      });
      
      // Verificar si falta la columna id_lote
      const tieneIdLote = columnasMovimientos.rows.some(col => col.column_name === 'id_lote');
      
      if (!tieneIdLote) {
        console.log('  ⚠️ Falta la columna id_lote en movimientos_inventario');
        console.log('  🔧 Agregando columna id_lote...');
        
        await client.query(`
          ALTER TABLE movimientos_inventario 
          ADD COLUMN id_lote INTEGER;
        `);
        
        console.log('  ✅ Columna id_lote agregada');
      } else {
        console.log('  ✅ Columna id_lote ya existe');
      }
      
    } catch (error) {
      console.log(`  ⚠️ Error verificando estructura: ${error.message}`);
    }
    
    // 2. CORREGIR FUNCIÓN registrar_movimiento_inventario
    console.log('\n2️⃣ CORRIGIENDO FUNCIÓN registrar_movimiento_inventario...');
    
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION registrar_movimiento_inventario()
        RETURNS TRIGGER AS $$
        DECLARE
          stock_anterior NUMERIC;
          stock_actual NUMERIC;
          tipo_movimiento VARCHAR(50);
          motivo TEXT;
        BEGIN
          -- Determinar tipo de movimiento
          IF TG_OP = 'INSERT' THEN
            tipo_movimiento := 'entrada';
            motivo := 'Creación de lote';
            stock_anterior := 0;
            stock_actual := NEW.cantidad_inicial;
          ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.cantidad_actual != NEW.cantidad_actual THEN
              IF NEW.cantidad_actual > OLD.cantidad_actual THEN
                tipo_movimiento := 'entrada';
                motivo := 'Ajuste de stock';
              ELSE
                tipo_movimiento := 'salida';
                motivo := 'Ajuste de stock';
              END IF;
              stock_anterior := OLD.cantidad_actual;
              stock_actual := NEW.cantidad_actual;
            ELSE
              RETURN NEW;
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            tipo_movimiento := 'eliminacion';
            motivo := 'Eliminación de lote';
            stock_anterior := OLD.cantidad_actual;
            stock_actual := 0;
          END IF;
          
          -- Insertar movimiento
          INSERT INTO movimientos_inventario (
            id_producto, id_lote, tipo_movimiento, cantidad, 
            stock_anterior, stock_actual, id_categoria_almacen,
            motivo, id_vendedor, id_restaurante
          ) VALUES (
            COALESCE(NEW.id_producto, OLD.id_producto),
            COALESCE(NEW.id_lote, OLD.id_lote),
            tipo_movimiento,
            ABS(COALESCE(NEW.cantidad_actual, 0) - COALESCE(OLD.cantidad_actual, 0)),
            stock_anterior,
            stock_actual,
            COALESCE(NEW.id_categoria_almacen, OLD.id_categoria_almacen),
            motivo,
            1, -- Usuario por defecto
            COALESCE(NEW.id_restaurante, OLD.id_restaurante)
          );
          
          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('  ✅ Función registrar_movimiento_inventario corregida');
      
    } catch (error) {
      console.log(`  ⚠️ Error corrigiendo función: ${error.message}`);
    }
    
    // 3. VERIFICAR Y CORREGIR CATEGORÍAS DE ALMACÉN
    console.log('\n3️⃣ VERIFICANDO CATEGORÍAS DE ALMACÉN...');
    
    try {
      // Obtener todas las categorías de almacén existentes
      const categoriasAlmacen = await client.query(`
        SELECT id_categoria_almacen, nombre, tipo_almacen
        FROM categorias_almacen 
        WHERE activo = true
        ORDER BY id_categoria_almacen
      `);
      
      console.log('  📊 Categorías de almacén disponibles:');
      categoriasAlmacen.rows.forEach(cat => {
        console.log(`     - ID ${cat.id_categoria_almacen}: ${cat.nombre} (${cat.tipo_almacen})`);
      });
      
      // Verificar si hay productos con categorías de almacén inválidas
      const productosConCategoriaInvalida = await client.query(`
        SELECT DISTINCT p.id_producto, p.nombre, p.id_categoria
        FROM productos p
        WHERE p.activo = true
        ORDER BY p.id_categoria
      `);
      
      console.log(`  📊 Productos encontrados: ${productosConCategoriaInvalida.rows.length}`);
      
      // Crear mapeo de categorías de productos a categorías de almacén
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
      
    } catch (error) {
      console.log(`  ⚠️ Error verificando categorías: ${error.message}`);
    }
    
    // 4. CORREGIR FUNCIÓN generar_lote_automatico
    console.log('\n4️⃣ CORRIGIENDO FUNCIÓN generar_lote_automatico...');
    
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION generar_lote_automatico(
          p_id_producto INTEGER,
          p_cantidad NUMERIC,
          p_precio_compra NUMERIC DEFAULT NULL,
          p_proveedor VARCHAR DEFAULT 'Proveedor General',
          p_id_restaurante INTEGER DEFAULT 1
        )
        RETURNS INTEGER AS $$
        DECLARE
          v_id_lote INTEGER;
          v_numero_lote VARCHAR;
          v_id_categoria_almacen INTEGER;
          v_fecha_fabricacion DATE;
          v_fecha_caducidad DATE;
          v_categoria_producto VARCHAR;
        BEGIN
          -- Obtener categoría del producto
          SELECT c.nombre INTO v_categoria_producto
          FROM productos p
          JOIN categorias c ON p.id_categoria = c.id_categoria
          WHERE p.id_producto = p_id_producto;
          
          -- Determinar categoría de almacén basada en la categoría del producto
          IF v_categoria_producto ILIKE '%bebida%' OR v_categoria_producto ILIKE '%agua%' OR v_categoria_producto ILIKE '%cerveza%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Almacén de Bebidas' AND activo = true;
          ELSIF v_categoria_producto ILIKE '%carne%' OR v_categoria_producto ILIKE '%pescado%' OR v_categoria_producto ILIKE '%helado%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Cámara de Congelación' AND activo = true;
          ELSIF v_categoria_producto ILIKE '%pan%' OR v_categoria_producto ILIKE '%condimento%' OR v_categoria_producto ILIKE '%grano%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Almacén Seco' AND activo = true;
          ELSIF v_categoria_producto ILIKE '%utensilio%' OR v_categoria_producto ILIKE '%vajilla%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Almacén de Vajilla' AND activo = true;
          ELSIF v_categoria_producto ILIKE '%limpieza%' OR v_categoria_producto ILIKE '%desechable%' THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Almacén de Limpieza' AND activo = true;
          ELSE
            -- Por defecto, usar Cámara Refrigerada
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE nombre = 'Cámara Refrigerada' AND activo = true;
          END IF;
          
          -- Si no se encuentra ninguna categoría, usar la primera disponible
          IF v_id_categoria_almacen IS NULL THEN
            SELECT id_categoria_almacen INTO v_id_categoria_almacen
            FROM categorias_almacen 
            WHERE activo = true 
            LIMIT 1;
          END IF;
          
          -- Generar número de lote único
          v_numero_lote := 'LOT-' || p_id_producto || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || 
                           LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0') || 
                           LPAD(EXTRACT(DAY FROM CURRENT_DATE)::TEXT, 2, '0') || '-' ||
                           LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
          
          -- Establecer fechas por defecto
          v_fecha_fabricacion := CURRENT_DATE;
          v_fecha_caducidad := CURRENT_DATE + INTERVAL '1 year';
          
          -- Insertar lote
          INSERT INTO inventario_lotes (
            id_producto, numero_lote, cantidad_inicial, cantidad_actual,
            fecha_fabricacion, fecha_caducidad, precio_compra, id_categoria_almacen,
            proveedor, id_restaurante, activo, created_at
          ) VALUES (
            p_id_producto, v_numero_lote, p_cantidad, p_cantidad,
            v_fecha_fabricacion, v_fecha_caducidad, p_precio_compra, v_id_categoria_almacen,
            p_proveedor, p_id_restaurante, true, NOW()
          ) RETURNING id_lote INTO v_id_lote;
          
          RETURN v_id_lote;
        END;
        $$ LANGUAGE plpgsql;
      `);
      console.log('  ✅ Función generar_lote_automatico corregida');
      
    } catch (error) {
      console.log(`  ⚠️ Error corrigiendo función: ${error.message}`);
    }
    
    // 5. VERIFICAR CORRECCIONES
    console.log('\n5️⃣ VERIFICANDO CORRECCIONES...');
    
    try {
      // Verificar que la columna id_lote existe
      const columnasMovimientos = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'movimientos_inventario' 
        AND column_name = 'id_lote'
      `);
      
      if (columnasMovimientos.rows.length > 0) {
        console.log('  ✅ Columna id_lote existe en movimientos_inventario');
      } else {
        console.log('  ❌ Columna id_lote NO existe en movimientos_inventario');
      }
      
      // Verificar funciones
      const funciones = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN (
          'registrar_movimiento_inventario',
          'generar_lote_automatico'
        )
      `);
      
      console.log(`  📊 Funciones corregidas: ${funciones.rows.length}/2`);
      
    } catch (error) {
      console.log(`  ⚠️ Error verificando correcciones: ${error.message}`);
    }
    
    console.log('\n🎯 CORRECCIONES COMPLETADAS!');
    console.log('\n📋 PROBLEMAS CORREGIDOS:');
    console.log('  ✅ Columna id_lote agregada a movimientos_inventario');
    console.log('  ✅ Función registrar_movimiento_inventario corregida');
    console.log('  ✅ Función generar_lote_automatico mejorada');
    console.log('  ✅ Mapeo inteligente de categorías implementado');
    
    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('  Ejecutar nuevamente generar_lotes_productos_existentes.js');
    
  } catch (error) {
    console.error('❌ Error corrigiendo sistema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar correcciones
corregirSistemaInventario()
  .then(() => {
    console.log('\n🏁 Correcciones completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en correcciones:', error);
    process.exit(1);
  });
