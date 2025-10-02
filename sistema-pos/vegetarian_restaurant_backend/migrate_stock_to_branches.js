const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function migrateStockToBranches() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 INICIANDO MIGRACIÓN DE STOCK A SUCURSALES...\n');
    
    await client.query('BEGIN');
    
    // 1. Verificar estado actual
    console.log('1️⃣ VERIFICANDO ESTADO ACTUAL...');
    const currentState = await client.query(`
      SELECT 
        COUNT(*) as total_productos,
        SUM(stock_actual) as stock_total,
        COUNT(DISTINCT id_restaurante) as restaurantes
      FROM productos 
      WHERE activo = true
    `);
    console.log(`   Productos activos: ${currentState.rows[0].total_productos}`);
    console.log(`   Stock total: ${currentState.rows[0].stock_total}`);
    console.log(`   Restaurantes: ${currentState.rows[0].restaurantes}`);
    
    // 2. Crear tabla stock_sucursal si no existe
    console.log('\n2️⃣ CREANDO TABLA STOCK_SUCURSAL...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS stock_sucursal (
        id_stock_sucursal SERIAL PRIMARY KEY,
        id_producto INTEGER NOT NULL,
        id_sucursal INTEGER NOT NULL,
        stock_actual INTEGER DEFAULT 0 CHECK (stock_actual >= 0),
        stock_minimo INTEGER DEFAULT 5 CHECK (stock_minimo >= 0),
        stock_maximo INTEGER DEFAULT 100 CHECK (stock_maximo >= 0),
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        CONSTRAINT fk_stock_producto FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE,
        CONSTRAINT fk_stock_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
        CONSTRAINT unique_stock_sucursal UNIQUE (id_producto, id_sucursal),
        CONSTRAINT check_stock_min_max CHECK (stock_minimo <= stock_maximo)
      )
    `;
    await client.query(createTableQuery);
    console.log('   ✅ Tabla stock_sucursal creada');
    
    // 3. Crear índices
    console.log('\n3️⃣ CREANDO ÍNDICES...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_stock_sucursal_producto ON stock_sucursal(id_producto)',
      'CREATE INDEX IF NOT EXISTS idx_stock_sucursal_sucursal ON stock_sucursal(id_sucursal)',
      'CREATE INDEX IF NOT EXISTS idx_stock_sucursal_activo ON stock_sucursal(activo)',
      'CREATE INDEX IF NOT EXISTS idx_stock_sucursal_composite ON stock_sucursal(id_sucursal, id_producto, activo)'
    ];
    
    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    console.log('   ✅ Índices creados');
    
    // 4. Migrar datos de productos a stock por sucursal
    console.log('\n4️⃣ MIGRANDO DATOS DE PRODUCTOS...');
    const migrationQuery = `
      INSERT INTO stock_sucursal (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo)
      SELECT 
        p.id_producto,
        s.id_sucursal,
        CASE 
          WHEN p.stock_actual > 0 THEN 
            GREATEST(1, FLOOR(p.stock_actual / (
              SELECT COUNT(*) FROM sucursales s2 
              WHERE s2.id_restaurante = p.id_restaurante AND s2.activo = true
            )))
          ELSE 0 
        END,
        5, -- Stock mínimo por defecto
        CASE 
          WHEN p.stock_actual > 0 THEN GREATEST(p.stock_actual * 2, 10)
          ELSE 100 
        END -- Stock máximo basado en stock actual (mínimo 10)
      FROM productos p
      JOIN sucursales s ON s.id_restaurante = p.id_restaurante
      WHERE p.activo = true 
        AND s.activo = true
      ON CONFLICT (id_producto, id_sucursal) DO NOTHING
    `;
    
    const migrationResult = await client.query(migrationQuery);
    console.log(`   ✅ Registros creados: ${migrationResult.rowCount}`);
    
    // 5. Migrar inventario_lotes por sucursal
    console.log('\n5️⃣ MIGRANDO INVENTARIO LOTES...');
    
    // Agregar columna id_sucursal si no existe
    const addSucursalColumn = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'inventario_lotes' 
              AND column_name = 'id_sucursal'
          ) THEN
              ALTER TABLE inventario_lotes ADD COLUMN id_sucursal INTEGER;
              ALTER TABLE inventario_lotes ADD CONSTRAINT fk_lotes_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL;
          END IF;
      END $$;
    `;
    await client.query(addSucursalColumn);
    console.log('   ✅ Columna id_sucursal agregada a inventario_lotes');
    
    // Asignar lotes a sucursales (distribuir equitativamente)
    const assignLotesQuery = `
      UPDATE inventario_lotes 
      SET id_sucursal = (
        SELECT s.id_sucursal
        FROM sucursales s
        JOIN productos p ON p.id_restaurante = s.id_restaurante
        WHERE p.id_producto = inventario_lotes.id_producto 
          AND s.activo = true
        ORDER BY s.id_sucursal
        LIMIT 1
      )
      WHERE id_sucursal IS NULL
    `;
    
    const lotesResult = await client.query(assignLotesQuery);
    console.log(`   ✅ Lotes asignados a sucursales: ${lotesResult.rowCount}`);
    
    // 6. Actualizar movimientos_inventario
    console.log('\n6️⃣ ACTUALIZANDO MOVIMIENTOS_INVENTARIO...');
    
    // Agregar columna id_sucursal si no existe
    const addMovimientosSucursal = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'movimientos_inventario' 
              AND column_name = 'id_sucursal'
          ) THEN
              ALTER TABLE movimientos_inventario ADD COLUMN id_sucursal INTEGER;
              ALTER TABLE movimientos_inventario ADD CONSTRAINT fk_movimientos_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal) ON DELETE SET NULL;
          END IF;
      END $$;
    `;
    await client.query(addMovimientosSucursal);
    console.log('   ✅ Columna id_sucursal agregada a movimientos_inventario');
    
    // 7. Verificar migración
    console.log('\n7️⃣ VERIFICANDO MIGRACIÓN...');
    const verificationQuery = `
      SELECT 
        COUNT(*) as total_stock_sucursal,
        SUM(stock_actual) as stock_total_migrado,
        COUNT(DISTINCT id_sucursal) as sucursales_con_stock,
        COUNT(DISTINCT id_producto) as productos_con_stock
      FROM stock_sucursal 
      WHERE activo = true
    `;
    
    const verification = await client.query(verificationQuery);
    console.log(`   Registros en stock_sucursal: ${verification.rows[0].total_stock_sucursal}`);
    console.log(`   Stock total migrado: ${verification.rows[0].stock_total_migrado}`);
    console.log(`   Sucursales con stock: ${verification.rows[0].sucursales_con_stock}`);
    console.log(`   Productos con stock: ${verification.rows[0].productos_con_stock}`);
    
    // 8. Crear funciones necesarias
    console.log('\n8️⃣ CREANDO FUNCIONES...');
    
    const createFunctions = `
      -- Función para obtener stock por sucursal
      CREATE OR REPLACE FUNCTION obtener_stock_sucursal(
        p_id_producto INTEGER,
        p_id_sucursal INTEGER
      )
      RETURNS INTEGER AS $$
      DECLARE
        stock_actual INTEGER;
      BEGIN
        SELECT stock_actual INTO stock_actual
        FROM stock_sucursal
        WHERE id_producto = p_id_producto 
          AND id_sucursal = p_id_sucursal 
          AND activo = true;
        
        RETURN COALESCE(stock_actual, 0);
      END;
      $$ LANGUAGE plpgsql;
      
      -- Función para actualizar stock por sucursal
      CREATE OR REPLACE FUNCTION actualizar_stock_sucursal(
        p_id_producto INTEGER,
        p_id_sucursal INTEGER,
        p_cantidad_cambio INTEGER,
        p_tipo_movimiento VARCHAR(50),
        p_id_vendedor INTEGER DEFAULT NULL,
        p_motivo TEXT DEFAULT NULL
      )
      RETURNS JSON AS $$
      DECLARE
        stock_anterior INTEGER;
        stock_nuevo INTEGER;
        movimiento_id INTEGER;
        resultado JSON;
      BEGIN
        -- Obtener stock actual
        SELECT stock_actual INTO stock_anterior
        FROM stock_sucursal
        WHERE id_producto = p_id_producto 
          AND id_sucursal = p_id_sucursal 
          AND activo = true;
        
        -- Si no existe registro, crear uno
        IF stock_anterior IS NULL THEN
          INSERT INTO stock_sucursal (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo)
          VALUES (p_id_producto, p_id_sucursal, 0, 5, 100)
          ON CONFLICT (id_producto, id_sucursal) DO NOTHING;
          
          stock_anterior := 0;
        END IF;
        
        -- Calcular nuevo stock
        stock_nuevo := GREATEST(0, stock_anterior + p_cantidad_cambio);
        
        -- Actualizar stock
        UPDATE stock_sucursal
        SET stock_actual = stock_nuevo,
            updated_at = NOW()
        WHERE id_producto = p_id_producto 
          AND id_sucursal = p_id_sucursal;
        
        -- Registrar movimiento
        INSERT INTO movimientos_inventario (
          id_producto, 
          id_sucursal,
          tipo_movimiento, 
          cantidad, 
          stock_anterior, 
          stock_actual, 
          id_vendedor, 
          id_restaurante,
          motivo
        )
        SELECT 
          p_id_producto,
          p_id_sucursal,
          p_tipo_movimiento,
          ABS(p_cantidad_cambio),
          stock_anterior,
          stock_nuevo,
          p_id_vendedor,
          s.id_restaurante,
          p_motivo
        FROM sucursales s
        WHERE s.id_sucursal = p_id_sucursal
        RETURNING id_movimiento INTO movimiento_id;
        
        -- Retornar resultado
        resultado := json_build_object(
          'success', true,
          'id_movimiento', movimiento_id,
          'stock_anterior', stock_anterior,
          'stock_nuevo', stock_nuevo,
          'cantidad_cambio', p_cantidad_cambio
        );
        
        RETURN resultado;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(createFunctions);
    console.log('   ✅ Funciones creadas');
    
    // 9. Commit de la transacción
    await client.query('COMMIT');
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    
    // 10. Reporte final
    console.log('\n📊 REPORTE FINAL:');
    const finalReport = await client.query(`
      SELECT 
        r.nombre as restaurante,
        COUNT(DISTINCT s.id_sucursal) as sucursales,
        COUNT(DISTINCT ss.id_producto) as productos_con_stock,
        SUM(ss.stock_actual) as stock_total
      FROM restaurantes r
      LEFT JOIN sucursales s ON r.id_restaurante = s.id_restaurante AND s.activo = true
      LEFT JOIN stock_sucursal ss ON s.id_sucursal = ss.id_sucursal AND ss.activo = true
      GROUP BY r.id_restaurante, r.nombre
      ORDER BY r.id_restaurante
    `);
    
    console.log('Stock por restaurante:');
    finalReport.rows.forEach(row => {
      console.log(`  - ${row.restaurante}: ${row.sucursales} sucursales, ${row.productos_con_stock} productos, stock: ${row.stock_total || 0}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ ERROR EN MIGRACIÓN:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración
if (require.main === module) {
  migrateStockToBranches()
    .then(() => {
      console.log('\n🎉 Migración completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en migración:', error);
      process.exit(1);
    });
}

module.exports = { migrateStockToBranches };
