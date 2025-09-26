import { Router } from 'express';
import auditoriaRouter from './auditoria';
import authRouter from './auth';
import restaurantesRouter from './restaurantes';
import dashboardRouter from './dashboard';
import adminUsersRouter from './adminUsers';
import sucursalesRouter from './sucursales';
import reportesRouter from './reportes';
import pagosRouter from './pagos';
import soporteRoutes from './soporte';
import configuracionRouter from './configuracion';
import productosAdminRouter from './productosAdmin';
import planesRouter from './planes';
import posManagerRouter from './posManager';
import * as rolesAdminController from '../controllers/rolesAdminController';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

router.use('/auth', authRouter);
router.use('/auditoria', authenticateAdmin, auditoriaRouter);
router.use('/restaurantes', authenticateAdmin, restaurantesRouter);
router.use('/dashboard', authenticateAdmin, dashboardRouter);
router.use('/admin-users', authenticateAdmin, adminUsersRouter);
router.use('/sucursales', authenticateAdmin, sucursalesRouter);
router.use('/reportes', authenticateAdmin, reportesRouter);
router.use('/pagos', authenticateAdmin, pagosRouter);
router.use('/soporte', soporteRoutes);
router.use('/configuracion', configuracionRouter);
router.use('/productos', productosAdminRouter);
router.use('/planes', planesRouter);
router.use('/pos-manager', posManagerRouter);
router.get('/roles-admin', authenticateAdmin, authorizePerm('roles_admin', 'ver'), rolesAdminController.getAllRoles);
router.post('/roles-admin', authenticateAdmin, authorizePerm('roles_admin', 'crear'), rolesAdminController.createRole);
router.patch('/roles-admin/:id', authenticateAdmin, authorizePerm('roles_admin', 'editar'), rolesAdminController.updateRole);
router.delete('/roles-admin/:id', authenticateAdmin, authorizePerm('roles_admin', 'eliminar'), rolesAdminController.deleteRole);

export default router; 