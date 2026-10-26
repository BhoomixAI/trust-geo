import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10 transition-colors">
      {/* Search Bar */}
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search claims, locations, or evidence..."
          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center shadow-xs">
            DD
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Devang Dixit</span>
        </div>
      </div>
    </header>
  );
}