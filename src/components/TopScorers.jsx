const MEDALS = ['🥇', '🥈', '🥉'];

export default function TopScorers({ scorers }) {
  if (!scorers.length) return <p className="no-data">Scorer data not yet available.</p>;

  return (
    <div className="scorers-container">
      <h2 className="scorers-title">Top Scorers</h2>
      <div className="scorers-list">
        {scorers.slice(0, 10).map((s, idx) => (
          <div key={s.player.id} className={`scorer-row scorer-row--${idx < 3 ? ['gold', 'silver', 'bronze'][idx] : 'default'}`}>
            <span className="scorer-rank">{MEDALS[idx] ?? idx + 1}</span>
            <img src={s.team?.crest} alt={s.team?.name} className="scorer-crest" />
            <div className="scorer-info">
              <span className="scorer-name">{s.player.name}</span>
              <span className="scorer-team">{s.team?.name}</span>
            </div>
            <span className="scorer-goals">{s.goals}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
