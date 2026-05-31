import type { Medicine } from './database.types';
import { getVitalStatus, type VitalReading } from './vitals';

const ESP_URL_KEY = 'cardiowatch.esp.url';
const DEFAULT_ESP_URL = import.meta.env.VITE_ESP8266_URL || 'http://192.168.4.1';

export interface EspStatus {
  connected: boolean;
  source: 'esp8266' | 'offline';
  url: string;
  error?: string;
  sensorMessage?: string;
  lastSeen?: Date;
}

interface EspVitalsPayload {
  bpm?: number;
  spo2?: number;
  heartRate?: number;
  oxygen?: number;
  finger?: boolean;
  timestamp?: number;
}

export interface EspVitalsResult {
  reading: VitalReading | null;
  sensorMessage?: string;
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

export function getEspUrl() {
  return normalizeUrl(localStorage.getItem(ESP_URL_KEY) || DEFAULT_ESP_URL);
}

export function setEspUrl(url: string) {
  localStorage.setItem(ESP_URL_KEY, normalizeUrl(url));
}

async function request(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${getEspUrl()}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!res.ok) throw new Error(`ESP8266 responded ${res.status}`);
    return res;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchEspVitals(): Promise<EspVitalsResult> {
  const res = await request('/api/vitals');
  const payload = await res.json() as EspVitalsPayload;
  const bpm = Math.round(Number(payload.bpm ?? payload.heartRate ?? 0));
  const spo2 = Number(payload.spo2 ?? payload.oxygen ?? 0);

  if (!Number.isFinite(bpm) || !Number.isFinite(spo2) || bpm <= 0 || spo2 <= 0) {
    return {
      reading: null,
      sensorMessage: payload.finger === false ? 'Place finger on MAX30102 sensor' : 'Waiting for valid MAX30102 reading',
    };
  }

  return {
    reading: {
      bpm,
      spo2: Number(spo2.toFixed(1)),
      status: getVitalStatus(bpm, spo2),
      timestamp: payload.timestamp ? new Date(payload.timestamp * 1000) : new Date(),
    },
  };
}

export async function sendCriticalLed(active: boolean) {
  await request('/api/critical', {
    method: 'POST',
    body: JSON.stringify({ active }),
  });
}

export async function syncMedicinesToEsp(medicines: Medicine[]) {
  await request('/api/medicines', {
    method: 'POST',
    body: JSON.stringify({
      medicines: medicines.map(m => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        time: m.reminder_time.slice(0, 5),
        days: m.days,
        active: m.active,
      })),
    }),
  });
}

export async function syncEspTime() {
  await request('/api/time', {
    method: 'POST',
    body: JSON.stringify({ epoch: Math.floor(Date.now() / 1000) }),
  });
}

export async function ringMedicineAlarm(durationMs = 5000) {
  await request('/api/buzzer', {
    method: 'POST',
    body: JSON.stringify({ durationMs }),
  });
}
