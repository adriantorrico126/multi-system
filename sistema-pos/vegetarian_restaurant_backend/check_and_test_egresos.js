const { Pool } = require('pg');
const dbConfig = require('./config_db');

// Configuración de la base de datos
const pool = new Pool(dbConfig);

async function checkAndTestEgresos() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando estado del sistema de egresos...\n');
    
    // 1. Verificar tablas existentes
    console.log('📋 Verificando tablas...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('categorias_egresos', 'egresos', 'presupuestos_egresos')
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No se encontraron las tablas de egresos');
      console.log('💡 Ejecuta primero: node migrate_egresos_corrected.js');
      return;
    }
    
    console.log('✅ Tablas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // 2. Verificar restaurantes
    console.log('\n🏪 Verificando restaurantes...');
    const restaurantesResult = await client.query('SELECT id_restaurante, nombre FROM restaurantes');
    if (restaurantesResult.rows.length === 0) {
      console.log('❌ No hay restaurantes en la base de datos');
      return;
    }
    
    console.log(`✅ Restaurantes encontrados: ${restaurantesResult.rows.length}`);
    restaurantesResult.rows.forEach(r => {
      console.log(`   - ID: ${r.id_restaurante}, Nombre: ${r.nombre}`);
    });
    
    const id_restaurante = restaurantesResult.rows[0].id_restaurante;
    console.log(`🎯 Usando restaurante ID: ${id_restaurante}`);
    
    // 3. Verificar sucursales
    console.log('\n🏢 Verificando sucursales...');
    const sucursalesResult = await client.query(`
      SELECT id_sucursal, nombre, ciudad 
      FROM sucursales 
      WHERE id_restaurante = $1
    `, [id_restaurante]);
    
    if (sucursalesResult.rows.length === 0) {
      console.log('❌ No hay sucursales para este restaurante');
      return;
    }
    
    console.log(`✅ Sucursales encontradas: ${sucursalesResult.rows.length}`);
    sucursalesResult.rows.forEach(s => {
      console.log(`   - ID: ${s.id_sucursal}, Nombre: ${s.nombre}, Ciudad: ${s.ciudad}`);
    });
    
    const id_sucursal = sucursalesResult.rows[0].id_sucursal;
    console.log(`🎯 Usando sucursal ID: ${id_sucursal}`);
    
    // 4. Verificar vendedores
    console.log('\n👥 Verificando vendedores...');
    const vendedoresResult = await client.query(`
      SELECT id_vendedor, nombre, username, rol 
      FROM vendedores 
      WHERE id_restaurante = $1 AND id_sucursal = $2
    `, [id_restaurante, id_sucursal]);
    
    if (vendedoresResult.rows.length === 0) {
      console.log('❌ No hay vendedores para esta sucursal');
      return;
    }
    
    console.log(`✅ Vendedores encontrados: ${vendedoresResult.rows.length}`);
    vendedoresResult.rows.forEach(v => {
      console.log(`   - ID: ${v.id_vendedor}, Nombre: ${v.nombre}, Username: ${v.username}, Rol: ${v.rol}`);
    });
    
    const id_vendedor = vendedoresResult.rows[0].id_vendedor;
    console.log(`🎯 Usando vendedor ID: ${id_vendedor}`);
    
    // 5. Verificar categorías de egresos
    console.log('\n📂 Verificando categorías de egresos...');
    const categoriasResult = await client.query(`
      SELECT id_categoria_egreso, nombre, activo 
      FROM categorias_egresos 
      WHERE id_restaurante = $1
    `, [id_restaurante]);
    
    if (categoriasResult.rows.length === 0) {
      console.log('❌ No hay categorías de egresos');
      console.log('💡 Ejecuta primero: node migrate_egresos_corrected.js');
      return;
    }
    
    console.log(`✅ Categorías encontradas: ${categoriasResult.rows.length}`);
    categoriasResult.rows.forEach(c => {
      console.log(`   - ID: ${c.id_categoria_egreso}, Nombre: ${c.nombre}, Activo: ${c.activo}`);
    });
    
    const id_categoria = categoriasResult.rows[0].id_categoria_egreso;
    
    // 6. Verificar egresos existentes
    console.log('\n💰 Verificando egresos existentes...');
    const egresosResult = await client.query(`
      SELECT COUNT(*) as total 
      FROM egresos 
      WHERE id_restaurante = $1
    `, [id_restaurante]);
    
    const totalEgresos = parseInt(egresosResult.rows[0].total);
    console.log(`📊 Total de egresos: ${totalEgresos}`);
    
    if (totalEgresos === 0) {
      console.log('💡 No hay egresos. Creando datos de prueba...');
      
      // Crear egresos de prueba
      const egresosPrueba = [
        {
          concepto: 'Limpieza del local',
          descripcion: 'Productos de limpieza para la semana',
          monto: 45.50,
          fecha_egreso: new Date().toISOString().split('T')[0],
          id_categoria_egreso: id_categoria,
          metodo_pago: 'efectivo',
          proveedor_nombre: 'Proveedor Local',
          estado: 'pagado',
          registrado_por: id_vendedor,
          id_sucursal: id_sucursal,
          id_restaurante: id_restaurante
        },
        {
          concepto: 'Mantenimiento de equipos',
          descripcion: 'Reparación de la cafetera',
          monto: 120.00,
          fecha_egreso: new Date().toISOString().split('T')[0],
          id_categoria_egreso: id_categoria,
          metodo_pago: 'tarjeta_debito',
          proveedor_nombre: 'Servicio Técnico ABC',
          estado: 'pendiente',
          registrado_por: id_vendedor,
          id_sucursal: id_sucursal,
          id_restaurante: id_restaurante
        }
      ];
      
      for (const egreso of egresosPrueba) {
        try {
          const insertResult = await client.query(`
            INSERT INTO egresos (
              concepto, descripcion, monto, fecha_egreso, id_categoria_egreso,
              metodo_pago, proveedor_nombre, estado, registrado_por, 
              id_sucursal, id_restaurante
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id_egreso
          `, [
            egreso.concepto, egreso.descripcion, egreso.monto, egreso.fecha_egreso,
            egreso.id_categoria_egreso, egreso.metodo_pago, egreso.proveedor_nombre,
            egreso.estado, egreso.registrado_por, egreso.id_sucursal, egreso.id_restaurante
          ]);
          
          console.log(`✅ Egreso creado: ${egreso.concepto} (ID: ${insertResult.rows[0].id_egreso})`);
        } catch (error) {
          console.error(`❌ Error creando egreso: ${error.message}`);
        }
      }
      
      // Verificar total después de la inserción
      const egresosDespuesResult = await client.query(`
        SELECT COUNT(*) as total 
        FROM egresos 
        WHERE id_restaurante = $1
      `, [id_restaurante]);
      
      console.log(`📊 Total de egresos después de inserción: ${egresosDespuesResult.rows[0].total}`);
    }
    
    // 7. Verificar presupuestos
    console.log('\n📊 Verificando presupuestos...');
    const presupuestosResult = await client.query(`
      SELECT COUNT(*) as total 
      FROM presupuestos_egresos 
      WHERE id_restaurante = $1
    `, [id_restaurante]);
    
    const totalPresupuestos = parseInt(presupuestosResult.rows[0].total);
    console.log(`📈 Total de presupuestos: ${totalPresupuestos}`);
    
    if (totalPresupuestos === 0) {
      console.log('💡 Creando presupuesto de prueba...');
      
      try {
        const anio = new Date().getFullYear();
        const mes = new Date().getMonth() + 1;
        
        await client.query(`
          INSERT INTO presupuestos_egresos (
            anio, mes, id_categoria_egreso, monto_presupuestado, id_restaurante
          ) VALUES ($1, $2, $3, $4, $5)
        `, [anio, mes, id_categoria, 1000.00, id_restaurante]);
        
        console.log(`✅ Presupuesto creado para ${mes}/${anio}`);
      } catch (error) {
        console.error(`❌ Error creando presupuesto: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Verificación completada!');
    console.log('💡 Ahora prueba el frontend - debería mostrar datos');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar verificación
if (require.main === module) {
  checkAndTestEgresos()
    .then(() => {
      console.log('✅ Verificación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verificación falló:', error);
      process.exit(1);
    });
}

module.exports = { checkAndTestEgresos };
