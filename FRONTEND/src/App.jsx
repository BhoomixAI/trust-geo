import { useEffect, useState } from 'react';
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
import LandingPage from './pages/LandingPage';

const pathForPage = {
  dashboard: '/app',
  'submit-claim': '/app/claims/new',
  'evidence-explorer': '/app/evidence',
  comparison: '/app/comparison',
  benchmark: '/app/benchmark',
  'audit-trail': '/app/audit',
  settings: '/app/settings',
};

const pageForPath = Object.fromEntries(Object.entries(pathForPage).map(([page, path]) => [path, page]));

function readLocation() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  return { pathname, page: pageForPath[pathname] || 'dashboard' };
}

export default function App() {
  const [location, setLocation] = useState(readLocation);
  const activePage = location.page;

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateToPage = (page) => {
    const path = pathForPage[page] || '/app';
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setLocation({ pathname: path, page: pageForPath[path] });
  };

  if (location.pathname === '/') {
    return (
      <ThemeProvider>
        <LandingPage onGetStarted={() => navigateToPage('dashboard')} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="tg-app-shell flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <Sidebar activePage={activePage} setActivePage={navigateToPage} />

        <div className="flex-1 flex flex-col min-w-0">
          <Header activePage={activePage} setActivePage={navigateToPage} />

          <main className="p-4 md:p-8">
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
