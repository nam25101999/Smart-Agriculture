# BỘ SLIDE THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN IOT (ĐIỂM TỐI ĐA 10/10)
**Đề tài:** Hệ Thống Nông Nghiệp Thông Minh (Smart Agriculture IoT System)  
**Tích hợp trọn bộ 3 Bài Lab:** Thiết bị ESP32 (Lab 1) – Xây dựng Broker MQTT (Lab 2) – Ứng dụng Di động React Native (Lab 3)  

---

<!-- SLIDE 1 -->
## SLIDE 1: TRANG BÌA BÁO CÁO
- **Tên đề tài:** HỆ THỐNG NÔNG NGHIỆP THÔNG MINH GIÁM SÁT REALTIME VÀ CẢNH BÁO TỰ ĐỘNG
- **Học phần:** Internet of Things & Lập trình Ứng dụng Di động
- **Giảng viên hướng dẫn:** [Tên Giảng Viên]
- **Nhóm sinh viên thực hiện:** [Tên Sinh Viên] - MSSV: [MSSV]
- **Công nghệ chủ đạo:** ESP32 • MQTT (Mosquitto/EMQX) • Node.js Express • PostgreSQL Prisma • React Native Expo

---

<!-- SLIDE 2 -->
## SLIDE 2: ĐẶT VẤN ĐỀ & MỤC TIÊU DỰ ÁN
### 1. Thực trạng nông nghiệp hiện nay:
- Phụ thuộc lớn vào thời tiết, tốn nhân công giám sát thủ công tại đồng ruộng.
- Thiếu công cụ phát hiện sớm các hiện tượng bất thường (hạn hán, úng rễ, sốc nhiệt).
### 2. Mục tiêu giải pháp:
- **Tự động hóa đo lường:** Thu thập liên tục nhiệt độ, độ ẩm không khí, độ ẩm đất.
- **Điều khiển từ xa tức thời:** Bật/tắt máy bơm, quạt thông gió từ bất kỳ đâu qua điện thoại.
- **Cảnh báo khẩn cấp 24/7:** Bắn thông báo đẩy (Push Notification) đến điện thoại ngay cả khi ứng dụng đang đóng hoàn toàn.

---

<!-- SLIDE 3 -->
## SLIDE 3: KIẾN TRÚC TỔNG THỂ HỆ THỐNG (3 TẦNG)
```text
[ PHẦN CỨNG IOT (LAB 1) ]
      ESP32 DevKit V4 + DHT22 + Cảm biến đất + LED Bơm/Quạt
                           │  ▲ (MQTT TCP: 1883)
                           ▼  │
[ MẠNG TRUYỀN THÔNG & SERVER (LAB 2) ]
   Eclipse Mosquitto Broker (Xác thực User/Pass + Phân quyền ACL)
                           │  ▲
              Node.js Express 5 Backend (Outbox Pattern)
                           │  ▲ (REST API + WebSocket Socket.IO)
                           ▼  │
[ ỨNG DỤNG DI ĐỘNG (LAB 3) ]
     React Native Expo App (iOS / Android) + Expo Push Server
```

---

<!-- SLIDE 4 -->
## SLIDE 4: PHẦN 1 - THIẾT KẾ PHẦN CỨNG & FIRMWARE ESP32 (LAB 1)
- **Vi điều khiển trung tâm:** ESP32 Dual Core 240MHz, tích hợp WiFi 802.11 b/g/n.
- **Cảm biến môi trường:**
  - DHT22 (Pin GPIO 15): Đo nhiệt độ và độ ẩm không khí.
  - Biến trở chiết áp (Pin GPIO 34 - ADC): Giả lập cảm biến độ ẩm đất (0 - 100%).
- **Cơ cấu chấp hành điều khiển:**
  - Relay 1 / LED Xanh lá (Pin GPIO 2): Máy bơm nước tưới tự động.
  - Relay 2 / LED Xanh dương (Pin GPIO 4): Quạt làm mát đối lưu.
- **Môi trường thử nghiệm:** Mô phỏng tương tác trên nền tảng Wokwi Simulator.

---

<!-- SLIDE 5 -->
## SLIDE 5: LƯU ĐỒ THUẬT TOÁN FIRMWARE ESP32
1. Khởi động ngoại vi, cấu hình GPIO Input/Output, kích hoạt cảm biến.
2. Kết nối WiFi `setupWiFi()` -> Nếu mất sóng thì tự động kết nối lại.
3. Kết nối MQTT Broker kèm bản tin di chúc LWT (`status = "OFFLINE"`).
4. **Luồng gửi dữ liệu (Telemetry):** Chu kỳ 10 giây/lần, đọc giá trị cảm biến, đóng gói JSON và publish về topic `smartagri/devices/+/telemetry`.
5. **Luồng nhận lệnh (Commands):** Subscribe topic `smartagri/devices/+/commands`. Khi có lệnh JSON, bóc tách `commandType` và `action` để kích hoạt chân GPIO tương ứng.
6. **Báo cáo xác nhận (ACK):** Xuất phản hồi về topic `smartagri/devices/+/ack`.

