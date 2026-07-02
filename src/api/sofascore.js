async function ss(path) {
  try {
    const res = await fetch(`/api/sofascore${path}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function resolveTeamId(name) {
  const data = await ss(`/search/multi-search?q=${encodeURIComponent(name)}`);
  const teams = data?.results?.filter(r => r.type === 'team' && r.entity?.national);
  if (teams?.length) return teams[0].entity.id;
  const all = data?.results?.filter(r => r.type === 'team');
  return all?.[0]?.entity?.id ?? null;
}

export async function getSofascoreRatings(teamName) {
  try {
    const teamId = await resolveTeamId(teamName);
    if (!teamId) return {};
    const data = await ss(`/team/${teamId}/players`);
    const players = data?.players?.slice(0, 10) ?? [];
    const ratings = {};
    for (const p of players) {
      const pid = p.player?.id;
      if (!pid) continue;
      const stats = await ss(`/player/${pid}/statistics/accumulation`);
      const rating = stats?.statistics?.rating;
      if (rating) ratings[p.player.name] = parseFloat(rating).toFixed(2);
    }
    return ratings;
  } catch {
    return {};
  }
}
