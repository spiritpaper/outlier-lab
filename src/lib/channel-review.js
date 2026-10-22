// Packs your own analytics into a compact, exact data sheet for the AI
// channel review, so every claim in the review can point at a real number,
// a real video and a real moment.

import { retentionSummary, formatTime, median } from './stats.js';

const TRAFFIC = {
  YT_SEARCH: 'YouTube search', SUGGESTED: 'Suggested videos', BROWSE: 'Browse features', EXT_URL: 'External',
  NO_LINK_OTHER: 'Direct / unknown', PLAYLIST: 'Playlists', YT_CHANNEL: 'Channel pages', NOTIFICATION: 'Notifications',
  SUBSCRIBER: 'Subscriptions', SHORTS: 'Shorts feed', END_SCREEN: 'End screens', ANNOTATION: 'Cards & annotations',
  YT_OTHER_PAGE: 'Other YouTube pages', ADVERTISING: 'Ads', HASHTAGS: 'Hashtags', RELATED_VIDEO: 'Related video',
};

const num = (x) => (x == null || !Number.isFinite(Number(x)) ? 'n/a' : Math.round(Number(x)).toLocaleString('en-US'));
const pct = (x, d = 1) => (x == null || !Number.isFinite(x) ? 'n/a' : `${(x * 100).toFixed(d)}%`);
const change = (cur, prev) => (cur == null || !prev ? '' : ` (${cur >= prev ? '+' : ''}${(((cur - prev) / prev) * 100).toFixed(0)}% vs previous period)`);
const mult = (x) => (x == null || !Number.isFinite(x) ? 'n/a' : `${x.toFixed(1)}x`);

/** What was said around `sec` in a saved transcript, if there is one. */
export function lineAt(segments, sec) {
  if (!segments?.length || sec == null) return null;
  let best = segments[0];
  for (const s of segments) if (s.start <= sec) best = s;
  const i = segments.indexOf(best);
  return segments
    .slice(Math.max(0, i - 1), i + 2)
    .map((s) => s.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 260);
}

const FORMATS = { VIDEO_ON_DEMAND: 'Long-form videos', SHORTS: 'Shorts', LIVE_STREAM: 'Live streams', STORY: 'Stories', UNSPECIFIED: 'Other' };
const DAY = 86_400_000;
const UPLOADS_KNOWN = 50; // recent uploads kept per format in a channel's baseline
const dayMs = (ymd) => Date.parse(`${ymd}T00:00:00Z`);
const ymdOf = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * How to turn the API's click-through rate into a percentage. Clicks from
 * impressions can't outnumber views, so if impressions × rate stays within
 * the views the rate is a fraction (0.045); otherwise it's already a percent (4.5).
 * `samples` are [{ impressions, rate, views }]; returns 100 or 1.
 */
export function ctrScale(samples) {
  const ok = samples.filter((x) => x.impressions > 0 && x.rate != null && x.views != null);
  if (!ok.length) return 1;
  const clicks = ok.reduce((sum, x) => sum + x.impressions * x.rate, 0);
  const views = ok.reduce((sum, x) => sum + x.views, 0);
  return clicks <= views * 1.01 ? 100 : 1;
}

/**
 * Daily rows grouped into `blockDays`-day blocks ending on `endDate`, oldest
 * first: views, watch hours, net subscribers, impressions, CTR (as the raw API
 * rate, impression-weighted) and uploads. Days missing from the API count as zero.
 */
