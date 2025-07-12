const Sucursal = require('../models/sucursalModel');
const logger = require('../config/logger'); // Importar el logger

exports.getAllSucursales = async (req, res, next) => {
  try {
    const sucursales = await Sucursal.findAll();
    logger.info('Sucursales obtenidas exitosamente.', { count: sucursales.length });
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