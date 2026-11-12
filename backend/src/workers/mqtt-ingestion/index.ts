import { mqttService } from '../../infrastructure/mqtt/mqtt.client.js';
import { TelemetryRepository } from '../../modules/telemetry/infrastructure/repositories/telemetry.repository.js';
import { DeviceRepository } from '../../modules/devices/infrastructure/repositories/device.repository.js';
import { mqttTelemetryPayloadSchema } from '../../modules/telemetry/application/dtos/telemetry.dto.js';
import { logger } from '../../shared/logger/index.js';
import { prisma } from '../../infrastructure/database/prisma.client.js';
import { broadcastTelemetry, broadcastDeviceStatus } from '../../infrastructure/websocket/socket.server.js';

const telemetryRepository = new TelemetryRepository();
const deviceRepository = new DeviceRepository();

export const startMqttIngestionWorker = async (): Promise<void> => {
  logger.info('🚀 Starting MQTT Ingestion Worker...');

  const client = mqttService.connect();

  client.on('connect', async () => {
    logger.info('📡 MQTT Ingestion Worker connected to Broker. Subscribing to topics...');

    await mqttService.subscribe('smartagri/devices/+/telemetry', 1);
    await mqttService.subscribe('smartagri/devices/+/ack', 1);
    await mqttService.subscribe('smartagri/devices/+/status', 1);
  });

  client.on('message', async (topic, buffer) => {
    const rawMessage = buffer.toString('utf-8');
    logger.debug({ topic, rawMessage }, 'MQTT Message Received');

    try {
      const parts = topic.split('/');
      // Expected topic format: smartagri/devices/{deviceCode}/{action}
      if (parts.length < 4 || parts[0] !== 'smartagri' || parts[1] !== 'devices') {
        return;
      }

      const deviceCode = parts[2];
      const action = parts[3];

      // 1. Handle Telemetry Ingestion
      if (action === 'telemetry') {
        const json = JSON.parse(rawMessage);
        const parsed = mqttTelemetryPayloadSchema.safeParse(json);

        if (!parsed.success) {
          logger.warn({ errors: parsed.error.format(), rawMessage }, 'Invalid Telemetry Payload schema');
          return;
        }

        const result = await telemetryRepository.ingestPayload(parsed.data);
        logger.info(
          { deviceCode, messageId: parsed.data.messageId, ingestedCount: result.ingestedCount, isDuplicate: result.isDuplicate },
          'Telemetry Ingestion Processed'
        );

        // Broadcast realtime dữ liệu cảm biến mới tới Mobile App qua WebSocket
        broadcastTelemetry(result.farmId || null, {
          deviceId: result.deviceId,
          deviceCode,
          farmId: result.farmId,
          metrics: parsed.data.sensors,
          battery: parsed.data.battery,
          timestamp: new Date().toISOString(),
        });

        // Broadcast trạng thái thiết bị ONLINE
        broadcastDeviceStatus(result.farmId || null, deviceCode, 'ONLINE');
      }

      // 2. Handle Command ACK from ESP32 / Wokwi
      else if (action === 'ack') {
        const json = JSON.parse(rawMessage);
        const commandId = json.commandId;
        const status = json.status || 'ACKNOWLEDGED';
        const note = json.note || 'Acknowledged by device';

        if (commandId) {
          await deviceRepository.updateCommandStatus(commandId, status, json, note);
          logger.info({ deviceCode, commandId, status }, '✓ Device Command ACK Updated');
        }
      }

      // 3. Handle Status Updates (Online / Offline / LWT)
      else if (action === 'status') {
        const json = JSON.parse(rawMessage);
        const status = json.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE';

        await prisma.device.updateMany({
          where: { deviceCode },
          data: {
            status,
            lastSeenAt: new Date(),
          },
        });
        logger.info({ deviceCode, status }, 'Device Status Updated');

        broadcastDeviceStatus(null, deviceCode, status);
      }
    } catch (err) {
      logger.error({ err, topic, rawMessage }, 'Error processing MQTT message');
    }
  });
};

// If run directly as a standalone process
if (process.argv[1]?.includes('mqtt-ingestion')) {
  startMqttIngestionWorker().catch((err) => {
    logger.error(err, 'MQTT Ingestion Worker failed to start');
    process.exit(1);
  });
}

