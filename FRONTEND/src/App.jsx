import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SubmitClaimPage from './pages/SubmitClaimPage';
import EvidenceExplorerPage from './pages/EvidenceExplorerPage';
import ComparisonPage from './pages/ComparisonPage';
import BenchmarkPage from './pages/BenchmarkPage';

export default function App() {
  const [activePage, setActivePage] = useState('benchmark');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8">
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'submit-claim' && <SubmitClaimPage />}
          {activePage === 'evidence-explorer' && <EvidenceExplorerPage />}
          {activePage === 'comparison' && <ComparisonPage />}
          {activePage === 'benchmark' && <BenchmarkPage />}
          {['audit-trail', 'settings'].includes(activePage) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
              Page under development. Click <button onClick={() => setActivePage('dashboard')} className="text-blue-600 font-bold underline">Dashboard</button>, <button onClick={() => setActivePage('submit-claim')} className="text-blue-600 font-bold underline">Submit Claim</button>, <button onClick={() => setActivePage('evidence-explorer')} className="text-blue-600 font-bold underline">Evidence Explorer</button>, <button onClick={() => setActivePage('comparison')} className="text-blue-600 font-bold underline">Comparison</button>, or <button onClick={() => setActivePage('benchmark')} className="text-blue-600 font-bold underline">Benchmark</button>.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}