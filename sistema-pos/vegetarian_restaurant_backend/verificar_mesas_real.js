#!/usr/bin/env node

/**
 * Script para verificar la estructura real de la tabla mesas
 * Ejecutar con: node verificar_mesas_real.js
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

async function verificarMesasReal() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estructura real de la tabla mesas...\n');
    
    // 1. Obtener estructura real
    const estructuraResult = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'mesas'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estructura real de la tabla mesas:');
    console.log('┌─────────────────┬─────────────┬─────────────┬─────────────────┐');
    console.log('│ Nombre Columna  │ Tipo        │ Nulable     │ Valor Default   │');
    console.log('├─────────────────┼─────────────┼─────────────┼─────────────────┤');
    
    estructuraResult.rows.forEach(col => {
      console.log(`│ ${String(col.column_name).padEnd(15)} │ ${String(col.data_type).padEnd(11)} │ ${String(col.is_nullable).padEnd(11)} │ ${String(col.column_default || '').padEnd(15)} │`);
    });
    
    console.log('└─────────────────┴─────────────┴─────────────┴─────────────────┘');
    
    // 2. Obtener algunas mesas de ejemplo
    console.log('\n📊 Mesas existentes (primeras 5):');
    const mesasResult = await client.query(`
      SELECT * FROM mesas 
      ORDER BY id_mesa 
      LIMIT 5
    `);
    
    if (mesasResult.rows.length === 0) {
      console.log('❌ No hay mesas en la tabla');
    } else {
      console.log('┌─────────┬─────────┬─────────────┬─────────────┬─────────────┐');
      console.log('│ ID Mesa │ Número  │ Estado      │ Sucursal    │ Capacidad   │');
      console.log('├─────────┼─────────┼─────────────┼─────────────┼─────────────┤');
      
      mesasResult.rows.forEach(mesa => {
        console.log(`│ ${String(mesa.id_mesa || '').padEnd(7)} │ ${String(mesa.numero || '').padEnd(7)} │ ${String(mesa.estado || '').padEnd(11)} │ ${String(mesa.id_sucursal || '').padEnd(11)} │ ${String(mesa.capacidad || '').padEnd(11)} │`);
      });
      
      console.log('└─────────┴─────────┴─────────────┴─────────────┴─────────────┘');
    }
    
    // 3. Verificar si existe id_restaurante
    const tieneIdRestaurante = estructuraResult.rows.some(col => col.column_name === 'id_restaurante');
    console.log(`\n🔍 ¿Tiene columna id_restaurante? ${tieneIdRestaurante ? '✅ SÍ' : '❌ NO'}`);
    
    // 4. Probar eliminación con la estructura real
    if (mesasResult.rows.length > 0) {
      const mesa = mesasResult.rows[0];
      console.log(`\n🧪 Probando eliminación de mesa ID ${mesa.id_mesa}...`);
      
      try {
        await client.query('BEGIN');
        
        // Verificar dependencias
        const dependencias = await client.query(`
          SELECT 
            (SELECT COUNT(*) FROM prefacturas WHERE id_mesa = $1) as prefacturas_count,
            (SELECT COUNT(*) FROM ventas WHERE id_mesa = $1) as ventas_count,
            (SELECT COUNT(*) FROM reservas WHERE id_mesa = $1) as reservas_count,
            (SELECT COUNT(*) FROM mesas_en_grupo WHERE id_mesa = $1) as grupos_count
        `, [mesa.id_mesa]);
        
        const deps = dependencias.rows[0];
        console.log(`📊 Dependencias: Prefacturas=${deps.prefacturas_count}, Ventas=${deps.ventas_count}, Reservas=${deps.reservas_count}, Grupos=${deps.grupos_count}`);
        
        if (deps.prefacturas_count > 0 || deps.ventas_count > 0 || deps.reservas_count > 0 || deps.grupos_count > 0) {
          console.log('⚠️ Mesa tiene dependencias, limpiando...');
          
          // Limpiar dependencias
          if (deps.prefacturas_count > 0) {
            await client.query('DELETE FROM prefacturas WHERE id_mesa = $1', [mesa.id_mesa]);
            console.log(`   ✅ ${deps.prefacturas_count} prefacturas eliminadas`);
          }
          
          if (deps.reservas_count > 0) {
            await client.query('DELETE FROM reservas WHERE id_mesa = $1', [mesa.id_mesa]);
            console.log(`   ✅ ${deps.reservas_count} reservas eliminadas`);
          }
          
          if (deps.grupos_count > 0) {
            await client.query('DELETE FROM mesas_en_grupo WHERE id_mesa = $1', [mesa.id_mesa]);
            console.log(`   ✅ ${deps.grupos_count} grupos eliminados`);
          }
          
          if (deps.ventas_count > 0) {
            await client.query('UPDATE ventas SET id_mesa = NULL, mesa_numero = NULL WHERE id_mesa = $1', [mesa.id_mesa]);
            console.log(`   ✅ ${deps.ventas_count} ventas actualizadas`);
          }
        }
        
        // Eliminar mesa (usando solo id_mesa ya que no hay id_restaurante)
        const deleteResult = await client.query('DELETE FROM mesas WHERE id_mesa = $1 RETURNING *', [mesa.id_mesa]);
        
        if (deleteResult.rows.length > 0) {
          console.log('✅ Mesa eliminada exitosamente');
          await client.query('COMMIT');
          
          // Recrear mesa
          console.log('\n🔄 Recreando mesa...');
          await client.query(`
            INSERT INTO mesas (numero, id_sucursal, capacidad, estado)
            VALUES ($1, $2, $3, $4)
            RETURNING id_mesa
          `, [mesa.numero, mesa.id_sucursal, mesa.capacidad, 'libre']);
          
          console.log('✅ Mesa recreada');
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.log('❌ Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await verificarMesasReal();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();
