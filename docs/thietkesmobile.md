Thiết kế Mobile App Farm Home bằng React Native
Mình đề xuất xây dựng Farm Home Mobile bằng React Native + Expo + TypeScript, kết nối với Backend Node.js Express và Supabase.

Ứng dụng sẽ là trung tâm quản lý trang trại trên điện thoại: theo dõi cảm biến ESP32, giám sát môi trường, điều khiển tưới tiêu, nhận thông báo FCM và sử dụng AI để phân tích dữ liệu.

Mục tiêu: thiết kế ứng dụng có thể phát triển thành sản phẩm thực tế, không chỉ là giao diện demo.
1. Công nghệ đề xuất
Thành phần	Công nghệ
Mobile framework	React Native + Expo
Ngôn ngữ	TypeScript
Navigation	Expo Router
UI	React Native Paper + custom components
Server state	TanStack Query
Client state	Zustand
API	Axios
Form validation	React Hook Form + Zod
Biểu đồ	Victory Native
Push notification	Firebase Cloud Messaging
Local storage	Expo SecureStore
Realtime	Socket.IO Client
MQTT	Không kết nối trực tiếp từ mobile trong kiến trúc chính
Build	EAS Build

Nguyên tắc quan trọng: Mobile không kết nối trực tiếp Supabase Database để thực hiện nghiệp vụ. Mobile gọi Backend Express; Backend chịu trách nhiệm xác thực, phân quyền, xử lý MQTT, Transactional Outbox và gửi FCM.
2. Định hướng giao diện
Phong cách Farm Home






















15














- Màu chủ đạo: xanh lá cây, trắng và xanh đậm.
- Phong cách: hiện đại, tối giản, dễ sử dụng ngoài trang trại.
- Card bo góc, icon trực quan, biểu đồ dễ đọc.
- Ưu tiên thao tác nhanh, chữ dễ nhìn, nút điều khiển đủ lớn.
- Hỗ trợ tiếng Việt trước, có thể mở rộng tiếng Anh.

3. Cấu trúc điều hướng ứng dụng
Đề xuất sử dụng Bottom Tab Navigation với 5 mục chính:
Tổng quan

Trang trại

Thiết bị

Cảnh báo

Tài khoản



Minh họa thanh điều hướng chính

Tab	Chức năng
Tổng quan	Thống kê, tình trạng trang trại, dữ liệu cảm biến
Trang trại	Quản lý khu vực, vườn, cây trồng
Thiết bị	ESP32, cảm biến, máy bơm, van tưới
Cảnh báo	Cảnh báo IoT, lịch sử và trạng thái xử lý
Tài khoản	Hồ sơ, thành viên, cài đặt và đăng xuất

Các màn hình chi tiết như lịch sử cảm biến, quản lý cây trồng, AI và điều khiển tưới sẽ mở từ các tab tương ứng.
4. Thiết kế các màn hình chính
4.1. Authentication – Đăng nhập và tài khoản










Đăng nhập











Đăng ký


Các màn hình:
- Splash Screen.
- Onboarding.
- Login bằng email/mật khẩu.
- Đăng nhập Google.
- Đăng ký tài khoản.
- Quên mật khẩu.
- Đặt lại mật khẩu.
- Xác minh tài khoản.
Luồng đăng nhập:
1. Người dùng nhập thông tin.
2. Mobile gọi POST /api/v1/auth/login.
3. Backend xác thực và trả Access Token, Refresh Token.
4. Mobile lưu token bằng SecureStore.
5. Lấy thông tin người dùng và quyền truy cập.
6. Điều hướng đến Dashboard.
4.2. Dashboard – Tổng quan trang trại








dribbble.com


Đây là màn hình quan trọng nhất.

Các thành phần:
Thành phần	Nội dung
Header	Xin chào, avatar, thông báo
Farm selector	Chọn trang trại
Weather	Thời tiết hiện tại
Overview	Tổng số khu vực, thiết bị
Temperature	Nhiệt độ
Humidity	Độ ẩm không khí
Soil moisture	Độ ẩm đất
Device status	Online / Offline
Alerts	Cảnh báo chưa xử lý
AI insight	Nhận định từ AI

