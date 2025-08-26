const { pool } = require('../config/database');

const PresupuestoEgresoModel = {
  // =====================================================
  // OPERACIONES CRUD BÁSICAS
  // =====================================================

  /**
   * Obtener todos los presupuestos de un restaurante
   */
  async getAllPresupuestos(id_restaurante, filtros = {}) {
    let query = `
      SELECT 
        pe.id_presupuesto,
        pe.anio,
        pe.mes,
        pe.monto_presupuestado,
        pe.monto_gastado,
        pe.activo,
        pe.created_at,
        pe.updated_at,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        ce.icono as categoria_icono,
        (pe.monto_presupuestado - pe.monto_gastado) as diferencia,
        CASE 
          WHEN pe.monto_presupuestado > 0 THEN 
            ROUND((pe.monto_gastado * 100.0 / pe.monto_presupuestado), 2)
          ELSE 0 
        END as porcentaje_ejecutado,
        CASE 
          WHEN pe.monto_gastado > pe.monto_presupuestado THEN 'excedido'
          WHEN pe.monto_gastado >= (pe.monto_presupuestado * 0.9) THEN 'alerta'
          WHEN pe.monto_gastado >= (pe.monto_presupuestado * 0.7) THEN 'precaucion'
          ELSE 'normal'
        END as estado_presupuesto
      FROM presupuestos_egresos pe
      LEFT JOIN categorias_egresos ce ON pe.id_categoria_egreso = ce.id_categoria_egreso
      WHERE pe.id_restaurante = $1
    `;

    const params = [id_restaurante];
    let paramIndex = 2;

    // Aplicar filtros
    if (filtros.anio) {
      query += ` AND pe.anio = $${paramIndex}`;
      params.push(filtros.anio);
      paramIndex++;
    }

    if (filtros.mes) {
      query += ` AND pe.mes = $${paramIndex}`;
      params.push(filtros.mes);
      paramIndex++;
    }

    if (filtros.id_categoria_egreso) {
      query += ` AND pe.id_categoria_egreso = $${paramIndex}`;
      params.push(filtros.id_categoria_egreso);
      paramIndex++;
    }

    if (filtros.activo !== undefined) {
      query += ` AND pe.activo = $${paramIndex}`;
      params.push(filtros.activo);
      paramIndex++;
    }

    query += ` ORDER BY pe.anio DESC, pe.mes DESC, ce.nombre ASC`;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  /**
   * Obtener un presupuesto por ID
   */
  async getPresupuestoById(id_presupuesto, id_restaurante) {
    const query = `
      SELECT 
        pe.*,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        ce.icono as categoria_icono,
        (pe.monto_presupuestado - pe.monto_gastado) as diferencia,
        CASE 
          WHEN pe.monto_presupuestado > 0 THEN 
            ROUND((pe.monto_gastado * 100.0 / pe.monto_presupuestado), 2)
          ELSE 0 
        END as porcentaje_ejecutado
      FROM presupuestos_egresos pe
      LEFT JOIN categorias_egresos ce ON pe.id_categoria_egreso = ce.id_categoria_egreso
      WHERE pe.id_presupuesto = $1 AND pe.id_restaurante = $2
    `;

    const { rows } = await pool.query(query, [id_presupuesto, id_restaurante]);
    return rows[0] || null;
  },

  /**
   * Crear un nuevo presupuesto
   */
  async createPresupuesto(presupuestoData, id_restaurante) {
    const { anio, mes, id_categoria_egreso, monto_presupuestado } = presupuestoData;

    // Verificar si ya existe un presupuesto para esta categoría, año y mes
    const existeQuery = `
      SELECT id_presupuesto 
      FROM presupuestos_egresos 
      WHERE id_categoria_egreso = $1 AND anio = $2 AND mes = $3 AND id_restaurante = $4
    `;

    const { rows: existeRows } = await pool.query(existeQuery, [
      id_categoria_egreso, anio, mes, id_restaurante
    ]);

    if (existeRows.length > 0) {
      throw new Error('Ya existe un presupuesto para esta categoría en el período especificado');
    }

    // Calcular el monto gastado actual para el período
    const gastoQuery = `
      SELECT COALESCE(SUM(monto), 0) as monto_gastado
      FROM egresos 
      WHERE id_categoria_egreso = $1 
        AND id_restaurante = $2
        AND estado IN ('pagado', 'aprobado')
        AND EXTRACT(YEAR FROM fecha_egreso) = $3
        AND EXTRACT(MONTH FROM fecha_egreso) = $4
    `;

    const { rows: gastoRows } = await pool.query(gastoQuery, [
      id_categoria_egreso, id_restaurante, anio, mes
    ]);

    const montoGastado = parseFloat(gastoRows[0].monto_gastado) || 0;

    // Crear el presupuesto
    const insertQuery = `
      INSERT INTO presupuestos_egresos (anio, mes, id_categoria_egreso, monto_presupuestado, monto_gastado, id_restaurante)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const { rows } = await pool.query(insertQuery, [
      anio, mes, id_categoria_egreso, monto_presupuestado, montoGastado, id_restaurante
    ]);

    return rows[0];
  },

  /**
   * Actualizar un presupuesto
   */
  async updatePresupuesto(id_presupuesto, presupuestoData, id_restaurante) {
    const { monto_presupuestado, activo } = presupuestoData;

    const query = `
      UPDATE presupuestos_egresos 
      SET 
        monto_presupuestado = COALESCE($1, monto_presupuestado),
        activo = COALESCE($2, activo),
        updated_at = NOW()
      WHERE id_presupuesto = $3 AND id_restaurante = $4
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      monto_presupuestado, activo, id_presupuesto, id_restaurante
    ]);

    return rows[0] || null;
  },

  /**
   * Eliminar un presupuesto
   */
  async deletePresupuesto(id_presupuesto, id_restaurante) {
    const query = `
      DELETE FROM presupuestos_egresos 
      WHERE id_presupuesto = $1 AND id_restaurante = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [id_presupuesto, id_restaurante]);
    return rows[0] || null;
  },

  // =====================================================
  // OPERACIONES ESPECIALES
  // =====================================================

  /**
   * Obtener presupuestos por período
   */
  async getPresupuestosPorPeriodo(id_restaurante, anio, mes = null) {
    let query = `
      SELECT 
        pe.id_presupuesto,
        pe.anio,
        pe.mes,
        pe.monto_presupuestado,
        pe.monto_gastado,
        pe.activo,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        ce.icono as categoria_icono,
        (pe.monto_presupuestado - pe.monto_gastado) as diferencia,
        CASE 
          WHEN pe.monto_presupuestado > 0 THEN 
            ROUND((pe.monto_gastado * 100.0 / pe.monto_presupuestado), 2)
          ELSE 0 
        END as porcentaje_ejecutado
      FROM presupuestos_egresos pe
      LEFT JOIN categorias_egresos ce ON pe.id_categoria_egreso = ce.id_categoria_egreso
      WHERE pe.id_restaurante = $1 AND pe.anio = $2 AND pe.activo = TRUE
    `;

    const params = [id_restaurante, anio];

    if (mes) {
      query += ` AND pe.mes = $3`;
      params.push(mes);
    }

    query += ` ORDER BY pe.mes ASC, ce.nombre ASC`;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  /**
   * Obtener resumen de presupuestos por año
   */
  async getResumenAnual(id_restaurante, anio) {
    const query = `
      SELECT 
        pe.anio,
        COUNT(*) as total_presupuestos,
        COUNT(CASE WHEN pe.activo THEN 1 END) as presupuestos_activos,
        COALESCE(SUM(pe.monto_presupuestado), 0) as total_presupuestado,
        COALESCE(SUM(pe.monto_gastado), 0) as total_gastado,
        COALESCE(SUM(pe.monto_presupuestado - pe.monto_gastado), 0) as diferencia_total,
        CASE 
          WHEN SUM(pe.monto_presupuestado) > 0 THEN 
            ROUND((SUM(pe.monto_gastado) * 100.0 / SUM(pe.monto_presupuestado)), 2)
          ELSE 0 
        END as porcentaje_ejecutado_total,
        COUNT(CASE WHEN pe.monto_gastado > pe.monto_presupuestado THEN 1 END) as presupuestos_excedidos
      FROM presupuestos_egresos pe
      WHERE pe.id_restaurante = $1 AND pe.anio = $2
      GROUP BY pe.anio
    `;

    const { rows } = await pool.query(query, [id_restaurante, anio]);
    return rows[0] || null;
  },

  /**
   * Obtener presupuestos excedidos
   */
  async getPresupuestosExcedidos(id_restaurante, anio = null, mes = null) {
    let query = `
      SELECT 
        pe.id_presupuesto,
        pe.anio,
        pe.mes,
        pe.monto_presupuestado,
        pe.monto_gastado,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        (pe.monto_gastado - pe.monto_presupuestado) as exceso,
        ROUND(((pe.monto_gastado - pe.monto_presupuestado) * 100.0 / pe.monto_presupuestado), 2) as porcentaje_exceso
      FROM presupuestos_egresos pe
      LEFT JOIN categorias_egresos ce ON pe.id_categoria_egreso = ce.id_categoria_egreso
      WHERE pe.id_restaurante = $1 
        AND pe.monto_gastado > pe.monto_presupuestado
        AND pe.activo = TRUE
    `;

    const params = [id_restaurante];
    let paramIndex = 2;

    if (anio) {
      query += ` AND pe.anio = $${paramIndex}`;
      params.push(anio);
      paramIndex++;
    }

    if (mes) {
      query += ` AND pe.mes = $${paramIndex}`;
      params.push(mes);
      paramIndex++;
    }

    query += ` ORDER BY porcentaje_exceso DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  /**
   * Obtener presupuestos en alerta (cerca del límite)
   */
  async getPresupuestosEnAlerta(id_restaurante, umbral = 90, anio = null, mes = null) {
    let query = `
      SELECT 
        pe.id_presupuesto,
        pe.anio,
        pe.mes,
        pe.monto_presupuestado,
        pe.monto_gastado,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        (pe.monto_presupuestado - pe.monto_gastado) as disponible,
        ROUND((pe.monto_gastado * 100.0 / pe.monto_presupuestado), 2) as porcentaje_ejecutado
      FROM presupuestos_egresos pe
      LEFT JOIN categorias_egresos ce ON pe.id_categoria_egreso = ce.id_categoria_egreso
      WHERE pe.id_restaurante = $1 
        AND pe.monto_presupuestado > 0
        AND (pe.monto_gastado * 100.0 / pe.monto_presupuestado) >= $2
        AND pe.monto_gastado <= pe.monto_presupuestado
        AND pe.activo = TRUE
    `;

    const params = [id_restaurante, umbral];
    let paramIndex = 3;

    if (anio) {
      query += ` AND pe.anio = $${paramIndex}`;
      params.push(anio);
      paramIndex++;
    }

    if (mes) {
      query += ` AND pe.mes = $${paramIndex}`;
      params.push(mes);
      paramIndex++;
    }

    query += ` ORDER BY porcentaje_ejecutado DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  /**
   * Actualizar montos gastados de todos los presupuestos
   */
  async actualizarMontosGastados(id_restaurante, anio = null, mes = null) {
    let query = `
      UPDATE presupuestos_egresos 
      SET monto_gastado = (
        SELECT COALESCE(SUM(e.monto), 0)
        FROM egresos e
        WHERE e.id_categoria_egreso = presupuestos_egresos.id_categoria_egreso
          AND e.id_restaurante = presupuestos_egresos.id_restaurante
          AND e.estado IN ('pagado', 'aprobado')
          AND EXTRACT(YEAR FROM e.fecha_egreso) = presupuestos_egresos.anio
          AND EXTRACT(MONTH FROM e.fecha_egreso) = presupuestos_egresos.mes
      ),
      updated_at = NOW()
      WHERE id_restaurante = $1
    `;

    const params = [id_restaurante];
    let paramIndex = 2;

    if (anio) {
      query += ` AND anio = $${paramIndex}`;
      params.push(anio);
      paramIndex++;
    }

    if (mes) {
      query += ` AND mes = $${paramIndex}`;
      params.push(mes);
      paramIndex++;
    }

    const { rowCount } = await pool.query(query, params);
    return rowCount;
  },

  /**
   * Copiar presupuestos de un período a otro
   */
  async copiarPresupuestos(id_restaurante, anioOrigen, mesOrigen, anioDestino, mesDestino) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verificar que no existan presupuestos en el período destino
      const existenQuery = `
        SELECT COUNT(*) as count
        FROM presupuestos_egresos
        WHERE id_restaurante = $1 AND anio = $2 AND mes = $3
      `;

      const { rows: existenRows } = await client.query(existenQuery, [
        id_restaurante, anioDestino, mesDestino
      ]);

      if (parseInt(existenRows[0].count) > 0) {
        throw new Error('Ya existen presupuestos en el período destino');
      }

      // Copiar presupuestos
      const copiarQuery = `
        INSERT INTO presupuestos_egresos (
          anio, mes, id_categoria_egreso, monto_presupuestado, 
          monto_gastado, id_restaurante
        )
        SELECT 
          $3 as anio, 
          $4 as mes, 
          id_categoria_egreso, 
          monto_presupuestado,
          0 as monto_gastado, -- Resetear el monto gastado
          id_restaurante
        FROM presupuestos_egresos
        WHERE id_restaurante = $1 AND anio = $2 AND mes = $5 AND activo = TRUE
      `;

      const { rowCount } = await client.query(copiarQuery, [
        id_restaurante, anioOrigen, anioDestino, mesDestino, mesOrigen
      ]);

      await client.query('COMMIT');
      return rowCount;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Obtener evolución de presupuestos por categoría
   */
  async getEvolucionPorCategoria(id_restaurante, id_categoria_egreso, anio, mesesAtras = 12) {
    const query = `
      SELECT 
        pe.anio,
        pe.mes,
        pe.monto_presupuestado,
        pe.monto_gastado,
        (pe.monto_presupuestado - pe.monto_gastado) as diferencia,
        CASE 
          WHEN pe.monto_presupuestado > 0 THEN 
            ROUND((pe.monto_gastado * 100.0 / pe.monto_presupuestado), 2)
          ELSE 0 
        END as porcentaje_ejecutado
      FROM presupuestos_egresos pe
      WHERE pe.id_restaurante = $1 
        AND pe.id_categoria_egreso = $2
        AND (
          (pe.anio = $3) OR 
          (pe.anio = $3 - 1 AND pe.mes >= (12 - $4 + 1))
        )
      ORDER BY pe.anio ASC, pe.mes ASC
    `;

    const { rows } = await pool.query(query, [id_restaurante, id_categoria_egreso, anio, mesesAtras]);
    return rows;
  }
};

module.exports = PresupuestoEgresoModel;
