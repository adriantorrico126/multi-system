const PensionadoModel = require('../models/pensionadoModel');
const ConsumoPensionadoModel = require('../models/consumoPensionadoModel');
const PrefacturaPensionadoModel = require('../models/prefacturaPensionadoModel');
const logger = require('../config/logger');

/**
 * Crear un nuevo pensionado
 */
const crearPensionado = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const created_by = req.user.id_usuario;
    
    const pensionadoData = {
      id_sucursal: req.body.id_sucursal,
      nombre_cliente: req.body.nombre_cliente,
      tipo_cliente: req.body.tipo_cliente || 'individual',
      documento_identidad: req.body.documento_identidad,
      telefono: req.body.telefono,
      email: req.body.email,
      direccion: req.body.direccion,
      fecha_inicio: req.body.fecha_inicio,
      fecha_fin: req.body.fecha_fin,
      tipo_periodo: req.body.tipo_periodo || 'semanas',
      cantidad_periodos: req.body.cantidad_periodos || 1,
      incluye_almuerzo: req.body.incluye_almuerzo !== undefined ? req.body.incluye_almuerzo : true,
      incluye_cena: req.body.incluye_cena !== undefined ? req.body.incluye_cena : false,
      incluye_desayuno: req.body.incluye_desayuno !== undefined ? req.body.incluye_desayuno : false,
      max_platos_dia: req.body.max_platos_dia || 1,
      descuento_aplicado: req.body.descuento_aplicado || 0.00
    };

    // Validaciones básicas
    if (!pensionadoData.nombre_cliente) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del cliente es obligatorio'
      });
    }

    if (!pensionadoData.fecha_inicio || !pensionadoData.fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas de inicio y fin son obligatorias'
      });
    }

    if (new Date(pensionadoData.fecha_fin) <= new Date(pensionadoData.fecha_inicio)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }

    const pensionado = await PensionadoModel.crear(pensionadoData, id_restaurante, created_by);

    logger.info(`✅ [PensionadoController] Pensionado creado: ${pensionado.id_pensionado} por usuario ${created_by}`);

    res.status(201).json({
      success: true,
      message: 'Pensionado creado exitosamente',
      data: pensionado
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al crear pensionado:`, error);
    next(error);
  }
};

/**
 * Obtener todos los pensionados
 */
const obtenerPensionados = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    
    const filtros = {
      estado: req.query.estado,
      tipo_cliente: req.query.tipo_cliente,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    // Limpiar filtros undefined
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === undefined) {
        delete filtros[key];
      }
    });

    const pensionados = await PensionadoModel.obtenerTodos(id_restaurante, filtros);

    res.json({
      success: true,
      message: 'Pensionados obtenidos exitosamente',
      data: pensionados
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al obtener pensionados:`, error);
    next(error);
  }
};

/**
 * Obtener un pensionado por ID
 */
