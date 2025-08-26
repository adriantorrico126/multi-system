const CategoriaEgresoModel = require('../models/categoriaEgresoModel');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

const categoriaEgresoController = {
  // =====================================================
  // OPERACIONES CRUD BÁSICAS
  // =====================================================

  /**
   * Obtener todas las categorías de egresos
   * GET /api/v1/categorias-egresos
   */
  async getAllCategorias(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { incluir_inactivas = false } = req.query;

      const categorias = await CategoriaEgresoModel.getAllCategorias(
        id_restaurante, 
        incluir_inactivas === 'true'
      );

      logger.info('Categorías de egresos obtenidas exitosamente', {
        id_restaurante,
        total: categorias.length,
        incluir_inactivas
      });

      res.status(200).json({
        success: true,
        message: 'Categorías de egresos obtenidas exitosamente',
        data: categorias
      });

    } catch (error) {
      logger.error('Error al obtener categorías de egresos:', error);
      next(error);
    }
  },

  /**
   * Obtener una categoría por ID
   * GET /api/v1/categorias-egresos/:id
   */
  async getCategoriaById(req, res, next) {
    try {
      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const categoria = await CategoriaEgresoModel.getCategoriaById(
        parseInt(id), 
        id_restaurante
      );

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría de egreso no encontrada'
        });
      }

      logger.info('Categoría de egreso obtenida exitosamente', {
        id_categoria_egreso: id,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Categoría de egreso obtenida exitosamente',
        data: categoria
      });

    } catch (error) {
      logger.error('Error al obtener categoría de egreso:', error);
      next(error);
    }
  },

  /**
   * Crear una nueva categoría de egreso
   * POST /api/v1/categorias-egresos
   */
  async createCategoria(req, res, next) {
    try {
      // Validar errores de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const id_restaurante = req.user.id_restaurante;
      const { nombre } = req.body;

      // Verificar que no existe una categoría con el mismo nombre
      const existeCategoria = await CategoriaEgresoModel.existeCategoriaNombre(
        nombre, 
        id_restaurante
      );

      if (existeCategoria) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con este nombre'
        });
      }

      const nuevaCategoria = await CategoriaEgresoModel.createCategoria(
        req.body, 
        id_restaurante
      );

      logger.info('Categoría de egreso creada exitosamente', {
        id_categoria_egreso: nuevaCategoria.id_categoria_egreso,
        nombre: nuevaCategoria.nombre,
        id_restaurante
      });

      res.status(201).json({
        success: true,
        message: 'Categoría de egreso creada exitosamente',
        data: nuevaCategoria
      });

    } catch (error) {
      logger.error('Error al crear categoría de egreso:', error);
      next(error);
    }
  },

  /**
   * Actualizar una categoría de egreso
   * PUT /api/v1/categorias-egresos/:id
   */
  async updateCategoria(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;
      const { nombre } = req.body;

      // Verificar que la categoría existe
      const categoriaExistente = await CategoriaEgresoModel.getCategoriaById(
        parseInt(id), 
        id_restaurante
      );

      if (!categoriaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Categoría de egreso no encontrada'
        });
      }

      // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
      if (nombre && nombre !== categoriaExistente.nombre) {
        const existeCategoria = await CategoriaEgresoModel.existeCategoriaNombre(
          nombre, 
          id_restaurante, 
          parseInt(id)
        );

        if (existeCategoria) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe una categoría con este nombre'
          });
        }
      }

      const categoriaActualizada = await CategoriaEgresoModel.updateCategoria(
        parseInt(id), 
        req.body, 
        id_restaurante
      );

      logger.info('Categoría de egreso actualizada exitosamente', {
        id_categoria_egreso: id,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Categoría de egreso actualizada exitosamente',
        data: categoriaActualizada
      });

    } catch (error) {
      logger.error('Error al actualizar categoría de egreso:', error);
      next(error);
    }
  },

  /**
   * Eliminar una categoría de egreso
   * DELETE /api/v1/categorias-egresos/:id
   */
  async deleteCategoria(req, res, next) {
    try {
      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;

      // Verificar que la categoría existe
      const categoriaExistente = await CategoriaEgresoModel.getCategoriaById(
        parseInt(id), 
        id_restaurante
      );

      if (!categoriaExistente) {
        return res.status(404).json({
          success: false,
          message: 'Categoría de egreso no encontrada'
        });
      }

      const resultado = await CategoriaEgresoModel.deleteCategoria(
        parseInt(id), 
        id_restaurante
      );

      logger.info('Categoría de egreso eliminada/desactivada exitosamente', {
        id_categoria_egreso: id,
        id_restaurante,
        resultado: resultado.message
      });

      res.status(200).json({
        success: true,
        message: resultado.message,
        data: resultado.categoria
      });

    } catch (error) {
      logger.error('Error al eliminar categoría de egreso:', error);
      next(error);
    }
  },

  // =====================================================
  // REPORTES Y ESTADÍSTICAS
  // =====================================================

  /**
   * Obtener categorías más populares
   * GET /api/v1/categorias-egresos/populares
   */
  async getCategoriasPopulares(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { limite = 5 } = req.query;

      const categorias = await CategoriaEgresoModel.getCategoriasPopulares(
        id_restaurante, 
        parseInt(limite)
      );

      logger.info('Categorías populares obtenidas exitosamente', {
        id_restaurante,
        total: categorias.length
      });

      res.status(200).json({
        success: true,
        message: 'Categorías populares obtenidas exitosamente',
        data: categorias
      });

    } catch (error) {
      logger.error('Error al obtener categorías populares:', error);
      next(error);
    }
  },

  /**
   * Obtener categorías con mayor gasto
   * GET /api/v1/categorias-egresos/mayor-gasto
   */
  async getCategoriasConMayorGasto(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { fecha_inicio, fecha_fin, limite = 10 } = req.query;

      const categorias = await CategoriaEgresoModel.getCategoriasConMayorGasto(
        id_restaurante,
        fecha_inicio,
        fecha_fin,
        parseInt(limite)
      );

      logger.info('Categorías con mayor gasto obtenidas exitosamente', {
        id_restaurante,
        total: categorias.length,
        fecha_inicio,
        fecha_fin
      });

      res.status(200).json({
        success: true,
        message: 'Categorías con mayor gasto obtenidas exitosamente',
        data: categorias
      });

    } catch (error) {
      logger.error('Error al obtener categorías con mayor gasto:', error);
      next(error);
    }
  },

  /**
   * Obtener estadísticas de una categoría por período
   * GET /api/v1/categorias-egresos/:id/estadisticas
   */
  async getEstadisticasCategoria(req, res, next) {
    try {
      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;
      const { fecha_inicio, fecha_fin } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son requeridas'
        });
      }

      const estadisticas = await CategoriaEgresoModel.getEstadisticasCategoria(
        parseInt(id),
        id_restaurante,
        fecha_inicio,
        fecha_fin
      );

      if (!estadisticas) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      logger.info('Estadísticas de categoría obtenidas exitosamente', {
        id_categoria_egreso: id,
        id_restaurante,
        fecha_inicio,
        fecha_fin
      });

      res.status(200).json({
        success: true,
        message: 'Estadísticas de categoría obtenidas exitosamente',
        data: estadisticas
      });

    } catch (error) {
      logger.error('Error al obtener estadísticas de categoría:', error);
      next(error);
    }
  },

  /**
   * Obtener categorías con sus últimos egresos
   * GET /api/v1/categorias-egresos/con-ultimos-egresos
   */
  async getCategoriasConUltimosEgresos(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { 
        limite_categorias = 10, 
        limite_egresos = 3 
      } = req.query;

      const categorias = await CategoriaEgresoModel.getCategoriasConUltimosEgresos(
        id_restaurante,
        parseInt(limite_categorias),
        parseInt(limite_egresos)
      );

      logger.info('Categorías con últimos egresos obtenidas exitosamente', {
        id_restaurante,
        total: categorias.length
      });

      res.status(200).json({
        success: true,
        message: 'Categorías con últimos egresos obtenidas exitosamente',
        data: categorias
      });

    } catch (error) {
      logger.error('Error al obtener categorías con últimos egresos:', error);
      next(error);
    }
  }
};

module.exports = categoriaEgresoController;
