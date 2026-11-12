import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.client.js';
import { DeviceRepository } from '../infrastructure/repositories/device.repository.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';
import { NotFoundError, BadRequestError } from '../../../shared/errors/app-error.js';
import { logger } from '../../../shared/logger/index.js';

export class DeviceController {
  private deviceRepository = new DeviceRepository();

  public getAllDevices = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.query.farmId as string;
    const zoneId = req.query.zoneId as string;
    const status = req.query.status as string;

    const where: any = {};
    if (zoneId) where.zoneId = zoneId;
    if (farmId) where.zone = { farmId };
    if (status) where.status = status;

    const devices = await prisma.device.findMany({
      where,
      include: {
        sensors: true,
        zone: { include: { farm: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    ResponseUtil.success(res, devices, 'Lấy danh sách thiết bị thành công');
  };

  public getAvailableDevices = async (req: Request, res: Response): Promise<void> => {
    const dbDevices = await prisma.device.findMany({
      include: {
        zone: { include: { farm: true } },
      },
    });

    const standardCodes = [
      { deviceCode: 'ESP32_ZONE_01', name: 'ESP32 #1 - Bộ Điều Khiển Vườn Rau Củ', defaultType: 'ESP32' },
      { deviceCode: 'ESP32_ZONE_02', name: 'ESP32 #2 - Bộ Điều Khiển Vườn Cây Ăn Trái', defaultType: 'ESP32' },
      { deviceCode: 'ESP32_ZONE_03', name: 'ESP32 #3 - Bộ Điều Khiển Nhà Màng Dưa Lưới', defaultType: 'ESP32' },
    ];

    const result = standardCodes.map((std) => {
      const found = dbDevices.find((d) => d.deviceCode === std.deviceCode);
      return {
        deviceCode: std.deviceCode,
        name: found?.name || std.name,
        deviceType: found?.deviceType || std.defaultType,
        status: found?.status || 'ONLINE',
        isPaired: !!found?.zoneId,
        currentFarm: found?.zone?.farm ? { id: found.zone.farm.id, name: found.zone.farm.name } : null,
        currentZone: found?.zone ? { id: found.zone.id, name: found.zone.name } : null,
        deviceId: found?.id || null,
        lastSeenAt: found?.lastSeenAt || new Date(),
      };
    });

    ResponseUtil.success(res, result, 'Lấy danh sách thiết bị khả dụng để kết nối thành công');
  };

  public pairDeviceToFarm = async (req: Request, res: Response): Promise<void> => {
    const { deviceCode, farmId, zoneId } = req.body;

    if (!deviceCode || !farmId) {
      throw new BadRequestError('Vui lòng cung cấp mã thiết bị (deviceCode) và ID nông trại (farmId)');
    }

    // 1. Kiểm tra farm
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { zones: true },
    });
    if (!farm) {
      throw new NotFoundError('Nông trại không tồn tại');
    }

    // 2. Tìm hoặc tạo zone cho farm
    let targetZoneId = zoneId;
    if (!targetZoneId) {
      if (farm.zones.length > 0) {
        targetZoneId = farm.zones[0].id;
      } else {
        const newZone = await prisma.zone.create({
          data: {
            farmId: farm.id,
            name: `${farm.name} - Khu Vực 1`,
            // code: 'ZONE_01', // removed as not in schema
            area: 1000,
          },
        });
        targetZoneId = newZone.id;
      }
    }

    // 3. Tìm hoặc tạo device
    let device = await prisma.device.findUnique({
      where: { deviceCode },
      include: { sensors: true },
    });

    if (device) {
      device = await prisma.device.update({
        where: { id: device.id },
        data: {
          zoneId: targetZoneId,
          status: 'ONLINE',
          lastSeenAt: new Date(),
        },
        include: {
          sensors: true,
          zone: { include: { farm: true } },
        },
      });
    } else {
      device = await prisma.device.create({
        data: {
          zoneId: targetZoneId,
          deviceCode,
          name: `Bộ Điều Khiển ${deviceCode}`,
          deviceType: 'ESP32_SENSOR_CONTROLLER',
          status: 'ONLINE',
          lastSeenAt: new Date(),
          sensors: {
            create: [
              { metricName: 'temperature', sensorType: 'DHT22', unit: '°C' },
              { metricName: 'humidity', sensorType: 'DHT22', unit: '%' },
              { metricName: 'soilMoisture', sensorType: 'POTENTIOMETER', unit: '%' },
            ],
          },
        },
        include: {
          sensors: true,
          zone: { include: { farm: true } },
        },
      });
    }

    logger.info({ deviceCode, farmId, zoneId: targetZoneId }, '✓ Đã kết nối thành công thiết bị vào Vườn');
    ResponseUtil.success(res, device, `Đã kết nối thành công thiết bị ${deviceCode} vào ${farm.name}`);
  };

  public getDeviceDetails = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundError('Thiết bị không tồn tại');
    }
    ResponseUtil.success(res, device, 'Truy xuất thông tin thiết bị thành công');
  };

