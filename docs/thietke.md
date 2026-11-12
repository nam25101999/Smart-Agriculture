THIẾT KẾ BACKEND SMART AGRICULTURE – NODE.JS EXPRESS CORE
Giai đoạn 1 – System Design
 Medium Scale
 AI Integrated


Mục tiêu là thiết kế lại Backend Smart Agriculture từ .NET sang Node.js Express Core, sử dụng Supabase PostgreSQL, phục vụ Web Dashboard và Mobile App, đồng thời quản lý thiết bị IoT, dữ liệu cảm biến, cảnh báo thông minh và AI.

Đây sẽ là tài liệu thiết kế nền tảng trước khi triển khai code. Chúng ta chưa viết code, chưa tạo migration và chưa thay đổi database hiện tại cho đến khi hoàn tất và thống nhất thiết kế.
1. Định hướng kiến trúc tổng thể
1.1. Các lựa chọn công nghệ
Thành phần	Công nghệ lựa chọn
Runtime	Node.js 22 LTS
Backend Framework	Express 5
Ngôn ngữ	TypeScript
Architecture	Clean Architecture
Database	Supabase PostgreSQL
ORM	Prisma
Authentication	JWT Access + Refresh Token
Authorization	RBAC
Validation	Zod
API Documentation	Swagger / OpenAPI 3
IoT Protocol	MQTT
MQTT Broker	EMQX Public Broker
MQTT Client	MQTT.js
Real-time	Socket.IO
Push Notification	Firebase Cloud Messaging (FCM)
Background Processing	Worker Service
Transaction Reliability	Transactional Outbox
Logging	Pino
Testing	Jest + Supertest
AI Integration	LLM Provider Adapter
Deployment API	Node.js Hosting
Deployment Worker	Render / Railway
Frontend	Web Dashboard + React Native Mobile

Lưu ý: Express là framework xử lý HTTP API, không phải MQTT broker. MQTTX là ứng dụng client để kiểm thử MQTT, còn EMQX là MQTT broker trung gian giữa ESP32 và Backend.
1.2. Quy mô hệ thống
Thiết kế theo quy mô Medium Scale, hướng tới khả năng mở rộng mà không cần thay đổi toàn bộ kiến trúc.
Quy mô mục tiêu thiết kế
1.000
Thiết bị IoT mục tiêu

500
Người dùng đồng thời

10.000
Bản ghi telemetry/giờ trung bình

99,5%
Mục tiêu availability


Đây là chỉ tiêu thiết kế sơ bộ, không phải số liệu hiệu năng đã kiểm thử hoặc giới hạn mặc định của Supabase.
Hệ thống cần đáp ứng:
- Nhiều nông trại (Multi-farm).
- Mỗi nông trại có nhiều khu vực (Zone).
- Mỗi khu vực có nhiều thiết bị ESP32.
- Mỗi thiết bị có nhiều cảm biến.
- Tiếp nhận telemetry liên tục.
- Theo dõi trạng thái thiết bị online/offline.
- Cảnh báo tự động theo ngưỡng và quy tắc.
- Điều khiển thiết bị từ Web/Mobile.
- Thông báo ngay cả khi Mobile App đóng.
- AI phân tích dữ liệu và đưa ra khuyến nghị nông nghiệp.
1.3. Phạm vi hệ thống
Các module nghiệp vụ
01
Authentication & Authorization

Đăng nhập, JWT, RBAC, quản lý tài khoản.


02
Farm Management

Quản lý nông trại, khu vực và nhân sự.


03
IoT Device Management

Đăng ký ESP32, cảm biến, trạng thái thiết bị.


04
Telemetry Management

Tiếp nhận và truy vấn dữ liệu cảm biến.


05
MQTT Integration

Kết nối EMQX, subscribe/publish, device communication.


06
Alert Management

Quy tắc, phát hiện bất thường, quản lý cảnh báo.


07
Automation & Control

Điều khiển máy bơm, quạt, van tưới và thiết bị.


08
Notification

FCM, thông báo trong ứng dụng và realtime.


09
AI Agriculture

Phân tích dữ liệu, dự báo và khuyến nghị.


10
Analytics & Dashboard

Thống kê, biểu đồ, báo cáo.


11
Worker & Outbox

Xử lý nền, retry, chống mất sự kiện.


12
Audit & System

Nhật ký hoạt động, cấu hình và giám sát.




2. Phân tích nghiệp vụ (Business Analysis)
2.1. Mô tả bài toán
Smart Agriculture là hệ thống quản lý nông nghiệp thông minh, sử dụng IoT để thu thập dữ liệu môi trường từ các cảm biến được lắp đặt tại nông trại.

Ví dụ:
- DHT22: đo nhiệt độ và độ ẩm không khí.
- Soil Moisture Sensor: đo độ ẩm đất.
- Light Sensor: đo cường độ ánh sáng.
- Water Level Sensor: đo mực nước.
- ESP32: thu thập và gửi dữ liệu cảm biến qua MQTT.
Backend có nhiệm vụ tiếp nhận dữ liệu, lưu trữ, phân tích điều kiện môi trường và phát sinh cảnh báo hoặc hành động tự động.

AI bổ sung khả năng phân tích xu hướng, phát hiện bất thường và đưa ra khuyến nghị.
2.2. Quy trình nghiệp vụ tổng thể








medium.com


Luồng nghiệp vụ chính:
Luồng thu thập và xử lý dữ liệu IoT
ESP32 + Sensors

DHT22, Soil Moisture, Light...


EMQX MQTT Broker

Nhận và phân phối MQTT messages


MQTT Ingestion Worker

Validate · Authenticate device · Idempotency


Supabase PostgreSQL – Transaction
Telemetry

Alert

Outbox


Lưu các thay đổi liên quan trong cùng một transaction


Outbox Dispatcher / Workers

Retry · Event Processing · Notification


FCM

Push

Socket.IO

Realtime

AI Worker

Analysis



Điểm quan trọng: MQTT Worker và HTTP API là hai tiến trình độc lập. Không nên phụ thuộc vào vòng đời của một serverless function để duy trì kết nối MQTT lâu dài.
2.3. Các tác nhân hệ thống (Actors)
Actor	Trách nhiệm
Super Admin	Quản trị toàn hệ thống
Farm Owner	Quản lý nông trại
Farm Manager	Quản lý hoạt động nông trại
Technician	Quản lý và bảo trì thiết bị
Worker	Theo dõi và thực hiện công việc
Viewer	Chỉ xem dữ liệu
IoT Device	Gửi telemetry, nhận lệnh
AI Service	Phân tích và khuyến nghị
External Service	EMQX, FCM, AI Provider

2.4. Phân quyền nghiệp vụ
Đề xuất RBAC kết hợp phạm vi nông trại (Farm Scope).
Chức năng	Admin	Owner	Manager	Technician	Worker	Viewer
Quản lý tài khoản	✓	✓				
Quản lý farm	✓	✓	✓			
Quản lý khu vực	✓	✓	✓			
Quản lý thiết bị	✓	✓	✓	✓		
Xem telemetry	✓	✓	✓	✓	✓	✓
Điều khiển thiết bị	✓	✓	✓	✓		
Xử lý cảnh báo	✓	✓	✓	✓	✓	
AI phân tích	✓	✓	✓			✓
Xem báo cáo	✓	✓	✓			✓

