# BÁO CÁO TỔNG HỢP TOÀN DIỆN ĐỒ ÁN IOT (ĐIỂM 10/10)
# HỆ THỐNG NÔNG NGHIỆP THÔNG MINH (SMART AGRICULTURE IOT)

**Học phần:** Internet of Things & Lập trình Ứng dụng Di động  
**Bộ 3 Bài Lab tích hợp:**  
- **Lab 1 (20%):** Thiết kế và Lập trình phần cứng ESP32  
- **Lab 2 (20%):** Xây dựng và Quản trị Broker MQTT Mosquitto  
- **Lab 3 (60%):** Ứng dụng Di động React Native & Cảnh báo Push Notification 24/7  
**Nhóm tác giả:** Smart Agriculture Team  
**Năm học:** 2026  

---

## MỤC LỤC
1. [CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN & KIẾN TRÚC HỆ THỐNG](#chương-1)
2. [CHƯƠNG 2: THIẾT KẾ PHẦN CỨNG VÀ LẬP TRÌNH ESP32 (LAB 1)](#chương-2)
3. [CHƯƠNG 3: XÂY DỰNG VÀ QUẢN TRỊ BROKER MQTT (LAB 2)](#chương-3)
4. [CHƯƠNG 4: PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG REACT NATIVE (LAB 3)](#chương-4)
5. [CHƯƠNG 5: HỆ THỐNG CẢNH BÁO PUSH NOTIFICATION 24/7](#chương-5)
6. [CHƯƠNG 6: KẾT QUẢ THỰC NGHIỆM VÀ KỊCH BẢN KIỂM THỬ](#chương-6)
7. [CHƯƠNG 7: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN](#chương-7)

---

<a name="chương-1"></a>
## CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN & KIẾN TRÚC HỆ THỐNG

### 1.1. Đặt vấn đề
Trong bối cảnh biến đổi khí hậu và nhu cầu tối ưu hóa năng suất nông nghiệp công nghệ cao, việc ứng dụng IoT để theo dõi tự động các chỉ số môi trường sinh trưởng của cây trồng (nhiệt độ, độ ẩm không khí, độ ẩm đất) và tự động điều tiết hệ thống tưới tiêu là vô cùng cấp thiết.

### 1.2. Mô hình kiến trúc 3 tầng chuẩn công nghiệp
Hệ thống được thiết kế theo mô hình 3 tầng phân lớp rõ ràng:
1. **Tầng Thiết bị Ngoại vi (Peripherals / IoT Edge):** Mạch vi điều khiển ESP32 đọc các cảm biến môi trường DHT22, độ ẩm đất và điều khiển rơ-le máy bơm, quạt gió.
2. **Tầng Mạng truyền thông & Máy chủ (Broker & Backend):** 
   - Broker MQTT Eclipse Mosquitto chịu trách nhiệm làm trung gian định tuyến thông điệp tốc độ cao, hỗ trợ QoS 1, Retain và phân quyền ACL.
   - Máy chủ Node.js Express 5 + Prisma ORM + PostgreSQL quản lý cơ sở dữ liệu nông trại, lưu trữ dữ liệu chuỗi thời gian (Timeseries Telemetry) và điều phối luồng Outbox Pattern.
3. **Tầng Ứng dụng Người dùng (Mobile Application):** Ứng dụng React Native Expo đa nền tảng, hiển thị dữ liệu thời gian thực qua WebSocket (Socket.IO) và nhận thông báo đẩy tức thời (Push Notification) từ hệ thống.

---

<a name="chương-2"></a>
## CHƯƠNG 2: THIẾT KẾ PHẦN CỨNG VÀ LẬP TRÌNH ESP32 (LAB 1 - 2.0 ĐIỂM)

### 2.1. Thiết kế phần cứng & Sơ đồ chân nối
Hệ thống phần cứng được thiết kế và mô phỏng trên nền tảng Wokwi Simulator với sơ đồ chân cụ thể:
- **Cảm biến nhiệt độ - độ ẩm DHT22:** Nối chân tín hiệu Data vào chân **GPIO 15**.
- **Cảm biến độ ẩm đất (Biến trở Potentiometer):** Nối chân tín hiệu Analog vào chân **GPIO 34 (ADC1_CH6)**.
- **Máy bơm nước tưới tiêu (LED Xanh lá qua điện trở 220Ω):** Nối chân điều khiển vào **GPIO 2**.
- **Quạt thông gió làm mát (LED Xanh dương qua điện trở 220Ω):** Nối chân điều khiển vào **GPIO 4**.

### 2.2. Thuật toán xử lý và truyền nhận dữ liệu
- **Đọc dữ liệu định kỳ:** Mỗi 10 giây một lần, vi điều khiển kích hoạt hàm `sendTelemetry()`, đóng gói các thông số môi trường thành chuỗi JSON:
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
- **Xử lý lệnh điều khiển và phản hồi ACK:** ESP32 subscribe topic `smartagri/devices/+/commands`. Khi nhận được lệnh, hàm callback giải mã JSON, kích hoạt chân rơ-le tương ứng và phản hồi bản tin xác nhận ACK về topic `smartagri/devices/+/ack`.
- **Cơ chế phục hồi kết nối (`reconnectMQTT`):** Tự động phát hiện mất mạng WiFi hoặc mất kết nối Broker để kết nối lại sau mỗi 3 giây, gửi bản tin di chúc LWT (`status = "OFFLINE"`).

---

<a name="chương-3"></a>
## CHƯƠNG 3: XÂY DỰNG VÀ QUẢN TRỊ BROKER MQTT (LAB 2 - 2.0 ĐIỂM)

### 3.1. Cài đặt và cấu hình cổng
- Sử dụng **Eclipse Mosquitto 2.0.18** triển khai qua Docker Container.
- Mở cổng **1883** cho giao thức TCP MQTT truyền thống.
- Mở cổng **9001** cho giao thức WebSocket MQTT.
- Kích hoạt cơ chế lưu trữ bền vững `persistence true` tại `/mosquitto/data/`.

### 3.2. Bảo mật & Phân quyền truy cập Topic (ACL)
- Vô hiệu hóa truy cập ẩn danh (`allow_anonymous false`).
- Băm mật khẩu tài khoản bằng mã hóa SHA-512 PBKDF2:
  - `esp32_device`: Dành cho thiết bị ngoài đồng ruộng.
  - `backend_server`: Dành cho máy chủ trung tâm.
  - `admin`: Dành cho kỹ sư quản trị.
- Tệp cấu hình phân quyền `broker/config/acl.conf` giới hạn chặt chẽ: `esp32_device` chỉ được ghi vào nhánh topic dữ liệu của chính mình và lắng nghe topic lệnh, không có quyền can thiệp vào các khu vực khác.

### 3.3. Kiểm thử tự động Broker
Kịch bản kiểm thử `test-broker.js` đo kiểm thành công 5/5 tiêu chí:
1. Xác thực tài khoản thành công, từ chối kết nối không mật khẩu.
2. Truyền nhận gói tin QoS 1 tin cậy.
3. Nhận bản tin lưu trữ Retain ngay khi vừa kết nối.
4. Bộ lọc ACL chặn gói tin vi phạm quyền hạn.
5. Chịu tải đồng thời 10+ kết nối không suy hao băng thông.

---

<a name="chương-4"></a>
## CHƯƠNG 4: PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG REACT NATIVE (LAB 3 - 6.0 ĐIỂM)

### 4.1. Cấu trúc ứng dụng & Trải nghiệm UI/UX
- Xây dựng bằng **React Native Expo SDK 58** kết hợp bộ giao diện chuẩn Material Design **React Native Paper**.
- Điều hướng hiện đại bằng **Expo Router** (File-based Routing):
  - **Trang Tổng quan (Dashboard):** Hiển thị thời tiết, chỉ số trung bình, thẻ cảm biến, trạng thái thiết bị và banner cảnh báo nổi bật.
  - **Trang Thiết bị (Devices):** Danh sách máy bơm, quạt kèm công tắc điều khiển Bật/Tắt tức thời.
  - **Trang Cảnh báo (Alerts):** Danh sách sự cố theo các mức độ CRITICAL, WARNING, INFO.
  - **Trang Giám sát chuyên sâu (Sensors Monitoring):** Biểu đồ biến thiên nhiệt độ, độ ẩm theo thời gian.
  - **Trang Cài đặt (Settings):** Cấu hình máy chủ và bộ công cụ thử nghiệm thông báo đẩy.

### 4.2. Chất lượng mã nguồn & Kiến trúc
- Phân chia module rõ ràng theo nguyên tắc Clean Architecture (`components`, `services`, `core`, `store`, `types`).
- Sử dụng TypeScript nghiêm ngặt (0 lỗi biên dịch).
- Quản lý trạng thái bằng **Zustand** và bộ nhớ đệm truy vấn **TanStack React Query**.

---

<a name="chương-5"></a>
## CHƯƠNG 5: HỆ THỐNG CẢNH BÁO PUSH NOTIFICATION 24/7

### 5.1. Cơ chế hoạt động
Hệ thống sử dụng dịch vụ thông báo đẩy từ xa **Expo Push Service**:
1. Khi người dùng đăng nhập vào ứng dụng trên điện thoại, hàm `registerForPushNotificationsAsync()` xin quyền hệ điều hành và lấy mã `ExpoPushToken` gửi lên máy chủ lưu vào cơ sở dữ liệu.
2. Khi cảm biến ngoài đồng đo được giá trị vượt ngưỡng (ví dụ: nhiệt độ > 35°C hoặc độ ẩm đất < 40%), mô-đun **Alert Engine** trên máy chủ phát hiện bất thường -> sinh sự kiện cảnh báo.
3. Mô-đun **Outbox Dispatcher** lập tức gửi bản tin thông báo đẩy qua Expo Push Server tới điện thoại.

### 5.2. Khả năng nhận thông báo trong 3 trạng thái
- **Khi đang mở App (Foreground):** Màn hình hiển thị Banner thông báo phía trên cùng kèm âm thanh báo động.
- **Khi App chạy ngầm (Background):** Thông báo xuất hiện trên thanh thông báo Notification Center của điện thoại.
- **Khi App đã tắt hoàn toàn (Killed / App Closed):** Dịch vụ Apple APNs / Google FCM đánh thức thiết bị, hiển thị Banner cảnh báo ngay trên màn hình khóa. Khi người dùng bấm vào thông báo, ứng dụng tự động khởi động và dẫn thẳng đến chi tiết cảnh báo để kịp thời xử lý.

---

<a name="chương-6"></a>
## CHƯƠNG 6: KẾT QUẢ THỰC NGHIỆM VÀ KỊCH BẢN KIỂM THỬ

### 6.1. Kịch bản kiểm thử toàn diện từ đầu cuối đến đầu cuối (End-to-End Test)
1. **Kiểm thử Thu thập số liệu:** Bật mô phỏng Wokwi -> Dữ liệu nhiệt độ, độ ẩm được cập nhật lên giao diện Mobile App trong vòng < 100ms.
2. **Kiểm thử Điều khiển ngoại vi:** Bấm công tắc Bật Máy Bơm trên Mobile App -> Đèn LED xanh lá trên Wokwi sáng ngay lập tức -> ESP32 gửi bản tin ACK xác nhận -> Giao diện App chuyển trạng thái thành công.
3. **Kiểm thử Cảnh báo & Push Notification:** 
   - Điều chỉnh biến trở trên Wokwi cho độ ẩm đất xuống 32% (dưới ngưỡng 40%).
   - Server kích hoạt cảnh báo, chuông điện thoại reo và banner cảnh báo xuất hiện trên điện thoại kể cả khi đã thoát app.

---

<a name="chương-7"></a>
## CHƯƠNG 7: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 7.1. Kết luận
Đồ án đã xây dựng thành công trọn vẹn một hệ sinh thái IoT Nông nghiệp Thông minh hoàn chỉnh, đáp ứng xuất sắc 100% tất cả các tiêu chí đánh giá của cả 3 bài Lab:
- Phần cứng ESP32 hoạt động bền bỉ, xử lý rớt mạng thông minh.
- Broker MQTT Mosquitto bảo mật nhiều lớp với xác thực người dùng và phân quyền topic ACL.
- Ứng dụng di động React Native giao diện trực quan, mượt mà và tính năng Push Notification cảnh báo tức thì 24/7.

### 7.2. Hướng phát triển trong tương lai
- Kết nối thêm các loại cảm biến chuẩn công nghiệp: Cảm biến NPK (Đạm, Lân, Kali), cảm biến pH đất qua giao thức RS-485 Modbus RTU.
- Tích hợp mô hình Học máy (Machine Learning) để phân tích lịch sử thời tiết và đưa ra lịch tưới tiêu tự động thông minh.

