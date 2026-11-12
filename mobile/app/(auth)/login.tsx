import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth-store';
import { AppColors } from '../../src/core/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('admin@smartagri.vn');
  const [password, setPassword] = useState('Admin@123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password);
      // Chuyển hướng tự động qua RootNavigation
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@smartagri.vn');
    setPassword('Admin@123456');
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Surface style={styles.logoSurface} elevation={2}>
            <MaterialCommunityIcons name="sprout" size={48} color={AppColors.primary} />
          </Surface>
          <Text variant="headlineMedium" style={styles.appName}>
            Farm Home
          </Text>
          <Text variant="bodyMedium" style={styles.appSub}>
            Hệ thống Nông nghiệp Thông minh IoT
          </Text>
        </View>

        <Surface style={styles.formCard} elevation={1}>
          <Text variant="titleLarge" style={styles.formTitle}>
            Đăng nhập
          </Text>

          {errorMessage && (
            <HelperText type="error" visible={true} style={styles.errorText}>
              {errorMessage}
            </HelperText>
          )}

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

          <View style={{ alignItems: 'flex-end', marginBottom: 10 }}>
            <Button
              mode="text"
              compact
              textColor={AppColors.textSecondary}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              Quên mật khẩu?
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.submitBtn}
            contentStyle={styles.btnContent}
          >
            Đăng nhập
          </Button>

          <Button
            mode="text"
            onPress={handleFillDemo}
            textColor={AppColors.secondary}
            style={styles.demoBtn}
          >
            ⚡ Dùng tài khoản mẫu (Admin)
          </Button>
        </Surface>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            Chưa có tài khoản?{' '}
          </Text>
          <Button
            mode="text"
            compact
            onPress={() => router.push('/(auth)/register')}
            textColor={AppColors.primary}
          >
            Đăng ký ngay
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
    marginBottom: 32,
  },
  logoSurface: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AppColors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontWeight: '800',
    color: AppColors.primaryDark,
  },
  appSub: {
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: AppColors.surface,
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 16,
  },
  input: {
    marginBottom: 14,
    backgroundColor: AppColors.surface,
  },
  errorText: {
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
  demoBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerText: {
    color: AppColors.textSecondary,
  },
});

