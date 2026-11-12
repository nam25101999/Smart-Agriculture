import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticateToken, requireGlobalRole } from '../../../shared/middleware/auth.middleware.js';

const router = Router();
const controller = new UserController();

router.use(authenticateToken);
router.use(requireGlobalRole(['SUPER_ADMIN']));

router.get('/', controller.getUsers);
router.get('/:id', controller.getUserById);
router.post('/', controller.createUser);
router.patch('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

export const userRoutes = router;

