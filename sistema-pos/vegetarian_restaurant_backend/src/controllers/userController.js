const { pool } = require('../config/database');
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

    const existingUser = await pool.query(
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

    const { rows } = await pool.query(insertQuery, [
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

    const { rows } = await pool.query(query, params);

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
    const result = await pool.query('UPDATE vendedores SET activo = false WHERE id_vendedor = $1 AND id_restaurante = $2 RETURNING *', [id, id_restaurante]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación al actualizar usuario:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { nombre, username, email, password, rol, id_sucursal, activo } = req.body;
    const id_restaurante = req.user.id_restaurante;

    // Verificar que el usuario existe y pertenece al restaurante
    const existingUser = await pool.query(
      'SELECT id_vendedor FROM vendedores WHERE id_vendedor = $1 AND id_restaurante = $2',
      [id, id_restaurante]
    );

    if (existingUser.rows.length === 0) {
      logger.warn(`Intento de actualización de usuario fallido: usuario ${id} no encontrado en el restaurante ${id_restaurante}.`);
      return res.status(404).json({ 
        message: 'Usuario no encontrado.' 
      });
    }

    // Verificar que el username no esté en uso por otro usuario
    if (username) {
      const usernameCheck = await pool.query(
        'SELECT id_vendedor FROM vendedores WHERE username = $1 AND id_restaurante = $2 AND id_vendedor != $3',
        [username, id_restaurante, id]
      );

      if (usernameCheck.rows.length > 0) {
        logger.warn(`Intento de actualización de usuario fallido: el username ${username} ya está en uso.`);
        return res.status(400).json({ 
          message: 'El nombre de usuario ya está en uso.' 
        });
      }
    }

    // Construir la consulta de actualización
    let updateQuery = `
      UPDATE vendedores 
      SET nombre = $1, username = $2, email = $3, rol = $4, id_sucursal = $5, activo = $6
    `;
    let params = [nombre, username, email, rol, id_sucursal, activo];

    // Si se proporciona una nueva contraseña, incluirla en la actualización
    if (password && password.trim() !== '') {
      const saltRounds = parseInt(envConfig.SALT_ROUNDS || '10', 10);
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updateQuery += `, password_hash = $7`;
      params.push(passwordHash);
    }

    updateQuery += ` WHERE id_vendedor = $${params.length + 1} AND id_restaurante = $${params.length + 2} RETURNING id_vendedor, nombre, username, email, rol, id_sucursal, activo, id_restaurante`;
    params.push(id, id_restaurante);

    const { rows } = await pool.query(updateQuery, params);

    logger.info(`Usuario ${username} actualizado exitosamente.`);
    res.status(200).json({
      message: 'Usuario actualizado exitosamente.',
      data: rows[0]
    });

  } catch (error) {
    logger.error('Error al actualizar usuario:', error);
    next(error);
  }
};