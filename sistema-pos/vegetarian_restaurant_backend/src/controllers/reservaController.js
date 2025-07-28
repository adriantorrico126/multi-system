const { pool } = require('../config/database');

exports.listarReservas = async (req, res, next) => {
  try {
    const { id_sucursal, id_restaurante, estado } = req.query;
    let query = 'SELECT * FROM reservas WHERE 1=1';
    const params = [];
    if (id_sucursal) {
      params.push(id_sucursal);
      query += ` AND id_sucursal = $${params.length}`;
    }
    if (id_restaurante) {
      params.push(id_restaurante);
      query += ` AND id_restaurante = $${params.length}`;
    }
    if (estado) {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }
    query += ' ORDER BY fecha_hora_inicio ASC';
    const result = await pool.query(query, params);
    res.status(200).json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.crearReserva = async (req, res, next) => {
  try {
    const {
      id_restaurante,
      id_sucursal,
      id_mesa,
      id_cliente,
      nombre_cliente,
      telefono_cliente,
      email_cliente,
      fecha_hora_inicio,
      fecha_hora_fin,
      numero_personas,
      observaciones,
      registrado_por
    } = req.body;
    const result = await pool.query(
      `INSERT INTO reservas (
        id_restaurante, id_sucursal, id_mesa, id_cliente, nombre_cliente, telefono_cliente, email_cliente,
        fecha_hora_inicio, fecha_hora_fin, numero_personas, estado, observaciones, registrado_por, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pendiente',$11,$12,NOW(),NOW()) RETURNING *`,
      [id_restaurante, id_sucursal, id_mesa, id_cliente, nombre_cliente, telefono_cliente, email_cliente,
        fecha_hora_inicio, fecha_hora_fin, numero_personas, observaciones, registrado_por]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.actualizarReserva = async (req, res, next) => {
  try {
    const { id_reserva } = req.params;
    const { estado, observaciones } = req.body;
    const result = await pool.query(
      `UPDATE reservas SET estado = COALESCE($1, estado), observaciones = COALESCE($2, observaciones), updated_at = NOW() WHERE id_reserva = $3 RETURNING *`,
      [estado, observaciones, id_reserva]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Reserva no encontrada' });
    res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.eliminarReserva = async (req, res, next) => {
  try {
    const { id_reserva } = req.params;
    const result = await pool.query('DELETE FROM reservas WHERE id_reserva = $1 RETURNING *', [id_reserva]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Reserva no encontrada' });
    res.status(200).json({ message: 'Reserva eliminada' });
  } catch (error) {
    next(error);
  }
}; 