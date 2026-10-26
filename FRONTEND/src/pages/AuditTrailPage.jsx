import React, { useState } from 'react';
import { Calendar, Download } from 'lucide-react';

const auditLogs = [
  {
    time: '10:24',
    claim: 'Flooding in Area A (20 Oct)',
    workflow: 'Protected',
    verdict: 'INSUFFICIENT EVIDENCE',
    verdictStyle: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    status: 'Completed',
  },
  {
    time: '08:17',
    claim: 'Landslide risk (18 Oct)',
    workflow: 'Protected',
    verdict: 'REFUTED',
    verdictStyle: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    status: 'Completed',
  },
  {
    time: '06:42',
    claim: 'Vegetation change (Oct)',
    workflow: 'Baseline',
    verdict: 'INCORRECT',
    verdictStyle: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    status: 'Completed',
  },
  {
    time: '04:12',
    claim: 'Urban heat (Jun)',
    workflow: 'Protected',
    verdict: 'SUFFICIENT EVIDENCE',
    verdictStyle: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    status: 'Completed',
  },
  {
    time: '22:31',
    claim: 'Flooding in Area B (15 Oct)',
    workflow: 'Protected',
    verdict: 'CORROBORATED',
    verdictStyle: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    status: 'Completed',
  },
  {
    time: '19:08',
    claim: 'Land use change (Sep)',
    workflow: 'Baseline',
    verdict: 'INCORRECT',
    verdictStyle: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    status: 'Completed',
  },
  {
    time: '16:45',
    claim: 'Coastal erosion (Oct)',
    workflow: 'Protected',
    verdict: 'INSUFFICIENT EVIDENCE',
    verdictStyle: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    status: 'Completed',
  },
  {
    time: '12:20',
    claim: 'Forest loss (Aug)',
    workflow: 'Baseline',
    verdict: 'CORROBORATED',
    verdictStyle: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    status: 'Completed',
  },
];

export default function AuditTrailPage() {
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [dateRange] = useState('Oct 12, 2026 - Oct 20, 2026');

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Audit Trail</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete record of all claims, checks and verdicts.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{dateRange}</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <th className="pb-3.5 font-semibold">Time</th>
                <th className="pb-3.5 font-semibold">Claim</th>
                <th className="pb-3.5 font-semibold">Workflow</th>
                <th className="pb-3.5 font-semibold">Verdict</th>
                <th className="pb-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {auditLogs.map((log, index) => (
                <tr key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                    {log.time}
                  </td>
                  <td className="py-4 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {log.claim}
                  </td>
                  <td className="py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {log.workflow}
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${log.verdictStyle}`}
                    >
                      {log.verdict}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}