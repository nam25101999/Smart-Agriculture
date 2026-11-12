import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, Chip, Button, Divider, SegmentedButtons, Portal, Dialog, RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppColors } from '../../src/core/theme';
import { useFarmStore } from '../../src/store/farm-store';
import { DeviceService } from '../../src/services/device.service';
import { FarmService } from '../../src/services/farm.service';
import { Device, DeviceCommand } from '../../src/types';
import { EmptyState } from '../../src/components/common/EmptyState';
import { LoadingScreen } from '../../src/components/common/LoadingScreen';

export default function DevicesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedFarmId } = useFarmStore();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [assignDialogVisible, setAssignDialogVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [targetZoneId, setTargetZoneId] = useState<string | null>(null);

  // 1. Fetch Danh sách Thiết bị ĐÃ ĐƯỢC KẾT NỐI với Farm đang chọn
  const { data: devices, isLoading, refetch } = useQuery({
    queryKey: ['devices', selectedFarmId],
    queryFn: () => DeviceService.getDevices({ farmId: selectedFarmId || undefined }),
  });

  const activeDevice = devices?.find((d) => d.id === selectedDeviceId) || devices?.[0];

  // Fetch tất cả các Farm và Zone để hỗ trợ gán thiết bị vào Vườn khác
  const { data: allFarms } = useQuery({
    queryKey: ['farms-with-zones'],
    queryFn: async () => {
      const farmsList = await FarmService.getFarms();
      const withZones = await Promise.all(
        farmsList.map(async (f) => {
          try {
            const zones = await FarmService.getZones(f.id);
            return { ...f, zones };
          } catch {
            return { ...f, zones: [] };
          }
        })
      );
      return withZones;
    },
  });

  // Query thiết bị phát sóng để quét kết nối
  const { data: availableDevices, isLoading: loadingAvailable, refetch: refetchAvailable } = useQuery({
    queryKey: ['available-devices'],
    queryFn: DeviceService.getAvailableDevices,
    enabled: scanModalVisible,
  });

  const pairMutation = useMutation({
    mutationFn: (deviceCode: string) => {
      const farmId = selectedFarmId || allFarms?.[0]?.id;
      if (!farmId) throw new Error('Vui lòng chọn hoặc tạo Nông trại trước khi kết nối thiết bị!');
      return DeviceService.pairDevice({ deviceCode, farmId });
    },
    onSuccess: (res, deviceCode) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['available-devices'] });
      setScanModalVisible(false);
      Alert.alert('Kết Nối Thành Công 🎉', `Đã kết nối thiết bị [${deviceCode}] vào Vườn! Thông tin và quyền điều khiển đã sẵn sàng.`);
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể kết nối thiết bị');
    },
  });

  // Hủy kết nối thiết bị khỏi vườn (giữ bản ghi)
  const unpairMutation = useMutation({
    mutationFn: (deviceId: string) => DeviceService.unpairDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['available-devices'] });
      Alert.alert('Thành công', 'Đã hủy kết nối thiết bị khỏi vườn. Bạn có thể kết nối lại bất cứ lúc nào.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể hủy kết nối');
    },
  });

  // Xóa hoàn toàn thiết bị
  const deleteDeviceMutation = useMutation({
    mutationFn: (deviceId: string) => DeviceService.deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['available-devices'] });
      setSelectedDeviceId(null);
      Alert.alert('Đã Xóa', 'Thiết bị đã được xóa hoàn toàn khỏi hệ thống.');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa thiết bị');
    },
  });

  const handleUnpair = (device: any) => {
    Alert.alert(
      'Hủy Kết Nối',
      `Bạn có muốn hủy kết nối thiết bị [${device.name}] khỏi vườn không?\nThiết bị vẫn còn trong hệ thống và có thể kết nối lại sau.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Hủy kết nối', style: 'destructive', onPress: () => unpairMutation.mutate(device.id) },
      ]
    );
  };

  const handleDeleteDevice = (device: any) => {
    Alert.alert(
      '⚠️ Xóa Thiết Bị',
      `Bạn có chắc muốn XÓA HOÀN TOÀN thiết bị [${device.name}]?\nHành động này sẽ xóa toàn bộ dữ liệu cảm biến, lịch sử và không thể khôi phục.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => deleteDeviceMutation.mutate(device.id) },
      ]
    );
  };

  const updateZoneMutation = useMutation({
    mutationFn: ({ deviceId, zoneId }: { deviceId: string; zoneId: string }) =>
      DeviceService.updateDevice(deviceId, { zoneId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setAssignDialogVisible(false);
      Alert.alert('Thành công', 'Đã gán thiết bị ESP32 vào Vườn / Khu vực mới!');
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể chuyển vườn');
    },
  });

  // 2. Fetch Lịch sử lệnh điều khiển của thiết bị active
  const { data: commands, isLoading: loadingCommands, refetch: refetchCommands } = useQuery({
    queryKey: ['device-commands', activeDevice?.id],
    queryFn: () => (activeDevice?.id ? DeviceService.getCommands(activeDevice.id, 10) : Promise.resolve([])),
    enabled: !!activeDevice?.id,
  });

  // Mutation gửi lệnh điều khiển
  const sendCommandMutation = useMutation({
    mutationFn: ({ deviceId, command, payload }: { deviceId: string; command: string; payload?: any }) =>
      DeviceService.sendCommand(deviceId, command, payload),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['device-commands', vars.deviceId] });
      Alert.alert('Thành công', `Đã phát lệnh [${vars.command}] thành công tới thiết bị!`);
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi lệnh!');
    },
  });

  const handleSendCommand = (command: string, payload: Record<string, unknown> = {}) => {
    if (!activeDevice) return;
    Alert.alert('Xác nhận lệnh', `Bạn có chắc muốn gửi lệnh [${command}] tới ${activeDevice.name}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Thực thi',
        onPress: () =>
          sendCommandMutation.mutate({
            deviceId: activeDevice.id,
            command,
            payload,
          }),
      },
    ]);
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchCommands()]);
    setRefreshing(false);
  }, [refetch, refetchCommands]);

  if (isLoading && !devices) {
    return <LoadingScreen message="Đang tải danh sách thiết bị..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text variant="titleMedium" style={{ fontWeight: '700', color: AppColors.text }}>
          Thiết bị IoT ({devices?.length || 0})
        </Text>
        <Button
          mode="contained"
          compact
          icon="radar"
          buttonColor={AppColors.primary}
          onPress={() => {
            refetchAvailable();
            setScanModalVisible(true);
          }}
        >
          Tìm & Kết Nối ESP32
        </Button>
      </View>

      {(!devices || devices.length === 0) ? (
        <Card style={{ marginBottom: 20, borderColor: AppColors.outline }} mode="outlined">
          <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
            <MaterialCommunityIcons name="radar" size={52} color={AppColors.textSecondary} />
            <Text variant="titleMedium" style={{ fontWeight: '700', marginTop: 10, color: AppColors.text, textAlign: 'center' }}>
              Vườn này chưa kết nối thiết bị ESP32 nào
            </Text>
            <Text variant="bodySmall" style={{ color: AppColors.textSecondary, textAlign: 'center', marginVertical: 10, paddingHorizontal: 20 }}>
              Hãy tìm kiếm và kết nối thiết bị ESP32 để kích hoạt số liệu cảm biến thời gian thực và công tắc điều khiển máy bơm, quạt.
            </Text>
            <Button
              mode="contained"
              icon="magnify"
              buttonColor={AppColors.primary}
              onPress={() => {
                refetchAvailable();
                setScanModalVisible(true);
              }}
            >
              Quét & Kết Nối Thiết Bị Ngay
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <>
          {/* Device Tabs / List */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.devicePickerScroll}>
            {devices.map((device) => {
              const isSelected = (activeDevice?.id === device.id);
              return (
                <Chip
                  key={device.id}
                  icon="chip"
                  selected={isSelected}
                  onPress={() => setSelectedDeviceId(device.id)}
                  style={[styles.deviceChip, isSelected && styles.deviceChipSelected]}
                  textStyle={isSelected ? styles.deviceChipTextSelected : styles.deviceChipText}
                >
                  {device.name} ({device.status})
                </Chip>
              );
            })}
          </ScrollView>

          {activeDevice && (
            <>
              {/* Device Overview Card */}
              <Card style={styles.deviceCard} mode="elevated">
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.headerTitleArea}>
                      <Text variant="titleLarge" style={styles.deviceName}>
                        {activeDevice.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.deviceCode}>
                        Mã: {activeDevice.code} • Loại: {activeDevice.deviceType}
                      </Text>
                    </View>

                    <Chip
                      icon="circle"
                      compact
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor:
                            activeDevice.status === 'ONLINE'
                              ? AppColors.successContainer
                              : AppColors.errorContainer,
                        },
                      ]}
                      textStyle={{
                        color:
                          activeDevice.status === 'ONLINE' ? AppColors.success : AppColors.error,
                        fontWeight: '700',
                      }}
                    >
                      {activeDevice.status}
                    </Chip>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      MAC Address:
                    </Text>
                    <Text variant="bodySmall" style={styles.infoVal}>
                      {activeDevice.macAddress || '24:6F:28:XX:XX:XX'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      IP Address:
                    </Text>
                    <Text variant="bodySmall" style={styles.infoVal}>
                      {activeDevice.ipAddress || '192.168.1.120'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      Cập nhật cuối:
                    </Text>
                    <Text variant="bodySmall" style={styles.infoVal}>
                      {activeDevice.lastSeenAt
                        ? new Date(activeDevice.lastSeenAt).toLocaleString('vi-VN')
                        : 'Vừa xong'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { marginTop: 8 }]}>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      Vườn canh tác:
                    </Text>
                    <Text variant="bodySmall" style={[styles.infoVal, { color: AppColors.primary, fontWeight: '700' }]}>
                      {activeDevice.zone?.farm?.name ? `${activeDevice.zone.farm.name} - ${activeDevice.zone.name}` : (activeDevice.zone?.name || 'Vườn Mặc Định')}
                    </Text>
                  </View>

                  <Button
                    mode="outlined"
                    icon="swap-horizontal"
                    style={{ marginTop: 12, borderColor: AppColors.primary }}
                    textColor={AppColors.primary}
                    onPress={() => {
                      setTargetZoneId(activeDevice.zoneId || null);
                      setAssignDialogVisible(true);
                    }}
                  >
                    Đổi Vườn / Khu Vực Canh Tác
                  </Button>

                  {/* Hành động nhanh: Hủy kết nối & Xóa */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <Button
                      mode="outlined"
                      compact
                      icon="link-off"
                      textColor={AppColors.secondary}
                      style={{ flex: 1, borderColor: AppColors.secondary }}
                      loading={unpairMutation.isPending}
                      onPress={() => handleUnpair(activeDevice)}
                    >
                      Hủy kết nối
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      icon="trash-can-outline"
                      textColor={AppColors.error}
                      style={{ flex: 1, borderColor: AppColors.error }}
                      loading={deleteDeviceMutation.isPending}
                      onPress={() => handleDeleteDevice(activeDevice)}
                    >
                      Xóa thiết bị
                    </Button>
                  </View>
                </Card.Content>
              </Card>

              {/* Control Panel */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
                <Text variant="titleMedium" style={styles.subHeader}>
                  Bảng điều khiển Relay
                </Text>
                <Button
                  mode="text"
                  compact
                  textColor={AppColors.primary}
                  onPress={() => router.push('/irrigation' as any)}
                >
                  Tưới tiêu nâng cao ❯
                </Button>
              </View>

              <View style={styles.controlGrid}>
                <Card style={styles.controlCard} mode="outlined">
                  <Card.Content style={styles.controlCardContent}>
                    <MaterialCommunityIcons name="water-pump" size={32} color={AppColors.primary} />
                    <Text variant="titleSmall" style={styles.controlTitle}>
                      Máy Bơm Nước
                    </Text>
                    <View style={styles.btnGroup}>
                      <Button
                        mode="contained"
                        compact
                        buttonColor={AppColors.primary}
                        loading={sendCommandMutation.isPending}
                        onPress={() => handleSendCommand('PUMP_ON', { duration: 60 })}
                        style={styles.actionBtn}
                      >
                        Bật
                      </Button>
                      <Button
                        mode="outlined"
                        compact
                        textColor={AppColors.error}
                        loading={sendCommandMutation.isPending}
                        onPress={() => handleSendCommand('PUMP_OFF')}
                        style={styles.actionBtn}
                      >
                        Tắt
                      </Button>
                    </View>
                  </Card.Content>
                </Card>

                <Card style={styles.controlCard} mode="outlined">
                  <Card.Content style={styles.controlCardContent}>
                    <MaterialCommunityIcons name="fan" size={32} color={AppColors.secondary} />
                    <Text variant="titleSmall" style={styles.controlTitle}>
                      Quạt Thông Gió
                    </Text>
                    <View style={styles.btnGroup}>
                      <Button
                        mode="contained"
                        compact
                        buttonColor={AppColors.secondary}
                        loading={sendCommandMutation.isPending}
                        onPress={() => handleSendCommand('FAN_ON', { speed: 100 })}
                        style={styles.actionBtn}
                      >
                        Bật
                      </Button>
                      <Button
                        mode="outlined"
                        compact
                        textColor={AppColors.error}
                        loading={sendCommandMutation.isPending}
                        onPress={() => handleSendCommand('FAN_OFF')}
                        style={styles.actionBtn}
                      >
                        Tắt
                      </Button>
                    </View>
                  </Card.Content>
                </Card>

                <Card style={styles.controlCard} mode="outlined">
                  <Card.Content style={styles.controlCardContent}>
                    <MaterialCommunityIcons name="pipe-valve" size={32} color={AppColors.info} />
                    <Text variant="titleSmall" style={styles.controlTitle}>
                      Van Điện Từ
                    </Text>
                    <View style={styles.btnGroup}>
                      <Button
                        mode="contained"
                        compact
                        buttonColor={AppColors.info}
                        loading={sendCommandMutation.isPending}
                        onPress={() => handleSendCommand('VALVE_OPEN')}
                        style={styles.actionBtn}
                      >
                        Mở
                      </Button>
                      <Button
                        mode="outlined"
                        compact
                        textColor={AppColors.error}
                        loading={sendCommandMutation.isPending}
                        onPress={() => handleSendCommand('VALVE_CLOSE')}
                        style={styles.actionBtn}
                      >
                        Đóng
                      </Button>
                    </View>
                  </Card.Content>
                </Card>

                <Card style={styles.controlCard} mode="outlined">
                  <Card.Content style={styles.controlCardContent}>
                    <MaterialCommunityIcons name="restart" size={32} color={AppColors.error} />
                    <Text variant="titleSmall" style={styles.controlTitle}>
                      Khởi Động Lại
                    </Text>
                    <View style={styles.btnGroup}>
                      <Button
                        mode="contained"
                        compact
                        buttonColor={AppColors.error}
                        loading={sendCommandMutation.isPending}
                        onPress={() => handleSendCommand('REBOOT')}
                        style={[styles.actionBtn, { width: '100%' }]}
                      >
                        Reboot ESP32
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              </View>

              {/* Command History */}
              <Text variant="titleMedium" style={styles.subHeader}>
                Lịch sử Lệnh Gần Đây
              </Text>

              {(!commands || commands.length === 0) ? (
                <Text variant="bodySmall" style={styles.emptyText}>
                  Chưa có lịch sử lệnh nào cho thiết bị này.
                </Text>
              ) : (
                commands.map((cmd) => (
                  <Card key={cmd.id} style={styles.historyCard} mode="outlined">
                    <Card.Content style={styles.historyContent}>
                      <View style={styles.historyLeft}>
                        <Text variant="labelLarge" style={styles.cmdType}>
                          {cmd.commandType}
                        </Text>
                        <Text variant="bodySmall" style={styles.cmdTime}>
                          {new Date(cmd.createdAt).toLocaleTimeString('vi-VN')} -{' '}
                          {new Date(cmd.createdAt).toLocaleDateString('vi-VN')}
                        </Text>
                      </View>
                      <Chip
                        compact
                        style={[
                          styles.cmdStatusChip,
                          {
                            backgroundColor:
                              cmd.status === 'ACKNOWLEDGED'
                                ? AppColors.successContainer
                                : cmd.status === 'SENT'
                                ? AppColors.infoContainer
                                : AppColors.surfaceVariant,
                          },
                        ]}
                        textStyle={{
                          color:
                            cmd.status === 'ACKNOWLEDGED'
                              ? AppColors.success
                              : cmd.status === 'SENT'
                              ? AppColors.info
                              : AppColors.textSecondary,
                          fontSize: 10,
                          fontWeight: '700',
                        }}
                      >
                        {cmd.status}
                      </Chip>
                    </Card.Content>
                  </Card>
                ))
              )}
            </>
          )}
        </>
      )}

      {/* Dialog Chuyển Gán ESP32 vào Vườn/Khu vực khác */}
      <Portal>
        <Dialog visible={assignDialogVisible} onDismiss={() => setAssignDialogVisible(false)}>
          <Dialog.Title>Gán ESP32 vào Vườn Canh Tác</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 350, paddingHorizontal: 0 }}>
            <ScrollView>
              <Text variant="bodySmall" style={{ marginHorizontal: 24, marginBottom: 8, color: AppColors.textSecondary }}>
                Chọn Khu Vườn mà bạn muốn gán thiết bị [{activeDevice?.code || activeDevice?.name}] quản lý:
              </Text>
              {allFarms && allFarms.map((farm: any) => (
                <View key={farm.id} style={{ marginBottom: 12 }}>
                  <Text variant="labelLarge" style={{ paddingHorizontal: 24, fontWeight: '700', color: AppColors.primary }}>
                    🌿 {farm.name}
                  </Text>
                  {farm.zones && farm.zones.length > 0 ? (
                    farm.zones.map((z: any) => (
                      <RadioButton.Item
                        key={z.id}
                        label={`${z.name} (${z.code || 'Khu vực'})`}
                        value={z.id}
                        status={targetZoneId === z.id ? 'checked' : 'unchecked'}
                        onPress={() => setTargetZoneId(z.id)}
                        color={AppColors.primary}
                      />
                    ))
                  ) : (
                    <Text variant="bodySmall" style={{ paddingHorizontal: 24, fontStyle: 'italic', color: AppColors.textSecondary }}>
                      (Chưa có khu vực con)
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setAssignDialogVisible(false)}>Hủy</Button>
            <Button
              mode="contained"
              buttonColor={AppColors.primary}
              loading={updateZoneMutation.isPending}
              disabled={!targetZoneId || updateZoneMutation.isPending}
              onPress={() => {
                if (activeDevice && targetZoneId) {
                  updateZoneMutation.mutate({ deviceId: activeDevice.id, zoneId: targetZoneId });
                }
              }}
            >
              Lưu Thay Đổi
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Dialog Tìm Kiếm & Kết Nối Thiết Bị ESP32 vào Vườn */}
        <Dialog visible={scanModalVisible} onDismiss={() => setScanModalVisible(false)}>
          <Dialog.Title style={{ flexDirection: 'row', alignItems: 'center' }}>
            🔍 Quét & Kết Nối Thiết Bị ESP32
          </Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 380, paddingHorizontal: 0 }}>
            <ScrollView>
              <View style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
                <Text variant="bodySmall" style={{ color: AppColors.textSecondary, marginBottom: 12 }}>
                  Danh sách các thiết bị ESP32 phát hiện trên MQTT Broker để kết nối vào Vườn đang quản lý:
                </Text>

                {loadingAvailable ? (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text variant="bodySmall" style={{ color: AppColors.textSecondary, textAlign: 'center' }}>
                      Đang quét tìm thiết bị ESP32...
                    </Text>
                  </View>
                ) : (
                  (availableDevices || []).map((dev: any) => {
                    const isAlreadyHere = dev.currentFarm?.id === selectedFarmId;
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
            <Button onPress={() => setScanModalVisible(false)}>Đóng</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    paddingBottom: 40,
  },
  sectionHeader: {
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 12,
  },
  devicePickerScroll: {
    marginBottom: 16,
  },
  deviceChip: {
    marginRight: 8,
    backgroundColor: AppColors.surface,
  },
  deviceChipSelected: {
    backgroundColor: AppColors.primary,
  },
  deviceChipText: {
    color: AppColors.text,
  },
  deviceChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deviceCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleArea: {
    flex: 1,
  },
  deviceName: {
    fontWeight: '700',
    color: AppColors.text,
  },
  deviceCode: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    borderRadius: 8,
  },
  divider: {
    marginVertical: 12,
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
  subHeader: {
    fontWeight: '700',
    color: AppColors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  controlCard: {
    width: '48%',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
  },
  controlCardContent: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  controlTitle: {
    fontWeight: '600',
    color: AppColors.text,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    borderRadius: 8,
  },
  historyCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    marginBottom: 8,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyLeft: {
    flex: 1,
  },
  cmdType: {
    fontWeight: '700',
    color: AppColors.text,
  },
  cmdTime: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  cmdStatusChip: {
    borderRadius: 6,
  },
  emptyText: {
    color: AppColors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
});