---

<!-- SLIDE 6 -->
## SLIDE 6: PHẦN 2 - XÂY DỰNG VÀ QUẢN TRỊ BROKER MQTT (LAB 2)
### 1. Cài đặt và cấu hình cổng:
- Sử dụng **Eclipse Mosquitto 2.0** triển khai bằng Docker Container độc lập.
- **Port 1883:** Giao thức TCP MQTT dành cho ESP32 và Server Backend.
- **Port 9001:** Giao thức WebSocket MQTT dành cho client Web/App.
### 2. Quản lý phiên và lưu trữ (Persistence):
- Lưu trữ trạng thái gói tin xuống đĩa cứng, không bị mất dữ liệu khi khởi động lại Broker.

---

<!-- SLIDE 7 -->
## SLIDE 7: BẢO MẬT & PHÂN QUYỀN TRUY CẬP (BROKER SECURITY)
### 1. Xác thực bắt buộc (Authentication):
- `allow_anonymous false` (Khóa hoàn toàn kết nối ẩn danh).
- Mật khẩu băm SHA-512 PBKDF2: Tài khoản riêng biệt cho ESP32 (`esp32_device`), Server (`backend_server`), Admin (`admin`).
### 2. Phân quyền Topic chi tiết (Topic ACL):
- `esp32_device`: Chỉ được phép ghi vào `.../telemetry`, `.../status`, `.../ack` và chỉ đọc từ `.../commands`.
- Chặn tuyệt đối việc ESP32 truy cập trái phép vào topic của khu vực khác hoặc topic quản trị hệ thống.

---

<!-- SLIDE 8 -->
## SLIDE 8: CƠ CHẾ QOS, RETAINED VÀ KẾT QUẢ KIỂM THỬ BROKER
- **QoS 1:** Đảm bảo gói tin Lệnh điều khiển và Cảnh báo luôn đến đích an toàn (có cờ xác nhận `PUBACK`).
- **Retained Message:** Lưu trữ trạng thái `ONLINE/OFFLINE` mới nhất của thiết bị trên Broker.
- **Kịch bản kiểm thử tự động (`test-broker.js`):** Đạt 5/5 bài kiểm thử:
  - ✓ Xác thực thông tin đăng nhập hợp lệ.
  - ✓ Chặn đứng kết nối vi phạm ACL.
  - ✓ Lưu và nhận tin nhắn Retain tức thì.
  - ✓ Chịu tải đồng thời 10+ client cùng lúc không bị nghẽn mạng.

---

<!-- SLIDE 9 -->
## SLIDE 9: PHẦN 3 - ỨNG DỤNG DI ĐỘNG REACT NATIVE (LAB 3)
### 1. Công nghệ & Thư viện sử dụng:
- **React Native Expo SDK 58** (TypeScript).
- **React Native Paper:** Bộ giao diện Google Material Design hiện đại, mượt mà.
- **Expo Router:** Điều hướng theo cấu trúc tệp (File-based routing), chuyển trang tức thì.
- **Socket.IO Client:** Cập nhật số liệu telemetry thời gian thực < 100ms.
- **TanStack React Query & Zustand:** Tối ưu hóa bộ nhớ đệm và quản lý trạng thái.

---

<!-- SLIDE 10 -->
## SLIDE 10: TÍNH NĂNG NỔI BẬT TRÊN MOBILE APP
1. **Bảng điều khiển thông minh (Dashboard):** Hiển thị thẻ thời tiết, nhiệt độ, độ ẩm đất, thiết bị và cảnh báo nổi bật.
2. **Biểu đồ giám sát cảm biến chuyên sâu:** Xem lịch sử diễn biến độ ẩm, nhiệt độ theo thời gian.
3. **Điều khiển tức thời:** Công tắc bật/tắt máy bơm nước và quạt gió, phản hồi rung cảm ứng.
4. **Bộ công cụ Cài đặt:** Tự do đổi địa chỉ máy chủ và thử nghiệm thông báo đẩy trực tiếp trên app.

---

<!-- SLIDE 11 -->
## SLIDE 11: ĐIỂM NHẤN CÔNG NGHỆ: PUSH NOTIFICATION 24/7
Ứng dụng nhận được thông báo đẩy kể cả trong 3 trạng thái:
1. **Đang mở App (Foreground):** Hiển thị banner thông báo kèm âm thanh cảnh báo.
2. **Chạy ngầm (Background):** Hiện thông báo trên thanh trạng thái Notification Bar.
3. **Đã tắt hẳn App (Killed / App Closed):**
   - Khi có sự cố vượt ngưỡng (ví dụ: nhiệt độ > 35°C hoặc đất khô hạn), Server tự động phát lệnh qua **Expo Push API** -> Google FCM / Apple APNs.
   - Điện thoại lập tức nhận thông báo trên màn hình khóa. Khi bấm vào, ứng dụng tự động mở ra và chuyển thẳng đến chi tiết cảnh báo để xử lý!

---