Một người dùng có thể thuộc nhiều nông trại và có vai trò khác nhau ở từng nông trại. Không nên chỉ dựa vào role toàn hệ thống để quyết định quyền truy cập dữ liệu.
3. Use Case Analysis
3.1. Use Case tổng quan
#chatgpt-mermaid-_r_3hg_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_3hg_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3hg_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3hg_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_3hg_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3hg_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_3hg_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_3hg_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_3hg_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_3hg_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_3hg_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_3hg_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3hg_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3hg_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_3hg_ p{margin:0;}#chatgpt-mermaid-_r_3hg_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3hg_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3hg_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3hg_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_3hg_ .label text,#chatgpt-mermaid-_r_3hg_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3hg_ .node rect,#chatgpt-mermaid-_r_3hg_ .node circle,#chatgpt-mermaid-_r_3hg_ .node ellipse,#chatgpt-mermaid-_r_3hg_ .node polygon,#chatgpt-mermaid-_r_3hg_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_3hg_ .rough-node .label text,#chatgpt-mermaid-_r_3hg_ .node .label text,#chatgpt-mermaid-_r_3hg_ .image-shape .label,#chatgpt-mermaid-_r_3hg_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_3hg_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_3hg_ .rough-node .label,#chatgpt-mermaid-_r_3hg_ .node .label,#chatgpt-mermaid-_r_3hg_ .image-shape .label,#chatgpt-mermaid-_r_3hg_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_3hg_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_3hg_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3hg_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3hg_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-_r_3hg_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-_r_3hg_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_3hg_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3hg_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3hg_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-_r_3hg_ .cluster rect{fill:rgb(243, 243, 243);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_3hg_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3hg_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3hg_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(243, 243, 243);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_3hg_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3hg_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_3hg_ .icon-shape,#chatgpt-mermaid-_r_3hg_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_3hg_ .icon-shape p,#chatgpt-mermaid-_r_3hg_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-_r_3hg_ .icon-shape .label rect,#chatgpt-mermaid-_r_3hg_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3hg_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_3hg_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_3hg_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_3hg_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_3hg_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_3hg_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_3hg_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_3hg_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_3hg_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3hg_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_3hg_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3hg_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_3hg_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_3hg_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_3hg_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_3hg_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-_r_3hg_ .node rect,#chatgpt-mermaid-_r_3hg_ .node circle,#chatgpt-mermaid-_r_3hg_ .node ellipse,#chatgpt-mermaid-_r_3hg_ .node polygon,#chatgpt-mermaid-_r_3hg_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_3hg_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_3hg_ .mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_3hg_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_3hg_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3hg_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Smart Agriculture SystemAuthenticationManage FarmsManage ZonesManage DevicesMonitor TelemetryManage AlertsControl EquipmentManage Automation RulesView AnalyticsAI AnalysisManage UsersReceive NotificationsPublish TelemetryReceive CommandsSuper AdminFarm OwnerFarm ManagerTechnicianFarm WorkerViewerESP32 DeviceAI Service





3.2. Danh sách Use Case chi tiết
ID	Use Case	Actor	Mức ưu tiên
UC-01	Đăng nhập hệ thống	Tất cả người dùng	Critical
UC-02	Làm mới Access Token	Tất cả người dùng	Critical
UC-03	Quản lý nông trại	Admin, Owner	Critical
UC-04	Quản lý khu vực	Owner, Manager	Critical
UC-05	Đăng ký thiết bị ESP32	Technician, Manager	Critical
UC-06	Tiếp nhận dữ liệu MQTT	IoT Device	Critical
UC-07	Xem dữ liệu cảm biến realtime	Người dùng	Critical
UC-08	Cấu hình ngưỡng cảnh báo	Owner, Manager	Critical
UC-09	Tạo và xử lý cảnh báo	Backend	Critical
UC-10	Điều khiển thiết bị	Manager, Technician	High
UC-11	Tạo quy tắc tự động	Owner, Manager	High
UC-12	Gửi Push Notification	Backend	High
UC-13	Thống kê dữ liệu	Manager, Viewer	High
UC-14	AI phân tích môi trường	AI Service	High
UC-15	AI đề xuất giải pháp	AI Service	High
UC-16	Quản lý nhân sự farm	Owner	High
UC-17	Nhật ký hoạt động	Admin, Owner	Medium
UC-18	Xuất báo cáo	Manager	Medium

3.3. Các Use Case quan trọng
UC-06: Tiếp nhận dữ liệu IoT
Actor: ESP32

Điều kiện trước:
- Thiết bị đã được đăng ký trong hệ thống.
- Device ID hợp lệ.
- Thiết bị có quyền publish MQTT.
- MQTT Broker hoạt động.
Luồng chính:
1. ESP32 đọc dữ liệu cảm biến.
2. ESP32 publish MQTT message lên EMQX.
3. MQTT Worker nhận message.
4. Backend xác thực thiết bị và kiểm tra payload.
5. Kiểm tra message ID để chống ghi trùng.
6. Đánh giá ngưỡng cảnh báo.
7. Ghi Telemetry, Alert và Outbox trong transaction.
8. Worker xử lý Outbox và gửi sự kiện tới các dịch vụ liên quan.
Kết quả: Telemetry được lưu và các cảnh báo cần thiết được tạo.

Ví dụ dữ liệu MQTT hiện tại cần được bảo toàn:
{
  "deviceId": "ESP32_ZONE_01",
  "messageId": "msg-20261112-000001",
  "timestamp": "2026-11-12T12:00:00Z",
  "sensors": {
    "temperature": 41.5,
    "humidity": 72.0,
    "soilMoisture": 28.5
  },
  "battery": 98
}


Topic:
smartagri/devices/ESP32_ZONE_01/telemetry


Đây là topic tương thích với luồng MQTT đã sử dụng trước đó. Cần kiểm tra payload thực tế từ ESP32 và .NET để chốt schema chính thức.
UC-09: Xử lý cảnh báo tự động
Ví dụ:
- Nhiệt độ vượt ngưỡng 40°C.
- Độ ẩm đất thấp hơn 30%.
- Độ ẩm không khí vượt ngưỡng.
- Thiết bị không gửi dữ liệu trong thời gian quy định.
- Pin thiết bị thấp.
Luồng:
Telemetry Received
       |
       v
Threshold Evaluation
       |
       v
Alert Rule Matched?
       |
    +--+--+
    |     |
   No    Yes
    |     |
    v     v
  Store  Create Alert
         |
         v
      Create Outbox
         |
         v
      Send FCM
         |
         v
      Realtime Update


Cần thiết kế thêm cơ chế chống tạo hàng trăm cảnh báo trùng khi một cảm biến liên tục vượt ngưỡng.

Đề xuất sử dụng:
- Alert deduplication key.
- Alert state: ACTIVE, ACKNOWLEDGED, RESOLVED.
- Cooldown period.
- Alert escalation.
- Notification retry.
UC-10: Điều khiển thiết bị từ Web/Mobile
Ví dụ người quản lý bật máy bơm tưới nước.
Mobile App
    |
    v
POST /api/v1/devices/{id}/commands
    |
    v
Express API
    |
    v
Validate Permission
    |
    v
Create Device Command
    |
    v
Publish Outbox Event
    |
    v
MQTT Publisher Worker
    |
    v
EMQX
    |
    v
ESP32
    |
    v
Command ACK
    |
    v
Update Command Status


Nguyên tắc quan trọng: Không trả về trạng thái thành công của thiết bị ngay sau khi publish MQTT. Phải phân biệt:
- ACCEPTED: Backend đã tiếp nhận lệnh.
- PUBLISHED: Lệnh đã được publish lên broker.
- ACKNOWLEDGED: ESP32 xác nhận đã nhận lệnh.
- EXECUTED: Thiết bị xác nhận đã thực thi.
- FAILED: Lệnh thất bại.
- TIMEOUT: Không nhận được phản hồi đúng thời hạn.
Điều này giúp Mobile App hiển thị chính xác tình trạng điều khiển.

4. Clean Architecture
4.1. Kiến trúc tổng thể
Chọn Modular Monolith + Clean Architecture + Independent Workers.

Không chọn Microservices ngay từ đầu vì quy mô medium, đội ngũ phát triển và chi phí vận hành chưa cần thiết phải chia thành nhiều dịch vụ độc lập.

