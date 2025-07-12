const db = require('../config/database');

const Venta = {
  async createVenta({ id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero }, client = db) {
    
    const query = `
      INSERT INTO ventas (fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado)
      VALUES (NOW(), $1, $2, $3, $4, $5, $6, 'recibido')
      RETURNING id_venta, fecha, id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero, estado, created_at;
    `;
    const values = [id_vendedor, id_pago, id_sucursal, tipo_servicio, total, mesa_numero];
    
    const { rows } = await client.query(query, values);
    return rows[0];
  },

  async createDetalleVenta(id_venta, items, client = db) {
    
    const detalles = [];
    for (const item of items) {
      
      const query = `
        INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, observaciones)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_detalle, id_venta, id_producto, cantidad, precio_unitario, subtotal, observaciones, created_at;
      `;
      const values = [id_venta, item.id_producto, item.cantidad, item.precio_unitario, item.observaciones || null];
      
      const { rows } = await client.query(query, values);
      detalles.push(rows[0]);
      
      // Actualizar stock del producto
      try {
        
        // Verificar stock antes del update
        const stockBeforeQuery = 'SELECT stock_actual FROM productos WHERE id_producto = $1';
        const stockBeforeResult = await client.query(stockBeforeQuery, [item.id_producto]);
        
        // Actualizar stock sin permitir valores negativos
        const updateStockQuery = `
          UPDATE productos 
          SET stock_actual = GREATEST(0, stock_actual - $1) 
          WHERE id_producto = $2;
        `;
        
        const { rowCount } = await client.query(updateStockQuery, [item.cantidad, item.id_producto]);
        
        // Verificar stock después del update
        const stockAfterQuery = 'SELECT stock_actual FROM productos WHERE id_producto = $1';
        const stockAfterResult = await client.query(stockAfterQuery, [item.id_producto]);
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

  async getSalesSummary(startDate, endDate, id_sucursal = null) {
    
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
          v.fecha >= $1 AND v.fecha < ($2::date + INTERVAL '1 day')
    `;
    
    let params = [startDate, endDate];
    
    // Agregar filtro por sucursal si se proporciona
    if (id_sucursal) {
      query += ` AND v.id_sucursal = $3`;
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

  async getDailyCashFlow(startDate, endDate, id_sucursal = null) {
    
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
          fecha >= $1 AND fecha < ($2::date + INTERVAL '1 day')
    `;
    
    let params = [startDate, endDate];
    
    // Agregar filtro por sucursal si se proporciona
    if (id_sucursal) {
      query += ` AND v.id_sucursal = $3`;
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

  async getVentasOrdenadas(limit = 50, id_sucursal = null) {
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
        vend.nombre as vendedor_nombre
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
    `;
    
    let params = [];
    
    // Agregar filtro por sucursal si se proporciona
    if (id_sucursal) {
      query += ` WHERE v.id_sucursal = $1`;
      params.push(id_sucursal);
    }
    
    query += `
      ORDER BY v.fecha DESC, v.id_venta DESC
      LIMIT $${params.length + 1};
    `;
    params.push(limit);
    
    const { rows } = await db.query(query, params);
    return rows;
  },

  async verificarFechasVentas() {
    const query = `
      SELECT 
        id_venta,
        fecha,
        created_at,
        EXTRACT(EPOCH FROM (fecha - created_at)) as diferencia_segundos
      FROM ventas 
      ORDER BY id_venta DESC 
      LIMIT 10;
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async getVentasPorFecha() {
    const query = `
      SELECT 
        id_venta,
        fecha,
        total,
        estado,
        tipo_servicio,
        mesa_numero
      FROM ventas 
      ORDER BY fecha DESC, id_venta DESC 
      LIMIT 20;
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async verificarDuplicadosFecha() {
    const query = `
      SELECT 
        fecha,
        COUNT(*) as cantidad,
        array_agg(id_venta ORDER BY id_venta) as ids_ventas,
        array_agg(total ORDER BY id_venta) as totales
      FROM ventas 
      GROUP BY fecha
      HAVING COUNT(*) > 1
      ORDER BY fecha DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async corregirFechasVentas() {
    // Obtener todas las ventas ordenadas por ID
    const query = `
      SELECT id_venta, created_at
      FROM ventas 
      ORDER BY id_venta ASC;
    `;
    const { rows } = await db.query(query);
    
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
        WHERE id_venta = $2;
      `;
      await db.query(updateQuery, [nuevaFecha, venta.id_venta]);
      updates.push({ id_venta: venta.id_venta, nueva_fecha: nuevaFecha });
    }
    
    return updates;
  },

  async getVentasHoy(id_sucursal = null, fecha = null) {
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
        vend.nombre as vendedor_nombre
      FROM ventas v
      JOIN metodos_pago mp ON v.id_pago = mp.id_pago
      JOIN sucursales s ON v.id_sucursal = s.id_sucursal
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE DATE(v.fecha) = $1
    `;
    
    let params = [fechaConsulta];
    
    // Agregar filtro por sucursal si se proporciona
    if (id_sucursal) {
      query += ` AND v.id_sucursal = $2`;
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
  async updateEstadoVenta(id_venta, nuevoEstado) {
    // Validar estados permitidos
    const estadosPermitidos = ['recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado'];
    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error(`Estado no permitido: ${nuevoEstado}`);
    }
    const query = `
      UPDATE ventas
      SET estado = $1
      WHERE id_venta = $2
      RETURNING id_venta, estado;
    `;
    const { rows } = await db.query(query, [nuevoEstado, id_venta]);
    if (rows.length === 0) {
      throw new Error('Venta no encontrada');
    }
    return rows[0];
  }
};

module.exports = Venta; 