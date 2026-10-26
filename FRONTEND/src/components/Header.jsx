import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const pageOptions = [
  ['dashboard', 'Dashboard'],
  ['submit-claim', 'Submit Claim'],
  ['evidence-explorer', 'Evidence Explorer'],
  ['comparison', 'Comparison'],
  ['benchmark', 'Benchmark'],
  ['audit-trail', 'Audit Trail'],
  ['settings', 'Settings'],
];

export default function Header({ activePage, setActivePage }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'Dark';
  return (
    <header className="min-h-16 bg-white dark:bg-[#061426] border-b border-slate-200 dark:border-cyan-950/70 px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-10 transition-colors">
      {/* Search Bar */}
      <div className="relative w-96 max-w-[48vw] hidden md:block">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search claims, locations, or evidence..."
          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Right User Actions */}
      <select
        aria-label="Application page"
        value={activePage}
        onChange={(event) => setActivePage(event.target.value)}
        className="md:hidden min-w-0 flex-1 max-w-52 rounded-lg border border-slate-200 dark:border-cyan-950 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
      >
        {pageOptions.map(([id, label]) => <option value={id} key={id}>{label}</option>)}
      </select>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          type="button"
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          onClick={() => setTheme(isDark ? 'Light' : 'Dark')}
          className="p-2 rounded-xl text-slate-500 dark:text-cyan-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button aria-label="Notifications" className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center shadow-xs">
            TG
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">TRUST-GEO Team</span>
        </div>
      </div>
    </header>
  );
}
