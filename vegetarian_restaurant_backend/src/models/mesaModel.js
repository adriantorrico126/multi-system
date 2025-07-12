const db = require('../config/database');

const Mesa = {
  // Obtener todas las mesas de una sucursal
  async getMesasBySucursal(id_sucursal) {
    const query = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.capacidad,
        m.estado,
        m.total_acumulado,
        m.hora_apertura,
        m.hora_cierre,
        v.id_venta as id_venta_actual,
        v.total as total_venta_actual,
        v.fecha as fecha_venta_actual
      FROM mesas m
      LEFT JOIN ventas v ON m.id_venta_actual = v.id_venta
      WHERE m.id_sucursal = $1
      ORDER BY m.numero
    `;
    const { rows } = await db.query(query, [id_sucursal]);
    return rows;
  },

  // Obtener una mesa específica
  async getMesaByNumero(numero, id_sucursal) {
    const query = `
      SELECT 
        m.*,
        v.id_venta as id_venta_actual,
        v.total as total_venta_actual,
        v.fecha as fecha_venta_actual,
        v.estado as estado_venta_actual
      FROM mesas m
      LEFT JOIN ventas v ON m.id_venta_actual = v.id_venta
      WHERE m.numero = $1 AND m.id_sucursal = $2
    `;
    const { rows } = await db.query(query, [numero, id_sucursal]);
    return rows[0];
  },

  // Abrir mesa (iniciar servicio)
  async abrirMesa(numero, id_sucursal, id_vendedor, client = db) {
    // Cierra todas las ventas abiertas/en uso/pendiente_cobro para esta mesa y sucursal
    await client.query(`
      UPDATE ventas
      SET estado = 'cerrada'
      WHERE mesa_numero = $1 AND id_sucursal = $2 AND estado IN ('abierta', 'en_uso', 'pendiente_cobro')
    `, [numero, id_sucursal]);

    const query = `
      UPDATE mesas 
      SET estado = 'en_uso', 
          hora_apertura = NOW(),
          total_acumulado = 0,
          id_venta_actual = NULL
      WHERE numero = $1 AND id_sucursal = $2
      RETURNING *
    `;
    const { rows } = await client.query(query, [numero, id_sucursal]);
    return rows[0];
  },

  // Cerrar mesa (finalizar servicio)
  async cerrarMesa(id_mesa, client = db) {
    const query = `
      UPDATE mesas 
      SET estado = 'libre', 
          hora_cierre = NOW(),
          id_venta_actual = NULL,
          total_acumulado = 0
      WHERE id_mesa = $1
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa]);
    return rows[0];
  },

  // Liberar mesa (marcar como libre sin facturar)
  async liberarMesa(id_mesa, client = db) {
    const query = `
      UPDATE mesas 
      SET estado = 'libre', 
          hora_cierre = NOW(),
          id_venta_actual = NULL,
          total_acumulado = 0
      WHERE id_mesa = $1
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa]);
    return rows[0];
  },

  // Obtener mesa por ID
  async getMesaById(id_mesa) {
    const query = `
      SELECT 
        m.*,
        v.id_venta as id_venta_actual,
        v.total as total_venta_actual,
        v.fecha as fecha_venta_actual,
        v.estado as estado_venta_actual
      FROM mesas m
      LEFT JOIN ventas v ON m.id_venta_actual = v.id_venta
      WHERE m.id_mesa = $1
    `;
    const { rows } = await db.query(query, [id_mesa]);
    return rows[0];
  },

  // Actualizar total acumulado de una mesa
  async actualizarTotalAcumulado(id_mesa, nuevo_total, client = db) {
    const query = `
      UPDATE mesas 
      SET total_acumulado = $2
      WHERE id_mesa = $1
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, nuevo_total]);
    return rows[0];
  },

  // Asignar venta a mesa
  async asignarVentaAMesa(id_mesa, id_venta, client = db) {
    const query = `
      UPDATE mesas 
      SET id_venta_actual = $2
      WHERE id_mesa = $1
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_venta]);
    return rows[0];
  },

  // Obtener prefactura de una mesa
  async getPrefacturaByMesa(id_mesa) {
    const query = `
      SELECT 
        p.*,
        m.numero as numero_mesa,
        m.capacidad,
        m.total_acumulado
      FROM prefacturas p
      JOIN mesas m ON p.id_mesa = m.id_mesa
      WHERE p.id_mesa = $1 AND p.estado = 'abierta'
      ORDER BY p.fecha_apertura DESC
      LIMIT 1
    `;
    const { rows } = await db.query(query, [id_mesa]);
    return rows[0];
  },

  // Crear prefactura
  async crearPrefactura(id_mesa, id_venta_principal, client = db) {
    const query = `
      INSERT INTO prefacturas (id_mesa, id_venta_principal, total_acumulado, estado)
      VALUES ($1, $2, 0, 'abierta')
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_venta_principal]);
    return rows[0];
  },

  // Cerrar prefactura
  async cerrarPrefactura(id_prefactura, total_final, client = db) {
    const query = `
      UPDATE prefacturas 
      SET estado = 'cerrada', 
          fecha_cierre = NOW(),
          total_acumulado = $2
      WHERE id_prefactura = $1
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_prefactura, total_final]);
    return rows[0];
  },

  // Obtener historial de ventas de una mesa
  async getHistorialVentasMesa(id_mesa, fecha = null) {
    let query = `
      SELECT 
        v.id_venta,
        v.fecha,
        v.total,
        v.estado,
        v.tipo_servicio,
        dv.cantidad,
        dv.precio_unitario,
        dv.subtotal,
        dv.observaciones,
        p.nombre as nombre_producto,
        vend.nombre as nombre_vendedor
      FROM ventas v
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      JOIN vendedores vend ON v.id_vendedor = vend.id_vendedor
      WHERE v.mesa_numero = (SELECT numero FROM mesas WHERE id_mesa = $1)
    `;
    
    const params = [id_mesa];
    if (fecha) {
      query += ` AND DATE(v.fecha) = $2`;
      params.push(fecha);
    }
    
    query += ` ORDER BY v.fecha DESC`;
    
    const { rows } = await db.query(query, params);
    return rows;
  },

  // Verificar si una mesa está disponible
  async mesaDisponible(numero, id_sucursal) {
    const query = `
      SELECT estado, id_venta_actual
      FROM mesas 
      WHERE numero = $1 AND id_sucursal = $2
    `;
    const { rows } = await db.query(query, [numero, id_sucursal]);
    return rows.length > 0 ? rows[0] : null;
  },

  // Obtener estadísticas de mesas
  async getEstadisticasMesas(id_sucursal) {
    const query = `
      SELECT 
        COUNT(*) as total_mesas,
        COUNT(CASE WHEN estado = 'libre' THEN 1 END) as mesas_libres,
        COUNT(CASE WHEN estado = 'en_uso' THEN 1 END) as mesas_en_uso,
        COUNT(CASE WHEN estado = 'pendiente_cobro' THEN 1 END) as mesas_pendientes,
        SUM(total_acumulado) as total_acumulado_general
      FROM mesas 
      WHERE id_sucursal = $1
    `;
    const { rows } = await db.query(query, [id_sucursal]);
    return rows[0];
  },

  // Crear nueva mesa
  async crearMesa({ numero, id_sucursal, capacidad = 4, estado = 'libre' }, client = db) {
    const query = `
      INSERT INTO mesas (numero, id_sucursal, capacidad, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await client.query(query, [numero, id_sucursal, capacidad, estado]);
    return rows[0];
  },

  // Actualizar mesa
  async actualizarMesa(id_mesa, { numero, capacidad, estado }, client = db) {
    const query = `
      UPDATE mesas 
      SET numero = $2, capacidad = $3, estado = $4, updated_at = NOW()
      WHERE id_mesa = $1
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, numero, capacidad, estado]);
    return rows[0];
  },

  // Eliminar mesa
  async eliminarMesa(id_mesa, client = db) {
    // Verificar que la mesa no esté en uso
    const mesa = await client.query('SELECT estado FROM mesas WHERE id_mesa = $1', [id_mesa]);
    if (mesa.rows.length === 0) {
      throw new Error('Mesa no encontrada');
    }
    
    if (mesa.rows[0].estado !== 'libre') {
      throw new Error('No se puede eliminar una mesa que está en uso');
    }

    const query = `DELETE FROM mesas WHERE id_mesa = $1 RETURNING *`;
    const { rows } = await client.query(query, [id_mesa]);
    return rows[0];
  },

  // Obtener configuración de mesas por sucursal
  async getConfiguracionMesas(id_sucursal) {
    const query = `
      SELECT 
        id_mesa,
        numero,
        capacidad,
        estado,
        created_at,
        updated_at
      FROM mesas 
      WHERE id_sucursal = $1
      ORDER BY numero
    `;
    const { rows } = await db.query(query, [id_sucursal]);
    return rows;
  },

  // Verificar si un número de mesa ya existe en la sucursal
  async numeroMesaExiste(numero, id_sucursal, id_mesa_excluir = null) {
    let query = `
      SELECT id_mesa FROM mesas 
      WHERE numero = $1 AND id_sucursal = $2
    `;
    const params = [numero, id_sucursal];
    
    if (id_mesa_excluir) {
      query += ` AND id_mesa != $3`;
      params.push(id_mesa_excluir);
    }
    
    const { rows } = await db.query(query, params);
    return rows.length > 0;
  }
};

module.exports = Mesa; 