const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const envConfig = require('../config/envConfig');
const { validationResult } = require('express-validator');
const logger = require('../config/logger'); // Importar el logger

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en login:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;

    // Buscar usuario en la base de datos
    const query = `
      SELECT id_vendedor, nombre, username, password_hash, rol, activo, id_sucursal
      FROM vendedores 
      WHERE username = $1 AND activo = true
    `;
    
    const { rows } = await db.query(query, [username]);
    
    if (rows.length === 0) {
      logger.warn(`Intento de login fallido para usuario: ${username} (usuario no encontrado o inactivo).`);
      return res.status(401).json({ 
        message: 'Usuario o contraseña incorrectos.' 
      });
    }

    const user = rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      logger.warn(`Intento de login fallido para usuario: ${username} (contraseña incorrecta).`);
      return res.status(401).json({ 
        message: 'Usuario o contraseña incorrectos.' 
      });
    }

    // Obtener información de la sucursal
    const sucursalQuery = `
      SELECT id_sucursal, nombre, ciudad, direccion
      FROM sucursales 
      WHERE id_sucursal = $1 AND activo = true
    `;
    
    const sucursalResult = await db.query(sucursalQuery, [user.id_sucursal]);
    const sucursal = sucursalResult.rows[0];

    // Generar JWT incluyendo id_sucursal y nombre de sucursal
    const token = jwt.sign(
      { 
        id: user.id_vendedor, 
        username: user.username, 
        rol: user.rol,
        id_sucursal: user.id_sucursal,
        sucursal_nombre: sucursal ? sucursal.nombre : null
      },
      envConfig.JWT_SECRET,
      { expiresIn: '1h' } // Token expira en 1 hora
    );

    logger.info(`Login exitoso para usuario: ${username} (Rol: ${user.rol}, Sucursal: ${sucursal ? sucursal.nombre : 'N/A'}).`);
    // Respuesta exitosa
    res.status(200).json({
      message: 'Login exitoso.',
      token: token, // Enviar el token al cliente
      data: {
        id: user.id_vendedor,
        nombre: user.nombre,
        username: user.username,
        rol: user.rol,
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

exports.createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación al crear usuario:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nombre, username, email, password, rol, id_sucursal } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await db.query(
      'SELECT id_vendedor FROM vendedores WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      logger.warn(`Intento de creación de usuario fallido: el usuario ${username} ya existe.`);
      return res.status(400).json({ 
        message: 'El usuario ya existe.' 
      });
    }

    // Hash de la contraseña
    const saltRounds = parseInt(envConfig.SALT_ROUNDS || '10', 10); // Usar variable de entorno para saltRounds
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const insertQuery = `
      INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_vendedor, nombre, username, email, rol, id_sucursal
    `;

    logger.info('Recibiendo datos para crear usuario. Rol recibido:', rol);
    const { rows } = await db.query(insertQuery, [
      nombre, username, email, passwordHash, rol, id_sucursal
    ]);

    logger.info(`Usuario ${username} creado exitosamente con rol ${rol}.`);
    res.status(201).json({
      message: 'Usuario creado exitosamente.',
      data: rows[0]
    });

  } catch (error) {
    logger.error('Error al crear usuario:', error);
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const userRole = req.user.rol;
    const userSucursalId = req.user.id_sucursal;
    
    let query;
    let params = [];
    
    // Si es admin, puede ver todos los usuarios
    if (userRole === 'admin') {
      query = `
      SELECT v.id_vendedor, v.nombre, v.username, v.email, v.rol, v.activo, v.created_at,
               s.nombre as sucursal_nombre, s.id_sucursal
      FROM vendedores v
      LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      ORDER BY v.nombre
    `;
    } else {
      // Si no es admin, solo ve usuarios de su sucursal
      query = `
        SELECT v.id_vendedor, v.nombre, v.username, v.email, v.rol, v.activo, v.created_at,
               s.nombre as sucursal_nombre, s.id_sucursal
        FROM vendedores v
        LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
        WHERE v.id_sucursal = $1
        ORDER BY v.nombre
      `;
      params.push(userSucursalId);
    }

    const { rows } = await db.query(query, params);

    logger.info('Usuarios obtenidos exitosamente.');
    res.status(200).json({
      message: 'Usuarios obtenidos exitosamente.',
      data: rows
    });

  } catch (error) {
    logger.error('Error al obtener usuarios:', error);
    next(error);
  }
};