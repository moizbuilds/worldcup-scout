import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MatchList from './components/MatchList';
import Standings from './components/Standings';
import TopScorers from './components/TopScorers';
import ScoutTab from './components/ScoutTab';
import { getMatches, getStandings, getScorers } from './api/football';
import './App.css';

const TABS = [
  { id: 'matches', label: 'Matches' },
  { id: 'standings', label: 'Standings' },
  { id: 'scorers', label: 'Top Scorers' },
  { id: 'scout', label: '🔍 Scout' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [scoutMatch, setScoutMatch] = useState(null);

  function handleScout(matchInfo) {
    setScoutMatch(matchInfo);
    setActiveTab('scout');
  }

  const fetchAll = useCallback(async () => {
    try {
      const [matchData, standingsData, scorersData] = await Promise.all([
        getMatches(),
        getStandings(),
        getScorers(),
      ]);
      setMatches(matchData.matches ?? []);
      setStandings(standingsData.standings ?? []);
      setScorers(scorersData.scorers ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <div className="app">
      <Header lastUpdated={lastUpdated} />

      <nav className="tab-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading World Cup data…</p>
          </div>
        )}
        {!loading && error && (
          <div className="error-state">
            <p>Could not load data: {error}</p>
            <button className="retry-btn" onClick={fetchAll}>Retry</button>
          </div>
        )}
        {!loading && !error && (
          <>
            {activeTab === 'matches' && <MatchList matches={matches} onScout={handleScout} />}
            {activeTab === 'standings' && <Standings standings={standings} />}
            {activeTab === 'scorers' && <TopScorers scorers={scorers} />}
            {activeTab === 'scout' && (
              <ScoutTab
                initialMatch={scoutMatch}
                key={scoutMatch ? `${scoutMatch.homeTeamId}-${scoutMatch.awayTeamId}` : 'empty'}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
