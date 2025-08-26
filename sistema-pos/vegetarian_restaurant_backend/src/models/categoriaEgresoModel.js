const { pool } = require('../config/database');

const CategoriaEgresoModel = {
  // =====================================================
  // OPERACIONES CRUD BÁSICAS
  // =====================================================

  /**
   * Obtener todas las categorías de egresos de un restaurante
   */
  async getAllCategorias(id_restaurante, incluirInactivas = false) {
    let query = `
      SELECT 
        ce.id_categoria_egreso,
        ce.nombre,
        ce.descripcion,
        ce.color,
        ce.icono,
        ce.activo,
        ce.created_at,
        ce.updated_at,
        COUNT(e.id_egreso) as total_egresos,
        COALESCE(SUM(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE 0 END), 0) as total_gastado
      FROM categorias_egresos ce
      LEFT JOIN egresos e ON ce.id_categoria_egreso = e.id_categoria_egreso
      WHERE ce.id_restaurante = $1
    `;

    const params = [id_restaurante];

    if (!incluirInactivas) {
      query += ` AND ce.activo = TRUE`;
    }

    query += `
      GROUP BY ce.id_categoria_egreso, ce.nombre, ce.descripcion, ce.color, ce.icono, ce.activo, ce.created_at, ce.updated_at
      ORDER BY ce.nombre ASC
    `;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  /**
   * Obtener una categoría por ID
   */
  async getCategoriaById(id_categoria_egreso, id_restaurante) {
    const query = `
      SELECT 
        ce.*,
        COUNT(e.id_egreso) as total_egresos,
        COALESCE(SUM(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE 0 END), 0) as total_gastado,
        COALESCE(SUM(CASE WHEN e.estado = 'pendiente' THEN e.monto ELSE 0 END), 0) as total_pendiente
      FROM categorias_egresos ce
      LEFT JOIN egresos e ON ce.id_categoria_egreso = e.id_categoria_egreso
      WHERE ce.id_categoria_egreso = $1 AND ce.id_restaurante = $2
      GROUP BY ce.id_categoria_egreso
    `;

    const { rows } = await pool.query(query, [id_categoria_egreso, id_restaurante]);
    return rows[0] || null;
  },

  /**
   * Crear una nueva categoría de egreso
   */
  async createCategoria(categoriaData, id_restaurante) {
    const { nombre, descripcion, color, icono } = categoriaData;

    const query = `
      INSERT INTO categorias_egresos (nombre, descripcion, color, icono, id_restaurante)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      nombre,
      descripcion || null,
      color || '#6B7280',
      icono || 'DollarSign',
      id_restaurante
    ]);

    return rows[0];
  },

  /**
   * Actualizar una categoría de egreso
   */
  async updateCategoria(id_categoria_egreso, categoriaData, id_restaurante) {
    const { nombre, descripcion, color, icono, activo } = categoriaData;

    const query = `
      UPDATE categorias_egresos 
      SET 
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        color = COALESCE($3, color),
        icono = COALESCE($4, icono),
        activo = COALESCE($5, activo),
        updated_at = NOW()
      WHERE id_categoria_egreso = $6 AND id_restaurante = $7
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      nombre, descripcion, color, icono, activo,
      id_categoria_egreso, id_restaurante
    ]);

    return rows[0] || null;
  },

  /**
   * Eliminar una categoría (soft delete)
   */
  async deleteCategoria(id_categoria_egreso, id_restaurante) {
    // Verificar si hay egresos asociados
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM egresos 
      WHERE id_categoria_egreso = $1 AND id_restaurante = $2
    `;

    const { rows: checkRows } = await pool.query(checkQuery, [id_categoria_egreso, id_restaurante]);

    if (parseInt(checkRows[0].count) > 0) {
      // Si hay egresos asociados, solo desactivar
      const query = `
        UPDATE categorias_egresos 
        SET activo = FALSE, updated_at = NOW()
        WHERE id_categoria_egreso = $1 AND id_restaurante = $2
        RETURNING *
      `;

      const { rows } = await pool.query(query, [id_categoria_egreso, id_restaurante]);
      return { success: true, categoria: rows[0], message: 'Categoría desactivada (tiene egresos asociados)' };
    } else {
      // Si no hay egresos asociados, eliminar completamente
      const query = `
        DELETE FROM categorias_egresos 
        WHERE id_categoria_egreso = $1 AND id_restaurante = $2
        RETURNING *
      `;

      const { rows } = await pool.query(query, [id_categoria_egreso, id_restaurante]);
      return { success: true, categoria: rows[0], message: 'Categoría eliminada completamente' };
    }
  },

  // =====================================================
  // OPERACIONES ESPECIALES
  // =====================================================

  /**
   * Obtener categorías más utilizadas
   */
  async getCategoriasPopulares(id_restaurante, limite = 5) {
    const query = `
      SELECT 
        ce.id_categoria_egreso,
        ce.nombre,
        ce.color,
        ce.icono,
        COUNT(e.id_egreso) as total_egresos,
        COALESCE(SUM(e.monto), 0) as total_monto
      FROM categorias_egresos ce
      INNER JOIN egresos e ON ce.id_categoria_egreso = e.id_categoria_egreso
      WHERE ce.id_restaurante = $1 AND ce.activo = TRUE
      GROUP BY ce.id_categoria_egreso, ce.nombre, ce.color, ce.icono
      ORDER BY total_egresos DESC, total_monto DESC
      LIMIT $2
    `;

    const { rows } = await pool.query(query, [id_restaurante, limite]);
    return rows;
  },

  /**
   * Obtener categorías con mayor gasto
   */
  async getCategoriasConMayorGasto(id_restaurante, fecha_inicio = null, fecha_fin = null, limite = 10) {
    let query = `
      SELECT 
        ce.id_categoria_egreso,
        ce.nombre,
        ce.color,
        ce.icono,
        COUNT(e.id_egreso) as total_egresos,
        COALESCE(SUM(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE 0 END), 0) as total_gastado,
        COALESCE(AVG(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE NULL END), 0) as promedio_gasto
      FROM categorias_egresos ce
      LEFT JOIN egresos e ON ce.id_categoria_egreso = e.id_categoria_egreso
      WHERE ce.id_restaurante = $1 AND ce.activo = TRUE
    `;

    const params = [id_restaurante];
    let paramIndex = 2;

    if (fecha_inicio) {
      query += ` AND (e.fecha_egreso IS NULL OR e.fecha_egreso >= $${paramIndex})`;
      params.push(fecha_inicio);
      paramIndex++;
    }

    if (fecha_fin) {
      query += ` AND (e.fecha_egreso IS NULL OR e.fecha_egreso <= $${paramIndex})`;
      params.push(fecha_fin);
      paramIndex++;
    }

    query += `
      GROUP BY ce.id_categoria_egreso, ce.nombre, ce.color, ce.icono
      ORDER BY total_gastado DESC
      LIMIT $${paramIndex}
    `;

    params.push(limite);

    const { rows } = await pool.query(query, params);
    return rows;
  },

  /**
   * Verificar si existe una categoría con el mismo nombre
   */
  async existeCategoriaNombre(nombre, id_restaurante, excluirId = null) {
    let query = `
      SELECT id_categoria_egreso 
      FROM categorias_egresos 
      WHERE LOWER(nombre) = LOWER($1) AND id_restaurante = $2
    `;

    const params = [nombre, id_restaurante];

    if (excluirId) {
      query += ` AND id_categoria_egreso != $3`;
      params.push(excluirId);
    }

    const { rows } = await pool.query(query, params);
    return rows.length > 0;
  },

  /**
   * Obtener estadísticas de una categoría por período
   */
  async getEstadisticasCategoria(id_categoria_egreso, id_restaurante, fecha_inicio, fecha_fin) {
    const query = `
      SELECT 
        ce.nombre as categoria_nombre,
        ce.color,
        ce.icono,
        COUNT(e.id_egreso) as total_egresos,
        COUNT(CASE WHEN e.estado = 'pendiente' THEN 1 END) as egresos_pendientes,
        COUNT(CASE WHEN e.estado = 'aprobado' THEN 1 END) as egresos_aprobados,
        COUNT(CASE WHEN e.estado = 'pagado' THEN 1 END) as egresos_pagados,
        COUNT(CASE WHEN e.estado = 'rechazado' THEN 1 END) as egresos_rechazados,
        COALESCE(SUM(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE 0 END), 0) as total_gastado,
        COALESCE(SUM(CASE WHEN e.estado = 'pendiente' THEN e.monto ELSE 0 END), 0) as total_pendiente,
        COALESCE(MIN(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto END), 0) as gasto_minimo,
        COALESCE(MAX(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto END), 0) as gasto_maximo,
        COALESCE(AVG(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto END), 0) as gasto_promedio
      FROM categorias_egresos ce
      LEFT JOIN egresos e ON ce.id_categoria_egreso = e.id_categoria_egreso 
        AND e.fecha_egreso BETWEEN $3 AND $4
      WHERE ce.id_categoria_egreso = $1 AND ce.id_restaurante = $2
      GROUP BY ce.id_categoria_egreso, ce.nombre, ce.color, ce.icono
    `;

    const { rows } = await pool.query(query, [id_categoria_egreso, id_restaurante, fecha_inicio, fecha_fin]);
    return rows[0] || null;
  },

  /**
   * Obtener categorías con sus últimos egresos
   */
  async getCategoriasConUltimosEgresos(id_restaurante, limite_categorias = 10, limite_egresos = 3) {
    const query = `
      WITH ultimos_egresos AS (
        SELECT 
          e.id_categoria_egreso,
          e.id_egreso,
          e.concepto,
          e.monto,
          e.fecha_egreso,
          e.estado,
          ROW_NUMBER() OVER (PARTITION BY e.id_categoria_egreso ORDER BY e.fecha_egreso DESC, e.created_at DESC) as rn
        FROM egresos e
        WHERE e.id_restaurante = $1
      )
      SELECT 
        ce.id_categoria_egreso,
        ce.nombre,
        ce.descripcion,
        ce.color,
        ce.icono,
        COUNT(e.id_egreso) as total_egresos,
        COALESCE(SUM(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE 0 END), 0) as total_gastado,
        JSON_AGG(
          CASE 
            WHEN ue.rn <= $3 THEN 
              JSON_BUILD_OBJECT(
                'id_egreso', ue.id_egreso,
                'concepto', ue.concepto,
                'monto', ue.monto,
                'fecha_egreso', ue.fecha_egreso,
                'estado', ue.estado
              )
            ELSE NULL
          END
        ) FILTER (WHERE ue.rn <= $3) as ultimos_egresos
      FROM categorias_egresos ce
      LEFT JOIN egresos e ON ce.id_categoria_egreso = e.id_categoria_egreso
      LEFT JOIN ultimos_egresos ue ON ce.id_categoria_egreso = ue.id_categoria_egreso
      WHERE ce.id_restaurante = $1 AND ce.activo = TRUE
      GROUP BY ce.id_categoria_egreso, ce.nombre, ce.descripcion, ce.color, ce.icono
      ORDER BY total_gastado DESC
      LIMIT $2
    `;

    const { rows } = await pool.query(query, [id_restaurante, limite_categorias, limite_egresos]);
    return rows;
  }
};

module.exports = CategoriaEgresoModel;
