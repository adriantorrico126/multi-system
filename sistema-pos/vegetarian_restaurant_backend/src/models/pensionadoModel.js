const { pool } = require('../config/database');
const logger = require('../config/logger');

class PensionadoModel {
  /**
   * Crear un nuevo pensionado
   */
  static async crear(pensionadoData, id_restaurante, created_by) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        id_sucursal,
        nombre_cliente,
        tipo_cliente = 'individual',
        documento_identidad,
        telefono,
        email,
        direccion,
        fecha_inicio,
        fecha_fin,
        tipo_periodo = 'semanas',
        cantidad_periodos = 1,
        incluye_almuerzo = true,
        incluye_cena = false,
        incluye_desayuno = false,
        max_platos_dia = 1,
        descuento_aplicado = 0.00
      } = pensionadoData;

      const query = `
        INSERT INTO pensionados (
          id_restaurante, id_sucursal, nombre_cliente, tipo_cliente,
          documento_identidad, telefono, email, direccion,
          fecha_inicio, fecha_fin, tipo_periodo, cantidad_periodos,
          incluye_almuerzo, incluye_cena, incluye_desayuno, max_platos_dia,
          descuento_aplicado, estado, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'activo', $18)
        RETURNING *
      `;

      const values = [
        id_restaurante, id_sucursal, nombre_cliente, tipo_cliente,
        documento_identidad, telefono, email, direccion,
        fecha_inicio, fecha_fin, tipo_periodo, cantidad_periodos,
        incluye_almuerzo, incluye_cena, incluye_desayuno, max_platos_dia,
        descuento_aplicado, created_by
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      logger.info(`✅ [PensionadoModel] Pensionado creado: ${result.rows[0].id_pensionado}`);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ [PensionadoModel] Error al crear pensionado:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener todos los pensionados de un restaurante
   */
  static async obtenerTodos(id_restaurante, filtros = {}) {
    try {
      let query = `
        SELECT 
          p.*,
          s.nombre as sucursal_nombre,
          u.nombre as creado_por_nombre
        FROM pensionados p
        LEFT JOIN sucursales s ON p.id_sucursal = s.id_sucursal
        LEFT JOIN usuarios u ON p.created_by = u.id_usuario
        WHERE p.id_restaurante = $1
      `;

      const values = [id_restaurante];
      let paramIndex = 2;

      // Aplicar filtros
      if (filtros.estado) {
        query += ` AND p.estado = $${paramIndex}`;
        values.push(filtros.estado);
        paramIndex++;
      }

      if (filtros.tipo_cliente) {
        query += ` AND p.tipo_cliente = $${paramIndex}`;
        values.push(filtros.tipo_cliente);
        paramIndex++;
      }

      if (filtros.fecha_desde) {
        query += ` AND p.fecha_inicio >= $${paramIndex}`;
        values.push(filtros.fecha_desde);
        paramIndex++;
      }

      if (filtros.fecha_hasta) {
        query += ` AND p.fecha_fin <= $${paramIndex}`;
        values.push(filtros.fecha_hasta);
        paramIndex++;
      }

      query += ` ORDER BY p.created_at DESC`;

      const result = await pool.query(query, values);
      
      logger.info(`✅ [PensionadoModel] Obtenidos ${result.rows.length} pensionados`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [PensionadoModel] Error al obtener pensionados:`, error);
      throw error;
    }
  }

  /**
   * Obtener un pensionado por ID
   */
  static async obtenerPorId(id_pensionado, id_restaurante) {
    try {
      const query = `
        SELECT 
          p.*,
          s.nombre as sucursal_nombre,
          u.nombre as creado_por_nombre
        FROM pensionados p
        LEFT JOIN sucursales s ON p.id_sucursal = s.id_sucursal
        LEFT JOIN usuarios u ON p.created_by = u.id_usuario
        WHERE p.id_pensionado = $1 AND p.id_restaurante = $2
      `;

      const result = await pool.query(query, [id_pensionado, id_restaurante]);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info(`✅ [PensionadoModel] Pensionado encontrado: ${id_pensionado}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`❌ [PensionadoModel] Error al obtener pensionado:`, error);
      throw error;
    }
  }

  /**
   * Actualizar un pensionado
   */
  static async actualizar(id_pensionado, id_restaurante, datosActualizacion) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const camposPermitidos = [
        'nombre_cliente', 'tipo_cliente', 'documento_identidad', 'telefono', 'email', 'direccion',
        'fecha_inicio', 'fecha_fin', 'tipo_periodo', 'cantidad_periodos',
        'incluye_almuerzo', 'incluye_cena', 'incluye_desayuno', 'max_platos_dia',
        'descuento_aplicado', 'estado'
      ];

      const camposActualizar = [];
      const values = [];
      let paramIndex = 1;

      for (const [campo, valor] of Object.entries(datosActualizacion)) {
        if (camposPermitidos.includes(campo)) {
          camposActualizar.push(`${campo} = $${paramIndex}`);
          values.push(valor);
          paramIndex++;
        }
      }

      if (camposActualizar.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      values.push(id_pensionado, id_restaurante);

      const query = `
        UPDATE pensionados 
        SET ${camposActualizar.join(', ')}, updated_at = NOW()
        WHERE id_pensionado = $${paramIndex} AND id_restaurante = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('Pensionado no encontrado');
      }

      logger.info(`✅ [PensionadoModel] Pensionado actualizado: ${id_pensionado}`);
      return result.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ [PensionadoModel] Error al actualizar pensionado:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar un pensionado (soft delete)
   */
  static async eliminar(id_pensionado, id_restaurante) {
    try {
      const query = `
        UPDATE pensionados 
        SET estado = 'cancelado', updated_at = NOW()
        WHERE id_pensionado = $1 AND id_restaurante = $2
        RETURNING *
      `;

      const result = await pool.query(query, [id_pensionado, id_restaurante]);

      if (result.rows.length === 0) {
        throw new Error('Pensionado no encontrado');
      }

      logger.info(`✅ [PensionadoModel] Pensionado cancelado: ${id_pensionado}`);
      return result.rows[0];

    } catch (error) {
      logger.error(`❌ [PensionadoModel] Error al eliminar pensionado:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de un pensionado
   */
  static async obtenerEstadisticas(id_pensionado, id_restaurante) {
    try {
      // Obtener información básica del pensionado
      const pensionado = await this.obtenerPorId(id_pensionado, id_restaurante);
      if (!pensionado) {
        throw new Error('Pensionado no encontrado');
      }

      // Obtener estadísticas de consumo
      const estadisticasQuery = `
        SELECT 
          COUNT(DISTINCT fecha_consumo) as total_dias_consumo,
          COUNT(*) as total_consumos,
          COALESCE(SUM(total_consumido), 0) as total_gastado,
          COALESCE(AVG(total_consumido), 0) as promedio_por_dia,
          MIN(fecha_consumo) as primera_fecha_consumo,
          MAX(fecha_consumo) as ultima_fecha_consumo,
          COUNT(CASE WHEN tipo_comida = 'desayuno' THEN 1 END) as consumos_desayuno,
          COUNT(CASE WHEN tipo_comida = 'almuerzo' THEN 1 END) as consumos_almuerzo,
          COUNT(CASE WHEN tipo_comida = 'cena' THEN 1 END) as consumos_cena
        FROM consumo_pensionados
        WHERE id_pensionado = $1 AND id_restaurante = $2
      `;

      const estadisticasResult = await pool.query(estadisticasQuery, [id_pensionado, id_restaurante]);
      const estadisticas = estadisticasResult.rows[0];

      // Obtener productos más consumidos
      const productosQuery = `
        SELECT 
          jsonb_array_elements(productos_consumidos) as producto,
          COUNT(*) as veces_consumido
        FROM consumo_pensionados
        WHERE id_pensionado = $1 AND id_restaurante = $2
        GROUP BY jsonb_array_elements(productos_consumidos)
        ORDER BY veces_consumido DESC
        LIMIT 10
      `;

      const productosResult = await pool.query(productosQuery, [id_pensionado, id_restaurante]);
      const productos_populares = productosResult.rows;

      // Calcular días restantes del contrato
      const fecha_actual = new Date();
      const fecha_fin = new Date(pensionado.fecha_fin);
      const dias_restantes = Math.max(0, Math.ceil((fecha_fin - fecha_actual) / (1000 * 60 * 60 * 24)));

      const resultado = {
        ...pensionado,
        estadisticas: {
          ...estadisticas,
          dias_restantes_contrato: dias_restantes,
          porcentaje_consumido: pensionado.cantidad_periodos > 0 ? 
            (estadisticas.total_dias_consumo / (pensionado.cantidad_periodos * 30)) * 100 : 0
        },
        productos_populares
      };

      logger.info(`✅ [PensionadoModel] Estadísticas obtenidas para pensionado: ${id_pensionado}`);
      return resultado;

    } catch (error) {
      logger.error(`❌ [PensionadoModel] Error al obtener estadísticas:`, error);
      throw error;
    }
  }

  /**
   * Verificar si un pensionado puede consumir en una fecha específica
   */
  static async puedeConsumir(id_pensionado, id_restaurante, fecha_consumo, tipo_comida) {
    try {
      const query = `
        SELECT 
          p.*,
          COUNT(c.id_consumo) as consumos_hoy
        FROM pensionados p
        LEFT JOIN consumo_pensionados c ON p.id_pensionado = c.id_pensionado 
          AND c.fecha_consumo = $3 
          AND c.tipo_comida = $4
        WHERE p.id_pensionado = $1 AND p.id_restaurante = $2
          AND p.estado = 'activo'
          AND p.fecha_inicio <= $3
          AND p.fecha_fin >= $3
        GROUP BY p.id_pensionado
      `;

      const result = await pool.query(query, [id_pensionado, id_restaurante, fecha_consumo, tipo_comida]);

      if (result.rows.length === 0) {
        return {
          puede_consumir: false,
          motivo: 'Pensionado no encontrado o inactivo',
          consumos_hoy: 0,
          limite_dia: 0,
          consumos_restantes: 0
        };
      }

      const pensionado = result.rows[0];
      const consumosHoy = parseInt(pensionado.consumos_hoy) || 0;
      const limiteDia = parseInt(pensionado.max_platos_dia) || 1;

      // Verificar límites de consumo
      if (consumosHoy >= limiteDia) {
        return {
          puede_consumir: false,
          motivo: `Ya alcanzó el límite de ${limiteDia} platos para hoy`,
          consumos_hoy: consumosHoy,
          limite_dia: limiteDia,
          consumos_restantes: 0
        };
      }

      // Verificar tipo de comida incluida
      const incluyeTipoComida = 
        (tipo_comida === 'desayuno' && pensionado.incluye_desayuno) ||
        (tipo_comida === 'almuerzo' && pensionado.incluye_almuerzo) ||
        (tipo_comida === 'cena' && pensionado.incluye_cena);

      if (!incluyeTipoComida) {
        return {
          puede_consumir: false,
          motivo: `El tipo de comida '${tipo_comida}' no está incluido en el contrato`,
          consumos_hoy: consumosHoy,
          limite_dia: limiteDia,
          consumos_restantes: limiteDia - consumosHoy
        };
      }

      return {
        puede_consumir: true,
        motivo: null,
        consumos_hoy: consumosHoy,
        limite_dia: limiteDia,
        consumos_restantes: limiteDia - consumosHoy
      };

    } catch (error) {
      logger.error(`❌ [PensionadoModel] Error al verificar consumo:`, error);
      throw error;
    }
  }

  /**
   * Obtener pensionados activos para una fecha específica
   */
  static async obtenerActivosPorFecha(id_restaurante, fecha) {
    try {
      const query = `
        SELECT 
          p.*,
          s.nombre as sucursal_nombre,
          COUNT(c.id_consumo) as consumos_hoy
        FROM pensionados p
        LEFT JOIN sucursales s ON p.id_sucursal = s.id_sucursal
        LEFT JOIN consumo_pensionados c ON p.id_pensionado = c.id_pensionado 
          AND c.fecha_consumo = $2
        WHERE p.id_restaurante = $1
          AND p.estado = 'activo'
          AND p.fecha_inicio <= $2
          AND p.fecha_fin >= $2
        GROUP BY p.id_pensionado, s.nombre
        ORDER BY p.nombre_cliente
      `;

      const result = await pool.query(query, [id_restaurante, fecha]);
      
      logger.info(`✅ [PensionadoModel] Obtenidos ${result.rows.length} pensionados activos para ${fecha}`);
      return result.rows;

    } catch (error) {
      logger.error(`❌ [PensionadoModel] Error al obtener pensionados activos:`, error);
      throw error;
    }
  }
}

module.exports = PensionadoModel;
