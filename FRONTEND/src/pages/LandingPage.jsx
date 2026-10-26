import {
  ArrowRight, ArrowUpRight, Check, FileText, LocateFixed,
  MapPinned, ScanSearch, ShieldCheck, Satellite, UserRoundCheck,
  Database, Map, Activity, Clock3, AlertTriangle, Moon, Sun, Menu, X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, useApi } from '../api';
import { useTheme } from '../context/ThemeContext';
import HeroMotion from '../components/HeroMotion';
import './LandingPage.css';

const features = [
  {
    icon: MapPinned,
    title: 'Geospatial Evidence',
    body: 'Inspect imagery, documents, timestamps, and source metadata in one clear view.',
  },
  {
    icon: ScanSearch,
    title: 'AI Reliability Testing',
    body: 'Evaluate geospatial claims and surface conclusions that the evidence cannot support.',
  },
  {
    icon: ShieldCheck,
    title: 'Protected Workflow',
    body: 'Check temporal validity, spatial alignment, conflicting sources, and evidence sufficiency.',
  },
  {
    icon: FileText,
    title: 'Auditable Decisions',
    body: 'Compare baseline and protected workflows with traceable evaluation results.',
  },
];

function BrandMark() {
  return (
    <span className="tg-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="34" fill="url(#brandOcean)" />
        <circle cx="40" cy="40" r="34" stroke="#0875E7" strokeWidth="3" />
        <path d="M9 32c18-8 44-8 62 0M9 48c18 8 44 8 62 0M40 6c-12 16-12 52 0 68M40 6c12 16 12 52 0 68" stroke="#0A77CE" strokeWidth="2" opacity=".72" />
        <path d="M40 18c-7 0-12 5.2-12 12 0 9 12 22 12 22s12-13 12-22c0-6.8-5-12-12-12Z" fill="white" />
        <circle cx="40" cy="30" r="4.5" fill="#0875E7" />
        <path d="M58 42c-6 0-10 4.4-10 10 0 7.5 10 18 10 18s10-10.5 10-18c0-5.6-4-10-10-10Z" fill="#164773" />
        <circle cx="58" cy="52" r="3.5" fill="white" />
        <defs><linearGradient id="brandOcean" x1="8" y1="8" x2="70" y2="72" gradientUnits="userSpaceOnUse"><stop stopColor="#20D6EF"/><stop offset="1" stopColor="#0877DB"/></linearGradient></defs>
      </svg>
    </span>
  );
}

function EarthVisual() {
  return (
    <div className="tg-earth-scene" aria-hidden="true">
      <div className="tg-earth-halo" />
      <svg className="tg-earth" viewBox="0 0 1200 620" preserveAspectRatio="xMidYMax meet">
        <defs>
          <radialGradient id="ocean" cx="42%" cy="35%" r="74%">
            <stop offset="0" stopColor="#53E4F6" />
            <stop offset=".29" stopColor="#098FD8" />
            <stop offset=".67" stopColor="#0755B2" />
            <stop offset="1" stopColor="#082B73" />
          </radialGradient>
          <linearGradient id="earthEdge" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#E5FCFF" />
            <stop offset=".24" stopColor="#36E7FF" />
            <stop offset=".62" stopColor="#157AE2" />
            <stop offset="1" stopColor="#102D75" />
          </linearGradient>
          <radialGradient id="land" cx="48%" cy="40%" r="75%">
            <stop stopColor="#9EE7CA" />
            <stop offset=".47" stopColor="#4EAA99" />
            <stop offset="1" stopColor="#326B83" />
          </radialGradient>
          <linearGradient id="earthSweep" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#4FFFE2" stopOpacity="0"/><stop offset=".48" stopColor="#B7FFFF" stopOpacity=".85"/><stop offset="1" stopColor="#05B9FF" stopOpacity="0"/></linearGradient>
          <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <clipPath id="sphere"><ellipse cx="600" cy="575" rx="690" ry="420" /></clipPath>
        </defs>
        <ellipse cx="600" cy="575" rx="690" ry="420" fill="url(#ocean)" stroke="url(#earthEdge)" strokeWidth="9" />
        <g clipPath="url(#sphere)">
          <path d="M-30 381 35 344l54 6 18-25 51 10 22 34 44 8 21 31-24 25 13 40-40 22-18 50-42 6-18-42-44-12-20-48-36-11-21-39-39-13ZM117 277l32-28 43 10 19 30-22 36-40-4-18-21ZM226 393l30-45 44-28 56 10 30 29 51-4 44 32 25 48-33 29-39-12-32 30-45-11-18-37-42-10-31-29-34 1ZM453 418l42-39 44 6 25 28 41 6 22 36-28 22-45-7-33 19-36-14-43 2-26-23ZM585 332l25-35 52-19 38 18 14 38-25 29-58 8-30-14Z" fill="url(#land)" opacity=".96" />
          <path d="M710 322l34-39 51 4 41 23 57-10 46 24 68 4 40 35-20 40-57 8-29 33-64-8-39 30-56-16-31-39-53-6-20-35-52-13ZM832 476l45-9 35 19 8 38-28 31-41-12-22-33ZM985 303l19-20 27 11 6 31-23 14-29-14ZM1054 427l36-25 39 6 11 36-38 24-42-10Z" fill="url(#land)" opacity=".92" />
          <path d="M-8 463c205-120 366-161 603-160s422 50 625 169M-12 531c201-91 402-124 614-123 224 0 407 32 612 125M-5 591c188-52 391-78 605-78s423 25 608 79" fill="none" stroke="#91F5FF" strokeWidth="1.3" opacity=".32" />
          <path d="M254 164c-49 139-51 332-18 516M436 151c-27 132-26 307 3 470M600 149v440M765 158c34 142 37 329 7 488M947 190c52 143 53 302 21 442" fill="none" stroke="#86F4FF" strokeWidth="1.2" opacity=".29" />
          <g className="tg-earth-orbits" fill="none" stroke="#73F4FF" strokeWidth="1.4"><path d="M44 433Q600 115 1156 433"/><path d="M90 473Q600 205 1110 473"/></g>
          <g className="tg-marker-rings" fill="none" stroke="#71FFF0"><ellipse cx="205" cy="362" rx="12" ry="4"/><ellipse cx="523" cy="318" rx="12" ry="4"/><ellipse cx="854" cy="381" rx="12" ry="4"/><ellipse cx="1022" cy="338" rx="12" ry="4"/></g>
          <rect className="tg-earth-light-sweep" x="0" y="140" width="1200" height="430" fill="url(#earthSweep)" opacity=".12" />
          <g className="tg-network-routes" fill="none" stroke="#88F4FF" strokeWidth="2" opacity=".82">
            <path d="M158 426q120-125 238 24t245-20q132-100 241 8t193-28" />
            <path d="M275 516q108-145 238-51t258-54q127-64 235 58" />
            <path d="M411 395q100 80 207 5t229 76q91 53 161 4" />
          </g>
          <g className="tg-network-nodes" fill="#B6FFFF" filter="url(#glow)"><circle cx="158" cy="426" r="4"/><circle cx="396" cy="450" r="4"/><circle cx="641" cy="430" r="4"/><circle cx="882" cy="438" r="4"/><circle cx="1075" cy="410" r="4"/><circle cx="513" cy="465" r="3"/><circle cx="771" cy="411" r="3"/><circle cx="748" cy="518" r="3"/></g>
          <g className="tg-map-pins" fill="#FFFFFF" stroke="#5BF2FF" strokeWidth="4" filter="url(#glow)">
            <path d="M205 310c-10 0-18 8-18 18 0 13 18 34 18 34s18-21 18-34c0-10-8-18-18-18Z"/><circle cx="205" cy="328" r="5" fill="#25BDD9" stroke="none"/>
            <path d="M523 266c-10 0-18 8-18 18 0 13 18 34 18 34s18-21 18-34c0-10-8-18-18-18Z"/><circle cx="523" cy="284" r="5" fill="#25BDD9" stroke="none"/>
            <path d="M854 329c-10 0-18 8-18 18 0 13 18 34 18 34s18-21 18-34c0-10-8-18-18-18Z"/><circle cx="854" cy="347" r="5" fill="#25BDD9" stroke="none"/>
            <path d="M1022 286c-10 0-18 8-18 18 0 13 18 34 18 34s18-21 18-34c0-10-8-18-18-18Z"/><circle cx="1022" cy="304" r="5" fill="#25BDD9" stroke="none"/>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function LandingPage({ onGetStarted }) {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const heroRef = useRef(null);
  const { data, loading, error } = useApi(() => api.dashboard());
  const isDark = theme === 'Dark';
  const goTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };
  const stats = data?.stats;
  const accuracy = stats?.protected_accuracy;
  const latency = stats?.protected_latency_ms?.median;
  const metrics = [
    { icon: FileText, tone: 'blue', title: 'Total Claims Tested', value: stats ? String(stats.cases_tested) : '—', detail: 'Synthetic benchmark cases' },
    { icon: ShieldCheck, tone: 'green', title: 'Protected Workflow Accuracy', value: accuracy?.value == null ? 'n/a' : `${(accuracy.value * 100).toFixed(1)}%`, detail: accuracy ? `${accuracy.numerator}/${accuracy.denominator} correct · benchmark` : 'Backend metric unavailable' },
    { icon: AlertTriangle, tone: 'amber', title: 'Evidence Conflicts', value: stats ? String(stats.evidence_conflicts) : '—', detail: 'Cases with conflicting evidence' },
    { icon: Clock3, tone: 'cyan', title: 'Median Processing Time', value: latency == null ? '—' : `${latency.toFixed(2)} ms`, detail: 'Protected workflow · backend' },
  ];
  const agents = [
    { icon: Database, name: 'Data Collector Agent', detail: 'Imagery, reports & source metadata' },
    { icon: FileText, name: 'Source Verifier Agent', detail: 'Provenance, timestamps & metadata' },
    { icon: Map, name: 'Spatial Analysis Agent', detail: 'Geographic alignment & inconsistencies' },
    { icon: ShieldCheck, name: 'Reliability Agent', detail: 'Conflicts, gaps & reliability checks' },
    { icon: Activity, name: 'Verdict Agent', detail: 'Traceable assessment summary' },
  ];
  const demoProgress = [['Scanning satellite data', 78], ['Analyzing reports', 62], ['Detecting anomalies', 41], ['Cross-verifying sources', 28]];

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const finePointer = window.matchMedia('(pointer: fine) and (min-width: 1001px)');
    if (!hero || !finePointer.matches) return undefined;
    let frame = 0;
    const onPointerMove = (event) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 6;
        hero.style.setProperty('--parallax-x', `${x.toFixed(2)}px`);
        hero.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
      });
    };
    const onPointerLeave = () => {
      hero.style.setProperty('--parallax-x', '0px');
      hero.style.setProperty('--parallax-y', '0px');
    };
    hero.addEventListener('pointermove', onPointerMove, { passive: true });
    hero.addEventListener('pointerleave', onPointerLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div className={`tg-landing ${isDark ? '' : 'theme-light'} ${pageVisible ? '' : 'is-page-hidden'}`}>
      <section className="tg-hero" ref={heroRef}>
        <div className="tg-network-bg" aria-hidden="true" />
        <HeroMotion />
        <header className="tg-topbar">
          <button className="tg-brand-lockup" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="TRUST-GEO home">
            <BrandMark />
            <span className="tg-brand-copy"><span className="tg-brand-name">TRUST-GEO</span><span className="tg-brand-subtitle">Geospatial AI Reliability &amp; Crash-Testing</span></span>
          </button>
          <nav className={`tg-main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <button className="is-active" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false); }}>Home</button>
            <button onClick={() => goTo('features')}>Features</button>
            <button onClick={() => goTo('how-it-works')}>How it Works</button>
            <button onClick={() => goTo('use-cases')}>Use Cases</button>
            <button onClick={() => goTo('about')}>About</button>
          </nav>
          <div className="tg-top-actions">
            <button className="tg-theme-toggle" aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`} onClick={() => setTheme(isDark ? 'Light' : 'Dark')}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button className="tg-button tg-button-primary tg-nav-cta" onClick={onGetStarted}>Get Started <ArrowRight size={17} /></button>
            <button className="tg-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </header>

        <div className="tg-hero-copy">
          <div className="tg-eyebrow"><span /> TRUSTED GEOSPATIAL INTELLIGENCE</div>
          <h1 className="tg-wordmark-heading">TRUST-<span>GEO</span></h1>
          <div className="tg-hero-subtitle">Geospatial AI Reliability &amp; Crash-Testing</div>
          <h2>Better Evidence. <span>Safer Decisions.</span></h2>
          <p>Validate geospatial claims using trusted evidence, spatial checks, and AI-driven analysis.<br className="tg-desktop-break" /> Test for failures, detect misinformation, and build reliable, verifiable insights.</p>
          <div className="tg-hero-actions">
            <button className="tg-button tg-button-primary" onClick={onGetStarted}>Get Started <ArrowRight size={18} /></button>
            <button className="tg-button tg-button-secondary" onClick={() => goTo('features')}>Explore Features <ArrowUpRight size={17} /></button>
          </div>
        </div>

        <aside className="tg-agent-panel tg-console-panel">
          <div className="tg-panel-heading"><span className="tg-ready-dot" /><div><strong>LIVE AI AGENTS</strong><small>Conceptual workflow roles</small></div><span className="tg-panel-state">DEMO WORKFLOW</span></div>
          <div className="tg-agent-list">{agents.map(({ icon: Icon, name, detail }) => <div className="tg-agent-row" key={name}><span className="tg-agent-icon"><Icon size={17} /></span><span className="tg-agent-copy"><strong>{name}</strong><small>{detail}</small></span><span className="tg-agent-ready">Ready</span></div>)}</div>
          <div className="tg-panel-footnote">Role preview only · no autonomous agents are running</div>
        </aside>

        <aside className="tg-analysis-panel tg-console-panel">
          <div className="tg-panel-heading"><Activity size={15} /><div><strong>REAL-TIME ANALYSIS</strong><small>Demo visualization · deterministic</small></div><span className="tg-panel-expand">↗</span></div>
          <div className="tg-mini-map" aria-label="Illustrative geospatial activity map">
            <svg viewBox="0 0 360 150" role="img" aria-label="Stylized world map with illustrative activity markers">
              <path className="tg-mini-land" d="m26 42 18-17 29-8 13 9 18-4 18 13-8 16-23 3-12 12-20-1-14 13-15-8-8-14-17-4Zm104 47 21-10 18 4 6 12-12 17-8 28-13 8-12-20-8-23Zm36-67 21-13 33 2 17 9 19-1 13 11 24-1 19 12-10 15-21 3-12 15-18 3-12 20-20-2-3-18-18-8-4-17-17-7Zm94 65 13-10 24 3 15 14-9 13-19-1-13-9Z" />
              <g className="tg-mini-grid"><path d="M0 37h360M0 75h360M0 113h360M72 0v150m72-150v150m72-150v150m72-150v150" /></g>
              <g className="tg-mini-routes"><path d="M45 61Q120 4 171 87T287 51M84 98Q156 35 222 93t100-17" /></g>
              <g className="tg-mini-points"><circle cx="45" cy="61" r="4"/><circle cx="171" cy="87" r="4"/><circle cx="287" cy="51" r="4"/><circle cx="222" cy="93" r="3"/><circle cx="322" cy="76" r="3"/></g>
            </svg>
            <span className="tg-map-tag">ILLUSTRATIVE MAP</span>
          </div>
          <div className="tg-progress-list">{demoProgress.map(([label, value]) => <div className="tg-progress-row" key={label}><div><span>{label}</span><b>{value}%</b></div><div className="tg-progress-track"><span style={{ width: `${value}%` }} /></div></div>)}</div>
          <div className="tg-panel-footnote">Static sample values · not live processing progress</div>
        </aside>

        <div className="tg-float-label tg-label-satellite"><Satellite size={20} /><span>Satellite Imagery</span></div>
        <div className="tg-float-label tg-label-reports"><FileText size={20} /><span>Reports &amp; Documents</span></div>
        <div className="tg-float-label tg-label-ai"><UserRoundCheck size={20} /><span>AI Verification</span></div>
        <div className="tg-data-pill"><span className="tg-status-dot" /> Prototype <i /> Synthetic Demo Data</div>
        <EarthVisual />
        <div className="tg-metric-grid">{metrics.map(({ icon: Icon, tone, title, value, detail }) => <article className={`tg-metric-card tone-${tone}`} key={title}><span className="tg-metric-icon"><Icon size={20} /></span><div className="tg-metric-copy"><span>{title}</span><strong>{loading && !stats ? '…' : value}</strong><small>{detail}</small></div></article>)}</div>
        <div className="tg-metric-source">{error ? 'Backend metrics unavailable' : 'Metrics from the TRUST-GEO demo backend · synthetic benchmark data'}</div>
        <div className="tg-scroll-cue"><LocateFixed size={13} /> EVIDENCE THAT MAPS TO REALITY</div>
      </section>

      <section className="tg-features" id="features">
        <div className="tg-section-heading"><span className="tg-section-kicker">A CLEARER VIEW OF TRUST</span><h2>Confidence built on <span>evidence.</span></h2><p>Every claim deserves a closer look. TRUST-GEO brings the checks, context, and traceability together.</p></div>
        <div className="tg-feature-grid">{features.map(({ icon: Icon, title, body }, i) => <article className="tg-feature-card" key={title}><div className="tg-feature-icon"><Icon size={22} strokeWidth={1.8} /></div><span className="tg-feature-index">0{i + 1}</span><h3>{title}</h3><p>{body}</p><div className="tg-feature-rule"><span /></div></article>)}</div>
      </section>

      <section className="tg-process-section" id="how-it-works">
        <div className="tg-section-heading"><span className="tg-section-kicker">A TRACEABLE PROCESS</span><h2>From claim to <span>clearer evidence.</span></h2><p>Use the existing TRUST-GEO workflow to inspect evidence and compare validation outcomes.</p></div>
        <div className="tg-process-grid">{[['01', 'Choose a claim', 'Select a benchmark scenario or submit a claim for evaluation.'], ['02', 'Inspect the evidence', 'Review provenance, dates, locations, and available source material.'], ['03', 'Compare the checks', 'Run baseline and protected workflows, then inspect recorded results.']].map(([number, title, body]) => <article className="tg-process-card" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="tg-use-cases" id="use-cases"><div><span className="tg-section-kicker">BUILT FOR EVIDENCE-LED WORK</span><h2>Geospatial claims need<br /><span>more than a confident answer.</span></h2><p>Explore satellite observations, source documents, temporal context, and spatial consistency in a workflow that keeps evidence visible.</p></div><div className="tg-use-tags"><span>Earth observation</span><span>Source verification</span><span>Spatial validation</span><span>AI reliability research</span></div></section>

      <section className="tg-final-cta"><div className="tg-cta-orb" aria-hidden="true" /><div className="tg-cta-content"><div className="tg-section-kicker">YOUR NEXT DECISION, BETTER GROUNDED</div><h2>Ready to verify your<br /> next claim?</h2><p>Bring your evidence. Start with a clearer picture.</p><button className="tg-button tg-button-light" onClick={onGetStarted}>Get Started <ArrowRight size={18} /></button></div><div className="tg-cta-stamp"><Check size={18} /> Evidence-led<br />from the start</div></section>

      <footer className="tg-footer" id="about"><div className="tg-footer-brand"><BrandMark /><div><strong>TRUST-GEO</strong><span>Geospatial AI Reliability &amp; Crash-Testing.</span></div></div><span className="tg-footer-note">A research prototype · Synthetic demo data</span></footer>
    </div>
  );
}
