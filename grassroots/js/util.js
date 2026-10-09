// Shared helpers. Everything hangs off the global GR namespace so the game
// runs from file:// without a bundler and loads in Node for headless tests.
var GR = globalThis.GR || (globalThis.GR = {});

GR.util = (function () {
  const rand = () => Math.random();
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const chance = (p) => Math.random() < p;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const round = (v, d = 0) => { const m = Math.pow(10, d); return Math.round(v * m) / m; };

  function gauss() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Seeded generator so a ZIP code always produces the same district.
  function seeded(seed) {
    let a = typeof seed === 'number' ? seed >>> 0 : hash(String(seed));
    const next = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.gauss = () => {
      let u = 0, v = 0;
      while (!u) u = next();
      while (!v) v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    next.int = (a2, b2) => Math.floor(a2 + next() * (b2 - a2 + 1));
    next.pick = (arr) => arr[Math.floor(next() * arr.length)];
    return next;
  }

  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function weighted(items, wfn) {
    const ws = items.map(wfn);
    const total = ws.reduce((a, b) => a + b, 0);
    if (total <= 0) return items[0];
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // Standard normal CDF (Abramowitz-Stegun).
  function ncdf(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  }

  let uidN = 0;
  const uid = (p = 'id') => p + (Date.now() % 1e7).toString(36) + (uidN++).toString(36) + Math.floor(Math.random() * 1296).toString(36);

  function money(n, opts = {}) {
    if (n == null || isNaN(n)) return '$0';
    const neg = n < 0, a = Math.abs(n);
    let s;
    if (opts.short !== false && a >= 1e12) s = (a / 1e12).toFixed(2) + 'T';
    else if (opts.short !== false && a >= 1e9) s = (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B';
    else if (opts.short !== false && a >= 1e6) s = (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
    else if (opts.short && a >= 1e4) s = (a / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'k';
    else s = Math.round(a).toLocaleString('en-US');
    return (neg ? '−$' : '$') + s;
  }
  const num = (n, d = 0) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const pct = (n, d = 1) => (n == null || isNaN(n)) ? '0%' : n.toFixed(d) + '%';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const plural = (n, w, ws) => `${num(n)} ${n === 1 ? w : (ws || w + 's')}`;

  // Calendar. Week 0 is Monday, January 4, 2027.
  const START = Date.UTC(2027, 0, 4);
  const DAY = 864e5;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON3 = MONTHS.map((m) => m.slice(0, 3));
  const dateOf = (w) => new Date(START + w * 7 * DAY);
  const yearOf = (w) => dateOf(w).getUTCFullYear();
  const monthOf = (w) => dateOf(w).getUTCMonth();
  const weekOfDate = (t) => Math.floor((t - START) / (7 * DAY));
  function fmtDate(w, long) { const d = dateOf(w); return (long ? MONTHS : MON3)[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); }
  // Election day: the Tuesday after the first Monday in November.
  function electionWeek(year) {
    const nov1 = new Date(Date.UTC(year, 10, 1));
    const dow = nov1.getUTCDay();
    const firstMon = 1 + ((8 - dow) % 7);
    return weekOfDate(Date.UTC(year, 10, firstMon + 1));
  }
  const weekOfMD = (year, m, d) => weekOfDate(Date.UTC(year, m, d));
  const firstWeekOfYear = (year) => Math.max(0, weekOfMD(year, 0, 7));
  const isYearStart = (w) => w > 0 && yearOf(w) !== yearOf(w - 1);
  const isMonthStart = (w) => w === 0 || monthOf(w) !== monthOf(w - 1);

  const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);
  const avg = (arr, f = (x) => x) => (arr.length ? sum(arr, f) / arr.length : 0);
  const by = (k, dir = 1) => (a, b) => (typeof k === 'function' ? k(a) - k(b) : a[k] - b[k]) * dir;

  return {
    rand, randInt, pick, chance, clamp, lerp, round, gauss, seeded, hash, weighted, shuffle, ncdf, uid,
    money, num, pct, esc, ordinal, plural, START, dateOf, yearOf, monthOf, weekOfDate, fmtDate, electionWeek,
    weekOfMD, firstWeekOfYear, isYearStart, isMonthStart, MONTHS, MON3, sum, avg, by,
  };
})();
