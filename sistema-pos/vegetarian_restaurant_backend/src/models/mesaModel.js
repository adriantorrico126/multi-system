const { pool } = require('../config/database');

const Mesa = {
  // Obtener todas las mesas de una sucursal
  async getMesasBySucursal(id_sucursal, id_restaurante) {
    const query = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.capacidad,
        m.estado,
        m.total_acumulado,
        m.hora_apertura,
        m.hora_cierre,
        m.id_restaurante,
        m.id_grupo_mesa,
        v.id_venta as id_venta_actual,
        v.total as total_venta_actual,
        v.fecha as fecha_venta_actual,
        g.estado as estado_grupo,
        vd.nombre as nombre_mesero_grupo
      FROM mesas m
      LEFT JOIN ventas v ON m.id_venta_actual = v.id_venta
      LEFT JOIN grupos_mesas g ON m.id_grupo_mesa = g.id_grupo_mesa
      LEFT JOIN vendedores vd ON g.id_mesero = vd.id_vendedor
      WHERE m.id_sucursal = $1 AND m.id_restaurante = $2
      ORDER BY m.numero
    `;
    const { rows } = await pool.query(query, [id_sucursal, id_restaurante]);
    return rows;
  },

  // Obtener una mesa específica
  async getMesaByNumero(numero, id_sucursal, id_restaurante) {
    const query = `
      SELECT 
        m.*,
        v.id_venta as id_venta_actual,
        v.total as total_venta_actual,
        v.fecha as fecha_venta_actual,
        v.estado as estado_venta_actual
      FROM mesas m
      LEFT JOIN ventas v ON m.id_venta_actual = v.id_venta
      WHERE m.numero = $1 AND m.id_sucursal = $2 AND m.id_restaurante = $3
    `;
    const { rows } = await pool.query(query, [numero, id_sucursal, id_restaurante]);
    return rows[0];
  },

  // Abrir mesa (iniciar servicio)
  async abrirMesa(numero, id_sucursal, id_vendedor, id_restaurante, client = pool) {
    // Cierra todas las ventas abiertas/en uso/pendiente_cobro para esta mesa y sucursal
    await client.query(`
      UPDATE ventas
      SET estado = 'cerrada'
      WHERE mesa_numero = $1 AND id_sucursal = $2 AND id_restaurante = $3 AND estado IN ('abierta', 'en_uso', 'pendiente_cobro')
    `, [numero, id_sucursal, id_restaurante]);

    const query = `
      UPDATE mesas 
      SET estado = 'en_uso', 
          hora_apertura = NOW(),
          total_acumulado = 0,
          id_venta_actual = NULL
      WHERE numero = $1 AND id_sucursal = $2 AND id_restaurante = $3
      RETURNING *
    `;
    const { rows } = await client.query(query, [numero, id_sucursal, id_restaurante]);
    if (!rows[0]) {
      throw new Error(`No se pudo abrir la mesa ${numero} en la sucursal ${id_sucursal} (restaurante ${id_restaurante}). Verifica que esté libre y exista.`);
    }
    return rows[0];
  },

  // Cerrar mesa (finalizar servicio)
  async cerrarMesa(id_mesa, id_restaurante, client = pool) {
    const query = `
      UPDATE mesas 
      SET estado = 'libre', 
          hora_cierre = NOW(),
          id_venta_actual = NULL,
          total_acumulado = 0
      WHERE id_mesa = $1 AND id_restaurante = $2
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_restaurante]);
    return rows[0];
  },

  // Liberar mesa (marcar como libre sin facturar)
  async liberarMesa(id_mesa, id_restaurante, client = pool) {
    const query = `
      UPDATE mesas 
      SET estado = 'libre', 
          hora_cierre = NOW(),
          id_venta_actual = NULL,
          total_acumulado = 0
      WHERE id_mesa = $1 AND id_restaurante = $2
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_restaurante]);
    return rows[0];
  },

  // Obtener mesa por ID
  async getMesaById(id_mesa, id_sucursal, id_restaurante) {
    let query = `
      SELECT 
        m.*,
        v.id_venta as id_venta_actual,
        v.total as total_venta_actual,
        v.fecha as fecha_venta_actual,
        v.estado as estado_venta_actual
      FROM mesas m
      LEFT JOIN ventas v ON m.id_venta_actual = v.id_venta
      WHERE m.id_mesa = $1 AND m.id_restaurante = $2
    `;
    const params = [id_mesa, id_restaurante];

    if (id_sucursal) {
      params.push(id_sucursal);
      query += ` AND m.id_sucursal = $${params.length}`;
    }
    
    const { rows } = await pool.query(query, params);
    return rows[0];
  },

  // Actualizar total acumulado de una mesa
  async actualizarTotalAcumulado(id_mesa, nuevo_total, id_restaurante, client = pool) {
    const query = `
      UPDATE mesas 
      SET total_acumulado = $2
      WHERE id_mesa = $1 AND id_restaurante = $3
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, nuevo_total, id_restaurante]);
    return rows[0];
  },

  // Asignar venta a mesa
  async asignarVentaAMesa(id_mesa, id_venta, id_restaurante, client = pool) {
    const query = `
      UPDATE mesas 
      SET id_venta_actual = $2
      WHERE id_mesa = $1 AND id_restaurante = $3
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_venta, id_restaurante]);
    return rows[0];
  },

  // Asignar mesero a la mesa (actualiza id_mesero_actual)
  async asignarMeseroAMesa(id_mesa, id_mesero, id_restaurante, client = pool) {
    const query = `
      UPDATE mesas
      SET id_mesero_actual = $2
      WHERE id_mesa = $1 AND id_restaurante = $3
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_mesero, id_restaurante]);
    return rows[0];
  },

  // Obtener prefactura de una mesa
  async getPrefacturaByMesa(id_mesa, id_restaurante) {
    const query = `
      SELECT 
        p.*,
        m.numero as numero_mesa,
        m.capacidad,
        m.total_acumulado
      FROM prefacturas p
      JOIN mesas m ON p.id_mesa = m.id_mesa
      WHERE p.id_mesa = $1 AND p.id_restaurante = $2 AND p.estado = 'abierta'
      ORDER BY p.fecha_apertura DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [id_mesa, id_restaurante]);
    return rows[0];
  },

  // Crear prefactura
  async crearPrefactura(id_mesa, id_venta_principal, id_restaurante, client = pool) {
    const query = `
      INSERT INTO prefacturas (id_mesa, id_venta_principal, total_acumulado, estado, id_restaurante)
      VALUES ($1, $2, 0, 'abierta', $3)
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_venta_principal, id_restaurante]);
    return rows[0];
  },

  // Crear prefactura con fecha_apertura explícita (para preservar la sesión cuando ya existen ventas)
  async crearPrefacturaConFecha(id_mesa, id_venta_principal, fecha_apertura, id_restaurante, client = pool) {
    const query = `
      INSERT INTO prefacturas (id_mesa, id_venta_principal, total_acumulado, estado, fecha_apertura, id_restaurante)
      VALUES ($1, $2, 0, 'abierta', $3, $4)
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_venta_principal, fecha_apertura, id_restaurante]);
    return rows[0];
  },

  // Actualizar fecha_apertura de una prefactura existente
  async actualizarFechaAperturaPrefactura(id_prefactura, nueva_fecha, id_restaurante, client = pool) {
    const query = `
      UPDATE prefacturas
      SET fecha_apertura = $2
      WHERE id_prefactura = $1 AND id_restaurante = $3
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_prefactura, nueva_fecha, id_restaurante]);
    return rows[0];
  },

  // Cerrar prefactura
  async cerrarPrefactura(id_prefactura, total_final, id_restaurante, client = pool) {
    const query = `
      UPDATE prefacturas 
      SET estado = 'cerrada', 
          fecha_cierre = NOW(),
          total_acumulado = $2
      WHERE id_prefactura = $1 AND id_restaurante = $3
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_prefactura, total_final, id_restaurante]);
    return rows[0];
  },

  // Obtener historial de ventas de una mesa
  async getHistorialVentasMesa(id_mesa, id_restaurante, fecha = null) {
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
      WHERE v.id_restaurante = $2 AND v.mesa_numero = (SELECT numero FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2)
    `;
    
    const params = [id_mesa, id_restaurante];
    if (fecha) {
      query += ` AND DATE(v.fecha) = $3`;
      params.push(fecha);
    }
    
    query += ` ORDER BY v.fecha DESC`;
    
    const { rows } = await pool.query(query, params);
    return rows;
  },

  // Verificar si una mesa está disponible
  async mesaDisponible(numero, id_sucursal, id_restaurante) {
    const query = `
      SELECT estado, id_venta_actual
      FROM mesas 
      WHERE numero = $1 AND id_sucursal = $2 AND id_restaurante = $3
    `;
    const { rows } = await pool.query(query, [numero, id_sucursal, id_restaurante]);
    return rows.length > 0 ? rows[0] : null;
  },

  // Obtener estadísticas de mesas
  async getEstadisticasMesas(id_sucursal, id_restaurante) {
    const query = `
      SELECT 
        COUNT(*) as total_mesas,
        COUNT(CASE WHEN estado = 'libre' THEN 1 END) as mesas_libres,
        COUNT(CASE WHEN estado = 'en_uso' THEN 1 END) as mesas_en_uso,
        COUNT(CASE WHEN estado = 'pendiente_cobro' THEN 1 END) as mesas_pendiente_cobro,
        COUNT(CASE WHEN estado = 'pagado' THEN 1 END) as mesas_pagadas,
        SUM(total_acumulado) as total_acumulado_general
      FROM mesas 
      WHERE id_sucursal = $1 AND id_restaurante = $2
    `;
    const { rows } = await pool.query(query, [id_sucursal, id_restaurante]);
    return rows[0];
  },

  // Crear nueva mesa
  async crearMesa({ numero, id_sucursal, capacidad = 4, estado = 'libre', id_restaurante }, client = pool) {
    const query = `
      INSERT INTO mesas (numero, id_sucursal, capacidad, estado, id_restaurante)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await client.query(query, [numero, id_sucursal, capacidad, estado, id_restaurante]);
    return rows[0];
  },

  // Actualizar mesa
  async actualizarMesa(id_mesa, id_restaurante, { numero, capacidad, estado }, client = pool) {
    const query = `
      UPDATE mesas 
      SET numero = $2, capacidad = $3, estado = $4, updated_at = NOW()
      WHERE id_mesa = $1 AND id_restaurante = $5
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, numero, capacidad, estado, id_restaurante]);
    return rows[0];
  },

  // Eliminar mesa
  async eliminarMesa(id_mesa, id_restaurante, client = pool) {
    // Verificar que la mesa no esté en uso
    const mesa = await client.query('SELECT estado FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2', [id_mesa, id_restaurante]);
    if (mesa.rows.length === 0) {
      throw new Error('Mesa no encontrada');
    }
    
    if (mesa.rows[0].estado !== 'libre') {
      throw new Error('No se puede eliminar una mesa que está en uso');
    }

    const query = `DELETE FROM mesas WHERE id_mesa = $1 AND id_restaurante = $2 RETURNING *`;
    const { rows } = await client.query(query, [id_mesa, id_restaurante]);
    return rows[0];
  },

  // Obtener configuración de mesas por sucursal
  async getConfiguracionMesas(id_sucursal, id_restaurante) {
    const query = `
      SELECT 
        id_mesa,
        numero,
        capacidad,
        estado,
        created_at,
        updated_at,
        id_restaurante
      FROM mesas 
      WHERE id_sucursal = $1 AND id_restaurante = $2
      ORDER BY numero
    `;
    const { rows } = await pool.query(query, [id_sucursal, id_restaurante]);
    return rows;
  },

  // Verificar si un número de mesa ya existe en la sucursal
  async numeroMesaExiste(numero, id_sucursal, id_restaurante, id_mesa_excluir = null) {
    let query = `
      SELECT id_mesa FROM mesas 
      WHERE numero = $1 AND id_sucursal = $2 AND id_restaurante = $3
    `;
    const params = [numero, id_sucursal, id_restaurante];
    
    if (id_mesa_excluir) {
      query += ` AND id_mesa != $4`;
      params.push(id_mesa_excluir);
    }
    
    const { rows } = await pool.query(query, params);
    return rows.length > 0;
  },

  // Marcar mesa como pagada (nuevo flujo)
  async marcarMesaComoPagada(id_mesa, id_restaurante, client = pool) {
    // Primero obtener el total acumulado actual
    const mesaQuery = `
      SELECT total_acumulado, numero
      FROM mesas 
      WHERE id_mesa = $1 AND id_restaurante = $2
    `;
    const mesaResult = await client.query(mesaQuery, [id_mesa, id_restaurante]);
    
    if (mesaResult.rows.length === 0) {
      throw new Error('Mesa no encontrada');
    }
    
    const totalAcumulado = mesaResult.rows[0].total_acumulado || 0;
    
    // Marcar mesa como libre y resetear total acumulado para nuevos clientes
    const query = `
      UPDATE mesas 
      SET estado = 'libre', 
          hora_cierre = NOW(),
          id_venta_actual = NULL,
          total_acumulado = 0,
          hora_apertura = NULL
      WHERE id_mesa = $1 AND id_restaurante = $2
      RETURNING *
    `;
    const { rows } = await client.query(query, [id_mesa, id_restaurante]);
    
    // Retornar la mesa con el total acumulado anterior (para referencia)
    return {
      ...rows[0],
      total_acumulado: totalAcumulado
    };
  },

  // Método para actualizar el estado de una mesa
  async actualizarEstadoMesa(id_mesa, estado, id_restaurante, client = pool) {
    const query = `
      UPDATE mesas
      SET estado = $2, updated_at = NOW()
      WHERE id_mesa = $1 AND id_restaurante = $3
      RETURNING *;
    `;
    const { rows } = await client.query(query, [id_mesa, estado, id_restaurante]);
    return rows[0];
  },

  // Método para cerrar prefacturas existentes de una mesa (usado en transferencias)
  async cerrarPrefacturaExistente(id_mesa, id_restaurante, client = pool) {
    const query = `
      UPDATE prefacturas
      SET estado = 'cerrada',
          fecha_cierre = NOW()
      WHERE id_mesa = $1 AND id_restaurante = $2 AND estado = 'abierta'
      RETURNING *;
    `;
    const { rows } = await client.query(query, [id_mesa, id_restaurante]);
    return rows;
  }
};

module.exports = Mesa; 