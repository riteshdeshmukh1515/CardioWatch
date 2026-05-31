
# ❤️ CardioWatch ESP8266 – AI Powered Patient Health Monitoring System

CardioWatch is an **IoT + AI-based real-time patient health monitoring system** built using **ESP8266, MAX30102 sensor, and a web dashboard with AI assistant support**. It continuously monitors **heart rate (BPM)** and **blood oxygen level (SpO₂)** and provides **real-time alerts, medicine reminders, and AI-generated health suggestions**.

This system is designed for **smart healthcare monitoring, elderly care, and emergency health detection systems**.

---

## 🚀 Key Features

* ❤️ Real-time Heart Rate (BPM) monitoring
* 🫁 SpO₂ (oxygen level) measurement
* 🧠 AI Health Assistant for medical suggestions
* 🚨 Critical condition detection system
* 🔔 Buzzer alert for emergencies & medicine reminders
* 💡 LED indicator for critical health status
* 🌐 Web-based live dashboard
* 📡 Wi-Fi connectivity (ESP8266)
* 📶 AP mode + Station mode support
* 💊 Medicine reminder system
* 📊 REST API integration for frontend/backend communication

---

## 🎯 Project Objective

The main objective of CardioWatch is to build a **low-cost intelligent patient monitoring system** that:

* Continuously tracks vital health parameters
* Detects abnormal conditions in real time
* Provides instant alerts and notifications
* Offers AI-based health suggestions
* Enables remote monitoring through web dashboard

---

## 🧠 System Architecture

### 1. Hardware Layer

* ESP8266 Microcontroller
* MAX30102 Pulse Oximeter Sensor
* Buzzer (audio alerts)
* LED (critical condition indicator)

### 2. Communication Layer

* Wi-Fi (Access Point + Station Mode)
* HTTP REST API
* JSON data exchange

### 3. Application Layer

* Web Dashboard (React/Vite)
* AI Health Assistant
* Medicine reminder scheduler
* Real-time data visualization

---

## 🔌 Hardware Wiring

### 📟 MAX30102 Sensor

| Component | ESP8266 Pin |
| --------- | ----------- |
| VIN       | 3.3V        |
| GND       | GND         |
| SDA       | D2          |
| SCL       | D1          |

---

### 🔔 Alert System

| Component  | ESP8266 Pin |
| ---------- | ----------- |
| Buzzer (+) | D5          |
| Buzzer (−) | GND         |

| Component   | ESP8266 Pin            |
| ----------- | ---------------------- |
| LED Anode   | D6 (via 220Ω resistor) |
| LED Cathode | GND                    |

---

## ⚙️ Software Requirements

* Arduino IDE
* ESP8266 Board Package
* Serial Monitor (115200 baud)
* Web browser for dashboard
* Node.js (for frontend dashboard)

---

## 🚀 Installation & Setup

### 1. Clone Repository

```bash id="c1g9v3"
git clone https://github.com/your-username/CardioWatch-ESP8266.git
cd CardioWatch-ESP8266
```

---

### 2. Open Firmware

Open:

```
esp8266-cardio-watch.ino
```

Select board:

* NodeMCU ESP8266

---

### 3. Configure Wi-Fi

```cpp id="yqk8h1"
#define WIFI_SSID "Your_WiFi_Name"
#define WIFI_PASSWORD "Your_WiFi_Password"
```

---

### 4. Upload Firmware

* Upload to ESP8266
* Open Serial Monitor (115200 baud)

---

## 📟 Serial Monitor Output

### ✅ Successful Boot

```
CardioWatch ESP8266 starting...
Serial Monitor baud: 115200
STA IP: 192.168.1.10
```

### ⚠️ Wi-Fi Not Connected

```
STA IP: (IP unset)
```

---

## 🌐 Wi-Fi Modes

### 📡 Access Point Mode (Fallback)

* SSID: `CardioWatch-ESP8266`
* Password: `12345678`
* URL: `http://192.168.4.1`

Used when router Wi-Fi is not available.

---

### 📶 Station Mode (Router Mode)

Connects to Wi-Fi router and prints IP like:

```
STA IP: 192.168.x.x
```

Used for normal dashboard communication.

---

## 📊 API Endpoints

### ❤️ Get Patient Vitals

```
GET /api/vitals
```

### Response:

```json id="v1k8cd"
{
  "bpm": 78,
  "spo2": 97,
  "finger": true,
  "critical": false,
  "timestamp": 1710000000
}
```

---

### 🚨 Critical Alert Control

```
POST /api/critical
```

Request:

```json id="b2k9fd"
{
  "active": true
}
```

Function:

* Turns ON/OFF emergency LED

---

### 💊 Medicine Reminder API

```
POST /api/medicines
```

Request:

```json id="m9k2ld"
{
  "time": "08:30",
  "medicine": "Aspirin"
}
```

Function:

* Stores reminder
* Triggers buzzer at scheduled time

---

## 🤖 AI Health Assistant

CardioWatch includes an **AI-based health assistant** that analyzes real-time BPM and SpO₂ values and provides **intelligent medical suggestions**.

---

### 🧠 Working Flow

1. ESP8266 sends live vitals
2. Dashboard receives data
3. AI assistant processes values
4. Generates health suggestions

---

