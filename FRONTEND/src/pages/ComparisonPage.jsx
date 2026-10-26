import React from 'react';
import { 
  AlertCircle, 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon,
  Clock,
  Layers
} from 'lucide-react';

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
    statusStyle: 'bg-rose-50 text-rose-700 border-rose-200',
    isImage: true,
    imgUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'E2',
    title: 'E2 News Report',
    date: '20 Oct 2026',
    status: 'Supports',
    statusStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isImage: false,
  },
  {
    id: 'E3',
    title: 'E3 News Report',
    date: '20 Oct 2026',
    status: 'Contradicts',
    statusStyle: 'bg-rose-50 text-rose-700 border-rose-200',
    isImage: false,
  },
];

export default function ComparisonPage() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Page Title & Active Claim Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Comparison</h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare baseline vs protected workflows on the same claim.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs text-xs">
          <span className="font-semibold text-slate-800">
            Claim: <span className="text-blue-600">Flooding in Area A on 20 October</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Status: Completed
          </span>
        </div>
      </div>

      {/* Main Grid: Baseline Workflow (Left) vs Protected Workflow (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Baseline Workflow Card */}
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-2xs space-y-6 relative overflow-hidden">
          {/* Light red background accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Baseline Workflow</h2>
              <p className="text-xs text-slate-500">Direct LLM answer from retrieved data</p>
            </div>
          </div>

          {/* Verdict Box */}
          <div className="p-5 rounded-xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Verdict
              </span>
              <span className="text-lg font-extrabold text-rose-600">Flooding occurred</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
              Incorrect
            </span>
          </div>

          {/* Key Issues List */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Key Issues</h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
              {baselineIssues.map((issue) => (
                <li key={issue} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Protected Workflow Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-2xs space-y-6 relative overflow-hidden">
          {/* Light green background accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Protected Workflow</h2>
              <p className="text-xs text-slate-500">Evidence checks + policy validation</p>
            </div>
          </div>

          {/* Verdict Box */}
          <div className="p-5 rounded-xl bg-amber-50/40 border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Verdict
              </span>
              <span className="text-lg font-extrabold text-amber-600">INSUFFICIENT EVIDENCE</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              Correct
            </span>
          </div>

          {/* Checks Passed List */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Checks Passed</h3>
            <ul className="space-y-2.5 text-xs text-slate-600">
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

      {/* Bottom Section: Evidence Used Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Evidence Used</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {evidenceUsed.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3.5 hover:bg-slate-50 transition-colors"
            >
              {item.isImage ? (
                <img
                  src={item.imgUrl}
                  alt={item.title}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-xs truncate">{item.title}</h4>
                <p className="text-[11px] text-slate-500">{item.date}</p>
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