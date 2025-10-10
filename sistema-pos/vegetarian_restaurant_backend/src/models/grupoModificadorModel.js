const { pool } = require('../config/database');
const logger = require('../config/logger');

const GrupoModificadorModel = {
  /**
   * Obtener todos los grupos de un restaurante
   */
  async obtenerTodos(id_restaurante) {
    const query = `
      SELECT * FROM grupos_modificadores
      WHERE id_restaurante = $1
      AND activo = true
      ORDER BY orden_display, nombre
    `;

    const result = await pool.query(query, [id_restaurante]);
    return result.rows;
  },

  /**
   * Obtener un grupo por ID
   */
  async obtenerPorId(id_grupo_modificador, id_restaurante) {
    const query = `
      SELECT * FROM grupos_modificadores
      WHERE id_grupo_modificador = $1
      AND id_restaurante = $2
    `;

    const result = await pool.query(query, [id_grupo_modificador, id_restaurante]);
    return result.rows[0];
  },

  /**
   * Crear grupo de modificadores
   */
  async crear(grupoData) {
    const {
      nombre,
      descripcion,
      tipo,
      min_selecciones = 0,
      max_selecciones,
      es_obligatorio = false,
      orden_display = 0,
      id_restaurante
    } = grupoData;

    // Validaciones
    if (!nombre || !tipo || !id_restaurante) {
      throw new Error('Faltan campos obligatorios: nombre, tipo, id_restaurante');
    }

    if (!['seleccion_unica', 'seleccion_multiple', 'cantidad_variable'].includes(tipo)) {
      throw new Error('Tipo de grupo inválido');
    }

    if (max_selecciones && max_selecciones < min_selecciones) {
      throw new Error('max_selecciones debe ser mayor o igual a min_selecciones');
    }

    const query = `
      INSERT INTO grupos_modificadores (
        nombre, descripcion, tipo, min_selecciones, max_selecciones,
        es_obligatorio, orden_display, id_restaurante
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      nombre, descripcion, tipo, min_selecciones, max_selecciones,
      es_obligatorio, orden_display, id_restaurante
    ]);

    return result.rows[0];
  },

  /**
   * Actualizar grupo de modificadores
   */
  async actualizar(id_grupo_modificador, grupoData, id_restaurante) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'nombre', 'descripcion', 'tipo', 'min_selecciones',
      'max_selecciones', 'es_obligatorio', 'orden_display', 'activo'
    ];

    Object.entries(grupoData).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE grupos_modificadores
      SET ${fields.join(', ')}
      WHERE id_grupo_modificador = $${paramIndex}
      AND id_restaurante = $${paramIndex + 1}
      RETURNING *
    `;

    values.push(id_grupo_modificador, id_restaurante);

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Grupo no encontrado o no pertenece al restaurante');
    }
    
    return result.rows[0];
  },

  /**
   * Eliminar (desactivar) grupo
   */
  async eliminar(id_grupo_modificador, id_restaurante) {
    const query = `
      UPDATE grupos_modificadores
      SET activo = false, updated_at = NOW()
      WHERE id_grupo_modificador = $1
      AND id_restaurante = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id_grupo_modificador, id_restaurante]);
    
    if (result.rows.length === 0) {
      throw new Error('Grupo no encontrado');
    }
    
    return result.rows[0];
  },

  /**
   * Asociar grupo a producto
   */
  async asociarAProducto(id_producto, id_grupo_modificador, orden_display = 0, es_obligatorio = false) {
    const query = `
      INSERT INTO productos_grupos_modificadores (
        id_producto, id_grupo_modificador, orden_display, es_obligatorio
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id_producto, id_grupo_modificador) 
      DO UPDATE SET 
        orden_display = EXCLUDED.orden_display,
        es_obligatorio = EXCLUDED.es_obligatorio
      RETURNING *
    `;

    const result = await pool.query(query, [
      id_producto, id_grupo_modificador, orden_display, es_obligatorio
    ]);

    return result.rows[0];
  },

  /**
   * Desasociar grupo de producto
   */
  async desasociarDeProducto(id_producto, id_grupo_modificador) {
    const query = `
      DELETE FROM productos_grupos_modificadores
      WHERE id_producto = $1
      AND id_grupo_modificador = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id_producto, id_grupo_modificador]);
    return result.rows[0];
  },

  /**
   * Obtener grupos de un producto
   */
  async obtenerPorProducto(id_producto) {
    const query = `
      SELECT 
        gm.*,
        pgm.orden_display as orden_producto,
        pgm.es_obligatorio as obligatorio_producto
      FROM grupos_modificadores gm
      JOIN productos_grupos_modificadores pgm 
        ON gm.id_grupo_modificador = pgm.id_grupo_modificador
      WHERE pgm.id_producto = $1
      AND gm.activo = true
      ORDER BY pgm.orden_display
    `;

    const result = await pool.query(query, [id_producto]);
    return result.rows;
  },

  /**
   * Obtener productos que usan un grupo
   */
  async obtenerProductosDelGrupo(id_grupo_modificador, id_restaurante) {
    const query = `
      SELECT 
        p.*,
        pgm.orden_display,
        pgm.es_obligatorio
      FROM productos p
      JOIN productos_grupos_modificadores pgm ON p.id_producto = pgm.id_producto
      WHERE pgm.id_grupo_modificador = $1
      AND p.id_restaurante = $2
      AND p.activo = true
      ORDER BY p.nombre
    `;

    const result = await pool.query(query, [id_grupo_modificador, id_restaurante]);
    return result.rows;
  },

  /**
   * Obtener estadísticas de un grupo
   */
  async obtenerEstadisticas(id_grupo_modificador, id_restaurante) {
    const query = `
      SELECT 
        gm.nombre as grupo_nombre,
        COUNT(DISTINCT pm.id_modificador) as total_modificadores,
        COUNT(DISTINCT pgm.id_producto) as total_productos_asociados,
        SUM(CASE WHEN pm.activo = true THEN 1 ELSE 0 END) as modificadores_activos,
        SUM(CASE WHEN pm.controlar_stock = true THEN 1 ELSE 0 END) as con_control_stock,
        SUM(CASE WHEN pm.stock_disponible <= 5 AND pm.controlar_stock = true THEN 1 ELSE 0 END) as con_stock_bajo
      FROM grupos_modificadores gm
      LEFT JOIN productos_modificadores pm ON gm.id_grupo_modificador = pm.id_grupo_modificador
      LEFT JOIN productos_grupos_modificadores pgm ON gm.id_grupo_modificador = pgm.id_grupo_modificador
      WHERE gm.id_grupo_modificador = $1
      AND gm.id_restaurante = $2
      GROUP BY gm.id_grupo_modificador, gm.nombre
    `;

    const result = await pool.query(query, [id_grupo_modificador, id_restaurante]);
    return result.rows[0];
  }
};

module.exports = GrupoModificadorModel;

