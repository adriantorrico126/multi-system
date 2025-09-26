const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistempos',
  password: '6951230Anacleta',
  port: 5432,
});

async function fixPlanFunctionalities() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigiendo funcionalidades de planes según PLANES_FUNCIONALIDADES_COMPLETO.md...\n');
    
    // Configuración correcta de funcionalidades según la documentación
    const planFunctionalities = {
      1: { // Plan Básico - Solo funcionalidades básicas
        mesas: false,
        lotes: false,
        arqueo: false,
        cocina: false,
        egresos: false,
        delivery: false,
        reservas: false,
        analytics: false,
        promociones: false,
        api: false,
        white_label: false,
        sales: ['basico'],
        inventory: ['productos'],
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios']
      },
      2: { // Plan Profesional - Funcionalidades intermedias
        mesas: true,
        lotes: true,
        arqueo: true,
        cocina: true,
        egresos: ['basico'],
        delivery: false,
        reservas: false,
        analytics: false,
        promociones: false,
        api: false,
        white_label: false,
        sales: ['basico', 'pedidos'],
        inventory: ['productos', 'lotes'],
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas']
      },
      3: { // Plan Avanzado - Funcionalidades avanzadas
        mesas: true,
        lotes: true,
        arqueo: true,
        cocina: true,
        egresos: ['basico', 'avanzado'],
        delivery: true,
        reservas: true,
        analytics: true,
        promociones: true,
        api: false,
        white_label: false,
        sales: ['basico', 'pedidos', 'avanzado'],
        inventory: ['productos', 'lotes', 'completo'],
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas', 'completo']
      },
      4: { // Plan Enterprise - Acceso completo
        mesas: true,
        lotes: true,
        arqueo: true,
        cocina: true,
        egresos: ['basico', 'avanzado'],
        delivery: true,
        reservas: true,
        analytics: true,
        promociones: true,
        api: true,
        white_label: true,
        sales: ['basico', 'pedidos', 'avanzado'],
        inventory: ['productos', 'lotes', 'completo'],
        dashboard: ['resumen', 'productos', 'categorias', 'usuarios', 'mesas', 'completo']
      }
    };
    
    // Actualizar funcionalidades de cada plan
    for (const [planId, functionalities] of Object.entries(planFunctionalities)) {
      console.log(`📝 Actualizando funcionalidades del plan ID ${planId}...`);
      
      const updateQuery = `
        UPDATE planes 
        SET funcionalidades = $1
        WHERE id_plan = $2
      `;
      
      const values = [
        JSON.stringify(functionalities),
        parseInt(planId)
      ];
      
      const result = await client.query(updateQuery, values);
      
      if (result.rowCount > 0) {
        console.log(`   ✅ Funcionalidades del plan ID ${planId} actualizadas correctamente`);
        
        // Mostrar las funcionalidades restringidas
        const restrictedFeatures = Object.entries(functionalities)
          .filter(([key, value]) => !value || value === false)
          .map(([key]) => key);
        
        if (restrictedFeatures.length > 0) {
          console.log(`   🚫 Funcionalidades restringidas: ${restrictedFeatures.join(', ')}`);
        }
      } else {
        console.log(`   ❌ No se pudo actualizar el plan ID ${planId}`);
      }
    }
    
    console.log('\n🎉 Funcionalidades de planes corregidas exitosamente!');
    
    // Verificar la configuración actualizada
    console.log('\n📋 Verificando configuración actualizada...');
    const verifyQuery = 'SELECT id_plan, nombre, funcionalidades FROM planes ORDER BY id_plan';
    const verifyResult = await client.query(verifyQuery);
    
    verifyResult.rows.forEach(row => {
      console.log(`\n📊 Plan ${row.nombre} (ID: ${row.id_plan}):`);
      try {
        const funcionalidades = JSON.parse(row.funcionalidades);
        
        Object.entries(funcionalidades).forEach(([feature, value]) => {
          const status = value === true ? '✅' : value === false ? '❌' : '🔶';
          console.log(`   ${status} ${feature}: ${JSON.stringify(value)}`);
        });
      } catch (error) {
        console.log(`   ❌ Error parseando funcionalidades: ${error.message}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error corrigiendo funcionalidades:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección
fixPlanFunctionalities().catch(console.error);
