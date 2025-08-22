import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';
import { registrarAuditoria } from '../services/auditoriaService';
import bcrypt from 'bcryptjs';

// Listar restaurantes con paginación y búsqueda
export const getAllRestaurantes = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;
    const result = await pool.query(
      `SELECT * FROM restaurantes WHERE nombre ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [`%${search}%`, Number(limit), Number(offset)]
    );
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar restaurantes: %s', message);
    res.status(500).json({ error: 'Error al listar restaurantes', detail: message });
  }
};

// Ver detalles de un restaurante
export const getRestauranteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM restaurantes WHERE id_restaurante = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al obtener restaurante: %s', message);
    res.status(500).json({ error: 'Error al obtener restaurante', detail: message });
  }
};

// Activar o suspender restaurante
export const updateRestauranteStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ message: 'El campo "activo" debe ser booleano' });
    }
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM restaurantes WHERE id_restaurante = $1', [id]);
    const result = await pool.query(
      'UPDATE restaurantes SET activo = $1 WHERE id_restaurante = $2 RETURNING *',
      [!!activo, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: activo ? 'activar' : 'suspender',
      tabla_afectada: 'restaurantes',
      id_registro: Number(id),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Restaurante %s: %s', activo ? 'activado' : 'suspendido', result.rows[0].nombre);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al actualizar estado de restaurante: %s', message);
    res.status(500).json({ error: 'Error al actualizar estado', detail: message });
  }
};

// Crear restaurante
export const createRestaurante = async (req: Request, res: Response) => {
  try {
    const { nombre, direccion, ciudad, telefono, email } = req.body;
    const first_user = (req.body && (req.body.first_user || req.body.admin_user)) || null;
    if (!nombre || !direccion || !ciudad) {
      return res.status(400).json({ message: 'Faltan campos requeridos: nombre, direccion, ciudad' });
    }
    const result = await pool.query(
      `INSERT INTO restaurantes (nombre, direccion, ciudad, telefono, email, activo, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING *`,
      [nombre, direccion, ciudad, telefono || null, email || null]
    );
    // Auditoría
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: 'crear',
      tabla_afectada: 'restaurantes',
      id_registro: result.rows[0].id_restaurante,
      datos_nuevos: result.rows[0]
    });
    logger.info('Restaurante creado: %s', nombre);
    const restaurante = result.rows[0];

    let createdSucursal: any = null;
    let createdUser: any = null;

    // Crear sucursal principal automáticamente
    try {
      const suc = await pool.query(
        `INSERT INTO sucursales (nombre, ciudad, direccion, activo, created_at, id_restaurante)
         VALUES ($1, $2, $3, true, NOW(), $4) RETURNING *`,
        ['Sucursal Principal', ciudad, direccion, restaurante.id_restaurante]
      );
      createdSucursal = suc.rows[0];
    } catch (e) {
      // Continuar aunque no se pueda crear la sucursal
    }

    // Crear primer usuario admin del restaurante (en tabla vendedores del POS)
    if (first_user && first_user.nombre && (first_user.username || first_user.email) && first_user.password) {
      try {
        const username = first_user.username || (first_user.email || '').split('@')[0] || `admin_${restaurante.id_restaurante}`;
        const password_hash = await bcrypt.hash(String(first_user.password), 10);
        const vend = await pool.query(
          `INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, created_at, id_sucursal, id_restaurante)
           VALUES ($1, $2, $3, $4, 'admin', true, NOW(), $5, $6)
           RETURNING id_vendedor, nombre, username, email, rol, id_sucursal, id_restaurante`,
          [first_user.nombre, username, first_user.email || null, password_hash, createdSucursal ? createdSucursal.id_sucursal : null, restaurante.id_restaurante]
        );
        createdUser = vend.rows[0];
      } catch (e) {
        // Ignorar fallo de creación de usuario inicial, pero devolver advertencia
      }
    }

    res.status(201).json({ data: restaurante, sucursal: createdSucursal, first_user: createdUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as any).code : undefined;
    if (code === '23505') {
      return res.status(409).json({ message: 'El restaurante ya existe' });
    }
    logger.error('Error al crear restaurante: %s', message);
    res.status(500).json({ error: 'Error al crear restaurante', detail: message });
  }
};

// Editar restaurante
export const updateRestaurante = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, ciudad, telefono, email } = req.body;
    const first_user = (req.body && (req.body.first_user || req.body.admin_user)) || null;
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM restaurantes WHERE id_restaurante = $1', [id]);
    if (prev.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (nombre) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
    if (direccion) { fields.push(`direccion = $${idx++}`); values.push(direccion); }
    if (ciudad) { fields.push(`ciudad = $${idx++}`); values.push(ciudad); }
    if (telefono !== undefined) { fields.push(`telefono = $${idx++}`); values.push(telefono); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    let updatedRow = null as any;
    if (fields.length > 0) {
      const query = `UPDATE restaurantes SET ${fields.join(', ')} WHERE id_restaurante = $${idx} RETURNING *`;
      values.push(id);
      const result = await pool.query(query, values);
      updatedRow = result.rows[0] || null;
    }

    // Crear primer usuario (admin) si se envía en el payload
    let createdUser: any = null;
    if (first_user) {
      const username: string | undefined = first_user.username;
      const password: string | undefined = first_user.password;
      const nombreUser: string | undefined = first_user.nombre;
      const emailUser: string | null = first_user.email || null;
      if (!username || !password || !nombreUser) {
        return res.status(400).json({ message: 'Para crear el usuario se requiere nombre, username y password' });
      }
      // Buscar o crear una sucursal del restaurante
      let id_sucursal: number | null = null;
      try {
        const suc = await pool.query('SELECT id_sucursal FROM sucursales WHERE id_restaurante = $1 AND activo = true ORDER BY created_at ASC LIMIT 1', [id]);
        if (suc.rows.length) {
          id_sucursal = suc.rows[0].id_sucursal;
        } else {
          const newSuc = await pool.query(
            `INSERT INTO sucursales (nombre, ciudad, direccion, activo, created_at, id_restaurante)
             SELECT 'Sucursal Principal', ciudad, direccion, true, NOW(), id_restaurante FROM restaurantes WHERE id_restaurante = $1
             RETURNING id_sucursal`,
            [id]
          );
          id_sucursal = newSuc.rows[0].id_sucursal;
        }
      } catch (e) {
        // Si falla crear/obtener sucursal, mantener null y continuar (por si la columna permite null)
      }
      try {
        const password_hash = await bcrypt.hash(String(password), 10);
        const vend = await pool.query(
          `INSERT INTO vendedores (nombre, username, email, password_hash, rol, activo, created_at, id_sucursal, id_restaurante)
           VALUES ($1, $2, $3, $4, 'admin', true, NOW(), $5, $6)
           RETURNING id_vendedor, nombre, username, email, rol, id_sucursal, id_restaurante`,
          [nombreUser, username, emailUser, password_hash, id_sucursal, id]
        );
        createdUser = vend.rows[0];
      } catch (e: any) {
        const code = e && typeof e === 'object' && 'code' in e ? (e as any).code : undefined;
        if (code === '23505') {
          return res.status(409).json({ message: 'El username ya existe en el sistema.' });
        }
        throw e;
      }
    }
    // Auditoría
    if (updatedRow) {
      await registrarAuditoria({
        id_usuario: (req as any).admin?.id,
        accion: 'editar',
        tabla_afectada: 'restaurantes',
        id_registro: Number(id),
        datos_anteriores: prev.rows[0],
        datos_nuevos: updatedRow
      });
      logger.info('Restaurante editado: %s', updatedRow.nombre);
    }
    res.json({ data: updatedRow, first_user: createdUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al editar restaurante: %s', message);
    res.status(500).json({ error: 'Error al editar restaurante', detail: message });
  }
};

// Listar servicios POS de un restaurante
export const getServiciosRestaurante = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM servicios_restaurante WHERE id_restaurante = $1 ORDER BY creado_en DESC',
      [id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar servicios POS: %s', message);
    res.status(500).json({ error: 'Error al listar servicios POS', detail: message });
  }
};

// Crear servicio POS para un restaurante
export const createServicioRestaurante = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre_plan, descripcion_plan, fecha_inicio, fecha_fin, estado_suscripcion, precio_mensual, funcionalidades_json } = req.body;
    if (!nombre_plan) {
      return res.status(400).json({ message: 'El campo nombre_plan es requerido' });
    }
    // Asegurar fecha_inicio por defecto ahora si no viene en el payload, para no anular el DEFAULT del DB con NULL
    const fechaInicioValue = fecha_inicio ? new Date(fecha_inicio).toISOString() : new Date().toISOString();
    const fechaFinValue = fecha_fin ? new Date(fecha_fin).toISOString() : null;

    const result = await pool.query(
      `INSERT INTO servicios_restaurante (id_restaurante, nombre_plan, descripcion_plan, fecha_inicio, fecha_fin, estado_suscripcion, precio_mensual, funcionalidades_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        id,
        nombre_plan,
        descripcion_plan || null,
        fechaInicioValue,
        fechaFinValue,
        estado_suscripcion || 'activo',
        precio_mensual !== undefined && precio_mensual !== null ? precio_mensual : null,
        funcionalidades_json ? JSON.stringify(funcionalidades_json) : '{}'
      ]
    );
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: 'crear',
      tabla_afectada: 'servicios_restaurante',
      id_registro: result.rows[0].id,
      datos_nuevos: result.rows[0]
    });
    logger.info('Servicio POS creado para restaurante %s: %s', id, nombre_plan);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al crear servicio POS: %s', message);
    res.status(500).json({ error: 'Error al crear servicio POS', detail: message });
  }
};

