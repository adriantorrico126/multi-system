const db = require('../config/database');

const Sucursal = {
  async findAll(id_restaurante) {
    const query = 'SELECT id_sucursal, nombre, ciudad, direccion, activo, id_restaurante FROM sucursales WHERE activo = true AND id_restaurante = $1 ORDER BY nombre ASC;';
    try {
      const { rows } = await db.query(query, [id_restaurante]);
      return rows;
    } catch (error) {
      console.error('Error al obtener todas las sucursales:', error);
      throw error;
    }
  },

  async findById(id_sucursal, id_restaurante) {
    const query = 'SELECT id_sucursal, nombre, ciudad, direccion, activo, id_restaurante FROM sucursales WHERE id_sucursal = $1 AND id_restaurante = $2;';
    try {
      const { rows } = await db.query(query, [id_sucursal, id_restaurante]);
      return rows[0];
    } catch (error) {
      console.error(`Error al obtener sucursal con ID ${id_sucursal} para restaurante ${id_restaurante}:`, error);
      throw error;
    }
  },

  async create(sucursalData) {
    const { nombre, ciudad, direccion, id_restaurante } = sucursalData;
    const query = `
      INSERT INTO sucursales (nombre, ciudad, direccion, id_restaurante) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id_sucursal, nombre, ciudad, direccion, activo, id_restaurante;
    `;
    try {
      const { rows } = await db.query(query, [nombre, ciudad, direccion, id_restaurante]);
      return rows[0];
    } catch (error) {
      console.error('Error al crear sucursal:', error);
      throw error;
    }
  },

  async update(id_sucursal, sucursalData, id_restaurante) {
    const { nombre, ciudad, direccion, activo } = sucursalData;
    const query = `
      UPDATE sucursales 
      SET nombre = $1, ciudad = $2, direccion = $3, activo = $4 
      WHERE id_sucursal = $5 AND id_restaurante = $6 
      RETURNING id_sucursal, nombre, ciudad, direccion, activo, id_restaurante;
    `;
    try {
      const { rows } = await db.query(query, [nombre, ciudad, direccion, activo, id_sucursal, id_restaurante]);
      return rows[0];
    } catch (error) {
      console.error('Error al actualizar sucursal:', error);
      throw error;
    }
  },

  async delete(id_sucursal, id_restaurante) {
    const query = `
      UPDATE sucursales 
      SET activo = false 
      WHERE id_sucursal = $1 AND id_restaurante = $2 
      RETURNING id_sucursal;
    `;
    try {
      const { rows } = await db.query(query, [id_sucursal, id_restaurante]);
      return rows[0];
    } catch (error) {
      console.error('Error al eliminar sucursal:', error);
      throw error;
    }
  },

  async nombreExiste(nombre, id_restaurante, excludeId = null) {
    let query = 'SELECT COUNT(*) FROM sucursales WHERE nombre = $1 AND id_restaurante = $2 AND activo = true';
    let params = [nombre, id_restaurante];
    
    if (excludeId) {
      query += ' AND id_sucursal != $3';
      params.push(excludeId);
    }
    
    try {
      const { rows } = await db.query(query, params);
      return parseInt(rows[0].count) > 0;
    } catch (error) {
      console.error('Error al verificar si existe el nombre de sucursal:', error);
      throw error;
    }
  }
};

module.exports = Sucursal;