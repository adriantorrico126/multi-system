const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function changeToBasicPlan() {
  try {
    console.log('🔄 Cambiando restaurante 7 al plan básico...\n');

    // Obtener el plan básico
    const planQuery = `
      SELECT id_plan, nombre, max_sucursales
      FROM planes 
      WHERE nombre = 'basico' AND activo = true
    `;
    const planResult = await pool.query(planQuery);
    
    if (planResult.rows.length === 0) {
      console.log('❌ No se encontró el plan básico');
      return;
    }

    const plan = planResult.rows[0];
    console.log(`📋 Plan encontrado: ${plan.nombre}`);
    console.log(`📊 Límite de sucursales: ${plan.max_sucursales}`);
    console.log('');

    // Cancelar suscripción actual
    const cancelQuery = `
      UPDATE suscripciones 
      SET estado = 'cancelada' 
      WHERE id_restaurante = 7 AND estado = 'activa'
    `;
    await pool.query(cancelQuery);
    console.log('✅ Suscripción anterior cancelada');

    // Crear nueva suscripción al plan básico
    const insertQuery = `
      INSERT INTO suscripciones (
        id_restaurante, 
        id_plan, 
        estado, 
        fecha_inicio, 
        fecha_fin,
        metodo_pago, 
        auto_renovacion, 
        notificaciones_email, 
        created_at
      ) VALUES (
        7, $1, 'activa', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month',
        'mensual', true, true, NOW()
      ) RETURNING id_suscripcion
    `;

    const insertResult = await pool.query(insertQuery, [plan.id_plan]);
    
    console.log('✅ Nueva suscripción al plan básico creada');
    console.log(`- ID suscripción: ${insertResult.rows[0].id_suscripcion}`);
    console.log('');

    // Ajustar sucursales para el plan básico (solo 1 sucursal)
    const sucursalesQuery = `
      SELECT id_sucursal, nombre, activo
      FROM sucursales 
      WHERE id_restaurante = 7
      ORDER BY created_at DESC
    `;
    const sucursalesResult = await pool.query(sucursalesQuery);
    
    console.log('🔧 Ajustando sucursales para plan básico (máximo 1):');
    
    // Activar solo la primera sucursal
    if (sucursalesResult.rows.length > 0) {
      const firstSucursal = sucursalesResult.rows[0];
      
      // Activar la primera sucursal
      const activateQuery = `
        UPDATE sucursales 
        SET activo = true 
        WHERE id_sucursal = $1
      `;
      await pool.query(activateQuery, [firstSucursal.id_sucursal]);
      console.log(`✅ Sucursal ${firstSucursal.nombre} activada`);
      
      // Desactivar las demás sucursales
      for (let i = 1; i < sucursalesResult.rows.length; i++) {
        const sucursal = sucursalesResult.rows[i];
        const deactivateQuery = `
          UPDATE sucursales 
          SET activo = false 
          WHERE id_sucursal = $1
        `;
        await pool.query(deactivateQuery, [sucursal.id_sucursal]);
        console.log(`✅ Sucursal ${sucursal.nombre} desactivada`);
      }
    }

    // Verificar que la suscripción se creó correctamente
    const verifyQuery = `
      SELECT s.*, p.nombre as plan_nombre, p.funcionalidades
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = 7 AND s.estado = 'activa'
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    const verifyResult = await pool.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      const subscription = verifyResult.rows[0];
      console.log('');
      console.log('✅ Verificación exitosa:');
      console.log(`- Plan activo: ${subscription.plan_nombre}`);
      console.log(`- Funcionalidades: ${JSON.stringify(subscription.funcionalidades, null, 2)}`);
      console.log('');
      console.log('🎯 Ahora el restaurante 7 tiene el plan básico.');
      console.log('🔍 Debería tener acceso restringido a mesas, arqueo, cocina, etc.');
      console.log('');
      console.log('📱 Prueba el frontend del POS ahora para ver si aparecen los mensajes de restricción.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

changeToBasicPlan();
