export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Farm {
  id: string;
  name: string;
  code: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  totalAreaM2?: number;
  zones?: Zone[];
  createdAt: string;
}

export interface Zone {
  id: string;
  farmId: string;
  name: string;
  code: string;
  zoneType: string;
  areaM2?: number;
  description?: string;
  farm?: { id: string; name: string };
  createdAt: string;
}

export interface Sensor {
  id: string;
  deviceId: string;
  code: string;
  name: string;
  sensorType: 'TEMPERATURE' | 'HUMIDITY' | 'SOIL_MOISTURE' | 'LIGHT' | 'PH' | 'EC' | 'CO2' | 'WATER_LEVEL' | string;
  unit: string;
  minThreshold?: number;
  maxThreshold?: number;
  lastValue?: number;
  lastReadAt?: string;
}

export interface Device {
  id: string;
  farmId: string;
  zoneId?: string;
  name: string;
  code: string;
  deviceType: 'ESP32_GATEWAY' | 'SENSOR_NODE' | 'CONTROLLER' | string;
  macAddress?: string;
  ipAddress?: string;
  firmwareVersion?: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR' | 'MAINTENANCE';
  lastSeenAt?: string;
  sensors?: Sensor[];
  zone?: Zone;
}

export interface TelemetryReading {
  id: string;
  deviceId?: string;
  sensorId?: string;
  metric?: string;
  value: number;
  unit?: string;
  recordedAt: string;
}

export interface Alert {
  id: string;
  farmId: string;
  deviceId?: string;
  sensorId?: string;
  ruleId?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  title: string;
  message: string;
  metricType?: string;
  currentValue?: number;
  thresholdValue?: number;
  createdAt: string;
  resolvedAt?: string;
  device?: {
    name: string;
    code: string;
  };
}

export interface AlertRule {
  id: string;
  farmId: string;
  name: string;
  metricType: string;
  condition: 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ' | 'BETWEEN' | 'OUTSIDE';
  thresholdMin?: number;
  thresholdMax?: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  isActive: boolean;
}

export interface DeviceCommand {
  id: string;
  deviceId: string;
  commandType: 'PUMP_ON' | 'PUMP_OFF' | 'FAN_ON' | 'FAN_OFF' | 'VALVE_OPEN' | 'VALVE_CLOSE' | 'REBOOT' | string;
  payload?: Record<string, unknown>;
  status: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED' | 'TIMEOUT';
  createdAt: string;
}