Tuy nhiên, các module nghiệp vụ phải có ranh giới rõ ràng để có thể tách riêng trong tương lai.
#chatgpt-mermaid-_r_3i9_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_3i9_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3i9_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3i9_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_3i9_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3i9_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_3i9_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_3i9_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_3i9_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_3i9_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_3i9_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_3i9_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3i9_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3i9_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_3i9_ p{margin:0;}#chatgpt-mermaid-_r_3i9_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3i9_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3i9_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3i9_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_3i9_ .label text,#chatgpt-mermaid-_r_3i9_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3i9_ .node rect,#chatgpt-mermaid-_r_3i9_ .node circle,#chatgpt-mermaid-_r_3i9_ .node ellipse,#chatgpt-mermaid-_r_3i9_ .node polygon,#chatgpt-mermaid-_r_3i9_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_3i9_ .rough-node .label text,#chatgpt-mermaid-_r_3i9_ .node .label text,#chatgpt-mermaid-_r_3i9_ .image-shape .label,#chatgpt-mermaid-_r_3i9_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_3i9_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_3i9_ .rough-node .label,#chatgpt-mermaid-_r_3i9_ .node .label,#chatgpt-mermaid-_r_3i9_ .image-shape .label,#chatgpt-mermaid-_r_3i9_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_3i9_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_3i9_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3i9_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3i9_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-_r_3i9_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-_r_3i9_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_3i9_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3i9_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3i9_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-_r_3i9_ .cluster rect{fill:rgb(243, 243, 243);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_3i9_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3i9_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3i9_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(243, 243, 243);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_3i9_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3i9_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_3i9_ .icon-shape,#chatgpt-mermaid-_r_3i9_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_3i9_ .icon-shape p,#chatgpt-mermaid-_r_3i9_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-_r_3i9_ .icon-shape .label rect,#chatgpt-mermaid-_r_3i9_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3i9_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_3i9_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_3i9_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_3i9_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_3i9_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_3i9_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_3i9_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_3i9_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_3i9_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3i9_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_3i9_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3i9_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_3i9_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_3i9_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_3i9_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_3i9_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-_r_3i9_ .node rect,#chatgpt-mermaid-_r_3i9_ .node circle,#chatgpt-mermaid-_r_3i9_ .node ellipse,#chatgpt-mermaid-_r_3i9_ .node polygon,#chatgpt-mermaid-_r_3i9_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_3i9_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_3i9_ .mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_3i9_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_3i9_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3i9_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Backend PlatformExternal InfrastructurePresentation ClientsApplication & Domain CoreApplication Use CasesDomain Entities & RulesRepository / GatewayInterfacesExpress HTTP APISocket.IO GatewayMQTT Ingestion WorkerOutbox DispatcherBackground WorkersInfrastructure AdaptersEMQX BrokerFirebase FCMAI ProviderWeb DashboardReact Native MobileESP32Supabase PostgreSQLOptional RedisMQTT





4.2. Quy tắc Clean Architecture
Kiến trúc gồm 4 lớp.
Layer	Trách nhiệm	Được phép phụ thuộc
Domain	Business Rules, Entity, Value Objects	Không phụ thuộc framework
Application	Use Cases, DTO, Ports	Domain
Infrastructure	Prisma, MQTT, FCM, AI, Redis	Application + Domain
Presentation	Express, Controllers, Socket.IO	Application

Nguyên tắc dependency:
Presentation
     |
     v
Application
     |
     v
Domain

Infrastructure implements Application Ports


Infrastructure không được đưa logic nghiệp vụ vào repository hoặc controller.

Ví dụ:
- Quy tắc nhiệt độ vượt ngưỡng thuộc Domain/Application.
- Prisma query thuộc Infrastructure.
- Express Request/Response thuộc Presentation.
- Gửi FCM thuộc Infrastructure Adapter.
- Gọi Gemini hoặc AI provider thuộc AI Gateway Adapter.
4.3. Cấu trúc thư mục dự kiến
smart-agriculture-backend/
│
├── src/
│   ├── app/
│   │   ├── bootstrap/
│   │   ├── config/
│   │   ├── container/
│   │   └── routes/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   ├── users/
│   │   ├── farms/
│   │   ├── zones/
│   │   ├── devices/
│   │   ├── sensors/
│   │   ├── telemetry/
│   │   ├── alerts/
│   │   ├── automation/
│   │   ├── commands/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   ├── ai/
│   │   └── audit/
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── mqtt/
│   │   ├── firebase/
│   │   ├── ai/
│   │   ├── cache/
│   │   ├── socket/
│   │   └── logging/
│   │
│   ├── shared/
│   │   ├── errors/
│   │   ├── response/
│   │   ├── middleware/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── main.ts
│
├── workers/
│   ├── mqtt-ingestion/
│   ├── outbox-dispatcher/
│   ├── notification/
│   ├── device-health/
│   ├── ai-analysis/
│   └── index.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   └── mqtt/
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md


Đây là cấu trúc mục tiêu. Chưa tạo file hoặc code.
4.4. Phân chia trách nhiệm giữa API và Worker
Đây là quyết định kiến trúc quan trọng.
A. HTTP API Server – Express
Stateless
- Authentication / Authorization.
- Quản lý farm, zone, device.
- Truy vấn telemetry.
- Quản lý alert.
- Điều khiển thiết bị.
- AI API.
- Socket.IO Gateway.


B. MQTT Ingestion Worker
Long-running process
- Kết nối EMQX.
- Subscribe telemetry.
- Xác thực thiết bị.
- Kiểm tra dữ liệu.
- Ghi database.
- Đánh giá cảnh báo.


C. Outbox Dispatcher
Background process
- Đọc sự kiện chưa xử lý.
- Gửi FCM.
- Publish MQTT command.
- Phát Socket.IO events.
- Retry và dead-letter handling.


D. AI Worker
AI Processing
- Phân tích telemetry lịch sử.
- Phát hiện bất thường.
- Tạo dự báo.
- Đưa ra khuyến nghị.


Nếu triển khai API trên Vercel thì chỉ sử dụng cho HTTP API tương thích với serverless. MQTT Ingestion Worker và Outbox Dispatcher phải được triển khai trên nền tảng hỗ trợ tiến trình chạy liên tục như Render hoặc Railway.
4.5. Transactional Outbox Design
Vì hệ thống có các nghiệp vụ cần đồng bộ database, MQTT, FCM và Socket.IO, không nên gửi notification trực tiếp trong transaction nghiệp vụ.

Thiết kế:
Database Transaction
  |
  +-- Insert Telemetry
  |
  +-- Insert Alert
  |
  +-- Insert Outbox Event
  |
  +-- COMMIT
          |
          v
   Outbox Dispatcher
          |
          +-- FCM
          +-- Socket.IO
          +-- MQTT
          +-- AI Job


Các trường quan trọng của Outbox:
Field	Ý nghĩa
id	Event ID
aggregate_type	Đối tượng nghiệp vụ
aggregate_id	ID đối tượng
event_type	Loại sự kiện
payload	JSON payload
status	PENDING, PROCESSING, PROCESSED, FAILED
retry_count	Số lần retry
next_retry_at	Thời gian thử lại
locked_at	Thời gian nhận xử lý
processed_at	Thời gian hoàn tất

Cần lưu ý rằng việc gửi FCM, MQTT và Socket.IO không thể nằm trong cùng một transaction PostgreSQL. Outbox bảo đảm sự kiện được lưu cùng nghiệp vụ, còn xử lý giao nhận sử dụng cơ chế retry và idempotency.

5. Database Design – Supabase PostgreSQL
5.1. Quyết định thiết kế database
Chọn Supabase PostgreSQL làm database trung tâm, không sử dụng Firebase Firestore thay thế.

Các nguyên tắc:
1. Dữ liệu nghiệp vụ có quan hệ sử dụng PostgreSQL.
2. Telemetry sử dụng bảng chuyên biệt, có index theo device và thời gian.
3. Dữ liệu lịch sử cần chiến lược partition/retention.
4. Tất cả bảng quan trọng có UUID primary key.
5. Dữ liệu có created_at, updated_at.
6. Có soft delete cho các đối tượng cần khôi phục.
7. Dùng transaction để xử lý các nghiệp vụ liên quan.
8. Bật RLS cho các bảng được truy cập qua Supabase Data API.
9. Backend không trả trực tiếp database credentials cho Web/Mobile.
Phân biệt: Supabase là nền tảng PostgreSQL và các dịch vụ đi kèm. Prisma là ORM mà Express Backend sử dụng để truy cập database. Không cần cho frontend truy cập trực tiếp vào database để gọi nghiệp vụ.
5.2. Phân nhóm bảng
Đề xuất khoảng 28–32 bảng nghiệp vụ cốt lõi trong phiên bản đầu, chưa tính bảng migration, cấu hình và bảng mở rộng.
Nhóm	Bảng	Chức năng
Identity	users	Tài khoản
Identity	roles	Vai trò
Identity	permissions	Quyền
Identity	user_roles	Vai trò người dùng
Identity	role_permissions	Quyền của vai trò
Farm	farms	Nông trại
Farm	farm_members	Thành viên farm
Farm	zones	Khu vực
IoT	devices	Thiết bị ESP32
IoT	sensors	Cảm biến
IoT	device_credentials	Thông tin xác thực thiết bị
IoT	device_commands	Lệnh điều khiển
IoT	device_command_logs	Nhật ký lệnh
Telemetry	telemetry	Dữ liệu cảm biến
Alert	alert_rules	Quy tắc cảnh báo
Alert	alerts	Cảnh báo
Automation	automation_rules	Quy tắc tự động
Automation	automation_logs	Nhật ký tự động hóa
Notification	notifications	Thông báo
Notification	device_tokens	Token FCM
Event	outbox_events	Transactional Outbox
AI	ai_analysis	Kết quả phân tích
AI	ai_recommendations	Khuyến nghị AI
System	audit_logs	Nhật ký hệ thống

