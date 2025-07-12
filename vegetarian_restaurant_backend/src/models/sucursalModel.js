const db = require('../config/database');

const Sucursal = {
  async findAll() {
    const query = 'SELECT id_sucursal, nombre, ciudad, direccion, activo FROM sucursales WHERE activo = true ORDER BY nombre ASC;';
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener todas las sucursales:', error);
      throw error;
    }
  },

  async findById(id_sucursal) {
    const query = 'SELECT id_sucursal, nombre, ciudad, direccion, activo FROM sucursales WHERE id_sucursal = $1;';
    try {
      const { rows } = await db.query(query, [id_sucursal]);
      return rows[0];
    } catch (error) {
      console.error(`Error al obtener sucursal con ID ${id_sucursal}:`, error);
      throw error;
    }
  },
};

module.exports = Sucursal;