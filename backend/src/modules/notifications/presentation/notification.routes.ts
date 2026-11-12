import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticateToken } from '../../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new NotificationController();

router.use(authenticateToken);

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/:id/read', controller.markAsRead);
router.post('/read-all', controller.markAllAsRead);
router.post('/device-tokens', controller.registerDeviceToken);
router.delete('/device-tokens/:id', controller.unregisterDeviceToken);
router.post('/test-push', controller.testPush);
router.post('/broadcast', controller.broadcastPush);

export const notificationRoutes = router;

