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
 * Función para verificar el plan actual del restaurante
 */
async function checkCurrentPlan() {
  try {
    console.log('🔍 Verificando plan actual del restaurante...\n');
    
    // Verificar suscripción activa
    const subscriptionQuery = `
      SELECT 
        s.id_restaurante,
        s.id_plan,
        s.estado,
        s.fecha_inicio,
        s.fecha_fin,
        p.nombre as plan_nombre,
        p.precio_mensual,
        p.max_usuarios,
        p.max_productos,
        p.max_sucursales,
        p.funcionalidades
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = 1
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    
    const { rows: subscriptionRows } = await pool.query(subscriptionQuery);
    
    if (subscriptionRows.length === 0) {
      console.log('❌ No se encontró suscripción para el restaurante 1');
      return;
    }
    
    const subscription = subscriptionRows[0];
    console.log('📊 Suscripción actual:');
    console.log(`   - Restaurante ID: ${subscription.id_restaurante}`);
    console.log(`   - Plan ID: ${subscription.id_plan}`);
    console.log(`   - Plan Nombre: ${subscription.plan_nombre}`);
    console.log(`   - Estado: ${subscription.estado}`);
    console.log(`   - Precio Mensual: $${subscription.precio_mensual}`);
    console.log(`   - Límite Usuarios: ${subscription.max_usuarios}`);
    console.log(`   - Límite Productos: ${subscription.max_productos}`);
    console.log(`   - Límite Sucursales: ${subscription.max_sucursales}`);
    console.log(`   - Funcionalidades:`, JSON.stringify(subscription.funcionalidades, null, 2));
    
    // Verificar uso actual
    const usageQuery = `
      SELECT 
        productos_actuales,
        usuarios_actuales,
        sucursales_actuales,
        transacciones_mes_actual
      FROM uso_recursos
      WHERE id_restaurante = 1
      AND mes_medicion = EXTRACT(MONTH FROM CURRENT_DATE)
      AND año_medicion = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    
    const { rows: usageRows } = await pool.query(usageQuery);
    
    if (usageRows.length > 0) {
      const usage = usageRows[0];
      console.log('\n📈 Uso actual:');
      console.log(`   - Usuarios: ${usage.usuarios_actuales}/${subscription.max_usuarios}`);
      console.log(`   - Productos: ${usage.productos_actuales}/${subscription.max_productos}`);
      console.log(`   - Sucursales: ${usage.sucursales_actuales}/${subscription.max_sucursales}`);
      console.log(`   - Transacciones: ${usage.transacciones_mes_actual}`);
      
      // Verificar si hay límites excedidos
      const limitsExceeded = [];
      if (subscription.max_usuarios > 0 && usage.usuarios_actuales > subscription.max_usuarios) {
        limitsExceeded.push(`Usuarios: ${usage.usuarios_actuales}/${subscription.max_usuarios}`);
      }
      if (subscription.max_productos > 0 && usage.productos_actuales > subscription.max_productos) {
        limitsExceeded.push(`Productos: ${usage.productos_actuales}/${subscription.max_productos}`);
      }
      if (subscription.max_sucursales > 0 && usage.sucursales_actuales > subscription.max_sucursales) {
        limitsExceeded.push(`Sucursales: ${usage.sucursales_actuales}/${subscription.max_sucursales}`);
      }
      
      if (limitsExceeded.length > 0) {
        console.log('\n⚠️ Límites excedidos:');
        limitsExceeded.forEach(limit => console.log(`   - ${limit}`));
      } else {
        console.log('\n✅ Todos los límites están dentro del rango permitido.');
      }
    } else {
      console.log('\n📈 No se encontró información de uso actual.');
    }
    
  } catch (error) {
    console.error('❌ Error verificando plan:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar verificación
checkCurrentPlan().catch(console.error);
