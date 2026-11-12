import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { useFarmStore } from '../../src/store/farm-store';
import { AlertService } from '../../src/services/alert.service';
import { SocketService } from '../../src/services/socket.service';
import { AlertItem } from '../../src/components/alerts/AlertItem';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingScreen } from '../../src/components/common/LoadingScreen';

export default function AlertsScreen() {
  const queryClient = useQueryClient();
  const { selectedFarmId } = useFarmStore();

  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');

  // Fetch Alerts
  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['alerts', selectedFarmId, filterStatus],
    queryFn: () =>
      AlertService.getAlerts({
        farmId: selectedFarmId || undefined,
        status: filterStatus === 'ALL' ? undefined : (filterStatus as any),
      }),
  });

  // Lắng nghe realtime alert mới
  useEffect(() => {
    const unsub = SocketService.onAlert(() => {
      refetch();
    });
    return () => {
      unsub();
    };
  }, [refetch]);

  // Mutation Acknowledge
  const ackMutation = useMutation({
    mutationFn: AlertService.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      Alert.alert('Thành công', 'Đã xác nhận sự cố cảnh báo.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xác nhận cảnh báo!');
    },
  });

  // Mutation Resolve
  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      AlertService.resolveAlert(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      Alert.alert('Thành công', 'Đã đánh dấu cảnh báo được xử lý xong.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể cập nhật!');
    },
  });

  const handleAcknowledge = (id: string) => {
    ackMutation.mutate(id);
  };

  const handleResolve = (id: string) => {
    resolveMutation.mutate({ id, notes: 'Đã xử lý trên mobile app' });
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !alerts) {
    return <LoadingScreen message="Đang tải danh sách cảnh báo..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SegmentedButtons
          value={filterStatus}
          onValueChange={setFilterStatus}
          buttons={[
            { value: 'ACTIVE', label: 'Chưa xử lý' },
            { value: 'RESOLVED', label: 'Đã hoàn tất' },
            { value: 'ALL', label: 'Tất cả' },
          ]}
          style={styles.segmented}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {(!alerts || alerts.length === 0) ? (
          <EmptyState
            icon="shield-check-outline"
            title="Không có cảnh báo nào"
            description={
              filterStatus === 'ACTIVE'
                ? 'Tuyệt vời! Hiện tại không có sự cố nào cần xử lý.'
                : 'Chưa có dữ liệu cảnh báo trong mục này.'
            }
          />
        ) : (
          alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              isProcessing={ackMutation.isPending || resolveMutation.isPending}
            />
          ))
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: AppColors.surface,
  },
  segmented: {
    marginBottom: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
});

