const Categoria = require('../models/categoriaModel');

exports.createCategoria = async (req, res, next) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ message: 'El campo nombre es obligatorio.' });
    }
    const nuevaCategoria = await Categoria.create({ nombre });
    res.status(201).json({
      message: 'Categoría creada exitosamente.',
      data: nuevaCategoria,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllCategorias = async (req, res, next) => {
  try {
    // Permitir filtrar por activas/inactivas a través de un query param, ej: /categorias?includeInactive=true
    const includeInactive = req.query.includeInactive === 'true';
    const categorias = await Categoria.findAll(includeInactive);
    res.status(200).json({
      message: categorias.length > 0 ? 'Categorías obtenidas exitosamente.' : 'No hay categorías registradas.',
      count: categorias.length,
      data: categorias,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoriaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }
    res.status(200).json({
      message: 'Categoría obtenida exitosamente.',
      data: categoria,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, activo } = req.body;

    // Validar que al menos un campo se esté actualizando
    if (nombre === undefined && activo === undefined) {
      return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar (nombre o activo).' });
    }

    const categoriaActualizada = await Categoria.update(id, { nombre, activo });
    if (!categoriaActualizada) {
      return res.status(404).json({ message: 'Categoría no encontrada para actualizar.' });
    }
    res.status(200).json({
      message: 'Categoría actualizada exitosamente.',
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Usamos soft delete por defecto
    const categoriaEliminada = await Categoria.delete(id);
    if (!categoriaEliminada || !categoriaEliminada.activo === false) { // Verificar si realmente se "eliminó" (marcó como inactiva)
      // Podría ser que ya estaba inactiva o no se encontró
      const categoriaExistente = await Categoria.findById(id);
      if (!categoriaExistente) {
        return res.status(404).json({ message: 'Categoría no encontrada para eliminar.' });
      }
      if (categoriaExistente.activo === false) {
        return res.status(200).json({
            message: 'La categoría ya estaba marcada como inactiva.',
            data: categoriaExistente
        });
      }
    }
    res.status(200).json({
      message: 'Categoría marcada como inactiva exitosamente (soft delete).',
      data: categoriaEliminada,
    });
  } catch (error) {
    next(error);
  }
};

// Opcional: Endpoint para hard delete si es necesario (usar con precaución)
// exports.hardDeleteCategoria = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const categoria = await Categoria.hardDelete(id);
//     if (!categoria) {
//       return res.status(404).json({ message: 'Categoría no encontrada para eliminación permanente.' });
//     }
//     res.status(200).json({
//         message: 'Categoría eliminada permanentemente (hard delete).',
//         data: categoria
//     });
//   } catch (error) {
//     next(error);
//   }
// };