export function growthBlocks({ daily = [], dailyReach = null, endDate, blockDays = 28, blocks = 6, uploadDates = null }) {
  if (!daily?.length || !endDate) return [];
  const end = dayMs(endDate);
  const reachByDay = new Map((dailyReach ?? []).map((r) => [r.day, r]));
  const out = [];
  for (let k = blocks - 1; k >= 0; k--) {
    const to = end - k * blockDays * DAY;
    const from = to - (blockDays - 1) * DAY;
    const rows = daily.filter((r) => dayMs(r.day) >= from && dayMs(r.day) <= to);
    if (!rows.length) continue;
    const sum = (list, key) => list.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
    const reach = rows.map((r) => reachByDay.get(r.day)).filter(Boolean);
    const impressions = dailyReach ? sum(reach, 'videoThumbnailImpressions') : null;
    // Only the last ~50 uploads per format are known: a block older than a full
    // list's oldest upload may have had more, so it's unknown, not zero.
    const inBlock = (list) => {
      const times = (list ?? []).map((at) => Date.parse(at)).filter(Number.isFinite);
      if (times.length >= UPLOADS_KNOWN && from < Math.min(...times)) return null;
      return times.filter((t) => t >= from && t < to + DAY).length;
    };
    out.push({
      start: ymdOf(from),
      end: ymdOf(to),
      views: sum(rows, 'views'),
      hours: sum(rows, 'estimatedMinutesWatched') / 60,
      netSubs: sum(rows, 'subscribersGained') - sum(rows, 'subscribersLost'),
      impressions,
      rate: impressions ? reach.reduce((acc, r) => acc + (r.videoThumbnailImpressions ?? 0) * (r.videoThumbnailImpressionsClickRate ?? 0), 0) / impressions : null,
      uploadsLong: uploadDates ? inBlock(uploadDates.long) : null,
      uploadsShort: uploadDates ? inBlock(uploadDates.short) : null,
    });
  }
  return out;
}

/**
 * The data sheet. Inputs are what the My channel page already loads:
 * ov (overview), top (top videos), pub (public info + outlier score by id),
 * traffic (channel traffic sources), curves (retention by id), transcripts
 * (segments by id), profile (your channel profile), peers (followed
 * channels' profiles), growth (reach, formats, subscribers vs not, traffic
 * for both periods and daily rows over ~6 months, from analytics growth()).
 * Returns { text, stats } where `stats` is a short
 * summary kept with the saved review.
 */
