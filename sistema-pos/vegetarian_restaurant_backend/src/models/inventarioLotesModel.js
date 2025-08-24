const { pool } = require('../config/database');

const InventarioLotesModel = {
  async getAll(id_restaurante) {
    try {
      // Verificar si la tabla existe
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'inventario_lotes'
        );
      `;
      
      const { rows: tableExists } = await pool.query(tableExistsQuery);
      
      if (!tableExists[0].exists) {
        // Si la tabla no existe, crear un array vacío
        console.log('Tabla inventario_lotes no existe, retornando array vacío');
        return [];
      }

      // Si la tabla existe, obtener los lotes filtrados por restaurante con información de categoría
      const query = `
        SELECT 
          il.*,
          p.nombre as producto_nombre,
          c.nombre as categoria_nombre,
          ca.nombre as categoria_almacen_nombre,
          ca.tipo_almacen,
          ca.condiciones_especiales,
          ca.rotacion_recomendada,
          CASE 
            WHEN il.fecha_caducidad < NOW() THEN 'vencido'
            WHEN il.fecha_caducidad < NOW() + INTERVAL '7 days' THEN 'por_vencer'
            WHEN il.fecha_caducidad < NOW() + INTERVAL '30 days' THEN 'proximo_vencer'
            ELSE 'vigente'
          END as estado_caducidad,
          CASE 
            WHEN il.cantidad_actual = 0 THEN 'sin_stock'
            WHEN il.cantidad_actual <= 10 THEN 'stock_bajo'
            WHEN il.cantidad_actual <= 50 THEN 'stock_medio'
            ELSE 'stock_ok'
          END as estado_stock
        FROM inventario_lotes il
        LEFT JOIN productos p ON il.id_producto = p.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN categorias_almacen ca ON il.id_categoria_almacen = ca.id_categoria_almacen
        WHERE il.id_restaurante = $1
        ORDER BY 
          CASE 
            WHEN il.fecha_caducidad < NOW() THEN 1
            WHEN il.fecha_caducidad < NOW() + INTERVAL '7 days' THEN 2
            WHEN il.fecha_caducidad < NOW() + INTERVAL '30 days' THEN 3
            ELSE 4
          END,
          il.fecha_caducidad ASC
      `;
      
      const { rows } = await pool.query(query, [id_restaurante]);
      return rows;
    } catch (error) {
      console.error('Error en getAll lotes:', error);
      // Si hay error, retornar array vacío en lugar de fallar
      return [];
    }
  },

  async getByCategoriaAlmacen(id_restaurante, id_categoria_almacen) {
    try {
      const query = `
        SELECT 
          il.*,
          p.nombre as producto_nombre,
          c.nombre as categoria_nombre,
          ca.nombre as categoria_almacen_nombre,
          ca.tipo_almacen,
          ca.condiciones_especiales,
          ca.rotacion_recomendada
        FROM inventario_lotes il
        LEFT JOIN productos p ON il.id_producto = p.id_producto
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN categorias_almacen ca ON il.id_categoria_almacen = ca.id_categoria_almacen
        WHERE il.id_restaurante = $1 AND il.id_categoria_almacen = $2
        ORDER BY il.fecha_caducidad ASC
      `;
      
      const { rows } = await pool.query(query, [id_restaurante, id_categoria_almacen]);
      return rows;
    } catch (error) {
      console.error('Error en getByCategoriaAlmacen:', error);
      return [];
    }
  },

  async create(loteData) {
    try {
      const {
        id_producto,
        numero_lote,
        cantidad_inicial,
        cantidad_actual,
        fecha_fabricacion,
        fecha_caducidad,
        precio_compra,
        id_categoria_almacen,
        ubicacion_especifica,
        proveedor,
        certificacion_organica,
        id_restaurante,
      } = loteData;

      // Verificar si la tabla existe antes de insertar
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'inventario_lotes'
        );
      `;
      
      const { rows: tableExists } = await pool.query(tableExistsQuery);
      
      if (!tableExists[0].exists) {
        throw new Error('Tabla inventario_lotes no existe');
      }

      const query = `
        INSERT INTO inventario_lotes (
          id_producto, numero_lote, cantidad_inicial, cantidad_actual, 
          fecha_fabricacion, fecha_caducidad, precio_compra, id_categoria_almacen,
          ubicacion_especifica, proveedor, certificacion_organica, id_restaurante, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
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
        id_categoria_almacen,
        ubicacion_especifica,
        proveedor,
        certificacion_organica,
        id_restaurante,
      ];

      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error en create lote:', error);
      throw error;
    }
  },

  async update(id, loteData) {
    try {
      const {
        id_producto,
        numero_lote,
        cantidad_inicial,
        cantidad_actual,
        fecha_fabricacion,
        fecha_caducidad,
        precio_compra,
        id_categoria_almacen,
        ubicacion_especifica,
        proveedor,
        certificacion_organica,
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
          id_categoria_almacen = $8,
          ubicacion_especifica = $9,
          proveedor = $10,
          certificacion_organica = $11,
          id_restaurante = $12,
          updated_at = NOW()
        WHERE id_lote = $13 AND id_restaurante = $12
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
        id_categoria_almacen,
        ubicacion_especifica,
        proveedor,
        certificacion_organica,
        id_restaurante,
        id,
      ];

      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (error) {
      console.error('Error en update lote:', error);
      throw error;
    }
  },

  async delete(id, id_restaurante) {
    try {
      const query = 'DELETE FROM inventario_lotes WHERE id_lote = $1 AND id_restaurante = $2 RETURNING *';
      const { rows } = await pool.query(query, [id, id_restaurante]);
      return rows[0];
    } catch (error) {
      console.error('Error en delete lote:', error);
      throw error;
    }
  },

  async getLotesPorVencer(id_restaurante, dias = 7) {
    try {
      const query = `
        SELECT 
          il.*,
          p.nombre as producto_nombre,
          ca.nombre as categoria_almacen_nombre,
          ca.tipo_almacen
        FROM inventario_lotes il
        LEFT JOIN productos p ON il.id_producto = p.id_producto
        LEFT JOIN categorias_almacen ca ON il.id_categoria_almacen = ca.id_categoria_almacen
        WHERE il.id_restaurante = $1 
          AND il.fecha_caducidad < NOW() + INTERVAL '${dias} days'
          AND il.fecha_caducidad >= NOW()
        ORDER BY il.fecha_caducidad ASC
      `;
      
      const { rows } = await pool.query(query, [id_restaurante]);
      return rows;
    } catch (error) {
      console.error('Error en getLotesPorVencer:', error);
      return [];
    }
  },

  async getProductosStockBajo(id_restaurante, limite = 10) {
    try {
      const query = `
        SELECT 
          il.*,
          p.nombre as producto_nombre,
          ca.nombre as categoria_almacen_nombre,
          ca.tipo_almacen
        FROM inventario_lotes il
        LEFT JOIN productos p ON il.id_producto = p.id_producto
        LEFT JOIN categorias_almacen ca ON il.id_categoria_almacen = ca.id_categoria_almacen
        WHERE il.id_restaurante = $1 AND il.cantidad_actual <= $2
        ORDER BY il.cantidad_actual ASC
      `;
      
      const { rows } = await pool.query(query, [id_restaurante, limite]);
      return rows;
    } catch (error) {
      console.error('Error en getProductosStockBajo:', error);
      return [];
    }
  }
};

module.exports = InventarioLotesModel;
