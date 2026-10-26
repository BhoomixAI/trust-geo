import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatusMessage from '../components/StatusMessage';
import { api, useApi, formatMetric, verdictLabel, VERDICT_COLORS } from '../api';

// Metric cards: key, title, and whether a higher value is better.
const CARDS = [
  { key: 'verdict_accuracy', title: 'Verdict Accuracy', higherIsBetter: true },
  { key: 'failure_recall', title: 'Failure Recall', higherIsBetter: true },
  { key: 'false_alarm_rate', title: 'False Alarm Rate', higherIsBetter: false },
  { key: 'unsafe_refutations', title: 'Unsafe Refutations', higherIsBetter: false },
];

const CHART_METRICS = [
  { key: 'verdict_accuracy', label: 'Accuracy' },
  { key: 'failure_recall', label: 'Traps caught' },
  { key: 'appropriate_abstention', label: 'Correct abstain' },
  { key: 'unsupported_confirmations', label: 'Unearned SUPPORTED' },
  { key: 'unsafe_refutations', label: 'Unsafe REFUTED' },
];

const pct = (m) => (m?.value == null ? 0 : Math.round(m.value * 100));

const CHECK_LABELS = {
  temporal_relevance: 'Time check',
  spatial_relevance: 'Place check',
  metadata_completeness: 'Metadata check',
  contradiction_detection: 'Contradiction check',
  prompt_injection_safety: 'Injection check',
};

const AI_CARDS = [
  { key: 'ai_verdict_accuracy', title: 'AI correct verdicts', good: 'high' },
  { key: 'ai_unsafe_refutations', title: 'AI unsafe REFUTED', good: 'low' },
  { key: 'abstain_mismatches', title: 'AI picked the other "cannot tell" verdict', good: 'low' },
  { key: 'ai_unearned_supports', title: 'AI unearned SUPPORTED', good: 'low' },
  { key: 'ai_followed_injection', title: 'AI obeyed injected text', good: 'low' },
  { key: 'unsafe_answers_caught', title: 'Unsafe AI answers caught by TRUST-GEO', good: 'high' },
];

// The real AI's recorded answers on all cases, and how TRUST-GEO's audit graded them.
function AiBenchmarkPanel() {
  const ai = useApi(() => api.runAiBenchmark(false));
  const answered = ai.data?.metrics.answered.numerator ?? 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Real AI under test</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A real AI model answered every case on its own; TRUST-GEO then checked each answer against the evidence.
          </p>
        </div>
        {ai.data && answered > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60">
            {ai.data.cases.find((r) => r.answer.model)?.answer.model} · recorded answers
          </span>
        )}
      </div>
      {ai.loading || ai.error ? (
        <StatusMessage loading={ai.loading} error={ai.error} onRetry={ai.reload} />
      ) : answered === 0 ? (
        <StatusMessage empty="No AI answers recorded yet. Add an AI API key and run: python -m backend.record_ai" />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {AI_CARDS.map((card) => {
            const m = ai.data.metrics[card.key];
            return (
              <div key={card.key} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{card.title}</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {m.denominator ? `${m.numerator}/${m.denominator}` : 'n/a'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BenchmarkPage() {
  const dash = useApi(() => api.dashboard());
  const ablation = useApi(() => api.ablation());

  if (dash.loading || dash.error) {
    return (
      <div className="max-w-[1500px] mx-auto">
        <StatusMessage loading={dash.loading} error={dash.error} onRetry={dash.reload} />
      </div>
    );
  }

  const { metrics, cases, failure_modes: modes } = dash.data;
  const prot = metrics.protected;
  const base = metrics.baseline;

  const chartData = CHART_METRICS.map((m) => ({
    name: m.label,
    Baseline: pct(base[m.key]),
    Protected: pct(prot[m.key]),
  }));

  const verdictCounts = cases.reduce((acc, c) => {
    acc[c.protected.verdict] = (acc[c.protected.verdict] ?? 0) + 1;
    return acc;
  }, {});
  const distributionData = Object.entries(verdictCounts).map(([verdict, value]) => ({
    name: verdictLabel(verdict),
    value,
    color: VERDICT_COLORS[verdict],
  }));

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Benchmark Metrics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Baseline vs protected workflow on {cases.length} labelled cases, identical inputs. Labels were frozen before running.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
          Synthetic Demo Data
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((card) => {
          const p = prot[card.key];
          const b = base[card.key];
          const better = card.higherIsBetter ? p.value >= b.value : p.value <= b.value;
          return (
            <div
              key={card.key}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
            >
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {p.numerator}/{p.denominator}
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-2">{pct(p)}%</span>
              </div>
              <div className="text-xs font-medium">
                <span className={better ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                  Protected
                </span>
                <span className="text-slate-400 dark:text-slate-500 pl-1">• baseline {formatMetric(b)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <AiBenchmarkPanel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Baseline vs Protected</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Percent of the relevant cases. Higher is better for the first three, lower is better for the last two.
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.3} />
                <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} interval={0} />
                <YAxis domain={[0, 100]} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} unit="%" />
                <Tooltip
                  formatter={(v) => `${v}%`}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid #334155', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Baseline" fill="#94A3B8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Protected" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Protected Verdicts</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">How the protected workflow answered each case</p>
          </div>

          <div className="relative h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                  {distributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{cases.length}</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Total Cases</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {item.value}{' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    ({Math.round((item.value / cases.length) * 100)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Scenario Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modes.map((sc) => {
              const n = sc.case_ids.length;
              return (
                <div key={sc.tag} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{sc.label}</span>
                  <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{sc.case_ids.join(', ')}</div>
                  <div className="text-xs font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400">Protected {sc.caught_by_protected}/{n}</span>
                    <span className="text-slate-400 dark:text-slate-500"> • baseline {sc.caught_by_baseline}/{n}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Ablation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cases that go wrong when one check is switched off</p>
          </div>
          {ablation.loading || ablation.error ? (
            <StatusMessage loading={ablation.loading} error={ablation.error} onRetry={ablation.reload} />
          ) : (
            <div className="space-y-3">
              {ablation.data.checks.map((row) => {
                const broken = row.verdict_changes.filter((c) => c.with_check === c.expected).map((c) => c.case_id);
                const width = Math.round((row.cases_broken / cases.length) * 100);
                return (
                  <div key={row.check_name}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <span>{CHECK_LABELS[row.check_name] ?? row.check_name}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {row.cases_broken} broken
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-rose-500" style={{ width: `${width}%` }} />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                      {broken.length ? broken.join(', ') : 'covered by other checks'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">{dash.data.notice}</p>
    </div>
  );
}
