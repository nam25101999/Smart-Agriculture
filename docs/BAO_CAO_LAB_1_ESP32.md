# BÁO CÁO BÀI LAB 1: THIẾT KẾ VÀ LẬP TRÌNH HỆ THỐNG IOT VỚI ESP32
**Học phần:** Internet of Things & Phát triển Ứng dụng Di động  
**Đề tài:** Hệ Thống Nông Nghiệp Thông Minh (Smart Agriculture IoT)  
**Nhóm tác giả:** Smart Agriculture Team  

---

## 1. MỤC TIÊU BÀI LAB
- Thiết kế sơ đồ nguyên lý phần cứng thu thập dữ liệu nông nghiệp: đo nhiệt độ, độ ẩm không khí, độ ẩm đất.
- Lập trình firmware ESP32 kết nối mạng WiFi, giao tiếp với MQTT Broker.
- Đọc cảm biến định kỳ, đóng gói chuẩn dữ liệu JSON (Telemetry) gửi lên Server.
- Lắng nghe lệnh điều khiển từ xa (Commands) để điều khiển cơ cấu chấp hành (Máy bơm tưới nước, Quạt làm mát) và phản hồi xác nhận (ACK).
- Xử lý mất kết nối (Auto-reconnect) và gửi bản tin di chúc (LWT - Last Will & Testament) khi gặp sự cố.

---

## 2. THIẾT KẾ PHẦN CỨNG & SƠ ĐỒ ĐẤU NỐI (0.4 ĐIỂM)

### 2.1. Danh mục linh kiện sử dụng
1. **Vi điều khiển:** ESP32 DevKit V4 (38 chân, tích hợp WiFi & Bluetooth 2.4GHz).
2. **Cảm biến DHT22:** Đo nhiệt độ (-40°C đến 80°C, sai số ±0.5°C) và độ ẩm không khí (0 - 100% RH).
3. **Biến trở xoay (Potentiometer):** Giả lập cảm biến độ ẩm đất điện dung (Analog ADC 0 - 4095, chuyển đổi sang 0% - 100%).
4. **Cơ cấu chấp hành 1 (LED Xanh lá):** Mô phỏng Rơ-le kích hoạt Máy bơm nước tưới tiêu.
5. **Cơ cấu chấp hành 2 (LED Xanh dương):** Mô phỏng Rơ-le kích hoạt Quạt thông gió làm mát.
6. **Điện trở hạn dòng:** 2 x Điện trở 220Ω bảo vệ LED.

### 2.2. Bảng ánh xạ chân nối (Pin Mapping Table)
| Linh kiện | Chân linh kiện | Chân ESP32 kết nối | Chức năng | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **DHT22** | VCC | 3V3 | Cấp nguồn 3.3V | Cấp nguồn liên tục |
| **DHT22** | GND | GND | Nối đất | |
| **DHT22** | SDA / DATA | **GPIO 15** | Đọc tín hiệu 1-Wire | Tín hiệu số Digital |
| **Biến trở (Độ ẩm đất)** | VCC | 3V3 | Cấp nguồn | |
| **Biến trở (Độ ẩm đất)** | GND | GND | Nối đất | |
| **Biến trở (Độ ẩm đất)** | SIG | **GPIO 34** | Đọc điện áp biến thiên | Chân ADC1_CH6 (Analog) |
| **Bơm nước (LED Green)** | Anode (+) qua 220Ω | **GPIO 2** | Xuất tín hiệu điều khiển | Mức HIGH: Bật, LOW: Tắt |
| **Bơm nước (LED Green)** | Cathode (-) | GND | Nối đất | |
| **Quạt gió (LED Blue)** | Anode (+) qua 220Ω | **GPIO 4** | Xuất tín hiệu điều khiển | Mức HIGH: Bật, LOW: Tắt |
| **Quạt gió (LED Blue)** | Cathode (-) | GND | Nối đất | |

---

## 3. LẬP TRÌNH ĐỌC CẢM BIẾN VÀ ĐIỀU KHIỂN (0.5 ĐIỂM)

### 3.1. Thuật toán đọc cảm biến
- Sử dụng thư viện `DHTesp` tối ưu cho ESP32.
- Đọc giá trị Analog từ GPIO 34 qua hàm `analogRead(PIN_SOIL)` với độ phân giải 12-bit (0 - 4095).
- Công thức chuẩn hóa phần trăm độ ẩm đất:
  $$\text{SoilMoisture (\%)} = \left(\frac{\text{rawAnalog}}{4095.0}\right) \times 100.0$$
