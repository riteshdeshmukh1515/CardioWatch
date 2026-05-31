import { Heart, LayoutDashboard, History, Bell, TrendingUp, Pill, Bot, LogOut, User, Stethoscope, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type NavSection = 'dashboard' | 'history' | 'alerts' | 'trends' | 'medicine' | 'ai';

const NAV_ITEMS: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'history', label: 'History', icon: History },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'medicine', label: 'Medicine', icon: Pill },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
];

interface Props {
  active: NavSection;
  onNav: (s: NavSection) => void;
}

export function Sidebar({ active, onNav }: Props) {
  const { user, role, setRole, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">CardioWatch</p>
            <p className="text-cyan-400 text-xs font-medium">Pro</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-4 border-b border-slate-700/50">
        <div className="flex gap-2">
          {(['patient', 'caretaker'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${role === r ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
            >
              {r === 'patient' ? <User className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { onNav(id); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active === id ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/40'}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.user_metadata?.name || user?.email?.split('@')[0]}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
        onClick={() => setOpen(v => !v)}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside className={`lg:hidden fixed top-0 left-0 z-40 h-full w-64 bg-[#0d1117] border-r border-slate-700/50 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {content}
      </aside>

      <aside className="hidden lg:flex flex-col w-64 bg-[#0d1117] border-r border-slate-700/50 h-screen sticky top-0">
        {content}
      </aside>
    </>
  );
}
