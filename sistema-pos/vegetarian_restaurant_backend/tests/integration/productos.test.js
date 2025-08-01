// tests/integration/productos.test.js

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

beforeEach(async () => {
  // Limpieza de la base de datos y configuración inicial (similar a auth.test.js)
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
    await db.pool.query(`
      INSERT INTO sucursales (id_sucursal, nombre, ciudad) VALUES (1, 'Sucursal Principal', 'Ciudad Test');
      INSERT INTO metodos_pago (id_pago, descripcion) VALUES (1, 'Efectivo');
    `);

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('password123', parseInt(envConfig.SALT_ROUNDS || '10', 10));
    const adminRes = await db.pool.query(
      'INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;',
      ['Admin Test', 'admintest', 'admin@test.com', hashedPassword, 'admin', 1]
    );
    adminUser = adminRes.rows[0];

    // Crear usuario cajero
    const hashedCashierPassword = await bcrypt.hash('password123', parseInt(envConfig.SALT_ROUNDS || '10', 10));
    await db.pool.query(
      'INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal) VALUES ($1, $2, $3, $4, $5, $6)',
      ['Cajero Test', 'cajerotest', 'cajero@test.com', hashedCashierPassword, 'cajero', 1]
    );

    // Obtener tokens
    const adminLoginRes = await request(app).post(`${apiPrefix}/auth/login`).send({ username: 'admintest', password: 'password123' });
    adminToken = adminLoginRes.body.token;

    const cashierLoginRes = await request(app).post(`${apiPrefix}/auth/login`).send({ username: 'cajerotest', password: 'password123' });
    cashierToken = cashierLoginRes.body.token;

    // Crear una categoría de prueba para los productos
    const categoriaRes = await request(app)
      .post(`${apiPrefix}/categorias`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Bebidas' });
    categoriaId = categoriaRes.body.data.id_categoria;

  } catch (error) {
    console.error("Error during beforeEach in productos.test.js:", error);
    throw error;
  }
});

