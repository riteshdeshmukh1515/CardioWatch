import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Alert } from '../lib/database.types';
import { useVitals } from '../contexts/VitalsContext';
import { localDb, subscribeLocalDb } from '../lib/localDatabase';

export function AlertsView() {
  const { user } = useAuth();
  const { current } = useVitals();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(() => {
    if (!user) return;
    setAlerts(localDb.listAlerts(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAlerts();
    return subscribeLocalDb(fetchAlerts);
  }, [fetchAlerts]);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(fetchAlerts, 3000);
    return () => clearTimeout(t);
  }, [current, fetchAlerts]);

  const acknowledge = async (id: string) => {
    localDb.acknowledgeAlert(id);
    setAlerts(a => a.map(x => x.id === id ? { ...x, acknowledged: true } : x));
  };

  const unacked = alerts.filter(a => !a.acknowledged);
  const critical = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Alerts</h2>
          <p className="text-slate-400 text-sm mt-0.5">{unacked.length} unacknowledged</p>
        </div>
        {unacked.length > 0 && (
          <span className="flex items-center gap-1.5 bg-red-500/15 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            {unacked.length} Active
          </span>
        )}
      </div>

      {critical.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm mb-1">Critical Alert Active</p>
            <p className="text-red-400/80 text-sm">{critical[0].message}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BellOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No alerts recorded</p>
          <p className="text-xs mt-1">Alerts appear when vitals go outside safe ranges</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${alert.acknowledged ? 'bg-slate-900/30 border-slate-700/30 opacity-60' : alert.severity === 'critical' ? 'bg-red-500/8 border-red-500/30' : 'bg-amber-500/8 border-amber-500/30'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
                <AlertTriangle className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${alert.acknowledged ? 'text-slate-400' : 'text-white'}`}>{alert.message}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {alert.bpm && <span className="text-xs text-slate-500">BPM: {alert.bpm}</span>}
                  {alert.spo2 && <span className="text-xs text-slate-500">SpO2: {alert.spo2}%</span>}
                  <span className="text-xs text-slate-600">{new Date(alert.created_at).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${alert.severity === 'critical' ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                  {alert.severity}
                </span>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="w-7 h-7 bg-slate-700/60 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 rounded-lg flex items-center justify-center transition-all"
                    title="Acknowledge"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                {alert.acknowledged && <Bell className="w-4 h-4 text-slate-600" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
