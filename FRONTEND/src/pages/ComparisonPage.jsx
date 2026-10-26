import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, XCircle, CheckCircle2, FileText, Satellite, Gauge } from 'lucide-react';
import StatusMessage from '../components/StatusMessage';
import { api, useApi, VERDICT_STYLES, verdictLabel, fmtDate } from '../api';

const SOURCE_ICON = { satellite: Satellite, sensor: Gauge };

function Correctness({ correct }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold border ${
        correct
          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
      }`}
    >
      {correct ? 'Correct' : 'Incorrect'}
    </span>
  );
}

export default function ComparisonPage() {
  const dash = useApi(() => api.dashboard());
  const [caseId, setCaseId] = useState('C02');
  const detail = useApi(() => api.getCase(caseId), [caseId]);

  if (dash.loading || dash.error) {
    return (
      <div className="max-w-[1500px] mx-auto">
        <StatusMessage loading={dash.loading} error={dash.error} onRetry={dash.reload} />
      </div>
    );
  }

  const rows = dash.data.cases;
  const row = rows.find((r) => r.case_id === caseId) ?? rows[0];
  const issues = row.protected.findings.filter((f) => f.status !== 'PASS');
  const passed = row.protected.findings.filter((f) => f.status === 'PASS');
  const evidence = detail.loading || detail.error ? null : detail.data.evidence;
  const stances = Object.fromEntries((evidence ?? []).map((e) => [e.evidence_id, e.metadata?.event_status]));
  const flagged = new Set(issues.flatMap((f) => f.evidence_ids));

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Workflow Comparison</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Same claim, same evidence, two workflows. Expected verdicts were fixed before running.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
          <label htmlFor="cmp-case" className="font-semibold text-slate-800 dark:text-slate-200">Case</label>
          <select
            id="cmp-case"
            value={row.case_id}
            onChange={(e) => setCaseId(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-100"
          >
            {rows.map((r) => (
              <option key={r.case_id} value={r.case_id}>
                {r.case_id} — {r.scenario}
              </option>
            ))}
          </select>
          <span className="text-slate-500 dark:text-slate-400">Expected</span>
          <span className={`inline-flex px-2.5 py-0.5 rounded-lg font-bold border ${VERDICT_STYLES[row.expected_verdict]}`}>
            {verdictLabel(row.expected_verdict)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 dark:border-rose-950/60 p-6 shadow-2xs space-y-6 relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${row.baseline_correct ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Baseline Workflow</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Takes each source's stated stance at face value and votes</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Verdict</span>
              <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-extrabold border ${VERDICT_STYLES[row.baseline.verdict]}`}>
                {verdictLabel(row.baseline.verdict)}
              </span>
            </div>
            <Correctness correct={row.baseline_correct} />
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Reasoning</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{row.baseline.explanation}</p>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>No date, location, metadata, conflict or injection checks</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-950/60 p-6 shadow-2xs space-y-6 relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${row.protected_correct ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Protected Workflow</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Five evidence checks, then a rule-based verdict</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Verdict</span>
              <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-extrabold border ${VERDICT_STYLES[row.protected.verdict]}`}>
                {verdictLabel(row.protected.verdict)}
              </span>
            </div>
            <Correctness correct={row.protected_correct} />
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Checks ({passed.length} passed, {issues.length} flagged)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{row.protected.explanation}</p>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {issues.map((f, i) => (
                <li key={`i${i}`} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">{f.code}</strong> — {f.explanation}
                  </span>
                </li>
              ))}
              {passed.length > 0 && (
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{[...new Set(passed.map((f) => f.code))].join(', ')}</span>
                </li>
              )}
              {row.protected.findings.length === 0 && <li>No evidence, so no checks ran.</li>}
            </ul>
            {row.protected.next_evidence_needed.length > 0 && (
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
                <strong className="block mb-1">Evidence that would settle this</strong>
                {row.protected.next_evidence_needed.join(' ')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Evidence Used</h3>
        {!evidence ? (
          <StatusMessage loading={detail.loading} error={detail.error} onRetry={detail.reload} />
        ) : evidence.length === 0 ? (
          <StatusMessage empty="No evidence in this case. The right answer is to abstain, not to refute." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {evidence.map((e) => {
              const Icon = SOURCE_ICON[e.source_type] ?? FileText;
              const isFlagged = flagged.has(e.evidence_id);
              return (
                <div
                  key={e.evidence_id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3.5"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate font-mono">{e.evidence_id}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {e.source_type} • {e.acquired_at ? fmtDate(e.acquired_at) : 'no observation date'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {stances[e.evidence_id] && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                          {stances[e.evidence_id]}
                        </span>
                      )}
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isFlagged
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                        }`}
                      >
                        {isFlagged ? 'Flagged by checks' : 'Passed checks'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">All Cases</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Click a row to compare it above</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <th className="pb-3 font-semibold">Case</th>
                <th className="pb-3 font-semibold">Scenario</th>
                <th className="pb-3 font-semibold">Expected</th>
                <th className="pb-3 font-semibold">Baseline</th>
                <th className="pb-3 font-semibold">Protected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {rows.map((r) => (
                <tr
                  key={r.case_id}
                  onClick={() => setCaseId(r.case_id)}
                  className={`cursor-pointer transition-colors ${
                    r.case_id === row.case_id ? 'bg-blue-50/50 dark:bg-blue-950/30' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{r.case_id}</td>
                  <td className="py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">{r.scenario}</td>
                  {['expected_verdict', 'baseline', 'protected'].map((k) => {
                    const v = k === 'expected_verdict' ? r[k] : r[k].verdict;
                    const ok = k === 'expected_verdict' ? null : r[`${k}_correct`];
                    return (
                      <td key={k} className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold border ${VERDICT_STYLES[v]}`}>
                          {verdictLabel(v)}
                        </span>
                        {ok !== null && (
                          <span className={`ml-1.5 text-xs font-bold ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {ok ? '✓' : '✗'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
