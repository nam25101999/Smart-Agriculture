import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert as AlertType } from '../../types';
import { AppColors } from '../../core/theme';

interface AlertItemProps {
  alert: AlertType;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
  isProcessing?: boolean;
}

export const AlertItem: React.FC<AlertItemProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  isProcessing = false,
}) => {
  const router = useRouter();
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'CRITICAL':
        return AppColors.error;
      case 'WARNING':
        return AppColors.warning;
      default:
        return AppColors.info;
    }
  };

  const getStatusLabel = () => {
    switch (alert.status) {
      case 'ACTIVE':
        return 'Chưa xử lý';
      case 'ACKNOWLEDGED':
        return 'Đã xác nhận';
      case 'RESOLVED':
        return 'Đã hoàn tất';
      default:
        return alert.status;
    }
  };

  const color = getSeverityColor();

  return (
    <Card
      style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }]}
      mode="elevated"
      onPress={() => router.push({ pathname: '/alerts/[id]', params: { id: alert.id } })}
    >
      <Card.Content>
        <View style={styles.header}>
          <Chip
            textStyle={{ color, fontSize: 11, fontWeight: '700' }}
            style={[styles.badge, { backgroundColor: `${color}1A` }]}
            compact
          >
            {alert.severity}
          </Chip>
          <Text variant="bodySmall" style={styles.time}>
            {new Date(alert.createdAt).toLocaleString('vi-VN')}
          </Text>
        </View>

        <Text variant="titleMedium" style={styles.title}>
          {alert.title}
        </Text>

        <Text variant="bodyMedium" style={styles.message}>
          {alert.message}
        </Text>

        {alert.currentValue !== undefined && alert.thresholdValue !== undefined && (
          <View style={styles.metricRow}>
            <MaterialCommunityIcons name="speedometer" size={16} color={AppColors.textSecondary} />
            <Text variant="bodySmall" style={styles.metricText}>
              Đo được: <Text style={{ fontWeight: '700' }}>{alert.currentValue}</Text> | Ngưỡng:{' '}
              <Text style={{ fontWeight: '700' }}>{alert.thresholdValue}</Text>
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text variant="labelSmall" style={styles.status}>
            Trạng thái: <Text style={{ fontWeight: '600', color }}>{getStatusLabel()}</Text>
          </Text>

          <View style={styles.actions}>
            {alert.status === 'ACTIVE' && onAcknowledge && (
              <Button
                mode="outlined"
                compact
                disabled={isProcessing}
                onPress={() => onAcknowledge(alert.id)}
                style={styles.actionBtn}
              >
                Xác nhận
              </Button>
            )}
            {alert.status !== 'RESOLVED' && onResolve && (
              <Button
                mode="contained"
                compact
                disabled={isProcessing}
                buttonColor={AppColors.primary}
                onPress={() => onResolve(alert.id)}
                style={styles.actionBtn}
              >
                Đã xử lý
              </Button>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    borderRadius: 6,
  },
  time: {
    color: AppColors.outline,
  },
  title: {
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  message: {
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: AppColors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricText: {
    marginLeft: 6,
    color: AppColors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.surfaceVariant,
    paddingTop: 8,
  },
  status: {
    color: AppColors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    borderRadius: 8,
  },
});

