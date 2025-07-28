import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';
import { registrarAuditoria } from '../services/auditoriaService';
import { Parser } from 'json2csv';

// Reporte de ventas globales
export const getVentasGlobal = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await pool.query(
      `SELECT v.*, r.nombre as restaurante_nombre, s.nombre as sucursal_nombre
       FROM ventas v
       JOIN restaurantes r ON v.id_restaurante = r.id_restaurante
       LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
       WHERE v.fecha::date BETWEEN $1 AND $2
       ORDER BY v.fecha DESC`,
      [startDate, endDate]
    );
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener ventas globales: %s', message);
    res.status(500).json({ error: 'Error al obtener ventas globales', detail: message });
  }
};

// Reporte de ventas por restaurante
export const getVentasPorRestaurante = async (req: Request, res: Response) => {
  try {
    const { id_restaurante } = req.params;
    const { startDate, endDate } = req.query;
    const result = await pool.query(
      `SELECT v.*, s.nombre as sucursal_nombre
       FROM ventas v
       LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
       WHERE v.id_restaurante = $1 AND v.fecha::date BETWEEN $2 AND $3
       ORDER BY v.fecha DESC`,
      [id_restaurante, startDate, endDate]
    );
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener ventas por restaurante: %s', message);
    res.status(500).json({ error: 'Error al obtener ventas por restaurante', detail: message });
  }
};

// Reporte de ventas por sucursal
export const getVentasPorSucursal = async (req: Request, res: Response) => {
  try {
    const { id_sucursal } = req.params;
    const { startDate, endDate } = req.query;
    const result = await pool.query(
      `SELECT v.*
       FROM ventas v
       WHERE v.id_sucursal = $1 AND v.fecha::date BETWEEN $2 AND $3
       ORDER BY v.fecha DESC`,
      [id_sucursal, startDate, endDate]
    );
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener ventas por sucursal: %s', message);
    res.status(500).json({ error: 'Error al obtener ventas por sucursal', detail: message });
  }
};

// Exportar ventas globales a CSV
export const exportVentasCSV = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await pool.query(
      `SELECT v.*, r.nombre as restaurante_nombre, s.nombre as sucursal_nombre
       FROM ventas v
       JOIN restaurantes r ON v.id_restaurante = r.id_restaurante
       LEFT JOIN sucursales s ON v.id_sucursal = s.id_sucursal
       WHERE v.fecha::date BETWEEN $1 AND $2
       ORDER BY v.fecha DESC`,
      [startDate, endDate]
    );
    const parser = new Parser();
    const csv = parser.parse(result.rows);
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: 'exportar',
      tabla_afectada: 'ventas',
      id_registro: 0,
      datos_anteriores: null,
      datos_nuevos: { startDate, endDate, cantidad: result.rows.length }
    });
    logger.info('Exportación de ventas a CSV realizada por admin %s', (req as any).admin?.username);
    res.header('Content-Type', 'text/csv');
    res.attachment(`ventas_${startDate}_a_${endDate}.csv`);
    return res.send(csv);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al exportar ventas a CSV: %s', message);
    res.status(500).json({ error: 'Error al exportar ventas a CSV', detail: message });
  }
}; 