const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function fixSucursalesForBasicPlan() {
  try {
    console.log('🔧 Ajustando sucursales para plan básico...\n');

    // Desactivar una sucursal para que solo quede 1 activa
    const sucursalesQuery = `
      SELECT id_sucursal, nombre, activo
      FROM sucursales 
      WHERE id_restaurante = 7
      ORDER BY created_at DESC
    `;
    const sucursalesResult = await pool.query(sucursalesQuery);
    
    console.log('📋 Sucursales actuales del restaurante 7:');
    sucursalesResult.rows.forEach(sucursal => {
      console.log(`- ${sucursal.nombre} (ID: ${sucursal.id_sucursal}): ${sucursal.activo ? 'Activa' : 'Inactiva'}`);
    });
    
    // Desactivar la segunda sucursal (mantener solo la primera activa)
    if (sucursalesResult.rows.length > 1) {
      const sucursalToDeactivate = sucursalesResult.rows[1];
      const deactivateQuery = `
        UPDATE sucursales 
        SET activo = false 
        WHERE id_sucursal = $1
      `;
      await pool.query(deactivateQuery, [sucursalToDeactivate.id_sucursal]);
      console.log(`\n✅ Sucursal ${sucursalToDeactivate.nombre} desactivada`);
    }
    
    // Verificar el estado final
    const finalQuery = `
      SELECT COUNT(*) as total_sucursales,
             COUNT(CASE WHEN activo = true THEN 1 END) as sucursales_activas
      FROM sucursales 
      WHERE id_restaurante = 7
    `;
    const finalResult = await pool.query(finalQuery);
    
    console.log(`\n📊 Estado final:`);
    console.log(`- Total sucursales: ${finalResult.rows[0].total_sucursales}`);
    console.log(`- Sucursales activas: ${finalResult.rows[0].sucursales_activas}`);
    console.log(`- Límite plan básico: 1 sucursal`);
    
    if (finalResult.rows[0].sucursales_activas <= 1) {
      console.log('✅ El restaurante ahora cumple con el límite del plan básico');
    } else {
      console.log('❌ Aún excede el límite del plan básico');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixSucursalesForBasicPlan();
