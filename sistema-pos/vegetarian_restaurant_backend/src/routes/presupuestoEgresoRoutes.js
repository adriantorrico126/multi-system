const express = require('express');
const router = express.Router();
const presupuestoEgresoController = require('../controllers/presupuestoEgresoController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { body, param, query } = require('express-validator');

// =====================================================
// VALIDACIONES
// =====================================================

// Validaciones para crear presupuesto
const createPresupuestoValidation = [
  body('anio')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('El año debe ser un número válido entre 2020 y 2050'),
  
  body('mes')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('El mes debe ser un número entre 1 y 12'),
  
  body('id_categoria_egreso')
    .isInt({ gt: 0 })
    .withMessage('La categoría de egreso es requerida y debe ser un ID válido'),
  
  body('monto_presupuestado')
    .isFloat({ gt: 0 })
    .withMessage('El monto presupuestado debe ser un número positivo')
    .custom((value) => {
      if (value > 999999999.99) {
        throw new Error('El monto presupuestado no puede exceder 999,999,999.99');
      }
      return true;
    })
];

// Validaciones para actualizar presupuesto
const updatePresupuestoValidation = [
  body('monto_presupuestado')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('El monto presupuestado debe ser un número positivo')
    .custom((value) => {
      if (value > 999999999.99) {
        throw new Error('El monto presupuestado no puede exceder 999,999,999.99');
      }
      return true;
    }),
  
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser un valor booleano')
];

// Validaciones para copiar presupuestos
const copiarPresupuestosValidation = [
  body('anio_origen')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('El año origen debe ser un número válido entre 2020 y 2050'),
  
  body('mes_origen')
    .isInt({ min: 1, max: 12 })
    .withMessage('El mes origen debe ser un número entre 1 y 12'),
  
  body('anio_destino')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('El año destino debe ser un número válido entre 2020 y 2050'),
  
  body('mes_destino')
    .isInt({ min: 1, max: 12 })
    .withMessage('El mes destino debe ser un número entre 1 y 12'),
  
  // Validación personalizada para evitar copiar al mismo período
  body().custom((body) => {
    if (body.anio_origen === body.anio_destino && body.mes_origen === body.mes_destino) {
      throw new Error('No se puede copiar presupuestos al mismo período');
    }
    return true;
  })
];

// Validación de ID de parámetro
const paramIdValidation = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El ID debe ser un número entero positivo')
];

// Validación de ID de categoría en parámetro
const paramCategoriaValidation = [
  param('id_categoria')
    .isInt({ gt: 0 })
    .withMessage('El ID de categoría debe ser un número entero positivo')
];

// Validaciones de query para consultas
const queryValidation = [
  query('anio')
    .optional()
    .isInt({ min: 2020, max: 2050 })
    .withMessage('El año debe ser un número válido entre 2020 y 2050'),
  
  query('mes')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('El mes debe ser un número entre 1 y 12'),
  
  query('id_categoria_egreso')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('La categoría debe ser un ID válido'),
  
  query('activo')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Activo debe ser true o false'),
  
  query('umbral')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El umbral debe ser un número entre 1 y 100'),
  
  query('meses_atras')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Los meses atrás deben ser un número entre 1 y 24')
];

// =====================================================
// RUTAS CRUD BÁSICAS
// =====================================================

// Obtener todos los presupuestos
router.get('/', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  queryValidation,
  presupuestoEgresoController.getAllPresupuestos
);

// Obtener un presupuesto por ID
router.get('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  paramIdValidation,
  presupuestoEgresoController.getPresupuestoById
);

// Crear un nuevo presupuesto
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  createPresupuestoValidation,
  presupuestoEgresoController.createPresupuesto
);

// Actualizar un presupuesto
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  paramIdValidation,
  updatePresupuestoValidation,
  presupuestoEgresoController.updatePresupuesto
);

// Eliminar un presupuesto
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  paramIdValidation,
  presupuestoEgresoController.deletePresupuesto
);

// =====================================================
// RUTAS DE CONSULTAS ESPECIALES
// =====================================================

// Obtener presupuestos por período
router.get('/reportes/por-periodo', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  [
    query('anio')
      .notEmpty()
      .withMessage('El año es requerido')
      .isInt({ min: 2020, max: 2050 })
      .withMessage('El año debe ser un número válido entre 2020 y 2050'),
    
    query('mes')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('El mes debe ser un número entre 1 y 12')
  ],
  presupuestoEgresoController.getPresupuestosPorPeriodo
);

// Obtener resumen anual de presupuestos
router.get('/reportes/resumen-anual', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  [
    query('anio')
      .notEmpty()
      .withMessage('El año es requerido')
      .isInt({ min: 2020, max: 2050 })
      .withMessage('El año debe ser un número válido entre 2020 y 2050')
  ],
  presupuestoEgresoController.getResumenAnual
);

// Obtener presupuestos excedidos
router.get('/reportes/excedidos', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  queryValidation,
  presupuestoEgresoController.getPresupuestosExcedidos
);

// Obtener presupuestos en alerta
router.get('/reportes/en-alerta', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  queryValidation,
  presupuestoEgresoController.getPresupuestosEnAlerta
);

// Obtener evolución de presupuestos por categoría
router.get('/reportes/evolucion/:id_categoria', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  paramCategoriaValidation,
  [
    query('anio')
      .notEmpty()
      .withMessage('El año es requerido')
      .isInt({ min: 2020, max: 2050 })
      .withMessage('El año debe ser un número válido entre 2020 y 2050'),
    
    query('meses_atras')
      .optional()
      .isInt({ min: 1, max: 24 })
      .withMessage('Los meses atrás deben ser un número entre 1 y 24')
  ],
  presupuestoEgresoController.getEvolucionPorCategoria
);

// =====================================================
// RUTAS DE OPERACIONES ESPECIALES
// =====================================================

// Actualizar montos gastados
router.post('/operaciones/actualizar-montos-gastados', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  [
    body('anio')
      .optional()
      .isInt({ min: 2020, max: 2050 })
      .withMessage('El año debe ser un número válido entre 2020 y 2050'),
    
    body('mes')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('El mes debe ser un número entre 1 y 12')
  ],
  presupuestoEgresoController.actualizarMontosGastados
);

// Copiar presupuestos de un período a otro
router.post('/operaciones/copiar', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  copiarPresupuestosValidation,
  presupuestoEgresoController.copiarPresupuestos
);

module.exports = router;
