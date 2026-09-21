// ==========================================================================
// Acceptance checks for spec.md. Run from the project root:
//   node test/acceptance.js
// Prints PASS or FAIL for every check and exits with code 1 if any fail.
//
// Tolerances: spec values are rounded, so each check states its own
// tolerance — usually half of the spec's last shown digit (e.g. 5.4 → ±0.05).
// ==========================================================================
'use strict';

const D = require('../data.js');
const Calc = require('../calc.js');

let passed = 0;
let failed = 0;

// Numeric check: |actual − expected| ≤ tol.
function approx(name, actual, expected, tol) {
  const ok = Number.isFinite(actual) && Math.abs(actual - expected) <= tol;
  report(name, ok, `got ${round(actual)}, expected ${round(expected)} ± ${tol}`);
}
// Boolean check with a short explanation of what was compared.
function check(name, ok, detail) { report(name, ok, detail || ''); }

function report(name, ok, detail) {
  if (ok) passed++; else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
}
function round(n) { return Number.isFinite(n) ? Number(n.toPrecision(6)) : n; }
function section(title) { console.log(`\n== ${title} ==`); }

// Parses a share-link style row list, e.g. "gpt-5.5:chat:5,gpt-5.5:email:2".
function rows(spec) {
  return spec.split(',').map((chunk) => {
    const [model, size, count] = chunk.split(':');
    return { model, size, count: Number(count) };
  });
}
const US = Calc.getLocation('us').grid;

// --------------------------------------------------------------------------
section('Step 0 baseline: text-row results unchanged by the refactor');
// --------------------------------------------------------------------------

// Hand calculation from the raw EcoLogits numbers for GPT-5.5 "chatbot reply"
// (wh 2.6601, emb 0.0692 g, ml 9.5929), independent of calc.js:
//   carbon = 5 × (2.6601 / 1000 × 380 + 0.0692) = 5.40019 g
//   water  = 5 × 9.5929 / 1000               = 0.0479645 L
approx('5 GPT-5.5 chatbot replies, US, carbon (g)', Calc.totalDaily(rows('gpt-5.5:chat:5'), 'carbon', US), 5.40019, 1e-6);
approx('5 GPT-5.5 chatbot replies, water (L)', Calc.totalDaily(rows('gpt-5.5:chat:5'), 'water', US), 0.0479645, 1e-9);

// Daily totals shown on the page before the refactor (captured 2026-09-21
// from the rendered verdict line for each existing preset, US grid unless
// stated). Tolerance = half the last digit the page displayed.
// Retired in Step 2: the "Software engineer" and "AI power user" baselines,
// which used the removed fixed "agent" size (spec feature 2 replaces it).
const BASELINE = [
  // [preset rows, location, carbon g, tol, water L, tol]
  ['gpt-5.5:chat:5', 'us', 5.4, 0.05, 0.048, 0.0005],
  ['claude-sonnet-4-6:chat:8,claude-sonnet-4-6:summary:3', 'us', 3.2, 0.05, 0.029, 0.0005],
  ['gpt-5.5:report:2,claude-opus-4-8:long:1,gpt-5.5:chat:10', 'us', 64, 0.5, 0.587, 0.0005],
  ['gpt-5.5:chat:10,gpt-5.5:email:5,gpt-5.5:summary:2', 'us', 15, 0.5, 0.129, 0.0005],
  ['gpt-5.5:chat:5', 'in', 9.7, 0.05, 0.048, 0.0005],
];
for (const [r, loc, carbon, cTol, water, wTol] of BASELINE) {
  const grid = Calc.getLocation(loc).grid;
  approx(`baseline ${r} @${loc}, carbon (g)`, Calc.totalDaily(rows(r), 'carbon', grid), carbon, cTol);
  approx(`baseline ${r} @${loc}, water (L)`, Calc.totalDaily(rows(r), 'water', grid), water, wTol);
}

// Typical-person daily footprint, US, medium home, average driving/diet,
// flies sometimes: (3000 + 3500 + 4800 + 2500 + 2300) × 1000 / 365 g.
approx('typical daily footprint, US defaults (g)',
  Calc.dailyFootprint({ loc: 'us', home: 'med', drive: 'davg', diet: 'avg', fly: 'some' }, 'carbon'),
  16100 * 1000 / 365, 1e-6);

