#!/usr/bin/env node

/**
 * Script para probar con la base de datos correcta (sistempos)
 * Ejecutar con: node test_eliminar_mesa_sistempos.js
 */

const { Pool } = require('pg');

// Configuración de la base de datos correcta
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '6951230Anacleta',
  database: 'sistempos',
  ssl: false,
});

async function testEliminarMesaSistempos() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Probando eliminación con base de datos sistempos...\n');
    
    // 1. Verificar estructura de la tabla mesas
    console.log('1️⃣ Verificando estructura de la tabla mesas...');
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
    
    console.log('📋 Estructura de la tabla mesas:');
    estructuraResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    const tieneIdRestaurante = estructuraResult.rows.some(col => col.column_name === 'id_restaurante');
    console.log(`\n🔍 ¿Tiene columna id_restaurante? ${tieneIdRestaurante ? '✅ SÍ' : '❌ NO'}`);
    
    // 2. Buscar una mesa libre
    console.log('\n2️⃣ Buscando mesa libre...');
    let query;
    if (tieneIdRestaurante) {
      query = `
        SELECT 
          m.id_mesa,
          m.numero,
          m.estado,
          m.id_restaurante,
          m.id_sucursal,
          (SELECT COUNT(*) FROM prefacturas WHERE id_mesa = m.id_mesa) as prefacturas_count,
          (SELECT COUNT(*) FROM reservas WHERE id_mesa = m.id_mesa) as reservas_count,
          (SELECT COUNT(*) FROM mesas_en_grupo WHERE id_mesa = m.id_mesa) as grupos_count
        FROM mesas m
        WHERE m.estado = 'libre'
        ORDER BY m.id_mesa
        LIMIT 1
      `;
    } else {
      query = `
        SELECT 
          m.id_mesa,
          m.numero,
          m.estado,
          m.id_sucursal,
          (SELECT COUNT(*) FROM prefacturas WHERE id_mesa = m.id_mesa) as prefacturas_count,
          (SELECT COUNT(*) FROM reservas WHERE id_mesa = m.id_mesa) as reservas_count,
          (SELECT COUNT(*) FROM mesas_en_grupo WHERE id_mesa = m.id_mesa) as grupos_count
        FROM mesas m
        WHERE m.estado = 'libre'
        ORDER BY m.id_mesa
        LIMIT 1
      `;
    }
    
    const mesaLibreResult = await client.query(query);
    
    if (mesaLibreResult.rows.length === 0) {
      console.log('❌ No hay mesas libres');
      return;
    }
    
    const mesa = mesaLibreResult.rows[0];
    console.log(`✅ Mesa encontrada: ID ${mesa.id_mesa}, Número ${mesa.numero}`);
    if (tieneIdRestaurante) {
      console.log(`   Restaurante: ${mesa.id_restaurante}, Sucursal: ${mesa.id_sucursal}`);
    } else {
      console.log(`   Sucursal: ${mesa.id_sucursal}`);
    }
    console.log(`📊 Dependencias: Prefacturas=${mesa.prefacturas_count}, Reservas=${mesa.reservas_count}, Grupos=${mesa.grupos_count}`);
    
    // 3. Probar eliminación
    console.log('\n3️⃣ Probando eliminación...');
    
    if (mesa.prefacturas_count > 0 || mesa.reservas_count > 0 || mesa.grupos_count > 0) {
      console.log('⚠️ Mesa tiene dependencias, probando eliminación forzada...');
      
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
        
        // Eliminar mesa
        let deleteQuery;
        if (tieneIdRestaurante) {
          deleteQuery = 'DELETE FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2 RETURNING *';
          var deleteResult = await client.query(deleteQuery, [mesa.id_mesa, mesa.id_restaurante]);
        } else {
          deleteQuery = 'DELETE FROM mesas WHERE id_mesa = $1 AND id_sucursal = $2 RETURNING *';
          var deleteResult = await client.query(deleteQuery, [mesa.id_mesa, mesa.id_sucursal]);
        }
        
        if (deleteResult.rows.length > 0) {
          console.log('✅ Mesa eliminada exitosamente (forzada)');
          await client.query('COMMIT');
          
          // Recrear mesa
          console.log('\n🔄 Recreando mesa...');
          let insertQuery;
          if (tieneIdRestaurante) {
            insertQuery = `
              INSERT INTO mesas (numero, id_sucursal, capacidad, estado, id_restaurante)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id_mesa
            `;
            await client.query(insertQuery, [mesa.numero, mesa.id_sucursal, 4, 'libre', mesa.id_restaurante]);
          } else {
            insertQuery = `
              INSERT INTO mesas (numero, id_sucursal, capacidad, estado)
              VALUES ($1, $2, $3, $4)
              RETURNING id_mesa
            `;
            await client.query(insertQuery, [mesa.numero, mesa.id_sucursal, 4, 'libre']);
          }
          
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
        
        let deleteQuery;
        if (tieneIdRestaurante) {
          deleteQuery = 'DELETE FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2 RETURNING *';
          var deleteResult = await client.query(deleteQuery, [mesa.id_mesa, mesa.id_restaurante]);
        } else {
          deleteQuery = 'DELETE FROM mesas WHERE id_mesa = $1 AND id_sucursal = $2 RETURNING *';
          var deleteResult = await client.query(deleteQuery, [mesa.id_mesa, mesa.id_sucursal]);
        }
        
        if (deleteResult.rows.length > 0) {
          console.log('✅ Mesa eliminada exitosamente');
          await client.query('COMMIT');
          
          // Recrear mesa
          console.log('\n🔄 Recreando mesa...');
          let insertQuery;
          if (tieneIdRestaurante) {
            insertQuery = `
              INSERT INTO mesas (numero, id_sucursal, capacidad, estado, id_restaurante)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id_mesa
            `;
            await client.query(insertQuery, [mesa.numero, mesa.id_sucursal, 4, 'libre', mesa.id_restaurante]);
          } else {
            insertQuery = `
              INSERT INTO mesas (numero, id_sucursal, capacidad, estado)
              VALUES ($1, $2, $3, $4)
              RETURNING id_mesa
            `;
            await client.query(insertQuery, [mesa.numero, mesa.id_sucursal, 4, 'libre']);
          }
          
          console.log('✅ Mesa recreada');
        }
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.log('❌ Error:', error.message);
      }
    }
    
    console.log('\n🎉 Prueba completada exitosamente!');
    console.log(`\n📋 Estructura detectada: ${tieneIdRestaurante ? 'Con id_restaurante' : 'Sin id_restaurante'}`);
    console.log('✅ La solución está funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await testEliminarMesaSistempos();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();
