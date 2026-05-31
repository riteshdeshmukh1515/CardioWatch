export interface LocalUser {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
  };
}

export interface LocalSession {
  user: LocalUser;
  created_at: string;
}

export interface Vital {
  id: string;
  user_id: string;
  bpm: number;
  spo2: number;
  status: 'normal' | 'warning' | 'critical';
  recorded_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  type: string;
  message: string;
  bpm: number | null;
  spo2: number | null;
  severity: 'warning' | 'critical';
  acknowledged: boolean;
  created_at: string;
}

export interface Medicine {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  reminder_time: string;
  days: string[];
  notes: string;
  active: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
