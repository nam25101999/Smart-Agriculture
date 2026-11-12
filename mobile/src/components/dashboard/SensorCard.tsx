import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../../core/theme';

interface SensorCardProps {
  name: string;
  type: string;
  value?: number;
  unit: string;
  updatedAt?: string;
  status?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  onPress?: () => void;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  name,
  type,
  value,
  unit,
  updatedAt,
  status = 'NORMAL',
  onPress,
}) => {
  const getIcon = (): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (type.toUpperCase()) {
      case 'TEMPERATURE':
        return 'thermometer';
      case 'HUMIDITY':
        return 'water-percent';
      case 'SOIL_MOISTURE':
        return 'sprout';
      case 'LIGHT':
        return 'white-balance-sunny';
      default:
        return 'chip';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'CRITICAL':
        return AppColors.error;
      case 'WARNING':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  };

  const statusColor = getStatusColor();

  return (
    <Card style={styles.card} mode="elevated" onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 6 }}>
            <View style={[styles.iconContainer, { backgroundColor: `${statusColor}18` }]}>
              <MaterialCommunityIcons name={getIcon()} size={24} color={statusColor} />
            </View>
            <Text variant="labelMedium" style={styles.title} numberOfLines={1}>
              {name}
            </Text>
          </View>
          {onPress && (
            <MaterialCommunityIcons name="chevron-right" size={18} color={AppColors.textSecondary} />
          )}
        </View>

        <View style={styles.valueRow}>
          <Text variant="headlineMedium" style={[styles.value, { color: statusColor }]}>
            {value !== undefined ? value.toFixed(1) : '--'}
          </Text>
          <Text variant="titleMedium" style={styles.unit}>
            {unit}
          </Text>
        </View>

        {updatedAt && (
          <Text variant="bodySmall" style={styles.time}>
            Cập nhật: {new Date(updatedAt).toLocaleTimeString('vi-VN')}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    flex: 1,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  value: {
    fontWeight: '700',
  },
  unit: {
    marginLeft: 6,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  time: {
    color: AppColors.outline,
    marginTop: 4,
  },
});

