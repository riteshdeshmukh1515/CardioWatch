#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Wire.h>
#include <time.h>

// No external libraries required beyond the ESP8266 board package.

const char* WIFI_SSID = "DNYANETHICS";
const char* WIFI_PASSWORD = "1234567808";

const char* AP_SSID = "CardioWatch-ESP8266";
const char* AP_PASSWORD = "12345678";

const uint8_t BUZZER_PIN = D5;
const uint8_t CRITICAL_LED_PIN = D6;
const uint8_t STATUS_LED_PIN = LED_BUILTIN;

const long UTC_OFFSET_SECONDS = 19800; // India Standard Time: UTC+05:30
const int MAX_MEDICINES = 12;
const byte MAX30102_ADDRESS = 0x57;

const byte REG_INTR_STATUS_1 = 0x00;
const byte REG_FIFO_WR_PTR = 0x04;
const byte REG_OVF_COUNTER = 0x05;
const byte REG_FIFO_RD_PTR = 0x06;
const byte REG_FIFO_DATA = 0x07;
const byte REG_FIFO_CONFIG = 0x08;
const byte REG_MODE_CONFIG = 0x09;
const byte REG_SPO2_CONFIG = 0x0A;
const byte REG_LED1_PA = 0x0C; // Red LED
const byte REG_LED2_PA = 0x0D; // IR LED
const byte REG_PART_ID = 0xFF;

struct MedicineReminder {
  String id;
  String name;
  String dosage;
  String time;
  bool days[7]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
  bool active;
  int lastTriggeredMinute;
};

ESP8266WebServer server(80);

MedicineReminder medicines[MAX_MEDICINES];
int medicineCount = 0;

float latestBpm = 0;
float latestSpo2 = 0;
bool fingerDetected = false;
bool criticalFromApp = false;
unsigned long lastSampleAt = 0;
unsigned long buzzerUntil = 0;
unsigned long lastBeatAt = 0;
long irAverage = 0;
bool pulseWasHigh = false;
bool max30102Ready = false;
unsigned long appTimeBaseEpoch = 0;
unsigned long appTimeBaseMillis = 0;

void addCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void sendJson(int code, const String& json) {
  addCors();
  server.send(code, "application/json", json);
}

void handleOptions() {
  addCors();
  server.send(204);
}

bool isCriticalVitals() {
  return fingerDetected && (latestBpm > 110 || latestBpm < 50 || latestSpo2 < 90);
}

