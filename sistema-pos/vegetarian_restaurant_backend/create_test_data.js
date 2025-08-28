const { Pool } = require('pg');
const dbConfig = require('./config_db_local');

const pool = new Pool(dbConfig);

async function createTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🎯 CREANDO DATOS DE PRUEBA PARA EL SISTEMA DE EGRESOS\n');
    console.log('=' .repeat(60));
    
    // 1. VERIFICAR DATOS EXISTENTES
    console.log('\n🔍 1. VERIFICANDO DATOS EXISTENTES...');
    
    const egresosCount = await client.query('SELECT COUNT(*) FROM egresos');
    const presupuestosCount = await client.query('SELECT COUNT(*) FROM presupuestos_egresos');
    
    console.log(`   📊 Egresos existentes: ${egresosCount.rows[0].count}`);
    console.log(`   📊 Presupuestos existentes: ${presupuestosCount.rows[0].count}`);
    
    // 2. OBTENER IDs NECESARIOS
    console.log('\n🏪 2. OBTENIENDO IDs DEL SISTEMA...');
    
    const restauranteResult = await client.query('SELECT id_restaurante FROM restaurantes LIMIT 1');
    const sucursalResult = await client.query('SELECT id_sucursal FROM sucursales LIMIT 1');
    const vendedorResult = await client.query('SELECT id_vendedor FROM vendedores LIMIT 1');
    const categoriasResult = await client.query('SELECT id_categoria_egreso, nombre FROM categorias_egresos LIMIT 5');
    
    if (!restauranteResult.rows[0] || !sucursalResult.rows[0] || !vendedorResult.rows[0]) {
      throw new Error('Faltan datos básicos del sistema (restaurante, sucursal, vendedor)');
    }
    
    const id_restaurante = restauranteResult.rows[0].id_restaurante;
    const id_sucursal = sucursalResult.rows[0].id_sucursal;
    const id_vendedor = vendedorResult.rows[0].id_vendedor;
    
    console.log(`   ✅ Restaurante ID: ${id_restaurante}`);
    console.log(`   ✅ Sucursal ID: ${id_sucursal}`);
    console.log(`   ✅ Vendedor ID: ${id_vendedor}`);
    console.log(`   ✅ Categorías disponibles: ${categoriasResult.rows.length}`);
    
    // 3. CREAR EGRESOS DE PRUEBA
    console.log('\n💰 3. CREANDO EGRESOS DE PRUEBA...');
    
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
      
      console.log(`   🎉 ${egresosPrueba.length} egresos de prueba creados`);
    } else {
      console.log('   ✅ Ya existen egresos en el sistema');
    }
    
    // 4. CREAR PRESUPUESTOS DE PRUEBA
    console.log('\n📊 4. CREANDO PRESUPUESTOS DE PRUEBA...');
    
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
      
      console.log(`   🎉 Presupuestos creados para ${mes}/${anio}`);
    } else {
      console.log('   ✅ Ya existen presupuestos en el sistema');
    }
    
    // 5. VERIFICAR RESULTADO FINAL
    console.log('\n🔍 5. VERIFICANDO RESULTADO FINAL...');
    
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
      
      console.log('   📝 Muestra de egresos:');
      egresosSample.rows.forEach(egreso => {
        console.log(`      💰 ${egreso.concepto}: $${egreso.monto} (${egreso.estado}) - ${egreso.fecha_egreso}`);
      });
    }
    
    console.log('\n🎉 ¡DATOS DE PRUEBA CREADOS EXITOSAMENTE!');
    console.log('💡 El frontend ahora debería mostrar datos');
    console.log('🚀 Reinicia el backend y prueba nuevamente');
    
  } catch (error) {
    console.error('❌ Error durante la creación de datos:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar creación de datos
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log('\n✅ Creación de datos de prueba finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Creación de datos falló:', error);
      process.exit(1);
    });
}

module.exports = { createTestData };
