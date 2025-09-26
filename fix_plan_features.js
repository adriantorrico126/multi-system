const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: '6951230Anacleta',
  host: 'localhost',
  port: 5432,
  database: 'sistempos'
});

async function fixPlanFeatures() {
  try {
    console.log('🔧 Corrigiendo funcionalidades de planes según documentación...\n');

    // Configuración correcta según la documentación
    const planFeatures = {
      // PLAN BÁSICO ($19)
      basico: {
        api: false,
        lotes: false,
        mesas: false,
        sales: ['basico'],
        arqueo: false,
        cocina: false,
        egresos: false,
        delivery: false,
        reservas: false,
        analytics: false,
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios'],
        inventory: ['productos'],
        promociones: false,
        white_label: false
      },
      
      // PLAN PROFESIONAL ($49)
      profesional: {
        api: false,
        lotes: true,
        mesas: true,
        sales: ['basico', 'pedidos'],
        arqueo: true,
        cocina: true,
        egresos: ['basico'],
        delivery: false,
        reservas: false,
        analytics: false,
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas'],
        inventory: ['productos', 'lotes'],
        promociones: false,
        white_label: false
      },
      
      // PLAN AVANZADO ($99)
      avanzado: {
        api: false,
        lotes: true,
        mesas: true,
        sales: ['basico', 'pedidos', 'avanzado'],
        arqueo: true,
        cocina: true,
        egresos: ['basico', 'avanzado'],
        delivery: true,
        reservas: true,
        analytics: true,
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas', 'completo'],
        inventory: ['productos', 'lotes', 'completo'],
        promociones: true,
        white_label: false
      },
      
      // PLAN ENTERPRISE ($119)
      enterprise: {
        api: true,
        lotes: true,
        mesas: true,
        sales: ['basico', 'pedidos', 'avanzado'],
        arqueo: true,
        cocina: true,
        egresos: ['basico', 'avanzado'],
        delivery: true,
        reservas: true,
        analytics: true,
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas', 'completo'],
        inventory: ['productos', 'lotes', 'completo'],
        promociones: true,
        white_label: true
      }
    };

    // Actualizar cada plan
    for (const [planName, features] of Object.entries(planFeatures)) {
      console.log(`🔄 Actualizando plan: ${planName}`);
      
      const updateQuery = `
        UPDATE planes 
        SET funcionalidades = $1 
        WHERE nombre = $2
      `;
      
      await pool.query(updateQuery, [JSON.stringify(features), planName]);
      console.log(`✅ Plan ${planName} actualizado`);
    }

    console.log('\n🎉 Todas las funcionalidades han sido corregidas según la documentación!');
    console.log('\n📋 Resumen de cambios:');
    console.log('- Plan Básico: Solo productos básicos, sin mesas, arqueo, cocina');
    console.log('- Plan Profesional: Productos + lotes, mesas, arqueo, cocina (sin reservas)');
    console.log('- Plan Avanzado: Todo lo anterior + delivery, reservas, analytics, promociones');
    console.log('- Plan Enterprise: Acceso completo a todo');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixPlanFeatures();

