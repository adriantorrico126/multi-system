const db = require('../config/database');

const Producto = {
  async getAllProductos() {
    const query = `
      SELECT p.id_producto, p.nombre, p.precio, p.stock_actual, p.activo, p.imagen_url,
             c.nombre as categoria_nombre, c.id_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      ORDER BY c.nombre, p.nombre
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async getProductoById(id) {
    const query = `
      SELECT p.id_producto, p.nombre, p.precio, p.stock_actual, p.activo, p.imagen_url,
             c.nombre as categoria_nombre, c.id_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  async createProducto({ nombre, precio, id_categoria, stock_actual, imagen_url }) {
    const query = `
      INSERT INTO productos (nombre, precio, id_categoria, stock_actual, imagen_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_producto, nombre, precio, id_categoria, stock_actual, imagen_url
    `;
    const { rows } = await db.query(query, [
      nombre, precio, id_categoria, stock_actual || 0, imagen_url
    ]);
    return rows[0];
  },

  async updateProducto(id, { nombre, precio, id_categoria, stock_actual, activo, imagen_url }) {
    const query = `
      UPDATE productos 
      SET nombre = COALESCE($1, nombre),
          precio = COALESCE($2, precio),
          id_categoria = COALESCE($3, id_categoria),
          stock_actual = COALESCE($4, stock_actual),
          activo = COALESCE($5, activo),
          imagen_url = COALESCE($6, imagen_url)
      WHERE id_producto = $7
      RETURNING id_producto, nombre, precio, id_categoria, stock_actual, activo, imagen_url
    `;
    const { rows } = await db.query(query, [
      nombre, precio, id_categoria, stock_actual, activo, imagen_url, id
    ]);
    return rows[0];
  },

  async deleteProducto(id) {
    const query = `
      UPDATE productos 
      SET activo = false
      WHERE id_producto = $1
      RETURNING id_producto
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  // Funciones de inventario
  async updateStock(id_producto, cantidad_cambio, tipo_movimiento, id_vendedor) {
    // Actualizar stock_actual en la tabla productos
    const updateProductQuery = `
      UPDATE productos
      SET stock_actual = stock_actual + $1
      WHERE id_producto = $2
      RETURNING stock_actual;
    `;
    const { rows: productRows } = await db.query(updateProductQuery, [cantidad_cambio, id_producto]);
    const nuevo_stock = productRows[0].stock_actual;

    // Registrar movimiento en la tabla movimientos_inventario
    const recordMovementQuery = `
      INSERT INTO movimientos_inventario (id_producto, tipo_movimiento, cantidad, stock_anterior, stock_actual, id_vendedor)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows: movementRows } = await db.query(recordMovementQuery, [
      id_producto, tipo_movimiento, cantidad_cambio, nuevo_stock - cantidad_cambio, nuevo_stock, id_vendedor
    ]);

    return { nuevo_stock, movimiento: movementRows[0] };
  },

  async getInventorySummary() {
    const query = `
      SELECT p.id_producto, p.nombre, p.stock_actual, CAST(p.precio AS DECIMAL(10,2)) as precio, c.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.activo = true
      ORDER BY p.nombre;
    `;
    const { rows } = await db.query(query);
    // Asegurar que el precio sea número
    return rows.map(row => ({
      ...row,
      precio: parseFloat(row.precio) || 0
    }));
  },

  async getStockMovementsHistory(id_producto = null, startDate = null, endDate = null) {
    let query = `
      SELECT mi.id_movimiento, mi.fecha_movimiento, mi.tipo_movimiento, mi.cantidad, mi.stock_anterior, mi.stock_actual,
             p.nombre as producto_nombre, v.username as vendedor_username
      FROM movimientos_inventario mi
      JOIN productos p ON mi.id_producto = p.id_producto
      LEFT JOIN vendedores v ON mi.id_vendedor = v.id_vendedor
    `;
    const params = [];
    const conditions = [];

    if (id_producto) {
      conditions.push('mi.id_producto = $1');
      params.push(id_producto);
    }
    if (startDate) {
      conditions.push(`mi.fecha_movimiento >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`mi.fecha_movimiento <= $${params.length + 1}`);
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY mi.fecha_movimiento DESC;';

    const { rows } = await db.query(query, params);
    return rows;
  }
};

module.exports = Producto;
