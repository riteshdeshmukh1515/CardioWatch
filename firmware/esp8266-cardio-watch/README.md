# CardioWatch ESP8266 Firmware

## Wiring

- MAX30102 VIN -> 3.3V
- MAX30102 GND -> GND
- MAX30102 SDA -> D2
- MAX30102 SCL -> D1
- Buzzer + -> D5, Buzzer - -> GND
- Critical LED anode -> D6 through 220 ohm resistor, cathode -> GND

## Arduino IDE Setup

No Arduino libraries are required. The sketch uses only the ESP8266 board package and a small built-in MAX30102 I2C reader.

Set `WIFI_SSID` and `WIFI_PASSWORD` in `esp8266-cardio-watch.ino`, then upload to the ESP8266.

Open Serial Monitor at `115200 baud`. After reset you may see one short garbled line from the ESP8266 ROM bootloader; this is normal. The sketch output starts with:

```text
CardioWatch ESP8266 starting...
Serial Monitor baud: 115200
```

If Arduino IDE shows `COMx [not connected]`, close Serial Monitor, select `Tools > Port > COMx`, then open Serial Monitor again.

The ESP8266 also starts an access point:

- SSID: `CardioWatch-ESP8266`
- Password: `12345678`
- Default AP URL: `http://192.168.4.1`

Use the dashboard ESP8266 URL field to enter either the AP URL or the station IP printed in Serial Monitor.

Important:

- If Serial Monitor shows `STA IP: (IP unset)`, the ESP8266 did not connect to your router.
- In that case, connect your computer Wi-Fi to `CardioWatch-ESP8266`, then use `http://192.168.4.1` in the dashboard.
- If you want to stay on your normal Wi-Fi, fix `WIFI_SSID` and `WIFI_PASSWORD`, upload again, then use the printed `STA IP`.

## Local API

- `GET /api/vitals` returns `{ bpm, spo2, finger, critical, timestamp }`
- `POST /api/critical` with `{ "active": true }` controls the critical LED
- `POST /api/medicines` receives reminder schedules from the web app and rings the buzzer at medicine time
npm.cmd run dev -- --host 0.0.0.0