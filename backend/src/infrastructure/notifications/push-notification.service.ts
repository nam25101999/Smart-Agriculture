import { prisma } from '../database/prisma.client.js';
import { logger } from '../../shared/logger/index.js';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

export class PushNotificationService {
  private static EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  /**
   * Gửi thông báo đẩy đến danh sách các device tokens
   */
  public static async sendPush(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    if (!tokens || tokens.length === 0) return;

    // Lọc các token không rỗng
    const validTokens = tokens.filter((t) => t && typeof t === 'string' && t.trim().length > 5);
    if (validTokens.length === 0) {
      logger.warn({ tokens }, '[PushNotification] Không có token hợp lệ để gửi thông báo');
      return;
    }

    const messages: PushMessage[] = validTokens.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
      channelId: 'farm-alerts',
      badge: 1,
    }));

    try {
      logger.info({ count: messages.length, title }, '[PushNotification] Đang gửi thông báo đẩy qua Expo Push API');

      const response: any = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      const result: any = await response.json();
      logger.info({ result }, '[PushNotification] Kết quả gửi thông báo từ Expo Push API');
    } catch (err: any) {
      logger.error({ err: err?.message }, '[PushNotification] Lỗi khi gửi thông báo đẩy');
    }
  }

  /**
   * Gửi thông báo đẩy cho 1 User cụ thể
   */
  public static async sendToUser(
    userId: string,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId, active: true },
      select: { token: true },
    });

    const tokens = deviceTokens.map((dt) => dt.token);
    if (tokens.length > 0) {
      await this.sendPush(tokens, title, body, data);
    }
  }

  /**
   * Gửi thông báo đẩy cho TOÀN BỘ người dùng / thiết bị đang kích hoạt trên hệ thống
   */
  public static async sendToAll(
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<{ totalTokens: number; successCount: number }> {
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { active: true },
      select: { token: true },
    });

    const tokens: string[] = Array.from(new Set(deviceTokens.map((dt) => dt.token))) as string[];
    logger.info(
      { totalTokens: tokens.length, title },
      '[PushNotification] Bắt đầu phát sóng thông báo đẩy tới toàn bộ người dùng'
    );

    if (tokens.length > 0) {
      await this.sendPush(tokens, title, body, data);
    }

    return { totalTokens: tokens.length, successCount: tokens.length };
  }

  /**
   * Gửi thông báo đẩy cho tất cả thành viên trong một Nông trại (Farm)
   */
  public static async sendToFarm(
    farmId: string,
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!farm) {
      // Nếu farm không tồn tại, gửi đến toàn bộ thiết bị
      await this.sendToAll(title, body, data);
      return;
    }

    const userIds = [farm.ownerId, ...farm.members.map((m) => m.userId)];
    const uniqueUserIds = Array.from(new Set(userIds));

    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId: { in: uniqueUserIds },
        active: true,
      },
      select: { token: true },
    });

    const tokens = deviceTokens.map((dt) => dt.token);
    if (tokens.length > 0) {
      await this.sendPush(tokens, title, body, data);
    } else {
      // Nếu farm chưa có device token riêng, tự động gửi tới toàn bộ thiết bị kích hoạt
      logger.info({ farmId }, '[PushNotification] Farm chưa có device token riêng, tự động gửi cảnh báo tới toàn bộ thiết bị');
      await this.sendToAll(title, body, data);
    }
  }
}
