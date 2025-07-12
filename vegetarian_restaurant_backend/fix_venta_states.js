const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'menta_restobar_db',
  user: 'postgres',
  password: '69512310Anacleta'
});

async function fixVentaStates() {
  try {
    console.log('=== CORRIGIENDO ESTADOS DE VENTAS ===');
    
    // 1. Verificar ventas con estado 'abierta'
    const checkQuery = `
      SELECT 
        id_venta,
        fecha,
        estado,
        mesa_numero,
        total,
        tipo_servicio
      FROM ventas 
      WHERE estado = 'abierta'
      ORDER BY id_venta DESC;
    `;
    
    const { rows: ventasAbiertas } = await pool.query(checkQuery);
    console.log('\n1. VENTAS CON ESTADO "ABIERTA":');
    console.log('Cantidad encontradas:', ventasAbiertas.length);
    console.table(ventasAbiertas);
    
    if (ventasAbiertas.length === 0) {
      console.log('\n✅ No hay ventas con estado "abierta" para corregir.');
      return;
    }
    
    // 2. Actualizar ventas a estado 'recibido'
    const updateQuery = `
      UPDATE ventas
      SET estado = 'recibido'
      WHERE estado = 'abierta'
      RETURNING id_venta, estado;
    `;
    
    const { rows: ventasActualizadas } = await pool.query(updateQuery);
    console.log('\n2. VENTAS ACTUALIZADAS:');
    console.log('Cantidad actualizadas:', ventasActualizadas.length);
    console.table(ventasActualizadas);
    
    // 3. Verificar el resultado
    const verifyQuery = `
      SELECT 
        id_venta,
        fecha,
        estado,
        mesa_numero,
        total,
        tipo_servicio
      FROM ventas 
      WHERE estado IN ('recibido', 'en_preparacion', 'listo_para_servir')
      ORDER BY id_venta DESC
      LIMIT 10;
    `;
    
    const { rows: ventasParaCocina } = await pool.query(verifyQuery);
    console.log('\n3. VENTAS PARA COCINA (después de la corrección):');
    console.log('Cantidad para cocina:', ventasParaCocina.length);
    console.table(ventasParaCocina);
    
    console.log('\n✅ Corrección completada exitosamente.');
    
  } catch (error) {
    console.error('❌ Error al corregir estados de ventas:', error);
  } finally {
    await pool.end();
  }
}

fixVentaStates(); 