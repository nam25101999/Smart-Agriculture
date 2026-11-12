import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.client.js';
import { FarmRepository } from '../infrastructure/repositories/farm.repository.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';

export class FarmController {
  private farmRepository = new FarmRepository();

  public getMyFarms = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const farms = await this.farmRepository.findByOwnerOrMember(userId);
    ResponseUtil.success(res, farms, 'Truy xuất danh sách nông trại thành công');
  };

  public getFarmDetails = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const farm = await this.farmRepository.findById(farmId);
    if (!farm) {
      throw new NotFoundError('Nông trại không tồn tại hoặc đã bị xóa');
    }
    ResponseUtil.success(res, farm, 'Truy xuất thông tin nông trại thành công');
  };

  public createFarm = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const farm = await this.farmRepository.createFarm(userId, req.body);
    ResponseUtil.created(res, farm, 'Tạo nông trại mới thành công');
  };

  public updateFarm = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const farm = await this.farmRepository.updateFarm(farmId, req.body);
    ResponseUtil.success(res, farm, 'Cập nhật thông tin nông trại thành công');
  };

  public deleteFarm = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    await this.farmRepository.deleteFarm(farmId);
    ResponseUtil.success(res, null, 'Xóa nông trại thành công');
  };

  // Zones
  public getZones = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const farm = await this.farmRepository.findById(farmId);
    ResponseUtil.success(res, farm?.zones || [], 'Lấy danh sách khu vực thành công');
  };

  public getZoneDetails = async (req: Request, res: Response): Promise<void> => {
    const zoneId = req.params.zoneId as string;
    const zone = await this.farmRepository.findZoneById(zoneId);
    if (!zone) throw new NotFoundError('Khu vực không tồn tại');
    ResponseUtil.success(res, zone, 'Lấy chi tiết khu vực thành công');
  };

  public getZoneDevices = async (req: Request, res: Response): Promise<void> => {
    const zoneId = req.params.zoneId as string;
    const zone = await this.farmRepository.findZoneById(zoneId);
    ResponseUtil.success(res, zone?.devices || [], 'Lấy thiết bị trong khu vực thành công');
  };

  public getZoneTelemetry = async (req: Request, res: Response): Promise<void> => {
    const zoneId = req.params.zoneId as string;
    const zone = await this.farmRepository.findZoneById(zoneId);
    const deviceIds = (zone?.devices || []).map((d) => d.id);
    const telemetry = await prisma.telemetry.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });
    ResponseUtil.success(res, telemetry, 'Lấy dữ liệu cảm biến trong khu vực thành công');
  };

  public createZone = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const zone = await this.farmRepository.createZone(farmId, req.body);
    ResponseUtil.created(res, zone, 'Tạo khu vực thành công');
  };

  public updateZone = async (req: Request, res: Response): Promise<void> => {
    const zoneId = req.params.zoneId as string;
    const zone = await this.farmRepository.updateZone(zoneId, req.body);
    ResponseUtil.success(res, zone, 'Cập nhật khu vực thành công');
  };

  public deleteZone = async (req: Request, res: Response): Promise<void> => {
    const zoneId = req.params.zoneId as string;
    await this.farmRepository.deleteZone(zoneId);
    ResponseUtil.success(res, null, 'Xóa khu vực thành công');
  };

  // Members
  public getMembers = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const members = await prisma.farmMember.findMany({
      where: { farmId },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        role: true,
      },
    });
    ResponseUtil.success(res, members, 'Lấy danh sách thành viên nông trại thành công');
  };

  public updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const userId = req.params.userId as string;
    const { roleCode } = req.body;

    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new NotFoundError(`Vai trò ${roleCode} không tồn tại`);

    const updated = await prisma.farmMember.update({
      where: { farmId_userId: { farmId, userId } },
      data: { roleId: role.id },
      include: { role: true },
    });
    ResponseUtil.success(res, updated, 'Cập nhật vai trò thành viên thành công');
  };

  public addMember = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const member = await this.farmRepository.addMember(farmId, req.body);
    ResponseUtil.created(res, member, 'Thêm thành viên vào nông trại thành công');
  };

  public removeMember = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const userId = req.params.userId as string;
    await this.farmRepository.removeMember(farmId, userId);
    ResponseUtil.success(res, null, 'Xóa thành viên khỏi nông trại thành công');
  };
}
