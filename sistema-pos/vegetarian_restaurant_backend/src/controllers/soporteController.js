const { pool } = require('../config/database');

async function ensureSoporteTicketsTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS soporte_tickets (
      id_ticket SERIAL PRIMARY KEY,
      id_vendedor INTEGER NOT NULL,
      id_restaurante INTEGER NOT NULL,
      asunto TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
      fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
    );`
  );
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_soporte_tickets_vendedor_fecha ON soporte_tickets(id_vendedor, fecha_creacion);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_soporte_tickets_restaurante_fecha ON soporte_tickets(id_restaurante, fecha_creacion);`);
}

async function ensureSoporteRespuestasTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS soporte_respuestas (
      id_respuesta SERIAL PRIMARY KEY,
      id_ticket INTEGER NOT NULL REFERENCES soporte_tickets(id_ticket) ON DELETE CASCADE,
      autor VARCHAR(100) NOT NULL,
      mensaje TEXT NOT NULL,
      fecha TIMESTAMP NOT NULL DEFAULT NOW()
    );`
  );
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_soporte_respuestas_ticket_fecha ON soporte_respuestas(id_ticket, fecha);`);
}

exports.createTicket = async (req, res) => {
  const { asunto, descripcion } = req.body;
  const id_vendedor = req.user?.id || req.user?.id_vendedor;
  const id_restaurante = req.user?.id_restaurante;
  if (!asunto || !descripcion) {
    return res.status(400).json({ message: 'Asunto y descripción son requeridos' });
  }
  if (!id_vendedor || !id_restaurante) {
    return res.status(400).json({ message: 'No se pudo determinar el usuario o restaurante.' });
  }
  try {
    await ensureSoporteTicketsTable();
    const result = await pool.query(
      `INSERT INTO soporte_tickets (id_vendedor, id_restaurante, asunto, descripcion, estado, fecha_creacion)
       VALUES ($1, $2, $3, $4, 'pendiente', NOW()) RETURNING *`,
      [id_vendedor, id_restaurante, asunto, descripcion]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error al crear ticket de soporte:', error);
    res.status(500).json({ message: 'Error al crear ticket', detail: error.message });
  }
};

exports.getTickets = async (req, res) => {
  const id_vendedor = req.user?.id || req.user?.id_vendedor;
  const id_restaurante = req.user?.id_restaurante;
  if (!id_vendedor || !id_restaurante) {
    return res.status(400).json({ message: 'No se pudo determinar el usuario o restaurante.' });
  }
  try {
    await ensureSoporteTicketsTable();
    const result = await pool.query(
      `SELECT * FROM soporte_tickets WHERE id_vendedor = $1 AND id_restaurante = $2 ORDER BY fecha_creacion DESC`,
      [id_vendedor, id_restaurante]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error al obtener tickets de soporte:', error);
    res.status(500).json({ message: 'Error al obtener tickets', detail: error.message });
  }
}; 

// Endpoint para el HUB de gestión: obtiene todos los tickets (protegido con clave simple)
exports.getTicketsForHub = async (req, res) => {
  try {
    await ensureSoporteTicketsTable();
    const providedKey = req.query.key;
    const expectedKey = process.env.HUB_ADMIN_KEY || 'dev-key';
    if (!providedKey || providedKey !== expectedKey) {
      return res.status(403).json({ message: 'Clave de servicio inválida.' });
    }
    const result = await pool.query(`
      SELECT st.id_ticket AS id,
             st.id_restaurante,
             st.id_vendedor,
             st.asunto AS subject,
             st.descripcion AS description,
             'normal' AS priority,
             CASE st.estado
               WHEN 'pendiente' THEN 'open'
               WHEN 'resuelto' THEN 'resolved'
               ELSE 'open'
             END AS status,
             to_char(st.fecha_creacion, 'YYYY-MM-DD HH24:MI') AS createdAt,
             to_char(st.fecha_creacion, 'YYYY-MM-DD HH24:MI') AS updatedAt,
             COALESCE(v.username, 'N/A') AS contact,
             COALESCE(r.nombre, 'Restaurante') AS restaurantName,
             NULL AS email,
             NULL AS assignedTo,
             'technical' AS category
      FROM soporte_tickets st
      LEFT JOIN vendedores v ON st.id_vendedor = v.id_vendedor
      LEFT JOIN restaurantes r ON st.id_restaurante = r.id_restaurante
      ORDER BY st.fecha_creacion DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error al obtener tickets para hub:', error);
    res.status(500).json({ message: 'Error al obtener tickets para hub', detail: error.message });
  }
};

// Actualizar estado del ticket (open, in_progress, resolved, closed)
exports.updateTicketStatus = async (req, res) => {
  try {
    await ensureSoporteTicketsTable();
    const providedKey = req.query.key;
    const expectedKey = process.env.HUB_ADMIN_KEY || 'dev-key';
    if (!providedKey || providedKey !== expectedKey) {
      return res.status(403).json({ message: 'Clave de servicio inválida.' });
    }
    const { id } = req.params;
    const { status } = req.body || {};
    const valid = ['open', 'in_progress', 'resolved', 'closed'];
    if (!valid.includes(status)) {
      return res.status(400).json({ message: `Estado inválido: ${status}` });
    }
    const estadoMap = {
      open: 'pendiente',
      in_progress: 'en_proceso',
      resolved: 'resuelto',
      closed: 'cerrado'
    };
    const { rowCount } = await pool.query(
      'UPDATE soporte_tickets SET estado = $1 WHERE id_ticket = $2',
      [estadoMap[status], id]
    );
    if (rowCount === 0) return res.status(404).json({ message: 'Ticket no encontrado' });
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error('Error al actualizar estado del ticket:', error);
    res.status(500).json({ message: 'Error al actualizar estado', detail: error.message });
  }
};

// Agregar respuesta interna al ticket
exports.addTicketResponse = async (req, res) => {
  try {
    await ensureSoporteTicketsTable();
    await ensureSoporteRespuestasTable();
    const providedKey = req.query.key;
    const expectedKey = process.env.HUB_ADMIN_KEY || 'dev-key';
    if (!providedKey || providedKey !== expectedKey) {
      return res.status(403).json({ message: 'Clave de servicio inválida.' });
    }
    const { id } = req.params;
    const { autor, mensaje } = req.body || {};
    if (!mensaje) return res.status(400).json({ message: 'mensaje es requerido' });
    const autorFinal = autor || 'Soporte';
    const { rows } = await pool.query(
      'INSERT INTO soporte_respuestas (id_ticket, autor, mensaje) VALUES ($1, $2, $3) RETURNING *',
      [id, autorFinal, mensaje]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    console.error('Error al agregar respuesta al ticket:', error);
    res.status(500).json({ message: 'Error al agregar respuesta', detail: error.message });
  }
};