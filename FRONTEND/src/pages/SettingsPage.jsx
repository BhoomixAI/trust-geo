import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, useApi } from '../api';

function InfoRow({ label, value, mono }) {
  return (
    <div className="py-2.5 flex justify-between items-center gap-4">
      <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className={`font-semibold text-slate-800 dark:text-slate-200 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const health = useApi(() => api.health());
  const cases = useApi(() => api.listCases());

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Display preferences and system information.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Display</h2>
            <div>
              <label htmlFor="settings-theme" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Theme
              </label>
              <select
                id="settings-theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Light">Light</option>
                <option value="Dark">Dark</option>
                <option value="System Default">System Default</option>
              </select>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">Applied immediately and remembered in this browser.</p>
            </div>
          </div>

          <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">System Information</h2>
              {health.data ? (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Backend connected
                </span>
              ) : health.error ? (
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Backend not reachable
                </span>
              ) : null}
            </div>

            <div className="divide-y divide-slate-200/80 dark:divide-slate-700/80 text-xs">
              <InfoRow label="Backend version" value={health.data?.version ?? '—'} mono />
              <InfoRow label="Benchmark cases" value={cases.data ? `${cases.data.length} (synthetic, labels frozen)` : '—'} />
              <InfoRow label="Evidence data" value="Synthetic fixtures" />
              <InfoRow label="Satellite lookup" value="Live Sentinel-2 metadata (Earth Search), cached offline" />
              <InfoRow label="Verdict engine" value="Rule-based Python policy, no LLM" />
              <InfoRow label="Audit database" value="SQLite (data/trust_geo.db)" mono />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
