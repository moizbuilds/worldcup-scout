const KEY = import.meta.env.VITE_APIFOOTBALL_KEY;

async function apif(path) {
  const res = await fetch(`/api/apifootball${path}`, { headers: { 'x-apisports-key': KEY } });
  if (!res.ok) return null;
  return res.json();
}

async function resolveTeamId(name) {
  const data = await apif(`/teams?name=${encodeURIComponent(name)}`);
  if (!data?.response?.length) return null;
  const national = data.response.find(t => t.team.national);
  return (national ?? data.response[0]).team.id;
}

export async function getPlayerStats(teamName) {
  try {
    const teamId = await resolveTeamId(teamName);
    if (!teamId) return [];

    // Try World Cup 2026 first (league 1), fall back to last club season
    for (const [league, season] of [[1, 2026], [null, 2024]]) {
      const path = league
        ? `/players?team=${teamId}&league=${league}&season=${season}`
        : `/players?team=${teamId}&season=${season}`;
      const data = await apif(path);
      const players = data?.response;
      if (players?.length) {
        return players.slice(0, 15).map(p => ({
          name: p.player.name,
          goals: p.statistics[0]?.goals?.total ?? 0,
          assists: p.statistics[0]?.goals?.assists ?? 0,
          passAccuracy: p.statistics[0]?.passes?.accuracy ?? null,
          dribbleSuccessRate: p.statistics[0]?.dribbles?.success ?? null,
          rating: p.statistics[0]?.games?.rating ?? null,
          club: p.statistics[0]?.team?.name ?? '',
          appearances: p.statistics[0]?.games?.appearences ?? 0,
        }));
      }
    }
    return [];
  } catch {
    return [];
  }
}
