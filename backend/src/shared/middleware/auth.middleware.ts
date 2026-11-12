import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error.js';
import { JwtService } from '../../modules/auth/infrastructure/jwt.service.js';
import { prisma } from '../../infrastructure/database/prisma.client.js';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Yêu cầu cung cấp Authorization Bearer Token');
  }

  const token = authHeader.substring(7);
  const user = JwtService.verifyAccessToken(token);
  req.user = user;
  next();
};

export const requireGlobalRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Người dùng chưa xác thực');
    }

    // SUPER_ADMIN has full bypass privileges
    if (req.user.globalRoles.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasRole = req.user.globalRoles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      throw new ForbiddenError(`Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${allowedRoles.join(', ')}`);
    }

    next();
  };
};

export const requireFarmRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Người dùng chưa xác thực');
      }

      // SUPER_ADMIN has full privileges
      if (req.user.globalRoles.includes('SUPER_ADMIN')) {
        return next();
      }

      const farmId = (req.params.farmId || req.body.farmId || req.query.farmId) as string;
      if (!farmId) {
        throw new ForbiddenError('Không tìm thấy thông tin định danh nông trại (farmId)');
      }

      // 1. Check if user is Farm Owner directly
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        select: { ownerId: true },
      });

      if (!farm) {
        throw new ForbiddenError('Nông trại không tồn tại hoặc đã bị xóa');
      }

      if (farm.ownerId === req.user.id) {
        return next();
      }

      // 2. Check Farm Membership Role
      const member = await prisma.farmMember.findUnique({
        where: {
          farmId_userId: {
            farmId,
            userId: req.user.id,
          },
        },
        include: { role: true },
      });

      if (!member) {
        throw new ForbiddenError('Bạn không phải là thành viên của nông trại này');
      }

      if (!allowedRoles.includes(member.role.code)) {
        throw new ForbiddenError(`Yêu cầu vai trò tại nông trại: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

