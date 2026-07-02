const API_KEY = import.meta.env.VITE_ODDS_API_KEY;

function normalise(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export async function getMatchOdds(homeTeam, awayTeam) {
  try {
    const res = await fetch(
      `/api/odds/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${API_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const home = normalise(homeTeam);
    const away = normalise(awayTeam);
    const match = data.find(m =>
      normalise(m.home_team).includes(home.split(' ')[0]) ||
      normalise(m.away_team).includes(away.split(' ')[0])
    );
    if (!match) return { home: 2.5, draw: 3.2, away: 2.8, source: 'placeholder' };
    const market = match.bookmakers?.[0]?.markets?.[0];
    if (!market) return null;
    const outcomes = market.outcomes;
    return {
      home: outcomes.find(o => normalise(o.name).includes(home.split(' ')[0]))?.price ?? 2.5,
      draw: outcomes.find(o => o.name === 'Draw')?.price ?? 3.2,
      away: outcomes.find(o => normalise(o.name).includes(away.split(' ')[0]))?.price ?? 2.8,
      source: match.bookmakers[0].title,
    };
  } catch {
    return { home: 2.5, draw: 3.2, away: 2.8, source: 'placeholder' };
  }
}
