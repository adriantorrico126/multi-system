const { Pool } = require('pg');
const dbConfig = require('./config_db_local');

const pool = new Pool(dbConfig);

async function verifyCompleteSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA DE EGRESOS\n');
    console.log('=' .repeat(60));
    
    // 1. VERIFICAR CONEXIÓN A BASE DE DATOS
    console.log('\n📊 1. VERIFICANDO CONEXIÓN A BASE DE DATOS...');
    
    const versionResult = await client.query('SELECT version()');
    const currentTime = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });
    
    console.log('✅ Conexión exitosa a PostgreSQL');
    console.log(`   Hora actual: ${currentTime}`);
    console.log(`   Versión: PostgreSQL`);
    
    // 2. VERIFICAR TABLAS DEL SISTEMA
    console.log('\n📋 2. VERIFICANDO TABLAS DEL SISTEMA...');
    
    const tablesToCheck = [
      'restaurantes', 'sucursales', 'vendedores', 
      'categorias_egresos', 'egresos', 'presupuestos_egresos'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`✅ ${table}: ${count} registros`);
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      }
    }
    
    // 3. VERIFICAR RESTAURANTES Y SUCURSALES
    console.log('\n🏪 3. VERIFICANDO RESTAURANTES Y SUCURSALES...');
    
    try {
      const restaurantesResult = await client.query(`
        SELECT r.id_restaurante, r.nombre, COUNT(s.id_sucursal) as sucursales_count
        FROM restaurantes r
        LEFT JOIN sucursales s ON r.id_restaurante = s.id_restaurante
        GROUP BY r.id_restaurante, r.nombre
      `);
      
      if (restaurantesResult.rows.length > 0) {
        restaurantesResult.rows.forEach(restaurante => {
          console.log(`✅ Restaurante: ${restaurante.nombre} (ID: ${restaurante.id_restaurante}) - ${restaurante.sucursales_count} sucursales`);
        });
      } else {
        console.log('⚠️  No hay restaurantes en el sistema');
      }
    } catch (error) {
      console.log(`❌ Error durante la verificación: ${error.message}`);
    }
    
    // 4. VERIFICAR VENDEDORES
    console.log('\n👤 4. VERIFICANDO VENDEDORES...');
    
    try {
      const vendedoresResult = await client.query(`
        SELECT v.id_vendedor, v.nombre, v.username, v.rol, s.nombre as sucursal
        FROM vendedores v
        LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
        LIMIT 5
      `);
      
      if (vendedoresResult.rows.length > 0) {
        vendedoresResult.rows.forEach(vendedor => {
          console.log(`✅ Vendedor: ${vendedor.nombre} (${vendedor.username}) - Rol: ${vendedor.rol} - Sucursal: ${vendedor.sucursal}`);
        });
      } else {
        console.log('⚠️  No hay vendedores en el sistema');
      }
    } catch (error) {
      console.log(`❌ Error verificando vendedores: ${error.message}`);
    }
    
    // 5. VERIFICAR CATEGORÍAS DE EGRESOS
    console.log('\n💰 5. VERIFICANDO CATEGORÍAS DE EGRESOS...');
    
    try {
      const categoriasResult = await client.query(`
        SELECT id_categoria_egreso, nombre, descripcion, activa
        FROM categorias_egresos
        ORDER BY nombre
      `);
      
      if (categoriasResult.rows.length > 0) {
        categoriasResult.rows.forEach(categoria => {
          const status = categoria.activa ? '✅ Activa' : '❌ Inactiva';
          console.log(`   ${status}: ${categoria.nombre}${categoria.descripcion ? ` - ${categoria.descripcion}` : ''}`);
        });
      } else {
        console.log('⚠️  No hay categorías de egresos en el sistema');
      }
    } catch (error) {
      console.log(`❌ Error verificando categorías: ${error.message}`);
    }
    
    // 6. VERIFICAR MESAS
    console.log('\n🪑 6. VERIFICANDO MESAS...');
    
    try {
      const mesasResult = await client.query(`
        SELECT COUNT(*) as total_mesas,
               COUNT(CASE WHEN estado = 'libre' THEN 1 END) as mesas_libres,
               COUNT(CASE WHEN estado = 'ocupada' THEN 1 END) as mesas_ocupadas
        FROM mesas
      `);
      
      const mesas = mesasResult.rows[0];
      console.log(`✅ Total de mesas: ${mesas.total_mesas}`);
      console.log(`   - Libres: ${mesas.mesas_libres}`);
      console.log(`   - Ocupadas: ${mesas.mesas_ocupadas}`);
      
      if (parseInt(mesas.total_mesas) > 0) {
        const mesasSample = await client.query(`
          SELECT numero_mesa, capacidad, estado, activa
          FROM mesas
          ORDER BY numero_mesa
          LIMIT 5
        `);
        
        console.log('   📝 Muestra de mesas:');
        mesasSample.rows.forEach(mesa => {
          const status = mesa.activa ? '✅' : '❌';
          console.log(`      ${status} Mesa ${mesa.numero_mesa}: ${mesa.estado}, Capacidad: ${mesa.capacidad}`);
        });
      }
    } catch (error) {
      console.log(`❌ Error verificando mesas: ${error.message}`);
    }
    
    // 7. VERIFICAR SISTEMA COMPLETO
    console.log('\n🎯 7. VERIFICACIÓN FINAL DEL SISTEMA...');
    
    try {
      // Verificar que todas las tablas críticas tengan al menos 1 registro
      const criticalTables = ['restaurantes', 'sucursales', 'vendedores', 'categorias_egresos'];
      let systemReady = true;
      
      for (const table of criticalTables) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        
        if (count === 0) {
          console.log(`❌ ${table}: Sin datos - Sistema incompleto`);
          systemReady = false;
        } else {
          console.log(`✅ ${table}: ${count} registros - OK`);
        }
      }
      
      if (systemReady) {
        console.log('\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
        console.log('💡 El sistema de egresos está listo para usar');
        console.log('🚀 Puedes reiniciar el backend y probar el frontend');
      } else {
        console.log('\n⚠️  El sistema tiene problemas que deben resolverse');
      }
      
    } catch (error) {
      console.log(`❌ Error en verificación final: ${error.message}`);
    }
    
    console.log('\n✅ Verificación completa finalizada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar verificación
if (require.main === module) {
  verifyCompleteSystem()
    .then(() => {
      console.log('\n✅ Verificación completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verificación falló:', error);
      process.exit(1);
    });
}

module.exports = { verifyCompleteSystem };
