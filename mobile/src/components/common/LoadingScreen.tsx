import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { AppColors } from '../../core/theme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Đang tải...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={AppColors.primary} />
      <Text variant="bodyMedium" style={styles.text}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
  text: {
    marginTop: 12,
    color: AppColors.textSecondary,
  },
});

