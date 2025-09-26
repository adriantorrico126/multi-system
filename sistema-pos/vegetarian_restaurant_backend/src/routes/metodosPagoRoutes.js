const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Obtener todos los métodos de pago globales
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id_pago, descripcion, activo, created_at, updated_at
      FROM metodos_pago 
      ORDER BY id_pago
    `;
    
    const { rows } = await pool.query(query);
    
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    logger.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener métodos de pago activos
router.get('/activos', async (req, res) => {
  try {
    const query = `
      SELECT id_pago, descripcion, activo
      FROM metodos_pago 
      WHERE activo = true
      ORDER BY descripcion
    `;
    
    const { rows } = await pool.query(query);
    
    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    logger.error('Error obteniendo métodos de pago activos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo método de pago
router.post('/', async (req, res) => {
  try {
    const { descripcion, activo = true } = req.body;
    
    if (!descripcion) {
      return res.status(400).json({
        success: false,
        message: 'La descripción es requerida'
      });
    }
    
    const query = `
      INSERT INTO metodos_pago (descripcion, activo)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [descripcion, activo]);
    
    res.status(201).json({
      success: true,
      data: rows[0],
      message: 'Método de pago creado exitosamente'
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        message: 'Ya existe un método de pago con esa descripción'
      });
    } else {
      logger.error('Error creando método de pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

// Actualizar método de pago
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, activo } = req.body;
    
    const query = `
      UPDATE metodos_pago 
      SET descripcion = $1, activo = $2, updated_at = NOW()
      WHERE id_pago = $3
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [descripcion, activo, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0],
      message: 'Método de pago actualizado exitosamente'
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(409).json({
        success: false,
        message: 'Ya existe un método de pago con esa descripción'
      });
    } else {
      logger.error('Error actualizando método de pago:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

// Eliminar método de pago (solo si no está en uso)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el método está en uso
    const usoQuery = `
      SELECT COUNT(*) as uso_count
      FROM ventas 
      WHERE id_pago = $1
    `;
    
    const usoResult = await pool.query(usoQuery, [id]);
    const usoCount = parseInt(usoResult.rows[0].uso_count);
    
    if (usoCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el método de pago porque está siendo usado en ${usoCount} ventas`
      });
    }
    
    const deleteQuery = `
      DELETE FROM metodos_pago 
      WHERE id_pago = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(deleteQuery, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0],
      message: 'Método de pago eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error eliminando método de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
