import { Router } from 'express';
import { TelemetryController } from './telemetry.controller.js';
import { authenticateToken } from '../../../shared/middleware/auth.middleware.js';
import { validateRequest } from '../../../shared/middleware/validate.middleware.js';
import { queryTelemetryHistorySchema } from '../application/dtos/telemetry.dto.js';

const router = Router();
const controller = new TelemetryController();

router.use(authenticateToken);

router.get('/latest', controller.getLatest);
router.get('/history', validateRequest({ query: queryTelemetryHistorySchema }), controller.getHistory);
router.get('/devices/:deviceId', controller.getByDevice);
router.get('/latest/:deviceId', controller.getLatestByDevice);
router.get('/zones/:zoneId', controller.getByZone);
router.get('/farms/:farmId', controller.getByFarm);
router.get('/statistics', controller.getStatistics);
router.get('/aggregates', controller.getAggregates);
router.get('/device/:deviceId/latest', controller.getLatestByDevice);

export const telemetryRoutes = router;

