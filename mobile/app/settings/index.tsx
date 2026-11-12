import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Appbar, List, Switch, Divider, Button, TextInput, Portal, Dialog, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../../src/core/theme';
import { ENV } from '../../src/core/config/env';
import { NotificationService } from '../../src/services/notification.service';

export default function SettingsScreen() {
  const router = useRouter();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [criticalSound, setCriticalSound] = useState(true);
  const [autoRefreshTelemetry, setAutoRefreshTelemetry] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);

  const [serverDialogVisible, setServerDialogVisible] = useState(false);
  const [serverUrl, setServerUrl] = useState(ENV.API_BASE_URL);

  const handleSaveServer = () => {
    setServerDialogVisible(false);
    Alert.alert('Thành công', 'Đã lưu cấu hình địa chỉ máy chủ kết nối mới.');
  };

  const handleSendTestPushImmediate = async () => {
    try {
      setIsSendingTestPush(true);
      // 1. Bung Banner thông báo trực tiếp trên máy
      await NotificationService.showLocalNotification(
        '⚠️ CẢNH BÁO NÔNG TRẠI (NGAY LẬP TỨC)',
        `Nhiệt độ Zone 1 tăng cao đột biến (39.5°C) lúc ${new Date().toLocaleTimeString()}! Cần kiểm tra hệ thống làm mát.`,
        { alertId: 'test-immediate' }
      );

      // 2. Đồng thời báo Server gửi thông báo đẩy
      try {
        await NotificationService.sendTestPush(0);
      } catch (errServer) {
        console.log('[Settings] Server push:', errServer);
      }

      Alert.alert('Thành công', 'Đã phát chuông và hiển thị Banner thông báo ngay trên màn hình!');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể gửi thông báo thử nghiệm');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  const handleSendTestPushDelayed = async () => {
    try {
      setIsSendingTestPush(true);

      // 1. Lên lịch thông báo hệ thống cấp Android OS (AlarmManager)
      // Chạy chuẩn xác kể cả khi: Tắt app, Ẩn background, Khóa màn hình
      await NotificationService.scheduleDelayedNotification(
        '⚠️ CẢNH BÁO NÔNG TRẠI (KHI TẮT APP)',
        `Độ ẩm đất Zone 1 giảm còn 28% (ngưỡng tối thiểu 50%). Máy bơm PUMP_01 đã tự động kích hoạt! [${new Date().toLocaleTimeString()}]`,
        5,
        { alertId: 'test-alert-bg', zoneId: 'ZONE_01' }
      );

      // 2. Gửi lệnh đến Server hẹn giờ push
      try {
        await NotificationService.sendTestPush(5);
      } catch (errServer) {
        console.log('[Settings] Server delayed push:', errServer);
      }

      Alert.alert(
        '🚀 Đã hẹn giờ thông báo (sau 5 giây)',
        'Hệ điều hành điện thoại đã nhận lệnh hẹn giờ chuông báo.\n\n👉 BÂY GIỜ BẠN HÃY:\n1. Bấm nút HOME để ẩn app ra ngoài màn hình chính, HOẶC\n2. Vuốt tắt hẳn ứng dụng này (Tắt app)\n3. Bạn cũng có thể bấm nút nguồn khóa màn hình\n\n⏱️ Đúng 5 giây sau điện thoại sẽ tự động RUNG, ĐỔ CHUÔNG và BUNG BANNER thông báo!',
        [{ text: 'Thử Ngay' }]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể lên lịch thông báo');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  const handleBroadcastPush = async () => {
    try {
      setIsSendingTestPush(true);
      const res = await NotificationService.broadcastPush();
      Alert.alert('Thành công', res?.message || 'Đã phát sóng thông báo đẩy đến toàn bộ người dùng trong hệ thống!');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể gửi broadcast');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  const handleTriggerTestAlert = async () => {
    try {
      setIsSendingTestPush(true);
      await NotificationService.showLocalNotification(
        '🚨 CẢNH BÁO KHẨN CẤP: NHIỆT ĐỘ VƯỢT NGƯỠNG (42.5°C)',
        'Khu vực Zone 1 nhiệt độ quá cao! Đã gửi tín hiệu kích hoạt quạt và vòi phun sương.',
        { alertId: 'test-crit-alert' }
      );
      const res = await NotificationService.triggerTestAlert('temperature', 42.5);
      Alert.alert('Cảnh Báo Đã Kích Hoạt', res?.message || 'Đã tạo cảnh báo khẩn cấp và gửi push notification đến thiết bị!');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể kích hoạt cảnh báo');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title="Cài Đặt Hệ Thống" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Notification Settings */}
        <Surface style={styles.card} elevation={1}>
          <List.Section>
            <List.Subheader style={styles.subHeader}>Thông Báo & Cảnh Báo Push Notification</List.Subheader>

            <List.Item
              title="Thông báo đẩy 24/7"
              description="Nhận thông báo kể cả khi mở app, chạy background hay tắt app"
              left={(props) => <List.Icon {...props} icon="bell-ring" color={AppColors.primary} />}
              right={() => (
                <Switch value={pushEnabled} onValueChange={setPushEnabled} color={AppColors.primary} />
              )}
            />

            <Divider />

            <List.Item
              title="Cảnh báo âm thanh khẩn cấp"
              description="Phát âm thanh cảnh báo lớn cho sự cố CRITICAL"
              left={(props) => <List.Icon {...props} icon="volume-high" color={AppColors.error} />}
              right={() => (
                <Switch value={criticalSound} onValueChange={setCriticalSound} color={AppColors.error} />
              )}
            />

            <Divider />

            {/* Test Push Section */}
            <View style={styles.testPushContainer}>
              <Text variant="titleSmall" style={{ fontWeight: '700', marginBottom: 6, color: AppColors.text }}>
                🧪 Thử nghiệm Push Notification từ Server
              </Text>
              <Text variant="bodySmall" style={{ color: AppColors.textSecondary, marginBottom: 12 }}>
                Kiểm tra khả năng nhận thông báo của điện thoại theo 3 trạng thái:
              </Text>

              <View style={styles.testButtonsRow}>
                <Button
                  mode="outlined"
                  icon="bell"
                  textColor={AppColors.primary}
                  style={styles.testButton}
                  loading={isSendingTestPush}
                  disabled={isSendingTestPush}
                  onPress={handleSendTestPushImmediate}
                >
                  Khi Mở App (Ngay)
                </Button>

                <Button
                  mode="contained"
                  icon="timer-sand"
                  buttonColor={AppColors.primary}
                  style={styles.testButton}
                  loading={isSendingTestPush}
                  disabled={isSendingTestPush}
                  onPress={handleSendTestPushDelayed}
                >
                  Khi Tắt/Ẩn App (Sau 5s)
                </Button>
              </View>

              <View style={[styles.testButtonsRow, { marginTop: 10 }]}>
                <Button
                  mode="outlined"
                  icon="bullhorn-outline"
                  textColor="#1565C0"
                  style={[styles.testButton, { borderColor: '#1565C0' }]}
                  loading={isSendingTestPush}
                  disabled={isSendingTestPush}
                  onPress={handleBroadcastPush}
                >
                  Phát Sóng Toàn Hệ Thống
                </Button>

                <Button
                  mode="contained"
                  icon="alert-octagon"
                  buttonColor={AppColors.error}
                  style={styles.testButton}
                  loading={isSendingTestPush}
                  disabled={isSendingTestPush}
                  onPress={handleTriggerTestAlert}
                >
                  Gửi Cảnh Báo Khẩn Cấp
                </Button>
              </View>
            </View>
          </List.Section>
        </Surface>

        {/* Telemetry Settings */}
        <Surface style={styles.card} elevation={1}>
          <List.Section>
            <List.Subheader style={styles.subHeader}>Dữ Liệu & Realtime</List.Subheader>

            <List.Item
              title="Cập nhật cảm biến Realtime"
              description="Tự động nhận số liệu ESP32 qua WebSocket"
              left={(props) => <List.Icon {...props} icon="broadcast" color={AppColors.info} />}
              right={() => (
                <Switch
                  value={autoRefreshTelemetry}
                  onValueChange={setAutoRefreshTelemetry}
                  color={AppColors.primary}
                />
              )}
            />

            <Divider />

            <List.Item
              title="Cấu hình Backend Server"
              description={serverUrl}
              left={(props) => <List.Icon {...props} icon="server-network" color={AppColors.primary} />}
              right={(props) => <List.Icon {...props} icon="pencil-outline" />}
              onPress={() => setServerDialogVisible(true)}
            />
          </List.Section>
        </Surface>

        {/* Display & Language */}
        <Surface style={styles.card} elevation={1}>
          <List.Section>
            <List.Subheader style={styles.subHeader}>Giao Diện & Ngôn Ngữ</List.Subheader>

            <List.Item
              title="Ngôn ngữ hiển thị"
              description="Tiếng Việt (Mặc định)"
              left={(props) => <List.Icon {...props} icon="translate" color={AppColors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Thông báo', 'Hệ thống đang hoạt động với gói ngôn ngữ Tiếng Việt chuẩn nông nghiệp.')}
            />

            <Divider />

            <List.Item
              title="Chế độ tối (Dark Mode)"
              description="Giảm chói khi sử dụng ứng dụng vào ban đêm"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" color={AppColors.textSecondary} />}
              right={() => (
                <Switch value={darkMode} onValueChange={setDarkMode} color={AppColors.primary} />
              )}
            />
          </List.Section>
        </Surface>

        {/* About App */}
        <Surface style={styles.card} elevation={1}>
          <List.Section>
            <List.Subheader style={styles.subHeader}>Về Ứng Dụng</List.Subheader>

            <List.Item
              title="Phiên bản"
              description={`Farm Home Mobile v${ENV.VERSION} (Expo SDK 58)`}
              left={(props) => <List.Icon {...props} icon="information" color={AppColors.primary} />}
            />

            <Divider />

            <List.Item
              title="Kiến trúc ứng dụng"
              description="React Native Clean Architecture + Transactional Outbox"
              left={(props) => <List.Icon {...props} icon="layers-outline" color={AppColors.primary} />}
            />
          </List.Section>
        </Surface>
      </ScrollView>

      {/* Dialog đổi URL Server */}
      <Portal>
        <Dialog visible={serverDialogVisible} onDismiss={() => setServerDialogVisible(false)}>
          <Dialog.Title>Cấu Hình Kết Nối Máy Chủ API</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Địa chỉ API URL"
              value={serverUrl}
              onChangeText={setServerUrl}
              mode="outlined"
              placeholder="http://192.168.1.xxx:5001/api/v1"
              style={{ marginBottom: 8 }}
            />
            <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>
              Nhập IP máy chủ Node.js Express Backend trên mạng LAN của trang trại.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setServerDialogVisible(false)}>Hủy</Button>
            <Button mode="contained" buttonColor={AppColors.primary} onPress={handleSaveServer}>
              Lưu cấu hình
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.primary,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    marginBottom: 16,
  },
  subHeader: {
    fontWeight: '700',
    color: AppColors.primary,
  },
  testPushContainer: {
    padding: 16,
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    margin: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  testButtonsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  testButton: {
    borderRadius: 8,
  },
});