Ví dụ dữ liệu:
Farm Home – Trang trại A
Đang hoạt động

Nhiệt độ

29.5°C


Độ ẩm không khí

75%


Độ ẩm đất

42%


Thiết bị Online

8/10



Cập nhật cảm biến
Realtime

Các số liệu phía trên là dữ liệu minh họa cho thiết kế giao diện.

4.3. Farm Management – Quản lý trang trại








dribbble.com


Chức năng:
- Danh sách trang trại.
- Tạo và chỉnh sửa trang trại.
- Quản lý khu vực (Zone).
- Quản lý mùa vụ.
- Quản lý cây trồng.
- Theo dõi trạng thái từng khu vực.
- Quản lý thành viên và quyền truy cập.
Cấu trúc nghiệp vụ:
Farm
 ├── Zone 01
 │    ├── Crop
 │    ├── ESP32 Device
 │    ├── Sensors
 │    └── Irrigation System
 │
 ├── Zone 02
 │    ├── Crop
 │    ├── ESP32 Device
 │    ├── Sensors
 │    └── Irrigation System
 │
 └── Members


4.4. IoT Devices – Quản lý thiết bị








jhon-henao13.github.io


Mỗi thiết bị cần có:
- Device ID.
- Device Name.
- Khu vực được gán.
- Trạng thái kết nối.
- Firmware Version.
- Last Seen.
- Danh sách cảm biến.
- Lịch sử telemetry.
- Trạng thái hoạt động.
Các chức năng:
1. Thêm thiết bị.
2. Gán thiết bị vào Zone.
3. Xem thông tin thiết bị.
4. Theo dõi kết nối.
5. Xem dữ liệu cảm biến.
6. Cấu hình thiết bị.
7. Thu hồi thiết bị.
Lưu ý: Mobile không tự tìm ESP32 bằng cách quét MQTT Broker. Thiết bị cần được đăng ký hoặc provision vào Backend trước, sau đó Backend quản lý danh tính và quyền kết nối MQTT.
4.5. Sensor Monitoring – Giám sát cảm biến








hortidaily.com


Màn hình hiển thị:
- Nhiệt độ.
- Độ ẩm không khí.
- Độ ẩm đất.
- Ánh sáng.
- Các cảm biến mở rộng.
- Biểu đồ theo thời gian.
- Lịch sử dữ liệu.
- Ngưỡng cảnh báo.
Bộ lọc thời gian:
- 1 giờ.
- 24 giờ.
- 7 ngày.
- 30 ngày.
- Tùy chọn khoảng thời gian.
4.6. Irrigation Control – Điều khiển tưới tiêu








cybermindworks.com


Đây là màn hình cần thiết kế kỹ về bảo mật và an toàn.

