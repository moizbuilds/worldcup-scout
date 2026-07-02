const BASE_URL = '/api/fd';
const TOKEN = import.meta.env.VITE_API_TOKEN;
const WC_ID = 'WC';

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': TOKEN },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getMatches() {
  return request(`/competitions/${WC_ID}/matches`);
}

export async function getStandings() {
  return request(`/competitions/${WC_ID}/standings`);
}

export async function getScorers() {
  return request(`/competitions/${WC_ID}/scorers`);
}

export async function getMatch(id) {
  return request(`/matches/${id}`);
}
