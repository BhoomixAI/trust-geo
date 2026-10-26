import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Shared loading / error / empty states for backend-driven cards.
export default function StatusMessage({ loading, error, empty, onRetry }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-6 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading from backend…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-start gap-2 text-xs text-rose-800 dark:text-rose-300">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1">{error.message}</div>
        {onRetry && (
          <button onClick={onRetry} className="font-semibold underline">
            Retry
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">{empty}</p>;
  }
  return null;
}
