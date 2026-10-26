import React from 'react';
import { Layers } from 'lucide-react';
import StatusMessage from './StatusMessage';
import { VERDICT_STYLES, verdictLabel, formatCoords, timeAgo } from '../api';

export default function RecentClaims({ runs, aoi }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Recent Runs</h2>
        </div>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">From the audit database</span>
      </div>

      {runs.length === 0 ? (
        <StatusMessage empty="No runs yet. Run the benchmark, or run a case from Submit Claim." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <th className="pb-3 font-semibold">#</th>
                <th className="pb-3 font-semibold">Claim</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">When</th>
                <th className="pb-3 font-semibold">Workflow</th>
                <th className="pb-3 font-semibold">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {runs.map((row) => (
                <tr key={row.run_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 font-medium text-slate-500 dark:text-slate-400">{row.case_id}</td>
                  <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">{row.claim_text}</td>
                  <td className="py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {aoi?.center ? formatCoords(aoi.center) : '—'}
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400 text-xs">{timeAgo(row.timestamp)}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        row.mode === 'protected'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {row.mode}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${VERDICT_STYLES[row.verdict]}`}>
                      {verdictLabel(row.verdict)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
