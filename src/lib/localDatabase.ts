import type { Alert, LocalSession, LocalUser, Medicine, Vital } from './database.types';

const STORAGE_PREFIX = 'cardiowatch.local.';
const SESSION_KEY = `${STORAGE_PREFIX}session`;
const USERS_KEY = `${STORAGE_PREFIX}users`;
const VITALS_KEY = `${STORAGE_PREFIX}vitals`;
const ALERTS_KEY = `${STORAGE_PREFIX}alerts`;
const MEDICINES_KEY = `${STORAGE_PREFIX}medicines`;

type StoredUser = LocalUser & { password: string };

function toPublicUser(user: StoredUser): LocalUser {
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('cardiowatch:storage', { detail: { key } }));
}

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export const localDb = {
  getSession(): LocalSession | null {
    return readJson<LocalSession | null>(SESSION_KEY, null);
  },

  signIn(email: string, password: string): LocalSession {
    const users = readJson<StoredUser[]>(USERS_KEY, []);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    const publicUser = toPublicUser(user);
    const session = { user: publicUser, created_at: new Date().toISOString() };
    writeJson(SESSION_KEY, session);
    return session;
  },

  signUp(email: string, password: string, name: string): LocalSession {
    const users = readJson<StoredUser[]>(USERS_KEY, []);
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists on this device');
    }
    const user: StoredUser = {
      id: uid('user'),
      email,
      password,
      user_metadata: { name },
    };
    writeJson(USERS_KEY, [...users, user]);
    const publicUser = toPublicUser(user);
    const session = { user: publicUser, created_at: new Date().toISOString() };
    writeJson(SESSION_KEY, session);
    return session;
  },

  signOut() {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('cardiowatch:storage', { detail: { key: SESSION_KEY } }));
  },

  addVital(input: Omit<Vital, 'id' | 'recorded_at'> & { recorded_at?: string }): Vital {
    const vital: Vital = {
      id: uid('vital'),
      recorded_at: input.recorded_at ?? new Date().toISOString(),
      ...input,
    };
    const vitals = readJson<Vital[]>(VITALS_KEY, []);
    writeJson(VITALS_KEY, [vital, ...vitals].slice(0, 500));
    return vital;
  },

  listVitals(userId: string, limit = 100): Vital[] {
    return readJson<Vital[]>(VITALS_KEY, [])
      .filter(v => v.user_id === userId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
      .slice(0, limit);
  },

  clearVitals(userId: string) {
    const vitals = readJson<Vital[]>(VITALS_KEY, []);
    writeJson(VITALS_KEY, vitals.filter(v => v.user_id !== userId));
  },

  addAlert(input: Omit<Alert, 'id' | 'created_at'> & { created_at?: string }): Alert {
    const alert: Alert = {
      id: uid('alert'),
      created_at: input.created_at ?? new Date().toISOString(),
      ...input,
    };
    const alerts = readJson<Alert[]>(ALERTS_KEY, []);
    writeJson(ALERTS_KEY, [alert, ...alerts].slice(0, 300));
    return alert;
  },

  listAlerts(userId: string, limit = 50): Alert[] {
    return readJson<Alert[]>(ALERTS_KEY, [])
      .filter(a => a.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  },

  acknowledgeAlert(id: string) {
    const alerts = readJson<Alert[]>(ALERTS_KEY, []);
    writeJson(ALERTS_KEY, alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  },

  listMedicines(userId: string): Medicine[] {
    return readJson<Medicine[]>(MEDICINES_KEY, [])
      .filter(m => m.user_id === userId && m.active)
      .sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));
  },

  upsertMedicine(input: Omit<Medicine, 'id' | 'created_at' | 'active'> & { id?: string; active?: boolean }): Medicine {
    const medicines = readJson<Medicine[]>(MEDICINES_KEY, []);
    const existing = input.id ? medicines.find(m => m.id === input.id) : null;
    const medicine: Medicine = {
      id: input.id ?? uid('med'),
      created_at: existing?.created_at ?? new Date().toISOString(),
      active: input.active ?? true,
      user_id: input.user_id,
      name: input.name,
      dosage: input.dosage,
      reminder_time: input.reminder_time,
      days: input.days,
      notes: input.notes,
    };
    writeJson(MEDICINES_KEY, existing
      ? medicines.map(m => m.id === medicine.id ? medicine : m)
      : [medicine, ...medicines]
    );
    return medicine;
  },

  deactivateMedicine(id: string) {
    const medicines = readJson<Medicine[]>(MEDICINES_KEY, []);
    writeJson(MEDICINES_KEY, medicines.map(m => m.id === id ? { ...m, active: false } : m));
  },
};

export function subscribeLocalDb(listener: () => void) {
  const handler = () => listener();
  window.addEventListener('storage', handler);
  window.addEventListener('cardiowatch:storage', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('cardiowatch:storage', handler);
  };
}
