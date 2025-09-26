const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function createTestSubscriptions() {
  try {
    console.log('🔧 Creando suscripciones de prueba para cada plan...\n');

    // Mapeo de planes
    const planMapping = {
      'test_basico': { planId: 1, planName: 'basico' },
      'test_profesional': { planId: 2, planName: 'profesional' },
      'test_avanzado': { planId: 3, planName: 'avanzado' },
      'test_enterprise': { planId: 4, planName: 'enterprise' }
    };

    for (const [username, planInfo] of Object.entries(planMapping)) {
      console.log(`🔄 Creando suscripción para ${username} (Plan: ${planInfo.planName})`);
      
      // Verificar si ya existe una suscripción activa
      const existingQuery = `
        SELECT s.*, p.nombre as plan_nombre
        FROM suscripciones s
        JOIN planes p ON s.id_plan = p.id_plan
        WHERE s.id_restaurante = 7 AND s.estado = 'activa'
        ORDER BY s.created_at DESC
        LIMIT 1
      `;
      const existingResult = await pool.query(existingQuery);
      
      if (existingResult.rows.length > 0) {
        console.log(`⚠️  Ya existe una suscripción activa: ${existingResult.rows[0].plan_nombre}`);
        console.log(`   Cancelando suscripción anterior...`);
        
        // Cancelar suscripción anterior
        const cancelQuery = `
          UPDATE suscripciones 
          SET estado = 'cancelada' 
          WHERE id_restaurante = 7 AND estado = 'activa'
        `;
        await pool.query(cancelQuery);
      }

      // Crear nueva suscripción
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

      const insertResult = await pool.query(insertQuery, [planInfo.planId]);
      
      console.log(`✅ Suscripción creada para plan ${planInfo.planName} (ID: ${insertResult.rows[0].id_suscripcion})`);
      console.log('');
    }

    console.log('🎉 Todas las suscripciones de prueba han sido creadas!');
    console.log('\n📋 Estado actual:');
    console.log('- Restaurante 7 ahora tiene el plan ENTERPRISE activo');
    console.log('- Puedes cambiar manualmente el plan desde el admin panel');
    console.log('- O usar los scripts de prueba para cambiar entre planes');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestSubscriptions();

