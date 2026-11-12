import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const AppColors = {
  primary: '#2E7D32',
  primaryLight: '#81C784',
  primaryDark: '#1B5E20',
  primaryContainer: '#E8F5E9',
  secondary: '#FFA000',
  secondaryContainer: '#FFF8E1',
  background: '#F6F8F6',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF2EE',
  text: '#1C1B1F',
  textSecondary: '#49454F',
  outline: '#C2C8C1',
  error: '#D32F2F',
  errorContainer: '#FFEBEE',
  warning: '#F57C00',
  warningContainer: '#FFF3E0',
  success: '#388E3C',
  successContainer: '#E8F5E9',
  info: '#1976D2',
  infoContainer: '#E3F2FD',
  offline: '#9E9E9E',
};

export const AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: AppColors.primary,
    primaryContainer: AppColors.primaryContainer,
    secondary: AppColors.secondary,
    secondaryContainer: AppColors.secondaryContainer,
    background: AppColors.background,
    surface: AppColors.surface,
    surfaceVariant: AppColors.surfaceVariant,
    error: AppColors.error,
    errorContainer: AppColors.errorContainer,
    outline: AppColors.outline,
  },
  roundness: 12,
};

