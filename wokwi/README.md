# HƯỚNG DẪN MÔ PHỎNG 3 CON ESP32 VÀ KẾT NỐI VỚI CÁC VƯỜN TRÊN WOKWI

Dự án hỗ trợ **3 bộ vi điều khiển ESP32 độc lập**, tương ứng quản lý 3 khu vườn canh tác khác nhau:

| Thiết bị | Mã định danh (`deviceCode`) | Khu Vườn Canh Tác | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- |
| **ESP32 #1** | `ESP32_ZONE_01` | **Vườn 1: Rau Củ Quả** | Giám sát độ ẩm cao, điều khiển Bơm tưới tràn |
| **ESP32 #2** | `ESP32_ZONE_02` | **Vườn 2: Cây Ăn Trái** | Giám sát nhiệt độ cao, điều khiển Bơm nhỏ giọt & Quạt gió |
| **ESP32 #3** | `ESP32_ZONE_03` | **Vườn 3: Nhà Màng Dưa Lưới** | Giám sát môi trường khép kín, điều khiển Phun sương & Quạt đối lưu |

---

## 1. Cách 1: Dùng 1 Dự Án Wokwi và Chuyển Đổi Nhanh (Khuyên Dùng)

Trong tệp [`wokwi/sketch.ino`](file:///e:/Du%20An/Smart%20Agriculture/wokwi/sketch.ino), ở ngay dòng đầu tiên có công tắc chuyển đổi:

```cpp
// 👉 ĐỔI SỐ 1, 2 HOẶC 3 ĐỂ CHỌN CON ESP32 VÀ KHU VƯỜN:
#define SELECTED_DEVICE 1  // 1: Vườn Rau Củ, 2: Vườn Cây Ăn Trái, 3: Nhà Màng Dưa Lưới
```

- Muốn mô phỏng **ESP32 #1**: Để `#define SELECTED_DEVICE 1`.
- Muốn mô phỏng **ESP32 #2**: Sửa thành `#define SELECTED_DEVICE 2`.
- Muốn mô phỏng **ESP32 #3**: Sửa thành `#define SELECTED_DEVICE 3`.
Bấm Play mô phỏng lại, ESP32 sẽ lập tức đóng vai con vi điều khiển tương ứng!

---

## 2. Cách 2: Mở Đồng Thời 3 Tab Trình Duyệt Chạy Cả 3 Con ESP32 Cùng Lúc

Dự án đã đóng gói sẵn 3 thư mục riêng biệt:
1. [`wokwi/esp32_01_vuon_rau/`](file:///e:/Du%20An/Smart%20Agriculture/wokwi/esp32_01_vuon_rau/): Chạy tab 1 cho Vườn Rau Củ.
2. [`wokwi/esp32_02_vuon_cay/`](file:///e:/Du%20An/Smart%20Agriculture/wokwi/esp32_02_vuon_cay/): Chạy tab 2 cho Vườn Cây Ăn Trái.
3. [`wokwi/esp32_03_nha_mang/`](file:///e:/Du%20An/Smart%20Agriculture/wokwi/esp32_03_nha_mang/): Chạy tab 3 cho Nhà Màng Dưa Lưới.

Mỗi tab trên Wokwi sẽ gửi số liệu về topic riêng của nó:
- `smartagri/devices/ESP32_ZONE_01/telemetry`
- `smartagri/devices/ESP32_ZONE_02/telemetry`
- `smartagri/devices/ESP32_ZONE_03/telemetry`

---

## 3. Cách Tùy Chọn Đổi / Gán ESP32 Với Các Vườn Trên Mobile App

Ứng dụng di động đã tích hợp sẵn tính năng gán thiết bị vào các khu vườn linh hoạt:
1. Mở app trên điện thoại $\rightarrow$ Vào tab **Thiết bị (Devices)**.
2. Thanh chip ngang phía trên sẽ liệt kê cả **3 con ESP32**. Bạn bấm vào con nào muốn quản lý.
3. Trong thẻ thông tin thiết bị, bạn sẽ thấy mục:
   - **Vườn canh tác:** Tên khu vườn hiện tại mà con ESP32 này đang được phân công.
   - Nút bấm: **"Đổi Vườn / Khu Vực Canh Tác"**.
4. Bấm vào nút đó, một danh sách các Vườn (`🌿 Nông Trại Xanh`, `🌿 Vườn Công Nghệ Cao`...) và các Khu vực con sẽ hiện ra. Bạn chỉ việc tích chọn Khu Vườn muốn chuyển đến và bấm **"Lưu Thay Đổi"**!
5. Toàn bộ cảnh báo, số liệu cảm biến và lệnh điều khiển của con ESP32 đó sẽ lập tức được chuyển sang quản lý cho Vườn mới!
