import { Request, Response } from 'express';
import { prisma } from '../../../infrastructure/database/prisma.client.js';
import { ResponseUtil } from '../../../shared/response/api-response.js';
import { PushNotificationService } from '../../../infrastructure/notifications/push-notification.service.js';
import { logger } from '../../../shared/logger/index.js';

export class NotificationController {
  public getNotifications = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    ResponseUtil.success(res, notifications, 'Lấy danh sách thông báo thành công');
  };

  public getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const count = await prisma.notification.count({
      where: { userId, readAt: null },
    });
    ResponseUtil.success(res, { unreadCount: count }, 'Lấy số lượng thông báo chưa đọc thành công');
  };

  public markAsRead = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    ResponseUtil.success(res, updated, 'Đã đánh dấu thông báo là đã đọc');
  };

  public markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    ResponseUtil.success(res, null, 'Đã đánh dấu tất cả thông báo là đã đọc');
  };

  public registerDeviceToken = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { token, platform } = req.body;

    const deviceToken = await prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform: platform || 'ANDROID', active: true },
      create: { userId, token, platform: platform || 'ANDROID', active: true },
    });

    logger.info({ userId, token, platform }, '[Notification] Đã lưu/cập nhật Device Token thành công');
    ResponseUtil.created(res, deviceToken, 'Đăng ký device token thành công');
  };

  public unregisterDeviceToken = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    await prisma.deviceToken.delete({ where: { id } });
    ResponseUtil.success(res, null, 'Hủy đăng ký device token thành công');
  };

  public testPush = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const {
      title = '⚠️ CẢNH BÁO NÔNG TRẠI',
      body = 'Độ ẩm Zone 1 giảm còn 32% (ngưỡng tối thiểu 50%). Cần kiểm tra ngay!',
      delaySeconds = 0,
    } = req.body;

    const delay = Number(delaySeconds) || 0;

    const sendAction = async () => {
      logger.info({ userId, title, delay }, '[TestPush] Bắt đầu phát Push Notification');
      await PushNotificationService.sendToUser(userId, title, body, {
        screen: '/alerts/test',
        timestamp: new Date().toISOString(),
      });
    };

    if (delay > 0) {
      setTimeout(() => {
        sendAction().catch((e) => logger.error({ e }, '[TestPush] Lỗi khi gửi delay push'));
      }, delay * 1000);

      ResponseUtil.success(
        res,
        { scheduledInSeconds: delay },
        `Máy chủ đã lên lịch gửi thông báo đẩy sau ${delay} giây. Hãy nhấn Home ra màn hình chính (Background) hoặc vuốt tắt hẳn App để kiểm tra!`
      );
    } else {
      await sendAction();
      ResponseUtil.success(res, null, 'Đã gửi lệnh push notification thử nghiệm thành công');
    }
  };

  public broadcastPush = async (req: Request, res: Response): Promise<void> => {
    const {
      title = '📢 Thông Báo Hệ Thống Smart Agriculture',
      body = 'Đây là thông báo từ hệ thống quản lý nông trại thông minh.',
      data = {},
    } = req.body;

    logger.info({ title, body }, '[Broadcast] Bắt đầu phát sóng thông báo đẩy tới toàn bộ người dùng');

    const result = await PushNotificationService.sendToAll(title, body, {
      screen: '/notifications',
      timestamp: new Date().toISOString(),
      ...data,
    });

    // Lưu thông báo vào bảng Notification trong DB cho tất cả người dùng
    try {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      if (allUsers.length > 0) {
        await prisma.notification.createMany({
          data: allUsers.map((u: any) => ({
            userId: u.id,
            title,
            body,
            type: 'SYSTEM',
            metadata: { broadcast: true, ...data },
          })),
        });
      }
    } catch (dbErr: any) {
      logger.warn({ err: dbErr?.message }, '[Broadcast] Lỗi khi lưu notification vào DB');
    }

    ResponseUtil.success(
      res,
      result,
      `Đã phát sóng thông báo đẩy thành công tới ${result.totalTokens} thiết bị`
    );
  };
}

