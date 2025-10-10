const ModificadorModel = require('../models/modificadorModel');
const logger = require('../config/logger');

const modificadorController = {
  // =====================================================
  // MÉTODOS BÁSICOS (Compatibilidad con código existente)
  // =====================================================

  /**
   * Listar modificadores de un producto
   * @deprecated Mantener para compatibilidad
   */
  async listarPorProducto(req, res) {
    try {
      const { id_producto } = req.params;
      const modificadores = await ModificadorModel.listarPorProducto(id_producto);
      res.status(200).json({ 
        success: true,
        modificadores 
      });
    } catch (error) {
      logger.error('Error al listar modificadores:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al listar modificadores.', 
        error: error.message 
      });
    }
  },

  /**
   * Crear modificador para un producto (método simple)
   */
  async crear(req, res) {
    try {
      const { id_producto, nombre_modificador, precio_extra, tipo_modificador } = req.body;
      
      if (!id_producto || !nombre_modificador || !tipo_modificador) {
        return res.status(400).json({ 
          success: false,
          message: 'Faltan datos requeridos: id_producto, nombre_modificador, tipo_modificador' 
        });
      }
      
      const modificador = await ModificadorModel.crear({ 
        id_producto, 
        nombre_modificador, 
        precio_extra, 
        tipo_modificador 
      });
      
      logger.info(`Modificador creado: ${modificador.id_modificador} por usuario ${req.user?.username}`);
      
      res.status(201).json({ 
        success: true,
        message: 'Modificador creado exitosamente',
        modificador 
      });
    } catch (error) {
      logger.error('Error al crear modificador:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al crear modificador.', 
        error: error.message 
      });
    }
  },

  /**
   * Asociar modificadores a un detalle de venta
   */
  async asociarAMovimiento(req, res) {
    try {
      const { id_detalle_venta } = req.params;
      const { id_modificadores } = req.body;
      
      if (!Array.isArray(id_modificadores) || id_modificadores.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Se requiere un array de id_modificadores.' 
        });
      }
      
      await ModificadorModel.asociarAMovimiento(id_detalle_venta, id_modificadores);
      
      res.status(200).json({ 
        success: true,
        message: 'Modificadores asociados exitosamente' 
      });
    } catch (error) {
      logger.error('Error al asociar modificadores:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al asociar modificadores.', 
        error: error.message 
      });
    }
  },

  /**
   * Listar modificadores de un detalle de venta
   */
  async listarPorDetalleVenta(req, res) {
    try {
      const { id_detalle_venta } = req.params;
      const modificadores = await ModificadorModel.listarPorDetalleVenta(id_detalle_venta);
      
      res.status(200).json({ 
        success: true,
        modificadores 
      });
    } catch (error) {
      logger.error('Error al listar modificadores del detalle:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al listar modificadores del detalle.', 
        error: error.message 
      });
    }
  },

  // =====================================================
  // MÉTODOS NUEVOS - SISTEMA PROFESIONAL
  // =====================================================

  /**
   * Obtener grupos con modificadores de un producto
   */
  async obtenerGruposPorProducto(req, res) {
    try {
      const { id_producto } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const grupos = await ModificadorModel.obtenerGruposPorProducto(id_producto, id_restaurante);

      res.status(200).json({
        success: true,
        data: grupos,
        count: grupos.length
      });
    } catch (error) {
      logger.error('Error al obtener grupos de modificadores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener grupos de modificadores',
        error: error.message
      });
    }
  },

  /**
   * Obtener modificadores completos de un producto
   */
  async obtenerModificadoresCompletos(req, res) {
    try {
      const { id_producto } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const modificadores = await ModificadorModel.obtenerModificadoresCompletos(
        id_producto, 
        id_restaurante
      );

      res.status(200).json({
        success: true,
        data: modificadores,
        count: modificadores.length
      });
    } catch (error) {
      logger.error('Error al obtener modificadores completos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener modificadores',
        error: error.message
      });
    }
  },

  /**
   * Crear modificador completo con todos los campos
   */
  async crearCompleto(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const modificadorData = {
        ...req.body,
        id_restaurante
      };

      // Validaciones básicas
      if (!modificadorData.id_producto || !modificadorData.nombre_modificador || 
          !modificadorData.tipo_modificador) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios: id_producto, nombre_modificador, tipo_modificador'
        });
      }

      const modificador = await ModificadorModel.crearCompleto(modificadorData);

      logger.info(`Modificador completo creado: ${modificador.id_modificador} por ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Modificador creado exitosamente',
        data: modificador
      });
    } catch (error) {
      logger.error('Error al crear modificador completo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear modificador',
        error: error.message
      });
    }
  },

  /**
   * Actualizar modificador
   */
  async actualizar(req, res) {
    try {
      const { id_modificador } = req.params;
      const id_restaurante = req.user.id_restaurante;
      const modificadorData = req.body;

      const modificador = await ModificadorModel.actualizar(
        id_modificador,
        modificadorData,
        id_restaurante
      );

      logger.info(`Modificador actualizado: ${id_modificador} por ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: 'Modificador actualizado exitosamente',
        data: modificador
      });
    } catch (error) {
      logger.error('Error al actualizar modificador:', error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar modificador',
        error: error.message
      });
    }
  },

  /**
   * Eliminar (desactivar) modificador
   */
  async eliminar(req, res) {
    try {
      const { id_modificador } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const modificador = await ModificadorModel.eliminar(id_modificador, id_restaurante);

      logger.info(`Modificador eliminado: ${id_modificador} por ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: 'Modificador eliminado exitosamente',
        data: modificador
      });
    } catch (error) {
      logger.error('Error al eliminar modificador:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar modificador',
        error: error.message
      });
    }
  },

  /**
   * Validar selección de modificadores antes de agregar al carrito
   */
  async validarSeleccion(req, res) {
    try {
      const { id_producto, modificadores } = req.body;

      if (!id_producto) {
        return res.status(400).json({
          success: false,
          message: 'id_producto es requerido'
        });
      }

      const validacion = await ModificadorModel.validarSeleccion(
        id_producto,
        modificadores || []
      );

      res.status(200).json({
        success: validacion.es_valido,
        message: validacion.mensaje_error || 'Selección válida',
        data: validacion
      });
    } catch (error) {
      logger.error('Error al validar modificadores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al validar modificadores',
        error: error.message
      });
    }
  },

  /**
   * Verificar stock antes de venta
   */
  async verificarStock(req, res) {
    try {
      const { modificadores } = req.body;

      if (!Array.isArray(modificadores)) {
        return res.status(400).json({
          success: false,
          message: 'modificadores debe ser un array'
        });
      }

      const resultados = await ModificadorModel.verificarStockMultiple(modificadores);

      res.status(200).json({
        success: true,
        message: 'Stock disponible para todos los modificadores',
        data: resultados
      });
    } catch (error) {
      logger.warn('Stock insuficiente:', error.message);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Actualizar stock de modificador
   */
  async actualizarStock(req, res) {
    try {
      const { id_modificador } = req.params;
      const { stock } = req.body;
      const id_restaurante = req.user.id_restaurante;

      if (stock === undefined || stock < 0) {
        return res.status(400).json({
          success: false,
          message: 'Stock debe ser un número mayor o igual a 0'
        });
      }

      const modificador = await ModificadorModel.actualizarStock(
        id_modificador,
        stock,
        id_restaurante
      );

      logger.info(`Stock actualizado para modificador ${id_modificador} por ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: modificador
      });
    } catch (error) {
      logger.error('Error al actualizar stock:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Obtener estadísticas de modificadores
   */
  async obtenerEstadisticas(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const { fecha_inicio, fecha_fin } = req.query;

      const fechaInicio = fecha_inicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const fechaFin = fecha_fin || new Date();

      const estadisticas = await ModificadorModel.obtenerEstadisticas(
        id_restaurante,
        fechaInicio,
        fechaFin
      );

      res.status(200).json({
        success: true,
        data: estadisticas,
        periodo: {
          inicio: fechaInicio,
          fin: fechaFin
        }
      });
    } catch (error) {
      logger.error('Error al obtener estadísticas de modificadores:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  },

  /**
   * Obtener modificadores más populares
   */
  async obtenerMasPopulares(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const limite = parseInt(req.query.limite) || 10;

      const populares = await ModificadorModel.obtenerMasPopulares(id_restaurante, limite);

      res.status(200).json({
        success: true,
        data: populares,
        count: populares.length
      });
    } catch (error) {
      logger.error('Error al obtener modificadores populares:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener modificadores populares',
        error: error.message
      });
    }
  },

  /**
   * Obtener modificadores con stock bajo
   */
  async obtenerConStockBajo(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const umbral = parseInt(req.query.umbral) || 5;

      const modificadores = await ModificadorModel.obtenerConStockBajo(id_restaurante, umbral);

      res.status(200).json({
        success: true,
        data: modificadores,
        count: modificadores.length,
        mensaje: modificadores.length > 0 
          ? `Se encontraron ${modificadores.length} modificador(es) con stock bajo`
          : 'Todos los modificadores tienen stock suficiente'
      });
    } catch (error) {
      logger.error('Error al obtener modificadores con stock bajo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener modificadores con stock bajo',
        error: error.message
      });
    }
  }
};

module.exports = modificadorController; 