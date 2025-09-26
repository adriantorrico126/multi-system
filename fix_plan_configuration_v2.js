const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistempos',
  password: '6951230Anacleta',
  port: 5432,
});

async function fixPlanConfiguration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Corrigiendo configuración de planes...\n');
    
    // Primero verificar el formato actual
    const checkQuery = 'SELECT id_plan, nombre, funcionalidades FROM planes ORDER BY id_plan';
    const result = await client.query(checkQuery);
    
    console.log('📋 Estado actual de los planes:');
    result.rows.forEach(row => {
      console.log(`\n🎯 Plan ${row.nombre} (ID: ${row.id_plan}):`);
      console.log(`   Funcionalidades (raw): ${typeof row.funcionalidades} - ${row.funcionalidades}`);
      
      try {
        const funcionalidades = typeof row.funcionalidades === 'string' 
          ? JSON.parse(row.funcionalidades) 
          : row.funcionalidades;
        
        Object.entries(funcionalidades).forEach(([feature, value]) => {
          const status = value === true ? '✅' : value === false ? '❌' : '🔶';
          console.log(`   ${status} ${feature}: ${JSON.stringify(value)}`);
        });
      } catch (error) {
        console.log(`   ❌ Error parseando funcionalidades: ${error.message}`);
      }
    });
    
    // Configuración correcta según la documentación
    const planConfigurations = {
      1: { // Plan Básico
        nombre: 'basico',
        descripcion: 'Plan básico para restaurantes pequeños',
        precio_mensual: 19,
        max_sucursales: 1,
        max_usuarios: 2,
        max_productos: 100,
        max_transacciones: 500,
        almacenamiento_gb: 1,
        funcionalidades: {
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
          sales: 'basico',
          inventory: 'productos',
          dashboard: 'resumen productos categorias usuarios'
        }
      },
      2: { // Plan Profesional
        nombre: 'profesional',
        descripcion: 'Plan profesional para restaurantes medianos',
        precio_mensual: 49,
        max_sucursales: 2,
        max_usuarios: 7,
        max_productos: 500,
        max_transacciones: 2000,
        almacenamiento_gb: 5,
        funcionalidades: {
          mesas: true,
          lotes: true,
          arqueo: true,
          cocina: true,
          egresos: 'basico',
          delivery: false,
          reservas: false,
          analytics: false,
          promociones: false,
          api: false,
          white_label: false,
          sales: 'pedidos',
          inventory: 'lotes',
          dashboard: 'resumen productos categorias usuarios mesas'
        }
      },
      3: { // Plan Avanzado
        nombre: 'avanzado',
        descripcion: 'Plan avanzado para restaurantes grandes',
        precio_mensual: 99,
        max_sucursales: 3,
        max_usuarios: -1, // Ilimitados
        max_productos: 2000,
        max_transacciones: 10000,
        almacenamiento_gb: 20,
        funcionalidades: {
          mesas: true,
          lotes: true,
          arqueo: true,
          cocina: true,
          egresos: 'avanzado',
          delivery: true,
          reservas: true,
          analytics: true,
          promociones: true,
          api: false,
          white_label: false,
          sales: 'avanzado',
          inventory: 'completo',
          dashboard: 'completo'
        }
      },
      4: { // Plan Enterprise
        nombre: 'enterprise',
        descripcion: 'Plan enterprise para cadenas de restaurantes',
        precio_mensual: 119,
        max_sucursales: -1, // Ilimitadas
        max_usuarios: -1, // Ilimitados
        max_productos: -1, // Ilimitados
        max_transacciones: -1, // Ilimitadas
        almacenamiento_gb: -1, // Ilimitado
        funcionalidades: {
          mesas: true,
          lotes: true,
          arqueo: true,
          cocina: true,
          egresos: 'avanzado',
          delivery: true,
          reservas: true,
          analytics: true,
          promociones: true,
          api: true,
          white_label: true,
          sales: 'avanzado',
          inventory: 'completo',
          dashboard: 'completo'
        }
      }
    };
    
    // Actualizar cada plan
    for (const [planId, config] of Object.entries(planConfigurations)) {
      console.log(`\n📝 Actualizando plan ${config.nombre} (ID: ${planId})...`);
      
      const updateQuery = `
        UPDATE planes 
        SET 
          nombre = $1,
          descripcion = $2,
          precio_mensual = $3,
          max_sucursales = $4,
          max_usuarios = $5,
          max_productos = $6,
          max_transacciones = $7,
          almacenamiento_gb = $8,
          funcionalidades = $9
        WHERE id_plan = $10
      `;
      
      const values = [
        config.nombre,
        config.descripcion,
        config.precio_mensual,
        config.max_sucursales,
        config.max_usuarios,
        config.max_productos,
        config.max_transacciones,
        config.almacenamiento_gb,
        JSON.stringify(config.funcionalidades),
        parseInt(planId)
      ];
      
      const result = await client.query(updateQuery, values);
      
      if (result.rowCount > 0) {
        console.log(`   ✅ Plan ${config.nombre} actualizado correctamente`);
        
        // Mostrar las funcionalidades restringidas
        const restrictedFeatures = Object.entries(config.funcionalidades)
          .filter(([key, value]) => !value || value === false)
          .map(([key]) => key);
        
        if (restrictedFeatures.length > 0) {
          console.log(`   🚫 Funcionalidades restringidas: ${restrictedFeatures.join(', ')}`);
        }
      } else {
        console.log(`   ❌ No se pudo actualizar el plan ${config.nombre}`);
      }
    }
    
    console.log('\n🎉 Configuración de planes corregida exitosamente!');
    
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
    console.error('❌ Error corrigiendo configuración:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar corrección
fixPlanConfiguration().catch(console.error);
