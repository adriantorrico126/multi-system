const request = require('supertest');
const app = require('../../src/app'); // Nuestra aplicación Express
const db = require('../../src/config/database'); // Para limpiar la BD
const Categoria = require('../../src/models/categoriaModel'); // Para crear datos de prueba directamente si es necesario

// Hook para limpiar la tabla de categorías antes de cada test
// y asegurar que empezamos con un estado limpio.
// También para cerrar la conexión a la BD después de todos los tests.
beforeAll(async () G> {
  // Podríamos necesitar conectarnos explícitamente o asegurar que el pool está listo
  // pero database.js ya lo intenta.
});

beforeEach(async () => {
  // Limpiar la tabla de categorías
  // Es importante tener una forma de resetear el estado entre tests.
  // Para tests de integración, esto usualmente significa limpiar las tablas relevantes.
  try {
    await db.query('DELETE FROM detalle_ventas;'); // Si hay FKs desde otras tablas
    await db.query('DELETE FROM productos;');      // Si hay FKs desde otras tablas
    await db.query('DELETE FROM promociones;');    // Si hay FKs desde otras tablas
    await db.query('DELETE FROM categorias;');
  } catch (error) {
    console.error("Error limpiando tablas:", error);
    // Si la limpieza falla, los tests pueden no ser fiables.
    // Considerar lanzar el error para detener los tests.
    throw error;
  }
});

afterAll(async () => {
  // Cerrar la conexión del pool de la base de datos para que Jest pueda salir limpiamente.
  // Esto es importante si db.pool está expuesto o si tenemos una función para cerrarlo.
  // Por ahora, nuestro database.js no expone una función de cierre para el pool directamente,
  // pero pg debería manejarlo al finalizar el proceso.
  // Si `detectOpenHandles` de Jest da problemas, se deberá implementar un cierre explícito del pool.
  // Ejemplo: await db.pool.end(); (si db.pool estuviera disponible)
  // O modificar database.js para tener una función de cierre.
  // Por ahora, asumimos que el cierre del proceso principal se encargará.
  // Si Jest se cuelga, este es un lugar para investigar.
  const client = await db.getClient();
  await client.release(); // Asegura que el cliente se libere
  // await db.pool.end(); // Esto cerraría el pool, pero nuestro módulo db no lo expone así.
  // Si se necesita, modificar database.js para exportar una función de cierre del pool.
});


describe('Endpoints de Categorías (CRUD)', () => {
  const apiPrefix = '/api/v1'; // Tomado de envConfig, pero aquí lo hardcodeamos para el test

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

      // Verificar en la BD (opcional pero bueno para confirmación completa)
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

    it('debería retornar error si la categoría ya existe (UNIQUE constraint)', async () => {
      // Crear una categoría primero
      await Categoria.create({ nombre: 'Postres Veganos' });

      // Intentar crearla de nuevo
      const response = await request(app)
        .post(`${apiPrefix}/categorias`)
        .send({ nombre: 'Postres Veganos' });

      // El controlador actual no maneja duplicados explícitamente, la BD sí.
      // La BD lanzará un error (unique constraint), que el manejador de errores global
      // debería capturar y retornar un 500 o un error específico si lo personalizamos.
      // Para este test, esperamos un error del servidor (500) o si el modelo/controlador
      // lo manejara, un 409 (Conflict) o 400.
      // Por ahora, el modelo tira el error de BD y el global handler lo convierte en 500.
      expect(response.statusCode).toBe(500); // O 409 si se implementa manejo de duplicados
      // El mensaje exacto puede depender del error de la BD
      expect(response.body.error.message).toMatch(/ya existe|duplicate key|unique constraint/i);
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

    it('debería retornar 404 si el ID no es un número válido (depende de la validación, Express puede dar 500 o el controlador 404)', async () => {
        // Si el ID no es numérico, la consulta a la BD fallará.
        // El comportamiento exacto (404 vs 500) puede depender de cómo se maneja el error.
        // Nuestro controlador actual no valida el formato del ID antes de la consulta.
        // PostgreSQL puede lanzar un error si el tipo no coincide, que se convierte en 500.
        // Si quisiéramos un 400/404, necesitaríamos validación de parámetros.
        const response = await request(app).get(`${apiPrefix}/categorias/un-id-invalido`);
        // El error de PostgreSQL por "invalid input syntax for type integer" resultará en un 500
        // por el manejador de errores global, a menos que lo capturemos antes.
        // Para ser más precisos, el modelo debería manejar este error de pg y el controlador devolver 400 o 404.
        // Por ahora, el error de BD se propaga y el handler global lo convierte a 500.
        expect(response.statusCode).toBe(500);
        // O podríamos esperar 404 si el controlador lo manejara más específicamente antes de la BD.
        // expect(response.body.message).toBe('Categoría no encontrada.');
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
