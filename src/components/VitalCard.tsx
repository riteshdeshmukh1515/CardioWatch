import { type ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  status: 'normal' | 'warning' | 'critical';
  sub?: string;
}

const STATUS_COLORS = {
  normal: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    value: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    pulse: 'bg-emerald-400',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    value: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    pulse: 'bg-amber-400',
  },
  critical: {
    border: 'border-red-500/40',
    bg: 'bg-red-500/5',
    value: 'text-red-400',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    pulse: 'bg-red-400',
  },
};

export function VitalCard({ label, value, unit, icon, status, sub }: Props) {
  const c = STATUS_COLORS[status];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${c.border} ${c.bg} p-6 transition-all duration-500`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.pulse} ${status !== 'normal' ? 'animate-pulse' : ''}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className={`w-10 h-10 rounded-xl ${c.badge} border flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-bold tabular-nums tracking-tight ${c.value}`}>{value}</span>
        <span className="text-slate-400 text-lg">{unit}</span>
      </div>
      {sub && <p className="text-slate-500 text-xs mt-2">{sub}</p>}
    </div>
  );
}
