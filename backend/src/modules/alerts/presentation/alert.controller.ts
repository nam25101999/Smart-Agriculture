import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.client.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import { PushNotificationService } from '../../../infrastructure/notifications/push-notification.service.js';
import { broadcastAlert } from '../../../infrastructure/websocket/socket.server.js';
import { logger } from '../../../shared/logger/index.js';

export class AlertController {
  public getAlertById = async (req: Request, res: Response): Promise<void> => {
    const alertId = req.params.alertId as string;
    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        device: true,
        zone: true,
        farm: true,
        rule: true,
      },
    });
    if (!alert) throw new NotFoundError('Cảnh báo không tồn tại');
    ResponseUtil.success(res, alert, 'Lấy chi tiết cảnh báo thành công');
  };

  // Rules CRUD
  public getRules = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.query.farmId as string;
    const rules = await prisma.alertRule.findMany({
      where: farmId ? { farmId } : undefined,
      include: { zone: true, farm: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    ResponseUtil.success(res, rules, 'Lấy danh sách quy tắc cảnh báo thành công');
  };

  public getRuleById = async (req: Request, res: Response): Promise<void> => {
    const ruleId = req.params.ruleId as string;
    const rule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
      include: { zone: true, farm: true },
    });
    if (!rule) throw new NotFoundError('Quy tắc cảnh báo không tồn tại');
    ResponseUtil.success(res, rule, 'Lấy chi tiết quy tắc cảnh báo thành công');
  };

  public createRule = async (req: Request, res: Response): Promise<void> => {
    const rule = await prisma.alertRule.create({ data: req.body });
    ResponseUtil.created(res, rule, 'Tạo quy tắc cảnh báo thành công');
  };

  public updateRule = async (req: Request, res: Response): Promise<void> => {
    const ruleId = req.params.ruleId as string;
    const rule = await prisma.alertRule.update({
      where: { id: ruleId },
      data: req.body,
    });
    ResponseUtil.success(res, rule, 'Cập nhật quy tắc cảnh báo thành công');
  };

  public deleteRule = async (req: Request, res: Response): Promise<void> => {
    const ruleId = req.params.ruleId as string;
    await prisma.alertRule.delete({ where: { id: ruleId } });
    ResponseUtil.success(res, null, 'Xóa quy tắc cảnh báo thành công');
  };

  public getAlerts = async (req: Request, res: Response): Promise<void> => {
    const farmId = req.query.farmId as string;
    const status = req.query.status as string;

    const where: any = {};
    if (farmId) where.farmId = farmId;
    if (status) where.status = status;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        device: { select: { id: true, name: true, deviceCode: true } },
        zone: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    ResponseUtil.success(res, alerts, 'Truy xuất danh sách cảnh báo thành công');
  };

  public acknowledgeAlert = async (req: Request, res: Response): Promise<void> => {
    const alertId = req.params.alertId as string;
    const userId = req.user!.id;

    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundError('Cảnh báo không tồn tại');

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
    });

    ResponseUtil.success(res, updated, 'Đã xác nhận cảnh báo');
  };

  public resolveAlert = async (req: Request, res: Response): Promise<void> => {
    const alertId = req.params.alertId as string;
    const userId = req.user!.id;

    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundError('Cảnh báo không tồn tại');

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });

    ResponseUtil.success(res, updated, 'Đã giải quyết cảnh báo');
  };

  public triggerTestAlert = async (req: Request, res: Response): Promise<void> => {
    let {
      farmId,
      zoneId,
      deviceId,
      metric = 'temperature',
      value = 41.5,
      severity = 'CRITICAL',
      message,
    } = req.body;

    // Tìm farm mặc định nếu không truyền
    if (!farmId) {
      const defaultFarm = await prisma.farm.findFirst();
      if (defaultFarm) farmId = defaultFarm.id;
    }

    if (!zoneId && farmId) {
      const defaultZone = await prisma.zone.findFirst({ where: { farmId } });
      if (defaultZone) zoneId = defaultZone.id;
    }

    if (!deviceId && zoneId) {
      const defaultDevice = await prisma.device.findFirst({ where: { zoneId } });
      if (defaultDevice) deviceId = defaultDevice.id;
    }

    const alertMsg =
      message ||
      `⚠️ CẢNH BÁO ${severity}: Chỉ số ${metric} đo được là ${value}, vượt ngưỡng an toàn! Cần xử lý ngay.`;

    // 1. Tạo bản ghi Alert trong DB
    let alertRecord: any = null;
    if (farmId) {
      alertRecord = await prisma.alert.create({
        data: {
          farmId,
          zoneId: zoneId || null,
          deviceId: deviceId || null,
          metric,
          observedValue: value,
          thresholdValue: 35,
          severity,
          status: 'ACTIVE',
          deduplicationKey: `test_${Date.now()}`,
          message: alertMsg,
        },
      });

      // Tạo outbox event
      await prisma.outboxEvent.create({
        data: {
          aggregateType: 'Alert',
          aggregateId: alertRecord.id,
          eventType: 'ALERT_TRIGGERED',
          payload: {
            alertId: alertRecord.id,
            farmId,
            zoneId,
            deviceId,
            severity,
            message: alertMsg,
            observedValue: value,
            metric,
          },
          status: 'PROCESSED',
        },
      });
    }

    // 2. Broadcast qua WebSocket realtime
    broadcastAlert(farmId || null, {
      id: alertRecord?.id || `test-${Date.now()}`,
      farmId,
      zoneId,
      deviceId,
      severity,
      message: alertMsg,
      createdAt: new Date().toISOString(),
    });

    // 3. Gửi Push Notification tới toàn bộ thiết bị đang đăng ký
    const pushTitle = `🚨 CẢNH BÁO ${severity}: NÔNG TRẠI THÔNG MINH`;
    const pushResult = await PushNotificationService.sendToAll(pushTitle, alertMsg, {
      screen: alertRecord?.id ? `/alerts/${alertRecord.id}` : '/alerts',
      alertId: alertRecord?.id,
      farmId,
      severity,
    });

    // 4. Lưu Notification vào DB
    try {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      if (allUsers.length > 0) {
        await prisma.notification.createMany({
          data: allUsers.map((u) => ({
            userId: u.id,
            title: pushTitle,
            body: alertMsg,
            type: 'ALERT',
            metadata: { alertId: alertRecord?.id, farmId, severity },
          })),
        });
      }
    } catch (e: any) {
      logger.warn({ e: e?.message }, '[AlertController] Lỗi lưu notification DB');
    }

    ResponseUtil.success(
      res,
      {
        alert: alertRecord,
        pushResult,
      },
      `Đã kích hoạt cảnh báo thử nghiệm và phát thông báo đẩy tới ${pushResult.totalTokens} thiết bị`
    );
  };
}

