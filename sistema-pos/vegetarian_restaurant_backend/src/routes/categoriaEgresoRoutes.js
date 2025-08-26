const express = require('express');
const router = express.Router();
const categoriaEgresoController = require('../controllers/categoriaEgresoController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { body, param, query } = require('express-validator');

// =====================================================
// VALIDACIONES
// =====================================================

// Validaciones para crear categoría
const createCategoriaValidation = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres')
    .trim(),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('El color debe ser un código hexadecimal válido (ej: #FF0000)'),
  
  body('icono')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El icono no puede exceder 50 caracteres')
    .matches(/^[A-Za-z][A-Za-z0-9]*$/)
    .withMessage('El icono debe ser un nombre válido de componente (ej: DollarSign)')
];

// Validaciones para actualizar categoría
const updateCategoriaValidation = [
  body('nombre')
    .optional()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .trim(),
  
  body('descripcion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres')
    .trim(),
  
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('El color debe ser un código hexadecimal válido (ej: #FF0000)'),
  
  body('icono')
    .optional()
    .isLength({ max: 50 })
    .withMessage('El icono no puede exceder 50 caracteres')
    .matches(/^[A-Za-z][A-Za-z0-9]*$/)
    .withMessage('El icono debe ser un nombre válido de componente (ej: DollarSign)'),
  
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser un valor booleano')
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
  
  query('limite')
    .optional()
    .isInt({ gt: 0, lt: 51 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  
  query('limite_categorias')
    .optional()
    .isInt({ gt: 0, lt: 51 })
    .withMessage('El límite de categorías debe ser un número entre 1 y 50'),
  
  query('limite_egresos')
    .optional()
    .isInt({ gt: 0, lt: 21 })
    .withMessage('El límite de egresos debe ser un número entre 1 y 20'),
  
  query('incluir_inactivas')
    .optional()
    .isBoolean()
    .withMessage('Incluir inactivas debe ser un valor booleano')
];

// =====================================================
// RUTAS CRUD BÁSICAS
// =====================================================

// Obtener todas las categorías de egresos
router.get('/', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'cajero'),
  [
    query('incluir_inactivas')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('Incluir inactivas debe ser true o false')
  ],
  categoriaEgresoController.getAllCategorias
);

// Obtener una categoría por ID
router.get('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente', 'cajero'),
  paramIdValidation,
  categoriaEgresoController.getCategoriaById
);

// Crear una nueva categoría de egreso
router.post('/', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  createCategoriaValidation,
  categoriaEgresoController.createCategoria
);

// Actualizar una categoría de egreso
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  paramIdValidation,
  updateCategoriaValidation,
  categoriaEgresoController.updateCategoria
);

// Eliminar una categoría de egreso
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  paramIdValidation,
  categoriaEgresoController.deleteCategoria
);

// =====================================================
// RUTAS DE REPORTES Y CONSULTAS ESPECIALES
// =====================================================

// Obtener categorías más populares
router.get('/reportes/populares', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  [
    query('limite')
      .optional()
      .isInt({ gt: 0, lt: 21 })
      .withMessage('El límite debe ser un número entre 1 y 20')
  ],
  categoriaEgresoController.getCategoriasPopulares
);

// Obtener categorías con mayor gasto
router.get('/reportes/mayor-gasto', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  reporteQueryValidation,
  categoriaEgresoController.getCategoriasConMayorGasto
);

// Obtener categorías con sus últimos egresos
router.get('/reportes/con-ultimos-egresos', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  reporteQueryValidation,
  categoriaEgresoController.getCategoriasConUltimosEgresos
);

// Obtener estadísticas de una categoría por período
router.get('/:id/estadisticas', 
  authenticateToken, 
  authorizeRoles('admin', 'gerente'),
  paramIdValidation,
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
      .withMessage('La fecha de fin debe ser una fecha válida')
  ],
  categoriaEgresoController.getEstadisticasCategoria
);

module.exports = router;
