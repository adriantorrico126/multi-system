const { pool } = require('../config/database');
const logger = require('../config/logger');

const ModificadorModel = {
  // =====================================================
  // MÉTODOS BÁSICOS (Compatibilidad con código existente)
  // =====================================================

  /**
   * Listar modificadores de un producto (Legacy - mantener compatibilidad)
   * @deprecated Usar obtenerModificadoresCompletos para nueva funcionalidad
   */
  async listarPorProducto(id_producto) {
    const res = await pool.query(
      'SELECT * FROM productos_modificadores WHERE id_producto = $1 AND activo = true',
      [id_producto]
    );
    return res.rows;
  },

  /**
   * Crear modificador para un producto (Legacy - mantener compatibilidad)
   * @deprecated Usar crearCompleto para nueva funcionalidad
   */
  async crear({ id_producto, nombre_modificador, precio_extra = 0, tipo_modificador }) {
    // Obtener id_restaurante del producto
    const productoResult = await pool.query(
      'SELECT id_restaurante FROM productos WHERE id_producto = $1',
      [id_producto]
    );
    
    if (productoResult.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }
    
    const id_restaurante = productoResult.rows[0].id_restaurante;
    
    const res = await pool.query(
      `INSERT INTO productos_modificadores (
        id_producto, nombre_modificador, precio_extra, tipo_modificador, id_restaurante
      )
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_producto, nombre_modificador, precio_extra, tipo_modificador, id_restaurante]
    );
    return res.rows[0];
  },

  /**
   * Asociar modificadores a un detalle de venta (Actualizado para nueva estructura)
   */
  async asociarAMovimiento(id_detalle_venta, id_modificadores, modificadoresData = []) {
    logger.info(`🔍 [ModificadorModel] Asociando ${id_modificadores.length} modificadores al detalle ${id_detalle_venta}`);
    
    for (let i = 0; i < id_modificadores.length; i++) {
      const id_modificador = id_modificadores[i];
      
      // Buscar datos del modificador en modificadoresData si está disponible
      const modificadorData = modificadoresData.find(m => m.id_modificador === id_modificador);
      const cantidad = modificadorData?.cantidad || 1;
      const precio_unitario = modificadorData?.precio_unitario || modificadorData?.precio_extra || 0;
      const subtotal = precio_unitario * cantidad;
      
      logger.info(`🔍 [ModificadorModel] Insertando modificador ${id_modificador}: cantidad=${cantidad}, precio=${precio_unitario}, subtotal=${subtotal}`);
      
      await pool.query(
        `INSERT INTO detalle_ventas_modificadores (
          id_detalle_venta, id_modificador, cantidad, precio_unitario, subtotal
        ) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id_detalle_venta, id_modificador) DO UPDATE SET
         cantidad = EXCLUDED.cantidad,
         precio_unitario = EXCLUDED.precio_unitario,
         subtotal = EXCLUDED.subtotal`,
        [id_detalle_venta, id_modificador, cantidad, precio_unitario, subtotal]
      );
    }
    
    logger.info(`✅ [ModificadorModel] Modificadores asociados exitosamente al detalle ${id_detalle_venta}`);
  },

  /**
   * Listar modificadores de un detalle de venta
   */
  async listarPorDetalleVenta(id_detalle_venta) {
    const res = await pool.query(
      `SELECT pm.*, dvm.cantidad, dvm.precio_aplicado, dvm.subtotal, dvm.observaciones
       FROM detalle_ventas_modificadores dvm
       JOIN productos_modificadores pm ON dvm.id_modificador = pm.id_modificador
       WHERE dvm.id_detalle_venta = $1`,
      [id_detalle_venta]
    );
    return res.rows;
  },

  // =====================================================
  // MÉTODOS NUEVOS - SISTEMA PROFESIONAL
  // =====================================================

  /**
   * Obtener todos los grupos de modificadores de un producto
   * con sus modificadores anidados en JSON
   */
  async obtenerGruposPorProducto(id_producto, id_restaurante) {
    const query = `
      SELECT * FROM vista_grupos_por_producto
      WHERE id_producto = $1
      AND id_restaurante = $2
      ORDER BY orden_display
    `;
    
    const result = await pool.query(query, [id_producto, id_restaurante]);
    return result.rows;
  },

  /**
   * Obtener modificadores completos con información detallada
   */
  async obtenerModificadoresCompletos(id_producto, id_restaurante) {
    const query = `
      SELECT 
        id_modificador,
        nombre_modificador,
        descripcion,
        precio_extra,
        precio_final,
        tipo_modificador,
        stock_disponible,
        controlar_stock,
        imagen_url,
        calorias,
        es_vegetariano,
        es_vegano,
        contiene_gluten,
        alergenos,
        grupo_nombre,
        grupo_tipo,
        grupo_obligatorio,
        estado_stock,
        orden_display
      FROM vista_modificadores_completa
      WHERE id_producto = $1
      AND id_restaurante = $2
      ORDER BY grupo_obligatorio DESC, orden_display
    `;
    
    const result = await pool.query(query, [id_producto, id_restaurante]);
    return result.rows;
  },

  /**
   * Crear modificador completo con todos los campos
   */
  async crearCompleto(modificadorData) {
    const {
      id_producto,
      nombre_modificador,
      precio_extra,
      tipo_modificador,
      id_grupo_modificador,
      stock_disponible,
      controlar_stock = false,
      imagen_url,
      descripcion,
      calorias,
      es_vegetariano = false,
      es_vegano = false,
      contiene_gluten = false,
      alergenos = [],
      precio_base,
      descuento_porcentaje,
      orden_display = 0,
      id_restaurante
    } = modificadorData;

    const query = `
      INSERT INTO productos_modificadores (
        id_producto, nombre_modificador, precio_extra, tipo_modificador,
        id_grupo_modificador, stock_disponible, controlar_stock,
        imagen_url, descripcion, calorias, es_vegetariano, es_vegano,
        contiene_gluten, alergenos, precio_base, descuento_porcentaje,
        orden_display, id_restaurante, activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id_producto, nombre_modificador, precio_extra, tipo_modificador,
      id_grupo_modificador, stock_disponible, controlar_stock,
      imagen_url, descripcion, calorias, es_vegetariano, es_vegano,
      contiene_gluten, alergenos, precio_base, descuento_porcentaje,
      orden_display, id_restaurante
    ]);

    return result.rows[0];
  },

  /**
   * Actualizar modificador
   */
  async actualizar(id_modificador, modificadorData, id_restaurante) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construir query dinámicamente solo con campos proporcionados
    const allowedFields = [
      'nombre_modificador', 'precio_extra', 'tipo_modificador',
      'id_grupo_modificador', 'stock_disponible', 'controlar_stock',
      'imagen_url', 'descripcion', 'calorias', 'es_vegetariano',
      'es_vegano', 'contiene_gluten', 'alergenos', 'precio_base',
      'descuento_porcentaje', 'orden_display', 'activo'
    ];

    Object.entries(modificadorData).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    // Agregar updated_at
    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE productos_modificadores
      SET ${fields.join(', ')}
      WHERE id_modificador = $${paramIndex}
      AND id_restaurante = $${paramIndex + 1}
      RETURNING *
    `;

    values.push(id_modificador, id_restaurante);

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Modificador no encontrado o no pertenece al restaurante');
    }
    
    return result.rows[0];
  },

  /**
   * Validar selección de modificadores usando función SQL
   */
  async validarSeleccion(id_producto, modificadoresSeleccionados) {
    const query = `
      SELECT * FROM validar_modificadores_producto($1, $2)
    `;

    const result = await pool.query(query, [
      id_producto,
      modificadoresSeleccionados || []
    ]);

    return result.rows[0];
  },

  /**
   * Asociar modificadores a detalle de venta con cantidades y precios
   */
  async asociarAVenta(id_detalle_venta, modificadores) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const mod of modificadores) {
        const { 
          id_modificador, 
          cantidad = 1, 
          precio_aplicado, 
          observaciones 
        } = mod;

        // Obtener precio si no se proporcionó
        let precioFinal = precio_aplicado;
        if (!precioFinal) {
          const modResult = await client.query(
            'SELECT precio_extra FROM productos_modificadores WHERE id_modificador = $1',
            [id_modificador]
          );
          precioFinal = modResult.rows[0]?.precio_extra || 0;
        }

        const subtotal = cantidad * precioFinal;

        await client.query(
          `INSERT INTO detalle_ventas_modificadores (
            id_detalle_venta, id_modificador, cantidad, 
            precio_unitario, subtotal, precio_aplicado, observaciones
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id_detalle_venta,
            id_modificador,
            cantidad,
            precioFinal,
            subtotal,
            precioFinal,
            observaciones
          ]
        );
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al asociar modificadores a venta:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Obtener modificadores de una venta completa
   */
  async obtenerPorVenta(id_venta) {
    const query = `
      SELECT 
        dvm.*,
        pm.nombre_modificador,
        pm.tipo_modificador,
        pm.imagen_url,
        pm.descripcion,
        dv.id_producto,
        p.nombre as producto_nombre
      FROM detalle_ventas_modificadores dvm
      JOIN detalle_ventas dv ON dvm.id_detalle_venta = dv.id_detalle
      JOIN productos_modificadores pm ON dvm.id_modificador = pm.id_modificador
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta = $1
      ORDER BY dv.id_detalle, pm.nombre_modificador
    `;

    const result = await pool.query(query, [id_venta]);
    return result.rows;
  },

  /**
   * Verificar disponibilidad de stock
   */
  async verificarStock(id_modificador, cantidad = 1) {
    const query = `
      SELECT 
        controlar_stock,
        stock_disponible,
        nombre_modificador
      FROM productos_modificadores
      WHERE id_modificador = $1
    `;

    const result = await pool.query(query, [id_modificador]);
    const mod = result.rows[0];

    if (!mod) {
      throw new Error('Modificador no encontrado');
    }

    if (mod.controlar_stock && (mod.stock_disponible === null || mod.stock_disponible < cantidad)) {
      throw new Error(
        `Stock insuficiente de ${mod.nombre_modificador}. ` +
        `Disponible: ${mod.stock_disponible || 0}, Requerido: ${cantidad}`
      );
    }

    return {
      disponible: true,
      stock_actual: mod.stock_disponible,
      nombre: mod.nombre_modificador
    };
  },

  /**
   * Verificar stock de múltiples modificadores
   */
  async verificarStockMultiple(modificadores) {
    const resultados = [];
    
    for (const mod of modificadores) {
      try {
        const resultado = await this.verificarStock(
          mod.id_modificador,
          mod.cantidad || 1
        );
        resultados.push({
          id_modificador: mod.id_modificador,
          ...resultado
        });
      } catch (error) {
        throw error; // Lanzar error inmediatamente si hay stock insuficiente
      }
    }
    
    return resultados;
  },

  /**
   * Actualizar stock de modificador (manual)
   */
  async actualizarStock(id_modificador, nuevoStock, id_restaurante) {
    const query = `
      UPDATE productos_modificadores
      SET stock_disponible = $1, updated_at = NOW()
      WHERE id_modificador = $2
      AND id_restaurante = $3
      AND controlar_stock = true
      RETURNING *
    `;

    const result = await pool.query(query, [nuevoStock, id_modificador, id_restaurante]);
    
    if (result.rows.length === 0) {
      throw new Error('Modificador no encontrado o no controla stock');
    }
    
    return result.rows[0];
  },

  /**
   * Eliminar (desactivar) modificador
   */
  async eliminar(id_modificador, id_restaurante) {
    const query = `
      UPDATE productos_modificadores
      SET activo = false, updated_at = NOW()
      WHERE id_modificador = $1
      AND id_restaurante = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id_modificador, id_restaurante]);
    
    if (result.rows.length === 0) {
      throw new Error('Modificador no encontrado');
    }
    
    return result.rows[0];
  },

  /**
   * Obtener estadísticas de uso de modificadores
   */
  async obtenerEstadisticas(id_restaurante, fechaInicio, fechaFin) {
    const query = `
      SELECT 
        pm.id_modificador,
        pm.nombre_modificador,
        pm.tipo_modificador,
        COUNT(dvm.id_modificador) as veces_vendido,
        SUM(dvm.cantidad) as cantidad_total_vendida,
        SUM(dvm.subtotal) as ingresos_generados,
        AVG(dvm.precio_aplicado) as precio_promedio
      FROM productos_modificadores pm
      LEFT JOIN detalle_ventas_modificadores dvm ON pm.id_modificador = dvm.id_modificador
      LEFT JOIN detalle_ventas dv ON dvm.id_detalle_venta = dv.id_detalle
      LEFT JOIN ventas v ON dv.id_venta = v.id_venta
      WHERE pm.id_restaurante = $1
      AND (v.fecha BETWEEN $2 AND $3 OR v.fecha IS NULL)
      GROUP BY pm.id_modificador, pm.nombre_modificador, pm.tipo_modificador
      ORDER BY veces_vendido DESC
    `;

    const result = await pool.query(query, [id_restaurante, fechaInicio, fechaFin]);
    return result.rows;
  },

  /**
   * Obtener modificadores populares (más vendidos)
   */
  async obtenerMasPopulares(id_restaurante, limite = 10) {
    const query = `
      SELECT 
        pm.id_modificador,
        pm.nombre_modificador,
        pm.precio_extra,
        pm.tipo_modificador,
        COUNT(dvm.id_modificador) as veces_vendido,
        SUM(dvm.subtotal) as ingresos_totales
      FROM productos_modificadores pm
      JOIN detalle_ventas_modificadores dvm ON pm.id_modificador = dvm.id_modificador
      JOIN detalle_ventas dv ON dvm.id_detalle_venta = dv.id_detalle
      JOIN ventas v ON dv.id_venta = v.id_venta
      WHERE pm.id_restaurante = $1
      AND v.fecha >= NOW() - INTERVAL '30 days'
      GROUP BY pm.id_modificador, pm.nombre_modificador, pm.precio_extra, pm.tipo_modificador
      ORDER BY veces_vendido DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [id_restaurante, limite]);
    return result.rows;
  },

  /**
   * Obtener modificadores con stock bajo
   */
  async obtenerConStockBajo(id_restaurante, umbral = 5) {
    const query = `
      SELECT 
        id_modificador,
        nombre_modificador,
        stock_disponible,
        tipo_modificador,
        precio_extra
      FROM productos_modificadores
      WHERE id_restaurante = $1
      AND controlar_stock = true
      AND stock_disponible <= $2
      AND activo = true
      ORDER BY stock_disponible ASC
    `;

    const result = await pool.query(query, [id_restaurante, umbral]);
    return result.rows;
  }
};

module.exports = ModificadorModel; 