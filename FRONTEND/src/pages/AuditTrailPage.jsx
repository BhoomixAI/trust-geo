import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import StatusMessage from '../components/StatusMessage';
import { api, useApi, VERDICT_STYLES, verdictLabel, downloadAudit } from '../api';

const VERDICTS = ['SUPPORTED', 'REFUTED', 'INSUFFICIENT_EVIDENCE', 'NEEDS_REVIEW'];

const selectClass =
  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs';

export default function AuditTrailPage() {
  const runs = useApi(() => api.listRuns(null, 500));
  const cases = useApi(() => api.listCases());
  const [mode, setMode] = useState('all');
  const [verdict, setVerdict] = useState('all');
  const [exportError, setExportError] = useState(null);

  const claimText = Object.fromEntries((cases.data ?? []).map((c) => [c.case_id, c.claim_text]));
  const rows = (runs.data ?? []).filter(
    (r) => (mode === 'all' || r.mode === mode) && (verdict === 'all' || r.verdict === verdict),
  );

  const exportOne = async (runId) => {
    setExportError(null);
    try {
      await downloadAudit(runId);
    } catch (e) {
      setExportError(e);
    }
  };

  const exportAll = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trust-geo-audit-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Trail</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Every stored run, newest first. Each record keeps the exact claim and evidence the workflow saw.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="audit-mode" className="sr-only">Workflow</label>
          <select id="audit-mode" value={mode} onChange={(e) => setMode(e.target.value)} className={selectClass}>
            <option value="all">All workflows</option>
            <option value="baseline">Baseline</option>
            <option value="protected">Protected</option>
          </select>
          <label htmlFor="audit-verdict" className="sr-only">Verdict</label>
          <select id="audit-verdict" value={verdict} onChange={(e) => setVerdict(e.target.value)} className={selectClass}>
            <option value="all">All verdicts</option>
            {VERDICTS.map((v) => (
              <option key={v} value={v}>{verdictLabel(v)}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {rows.length} of {runs.data?.length ?? 0} runs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runs.reload}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={exportAll}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Export list
          </button>
        </div>
      </div>

      {exportError && <StatusMessage error={exportError} />}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        {runs.loading || runs.error ? (
          <StatusMessage loading={runs.loading} error={runs.error} onRetry={runs.reload} />
        ) : rows.length === 0 ? (
          <StatusMessage empty="No runs yet. Run a case on Submit Claim, or click Run benchmark on the Dashboard." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <th className="pb-3.5 font-semibold">Time (UTC)</th>
                  <th className="pb-3.5 font-semibold">Case</th>
                  <th className="pb-3.5 font-semibold">Claim</th>
                  <th className="pb-3.5 font-semibold">Workflow</th>
                  <th className="pb-3.5 font-semibold">Verdict</th>
                  <th className="pb-3.5 font-semibold">Run time</th>
                  <th className="pb-3.5 font-semibold">Audit record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {rows.map((log) => (
                  <tr key={log.run_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 font-mono text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.timestamp.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{log.case_id}</td>
                    <td className="py-4 font-semibold text-slate-800 dark:text-slate-200 text-sm">{claimText[log.case_id] ?? '—'}</td>
                    <td className="py-4 text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{log.mode}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${VERDICT_STYLES[log.verdict]}`}>
                        {verdictLabel(log.verdict)}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{log.elapsed_ms.toFixed(2)} ms</td>
                    <td className="py-4">
                      <button
                        onClick={() => exportOne(log.run_id)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
