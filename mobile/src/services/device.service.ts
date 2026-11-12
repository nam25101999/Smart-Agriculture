import { apiClient } from '../core/api/api-client';
import { Device, DeviceCommand } from '../types';

export const DeviceService = {
  async getDevices(params?: { farmId?: string; zoneId?: string; status?: string }): Promise<Device[]> {
    const res = await apiClient.get('/devices', { params });
    return res.data.data;
  },

  async getDeviceById(id: string): Promise<Device> {
    const res = await apiClient.get(`/devices/${id}`);
    return res.data.data;
  },

  async sendCommand(
    deviceId: string,
    commandType: string,
    payload: Record<string, unknown> = {}
  ): Promise<DeviceCommand> {
    const res = await apiClient.post(`/devices/${deviceId}/commands`, {
      commandType,
      payload,
    });
    return res.data.data;
  },

  async getCommands(deviceId: string, limit = 20): Promise<DeviceCommand[]> {
    const res = await apiClient.get(`/devices/${deviceId}/commands`, {
      params: { limit },
    });
    return res.data.data;
  },

  async updateDevice(
    deviceId: string,
    data: { name?: string; zoneId?: string; status?: string }
  ): Promise<Device> {
    const res = await apiClient.patch(`/devices/${deviceId}`, data);
    return res.data.data;
  },

  async getAvailableDevices(): Promise<any[]> {
    const res = await apiClient.get('/devices/available-to-pair');
    return res.data.data;
  },

  async pairDevice(data: { deviceCode: string; farmId: string; zoneId?: string }): Promise<Device> {
    const res = await apiClient.post('/devices/pair', data);
    return res.data.data;
  },

  // Hủy kết nối thiết bị khỏi vườn (giữ lại bản ghi trong DB)
  async unpairDevice(deviceId: string): Promise<Device> {
    const res = await apiClient.post(`/devices/${deviceId}/unpair`);
    return res.data.data;
  },

  // Xóa hoàn toàn thiết bị khỏi hệ thống
  async deleteDevice(deviceId: string): Promise<void> {
    await apiClient.delete(`/devices/${deviceId}`);
  },
};

