const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function fixRestaurant7Plan() {
  try {
    console.log('🔧 Solucionando problema del restaurante 7...\n');

    // Obtener el plan avanzado (que permite más sucursales)
    const planQuery = `
      SELECT id_plan, nombre, max_sucursales, precio_mensual
      FROM planes 
      WHERE nombre = 'avanzado' AND activo = true
    `;
    const planResult = await pool.query(planQuery);
    
    if (planResult.rows.length === 0) {
      console.log('❌ No se encontró el plan avanzado');
      return;
    }

    const plan = planResult.rows[0];
    console.log(`📋 Plan encontrado: ${plan.nombre}`);
    console.log(`📊 Límite de sucursales: ${plan.max_sucursales}`);
    console.log(`💰 Precio: $${plan.precio_mensual}/mes`);
    console.log('');

    // Crear nueva suscripción activa
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
        $1, $2, 'activa', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month',
        'mensual', true, true, NOW()
      ) RETURNING id_suscripcion
    `;

    const insertResult = await pool.query(insertQuery, [7, plan.id_plan]);
    
    console.log('✅ Nueva suscripción creada:');
    console.log(`- ID: ${insertResult.rows[0].id_suscripcion}`);
    console.log(`- Restaurante: 7`);
    console.log(`- Plan: ${plan.nombre}`);
    console.log(`- Estado: activa`);
    console.log(`- Fecha inicio: ${new Date().toISOString().split('T')[0]}`);
    console.log(`- Fecha fin: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
    console.log('');

    // Verificar que la suscripción se creó correctamente
    const verifyQuery = `
      SELECT s.*, p.nombre as plan_nombre, p.max_sucursales
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = 7 AND s.estado = 'activa'
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    const verifyResult = await pool.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      const subscription = verifyResult.rows[0];
      console.log('✅ Verificación exitosa:');
      console.log(`- Plan activo: ${subscription.plan_nombre}`);
      console.log(`- Límite de sucursales: ${subscription.max_sucursales}`);
      console.log(`- Estado: ${subscription.estado}`);
      console.log('');
      console.log('🎉 El restaurante 7 ahora debería tener acceso a todas las funcionalidades!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixRestaurant7Plan();
