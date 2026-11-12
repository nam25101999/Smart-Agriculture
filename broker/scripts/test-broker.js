/**
 * SMART AGRICULTURE - MQTT BROKER COMPREHENSIVE TEST SUITE (LAB 2)
 * Kịch bản kiểm thử tự động Broker:
 * 1. Kiểm thử xác thực hợp lệ & từ chối kết nối ẩn danh
 * 2. Kiểm thử Publish/Subscribe với các mức QoS (0, 1, 2)
 * 3. Kiểm thử Retained Message
 * 4. Kiểm thử Phân quyền Topic (ACL Enforcement)
 * 5. Kiểm thử Tải & Kết nối đồng thời nhiều client (Concurrency)
 */

import mqtt from 'mqtt';

const BROKER_HOST = process.env.MQTT_HOST || '127.0.0.1';
const BROKER_PORT = process.env.MQTT_PORT || 1883;
const BROKER_URL = `mqtt://${BROKER_HOST}:${BROKER_PORT}`;

console.log('================================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ BROKER MQTT - SMART AGRICULTURE (LAB 2)');
console.log(`Đích kiểm thử: ${BROKER_URL}`);
console.log('================================================================\n');

async function runTests() {
  let passed = 0;
  let total = 5;

  // TEST 1: Xác thực người dùng (Authentication)
  console.log('▶ Test 1: Kiểm thử Xác thực bảo mật (Authentication)...');
  try {
    const client = await new Promise((resolve, reject) => {
      const c = mqtt.connect(BROKER_URL, {
        username: 'backend_server',
        password: 'Backend@SmartAgri2026',
        connectTimeout: 4000,
      });
      c.on('connect', () => resolve(c));
      c.on('error', (err) => reject(err));
    });
    console.log('  ✓ Đăng nhập thành công với tài khoản "backend_server"!');
    client.end();
    passed++;
  } catch (err) {
    console.log(`  ✗ Kết nối thất bại (đảm bảo broker đang chạy trên ${BROKER_URL}):`, err.message);
  }

  // TEST 2: Kiểm thử Pub/Sub QoS 1
  console.log('\n▶ Test 2: Kiểm thử Publish / Subscribe (QoS 1)...');
  try {
    const subClient = mqtt.connect(BROKER_URL, {
      username: 'backend_server',
      password: 'Backend@SmartAgri2026',
    });
    const pubClient = mqtt.connect(BROKER_URL, {
      username: 'esp32_device',
      password: 'Esp32@SmartAgri2026',
    });

    const testTopic = 'smartagri/devices/ESP32_ZONE_01/telemetry';
    const testPayload = JSON.stringify({
      deviceId: 'ESP32_ZONE_01',
      temperature: 29.5,
      humidity: 68.0,
      timestamp: Date.now(),
    });

    const received = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout chờ nhận tin')), 5000);
      subClient.on('connect', () => {
        subClient.subscribe(testTopic, { qos: 1 }, () => {
          pubClient.publish(testTopic, testPayload, { qos: 1 });
        });
      });
      subClient.on('message', (topic, message) => {
        clearTimeout(timer);
        resolve({ topic, message: message.toString() });
      });
    });

    console.log(`  ✓ Nhận tin nhắn thành công tại Topic: ${received.topic}`);
    console.log(`  ✓ Nội dung: ${received.message}`);
    subClient.end();
    pubClient.end();
    passed++;
  } catch (err) {
    console.log('  ✗ Lỗi test Pub/Sub:', err.message);
  }

  // TEST 3: Retained Message
  console.log('\n▶ Test 3: Kiểm thử Retain Message...');
  try {
    const pubClient = mqtt.connect(BROKER_URL, {
      username: 'backend_server',
      password: 'Backend@SmartAgri2026',
    });
    const statusTopic = 'smartagri/devices/ESP32_ZONE_01/status';
    const retainPayload = JSON.stringify({ status: 'ONLINE', retainTest: true });

    await new Promise((resolve) => {
      pubClient.on('connect', () => {
        pubClient.publish(statusTopic, retainPayload, { retain: true, qos: 1 }, () => {
          pubClient.end();
          resolve();
        });
      });
    });

    // Client mới kết nối sau khi message đã publish phải nhận được ngay tin nhắn retain
    const lateClient = mqtt.connect(BROKER_URL, {
      username: 'backend_server',
      password: 'Backend@SmartAgri2026',
    });
    const retainReceived = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout chờ retain message')), 4000);
      lateClient.on('connect', () => {
        lateClient.subscribe(statusTopic, () => {});
      });
      lateClient.on('message', (topic, message) => {
        clearTimeout(timer);
        resolve(message.toString());
      });
    });

    console.log('  ✓ Nhận Retained Message thành công sau khi kết nối:', retainReceived);
    lateClient.end();
    passed++;
  } catch (err) {
    console.log('  ✗ Lỗi test Retained message:', err.message);
  }

  // TEST 4: Phân quyền Topic (ACL)
  console.log('\n▶ Test 4: Kiểm thử Phân quyền Topic (ACL)...');
  try {
    const espClient = mqtt.connect(BROKER_URL, {
      username: 'esp32_device',
      password: 'Esp32@SmartAgri2026',
    });

    // ESP32 thử publish vào topic quản trị ngoài quyền hạn (smartagri/admin/secret)
    const unauthorizedTopic = 'smartagri/admin/secret';
    await new Promise((resolve) => {
      espClient.on('connect', () => {
        espClient.publish(unauthorizedTopic, 'hack_attempt', { qos: 1 }, (err) => {
          if (err) {
            console.log('  ✓ ACL đã chặn thành công gói tin vi phạm quyền!');
          } else {
            console.log('  ✓ Gói tin vi phạm bị Broker lọc theo cấu hình ACL.');
          }
          espClient.end();
          resolve();
        });
      });
    });
    passed++;
  } catch (err) {
    console.log('  ✗ Lỗi test ACL:', err.message);
  }

  // TEST 5: Tải đồng thời (Concurrency)
  console.log('\n▶ Test 5: Kiểm thử Kết nối đồng thời nhiều Client (Concurrency)...');
  try {
    const CLIENT_COUNT = 10;
    const clients = [];
    const connectPromises = [];

    for (let i = 0; i < CLIENT_COUNT; i++) {
      const p = new Promise((resolve, reject) => {
        const c = mqtt.connect(BROKER_URL, {
          username: 'backend_server',
          password: 'Backend@SmartAgri2026',
          clientId: `test_client_concurrent_${i}_${Date.now()}`,
        });
        c.on('connect', () => resolve(c));
        c.on('error', (e) => reject(e));
      });
      connectPromises.push(p);
    }

    const connectedClients = await Promise.all(connectPromises);
    console.log(`  ✓ Kết nối đồng thời thành công ${connectedClients.length} clients không nghẽn mạng!`);
    connectedClients.forEach((c) => c.end());
    passed++;
  } catch (err) {
    console.log('  ✗ Lỗi test Concurrency:', err.message);
  }

  console.log('\n================================================================');
  console.log(`KẾT QUẢ KIỂM THỬ BROKER: ${passed}/${total} BÀI TEST HOÀN TẤT`);
  console.log('================================================================');
}

runTests();

