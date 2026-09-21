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

  // One prompt of `size` on `model`. grid is g CO2e/kWh for the chosen location.
  function perPrompt(model, size, metric, grid) {
    const s = model.sizes[size];
    if (metric === 'carbon') return (s.wh / 1000) * grid + s.emb; // grams
    return s.ml / 1000; // liters
  }

  // rows: [{ model, size, count }]
  function aiDaily(rows, metric, grid) {
    let total = 0;
    for (const r of rows) {
      if (!r.count) continue;
      const m = getModel(r.model);
      if (!m.sizes[r.size]) continue;
      total += r.count * perPrompt(m, r.size, metric, grid);
    }
    return total;
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

  return { getModel, getLocation, perPrompt, aiDaily, rowShares, dailyFootprint, itemDaily, itemAnnual };
});
