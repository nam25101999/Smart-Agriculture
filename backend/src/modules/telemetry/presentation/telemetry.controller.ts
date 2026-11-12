import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.client.js';
import { TelemetryRepository } from '../infrastructure/repositories/telemetry.repository.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';

export class TelemetryController {
  private telemetryRepository = new TelemetryRepository();

  public getLatest = async (req: Request, res: Response): Promise<void> => {
    const data = await prisma.telemetry.findMany({
      orderBy: { recordedAt: 'desc' },
      distinct: ['deviceId', 'metric'],
      take: 50,
      include: { device: { select: { id: true, deviceCode: true, name: true } } },
    });
    ResponseUtil.success(res, data, 'Truy xuất toàn bộ telemetry mới nhất thành công');
  };

  public getByDevice = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const data = await prisma.telemetry.findMany({
      where: { deviceId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    ResponseUtil.success(res, data, 'Truy xuất dữ liệu telemetry theo thiết bị thành công');
  };

  public getByZone = async (req: Request, res: Response): Promise<void> => {
    const zoneId = req.params.zoneId as string;
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const devices = await prisma.device.findMany({ where: { zoneId }, select: { id: true } });
    const deviceIds = devices.map((d: { id: string }) => d.id);
    const data = await prisma.telemetry.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    ResponseUtil.success(res, data, 'Truy xuất dữ liệu telemetry theo khu vực thành công');
  };

  public getByFarm = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.farmId as string;
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const zones = await prisma.zone.findMany({ where: { farmId }, select: { id: true } });
    const zoneIds = zones.map((z: { id: string }) => z.id);
    const devices = await prisma.device.findMany({ where: { zoneId: { in: zoneIds } }, select: { id: true } });
    const deviceIds = devices.map((d: { id: string }) => d.id);
    const data = await prisma.telemetry.findMany({
      where: { deviceId: { in: deviceIds } },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    ResponseUtil.success(res, data, 'Truy xuất dữ liệu telemetry theo nông trại thành công');
  };

  public getStatistics = async (req: Request, res: Response): Promise<void> => {
    const metric = req.query.metric as string;
    const deviceId = req.query.deviceId as string;

    const where: any = {};
    if (metric) where.metric = metric;
    if (deviceId) where.deviceId = deviceId;

    const aggregate = await prisma.telemetry.aggregate({
      where,
      _avg: { value: true },
      _min: { value: true },
      _max: { value: true },
      _count: { value: true },
    });

    ResponseUtil.success(res, aggregate, 'Truy xuất thống kê telemetry thành công');
  };

  public getAggregates = async (req: Request, res: Response): Promise<void> => {
    // Aggregation summary
    const count = await prisma.telemetry.count();
    ResponseUtil.success(res, { totalRecords: count }, 'Truy xuất tổng hợp telemetry thành công');
  };

  public getLatestByDevice = async (req: Request, res: Response): Promise<void> => {
    const deviceId = req.params.deviceId as string;
    const data = await this.telemetryRepository.getLatestByDevice(deviceId);
    ResponseUtil.success(res, data, 'Truy xuất telemetry mới nhất thành công');
  };

  public getHistory = async (req: Request, res: Response): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.telemetryRepository.getHistory(req.query as any);
    ResponseUtil.success(res, data, 'Truy xuất lịch sử telemetry thành công');
  };
}

