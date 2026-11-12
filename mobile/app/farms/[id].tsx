import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Appbar, Card, Button, Chip, Divider, Avatar, Portal, Dialog, TextInput, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { FarmService } from '../../src/services/farm.service';
import { DeviceService } from '../../src/services/device.service';
import { LoadingScreen } from '../../src/components/common/LoadingScreen';

export default function FarmDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const farmId = params.id as string;
  const queryClient = useQueryClient();

  const [createZoneVisible, setCreateZoneVisible] = useState(false);
  const [scanDeviceVisible, setScanDeviceVisible] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneType, setNewZoneType] = useState('GREENHOUSE');

  // Lấy chi tiết Farm
  const { data: farm, isLoading: loadingFarm } = useQuery({
    queryKey: ['farm-detail', farmId],
    queryFn: () => FarmService.getFarmById(farmId),
    enabled: !!farmId,
  });

  // Lấy danh sách Zones của Farm
  const { data: zones, isLoading: loadingZones } = useQuery({
    queryKey: ['zones', farmId],
    queryFn: () => FarmService.getZones(farmId),
    enabled: !!farmId,
  });

  // Lấy danh sách Thiết bị ĐÃ ĐƯỢC KẾT NỐI với Farm này
  const { data: farmDevices, refetch: refetchFarmDevices } = useQuery({
    queryKey: ['farm-devices', farmId],
    queryFn: () => DeviceService.getDevices({ farmId }),
    enabled: !!farmId,
  });

  // Lấy danh sách thiết bị khả dụng để quét & kết nối
  const { data: availableDevices, isLoading: loadingAvailable, refetch: refetchAvailable } = useQuery({
    queryKey: ['available-devices'],
    queryFn: DeviceService.getAvailableDevices,
    enabled: scanDeviceVisible,
  });

  // Mutation kết nối thiết bị vào Farm
  const pairMutation = useMutation({
    mutationFn: (deviceCode: string) => DeviceService.pairDevice({ deviceCode, farmId }),
    onSuccess: (res, deviceCode) => {
      queryClient.invalidateQueries({ queryKey: ['farm-devices', farmId] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['available-devices'] });
      setScanDeviceVisible(false);
      Alert.alert(
        'Kết Nối Thành Công 🎉',
        `Đã kết nối thiết bị [${deviceCode}] vào ${farm?.name || 'Nông trại'}! Thông tin cảm biến và quyền điều khiển đã được kích hoạt trên app.`
      );
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể kết nối thiết bị');
    },
  });

  // Mutation hủy kết nối thiết bị khỏi vườn (giữ lại trong DB)
  const unpairMutation = useMutation({
    mutationFn: (deviceId: string) => DeviceService.unpairDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-devices', farmId] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['available-devices'] });
      Alert.alert('Thành công', 'Đã hủy kết nối thiết bị khỏi vườn. Bạn có thể kết nối lại bất cứ lúc nào.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể hủy kết nối');
    },
  });

  // Mutation xóa hoàn toàn thiết bị
  const deleteMutation = useMutation({
    mutationFn: (deviceId: string) => DeviceService.deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farm-devices', farmId] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['available-devices'] });
      Alert.alert('Đã Xóa', 'Thiết bị đã được xóa hoàn toàn khỏi hệ thống.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa thiết bị');
    },
  });

  const handleUnpair = (dev: any) => {
    Alert.alert(
      'Hủy Kết Nối',
      `Bạn có muốn hủy kết nối thiết bị [${dev.name || dev.deviceCode}] khỏi vườn này không?\nThiết bị vẫn còn trong hệ thống và có thể kết nối lại sau.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Hủy kết nối', style: 'destructive', onPress: () => unpairMutation.mutate(dev.id) },
      ]
    );
  };

  const handleDelete = (dev: any) => {
    Alert.alert(
      '⚠️ Xóa Thiết Bị',
      `Bạn có chắc muốn XÓA HOÀN TOÀN thiết bị [${dev.name || dev.deviceCode}]?\nHành động này sẽ xóa toàn bộ dữ liệu cảm biến, lịch sử và không thể khôi phục.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => deleteMutation.mutate(dev.id) },
      ]
    );
  };

  // Mutation tạo Zone mới
  const createZoneMutation = useMutation({
    mutationFn: (data: any) => FarmService.createZone(farmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones', farmId] });
      setCreateZoneVisible(false);
      setNewZoneName('');
      setNewZoneCode('');
      Alert.alert('Thành công', 'Đã thêm khu vực mới vào nông trại!');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể tạo khu vực!');
    },
  });

  const handleCreateZone = () => {
    if (!newZoneName.trim() || !newZoneCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và mã khu vực!');
      return;
    }
    createZoneMutation.mutate({
      name: newZoneName.trim(),
      code: newZoneCode.trim().toUpperCase(),
      zoneType: newZoneType,
      areaM2: 500,
    });
  };

  if (loadingFarm && !farm) {
    return <LoadingScreen message="Đang tải thông tin nông trại..." />;
  }

  // Danh sách mẫu cây trồng & mùa vụ
  const crops = [
    { id: 'c1', name: 'Dưa lưới Huỳnh Long', stage: 'Ra hoa tạo quả', age: '45 ngày', status: 'Khỏe mạnh' },
    { id: 'c2', name: 'Cà chua bi Cherry', stage: 'Thu hoạch đợt 1', age: '70 ngày', status: 'Năng suất cao' },
  ];

  // Danh sách mẫu nhân sự
  const members = [
    { id: 'm1', name: 'Nguyễn Văn Nam', email: 'admin@smartagri.vn', role: 'FARM_OWNER' },
    { id: 'm2', name: 'Trần Kỹ Thuật', email: 'tech@smartagri.vn', role: 'TECHNICIAN' },
  ];

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction color="#FFFFFF" onPress={() => router.back()} />
        <Appbar.Content title={farm?.name || 'Chi Tiết Nông Trại'} titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Farm Info Overview */}
        <Surface style={styles.overviewCard} elevation={2}>
          <View style={styles.overviewHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="headlineSmall" style={styles.farmTitle}>
                {farm?.name || 'Nông trại Wokwi 01'}
              </Text>
              <Text variant="bodySmall" style={styles.farmCode}>
                Mã định danh: {farm?.code || 'FARM_WOKWI_01'}
              </Text>
            </View>
            <Chip compact style={styles.statusChip} textStyle={{ color: AppColors.success, fontWeight: '700' }}>
              Hoạt động
            </Chip>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.infoLabel}>Địa chỉ:</Text>
            <Text variant="bodySmall" style={styles.infoVal}>{farm?.address || 'Khu Công nghệ Cao TP.HCM'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.infoLabel}>Tổng diện tích:</Text>
            <Text variant="bodySmall" style={styles.infoVal}>{farm?.totalAreaM2 || 12000} m²</Text>
          </View>
        </Surface>

        {/* Zones List */}
        <View style={styles.sectionHeaderRow}>
          <Text variant="titleMedium" style={styles.sectionHeader}>
            Khu vực canh tác ({zones?.length || 0})
          </Text>
          <Button
            mode="contained-tonal"
            compact
            icon="plus"
            onPress={() => setCreateZoneVisible(true)}
          >
            Thêm Khu
          </Button>
        </View>

        {(zones || []).map((zone) => (
          <Card
            key={zone.id}
            style={styles.zoneCard}
            mode="outlined"
            onPress={() => router.push({ pathname: '/zones/[id]', params: { id: zone.id } })}
          >
            <Card.Content style={styles.zoneContent}>
              <View style={styles.zoneIcon}>
                <MaterialCommunityIcons name="greenhouse" size={24} color={AppColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={styles.zoneName}>{zone.name}</Text>
                <Text variant="bodySmall" style={styles.zoneSub}>
                  Mã: {zone.code} • Loại: {zone.zoneType}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={AppColors.outline} />
            </Card.Content>
          </Card>
        ))}

        {/* IoT Devices Section & Scan/Pairing */}
        <View style={styles.sectionHeaderRow}>
          <Text variant="titleMedium" style={styles.sectionHeader}>
            Thiết Bị IoT Kết Nối ({farmDevices?.length || 0})
          </Text>
          <Button
            mode="contained"
            compact
            icon="radar"
            buttonColor={AppColors.primary}
            onPress={() => {
              refetchAvailable();
              setScanDeviceVisible(true);
            }}
          >
            Tìm & Kết Nối Thiết Bị
          </Button>
        </View>

        {(!farmDevices || farmDevices.length === 0) ? (
          <Card style={{ marginBottom: 16, borderColor: AppColors.outline }} mode="outlined">
            <Card.Content style={{ alignItems: 'center', paddingVertical: 20 }}>
              <MaterialCommunityIcons name="radar" size={48} color={AppColors.textSecondary} />
              <Text variant="titleMedium" style={{ fontWeight: '700', marginTop: 8, color: AppColors.text, textAlign: 'center' }}>
                Chưa có thiết bị nào kết nối với Vườn này
              </Text>
              <Text variant="bodySmall" style={{ color: AppColors.textSecondary, textAlign: 'center', marginVertical: 8, paddingHorizontal: 16 }}>
                Hệ thống chỉ hiển thị thông tin cảm biến và quyền điều khiển sau khi bạn tìm kiếm và kết nối thiết bị ESP32 vào Vườn này.
              </Text>
              <Button
                mode="contained-tonal"
                icon="magnify"
                onPress={() => {
                  refetchAvailable();
                  setScanDeviceVisible(true);
                }}
              >
                Quét Tìm Thiết Bị Gần Đây
              </Button>
            </Card.Content>
          </Card>
        ) : (
          farmDevices.map((dev: any) => (
            <Card
              key={dev.id}
              style={{ marginBottom: 12, backgroundColor: AppColors.surface }}
              mode="outlined"
            >
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons name="cpu-64-bit" size={28} color={AppColors.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={{ fontWeight: '700' }}>{dev.name}</Text>
                      <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>
                        Mã: {dev.deviceCode} • Khu vực: {dev.zone?.name || 'Khu vực 1'}
                      </Text>
                    </View>
                  </View>
                  <Chip
                    compact
                    style={{ backgroundColor: dev.status === 'ONLINE' ? AppColors.successContainer : AppColors.errorContainer }}
                    textStyle={{ color: dev.status === 'ONLINE' ? AppColors.success : AppColors.error, fontWeight: '700' }}
                  >
                    {dev.status}
                  </Chip>
                </View>

                {dev.sensors && dev.sensors.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {dev.sensors.map((s: any) => (
                      <Chip key={s.id || s.metricName} icon="pulse" compact style={{ backgroundColor: AppColors.surfaceVariant }}>
                        {s.metricName}: {s.lastValue !== undefined ? `${s.lastValue} ${s.unit}` : 'Đang đo...'}
                      </Chip>
                    ))}
                  </View>
                )}

                <Divider style={{ marginVertical: 10 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="labelSmall" style={{ color: AppColors.textSecondary }}>
                    Cập nhật: {dev.lastSeenAt ? new Date(dev.lastSeenAt).toLocaleTimeString('vi-VN') : 'Vừa xong'}
                  </Text>
                  <Button
                    mode="text"
                    compact
                    textColor={AppColors.primary}
                    onPress={() => router.push('/(tabs)/devices')}
                  >
                    Mở Bảng Điều Khiển ❯
                  </Button>
                </View>

                {/* Hành động nhanh: Hủy kết nối & Xóa */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Button
                    mode="outlined"
                    compact
                    icon="link-off"
                    textColor={AppColors.secondary}
                    style={{ flex: 1, borderColor: AppColors.secondary }}
                    loading={unpairMutation.isPending}
                    onPress={() => handleUnpair(dev)}
                  >
                    Hủy kết nối
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    icon="trash-can-outline"
                    textColor={AppColors.error}
                    style={{ flex: 1, borderColor: AppColors.error }}
                    loading={deleteMutation.isPending}
                    onPress={() => handleDelete(dev)}
                  >
                    Xóa thiết bị
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        {/* Crops & Seasons Section */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Mùa Vụ & Cây Trồng Hiện Tại
        </Text>

        {crops.map((crop) => (
          <Card key={crop.id} style={styles.cropCard} mode="elevated">
            <Card.Content style={styles.cropContent}>
              <View style={styles.cropIcon}>
                <MaterialCommunityIcons name="sprout" size={24} color={AppColors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={styles.cropTitle}>{crop.name}</Text>
                <Text variant="bodySmall" style={styles.cropSub}>
                  Giai đoạn: {crop.stage} • Tuổi cây: {crop.age}
                </Text>
              </View>
              <Chip compact textStyle={{ color: AppColors.primary, fontSize: 11, fontWeight: '700' }}>
                {crop.status}
              </Chip>
            </Card.Content>
          </Card>
        ))}

        {/* Members & RBAC Section */}
        <Text variant="titleMedium" style={styles.sectionHeader}>
          Thành Viên Quản Lý ({members.length})
        </Text>

        {members.map((mem) => (
          <Card key={mem.id} style={styles.memberCard} mode="outlined">
            <Card.Content style={styles.memberContent}>
              <Avatar.Text size={36} label={mem.name.substring(0, 2).toUpperCase()} style={styles.avatar} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="titleSmall" style={{ fontWeight: '700' }}>{mem.name}</Text>
                <Text variant="bodySmall" style={{ color: AppColors.textSecondary }}>{mem.email}</Text>
              </View>
              <Chip compact style={{ backgroundColor: AppColors.primaryContainer }}>
                {mem.role}
              </Chip>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Dialog tạo Zone */}
      <Portal>
        <Dialog visible={createZoneVisible} onDismiss={() => setCreateZoneVisible(false)}>
          <Dialog.Title>Thêm Khu Vực Canh Tác Mới</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Tên khu vực (ví dụ: Nhà Màng 02) *"
              value={newZoneName}
              onChangeText={setNewZoneName}
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Mã khu vực (ví dụ: ZONE_02) *"
              value={newZoneCode}
              onChangeText={setNewZoneCode}
              mode="outlined"
              autoCapitalize="characters"
              style={{ marginBottom: 12 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateZoneVisible(false)}>Hủy</Button>
            <Button
              mode="contained"
              buttonColor={AppColors.primary}
              loading={createZoneMutation.isPending}
              onPress={handleCreateZone}
            >
              Lưu
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Dialog Tìm Kiếm & Kết Nối Thiết Bị ESP32 vào Vườn */}
        <Dialog visible={scanDeviceVisible} onDismiss={() => setScanDeviceVisible(false)}>
          <Dialog.Title style={{ flexDirection: 'row', alignItems: 'center' }}>
            🔍 Quét & Kết Nối Thiết Bị ESP32
          </Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 380, paddingHorizontal: 0 }}>
            <ScrollView>
              <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
                <Text variant="bodySmall" style={{ color: AppColors.textSecondary, marginBottom: 12 }}>
                  Danh sách các thiết bị ESP32 phát hiện trên MQTT Broker để gán vào <Text style={{ fontWeight: '700', color: AppColors.primary }}>{farm?.name}</Text>:
                </Text>

                {loadingAvailable ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <ActivityIndicator color={AppColors.primary} />
                    <Text variant="bodySmall" style={{ marginTop: 8, color: AppColors.textSecondary }}>
                      Đang dò quét thiết bị...
                    </Text>
                  </View>
                ) : (
                  (availableDevices || []).map((dev: any) => {
                    const isAlreadyHere = dev.currentFarm?.id === farmId;
                    return (
                      <Card
                        key={dev.deviceCode}
                        mode="outlined"
                        style={{
                          marginBottom: 10,
                          borderColor: isAlreadyHere ? AppColors.primary : AppColors.outline,
                          backgroundColor: isAlreadyHere ? AppColors.primaryContainer + '30' : AppColors.surface,
                        }}
                      >
                        <Card.Content>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text variant="titleSmall" style={{ fontWeight: '700', color: AppColors.text }}>
                                {dev.name || dev.deviceCode}
                              </Text>
                              <Text variant="labelSmall" style={{ color: AppColors.textSecondary }}>
                                Mã: {dev.deviceCode} • Trạng thái: {dev.status}
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={{
                                  color: isAlreadyHere ? AppColors.primary : AppColors.textSecondary,
                                  marginTop: 4,
                                  fontWeight: isAlreadyHere ? '700' : 'normal',
                                }}
                              >
                                {isAlreadyHere
                                  ? '✓ Đang kết nối với Vườn này'
                                  : dev.currentFarm
                                  ? `Đang gán: ${dev.currentFarm.name}`
                                  : 'Chưa gán vào vườn nào'}
                              </Text>
                            </View>

                            <Button
                              mode={isAlreadyHere ? 'outlined' : 'contained'}
                              compact
                              buttonColor={isAlreadyHere ? undefined : AppColors.primary}
                              textColor={isAlreadyHere ? AppColors.primary : '#FFFFFF'}
                              loading={pairMutation.isPending}
                              disabled={pairMutation.isPending || isAlreadyHere}
                              onPress={() => pairMutation.mutate(dev.deviceCode)}
                            >
                              {isAlreadyHere ? 'Đã Kết Nối' : 'Kết Nối'}
                            </Button>
                          </View>
                        </Card.Content>
                      </Card>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setScanDeviceVisible(false)}>Đóng</Button>
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
  overviewCard: {
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  farmTitle: {
    fontWeight: '700',
    color: AppColors.text,
  },
  farmCode: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    backgroundColor: AppColors.successContainer,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: AppColors.textSecondary,
  },
  infoVal: {
    fontWeight: '600',
    color: AppColors.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    fontWeight: '700',
    color: AppColors.text,
    marginTop: 12,
    marginBottom: 12,
  },
  zoneCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 10,
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
  zoneName: {
    fontWeight: '700',
    color: AppColors.text,
  },
  zoneSub: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  cropCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  cropContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.successContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cropTitle: {
    fontWeight: '700',
  },
  cropSub: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  memberCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: AppColors.primary,
  },
});

