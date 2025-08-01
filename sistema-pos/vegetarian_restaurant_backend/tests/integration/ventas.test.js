// tests/integration/ventas.test.js

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');
const envConfig = require('../../src/config/envConfig');
const bcrypt = require('bcrypt');

const apiPrefix = envConfig.API_PREFIX;

let adminToken; // Token de administrador
let cashierToken; // Token de cajero
let adminUser; // Objeto de usuario administrador
let categoriaId; // ID de categoría de prueba
let productoId; // ID de producto de prueba
let sucursalId; // ID de sucursal de prueba
let metodoPagoId; // ID de método de pago de prueba

beforeEach(async () => {
  // Limpieza de la base de datos y configuración inicial
  try {
    await db.pool.query('DELETE FROM detalle_ventas CASCADE;');
    await db.pool.query('DELETE FROM facturas CASCADE;');
    await db.pool.query('DELETE FROM prefacturas CASCADE;');
    // Poner a NULL las referencias de ventas en mesas antes de borrar ventas
    await db.pool.query('UPDATE mesas SET id_venta_actual = NULL;');
    await db.pool.query('DELETE FROM ventas CASCADE;');
    await db.pool.query('DELETE FROM mesas CASCADE;');
    await db.pool.query('DELETE FROM productos CASCADE;');
    await db.pool.query('DELETE FROM promociones CASCADE;');
    await db.pool.query('DELETE FROM categorias CASCADE;');
    await db.pool.query('DELETE FROM vendedores CASCADE;');
    await db.pool.query('DELETE FROM sucursales CASCADE;');
    await db.pool.query('DELETE FROM metodos_pago CASCADE;');

    // Insertar datos básicos
    const sucursalRes = await db.pool.query(`
      INSERT INTO sucursales (nombre, ciudad) VALUES ('Sucursal Principal', 'Ciudad Test') RETURNING id_sucursal;
    `);
    sucursalId = sucursalRes.rows[0].id_sucursal;

    const metodoPagoRes = await db.pool.query(`
      INSERT INTO metodos_pago (descripcion) VALUES ('Efectivo') RETURNING id_pago;
    `);
    metodoPagoId = metodoPagoRes.rows[0].id_pago;

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('password123', parseInt(envConfig.SALT_ROUNDS || '10', 10));
    const adminRes = await db.pool.query(
      'INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;',
      ['Admin Test', 'admintest', 'admin@test.com', hashedPassword, 'admin', sucursalId]
    );
    adminUser = adminRes.rows[0];

    // Crear usuario cajero
    const hashedCashierPassword = await bcrypt.hash('password123', parseInt(envConfig.SALT_ROUNDS || '10', 10));
    await db.pool.query(
      'INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal) VALUES ($1, $2, $3, $4, $5, $6)',
      ['Cajero Test', 'cajerotest', 'cajero@test.com', hashedCashierPassword, 'cajero', sucursalId]
    );

    // Obtener tokens
    const adminLoginRes = await request(app).post(`${apiPrefix}/auth/login`).send({ username: 'admintest', password: 'password123' });
    adminToken = adminLoginRes.body.token;

    const cashierLoginRes = await request(app).post(`${apiPrefix}/auth/login`).send({ username: 'cajerotest', password: 'password123' });
    cashierToken = cashierLoginRes.body.token;

    // Crear una categoría de prueba
    const categoriaRes = await request(app)
      .post(`${apiPrefix}/categorias`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Platos Principales' });
    categoriaId = categoriaRes.body.data.id_categoria;

    // Crear un producto de prueba
    const productoRes = await request(app)
      .post(`${apiPrefix}/productos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Pasta Vegana', precio: 15.00, id_categoria: categoriaId, stock_actual: 50 });
    productoId = productoRes.body.data.id_producto;

  } catch (error) {
    console.error("Error during beforeEach in ventas.test.js:", error);
    throw error;
  }
});

describe('Endpoints de Ventas', () => {

  // Test para POST /ventas
  describe('POST /ventas', () => {
    it('debería crear una nueva venta (Para Llevar) y retornar 201', async () => {
      const newSale = {
        items: [
          { id_producto: productoId, cantidad: 2, precio_unitario: 15.00, observaciones: 'Sin gluten' }
        ],
        total: 30.00,
        paymentMethod: 'Efectivo',
        cashier: 'admintest',
        branch: 'Sucursal Principal',
        tipo_servicio: 'Para Llevar',
      };

      const response = await request(app)
        .post(`${apiPrefix}/ventas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSale);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('Venta registrada exitosamente');
      expect(response.body.venta).toHaveProperty('id_venta');
      expect(response.body.venta.total).toBe(newSale.total);
      expect(response.body.detalles.length).toBe(1);
    });

    it('debería crear una nueva venta (Mesa) y abrir la mesa si está libre', async () => {
      // Crear una mesa libre
      const mesaRes = await db.pool.query(
        'INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES ($1, $2, $3, $4) RETURNING id_mesa;',
        [101, sucursalId, 4, 'libre']
      );
      const mesaNumero = 101;

      const newSale = {
        items: [
          { id_producto: productoId, cantidad: 1, precio_unitario: 15.00 }
        ],
        total: 15.00,
        paymentMethod: 'Efectivo',
        cashier: 'admintest',
        branch: 'Sucursal Principal',
        tipo_servicio: 'Mesa',
        mesa_numero: mesaNumero,
      };

      const response = await request(app)
        .post(`${apiPrefix}/ventas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSale);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('Venta registrada exitosamente');

      // Verificar que la mesa ahora está en uso
      const mesaEnDB = await db.pool.query('SELECT estado FROM mesas WHERE numero = $1 AND id_sucursal = $2', [mesaNumero, sucursalId]);
      expect(mesaEnDB.rows[0].estado).toBe('en_uso');
    });

    it('debería agregar productos a una mesa existente en uso', async () => {
      // Crear una mesa y abrirla (simulando una venta previa)
      const mesaRes = await db.pool.query(
        'INSERT INTO mesas (numero, id_sucursal, capacidad, estado, total_acumulado) VALUES ($1, $2, $3, $4, $5) RETURNING id_mesa;',
        [102, sucursalId, 4, 'en_uso', 20.00] // Mesa ya en uso con un total acumulado
      );
      const mesaNumero = 102;

      const newSale = {
        items: [
          { id_producto: productoId, cantidad: 1, precio_unitario: 15.00 }
        ],
        total: 15.00,
        paymentMethod: 'Efectivo',
        cashier: 'admintest',
        branch: 'Sucursal Principal',
        tipo_servicio: 'Mesa',
        mesa_numero: mesaNumero,
      };

      const response = await request(app)
        .post(`${apiPrefix}/ventas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSale);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('Venta registrada exitosamente');

      // Verificar que el total acumulado de la mesa se actualizó
      const mesaEnDB = await db.pool.query('SELECT total_acumulado FROM mesas WHERE numero = $1 AND id_sucursal = $2', [mesaNumero, sucursalId]);
      expect(parseFloat(mesaEnDB.rows[0].total_acumulado)).toBe(35.00); // 20.00 + 15.00
    });

    it('debería retornar 400 si faltan campos requeridos para la venta', async () => {
      const incompleteSale = {
        items: [
          { id_producto: productoId, cantidad: 1, precio_unitario: 15.00 }
        ],
        total: 15.00,
        paymentMethod: 'Efectivo',
        cashier: 'admintest',
        // branch: 'Sucursal Principal', // Faltante
        tipo_servicio: 'Para Llevar',
      };

      const response = await request(app)
        .post(`${apiPrefix}/ventas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteSale);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Sucursal no encontrada'); // Mensaje específico del controlador
    });

    it('debería retornar 403 si un no-admin intenta crear una venta', async () => {
      const newSale = {
        items: [
          { id_producto: productoId, cantidad: 1, precio_unitario: 15.00 }
        ],
        total: 15.00,
        paymentMethod: 'Efectivo',
        cashier: 'admintest',
        branch: 'Sucursal Principal',
        tipo_servicio: 'Para Llevar',
      };

      const response = await request(app)
        .post(`${apiPrefix}/ventas`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(newSale);

      expect(response.statusCode).toBe(403);
    });
  });

  // Test para GET /ventas/pedidos-cocina
  describe('GET /ventas/pedidos-cocina', () => {
    it('debería obtener pedidos para cocina', async () => {
      // Crear una venta con estado 'recibido'
      const newSale = {
        items: [
          { id_producto: productoId, cantidad: 1, precio_unitario: 15.00 }
        ],
        total: 15.00,
        paymentMethod: 'Efectivo',
        cashier: 'admintest',
        branch: 'Sucursal Principal',
        tipo_servicio: 'Para Llevar',
      };
      await request(app)
        .post(`${apiPrefix}/ventas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSale);

      const response = await request(app)
        .get(`${apiPrefix}/ventas/pedidos-cocina`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0]).toHaveProperty('productos');
    });

    it('debería retornar 403 si un no-admin/no-cocinero intenta obtener pedidos para cocina', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/ventas/pedidos-cocina`)
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  // Test para PATCH /ventas/:id/estado
  describe('PATCH /ventas/:id/estado', () => {
    let saleId; // ID de la venta para actualizar

    beforeEach(async () => {
      // Crear una venta para actualizar su estado
      const newSale = {
        items: [
          { id_producto: productoId, cantidad: 1, precio_unitario: 15.00 }
        ],
        total: 15.00,
        paymentMethod: 'Efectivo',
        cashier: 'admintest',
        branch: 'Sucursal Principal',
        tipo_servicio: 'Para Llevar',
      };
      const saleRes = await request(app)
        .post(`${apiPrefix}/ventas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newSale);
      saleId = saleRes.body.venta.id_venta;
    });

    it('debería actualizar el estado de un pedido como admin', async () => {
      const response = await request(app)
        .patch(`${apiPrefix}/ventas/${saleId}/estado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'en_preparacion' });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Estado del pedido actualizado exitosamente.');
      expect(response.body.data.estado).toBe('en_preparacion');
    });

    it('debería retornar 400 si el estado es inválido', async () => {
      const response = await request(app)
        .patch(`${apiPrefix}/ventas/${saleId}/estado`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'estado_invalido' });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Estado de pedido no válido.');
    });

    it('debería retornar 403 si un no-admin/no-cocinero intenta actualizar el estado', async () => {
      const response = await request(app)
        .patch(`${apiPrefix}/ventas/${saleId}/estado`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ estado: 'listo_para_servir' });

      expect(response.statusCode).toBe(403);
    });
  });

  // Test para GET /ventas/arqueo
  describe('GET /ventas/arqueo', () => {
    it('debería obtener datos de arqueo como admin', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const response = await request(app)
        .get(`${apiPrefix}/ventas/arqueo?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty('salesSummary');
      expect(response.body.data).toHaveProperty('dailyCashFlow');
    });

    it('debería retornar 400 si faltan fechas para arqueo', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/ventas/arqueo`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Fechas de inicio y fin son requeridas.');
    });

    it('debería retornar 403 si un no-admin/no-gerente intenta obtener datos de arqueo', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      const response = await request(app)
        .get(`${apiPrefix}/ventas/arqueo?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(response.statusCode).toBe(403);
    });
  });

  // Test para POST /ventas/cerrar-mesa-con-factura
  describe('POST /ventas/cerrar-mesa-con-factura', () => {
    let mesaNumero;
    let mesaId;

    beforeEach(async () => {
      // Crear una mesa y abrirla con una venta
      const mesaRes = await db.pool.query(
        'INSERT INTO mesas (numero, id_sucursal, capacidad, estado, total_acumulado) VALUES ($1, $2, $3, $4, $5) RETURNING id_mesa;',
        [201, sucursalId, 4, 'en_uso', 50.00] // Mesa en uso con total acumulado
      );
      mesaId = mesaRes.rows[0].id_mesa;
      mesaNumero = 201;

      // Asociar una venta a la mesa (simulando que ya se agregaron productos)
      const ventaRes = await db.pool.query(
        'INSERT INTO ventas (id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_venta;',
        [adminUser.id_vendedor, metodoPagoId, sucursalId, 'Mesa', 50.00, mesaNumero, 'entregado']
      );
      await db.pool.query('UPDATE mesas SET id_venta_actual = $1 WHERE id_mesa = $2;', [ventaRes.rows[0].id_venta, mesaId]);
    });

    it('debería cerrar una mesa con facturación y retornar 200', async () => {
      const closeData = {
        mesa_numero: mesaNumero,
        id_sucursal: sucursalId,
        paymentMethod: 'Efectivo',
        invoiceData: {
          nit: '123456789',
          businessName: 'Restaurante Test S.A.',
        },
      };

      const response = await request(app)
        .post(`${apiPrefix}/ventas/cerrar-mesa-con-factura`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(closeData);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe(`Mesa ${mesaNumero} cerrada y facturada exitosamente.`);
      expect(response.body.data.mesa.estado).toBe('libre');
      expect(response.body.data.factura).toBeDefined();
    });

    it('debería retornar 400 si la mesa no está en uso', async () => {
      // Poner la mesa en estado libre
      await db.pool.query("UPDATE mesas SET estado = 'libre' WHERE id_mesa = $1;", [mesaId]);

      const closeData = {
        mesa_numero: mesaNumero,
        id_sucursal: sucursalId,
        paymentMethod: 'Efectivo',
      };

      const response = await request(app)
        .post(`${apiPrefix}/ventas/cerrar-mesa-con-factura`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(closeData);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/La mesa .* no está en uso./);
    });

    it('debería retornar 403 si un no-admin/no-gerente intenta cerrar mesa con factura', async () => {
      const closeData = {
        mesa_numero: mesaNumero,
        id_sucursal: sucursalId,
        paymentMethod: 'Efectivo',
      };

      const response = await request(app)
        .post(`${apiPrefix}/ventas/cerrar-mesa-con-factura`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(closeData);

      expect(response.statusCode).toBe(403);
    });
  });
});