Có thể bổ sung bảng crops, planting_cycles, tasks, weather_records, irrigation_schedules và harvest_records ở giai đoạn mở rộng nghiệp vụ nông nghiệp.
5.3. ERD – Entity Relationship Diagram
Đây là ERD logic phiên bản đầu, thể hiện các quan hệ chính. Các bảng log, cấu hình và trường kỹ thuật có thể được tinh chỉnh trong thiết kế vật lý.
#chatgpt-mermaid-_r_3j1_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_3j1_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3j1_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3j1_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_3j1_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3j1_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_3j1_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_3j1_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_3j1_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_3j1_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_3j1_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_3j1_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3j1_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3j1_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_3j1_ p{margin:0;}#chatgpt-mermaid-_r_3j1_ .entityBox{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_3j1_ .relationshipLabelBox{fill:rgb(243, 243, 243);opacity:0.7;background-color:rgb(243, 243, 243);}#chatgpt-mermaid-_r_3j1_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-_r_3j1_ .labelBkg{background-color:rgba(243, 243, 243, 0.5);}#chatgpt-mermaid-_r_3j1_ .edgeLabel{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3j1_ .edgeLabel .label rect{fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3j1_ .edgeLabel .label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3j1_ .edgeLabel .label{fill:rgb(83, 154, 248);font-size:14px;}#chatgpt-mermaid-_r_3j1_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3j1_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-_r_3j1_ .node rect,#chatgpt-mermaid-_r_3j1_ .node circle,#chatgpt-mermaid-_r_3j1_ .node ellipse,#chatgpt-mermaid-_r_3j1_ .node polygon{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_3j1_ .relationshipLine{stroke:rgb(143, 143, 143);stroke-width:1px;fill:none;}#chatgpt-mermaid-_r_3j1_ .marker{fill:none!important;stroke:rgb(143, 143, 143)!important;stroke-width:1;}#chatgpt-mermaid-_r_3j1_ [data-look=neo].labelBkg{background-color:rgba(243, 243, 243, 0.5);}#chatgpt-mermaid-_r_3j1_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_3j1_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_3j1_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_3j1_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_3j1_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_3j1_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_3j1_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3j1_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_3j1_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3j1_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}USERSuuididPKvarcharemailUKvarcharpassword_hashvarcharfull_namevarcharstatustimestamptzcreated_atROLESuuididPKvarcharcodeUKvarcharnamePERMISSIONSuuididPKvarcharcodeUKvarchardescriptionUSER_ROLESuuiduser_idFKuuidrole_idFKROLE_PERMISSIONSuuidrole_idFKuuidpermission_idFKFARMSuuididPKvarcharnamevarcharlocationuuidowner_idFKvarcharstatusFARM_MEMBERSuuididPKuuidfarm_idFKuuiduser_idFKuuidrole_idFKZONESuuididPKuuidfarm_idFKvarcharnamedecimalareavarcharstatusDEVICESuuididPKuuidzone_idFKvarchardevice_codeUKvarcharnamevarchardevice_typevarcharstatustimestamptzlast_seen_atDEVICE_CREDENTIALSuuididPKuuiddevice_idFKvarcharcredential_hashbooleanis_activeSENSORSuuididPKuuiddevice_idFKvarcharsensor_typevarcharunitvarcharstatusTELEMETRYuuididPKuuiddevice_idFKuuidsensor_idFKvarcharmessage_iddecimalvaluetimestamptzrecorded_atALERT_RULESuuididPKuuidfarm_idFKuuidzone_idFKvarcharmetricvarcharoperatordecimalthresholdbooleanenabledALERTSuuididPKuuidfarm_idFKuuiddevice_idFKuuidrule_idFKvarcharseverityvarcharstatustextmessagetimestamptzcreated_atDEVICE_COMMANDSuuididPKuuiddevice_idFKuuidrequested_byFKvarcharcommand_typevarcharstatusjsonbpayloadDEVICE_COMMAND_LOGSuuididPKuuidcommand_idFKvarcharevent_typejsonbpayloadtimestamptzcreated_atAUTOMATION_RULESuuididPKuuidfarm_idFKuuidzone_idFKjsonbconditionsjsonbactionsbooleanenabledAUTOMATION_LOGSuuididPKuuidrule_idFKvarcharexecution_statusjsonbresultNOTIFICATIONSuuididPKuuiduser_idFKvarchartypevarchartitletextbodytimestamptzread_atDEVICE_TOKENSuuididPKuuiduser_idFKvarchartokenvarcharplatformbooleanactiveOUTBOX_EVENTSuuididPKvarcharaggregate_typeuuidaggregate_idvarcharevent_typejsonbpayloadvarcharstatusintegerretry_countAI_ANALYSISuuididPKuuidfarm_idFKuuidzone_idFKvarcharanalysis_typejsonbinput_summaryjsonbresultAI_RECOMMENDATIONSuuididPKuuidanalysis_idFKuuidfarm_idFKtextrecommendationvarcharstatusAUDIT_LOGSuuididPKuuiduser_idFKvarcharactionvarcharresourcejsonbmetadatahasassignedgrantscontainsownsjoinshasscoped_rolecontainscontainsauthenticateshasproducesmeasuresconfiguresscopestriggerscontainsgeneratesreceivesrequeststracksownsscopesexecutesreceivesregistersanalyzedgeneratesperforms





5.4. Thiết kế chi tiết các bảng quan trọng
A. Bảng farms
Field	Type	Constraint
id	UUID	PK
name	VARCHAR(150)	NOT NULL
code	VARCHAR(50)	UNIQUE
description	TEXT	NULL
location	TEXT	NULL
latitude	DECIMAL(10,7)	NULL
longitude	DECIMAL(10,7)	NULL
owner_id	UUID	FK users
status	VARCHAR(20)	ACTIVE/INACTIVE
created_at	TIMESTAMPTZ	NOT NULL
updated_at	TIMESTAMPTZ	NOT NULL
deleted_at	TIMESTAMPTZ	NULL

B. Bảng devices
Field	Type	Ý nghĩa
id	UUID	Primary key
zone_id	UUID	Khu vực
device_code	VARCHAR(100)	ESP32_ZONE_01
name	VARCHAR(150)	Tên thiết bị
device_type	VARCHAR(50)	ESP32
firmware_version	VARCHAR(50)	Firmware
mqtt_client_id	VARCHAR(100)	MQTT Client ID
status	VARCHAR(30)	ONLINE/OFFLINE
last_seen_at	TIMESTAMPTZ	Lần cuối nhận dữ liệu
registered_at	TIMESTAMPTZ	Ngày đăng ký

Không sử dụng device_code làm password MQTT. Mỗi thiết bị cần credential riêng, lưu dạng hash hoặc sử dụng cơ chế xác thực tương đương.
C. Bảng telemetry
Field	Type	Ý nghĩa
id	UUID	Primary key
device_id	UUID	Thiết bị
sensor_id	UUID	Cảm biến
message_id	VARCHAR(100)	Chống trùng
value	NUMERIC(12,4)	Giá trị
recorded_at	TIMESTAMPTZ	Thời gian đo
received_at	TIMESTAMPTZ	Thời gian server nhận
metadata	JSONB	Dữ liệu bổ sung

Đối với telemetry, cần phân biệt thời gian thiết bị gửi và thời gian server nhận để xử lý trường hợp thiết bị mất mạng rồi gửi bù dữ liệu.

Nếu một message chứa nhiều sensor readings, có thể lưu mỗi reading thành một record riêng để tối ưu truy vấn theo sensor.
D. Bảng alerts
Field	Type	Ý nghĩa
id	UUID	Primary key
farm_id	UUID	Nông trại
zone_id	UUID	Khu vực
device_id	UUID	Thiết bị
rule_id	UUID	Quy tắc
metric	VARCHAR(50)	temperature
observed_value	NUMERIC(12,4)	Giá trị hiện tại
threshold_value	NUMERIC(12,4)	Ngưỡng
severity	VARCHAR(20)	INFO/WARNING/CRITICAL
status	VARCHAR(30)	ACTIVE/ACKNOWLEDGED/RESOLVED
deduplication_key	VARCHAR(255)	Chống trùng
created_at	TIMESTAMPTZ	Thời gian phát sinh
resolved_at	TIMESTAMPTZ	Thời gian xử lý

