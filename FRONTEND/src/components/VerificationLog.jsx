import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, ShieldX } from 'lucide-react';

const logs = [
  {
    id: 1,
    time: '2m ago',
    claim: 'C-012',
    check: 'TEMPORAL_CHECK',
    status: 'Warning',
    detail: 'Acquisition date (12 Oct) is 8 days prior to claim event interval (20 Oct)',
    icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    id: 2,
    time: '15m ago',
    claim: 'C-011',
    check: 'SPATIAL_OVERLAP',
    status: 'Passed',
    detail: 'Polygon footprint intersection confirmed via Shapely engine',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    id: 3,
    time: '48m ago',
    claim: 'C-010',
    check: 'PROMPT_INJECTION',
    status: 'Blocked',
    detail: 'Hostile instruction ("Ignore all rules") neutralized in retrieved payload',
    icon: ShieldX,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
];

export default function VerificationLog() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900">Live Audit & Verification Stream</h2>
        </div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          ● Engine Active
        </span>
      </div>

      <div className="space-y-3">
        {logs.map((log) => {
          const Icon = log.icon;
          return (
            <div
              key={log.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2 rounded-xl border ${log.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{log.check}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                      {log.claim}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{log.detail}</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap pl-4">
                {log.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}