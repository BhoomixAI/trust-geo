import React from 'react';
import { ShieldAlert } from 'lucide-react';

const COLORS = ['bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-purple-500', 'bg-sky-500', 'bg-teal-500'];

export default function FailureBreakdown({ modes, totalCases }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-sm">Geospatial Failure Modes</h2>
        </div>
        <p className="text-[11px] text-slate-400 mb-4">Traps in the benchmark, and how many each workflow handled correctly</p>

        <div className="space-y-4">
          {modes.map((item, idx) => {
            const count = item.case_ids.length;
            const pct = totalCases ? Math.round((count / totalCases) * 100) : 0;
            return (
              <div key={item.tag}>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                  <span className="truncate pr-2">{item.label}</span>
                  <span className="font-bold text-slate-900 whitespace-nowrap">
                    {count} case{count === 1 ? '' : 's'} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${COLORS[idx % COLORS.length]}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{item.case_ids.join(', ')}</span>
                  <span>
                    protected {item.caught_by_protected}/{count} • baseline {item.caught_by_baseline}/{count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>{totalCases} Synthetic Benchmark Cases</span>
      </div>
    </div>
  );
}
