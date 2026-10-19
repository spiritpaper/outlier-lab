import { test } from 'node:test';
import assert from 'node:assert/strict';

test('pruning keeps calibrated screenings and recently active conversations', async () => {
  const store = {};
  globalThis.chrome = { storage: { local: {
    async get(k) { const l = k == null ? Object.keys(store) : typeof k === 'string' ? [k] : k; return Object.fromEntries(l.filter((x) => x in store).map((x) => [x, structuredClone(store[x])])); },
    async set(o) { Object.assign(store, structuredClone(o)); },
    async remove(k) { for (const x of [].concat(k)) delete store[x]; },
  } } };
  const { saveScreening, listScreenings, MAX_SCREENINGS } = await import('../src/lib/screening-store.js');
  await saveScreening({ id: 'calibrated', kind: 'screening', at: 1, accuracy: { n: 1 } });
  await saveScreening({ id: 'chat', kind: 'chat', at: 2, updatedAt: 10 ** 13 });
  for (let i = 0; i < MAX_SCREENINGS + 5; i++) await saveScreening({ id: `p${i}`, kind: 'pitch', at: 1000 + i });
  const ids = (await listScreenings()).map((s) => s.id);
  assert.ok(ids.includes('calibrated'), 'checked against reality: never pruned');
  assert.ok(ids.includes('chat'), 'recently active conversation kept');
  assert.ok(!ids.includes('p0'), 'the least recently used goes');
  assert.equal(ids.length, MAX_SCREENINGS + 1);
});
