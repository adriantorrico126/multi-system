const { pool } = require('../config/database');
const logger = require('../config/logger');

class ConsumoPensionadoModel {
  /**
   * Registrar un consumo de pensionado
   */
  static async registrar(consumoData, id_restaurante) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        id_pensionado,
        fecha_consumo,
        id_mesa,
        id_venta,
        tipo_comida = 'almuerzo',
        productos_consumidos = [],
        total_consumido = 0.00,
        observaciones,
        mesero_asignado
      } = consumoData;

      // Verificar que el pensionado existe y está activo
      const pensionadoQuery = `
        SELECT * FROM pensionados 
        WHERE id_pensionado = $1 AND id_restaurante = $2 AND estado = 'activo'
      `;
      const pensionadoResult = await client.query(pensionadoQuery, [id_pensionado, id_restaurante]);

      if (pensionadoResult.rows.length === 0) {
        throw new Error('Pensionado no encontrado o inactivo');
      }

      const pensionado = pensionadoResult.rows[0];

      // Verificar límites de consumo
      const consumoHoyQuery = `
        SELECT COUNT(*) as consumos_hoy
        FROM consumo_pensionados
        WHERE id_pensionado = $1 AND fecha_consumo = $2 AND tipo_comida = $3
      `;
      const consumoHoyResult = await client.query(consumoHoyQuery, [id_pensionado, fecha_consumo, tipo_comida]);

      if (parseInt(consumoHoyResult.rows[0].consumos_hoy) >= pensionado.max_platos_dia) {
        throw new Error(`Límite diario de ${pensionado.max_platos_dia} platos alcanzado para ${tipo_comida}`);
      }

      // Insertar el consumo
      const insertQuery = `
        INSERT INTO consumo_pensionados (
          id_pensionado, id_restaurante, fecha_consumo, id_mesa, id_venta,
          tipo_comida, productos_consumidos, total_consumido, observaciones, mesero_asignado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        id_pensionado, id_restaurante, fecha_consumo, id_mesa, id_venta,
        tipo_comida, JSON.stringify(productos_consumidos), total_consumido, observaciones, mesero_asignado
      ];

      const result = await client.query(insertQuery, values);
      await client.query('COMMIT');

      logger.info(`✅ [ConsumoPensionadoModel] Consumo registrado para pensionado ${id_pensionado}`);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ [ConsumoPensionadoModel] Error al registrar consumo:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener consumos de un pensionado en un rango de fechas
   */
  static async obtenerPorPensionado(id_pensionado, id_restaurante, fecha_desde, fecha_hasta) {
    try {
      let query = `
        SELECT 
          c.*,
          m.numero as numero_mesa,
          u.nombre as mesero_nombre
        FROM consumo_pensionados c
        LEFT JOIN mesas m ON c.id_mesa = m.id_mesa
        LEFT JOIN usuarios u ON c.mesero_asignado = u.id_usuario
        WHERE c.id_pensionado = $1 AND c.id_restaurante = $2
      `;

      const values = [id_pensionado, id_restaurante];
      let paramIndex = 3;

      if (fecha_desde) {
        query += ` AND c.fecha_consumo >= $${paramIndex}`;
        values.push(fecha_desde);
        paramIndex++;
      }

      if (fecha_hasta) {
        query += ` AND c.fecha_consumo <= $${paramIndex}`;
        values.push(fecha_hasta);
        paramIndex++;
      }

      query += ` ORDER BY c.fecha_consumo DESC, c.created_at DESC`;

      const result = await pool.query(query, values);
      
      logger.info(`✅ [ConsumoPensionadoModel] Obtenidos ${result.rows.length} consumos para pensionado ${id_pensionado}`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [ConsumoPensionadoModel] Error al obtener consumos:`, error);
      throw error;
    }
  }

  /**
   * Obtener consumos por fecha
   */
  static async obtenerPorFecha(id_restaurante, fecha) {
    try {
      const query = `
        SELECT 
          c.*,
          p.nombre_cliente,
          p.tipo_cliente,
          m.numero as numero_mesa,
          u.nombre as mesero_nombre
        FROM consumo_pensionados c
        LEFT JOIN pensionados p ON c.id_pensionado = p.id_pensionado
        LEFT JOIN mesas m ON c.id_mesa = m.id_mesa
        LEFT JOIN usuarios u ON c.mesero_asignado = u.id_usuario
        WHERE c.id_restaurante = $1 AND c.fecha_consumo = $2
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, [id_restaurante, fecha]);
      
      logger.info(`✅ [ConsumoPensionadoModel] Obtenidos ${result.rows.length} consumos para fecha ${fecha}`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [ConsumoPensionadoModel] Error al obtener consumos por fecha:`, error);
      throw error;
    }
  }

  /**
   * Obtener resumen de consumo por período
   */
  static async obtenerResumenPeriodo(id_pensionado, id_restaurante, fecha_desde, fecha_hasta) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT fecha_consumo) as total_dias,
          COUNT(*) as total_consumos,
          COALESCE(SUM(total_consumido), 0) as total_gastado,
          COALESCE(AVG(total_consumido), 0) as promedio_por_consumo,
          COUNT(CASE WHEN tipo_comida = 'desayuno' THEN 1 END) as consumos_desayuno,
          COUNT(CASE WHEN tipo_comida = 'almuerzo' THEN 1 END) as consumos_almuerzo,
          COUNT(CASE WHEN tipo_comida = 'cena' THEN 1 END) as consumos_cena,
          MIN(fecha_consumo) as primera_fecha,
          MAX(fecha_consumo) as ultima_fecha
        FROM consumo_pensionados
        WHERE id_pensionado = $1 
          AND id_restaurante = $2
          AND fecha_consumo >= $3
          AND fecha_consumo <= $4
      `;

      const result = await pool.query(query, [id_pensionado, id_restaurante, fecha_desde, fecha_hasta]);
      
      logger.info(`✅ [ConsumoPensionadoModel] Resumen obtenido para pensionado ${id_pensionado}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`❌ [ConsumoPensionadoModel] Error al obtener resumen:`, error);
      throw error;
    }
  }

  /**
   * Obtener productos más consumidos por un pensionado
   */
  static async obtenerProductosPopulares(id_pensionado, id_restaurante, fecha_desde, fecha_hasta, limite = 10) {
    try {
      const query = `
        WITH productos_expandidos AS (
          SELECT 
            jsonb_array_elements(productos_consumidos) as producto,
            fecha_consumo,
            tipo_comida
          FROM consumo_pensionados
          WHERE id_pensionado = $1 
            AND id_restaurante = $2
            AND fecha_consumo >= $3
            AND fecha_consumo <= $4
        )
        SELECT 
          producto->>'nombre' as nombre_producto,
          producto->>'id_producto' as id_producto,
          COUNT(*) as veces_consumido,
          COALESCE(SUM((producto->>'cantidad')::numeric), 0) as cantidad_total,
          COALESCE(SUM((producto->>'subtotal')::numeric), 0) as total_gastado,
          array_agg(DISTINCT tipo_comida) as tipos_comida
        FROM productos_expandidos
        WHERE producto->>'nombre' IS NOT NULL
        GROUP BY producto->>'nombre', producto->>'id_producto'
        ORDER BY veces_consumido DESC, total_gastado DESC
        LIMIT $5
      `;

      const result = await pool.query(query, [id_pensionado, id_restaurante, fecha_desde, fecha_hasta, limite]);
      
      logger.info(`✅ [ConsumoPensionadoModel] Productos populares obtenidos para pensionado ${id_pensionado}`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [ConsumoPensionadoModel] Error al obtener productos populares:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas generales de consumo por restaurante
   */
  static async obtenerEstadisticasGenerales(id_restaurante, fecha_desde, fecha_hasta) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT c.id_pensionado) as pensionados_activos,
          COUNT(*) as total_consumos,
          COUNT(DISTINCT c.fecha_consumo) as dias_con_consumo,
          COALESCE(SUM(c.total_consumido), 0) as total_facturado,
          COALESCE(AVG(c.total_consumido), 0) as promedio_por_consumo,
          COUNT(CASE WHEN c.tipo_comida = 'desayuno' THEN 1 END) as total_desayunos,
          COUNT(CASE WHEN c.tipo_comida = 'almuerzo' THEN 1 END) as total_almuerzos,
          COUNT(CASE WHEN c.tipo_comida = 'cena' THEN 1 END) as total_cenas,
          COALESCE(AVG(p.descuento_aplicado), 0) as promedio_descuento
        FROM consumo_pensionados c
        LEFT JOIN pensionados p ON c.id_pensionado = p.id_pensionado
        WHERE c.id_restaurante = $1
          AND c.fecha_consumo >= $2
          AND c.fecha_consumo <= $3
      `;

      const result = await pool.query(query, [id_restaurante, fecha_desde, fecha_hasta]);
      
      logger.info(`✅ [ConsumoPensionadoModel] Estadísticas generales obtenidas para restaurante ${id_restaurante}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`❌ [ConsumoPensionadoModel] Error al obtener estadísticas generales:`, error);
      throw error;
    }
  }

  /**
   * Actualizar un consumo existente
   */
  static async actualizar(id_consumo, id_restaurante, datosActualizacion) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const camposPermitidos = [
        'fecha_consumo', 'id_mesa', 'id_venta', 'tipo_comida',
        'productos_consumidos', 'total_consumido', 'observaciones', 'mesero_asignado'
      ];

      const camposActualizar = [];
      const values = [];
      let paramIndex = 1;

      for (const [campo, valor] of Object.entries(datosActualizacion)) {
        if (camposPermitidos.includes(campo)) {
          if (campo === 'productos_consumidos') {
            camposActualizar.push(`${campo} = $${paramIndex}`);
            values.push(JSON.stringify(valor));
          } else {
            camposActualizar.push(`${campo} = $${paramIndex}`);
            values.push(valor);
          }
          paramIndex++;
        }
      }

      if (camposActualizar.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      values.push(id_consumo, id_restaurante);

      const query = `
        UPDATE consumo_pensionados 
        SET ${camposActualizar.join(', ')}
        WHERE id_consumo = $${paramIndex} AND id_restaurante = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Consumo no encontrado');
      }

      logger.info(`✅ [ConsumoPensionadoModel] Consumo actualizado: ${id_consumo}`);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ [ConsumoPensionadoModel] Error al actualizar consumo:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar un consumo
   */
  static async eliminar(id_consumo, id_restaurante) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        DELETE FROM consumo_pensionados
        WHERE id_consumo = $1 AND id_restaurante = $2
        RETURNING *
      `;

      const result = await client.query(query, [id_consumo, id_restaurante]);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Consumo no encontrado');
      }

      logger.info(`✅ [ConsumoPensionadoModel] Consumo eliminado: ${id_consumo}`);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ [ConsumoPensionadoModel] Error al eliminar consumo:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener consumos por mesa en una fecha
   */
  static async obtenerPorMesa(id_restaurante, id_mesa, fecha) {
    try {
      const query = `
        SELECT 
          c.*,
          p.nombre_cliente,
          p.tipo_cliente,
          u.nombre as mesero_nombre
        FROM consumo_pensionados c
        LEFT JOIN pensionados p ON c.id_pensionado = p.id_pensionado
        LEFT JOIN usuarios u ON c.mesero_asignado = u.id_usuario
        WHERE c.id_restaurante = $1 
          AND c.id_mesa = $2 
          AND c.fecha_consumo = $3
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, [id_restaurante, id_mesa, fecha]);
      
      logger.info(`✅ [ConsumoPensionadoModel] Obtenidos ${result.rows.length} consumos para mesa ${id_mesa} en ${fecha}`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [ConsumoPensionadoModel] Error al obtener consumos por mesa:`, error);
      throw error;
    }
  }
}

module.exports = ConsumoPensionadoModel;
