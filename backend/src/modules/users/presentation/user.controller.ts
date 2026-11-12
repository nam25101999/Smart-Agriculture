import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../infrastructure/database/prisma.client.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';
import { NotFoundError, ConflictError } from '../../../shared/errors/app-error.js';

export class UserController {
  public getUsers = async (req: Request, res: Response): Promise<void> => {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
          createdAt: true,
          userRoles: { include: { role: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);

    ResponseUtil.paginated(res, users, page, limit, total, 'Lấy danh sách người dùng thành công');
  };

  public getUserById = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id as string;
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        createdAt: true,
        userRoles: { include: { role: true } },
        farmMemberships: { include: { farm: true, role: true } },
      },
    });

    if (!user) throw new NotFoundError('Người dùng không tồn tại');
    ResponseUtil.success(res, user, 'Lấy thông tin người dùng thành công');
  };

  public createUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, fullName, phone, roleCode } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email này đã được sử dụng');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const targetRole = await prisma.role.findUnique({
      where: { code: roleCode || 'FARM_WORKER' },
    });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        status: 'ACTIVE',
        userRoles: targetRole
          ? {
              create: { roleId: targetRole.id },
            }
          : undefined,
      },
      select: { id: true, email: true, fullName: true, status: true, createdAt: true },
    });

    ResponseUtil.created(res, user, 'Tạo người dùng mới thành công');
  };

  public updateUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id as string;
    const { fullName, phone, status } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { fullName, phone, status },
      select: { id: true, email: true, fullName: true, phone: true, status: true, updatedAt: true },
    });

    ResponseUtil.success(res, updated, 'Cập nhật người dùng thành công');
  };

  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id as string;
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    ResponseUtil.success(res, null, 'Xóa người dùng thành công');
  };
}

