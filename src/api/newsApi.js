const KEY = import.meta.env.VITE_NEWSAPI_KEY;

export async function getTeamNews(teamName) {
  try {
    const q = encodeURIComponent(`"${teamName}" football World Cup 2026`);
    const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const res = await fetch(
      `/api/news/everything?q=${q}&from=${from}&language=en&sortBy=relevancy&pageSize=5&apiKey=${KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles ?? []).map(a => ({
      title: a.title,
      source: a.source?.name,
      publishedAt: a.publishedAt,
      description: a.description,
    }));
  } catch {
    return [];
  }
}
