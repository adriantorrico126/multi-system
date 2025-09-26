import { Router } from 'express';
import * as posManagerController from '../controllers/posManagerController';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

// GET /pos-manager/overview - Resumen general del POS
router.get('/overview', authenticateAdmin, authorizePerm('pos_manager', 'ver'), posManagerController.getOverview);

// GET /pos-manager/printers - Lista de impresoras
router.get('/printers', authenticateAdmin, authorizePerm('pos_manager', 'ver'), posManagerController.getPrinters);

// POST /pos-manager/printers/test - Probar impresión
router.post('/printers/test', authenticateAdmin, authorizePerm('pos_manager', 'editar'), posManagerController.testPrinter);

// GET /pos-manager/connections - Estado de conexiones
router.get('/connections', authenticateAdmin, authorizePerm('pos_manager', 'ver'), posManagerController.getConnections);

// POST /pos-manager/connections/test - Probar conexión
router.post('/connections/test', authenticateAdmin, authorizePerm('pos_manager', 'editar'), posManagerController.testConnection);

// GET /pos-manager/layout - Configuración de layout
router.get('/layout', authenticateAdmin, authorizePerm('pos_manager', 'ver'), posManagerController.getLayout);

// PUT /pos-manager/layout - Actualizar layout
router.put('/layout', authenticateAdmin, authorizePerm('pos_manager', 'editar'), posManagerController.updateLayout);

// GET /pos-manager/roles - Roles y permisos POS
router.get('/roles', authenticateAdmin, authorizePerm('pos_manager', 'ver'), posManagerController.getRoles);

// PUT /pos-manager/roles/:id - Actualizar rol
router.put('/roles/:id', authenticateAdmin, authorizePerm('pos_manager', 'editar'), posManagerController.updateRole);

// GET /pos-manager/data - Estado de datos
router.get('/data', authenticateAdmin, authorizePerm('pos_manager', 'ver'), posManagerController.getDataStatus);

// POST /pos-manager/data/sync - Sincronizar datos
router.post('/data/sync', authenticateAdmin, authorizePerm('pos_manager', 'editar'), posManagerController.syncData);

// POST /pos-manager/data/diagnose - Diagnóstico de datos
router.post('/data/diagnose', authenticateAdmin, authorizePerm('pos_manager', 'editar'), posManagerController.diagnoseData);

export default router;
