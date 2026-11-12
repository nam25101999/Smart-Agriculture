import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getDevHostIp = (): string => {
  // 1. Thử lấy từ Expo hostUri
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  // 2. Thử lấy từ manifest2 debuggerHost (Expo Go)
  const manifest = (Constants as any).manifest2 || (Constants as any).manifest;
  const debuggerHost = manifest?.extra?.expoGo?.debuggerHost || manifest?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  // 3. Nếu là Android Emulator
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  // 4. Với thiết bị thật iOS / Android kết nối qua WiFi chung
  // IP Wi-Fi máy tính hiện tại: 192.168.1.7
  return '192.168.1.7';
};

export const DEV_HOST = getDevHostIp();
export const API_BASE_URL = `http://${DEV_HOST}:5000/api/v1`;
export const SOCKET_URL = `http://${DEV_HOST}:5000`;

export const ENV = {
  API_BASE_URL,
  SOCKET_URL,
  DEV_HOST,
  APP_NAME: 'Farm Home',
  VERSION: '1.0.0',
};
