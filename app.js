(function () {
  'use strict';

  // Data tables live in data.js; pure calculations live in calc.js.
  const {
    MODELS, SIZES, LOCATIONS, HOMES, DRIVING, DIETS, FLYING,
    DAILY_ITEMS, ANNUAL_ITEMS, DAYS,
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
      rows: [['claude-sonnet-4-6', 'agent', 3], ['claude-sonnet-4-6', 'chat', 15]] },
    { id: 'power',    label: 'AI power user', icon: '⚡',
      rows: [['gpt-5.5-pro', 'report', 2], ['claude-opus-4-8', 'agent', 2], ['gpt-5.5', 'chat', 30]] },
    { id: 'team',     label: 'Small company / team', icon: '🏢',
      rows: [['gpt-5.5', 'chat', 10], ['gpt-5.5', 'email', 5], ['gpt-5.5', 'summary', 2]] },
  ];

  // ==========================================================================
  // State
  // ==========================================================================
  let uidSeq = 1;
  const state = { rows: [], metric: 'carbon', persona: 'casual', loc: 'us', home: 'med', drive: 'davg', diet: 'avg', fly: 'some' };

  function loadFromUrl() {
    try {
      const p = new URLSearchParams(location.hash.slice(1));
      const r = p.get('r');
      if (r) {
        state.rows = r.split(',').filter(Boolean).map((chunk) => {
          const [model, size, count] = chunk.split(':');
          return { id: uidSeq++, model, size, count: Number(count) || 0 };
        });
        state.persona = null;
      }
      ['metric', 'loc', 'home', 'drive', 'diet', 'fly'].forEach((k) => {
        if (p.get(k)) state[k] = p.get(k);
      });
    } catch (e) { /* ignore malformed url state */ }
    if (!state.rows.length) applyPersona(state.persona || 'casual', { silent: true });
  }
  function saveToUrl() {
    const p = new URLSearchParams();
    p.set('r', state.rows.map((r) => `${r.model}:${r.size}:${r.count}`).join(','));
    p.set('metric', state.metric);
    p.set('loc', state.loc); p.set('home', state.home); p.set('drive', state.drive);
    p.set('diet', state.diet); p.set('fly', state.fly);
    history.replaceState(null, '', '#' + p.toString());
  }

  function applyPersona(id, opts) {
    const persona = PERSONAS.find((x) => x.id === id);
    if (!persona) return;
    state.persona = id;
    state.rows = persona.rows.map(([model, size, count]) => ({ id: uidSeq++, model, size, count }));
    if (!(opts && opts.silent)) render();
  }

  // ==========================================================================
  // Math — thin wrappers that pass the current page state into calc.js
  // ==========================================================================
  const getLoc = () => Calc.getLocation(state.loc);
  const aiDaily = (metric) => Calc.aiDaily(state.rows, metric, getLoc().grid);
  const aiRange = (metric) => Calc.aiRange(state.rows, metric, getLoc().grid);
  const rowRange = (row, metric) => Calc.textRowRange(row, metric, getLoc().grid);
  const rowShares = (metric) => Calc.rowShares(state.rows, metric, getLoc().grid);
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
  // Display unit for a value (g carbon or L water), chosen by its size.
  function unitFor(v, metric) {
    if (metric === 'carbon') {
      if (v >= 1e6) return { unit: 't CO₂e', conv: (x) => x / 1e6 };
      if (v >= 1000) return { unit: 'kg CO₂e', conv: (x) => x / 1000 };
      return { unit: 'g CO₂e', conv: (x) => x };
    }
    if (v >= 1) return { unit: 'L', conv: (x) => x };
    return { unit: 'mL', conv: (x) => x * 1000 };
  }
  function fmtMetric(v) {
    const u = unitFor(v, state.metric);
    return sig(u.conv(v)) + ' ' + u.unit;
  }
  // "low · central · high unit" — all three in the unit that fits the high end,
  // so the numbers can be compared at a glance.
  function fmtRange(r) {
    const u = unitFor(r.high, state.metric);
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
  const sizeOptionsHtml = SIZES.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');

  function renderRows() {
    const host = $('rows');
    host.innerHTML = '';
    const tpl = $('row-tpl');
    state.rows.forEach((row) => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const modelSel = node.querySelector('.row-model');
      const sizeSel = node.querySelector('.row-size');
      const countInput = node.querySelector('.row-count');
      modelSel.innerHTML = modelOptionsHtml;
      sizeSel.innerHTML = sizeOptionsHtml;
      modelSel.value = row.model;
      sizeSel.value = row.size;
      countInput.value = row.count;
      // Per-day range for this row in the selected metric; the first row also
      // says which number is which.
      node.querySelector('.row-range').innerHTML = fmtRange(rowRange(row, state.metric)) +
        (row === state.rows[0] ? ' <span class="range-key">low · central · high, per day</span>' : '');

      modelSel.addEventListener('change', () => { row.model = modelSel.value; state.persona = null; render(); saveToUrl(); });
      sizeSel.addEventListener('change', () => { row.size = sizeSel.value; state.persona = null; render(); saveToUrl(); });
      countInput.addEventListener('input', () => { row.count = Math.max(0, Number(countInput.value) || 0); state.persona = null; render(); saveToUrl(); });
      node.querySelector('.row-remove').addEventListener('click', () => {
        state.rows = state.rows.filter((r) => r.id !== row.id);
        state.persona = null;
        render(); saveToUrl();
      });
      host.appendChild(node);
    });
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
    renderAiRange();
  }

  // "Your AI use" total as low · central · high, per day and per year.
  function renderAiRange() {
    const day = aiRange(state.metric);
    const year = { low: day.low * DAYS, central: day.central * DAYS, high: day.high * DAYS };
    $('ai-range').innerHTML = day.high > 0
      ? `<span class="range-title">Range <span class="range-key">low · central · high</span></span>
         <span class="range-line"><span class="range-period">per day</span> ${fmtRange(day)}</span>
         <span class="range-line"><span class="range-period">per year</span> ${fmtRange(year)}</span>`
      : '';
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

  function renderDailyBars() {
    const daily = aiDaily(state.metric);
    const rows = [{ label: 'Your AI use', value: daily, isYou: true }]
      .concat(DAILY_ITEMS.map((it) => ({ label: it.label, value: itemDaily(it, state.metric) })).filter((r) => r.value > 0))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
    renderHBars('daily-bars', rows);
  }

  function renderYearBars() {
    const annual = aiDaily(state.metric) * DAYS;
    const adds = ANNUAL_ITEMS.filter((it) => it.dir === 'add' && itemAnnual(it, state.metric) > 0)
      .map((it) => ({ label: it.label, value: itemAnnual(it, state.metric) }));
    adds.push({ label: 'Your year of AI use', value: annual, isYou: true });
    adds.sort((a, b) => b.value - a.value);
    renderHBars('add-bars', adds.slice(0, 8));

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

  function render() {
    renderPersonas();
    renderMetricToggle();
    renderRows();
    renderVerdict();
    renderDonut();
    renderDailyBars();
    renderYearBars();
    renderContextLine();
  }

  // ==========================================================================
  // Wiring
  // ==========================================================================
  document.querySelectorAll('.metric-btn').forEach((b) => {
    b.addEventListener('click', () => { state.metric = b.dataset.metric; render(); saveToUrl(); });
  });
  $('addrow').addEventListener('click', () => {
    state.rows.push({ id: uidSeq++, model: MODELS[0].id, size: 'chat', count: 3 });
    state.persona = null;
    render(); saveToUrl();
  });
  $('reset').addEventListener('click', () => { applyPersona('casual'); saveToUrl(); });
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