// --------------------------------------------------------------------------
section('Step 1 range core: text rows use EcoLogits min/max');
// --------------------------------------------------------------------------

// Hand calculation for 5 GPT-5.5 chatbot replies on the US grid from the raw
// EcoLogits fields (whmin 1.7417 / whmax 3.5784; emb 0.0692 has no range;
// mlmin 6.2811 / mlmax 12.9047):
//   low carbon  = 5 × (1.7417 / 1000 × 380 + 0.0692) = 3.655230 g
//   high carbon = 5 × (3.5784 / 1000 × 380 + 0.0692) = 7.144960 g
const chat5 = rows('gpt-5.5:chat:5');
const chat5Carbon = Calc.totalRange(chat5, 'carbon', US);
const chat5Water = Calc.totalRange(chat5, 'water', US);
approx('5 GPT-5.5 chatbot replies, low carbon (g)', chat5Carbon.low, 3.655230, 1e-6);
approx('5 GPT-5.5 chatbot replies, central carbon (g)', chat5Carbon.central, 5.40019, 1e-6);
approx('5 GPT-5.5 chatbot replies, high carbon (g)', chat5Carbon.high, 7.144960, 1e-6);
approx('5 GPT-5.5 chatbot replies, low water (L)', chat5Water.low, 5 * 6.2811 / 1000, 1e-9);
approx('5 GPT-5.5 chatbot replies, high water (L)', chat5Water.high, 5 * 12.9047 / 1000, 1e-9);

// Spec 5.3 (text-row part): every row's low ≤ central ≤ high — checked for
// every model × reply length × metric × location.
{
  let n = 0;
  const bad = [];
  for (const m of D.MODELS) for (const size of Object.keys(m.sizes)) for (const metric of ['carbon', 'water']) {
    for (const loc of D.LOCATIONS) {
      const r = Calc.rowRange({ model: m.id, size, count: 1 }, metric, loc.grid);
      n++;
      if (!(r.low <= r.central && r.central <= r.high)) bad.push(`${m.id}/${size}/${metric}/${loc.id}`);
    }
  }
  check(`low ≤ central ≤ high for all ${n} text-row combinations`, bad.length === 0, bad.length ? 'violations: ' + bad.join(', ') : `${n} checked`);
}

// Spec 5.3 (text-row part): the total's low, central, and high each equal the
// sums of its rows' values. Uses the "Daily researcher" preset's three rows.
{
  const rs = rows('gpt-5.5:report:2,claude-opus-4-8:long:1,gpt-5.5:chat:10');
  for (const metric of ['carbon', 'water']) {
    const total = Calc.totalRange(rs, metric, US);
    for (const lvl of ['low', 'central', 'high']) {
      const sum = rs.reduce((s, r) => s + Calc.rowRange(r, metric, US)[lvl], 0);
      approx(`researcher preset ${metric} total ${lvl} = sum of rows`, total[lvl], sum, 1e-9);
    }
  }
}

// Spec 5.5 (text-row part): yearly range = daily range × 365.
approx('yearly high = daily high × 365 (5 chatbot replies, carbon)', Calc.totalRange(chat5, 'carbon', US).high * D.DAYS, 7.144960 * 365, 1e-4);

// Driver scenario: moving only the EcoLogits input to high equals all-high
// for text-only use (it is the only uncertain input so far); moving an input
// that text rows don't use leaves them central.
approx('text rows: vary EcoLogits → high equals all-high',
  Calc.totalDaily(chat5, 'carbon', US, { vary: Calc.ECOLOGITS, varyLevel: 'high' }), chat5Carbon.high, 1e-9);
approx('text rows: vary an unrelated input → stays central',
  Calc.totalDaily(chat5, 'carbon', US, { vary: 'pue', varyLevel: 'high' }), chat5Carbon.central, 1e-9);

// Spec 5.6 (text-row part): zero counts give a zero range.
{
  const z = Calc.totalRange(rows('gpt-5.5:chat:0'), 'carbon', US);
  check('zero prompts → 0 · 0 · 0', z.low === 0 && z.central === 0 && z.high === 0, `${z.low} · ${z.central} · ${z.high}`);
}

// --------------------------------------------------------------------------
section('Feature 2: agent sessions (spec 2.1–2.6)');
// --------------------------------------------------------------------------

