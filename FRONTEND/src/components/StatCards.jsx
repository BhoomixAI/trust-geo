import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const stats = [
  {
    title: 'Total Claims Tested',
    value: '12',
    change: '+12% vs baseline',
    icon: Shield,
    iconBg: 'bg-blue-50 text-blue-600',
    cardBorder: 'border-slate-200 bg-white',
    badgeColor: 'text-emerald-600',
  },
  {
    title: 'Protected Workflow Accuracy',
    value: '91.7%',
    change: '+12.2% vs baseline',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50 text-emerald-600',
    cardBorder: 'border-emerald-100 bg-emerald-50/20',
    badgeColor: 'text-emerald-600',
  },
  {
    title: 'Evidence Conflicts',
    value: '2',
    change: '(current demo)',
    icon: AlertTriangle,
    iconBg: 'bg-amber-50 text-amber-600',
    cardBorder: 'border-amber-100 bg-amber-50/20',
    badgeColor: 'text-slate-400',
  },
  {
    title: 'Avg. Processing Time',
    value: '8.4s',
    change: '-32% vs baseline',
    icon: Clock,
    iconBg: 'bg-indigo-50 text-indigo-600',
    cardBorder: 'border-slate-200 bg-white',
    badgeColor: 'text-emerald-600',
  },
];

export default function StatCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className={`p-5 rounded-2xl border ${stat.cardBorder} shadow-2xs transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`p-2 rounded-xl ${stat.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
            <p className={`text-xs font-medium ${stat.badgeColor}`}>{stat.change}</p>
          </div>
        );
      })}
    </div>
  );
}