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

export const getGlobalAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate y endDate son requeridos (YYYY-MM-DD)' });
    }

    const restaurantesResult = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE activo) AS activos, COUNT(*) AS total FROM restaurantes`
    );
    const totalRestaurants = Number(restaurantesResult.rows[0]?.total || 0);

    const ventas = await pool.query(
      `SELECT v.id_restaurante, v.total, v.fecha, r.nombre as restaurante_nombre, r.ciudad
       FROM ventas v
       JOIN restaurantes r ON r.id_restaurante = v.id_restaurante
       WHERE v.fecha::date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const rows = ventas.rows;
    const totalRevenue = rows.reduce((s, r) => s + Number(r.total || 0), 0);
    const revenueByDayMap = new Map<string, number>();
    const hourlyMap = new Map<string, { activeUsers: number; transactions: number; revenue: number }>();
    const byRestaurantMap = new Map<number, { name: string; revenue: number; transactions: number }>();
    const regionalMap = new Map<string, { region: string; revenue: number; restaurants: number; growth: number }>();

    for (const r of rows) {
      const day = (new Date(r.fecha)).toISOString().slice(0, 10);
      const hour = (new Date(r.fecha)).toISOString().slice(11, 13) + ':00';
      const revenue = Number(r.total || 0);
      revenueByDayMap.set(day, (revenueByDayMap.get(day) || 0) + revenue);
      const h = hourlyMap.get(hour) || { activeUsers: 0, transactions: 0, revenue: 0 };
      h.transactions += 1; h.revenue += revenue; h.activeUsers = Math.max(h.activeUsers, Math.ceil(h.transactions / 2));
      hourlyMap.set(hour, h);
      const br = byRestaurantMap.get(r.id_restaurante) || { name: r.restaurante_nombre, revenue: 0, transactions: 0 };
      br.revenue += revenue; br.transactions += 1; byRestaurantMap.set(r.id_restaurante, br);
      const regionKey = r.ciudad || 'Sin ciudad';
      const reg = regionalMap.get(regionKey) || { region: regionKey, revenue: 0, restaurants: 0, growth: 0 };
      reg.revenue += revenue; regionalMap.set(regionKey, reg);
    }

    const regiones = await pool.query(`SELECT ciudad, COUNT(*) as restaurantes FROM restaurantes GROUP BY ciudad`);
    for (const r of regiones.rows) {
      const k = r.ciudad || 'Sin ciudad';
      const reg = regionalMap.get(k) || { region: k, revenue: 0, restaurants: 0, growth: 0 };
      reg.restaurants = Number(r.restaurantes || 0);
      regionalMap.set(k, reg);
    }

    const subs = await pool.query(`SELECT LOWER(estado_suscripcion) as estado, COUNT(*) as c FROM servicios_restaurante GROUP BY 1`);
    const subscriptionStatusData = subs.rows.map(r => ({ name: r.estado, value: Number(r.c), color: r.estado === 'activo' ? '#10B981' : r.estado === 'prueba' ? '#3B82F6' : r.estado === 'suspendido' ? '#6B7280' : '#F59E0B' }));

    const revenueAndRestaurantData = Array.from(revenueByDayMap.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([day, rev]) => ({ month: day, revenue: rev, restaurants: totalRestaurants, avgPerRestaurant: totalRestaurants ? rev / totalRestaurants : 0 }));
    const systemUsageData = Array.from(hourlyMap.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([hour, v]) => ({ hour, ...v }));
    const topRestaurants = Array.from(byRestaurantMap.values()).sort((a,b) => b.revenue - a.revenue).slice(0,5).map(r => ({ name: r.name, revenue: r.revenue, transactions: r.transactions, growth: 0 }));
    const regionalData = Array.from(regionalMap.values());

    res.json({
      totalRevenue,
      totalRestaurants,
      totalActiveUsers: null,
      avgRevenuePerRestaurant: totalRestaurants ? Number((totalRevenue / totalRestaurants).toFixed(2)) : 0,
      revenueGrowth: null,
      restaurantGrowth: null,
      activeUsersGrowth: null,
      avgRevenuePerRestaurantGrowth: null,
      revenueAndRestaurantData,
      churnAnalysisData: [],
      systemUsageData,
      topRestaurants,
      subscriptionStatusData,
      performanceMetrics: [],
      regionalData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error en analíticas detalladas: %s', message);
    res.status(500).json({ error: 'Error al obtener analíticas', detail: message });
  }
};