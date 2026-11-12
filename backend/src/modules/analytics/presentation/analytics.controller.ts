import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.client.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';

export class AnalyticsController {
  public getOverview = async (req: Request, res: Response): Promise<void> => {
    const [farmCount, deviceCount, onlineDeviceCount, activeAlertCount, telemetryCount] =
      await Promise.all([
        prisma.farm.count({ where: { deletedAt: null } }),
        prisma.device.count(),
        prisma.device.count({ where: { status: 'ONLINE' } }),
        prisma.alert.count({ where: { status: 'ACTIVE' } }),
        prisma.telemetry.count(),
      ]);

    ResponseUtil.success(
      res,
      {
        totalFarms: farmCount,
        totalDevices: deviceCount,
        onlineDevices: onlineDeviceCount,
        activeAlerts: activeAlertCount,
        totalTelemetryReadings: telemetryCount,
      },
      'Lấy dữ liệu tổng quan dashboard thành công'
    );
  };

  public getFarmOverview = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.params.id as string;
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        zones: {
          include: {
            devices: { select: { id: true, deviceCode: true, status: true } },
          },
        },
      },
    });

    const activeAlerts = await prisma.alert.count({
      where: { farmId, status: 'ACTIVE' },
    });

    ResponseUtil.success(res, { farm, activeAlerts }, 'Lấy tổng quan nông trại thành công');
  };

  public getDashboardDevices = async (req: Request, res: Response): Promise<void> => {
    const devices = await prisma.device.findMany({
      select: {
        id: true,
        deviceCode: true,
        name: true,
        status: true,
        lastSeenAt: true,
        zone: { select: { name: true, farm: { select: { name: true } } } },
      },
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
    });
    ResponseUtil.success(res, devices, 'Lấy trạng thái thiết bị dashboard thành công');
  };

  public getDashboardAlerts = async (req: Request, res: Response): Promise<void> => {
    const alertsBySeverity = await prisma.alert.groupBy({
      by: ['severity'],
      _count: { id: true },
      where: { status: 'ACTIVE' },
    });
    ResponseUtil.success(res, alertsBySeverity, 'Lấy thống kê cảnh báo dashboard thành công');
  };

  public getTelemetryAnalytics = async (req: Request, res: Response): Promise<void> => {
    const metrics = await prisma.telemetry.groupBy({
      by: ['metric'],
      _avg: { value: true },
      _min: { value: true },
      _max: { value: true },
      _count: { value: true },
    });
    ResponseUtil.success(res, metrics, 'Lấy phân tích telemetry thành công');
  };

  public getDeviceAnalytics = async (req: Request, res: Response): Promise<void> => {
    const statusCounts = await prisma.device.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    ResponseUtil.success(res, statusCounts, 'Lấy phân tích thiết bị thành công');
  };

  public getAlertAnalytics = async (req: Request, res: Response): Promise<void> => {
    const alertStats = await prisma.alert.groupBy({
      by: ['status', 'severity'],
      _count: { id: true },
    });
    ResponseUtil.success(res, alertStats, 'Lấy phân tích cảnh báo thành công');
  };
}

