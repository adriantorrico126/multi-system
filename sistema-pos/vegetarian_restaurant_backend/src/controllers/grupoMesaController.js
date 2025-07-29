const GrupoMesaModel = require('../models/grupoMesaModel');

const grupoMesaController = {
  // Crear un nuevo grupo de mesas (unir varias mesas)
  async crearGrupo(req, res) {
    try {
      const { id_restaurante, id_sucursal, id_venta_principal, mesas, id_mesero } = req.body;
      if (!id_restaurante || !id_sucursal || !Array.isArray(mesas) || mesas.length < 2) {
        return res.status(400).json({ message: 'Se requieren id_restaurante, id_sucursal y al menos dos mesas.' });
      }
      if (!id_mesero) {
        return res.status(400).json({ message: 'Se requiere id_mesero para asignar el mesero responsable del grupo.' });
      }
      try {
        const grupo = await GrupoMesaModel.crearGrupo({ id_restaurante, id_sucursal, id_venta_principal, mesas, id_mesero });
        return res.status(201).json({ message: 'Grupo de mesas creado exitosamente.', grupo });
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    } catch (error) {
      console.error('Error al crear grupo de mesas:', error);
      return res.status(500).json({ message: 'Error al crear grupo de mesas.', error: error.message });
    }
  },

  // Agregar una mesa a un grupo existente
  async agregarMesa(req, res) {
    try {
      const { id } = req.params; // id_grupo_mesa
      const { id_mesa } = req.body;
      if (!id_mesa) {
        return res.status(400).json({ message: 'Se requiere id_mesa.' });
      }
      // Validar que la mesa esté libre y no agrupada
      // (puedes reforzar en el modelo si lo deseas)
      try {
        await GrupoMesaModel.agregarMesaAGrupo(id, id_mesa);
        return res.status(200).json({ message: 'Mesa agregada al grupo exitosamente.' });
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    } catch (error) {
      console.error('Error al agregar mesa a grupo:', error);
      return res.status(500).json({ message: 'Error al agregar mesa a grupo.', error: error.message });
    }
  },

  // Remover una mesa de un grupo
  async removerMesa(req, res) {
    try {
      const { id, idMesa } = req.params; // id_grupo_mesa, id_mesa
      try {
        await GrupoMesaModel.removerMesaDeGrupo(id, idMesa);
        return res.status(200).json({ message: 'Mesa removida del grupo exitosamente.' });
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    } catch (error) {
      console.error('Error al remover mesa de grupo:', error);
      return res.status(500).json({ message: 'Error al remover mesa de grupo.', error: error.message });
    }
  },

  // Cerrar grupo de mesas
  async cerrarGrupo(req, res) {
    try {
      const { id } = req.params; // id_grupo_mesa
      try {
        await GrupoMesaModel.cerrarGrupo(id);
        return res.status(200).json({ message: 'Grupo de mesas cerrado exitosamente.' });
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }
    } catch (error) {
      console.error('Error al cerrar grupo de mesas:', error);
      return res.status(500).json({ message: 'Error al cerrar grupo de mesas.', error: error.message });
    }
  },

  // Listar grupos activos
  async listarGruposActivos(req, res) {
    try {
      const { id_restaurante } = req.query;
      if (!id_restaurante) {
        return res.status(400).json({ message: 'Se requiere id_restaurante.' });
      }
      const grupos = await GrupoMesaModel.obtenerGruposActivos(id_restaurante);
      return res.status(200).json({ grupos });
    } catch (error) {
      console.error('Error al listar grupos activos:', error);
      return res.status(500).json({ message: 'Error al listar grupos activos.', error: error.message });
    }
  },

  // Consultar grupo por mesa
  async grupoPorMesa(req, res) {
    try {
      const { idMesa } = req.params;
      const grupo = await GrupoMesaModel.obtenerGrupoPorMesa(idMesa);
      if (!grupo) {
        return res.status(404).json({ message: 'No se encontró grupo activo para esta mesa.' });
      }
      return res.status(200).json({ grupo });
    } catch (error) {
      console.error('Error al consultar grupo por mesa:', error);
      return res.status(500).json({ message: 'Error al consultar grupo por mesa.', error: error.message });
    }
  },

  // Obtener información completa de un grupo
  async obtenerGrupoCompleto(req, res) {
    try {
      const { id } = req.params; // id_grupo_mesa
      const grupo = await GrupoMesaModel.obtenerGrupoCompleto(id);
      if (!grupo) {
        return res.status(404).json({ message: 'Grupo no encontrado.' });
      }
      return res.status(200).json({ grupo });
    } catch (error) {
      console.error('Error al obtener grupo completo:', error);
      return res.status(500).json({ message: 'Error al obtener grupo completo.', error: error.message });
    }
  },

  // Obtener todos los grupos activos con información completa
  async listarGruposActivosCompletos(req, res) {
    try {
      const { id_restaurante } = req.query;
      if (!id_restaurante) {
        return res.status(400).json({ message: 'Se requiere id_restaurante.' });
      }
      const grupos = await GrupoMesaModel.obtenerGruposActivosCompletos(id_restaurante);
      return res.status(200).json({ grupos });
    } catch (error) {
      console.error('Error al listar grupos activos completos:', error);
      return res.status(500).json({ message: 'Error al listar grupos activos completos.', error: error.message });
    }
  },

  // Generar prefactura para un grupo completo
  async generarPrefacturaGrupo(req, res) {
    try {
      const { id } = req.params; // id_grupo_mesa
      const prefactura = await GrupoMesaModel.generarPrefacturaGrupo(id);
      if (!prefactura) {
        return res.status(404).json({ message: 'Grupo no encontrado o sin productos.' });
      }
      return res.status(200).json({ prefactura });
    } catch (error) {
      console.error('Error al generar prefactura del grupo:', error);
      return res.status(500).json({ message: 'Error al generar prefactura del grupo.', error: error.message });
    }
  }
};

module.exports = grupoMesaController; 