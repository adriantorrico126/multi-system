const ReservaModel = require('../models/reservaModel');
const logger = require('../config/logger');

// Crear una nueva reserva
exports.crearReserva = async (req, res, next) => {
  try {
    console.log('🔍 crearReserva Debug - req.body:', req.body);
    console.log('🔍 crearReserva Debug - req.user:', req.user);
    console.log('🔍 crearReserva Debug - req.headers:', req.headers);
    
    const {
      id_mesa,
      id_cliente,
      fecha_hora_inicio,
      fecha_hora_fin,
      numero_personas,
      observaciones,
      nombre_cliente,
      telefono_cliente,
      email_cliente
    } = req.body;

    const id_restaurante = req.user.id_restaurante;
    const id_sucursal = req.user.sucursal?.id || req.user.id_sucursal;
    const registrado_por = req.user.id;

    // Validaciones
    if (!id_mesa || !fecha_hora_inicio || !fecha_hora_fin || !numero_personas) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: id_mesa, fecha_hora_inicio, fecha_hora_fin, numero_personas'
      });
    }

    if (new Date(fecha_hora_inicio) >= new Date(fecha_hora_fin)) {
      return res.status(400).json({
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
    }

    // Validar que las fechas sean futuras
    const now = new Date();
    if (new Date(fecha_hora_inicio) <= now) {
      return res.status(400).json({
        message: 'La fecha de inicio debe ser futura'
      });
    }

    if (numero_personas <= 0) {
      return res.status(400).json({
        message: 'El número de personas debe ser mayor a 0'
      });
    }

    const reservaData = {
      id_mesa,
      id_cliente,
      id_restaurante,
      id_sucursal,
      registrado_por,
      fecha_hora_inicio: new Date(fecha_hora_inicio),
      fecha_hora_fin: new Date(fecha_hora_fin),
      numero_personas,
      observaciones,
      nombre_cliente,
      telefono_cliente,
      email_cliente
    };

    const reserva = await ReservaModel.crearReserva(reservaData);
    
    logger.info(`Reserva creada exitosamente: ${reserva.id_reserva} para mesa ${id_mesa}`);
    
    res.status(201).json({
      message: 'Reserva creada exitosamente',
      data: reserva
    });
  } catch (error) {
    logger.error('Error al crear reserva:', error);
    next(error);
  }
};

// Obtener todas las reservas de una sucursal
exports.getReservas = async (req, res, next) => {
  try {
    const id_sucursal = req.params.id_sucursal;
    const id_restaurante = req.user.id_restaurante;
    const fecha = req.query.fecha;

    if (!id_sucursal) {
      return res.status(400).json({ message: 'ID de sucursal es requerido' });
    }

    const reservas = await ReservaModel.getReservasBySucursal(id_sucursal, id_restaurante, fecha);
    res.status(200).json({ message: 'Reservas obtenidas exitosamente', data: reservas });
  } catch (error) {
    logger.error('Error al obtener reservas:', error);
    next(error);
  }
};

// Obtener todas las reservas del restaurante (nueva función)
exports.getReservasRestaurante = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const fecha = req.query.fecha;

    const reservas = await ReservaModel.getReservasByRestaurante(id_restaurante, fecha);
    res.status(200).json({ message: 'Reservas obtenidas exitosamente', data: reservas });
  } catch (error) {
    logger.error('Error al obtener reservas del restaurante:', error);
    next(error);
  }
};

// Obtener una reserva específica
exports.getReserva = async (req, res, next) => {
  try {
    const { id_reserva } = req.params;
    const id_restaurante = req.user.id_restaurante;

    if (!id_reserva) {
      return res.status(400).json({
        message: 'ID de reserva es requerido'
      });
    }

    const reserva = await ReservaModel.getReservaById(id_reserva, id_restaurante);
    
    if (!reserva) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      });
    }

    logger.info(`Reserva ${id_reserva} obtenida exitosamente`);
    
    res.status(200).json({
      message: 'Reserva obtenida exitosamente',
      data: reserva
    });
  } catch (error) {
    logger.error('Error al obtener reserva:', error);
    next(error);
  }
};

// Actualizar una reserva
exports.actualizarReserva = async (req, res, next) => {
  try {
    const { id_reserva } = req.params;
    const id_restaurante = req.user.id_restaurante;
    const datosActualizados = req.body;

    if (!id_reserva) {
      return res.status(400).json({
        message: 'ID de reserva es requerido'
      });
    }

    // Validar fechas si se están actualizando
    if (datosActualizados.fecha_hora_inicio && datosActualizados.fecha_hora_fin) {
      if (new Date(datosActualizados.fecha_hora_inicio) >= new Date(datosActualizados.fecha_hora_fin)) {
        return res.status(400).json({
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
      }
    }

    const reserva = await ReservaModel.actualizarReserva(id_reserva, id_restaurante, datosActualizados);
    
    logger.info(`Reserva ${id_reserva} actualizada exitosamente`);
    
    res.status(200).json({
      message: 'Reserva actualizada exitosamente',
      data: reserva
    });
  } catch (error) {
    logger.error('Error al actualizar reserva:', error);
    next(error);
  }
};

// Cancelar una reserva
exports.cancelarReserva = async (req, res, next) => {
  try {
    const { id_reserva } = req.params;
    const { motivo } = req.body;
    const id_restaurante = req.user.id_restaurante;

    if (!id_reserva) {
      return res.status(400).json({
        message: 'ID de reserva es requerido'
      });
    }

    const reserva = await ReservaModel.cancelarReserva(id_reserva, id_restaurante, motivo);
    
    if (!reserva) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      });
    }

    logger.info(`Reserva ${id_reserva} cancelada exitosamente`);
    
    res.status(200).json({
      message: 'Reserva cancelada exitosamente',
      data: reserva
    });
  } catch (error) {
    logger.error('Error al cancelar reserva:', error);
    next(error);
  }
};

