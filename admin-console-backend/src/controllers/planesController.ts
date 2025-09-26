import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';
import { registrarAuditoria } from '../services/auditoriaService';
import { notificationService } from '../services/notificationService';

// Listar todos los planes disponibles
export const getAllPlanes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id_plan,
        nombre,
        descripcion,
        precio_mensual,
        max_sucursales,
        max_usuarios,
        max_productos,
        max_transacciones_mes,
        funcionalidades,
        activo,
        created_at,
        updated_at
      FROM planes 
      WHERE activo = true
      ORDER BY precio_mensual ASC
    `);
    
    res.json({ 
      success: true,
      data: result.rows 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar planes: %s', message);
    res.status(500).json({ 
      success: false,
      error: 'Error al listar planes', 
      detail: message 
    });
  }
};

// Obtener plan por ID
export const getPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        id_plan,
        nombre,
        descripcion,
        precio_mensual,
        max_sucursales,
        max_usuarios,
        max_productos,
        max_transacciones_mes,
        funcionalidades,
        activo,
        created_at,
        updated_at
      FROM planes 
      WHERE id_plan = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Plan no encontrado' 
      });
    }
    
    res.json({ 
      success: true,
      data: result.rows[0] 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener plan: %s', message);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener plan', 
      detail: message 
    });
  }
};

// Obtener suscripción actual de un restaurante
export const getRestauranteSuscripcion = async (req: Request, res: Response) => {
  try {
    const { id_restaurante } = req.params;
    
    const result = await pool.query(`
      SELECT 
        s.id_suscripcion,
        s.id_restaurante,
        s.id_plan,
        s.fecha_inicio,
        s.fecha_fin,
        s.estado,
        s.created_at,
        s.updated_at,
        p.nombre as plan_nombre,
        p.precio_mensual,
        p.descripcion as plan_descripcion,
        p.max_sucursales,
        p.max_usuarios,
        p.max_productos,
        p.max_transacciones_mes,
        p.funcionalidades
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = $1 
        AND s.estado = 'activa'
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [id_restaurante]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No se encontró suscripción activa para este restaurante' 
      });
    }
    
    res.json({ 
      success: true,
      data: result.rows[0] 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener suscripción: %s', message);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener suscripción', 
      detail: message 
    });
  }
};