E. Bảng outbox_events
Cần bổ sung các trường quản lý concurrency:
- id
- event_type
- aggregate_type
- aggregate_id
- payload
- status
- retry_count
- max_retries
- next_retry_at
- locked_at
- locked_by
- processed_at
- last_error
- created_at
Không nên để nhiều worker lấy cùng một sự kiện và gửi trùng. Việc claim event cần dùng cơ chế atomic update hoặc FOR UPDATE SKIP LOCKED.
F. Các bảng AI
ai_analysis lưu:
- Farm/Zone được phân tích.
- Loại phân tích.
- Khoảng thời gian dữ liệu.
- Model và provider.
- Input summary.
- Kết quả phân tích dạng JSON.
- Confidence score.
- Thời gian xử lý.
ai_recommendations lưu:
- Khuyến nghị.
- Mức độ ưu tiên.
- Lý do.
- Dữ liệu làm căn cứ.
- Trạng thái PENDING/ACCEPTED/REJECTED/COMPLETED.
- Người xác nhận.
AI không được trực tiếp bật máy bơm, mở van hoặc điều khiển thiết bị nguy hiểm. Khuyến nghị cần qua quy tắc an toàn và quyền xác nhận của người dùng.
5.5. Supabase – Security & Performance
Row Level Security (RLS)
Đề xuất phân chia:
Nhóm truy cập	Cách truy cập
Web/Mobile	Express API
Express API	PostgreSQL qua Prisma
MQTT Worker	PostgreSQL qua Prisma
Supabase Dashboard	Quản trị có kiểm soát
Supabase Data API	Chỉ bật khi có nhu cầu truy cập trực tiếp

Với hệ thống này, nên mặc định Web/Mobile không truy cập trực tiếp các bảng nghiệp vụ qua Supabase Data API.

Các bảng được expose qua Supabase API phải bật RLS và có policy riêng. service_role hoặc secret key tuyệt đối không được đưa vào frontend.

Backend cần kiểm tra quyền theo farm_id, không chỉ kiểm tra người dùng đã đăng nhập.
Index đề xuất
Bảng	Index
users	UNIQUE(email)
farms	owner_id
farm_members	UNIQUE(farm_id, user_id)
zones	farm_id
devices	UNIQUE(device_code), zone_id
sensors	device_id
telemetry	(device_id, recorded_at DESC)
telemetry	(sensor_id, recorded_at DESC)
alerts	(farm_id, status, created_at DESC)
device_commands	(device_id, created_at DESC)
outbox_events	(status, next_retry_at)
notifications	(user_id, read_at, created_at DESC)

Telemetry Partitioning
Với khoảng 10.000 readings/giờ, hệ thống có thể tích lũy hàng triệu bản ghi mỗi năm.

Đề xuất:
- Giai đoạn đầu: PostgreSQL table + indexes.
- Khi dữ liệu tăng: partition theo tháng bằng recorded_at.
- Có retention policy riêng.
- Dữ liệu cũ có thể tổng hợp theo giờ/ngày.
- Không truy vấn toàn bộ lịch sử khi hiển thị Dashboard.
Lưu ý: Partitioning cần được thiết kế ngay trong schema vật lý nếu chọn áp dụng; không nên giả định Prisma tự động quản lý toàn bộ partition lifecycle.

6. API Specification – RESTful API v1
6.1. Quy tắc API
Base URL:
/api/v1


Quy ước:
Thành phần	Quy tắc
Resource	Danh từ số nhiều
HTTP	GET, POST, PATCH, DELETE
Authentication	Bearer JWT
Content-Type	application/json
Pagination	page, limit
Sorting	sortBy, sortOrder
Filtering	Query parameters
Version	v1
DateTime	ISO 8601 UTC
ID	UUID

Response envelope đề xuất:
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {
    "timestamp": "2026-11-12T12:00:00Z",
    "traceId": "request-uuid"
  }
}


Đối với phân trang:
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}


Lỗi:
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  },
  "meta": {
    "traceId": "request-uuid"
  }
}


Các HTTP status chính:
Status	Ý nghĩa
200	Thành công
201	Tạo mới
202	Đã tiếp nhận xử lý bất đồng bộ
204	Xóa thành công, không có response body
400	Request không hợp lệ
401	Chưa xác thực
403	Không đủ quyền
404	Không tìm thấy
409	Xung đột dữ liệu
422	Không thể xử lý nghiệp vụ
429	Quá nhiều request
500	Lỗi server

6.2. Authentication API
Base:
/api/v1/auth


Method	Endpoint	Chức năng
POST	/register	Đăng ký
POST	/login	Đăng nhập
POST	/refresh-token	Refresh JWT
POST	/logout	Đăng xuất
POST	/forgot-password	Yêu cầu reset password
POST	/reset-password	Đặt lại mật khẩu
GET	/me	Lấy profile
PATCH	/me	Cập nhật profile
POST	/change-password	Đổi mật khẩu

Định dạng login:
{
  "email": "owner@example.com",
  "password": "********"
}


Response cần tương thích cấu trúc token đang sử dụng trong ứng dụng hiện tại nếu đã có Mobile Client tích hợp.
6.3. User & Farm API
Base:
/api/v1


Method	Endpoint	Chức năng
GET	/users	Danh sách người dùng
GET	/users/:id	Chi tiết người dùng
POST	/users	Tạo người dùng
PATCH	/users/:id	Cập nhật người dùng
DELETE	/users/:id	Xóa người dùng
GET	/farms	Danh sách farm
POST	/farms	Tạo farm
GET	/farms/:farmId	Chi tiết farm
PATCH	/farms/:farmId	Cập nhật farm
DELETE	/farms/:farmId	Xóa farm
GET	/farms/:farmId/members	Danh sách thành viên
POST	/farms/:farmId/members	Thêm thành viên
PATCH	/farms/:farmId/members/:userId	Cập nhật vai trò
DELETE	/farms/:farmId/members/:userId	Xóa thành viên

6.4. Zone API
/api/v1/farms/:farmId/zones


Method	Endpoint	Chức năng
GET	/	Danh sách zone
POST	/	Tạo zone
GET	/:zoneId	Chi tiết zone
PATCH	/:zoneId	Cập nhật zone
DELETE	/:zoneId	Xóa zone
GET	/:zoneId/devices	Thiết bị trong zone
GET	/:zoneId/telemetry	Dữ liệu cảm biến

6.5. IoT Device API
Base:
/api/v1/devices


Method	Endpoint	Chức năng
GET	/	Danh sách thiết bị
POST	/	Đăng ký thiết bị
GET	/:deviceId	Chi tiết thiết bị
PATCH	/:deviceId	Cập nhật thiết bị
DELETE	/:deviceId	Xóa thiết bị
POST	/:deviceId/credentials/rotate	Đổi credential
GET	/:deviceId/sensors	Danh sách cảm biến
GET	/:deviceId/status	Trạng thái thiết bị
GET	/:deviceId/telemetry/latest	Telemetry mới nhất
GET	/:deviceId/telemetry/history	Lịch sử telemetry
GET	/:deviceId/commands	Lịch sử lệnh
POST	/:deviceId/commands	Gửi lệnh điều khiển
GET	/:deviceId/commands/:commandId	Trạng thái lệnh

Đăng ký device:
{
  "deviceCode": "ESP32_ZONE_01",
  "name": "ESP32 khu vực 01",
  "deviceType": "ESP32",
  "zoneId": "uuid",
  "firmwareVersion": "1.0.0",
  "sensors": [
    {
      "type": "DHT22",
      "metrics": ["temperature", "humidity"]
    },
    {
      "type": "SOIL_MOISTURE",
      "metrics": ["soilMoisture"]
    }
  ]
}


6.6. Telemetry API
Base:
/api/v1/telemetry


Method	Endpoint	Chức năng
GET	/latest	Dữ liệu mới nhất
GET	/history	Lịch sử telemetry
GET	/devices/:deviceId	Dữ liệu theo device
GET	/zones/:zoneId	Dữ liệu theo zone
GET	/farms/:farmId	Dữ liệu theo farm
GET	/statistics	Thống kê
GET	/aggregates	Dữ liệu tổng hợp

Ví dụ truy vấn:
GET /api/v1/telemetry/history
    ?deviceId=uuid
    &metric=temperature
    &from=2026-11-01T00:00:00Z
    &to=2026-11-12T23:59:59Z
    &interval=1h


