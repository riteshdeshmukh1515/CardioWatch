import { useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';
import { useVitals } from '../contexts/VitalsContext';

export function TrendsView() {
  const { history } = useVitals();
  const bpmCanvasRef = useRef<HTMLCanvasElement>(null);
  const spo2CanvasRef = useRef<HTMLCanvasElement>(null);

  const drawChart = (
    canvas: HTMLCanvasElement | null,
    data: number[],
    options: {
      min: number;
      max: number;
      normalMin: number;
      normalMax: number;
      warnMin?: number;
      warnMax?: number;
      color: string;
      warnColor: string;
      critColor: string;
      label: string;
      unit: string;
    }
  ) => {
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const PAD = { top: 30, right: 20, bottom: 40, left: 50 };
    const cW = W - PAD.left - PAD.right;
    const cH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    const toX = (i: number) => PAD.left + (i / (data.length - 1)) * cW;
    const toY = (v: number) => PAD.top + cH - ((v - options.min) / (options.max - options.min)) * cH;

    // Normal zone background
    ctx.fillStyle = 'rgba(52,211,153,0.06)';
    ctx.fillRect(PAD.left, toY(options.normalMax), cW, toY(options.normalMin) - toY(options.normalMax));

    // Grid lines
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = PAD.top + (i / 5) * cH;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + cW, y); ctx.stroke();
      const val = Math.round(options.max - (i / 5) * (options.max - options.min));
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(val), PAD.left - 8, y + 4);
    }

    // X axis labels
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const step = Math.ceil(data.length / 6);
    for (let i = 0; i < data.length; i += step) {
      ctx.fillText(`-${data.length - 1 - i}s`, toX(i), H - 10);
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, PAD.top, 0, H - PAD.bottom);
    grad.addColorStop(0, options.color + '30');
    grad.addColorStop(1, options.color + '00');
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = toX(i); const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(toX(data.length - 1), H - PAD.bottom);
    ctx.lineTo(PAD.left, H - PAD.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    data.forEach((v, i) => {
      const x = toX(i); const y = toY(v);
      let col = options.color;
      if (v < (options.warnMin ?? options.normalMin) || v > (options.warnMax ?? options.normalMax)) col = options.warnColor;
      if (v < options.normalMin * 0.9 || v > options.normalMax * 1.1) col = options.critColor;
      ctx.strokeStyle = col;
      if (i === 0) ctx.moveTo(x, y);
      else { ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); }
    });
    ctx.stroke();

    // Last value dot
    if (data.length > 0) {
      const lx = toX(data.length - 1);
      const ly = toY(data[data.length - 1]);
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fillStyle = options.color;
      ctx.shadowColor = options.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Label
    ctx.fillStyle = 'rgba(148,163,184,0.8)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${options.label} (${options.unit})`, PAD.left, 18);
  };

  useEffect(() => {
    const bpmData = [...history].reverse().map(r => r.bpm);
    const spo2Data = [...history].reverse().map(r => r.spo2);

    drawChart(bpmCanvasRef.current, bpmData, {
      min: 30, max: 160, normalMin: 60, normalMax: 100, warnMin: 50, warnMax: 110,
      color: '#22d3ee', warnColor: '#fbbf24', critColor: '#f87171',
      label: 'Heart Rate', unit: 'BPM',
    });
    drawChart(spo2CanvasRef.current, spo2Data, {
      min: 75, max: 102, normalMin: 95, normalMax: 100, warnMin: 90, warnMax: 100,
      color: '#34d399', warnColor: '#fbbf24', critColor: '#f87171',
      label: 'SpO2', unit: '%',
    });
  }, [history]);

  const latest = history[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Trends</h2>
        <p className="text-slate-400 text-sm mt-0.5">{history.length} readings recorded - last 100 shown</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'Normal Zone', color: 'bg-emerald-400/30 border-emerald-400/50' },
          { label: 'Warning', color: 'bg-amber-400/30 border-amber-400/50' },
          { label: 'Critical', color: 'bg-red-400/30 border-red-400/50' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm border ${l.color}`} />
            <span className="text-xs text-slate-400">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">Heart Rate Trend</span>
          </div>
          {latest && <span className="text-cyan-400 font-bold tabular-nums">{latest.bpm} <span className="text-slate-400 font-normal text-xs">BPM</span></span>}
        </div>
        <canvas ref={bpmCanvasRef} width={800} height={220} className="w-full rounded-xl" />
      </div>

      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">SpO2 Trend</span>
          </div>
          {latest && <span className="text-emerald-400 font-bold tabular-nums">{latest.spo2}<span className="text-slate-400 font-normal text-xs">%</span></span>}
        </div>
        <canvas ref={spo2CanvasRef} width={800} height={220} className="w-full rounded-xl" />
      </div>

      {history.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Waiting for readings...</p>
        </div>
      )}
    </div>
  );
}
