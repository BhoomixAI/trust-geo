import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('General');
  const [language, setLanguage] = useState('English');
  const [defaultView, setDefaultView] = useState('Dashboard');
  const [isSaved, setIsSaved] = useState(false);

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure your preferences and system options.
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-6">
          {['General', 'Data & Storage', 'API Keys', 'Notifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-semibold transition-all relative ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Settings Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
        {activeTab === 'General' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Section: General Settings Controls */}
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">General Settings</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={handleThemeChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                  <option value="System Default">System Default</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default View
                </label>
                <select
                  value={defaultView}
                  onChange={(e) => setDefaultView(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Dashboard">Dashboard</option>
                  <option value="Submit Claim">Submit Claim</option>
                  <option value="Evidence Explorer">Evidence Explorer</option>
                  <option value="Comparison">Comparison</option>
                </select>
              </div>
            </div>

            {/* Right Section: System Information Table */}
            <div className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">System Information</h2>

              <div className="divide-y divide-slate-200/80 dark:divide-slate-700/80 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Version</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">1.0.0</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Data Source</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Synthetic Demo Data</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Last Updated</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">25 Oct 2026</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Database</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">SQLite</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Environment</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Development</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Changes Button Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          {isSaved && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Preferences Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            type="button"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}