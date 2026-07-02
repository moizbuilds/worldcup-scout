import { useEffect, useState } from 'react';
import { getMatch } from '../api/football';

function goalTag(type) {
  if (type === 'OWN') return 'OG';
  if (type === 'PENALTY') return 'P';
  return null;
}

export default function MatchDetail({ matchId, onClose }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMatch(matchId)
      .then(d => { if (active) { setMatch(d); setError(null); } })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [matchId]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const home = match?.homeTeam;
  const away = match?.awayTeam;
  const goals = match?.goals ?? [];
  const homeScore = match?.score?.fullTime?.home ?? null;
  const awayScore = match?.score?.fullTime?.away ?? null;
  const referee = match?.referees?.find(r => r.type === 'REFEREE') ?? match?.referees?.[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {loading && (
          <div className="modal-loading">
            <div className="spinner" />
            <p>Loading match report…</p>
          </div>
        )}

        {!loading && error && (
          <div className="modal-error">
            <p>Could not load match report: {error}</p>
          </div>
        )}

        {!loading && !error && match && (
          <>
            <div className="modal-scoreline">
              <div className="modal-team modal-team--home">
                {home.crest && <img src={home.crest} alt={home.name} className="modal-crest" />}
                <span className="modal-team-name">{home.name}</span>
              </div>
              <div className="modal-score">
                <span className="modal-score-digit">{homeScore}</span>
                <span className="modal-score-sep">–</span>
                <span className="modal-score-digit">{awayScore}</span>
              </div>
              <div className="modal-team modal-team--away">
                {away.crest && <img src={away.crest} alt={away.name} className="modal-crest" />}
                <span className="modal-team-name">{away.name}</span>
              </div>
            </div>
            <div className="modal-status">Full Time</div>

            <div className="modal-section">
              <h3 className="modal-section-title">Goalscorers</h3>
              {goals.length === 0 ? (
                <p className="modal-empty">
                  {homeScore === 0 && awayScore === 0
                    ? 'No goals in this match.'
                    : 'Detailed goalscorer data is not available for this match.'}
                </p>
              ) : (
                <ul className="goal-list">
                  {goals.map((g, i) => {
                    const tag = goalTag(g.type);
                    return (
                      <li key={i} className="goal-row">
                        <span className="goal-minute">{g.minute}′{g.injuryTime ? `+${g.injuryTime}` : ''}</span>
                        <span className="goal-scorer">
                          {g.scorer?.name ?? 'Unknown'}
                          {tag && <span className="goal-tag">{tag}</span>}
                          {g.assist && <span className="goal-assist">assist: {g.assist.name}</span>}
                        </span>
                        <span className="goal-team">{g.team?.name}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="modal-section modal-info">
              {match.competition?.name && <div><span>Competition</span><strong>{match.competition.name}</strong></div>}
              {match.stage && <div><span>Stage</span><strong>{match.stage.replace(/_/g, ' ')}</strong></div>}
              {match.group && <div><span>Group</span><strong>{match.group.replace('GROUP_', 'Group ')}</strong></div>}
              {match.venue && <div><span>Venue</span><strong>{match.venue}</strong></div>}
              {referee && <div><span>Referee</span><strong>{referee.name}</strong></div>}
              {match.utcDate && <div><span>Date</span><strong>{new Date(match.utcDate).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