// Hand calculation, heavy session at central values: 10,000,000 tokens split
// 3.6% fresh / 96% cache read / 0.4% output = 360,000 / 9,600,000 / 40,000.
//   Wh = (360,000 × 0.32 + 9,600,000 × 0.32 × 10% + 40,000 × 0.96) ÷ 1,000 × 1.10
//      = (115.2 + 307.2 + 38.4) × 1.10 = 506.88 Wh
const heavy1 = [{ model: 'gpt-5.5', size: 'agent-heavy', count: 1, project: 20 }];
const light1 = [{ model: 'gpt-5.5', size: 'agent-light', count: 1, project: 20 }];

// 2.1: one heavy session per day — 506.9 Wh, ~192.6 g CO2e (US), ~1.95 L.
approx('2.1 heavy session, central energy (Wh)', Calc.totalDaily(heavy1, 'energy', US), 506.9, 0.05);
approx('2.1 heavy session, central carbon, US (g)', Calc.totalDaily(heavy1, 'carbon', US), 192.6, 0.05);
approx('2.1 heavy session, central water (L)', Calc.totalDaily(heavy1, 'water', US), 1.95, 0.005);

// 2.2: one light session per day — 30.0 Wh.
approx('2.2 light session, central energy (Wh)', Calc.totalDaily(light1, 'energy', US), 30.0, 0.05);

// 2.3: advanced mode with the heavy tier's token counts at the 10% setting
// equals the heavy tier — for every level and metric.
{
  const custom = [{ model: 'gpt-5.5', size: 'agent-custom', count: 1, fresh: 360000, cache: 9600000, output: 40000, cacheSetting: 0.10 }];
  for (const metric of ['energy', 'carbon', 'water']) {
    const a = Calc.totalRange(custom, metric, US);
    const b = Calc.totalRange(heavy1, metric, US);
    check(`2.3 custom tokens = heavy tier (${metric}, low · central · high)`,
      Calc.LEVELS.every((l) => Math.abs(a[l] - b[l]) < 1e-9), `${round(a.low)} · ${round(a.central)} · ${round(a.high)}`);
  }
}

// 2.4: a project of 20 heavy sessions is ~10,138 Wh central, and the daily
// and yearly totals don't change when the project count changes.
approx('2.4 project of 20 heavy sessions, central (Wh)', Calc.projectRange(heavy1[0], 'energy', US).central, 10138, 0.5);
{
  const before = Calc.totalRange(heavy1, 'carbon', US);
  const after = Calc.totalRange([{ ...heavy1[0], project: 500 }], 'carbon', US);
  check('2.4 changing project count leaves the daily total unchanged',
    Calc.LEVELS.every((l) => before[l] === after[l]), `project 20 → 500: ${round(before.central)} → ${round(after.central)} g`);
}

// 2.5: other factors central — heavy session ~203 Wh at 1%, ~1,014 Wh at 25%.
approx('2.5 heavy session, cache-read at 1% (Wh)',
  Calc.totalDaily(heavy1, 'energy', US, { vary: 'cacheRead', varyLevel: 'low' }), 203, 0.5);
approx('2.5 heavy session, cache-read at 25% (Wh)',
  Calc.totalDaily(heavy1, 'energy', US, { vary: 'cacheRead', varyLevel: 'high' }), 1014, 0.5);
// Same via advanced mode: the user's setting becomes the central value.
approx('2.5 advanced mode at the 1% setting, central (Wh)',
  Calc.totalDaily([{ model: 'gpt-5.5', size: 'agent-custom', count: 1, fresh: 360000, cache: 9600000, output: 40000, cacheSetting: 0.01 }], 'energy', US), 203, 0.5);
{
  // In advanced mode the range still spans 1–25% whatever the setting.
  const r = Calc.totalRange([{ model: 'gpt-5.5', size: 'agent-custom', count: 1, fresh: 360000, cache: 9600000, output: 40000, cacheSetting: 0.25 }], 'energy', US);
  const h = Calc.totalRange(heavy1, 'energy', US);
  check('2.5 advanced mode at 25%: low and high still span 1–25%', r.low === h.low && r.high === h.high, `${round(r.low)} · ${round(r.central)} · ${round(r.high)} Wh`);
}

