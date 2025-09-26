const pool = require('../config/database');
const logger = require('../utils/logger');

class MetodosPagoController {
  // Obtener todos los métodos de pago
  async getAllMetodosPago(req, res, next) {
    try {
      const query = `
        SELECT 
          id_pago,
          descripcion,
          activo,
          created_at,
          updated_at
        FROM metodos_pago
        ORDER BY id_pago
      `;
      
      const { rows } = await pool.query(query);
      
      logger.info(`Métodos de pago obtenidos: ${rows.length} registros`);
      
      res.status(200).json({
        success: true,
        message: 'Métodos de pago obtenidos exitosamente',
        data: rows
      });
    } catch (error) {
      logger.error('Error al obtener métodos de pago:', error);
      next(error);
    }
  }

  // Obtener solo métodos de pago activos
  async getActiveMetodosPago(req, res, next) {
    try {
      const query = `
        SELECT 
          id_pago,
          descripcion,
          activo,
          created_at,
          updated_at
        FROM metodos_pago
        WHERE activo = true
        ORDER BY descripcion
      `;
      
      const { rows } = await pool.query(query);
      
      logger.info(`Métodos de pago activos obtenidos: ${rows.length} registros`);
      
      res.status(200).json({
        success: true,
        message: 'Métodos de pago activos obtenidos exitosamente',
        data: rows
      });
    } catch (error) {
      logger.error('Error al obtener métodos de pago activos:', error);
      next(error);
    }
  }

  // Crear nuevo método de pago
  async createMetodoPago(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { descripcion, activo = true } = req.body;
      
      // Validar datos requeridos
      if (!descripcion || descripcion.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'La descripción del método de pago es obligatoria'
        });
      }
      
      // Verificar que no exista ya
      const existQuery = `
        SELECT id_pago FROM metodos_pago 
        WHERE LOWER(descripcion) = LOWER($1)
      `;
      const existResult = await client.query(existQuery, [descripcion.trim()]);
      
      if (existResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe un método de pago con esa descripción'
        });
      }
      
      // Insertar nuevo método
      const insertQuery = `
        INSERT INTO metodos_pago (descripcion, activo)
        VALUES ($1, $2)
        RETURNING *
      `;
      
      const { rows } = await client.query(insertQuery, [descripcion.trim(), activo]);
      
      await client.query('COMMIT');
      
      logger.info(`Método de pago creado: ${rows[0].descripcion} (ID: ${rows[0].id_pago})`);
      
      res.status(201).json({
        success: true,
        message: 'Método de pago creado exitosamente',
        data: rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al crear método de pago:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Actualizar método de pago
  async updateMetodoPago(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const { descripcion, activo } = req.body;
      
      // Verificar que el método existe
      const existQuery = `
        SELECT id_pago FROM metodos_pago WHERE id_pago = $1
      `;
      const existResult = await client.query(existQuery, [id]);
      
      if (existResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }
      
      // Verificar que la nueva descripción no exista (si se está cambiando)
      if (descripcion) {
        const duplicateQuery = `
          SELECT id_pago FROM metodos_pago 
          WHERE LOWER(descripcion) = LOWER($1) AND id_pago != $2
        `;
        const duplicateResult = await client.query(duplicateQuery, [descripcion.trim(), id]);
        
        if (duplicateResult.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe otro método de pago con esa descripción'
          });
        }
      }
      
      // Construir query de actualización dinámicamente
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;
      
      if (descripcion) {
        updateFields.push(`descripcion = $${paramCount++}`);
        updateValues.push(descripcion.trim());
      }
      
      if (activo !== undefined) {
        updateFields.push(`activo = $${paramCount++}`);
        updateValues.push(activo);
      }
      
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);
      
      const updateQuery = `
        UPDATE metodos_pago 
        SET ${updateFields.join(', ')}
        WHERE id_pago = $${paramCount}
        RETURNING *
      `;
      
      const { rows } = await client.query(updateQuery, updateValues);
      
      await client.query('COMMIT');
      
      logger.info(`Método de pago actualizado: ID ${id}`);
      
      res.status(200).json({
        success: true,
        message: 'Método de pago actualizado exitosamente',
        data: rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al actualizar método de pago:', error);
      next(error);
    } finally {
      client.release();
    }
  }

  // Eliminar método de pago
  async deleteMetodoPago(req, res, next) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      
      // Verificar que el método existe
      const existQuery = `
        SELECT id_pago, descripcion FROM metodos_pago WHERE id_pago = $1
      `;
      const existResult = await client.query(existQuery, [id]);
      
      if (existResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Método de pago no encontrado'
        });
      }
      
      // Verificar si hay ventas que usan este método
      const ventasQuery = `
        SELECT COUNT(*) as total FROM ventas WHERE id_pago = $1
      `;
      const ventasResult = await client.query(ventasQuery, [id]);
      
      if (parseInt(ventasResult.rows[0].total) > 0) {
        return res.status(409).json({
          success: false,
          message: 'No se puede eliminar el método de pago porque tiene ventas asociadas'
        });
      }
      
      // Eliminar método
      const deleteQuery = `
        DELETE FROM metodos_pago WHERE id_pago = $1
      `;
      
      await client.query(deleteQuery, [id]);
      
      await client.query('COMMIT');
      
      logger.info(`Método de pago eliminado: ${existResult.rows[0].descripcion} (ID: ${id})`);
      
      res.status(200).json({
        success: true,
        message: 'Método de pago eliminado exitosamente'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al eliminar método de pago:', error);
      next(error);
    } finally {
      client.release();
    }
  }
}

module.exports = new MetodosPagoController();
