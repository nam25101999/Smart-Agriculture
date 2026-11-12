import { apiClient } from '../core/api/api-client';
import { Alert, AlertRule } from '../types';

export const AlertService = {
  async getAlerts(params?: {
    farmId?: string;
    deviceId?: string;
    status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    limit?: number;
  }): Promise<Alert[]> {
    const res = await apiClient.get('/alerts', { params });
    return res.data.data;
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    const res = await apiClient.post(`/alerts/${id}/acknowledge`);
    return res.data.data;
  },

  async resolveAlert(id: string, notes?: string): Promise<Alert> {
    const res = await apiClient.post(`/alerts/${id}/resolve`, { notes });
    return res.data.data;
  },

  async getRules(farmId: string): Promise<AlertRule[]> {
    const res = await apiClient.get(`/alerts/rules/${farmId}`);
    return res.data.data;
  },
};

