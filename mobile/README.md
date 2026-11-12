# Ứng dụng Di động Farm Home (Smart Agriculture Mobile)

Ứng dụng quản trị và giám sát nông nghiệp thông minh IoT thời gian thực, xây dựng bằng **React Native** + **Expo SDK 58** (Expo Router v4 / React 19 / React Native 0.88), giao diện **React Native Paper** Material Design 3, quản lý trạng thái bằng **Zustand** & **TanStack Query**, kết nối dữ liệu thời gian thực qua **Socket.IO**. Tương thích hoàn toàn với ứng dụng **Expo Go** mới nhất trên iOS (App Store) và Android.

---

## 📱 Danh Sách Toàn Bộ Màn Hình Ứng Dụng (100% Theo thietkesmobile.md)

### 0. Màn Hình Khởi Động & Giới Thiệu (Splash & Onboarding)
- **`app/index.tsx` (Splash Screen)**: Màn hình chào mừng thương hiệu Farm Home, icon mầm cây xanh, slogan nông nghiệp, tự động kiểm tra trạng thái đăng nhập và cờ onboarding để chuyển hướng sau 2s.
- **`app/onboarding.tsx` (3 Màn hình Onboarding Slide)**:
  - 🌿 **Slide 1**: *Theo Dõi Môi Trường 24/7* (Nhiệt độ, độ ẩm không khí, độ ẩm đất thời gian thực từ trạm cảm biến ESP32).
  - 🚰 **Slide 2**: *Tưới Tiêu 2 Chiều An Toàn* (Điều khiển máy bơm, van điện từ từ xa với cơ chế xác thực minh bạch).
  - 🤖 **Slide 3**: *Cảnh Báo Sớm & Trợ Lý AI* (Thông báo khẩn cấp khi vi khí hậu vượt ngưỡng, trợ lý AI tư vấn lịch tưới và phòng bệnh).
  - Hỗ trợ vuốt chạm cảm ứng (Carousel), nút "Bỏ qua" (Skip), chấm chỉ số trang (Pagination Dots) và nút "Bắt đầu ngay" lưu cờ vào bộ nhớ an toàn.

### 1. Nhóm Xác Thực & Bảo Mật (Authentication Flow)
- **`app/(auth)/login.tsx`**: Đăng nhập Email/Mật khẩu, nút ⚡ Đăng nhập nhanh Admin mẫu.
- **`app/(auth)/register.tsx`**: Đăng ký tài khoản người dùng mới.
- **`app/(auth)/forgot-password.tsx`**: Yêu cầu khôi phục mật khẩu qua Email.
- **`app/(auth)/reset-password.tsx`**: Đặt lại mật khẩu mới với mã OTP 6 số.

### 2. Nhóm 5 Tabs Chính (Bottom Tab Navigation)
- **`app/(tabs)/index.tsx` (Dashboard)**: Thẻ chỉ số cảm biến thời gian thực (Nhiệt độ, Độ ẩm không khí, Độ ẩm đất), công tắc bật/tắt nhanh Máy bơm & Quạt làm mát, banner Trợ lý AI.
- **`app/(tabs)/farms.tsx` (Trang trại)**: Danh sách nông trại, chọn Farm đang theo dõi, xem các khu vực canh tác, Dialog thêm Farm mới.
- **`app/(tabs)/devices.tsx` (Thiết bị IoT)**: Danh sách vi điều khiển ESP32, bảng điều khiển Relay tức thời, lịch sử phản hồi lệnh ACK.
- **`app/(tabs)/alerts.tsx` (Cảnh báo)**: Trung tâm cảnh báo sự cố vi khí hậu (`CRITICAL`, `WARNING`, `INFO`), bộ lọc trạng thái.
- **`app/(tabs)/profile.tsx` (Tài khoản)**: Hồ sơ người dùng, phân quyền RBAC, đổi mật khẩu, đăng xuất an toàn.