- Dữ liệu được đóng gói vào đối tượng JSON cấu trúc chuẩn:
```json
{
  "deviceId": "ESP32_ZONE_01",
  "messageId": "msg-ESP32_ZONE_01-1710320491-1",
  "timestamp": 124500,
  "sensors": {
    "temperature": 29.5,
    "humidity": 65.0,
    "soilMoisture": 42.5
  },
  "battery": 98
}
```

### 3.2. Thuật toán điều khiển ngoại vi và phản hồi ACK
Khi Broker gửi lệnh tới Topic `smartagri/devices/ESP32_ZONE_01/commands`:
1. ESP32 phân tích gói tin JSON qua thư viện `ArduinoJson`.
2. Kiểm tra `commandType`:
   - Nếu là `PUMP_CONTROL`: Lấy giá trị `action` ("ON" hoặc "OFF") -> gán `digitalWrite(PIN_PUMP, HIGH/LOW)`.
   - Nếu là `FAN_CONTROL`: Lấy giá trị `action` ("ON" hoặc "OFF") -> gán `digitalWrite(PIN_FAN, HIGH/LOW)`.
3. Gửi ngay bản tin phản hồi (ACK) về topic `smartagri/devices/ESP32_ZONE_01/ack`:
```json
{
  "commandId": "cmd-uuid-12345",
  "deviceId": "ESP32_ZONE_01",
  "status": "EXECUTED",
  "note": "Command executed successfully",
  "timestamp": 125100
}
```

---

## 4. KẾT NỐI WIFI VÀ GIAO TIẾP VỚI BROKER MQTT (0.5 ĐIỂM)

### 4.1. Thông số kết nối
- **WiFi SSID:** `Wokwi-GUEST` (Không mật khẩu).
- **MQTT Broker:** `broker.emqx.io` (hoặc Mosquitto nội bộ `192.168.1.x:1883`).
- **Port:** `1883`.
- **Client ID:** Sinh ngẫu nhiên theo định dạng `ESP32_ZONE_01-XXXX` để tránh xung đột kết nối.

### 4.2. Danh mục Topic MQTT sử dụng
1. `smartagri/devices/ESP32_ZONE_01/telemetry`: ESP32 Publish số liệu định kỳ mỗi 10 giây (QoS 0 hoặc 1).
2. `smartagri/devices/ESP32_ZONE_01/status`: ESP32 thông báo trạng thái `ONLINE` (Retain = true) và đăng ký bản tin di chúc `OFFLINE` (LWT).
3. `smartagri/devices/ESP32_ZONE_01/commands`: ESP32 Subscribe để đón nhận lệnh điều khiển thời gian thực.
4. `smartagri/devices/ESP32_ZONE_01/ack`: ESP32 Publish báo cáo kết quả thực thi lệnh.

---

## 5. CHẤT LƯỢNG MÃ NGUỒN VÀ XỬ LÝ LỖI (0.2 ĐIỂM)

- **Cơ chế tự phục hồi kết nối (`reconnectMQTT`):** Trong hàm `loop()`, nếu phát hiện `!mqttClient.connected()`, hệ thống lập tức gọi hàm kết nối lại, thử lặp lại sau mỗi 3 giây mà không làm treo vi điều khiển.
- **Quản lý bộ nhớ:** Sử dụng `StaticJsonDocument` với kích thước cấp phát cố định, tránh hiện tượng phân mảnh bộ nhớ RAM trên vi điều khiển ESP32 khi chạy thời gian dài.
- **Nhật ký Serial Monitor:** In đầy đủ thông báo trạng thái, IP nhận được, payload gửi/nhận rõ ràng bằng tiếng Việt.

---

## 6. MINH CHỨNG KẾT QUẢ MÔ PHỎNG (HÌNH ẢNH MINH HỌA)

> *Gợi ý khi nộp bài: Chụp 2 ảnh từ trang Wokwi để chèn vào vị trí này:*
1. **Hình 1: Mạch mô phỏng Wokwi đang chạy** (Đèn LED Bơm sáng xanh khi nhận lệnh bật, Serial Monitor hiển thị bản tin Telemetry gửi thành công).
2. **Hình 2: Serial Monitor** hiển thị quá trình kết nối WiFi, đồng bộ thời gian và nhận lệnh điều khiển.

