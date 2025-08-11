const GrupoMesaModel = require('../models/grupoMesaModel');

const grupoMesaController = {
  // Crear un nuevo grupo de mesas (unir varias mesas)
  async crearGrupo(req, res) {
    try {
      const { id_restaurante, id_sucursal, id_venta_principal, mesas, id_mesero } = req.body;
      if (!id_restaurante || !id_sucursal || !Array.isArray(mesas) || mesas.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Se requieren id_restaurante, id_sucursal y al menos dos mesas libres para crear un grupo.'
        });
      }
      if (!id_mesero) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Se requiere id_mesero para asignar el mesero responsable del grupo.'
        });
      }
      // Validar que todas las mesas estén libres
      // (esto puede reforzarse en el modelo, pero aquí se puede hacer una consulta rápida si se desea)
      try {
        const grupo = await GrupoMesaModel.crearGrupo({ id_restaurante, id_sucursal, id_venta_principal, mesas, id_mesero });
        return res.status(201).json({
          success: true,
          message: 'Grupo de mesas creado exitosamente.',
          grupo
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'CREATE_GROUP_ERROR',
          message: err.message
        });
      }
    } catch (error) {
      console.error('Error al crear grupo de mesas:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al crear grupo de mesas.',
        detail: error.message
      });
    }
  },

  // Agregar una mesa a un grupo existente
  async agregarMesa(req, res) {
    try {
      const { id } = req.params; // id_grupo_mesa
      const { id_mesa } = req.body;
      if (!id_mesa) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Se requiere id_mesa para agregar al grupo.'
        });
      }
      try {
        const resultado = await GrupoMesaModel.agregarMesaAGrupo(id, id_mesa);
        if (resultado && resultado.success === false) {
          return res.status(400).json({
            success: false,
            error: 'ADD_MESA_ERROR',
            message: resultado.message || 'No se pudo agregar la mesa al grupo.'
          });
        }
        return res.status(200).json({
          success: true,
          message: 'Mesa agregada al grupo exitosamente.'
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'ADD_MESA_ERROR',
          message: err.message
        });
      }
    } catch (error) {
      console.error('Error al agregar mesa a grupo:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al agregar mesa a grupo.',
        detail: error.message
      });
    }
  },

  // Remover una mesa de un grupo
  async removerMesa(req, res) {
    try {
      const { id, idMesa } = req.params; // id_grupo_mesa, id_mesa
      try {
        const resultado = await GrupoMesaModel.removerMesaDeGrupo(id, idMesa);
        if (resultado && resultado.success === false) {
          return res.status(400).json({
            success: false,
            error: 'REMOVE_MESA_ERROR',
            message: resultado.message || 'No se pudo remover la mesa del grupo.'
          });
        }
        return res.status(200).json({
          success: true,
          message: 'Mesa removida del grupo exitosamente.'
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'REMOVE_MESA_ERROR',
          message: err.message
        });
      }
    } catch (error) {
      console.error('Error al remover mesa de grupo:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al remover mesa de grupo.',
        detail: error.message
      });
    }
  },

  // Cerrar grupo de mesas
  async cerrarGrupo(req, res) {
    try {
      const { id } = req.params; // id_grupo_mesa
      try {
        const resultado = await GrupoMesaModel.cerrarGrupo(id);
        if (resultado && resultado.success === false) {
          return res.status(400).json({
            success: false,
            error: 'CLOSE_GROUP_ERROR',
            message: resultado.message || 'No se pudo cerrar el grupo de mesas.'
          });
        }
        return res.status(200).json({
          success: true,
          message: 'Grupo de mesas cerrado exitosamente.'
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'CLOSE_GROUP_ERROR',
          message: err.message
        });
      }
    } catch (error) {
      console.error('Error al cerrar grupo de mesas:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al cerrar grupo de mesas.',
        detail: error.message
      });
    }
  },

  // Listar grupos activos
  async listarGruposActivos(req, res) {
    try {
      const { id_restaurante } = req.query;
      if (!id_restaurante) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Se requiere id_restaurante para listar grupos activos.'
        });
      }
      const grupos = await GrupoMesaModel.obtenerGruposActivos(id_restaurante);
      return res.status(200).json({
        success: true,
        grupos
      });
    } catch (error) {
      console.error('Error al listar grupos activos:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al listar grupos activos.',
        detail: error.message
      });
    }
  },

  // Consultar grupo por mesa
  async grupoPorMesa(req, res) {
    try {
      const { idMesa } = req.params;
      const grupo = await GrupoMesaModel.obtenerGrupoPorMesa(idMesa);
      if (!grupo) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'No se encontró grupo activo para esta mesa.'
        });
      }
      return res.status(200).json({
        success: true,
        grupo
      });
    } catch (error) {
      console.error('Error al consultar grupo por mesa:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al consultar grupo por mesa.',
        detail: error.message
      });
    }
  },

  // Obtener información completa de un grupo
  async obtenerGrupoCompleto(req, res) {
    try {
      const { id } = req.params; // id_grupo_mesa
      const grupo = await GrupoMesaModel.obtenerGrupoCompleto(id);
      if (!grupo) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Grupo no encontrado.'
        });
      }
      return res.status(200).json({
        success: true,
        grupo
      });
    } catch (error) {
      console.error('Error al obtener grupo completo:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener grupo completo.',
        detail: error.message
      });
    }
  },

  // Obtener todos los grupos activos con información completa
  async listarGruposActivosCompletos(req, res) {
    try {
      const { id_restaurante } = req.query;
      if (!id_restaurante) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Se requiere id_restaurante para listar grupos activos completos.'
        });
      }
      const grupos = await GrupoMesaModel.obtenerGruposActivosCompletos(id_restaurante);
      return res.status(200).json({
        success: true,
        grupos
      });
    } catch (error) {
      console.error('Error al listar grupos activos completos:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al listar grupos activos completos.',
        detail: error.message
      });
    }
  },

  // Generar prefactura para un grupo completo
  async generarPrefacturaGrupo(req, res) {
    try {
      const { id } = req.params; // id_grupo_mesa
      const prefactura = await GrupoMesaModel.generarPrefacturaGrupo(id);
      if (!prefactura) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Grupo no encontrado o sin productos.'
        });
      }
      return res.status(200).json({
        success: true,
        prefactura
      });
    } catch (error) {
      console.error('Error al generar prefactura del grupo:', error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error al generar prefactura del grupo.',
        detail: error.message
      });
    }
  },

  // Disolver un grupo de mesas
  async disolverGrupo(req, res) {
      try {
        const { id } = req.params; // id_grupo_mesa
        const resultado = await GrupoMesaModel.disolverGrupo(id);
        if (resultado && resultado.success === false) {
          return res.status(400).json({
            success: false,
            error: 'DISSOLVE_GROUP_ERROR',
            message: resultado.message || 'No se pudo disolver el grupo de mesas.'
          });
        }
        return res.status(200).json({
          success: true,
          message: 'Grupo de mesas disuelto exitosamente.'
        });
      } catch (error) {
        console.error('Error al disolver grupo de mesas:', error);
        return res.status(500).json({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Error al disolver grupo de mesas.',
          detail: error.message
        });
      }
  }
};

module.exports = grupoMesaController;