// 2.6: changing the model on an agent row doesn't change its result.
{
  const vals = D.MODELS.map((m) => Calc.totalDaily([{ ...heavy1[0], model: m.id }], 'carbon', US));
  check(`2.6 heavy session gives the same result on all ${vals.length} models`, vals.every((v) => v === vals[0]), `${round(vals[0])} g each`);
}

// Spec feature 5 worked example (AI part): one heavy session, US grid —
// 76.3 · 192.6 · 1,195 g CO2e per day.
{
  const r = Calc.totalRange(heavy1, 'carbon', US);
  approx('worked example: AI low (g)', r.low, 76.3, 0.05);
  approx('worked example: AI central (g)', r.central, 192.6, 0.05);
  approx('worked example: AI high (g)', r.high, 1195, 0.5);
}
// Energy swing of each input for one heavy session (used by the driver list
// in Step 6): cache-read 811 Wh, provider factor 602 Wh, PUE 217 Wh.
for (const [input, swing] of [['cacheRead', 811], ['providerFactor', 602], ['pue', 217]]) {
  const lo = Calc.totalDaily(heavy1, 'energy', US, { vary: input, varyLevel: 'low' });
  const hi = Calc.totalDaily(heavy1, 'energy', US, { vary: input, varyLevel: 'high' });
  approx(`worked example: ${input} swing (Wh)`, hi - lo, swing, 0.5);
}

// Removed size: a row with the old fixed 'agent' size contributes nothing
// (the page drops such rows from old share links with a notice).
approx('old "agent" size row contributes 0', Calc.totalDaily(rows('claude-sonnet-4-6:agent:3'), 'carbon', US), 0, 0);

// --------------------------------------------------------------------------
section('Feature 1: generated media (spec 1.1–1.5)');
// --------------------------------------------------------------------------

// Hand calculations at central values (PUE 1.10, CPU+RAM 1.16, water 3.85 L/kWh):
//   10 s mid-size video = 10 × 4.1 × 1.10         = 45.10 Wh
//   10 standard images  = 10 × 2.228 × 1.16 × 1.10 = 28.43 Wh
const video10 = { type: 'video', tier: 'mid', amount: 10 };
const images10 = { type: 'image', tier: 'standard', amount: 10 };

// 1.1: 45.1 Wh; ~17.1 g CO2e on the US grid; ~0.174 L of water.
approx('1.1 10 s mid-size video, central energy (Wh)', Calc.rowValue(video10, 'energy', US), 45.1, 0.05);
approx('1.1 10 s mid-size video, central carbon, US (g)', Calc.rowValue(video10, 'carbon', US), 17.1, 0.05);
approx('1.1 10 s mid-size video, central water (L)', Calc.rowValue(video10, 'water', US), 0.174, 0.0005);

// 1.2: 10 standard images, 28.4 Wh.
approx('1.2 10 standard images, central energy (Wh)', Calc.rowValue(images10, 'energy', US), 28.4, 0.05);

// Spec's per-unit central values for every tier.
for (const [type, tier, expected, tol] of [
  ['video', 'small', 0.80, 0.005], ['video', 'mid', 4.51, 0.005], ['video', 'large', 84.7, 0.05],
  ['image', 'draft', 0.55, 0.005], ['image', 'standard', 2.84, 0.005], ['image', 'high', 4.57, 0.005],
]) {
  approx(`central per ${type === 'video' ? 'video-second' : 'image'}: ${type} ${tier} (Wh)`,
    Calc.rowValue({ type, tier, amount: 1 }, 'energy', US), expected, tol);
}

