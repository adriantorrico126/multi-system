#!/usr/bin/env node

/**
 * Script simple para probar la eliminación de mesas directamente
 * Ejecutar con: node test_eliminar_mesa_directo.js
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

async function testEliminarMesaDirecto() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Probando eliminación directa de mesa ID 38...\n');
    
    // 1. Verificar que la mesa existe
    console.log('1️⃣ Verificando existencia de mesa ID 38...');
    const mesaResult = await client.query('SELECT * FROM mesas WHERE id_mesa = 38');
    
    if (mesaResult.rows.length === 0) {
      console.log('❌ Mesa ID 38 no existe');
      return;
    }
    
    const mesa = mesaResult.rows[0];
    console.log(`✅ Mesa encontrada: ID ${mesa.id_mesa}, Número ${mesa.numero}, Estado: ${mesa.estado}`);
    
    // 2. Verificar dependencias
    console.log('\n2️⃣ Verificando dependencias...');
    const dependencias = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM prefacturas WHERE id_mesa = 38) as prefacturas_count,
        (SELECT COUNT(*) FROM ventas WHERE id_mesa = 38) as ventas_count,
        (SELECT COUNT(*) FROM reservas WHERE id_mesa = 38) as reservas_count,
        (SELECT COUNT(*) FROM mesas_en_grupo WHERE id_mesa = 38) as grupos_count
    `);
    
    const deps = dependencias.rows[0];
    console.log(`📊 Dependencias encontradas:`);
    console.log(`   - Prefacturas: ${deps.prefacturas_count}`);
    console.log(`   - Ventas: ${deps.ventas_count}`);
    console.log(`   - Reservas: ${deps.reservas_count}`);
    console.log(`   - Grupos: ${deps.grupos_count}`);
    
    // 3. Intentar eliminación normal
    console.log('\n3️⃣ Intentando eliminación normal...');
    try {
      await client.query('BEGIN');
      
      // Verificar estado
      if (mesa.estado !== 'libre') {
        throw new Error('No se puede eliminar una mesa que está en uso');
      }
      
      // Verificar dependencias
      if (deps.prefacturas_count > 0 || deps.ventas_count > 0 || deps.reservas_count > 0 || deps.grupos_count > 0) {
        throw new Error('No se puede eliminar la mesa porque tiene registros relacionados');
      }
      
      // Eliminar mesa
      const deleteResult = await client.query('DELETE FROM mesas WHERE id_mesa = 38 RETURNING *');
      
      if (deleteResult.rows.length > 0) {
        console.log('✅ Mesa eliminada exitosamente');
        await client.query('COMMIT');
      } else {
        console.log('❌ No se pudo eliminar la mesa');
        await client.query('ROLLBACK');
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.log('❌ Error en eliminación normal:', error.message);
      
      // 4. Intentar eliminación forzada
      console.log('\n4️⃣ Intentando eliminación forzada...');
      try {
        await client.query('BEGIN');
        
        // Limpiar dependencias
        console.log('🧹 Limpiando dependencias...');
        
        if (deps.prefacturas_count > 0) {
          await client.query('DELETE FROM prefacturas WHERE id_mesa = 38');
          console.log(`   ✅ ${deps.prefacturas_count} prefacturas eliminadas`);
        }
        
        if (deps.reservas_count > 0) {
          await client.query('DELETE FROM reservas WHERE id_mesa = 38');
          console.log(`   ✅ ${deps.reservas_count} reservas eliminadas`);
        }
        
        if (deps.grupos_count > 0) {
          await client.query('DELETE FROM mesas_en_grupo WHERE id_mesa = 38');
          console.log(`   ✅ ${deps.grupos_count} grupos eliminados`);
        }
        
        if (deps.ventas_count > 0) {
          await client.query('UPDATE ventas SET id_mesa = NULL, mesa_numero = NULL WHERE id_mesa = 38');
          console.log(`   ✅ ${deps.ventas_count} ventas actualizadas`);
        }
        
        // Eliminar mesa
        const deleteResult = await client.query('DELETE FROM mesas WHERE id_mesa = 38 RETURNING *');
        
        if (deleteResult.rows.length > 0) {
          console.log('✅ Mesa eliminada exitosamente (forzada)');
          await client.query('COMMIT');
        } else {
          console.log('❌ No se pudo eliminar la mesa después de limpiar dependencias');
          await client.query('ROLLBACK');
        }
        
      } catch (error2) {
        await client.query('ROLLBACK');
        console.log('❌ Error en eliminación forzada:', error2.message);
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
    await testEliminarMesaDirecto();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();
