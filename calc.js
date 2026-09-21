// ==========================================================================
// calc.js — pure footprint calculations. No page access: everything a
// function needs is passed in, so the same code runs in the browser
// (window.FootprintCalc) and in Node (require('./calc.js')) for the tests.
// Metrics: 'energy' in Wh, 'carbon' in g CO2e, 'water' in L.
// ==========================================================================
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data.js'));
  else root.FootprintCalc = factory(root.FootprintData);
})(this, function (D) {
  'use strict';

  const getModel = (id) => D.MODELS.find((m) => m.id === id) || D.MODELS[0];
  const getLocation = (id) => D.LOCATIONS.find((x) => x.id === id) || D.LOCATIONS[0];
  const isTextSize = (size) => D.SIZES.some((s) => s.id === size);
  const getAgentSize = (size) => D.AGENT_SIZES.find((s) => s.id === size);
  const isAgentSize = (size) => !!getAgentSize(size);

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
  const LEVELS = ['low', 'central', 'high'];
  function levelFor(scenario, inputId) {
    if (scenario.vary) return scenario.vary === inputId ? scenario.varyLevel : 'central';
    return scenario.base;
  }
  // The value of a data.js INPUTS entry under a scenario.
  const inputValue = (scenario, inputId) => D.INPUTS[inputId][levelFor(scenario, inputId)];

  // Energy (Wh) to the selected metric, for rows that price energy directly
  // (agent rows now; media, streaming, and calls later). Water uses the
  // data-centre water factor.
  function fromEnergy(wh, metric, grid, scenario) {
    if (metric === 'energy') return wh;
    if (metric === 'carbon') return (wh / 1000) * grid;
    return (wh / 1000) * inputValue(scenario, 'dcWater');
  }

  // --------------------------------------------------------------------------
  // Text rows: EcoLogits per-prompt figures. Driver input id for text rows:
  // all EcoLogits min/max values move together (plan.md, "Text-row drivers",
  // user's choice A).
  // --------------------------------------------------------------------------
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
    if (metric === 'energy') return s[f.wh];
    if (metric === 'carbon') return (s[f.wh] / 1000) * grid + s[f.emb]; // grams
    return s[f.ml] / 1000; // liters
  }

  // --------------------------------------------------------------------------
  // Agent sessions (spec feature 2).
  //   Wh per session = (fresh × input factor + cache reads × input factor ×
  //                     cache-read setting + output × output factor) ÷ 1,000 × PUE
  // --------------------------------------------------------------------------
  // Token counts for one session of an agent row: a tier's total split by the
  // shared token mix, or the user's own counts in advanced ('agent-custom') mode.
  function agentTokens(row) {
    const tier = getAgentSize(row.size);
    if (tier && tier.tokens) {
      const mix = D.AGENT_TOKEN_MIX;
      return { fresh: tier.tokens * mix.fresh, cache: tier.tokens * mix.cache, output: tier.tokens * mix.output };
    }
    return { fresh: row.fresh || 0, cache: row.cache || 0, output: row.output || 0 };
  }
  // Cache-read share under a scenario. In advanced mode the user's setting
  // replaces the central value; the low and high ends stay at 1% and 25%.
  function cacheShare(row, scenario) {
    const level = levelFor(scenario, 'cacheRead');
    if (level === 'central' && row.size === 'agent-custom' && row.cacheSetting != null) return row.cacheSetting;
    return D.INPUTS.cacheRead[level];
  }
  function agentSessionWh(row, scenario) {
    const t = agentTokens(row);
    const f = inputValue(scenario, 'providerFactor');
    const pue = inputValue(scenario, 'pue');
    return ((t.fresh * f.input + t.cache * f.input * cacheShare(row, scenario) + t.output * f.output) / 1000) * pue;
  }

  // --------------------------------------------------------------------------
  // Rows and totals
  // --------------------------------------------------------------------------
  // One row's value per day under a scenario (central if omitted).
  // rows: [{ model, size, count, ...agent fields }]
  function rowValue(row, metric, grid, scenario) {
    const sc = scenario || SCENARIOS.central;
    if (!row.count) return 0;
    if (isAgentSize(row.size)) return row.count * fromEnergy(agentSessionWh(row, sc), metric, grid, sc);
    if (!isTextSize(row.size)) return 0; // e.g. the removed 'agent' size
    const m = getModel(row.model);
    if (!m.sizes[row.size]) return 0;
    return row.count * perPrompt(m, row.size, metric, grid, levelFor(sc, ECOLOGITS));
  }
  // { low, central, high } of any per-scenario function.
  function rangeOf(fn) {
    return { low: fn(SCENARIOS.low), central: fn(SCENARIOS.central), high: fn(SCENARIOS.high) };
  }
  function rowRange(row, metric, grid) {
    return rangeOf((sc) => rowValue(row, metric, grid, sc));
  }
  // An agent row's project total: sessions in the project × one session.
  // Not part of the daily or yearly totals.
  function projectRange(row, metric, grid) {
    if (!isAgentSize(row.size)) return { low: 0, central: 0, high: 0 };
    const sessions = row.project || 0;
    return rangeOf((sc) => sessions * fromEnergy(agentSessionWh(row, sc), metric, grid, sc));
  }

  // Daily AI total under a scenario (central if omitted).
  function aiDaily(rows, metric, grid, scenario) {
    return rows.reduce((sum, r) => sum + rowValue(r, metric, grid, scenario), 0);
  }
  // Daily AI total as { low, central, high }: each is the sum of the rows' values.
  function aiRange(rows, metric, grid) {
    return rangeOf((sc) => aiDaily(rows, metric, grid, sc));
  }

  // Per-row central values for the donut, largest first.
  function rowShares(rows, metric, grid) {
    return rows
      .map((r) => ({
        label: isAgentSize(r.size) ? getAgentSize(r.size).label : getModel(r.model).name,
        value: rowValue(r, metric, grid),
        size: r.size,
      }))
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
    SCENARIOS, LEVELS, ECOLOGITS, levelFor,
    getModel, getLocation, isTextSize, isAgentSize, getAgentSize,
    perPrompt, agentTokens, agentSessionWh,
    rowValue, rowRange, projectRange, aiDaily, aiRange,
    rowShares, dailyFootprint, itemDaily, itemAnnual,
  };
});