// Actualizar servicio POS de un restaurante
export const updateServicioRestaurante = async (req: Request, res: Response) => {
  try {
    const { id, id_servicio } = req.params;
    const { nombre_plan, descripcion_plan, fecha_inicio, fecha_fin, estado_suscripcion, precio_mensual, funcionalidades_json } = req.body;
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM servicios_restaurante WHERE id = $1 AND id_restaurante = $2', [id_servicio, id]);
    if (prev.rows.length === 0) {
      return res.status(404).json({ message: 'Servicio POS no encontrado' });
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (nombre_plan) { fields.push(`nombre_plan = $${idx++}`); values.push(nombre_plan); }
    if (descripcion_plan !== undefined) { fields.push(`descripcion_plan = $${idx++}`); values.push(descripcion_plan); }
    if (fecha_inicio) { fields.push(`fecha_inicio = $${idx++}`); values.push(fecha_inicio); }
    if (fecha_fin) { fields.push(`fecha_fin = $${idx++}`); values.push(fecha_fin); }
    if (estado_suscripcion) { fields.push(`estado_suscripcion = $${idx++}`); values.push(estado_suscripcion); }
    if (precio_mensual !== undefined) { fields.push(`precio_mensual = $${idx++}`); values.push(precio_mensual); }
    if (funcionalidades_json !== undefined) { fields.push(`funcionalidades_json = $${idx++}`); values.push(JSON.stringify(funcionalidades_json)); }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Nada que actualizar' });
    }
    const query = `UPDATE servicios_restaurante SET ${fields.join(', ')} WHERE id = $${idx} AND id_restaurante = $${idx+1} RETURNING *`;
    values.push(id_servicio, id);
    const result = await pool.query(query, values);
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: 'editar',
      tabla_afectada: 'servicios_restaurante',
      id_registro: Number(id_servicio),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Servicio POS editado para restaurante %s: %s', id, nombre_plan || prev.rows[0].nombre_plan);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al editar servicio POS: %s', message);
    res.status(500).json({ error: 'Error al editar servicio POS', detail: message });
  }
};

