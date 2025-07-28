const ModificadorModel = require('../models/modificadorModel');

const modificadorController = {
  // Listar modificadores de un producto
  async listarPorProducto(req, res) {
    try {
      const { id_producto } = req.params;
      const modificadores = await ModificadorModel.listarPorProducto(id_producto);
      res.status(200).json({ modificadores });
    } catch (error) {
      res.status(500).json({ message: 'Error al listar modificadores.', error: error.message });
    }
  },

  // Crear modificador para un producto
  async crear(req, res) {
    try {
      const { id_producto, nombre_modificador, precio_extra, tipo_modificador } = req.body;
      if (!id_producto || !nombre_modificador || !tipo_modificador) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
      }
      const modificador = await ModificadorModel.crear({ id_producto, nombre_modificador, precio_extra, tipo_modificador });
      res.status(201).json({ modificador });
    } catch (error) {
      res.status(500).json({ message: 'Error al crear modificador.', error: error.message });
    }
  },

  // Asociar modificadores a un detalle de venta
  async asociarAMovimiento(req, res) {
    try {
      const { id_detalle_venta } = req.params;
      const { id_modificadores } = req.body; // array de ids
      if (!Array.isArray(id_modificadores) || id_modificadores.length === 0) {
        return res.status(400).json({ message: 'Se requiere un array de id_modificadores.' });
      }
      await ModificadorModel.asociarAMovimiento(id_detalle_venta, id_modificadores);
      res.status(200).json({ message: 'Modificadores asociados.' });
    } catch (error) {
      res.status(500).json({ message: 'Error al asociar modificadores.', error: error.message });
    }
  },

  // Listar modificadores de un detalle de venta
  async listarPorDetalleVenta(req, res) {
    try {
      const { id_detalle_venta } = req.params;
      const modificadores = await ModificadorModel.listarPorDetalleVenta(id_detalle_venta);
      res.status(200).json({ modificadores });
    } catch (error) {
      res.status(500).json({ message: 'Error al listar modificadores del detalle.', error: error.message });
    }
  }
};

module.exports = modificadorController; 