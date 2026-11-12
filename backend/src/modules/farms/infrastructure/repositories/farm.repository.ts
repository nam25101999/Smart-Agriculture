import { prisma } from '../../../../infrastructure/database/prisma.client.js';
import { CreateFarmDto, UpdateFarmDto, CreateZoneDto, UpdateZoneDto, AddFarmMemberDto } from '../../application/dtos/farm.dto.js';

export class FarmRepository {
  public async findByOwnerOrMember(userId: string) {
    return prisma.farm.findMany({
      where: {
        deletedAt: null,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        zones: { where: { deletedAt: null } },
        members: {
          include: {
            user: { select: { id: true, email: true, fullName: true } },
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async findById(farmId: string) {
    return prisma.farm.findFirst({
      where: { id: farmId, deletedAt: null },
      include: {
        zones: {
          where: { deletedAt: null },
          include: {
            devices: {
              select: {
                id: true,
                deviceCode: true,
                name: true,
                deviceType: true,
                status: true,
                lastSeenAt: true,
              },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, email: true, fullName: true, phone: true } },
            role: true,
          },
        },
      },
    });
  }

  public async createFarm(ownerId: string, data: CreateFarmDto) {
    return prisma.farm.create({
      data: {
        ...data,
        ownerId,
        status: 'ACTIVE',
      },
    });
  }

  public async updateFarm(farmId: string, data: UpdateFarmDto) {
    return prisma.farm.update({
      where: { id: farmId },
      data,
    });
  }

  public async deleteFarm(farmId: string) {
    return prisma.farm.update({
      where: { id: farmId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  // Zone management
  public async createZone(farmId: string, data: CreateZoneDto) {
    return prisma.zone.create({
      data: {
        ...data,
        farmId,
        status: 'ACTIVE',
      },
    });
  }

  public async findZoneById(zoneId: string) {
    return prisma.zone.findFirst({
      where: { id: zoneId, deletedAt: null },
      include: {
        devices: true,
      },
    });
  }

  public async updateZone(zoneId: string, data: UpdateZoneDto) {
    return prisma.zone.update({
      where: { id: zoneId },
      data,
    });
  }

  public async deleteZone(zoneId: string) {
    return prisma.zone.update({
      where: { id: zoneId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  // Member management
  public async addMember(farmId: string, dto: AddFarmMemberDto) {
    const role = await prisma.role.findUnique({
      where: { code: dto.roleCode },
    });
    if (!role) {
      throw new Error(`Role ${dto.roleCode} not found`);
    }

    return prisma.farmMember.upsert({
      where: {
        farmId_userId: { farmId, userId: dto.userId },
      },
      update: { roleId: role.id },
      create: {
        farmId,
        userId: dto.userId,
        roleId: role.id,
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        role: true,
      },
    });
  }

  public async removeMember(farmId: string, userId: string) {
    return prisma.farmMember.deleteMany({
      where: { farmId, userId },
    });
  }
}

