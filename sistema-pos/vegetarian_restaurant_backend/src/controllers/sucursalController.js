const Sucursal = require('../models/sucursalModel');
const logger = require('../config/logger'); // Importar el logger
const { pool } = require('../config/database');

exports.getAllSucursales = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante; // Obtener id_restaurante del usuario autenticado
    const sucursales = await Sucursal.findAll(id_restaurante);
    logger.info('Sucursales obtenidas exitosamente.', { count: sucursales.length, id_restaurante });
    res.status(200).json({
      message: sucursales.length > 0 ? 'Sucursales obtenidas exitosamente.' : 'No hay sucursales registradas.',
      count: sucursales.length,
      data: sucursales,
    });
  } catch (error) {
    logger.error('Error al obtener sucursales:', error);
    next(error);
  }
};

exports.createSucursal = async (req, res, next) => {
  try {
    const { nombre, ciudad, direccion } = req.body;
    const id_restaurante = req.user.id_restaurante;

    // Validaciones
    if (!nombre || !ciudad) {
      return res.status(400).json({ 
        message: 'Nombre y ciudad son campos obligatorios.' 
      });
    }

    // Verificar si el nombre ya existe
    const nombreExiste = await Sucursal.nombreExiste(nombre, id_restaurante);
    if (nombreExiste) {
      return res.status(400).json({ 
        message: `Ya existe una sucursal con el nombre "${nombre}".` 
      });
    }

    const nuevaSucursal = await Sucursal.create({
      nombre: nombre.trim(),
      ciudad: ciudad.trim(),
      direccion: direccion ? direccion.trim() : '',
      id_restaurante
    });

    logger.info('Sucursal creada exitosamente.', { 
      id_sucursal: nuevaSucursal.id_sucursal, 
      nombre: nuevaSucursal.nombre,
      id_restaurante 
    });

    res.status(201).json({
      message: `Sucursal "${nuevaSucursal.nombre}" creada exitosamente.`,
      data: nuevaSucursal
    });
  } catch (error) {
    logger.error('Error al crear sucursal:', error);
    next(error);
  }
};

exports.updateSucursal = async (req, res, next) => {
  try {
    const { id_sucursal } = req.params;
    const { nombre, ciudad, direccion, activo } = req.body;
    const id_restaurante = req.user.id_restaurante;

    // Validaciones
    if (!nombre || !ciudad) {
      return res.status(400).json({ 
        message: 'Nombre y ciudad son campos obligatorios.' 
      });
    }

    // Verificar si la sucursal existe
    const sucursalExistente = await Sucursal.findById(id_sucursal, id_restaurante);
    if (!sucursalExistente) {
      return res.status(404).json({ 
        message: 'Sucursal no encontrada.' 
      });
    }

    // Verificar si el nombre ya existe (excluyendo la sucursal actual)
    const nombreExiste = await Sucursal.nombreExiste(nombre, id_restaurante, id_sucursal);
    if (nombreExiste) {
      return res.status(400).json({ 
        message: `Ya existe una sucursal con el nombre "${nombre}".` 
      });
    }

    const sucursalActualizada = await Sucursal.update(id_sucursal, {
      nombre: nombre.trim(),
      ciudad: ciudad.trim(),
      direccion: direccion ? direccion.trim() : '',
      activo: activo !== undefined ? activo : true
    }, id_restaurante);

    logger.info('Sucursal actualizada exitosamente.', { 
      id_sucursal, 
      nombre: sucursalActualizada.nombre,
      id_restaurante 
    });

    res.status(200).json({
      message: `Sucursal "${sucursalActualizada.nombre}" actualizada exitosamente.`,
      data: sucursalActualizada
    });
  } catch (error) {
    logger.error('Error al actualizar sucursal:', error);
    next(error);
  }
};

exports.deleteSucursal = async (req, res, next) => {
  try {
    const { id_sucursal } = req.params;
    const id_restaurante = req.user.id_restaurante;

    // Verificar si la sucursal existe
    const sucursalExistente = await Sucursal.findById(id_sucursal, id_restaurante);
    if (!sucursalExistente) {
      return res.status(404).json({ 
        message: 'Sucursal no encontrada.' 
      });
    }

    // Verificar si hay usuarios asignados a esta sucursal
    const usuariosResult = await pool.query(
      'SELECT COUNT(*) FROM vendedores WHERE id_sucursal = $1 AND id_restaurante = $2 AND activo = true',
      [id_sucursal, id_restaurante]
    );
    
    if (parseInt(usuariosResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la sucursal porque tiene usuarios asignados. Reasigne los usuarios primero.' 
      });
    }

    // Verificar si hay mesas en esta sucursal
    const mesasResult = await pool.query(
      'SELECT COUNT(*) FROM mesas WHERE id_sucursal = $1 AND id_restaurante = $2',
      [id_sucursal, id_restaurante]
    );
    
    if (parseInt(mesasResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la sucursal porque tiene mesas asignadas. Elimine las mesas primero.' 
      });
    }

    const sucursalEliminada = await Sucursal.delete(id_sucursal, id_restaurante);

    logger.info('Sucursal eliminada exitosamente.', { 
      id_sucursal, 
      nombre: sucursalExistente.nombre,
      id_restaurante 
    });

    res.status(200).json({
      message: `Sucursal "${sucursalExistente.nombre}" eliminada exitosamente.`,
      data: { id_sucursal: sucursalEliminada.id_sucursal }
    });
  } catch (error) {
    logger.error('Error al eliminar sucursal:', error);
    next(error);
  }
};