const { pool } = require('./src/config/database');

async function fixVentasSinPago() {
  try {
    console.log('🔧 Corrigiendo ventas sin método de pago...');
    
    // 1. Verificar ventas sin método de pago
    const ventasSinPago = await pool.query(`
      SELECT COUNT(*) as total 
      FROM ventas 
      WHERE id_pago IS NULL OR id_pago = 0
    `);
    
    console.log('📊 Ventas sin método de pago:', ventasSinPago.rows[0].total);
    
    if (ventasSinPago.rows[0].total > 0) {
      // 2. Obtener el primer método de pago disponible
      const primerMetodo = await pool.query(`
        SELECT id_pago, descripcion 
        FROM metodos_pago 
        WHERE id_restaurante = 1 AND activo = true 
        ORDER BY id_pago 
        LIMIT 1
      `);
      
      if (primerMetodo.rows.length > 0) {
        const metodoId = primerMetodo.rows[0].id_pago;
        const metodoDesc = primerMetodo.rows[0].descripcion;
        
        console.log(`✅ Usando método de pago: ${metodoDesc} (ID: ${metodoId})`);
        
        // 3. Actualizar ventas sin método de pago
        const resultado = await pool.query(`
          UPDATE ventas 
          SET id_pago = $1 
          WHERE (id_pago IS NULL OR id_pago = 0) AND id_restaurante = 1
        `, [metodoId]);
        
        console.log(`✅ Ventas actualizadas: ${resultado.rowCount}`);
        
        // 4. Verificar el resultado
        const ventasActualizadas = await pool.query(`
          SELECT 
            v.id_venta,
            v.id_pago,
            mp.descripcion as metodo_pago,
            v.total,
            v.fecha
          FROM ventas v
          LEFT JOIN metodos_pago mp ON v.id_pago = mp.id_pago
          WHERE v.id_restaurante = 1
          ORDER BY v.fecha DESC
          LIMIT 10
        `);
        
        console.log('📋 Ventas actualizadas (primeras 10):');
        ventasActualizadas.rows.forEach(venta => {
          console.log(`  ID ${venta.id_venta}: ${venta.metodo_pago} - Bs${venta.total} - ${venta.fecha}`);
        });
        
      } else {
        console.log('❌ No hay métodos de pago disponibles');
      }
    } else {
      console.log('✅ No hay ventas sin método de pago');
    }
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await pool.end();
  }
}

fixVentasSinPago(); 