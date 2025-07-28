import { Router } from 'express';
import { getVentasGlobal, getVentasPorRestaurante, getVentasPorSucursal, exportVentasCSV } from '../controllers/reportesController';
import { query } from 'express-validator';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

// GET /reportes/ventas-global
router.get(
  '/ventas-global',
  authenticateAdmin,
  authorizePerm('reportes', 'ver'),
  [query('startDate').isISO8601(), query('endDate').isISO8601()],
  validateRequest,
  getVentasGlobal
);
// GET /reportes/ventas-restaurante/:id_restaurante
router.get(
  '/ventas-restaurante/:id_restaurante',
  authenticateAdmin,
  authorizePerm('reportes', 'ver'),
  [query('startDate').isISO8601(), query('endDate').isISO8601()],
  validateRequest,
  getVentasPorRestaurante
);
// GET /reportes/ventas-sucursal/:id_sucursal
router.get(
  '/ventas-sucursal/:id_sucursal',
  authenticateAdmin,
  authorizePerm('reportes', 'ver'),
  [query('startDate').isISO8601(), query('endDate').isISO8601()],
  validateRequest,
  getVentasPorSucursal
);
// GET /reportes/exportar-csv
router.get(
  '/exportar-csv',
  authenticateAdmin,
  authorizePerm('reportes', 'ver'),
  [query('startDate').isISO8601(), query('endDate').isISO8601()],
  validateRequest,
  exportVentasCSV
);

export default router; 