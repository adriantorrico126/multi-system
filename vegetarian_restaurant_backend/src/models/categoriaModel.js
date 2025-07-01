const db = require('../config/database');

const Categoria = {
  async create({ nombre }) {
    const query = `
      INSERT INTO categorias (nombre)
      VALUES ($1)
      RETURNING id_categoria, nombre, activo, created_at;
    `;
    const values = [nombre];
    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  },

  async findAll(includeInactive = false) {
    let query = 'SELECT id_categoria, nombre, activo, created_at FROM categorias';
    if (!includeInactive) {
      query += ' WHERE activo = true';
    }
    query += ' ORDER BY nombre ASC;';
    try {
      const { rows } = await db.query(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener todas las categorías:', error);
      throw error;
    }
  },

  async findById(id_categoria) {
    const query = `
      SELECT id_categoria, nombre, activo, created_at
      FROM categorias
      WHERE id_categoria = $1;
    `;
    try {
      const { rows } = await db.query(query, [id_categoria]);
      return rows[0]; // Retorna undefined si no se encuentra
    } catch (error) {
      console.error(`Error al obtener categoría con ID ${id_categoria}:`, error);
      throw error;
    }
  },

  async update(id_categoria, { nombre, activo }) {
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
      return this.findById(id_categoria);
    }

    values.push(id_categoria); // Para la cláusula WHERE

    const query = `
      UPDATE categorias
      SET ${fields.join(', ')}
      WHERE id_categoria = $${paramCount}
      RETURNING id_categoria, nombre, activo, created_at;
    `;

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      console.error(`Error al actualizar categoría con ID ${id_categoria}:`, error);
      throw error;
    }
  },

  async delete(id_categoria) {
    // En lugar de borrar, se podría cambiar 'activo' a false (soft delete)
    // Por ahora, implementaremos un borrado lógico (soft delete).
    return this.update(id_categoria, { activo: false });
  },

  async hardDelete(id_categoria) {
    // Para un borrado físico, si es necesario
    const query = 'DELETE FROM categorias WHERE id_categoria = $1 RETURNING *;';
    try {
      const { rows } = await db.query(query, [id_categoria]);
      return rows[0]; // Retorna la categoría eliminada
    } catch (error) {
      console.error(`Error al eliminar (hard delete) categoría con ID ${id_categoria}:`, error);
      throw error;
    }
  }
};

module.exports = Categoria;
