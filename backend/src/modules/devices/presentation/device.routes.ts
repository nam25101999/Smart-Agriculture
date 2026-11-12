import { Router } from 'express';
import { DeviceController } from './device.controller.js';
import { authenticateToken, requireGlobalRole } from '../../../shared/middleware/auth.middleware.js';
import { validateRequest } from '../../../shared/middleware/validate.middleware.js';
import {
  registerDeviceSchema,
  updateDeviceSchema,
  sendCommandSchema,
} from '../application/dtos/device.dto.js';

const router = Router();
const controller = new DeviceController();

router.use(authenticateToken);

// Device management
router.get('/', controller.getAllDevices);
router.get('/available-to-pair', controller.getAvailableDevices);
router.post('/pair', controller.pairDeviceToFarm);
router.post(
  '/',
  requireGlobalRole(['SUPER_ADMIN', 'FARM_OWNER', 'TECHNICIAN']),
  validateRequest({ body: registerDeviceSchema }),
  controller.registerDevice
);

router.get('/zone/:zoneId', controller.getDevicesByZone);
router.get('/:deviceId', controller.getDeviceDetails);
router.patch(
  '/:deviceId',
  requireGlobalRole(['SUPER_ADMIN', 'FARM_OWNER', 'TECHNICIAN']),
  validateRequest({ body: updateDeviceSchema }),
  controller.updateDevice
);
// Xóa hoàn toàn thiết bị (kèm cascade các bảng phụ thuộc)
router.delete(
  '/:deviceId',
  requireGlobalRole(['SUPER_ADMIN', 'FARM_OWNER']),
  controller.deleteDevice
);
// Hủy kết nối thiết bị khỏi vườn mà không xóa bản ghi
router.post('/:deviceId/unpair',
  requireGlobalRole(['SUPER_ADMIN', 'FARM_OWNER', 'TECHNICIAN']),
  controller.unpairDevice
);


// Device sub-resources
router.post(
  '/:deviceId/credentials/rotate',
  requireGlobalRole(['SUPER_ADMIN', 'FARM_OWNER', 'TECHNICIAN']),
  controller.rotateCredentials
);
router.get('/:deviceId/sensors', controller.getSensors);
router.get('/:deviceId/status', controller.getStatus);
router.get('/:deviceId/telemetry/latest', controller.getLatestTelemetry);
router.get('/:deviceId/telemetry/history', controller.getTelemetryHistory);
router.get('/:deviceId/commands', controller.getCommands);
router.get('/:deviceId/commands/:commandId', controller.getCommandStatus);

// Device Command execution
router.post(
  '/:deviceId/commands',
  requireGlobalRole(['SUPER_ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN']),
  validateRequest({ body: sendCommandSchema }),
  controller.sendCommand
);

export const deviceRoutes = router;

