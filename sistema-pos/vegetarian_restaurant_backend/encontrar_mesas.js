#!/usr/bin/env node

/**
 * Script para encontrar mesas existentes y probar la eliminación
 * Ejecutar con: node encontrar_mesas.js
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

async function encontrarMesas() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Buscando mesas existentes...\n');
    
    // 1. Listar todas las mesas
    const mesasResult = await client.query(`
      SELECT 
        m.id_mesa,
        m.numero,
        m.estado,
        m.id_restaurante,
        m.id_sucursal,
        (SELECT COUNT(*) FROM prefacturas WHERE id_mesa = m.id_mesa) as prefacturas_count,
        (SELECT COUNT(*) FROM ventas WHERE id_mesa = m.id_mesa) as ventas_count,
        (SELECT COUNT(*) FROM reservas WHERE id_mesa = m.id_mesa) as reservas_count,
        (SELECT COUNT(*) FROM mesas_en_grupo WHERE id_mesa = m.id_mesa) as grupos_count
      FROM mesas m
      ORDER BY m.id_mesa
      LIMIT 10
    `);
    
    if (mesasResult.rows.length === 0) {
      console.log('❌ No hay mesas en la base de datos');
      return;
    }
    
    console.log(`✅ Encontradas ${mesasResult.rows.length} mesas:`);
    console.log('┌─────────┬─────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ ID Mesa │ Número  │ Estado      │ Prefacturas │ Ventas      │ Reservas    │ Grupos      │');
    console.log('├─────────┼─────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤');
    
    mesasResult.rows.forEach(mesa => {
      console.log(`│ ${String(mesa.id_mesa).padEnd(7)} │ ${String(mesa.numero).padEnd(7)} │ ${String(mesa.estado).padEnd(11)} │ ${String(mesa.prefacturas_count).padEnd(11)} │ ${String(mesa.ventas_count).padEnd(11)} │ ${String(mesa.reservas_count).padEnd(11)} │ ${String(mesa.grupos_count).padEnd(11)} │`);
    });
    
    console.log('└─────────┴─────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘');
    
    // 2. Buscar una mesa libre sin dependencias para probar
    console.log('\n🔍 Buscando mesa libre sin dependencias...');
    const mesaLibre = mesasResult.rows.find(mesa => 
      mesa.estado === 'libre' && 
      mesa.prefacturas_count === 0 && 
      mesa.ventas_count === 0 && 
      mesa.reservas_count === 0 && 
      mesa.grupos_count === 0
    );
    
    if (mesaLibre) {
      console.log(`✅ Mesa ideal para prueba encontrada: ID ${mesaLibre.id_mesa}, Número ${mesaLibre.numero}`);
      
      // 3. Probar eliminación de esta mesa
      console.log(`\n🧪 Probando eliminación de mesa ID ${mesaLibre.id_mesa}...`);
      
      try {
        await client.query('BEGIN');
        
        const deleteResult = await client.query(
          'DELETE FROM mesas WHERE id_mesa = $1 RETURNING *', 
          [mesaLibre.id_mesa]
        );
        
        if (deleteResult.rows.length > 0) {
          console.log('✅ Mesa eliminada exitosamente');
          await client.query('COMMIT');
          
          // 4. Recrear la mesa para futuras pruebas
          console.log('\n🔄 Recreando mesa para futuras pruebas...');
          await client.query(`
            INSERT INTO mesas (numero, id_sucursal, capacidad, estado, id_restaurante)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_mesa
          `, [mesaLibre.numero, mesaLibre.id_sucursal, 4, 'libre', mesaLibre.id_restaurante]);
          
          console.log('✅ Mesa recreada exitosamente');
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.log('❌ Error al eliminar mesa:', error.message);
      }
      
    } else {
      console.log('⚠️ No se encontró una mesa libre sin dependencias');
      
      // Buscar cualquier mesa libre
      const mesaLibreCualquiera = mesasResult.rows.find(mesa => mesa.estado === 'libre');
      if (mesaLibreCualquiera) {
        console.log(`📝 Mesa libre encontrada: ID ${mesaLibreCualquiera.id_mesa}, pero tiene dependencias`);
        console.log(`   - Prefacturas: ${mesaLibreCualquiera.prefacturas_count}`);
        console.log(`   - Ventas: ${mesaLibreCualquiera.ventas_count}`);
        console.log(`   - Reservas: ${mesaLibreCualquiera.reservas_count}`);
        console.log(`   - Grupos: ${mesaLibreCualquiera.grupos_count}`);
      }
    }
    
    // 5. Crear una mesa de prueba si no hay ninguna
    if (mesasResult.rows.length === 0) {
      console.log('\n🆕 Creando mesa de prueba...');
      try {
        const createResult = await client.query(`
          INSERT INTO mesas (numero, id_sucursal, capacidad, estado, id_restaurante)
          VALUES (999, 1, 4, 'libre', 1)
          RETURNING id_mesa, numero
        `);
        
        console.log(`✅ Mesa de prueba creada: ID ${createResult.rows[0].id_mesa}, Número ${createResult.rows[0].numero}`);
      } catch (error) {
        console.log('❌ Error al crear mesa de prueba:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await encontrarMesas();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();
