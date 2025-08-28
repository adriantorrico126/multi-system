const { pool } = require('../config/database');

const EgresoModel = {
  // =====================================================
  // OPERACIONES CRUD BÁSICAS
  // =====================================================

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
        e.es_recurrente,
        e.requiere_aprobacion,
        e.created_at,
        ce.nombre as categoria_nombre,
        ce.color as categoria_color,
        ce.icono as categoria_icono,
        v_reg.nombre as registrado_por_nombre,
        v_apr.nombre as aprobado_por_nombre,
        s.nombre as sucursal_nombre
      FROM egresos e
      LEFT JOIN categorias_egresos ce ON e.id_categoria_egreso = ce.id_categoria_egreso
      LEFT JOIN vendedores v_reg ON e.registrado_por = v_reg.id_vendedor
      LEFT JOIN vendedores v_apr ON e.aprobado_por = v_apr.id_vendedor
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
    
    // Debug: verificar datos enviados
    console.log('Backend - getAllEgresos - cantidad de egresos:', rows.length);
    if (rows.length > 0) {
      console.log('Backend - primer egreso:', {
        id: rows[0].id_egreso,
        concepto: rows[0].concepto,
        registrado_por_nombre: rows[0].registrado_por_nombre,
        estado: rows[0].estado
      });
      
      // Verificar si hay montos inválidos
      const montosInvalidos = rows.filter(row => 
        row.monto === null || row.monto === undefined || isNaN(Number(row.monto))
      );
      if (montosInvalidos.length > 0) {
        console.warn('Montos inválidos encontrados:', montosInvalidos.length);
      }
      
      // Verificar campos registrado_por_nombre
      const sinNombreCajero = rows.filter(row => 
        !row.registrado_por_nombre || row.registrado_por_nombre === null
      );
      if (sinNombreCajero.length > 0) {
        console.warn('Egresos sin nombre de cajero:', sinNombreCajero.length);
        console.log('Backend - ejemplos de egresos sin cajero:', sinNombreCajero.slice(0, 3).map(r => ({
          id: r.id_egreso,
          registrado_por: r.registrado_por,
          registrado_por_nombre: r.registrado_por_nombre
        })));
      }
    }
    
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
        v_reg.nombre as registrado_por_nombre,
        v_reg.username as registrado_por_username,
        v_apr.nombre as aprobado_por_nombre,
        v_apr.username as aprobado_por_username,
        s.nombre as sucursal_nombre
      FROM egresos e
      LEFT JOIN categorias_egresos ce ON e.id_categoria_egreso = ce.id_categoria_egreso
      LEFT JOIN vendedores v_reg ON e.registrado_por = v_reg.id_vendedor
      LEFT JOIN vendedores v_apr ON e.aprobado_por = v_apr.id_vendedor
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
      requiere_aprobacion,
      es_deducible,
      numero_autorizacion_fiscal,
      codigo_control,
      es_recurrente,
      frecuencia_recurrencia,
      proxima_fecha_recurrencia,
      registrado_por,
      id_sucursal
    } = egresoData;

    // Debug: verificar datos recibidos
    console.log('Datos recibidos en createEgreso:', {
      estado: estado,
      requiere_aprobacion: requiere_aprobacion,
      registrado_por: registrado_por
    });

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insertar el egreso
      const insertQuery = `
        INSERT INTO egresos (
          concepto, descripcion, monto, fecha_egreso,
          id_categoria_egreso, metodo_pago, proveedor_nombre,
          proveedor_documento, proveedor_telefono, proveedor_email,
          numero_factura, numero_recibo, numero_comprobante,
          estado, requiere_aprobacion, es_deducible,
          numero_autorizacion_fiscal, codigo_control,
          es_recurrente, frecuencia_recurrencia, proxima_fecha_recurrencia,
          registrado_por, id_sucursal, id_restaurante
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24
        ) RETURNING *
      `;

      const { rows } = await client.query(insertQuery, [
        concepto, descripcion, monto, fecha_egreso || new Date(),
        id_categoria_egreso, metodo_pago || 'efectivo', proveedor_nombre,
        proveedor_documento, proveedor_telefono, proveedor_email,
        numero_factura, numero_recibo, numero_comprobante,
        estado, // Usar el estado enviado desde el frontend (sin fallback)
        requiere_aprobacion || false, es_deducible !== false,
        numero_autorizacion_fiscal, codigo_control,
        es_recurrente || false, frecuencia_recurrencia, proxima_fecha_recurrencia,
        registrado_por, id_sucursal, id_restaurante
      ]);

      const nuevoEgreso = rows[0];

      // Para egresos de cajero (estado 'pagado'), registrar como 'aprobado' automáticamente
      // Para otros egresos, registrar como 'solicitado'
      const accion = (estado === 'pagado') ? 'aprobado' : 'solicitado';
      const comentario = (estado === 'pagado') ? 'Egreso de caja aprobado automáticamente' : 'Egreso registrado';
      
      await client.query(`
        INSERT INTO flujo_aprobaciones_egresos (id_egreso, id_vendedor, accion, comentario)
        VALUES ($1, $2, $3, $4)
      `, [nuevoEgreso.id_egreso, registrado_por, accion, comentario]);

      await client.query('COMMIT');
      return nuevoEgreso;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
      es_deducible,
      numero_autorizacion_fiscal,
      codigo_control,
      es_recurrente,
      frecuencia_recurrencia,
      proxima_fecha_recurrencia
    } = egresoData;

    const query = `
      UPDATE egresos SET
        concepto = COALESCE($1, concepto),
        descripcion = COALESCE($2, descripcion),
        monto = COALESCE($3, monto),
        fecha_egreso = COALESCE($4, fecha_egreso),
        id_categoria_egreso = COALESCE($5, id_categoria_egreso),
        metodo_pago = COALESCE($6, metodo_pago),
        proveedor_nombre = COALESCE($7, proveedor_nombre),
        proveedor_documento = COALESCE($8, proveedor_documento),
        proveedor_telefono = COALESCE($9, proveedor_telefono),
        proveedor_email = COALESCE($10, proveedor_email),
        numero_factura = COALESCE($11, numero_factura),
        numero_recibo = COALESCE($12, numero_recibo),
        numero_comprobante = COALESCE($13, numero_comprobante),
        es_deducible = COALESCE($14, es_deducible),
        numero_autorizacion_fiscal = COALESCE($15, numero_autorizacion_fiscal),
        codigo_control = COALESCE($16, codigo_control),
        es_recurrente = COALESCE($17, es_recurrente),
        frecuencia_recurrencia = COALESCE($18, frecuencia_recurrencia),
        proxima_fecha_recurrencia = COALESCE($19, proxima_fecha_recurrencia),
        updated_at = NOW()
      WHERE id_egreso = $20 AND id_restaurante = $21
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      concepto, descripcion, monto, fecha_egreso,
      id_categoria_egreso, metodo_pago, proveedor_nombre,
      proveedor_documento, proveedor_telefono, proveedor_email,
      numero_factura, numero_recibo, numero_comprobante,
      es_deducible, numero_autorizacion_fiscal, codigo_control,
      es_recurrente, frecuencia_recurrencia, proxima_fecha_recurrencia,
      id_egreso, id_restaurante
    ]);

    return rows[0] || null;
  },

  /**
   * Eliminar un egreso (soft delete)
   */
  async deleteEgreso(id_egreso, id_restaurante) {
    const query = `
      UPDATE egresos 
      SET estado = 'cancelado', updated_at = NOW()
      WHERE id_egreso = $1 AND id_restaurante = $2 AND estado = 'pendiente'
      RETURNING *
    `;

    const { rows } = await pool.query(query, [id_egreso, id_restaurante]);
    return rows[0] || null;
  },

  // =====================================================
  // OPERACIONES DE APROBACIÓN
  // =====================================================

  /**
   * Aprobar un egreso
   */
  async aprobarEgreso(id_egreso, id_vendedor_aprobador, comentario, id_restaurante) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Primero verificar el estado actual del egreso
      const checkQuery = `
        SELECT estado FROM egresos 
        WHERE id_egreso = $1 AND id_restaurante = $2
      `;
      
      const { rows: checkRows } = await client.query(checkQuery, [id_egreso, id_restaurante]);
      
      if (checkRows.length === 0) {
        throw new Error('Egreso no encontrado');
      }

      const estadoActual = checkRows[0].estado;
      let egresoActualizado = null;

      // Si está pendiente, cambiar a aprobado
      if (estadoActual === 'pendiente') {
        const updateQuery = `
          UPDATE egresos 
          SET estado = 'aprobado', 
              aprobado_por = $1, 
              fecha_aprobacion = NOW(),
              comentario_aprobacion = $2,
              updated_at = NOW()
          WHERE id_egreso = $3 AND id_restaurante = $4
          RETURNING *
        `;

        const { rows } = await client.query(updateQuery, [
          id_vendedor_aprobador, comentario, id_egreso, id_restaurante
        ]);
        
        egresoActualizado = rows[0];
      }
      // Si ya está pagado, solo registrar la aprobación administrativa
      else if (estadoActual === 'pagado') {
        // No cambiar el estado, solo obtener el egreso actual
        const getQuery = `
          SELECT * FROM egresos 
          WHERE id_egreso = $1 AND id_restaurante = $2
        `;
        
        const { rows } = await client.query(getQuery, [id_egreso, id_restaurante]);
        egresoActualizado = rows[0];
      }
      // Si está en otro estado, no permitir aprobación
      else {
        throw new Error(`No se puede aprobar un egreso en estado '${estadoActual}'`);
      }

      // Registrar en el flujo de aprobaciones
      await client.query(`
        INSERT INTO flujo_aprobaciones_egresos (id_egreso, id_vendedor, accion, comentario)
        VALUES ($1, $2, 'aprobado', $3)
      `, [id_egreso, id_vendedor_aprobador, comentario]);

      await client.query('COMMIT');
      return egresoActualizado;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Rechazar un egreso
   */
  async rechazarEgreso(id_egreso, id_vendedor_rechazador, comentario, id_restaurante) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Primero verificar el estado actual del egreso
      const checkQuery = `
        SELECT estado FROM egresos 
        WHERE id_egreso = $1 AND id_restaurante = $2
      `;
      
      const { rows: checkRows } = await client.query(checkQuery, [id_egreso, id_restaurante]);
      
      if (checkRows.length === 0) {
        throw new Error('Egreso no encontrado');
      }

      const estadoActual = checkRows[0].estado;
      let egresoActualizado = null;

      // Si está pendiente, cambiar a rechazado
      if (estadoActual === 'pendiente') {
        const updateQuery = `
          UPDATE egresos 
          SET estado = 'rechazado',
              comentario_aprobacion = $1,
              updated_at = NOW()
          WHERE id_egreso = $2 AND id_restaurante = $3
          RETURNING *
        `;

        const { rows } = await client.query(updateQuery, [comentario, id_egreso, id_restaurante]);
        
        egresoActualizado = rows[0];
      }
      // Si ya está pagado, solo registrar el rechazo administrativo
      else if (estadoActual === 'pagado') {
        // No cambiar el estado, solo obtener el egreso actual
        const getQuery = `
          SELECT * FROM egresos 
          WHERE id_egreso = $1 AND id_restaurante = $2
        `;
        
        const { rows } = await client.query(getQuery, [id_egreso, id_restaurante]);
        egresoActualizado = rows[0];
      }
      // Si está en otro estado, no permitir rechazo
      else {
        throw new Error(`No se puede rechazar un egreso en estado '${estadoActual}'`);
      }

      // Registrar en el flujo de aprobaciones
      await client.query(`
        INSERT INTO flujo_aprobaciones_egresos (id_egreso, id_vendedor, accion, comentario)
        VALUES ($1, $2, 'rechazado', $3)
      `, [id_egreso, id_vendedor_rechazador, comentario]);

      await client.query('COMMIT');
      return egresoActualizado;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Marcar egreso como pagado
   */
  async marcarComoPagado(id_egreso, id_vendedor, comentario, id_restaurante) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Actualizar el egreso
      const updateQuery = `
        UPDATE egresos 
        SET estado = 'pagado', updated_at = NOW()
        WHERE id_egreso = $1 AND id_restaurante = $2 AND estado IN ('pendiente', 'aprobado')
        RETURNING *
      `;

      const { rows } = await client.query(updateQuery, [id_egreso, id_restaurante]);

      if (rows.length === 0) {
        throw new Error('Egreso no encontrado o no se puede marcar como pagado');
      }

      // Registrar en el flujo de aprobaciones
      await client.query(`
        INSERT INTO flujo_aprobaciones_egresos (id_egreso, id_vendedor, accion, comentario)
        VALUES ($1, $2, 'pagado', $3)
      `, [id_egreso, id_vendedor, comentario || 'Egreso marcado como pagado']);

      await client.query('COMMIT');
      return rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // =====================================================
  // REPORTES Y ESTADÍSTICAS
  // =====================================================

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
   * Obtener flujo de aprobaciones de un egreso
   */
  async getFlujoAprobaciones(id_egreso, id_restaurante) {
    const query = `
      SELECT 
        fa.id_flujo,
        fa.accion,
        fa.comentario,
        fa.fecha_accion,
        v.nombre as vendedor_nombre,
        v.username as vendedor_username
      FROM flujo_aprobaciones_egresos fa
      LEFT JOIN vendedores v ON fa.id_vendedor = v.id_vendedor
      LEFT JOIN egresos e ON fa.id_egreso = e.id_egreso
      WHERE fa.id_egreso = $1 AND e.id_restaurante = $2
      ORDER BY fa.fecha_accion ASC
    `;

    const { rows } = await pool.query(query, [id_egreso, id_restaurante]);
    return rows;
  }
};

module.exports = EgresoModel;
