import { prisma } from '../src/infrastructure/database/prisma.client.js';
import mqtt from 'mqtt';
import { env } from '../src/shared/config/env.js';

async function main() {
  console.log('========================================================');
  console.log('🔍 KIỂM TRA THIẾT BỊ VÀ DỮ LIỆU ESP32 TRONG DATABASE');
  console.log('========================================================');

  // 1. Kiểm tra danh sách Farm
  const farms = await prisma.farm.findMany({
    include: {
      zones: {
        include: {
          devices: {
            include: {
              sensors: true,
            },
          },
        },
      },
    },
  });

  console.log(`\n1. Danh sách Nông trại & Thiết bị hiện có (${farms.length} farms):`);
  if (farms.length === 0) {
    console.log('⚠️  Chưa có Nông trại nào trong Database.');
  } else {
    for (const f of farms) {
      console.log(`- Farm: [${f.code}] ${f.name} (ID: ${f.id})`);
      for (const z of f.zones) {
        console.log(`  └─ Zone: ${z.name} (ID: ${z.id})`);
        for (const d of z.devices) {
          console.log(`     └─ Device: [${d.deviceCode}] ${d.name} | Status: ${d.status} | Last seen: ${d.lastSeenAt || 'Never'}`);
          for (const s of d.sensors) {
            console.log(`        └─ Sensor: ${s.sensorType} (${s.metricName} - ${s.unit})`);
          }
        }
      }
    }
  }

  // 2. Kiểm tra dữ liệu Telemetry mới nhất trong Database
  const telemetries = await prisma.telemetry.findMany({
    take: 10,
    orderBy: { recordedAt: 'desc' },
    include: {
      device: { select: { deviceCode: true, name: true } },
    },
  });

  console.log(`\n2. Dữ liệu Telemetry gần nhất trong Database (${telemetries.length} bản ghi):`);
  if (telemetries.length === 0) {
    console.log('⚠️  Chưa có bản ghi Telemetry nào được lưu vào Database.');
  } else {
    for (const t of telemetries) {
      console.log(`[${t.recordedAt.toISOString()}] Thiết bị: ${t.device.deviceCode} | Chỉ số: ${t.metric} = ${t.value} ${t.unit || ''} (msgId: ${t.messageId})`);
    }
  }

  // 3. Lắng nghe trực tiếp trên EMQX MQTT Broker trong 10 giây xem có ESP32 nào đang gửi tin không
  console.log('\n3. Đang kết nối EMQX MQTT Broker và lắng nghe topic "smartagri/devices/+/telemetry" trong 10 giây...');
  
  const client = mqtt.connect(env.MQTT_BROKER_URL, {
    clientId: `check_script_${Date.now()}`,
    connectTimeout: 5000,
  });

  let receivedCount = 0;

  client.on('connect', () => {
    console.log('✓ Đã kết nối MQTT Broker thành công. Đang chờ gói tin từ ESP32/Wokwi...');
    client.subscribe('smartagri/devices/+/telemetry');
    client.subscribe('smartagri/devices/+/status');
  });

  client.on('message', (topic, payload) => {
    receivedCount++;
    console.log(`\n📩 [NHẬN TÍN HIỆU TỪ BROKER] Topic: ${topic}`);
    console.log(`Payload: ${payload.toString()}`);
  });

  await new Promise((resolve) => setTimeout(resolve, 10000));

  client.end();
  console.log(`\nKết thúc lắng nghe MQTT. Tổng số gói tin bắt được: ${receivedCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Lỗi khi kiểm tra:', e);
  process.exit(1);
});

