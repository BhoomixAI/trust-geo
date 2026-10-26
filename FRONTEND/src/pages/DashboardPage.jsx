import React, { useState } from 'react';
import { Play, RotateCcw, Loader2 } from 'lucide-react';
import StatCards from '../components/StatCards';
import RecentClaims from '../components/RecentClaims';
import ActiveTestArea from '../components/ActiveTestArea';
import VerificationLog from '../components/VerificationLog';
import FailureBreakdown from '../components/FailureBreakdown';
import StatusMessage from '../components/StatusMessage';
import { api, useApi } from '../api';

export default function DashboardPage() {
  const { data, error, loading, reload } = useApi(() => api.dashboard());
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);

  const act = async (name, fn) => {
    setBusy(name);
    setActionError(null);
    try {
      await fn();
      reload();
    } catch (e) {
      setActionError(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Greeting Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">TRUST-GEO Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Test geospatial AI claims, inspect evidence, and compare workflows for reliable results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
            Prototype • Synthetic Demo Data
          </span>
          <button
            onClick={() => act('reset', api.reset)}
            disabled={busy !== null}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy === 'reset' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reset demo
          </button>
          <button
            onClick={() => act('benchmark', api.runBenchmark)}
            disabled={busy !== null}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {busy === 'benchmark' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run benchmark
          </button>
        </div>
      </div>

      {actionError && <StatusMessage error={actionError} />}

      {loading && !data ? (
        <StatusMessage loading />
      ) : error ? (
        <StatusMessage error={error} onRetry={reload} />
      ) : (
        <>
          {/* Metric Stat Cards Row */}
          <StatCards stats={data.stats} />

          {/* Grid Row 2: Recent Claims Table & Active Map Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentClaims runs={data.recent_runs} aoi={data.aoi} />
            </div>
            <div>
              <ActiveTestArea aoi={data.aoi} />
            </div>
          </div>

          {/* Grid Row 3: Audit Stream & Failure Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VerificationLog findings={data.recent_findings} />
            </div>
            <div>
              <FailureBreakdown modes={data.failure_modes} totalCases={data.stats.cases_tested} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
