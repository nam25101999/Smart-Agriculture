import { z } from 'zod';

export const mqttTelemetryPayloadSchema = z.object({
  deviceId: z.string().min(1, 'deviceId không được để trống'),
  messageId: z.string().min(1, 'messageId không được để trống'),
  timestamp: z.union([z.number(), z.string()]),
  sensors: z.record(z.union([z.number(), z.string()])).refine((obj) => Object.keys(obj).length > 0, {
    message: 'Payload phải chứa ít nhất 1 giá trị cảm biến',
  }),
  battery: z.number().optional(),
});

export const queryTelemetryHistorySchema = z.object({
  deviceId: z.string().uuid().optional(),
  metric: z.string().optional(),
  from: z.string().datetime({ message: 'Thời gian bắt đầu (from) phải chuẩn ISO 8601' }).optional(),
  to: z.string().datetime({ message: 'Thời gian kết thúc (to) phải chuẩn ISO 8601' }).optional(),
  limit: z.string().default('100').transform((v) => parseInt(v, 10)),
});

export type MqttTelemetryPayload = z.infer<typeof mqttTelemetryPayloadSchema>;
export type QueryTelemetryHistoryDto = z.infer<typeof queryTelemetryHistorySchema>;

