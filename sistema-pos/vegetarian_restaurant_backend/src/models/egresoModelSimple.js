const { pool } = require('../config/database');

const EgresoModelSimple = {
  /**
   * Obtener todos los egresos de un restaurante
   */
  async getAllEgresos(id_restaurante, filtros = {}) {
    let query = `
      SELECT 
        e.id_egreso,
        e.concepto,
        e.descripcion,
        e.monto,
        e.fecha_egreso,
        e.metodo_pago,
        e.proveedor_nombre,
        e.numero_factura,
        e.estado,
        e.registrado_por,
        e.id_sucursal,
        e.created_at,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        ce.icono as categoria_icono,
        v.nombre as registrado_por_nombre,
        s.nombre as sucursal_nombre
      FROM egresos e
      LEFT JOIN categorias_egresos ce ON e.id_categoria_egreso = ce.id_categoria_egreso
      LEFT JOIN vendedores v ON e.registrado_por = v.id_vendedor
      LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
      WHERE e.id_restaurante = $1
    `;

    const params = [id_restaurante];
    let paramIndex = 2;

    // Aplicar filtros
    if (filtros.fecha_inicio) {
      query += ` AND e.fecha_egreso >= $${paramIndex}`;
      params.push(filtros.fecha_inicio);
      paramIndex++;
    }

    if (filtros.fecha_fin) {
      query += ` AND e.fecha_egreso <= $${paramIndex}`;
      params.push(filtros.fecha_fin);
      paramIndex++;
    }

    if (filtros.id_categoria_egreso) {
      query += ` AND e.id_categoria_egreso = $${paramIndex}`;
      params.push(filtros.id_categoria_egreso);
      paramIndex++;
    }

    if (filtros.estado) {
      query += ` AND e.estado = $${paramIndex}`;
      params.push(filtros.estado);
      paramIndex++;
    }

    if (filtros.id_sucursal) {
      query += ` AND e.id_sucursal = $${paramIndex}`;
      params.push(filtros.id_sucursal);
      paramIndex++;
    }

    if (filtros.proveedor_nombre) {
      query += ` AND e.proveedor_nombre ILIKE $${paramIndex}`;
      params.push(`%${filtros.proveedor_nombre}%`);
      paramIndex++;
    }

    query += ` ORDER BY e.fecha_egreso DESC, e.created_at DESC`;

    // Aplicar paginación
    if (filtros.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filtros.limit);
      paramIndex++;
    }

    if (filtros.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filtros.offset);
      paramIndex++;
    }

    const { rows } = await pool.query(query, params);
    
    console.log('Backend - getAllEgresos - cantidad de egresos:', rows.length);
    
    return rows;
  },

  /**
   * Obtener un egreso por ID
   */
  async getEgresoById(id_egreso, id_restaurante) {
    const query = `
      SELECT 
        e.*,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        ce.icono as categoria_icono,
        v.nombre as registrado_por_nombre,
        v.username as registrado_por_username,
        s.nombre as sucursal_nombre
      FROM egresos e
      LEFT JOIN categorias_egresos ce ON e.id_categoria_egreso = ce.id_categoria_egreso
      LEFT JOIN vendedores v ON e.registrado_por = v.id_vendedor
      LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
      WHERE e.id_egreso = $1 AND e.id_restaurante = $2
    `;

    const { rows } = await pool.query(query, [id_egreso, id_restaurante]);
    return rows[0] || null;
  },

  /**
   * Crear un nuevo egreso
   */
  async createEgreso(egresoData, id_restaurante) {
    const {
      concepto,
      descripcion,
      monto,
      fecha_egreso,
      id_categoria_egreso,
      metodo_pago,
      proveedor_nombre,
      proveedor_documento,
      proveedor_telefono,
      proveedor_email,
      numero_factura,
      numero_recibo,
      numero_comprobante,
      estado,
      registrado_por,
      id_sucursal
    } = egresoData;

    const query = `
      INSERT INTO egresos (
        concepto, descripcion, monto, fecha_egreso, id_categoria_egreso,
        metodo_pago, proveedor_nombre, proveedor_documento, proveedor_telefono,
        proveedor_email, numero_factura, numero_recibo, numero_comprobante,
        estado, registrado_por, id_sucursal, id_restaurante
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const params = [
      concepto, descripcion, monto, fecha_egreso, id_categoria_egreso,
      metodo_pago, proveedor_nombre, proveedor_documento, proveedor_telefono,
      proveedor_email, numero_factura, numero_recibo, numero_comprobante,
      estado, registrado_por, id_sucursal, id_restaurante
    ];

    const { rows } = await pool.query(query, params);
    return rows[0];
  },

  /**
   * Actualizar un egreso
   */
  async updateEgreso(id_egreso, egresoData, id_restaurante) {
    const {
      concepto,
      descripcion,
      monto,
      fecha_egreso,
      id_categoria_egreso,
      metodo_pago,
      proveedor_nombre,
      proveedor_documento,
      proveedor_telefono,
      proveedor_email,
      numero_factura,
      numero_recibo,
      numero_comprobante,
      estado
    } = egresoData;

    const query = `
      UPDATE egresos SET
        concepto = $1, descripcion = $2, monto = $3, fecha_egreso = $4,
        id_categoria_egreso = $5, metodo_pago = $6, proveedor_nombre = $7,
        proveedor_documento = $8, proveedor_telefono = $9, proveedor_email = $10,
        numero_factura = $11, numero_recibo = $12, numero_comprobante = $13,
        estado = $14, updated_at = NOW()
      WHERE id_egreso = $15 AND id_restaurante = $16
      RETURNING *
    `;

    const params = [
      concepto, descripcion, monto, fecha_egreso, id_categoria_egreso,
      metodo_pago, proveedor_nombre, proveedor_documento, proveedor_telefono,
      proveedor_email, numero_factura, numero_recibo, numero_comprobante,
      estado, id_egreso, id_restaurante
    ];

    const { rows } = await pool.query(query, params);
    return rows[0] || null;
  },

  /**
   * Eliminar (cancelar) un egreso
   */
  async deleteEgreso(id_egreso, id_restaurante) {
    const query = `
      UPDATE egresos SET
        estado = 'cancelado', updated_at = NOW()
      WHERE id_egreso = $1 AND id_restaurante = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [id_egreso, id_restaurante]);
    return rows[0] || null;
  },

  /**
   * Obtener egresos pendientes de aprobación
   */
  async getEgresosPendientesAprobacion(id_restaurante) {
    const query = `
      SELECT 
        e.id_egreso,
        e.concepto,
        e.monto,
        e.fecha_egreso,
        e.proveedor_nombre,
        e.created_at,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        v.nombre as registrado_por_nombre,
        s.nombre as sucursal_nombre
      FROM egresos e
      LEFT JOIN categorias_egresos ce ON e.id_categoria_egreso = ce.id_categoria_egreso
      LEFT JOIN vendedores v ON e.registrado_por = v.id_vendedor
      LEFT JOIN sucursales s ON e.id_sucursal = s.id_sucursal
      WHERE e.id_restaurante = $1 AND e.estado = 'pendiente'
      ORDER BY e.created_at ASC
    `;

    const { rows } = await pool.query(query, [id_restaurante]);
    return rows;
  },

  /**
   * Obtener resumen de egresos por categoría
   */
  async getResumenPorCategoria(id_restaurante, filtros = {}) {
    let query = `
      SELECT 
        ce.id_categoria_egreso,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        ce.icono as categoria_icono,
        COUNT(e.id_egreso) as total_egresos,
        COALESCE(SUM(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE 0 END), 0) as total_gastado,
        COALESCE(SUM(CASE WHEN e.estado = 'pendiente' THEN e.monto ELSE 0 END), 0) as total_pendiente,
        COALESCE(AVG(CASE WHEN e.estado IN ('pagado', 'aprobado') THEN e.monto ELSE NULL END), 0) as promedio_gasto
      FROM categorias_egresos ce
      LEFT JOIN egresos e ON ce.id_categoria_egreso = e.id_categoria_egreso
    `;

    const params = [id_restaurante];
    let paramIndex = 2;

    query += ` WHERE ce.id_restaurante = $1 AND ce.activo = TRUE`;

    // Aplicar filtros de fecha si existen
    if (filtros.fecha_inicio) {
      query += ` AND (e.fecha_egreso IS NULL OR e.fecha_egreso >= $${paramIndex})`;
      params.push(filtros.fecha_inicio);
      paramIndex++;
    }

    if (filtros.fecha_fin) {
      query += ` AND (e.fecha_egreso IS NULL OR e.fecha_egreso <= $${paramIndex})`;
      params.push(filtros.fecha_fin);
      paramIndex++;
    }

    query += ` GROUP BY ce.id_categoria_egreso, ce.nombre, ce.color, ce.icono ORDER BY total_gastado DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  /**
   * Obtener total de egresos por período
   */
  async getTotalPorPeriodo(id_restaurante, fecha_inicio, fecha_fin, estado = null) {
    let query = `
      SELECT 
        COUNT(*) as total_egresos,
        COALESCE(SUM(monto), 0) as total_monto,
        COALESCE(AVG(monto), 0) as promedio_monto
      FROM egresos 
      WHERE id_restaurante = $1 
        AND fecha_egreso BETWEEN $2 AND $3
    `;

    const params = [id_restaurante, fecha_inicio, fecha_fin];

    if (estado) {
      query += ` AND estado = $4`;
      params.push(estado);
    }

    const { rows } = await pool.query(query, params);
    return rows[0];
  },

  /**
   * Obtener flujo de aprobaciones de un egreso
   */
  async getFlujoAprobaciones(id_egreso, id_restaurante) {
    // Por ahora retornamos un array vacío ya que no tenemos la tabla flujo_aprobaciones_egresos
    return [];
  }
};

module.exports = EgresoModelSimple;
