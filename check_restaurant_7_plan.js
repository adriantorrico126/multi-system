const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function checkRestaurant7Plan() {
  try {
    console.log('🔍 Verificando plan del restaurante 7...\n');

    // Verificar información del restaurante
    const restaurantQuery = `
      SELECT id_restaurante, nombre, email, telefono, direccion, activo
      FROM restaurantes 
      WHERE id_restaurante = 7
    `;
    const restaurantResult = await pool.query(restaurantQuery);
    
    if (restaurantResult.rows.length === 0) {
      console.log('❌ No se encontró el restaurante 7');
      return;
    }
    
    console.log('📋 Información del restaurante:');
    console.log(restaurantResult.rows[0]);
    console.log('');

    // Verificar suscripción activa
    const subscriptionQuery = `
      SELECT s.*, p.nombre as plan_nombre, p.funcionalidades, p.precio_mensual
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = 7 
        AND s.estado = 'activa'
        AND s.fecha_fin > NOW()
      ORDER BY s.fecha_inicio DESC
      LIMIT 1
    `;
    const subscriptionResult = await pool.query(subscriptionQuery);
    
    if (subscriptionResult.rows.length === 0) {
      console.log('❌ No se encontró suscripción activa para el restaurante 7');
      
      // Verificar todas las suscripciones del restaurante
      const allSubscriptionsQuery = `
        SELECT s.*, p.nombre as plan_nombre, p.precio_mensual
        FROM suscripciones s
        JOIN planes p ON s.id_plan = p.id_plan
        WHERE s.id_restaurante = 7
        ORDER BY s.fecha_inicio DESC
      `;
      const allSubscriptionsResult = await pool.query(allSubscriptionsQuery);
      
      console.log('📋 Todas las suscripciones del restaurante 7:');
      allSubscriptionsResult.rows.forEach(sub => {
        console.log(`- Plan: ${sub.plan_nombre} ($${sub.precio_mensual}) - Estado: ${sub.estado} - Fecha fin: ${sub.fecha_fin}`);
      });
      return;
    }
    
    const subscription = subscriptionResult.rows[0];
    console.log('✅ Suscripción activa encontrada:');
    console.log(`- Plan: ${subscription.plan_nombre}`);
    console.log(`- Precio mensual: $${subscription.precio_mensual}`);
    console.log(`- Fecha inicio: ${subscription.fecha_inicio}`);
    console.log(`- Fecha fin: ${subscription.fecha_fin}`);
    console.log(`- Funcionalidades: ${JSON.stringify(subscription.funcionalidades, null, 2)}`);
    console.log('');

    // Verificar límites del plan
    const limitsQuery = `
      SELECT max_usuarios, max_sucursales, max_productos, max_transacciones_mes
      FROM planes
      WHERE id_plan = $1
    `;
    const limitsResult = await pool.query(limitsQuery, [subscription.id_plan]);
    
    if (limitsResult.rows.length > 0) {
      const limits = limitsResult.rows[0];
      console.log('📊 Límites del plan:');
      console.log(`- Máximo usuarios: ${limits.max_usuarios}`);
      console.log(`- Máximo sucursales: ${limits.max_sucursales}`);
      console.log(`- Máximo productos: ${limits.max_productos}`);
      console.log(`- Máximo transacciones por mes: ${limits.max_transacciones_mes}`);
      console.log('');
    }

    // Verificar uso actual
    const usageQuery = `
      SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE id_restaurante = 7) as usuarios_actuales,
        (SELECT COUNT(*) FROM sucursales WHERE id_restaurante = 7) as sucursales_actuales,
        (SELECT COUNT(*) FROM productos WHERE id_restaurante = 7) as productos_actuales,
        (SELECT COUNT(*) FROM mesas WHERE id_restaurante = 7) as mesas_actuales
    `;
    const usageResult = await pool.query(usageQuery);
    
    if (usageResult.rows.length > 0) {
      const usage = usageResult.rows[0];
      console.log('📈 Uso actual del restaurante:');
      console.log(`- Usuarios: ${usage.usuarios_actuales}`);
      console.log(`- Sucursales: ${usage.sucursales_actuales}`);
      console.log(`- Productos: ${usage.productos_actuales}`);
      console.log(`- Mesas: ${usage.mesas_actuales}`);
      console.log('');
    }

    // Verificar todos los planes disponibles
    const allPlansQuery = `
      SELECT id_plan, nombre, precio_mensual, funcionalidades
      FROM planes
      ORDER BY id_plan ASC
    `;
    const allPlansResult = await pool.query(allPlansQuery);
    
    console.log('📋 Todos los planes disponibles:');
    allPlansResult.rows.forEach(plan => {
      console.log(`- ${plan.nombre} (ID: ${plan.id_plan}, $${plan.precio_mensual})`);
      console.log(`  Funcionalidades: ${JSON.stringify(plan.funcionalidades, null, 2)}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRestaurant7Plan();
