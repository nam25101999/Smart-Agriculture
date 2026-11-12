import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../../shared/logger/index.js';

let ioInstance: SocketIOServer | null = null;

export const setSocketIO = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getSocketIO = (): SocketIOServer | null => {
  return ioInstance;
};

export const broadcastTelemetry = (farmId: string | null, data: any): void => {
  if (!ioInstance) return;
  try {
    // Broadcast tới tất cả client và tới room farm cụ thể
    ioInstance.emit('telemetry:new', data);
    if (farmId) {
      ioInstance.to(`farm:${farmId}`).emit('telemetry:new', data);
    }
    logger.debug({ farmId, metrics: data.metrics }, '[WebSocket] Đã broadcast telemetry:new');
  } catch (err: any) {
    logger.error({ err: err?.message }, '[WebSocket] Lỗi broadcast telemetry');
  }
};

export const broadcastDeviceStatus = (farmId: string | null, deviceCode: string, status: string): void => {
  if (!ioInstance) return;
  try {
    const payload = { deviceCode, status, timestamp: new Date().toISOString() };
    ioInstance.emit('device:status', payload);
    if (farmId) {
      ioInstance.to(`farm:${farmId}`).emit('device:status', payload);
    }
    logger.debug({ deviceCode, status }, '[WebSocket] Đã broadcast device:status');
  } catch (err: any) {
    logger.error({ err: err?.message }, '[WebSocket] Lỗi broadcast device:status');
  }
};

export const broadcastAlert = (farmId: string | null, alertData: any): void => {
  if (!ioInstance) return;
  try {
    ioInstance.emit('alert:new', alertData);
    if (farmId) {
      ioInstance.to(`farm:${farmId}`).emit('alert:new', alertData);
    }
    logger.debug({ farmId, alertId: alertData.id }, '[WebSocket] Đã broadcast alert:new');
  } catch (err: any) {
    logger.error({ err: err?.message }, '[WebSocket] Lỗi broadcast alert:new');
  }
};