void writeMaxRegister(byte reg, byte value) {
  Wire.beginTransmission(MAX30102_ADDRESS);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

byte readMaxRegister(byte reg) {
  Wire.beginTransmission(MAX30102_ADDRESS);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return 0;
  Wire.requestFrom(MAX30102_ADDRESS, (byte)1);
  return Wire.available() ? Wire.read() : 0;
}

bool readMaxSample(uint32_t& red, uint32_t& ir) {
  Wire.beginTransmission(MAX30102_ADDRESS);
  Wire.write(REG_FIFO_DATA);
  if (Wire.endTransmission(false) != 0) return false;

  Wire.requestFrom(MAX30102_ADDRESS, (byte)6);
  if (Wire.available() < 6) return false;

  red = ((uint32_t)Wire.read() << 16) | ((uint32_t)Wire.read() << 8) | Wire.read();
  ir = ((uint32_t)Wire.read() << 16) | ((uint32_t)Wire.read() << 8) | Wire.read();
  red &= 0x3FFFF;
  ir &= 0x3FFFF;
  return true;
}

bool initMax30102() {
  byte partId = readMaxRegister(REG_PART_ID);
  if (partId != 0x15) {
    return false;
  }

  writeMaxRegister(REG_MODE_CONFIG, 0x40); // Reset
  delay(100);
  writeMaxRegister(REG_INTR_STATUS_1, 0x00);
  writeMaxRegister(REG_FIFO_WR_PTR, 0x00);
  writeMaxRegister(REG_OVF_COUNTER, 0x00);
  writeMaxRegister(REG_FIFO_RD_PTR, 0x00);
  writeMaxRegister(REG_FIFO_CONFIG, 0x4F); // Average 4 samples, rollover on
  writeMaxRegister(REG_MODE_CONFIG, 0x03); // SpO2 mode
  writeMaxRegister(REG_SPO2_CONFIG, 0x27); // 100 Hz, 411 us, 18-bit
  writeMaxRegister(REG_LED1_PA, 0x24); // Red LED current
  writeMaxRegister(REG_LED2_PA, 0x24); // IR LED current
  return true;
}

void startBuzzer(unsigned long durationMs) {
  buzzerUntil = millis() + durationMs;
  digitalWrite(BUZZER_PIN, HIGH);
}

void updateOutputs() {
  const bool critical = criticalFromApp || isCriticalVitals();
  digitalWrite(CRITICAL_LED_PIN, critical ? HIGH : LOW);
  digitalWrite(STATUS_LED_PIN, WiFi.status() == WL_CONNECTED ? LOW : HIGH);

  if (buzzerUntil > 0 && millis() > buzzerUntil) {
    buzzerUntil = 0;
    digitalWrite(BUZZER_PIN, LOW);
  }
}

unsigned long currentEpoch() {
  time_t ntpNow = time(nullptr);
  if (ntpNow > 100000) return (unsigned long)ntpNow;
  if (appTimeBaseEpoch > 100000) {
    return appTimeBaseEpoch + ((millis() - appTimeBaseMillis) / 1000);
  }
  return 0;
}

void sampleVitals() {
  if (!max30102Ready) return;
  if (millis() - lastSampleAt < 40) return;
  lastSampleAt = millis();

  uint32_t red = 0;
  uint32_t ir = 0;
  if (!readMaxSample(red, ir)) return;

  fingerDetected = ir > 50000;
  if (!fingerDetected) {
    latestBpm = 0;
    latestSpo2 = 0;
    irAverage = 0;
    pulseWasHigh = false;
    return;
  }

  if (irAverage == 0) irAverage = ir;
  irAverage = (irAverage * 15 + (long)ir) / 16;

  const long pulseLevel = (long)ir - irAverage;
  const bool pulseHigh = pulseLevel > 1800;
  const unsigned long now = millis();

  if (pulseHigh && !pulseWasHigh && now - lastBeatAt > 320) {
    if (lastBeatAt > 0) {
      float bpm = 60000.0 / (now - lastBeatAt);
      if (bpm >= 40 && bpm <= 180) {
        latestBpm = latestBpm > 0 ? (latestBpm * 0.75 + bpm * 0.25) : bpm;
      }
    }
    lastBeatAt = now;
  }
  pulseWasHigh = pulseHigh;

  if (ir > 0) {
    float ratio = (float)red / (float)ir;
    float spo2 = 110.0 - (25.0 * ratio);
    if (spo2 > 100) spo2 = 100;
    if (spo2 < 80) spo2 = 80;
    latestSpo2 = latestSpo2 > 0 ? (latestSpo2 * 0.85 + spo2 * 0.15) : spo2;
  }
}

void checkMedicineReminders() {
  time_t now = currentEpoch();
  if (now < 100000) return;

  tm* local = localtime(&now);
  const int day = local->tm_wday;
  const int hour = local->tm_hour;
  const int minute = local->tm_min;
  const int minuteOfDay = hour * 60 + minute;
  char hhmm[6];
  snprintf(hhmm, sizeof(hhmm), "%02d:%02d", hour, minute);

  for (int i = 0; i < medicineCount; i++) {
    MedicineReminder& med = medicines[i];
    if (!med.active || !med.days[day] || med.time != hhmm) continue;
    if (med.lastTriggeredMinute == minuteOfDay) continue;
    med.lastTriggeredMinute = minuteOfDay;
    startBuzzer(15000);
  }
}

void handleVitals() {
  String body = "{";
  body += "\"bpm\":" + String(latestBpm, 1) + ",";
  body += "\"spo2\":" + String(latestSpo2, 1) + ",";
  body += "\"finger\":" + String(fingerDetected ? "true" : "false") + ",";
  body += "\"critical\":" + String((criticalFromApp || isCriticalVitals()) ? "true" : "false") + ",";
  body += "\"timestamp\":" + String(currentEpoch());
  body += "}";
  sendJson(200, body);
}

void handleCritical() {
  String body = server.arg("plain");
  body.toLowerCase();
  criticalFromApp = body.indexOf("\"active\":true") >= 0 || body.indexOf("\"active\": true") >= 0;
  sendJson(200, "{\"ok\":true}");
}

unsigned long jsonUnsignedLongValue(const String& object, const String& key, unsigned long fallback) {
  String compact = object;
  compact.replace(" ", "");
  String marker = "\"" + key + "\":";
  int start = compact.indexOf(marker);
  if (start < 0) return fallback;
  start += marker.length();
  int end = start;
  while (end < compact.length() && compact[end] >= '0' && compact[end] <= '9') end++;
  if (end == start) return fallback;
  return compact.substring(start, end).toInt();
}

void handleTimeSync() {
  unsigned long epoch = jsonUnsignedLongValue(server.arg("plain"), "epoch", 0);
  if (epoch > 100000) {
    appTimeBaseEpoch = epoch;
    appTimeBaseMillis = millis();
    sendJson(200, "{\"ok\":true}");
    return;
  }
  sendJson(400, "{\"ok\":false,\"error\":\"invalid epoch\"}");
}

void handleBuzzer() {
  unsigned long durationMs = jsonUnsignedLongValue(server.arg("plain"), "durationMs", 5000);
  if (durationMs < 500) durationMs = 500;
  if (durationMs > 30000) durationMs = 30000;
  startBuzzer(durationMs);
  sendJson(200, "{\"ok\":true}");
}

String jsonStringValue(const String& object, const String& key, const String& fallback) {
  String marker = "\"" + key + "\":\"";
  int start = object.indexOf(marker);
  if (start < 0) return fallback;
  start += marker.length();
  int end = object.indexOf("\"", start);
  if (end < 0) return fallback;
  return object.substring(start, end);
}

bool jsonBoolValue(const String& object, const String& key, bool fallback) {
  String compact = object;
  compact.replace(" ", "");
  String marker = "\"" + key + "\":";
  int start = compact.indexOf(marker);
  if (start < 0) return fallback;
  start += marker.length();
  if (compact.substring(start, start + 4) == "true") return true;
  if (compact.substring(start, start + 5) == "false") return false;
  return fallback;
}

int dayIndex(const String& day) {
  if (day == "Sun") return 0;
  if (day == "Mon") return 1;
  if (day == "Tue") return 2;
  if (day == "Wed") return 3;
  if (day == "Thu") return 4;
  if (day == "Fri") return 5;
  if (day == "Sat") return 6;
  return -1;
}

void handleMedicines() {
  String body = server.arg("plain");
  medicineCount = 0;

  int searchFrom = body.indexOf("\"medicines\"");
  while (searchFrom >= 0 && medicineCount < MAX_MEDICINES) {
    int objectStart = body.indexOf("{", searchFrom + 1);
    if (objectStart < 0) break;
    int objectEnd = body.indexOf("}", objectStart + 1);
    if (objectEnd < 0) break;

    String item = body.substring(objectStart, objectEnd + 1);
    if (medicineCount >= MAX_MEDICINES) break;
    MedicineReminder& med = medicines[medicineCount++];
    med.id = jsonStringValue(item, "id", "");
    med.name = jsonStringValue(item, "name", "");
    med.dosage = jsonStringValue(item, "dosage", "");
    med.time = jsonStringValue(item, "time", "08:00");
    med.active = jsonBoolValue(item, "active", true);
    med.lastTriggeredMinute = -1;
    for (int d = 0; d < 7; d++) med.days[d] = false;

    int daysStart = item.indexOf("\"days\"");
    int bracketStart = item.indexOf("[", daysStart);
    int bracketEnd = item.indexOf("]", bracketStart);
    if (bracketStart >= 0 && bracketEnd > bracketStart) {
      String days = item.substring(bracketStart, bracketEnd + 1);
      const char* names[] = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
      for (int d = 0; d < 7; d++) {
        med.days[d] = days.indexOf(names[d]) >= 0;
      }
    }

    searchFrom = objectEnd + 1;
  }

  sendJson(200, "{\"ok\":true}");
}

void connectWiFi() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 12000) {
    delay(250);
    yield();
  }
}

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(CRITICAL_LED_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(CRITICAL_LED_PIN, LOW);

  Serial.begin(115200);
  Serial.setDebugOutput(false);
  delay(250);
  Serial.println();
  Serial.println("CardioWatch ESP8266 starting...");
  Serial.println("Serial Monitor baud: 115200");

  Wire.begin(D2, D1); // ESP8266 SDA=D2, SCL=D1

  connectWiFi();
  configTime(UTC_OFFSET_SECONDS, 0, "pool.ntp.org", "time.nist.gov");

  max30102Ready = initMax30102();
  if (!max30102Ready) {
    Serial.println("MAX30102 not found. Check wiring and power.");
  } else {
    Serial.println("MAX30102 ready.");
  }

  server.on("/api/vitals", HTTP_OPTIONS, handleOptions);
  server.on("/api/vitals", HTTP_GET, handleVitals);
  server.on("/api/critical", HTTP_OPTIONS, handleOptions);
  server.on("/api/critical", HTTP_POST, handleCritical);
  server.on("/api/medicines", HTTP_OPTIONS, handleOptions);
  server.on("/api/medicines", HTTP_POST, handleMedicines);
  server.on("/api/time", HTTP_OPTIONS, handleOptions);
  server.on("/api/time", HTTP_POST, handleTimeSync);
  server.on("/api/buzzer", HTTP_OPTIONS, handleOptions);
  server.on("/api/buzzer", HTTP_POST, handleBuzzer);
  server.begin();

  Serial.print("WiFi status: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "connected" : "router not connected, AP still available");
  Serial.print("STA IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());
}

void loop() {
  server.handleClient();
  sampleVitals();
  checkMedicineReminders();
  updateOutputs();
}
