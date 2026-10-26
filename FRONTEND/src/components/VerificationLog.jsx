import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, ShieldX, Eye } from 'lucide-react';
import StatusMessage from './StatusMessage';
import { timeAgo } from '../api';

const STATUS_STYLE = {
  PASS: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60' },
  WARN: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/60' },
  FAIL: { icon: ShieldX, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60' },
  REVIEW: { icon: Eye, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/60' },
};

export default function VerificationLog({ findings }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Audit & Verification Stream</h2>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
          Latest issues found by checks
        </span>
      </div>

      {findings.length === 0 ? (
        <StatusMessage empty="No findings yet. Run a case in protected mode to see check results." />
      ) : (
        <div className="space-y-3">
          {findings.map((log, idx) => {
            const { icon: Icon, color } = STATUS_STYLE[log.status] ?? STATUS_STYLE.WARN;
            return (
              <div
                key={`${log.run_id}-${idx}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`p-2 rounded-xl border ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{log.code}</span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {log.case_id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{log.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{log.explanation}</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap pl-4">
                  {timeAgo(log.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
