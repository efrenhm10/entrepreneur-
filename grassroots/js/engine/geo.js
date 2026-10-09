// Geography: real ZIP codes, cities and counties for each state (loaded on demand from
// js/geo/XX.js), partisan lean per ZIP, and districts drawn as equal-population runs of
// ZIP codes along a space-filling curve, so neighbors end up in the same district.
var GR = globalThis.GR || (globalThis.GR = {});

GR.GEO = GR.GEO || {};
GR.geoLoaded = function (d) { GR.GEO[d.ab] = d; };

GR.geo = (function () {
  const U = GR.util;
  const cache = {};

  // Load a state's geography. Works from file:// (script tag) and in Node (require).
  function load(ab, cb) {
    if (GR.GEO[ab]) return cb && cb(GR.GEO[ab]);
    if (typeof document === 'undefined') { require('../geo/' + ab + '.js'); return cb && cb(GR.GEO[ab]); }
    const el = document.createElement('script');
    el.src = 'js/geo/' + ab + '.js';
    el.onload = () => cb && cb(GR.GEO[ab]);
    el.onerror = () => cb && cb(null);
    document.head.appendChild(el);
  }

  function hilbert(x, y, n) {
    let d = 0;
    for (let s = n / 2; s >= 1; s /= 2) {
      const rx = (x & s) > 0 ? 1 : 0, ry = (y & s) > 0 ? 1 : 0;
      d += s * s * ((3 * rx) ^ ry);
      if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } const t = x; x = y; y = t; }
    }
    return d;
  }

  // Parsed, enriched view of a state's ZIPs. Cached per state.
  function state(ab) {
    if (cache[ab]) return cache[ab];
    const g = GR.GEO[ab];
    if (!g) return null;
    const st = GR.STATE[ab];
    const rows = g.zips.split(';').map((r) => r.split(','));
    const Z = rows.map((r, i) => ({ i, zip: r[0], city: +r[1], pop: +r[2], x: +r[3], y: +r[4], dens: Math.max(1, +r[5]) }));
    const tot = U.sum(Z, (z) => z.pop);
    const mld = U.sum(Z, (z) => z.pop * Math.log10(z.dens)) / tot;
    // Density is the strongest predictor of partisanship: cities lean Democratic, rural areas Republican.
    Z.forEach((z) => {
      const r = U.seeded('zl' + z.zip);
      z.lean = -19 * (Math.log10(z.dens) - mld) + r.gauss() * 6;
    });
    const mean = U.sum(Z, (z) => z.pop * z.lean) / tot;
    Z.forEach((z) => { z.lean = U.clamp(z.lean - mean + st.lean, -48, 45); });
    // Order along a Hilbert curve for contiguous districts.
    const xs = Z.map((z) => z.x), ys = Z.map((z) => z.y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), span = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) || 1;
    Z.forEach((z) => { z.h = hilbert(Math.floor(((z.x - x0) / span) * 1023), Math.floor(((z.y - y0) / span) * 1023), 1024); });
    const order = Z.slice().sort((a, b) => a.h - b.h);
    const zipIdx = {};
    Z.forEach((z) => { zipIdx[z.zip] = z.i; });
    const cityZips = {};
    Z.forEach((z) => { (cityZips[z.city] || (cityZips[z.city] = [])).push(z.i); });
    const out = { ab, g, Z, order, tot, zipIdx, cityZips, districts: {} };
    cache[ab] = out;
    return out;
  }

  // Split a list of ZIPs (in curve order) into n equal-population districts. Each district
  // is a list of [zipIndex, weight]; big ZIPs can be shared between neighboring districts.
  function chunk(zs, n) {
    const tot = U.sum(zs, (z) => z.pop) || 1;
    const per = tot / n;
    const ds = Array.from({ length: n }, () => []);
    let acc = 0;
    zs.forEach((z) => {
      let a = acc, b = acc + z.pop;
      if (z.pop === 0) { ds[Math.min(n - 1, Math.floor(a / per))].push([z.i, 0]); return; }
      while (a < b - 1e-6) {
        const d = Math.min(n - 1, Math.floor(a / per + 1e-9));
        const end = d === n - 1 ? b : Math.min(b, (d + 1) * per);
        ds[d].push([z.i, (end - a) / z.pop]);
        a = end;
      }
      acc = b;
    });
    return ds;
  }

  // Districts for a body. kind: house | senate | cd | ward | school.
  function districts(S, kind, n, cityIdx) {
    const key = kind + ':' + n + ':' + (cityIdx == null ? '' : cityIdx);
    if (S.districts[key]) return S.districts[key];
    let zs = S.order;
    if (cityIdx != null) { const set = new Set(S.cityZips[cityIdx] || []); zs = S.order.filter((z) => set.has(z.i)); }
    const ds = chunk(zs, Math.max(1, n));
    S.districts[key] = ds;
    return ds;
  }

  // Which district contains a ZIP (the one holding most of its people).
  function districtOf(ds, zi) {
    let best = 0, bw = -1;
    ds.forEach((d, k) => d.forEach(([i, w]) => { if (i === zi && w > bw) { bw = w; best = k; } }));
    return best;
  }

  // Area profile from weighted ZIPs: population, lean, party registration and more.
  function profile(S, parts, salt) {
    let pop = 0, lean = 0, dens = 0, cx = 0, cy = 0;
    parts.forEach(([i, w]) => { const z = S.Z[i]; const p = z.pop * w; pop += p; lean += z.lean * p; dens += Math.log10(z.dens) * p; cx += z.x * p; cy += z.y * p; });
    if (pop <= 0) { const z = S.Z[parts[0] ? parts[0][0] : 0]; return mkProfile(S, z.pop || 1000, z.lean, Math.log10(z.dens), z.x, z.y, salt); }
    return mkProfile(S, pop, lean / pop, dens / pop, cx / pop, cy / pop, salt);
  }

  function mkProfile(S, pop, lean, ld, x, y, salt) {
    const st = GR.STATE[S.ab];
    const r = U.seeded('pf' + S.ab + salt);
    const ind = U.clamp(0.08 + r() * 0.08 + (Math.abs(lean) < 8 ? 0.02 : 0), 0.05, 0.2);
    const R = (1 - ind) * U.clamp(0.5 + lean * 0.0125, 0.04, 0.96);
    const D = 1 - ind - R;
    const urban = U.clamp(Math.round((ld - 1.4) * 38 + r.gauss() * 6), 0, 100);
    const colAdj = (st ? st.col : 100) / 100;
    const income = Math.round((52 + urban * 0.25 + r.gauss() * 9) * Math.pow(colAdj, 0.7));
    const poverty = U.clamp(Math.round((15.5 - (income - 60) * 0.18 + r.gauss() * 2.5) * 10) / 10, 4, 34);
    const college = U.clamp(Math.round(18 + urban * 0.2 + (income - 60) * 0.35 + r.gauss() * 5), 8, 75);
    const age = U.clamp(Math.round(41 - urban * 0.05 + r.gauss() * 3), 28, 58);
    const unemp = U.clamp(Math.round((4.2 + poverty * 0.06 + r.gauss() * 0.6) * 10) / 10, 1.8, 11);
    const white = U.clamp(Math.round(78 - urban * 0.35 + r.gauss() * 10), 8, 97);
    const veterans = U.clamp(Math.round((7 - urban * 0.03 + r.gauss()) * 10) / 10, 2, 16);
    const religious = U.clamp(Math.round(48 + lean * 0.7 + r.gauss() * 6), 15, 85);
    const guns = U.clamp(Math.round(32 + lean * 0.8 - urban * 0.12 + r.gauss() * 5), 6, 75);
    const union = U.clamp(Math.round((8 + r.gauss() * 3 - Math.max(0, lean) * 0.12) * 10) / 10, 1.5, 25);
    return { pop: Math.round(pop), lean, D, R, I: ind, urban, income, poverty, college, age, unemp, white, veterans, religious, guns, union, dens: Math.round(Math.pow(10, ld)), x, y };
  }

  // Counties (from real data) with their own lean, from their ZIPs.
  function counties(S) {
    if (S.countyList) return S.countyList;
    const g = S.g;
    // Assign each ZIP to its city's main county (good enough for county maps).
    const byC = g.counties.map((c, k) => ({ k, fips: c[0], name: c[1], pop: c[2], dens: c[3], path: c[4], parts: [] }));
    S.Z.forEach((z) => { const ci = g.cities[z.city]; if (ci) byC[ci[1]].parts.push([z.i, 1]); });
    byC.forEach((c) => {
      const p = c.parts.length ? profile(S, c.parts, 'co' + c.fips) : mkProfile(S, c.pop, GR.STATE[S.ab].lean, Math.log10(Math.max(1, c.dens)), 0, 0, 'co' + c.fips);
      c.prof = p;
    });
    S.countyList = byC;
    return byC;
  }

  const cityName = (S, idx) => (S.g.cities[idx] ? S.g.cities[idx][0] : 'Unknown');
  const cityPop = (S, idx) => (S.g.cities[idx] ? S.g.cities[idx][2] : 0);
  const countyOfCity = (S, idx) => (S.g.cities[idx] ? S.g.counties[S.g.cities[idx][1]] : null);
  // Cities in a state, largest first, for pickers.
  const cityList = (S, min = 0) => S.g.cities.map((c, i) => ({ i, name: c[0], county: S.g.counties[c[1]][1], pop: c[2] })).filter((c) => c.pop >= min);

  return { load, state, chunk, districts, districtOf, profile, mkProfile, counties, cityName, cityPop, countyOfCity, cityList };
})();
