import { apiClient } from '../core/api/api-client';
import { Farm, Zone } from '../types';

export const FarmService = {
  async getFarms(): Promise<Farm[]> {
    const res = await apiClient.get('/farms');
    return res.data.data;
  },

  async getFarmById(id: string): Promise<Farm> {
    const res = await apiClient.get(`/farms/${id}`);
    return res.data.data;
  },

  async createFarm(data: {
    name: string;
    code: string;
    address?: string;
    location?: string;
    description?: string;
    totalAreaM2?: number;
  }): Promise<Farm> {
    const payload = {
      name: data.name,
      code: data.code.toUpperCase(),
      location: data.location || data.address || undefined,
      description: data.description,
    };
    const res = await apiClient.post('/farms', payload);
    return res.data.data;
  },

  async getZones(farmId: string): Promise<Zone[]> {
    const res = await apiClient.get(`/farms/${farmId}/zones`);
    return res.data.data;
  },

  async createZone(
    farmId: string,
    data: {
      name: string;
      code: string;
      zoneType: string;
      areaM2?: number;
      description?: string;
    }
  ): Promise<Zone> {
    const res = await apiClient.post(`/farms/${farmId}/zones`, data);
    return res.data.data;
  },
};

