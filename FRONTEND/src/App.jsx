import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SubmitClaimPage from './pages/SubmitClaimPage';
import EvidenceExplorerPage from './pages/EvidenceExplorerPage';
import ComparisonPage from './pages/ComparisonPage';
import BenchmarkPage from './pages/BenchmarkPage';
import AuditTrailPage from './pages/AuditTrailPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />

        <div className="flex-1 flex flex-col min-w-0">
          <Header />

          <main className="p-8">
            {activePage === 'dashboard' && <DashboardPage />}
            {activePage === 'submit-claim' && <SubmitClaimPage />}
            {activePage === 'evidence-explorer' && <EvidenceExplorerPage />}
            {activePage === 'comparison' && <ComparisonPage />}
            {activePage === 'benchmark' && <BenchmarkPage />}
            {activePage === 'audit-trail' && <AuditTrailPage />}
            {activePage === 'settings' && <SettingsPage />}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}