import { Satellite } from 'lucide-react';
import StatusMessage from './StatusMessage';
import { api, useApi, formatCoords } from '../api';

const CLAIM_DATE = '2026-10-20';

function Pass({ label, item }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="font-semibold text-slate-500 dark:text-slate-400 w-12">{label}</span>
      {item ? (
        <a href={item.url} target="_blank" rel="noreferrer" className="flex-1 text-right hover:underline">
          <span className="font-mono text-slate-800 dark:text-slate-200 block truncate">{item.item_id}</span>
          <span className="text-slate-400 dark:text-slate-500">
            {item.acquired_at.slice(0, 16).replace('T', ' ')} UTC • gap {item.gap_days} day{item.gap_days === 1 ? '' : 's'}
          </span>
        </a>
      ) : (
        <span className="text-slate-400 dark:text-slate-500">none found</span>
      )}
    </div>
  );
}

export default function ActiveTestArea({ aoi }) {
  const acq = useApi(() => api.acquisitions(aoi.bbox, CLAIM_DATE), [aoi.bbox.join(',')]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Active Test Area</h2>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Area A</span>
      </div>

      {/* Illustrative image only (not satellite data) */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-40 bg-slate-900">
        <svg className="w-full h-full" viewBox="0 0 800 320" role="img" aria-label="Illustrative topographic area preview, not satellite imagery" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="area-water" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#08263d"/><stop offset="1" stopColor="#0c475b"/></linearGradient>
            <linearGradient id="area-land" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#136453"/><stop offset="1" stopColor="#183e45"/></linearGradient>
            <pattern id="area-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0v28" fill="none" stroke="#65d9db" strokeOpacity=".12" strokeWidth="1"/></pattern>
          </defs>
          <rect width="800" height="320" fill="url(#area-water)"/>
          <path d="M0 30 110 0l86 38 80-15 80 45 75-25 74 41 110-31 99 57 86-19v229H0Z" fill="url(#area-land)"/>
          <path d="M-15 223q120-108 227-28t218 3q114-98 230-22t180 8" fill="none" stroke="#1b9fb1" strokeOpacity=".68" strokeWidth="19"/>
          <path d="M-15 223q120-108 227-28t218 3q114-98 230-22t180 8" fill="none" stroke="#64d6d0" strokeOpacity=".33" strokeWidth="2"/>
          <path d="M46 50 211 82l-34 78 145 18 36 89M502 12l-60 79 88 55-34 79 114 57M676 36l-71 90 67 65-30 114" fill="none" stroke="#9ee6c1" strokeOpacity=".24" strokeWidth="3"/>
          <rect width="800" height="320" fill="url(#area-grid)"/>
          <g fill="#7fe6d4" fillOpacity=".7"><circle cx="210" cy="103" r="4"/><circle cx="533" cy="71" r="4"/><circle cx="655" cy="229" r="4"/><circle cx="357" cy="251" r="4"/></g>
        </svg>
        <div className="absolute inset-6 border-2 border-red-500/80 bg-red-500/20 rounded-lg flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded">AOI: Area A</span>
        </div>
        <span className="absolute bottom-2 left-2 text-[9px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
          Illustrative image, not satellite data
        </span>
      </div>

      <div className="text-xs space-y-0.5">
        <p className="font-mono text-slate-700 dark:text-slate-300">{formatCoords(aoi.center)}</p>
        <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">bbox [{aoi.bbox.join(', ')}]</p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Satellite className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Real Sentinel-2 passes near {CLAIM_DATE}
          </div>
          {acq.data && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                acq.data.source === 'live'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                  : acq.data.source === 'cached'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              {acq.data.source}
            </span>
          )}
        </div>
        {acq.loading || acq.error ? (
          <StatusMessage loading={acq.loading} error={acq.error} onRetry={acq.reload} />
        ) : (
          <>
            <Pass label="Before" item={acq.data.before} />
            <Pass label="After" item={acq.data.after} />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">{acq.data.note}</p>
          </>
        )}
      </div>
    </div>
  );
}
