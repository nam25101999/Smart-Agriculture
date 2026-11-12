import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Appbar, Card, Chip, Button, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { DeviceService } from '../../src/services/device.service';

export default function ZoneDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const zoneId = params.id as string;

  // Lấy danh sách thiết bị thuộc zone
  const { data: devices } = useQuery({
    queryKey: ['zone-devices', zoneId],
    queryFn: () => DeviceService.getDevices({ zoneId }),
    enabled: !!zoneId,
  });

  const zoneDevices = devices || [];

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title="Chi Tiết Khu Vực" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Zone Overview Surface */}
        <Surface style={styles.overviewSurface} elevation={2}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="headlineSmall" style={styles.title}>
                Khu vực Nhà kính 01
              </Text>
              <Text variant="bodySmall" style={styles.code}>
                Mã: ZONE_01 • Loại: Nhà màng Công nghệ cao
              </Text>
            </View>
            <Chip compact style={styles.statusChip} textStyle={{ color: AppColors.primary, fontWeight: '700' }}>
              Bình thường
            </Chip>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <View style={styles.specGrid}>
            <View style={styles.specItem}>
              <Text variant="labelSmall" style={styles.specLabel}>Diện tích:</Text>
              <Text variant="titleMedium" style={styles.specVal}>500 m²</Text>
            </View>
            <View style={styles.specItem}>
              <Text variant="labelSmall" style={styles.specLabel}>Cây trồng:</Text>
              <Text variant="titleMedium" style={styles.specVal}>Dưa lưới</Text>
            </View>
            <View style={styles.specItem}>
              <Text variant="labelSmall" style={styles.specLabel}>Số thiết bị:</Text>
              <Text variant="titleMedium" style={styles.specVal}>{zoneDevices.length || 1} ESP32</Text>
            </View>
          </View>
        </Surface>

        {/* Realtime Sensor Snapshots */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Cảm Biến Trong Khu Vực
        </Text>

        <View style={styles.sensorRow}>
          <Card style={styles.sensorMiniCard} mode="outlined">
            <Card.Content style={styles.sensorMiniContent}>
              <MaterialCommunityIcons name="thermometer" size={24} color={AppColors.error} />
              <Text variant="headlineSmall" style={{ fontWeight: '700', color: AppColors.error, marginTop: 4 }}>
                37.8°C
              </Text>
              <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>Nhiệt độ</Text>
            </Card.Content>
          </Card>

          <Card style={styles.sensorMiniCard} mode="outlined">
            <Card.Content style={styles.sensorMiniContent}>
              <MaterialCommunityIcons name="water-percent" size={24} color={AppColors.info} />
              <Text variant="headlineSmall" style={{ fontWeight: '700', color: AppColors.info, marginTop: 4 }}>
                65.5%
              </Text>
              <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>Độ ẩm khí</Text>
            </Card.Content>
          </Card>

          <Card style={styles.sensorMiniCard} mode="outlined">
            <Card.Content style={styles.sensorMiniContent}>
              <MaterialCommunityIcons name="sprout" size={24} color={AppColors.primary} />
              <Text variant="headlineSmall" style={{ fontWeight: '700', color: AppColors.primary, marginTop: 4 }}>
                42%
              </Text>
              <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>Độ ẩm đất</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Assigned Devices */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Thiết Bị Điều Khiển IoT Phụ Trách
        </Text>

        {(zoneDevices.length > 0 ? zoneDevices : [
          { id: 'dev1', name: 'ESP32_ZONE_01', code: 'ESP32_ZONE_01', deviceType: 'ESP32_GATEWAY', status: 'ONLINE' }
        ]).map((device: any) => (
          <Card
            key={device.id}
            style={styles.deviceCard}
            mode="elevated"
            onPress={() => router.push({ pathname: '/devices/[id]', params: { id: device.id } })}
          >
            <Card.Content style={styles.deviceCardContent}>
              <View style={styles.deviceIcon}>
                <MaterialCommunityIcons name="chip" size={24} color={AppColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: '700' }}>{device.name}</Text>
                <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>
                  Mã: {device.code} • Loại: {device.deviceType}
                </Text>
              </View>
              <Chip
                compact
                style={{
                  backgroundColor: device.status === 'ONLINE' ? AppColors.successContainer : AppColors.errorContainer,
                }}
                textStyle={{
                  color: device.status === 'ONLINE' ? AppColors.success : AppColors.error,
                  fontWeight: '700',
                  fontSize: 11,
                }}
              >
                {device.status}
              </Chip>
            </Card.Content>
          </Card>
        ))}

        {/* Quick Zone Action */}
        <Button
          mode="contained"
          icon="water"
          buttonColor={AppColors.primary}
          style={styles.actionBtn}
          contentStyle={{ paddingVertical: 6 }}
          onPress={() => router.push('/irrigation' as any)}
        >
          Mở Bảng Điều Khiển Tưới Khu Vực Này
        </Button>
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
  overviewSurface: {
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
  title: {
    fontWeight: '700',
    color: AppColors.text,
  },
  code: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    backgroundColor: AppColors.primaryContainer,
  },
  specGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specItem: {
    alignItems: 'center',
  },
  specLabel: {
    color: AppColors.textSecondary,
  },
  specVal: {
    fontWeight: '700',
    color: AppColors.primaryDark,
    marginTop: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    color: AppColors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  sensorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sensorMiniCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
  },
  sensorMiniContent: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  deviceCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 16,
  },
  deviceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionBtn: {
    borderRadius: 12,
    marginTop: 8,
  },
});
