require('dotenv').config({ path: './production.env' });
const { Pool } = require('pg');

// Configuración de la base de datos de producción
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function asignarPlanEnterprise() {
  console.log('🏢 ASIGNANDO PLAN ENTERPRISE AL RESTAURANTE ID 8');
  console.log('=' .repeat(60));
  
  try {
    const client = await pool.connect();
    
    try {
      // 1. Buscar el restaurante con ID 8
      console.log('🔍 Buscando el restaurante con ID 8...');
      const restauranteQuery = `
        SELECT id_restaurante, nombre, ciudad, created_at
        FROM restaurantes 
        WHERE id_restaurante = 8
      `;
      
      const { rows: restaurantes } = await client.query(restauranteQuery);
      
      if (restaurantes.length === 0) {
        throw new Error('No se encontró el restaurante con ID 8 en la base de datos');
      }
      
      const restaurante = restaurantes[0];
      console.log(`✅ Restaurante encontrado: ${restaurante.nombre} (ID: ${restaurante.id_restaurante})`);
      console.log(`   📍 Ciudad: ${restaurante.ciudad}`);
      console.log(`   📅 Creado: ${restaurante.created_at}`);
      
      // 2. Verificar si ya tiene un plan asignado
      console.log('\n🔍 Verificando plan actual...');
      const planQuery = `
        SELECT s.id_plan, p.nombre as plan_nombre, p.descripcion, s.fecha_inicio, s.fecha_fin, s.estado
        FROM suscripciones s
        JOIN planes p ON s.id_plan = p.id_plan
        WHERE s.id_restaurante = $1
        ORDER BY s.fecha_inicio DESC
        LIMIT 1
      `;
      
      const { rows: planes } = await client.query(planQuery, [restaurante.id_restaurante]);
      
      if (planes.length > 0) {
        const planActual = planes[0];
        console.log(`📋 Plan actual: ${planActual.plan_nombre} (ID: ${planActual.id_plan})`);
        console.log(`   📅 Inicio: ${planActual.fecha_inicio}`);
        console.log(`   📅 Fin: ${planActual.fecha_fin}`);
        console.log(`   ✅ Estado: ${planActual.estado}`);
        
        if (planActual.plan_nombre.toLowerCase().includes('enterprise')) {
          console.log('\n✅ El restaurante ya tiene el plan Enterprise asignado!');
          return;
        }
      } else {
        console.log('📋 No se encontró ningún plan asignado');
      }
      
      // 3. Buscar el plan Enterprise
      console.log('\n🔍 Buscando plan Enterprise...');
      const enterpriseQuery = `
        SELECT id_plan, nombre, descripcion, precio_mensual, max_usuarios, max_sucursales
        FROM planes 
        WHERE LOWER(nombre) LIKE '%enterprise%' OR LOWER(nombre) LIKE '%empresarial%'
        ORDER BY precio_mensual DESC
        LIMIT 1
      `;
      
      const { rows: enterprisePlans } = await client.query(enterpriseQuery);
      
      if (enterprisePlans.length === 0) {
        throw new Error('No se encontró el plan Enterprise en la base de datos');
      }
      
      const enterprisePlan = enterprisePlans[0];
      console.log(`✅ Plan Enterprise encontrado: ${enterprisePlan.nombre} (ID: ${enterprisePlan.id_plan})`);
      console.log(`   💰 Precio mensual: $${enterprisePlan.precio_mensual}`);
      console.log(`   👥 Límite usuarios: ${enterprisePlan.max_usuarios || 'Ilimitado'}`);
      console.log(`   🏢 Límite sucursales: ${enterprisePlan.max_sucursales || 'Ilimitado'}`);
      
      // 4. Asignar el plan Enterprise
      console.log('\n🔄 Asignando plan Enterprise...');
      
      await client.query('BEGIN');
      
      // Desactivar plan actual si existe
      if (planes.length > 0) {
        await client.query(`
          UPDATE suscripciones 
          SET estado = 'cancelada', fecha_fin = NOW()
          WHERE id_restaurante = $1 AND estado = 'activa'
        `, [restaurante.id_restaurante]);
        console.log('   ✅ Plan anterior desactivado');
      }
      
      // Crear nueva suscripción Enterprise
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setFullYear(fechaFin.getFullYear() + 1); // 1 año de suscripción
      
      const suscripcionQuery = `
        INSERT INTO suscripciones (
          id_restaurante, 
          id_plan, 
          fecha_inicio, 
          fecha_fin, 
          estado, 
          auto_renovacion,
          created_at
        ) VALUES ($1, $2, $3, $4, 'activa', true, NOW())
        RETURNING id_suscripcion, fecha_inicio, fecha_fin
      `;
      
      const { rows: suscripcion } = await client.query(suscripcionQuery, [
        restaurante.id_restaurante,
        enterprisePlan.id_plan,
        fechaInicio,
        fechaFin
      ]);
      
      await client.query('COMMIT');
      
      console.log('   ✅ Plan Enterprise asignado exitosamente!');
      console.log(`   📅 Fecha inicio: ${suscripcion[0].fecha_inicio}`);
      console.log(`   📅 Fecha fin: ${suscripcion[0].fecha_fin}`);
      console.log(`   🆔 ID Suscripción: ${suscripcion[0].id_suscripcion}`);
      
      // 5. Verificar asignación
      console.log('\n🔍 Verificando asignación...');
      const verificacionQuery = `
        SELECT s.id_suscripcion, p.nombre as plan_nombre, s.fecha_inicio, s.fecha_fin, s.estado
        FROM suscripciones s
        JOIN planes p ON s.id_plan = p.id_plan
        WHERE s.id_restaurante = $1 AND s.estado = 'activa'
      `;
      
      const { rows: verificacion } = await client.query(verificacionQuery, [restaurante.id_restaurante]);
      
      if (verificacion.length > 0) {
        const planVerificado = verificacion[0];
        console.log('✅ Verificación exitosa:');
        console.log(`   📋 Plan: ${planVerificado.plan_nombre}`);
        console.log(`   📅 Inicio: ${planVerificado.fecha_inicio}`);
        console.log(`   📅 Fin: ${planVerificado.fecha_fin}`);
        console.log(`   ✅ Estado: ${planVerificado.estado}`);
      }
      
      console.log('\n🎉 PLAN ENTERPRISE ASIGNADO EXITOSAMENTE!');
      console.log('=' .repeat(60));
      console.log(`🏪 Restaurante: ${restaurante.nombre}`);
      console.log(`🆔 ID: ${restaurante.id_restaurante}`);
      console.log(`📋 Plan: ${enterprisePlan.nombre}`);
      console.log(`💰 Precio: $${enterprisePlan.precio_mensual}/mes`);
      console.log(`📅 Válido hasta: ${fechaFin.toLocaleDateString()}`);
      console.log('\n✅ El restaurante ahora tiene acceso completo a todas las funcionalidades!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Detalles:', error);
  } finally {
    await pool.end();
  }
}

// Función para verificar conexión
async function verificarConexion() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Conexión a la base de datos exitosa');
    console.log(`   Hora del servidor: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 SCRIPT DE ASIGNACIÓN DE PLAN ENTERPRISE');
  console.log('=' .repeat(50));
  
  // Verificar conexión
  const conexionOk = await verificarConexion();
  if (!conexionOk) {
    console.log('\n❌ No se puede continuar sin conexión a la base de datos');
    return;
  }
  
  await asignarPlanEnterprise();
}

// Ejecutar script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  asignarPlanEnterprise,
  verificarConexion
};
