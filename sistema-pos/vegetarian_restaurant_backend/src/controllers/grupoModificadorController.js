const GrupoModificadorModel = require('../models/grupoModificadorModel');
const logger = require('../config/logger');

const grupoModificadorController = {
  /**
   * Obtener todos los grupos de modificadores
   */
  async obtenerTodos(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;

      const grupos = await GrupoModificadorModel.obtenerTodos(id_restaurante);

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
   * Obtener un grupo por ID
   */
  async obtenerPorId(req, res) {
    try {
      const { id_grupo } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const grupo = await GrupoModificadorModel.obtenerPorId(id_grupo, id_restaurante);

      if (!grupo) {
        return res.status(404).json({
          success: false,
          message: 'Grupo no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: grupo
      });
    } catch (error) {
      logger.error('Error al obtener grupo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener grupo',
        error: error.message
      });
    }
  },

  /**
   * Crear grupo de modificadores
   */
  async crear(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;
      const grupoData = {
        ...req.body,
        id_restaurante
      };

      const grupo = await GrupoModificadorModel.crear(grupoData);

      logger.info(`Grupo de modificadores creado: ${grupo.id_grupo_modificador} (${grupo.nombre}) por ${req.user.username}`);

      res.status(201).json({
        success: true,
        message: 'Grupo creado exitosamente',
        data: grupo
      });
    } catch (error) {
      logger.error('Error al crear grupo:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Actualizar grupo de modificadores
   */
  async actualizar(req, res) {
    try {
      const { id_grupo } = req.params;
      const id_restaurante = req.user.id_restaurante;
      const grupoData = req.body;

      const grupo = await GrupoModificadorModel.actualizar(
        id_grupo,
        grupoData,
        id_restaurante
      );

      logger.info(`Grupo actualizado: ${id_grupo} por ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: 'Grupo actualizado exitosamente',
        data: grupo
      });
    } catch (error) {
      logger.error('Error al actualizar grupo:', error);
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error al actualizar grupo',
        error: error.message
      });
    }
  },

  /**
   * Eliminar (desactivar) grupo
   */
  async eliminar(req, res) {
    try {
      const { id_grupo } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const grupo = await GrupoModificadorModel.eliminar(id_grupo, id_restaurante);

      logger.info(`Grupo eliminado: ${id_grupo} por ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: 'Grupo eliminado exitosamente',
        data: grupo
      });
    } catch (error) {
      logger.error('Error al eliminar grupo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar grupo',
        error: error.message
      });
    }
  },

  /**
   * Asociar grupo a producto
   */
  async asociarAProducto(req, res) {
    try {
      const { id_grupo, id_producto } = req.params;
      const { orden_display = 0, es_obligatorio = false } = req.body;

      const relacion = await GrupoModificadorModel.asociarAProducto(
        id_producto,
        id_grupo,
        orden_display,
        es_obligatorio
      );

      logger.info(`Grupo ${id_grupo} asociado a producto ${id_producto} por ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: 'Grupo asociado al producto exitosamente',
        data: relacion
      });
    } catch (error) {
      logger.error('Error al asociar grupo a producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al asociar grupo',
        error: error.message
      });
    }
  },

  /**
   * Desasociar grupo de producto
   */
  async desasociarDeProducto(req, res) {
    try {
      const { id_grupo, id_producto } = req.params;

      const relacion = await GrupoModificadorModel.desasociarDeProducto(
        id_producto,
        id_grupo
      );

      if (!relacion) {
        return res.status(404).json({
          success: false,
          message: 'Relación no encontrada'
        });
      }

      logger.info(`Grupo ${id_grupo} desasociado de producto ${id_producto} por ${req.user.username}`);

      res.status(200).json({
        success: true,
        message: 'Grupo desasociado del producto exitosamente'
      });
    } catch (error) {
      logger.error('Error al desasociar grupo de producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desasociar grupo',
        error: error.message
      });
    }
  },

  /**
   * Obtener grupos de un producto
   */
  async obtenerPorProducto(req, res) {
    try {
      const { id_producto } = req.params;

      const grupos = await GrupoModificadorModel.obtenerPorProducto(id_producto);

      res.status(200).json({
        success: true,
        data: grupos,
        count: grupos.length
      });
    } catch (error) {
      logger.error('Error al obtener grupos del producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener grupos del producto',
        error: error.message
      });
    }
  },

  /**
   * Obtener productos que usan un grupo
   */
  async obtenerProductosDelGrupo(req, res) {
    try {
      const { id_grupo } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const productos = await GrupoModificadorModel.obtenerProductosDelGrupo(
        id_grupo,
        id_restaurante
      );

      res.status(200).json({
        success: true,
        data: productos,
        count: productos.length
      });
    } catch (error) {
      logger.error('Error al obtener productos del grupo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos del grupo',
        error: error.message
      });
    }
  },

  /**
   * Obtener estadísticas de un grupo
   */
  async obtenerEstadisticas(req, res) {
    try {
      const { id_grupo } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const estadisticas = await GrupoModificadorModel.obtenerEstadisticas(
        id_grupo,
        id_restaurante
      );

      if (!estadisticas) {
        return res.status(404).json({
          success: false,
          message: 'Grupo no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      logger.error('Error al obtener estadísticas del grupo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
};

module.exports = grupoModificadorController;

