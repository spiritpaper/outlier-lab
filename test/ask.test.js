import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonObject, parsePitches, cleanPitch, scorePitches, cleanReplies, historyText } from '../src/lib/ask.js';
import { pitchPrompt, audienceChatPrompt } from '../src/lib/ai.js';
import { normalizeAvatar } from '../src/lib/avatars.js';

const avatars = [
  normalizeAvatar({ id: 'a', name: 'Maya', weight: 0.5 }),
  normalizeAvatar({ id: 'b', name: 'Raj', weight: 0.3 }),
  normalizeAvatar({ id: 'c', name: 'Lena', weight: 0.2 }),
];

test('pitches come one per line, cleaned, up to four', () => {
  assert.deepEqual(parsePitches('1. Build a game in 7 days\n- Why I quit Unity\n\nok\n• Rust for game devs\nFive\nSix ideas'), ['Build a game in 7 days', 'Why I quit Unity', 'Rust for game devs', 'Five']);
});

test('pitch answers are cleaned and scored by audience share', () => {
  const raw = extractJsonObject('Here:\n```json\n' + JSON.stringify({
    viewers: [
      { id: 'a', pitches: [{ pitch: 1, interest: 'YES', why: 'fun', expect: 'a finished game' }, { pitch: 2, interest: 'no' }] },
      { id: 'b', pitches: [{ pitch: 1, interest: 'maybe' }, { pitch: 2, interest: 'yes', instead: 'more code' }, { pitch: 9, interest: 'yes' }] },
      { id: 'zz', pitches: [{ pitch: 1, interest: 'yes' }] },
    ],
    takeaways: '- Idea 1 pulls hardest',
  }) + '\n```');
  const { viewers, takeaways } = cleanPitch(raw, avatars, 2);
  assert.deepEqual(Object.keys(viewers), ['a', 'b']);
  assert.equal(viewers.a.answers[0].interest, 'yes');
  assert.equal(takeaways, '- Idea 1 pulls hardest');
  const sc = scorePitches(avatars, viewers, ['Game in 7 days', 'Quit Unity']);
  const near = (x) => Math.round(x * 1000) / 1000;
  assert.equal(near(sc.pitches[0].interest), 0.65);
  assert.equal(near(sc.pitches[1].interest), 0.3);
  assert.equal(sc.best, 0);
  assert.deepEqual(sc.pitches[0].winsOver, ['a']);
  assert.deepEqual(sc.pitches[1].winsOver, []);
  assert.deepEqual(sc.pitches[0].expectations, ['a finished game']);
  assert.deepEqual(sc.pitches[1].wishes, ['more code']);
  assert.throws(() => extractJsonObject('[1,2]'), /unexpected format/);
});

test('chat replies keep only known viewers with something to say', () => {
  const r = cleanReplies([{ id: 'a', reply: 'Yes please' }, { id: 'b', reply: 'null' }, { id: 'c', reply: '' }, { id: 'x', reply: 'hi' }], avatars);
  assert.deepEqual(r, [{ id: 'a', reply: 'Yes please' }]);
  assert.equal(historyText([{ from: 'you', text: 'Q?' }, { from: 'a', text: 'A.' }], { a: 'Maya' }), 'CREATOR: Q?\nMaya: A.');
});

test('the prompts ask for realism, own voices and JSON', () => {
  const p = pitchPrompt({ avatars: ['x'], pitches: ['One', 'Two'], context: 'angle' });
  assert.match(p.prompt, /1\. One\n2\. Two/);
  assert.match(p.prompt, /most ideas don't interest most people/);
  assert.match(p.system, /without judging the viewer/);
  const g = audienceChatPrompt({ avatars: ['x', 'y'], question: 'Longer or shorter?', history: 'CREATOR: hi' });
  assert.match(g.prompt, /stay quiet: leave them out/);
  assert.match(g.prompt, /CREATOR: hi/);
  assert.match(audienceChatPrompt({ avatars: ['x'], question: 'Q', single: true }).prompt, /Answer as this viewer/);
});

test('simText: every kind of saved result copies as readable text, never "undefined"', async () => {
  const { simText } = await import('../src/lab/report.js');
  const pitches = ['Idea one', 'Idea two'];
  const viewers = cleanPitch({ viewers: [{ id: 'a', pitches: [{ pitch: 1, interest: 'yes', why: 'love it' }, { pitch: 2, interest: 'no' }] }], takeaways: 'Go with one.' }, avatars, 2);
  const base = { at: 0, groupName: 'Core', avatars };
  const pitch = simText({ ...base, kind: 'pitch', title: '2 ideas', pitches, ...viewers, scored: scorePitches(avatars, viewers.viewers, pitches) });
  assert.match(pitch, /Idea one/);
  assert.match(pitch, /Maya\n1\. Would watch: "love it"/);
  assert.match(pitch, /Go with one\./);
  const chat = simText({ ...base, kind: 'chat', title: 'Q', messages: [{ from: 'you', to: 'all', text: 'Would you watch?' }, { from: 'b', text: 'Sure' }] });
  assert.match(chat, /You: Would you watch\?\nRaj: Sure/);
  const screening = simText({ ...base, kind: 'screening', title: 'T', report: 'RAW', summary: { text: 'FIXES' } });
  assert.match(screening, /FIXES\n\nRAW/);
  for (const t of [pitch, chat, screening]) assert.doesNotMatch(t, /undefined/);
});
