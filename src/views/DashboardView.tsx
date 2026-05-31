import { useState } from 'react';
import {
  Heart,
  Waves,
  Activity,
  Power,
  AlertTriangle,
  Wifi,
  WifiOff,
  Save
} from 'lucide-react';

import { useVitals } from '../contexts/VitalsContext';
import { VitalCard } from '../components/VitalCard';
import { ECGLine } from '../components/ECGLine';
import { useAuth } from '../contexts/AuthContext';
import { getEspUrl, setEspUrl } from '../lib/esp8266';

export function DashboardView() {

  const {
    current,
    history,
    espStatus,
    isMonitoring,
    toggleMonitoring,
    refreshEspStatus
  } = useVitals();

  const { role } = useAuth();

  const [espUrlInput, setEspUrlInput] = useState(getEspUrl());

  // ==========================
  // LIVE CURRENT READING
  // ==========================
  const displayedCurrent = current ?? history[0] ?? null;

  const showingLiveReading = Boolean(current);

  // ==========================
  // STATS
  // ==========================
  const stats =
    history.length > 0
      ? {
          avgBpm: Math.round(
            history.reduce((s, r) => s + r.bpm, 0) /
              history.length
          ),

          minBpm: Math.min(
            ...history.map((r) => r.bpm)
          ),

          maxBpm: Math.max(
            ...history.map((r) => r.bpm)
          ),

          avgSpo2: (
            history.reduce((s, r) => s + r.spo2, 0) /
            history.length
          ).toFixed(1),
        }
      : null;

  // ==========================
  // HEART RATE STATUS
  // ==========================
  const getHeartRateStatus = (bpm: number) => {

    if (bpm < 60) {
      return "warning";
    }

    if (bpm <= 100) {
      return "normal";
    }

    if (bpm <= 120) {
      return "warning";
    }

    return "critical";
  };

  // ==========================
  // HEART RATE MESSAGE
  // ==========================
  const getHeartRateMessage = (bpm: number) => {

    if (bpm < 60) {
      return "Low Heart Rate";
    }

    if (bpm <= 100) {
      return "Normal Heart Rate";
    }

    if (bpm <= 120) {
      return "High Heart Rate";
    }

    return "Critical Heart Rate";
  };

  // ==========================
  // SPO2 STATUS
  // ==========================
  const getSpo2Status = (spo2: number) => {

    if (spo2 >= 95) {
      return "normal";
    }

    if (spo2 >= 90) {
      return "warning";
    }

    return "critical";
  };

  // ==========================
  // SPO2 MESSAGE
  // ==========================
  const getSpo2Message = (spo2: number) => {

    if (spo2 >= 95) {
      return "Normal Oxygen Level";
    }

    if (spo2 >= 90) {
      return "Low Oxygen Level";
    }

    return "Critical Oxygen Level";
  };

  return (

    <div className="space-y-6">

      {/* ==========================
          HEADER
      ========================== */}
      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold text-white">
            Dashboard
          </h2>

          <p className="text-slate-400 text-sm mt-0.5">
            {role === 'caretaker'
              ? 'Caretaker monitoring view'
              : 'Real-time vital monitoring'}
          </p>
        </div>

        <button
          onClick={toggleMonitoring}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            isMonitoring
              ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
        >
          <Power className="w-4 h-4" />

          {isMonitoring
            ? 'Stop Monitoring'
            : 'Start Monitoring'}
        </button>
      </div>

      {/* ==========================
          ESP STATUS
      ========================== */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4">

        <div className="flex flex-col lg:flex-row lg:items-center gap-3">

          <div className="flex items-center gap-3 min-w-0 flex-1">

            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                espStatus.connected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              {espStatus.connected
                ? <Wifi className="w-4 h-4" />
                : <WifiOff className="w-4 h-4" />}
            </div>

            <div className="min-w-0">

              <p className="text-white text-sm font-semibold">
                {espStatus.connected
                  ? 'ESP8266 connected'
                  : 'ESP8266 offline'}
              </p>

              <p className="text-slate-400 text-xs truncate">

                {espStatus.connected
                  ? `${espStatus.sensorMessage ?? 'Live MAX30102 data'} from ${espStatus.url}`
                  : `${espStatus.error ?? 'No real sensor data received'} (${espStatus.url})`}
              </p>

            </div>
          </div>

          {/* URL INPUT */}
          <div className="flex gap-2 lg:w-80">

            <input
              value={espUrlInput}
              onChange={(e) =>
                setEspUrlInput(e.target.value)
              }
              placeholder="http://192.168.1.50"
              className="min-w-0 flex-1 bg-slate-800/60 border border-slate-600/50 text-white placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/60"
            />

            <button
              onClick={() => {
                setEspUrl(espUrlInput);
                refreshEspStatus();
              }}
              className="w-10 h-10 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 rounded-xl flex items-center justify-center transition"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==========================
          MONITORING OFF
      ========================== */}
      {!isMonitoring && (

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex items-center gap-3">

          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />

          <p className="text-amber-300 text-sm">
            Monitoring paused.
            Click Start Monitoring to continue.
          </p>

        </div>
      )}

      {/* ==========================
          LIVE CARDS
      ========================== */}
      {displayedCurrent && (

        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* HEART RATE */}
            <VitalCard
              label="Heart Rate"
              value={displayedCurrent.bpm}
              unit="BPM"
              status={getHeartRateStatus(
                displayedCurrent.bpm
              )}
              icon={<Heart className="w-5 h-5" />}
              sub={getHeartRateMessage(
                displayedCurrent.bpm
              )}
            />

            {/* SPO2 */}
            <VitalCard
              label="Oxygen Saturation"
              value={displayedCurrent.spo2}
              unit="%"
              status={getSpo2Status(
                displayedCurrent.spo2
              )}
              icon={<Waves className="w-5 h-5" />}
              sub={getSpo2Message(
                displayedCurrent.spo2
              )}
            />
          </div>

          {/* ECG */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">

            <div className="flex items-center gap-2 mb-3">

              <Activity className="w-4 h-4 text-cyan-400" />

              <span className="text-sm font-medium text-slate-300">
                Live ECG Waveform
              </span>

              {isMonitoring &&
                espStatus.connected &&
                showingLiveReading && (

                <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">

                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />

                  Live

                </span>
              )}
            </div>

            <ECGLine
              bpm={displayedCurrent.bpm}
              status={getHeartRateStatus(
                displayedCurrent.bpm
              )}
            />
          </div>
        </>
      )}

      {/* ==========================
          NO DATA
      ========================== */}
      {!displayedCurrent && (

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-12 text-center">

          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />

          <p className="text-slate-400">
            Waiting for real ESP8266/MAX30102 sensor data...
          </p>

        </div>
      )}

      {/* ==========================
          STATS
      ========================== */}
      {stats && (

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {[
            {
              label: 'Avg BPM',
              value: stats.avgBpm,
              unit: 'bpm',
            },

            {
              label: 'Min BPM',
              value: stats.minBpm,
              unit: 'bpm',
            },

            {
              label: 'Max BPM',
              value: stats.maxBpm,
              unit: 'bpm',
            },

            {
              label: 'Avg SpO2',
              value: stats.avgSpo2,
              unit: '%',
            },

          ].map((s) => (

            <div
              key={s.label}
              className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 text-center"
            >

              <p className="text-slate-500 text-xs mb-1">
                {s.label}
              </p>

              <p className="text-white font-bold text-xl tabular-nums">

                {s.value}

                <span className="text-slate-500 text-sm ml-1">
                  {s.unit}
                </span>

              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}