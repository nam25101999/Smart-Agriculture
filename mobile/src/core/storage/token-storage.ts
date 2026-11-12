import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'smartagri_access_token';
const REFRESH_TOKEN_KEY = 'smartagri_refresh_token';
const ONBOARDING_SEEN_KEY = 'smartagri_onboarding_seen';

// In-memory fallback for environments without SecureStore (like SSR or some web preview)
const memoryStorage = new Map<string, string>();

export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(ACCESS_TOKEN_KEY) || memoryStorage.get(ACCESS_TOKEN_KEY) || null;
      }
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return memoryStorage.get(ACCESS_TOKEN_KEY) || null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(REFRESH_TOKEN_KEY) || memoryStorage.get(REFRESH_TOKEN_KEY) || null;
      }
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return memoryStorage.get(REFRESH_TOKEN_KEY) || null;
    }
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch {
      // Fallback
      memoryStorage.set(ACCESS_TOKEN_KEY, accessToken);
      memoryStorage.set(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  async clearTokens(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    } catch {
      // Ignore
    } finally {
      memoryStorage.delete(ACCESS_TOKEN_KEY);
      memoryStorage.delete(REFRESH_TOKEN_KEY);
    }
  },

  async getOnboardingSeen(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
      }
      const val = await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY);
      return val === 'true';
    } catch {
      return memoryStorage.get(ONBOARDING_SEEN_KEY) === 'true';
    }
  },

  async setOnboardingSeen(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
      } else {
        await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, 'true');
      }
    } catch {
      memoryStorage.set(ONBOARDING_SEEN_KEY, 'true');
    }
  },
};

