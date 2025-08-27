const EgresoModel = require('../models/egresoModel');
const CategoriaEgresoModel = require('../models/categoriaEgresoModel');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

const egresoController = {
  // =====================================================
  // OPERACIONES CRUD BÁSICAS
  // =====================================================

  /**
   * Obtener todos los egresos
   * GET /api/v1/egresos
   */
  async getAllEgresos(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const {
        fecha_inicio,
        fecha_fin,
        id_categoria_egreso,
        estado,
        id_sucursal,
        proveedor_nombre,
        page = 1,
        limit = 50
      } = req.query;

      // Calcular offset para paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const filtros = {
        fecha_inicio,
        fecha_fin,
        id_categoria_egreso: id_categoria_egreso ? parseInt(id_categoria_egreso) : null,
        estado,
        id_sucursal: id_sucursal ? parseInt(id_sucursal) : null,
        proveedor_nombre,
        limit: parseInt(limit),
        offset
      };

      const egresos = await EgresoModel.getAllEgresos(id_restaurante, filtros);

      // Obtener total de registros para paginación
      const totalQuery = await EgresoModel.getAllEgresos(id_restaurante, {
        ...filtros,
        limit: null,
        offset: null
      });
      const total = totalQuery.length;

      logger.info('Egresos obtenidos exitosamente', {
        id_restaurante,
        total: egresos.length,
        filtros
      });

      res.status(200).json({
        success: true,
        message: 'Egresos obtenidos exitosamente',
        data: egresos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      logger.error('Error al obtener egresos:', error);
      next(error);
    }
  },

  /**
   * Obtener un egreso por ID
   * GET /api/v1/egresos/:id
   */
  async getEgresoById(req, res, next) {
    try {
      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const egreso = await EgresoModel.getEgresoById(parseInt(id), id_restaurante);

      if (!egreso) {
        return res.status(404).json({
          success: false,
          message: 'Egreso no encontrado'
        });
      }

      // Obtener flujo de aprobaciones
      const flujoAprobaciones = await EgresoModel.getFlujoAprobaciones(parseInt(id), id_restaurante);

      logger.info('Egreso obtenido exitosamente', {
        id_egreso: id,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Egreso obtenido exitosamente',
        data: {
          ...egreso,
          flujo_aprobaciones: flujoAprobaciones
        }
      });

    } catch (error) {
      logger.error('Error al obtener egreso:', error);
      next(error);
    }
  },

  /**
   * Crear un nuevo egreso
   * POST /api/v1/egresos
   */
  async createEgreso(req, res, next) {
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
      const registrado_por = req.user.id;

      const egresoData = {
        ...req.body,
        registrado_por,
        id_sucursal: req.body.id_sucursal || req.user.id_sucursal
      };

      // Verificar que la categoría existe y pertenece al restaurante
      const categoria = await CategoriaEgresoModel.getCategoriaById(
        egresoData.id_categoria_egreso, 
        id_restaurante
      );

      if (!categoria || !categoria.activo) {
        return res.status(400).json({
          success: false,
          message: 'Categoría de egreso no válida o inactiva'
        });
      }

      const nuevoEgreso = await EgresoModel.createEgreso(egresoData, id_restaurante);

      logger.info('Egreso creado exitosamente', {
        id_egreso: nuevoEgreso.id_egreso,
        concepto: nuevoEgreso.concepto,
        monto: nuevoEgreso.monto,
        id_restaurante,
        registrado_por
      });

      res.status(201).json({
        success: true,
        message: 'Egreso creado exitosamente',
        data: nuevoEgreso
      });

    } catch (error) {
      logger.error('Error al crear egreso:', error);
      next(error);
    }
  },

  /**
   * Actualizar un egreso
   * PUT /api/v1/egresos/:id
   */
  async updateEgreso(req, res, next) {
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

      // Verificar que el egreso existe y está en estado editable
      const egresoExistente = await EgresoModel.getEgresoById(parseInt(id), id_restaurante);

      if (!egresoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Egreso no encontrado'
        });
      }

      if (egresoExistente.estado !== 'pendiente') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden editar egresos en estado pendiente'
        });
      }

      // Verificar permisos (solo el creador o admin/gerente puede editar)
      if (egresoExistente.registrado_por !== req.user.id && 
          !['admin', 'gerente'].includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este egreso'
        });
      }

      const egresoActualizado = await EgresoModel.updateEgreso(
        parseInt(id), 
        req.body, 
        id_restaurante
      );

      logger.info('Egreso actualizado exitosamente', {
        id_egreso: id,
        id_restaurante,
        actualizado_por: req.user.id
      });

      res.status(200).json({
        success: true,
        message: 'Egreso actualizado exitosamente',
        data: egresoActualizado
      });

    } catch (error) {
      logger.error('Error al actualizar egreso:', error);
      next(error);
    }
  },

  /**
   * Eliminar un egreso (cancelar)
   * DELETE /api/v1/egresos/:id
   */
  async deleteEgreso(req, res, next) {
    try {
      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;

      // Verificar que el egreso existe
      const egresoExistente = await EgresoModel.getEgresoById(parseInt(id), id_restaurante);

      if (!egresoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Egreso no encontrado'
        });
      }

      // Verificar permisos
      if (egresoExistente.registrado_por !== req.user.id && 
          !['admin', 'gerente'].includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este egreso'
        });
      }

      const egresoCancelado = await EgresoModel.deleteEgreso(parseInt(id), id_restaurante);

      if (!egresoCancelado) {
        return res.status(400).json({
          success: false,
          message: 'No se puede cancelar el egreso. Debe estar en estado pendiente.'
        });
      }

      logger.info('Egreso cancelado exitosamente', {
        id_egreso: id,
        id_restaurante,
        cancelado_por: req.user.id
      });

      res.status(200).json({
        success: true,
        message: 'Egreso cancelado exitosamente',
        data: egresoCancelado
      });

    } catch (error) {
      logger.error('Error al cancelar egreso:', error);
      next(error);
    }
  },

  // =====================================================
  // OPERACIONES DE APROBACIÓN
  // =====================================================

  /**
   * Aprobar un egreso
   * POST /api/v1/egresos/:id/aprobar
   */
  async aprobarEgreso(req, res, next) {
    try {
      const { id } = req.params;
      const { comentario } = req.body;
      const id_restaurante = req.user.id_restaurante;
      const id_vendedor_aprobador = req.user.id;

      // Verificar permisos (solo admin y gerente pueden aprobar)
      if (!['admin', 'gerente'].includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para aprobar egresos'
        });
      }

      const egresoAprobado = await EgresoModel.aprobarEgreso(
        parseInt(id),
        id_vendedor_aprobador,
        comentario,
        id_restaurante
      );

      logger.info('Egreso aprobado exitosamente', {
        id_egreso: id,
        aprobado_por: id_vendedor_aprobador,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Egreso aprobado exitosamente',
        data: egresoAprobado
      });

    } catch (error) {
      logger.error('Error al aprobar egreso:', error);
      next(error);
    }
  },

  /**
   * Rechazar un egreso
   * POST /api/v1/egresos/:id/rechazar
   */
  async rechazarEgreso(req, res, next) {
    try {
      const { id } = req.params;
      const { comentario } = req.body;
      const id_restaurante = req.user.id_restaurante;
      const id_vendedor_rechazador = req.user.id;

      // Verificar permisos
      if (!['admin', 'gerente'].includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para rechazar egresos'
        });
      }

      if (!comentario) {
        return res.status(400).json({
          success: false,
          message: 'El comentario es requerido para rechazar un egreso'
        });
      }

      const egresoRechazado = await EgresoModel.rechazarEgreso(
        parseInt(id),
        id_vendedor_rechazador,
        comentario,
        id_restaurante
      );

      logger.info('Egreso rechazado exitosamente', {
        id_egreso: id,
        rechazado_por: id_vendedor_rechazador,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Egreso rechazado exitosamente',
        data: egresoRechazado
      });

    } catch (error) {
      logger.error('Error al rechazar egreso:', error);
      next(error);
    }
  },

  /**
   * Marcar egreso como pagado
   * POST /api/v1/egresos/:id/pagar
   */
  async marcarComoPagado(req, res, next) {
    try {
      const { id } = req.params;
      const { comentario } = req.body;
      const id_restaurante = req.user.id_restaurante;
      const id_vendedor = req.user.id;

      // Verificar permisos
      if (!['admin', 'gerente', 'cajero'].includes(req.user.rol)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para marcar egresos como pagados'
        });
      }

      const egresoPagado = await EgresoModel.marcarComoPagado(
        parseInt(id),
        id_vendedor,
        comentario,
        id_restaurante
      );

      logger.info('Egreso marcado como pagado exitosamente', {
        id_egreso: id,
        pagado_por: id_vendedor,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Egreso marcado como pagado exitosamente',
        data: egresoPagado
      });

    } catch (error) {
      logger.error('Error al marcar egreso como pagado:', error);
      next(error);
    }
  },

  // =====================================================
  // REPORTES Y ESTADÍSTICAS
  // =====================================================

  /**
   * Obtener resumen de egresos por categoría
   * GET /api/v1/egresos/reportes/por-categoria
   */
  async getResumenPorCategoria(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { fecha_inicio, fecha_fin } = req.query;

      const filtros = {};
      if (fecha_inicio) filtros.fecha_inicio = fecha_inicio;
      if (fecha_fin) filtros.fecha_fin = fecha_fin;

      const resumen = await EgresoModel.getResumenPorCategoria(id_restaurante, filtros);

      logger.info('Resumen por categoría obtenido exitosamente', {
        id_restaurante,
        categorias: resumen.length
      });

      res.status(200).json({
        success: true,
        message: 'Resumen por categoría obtenido exitosamente',
        data: resumen
      });

    } catch (error) {
      logger.error('Error al obtener resumen por categoría:', error);
      next(error);
    }
  },

  /**
   * Obtener total de egresos por período
   * GET /api/v1/egresos/reportes/por-periodo
   */
  async getTotalPorPeriodo(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { fecha_inicio, fecha_fin, estado } = req.query;

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Las fechas de inicio y fin son requeridas'
        });
      }

      const total = await EgresoModel.getTotalPorPeriodo(
        id_restaurante,
        fecha_inicio,
        fecha_fin,
        estado
      );

      logger.info('Total por período obtenido exitosamente', {
        id_restaurante,
        fecha_inicio,
        fecha_fin,
        estado
      });

      res.status(200).json({
        success: true,
        message: 'Total por período obtenido exitosamente',
        data: total
      });

    } catch (error) {
      logger.error('Error al obtener total por período:', error);
      next(error);
    }
  },

  /**
   * Obtener egresos pendientes de aprobación
   * GET /api/v1/egresos/pendientes-aprobacion
   */
  async getEgresosPendientesAprobacion(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;

      const egresos = await EgresoModel.getEgresosPendientesAprobacion(id_restaurante);

      logger.info('Egresos pendientes de aprobación obtenidos exitosamente', {
        id_restaurante,
        total: egresos.length
      });

      res.status(200).json({
        success: true,
        message: 'Egresos pendientes de aprobación obtenidos exitosamente',
        data: egresos
      });

    } catch (error) {
      // Evitar romper el dashboard: responder con lista vacía
      logger.error('Error al obtener egresos pendientes:', error);
      res.status(200).json({
        success: true,
        message: 'Egresos pendientes no disponibles temporalmente',
        data: []
      });
    }
  },

  /**
   * Obtener flujo de aprobaciones de un egreso
   * GET /api/v1/egresos/:id/flujo-aprobaciones
   */
  async getFlujoAprobaciones(req, res, next) {
    try {
      const { id } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const flujo = await EgresoModel.getFlujoAprobaciones(parseInt(id), id_restaurante);

      logger.info('Flujo de aprobaciones obtenido exitosamente', {
        id_egreso: id,
        id_restaurante
      });

      res.status(200).json({
        success: true,
        message: 'Flujo de aprobaciones obtenido exitosamente',
        data: flujo
      });

    } catch (error) {
      logger.error('Error al obtener flujo de aprobaciones:', error);
      next(error);
    }
  },

  /**
   * Obtener egresos pendientes de aprobación
   * GET /api/v1/egresos/pendientes-aprobacion
   */
  async getPendientesAprobacion(req, res, next) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { limit = 10 } = req.query;

      // Filtros para egresos pendientes de aprobación
      const filtros = {
        estado: 'pendiente',
        limit: parseInt(limit),
        offset: 0
      };

      const egresos = await EgresoModel.getAllEgresos(id_restaurante, filtros);

      logger.info(`Obtenidos ${egresos.length} egresos pendientes de aprobación para restaurante ${id_restaurante}`);

      res.json({
        success: true,
        data: egresos,
        total: egresos.length,
        message: `${egresos.length} egresos pendientes de aprobación`
      });

    } catch (error) {
      logger.error('Error al obtener egresos pendientes de aprobación:', error);
      next(error);
    }
  }
};

module.exports = egresoController;
