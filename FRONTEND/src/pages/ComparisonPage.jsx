import React from 'react';
import { AlertCircle, ShieldCheck, XCircle, CheckCircle2, FileText } from 'lucide-react';

const baselineIssues = [
  'Used 12 Oct image as direct proof',
  'Ignored publication date vs event date',
  'Did not detect conflicting reports',
];

const protectedChecks = [
  'Temporal validation (caught mismatch)',
  'Spatial validation (within AOI)',
  'Source conflict detection (E2 vs E3)',
  'Sufficient evidence check (partial)',
];

const evidenceUsed = [
  {
    id: 'E1',
    title: 'E1 Satellite image',
    date: '12 Oct 2026',
    status: 'Temporal mismatch',
    statusStyle: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    isImage: true,
    imgUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'E2',
    title: 'E2 News Report',
    date: '20 Oct 2026',
    status: 'Supports',
    statusStyle: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    isImage: false,
  },
  {
    id: 'E3',
    title: 'E3 News Report',
    date: '20 Oct 2026',
    status: 'Contradicts',
    statusStyle: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    isImage: false,
  },
];

export default function ComparisonPage() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Workflow Comparison</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare baseline vs protected workflows on the same claim.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Claim: <span className="text-blue-600 dark:text-blue-400">Flooding in Area A on 20 October</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            Status: Completed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 dark:border-rose-950/60 p-6 shadow-2xs space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Baseline Workflow</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct LLM answer from retrieved data</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Verdict
              </span>
              <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">Flooding occurred</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
              Incorrect
            </span>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Key Issues</h3>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {baselineIssues.map((issue) => (
                <li key={issue} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-100 dark:border-emerald-950/60 p-6 shadow-2xs space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Protected Workflow</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Evidence checks + policy validation</p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Verdict
              </span>
              <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">INSUFFICIENT EVIDENCE</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Correct
            </span>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Checks Passed</h3>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {protectedChecks.map((check) => (
                <li key={check} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Evidence Used</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {evidenceUsed.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center gap-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {item.isImage ? (
                <img
                  src={item.imgUrl}
                  alt={item.title}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{item.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.date}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${item.statusStyle}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}