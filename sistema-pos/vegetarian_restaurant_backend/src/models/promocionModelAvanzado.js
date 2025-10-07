const { pool } = require('../config/database');
const logger = require('../config/logger');

const PromocionModelAvanzado = {
  // Crear una nueva promoción avanzada
  async crearPromocionAvanzada(promocionData) {
    const {
      nombre,
      descripcion,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      hora_inicio = '00:00:00',
      hora_fin = '23:59:59',
      aplicar_horarios = false,
      id_producto,
      id_restaurante,
      limite_usos = 0,
      limite_usos_por_cliente = 0,
      monto_minimo = 0,
      monto_maximo = 0,
      productos_minimos = 0,
      productos_maximos = 0,
      sucursales = [],
      aplicar_todas_sucursales = true,
      activa = true,
      destacada = false,
      requiere_codigo = false,
      codigo_promocion,
      objetivo_ventas = 0,
      objetivo_ingresos = 0,
      categoria_objetivo,
      segmento_cliente = 'todos'
    } = promocionData;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generar código automático si no se proporciona
      const codigoFinal = requiere_codigo && !codigo_promocion
        ? `PROMO${Date.now().toString().slice(-6)}`
        : codigo_promocion;
      
      // 1. Crear la promoción avanzada
      const promocionQuery = `
        INSERT INTO promociones (
          nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin,
          hora_inicio, hora_fin, aplicar_horarios, id_producto, id_restaurante,
          limite_usos, limite_usos_por_cliente, monto_minimo, monto_maximo,
          productos_minimos, productos_maximos, activa, destacada,
          requiere_codigo, codigo_promocion, objetivo_ventas, objetivo_ingresos,
          categoria_objetivo, segmento_cliente
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        RETURNING *
      `;
      
      const promocionValues = [
        nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin,
        hora_inicio, hora_fin, aplicar_horarios, id_producto, id_restaurante,
        limite_usos, limite_usos_por_cliente, monto_minimo, monto_maximo,
        productos_minimos, productos_maximos, activa, destacada,
        requiere_codigo, codigoFinal, objetivo_ventas, objetivo_ingresos,
        categoria_objetivo, segmento_cliente
      ];
      
      const { rows: promocion } = await client.query(promocionQuery, promocionValues);
      
      // 2. Asignar la promoción a las sucursales
      if (!aplicar_todas_sucursales && sucursales.length > 0) {
        const asignacionQuery = `
          INSERT INTO promociones_sucursales (id_promocion, id_sucursal, id_restaurante)
          VALUES ($1, $2, $3)
        `;
        
        for (const id_sucursal of sucursales) {
          await client.query(asignacionQuery, [promocion[0].id_promocion, id_sucursal, id_restaurante]);
        }
      } else if (aplicar_todas_sucursales) {
        // Obtener todas las sucursales del restaurante
        const sucursalesQuery = `
          SELECT id_sucursal FROM sucursales WHERE id_restaurante = $1
        `;
        const { rows: todasSucursales } = await client.query(sucursalesQuery, [id_restaurante]);
        
        const asignacionQuery = `
          INSERT INTO promociones_sucursales (id_promocion, id_sucursal, id_restaurante)
          VALUES ($1, $2, $3)
        `;
        
        for (const sucursal of todasSucursales) {
          await client.query(asignacionQuery, [promocion[0].id_promocion, sucursal.id_sucursal, id_restaurante]);
        }
      }
      
      await client.query('COMMIT');
      logger.info('Promoción avanzada creada exitosamente', { 
        id_promocion: promocion[0].id_promocion, 
        nombre,
        id_restaurante 
      });
      
      return promocion[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al crear promoción avanzada:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener promociones activas avanzadas
  async getPromocionesActivasAvanzadas(id_restaurante, id_sucursal = null) {
    try {
      const query = `
        SELECT * FROM fn_get_promociones_activas_avanzadas($1, $2)
      `;
      
      const { rows } = await pool.query(query, [id_restaurante, id_sucursal]);
      
      logger.info('Promociones activas avanzadas obtenidas', { 
        total: rows.length, 
        id_restaurante, 
        id_sucursal 
      });
      
      return rows;
    } catch (error) {
      logger.error('Error al obtener promociones activas avanzadas:', error);
      throw error;
    }
  },

  // Verificar si una promoción es válida
  async verificarPromocionValida(id_promocion, id_sucursal = null) {
    try {
      const query = `
        SELECT fn_promocion_valida($1, $2) as es_valida
      `;
      
      const { rows } = await pool.query(query, [id_promocion, id_sucursal]);
      
      return rows[0].es_valida;
    } catch (error) {
      logger.error('Error al verificar promoción válida:', error);
      throw error;
    }
  },

  // Registrar uso de promoción
  async registrarUsoPromocion(usoData) {
    const {
      id_promocion,
      id_venta,
      id_cliente,
      id_sucursal,
      id_restaurante,
      monto_descuento = 0,
      monto_venta = 0
    } = usoData;

    try {
      const query = `
        SELECT fn_registrar_uso_promocion($1, $2, $3, $4, $5, $6, $7) as id_uso
      `;
      
      const { rows } = await pool.query(query, [
        id_promocion, id_venta, id_cliente, id_sucursal, 
        id_restaurante, monto_descuento, monto_venta
      ]);
      
      logger.info('Uso de promoción registrado', { 
        id_uso: rows[0].id_uso,
        id_promocion,
        id_venta,
        monto_descuento
      });
      
      return rows[0].id_uso;
    } catch (error) {
      logger.error('Error al registrar uso de promoción:', error);
      throw error;
    }
  },

  // Obtener analytics de promociones
  async getAnalyticsPromociones(id_restaurante, fecha_inicio = null, fecha_fin = null) {
    try {
      let query = `
        SELECT * FROM v_promociones_analytics
        WHERE id_restaurante = $1
      `;
      
      const values = [id_restaurante];
      
      if (fecha_inicio && fecha_fin) {
        query += ` AND fecha_inicio >= $2 AND fecha_fin <= $3`;
        values.push(fecha_inicio, fecha_fin);
      }
      
      query += ` ORDER BY total_usos DESC, total_ingresos DESC`;
      
      const { rows } = await pool.query(query, values);
      
      logger.info('Analytics de promociones obtenidos', { 
        total: rows.length, 
        id_restaurante 
      });
      
      return rows;
    } catch (error) {
      logger.error('Error al obtener analytics de promociones:', error);
      throw error;
    }
  },

  // Obtener estadísticas de uso por promoción
  async getEstadisticasUso(id_promocion) {
    try {
      const query = `
        SELECT 
          p.nombre,
          p.tipo,
          p.valor,
          COUNT(u.id_uso) as total_usos,
          COUNT(DISTINCT u.id_cliente) as clientes_unicos,
          SUM(u.monto_venta) as total_ingresos,
          SUM(u.monto_descuento) as total_descuentos,
          AVG(u.monto_venta) as promedio_venta,
          MIN(u.usado_en) as primer_uso,
          MAX(u.usado_en) as ultimo_uso
        FROM promociones p
        LEFT JOIN promociones_uso u ON p.id_promocion = u.id_promocion
        WHERE p.id_promocion = $1
        GROUP BY p.id_promocion, p.nombre, p.tipo, p.valor
      `;
      
      const { rows } = await pool.query(query, [id_promocion]);
      
      return rows[0] || null;
    } catch (error) {
      logger.error('Error al obtener estadísticas de uso:', error);
      throw error;
    }
  },

  // Actualizar promoción avanzada
  async actualizarPromocionAvanzada(id_promocion, promocionData) {
    const {
      nombre,
      descripcion,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      aplicar_horarios,
      id_producto,
      limite_usos,
      limite_usos_por_cliente,
      monto_minimo,
      monto_maximo,
      productos_minimos,
      productos_maximos,
      activa,
      destacada,
      requiere_codigo,
      codigo_promocion,
      objetivo_ventas,
      objetivo_ingresos,
      categoria_objetivo,
      segmento_cliente
    } = promocionData;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const updateQuery = `
        UPDATE promociones SET
          nombre = $1,
          descripcion = $2,
          tipo = $3,
          valor = $4,
          fecha_inicio = $5,
          fecha_fin = $6,
          hora_inicio = $7,
          hora_fin = $8,
          aplicar_horarios = $9,
          id_producto = $10,
          limite_usos = $11,
          limite_usos_por_cliente = $12,
          monto_minimo = $13,
          monto_maximo = $14,
          productos_minimos = $15,
          productos_maximos = $16,
          activa = $17,
          destacada = $18,
          requiere_codigo = $19,
          codigo_promocion = $20,
          objetivo_ventas = $21,
          objetivo_ingresos = $22,
          categoria_objetivo = $23,
          segmento_cliente = $24,
          actualizada_en = now()
        WHERE id_promocion = $25
        RETURNING *
      `;
      
      const values = [
        nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin,
        hora_inicio, hora_fin, aplicar_horarios, id_producto,
        limite_usos, limite_usos_por_cliente, monto_minimo, monto_maximo,
        productos_minimos, productos_maximos, activa, destacada,
        requiere_codigo, codigo_promocion, objetivo_ventas, objetivo_ingresos,
        categoria_objetivo, segmento_cliente, id_promocion
      ];
      
      const { rows } = await client.query(updateQuery, values);
      
      await client.query('COMMIT');
      
      logger.info('Promoción avanzada actualizada', { 
        id_promocion, 
        nombre 
      });
      
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al actualizar promoción avanzada:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Obtener promociones por código
  async getPromocionPorCodigo(codigo, id_restaurante, id_sucursal = null) {
    try {
      const query = `
        SELECT * FROM fn_get_promociones_activas_avanzadas($1, $2)
        WHERE codigo_promocion = $3
      `;
      
      const { rows } = await pool.query(query, [id_restaurante, id_sucursal, codigo]);
      
      return rows[0] || null;
    } catch (error) {
      logger.error('Error al obtener promoción por código:', error);
      throw error;
    }
  },

  // Obtener promociones destacadas
  async getPromocionesDestacadas(id_restaurante, id_sucursal = null) {
    try {
      const query = `
        SELECT * FROM fn_get_promociones_activas_avanzadas($1, $2)
        WHERE destacada = true
        ORDER BY valor DESC
      `;
      
      const { rows } = await pool.query(query, [id_restaurante, id_sucursal]);
      
      return rows;
    } catch (error) {
      logger.error('Error al obtener promociones destacadas:', error);
      throw error;
    }
  },

  // Obtener promociones por segmento de cliente
  async getPromocionesPorSegmento(segmento, id_restaurante, id_sucursal = null) {
    try {
      const query = `
        SELECT * FROM fn_get_promociones_activas_avanzadas($1, $2)
        WHERE segmento_cliente = $3 OR segmento_cliente = 'todos'
        ORDER BY destacada DESC, valor DESC
      `;
      
      const { rows } = await pool.query(query, [id_restaurante, id_sucursal, segmento]);
      
      return rows;
    } catch (error) {
      logger.error('Error al obtener promociones por segmento:', error);
      throw error;
    }
  },

  // Eliminar promoción avanzada
  async eliminarPromocionAvanzada(id_promocion) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Eliminar uso de promociones
      await client.query('DELETE FROM promociones_uso WHERE id_promocion = $1', [id_promocion]);
      
      // Eliminar asignaciones a sucursales
      await client.query('DELETE FROM promociones_sucursales WHERE id_promocion = $1', [id_promocion]);
      
      // Eliminar la promoción
      const { rows } = await client.query(
        'DELETE FROM promociones WHERE id_promocion = $1 RETURNING *', 
        [id_promocion]
      );
      
      await client.query('COMMIT');
      
      logger.info('Promoción avanzada eliminada', { id_promocion });
      
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al eliminar promoción avanzada:', error);
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = PromocionModelAvanzado;
