import { prisma } from '../../infrastructure/database/prisma.client.js';
import { mqttService } from '../../infrastructure/mqtt/mqtt.client.js';
import { env } from '../../shared/config/env.js';
import { logger } from '../../shared/logger/index.js';
import { PushNotificationService } from '../../infrastructure/notifications/push-notification.service.js';
import { broadcastAlert } from '../../infrastructure/websocket/socket.server.js';

let isRunning = true;

export const startOutboxDispatcher = async (): Promise<void> => {
  logger.info('🚀 Starting Outbox Dispatcher Worker...');

  const pollIntervalMs = env.OUTBOX_POLL_INTERVAL_MS;

  while (isRunning) {
    try {
      // 1. Fetch pending events ready for retry
      const pendingEvents = await prisma.outboxEvent.findMany({
        where: {
          status: 'PENDING',
          nextRetryAt: { lte: new Date() },
        },
        take: 20,
        orderBy: { nextRetryAt: 'asc' },
      });

      for (const event of pendingEvents) {
        await processOutboxEvent(event);
      }
    } catch (err) {
      logger.error(err, 'Error in Outbox Dispatcher polling loop');
    }

    // Sleep before next polling iteration
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
};

const processOutboxEvent = async (event: any): Promise<void> => {
  try {
    // Lock event
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: 'PROCESSING',
        lockedAt: new Date(),
        lockedBy: `worker-${process.pid}`,
      },
    });

    const payload = event.payload as any;

    // Dispatch according to eventType
    switch (event.eventType) {
      case 'COMMAND_REQUESTED': {
        const { commandId, deviceId, commandType, payload: cmdPayload } = payload;

        // Find device to get deviceCode
        const device = await prisma.device.findUnique({ where: { id: deviceId } });
        if (!device) {
          throw new Error(`Device ${deviceId} not found for command ${commandId}`);
        }

        const topic = `smartagri/devices/${device.deviceCode}/commands`;
        const mqttMessage = {
          commandId,
          commandType,
          payload: cmdPayload,
          timestamp: new Date().toISOString(),
        };

        // Publish to MQTT Broker
        await mqttService.publish(topic, mqttMessage, 1);

        // Update command status to PUBLISHED
        await prisma.deviceCommand.update({
          where: { id: commandId },
          data: { status: 'PUBLISHED' },
        });

        await prisma.deviceCommandLog.create({
          data: {
            commandId,
            eventType: 'COMMAND_PUBLISHED',
            message: `Lệnh đã được chuyển tới MQTT Topic: ${topic}`,
          },
        });

        logger.info({ commandId, deviceCode: device.deviceCode, topic }, '✓ Command dispatched via MQTT');
        break;
      }

      case 'TELEMETRY_INGESTED': {
        // Can be routed to WebSocket or Analytics pipeline
        logger.debug({ aggregateId: event.aggregateId }, 'Telemetry outbox event processed');
        break;
      }

      case 'ALERT_TRIGGERED': {
        logger.info({ alertId: payload.alertId, severity: payload.severity }, '🔔 Alert outbox event dispatched');

        let title = payload.severity === 'CRITICAL'
          ? '🚨 CẢNH BÁO NGUY HIỂM'
          : `⚠️ Cảnh Báo ${payload.severity || 'NÔNG TRẠI'}`;

        if (payload.metric === 'temperature') {
          title = `🚨 CẢNH BÁO: NHIỆT ĐỘ QUÁ CAO (${payload.observedValue || payload.value || ''}°C)`;
        } else if (payload.metric === 'soilMoisture') {
          title = `🚨 CẢNH BÁO: ĐỘ ẨM ĐẤT QUÁ THẤP (${payload.observedValue || payload.value || ''}%)`;
        } else if (payload.metric === 'humidity') {
          title = `⚠️ CẢNH BÁO: ĐỘ ẨM KHÔNG KHÍ (${payload.observedValue || payload.value || ''}%)`;
        }

        const body = payload.message || `Cảnh báo chỉ số ${payload.metric} đo được ${payload.observedValue} vượt ngưỡng!`;

        // 1. Broadcast cảnh báo theo thời gian thực qua WebSocket (Socket.IO)
        try {
          broadcastAlert(payload.farmId || null, {
            id: payload.alertId,
            farmId: payload.farmId,
            zoneId: payload.zoneId,
            deviceId: payload.deviceId,
            severity: payload.severity,
            message: body,
            createdAt: new Date().toISOString(),
          });
        } catch (sockErr: any) {
          logger.warn({ sockErr: sockErr?.message }, '[Outbox] Lỗi broadcast alert qua Socket.IO');
        }

        // 2. Gửi Push Notification đến điện thoại (Farm members hoặc toàn bộ người dùng)
        try {
          if (payload.farmId) {
            await PushNotificationService.sendToFarm(payload.farmId, title, body, {
              alertId: payload.alertId,
              farmId: payload.farmId,
              zoneId: payload.zoneId,
              screen: `/alerts/${payload.alertId}`,
            });
          } else {
            await PushNotificationService.sendToAll(title, body, {
              alertId: payload.alertId,
              screen: `/alerts/${payload.alertId}`,
            });
          }
        } catch (pushErr: any) {
          logger.warn({ pushErr: pushErr?.message }, '[Outbox] Lỗi gửi push notification cho cảnh báo');
        }

        // 3. Lưu thông báo vào bảng Notification trong DB
        try {
          if (payload.farmId) {
            const farm = await prisma.farm.findUnique({
              where: { id: payload.farmId },
              include: { members: { select: { userId: true } } },
            });

            if (farm) {
              const userIds = Array.from(new Set([farm.ownerId, ...farm.members.map((m) => m.userId)]));
              await prisma.notification.createMany({
                data: userIds.map((userId) => ({
                  userId,
                  title,
                  body,
                  type: 'ALERT',
                  metadata: { alertId: payload.alertId, farmId: payload.farmId },
                })),
              });
            }
          } else {
            const allUsers = await prisma.user.findMany({ select: { id: true } });
            if (allUsers.length > 0) {
              await prisma.notification.createMany({
                data: allUsers.map((u) => ({
                  userId: u.id,
                  title,
                  body,
                  type: 'ALERT',
                  metadata: { alertId: payload.alertId },
                })),
              });
            }
          }
        } catch (notifErr: any) {
          logger.warn({ notifErr: notifErr?.message }, '[Outbox] Lỗi lưu notification DB');
        }
        break;
      }

      default:
        logger.warn({ eventType: event.eventType }, 'Unknown outbox event type');
    }

    // Mark event as PROCESSED
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });
  } catch (err: any) {
    logger.error({ err, eventId: event.id }, 'Failed to process outbox event');

    const nextRetryCount = event.retryCount + 1;
    const isExhausted = nextRetryCount >= event.maxRetries;

    const backoffSeconds = Math.pow(2, nextRetryCount) * 2; // Exponential backoff: 4s, 8s, 16s...
    const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: isExhausted ? 'FAILED' : 'PENDING',
        retryCount: nextRetryCount,
        nextRetryAt,
        lastError: err.message || 'Unknown error',
      },
    });
  }
};

// Graceful stop
process.on('SIGINT', () => {
  isRunning = false;
});
process.on('SIGTERM', () => {
  isRunning = false;
});

// If run directly
if (process.argv[1]?.includes('outbox-dispatcher')) {
  startOutboxDispatcher().catch((err) => {
    logger.error(err, 'Outbox Dispatcher failed to start');
    process.exit(1);
  });
}

