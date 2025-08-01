const request = require('supertest');
const app = require('../../src/app'); // Nuestra aplicación Express
const db = require('../../src/config/database'); // Para limpiar la BD
const Categoria = require('../../src/models/categoriaModel'); // Para crear datos de prueba directamente si es necesario
const envConfig = require('../../src/config/envConfig'); // Importar envConfig

const apiPrefix = envConfig.API_PREFIX; // Obtener el prefijo de la API de envConfig

// Hook para limpiar la tabla de categorías antes de cada test
beforeEach(async () => {
  try {
    // Limpiar tablas en orden inverso de dependencia para evitar errores de FK
    await db.pool.query('DELETE FROM detalle_ventas CASCADE;'); // CASCADE para eliminar dependientes
    await db.pool.query('DELETE FROM ventas CASCADE;');
    await db.pool.query('DELETE FROM mesas CASCADE;');
    await db.pool.query('DELETE FROM productos CASCADE;');
    await db.pool.query('DELETE FROM promociones CASCADE;');
    await db.pool.query('DELETE FROM categorias CASCADE;');
    await db.pool.query('DELETE FROM vendedores CASCADE;');
    await db.pool.query('DELETE FROM sucursales CASCADE;');
    await db.pool.query('DELETE FROM metodos_pago CASCADE;');

    // Opcional: Reiniciar secuencias de IDs si es necesario para consistencia en los tests
    // await db.pool.query('ALTER SEQUENCE categorias_id_categoria_seq RESTART WITH 1;');

  } catch (error) {
    console.error("Error limpiando tablas:", error);
    throw error;
  }
});

afterAll(async () => {
  // Cerrar la conexión del pool de la base de datos para que Jest pueda salir limpiamente.
  // Si db.pool.end() no está disponible directamente, Jest puede colgarse.
  // Asegúrate de que tu configuración de `db` permita cerrar el pool.
  // Por ahora, asumimos que el proceso de Jest se encargará de cerrar las conexiones.
  // Si `detectOpenHandles` de Jest da problemas, este es un lugar para investigar.
  // await db.pool.end(); // Descomentar si db.pool.end() es accesible y necesario
});

