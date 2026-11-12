import { z } from 'zod';

export const sensorItemSchema = z.object({
  sensorType: z.string().min(1, 'Loại cảm biến không được để trống'),
  metricName: z.string().min(1, 'Tên chỉ số không được để trống'),
  unit: z.string().min(1, 'Đơn vị đo không được để trống'),
});

export const registerDeviceSchema = z.object({
  zoneId: z.string().uuid('ID khu vực không hợp lệ'),
  deviceCode: z.string().min(3, 'Mã thiết bị phải từ 3 ký tự').toUpperCase(),
  name: z.string().min(2, 'Tên thiết bị phải từ 2 ký tự'),
  deviceType: z.string().default('ESP32'),
  firmwareVersion: z.string().default('1.0.0'),
  sensors: z.array(sensorItemSchema).optional(),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(2).optional(),
  zoneId: z.string().uuid().optional(),
  firmwareVersion: z.string().optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE']).optional(),
});

export const sendCommandSchema = z.object({
  commandType: z.enum(['PUMP_CONTROL', 'FAN_CONTROL', 'VALVE_CONTROL', 'CUSTOM']),
  payload: z.record(z.any()),
  idempotencyKey: z.string().optional(),
});

export type RegisterDeviceDto = z.infer<typeof registerDeviceSchema>;
export type UpdateDeviceDto = z.infer<typeof updateDeviceSchema>;
export type SendCommandDto = z.infer<typeof sendCommandSchema>;

