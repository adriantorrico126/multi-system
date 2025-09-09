#!/usr/bin/env node

/**
 * Script para probar la eliminación de mesas con la estructura correcta
 * Ejecutar con: node test_eliminar_mesa_corregido.js
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

async function testEliminarMesaCorregido() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Probando eliminación de mesas con estructura corregida...\n');
    
    // 1. Buscar una mesa libre para probar
    console.log('1️⃣ Buscando mesa libre para prueba...');
    const mesaLibreResult = await client.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.id_sucursal,
        (SELECT COUNT(*) FROM prefacturas WHERE id_mesa = m.id_mesa) as prefacturas_count,
        (SELECT COUNT(*) FROM ventas WHERE id_mesa = m.id_mesa) as ventas_count,
        (SELECT COUNT(*) FROM reservas WHERE id_mesa = m.id_mesa) as reservas_count,
        (SELECT COUNT(*) FROM mesas_en_grupo WHERE id_mesa = m.id_mesa) as grupos_count
      FROM mesas m
      WHERE m.estado = 'libre'
      ORDER BY m.id_mesa
      LIMIT 1
    `);
    
    if (mesaLibreResult.rows.length === 0) {
      console.log('❌ No hay mesas libres para probar');
      return;
    }
    
    const mesa = mesaLibreResult.rows[0];
    console.log(`✅ Mesa encontrada: ID ${mesa.id_mesa}, Número ${mesa.numero}, Sucursal ${mesa.id_sucursal}`);
    console.log(`📊 Dependencias: Prefacturas=${mesa.prefacturas_count}, Ventas=${mesa.ventas_count}, Reservas=${mesa.reservas_count}, Grupos=${mesa.grupos_count}`);
    
    // 2. Probar eliminación normal
    console.log('\n2️⃣ Probando eliminación normal...');
    try {
      await client.query('BEGIN');
      
      // Simular la lógica del modelo
      const mesaCheck = await client.query('SELECT estado FROM mesas WHERE id_mesa = $1 AND id_sucursal = $2', [mesa.id_mesa, mesa.id_sucursal]);
      
      if (mesaCheck.rows.length === 0) {
        throw new Error('Mesa no encontrada');
      }
      
      if (mesaCheck.rows[0].estado !== 'libre') {
        throw new Error('No se puede eliminar una mesa que está en uso');
      }
      
      // Verificar dependencias
      if (mesa.prefacturas_count > 0 || mesa.ventas_count > 0 || mesa.reservas_count > 0 || mesa.grupos_count > 0) {
        throw new Error('No se puede eliminar la mesa porque tiene registros relacionados');
      }
      
      // Eliminar mesa
      const deleteResult = await client.query('DELETE FROM mesas WHERE id_mesa = $1 AND id_sucursal = $2 RETURNING *', [mesa.id_mesa, mesa.id_sucursal]);
      
      if (deleteResult.rows.length > 0) {
        console.log('✅ Mesa eliminada exitosamente');
        await client.query('COMMIT');
        
        // Recrear mesa para futuras pruebas
        console.log('\n🔄 Recreando mesa para futuras pruebas...');
        await client.query(`
          INSERT INTO mesas (numero, id_sucursal, capacidad, estado)
          VALUES ($1, $2, $3, $4)
          RETURNING id_mesa
        `, [mesa.numero, mesa.id_sucursal, 4, 'libre']);
        
        console.log('✅ Mesa recreada exitosamente');
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.log('❌ Error en eliminación normal:', error.message);
      
      // 3. Probar eliminación forzada
      console.log('\n3️⃣ Probando eliminación forzada...');
      try {
        await client.query('BEGIN');
        
        // Limpiar dependencias
        console.log('🧹 Limpiando dependencias...');
        
        if (mesa.prefacturas_count > 0) {
          await client.query('DELETE FROM prefacturas WHERE id_mesa = $1', [mesa.id_mesa]);
          console.log(`   ✅ ${mesa.prefacturas_count} prefacturas eliminadas`);
        }
        
        if (mesa.reservas_count > 0) {
          await client.query('DELETE FROM reservas WHERE id_mesa = $1', [mesa.id_mesa]);
          console.log(`   ✅ ${mesa.reservas_count} reservas eliminadas`);
        }
        
        if (mesa.grupos_count > 0) {
          await client.query('DELETE FROM mesas_en_grupo WHERE id_mesa = $1', [mesa.id_mesa]);
          console.log(`   ✅ ${mesa.grupos_count} grupos eliminados`);
        }
        
        if (mesa.ventas_count > 0) {
          await client.query('UPDATE ventas SET id_mesa = NULL, mesa_numero = NULL WHERE id_mesa = $1', [mesa.id_mesa]);
          console.log(`   ✅ ${mesa.ventas_count} ventas actualizadas`);
        }
        
        // Eliminar mesa
        const deleteResult = await client.query('DELETE FROM mesas WHERE id_mesa = $1 AND id_sucursal = $2 RETURNING *', [mesa.id_mesa, mesa.id_sucursal]);
        
        if (deleteResult.rows.length > 0) {
          console.log('✅ Mesa eliminada exitosamente (forzada)');
          await client.query('COMMIT');
          
          // Recrear mesa para futuras pruebas
          console.log('\n🔄 Recreando mesa para futuras pruebas...');
          await client.query(`
            INSERT INTO mesas (numero, id_sucursal, capacidad, estado)
            VALUES ($1, $2, $3, $4)
            RETURNING id_mesa
          `, [mesa.numero, mesa.id_sucursal, 4, 'libre']);
          
          console.log('✅ Mesa recreada exitosamente');
        }
        
      } catch (error2) {
        await client.query('ROLLBACK');
        console.log('❌ Error en eliminación forzada:', error2.message);
      }
    }
    
    console.log('\n🎉 Pruebas completadas!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await testEliminarMesaCorregido();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();