Response:
{
  "success": true,
  "data": [
    {
      "deviceId": "uuid",
      "metric": "temperature",
      "value": 32.5,
      "unit": "celsius",
      "recordedAt": "2026-11-12T12:00:00Z"
    }
  ]
}


6.7. Alert API
Base:
/api/v1/alerts


Method	Endpoint	Chức năng
GET	/	Danh sách cảnh báo
GET	/:alertId	Chi tiết cảnh báo
POST	/rules	Tạo alert rule
GET	/rules	Danh sách rule
GET	/rules/:ruleId	Chi tiết rule
PATCH	/rules/:ruleId	Cập nhật rule
DELETE	/rules/:ruleId	Xóa rule
POST	/:alertId/acknowledge	Xác nhận cảnh báo
POST	/:alertId/resolve	Giải quyết cảnh báo

Ví dụ alert rule:
{
  "name": "High Temperature",
  "metric": "temperature",
  "operator": "GT",
  "threshold": 40,
  "severity": "CRITICAL",
  "cooldownSeconds": 300,
  "enabled": true
}


6.8. Automation & Device Command API
Method	Endpoint	Chức năng
GET	/api/v1/automation/rules	Danh sách automation
POST	/api/v1/automation/rules	Tạo automation
PATCH	/api/v1/automation/rules/:id	Cập nhật
DELETE	/api/v1/automation/rules/:id	Xóa
GET	/api/v1/automation/logs	Nhật ký
POST	/api/v1/devices/:id/commands	Gửi lệnh
GET	/api/v1/devices/:id/commands/:commandId	Theo dõi lệnh

Ví dụ command:
{
  "commandType": "PUMP_CONTROL",
  "payload": {
    "action": "ON",
    "durationSeconds": 60
  },
  "idempotencyKey": "pump-zone01-20261112-001"
}


Response:
{
  "success": true,
  "message": "Command accepted",
  "data": {
    "commandId": "uuid",
    "status": "ACCEPTED"
  }
}


Command phải được kiểm tra quyền, giới hạn thời gian thực thi, trạng thái thiết bị và điều kiện an toàn trước khi publish.
6.9. Notification API
Base:
/api/v1/notifications


Method	Endpoint	Chức năng
GET	/	Danh sách thông báo
GET	/unread-count	Số chưa đọc
PATCH	/:id/read	Đánh dấu đã đọc
POST	/read-all	Đánh dấu tất cả đã đọc
POST	/device-tokens	Đăng ký FCM token
DELETE	/device-tokens/:id	Hủy đăng ký token

FCM là dịch vụ push notification, còn Socket.IO phục vụ realtime khi Web/Mobile đang kết nối. Hai cơ chế bổ sung cho nhau.
6.10. AI API
Đề xuất 3 nhóm AI chính.
Method	Endpoint	Chức năng
POST	/api/v1/ai/analyze	Phân tích môi trường
GET	/api/v1/ai/analysis	Lịch sử phân tích
GET	/api/v1/ai/analysis/:id	Chi tiết phân tích
POST	/api/v1/ai/recommendations	Tạo khuyến nghị
GET	/api/v1/ai/recommendations	Danh sách khuyến nghị
POST	/api/v1/ai/recommendations/:id/accept	Chấp nhận
POST	/api/v1/ai/recommendations/:id/reject	Từ chối
GET	/api/v1/ai/health	Kiểm tra AI provider

AI nên hoạt động theo ba nhóm:
AI Predictive Analytics

- Phân tích xu hướng nhiệt độ.
- Dự báo độ ẩm đất.
- Phát hiện biến động bất thường.
  
  AI Agriculture Assistant
- Trả lời câu hỏi về dữ liệu nông trại.
- Giải thích các chỉ số cảm biến.
- Hướng dẫn người quản lý xử lý cảnh báo.
  
  AI Recommendation
- Khuyến nghị tưới nước.
- Khuyến nghị kiểm tra môi trường.
- Phát hiện dấu hiệu cần kiểm tra thiết bị hoặc cây trồng.

Không nên dùng LLM làm công cụ duy nhất để dự báo. Các bài toán dự báo định lượng cần dữ liệu lịch sử đủ chất lượng và có thể sử dụng mô hình time-series riêng. LLM chủ yếu đảm nhiệm giải thích và chuyển kết quả phân tích thành khuyến nghị dễ hiểu.
6.11. Dashboard & Analytics API
Method	Endpoint	Chức năng
GET	/api/v1/dashboard/overview	Tổng quan
GET	/api/v1/dashboard/farms/:id	Tổng quan farm
GET	/api/v1/dashboard/devices	Trạng thái thiết bị
GET	/api/v1/dashboard/alerts	Thống kê cảnh báo
GET	/api/v1/analytics/telemetry	Phân tích cảm biến
GET	/api/v1/analytics/devices	Thống kê thiết bị
GET	/api/v1/analytics/alerts	Thống kê cảnh báo

6.12. Realtime API
Socket.IO đề xuất các event:
Event	Hướng	Ý nghĩa
telemetry:new	Server → Client	Có dữ liệu mới
device:status	Server → Client	Thiết bị thay đổi trạng thái
alert:new	Server → Client	Cảnh báo mới
alert:updated	Server → Client	Cảnh báo thay đổi
command:status	Server → Client	Trạng thái lệnh
notification:new	Server → Client	Thông báo mới
ai:analysis:completed	Server → Client	AI hoàn tất phân tích

Room convention:
user:{userId}
farm:{farmId}
zone:{zoneId}
device:{deviceId}


Phải xác thực JWT khi kết nối Socket.IO và kiểm tra membership trước khi cho client tham gia room.
6.13. MQTT Topic Specification
Để không phá vỡ ESP32 hiện tại, giữ nguyên topic telemetry.
Topic	Direction	Chức năng
smartagri/devices//telemetry	Device → Backend	Dữ liệu cảm biến
smartagri/devices//status	Device → Backend	Trạng thái
smartagri/devices//commands	Backend → Device	Lệnh điều khiển
smartagri/devices//ack	Device → Backend	Xác nhận lệnh
smartagri/devices//config	Backend → Device	Cấu hình
smartagri/devices//events	Device → Backend	Sự kiện thiết bị

Thiết kế QoS:
- Telemetry: QoS 1 nếu cần đảm bảo giao nhận, kết hợp idempotency.
- Commands: QoS 1.
- ACK: QoS 1.
- Status: QoS 1.
- Retained message: chỉ dùng có chọn lọc cho trạng thái hoặc cấu hình phù hợp.
Cần cấu hình MQTT ACL theo từng device để thiết bị không thể publish hoặc subscribe vào topic của thiết bị khác.


7. AI Integration Architecture
7.1. AI không phụ thuộc trực tiếp vào Express
Đề xuất sử dụng kiến trúc AI Provider Adapter để không phụ thuộc vào một nhà cung cấp duy nhất.
#chatgpt-mermaid-_r_3mk_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_3mk_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3mk_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3mk_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_3mk_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3mk_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_3mk_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_3mk_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_3mk_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_3mk_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_3mk_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_3mk_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3mk_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3mk_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_3mk_ p{margin:0;}#chatgpt-mermaid-_r_3mk_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3mk_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3mk_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3mk_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_3mk_ .label text,#chatgpt-mermaid-_r_3mk_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3mk_ .node rect,#chatgpt-mermaid-_r_3mk_ .node circle,#chatgpt-mermaid-_r_3mk_ .node ellipse,#chatgpt-mermaid-_r_3mk_ .node polygon,#chatgpt-mermaid-_r_3mk_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_3mk_ .rough-node .label text,#chatgpt-mermaid-_r_3mk_ .node .label text,#chatgpt-mermaid-_r_3mk_ .image-shape .label,#chatgpt-mermaid-_r_3mk_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_3mk_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_3mk_ .rough-node .label,#chatgpt-mermaid-_r_3mk_ .node .label,#chatgpt-mermaid-_r_3mk_ .image-shape .label,#chatgpt-mermaid-_r_3mk_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_3mk_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_3mk_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3mk_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3mk_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-_r_3mk_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-_r_3mk_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_3mk_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3mk_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3mk_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-_r_3mk_ .cluster rect{fill:rgb(243, 243, 243);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_3mk_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3mk_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3mk_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(243, 243, 243);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_3mk_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3mk_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_3mk_ .icon-shape,#chatgpt-mermaid-_r_3mk_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_3mk_ .icon-shape p,#chatgpt-mermaid-_r_3mk_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-_r_3mk_ .icon-shape .label rect,#chatgpt-mermaid-_r_3mk_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3mk_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_3mk_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_3mk_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_3mk_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_3mk_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_3mk_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_3mk_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_3mk_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_3mk_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3mk_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_3mk_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3mk_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_3mk_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_3mk_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_3mk_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_3mk_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-_r_3mk_ .node rect,#chatgpt-mermaid-_r_3mk_ .node circle,#chatgpt-mermaid-_r_3mk_ .node ellipse,#chatgpt-mermaid-_r_3mk_ .node polygon,#chatgpt-mermaid-_r_3mk_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_3mk_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_3mk_ .mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_3mk_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_3mk_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3mk_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Web / MobileExpress AI ControllerAI Application Use CaseAI Analysis ServiceFarm Context BuilderAI Provider InterfaceGoogle GeminiOpenAIOther AI ProviderSupabaseAI Worker





