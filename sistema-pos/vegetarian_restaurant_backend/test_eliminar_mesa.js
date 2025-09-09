#!/usr/bin/env node

/**
 * Script de prueba para verificar la eliminación de mesas
 * Ejecutar con: node test_eliminar_mesa.js
 */

const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'menta_restobar_db',
  ssl: false,
});

async function testEliminarMesa() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Iniciando pruebas de eliminación de mesas...\n');
    
    // 1. Crear una mesa de prueba
    console.log('1️⃣ Creando mesa de prueba...');
    const createResult = await client.query(`
      INSERT INTO mesas (numero, id_sucursal, capacidad, estado, id_restaurante)
      VALUES (999, 1, 4, 'libre', 1)
      RETURNING id_mesa, numero
    `);
    const mesaId = createResult.rows[0].id_mesa;
    console.log(`✅ Mesa creada: ID ${mesaId}, Número ${createResult.rows[0].numero}`);
    
    // 2. Crear una prefactura para la mesa
    console.log('\n2️⃣ Creando prefactura de prueba...');
    await client.query(`
      INSERT INTO prefacturas (id_mesa, productos, subtotal, impuestos, total, estado)
      VALUES ($1, '[]', 0.00, 0.00, 0.00, 'activa')
    `, [mesaId]);
    console.log('✅ Prefactura creada');
    
    // 3. Intentar eliminar la mesa normalmente (debería fallar)
    console.log('\n3️⃣ Intentando eliminar mesa normalmente...');
    try {
      await client.query('DELETE FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2', [mesaId, 1]);
      console.log('❌ ERROR: La mesa se eliminó cuando debería haber fallado');
    } catch (error) {
      console.log('✅ Correcto: La eliminación falló debido a dependencias');
      console.log(`   Error: ${error.message}`);
    }
    
    // 4. Verificar dependencias
    console.log('\n4️⃣ Verificando dependencias...');
    const dependencias = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM prefacturas WHERE id_mesa = $1) as prefacturas_count,
        (SELECT COUNT(*) FROM ventas WHERE id_mesa = $1) as ventas_count,
        (SELECT COUNT(*) FROM reservas WHERE id_mesa = $1) as reservas_count,
        (SELECT COUNT(*) FROM mesas_en_grupo WHERE id_mesa = $1) as grupos_count
    `, [mesaId]);
    
    const deps = dependencias.rows[0];
    console.log(`📊 Dependencias encontradas:`);
    console.log(`   - Prefacturas: ${deps.prefacturas_count}`);
    console.log(`   - Ventas: ${deps.ventas_count}`);
    console.log(`   - Reservas: ${deps.reservas_count}`);
    console.log(`   - Grupos: ${deps.grupos_count}`);
    
    // 5. Limpiar dependencias y eliminar mesa
    console.log('\n5️⃣ Limpiando dependencias y eliminando mesa...');
    await client.query('BEGIN');
    
    // Limpiar prefacturas
    await client.query('DELETE FROM prefacturas WHERE id_mesa = $1', [mesaId]);
    console.log('✅ Prefacturas eliminadas');
    
    // Eliminar mesa
    const deleteResult = await client.query('DELETE FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2 RETURNING *', [mesaId, 1]);
    
    if (deleteResult.rows.length > 0) {
      console.log('✅ Mesa eliminada exitosamente');
      console.log(`   Mesa eliminada: ID ${deleteResult.rows[0].id_mesa}, Número ${deleteResult.rows[0].numero}`);
    } else {
      console.log('❌ ERROR: No se pudo eliminar la mesa');
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 Pruebas completadas exitosamente!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    client.release();
  }
}

async function testEliminarMesaConDependencias() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧪 Probando eliminación con dependencias múltiples...\n');
    
    // Crear mesa de prueba
    const createResult = await client.query(`
      INSERT INTO mesas (numero, id_sucursal, capacidad, estado, id_restaurante)
      VALUES (998, 1, 4, 'libre', 1)
      RETURNING id_mesa, numero
    `);
    const mesaId = createResult.rows[0].id_mesa;
    console.log(`✅ Mesa creada: ID ${mesaId}, Número ${createResult.rows[0].numero}`);
    
    // Crear múltiples dependencias
    await client.query('BEGIN');
    
    // Prefactura
    await client.query(`
      INSERT INTO prefacturas (id_mesa, productos, subtotal, impuestos, total, estado)
      VALUES ($1, '[]', 0.00, 0.00, 0.00, 'activa')
    `, [mesaId]);
    
    // Reserva
    await client.query(`
      INSERT INTO reservas (id_mesa, nombre_cliente, telefono_cliente, fecha_hora_inicio, fecha_hora_fin, numero_personas, estado, id_restaurante, id_sucursal)
      VALUES ($1, 'Cliente Test', '123456789', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours', 4, 'confirmada', 1, 1)
    `, [mesaId]);
    
    await client.query('COMMIT');
    
    console.log('✅ Dependencias creadas (prefactura y reserva)');
    
    // Intentar eliminación normal (debería fallar)
    console.log('\n🔄 Intentando eliminación normal...');
    try {
      await client.query('DELETE FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2', [mesaId, 1]);
      console.log('❌ ERROR: La eliminación debería haber fallado');
    } catch (error) {
      console.log('✅ Correcto: Eliminación falló por dependencias');
    }
    
    // Limpiar dependencias y eliminar
    console.log('\n🧹 Limpiando dependencias y eliminando...');
    await client.query('BEGIN');
    
    await client.query('DELETE FROM prefacturas WHERE id_mesa = $1', [mesaId]);
    await client.query('DELETE FROM reservas WHERE id_mesa = $1', [mesaId]);
    
    const deleteResult = await client.query('DELETE FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2 RETURNING *', [mesaId, 1]);
    
    if (deleteResult.rows.length > 0) {
      console.log('✅ Mesa eliminada exitosamente después de limpiar dependencias');
    }
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
  } finally {
    client.release();
  }
}

// Ejecutar pruebas
async function main() {
  try {
    await testEliminarMesa();
    await testEliminarMesaConDependencias();
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await pool.end();
  }
}

main();
