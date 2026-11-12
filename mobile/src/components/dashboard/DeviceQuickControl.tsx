import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Switch, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../../core/theme';

interface QuickControlProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  isOn: boolean;
  isLoading?: boolean;
  onToggle: (nextState: boolean) => void;
  disabled?: boolean;
}

export const DeviceQuickControl: React.FC<QuickControlProps> = ({
  title,
  subtitle,
  icon,
  isOn,
  isLoading = false,
  onToggle,
  disabled = false,
}) => {
  return (
    <Card style={[styles.card, isOn && styles.cardActive]} mode="elevated">
      <Card.Content style={styles.content}>
        <View style={[styles.iconWrapper, isOn && styles.iconActive]}>
          <MaterialCommunityIcons
            name={icon}
            size={28}
            color={isOn ? AppColors.surface : AppColors.textSecondary}
          />
        </View>

        <View style={styles.textContainer}>
          <Text variant="titleMedium" style={[styles.title, isOn && styles.textActive]}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={AppColors.primary} />
        ) : (
          <Switch
            value={isOn}
            onValueChange={onToggle}
            disabled={disabled}
            color={AppColors.primary}
          />
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
  },
  cardActive: {
    backgroundColor: AppColors.primaryContainer,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconActive: {
    backgroundColor: AppColors.primary,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    color: AppColors.text,
  },
  textActive: {
    color: AppColors.primaryDark,
  },
  subtitle: {
    color: AppColors.textSecondary,
    marginTop: 2,
  },
});

