const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres', 
  password: '6951230Anacleta',
  database: 'sistempos',
  port: 5432
});

async function fixFunctionAmbiguity() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 CORRIGIENDO AMBIGÜEDAD EN FUNCIÓN obtener_stock_sucursal...\n');
    
    // Corregir función obtener_stock_sucursal
    await client.query(`
      CREATE OR REPLACE FUNCTION obtener_stock_sucursal(
        p_id_producto INTEGER,
        p_id_sucursal INTEGER
      )
      RETURNS INTEGER AS $$
      DECLARE
        stock_actual INTEGER;
      BEGIN
        SELECT ss.stock_actual INTO stock_actual
        FROM stock_sucursal ss
        WHERE ss.id_producto = p_id_producto 
          AND ss.id_sucursal = p_id_sucursal 
          AND ss.activo = true;
        
        RETURN COALESCE(stock_actual, 0);
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Función obtener_stock_sucursal corregida');
    
    // Corregir función actualizar_stock_sucursal
    await client.query(`
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
        SELECT ss.stock_actual INTO stock_anterior
        FROM stock_sucursal ss
        WHERE ss.id_producto = p_id_producto 
          AND ss.id_sucursal = p_id_sucursal 
          AND ss.activo = true;
        
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
    `);
    
    console.log('✅ Función actualizar_stock_sucursal corregida');
    
    // Corregir función actualizar_stock_venta
    await client.query(`
      CREATE OR REPLACE FUNCTION actualizar_stock_venta(
        p_id_producto INTEGER,
        p_id_sucursal INTEGER,
        p_cantidad INTEGER,
        p_id_vendedor INTEGER DEFAULT NULL
      )
      RETURNS JSON AS $$
      DECLARE
        stock_actual_sucursal INTEGER;
        stock_nuevo INTEGER;
        resultado JSON;
        movimiento_id INTEGER;
      BEGIN
        -- Obtener stock actual en la sucursal
        SELECT ss.stock_actual INTO stock_actual_sucursal
        FROM stock_sucursal ss
        WHERE ss.id_producto = p_id_producto 
          AND ss.id_sucursal = p_id_sucursal 
          AND ss.activo = true;
        
        -- Verificar si hay stock suficiente
        IF stock_actual_sucursal IS NULL OR stock_actual_sucursal < p_cantidad THEN
          RETURN json_build_object(
            'success', false,
            'error', 'Stock insuficiente en la sucursal',
            'stock_disponible', COALESCE(stock_actual_sucursal, 0),
            'cantidad_solicitada', p_cantidad
          );
        END IF;
        
        -- Calcular nuevo stock
        stock_nuevo := stock_actual_sucursal - p_cantidad;
        
        -- Actualizar stock en la sucursal
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
          'venta',
          p_cantidad,
          stock_actual_sucursal,
          stock_nuevo,
          p_id_vendedor,
          s.id_restaurante,
          'Venta realizada en sucursal'
        FROM sucursales s
        WHERE s.id_sucursal = p_id_sucursal
        RETURNING id_movimiento INTO movimiento_id;
        
        -- Actualizar stock global del producto
        UPDATE productos 
        SET stock_actual = (
          SELECT COALESCE(SUM(ss.stock_actual), 0)
          FROM stock_sucursal ss
          JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
          WHERE ss.id_producto = p_id_producto
            AND s.id_restaurante = (SELECT id_restaurante FROM sucursales WHERE id_sucursal = p_id_sucursal)
            AND ss.activo = true
        )
        WHERE id_producto = p_id_producto;
        
        -- Retornar resultado
        resultado := json_build_object(
          'success', true,
          'id_movimiento', movimiento_id,
          'stock_anterior', stock_actual_sucursal,
          'stock_nuevo', stock_nuevo,
          'cantidad_vendida', p_cantidad
        );
        
        RETURN resultado;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Función actualizar_stock_venta corregida');
    
    console.log('\n🎉 TODAS LAS FUNCIONES CORREGIDAS EXITOSAMENTE!');
    
  } catch (error) {
    console.error('❌ ERROR CORRIGIENDO FUNCIONES:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección
if (require.main === module) {
  fixFunctionAmbiguity()
    .then(() => {
      console.log('\n✅ Corrección completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en corrección:', error);
      process.exit(1);
    });
}

module.exports = { fixFunctionAmbiguity };











