import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../../src/core/theme';
import { apiClient } from '../../src/core/api/api-client';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      // Giả lập hoặc gọi API gửi mã
      await new Promise((r) => setTimeout(r, 1000));
      setMessage('Mã xác nhận khôi phục mật khẩu đã được gửi đến email của bạn.');
      setTimeout(() => {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email: email.trim() },
        });
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể gửi mã khôi phục!');
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
            <MaterialCommunityIcons name="lock-question" size={42} color={AppColors.primary} />
          </Surface>
          <Text variant="headlineSmall" style={styles.title}>
            Quên mật khẩu?
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu
          </Text>
        </View>

        <Surface style={styles.formCard} elevation={1}>
          {errorMessage && (
            <HelperText type="error" visible={true} style={styles.helperText}>
              {errorMessage}
            </HelperText>
          )}

          {message && (
            <HelperText type="info" visible={true} style={[styles.helperText, { color: AppColors.success }]}>
              {message}
            </HelperText>
          )}

          <TextInput
            label="Email tài khoản"
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

          <Button
            mode="contained"
            onPress={handleSendCode}
            loading={isLoading}
            disabled={isLoading || !!message}
            style={styles.submitBtn}
            contentStyle={styles.btnContent}
          >
            Gửi mã xác nhận
          </Button>
        </Surface>

        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => router.back()}
          textColor={AppColors.primary}
          style={styles.backBtn}
        >
          Quay lại Đăng nhập
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
    marginBottom: 28,
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
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: AppColors.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  input: {
    marginBottom: 14,
    backgroundColor: AppColors.surface,
  },
  helperText: {
    marginBottom: 8,
    fontSize: 13,
  },
  submitBtn: {
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

