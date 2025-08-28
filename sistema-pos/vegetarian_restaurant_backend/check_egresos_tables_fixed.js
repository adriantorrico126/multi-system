const { Pool } = require('pg');
const dbConfig = require('./config_db');

// Configuración de la base de datos desde archivo de configuración
const pool = new Pool(dbConfig);

async function checkEgresosTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando tablas del sistema de egresos...\n');
    console.log('📊 Configuración de conexión:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    console.log(`   Usuario: ${dbConfig.user}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Contraseña: ${dbConfig.password ? '***CONFIGURADA***' : '❌ NO CONFIGURADA'}\n`);
    
    // Tablas que deberían existir
    const requiredTables = [
      'categorias_egresos',
      'egresos', 
      'presupuestos_egresos'
    ];
    
    console.log('📋 TABLAS REQUERIDAS:');
    console.log('========================');
    
    for (const table of requiredTables) {
      try {
        // Verificar si la tabla existe
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          ) as exists
        `, [table]);
        
        if (tableExists.rows[0].exists) {
          console.log(`✅ ${table} - EXISTE`);
          
          // Contar registros
          try {
            const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`   📊 Registros: ${countResult.rows[0].count}`);
          } catch (countError) {
            console.log(`   ⚠️  Error al contar registros: ${countError.message}`);
          }
          
          // Mostrar estructura de la tabla
          try {
            const structureResult = await client.query(`
              SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns 
              WHERE table_name = $1 
              ORDER BY ordinal_position
            `, [table]);
            
            console.log(`   🏗️  Estructura:`);
            structureResult.rows.forEach(col => {
              const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
              const defaultValue = col.column_default ? ` DEFAULT ${col.column_default}` : '';
              console.log(`      - ${col.column_name}: ${col.data_type} ${nullable}${defaultValue}`);
            });
            
          } catch (structureError) {
            console.log(`   ⚠️  Error al obtener estructura: ${structureError.message}`);
          }
          
        } else {
          console.log(`❌ ${table} - NO EXISTE`);
        }
        
      } catch (error) {
        console.log(`❌ ${table} - ERROR: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Verificar restaurantes
    console.log('🏪 RESTAURANTES:');
    console.log('==================');
    try {
      const restaurantesResult = await client.query('SELECT id_restaurante, nombre FROM restaurantes');
      if (restaurantesResult.rows.length > 0) {
        restaurantesResult.rows.forEach(rest => {
          console.log(`✅ ID: ${rest.id_restaurante}, Nombre: ${rest.nombre}`);
        });
      } else {
        console.log('❌ No hay restaurantes en la base de datos');
      }
    } catch (error) {
      console.log(`❌ Error al verificar restaurantes: ${error.message}`);
    }
    
    console.log('');
    
    // Verificar usuarios
    console.log('👥 USUARIOS:');
    console.log('=============');
    try {
      const usuariosResult = await client.query('SELECT id, username, rol FROM users LIMIT 5');
      if (usuariosResult.rows.length > 0) {
        usuariosResult.rows.forEach(user => {
          console.log(`✅ ID: ${user.id}, Username: ${user.username}, Rol: ${user.rol}`);
        });
        if (usuariosResult.rows.length === 5) {
          console.log('   ... y más usuarios');
        }
      } else {
        console.log('❌ No hay usuarios en la base de datos');
      }
    } catch (error) {
      console.log(`❌ Error al verificar usuarios: ${error.message}`);
    }
    
    console.log('');
    
    // Verificar sucursales
    console.log('🏢 SUCURSALES:');
    console.log('===============');
    try {
      const sucursalesResult = await client.query('SELECT id_sucursal, nombre, ciudad FROM sucursales');
      if (sucursalesResult.rows.length > 0) {
        sucursalesResult.rows.forEach(suc => {
          console.log(`✅ ID: ${suc.id_sucursal}, Nombre: ${suc.nombre}, Ciudad: ${suc.ciudad}`);
        });
      } else {
        console.log('❌ No hay sucursales en la base de datos');
      }
    } catch (error) {
      console.log(`❌ Error al verificar sucursales: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar verificación
if (require.main === module) {
  checkEgresosTables()
    .then(() => {
      console.log('✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verificación falló:', error);
      process.exit(1);
    });
}

module.exports = { checkEgresosTables };
