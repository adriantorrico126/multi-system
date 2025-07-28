import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';

export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    // Restaurantes activos/inactivos
    const restaurantesResult = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE activo) AS activos, COUNT(*) FILTER (WHERE NOT activo) AS inactivos, COUNT(*) AS total FROM restaurantes`
    );
    // Ventas totales y ventas del día
    const ventasResult = await pool.query(
      `SELECT COUNT(*) AS total_ventas, COALESCE(SUM(total),0) AS monto_total,
        COUNT(*) FILTER (WHERE fecha::date = CURRENT_DATE) AS ventas_hoy,
        COALESCE(SUM(total) FILTER (WHERE fecha::date = CURRENT_DATE),0) AS monto_hoy
      FROM ventas`
    );
    // Top 5 restaurantes por ventas
    const topRestaurantesResult = await pool.query(
      `SELECT r.id_restaurante, r.nombre, COALESCE(SUM(v.total),0) AS total_ventas
       FROM restaurantes r
       LEFT JOIN ventas v ON v.id_restaurante = r.id_restaurante
       GROUP BY r.id_restaurante, r.nombre
       ORDER BY total_ventas DESC
       LIMIT 5`
    );
    // Últimas 5 acciones de auditoría
    const auditoriaResult = await pool.query(
      `SELECT * FROM auditoria_admin ORDER BY fecha_accion DESC LIMIT 5`
    );
    res.json({
      restaurantes: restaurantesResult.rows[0],
      ventas: ventasResult.rows[0],
      topRestaurantes: topRestaurantesResult.rows,
      auditoriaReciente: auditoriaResult.rows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener métricas globales: %s', message);
    res.status(500).json({ error: 'Error al obtener métricas globales', detail: message });
  }
};

export const getDashboardAlerts = async (req: Request, res: Response) => {
  try {
    // TODO: Reemplazar por lógica real de alertas
    const alerts = [
      {
        id: 1,
        message: 'No hay ventas registradas en el sistema.',
        type: 'warning',
        count: 0
      },
      {
        id: 2,
        message: 'No hay tickets de soporte abiertos.',
        type: 'alert',
        count: 0
      }
    ];
    res.json(alerts);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener alertas del dashboard: %s', message);
    res.status(500).json({ error: 'Error al obtener alertas del dashboard', detail: message });
  }
}; 