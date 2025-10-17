const { pool } = require('../config/database');
const logger = require('../config/logger');

class PrefacturaPensionadoModel {
  /**
   * Generar prefactura consolidada para un pensionado
   */
  static async generar(id_pensionado, id_restaurante, fecha_inicio_periodo, fecha_fin_periodo, observaciones = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar que el pensionado existe
      const pensionadoQuery = `
        SELECT * FROM pensionados 
        WHERE id_pensionado = $1 AND id_restaurante = $2
      `;
      const pensionadoResult = await client.query(pensionadoQuery, [id_pensionado, id_restaurante]);

      if (pensionadoResult.rows.length === 0) {
        throw new Error('Pensionado no encontrado');
      }

      const pensionado = pensionadoResult.rows[0];

      // Obtener todos los consumos del período
      const consumosQuery = `
        SELECT 
          c.*,
          jsonb_array_elements(c.productos_consumidos) as producto_detalle
        FROM consumo_pensionados c
        WHERE c.id_pensionado = $1 
          AND c.id_restaurante = $2
          AND c.fecha_consumo >= $3
          AND c.fecha_consumo <= $4
        ORDER BY c.fecha_consumo, c.created_at
      `;

      const consumosResult = await client.query(consumosQuery, [id_pensionado, id_restaurante, fecha_inicio_periodo, fecha_fin_periodo]);
      
      if (consumosResult.rows.length === 0) {
        throw new Error('No hay consumos en el período especificado');
      }

      // Procesar y agrupar productos
      const productosAgrupados = {};
      let totalConsumo = 0;
      let totalDias = 0;
      const fechasConsumo = new Set();

      for (const row of consumosResult.rows) {
        const consumo = row;
        const producto = row.producto_detalle;
        
        if (producto && producto.nombre) {
          const key = `${producto.id_producto}_${producto.nombre}`;
          
          if (!productosAgrupados[key]) {
            productosAgrupados[key] = {
              id_producto: producto.id_producto,
              nombre: producto.nombre,
              cantidad_total: 0,
              subtotal_total: 0,
              veces_consumido: 0,
              fechas_consumo: []
            };
          }

          productosAgrupados[key].cantidad_total += parseInt(producto.cantidad) || 1;
          productosAgrupados[key].subtotal_total += parseFloat(producto.subtotal) || 0;
          productosAgrupados[key].veces_consumido += 1;
          productosAgrupados[key].fechas_consumo.push(consumo.fecha_consumo);
          
          totalConsumo += parseFloat(producto.subtotal) || 0;
        }

        fechasConsumo.add(consumo.fecha_consumo);
      }

      totalDias = fechasConsumo.size;

      // Calcular descuentos
      const descuentoPorcentaje = pensionado.descuento_aplicado || 0;
      const descuentosAplicados = (totalConsumo * descuentoPorcentaje) / 100;
      const totalFinal = totalConsumo - descuentosAplicados;

      // Convertir productos agrupados a array
      const productosDetallados = Object.values(productosAgrupados).map(producto => ({
        ...producto,
        fechas_consumo: [...new Set(producto.fechas_consumo)].sort()
      }));

      // Insertar la prefactura
      const insertQuery = `
        INSERT INTO prefacturas_pensionados (
          id_pensionado, id_restaurante, fecha_inicio_periodo, fecha_fin_periodo,
          total_dias, total_consumo, descuentos_aplicados, total_final,
          productos_detallados, observaciones, estado, fecha_generacion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'generada', NOW())
        RETURNING *
      `;

      const values = [
        id_pensionado, id_restaurante, fecha_inicio_periodo, fecha_fin_periodo,
        totalDias, totalConsumo, descuentosAplicados, totalFinal,
        JSON.stringify(productosDetallados), observaciones
      ];

      const result = await client.query(insertQuery, values);
      await client.query('COMMIT');

      logger.info(`✅ [PrefacturaPensionadoModel] Prefactura generada: ${result.rows[0].id_prefactura_pensionado}`);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ [PrefacturaPensionadoModel] Error al generar prefactura:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener prefacturas de un pensionado
   */
  static async obtenerPorPensionado(id_pensionado, id_restaurante, filtros = {}) {
    try {
      let query = `
        SELECT 
          pp.*,
          p.nombre_cliente,
          p.tipo_cliente
        FROM prefacturas_pensionados pp
        LEFT JOIN pensionados p ON pp.id_pensionado = p.id_pensionado
        WHERE pp.id_pensionado = $1 AND pp.id_restaurante = $2
      `;

      const values = [id_pensionado, id_restaurante];
      let paramIndex = 3;

      // Aplicar filtros
      if (filtros.estado) {
        query += ` AND pp.estado = $${paramIndex}`;
        values.push(filtros.estado);
        paramIndex++;
      }

      if (filtros.fecha_desde) {
        query += ` AND pp.fecha_inicio_periodo >= $${paramIndex}`;
        values.push(filtros.fecha_desde);
        paramIndex++;
      }

      if (filtros.fecha_hasta) {
        query += ` AND pp.fecha_fin_periodo <= $${paramIndex}`;
        values.push(filtros.fecha_hasta);
        paramIndex++;
      }

      query += ` ORDER BY pp.fecha_inicio_periodo DESC`;

      const result = await pool.query(query, values);
      
      logger.info(`✅ [PrefacturaPensionadoModel] Obtenidas ${result.rows.length} prefacturas para pensionado ${id_pensionado}`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [PrefacturaPensionadoModel] Error al obtener prefacturas:`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las prefacturas de un restaurante
   */
  static async obtenerTodas(id_restaurante, filtros = {}) {
    try {
      let query = `
        SELECT 
          pp.*,
          p.nombre_cliente,
          p.tipo_cliente,
          p.telefono,
          p.email
        FROM prefacturas_pensionados pp
        LEFT JOIN pensionados p ON pp.id_pensionado = p.id_pensionado
        WHERE pp.id_restaurante = $1
      `;

      const values = [id_restaurante];
      let paramIndex = 2;

      // Aplicar filtros
      if (filtros.estado) {
        query += ` AND pp.estado = $${paramIndex}`;
        values.push(filtros.estado);
        paramIndex++;
      }

      if (filtros.tipo_cliente) {
        query += ` AND p.tipo_cliente = $${paramIndex}`;
        values.push(filtros.tipo_cliente);
        paramIndex++;
      }

      if (filtros.fecha_desde) {
        query += ` AND pp.fecha_inicio_periodo >= $${paramIndex}`;
        values.push(filtros.fecha_desde);
        paramIndex++;
      }

      if (filtros.fecha_hasta) {
        query += ` AND pp.fecha_fin_periodo <= $${paramIndex}`;
        values.push(filtros.fecha_hasta);
        paramIndex++;
      }

      query += ` ORDER BY pp.fecha_inicio_periodo DESC`;

      const result = await pool.query(query, values);
      
      logger.info(`✅ [PrefacturaPensionadoModel] Obtenidas ${result.rows.length} prefacturas para restaurante ${id_restaurante}`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [PrefacturaPensionadoModel] Error al obtener todas las prefacturas:`, error);
      throw error;
    }
  }

  /**
   * Obtener una prefactura por ID
   */
  static async obtenerPorId(id_prefactura_pensionado, id_restaurante) {
    try {
      const query = `
        SELECT 
          pp.*,
          p.nombre_cliente,
          p.tipo_cliente,
          p.telefono,
          p.email,
          p.documento_identidad,
          p.direccion,
          s.nombre as sucursal_nombre
        FROM prefacturas_pensionados pp
        LEFT JOIN pensionados p ON pp.id_pensionado = p.id_pensionado
        LEFT JOIN sucursales s ON p.id_sucursal = s.id_sucursal
        WHERE pp.id_prefactura_pensionado = $1 AND pp.id_restaurante = $2
      `;

      const result = await pool.query(query, [id_prefactura_pensionado, id_restaurante]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info(`✅ [PrefacturaPensionadoModel] Prefactura encontrada: ${id_prefactura_pensionado}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`❌ [PrefacturaPensionadoModel] Error al obtener prefactura:`, error);
      throw error;
    }
  }

  /**
   * Actualizar estado de una prefactura
   */
  static async actualizarEstado(id_prefactura_pensionado, id_restaurante, nuevo_estado, observaciones = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let query = `UPDATE prefacturas_pensionados SET estado = $3, updated_at = NOW()`;
      const values = [id_prefactura_pensionado, id_restaurante, nuevo_estado];

      // Actualizar fechas según el estado
      if (nuevo_estado === 'enviada') {
        query += `, fecha_envio = NOW()`;
      } else if (nuevo_estado === 'pagada') {
        query += `, fecha_pago = NOW()`;
      }

      if (observaciones) {
        query += `, observaciones = $4`;
        values.push(observaciones);
      }

      query += ` WHERE id_prefactura_pensionado = $1 AND id_restaurante = $2 RETURNING *`;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Prefactura no encontrada');
      }

      logger.info(`✅ [PrefacturaPensionadoModel] Estado actualizado a '${nuevo_estado}' para prefactura ${id_prefactura_pensionado}`);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ [PrefacturaPensionadoModel] Error al actualizar estado:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener estadísticas de prefacturas
   */
  static async obtenerEstadisticas(id_restaurante, fecha_desde, fecha_hasta) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_prefacturas,
          COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as prefacturas_pendientes,
          COUNT(CASE WHEN estado = 'generada' THEN 1 END) as prefacturas_generadas,
          COUNT(CASE WHEN estado = 'enviada' THEN 1 END) as prefacturas_enviadas,
          COUNT(CASE WHEN estado = 'pagada' THEN 1 END) as prefacturas_pagadas,
          COALESCE(SUM(CASE WHEN estado = 'pagada' THEN total_final ELSE 0 END), 0) as total_cobrado,
          COALESCE(SUM(CASE WHEN estado IN ('generada', 'enviada') THEN total_final ELSE 0 END), 0) as total_pendiente_cobro,
          COALESCE(SUM(total_consumo), 0) as total_consumo_bruto,
          COALESCE(SUM(descuentos_aplicados), 0) as total_descuentos_aplicados,
          COALESCE(AVG(total_final), 0) as promedio_por_prefactura,
          COUNT(DISTINCT id_pensionado) as pensionados_con_prefacturas
        FROM prefacturas_pensionados
        WHERE id_restaurante = $1
          AND fecha_inicio_periodo >= $2
          AND fecha_fin_periodo <= $3
      `;

      const result = await pool.query(query, [id_restaurante, fecha_desde, fecha_hasta]);
      
      logger.info(`✅ [PrefacturaPensionadoModel] Estadísticas obtenidas para restaurante ${id_restaurante}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`❌ [PrefacturaPensionadoModel] Error al obtener estadísticas:`, error);
      throw error;
    }
  }

  /**
   * Generar prefacturas automáticas para pensionados con contratos vencidos
   */
  static async generarAutomaticas(id_restaurante) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Buscar pensionados que necesitan prefactura automática
      const pensionadosQuery = `
        SELECT DISTINCT p.id_pensionado, p.nombre_cliente
        FROM pensionados p
        WHERE p.id_restaurante = $1
          AND p.estado = 'activo'
          AND p.fecha_fin <= CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM prefacturas_pensionados pp
            WHERE pp.id_pensionado = p.id_pensionado
              AND pp.fecha_inicio_periodo = p.fecha_inicio
              AND pp.fecha_fin_periodo = p.fecha_fin
          )
      `;

      const pensionadosResult = await client.query(pensionadosQuery, [id_restaurante]);
      const prefacturasGeneradas = [];

      for (const pensionado of pensionadosResult.rows) {
        try {
          // Obtener fechas del contrato
          const contratoQuery = `
            SELECT fecha_inicio, fecha_fin FROM pensionados 
            WHERE id_pensionado = $1 AND id_restaurante = $2
          `;
          const contratoResult = await client.query(contratoQuery, [pensionado.id_pensionado, id_restaurante]);
          const contrato = contratoResult.rows[0];

          // Generar prefactura automática
          const prefactura = await this.generar(
            pensionado.id_pensionado,
            id_restaurante,
            contrato.fecha_inicio,
            contrato.fecha_fin,
            'Prefactura generada automáticamente al finalizar contrato'
          );

          prefacturasGeneradas.push(prefactura);
          
        } catch (error) {
          logger.error(`❌ [PrefacturaPensionadoModel] Error al generar prefactura automática para pensionado ${pensionado.id_pensionado}:`, error);
        }
      }

      await client.query('COMMIT');

      logger.info(`✅ [PrefacturaPensionadoModel] Generadas ${prefacturasGeneradas.length} prefacturas automáticas`);
      return prefacturasGeneradas;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ [PrefacturaPensionadoModel] Error al generar prefacturas automáticas:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener prefacturas pendientes de pago
   */
  static async obtenerPendientesPago(id_restaurante) {
    try {
      const query = `
        SELECT 
          pp.*,
          p.nombre_cliente,
          p.tipo_cliente,
          p.telefono,
          p.email,
          (CURRENT_DATE - pp.fecha_generacion::date) as dias_pendiente
        FROM prefacturas_pensionados pp
        LEFT JOIN pensionados p ON pp.id_pensionado = p.id_pensionado
        WHERE pp.id_restaurante = $1
          AND pp.estado IN ('generada', 'enviada')
        ORDER BY pp.fecha_generacion ASC
      `;

      const result = await pool.query(query, [id_restaurante]);
      
      logger.info(`✅ [PrefacturaPensionadoModel] Obtenidas ${result.rows.length} prefacturas pendientes de pago`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [PrefacturaPensionadoModel] Error al obtener prefacturas pendientes:`, error);
      throw error;
    }
  }
}

module.exports = PrefacturaPensionadoModel;
