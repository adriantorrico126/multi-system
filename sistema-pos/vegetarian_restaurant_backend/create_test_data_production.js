const { Pool } = require('pg');
const dbConfig = require('./config_db_production'); // Usar configuración de PRODUCCIÓN sin SSL

const pool = new Pool(dbConfig);

async function createTestDataProduction() {
  const client = await pool.connect();
  
  try {
    console.log('🎯 CREANDO DATOS DE PRUEBA EN PRODUCCIÓN (DIGITALOCEAN)\n');
    console.log('=' .repeat(60));
    
    // 1. VERIFICAR CONEXIÓN A PRODUCCIÓN
    console.log('\n🔍 1. VERIFICANDO CONEXIÓN A PRODUCCIÓN...');
    
    const versionResult = await client.query('SELECT version()');
    console.log('✅ Conexión exitosa a PostgreSQL en PRODUCCIÓN');
    console.log(`   Versión: ${versionResult.rows[0].version.split(' ')[0]}`);
    
    // 2. VERIFICAR DATOS EXISTENTES
    console.log('\n📊 2. VERIFICANDO DATOS EXISTENTES EN PRODUCCIÓN...');
    
    const egresosCount = await client.query('SELECT COUNT(*) FROM egresos');
    const presupuestosCount = await client.query('SELECT COUNT(*) FROM presupuestos_egresos');
    const restaurantesCount = await client.query('SELECT COUNT(*) FROM restaurantes');
    
    console.log(`   📊 Restaurantes: ${restaurantesCount.rows[0].count}`);
    console.log(`   📊 Egresos: ${egresosCount.rows[0].count}`);
    console.log(`   📊 Presupuestos: ${presupuestosCount.rows[0].count}`);
    
    // 3. OBTENER O CREAR DATOS BÁSICOS
    console.log('\n🏪 3. PREPARANDO DATOS BÁSICOS...');
    
    let id_restaurante, id_sucursal, id_vendedor;
    
    // Verificar si ya existe un restaurante
    const restauranteResult = await client.query('SELECT id_restaurante FROM restaurantes LIMIT 1');
    
    if (restauranteResult.rows.length === 0) {
      console.log('   💡 Creando restaurante en producción...');
      
      const newRestaurante = await client.query(`
        INSERT INTO restaurantes (nombre, direccion, telefono, email, activo)
        VALUES ('Restaurante Demo', 'Dirección Demo', '+591 123456789', 'demo@restaurante.com', true)
        RETURNING id_restaurante
      `);
      
      id_restaurante = newRestaurante.rows[0].id_restaurante;
      console.log(`   ✅ Restaurante creado: ID ${id_restaurante}`);
    } else {
      id_restaurante = restauranteResult.rows[0].id_restaurante;
      console.log(`   ✅ Restaurante existente: ID ${id_restaurante}`);
    }
    
    // Verificar si ya existe una sucursal
    const sucursalResult = await client.query('SELECT id_sucursal FROM sucursales WHERE id_restaurante = $1 LIMIT 1', [id_restaurante]);
    
    if (sucursalResult.rows.length === 0) {
      console.log('   💡 Creando sucursal en producción...');
      
      const newSucursal = await client.query(`
        INSERT INTO sucursales (nombre, direccion, ciudad, activo, id_restaurante)
        VALUES ('Sucursal Principal', 'Dirección Sucursal', 'La Paz', true, $1)
        RETURNING id_sucursal
      `, [id_restaurante]);
      
      id_sucursal = newSucursal.rows[0].id_sucursal;
      console.log(`   ✅ Sucursal creada: ID ${id_sucursal}`);
    } else {
      id_sucursal = sucursalResult.rows[0].id_sucursal;
      console.log(`   ✅ Sucursal existente: ID ${id_sucursal}`);
    }
    
    // Verificar si ya existe un vendedor
    const vendedorResult = await client.query('SELECT id_vendedor FROM vendedores WHERE id_restaurante = $1 LIMIT 1', [id_restaurante]);
    
    if (vendedorResult.rows.length === 0) {
      console.log('   💡 Creando vendedor en producción...');
      
      const newVendedor = await client.query(`
        INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, id_sucursal, id_restaurante)
        VALUES ('Admin Demo', 'admin', 'admin@restaurante.com', '$2b$10$demo.hash.for.testing', 'admin', true, $1, $2)
        RETURNING id_vendedor
      `, [id_sucursal, id_restaurante]);
      
      id_vendedor = newVendedor.rows[0].id_vendedor;
      console.log(`   ✅ Vendedor creado: ID ${id_vendedor}`);
    } else {
      id_vendedor = vendedorResult.rows[0].id_vendedor;
      console.log(`   ✅ Vendedor existente: ID ${id_vendedor}`);
    }
    
    // 4. VERIFICAR CATEGORÍAS DE EGRESOS
    console.log('\n📂 4. VERIFICANDO CATEGORÍAS DE EGRESOS...');
    
    const categoriasResult = await client.query('SELECT id_categoria_egreso, nombre FROM categorias_egresos WHERE id_restaurante = $1', [id_restaurante]);
    
    if (categoriasResult.rows.length === 0) {
      console.log('   💡 Creando categorías de egresos en producción...');
      
      const categoriasDefault = [
        { nombre: 'Gastos Operativos', descripcion: 'Gastos generales de operación' },
        { nombre: 'Mantenimiento', descripcion: 'Mantenimiento de equipos e instalaciones' },
        { nombre: 'Limpieza', descripcion: 'Productos y servicios de limpieza' },
        { nombre: 'Insumos', descripcion: 'Insumos y materiales' },
        { nombre: 'Servicios', descripcion: 'Servicios externos y contrataciones' }
      ];
      
      for (const categoria of categoriasDefault) {
        await client.query(`
          INSERT INTO categorias_egresos (nombre, descripcion, activa, id_restaurante)
          VALUES ($1, $2, true, $3)
        `, [categoria.nombre, categoria.descripcion, id_restaurante]);
      }
      
      console.log(`   ✅ ${categoriasDefault.length} categorías creadas`);
      
      // Obtener las categorías recién creadas
      const nuevasCategorias = await client.query('SELECT id_categoria_egreso, nombre FROM categorias_egresos WHERE id_restaurante = $1', [id_restaurante]);
      categoriasResult.rows = nuevasCategorias.rows;
    } else {
      console.log(`   ✅ Categorías existentes: ${categoriasResult.rows.length}`);
    }
    
    // 5. CREAR EGRESOS DE PRUEBA
    console.log('\n💰 5. CREANDO EGRESOS DE PRUEBA EN PRODUCCIÓN...');
    
    if (parseInt(egresosCount.rows[0].count) === 0) {
      const egresosPrueba = [
        {
          concepto: 'Limpieza del local',
          descripcion: 'Productos de limpieza para la semana',
          monto: 45.50,
          fecha_egreso: new Date().toISOString().split('T')[0],
          id_categoria_egreso: categoriasResult.rows[0].id_categoria_egreso,
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
          id_categoria_egreso: categoriasResult.rows[1]?.id_categoria_egreso || categoriasResult.rows[0].id_categoria_egreso,
          metodo_pago: 'tarjeta_debito',
          proveedor_nombre: 'Servicio Técnico ABC',
          estado: 'pendiente',
          registrado_por: id_vendedor,
          id_sucursal: id_sucursal,
          id_restaurante: id_restaurante
        },
        {
          concepto: 'Insumos de oficina',
          descripcion: 'Papelería y artículos de oficina',
          monto: 25.75,
          fecha_egreso: new Date().toISOString().split('T')[0],
          id_categoria_egreso: categoriasResult.rows[2]?.id_categoria_egreso || categoriasResult.rows[0].id_categoria_egreso,
          metodo_pago: 'efectivo',
          proveedor_nombre: 'Papelería Central',
          estado: 'pagado',
          registrado_por: id_vendedor,
          id_sucursal: id_sucursal,
          id_restaurante: id_restaurante
        },
        {
          concepto: 'Servicios de internet',
          descripcion: 'Mensualidad de internet y telefonía',
          monto: 89.99,
          fecha_egreso: new Date().toISOString().split('T')[0],
          id_categoria_egreso: categoriasResult.rows[3]?.id_categoria_egreso || categoriasResult.rows[0].id_categoria_egreso,
          metodo_pago: 'transferencia',
          proveedor_nombre: 'Proveedor de Internet',
          estado: 'pagado',
          registrado_por: id_vendedor,
          id_sucursal: id_sucursal,
          id_restaurante: id_restaurante
        },
        {
          concepto: 'Mantenimiento preventivo',
          descripcion: 'Revisión y mantenimiento de equipos',
          monto: 75.00,
          fecha_egreso: new Date().toISOString().split('T')[0],
          id_categoria_egreso: categoriasResult.rows[4]?.id_categoria_egreso || categoriasResult.rows[0].id_categoria_egreso,
          metodo_pago: 'efectivo',
          proveedor_nombre: 'Servicio Técnico XYZ',
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
          
          console.log(`   ✅ Egreso creado: ${egreso.concepto} (ID: ${insertResult.rows[0].id_egreso})`);
        } catch (error) {
          console.log(`   ⚠️  Error creando egreso: ${error.message}`);
        }
      }
      
      console.log(`   🎉 ${egresosPrueba.length} egresos de prueba creados en PRODUCCIÓN`);
    } else {
      console.log('   ✅ Ya existen egresos en producción');
    }
    
    // 6. CREAR PRESUPUESTOS DE PRUEBA
    console.log('\n📊 6. CREANDO PRESUPUESTOS DE PRUEBA EN PRODUCCIÓN...');
    
    if (parseInt(presupuestosCount.rows[0].count) === 0) {
      const anio = new Date().getFullYear();
      const mes = new Date().getMonth() + 1;
      
      for (const categoria of categoriasResult.rows) {
        try {
          const montoPresupuestado = Math.floor(Math.random() * 500) + 100; // Entre 100 y 600
          
          await client.query(`
            INSERT INTO presupuestos_egresos (
              anio, mes, id_categoria_egreso, monto_presupuestado, id_restaurante
            ) VALUES ($1, $2, $3, $4, $5)
          `, [anio, mes, categoria.id_categoria_egreso, montoPresupuestado, id_restaurante]);
          
          console.log(`   ✅ Presupuesto creado para ${categoria.nombre}: $${montoPresupuestado}`);
        } catch (error) {
          console.log(`   ⚠️  Error creando presupuesto para ${categoria.nombre}: ${error.message}`);
        }
      }
      
      console.log(`   🎉 Presupuestos creados para ${mes}/${anio} en PRODUCCIÓN`);
    } else {
      console.log('   ✅ Ya existen presupuestos en producción');
    }
    
    // 7. VERIFICAR RESULTADO FINAL
    console.log('\n🔍 7. VERIFICANDO RESULTADO FINAL EN PRODUCCIÓN...');
    
    const finalEgresosCount = await client.query('SELECT COUNT(*) FROM egresos');
    const finalPresupuestosCount = await client.query('SELECT COUNT(*) FROM presupuestos_egresos');
    
    console.log(`   📊 Total de egresos: ${finalEgresosCount.rows[0].count}`);
    console.log(`   📊 Total de presupuestos: ${finalPresupuestosCount.rows[0].count}`);
    
    if (parseInt(finalEgresosCount.rows[0].count) > 0) {
      const egresosSample = await client.query(`
        SELECT concepto, monto, estado, fecha_egreso
        FROM egresos
        ORDER BY fecha_egreso DESC
        LIMIT 3
      `);
      
      console.log('   📝 Muestra de egresos en PRODUCCIÓN:');
      egresosSample.rows.forEach(egreso => {
        console.log(`      💰 ${egreso.concepto}: $${egreso.monto} (${egreso.estado}) - ${egreso.fecha_egreso}`);
      });
    }
    
    console.log('\n🎉 ¡DATOS DE PRUEBA CREADOS EXITOSAMENTE EN PRODUCCIÓN!');
    console.log('💡 El frontend ahora debería mostrar datos');
    console.log('🚀 No es necesario reiniciar el backend');
    
  } catch (error) {
    console.error('❌ Error durante la creación de datos en producción:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar creación de datos en producción
if (require.main === module) {
  createTestDataProduction()
    .then(() => {
      console.log('\n✅ Creación de datos en producción finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Creación en producción falló:', error);
      process.exit(1);
    });
}

module.exports = { createTestDataProduction };
