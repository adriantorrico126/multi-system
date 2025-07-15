const db = require('./src/config/database');

async function createTestVentasSucursales() {
  try {
    console.log('📝 Creando ventas de prueba para diferentes sucursales...');
    
    // Verificar que existan los datos necesarios
    const vendedorResult = await db.query('SELECT id_vendedor FROM vendedores WHERE id_restaurante = 1 LIMIT 1');
    const sucursalesResult = await db.query('SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = 1');
    const pagoResult = await db.query('SELECT id_pago FROM metodos_pago WHERE id_restaurante = 1 LIMIT 1');
    
    if (vendedorResult.rows.length === 0) {
      console.log('❌ No hay vendedores. Creando vendedor de prueba...');
      await db.query(`
        INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, id_sucursal, id_restaurante)
        VALUES ('Admin Test', 'admin', 'admin@test.com', '$2b$10$test', 'admin', true, 1, 1)
      `);
    }
    
    if (sucursalesResult.rows.length === 0) {
      console.log('❌ No hay sucursales. Creando sucursales de prueba...');
      await db.query(`
        INSERT INTO sucursales (nombre, ciudad, direccion, activo, id_restaurante) VALUES 
        ('Sucursal Centro', 'La Paz', 'Av. Principal 123', true, 1),
        ('Sucursal Norte', 'La Paz', 'Av. Norte 456', true, 1),
        ('Sucursal Sur', 'La Paz', 'Av. Sur 789', true, 1)
      `);
    }
    
    if (pagoResult.rows.length === 0) {
      console.log('❌ No hay métodos de pago. Creando métodos de pago de prueba...');
      await db.query(`
        INSERT INTO metodos_pago (descripcion, activo, id_restaurante) VALUES 
        ('Efectivo', true, 1),
        ('Tarjeta', true, 1),
        ('Transferencia', true, 1)
      `);
    }
    
    // Obtener IDs
    const vendedorId = vendedorResult.rows[0]?.id_vendedor || 1;
    const sucursales = await db.query('SELECT id_sucursal, nombre FROM sucursales WHERE id_restaurante = 1');
    const pagoId = pagoResult.rows[0]?.id_pago || 1;
    
    console.log('🏢 Sucursales disponibles:', sucursales.rows.map(s => `${s.nombre} (ID: ${s.id_sucursal})`));
    
    // Crear ventas de prueba para diferentes sucursales usando las existentes
    const testVentas = [
      // Sucursal 3 (Fidel Anze)
      {
        fecha: '2025-01-15 10:30:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: 3,
        tipo_servicio: 'Mesa',
        total: 150.00,
        mesa_numero: 1,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-15 12:45:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: 3,
        tipo_servicio: 'Para Llevar',
        total: 85.50,
        mesa_numero: null,
        estado: 'entregado',
        id_restaurante: 1
      },
      // Sucursal 4 (16 de Julio)
      {
        fecha: '2025-01-15 11:00:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: 4,
        tipo_servicio: 'Mesa',
        total: 200.00,
        mesa_numero: 1,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-15 14:30:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: 4,
        tipo_servicio: 'Delivery',
        total: 175.25,
        mesa_numero: null,
        estado: 'entregado',
        id_restaurante: 1
      },
      // Sucursal 5 (Santa Cruz)
      {
        fecha: '2025-01-15 09:15:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: 5,
        tipo_servicio: 'Mesa',
        total: 120.00,
        mesa_numero: 2,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-15 13:20:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: 5,
        tipo_servicio: 'Para Llevar',
        total: 95.75,
        mesa_numero: null,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-15 16:45:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: 5,
        tipo_servicio: 'Delivery',
        total: 250.00,
        mesa_numero: null,
        estado: 'entregado',
        id_restaurante: 1
      }
    ];
    
    for (const venta of testVentas) {
      const query = `
        INSERT INTO ventas (fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado, id_restaurante, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `;
      await db.query(query, [
        venta.fecha,
        venta.id_vendedor,
        venta.id_pago,
        venta.id_sucursal,
        venta.tipo_servicio,
        venta.total,
        venta.mesa_numero,
        venta.estado,
        venta.id_restaurante
      ]);
    }
    
    console.log('✅ Ventas de prueba creadas para diferentes sucursales');
    
    // Mostrar resumen por sucursal
    const resumenPorSucursal = await db.query(`
      SELECT 
        s.nombre as sucursal,
        COUNT(v.id_venta) as total_ventas,
        SUM(v.total) as total_ingresos
      FROM sucursales s
      LEFT JOIN ventas v ON s.id_sucursal = v.id_sucursal AND v.id_restaurante = 1
      WHERE s.id_restaurante = 1
      GROUP BY s.id_sucursal, s.nombre
      ORDER BY s.id_sucursal
    `);
    
    console.log('\n📊 Resumen por sucursal:');
    resumenPorSucursal.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.sucursal}: ${row.total_ventas} ventas, Bs ${row.total_ingresos || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestVentasSucursales(); 