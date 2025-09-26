import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import logger from '../config/logger';

// Interfaz para límites de plan
interface PlanLimits {
  max_sucursales: number;
  max_usuarios: number;
  max_productos: number;
  max_transacciones_mes: number;
}

// Interfaz para uso actual
interface CurrentUsage {
  sucursales: number;
  usuarios: number;
  productos: number;
  transacciones: number;
}

// Middleware para verificar límites de plan
export const checkPlanLimits = (limitType: 'sucursales' | 'usuarios' | 'productos' | 'transacciones') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id_restaurante } = req.params;
      
      if (!id_restaurante) {
        return res.status(400).json({
          success: false,
          error: 'ID de restaurante requerido'
        });
      }

      // Obtener plan actual del restaurante
      const planResult = await pool.query(`
        SELECT 
          p.max_sucursales,
          p.max_usuarios,
          p.max_productos,
          p.max_transacciones_mes,
          p.nombre as plan_nombre
        FROM suscripciones s
        JOIN planes p ON s.id_plan = p.id_plan
        WHERE s.id_restaurante = $1 AND s.estado = 'activa'
        ORDER BY s.created_at DESC
        LIMIT 1
      `, [id_restaurante]);

      if (planResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró suscripción activa para este restaurante'
        });
      }

      const plan = planResult.rows[0];
      const limits: PlanLimits = {
        max_sucursales: plan.max_sucursales,
        max_usuarios: plan.max_usuarios,
        max_productos: plan.max_productos,
        max_transacciones_mes: plan.max_transacciones_mes
      };

      // Obtener uso actual
      const usageResult = await pool.query(`
        SELECT 
          COUNT(DISTINCT suc.id_sucursal) as sucursales,
          COUNT(DISTINCT v.id_vendedor) as usuarios,
          COUNT(DISTINCT pr.id_producto) as productos,
          COUNT(DISTINCT ve.id_venta) as transacciones
        FROM restaurantes r
        LEFT JOIN sucursales suc ON r.id_restaurante = suc.id_restaurante AND suc.activo = true
        LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante AND v.activo = true
        LEFT JOIN productos pr ON r.id_restaurante = pr.id_restaurante AND pr.activo = true
        LEFT JOIN ventas ve ON r.id_restaurante = ve.id_restaurante 
          AND ve.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        WHERE r.id_restaurante = $1
      `, [id_restaurante]);

      const usage: CurrentUsage = usageResult.rows[0];

      // Verificar límite específico
      let currentUsage: number;
      let maxLimit: number;
      let limitName: string;

      switch (limitType) {
        case 'sucursales':
          currentUsage = Number(usage.sucursales) || 0;
          maxLimit = limits.max_sucursales;
          limitName = 'sucursales';
          break;
        case 'usuarios':
          currentUsage = Number(usage.usuarios) || 0;
          maxLimit = limits.max_usuarios;
          limitName = 'usuarios';
          break;
        case 'productos':
          currentUsage = Number(usage.productos) || 0;
          maxLimit = limits.max_productos;
          limitName = 'productos';
          break;
        case 'transacciones':
          currentUsage = Number(usage.transacciones) || 0;
          maxLimit = limits.max_transacciones_mes;
          limitName = 'transacciones';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Tipo de límite no válido'
          });
      }

      // Verificar si se excede el límite
      if (maxLimit > 0 && currentUsage >= maxLimit) {
        return res.status(403).json({
          success: false,
          error: `Límite de ${limitName} excedido`,
          details: {
            plan: plan.plan_nombre,
            current_usage: currentUsage,
            max_limit: maxLimit,
            limit_type: limitType,
            upgrade_required: true
          }
        });
      }

      // Agregar información del plan a la request para uso posterior
      (req as any).planInfo = {
        plan: plan.plan_nombre,
        limits,
        usage,
        limitType,
        currentUsage,
        maxLimit
      };

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error verificando límites de plan: %s', message);
      res.status(500).json({
        success: false,
        error: 'Error verificando límites de plan',
        detail: message
      });
    }
  };
};

// Middleware para verificar funcionalidades de plan
export const checkPlanFeature = (feature: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id_restaurante } = req.params;
      
      if (!id_restaurante) {
        return res.status(400).json({
          success: false,
          error: 'ID de restaurante requerido'
        });
      }

      // Obtener funcionalidades del plan actual
      const planResult = await pool.query(`
        SELECT 
          p.funcionalidades,
          p.nombre as plan_nombre
        FROM suscripciones s
        JOIN planes p ON s.id_plan = p.id_plan
        WHERE s.id_restaurante = $1 AND s.estado = 'activa'
        ORDER BY s.created_at DESC
        LIMIT 1
      `, [id_restaurante]);

      if (planResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No se encontró suscripción activa para este restaurante'
        });
      }

      const plan = planResult.rows[0];
      const funcionalidades = plan.funcionalidades || {};

      // Verificar si la funcionalidad está habilitada
      if (!funcionalidades[feature]) {
        return res.status(403).json({
          success: false,
          error: `Funcionalidad '${feature}' no disponible en el plan actual`,
          details: {
            plan: plan.plan_nombre,
            feature,
            upgrade_required: true,
            available_features: Object.keys(funcionalidades).filter(key => funcionalidades[key])
          }
        });
      }

      // Agregar información del plan a la request
      (req as any).planInfo = {
        plan: plan.plan_nombre,
        funcionalidades,
        feature
      };

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Error verificando funcionalidad de plan: %s', message);
      res.status(500).json({
        success: false,
        error: 'Error verificando funcionalidad de plan',
        detail: message
      });
    }
  };
};

// Función auxiliar para obtener información de plan
export const getPlanInfo = async (id_restaurante: number) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_plan,
        p.nombre as plan_nombre,
        p.precio_mensual,
        p.max_sucursales,
        p.max_usuarios,
        p.max_productos,
        p.max_transacciones_mes,
        p.funcionalidades,
        s.estado as suscripcion_estado,
        s.fecha_inicio,
        s.fecha_fin
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = $1 AND s.estado = 'activa'
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [id_restaurante]);

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logger.error('Error obteniendo información de plan: %s', error);
    return null;
  }
};

// Función auxiliar para obtener uso actual
export const getCurrentUsage = async (id_restaurante: number) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(DISTINCT suc.id_sucursal) as sucursales,
        COUNT(DISTINCT v.id_vendedor) as usuarios,
        COUNT(DISTINCT pr.id_producto) as productos,
        COUNT(DISTINCT ve.id_venta) as transacciones_mes
      FROM restaurantes r
      LEFT JOIN sucursales suc ON r.id_restaurante = suc.id_restaurante AND suc.activo = true
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante AND v.activo = true
      LEFT JOIN productos pr ON r.id_restaurante = pr.id_restaurante AND pr.activo = true
      LEFT JOIN ventas ve ON r.id_restaurante = ve.id_restaurante 
        AND ve.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      WHERE r.id_restaurante = $1
    `, [id_restaurante]);

    return result.rows[0];
  } catch (error) {
    logger.error('Error obteniendo uso actual: %s', error);
    return null;
  }
};