Chức năng:
- Bật/tắt máy bơm.
- Bật/tắt van tưới.
- Điều khiển theo Zone.
- Hẹn lịch tưới.
- Xem trạng thái thiết bị.
- Theo dõi lịch sử lệnh.
- Xác nhận kết quả thực thi.
Luồng điều khiển:
ESP32EMQXSupabaseExpress BackendReact NativeESP32EMQXSupabaseExpress BackendReact Native#chatgpt-mermaid-_r_3vg_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_3vg_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3vg_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_3vg_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_3vg_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_3vg_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_3vg_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_3vg_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_3vg_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_3vg_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_3vg_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_3vg_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3vg_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3vg_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_3vg_ p{margin:0;}#chatgpt-mermaid-_r_3vg_ .actor{stroke:rgb(83, 154, 248);fill:rgb(222, 234, 251);stroke-width:1;}#chatgpt-mermaid-_r_3vg_ rect.actor.outer-path[data-look="neo"]{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3vg_ rect.note[data-look="neo"]{stroke:rgb(107, 198, 127);fill:rgb(243, 243, 243);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3vg_ text.actor>tspan{fill:rgb(13, 13, 13);stroke:none;}#chatgpt-mermaid-_r_3vg_ .actor-line{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3vg_ .innerArc{stroke-width:1.5;stroke-dasharray:none;}#chatgpt-mermaid-_r_3vg_ .messageLine0{stroke-width:1.5;stroke-dasharray:none;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3vg_ .messageLine1{stroke-width:1.5;stroke-dasharray:2,2;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3vg_ [id$="-arrowhead"] path{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3vg_ .sequenceNumber{fill:#707070;}#chatgpt-mermaid-_r_3vg_ [id$="-sequencenumber"]{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3vg_ [id$="-crosshead"] path{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_3vg_ .messageText{fill:rgb(13, 13, 13);stroke:none;}#chatgpt-mermaid-_r_3vg_ .labelBox{stroke:rgba(0, 0, 0, 0.1);fill:rgb(252, 252, 252);filter:none;}#chatgpt-mermaid-_r_3vg_ .labelText,#chatgpt-mermaid-_r_3vg_ .labelText>tspan{fill:rgb(13, 13, 13);stroke:none;}#chatgpt-mermaid-_r_3vg_ .loopText,#chatgpt-mermaid-_r_3vg_ .loopText>tspan{fill:rgb(13, 13, 13);stroke:none;}#chatgpt-mermaid-_r_3vg_ .sectionTitle,#chatgpt-mermaid-_r_3vg_ .sectionTitle>tspan{fill:rgb(13, 13, 13);stroke:none;}#chatgpt-mermaid-_r_3vg_ .loopLine{stroke-width:2px;stroke-dasharray:2,2;stroke:rgba(0, 0, 0, 0.1);fill:rgba(0, 0, 0, 0.1);}#chatgpt-mermaid-_r_3vg_ .note{stroke:rgb(107, 198, 127);fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_3vg_ .noteText,#chatgpt-mermaid-_r_3vg_ .noteText>tspan{fill:rgb(13, 13, 13);stroke:none;font-weight:normal;}#chatgpt-mermaid-_r_3vg_ .activation0{fill:rgb(243, 243, 243);stroke:hsl(0, 0%, 85.2941176471%);}#chatgpt-mermaid-_r_3vg_ .activation1{fill:rgb(243, 243, 243);stroke:hsl(0, 0%, 85.2941176471%);}#chatgpt-mermaid-_r_3vg_ .activation2{fill:rgb(243, 243, 243);stroke:hsl(0, 0%, 85.2941176471%);}#chatgpt-mermaid-_r_3vg_ .actorPopupMenu{position:absolute;}#chatgpt-mermaid-_r_3vg_ .actorPopupMenuPanel{position:absolute;fill:rgb(222, 234, 251);box-shadow:0px 8px 16px 0px rgba(0,0,0,0.2);filter:drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4));}#chatgpt-mermaid-_r_3vg_ .actor-man circle,#chatgpt-mermaid-_r_3vg_ line{fill:rgb(222, 234, 251);stroke-width:2px;}#chatgpt-mermaid-_r_3vg_ g rect.rect{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_3vg_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_3vg_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_3vg_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_3vg_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_3vg_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_3vg_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_3vg_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3vg_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_3vg_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_3vg_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Người dùngYêu cầu bật tướiPOST /commandsKiểm tra quyền và lưu lệnhGhi Outbox EventTrả commandId, trạng thái PENDINGWorker publish commandGửi lệnhCommand ACKBackend nhận ACKCập nhật trạng tháiRealtime cập nhật kết quảNgười dùng





Các trạng thái lệnh:
Trạng thái	Ý nghĩa
PENDING	Đang chờ xử lý
SENT	Đã gửi đến broker
ACKNOWLEDGED	ESP32 xác nhận đã nhận
EXECUTED	Thiết bị báo thực thi thành công
FAILED	Thực thi thất bại
TIMEOUT	Quá thời gian chờ

Không được coi việc API trả về thành công là bằng chứng máy bơm đã bật. Mobile chỉ hiển thị thành công sau khi nhận trạng thái thực thi đáng tin cậy từ thiết bị.
4.7. Alert Center – Trung tâm cảnh báo








agrology.ag


