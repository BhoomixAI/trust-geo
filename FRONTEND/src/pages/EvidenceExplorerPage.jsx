import React, { useState } from 'react';
import { FileText, Download, Satellite, Gauge, Users, Code2, MapPin, Calendar } from 'lucide-react';
import StatusMessage from '../components/StatusMessage';
import { api, useApi, fmtDate } from '../api';

const TABS = [
  { label: 'All Evidence', match: () => true },
  { label: 'Satellite Imagery', match: (e) => e.source_type === 'satellite' },
  { label: 'Reports', match: (e) => e.source_type === 'news_report' || e.source_type === 'field_report' },
  { label: 'Sensors', match: (e) => e.source_type === 'sensor' },
];

const ICONS = { satellite: Satellite, sensor: Gauge, field_report: Users, news_report: FileText };

const STANCE_STYLE = {
  supports: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  contradicts: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
};

function stanceOf(e) {
  const s = e.metadata?.event_status;
  if (s === 'flooding_observed') return 'supports';
  if (s === 'no_flooding_observed') return 'contradicts';
  const { reading, flood_threshold: t } = e.metadata ?? {};
  if (typeof reading === 'number' && typeof t === 'number') return reading > t ? 'supports' : 'contradicts';
  return null;
}

function Field({ label, value, missing }) {
  return (
    <>
      <span className="text-slate-400 dark:text-slate-500">{label}</span>
      <span className={`font-semibold break-all ${missing ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
        {value}
      </span>
    </>
  );
}

function downloadJson(data, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EvidenceExplorerPage() {
  const { data, error, loading, reload } = useApi(() => api.listEvidence());
  const [activeTab, setActiveTab] = useState('All Evidence');
  const [selectedId, setSelectedId] = useState('ev-c02-sat');
  const [showRaw, setShowRaw] = useState(false);

  if (loading || error) {
    return (
      <div className="max-w-[1500px] mx-auto">
        <StatusMessage loading={loading} error={error} onRetry={reload} />
      </div>
    );
  }

  const tab = TABS.find((t) => t.label === activeTab);
  const filtered = data.filter(tab.match);
  const selected = data.find((e) => e.evidence_id === selectedId) ?? data[0];
  const SelIcon = ICONS[selected.source_type] ?? FileText;
  const stance = stanceOf(selected);

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Evidence Explorer</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Every evidence item in the benchmark, with its dates, footprint, metadata and the cases that use it.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            S
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Claim under test: Did flooding occur in Area A on 20 October 2026?
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> AOI: <strong className="text-slate-800 dark:text-slate-200">Area A [77.15, 28.55, 77.25, 28.65]</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Time: <strong className="text-slate-800 dark:text-slate-200">20 Oct 2026 (UTC)</strong>
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            Synthetic fixtures
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => setActiveTab(t.label)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === t.label
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.label} ({data.filter(t.match).length})
            </button>
          ))}
        </div>
        <button
          onClick={() => downloadJson(filtered, 'trust-geo-evidence.json')}
          className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-3">
          {filtered.map((item) => {
            const isSelected = selected.evidence_id === item.evidence_id;
            const Icon = ICONS[item.source_type] ?? FileText;
            const s = stanceOf(item);
            return (
              <div
                key={item.evidence_id}
                onClick={() => {
                  setSelectedId(item.evidence_id);
                  setShowRaw(false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/40 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono truncate">{item.evidence_id}</h3>
                      {s && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${STANCE_STYLE[s]}`}>{s}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.source_type} • {item.acquired_at ? fmtDate(item.acquired_at) : <span className="text-rose-600 dark:text-rose-400 font-semibold">no observation date</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {item.case_ids.length ? `Used in ${item.case_ids.join(', ')}` : 'Not used in a benchmark case'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5 lg:sticky lg:top-20">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <SelIcon className="w-9 h-9" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono break-all">{selected.evidence_id}</h2>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs pt-1">
                <Field label="Source type" value={selected.source_type} />
                <Field label="Observed" value={selected.acquired_at ? fmtDate(selected.acquired_at) : 'missing'} missing={!selected.acquired_at} />
                <Field label="Published" value={selected.published_at ? fmtDate(selected.published_at) : 'none'} />
                <Field label="Footprint" value={selected.bbox ? `[${selected.bbox.join(', ')}]` : 'missing'} missing={!selected.bbox} />
                <Field label="Stated stance" value={stance ?? 'none'} />
                <Field label="Used in" value={selected.case_ids.join(', ') || '—'} />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Content</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {selected.content || '—'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Metadata</h4>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {Object.keys(selected.metadata ?? {}).length === 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">none</span>
                ) : (
                  Object.entries(selected.metadata).map(([k, v]) => (
                    <Field key={k} label={k} value={v === '' ? '(empty)' : String(v)} missing={v === '' || v == null} />
                  ))
                )}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Provenance</h4>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {Object.keys(selected.provenance ?? {}).length === 0 ? (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">missing</span>
                ) : (
                  Object.entries(selected.provenance).map(([k, v]) => <Field key={k} label={k} value={String(v)} />)
                )}
              </div>
            </div>
          </div>

          {showRaw && (
            <pre className="text-[11px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 overflow-x-auto text-slate-700 dark:text-slate-300">
              {JSON.stringify(selected, null, 2)}
            </pre>
          )}

          <button
            onClick={() => setShowRaw((v) => !v)}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Code2 className="w-4 h-4" /> {showRaw ? 'Hide raw record' : 'View raw record (JSON)'}
          </button>
        </div>
      </div>
    </div>
  );
}
