import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../../src/core/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const emailParam = (params.email as string) || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword || !confirmPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới!');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await new Promise((r) => setTimeout(r, 1200));
      setSuccessMessage('Đặt lại mật khẩu thành công! Đang chuyển về màn hình đăng nhập...');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể đặt lại mật khẩu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Surface style={styles.logoSurface} elevation={2}>
            <MaterialCommunityIcons name="shield-key" size={42} color={AppColors.primary} />
          </Surface>
          <Text variant="headlineSmall" style={styles.title}>
            Đặt lại mật khẩu
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Nhập mã xác nhận 6 số đã gửi tới {emailParam || 'email của bạn'}
          </Text>
        </View>

        <Surface style={styles.formCard} elevation={1}>
          {errorMessage && (
            <HelperText type="error" visible={true} style={styles.helperText}>
              {errorMessage}
            </HelperText>
          )}

          {successMessage && (
            <HelperText type="info" visible={true} style={[styles.helperText, { color: AppColors.success }]}>
              {successMessage}
            </HelperText>
          )}

          <TextInput
            label="Mã xác nhận OTP (6 số)"
            mode="outlined"
            value={otp}
            onChangeText={(txt) => {
              setOtp(txt);
              setErrorMessage(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            left={<TextInput.Icon icon="numeric" />}
            style={styles.input}
            outlineColor={AppColors.outline}
            activeOutlineColor={AppColors.primary}
          />

          <TextInput
            label="Mật khẩu mới"
            mode="outlined"
            value={newPassword}
            onChangeText={(txt) => {
              setNewPassword(txt);
              setErrorMessage(null);
            }}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            outlineColor={AppColors.outline}
            activeOutlineColor={AppColors.primary}
          />

          <TextInput
            label="Xác nhận mật khẩu mới"
            mode="outlined"
            value={confirmPassword}
            onChangeText={(txt) => {
              setConfirmPassword(txt);
              setErrorMessage(null);
            }}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-check-outline" />}
            style={styles.input}
            outlineColor={AppColors.outline}
            activeOutlineColor={AppColors.primary}
          />

          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={isLoading}
            disabled={isLoading || !!successMessage}
            style={styles.submitBtn}
            contentStyle={styles.btnContent}
          >
            Lưu mật khẩu mới
          </Button>
        </Surface>

        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => router.replace('/(auth)/login')}
          textColor={AppColors.primary}
          style={styles.backBtn}
        >
          Hủy & Quay lại Đăng nhập
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoSurface: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    color: AppColors.primaryDark,
  },
  subtitle: {
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: AppColors.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: AppColors.surface,
  },
  helperText: {
    marginBottom: 8,
    fontSize: 13,
  },
  submitBtn: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  btnContent: {
    paddingVertical: 6,
  },
  backBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
});

