import { Router } from 'express';
import { AlertController } from './alert.controller.js';
import { authenticateToken } from '../../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new AlertController();

router.use(authenticateToken);

router.get('/', controller.getAlerts);
router.get('/rules', controller.getRules);
router.post('/rules', controller.createRule);
router.get('/rules/:ruleId', controller.getRuleById);
router.patch('/rules/:ruleId', controller.updateRule);
router.delete('/rules/:ruleId', controller.deleteRule);

router.get('/:alertId', controller.getAlertById);
router.post('/test-alert', controller.triggerTestAlert);
router.post('/:alertId/acknowledge', controller.acknowledgeAlert);
router.post('/:alertId/resolve', controller.resolveAlert);

export const alertRoutes = router;

