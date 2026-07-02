function formatGroup(group) {
  if (!group) return null;
  return group.replace('GROUP_', 'Group ');
}

export default function MatchCard({ match, onScout, onSelect }) {
  const { homeTeam, awayTeam, score, status, utcDate, minute, group, stage } = match;

  const homeScore = score?.fullTime?.home ?? score?.halfTime?.home ?? null;
  const awayScore = score?.fullTime?.away ?? score?.halfTime?.away ?? null;

  const isLive = status === 'IN_PLAY' || status === 'PAUSED';
  const isFinished = status === 'FINISHED';
  const isScheduled = status === 'TIMED' || status === 'SCHEDULED';

  const kickoffTime = new Date(utcDate).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  function statusLabel() {
    if (status === 'IN_PLAY') return `${minute ?? ''}′ LIVE`;
    if (status === 'PAUSED') return 'HT';
    if (status === 'FINISHED') return 'FT';
    if (isScheduled) return kickoffTime;
    return status;
  }

  const clickable = isFinished && onSelect;

  return (
    <div
      className={`match-card ${isLive ? 'match-card--live' : ''} ${isFinished ? 'match-card--finished' : ''} ${clickable ? 'match-card--clickable' : ''}`}
      onClick={clickable ? () => onSelect(match.id) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onSelect(match.id); } : undefined}
    >
      <div className="match-status-bar">
        <span className={`match-status ${isLive ? 'match-status--live' : ''}`}>
          {isLive && <span className="live-dot" />}
          {statusLabel()}
        </span>
        {group && stage === 'GROUP_STAGE' && (
          <span className="match-group">{formatGroup(group)}</span>
        )}
      </div>

      <div className="match-teams">
        <div className="team team--home">
          {homeTeam.crest && <img src={homeTeam.crest} alt={homeTeam.name} className="team-crest" />}
          <span className="team-name">{homeTeam.shortName ?? homeTeam.name}</span>
        </div>

        <div className="match-score">
          {homeScore !== null ? (
            <>
              <span className="score-digit">{homeScore}</span>
              <span className="score-sep">–</span>
              <span className="score-digit">{awayScore}</span>
            </>
          ) : (
            <span className="score-vs">VS</span>
          )}
        </div>

        <div className="team team--away">
          <span className="team-name">{awayTeam.shortName ?? awayTeam.name}</span>
          {awayTeam.crest && <img src={awayTeam.crest} alt={awayTeam.name} className="team-crest" />}
        </div>
      </div>

      {(match.venue || clickable) && (
        <div className="match-footer">
          <span>{match.venue ?? ''}</span>
          {clickable && <span className="report-hint">View report →</span>}
        </div>
      )}

      {(isScheduled || isLive) && onScout && homeTeam.id && awayTeam.id && (
        <button
          className="scout-btn"
          onClick={() => onScout({
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            homeTeamName: homeTeam.name,
            awayTeamName: awayTeam.name,
          })}
        >
          🔍 Scout this match
        </button>
      )}
    </div>
  );
}
