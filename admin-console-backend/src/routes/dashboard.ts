import { Router } from 'express';
import { getGlobalStats, getDashboardAlerts } from '../controllers/dashboardController';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

// GET /dashboard/global
router.get('/global', authenticateAdmin, authorizePerm('dashboard', 'ver'), getGlobalStats);

// GET /dashboard/alerts
router.get('/alerts', authenticateAdmin, authorizePerm('dashboard', 'ver'), getDashboardAlerts);

export default router; 