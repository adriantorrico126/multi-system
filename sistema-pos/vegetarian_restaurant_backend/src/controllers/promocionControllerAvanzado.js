const PromocionModelAvanzado = require('../models/promocionModelAvanzado');
const logger = require('../config/logger');

// Crear promoción avanzada
exports.crearPromocionAvanzada = async (req, res, next) => {
  try {
    const {
      nombre,
      descripcion,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      aplicar_horarios,
      id_producto,
      limite_usos,
      limite_usos_por_cliente,
      monto_minimo,
      monto_maximo,
      productos_minimos,
      productos_maximos,
      sucursales,
      aplicar_todas_sucursales,
      activa,
      destacada,
      requiere_codigo,
      codigo_promocion,
      objetivo_ventas,
      objetivo_ingresos,
      categoria_objetivo,
      segmento_cliente
    } = req.body;

    const id_restaurante = req.user.id_restaurante;

    // Validaciones básicas
    if (!nombre || !tipo || !valor || !fecha_inicio || !fecha_fin || !id_producto) {
      return res.status(400).json({
        success: false,
        message: 'Campos obligatorios: nombre, tipo, valor, fecha_inicio, fecha_fin, id_producto'
      });
    }

    if (!['porcentaje', 'monto_fijo', 'precio_fijo', 'x_uno_gratis', 'combo'].includes(tipo)) {
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

    if (aplicar_horarios && hora_inicio >= hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    if (requiere_codigo && !codigo_promocion) {
      // Se generará automáticamente en el modelo
    }

    const promocionData = {
      nombre,
      descripcion,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      hora_inicio: hora_inicio || '00:00:00',
      hora_fin: hora_fin || '23:59:59',
      aplicar_horarios: aplicar_horarios || false,
      id_producto,
      id_restaurante,
      limite_usos: limite_usos || 0,
      limite_usos_por_cliente: limite_usos_por_cliente || 0,
      monto_minimo: monto_minimo || 0,
      monto_maximo: monto_maximo || 0,
      productos_minimos: productos_minimos || 0,
      productos_maximos: productos_maximos || 0,
      sucursales: sucursales || [],
      aplicar_todas_sucursales: aplicar_todas_sucursales !== false,
      activa: activa !== false,
      destacada: destacada || false,
      requiere_codigo: requiere_codigo || false,
      codigo_promocion,
      objetivo_ventas: objetivo_ventas || 0,
      objetivo_ingresos: objetivo_ingresos || 0,
      categoria_objetivo,
      segmento_cliente: segmento_cliente || 'todos'
    };

    const promocion = await PromocionModelAvanzado.crearPromocionAvanzada(promocionData);

    logger.info('Promoción avanzada creada exitosamente', { 
      id_promocion: promocion.id_promocion, 
      nombre,
      id_restaurante 
    });

    res.status(201).json({
      success: true,
      message: 'Promoción avanzada creada exitosamente',
      data: promocion
    });

  } catch (error) {
    logger.error('Error al crear promoción avanzada:', error);
    next(error);
  }
};

// Obtener promociones activas avanzadas
exports.getPromocionesActivasAvanzadas = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.query.id_sucursal ? parseInt(req.query.id_sucursal) : null;

    const promociones = await PromocionModelAvanzado.getPromocionesActivasAvanzadas(id_restaurante, id_sucursal);

    logger.info('Promociones activas avanzadas obtenidas', { 
      total: promociones.length, 
      id_restaurante, 
      id_sucursal 
    });

    res.status(200).json({
      success: true,
      message: 'Promociones activas avanzadas obtenidas exitosamente',
      data: promociones
    });

  } catch (error) {
    logger.error('Error al obtener promociones activas avanzadas:', error);
    next(error);
  }
};

// Verificar si una promoción es válida
exports.verificarPromocionValida = async (req, res, next) => {
  try {
    const { id_promocion } = req.params;
    const id_sucursal = req.query.id_sucursal ? parseInt(req.query.id_sucursal) : null;

    const esValida = await PromocionModelAvanzado.verificarPromocionValida(id_promocion, id_sucursal);

    res.status(200).json({
      success: true,
      message: 'Verificación de promoción completada',
      data: {
        id_promocion: parseInt(id_promocion),
        es_valida: esValida
      }
    });

  } catch (error) {
    logger.error('Error al verificar promoción válida:', error);
    next(error);
  }
};

// Registrar uso de promoción
exports.registrarUsoPromocion = async (req, res, next) => {
  try {
    const {
      id_promocion,
      id_venta,
      id_cliente,
      monto_descuento,
      monto_venta
    } = req.body;

    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.user.id_sucursal || req.body.id_sucursal;

    if (!id_promocion || !id_venta) {
      return res.status(400).json({
        success: false,
        message: 'id_promocion e id_venta son obligatorios'
      });
    }

    const usoData = {
      id_promocion,
      id_venta,
      id_cliente,
      id_sucursal,
      id_restaurante,
      monto_descuento: monto_descuento || 0,
      monto_venta: monto_venta || 0
    };

    const idUso = await PromocionModelAvanzado.registrarUsoPromocion(usoData);

    res.status(201).json({
      success: true,
      message: 'Uso de promoción registrado exitosamente',
      data: {
        id_uso: idUso,
        id_promocion,
        id_venta
      }
    });

  } catch (error) {
    logger.error('Error al registrar uso de promoción:', error);
    next(error);
  }
};

