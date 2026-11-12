import { prisma } from '../src/infrastructure/database/prisma.client.js';

async function main() {
  console.log('--- KHỞI TẠO NÔNG TRẠI VÀ ĐĂNG KÝ THIẾT BỊ WOKWI ESP32_ZONE_01 ---');

  // 1. Tìm user admin
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@smartagri.vn' },
  });

  if (!admin) {
    console.error('Không tìm thấy user admin@smartagri.vn. Vui lòng chạy pnpm prisma:seed trước.');
    process.exit(1);
  }

  // 2. Tạo Farm mẫu
  const farm = await prisma.farm.upsert({
    where: { code: 'FARM_WOKWI_01' },
    update: {},
    create: {
      name: 'Nông trại Mẫu Công nghệ cao',
      code: 'FARM_WOKWI_01',
      description: 'Nông trại phục vụ thử nghiệm thiết bị mô phỏng Wokwi',
      location: 'Đà Lạt, Lâm Đồng',
      latitude: 11.9404,
      longitude: 108.4583,
      ownerId: admin.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✓ Farm: [${farm.code}] ${farm.name} (ID: ${farm.id})`);

  // 3. Tạo Zone mẫu
  let zone = await prisma.zone.findFirst({
    where: { farmId: farm.id, name: 'Khu vực Nhà kính 01' },
  });

  if (!zone) {
    zone = await prisma.zone.create({
      data: {
        farmId: farm.id,
        name: 'Khu vực Nhà kính 01',
        description: 'Khu vực trồng trọt tự động kết nối ESP32',
        area: 350.0,
        status: 'ACTIVE',
      },
    });
  }
  console.log(`✓ Zone: ${zone.name} (ID: ${zone.id})`);

  // 4. Đăng ký Device ESP32_ZONE_01
  const device = await prisma.device.upsert({
    where: { deviceCode: 'ESP32_ZONE_01' },
    update: {
      zoneId: zone.id,
    },
    create: {
      zoneId: zone.id,
      deviceCode: 'ESP32_ZONE_01',
      name: 'ESP32 Wokwi Simulator',
      deviceType: 'ESP32',
      firmwareVersion: '1.0.0-wokwi',
      status: 'ONLINE',
    },
  });
  console.log(`✓ Device: [${device.deviceCode}] ${device.name} (ID: ${device.id})`);

  // 5. Đăng ký Cảm biến (Sensors)
  const sensors = [
    { sensorType: 'DHT22', metricName: 'temperature', unit: '°C' },
    { sensorType: 'DHT22', metricName: 'humidity', unit: '%' },
    { sensorType: 'SOIL_MOISTURE', metricName: 'soilMoisture', unit: '%' },
  ];

  for (const s of sensors) {
    const existingSensor = await prisma.sensor.findFirst({
      where: { deviceId: device.id, metricName: s.metricName },
    });

    if (!existingSensor) {
      await prisma.sensor.create({
        data: {
          deviceId: device.id,
          sensorType: s.sensorType,
          metricName: s.metricName,
          unit: s.unit,
          status: 'ACTIVE',
        },
      });
      console.log(`  + Đã thêm cảm biến: ${s.metricName} (${s.unit})`);
    }
  }

  // 6. Tạo Alert Rule mẫu để thử nghiệm cảnh báo
  const existingRule = await prisma.alertRule.findFirst({
    where: { farmId: farm.id, metric: 'temperature' },
  });

  if (!existingRule) {
    await prisma.alertRule.create({
      data: {
        farmId: farm.id,
        zoneId: zone.id,
        name: 'Nhiệt độ không khí quá cao (>35°C)',
        metric: 'temperature',
        operator: 'GT',
        thresholdMax: 35.0,
        severity: 'CRITICAL',
        cooldownSeconds: 60,
        enabled: true,
      },
    });
    console.log('✓ Đã tạo Alert Rule mẫu: Nhiệt độ > 35°C');
  }

  console.log('\n🎉 THIẾT BỊ ESP32_ZONE_01 ĐÃ ĐƯỢC ĐĂNG KÝ VÀO DATABASE THÀNH CÔNG!');
  console.log('Bây giờ MQTT Ingestion Worker sẽ tự động tiếp nhận và ghi mọi gói tin từ Wokwi.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

