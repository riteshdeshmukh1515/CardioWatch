import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { getAlertForVitals, type VitalReading } from '../lib/vitals';
import { useAuth } from './AuthContext';
import { fetchEspVitals, getEspUrl, sendCriticalLed, syncEspTime, syncMedicinesToEsp, type EspStatus } from '../lib/esp8266';
import { localDb, subscribeLocalDb } from '../lib/localDatabase';

const MAX_READINGS = 100;

interface VitalsContextValue {
  current: VitalReading | null;
  history: VitalReading[];
  espStatus: EspStatus;
  isMonitoring: boolean;
  toggleMonitoring: () => void;
  refreshEspStatus: () => void;
}

const VitalsContext = createContext<VitalsContextValue | null>(null);

export function VitalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState<VitalReading | null>(null);
  const [history, setHistory] = useState<VitalReading[]>([]);
  const [espStatus, setEspStatus] = useState<EspStatus>({
    connected: false,
    source: 'esp8266',
    url: getEspUrl(),
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAlertType = useRef<string | null>(null);
  const lastCriticalState = useRef<boolean | null>(null);
  const lastMedicineSync = useRef<string>('');

  useEffect(() => {
    if (!user) return;
    const saved = localDb.listVitals(user.id, MAX_READINGS).map(v => ({
      bpm: v.bpm,
      spo2: v.spo2,
      status: v.status,
      timestamp: new Date(v.recorded_at),
    }));
    setHistory(saved);
    setCurrent(null);

    const migrationKey = `cardiowatch.real-sensor-only.${user.id}`;
    if (!localStorage.getItem(migrationKey)) {
      localDb.clearVitals(user.id);
      localStorage.setItem(migrationKey, 'true');
      setHistory([]);
    }
  }, [user]);

  const saveVital = useCallback((reading: VitalReading) => {
    if (!user) return;
    localDb.addVital({
      user_id: user.id,
      bpm: reading.bpm,
      spo2: reading.spo2,
      status: reading.status,
      recorded_at: reading.timestamp.toISOString(),
    });
  }, [user]);

  const saveAlert = useCallback((reading: VitalReading) => {
    if (!user) return;
    const alert = getAlertForVitals(reading.bpm, reading.spo2);
    if (!alert) { lastAlertType.current = null; return; }
    if (alert.type === lastAlertType.current) return;
    lastAlertType.current = alert.type;
    localDb.addAlert({
      user_id: user.id,
      type: alert.type,
      message: alert.message,
      bpm: reading.bpm,
      spo2: reading.spo2,
      severity: alert.severity,
      acknowledged: false,
    });
  }, [user]);

  const refreshEspStatus = () => {
    setEspStatus(s => ({ ...s, url: getEspUrl() }));
  };

  const syncMedicines = useCallback(() => {
    if (!user) return;
    const medicines = localDb.listMedicines(user.id);
    const signature = JSON.stringify(medicines.map(m => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      time: m.reminder_time,
      days: m.days,
      active: m.active,
    })));
    if (signature === lastMedicineSync.current) return;
    syncEspTime()
      .catch(() => undefined)
      .finally(() => syncMedicinesToEsp(medicines)
        .then(() => { lastMedicineSync.current = signature; })
        .catch(() => undefined));
  }, [user]);

  useEffect(() => {
    syncMedicines();
    return subscribeLocalDb(syncMedicines);
  }, [syncMedicines]);

  useEffect(() => {
    if (!isMonitoring) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(async () => {
      let reading: VitalReading | null = null;
      try {
        const result = await fetchEspVitals();
        reading = result.reading;
        setEspStatus({
          connected: true,
          source: 'esp8266',
          url: getEspUrl(),
          sensorMessage: result.sensorMessage,
          lastSeen: new Date(),
        });
        syncEspTime().catch(() => undefined);
        syncMedicines();
      } catch (err) {
        setEspStatus({
          connected: false,
          source: 'offline',
          url: getEspUrl(),
          error: err instanceof Error ? err.message : 'ESP8266 connection failed',
        });
        setCurrent(null);
        return;
      }

      if (!reading) {
        setCurrent(null);
        return;
      }

      setCurrent(reading);
      setHistory(h => [reading, ...h].slice(0, MAX_READINGS));
      saveVital(reading);
      saveAlert(reading);

      const isCritical = reading.status === 'critical';
      if (espStatus.connected && lastCriticalState.current !== isCritical) {
        lastCriticalState.current = isCritical;
        sendCriticalLed(isCritical).catch(() => undefined);
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMonitoring, saveVital, saveAlert, espStatus.connected, syncMedicines]);

  const toggleMonitoring = () => setIsMonitoring(v => !v);

  return (
    <VitalsContext.Provider value={{ current, history, espStatus, isMonitoring, toggleMonitoring, refreshEspStatus }}>
      {children}
    </VitalsContext.Provider>
  );
}

export function useVitals() {
  const ctx = useContext(VitalsContext);
  if (!ctx) throw new Error('useVitals must be inside VitalsProvider');
  return ctx;
}
