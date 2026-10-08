// Shared helpers. Everything hangs off the global G namespace so the game
// runs from file:// without a bundler and loads in Node for headless tests.
var G = globalThis.G || (globalThis.G = {});

G.util = (function () {
  const rand = () => Math.random();
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const chance = (p) => Math.random() < p;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function gauss() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Poisson draw, normal approximation for large means.
  function poisson(l) {
    if (!(l > 0)) return 0;
    if (l > 40) return Math.max(0, Math.round(l + Math.sqrt(l) * gauss()));
    const L = Math.exp(-l);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }

  function weighted(items, wfn) {
    const ws = items.map(wfn);
    const total = ws.reduce((a, b) => a + b, 0);
    if (total <= 0) return null;
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= ws[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let uidN = 0;
  const uid = (p = 'id') => p + '_' + Date.now().toString(36) + '_' + (uidN++).toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  function money(n, opts = {}) {
    if (n == null || isNaN(n)) return '$0';
    const neg = n < 0;
    const a = Math.abs(n);
    let s;
    if (opts.short && a >= 1e9) s = (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B';
    else if (opts.short && a >= 1e6) s = (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M';
    else if (opts.short && a >= 1e4) s = (a / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'k';
    else s = a.toLocaleString('en-US', { maximumFractionDigits: opts.cents ? 2 : 0, minimumFractionDigits: opts.cents ? 2 : 0 });
    return (neg ? '−$' : '$') + s;
  }
  const num = (n, d = 0) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const pct = (n, d = 0) => (n * 100).toFixed(d) + '%';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Calendar. Week 0 is Monday, January 5, 2026.
  const START = Date.UTC(2026, 0, 5);
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON3 = MONTHS.map((m) => m.slice(0, 3));
  function dateOf(week) { return new Date(START + week * 7 * 864e5); }
  function monthOf(week) { return dateOf(week).getUTCMonth(); }
  function yearOf(week) { return dateOf(week).getUTCFullYear(); }
  function dayOf(week) { return dateOf(week).getUTCDate(); }
  function fmtDate(week, long) {
    const d = dateOf(week);
    return (long ? MONTHS : MON3)[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
  }
  // True for the first week whose Monday falls in a new month.
  function isMonthStart(week) { return week === 0 || monthOf(week) !== monthOf(week - 1); }
  function isYearStart(week) { return week > 0 && yearOf(week) !== yearOf(week - 1); }
  // True for the week containing the given day of month (month index m).
  function weekContains(week, m, day) {
    const d0 = dateOf(week), d1 = dateOf(week + 1);
    const t = Date.UTC(d0.getUTCFullYear() + (m < d0.getUTCMonth() - 6 ? 1 : 0), m, day);
    return t >= d0.getTime() && t < d1.getTime();
  }

  // Amortized payment per period.
  function payment(principal, ratePerPeriod, periods) {
    if (ratePerPeriod <= 0) return principal / periods;
    return principal * ratePerPeriod / (1 - Math.pow(1 + ratePerPeriod, -periods));
  }

  const sum = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);
  const avg = (arr, f) => arr.length ? sum(arr, f) / arr.length : 0;

  return { rand, randInt, pick, chance, clamp, lerp, gauss, poisson, weighted, shuffle, uid, money, num, pct, esc,
    dateOf, monthOf, yearOf, dayOf, fmtDate, isMonthStart, isYearStart, weekContains, MONTHS, MON3, payment, sum, avg };
})();