// Eliminar una reserva
exports.eliminarReserva = async (req, res, next) => {
  try {
    const { id_reserva } = req.params;
    const id_restaurante = req.user.id_restaurante;

    if (!id_reserva) {
      return res.status(400).json({
        message: 'ID de reserva es requerido'
      });
    }

    const reserva = await ReservaModel.eliminarReserva(id_reserva, id_restaurante);
    
    if (!reserva) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      });
    }

    logger.info(`Reserva ${id_reserva} eliminada exitosamente`);
    
    res.status(200).json({
      message: 'Reserva eliminada exitosamente',
      data: reserva
    });
  } catch (error) {
    logger.error('Error al eliminar reserva:', error);
    next(error);
  }
};

// Obtener disponibilidad de mesas
exports.getDisponibilidadMesas = async (req, res, next) => {
  try {
    const { id_sucursal } = req.params;
    const { fecha_hora_inicio, fecha_hora_fin } = req.query;
    const id_restaurante = req.user.id_restaurante;

    if (!id_sucursal || !fecha_hora_inicio || !fecha_hora_fin) {
      return res.status(400).json({
        message: 'Faltan parámetros requeridos: id_sucursal, fecha_hora_inicio, fecha_hora_fin'
      });
    }

    const disponibilidad = await ReservaModel.getDisponibilidadMesas(
      id_sucursal, 
      id_restaurante, 
      new Date(fecha_hora_inicio), 
      new Date(fecha_hora_fin)
    );
    
    logger.info(`Disponibilidad de mesas obtenida para sucursal ${id_sucursal}`);
    
    res.status(200).json({
      message: 'Disponibilidad obtenida exitosamente',
      data: disponibilidad
    });
  } catch (error) {
    logger.error('Error al obtener disponibilidad:', error);
    next(error);
  }
};

// Obtener estadísticas de reservas
exports.getEstadisticasReservas = async (req, res, next) => {
  try {
    const { id_sucursal } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;
    const id_restaurante = req.user.id_restaurante;

    if (!id_sucursal || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        message: 'Faltan parámetros requeridos: id_sucursal, fecha_inicio, fecha_fin'
      });
    }

    const estadisticas = await ReservaModel.getEstadisticasReservas(
      id_sucursal,
      id_restaurante,
      new Date(fecha_inicio),
      new Date(fecha_fin)
    );
    
    logger.info(`Estadísticas de reservas obtenidas para sucursal ${id_sucursal}`);
    
    res.status(200).json({
      message: 'Estadísticas obtenidas exitosamente',
      data: estadisticas
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas:', error);
    next(error);
  }
}; 

// Obtener reservas por mesa
exports.getReservasByMesa = async (req, res, next) => {
  try {
    const { id_mesa } = req.params;
    const id_restaurante = req.user.id_restaurante;

    if (!id_mesa) {
      return res.status(400).json({
        message: 'ID de mesa es requerido'
      });
    }

    const reservas = await ReservaModel.getReservasByMesa(id_mesa, id_restaurante);
    
    logger.info(`Reservas obtenidas exitosamente para mesa ${id_mesa}`);
    
    res.status(200).json({
      message: 'Reservas obtenidas exitosamente',
      data: reservas
    });
  } catch (error) {
    logger.error('Error al obtener reservas por mesa:', error);
    next(error);
  }
}; 

// Limpiar estados de mesas que no tienen reservas activas
exports.limpiarEstadosMesas = async (req, res, next) => {
  try {
    console.log('🔍 [limpiarEstadosMesas] Función llamada');
    console.log('🔍 [limpiarEstadosMesas] req.user:', req.user);
    
    const id_restaurante = req.user.id_restaurante;
    console.log('🔍 [limpiarEstadosMesas] id_restaurante:', id_restaurante);
    
    const mesasActualizadas = await ReservaModel.limpiarEstadosMesas(id_restaurante);
    console.log('🔍 [limpiarEstadosMesas] mesasActualizadas:', mesasActualizadas);
    
    logger.info(`Estados de mesas limpiados: ${mesasActualizadas} mesas actualizadas`);
    
    res.status(200).json({
      message: 'Estados de mesas limpiados exitosamente',
      data: { mesasActualizadas }
    });
  } catch (error) {
    console.error('🔍 [limpiarEstadosMesas] Error:', error);
    logger.error('Error al limpiar estados de mesas:', error);
    next(error);
  }
}; 