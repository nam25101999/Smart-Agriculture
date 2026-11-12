import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authenticateToken } from '../../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticateToken);

// Dashboard routes
router.get('/overview', controller.getOverview);
router.get('/farms/:id', controller.getFarmOverview);
router.get('/devices', controller.getDashboardDevices);
router.get('/alerts', controller.getDashboardAlerts);

export const dashboardRoutes = router;

// Analytics routes
const aRouter = Router();
aRouter.use(authenticateToken);

aRouter.get('/telemetry', controller.getTelemetryAnalytics);
aRouter.get('/devices', controller.getDeviceAnalytics);
aRouter.get('/alerts', controller.getAlertAnalytics);

export const analyticsRoutes = aRouter;

