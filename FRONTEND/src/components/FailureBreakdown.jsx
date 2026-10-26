import React from 'react';
import { ShieldAlert } from 'lucide-react';

const failures = [
  { label: 'Stale Imagery (Temporal Gap)', count: 5, pct: '41%', color: 'bg-amber-500' },
  { label: 'Contradictory News Reports', count: 3, pct: '25%', color: 'bg-rose-500' },
  { label: 'Spatial / AOI Mismatch', count: 2, pct: '17%', color: 'bg-indigo-500' },
  { label: 'Prompt Injection Attempts', count: 2, pct: '17%', color: 'bg-purple-500' },
];

export default function FailureBreakdown() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-sm">Geospatial Failure Modes</h2>
        </div>
        
        <div className="space-y-4">
          {failures.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span className="truncate pr-2">{item.label}</span>
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  {item.count} cases ({item.pct})
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: item.pct }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>12 Synthetic Benchmark Cases</span>
        <span className="font-semibold text-blue-600">View Benchmark →</span>
      </div>
    </div>
  );
}