(function () {
  'use strict';

  // Data tables live in data.js; pure calculations live in calc.js.
  const {
    MODELS, SIZES, LOCATIONS, HOMES, DRIVING, DIETS, FLYING,
    DAILY_ITEMS, ANNUAL_ITEMS, DAYS,
    INPUTS, AGENT_SIZES, CACHE_SETTINGS, AGENT_CROSS_CHECKS,
    MEDIA_TYPES, MEDIA_TIERS, STREAMING_DEVICES, STREAMING_CROSS_CHECKS,
    CALL_DEVICES, CALL_DATA, CALL_CROSS_CHECKS, GLOSSARY,
  } = window.FootprintData;
  const Calc = window.FootprintCalc;

  // ==========================================================================
  // Persona presets
  // ==========================================================================
  const PERSONAS = [
    { id: 'casual',   label: 'Casual chatbot user', icon: '💬',
      rows: [['gpt-5.5', 'chat', 5]] },
    { id: 'student',  label: 'Student', icon: '🎓',
      rows: [['claude-sonnet-4-6', 'chat', 8], ['claude-sonnet-4-6', 'summary', 3]] },
    { id: 'researcher', label: 'Daily researcher', icon: '🔬',
      rows: [['gpt-5.5', 'report', 2], ['claude-opus-4-8', 'long', 1], ['gpt-5.5', 'chat', 10]] },
    { id: 'engineer', label: 'Software engineer', icon: '💻',
      rows: [['claude-sonnet-4-6', 'agent-light', 3], ['claude-sonnet-4-6', 'chat', 15]] },
    { id: 'power',    label: 'AI power user', icon: '⚡',
      rows: [['gpt-5.5-pro', 'report', 2], ['claude-opus-4-8', 'agent-heavy', 2], ['gpt-5.5', 'chat', 30]] },
    { id: 'team',     label: 'Small company / team', icon: '🏢',
      rows: [['gpt-5.5', 'chat', 10], ['gpt-5.5', 'email', 5], ['gpt-5.5', 'summary', 2]] },
  ];

  // ==========================================================================
  // State
  // ==========================================================================
  let uidSeq = 1;
  const noStreaming = () => Object.fromEntries(STREAMING_DEVICES.map((d) => [d.id, 0]));
  const noCalls = () => ({ hours: 0, device: 'laptop', camera: 'on' });
  const state = { rows: [], media: [], streaming: noStreaming(), calls: noCalls(), metric: 'carbon', persona: 'casual', loc: 'us', home: 'med', drive: 'davg', diet: 'avg', fly: 'some' };
  // One-line message shown above the rows (e.g. an old share link was changed).
  let notice = '';

  // Every row carries the agent fields too, so switching a row's length to an
  // agent session has sensible defaults: a 20-session project, and custom
  // token counts that start at the heavy tier's split at the 10% setting.
  function newRow(model, size, count, extra) {
    return Object.assign(
      { id: uidSeq++, model, size, count, project: 20, fresh: 360000, cache: 9600000, output: 40000, cacheSetting: 0.10 },
      extra || {});
  }

  // Share-link row format (fields separated by ':'):
  //   text rows    model:size:count
  //   agent tiers  model:size:count:project
  //   custom agent model:agent-custom:count:project:fresh:cache:output:cacheSetting
  // Rows with the removed fixed 'agent' size are dropped with a notice
  // (plan.md, "Old share links", user's choice A).
  // Generated-media rows: { type: 'video'|'image', tier, amount per day }.
  // Defaults when added or when the type changes: 10 s of mid-size video, or
  // 5 standard images.
  const MEDIA_DEFAULTS = { video: { tier: 'mid', amount: 10 }, image: { tier: 'standard', amount: 5 } };
  function newMediaRow(type, tier, amount) {
    const d = MEDIA_DEFAULTS[type] || MEDIA_DEFAULTS.image;
    return { id: uidSeq++, type: MEDIA_DEFAULTS[type] ? type : 'image', tier: tier || d.tier, amount: amount == null ? d.amount : amount };
  }

  function rowFromLink(chunk) {
    const [model, size, count, project, fresh, cache, output, setting] = chunk.split(':');
    const num = (v, dflt) => (v === undefined || v === '' || !isFinite(Number(v)) ? dflt : Math.max(0, Number(v)));
    const row = newRow(model, size, num(count, 0));
    if (Calc.isAgentSize(size)) {
      row.project = num(project, row.project);
      if (size === 'agent-custom') {
        row.fresh = num(fresh, row.fresh);
        row.cache = num(cache, row.cache);
        row.output = num(output, row.output);
        row.cacheSetting = CACHE_SETTINGS.includes(Number(setting)) ? Number(setting) : row.cacheSetting;
      }
    }
    return row;
  }
  function rowToLink(r) {
    const base = `${r.model}:${r.size}:${r.count}`;
    if (!Calc.isAgentSize(r.size)) return base;
    if (r.size !== 'agent-custom') return `${base}:${r.project}`;
    return `${base}:${r.project}:${r.fresh}:${r.cache}:${r.output}:${r.cacheSetting}`;
  }

  function loadFromUrl() {
    const streamed = noStreaming();
    const calls = noCalls();
    try {
      const p = new URLSearchParams(location.hash.slice(1));
      const r = p.get('r');
      if (r) {
        const all = r.split(',').filter(Boolean).map(rowFromLink);
        state.rows = all.filter((row) => row.size !== 'agent');
        if (state.rows.length < all.length) {
          notice = "An old 'agent session' row was removed because the method changed. Add an agent session to include it.";
        }
        state.persona = null;
      }
      // Media rows: m=type:tier:amount,...
      const m = p.get('m');
      if (m) {
        state.media = m.split(',').filter(Boolean).map((chunk) => {
          const [type, tier, amount] = chunk.split(':');
          return newMediaRow(type, tier, Math.max(0, Number(amount) || 0));
        }).filter((row) => Calc.getMediaTier(row.type, row.tier));
        state.persona = null;
      }
      ['metric', 'loc', 'home', 'drive', 'diet', 'fly'].forEach((k) => {
        if (p.get(k)) state[k] = p.get(k);
      });
      // Streaming hours: s=device:hours,... (applied below, after the preset
      // fallback, which resets every input)
      (p.get('s') || '').split(',').filter(Boolean).forEach((chunk) => {
        const [device, hours] = chunk.split(':');
        if (device in streamed) streamed[device] = Math.max(0, Number(hours) || 0);
      });
      // Video calls: c=hours:device:camera
      const c = (p.get('c') || '').split(':');
      if (Number(c[0]) > 0 && Calc.getCallDevice(c[1])) {
        calls.hours = Number(c[0]);
        calls.device = c[1];
        calls.camera = c[2] === 'off' ? 'off' : 'on';
      }
    } catch (e) { /* ignore malformed url state */ }
    const anyStreaming = Object.values(streamed).some((h) => h > 0);
    if (!state.rows.length && !state.media.length && !anyStreaming && !calls.hours) applyPersona(state.persona || 'casual', { silent: true });
    if (anyStreaming) { state.streaming = streamed; state.persona = null; }
    if (calls.hours) { state.calls = calls; state.persona = null; }
  }
  function saveToUrl() {
    const p = new URLSearchParams();
    p.set('r', state.rows.map(rowToLink).join(','));
    if (state.media.length) p.set('m', state.media.map((r) => `${r.type}:${r.tier}:${r.amount}`).join(','));
    const streamed = otherRows().filter((r) => Calc.isStreamingRow(r) && r.hours);
    if (streamed.length) p.set('s', streamed.map((r) => `${r.device}:${r.hours}`).join(','));
    if (state.calls.hours) p.set('c', `${state.calls.hours}:${state.calls.device}:${state.calls.camera}`);
    p.set('metric', state.metric);
    p.set('loc', state.loc); p.set('home', state.home); p.set('drive', state.drive);
    p.set('diet', state.diet); p.set('fly', state.fly);
    history.replaceState(null, '', '#' + p.toString());
  }

  function applyPersona(id, opts) {
    const persona = PERSONAS.find((x) => x.id === id);
    if (!persona) return;
    state.persona = id;
    state.rows = persona.rows.map(([model, size, count]) => newRow(model, size, count));
    state.media = (persona.media || []).map(([type, tier, amount]) => newMediaRow(type, tier, amount));
    state.streaming = Object.assign(noStreaming(), persona.streaming || {});
    state.calls = Object.assign(noCalls(), persona.calls || {});
    if (!(opts && opts.silent)) render();
  }

  // ==========================================================================
  // Math — thin wrappers that pass the current page state into calc.js
  // ==========================================================================
  const getLoc = () => Calc.getLocation(state.loc);
  // Every AI row: text and agent rows, then generated-media rows.
  const aiRows = () => state.rows.concat(state.media);
  const aiDaily = (metric) => Calc.totalDaily(aiRows(), metric, getLoc().grid);
  const aiRange = (metric) => Calc.totalRange(aiRows(), metric, getLoc().grid);
  // Every other-digital row: streaming hours per device, then the call.
  // Kept apart from aiRows(), so these never change "Your AI use".
  const callRow = () => ({ callDevice: state.calls.device, camera: state.calls.camera, hours: state.calls.hours });
  const otherRows = () => STREAMING_DEVICES.map((d) => ({ device: d.id, hours: state.streaming[d.id] })).concat([callRow()]);
  const otherDaily = (metric) => Calc.totalDaily(otherRows(), metric, getLoc().grid);
  const otherRange = (metric) => Calc.totalRange(otherRows(), metric, getLoc().grid);
  const rowRange = (row, metric) => Calc.rowRange(row, metric, getLoc().grid);
  const projectRange = (row, metric) => Calc.projectRange(row, metric, getLoc().grid);
  const rowShares = (metric) => Calc.rowShares(aiRows(), metric, getLoc().grid);
  const dailyFootprint = (metric) => Calc.dailyFootprint(state, metric);
  const itemDaily = Calc.itemDaily;
  const itemAnnual = Calc.itemAnnual;

  // ==========================================================================
  // Formatting
  // ==========================================================================
  function sig(n) {
    if (!isFinite(n) || n === 0) return '0';
    const a = Math.abs(n);
    if (a >= 1000) return Math.round(n).toLocaleString('en-US');
    if (a >= 10) return String(Math.round(n));
    if (a >= 1) return String(Math.round(n * 10) / 10);
    if (a >= 0.1) return String(Math.round(n * 100) / 100);
    return String(Number(n.toPrecision(2)));
  }
  // Display unit for a value (Wh energy, g carbon, or L water), chosen by its size.
  // Energy stays in Wh so it reads directly against the spec and cross-checks.
  function unitFor(v, metric) {
    if (metric === 'energy') return { unit: 'Wh', conv: (x) => x };
    if (metric === 'carbon') {
      if (v >= 1e6) return { unit: 't CO₂e', conv: (x) => x / 1e6 };
      if (v >= 1000) return { unit: 'kg CO₂e', conv: (x) => x / 1000 };
      return { unit: 'g CO₂e', conv: (x) => x };
    }
    if (v >= 1) return { unit: 'L', conv: (x) => x };
    return { unit: 'mL', conv: (x) => x * 1000 };
  }
  // A declared input value (watts, Wh per unit) at its own precision, up to
  // 4 significant figures, e.g. 93.2, 2.228, 12.94 — not rounded like results.
  const fmtInput = (v) => String(Number(v.toPrecision(4)));
  function fmtMetric(v, metric) {
    const u = unitFor(v, metric || state.metric);
    return sig(u.conv(v)) + ' ' + u.unit;
  }
  // "low · central · high unit" — all three in the unit that fits the central
  // value, so the numbers can be compared at a glance.
  function fmtRange(r, metric) {
    const u = unitFor(r.central, metric || state.metric);
    return [r.low, r.central, r.high].map((v) => sig(u.conv(v))).join(' · ') + ' ' + u.unit;
  }

  // ==========================================================================
  // Render
  // ==========================================================================
  const $ = (id) => document.getElementById(id);

  function renderPersonas() {
    const host = $('personas');
    host.innerHTML = '';
    PERSONAS.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'persona-btn' + (state.persona === p.id ? ' is-active' : '');
      btn.textContent = `${p.icon} ${p.label}`;
      btn.addEventListener('click', () => { applyPersona(p.id); saveToUrl(); });
      host.appendChild(btn);
    });
  }

  function renderMetricToggle() {
    document.querySelectorAll('.metric-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.metric === state.metric);
    });
  }

  const modelOptionsHtml = MODELS.map((m) => `<option value="${m.id}">${m.name}</option>`).join('');
  const sizeOptionsHtml = SIZES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('') +
    '<optgroup label="Agent sessions (not model-specific)">' +
    AGENT_SIZES.map((s) => `<option value="${s.id}">${s.label}${s.detail ? ' · ' + s.detail : ''}</option>`).join('') +
    '</optgroup>';
  const pct = (x) => `${Math.round(x * 100)}%`;
  const srcText = (sources) => `source${sources.length > 1 ? 's' : ''} ${sources.join(', ')}`;

  // Energy / carbon / water result slots, filled by fillMetrics().
  const METRICS_HTML = `
      <div class="metric-results">
        <span class="range-period">Energy</span><span data-out="energy"></span>
        <span class="range-period">Carbon</span><span data-out="carbon"></span>
        <span class="range-period">Water</span><span data-out="water"></span>
      </div>`;
  function fillMetrics(node, row, perDayNote) {
    for (const metric of ['energy', 'carbon', 'water']) {
      node.querySelector(`[data-out="${metric}"]`).innerHTML = fmtRange(rowRange(row, metric), metric) +
        (metric === 'energy' ? ` <span class="range-key">low · central · high, per day (${perDayNote})</span>` : '');
    }
  }

  // The agent-session box under an agent row: inputs (project sessions; token
  // counts and cache-read setting in custom mode) plus result slots that
  // fillRowOutputs() updates in place.
  function agentDetailHtml(row) {
    const tier = Calc.getAgentSize(row.size);
    const f = INPUTS.providerFactor.central;
    const custom = row.size === 'agent-custom';
    const tokenInputs = custom ? `
      <div class="agent-tokens">
        <label>Fresh-input tokens <input type="number" min="0" step="1000" data-field="fresh" value="${row.fresh}"></label>
        <label>Cache-read tokens <input type="number" min="0" step="1000" data-field="cache" value="${row.cache}"></label>
        <label>Output tokens <input type="number" min="0" step="1000" data-field="output" value="${row.output}"></label>
        <label>Cache-read cost <select data-field="cacheSetting">${CACHE_SETTINGS.map((c) =>
          `<option value="${c}"${c === row.cacheSetting ? ' selected' : ''}>${pct(c)} of fresh input</option>`).join('')}</select></label>
      </div>
      <p class="agent-formula">Wh per session = (fresh × ${f.input} + cache reads × ${f.input} × ${pct(row.cacheSetting)} + output × ${f.output}) ÷ 1,000 × PUE ${INPUTS.pue.central}
        <span class="range-key">central values; low and high use cache-read ${pct(INPUTS.cacheRead.low)}–${pct(INPUTS.cacheRead.high)}, per-token ${INPUTS.providerFactor.low.input}–${INPUTS.providerFactor.high.input} (input) and ${INPUTS.providerFactor.low.output}–${INPUTS.providerFactor.high.output} (output) Wh per 1,000 tokens, PUE ${INPUTS.pue.low}–${INPUTS.pue.high}</span></p>` : '';
    const xchecks = AGENT_CROSS_CHECKS.map((c) =>
      `${c.label} ${sig(c.wh)} Wh${c.range ? ` (${sig(c.range[0])}–${sig(c.range[1])})` : ''} (${srcText(c.sources)})`).join(' · ');
    return `
      <p class="agent-head">${tier.label} · <strong>not model-specific</strong>${tier.detail ? ' · ' + tier.detail : ''} · ${srcText(tier.sources)}</p>
      ${tokenInputs}
      ${METRICS_HTML}
      <p class="agent-project">Project: <input type="number" min="0" step="1" data-field="project" value="${row.project}"> sessions →
        <span data-out="project"></span> <span class="range-key">not added to daily or yearly totals</span></p>
      <p class="agent-xcheck">Per session: this estimate <span data-out="session"></span> · ${xchecks}</p>
      <p class="agent-note">Estimated from per-token factors and prices; no source measures agent-session energy directly.</p>`;
  }

  // Result text for one row, written into its existing DOM node. Called on
  // every value change, so typing never rebuilds the inputs (keeps focus).
  function fillRowOutputs(node, row) {
    const first = row === state.rows[0];
    if (!Calc.isAgentSize(row.size)) {
      // Per-day range in the selected metric; the first row says which number is which.
      node.querySelector('.row-range').innerHTML = fmtRange(rowRange(row, state.metric)) +
        (first ? ' <span class="range-key">low · central · high, per day</span>' : '');
      return;
    }
    const out = (name) => node.querySelector(`[data-out="${name}"]`);
    fillMetrics(node, row, `${sig(row.count)} session${row.count === 1 ? '' : 's'}`);
    const proj = projectRange(row, 'energy');
    out('project').textContent = `${fmtRange(proj, 'energy')} (${fmtRange(projectRange(row, state.metric))})`;
    out('session').textContent = `${fmtMetric(Calc.agentSessionWh(row, Calc.SCENARIOS.central), 'energy')} central`;
  }

  // Rebuilds the row inputs. Only called when the rows' structure changes
  // (add, remove, a dropdown, a preset, the metric); typing calls onValues().
  function renderRows() {
    const host = $('rows');
    host.innerHTML = '';
    const tpl = $('row-tpl');
    state.rows.forEach((row) => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.dataset.rowId = row.id;
      const agent = Calc.isAgentSize(row.size);
      const modelSel = node.querySelector('.row-model');
      const sizeSel = node.querySelector('.row-size');
      const countInput = node.querySelector('.row-count');
      // Agent rows ignore the model, so the dropdown is greyed out; the row
      // keeps its model in case the user switches back to a text length.
      modelSel.innerHTML = agent ? '<option>Not model-specific</option>' : modelOptionsHtml;
      modelSel.disabled = agent;
      if (!agent) modelSel.value = row.model;
      sizeSel.innerHTML = sizeOptionsHtml;
      sizeSel.value = row.size;
      countInput.value = row.count;
      countInput.setAttribute('aria-label', agent ? 'Sessions per day' : 'Per day');
      const detail = node.querySelector('.agent-detail');
      if (agent) detail.innerHTML = agentDetailHtml(row);
      detail.hidden = !agent;
      node.querySelector('.row-range').hidden = agent;
      fillRowOutputs(node, row);

      modelSel.addEventListener('change', () => { row.model = modelSel.value; state.persona = null; render(); saveToUrl(); });
      sizeSel.addEventListener('change', () => { row.size = sizeSel.value; state.persona = null; render(); saveToUrl(); });
      countInput.addEventListener('input', () => { row.count = Math.max(0, Number(countInput.value) || 0); onValues(); });
      // Agent-box inputs: numbers update in place; the cache-read setting
      // changes the formula text, so it rebuilds.
      detail.querySelectorAll('input[data-field]').forEach((inp) => {
        inp.addEventListener('input', () => { row[inp.dataset.field] = Math.max(0, Number(inp.value) || 0); onValues(); });
      });
      detail.querySelectorAll('select[data-field]').forEach((sel) => {
        sel.addEventListener('change', () => { row[sel.dataset.field] = Number(sel.value); state.persona = null; render(); saveToUrl(); });
      });
      node.querySelector('.row-remove').addEventListener('click', () => {
        state.rows = state.rows.filter((r) => r.id !== row.id);
        state.persona = null;
        render(); saveToUrl();
      });
      host.appendChild(node);
    });
  }

  // Generated-media rows (spec feature 1).
  function mediaDetailHtml(row) {
    const tier = Calc.getMediaTier(row.type, row.tier);
    const input = INPUTS[tier.input];
    const warning = row.type === 'video'
      ? '<p class="media-warning">⚠ Energy grows faster than clip length, but this estimate is linear: clips much longer than about 5 s are likely undercounted.</p>'
      : '';
    const perUnit = row.type === 'video' ? 'Wh per video-second' : 'GPU Wh per image';
    return `${warning}${METRICS_HTML}
      <p class="media-measured">${tier.label}: ${fmtInput(input.low)} · ${fmtInput(input.central)} · ${fmtInput(input.high)} ${perUnit}. Measured: ${tier.measured} · ${srcText(input.sources)}</p>`;
  }
  function fillMediaOutputs(node, row) {
    const unit = row.type === 'video' ? 's of video' : `image${row.amount === 1 ? '' : 's'}`;
    fillMetrics(node, row, `${sig(row.amount)} ${unit}`);
  }
  function renderMediaRows() {
    const host = $('media-rows');
    host.innerHTML = '';
    $('media-head').hidden = !state.media.length;
    const tpl = $('media-tpl');
    state.media.forEach((row) => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.dataset.rowId = row.id;
      const typeSel = node.querySelector('.media-type');
      const tierSel = node.querySelector('.media-tier');
      const amount = node.querySelector('.media-amount');
      const tier = Calc.getMediaTier(row.type, row.tier);
      typeSel.innerHTML = MEDIA_TYPES.map((t) => `<option value="${t.id}">${t.label}</option>`).join('');
      typeSel.value = row.type;
      tierSel.innerHTML = MEDIA_TIERS[row.type].map((t) => `<option value="${t.id}">${t.label}</option>`).join('');
      tierSel.value = row.tier;
      tierSel.title = `Measured: ${tier.measured}`; // tooltip naming the measured model and resolution
      amount.value = row.amount;
      const amountLabel = MEDIA_TYPES.find((t) => t.id === row.type).amountLabel;
      amount.setAttribute('aria-label', amountLabel);
      amount.title = amountLabel;
      node.querySelector('.media-detail').innerHTML = mediaDetailHtml(row);
      fillMediaOutputs(node, row);

      typeSel.addEventListener('change', () => {
        Object.assign(row, newMediaRow(typeSel.value), { id: row.id });
        state.persona = null; render(); saveToUrl();
      });
      tierSel.addEventListener('change', () => { row.tier = tierSel.value; state.persona = null; render(); saveToUrl(); });
      amount.addEventListener('input', () => { row.amount = Math.max(0, Number(amount.value) || 0); onValues(); });
      node.querySelector('.row-remove').addEventListener('click', () => {
        state.media = state.media.filter((r) => r.id !== row.id);
        state.persona = null;
        render(); saveToUrl();
      });
      host.appendChild(node);
    });
  }

  // Streaming by device (spec feature 3).
  function fillStreamOutputs(node, row) {
    const results = node.querySelector('.stream-results');
    results.hidden = !row.hours;
    if (row.hours) fillMetrics(results, row, `${sig(row.hours)} h`);
  }
  function renderStreaming() {
    const host = $('stream-rows');
    host.innerHTML = '';
    const tpl = $('stream-tpl');
    otherRows().filter(Calc.isStreamingRow).forEach((row) => {
      const d = Calc.getStreamingDevice(row.device);
      const input = INPUTS[d.input];
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.dataset.device = d.id;
      node.querySelector('.stream-name').textContent = d.label;
      const hours = node.querySelector('.stream-hours');
      hours.value = row.hours;
      node.querySelector('.stream-power').innerHTML = `${d.label} power ${fmtInput(input.low)} · ${fmtInput(input.central)} · ${fmtInput(input.high)} W` +
        (d.borrowedNote ? ` · <span class="borrowed">borrowed range: ${d.borrowedNote}</span>` : '') +
        ` · ${srcText(input.sources)}`;
      node.querySelector('.stream-results').innerHTML = METRICS_HTML;
      fillStreamOutputs(node, row);
      hours.addEventListener('input', () => { state.streaming[d.id] = Math.max(0, Number(hours.value) || 0); onValues(); });
      host.appendChild(node);
    });
    const net = INPUTS.streamNetwork;
    const total = (l) => net[l].network + net[l].dc;
    $('stream-network').innerHTML = `Network and data centre, every device: ${fmtInput(total('low'))} · ${fmtInput(total('central'))} · ${fmtInput(total('high'))} Wh per hour` +
      ` · <span class="borrowed">borrowed range</span> · ${srcText(net.sources)}`;
    $('stream-xcheck').textContent = 'Published estimates for one hour of streaming, for comparison (not part of the range): ' +
      STREAMING_CROSS_CHECKS.map((c) => `${c.label} ${c.g} g ${c.gas} (${c.note}; ${srcText(c.sources)})`).join(' · ') + '.';
  }

  // Video calls (spec feature 4).
  const rangeText = (input, unit) => `${fmtInput(input.low)} · ${fmtInput(input.central)} · ${fmtInput(input.high)} ${unit}` +
    (input.borrowed && input.borrowed.length ? ` <span class="borrowed">(${input.borrowed.join(' and ')} borrowed)</span>` : '');
  function fillCallOutputs() {
    const row = callRow();
    const device = Calc.getCallDevice(row.callDevice);
    $('call-unavailable').hidden = !device.unavailable;
    $('call-unavailable').textContent = device.unavailable
      ? `${device.label}: not available — ${device.unavailable}, so nothing is added to your totals.` : '';
    const results = $('call-results');
    results.hidden = !row.hours || !!device.unavailable;
    if (!results.hidden) fillMetrics(results, row, `${sig(row.hours)} h`);
    if (device.unavailable) { $('call-parts').textContent = ''; return; }
    // Per-hour central breakdown, and what the other camera setting gives.
    const p = Calc.callHourParts(row.callDevice, row.camera, Calc.SCENARIOS.central);
    const total = p.device + p.network + p.server;
    const other = row.camera === 'on' ? 'off' : 'on';
    const q = Calc.callHourParts(row.callDevice, other, Calc.SCENARIOS.central);
    const otherTotal = q.device + q.network + q.server;
    const change = Math.round((otherTotal / total - 1) * 100);
    const f3 = (v) => String(Number(v.toPrecision(3))); // spec-level precision, e.g. 24.8
    $('call-parts').textContent = `One hour, central: device ${f3(p.device)} Wh (${Math.round((p.device / total) * 100)}%) · ` +
      `network ${f3(p.network)} Wh · server ${f3(p.server)} Wh = ${f3(total)} Wh. ` +
      `Camera ${other}: ${f3(otherTotal)} Wh (${change > 0 ? '+' : '−'}${Math.abs(change)}%).`;
  }
  function renderCalls() {
    $('call-hours').value = state.calls.hours;
    $('call-device').innerHTML = CALL_DEVICES.map((d) =>
      `<option value="${d.id}">${d.label}${d.unavailable ? ' (not available)' : ''}</option>`).join('');
    $('call-device').value = state.calls.device;
    $('call-camera').value = state.calls.camera;
    $('call-results').innerHTML = METRICS_HTML;
    const device = Calc.getCallDevice(state.calls.device);
    const cam = state.calls.camera;
    const power = device.unavailable ? null : INPUTS[device.power[cam]];
    const data = INPUTS[CALL_DATA[cam]];
    $('call-basis').innerHTML = (power ? `${device.label} power ${rangeText(power, 'W')} (${srcText(power.sources)}) · ` : '') +
      `data ${rangeText(data, 'GB per hour')} (${srcText(data.sources)}) · ` +
      `network ${rangeText(INPUTS.networkPerGB, 'Wh per GB')} (${srcText(INPUTS.networkPerGB.sources)}) · ` +
      `server ${rangeText(INPUTS.serverProxy, 'Wh per hour')}, a proxy from streaming (${srcText(INPUTS.serverProxy.sources)})`;
    // Cross-checks: text only, never part of a range. Greenspector is compared
    // live with this calculator's phone, camera-on estimate on the chosen grid.
    const phoneG = Calc.totalDaily([{ callDevice: 'phone', camera: 'on', hours: 1 }], 'carbon', getLoc().grid);
    $('call-xcheck').innerHTML = 'Published estimates for one hour of a call, for comparison (not part of the range): ' +
      CALL_CROSS_CHECKS.map((c) => {
        let t = `${c.label}: ${c.text}`;
        if (c.phoneRatioG) t += `, about ${sig(c.phoneRatioG / phoneG)}× this calculator’s phone, camera-on estimate on the grid for ${getLoc().label}; the gap is unexplained`;
        if (c.disputed) t += ` — <span class="borrowed">${c.disputed}</span>`;
        return `${t} (${srcText(c.sources)})`;
      }).join(' · ') + '.';
    fillCallOutputs();
  }

  // A typed value changed: refresh every number on the page without
  // rebuilding the inputs, so the box being typed in keeps focus.
  function onValues() {
    state.persona = null;
    renderPersonas();
    state.rows.forEach((row) => {
      const node = $('rows').querySelector(`[data-row-id="${row.id}"]`);
      if (node) fillRowOutputs(node, row);
    });
    state.media.forEach((row) => {
      const node = $('media-rows').querySelector(`[data-row-id="${row.id}"]`);
      if (node) fillMediaOutputs(node, row);
    });
    otherRows().filter(Calc.isStreamingRow).forEach((row) => {
      const node = $('stream-rows').querySelector(`[data-device="${row.device}"]`);
      if (node) fillStreamOutputs(node, row);
    });
    fillCallOutputs();
    renderResults();
    saveToUrl();
  }

  function renderNotice() {
    $('notice').hidden = !notice;
    $('notice-text').textContent = notice;
  }

  function renderVerdict() {
    const daily = aiDaily(state.metric);
    const personal = dailyFootprint(state.metric);
    const items = DAILY_ITEMS.map((it) => ({ label: it.label, value: itemDaily(it, state.metric) }))
      .filter((it) => it.value > 0);
    let closest = items[0];
    let bestRatio = Infinity;
    for (const it of items) {
      const ratio = Math.max(daily, it.value) / Math.max(Math.min(daily, it.value), 1e-9);
      if (ratio < bestRatio) { bestRatio = ratio; closest = it; }
    }
    const pctOfPersonal = personal > 0 ? (daily / personal) * 100 : 0;
    let cmpText = '';
    if (closest && daily > 0) {
      const ratio = daily / closest.value;
      if (ratio >= 0.6 && ratio <= 1.6) {
        cmpText = `about the same ${state.metric === 'carbon' ? 'carbon' : 'water'} as <strong>${closest.label.toLowerCase()}</strong>`;
      } else if (ratio < 0.6) {
        cmpText = `about ${sig(1 / ratio)}× less than <strong>${closest.label.toLowerCase()}</strong>`;
      } else {
        cmpText = `about ${sig(ratio)}× <strong>${closest.label.toLowerCase()}</strong>`;
      }
    }
    const pctText = pctOfPersonal > 0
      ? `roughly <strong>${pctOfPersonal < 1 ? '<1%' : sig(pctOfPersonal) + '%'}</strong> of a typical day's total footprint`
      : '';
    $('verdict').innerHTML = daily > 0
      ? `Your day of AI use ≈ <strong>${fmtMetric(daily)}</strong> — ${cmpText}${pctText ? ', ' + pctText : ''}.`
      : `Add a row to see your footprint.`;
    const other = otherDaily(state.metric);
    if (other > 0) $('verdict').innerHTML += ` Your other digital use ≈ <strong>${fmtMetric(other)}</strong>.`;
    renderTotals();
  }

  // "Your AI use" and "Your other digital use" side by side, each as
  // low · central · high per day and per year, plus a central comparison.
  function renderTotals() {
    const col = (title, day) => {
      const year = { low: day.low * DAYS, central: day.central * DAYS, high: day.high * DAYS };
      return `<div class="totals-col"><span class="range-title">${title}</span>` +
        (day.high > 0
          ? `<span class="range-line"><span class="range-period">per day</span> ${fmtRange(day)}</span>
             <span class="range-line"><span class="range-period">per year</span> ${fmtRange(year)}</span>`
          : '<span class="range-line range-empty">nothing entered</span>') +
        '</div>';
    };
    const ai = aiRange(state.metric);
    const other = otherRange(state.metric);
    $('totals').innerHTML = (ai.high > 0 || other.high > 0)
      ? `<span class="range-key totals-key">low · central · high — <strong>outer bounds</strong>: every assumption at its best or worst case at once, not a likely range</span>${col('Your AI use', ai)}${col('Your other digital use', other)}`
      : '';
    $('outer-note').hidden = !(ai.high > 0 || other.high > 0);
    renderDrivers();
    let compare = '';
    if (ai.central > 0 && other.central > 0) {
      const ratio = ai.central / other.central;
      compare = ratio >= 1
        ? `Central estimates: your AI use is about ${sig(ratio)}× your other digital use.`
        : `Central estimates: your AI use is about ${sig(1 / ratio)}× less than your other digital use.`;
    } else if (ai.central > 0) {
      compare = 'Add streaming or call hours to compare your AI use with your other digital use.';
    }
    $('totals-compare').textContent = compare;
  }

  // What drives each total's range (spec feature 5): the top three inputs by
  // swing in the selected metric, with the energy swing where there is one.
  function renderDrivers() {
    const grid = getLoc().grid;
    const list = (title, rows) => {
      const ds = Calc.drivers(rows, state.metric, grid, 3);
      if (!ds.length) return '';
      return `<div class="drivers-col"><span class="range-title">What drives ${title}</span><ol>` +
        ds.map((d) => `<li><strong>${d.label}</strong>: a swing of ${fmtMetric(d.swing)}` +
          (d.energySwing > 1e-9 ? ` (${fmtMetric(d.energySwing, 'energy')})` : '') +
          ` from its low to its high — ${d.why} (${srcText(d.sources)}).</li>`).join('') +
        '</ol></div>';
    };
    $('drivers').innerHTML = list('your AI use range', aiRows()) + list('your other digital use range', otherRows());
  }

  // Glossary (spec feature 5), opened from the results and the method panel.
  function renderGlossary() {
    $('glossary-list').innerHTML = GLOSSARY.map((g) =>
      `<dt>${g.term}</dt><dd>${g.def}${g.sources.length ? ` <span class="range-key">(${srcText(g.sources)})</span>` : ''}</dd>`).join('');
  }

  const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--series-6)'];

  function renderDonut() {
    const shares = rowShares(state.metric);
    const total = shares.reduce((s, r) => s + r.value, 0);
    const donut = $('donut');
    const legend = $('donut-legend');
    legend.innerHTML = '';
    if (!total) {
      donut.style.background = 'var(--bg-sunken)';
      return;
    }
    let acc = 0;
    const stops = shares.map((s, i) => {
      const start = (acc / total) * 360;
      acc += s.value;
      const end = (acc / total) * 360;
      return `${SERIES[i % SERIES.length]} ${start}deg ${end}deg`;
    });
    donut.style.background = `conic-gradient(${stops.join(', ')})`;
    shares.forEach((s, i) => {
      const li = document.createElement('li');
      const pct = Math.round((s.value / total) * 100);
      li.innerHTML = `<span class="swatch" style="background:${SERIES[i % SERIES.length]}"></span>${s.label} — ${pct}%`;
      legend.appendChild(li);
    });
  }

  function renderHBars(hostId, rows) {
    const host = $(hostId);
    host.innerHTML = '';
    const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-9);
    rows.forEach((r) => {
      const wrap = document.createElement('div');
      wrap.className = 'hbar-row';
      const pct = Math.max(2, (Math.abs(r.value) / max) * 100);
      const fillClass = ['hbar-fill', r.isYou ? 'is-you' : '', r.dir === 'save' ? 'dir-save' : ''].join(' ').trim();
      const labelClass = ['hbar-label', r.isYou ? 'is-you' : ''].join(' ').trim();
      wrap.innerHTML = `
        <span class="${labelClass}">${r.label}</span>
        <span class="hbar-track"><span class="${fillClass}" style="width:${pct}%"></span></span>
        <span class="hbar-value">${fmtMetric(r.value)}</span>`;
      host.appendChild(wrap);
    });
  }

  // Up to `max` bars: every "you" bar above zero, then the largest items.
  function withYouBars(yous, items, max) {
    const shown = yous.filter((r) => r.value > 0);
    const rest = items.filter((r) => r.value > 0).sort((a, b) => b.value - a.value).slice(0, max - shown.length);
    return shown.concat(rest).sort((a, b) => b.value - a.value);
  }
  function renderDailyBars() {
    const yous = [
      { label: 'Your AI use', value: aiDaily(state.metric), isYou: true },
      { label: 'Your other digital use', value: otherDaily(state.metric), isYou: true },
    ];
    const items = DAILY_ITEMS.map((it) => ({ label: it.label, value: itemDaily(it, state.metric) }));
    renderHBars('daily-bars', withYouBars(yous, items, 8));
  }

  function renderYearBars() {
    const yous = [
      { label: 'Your year of AI use', value: aiDaily(state.metric) * DAYS, isYou: true },
      { label: 'Your year of other digital use', value: otherDaily(state.metric) * DAYS, isYou: true },
    ];
    const adds = ANNUAL_ITEMS.filter((it) => it.dir === 'add')
      .map((it) => ({ label: it.label, value: itemAnnual(it, state.metric) }));
    renderHBars('add-bars', withYouBars(yous, adds, 8));

    const cuts = ANNUAL_ITEMS.filter((it) => it.dir === 'save' && itemAnnual(it, state.metric) > 0)
      .map((it) => ({ label: it.label, value: itemAnnual(it, state.metric), dir: 'save' }))
      .sort((a, b) => b.value - a.value);
    renderHBars('cut-bars', cuts.slice(0, 8));

    $('add-title').textContent = state.metric === 'carbon'
      ? 'In a year, things that add this much carbon' : 'In a year, things that add this much water';
    $('cut-title').textContent = state.metric === 'carbon'
      ? 'In a year, cuts that would save this much carbon' : 'In a year, cuts that would save this much water';
  }

  function optHtml(list, selected) {
    return list.map((x) => `<option value="${x.id}"${x.id === selected ? ' selected' : ''}>${x.label}</option>`).join('');
  }
  function renderContextLine() {
    $('loc').innerHTML = optHtml(LOCATIONS, state.loc);
    $('home').innerHTML = optHtml(HOMES, state.home);
    $('drive').innerHTML = optHtml(DRIVING, state.drive);
    $('diet').innerHTML = optHtml(DIETS, state.diet);
    $('fly').innerHTML = optHtml(FLYING, state.fly);
  }

  // Everything computed from the rows (not the row inputs themselves).
  function renderResults() {
    renderVerdict();
    renderDonut();
    renderDailyBars();
    renderYearBars();
  }

  function render() {
    renderPersonas();
    renderMetricToggle();
    renderNotice();
    renderRows();
    renderMediaRows();
    renderStreaming();
    renderCalls();
    renderResults();
    renderContextLine();
  }

  // ==========================================================================
  // Wiring
  // ==========================================================================
  document.querySelectorAll('.metric-btn').forEach((b) => {
    b.addEventListener('click', () => { state.metric = b.dataset.metric; render(); saveToUrl(); });
  });
  $('addrow').addEventListener('click', () => {
    state.rows.push(newRow(MODELS[0].id, 'chat', 3));
    state.persona = null;
    render(); saveToUrl();
  });
  $('call-hours').addEventListener('input', (e) => { state.calls.hours = Math.max(0, Number(e.target.value) || 0); onValues(); });
  ['device', 'camera'].forEach((k) => {
    $(`call-${k}`).addEventListener('change', (e) => { state.calls[k] = e.target.value; state.persona = null; render(); saveToUrl(); });
  });
  document.querySelectorAll('.glossary-open').forEach((b) => b.addEventListener('click', () => {
    $('glossary').open = true;
    $('glossary').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  $('addmedia').addEventListener('click', () => {
    state.media.push(newMediaRow('image'));
    state.persona = null;
    render(); saveToUrl();
  });
  $('reset').addEventListener('click', () => { applyPersona('casual'); saveToUrl(); });
  $('notice-close').addEventListener('click', () => { notice = ''; renderNotice(); });
  $('share').addEventListener('click', async () => {
    saveToUrl();
    try {
      await navigator.clipboard.writeText(location.href);
      const btn = $('share'); const old = btn.textContent;
      btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = old; }, 1500);
    } catch (e) { /* clipboard unavailable */ }
  });
  ['loc', 'home', 'drive', 'diet', 'fly'].forEach((k) => {
    $(k).addEventListener('change', (e) => { state[k] = e.target.value; render(); saveToUrl(); });
  });

  loadFromUrl();
  renderGlossary();
  render();

  // ==========================================================================
  // Voice orb — Web Speech API in, /api/ask (Claude) out, spoken back via TTS
  // ==========================================================================
  (function orb() {
    const orbBtn = $('orb');
    const panel = $('orb-panel');
    const log = $('orb-log');
    const status = $('orb-status');
    const closeBtn = $('orb-close');
    const typeForm = $('orb-form');
    const typeInput = $('orb-typein');

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognizer = null;
    if (SR) {
      recognizer = new SR();
      recognizer.lang = 'en-US';
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
    } else {
      typeForm.hidden = false;
      $('orb-hint').textContent = 'Type a question (voice not supported here)';
    }

    function openPanel() { panel.hidden = false; }
    function addMsg(role, text) {
      const div = document.createElement('div');
      div.className = 'orb-msg ' + role;
      div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
      return div;
    }
    function currentContext() {
      const daily = aiDaily(state.metric);
      return {
        metric: state.metric,
        dailyValue: fmtMetric(daily),
        annualValue: fmtMetric(daily * DAYS),
        persona: state.persona || 'custom',
        region: getLoc().label,
      };
    }
    async function ask(question) {
      openPanel();
      addMsg('user', question);
      status.textContent = 'Thinking…';
      orbBtn.classList.remove('is-listening');
      orbBtn.classList.add('is-thinking');
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, context: currentContext() }),
        });
        const data = await res.json();
        const answer = data.answer || "Sorry, I couldn't get an answer just now.";
        addMsg('assistant', answer);
        speak(answer);
      } catch (e) {
        addMsg('assistant', "I couldn't reach the assistant just now — check your connection and try again.");
      } finally {
        orbBtn.classList.remove('is-thinking');
        status.textContent = 'Ask another question';
      }
    }
    function speak(text) {
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }

    orbBtn.addEventListener('click', () => {
      openPanel();
      if (recognizer) {
        status.textContent = 'Listening…';
        orbBtn.classList.add('is-listening');
        try { recognizer.start(); } catch (e) { /* already started */ }
      } else {
        typeInput.focus();
      }
    });
    if (recognizer) {
      recognizer.addEventListener('result', (e) => {
        const text = e.results[0][0].transcript;
        orbBtn.classList.remove('is-listening');
        ask(text);
      });
      recognizer.addEventListener('error', () => {
        orbBtn.classList.remove('is-listening');
        status.textContent = "Didn't catch that — try again or type below.";
        typeForm.hidden = false;
      });
      recognizer.addEventListener('end', () => orbBtn.classList.remove('is-listening'));
    }
    closeBtn.addEventListener('click', () => { panel.hidden = true; window.speechSynthesis && window.speechSynthesis.cancel(); });
    typeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = typeInput.value.trim();
      if (!q) return;
      typeInput.value = '';
      ask(q);
    });
  })();
})();
