# BÁO CÁO BÀI LAB 3: PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG (REACT NATIVE)
**Học phần:** Internet of Things & Phát triển Ứng dụng Di động  
**Đề tài:** Hệ Thống Nông Nghiệp Thông Minh (Smart Agriculture IoT)  
**Nhóm tác giả:** Smart Agriculture Team  

---

## 1. MỤC TIÊU BÀI LAB
- Xây dựng ứng dụng di động đa nền tảng (Android & iOS) quản lý và giám sát nông trại thông minh bằng React Native và Expo Framework.
- Thiết kế giao diện hiện đại, trực quan, hỗ trợ điều hướng tiện lợi, theo dõi trạng thái cảm biến theo thời gian thực (Realtime Monitoring).
- Gửi lệnh điều khiển bật/tắt thiết bị ngoại vi (Bơm tưới, Quạt làm mát) tức thời xuống phần cứng ESP32.
- Triển khai tính năng **Thông báo đẩy (Push Notification 24/7)** từ máy chủ tới điện thoại người dùng ngay cả khi ứng dụng đang mở (Foreground), chạy ngầm (Background) hay đã tắt hoàn toàn (Killed).
- Đảm bảo chất lượng mã nguồn TypeScript, kiến trúc module hóa rõ ràng, xử lý mất kết nối và tự động đồng bộ lại dữ liệu.

---

## 2. GIAO DIỆN VÀ TRẢI NGHIỆM NGƯỜI DÙNG (1.0 ĐIỂM)

### 2.1. Cấu trúc điều hướng (Navigation Hierarchy)
Ứng dụng sử dụng **Expo Router** (File-based Routing) kết hợp thư viện giao diện chuẩn Google Material Design **React Native Paper**:
- **Màn hình Đăng nhập / Xác thực (`/auth/login`):** Đăng nhập JWT Token bảo mật, lưu trữ an toàn bằng `expo-secure-store`.
- **Hệ thống Tab Bar (`/(tabs)`):**
  - **Tab Tổng quan (`index.tsx`):** Thẻ thời tiết, chỉ số trung bình toàn nông trại, danh sách cảm biến nhanh, thanh trạng thái thiết bị và banner cảnh báo nổi bật.
  - **Tab Thiết bị (`devices.tsx`):** Danh sách thiết bị ESP32 theo từng khu vực (Zone), công tắc điều khiển Bật/Tắt tức thời máy bơm và quạt, hiển thị trạng thái Online/Offline.
  - **Tab Cảnh báo (`alerts.tsx`):** Quản lý toàn bộ sự cố nông trại theo mức độ nghiêm trọng (CRITICAL, WARNING, INFO), hỗ trợ nút bấm xác nhận đã xử lý.
  - **Tab Cài đặt (`settings/index.tsx`):** Cấu hình địa chỉ Server, bật/tắt thông báo đẩy, âm thanh báo động khẩn cấp, bộ công cụ thử nghiệm Push Notification & Broadcast.
- **Các màn hình Chi tiết:**
  - Giám sát biểu đồ lịch sử cảm biến chuyên sâu: `/sensors/monitoring`.
  - Quản lý quy trình tưới tiêu tự động: `/irrigation`.
  - Quản lý chi tiết từng Nông trại: `/farms/[id]`.
  - Trợ lý AI nông nghiệp thông minh: `/ai/assistant`.

### 2.2. Trải nghiệm tương tác (UX)
- Điều hướng mượt mà: Bấm vào bất kỳ thẻ cảm biến, thiết bị hay banner cảnh báo trên màn hình chính đều tự động chuyển hướng đến màn hình tương ứng.
- Cập nhật số liệu mượt mà, phản hồi rung (Haptic Feedback) khi kích hoạt nút điều khiển.

---

## 3. KẾT NỐI BROKER VÀ TRUYỀN NHẬN DỮ LIỆU (1.0 ĐIỂM)

### 3.1. Kiến trúc luồng dữ liệu 3 lớp (3-Tier Industrial Architecture)
Thay vì để điện thoại kết nối trực tiếp vào MQTT Broker (dễ gây nghẽn kết nối di động và lộ tài khoản phần cứng), hệ thống áp dụng kiến trúc chuẩn doanh nghiệp:
$$\text{ESP32 (MQTT)} \longleftrightarrow \text{MQTT Broker} \longleftrightarrow \text{Backend Node.js (Outbox)} \longleftrightarrow \text{Mobile App (REST + Socket.IO)}$$

1. **Nhận số liệu Realtime:** Mobile App lắng nghe sự kiện `telemetry:new`, `device:status` qua WebSocket (Socket.IO) từ Backend. Khi ESP32 phát gói tin MQTT, Backend xử lý và đẩy ngay về App trong vòng dưới 100ms.
2. **Gửi lệnh điều khiển:** Khi người dùng bật máy bơm trên màn hình, App gọi API `POST /api/v1/devices/:id/commands`. Backend ghi nhận vào cơ sở dữ liệu với trạng thái `PENDING`, Dispatcher Worker lập tức lấy lệnh và Publish qua topic MQTT `smartagri/devices/+/commands` đến ESP32.

