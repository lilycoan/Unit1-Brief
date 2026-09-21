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
  report(name, ok, `got ${round(actual)}, expected ${expected} ± ${tol}`);
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
approx('5 GPT-5.5 chatbot replies, US, carbon (g)', Calc.aiDaily(rows('gpt-5.5:chat:5'), 'carbon', US), 5.40019, 1e-6);
approx('5 GPT-5.5 chatbot replies, water (L)', Calc.aiDaily(rows('gpt-5.5:chat:5'), 'water', US), 0.0479645, 1e-9);

// Daily totals shown on the page before the refactor (captured 2026-09-21
// from the rendered verdict line for each existing preset, US grid unless
// stated). Tolerance = half the last digit the page displayed.
const BASELINE = [
  // [preset rows, location, carbon g, tol, water L, tol]
  ['gpt-5.5:chat:5', 'us', 5.4, 0.05, 0.048, 0.0005],
  ['claude-sonnet-4-6:chat:8,claude-sonnet-4-6:summary:3', 'us', 3.2, 0.05, 0.029, 0.0005],
  ['gpt-5.5:report:2,claude-opus-4-8:long:1,gpt-5.5:chat:10', 'us', 64, 0.5, 0.587, 0.0005],
  ['claude-sonnet-4-6:agent:3,claude-sonnet-4-6:chat:15', 'us', 241, 0.5, 2.2, 0.05],
  ['gpt-5.5-pro:report:2,claude-opus-4-8:agent:2,gpt-5.5:chat:30', 'us', 1300, 50, 12, 0.5],
  ['gpt-5.5:chat:10,gpt-5.5:email:5,gpt-5.5:summary:2', 'us', 15, 0.5, 0.129, 0.0005],
  ['gpt-5.5:chat:5', 'in', 9.7, 0.05, 0.048, 0.0005],
];
for (const [r, loc, carbon, cTol, water, wTol] of BASELINE) {
  const grid = Calc.getLocation(loc).grid;
  approx(`baseline ${r} @${loc}, carbon (g)`, Calc.aiDaily(rows(r), 'carbon', grid), carbon, cTol);
  approx(`baseline ${r} @${loc}, water (L)`, Calc.aiDaily(rows(r), 'water', grid), water, wTol);
}

// Typical-person daily footprint, US, medium home, average driving/diet,
// flies sometimes: (3000 + 3500 + 4800 + 2500 + 2300) × 1000 / 365 g.
approx('typical daily footprint, US defaults (g)',
  Calc.dailyFootprint({ loc: 'us', home: 'med', drive: 'davg', diet: 'avg', fly: 'some' }, 'carbon'),
  16100 * 1000 / 365, 1e-6);

// --------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
