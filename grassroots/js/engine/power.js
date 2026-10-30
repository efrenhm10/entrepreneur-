// Power bases: the people who can make or break you once you hold office.
// Each office answers to a different mix. Generic bases (your party, primary voters, donors,
// business, labor, the press...) are joined by the power players unique to your state or city
// from the regional dossiers: Texas oil and gas, Michigan's UAW, Utah's LDS Church, the Culinary
// Union in Las Vegas. Loyalty drifts toward a target set by conditions in your jurisdiction,
// your positions, your record and your party; decisions and events shock it. Loyal bases raise
// approval, money and political capital; hostile ones fund challengers, leak and organize recalls.
var GR = globalThis.GR || (globalThis.GR = {});

GR.power = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const G = () => GR.gov;

  // prefs: lean (+ = friendlier to Republicans), taxes/reg (+ = want them low), growth, crime,
  // env, ind (their industry), cr (crises they watch), groups (interest groups whose views they share).
  const GENERIC = {
    party: { name: 'Your party', desc: 'Party committees, caucus leaders and fellow officeholders. They reward loyalty and punish defection.', prefs: {}, act: ['Keynote a party fundraiser', 3, 4] },
    base: { name: 'Primary voters & activists', desc: 'The most committed members of your party. Cross them and a primary challenger appears.', prefs: {}, act: ['Rally the base', 3, 3] },
    donors: { name: 'Major donors & PACs', desc: 'The money behind every campaign. They expect access.', prefs: { taxes: 0.6, growth: 0.5 }, act: ['Donor dinner', 3, 2] },
    business: { name: 'Business community', desc: 'The Chamber of Commerce, employers and developers. They want growth, low taxes and light regulation.', prefs: { lean: 0.5, taxes: 1, reg: 1, growth: 1, groups: ['chamber', 'smallbiz'] }, act: ['Chamber of Commerce roundtable', 3, 3] },
    labor: { name: 'Organized labor', desc: 'Unions and working families. Jobs, wages and the right to organize.', prefs: { lean: -0.6, growth: 0.6, groups: ['labor'] }, act: ['March with union members', 3, 3] },
    press: { name: 'Press & media', desc: 'Reporters, editorial boards and influencers. They reward transparency and punish scandal.', prefs: {}, act: ['Editorial board interviews', 2, 2] },
    local: { name: 'Mayors & county officials', desc: 'Local leaders who deliver their communities and lobby for state money.', prefs: { cr: ['infra'] }, act: ['Tour with local officials', 4, 2] },
    neighborhoods: { name: 'Neighborhood associations', desc: 'Homeowners and block clubs. Potholes, parking and what gets built next door.', prefs: { cr: ['crime', 'infra'] }, act: ['Community meetings in every ward', 4, 2] },
    police: { name: 'Police & public safety unions', desc: 'Officers, sheriffs and firefighters.', prefs: { lean: 0.6, crime: 1, groups: ['police'] }, act: ['Ride-along and roll call visit', 2, 2] },
    teachers: { name: 'Teachers & school staff', desc: 'The teachers union and school employees.', prefs: { lean: -0.6, cr: ['education'], groups: ['teachers'] }, act: ['Visit classrooms with the union', 3, 2] },
    parents: { name: 'Parent groups', desc: 'PTAs and parents\' rights groups who pack board meetings.', prefs: { cr: ['education'], groups: ['parents'] }, act: ['Parent town hall', 3, 2] },
    taxpayers: { name: 'Taxpayer groups', desc: 'Anti-tax activists and fiscal hawks.', prefs: { lean: 0.7, taxes: 1.5, groups: ['taxpayers'] }, act: ['Sign a taxpayer pledge', 1, 3] },
    environment: { name: 'Environmental groups', desc: 'Conservation voters and climate activists.', prefs: { lean: -0.7, env: 1, cr: ['disaster', 'water'], groups: ['environment'] }, act: ['Tour a restoration project', 3, 2] },
    farm: { name: 'Farmers & rural voters', desc: 'The Farm Bureau, growers and small towns.', prefs: { lean: 0.6, ind: 'ag', groups: ['farm'] }, act: ['County fair & farm visits', 4, 2] },
    church: { name: 'Faith communities', desc: 'Churches, congregations and religious leaders.', prefs: { lean: 0.4, groups: ['life', 'parents'] }, act: ['Speak at a congregation', 2, 2] },
    seniors: { name: 'Seniors', desc: 'The most reliable voters. Social Security, Medicare and property taxes.', prefs: { lean: 0.2, groups: ['seniors'] }, act: ['Senior center visits', 3, 2] },
    military: { name: 'Military & veterans', desc: 'The Pentagon, the service chiefs and veterans\' groups.', prefs: { lean: 0.5, cr: ['readiness', 'veterans'], groups: ['veterans'] }, act: ['Visit troops at a base', 4, 3] },
  };
  // Which generic bases matter at each level, and how much.
  const LEVEL_SET = {
    school: { party: 0.5, base: 0.6, parents: 1.3, teachers: 1.3, taxpayers: 0.8, press: 0.8 },
    city: { party: 0.8, base: 0.7, business: 1.1, labor: 1, police: 1, neighborhoods: 1.2, press: 1, donors: 0.7, environment: 0.5 },
    state: { party: 1.1, base: 1, donors: 1, business: 1, labor: 0.9, press: 0.9, local: 0.9, police: 0.6, teachers: 0.8, environment: 0.6, farm: 0.6, church: 0.6 },
    nation: { party: 1.2, base: 1.1, donors: 1.1, business: 1, labor: 0.9, press: 1, police: 0.5, military: 0.9, environment: 0.6, farm: 0.6, church: 0.6, seniors: 0.9 },
  };

  function ctxJur(s) {
    const me = s.pols.me;
    if (!me.seat) return null;
    const off = GR.OFFICES[s.seats[me.seat].off];
    return off.jur;
  }
  function cityKey(s) {
    const k = `${s.home.cityName}|${s.home.state}`;
    return GR.CITY_ALIAS[k] || k;
  }
  const cityDossier = (s) => GR.CITY[cityKey(s)] || null;
  const stateDossier = (s) => GR.REGION[s.home.state] || null;

  // Build the set of power bases for the player's current office.
  function defs(s) {
    const jur = ctxJur(s);
    if (!jur) return [];
    const out = [];
    Object.entries(LEVEL_SET[jur]).forEach(([k, w]) => out.push(Object.assign({ k, w, generic: true }, GENERIC[k])));
    const add = (arr, w) => (arr || []).forEach(([k, name, desc, prefs]) => {
      const ex = out.find((x) => x.k === k);
      if (ex) { ex.name = name; ex.desc = desc; ex.prefs = Object.assign({}, ex.prefs, prefs); ex.w += 0.3; return; }
      out.push({ k, name, desc, prefs, w, act: [`Meet with ${name.split(' (')[0]}`, 3, 3] });
    });
    const off = GR.OFFICES[s.seats[s.pols.me.seat].off];
    if (jur === 'state' || (jur === 'nation' && off.k !== 'president')) add((stateDossier(s) || {}).powers, jur === 'state' ? 1.1 : 0.7);
    if (jur === 'city') add((cityDossier(s) || {}).powers, 1.1);
    return out;
  }

  // Keep the stored bases in sync with the current office.
  function ensure(s) {
    const ds = defs(s);
    s.power = s.power || {};
    const P = s.power;
    const key = s.pols.me.seat || 'none';
    if (P.seat !== key) {
      const old = P.l || {};
      P.seat = key;
      P.l = {};
      P.mod = P.mod || {};
      ds.forEach((d) => { P.l[d.k] = old[d.k] != null ? old[d.k] : U.clamp(target(s, d) + U.gauss() * 4, 15, 85); });
    }
    ds.forEach((d) => { if (P.l[d.k] == null) P.l[d.k] = U.clamp(target(s, d), 15, 85); });
    return ds;
  }

  function myJ(s) { const jur = ctxJur(s); return jur ? s.jur[jur] : null; }

  // Conditions that move each base.
  function target(s, d) {
    const me = s.pols.me;
    const J = myJ(s);
    if (!J) return 50;
    const F = J.F;
    const p = d.prefs || {};
    let t = 50;
    // Party affinity.
    if (p.lean) t += p.lean * (me.party === 'R' ? 1 : -1) * 12;
    // Economy.
    const g = F.mac.g, du = F.mac.u - F.mac.u0;
    if (p.growth) t += p.growth * U.clamp((g - 2) * 3, -10, 10) - p.growth * du * 3;
    if (p.taxes) {
      let dt = 0;
      Object.entries(F.tax).forEach(([k, v]) => { const T = GR.fisc.TAXES[k]; if (T && F.tax0[k] != null) dt += (v - F.tax0[k]) * (T.unit === '$/t' ? 0.05 : T.unit === 'mills' ? 0.5 : T.unit === '¢/gal' ? 0.1 : k === 'lodge' ? 0.3 : 1); });
      t -= p.taxes * U.clamp(dt * 2.5, -12, 12);
    }
    if (p.reg) t -= p.reg * U.clamp(U.sum(GR.INDUSTRIES, (x) => (F.reg[x.k] || 0) * x.share) * 8, -8, 10);
    const cdelta = (k) => (F.crises[k] ? F.crises[k].s - F.crises[k].s0 : 0);
    if (p.crime) t -= p.crime * U.clamp(cdelta('crime') * 0.5, -8, 8);
    if (p.env) t -= p.env * U.clamp((cdelta('disaster') + cdelta('water')) * 0.3 + (F.tax.carbon || 0) * -0.05, -10, 10);
    (p.cr || []).forEach((k) => { t -= U.clamp(cdelta(k) * 0.5, -8, 8); });
    if (p.ind && F.reg[p.ind]) t -= U.clamp(F.reg[p.ind] * 4, -6, 10);
    if (p.ind && J.dev) t += U.clamp(U.sum((J.dev.firms || []).filter((f) => f.sector === p.ind && f.open), (f) => f.jobs) / Math.max(1, laborK(J)) * 600, 0, 8);
    // Your own positions vs the groups this base shares views with.
    if (p.groups && p.groups.length) {
      let fit = 0, n = 0;
      p.groups.forEach((gk) => { const gr = GR.GROUP[gk]; if (!gr) return; Object.entries(gr.care).forEach(([k, dir]) => { fit += W().stance(me, k) * dir; n++; }); });
      if (n) t += U.clamp((fit / n) * 9, -14, 14);
    }
    // Special cases.
    if (d.k === 'party') t = 50 + (me.standing - 50) * 0.6 + ((me.respect || 20) - 40) * 0.15;
    if (d.k === 'base') { const a = W().axes(me); const pur = me.party === 'R' ? (a.fis + a.soc) / 2 : -(a.fis + a.soc) / 2; t = 46 + pur * 14 + (me.standing - 50) * 0.25; }
    if (d.k === 'press') { const cm = s.cabinet && s.cabinet.seat === me.seat && s.cabinet.posts['st:comms']; t = 52 - (me.scandal || 0) * 0.8 + U.clamp((me.integrity || 70) - 70, -40, 20) * 0.25 + (me.traits.includes('charismatic') ? 4 : 0) + (cm && !cm.acting ? (cm.comp - 3) * 2 : 0); }
    if (d.k === 'donors') t += ((s.power && s.power.l && s.power.l.business) || 50) * 0.2 - 10;
    if (d.k === 'local' || d.k === 'neighborhoods') t -= U.clamp(cdelta('infra') * 0.4, -6, 6);
    // Cabinet picks drawn from a base please it.
    if (s.cabinet && s.cabinet.posts) Object.values(s.cabinet.posts).forEach((c) => { if (c && c.base === d.k) t += 2; });
    return U.clamp(t, 3, 97);
  }
  const laborK = (J) => (J.pop || 1e6) * 0.5 / 1000;

  // Monthly: drift, and what loyalty buys you.
  function month(s) {
    const me = s.pols.me;
    if (!me.seat) return;
    const ds = ensure(s);
    const P = s.power;
    let wsum = 0, eff = 0;
    ds.forEach((d) => {
      const m = P.mod[d.k] || 0;
      P.l[d.k] = U.clamp(P.l[d.k] + (target(s, d) + m - P.l[d.k]) * 0.08, 0, 100);
      P.mod[d.k] = m * 0.9;
      wsum += d.w;
      eff += d.w * (P.l[d.k] - 50);
    });
    const avg = wsum ? eff / wsum : 0;
    me.app = U.clamp(me.app + avg * 0.012, 1, 99);
    // Donors and business raise money; your party hands out political capital.
    const off = GR.OFFICES[s.seats[me.seat].off];
    const scale = [0, 1500, 3000, 6000, 15000, 25000, 60000, 80000, 120000, 400000][off.level] || 5000;
    const d = P.l.donors != null ? P.l.donors : P.l.business != null ? P.l.business : 50;
    if (d > 40) me.warChest += Math.round(scale * (d - 40) / 30);
    if (P.l.party != null) me.pp += Math.round((P.l.party - 50) / 12);
    P.hist = P.hist || [];
    P.hist.push({ w: s.week, l: Object.assign({}, P.l) });
    if (P.hist.length > 24) P.hist.shift();
  }

  // A shock to one base (from decisions). Unknown bases are ignored.
  function shift(s, k, dv) {
    if (!s.pols.me.seat) return false;
    ensure(s);
    const P = s.power;
    if (P.l[k] == null) return false;
    P.l[k] = U.clamp(P.l[k] + dv, 0, 100);
    P.mod[k] = U.clamp((P.mod[k] || 0) + dv * 0.35, -15, 15);
    return true;
  }
  const get = (s, k) => (s.power && s.power.l && s.power.l[k] != null ? s.power.l[k] : null);

  // Courting a base costs hours and political capital, and can annoy its rivals.
  function court(s, k) {
    const ds = ensure(s);
    const d = ds.find((x) => x.k === k);
    if (!d) return { ok: false };
    const [label, h, pp] = d.act || ['Meet with them', 3, 3];
    const me = s.pols.me;
    if (s.hoursLeft < h) return { ok: false, msg: `Takes ${h} hours.` };
    if (me.pp < pp) return { ok: false, msg: `Costs ${pp} political points.` };
    s.hoursLeft -= h;
    me.pp -= pp;
    const gain = 4 + me.sk.charisma / 25 + (me.traits.includes('charismatic') ? 1.5 : 0);
    shift(s, k, gain);
    const lean = (d.prefs && d.prefs.lean) || 0;
    const hurt = [];
    if (Math.abs(lean) >= 0.5) ds.forEach((o) => { const ol = (o.prefs && o.prefs.lean) || 0; if (o.k !== k && ol * lean < -0.2 && Math.abs(ol) >= 0.5) { shift(s, o.k, -1.5); hurt.push(o.name); } });
    return { ok: true, msg: `${label}: ${d.name} +${Math.round(gain)}.${hurt.length ? ' ' + hurt.slice(0, 2).join(' and ') + ' noticed.' : ''}` };
  }

  function weakest(s) {
    const ds = ensure(s);
    return ds.slice().sort((a, b) => s.power.l[a.k] - s.power.l[b.k])[0];
  }

  return { GENERIC, LEVEL_SET, defs, ensure, target, month, shift, get, court, weakest, cityKey, cityDossier, stateDossier };
})();
