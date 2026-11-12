import { apiClient } from '../core/api/api-client';
import { TelemetryReading } from '../types';

export const TelemetryService = {
  async getLatestByDevice(deviceId: string): Promise<TelemetryReading[]> {
    const res = await apiClient.get(`/telemetry/latest/${deviceId}`);
    return res.data.data;
  },

  async getHistory(params: {
    deviceId?: string;
    sensorId?: string;
    metric?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<TelemetryReading[]> {
    const res = await apiClient.get('/telemetry/history', { params });
    return res.data.data;
  },

  async getAggregates(params: {
    sensorId: string;
    interval?: '1h' | '1d' | '1w';
  }): Promise<any[]> {
    const res = await apiClient.get('/telemetry/aggregates', { params });
    return res.data.data;
  },
};

