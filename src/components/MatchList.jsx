import { useState } from 'react';
import MatchCard from './MatchCard';
import MatchDetail from './MatchDetail';

const FILTERS = ['All', 'Live', 'Today', 'Results', 'Upcoming'];

function groupByDate(matches) {
  const groups = {};
  matches.forEach(m => {
    const key = new Date(m.utcDate).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups).sort(([a], [b]) => new Date(a) - new Date(b));
}

function formatDateHeading(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MatchList({ matches, onScout }) {
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  const today = new Date().toDateString();
  const liveCount = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED').length;

  const filtered = matches.filter(m => {
    if (filter === 'Live') return m.status === 'IN_PLAY' || m.status === 'PAUSED';
    if (filter === 'Today') return new Date(m.utcDate).toDateString() === today;
    if (filter === 'Results') return m.status === 'FINISHED';
    if (filter === 'Upcoming') return m.status === 'TIMED' || m.status === 'SCHEDULED';
    return true;
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="match-list-container">
      <div className="filter-pills">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-pill${filter === f ? ' filter-pill--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === 'Live' && liveCount > 0 && (
              <span className="live-count">{liveCount}</span>
            )}
          </button>
        ))}
      </div>

      {grouped.length === 0 && (
        <p className="no-matches">No matches found for this filter.</p>
      )}

      {grouped.map(([dateStr, dayMatches]) => (
        <div key={dateStr} className="date-group">
          <h2 className="date-heading">{formatDateHeading(dateStr)}</h2>
          <div className="match-grid">
            {dayMatches.map(m => (
              <MatchCard key={m.id} match={m} onScout={onScout} onSelect={setSelectedId} />
            ))}
          </div>
        </div>
      ))}

      {selectedId && (
        <MatchDetail matchId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
