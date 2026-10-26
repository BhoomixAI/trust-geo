// Client for the TRUST-GEO Python backend (backend/server.py).
// In dev, Vite proxies /api to the backend (see vite.config.js).
import { useCallback, useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the backend. Start it with: python -m backend.server');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('GET', '/health'),
  dashboard: () => request('GET', '/dashboard'),
  listCases: () => request('GET', '/cases'),
  getCase: (caseId) => request('GET', `/cases/${encodeURIComponent(caseId)}`),
  runCase: (caseId, mode) => request('POST', `/cases/${encodeURIComponent(caseId)}/run`, { mode }),
  runBenchmark: () => request('POST', '/benchmark'),
  ablation: () => request('GET', '/ablation'),
  acquisitions: (bbox, date) =>
    request('GET', `/acquisitions?bbox=${bbox.join(',')}&date=${encodeURIComponent(date)}`),
  listRuns: (caseId, limit = 100) =>
    request('GET', `/runs?limit=${limit}${caseId ? `&case_id=${encodeURIComponent(caseId)}` : ''}`),
  exportRun: (runId) => request('GET', `/runs/${encodeURIComponent(runId)}/export`),
  reset: () => request('POST', '/reset'),
};

// Load data on mount (and when deps change). Returns { data, error, loading, reload }.
// While reloading, `data` keeps the previous result so screens do not flash empty.
export function useApi(fn, deps = []) {
  const [tick, setTick] = useState(0);
  const key = JSON.stringify([...deps, tick]);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    fn()
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((error) => !cancelled && setState({ key, data: null, error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = state.key !== key;
  return { data: state.data, error: loading ? null : state.error, loading, reload };
}

export const VERDICT_STYLES = {
  SUPPORTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUTED: 'bg-rose-50 text-rose-700 border-rose-200',
  INSUFFICIENT_EVIDENCE: 'bg-amber-50 text-amber-700 border-amber-200',
  NEEDS_REVIEW: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const verdictLabel = (v) => (v ? v.replace(/_/g, ' ') : '—');

export function formatMetric(m) {
  if (!m) return '—';
  const pct = m.value === null ? 'n/a' : `${Math.round(m.value * 100)}%`;
  return `${m.numerator}/${m.denominator} (${pct})`;
}

export function timeAgo(iso) {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function formatCoords([lon, lat]) {
  return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`;
}
