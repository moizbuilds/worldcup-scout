export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/fd/, '');
  const upstream = `https://api.football-data.org/v4${path}`;
  const response = await fetch(upstream, {
    headers: { 'X-Auth-Token': process.env.VITE_API_TOKEN },
  });
  const data = await response.json();
  res.status(response.status).json(data);
}