---

## 4. HIỂN THỊ DỮ LIỆU & ĐIỀU KHIỂN THIẾT BỊ (1.5 ĐIỂM)

### 4.1. Hiển thị dữ liệu cảm biến thời gian thực
- Nhiệt độ (°C), Độ ẩm không khí (%RH) và Độ ẩm đất (%): Hiển thị với biểu tượng màu sắc trực quan (Xanh lá: An toàn, Vàng: Cảnh báo, Đỏ: Nguy hiểm).
- Tự động cảnh báo ngưỡng tối thiểu / tối đa dựa trên loại cây trồng canh tác.

### 4.2. Điều khiển thiết bị ngoại vi
- Công tắc chuyển đổi (Switch) bật/tắt Máy bơm nước và Quạt thông gió.
- Khi gửi lệnh, hiển thị trạng thái `Đang xử lý...` và chuyển sang `Thành công` khi nhận được gói tin ACK từ ESP32.

### 4.3. Tính năng Push Notification 24/7 (Đặc biệt)
Ứng dụng tích hợp hệ thống **Expo Push Service** với khả năng tiếp nhận thông báo trong cả 3 trạng thái của điện thoại:
1. **Khi đang mở ứng dụng (Foreground):** Hiện Banner thông báo trên đầu màn hình kèm âm thanh và rung.
2. **Khi ứng dụng chạy ngầm (Background):** Hiện thông báo lên thanh Notification Bar của hệ điều hành Android/iOS.
3. **Khi ứng dụng đã tắt hẳn (Killed / App Closed):** Máy chủ gửi thông báo qua Expo Push Server, dịch vụ Apple APNs / Google FCM đánh thức thiết bị và hiển thị Banner thông báo ngay trên màn hình khóa. Khi người dùng bấm vào thông báo, ứng dụng sẽ tự động mở và chuyển thẳng đến chi tiết cảnh báo (`/alerts/[id]`).

---

## 5. CHẤT LƯỢNG MÃ NGUỒN VÀ KIẾN TRÚC DỰ ÁN (1.0 ĐIỂM)

Cấu trúc mã nguồn được phân chia theo nguyên lý Clean Architecture:
```text
mobile/
├── app/                  # File-based routing (Màn hình & Navigation)
│   ├── (tabs)/           # Màn hình Tab chính (Dashboard, Devices, Alerts)
│   ├── alerts/           # Chi tiết cảnh báo
│   ├── sensors/          # Biểu đồ cảm biến chuyên sâu
│   └── settings/         # Cài đặt hệ thống & Test Push
├── src/
│   ├── components/       # Các component UI tái sử dụng (SensorCard, DeviceItem)
│   ├── core/             # Cấu hình API Client (Axios), Theme màu sắc, Biến môi trường
│   ├── services/         # Tầng giao tiếp dữ liệu (Socket, Notification, Device, Telemetry)
│   ├── store/            # Quản lý trạng thái toàn cục (Zustand)
│   └── types/            # Định nghĩa kiểu dữ liệu TypeScript nghiêm ngặt
```

---

## 6. XỬ LÝ LỖI VÀ ĐỘ ỔN ĐỊNH (0.5 ĐIỂM)

- **Xử lý mất kết nối mạng:** Tự động lắng nghe trạng thái kết nối mạng của thiết bị; Socket.IO tự động thử kết nối lại theo chu kỳ hàm mũ (Exponential Backoff).
- **Lưu trữ phiên an toàn:** Lưu Token đăng nhập trong bộ nhớ mã hóa phần cứng `Expo SecureStore`.
- **Kiểm tra dữ liệu đầu vào:** Toàn bộ form nhập liệu được xác thực thông qua thư viện `Zod` và `React Hook Form`.

---

## 7. MINH CHỨNG KẾT QUẢ ỨNG DỤNG (HÌNH ẢNH MINH HỌA)

> *Gợi ý khi nộp bài: Chụp các ảnh màn hình điện thoại thực tế để chèn vào vị trí này:*
1. **Hình 1: Màn hình Dashboard tổng quan** (Hiển thị các chỉ số cảm biến và thẻ thiết bị).
2. **Hình 2: Màn hình Điều khiển thiết bị** (Bật máy bơm và quạt thành công).
3. **Hình 3: Màn hình Cảnh báo và Màn hình Cài đặt** (Có nút test Push Notification).
4. **Hình 4: Màn hình khóa điện thoại nhận Push Notification** khi app đang tắt hoàn toàn.

