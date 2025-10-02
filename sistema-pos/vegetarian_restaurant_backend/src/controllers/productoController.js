const Producto = require('../models/productoModel');
const PromocionModel = require('../models/promocionModel');
const { validationResult } = require('express-validator');
const logger = require('../config/logger'); // Importar el logger

exports.getAllProductos = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    const id_sucursal = req.query.id_sucursal ? parseInt(req.query.id_sucursal) : null;
    const includeInactive = req.query.includeInactive === 'true';
    const aplicarDescuentos = req.query.aplicarDescuentos === 'true';
    
    console.log('🔍 Backend: getAllProductos called with:', { id_restaurante, id_sucursal, includeInactive, aplicarDescuentos });
    
    let productos;
    if (includeInactive) {
      productos = await Producto.getAllProductosWithInactive(id_restaurante, id_sucursal);
    } else {
      productos = await Producto.getAllProductos(id_restaurante, id_sucursal);
    }
    
    console.log('🔍 Backend: Productos obtenidos:', productos.length);
    console.log('🔍 Backend: Primeros productos:', productos.slice(0, 3).map(p => ({
      id: p.id_producto,
      nombre: p.nombre,
      stock: p.stock_actual
    })));
    
    // Aplicar descuentos si se solicita
    if (aplicarDescuentos) {
      try {
        productos = await PromocionModel.aplicarDescuentosAProductos(productos, id_restaurante, id_sucursal);
      } catch (error) {
        logger.warn('Error aplicando descuentos a productos:', error);
        // Continuar sin descuentos si hay error
      }
    }
    
    logger.info('Productos obtenidos exitosamente.', { id_restaurante, id_sucursal, includeInactive, aplicarDescuentos });
    res.status(200).json({
      message: 'Productos obtenidos exitosamente.',
      data: productos
    });
  } catch (error) {
    console.error('❌ Backend: Error al obtener productos:', error);
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    const producto = await Producto.createProducto({ nombre, precio, id_categoria, stock_actual, imagen_url, id_restaurante });

    logger.info('Producto creado exitosamente:', { id: producto.id_producto, nombre: producto.nombre, id_restaurante: producto.id_restaurante });
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    const producto = await Producto.updateProducto(id, id_restaurante, { nombre, precio, id_categoria, stock_actual, activo, imagen_url });

    if (!producto) {
      logger.warn(`Producto con ID ${id} no encontrado para actualizar en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ 
        message: 'Producto no encontrado.' 
      });
    }

    logger.info('Producto actualizado exitosamente:', { id: producto.id_producto, nombre: producto.nombre, id_restaurante: producto.id_restaurante });
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    const producto = await Producto.deleteProducto(id, id_restaurante);

    if (!producto) {
      logger.warn(`Producto con ID ${id} no encontrado para eliminar en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ 
        message: 'Producto no encontrado.' 
      });
    }

    logger.info(`Producto con ID ${id} eliminado exitosamente para el restaurante ${id_restaurante}.`);
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    logger.info('Backend: getInventorySummary called with user:', req.user);
    const inventory = await Producto.getInventorySummary(id_restaurante);
    logger.info('Backend: Resumen de inventario obtenido.', { id_restaurante });
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
    const { cantidad, tipo_movimiento, stock_anterior, stock_actual } = req.body;
    const id_vendedor = req.user.id; // Asumiendo que el id del usuario está en req.user.id
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    // Validar datos requeridos
    if (!cantidad || !tipo_movimiento) {
      logger.warn('Cantidad o tipo de movimiento faltante en updateProductStock.');
      return res.status(400).json({ message: 'Cantidad y tipo de movimiento son requeridos.' });
    }

    // Calcular la cantidad de cambio basada en el tipo de movimiento
    let cantidad_cambio = parseFloat(cantidad);
    if (tipo_movimiento === 'salida' || tipo_movimiento === 'ajuste_negativo') {
      cantidad_cambio = -Math.abs(cantidad_cambio); // Asegurar que sea negativo
    } else {
      cantidad_cambio = Math.abs(cantidad_cambio); // Asegurar que sea positivo
    }

    const result = await Producto.updateStock(id, cantidad_cambio, tipo_movimiento, id_vendedor, id_restaurante);

    logger.info('Stock actualizado y movimiento registrado exitosamente:', { 
      productId: id, 
      cantidad: cantidad, 
      cambio: cantidad_cambio, 
      tipo: tipo_movimiento, 
      id_restaurante 
    });
    
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
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado

    const history = await Producto.getStockMovementsHistory(id_restaurante, id_producto, startDate, endDate);
    logger.info('Historial de movimientos de stock obtenido exitosamente.', { productId: id_producto, id_restaurante });
    res.status(200).json({
      message: 'Historial de movimientos de stock obtenido exitosamente.',
      data: history
    });
  } catch (error) {
    logger.error('Error al obtener historial de movimientos de stock:', error);
    next(error);
  }
};