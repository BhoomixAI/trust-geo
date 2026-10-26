import React from 'react';
import { Layers } from 'lucide-react';

const claims = [
  {
    id: 'C-012',
    claim: 'Flooding in Area A',
    location: '12.9716°N, 77.5946°E',
    date: '20 Oct 2026',
    status: 'Completed',
    verdict: 'INSUFFICIENT EVIDENCE',
    verdictStyle: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'C-011',
    claim: 'Landslide risk',
    location: '18.5204°N, 73.8567°E',
    date: '18 Oct 2026',
    status: 'Completed',
    verdict: 'REFUTED',
    verdictStyle: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'C-010',
    claim: 'Vegetation change',
    location: '28.6139°N, 77.2090°E',
    date: '16 Oct 2026',
    status: 'Completed',
    verdict: 'CORROBORATED',
    verdictStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'C-009',
    claim: 'Urban heat island',
    location: '19.0760°N, 72.8777°E',
    date: '14 Oct 2026',
    status: 'Completed',
    verdict: 'SUFFICIENT EVIDENCE',
    verdictStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export default function RecentClaims() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900">Recent Claims</h2>
        </div>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          View all →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
              <th className="pb-3 font-semibold">#</th>
              <th className="pb-3 font-semibold">Claim</th>
              <th className="pb-3 font-semibold">Location</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claims.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 font-medium text-slate-500">{row.id}</td>
                <td className="py-3.5 font-semibold text-slate-800">{row.claim}</td>
                <td className="py-3.5 text-xs text-slate-500 font-mono">{row.location}</td>
                <td className="py-3.5 text-slate-500 text-xs">{row.date}</td>
                <td className="py-3.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {row.status}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${row.verdictStyle}`}>
                    {row.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}