const db = require('../config/database');

const Venta = {
  async createVenta({ id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, id_restaurante }, client = db) {
    
    const query = `
      INSERT INTO ventas (fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado, id_restaurante)
      VALUES (NOW(), $1, $2, $3, $4, $5, $6, 'recibido', $7)
      RETURNING id_venta, fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado, created_at, id_restaurante;
    `;
    const values = [id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, id_restaurante];
    
    const { rows } = await client.query(query, values);
    return rows[0];
  },

  async createDetalleVenta(id_venta, items, id_restaurante, client = db) {
    
    const detalles = [];
    for (const item of items) {
      
      const query = `
        INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, observaciones, id_restaurante)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id_detalle, id_venta, id_producto, cantidad, precio_unitario, subtotal, observaciones, created_at, id_restaurante;
      `;
      const values = [id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.observaciones || null, id_restaurante];
      
      const { rows } = await client.query(query, values);
      detalles.push(rows[0]);
      
      // Actualizar stock del producto
      try {
        
        // Verificar stock antes del update
        const stockBeforeQuery = 'SELECT stock_actual FROM productos WHERE id_producto = $1 AND id_restaurante = $2';
        const stockBeforeResult = await client.query(stockBeforeQuery, [item.id_producto, id_restaurante]);
        
        // Actualizar stock sin permitir valores negativos
        const updateStockQuery = `
          UPDATE productos 
          SET stock_actual = GREATEST(0, stock_actual - $1) 
          WHERE id_producto = $2 AND id_restaurante = $3;
        `;
        
        const { rowCount } = await client.query(updateStockQuery, [item.cantidad, item.id_producto, id_restaurante]);
        
        // Verificar stock después del update
        const stockAfterQuery = 'SELECT stock_actual FROM productos WHERE id_producto = $1 AND id_restaurante = $2';
        const stockAfterResult = await client.query(stockAfterQuery, [item.id_producto, id_restaurante]);
      } catch (err) {
        console.error('Model: Error updating stock for product', item.id_producto, err);
        console.error('Model: Error details:', err.message);
        console.error('Model: Error stack:', err.stack);
        // No lanzar el error para que la venta se complete
        console.log('Model: Continuing with sale despite stock update error');
      }
    }
    return detalles;
  },

  async getSalesSummary(startDate, endDate, id_restaurante, id_sucursal = null) {
    
    let query = `
      SELECT
          DATE(v.fecha) as fecha_venta,
          mp.descripcion as metodo_pago,
          SUM(v.total) as total_ventas,
          COUNT(v.id_venta) as numero_ventas
      FROM
          ventas v
      JOIN
          metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE
          v.fecha >= $1 AND v.fecha < ($2::date + INTERVAL '1 day') AND v.id_restaurante = $3
    `;
    
    let params = [startDate, endDate, id_restaurante];
    
    // Agregar filtro por sucursal si se proporciona
    if (id_sucursal) {
      query += ` AND v.id_sucursal = $4`;
      params.push(id_sucursal);
    }
    
    query += `
      GROUP BY
          DATE(v.fecha), mp.descripcion
      ORDER BY
          fecha_venta, metodo_pago;
    `;
    
    const { rows } = await db.query(query, params);
    return rows;
  },

  async getDailyCashFlow(startDate, endDate, id_restaurante, id_sucursal = null) {
    
    let query = `
      SELECT
          DATE(fecha) as fecha,
          SUM(CASE WHEN mp.descripcion = 'Efectivo' THEN v.total ELSE 0 END) as ingresos_efectivo,
          SUM(CASE WHEN mp.descripcion != 'Efectivo' THEN v.total ELSE 0 END) as ingresos_otros,
          SUM(v.total) as total_ingresos
      FROM
          ventas v
      JOIN
          metodos_pago mp ON v.id_pago = mp.id_pago
      WHERE
          fecha >= $1 AND fecha < ($2::date + INTERVAL '1 day') AND v.id_restaurante = $3
    `;
    
    let params = [startDate, endDate, id_restaurante];
    
    // Agregar filtro por sucursal si se proporciona
    if (id_sucursal) {
      query += ` AND v.id_sucursal = $4`;
      params.push(id_sucursal);
    }
    
    query += `
      GROUP BY
          DATE(fecha)
      ORDER BY
          fecha;
    `;
    
    const { rows } = await db.query(query, params);
    return rows;
  },

  async getVentasOrdenadas(id_restaurante, limit = 50, id_sucursal = null) {
    let query = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.tipo_servicio,
        v.mesa_numero,
        v.estado,
        mp.descripcion as metodo_pago,
        s.nombre as sucursal_nombre,
        vend.nombre as vendedor_nombre,
        v.id_restaurante,
        json_agg(json_build_object(
          'id_producto', dv.id_producto,
          'nombre_producto', p.nombre,
          'cantidad', dv.cantidad,
          'precio_unitario', dv.precio_unitario,
          'subtotal', dv.subtotal,
          'observaciones', dv.observaciones
        )) as productos
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.id_restaurante = $1
    `;
    
    let params = [id_restaurante];
    
    // Agregar filtro por sucursal si se proporciona
    if (id_sucursal) {
      query += ` AND v.id_sucursal = $2`;
      params.push(id_sucursal);
    }
    
    query += `
      GROUP BY v.id_venta, v.fecha, v.total, v.tipo_servicio, v.mesa_numero, v.estado, mp.descripcion, s.nombre, vend.nombre, v.id_restaurante
      ORDER BY v.fecha DESC, v.id_venta DESC
      LIMIT $${params.length + 1};
    `;
    params.push(limit);
    
    const { rows } = await db.query(query, params);
    return rows;
  },

  async verificarFechasVentas(id_restaurante) {
    const query = `
      SELECT 
        id_venta,
        fecha,
        created_at,
        EXTRACT(EPOCH FROM (fecha - created_at)) as diferencia_segundos,
        id_restaurante
      FROM ventas 
      WHERE id_restaurante = $1
      ORDER BY id_venta DESC 
      LIMIT 10;
    `;
    const { rows } = await db.query(query, [id_restaurante]);
    return rows;
  },

  async getVentasPorFecha(id_restaurante) {
    const query = `
      SELECT 
        id_venta,
        fecha,
        total,
        estado,
        tipo_servicio,
        mesa_numero,
        id_restaurante
      FROM ventas 
      WHERE id_restaurante = $1
      ORDER BY fecha DESC, id_venta DESC 
      LIMIT 20;
    `;
    const { rows } = await db.query(query, [id_restaurante]);
    return rows;
  },

  async verificarDuplicadosFecha(id_restaurante) {
    const query = `
      SELECT 
        fecha,
        COUNT(*) as cantidad,
        array_agg(id_venta ORDER BY id_venta) as ids_ventas,
        array_agg(total ORDER BY id_venta) as totales
      FROM ventas 
      WHERE id_restaurante = $1
      GROUP BY fecha
      HAVING COUNT(*) > 1
      ORDER BY fecha DESC;
    `;
    const { rows } = await db.query(query, [id_restaurante]);
    return rows;
  },

  async corregirFechasVentas(id_restaurante) {
    // Obtener todas las ventas ordenadas por ID
    const query = `
      SELECT id_venta, created_at
      FROM ventas 
      WHERE id_restaurante = $1
      ORDER BY id_venta ASC;
    `;
    const { rows } = await db.query(query, [id_restaurante]);
    
    // Actualizar fechas basándose en created_at para mantener orden cronológico
    const updates = [];
    for (let i = 0; i < rows.length; i++) {
      const venta = rows[i];
      const nuevaFecha = new Date(venta.created_at);
      // Agregar algunos segundos para evitar duplicados
      nuevaFecha.setSeconds(nuevaFecha.getSeconds() + i);
      
      const updateQuery = `
        UPDATE ventas 
        SET fecha = $1 
        WHERE id_venta = $2 AND id_restaurante = $3;
      `;
      await db.query(updateQuery, [nuevaFecha, venta.id_venta, id_restaurante]);
      updates.push({ id_venta: venta.id_venta, nueva_fecha: nuevaFecha });
    }
    
    return updates;
  },

  async getVentasHoy(id_restaurante, id_sucursal = null, fecha = null) {
    // Si no se proporciona fecha, usar hoy
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    
    let query = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.tipo_servicio,
        v.mesa_numero,
        v.estado,
        mp.descripcion as metodo_pago,
        s.nombre as sucursal_nombre,
        vend.nombre as vendedor_nombre,
        v.id_restaurante
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE DATE(v.fecha) = $1 AND v.id_restaurante = $2
    `;
    
    let params = [fechaConsulta, id_restaurante];
    
    // Agregar filtro por sucursal si se proporciona
    if (id_sucursal) {
      query += ` AND v.id_sucursal = $3`;
      params.push(id_sucursal);
    }
    
    query += ` ORDER BY v.fecha DESC, v.id_venta DESC`;
    
    const { rows } = await db.query(query, params);
    return rows;
  },

  /**
   * Actualiza el estado de una venta
   * @param {number} id_venta - ID de la venta
   * @param {string} nuevoEstado - Nuevo estado a asignar
   * @returns {Promise<object>} Venta actualizada
   */
  async updateEstadoVenta(id_venta, nuevoEstado, id_restaurante) {
    // Validar estados permitidos
    const estadosPermitidos = ['recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(`Estado no permitido: ${nuevoEstado}`);
    }
    const query = `
      UPDATE ventas
      SET estado = $1
      WHERE id_venta = $2 AND id_restaurante = $3
      RETURNING id_venta, estado, id_restaurante;
    `;
    const { rows } = await db.query(query, [nuevoEstado, id_venta, id_restaurante]);
    if (rows.length === 0) {
      throw new Error('Venta no encontrada');
    }
    return rows[0];
  },

  /**
   * Obtiene ventas filtradas para exportación avanzada
   * @param {Object} filtros - Filtros avanzados
   * @param {string} filtros.fecha_inicio - Fecha inicio (YYYY-MM-DD)
   * @param {string} filtros.fecha_fin - Fecha fin (YYYY-MM-DD)
   * @param {number} [filtros.id_sucursal] - Sucursal opcional
   * @param {number} [filtros.id_producto] - Producto opcional
   * @param {string} [filtros.metodo_pago] - Método de pago opcional
   * @param {string} [filtros.cajero] - Cajero opcional (username)
   * @param {number} id_restaurante - Restaurante
   * @returns {Promise<Array>} Ventas filtradas
   */
  async getVentasFiltradas(filtros, id_restaurante) {
    let query = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        v.tipo_servicio,
        v.mesa_numero,
        v.id_restaurante,
        v.id_sucursal,
        s.nombre as sucursal_nombre,
        mp.descripcion as metodo_pago,
        vend.username as cajero,
        json_agg(json_build_object(
          'id_producto', dv.id_producto,
          'nombre', p.nombre,
          'cantidad', dv.cantidad,
          'precio_unitario', dv.precio_unitario,
          'subtotal', dv.subtotal
        )) as productos
      FROM ventas v
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.id_restaurante = $1
        AND v.fecha >= $2 AND v.fecha <= $3
    `;
    const params = [id_restaurante, filtros.fecha_inicio, filtros.fecha_fin];
    let paramIdx = 4;
    if (filtros.id_sucursal) {
      query += ` AND v.id_sucursal = $${paramIdx}`;
      params.push(filtros.id_sucursal);
      paramIdx++;
    }
    if (filtros.id_producto) {
      query += ` AND dv.id_producto = $${paramIdx}`;
      params.push(filtros.id_producto);
      paramIdx++;
    }
    if (filtros.metodo_pago) {
      query += ` AND mp.descripcion = $${paramIdx}`;
      params.push(filtros.metodo_pago);
      paramIdx++;
    }
    if (filtros.cajero) {
      query += ` AND vend.username = $${paramIdx}`;
      params.push(filtros.cajero);
      paramIdx++;
    }
    query += `
      GROUP BY v.id_venta, s.nombre, mp.descripcion, vend.username
      ORDER BY v.fecha DESC, v.id_venta DESC
    `;
    const { rows } = await db.query(query, params);
    return rows;
  }
};

module.exports = Venta; 