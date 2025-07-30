const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const envConfig = require('../config/envConfig');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en login:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;

    const query = `
      SELECT id_vendedor, nombre, username, password_hash, rol, activo, id_sucursal, id_restaurante
      FROM vendedores 
      WHERE username = $1 AND activo = true
    `;
    
    const { rows } = await pool.query(query, [username]);
    
    if (rows.length === 0) {
      logger.warn(`Intento de login fallido para usuario: ${username} (usuario no encontrado o inactivo).`);
      return res.status(401).json({ 
        message: 'Usuario o contraseña incorrectos.' 
      });
    }

    const user = rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      logger.warn(`Intento de login fallido para usuario: ${username} (contraseña incorrecta).`);
      return res.status(401).json({ 
        message: 'Usuario o contraseña incorrectos.' 
      });
    }

    const sucursalQuery = `
      SELECT id_sucursal, nombre, ciudad, direccion
      FROM sucursales 
      WHERE id_sucursal = $1 AND activo = true
    `;
    
    const sucursalResult = await pool.query(sucursalQuery, [user.id_sucursal]);
    const sucursal = sucursalResult.rows[0];

    const token = jwt.sign(
      { 
        id: user.id_vendedor,
        id_vendedor: user.id_vendedor, // Añadir id_vendedor explícitamente
        username: user.username, 
        rol: user.rol,
        id_sucursal: user.id_sucursal,
        sucursal_nombre: sucursal ? sucursal.nombre : null,
        id_restaurante: user.id_restaurante
      },
      envConfig.JWT_SECRET,
      { expiresIn: '24h' } // Aumentar expiración a 24 horas
    );

    logger.info(`Login exitoso para usuario: ${username} (Rol: ${user.rol}, Sucursal: ${sucursal ? sucursal.nombre : 'N/A'}).`);
    res.status(200).json({
      message: 'Login exitoso.',
      token: token,
      data: {
        id: user.id_vendedor,
        nombre: user.nombre,
        username: user.username,
        rol: user.rol,
        id_restaurante: user.id_restaurante,
        sucursal: {
          id: sucursal.id_sucursal,
          nombre: sucursal.nombre,
          ciudad: sucursal.ciudad,
          direccion: sucursal.direccion
        }
      }
    });

  } catch (error) {
    logger.error('Error en login:', error);
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    
    const query = `
      SELECT v.id_vendedor, v.nombre, v.username, v.rol, v.activo, v.id_sucursal,
             s.nombre as sucursal_nombre, s.ciudad as sucursal_ciudad
      FROM vendedores v
      LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      WHERE v.id_restaurante = $1 AND v.activo = true
      ORDER BY v.nombre
    `;
    
    const { rows } = await pool.query(query, [id_restaurante]);
    
    logger.info(`Usuarios obtenidos exitosamente para restaurante ${id_restaurante}.`);
    res.status(200).json({
      message: 'Usuarios obtenidos exitosamente.',
      data: rows
    });
  } catch (error) {
    logger.error('Error al obtener usuarios:', error);
    next(error);
  }
};