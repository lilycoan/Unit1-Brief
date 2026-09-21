// ==========================================================================
// calc.js — pure footprint calculations. No page access: everything a
// function needs is passed in, so the same code runs in the browser
// (window.FootprintCalc) and in Node (require('./calc.js')) for the tests.
// Units: carbon in g CO2e, water in L, unless a name says otherwise.
// ==========================================================================
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.FootprintCalc = factory(root.FootprintData);
})(this, function (D) {
  'use strict';

  const getModel = (id) => D.MODELS.find((m) => m.id === id) || D.MODELS[0];
  const getLocation = (id) => D.LOCATIONS.find((x) => x.id === id) || D.LOCATIONS[0];

  // --------------------------------------------------------------------------
  // Scenarios (spec feature 5). Every uncertain input has a low, central, and
  // high value. A scenario says which one to use for each input:
  //   { base: 'low' | 'central' | 'high' }       — every input at that level
  //   { vary: inputId, varyLevel: 'low'|'high' } — one input moved, rest central
  // Row and total ranges use the first form; the driver list uses the second.
  // --------------------------------------------------------------------------
  const SCENARIOS = {
    low: { base: 'low' },
    central: { base: 'central' },
    high: { base: 'high' },
  };
  function levelFor(scenario, inputId) {
    if (scenario.vary) return scenario.vary === inputId ? scenario.varyLevel : 'central';
    return scenario.base;
  }

  // Driver input id for text rows: all EcoLogits min/max values move together
  // (plan.md, "Text-row drivers", user's choice A).
  const ECOLOGITS = 'ecologits';
  // Which EcoLogits fields hold each level's value.
  const ECOLOGITS_FIELDS = {
    low: { wh: 'whmin', emb: 'embmin', ml: 'mlmin' },
    central: { wh: 'wh', emb: 'emb', ml: 'ml' },
    high: { wh: 'whmax', emb: 'embmax', ml: 'mlmax' },
  };

  // One prompt of `size` on `model`. grid is g CO2e/kWh for the chosen location.
  // level picks the EcoLogits mean ('central') or its 95% range ends.
  function perPrompt(model, size, metric, grid, level) {
    const s = model.sizes[size];
    const f = ECOLOGITS_FIELDS[level || 'central'];
    if (metric === 'carbon') return (s[f.wh] / 1000) * grid + s[f.emb]; // grams
    return s[f.ml] / 1000; // liters
  }

  // One text row per day under a scenario. rows: [{ model, size, count }]
  function textRowValue(row, metric, grid, scenario) {
    if (!row.count) return 0;
    const m = getModel(row.model);
    if (!m.sizes[row.size]) return 0;
    return row.count * perPrompt(m, row.size, metric, grid, levelFor(scenario || SCENARIOS.central, ECOLOGITS));
  }
  function textRowRange(row, metric, grid) {
    return {
      low: textRowValue(row, metric, grid, SCENARIOS.low),
      central: textRowValue(row, metric, grid, SCENARIOS.central),
      high: textRowValue(row, metric, grid, SCENARIOS.high),
    };
  }

  // Daily AI total under a scenario (central if omitted).
  function aiDaily(rows, metric, grid, scenario) {
    return rows.reduce((sum, r) => sum + textRowValue(r, metric, grid, scenario), 0);
  }
  // Daily AI total as { low, central, high }: each is the sum of the rows' values.
  function aiRange(rows, metric, grid) {
    return {
      low: aiDaily(rows, metric, grid, SCENARIOS.low),
      central: aiDaily(rows, metric, grid, SCENARIOS.central),
      high: aiDaily(rows, metric, grid, SCENARIOS.high),
    };
  }

  // Per-row values for the donut, largest first.
  function rowShares(rows, metric, grid) {
    return rows
      .filter((r) => r.count > 0)
      .map((r) => {
        const m = getModel(r.model);
        const v = r.count * perPrompt(m, r.size, metric, grid);
        return { label: m.name, value: v, size: r.size };
      })
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  // A typical person's daily footprint. ctx: { loc, home, drive, diet, fly } ids.
  function dailyFootprint(ctx, metric) {
    const loc = getLocation(ctx.loc);
    const home = D.HOMES.find((x) => x.id === ctx.home) || D.HOMES[1];
    const drive = D.DRIVING.find((x) => x.id === ctx.drive) || D.DRIVING[2];
    const diet = D.DIETS.find((x) => x.id === ctx.diet) || D.DIETS[1];
    const fly = D.FLYING.find((x) => x.id === ctx.fly) || D.FLYING[2];
    if (metric === 'carbon') return ((loc.c + home.c + drive.c + diet.c + fly.c) * 1000) / D.DAYS; // g/day
    return (loc.w * D.GAL_TO_L) / D.DAYS; // L/day (water folded onto location baseline only)
  }

  // A comparison item in the same base units as aiDaily (g carbon or L water).
  function itemDaily(item, metric) { return metric === 'carbon' ? item.c * 1000 : item.w * D.GAL_TO_L; }
  function itemAnnual(item, metric) { return metric === 'carbon' ? item.c * 1000 : item.w * D.GAL_TO_L; }

  return {
    SCENARIOS, ECOLOGITS, levelFor,
    getModel, getLocation, perPrompt, textRowValue, textRowRange, aiDaily, aiRange,
    rowShares, dailyFootprint, itemDaily, itemAnnual,
  };
});
