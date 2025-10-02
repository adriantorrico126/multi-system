const { pool } = require('../config/database');

/**
 * Controlador para la gestión de stock por sucursal
 */
class StockSucursalController {
  
  /**
   * GET /api/v1/stock-sucursal/:id_sucursal
   * Obtiene el stock de todos los productos para una sucursal específica
   */
  static async getStockByBranch(req, res) {
    try {
      const { id_sucursal } = req.params;
      const id_restaurante = req.user.id_restaurante;

      // Verificar que la sucursal pertenece al restaurante del usuario
      const sucursalCheck = await pool.query(
        'SELECT id_sucursal FROM sucursales WHERE id_sucursal = $1 AND id_restaurante = $2 AND activo = true',
        [id_sucursal, id_restaurante]
      );

      if (sucursalCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada o no pertenece a tu restaurante'
        });
      }

      // Obtener stock de productos con información detallada
      const query = `
        SELECT 
          p.id_producto,
          p.nombre as nombre_producto,
          c.nombre as categoria_nombre,
          COALESCE(ss.stock_actual, 0) as stock_actual,
          COALESCE(ss.stock_minimo, 0) as stock_minimo,
          COALESCE(ss.stock_maximo, 0) as stock_maximo,
          p.precio,
          CASE 
            WHEN COALESCE(ss.stock_actual, 0) = 0 THEN 'sin_stock'
            WHEN COALESCE(ss.stock_actual, 0) <= COALESCE(ss.stock_minimo, 0) THEN 'critico'
            WHEN COALESCE(ss.stock_actual, 0) <= (COALESCE(ss.stock_minimo, 0) * 1.5) THEN 'bajo'
            ELSE 'ok'
          END as estado_stock,
          ss.activo as stock_activo,
          ss.fecha_actualizacion
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $1 AND ss.activo = true
        WHERE p.id_restaurante = $2 AND p.activo = true
        ORDER BY c.nombre, p.nombre
      `;

      const { rows } = await pool.query(query, [id_sucursal, id_restaurante]);

