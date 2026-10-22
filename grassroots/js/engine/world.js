// The political world: every seat from school board to President in the player's home
// state, the AI politicians who hold and want them, legislatures, caucuses, leadership,
// and the governments (school district, city, state, nation) with laws, budgets and metrics.
var GR = globalThis.GR || (globalThis.GR = {});

GR.world = (function () {
  const U = GR.util;

  const FISCAL = new Set(['Taxes', 'Economy', 'Environment', 'Housing', 'Defense']);
  const SOCIAL_HEALTH = new Set(['abortion', 'vaccines']);
  const isFiscal = (p) => (p.cat === 'Health' ? !SOCIAL_HEALTH.has(p.k) : FISCAL.has(p.cat));

  const CAUCUSES = {
    D: [{ k: 'prog', name: 'Progressive Caucus', max: -1.25 }, { k: 'newdem', name: 'New Democrat Coalition', max: -0.55 }, { k: 'bluedog', name: 'Blue Dog Coalition', max: 9 }],
    R: [{ k: 'mainst', name: 'Main Street Caucus', max: 0.85 }, { k: 'rsc', name: 'Republican Study Committee', max: 1.45 }, { k: 'freedom', name: 'Freedom Caucus', max: 9 }],
  };
  const TRAITS = [
    { k: 'charismatic', name: 'Charismatic', desc: '+15% from rallies, media and ads.' },
    { k: 'wonk', name: 'Policy Wonk', desc: 'Bills cost fewer points and pass more easily.' },
    { k: 'rainmaker', name: 'Rainmaker', desc: '+20% from all fundraising.' },
    { k: 'workhorse', name: 'Workhorse', desc: '+6 hours every week.' },
    { k: 'maverick', name: 'Maverick', desc: 'Independents like you; party leaders trust you less.' },
    { k: 'loyal', name: 'Party Loyalist', desc: 'Party standing grows faster; leadership races easier.' },
    { k: 'competitive', name: 'Competitive', desc: 'Stronger debates and attack ads.' },
    { k: 'chivalrous', name: 'Chivalrous', desc: 'Attack ads against you backfire more often.' },
    { k: 'thickskin', name: 'Thick-Skinned', desc: 'Scandals hurt less.' },
    { k: 'family', name: 'Family First', desc: 'Family time does more; relationships stay strong.' },
  ];
  const NPC_TRAITS = TRAITS.map((t) => t.name).concat(['Ambitious', 'Gaffe-Prone', 'Corrupt', 'Bipartisan', 'Ideologue']);

  // ---------- Politicians ----------
  function stanceNPC(p, pol) {
    const r = U.seeded(p.sd + pol.k);
    if (pol.ideo === 0) return U.clamp(r.gauss() * 1.1, -2, 2);
    const axis = isFiscal(pol) ? p.fis : p.soc;
    return U.clamp(axis * pol.ideo + r.gauss() * 0.55, -2, 2);
  }
  // Position of a politician on a policy as a score -2..2.
  function stance(p, k) {
    const pol = GR.POLICY[k];
    if (p.pos) return GR.optScore(pol, p.pos[k], 'n');
    return stanceNPC(p, pol);
  }
  function axes(p) {
    if (!p.pos) return { fis: p.fis, soc: p.soc };
    let f = 0, nf = 0, so = 0, ns = 0;
    GR.POLICIES.forEach((pol) => {
      if (pol.ideo === 0) return;
      const v = stance(p, pol.k);
      if (isFiscal(pol)) { f += v; nf++; } else { so += v; ns++; }
    });
    return { fis: f / nf, soc: so / ns };
  }
  const ideoLabel = (v) => (v <= -1.3 ? 'Very Liberal' : v <= -0.45 ? 'Liberal' : v < 0.45 ? 'Moderate' : v < 1.3 ? 'Conservative' : 'Very Conservative');
  function caucusOf(p) {
    const a = axes(p);
    const v = (a.fis + a.soc) / 2;
    return CAUCUSES[p.party].find((c) => v <= c.max) || CAUCUSES[p.party][2];
  }

  function newPol(s, o) {
    const g = o.g || (U.chance(o.fem == null ? 0.32 : o.fem) ? 'f' : 'm');
    const base = GR.PARTIES[o.party].base;
    const lean = o.lean || 0;
    const fis = U.clamp(base + lean * 0.012 + U.gauss() * 0.38, -2, 2);
    const soc = U.clamp(base + lean * 0.014 + U.gauss() * 0.42, -2, 2);
    const q = U.clamp(Math.round(45 + U.gauss() * 13 + (o.boost || 0)), 15, 95);
    const sk = {};
    GR.SKILLS.forEach((x) => { sk[x.k] = U.clamp(Math.round(q + U.gauss() * 10), 5, 99); });
    const age = o.age || U.randInt(30, 66);
    const p = {
      id: U.uid('p'), fn: U.pick(GR.NAMES[g]), ln: U.pick(GR.NAMES.l), g, by: U.yearOf(s.week) - age,
      party: o.party, fis, soc, sd: U.uid('s'), sk, q, traits: U.shuffle(NPC_TRAITS).slice(0, 2),
      pp: Math.round(Math.pow(o.level || 1, 2) * (200 + U.rand() * 600)), rec: o.rec || U.randInt(10, 35),
      app: U.randInt(42, 62), seat: null, z: o.z == null ? null : o.z, st: o.st || s.home.state,
      hist: [], terms: {}, amb: U.round(U.rand(), 2), alive: true, ext: !!o.ext, ties: 0, infl: U.randInt(5, 30),
    };
    p.caucus = caucusOf(p).k;
    s.pols[p.id] = p;
    return p;
  }

  const fullName = (p) => (p ? p.fn + ' ' + p.ln : 'Vacant');
  const ageOf = (s, p) => U.yearOf(s.week) - p.by;

  // ---------- Seats ----------
  function seatTitle(s, seat) {
    const ab = s.home.state;
    const city = s.home.cityName;
    switch (seat.off) {
      case 'school': return `${city} School Board, District ${seat.n}`;
      case 'council': return `${city} City Council, Ward ${seat.n}`;
      case 'mayor': return `Mayor of ${city}`;
      case 'statehouse': return `${ab} House District ${seat.n}`;
      case 'statesenate': return `${ab} Senate District ${seat.n}`;
      case 'ushouse': return ab === 'DC' ? 'DC Delegate to Congress' : `${ab}-${String(seat.n).padStart(2, '0')}${GR.STATE[ab].cd === 1 ? ' (at-large)' : ''}`;
      case 'governor': return `Governor of ${GR.STATE[ab].name}`;
      case 'ussenate': return `U.S. Senate, ${GR.STATE[ab].name} (Class ${seat.cls})`;
      case 'president': return 'President of the United States';
      default: return seat.off;
    }
  }

  // ZIP-level parts for a seat's constituency (memoized, not saved).
  const memo = {};
  function seatParts(s, seat) {
    const key = s.home.state + s.home.city + seat.id;
    if (memo[key]) return memo[key];
    const S = GR.geo.state(s.home.state);
    const st = GR.STATE[s.home.state];
    let parts;
    switch (seat.off) {
      case 'school': parts = GR.geo.districts(S, 'school', s.city.nSchool, s.home.city)[seat.n - 1]; break;
      case 'council': parts = GR.geo.districts(S, 'ward', s.city.nCouncil, s.home.city)[seat.n - 1]; break;
      case 'mayor': parts = (S.cityZips[s.home.city] || []).map((i) => [i, 1]); break;
      case 'statehouse': parts = GR.geo.districts(S, 'house', st.lo, null)[seat.n - 1]; break;
      case 'statesenate': parts = GR.geo.districts(S, 'senate', st.up, null)[seat.n - 1]; break;
      case 'ushouse': parts = GR.geo.districts(S, 'cd', Math.max(1, st.cd), null)[seat.n - 1]; break;
      default: parts = S.Z.map((z) => [z.i, 1]);
    }
    memo[key] = parts;
    return parts;
  }
  function seatProfile(s, seat) {
    if (seat.off === 'president') return nationProfile();
    const key = 'pf' + s.home.state + s.home.city + seat.id;
    if (memo[key]) return memo[key];
    const pr = GR.geo.profile(GR.geo.state(s.home.state), seatParts(s, seat), seat.id + s.home.city);
    memo[key] = pr;
    return pr;
  }
  function nationProfile() {
    return GR.geo.mkProfile({ ab: 'US' }, 340e6, 0, 2.4, 0, 0, 'nation');
  }
  const clearMemo = () => { Object.keys(memo).forEach((k) => delete memo[k]); };

  // Which districts contain a ZIP.
  function homeSeats(s, zi) {
    const S = GR.geo.state(s.home.state);
    const st = GR.STATE[s.home.state];
    const out = { mayor: 'mayor', governor: 'gov', president: 'pres' };
    const z = S.Z[zi];
    if (z && z.city === s.home.city) {
      out.school = 'school-' + (GR.geo.districtOf(GR.geo.districts(S, 'school', s.city.nSchool, s.home.city), zi) + 1);
      out.council = 'council-' + (GR.geo.districtOf(GR.geo.districts(S, 'ward', s.city.nCouncil, s.home.city), zi) + 1);
    }
    if (st.lo) out.statehouse = 'house-' + (GR.geo.districtOf(GR.geo.districts(S, 'house', st.lo, null), zi) + 1);
    if (st.up) out.statesenate = 'senate-' + (GR.geo.districtOf(GR.geo.districts(S, 'senate', st.up, null), zi) + 1);
    out.ushouse = 'cd-' + (GR.geo.districtOf(GR.geo.districts(S, 'cd', Math.max(1, st.cd), null), zi) + 1);
    if (st.sc.length) out.ussenate = st.sc.map((c) => 'sen-' + c);
    if (st.gov === 'none') delete out.governor;
    return out;
  }

  // Next election year for a seat, on or after a year.
  function nextElection(s, seat, from) {
    const st = GR.STATE[s.home.state];
    let y = from;
    const ok = (yr) => {
      switch (seat.off) {
        case 'school': case 'council': return yr % 2 === 1 && ((yr - 2027) / 2 + seat.n) % 2 === 0;
        case 'mayor': return yr % 2 === 1 && (yr - s.city.mayorYear) % 4 === 0;
        case 'statehouse': case 'ushouse': return yr % 2 === 0;
        case 'statesenate': return yr % 2 === 0 && ((yr - 2028) / 2 + seat.n) % 2 === 0;
        case 'governor': {
          const c = st.gov;
          if (c === 'two') return yr % 2 === 0;
          if (c === 'mid') return yr % 4 === 2;
          if (c === 'pres') return yr % 4 === 0;
          if (c === 'odd3') return yr % 4 === 3;
          if (c === 'odd1') return yr % 4 === 1;
          return false;
        }
        case 'ussenate': return yr % 2 === 0 && (yr - { 1: 2030, 2: 2032, 3: 2028 }[seat.cls]) % 6 === 0;
        case 'president': return yr % 4 === 0;
      }
      return false;
    };
    for (let i = 0; i < 12; i++, y++) if (ok(y)) return y;
    return from + 4;
  }

  function termYears(s, off) {
    if (off === 'governor' && GR.STATE[s.home.state].gov === 'two') return 2;
    if (off === 'statesenate') return 4;
    return GR.OFFICES[off].term;
  }

  // ---------- Initial law ----------
  const NO_INCOME_TAX = 'AK FL NV NH SD TN TX WA WY';
  const NO_MEDICAID_EXP = 'AL FL GA KS MS SC TN TX WI WY';
  const LEGAL_POT = 'AK AZ CA CO CT DE IL ME MD MA MI MN MO MT NV NJ NM NY OH OR RI VT VA WA DC';
  const MINWAGE = { AL: 7.25, AK: 11.91, AZ: 14.7, AR: 11, CA: 16.5, CO: 14.81, CT: 16.35, DE: 15, DC: 17.95, FL: 14, GA: 7.25, HI: 14, ID: 7.25, IL: 15, IN: 7.25, IA: 7.25, KS: 7.25, KY: 7.25, LA: 7.25, ME: 14.65, MD: 15, MA: 15, MI: 12.48, MN: 11.13, MS: 7.25, MO: 13.75, MT: 10.55, NE: 13.5, NV: 12, NH: 7.25, NJ: 15.49, NM: 12, NY: 15.5, NC: 7.25, ND: 7.25, OH: 10.7, OK: 7.25, OR: 15.05, PA: 7.25, RI: 15, SC: 7.25, SD: 11.5, TN: 7.25, TX: 7.25, UT: 7.25, VT: 14.01, VA: 12.41, WA: 16.66, WV: 8.75, WI: 7.25, WY: 7.25 };

  function initialLaw(jur, ab, lean, seed) {
    const r = U.seeded('law' + seed);
    const lvl = GR.lvlOf(jur);
    const law = {};
    GR.policiesFor(jur).forEach((p) => {
      let idx;
      if (jur === 'nation') idx = p.fed;
      else if (p.ideo === 0) idx = U.clamp(p.fed + r.int(-1, 1), 0, GR.policyOpts(p, lvl).length - 1);
      else idx = GR.scoreToIdx(p, U.clamp(lean / 7 + r.gauss() * 0.45, -2, 2), lvl);
      if (jur === 'state') {
        if (p.k === 'incometax') idx = NO_INCOME_TAX.includes(ab) ? 4 : U.clamp(idx, 0, 3);
        if (p.k === 'medicaid') idx = NO_MEDICAID_EXP.includes(ab) ? 3 : U.clamp(idx, 0, 2);
        if (p.k === 'marijuana') idx = LEGAL_POT.includes(ab) ? 1 : U.clamp(idx, 2, 4);
        if (p.k === 'minwage') { const w = MINWAGE[ab] || 7.25; idx = w >= 18.5 ? 0 : w >= 16 ? 1 : w >= 13.5 ? 2 : w >= 9.6 ? 3 : 4; }
      }
      law[p.k] = idx;
    });
    return law;
  }

  // ---------- Budgets ----------
  // Budgets live in the fiscal engine (GR.fisc). This wrapper keeps a simple shape for callers:
  // sp: spending by agency/program, rv: revenue by line, spend, rev, bal.
  function totals(J) {
    const t = GR.fisc.totals(J);
    const rv = {};
    Object.values(t.rv).forEach((x) => { rv[x.name] = x.amt; });
    return { sp: t.sp, rv, spend: t.spend, rev: t.rev, bal: t.bal, raw: t };
  }

  // ---------- Metrics ----------
  const METRICS = {
    unemp: { name: 'Unemployment', unit: '%', good: -1, d: 1 },
    growth: { name: 'Economic growth', unit: '%', good: 1, d: 1 },
    income: { name: 'Median household income', unit: '$', good: 1, d: 0 },
    poverty: { name: 'Poverty rate', unit: '%', good: -1, d: 1 },
    crime: { name: 'Violent crime per 100k', unit: '', good: -1, d: 0 },
    uninsured: { name: 'Uninsured', unit: '%', good: -1, d: 1 },
    grad: { name: 'High school graduation', unit: '%', good: 1, d: 1 },
    rent: { name: 'Median rent', unit: '$', good: -1, d: 0 },
    emis: { name: 'Emissions index', unit: '', good: -1, d: 0 },
  };

  function baseMetrics(pr, jur) {
    const m = {
      unemp: pr.unemp, growth: 2.0, income: pr.income * 1000, poverty: pr.poverty,
      crime: Math.round(250 + pr.urban * 3 + pr.poverty * 6), uninsured: U.clamp(Math.round((7 + pr.poverty * 0.25 + Math.max(0, pr.lean) * 0.08) * 10) / 10, 2.5, 20),
      grad: U.clamp(Math.round((91 - pr.poverty * 0.25) * 10) / 10, 72, 97), rent: Math.round(900 + pr.income * 9 + pr.urban * 5), emis: 100,
    };
    if (jur === 'nation') Object.assign(m, { unemp: 4.3, growth: 2.0, income: 80600, poverty: 11.1, crime: 360, uninsured: 8.0, grad: 87.0, rent: 1720 });
    return m;
  }

  // ---------- Jurisdictions ----------
  function makeJur(s, k, name, pop, pr, lean, seed) {
    const J = { k, name, pop: Math.round(pop), lean, law: initialLaw(k, s.home.state, lean, seed), laws: [], met: baseMetrics(pr, k), hist: [], approval: 50 };
    if (k === 'school') J.students = Math.round(pop * 0.15);
    J.law0 = Object.assign({}, J.law);
    J.met0 = Object.assign({}, J.met);
    GR.fisc.init(s, J);
    return J;
  }

  // ---------- Bodies, seats and leadership ----------
  function makeSeat(s, id, off, n, extra) {
    const seat = Object.assign({ id, off, n, holder: null, next: 0 }, extra || {});
    s.seats[id] = seat;
    return seat;
  }

  function natEnv(s) { return s.nat ? s.nat.env : 0; }

  // Fill a seat with an AI politician of the party its voters most likely elect.
  function fillSeat(s, seat, lvl, forceParty) {
    const pr = seatProfile(s, seat);
    const lean = pr.lean;
    const sd = seat.off === 'governor' || seat.off === 'ussenate' ? 3.5 : 6.5;
    const party = forceParty || (U.chance(U.ncdf((lean + natEnv(s)) / sd)) ? 'R' : 'D');
    const zi = pickZipIn(s, seat);
    const p = newPol(s, { party, lean, level: lvl, z: zi, rec: U.randInt(25, 50) + lvl * 4, age: U.randInt(32, 70) });
    const terms = Math.max(0, Math.round(U.rand() * 4 - 0.5 + (p.by < U.yearOf(s.week) - 55 ? 1.5 : 0)));
    p.seat = seat.id;
    p.terms[seat.off] = terms;
    p.since = U.yearOf(s.week) - terms * termYears(s, seat.off);
    p.hist.push({ y: p.since, t: GR.OFFICES[seat.off].name, seat: seat.id });
    p.app = U.randInt(44, 64);
    seat.holder = p.id;
    return p;
  }

  function pickZipIn(s, seat) {
    if (seat.off === 'president') return null;
    const parts = seatParts(s, seat);
    if (!parts || !parts.length) return GR.geo.state(s.home.state).zipIdx[s.home.zip];
    const pp = U.weighted(parts, (x) => GR.geo.state(s.home.state).Z[x[0]].pop * x[1] + 1);
    return pp[0];
  }

  function bodySeats(s, bodyKey) {
    const off = { school: 'school', council: 'council', house: 'statehouse', senate: 'statesenate', ushouse: 'ushouse', ussenate: 'ussenate' }[bodyKey];
    return Object.values(s.seats).filter((x) => x.off === off);
  }

  // Party counts in a body, including members from other states for Congress.
  function composition(s, bodyKey) {
    const c = { D: 0, R: 0 };
    members(s, bodyKey).forEach((p) => { c[p.party]++; });
    return c;
  }
  const majority = (s, bodyKey) => { const c = composition(s, bodyKey); return c.R > c.D ? 'R' : c.D > c.R ? 'D' : (bodyKey === 'ussenate' ? s.nat.presParty : 'R'); };

  // Every member of a chamber. Congress includes all 435 Representatives and 100 Senators:
  // your state's delegation holds real seats, the rest are tracked by state and district.
  function members(s, bodyKey) {
    const home = bodySeats(s, bodyKey).map((x) => s.pols[x.holder]).filter(Boolean);
    if ((bodyKey === 'ushouse' || bodyKey === 'ussenate') && s.nat && s.nat.fed) return home.concat(s.nat.fed[bodyKey].map((id) => s.pols[id]).filter(Boolean));
    return home;
  }
  const senior = (b) => (p) => (p.terms[offOfBody(b)] || 0) + (p.infl || 0) / 30;

  // Leadership for a body. For Congress, leaders usually come from other states.
  function setupLeadership(s, bodyKey) {
    const posts = GR.LEADERSHIP[bodyKey];
    const B = s.bodies[bodyKey];
    B.lead = {};
    const maj = majority(s, bodyKey);
    const used = new Set();
    posts.slice().sort((a, b) => b.rank - a.rank).forEach((post) => {
      const party = post.side === 'maj' ? maj : post.side === 'min' ? GR.other(maj) : (U.chance(0.5) ? maj : GR.other(maj));
      const pool = members(s, bodyKey).filter((m) => m.party === party && !used.has(m.id) && !m.isPlayer).sort((a, b) => senior(bodyKey)(b) - senior(bodyKey)(a));
      const p = pool[0];
      if (p) { B.lead[post.k] = p.id; used.add(p.id); p.lead = { body: bodyKey, post: post.k }; p.infl = Math.max(p.infl, post.inf + 20); }
    });
  }
  const offOfBody = (b) => ({ school: 'school', council: 'council', house: 'statehouse', senate: 'statesenate', ushouse: 'ushouse', ussenate: 'ussenate' }[b]);

  // A reusable member of Congress from another state (sponsors bills, holds leadership).
  function extMember(s, party, bodyKey) {
    const pool = members(s, bodyKey).filter((m) => m.party === party && !m.isPlayer && !m.lead);
    return pool.length ? U.pick(pool) : extPol(s, party, bodyKey);
  }

  // A member of Congress from another state.
  function fedMember(s, body, ab, n, cls, lean, party, fresh) {
    const lvl = body === 'ussenate' ? 7 : 5;
    const p = newPol(s, { party, lean, level: lvl, st: ab, ext: true, age: fresh ? U.randInt(34, 62) : U.randInt(36, 78), rec: U.randInt(20, 55) });
    p.fed = { body, st: ab, n, cls, lean: U.round(lean, 1) };
    const off = body === 'ussenate' ? 'ussenate' : 'ushouse';
    p.terms[off] = fresh ? 0 : Math.max(0, Math.round(U.rand() * (body === 'ussenate' ? 3 : 6)));
    p.title = body === 'ussenate' ? `U.S. Senator (${ab})` : `U.S. Representative (${ab}-${String(n).padStart(2, '0')})`;
    p.hist.push({ y: U.yearOf(s.week) - p.terms[off] * (body === 'ussenate' ? 6 : 2), t: p.title });
    p.since = U.yearOf(s.week) - p.terms[off] * (body === 'ussenate' ? 6 : 2);
    return p;
  }

  // National figures from other states (leaders, presidential contenders).
  function extPol(s, party, bodyKey, office) {
    const others = GR.STATES.filter((x) => x.ab !== s.home.state && x.ab !== 'DC' && (party === 'R' ? x.lean > -6 : x.lean < 6));
    const st = U.pick(others);
    const p = newPol(s, { party, lean: st.lean, level: 7, ext: true, st: st.ab, boost: 12, age: U.randInt(45, 74), rec: U.randInt(35, 70) });
    const title = office || (bodyKey === 'ussenate' ? 'U.S. Senator' : bodyKey === 'ushouse' ? 'U.S. Representative' : 'Governor');
    p.title = title + ' (' + st.ab + ')';
    p.terms[bodyKey === 'ussenate' ? 'ussenate' : bodyKey === 'ushouse' ? 'ushouse' : 'governor'] = U.randInt(2, 7);
    p.hist.push({ y: U.yearOf(s.week) - U.randInt(4, 20), t: title + ', ' + st.name });
    p.rec = U.randInt(30, 65);
    return p;
  }

  // Committees per body (see committees.js).
  function setupCommittees(s, bodyKey) { GR.comm.setup(s, bodyKey); }

  // ---------- Nation ----------
  function setupNation(s) {
    const home = s.home.state;
    const nat = { env: U.round(U.gauss() * 1.5, 1), presParty: 'R', econ: { growth: 2.0, cycle: 0 }, other: {}, ec: {}, fed: { ushouse: [], ussenate: [] } };
    s.nat = nat;
    // Every other state's House districts and Senate seats get a member.
    GR.STATES.forEach((st) => {
      if (st.ab === home) return;
      const o = { cds: [], sen: {} };
      const r = U.seeded('cds' + st.ab);
      const n = st.ab === 'DC' ? 0 : st.cd;
      for (let i = 0; i < n; i++) {
        const lean = st.lean + r.gauss() * 11;
        const party = lean + r.gauss() * 3 > -1 ? 'R' : 'D';
        const p = fedMember(s, 'ushouse', st.ab, i + 1, null, lean, party);
        o.cds.push({ lean: U.round(lean, 1), id: p.id });
        nat.fed.ushouse.push(p.id);
      }
      st.sc.forEach((c) => {
        const party = st.lean + r.gauss() * 6 > 0 ? 'R' : 'D';
        const p = fedMember(s, 'ussenate', st.ab, 0, c, st.lean, party);
        o.sen[c] = p.id;
        nat.fed.ussenate.push(p.id);
      });
      nat.other[st.ab] = o;
    });
    nat.president = extPol(s, 'R', null, 'President').id;
    s.pols[nat.president].title = 'President';
    s.pols[nat.president].terms.president = 2;
    nat.presTermsLeft = 0;
  }

  // ---------- Create everything ----------
  function create(s) {
    const ab = s.home.state;
    const st = GR.STATE[ab];
    const S = GR.geo.state(ab);
    s.pols = s.pols || {};
    s.seats = {};
    s.bodies = {};
    const cityPop = GR.geo.cityPop(S, s.home.city);
    s.city = {
      name: s.home.cityName, pop: cityPop,
      nCouncil: cityPop >= 1e6 ? 15 : cityPop >= 3e5 ? 11 : cityPop >= 1e5 ? 9 : cityPop >= 25e3 ? 7 : 5,
      nSchool: cityPop >= 1e5 ? 9 : cityPop >= 2e4 ? 7 : 5,
      mayorYear: U.hash(s.home.cityName + ab) % 2 ? 2027 : 2029,
    };
    setupNation(s);

    makeSeat(s, 'pres', 'president', 0);
    s.seats.pres.holder = s.nat.president;
    s.pols[s.nat.president].seat = 'pres';
    for (let i = 1; i <= s.city.nSchool; i++) makeSeat(s, 'school-' + i, 'school', i);
    for (let i = 1; i <= s.city.nCouncil; i++) makeSeat(s, 'council-' + i, 'council', i);
    makeSeat(s, 'mayor', 'mayor', 0);
    for (let i = 1; i <= st.lo; i++) makeSeat(s, 'house-' + i, 'statehouse', i);
    for (let i = 1; i <= st.up; i++) makeSeat(s, 'senate-' + i, 'statesenate', i);
    for (let i = 1; i <= Math.max(1, st.cd); i++) makeSeat(s, 'cd-' + i, 'ushouse', i);
    if (st.gov !== 'none') makeSeat(s, 'gov', 'governor', 0);
    st.sc.forEach((c) => makeSeat(s, 'sen-' + c, 'ussenate', 0, { cls: c }));

    const lvl = (off) => GR.OFFICES[off].level;
    Object.values(s.seats).forEach((seat) => {
      if (seat.off === 'president') return;
      fillSeat(s, seat, lvl(seat.off));
      seat.next = nextElection(s, seat, U.yearOf(s.week));
    });
    s.seats.pres.next = 2028;

    ['school', 'council', 'house', 'senate', 'ushouse', 'ussenate'].forEach((b) => {
      if (!bodySeats(s, b).length && b !== 'ushouse' && b !== 'ussenate') return;
      s.bodies[b] = { k: b, lead: {}, comm: {}, docket: [] };
      setupLeadership(s, b);
      setupCommittees(s, b);
    });

    // Governments.
    const cityParts = (S.cityZips[s.home.city] || []).map((i) => [i, 1]);
    const cityPr = GR.geo.profile(S, cityParts.length ? cityParts : [[S.zipIdx[s.home.zip], 1]], 'city' + s.home.city);
    const statePr = GR.geo.profile(S, S.Z.map((z) => [z.i, 1]), 'state' + ab);
    s.jur = {
      school: makeJur(s, 'school', s.home.cityName + ' Public Schools', cityPop, cityPr, cityPr.lean, 'school' + s.home.city),
      city: makeJur(s, 'city', s.home.cityName, cityPop, cityPr, cityPr.lean, 'city' + s.home.city),
      state: makeJur(s, 'state', st.name, st.pop * 1e6, statePr, st.lean, 'state' + ab),
      nation: makeJur(s, 'nation', 'United States', 340e6, nationProfile(), 0, 'nation'),
    };
    // Executives.
    s.jur.city.exec = 'mayor';
    s.jur.state.exec = st.gov === 'none' ? null : 'gov';
    s.jur.nation.exec = 'pres';
  }

  return {
    CAUCUSES, TRAITS, METRICS, isFiscal, stance, axes, ideoLabel, caucusOf, newPol, fullName, ageOf,
    seatTitle, seatParts, seatProfile, nationProfile, clearMemo, homeSeats, nextElection, termYears, makeSeat, fillSeat, pickZipIn,
    bodySeats, composition, majority, members, setupLeadership, setupCommittees, extPol, extMember, offOfBody, create,
    totals, initialLaw, makeJur, fedMember,
  };
})();
