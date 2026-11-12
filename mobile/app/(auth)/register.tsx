import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthService } from '../../src/services/auth.service';
import { AppColors } from '../../src/core/theme';

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setErrorMessage('Vui lòng điền họ tên, email và mật khẩu!');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu nhập lại không khớp!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await AuthService.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        password,
      });

      setSuccessMessage('Đăng ký thành công! Đang chuyển đến màn hình đăng nhập...');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      setErrorMessage(msg);
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
            <MaterialCommunityIcons name="account-plus" size={36} color={AppColors.primary} />
          </Surface>
          <Text variant="headlineSmall" style={styles.appName}>
            Tạo tài khoản mới
          </Text>
          <Text variant="bodyMedium" style={styles.appSub}>
            Tham gia quản lý trang trại thông minh Farm Home
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
            label="Họ và tên"
            mode="outlined"
            value={fullName}
            onChangeText={(txt) => {
              setFullName(txt);
              setErrorMessage(null);
            }}
            left={<TextInput.Icon icon="account-outline" />}
            style={styles.input}
            outlineColor={AppColors.outline}
            activeOutlineColor={AppColors.primary}
          />

          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
            outlineColor={AppColors.outline}
            activeOutlineColor={AppColors.primary}
          />

          <TextInput
            label="Số điện thoại (tùy chọn)"
            mode="outlined"
            value={phoneNumber}
            onChangeText={(txt) => setPhoneNumber(txt)}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone-outline" />}
            style={styles.input}
            outlineColor={AppColors.outline}
            activeOutlineColor={AppColors.primary}
          />

          <TextInput
            label="Mật khẩu"
            mode="outlined"
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
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
            label="Xác nhận mật khẩu"
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
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading || !!successMessage}
            style={styles.submitBtn}
            contentStyle={styles.btnContent}
          >
            Đăng ký tài khoản
          </Button>
        </Surface>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            Đã có tài khoản?{' '}
          </Text>
          <Button
            mode="text"
            compact
            onPress={() => router.push('/(auth)/login')}
            textColor={AppColors.primary}
          >
            Đăng nhập
          </Button>
        </View>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontWeight: '700',
    color: AppColors.primaryDark,
  },
  appSub: {
    color: AppColors.textSecondary,
    marginTop: 4,
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
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  btnContent: {
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: AppColors.textSecondary,
  },
});

