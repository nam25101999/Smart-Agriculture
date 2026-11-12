import { prisma } from '../../../../infrastructure/database/prisma.client.js';
import { RegisterDeviceDto, UpdateDeviceDto, SendCommandDto } from '../../application/dtos/device.dto.js';
import crypto from 'crypto';

export class DeviceRepository {
  public async findByCode(deviceCode: string) {
    return prisma.device.findUnique({
      where: { deviceCode },
      include: {
        sensors: true,
        zone: { include: { farm: true } },
      },
    });
  }

  public async findById(id: string) {
    return prisma.device.findUnique({
      where: { id },
      include: {
        sensors: true,
        zone: { include: { farm: true } },
        commands: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  public async findByZone(zoneId: string) {
    return prisma.device.findMany({
      where: { zoneId },
      include: { sensors: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async register(dto: RegisterDeviceDto) {
    return prisma.$transaction(async (tx: any) => {
      // 1. Create Device
      const device = await tx.device.create({
        data: {
          zoneId: dto.zoneId,
          deviceCode: dto.deviceCode,
          name: dto.name,
          deviceType: dto.deviceType,
          firmwareVersion: dto.firmwareVersion,
          status: 'OFFLINE',
        },
      });

      // 2. Generate initial random device credential hash for MQTT
      const initialSecret = crypto.randomBytes(16).toString('hex');
      const credentialHash = crypto.createHash('sha256').update(initialSecret).digest('hex');

      await tx.deviceCredential.create({
        data: {
          deviceId: device.id,
          credentialHash,
          isActive: true,
        },
      });

      // 3. Register Sensors if provided
      if (dto.sensors && dto.sensors.length > 0) {
        await tx.sensor.createMany({
          data: dto.sensors.map((s) => ({
            deviceId: device.id,
            sensorType: s.sensorType,
            metricName: s.metricName,
            unit: s.unit,
            status: 'ACTIVE',
          })),
        });
      }

      return {
        ...device,
        initialMqttSecret: initialSecret,
      };
    });
  }

  public async update(id: string, dto: UpdateDeviceDto) {
    return prisma.device.update({
      where: { id },
      data: dto,
    });
  }

  public async createCommand(deviceId: string, userId: string, dto: SendCommandDto) {
    return prisma.$transaction(async (tx: any) => {
      // Create Device Command
      const command = await tx.deviceCommand.create({
        data: {
          deviceId,
          requestedBy: userId,
          commandType: dto.commandType,
          idempotencyKey: dto.idempotencyKey,
          status: 'ACCEPTED',
          payload: dto.payload,
        },
      });

      // Record initial command log
      await tx.deviceCommandLog.create({
        data: {
          commandId: command.id,
          eventType: 'COMMAND_ACCEPTED',
          message: 'Lệnh đã được tiếp nhận bởi máy chủ và đưa vào hàng đợi Outbox',
        },
      });

      // Enqueue to Outbox Event for async publishing
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'DeviceCommand',
          aggregateId: command.id,
          eventType: 'COMMAND_REQUESTED',
          payload: {
            commandId: command.id,
            deviceId,
            commandType: dto.commandType,
            payload: dto.payload,
          },
          status: 'PENDING',
        },
      });

      return command;
    });
  }

  public async updateCommandStatus(commandId: string, status: string, result?: any, message?: string) {
    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.deviceCommand.update({
        where: { id: commandId },
        data: {
          status,
          result: result || undefined,
        },
      });

      await tx.deviceCommandLog.create({
        data: {
          commandId,
          eventType: `COMMAND_${status}`,
          payload: result,
          message: message || `Trạng thái lệnh cập nhật thành ${status}`,
        },
      });

      return updated;
    });
  }
}

