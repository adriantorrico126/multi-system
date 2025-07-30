const { pool } = require('../config/database');

const ReservaModel = {
  // Crear una nueva reserva
  async crearReserva(reservaData) {
    const {
      id_mesa,
      id_cliente,
      id_restaurante,
      id_sucursal,
      registrado_por,
      fecha_hora_inicio,
      fecha_hora_fin,
      numero_personas,
      observaciones,
      nombre_cliente,
      telefono_cliente,
      email_cliente
    } = reservaData;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si hay conflictos de horario
      const conflictoRes = await client.query(`
        SELECT COUNT(*) as count
        FROM reservas
        WHERE id_mesa = $1
          AND estado IN ('CONFIRMADA', 'PENDIENTE')
          AND fecha_hora_inicio >= NOW()
          AND (
            (fecha_hora_inicio < $3 AND fecha_hora_fin > $2)
            OR ($2 < fecha_hora_fin AND $3 > fecha_hora_inicio)
          )
      `, [id_mesa, fecha_hora_inicio, fecha_hora_fin]);

      if (parseInt(conflictoRes.rows[0].count) > 0) {
        throw new Error('La mesa ya tiene una reserva en ese horario');
      }

      // Crear la reserva
      const reservaRes = await client.query(`
        INSERT INTO reservas (
          id_mesa, id_cliente, id_restaurante, id_sucursal, registrado_por,
          fecha_hora_inicio, fecha_hora_fin, numero_personas, observaciones,
          nombre_cliente, telefono_cliente, email_cliente, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        id_mesa, id_cliente, id_restaurante, id_sucursal, registrado_por,
        fecha_hora_inicio, fecha_hora_fin, numero_personas, observaciones,
        nombre_cliente, telefono_cliente, email_cliente, 'CONFIRMADA'
      ]);

      // Cambiar el estado de la mesa a 'reservada'
      await client.query(`
        UPDATE mesas 
        SET estado = 'reservada' 
        WHERE id_mesa = $1
      `, [id_mesa]);

      await client.query('COMMIT');
      return reservaRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener todas las reservas de una sucursal
  async getReservasBySucursal(id_sucursal, id_restaurante, fecha = null) {
    let query = `
      SELECT 
        r.*,
        m.numero as numero_mesa,
        m.capacidad as capacidad_mesa,
        v.nombre as nombre_mesero,
        c.nombre as nombre_cliente_completo,
        c.telefono as telefono_cliente_completo,
        c.email as email_cliente_completo
      FROM reservas r
      LEFT JOIN mesas m ON r.id_mesa = m.id_mesa
      LEFT JOIN vendedores v ON r.registrado_por = v.id_vendedor
      LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
      WHERE r.id_sucursal = $1 AND r.id_restaurante = $2
    `;
    
    const params = [id_sucursal, id_restaurante];
    
    if (fecha) {
      query += ` AND DATE(r.fecha_hora_inicio) = $3`;
      params.push(fecha);
    }
    
    query += ` ORDER BY r.fecha_hora_inicio ASC`;
    
    const { rows } = await pool.query(query, params);
    return rows;
  },

  // Obtener todas las reservas de un restaurante
  async getReservasByRestaurante(id_restaurante, fecha = null) {
    let query = `
      SELECT 
        r.*,
        m.numero as numero_mesa,
        m.capacidad as capacidad_mesa,
        v.nombre as nombre_mesero,
        c.nombre as nombre_cliente_completo,
        c.telefono as telefono_cliente_completo,
        c.email as email_cliente_completo
      FROM reservas r
      LEFT JOIN mesas m ON r.id_mesa = m.id_mesa
      LEFT JOIN vendedores v ON r.registrado_por = v.id_vendedor
      LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
      WHERE r.id_restaurante = $1
    `;
    
    const params = [id_restaurante];
    
    if (fecha) {
      query += ` AND DATE(r.fecha_hora_inicio) = $2`;
      params.push(fecha);
    }
    
    query += ` ORDER BY r.fecha_hora_inicio ASC`;
    
    const { rows } = await pool.query(query, params);
    return rows;
  },

  // Obtener una reserva específica
  async getReservaById(id_reserva, id_restaurante) {
    const query = `
      SELECT 
        r.*,
        m.numero as numero_mesa,
        m.capacidad as capacidad_mesa,
        v.nombre as nombre_mesero,
        c.nombre as nombre_cliente_completo,
        c.telefono as telefono_cliente_completo,
        c.email as email_cliente_completo
      FROM reservas r
      LEFT JOIN mesas m ON r.id_mesa = m.id_mesa
      LEFT JOIN vendedores v ON r.registrado_por = v.id_vendedor
      LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
      WHERE r.id_reserva = $1 AND r.id_restaurante = $2
    `;
    
    const { rows } = await pool.query(query, [id_reserva, id_restaurante]);
    return rows[0];
  },

  // Actualizar una reserva
  async actualizarReserva(id_reserva, id_restaurante, datosActualizados) {
    const {
      id_mesa,
      fecha_hora_inicio,
      fecha_hora_fin,
      numero_personas,
      estado,
      observaciones,
      nombre_cliente,
      telefono_cliente,
      email_cliente
    } = datosActualizados;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Si se está cambiando la mesa o el horario, verificar conflictos
      if (id_mesa || fecha_hora_inicio || fecha_hora_fin) {
        const conflictoRes = await client.query(`
          SELECT COUNT(*) as count
          FROM reservas
          WHERE id_mesa = $1
            AND id_reserva != $2
            AND estado IN ('confirmada', 'pendiente')
            AND (
              (fecha_hora_inicio < $4 AND fecha_hora_fin > $3)
              OR ($3 < fecha_hora_fin AND $4 > fecha_hora_inicio)
            )
        `, [id_mesa, id_reserva, fecha_hora_inicio, fecha_hora_fin]);

        if (parseInt(conflictoRes.rows[0].count) > 0) {
          throw new Error('La mesa ya tiene una reserva en ese horario');
        }
      }

      // Construir query dinámico
      const campos = [];
      const valores = [];
      let contador = 1;

      if (id_mesa !== undefined) {
        campos.push(`id_mesa = $${contador++}`);
        valores.push(id_mesa);
      }
      if (fecha_hora_inicio !== undefined) {
        campos.push(`fecha_hora_inicio = $${contador++}`);
        valores.push(fecha_hora_inicio);
      }
      if (fecha_hora_fin !== undefined) {
        campos.push(`fecha_hora_fin = $${contador++}`);
        valores.push(fecha_hora_fin);
      }
      if (numero_personas !== undefined) {
        campos.push(`numero_personas = $${contador++}`);
        valores.push(numero_personas);
      }
      if (estado !== undefined) {
        campos.push(`estado = $${contador++}`);
        valores.push(estado);
      }
      if (observaciones !== undefined) {
        campos.push(`observaciones = $${contador++}`);
        valores.push(observaciones);
      }
      if (nombre_cliente !== undefined) {
        campos.push(`nombre_cliente = $${contador++}`);
        valores.push(nombre_cliente);
      }
      if (telefono_cliente !== undefined) {
        campos.push(`telefono_cliente = $${contador++}`);
        valores.push(telefono_cliente);
      }
      if (email_cliente !== undefined) {
        campos.push(`email_cliente = $${contador++}`);
        valores.push(email_cliente);
      }

      if (campos.length === 0) {
        throw new Error('No se proporcionaron campos para actualizar');
      }

      const query = `
        UPDATE reservas 
        SET ${campos.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id_reserva = $${contador} AND id_restaurante = $${contador + 1}
        RETURNING *
      `;
      
      valores.push(id_reserva, id_restaurante);
      
      const { rows } = await client.query(query, valores);
      
      if (rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Cancelar una reserva
  async cancelarReserva(id_reserva, id_restaurante, motivo = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener la información de la reserva antes de cancelarla
      const reservaQuery = `
        SELECT id_mesa FROM reservas 
        WHERE id_reserva = $1 AND id_restaurante = $2
      `;
      const reservaRes = await client.query(reservaQuery, [id_reserva, id_restaurante]);
      
      if (reservaRes.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      const id_mesa = reservaRes.rows[0].id_mesa;

      // Cancelar la reserva
      let cancelarQuery;
      let queryParams;
      
      if (motivo) {
        cancelarQuery = `
          UPDATE reservas 
          SET estado = 'CANCELADA', 
              observaciones = COALESCE(observaciones, '') || ' - Cancelada: ' || $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id_reserva = $1 AND id_restaurante = $2
          RETURNING *
        `;
        queryParams = [id_reserva, id_restaurante, motivo];
      } else {
        cancelarQuery = `
          UPDATE reservas 
          SET estado = 'CANCELADA', 
              observaciones = COALESCE(observaciones, '') || ' - Cancelada',
              updated_at = CURRENT_TIMESTAMP
          WHERE id_reserva = $1 AND id_restaurante = $2
          RETURNING *
        `;
        queryParams = [id_reserva, id_restaurante];
      }
      
      const { rows } = await client.query(cancelarQuery, queryParams);

      // Liberar la mesa (cambiar estado a 'libre')
      await client.query(`
        UPDATE mesas 
        SET estado = 'libre' 
        WHERE id_mesa = $1
      `, [id_mesa]);

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Eliminar una reserva
  async eliminarReserva(id_reserva, id_restaurante) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener la información de la reserva antes de eliminarla
      const reservaQuery = `
        SELECT id_mesa FROM reservas 
        WHERE id_reserva = $1 AND id_restaurante = $2
      `;
      const reservaRes = await client.query(reservaQuery, [id_reserva, id_restaurante]);
      
      if (reservaRes.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      const id_mesa = reservaRes.rows[0].id_mesa;

      // Eliminar la reserva
      const eliminarQuery = `
        DELETE FROM reservas 
        WHERE id_reserva = $1 AND id_restaurante = $2
        RETURNING *
      `;
      
      const { rows } = await client.query(eliminarQuery, [id_reserva, id_restaurante]);

      // Liberar la mesa (cambiar estado a 'libre')
      await client.query(`
        UPDATE mesas 
        SET estado = 'libre' 
        WHERE id_mesa = $1
      `, [id_mesa]);

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener reservas por fecha
  async getReservasByFecha(id_sucursal, id_restaurante, fecha) {
    const query = `
      SELECT 
        r.*,
        m.numero as numero_mesa,
        m.capacidad as capacidad_mesa,
        v.nombre as nombre_mesero
      FROM reservas r
      LEFT JOIN mesas m ON r.id_mesa = m.id_mesa
      LEFT JOIN vendedores v ON r.registrado_por = v.id_vendedor
      WHERE r.id_sucursal = $1 
        AND r.id_restaurante = $2 
        AND DATE(r.fecha_hora_inicio) = $3
        AND r.estado IN ('confirmada', 'pendiente')
      ORDER BY r.fecha_hora_inicio ASC
    `;
    
    const { rows } = await pool.query(query, [id_sucursal, id_restaurante, fecha]);
    return rows;
  },

  // Obtener disponibilidad de mesas
  async getDisponibilidadMesas(id_sucursal, id_restaurante, fecha_hora_inicio, fecha_hora_fin) {
    const query = `
      SELECT 
        m.id_mesa,
        m.numero,
        m.capacidad,
        m.estado,
        CASE 
          WHEN r.id_reserva IS NOT NULL THEN 'reservada'
          ELSE m.estado
        END as estado_actual
      FROM mesas m
      LEFT JOIN reservas r ON m.id_mesa = r.id_mesa 
        AND r.estado IN ('confirmada', 'pendiente')
        AND (
          (r.fecha_hora_inicio < $4 AND r.fecha_hora_fin > $3)
          OR ($3 < r.fecha_hora_fin AND $4 > r.fecha_hora_inicio)
        )
      WHERE m.id_sucursal = $1 AND m.id_restaurante = $2
      ORDER BY m.numero
    `;
    
    const { rows } = await pool.query(query, [id_sucursal, id_restaurante, fecha_hora_inicio, fecha_hora_fin]);
    return rows;
  },

  // Obtener estadísticas de reservas
  async getEstadisticasReservas(id_sucursal, id_restaurante, fecha_inicio, fecha_fin) {
    const query = `
      SELECT 
        COUNT(*) as total_reservas,
        COUNT(CASE WHEN estado = 'confirmada' THEN 1 END) as confirmadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
        COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
        COUNT(CASE WHEN estado = 'no_show' THEN 1 END) as no_show,
        AVG(numero_personas) as promedio_personas
      FROM reservas
      WHERE id_sucursal = $1 
        AND id_restaurante = $2
        AND fecha_hora_inicio BETWEEN $3 AND $4
    `;
    
    const { rows } = await pool.query(query, [id_sucursal, id_restaurante, fecha_inicio, fecha_fin]);
    return rows[0];
  },

  // Obtener reservas por mesa
  async getReservasByMesa(id_mesa, id_restaurante) {
    const query = `
      SELECT 
        r.*,
        m.numero as numero_mesa,
        m.capacidad as capacidad_mesa,
        v.nombre as nombre_mesero,
        c.nombre as nombre_cliente_completo,
        c.telefono as telefono_cliente_completo,
        c.email as email_cliente_completo
      FROM reservas r
      LEFT JOIN mesas m ON r.id_mesa = m.id_mesa
      LEFT JOIN vendedores v ON r.registrado_por = v.id_vendedor
      LEFT JOIN clientes c ON r.id_cliente = c.id_cliente
      WHERE r.id_mesa = $1 
        AND r.id_restaurante = $2
        AND r.estado IN ('CONFIRMADA', 'PENDIENTE')
        AND r.fecha_hora_inicio >= NOW()
      ORDER BY r.fecha_hora_inicio ASC
    `;
    
    const { rows } = await pool.query(query, [id_mesa, id_restaurante]);
    return rows;
  },

  // Limpiar estado de mesas que no tienen reservas activas
  async limpiarEstadosMesas(id_restaurante) {
    const query = `
      UPDATE mesas 
      SET estado = 'libre' 
      WHERE id_restaurante = $1 
        AND estado = 'reservada' 
        AND id_mesa NOT IN (
          SELECT DISTINCT id_mesa 
          FROM reservas 
          WHERE id_restaurante = $1 
            AND estado IN ('CONFIRMADA', 'PENDIENTE')
            AND fecha_hora_inicio >= NOW()
        )
    `;
    
    const { rowCount } = await pool.query(query, [id_restaurante]);
    return rowCount;
  }
};

module.exports = ReservaModel; 