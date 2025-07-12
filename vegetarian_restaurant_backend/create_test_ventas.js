const db = require('./src/config/database');

async function createTestVentas() {
  try {
    console.log('📝 Creando ventas de prueba...');
    
    // Verificar que existan los datos necesarios
    const vendedorResult = await db.query('SELECT id_vendedor FROM vendedores WHERE id_restaurante = 1 LIMIT 1');
    const sucursalResult = await db.query('SELECT id_sucursal FROM sucursales WHERE id_restaurante = 1 LIMIT 1');
    const pagoResult = await db.query('SELECT id_pago FROM metodos_pago WHERE id_restaurante = 1 LIMIT 1');
    
    if (vendedorResult.rows.length === 0) {
      console.log('❌ No hay vendedores. Creando vendedor de prueba...');
      await db.query(`
        INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, id_sucursal, id_restaurante)
        VALUES ('Admin Test', 'admin', 'admin@test.com', '$2b$10$test', 'admin', true, 1, 1)
      `);
    }
    
    if (sucursalResult.rows.length === 0) {
      console.log('❌ No hay sucursales. Creando sucursal de prueba...');
      await db.query(`
        INSERT INTO sucursales (nombre, ciudad, direccion, activo, id_restaurante)
        VALUES ('Sucursal Principal', 'La Paz', 'Av. Principal 123', true, 1)
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
    const sucursalId = sucursalResult.rows[0]?.id_sucursal || 1;
    const pagoId = pagoResult.rows[0]?.id_pago || 1;
    
    // Crear ventas de prueba
    const testVentas = [
      {
        fecha: '2025-01-15 10:30:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: sucursalId,
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
        id_sucursal: sucursalId,
        tipo_servicio: 'Para Llevar',
        total: 85.50,
        mesa_numero: null,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-15 15:20:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: sucursalId,
        tipo_servicio: 'Delivery',
        total: 200.00,
        mesa_numero: null,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-16 09:15:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: sucursalId,
        tipo_servicio: 'Mesa',
        total: 120.00,
        mesa_numero: 2,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-16 14:30:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: sucursalId,
        tipo_servicio: 'Para Llevar',
        total: 95.75,
        mesa_numero: null,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-17 11:00:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: sucursalId,
        tipo_servicio: 'Mesa',
        total: 180.00,
        mesa_numero: 3,
        estado: 'entregado',
        id_restaurante: 1
      },
      {
        fecha: '2025-01-17 16:45:00',
        id_vendedor: vendedorId,
        id_pago: pagoId,
        id_sucursal: sucursalId,
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
    
    console.log('✅ 7 ventas de prueba creadas exitosamente');
    
    // Mostrar resumen
    const totalVentas = await db.query('SELECT COUNT(*) as total FROM ventas WHERE id_restaurante = 1');
    const totalIngresos = await db.query('SELECT SUM(total) as total FROM ventas WHERE id_restaurante = 1');
    
    console.log(`📊 Total de ventas: ${totalVentas.rows[0].total}`);
    console.log(`💰 Total de ingresos: Bs ${totalIngresos.rows[0].total || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestVentas(); 