import { getMatchOdds } from '../api/oddsApi.js';
import { getPlayerStats } from '../api/apiFootball.js';
import { getTeamNews } from '../api/newsApi.js';
import { getSofascoreRatings } from '../api/sofascore.js';

const TOKEN = import.meta.env.VITE_API_TOKEN;
const BASE = '/api/football/v4';

async function fd(path, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${BASE}${path}`, { headers: { 'X-Auth-Token': TOKEN } });
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 6000));
      continue;
    }
    if (!res.ok) return null;
    return res.json();
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractPreferredFormation(matches, teamId) {
  const tally = {};
  for (const m of matches) {
    const isHome = m.homeTeam?.id === teamId;
    const formation = isHome ? m.homeTeam?.formation : m.awayTeam?.formation;
    if (formation) tally[formation] = (tally[formation] || 0) + 1;
  }
  if (!Object.keys(tally).length) return null;
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return {
    formation: sorted[0][0],
    summary: `Used ${sorted[0][0]} in ${sorted[0][1]} of last ${matches.length} matches`,
    breakdown: sorted.map(([f, c]) => `${f} (×${c})`).join(', '),
  };
}

async function getRecentMatches(teamId) {
  const data = await fd(`/teams/${teamId}/matches?status=FINISHED&limit=5`);
  const matches = data?.matches ?? [];
  const preferredFormation = extractPreferredFormation(matches, teamId);
  return { matches, preferredFormation };
}

async function getSquadInfo(teamId) {
  const data = await fd(`/teams/${teamId}`);
  const squad = (data?.squad ?? []).filter(p => {
    if (!p.name || !p.position) return false;
    const name = p.name.toLowerCase();
    const placeholderPatterns = ['player', 'engine', 'creator', 'striker', 'midfielder', 'defender', 'keeper'];
    return !placeholderPatterns.some(pat => name.includes(pat));
  });
  return { squad, coach: data?.coach?.name ?? 'Unknown' };
}

export async function runScout({ homeTeamId, awayTeamId, homeTeamName, awayTeamName }) {
  // Sequential fetches to avoid 429
  const homeMatches = await getRecentMatches(homeTeamId); await sleep(700);
  const awayMatches = await getRecentMatches(awayTeamId); await sleep(700);
  const homeSquad = await getSquadInfo(homeTeamId); await sleep(700);
  const awaySquad = await getSquadInfo(awayTeamId);

  // Parallel enrichment
  const [homeOdds, homeStats, homeNews, homeSofascore, awayStats, awayNews, awaySofascore] = await Promise.all([
    getMatchOdds(homeTeamName, awayTeamName),
    getPlayerStats(homeTeamName),
    getTeamNews(homeTeamName),
    getSofascoreRatings(homeTeamName),
    getPlayerStats(awayTeamName),
    getTeamNews(awayTeamName),
    getSofascoreRatings(awayTeamName),
  ]);

  return {
    homeTeam: {
      name: homeTeamName,
      id: homeTeamId,
      recentMatches: homeMatches.matches,
      preferredFormation: homeMatches.preferredFormation,
      squad: homeSquad.squad,
      coach: homeSquad.coach,
      playerStats: homeStats,
      recentNews: homeNews,
      sofascoreRatings: homeSofascore,
    },
    awayTeam: {
      name: awayTeamName,
      id: awayTeamId,
      recentMatches: awayMatches.matches,
      preferredFormation: awayMatches.preferredFormation,
      squad: awaySquad.squad,
      coach: awaySquad.coach,
      playerStats: awayStats,
      recentNews: awayNews,
      sofascoreRatings: awaySofascore,
    },
    odds: homeOdds,
  };
}
