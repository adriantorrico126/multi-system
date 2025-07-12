const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');
const envConfig = require('../../src/config/envConfig');
const bcrypt = require('bcrypt');

const apiPrefix = envConfig.API_PREFIX;

// Datos de prueba
const testUser = {
  nombre: 'Admin Test',
  username: 'admintest',
  email: 'admin@test.com',
  password: 'password123',
  rol: 'admin',
  id_sucursal: 1,
};

const testCashier = {
  nombre: 'Cajero Test',
  username: 'cajerotest',
  email: 'cajero@test.com',
  password: 'password123',
  rol: 'cajero',
  id_sucursal: 1,
};

let adminToken; // Para almacenar el token del admin
let cashierToken; // Para almacenar el token del cajero

beforeEach(async () => {
  try {
    // Limpiar tablas en orden inverso de dependencia
    await db.query('DELETE FROM detalle_ventas CASCADE;');
    await db.query('DELETE FROM ventas CASCADE;');
    await db.query('DELETE FROM mesas CASCADE;');
    await db.query('DELETE FROM productos CASCADE;');
    await db.query('DELETE FROM promociones CASCADE;');
    await db.query('DELETE FROM categorias CASCADE;');
    await db.query('DELETE FROM vendedores CASCADE;');
    await db.query('DELETE FROM sucursales CASCADE;');
    await db.query('DELETE FROM metodos_pago CASCADE;');

    // Insertar datos básicos para que los tests funcionen
    await db.query(`
      INSERT INTO sucursales (id_sucursal, nombre, ciudad) VALUES (1, 'Sucursal Test', 'Ciudad Test');
      INSERT INTO metodos_pago (id_pago, descripcion) VALUES (1, 'Efectivo');
    `);

    // Crear usuario admin de prueba
    const hashedPassword = await bcrypt.hash(testUser.password, parseInt(envConfig.SALT_ROUNDS || '10', 10));
    await db.query(
      'INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal) VALUES ($1, $2, $3, $4, $5, $6)',
      [testUser.nombre, testUser.username, testUser.email, hashedPassword, testUser.rol, testUser.id_sucursal]
    );

    // Crear usuario cajero de prueba
    const hashedCashierPassword = await bcrypt.hash(testCashier.password, parseInt(envConfig.SALT_ROUNDS || '10', 10));
    await db.query(
      'INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal) VALUES ($1, $2, $3, $4, $5, $6)',
      [testCashier.nombre, testCashier.username, testCashier.email, hashedCashierPassword, testCashier.rol, testCashier.id_sucursal]
    );

    // Obtener tokens para los usuarios de prueba
    const adminLoginRes = await request(app).post(`${apiPrefix}/auth/login`).send({ username: testUser.username, password: testUser.password });
    adminToken = adminLoginRes.body.token;

    const cashierLoginRes = await request(app).post(`${apiPrefix}/auth/login`).send({ username: testCashier.username, password: testCashier.password });
    cashierToken = cashierLoginRes.body.token;

  } catch (error) {
    console.error("Error during beforeEach in auth.test.js:", error);
    throw error;
  }
});

describe('Endpoints de Autenticación y Usuarios', () => {

  // ===================================
  // Test para POST /auth/login
  // ===================================
  describe('POST /auth/login', () => {
    it('debería permitir el login con credenciales válidas y retornar un token', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: testUser.username, password: testUser.password });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.data.username).toBe(testUser.username);
      expect(response.body.data.rol).toBe(testUser.rol);
    });

    it('debería retornar 401 con credenciales inválidas', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: testUser.username, password: 'wrongpassword' });

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Usuario o contraseña incorrectos.');
    });

    it('debería retornar 400 si faltan credenciales', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: testUser.username });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors[0].msg).toBe('La contraseña es requerida.');
    });
  });

  // ===================================
  // Test para POST /auth/users (Crear Usuario)
  // ===================================
  describe('POST /auth/users', () => {
    const newUser = {
      nombre: 'Nuevo Usuario',
      username: 'newuser',
      email: 'new@user.com',
      password: 'newpassword',
      rol: 'cajero',
      id_sucursal: 1,
    };

    it('debería permitir a un admin crear un nuevo usuario y retornar 201', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/auth/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('Usuario creado exitosamente.');
      expect(response.body.data.username).toBe(newUser.username);
      expect(response.body.data.rol).toBe(newUser.rol);
    });

    it('debería retornar 403 si un no-admin intenta crear un usuario', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/auth/users`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send(newUser);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('Acceso denegado. No tienes los permisos necesarios para realizar esta acción.');
    });

    it('debería retornar 400 si faltan campos al crear usuario', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/auth/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'incomplete' });

      expect(response.statusCode).toBe(400);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.param === 'nombre' && err.msg === 'El nombre es requerido.')).toBe(true);
    });

    it('debería retornar 400 si el usuario ya existe', async () => {
      // Crear el usuario una vez
      await request(app)
        .post(`${apiPrefix}/auth/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      // Intentar crearlo de nuevo
      const response = await request(app)
        .post(`${apiPrefix}/auth/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('El usuario ya existe.');
    });
  });

  // ===================================
  // Test para GET /auth/users (Obtener Usuarios)
  // ===================================
  describe('GET /auth/users', () => {
    it('debería permitir a un admin obtener la lista de usuarios', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/auth/users`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2); // Admin y Cajero de prueba
      expect(response.body.data.some(u => u.username === testUser.username)).toBe(true);
      expect(response.body.data.some(u => u.username === testCashier.username)).toBe(true);
    });

    it('debería retornar 403 si un no-admin intenta obtener la lista de usuarios', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/auth/users`)
        .set('Authorization', `Bearer ${cashierToken}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('Acceso denegado. No tienes los permisos necesarios para realizar esta acción.');
    });

    it('debería retornar 401 si no se proporciona token', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/auth/users`);

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe('Acceso denegado. No se proporcionó un token de autenticación.');
    });

    it('debería retornar 403 si el token es inválido', async () => {
      const response = await request(app)
        .get(`${apiPrefix}/auth/users`)
        .set('Authorization', `Bearer invalidtoken`);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe('Token de autenticación inválido o expirado.');
    });
  });
});
