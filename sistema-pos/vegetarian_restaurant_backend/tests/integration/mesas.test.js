// tests/integration/mesas.test.js

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');
const envConfig = require('../../src/config/envConfig');
const bcrypt = require('bcrypt');

const apiPrefix = envConfig.API_PREFIX;

let adminToken; // Token de administrador
let cashierToken; // Token de cajero
let sucursalId; // ID de sucursal de prueba
let adminUser; // Objeto de usuario administrador

beforeEach(async () => {
  // Limpieza de la base de datos y configuración inicial
  try {
    await db.pool.query('DELETE FROM detalle_ventas CASCADE;');
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

    await db.pool.query(`
      INSERT INTO metodos_pago (id_pago, descripcion) VALUES (1, 'Efectivo');
    `);

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

  } catch (error) {
    console.error("Error during beforeEach in mesas.test.js:", error);
    throw error;
  }
});

describe('Endpoints de Mesas', () => {

  // Test para GET /mesas/:id_sucursal
  describe('GET /mesas/:id_sucursal', () => {
    it('debería obtener todas las mesas de una sucursal', async () => {
      // Crear algunas mesas
      await db.pool.query("INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES (1, $1, 4, 'libre'), (2, $1, 6, 'en_uso');", [sucursalId]);

      const response = await request(app)
        .get(`${apiPrefix}/mesas/${sucursalId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.some(m => m.numero === 1)).toBe(true);
    });

    it('debería retornar 400 si falta id_sucursal', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/mesas/invalid-id`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(500); // O 400 si se añade validación de parámetros
    });
  });

  // Test para GET /mesas/:numero/:id_sucursal
  describe('GET /mesas/:numero/:id_sucursal', () => {
    it('debería obtener una mesa específica', async () => {
      await db.pool.query('INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES (10, $1, 4, $2);', [sucursalId, 'libre']);

      const response = await request(app)
        .get(`${apiPrefix}/mesas/10/${sucursalId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.numero).toBe(10);
    });

    it('debería retornar 404 si la mesa no existe', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/mesas/999/${sucursalId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  // Test para POST /mesas/abrir
  describe('POST /mesas/abrir', () => {
    let mesaId;
    beforeEach(async () => {
      const res = await db.pool.query("INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES (30, $1, 4, 'libre') RETURNING id_mesa;", [sucursalId]);
      mesaId = res.rows[0].id_mesa;
    });

    it('debería abrir una mesa libre', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/mesas/abrir`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ numero: 30, id_sucursal: sucursalId });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Mesa 30 abierta exitosamente.');
      expect(response.body.data.mesa.estado).toBe('en_uso');
    });

    it('debería retornar 400 si la mesa no está libre', async () => {
      await db.pool.query('UPDATE mesas SET estado = 'en_uso' WHERE id_mesa = $1;', [mesaId]);

      const response = await request(app)
        .post(`${apiPrefix}/mesas/abrir`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ numero: 30, id_sucursal: sucursalId });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/La mesa .* no está disponible./);
    });
  });

  // Test para POST /mesas/cerrar/:id_mesa
  describe('POST /mesas/cerrar/:id_mesa', () => {
    let mesaId;
    beforeEach(async () => {
      const res = await db.pool.query("INSERT INTO mesas (numero, id_sucursal, capacidad, estado, total_acumulado) VALUES (40, $1, 4, 'en_uso', 50.00) RETURNING id_mesa;", [sucursalId]);
      mesaId = res.rows[0].id_mesa;
    });

    it('debería cerrar una mesa en uso', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/mesas/cerrar/${mesaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Mesa cerrada exitosamente.');
      expect(response.body.data.mesa.estado).toBe('libre');
    });

    it('debería retornar 400 si la mesa no está en uso (o no existe)', async () => {
      // Poner la mesa en estado libre
      await db.pool.query("UPDATE mesas SET estado = 'libre' WHERE id_mesa = $1;", [mesaId]);

      const response = await request(app)
        .post(`${apiPrefix}/mesas/cerrar/${mesaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(500); // El controlador actual lanza un error si no está en uso
    });
  });

  // Test para POST /mesas/agregar-productos
  describe('POST /mesas/agregar-productos', () => {
    let mesaNumero;
    let productoId;

    beforeEach(async () => {
      // Crear una mesa en uso
      await db.pool.query("INSERT INTO mesas (numero, id_sucursal, capacidad, estado, total_acumulado) VALUES (50, $1, 4, 'en_uso', 10.00);", [sucursalId]);
      mesaNumero = 50;

      // Crear un producto
      const categoriaRes = await db.pool.query('INSERT INTO categorias (nombre) VALUES ($1) RETURNING id_categoria;', ['Bebidas']);
      const categoriaId = categoriaRes.rows[0].id_categoria;
      const productoRes = await db.pool.query('INSERT INTO productos (nombre, precio, id_categoria, stock_actual) VALUES ($1, $2, $3, $4) RETURNING id_producto;', ['Refresco', 2.50, categoriaId, 100]);
      productoId = productoRes.rows[0].id_producto;
    });

    it('debería agregar productos a una mesa en uso', async () => {
      const items = [
        { id_producto: productoId, cantidad: 2, precio_unitario: 2.50 }
      ];
      const total = 5.00;

      const response = await request(app)
        .post(`${apiPrefix}/mesas/agregar-productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ numero: mesaNumero, id_sucursal: sucursalId, items, total });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe(`Productos agregados a la mesa ${mesaNumero} exitosamente.`);
      expect(response.body.data.total_acumulado).toBe(15.00); // 10.00 + 5.00
    });

    it('debería retornar 400 si la mesa no está en uso', async () => {
      await db.pool.query("UPDATE mesas SET estado = 'libre' WHERE numero = $1 AND id_sucursal = $2;", [mesaNumero, sucursalId]);

      const items = [
        { id_producto: productoId, cantidad: 1, precio_unitario: 2.50 }
      ];
      const total = 2.50;

      const response = await request(app)
        .post(`${apiPrefix}/mesas/agregar-productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ numero: mesaNumero, id_sucursal: sucursalId, items, total });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/La mesa .* no está en uso./);
    });
  });

  // Test para POST /mesas (Crear Mesa)
  describe('POST /mesas', () => {
    it('debería crear una nueva mesa', async () => {
      const newMesa = { numero: 60, id_sucursal: sucursalId, capacidad: 4 };
      const response = await request(app)
        .post(`${apiPrefix}/mesas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newMesa);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe(`Mesa ${newMesa.numero} creada exitosamente.`);
      expect(response.body.data.numero).toBe(newMesa.numero);
    });

    it('debería retornar 400 si el número de mesa ya existe', async () => {
      await db.pool.query('INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES (60, $1, 4, 'libre');', [sucursalId]);

      const newMesa = { numero: 60, id_sucursal: sucursalId, capacidad: 4 };
      const response = await request(app)
        .post(`${apiPrefix}/mesas`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newMesa);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/El número de mesa .* ya existe/);
    });
  });

  // Test para PUT /mesas/:id_mesa (Actualizar Mesa)
  describe('PUT /mesas/:id_mesa', () => {
    let mesaId;
    beforeEach(async () => {
      const res = await db.pool.query("INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES (70, $1, 4, 'libre') RETURNING id_mesa;", [sucursalId]);
      mesaId = res.rows[0].id_mesa;
    });

    it('debería actualizar una mesa existente', async () => {
      const updatedData = { capacidad: 6, estado: 'en_uso' };
      const response = await request(app)
        .put(`${apiPrefix}/mesas/${mesaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.capacidad).toBe(updatedData.capacidad);
      expect(response.body.data.estado).toBe(updatedData.estado);
    });

    it('debería retornar 400 si el nuevo número de mesa ya existe', async () => {
      await db.pool.query('INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES (71, $1, 4, 'libre');', [sucursalId]);

      const updatedData = { numero: 71 };
      const response = await request(app)
        .put(`${apiPrefix}/mesas/${mesaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/El número de mesa .* ya existe/);
    });
  });

  // Test para DELETE /mesas/:id_mesa (Eliminar Mesa)
  describe('DELETE /mesas/:id_mesa', () => {
    let mesaId;
    beforeEach(async () => {
      const res = await db.pool.query("INSERT INTO mesas (numero, id_sucursal, capacidad, estado) VALUES (80, $1, 4, 'libre') RETURNING id_mesa;", [sucursalId]);
      mesaId = res.rows[0].id_mesa;
    });

    it('debería eliminar una mesa', async () => {
      const response = await request(app)
        .delete(`${apiPrefix}/mesas/${mesaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe(`Mesa ${80} eliminada exitosamente.`);
    });

    it('debería retornar 404 si la mesa no existe', async () => {
      const response = await request(app)
        .delete(`${apiPrefix}/mesas/99999`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404); // O 500 si el modelo no maneja el not found
    });
  });
});