import { Prisma } from '@prisma/client';
import { prisma } from '../../../../infrastructure/database/prisma.client.js';
import { logger } from '../../../../shared/logger/index.js';

export class AlertEngineService {
  public async evaluateReading(params: {
    farmId: string;
    zoneId: string;
    deviceId: string;
    metric: string;
    value: number;
    recordedAt: Date;
  }): Promise<Prisma.AlertCreateInput | null> {
    const { farmId, zoneId, deviceId, metric, value } = params;

    // 1. Find matching rules for this farm/zone and metric
    const rules = await prisma.alertRule.findMany({
      where: {
        farmId,
        enabled: true,
        metric,
        OR: [{ zoneId: null }, { zoneId }],
      },
    });

    if (rules.length === 0) {
      // Tự động khởi tạo quy tắc cảnh báo chuẩn nông nghiệp theo từng metric nếu chưa có
      let defaultRuleData: any = null;
      if (metric === 'temperature') {
        defaultRuleData = {
          farmId,
          name: 'Nhiệt độ môi trường quá cao',
          metric: 'temperature',
          operator: 'GT',
          thresholdMax: 35,
          severity: 'CRITICAL',
          cooldownSeconds: 60,
          enabled: true,
        };
      } else if (metric === 'soilMoisture') {
        defaultRuleData = {
          farmId,
          name: 'Độ ẩm đất thấp (Khô hạn - Cần tưới)',
          metric: 'soilMoisture',
          operator: 'LT',
          thresholdMin: 40,
          severity: 'CRITICAL',
          cooldownSeconds: 60,
          enabled: true,
        };
      } else if (metric === 'humidity') {
        defaultRuleData = {
          farmId,
          name: 'Độ ẩm không khí thấp',
          metric: 'humidity',
          operator: 'LT',
          thresholdMin: 40,
          severity: 'WARNING',
          cooldownSeconds: 60,
          enabled: true,
        };
      }

      if (defaultRuleData) {
        try {
          const created = await prisma.alertRule.create({ data: defaultRuleData });
          rules.push(created);
          logger.info({ farmId, metric }, '[AlertEngine] Đã tự động tạo quy tắc cảnh báo mặc định cho chỉ số');
        } catch (err: any) {
          logger.warn({ err: err?.message }, '[AlertEngine] Không thể tạo quy tắc mặc định');
        }
      }

      if (rules.length === 0) return null;
    }

    for (const rule of rules) {
      let violated = false;
      const min = rule.thresholdMin ? Number(rule.thresholdMin) : null;
      const max = rule.thresholdMax ? Number(rule.thresholdMax) : null;

      switch (rule.operator) {
        case 'GT':
          if (max !== null && value > max) violated = true;
          break;
        case 'GTE':
          if (max !== null && value >= max) violated = true;
          break;
        case 'LT':
          if (min !== null && value < min) violated = true;
          break;
        case 'LTE':
          if (min !== null && value <= min) violated = true;
          break;
        case 'RANGE':
          if (min !== null && max !== null && (value < min || value > max)) violated = true;
          break;
      }

      if (violated) {
        const deduplicationKey = `${farmId}_${zoneId}_${metric}_${rule.severity}`;

        // 2. Check if active alert already exists within cooldown
        const existingAlert = await prisma.alert.findFirst({
          where: {
            deduplicationKey,
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'desc' },
        });

        const now = new Date();
        if (existingAlert) {
          const elapsedSeconds = (now.getTime() - existingAlert.createdAt.getTime()) / 1000;
          if (elapsedSeconds < rule.cooldownSeconds) {
            // Still in cooldown, update observed value silently
            await prisma.alert.update({
              where: { id: existingAlert.id },
              data: { observedValue: value, updatedAt: now },
            });
            logger.debug({ deduplicationKey, elapsedSeconds }, 'Alert in cooldown period, skipped duplicate notification');
            return null;
          }
        }

        let message = `Cảnh báo [${rule.name}]: Giá trị ${metric} đo được là ${value}, vượt ngưỡng cho phép.`;
        if (metric === 'temperature') {
          message = `🚨 CẢNH BÁO NHIỆT ĐỘ CAO: Nhiệt độ đo được ${value}°C (vượt ngưỡng tối đa ${max ?? 35}°C)! Nguy cơ héo cây, cần bật quạt làm mát ngay!`;
        } else if (metric === 'soilMoisture') {
          message = `🚨 CẢNH BÁO KHÔ HẠN: Độ ẩm đất giảm còn ${value}% (dưới ngưỡng tối thiểu ${min ?? 40}%)! Cần kích hoạt máy bơm nước ngay!`;
        } else if (metric === 'humidity') {
          message = `⚠️ CẢNH BÁO ĐỘ ẨM: Độ ẩm không khí đo được ${value}% ngoài ngưỡng an toàn!`;
        }

        // Return alert payload to be committed in transaction
        return {
          farm: { connect: { id: farmId } },
          zone: { connect: { id: zoneId } },
          device: { connect: { id: deviceId } },
          rule: { connect: { id: rule.id } },
          metric,
          observedValue: value,
          thresholdValue: max ?? min ?? 0,
          severity: rule.severity,
          status: 'ACTIVE',
          deduplicationKey,
          message,
        };
      }
    }

    return null;
  }
}

export const alertEngine = new AlertEngineService();

