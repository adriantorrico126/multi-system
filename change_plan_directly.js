const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

/**
 * Función para cambiar el plan del restaurante directamente en la base de datos
 */
async function changePlanDirectly() {
  try {
    console.log('🔄 Cambiando plan del restaurante a Enterprise directamente en la base de datos...\n');
    
    // 1. Crear nueva suscripción Enterprise
    const createSubscriptionQuery = `
      INSERT INTO suscripciones (
        id_restaurante,
        id_plan,
        estado,
        fecha_inicio,
        fecha_fin,
        auto_renovacion,
        created_at,
        updated_at
      ) VALUES (
        1,  -- id_restaurante
        4,  -- id_plan (Enterprise)
        'activa',
        CURRENT_DATE,
        NULL,  -- Sin fecha de fin (ilimitado)
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createSubscriptionQuery);
    console.log('✅ Nueva suscripción Enterprise creada');
    
    // 2. Verificar el cambio
    const verifyQuery = `
      SELECT 
        s.id_restaurante,
        s.id_plan,
        s.estado,
        p.nombre as plan_nombre,
        p.precio_mensual,
        p.max_usuarios,
        p.max_productos,
        p.max_sucursales
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = 1
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    
    const { rows: verifyRows } = await pool.query(verifyQuery);
    
    if (verifyRows.length > 0) {
      const subscription = verifyRows[0];
      console.log('\n📊 Nueva suscripción:');
      console.log(`   - Plan: ${subscription.plan_nombre}`);
      console.log(`   - Estado: ${subscription.estado}`);
      console.log(`   - Precio: $${subscription.precio_mensual}`);
      console.log(`   - Límite Usuarios: ${subscription.max_usuarios} (0 = ilimitado)`);
      console.log(`   - Límite Productos: ${subscription.max_productos} (0 = ilimitado)`);
      console.log(`   - Límite Sucursales: ${subscription.max_sucursales} (0 = ilimitado)`);
      
      console.log('\n🎉 ¡Plan cambiado exitosamente a Enterprise!');
      console.log('   Los errores 403 deberían estar resueltos ahora.');
    }
    
  } catch (error) {
    console.error('❌ Error cambiando plan:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar cambio
changePlanDirectly().catch(console.error);
