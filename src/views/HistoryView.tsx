import { Clock, Heart, Waves } from 'lucide-react';
import { useVitals } from '../contexts/VitalsContext';

const STATUS_BADGE = {
  normal: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function HistoryView() {
  const { history } = useVitals();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">History</h2>
        <p className="text-slate-400 text-sm mt-0.5">{history.length} readings stored (last 100)</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No readings recorded yet</p>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-slate-400 text-xs">
                <th className="text-left px-5 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-right px-4 py-3 font-medium">
                  <span className="flex items-center justify-end gap-1.5"><Heart className="w-3 h-3" />BPM</span>
                </th>
                <th className="text-right px-4 py-3 font-medium">
                  <span className="flex items-center justify-end gap-1.5"><Waves className="w-3 h-3" />SpO2</span>
                </th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-slate-600 tabular-nums">{history.length - i}</td>
                  <td className="px-4 py-3 text-slate-400 tabular-nums text-xs">
                    {r.timestamp.toLocaleTimeString()}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${r.status === 'critical' ? 'text-red-400' : r.status === 'warning' ? 'text-amber-400' : 'text-white'}`}>
                    {r.bpm}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${r.spo2 < 90 ? 'text-red-400' : r.spo2 < 95 ? 'text-amber-400' : 'text-white'}`}>
                    {r.spo2}%
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
