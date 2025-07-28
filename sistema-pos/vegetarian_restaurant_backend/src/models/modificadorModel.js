const { pool } = require('../config/database');

const ModificadorModel = {
  // Listar modificadores de un producto
  async listarPorProducto(id_producto) {
    const res = await pool.query(
      'SELECT * FROM productos_modificadores WHERE id_producto = $1',
      [id_producto]
    );
    return res.rows;
  },

  // Crear modificador para un producto
  async crear({ id_producto, nombre_modificador, precio_extra = 0, tipo_modificador }) {
    const res = await pool.query(
      `INSERT INTO productos_modificadores (id_producto, nombre_modificador, precio_extra, tipo_modificador)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_producto, nombre_modificador, precio_extra, tipo_modificador]
    );
    return res.rows[0];
  },

  // Asociar modificadores a un detalle de venta
  async asociarAMovimiento(id_detalle_venta, id_modificadores) {
    for (const id_modificador of id_modificadores) {
      await pool.query(
        `INSERT INTO detalle_ventas_modificadores (id_detalle_venta, id_modificador)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id_detalle_venta, id_modificador]
      );
    }
  },

  // Listar modificadores de un detalle de venta
  async listarPorDetalleVenta(id_detalle_venta) {
    const res = await pool.query(
      `SELECT pm.* FROM detalle_ventas_modificadores dvm
       JOIN productos_modificadores pm ON dvm.id_modificador = pm.id_modificador
       WHERE dvm.id_detalle_venta = $1`,
      [id_detalle_venta]
    );
    return res.rows;
  }
};

module.exports = ModificadorModel; 