#!/usr/bin/env node

/**
 * Script para verificar la estructura de la tabla mesas
 * Ejecutar con: node verificar_estructura_mesas.js
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

async function verificarEstructura() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estructura de la tabla mesas...\n');
    
    // 1. Obtener estructura de la tabla
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
    
    if (estructuraResult.rows.length === 0) {
      console.log('❌ La tabla mesas no existe');
      return;
    }
    
    console.log('📋 Estructura de la tabla mesas:');
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
        console.log(`│ ${String(mesa.id_mesa || '').padEnd(7)} │ ${String(mesa.numero || '').padEnd(7)} │ ${String(mesa.estado || '').padEnd(11)} │ ${String(mesa.id_sucursal || mesa.sucursal_id || '').padEnd(11)} │ ${String(mesa.capacidad || '').padEnd(11)} │`);
      });
      
      console.log('└─────────┴─────────┴─────────────┴─────────────┴─────────────┘');
    }
    
    // 3. Verificar foreign keys
    console.log('\n🔗 Foreign keys de la tabla mesas:');
    const fkResult = await client.query(`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'mesas'
    `);
    
    if (fkResult.rows.length === 0) {
      console.log('❌ No hay foreign keys definidas');
    } else {
      fkResult.rows.forEach(fk => {
        console.log(`   ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }
    
    // 4. Verificar tablas que referencian mesas
    console.log('\n🔗 Tablas que referencian mesas:');
    const refResult = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table_name,
        ccu.column_name AS referenced_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'mesas'
    `);
    
    if (refResult.rows.length === 0) {
      console.log('❌ No hay tablas que referencien mesas');
    } else {
      refResult.rows.forEach(ref => {
        console.log(`   ${ref.table_name}.${ref.column_name} → mesas.${ref.referenced_column_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await verificarEstructura();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();
