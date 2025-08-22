const Categoria = require('../models/categoriaModel');
const logger = require('../config/logger'); // Importar el logger

exports.createCategoria = async (req, res, next) => {
  try {
    const { nombre } = req.body;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (!nombre) {
      logger.warn('Intento de crear categoría sin nombre.');
      return res.status(400).json({ message: 'El campo nombre es obligatorio.' });
    }
    // Normalizar nombre (trim) y evitar duplicados por restaurante (case-insensitive)
    const nombreNorm = String(nombre).trim();
    const dupQuery = `SELECT 1 FROM categorias WHERE LOWER(nombre) = LOWER($1) AND id_restaurante = $2 LIMIT 1`;
    const dup = await require('../config/database').pool.query(dupQuery, [nombreNorm, id_restaurante]);
    if (dup.rows.length) {
      logger.warn('Intento de crear categoría duplicada:', { nombre: nombreNorm, id_restaurante });
      return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
    }
    const nuevaCategoria = await Categoria.create({ nombre: nombreNorm, id_restaurante });
    logger.info('Categoría creada exitosamente:', { id: nuevaCategoria.id_categoria, nombre: nuevaCategoria.nombre, id_restaurante: nuevaCategoria.id_restaurante });
    res.status(201).json({
      message: 'Categoría creada exitosamente.',
      data: nuevaCategoria,
    });
  } catch (error) {
    logger.error('Error al crear categoría:', error);
    next(error);
  }
};

exports.getAllCategorias = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    const categorias = await Categoria.findAll(id_restaurante, includeInactive);
    logger.info('Categorías obtenidas exitosamente.', { count: categorias.length, includeInactive, id_restaurante });
    res.status(200).json({
      message: categorias.length > 0 ? 'Categorías obtenidas exitosamente.' : 'No hay categorías registradas.',
      count: categorias.length,
      data: categorias,
    });
  } catch (error) {
    logger.error('Error al obtener categorías:', error);
    next(error);
  }
};

exports.getCategoriaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    const categoria = await Categoria.findById(id, id_restaurante);
    if (!categoria) {
      logger.warn(`Categoría con ID ${id} no encontrada para el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }
    logger.info('Categoría obtenida exitosamente por ID:', { id: categoria.id_categoria, nombre: categoria.nombre, id_restaurante: categoria.id_restaurante });
    res.status(200).json({
      message: 'Categoría obtenida exitosamente.',
      data: categoria,
    });
  } catch (error) {
    logger.error('Error al obtener categoría por ID:', error);
    next(error);
  }
};

exports.updateCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, activo } = req.body;
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    if (nombre === undefined && activo === undefined) {
      logger.warn('Intento de actualizar categoría sin campos proporcionados.');
      return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar (nombre o activo).' });
    }

    // Si se está activando una categoría, quitar la "E" del nombre
    let nombreActualizado = nombre;
    if (activo === true && nombre === undefined) {
      const categoriaActual = await Categoria.findById(id, id_restaurante);
      if (categoriaActual && categoriaActual.nombre.includes(' E')) {
        nombreActualizado = categoriaActual.nombre.replace(' E', '');
      }
    }

    const categoriaActualizada = await Categoria.update(id, id_restaurante, { nombre: nombreActualizado, activo });
    if (!categoriaActualizada) {
      logger.warn(`Categoría con ID ${id} no encontrada para actualizar en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ message: 'Categoría no encontrada para actualizar.' });
    }
    logger.info('Categoría actualizada exitosamente:', { id: categoriaActualizada.id_categoria, nombre: categoriaActualizada.nombre, id_restaurante: categoriaActualizada.id_restaurante });
    res.status(200).json({
      message: 'Categoría actualizada exitosamente.',
      data: categoriaActualizada,
    });
  } catch (error) {
    logger.error('Error al actualizar categoría:', error);
    next(error);
  }
};

exports.deleteCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante;

    // Verificar si la categoría existe
    const categoriaExistente = await Categoria.findById(id, id_restaurante);
    if (!categoriaExistente) {
      return res.status(404).json({ message: 'Categoría no encontrada para eliminar.' });
    }

    // Verificar si ya está inactiva
    if (categoriaExistente.activo === false) {
      return res.status(200).json({
        message: 'La categoría ya estaba marcada como inactiva.',
        data: categoriaExistente
      });
    }

    // Realizar el soft delete
    const categoriaEliminada = await Categoria.delete(id, id_restaurante);
    if (!categoriaEliminada) {
      return res.status(500).json({ message: 'Error interno al eliminar la categoría.' });
    }

    res.status(200).json({
      message: 'Categoría marcada como inactiva exitosamente (soft delete).',
      data: categoriaEliminada,
    });
  } catch (error) {
    logger.error('Error al eliminar categoría:', error);
    next(error);
  }
};