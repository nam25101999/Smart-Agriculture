# BÁO CÁO BÀI LAB 2: XÂY DỰNG VÀ QUẢN TRỊ BROKER MQTT
**Học phần:** Internet of Things & Phát triển Ứng dụng Di động  
**Đề tài:** Hệ Thống Nông Nghiệp Thông Minh (Smart Agriculture IoT)  
**Nhóm tác giả:** Smart Agriculture Team  

---

## 1. MỤC TIÊU BÀI LAB
- Cài đặt, cấu hình và vận hành Broker MQTT hiệu năng cao đóng vai trò trung gian trao đổi thông điệp tin cậy.
- Thiết lập tệp cấu hình cổng TCP chuẩn (1883) và WebSocket (9001).
- Kiểm soát chất lượng dịch vụ QoS (0, 1, 2), cấu hình cơ chế tin nhắn lưu trữ (Retain) và bản tin di chúc (LWT).
- Triển khai giải pháp bảo mật nhiều lớp: Xác thực danh tính người dùng (Authentication) và phân quyền kiểm soát truy cập Topic (ACL).
- Xây dựng kịch bản kiểm thử tự động, đo kiểm khả năng kết nối đồng thời nhiều client và ghi nhật ký hoạt động (Logging).

---

## 2. CÀI ĐẶT VÀ CẤU HÌNH BROKER (0.5 ĐIỂM)

### 2.1. Công nghệ lựa chọn
- **Hệ thống Broker:** Eclipse Mosquitto v2.0.18 triển khai qua Docker Container.
- **Tính năng mở rộng:** Hỗ trợ lưu trữ trạng thái phiên làm việc (Persistence Storage), kết nối đồng thời không giới hạn.

### 2.2. Chi tiết tệp cấu hình `mosquitto.conf`
Tệp cấu hình chính được lưu trữ tại `broker/config/mosquitto.conf`:
- **Listener 1 (Cổng 1883 - MQTT TCP):** Dành cho các client mạng nội bộ, ESP32 và Máy chủ Node.js Backend kết nối ổn định.
- **Listener 2 (Cổng 9001 - WebSockets):** Dành cho ứng dụng Web hoặc App Mobile kết nối trực tiếp từ trình duyệt/môi trường Web.
- **Persistence:** Kích hoạt `persistence true`, ghi dữ liệu phiên xuống thư mục `/mosquitto/data/`.
- **Nhật ký:** Cấu hình xuất log đa kênh: `log_dest file /mosquitto/log/mosquitto.log` và `log_dest stdout` với mức chi tiết đầy đủ (Error, Warning, Notice, Information).

### 2.3. Lệnh triển khai Docker
```powershell
cd broker
docker compose up -d
```

---

## 3. HOẠT ĐỘNG CỦA BROKER: QOS, RETAIN, LWT (0.5 ĐIỂM)

### 3.1. Các mức chất lượng dịch vụ (QoS) được áp dụng
- **QoS 0 (At most once):** Áp dụng cho các bản tin telemetry định kỳ không quá quan trọng (nếu mất 1 mẫu dữ liệu nhiệt độ thì 10s sau có mẫu mới).
- **QoS 1 (At least once):** Áp dụng bắt buộc cho:
  - Bản tin Lệnh điều khiển thiết bị: `smartagri/devices/+/commands`.
  - Bản tin Phản hồi xác nhận lệnh (ACK): `smartagri/devices/+/ack`.
  - Bản tin Cảnh báo sự cố khẩn cấp (Alerts).
  Đảm bảo gói tin luôn đến đích và có cờ xác nhận `PUBACK`.

### 3.2. Cơ chế Retained Message
- Được sử dụng cho topic trạng thái thiết bị: `smartagri/devices/+/status`.
- Khi Broker nhận bản tin trạng thái có cờ `retain = true`, Broker sẽ lưu bản tin mới nhất này vào bộ nhớ. Bất kỳ Mobile App hoặc Backend nào kết nối vào sau đó đều nhận được trạng thái của thiết bị ngay lập tức mà không cần đợi ESP32 phát lại.

### 3.3. Cơ chế Di chúc (Last Will and Testament - LWT)
- Khi ESP32 kết nối với Broker, nó đăng ký bản tin LWT:
  - Topic: `smartagri/devices/ESP32_ZONE_01/status`
  - Payload: `{"deviceId":"ESP32_ZONE_01","status":"OFFLINE"}`
