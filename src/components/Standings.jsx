export default function Standings({ standings }) {
  if (!standings.length) return <p className="no-data">Standings not yet available.</p>;

  const groupStage = standings.filter(s => s.type === 'TOTAL');

  return (
    <div className="standings-container">
      {groupStage.map((group, i) => (
        <div key={i} className="standings-group">
          <h2 className="standings-group-title">{group.group ?? group.stage}</h2>
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="team-col">Team</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {group.table.map((row, idx) => (
                <tr key={row.team.id} className={idx < 2 ? 'row--qualify' : ''}>
                  <td>{row.position}</td>
                  <td className="team-col">
                    {row.team.crest && <img src={row.team.crest} alt={row.team.name} className="table-crest" />}
                    {row.team.shortName ?? row.team.name}
                  </td>
                  <td>{row.playedGames}</td>
                  <td>{row.won}</td>
                  <td>{row.draw}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDifference}</td>
                  <td className="pts">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
