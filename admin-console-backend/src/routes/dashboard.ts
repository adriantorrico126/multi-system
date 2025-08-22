import { Router } from 'express';
import { getGlobalStats, getDashboardAlerts, getGlobalAnalytics } from '../controllers/dashboardController';
import { authenticateAdmin, authorizePerm } from '../middlewares/authMiddleware';

const router = Router();

// GET /dashboard/global
router.get('/global', authenticateAdmin, authorizePerm('dashboard', 'ver'), getGlobalStats);

// GET /dashboard/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/analytics', authenticateAdmin, authorizePerm('dashboard', 'ver'), getGlobalAnalytics);

// GET /dashboard/alerts
router.get('/alerts', authenticateAdmin, authorizePerm('dashboard', 'ver'), getDashboardAlerts);

export default router; 