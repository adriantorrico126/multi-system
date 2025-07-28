const { pool } = require('./src/config/database');
const logger = require('./src/config/logger');

async function testPrefactura() {
  try {
    logger.info('🧪 Iniciando prueba de prefactura...');
    
    // 0. Verificar y crear sucursal si no existe
    const sucursalQuery = `
      SELECT * FROM sucursales 
      WHERE id_sucursal = 1 AND id_restaurante = 1
    `;
    const sucursalResult = await pool.query(sucursalQuery);
    
    if (sucursalResult.rows.length === 0) {
      logger.info('🏢 Creando sucursal de prueba...');
      await pool.query(`
        INSERT INTO sucursales (id_sucursal, nombre, ciudad, direccion, id_restaurante, activo)
        VALUES (1, 'Sucursal Principal', 'Ciudad', 'Dirección Principal', 1, true)
      `);
      logger.info('✅ Sucursal creada');
    } else {
      logger.info('✅ Sucursal encontrada');
    }
    
    // 1. Verificar que la mesa 1 existe
    const mesaQuery = `
      SELECT * FROM mesas 
      WHERE numero = 1 AND id_sucursal = 1 AND id_restaurante = 1
    `;
    const mesaResult = await pool.query(mesaQuery);
    
    if (mesaResult.rows.length === 0) {
      logger.info('❌ Mesa 1 no encontrada. Creando mesa...');
      await pool.query(`
        INSERT INTO mesas (numero, id_sucursal, capacidad, estado, id_restaurante)
        VALUES (1, 1, 4, 'en_uso', 1)
      `);
      logger.info('✅ Mesa 1 creada');
    } else {
      logger.info('✅ Mesa 1 encontrada');
    }

    // 2. Verificar y crear categorías si no existen
    const categoriasQuery = `
      SELECT * FROM categorias 
      WHERE id_restaurante = 1
    `;
    const categoriasResult = await pool.query(categoriasQuery);
    logger.info(`📂 Categorías disponibles: ${categoriasResult.rows.length}`);
    
    if (categoriasResult.rows.length === 0) {
      logger.info('📂 Creando categorías de ejemplo...');
      await pool.query(`
        INSERT INTO categorias (nombre, id_restaurante, activo)
        VALUES 
        ('Bebidas', 1, true),
        ('Platos Principales', 1, true),
        ('Café', 1, true)
      `);
      logger.info('✅ Categorías creadas');
    }
    
    // 3. Verificar productos disponibles
    const productosQuery = `
      SELECT id_producto, nombre, precio 
      FROM productos 
      WHERE id_restaurante = 1 
      LIMIT 5
    `;
    const productosResult = await pool.query(productosQuery);
    logger.info(`📦 Productos disponibles: ${productosResult.rows.length}`);
    
    if (productosResult.rows.length === 0) {
      logger.info('❌ No hay productos disponibles. Creando productos de ejemplo...');
      
      // Obtener IDs de categorías
      const catResult = await pool.query(`
        SELECT id_categoria, nombre FROM categorias WHERE id_restaurante = 1
      `);
      const bebidasCat = catResult.rows.find(c => c.nombre === 'Bebidas')?.id_categoria || 1;
      const platosCat = catResult.rows.find(c => c.nombre === 'Platos Principales')?.id_categoria || 2;
      const cafeCat = catResult.rows.find(c => c.nombre === 'Café')?.id_categoria || 3;
      
      // Crear productos de ejemplo
      await pool.query(`
        INSERT INTO productos (nombre, precio, id_categoria, stock_actual, activo, id_restaurante)
        VALUES 
        ('AGUA CON LIMON', 7.00, $1, 100, true, 1),
        ('FULL CITRUS', 14.00, $1, 50, true, 1),
        ('HAMBURGUESA VEGETARIANA', 12.50, $2, 30, true, 1),
        ('ENSALADA CÉSAR', 9.00, $2, 25, true, 1),
        ('CAFÉ AMERICANO', 3.50, $3, 200, true, 1)
      `, [bebidasCat, platosCat, cafeCat]);
      logger.info('✅ Productos de ejemplo creados');
    }

    // 4. Verificar y crear vendedor si no existe
    const vendedorQuery = `
      SELECT id_vendedor, nombre 
      FROM vendedores 
      WHERE id_restaurante = 1 
      LIMIT 1
    `;
    const vendedorResult = await pool.query(vendedorQuery);
    
    let vendedorId = 1; // Default
    if (vendedorResult.rows.length > 0) {
      vendedorId = vendedorResult.rows[0].id_vendedor;
      logger.info(`👤 Vendedor encontrado: ${vendedorResult.rows[0].nombre}`);
    } else {
      logger.info('👤 Creando vendedor de ejemplo...');
      await pool.query(`
        INSERT INTO vendedores (nombre, email, telefono, id_restaurante, activo)
        VALUES ('Vendedor Ejemplo', 'vendedor@ejemplo.com', '123456789', 1, true)
      `);
      vendedorId = 1;
      logger.info('✅ Vendedor creado');
    }

    // 5. Crear venta de ejemplo para mesa 1
    logger.info('🛒 Creando venta de ejemplo para mesa 1...');
    
    const ventaQuery = `
      INSERT INTO ventas (id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, id_restaurante, estado, fecha)
      VALUES ($1, NULL, 1, 'Mesa', 21.00, 1, 1, 'abierta', NOW())
      RETURNING id_venta
    `;
    const ventaResult = await pool.query(ventaQuery, [vendedorId]);
    const ventaId = ventaResult.rows[0].id_venta;
    logger.info(`✅ Venta creada con ID: ${ventaId}`);

    // 6. Agregar productos a la venta
    const productos = [
      { nombre: 'AGUA CON LIMON', cantidad: 1, precio: 7.00 },
      { nombre: 'FULL CITRUS', cantidad: 1, precio: 14.00 }
    ];

    for (const producto of productos) {
      // Obtener ID del producto
      const prodQuery = `
        SELECT id_producto FROM productos 
        WHERE nombre = $1 AND id_restaurante = 1
      `;
      const prodResult = await pool.query(prodQuery, [producto.nombre]);
      
      if (prodResult.rows.length > 0) {
        const productoId = prodResult.rows[0].id_producto;
        const subtotal = producto.cantidad * producto.precio;
        
        // Crear detalle de venta (el subtotal se calcula automáticamente)
        await pool.query(`
          INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, observaciones)
          VALUES ($1, $2, $3, $4, 'Pedido de prueba')
        `, [ventaId, productoId, producto.cantidad, producto.precio]);
        
        logger.info(`✅ Producto agregado: ${producto.nombre} x${producto.cantidad} = $${subtotal}`);
      } else {
        logger.error(`❌ Producto no encontrado: ${producto.nombre}`);
      }
    }

    // 7. Actualizar total de la venta
    const totalQuery = `
      SELECT COALESCE(SUM(subtotal), 0) as total
      FROM detalle_ventas 
      WHERE id_venta = $1
    `;
    const totalResult = await pool.query(totalQuery, [ventaId]);
    const totalVenta = totalResult.rows[0].total;
    
    await pool.query(`
      UPDATE ventas 
      SET total = $1 
      WHERE id_venta = $2
    `, [totalVenta, ventaId]);
    
    logger.info(`💰 Total de venta actualizado: $${totalVenta}`);

    // 8. Actualizar mesa con venta actual
    await pool.query(`
      UPDATE mesas 
      SET id_venta_actual = $1, total_acumulado = $2
      WHERE numero = 1 AND id_sucursal = 1 AND id_restaurante = 1
    `, [ventaId, totalVenta]);
    
    logger.info(`✅ Mesa 1 actualizada con venta actual`);

    // 9. Verificar datos creados
    logger.info('🔍 Verificando datos creados...');
    
    const ventasQuery = `
      SELECT v.*, COUNT(dv.id_detalle) as items
      FROM ventas v
      LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      WHERE v.mesa_numero = 1 AND v.id_sucursal = 1 AND v.id_restaurante = 1
      GROUP BY v.id_venta
    `;
    const ventasResult = await pool.query(ventasQuery);
    logger.info(`📊 Ventas en mesa 1: ${ventasResult.rows.length}`);
    ventasResult.rows.forEach(venta => {
      logger.info(`  - Venta ${venta.id_venta}: $${venta.total} (${venta.items} items)`);
    });

    const detallesQuery = `
      SELECT dv.*, p.nombre as producto_nombre
      FROM detalle_ventas dv
      JOIN productos p ON dv.id_producto = p.id_producto
      JOIN ventas v ON dv.id_venta = v.id_venta
      WHERE v.mesa_numero = 1 AND v.id_sucursal = 1 AND v.id_restaurante = 1
    `;
    const detallesResult = await pool.query(detallesQuery);
    logger.info(`📋 Detalles de venta: ${detallesResult.rows.length}`);
    detallesResult.rows.forEach(detalle => {
      logger.info(`  - ${detalle.producto_nombre}: x${detalle.cantidad} = $${detalle.subtotal}`);
    });

    logger.info('🎉 Prueba de prefactura completada exitosamente!');
    logger.info('💡 Ahora puedes probar la prefactura en el frontend');

  } catch (error) {
    logger.error('❌ Error en prueba de prefactura:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar la prueba
testPrefactura(); 