export function reviewData({ me, days, ov, top = [], pub = {}, traffic = [], curves = {}, transcripts = {}, profile = null, peers = [], growth = null }) {
  const c = ov?.current ?? {};
  const p = ov?.previous ?? {};
  const net = (o) => (o.subscribersGained ?? 0) - (o.subscribersLost ?? 0);
  const reachNow = growth?.reach?.current?.[0] ?? null;
  const reachBefore = growth?.reach?.previous?.[0] ?? null;
  const scale = ctrScale([
    reachNow && { impressions: reachNow.videoThumbnailImpressions, rate: reachNow.videoThumbnailImpressionsClickRate, views: c.views },
    reachBefore && { impressions: reachBefore.videoThumbnailImpressions, rate: reachBefore.videoThumbnailImpressionsClickRate, views: p.views },
    ...top.map((r) => ({ impressions: r.videoThumbnailImpressions, rate: r.videoThumbnailImpressionsClickRate, views: r.views })),
  ].filter(Boolean));
  const ctr = (rate) => (rate == null || !Number.isFinite(Number(rate)) ? 'n/a' : `${(Number(rate) * scale).toFixed(1)}%`);
  const lines = [];
  lines.push(`# Channel: ${me?.title ?? 'my channel'}`);
  lines.push(`Period: last ${days} days (${ov?.startDate ?? '?'} to ${ov?.endDate ?? '?'}), compared with the ${days} days before. YouTube Analytics data, not estimates.`);
  lines.push('');
  lines.push('## Totals');
  lines.push(`- Views: ${num(c.views)}${change(c.views, p.views)}`);
  lines.push(`- Watch time: ${num((c.estimatedMinutesWatched ?? 0) / 60)} hours${change(c.estimatedMinutesWatched, p.estimatedMinutesWatched)}`);
  lines.push(`- Average view duration: ${c.averageViewDuration == null ? 'n/a' : formatTime(c.averageViewDuration)}${change(c.averageViewDuration, p.averageViewDuration)}`);
  lines.push(`- Average % viewed: ${c.averageViewPercentage == null ? 'n/a' : `${Number(c.averageViewPercentage).toFixed(1)}%`}${change(c.averageViewPercentage, p.averageViewPercentage)}`);
  lines.push(`- Subscribers: +${num(c.subscribersGained)} / -${num(c.subscribersLost)} (net ${num(net(c))}; previous period net ${num(net(p))})`);
  lines.push(`- Likes ${num(c.likes)}, comments ${num(c.comments)}, shares ${num(c.shares)}`);
  if (ov?.daily?.length >= 7) {
    const half = Math.floor(ov.daily.length / 2);
    const avg = (rows) => rows.reduce((s, r) => s + (r.views ?? 0), 0) / rows.length;
    lines.push(`- Daily views: first half of the period averaged ${num(avg(ov.daily.slice(0, half)))}/day, second half ${num(avg(ov.daily.slice(half)))}/day`);
  }

  if (reachNow?.videoThumbnailImpressions) {
    lines.push('');
    lines.push('## Reach (thumbnail impressions on YouTube)');
    lines.push(`- Impressions: ${num(reachNow.videoThumbnailImpressions)}${change(reachNow.videoThumbnailImpressions, reachBefore?.videoThumbnailImpressions)}`);
    lines.push(`- Impressions click-through rate: ${ctr(reachNow.videoThumbnailImpressionsClickRate)} (previous period ${ctr(reachBefore?.videoThumbnailImpressionsClickRate)})`);
  }

  const blocks = growthBlocks({ daily: growth?.daily, dailyReach: growth?.dailyReach, endDate: growth?.endDate, blockDays: growth?.blockDays, uploadDates: profile?.uploadDates });
  if (blocks.length >= 2) {
    lines.push('');
    lines.push(`## Growth over the last ${blocks.length} blocks of ${growth.blockDays} days (oldest first)`);
    for (const b of blocks) {
      const bits = [
        `${num(b.views)} views`,
        `${num(b.hours)} watch hours`,
        `net ${b.netSubs >= 0 ? '+' : ''}${num(b.netSubs)} subscribers`,
        b.impressions != null && `${num(b.impressions)} impressions`,
        b.rate != null && `CTR ${ctr(b.rate)}`,
        b.uploadsLong != null && `${b.uploadsLong} long-form upload${b.uploadsLong === 1 ? '' : 's'}`,
        b.uploadsShort != null && `${b.uploadsShort} Short${b.uploadsShort === 1 ? '' : 's'}`,
      ].filter(Boolean);
      lines.push(`- ${b.start} to ${b.end}: ${bits.join(', ')}`);
    }
    const first = blocks[0];
    const last = blocks.at(-1);
    const rising = blocks.slice(1).filter((b, i) => b.views > blocks[i].views).length;
    lines.push(`- Latest block vs the oldest: views ${change(last.views, first.views).replace(' vs previous period', '').trim() || 'n/a'}, watch hours ${change(last.hours, first.hours).replace(' vs previous period', '').trim() || 'n/a'}; views rose in ${rising} of ${blocks.length - 1} block-to-block steps`);
  }

  const formatRows = growth?.formats?.current ?? [];
  if (formatRows.length) {
    const before = new Map((growth.formats.previous ?? []).map((r) => [r.creatorContentType, r]));
    lines.push('');
    lines.push('## Views by format');
    for (const r of formatRows) {
      const b = before.get(r.creatorContentType) ?? {};
      lines.push(`- ${FORMATS[r.creatorContentType] ?? r.creatorContentType}: ${num(r.views)} views${change(r.views, b.views)}, ${num((r.estimatedMinutesWatched ?? 0) / 60)} watch hours, avg ${r.averageViewPercentage == null ? 'n/a' : `${Number(r.averageViewPercentage).toFixed(1)}%`} viewed`);
    }
  }

  const subRows = growth?.subscribed?.current ?? [];
  if (subRows.length) {
    const share = (rows) => {
      const total = rows.reduce((acc, r) => acc + (r.views ?? 0), 0);
      const fresh = rows.find((r) => r.subscribedStatus === 'UNSUBSCRIBED');
      return total && fresh ? fresh.views / total : null;
    };
    const avgOf = (status) => subRows.find((r) => r.subscribedStatus === status)?.averageViewPercentage;
    const fmt = (x) => (x == null ? 'n/a' : `${Number(x).toFixed(1)}%`);
    lines.push('');
    lines.push('## Subscribers vs non-subscribers (reaching new people)');
    lines.push(`- Views from non-subscribers: ${pct(share(subRows), 0)} (previous period ${pct(share(growth.subscribed.previous ?? []), 0)})`);
    lines.push(`- Avg % viewed: non-subscribers ${fmt(avgOf('UNSUBSCRIBED'))}, subscribers ${fmt(avgOf('SUBSCRIBED'))}`);
  }

  if (ov?.startDate) {
    const from = dayMs(ov.startDate);
    const fresh = top.filter((r) => Date.parse(pub[r.video]?.publishedAt ?? '') >= from);
    const freshViews = fresh.reduce((acc, r) => acc + (r.views ?? 0), 0);
    const prevFrom = from - days * DAY;
    const count = (list, a, b) => (list ?? []).filter((at) => Date.parse(at) >= a && Date.parse(at) < b).length;
    lines.push('');
    lines.push('## New uploads vs the back catalog');
    lines.push(`- Videos published in this period (among the most viewed): ${fresh.length}, with ${num(freshViews)} views (${pct(c.views ? freshViews / c.views : null, 0)} of the channel's views); the rest came from older videos`);
    if (profile?.uploadDates) {
      const { long = [], short = [] } = profile.uploadDates;
      lines.push(`- Uploads: ${count(long, from, Infinity)} long-form and ${count(short, from, Infinity)} Short(s) this period, ${count(long, prevFrom, from)} and ${count(short, prevFrom, from)} the period before`);
    }
  }

  if (profile) {
    lines.push('');
    lines.push('## Channel profile (public data, last ~30 uploads)');
    lines.push(`- Subscribers ${num(profile.subs)}, median views per long-form video ${num(profile.medianLong)}, per Short ${num(profile.medianShort)}`);
    lines.push(`- Uploads per week: ${profile.uploadsPerWeek?.toFixed(1) ?? 'n/a'} long-form, ${profile.shortsPerWeek?.toFixed(1) ?? 'n/a'} Shorts`);
    lines.push(`- Hit rate: ${pct(profile.hitRate, 0)} of recent long-form videos reached 2x+ the channel's own median`);
    lines.push(`- Trend: ${profile.trend ?? 'n/a'}${profile.momentum ? ` (median views of the last ~10 uploads are ${mult(profile.momentum)} the median of the uploads before them)` : ''}`);
    lines.push(`- Median like rate ${pct(profile.likeRate, 2)}, views per subscriber ${pct(profile.viewsPerSub, 0)}`);
  }
  const others = peers.filter((x) => !x.error && x.medianLong);
  if (others.length) {
    lines.push('');
    lines.push('## Channels I follow (for comparison)');
    for (const o of others.slice(0, 8)) {
      lines.push(`- ${o.title}: ${num(o.subs)} subs, median ${num(o.medianLong)} views, ${o.uploadsPerWeek?.toFixed(1) ?? 'n/a'} uploads/week, hit rate ${pct(o.hitRate, 0)}, trend ${o.trend ?? 'n/a'}`);
    }
    lines.push(`- Peer medians: ${num(median(others.map((o) => o.medianLong)))} views per video, ${median(others.map((o) => o.uploadsPerWeek).filter((x) => x != null))?.toFixed(1) ?? 'n/a'} uploads/week`);
  }

  const sources = growth?.traffic?.current?.length ? growth.traffic.current : traffic;
  if (sources.length) {
    const total = sources.reduce((s, t) => s + (t.views ?? 0), 0) || 1;
    const before = new Map((growth?.traffic?.previous ?? []).map((t) => [t.insightTrafficSourceType, t.views]));
    lines.push('');
    lines.push('## Where views came from (channel)');
    for (const t of sources.slice(0, 8)) {
      const was = before.size ? change(t.views, before.get(t.insightTrafficSourceType) ?? 0) || ' (new this period)' : '';
      lines.push(`- ${TRAFFIC[t.insightTrafficSourceType] ?? t.insightTrafficSourceType}: ${pct(t.views / total, 0)} of views, ${num(t.views)}${was}`);
    }
  }

  const hasCtr = Boolean(reachNow?.videoThumbnailImpressions) || top.some((r) => r.videoThumbnailImpressionsClickRate != null);
  lines.push('');
  lines.push(`## Videos with the most views in the period (${top.length})`);
  if (!hasCtr) lines.push('(Impressions and click-through rate are not available from the API for this channel, so do not judge CTR.)');
  const avgPct = median(top.map((r) => r.averageViewPercentage).filter((x) => x != null));
  for (const [i, r] of top.slice(0, 25).entries()) {
    const v = pub[r.video] ?? {};
    const bits = [
      `${num(r.views)} views in period`,
      v.views != null && `${num(v.views)} lifetime`,
      v.multiplier != null && `outlier score ${mult(v.multiplier)} of my median`,
      v.durationSec && `length ${formatTime(v.durationSec)}`,
      v.format === 'short' && 'Short',
      r.averageViewPercentage != null && `avg ${Number(r.averageViewPercentage).toFixed(1)}% viewed`,
      r.averageViewDuration != null && `avg duration ${formatTime(r.averageViewDuration)}`,
      r.subscribersGained != null && `+${num(r.subscribersGained)} subs`,
      r.videoThumbnailImpressions != null && `${num(r.videoThumbnailImpressions)} impressions`,
      r.videoThumbnailImpressionsClickRate != null && `CTR ${ctr(r.videoThumbnailImpressionsClickRate)}`,
      v.publishedAt && `published ${String(v.publishedAt).slice(0, 10)}`,
    ].filter(Boolean);
    lines.push(`${i + 1}. "${v.title ?? r.video}" [${r.video}]: ${bits.join(', ')}`);
  }
  if (avgPct != null) lines.push(`(Median avg % viewed across these videos: ${avgPct.toFixed(1)}%)`);

  const withCurves = Object.entries(curves).filter(([, pts]) => pts?.length);
  if (withCurves.length) {
    lines.push('');
    lines.push('## Retention (audience still watching, from my analytics)');
    for (const [id, pts] of withCurves) {
      const v = pub[id] ?? {};
      const s = retentionSummary(pts);
      if (!s) continue;
      const dur = v.durationSec;
      const when = (ratio) => (dur ? formatTime(ratio * dur) : `${Math.round(ratio * 100)}% through`);
      const out = [`### "${v.title ?? id}"${dur ? ` (${formatTime(dur)})` : ''}`];
      out.push(`- Still watching: ${pct(s.at10, 0)} at 10%, ${pct(s.at50, 0)} at the halfway point, ${pct(s.at90, 0)} at 90%`);
      const intro = pts.find((x) => x.ratio >= 0.05) ?? pts[0];
      out.push(`- Opening: ${pct(intro?.watch, 0)} still watching at ${when(intro?.ratio ?? 0.05)}`);
      if (s.steepestDrop) {
        const said = lineAt(transcripts[id], dur ? s.steepestDrop.ratio * dur : null);
        out.push(`- Steepest drop after the intro: -${pct(s.steepestDrop.drop, 1)} of viewers at ${when(s.steepestDrop.ratio)}${said ? `. Said there: "${said}"` : ''}`);
      }
      if (s.rewatchMoments.length) out.push(`- Rewatched (bumps in the curve) at: ${s.rewatchMoments.slice(0, 4).map(when).join(', ')}`);
      if (s.relative != null) out.push(`- Retention vs YouTube videos of similar length: ${s.relative.toFixed(2)} (0.5 = typical, 1.0 = best)`);
      if (!transcripts[id]) out.push('- (No transcript saved, so the words at these moments are unknown.)');
      lines.push(...out);
    }
  }

  return {
    text: lines.join('\n'),
    stats: {
      days,
      views: c.views ?? null,
      avgPct: c.averageViewPercentage ?? null,
      netSubs: net(c),
      videos: top.length,
      retention: withCurves.length,
      ctr: hasCtr,
      impressions: reachNow?.videoThumbnailImpressions ?? null,
      growthBlocks: blocks.length,
    },
  };
}
