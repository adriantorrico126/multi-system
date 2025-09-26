const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function checkAndFixSucursalesLimit() {
  try {
    console.log('🔍 Verificando límite de sucursales para restaurante 7...\n');

    // Verificar sucursales del restaurante 7
    const sucursalesQuery = `
      SELECT id_sucursal, nombre, ciudad, direccion, activo, created_at
      FROM sucursales 
      WHERE id_restaurante = 7
      ORDER BY created_at DESC
    `;
    const sucursalesResult = await pool.query(sucursalesQuery);
    
    console.log('📋 Sucursales del restaurante 7:');
    sucursalesResult.rows.forEach(sucursal => {
      console.log(`- ID: ${sucursal.id_sucursal}`);
      console.log(`  Nombre: ${sucursal.nombre}`);
      console.log(`  Ciudad: ${sucursal.ciudad}`);
      console.log(`  Dirección: ${sucursal.direccion}`);
      console.log(`  Activa: ${sucursal.activo}`);
      console.log(`  Creada: ${sucursal.created_at}`);
      console.log('');
    });

    console.log(`📊 Total de sucursales: ${sucursalesResult.rows.length}`);

    // Verificar límite del plan profesional
    const planQuery = `
      SELECT p.max_sucursales, p.nombre
      FROM planes p
      JOIN suscripciones s ON p.id_plan = s.id_plan
      WHERE s.id_restaurante = 7 
        AND s.estado = 'activa'
        AND s.fecha_fin > NOW()
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    const planResult = await pool.query(planQuery);
    
    if (planResult.rows.length > 0) {
      const plan = planResult.rows[0];
      console.log(`📋 Plan actual: ${plan.nombre}`);
      console.log(`📊 Límite de sucursales: ${plan.max_sucursales}`);
      console.log(`📊 Sucursales actuales: ${sucursalesResult.rows.length}`);
      console.log('');

      if (sucursalesResult.rows.length >= plan.max_sucursales) {
        console.log('⚠️  PROBLEMA IDENTIFICADO: El restaurante está en el límite de sucursales');
        console.log('');
        
        // Opción 1: Desactivar una sucursal temporalmente
        console.log('🔧 SOLUCIÓN 1: Desactivar una sucursal temporalmente');
        const sucursalToDeactivate = sucursalesResult.rows[1]; // Desactivar la segunda sucursal
        if (sucursalToDeactivate) {
          const deactivateQuery = `
            UPDATE sucursales 
            SET activo = false 
            WHERE id_sucursal = $1
          `;
          await pool.query(deactivateQuery, [sucursalToDeactivate.id_sucursal]);
          console.log(`✅ Sucursal ${sucursalToDeactivate.nombre} (ID: ${sucursalToDeactivate.id_sucursal}) desactivada temporalmente`);
        }

        // Opción 2: Actualizar el plan a uno con más sucursales
        console.log('');
        console.log('🔧 SOLUCIÓN 2: Actualizar a plan con más sucursales');
        
        // Verificar planes disponibles con más sucursales
        const availablePlansQuery = `
          SELECT id_plan, nombre, max_sucursales, precio_mensual
          FROM planes 
          WHERE max_sucursales > $1 AND activo = true
          ORDER BY max_sucursales ASC
        `;
        const availablePlansResult = await pool.query(availablePlansQuery, [plan.max_sucursales]);
        
        if (availablePlansResult.rows.length > 0) {
          console.log('📋 Planes disponibles con más sucursales:');
          availablePlansResult.rows.forEach(availablePlan => {
            console.log(`- ${availablePlan.nombre}: ${availablePlan.max_sucursales} sucursales, $${availablePlan.precio_mensual}/mes`);
          });
          
          // Actualizar al plan con más sucursales (el más económico)
          const newPlan = availablePlansResult.rows[0];
          console.log('');
          console.log(`🔄 Actualizando al plan ${newPlan.nombre}...`);
          
          // Desactivar suscripción actual
          const deactivateSubscriptionQuery = `
            UPDATE suscripciones 
            SET estado = 'cancelada' 
            WHERE id_restaurante = 7 AND estado = 'activa'
          `;
          await pool.query(deactivateSubscriptionQuery);
          
          // Crear nueva suscripción
          const newSubscriptionQuery = `
            INSERT INTO suscripciones (
              id_restaurante, id_plan, estado, fecha_inicio, fecha_fin,
              metodo_pago, auto_renovacion, notificaciones_email, created_at
            ) VALUES (
              7, $1, 'activa', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month',
              'mensual', true, true, NOW()
            )
          `;
          await pool.query(newSubscriptionQuery, [newPlan.id_plan]);
          
          console.log(`✅ Restaurante 7 actualizado al plan ${newPlan.nombre}`);
          console.log(`📊 Nuevo límite de sucursales: ${newPlan.max_sucursales}`);
        }
      } else {
        console.log('✅ El restaurante está dentro del límite de sucursales');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAndFixSucursalesLimit();