Các loại cảnh báo:
- Nhiệt độ vượt ngưỡng.
- Độ ẩm đất thấp.
- Thiết bị mất kết nối.
- Máy bơm lỗi.
- Lệnh điều khiển thất bại.
- Bất thường dữ liệu cảm biến.
- Cảnh báo do AI phân tích.
Chức năng:
- Danh sách cảnh báo.
- Lọc theo mức độ nghiêm trọng.
- Đánh dấu đã đọc.
- Xác nhận đã xử lý.
- Xem chi tiết cảnh báo.
- Lịch sử cảnh báo.
4.8. AI Assistant – Trợ lý AI nông nghiệp








dribbble.com


AI không chỉ là chatbot hỏi đáp. Nó cần có khả năng sử dụng dữ liệu trang trại để đưa ra nhận định.

Chức năng:
- Phân tích dữ liệu nhiệt độ, độ ẩm.
- Phát hiện xu hướng bất thường.
- Tóm tắt tình trạng trang trại.
- Đưa ra khuyến nghị tưới tiêu.
- Giải thích cảnh báo.
- Hỏi đáp kiến thức nông nghiệp.
- Lịch sử hội thoại.
- Theo dõi các khuyến nghị AI.
Nguyên tắc an toàn: AI chỉ đưa ra phân tích và đề xuất. Việc điều khiển máy bơm, van tưới phải đi qua quy tắc an toàn, quyền người dùng và cơ chế xác nhận riêng.
4.9. Notification – Thông báo đẩy








corteva.com


Tích hợp Firebase Cloud Messaging:
- Thông báo thiết bị offline.
- Cảnh báo môi trường.
- Cảnh báo thiết bị.
- Lệnh điều khiển hoàn tất hoặc thất bại.
- AI có khuyến nghị mới.
Luồng:
ESP32
  ↓
EMQX MQTT
  ↓
Express Backend
  ↓
Alert Service
  ↓
Transactional Outbox
  ↓
Notification Worker
  ↓
Firebase Cloud Messaging
  ↓
React Native App


Khi đăng nhập, Mobile đăng ký FCM token với Backend qua API; khi token thay đổi, ứng dụng cập nhật lại token. Khi đăng xuất, cần xử lý liên kết token với tài khoản phù hợp.