const obtenerPensionadoPorId = async (req, res, next) => {
  try {
    const id_pensionado = parseInt(req.params.id);
    const id_restaurante = req.user.id_restaurante;

    const pensionado = await PensionadoModel.obtenerPorId(id_pensionado, id_restaurante);

    if (!pensionado) {
      return res.status(404).json({
        success: false,
        message: 'Pensionado no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Pensionado obtenido exitosamente',
      data: pensionado
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al obtener pensionado:`, error);
    next(error);
  }
};

/**
 * Actualizar un pensionado
 */
const actualizarPensionado = async (req, res, next) => {
  try {
    const id_pensionado = parseInt(req.params.id);
    const id_restaurante = req.user.id_restaurante;

    const datosActualizacion = {
      nombre_cliente: req.body.nombre_cliente,
      tipo_cliente: req.body.tipo_cliente,
      documento_identidad: req.body.documento_identidad,
      telefono: req.body.telefono,
      email: req.body.email,
      direccion: req.body.direccion,
      fecha_inicio: req.body.fecha_inicio,
      fecha_fin: req.body.fecha_fin,
      tipo_periodo: req.body.tipo_periodo,
      cantidad_periodos: req.body.cantidad_periodos,
      incluye_almuerzo: req.body.incluye_almuerzo,
      incluye_cena: req.body.incluye_cena,
      incluye_desayuno: req.body.incluye_desayuno,
      max_platos_dia: req.body.max_platos_dia,
      descuento_aplicado: req.body.descuento_aplicado,
      estado: req.body.estado
    };

    // Limpiar campos undefined
    Object.keys(datosActualizacion).forEach(key => {
      if (datosActualizacion[key] === undefined) {
        delete datosActualizacion[key];
      }
    });

    const pensionado = await PensionadoModel.actualizar(id_pensionado, id_restaurante, datosActualizacion);

    logger.info(`✅ [PensionadoController] Pensionado actualizado: ${id_pensionado}`);

    res.json({
      success: true,
      message: 'Pensionado actualizado exitosamente',
      data: pensionado
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al actualizar pensionado:`, error);
    next(error);
  }
};

/**
 * Eliminar un pensionado (soft delete)
 */
const eliminarPensionado = async (req, res, next) => {
  try {
    const id_pensionado = parseInt(req.params.id);
    const id_restaurante = req.user.id_restaurante;

    const pensionado = await PensionadoModel.eliminar(id_pensionado, id_restaurante);

    logger.info(`✅ [PensionadoController] Pensionado eliminado: ${id_pensionado}`);

    res.json({
      success: true,
      message: 'Pensionado eliminado exitosamente',
      data: pensionado
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al eliminar pensionado:`, error);
    next(error);
  }
};

/**
 * Obtener estadísticas de un pensionado
 */
const obtenerEstadisticasPensionado = async (req, res, next) => {
  try {
    const id_pensionado = parseInt(req.params.id);
    const id_restaurante = req.user.id_restaurante;

    const estadisticas = await PensionadoModel.obtenerEstadisticas(id_pensionado, id_restaurante);

    res.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: estadisticas
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al obtener estadísticas:`, error);
    next(error);
  }
};

/**
 * Obtener pensionados activos para una fecha
 */
const obtenerPensionadosActivos = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const pensionados = await PensionadoModel.obtenerActivosPorFecha(id_restaurante, fecha);

    res.json({
      success: true,
      message: 'Pensionados activos obtenidos exitosamente',
      data: pensionados
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al obtener pensionados activos:`, error);
    next(error);
  }
};

/**
 * Verificar si un pensionado puede consumir
 */
const verificarConsumo = async (req, res, next) => {
  try {
    const id_pensionado = parseInt(req.params.id);
    const id_restaurante = req.user.id_restaurante;
    const { fecha_consumo, tipo_comida } = req.body;

    if (!fecha_consumo || !tipo_comida) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de consumo y tipo de comida son obligatorios'
      });
    }

    const verificacion = await PensionadoModel.puedeConsumir(
      id_pensionado, 
      id_restaurante, 
      fecha_consumo, 
      tipo_comida
    );

    res.json({
      success: true,
      message: 'Verificación completada',
      data: verificacion
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al verificar consumo:`, error);
    next(error);
  }
};

/**
 * Registrar consumo de pensionado
 */
const registrarConsumo = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const mesero_asignado = req.user.id_usuario;

    const consumoData = {
      id_pensionado: req.body.id_pensionado,
      fecha_consumo: req.body.fecha_consumo,
      id_mesa: req.body.id_mesa,
      id_venta: req.body.id_venta,
      tipo_comida: req.body.tipo_comida || 'almuerzo',
      productos_consumidos: req.body.productos_consumidos || [],
      total_consumido: req.body.total_consumido || 0.00,
      observaciones: req.body.observaciones,
      mesero_asignado
    };

    // Validaciones básicas
    if (!consumoData.id_pensionado || !consumoData.fecha_consumo) {
      return res.status(400).json({
        success: false,
        message: 'ID de pensionado y fecha de consumo son obligatorios'
      });
    }

    const consumo = await ConsumoPensionadoModel.registrar(consumoData, id_restaurante);

    logger.info(`✅ [PensionadoController] Consumo registrado para pensionado ${consumoData.id_pensionado}`);

    res.status(201).json({
      success: true,
      message: 'Consumo registrado exitosamente',
      data: consumo
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al registrar consumo:`, error);
    next(error);
  }
};

/**
 * Obtener consumos de un pensionado
 */
const obtenerConsumos = async (req, res, next) => {
  try {
    const id_pensionado = parseInt(req.params.id);
    const id_restaurante = req.user.id_restaurante;
    const fecha_desde = req.query.fecha_desde;
    const fecha_hasta = req.query.fecha_hasta;

    const consumos = await ConsumoPensionadoModel.obtenerPorPensionado(
      id_pensionado, 
      id_restaurante, 
      fecha_desde, 
      fecha_hasta
    );

    res.json({
      success: true,
      message: 'Consumos obtenidos exitosamente',
      data: consumos
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al obtener consumos:`, error);
    next(error);
  }
};

/**
 * Generar prefactura consolidada
 */
const generarPrefactura = async (req, res, next) => {
  try {
    const id_pensionado = parseInt(req.params.id);
    const id_restaurante = req.user.id_restaurante;
    const { fecha_inicio_periodo, fecha_fin_periodo, observaciones } = req.body;

    if (!fecha_inicio_periodo || !fecha_fin_periodo) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas de inicio y fin del período son obligatorias'
      });
    }

    const prefactura = await PrefacturaPensionadoModel.generar(
      id_pensionado,
      id_restaurante,
      fecha_inicio_periodo,
      fecha_fin_periodo,
      observaciones
    );

    logger.info(`✅ [PensionadoController] Prefactura generada para pensionado ${id_pensionado}`);

    res.status(201).json({
      success: true,
      message: 'Prefactura generada exitosamente',
      data: prefactura
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al generar prefactura:`, error);
    next(error);
  }
};

/**
 * Obtener prefacturas de un pensionado
 */
const obtenerPrefacturas = async (req, res, next) => {
  try {
    const id_pensionado = parseInt(req.params.id);
    const id_restaurante = req.user.id_restaurante;

    const filtros = {
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta
    };

    // Limpiar filtros undefined
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === undefined) {
        delete filtros[key];
      }
    });

    const prefacturas = await PrefacturaPensionadoModel.obtenerPorPensionado(
      id_pensionado, 
      id_restaurante, 
      filtros
    );

    res.json({
      success: true,
      message: 'Prefacturas obtenidas exitosamente',
      data: prefacturas
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al obtener prefacturas:`, error);
    next(error);
  }
};

/**
 * Obtener estadísticas generales
 */
const obtenerEstadisticasGenerales = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const fecha_desde = req.query.fecha_desde || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const fecha_hasta = req.query.fecha_hasta || new Date().toISOString().split('T')[0];

    const estadisticas = await ConsumoPensionadoModel.obtenerEstadisticasGenerales(
      id_restaurante, 
      fecha_desde, 
      fecha_hasta
    );

    res.json({
      success: true,
      message: 'Estadísticas generales obtenidas exitosamente',
      data: estadisticas
    });

  } catch (error) {
    logger.error(`❌ [PensionadoController] Error al obtener estadísticas generales:`, error);
    next(error);
  }
};

module.exports = {
  crearPensionado,
  obtenerPensionados,
  obtenerPensionadoPorId,
  actualizarPensionado,
  eliminarPensionado,
  obtenerEstadisticasPensionado,
  obtenerPensionadosActivos,
  verificarConsumo,
  registrarConsumo,
  obtenerConsumos,
  generarPrefactura,
  obtenerPrefacturas,
  obtenerEstadisticasGenerales
};
