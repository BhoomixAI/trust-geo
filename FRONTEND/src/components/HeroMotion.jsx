function SatelliteGlyph({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 48" fill="none">
      <path d="M3 5 27 12 21 32 1 25 3 5ZM43 16l19 7-5 20-19-7 5-20Z" fill="#06345A" stroke="#29D8FF" strokeWidth="1.5" />
      <path d="m7 8 16 5m-18 0 17 5m-17 1 14 4m-1-7 3-9m-7 18 4-10m33 5-2 18m-5-17-2 17m-4-19-2 18" stroke="#65EDFF" strokeWidth=".8" opacity=".8" />
      <path d="m24 16 13-5 13 10-5 13-14 2-9-9 2-11Z" fill="#D7F7FF" stroke="#6CEAFF" strokeWidth="1.5" />
      <path d="m27 18 10 4 9 8m-6-17-4 9-2 14" stroke="#1680BB" strokeWidth="1.2" />
      <circle cx="37" cy="24" r="3" fill="#087BFF" />
      <path d="M51 21q8-6 10-13M50 32q8 6 12 6" stroke="#9BEFFF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="61" cy="8" r="2" fill="#B8FAFF" />
      <path d="m21 23-14-5" stroke="#48DFFF" strokeWidth="3" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export default function HeroMotion() {
  return (
    <div className="tg-motion-layer" aria-hidden="true">
      <div className="tg-satellite-deploy tg-satellite-deploy-a"><span className="tg-satellite-thruster" /><SatelliteGlyph className="tg-satellite-glyph" /></div>
      <div className="tg-satellite-deploy tg-satellite-deploy-b"><span className="tg-satellite-thruster" /><SatelliteGlyph className="tg-satellite-glyph" /></div>
      <div className="tg-distant-satellite"><SatelliteGlyph className="tg-satellite-glyph" /></div>
      <svg className="tg-signal-overlay" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <defs><filter id="signal-glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <path className="tg-deploy-signal-line" d="M620 610 Q600 655 565 710" />
        <circle className="tg-deploy-signal-dot" r="6" filter="url(#signal-glow)"><animateMotion dur="20s" begin="1.3s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;.98;1" keyTimes="0;.69;.78;1" path="M620 610 Q600 655 565 710" /></circle>
        <ellipse className="tg-deploy-energy" cx="565" cy="710" rx="22" ry="8" />
        <ellipse className="tg-deploy-energy tg-deploy-energy-late" cx="565" cy="710" rx="22" ry="8" />
      </svg>
    </div>
  );
}