5. Sơ đồ điều hướng tổng thể
#chatgpt-mermaid-_r_40g_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(13, 13, 13);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_40g_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_40g_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_40g_ .error-icon{fill:rgb(243, 243, 243);}#chatgpt-mermaid-_r_40g_ .error-text{fill:rgb(13, 13, 13);stroke:rgb(13, 13, 13);}#chatgpt-mermaid-_r_40g_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_40g_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_40g_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_40g_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_40g_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_40g_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_40g_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_40g_ .marker.cross{stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_40g_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_40g_ p{margin:0;}#chatgpt-mermaid-_r_40g_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_40g_ .cluster-label text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_40g_ .cluster-label span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_40g_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_40g_ .label text,#chatgpt-mermaid-_r_40g_ span{fill:rgb(13, 13, 13);color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_40g_ .node rect,#chatgpt-mermaid-_r_40g_ .node circle,#chatgpt-mermaid-_r_40g_ .node ellipse,#chatgpt-mermaid-_r_40g_ .node polygon,#chatgpt-mermaid-_r_40g_ .node path{fill:rgb(222, 234, 251);stroke:rgb(83, 154, 248);stroke-width:1px;}#chatgpt-mermaid-_r_40g_ .rough-node .label text,#chatgpt-mermaid-_r_40g_ .node .label text,#chatgpt-mermaid-_r_40g_ .image-shape .label,#chatgpt-mermaid-_r_40g_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_40g_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_40g_ .rough-node .label,#chatgpt-mermaid-_r_40g_ .node .label,#chatgpt-mermaid-_r_40g_ .image-shape .label,#chatgpt-mermaid-_r_40g_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_40g_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_40g_ .root .anchor path{fill:rgb(143, 143, 143)!important;stroke-width:0;stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_40g_ .arrowheadPath{fill:rgb(143, 143, 143);}#chatgpt-mermaid-_r_40g_ .edgePath .path{stroke:rgb(143, 143, 143);stroke-width:1px;}#chatgpt-mermaid-_r_40g_ .flowchart-link{stroke:rgb(143, 143, 143);fill:none;}#chatgpt-mermaid-_r_40g_ .edgeLabel{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_40g_ .edgeLabel p{background-color:rgb(252, 252, 252);}#chatgpt-mermaid-_r_40g_ .edgeLabel rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_40g_ .labelBkg{background-color:rgba(252, 252, 252, 0.5);}#chatgpt-mermaid-_r_40g_ .cluster rect{fill:rgb(243, 243, 243);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_40g_ .cluster text{fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_40g_ .cluster span{color:rgb(13, 13, 13);}#chatgpt-mermaid-_r_40g_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(243, 243, 243);border:1px solid rgba(0, 0, 0, 0.1);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_40g_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(13, 13, 13);}#chatgpt-mermaid-_r_40g_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_40g_ .icon-shape,#chatgpt-mermaid-_r_40g_ .image-shape{background-color:rgb(252, 252, 252);text-align:center;}#chatgpt-mermaid-_r_40g_ .icon-shape p,#chatgpt-mermaid-_r_40g_ .image-shape p{background-color:rgb(252, 252, 252);padding:2px;}#chatgpt-mermaid-_r_40g_ .icon-shape .label rect,#chatgpt-mermaid-_r_40g_ .image-shape .label rect{opacity:0.5;background-color:rgb(252, 252, 252);fill:rgb(252, 252, 252);}#chatgpt-mermaid-_r_40g_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_40g_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_40g_ .node .neo-node{stroke:rgb(83, 154, 248);}#chatgpt-mermaid-_r_40g_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_40g_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_40g_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_40g_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_40g_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_40g_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_40g_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_40g_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_40g_ [data-look="neo"].node .neo-line path{stroke:rgb(83, 154, 248);filter:none;}#chatgpt-mermaid-_r_40g_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_40g_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_40g_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_40g_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_40g_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_40g_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_40g_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_40g_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_40g_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(0, 79, 153);}#chatgpt-mermaid-_r_40g_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_40g_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_40g_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-width:1px;}#chatgpt-mermaid-_r_40g_ .node rect,#chatgpt-mermaid-_r_40g_ .node circle,#chatgpt-mermaid-_r_40g_ .node ellipse,#chatgpt-mermaid-_r_40g_ .node polygon,#chatgpt-mermaid-_r_40g_ .node path{fill:rgb(229, 243, 255);stroke:rgba(0, 0, 0, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_40g_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_40g_ .mermaid-decision .label-container{fill:rgb(245, 250, 255);stroke:rgb(206, 219, 229);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_40g_ .edgePaths .flowchart-link{stroke:rgb(143, 143, 143);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_40g_ .marker{fill:rgb(143, 143, 143);stroke:rgb(143, 143, 143);}#chatgpt-mermaid-_r_40g_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Splash ScreenĐã đăng nhập?AuthenticationMain AppDashboardFarm ManagementIoT DevicesAlert CenterProfileSensor MonitoringAI AssistantFarm DetailZone DetailDevice DetailDevice ConfigurationIrrigation ControlAlert DetailSettingsChưaRồi





6. Kiến trúc React Native Clean Architecture
Mình đề xuất tổ chức theo Feature-based Architecture, kết hợp phân chia trách nhiệm theo Clean Architecture.
farm-home-mobile/
│
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   │
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   │
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── farms.tsx
│       ├── devices.tsx
│       ├── alerts.tsx
│       └── profile.tsx
│
├── src/
│   ├── core/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── hooks/
│   │   ├── navigation/
│   │   ├── notifications/
│   │   ├── realtime/
│   │   ├── storage/
│   │   └── theme/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── charts/
│   │   ├── cards/
│   │   ├── forms/
│   │   └── feedback/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── farms/
│   │   ├── zones/
│   │   ├── crops/
│   │   ├── devices/
│   │   ├── sensors/
│   │   ├── telemetry/
│   │   ├── irrigation/
│   │   ├── alerts/
│   │   ├── notifications/
│   │   ├── analytics/
│   │   ├── ai-assistant/
│   │   └── profile/
│   │
│   ├── store/
│   ├── types/
│   ├── utils/
│   └── localization/
│
├── assets/
├── app.config.ts
├── eas.json
├── package.json
└── tsconfig.json


