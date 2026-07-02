const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

function buildPrompt(scout, analyst) {
  const { homeTeam, awayTeam, odds } = scout;
  const home = analyst.homeTeam;
  const away = analyst.awayTeam;

  return `You are a broadcast journalist writing the pre-match intelligence report for the 2026 FIFA World Cup.

MATCH: ${homeTeam.name} vs ${awayTeam.name}

TACTICAL CONTEXT:
- ${homeTeam.name} play ${home.formation}: ${home.tacticalProfile}
- ${awayTeam.name} play ${away.formation}: ${away.tacticalProfile}
- Tactical breakdown: ${analyst.tacticalBreakdown}

KEY PLAYERS TO WATCH:
- ${homeTeam.name}: ${home.keyPlayers.map(p => `${p.name} (${p.position}) — ${p.whyWatch}`).join('; ')}
- ${awayTeam.name}: ${away.keyPlayers.map(p => `${p.name} (${p.position}) — ${p.whyWatch}`).join('; ')}

ODDS: ${homeTeam.name} ${odds?.home ?? 'N/A'} | Draw ${odds?.draw ?? 'N/A'} | ${awayTeam.name} ${odds?.away ?? 'N/A'}

PREDICTION: ${analyst.prediction.result} (${analyst.prediction.scoreline}) — ${analyst.prediction.reasoning}

RULES:
- Do NOT use phrases like "Game of the Century", "unmissable clash", "football fans worldwide". Write with intelligence and restraint.
- The matchStory must be 2–3 punchy broadcast-style sentences that frame the narrative.
- tacticalBreakdown must be exactly TWO paragraphs: (1) how the formations match up, (2) key vulnerabilities.
- playersToWatch must be exactly THREE separate paragraphs, one per player, each citing real stats or traits.
- boldPrediction is one confident declarative sentence, no hedging.

Return ONLY valid JSON:
{
  "matchStory": "2-3 broadcast sentences setting up the narrative",
  "tacticalBreakdown": "Para 1: formation matchup.\\n\\nPara 2: vulnerabilities and exploitation.",
  "playersToWatch": [
    "Full paragraph on player 1 with stats and why they matter.",
    "Full paragraph on player 2 with stats and why they matter.",
    "Full paragraph on player 3 with stats and why they matter."
  ],
  "boldPrediction": "One confident sentence on the outcome."
}`;
}

export async function runReporter(scoutReport, analystReport) {
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
        max_tokens: 3000,
        messages: [{ role: 'user', content: buildPrompt(scoutReport, analystReport) }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Reporter fallback:', err.message);
    return {
      matchStory: `${scoutReport.homeTeam.name} and ${scoutReport.awayTeam.name} meet in what promises to be a tactically fascinating World Cup encounter. Both sides arrive with points to prove and a nation's hopes on their shoulders.`,
      tacticalBreakdown: `${analystReport.homeTeam.formation} meets ${analystReport.awayTeam.formation} in a midfield battle that could define the match.\n\nThe key vulnerability lies in the spaces behind the respective defensive lines — the team that exploits transitions quickest will likely take the spoils.`,
      playersToWatch: [
        `${analystReport.homeTeam.keyPlayers[0]?.name} is the creative heartbeat of ${scoutReport.homeTeam.name}. Watch for their movement and ability to unlock the defensive structure.`,
        `${analystReport.awayTeam.keyPlayers[0]?.name} carries the attacking threat for ${scoutReport.awayTeam.name}. Their directness and quality in the final third will be critical.`,
        `The midfield battle will be shaped by set pieces and second balls — the team that wins this duel controls the tempo.`,
      ],
      boldPrediction: `${analystReport.prediction.result} — ${analystReport.prediction.scoreline}.`,
    };
  }
}
