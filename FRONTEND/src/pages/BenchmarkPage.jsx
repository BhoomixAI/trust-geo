import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const metricCards = [
  {
    title: 'Failure Recall',
    value: '92.3%',
    change: '+14.2%',
    isPositive: true,
    detail: 'vs baseline',
  },
  {
    title: 'False Alarm Rate',
    value: '6.7%',
    change: '-8.9%',
    isPositive: true,
    detail: 'vs baseline',
  },
  {
    title: 'Verdict Accuracy',
    value: '91.7%',
    change: '+12.3%',
    isPositive: true,
    detail: 'vs baseline',
  },
  {
    title: 'Appropriate Abstention',
    value: '4.5%',
    change: '-3.1%',
    isPositive: false,
    detail: 'vs baseline',
  },
];

const trendData = [
  { date: 'Oct 12', Baseline: 50, Protected: 38 },
  { date: 'Oct 13', Baseline: 58, Protected: 40 },
  { date: 'Oct 14', Baseline: 65, Protected: 55 },
  { date: 'Oct 15', Baseline: 75, Protected: 65 },
  { date: 'Oct 16', Baseline: 68, Protected: 75 },
  { date: 'Oct 17', Baseline: 62, Protected: 85 },
  { date: 'Oct 18', Baseline: 75, Protected: 72 },
  { date: 'Oct 19', Baseline: 76, Protected: 90 },
  { date: 'Oct 20', Baseline: 82, Protected: 91 },
];

const distributionData = [
  { name: 'Correct', value: 8, percentage: '66.7%', color: '#10B981' },
  { name: 'Incorrect', value: 2, percentage: '16.7%', color: '#EF4444' },
  { name: 'Abstained', value: 1, percentage: '8.3%', color: '#F59E0B' },
  { name: 'Other', value: 1, percentage: '8.3%', color: '#A855F7' },
];

const scenarios = [
  { name: 'Temporal Mismatch', count: '4 cases', success: '75% success' },
  { name: 'Spatial Mismatch', count: '2 cases', success: '100% success' },
  { name: 'Source Conflict', count: '3 cases', success: '67% success' },
  { name: 'Insufficient Evidence', count: '3 cases', success: '67% success' },
];

export default function BenchmarkPage() {
  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Benchmark Metrics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Performance metrics for the reliability testing framework.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
          Synthetic Demo Data
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <div
            key={card.title}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2"
          >
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</div>
            <div className="flex items-center gap-1 text-xs font-medium">
              {card.isPositive ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> {card.change}
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-bold">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {card.change}
                </span>
              )}
              <span className="text-slate-400 dark:text-slate-500 pl-1">{card.detail}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Performance Trend</h2>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span className="text-slate-600 dark:text-slate-300">Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-300">Protected</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis domain={[0, 100]} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid #334155', color: '#F8FAFC', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="Baseline" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Protected" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Verdict Distribution</h2>

          <div className="relative h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">12</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Total Cases</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {item.value} <span className="text-slate-400 dark:text-slate-500 font-normal">({item.percentage})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Scenario Breakdown</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarios.map((sc) => (
            <div key={sc.name} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{sc.name}</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{sc.count}</div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> {sc.success}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}