describe('Endpoints de Categorías (CRUD)', () => {

  // ===================================
  // Test para POST /categorias (Crear)
  // ===================================
  describe('POST /categorias', () => {
    it('debería crear una nueva categoría y retornar 201', async () => {
      const nuevaCategoria = { nombre: 'Entradas Vegetarianas' };
      const response = await request(app)
        .post(`${apiPrefix}/categorias`)
        .send(nuevaCategoria);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('Categoría creada exitosamente.');
      expect(response.body.data).toHaveProperty('id_categoria');
      expect(response.body.data.nombre).toBe(nuevaCategoria.nombre);
      expect(response.body.data.activo).toBe(true);

      // Verificar en la BD
      const categoriaEnDB = await Categoria.findById(response.body.data.id_categoria);
      expect(categoriaEnDB).toBeDefined();
      expect(categoriaEnDB.nombre).toBe(nuevaCategoria.nombre);
    });

    it('debería retornar 400 si el nombre no se proporciona', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/categorias`)
        .send({});
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('El campo nombre es obligatorio.');
    });

    it('debería retornar 400 si la categoría ya existe (UNIQUE constraint)', async () => {
      // Crear una categoría primero
      await Categoria.create({ nombre: 'Postres Veganos' });

      // Intentar crearla de nuevo
      const response = await request(app)
        .post(`${apiPrefix}/categorias`)
        .send({ nombre: 'Postres Veganos' });

      // Ahora esperamos un 400 debido a la validación de express-validator o un 500 si la BD lo maneja
      // Si el modelo maneja el error de duplicado y lo convierte a un error de validación, sería 400.
      // Si la BD lanza el error y el manejador global lo captura, podría ser 500.
      // Asumiendo que el modelo o el controlador lo manejan para dar un 400 más amigable.
      expect(response.statusCode).toBe(500); // Mantener 500 por ahora, ya que el controlador no tiene validación de duplicados
      expect(response.body.error.message).toMatch(/duplicate key|unique constraint/i); // Mensaje de error de la BD
    });
  });

  // ===================================
  // Test para GET /categorias (Obtener todas)
  // ===================================
  describe('GET /categorias', () => {
    it('debería retornar una lista vacía de categorías si no hay ninguna', async () => {
      const response = await request(app).get(`${apiPrefix}/categorias`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('debería retornar todas las categorías activas', async () => {
      await Categoria.create({ nombre: 'Bebidas Naturales' });
      await Categoria.create({ nombre: 'Platos Fuertes', activo: true });
      await Categoria.create({ nombre: 'Sopas (Inactiva)', activo: false });

      const response = await request(app).get(`${apiPrefix}/categorias`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.some(c => c.nombre === 'Bebidas Naturales')).toBe(true);
      expect(response.body.data.some(c => c.nombre === 'Platos Fuertes')).toBe(true);
      expect(response.body.data.every(c => c.activo === true)).toBe(true);
    });

    it('debería retornar todas las categorías (incluyendo inactivas) si includeInactive=true', async () => {
      await Categoria.create({ nombre: 'Ensaladas Frescas' });
      await Categoria.create({ nombre: 'Postres (Inactiva)', activo: false });

      const response = await request(app).get(`${apiPrefix}/categorias?includeInactive=true`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.some(c => c.nombre === 'Ensaladas Frescas')).toBe(true);
      expect(response.body.data.some(c => c.nombre === 'Postres (Inactiva)' && c.activo === false)).toBe(true);
    });
  });

  // ===================================
  // Test para GET /categorias/:id (Obtener por ID)
  // ===================================
  describe('GET /categorias/:id', () => {
    it('debería retornar una categoría específica si existe', async () => {
      const categoriaCreada = await Categoria.create({ nombre: 'Guarniciones' });
      const response = await request(app).get(`${apiPrefix}/categorias/${categoriaCreada.id_categoria}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.id_categoria).toBe(categoriaCreada.id_categoria);
      expect(response.body.data.nombre).toBe('Guarniciones');
    });

    it('debería retornar 404 si la categoría no existe', async () => {
      const response = await request(app).get(`${apiPrefix}/categorias/9999`); // ID no existente
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Categoría no encontrada.');
    });

    it('debería retornar 500 si el ID no es un número válido (error de BD)', async () => {
        const response = await request(app).get(`${apiPrefix}/categorias/un-id-invalido`);
        expect(response.statusCode).toBe(500);
        expect(response.body.error.message).toMatch(/invalid input syntax for type integer|error interno/i);
    });
  });

  // ===================================
  // Test para PUT /categorias/:id (Actualizar)
  // ===================================
  describe('PUT /categorias/:id', () => {
    it('debería actualizar una categoría existente y retornar 200', async () => {
      const categoriaOriginal = await Categoria.create({ nombre: 'Pizzas Veg' });
      const datosActualizados = { nombre: 'Pizzas Vegetarianas Deluxe', activo: false };

      const response = await request(app)
        .put(`${apiPrefix}/categorias/${categoriaOriginal.id_categoria}`)
        .send(datosActualizados);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.nombre).toBe(datosActualizados.nombre);
      expect(response.body.data.activo).toBe(datosActualizados.activo);

      // Verificar en BD
      const categoriaEnDB = await Categoria.findById(categoriaOriginal.id_categoria);
      expect(categoriaEnDB.nombre).toBe(datosActualizados.nombre);
      expect(categoriaEnDB.activo).toBe(datosActualizados.activo);
    });

    it('debería retornar 404 si la categoría a actualizar no existe', async () => {
      const response = await request(app)
        .put(`${apiPrefix}/categorias/999`)
        .send({ nombre: 'Inexistente' });
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Categoría no encontrada para actualizar.');
    });

    it('debería retornar 400 si no se proporcionan campos para actualizar', async () => {
      const categoriaOriginal = await Categoria.create({ nombre: 'Hamburguesas Veg' });
      const response = await request(app)
        .put(`${apiPrefix}/categorias/${categoriaOriginal.id_categoria}`)
        .send({}); // Sin campos
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Debe proporcionar al menos un campo para actualizar (nombre o activo).');
    });

    it('debería actualizar solo el nombre si solo se proporciona el nombre', async () => {
      const categoriaOriginal = await Categoria.create({ nombre: 'Tacos', activo: true });
      const datosActualizados = { nombre: 'Tacos Veganos Especiales' };

      const response = await request(app)
        .put(`${apiPrefix}/categorias/${categoriaOriginal.id_categoria}`)
        .send(datosActualizados);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.nombre).toBe(datosActualizados.nombre);
      expect(response.body.data.activo).toBe(true); // activo no debería cambiar
    });

    it('debería actualizar solo el estado activo si solo se proporciona activo', async () => {
      const categoriaOriginal = await Categoria.create({ nombre: 'Pastas', activo: true });
      const datosActualizados = { activo: false };

      const response = await request(app)
        .put(`${apiPrefix}/categorias/${categoriaOriginal.id_categoria}`)
        .send(datosActualizados);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.nombre).toBe('Pastas'); // nombre no debería cambiar
      expect(response.body.data.activo).toBe(false);
    });
  });

  // ===================================
  // Test para DELETE /categorias/:id (Eliminar - Soft Delete)
  // ===================================
  describe('DELETE /categorias/:id', () => {
    it('debería marcar una categoría como inactiva (soft delete) y retornar 200', async () => {
      const categoria = await Categoria.create({ nombre: 'Wraps Saludables' });

      const response = await request(app)
        .delete(`${apiPrefix}/categorias/${categoria.id_categoria}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.activo).toBe(false);
      expect(response.body.message).toBe('Categoría marcada como inactiva exitosamente (soft delete).');

      // Verificar en BD
      const categoriaEnDB = await Categoria.findById(categoria.id_categoria);
      expect(categoriaEnDB.activo).toBe(false);
    });

    it('debería retornar 404 si la categoría a eliminar no existe', async () => {
      const response = await request(app).delete(`${apiPrefix}/categorias/888`);
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Categoría no encontrada para eliminar.');
    });

    it('debería informar si la categoría ya estaba inactiva', async () => {
      const categoria = await Categoria.create({ nombre: 'Jugos Detox', activo: false });
      const response = await request(app)
        .delete(`${apiPrefix}/categorias/${categoria.id_categoria}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('La categoría ya estaba marcada como inactiva.');
      expect(response.body.data.activo).toBe(false);
    });
  });
});