// Obtener analytics de promociones
exports.getAnalyticsPromociones = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const { fecha_inicio, fecha_fin } = req.query;

    const analytics = await PromocionModelAvanzado.getAnalyticsPromociones(
      id_restaurante, 
      fecha_inicio, 
      fecha_fin
    );

    res.status(200).json({
      success: true,
      message: 'Analytics de promociones obtenidos exitosamente',
      data: analytics
    });

  } catch (error) {
    logger.error('Error al obtener analytics de promociones:', error);
    next(error);
  }
};

// Obtener estadísticas de uso por promoción
exports.getEstadisticasUso = async (req, res, next) => {
  try {
    const { id_promocion } = req.params;

    const estadisticas = await PromocionModelAvanzado.getEstadisticasUso(id_promocion);

    if (!estadisticas) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Estadísticas de uso obtenidas exitosamente',
      data: estadisticas
    });

  } catch (error) {
    logger.error('Error al obtener estadísticas de uso:', error);
    next(error);
  }
};

// Actualizar promoción avanzada
exports.actualizarPromocionAvanzada = async (req, res, next) => {
  try {
    const { id_promocion } = req.params;
    const {
      nombre,
      descripcion,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      aplicar_horarios,
      id_producto,
      limite_usos,
      limite_usos_por_cliente,
      monto_minimo,
      monto_maximo,
      productos_minimos,
      productos_maximos,
      activa,
      destacada,
      requiere_codigo,
      codigo_promocion,
      objetivo_ventas,
      objetivo_ingresos,
      categoria_objetivo,
      segmento_cliente
    } = req.body;

    // Validaciones básicas
    if (valor !== undefined && valor < 0) {
      return res.status(400).json({
        success: false,
        message: 'El valor debe ser mayor o igual a 0'
      });
    }

    if (fecha_inicio && fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }

    if (aplicar_horarios && hora_inicio && hora_fin && hora_inicio >= hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'La hora de fin debe ser posterior a la hora de inicio'
      });
    }

    const promocionData = {
      nombre,
      descripcion,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      aplicar_horarios,
      id_producto,
      limite_usos,
      limite_usos_por_cliente,
      monto_minimo,
      monto_maximo,
      productos_minimos,
      productos_maximos,
      activa,
      destacada,
      requiere_codigo,
      codigo_promocion,
      objetivo_ventas,
      objetivo_ingresos,
      categoria_objetivo,
      segmento_cliente
    };

    const promocion = await PromocionModelAvanzado.actualizarPromocionAvanzada(id_promocion, promocionData);

    res.status(200).json({
      success: true,
      message: 'Promoción avanzada actualizada exitosamente',
      data: promocion
    });

  } catch (error) {
    logger.error('Error al actualizar promoción avanzada:', error);
    next(error);
  }
};

// Obtener promoción por código
exports.getPromocionPorCodigo = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.query.id_sucursal ? parseInt(req.query.id_sucursal) : null;

    const promocion = await PromocionModelAvanzado.getPromocionPorCodigo(codigo, id_restaurante, id_sucursal);

    if (!promocion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada o no válida'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Promoción obtenida exitosamente',
      data: promocion
    });

  } catch (error) {
    logger.error('Error al obtener promoción por código:', error);
    next(error);
  }
};

// Obtener promociones destacadas
exports.getPromocionesDestacadas = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.query.id_sucursal ? parseInt(req.query.id_sucursal) : null;

    const promociones = await PromocionModelAvanzado.getPromocionesDestacadas(id_restaurante, id_sucursal);

    res.status(200).json({
      success: true,
      message: 'Promociones destacadas obtenidas exitosamente',
      data: promociones
    });

  } catch (error) {
    logger.error('Error al obtener promociones destacadas:', error);
    next(error);
  }
};

// Obtener promociones por segmento de cliente
exports.getPromocionesPorSegmento = async (req, res, next) => {
  try {
    const { segmento } = req.params;
    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.query.id_sucursal ? parseInt(req.query.id_sucursal) : null;

    if (!['todos', 'nuevos', 'recurrentes', 'vip'].includes(segmento)) {
      return res.status(400).json({
        success: false,
        message: 'Segmento de cliente no válido'
      });
    }

    const promociones = await PromocionModelAvanzado.getPromocionesPorSegmento(segmento, id_restaurante, id_sucursal);

    res.status(200).json({
      success: true,
      message: 'Promociones por segmento obtenidas exitosamente',
      data: promociones
    });

  } catch (error) {
    logger.error('Error al obtener promociones por segmento:', error);
    next(error);
  }
};

// Eliminar promoción avanzada
exports.eliminarPromocionAvanzada = async (req, res, next) => {
  try {
    const { id_promocion } = req.params;

    const promocion = await PromocionModelAvanzado.eliminarPromocionAvanzada(id_promocion);

    res.status(200).json({
      success: true,
      message: 'Promoción avanzada eliminada exitosamente',
      data: promocion
    });

  } catch (error) {
    logger.error('Error al eliminar promoción avanzada:', error);
    next(error);
  }
};
