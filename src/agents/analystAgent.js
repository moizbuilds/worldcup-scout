const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

function buildPrompt(scout) {
  const { homeTeam, awayTeam } = scout;

  const formatStats = (stats) => stats.slice(0, 8).map(p =>
    `  ${p.name} | Goals: ${p.goals} | Assists: ${p.assists} | Pass%: ${p.passAccuracy ?? 'N/A'} | Rating: ${p.rating ?? 'N/A'} | Club: ${p.club}`
  ).join('\n');

  const formatRatings = (ratings) => Object.entries(ratings).slice(0, 6).map(
    ([name, r]) => `  ${name}: ${r}`
  ).join('\n');

  const formatNews = (news) => news.slice(0, 4).map(
    n => `  - [${n.source}] ${n.title}`
  ).join('\n');

  const formatForm = (matches, teamName) => matches.slice(0, 5).map(m => {
    const isHome = m.homeTeam?.name === teamName;
    const gs = isHome ? m.score?.fullTime?.home : m.score?.fullTime?.away;
    const gc = isHome ? m.score?.fullTime?.away : m.score?.fullTime?.home;
    const opp = isHome ? m.awayTeam?.name : m.homeTeam?.name;
    const result = gs > gc ? 'W' : gs < gc ? 'L' : 'D';
    return `  ${result} ${gs}-${gc} vs ${opp} (${m.competition?.name ?? ''})`;
  }).join('\n');

  return `You are a world-class football analyst for the 2026 FIFA World Cup.

Analyse this upcoming match and return ONLY valid JSON in the exact structure below.

RULES:
- RULE 0: Sentiment must cite real headlines from the news data provided. Do not invent sentiment.
- RULE 1: keyPlayers must include EXACTLY 5 real players for BOTH home and away teams. Use the squad + API-Football data. Never leave an array empty.
- RULE 2: Player profiles must reference actual stats from API-Football where available.
- RULE 3: Tactical breakdown must be 2 paragraphs: (1) formation matchup, (2) key vulnerabilities.
- RULE 4: Use the provided formation data as the definitive source. Do not guess.

=== HOME TEAM: ${homeTeam.name} ===
Coach: ${homeTeam.coach}
Preferred Formation: ${homeTeam.preferredFormation?.formation ?? 'Unknown'} — ${homeTeam.preferredFormation?.summary ?? ''}
Squad (select from these real names only): ${homeTeam.squad.slice(0, 20).map(p => `${p.name} (${p.position})`).join(', ')}

API-Football Stats:
${formatStats(homeTeam.playerStats)}

Sofascore Ratings:
${formatRatings(homeTeam.sofascoreRatings)}

Recent Form:
${formatForm(homeTeam.recentMatches, homeTeam.name)}

Recent News Headlines:
${formatNews(homeTeam.recentNews)}

=== AWAY TEAM: ${awayTeam.name} ===
Coach: ${awayTeam.coach}
Preferred Formation: ${awayTeam.preferredFormation?.formation ?? 'Unknown'} — ${awayTeam.preferredFormation?.summary ?? ''}
Squad (select from these real names only): ${awayTeam.squad.slice(0, 20).map(p => `${p.name} (${p.position})`).join(', ')}

API-Football Stats:
${formatStats(awayTeam.playerStats)}

Sofascore Ratings:
${formatRatings(awayTeam.sofascoreRatings)}

Recent Form:
${formatForm(awayTeam.recentMatches, awayTeam.name)}

Recent News Headlines:
${formatNews(awayTeam.recentNews)}

=== ODDS ===
Home win: ${scout.odds?.home ?? 'N/A'} | Draw: ${scout.odds?.draw ?? 'N/A'} | Away win: ${scout.odds?.away ?? 'N/A'}

Return this exact JSON structure:
{
  "homeTeam": {
    "tacticalProfile": "2 sentences on style and press",
    "formation": "${homeTeam.preferredFormation?.formation ?? '4-3-3'}",
    "strengths": ["strength1", "strength2", "strength3"],
    "vulnerabilities": ["vuln1", "vuln2"],
    "keyPlayers": [
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "Club Season stat or international stat", "excitementRating": 8, "whyWatch": "1 sentence citing stats" },
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 7, "whyWatch": "1 sentence" },
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 8, "whyWatch": "1 sentence" },
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 9, "whyWatch": "1 sentence" },
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 7, "whyWatch": "1 sentence" }
    ],
    "pressingSentiment": "positive/negative/mixed",
    "sentimentSummary": "1 sentence grounded in the real headlines above"
  },
  "awayTeam": {
    "tacticalProfile": "2 sentences on style and press",
    "formation": "${awayTeam.preferredFormation?.formation ?? '4-4-2'}",
    "strengths": ["strength1", "strength2", "strength3"],
    "vulnerabilities": ["vuln1", "vuln2"],
    "keyPlayers": [
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 8, "whyWatch": "1 sentence" },
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 7, "whyWatch": "1 sentence" },
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 8, "whyWatch": "1 sentence" },
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 9, "whyWatch": "1 sentence" },
      { "name": "Real Player Name", "position": "Position", "clubVsInternational": "stat", "excitementRating": 7, "whyWatch": "1 sentence" }
    ],
    "pressingSentiment": "positive/negative/mixed",
    "sentimentSummary": "1 sentence grounded in the real headlines above"
  },
  "tacticalBreakdown": "Paragraph 1: formation matchup analysis. Paragraph 2: key vulnerabilities and how each team can exploit them.",
  "formSummary": {
    "home": "2 sentence summary of recent form",
    "away": "2 sentence summary of recent form"
  },
  "prediction": {
    "result": "Home Win / Draw / Away Win",
    "scoreline": "2-1",
    "confidence": 72,
    "reasoning": "2 sentences"
  }
}`;
}

