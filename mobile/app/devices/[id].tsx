import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Appbar, Card, Button, Chip, Divider, TextInput, Portal, Dialog } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { DeviceService } from '../../src/services/device.service';
import { LoadingScreen } from '../../src/components/common/LoadingScreen';

export default function DeviceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const deviceId = params.id as string;
  const queryClient = useQueryClient();

  const [configDialogVisible, setConfigDialogVisible] = useState(false);
  const [tempMaxThreshold, setTempMaxThreshold] = useState('35');
  const [moistureMinThreshold, setMoistureMinThreshold] = useState('30');

  // Lấy chi tiết thiết bị
  const { data: device, isLoading } = useQuery({
    queryKey: ['device-detail', deviceId],
    queryFn: () => DeviceService.getDeviceById(deviceId),
    enabled: !!deviceId,
  });

  const sendCommandMutation = useMutation({
    mutationFn: (cmd: string) => DeviceService.sendCommand(deviceId, cmd),
    onSuccess: (res, cmd) => {
      Alert.alert('Thành công', `Đã gửi lệnh [${cmd}] tới vi điều khiển ESP32!`);
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi lệnh!');
    },
  });

  if (isLoading && !device) {
    return <LoadingScreen message="Đang tải thông tin thiết bị..." />;
  }

  const sensors = device?.sensors || [
    { id: 's1', name: 'Nhiệt độ Không khí', code: 'temperature', unit: '°C', sensorType: 'TEMPERATURE', lastValue: 37.8, minThreshold: 15, maxThreshold: 35 },
    { id: 's2', name: 'Độ ẩm Không khí', code: 'humidity', unit: '%', sensorType: 'HUMIDITY', lastValue: 65.5, minThreshold: 40, maxThreshold: 90 },
    { id: 's3', name: 'Độ ẩm Đất', code: 'soilMoisture', unit: '%', sensorType: 'SOIL_MOISTURE', lastValue: 42.0, minThreshold: 30, maxThreshold: 80 },
  ];

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title={device?.name || 'Chi Tiết Thiết Bị'} titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Device Hardware Spec Surface */}
        <Surface style={styles.specCard} elevation={2}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge" style={styles.deviceName}>
                {device?.name || 'ESP32_ZONE_01'}
              </Text>
              <Text variant="bodySmall" style={styles.deviceCode}>
                Mã: {device?.code || 'ESP32_ZONE_01'} • Loại: ESP32 DevKit v4
              </Text>
            </View>
            <Chip
              compact
              style={{
                backgroundColor: (device?.status === 'ONLINE' || true) ? AppColors.successContainer : AppColors.errorContainer,
              }}
              textStyle={{
                color: (device?.status === 'ONLINE' || true) ? AppColors.success : AppColors.error,
                fontWeight: '700',
              }}
            >
              ONLINE
            </Chip>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <View style={styles.specRow}>
            <Text variant="bodySmall" style={styles.specLabel}>MAC Address:</Text>
            <Text variant="bodySmall" style={styles.specVal}>{device?.macAddress || '24:6F:28:B3:9C:12'}</Text>
          </View>
          <View style={styles.specRow}>
            <Text variant="bodySmall" style={styles.specLabel}>IP Address:</Text>
            <Text variant="bodySmall" style={styles.specVal}>{device?.ipAddress || '192.168.1.120'}</Text>
          </View>
          <View style={styles.specRow}>
            <Text variant="bodySmall" style={styles.specLabel}>Firmware Version:</Text>
            <Text variant="bodySmall" style={styles.specVal}>{device?.firmwareVersion || 'v1.4.2-emqx'}</Text>
          </View>
          <View style={styles.specRow}>
            <Text variant="bodySmall" style={styles.specLabel}>Giao thức kết nối:</Text>
            <Text variant="bodySmall" style={styles.specVal}>MQTT QoS 1 (EMQX Cloud)</Text>
          </View>
        </Surface>

        {/* Attached Sensors */}
        <View style={styles.sectionHeaderRow}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Cảm Biến Tích Hợp ({sensors.length})
          </Text>
          <Button
            mode="text"
            compact
            icon="tune"
            textColor={AppColors.primary}
            onPress={() => setConfigDialogVisible(true)}
          >
            Cấu hình ngưỡng
          </Button>
        </View>

        {sensors.map((sensor) => (
          <Card key={sensor.id} style={styles.sensorCard} mode="outlined">
            <Card.Content style={styles.sensorContent}>
              <View style={styles.sensorIcon}>
                <MaterialCommunityIcons
                  name={
                    sensor.sensorType === 'TEMPERATURE'
                      ? 'thermometer'
                      : sensor.sensorType === 'HUMIDITY'
                      ? 'water-percent'
                      : 'sprout'
                  }
                  size={24}
                  color={AppColors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={{ fontWeight: '700' }}>{sensor.name}</Text>
                <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>
                  Mã: {sensor.code} • Ngưỡng an toàn: {sensor.minThreshold} - {sensor.maxThreshold} {sensor.unit}
                </Text>
              </View>
              <Text variant="titleMedium" style={{ fontWeight: '800', color: AppColors.primaryDark }}>
                {sensor.lastValue} {sensor.unit}
              </Text>
            </Card.Content>
          </Card>
        ))}

        {/* Device Actions */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Bảo Trì & Điều Khiển Thiết Bị
        </Text>

        <View style={styles.actionBtnGrid}>
          <Button
            mode="contained"
            icon="restart"
            buttonColor={AppColors.error}
            loading={sendCommandMutation.isPending}
            onPress={() => {
              Alert.alert('Khởi động lại', 'Bạn có chắc chắn muốn gửi lệnh khởi động lại ESP32?', [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Khởi động lại', onPress: () => sendCommandMutation.mutate('REBOOT') },
              ]);
            }}
            style={styles.actionBtn}
          >
            Reboot ESP32
          </Button>

          <Button
            mode="outlined"
            icon="cloud-sync"
            textColor={AppColors.primary}
            onPress={() => Alert.alert('Thông báo', 'Đang ping kiểm tra kết nối MQTT broker... Độ trễ: 34ms.')}
            style={styles.actionBtn}
          >
            Kiểm tra Ping MQTT
          </Button>
        </View>
      </ScrollView>

      {/* Dialog Cấu hình ngưỡng */}
      <Portal>
        <Dialog visible={configDialogVisible} onDismiss={() => setConfigDialogVisible(false)}>
          <Dialog.Title>Cấu Hình Ngưỡng Cảnh Báo Cảm Biến</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Ngưỡng nhiệt độ tối đa (°C)"
              value={tempMaxThreshold}
              onChangeText={setTempMaxThreshold}
              keyboardType="numeric"
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Ngưỡng độ ẩm đất tối thiểu (%)"
              value={moistureMinThreshold}
              onChangeText={setMoistureMinThreshold}
              keyboardType="numeric"
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>
              Hệ thống sẽ tự động kích hoạt còi báo và gửi cảnh báo về điện thoại khi giá trị vượt ngưỡng.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfigDialogVisible(false)}>Hủy</Button>
            <Button
              mode="contained"
              buttonColor={AppColors.primary}
              onPress={() => {
                setConfigDialogVisible(false);
                Alert.alert('Thành công', 'Đã cập nhật ngưỡng cảnh báo thiết bị!');
              }}
            >
              Lưu
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
  specCard: {
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deviceName: {
    fontWeight: '700',
    color: AppColors.text,
  },
  deviceCode: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  specLabel: {
    color: AppColors.textSecondary,
  },
  specVal: {
    fontWeight: '600',
    color: AppColors.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    color: AppColors.text,
  },
  sensorCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  sensorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sensorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionBtnGrid: {
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    borderRadius: 12,
  },
});

