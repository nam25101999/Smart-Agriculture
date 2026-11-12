import { z } from 'zod';

export const createFarmSchema = z.object({
  name: z.string().min(2, 'Tên nông trại phải từ 2 ký tự'),
  code: z.string().min(2, 'Mã nông trại phải từ 2 ký tự').toUpperCase(),
  description: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateFarmSchema = createFarmSchema.partial();

export const createZoneSchema = z.object({
  name: z.string().min(2, 'Tên khu vực phải từ 2 ký tự'),
  description: z.string().optional(),
  area: z.number().positive('Diện tích phải là số dương').optional(),
});

export const updateZoneSchema = createZoneSchema.partial();

export const addFarmMemberSchema = z.object({
  userId: z.string().uuid('ID người dùng không hợp lệ'),
  roleCode: z.enum(['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER']),
});

export type CreateFarmDto = z.infer<typeof createFarmSchema>;
export type UpdateFarmDto = z.infer<typeof updateFarmSchema>;
export type CreateZoneDto = z.infer<typeof createZoneSchema>;
export type UpdateZoneDto = z.infer<typeof updateZoneSchema>;
export type AddFarmMemberDto = z.infer<typeof addFarmMemberSchema>;

