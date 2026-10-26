import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { formatMetric } from '../api';

const fmtMs = (lat) => (lat?.median == null ? '—' : `${lat.median.toFixed(2)} ms`);

export default function StatCards({ stats }) {
  const acc = stats.protected_accuracy;
  const items = [
    {
      title: 'Total Claims Tested',
      value: String(stats.cases_tested),
      change: 'Synthetic benchmark cases',
      icon: Shield,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
      cardBorder: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
      badgeColor: 'text-slate-400 dark:text-slate-500',
    },
    {
      title: 'Protected Workflow Accuracy',
      value: acc.value === null ? 'n/a' : `${(acc.value * 100).toFixed(1)}%`,
      change: `${acc.numerator}/${acc.denominator} correct • baseline ${formatMetric(stats.baseline_accuracy)}`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      cardBorder: 'border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/60',
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Evidence Conflicts',
      value: String(stats.evidence_conflicts),
      change: 'Cases with conflicting evidence',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      cardBorder: 'border-amber-100 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/60',
      badgeColor: 'text-slate-400 dark:text-slate-500',
    },
    {
      title: 'Median Processing Time',
      value: fmtMs(stats.protected_latency_ms),
      change: `Protected workflow • baseline ${fmtMs(stats.baseline_latency_ms)}`,
      icon: Clock,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
      cardBorder: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
      badgeColor: 'text-slate-400 dark:text-slate-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className={`p-5 rounded-2xl border ${stat.cardBorder} shadow-2xs transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`p-2 rounded-xl ${stat.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stat.value}</div>
            <p className={`text-xs font-medium ${stat.badgeColor}`}>{stat.change}</p>
          </div>
        );
      })}
    </div>
  );
}
