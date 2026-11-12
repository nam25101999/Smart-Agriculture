import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Portal, Dialog, TextInput, FAB, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { FarmService } from '../../src/services/farm.service';
import { useFarmStore } from '../../src/store/farm-store';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingScreen } from '../../src/components/common/LoadingScreen';
import { ENV } from '../../src/core/config/env';

export default function FarmsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedFarmId, setSelectedFarmId } = useFarmStore();

  const [createFarmDialogVisible, setCreateFarmDialogVisible] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmCode, setNewFarmCode] = useState('');
  const [newFarmAddress, setNewFarmAddress] = useState('');

  // 1. Fetch Danh sách Farms
  const { data: farms, isLoading, refetch } = useQuery({
    queryKey: ['farms'],
    queryFn: FarmService.getFarms,
  });

  const activeFarm = farms?.find((f) => f.id === selectedFarmId) || farms?.[0];

  // 2. Fetch Khu vực (Zones) của Farm đang chọn
  const { data: zones, isLoading: loadingZones, refetch: refetchZones } = useQuery({
    queryKey: ['zones', activeFarm?.id],
    queryFn: () => (activeFarm?.id ? FarmService.getZones(activeFarm.id) : Promise.resolve([])),
    enabled: !!activeFarm?.id,
  });

  // Mutation tạo nông trại
  const createFarmMutation = useMutation({
    mutationFn: FarmService.createFarm,
    onSuccess: (newFarm) => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      setSelectedFarmId(newFarm.id);
      setCreateFarmDialogVisible(false);
      setNewFarmName('');
      setNewFarmCode('');
      setNewFarmAddress('');
      Alert.alert('Thành công', 'Đã tạo nông trại mới!');
    },
    onError: (err: any) => {
      const serverMsg = err.response?.data?.message;
      const networkMsg = err.message || 'Lỗi kết nối tới máy chủ Backend (Port 5001)!';
      Alert.alert('Không thể tạo nông trại', serverMsg || `${networkMsg}\nVui lòng đảm bảo Backend đang chạy tại http://${ENV.DEV_HOST}:5001`);
    },
  });

  const handleCreateFarm = () => {
    if (!newFarmName || !newFarmCode) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và mã nông trại!');
      return;
    }
    createFarmMutation.mutate({
      name: newFarmName.trim(),
      code: newFarmCode.trim().toUpperCase(),
      location: newFarmAddress.trim() || undefined,
      address: newFarmAddress.trim() || undefined,
    });
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchZones()]);
    setRefreshing(false);
  }, [refetch, refetchZones]);

  if (isLoading && !farms) {
    return <LoadingScreen message="Đang tải danh sách nông trại..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Danh sách Nông trại ({farms?.length || 0})
        </Text>

        {(!farms || farms.length === 0) ? (
          <EmptyState
            icon="barn"
            title="Chưa có nông trại nào"
            description="Hãy tạo nông trại đầu tiên để bắt đầu kết nối thiết bị cảm biến."
            actionLabel="Tạo Nông trại"
            onAction={() => setCreateFarmDialogVisible(true)}
          />
        ) : (
          farms.map((farm) => {
            const isSelected = farm.id === activeFarm?.id;
            return (
              <Card
                key={farm.id}
                style={[styles.farmCard, isSelected && styles.selectedCard]}
                mode="elevated"
                onPress={() => setSelectedFarmId(farm.id)}
              >
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <Text variant="titleMedium" style={styles.farmTitle}>
                        {farm.name}
                      </Text>
                      <Text variant="labelSmall" style={styles.farmCode}>
                        Mã: {farm.code}
                      </Text>
                    </View>
                    {isSelected && (
                      <Chip
                        icon="check-circle"
                        compact
                        style={styles.selectedChip}
                        textStyle={{ color: AppColors.primary, fontWeight: '700' }}
                      >
                        Đang chọn
                      </Chip>
                    )}
                  </View>

                  {farm.address && (
                    <Text variant="bodySmall" style={styles.address}>
                      📍 {farm.address}
                    </Text>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                    <Button
                      mode="text"
                      compact
                      textColor={AppColors.primary}
                      onPress={() => router.push({ pathname: '/farms/[id]', params: { id: farm.id } })}
                    >
                      Chi tiết & Nhân sự ❯
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}

        {/* Zones section of active farm */}
        {activeFarm && (
          <View style={styles.zonesSection}>
            <Text variant="titleMedium" style={styles.sectionHeader}>
              Khu vực canh tác ({zones?.length || 0})
            </Text>

            {(!zones || zones.length === 0) ? (
              <Card style={styles.zoneEmptyCard}>
                <Card.Content style={styles.emptyZoneContent}>
                  <MaterialCommunityIcons name="greenhouse" size={36} color={AppColors.outline} />
                  <Text variant="bodyMedium" style={styles.emptyZoneText}>
                    Nông trại này chưa có khu vực nào.
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              zones.map((zone) => (
                <Card key={zone.id} style={styles.zoneCard} mode="outlined">
                  <Card.Content style={styles.zoneContent}>
                    <View style={styles.zoneIcon}>
                      <MaterialCommunityIcons name="greenhouse" size={24} color={AppColors.primary} />
                    </View>
                    <View style={styles.zoneDetails}>
                      <Text variant="titleSmall" style={styles.zoneName}>
                        {zone.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.zoneMeta}>
                        Loại: {zone.zoneType} • Mã: {zone.code}
                        {zone.areaM2 ? ` • ${zone.areaM2} m²` : ''}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB tạo nông trại mới */}
      <FAB
        icon="plus"
        label="Thêm Farm"
        style={styles.fab}
        color="#FFFFFF"
        onPress={() => setCreateFarmDialogVisible(true)}
      />

      {/* Dialog tạo Nông trại */}
      <Portal>
        <Dialog visible={createFarmDialogVisible} onDismiss={() => setCreateFarmDialogVisible(false)}>
          <Dialog.Title>Thêm Nông trại Mới</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Tên nông trại *"
              value={newFarmName}
              onChangeText={setNewFarmName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Mã định danh (ví dụ: FARM_02) *"
              value={newFarmCode}
              onChangeText={setNewFarmCode}
              mode="outlined"
              autoCapitalize="characters"
              style={styles.dialogInput}
            />
            <TextInput
              label="Địa chỉ"
              value={newFarmAddress}
              onChangeText={setNewFarmAddress}
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateFarmDialogVisible(false)}>Hủy</Button>
            <Button
              mode="contained"
              loading={createFarmMutation.isPending}
              disabled={createFarmMutation.isPending}
              onPress={handleCreateFarm}
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
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 12,
  },
  farmCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: AppColors.primary,
    borderWidth: 2,
    backgroundColor: AppColors.primaryContainer + '22',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  farmTitle: {
    fontWeight: '700',
    color: AppColors.text,
  },
  farmCode: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  selectedChip: {
    backgroundColor: AppColors.primaryContainer,
  },
  address: {
    color: AppColors.textSecondary,
    marginTop: 8,
  },
  zonesSection: {
    marginTop: 20,
  },
  zoneCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  zoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  zoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  zoneDetails: {
    flex: 1,
  },
  zoneName: {
    fontWeight: '600',
    color: AppColors.text,
  },
  zoneMeta: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  zoneEmptyCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
  },
  emptyZoneContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyZoneText: {
    marginTop: 8,
    color: AppColors.textSecondary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.primary,
  },
  dialogInput: {
    marginBottom: 12,
    backgroundColor: AppColors.surface,
  },
});

