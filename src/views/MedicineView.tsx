import { useEffect, useRef, useState, useCallback } from 'react';
import { Pill, Plus, Trash2, Bell, Clock, X, Check, CreditCard as Edit2, Volume2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Medicine } from '../lib/database.types';
import { localDb, subscribeLocalDb } from '../lib/localDatabase';
import { ringMedicineAlarm } from '../lib/esp8266';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ReminderPopup { medicine: Medicine }

function MedicineForm({ onSave, onClose, initial }: {
  onSave: () => void;
  onClose: () => void;
  initial?: Medicine | null;
}) {
  const { user } = useAuth();
  const [name, setName] = useState(initial?.name ?? '');
  const [dosage, setDosage] = useState(initial?.dosage ?? '');
  const [time, setTime] = useState(initial?.reminder_time?.slice(0, 5) ?? '08:00');
  const [days, setDays] = useState<string[]>(initial?.days ?? [...DAYS]);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const toggleDay = (d: string) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    localDb.upsertMedicine({
      id: initial?.id,
      user_id: user.id,
      name,
      dosage,
      reminder_time: time,
      days,
      notes,
      active: true,
    });
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">{initial ? 'Edit Medicine' : 'Add Medicine'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Medicine Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aspirin" className="w-full bg-slate-800/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/60 transition" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Dosage</label>
            <input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 100mg" className="w-full bg-slate-800/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/60 transition" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Reminder Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-slate-800/60 border border-slate-600/50 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/60 transition" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-2 block">Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <button key={d} onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${days.includes(d) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1.5 block">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Take after meal" className="w-full bg-slate-800/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/60 transition" />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-600/50 text-slate-400 hover:text-white text-sm transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-semibold text-sm transition flex items-center justify-center gap-2">
            {saving ? <span className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function MedicineView() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [popup, setPopup] = useState<ReminderPopup | null>(null);
  const [testingAlarm, setTestingAlarm] = useState(false);
  const notifiedRef = useRef(new Set<string>());

  const fetch = useCallback(async () => {
    if (!user) return;
    setMedicines(localDb.listMedicines(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
    return subscribeLocalDb(fetch);
  }, [fetch]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const today = dayNames[now.getDay()];
      medicines.forEach(m => {
        const key = `${m.id}-${hhmm}`;
        if (m.reminder_time.slice(0,5) === hhmm && m.days.includes(today) && !notifiedRef.current.has(key)) {
          notifiedRef.current.add(key);
          setPopup({ medicine: m });
        }
      });
    };
    const t = setInterval(checkReminders, 30000);
    return () => clearInterval(t);
  }, [medicines]);

  const deleteMed = async (id: string) => {
    localDb.deactivateMedicine(id);
    setMedicines(m => m.filter(x => x.id !== id));
  };

  const testAlarm = async () => {
    setTestingAlarm(true);
    try {
      await ringMedicineAlarm();
    } finally {
      setTestingAlarm(false);
    }
  };

  return (
    <div className="space-y-6">
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl animate-pulse-slow">
            <div className="w-16 h-16 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-cyan-400 font-bold text-lg mb-1">Medicine Reminder</p>
            <p className="text-white font-semibold text-xl mb-1">{popup.medicine.name}</p>
            {popup.medicine.dosage && <p className="text-slate-400 text-sm mb-1">{popup.medicine.dosage}</p>}
            {popup.medicine.notes && <p className="text-slate-500 text-sm mb-4">{popup.medicine.notes}</p>}
            <button onClick={() => setPopup(null)} className="mt-4 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl text-sm transition">
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Medicine Reminders</h2>
          <p className="text-slate-400 text-sm mt-0.5">{medicines.length} active reminders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={testAlarm}
            disabled={testingAlarm}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-50 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-medium transition"
          >
            <Volume2 className="w-4 h-4" />
            Test Alarm
          </button>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Add Reminder
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <MedicineForm
          initial={editing}
          onSave={() => { setShowForm(false); setEditing(null); fetch(); }}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" /></div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Pill className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No reminders set</p>
          <p className="text-xs mt-1">Add a medicine reminder to get started</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {medicines.map(m => (
            <div key={m.id} className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-cyan-500/15 border border-cyan-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Pill className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{m.name}</p>
                    {m.dosage && <p className="text-slate-400 text-xs mt-0.5">{m.dosage}</p>}
                    {m.notes && <p className="text-slate-500 text-xs mt-0.5 truncate">{m.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => { setEditing(m); setShowForm(true); }} className="w-7 h-7 bg-slate-700/60 hover:bg-blue-500/20 hover:text-blue-400 text-slate-400 rounded-lg flex items-center justify-center transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMed(m.id)} className="w-7 h-7 bg-slate-700/60 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg flex items-center justify-center transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-cyan-400/70" />
                  {m.reminder_time.slice(0,5)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Bell className="w-3.5 h-3.5 text-cyan-400/70" />
                  {m.days.join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
