import { Router } from 'express';
import { AutomationController } from './automation.controller.js';
import { authenticateToken } from '../../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new AutomationController();

router.use(authenticateToken);

router.get('/rules', controller.getRules);
router.post('/rules', controller.createRule);
router.patch('/rules/:id', controller.updateRule);
router.delete('/rules/:id', controller.deleteRule);
router.get('/logs', controller.getLogs);

export const automationRoutes = router;

