import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';
import { registrarAuditoria } from '../services/auditoriaService';

// Listar roles admin
export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id_rol, nombre, descripcion, permisos, creado_en FROM roles_admin ORDER BY creado_en DESC');
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar roles: %s', message);
    res.status(500).json({ error: 'Error al listar roles', detail: message });
  }
};

// Crear rol admin
export const createRole = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, permisos } = req.body;
    if (!nombre || !permisos) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, permisos' });
    }
    const result = await pool.query(
      'INSERT INTO roles_admin (nombre, descripcion, permisos, creado_en) VALUES ($1, $2, $3, NOW()) RETURNING id_rol, nombre, descripcion, permisos, creado_en',
      [nombre, descripcion || null, JSON.stringify(permisos)]
    );
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id_usuario,
      accion: 'crear',
      tabla_afectada: 'roles_admin',
      id_registro: result.rows[0].id_rol,
      datos_nuevos: result.rows[0]
    });
    logger.info('Rol creado: %s', nombre);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al crear rol: %s', message);
    res.status(500).json({ error: 'Error al crear rol', detail: message });
  }
};

// Editar rol admin
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, permisos } = req.body;
    const prev = await pool.query('SELECT * FROM roles_admin WHERE id_rol = $1', [id]);
    if (prev.rows.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (nombre) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
    if (descripcion !== undefined) { fields.push(`descripcion = $${idx++}`); values.push(descripcion); }
    if (permisos !== undefined) { fields.push(`permisos = $${idx++}`); values.push(JSON.stringify(permisos)); }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Nada que actualizar' });
    }
    const query = `UPDATE roles_admin SET ${fields.join(', ')} WHERE id_rol = $${idx} RETURNING id_rol, nombre, descripcion, permisos, creado_en`;
    values.push(id);
    const result = await pool.query(query, values);
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id_usuario,
      accion: 'editar',
      tabla_afectada: 'roles_admin',
      id_registro: Number(id),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Rol editado: %s', result.rows[0].nombre);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al editar rol: %s', message);
    res.status(500).json({ error: 'Error al editar rol', detail: message });
  }
};

// Eliminar rol admin
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prev = await pool.query('SELECT * FROM roles_admin WHERE id_rol = $1', [id]);
    if (prev.rows.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    await pool.query('DELETE FROM roles_admin WHERE id_rol = $1', [id]);
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id_usuario,
      accion: 'eliminar',
      tabla_afectada: 'roles_admin',
      id_registro: Number(id),
      datos_anteriores: prev.rows[0]
    });
    logger.info('Rol eliminado: %s', prev.rows[0].nombre);
    res.json({ message: 'Rol eliminado' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al eliminar rol: %s', message);
    res.status(500).json({ error: 'Error al eliminar rol', detail: message });
  }
}; 