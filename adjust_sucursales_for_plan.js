const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function adjustSucursalesForPlan() {
  try {
    console.log('🔧 Ajustando sucursales según el plan actual...\n');

    // Obtener plan actual del restaurante 7
    const planQuery = `
      SELECT s.*, p.nombre as plan_nombre, p.max_sucursales
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = 7 
        AND s.estado = 'activa'
        AND s.fecha_fin > NOW()
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    const planResult = await pool.query(planQuery);
    
    if (planResult.rows.length === 0) {
      console.log('❌ No se encontró plan activo para el restaurante 7');
      return;
    }

    const currentPlan = planResult.rows[0];
    console.log(`📋 Plan actual: ${currentPlan.plan_nombre}`);
    console.log(`📊 Límite de sucursales: ${currentPlan.max_sucursales}`);
    console.log('');

    // Obtener sucursales actuales
    const sucursalesQuery = `
      SELECT id_sucursal, nombre, activo
      FROM sucursales 
      WHERE id_restaurante = 7
      ORDER BY created_at DESC
    `;
    const sucursalesResult = await pool.query(sucursalesQuery);
    
    console.log(`📋 Sucursales actuales: ${sucursalesResult.rows.length}`);
    sucursalesResult.rows.forEach(sucursal => {
      console.log(`- ${sucursal.nombre} (ID: ${sucursal.id_sucursal}): ${sucursal.activo ? 'Activa' : 'Inactiva'}`);
    });
    console.log('');

    if (sucursalesResult.rows.length > currentPlan.max_sucursales) {
      console.log(`⚠️  PROBLEMA: El restaurante tiene ${sucursalesResult.rows.length} sucursales pero el plan ${currentPlan.plan_nombre} solo permite ${currentPlan.max_sucursales}`);
      console.log('');
      
      // Desactivar sucursales excedentes
      const sucursalesToDeactivate = sucursalesResult.rows.slice(currentPlan.max_sucursales);
      
      for (const sucursal of sucursalesToDeactivate) {
        const deactivateQuery = `
          UPDATE sucursales 
          SET activo = false 
          WHERE id_sucursal = $1
        `;
        await pool.query(deactivateQuery, [sucursal.id_sucursal]);
        console.log(`✅ Sucursal ${sucursal.nombre} desactivada`);
      }
      
      console.log('');
      console.log('🎉 Sucursales ajustadas correctamente para el plan actual');
    } else {
      console.log('✅ El restaurante está dentro del límite de sucursales');
    }

    // Verificar estado final
    const finalSucursalesQuery = `
      SELECT COUNT(*) as total_sucursales,
             COUNT(CASE WHEN activo = true THEN 1 END) as sucursales_activas
      FROM sucursales 
      WHERE id_restaurante = 7
    `;
    const finalResult = await pool.query(finalSucursalesQuery);
    
    console.log('');
    console.log('📊 Estado final:');
    console.log(`- Total sucursales: ${finalResult.rows[0].total_sucursales}`);
    console.log(`- Sucursales activas: ${finalResult.rows[0].sucursales_activas}`);
    console.log(`- Límite del plan: ${currentPlan.max_sucursales}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

adjustSucursalesForPlan();

