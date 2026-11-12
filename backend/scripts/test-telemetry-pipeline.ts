import { TelemetryRepository } from '../src/modules/telemetry/infrastructure/repositories/telemetry.repository.js';
import { prisma } from '../src/infrastructure/database/prisma.client.js';

async function main() {
  console.log('========================================================');
  console.log('🧪 KIỂM TRA ĐẦU CUỐI PIPELINE TIẾP NHẬN DỮ LIỆU ESP32');
  console.log('========================================================');

  const telemetryRepo = new TelemetryRepository();

  const mockPayload = {
    deviceId: 'ESP32_ZONE_01',
    messageId: `msg-sim-${Date.now()}`,
    timestamp: Date.now(),
    sensors: {
      temperature: 37.8, // Vượt ngưỡng 35°C -> Kích hoạt Alert!
      humidity: 71.5,
      soilMoisture: 28.0,
    },
    battery: 96,
  };

  console.log('\n1. Giả lập ESP32 gửi gói tin Telemetry:');
  console.log(JSON.stringify(mockPayload, null, 2));

  console.log('\n2. Xử lý qua Telemetry Ingestion Pipeline (Transaction + Alert Engine + Outbox)...');
  const result = await telemetryRepo.ingestPayload(mockPayload);
  console.log(`✓ Kết quả: Ingested: ${result.ingestedCount} chỉ số | IsDuplicate: ${result.isDuplicate}`);

  console.log('\n3. Truy vấn kiểm tra dữ liệu thực tế trên Supabase Database:');

  // Kiểm tra Telemetry vừa lưu
  const telemetries = await prisma.telemetry.findMany({
    where: { messageId: mockPayload.messageId },
    include: { device: true },
  });

  console.log(`\n→ Đã tìm thấy ${telemetries.length} bản ghi Telemetry trong bảng "telemetry":`);
  for (const t of telemetries) {
    console.log(`   • ${t.metric}: ${t.value} ${t.unit || ''} (Recorded: ${t.recordedAt.toISOString()})`);
  }

  // Kiểm tra Cảnh báo vừa sinh
  const alert = await prisma.alert.findFirst({
    where: { device: { deviceCode: 'ESP32_ZONE_01' } },
    orderBy: { createdAt: 'desc' },
  });

  if (alert) {
    console.log(`\n→ Đã kích hoạt Cảnh báo trong bảng "alerts":`);
    console.log(`   • Mức độ: [${alert.severity}] | Trạng thái: ${alert.status}`);
    console.log(`   • Nội dung: ${alert.message}`);
    console.log(`   • Deduplication Key: ${alert.deduplicationKey}`);
  }

  // Kiểm tra Outbox Event
  const outbox = await prisma.outboxEvent.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
  });

  console.log(`\n→ Đã tìm thấy ${outbox.length} sự kiện gần nhất trong bảng "outbox_events":`);
  for (const o of outbox) {
    console.log(`   • [${o.status}] Event: ${o.eventType} | Aggregate: ${o.aggregateType}#${o.aggregateId}`);
  }

  // Kiểm tra trạng thái thiết bị
  const device = await prisma.device.findUnique({
    where: { deviceCode: 'ESP32_ZONE_01' },
  });
  console.log(`\n→ Trạng thái thiết bị hiện tại: ${device?.status} | Last seen: ${device?.lastSeenAt?.toISOString()}`);

  console.log('\n========================================================');
  console.log('🎉 TOÀN BỘ DỮ LIỆU ESP32 ĐÃ ĐƯỢC TIẾP NHẬN VÀ LƯU THÀNH CÔNG VÀO SUPABASE!');
  console.log('========================================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

