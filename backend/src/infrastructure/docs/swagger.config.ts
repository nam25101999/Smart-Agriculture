export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Agriculture RESTful API v1 - Node.js Express 5 Core',
    version: '1.0.0',
    description: `Hệ sinh thái Backend Smart Agriculture – Chuẩn đặc tả thiết kế tại thietke.md:
- **Xác thực & Phân quyền**: JWT Access/Refresh Token (Rotation), RBAC 2 cấp (Global Roles + Farm Scope).
- **Quản lý Nông trại & IoT**: Quản lý đa nông trại, phân vùng khu vực, thiết bị ESP32 và cảm biến.
- **Tiếp nhận Telemetry & Cảnh báo**: Ghi dữ liệu cảm biến, chống spam bằng Cooldown & Deduplication Key.
- **Điều khiển 2 chiều**: State machine 6 bước cho lệnh máy bơm/quạt, tích hợp MQTT EMQX & Wokwi Simulator.
- **Tự động hóa & Thông báo**: Quản lý kịch bản tự động, Firebase FCM Token & Lịch sử thông báo.
- **Thống kê & Dashboard**: Tổng quan nông trại, thiết bị online/offline và phân tích dữ liệu vi khí hậu.`,
  },
  servers: [
    {
      url: '/',
      description: 'Current Host (Vercel Production / Local)',
    },
    {
      url: 'http://localhost:5001',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập access token nhận được từ endpoint /api/v1/auth/login',
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: '01. Authentication', description: 'Đăng ký, đăng nhập, JWT, refresh token, đổi mật khẩu' },
    { name: '02. Users Management', description: 'Quản trị người dùng (Dành cho Super Admin)' },
    { name: '03. Farm Management', description: 'Quản lý nông trại và nhân sự/thành viên farm' },
    { name: '04. Zone Management', description: 'Quản lý các khu vực canh tác trong nông trại' },
    { name: '05. IoT Device Management', description: 'Đăng ký ESP32, quản lý cảm biến, điều khiển thiết bị' },
    { name: '06. Telemetry Data', description: 'Truy vấn dữ liệu cảm biến mới nhất và lịch sử' },
    { name: '07. Alert Management', description: 'Cấu hình quy tắc cảnh báo và xử lý vi phạm ngưỡng' },
    { name: '08. Automation Rules', description: 'Quy tắc tự động hóa và nhật ký kích hoạt' },
    { name: '09. Notifications', description: 'Thông báo đẩy FCM và thông báo trong ứng dụng' },
    { name: '10. Dashboard & Analytics', description: 'Tổng hợp số liệu, biểu đồ và báo cáo' },
    { name: 'System', description: 'Kiểm tra sức khỏe hệ thống' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Kiểm tra sức khỏe hệ thống',
        security: [],
        responses: {
          200: { description: 'Hệ thống hoạt động bình thường' },
        },
      },
    },

    // ==========================================
    // 01. AUTHENTICATION
    // ==========================================
    '/api/v1/auth/register': {
      post: {
        tags: ['01. Authentication'],
        summary: 'Đăng ký tài khoản mới',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', example: 'owner@smartagri.vn' },
                  password: { type: 'string', example: 'Owner@123456' },
                  fullName: { type: 'string', example: 'Nguyen Van Chu Farm' },
                  phone: { type: 'string', example: '0912345678' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Đăng ký tài khoản thành công' } },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['01. Authentication'],
        summary: 'Đăng nhập hệ thống lấy JWT Access Token và Refresh Token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@smartagri.vn' },
                  password: { type: 'string', example: 'Admin@123456' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Đăng nhập thành công' } },
      },
    },
    '/api/v1/auth/refresh-token': {
      post: {
        tags: ['01. Authentication'],
        summary: 'Làm mới Access Token (Token Rotation)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cấp cặp token mới thành công' } },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['01. Authentication'],
        summary: 'Đăng xuất và thu hồi toàn bộ refresh session của tài khoản',
        responses: { 200: { description: 'Đăng xuất thành công' } },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['01. Authentication'],
        summary: 'Yêu cầu đặt lại mật khẩu qua email',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', example: 'user@example.com' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Đã gửi hướng dẫn reset password' } },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['01. Authentication'],
        summary: 'Xác nhận mã và đặt lại mật khẩu mới',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string', example: 'reset-token-uuid' },
                  newPassword: { type: 'string', example: 'NewSecret@123' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Đặt lại mật khẩu thành công' } },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['01. Authentication'],
        summary: 'Lấy thông tin tài khoản và danh sách farm đang tham gia',
        responses: { 200: { description: 'Profile cá nhân' } },
      },
      patch: {
        tags: ['01. Authentication'],
        summary: 'Cập nhật thông tin cá nhân',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string', example: 'Tên Mới' },
                  phone: { type: 'string', example: '0988776655' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cập nhật thành công' } },
      },
    },
    '/api/v1/auth/change-password': {
      post: {
        tags: ['01. Authentication'],
        summary: 'Đổi mật khẩu người dùng',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'Admin@123456' },
                  newPassword: { type: 'string', example: 'Admin@654321' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Đổi mật khẩu thành công' } },
      },
    },

    // ==========================================
    // 02. USERS MANAGEMENT
    // ==========================================
    '/api/v1/users': {
      get: {
        tags: ['02. Users Management'],
        summary: 'Danh sách người dùng hệ thống (Phân trang)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Danh sách người dùng' } },
      },
      post: {
        tags: ['02. Users Management'],
        summary: 'Tạo tài khoản người dùng mới (Super Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', example: 'manager@smartagri.vn' },
                  password: { type: 'string', example: 'Manager@123' },
                  fullName: { type: 'string', example: 'Nguyen Quan Ly' },
                  phone: { type: 'string', example: '0911223344' },
                  roleCode: { type: 'string', example: 'FARM_MANAGER' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Tạo người dùng thành công' } },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['02. Users Management'],
        summary: 'Chi tiết người dùng theo ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Chi tiết người dùng' } },
      },
      patch: {
        tags: ['02. Users Management'],
        summary: 'Cập nhật thông tin người dùng',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  phone: { type: 'string' },
                  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cập nhật thành công' } },
      },
      delete: {
        tags: ['02. Users Management'],
        summary: 'Xóa người dùng (Soft Delete)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Xóa thành công' } },
      },
    },

    // ==========================================
    // 03. FARM MANAGEMENT
    // ==========================================
    '/api/v1/farms': {
      get: {
        tags: ['03. Farm Management'],
        summary: 'Danh sách nông trại của người dùng',
        responses: { 200: { description: 'Danh sách farm' } },
      },
      post: {
        tags: ['03. Farm Management'],
        summary: 'Tạo nông trại mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string', example: 'Nông trại Đà Lạt Mộng Mơ' },
                  code: { type: 'string', example: 'DALAT_FARM_01' },
                  description: { type: 'string', example: 'Khu canh tác dâu tây công nghệ cao' },
                  location: { type: 'string', example: 'TP. Đà Lạt, Lâm Đồng' },
                  latitude: { type: 'number', example: 11.940419 },
                  longitude: { type: 'number', example: 108.458313 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Tạo nông trại thành công' } },
      },
    },
    '/api/v1/farms/{farmId}': {
      get: {
        tags: ['03. Farm Management'],
        summary: 'Chi tiết nông trại',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Chi tiết farm' } },
      },
      patch: {
        tags: ['03. Farm Management'],
        summary: 'Cập nhật nông trại',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  location: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cập nhật thành công' } },
      },
      delete: {
        tags: ['03. Farm Management'],
        summary: 'Xóa nông trại',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Xóa thành công' } },
      },
    },
    '/api/v1/farms/{farmId}/members': {
      get: {
        tags: ['03. Farm Management'],
        summary: 'Danh sách thành viên của nông trại',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Danh sách thành viên' } },
      },
      post: {
        tags: ['03. Farm Management'],
        summary: 'Thêm thành viên vào nông trại',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'roleCode'],
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  roleCode: { type: 'string', enum: ['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Thêm thành viên thành công' } },
      },
    },
    '/api/v1/farms/{farmId}/members/{userId}': {
      patch: {
        tags: ['03. Farm Management'],
        summary: 'Cập nhật vai trò của thành viên trong nông trại',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['roleCode'],
                properties: {
                  roleCode: { type: 'string', enum: ['FARM_OWNER', 'FARM_MANAGER', 'TECHNICIAN', 'FARM_WORKER', 'VIEWER'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cập nhật vai trò thành công' } },
      },
      delete: {
        tags: ['03. Farm Management'],
        summary: 'Xóa thành viên khỏi nông trại',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Xóa thành viên thành công' } },
      },
    },

    // ==========================================
    // 04. ZONE MANAGEMENT
    // ==========================================
    '/api/v1/farms/{farmId}/zones': {
      get: {
        tags: ['04. Zone Management'],
        summary: 'Danh sách khu vực trong nông trại',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Danh sách khu vực' } },
      },
      post: {
        tags: ['04. Zone Management'],
        summary: 'Tạo khu vực mới trong nông trại',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Nhà kính Số 1 - Trồng Dâu' },
                  description: { type: 'string', example: 'Khu vực ứng dụng tưới tự động' },
                  area: { type: 'number', example: 500.5 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Tạo khu vực thành công' } },
      },
    },
    '/api/v1/farms/{farmId}/zones/{zoneId}': {
      get: {
        tags: ['04. Zone Management'],
        summary: 'Chi tiết khu vực',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'zoneId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Chi tiết khu vực' } },
      },
      patch: {
        tags: ['04. Zone Management'],
        summary: 'Cập nhật khu vực',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'zoneId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  area: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cập nhật khu vực thành công' } },
      },
      delete: {
        tags: ['04. Zone Management'],
        summary: 'Xóa khu vực',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'zoneId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Xóa khu vực thành công' } },
      },
    },
    '/api/v1/farms/{farmId}/zones/{zoneId}/devices': {
      get: {
        tags: ['04. Zone Management'],
        summary: 'Danh sách thiết bị trong khu vực',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'zoneId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Danh sách thiết bị' } },
      },
    },
    '/api/v1/farms/{farmId}/zones/{zoneId}/telemetry': {
      get: {
        tags: ['04. Zone Management'],
        summary: 'Dữ liệu cảm biến mới nhất của các thiết bị trong khu vực',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'zoneId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Dữ liệu cảm biến khu vực' } },
      },
    },

    // ==========================================
    // 05. IOT DEVICE MANAGEMENT & COMMANDS
    // ==========================================
    '/api/v1/devices': {
      get: {
        tags: ['05. IoT Device Management'],
        summary: 'Danh sách tất cả thiết bị IoT',
        responses: { 200: { description: 'Danh sách thiết bị' } },
      },
      post: {
        tags: ['05. IoT Device Management'],
        summary: 'Đăng ký thiết bị ESP32 và cảm biến gắn kèm',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['zoneId', 'deviceCode', 'name'],
                properties: {
                  zoneId: { type: 'string', format: 'uuid' },
                  deviceCode: { type: 'string', example: 'ESP32_ZONE_01' },
                  name: { type: 'string', example: 'ESP32 Khu Vực 1 (Wokwi)' },
                  deviceType: { type: 'string', example: 'ESP32' },
                  firmwareVersion: { type: 'string', example: '1.0.0-wokwi' },
                  sensors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['sensorType', 'metricName', 'unit'],
                      properties: {
                        sensorType: { type: 'string', example: 'DHT22' },
                        metricName: { type: 'string', example: 'temperature' },
                        unit: { type: 'string', example: 'celsius' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Đăng ký thiết bị thành công (trả về mã mật khẩu kết nối MQTT ngẫu nhiên)' } },
      },
    },
    '/api/v1/devices/{deviceId}': {
      get: {
        tags: ['05. IoT Device Management'],
        summary: 'Chi tiết thiết bị ESP32',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Chi tiết thiết bị' } },
      },
      patch: {
        tags: ['05. IoT Device Management'],
        summary: 'Cập nhật thiết bị',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  firmwareVersion: { type: 'string' },
                  status: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'MAINTENANCE'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cập nhật thành công' } },
      },
      delete: {
        tags: ['05. IoT Device Management'],
        summary: 'Xóa thiết bị',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Xóa thành công' } },
      },
    },
    '/api/v1/devices/{deviceId}/credentials/rotate': {
      post: {
        tags: ['05. IoT Device Management'],
        summary: 'Xoay vòng mật khẩu xác thực MQTT của thiết bị',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Đã sinh mật khẩu MQTT mới' } },
      },
    },
    '/api/v1/devices/{deviceId}/sensors': {
      get: {
        tags: ['05. IoT Device Management'],
        summary: 'Danh sách cảm biến thuộc thiết bị',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Danh sách cảm biến' } },
      },
    },
    '/api/v1/devices/{deviceId}/status': {
      get: {
        tags: ['05. IoT Device Management'],
        summary: 'Trạng thái Online / Offline và thời gian Heartbeat lần cuối',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Trạng thái thiết bị' } },
      },
    },
    '/api/v1/devices/{deviceId}/telemetry/latest': {
      get: {
        tags: ['05. IoT Device Management'],
        summary: 'Telemetry mới nhất của thiết bị',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Dữ liệu mới nhất' } },
      },
    },
    '/api/v1/devices/{deviceId}/telemetry/history': {
      get: {
        tags: ['05. IoT Device Management'],
        summary: 'Lịch sử telemetry của thiết bị',
        parameters: [
          { name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { 200: { description: 'Lịch sử đo đạc' } },
      },
    },
    '/api/v1/devices/{deviceId}/commands': {
      get: {
        tags: ['05. IoT Device Management'],
        summary: 'Lịch sử các lệnh điều khiển đã gửi tới thiết bị',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Lịch sử lệnh' } },
      },
      post: {
        tags: ['05. IoT Device Management'],
        summary: 'Gửi lệnh điều khiển phần cứng (Bơm, Quạt, Van...)',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['commandType', 'payload'],
                properties: {
                  commandType: { type: 'string', enum: ['PUMP_CONTROL', 'FAN_CONTROL', 'VALVE_CONTROL'] },
                  payload: {
                    type: 'object',
                    example: { action: 'ON', durationSeconds: 60 },
                  },
                  idempotencyKey: { type: 'string', example: 'cmd-pump-20261112-001' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Lệnh đã được tiếp nhận (ACCEPTED)' } },
      },
    },
    '/api/v1/devices/{deviceId}/commands/{commandId}': {
      get: {
        tags: ['05. IoT Device Management'],
        summary: 'Theo dõi tiến độ thực thi lệnh (ACCEPTED -> PUBLISHED -> ACKNOWLEDGED -> EXECUTED)',
        parameters: [
          { name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'commandId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Trạng thái lệnh' } },
      },
    },

    // ==========================================
    // 06. TELEMETRY DATA
    // ==========================================
    '/api/v1/telemetry/latest': {
      get: {
        tags: ['06. Telemetry Data'],
        summary: 'Toàn bộ dữ liệu cảm biến mới nhất của các thiết bị',
        responses: { 200: { description: 'Telemetry mới nhất' } },
      },
    },
    '/api/v1/telemetry/history': {
      get: {
        tags: ['06. Telemetry Data'],
        summary: 'Truy vấn lịch sử dữ liệu cảm biến (lọc theo thiết bị, metric, thời gian)',
        parameters: [
          { name: 'deviceId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'metric', in: 'query', schema: { type: 'string', example: 'temperature' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
        ],
        responses: { 200: { description: 'Lịch sử telemetry' } },
      },
    },
    '/api/v1/telemetry/devices/{deviceId}': {
      get: {
        tags: ['06. Telemetry Data'],
        summary: 'Dữ liệu cảm biến theo thiết bị',
        parameters: [{ name: 'deviceId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Dữ liệu cảm biến' } },
      },
    },
    '/api/v1/telemetry/zones/{zoneId}': {
      get: {
        tags: ['06. Telemetry Data'],
        summary: 'Dữ liệu cảm biến theo khu vực',
        parameters: [{ name: 'zoneId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Dữ liệu cảm biến' } },
      },
    },
    '/api/v1/telemetry/farms/{farmId}': {
      get: {
        tags: ['06. Telemetry Data'],
        summary: 'Dữ liệu cảm biến theo nông trại',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Dữ liệu cảm biến' } },
      },
    },
    '/api/v1/telemetry/statistics': {
      get: {
        tags: ['06. Telemetry Data'],
        summary: 'Thống kê trung bình, nhỏ nhất, lớn nhất theo chỉ số',
        parameters: [
          { name: 'metric', in: 'query', schema: { type: 'string', example: 'temperature' } },
          { name: 'deviceId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { 200: { description: 'Thống kê' } },
      },
    },
    '/api/v1/telemetry/aggregates': {
      get: {
        tags: ['06. Telemetry Data'],
        summary: 'Tổng hợp số lượng bản ghi đo đạc',
        responses: { 200: { description: 'Tổng hợp' } },
      },
    },

    // ==========================================
    // 07. ALERT MANAGEMENT
    // ==========================================
    '/api/v1/alerts': {
      get: {
        tags: ['07. Alert Management'],
        summary: 'Danh sách cảnh báo vi phạm ngưỡng',
        parameters: [
          { name: 'farmId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] } },
        ],
        responses: { 200: { description: 'Danh sách cảnh báo' } },
      },
    },
    '/api/v1/alerts/{alertId}': {
      get: {
        tags: ['07. Alert Management'],
        summary: 'Chi tiết cảnh báo',
        parameters: [{ name: 'alertId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Chi tiết cảnh báo' } },
      },
    },
    '/api/v1/alerts/rules': {
      get: {
        tags: ['07. Alert Management'],
        summary: 'Danh sách quy tắc cảnh báo đã cấu hình',
        parameters: [{ name: 'farmId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Danh sách rule' } },
      },
      post: {
        tags: ['07. Alert Management'],
        summary: 'Tạo quy tắc cảnh báo mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['farmId', 'name', 'metric', 'operator'],
                properties: {
                  farmId: { type: 'string', format: 'uuid' },
                  zoneId: { type: 'string', format: 'uuid' },
                  name: { type: 'string', example: 'Cảnh báo nhiệt độ quá cao' },
                  metric: { type: 'string', example: 'temperature' },
                  operator: { type: 'string', enum: ['GT', 'LT', 'GTE', 'LTE', 'RANGE'] },
                  thresholdMax: { type: 'number', example: 40.0 },
                  thresholdMin: { type: 'number', example: 15.0 },
                  severity: { type: 'string', enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'CRITICAL' },
                  cooldownSeconds: { type: 'integer', default: 300 },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Tạo quy tắc thành công' } },
      },
    },
    '/api/v1/alerts/rules/{ruleId}': {
      get: {
        tags: ['07. Alert Management'],
        summary: 'Chi tiết quy tắc cảnh báo',
        parameters: [{ name: 'ruleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Chi tiết rule' } },
      },
      patch: {
        tags: ['07. Alert Management'],
        summary: 'Cập nhật quy tắc cảnh báo',
        parameters: [{ name: 'ruleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  thresholdMax: { type: 'number' },
                  thresholdMin: { type: 'number' },
                  enabled: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cập nhật thành công' } },
      },
      delete: {
        tags: ['07. Alert Management'],
        summary: 'Xóa quy tắc cảnh báo',
        parameters: [{ name: 'ruleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Xóa thành công' } },
      },
    },
    '/api/v1/alerts/{alertId}/acknowledge': {
      post: {
        tags: ['07. Alert Management'],
        summary: 'Xác nhận đã tiếp nhận cảnh báo (ACKNOWLEDGED)',
        parameters: [{ name: 'alertId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Đã xác nhận cảnh báo' } },
      },
    },
    '/api/v1/alerts/{alertId}/resolve': {
      post: {
        tags: ['07. Alert Management'],
        summary: 'Đánh dấu cảnh báo đã được giải quyết (RESOLVED)',
        parameters: [{ name: 'alertId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Đã giải quyết cảnh báo' } },
      },
    },

    // ==========================================
    // 08. AUTOMATION RULES
    // ==========================================
    '/api/v1/automation/rules': {
      get: {
        tags: ['08. Automation Rules'],
        summary: 'Danh sách quy tắc tự động hóa',
        parameters: [{ name: 'farmId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Danh sách quy tắc' } },
      },
      post: {
        tags: ['08. Automation Rules'],
        summary: 'Tạo quy tắc tự động hóa mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['farmId', 'name', 'conditions', 'actions'],
                properties: {
                  farmId: { type: 'string', format: 'uuid' },
                  zoneId: { type: 'string', format: 'uuid' },
                  name: { type: 'string', example: 'Tự động bật bơm khi độ ẩm đất thấp' },
                  conditions: {
                    type: 'object',
                    example: { metric: 'soilMoisture', operator: 'LT', threshold: 30 },
                  },
                  actions: {
                    type: 'object',
                    example: { commandType: 'PUMP_CONTROL', action: 'ON', durationSeconds: 120 },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Tạo quy tắc thành công' } },
      },
    },
    '/api/v1/automation/rules/{id}': {
      patch: {
        tags: ['08. Automation Rules'],
        summary: 'Cập nhật quy tắc tự động hóa',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  enabled: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Cập nhật thành công' } },
      },
      delete: {
        tags: ['08. Automation Rules'],
        summary: 'Xóa quy tắc tự động hóa',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Xóa thành công' } },
      },
    },
    '/api/v1/automation/logs': {
      get: {
        tags: ['08. Automation Rules'],
        summary: 'Nhật ký thực thi các hành động tự động',
        responses: { 200: { description: 'Nhật ký tự động hóa' } },
      },
    },

    // ==========================================
    // 09. NOTIFICATIONS
    // ==========================================
    '/api/v1/notifications': {
      get: {
        tags: ['09. Notifications'],
        summary: 'Danh sách thông báo của người dùng',
        responses: { 200: { description: 'Danh sách thông báo' } },
      },
    },
    '/api/v1/notifications/unread-count': {
      get: {
        tags: ['09. Notifications'],
        summary: 'Số lượng thông báo chưa đọc',
        responses: { 200: { description: 'Số chưa đọc' } },
      },
    },
    '/api/v1/notifications/{id}/read': {
      patch: {
        tags: ['09. Notifications'],
        summary: 'Đánh dấu một thông báo là đã đọc',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Thành công' } },
      },
    },
    '/api/v1/notifications/read-all': {
      post: {
        tags: ['09. Notifications'],
        summary: 'Đánh dấu tất cả thông báo là đã đọc',
        responses: { 200: { description: 'Thành công' } },
      },
    },
    '/api/v1/notifications/device-tokens': {
      post: {
        tags: ['09. Notifications'],
        summary: 'Đăng ký FCM Device Token từ Mobile App để nhận Push Notification',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string', example: 'fcm-device-registration-token-string' },
                  platform: { type: 'string', enum: ['ANDROID', 'IOS', 'WEB'], default: 'ANDROID' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Đăng ký token thành công' } },
      },
    },
    '/api/v1/notifications/device-tokens/{id}': {
      delete: {
        tags: ['09. Notifications'],
        summary: 'Hủy đăng ký FCM Token khi người dùng logout ứng dụng',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Hủy đăng ký thành công' } },
      },
    },

    // ==========================================
    // 10. DASHBOARD & ANALYTICS
    // ==========================================
    '/api/v1/dashboard/overview': {
      get: {
        tags: ['10. Dashboard & Analytics'],
        summary: 'Tổng quan hệ thống (Số lượng farm, thiết bị, online, cảnh báo)',
        responses: { 200: { description: 'Số liệu tổng quan' } },
      },
    },
    '/api/v1/dashboard/farms/{id}': {
      get: {
        tags: ['10. Dashboard & Analytics'],
        summary: 'Tổng quan theo từng nông trại cụ thể',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Tổng quan farm' } },
      },
    },
    '/api/v1/dashboard/devices': {
      get: {
        tags: ['10. Dashboard & Analytics'],
        summary: 'Trạng thái hoạt động của các thiết bị cho Dashboard',
        responses: { 200: { description: 'Danh sách trạng thái' } },
      },
    },
    '/api/v1/dashboard/alerts': {
      get: {
        tags: ['10. Dashboard & Analytics'],
        summary: 'Thống kê cảnh báo theo mức độ nghiêm trọng (INFO, WARNING, CRITICAL)',
        responses: { 200: { description: 'Thống kê cảnh báo' } },
      },
    },
    '/api/v1/analytics/telemetry': {
      get: {
        tags: ['10. Dashboard & Analytics'],
        summary: 'Phân tích thống kê dữ liệu cảm biến (Trung bình, Min, Max)',
        responses: { 200: { description: 'Phân tích telemetry' } },
      },
    },
    '/api/v1/analytics/devices': {
      get: {
        tags: ['10. Dashboard & Analytics'],
        summary: 'Phân tích tỷ lệ thiết bị Online vs Offline',
        responses: { 200: { description: 'Phân tích thiết bị' } },
      },
    },
    '/api/v1/analytics/alerts': {
      get: {
        tags: ['10. Dashboard & Analytics'],
        summary: 'Phân tích tần suất cảnh báo theo trạng thái',
        responses: { 200: { description: 'Phân tích cảnh báo' } },
      },
    },
  },
};
