export type VitalStatus = 'normal' | 'warning' | 'critical';

export interface VitalReading {
  bpm: number;
  spo2: number;
  status: VitalStatus;
  timestamp: Date;
}

export function getVitalStatus(bpm: number, spo2: number): VitalStatus {
  if (bpm > 110 || bpm < 50 || spo2 < 90) return 'critical';
  if (bpm > 95 || bpm < 58 || spo2 < 95) return 'warning';
  return 'normal';
}

export function getStatusLabel(bpm: number, spo2: number): string {
  if (bpm > 110) return 'Tachycardia';
  if (bpm < 50) return 'Bradycardia';
  if (spo2 < 90) return 'Critical SpO2';
  if (bpm > 95) return 'Elevated HR';
  if (bpm < 58) return 'Low HR';
  if (spo2 < 95) return 'Low SpO2';
  return 'Normal';
}

export function getAlertForVitals(bpm: number, spo2: number): { type: string; message: string; severity: 'warning' | 'critical' } | null {
  if (bpm > 110) return { type: 'tachycardia', message: `Heart rate critically high: ${bpm} BPM - Tachycardia detected`, severity: 'critical' };
  if (bpm < 50) return { type: 'bradycardia', message: `Heart rate critically low: ${bpm} BPM - Bradycardia detected`, severity: 'critical' };
  if (spo2 < 90) return { type: 'low_spo2', message: `Oxygen saturation critically low: ${spo2}% - Immediate attention required`, severity: 'critical' };
  if (spo2 < 95) return { type: 'low_spo2_warning', message: `Oxygen saturation below normal: ${spo2}%`, severity: 'warning' };
  if (bpm > 95) return { type: 'elevated_hr', message: `Elevated heart rate: ${bpm} BPM`, severity: 'warning' };
  return null;
}