// 1.3: the daily AI total rises by exactly the media rows' central values,
// and the yearly total is daily × 365.
{
  const text = rows('gpt-5.5:chat:5');
  const withMedia = text.concat([video10, images10]);
  for (const metric of ['carbon', 'water']) {
    const rise = Calc.totalDaily(withMedia, metric, US) - Calc.totalDaily(text, metric, US);
    approx(`1.3 AI total rises by the media rows' central values (${metric})`,
      rise, Calc.rowValue(video10, metric, US) + Calc.rowValue(images10, metric, US), 1e-9);
  }
  approx('1.3 yearly total = daily × 365 (with media, carbon)',
    Calc.totalDaily(withMedia, 'carbon', US) * D.DAYS, Calc.totalDaily(withMedia, 'carbon', US) * 365, 1e-9);
  // Donut includes media rows.
  const labels = Calc.rowShares(withMedia, 'carbon', US).map((s) => s.label);
  check('1.3 donut includes the media rows', labels.includes('Video, mid-size model') && labels.includes('Images, standard'), labels.join(' | '));

  // 1.5: removing all media rows returns the totals to the text-only values.
  approx('1.5 media rows removed → text-only total (carbon)',
    Calc.totalDaily(withMedia.filter((r) => !Calc.isMediaRow(r)), 'carbon', US), Calc.totalDaily(text, 'carbon', US), 0);
}

// 1.4 (calculation part): every tier's low ≤ central ≤ high, for each metric.
for (const type of ['video', 'image']) for (const t of D.MEDIA_TIERS[type]) {
  for (const metric of ['energy', 'carbon', 'water']) {
    const r = Calc.rowRange({ type, tier: t.id, amount: 1 }, metric, US);
    check(`1.4 ${type} ${t.id} ${metric}: low ≤ central ≤ high`, r.low <= r.central && r.central <= r.high,
      `${round(r.low)} · ${round(r.central)} · ${round(r.high)}`);
  }
}
// Hand-check one all-high end: large video, 1 s = (1,313 ÷ 12) × 1.56 = 170.69 Wh.
approx('large video high end, 1 s (Wh)', Calc.rowRange({ type: 'video', tier: 'large', amount: 1 }, 'energy', US).high, 1313 / 12 * 1.56, 1e-9);
// Hand-check one all-low end: draft image = 0.247 × 1.15 × 1.09 = 0.30962 Wh.
approx('draft image low end (Wh)', Calc.rowRange({ type: 'image', tier: 'draft', amount: 1 }, 'energy', US).low, 0.247 * 1.15 * 1.09, 1e-12);

// --------------------------------------------------------------------------
section('Feature 3: streaming by device (spec 3.1–3.5)');
// --------------------------------------------------------------------------

// Hand calculation, 2 h of TV at central values:
//   Wh    = 2 × (75 + 17.71 + 3.85)                          = 193.12 Wh
//   water = 2 × [(75 + 17.71) × 2.65 + 3.85 × 3.85] ÷ 1,000   = 0.52101 L
const tv2 = [{ device: 'tv', hours: 2 }];

// 3.1: 193.1 Wh; ~73.4 g CO2e on the US grid; ~521 mL.
approx('3.1 2 h of TV, central energy (Wh)', Calc.totalDaily(tv2, 'energy', US), 193.1, 0.05);
approx('3.1 2 h of TV, central carbon, US (g)', Calc.totalDaily(tv2, 'carbon', US), 73.4, 0.05);
approx('3.1 2 h of TV, central water (L)', Calc.totalDaily(tv2, 'water', US), 0.521, 0.0005);

// 3.2: 1 h on a phone, 22.3 Wh — most of it network and data centre.
{
  const phone1 = [{ device: 'phone', hours: 1 }];
  approx('3.2 1 h on a phone, central energy (Wh)', Calc.totalDaily(phone1, 'energy', US), 22.3, 0.05);
  const p = Calc.streamingHourParts('phone', Calc.SCENARIOS.central);
  const share = (p.network + p.dc) / (p.device + p.network + p.dc);
  check('3.2 phone: network and data centre are most of the energy', share > 0.5, `${round(share * 100)}% network + data centre`);
}

// Spec's per-hour central table for every device (energy Wh, carbon g, water mL).
for (const [device, wh, g, ml] of [['tv', 96.6, 36.7, 261], ['laptop', 36.6, 13.9, 102], ['tablet', 25.4, 9.6, 72], ['phone', 22.3, 8.5, 64]]) {
  const r = [{ device, hours: 1 }];
  approx(`per hour, ${device}: energy (Wh)`, Calc.totalDaily(r, 'energy', US), wh, 0.05);
  approx(`per hour, ${device}: carbon, US (g)`, Calc.totalDaily(r, 'carbon', US), g, 0.05);
  approx(`per hour, ${device}: water (mL)`, Calc.totalDaily(r, 'water', US) * 1000, ml, 0.5);
}

