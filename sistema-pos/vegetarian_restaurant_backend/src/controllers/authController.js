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

    // Obtener información del restaurante
    const restauranteQuery = `
      SELECT id_restaurante, nombre, ciudad, direccion
      FROM restaurantes 
      WHERE id_restaurante = $1 AND activo = true
    `;
    
    const restauranteResult = await pool.query(restauranteQuery, [user.id_restaurante]);
    const restaurante = restauranteResult.rows[0];

    const token = jwt.sign(
      { 
        id: user.id_vendedor,
        id_vendedor: user.id_vendedor, // Añadir id_vendedor explícitamente
        username: user.username, 
        rol: user.rol,
        id_sucursal: user.id_sucursal,
        sucursal_nombre: sucursal ? sucursal.nombre : null,
        id_restaurante: user.id_restaurante,
        restaurante_nombre: restaurante ? restaurante.nombre : null
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
        restaurante: {
          id: restaurante.id_restaurante,
          nombre: restaurante.nombre,
          ciudad: restaurante.ciudad,
          direccion: restaurante.direccion
        },
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

exports.getSessionStatus = async (req, res, next) => {
  try {
    // La información del usuario (rol, sucursal, etc.) ya fue decodificada
    // del token por el middleware authenticateToken y está en req.user
    const userInfo = req.user;

    // Puedes enriquecer esta información si es necesario, por ejemplo, 
    // obteniendo detalles frescos de la base de datos, pero para este caso
    // con devolver la info del token es suficiente y más rápido.

    logger.info(`Estado de sesión consultado por: ${userInfo.username}`);

    res.status(200).json({
      message: 'Sesión activa.',
      isAuthenticated: true,
      user: {
        id: userInfo.id,
        username: userInfo.username,
        rol: userInfo.rol,
        id_sucursal: userInfo.id_sucursal,
        sucursal_nombre: userInfo.sucursal_nombre,
        id_restaurante: userInfo.id_restaurante
      }
    });

  } catch (error) {
    logger.error('Error al obtener el estado de la sesión:', error);
    next(error);
  }
};

exports.validateToken = async (req, res, next) => {
  try {
    // Si llegamos aquí, el token es válido (el middleware authenticateToken ya lo verificó)
    const userInfo = req.user;

    logger.info(`Token validado exitosamente para usuario: ${userInfo.username}`);

    res.status(200).json({
      message: 'Token válido.',
      valid: true,
      user: {
        id: userInfo.id,
        username: userInfo.username,
        rol: userInfo.rol,
        id_sucursal: userInfo.id_sucursal,
        sucursal_nombre: userInfo.sucursal_nombre,
        id_restaurante: userInfo.id_restaurante
      }
    });

  } catch (error) {
    logger.error('Error al validar token:', error);
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { id_vendedor } = req.user;
    
    // Verificar que el usuario aún existe y está activo
    const query = `
      SELECT id_vendedor, nombre, username, rol, activo, id_sucursal, id_restaurante
      FROM vendedores 
      WHERE id_vendedor = $1 AND activo = true
    `;
    
    const { rows } = await pool.query(query, [id_vendedor]);
    
    if (rows.length === 0) {
      logger.warn(`Intento de renovación de token para usuario inactivo: ${id_vendedor}`);
      return res.status(401).json({ 
        message: 'Usuario no encontrado o inactivo.',
        code: 'USER_INACTIVE'
      });
    }

    const user = rows[0];

    // Obtener información de sucursal
    const sucursalQuery = `
      SELECT id_sucursal, nombre, ciudad, direccion
      FROM sucursales 
      WHERE id_sucursal = $1 AND activo = true
    `;
    
    const sucursalResult = await pool.query(sucursalQuery, [user.id_sucursal]);
    const sucursal = sucursalResult.rows[0];

    // Obtener información del restaurante
    const restauranteQuery = `
      SELECT id_restaurante, nombre, ciudad, direccion
      FROM restaurantes 
      WHERE id_restaurante = $1 AND activo = true
    `;
    
    const restauranteResult = await pool.query(restauranteQuery, [user.id_restaurante]);
    const restaurante = restauranteResult.rows[0];

    // Generar nuevo token
    const newToken = jwt.sign(
      { 
        id: user.id_vendedor,
        id_vendedor: user.id_vendedor,
        username: user.username, 
        rol: user.rol,
        id_sucursal: user.id_sucursal,
        sucursal_nombre: sucursal ? sucursal.nombre : null,
        id_restaurante: user.id_restaurante,
        restaurante_nombre: restaurante ? restaurante.nombre : null
      },
      envConfig.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`Token renovado exitosamente para usuario: ${user.username}`);
    res.status(200).json({
      message: 'Token renovado exitosamente.',
      token: newToken,
      data: {
        id: user.id_vendedor,
        nombre: user.nombre,
        username: user.username,
        rol: user.rol,
        id_restaurante: user.id_restaurante,
        restaurante: restaurante ? {
          id: restaurante.id_restaurante,
          nombre: restaurante.nombre,
          ciudad: restaurante.ciudad,
          direccion: restaurante.direccion
        } : null,
        sucursal: sucursal ? {
          id: sucursal.id_sucursal,
          nombre: sucursal.nombre,
          ciudad: sucursal.ciudad,
          direccion: sucursal.direccion
        } : null
      }
    });

  } catch (error) {
    logger.error('Error al renovar token:', error);
    next(error);
  }
};