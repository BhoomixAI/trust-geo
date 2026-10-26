import React from 'react';
import { 
  Home, 
  PlusCircle, 
  FileText, 
  Scale, 
  BarChart2, 
  Clock, 
  Settings,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'submit-claim', label: 'Submit Claim', icon: PlusCircle },
  { id: 'evidence-explorer', label: 'Evidence Explorer', icon: FileText },
  { id: 'comparison', label: 'Comparison', icon: Scale },
  { id: 'benchmark', label: 'Benchmark', icon: BarChart2 },
  { id: 'audit-trail', label: 'Audit Trail', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 h-screen sticky top-0">
      <div>
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-3 py-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight text-lg">TRUST-GEO</h1>
            <p className="text-[10px] text-slate-500 font-medium">Geospatial AI Reliability</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info tag */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs font-medium text-slate-500">Prototype • Synthetic Data</p>
        <p className="text-[10px] text-slate-400 mt-0.5">v1.0</p>
      </div>
    </aside>
  );
}