const { pool } = require('../config/database');

const InventarioLotesModel = {
  async getAll() {
    const query = 'SELECT * FROM inventario_lotes';
    const { rows } = await pool.query(query);
    return rows;
  },

  async create(loteData) {
    const {
      id_producto,
      numero_lote,
      cantidad_inicial,
      cantidad_actual,
      fecha_fabricacion,
      fecha_caducidad,
      precio_compra,
      id_restaurante,
    } = loteData;

    const query = `
      INSERT INTO inventario_lotes (id_producto, numero_lote, cantidad_inicial, cantidad_actual, fecha_fabricacion, fecha_caducidad, precio_compra, id_restaurante)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      id_producto,
      numero_lote,
      cantidad_inicial,
      cantidad_actual,
      fecha_fabricacion,
      fecha_caducidad,
      precio_compra,
      id_restaurante,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async update(id, loteData) {
    const {
      id_producto,
      numero_lote,
      cantidad_inicial,
      cantidad_actual,
      fecha_fabricacion,
      fecha_caducidad,
      precio_compra,
      id_restaurante,
    } = loteData;

    const query = `
      UPDATE inventario_lotes
      SET
        id_producto = $1,
        numero_lote = $2,
        cantidad_inicial = $3,
        cantidad_actual = $4,
        fecha_fabricacion = $5,
        fecha_caducidad = $6,
        precio_compra = $7,
        id_restaurante = $8,
        updated_at = NOW()
      WHERE id_lote = $9
      RETURNING *
    `;

    const values = [
      id_producto,
      numero_lote,
      cantidad_inicial,
      cantidad_actual,
      fecha_fabricacion,
      fecha_caducidad,
      precio_compra,
      id_restaurante,
      id,
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async delete(id) {
    const query = 'DELETE FROM inventario_lotes WHERE id_lote = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },
};

module.exports = InventarioLotesModel;
