import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { useFarmStore } from '../../src/store/farm-store';
import { FarmService } from '../../src/services/farm.service';
import { DeviceService } from '../../src/services/device.service';
import { TelemetryService } from '../../src/services/telemetry.service';
import { AlertService } from '../../src/services/alert.service';
import { SocketService } from '../../src/services/socket.service';
import { SensorCard } from '../../src/components/dashboard/SensorCard';
import { DeviceQuickControl } from '../../src/components/dashboard/DeviceQuickControl';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingScreen } from '../../src/components/common/LoadingScreen';

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedFarmId, setSelectedFarmId } = useFarmStore();

  const [pumpOn, setPumpOn] = useState(false);
  const [fanOn, setFanOn] = useState(false);
  const [controllingPump, setControllingPump] = useState(false);
  const [controllingFan, setControllingFan] = useState(false);

  // Realtime readings state
  const [realtimeSensors, setRealtimeSensors] = useState<{
    temperature?: { value: number; updatedAt: string };
    humidity?: { value: number; updatedAt: string };
    soilMoisture?: { value: number; updatedAt: string };
  }>({});

  // 1. Fetch Danh sách Farm
  const { data: farms, isLoading: loadingFarms } = useQuery({
    queryKey: ['farms'],
    queryFn: FarmService.getFarms,
  });

  // Tự động chọn farm đầu tiên nếu chưa chọn
  useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId, setSelectedFarmId]);

  const activeFarm = farms?.find((f) => f.id === selectedFarmId) || farms?.[0];

  // 2. Fetch Thiết bị của Farm
  const { data: devices, isLoading: loadingDevices, refetch: refetchDevices } = useQuery({
    queryKey: ['devices', activeFarm?.id],
    queryFn: () => DeviceService.getDevices({ farmId: activeFarm?.id }),
    enabled: !!activeFarm?.id,
  });

  // 3. Fetch Alerts của Farm
  const { data: alerts, isLoading: loadingAlerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts', activeFarm?.id],
    queryFn: () => AlertService.getAlerts({ farmId: activeFarm?.id, limit: 5 }),
    enabled: !!activeFarm?.id,
  });

  const activeAlerts = alerts?.filter((a) => a.status === 'ACTIVE') || [];
  const primaryDevice = devices?.[0];

  // 4. Fetch Telemetry mới nhất từ Server khi khởi tạo
  const { data: latestTelemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ['telemetry-latest', primaryDevice?.id],
    queryFn: async () => {
      if (!primaryDevice?.id) return null;
      return TelemetryService.getLatestByDevice(primaryDevice.id);
    },
    enabled: !!primaryDevice?.id,
    refetchInterval: 10000, // Tự động đồng bộ mỗi 10 giây
  });

  // Cập nhật số liệu từ DB vào state khi vừa load app
  useEffect(() => {
    if (latestTelemetry && Array.isArray(latestTelemetry) && latestTelemetry.length > 0) {
      const tempItem = latestTelemetry.find((t: any) => t.metric?.toLowerCase().includes('temp'));
      const humItem = latestTelemetry.find((t: any) => t.metric?.toLowerCase().includes('hum'));
      const soilItem = latestTelemetry.find((t: any) => t.metric?.toLowerCase().includes('soil'));

      setRealtimeSensors((prev) => ({
        temperature: tempItem ? { value: Number(tempItem.value), updatedAt: tempItem.recordedAt } : prev.temperature,
        humidity: humItem ? { value: Number(humItem.value), updatedAt: humItem.recordedAt } : prev.humidity,
        soilMoisture: soilItem ? { value: Number(soilItem.value), updatedAt: soilItem.recordedAt } : prev.soilMoisture,
      }));
    }
  }, [latestTelemetry]);

  // Khởi tạo Socket.IO realtime
  useEffect(() => {
    let cleanupTelemetry = () => {};
    let cleanupAlert = () => {};
    let cleanupStatus = () => {};

    const setupSocket = async () => {
      await SocketService.connect();
      if (activeFarm?.id) {
        SocketService.joinFarm(activeFarm.id);
      }

      cleanupTelemetry = SocketService.onTelemetry((payload) => {
        if (payload?.metrics) {
          const m = payload.metrics;
          const t = m.temperature ?? m.TEMPERATURE;
          const h = m.humidity ?? m.HUMIDITY;
          const s = m.soilMoisture ?? m.SOIL_MOISTURE ?? m.soil_moisture;
          const timestamp = payload.timestamp || new Date().toISOString();

          setRealtimeSensors((prev) => ({
            temperature: t !== undefined ? { value: Number(t), updatedAt: timestamp } : prev.temperature,
            humidity: h !== undefined ? { value: Number(h), updatedAt: timestamp } : prev.humidity,
            soilMoisture: s !== undefined ? { value: Number(s), updatedAt: timestamp } : prev.soilMoisture,
          }));
        }
      });

      cleanupAlert = SocketService.onAlert(() => {
        refetchAlerts();
      });

      cleanupStatus = SocketService.onDeviceStatus(() => {
        refetchDevices();
      });
    };

    setupSocket();

    return () => {
      cleanupTelemetry();
      cleanupAlert();
      cleanupStatus();
      if (activeFarm?.id) {
        SocketService.leaveFarm(activeFarm.id);
      }
    };
  }, [activeFarm?.id, refetchAlerts, refetchDevices]);

  // Điều khiển Máy bơm
  const handleTogglePump = async (nextState: boolean) => {
    if (!primaryDevice) {
      Alert.alert('Thông báo', 'Chưa có thiết bị điều khiển nào được kết nối.');
      return;
    }
    setControllingPump(true);
    try {
      const command = nextState ? 'PUMP_ON' : 'PUMP_OFF';
      await DeviceService.sendCommand(primaryDevice.id, command, { duration: 60 });
      setPumpOn(nextState);
      Alert.alert('Thành công', `Đã gửi lệnh ${nextState ? 'BẬT' : 'TẮT'} Máy bơm nước.`);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi lệnh tới thiết bị!');
    } finally {
      setControllingPump(false);
    }
  };

  // Điều khiển Quạt thông gió
  const handleToggleFan = async (nextState: boolean) => {
    if (!primaryDevice) {
      Alert.alert('Thông báo', 'Chưa có thiết bị điều khiển nào được kết nối.');
      return;
    }
    setControllingFan(true);
    try {
      const command = nextState ? 'FAN_ON' : 'FAN_OFF';
      await DeviceService.sendCommand(primaryDevice.id, command, { speed: 100 });
      setFanOn(nextState);
      Alert.alert('Thành công', `Đã gửi lệnh ${nextState ? 'BẬT' : 'TẮT'} Quạt thông gió.`);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi lệnh tới thiết bị!');
    } finally {
      setControllingFan(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDevices(), refetchAlerts(), refetchTelemetry()]);
    setRefreshing(false);
  }, [refetchDevices, refetchAlerts, refetchTelemetry]);

  if (loadingFarms && !farms) {
    return <LoadingScreen message="Đang tải dữ liệu trang trại..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Farm Selector Header */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (activeFarm?.id) {
            router.push({ pathname: '/farms/[id]', params: { id: activeFarm.id } });
          } else {
            router.push('/farms');
          }
        }}
      >
        <Surface style={styles.farmHeader} elevation={1}>
          <View style={styles.farmInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="labelSmall" style={styles.subTitle}>
                NÔNG TRẠI ĐANG CHỌN
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={14} color={AppColors.textSecondary} />
            </View>
            <Text variant="titleLarge" style={styles.farmName}>
              {activeFarm?.name || 'Chưa có nông trại'}
            </Text>
            {activeFarm?.address && (
              <Text variant="bodySmall" style={styles.farmAddress} numberOfLines={1}>
                📍 {activeFarm.address}
              </Text>
            )}
          </View>

          <Chip
            icon="circle"
            style={styles.statusChip}
            textStyle={{ color: AppColors.success, fontSize: 11, fontWeight: '700' }}
          >
            {primaryDevice?.status === 'ONLINE' ? 'ESP32 Online' : 'Hệ thống Sẵn sàng'}
          </Chip>
        </Surface>
      </TouchableOpacity>

      {/* Banner khi chưa có farm nào */}
      {(!farms || farms.length === 0) && (
        <Surface
          style={{
            backgroundColor: AppColors.primaryContainer,
            padding: 16,
            borderRadius: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          elevation={1}
        >
          <MaterialCommunityIcons name="barn" size={32} color={AppColors.primary} />
          <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
            <Text variant="titleSmall" style={{ fontWeight: '700', color: AppColors.primaryDark }}>
              Chưa có nông trại nào
            </Text>
            <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>
              Hãy tạo nông trại đầu tiên để kết nối thiết bị cảm biến.
            </Text>
          </View>
          <Button
            mode="contained"
            compact
            buttonColor={AppColors.primary}
            onPress={() => router.push('/farms')}
          >
            Tạo Farm
          </Button>
        </Surface>
      )}

      {/* Quick Summary Cards (Bấm chuyển hướng Thiết bị / Cảnh báo) */}
      <View style={styles.summaryRow}>
        <TouchableOpacity
          style={styles.summaryTouchable}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/devices')}
        >
          <Surface style={styles.summaryBox} elevation={1}>
            <View style={styles.summaryTop}>
              <MaterialCommunityIcons name="chip" size={24} color={AppColors.primary} />
              <MaterialCommunityIcons name="chevron-right" size={18} color={AppColors.textSecondary} />
            </View>
            <Text variant="headlineSmall" style={styles.summaryCount}>
              {devices?.length || 0}
            </Text>
            <Text variant="labelSmall" style={styles.summaryLabel}>
              Thiết bị IoT
            </Text>
          </Surface>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryTouchable}
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/alerts')}
        >
          <Surface style={styles.summaryBox} elevation={1}>
            <View style={styles.summaryTop}>
              <MaterialCommunityIcons
                name="bell-alert"
                size={24}
                color={activeAlerts.length > 0 ? AppColors.error : AppColors.success}
              />
              <MaterialCommunityIcons name="chevron-right" size={18} color={AppColors.textSecondary} />
            </View>
            <Text
              variant="headlineSmall"
              style={[styles.summaryCount, activeAlerts.length > 0 && { color: AppColors.error }]}
            >
              {activeAlerts.length}
            </Text>
            <Text variant="labelSmall" style={styles.summaryLabel}>
              Cảnh báo đang có
            </Text>
          </Surface>
        </TouchableOpacity>
      </View>

      {/* Realtime Sensor Section */}
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Thông số Môi trường (Cảm biến)
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Chip compact icon="broadcast" style={styles.liveChip}>
            Realtime
          </Chip>
          <Button
            mode="text"
            compact
            textColor={AppColors.primary}
            onPress={() => router.push('/sensors/monitoring')}
          >
            Chi tiết ❯
          </Button>
        </View>
      </View>

      <View style={styles.sensorsGrid}>
        <SensorCard
          name="Nhiệt độ Không khí"
          type="TEMPERATURE"
          value={realtimeSensors.temperature?.value}
          unit="°C"
          updatedAt={realtimeSensors.temperature?.updatedAt}
          onPress={() => router.push('/sensors/monitoring')}
          status={
            realtimeSensors.temperature?.value !== undefined
              ? (realtimeSensors.temperature.value > 35
                  ? 'CRITICAL'
                  : realtimeSensors.temperature.value > 32
                  ? 'WARNING'
                  : 'NORMAL')
              : 'NORMAL'
          }
        />

        <SensorCard
          name="Độ ẩm Không khí"
          type="HUMIDITY"
          value={realtimeSensors.humidity?.value}
          unit="%"
          updatedAt={realtimeSensors.humidity?.updatedAt}
          onPress={() => router.push('/sensors/monitoring')}
          status="NORMAL"
        />

        <SensorCard
          name="Độ ẩm Đất"
          type="SOIL_MOISTURE"
          value={realtimeSensors.soilMoisture?.value}
          unit="%"
          updatedAt={realtimeSensors.soilMoisture?.updatedAt}
          onPress={() => router.push('/sensors/monitoring')}
          status={
            realtimeSensors.soilMoisture?.value !== undefined
              ? (realtimeSensors.soilMoisture.value < 30 ? 'WARNING' : 'NORMAL')
              : 'NORMAL'
          }
        />
      </View>

      {/* Actuator Quick Controls */}
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Điều khiển Thiết bị Chấp hành
        </Text>
        <Button
          mode="text"
          compact
          textColor={AppColors.primary}
          onPress={() => router.push('/irrigation')}
        >
          Tưới chuyên sâu ❯
        </Button>
      </View>

      <DeviceQuickControl
        title="Máy Bơm Tưới Nước"
        subtitle={pumpOn ? 'Đang tưới tự động (On)' : 'Đang tạm dừng (Off)'}
        icon="water-pump"
        isOn={pumpOn}
        isLoading={controllingPump}
        onToggle={handleTogglePump}
      />

      <DeviceQuickControl
        title="Quạt Thông Gió / Làm Mát"
        subtitle={fanOn ? 'Đang chạy hạ nhiệt (On)' : 'Đang tạm dừng (Off)'}
        icon="fan"
        isOn={fanOn}
        isLoading={controllingFan}
        onToggle={handleToggleFan}
      />

      {/* AI Assistant Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/ai/assistant')}
      >
        <Surface
          style={{
            backgroundColor: AppColors.primaryContainer,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          elevation={1}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: AppColors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <MaterialCommunityIcons name="robot" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: '700', color: AppColors.primaryDark }}>
                Trợ lý AI Nông nghiệp
              </Text>
              <Text variant="bodySmall" style={{ color: AppColors.textSecondary }} numberOfLines={1}>
                Tư vấn lịch tưới, nhiệt độ và sâu bệnh
              </Text>
            </View>
          </View>
          <Button
            mode="contained"
            compact
            buttonColor={AppColors.primary}
            onPress={() => router.push('/ai/assistant')}
          >
            Hỏi AI ❯
          </Button>
        </Surface>
      </TouchableOpacity>

      {/* Active Alerts Banner if any */}
      {activeAlerts.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (activeAlerts[0]?.id) {
              router.push({ pathname: '/alerts/[id]', params: { id: activeAlerts[0].id } });
            } else {
              router.push('/(tabs)/alerts');
            }
          }}
        >
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons name="alert-decagram" size={24} color={AppColors.error} />
            <View style={styles.alertContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="titleSmall" style={styles.alertTitle}>
                  {activeAlerts[0].title}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={AppColors.error} />
              </View>
              <Text variant="bodySmall" style={styles.alertMsg} numberOfLines={1}>
                {activeAlerts[0].message}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  farmHeader: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  farmInfo: {
    flex: 1,
    marginRight: 8,
  },
  subTitle: {
    color: AppColors.textSecondary,
    letterSpacing: 0.5,
  },
  farmName: {
    fontWeight: '700',
    color: AppColors.primaryDark,
    marginTop: 2,
  },
  farmAddress: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    backgroundColor: AppColors.successContainer,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryTouchable: {
    flex: 1,
  },
  summaryBox: {
    backgroundColor: AppColors.surface,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  summaryCount: {
    fontWeight: '800',
    color: AppColors.text,
    marginVertical: 4,
  },
  summaryLabel: {
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    color: AppColors.text,
  },
  liveChip: {
    backgroundColor: AppColors.primaryContainer,
  },
  sensorsGrid: {
    marginBottom: 12,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.errorContainer,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    color: AppColors.error,
    fontWeight: '700',
  },
  alertMsg: {
    color: AppColors.text,
  },
});

