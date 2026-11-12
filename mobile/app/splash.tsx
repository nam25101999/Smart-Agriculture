import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../src/core/theme';
import { useAuthStore } from '../src/store/auth-store';
import { TokenStorage } from '../src/core/storage/token-storage';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    const checkNavigation = async () => {
      await initialize();
      const hasSeenOnboarding = await TokenStorage.getOnboardingSeen();

      // Giữ màn hình splash tối thiểu 1.8 giây cho hiệu ứng thương hiệu mượt mà
      setTimeout(() => {
        if (!hasSeenOnboarding) {
          router.replace('/onboarding' as any);
        } else if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1800);
    };

    checkNavigation();
  }, [initialize, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        {/* Brand Icon Surface */}
        <Surface style={styles.logoSurface} elevation={4}>
          <MaterialCommunityIcons name="sprout" size={64} color="#FFFFFF" />
        </Surface>

        {/* Brand Name */}
        <Text variant="displaySmall" style={styles.appName}>
          Farm Home
        </Text>
        <Text variant="titleMedium" style={styles.appSlogan}>
          Nông nghiệp thông minh trong tầm tay
        </Text>
      </View>

      {/* Footer Loading & Version */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginBottom: 12 }} />
        <Text variant="bodySmall" style={styles.versionText}>
          Phiên bản 1.0.0 • IoT Smart Agriculture
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSurface: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appSlogan: {
    color: '#E8F5E9',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  versionText: {
    color: '#C8E6C9',
  },
});