      res.json({
        success: true,
        data: rows,
        message: `Stock obtenido para la sucursal ${id_sucursal}`
      });

    } catch (error) {
      console.error('Error al obtener stock por sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/v1/stock-sucursal/:id_producto/:id_sucursal
   * Actualiza el stock de un producto específico en una sucursal
   */
  static async updateStockByBranch(req, res) {
    const client = await pool.connect();
    
    try {
      const { id_producto, id_sucursal } = req.params;
      const { stock_actual, stock_minimo, stock_maximo } = req.body;
      const id_restaurante = req.user.id_restaurante;

      // Validar datos de entrada
      if (stock_actual < 0 || stock_minimo < 0 || stock_maximo < 0) {
        return res.status(400).json({
          success: false,
          message: 'Los valores de stock no pueden ser negativos'
        });
      }

      if (stock_maximo < stock_minimo) {
        return res.status(400).json({
          success: false,
          message: 'El stock máximo no puede ser menor al stock mínimo'
        });
      }

      await client.query('BEGIN');

      // Verificar que el producto pertenece al restaurante
      const productCheck = await client.query(
        'SELECT id_producto FROM productos WHERE id_producto = $1 AND id_restaurante = $2 AND activo = true',
        [id_producto, id_restaurante]
      );

      if (productCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar que la sucursal pertenece al restaurante
      const sucursalCheck = await client.query(
        'SELECT id_sucursal FROM sucursales WHERE id_sucursal = $1 AND id_restaurante = $2 AND activo = true',
        [id_sucursal, id_restaurante]
      );

      if (sucursalCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }

      // Verificar si ya existe stock para este producto en esta sucursal
      const existingStock = await client.query(
        'SELECT id_stock_sucursal, stock_actual FROM stock_sucursal WHERE id_producto = $1 AND id_sucursal = $2 AND activo = true',
        [id_producto, id_sucursal]
      );

      if (existingStock.rows.length > 0) {
        // Actualizar stock existente
        const updateQuery = `
          UPDATE stock_sucursal 
          SET 
            stock_actual = $1,
            stock_minimo = $2,
            stock_maximo = $3,
            fecha_actualizacion = CURRENT_TIMESTAMP
          WHERE id_producto = $4 AND id_sucursal = $5 AND activo = true
          RETURNING *
        `;

        const { rows } = await client.query(updateQuery, [
          stock_actual, stock_minimo, stock_maximo, id_producto, id_sucursal
        ]);

        // Registrar movimiento de inventario
        const stockAnterior = existingStock.rows[0].stock_actual;
        const diferencia = stock_actual - stockAnterior;
        
        if (diferencia !== 0) {
          await client.query(
            `INSERT INTO movimientos_inventario 
             (id_producto, id_sucursal, tipo_movimiento, cantidad, stock_anterior, stock_actual, observaciones, fecha_movimiento)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
            [
              id_producto,
              id_sucursal,
              diferencia > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
              Math.abs(diferencia),
              stockAnterior,
              stock_actual,
              'Ajuste manual de stock por administrador'
            ]
          );
        }

        // Sincronizar stock global con la suma de sucursales
        const totalStockQuery = `
          SELECT COALESCE(SUM(stock_actual), 0) as total_stock
          FROM stock_sucursal 
          WHERE id_producto = $1 AND activo = true
        `;
        const { rows: totalRows } = await client.query(totalStockQuery, [id_producto]);
        const totalStock = totalRows[0].total_stock;

        // Actualizar stock global en productos
        await client.query(
          'UPDATE productos SET stock_actual = $1 WHERE id_producto = $2 AND id_restaurante = $3',
          [totalStock, id_producto, id_restaurante]
        );

        await client.query('COMMIT');

        res.json({
          success: true,
          data: rows[0],
          message: 'Stock actualizado correctamente'
        });

      } else {
        // Crear nuevo registro de stock
        const insertQuery = `
          INSERT INTO stock_sucursal 
          (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo, activo, fecha_creacion, fecha_actualizacion)
          VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `;

        const { rows } = await client.query(insertQuery, [
          id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo
        ]);

        // Registrar movimiento de inventario inicial
        await client.query(
          `INSERT INTO movimientos_inventario 
           (id_producto, id_sucursal, tipo_movimiento, cantidad, stock_anterior, stock_actual, observaciones, fecha_movimiento)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
          [
            id_producto,
            id_sucursal,
            'inicial',
            stock_actual,
            0,
            stock_actual,
            'Inicialización de stock por administrador'
          ]
        );

        // Sincronizar stock global con la suma de sucursales
        const totalStockQuery = `
          SELECT COALESCE(SUM(stock_actual), 0) as total_stock
          FROM stock_sucursal 
          WHERE id_producto = $1 AND activo = true
        `;
        const { rows: totalRows } = await client.query(totalStockQuery, [id_producto]);
        const totalStock = totalRows[0].total_stock;

        // Actualizar stock global en productos
        await client.query(
          'UPDATE productos SET stock_actual = $1 WHERE id_producto = $2 AND id_restaurante = $3',
          [totalStock, id_producto, id_restaurante]
        );

        await client.query('COMMIT');

        res.json({
          success: true,
          data: rows[0],
          message: 'Stock creado correctamente'
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar stock por sucursal:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  /**
   * POST /api/v1/stock-sucursal/transfer
   * Transfiere stock entre sucursales
   */
  static async transferStockBetweenBranches(req, res) {
    const client = await pool.connect();
    
    try {
      const { id_producto, cantidad, sucursal_origen, sucursal_destino, observaciones } = req.body;
      const id_restaurante = req.user.id_restaurante;

      // Validar datos de entrada
      if (cantidad <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad a transferir debe ser mayor a 0'
        });
      }

      if (sucursal_origen === sucursal_destino) {
        return res.status(400).json({
          success: false,
          message: 'La sucursal origen y destino no pueden ser la misma'
        });
      }

      await client.query('BEGIN');

      // Verificar que el producto pertenece al restaurante
      const productCheck = await client.query(
        'SELECT id_producto, nombre FROM productos WHERE id_producto = $1 AND id_restaurante = $2 AND activo = true',
        [id_producto, id_restaurante]
      );

      if (productCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar que ambas sucursales pertenecen al restaurante
      const sucursalesCheck = await client.query(
        'SELECT id_sucursal, nombre FROM sucursales WHERE id_sucursal IN ($1, $2) AND id_restaurante = $3 AND activo = true',
        [sucursal_origen, sucursal_destino, id_restaurante]
      );

      if (sucursalesCheck.rows.length !== 2) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Una o ambas sucursales no fueron encontradas'
        });
      }

      const sucursalOrigenInfo = sucursalesCheck.rows.find(s => s.id_sucursal === sucursal_origen);
      const sucursalDestinoInfo = sucursalesCheck.rows.find(s => s.id_sucursal === sucursal_destino);

      // Verificar stock disponible en sucursal origen
      const stockOrigen = await client.query(
        'SELECT stock_actual FROM stock_sucursal WHERE id_producto = $1 AND id_sucursal = $2 AND activo = true',
        [id_producto, sucursal_origen]
      );

      if (stockOrigen.rows.length === 0 || stockOrigen.rows[0].stock_actual < cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente en la sucursal origen'
        });
      }

      const stockActualOrigen = stockOrigen.rows[0].stock_actual;

      // Actualizar stock en sucursal origen (reducir)
      await client.query(
        'UPDATE stock_sucursal SET stock_actual = stock_actual - $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2 AND id_sucursal = $3',
        [cantidad, id_producto, sucursal_origen]
      );

      // Actualizar o crear stock en sucursal destino
      const stockDestino = await client.query(
        'SELECT stock_actual FROM stock_sucursal WHERE id_producto = $1 AND id_sucursal = $2 AND activo = true',
        [id_producto, sucursal_destino]
      );

      if (stockDestino.rows.length > 0) {
        // Actualizar stock existente
        await client.query(
          'UPDATE stock_sucursal SET stock_actual = stock_actual + $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = $2 AND id_sucursal = $3',
          [cantidad, id_producto, sucursal_destino]
        );
      } else {
        // Crear nuevo registro de stock
        await client.query(
          'INSERT INTO stock_sucursal (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo, activo, fecha_creacion, fecha_actualizacion) VALUES ($1, $2, $3, 0, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [id_producto, sucursal_destino, cantidad]
        );
      }

      // Registrar movimientos de inventario
      const observacionesCompletas = observaciones || `Transferencia de ${sucursalOrigenInfo.nombre} a ${sucursalDestinoInfo.nombre}`;

      // Movimiento en sucursal origen (salida)
      await client.query(
        `INSERT INTO movimientos_inventario 
         (id_producto, id_sucursal, tipo_movimiento, cantidad, stock_anterior, stock_actual, observaciones, fecha_movimiento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          id_producto,
          sucursal_origen,
          'transferencia_salida',
          cantidad,
          stockActualOrigen,
          stockActualOrigen - cantidad,
          observacionesCompletas
        ]
      );

      // Movimiento en sucursal destino (entrada)
      const stockActualDestino = stockDestino.rows.length > 0 ? stockDestino.rows[0].stock_actual : 0;
      await client.query(
        `INSERT INTO movimientos_inventario 
         (id_producto, id_sucursal, tipo_movimiento, cantidad, stock_anterior, stock_actual, observaciones, fecha_movimiento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
        [
          id_producto,
          sucursal_destino,
          'transferencia_entrada',
          cantidad,
          stockActualDestino,
          stockActualDestino + cantidad,
          observacionesCompletas
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Transferencia exitosa: ${cantidad} unidades de ${productCheck.rows[0].nombre} de ${sucursalOrigenInfo.nombre} a ${sucursalDestinoInfo.nombre}`,
        data: {
          id_producto,
          cantidad,
          sucursal_origen: sucursalOrigenInfo.nombre,
          sucursal_destino: sucursalDestinoInfo.nombre,
          observaciones: observacionesCompletas
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error al transferir stock entre sucursales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  /**
   * GET /api/v1/stock-sucursal/alerts
   * Obtiene alertas de stock (productos con stock bajo, crítico o sin stock)
   */
  static async getStockAlerts(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;

      const query = `
        SELECT 
          p.id_producto,
          p.nombre as nombre_producto,
          ss.id_sucursal,
          s.nombre as nombre_sucursal,
          ss.stock_actual,
          ss.stock_minimo,
          CASE 
            WHEN ss.stock_actual = 0 THEN 'sin_stock'
            WHEN ss.stock_actual <= ss.stock_minimo THEN 'stock_critico'
            WHEN ss.stock_actual <= (ss.stock_minimo * 1.5) THEN 'stock_bajo'
            ELSE 'ok'
          END as tipo_alerta,
          ss.fecha_actualizacion as fecha_alerta
        FROM productos p
        JOIN stock_sucursal ss ON p.id_producto = ss.id_producto
        JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
        WHERE p.id_restaurante = $1 
          AND p.activo = true 
          AND ss.activo = true 
          AND s.activo = true
          AND (
            ss.stock_actual = 0 
            OR ss.stock_actual <= ss.stock_minimo 
            OR ss.stock_actual <= (ss.stock_minimo * 1.5)
          )
        ORDER BY 
          CASE 
            WHEN ss.stock_actual = 0 THEN 1
            WHEN ss.stock_actual <= ss.stock_minimo THEN 2
            ELSE 3
          END,
          ss.stock_actual ASC
      `;

      const { rows } = await pool.query(query, [id_restaurante]);

      res.json({
        success: true,
        data: rows,
        message: `${rows.length} alertas de stock encontradas`
      });

    } catch (error) {
      console.error('Error al obtener alertas de stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/stock-sucursal/reports
   * Obtiene reportes de stock con filtros opcionales
   */
  static async getStockReports(req, res) {
    try {
      const { fecha_inicio, fecha_fin, id_sucursal, tipo_reporte } = req.query;
      const id_restaurante = req.user.id_restaurante;

      // Validar parámetros requeridos
      if (!id_restaurante) {
        return res.status(400).json({
          success: false,
          message: 'ID de restaurante requerido'
        });
      }

      let query = '';
      let params = [id_restaurante];
      let paramIndex = 2;

      // Construir query según el tipo de reporte
      switch (tipo_reporte) {
        case 'stock_bajo':
          query = `
            SELECT 
              p.id_producto,
              p.nombre as nombre_producto,
              c.nombre as categoria_nombre,
              ss.id_sucursal,
              s.nombre as nombre_sucursal,
              ss.stock_actual,
              ss.stock_minimo,
              ss.stock_maximo,
              ss.fecha_actualizacion
            FROM productos p
            JOIN categorias c ON p.id_categoria = c.id_categoria
            JOIN stock_sucursal ss ON p.id_producto = ss.id_producto
            JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
            WHERE p.id_restaurante = $1 
              AND p.activo = true 
              AND ss.activo = true 
              AND s.activo = true
              AND ss.stock_actual <= ss.stock_minimo
          `;
          break;

        case 'movimientos':
          query = `
            SELECT 
              mi.id_movimiento,
              p.nombre as nombre_producto,
              s.nombre as nombre_sucursal,
              mi.tipo_movimiento,
              mi.cantidad,
              mi.stock_anterior,
              mi.stock_actual,
              mi.observaciones,
              mi.fecha_movimiento
            FROM movimientos_inventario mi
            JOIN productos p ON mi.id_producto = p.id_producto
            JOIN sucursales s ON mi.id_sucursal = s.id_sucursal
            WHERE p.id_restaurante = $1
          `;
          
          if (fecha_inicio) {
            query += ` AND mi.fecha_movimiento >= $${paramIndex}`;
            params.push(fecha_inicio);
            paramIndex++;
          }
          
          if (fecha_fin) {
            query += ` AND mi.fecha_movimiento <= $${paramIndex}`;
            params.push(fecha_fin);
            paramIndex++;
          }
          
          query += ` ORDER BY mi.fecha_movimiento DESC`;
          break;

        case 'analytics':
          // Reporte de análisis por sucursal
          query = `
            SELECT 
              s.id_sucursal,
              s.nombre as sucursal_nombre,
              COALESCE(COUNT(DISTINCT ss.id_producto), 0) as total_productos,
              COALESCE(SUM(ss.stock_actual), 0) as stock_total,
              COALESCE(SUM(ss.stock_actual * p.precio), 0) as valor_total,
              COALESCE(COUNT(CASE WHEN ss.stock_actual = 0 THEN 1 END), 0) as productos_sin_stock,
              COALESCE(COUNT(CASE WHEN ss.stock_actual > 0 AND ss.stock_actual <= 10 THEN 1 END), 0) as productos_stock_bajo,
              COALESCE(COUNT(CASE WHEN ss.stock_actual > 10 THEN 1 END), 0) as productos_stock_ok,
              0 as rotacion_promedio
            FROM sucursales s
            LEFT JOIN stock_sucursal ss ON s.id_sucursal = ss.id_sucursal AND ss.activo = true
            LEFT JOIN productos p ON ss.id_producto = p.id_producto AND p.activo = true
            WHERE s.id_restaurante = $1 AND s.activo = true
          `;
          
          if (id_sucursal && id_sucursal !== 'all' && id_sucursal !== 'undefined') {
            query += ` AND s.id_sucursal = $${paramIndex}`;
            params.push(parseInt(id_sucursal));
            paramIndex++;
          }
          
          query += ` GROUP BY s.id_sucursal, s.nombre ORDER BY s.nombre`;
          break;

        default:
          // Reporte general de stock
          query = `
            SELECT 
              p.id_producto,
              p.nombre as nombre_producto,
              c.nombre as categoria_nombre,
              ss.id_sucursal,
              s.nombre as nombre_sucursal,
              ss.stock_actual,
              ss.stock_minimo,
              ss.stock_maximo,
              ss.fecha_actualizacion,
              CASE 
                WHEN ss.stock_actual = 0 THEN 'sin_stock'
                WHEN ss.stock_actual <= ss.stock_minimo THEN 'critico'
                WHEN ss.stock_actual <= (ss.stock_minimo * 1.5) THEN 'bajo'
                ELSE 'ok'
              END as estado_stock
            FROM productos p
            JOIN categorias c ON p.id_categoria = c.id_categoria
            JOIN stock_sucursal ss ON p.id_producto = ss.id_producto
            JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
            WHERE p.id_restaurante = $1 
              AND p.activo = true 
              AND ss.activo = true 
              AND s.activo = true
          `;
      }

      // Agregar filtro de sucursal si se especifica (solo para casos que no lo manejan internamente)
      if (id_sucursal && id_sucursal !== 'all' && id_sucursal !== 'undefined' && tipo_reporte !== 'analytics') {
        query += ` AND ss.id_sucursal = $${paramIndex}`;
        params.push(parseInt(id_sucursal));
      }

      if (tipo_reporte !== 'movimientos' && tipo_reporte !== 'analytics') {
        query += ` ORDER BY s.nombre, c.nombre, p.nombre`;
      }

      // Validar que la query se construyó correctamente
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de reporte no válido'
        });
      }

      console.log('Ejecutando query:', query);
      console.log('Con parámetros:', params);

      const { rows } = await pool.query(query, params);
      
      console.log('Query ejecutada exitosamente. Filas encontradas:', rows.length);
      if (rows.length > 0) {
        console.log('Primera fila de ejemplo:', rows[0]);
      }

      // Para el caso analytics, devolver en formato específico
      if (tipo_reporte === 'analytics') {
        console.log('Procesando datos de analytics...');
        console.log('Filas recibidas:', rows.length);
        
        const analyticsData = rows.map((row, index) => {
          try {
            console.log(`Procesando fila ${index + 1}:`, {
              id_sucursal: row.id_sucursal,
              sucursal_nombre: row.sucursal_nombre,
              total_productos: row.total_productos,
              stock_total: row.stock_total,
              valor_total: row.valor_total
            });
            
            const processedRow = {
              sucursal_id: Number(row.id_sucursal) || 0,
              sucursal_nombre: String(row.sucursal_nombre || 'Desconocida'),
              total_productos: Number(row.total_productos) || 0,
              stock_total: Number(row.stock_total) || 0,
              valor_total: Number(row.valor_total) || 0,
              productos_sin_stock: Number(row.productos_sin_stock) || 0,
              productos_stock_bajo: Number(row.productos_stock_bajo) || 0,
              productos_stock_ok: Number(row.productos_stock_ok) || 0,
              rotacion_promedio: Number(row.rotacion_promedio) || 0,
              categoria_distribucion: {}
            };
            
            console.log(`Fila ${index + 1} procesada:`, processedRow);
            return processedRow;
            
          } catch (mapError) {
            console.error(`Error mapeando fila ${index + 1}:`, row, mapError);
            return {
              sucursal_id: 0,
              sucursal_nombre: 'Error',
              total_productos: 0,
              stock_total: 0,
              valor_total: 0,
              productos_sin_stock: 0,
              productos_stock_bajo: 0,
              productos_stock_ok: 0,
              rotacion_promedio: 0,
              categoria_distribucion: {}
            };
          }
        });
        
        console.log('Datos de analytics procesados:', analyticsData.length, 'elementos');

        console.log('Enviando respuesta de analytics...');
        
        const response = {
          success: true,
          analytics: analyticsData,
          message: `Análisis generado: ${rows.length} sucursales encontradas`,
          filters: {
            fecha_inicio,
            fecha_fin,
            id_sucursal,
            tipo_reporte
          }
        };
        
        console.log('Respuesta preparada:', {
          success: response.success,
          analyticsCount: response.analytics.length,
          message: response.message
        });
        
        res.json(response);
      } else {
        res.json({
          success: true,
          data: rows,
          message: `Reporte generado: ${rows.length} registros encontrados`,
          filters: {
            fecha_inicio,
            fecha_fin,
            id_sucursal,
            tipo_reporte
          }
        });
      }

    } catch (error) {
      console.error('Error al generar reporte de stock:', error);
      console.error('Query que falló:', query);
      console.error('Parámetros:', params);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al generar reporte',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? {
          query: query,
          params: params,
          stack: error.stack
        } : undefined
      });
    }
  }

  /**
   * GET /api/v1/stock-sucursal/:id_sucursal/product/:id_producto
   * Obtiene el stock de un producto específico en una sucursal
   */
  static async getProductStockByBranch(req, res) {
    try {
      const { id_sucursal, id_producto } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const query = `
        SELECT 
          p.id_producto,
          p.nombre as nombre_producto,
          c.nombre as categoria_nombre,
          ss.id_sucursal,
          s.nombre as nombre_sucursal,
          COALESCE(ss.stock_actual, 0) as stock_actual,
          COALESCE(ss.stock_minimo, 0) as stock_minimo,
          COALESCE(ss.stock_maximo, 0) as stock_maximo,
          p.precio,
          ss.activo as stock_activo,
          ss.fecha_creacion,
          ss.fecha_actualizacion
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.id_sucursal = $1 AND ss.activo = true
        LEFT JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
        WHERE p.id_producto = $2 AND p.id_restaurante = $3 AND p.activo = true
      `;

      const { rows } = await pool.query(query, [id_sucursal, id_producto, id_restaurante]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: rows[0],
        message: 'Stock del producto obtenido correctamente'
      });

    } catch (error) {
      console.error('Error al obtener stock del producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * POST /api/v1/stock-sucursal/:id_sucursal/product/:id_producto
   * Crea o inicializa el stock de un producto en una sucursal
   */
  static async createProductStockInBranch(req, res) {
    try {
      const { id_sucursal, id_producto } = req.params;
      const { stock_actual = 0, stock_minimo = 0, stock_maximo = 0 } = req.body;
      const id_restaurante = req.user.id_restaurante;

      // Verificar que el producto y sucursal pertenecen al restaurante
      const checkQuery = `
        SELECT p.id_producto, s.id_sucursal 
        FROM productos p, sucursales s 
        WHERE p.id_producto = $1 AND s.id_sucursal = $2 
        AND p.id_restaurante = $3 AND s.id_restaurante = $3
        AND p.activo = true AND s.activo = true
      `;

      const checkResult = await pool.query(checkQuery, [id_producto, id_sucursal, id_restaurante]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto o sucursal no encontrados'
        });
      }

      // Verificar si ya existe stock
      const existingStock = await pool.query(
        'SELECT id_stock_sucursal FROM stock_sucursal WHERE id_producto = $1 AND id_sucursal = $2 AND activo = true',
        [id_producto, id_sucursal]
      );

      if (existingStock.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El stock para este producto ya existe en esta sucursal'
        });
      }

      // Crear nuevo stock
      const insertQuery = `
        INSERT INTO stock_sucursal 
        (id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo, activo, fecha_creacion, fecha_actualizacion)
        VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const { rows } = await pool.query(insertQuery, [
        id_producto, id_sucursal, stock_actual, stock_minimo, stock_maximo
      ]);

      res.json({
        success: true,
        data: rows[0],
        message: 'Stock creado correctamente'
      });

    } catch (error) {
      console.error('Error al crear stock del producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/v1/stock-sucursal/:id_sucursal/product/:id_producto
   * Elimina el stock de un producto en una sucursal (marca como inactivo)
   */
  static async deleteProductStockInBranch(req, res) {
    try {
      const { id_sucursal, id_producto } = req.params;
      const id_restaurante = req.user.id_restaurante;

      // Verificar que el stock existe y pertenece al restaurante
      const checkQuery = `
        SELECT ss.id_stock_sucursal 
        FROM stock_sucursal ss
        JOIN productos p ON ss.id_producto = p.id_producto
        JOIN sucursales s ON ss.id_sucursal = s.id_sucursal
        WHERE ss.id_producto = $1 AND ss.id_sucursal = $2 
        AND p.id_restaurante = $3 AND s.id_restaurante = $3
        AND ss.activo = true
      `;

      const checkResult = await pool.query(checkQuery, [id_producto, id_sucursal, id_restaurante]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Stock no encontrado'
        });
      }

      // Marcar como inactivo
      const updateQuery = `
        UPDATE stock_sucursal 
        SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto = $1 AND id_sucursal = $2 AND activo = true
        RETURNING *
      `;

      const { rows } = await pool.query(updateQuery, [id_producto, id_sucursal]);

      res.json({
        success: true,
        data: rows[0],
        message: 'Stock eliminado correctamente'
      });

    } catch (error) {
      console.error('Error al eliminar stock del producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/stock-sucursal/compare/:sucursal1/:sucursal2
   * Compara el stock entre dos sucursales
   */
  static async compareStockBetweenBranches(req, res) {
    try {
      const { sucursal1, sucursal2 } = req.params;
      const id_restaurante = req.user.id_restaurante;

      const query = `
        SELECT 
          p.id_producto,
          p.nombre as nombre_producto,
          c.nombre as categoria_nombre,
          COALESCE(s1.stock_actual, 0) as stock_sucursal1,
          COALESCE(s2.stock_actual, 0) as stock_sucursal2,
          (COALESCE(s1.stock_actual, 0) - COALESCE(s2.stock_actual, 0)) as diferencia,
          CASE 
            WHEN COALESCE(s1.stock_actual, 0) > COALESCE(s2.stock_actual, 0) THEN 'sucursal1_mayor'
            WHEN COALESCE(s1.stock_actual, 0) < COALESCE(s2.stock_actual, 0) THEN 'sucursal2_mayor'
            ELSE 'igual'
          END as comparacion
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN stock_sucursal s1 ON p.id_producto = s1.id_producto AND s1.id_sucursal = $1 AND s1.activo = true
        LEFT JOIN stock_sucursal s2 ON p.id_producto = s2.id_producto AND s2.id_sucursal = $2 AND s2.activo = true
        WHERE p.id_restaurante = $3 AND p.activo = true
        ORDER BY ABS(COALESCE(s1.stock_actual, 0) - COALESCE(s2.stock_actual, 0)) DESC, p.nombre
      `;

      const { rows } = await pool.query(query, [sucursal1, sucursal2, id_restaurante]);

      res.json({
        success: true,
        data: rows,
        message: `Comparación de stock entre sucursales ${sucursal1} y ${sucursal2}`
      });

    } catch (error) {
      console.error('Error al comparar stock entre sucursales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * GET /api/v1/stock-sucursal/consolidated
   * Obtiene un resumen consolidado del stock de todas las sucursales
   */
  static async getConsolidatedStock(req, res) {
    try {
      const id_restaurante = req.user.id_restaurante;

      const query = `
        SELECT 
          p.id_producto,
          p.nombre as nombre_producto,
          c.nombre as categoria_nombre,
          COUNT(ss.id_sucursal) as sucursales_con_stock,
          SUM(COALESCE(ss.stock_actual, 0)) as stock_total,
          AVG(COALESCE(ss.stock_actual, 0)) as stock_promedio,
          MIN(COALESCE(ss.stock_actual, 0)) as stock_minimo,
          MAX(COALESCE(ss.stock_actual, 0)) as stock_maximo,
          p.precio
        FROM productos p
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN stock_sucursal ss ON p.id_producto = ss.id_producto AND ss.activo = true
        LEFT JOIN sucursales s ON ss.id_sucursal = s.id_sucursal AND s.activo = true
        WHERE p.id_restaurante = $1 AND p.activo = true
        GROUP BY p.id_producto, p.nombre, c.nombre, p.precio
        ORDER BY stock_total DESC, p.nombre
      `;

      const { rows } = await pool.query(query, [id_restaurante]);

      res.json({
        success: true,
        data: rows,
        message: `Resumen consolidado de stock: ${rows.length} productos`
      });

    } catch (error) {
      console.error('Error al obtener resumen consolidado de stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
}

module.exports = StockSucursalController;
