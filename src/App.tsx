import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VitalsProvider } from './contexts/VitalsContext';
import { AuthPage } from './components/AuthPage';
import { Sidebar, type NavSection } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { TrendsView } from './views/TrendsView';
import { HistoryView } from './views/HistoryView';
import { AlertsView } from './views/AlertsView';
import { MedicineView } from './views/MedicineView';
import { AIView } from './views/AIView';

function AppShell() {
  const { user, loading } = useAuth();
  const [section, setSection] = useState<NavSection>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="w-10 h-10 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Initializing CardioWatch Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const VIEW_MAP: Record<NavSection, React.ReactNode> = {
    dashboard: <DashboardView />,
    trends: <TrendsView />,
    history: <HistoryView />,
    alerts: <AlertsView />,
    medicine: <MedicineView />,
    ai: <AIView />,
  };

  return (
    <VitalsProvider>
      <div className="flex min-h-screen bg-[#080c14]">
        <Sidebar active={section} onNav={setSection} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-8 pt-16 lg:pt-8">
            {VIEW_MAP[section]}
          </div>
        </main>
      </div>
    </VitalsProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
