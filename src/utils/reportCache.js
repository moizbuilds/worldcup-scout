const TTL = 86400000; // 24 hours

function cacheKey(home, away) {
  return `scout_report_${home}_vs_${away}`.toLowerCase().replace(/\s+/g, '_');
}

export function getCachedReport(home, away) {
  try {
    const raw = localStorage.getItem(cacheKey(home, away));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(cacheKey(home, away));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function setCachedReport(home, away, { scout, analyst, reporter }) {
  const now = Date.now();
  const entry = { scout, analyst, reporter, cachedAt: now, expiresAt: now + TTL };
  localStorage.setItem(cacheKey(home, away), JSON.stringify(entry));
}

export function clearCachedReport(home, away) {
  localStorage.removeItem(cacheKey(home, away));
}

export function formatCacheAge(cachedAt) {
  const diff = Date.now() - cachedAt;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m ago` : `${m}m ago`;
}

export function formatCacheExpiry(expiresAt) {
  const diff = expiresAt - Date.now();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
