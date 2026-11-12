import { apiClient } from '../core/api/api-client';
import { TokenStorage } from '../core/storage/token-storage';
import { AuthResponse, User } from '../types';

export const AuthService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', { email, password });
    const raw = res.data.data;

    // Backend LoginUseCase trả về { tokens: { accessToken, refreshToken }, user: { id, email, fullName, roles } }
    const accessToken = raw.tokens?.accessToken || raw.accessToken;
    const refreshToken = raw.tokens?.refreshToken || raw.refreshToken;

    const user: User = {
      id: raw.user?.id || '',
      email: raw.user?.email || email,
      fullName: raw.user?.fullName || 'Người dùng',
      role: raw.user?.roles?.[0] || raw.user?.role || 'FARM_OWNER',
      isActive: true,
    };

    if (accessToken && refreshToken) {
      await TokenStorage.setTokens(accessToken, refreshToken);
    }

    return {
      user,
      accessToken,
      refreshToken,
    };
  },

  async register(payload: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
  }): Promise<{ user: User }> {
    const res = await apiClient.post('/auth/register', payload);
    return res.data.data;
  },

  async getProfile(): Promise<User> {
    const res = await apiClient.get('/auth/me');
    const raw = res.data.data;
    return {
      id: raw.id,
      email: raw.email,
      fullName: raw.fullName,
      phoneNumber: raw.phone,
      role: raw.roles?.[0] || 'FARM_OWNER',
      isActive: raw.status === 'ACTIVE',
    };
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', { oldPassword, newPassword });
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignored
    } finally {
      await TokenStorage.clearTokens();
    }
  },
};