Cấu trúc bên trong mỗi Feature
Ví dụ module devices:
features/devices/
├── data/
│   ├── datasources/
│   ├── dto/
│   ├── mappers/
│   └── repositories/
│
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
│
└── presentation/
    ├── screens/
    ├── components/
    ├── hooks/
    └── viewmodels/


Trách nhiệm:
Layer	Nhiệm vụ
Presentation	Screen, UI, hooks
Domain	Entity, business rule, use case
Data	API, DTO, mapper, repository

Không để component giao diện tự gọi Axios hoặc chứa logic nghiệp vụ phức tạp.
7. Thiết kế API tích hợp Mobile
Mobile giao tiếp với Backend thông qua REST API và Socket.IO.
Feature	Method	Endpoint
Login	POST	/api/v1/auth/login
Refresh token	POST	/api/v1/auth/refresh
Profile	GET	/api/v1/users/me
Farms	GET	/api/v1/farms
Farm detail	GET	/api/v1/farms/:id
Zones	GET	/api/v1/farms/:id/zones
Devices	GET	/api/v1/devices
Device detail	GET	/api/v1/devices/:id
Telemetry	GET	/api/v1/telemetry
Latest telemetry	GET	/api/v1/telemetry/latest
Alerts	GET	/api/v1/alerts
Mark alert read	PATCH	/api/v1/alerts/:id/read
Create command	POST	/api/v1/commands
Command status	GET	/api/v1/commands/:id
Notification token	POST	/api/v1/notifications/devices
AI analysis	POST	/api/v1/ai/analyze
AI chat	POST	/api/v1/ai/chat

Đây là API mục tiêu cho thiết kế Mobile, cần đối chiếu Swagger và backend .NET hiện tại trước khi triển khai để bảo đảm không phá vỡ hợp đồng API nghiệp vụ.
Realtime Socket.IO
Các sự kiện đề xuất:
Event	Mục đích
telemetry.updated	Dữ liệu cảm biến mới
device.status.changed	Thiết bị Online/Offline
alert.created	Cảnh báo mới
command.status.changed	Cập nhật lệnh
notification.created	Thông báo mới

Mobile chỉ tham gia các room mà tài khoản được phép truy cập. Backend phải xác thực token và kiểm tra quyền farm trước khi cho phép subscribe.
8. State Management và dữ liệu
Không nên đưa tất cả dữ liệu vào một store duy nhất.
Công nghệ	Quản lý
TanStack Query	API data, cache, pagination
Zustand	Trạng thái UI, farm đang chọn
SecureStore	Access Token, Refresh Token
Socket.IO	Dữ liệu realtime
React Hook Form	Form nhập liệu
Zod	Validation

Ví dụ cách phân chia:
TanStack Query
 ├── farms
 ├── zones
 ├── devices
 ├── telemetry
 ├── alerts
 └── notifications

Zustand
 ├── selectedFarm
 ├── selectedZone
 ├── theme
 └── UI preferences

SecureStore
 ├── accessToken
 └── refreshToken


Offline-first ở mức phù hợp:
- Cache danh sách trang trại và thiết bị.
- Hiển thị dữ liệu cảm biến đã tải gần nhất.
- Thông báo khi mất kết nối.
- Không tự động thực thi lại lệnh tưới khi có mạng trở lại.
- Với lệnh điều khiển, cần yêu cầu người dùng gửi lại và kiểm tra trạng thái mới nhất.
9. Phân quyền Mobile
Chức năng	Owner	Manager	Staff	Viewer
Xem Dashboard	✓	✓	✓	✓
Quản lý Farm	✓	✓		
Quản lý Zone	✓	✓	✓	
Quản lý thiết bị	✓	✓	✓	
Xem Telemetry	✓	✓	✓	✓
Điều khiển tưới	✓	✓	✓*	
Quản lý thành viên	✓	✓*		
Xem AI	✓	✓	✓	✓

