import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AppTheme } from '../src/core/theme';
import { useAuthStore } from '../src/store/auth-store';
import { NotificationService } from '../src/services/notification.service';
import { SocketService } from '../src/services/socket.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30, // 30s
    },
  },
});

function RootNavigation() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Đăng ký Push Notification và lắng nghe sự kiện
  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Xin quyền và gửi Push Token lên Backend
    NotificationService.registerForPushNotificationsAsync();

    // 2. Lắng nghe khi nhận thông báo hoặc nhấn vào thông báo (Background / Foreground)
    const unsubscribe = NotificationService.addNotificationListeners(
      (notification) => {
        // Foreground: làm mới danh sách cảnh báo
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      },
      (response) => {
        // Nhấn vào thông báo -> Điều hướng sang tab Cảnh báo
        const data = response.notification.request.content.data;
        if (data?.alertId) {
          router.push({ pathname: '/alerts/[id]', params: { id: data.alertId as string } });
        } else {
          router.push('/(tabs)/alerts');
        }
      }
    );

    // 3. Lắng nghe sự kiện Cảnh báo Realtime từ Socket.IO để bung Banner Thông Báo tức thì
    const unsubSocketAlert = SocketService.onAlert((alertData: any) => {
      console.log('[App] Nhận cảnh báo Socket.IO:', alertData);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });

      const title = alertData.title || `🚨 CẢNH BÁO NÔNG TRẠI (${alertData.severity || 'SỰ CỐ'})`;
      const body = alertData.message || 'Chỉ số môi trường vượt ngưỡng cho phép, hãy kiểm tra ngay!';

      NotificationService.showLocalNotification(title, body, {
        alertId: alertData.id,
        screen: `/alerts/${alertData.id}`,
      });
    });

    // 4. Kiểm tra nếu app được bật lên từ thông báo khi tắt app (Cold Start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        if (data?.alertId) {
          router.push({ pathname: '/alerts/[id]', params: { id: data.alertId as string } });
        } else {
          router.push('/(tabs)/alerts');
        }
      }
    });

    return () => {
      unsubscribe();
      unsubSocketAlert();
    };
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string | undefined;

    // Nếu đang ở Splash (index) hoặc Onboarding -> Để màn hình tự chuyển tiếp
    if (!firstSegment || firstSegment === 'index' || firstSegment === 'onboarding' || firstSegment === 'splash') {
      return;
    }

    const inAuthGroup = firstSegment === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={AppTheme}>
        <StatusBar style="light" />
        <RootNavigation />
      </PaperProvider>
    </QueryClientProvider>
  );
}
