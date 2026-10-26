import React, { useState } from 'react';
import { Info, Play, Loader2, CheckCircle2, XCircle, Download, FileText } from 'lucide-react';
import StatusMessage from '../components/StatusMessage';
import { api, useApi, VERDICT_STYLES, verdictLabel } from '../api';

const STATUS_DOT = {
  PASS: 'bg-emerald-500',
  WARN: 'bg-amber-500',
  FAIL: 'bg-rose-500',
  REVIEW: 'bg-indigo-500',
};

const fmtDate = (iso) => (iso ? iso.slice(0, 16).replace('T', ' ') + ' UTC' : 'unknown');

function VerdictBadge({ verdict, large }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg font-bold border ${VERDICT_STYLES[verdict]} ${
        large ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-[11px]'
      }`}
    >
      {verdictLabel(verdict)}
    </span>
  );
}

async function downloadAudit(runId) {
  const record = await api.exportRun(runId);
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trust-geo-audit-${record.result.case_id}-${record.result.mode}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function ResultCard({ title, result, expected }) {
  const correct = result.verdict === expected;
  const issues = result.findings.filter((f) => f.status !== 'PASS');
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 text-base">{title}</h2>
        <span className="text-[11px] font-mono text-slate-400">{result.elapsed_ms.toFixed(2)} ms</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <VerdictBadge verdict={result.verdict} large />
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${
            correct ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {correct ? 'Matches expected' : 'Does not match expected'}
        </span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">{result.explanation}</p>

      {result.mode === 'protected' && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Checks ({result.findings.length - issues.length} passed, {issues.length} flagged)
          </h3>
          {result.findings.length === 0 ? (
            <p className="text-xs text-slate-500">No checks ran (no evidence).</p>
          ) : (
            <ul className="space-y-1.5">
              {result.findings.map((f, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[f.status]}`} />
                  <div>
                    <span className="font-bold text-slate-800">{f.code}</span>
                    <span className="text-slate-400"> • {f.evidence_ids.join(', ') || '—'}</span>
                    {f.status !== 'PASS' && <p className="text-slate-500">{f.explanation}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result.mode === 'baseline' && (
        <p className="text-xs text-slate-500">
          Baseline runs no checks: it takes each evidence item's stated stance at face value and votes.
        </p>
      )}

      {result.next_evidence_needed.length > 0 && (
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
          <h3 className="text-xs font-bold text-blue-900 mb-1">Evidence that would settle this</h3>
          <ul className="list-disc pl-4 space-y-0.5 text-xs text-blue-800">
            {result.next_evidence_needed.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => downloadAudit(result.run_id)}
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <Download className="w-3.5 h-3.5" /> Export audit record (JSON)
      </button>
    </div>
  );
}

export default function SubmitClaimPage() {
  const cases = useApi(() => api.listCases());
  const [caseId, setCaseId] = useState('C02');
  const detail = useApi(() => api.getCase(caseId), [caseId]);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  const chooseCase = (id) => {
    setCaseId(id);
    setResults(null);
    setRunError(null);
  };

  const run = async () => {
    setRunning(true);
    setRunError(null);
    try {
      const [baseline, protectedRun] = await Promise.all([
        api.runCase(caseId, 'baseline'),
        api.runCase(caseId, 'protected'),
      ]);
      setResults({ baseline, protected: protectedRun });
    } catch (e) {
      setRunError(e);
    } finally {
      setRunning(false);
    }
  };

  const c = detail.loading ? null : detail.data;
  const stepDone = [true, Boolean(c), Boolean(results), Boolean(results)];
  const steps = ['Choose Case', 'Review Evidence', 'Run Both Workflows', 'Compare Verdicts'];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Test a Claim</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pick a benchmark claim, inspect its evidence, and run the baseline and protected workflows on identical inputs.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between max-w-4xl mx-auto px-4">
          {steps.map((name, idx) => (
            <React.Fragment key={name}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    stepDone[idx] ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`text-sm font-semibold ${stepDone[idx] ? 'text-slate-900' : 'text-slate-400'}`}>
                  {name}
                </span>
              </div>
              {idx < steps.length - 1 && <div className="flex-1 h-0.5 bg-slate-100 mx-4 max-w-[80px]" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Claim */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base">1. Claim</h2>

            {cases.loading || cases.error ? (
              <StatusMessage loading={cases.loading} error={cases.error} onRetry={cases.reload} />
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Benchmark case</label>
                <select
                  value={caseId}
                  onChange={(e) => chooseCase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {cases.data.map((cs) => (
                    <option key={cs.case_id} value={cs.case_id}>
                      {cs.case_id} — {cs.scenario}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {detail.loading || detail.error ? (
              <StatusMessage loading={detail.loading} error={detail.error} onRetry={detail.reload} />
            ) : (
              <>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800">
                  {c.claim.claim_text}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-500">Event type</p>
                    <p className="text-slate-800 capitalize">{c.claim.event_type}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Window start</p>
                    <p className="text-slate-800">{fmtDate(c.claim.claim_start)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Window end</p>
                    <p className="text-slate-800">{fmtDate(c.claim.claim_end)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-500">Scenario tags</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {c.scenario_tags.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Card 2: Evidence ledger */}
          {c && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-base">2. Evidence ({c.evidence.length})</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  Synthetic fixtures
                </span>
              </div>
              {c.evidence.length === 0 ? (
                <StatusMessage empty="No evidence in this bundle. A careful system should abstain, not refute." />
              ) : (
                <div className="space-y-3">
                  {c.evidence.map((e) => (
                    <div key={e.evidence_id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-900 font-mono">{e.evidence_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600">{e.source_type}</span>
                        {e.metadata?.event_status && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono">
                            stance: {e.metadata.event_status}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-500">Acquired: </span>
                          <span className={e.acquired_at ? 'text-slate-800' : 'text-rose-600 font-semibold'}>
                            {fmtDate(e.acquired_at)}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Published: </span>
                          <span className="text-slate-800">{fmtDate(e.published_at)}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Footprint: </span>
                          <span className={e.bbox ? 'text-slate-800 font-mono' : 'text-rose-600 font-semibold'}>
                            {e.bbox ? `[${e.bbox.join(', ')}]` : 'none'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{e.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: expected label */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Expected verdict (frozen label)</h3>
          {c ? (
            <>
              <VerdictBadge verdict={c.expected_verdict} large />
              <p className="text-xs text-slate-600 leading-relaxed">{c.reason}</p>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">Area of interest</p>
                <p className="text-[11px] font-mono text-slate-500">
                  {c.claim.area_of_interest.type} • {JSON.stringify(c.claim.area_of_interest.coordinates[0][0])} …
                </p>
              </div>
            </>
          ) : (
            <StatusMessage loading={detail.loading} />
          )}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Synthetic case. The label was fixed before the workflows were run.
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        {runError && <div className="flex-1"><StatusMessage error={runError} /></div>}
        <button
          type="button"
          onClick={run}
          disabled={!c || running}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Run baseline vs protected
        </button>
      </div>

      {/* Results: side by side */}
      {results && c && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResultCard title="Baseline workflow" result={results.baseline} expected={c.expected_verdict} />
          <ResultCard title="Protected workflow" result={results.protected} expected={c.expected_verdict} />
        </div>
      )}
    </div>
  );
}