// 3.3 (calculation part): every device's low ≤ central ≤ high for each
// metric, and every device has a borrowed-range note except the laptop.
for (const d of D.STREAMING_DEVICES) {
  for (const metric of ['energy', 'carbon', 'water']) {
    const r = Calc.rowRange({ device: d.id, hours: 1 }, metric, US);
    check(`3.3 ${d.id} ${metric}: low ≤ central ≤ high`, r.low <= r.central && r.central <= r.high,
      `${round(r.low)} · ${round(r.central)} · ${round(r.high)}`);
  }
  const borrowed = D.INPUTS[d.input].borrowed.length > 0;
  check(`3.3 ${d.id}: borrowed values match the spec's labels`, borrowed === (d.id !== 'laptop') && (!borrowed || d.borrowedNote !== ''),
    borrowed ? `note: "${d.borrowedNote}"` : 'measured range, no note');
}

// 3.4 (streaming changes "Your other digital use", never "Your AI use") is a
// property of the page, which keeps the two row sets apart; it is checked in
// the browser, not here.

// 3.5: all devices at 0 hours → nothing.
{
  const zero = D.STREAMING_DEVICES.map((d) => ({ device: d.id, hours: 0 }));
  const z = Calc.totalRange(zero, 'carbon', US);
  check('3.5 all devices at 0 h → 0 · 0 · 0', z.low === 0 && z.central === 0 && z.high === 0, `${z.low} · ${z.central} · ${z.high}`);
}

// Spec feature 5 worked example (other-digital part): 2 h TV, US grid —
// 44.0 · 73.4 · 94.9 g CO2e; drivers TV power 96 Wh, then network 37 Wh.
{
  const r = Calc.totalRange(tv2, 'carbon', US);
  approx('worked example: other digital low (g)', r.low, 44.0, 0.05);
  approx('worked example: other digital central (g)', r.central, 73.4, 0.05);
  approx('worked example: other digital high (g)', r.high, 94.9, 0.05);
  for (const [input, swing] of [['tvPower', 96], ['streamNetwork', 37]]) {
    const lo = Calc.totalDaily(tv2, 'energy', US, { vary: input, varyLevel: 'low' });
    const hi = Calc.totalDaily(tv2, 'energy', US, { vary: input, varyLevel: 'high' });
    approx(`worked example: ${input} swing (Wh)`, hi - lo, swing, 0.5);
  }
}

// --------------------------------------------------------------------------
section('Feature 4: video calls (spec 4.1–4.6)');
// --------------------------------------------------------------------------

// Hand calculation, 1 h on a laptop, camera on, central values:
//   Wh    = 15 + 0.62 × 9.57 + 3.85                             = 24.7834 Wh
//   water = [(15 + 5.9334) × 2.65 + 3.85 × 3.85] ÷ 1,000          = 0.070296 L
const call = (callDevice, camera, hours) => [{ callDevice, camera, hours }];

// 4.1: 24.8 Wh; ~9.4 g CO2e on the US grid; ~70 mL.
approx('4.1 1 h laptop, camera on, central energy (Wh)', Calc.totalDaily(call('laptop', 'on', 1), 'energy', US), 24.8, 0.05);
approx('4.1 1 h laptop, camera on, central carbon, US (g)', Calc.totalDaily(call('laptop', 'on', 1), 'carbon', US), 9.4, 0.05);
approx('4.1 1 h laptop, camera on, central water (mL)', Calc.totalDaily(call('laptop', 'on', 1), 'water', US) * 1000, 70, 0.5);

// 4.2: camera off on a laptop → 21.8 Wh (−12%), and the device dominates.
{
  const on = Calc.totalDaily(call('laptop', 'on', 1), 'energy', US);
  const off = Calc.totalDaily(call('laptop', 'off', 1), 'energy', US);
  approx('4.2 1 h laptop, camera off, central energy (Wh)', off, 21.8, 0.05);
  approx('4.2 camera-off change on a laptop (%)', (off / on - 1) * 100, -12, 0.5);
  const p = Calc.callHourParts('laptop', 'on', Calc.SCENARIOS.central);
  check('4.2 laptop: the device is the largest part', p.device > p.network && p.device > p.server,
    `device ${round(p.device)} · network ${round(p.network)} · server ${round(p.server)} Wh`);
}

