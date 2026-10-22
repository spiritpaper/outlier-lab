import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewData, lineAt, ctrScale, growthBlocks } from '../src/lib/channel-review.js';
import { channelReviewPrompt } from '../src/lib/ai.js';

const curve = Array.from({ length: 100 }, (_, i) => ({ ratio: i / 100, watch: i < 40 ? 0.9 - i * 0.005 : 0.5 - (i - 40) * 0.004, relative: 0.42 }));
curve[40].watch = 0.62; // a cliff right after 0.39
const input = {
  me: { title: 'Dev Diaries' },
  days: 28,
  ov: {
    startDate: '2026-09-14', endDate: '2026-10-12',
    current: { views: 12000, estimatedMinutesWatched: 30000, averageViewDuration: 150, averageViewPercentage: 31.5, subscribersGained: 120, subscribersLost: 30, likes: 400, comments: 50, shares: 20 },
    previous: { views: 15000, estimatedMinutesWatched: 36000, averageViewDuration: 160, averageViewPercentage: 33, subscribersGained: 150, subscribersLost: 20 },
    daily: Array.from({ length: 28 }, (_, i) => ({ day: `d${i}`, views: i < 14 ? 500 : 357 })),
  },
  top: [
    { video: 'vid00000001', views: 8000, averageViewPercentage: 28, averageViewDuration: 168, subscribersGained: 90, estimatedMinutesWatched: 20000 },
    { video: 'vid00000002', views: 2000, averageViewPercentage: 45, averageViewDuration: 27, subscribersGained: 5, estimatedMinutesWatched: 900 },
  ],
  pub: {
    vid00000001: { title: 'I built a game in 7 days', views: 40000, multiplier: 2.4, durationSec: 600, format: 'long', publishedAt: '2026-09-20T10:00:00Z' },
    vid00000002: { title: 'One line of Rust', views: 3000, multiplier: 0.3, durationSec: 60, format: 'short' },
  },
  traffic: [{ insightTrafficSourceType: 'BROWSE', views: 6000 }, { insightTrafficSourceType: 'YT_SEARCH', views: 3000 }, { insightTrafficSourceType: 'SUGGESTED', views: 3000 }],
  curves: { vid00000001: curve },
  transcripts: { vid00000001: [{ start: 0, text: 'Day one.' }, { start: 230, text: 'Before we go on, let me tell you about my setup.' }, { start: 240, text: 'It has a desk.' }] },
  profile: { subs: 5000, medianLong: 16000, medianShort: 2000, uploadsPerWeek: 0.5, shortsPerWeek: 2, hitRate: 0.2, trend: 'declining', momentum: 0.7, likeRate: 0.04, viewsPerSub: 3.2 },
  peers: [{ title: 'Peer A', subs: 20000, medianLong: 40000, uploadsPerWeek: 1, hitRate: 0.3, trend: 'growing' }, { error: 'x' }],
};

