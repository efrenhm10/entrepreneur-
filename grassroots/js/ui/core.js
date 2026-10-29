// UI core: screens, event delegation, and shared components (portraits, maps,
// charts, bars, tables).
var GR = globalThis.GR || (globalThis.GR = {});

GR.ui = (function () {
  const U = GR.util;
  const esc = U.esc;
  const ui = { s: null, screen: 'title', tab: 'office', sub: {}, sel: {}, modal: null, acts: {}, form: {} };

  // ---------- Small components ----------
  ui.btn = (label, act, arg = '', cls = 'bb', dis = false, title = '') => `<button class="${cls}" data-act="${act}" data-a="${esc(arg)}"${dis ? ' disabled' : ''}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
  ui.chip = (p) => `<span class="chip ${p}">${p === 'D' ? 'Dem' : p === 'R' ? 'Rep' : p}</span>`;
  ui.bar = (pct, cls = '') => `<div class="bar ${cls}"><i style="width:calc(${U.clamp(pct, 0, 100)}% - 2px)"></i></div>`;
  ui.mrow = (label, pct, cls = '', val) => `<div class="mrow"><span>${label}</span>${ui.bar(pct, cls)}<span class="v">${val != null ? val : Math.round(pct) + '%'}</span></div>`;
  ui.tabs = (key, list, cls = 'tabs-s') => {
    const cur = ui.sub[key] || list[0][0];
    return `<div class="${cls}" role="tablist">${list.map(([k, label, dot]) => `<button class="tab ${k === cur ? 'on' : ''}" role="tab" aria-selected="${k === cur}" data-act="sub" data-a="${key}|${k}">${label}${dot ? `<span class="dot">${dot}</span>` : ''}</button>`).join('')}</div>`;
  };
  ui.cur = (key, list) => { const v = ui.sub[key]; return list.some((x) => x[0] === v) ? v : list[0][0]; };
  ui.kv = (rows, cls = 'kv') => `<table class="tbl ${cls}"><tbody>${rows.filter(Boolean).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</tbody></table>`;
  ui.table = (head, rows, opts = {}) => `<div class="scroll-x"><table class="tbl ${opts.cls || ''}">${opts.caption ? `<caption>${opts.caption}</caption>` : ''}<thead><tr>${head.map((h) => `<th class="${h.c || ''}">${h.t != null ? h.t : h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${head.length}" class="c muted">${opts.empty || 'Nothing here yet.'}</td></tr>`}</tbody></table></div>`;
  ui.money = (n) => U.money(n);
  // Situation-room components.
  ui.panel = (title, body, cls = '') => `<section class="card ${cls}">${title ? `<h3>${title}</h3>` : ''}${body}</section>`;
  // Red → amber → green by how good a 0-1 value is.
  ui.hue = (g) => `hsl(${Math.round(U.clamp(g, 0, 1) * 125)}, 62%, 48%)`;
  ui.meter = (label, norm, good, disp, title = '') => { const n = U.clamp(norm, 0, 1); return `<div class="meter"${title ? ` title="${esc(title)}"` : ''}><div class="meter-top"><span>${label}</span><b>${disp}</b></div><div class="meter-bar"><i style="width:${Math.max(3, n * 100)}%;background:${ui.hue(good ? n : 1 - n)}"></i></div></div>`; };
  ui.spark = (vals, color = 'var(--blue)') => {
    const v = vals.filter((x) => x != null && isFinite(x));
    if (v.length < 2) return '<svg viewBox="0 0 100 26"></svg>';
    let mn = Math.min(...v), mx = Math.max(...v);
    if (mx - mn < 1e-9) { mx += 1; mn -= 1; }
    const pts = v.map((x, i) => `${(i / (v.length - 1) * 98 + 1).toFixed(1)},${(24 - (x - mn) / (mx - mn) * 22).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>`;
  };
  ui.stat = (label, v, cls = '') => `<div class="${cls}"><small>${label}</small><b>${v}</b></div>`;
  ui.pname = (s, id) => { const p = s.pols[id]; return p ? `${esc(GR.world.fullName(p))}` : 'Vacant'; };
  ui.plink = (s, id) => { const p = s.pols[id]; if (!p) return '<span class="muted">Vacant</span>'; return `<a href="#" data-act="viewpol" data-a="${p.id}">${esc(GR.world.fullName(p))}</a> ${ui.chip(p.party)}`; };

  // ---------- Portraits ----------
  const SKIN = ['#fadcc6', '#f1c3a0', '#dca277', '#bd7f52', '#8f5634', '#5f3822'];
  const HAIR = ['#1f1b19', '#3d2718', '#6a4224', '#a77339', '#dbb763', '#a8492a'];
  ui.face = function (seed, o = {}) {
    const r = U.seeded('face' + seed);
    const g = o.g || 'm';
    const skin = SKIN[o.skin != null ? o.skin : r.int(0, 5)];
    let hair = HAIR[o.hair != null ? o.hair : r.int(0, 5)];
    const age = o.age || 45;
    if (age > 58 && r() < 0.6) hair = age > 70 ? '#e7e5e0' : '#9e9b96';
    else if (age > 48 && r() < 0.3) hair = '#8a8580';
    const bg = o.party === 'R' ? '#c2241c' : o.party === 'D' ? '#1b78c4' : '#8c8c8c';
    const style = o.style != null ? o.style : r.int(0, 3);
    const glasses = o.glasses != null ? o.glasses : r() < (age > 50 ? 0.35 : 0.15);
    const suit = ['#5d6168', '#2c3442', '#1f2124', '#5a4b3d'][r.int(0, 3)];
    const tie = o.party === 'R' ? '#d01818' : o.party === 'D' ? '#1840b8' : '#6b3fa0';
    const fw = 50 + r.int(-3, 4);
    const eyeC = ['#3b2a1e', '#4a6a8c', '#5a7a3a', '#2a1f18'][r.int(0, 3)];
    const brow = hair === '#e7e5e0' ? '#b9b5ae' : hair;
    let back = '', front = '';
    if (g === 'f') {
      if (style === 0) { back = `<path d="M${100 - fw - 8} 96 Q${100 - fw - 12} 175 ${100 - fw + 4} 182 L${100 + fw - 4} 182 Q${100 + fw + 12} 175 ${100 + fw + 8} 96 Z" fill="${hair}"/>`; front = `<path d="M${100 - fw - 4} 108 Q${100 - fw - 8} 46 100 40 Q${100 + fw + 8} 46 ${100 + fw + 4} 108 Q${100 + fw - 6} 70 112 62 Q90 78 ${100 - fw + 4} 98 Z" fill="${hair}"/>`; }
      else if (style === 1) { back = `<path d="M${100 - fw - 8} 96 Q${100 - fw - 10} 140 ${100 - fw - 2} 150 L${100 + fw + 2} 150 Q${100 + fw + 10} 140 ${100 + fw + 8} 96 Z" fill="${hair}"/>`; front = `<path d="M${100 - fw - 4} 112 Q${100 - fw - 6} 44 100 40 Q${100 + fw + 6} 44 ${100 + fw + 4} 112 Q${100 + fw} 72 100 64 Q${100 - fw} 72 ${100 - fw - 4} 112 Z" fill="${hair}"/>`; }
      else if (style === 2) { back = `<circle cx="100" cy="40" r="20" fill="${hair}"/>`; front = `<path d="M${100 - fw} 100 Q${100 - fw - 2} 46 100 44 Q${100 + fw + 2} 46 ${100 + fw} 100 Q${100 + fw - 4} 68 100 64 Q${100 - fw + 4} 68 ${100 - fw} 100 Z" fill="${hair}"/>`; }
      else { front = `<path d="M${100 - fw - 2} 98 Q${100 - fw - 4} 44 100 42 Q${100 + fw + 4} 44 ${100 + fw + 2} 98 Q${100 + fw - 2} 64 ${108} 60 Q86 74 ${100 - fw + 2} 84 Z" fill="${hair}"/>`; }
    } else {
      if (style === 0) front = `<path d="M${100 - fw - 1} 98 Q${100 - fw - 4} 44 100 42 Q${100 + fw + 4} 44 ${100 + fw + 1} 98 Q${100 + fw - 2} 66 100 62 Q${100 - fw + 2} 66 ${100 - fw - 1} 98 Z" fill="${hair}"/>`;
      else if (style === 1) front = `<path d="M${100 - fw - 1} 100 Q${100 - fw - 6} 40 104 40 Q${100 + fw + 6} 44 ${100 + fw + 1} 98 Q${100 + fw - 4} 62 92 64 L84 58 Q${100 - fw + 6} 70 ${100 - fw - 1} 100 Z" fill="${hair}"/>`;
      else if (style === 2 && age > 40) front = `<path d="M${100 - fw - 1} 100 Q${100 - fw - 2} 80 ${100 - fw + 8} 74 L${100 - fw + 6} 96 Z M${100 + fw + 1} 100 Q${100 + fw + 2} 80 ${100 + fw - 8} 74 L${100 + fw - 6} 96 Z" fill="${hair}"/>`;
      else front = `<path d="M${100 - fw} 96 Q${100 - fw - 2} 48 100 46 Q${100 + fw + 2} 48 ${100 + fw} 96 Q${100 + fw - 2} 66 100 60 Q${100 - fw + 2} 66 ${100 - fw} 96 Z" fill="${hair}"/>`;
    }
    const body = g === 'f'
      ? `<path d="M30 220 Q34 176 76 168 L124 168 Q166 176 170 220 Z" fill="${suit}"/><path d="M84 168 L100 196 L116 168 Z" fill="${o.party === 'R' ? '#f3d6d6' : o.party === 'D' ? '#d8e6f6' : '#eee'}"/>`
      : `<path d="M28 220 Q32 174 78 166 L122 166 Q168 174 172 220 Z" fill="${suit}"/><path d="M84 166 L100 200 L116 166 Z" fill="#fff"/><path d="M96 172 L104 172 L107 204 L100 214 L93 204 Z" fill="${tie}"/><path d="M84 166 L94 176 L100 168 L106 176 L116 166" fill="none" stroke="#333" stroke-width="1.2"/>`;
    const gl = glasses ? `<g fill="none" stroke="#151515" stroke-width="3.2"><rect x="${68}" y="104" width="26" height="18" rx="5"/><rect x="${106}" y="104" width="26" height="18" rx="5"/><path d="M94 111 L106 111"/></g>` : '';
    const lips = g === 'f' ? `<path d="M88 146 Q100 152 112 146 Q100 156 88 146 Z" fill="#b34b4b"/>` : `<path d="M88 146 Q100 151 112 146" fill="none" stroke="#5a3424" stroke-width="2.4" stroke-linecap="round"/>`;
    return `<svg class="face" viewBox="0 0 200 220" role="img" aria-label="Portrait"><rect width="200" height="220" fill="${bg}"/>${back}
      ${body}<rect x="88" y="146" width="24" height="24" fill="${skin}"/>
      <ellipse cx="${100 - fw}" cy="112" rx="7" ry="11" fill="${skin}" stroke="#4a3328" stroke-width="1"/><ellipse cx="${100 + fw}" cy="112" rx="7" ry="11" fill="${skin}" stroke="#4a3328" stroke-width="1"/>
      <ellipse cx="100" cy="106" rx="${fw}" ry="60" fill="${skin}" stroke="#4a3328" stroke-width="1.2"/>
      ${front}
      <path d="M70 100 Q80 93 92 98" fill="none" stroke="${brow}" stroke-width="${g === 'f' ? 2.6 : 4}" stroke-linecap="round"/><path d="M108 98 Q120 93 130 100" fill="none" stroke="${brow}" stroke-width="${g === 'f' ? 2.6 : 4}" stroke-linecap="round"/>
      <ellipse cx="81" cy="112" rx="8" ry="4.6" fill="#fff" stroke="#333" stroke-width="1"/><ellipse cx="119" cy="112" rx="8" ry="4.6" fill="#fff" stroke="#333" stroke-width="1"/>
      <circle cx="82" cy="112" r="3.6" fill="${eyeC}"/><circle cx="120" cy="112" r="3.6" fill="${eyeC}"/><circle cx="82" cy="112" r="1.6" fill="#111"/><circle cx="120" cy="112" r="1.6" fill="#111"/>
      <path d="M100 116 Q96 132 92 134 Q100 138 108 134" fill="none" stroke="#7a5038" stroke-width="1.6" stroke-linecap="round"/>
      ${lips}${gl}</svg>`;
  };
  ui.facePol = (s, p) => {
    if (!p) return ui.face('vacant', {});
    const L = p.look || {};
    return ui.face(p.isPlayer ? 'me' + (L.seed || p.fn) : p.id, { g: p.g, party: p.party, age: U.yearOf(s.week) - p.by, skin: L.skin, hair: L.hair, style: L.style, glasses: L.glasses });
  };
  ui.mini = (s, p) => `<span class="mini">${ui.facePol(s, p).replace('class="face"', '')}<span>${ui.plink(s, p && p.id)}</span></span>`;

  // ---------- Maps ----------
  // Color for a Republican vote share (0-1): deeper the bigger the margin.
  ui.marginColor = function (rShare) {
    const m = U.clamp((rShare - 0.5) * 2, -1, 1);
    const t = Math.min(1, Math.abs(m) * 2.2 + 0.12);
    const mix = (a, b) => Math.round(a + (b - a) * t);
    if (m >= 0) return `rgb(${mix(250, 205)},${mix(225, 30)},${mix(225, 30)})`;
    return `rgb(${mix(220, 22)},${mix(232, 104)},${mix(250, 196)})`;
  };
  ui.usMap = function (fill, opts = {}) {
    const paths = Object.entries(GR.US_MAP).map(([ab, [d]]) => `<path d="${d}" data-act="${opts.act || 'mapstate'}" data-a="${ab}" fill="${fill(ab) || 'var(--paper)'}" class="${opts.sel === ab ? 'sel' : ''}"><title>${esc(GR.STATE[ab].name)}${opts.tip ? ' — ' + esc(opts.tip(ab)) : ''}</title></path>`).join('');
    return `<svg class="map" viewBox="0 0 975 610" role="img" aria-label="Map of the United States">${paths}</svg>`;
  };
  ui.stateMap = function (s, ab, fill, opts = {}) {
    const g = GR.GEO[ab];
    if (!g) return '<p class="muted">Map loading…</p>';
    const [x, y, w, h] = g.vb;
    const paths = g.counties.map((c, k) => (!c[4] ? '' : `<path d="${c[4]}" fill="${fill(k) || 'var(--paper)'}" data-act="${opts.act || 'mapcounty'}" data-a="${k}"><title>${esc(c[1])} County${opts.tip ? ' — ' + esc(opts.tip(k)) : ''}</title></path>`)).join('');
    const dots = opts.dots ? `<g class="dotz">${opts.dots.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r || 2.2}" fill="${d.fill}"><title>${esc(d.tip || '')}</title></circle>`).join('')}</g>` : '';
    return `<svg class="map" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="Map of ${esc(GR.STATE[ab].name)}">${paths}<path class="outline" d="${g.outline}"/>${dots}</svg>`;
  };

  // ---------- Charts ----------
  ui.pie = function (parts) {
    let a = -Math.PI / 2;
    const tot = U.sum(parts, (p) => p.v) || 1;
    const segs = parts.map((p) => {
      const f = p.v / tot;
      if (f >= 0.999) return `<circle cx="50" cy="50" r="46" fill="${p.c}"/>`;
      const a2 = a + f * Math.PI * 2;
      const large = f > 0.5 ? 1 : 0;
      const d = `M50 50 L${50 + 46 * Math.cos(a)} ${50 + 46 * Math.sin(a)} A46 46 0 ${large} 1 ${50 + 46 * Math.cos(a2)} ${50 + 46 * Math.sin(a2)} Z`;
      a = a2;
      return `<path d="${d}" fill="${p.c}" stroke="var(--line)" stroke-width=".6"/>`;
    }).join('');
    return `<svg class="pie" viewBox="0 0 100 100" role="img" aria-label="Pie chart">${segs}<circle cx="50" cy="50" r="46" fill="none" stroke="var(--line)" stroke-width="1.2"/></svg>`;
  };
  // Line chart: series [{name, color, values}], xs labels.
  ui.lines = function (series, xs, opts = {}) {
    const W = 420, H = opts.h || 220, L = 44, R = 92, T = 30, B = 26;
    const all = series.flatMap((x) => x.values).filter((v) => v != null && isFinite(v));
    if (all.length < 2) return '<p class="muted small">Not enough history yet. Check back next year.</p>';
    let mn = opts.min != null ? opts.min : Math.min(...all), mx = Math.max(...all);
    if (mx === mn) mx = mn + 1;
    const pad = (mx - mn) * 0.08; mx += pad; if (opts.min == null) mn -= pad;
    const X = (i) => L + (xs.length < 2 ? 0 : (i / (xs.length - 1)) * (W - L - R));
    const Y = (v) => T + (1 - (v - mn) / (mx - mn)) * (H - T - B);
    const fmt = opts.fmt || ((v) => U.round(v, 1));
    const ticks = [0, 0.5, 1].map((f) => mn + (mx - mn) * f);
    const grid = ticks.map((v) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 4}" y="${Y(v) + 4}" text-anchor="end">${esc(fmt(v))}</text>`).join('');
    const lines = series.map((sr) => {
      const pts = sr.values.map((v, i) => (v == null ? null : [X(i), Y(v)])).filter(Boolean);
      return `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${sr.color}" stroke-width="2.5"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${sr.color}"/>`).join('')}`;
    }).join('');
    const xl = xs.map((x, i) => (xs.length <= 8 || i % Math.ceil(xs.length / 8) === 0 || i === xs.length - 1 ? `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${esc(x)}</text>` : '')).join('');
    const leg = series.map((sr, i) => `<rect x="${W - R + 10}" y="${T + i * 20}" width="14" height="14" fill="${sr.color}" stroke="var(--line)"/><text x="${W - R + 28}" y="${T + i * 20 + 11}">${esc(sr.name.slice(0, 11))}</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'Chart')}">${opts.title ? `<text x="${(W - R + L) / 2}" y="16" text-anchor="middle" style="font-size:15px">${esc(opts.title)}</text>` : ''}${grid}${lines}${xl}${leg}</svg>`;
  };

  // ---------- Toasts & modal ----------
  ui.toast = function (msg, chips) {
    if (!msg || typeof document === 'undefined') return;
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    if (chips && chips.length) { const c = document.createElement('div'); c.className = 'chips'; c.innerHTML = chips.slice(0, 10).map((x) => `<span class="ichip ${x.good ? 'good' : 'bad'}">${esc(x.t)}</span>`).join(''); t.appendChild(c); }
    box.appendChild(t);
    while (box.children.length > (window.innerWidth < 700 ? 2 : 3)) box.firstChild.remove();
    setTimeout(() => t.classList.add('out'), 5200);
    setTimeout(() => t.remove(), 5700);
  };
  ui.res = (r) => { if (r && r.msg) ui.toast(r.msg); };

  // ---------- Render ----------
  ui.render = function () {
    const root = document.getElementById('app');
    if (!root) return;
    const y = window.scrollY;
    const foc = document.activeElement && document.activeElement.id;
    let html = '';
    if (ui.screen === 'title') html = GR.uiCreate.title();
    else if (ui.screen === 'create') html = GR.uiCreate.render();
    else html = GR.uiGame.render();
    root.innerHTML = html;
    let ov = document.getElementById('overlay-root');
    if (!ov) { ov = document.createElement('div'); ov.id = 'overlay-root'; document.body.appendChild(ov); }
    ov.innerHTML = ui.screen === 'game' ? GR.uiGame.overlay() : '';
    if (foc) { const f = document.getElementById(foc); if (f) { f.focus({ preventScroll: true }); if (f.setSelectionRange && f.type === 'text') { const n = f.value.length; f.setSelectionRange(n, n); } } }
    window.scrollTo(0, y);
  };
  ui.go = (screen) => { ui.screen = screen; ui.render(); window.scrollTo(0, 0); };
  ui.on = (name, fn) => { ui.acts[name] = fn; };

  function dispatch(e, kind) {
    const attr = kind === 'click' ? 'act' : kind === 'input' ? 'in' : 'ch';
    const el = e.target.closest(`[data-${attr}]`);
    if (!el) return;
    const fn = ui.acts[el.dataset[attr]];
    if (!fn) return;
    if (kind === 'click') e.preventDefault();
    const r = fn(el, el.dataset.a, e);
    if (r !== false && kind !== 'input') ui.render();
  }

  ui.on('sub', (el, a) => { const [k, v] = a.split('|'); ui.sub[k] = v; });

  ui.boot = function () {
    document.addEventListener('click', (e) => dispatch(e, 'click'));
    document.addEventListener('input', (e) => dispatch(e, 'input'));
    document.addEventListener('change', (e) => dispatch(e, 'change'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && ui.modal) { ui.modal = null; ui.render(); }
    });
    const hot = globalThis.claude && globalThis.claude.hot;
    if (hot && hot.snapshot) hot.snapshot(() => ({ s: ui.s, screen: ui.screen, tab: ui.tab, sub: ui.sub }));
    const start = (data) => {
      if (data && data.s) {
        GR.geo.load(data.s.home.state, () => { ui.s = data.s; ui.screen = data.screen || 'game'; ui.tab = data.tab || 'office'; ui.sub = data.sub || {}; ui.render(); });
        return;
      }
      ui.render();
    };
    if (hot && hot.ready) hot.ready(start); else start(hot && hot.data);
  };

  ui.save = () => { if (ui.s) GR.state.save(ui.s); };

  return ui;
})();
