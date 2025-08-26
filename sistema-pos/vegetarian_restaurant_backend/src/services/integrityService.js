const { pool } = require('../config/database');
const logger = require('../config/logger');

class IntegrityService {
  constructor() {
    this.integrityChecks = [
      this.checkMesaVentaConsistency.bind(this),
      this.checkProductoDetalleConsistency.bind(this),
      this.checkSucursalRestauranteConsistency.bind(this),
      this.checkEstadoVentaConsistency.bind(this),
      this.checkTotalCalculations.bind(this)
    ];
  }

  /**
   * Ejecuta todas las verificaciones de integridad
   */
  async runAllIntegrityChecks() {
    logger.info('🔍 INICIANDO VERIFICACIONES DE INTEGRIDAD DEL SISTEMA');
    
    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        fixed: 0
      }
    };

    for (const check of this.integrityChecks) {
      try {
        const result = await check();
        results.checks.push(result);
        results.summary.total++;
        
        if (result.status === 'passed') {
          results.summary.passed++;
        } else if (result.status === 'failed') {
          results.summary.failed++;
        } else if (result.status === 'fixed') {
          results.summary.fixed++;
        }
        
        logger.info(`✅ Verificación ${result.name}: ${result.status}`);
      } catch (error) {
        logger.error(`❌ Error en verificación ${check.name}:`, error);
        results.checks.push({
          name: check.name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        results.summary.failed++;
      }
    }

    logger.info(`🏁 VERIFICACIONES COMPLETADAS: ${results.summary.passed} OK, ${results.summary.failed} FALLIDAS, ${results.summary.fixed} CORREGIDAS`);
    
    return results;
  }

  /**
   * Verifica consistencia entre mesas y ventas
   */
  async checkMesaVentaConsistency() {
    const name = 'Consistencia Mesa-Venta';
    logger.info(`🔍 Ejecutando: ${name}`);
    
    try {
      // Buscar inconsistencias
      const inconsistencies = await pool.query(`
        SELECT 
          m.id_mesa,
          m.numero as mesa_numero,
          m.id_sucursal as mesa_sucursal,
          m.id_restaurante as mesa_restaurante,
          v.id_venta,
          v.mesa_numero as venta_mesa_numero,
          v.id_sucursal as venta_sucursal,
          v.id_restaurante as venta_restaurante,
          v.estado as venta_estado
        FROM mesas m
        LEFT JOIN ventas v ON m.id_mesa = v.id_mesa
        WHERE v.id_venta IS NOT NULL
          AND (
            m.numero != v.mesa_numero 
            OR m.id_sucursal != v.id_sucursal 
            OR m.id_restaurante != v.id_restaurante
          )
        ORDER BY m.id_mesa, v.fecha DESC
      `);

      if (inconsistencies.rows.length === 0) {
        return { name, status: 'passed', message: 'No se encontraron inconsistencias' };
      }

      logger.warn(`⚠️ Encontradas ${inconsistencies.rows.length} inconsistencias mesa-venta`);

      // Corregir inconsistencias
      let fixed = 0;
      for (const inc of inconsistencies.rows) {
        await pool.query(`
          UPDATE ventas 
          SET 
            mesa_numero = $1,
            id_sucursal = $2,
            id_restaurante = $3
          WHERE id_venta = $4
        `, [inc.mesa_numero, inc.mesa_sucursal, inc.mesa_restaurante, inc.id_venta]);
        
        fixed++;
        logger.info(`🔧 Corregida venta ${inc.id_venta} para mesa ${inc.mesa_numero}`);
      }

      return {
        name,
        status: fixed > 0 ? 'fixed' : 'failed',
        message: `Encontradas ${inconsistencies.rows.length} inconsistencias, ${fixed} corregidas`,
        details: inconsistencies.rows,
        fixed
      };

    } catch (error) {
      logger.error(`❌ Error en ${name}:`, error);
      throw error;
    }
  }

  /**
   * Verifica consistencia entre productos y detalles de venta
   */
  async checkProductoDetalleConsistency() {
    const name = 'Consistencia Producto-Detalle';
    logger.info(`🔍 Ejecutando: ${name}`);
    
    try {
      // Buscar detalles sin productos válidos
      const invalidDetails = await pool.query(`
        SELECT 
          dv.id_detalle,
          dv.id_venta,
          dv.id_producto,
          dv.cantidad,
          dv.subtotal,
          v.id_mesa,
          v.estado as venta_estado
        FROM detalle_ventas dv
        JOIN ventas v ON dv.id_venta = v.id_venta
        WHERE dv.id_producto IS NULL 
          OR dv.id_producto NOT IN (SELECT id_producto FROM productos WHERE id_restaurante = v.id_restaurante)
        ORDER BY v.fecha DESC
      `);

      if (invalidDetails.rows.length === 0) {
        return { name, status: 'passed', message: 'No se encontraron detalles inválidos' };
      }

      logger.warn(`⚠️ Encontrados ${invalidDetails.rows.length} detalles con productos inválidos`);

      // Corregir detalles inválidos
      let fixed = 0;
      for (const detail of invalidDetails.rows) {
        // Buscar un producto válido del mismo restaurante
        const validProduct = await pool.query(`
          SELECT id_producto, nombre, precio
          FROM productos 
          WHERE id_restaurante = (
            SELECT id_restaurante FROM ventas WHERE id_venta = $1
          )
          ORDER BY nombre
          LIMIT 1
        `, [detail.id_venta]);

        if (validProduct.rows.length > 0) {
          const product = validProduct.rows[0];
          await pool.query(`
            UPDATE detalle_ventas 
            SET 
              id_producto = $1,
              precio_unitario = $2,
              subtotal = cantidad * $2
            WHERE id_detalle = $3
          `, [product.id_producto, product.precio, detail.id_detalle]);
          
          fixed++;
          logger.info(`🔧 Corregido detalle ${detail.id_detalle} con producto ${product.nombre}`);
        }
      }

      return {
        name,
        status: fixed > 0 ? 'fixed' : 'failed',
        message: `Encontrados ${invalidDetails.rows.length} detalles inválidos, ${fixed} corregidos`,
        details: invalidDetails.rows,
        fixed
      };

    } catch (error) {
      logger.error(`❌ Error en ${name}:`, error);
      throw error;
    }
  }

  /**
   * Verifica consistencia entre sucursales y restaurantes
   */
  async checkSucursalRestauranteConsistency() {
    const name = 'Consistencia Sucursal-Restaurante';
    logger.info(`🔍 Ejecutando: ${name}`);
    
    try {
      // Verificar que no haya mesas duplicadas por número en el mismo restaurante
      const duplicateMesas = await pool.query(`
        SELECT 
          numero,
          id_restaurante,
          COUNT(*) as cantidad,
          ARRAY_AGG(id_mesa ORDER BY id_mesa) as ids_mesas,
          ARRAY_AGG(id_sucursal ORDER BY id_sucursal) as sucursales
        FROM mesas
        GROUP BY numero, id_restaurante
        HAVING COUNT(*) > 1
        ORDER BY numero, id_restaurante
      `);

      if (duplicateMesas.rows.length === 0) {
        return { name, status: 'passed', message: 'No se encontraron mesas duplicadas' };
      }

      logger.warn(`⚠️ Encontradas ${duplicateMesas.rows.length} configuraciones de mesas duplicadas`);

      // Crear reporte de duplicados para revisión manual
      const report = duplicateMesas.rows.map(dup => ({
        numero: dup.numero,
        restaurante: dup.id_restaurante,
        cantidad: dup.cantidad,
        mesas: dup.ids_mesas,
        sucursales: dup.sucursales
      }));

      return {
        name,
        status: 'failed',
        message: `Encontradas ${duplicateMesas.rows.length} configuraciones duplicadas (requiere revisión manual)`,
        details: report,
        requiresManualReview: true
      };

    } catch (error) {
      logger.error(`❌ Error en ${name}:`, error);
      throw error;
    }
  }

  /**
   * Verifica consistencia de estados de venta
   */
  async checkEstadoVentaConsistency() {
    const name = 'Consistencia Estados de Venta';
    logger.info(`🔍 Ejecutando: ${name}`);
    
    try {
      // Estados válidos del sistema
      const validStates = [
        'recibido', 'en_preparacion', 'listo_para_servir', 'entregado', 'cancelado',
        'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado'
      ];

      // Buscar ventas con estados inválidos
      const invalidStates = await pool.query(`
        SELECT 
          id_venta,
          estado,
          id_mesa,
          fecha
        FROM ventas
        WHERE estado NOT IN (${validStates.map((_, i) => `$${i + 1}`).join(', ')})
        ORDER BY fecha DESC
      `, validStates);

      if (invalidStates.rows.length === 0) {
        return { name, status: 'passed', message: 'No se encontraron estados inválidos' };
      }

      logger.warn(`⚠️ Encontradas ${invalidStates.rows.length} ventas con estados inválidos`);

      // Corregir estados inválidos
      let fixed = 0;
      for (const venta of invalidStates.rows) {
        // Asignar estado por defecto basado en la fecha
        const defaultState = this.determineDefaultState(venta.fecha);
        
        await pool.query(`
          UPDATE ventas 
          SET estado = $1
          WHERE id_venta = $2
        `, [defaultState, venta.id_venta]);
        
        fixed++;
        logger.info(`🔧 Corregido estado de venta ${venta.id_venta} a ${defaultState}`);
      }

      return {
        name,
        status: fixed > 0 ? 'fixed' : 'failed',
        message: `Encontradas ${invalidStates.rows.length} ventas con estados inválidos, ${fixed} corregidas`,
        details: invalidStates.rows,
        fixed
      };

    } catch (error) {
      logger.error(`❌ Error en ${name}:`, error);
      throw error;
    }
  }

  /**
   * Verifica y corrige cálculos de totales
   */
  async checkTotalCalculations() {
    const name = 'Verificación de Cálculos de Totales';
    logger.info(`🔍 Ejecutando: ${name}`);
    
    try {
      // Buscar ventas con totales incorrectos
      const incorrectTotals = await pool.query(`
        SELECT 
          v.id_venta,
          v.total as total_venta,
          COALESCE(SUM(dv.subtotal), 0) as total_calculado,
          v.id_mesa,
          v.estado
        FROM ventas v
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        GROUP BY v.id_venta, v.total, v.id_mesa, v.estado
        HAVING ABS(v.total - COALESCE(SUM(dv.subtotal), 0)) > 0.01
        ORDER BY ABS(v.total - COALESCE(SUM(dv.subtotal), 0)) DESC
      `);

      if (incorrectTotals.rows.length === 0) {
        return { name, status: 'passed', message: 'No se encontraron totales incorrectos' };
      }

      logger.warn(`⚠️ Encontradas ${incorrectTotals.rows.length} ventas con totales incorrectos`);

      // Corregir totales
      let fixed = 0;
      for (const venta of incorrectTotals.rows) {
        await pool.query(`
          UPDATE ventas 
          SET total = $1
          WHERE id_venta = $2
        `, [venta.total_calculado, venta.id_venta]);
        
        fixed++;
        logger.info(`🔧 Corregido total de venta ${venta.id_venta}: $${venta.total_venta} → $${venta.total_calculado}`);
      }

      // Recalcular totales acumulados de mesas
      await this.recalculateMesaTotals();

      return {
        name,
        status: fixed > 0 ? 'fixed' : 'failed',
        message: `Encontradas ${incorrectTotals.rows.length} ventas con totales incorrectos, ${fixed} corregidas`,
        details: incorrectTotals.rows,
        fixed
      };

    } catch (error) {
      logger.error(`❌ Error en ${name}:`, error);
      throw error;
    }
  }

  /**
   * Recalcula totales acumulados de todas las mesas
   */
  async recalculateMesaTotals() {
    try {
      const mesas = await pool.query(`
        SELECT DISTINCT id_mesa, id_sucursal, id_restaurante
        FROM mesas
      `);

      for (const mesa of mesas.rows) {
        const totalResult = await pool.query(`
          SELECT 
            COALESCE(SUM(v.total), 0) as total_acumulado,
            COUNT(DISTINCT v.id_venta) as total_ventas
          FROM ventas v
          WHERE v.id_mesa = $1 
            AND v.estado IN ('recibido', 'en_preparacion', 'listo_para_servir', 'abierta', 'en_uso', 'pendiente_cobro', 'completada', 'pendiente', 'pagado')
        `, [mesa.id_mesa]);

        const totalAcumulado = parseFloat(totalResult.rows[0].total_acumulado) || 0;
        const totalVentas = parseInt(totalResult.rows[0].total_ventas) || 0;

        await pool.query(`
          UPDATE mesas 
          SET 
            total_acumulado = $1,
            estado = CASE 
              WHEN $1 > 0 THEN 'en_uso'
              ELSE 'libre'
            END
          WHERE id_mesa = $2
        `, [totalAcumulado, mesa.id_mesa]);

        logger.debug(`🔄 Mesa ${mesa.id_mesa} actualizada: Total=$${totalAcumulado}, Ventas=${totalVentas}`);
      }

      logger.info(`✅ Totales de ${mesas.rows.length} mesas recalculados`);
    } catch (error) {
      logger.error('❌ Error recalculando totales de mesas:', error);
      throw error;
    }
  }

  /**
   * Determina el estado por defecto basado en la fecha
   */
  determineDefaultState(fecha) {
    const ventaDate = new Date(fecha);
    const now = new Date();
    const diffHours = (now - ventaDate) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return 'completada'; // Venta antigua
    } else if (diffHours > 2) {
      return 'entregado'; // Venta reciente
    } else {
      return 'recibido'; // Venta muy reciente
    }
  }

  /**
   * Ejecuta verificación de integridad en tiempo real
   */
  async runRealTimeCheck(operation, data) {
    try {
      switch (operation) {
        case 'venta_created':
          await this.validateVentaData(data);
          break;
        case 'mesa_updated':
          await this.validateMesaData(data);
          break;
        case 'producto_updated':
          await this.validateProductoData(data);
          break;
        default:
          logger.debug(`Operación de verificación en tiempo real no implementada: ${operation}`);
      }
    } catch (error) {
      logger.error(`❌ Error en verificación en tiempo real (${operation}):`, error);
    }
  }

  /**
   * Valida datos de venta antes de guardar
   */
  async validateVentaData(ventaData) {
    const { id_mesa, id_sucursal, id_restaurante } = ventaData;
    
    // Verificar que la mesa existe y es consistente
    const mesa = await pool.query(`
      SELECT id_mesa, numero, id_sucursal, id_restaurante
      FROM mesas
      WHERE id_mesa = $1
    `, [id_mesa]);

    if (mesa.rows.length === 0) {
      throw new Error(`Mesa ${id_mesa} no encontrada`);
    }

    const mesaData = mesa.rows[0];
    if (mesaData.id_sucursal !== id_sucursal || mesaData.id_restaurante !== id_restaurante) {
      throw new Error(`Inconsistencia en datos de mesa: Sucursal=${id_sucursal}, Restaurante=${id_restaurante}`);
    }

    logger.debug(`✅ Datos de venta validados para mesa ${mesaData.numero}`);
  }

  /**
   * Valida datos de mesa antes de actualizar
   */
  async validateMesaData(mesaData) {
    const { id_mesa, numero, id_sucursal, id_restaurante } = mesaData;
    
    // Verificar que no haya duplicados
    const duplicates = await pool.query(`
      SELECT id_mesa
      FROM mesas
      WHERE numero = $1 AND id_restaurante = $2 AND id_mesa != $3
    `, [numero, id_restaurante, id_mesa]);

    if (duplicates.rows.length > 0) {
      throw new Error(`Ya existe una mesa con número ${numero} en el restaurante ${id_restaurante}`);
    }

    logger.debug(`✅ Datos de mesa validados para mesa ${numero}`);
  }

  /**
   * Valida datos de producto antes de actualizar
   */
  async validateProductoData(productoData) {
    const { id_producto, id_restaurante, precio } = productoData;
    
    if (precio < 0) {
      throw new Error(`El precio del producto no puede ser negativo: $${precio}`);
    }

    logger.debug(`✅ Datos de producto validados para producto ${id_producto}`);
  }
}

module.exports = new IntegrityService();