7.2. AI Processing Flow
Ví dụ người dùng yêu cầu:
Phân tích tình trạng môi trường khu vực Zone 01 trong 24 giờ gần nhất và đề xuất giải pháp.

Quy trình:
1. Xác thực người dùng.
2. Kiểm tra quyền truy cập Farm và Zone.
3. Truy vấn telemetry 24 giờ.
4. Tính toán thống kê: min, max, average, trend.
5. Lấy các alert liên quan.
6. Tạo context dữ liệu cho AI.
7. Gọi AI Provider.
8. Validate kết quả trả về.
9. Lưu ai_analysis.
10. Lưu ai_recommendations.
11. Trả kết quả cho Mobile/Web.
Ví dụ cấu trúc kết quả mong muốn:
{
  "analysisType": "ENVIRONMENT_ANALYSIS",
  "farmId": "uuid",
  "zoneId": "uuid",
  "summary": "Môi trường khu vực có nhiệt độ cao",
  "metrics": {
    "temperature": {
      "average": 35.2,
      "maximum": 41.5
    },
    "humidity": {
      "average": 68.5
    },
    "soilMoisture": {
      "average": 29.5
    }
  },
  "recommendations": [
    {
      "title": "Kiểm tra điều kiện tưới",
      "priority": "HIGH",
      "reason": "Độ ẩm đất thấp hơn ngưỡng cấu hình",
      "requiresApproval": true
    }
  ]
}


Các con số trên chỉ minh họa format, không phải dữ liệu phân tích thực tế.
7.3. Phạm vi AI theo giai đoạn
Giai đoạn	Chức năng
AI 1.0	Phân tích dữ liệu, hỏi đáp về farm
AI 1.1	Phát hiện bất thường
AI 1.2	Dự báo nhiệt độ, độ ẩm
AI 1.3	Khuyến nghị tưới tiêu
AI 2.0	Phân tích hình ảnh cây trồng
AI 2.1	Dự báo sâu bệnh khi có dữ liệu phù hợp

Không nên triển khai toàn bộ AI ngay trong MVP. Nên hoàn thiện telemetry và alert trước, sau đó mới phát triển dự báo và khuyến nghị.

8. Security Architecture
Đây là phần bắt buộc vì hệ thống vừa quản lý dữ liệu người dùng, vừa điều khiển thiết bị IoT.
8.1. Authentication
Đề xuất:
- JWT Access Token thời hạn ngắn.
- Refresh Token có rotation.
- Refresh Token lưu dạng hash.
- Logout thu hồi refresh session.
- Password hashing bằng Argon2id hoặc bcrypt với cấu hình phù hợp.
- Rate limit login.
- Account lockout.
- Password reset bằng token một lần.
Nếu kế thừa authentication từ .NET, cần giữ tương thích với frontend trong giai đoạn migration.
8.2. Authorization
Sử dụng hai lớp:

Global RBAC:
- SUPER_ADMIN
- FARM_OWNER
- FARM_MANAGER
- TECHNICIAN
- FARM_WORKER
- VIEWER
Farm-scoped RBAC:

Một người dùng có thể là Manager ở Farm A nhưng chỉ là Viewer ở Farm B.

Quyền truy cập cần kiểm tra:
Authenticated User
       |
       v
Global Permission
       |
       v
Farm Membership
       |
       v
Farm-scoped Role
       |
       v
Resource Ownership / Scope
       |
       v
Allow or Deny


8.3. IoT Security
Các biện pháp cần có:
1. MQTT TLS.
2. Device credential riêng.
3. MQTT ACL.
4. Không dùng Device ID làm mật khẩu.
5. Credential rotation.
6. Message ID và timestamp.
7. Kiểm tra payload và giới hạn kích thước.
8. Chống replay message.
9. Rate limit theo device.
10. Audit lệnh điều khiển.
Đặc biệt, EMQX Public Broker chỉ phù hợp cho thử nghiệm hoặc prototype nếu chưa có bảo mật và SLA phù hợp. Khi triển khai thực tế, nên sử dụng broker có TLS, authentication, ACL và quản lý credential riêng.
8.4. AI Security
- Không gửi password, token hoặc credential IoT cho AI.
- Chỉ cung cấp dữ liệu thuộc Farm mà người dùng được quyền truy cập.
- Giới hạn số lượng request AI.
- Giới hạn token và chi phí.
- Validate output trước khi lưu.
- Không thực thi hành động điều khiển dựa trên nội dung AI chưa được kiểm duyệt.
- Có audit log cho AI recommendation và quyết định chấp nhận.

9. Non-functional Requirements
Tiêu chí	Yêu cầu thiết kế
Scalability	Có thể scale API và Worker độc lập
Availability	Mục tiêu 99,5%
Performance	API CRUD thông thường mục tiêu P95 dưới 500 ms
Security	JWT, RBAC, RLS, MQTT ACL
Reliability	Outbox, retry, idempotency
Observability	Structured logging, metrics, tracing
Maintainability	Clean Architecture, modular domain
Testing	Unit, Integration, E2E
Data Integrity	FK, unique constraint, transaction
Backup	Backup và kiểm tra khả năng restore
AI Cost	Token budget, rate limit, caching

Các mục tiêu P95 và availability là tiêu chí nghiệm thu đề xuất, phải đo thực tế trên môi trường triển khai.
9.1. Observability
Đề xuất giám sát:
- HTTP request latency.
- HTTP error rate.
- MQTT connection status.
- MQTT message processing rate.
- Telemetry ingestion failures.
- Outbox pending count.
- Outbox retry count.
- FCM delivery failures.
- AI provider latency.
- Database connection pool.
- Worker heartbeat.
Mỗi request và background event nên có correlation ID để truy vết từ lúc nhận MQTT đến lúc gửi notification.
9.2. Reliability
Các tình huống phải được xử lý:
Tình huống	Cơ chế
MQTT mất kết nối	Reconnect và resubscribe
ESP32 gửi trùng	Idempotency
ESP32 mất Internet	Buffer và gửi bù có giới hạn
Database tạm ngừng	Retry có kiểm soát
FCM lỗi	Outbox retry
AI provider lỗi	Timeout, fallback, retry
Worker khởi động lại	Reclaim event hết lease
Lệnh không có ACK	Timeout và đánh dấu trạng thái
Hai worker xử lý cùng event	Atomic claim / locking


10. Deployment Architecture
#chatgpt-mermaid-_r_3n7_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_3n7_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3n7_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3n7_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_3n7_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3n7_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_3n7_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_3n7_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_3n7_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_3n7_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_3n7_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_3n7_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3n7_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3n7_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_3n7_ p{margin:0;}#chatgpt-mermaid-_r_3n7_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3n7_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3n7_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3n7_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_3n7_ .label text,#chatgpt-mermaid-_r_3n7_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3n7_ .node rect,#chatgpt-mermaid-_r_3n7_ .node circle,#chatgpt-mermaid-_r_3n7_ .node ellipse,#chatgpt-mermaid-_r_3n7_ .node polygon,#chatgpt-mermaid-_r_3n7_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_3n7_ .rough-node .label text,#chatgpt-mermaid-_r_3n7_ .node .label text,#chatgpt-mermaid-_r_3n7_ .image-shape .label,#chatgpt-mermaid-_r_3n7_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_3n7_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_3n7_ .rough-node .label,#chatgpt-mermaid-_r_3n7_ .node .label,#chatgpt-mermaid-_r_3n7_ .image-shape .label,#chatgpt-mermaid-_r_3n7_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_3n7_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_3n7_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3n7_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3n7_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-_r_3n7_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-_r_3n7_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_3n7_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3n7_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3n7_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-_r_3n7_ .cluster rect{fill:rgb(243, 243, 243);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_3n7_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3n7_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3n7_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(243, 243, 243);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_3n7_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3n7_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_3n7_ .icon-shape,#chatgpt-mermaid-_r_3n7_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_3n7_ .icon-shape p,#chatgpt-mermaid-_r_3n7_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-_r_3n7_ .icon-shape .label rect,#chatgpt-mermaid-_r_3n7_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_3n7_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_3n7_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_3n7_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_3n7_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_3n7_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_3n7_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_3n7_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_3n7_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_3n7_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3n7_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_3n7_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3n7_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_3n7_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_3n7_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_3n7_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_3n7_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-_r_3n7_ .node rect,#chatgpt-mermaid-_r_3n7_ .node circle,#chatgpt-mermaid-_r_3n7_ .node ellipse,#chatgpt-mermaid-_r_3n7_ .node polygon,#chatgpt-mermaid-_r_3n7_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_3n7_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_3n7_ .mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_3n7_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_3n7_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3n7_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Managed ServicesCloud InfrastructureClient LayerSupabase PostgreSQLFirebase Cloud MessagingGemini / OpenAIExpress APISocket.IOMQTT WorkerOutbox WorkerAI WorkerEMQX BrokerWeb DashboardReact NativeESP32MQTT