// 4.3: 1 h on a phone, camera on, 12.2 Wh.
approx('4.3 1 h phone, camera on, central energy (Wh)', Calc.totalDaily(call('phone', 'on', 1), 'energy', US), 12.2, 0.05);

// Spec's per-hour central table (energy Wh, carbon g, water mL).
for (const [dev, cam, wh, g, ml] of [['laptop', 'on', 24.8, 9.4, 70], ['laptop', 'off', 21.8, 8.3, 62],
  ['phone', 'on', 12.2, 4.6, 37], ['phone', 'off', 9.3, 3.5, 29]]) {
  const r = call(dev, cam, 1);
  approx(`per hour, ${dev} camera ${cam}: energy (Wh)`, Calc.totalDaily(r, 'energy', US), wh, 0.05);
  approx(`per hour, ${dev} camera ${cam}: carbon, US (g)`, Calc.totalDaily(r, 'carbon', US), g, 0.05);
  approx(`per hour, ${dev} camera ${cam}: water (mL)`, Calc.totalDaily(r, 'water', US) * 1000, ml, 0.5);
  const e = Calc.rowRange(r[0], 'energy', US);
  check(`per hour, ${dev} camera ${cam}: low ≤ central ≤ high`, e.low <= e.central && e.central <= e.high,
    `${round(e.low)} · ${round(e.central)} · ${round(e.high)} Wh`);
}

// 4.4 (calls change "Your other digital use", never "Your AI use") is a page
// property, like 3.4; checked in the browser.

// 4.5 (calculation part): the cross-checks are text only — no INPUTS entry
// uses Greenspector (17) alone or Obringer (16), so neither can reach a range.
{
  const usesOnly = (src) => Object.entries(D.INPUTS).filter(([, v]) => v.sources.length === 1 && v.sources[0] === src).map(([k]) => k);
  const obringer = Object.entries(D.INPUTS).filter(([, v]) => v.sources.includes(16)).map(([k]) => k);
  check('4.5 Obringer (source 16) is in no calculated input', obringer.length === 0, obringer.join(', ') || 'none');
  check('4.5 Greenspector (17) is never the sole source of an input', usesOnly(17).length === 0, usesOnly(17).join(', ') || 'none');
  check('4.5 three cross-checks declared; Obringer labelled disputed',
    D.CALL_CROSS_CHECKS.length === 3 && /disputed upper estimate/.test(D.CALL_CROSS_CHECKS.find((c) => c.sources[0] === 16).disputed), '');
}

// 4.6: tablet and desktop add nothing to the totals.
for (const dev of ['tablet', 'desktop']) {
  const r = Calc.totalRange(call(dev, 'on', 3), 'carbon', US);
  check(`4.6 ${dev}: not available, adds 0 · 0 · 0`, r.low === 0 && r.central === 0 && r.high === 0 && !!Calc.getCallDevice(dev).unavailable,
    `reason: "${Calc.getCallDevice(dev).unavailable}"`);
}

// Streaming and calls together: the other-digital total is the sum of both.
approx('streaming + calls: total = sum of rows (carbon)',
  Calc.totalDaily(tv2.concat(call('laptop', 'on', 2)), 'carbon', US),
  Calc.totalDaily(tv2, 'carbon', US) + Calc.totalDaily(call('laptop', 'on', 2), 'carbon', US), 1e-9);

// --------------------------------------------------------------------------
section('Feature 5: ranges and drivers (spec 5.1–5.7)');
// --------------------------------------------------------------------------

// 5.1: worked example AI total 76.3 · 192.6 · 1,195 g (checked above) and
// drivers in the order cache-read setting, provider factor, PUE.
{
  const d = Calc.drivers(heavy1, 'carbon', US);
  check('5.1 AI drivers in order: cache-read, provider factor, PUE',
    d.map((x) => x.id).join(',') === 'cacheRead,providerFactor,pue',
    d.map((x) => `${x.label} ${round(x.energySwing)} Wh`).join(' · '));
  check('5.1 each driver names its source and reason', d.every((x) => x.sources.length > 0 && x.why.length > 0), '');
}
// 5.2: other-digital total 44.0 · 73.4 · 94.9 g (checked above); drivers TV
// power, then network.
{
  const d = Calc.drivers(tv2, 'carbon', US);
  check('5.2 other-digital drivers: TV power, then network', d.map((x) => x.id).slice(0, 2).join(',') === 'tvPower,streamNetwork',
    d.map((x) => `${x.label} ${round(x.energySwing)} Wh`).join(' · '));
}

