import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import logger from '../config/logger';
import { registrarAuditoria } from '../services/auditoriaService';

// Listar todos los administradores
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id_usuario, nombre, email, rol_id, activo, creado_en, actualizado_en FROM usuarios ORDER BY creado_en DESC');
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar administradores: %s', message);
    res.status(500).json({ error: 'Error al listar administradores', detail: message });
  }
};

// Crear nuevo administrador
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
    if (!nombre || !email || !password || !rol_id) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, email, password, rol_id' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol_id, activo, creado_en, actualizado_en) VALUES ($1, $2, $3, $4, true, NOW(), NOW()) RETURNING id_usuario, nombre, email, rol_id, activo, creado_en',
      [nombre, email, password_hash, rol_id]
    );
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id_usuario,
      accion: 'crear',
      tabla_afectada: 'usuarios',
      id_registro: result.rows[0].id_usuario,
      datos_nuevos: result.rows[0]
    });
    logger.info('Administrador creado: %s', nombre);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al crear administrador: %s', message);
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as any).code : undefined;
    if (code === '23505') {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }
    res.status(500).json({ error: 'Error al crear administrador', detail: message });
  }
};

// Actualizar datos de administrador (nombre, email, password, rol_id)
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol_id } = req.body;
    let query = 'UPDATE usuarios SET ';
    const params: any[] = [];
    let setParts: string[] = [];
    if (nombre) {
      setParts.push('nombre = $' + (params.length + 1));
      params.push(nombre);
    }
    if (email) {
      setParts.push('email = $' + (params.length + 1));
      params.push(email);
    }
    if (password) {
      setParts.push('password_hash = $' + (params.length + 1));
      params.push(await bcrypt.hash(password, 10));
    }
    if (rol_id) {
      setParts.push('rol_id = $' + (params.length + 1));
      params.push(rol_id);
    }
    if (setParts.length === 0) {
      return res.status(400).json({ message: 'Nada que actualizar' });
    }
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id]);
    query += setParts.join(', ') + ', actualizado_en = NOW() WHERE id_usuario = $' + (params.length + 1) + ' RETURNING id_usuario, nombre, email, rol_id, activo, creado_en, actualizado_en';
    params.push(id);
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id_usuario,
      accion: 'actualizar',
      tabla_afectada: 'usuarios',
      id_registro: Number(id),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Administrador actualizado: %s', result.rows[0].nombre);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al actualizar administrador: %s', message);
    res.status(500).json({ error: 'Error al actualizar administrador', detail: message });
  }
};

// Eliminar/desactivar administrador
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM usuarios WHERE id_usuario = $1', [id]);
    const result = await pool.query('UPDATE usuarios SET activo = false, actualizado_en = NOW() WHERE id_usuario = $1 RETURNING id_usuario, nombre, email, rol_id, activo', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id_usuario,
      accion: 'desactivar',
      tabla_afectada: 'usuarios',
      id_registro: Number(id),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Administrador desactivado: %s', result.rows[0].nombre);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al eliminar administrador: %s', message);
    res.status(500).json({ error: 'Error al eliminar administrador', detail: message });
  }
}; 