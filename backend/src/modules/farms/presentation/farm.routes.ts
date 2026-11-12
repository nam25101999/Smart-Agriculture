import { Router } from 'express';
import { FarmController } from './farm.controller.js';
import { authenticateToken, requireFarmRole } from '../../../shared/middleware/auth.middleware.js';
import { validateRequest } from '../../../shared/middleware/validate.middleware.js';
import {
  createFarmSchema,
  updateFarmSchema,
  createZoneSchema,
  updateZoneSchema,
  addFarmMemberSchema,
} from '../application/dtos/farm.dto.js';

const router = Router();
const controller = new FarmController();

router.use(authenticateToken);

// Farm CRUD
router.get('/', controller.getMyFarms);
router.post('/', validateRequest({ body: createFarmSchema }), controller.createFarm);
router.get('/:farmId', requireFarmRole(['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER']), controller.getFarmDetails);
router.patch(
  '/:farmId',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER']),
  validateRequest({ body: updateFarmSchema }),
  controller.updateFarm
);
router.delete('/:farmId', requireFarmRole(['FARM_OWNER']), controller.deleteFarm);

// Zone CRUD & Queries
router.get(
  '/:farmId/zones',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER']),
  controller.getZones
);
router.get(
  '/:farmId/zones/:zoneId',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER']),
  controller.getZoneDetails
);
router.get(
  '/:farmId/zones/:zoneId/devices',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER']),
  controller.getZoneDevices
);
router.get(
  '/:farmId/zones/:zoneId/telemetry',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER']),
  controller.getZoneTelemetry
);
router.post(
  '/:farmId/zones',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER']),
  validateRequest({ body: createZoneSchema }),
  controller.createZone
);
router.patch(
  '/:farmId/zones/:zoneId',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER']),
  validateRequest({ body: updateZoneSchema }),
  controller.updateZone
);
router.delete(
  '/:farmId/zones/:zoneId',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER']),
  controller.deleteZone
);

// Member CRUD
router.get(
  '/:farmId/members',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER']),
  controller.getMembers
);
router.post(
  '/:farmId/members',
  requireFarmRole(['FARM_OWNER', 'FARM_MANAGER']),
  validateRequest({ body: addFarmMemberSchema }),
  controller.addMember
);
router.patch(
  '/:farmId/members/:userId',
  requireFarmRole(['FARM_OWNER']),
  controller.updateMemberRole
);
router.delete(
  '/:farmId/members/:userId',
  requireFarmRole(['FARM_OWNER']),
  controller.removeMember
);

export const farmRoutes = router;

