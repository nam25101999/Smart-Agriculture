import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../core/config/env';
import { TokenStorage } from '../core/storage/token-storage';

let socket: Socket | null = null;

export const SocketService = {
  async connect(): Promise<Socket> {
    if (socket && socket.connected) {
      return socket;
    }

    const token = await TokenStorage.getAccessToken();

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: {
        token: token ? `Bearer ${token}` : undefined,
      },
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to backend');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinFarm(farmId: string) {
    if (socket && socket.connected) {
      socket.emit('join:farm', { farmId });
      socket.emit('join:room', `farm:${farmId}`);
    }
  },

  leaveFarm(farmId: string) {
    if (socket && socket.connected) {
      socket.emit('leave:farm', { farmId });
    }
  },

  onTelemetry(callback: (data: any) => void) {
    if (!socket) return () => {};
    socket.on('telemetry:new', callback);
    return () => {
      socket?.off('telemetry:new', callback);
    };
  },

  onAlert(callback: (data: any) => void) {
    if (!socket) return () => {};
    socket.on('alert:new', callback);
    return () => {
      socket?.off('alert:new', callback);
    };
  },

  onDeviceStatus(callback: (data: any) => void) {
    if (!socket) return () => {};
    socket.on('device:status', callback);
    return () => {
      socket?.off('device:status', callback);
    };
  },
};