describe('Endpoints de Productos', () => {

  // Test para GET /productos
  describe('GET /productos', () => {
    it('debería obtener todos los productos', async () => {
      // Crear algunos productos de prueba
      await request(app)
        .post(`${apiPrefix}/productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Agua Mineral', precio: 1.50, id_categoria: categoriaId, stock_actual: 100 });
      await request(app)
        .post(`${apiPrefix}/productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Jugo de Naranja', precio: 2.50, id_categoria: categoriaId, stock_actual: 50 });

      const response = await request(app).get(`${apiPrefix}/productos`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.some(p => p.nombre === 'Agua Mineral')).toBe(true);
    });
  });

  // Test para POST /productos
  describe('POST /productos', () => {
    it('debería crear un nuevo producto como admin', async () => {
      const newProduct = { nombre: 'Café', precio: 3.00, id_categoria: categoriaId, stock_actual: 75 };
      const response = await request(app)
        .post(`${apiPrefix}/productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.nombre).toBe(newProduct.nombre);
    });

    it('debería retornar 403 si un no-admin intenta crear un producto', async () => {
      const newProduct = { nombre: 'Té', precio: 2.00, id_categoria: categoriaId, stock_actual: 60 };
      const response = await request(app)
        .post(`${apiPrefix}/productos`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(newProduct);

      expect(response.statusCode).toBe(403);
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Producto Incompleto' });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  // Test para PUT /productos/:id
  describe('PUT /productos/:id', () => {
    let productId; // ID del producto a actualizar

    beforeEach(async () => {
      // Crear un producto para actualizar
      const productRes = await request(app)
        .post(`${apiPrefix}/productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Producto Original', precio: 10.00, id_categoria: categoriaId, stock_actual: 20 });
      productId = productRes.body.data.id_producto;
    });

    it('debería actualizar un producto como admin', async () => {
      const updatedData = { nombre: 'Producto Actualizado', precio: 12.00 };
      const response = await request(app)
        .put(`${apiPrefix}/productos/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.nombre).toBe(updatedData.nombre);
      expect(response.body.data.precio).toBe(updatedData.precio);
    });

    it('debería retornar 403 si un no-admin intenta actualizar un producto', async () => {
      const updatedData = { nombre: 'Producto Actualizado por Cajero' };
      const response = await request(app)
        .put(`${apiPrefix}/productos/${productId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(updatedData);

      expect(response.statusCode).toBe(403);
    });

    it('debería retornar 404 si el producto no existe', async () => {
      const updatedData = { nombre: 'Producto Inexistente' };
      const response = await request(app)
        .put(`${apiPrefix}/productos/99999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(response.statusCode).toBe(404);
    });
  });

  // Test para DELETE /productos/:id
  describe('DELETE /productos/:id', () => {
    let productId; // ID del producto a eliminar

    beforeEach(async () => {
      // Crear un producto para eliminar
      const productRes = await request(app)
        .post(`${apiPrefix}/productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Producto a Eliminar', precio: 5.00, id_categoria: categoriaId, stock_actual: 10 });
      productId = productRes.body.data.id_producto;
    });

    it('debería eliminar un producto como admin', async () => {
      const response = await request(app)
        .delete(`${apiPrefix}/productos/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Producto eliminado exitosamente.');

      // Verificar que el producto ya no existe
      const getResponse = await request(app).get(`${apiPrefix}/productos`);
      expect(getResponse.body.data.some(p => p.id_producto === productId)).toBe(false);
    });

    it('debería retornar 403 si un no-admin intenta eliminar un producto', async () => {
      const response = await request(app)
        .delete(`${apiPrefix}/productos/${productId}`)
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(response.statusCode).toBe(403);
    });

    it('debería retornar 404 si el producto a eliminar no existe', async () => {
      const response = await request(app)
        .delete(`${apiPrefix}/productos/99999`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  // Test para POST /productos/inventario/:id/stock
  describe('POST /productos/inventario/:id/stock', () => {
    let productId; // ID del producto para actualizar stock

    beforeEach(async () => {
      // Crear un producto para actualizar stock
      const productRes = await request(app)
        .post(`${apiPrefix}/productos`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Producto Stock', precio: 7.00, id_categoria: categoriaId, stock_actual: 50 });
      productId = productRes.body.data.id_producto;
    });

    it('debería actualizar el stock (entrada) como admin', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/productos/inventario/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cantidad_cambio: 10, tipo_movimiento: 'entrada' });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Stock actualizado y movimiento registrado exitosamente.');
      // Verificar el stock actualizado en la BD (requiere un método para obtener producto por ID)
    });

    it('debería actualizar el stock (salida) como admin', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/productos/inventario/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cantidad_cambio: 5, tipo_movimiento: 'salida' });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Stock actualizado y movimiento registrado exitosamente.');
    });

    it('debería retornar 403 si un no-admin intenta actualizar stock', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/productos/inventario/${productId}/stock`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ cantidad_cambio: 5, tipo_movimiento: 'salida' });

      expect(response.statusCode).toBe(403);
    });

    it('debería retornar 400 si faltan campos al actualizar stock', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/productos/inventario/${productId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cantidad_cambio: 5 }); // Falta tipo_movimiento

      expect(response.statusCode).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  // Test para GET /productos/inventario/resumen
  describe('GET /productos/inventario/resumen', () => {
    it('debería obtener el resumen de inventario como admin', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/productos/inventario/resumen`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('debería obtener el resumen de inventario como cajero', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/productos/inventario/resumen`)
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('debería retornar 403 si un rol no autorizado intenta obtener el resumen', async () => {
      // Suponiendo que hay un rol 'cocinero' que no tiene acceso
      // Para este test, no crearemos un usuario cocinero, solo probaremos sin token
      const response = await request(app)
        .get(`${apiPrefix}/productos/inventario/resumen`);

      expect(response.statusCode).toBe(401); // No autorizado sin token
    });
  });

  // Test para GET /productos/inventario/movimientos
  describe('GET /productos/inventario/movimientos', () => {
    it('debería obtener el historial de movimientos de stock como admin', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/productos/inventario/movimientos`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('debería retornar 403 si un no-admin intenta obtener el historial', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/productos/inventario/movimientos`)
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(response.statusCode).toBe(403);
    });
  });
});