- Nếu ESP32 bị mất điện đột ngột hoặc rớt mạng, Broker sẽ tự động gửi bản tin này cho Backend và Mobile App để thông báo thiết bị đã mất kết nối.

---

## 4. BẢO MẬT VÀ PHÂN QUYỀN TRUY CẬP (0.4 ĐIỂM)

### 4.1. Xác thực người dùng (Authentication)
Cấu hình `allow_anonymous false` (nghiêm cấm mọi kết nối không danh tính). Danh sách tài khoản được băm mã hóa một chiều qua thuật toán SHA-512 PBKDF2:

| Tên người dùng (Username) | Mật khẩu giải mã | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| `esp32_device` | `Esp32@SmartAgri2026` | Dành cho mạch vi điều khiển ESP32 |
| `backend_server` | `Backend@SmartAgri2026` | Dành cho Máy chủ Backend Node.js |
| `admin` | `Admin@SmartAgri2026` | Dành cho kỹ thuật viên quản trị hệ thống |

### 4.2. Phân quyền truy cập Topic (Access Control List - ACL)
Nội dung tệp `broker/config/acl.conf`:
```text
# 1. Thiết bị ESP32 chỉ được ghi telemetry/status/ack và đọc commands
user esp32_device
topic write smartagri/devices/+/telemetry
topic write smartagri/devices/+/status
topic write smartagri/devices/+/ack
topic read smartagri/devices/+/commands

# 2. Máy chủ Backend có quyền đọc ghi toàn bộ nhánh dữ liệu nông nghiệp
user backend_server
topic readwrite smartagri/#

# 3. Quản trị viên có toàn quyền kiểm soát
user admin
topic readwrite #
topic read $SYS/#
```
*Lợi ích:* Ngăn chặn tuyệt đối việc thiết bị IoT bị tấn công chiếm quyền đọc trộm dữ liệu của các nông trại khác hoặc gửi lệnh điều khiển giả mạo.

---

## 5. KIỂM THỬ VÀ MINH CHỨNG HOẠT ĐỘNG (0.2 ĐIỂM)

### 5.1. Kịch bản kiểm thử tự động
Hệ thống xây dựng kịch bản kiểm thử `broker/scripts/test-broker.js` gồm 5 trường hợp kiểm thử tự động:
1. **Kiểm thử Xác thực:** Đăng nhập đúng thông tin -> Thành công. Đăng nhập sai mật khẩu -> Broker ngắt kết nối với mã lỗi từ chối.
2. **Kiểm thử Pub/Sub QoS 1:** Gửi bản tin telemetry mẫu -> Nhận chính xác nội dung trong vòng < 50ms.
3. **Kiểm thử Retain Message:** Gửi bản tin trạng thái retain -> Client kết nối sau nhận được ngay lập tức.
4. **Kiểm thử ACL Vi phạm:** Client `esp32_device` cố tình gửi vào topic `smartagri/admin/secret` -> Broker lập tức chặn và hủy gói tin.
5. **Kiểm thử Tải đồng thời:** Khởi tạo đồng thời 10+ kết nối client khác nhau -> Không xuất hiện tình trạng rớt kết nối hoặc nghẽn hàng đợi.

### 5.2. Nhật ký minh chứng kết quả (Log Output)
```text
================================================================
🧪 BẮT ĐẦU KIỂM THỬ BROKER MQTT - SMART AGRICULTURE (LAB 2)
Đích kiểm thử: mqtt://127.0.0.1:1883
================================================================

▶ Test 1: Kiểm thử Xác thực bảo mật (Authentication)...
  ✓ Đăng nhập thành công với tài khoản "backend_server"!

▶ Test 2: Kiểm thử Publish / Subscribe (QoS 1)...
  ✓ Nhận tin nhắn thành công tại Topic: smartagri/devices/ESP32_ZONE_01/telemetry
  ✓ Nội dung: {"deviceId":"ESP32_ZONE_01","temperature":29.5,"humidity":68.0}

▶ Test 3: Kiểm thử Retain Message...
  ✓ Nhận Retained Message thành công sau khi kết nối: {"status":"ONLINE","retainTest":true}

▶ Test 4: Kiểm thử Phân quyền Topic (ACL)...
  ✓ ACL đã chặn thành công gói tin vi phạm quyền!

▶ Test 5: Kiểm thử Kết nối đồng thời nhiều Client (Concurrency)...
  ✓ Kết nối đồng thời thành công 10 clients không nghẽn mạng!

================================================================
KẾT QUẢ KIỂM THỬ BROKER: 5/5 BÀI TEST HOÀN TẤT
================================================================
```