test('the review data sheet carries exact numbers, places and words', () => {
  const { text, stats } = reviewData(input);
  assert.match(text, /Views: 12,000 \(-20% vs previous period\)/);
  assert.match(text, /net 90; previous period net 130/);
  assert.match(text, /first half of the period averaged 500\/day, second half 357\/day/);
  assert.match(text, /"I built a game in 7 days" \[vid00000001\]: 8,000 views in period, 40,000 lifetime, outlier score 2\.4x of my median, length 10:00/);
  assert.match(text, /not available from the API.*do not judge CTR/);
  assert.match(text, /Browse features: 50% of views/);
  assert.match(text, /Steepest drop after the intro: -.* at 4:06\. Said there: ".*let me tell you about my setup/);
  assert.match(text, /Peer A: 20,000 subs, median 40,000 views/);
  assert.ok(!text.includes('undefined') && !text.includes('NaN'));
  assert.deepEqual(stats, { days: 28, views: 12000, avgPct: 31.5, netSubs: 90, videos: 2, retention: 1, ctr: false, impressions: null, growthBlocks: 0 });
});

test('missing pieces are left out, not invented', () => {
  const { text } = reviewData({ days: 7, ov: { current: {}, previous: {} }, top: [] });
  assert.ok(!text.includes('undefined') && !text.includes('NaN'));
  assert.ok(!/Retention|Channels I follow|Where views came from/.test(text));
  assert.equal(lineAt([], 10), null);
});

test('the review prompt asks for what, where, evidence, fix and check, without softening', () => {
  const { system, prompt } = channelReviewPrompt('DATA-SHEET', 'coding vlogs');
  assert.match(system, /not to hold back/);
  assert.match(system, /Use ONLY the data provided/);
  assert.match(prompt, /DATA-SHEET/);
  assert.match(prompt, /coding vlogs/);
  assert.match(prompt, /## Is it growing\?/);
  assert.match(system, /bottleneck/);
  for (const part of ['**What:**', '**Where:**', '**Evidence:**', '**Fix:**', '**Check:**']) assert.ok(prompt.includes(part), part);
});

test('CTR is read as a fraction or a percent, whichever the views allow', () => {
  // 100,000 impressions at 4.5%: 4,500 clicks, within 12,000 views.
  assert.equal(ctrScale([{ impressions: 100_000, rate: 0.045, views: 12_000 }]), 100);
  assert.equal(ctrScale([{ impressions: 100_000, rate: 4.5, views: 12_000 }]), 1);
  assert.equal(ctrScale([]), 1);
});

// 168 days ending 2026-10-12: views grow 10/day per block, 2 subs a day.
const days168 = Array.from({ length: 168 }, (_, i) => {
  const day = new Date(Date.parse('2026-10-12T00:00:00Z') - (167 - i) * 86_400_000).toISOString().slice(0, 10);
  return { day, views: 100 + Math.floor(i / 28) * 10, estimatedMinutesWatched: 120, subscribersGained: 3, subscribersLost: 1 };
});
const reach168 = days168.map((r) => ({ day: r.day, videoThumbnailImpressions: 1000, videoThumbnailImpressionsClickRate: 0.05 }));

test('growth blocks add up 28-day blocks, oldest first, with weighted CTR and uploads', () => {
  const uploadDates = { long: ['2026-10-01T10:00:00Z', '2026-09-20T10:00:00Z', '2026-05-01T10:00:00Z'], short: [] };
  const b = growthBlocks({ daily: days168, dailyReach: reach168, endDate: '2026-10-12', uploadDates });
  assert.equal(b.length, 6);
  assert.deepEqual([b[0].start, b.at(-1).end], ['2026-04-28', '2026-10-12']);
  assert.deepEqual(b.map((x) => x.views), [2800, 3080, 3360, 3640, 3920, 4200]);
  assert.equal(b[5].hours, 56);
  assert.equal(b[5].netSubs, 56);
  assert.equal(b[5].impressions, 28000);
  assert.ok(Math.abs(b[5].rate - 0.05) < 1e-9);
  assert.deepEqual(b.map((x) => x.uploadsLong), [1, 0, 0, 0, 0, 2]);
  // A full list of 50 recent uploads that starts inside the window: older blocks are unknown.
  const busy = { long: [], short: Array.from({ length: 50 }, (_, i) => new Date(Date.parse('2026-10-12T00:00:00Z') - i * 86_400_000).toISOString()) };
  const known = growthBlocks({ daily: days168, endDate: '2026-10-12', uploadDates: busy });
  assert.deepEqual(known.map((x) => x.uploadsShort), [null, null, null, null, null, 28]);
  assert.equal(known[0].impressions, null);
});

test('the sheet shows reach, growth, formats, new viewers and traffic change', () => {
  const growth = {
    days: 28, blockDays: 28, endDate: '2026-10-12',
    reach: { current: [{ videoThumbnailImpressions: 100_000, videoThumbnailImpressionsClickRate: 0.045 }], previous: [{ videoThumbnailImpressions: 80_000, videoThumbnailImpressionsClickRate: 0.05 }] },
    formats: { current: [{ creatorContentType: 'VIDEO_ON_DEMAND', views: 9000, estimatedMinutesWatched: 27000, averageViewPercentage: 30 }, { creatorContentType: 'SHORTS', views: 3000, estimatedMinutesWatched: 3000, averageViewPercentage: 80 }], previous: [{ creatorContentType: 'VIDEO_ON_DEMAND', views: 12000 }] },
    subscribed: { current: [{ subscribedStatus: 'UNSUBSCRIBED', views: 9000, averageViewPercentage: 28 }, { subscribedStatus: 'SUBSCRIBED', views: 3000, averageViewPercentage: 40 }], previous: [{ subscribedStatus: 'UNSUBSCRIBED', views: 9000 }, { subscribedStatus: 'SUBSCRIBED', views: 6000 }] },
    traffic: { current: [{ insightTrafficSourceType: 'BROWSE', views: 6000 }, { insightTrafficSourceType: 'SHORTS', views: 600 }], previous: [{ insightTrafficSourceType: 'BROWSE', views: 4000 }] },
    daily: days168,
    dailyReach: reach168,
  };
  const { text, stats } = reviewData({ ...input, growth, profile: { ...input.profile, uploadDates: { long: ['2026-09-20T10:00:00Z', '2026-08-25T10:00:00Z'], short: [] } } });
  assert.match(text, /Impressions: 100,000 \(\+25% vs previous period\)/);
  assert.match(text, /click-through rate: 4\.5% \(previous period 5\.0%\)/);
  assert.match(text, /Growth over the last 6 blocks of 28 days/);
  assert.match(text, /2026-09-15 to 2026-10-12: 4,200 views, 56 watch hours, net \+56 subscribers, 28,000 impressions, CTR 5\.0%, 1 long-form upload, 0 Shorts/);
  assert.match(text, /views \(\+50%\).*views rose in 5 of 5/);
  assert.match(text, /Long-form videos: 9,000 views \(-25% vs previous period\), 450 watch hours, avg 30\.0% viewed/);
  assert.match(text, /Views from non-subscribers: 75% \(previous period 60%\)/);
  assert.match(text, /Videos published in this period \(among the most viewed\): 1, with 8,000 views \(67% of the channel's views\)/);
  assert.match(text, /Uploads: 1 long-form and 0 Short\(s\) this period, 1 and 0 the period before/);
  assert.match(text, /Browse features: 91% of views, 6,000 \(\+50% vs previous period\)/);
  assert.match(text, /Shorts feed: 9% of views, 600 \(new this period\)/);
  assert.ok(!/do not judge CTR/.test(text));
  assert.ok(!text.includes('undefined') && !text.includes('NaN'));
  assert.equal(stats.impressions, 100_000);
  assert.equal(stats.growthBlocks, 6);
});