// Cambiar estado de suscripción de un servicio POS
export const updateEstadoServicioRestaurante = async (req: Request, res: Response) => {
  try {
    const { id, id_servicio } = req.params;
    const { estado_suscripcion } = req.body;
    if (!estado_suscripcion) {
      return res.status(400).json({ message: 'El campo estado_suscripcion es requerido' });
    }
    // Obtener datos anteriores para auditoría
    const prev = await pool.query('SELECT * FROM servicios_restaurante WHERE id = $1 AND id_restaurante = $2', [id_servicio, id]);
    if (prev.rows.length === 0) {
      return res.status(404).json({ message: 'Servicio POS no encontrado' });
    }
    const result = await pool.query(
      'UPDATE servicios_restaurante SET estado_suscripcion = $1 WHERE id = $2 AND id_restaurante = $3 RETURNING *',
      [estado_suscripcion, id_servicio, id]
    );
    await registrarAuditoria({
      id_usuario: (req as any).admin?.id,
      accion: 'cambiar_estado',
      tabla_afectada: 'servicios_restaurante',
      id_registro: Number(id_servicio),
      datos_anteriores: prev.rows[0],
      datos_nuevos: result.rows[0]
    });
    logger.info('Estado de servicio POS cambiado para restaurante %s: %s', id, estado_suscripcion);
    res.json({ data: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al cambiar estado de servicio POS: %s', message);
    res.status(500).json({ error: 'Error al cambiar estado de servicio POS', detail: message });
  }
}; 