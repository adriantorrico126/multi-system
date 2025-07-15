const db = require('../config/database');
const bcrypt = require('bcrypt');
const envConfig = require('../config/envConfig');
const logger = require('../config/logger');
const { validationResult } = require('express-validator');

exports.createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación al crear usuario:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nombre, username, email, password, rol, id_sucursal } = req.body;
    const id_restaurante = req.user.id_restaurante;

    const existingUser = await db.query(
      'SELECT id_vendedor FROM vendedores WHERE username = $1 AND id_restaurante = $2',
      [username, id_restaurante]
    );

    if (existingUser.rows.length > 0) {
      logger.warn(`Intento de creación de usuario fallido: el usuario ${username} ya existe en el restaurante ${id_restaurante}.`);
      return res.status(400).json({ 
        message: 'El usuario ya existe en este restaurante.' 
      });
    }

    const saltRounds = parseInt(envConfig.SALT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO vendedores (nombre, username, email, password_hash, rol, id_sucursal, id_restaurante)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_vendedor, nombre, username, email, rol, id_sucursal, id_restaurante
    `;

    const { rows } = await db.query(insertQuery, [
      nombre, username, email, passwordHash, rol, id_sucursal, id_restaurante
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
    const id_restaurante = req.user.id_restaurante;
    
    let query;
    let params = [id_restaurante];

    if (userRole === 'admin' || userRole === 'super_admin') {
      query = `
      SELECT v.id_vendedor, v.nombre, v.username, v.email, v.rol, v.activo, v.created_at,
               s.nombre as sucursal_nombre, s.id_sucursal, v.id_restaurante
      FROM vendedores v
      LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      WHERE v.id_restaurante = $1
      ORDER BY v.nombre
    `;
    } else {
      query = `
        SELECT v.id_vendedor, v.nombre, v.username, v.email, v.rol, v.activo, v.created_at,
               s.nombre as sucursal_nombre, s.id_sucursal, v.id_restaurante
        FROM vendedores v
        LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
        WHERE v.id_restaurante = $1 AND v.id_sucursal = $2
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

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante;
    // No permitir eliminarse a sí mismo
    if (req.user.id_vendedor && req.user.id_vendedor.toString() === id) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario.' });
    }
    // Soft delete: poner activo=false
    const result = await db.query('UPDATE vendedores SET activo = false WHERE id_vendedor = $1 AND id_restaurante = $2 RETURNING *', [id, id_restaurante]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
};