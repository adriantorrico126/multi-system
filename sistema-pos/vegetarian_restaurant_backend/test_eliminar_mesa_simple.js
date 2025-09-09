#!/usr/bin/env node

/**
 * Script simple para probar eliminación de mesas
 * Ejecutar con: node test_eliminar_mesa_simple.js
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

async function testEliminarMesaSimple() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Probando eliminación simple de mesa...\n');
    
    // 1. Buscar una mesa libre
    console.log('1️⃣ Buscando mesa libre...');
    const mesaLibreResult = await client.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.id_sucursal,
        (SELECT COUNT(*) FROM prefacturas WHERE id_mesa = m.id_mesa) as prefacturas_count,
        (SELECT COUNT(*) FROM ventas WHERE id_mesa = m.id_mesa) as ventas_count
      FROM mesas m
      WHERE m.estado = 'libre'
      ORDER BY m.id_mesa
      LIMIT 1
    `);
    
    if (mesaLibreResult.rows.length === 0) {
      console.log('❌ No hay mesas libres');
      return;
    }
    
    const mesa = mesaLibreResult.rows[0];
    console.log(`✅ Mesa encontrada: ID ${mesa.id_mesa}, Número ${mesa.numero}, Sucursal ${mesa.id_sucursal}`);
    console.log(`📊 Dependencias: Prefacturas=${mesa.prefacturas_count}, Ventas=${mesa.ventas_count}`);
    
    // 2. Probar eliminación
    console.log('\n2️⃣ Probando eliminación...');
    
    if (mesa.prefacturas_count > 0 || mesa.ventas_count > 0) {
      console.log('⚠️ Mesa tiene dependencias, probando eliminación forzada...');
      
      try {
        await client.query('BEGIN');
        
        // Limpiar dependencias
        if (mesa.prefacturas_count > 0) {
          await client.query('DELETE FROM prefacturas WHERE id_mesa = $1', [mesa.id_mesa]);
          console.log(`   ✅ ${mesa.prefacturas_count} prefacturas eliminadas`);
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
          
          // Recrear mesa
          console.log('\n🔄 Recreando mesa...');
          await client.query(`
            INSERT INTO mesas (numero, id_sucursal, capacidad, estado)
            VALUES ($1, $2, $3, $4)
            RETURNING id_mesa
          `, [mesa.numero, mesa.id_sucursal, 4, 'libre']);
          
          console.log('✅ Mesa recreada');
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.log('❌ Error:', error.message);
      }
      
    } else {
      console.log('✅ Mesa sin dependencias, eliminando directamente...');
      
      try {
        await client.query('BEGIN');
        
        const deleteResult = await client.query('DELETE FROM mesas WHERE id_mesa = $1 AND id_sucursal = $2 RETURNING *', [mesa.id_mesa, mesa.id_sucursal]);
        
        if (deleteResult.rows.length > 0) {
          console.log('✅ Mesa eliminada exitosamente');
          await client.query('COMMIT');
          
          // Recrear mesa
          console.log('\n🔄 Recreando mesa...');
          await client.query(`
            INSERT INTO mesas (numero, id_sucursal, capacidad, estado)
            VALUES ($1, $2, $3, $4)
            RETURNING id_mesa
          `, [mesa.numero, mesa.id_sucursal, 4, 'libre']);
          
          console.log('✅ Mesa recreada');
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.log('❌ Error:', error.message);
      }
    }
    
    console.log('\n🎉 Prueba completada!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await testEliminarMesaSimple();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();