// Cambiar plan de un restaurante
export const cambiarPlanRestaurante = async (req: Request, res: Response) => {
  try {
    const { id_restaurante } = req.params;
    const { id_plan_nuevo, motivo } = req.body;
    
    if (!id_plan_nuevo) {
      return res.status(400).json({ 
        success: false,
        error: 'ID del plan nuevo es requerido' 
      });
    }
    
    // Verificar que el plan existe
    const planResult = await pool.query(`
      SELECT * FROM planes WHERE id_plan = $1 AND activo = true
    `, [id_plan_nuevo]);
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Plan no encontrado o inactivo' 
      });
    }
    
    // Verificar que el restaurante existe
    const restauranteResult = await pool.query(`
      SELECT * FROM restaurantes WHERE id_restaurante = $1
    `, [id_restaurante]);
    
    if (restauranteResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Restaurante no encontrado' 
      });
    }
    
    // Obtener suscripción actual
    const suscripcionActual = await pool.query(`
      SELECT * FROM suscripciones 
      WHERE id_restaurante = $1 AND estado = 'activa'
      ORDER BY created_at DESC
      LIMIT 1
    `, [id_restaurante]);
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Desactivar suscripción actual si existe
      if (suscripcionActual.rows.length > 0) {
        await client.query(`
          UPDATE suscripciones 
          SET estado = 'cancelada', updated_at = NOW()
          WHERE id_suscripcion = $1
        `, [suscripcionActual.rows[0].id_suscripcion]);
      }
      
      // Crear nueva suscripción
      const nuevaSuscripcion = await client.query(`
        INSERT INTO suscripciones (
          id_restaurante, 
          id_plan, 
          fecha_inicio, 
          fecha_fin, 
          estado,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, NOW(), 
          NOW() + INTERVAL '1 month', 
          'activa',
          NOW(),
          NOW()
        ) RETURNING *
      `, [id_restaurante, id_plan_nuevo]);
      
      // Registrar auditoría
      await registrarAuditoria({
        id_usuario: (req as any).admin?.id,
        accion: 'cambiar_plan',
        tabla_afectada: 'suscripciones',
        id_registro: nuevaSuscripcion.rows[0].id_suscripcion,
        datos_nuevos: {
          id_restaurante,
          id_plan_nuevo,
          motivo: motivo || 'Cambio de plan desde admin console'
        }
      });
      
      await client.query('COMMIT');
      
      logger.info('Plan cambiado para restaurante %s: %s', id_restaurante, planResult.rows[0].nombre);
      
      // Enviar notificación al POS
      notificationService.notifyPlanChange(parseInt(id_restaurante), {
        plan: planResult.rows[0],
        suscripcion: nuevaSuscripcion.rows[0],
        motivo: motivo || 'Cambio de plan desde admin console'
      });
      
      res.json({ 
        success: true,
        message: 'Plan cambiado exitosamente',
        data: {
          suscripcion: nuevaSuscripcion.rows[0],
          plan: planResult.rows[0]
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al cambiar plan: %s', message);
    res.status(500).json({ 
      success: false,
      error: 'Error al cambiar plan', 
      detail: message 
    });
  }
};

// Obtener estadísticas de uso de un restaurante
export const getRestauranteUso = async (req: Request, res: Response) => {
  try {
    const { id_restaurante } = req.params;
    
    // Obtener suscripción actual
    const suscripcionResult = await pool.query(`
      SELECT 
        s.id_plan,
        p.nombre as plan_nombre,
        p.max_sucursales,
        p.max_usuarios,
        p.max_productos,
        p.max_transacciones_mes
      FROM suscripciones s
      JOIN planes p ON s.id_plan = p.id_plan
      WHERE s.id_restaurante = $1 AND s.estado = 'activa'
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [id_restaurante]);
    
    if (suscripcionResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'No se encontró suscripción activa' 
      });
    }
    
    const plan = suscripcionResult.rows[0];
    
    // Obtener uso actual
    const usoResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id_sucursal) as sucursales_actuales,
        COUNT(DISTINCT v.id_vendedor) as usuarios_actuales,
        COUNT(DISTINCT pr.id_producto) as productos_actuales,
        COUNT(DISTINCT ve.id_venta) as transacciones_mes_actual
      FROM restaurantes r
      LEFT JOIN sucursales s ON r.id_restaurante = s.id_restaurante AND s.activo = true
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante AND v.activo = true
      LEFT JOIN productos pr ON r.id_restaurante = pr.id_restaurante AND pr.activo = true
      LEFT JOIN ventas ve ON r.id_restaurante = ve.id_restaurante 
        AND ve.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      WHERE r.id_restaurante = $1
    `, [id_restaurante]);
    
    const uso = usoResult.rows[0];
    
    // Calcular porcentajes y estados
    const estadisticas = {
      sucursales: {
        actual: parseInt(uso.sucursales_actuales) || 0,
        limite: plan.max_sucursales,
        porcentaje: plan.max_sucursales > 0 ? 
          Math.round(((parseInt(uso.sucursales_actuales) || 0) / plan.max_sucursales) * 100) : 0,
        estado: plan.max_sucursales === 0 ? 'ilimitado' : 
          (parseInt(uso.sucursales_actuales) || 0) > plan.max_sucursales ? 'excedido' :
          (parseInt(uso.sucursales_actuales) || 0) >= plan.max_sucursales * 0.8 ? 'warning' : 'ok'
      },
      usuarios: {
        actual: parseInt(uso.usuarios_actuales) || 0,
        limite: plan.max_usuarios,
        porcentaje: plan.max_usuarios > 0 ? 
          Math.round(((parseInt(uso.usuarios_actuales) || 0) / plan.max_usuarios) * 100) : 0,
        estado: plan.max_usuarios === 0 ? 'ilimitado' : 
          (parseInt(uso.usuarios_actuales) || 0) > plan.max_usuarios ? 'excedido' :
          (parseInt(uso.usuarios_actuales) || 0) >= plan.max_usuarios * 0.8 ? 'warning' : 'ok'
      },
      productos: {
        actual: parseInt(uso.productos_actuales) || 0,
        limite: plan.max_productos,
        porcentaje: plan.max_productos > 0 ? 
          Math.round(((parseInt(uso.productos_actuales) || 0) / plan.max_productos) * 100) : 0,
        estado: plan.max_productos === 0 ? 'ilimitado' : 
          (parseInt(uso.productos_actuales) || 0) > plan.max_productos ? 'excedido' :
          (parseInt(uso.productos_actuales) || 0) >= plan.max_productos * 0.8 ? 'warning' : 'ok'
      },
      transacciones: {
        actual: parseInt(uso.transacciones_mes_actual) || 0,
        limite: plan.max_transacciones_mes,
        porcentaje: plan.max_transacciones_mes > 0 ? 
          Math.round(((parseInt(uso.transacciones_mes_actual) || 0) / plan.max_transacciones_mes) * 100) : 0,
        estado: plan.max_transacciones_mes === 0 ? 'ilimitado' : 
          (parseInt(uso.transacciones_mes_actual) || 0) > plan.max_transacciones_mes ? 'excedido' :
          (parseInt(uso.transacciones_mes_actual) || 0) >= plan.max_transacciones_mes * 0.8 ? 'warning' : 'ok'
      }
    };
    
    res.json({ 
      success: true,
      data: {
        plan: plan,
        uso: estadisticas
      }
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener uso: %s', message);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener uso', 
      detail: message 
    });
  }
};

// Listar todos los restaurantes con sus planes
export const getRestaurantesConPlanes = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    
    const result = await pool.query(`
      SELECT 
        r.id_restaurante,
        r.nombre,
        r.direccion,
        r.ciudad,
        r.telefono,
        r.email,
        r.activo,
        r.created_at,
        p.nombre as plan_nombre,
        p.precio_mensual,
        s.estado as suscripcion_estado,
        s.fecha_inicio,
        s.fecha_fin,
        COUNT(DISTINCT suc.id_sucursal) as sucursales_count,
        COUNT(DISTINCT v.id_vendedor) as usuarios_count,
        COUNT(DISTINCT pr.id_producto) as productos_count
      FROM restaurantes r
      LEFT JOIN suscripciones s ON r.id_restaurante = s.id_restaurante AND s.estado = 'activa'
      LEFT JOIN planes p ON s.id_plan = p.id_plan
      LEFT JOIN sucursales suc ON r.id_restaurante = suc.id_restaurante AND suc.activo = true
      LEFT JOIN vendedores v ON r.id_restaurante = v.id_restaurante AND v.activo = true
      LEFT JOIN productos pr ON r.id_restaurante = pr.id_restaurante AND pr.activo = true
      WHERE r.nombre ILIKE $1
      GROUP BY r.id_restaurante, r.nombre, r.direccion, r.ciudad, r.telefono, r.email, r.activo, r.created_at, p.nombre, p.precio_mensual, s.estado, s.fecha_inicio, s.fecha_fin
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [`%${search}%`, Number(limit), Number(offset)]);
    
    res.json({ 
      success: true,
      data: result.rows 
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar restaurantes con planes: %s', message);
    res.status(500).json({ 
      success: false,
      error: 'Error al listar restaurantes con planes', 
      detail: message 
    });
  }
};
