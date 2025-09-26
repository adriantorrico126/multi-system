const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sistempos',
  user: 'postgres',
  password: '6951230Anacleta'
});

async function pruebaPagoDiferido() {
  try {
    console.log('🧪 [PRUEBA] Flujo Completo de Pago Diferido');
    console.log('==========================================');

    // 1. Verificar estado actual de mesas
    console.log('\n📋 ESTADO ACTUAL DE MESAS:');
    const mesasQuery = `
      SELECT numero, estado, total_acumulado, id_venta_actual
      FROM mesas 
      WHERE id_restaurante = 1
      ORDER BY numero
    `;
    const mesasResult = await pool.query(mesasQuery);
    console.table(mesasResult.rows);

    // 2. Verificar ventas recientes con tipo_pago diferido
    console.log('\n📋 VENTAS RECIENTES CON PAGO DIFERIDO:');
    const ventasDiferidoQuery = `
      SELECT 
        v.id_venta,
        v.mesa_numero,
        v.total,
        v.tipo_pago,
        v.estado_pago,
        v.fecha,
        m.estado as estado_mesa
      FROM ventas v
      LEFT JOIN mesas m ON v.mesa_numero = m.numero AND v.id_restaurante = m.id_restaurante
      WHERE v.id_restaurante = 1 
        AND v.tipo_pago = 'diferido'
      ORDER BY v.fecha DESC
      LIMIT 5
    `;
    const ventasDiferidoResult = await pool.query(ventasDiferidoQuery);
    console.table(ventasDiferidoResult.rows);

    // 3. Verificar pagos diferidos pendientes
    console.log('\n📋 PAGOS DIFERIDOS PENDIENTES:');
    const pagosDiferidosQuery = `
      SELECT 
        pd.id_pago_diferido,
        pd.id_venta,
        pd.id_mesa,
        pd.total_pendiente,
        pd.fecha_vencimiento,
        pd.estado,
        v.mesa_numero,
        m.estado as estado_mesa
      FROM pagos_diferidos pd
      LEFT JOIN ventas v ON pd.id_venta = v.id_venta
      LEFT JOIN mesas m ON pd.id_mesa = m.id_mesa
      WHERE pd.id_restaurante = 1
      ORDER BY pd.created_at DESC
      LIMIT 5
    `;
    const pagosDiferidosResult = await pool.query(pagosDiferidosQuery);
    console.table(pagosDiferidosResult.rows);

    // 4. Verificar métodos de pago disponibles
    console.log('\n💳 MÉTODOS DE PAGO DISPONIBLES:');
    const metodosPagoQuery = `
      SELECT id_pago, descripcion, activo
      FROM metodos_pago 
      WHERE id_restaurante = 1
      ORDER BY id_pago
    `;
    const metodosPagoResult = await pool.query(metodosPagoQuery);
    console.table(metodosPagoResult.rows);

    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('\n📝 FLUJO ESPERADO:');
    console.log('1. Usuario selecciona "Pago al Final" en CheckoutModal');
    console.log('2. Frontend envía tipo_pago: "diferido" al backend');
    console.log('3. Backend crea venta con estado_pago: "pendiente"');
    console.log('4. Backend marca mesa con estado: "pendiente_cobro"');
    console.log('5. Backend crea registro en pagos_diferidos');
    console.log('6. Mesa muestra botón "Cobrar" en MesaManagement');
    console.log('7. Al presionar "Cobrar" se abre modal de métodos de pago');
    console.log('8. Usuario selecciona método y confirma pago');
    console.log('9. Mesa se libera y vuelve a estado "libre"');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

pruebaPagoDiferido();
