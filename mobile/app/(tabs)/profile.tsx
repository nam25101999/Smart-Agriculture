import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Surface, Avatar, Button, List, Divider, Portal, Dialog, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '../../src/core/theme';
import { useAuthStore } from '../../src/store/auth-store';
import { AuthService } from '../../src/services/auth.service';
import { SocketService } from '../../src/services/socket.service';
import { ENV } from '../../src/core/config/env';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          SocketService.disconnect();
          await logout();
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới!');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');
      return;
    }

    setChangingPass(true);
    try {
      await AuthService.changePassword(oldPassword, newPassword);
      setPasswordDialogVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thành công', 'Đã đổi mật khẩu thành công!');
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đổi mật khẩu!');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <Surface style={styles.profileHeader} elevation={1}>
        <Avatar.Icon
          size={72}
          icon="account"
          style={styles.avatar}
          color="#FFFFFF"
        />
        <Text variant="titleLarge" style={styles.userName}>
          {user?.fullName || 'Người dùng'}
        </Text>
        <Text variant="bodyMedium" style={styles.userEmail}>
          {user?.email}
        </Text>
        <Surface style={styles.roleSurface} elevation={0}>
          <Text variant="labelSmall" style={styles.roleText}>
            VAI TRÒ: {user?.role || 'FARM_OWNER'}
          </Text>
        </Surface>
      </Surface>

      {/* Account Settings List */}
      <Surface style={styles.sectionCard} elevation={1}>
        <List.Section>
          <List.Subheader style={styles.subHeader}>Tài khoản & Bảo mật</List.Subheader>

          <List.Item
            title="Đổi mật khẩu"
            description="Cập nhật mật khẩu bảo vệ tài khoản"
            left={(props) => <List.Icon {...props} icon="lock-reset" color={AppColors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setPasswordDialogVisible(true)}
          />

          <Divider />

          <List.Item
            title="Số điện thoại"
            description={user?.phoneNumber || 'Chưa cập nhật'}
            left={(props) => <List.Icon {...props} icon="phone" color={AppColors.primary} />}
          />

          <Divider />

          <List.Item
            title="Cài đặt hệ thống & Cảnh báo"
            description="Thông báo đẩy FCM, chế độ tối, cấu hình server"
            left={(props) => <List.Icon {...props} icon="cog" color={AppColors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings' as any)}
          />
        </List.Section>
      </Surface>

      {/* System Information */}
      <Surface style={styles.sectionCard} elevation={1}>
        <List.Section>
          <List.Subheader style={styles.subHeader}>Thông tin Hệ thống</List.Subheader>

          <List.Item
            title="Phiên bản ứng dụng"
            description={`Farm Home Mobile v${ENV.VERSION}`}
            left={(props) => <List.Icon {...props} icon="information-outline" color={AppColors.info} />}
          />

          <Divider />

          <List.Item
            title="Backend Server API"
            description={ENV.API_BASE_URL}
            left={(props) => <List.Icon {...props} icon="server-network" color={AppColors.info} />}
          />

          <Divider />

          <List.Item
            title="Cổng dữ liệu Realtime (Socket)"
            description={ENV.SOCKET_URL}
            left={(props) => <List.Icon {...props} icon="broadcast" color={AppColors.info} />}
          />
        </List.Section>
      </Surface>

      {/* Logout Button */}
      <Button
        mode="outlined"
        icon="logout"
        onPress={handleLogout}
        textColor={AppColors.error}
        style={styles.logoutBtn}
        contentStyle={styles.logoutBtnContent}
      >
        Đăng xuất tài khoản
      </Button>

      {/* Dialog Đổi mật khẩu */}
      <Portal>
        <Dialog visible={passwordDialogVisible} onDismiss={() => setPasswordDialogVisible(false)}>
          <Dialog.Title>Đổi Mật Khẩu</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Mật khẩu hiện tại"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Mật khẩu mới (ít nhất 6 ký tự)"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Xác nhận mật khẩu mới"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPasswordDialogVisible(false)}>Hủy</Button>
            <Button
              mode="contained"
              loading={changingPass}
              disabled={changingPass}
              onPress={handleChangePassword}
            >
              Cập nhật
            </Button>
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
  profileHeader: {
    backgroundColor: AppColors.surface,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: AppColors.primary,
    marginBottom: 12,
  },
  userName: {
    fontWeight: '700',
    color: AppColors.text,
  },
  userEmail: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  roleSurface: {
    backgroundColor: AppColors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  roleText: {
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    marginBottom: 16,
  },
  subHeader: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 8,
    borderColor: AppColors.error,
    borderRadius: 12,
  },
  logoutBtnContent: {
    paddingVertical: 6,
  },
  dialogInput: {
    marginBottom: 12,
    backgroundColor: AppColors.surface,
  },
});
