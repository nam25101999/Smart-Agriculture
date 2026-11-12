# SMART AGRICULTURE BACKEND - NODE.JS EXPRESS CORE

Hệ sinh thái Backend phục vụ Hệ thống Nông nghiệp Thông minh (Smart Agriculture), hỗ trợ quản lý nông trại, thiết bị IoT ESP32, tiếp nhận dữ liệu cảm biến tần suất cao, đánh giá cảnh báo vi phạm ngưỡng, điều khiển thiết bị 2 chiều và giao tiếp Realtime.

---

## 1. Công nghệ chính
- **Runtime**: Node.js 22 LTS
- **Framework**: Express 5 + TypeScript
- **Kiến trúc**: Modular Monolith + Clean Architecture
- **Cơ sở dữ liệu**: Supabase PostgreSQL + Prisma ORM
- **Giao thức IoT**: MQTT (EMQX Broker) + MQTT.js
- **Độ tin cậy giao dịch**: Transactional Outbox Pattern
- **Bảo mật**: JWT Access + Refresh Token (Rotation) + Global & Farm-scoped RBAC
- **Thiết bị giả lập**: ESP32 Wokwi Simulator (`/wokwi`)

---

## 2. Cấu trúc mã nguồn

```
backend/
├── prisma/
│   ├── schema.prisma        # 17 bảng nghiệp vụ hoàn chỉnh
│   └── seed.ts              # Dữ liệu khởi tạo: Roles, Permissions, Super Admin
├── src/
│   ├── app/                 # Khởi tạo Express, Middlewares, Routes
│   ├── shared/              # Config, Logger (Pino), Error Handling, Response Envelope, RBAC
│   ├── infrastructure/      # Prisma Client, MQTT Broker Service
│   ├── modules/
│   │   ├── auth/            # Đăng ký, đăng nhập, refresh token, đổi mật khẩu
│   │   ├── farms/           # Quản trị Farm, Zone, Farm Members
│   │   ├── devices/         # Quản lý ESP32, Sensors, Lệnh điều khiển (Commands)
│   │   ├── telemetry/       # Tiếp nhận và truy vấn dữ liệu cảm biến
│   │   └── alerts/          # Động cơ cảnh báo, chống spam cảnh báo, xử lý vi phạm
│   ├── workers/
│   │   ├── mqtt-ingestion/  # Tiến trình nhận Telemetry & Command ACK qua MQTT
│   │   ├── outbox-dispatcher/# Tiến trình phân phối sự kiện Outbox (Atomic Locking)
│   │   └── index.ts         # Runner chạy toàn bộ workers
│   └── main.ts              # HTTP API Server Entrypoint & Socket.IO
└── tests/                   # Unit & Integration Tests (Jest)
```

---

## 3. Hướng dẫn thiết lập & chạy dự án

### Bước 1: Cấu hình biến môi trường
Sao chép `.env.example` thành `.env` và điền chuỗi kết nối Supabase của bạn:
```bash
cp .env.example .env
```
Cập nhật `DATABASE_URL` trong file `.env`:
```env
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_REF].supabase.co:5432/postgres?sslmode=require"
```

### Bước 2: Đồng bộ Database & Sinh Prisma Client
Khi đã kết nối tới Supabase:
```bash
# Đẩy schema lên database Supabase mới
pnpm prisma db push

# Khởi tạo dữ liệu mẫu (Roles & Super Admin)
pnpm prisma:seed
```
*Tài khoản Admin mặc định sau khi seed: `admin@smartagri.vn` / `Admin@123456`*

### Bước 3: Chạy hệ thống

1. **Khởi động HTTP API Server**:
```bash
pnpm dev
```
- API Server sẽ lắng nghe tại: `http://localhost:5001`
- Giao diện Swagger UI (Đầy đủ 10 nhóm API): **[http://localhost:5001/api-docs](http://localhost:5001/api-docs)**
- Kiểm tra trạng thái: **[http://localhost:5001/health](http://localhost:5001/health)**

2. **Khởi động Background Workers (MQTT Ingestion + Outbox Dispatcher)**:
Mở một terminal khác:
```bash
pnpm dev:workers
```
Workers sẽ tự động kết nối đến EMQX Broker (`broker.emqx.io:1883`) và lắng nghe telemetry từ ESP32 Wokwi.

3. **Chạy thiết bị giả lập Wokwi**:
- Mở thư mục `../wokwi` và làm theo hướng dẫn tại [wokwi/README.md](file:///e:/Du%20An/Smart%20Agriculture/wokwi/README.md).
- Ngay khi Wokwi chạy, dữ liệu cảm biến sẽ tự động được gửi qua MQTT, worker sẽ tiếp nhận, kiểm tra tính hợp lệ và ghi vào database!

---

## 4. Chạy kiểm thử tự động (Unit Test)
```bash
pnpm test
```

