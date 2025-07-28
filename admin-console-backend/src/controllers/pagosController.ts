import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';
import { registrarAuditoria } from '../services/auditoriaService';

// Registrar pago de restaurante
export const registrarPago = async (req: Request, res: Response) => {
  try {
    const { id_restaurante, monto, metodo_pago, observaciones } = req.body;
    if (!id_restaurante || !monto) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    const result = await pool.query(
      `INSERT INTO pagos_restaurantes (id_restaurante, monto, metodo_pago, observaciones, registrado_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_restaurante, monto, metodo_pago, observaciones, (req as any).admin?.id]
    );
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: 'registrar_pago',
      tabla_afectada: 'pagos_restaurantes',
      id_registro: result.rows[0].id,
      datos_nuevos: result.rows[0]
    });
    logger.info('Pago registrado para restaurante %s', id_restaurante);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al registrar pago: %s', message);
    res.status(500).json({ error: 'Error al registrar pago', detail: message });
  }
};

// Listar pagos por restaurante
export const listarPagosPorRestaurante = async (req: Request, res: Response) => {
  try {
    const { id_restaurante } = req.params;
    const result = await pool.query(
      `SELECT * FROM pagos_restaurantes WHERE id_restaurante = $1 ORDER BY fecha_pago DESC`,
      [id_restaurante]
    );
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar pagos: %s', message);
    res.status(500).json({ error: 'Error al listar pagos', detail: message });
  }
};

// Ver estado de suscripción de un restaurante
export const getEstadoSuscripcion = async (req: Request, res: Response) => {
  try {
    const { id_restaurante } = req.params;
    // Buscar último pago
    const pagos = await pool.query(
      `SELECT * FROM pagos_restaurantes WHERE id_restaurante = $1 ORDER BY fecha_pago DESC LIMIT 1`,
      [id_restaurante]
    );
    // Buscar estado actual
    const restaurante = await pool.query(
      `SELECT id_restaurante, nombre, activo FROM restaurantes WHERE id_restaurante = $1`,
      [id_restaurante]
    );
    if (restaurante.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    res.json({
      restaurante: restaurante.rows[0],
      ultimo_pago: pagos.rows[0] || null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener estado de suscripción: %s', message);
    res.status(500).json({ error: 'Error al obtener estado de suscripción', detail: message });
  }
};

// Suspender o activar restaurante manualmente
export const suspenderActivarRestaurante = async (req: Request, res: Response) => {
  try {
    const { id_restaurante } = req.params;
    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ message: 'El campo "activo" debe ser booleano' });
    }
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM restaurantes WHERE id_restaurante = $1', [id_restaurante]);
    const result = await pool.query(
      'UPDATE restaurantes SET activo = $1 WHERE id_restaurante = $2 RETURNING *',
      [!!activo, id_restaurante]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: activo ? 'activar_restaurante' : 'suspender_restaurante',
      tabla_afectada: 'restaurantes',
      id_registro: Number(id_restaurante),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Restaurante %s: %s', activo ? 'activado' : 'suspendido', result.rows[0].nombre);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al actualizar estado de restaurante: %s', message);
    res.status(500).json({ error: 'Error al actualizar estado de restaurante', detail: message });
  }
}; 