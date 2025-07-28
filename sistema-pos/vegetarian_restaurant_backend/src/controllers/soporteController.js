const pool = require('../config/database');

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
    const result = await pool.query(
      `INSERT INTO soporte_tickets (id_vendedor, id_restaurante, asunto, descripcion, estado, fecha_creacion)
       VALUES ($1, $2, $3, $4, 'pendiente', NOW()) RETURNING *`,
      [id_vendedor, id_restaurante, asunto, descripcion]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear ticket', detail: error.message });
  }
};

exports.getTickets = async (req, res) => {
  const id_vendedor = req.user?.id || req.user?.id_vendedor;
  if (!id_vendedor) {
    return res.status(400).json({ message: 'No se pudo determinar el usuario.' });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM soporte_tickets WHERE id_vendedor = $1 ORDER BY fecha_creacion DESC`,
      [id_vendedor]
    );
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tickets', detail: error.message });
  }
}; 