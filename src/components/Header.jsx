import { useEffect, useState } from 'react';

export default function Header({ lastUpdated }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <img
          src="https://upload.wikimedia.org/wikipedia/en/thumb/1/17/2026_FIFA_World_Cup_emblem.svg/250px-2026_FIFA_World_Cup_emblem.svg.png"
          alt="FIFA World Cup 2026"
          className="header-logo"
        />
        <div className="header-title-block">
          <h1 className="header-title">FIFA World Cup <span>2026</span></h1>
          <span className="header-subtitle">USA · Canada · Mexico</span>
        </div>
      </div>
      <div className="header-right">
        <div className="header-clock">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        <div className="header-date">{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        {lastUpdated && (
          <div className="header-updated">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        )}
      </div>
    </header>
  );
}
