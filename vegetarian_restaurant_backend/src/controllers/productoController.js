const Producto = require('../models/productoModel');
const { validationResult } = require('express-validator');
const logger = require('../config/logger'); // Importar el logger

exports.getAllProductos = async (req, res, next) => {
  try {
    const productos = await Producto.getAllProductos();
    logger.info('Productos obtenidos exitosamente.');
    res.status(200).json({
      message: 'Productos obtenidos exitosamente.',
      data: productos
    });
  } catch (error) {
    logger.error('Error al obtener productos:', error);
    next(error);
  }
};

exports.createProducto = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación al crear producto:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nombre, precio, id_categoria, stock_actual, imagen_url } = req.body;
    const producto = await Producto.createProducto({ nombre, precio, id_categoria, stock_actual, imagen_url });

    logger.info('Producto creado exitosamente:', { id: producto.id_producto, nombre: producto.nombre });
    res.status(201).json({
      message: 'Producto creado exitosamente.',
      data: producto
    });

  } catch (error) {
    logger.error('Error al crear producto:', error);
    next(error);
  }
};

exports.updateProducto = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación al actualizar producto:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { nombre, precio, id_categoria, stock_actual, activo, imagen_url } = req.body;

    const producto = await Producto.updateProducto(id, { nombre, precio, id_categoria, stock_actual, activo, imagen_url });

    if (!producto) {
      logger.warn(`Producto con ID ${id} no encontrado para actualizar.`);
      return res.status(404).json({ 
        message: 'Producto no encontrado.' 
      });
    }

    logger.info('Producto actualizado exitosamente:', { id: producto.id_producto, nombre: producto.nombre });
    res.status(200).json({
      message: 'Producto actualizado exitosamente.',
      data: producto
    });

  } catch (error) {
    logger.error('Error al actualizar producto:', error);
    next(error);
  }
};

exports.deleteProducto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const producto = await Producto.deleteProducto(id);

    if (!producto) {
      logger.warn(`Producto con ID ${id} no encontrado para eliminar.`);
      return res.status(404).json({ 
        message: 'Producto no encontrado.' 
      });
    }

    logger.info(`Producto con ID ${id} eliminado exitosamente.`);
    res.status(200).json({
      message: 'Producto eliminado exitosamente.'
    });

  } catch (error) {
    logger.error('Error al eliminar producto:', error);
    next(error);
  }
};

// Nuevas funciones para inventario
exports.getInventorySummary = async (req, res, next) => {
  try {
    logger.info('Backend: getInventorySummary called with user:', req.user);
    const inventory = await Producto.getInventorySummary();
    logger.info('Backend: Resumen de inventario obtenido.');
    res.status(200).json({
      message: 'Resumen de inventario obtenido exitosamente.',
      data: inventory
    });
  } catch (error) {
    logger.error('Error al obtener resumen de inventario:', error);
    next(error);
  }
};

exports.updateProductStock = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación al actualizar stock:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { cantidad_cambio, tipo_movimiento } = req.body;
    const id_vendedor = req.user.id; // Asumiendo que el id del usuario está en req.user.id

    // La validación de express-validator ya cubre esto, pero se mantiene como fallback
    if (!cantidad_cambio || !tipo_movimiento) {
      logger.warn('Cantidad de cambio o tipo de movimiento faltante en updateProductStock.');
      return res.status(400).json({ message: 'Cantidad de cambio y tipo de movimiento son requeridos.' });
    }

    const result = await Producto.updateStock(id, cantidad_cambio, tipo_movimiento, id_vendedor);

    logger.info('Stock actualizado y movimiento registrado exitosamente:', { productId: id, change: cantidad_cambio, type: tipo_movimiento });
    res.status(200).json({
      message: 'Stock actualizado y movimiento registrado exitosamente.',
      data: result
    });
  } catch (error) {
    logger.error('Error al actualizar stock:', error);
    next(error);
  }
};

exports.getStockMovementsHistory = async (req, res, next) => {
  try {
    const { id_producto, startDate, endDate } = req.query;
    const history = await Producto.getStockMovementsHistory(id_producto, startDate, endDate);
    logger.info('Historial de movimientos de stock obtenido exitosamente.', { productId: id_producto });
    res.status(200).json({
      message: 'Historial de movimientos de stock obtenido exitosamente.',
      data: history
    });
  } catch (error) {
    logger.error('Error al obtener historial de movimientos de stock:', error);
    next(error);
  }
};