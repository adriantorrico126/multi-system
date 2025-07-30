const { pool } = require('./src/config/database');
const GrupoMesaModel = require('./src/models/grupoMesaModel');

async function testGrupoPrefactura() {
  try {
    console.log('🔍 Probando lógica de prefactura de grupos...');
    
    // 1. Buscar un grupo activo
    const grupoQuery = `
      SELECT g.id_grupo_mesa, g.created_at, g.estado, g.id_restaurante
      FROM grupos_mesas g
      WHERE g.estado = 'ABIERTO'
      LIMIT 1
    `;
    
    const grupoResult = await pool.query(grupoQuery);
    if (grupoResult.rows.length === 0) {
      console.log('❌ No se encontraron grupos activos para probar');
      return;
    }
    
    const grupo = grupoResult.rows[0];
    console.log(`✅ Grupo encontrado: ID=${grupo.id_grupo_mesa}, Creado=${grupo.created_at}, Estado=${grupo.estado}`);
    
    // 2. Obtener mesas del grupo
    const mesasQuery = `
      SELECT m.id_mesa, m.numero, m.total_acumulado
      FROM mesas m
      JOIN mesas_en_grupo mg ON m.id_mesa = mg.id_mesa
      WHERE mg.id_grupo_mesa = $1
    `;
    
    const mesasResult = await pool.query(mesasQuery, [grupo.id_grupo_mesa]);
    console.log(`📊 Mesas en el grupo: ${mesasResult.rows.length}`);
    mesasResult.rows.forEach((mesa, index) => {
      console.log(`  Mesa ${index + 1}: ID=${mesa.id_mesa}, Número=${mesa.numero}, Total=${mesa.total_acumulado}`);
    });
    
    // 3. Verificar ventas antes del grupo
    console.log('\n📅 Verificando ventas antes del grupo...');
    for (const mesa of mesasResult.rows) {
      const ventasAntesQuery = `
        SELECT COUNT(*) as total_ventas, COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) as total_monto
        FROM ventas v
        JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE v.id_mesa = $1 
          AND v.fecha < $2
          AND v.estado != 'cancelado'
      `;
      
      const ventasAntesResult = await pool.query(ventasAntesQuery, [mesa.id_mesa, grupo.created_at]);
      const ventasAntes = ventasAntesResult.rows[0];
      console.log(`  Mesa ${mesa.numero}: ${ventasAntes.total_ventas} ventas anteriores ($${ventasAntes.total_monto})`);
    }
    
    // 4. Verificar ventas durante el grupo
    console.log('\n📅 Verificando ventas durante el grupo...');
    for (const mesa of mesasResult.rows) {
      const ventasDuranteQuery = `
        SELECT COUNT(*) as total_ventas, COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) as total_monto
        FROM ventas v
        JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        WHERE v.id_mesa = $1 
          AND v.fecha >= $2
          AND v.estado != 'cancelado'
      `;
      
      const ventasDuranteResult = await pool.query(ventasDuranteQuery, [mesa.id_mesa, grupo.created_at]);
      const ventasDurante = ventasDuranteResult.rows[0];
      console.log(`  Mesa ${mesa.numero}: ${ventasDurante.total_ventas} ventas durante el grupo ($${ventasDurante.total_monto})`);
    }
    
    // 5. Generar prefactura del grupo
    console.log('\n🔧 Generando prefactura del grupo...');
    try {
      const prefactura = await GrupoMesaModel.generarPrefacturaGrupo(grupo.id_grupo_mesa);
      console.log('✅ Prefactura generada exitosamente:');
      console.log(`  - ID Grupo: ${prefactura.id_grupo_mesa}`);
      console.log(`  - Mesas: ${prefactura.mesas.join(', ')}`);
      console.log(`  - Total Acumulado: $${prefactura.total_acumulado}`);
      console.log(`  - Total Ventas: ${prefactura.total_ventas}`);
      console.log(`  - Fecha Apertura: ${prefactura.fecha_apertura}`);
      console.log(`  - Productos Diferentes: ${prefactura.cantidad_productos}`);
      
      if (prefactura.historial && prefactura.historial.length > 0) {
        console.log('\n🍽️ Productos en la prefactura:');
        prefactura.historial.forEach((producto, index) => {
          console.log(`  ${index + 1}. ${producto.nombre_producto}: ${producto.cantidad_total} x $${producto.precio_unitario} = $${producto.subtotal_total}`);
        });
      } else {
        console.log('\n📝 No hay productos en la prefactura');
      }
      
    } catch (error) {
      console.error('❌ Error generando prefactura:', error.message);
    }
    
    // 6. Simular cierre del grupo
    console.log('\n🔒 Simulando cierre del grupo...');
    try {
      await GrupoMesaModel.cerrarGrupo(grupo.id_grupo_mesa);
      console.log('✅ Grupo cerrado exitosamente');
      
      // Verificar estado de las mesas después del cierre
      const mesasDespuesQuery = `
        SELECT m.id_mesa, m.numero, m.estado, m.total_acumulado, m.id_grupo_mesa
        FROM mesas m
        WHERE m.id_mesa = ANY($1)
      `;
      
      const mesasIds = mesasResult.rows.map(m => m.id_mesa);
      const mesasDespuesResult = await pool.query(mesasDespuesQuery, [mesasIds]);
      
      console.log('\n📊 Estado de las mesas después del cierre:');
      mesasDespuesResult.rows.forEach((mesa) => {
        console.log(`  Mesa ${mesa.numero}: Estado=${mesa.estado}, Total=${mesa.total_acumulado}, Grupo=${mesa.id_grupo_mesa}`);
      });
      
    } catch (error) {
      console.error('❌ Error cerrando grupo:', error.message);
    }
    
    console.log('\n✅ Prueba de prefactura de grupos completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await pool.end();
  }
}

testGrupoPrefactura(); 