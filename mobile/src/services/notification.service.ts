import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../core/api/api-client';

// Cấu hình hiển thị thông báo khi app đang mở (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let cachedExpoPushToken: string | null = null;

export const NotificationService = {
  /**
   * Lấy token đã lưu trong bộ nhớ tạm
   */
  getCachedToken(): string | null {
    return cachedExpoPushToken;
  },

  /**
   * Đăng ký quyền và lấy Push Token gửi lên Backend
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('farm-alerts', {
        name: 'Cảnh Báo Nông Trại',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E7D32',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notification] Không được cấp quyền gửi thông báo');
      return null;
    }

    try {
      // 1. Lấy token Expo Push
      let pushTokenData = null;
      try {
        pushTokenData = await Notifications.getExpoPushTokenAsync();
      } catch (err1: any) {
        console.log('[Notification] Thử lấy token với cấu hình phụ...', err1?.message);
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (projectId && projectId !== '8b74c8de-1577-4c07-b28e-5b1234f9a001') {
          pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        }
      }

      if (pushTokenData?.data) {
        token = pushTokenData.data;
      } else {
        // 2. Thử lấy device token
        try {
          const devToken = await Notifications.getDevicePushTokenAsync();
          if (devToken?.data) {
            token = typeof devToken.data === 'string' ? devToken.data : JSON.stringify(devToken.data);
          }
        } catch (eDev) {
          console.warn('[Notification] Không lấy được device token');
        }
      }

      if (token) {
        cachedExpoPushToken = token;
        console.log('[Notification] Push Token thành công:', token);

        // Gửi token lên Backend để lưu trữ vào bảng device_tokens
        await apiClient.post('/notifications/device-tokens', {
          token,
          platform: Platform.OS.toUpperCase(),
        });
        console.log('[Notification] Đã đồng bộ device token lên Backend');
      }
    } catch (error: any) {
      console.warn('[Notification] Lỗi lấy hoặc gửi push token:', error?.message);
    }

    return token;
  },

  /**
   * Hiển thị thông báo tức thời trên màn hình điện thoại (Local Notification Banner)
   */
  async showLocalNotification(
    title: string,
    body: string,
    data: Record<string, any> = {}
  ): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('farm-alerts', {
          name: 'Cảnh Báo Nông Trại',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2E7D32',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          color: '#2E7D32',
        },
        trigger: Platform.OS === 'android' ? { channelId: 'farm-alerts' } : null,
      });
      console.log('[Notification] Đã hiển thị Local Notification Banner thành công');
    } catch (err: any) {
      console.warn('[Notification] Lỗi hiển thị local notification:', err?.message);
    }
  },

  /**
   * Lên lịch thông báo cấp Hệ điều hành (Android OS AlarmManager / iOS)
   * VẪN ĐỔ CHUÔNG VÀ BUNG BANNER KỂ CẢ KHI:
   * - Bấm Home ẩn app ra ngoài (Background)
   * - Vuốt tắt hẳn ứng dụng (Killed / App đã đóng)
   * - Điện thoại đang khóa màn hình
   */
  async scheduleDelayedNotification(
    title: string,
    body: string,
    delaySeconds: number = 5,
    data: Record<string, any> = {}
  ): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('farm-alerts', {
          name: 'Cảnh Báo Nông Trại',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2E7D32',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          color: '#2E7D32',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, delaySeconds),
          repeats: false,
          ...(Platform.OS === 'android' ? { channelId: 'farm-alerts' } : {}),
        },
      });
      console.log(`[Notification] Đã lên lịch thông báo sau ${delaySeconds}s cấp Hệ điều hành (ID: ${id})`);
      return id;
    } catch (err: any) {
      console.warn('[Notification] Lỗi lên lịch thông báo hệ điều hành:', err?.message);
      return null;
    }
  },

  /**
   * Gửi yêu cầu Backend phát thông báo đẩy thử nghiệm
   * @param delaySeconds Số giây trì hoãn trên Server (để người dùng kịp thoát/tắt app)
   */
  async sendTestPush(delaySeconds: number = 0): Promise<void> {
    await apiClient.post('/notifications/test-push', {
      title: '⚠️ CẢNH BÁO NÔNG TRẠI',
      body: `Độ ẩm Zone 1 giảm còn 32% (ngưỡng tối thiểu 50%). Cần kích hoạt máy bơm tưới ngay! [${new Date().toLocaleTimeString()}]`,
      delaySeconds,
    });
  },

  /**
   * Gửi thông báo đẩy đến TOÀN BỘ người dùng trong hệ thống
   */
  async broadcastPush(title?: string, body?: string): Promise<any> {
    const res = await apiClient.post('/notifications/broadcast', {
      title: title || '📢 THÔNG BÁO TẤT CẢ NGƯỜI DÙNG',
      body: body || `Hệ thống Smart Agriculture đang gửi thông báo chung đến mọi thành viên lúc ${new Date().toLocaleTimeString()}.`,
    });
    return res.data;
  },

  /**
   * Kích hoạt một Cảnh báo sự cố thử nghiệm từ Server để test toàn bộ luồng Alert -> Push -> App
   */
  async triggerTestAlert(metric: string = 'temperature', value: number = 42.0): Promise<any> {
    const res = await apiClient.post('/alerts/test-alert', {
      metric,
      value,
      severity: 'CRITICAL',
      message: `🚨 CẢNH BÁO NGUY HIỂM: ${metric} đo được ${value}°C vượt ngưỡng an toàn! Cần xử lý ngay!`,
    });
    return res.data;
  },

  /**
   * Đăng ký listener xử lý khi nhận thông báo và khi nhấn vào thông báo
   */
  addNotificationListeners(
    onReceiveNotification?: (notification: Notifications.Notification) => void,
    onResponseReceived?: (response: Notifications.NotificationResponse) => void
  ) {
    // 1. Nhận thông báo khi đang mở app (Foreground)
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notification] Đã nhận thông báo (Foreground):', notification.request.content.title);
      onReceiveNotification?.(notification);
    });

    // 2. Người dùng nhấn vào thông báo (từ Background hoặc khi Tắt App)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Notification] Người dùng bấm vào thông báo:', response.notification.request.content.data);
      onResponseReceived?.(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  },
};
