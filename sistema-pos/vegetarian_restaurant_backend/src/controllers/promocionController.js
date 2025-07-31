const PromocionModel = require('../models/promocionModel');
const logger = require('../config/logger');

exports.crearPromocion = async (req, res, next) => {
  try {
    const {
      nombre,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      id_producto,
      sucursales = [] // Array de IDs de sucursales
    } = req.body;

    const id_restaurante = req.user.id_restaurante;

    // Validaciones
    if (!nombre || !tipo || !valor || !fecha_inicio || !fecha_fin || !id_producto) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    if (!['porcentaje', 'monto_fijo', 'precio_fijo', 'x_uno_gratis', 'fijo'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de promoción no válido'
      });
    }

    if (valor < 0) {
      return res.status(400).json({
        success: false,
        message: 'El valor debe ser mayor o igual a 0'
      });
    }

    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }

    const promocion = await PromocionModel.crearPromocion({
      nombre,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      id_producto,
      id_restaurante,
      sucursales
    });

    logger.info('Promoción creada exitosamente', { id_promocion: promocion.id_promocion, id_restaurante });

    res.status(201).json({
      success: true,
      message: 'Promoción creada exitosamente',
      data: promocion
    });

  } catch (error) {
    logger.error('Error al crear promoción:', error);
    next(error);
  }
};

exports.getPromocionesActivas = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.query.id_sucursal ? parseInt(req.query.id_sucursal) : null;

    const promociones = await PromocionModel.getPromocionesActivas(id_restaurante, id_sucursal);

    logger.info('Promociones activas obtenidas', { 
      total: promociones.length, 
      id_restaurante, 
      id_sucursal 
    });

    res.status(200).json({
      success: true,
      message: 'Promociones activas obtenidas exitosamente',
      data: promociones
    });

  } catch (error) {
    logger.error('Error al obtener promociones activas:', error);
    next(error);
  }
};

exports.getTodasPromociones = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;

    const promociones = await PromocionModel.getTodasPromociones(id_restaurante);

    logger.info('Todas las promociones obtenidas', { 
      total: promociones.length, 
      id_restaurante
    });

    res.status(200).json({
      success: true,
      message: 'Promociones obtenidas exitosamente',
      data: promociones
    });

  } catch (error) {
    logger.error('Error al obtener todas las promociones:', error);
    next(error);
  }
};

exports.calcularDescuento = async (req, res, next) => {
  try {
    const { id_producto, precio_original } = req.body;
    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.body.id_sucursal ? parseInt(req.body.id_sucursal) : null;

    if (!id_producto || !precio_original) {
      return res.status(400).json({
        success: false,
        message: 'id_producto y precio_original son obligatorios'
      });
    }

    const descuento = await PromocionModel.calcularDescuento(
      id_producto, 
      precio_original, 
      id_restaurante, 
      id_sucursal
    );

    res.status(200).json({
      success: true,
      message: 'Descuento calculado exitosamente',
      data: descuento
    });

  } catch (error) {
    logger.error('Error al calcular descuento:', error);
    next(error);
  }
};

exports.aplicarDescuentosAProductos = async (req, res, next) => {
  try {
    const { productos } = req.body;
    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.body.id_sucursal ? parseInt(req.body.id_sucursal) : null;

    if (!productos || !Array.isArray(productos)) {
      return res.status(400).json({
        success: false,
        message: 'productos debe ser un array'
      });
    }

    const productosConDescuento = await PromocionModel.aplicarDescuentosAProductos(
      productos, 
      id_restaurante, 
      id_sucursal
    );

    res.status(200).json({
      success: true,
      message: 'Descuentos aplicados exitosamente',
      data: productosConDescuento
    });

  } catch (error) {
    logger.error('Error al aplicar descuentos a productos:', error);
    next(error);
  }
};

exports.actualizarPromocion = async (req, res, next) => {
  try {
    const { id_promocion } = req.params;
    const datosActualizados = req.body;
    const id_restaurante = req.user.id_restaurante;

    // Validar que la promoción existe y pertenece al restaurante
    const promociones = await PromocionModel.getTodasPromociones(id_restaurante);
    const promocionExiste = promociones.some(p => p.id_promocion === parseInt(id_promocion));

    if (!promocionExiste) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    const promocionActualizada = await PromocionModel.actualizarPromocion(
      parseInt(id_promocion), 
      datosActualizados, 
      id_restaurante
    );

    logger.info('Promoción actualizada exitosamente', { 
      id_promocion, 
      id_restaurante 
    });

    res.status(200).json({
      success: true,
      message: 'Promoción actualizada exitosamente',
      data: promocionActualizada
    });

  } catch (error) {
    logger.error('Error al actualizar promoción:', error);
    next(error);
  }
};

exports.eliminarPromocion = async (req, res, next) => {
  try {
    const { id_promocion } = req.params;
    const id_restaurante = req.user.id_restaurante;

    const promocionEliminada = await PromocionModel.eliminarPromocion(
      parseInt(id_promocion), 
      id_restaurante
    );

    logger.info('Promoción eliminada exitosamente', { 
      id_promocion, 
      id_restaurante 
    });

    res.status(200).json({
      success: true,
      message: 'Promoción eliminada exitosamente',
      data: promocionEliminada
    });

  } catch (error) {
    logger.error('Error al eliminar promoción:', error);
    next(error);
  }
};

exports.tienePromocionesActivas = async (req, res, next) => {
  try {
    const { id_producto } = req.params;
    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.query.id_sucursal ? parseInt(req.query.id_sucursal) : null;

    const tienePromociones = await PromocionModel.tienePromocionesActivas(
      parseInt(id_producto), 
      id_restaurante, 
      id_sucursal
    );

    res.status(200).json({
      success: true,
      message: 'Verificación completada',
      data: {
        id_producto: parseInt(id_producto),
        tiene_promociones: tienePromociones
      }
    });

  } catch (error) {
    logger.error('Error al verificar promociones activas:', error);
    next(error);
  }
};

exports.getSucursalesDisponibles = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;

    const sucursales = await PromocionModel.getSucursalesDisponibles(id_restaurante);

    res.status(200).json({
      success: true,
      message: 'Sucursales obtenidas exitosamente',
      data: sucursales
    });

  } catch (error) {
    logger.error('Error al obtener sucursales:', error);
    next(error);
  }
}; 