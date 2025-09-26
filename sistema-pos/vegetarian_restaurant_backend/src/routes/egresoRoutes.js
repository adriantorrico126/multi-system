const express = require('express');
const router = express.Router();
const egresoController = require('../controllers/egresoController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { planMiddleware } = require('../middlewares/planMiddleware');
const { 
  validateEgresosPermissions, 
  validateSucursalAccess, 
  validateMontoLimits, 
  logEgresosActivity, 
  validateEstadoTransition 
} = require('../middlewares/egresosMiddleware');
const { body, param, query } = require('express-validator');

// =====================================================
// VALIDACIONES
// =====================================================

// Validaciones para crear egreso
const createEgresoValidation = [
  body('concepto')
    .notEmpty()
    .withMessage('El concepto es requerido')
    .isLength({ max: 200 })
    .withMessage('El concepto no puede exceder 200 caracteres'),
  
  body('descripcion')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  
  body('monto')
    .isFloat({ gt: 0 })
    .withMessage('El monto debe ser un número positivo'),
  
  body('fecha_egreso')
    .optional()
    .isDate()
    .withMessage('La fecha de egreso debe ser una fecha válida'),
  
  body('id_categoria_egreso')
    .isInt({ gt: 0 })
    .withMessage('La categoría de egreso es requerida y debe ser un ID válido'),
  
  body('metodo_pago')
    .optional()
    .isIn(['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'otros'])
    .withMessage('El método de pago debe ser válido'),
  
  body('proveedor_nombre')
    .optional()
    .isLength({ max: 150 })
    .withMessage('El nombre del proveedor no puede exceder 150 caracteres'),
  
  body('proveedor_documento')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El documento del proveedor no puede exceder 50 caracteres'),
  
  body('proveedor_telefono')
    .optional()
    .isLength({ max: 20 })
    .withMessage('El teléfono del proveedor no puede exceder 20 caracteres'),
  
  body('proveedor_email')
    .optional()
    .isEmail()
    .withMessage('El email del proveedor debe ser válido'),
  
  body('numero_factura')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El número de factura no puede exceder 50 caracteres'),
  
  body('numero_recibo')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El número de recibo no puede exceder 50 caracteres'),
  
  body('numero_comprobante')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El número de comprobante no puede exceder 50 caracteres'),
  
  body('requiere_aprobacion')
    .optional()
    .isBoolean()
    .withMessage('Requiere aprobación debe ser un valor booleano'),
  
  body('es_deducible')
    .optional()
    .isBoolean()
    .withMessage('Es deducible debe ser un valor booleano'),
  
  body('es_recurrente')
    .optional()
    .isBoolean()
    .withMessage('Es recurrente debe ser un valor booleano'),
  
  body('frecuencia_recurrencia')
    .optional()
    .isIn(['diario', 'semanal', 'mensual', 'anual'])
    .withMessage('La frecuencia de recurrencia debe ser válida'),
  
  body('id_sucursal')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('La sucursal debe ser un ID válido')
];

// Validaciones para actualizar egreso
const updateEgresoValidation = [
  body('concepto')
    .optional()
    .notEmpty()
    .withMessage('El concepto no puede estar vacío')
    .isLength({ max: 200 })
    .withMessage('El concepto no puede exceder 200 caracteres'),
  
  body('descripcion')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  
  body('monto')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('El monto debe ser un número positivo'),
  
  body('fecha_egreso')
    .optional()
    .isDate()
    .withMessage('La fecha de egreso debe ser una fecha válida'),
  
  body('id_categoria_egreso')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('La categoría de egreso debe ser un ID válido'),
  
  body('metodo_pago')
    .optional()
    .isIn(['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'cheque', 'otros'])
    .withMessage('El método de pago debe ser válido'),
  
  body('proveedor_nombre')
    .optional()
    .isLength({ max: 150 })
    .withMessage('El nombre del proveedor no puede exceder 150 caracteres'),
  
  body('es_deducible')
    .optional()
    .isBoolean()
    .withMessage('Es deducible debe ser un valor booleano'),
  
  body('es_recurrente')
    .optional()
    .isBoolean()
    .withMessage('Es recurrente debe ser un valor booleano'),
  
  body('frecuencia_recurrencia')
    .optional()
    .isIn(['diario', 'semanal', 'mensual', 'anual'])
    .withMessage('La frecuencia de recurrencia debe ser válida')
];

// Validación de ID de parámetro
const paramIdValidation = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('El ID debe ser un número entero positivo')
];

// Validaciones de query para reportes
const reporteQueryValidation = [
  query('fecha_inicio')
    .optional()
    .isDate()
    .withMessage('La fecha de inicio debe ser una fecha válida'),
  
  query('fecha_fin')
    .optional()
    .isDate()
    .withMessage('La fecha de fin debe ser una fecha válida'),
  
  query('estado')
    .optional()
    .isIn(['pendiente', 'aprobado', 'pagado', 'cancelado', 'rechazado'])
    .withMessage('El estado debe ser válido'),
  
  query('page')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('La página debe ser un número entero positivo'),
  
  query('limit')
    .optional()
    .isInt({ gt: 0, lt: 101 })
    .withMessage('El límite debe ser un número entre 1 y 100')
];

// =====================================================
// MIDDLEWARE DE PLANES
// =====================================================

// Aplicar middleware de planes para funcionalidades básicas de egresos (plan profesional+)
router.use(authenticateToken, planMiddleware('egresos.basico', 'profesional'));

// =====================================================
// RUTAS CRUD BÁSICAS
// =====================================================

// Obtener todos los egresos
router.get('/', 
  authorizeRoles('admin', 'gerente', 'cajero'),
  validateEgresosPermissions('read'),
  validateSucursalAccess,
  logEgresosActivity('LISTAR_EGRESOS'),
  reporteQueryValidation,
  egresoController.getAllEgresos
);

// NOTA: Debe declararse ANTES de "/:id" para evitar colisiones
// Obtener egresos pendientes de aprobación
router.get('/pendientes-aprobacion', 
  authorizeRoles('admin', 'gerente', 'contador'),
  egresoController.getEgresosPendientesAprobacion
);

// Obtener un egreso por ID
router.get('/:id', 
  authorizeRoles('admin', 'gerente', 'cajero'),
  paramIdValidation,
  egresoController.getEgresoById
);

// Crear un nuevo egreso
router.post('/', 
  authorizeRoles('admin', 'gerente', 'cajero'),
  validateEgresosPermissions('create'),
  validateSucursalAccess,
  validateMontoLimits,
  logEgresosActivity('CREAR_EGRESO'),
  createEgresoValidation,
  egresoController.createEgreso
);

// Actualizar un egreso
router.put('/:id', 
  authorizeRoles('admin', 'gerente', 'cajero'),
  validateEgresosPermissions('update'),
  validateSucursalAccess,
  validateMontoLimits,
  validateEstadoTransition,
  logEgresosActivity('ACTUALIZAR_EGRESO'),
  paramIdValidation,
  updateEgresoValidation,
  egresoController.updateEgreso
);

// Eliminar (cancelar) un egreso
router.delete('/:id', 
  authorizeRoles('admin', 'gerente', 'contador'),
  paramIdValidation,
  egresoController.deleteEgreso
);

// =====================================================
// RUTAS DE APROBACIÓN
// =====================================================

// Aprobar un egreso
router.post('/:id/aprobar', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'contador'),
  validateEgresosPermissions('approve'),
  validateSucursalAccess,
  logEgresosActivity('APROBAR_EGRESO'),
  paramIdValidation,
  [
    body('comentario')
      .optional()
      .isLength({ max: 500 })
      .withMessage('El comentario no puede exceder 500 caracteres')
  ],
  egresoController.aprobarEgreso
);

// Rechazar un egreso
router.post('/:id/rechazar', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'contador'),
  paramIdValidation,
  [
    body('comentario')
      .notEmpty()
      .withMessage('El comentario es requerido para rechazar un egreso')
      .isLength({ max: 500 })
      .withMessage('El comentario no puede exceder 500 caracteres')
  ],
  egresoController.rechazarEgreso
);

// Marcar egreso como pagado
router.post('/:id/pagar', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'cajero'),
  validateEgresosPermissions('pay'),
  validateSucursalAccess,
  logEgresosActivity('MARCAR_PAGADO'),
  paramIdValidation,
  [
    body('comentario')
      .optional()
      .isLength({ max: 500 })
      .withMessage('El comentario no puede exceder 500 caracteres')
  ],
  egresoController.marcarComoPagado
);

// =====================================================
// RUTAS DE REPORTES Y CONSULTAS
// =====================================================

// Obtener resumen de egresos por categoría
router.get('/reportes/por-categoria', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'contador'),
  reporteQueryValidation,
  egresoController.getResumenPorCategoria
);

// Obtener total de egresos por período
router.get('/reportes/por-periodo', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'contador'),
  [
    query('fecha_inicio')
      .notEmpty()
      .withMessage('La fecha de inicio es requerida')
      .isDate()
      .withMessage('La fecha de inicio debe ser una fecha válida'),
    
    query('fecha_fin')
      .notEmpty()
      .withMessage('La fecha de fin es requerida')
      .isDate()
      .withMessage('La fecha de fin debe ser una fecha válida'),
    
    query('estado')
      .optional()
      .isIn(['pendiente', 'aprobado', 'pagado', 'cancelado', 'rechazado'])
      .withMessage('El estado debe ser válido')
  ],
  egresoController.getTotalPorPeriodo
);

// Obtener flujo de aprobaciones de un egreso
router.get('/:id/flujo-aprobaciones', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'contador'),
  paramIdValidation,
  egresoController.getFlujoAprobaciones
);

module.exports = router;
