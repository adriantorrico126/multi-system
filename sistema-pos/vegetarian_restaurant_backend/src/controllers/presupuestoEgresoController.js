const PresupuestoEgresoModel = require('../models/presupuestoEgresoModel');
const CategoriaEgresoModel = require('../models/categoriaEgresoModel');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

const presupuestoEgresoController = {
  // =====================================================
  // OPERACIONES CRUD BÁSICAS
  // =====================================================

  /**
   * Obtener todos los presupuestos
   * GET /api/v1/presupuestos-egresos
   */
  async getAllPresupuestos(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const {
        anio,
        mes,
        id_categoria_egreso,
        activo
      } = req.query;

      const filtros = {
        anio: anio ? parseInt(anio) : null,
        mes: mes ? parseInt(mes) : null,
        id_categoria_egreso: id_categoria_egreso ? parseInt(id_categoria_egreso) : null,
        activo: activo !== undefined ? activo === 'true' : undefined
      };

      const presupuestos = await PresupuestoEgresoModel.getAllPresupuestos(
        id_restaurante, 
        filtros
      );

      logger.info('Presupuestos de egresos obtenidos exitosamente', {
        id_restaurante,
        total: presupuestos.length,
        filtros
      });

      res.status(200).json({
        success: true,
        message: 'Presupuestos de egresos obtenidos exitosamente',
        data: presupuestos
      });

    } catch (error) {
      logger.error('Error al obtener presupuestos de egresos:', error);
      next(error);
    }
  },

  /**
   * Obtener un presupuesto por ID
   * GET /api/v1/presupuestos-egresos/:id
   */
  async getPresupuestoById(req, res, next) {
    try {
      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const presupuesto = await PresupuestoEgresoModel.getPresupuestoById(
        parseInt(id), 
        id_restaurante
      );

      if (!presupuesto) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado'
        });
      }

      logger.info('Presupuesto obtenido exitosamente', {
        id_presupuesto: id,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Presupuesto obtenido exitosamente',
        data: presupuesto
      });

    } catch (error) {
      logger.error('Error al obtener presupuesto:', error);
      next(error);
    }
  },

  /**
   * Crear un nuevo presupuesto
   * POST /api/v1/presupuestos-egresos
   */
  async createPresupuesto(req, res, next) {
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
      const { id_categoria_egreso } = req.body;

      // Verificar que la categoría existe y pertenece al restaurante
      const categoria = await CategoriaEgresoModel.getCategoriaById(
        id_categoria_egreso, 
        id_restaurante
      );

      if (!categoria || !categoria.activo) {
        return res.status(400).json({
          success: false,
          message: 'Categoría de egreso no válida o inactiva'
        });
      }

      const nuevoPresupuesto = await PresupuestoEgresoModel.createPresupuesto(
        req.body, 
        id_restaurante
      );

      logger.info('Presupuesto creado exitosamente', {
        id_presupuesto: nuevoPresupuesto.id_presupuesto,
        anio: nuevoPresupuesto.anio,
        mes: nuevoPresupuesto.mes,
        monto_presupuestado: nuevoPresupuesto.monto_presupuestado,
        id_restaurante
      });

      res.status(201).json({
        success: true,
        message: 'Presupuesto creado exitosamente',
        data: nuevoPresupuesto
      });

    } catch (error) {
      logger.error('Error al crear presupuesto:', error);
      
      // Manejar error específico de presupuesto duplicado
      if (error.message.includes('Ya existe un presupuesto')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      next(error);
    }
  },

  /**
   * Actualizar un presupuesto
   * PUT /api/v1/presupuestos-egresos/:id
   */
  async updatePresupuesto(req, res, next) {
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

      // Verificar que el presupuesto existe
      const presupuestoExistente = await PresupuestoEgresoModel.getPresupuestoById(
        parseInt(id), 
        id_restaurante
      );

      if (!presupuestoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado'
        });
      }

      const presupuestoActualizado = await PresupuestoEgresoModel.updatePresupuesto(
        parseInt(id), 
        req.body, 
        id_restaurante
      );

      logger.info('Presupuesto actualizado exitosamente', {
        id_presupuesto: id,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Presupuesto actualizado exitosamente',
        data: presupuestoActualizado
      });

    } catch (error) {
      logger.error('Error al actualizar presupuesto:', error);
      next(error);
    }
  },

  /**
   * Eliminar un presupuesto
   * DELETE /api/v1/presupuestos-egresos/:id
   */
  async deletePresupuesto(req, res, next) {
    try {
      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;

      // Verificar que el presupuesto existe
      const presupuestoExistente = await PresupuestoEgresoModel.getPresupuestoById(
        parseInt(id), 
        id_restaurante
      );

      if (!presupuestoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Presupuesto no encontrado'
        });
      }

      const presupuestoEliminado = await PresupuestoEgresoModel.deletePresupuesto(
        parseInt(id), 
        id_restaurante
      );

      logger.info('Presupuesto eliminado exitosamente', {
        id_presupuesto: id,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Presupuesto eliminado exitosamente',
        data: presupuestoEliminado
      });

    } catch (error) {
      logger.error('Error al eliminar presupuesto:', error);
      next(error);
    }
  },

  // =====================================================
  // OPERACIONES ESPECIALES
  // =====================================================

  /**
   * Obtener presupuestos por período
   * GET /api/v1/presupuestos-egresos/por-periodo
   */
  async getPresupuestosPorPeriodo(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { anio, mes } = req.query;

      if (!anio) {
        return res.status(400).json({
          success: false,
          message: 'El año es requerido'
        });
      }

      const presupuestos = await PresupuestoEgresoModel.getPresupuestosPorPeriodo(
        id_restaurante,
        parseInt(anio),
        mes ? parseInt(mes) : null
      );

      logger.info('Presupuestos por período obtenidos exitosamente', {
        id_restaurante,
        anio,
        mes,
        total: presupuestos.length
      });

      res.status(200).json({
        success: true,
        message: 'Presupuestos por período obtenidos exitosamente',
        data: presupuestos
      });

    } catch (error) {
      logger.error('Error al obtener presupuestos por período:', error);
      next(error);
    }
  },

  /**
   * Obtener resumen anual de presupuestos
   * GET /api/v1/presupuestos-egresos/resumen-anual
   */
  async getResumenAnual(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { anio } = req.query;

      if (!anio) {
        return res.status(400).json({
          success: false,
          message: 'El año es requerido'
        });
      }

      const resumen = await PresupuestoEgresoModel.getResumenAnual(
        id_restaurante,
        parseInt(anio)
      );

      logger.info('Resumen anual obtenido exitosamente', {
        id_restaurante,
        anio
      });

      res.status(200).json({
        success: true,
        message: 'Resumen anual obtenido exitosamente',
        data: resumen
      });

    } catch (error) {
      logger.error('Error al obtener resumen anual:', error);
      next(error);
    }
  },

  /**
   * Obtener presupuestos excedidos
   * GET /api/v1/presupuestos-egresos/excedidos
   */
  async getPresupuestosExcedidos(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { anio, mes } = req.query;

      const presupuestos = await PresupuestoEgresoModel.getPresupuestosExcedidos(
        id_restaurante,
        anio ? parseInt(anio) : null,
        mes ? parseInt(mes) : null
      );

      logger.info('Presupuestos excedidos obtenidos exitosamente', {
        id_restaurante,
        total: presupuestos.length,
        anio,
        mes
      });

      res.status(200).json({
        success: true,
        message: 'Presupuestos excedidos obtenidos exitosamente',
        data: presupuestos
      });

    } catch (error) {
      logger.error('Error al obtener presupuestos excedidos:', error);
      next(error);
    }
  },

  /**
   * Obtener presupuestos en alerta
   * GET /api/v1/presupuestos-egresos/en-alerta
   */
  async getPresupuestosEnAlerta(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { umbral = 90, anio, mes } = req.query;

      const presupuestos = await PresupuestoEgresoModel.getPresupuestosEnAlerta(
        id_restaurante,
        parseInt(umbral),
        anio ? parseInt(anio) : null,
        mes ? parseInt(mes) : null
      );

      logger.info('Presupuestos en alerta obtenidos exitosamente', {
        id_restaurante,
        total: presupuestos.length,
        umbral,
        anio,
        mes
      });

      res.status(200).json({
        success: true,
        message: 'Presupuestos en alerta obtenidos exitosamente',
        data: presupuestos
      });

    } catch (error) {
      logger.error('Error al obtener presupuestos en alerta:', error);
      next(error);
    }
  },

  /**
   * Actualizar montos gastados
   * POST /api/v1/presupuestos-egresos/actualizar-montos-gastados
   */
  async actualizarMontosGastados(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { anio, mes } = req.body;

      // Solo admin y gerente pueden actualizar montos
      if (!['admin', 'gerente'].includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar montos gastados'
        });
      }

      const presupuestosActualizados = await PresupuestoEgresoModel.actualizarMontosGastados(
        id_restaurante,
        anio ? parseInt(anio) : null,
        mes ? parseInt(mes) : null
      );

      logger.info('Montos gastados actualizados exitosamente', {
        id_restaurante,
        presupuestos_actualizados: presupuestosActualizados,
        anio,
        mes
      });

      res.status(200).json({
        success: true,
        message: 'Montos gastados actualizados exitosamente',
        data: {
          presupuestos_actualizados: presupuestosActualizados
        }
      });

    } catch (error) {
      logger.error('Error al actualizar montos gastados:', error);
      next(error);
    }
  },

  /**
   * Copiar presupuestos de un período a otro
   * POST /api/v1/presupuestos-egresos/copiar
   */
  async copiarPresupuestos(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const id_restaurante = req.user.id_restaurante;
      const { 
        anio_origen, 
        mes_origen, 
        anio_destino, 
        mes_destino 
      } = req.body;

      // Solo admin y gerente pueden copiar presupuestos
      if (!['admin', 'gerente'].includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para copiar presupuestos'
        });
      }

      const presupuestosCopiad = await PresupuestoEgresoModel.copiarPresupuestos(
        id_restaurante,
        anio_origen,
        mes_origen,
        anio_destino,
        mes_destino
      );

      logger.info('Presupuestos copiados exitosamente', {
        id_restaurante,
        anio_origen,
        mes_origen,
        anio_destino,
        mes_destino,
        presupuestos_copiados: presupuestosCopiad
      });

      res.status(200).json({
        success: true,
        message: 'Presupuestos copiados exitosamente',
        data: {
          presupuestos_copiados: presupuestosCopiad,
          periodo_origen: { anio: anio_origen, mes: mes_origen },
          periodo_destino: { anio: anio_destino, mes: mes_destino }
        }
      });

    } catch (error) {
      logger.error('Error al copiar presupuestos:', error);
      
      // Manejar error específico de presupuestos existentes
      if (error.message.includes('Ya existen presupuestos')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      next(error);
    }
  },

  /**
   * Obtener evolución de presupuestos por categoría
   * GET /api/v1/presupuestos-egresos/evolucion/:id_categoria
   */
  async getEvolucionPorCategoria(req, res, next) {
    try {
      const { id_categoria } = req.params;
      const id_restaurante = req.user.id_restaurante;
      const { anio, meses_atras = 12 } = req.query;

      if (!anio) {
        return res.status(400).json({
          success: false,
          message: 'El año es requerido'
        });
      }

      // Verificar que la categoría existe
      const categoria = await CategoriaEgresoModel.getCategoriaById(
        parseInt(id_categoria), 
        id_restaurante
      );

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      const evolucion = await PresupuestoEgresoModel.getEvolucionPorCategoria(
        id_restaurante,
        parseInt(id_categoria),
        parseInt(anio),
        parseInt(meses_atras)
      );

      logger.info('Evolución por categoría obtenida exitosamente', {
        id_restaurante,
        id_categoria_egreso: id_categoria,
        anio,
        meses_atras,
        total_periodos: evolucion.length
      });

      res.status(200).json({
        success: true,
        message: 'Evolución por categoría obtenida exitosamente',
        data: {
          categoria: categoria.nombre,
          evolucion: evolucion
        }
      });

    } catch (error) {
      logger.error('Error al obtener evolución por categoría:', error);
      next(error);
    }
  }
};

module.exports = presupuestoEgresoController;
