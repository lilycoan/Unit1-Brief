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
  // (agent and media rows). Water uses the data-centre water factor.
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
  // Generated media (spec feature 1). A media row is { type, tier, amount }.
  //   Video Wh = seconds × tier Wh per video-second × PUE
  //   Image Wh = images × tier Wh per image × CPU+RAM factor × PUE
  // --------------------------------------------------------------------------
  const isMediaRow = (row) => row.type === 'video' || row.type === 'image';
  const getMediaTier = (type, tier) => (D.MEDIA_TIERS[type] || []).find((t) => t.id === tier);
  function mediaWh(row, scenario) {
    const tier = getMediaTier(row.type, row.tier);
    if (!tier || !row.amount) return 0;
    const perUnit = inputValue(scenario, tier.input);
    const cpuRam = row.type === 'image' ? inputValue(scenario, 'cpuRam') : 1;
    return row.amount * perUnit * cpuRam * inputValue(scenario, 'pue');
  }

  // --------------------------------------------------------------------------
  // Streaming (spec feature 3). A streaming row is { device, hours }.
  //   Wh per hour = device watts + network + data centre
  //   Water (L)   = [(device + network Wh) × off-site factor
  //                  + data-centre Wh × data-centre factor] ÷ 1,000
  // --------------------------------------------------------------------------
  const isStreamingRow = (row) => typeof row.device === 'string';
  const getStreamingDevice = (id) => D.STREAMING_DEVICES.find((d) => d.id === id);
  // Energy parts for one hour of streaming on a device.
  function streamingHourParts(deviceId, scenario) {
    const device = getStreamingDevice(deviceId);
    const net = inputValue(scenario, 'streamNetwork');
    return { device: device ? inputValue(scenario, device.input) : 0, network: net.network, dc: net.dc };
  }
  function streamingValue(row, metric, grid, scenario) {
    if (!row.hours || !getStreamingDevice(row.device)) return 0;
    const p = streamingHourParts(row.device, scenario);
    const wh = row.hours * (p.device + p.network + p.dc);
    if (metric === 'energy') return wh;
    if (metric === 'carbon') return (wh / 1000) * grid;
    return (row.hours * ((p.device + p.network) * inputValue(scenario, 'offsiteWater') +
      p.dc * inputValue(scenario, 'dcWater'))) / 1000;
  }

  // --------------------------------------------------------------------------
  // Video calls (spec feature 4). A call row is { callDevice, camera, hours }.
  //   Wh per hour = device watts + data (GB) × network Wh per GB + server proxy
  //   Water (L)   = [(device + network Wh) × off-site factor
  //                  + server Wh × data-centre factor] ÷ 1,000
  // Devices without call data (tablet, desktop) contribute nothing.
  // --------------------------------------------------------------------------
  const isCallRow = (row) => typeof row.callDevice === 'string';
  const getCallDevice = (id) => D.CALL_DEVICES.find((d) => d.id === id);
  // Energy parts for one hour of a call, or null if the device has no data.
  function callHourParts(deviceId, camera, scenario) {
    const device = getCallDevice(deviceId);
    if (!device || device.unavailable) return null;
    const cam = camera === 'off' ? 'off' : 'on';
    const gb = inputValue(scenario, D.CALL_DATA[cam]);
    return {
      device: inputValue(scenario, device.power[cam]),
      network: gb * inputValue(scenario, 'networkPerGB'),
      server: inputValue(scenario, 'serverProxy'),
    };
  }
  function callValue(row, metric, grid, scenario) {
    const p = row.hours ? callHourParts(row.callDevice, row.camera, scenario) : null;
    if (!p) return 0;
    const wh = row.hours * (p.device + p.network + p.server);
    if (metric === 'energy') return wh;
    if (metric === 'carbon') return (wh / 1000) * grid;
    return (row.hours * ((p.device + p.network) * inputValue(scenario, 'offsiteWater') +
      p.server * inputValue(scenario, 'dcWater'))) / 1000;
  }

  // --------------------------------------------------------------------------
  // Rows and totals
  // --------------------------------------------------------------------------
  // One row's value per day under a scenario (central if omitted).
  // AI rows are text/agent rows { model, size, count, ...agent fields } or
  // media rows { type, tier, amount }; other digital rows are streaming rows
  // { device, hours } or call rows { callDevice, camera, hours }.
  function rowValue(row, metric, grid, scenario) {
    const sc = scenario || SCENARIOS.central;
    if (isCallRow(row)) return callValue(row, metric, grid, sc);
    if (isStreamingRow(row)) return streamingValue(row, metric, grid, sc);
    if (isMediaRow(row)) return fromEnergy(mediaWh(row, sc), metric, grid, sc);
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

  // Daily total of a set of rows ("Your AI use" or "Your other digital use")
  // under a scenario (central if omitted).
  function totalDaily(rows, metric, grid, scenario) {
    return rows.reduce((sum, r) => sum + rowValue(r, metric, grid, scenario), 0);
  }
  // Daily total as { low, central, high }: each is the sum of the rows' values.
  function totalRange(rows, metric, grid) {
    return rangeOf((sc) => totalDaily(rows, metric, grid, sc));
  }

  // --------------------------------------------------------------------------
  // What drives the range (spec feature 5). Each uncertain input is moved from
  // its low to its high with everything else central; the change in the total
  // is its swing. Shared inputs move in every row that uses them at once,
  // because each is declared once. Grid intensity is not an input, so it is
  // never varied.
  // --------------------------------------------------------------------------
  const DRIVER_IDS = [ECOLOGITS].concat(Object.keys(D.INPUTS));
  const driverInfo = (id) => (id === ECOLOGITS ? D.ECOLOGITS_INPUT : D.INPUTS[id]);
  function swingOf(rows, id, metric, grid) {
    return totalDaily(rows, metric, grid, { vary: id, varyLevel: 'high' }) -
      totalDaily(rows, metric, grid, { vary: id, varyLevel: 'low' });
  }
  // The top `n` inputs by swing in `metric`, largest first. Each entry has the
  // swing in the metric's units and in Wh (0 for inputs, like water factors,
  // that don't change energy). Inputs with no effect are left out.
  function drivers(rows, metric, grid, n) {
    return DRIVER_IDS
      .map((id) => {
        const info = driverInfo(id);
        return { id, label: info.label, sources: info.sources, why: info.why,
          swing: swingOf(rows, id, metric, grid), energySwing: swingOf(rows, id, 'energy', grid) };
      })
      .filter((d) => d.swing > 1e-12)
      .sort((a, b) => b.swing - a.swing)
      .slice(0, n || 3);
  }

  // Donut label for any AI row.
  function rowLabel(r) {
    if (isMediaRow(r)) {
      const tier = getMediaTier(r.type, r.tier);
      return `${r.type === 'video' ? 'Video' : 'Images'}, ${tier ? tier.label.toLowerCase() : ''}`;
    }
    return isAgentSize(r.size) ? getAgentSize(r.size).label : getModel(r.model).name;
  }
  // Per-row central values for the donut, largest first.
  function rowShares(rows, metric, grid) {
    return rows
      .map((r) => ({
        label: rowLabel(r),
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
    getModel, getLocation, isTextSize, isAgentSize, getAgentSize, isMediaRow, getMediaTier,
    isStreamingRow, getStreamingDevice, isCallRow, getCallDevice,
    perPrompt, agentTokens, agentSessionWh, mediaWh, streamingHourParts, callHourParts,
    rowValue, rowRange, projectRange, totalDaily, totalRange, drivers,
    rowShares, dailyFootprint, itemDaily, itemAnnual,
  };
});