### 3. Nhóm Màn Hình Chi Tiết Nghiệp Vụ Chuyên Sâu (Detail & Feature Screens)
- **`app/sensors/monitoring.tsx` (Giám sát cảm biến chi tiết)**: Bộ lọc thời gian (1h, 24h, 7d, 30d), biểu đồ biến thiên trực quan, theo dõi ngưỡng cảnh báo min/max và bảng lịch sử đọc dữ liệu Telemetry.
- **`app/ai/assistant.tsx` (Trợ lý AI Nông nghiệp)**: Chatbot thông minh phân tích dữ liệu nhiệt độ, độ ẩm, cảnh báo sốc nhiệt cho cây trồng, tư vấn lịch tưới dặm và phòng ngừa sâu bệnh.
- **`app/irrigation/index.tsx` (Điều khiển tưới tiêu chuyên sâu)**: Bật/tắt máy bơm áp lực, điều khiển van điện từ từng khu vực, thiết lập lịch tưới tự động định kỳ, cơ chế an toàn State Machine (`PENDING` ➔ `SENT` ➔ `ACKNOWLEDGED` ➔ `EXECUTED`).
- **`app/farms/[id].tsx` (Chi tiết Nông trại)**: Thống kê diện tích, danh sách khu vực (Zone), mùa vụ cây trồng đang canh tác (Crops), quản lý thành viên & phân quyền nhân sự (Farm Members & RBAC).
- **`app/zones/[id].tsx` (Chi tiết Khu vực Canh tác)**: Diện tích, chủng loại cây trồng, danh sách thiết bị ESP32 phụ trách, nút kích hoạt tưới tiêu riêng cho khu vực.
- **`app/devices/[id].tsx` (Chi tiết & Cấu hình Thiết bị)**: Thông số kỹ thuật (MAC, IP, Firmware), danh sách cảm biến gắn kèm, cấu hình ngưỡng cảnh báo min/max cho từng cảm biến, nút Reboot ESP32 từ xa.
- **`app/alerts/[id].tsx` (Chi tiết Sự cố Cảnh báo)**: Thông tin chi tiết giá trị đo so với ngưỡng an toàn, nguồn phát sinh sự cố, form ghi nhận phương án khắc phục của kỹ thuật viên, nút Xác nhận (Acknowledge) và Hoàn tất (Resolve).
- **`app/settings/index.tsx` (Cài đặt Hệ thống)**: Bật/tắt thông báo đẩy Firebase FCM, âm thanh cảnh báo khẩn cấp, cập nhật realtime qua WebSocket, cấu hình địa chỉ IP máy chủ API Backend trên mạng LAN, Dark Mode.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
- Node.js >= 20.x hoặc 22 LTS
- pnpm >= 9.x hoặc 10.x
- Ứng dụng **Expo Go** trên điện thoại Android hoặc iOS (tải miễn phí trên Google Play / App Store).

### 2. Cấu hình kết nối Backend
File cấu hình: `mobile/src/core/config/env.ts`
- Mặc định ứng dụng tự động nhận diện IP máy chủ qua Expo host.
- Nếu chạy máy ảo Android: API trỏ về `http://10.0.2.2:5001/api/v1`.
- Nếu quét mã QR bằng điện thoại thật: Thiết bị di động và máy tính cùng kết nối chung một mạng WiFi.

### 3. Khởi chạy ứng dụng Mobile
Mở terminal tại thư mục `mobile`:
```bash
cd mobile

# Cài đặt thư viện (nếu chưa cài)
pnpm install

# Khởi động Expo Server
pnpm start
```

- Nhấn phím `a` để mở trên Android Emulator.
- Nhấn phím `i` để mở trên iOS Simulator.
- Nhấn phím `w` để xem giao diện trên Trình duyệt Web.
- Hoặc dùng camera điện thoại quét mã QR hiển thị trên màn hình terminal thông qua app **Expo Go**.

---

## 🔑 Tài Khoản Đăng Nhập Mẫu

- **Email**: `admin@smartagri.vn`
- **Mật khẩu**: `Admin@123456`
- **Vai trò**: `SUPER_ADMIN`
*(Hoặc có thể bấm vào nút **"⚡ Dùng tài khoản mẫu (Admin)"** ngay tại màn hình đăng nhập).*

