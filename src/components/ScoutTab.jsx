import { useEffect, useRef, useState } from 'react';
import { runScout } from '../agents/scoutAgent';
import { runAnalyst } from '../agents/analystAgent';
import { runReporter } from '../agents/reporterAgent';
import { getCachedReport, setCachedReport, clearCachedReport, formatCacheAge, formatCacheExpiry } from '../utils/reportCache';

const TOC_SECTIONS = [
  { id: 'toc-story', label: 'Match Story' },
  { id: 'toc-odds', label: 'Odds' },
  { id: 'toc-sentiment', label: 'Sentiment' },
  { id: 'toc-tactics', label: 'Tactics' },
  { id: 'toc-form', label: 'Form' },
  { id: 'toc-breakdown', label: 'Breakdown' },
  { id: 'toc-players', label: 'Player Intel' },
  { id: 'toc-watch', label: 'Players to Watch' },
  { id: 'toc-prediction', label: 'Prediction' },
];

function FloatingTOC({ activeId }) {
  return (
    <nav className="scout-toc">
      <div className="scout-toc__title">Contents</div>
      {TOC_SECTIONS.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`scout-toc__item${activeId === s.id ? ' scout-toc__item--active' : ''}`}
          onClick={e => {
            e.preventDefault();
            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

function Stars({ n }) {
  return <span className="stars">{Array.from({ length: 10 }, (_, i) => (
    <span key={i} className={i < n ? 'star star--on' : 'star star--off'}>★</span>
  ))}</span>;
}

function isValidPlayerCard(p) {
  if (!p?.name || !p?.position) return false;
  const hasStats = (p.clubVsInternational && p.clubVsInternational.length > 5);
  const hasRating = p.excitementRating > 0;
  return hasStats || hasRating;
}

export default function ScoutTab({ initialMatch }) {
  const [matchInfo, setMatchInfo] = useState(initialMatch ?? null);
  const [status, setStatus] = useState('idle');
  const [step, setStep] = useState('');
  const [scout, setScout] = useState(null);
  const [analyst, setAnalyst] = useState(null);
  const [reporter, setReporter] = useState(null);
  const [cacheEntry, setCacheEntry] = useState(null);
  const [activeSection, setActiveSection] = useState('toc-story');
  const reportRef = useRef(null);

  // Scroll spy
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
    }, { threshold: 0.3 });
    TOC_SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [reporter]);

  useEffect(() => {
    if (initialMatch) {
      setMatchInfo(initialMatch);
    }
  }, [initialMatch]);

  useEffect(() => {
    if (matchInfo) generate(matchInfo);
  }, [matchInfo]);

  async function generate(info, forceRefresh = false) {
    const { homeTeamName, awayTeamName } = info;

    if (!forceRefresh) {
      const cached = getCachedReport(homeTeamName, awayTeamName);
      if (cached) {
        setScout(cached.scout);
        setAnalyst(cached.analyst);
        setReporter(cached.reporter);
        setCacheEntry(cached);
        setStatus('done');
        return;
      }
    }

    setStatus('running');
    setCacheEntry(null);

    try {
      setStep('🔍 Agent 1: Scouting match data…');
      const s = await runScout(info);
      setScout(s);

      setStep('🧠 Agent 2: Analysing tactics & players…');
      const a = await runAnalyst(s);
      setAnalyst(a);

      setStep('📝 Agent 3: Writing intelligence report…');
      const r = await runReporter(s, a);
      setReporter(r);

      setCachedReport(homeTeamName, awayTeamName, { scout: s, analyst: a, reporter: r });
      setCacheEntry(getCachedReport(homeTeamName, awayTeamName));
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setStep('❌ ' + err.message);
    }
  }

  function handleRefresh() {
    if (!matchInfo) return;
    clearCachedReport(matchInfo.homeTeamName, matchInfo.awayTeamName);
    setScout(null); setAnalyst(null); setReporter(null);
    generate(matchInfo, true);
  }

  if (!matchInfo) {
    return (
      <div className="scout-tab scout-tab--empty">
        <div className="scout-empty-state">
          <h2>🔍 World Cup Scout</h2>
          <p>Click <strong>Scout this match</strong> on any fixture in the Matches tab to generate a full AI intelligence report.</p>
        </div>
      </div>
    );
  }

  const { homeTeamName, awayTeamName } = matchInfo;

  return (
    <div className="scout-tab">
      {reporter && <FloatingTOC activeId={activeSection} />}
      <div className="scout-report-layout" ref={reportRef}>
        <div className="scout-header">
          <h1 className="scout-title">{homeTeamName} <span>vs</span> {awayTeamName}</h1>
          <div className="scout-subtitle">2026 FIFA World Cup — Intelligence Report</div>
        </div>

        {cacheEntry && (
          <div className="cache-bar">
            ⚡ Cached {formatCacheAge(cacheEntry.cachedAt)} — expires in {formatCacheExpiry(cacheEntry.expiresAt)}
            <button className="cache-bar__refresh" onClick={handleRefresh}>Force Refresh</button>
          </div>
        )}

        {status === 'running' && (
          <div className="scout-loading">
            <div className="scout-spinner" />
            <p>{step}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="scout-error">
            <p>{step}</p>
            <button onClick={handleRefresh}>Retry</button>
          </div>
        )}

        {reporter && analyst && scout && (
          <>
            {/* Match Story */}
            <section id="toc-story" className="scout-section">
              <h2>The Story</h2>
              <p className="scout-story">{reporter.matchStory}</p>
            </section>

            {/* Odds */}
            {scout.odds && (
              <section id="toc-odds" className="scout-section">
                <h2>Market Odds</h2>
                <div className="odds-bar">
                  <div className="odds-bar__item">
                    <span className="odds-bar__label">{homeTeamName}</span>
                    <span className="odds-bar__value">{scout.odds.home}</span>
                  </div>
                  <div className="odds-bar__item">
                    <span className="odds-bar__label">Draw</span>
                    <span className="odds-bar__value">{scout.odds.draw}</span>
                  </div>
                  <div className="odds-bar__item">
                    <span className="odds-bar__label">{awayTeamName}</span>
                    <span className="odds-bar__value">{scout.odds.away}</span>
                  </div>
                </div>
                {scout.odds.source && <div className="odds-source">Source: {scout.odds.source}</div>}
              </section>
            )}

            {/* Sentiment */}
            <section id="toc-sentiment" className="scout-section">
              <h2>Press Sentiment</h2>
              <div className="sentiment-grid">
                {[analyst.homeTeam, analyst.awayTeam].map((t, i) => (
                  <div key={i} className={`sentiment-card sentiment-card--${t.pressingSentiment}`}>
                    <div className="sentiment-card__team">{i === 0 ? homeTeamName : awayTeamName}</div>
                    <div className="sentiment-card__mood">{t.pressingSentiment}</div>
                    <p>{t.sentimentSummary}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tactical Profiles */}
            <section id="toc-tactics" className="scout-section">
              <h2>Tactical Profiles</h2>
              <div className="tactical-grid">
                {[
                  { team: homeTeamName, data: analyst.homeTeam },
                  { team: awayTeamName, data: analyst.awayTeam },
                ].map(({ team, data }) => (
                  <div key={team} className="tactical-card">
                    <div className="tactical-card__header">
                      <span className="tactical-card__team">{team}</span>
                      <span className="tactical-card__formation">{data.formation}</span>
                    </div>
                    <p className="tactical-card__profile">{data.tacticalProfile}</p>
                    <div className="tactical-card__strengths">
                      <strong>Strengths:</strong>
                      <ul>{data.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                    <div className="tactical-card__vulns">
                      <strong>Vulnerabilities:</strong>
                      <ul>{data.vulnerabilities?.map((v, i) => <li key={i}>{v}</li>)}</ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Form */}
            <section id="toc-form" className="scout-section">
              <h2>Recent Form</h2>
              <div className="form-grid">
                {[
                  { team: homeTeamName, matches: scout.homeTeam.recentMatches, summary: analyst.formSummary?.home },
                  { team: awayTeamName, matches: scout.awayTeam.recentMatches, summary: analyst.formSummary?.away },
                ].map(({ team, matches, summary }) => (
                  <div key={team} className="form-card">
                    <div className="form-card__team">{team}</div>
                    <div className="form-row">
                      {matches.slice(0, 5).map((m, i) => {
                        const isHome = m.homeTeam?.name === team;
                        const gs = isHome ? m.score?.fullTime?.home : m.score?.fullTime?.away;
                        const gc = isHome ? m.score?.fullTime?.away : m.score?.fullTime?.home;
                        const r = gs > gc ? 'W' : gs < gc ? 'L' : 'D';
                        return <span key={i} className={`form-dot form-dot--${r}`}>{r}</span>;
                      })}
                    </div>
                    {summary && <p className="form-summary">{summary}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* Tactical Breakdown */}
            <section id="toc-breakdown" className="scout-section">
              <h2>Tactical Breakdown</h2>
              {reporter.tacticalBreakdown.split('\n\n').map((para, i) => (
                <p key={i} className="scout-para">{para}</p>
              ))}
            </section>

            {/* Player Intelligence */}
            <section id="toc-players" className="scout-section">
              <h2>Player Intelligence</h2>
              {[
                { team: homeTeamName, players: analyst.homeTeam.keyPlayers },
                { team: awayTeamName, players: analyst.awayTeam.keyPlayers },
              ].map(({ team, players }) => {
                const valid = (players ?? []).filter(isValidPlayerCard);
                return (
                  <div key={team} className="player-section">
                    <h3 className="player-section__team">{team}</h3>
                    {valid.length === 0 ? (
                      <p className="player-unavailable">Player data unavailable for this squad.</p>
                    ) : (
                      <div className="player-grid">
                        {valid.map((p, i) => (
                          <div key={i} className="player-card">
                            <div className="player-card__name">{p.name}</div>
                            <div className="player-card__position">{p.position}</div>
                            {p.clubVsInternational && (
                              <div className="player-card__comp">{p.clubVsInternational}</div>
                            )}
                            <Stars n={p.excitementRating ?? 0} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            {/* Players to Watch */}
            {reporter.playersToWatch?.length > 0 && (
              <section id="toc-watch" className="scout-section">
                <h2>Players to Watch</h2>
                <div className="ptw-grid">
                  {reporter.playersToWatch.map((para, i) => (
                    <div key={i} className="ptw-card">
                      <span className="ptw-card__num">0{i + 1}</span>
                      <p>{para}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Prediction */}
            <section id="toc-prediction" className="scout-section">
              <h2>Prediction</h2>
              <div className="prediction-block">
                <div className="prediction-block__result">{analyst.prediction?.result}</div>
                <div className="prediction-block__score">{analyst.prediction?.scoreline}</div>
                <div className="prediction-block__confidence">
                  Confidence: {analyst.prediction?.confidence}%
                </div>
                <p className="prediction-block__reasoning">{analyst.prediction?.reasoning}</p>
                <div className="prediction-block__bold">{reporter.boldPrediction}</div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
