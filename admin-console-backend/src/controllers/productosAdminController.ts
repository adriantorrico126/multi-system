import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../config/logger';

export const getProductosByRestaurante = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // id_restaurante
    const result = await pool.query(
      `SELECT id_producto, nombre, precio, id_categoria, stock_actual, activo, imagen_url, created_at
       FROM productos WHERE id_restaurante = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json({ data: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error al listar productos: %s', message);
    res.status(500).json({ error: 'Error al listar productos', detail: message });
  }
};

export const importProductos = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // id_restaurante
    const { productos } = req.body as { productos: Array<any> };
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: 'Se requiere un arreglo de productos no vacío' });
    }
    await client.query('BEGIN');
    let inserted = 0, updated = 0, failed = 0;
    for (const p of productos) {
      try {
        const nombre = (p.nombre || '').trim();
        const precio = Number(p.precio);
        const categoriaNombre = (p.categoria_nombre || '').trim();
        const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : null;
        const activo = p.activo === undefined || p.activo === null ? true : Boolean(p.activo);
        const imagen_url = p.imagen_url || null;
        if (!nombre || isNaN(precio)) {
          failed++; continue;
        }
        // Resolver categoría si se envía nombre
        let id_categoria: number | null = null;
        if (categoriaNombre) {
          const cat = await client.query(
            'SELECT id_categoria FROM categorias WHERE LOWER(nombre) = LOWER($1) AND id_restaurante = $2',
            [categoriaNombre, id]
          );
          if (cat.rows.length) {
            id_categoria = cat.rows[0].id_categoria;
          } else {
            const newCat = await client.query(
              'INSERT INTO categorias (nombre, activo, created_at, id_restaurante) VALUES ($1, true, NOW(), $2) RETURNING id_categoria',
              [categoriaNombre, id]
            );
            id_categoria = newCat.rows[0].id_categoria;
          }
        }
        // Intentar actualizar por (id_restaurante, nombre)
        const prev = await client.query(
          'SELECT id_producto FROM productos WHERE id_restaurante = $1 AND LOWER(nombre) = LOWER($2) LIMIT 1',
          [id, nombre]
        );
        if (prev.rows.length) {
          await client.query(
            `UPDATE productos SET precio = $1, id_categoria = $2, stock_actual = COALESCE($3, stock_actual), activo = $4, imagen_url = $5
             WHERE id_producto = $6`,
            [precio, id_categoria, stock, activo, imagen_url, prev.rows[0].id_producto]
          );
          updated++;
        } else {
          await client.query(
            `INSERT INTO productos (nombre, precio, id_categoria, stock_actual, activo, imagen_url, created_at, id_restaurante)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
            [nombre, precio, id_categoria, stock, activo, imagen_url, id]
          );
          inserted++;
        }
      } catch (e) {
        failed++;
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Importación completada', summary: { inserted, updated, failed } });
  } catch (error) {
    await client.query('ROLLBACK');
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: 'Error al importar productos', detail: message });
  } finally {
    client.release();
  }
};


