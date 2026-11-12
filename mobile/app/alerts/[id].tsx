import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert as NativeAlert } from 'react-native';
import { Text, Surface, Appbar, Card, Button, Chip, Divider, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { AlertService } from '../../src/services/alert.service';
import { Alert as AlertType } from '../../src/types';

export default function AlertDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const alertId = params.id as string;
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');

  // Lấy chi tiết cảnh báo (hoặc tìm trong cache/api)
  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => AlertService.getAlerts({ limit: 50 }),
  });

  const alertItem = alerts?.find((a) => a.id === alertId) || {
    id: alertId,
    farmId: 'farm1',
    title: 'Nhiệt độ cao vượt ngưỡng an toàn',
    message: 'Nhiệt độ đo được 37.8°C vượt ngưỡng quy định 35°C tại Nhà kính 01.',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    currentValue: 37.8,
    thresholdValue: 35.0,
    createdAt: new Date().toISOString(),
    device: { name: 'ESP32_ZONE_01', code: 'ESP32_ZONE_01' },
  } as AlertType;

  // Mutation Acknowledge
  const ackMutation = useMutation({
    mutationFn: (id: string) => AlertService.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      NativeAlert.alert('Thành công', 'Đã xác nhận sự cố cảnh báo.');
    },
  });

  // Mutation Resolve
  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => AlertService.resolveAlert(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      NativeAlert.alert('Thành công', 'Đã ghi nhận giải quyết sự cố thành công!');
      router.back();
    },
  });

  const getSeverityColor = () => {
    switch (alertItem.severity) {
      case 'CRITICAL':
        return AppColors.error;
      case 'WARNING':
        return AppColors.warning;
      default:
        return AppColors.info;
    }
  };

  const color = getSeverityColor();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title="Chi Tiết Cảnh Báo" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Severity Banner */}
        <Surface style={[styles.banner, { borderLeftColor: color, borderLeftWidth: 6 }]} elevation={2}>
          <View style={styles.bannerHeader}>
            <Chip
              style={{ backgroundColor: `${color}1A` }}
              textStyle={{ color, fontWeight: '700', fontSize: 12 }}
            >
              MỨC ĐỘ: {alertItem.severity}
            </Chip>
            <Chip compact style={{ backgroundColor: AppColors.surfaceVariant }}>
              Trạng thái: {alertItem.status}
            </Chip>
          </View>

          <Text variant="titleLarge" style={styles.title}>
            {alertItem.title}
          </Text>

          <Text variant="bodyMedium" style={styles.message}>
            {alertItem.message}
          </Text>

          <Divider style={{ marginVertical: 12 }} />

          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Text variant="labelSmall" style={styles.metricLabel}>Đo được thực tế</Text>
              <Text variant="headlineSmall" style={[styles.metricVal, { color }]}>
                {alertItem.currentValue ?? 37.8}°C
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text variant="labelSmall" style={styles.metricLabel}>Ngưỡng quy định</Text>
              <Text variant="headlineSmall" style={styles.metricVal}>
                {alertItem.thresholdValue ?? 35.0}°C
              </Text>
            </View>
          </View>
        </Surface>

        {/* Source info */}
        <Surface style={styles.infoSurface} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Nguồn Phát Sinh Sự Cố
          </Text>

          <View style={styles.infoItem}>
            <Text variant="bodySmall" style={styles.infoLabel}>Thiết bị ghi nhận:</Text>
            <Text variant="bodySmall" style={styles.infoVal}>
              {alertItem.device?.name || 'ESP32_ZONE_01'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="bodySmall" style={styles.infoLabel}>Khu vực:</Text>
            <Text variant="bodySmall" style={styles.infoVal}>Nhà kính 01 (ZONE_01)</Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="bodySmall" style={styles.infoLabel}>Thời gian phát hiện:</Text>
            <Text variant="bodySmall" style={styles.infoVal}>
              {new Date(alertItem.createdAt).toLocaleString('vi-VN')}
            </Text>
          </View>
        </Surface>

        {/* Action input note */}
        {alertItem.status !== 'RESOLVED' && (
          <Surface style={styles.infoSurface} elevation={1}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Biện Pháp Khắc Phục
            </Text>
            <TextInput
              label="Ghi chú xử lý của kỹ thuật viên"
              placeholder="Ví dụ: Đã bật quạt thông gió làm mát, kiểm tra màng phủ..."
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={{ marginBottom: 14, backgroundColor: AppColors.surface }}
            />

            <View style={styles.btnRow}>
              {alertItem.status === 'ACTIVE' && (
                <Button
                  mode="outlined"
                  loading={ackMutation.isPending}
                  onPress={() => ackMutation.mutate(alertItem.id)}
                  style={{ flex: 1 }}
                >
                  Xác nhận Sự cố
                </Button>
              )}
              <Button
                mode="contained"
                buttonColor={AppColors.primary}
                loading={resolveMutation.isPending}
                onPress={() => resolveMutation.mutate({ id: alertItem.id, notes })}
                style={{ flex: 1 }}
              >
                Đã Xử Lý Xong
              </Button>
            </View>
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
  banner: {
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 6,
  },
  message: {
    color: AppColors.textSecondary,
    lineHeight: 22,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricLabel: {
    color: AppColors.textSecondary,
  },
  metricVal: {
    fontWeight: '800',
    marginTop: 4,
  },
  infoSurface: {
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: AppColors.textSecondary,
  },
  infoVal: {
    fontWeight: '600',
    color: AppColors.text,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