<!-- SLIDE 12 -->
## SLIDE 12: ĐÁNH GIÁ MỨC ĐỘ HOÀN THÀNH THEO TIÊU CHÍ (10/10)
- **Lab 1 (ESP32 - 20%):** Hoàn thành xuất sắc (Mạch nguyên lý rõ ràng, code sạch, đọc cảm biến và điều khiển ổn định).
- **Lab 2 (Broker - 20%):** Hoàn thành xuất sắc (Cấu hình Docker Mosquitto cổng 1883/9001, mã hóa mật khẩu, phân quyền ACL, kiểm thử tự động).
- **Lab 3 (Mobile App - 60%):** Hoàn thành xuất sắc (Giao diện đẹp mắt, Socket.IO realtime, điều khiển phần cứng, Push Notification 24/7).

---

<!-- SLIDE 13 -->
## SLIDE 13: KẾT LUẬN & HƯỚNG PHÁT TRIỂN
### Kết luận:
- Dự án đã hoàn thành trọn vẹn toàn bộ các tiêu chí đề ra từ phần cứng vi điều khiển, quản trị broker tin cậy đến ứng dụng di động thông minh.
### Hướng phát triển mở rộng:
- Tích hợp thêm mô hình AI dự báo nhu cầu tưới tiêu dựa trên dữ liệu khí tượng.
- Triển khai mạch phần cứng thực tế với chuẩn công nghiệp RS-485 Modbus.
- Mở rộng hỗ trợ điều khiển bằng giọng nói tiếng Việt.

---

<!-- SLIDE 14 -->
## SLIDE 14: KỊCH BẢN THUYẾT TRÌNH (SPEAKER NOTES)
- **Mở đầu (1 phút):** Kính chào quý thầy cô, nhóm chúng em xin trình bày đồ án Nông nghiệp Thông minh tích hợp toàn diện 3 bài Lab...
- **Trình bày ESP32 (2 phút):** Trọng tâm phần cứng là mạch ESP32 đọc DHT22 và chiết áp đất, cơ chế gửi LWT để báo trạng thái rớt mạng...
- **Trình bày Broker & Server (2 phút):** Điểm đặc biệt của Broker là chúng em không dùng anonymous mà tạo password hash SHA-512 và phân quyền ACL chặt chẽ...
- **Trình bày Mobile App (3 phút):** Điểm tự hào nhất trên App là trải nghiệm người dùng mượt mà và tính năng Push Notification nhận được ngay cả khi tắt hẳn ứng dụng...
- **Demo & Kết thúc (2 phút):** Thao tác demo trực tiếp: bật công tắc trên app -> LED Wokwi sáng; vặn chiết áp đất -> Điện thoại nhận thông báo cảnh báo tức thì!

---

<!-- SLIDE 15 -->
## SLIDE 15: CÂU HỎI THƯỜNG GẶP CỦA GIẢNG VIÊN & CÂU TRẢ LỜI (Q&A)

### Q1: Tại sao Mobile App không kết nối trực tiếp vào Broker MQTT mà phải qua Backend?
> **Trả lời:** Trong môi trường sản xuất thực tế, việc để Mobile App kết nối thẳng vào MQTT Broker sẽ gặp các vấn đề lớn: (1) Lộ thông tin tài khoản kết nối Broker, (2) Điện thoại di động thường xuyên thay đổi IP/chuyển mạng 4G/WiFi gây nghẽn kết nối Broker, (3) Khó kiểm soát quyền hạn dữ liệu. Do đó, mô hình chuẩn công nghiệp là ESP32 giao tiếp qua MQTT với Broker, Backend đọc ghi dữ liệu từ Broker và truyền tải về App qua REST API và WebSocket (Socket.IO).

### Q2: Cơ chế nào giúp ứng dụng nhận được thông báo khi đã tắt app hoàn toàn?
> **Trả lời:** Nhóm sử dụng giải pháp Remote Push Notification thông qua Expo Push Service tích hợp với Google FCM (Firebase Cloud Messaging). Khi thiết bị đăng nhập, điện thoại đăng ký một `ExpoPushToken` duy nhất gửi lên lưu tại bảng `device_tokens` trên Backend. Khi có sự cố vượt ngưỡng, Backend gửi yêu cầu phát thông báo qua giao thức HTTP POST đến Expo Push Server. Dịch vụ FCM của hệ điều hành Android đánh thức thiết bị và hiển thị Banner thông báo ngay trên màn hình khóa.

### Q3: Tệp phân quyền ACL hoạt động như thế nào trên Broker Mosquitto?
> **Trả lời:** Tệp `acl.conf` quy định quyền đọc (read) và ghi (write) cho từng tài khoản. Nhóm phân chia thành 3 nhóm người dùng: (1) `esp32_device` chỉ được ghi vào topic dữ liệu telemetry của chính nó và lắng nghe topic lệnh; (2) `backend_server` có quyền đọc ghi trên toàn bộ nhánh `smartagri/#`; (3) `admin` có quyền toàn diện để kiểm tra hệ thống. Nhờ vậy, nếu thiết bị IoT bị tấn công cũng không thể giả mạo để đọc trộm dữ liệu của các khu vực khác.

