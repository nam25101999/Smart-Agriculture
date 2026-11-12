import { prisma } from '../../../../infrastructure/database/prisma.client.js';
import { RegisterDto } from '../../application/dtos/auth.dto.js';

export class UserRepository {
  public async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  public async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        farmMemberships: {
          include: {
            farm: true,
            role: true,
          },
        },
      },
    });
  }

  public async create(data: RegisterDto & { passwordHash: string; defaultRoleId?: string }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          fullName: data.fullName,
          phone: data.phone,
          status: 'ACTIVE',
        },
      });

      // Assign default role if provided (or default to FARM_OWNER)
      if (data.defaultRoleId) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: data.defaultRoleId,
          },
        });
      }

      return user;
    });
  }

  public async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  public async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  public async revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async updatePassword(userId: string, newPasswordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }
}
