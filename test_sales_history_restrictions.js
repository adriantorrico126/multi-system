const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function testSalesHistoryRestrictions() {
  try {
    console.log('🧪 Probando restricciones del historial de ventas...\n');

    // Cambiar al plan avanzado primero (con funciones avanzadas)
    console.log('🔄 Paso 1: Cambiando al plan Avanzado ($99) para verificar acceso completo...');
    await changePlan(3, 'avanzado'); // ID 3 = plan avanzado
    
    console.log('✅ Plan Avanzado activo');
    console.log('📱 Prueba manual:');
    console.log('1. Abre el frontend del POS (http://localhost:5173)');
    console.log('2. Inicia sesión con testbasico / 123456');
    console.log('3. Ve al historial de ventas > Funciones Avanzadas');
    console.log('4. Deberías ver las opciones de exportación (fechas, botones, etc.)');
    console.log('');
    
    console.log('⏳ Esperando 10 segundos para que pruebes...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Cambiar al plan profesional (sin funciones avanzadas)
    console.log('🔄 Paso 2: Cambiando al plan Profesional ($49) para verificar restricciones...');
    await changePlan(2, 'profesional'); // ID 2 = plan profesional
    
    console.log('✅ Plan Profesional activo');
    console.log('📱 Prueba manual:');
    console.log('1. Recarga la página del POS (F5)');
    console.log('2. Ve al historial de ventas > Funciones Avanzadas');
    console.log('3. Deberías ver el mensaje profesional de restricción');
    console.log('4. Con información de contacto y opción de upgrade');
    console.log('');
    
    console.log('🎯 Si ves el mensaje de restricción, ¡las funciones están funcionando correctamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

async function changePlan(planId, planName) {
  // Cancelar suscripción actual
  const cancelQuery = `
    UPDATE suscripciones 
    SET estado = 'cancelada' 
    WHERE id_restaurante = 7 AND estado = 'activa'
  `;
  await pool.query(cancelQuery);

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
    )
  `;
  
  await pool.query(insertQuery, [planId]);
  
  // Verificar el cambio
  const verifyQuery = `
    SELECT p.nombre, p.funcionalidades
    FROM suscripciones s
    JOIN planes p ON s.id_plan = p.id_plan
    WHERE s.id_restaurante = 7 AND s.estado = 'activa'
    ORDER BY s.created_at DESC
    LIMIT 1
  `;
  const verifyResult = await pool.query(verifyQuery);
  
  if (verifyResult.rows.length > 0) {
    const subscription = verifyResult.rows[0];
    console.log(`✅ Plan cambiado a: ${subscription.nombre}`);
    console.log(`📊 Funcionalidades: ${JSON.stringify(subscription.funcionalidades, null, 2)}`);
  }
}

testSalesHistoryRestrictions();

