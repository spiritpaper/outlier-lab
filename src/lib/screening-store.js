// Saved test screenings: one storage key each (`sim:<id>`), newest kept.

const PREFIX = 'sim:';
export const MAX_SCREENINGS = 60;

export async function listScreenings({ projectId = null } = {}) {
  const all = await chrome.storage.local.get(null);
  return Object.entries(all)
    .filter(([k]) => k.startsWith(PREFIX))
    .map(([, v]) => v)
    .filter((v) => !projectId || v.projectId === projectId)
    .sort((a, b) => b.at - a.at);
}

export async function getScreening(id) {
  const { [PREFIX + id]: v } = await chrome.storage.local.get(PREFIX + id);
  return v ?? null;
}

export async function saveScreening(sim) {
  const id = sim.id ?? `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const saved = { ...sim, id, at: sim.at ?? Date.now() };
  await chrome.storage.local.set({ [PREFIX + id]: saved });
  // Keep storage bounded: drop the least recently used beyond the limit, but
  // never one checked against the real numbers (calibration learns from those)
  // or the one just saved.
  const all = await listScreenings();
  const extra = all.filter((s) => !s.accuracy && s.id !== id)
    .sort((a, b) => (b.updatedAt ?? b.at) - (a.updatedAt ?? a.at))
    .slice(MAX_SCREENINGS - 1)
    .map((s) => PREFIX + s.id);
  if (extra.length) await chrome.storage.local.remove(extra);
  return saved;
}

export async function deleteScreening(id) {
  await chrome.storage.local.remove(PREFIX + id);
  return true;
}
