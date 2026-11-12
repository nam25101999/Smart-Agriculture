import { prisma } from '../../../../infrastructure/database/prisma.client.js';
import { MqttTelemetryPayload, QueryTelemetryHistoryDto } from '../../application/dtos/telemetry.dto.js';
import { alertEngine } from '../../../alerts/application/services/alert-engine.service.js';
import { logger } from '../../../../shared/logger/index.js';

export class TelemetryRepository {
  public async ingestPayload(payload: MqttTelemetryPayload): Promise<{
    ingestedCount: number;
    isDuplicate: boolean;
    farmId?: string;
    deviceId?: string;
    deviceCode?: string;
  }> {
    // 1. Find device
    let device = await prisma.device.findUnique({
      where: { deviceCode: payload.deviceId },
      include: {
        sensors: true,
        zone: { select: { id: true, farmId: true } },
      },
    });

    if (!device) {
      logger.info({ deviceCode: payload.deviceId }, '[Telemetry] Thiết bị chưa tồn tại trong CSDL, đang tự động đăng ký...');

      // Tìm hoặc tạo Farm & Zone để gắn thiết bị
      let zone = await prisma.zone.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, farmId: true },
      });

      if (!zone) {
        let farm = await prisma.farm.findFirst({ orderBy: { createdAt: 'asc' } });
        if (!farm) {
          const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
          if (!user) {
            logger.warn('[Telemetry] Không tìm thấy User nào trong CSDL để tạo Farm');
            return { ingestedCount: 0, isDuplicate: false };
          }
          const randomCode = `FARM_${Date.now().toString(36).toUpperCase()}`;
          farm = await prisma.farm.create({
            data: {
              name: 'Nông Trại Thông Minh (Farm Home)',
              code: randomCode,
              ownerId: user.id,
              location: 'Đà Lạt, Lâm Đồng',
            },
          });
        }

        zone = await prisma.zone.create({
          data: {
            farmId: farm.id,
            name: 'Khu Vực 1 (Nhà Kính)',
            area: 1000,
          },
          select: { id: true, farmId: true },
        });
      }

      device = await prisma.device.create({
        data: {
          zoneId: zone.id,
          deviceCode: payload.deviceId,
          name: `Bộ Điều Khiển ${payload.deviceId}`,
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
          zone: { select: { id: true, farmId: true } },
        },
      });
      logger.info({ deviceId: device.id, deviceCode: device.deviceCode }, '✓ Đã tự động tạo thiết bị và cảm biến cho IoT');
    }

    const currentDevice = device!;

    // 2. Idempotency Check: check if messageId was already recorded
    const existing = await prisma.telemetry.findFirst({
      where: {
        deviceId: currentDevice.id,
        messageId: payload.messageId,
      },
    });

    if (existing) {
      logger.info({ messageId: payload.messageId }, 'Duplicate telemetry messageId detected, skipping');
      return {
        ingestedCount: 0,
        isDuplicate: true,
        farmId: currentDevice.zone.farmId,
        deviceId: currentDevice.id,
        deviceCode: currentDevice.deviceCode,
      };
    }

    const recordedAt = new Date(payload.timestamp ? Number(payload.timestamp) : Date.now());
    const farmId = currentDevice.zone.farmId;
    const zoneId = currentDevice.zone.id;

    // 3. Prepare sensor readings & evaluate alert rules
    const readings: any[] = [];
    const alertsToCreate: any[] = [];
    let count = 0;

    for (const [metric, rawVal] of Object.entries(payload.sensors)) {
      const val = Number(rawVal);
      if (isNaN(val)) continue;

      const sensor = currentDevice.sensors.find((s) => s.metricName === metric);

      readings.push({
        deviceId: currentDevice.id,
        sensorId: sensor?.id || null,
        messageId: payload.messageId,
        metric,
        value: val,
        unit: sensor?.unit || (metric.toLowerCase().includes('temp') ? '°C' : '%'),
        recordedAt,
        metadata: { battery: payload.battery },
      });

      // Alert Rule Evaluation
      const alertData = await alertEngine.evaluateReading({
        farmId,
        zoneId,
        deviceId: currentDevice.id,
        metric,
        value: val,
        recordedAt,
      });

      if (alertData) {
        alertsToCreate.push({ alertData, val, metric });
      }

      count++;
    }

    // 4. Commit all changes in 1 atomic Transaction with 20s timeout
    return prisma.$transaction(
      async (tx: any) => {
        // A. Insert Telemetry batch
        if (readings.length > 0) {
          await tx.telemetry.createMany({ data: readings });
        }

        // B. Insert Alerts & Outbox for alerts
        for (const item of alertsToCreate) {
          const alert = await tx.alert.create({ data: item.alertData });

          await tx.outboxEvent.create({
            data: {
              aggregateType: 'Alert',
              aggregateId: alert.id,
              eventType: 'ALERT_TRIGGERED',
              payload: {
                alertId: alert.id,
                farmId,
                zoneId,
                deviceId: currentDevice.id,
                severity: alert.severity,
                message: alert.message,
                value: item.val,
              },
              status: 'PENDING',
            },
          });
        }

        // C. Update Device status & lastSeenAt
        await tx.device.update({
          where: { id: currentDevice.id },
          data: {
            status: 'ONLINE',
            lastSeenAt: new Date(),
          },
        });

        // D. Outbox event for Telemetry ingested
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'Telemetry',
            aggregateId: payload.messageId,
            eventType: 'TELEMETRY_INGESTED',
            payload: {
              deviceId: currentDevice.id,
              deviceCode: currentDevice.deviceCode,
              farmId,
              zoneId,
              sensors: payload.sensors,
              recordedAt: recordedAt.toISOString(),
            },
            status: 'PENDING',
          },
        });

        return {
          ingestedCount: count,
          isDuplicate: false,
          farmId,
          deviceId: currentDevice.id,
          deviceCode: currentDevice.deviceCode,
        };
      },
      { maxWait: 10000, timeout: 20000 }
    );
  }

  public async getLatestByDevice(deviceIdOrCode: string) {
    const dev = await prisma.device.findFirst({
      where: {
        OR: [{ id: deviceIdOrCode }, { deviceCode: deviceIdOrCode }],
      },
      select: { id: true },
    });

    const targetDeviceId = dev ? dev.id : deviceIdOrCode;

    return prisma.telemetry.findMany({
      where: { deviceId: targetDeviceId },
      orderBy: { recordedAt: 'desc' },
      distinct: ['metric'],
    });
  }

  public async getHistory(filter: QueryTelemetryHistoryDto) {
    const whereClause: any = {};
    if (filter.deviceId) whereClause.deviceId = filter.deviceId;
    if (filter.metric) whereClause.metric = filter.metric;

    if (filter.from || filter.to) {
      whereClause.recordedAt = {};
      if (filter.from) whereClause.recordedAt.gte = new Date(filter.from);
      if (filter.to) whereClause.recordedAt.lte = new Date(filter.to);
    }

    return prisma.telemetry.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'desc' },
      take: filter.limit,
    });
  }
}
