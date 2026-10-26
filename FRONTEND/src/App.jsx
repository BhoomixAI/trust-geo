import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SubmitClaimPage from './pages/SubmitClaimPage';

export default function App() {
  const [activePage, setActivePage] = useState('submit-claim');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-8">
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'submit-claim' && <SubmitClaimPage />}
          {activePage !== 'dashboard' && activePage !== 'submit-claim' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 font-medium">
              Page under development. Click <button onClick={() => setActivePage('dashboard')} className="text-blue-600 font-bold underline">Dashboard</button> or <button onClick={() => setActivePage('submit-claim')} className="text-blue-600 font-bold underline">Submit Claim</button>.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}