import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, SegmentedButtons, Card, Chip, Appbar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { useFarmStore } from '../../src/store/farm-store';
import { TelemetryService } from '../../src/services/telemetry.service';
import { DeviceService } from '../../src/services/device.service';

export default function SensorMonitoringScreen() {
  const router = useRouter();
  const { selectedFarmId } = useFarmStore();

  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedSensorType, setSelectedSensorType] = useState<string>('TEMPERATURE');

  // Lấy danh sách thiết bị để lấy sensorId
  const { data: devices } = useQuery({
    queryKey: ['devices', selectedFarmId],
    queryFn: () => DeviceService.getDevices({ farmId: selectedFarmId || undefined }),
  });

  const primaryDevice = devices?.[0];
  const sensors = primaryDevice?.sensors || [];

  const metricFilter = selectedSensorType === 'TEMPERATURE'
    ? 'temperature'
    : selectedSensorType === 'HUMIDITY'
    ? 'humidity'
    : 'soilMoisture';

  // Lấy dữ liệu telemetry history
  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['telemetry-history', primaryDevice?.id, selectedSensorType, timeRange],
    queryFn: () => TelemetryService.getHistory({
      deviceId: primaryDevice?.id,
      metric: metricFilter,
      limit: 20,
    }),
    enabled: !!primaryDevice?.id,
    refetchInterval: 10000,
  });

  const displayPoints = history && history.length > 0
    ? history.slice(0, 6).reverse().map((h) => ({
        time: new Date(h.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        val: Number(h.value),
      }))
    : [];

  const highestVal = displayPoints.length > 0
    ? Math.max(...displayPoints.map((p) => p.val))
    : 0;
  const unitStr = selectedSensorType === 'TEMPERATURE' ? '°C' : '%';

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title="Giám Sát Cảm Biến" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Sensor Type Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <Chip
            selected={selectedSensorType === 'TEMPERATURE'}
            icon="thermometer"
            onPress={() => setSelectedSensorType('TEMPERATURE')}
            style={[styles.typeChip, selectedSensorType === 'TEMPERATURE' && styles.typeChipActive]}
            textStyle={selectedSensorType === 'TEMPERATURE' ? styles.chipTextActive : styles.chipText}
          >
            Nhiệt độ (°C)
          </Chip>
          <Chip
            selected={selectedSensorType === 'HUMIDITY'}
            icon="water-percent"
            onPress={() => setSelectedSensorType('HUMIDITY')}
            style={[styles.typeChip, selectedSensorType === 'HUMIDITY' && styles.typeChipActive]}
            textStyle={selectedSensorType === 'HUMIDITY' ? styles.chipTextActive : styles.chipText}
          >
            Độ ẩm khí (%)
          </Chip>
          <Chip
            selected={selectedSensorType === 'SOIL_MOISTURE'}
            icon="sprout"
            onPress={() => setSelectedSensorType('SOIL_MOISTURE')}
            style={[styles.typeChip, selectedSensorType === 'SOIL_MOISTURE' && styles.typeChipActive]}
            textStyle={selectedSensorType === 'SOIL_MOISTURE' ? styles.chipTextActive : styles.chipText}
          >
            Độ ẩm đất (%)
          </Chip>
        </ScrollView>

        {/* Time range selector */}
        <SegmentedButtons
          value={timeRange}
          onValueChange={(val) => setTimeRange(val as any)}
          buttons={[
            { value: '1h', label: '1 Giờ' },
            { value: '24h', label: '24 Giờ' },
            { value: '7d', label: '7 Ngày' },
            { value: '30d', label: '30 Ngày' },
          ]}
          style={styles.timeSegmented}
        />

        {/* Chart Visualization Card */}
        <Surface style={styles.chartCard} elevation={2}>
          <View style={styles.chartHeader}>
            <View>
              <Text variant="titleMedium" style={styles.chartTitle}>
                Biểu đồ Biến thiên
              </Text>
              <Text variant="bodySmall" style={styles.chartSubtitle}>
                {selectedSensorType === 'TEMPERATURE'
                  ? 'Nhiệt độ không khí (°C)'
                  : selectedSensorType === 'HUMIDITY'
                  ? 'Độ ẩm không khí (%)'
                  : 'Độ ẩm đất (%)'}
              </Text>
            </View>
            <Chip compact style={styles.statChip} textStyle={{ color: AppColors.primary, fontWeight: '700' }}>
              Cao nhất: {highestVal > 0 ? `${highestVal.toFixed(1)}${unitStr}` : '--'}
            </Chip>
          </View>

          {/* Mini Bar / Points Visualization */}
          {displayPoints.length > 0 ? (
            <View style={styles.barContainer}>
              {displayPoints.map((pt, idx) => {
                const maxScale = Math.max(highestVal * 1.2, 50);
                const heightPct = Math.min(100, Math.max(15, (pt.val / maxScale) * 100));
                const isHigh = selectedSensorType === 'TEMPERATURE' ? pt.val > 35 : pt.val > 80;
                return (
                  <View key={idx} style={styles.barCol}>
                    <Text variant="labelSmall" style={styles.barVal}>
                      {pt.val.toFixed(1)}{unitStr}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${heightPct}%`,
                            backgroundColor: isHigh ? AppColors.error : AppColors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text variant="labelSmall" style={styles.barTime}>
                      {pt.time}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <MaterialCommunityIcons name="cloud-sync" size={32} color={AppColors.textSecondary} />
              <Text variant="bodySmall" style={{ color: AppColors.textSecondary, marginTop: 8 }}>
                Đang chờ gói tin cảm biến đầu tiên từ ESP32...
              </Text>
            </View>
          )}

          <View style={styles.thresholdInfo}>
            <MaterialCommunityIcons name="information" size={16} color={AppColors.warning} />
            <Text variant="bodySmall" style={styles.thresholdText}>
              Ngưỡng cảnh báo: Dưới 15°C hoặc Vượt quá 35°C
            </Text>
          </View>
        </Surface>

        {/* Telemetry History Table */}
        <Text variant="titleMedium" style={styles.historyTitle}>
          Lịch sử Đọc Cảm biến Gần đây
        </Text>

        {history && history.length > 0 ? (
          history.slice(0, 10).map((item, i) => (
            <Card key={item.id || i} style={styles.historyItem} mode="outlined">
              <Card.Content style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text variant="labelLarge" style={styles.historyVal}>
                    {Number(item.value).toFixed(1)} {item.unit || unitStr}
                  </Text>
                  <Text variant="bodySmall" style={styles.historyDevice}>
                    Thiết bị: {primaryDevice?.code || (primaryDevice as any)?.deviceCode || 'ESP32'} • Metric: {item.metric || metricFilter}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.historyTime}>
                  {new Date(item.recordedAt).toLocaleTimeString('vi-VN')}
                </Text>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Surface style={{ padding: 20, borderRadius: 12, alignItems: 'center', backgroundColor: AppColors.surface }} elevation={1}>
            <Text variant="bodyMedium" style={{ color: AppColors.textSecondary }}>
              Chưa có bản ghi lịch sử telemetry nào cho cảm biến này.
            </Text>
          </Surface>
        )}
      </ScrollView>
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
  chipRow: {
    marginBottom: 12,
  },
  typeChip: {
    marginRight: 8,
    backgroundColor: AppColors.surface,
  },
  typeChipActive: {
    backgroundColor: AppColors.primary,
  },
  chipText: {
    color: AppColors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeSegmented: {
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontWeight: '700',
    color: AppColors.text,
  },
  chartSubtitle: {
    color: AppColors.textSecondary,
  },
  statChip: {
    backgroundColor: AppColors.errorContainer,
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.surfaceVariant,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barVal: {
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontSize: 10,
  },
  barTrack: {
    width: 20,
    height: 110,
    backgroundColor: AppColors.surfaceVariant,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barTime: {
    color: AppColors.textSecondary,
    marginTop: 6,
    fontSize: 11,
  },
  thresholdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  thresholdText: {
    marginLeft: 6,
    color: AppColors.textSecondary,
  },
  historyTitle: {
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 12,
  },
  historyItem: {
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyLeft: {
    flex: 1,
  },
  historyVal: {
    fontWeight: '700',
    color: AppColors.text,
  },
  historyDevice: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  historyTime: {
    color: AppColors.outline,
  },
});

