import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';
import { registrarAuditoria } from '../services/auditoriaService';

// Listar sucursales con paginación y búsqueda
export const getAllSucursales = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, search = '', restaurante = '' } = req.query;
    let query = `SELECT s.*, r.nombre as restaurante_nombre FROM sucursales s JOIN restaurantes r ON s.id_restaurante = r.id_restaurante WHERE 1=1`;
    const params: any[] = [];
    if (search) {
      query += ` AND s.nombre ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
    if (restaurante) {
      query += ` AND r.nombre ILIKE $${params.length + 1}`;
      params.push(`%${restaurante}%`);
    }
    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));
    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar sucursales: %s', message);
    res.status(500).json({ error: 'Error al listar sucursales', detail: message });
  }
};

// Ver detalles de una sucursal
export const getSucursalById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM sucursales WHERE id_sucursal = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener sucursal: %s', message);
    res.status(500).json({ error: 'Error al obtener sucursal', detail: message });
  }
};

// Activar o desactivar sucursal
export const updateSucursalStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ message: 'El campo "activo" debe ser booleano' });
    }
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM sucursales WHERE id_sucursal = $1', [id]);
    const result = await pool.query(
      'UPDATE sucursales SET activo = $1, updated_at = NOW() WHERE id_sucursal = $2 RETURNING *',
      [!!activo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: activo ? 'activar' : 'desactivar',
      tabla_afectada: 'sucursales',
      id_registro: Number(id),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Sucursal %s: %s', activo ? 'activada' : 'desactivada', result.rows[0].nombre);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al actualizar estado de sucursal: %s', message);
    res.status(500).json({ error: 'Error al actualizar estado de sucursal', detail: message });
  }
};

// Crear sucursal
export const createSucursal = async (req: Request, res: Response) => {
  try {
    const { nombre, ciudad, direccion, id_restaurante } = req.body;
    if (!nombre || !ciudad || !direccion || !id_restaurante) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, ciudad, direccion, id_restaurante' });
    }
    const result = await pool.query(
      `INSERT INTO sucursales (nombre, ciudad, direccion, activo, created_at, id_restaurante)
       VALUES ($1, $2, $3, true, NOW(), $4) RETURNING *`,
      [nombre, ciudad, direccion, id_restaurante]
    );
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: 'crear',
      tabla_afectada: 'sucursales',
      id_registro: result.rows[0].id_sucursal,
      datos_nuevos: result.rows[0]
    });
    logger.info('Sucursal creada: %s', nombre);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al crear sucursal: %s', message);
    res.status(500).json({ error: 'Error al crear sucursal', detail: message });
  }
};

// Editar sucursal
export const updateSucursal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, ciudad, direccion, id_restaurante } = req.body;
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM sucursales WHERE id_sucursal = $1', [id]);
    if (prev.rows.length === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (nombre) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
    if (ciudad) { fields.push(`ciudad = $${idx++}`); values.push(ciudad); }
    if (direccion) { fields.push(`direccion = $${idx++}`); values.push(direccion); }
    if (id_restaurante) { fields.push(`id_restaurante = $${idx++}`); values.push(id_restaurante); }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Nada que actualizar' });
    }
    const query = `UPDATE sucursales SET ${fields.join(', ')} WHERE id_sucursal = $${idx} RETURNING *`;
    values.push(id);
    const result = await pool.query(query, values);
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: 'editar',
      tabla_afectada: 'sucursales',
      id_registro: Number(id),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Sucursal editada: %s', result.rows[0].nombre);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al editar sucursal: %s', message);
    res.status(500).json({ error: 'Error al editar sucursal', detail: message });
  }
}; 