import { useState } from 'react';
import { Bot, ShieldCheck, ShieldAlert, Loader2, Radio } from 'lucide-react';
import StatusMessage from './StatusMessage';
import { api, VERDICT_STYLES, verdictLabel } from '../api';

const SOURCE_STYLE = {
  live: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  recorded: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
  unavailable: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800',
};

const SEVERITY_STYLE = {
  high: 'text-rose-600 dark:text-rose-400',
  low: 'text-amber-600 dark:text-amber-400',
  info: 'text-slate-500 dark:text-slate-400',
};

// The real AI's answer for one case, and TRUST-GEO's audit of whether that answer is justified.
export default function AiAnswerCard({ row, configured, onLive }) {
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const { answer, audit } = row;

  const askLive = async () => {
    setAsking(true);
    setError(null);
    try {
      onLive(await api.runAiCase(row.case_id, true));
    } catch (e) {
      setError(e);
    } finally {
      setAsking(false);
    }
  };

  const verdict = answer.verdict;
  const justified = audit.justified;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Real AI under test</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {answer.model ? `${answer.model} answered on its own` : 'An AI model answers the claim; TRUST-GEO checks the answer'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SOURCE_STYLE[answer.source] ?? SOURCE_STYLE.unavailable}`}>
            {answer.source === 'recorded' ? 'recorded answer' : answer.source}
          </span>
          {configured && (
            <button
              onClick={askLive}
              disabled={asking}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 disabled:opacity-50"
            >
              {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />} Ask AI live
            </button>
          )}
        </div>
      </div>

      {error && <StatusMessage error={error} />}

      {!verdict ? (
        <StatusMessage empty={answer.explanation} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">AI verdict</span>
            <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-extrabold border ${VERDICT_STYLES[verdict]}`}>
              {verdictLabel(verdict)}
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{answer.explanation}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              cites: {answer.cited_evidence_ids.join(', ') || 'nothing'}
            </p>
          </div>

          <div
            className={`p-4 rounded-xl border space-y-2 ${
              justified
                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">TRUST-GEO check of this answer</span>
            <div className={`flex items-center gap-2 font-extrabold text-sm ${justified ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {justified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              {justified ? 'Justified by the evidence' : 'Not justified by the evidence'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              The evidence supports <strong>{verdictLabel(audit.trust_geo_verdict)}</strong>.
            </p>
            <ul className="space-y-1.5">
              {audit.issues.map((i) => (
                <li key={i.code} className="text-xs">
                  <span className={`font-bold ${SEVERITY_STYLE[i.severity]}`}>{i.code}</span>
                  <span className="text-slate-600 dark:text-slate-300"> — {i.explanation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
