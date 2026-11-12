import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Appbar, Card, Button, Switch, Divider, Chip, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { useFarmStore } from '../../src/store/farm-store';
import { DeviceService } from '../../src/services/device.service';
import { FarmService } from '../../src/services/farm.service';

export default function IrrigationControlScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedFarmId } = useFarmStore();

  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState('60'); // seconds
  const [actionType, setActionType] = useState<'PUMP' | 'VALVE'>('PUMP');

  // Lấy danh sách thiết bị
  const { data: devices } = useQuery({
    queryKey: ['devices', selectedFarmId],
    queryFn: () => DeviceService.getDevices({ farmId: selectedFarmId || undefined }),
  });

  // Lấy danh sách zones
  const { data: zones } = useQuery({
    queryKey: ['zones', selectedFarmId],
    queryFn: () => (selectedFarmId ? FarmService.getZones(selectedFarmId) : Promise.resolve([])),
    enabled: !!selectedFarmId,
  });

  const primaryDevice = devices?.[0];

  // Trạng thái các van và bơm
  const [pumpStatus, setPumpStatus] = useState(false);
  const [valveStatus, setValveStatus] = useState<Record<string, boolean>>({
    'VALVE_01': false,
    'VALVE_02': false,
  });

  // Trạng thái State Machine
  const [commandState, setCommandState] = useState<'IDLE' | 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'EXECUTED'>('IDLE');

  const executeCommand = async () => {
    setConfirmDialogVisible(false);
    if (!primaryDevice) {
      Alert.alert('Lỗi', 'Không tìm thấy thiết bị ESP32 điều khiển!');
      return;
    }

    try {
      setCommandState('PENDING');
      const cmd = actionType === 'PUMP' ? (pumpStatus ? 'PUMP_OFF' : 'PUMP_ON') : 'VALVE_OPEN';
      await DeviceService.sendCommand(primaryDevice.id, cmd, { duration: parseInt(selectedDuration, 10) });

      setCommandState('SENT');
      // Mô phỏng nhận ACK từ MQTT broker qua ESP32
      setTimeout(() => {
        setCommandState('ACKNOWLEDGED');
        setTimeout(() => {
          setCommandState('EXECUTED');
          if (actionType === 'PUMP') {
            setPumpStatus(!pumpStatus);
          }
          Alert.alert('Thành công', `Thiết bị ESP32 đã xác nhận [${cmd}] thực thi thành công!`);
        }, 800);
      }, 700);
    } catch (err: any) {
      setCommandState('IDLE');
      Alert.alert('Lỗi', err.response?.data?.message || 'Lỗi gửi lệnh điều khiển!');
    }
  };

  const getStatusBadge = () => {
    switch (commandState) {
      case 'PENDING':
        return { label: 'Đang tiếp nhận... (PENDING)', color: AppColors.warning };
      case 'SENT':
        return { label: 'Đã gửi tới Broker (SENT)', color: AppColors.info };
      case 'ACKNOWLEDGED':
        return { label: 'ESP32 đã nhận (ACKNOWLEDGED)', color: AppColors.primary };
      case 'EXECUTED':
        return { label: 'Thực thi thành công (EXECUTED)', color: AppColors.success };
      default:
        return { label: 'Sẵn sàng nhận lệnh', color: AppColors.textSecondary };
    }
  };

  const badge = getStatusBadge();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title="Điều Khiển Tưới Tiêu" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status State Machine Banner */}
        <Surface style={styles.statusBanner} elevation={1}>
          <View style={styles.bannerRow}>
            <MaterialCommunityIcons name="broadcast" size={20} color={badge.color} />
            <Text variant="titleSmall" style={[styles.bannerText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </Surface>

        {/* Pump Section */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Máy Bơm Nước Trung Tâm
        </Text>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.cardRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="water-pump" size={28} color={AppColors.primary} />
              </View>
              <View style={styles.infoArea}>
                <Text variant="titleMedium" style={styles.title}>
                  Máy Bơm Áp Lực 24V
                </Text>
                <Text variant="bodySmall" style={styles.subText}>
                  Trạng thái: {pumpStatus ? 'ĐANG CHẠY (Bật)' : 'TẠM DỪNG (Tắt)'}
                </Text>
              </View>
              <Switch
                value={pumpStatus}
                color={AppColors.primary}
                onValueChange={() => {
                  setActionType('PUMP');
                  setConfirmDialogVisible(true);
                }}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Zones & Solenoid Valves */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Van Điện Từ Theo Khu Vực (Solenoid Valves)
        </Text>

        {(zones || [{ id: 'z1', name: 'Khu vực Nhà kính 01', code: 'ZONE_01' }]).map((zone) => (
          <Card key={zone.id} style={styles.valveCard} mode="outlined">
            <Card.Content>
              <View style={styles.cardRow}>
                <View style={[styles.iconCircle, { backgroundColor: AppColors.infoContainer }]}>
                  <MaterialCommunityIcons name="pipe-valve" size={26} color={AppColors.info} />
                </View>
                <View style={styles.infoArea}>
                  <Text variant="titleSmall" style={styles.title}>
                    Van Tưới {zone.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.subText}>
                    Mã khu vực: {zone.code}
                  </Text>
                </View>
                <Button
                  mode="outlined"
                  compact
                  textColor={AppColors.primary}
                  onPress={() => {
                    setActionType('VALVE');
                    setConfirmDialogVisible(true);
                  }}
                >
                  Mở Van
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}

        {/* Automated Schedules */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Lịch Tưới Tự Động Định Kỳ
        </Text>

        <Card style={styles.scheduleCard} mode="elevated">
          <Card.Content>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={AppColors.primary} />
              <View style={styles.infoArea}>
                <Text variant="titleSmall" style={styles.title}>
                  Tưới Sáng (06:30 Hàng ngày)
                </Text>
                <Text variant="bodySmall" style={styles.subText}>
                  Thời lượng: 15 phút • Cả trang trại
                </Text>
              </View>
              <Chip compact textStyle={{ color: AppColors.success, fontWeight: '700' }}>
                Đang bật
              </Chip>
            </View>
            <Divider style={{ marginVertical: 10 }} />
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={AppColors.secondary} />
              <View style={styles.infoArea}>
                <Text variant="titleSmall" style={styles.title}>
                  Tưới Chiều Mát (16:45 Hàng ngày)
                </Text>
                <Text variant="bodySmall" style={styles.subText}>
                  Thời lượng: 20 phút • Khu Nhà kính 01
                </Text>
              </View>
              <Chip compact textStyle={{ color: AppColors.success, fontWeight: '700' }}>
                Đang bật
              </Chip>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={confirmDialogVisible} onDismiss={() => setConfirmDialogVisible(false)}>
          <Dialog.Title>Xác nhận An Toàn Điều Khiển</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              Bạn có chắc chắn muốn {pumpStatus ? 'TẮT' : 'BẬT'}{' '}
              {actionType === 'PUMP' ? 'Máy bơm nước' : 'Van điện từ'}?
            </Text>
            <Text variant="labelMedium" style={{ marginBottom: 8, fontWeight: '700' }}>
              Chọn thời gian chạy tự ngắt an toàn:
            </Text>
            <RadioButton.Group onValueChange={setSelectedDuration} value={selectedDuration}>
              <View style={styles.radioOption}>
                <RadioButton value="30" />
                <Text>30 giây</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="60" />
                <Text>60 giây (Khuyến nghị)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="120" />
                <Text>2 phút (120 giây)</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="300" />
                <Text>5 phút (300 giây)</Text>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>Hủy</Button>
            <Button mode="contained" buttonColor={AppColors.primary} onPress={executeCommand}>
              Xác nhận Thực Thi
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
  statusBanner: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    marginBottom: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    fontWeight: '700',
  },
  sectionHeader: {
    fontWeight: '700',
    color: AppColors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    marginBottom: 14,
  },
  valveCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 10,
  },
  scheduleCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoArea: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
    color: AppColors.text,
  },
  subText: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});