function genericFallback(homeTeam, awayTeam) {
  return {
    homeTeam: {
      tacticalProfile: `${homeTeam} set up in a compact block, looking to transition quickly.`,
      formation: '4-3-3',
      strengths: ['Organized defence', 'Quick transitions', 'Set piece threat'],
      vulnerabilities: ['Exposed on counter', 'Lacks width'],
      keyPlayers: [
        { name: `${homeTeam} Captain`, position: 'Midfielder', clubVsInternational: 'Key figure', excitementRating: 8, whyWatch: 'Drives play from deep.' },
        { name: `${homeTeam} Striker`, position: 'Forward', clubVsInternational: 'Top scorer', excitementRating: 8, whyWatch: 'Clinical in front of goal.' },
        { name: `${homeTeam} Playmaker`, position: 'Attacking Mid', clubVsInternational: 'Creative force', excitementRating: 7, whyWatch: 'Dictates tempo.' },
        { name: `${homeTeam} Defender`, position: 'Centre-Back', clubVsInternational: 'Aerially dominant', excitementRating: 7, whyWatch: 'Leads from the back.' },
        { name: `${homeTeam} Winger`, position: 'Winger', clubVsInternational: 'Direct threat', excitementRating: 7, whyWatch: 'Beats defenders with pace.' },
      ],
      pressingSentiment: 'mixed',
      sentimentSummary: 'Mixed reports ahead of the tournament.',
    },
    awayTeam: {
      tacticalProfile: `${awayTeam} press high and look to dominate possession.`,
      formation: '4-2-3-1',
      strengths: ['High press', 'Technical quality', 'Experience'],
      vulnerabilities: ['Susceptible to pace behind', 'Ageing squad'],
      keyPlayers: [
        { name: `${awayTeam} Captain`, position: 'Midfielder', clubVsInternational: 'Key figure', excitementRating: 8, whyWatch: 'Controls the midfield.' },
        { name: `${awayTeam} Striker`, position: 'Forward', clubVsInternational: 'Top scorer', excitementRating: 9, whyWatch: 'World-class finisher.' },
        { name: `${awayTeam} Playmaker`, position: 'Attacking Mid', clubVsInternational: 'Creative force', excitementRating: 8, whyWatch: 'Unlocks defences.' },
        { name: `${awayTeam} Defender`, position: 'Centre-Back', clubVsInternational: 'Commanding', excitementRating: 7, whyWatch: 'Marshals the defence.' },
        { name: `${awayTeam} Winger`, position: 'Winger', clubVsInternational: 'Direct dribbler', excitementRating: 8, whyWatch: 'Causes chaos wide.' },
      ],
      pressingSentiment: 'positive',
      sentimentSummary: 'Positive momentum building into the tournament.',
    },
    tacticalBreakdown: `The ${homeTeam} ${`4-3-3`} versus ${awayTeam}'s ${`4-2-3-1`} sets up a fascinating midfield battle. The home side's compact shape will look to stifle the away team's creative outlet. ${awayTeam}'s vulnerability to pace in behind could prove decisive if ${homeTeam} execute their counter-attacking game plan.`,
    formSummary: {
      home: `${homeTeam} have been solid in recent outings with a mix of results.`,
      away: `${awayTeam} arrive in decent form with strong defensive performances.`,
    },
    prediction: {
      result: 'Draw',
      scoreline: '1-1',
      confidence: 55,
      reasoning: 'An evenly matched contest on paper. Both teams capable of snatching it late.',
    },
  };
}

export async function runAnalyst(scoutReport) {
  const { homeTeam, awayTeam } = scoutReport;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: buildPrompt(scoutReport) }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Analyst fallback:', err.message);
    return genericFallback(homeTeam.name, awayTeam.name);
  }
}
