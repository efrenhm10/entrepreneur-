// UI core: screen routing, event delegation, shared components.
var G = globalThis.G || (globalThis.G = {});

G.ui = (function () {
  const U = G.util;
  const esc = U.esc;
  const ui = {
    s: null, screen: 'title', tab: 'overview', modal: null, charts: {}, acts: {}, view: {},
  };

  // ---------- Components ----------
  ui.shield = function (ab, size = 40) {
    const w = size, h = size * 1.05;
    return `<svg class="shield" viewBox="0 0 40 42" width="${w}" height="${h}" aria-hidden="true">
      <path d="M3 5 Q12 1.5 20 5 Q28 1.5 37 5 L37 20 Q37 34 20 40.5 Q3 34 3 20 Z" fill="var(--shield)" stroke="#fff" stroke-width="1.6"/>
      <path d="M3 5 Q12 1.5 20 5 Q28 1.5 37 5 L37 12 L3 12 Z" fill="var(--shield-red)"/>
      <text x="20" y="${ab.length > 2 ? 29 : 30}" text-anchor="middle" font-size="${ab.length > 2 ? 10 : 13.5}" fill="#fff">${esc(ab)}</text>
    </svg>`;
  };

  ui.meter = function (label, v, invert) {
    const val = U.clamp(v, 0, 100);
    const bad = invert ? val > 75 : val < 30;
    const warn = invert ? val > 55 : val < 50;
    return `<div class="meter-row"><span class="muted">${esc(label)}</span><div class="meter ${bad ? 'bad' : warn ? 'warn' : ''}"><i style="width:${val}%"></i></div><span class="num small">${Math.round(val)}</span></div>`;
  };

  ui.kpi = (label, value, sub, cls = '') => `<div class="kpi"><span class="label">${esc(label)}</span><span class="v ${cls}">${value}</span>${sub ? `<span class="d">${sub}</span>` : ''}</div>`;
  ui.money = (n, o) => U.money(n, o);
  ui.signed = (n, o) => `<span class="num ${n < 0 ? 'neg' : n > 0 ? 'pos' : ''}">${n > 0 ? '+' : ''}${U.money(n, o)}</span>`;
  ui.pill = (text, kind = '') => `<span class="pill ${kind}">${esc(text)}</span>`;
  ui.stars = (r) => { const n = Math.round(r); return `<span class="stars" aria-label="${r.toFixed(1)} stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`; };
  ui.btn = (label, act, args = '', cls = '', disabled = false, title = '') => `<button class="btn ${cls}" data-act="${act}" data-a="${esc(args)}" ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>${label}</button>`;

  // Line chart. series: [{ name, values, color }]. Values align to xs (week numbers).
  ui.chart = function (id, series, xs, opts = {}) {
    const h = opts.h || 150;
    const all = series.flatMap((x) => x.values).filter((v) => v != null);
    if (all.length < 2) return `<div class="empty small">Not enough history yet. Check back in a few weeks.</div>`;
    let min = Math.min(0, ...all), max = Math.max(...all);
    if (max === min) max = min + 1;
    const pad = (max - min) * 0.08;
    max += pad; if (min < 0) min -= pad;
    const n = xs.length;
    const X = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100);
    const Y = (v) => 100 - ((v - min) / (max - min)) * 100;
    const fmt = opts.fmt || ((v) => U.money(v, { short: true }));
    ui.charts[id] = { series, xs, fmt, min, max };
    const ticks = [max - pad, (max + min) / 2, min < 0 ? min + pad : min];
    const lines = series.map((sr) => {
      let d = '';
      sr.values.forEach((v, i) => { if (v == null) return; d += (d ? 'L' : 'M') + X(i).toFixed(2) + ' ' + Y(v).toFixed(2); });
      const base = Y(U.clamp(0, min, max));
      const area = sr.area && d ? `<path d="${d} L100 ${base} L0 ${base} Z" fill="${sr.color}" opacity=".10" />` : '';
      return `${area}<path d="${d}" fill="none" stroke="${sr.color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>`;
    }).join('');
    const zero = min < 0 ? `<line x1="0" x2="100" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--faint)" stroke-width="1" vector-effect="non-scaling-stroke" />` : '';
    const grid = [0, 50, 100].map((y) => `<line class="grid-l" x1="0" x2="100" y1="${y}" y2="${y}" vector-effect="non-scaling-stroke" />`).join('');
    const legend = series.length > 1 ? `<div class="legend" style="margin-bottom:6px">${series.map((sr) => `<span><i style="background:${sr.color}"></i>${esc(sr.name)}</span>`).join('')}</div>` : '';
    const last = series.map((sr) => { const v = sr.values[sr.values.length - 1]; return v == null ? '' : `<span class="num tiny" style="position:absolute;right:0;top:calc(${Y(v)}% - 18px);color:var(--muted)">${fmt(v)}</span>`; }).join('');
    return `${legend}<div class="chart" data-chart="${id}" style="height:${h}px">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="height:${h}px" role="img" aria-label="${esc(opts.label || series.map((x) => x.name).join(', '))} over time">${grid}${zero}${lines}<line class="hover-l" x1="0" x2="0" y1="0" y2="100" vector-effect="non-scaling-stroke" visibility="hidden"/></svg>
      <span class="axis-t num tiny" style="position:absolute;left:0;top:-2px;color:var(--faint)">${fmt(ticks[0])}</span>
      <span class="axis-t num tiny" style="position:absolute;left:0;bottom:-2px;color:var(--faint)">${fmt(ticks[2])}</span>
      ${last}
      <div class="tip" hidden></div>
    </div>
    <div class="row between tiny faint num" style="margin-top:4px"><span>${esc(opts.xfmt ? opts.xfmt(xs[0]) : U.fmtDate(xs[0]))}</span><span>${esc(opts.xfmt ? opts.xfmt(xs[n - 1]) : U.fmtDate(xs[n - 1]))}</span></div>`;
  };

  function chartHover(e) {
    const el = e.target.closest && e.target.closest('.chart');
    document.querySelectorAll('.chart .tip:not([hidden])').forEach((t) => { if (!el || !el.contains(t)) t.hidden = true; });
    if (!el) return;
    const c = ui.charts[el.dataset.chart];
    if (!c) return;
    const r = el.getBoundingClientRect();
    const x = U.clamp((e.clientX - r.left) / r.width, 0, 1);
    const i = Math.round(x * (c.xs.length - 1));
    const tip = el.querySelector('.tip');
    const line = el.querySelector('.hover-l');
    tip.hidden = false;
    tip.style.left = `${(i / Math.max(1, c.xs.length - 1)) * 100}%`;
    tip.innerHTML = `${esc(U.fmtDate(c.xs[i]))}<br>` + c.series.map((sr) => `<span style="color:${sr.color}">●</span> ${esc(sr.name)}: ${esc(c.fmt(sr.values[i] || 0))}`).join('<br>');
    const px = (i / Math.max(1, c.xs.length - 1)) * 100;
    line.setAttribute('x1', px); line.setAttribute('x2', px); line.setAttribute('visibility', 'visible');
  }

  // ---------- Toasts & modals ----------
  ui.toast = function (msg) {
    if (typeof document === 'undefined') return;
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  };

  ui.openModal = function (m) { ui.modal = m; ui.render(); };
  ui.closeModal = function () { ui.modal = null; ui.render(); };

  // ---------- Rendering ----------
  ui.render = function () {
    const root = document.getElementById('app');
    if (!root) return;
    const scrollY = window.scrollY;
    const focused = document.activeElement && document.activeElement.id;
    ui.charts = {};
    let html = '';
    if (ui.screen === 'title') html = G.uiTitle.render();
    else if (ui.screen === 'create') html = G.uiCreate.render();
    else if (ui.screen === 'game') html = G.uiGame.render();
    root.innerHTML = html;
    let ov = document.getElementById('overlay-root');
    const modalHtml = ui.screen === 'game' ? G.uiGame.modal() : (ui.modal ? ui.modal.html() : '');
    if (!ov) { ov = document.createElement('div'); ov.id = 'overlay-root'; document.body.appendChild(ov); }
    ov.innerHTML = modalHtml || '';
    if (focused) { const f = document.getElementById(focused); if (f) f.focus({ preventScroll: true }); }
    window.scrollTo(0, scrollY);
  };

  ui.go = function (screen, tab) {
    ui.screen = screen;
    if (tab) ui.tab = tab;
    ui.render();
    window.scrollTo(0, 0);
  };

  // ---------- Event delegation ----------
  ui.on = function (name, fn) { ui.acts[name] = fn; };

  function dispatch(e, kind) {
    const el = e.target.closest(kind === 'click' ? '[data-act]' : kind === 'input' ? '[data-in]' : '[data-ch]');
    if (!el) return;
    const name = el.dataset[kind === 'click' ? 'act' : kind === 'input' ? 'in' : 'ch'];
    const fn = ui.acts[name];
    if (!fn) return;
    if (kind === 'click') e.preventDefault();
    const res = fn(el, el.dataset.a, e);
    if (res !== false && kind !== 'input') ui.render();
  }

  ui.boot = function () {
    document.addEventListener('click', (e) => dispatch(e, 'click'));
    document.addEventListener('input', (e) => dispatch(e, 'input'));
    document.addEventListener('change', (e) => dispatch(e, 'change'));
    document.addEventListener('mousemove', chartHover);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && ui.modal && ui.modal.dismiss !== false) { ui.closeModal(); }
      if ((e.key === 'n' || e.key === 'N') && ui.screen === 'game' && !ui.modal && !ui.s.event && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        ui.acts.nextWeek && (ui.acts.nextWeek(), ui.render());
      }
    });
    const hot = globalThis.claude && globalThis.claude.hot;
    if (hot && hot.snapshot) hot.snapshot(() => ({ s: ui.s, screen: ui.screen, tab: ui.tab }));
    const start = (data) => {
      if (data && data.s) { ui.s = G.state.migrate(data.s); ui.screen = data.screen || 'game'; ui.tab = data.tab || 'overview'; }
      ui.render();
    };
    if (hot && hot.ready) hot.ready(start); else start(hot && hot.data);
  };

  ui.save = function () {
    if (ui.s) G.state.save(ui.s, 'auto');
  };

  return ui;
})();
