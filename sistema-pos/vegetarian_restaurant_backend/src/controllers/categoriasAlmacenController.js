const { pool } = require('../config/database');

exports.getAllCategorias = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    
    const query = `
      SELECT 
        ca.*,
        COUNT(il.id_lote) as total_lotes,
        COUNT(CASE WHEN il.fecha_caducidad < NOW() + INTERVAL '7 days' THEN 1 END) as lotes_por_vencer,
        COUNT(CASE WHEN il.cantidad_actual <= 10 THEN 1 END) as productos_stock_bajo
      FROM categorias_almacen ca
      LEFT JOIN inventario_lotes il ON ca.id_categoria_almacen = il.id_categoria_almacen 
        AND il.id_restaurante = ca.id_restaurante
      WHERE ca.id_restaurante = $1 AND ca.activo = true
      GROUP BY ca.id_categoria_almacen, ca.nombre, ca.descripcion, ca.tipo_almacen, 
               ca.condiciones_especiales, ca.rotacion_recomendada, ca.created_at, ca.updated_at
      ORDER BY ca.nombre
    `;
    
    const { rows } = await pool.query(query, [id_restaurante]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.getCategoriaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante;
    
    const query = `
      SELECT 
        ca.*,
        COUNT(il.id_lote) as total_lotes,
        SUM(il.cantidad_actual) as stock_total,
        AVG(il.precio_compra) as precio_promedio
      FROM categorias_almacen ca
      LEFT JOIN inventario_lotes il ON ca.id_categoria_almacen = il.id_categoria_almacen 
        AND il.id_restaurante = ca.id_restaurante
      WHERE ca.id_categoria_almacen = $1 AND ca.id_restaurante = $2
      GROUP BY ca.id_categoria_almacen
    `;
    
    const { rows } = await pool.query(query, [id, id_restaurante]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.createCategoria = async (req, res, next) => {
  try {
    const id_restaurante = req.user.id_restaurante;
    const { nombre, descripcion, tipo_almacen, condiciones_especiales, rotacion_recomendada } = req.body;
    
    const query = `
      INSERT INTO categorias_almacen (nombre, descripcion, tipo_almacen, condiciones_especiales, rotacion_recomendada, id_restaurante)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [nombre, descripcion, tipo_almacen, condiciones_especiales, rotacion_recomendada, id_restaurante];
    const { rows } = await pool.query(query, values);
    
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante;
    const { nombre, descripcion, tipo_almacen, condiciones_especiales, rotacion_recomendada, activo } = req.body;
    
    const query = `
      UPDATE categorias_almacen
      SET 
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        tipo_almacen = COALESCE($3, tipo_almacen),
        condiciones_especiales = COALESCE($4, condiciones_especiales),
        rotacion_recomendada = COALESCE($5, rotacion_recomendada),
        activo = COALESCE($6, activo),
        updated_at = NOW()
      WHERE id_categoria_almacen = $7 AND id_restaurante = $8
      RETURNING *
    `;
    
    const values = [nombre, descripcion, tipo_almacen, condiciones_especiales, rotacion_recomendada, activo, id, id_restaurante];
    const { rows } = await pool.query(query, values);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante;
    
    // Verificar si hay lotes asociados
    const checkQuery = 'SELECT COUNT(*) FROM inventario_lotes WHERE id_categoria_almacen = $1 AND id_restaurante = $2';
    const { rows: checkRows } = await pool.query(checkQuery, [id, id_restaurante]);
    
    if (parseInt(checkRows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar la categoría porque tiene lotes asociados' 
      });
    }
    
    const query = 'DELETE FROM categorias_almacen WHERE id_categoria_almacen = $1 AND id_restaurante = $2 RETURNING *';
    const { rows } = await pool.query(query, [id, id_restaurante]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getEstadisticasCategoria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_restaurante = req.user.id_restaurante;
    
    const query = `
      SELECT 
        ca.nombre,
        ca.tipo_almacen,
        COUNT(il.id_lote) as total_lotes,
        SUM(il.cantidad_actual) as stock_total,
        AVG(il.precio_compra) as precio_promedio,
        COUNT(CASE WHEN il.fecha_caducidad < NOW() + INTERVAL '7 days' THEN 1 END) as lotes_por_vencer,
        COUNT(CASE WHEN il.fecha_caducidad < NOW() THEN 1 END) as lotes_vencidos,
        COUNT(CASE WHEN il.cantidad_actual <= 10 THEN 1 END) as productos_stock_bajo,
        COUNT(CASE WHEN il.certificacion_organica = true THEN 1 END) as productos_organicos
      FROM categorias_almacen ca
      LEFT JOIN inventario_lotes il ON ca.id_categoria_almacen = il.id_categoria_almacen 
        AND il.id_restaurante = ca.id_restaurante
      WHERE ca.id_categoria_almacen = $1 AND ca.id_restaurante = $2
      GROUP BY ca.id_categoria_almacen, ca.nombre, ca.tipo_almacen
    `;
    
    const { rows } = await pool.query(query, [id, id_restaurante]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
};