// 5.3: every row's low ≤ central ≤ high, and each total equals the sums of its
// rows — for a mixed set with every row type.
{
  const ai = rows('gpt-5.5:chat:5').concat(heavy1, light1, [video10, images10]);
  const other = tv2.concat([{ device: 'phone', hours: 1 }], call('laptop', 'on', 2));
  for (const [name, set] of [['AI', ai], ['other digital', other]]) {
    for (const metric of ['carbon', 'water']) {
      const ranges = set.map((r) => Calc.rowRange(r, metric, US));
      const total = Calc.totalRange(set, metric, US);
      const ordered = ranges.every((r) => r.low <= r.central && r.central <= r.high);
      const sums = Calc.LEVELS.every((l) => Math.abs(total[l] - ranges.reduce((s, r) => s + r[l], 0)) < 1e-9);
      check(`5.3 ${name} (${set.length} rows, ${metric}): rows ordered, total = sum of rows`, ordered && sums,
        `${round(total.low)} · ${round(total.central)} · ${round(total.high)}`);
    }
  }
}

// 5.4: the driver list depends on the metric — water adds the water factors.
{
  const c = Calc.drivers(tv2, 'carbon', US).map((x) => x.id);
  const w = Calc.drivers(tv2, 'water', US).map((x) => x.id);
  check('5.4 carbon and water driver lists differ', c.join(',') !== w.join(','), `carbon: ${c.join(', ')} | water: ${w.join(', ')}`);
}

// 5.5: yearly = daily × 365 for each level (the page multiplies by DAYS).
check('5.5 a year is 365 days', D.DAYS === 365, `DAYS = ${D.DAYS}`);

// 5.6: all inputs at zero → totals 0 and no drivers.
{
  const zeroAI = [{ model: 'gpt-5.5', size: 'chat', count: 0 }, { model: 'gpt-5.5', size: 'agent-heavy', count: 0 }, { type: 'video', tier: 'mid', amount: 0 }];
  const zeroOther = D.STREAMING_DEVICES.map((d) => ({ device: d.id, hours: 0 })).concat(call('laptop', 'on', 0));
  for (const [name, set] of [['AI', zeroAI], ['other digital', zeroOther]]) {
    const t = Calc.totalRange(set, 'carbon', US);
    check(`5.6 ${name} all zero → 0 · 0 · 0 and no drivers`,
      t.low === 0 && t.central === 0 && t.high === 0 && Calc.drivers(set, 'carbon', US).length === 0, '');
  }
}

// Shared inputs move once across every row that uses them: PUE's swing for
// agent + media together equals the sum of its swings for each alone.
{
  const swing = (set) => Calc.totalDaily(set, 'energy', US, { vary: 'pue', varyLevel: 'high' }) - Calc.totalDaily(set, 'energy', US, { vary: 'pue', varyLevel: 'low' });
  approx('shared input: PUE swing across agent + media rows = sum of parts',
    swing(heavy1.concat([video10])), swing(heavy1) + swing([video10]), 1e-9);
}

// 5.7: every spec glossary term is defined; factual definitions cite a source.
{
  const specTerms = ['g CO₂e', 'Wh and kWh', 'mL and L', 'Blue water', 'On-site and off-site water', 'PUE',
    'Grid intensity', 'Tokens and cache reads', 'EcoLogits', 'Derived estimate', 'Borrowed range', 'Outer bounds'];
  const noSourceNeeded = ['Wh and kWh', 'mL and L', 'Derived estimate', 'Borrowed range', 'Outer bounds']; // units and project terms
  for (const term of specTerms) {
    const g = D.GLOSSARY.find((x) => x.term === term);
    const needs = !noSourceNeeded.includes(term);
    check(`5.7 glossary: "${term}" defined${needs ? ' with a source' : ''}`,
      !!g && g.def.length > 20 && (!needs || g.sources.length > 0), g ? (g.sources.length ? `sources ${g.sources.join(', ')}` : 'no source (unit or project term)') : 'missing');
  }
}

// --------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