  public getDevicesByZone = async (req: Request, res: Response): Promise<void> => {
    const zoneId = req.params.zoneId as string;
    const devices = await this.deviceRepository.findByZone(zoneId);
    ResponseUtil.success(res, devices, 'Truy xuất danh sách thiết bị trong khu vực thành công');
  };

  public registerDevice = async (req: Request, res: Response): Promise<void> => {
    const result = await this.deviceRepository.register(req.body);
    ResponseUtil.created(res, result, 'Đăng ký thiết bị ESP32 thành công');
  };

  public updateDevice = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const updated = await this.deviceRepository.update(deviceId, req.body);
    ResponseUtil.success(res, updated, 'Cập nhật thiết bị thành công');
  };

  public deleteDevice = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    // Xóa các bảng phụ thuộc trong transaction để tránh vi phạm FK
    await prisma.$transaction([
      prisma.sensor.deleteMany({ where: { deviceId } }),
      prisma.telemetry.deleteMany({ where: { deviceId } }),
      prisma.deviceCommand.deleteMany({ where: { deviceId } }),
      prisma.alert.deleteMany({ where: { deviceId } }),
      prisma.deviceCredential.deleteMany({ where: { deviceId } }),
      prisma.device.delete({ where: { id: deviceId } }),
    ]);
    ResponseUtil.success(res, null, 'Xóa thiết bị thành công');
  };

  // Hủy kết nối thiết bị khỏi vườn: đặt trạng thái OFFLINE (zoneId là required nên không thể null)
  public unpairDevice = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const updated = await prisma.device.update({
      where: { id: deviceId },
      data: { status: 'OFFLINE', lastSeenAt: new Date() },
      include: { zone: true },
    });
    ResponseUtil.success(res, updated, 'Đã hủy kết nối thiết bị (đặt trạng thái OFFLINE)');
  };

  public rotateCredentials = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const crypto = await import('crypto');
    const newSecret = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.createHash('sha256').update(newSecret).digest('hex');

    await prisma.deviceCredential.upsert({
      where: { deviceId },
      update: { credentialHash: newHash, rotatedAt: new Date() },
      create: { deviceId, credentialHash: newHash },
    });

    ResponseUtil.success(res, { deviceId, newSecret }, 'Cập nhật và xoay vòng mã xác thực thiết bị thành công');
  };

  public getSensors = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const sensors = await prisma.sensor.findMany({ where: { deviceId } });
    ResponseUtil.success(res, sensors, 'Lấy danh sách cảm biến thành công');
  };

  public getStatus = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { id: true, deviceCode: true, status: true, lastSeenAt: true },
    });
    if (!device) throw new NotFoundError('Thiết bị không tồn tại');
    ResponseUtil.success(res, device, 'Lấy trạng thái thiết bị thành công');
  };

  public getLatestTelemetry = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const telemetry = await prisma.telemetry.findMany({
      where: { deviceId },
      orderBy: { recordedAt: 'desc' },
      distinct: ['metric'],
    });
    ResponseUtil.success(res, telemetry, 'Lấy telemetry mới nhất thành công');
  };

  public getTelemetryHistory = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const telemetry = await prisma.telemetry.findMany({
      where: { deviceId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    ResponseUtil.success(res, telemetry, 'Lấy lịch sử telemetry của thiết bị thành công');
  };

  public getCommands = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const commands = await prisma.deviceCommand.findMany({
      where: { deviceId },
      include: { logs: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    ResponseUtil.success(res, commands, 'Lấy lịch sử lệnh điều khiển thành công');
  };

  public getCommandStatus = async (req: Request, res: Response): Promise<void> => {
    const commandId = req.params.commandId as string;
    const command = await prisma.deviceCommand.findUnique({
      where: { id: commandId },
      include: { logs: true },
    });
    if (!command) throw new NotFoundError('Lệnh điều khiển không tồn tại');
    ResponseUtil.success(res, command, 'Lấy trạng thái lệnh điều khiển thành công');
  };

  public sendCommand = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const userId = req.user!.id;
    const command = await this.deviceRepository.createCommand(deviceId, userId, req.body);
    ResponseUtil.created(
      res,
      {
        commandId: command.id,
        status: command.status,
        commandType: command.commandType,
      },
      'Lệnh điều khiển đã được tiếp nhận (ACCEPTED)'
    );
  };
}