Phân bổ triển khai:
Thành phần	Nền tảng đề xuất
Web	Vercel
Express API	Render / Railway / VPS
MQTT Worker	Render / Railway / VPS
Outbox Worker	Render / Railway / VPS
AI Worker	Render / Railway / VPS
Database	Supabase
MQTT Broker	EMQX
Push Notification	Firebase

Với hệ thống medium scale, tôi ưu tiên triển khai Express API và các Worker trên Render hoặc Railway để có tiến trình chạy liên tục, quản lý đơn giản. Có thể tách thành các service độc lập trong cùng một repository.

11. Kế hoạch triển khai sau khi chốt thiết kế
Chưa triển khai code ở giai đoạn này. Đây là roadmap đề xuất cho quá trình hiện thực hóa thiết kế.
Backend Development Roadmap
1. Phase 0 – Existing System Audit
   Bắt buộc trước migration
   - Phân tích source .NET hiện tại.
   - Đọc Swagger/OpenAPI.
   - Kiểm tra Supabase schema và dữ liệu hiện có.
   - Kiểm tra MQTT, Alert, Outbox, FCM.
   - Lập API Compatibility Matrix.
2. Phase 1 – Foundation & Authentication
   - Express Core.
   - Clean Architecture.
   - Prisma và Supabase.
   - JWT, RBAC.
   - Logging, validation, exception handling.
3. Phase 2 – Farm & IoT Management
   - User, Farm, Zone.
   - Device, Sensor.
   - Device authentication.
   - MQTT Integration.
4. Phase 3 – Telemetry & Alert
   - MQTT Ingestion Worker.
   - Telemetry persistence.
   - Alert Rule Engine.
   - Idempotency.
   - Transactional Outbox.
5. Phase 4 – Command & Automation
   - MQTT Publisher.
   - Device Command.
   - ACK processing.
   - Automation Engine.
6. Phase 5 – Notification & Realtime
   - Firebase FCM.
   - Socket.IO.
   - Notification Worker.
   - Delivery tracking.
7. Phase 6 – AI Integration
   - AI Provider Adapter.
   - Farm Context Builder.
   - AI Analysis.
   - AI Recommendations.
8. Phase 7 – Analytics & Production
   - Dashboard API.
   - Performance optimization.
   - Security testing.
   - Integration testing.
   - Deployment và monitoring.


12. Những quyết định kiến trúc cần chốt
Trước khi bắt đầu triển khai, cần thống nhất những quyết định sau:
Hạng mục	Đề xuất hiện tại	Trạng thái
Backend	Express 5 + TypeScript	Đề xuất
Architecture	Modular Monolith + Clean Architecture	Đề xuất
Database	Supabase PostgreSQL	Đề xuất
ORM	Prisma	Đề xuất
Authentication	JWT + Refresh Token	Đề xuất
Authorization	RBAC + Farm Scope	Đề xuất
MQTT Broker	EMQX	Giữ nguyên
MQTT Client	MQTT.js	Đề xuất
MQTT Topic	smartagri/devices/+/telemetry	Giữ nguyên
Reliability	Transactional Outbox	Giữ nguyên
Push	FCM	Giữ nguyên
Realtime	Socket.IO	Đề xuất
AI	Provider Adapter	Đề xuất
Deployment	API + Worker độc lập	Đề xuất

12.1. Các điểm cần xác nhận trước khi đóng băng thiết kế
Có 5 vấn đề cần chốt:

1. Authentication

Tôi đề xuất Backend tự quản lý JWT và Refresh Token để thuận tiện tương thích với hệ thống .NET hiện tại. Supabase chỉ quản lý PostgreSQL, chưa sử dụng Supabase Auth.

2. Database

Cần kiểm tra schema Supabase hiện tại trước khi quyết định tạo bảng mới hay migration bảng cũ. Không được tự ý xóa dữ liệu.

3. API Compatibility

Đây là yêu cầu quan trọng nhất khi chuyển .NET sang Express:
- Giữ nguyên endpoint nghiệp vụ.
- Giữ nguyên HTTP method.
- Giữ nguyên request/response.
- Giữ nguyên HTTP status.
- Giữ nguyên phân quyền.
- Giữ nguyên pagination.
- Giữ nguyên MQTT topic và payload.
- Giữ nguyên cấu trúc dữ liệu Mobile đang sử dụng.
Danh sách API ở phần 6 là API specification mục tiêu. Chỉ sau khi đối chiếu Swagger .NET mới có thể xác nhận API nào giữ nguyên, API nào cần bổ sung và API nào cần điều chỉnh.

4. AI Provider

Thiết kế adapter cho nhiều provider, nhưng chỉ tích hợp một provider trong MVP để kiểm soát chi phí.

5. Deployment

Tách HTTP API, MQTT Worker và Outbox Worker thành các tiến trình độc lập. Không triển khai MQTT subscriber lâu dài trên môi trường serverless.
12.2. Tiêu chí nghiệm thu giai đoạn thiết kế
- [ ] Business Requirements hoàn chỉnh.
- [ ] Actors và Use Cases được xác định.
- [ ] RBAC và Farm Scope được xác định.
- [ ] Clean Architecture được thống nhất.
- [ ] ERD logic được thống nhất.
- [ ] Database schema vật lý được thống nhất.
- [ ] MQTT topic và payload được thống nhất.
- [ ] Transactional Outbox được thiết kế.
- [ ] FCM và Socket.IO được thiết kế.
- [ ] AI Integration được thiết kế.
- [ ] REST API Specification được thống nhất.
- [ ] Security Architecture được thống nhất.
- [ ] Deployment Architecture được thống nhất.
- [ ] Có kế hoạch migration và kiểm thử tương thích .NET.

13. Kết luận kiến trúc
Tôi khuyến nghị chốt hướng kiến trúc như sau:
Smart Agriculture Backend
Express 5 + TypeScript
Modular Monolith · Clean Architecture · Medium Scale

Data Layer

Supabase PostgreSQL + Prisma

IoT Layer

EMQX + MQTT.js

Reliability

Transactional Outbox + Retry

Realtime

Socket.IO + FCM

AI Layer

AI Provider Adapter + AI Worker

Security

JWT + RBAC + Farm Scope



Một codebase – Nhiều tiến trình triển khai – Một database trung tâm.

Thứ tự công việc tôi đề xuất:
1. Hoàn tất tài liệu thiết kế và xác nhận các quyết định ở trên.
2. Audit source code .NET và Swagger hiện tại.
3. Lập bảng mapping .NET API → Express API.
4. Đối chiếu Supabase database schema và dữ liệu hiện có.
5. Chốt ERD vật lý, Prisma data model và MQTT contract.
6. Sau đó mới bắt đầu triển khai code theo từng Phase.
Điểm quan trọng là chúng ta không chỉ viết lại Backend bằng Node.js mà phải chuyển đổi công nghệ nhưng giữ nguyên nghiệp vụ, dữ liệu và giao thức giao tiếp với ESP32/Mobile. 

Bước tiếp theo: Tôi có thể rà soát repository Farm Home (.NET) và Swagger hiện tại để tạo tài liệu API Compatibility Matrix và Database Migration Mapping trước khi chốt thiết kế cuối cùng.