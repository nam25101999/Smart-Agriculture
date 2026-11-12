# HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH BROKER MQTT (BÀI LAB 2)

Hệ thống Broker MQTT đóng vai trò trung tâm truyền thông dữ liệu cho toàn bộ hệ sinh thái Smart Agriculture giữa các thiết bị ngoại vi ESP32, Máy chủ Backend và Ứng dụng Di động.

---

## 1. Cấu hình Cổng & Dịch vụ (Ports & Protocols)

| Cổng | Giao thức | Mục đích |
| :--- | :--- | :--- |
| **1883** | MQTT TCP | Dành cho ESP32 và Máy chủ Backend kết nối trực tiếp tốc độ cao |
| **9001** | MQTT over WebSockets | Dành cho Web Dashboard hoặc ứng dụng di động kết nối qua trình duyệt |

---

## 2. Bảo mật & Tài khoản xác thực (Authentication)

Hệ thống bật tùy chọn `allow_anonymous false` (từ chối hoàn toàn kết nối ẩn danh) và sử dụng tệp mật khẩu `password_file`:

| Username | Password | Vai trò |
| :--- | :--- | :--- |
| `esp32_device` | `Esp32@SmartAgri2026` | Thiết bị IoT ngoài thực địa gửi telemetry và nhận lệnh |
| `backend_server` | `Backend@SmartAgri2026` | Máy chủ xử lý dữ liệu, kiểm soát luồng outbox và điều khiển |
| `admin` | `Admin@SmartAgri2026` | Quản trị viên theo dõi toàn bộ hệ thống và topic `$SYS/#` |

---

## 3. Phân quyền Topic (Access Control List - ACL)

Tệp `broker/config/acl.conf` quy định chặt chẽ phạm vi hoạt động của từng nhóm client:

1. **`esp32_device`**:
   - `write smartagri/devices/+/telemetry` (Gửi số liệu cảm biến)
   - `write smartagri/devices/+/status` (Báo online/offline với LWT)
   - `write smartagri/devices/+/ack` (Phản hồi thực thi lệnh)
   - `read smartagri/devices/+/commands` (Lắng nghe lệnh điều khiển)
2. **`backend_server`**:
   - `readwrite smartagri/#` (Toàn quyền đọc/ghi trong hệ sinh thái Smart Agriculture)
3. **`admin`**:
   - `readwrite #` và `read $SYS/#` (Toàn quyền hệ thống)

---

## 4. Hướng dẫn Khởi chạy Broker

### Cách 1: Chạy bằng Docker Compose (Khuyên dùng khi nộp bài)
```powershell
cd broker
docker compose up -d
```
Kiểm tra trạng thái container:
```powershell
docker ps
docker logs smartagri-mqtt-broker
```

### Cách 2: Sử dụng Public EMQX Broker (Cho chạy mô phỏng nhanh trên Wokwi)
Khi chạy Wokwi trực tuyến không thể nối mạng vào localhost, dự án hỗ trợ cấu hình trỏ sang `broker.emqx.io:1883`.

---

## 5. Chạy Kịch bản Kiểm thử Tự động (Testing Script)

Để kiểm tra độ ổn định, xác thực, QoS, retain và tải đồng thời:
```powershell
cd broker
node scripts/test-broker.js
```
Kết quả kiểm thử đạt 5/5 bài test thành công:
- ✓ Xác thực tài khoản thành công
- ✓ Truyền nhận QoS 1 tin cậy
- ✓ Lưu và nhận Retained Message
- ✓ Bộ lọc ACL chặn thành công truy cập trái phép
- ✓ Kết nối đồng thời 10+ clients không nghẽn mạng

