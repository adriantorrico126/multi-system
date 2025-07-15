const db = require('../config/database');

const Categoria = {
  async create({ nombre, id_restaurante }) {
    const query = `
      INSERT INTO categorias (nombre, id_restaurante)
      VALUES ($1, $2)
      RETURNING id_categoria, nombre, activo, created_at, id_restaurante;
    `;
    const values = [nombre, id_restaurante];
    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  },

  async findAll(id_restaurante, includeInactive = false) {
    let query = 'SELECT id_categoria, nombre, activo, created_at, id_restaurante FROM categorias WHERE id_restaurante = $1';
    const values = [id_restaurante];
    if (!includeInactive) {
      query += ' AND activo = true';
    }
    query += ' ORDER BY nombre ASC;';
    try {
      const { rows } = await db.query(query, values);
      return rows;
    } catch (error) {
      console.error('Error al obtener todas las categorías:', error);
      throw error;
    }
  },

  async findById(id_categoria, id_restaurante) {
    const query = `
      SELECT id_categoria, nombre, activo, created_at, id_restaurante
      FROM categorias
      WHERE id_categoria = $1 AND id_restaurante = $2;
    `;
    try {
      const { rows } = await db.query(query, [id_categoria, id_restaurante]);
      return rows[0]; // Retorna undefined si no se encuentra
    } catch (error) {
      console.error(`Error al obtener categoría con ID ${id_categoria} para restaurante ${id_restaurante}:`, error);
      throw error;
    }
  },

  async update(id_categoria, id_restaurante, { nombre, activo }) {
    // Construir la consulta dinámicamente basada en los campos proporcionados
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${paramCount++}`);
      values.push(nombre);
    }
    if (activo !== undefined) {
      fields.push(`activo = $${paramCount++}`);
      values.push(activo);
    }

    if (fields.length === 0) {
      // No hay campos para actualizar, podríamos retornar la categoría existente o un error
      return this.findById(id_categoria, id_restaurante);
    }

    values.push(id_categoria); // Para la cláusula WHERE
    values.push(id_restaurante); // Para la cláusula WHERE

    const query = `
      UPDATE categorias
      SET ${fields.join(', ')}
      WHERE id_categoria = $${paramCount} AND id_restaurante = $${paramCount + 1}
      RETURNING id_categoria, nombre, activo, created_at, id_restaurante;
    `;

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error(`Error al actualizar categoría con ID ${id_categoria} para restaurante ${id_restaurante}:`, error);
      throw error;
    }
  },

  async delete(id_categoria, id_restaurante) {
    // Soft delete: marcar como inactivo y agregar "E" al nombre
    const categoria = await this.findById(id_categoria, id_restaurante);
    if (!categoria) return null;
    
    // Solo agregar "E" si no la tiene ya
    const nuevoNombre = categoria.nombre.includes(' E') ? categoria.nombre : categoria.nombre + ' E';
    
    return this.update(id_categoria, id_restaurante, { 
      activo: false, 
      nombre: nuevoNombre 
    });
  },

  async hardDelete(id_categoria, id_restaurante) {
    // Para un borrado físico, si es necesario
    const query = 'DELETE FROM categorias WHERE id_categoria = $1 AND id_restaurante = $2 RETURNING *;';
    try {
      const { rows } = await db.query(query, [id_categoria, id_restaurante]);
      return rows[0]; // Retorna la categoría eliminada
    } catch (error) {
      console.error(`Error al eliminar (hard delete) categoría con ID ${id_categoria} para restaurante ${id_restaurante}:`, error);
      throw error;
    }
  }
};

module.exports = Categoria;
