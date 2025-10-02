const { pool } = require('../config/database');

const Producto = {
  async getAllProductos(id_restaurante, id_sucursal = null) {
    let query;
    let params;
    
    console.log('🔍 Model: getAllProductos called with:', { id_restaurante, id_sucursal });
    
    if (id_sucursal) {
      // Obtener productos con stock por sucursal (mostrar todos los productos, incluso sin stock)
      query = `
        SELECT p.id_producto, p.nombre, p.precio, 
               COALESCE(ss.stock_actual, 0) as stock_actual, 
               p.activo, p.imagen_url, p.id_restaurante,
               c.nombre as categoria_nombre, c.id_categoria,
               COALESCE(ss.stock_minimo, 0) as stock_minimo, 
               COALESCE(ss.stock_maximo, 0) as stock_maximo
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $2 AND ss.activo = true
        WHERE p.id_restaurante = $1 AND p.activo = true
        ORDER BY c.nombre, p.nombre
      `;
      params = [id_restaurante, id_sucursal];
      console.log('🔍 Model: Query for sucursal:', query);
      console.log('🔍 Model: Params:', params);
    } else {
      // Obtener productos con stock global (compatibilidad)
      query = `
        SELECT p.id_producto, p.nombre, p.precio, p.stock_actual, p.activo, p.imagen_url, p.id_restaurante,
               c.nombre as categoria_nombre, c.id_categoria
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.id_restaurante = $1 AND p.activo = true
        ORDER BY c.nombre, p.nombre
      `;
      params = [id_restaurante];
      console.log('🔍 Model: Query for all products:', query);
      console.log('🔍 Model: Params:', params);
    }
    
    const { rows } = await pool.query(query, params);
    console.log('🔍 Model: Query result:', rows.length, 'rows');
    console.log('🔍 Model: First 3 rows:', rows.slice(0, 3).map(r => ({
      id: r.id_producto,
      nombre: r.nombre,
      stock: r.stock_actual
    })));
    return rows;
  },

  async getAllProductosWithInactive(id_restaurante, id_sucursal = null) {
    let query;
    let params;
    
    if (id_sucursal) {
      // Obtener productos con stock por sucursal (incluyendo inactivos, mostrar todos los productos)
      query = `
        SELECT p.id_producto, p.nombre, p.precio, 
               COALESCE(ss.stock_actual, 0) as stock_actual, 
               p.activo, p.imagen_url, p.id_restaurante,
               c.nombre as categoria_nombre, c.id_categoria,
               COALESCE(ss.stock_minimo, 0) as stock_minimo, 
               COALESCE(ss.stock_maximo, 0) as stock_maximo
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $2 AND ss.activo = true
        WHERE p.id_restaurante = $1
        ORDER BY c.nombre, p.nombre
      `;
      params = [id_restaurante, id_sucursal];
    } else {
      // Obtener productos con stock global (compatibilidad)
      query = `
        SELECT p.id_producto, p.nombre, p.precio, p.stock_actual, p.activo, p.imagen_url, p.id_restaurante,
               c.nombre as categoria_nombre, c.id_categoria
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.id_restaurante = $1
        ORDER BY c.nombre, p.nombre
      `;
      params = [id_restaurante];
    }
    
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async getProductoById(id, id_restaurante) {
    const query = `
      SELECT p.id_producto, p.nombre, p.precio, p.stock_actual, p.activo, p.imagen_url, p.id_restaurante,
             c.nombre as categoria_nombre, c.id_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = $1 AND p.id_restaurante = $2
    `;
    const { rows } = await pool.query(query, [id, id_restaurante]);
    return rows[0];
  },

  async createProducto({ nombre, precio, id_categoria, stock_actual, imagen_url, id_restaurante }) {
    const query = `
      INSERT INTO productos (nombre, precio, id_categoria, stock_actual, imagen_url, id_restaurante)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_producto, nombre, precio, id_categoria, stock_actual, imagen_url, id_restaurante
    `;
    const { rows } = await pool.query(query, [
      nombre, precio, id_categoria, stock_actual || 0, imagen_url, id_restaurante
    ]);
    return rows[0];
  },

  async updateProducto(id, id_restaurante, { nombre, precio, id_categoria, stock_actual, activo, imagen_url }) {
    const query = `
      UPDATE productos 
      SET nombre = COALESCE($1, nombre),
          precio = COALESCE($2, precio),
          id_categoria = COALESCE($3, id_categoria),
          stock_actual = COALESCE($4, stock_actual),
          activo = COALESCE($5, activo),
          imagen_url = COALESCE($6, imagen_url)
      WHERE id_producto = $7 AND id_restaurante = $8
      RETURNING id_producto, nombre, precio, id_categoria, stock_actual, activo, imagen_url, id_restaurante
    `;
    const { rows } = await pool.query(query, [
      nombre, precio, id_categoria, stock_actual, activo, imagen_url, id, id_restaurante
    ]);
    return rows[0];
  },

  async deleteProducto(id, id_restaurante) {
    const query = `
      UPDATE productos 
      SET activo = false
      WHERE id_producto = $1 AND id_restaurante = $2
      RETURNING id_producto, id_restaurante
    `;
    const { rows } = await pool.query(query, [id, id_restaurante]);
    return rows[0];
  },

  // Funciones de inventario
  async updateStock(id_producto, cantidad_cambio, tipo_movimiento, id_vendedor, id_restaurante) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Obtener el stock actual antes de la actualización
      const currentStockQuery = `
        SELECT stock_actual FROM productos 
        WHERE id_producto = $1 AND id_restaurante = $2
      `;
      const { rows: currentStockRows } = await client.query(currentStockQuery, [id_producto, id_restaurante]);
      
      if (currentStockRows.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      const stock_anterior = currentStockRows[0].stock_actual || 0;
      const nuevo_stock = Math.max(0, stock_anterior + cantidad_cambio); // No permitir stock negativo
      
      // Actualizar stock_actual en la tabla productos
      const updateProductQuery = `
        UPDATE productos
        SET stock_actual = $1
        WHERE id_producto = $2 AND id_restaurante = $3
        RETURNING stock_actual;
      `;
      const { rows: productRows } = await client.query(updateProductQuery, [nuevo_stock, id_producto, id_restaurante]);
      
      if (productRows.length === 0) {
        throw new Error('Error al actualizar el producto');
      }
      
      // Registrar movimiento en la tabla movimientos_inventario
      const recordMovementQuery = `
        INSERT INTO movimientos_inventario (
          id_producto, 
          tipo_movimiento, 
          cantidad, 
          stock_anterior, 
          stock_actual, 
          id_vendedor, 
          id_restaurante,
          motivo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      
      const motivo = `Ajuste manual de stock: ${tipo_movimiento}`;
      const { rows: movementRows } = await client.query(recordMovementQuery, [
        id_producto, 
        tipo_movimiento, 
        Math.abs(cantidad_cambio), // Siempre guardar cantidad positiva
        stock_anterior, 
        nuevo_stock, 
        id_vendedor, 
        id_restaurante,
        motivo
      ]);

      await client.query('COMMIT');
      return { 
        nuevo_stock: productRows[0].stock_actual, 
        stock_anterior: stock_anterior,
        movimiento: movementRows[0] 
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getInventorySummary(id_restaurante) {
    const query = `
      SELECT 
        p.id_producto, 
        p.nombre, 
        COALESCE(SUM(ss.stock_actual), 0) as stock_actual, 
        CAST(p.precio AS DECIMAL(10,2)) as precio, 
        c.nombre as categoria_nombre, 
        p.id_restaurante
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.activo = true
      WHERE p.activo = true AND p.id_restaurante = $1
      GROUP BY p.id_producto, p.nombre, p.precio, c.nombre, p.id_restaurante
      ORDER BY p.nombre;
    `;
    const { rows } = await pool.query(query, [id_restaurante]);
    // Asegurar que el precio sea número
    return rows.map(row => ({
      ...row,
      precio: parseFloat(row.precio) || 0
    }));
  },

  async getStockMovementsHistory(id_restaurante, id_producto = null, startDate = null, endDate = null) {
    let query = `
      SELECT mi.id_movimiento, mi.fecha_movimiento, mi.tipo_movimiento, mi.cantidad, mi.stock_anterior, mi.stock_actual, mi.id_restaurante,
             p.nombre as producto_nombre, v.username as vendedor_username
      FROM movimientos_inventario mi
      JOIN productos p ON mi.id_producto = p.id_producto
      LEFT JOIN vendedores v ON mi.id_vendedor = v.id_vendedor
      WHERE mi.id_restaurante = $1
    `;
    const params = [id_restaurante];
    let paramIndex = 2;

    if (id_producto) {
      query += ` AND mi.id_producto = $${paramIndex}`;
      params.push(id_producto);
      paramIndex++;
    }
    if (startDate) {
      query += ` AND mi.fecha_movimiento >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND mi.fecha_movimiento <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' ORDER BY mi.fecha_movimiento DESC;';

    const { rows } = await pool.query(query, params);
    return rows;
  }
};

module.exports = Producto;
