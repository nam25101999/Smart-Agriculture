/*
 * SMART AGRICULTURE - ESP32 #2: VƯỜN CÂY ĂN TRÁI (ZONE 2)
 * Device Code: ESP32_ZONE_02
 */

#define SELECTED_DEVICE 2

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHTesp.h>
#include <ArduinoJson.h>

const char* DEVICE_CODE = "ESP32_ZONE_02";
const char* GARDEN_NAME = "Vườn 2: Cây Ăn Trái";

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

const char* MQTT_BROKER = "broker.emqx.io";
const int MQTT_PORT = 1883;

String TOPIC_TELEMETRY = String("smartagri/devices/") + DEVICE_CODE + "/telemetry";
String TOPIC_STATUS    = String("smartagri/devices/") + DEVICE_CODE + "/status";
String TOPIC_COMMANDS  = String("smartagri/devices/") + DEVICE_CODE + "/commands";
String TOPIC_ACK       = String("smartagri/devices/") + DEVICE_CODE + "/ack";

const int PIN_DHT = 15;
const int PIN_SOIL = 34;
const int PIN_PUMP = 2; // LED xanh lá (Bơm tưới nhỏ giọt)
const int PIN_FAN = 4;  // LED xanh dương (Quạt thông gió)

DHTesp dhtSensor;
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 10000;
unsigned int messageSeq = 1;

void setupWiFi() {
  Serial.println();
  Serial.print("Đang kết nối WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("✓ WiFi đã kết nối!");
  Serial.print("Địa chỉ IP: ");
  Serial.println(WiFi.localIP());
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.println();
  Serial.print("📩 [MQTT Nhận lệnh] Topic: ");
  Serial.println(topic);

  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println("Payload: " + message);

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("Lỗi parse JSON lệnh: ");
    Serial.println(error.c_str());
    return;
  }

  const char* commandId = doc["commandId"] | "unknown-id";
  const char* commandType = doc["commandType"] | "";
  JsonObject cmdPayload = doc["payload"];

  String status = "EXECUTED";
  String note = "Command executed successfully";

  if (String(commandType) == "PUMP_CONTROL") {
    const char* action = cmdPayload["action"] | "OFF";
    if (String(action) == "ON") {
      digitalWrite(PIN_PUMP, HIGH);
      Serial.println(">>> [THIẾT BỊ 2] ĐÃ BẬT BƠM TƯỚI VƯỜN CÂY ĂN TRÁI <<<");
    } else {
      digitalWrite(PIN_PUMP, LOW);
      Serial.println(">>> [THIẾT BỊ 2] ĐÃ TẮT BƠM TƯỚI VƯỜN CÂY ĂN TRÁI <<<");
    }
  } else if (String(commandType) == "FAN_CONTROL") {
    const char* action = cmdPayload["action"] | "OFF";
    if (String(action) == "ON") {
      digitalWrite(PIN_FAN, HIGH);
      Serial.println(">>> [THIẾT BỊ 2] ĐÃ BẬT QUẠT LÀM MÁT <<<");
    } else {
      digitalWrite(PIN_FAN, LOW);
      Serial.println(">>> [THIẾT BỊ 2] ĐÃ TẮT QUẠT LÀM MÁT <<<");
    }
  } else {
    status = "FAILED";
    note = "Unknown commandType";
  }

  StaticJsonDocument<256> ackDoc;
  ackDoc["commandId"] = commandId;
  ackDoc["deviceId"] = DEVICE_CODE;
  ackDoc["status"] = status;
  ackDoc["note"] = note;
  ackDoc["timestamp"] = millis();

  char ackBuffer[256];
  serializeJson(ackDoc, ackBuffer);
  mqttClient.publish(TOPIC_ACK.c_str(), ackBuffer);
  Serial.println("✓ Đã gửi ACK phản hồi lệnh về Backend.");
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Đang kết nối EMQX MQTT Broker...");
    String clientId = String(DEVICE_CODE) + "-" + String(random(0xffff), HEX);

    StaticJsonDocument<128> lwtDoc;
    lwtDoc["deviceId"] = DEVICE_CODE;
    lwtDoc["status"] = "OFFLINE";
    char lwtBuffer[128];
    serializeJson(lwtDoc, lwtBuffer);

    if (mqttClient.connect(clientId.c_str(), TOPIC_STATUS.c_str(), 1, true, lwtBuffer)) {
      Serial.println(" ✓ Kết nối MQTT thành công!");

      StaticJsonDocument<128> onlineDoc;
      onlineDoc["deviceId"] = DEVICE_CODE;
      onlineDoc["status"] = "ONLINE";
      onlineDoc["farm"] = GARDEN_NAME;
      char onlineBuffer[128];
      serializeJson(onlineDoc, onlineBuffer);
      mqttClient.publish(TOPIC_STATUS.c_str(), onlineBuffer, true);

      mqttClient.subscribe(TOPIC_COMMANDS.c_str(), 1);
      Serial.println("Đã subscribe topic lệnh: " + TOPIC_COMMANDS);
    } else {
      Serial.print("Thất bại, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" Thử lại sau 3 giây...");
      delay(3000);
    }
  }
}

void sendTelemetry() {
  TempAndHumidity data = dhtSensor.getTempAndHumidity();
  float temperature = data.temperature;
  float humidity = data.humidity;

  int rawSoil = analogRead(PIN_SOIL);
  float soilMoisture = (rawSoil / 4095.0) * 100.0;

  String messageId = String("msg-") + DEVICE_CODE + "-" + String(millis()) + "-" + String(messageSeq++);

  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_CODE;
  doc["messageId"] = messageId;
  doc["timestamp"] = millis();

  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["temperature"] = serialized(String(temperature, 1));
  sensors["humidity"] = serialized(String(humidity, 1));
  sensors["soilMoisture"] = serialized(String(soilMoisture, 1));

  doc["battery"] = 95;

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  Serial.println();
  Serial.print("📤 [ESP32 #2 - Vườn Cây Ăn Trái] Gửi Telemetry -> ");
  Serial.println(jsonBuffer);

  mqttClient.publish(TOPIC_TELEMETRY.c_str(), jsonBuffer);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("=== KHỞI ĐỘNG ESP32 #2 (VƯỜN CÂY ĂN TRÁI) ===");
  Serial.print("Mã thiết bị: ");
  Serial.println(DEVICE_CODE);

  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_FAN, OUTPUT);
  digitalWrite(PIN_PUMP, LOW);
  digitalWrite(PIN_FAN, LOW);

  dhtSensor.setup(PIN_DHT, DHTesp::DHT22);
  setupWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = currentMillis;
    sendTelemetry();
  }
}