* Phải được cấp quyền cụ thể từ Backend. Không được chỉ ẩn nút ở Mobile rồi coi đó là bảo mật.
10. Bảo mật và chất lượng
Các yêu cầu cần có trước khi phát hành:
- Access Token ngắn hạn, Refresh Token có rotation.
- Không lưu mật khẩu hoặc MQTT credential trong ứng dụng.
- Không đưa Supabase Service Role Key vào Mobile.
- Kiểm tra quyền ở Backend cho mọi API.
- FCM token gắn với user và thiết bị đăng nhập.
- Không gửi lệnh điều khiển nếu không có quyền.
- Có xác nhận khi thực hiện hành động ảnh hưởng đến hệ thống tưới.
- Có request ID/idempotency key cho lệnh để tránh gửi trùng.
- Có timeout, retry có giới hạn và trạng thái lỗi rõ ràng.
- Có xử lý khi Socket.IO mất kết nối.
- Có kiểm thử trên Android và iOS.
11. Lộ trình triển khai Mobile
Giai đoạn	Hạng mục	Kết quả
1	Project setup, theme, navigation	Khung ứng dụng
2	Authentication, RBAC	Đăng nhập hoàn chỉnh
3	Farm, Zone, Crop	Quản lý trang trại
4	Devices, Sensors	Quản lý IoT
5	Telemetry, Dashboard	Giám sát realtime
6	Irrigation Control	Điều khiển ESP32
7	Alerts, FCM	Nhận cảnh báo
8	AI Assistant	Tích hợp AI
9	Testing, security	Kiểm thử
10	EAS Build, release	Phát hành ứng dụng

12. Tiêu chí nghiệm thu
- [ ] Đăng nhập, đăng xuất, refresh token hoạt động.
- [ ] Người dùng chỉ thấy trang trại được cấp quyền.
- [ ] Xem được nhiều Farm và nhiều Zone.
- [ ] ESP32 gửi telemetry qua MQTT và Mobile nhận dữ liệu cập nhật.
- [ ] Hiển thị thiết bị Online/Offline chính xác.
- [ ] Điều khiển máy bơm có xác nhận trạng thái thực thi.
- [ ] Nhận FCM kể cả khi ứng dụng chạy nền hoặc đã đóng.
- [ ] Lịch sử cảnh báo và lệnh được lưu.
- [ ] AI phân tích dữ liệu đúng phạm vi trang trại.
- [ ] Không để lộ thông tin xác thực trong ứng dụng.
- [ ] Có kiểm thử trên thiết bị Android và iOS thực tế.

13. Thứ tự thiết kế và phát triển mình khuyến nghị
Không nên bắt đầu bằng AI hoặc điều khiển tưới ngay. Nên triển khai theo thứ tự:
1. Foundation
   
   Expo, TypeScript, theme, navigation, Axios, TanStack Query, Zustand.
2. Authentication
   
   Login, Google Sign-In, refresh token, RBAC.
3. Farm & IoT
   
   Farm, Zone, Device, Sensor.
4. Dashboard & Realtime
   
   Telemetry, biểu đồ, Socket.IO.
5. Irrigation & Alerts
   
   Điều khiển ESP32, command tracking, FCM.
6. AI & Analytics
   
   AI Assistant, phân tích và khuyến nghị.
Một quyết định kiến trúc quan trọng: giữ MQTT ở Backend, không cho React Native kết nối trực tiếp EMQX trong kiến trúc chính. Backend là nơi xác thực, phân quyền, kiểm soát lệnh và xử lý dữ liệu IoT. Cách này cũng phù hợp với kiến trúc Transactional Outbox và FCM đã định hướng cho Farm Home. 

Bước tiếp theo hợp lý là hoàn thiện UI/UX Specification cho từng màn hình Mobile: bố cục, component, trạng thái loading/empty/error, hành vi nút bấm và API tương ứng, sau đó mới bắt đầu tạo project React Native và viết code.