### 📊 Example Input

```json id="ai1"
{
  "bpm": 102,
  "spo2": 93,
  "finger": true
}
```

---

### 💡 AI Output Examples

#### 🟢 Normal

> Your vitals are normal. Maintain healthy lifestyle and hydration.

---

#### 🟡 Warning

> Slight abnormality detected in heart rate. Please rest and monitor again.

---

#### 🔴 Critical

> Critical condition detected! Low SpO₂ or abnormal heart rate. Seek immediate medical attention.

---

### 📌 AI Decision Logic

* Normal:

  * BPM: 60–100
  * SpO₂: 95–100%

* Warning:

  * BPM: 50–59 or 101–120
  * SpO₂: 90–94%

* Critical:

  * BPM: <50 or >120
  * SpO₂: <90%

---

## 🖥️ Dashboard Setup

### Install dependencies

```bash id="d3k8hd"
npm install
```

### Run frontend

```bash id="f8k2jd"
npm run dev -- --host 0.0.0.0
```

---

### Access Dashboard

* Local: `http://localhost:5173`
* Mobile: `http://<your-ip>:5173`

---

### ESP URL Input

* AP Mode → `http://192.168.4.1`
* Station Mode → `http://192.168.x.x`

---

## 📸 Screenshots

<img width="1912" height="815" alt="Screenshot 2026-05-03 214107" src="https://github.com/user-attachments/assets/674dd312-bb9d-4937-b14c-45dcb868bf40" />

---------------------------------------------------------------------------------------------------------------------------------------------------------


<img width="1912" height="818" alt="Screenshot 2026-05-03 214125" src="https://github.com/user-attachments/assets/9654597e-d43a-43a8-843f-686974b87fd9" />

--------------------------------------------------------------------------------------------------------------------------------------------------------


<img width="1917" height="815" alt="Screenshot 2026-05-03 214139" src="https://github.com/user-attachments/assets/91316961-17f2-441d-9673-91bc5292be44" />

--------------------------------------------------------------------------------------------------------------------------------------------------------


<img width="1355" height="670" alt="Screenshot 2026-05-03 214149" src="https://github.com/user-attachments/assets/4e941bb5-6627-4241-a611-f3a0113aa415" />

--------------------------------------------------------------------------------------------------------------------------------------------------------


<img width="1903" height="831" alt="Screenshot 2026-05-03 214224" src="https://github.com/user-attachments/assets/81a7472b-4b46-49be-92b3-95580286b809" />

--------------------------------------------------------------------------------------------------------------------------------------------------------



<img width="1907" height="822" alt="Screenshot 2026-05-03 214240" src="https://github.com/user-attachments/assets/9fca13e7-6ab6-4f8b-baf0-bb1b0061f99c" />


--------------------------------------------------------------------------------------------------------------------------------------------------------



---

## 📁 Project Structure

```
CardioWatch-ESP8266/
│
├── 📄 README.md
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 .gitignore
│
├── 🔌 firmware/
│   └── esp8266-cardio-watch/
│       ├── esp8266-cardio-watch.ino
│       └── README.md
│
├── 🖥️ src/   (Frontend - React + TypeScript)
│   │
│   ├── 📄 main.tsx
│   ├── 📄 App.tsx
│   ├── 📄 index.css
│   ├── 📄 vite-env.d.ts
│   │
│   ├── 🧠 components/
│   │   ├── AuthPage.tsx
│   │   ├── ECGLine.tsx
│   │   ├── Sidebar.tsx
│   │   └── VitalCard.tsx
│   │
│   ├── 📊 views/
│   │   ├── AIView.tsx
│   │   ├── AlertsView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── HistoryView.tsx
│   │   ├── MedicineView.tsx
│   │   └── TrendsView.tsx
│   │
│   ├── 🔗 lib/
│   │   ├── ai.ts
│   │   ├── esp8266.ts
│   │   ├── vitals.ts
│   │   ├── localDatabase.ts
│   │   ├── database.types.ts
│   │
│   ├── 🔐 contexts/
│   │   ├── AuthContext.tsx
│   │   └── VitalsContext.tsx
│
├── 🗄️ supabase/
│   └── migrations/
│       └── 20260502060109_cardiowatch_schema.sql
│
├── 🎨 config/
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── tsconfig.node.json
│
└── ⚙️ system files
    ├── index.html
    └── eslint.config.js
```

---

## ⚠️ Important Notes

* Use stable 3.3V power for MAX30102
* Finger placement affects sensor accuracy
* Ensure correct Wi-Fi credentials
* AP mode is fallback only
* Keep ESP8266 near router for stability

---

## 🔮 Future Improvements

* AI-based disease prediction model
* Cloud database integration (Firebase/Supabase)
* Mobile app (Flutter/React Native)
* SMS/WhatsApp emergency alerts
* Doctor monitoring dashboard
* ECG sensor integration

---

## 🏥 Applications

* Hospitals
* Home healthcare systems
* Elderly patient monitoring
* Emergency health detection
* Remote IoT healthcare systems

---

## 👨‍💻 Author

CardioWatch – IoT + AI Healthcare Monitoring System

Designed for real-time patient monitoring and intelligent health assistance

---

## 📜 License

This project is open-source and intended for educational and healthcare innovation purposes.

---


