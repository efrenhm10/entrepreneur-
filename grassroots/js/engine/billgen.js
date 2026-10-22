// The policy deck. AI legislation is dealt like cards: an ideological FACTION, a real AGENCY
// or program, a mechanical TOOL (tax, spend, regulate, privatize, mandate...) and a TARGET
// (the jurisdiction's crises). Each card turns into exact fiscal provisions, so no two dockets
// look alike and every bill moves the budget and the economy.
var GR = globalThis.GR || (globalThis.GR = {});

GR.billgen = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const FX = () => GR.fisc;

  const FACTIONS = {
    progressive: { name: 'Progressive', party: 'D', tools: { invest: 3, staff: 2, taxrich: 3, regulate: 2, carbon: 2, expand: 3, pricecap: 2, prevwage: 2 } },
    liberal: { name: 'Liberal', party: 'D', tools: { invest: 3, staff: 2, credits: 3, regulate: 1, carbon: 1, expand: 2, taxrich: 1, earmarks: 1 } },
    centrist: { name: 'Centrist', party: null, tools: { p3: 3, reform: 3, credits: 2, invest: 2, pension: 2, earmarks: 2, taxcut: 1 } },
    conservative: { name: 'Conservative', party: 'R', tools: { taxcut: 3, cut: 3, restrict: 3, reform: 2, safety: 3, deregulate: 2, blockgrant: 1, earmarks: 1 } },
    libertarian: { name: 'Libertarian', party: 'R', tools: { privatize: 3, deregulate: 3, taxcut: 3, sunset: 2, cut: 2, restrict: 1, blockgrant: 2 } },
    populist: { name: 'Populist', party: null, tools: { buydomestic: 3, invest: 2, pricecap: 2, corptax: 2, protect: 3, safety: 1, earmarks: 2 } },
  };

  // Which faction a politician belongs to.
  function factionOf(p) {
    const ax = W().axes(p);
    const v = (ax.fis + ax.soc) / 2;
    const cau = p.caucus || W().caucusOf(p).k;
    const r = U.seeded('fac' + p.id)();
    if (p.party === 'D') {
      if (cau === 'prog' || v < -1.3) return r < 0.2 ? 'populist' : 'progressive';
      if (cau === 'bluedog') return r < 0.35 ? 'populist' : 'centrist';
      return r < 0.3 ? 'centrist' : 'liberal';
    }
    if (cau === 'freedom' || v > 1.45) return r < 0.45 ? 'libertarian' : 'populist';
    if (cau === 'mainst') return r < 0.5 ? 'centrist' : 'conservative';
    return r < 0.2 ? 'populist' : r < 0.35 ? 'libertarian' : 'conservative';
  }

  const pick = U.pick;
  const pct = (lo, hi) => lo + U.rand() * (hi - lo);
  const rnd = (v) => Math.round(v);
  const stShort = (s, J) => (J.k === 'state' ? GR.STATE[s.home.state].name : J.k === 'nation' ? 'American' : J.name);
  const NOUN = { housing: 'Housing Affordability', infra: 'Infrastructure', migration: 'Talent Retention', education: 'Student Achievement', health: 'Health Access', opioid: 'Opioid Response', crime: 'Public Safety', pension: 'Pension Solvency', disaster: 'Disaster Resilience', water: 'Water Security', homeless: 'Homelessness', energy: 'Economic Diversification', poverty: 'Economic Mobility', debt: 'Debt Reduction', ssTrust: 'Social Security Solvency', medicareTrust: 'Medicare Solvency', healthcosts: 'Lower Health Costs', border: 'Border Security', readiness: 'Military Readiness', veterans: 'Veterans Care' };

  // ---------- Tools ----------
  // Each returns { prov, title, blurb } or null. ctx: { s, J, F, fac, spon, crisis, ag, size }
  const TOOLS = {
    invest: { name: 'Capital investment', make(c) {
      const a = c.ag; if (!a || !a.capex) return null;
      const f = pct(0.08, c.fac === 'progressive' ? 0.3 : 0.2);
      const prov = { ap: { [a.k]: { capex: rnd(a.capex * f) } } };
      payFor(c, prov, a.capex * f);
      return { prov, title: pick([`${a.abbr} ${NOUN[c.crisis] || 'Capital'} Investment Act`, `${stShort(c.s, c.J)} ${NOUN[c.crisis] || 'Infrastructure'} Bond & Investment Act`, `Rebuild ${a.abbr} Act`, `${a.abbr} Modernization & Repair Act`]) };
    } },
    staff: { name: 'Staffing & operations', make(c) {
      const a = c.ag; if (!a) return null;
      const f = pct(0.04, 0.12);
      const prov = { ap: { [a.k]: { opex: rnd(a.opex * f) } } };
      payFor(c, prov, a.opex * f);
      return { prov, title: pick([`${a.abbr} Workforce & Service Restoration Act`, `Fully Staff ${a.abbr} Act`, `${a.abbr} Front-Line Workers Pay Act`]) };
    } },
    cut: { name: 'Spending restraint', make(c) {
      const a = c.ag; if (!a) return null;
      const f = pct(0.04, c.fac === 'libertarian' ? 0.15 : 0.09);
      return { prov: { ap: { [a.k]: { opex: -rnd(a.opex * f), capex: -rnd(a.capex * f * 0.5) } } }, title: pick([`${a.abbr} Spending Accountability Act`, `${a.abbr} Bureaucracy Reduction Act`, `Taxpayer Savings in ${a.abbr} Act`]) };
    } },
    privatize: { name: 'Privatization', make(c) {
      const a = c.ag; if (!a || ['police', 'corr', 'dod', 'dhs', 'doj'].includes(a.k) && U.chance(0.7)) return null;
      const share = pct(0.15, 0.4);
      const sale = rnd((a.capex0 + a.opex0) * share * pct(0.8, 2));
      const feeName = `${a.abbr} concession & user fees`;
      return { prov: { ap: { [a.k]: { opex: -rnd(a.opex * share * 0.8), capex: -rnd(a.capex * share) } }, sale: { [a.k]: sale }, eff: { [a.k]: rnd(pct(-4, 8)) }, fee: { [feeName]: rnd((a.opex + a.capex) * share * 0.12) } },
        title: pick([`${a.abbr} Privatization & Taxpayer Savings Act`, `${a.abbr} Asset Monetization Act`, `Competitive Contracting for ${a.abbr} Act`]) };
    } },
    p3: { name: 'Public-private partnership', make(c) {
      const a = c.ag; if (!a || !['infra', 'env', 'rnd', 'edu'].includes(a.cat)) return null;
      const amt = a.capex * pct(0.1, 0.25);
      return { prov: { ap: { [a.k]: { capex: rnd(amt) } }, fee: { [`${a.abbr} P3 tolls & availability payments`]: rnd(amt * pct(0.4, 0.8)) }, eff: { [a.k]: rnd(pct(1, 5)) } },
        title: pick([`${a.abbr} Public-Private Partnership Act`, `${a.abbr} Innovative Finance Act`, `Express Lanes & ${a.abbr} Partnership Act`]) };
    } },
    buydomestic: { name: 'Domestic-content mandate', make(c) {
      const a = c.ag; if (!a || !a.capex) return null;
      const prem = rnd(pct(4, 12));
      const metal = pick(['Steel', 'Iron & Steel', 'Manufactured Goods', 'Concrete & Steel']);
      return { prov: { prem: { [a.k]: prem }, ap: { [a.k]: { capex: rnd(a.capex * prem / 100 * pct(0.3, 0.8)) } }, reg: { manufacturing: -U.round(pct(0.2, 0.6), 1) } },
        title: pick([`Buy American ${metal} for ${a.abbr} Projects Act`, `Domestic ${metal} in ${a.abbr} Construction Act`, `${stShort(c.s, c.J)} Workers First Procurement Act`]) };
    } },
    prevwage: { name: 'Prevailing-wage mandate', make(c) {
      const a = c.ag; if (!a || !a.capex) return null;
      const prem = rnd(pct(5, 14));
      return { prov: { prem: { [a.k]: prem }, eff: { [a.k]: rnd(pct(0, 3)) }, reg: { construction: U.round(pct(0.3, 1), 1) } },
        title: pick([`${a.abbr} Prevailing Wage & Apprenticeship Act`, `Union Labor Standards for ${a.abbr} Projects Act`]) };
    } },
    reform: { name: 'Audit & management reform', make(c) {
      const a = c.ag; if (!a) return null;
      return { prov: { eff: { [a.k]: rnd(pct(3, 9)) }, ap: { [a.k]: { opex: -rnd(a.opex * pct(0.005, 0.03)) } } },
        title: pick([`${a.abbr} Performance & Accountability Act`, `${a.abbr} Inspector General Act`, `${a.abbr} Lean Government Act`]) };
    } },
    taxrich: { name: 'Progressive revenue', make(c) {
      const F = c.F; const prov = { tax: {} };
      if (F.tax.high != null) prov.tax.high = U.round(pct(0.5, 2.5), 1);
      if (F.tax.capg != null && U.chance(0.5)) prov.tax.capg = U.round(pct(1, 4), 1);
      if (F.tax.corp != null && U.chance(0.4)) prov.tax.corp = U.round(pct(0.5, 2), 1);
      if (!Object.keys(prov.tax).length) { if (F.tax.prop != null) prov.tax.prop = U.round(pct(0.5, 2), 1); else return null; }
      if (c.ag) prov.ap = { [c.ag.k]: { opex: rnd(c.ag.opex * pct(0.03, 0.08)), capex: rnd(c.ag.capex * pct(0.05, 0.15)) } };
      return { prov, title: pick([`Millionaires' Fair Share for ${NOUN[c.crisis] || 'Families'} Act`, `${NOUN[c.crisis] || 'Opportunity'} Trust Fund Act`, 'Tax Fairness & Investment Act']) };
    } },
    corptax: { name: 'Corporate surtax', make(c) {
      const F = c.F; if (F.tax.corp == null) return null;
      const prov = { tax: { corp: U.round(pct(1, 3), 1) } };
      if (F.ent.ss) prov.ent = { ss: { benefit: F.ent.ss.p.benefit + 2 } };
      else if (c.ag) prov.ap = { [c.ag.k]: { capex: rnd(c.ag.capex * pct(0.05, 0.12)) } };
      return { prov, title: pick(['Make Big Corporations Pay Act', 'Stock Buyback Accountability Act', 'Corporate Windfall Surtax Act']) };
    } },
    credits: { name: 'Targeted tax credits', make(c) {
      const F = c.F; const prov = { tax: {}, ent: {} };
      if (F.ent.eitc) prov.ent.eitc = { pct: Math.min(100, F.ent.eitc.p.pct + rnd(pct(5, 15))) };
      if (F.ent.ctc) prov.ent.ctc = { amount: F.ent.ctc.p.amount + 100 * rnd(pct(2, 8)) };
      if (F.tax.low != null && F.tax.low > 0.5) prov.tax.low = -U.round(pct(0.3, 1), 1);
      if (!Object.keys(prov.ent).length && !Object.keys(prov.tax).length) return null;
      return { prov, title: pick(['Working Families Tax Credit Act', 'Child & Family Tax Relief Act', 'Cost of Living Relief Act']) };
    } },
    taxcut: { name: 'Tax cuts', make(c) {
      const F = c.F; const prov = { tax: {} };
      const keys = FX().LEVEL_TAXES[F.lvl].filter((k) => F.tax[k] > 0.4 && k !== 'carbon' && k !== 'sev');
      const n = c.fac === 'libertarian' ? 3 : 2;
      U.shuffle(keys).slice(0, n).forEach((k) => { const T = FX().TAXES[k]; prov.tax[k] = -U.round(Math.min(F.tax[k] * pct(0.05, 0.18), T.unit === 'mills' ? 2 : 2.5), 1); });
      if (!Object.keys(prov.tax).length) return null;
      if (c.fac !== 'libertarian' && c.ag && U.chance(0.5)) prov.ap = { [c.ag.k]: { opex: -rnd(c.ag.opex * pct(0.02, 0.05)) } };
      return { prov, title: pick(['Taxpayer Relief Act', 'Paycheck Protection Act', 'Jobs & Competitiveness Act', 'Flat & Fair Tax Act', 'Keep More of What You Earn Act']) };
    } },
    regulate: { name: 'New regulation', make(c) {
      const ind = pickInd(c);
      const d = U.round(pct(0.4, 1.6), 1);
      const prov = { reg: { [ind.k]: d } };
      if (c.ag && c.ag.cat === 'env') prov.ap = { [c.ag.k]: { opex: rnd(c.ag.opex * pct(0.03, 0.08)) } };
      return { prov, title: pick([`${ind.name} Accountability & Safety Act`, `${ind.name} Consumer Protection Act`, `${ind.name} Worker & Community Safeguards Act`]) };
    } },
    deregulate: { name: 'Deregulation', make(c) {
      const ind = pickInd(c);
      return { prov: { reg: { [ind.k]: -U.round(pct(0.3, 1.2), 1) } }, title: pick([`${ind.name} Regulatory Relief Act`, `Red Tape Reduction for ${ind.name} Act`, `${ind.name} Permitting Reform Act`]) };
    } },
    carbon: { name: 'Carbon pricing', make(c) {
      const F = c.F; if (F.tax.carbon == null) return null;
      const env = F.ag.find((a) => a.cat === 'env');
      const price = rnd(pct(10, 40));
      const prov = { tax: { carbon: price } };
      if (env) prov.ap = { [env.k]: { capex: rnd(env.capex * pct(0.1, 0.3)) } };
      if (F.ent.eitc) prov.ent = { eitc: { pct: Math.min(100, F.ent.eitc.p.pct + 5) } };
      return { prov, title: pick(['Cap-and-Invest Act', 'Clean Air & Climate Dividend Act', 'Carbon Pollution Pricing Act']) };
    } },
    expand: { name: 'Expand a program', make(c) { return entMove(c, 1); } },
    restrict: { name: 'Tighten a program', make(c) { return entMove(c, -1); } },
    protect: { name: 'Protect benefits', make(c) {
      const F = c.F;
      if (F.ent.ss) return { prov: { ent: { ss: { cola: U.round(F.ent.ss.p.cola + pct(0.2, 0.8), 1) } }, tax: { payroll: U.round(pct(0.2, 0.6), 1) } }, title: pick(['Protect Seniors\' Earned Benefits Act', 'Social Security Cost-of-Living Fairness Act']) };
      if (F.ent.medicaid) return { prov: { ent: { medicaid: { copay: Math.max(0, F.ent.medicaid.p.copay - 2) } } }, title: 'No Hidden Fees in Health Care Act' };
      return null;
    } },
    pricecap: { name: 'Price caps', make(c) {
      const J = c.J;
      if (J.law.rent != null && (c.crisis === 'housing' || c.crisis === 'homeless' || U.chance(0.5)) && J.law.rent > 0) return { prov: { policy: [{ k: 'rent', to: Math.max(0, J.law.rent - 1) }], reg: { construction: U.round(pct(0.3, 0.8), 1) } }, title: pick(['Rent Stabilization for High-Cost Housing Zones Act', 'Tenant Protection & Rent Cap Act', 'Rent Gouging Prevention Act']) };
      if (J.law.drugprices != null && J.law.drugprices > 0) return { prov: { policy: [{ k: 'drugprices', to: J.law.drugprices - 1 }], reg: { healthcare: U.round(pct(0.3, 1), 1) }, ent: c.F.ent.medicare ? { medicare: { partd: Math.max(0, c.F.ent.medicare.p.partd - 300) } } : {} }, title: pick(['Prescription Drug Price Cap Act', 'Insulin & Medicine Affordability Act']) };
      return null;
    } },
    safety: { name: 'Law & order funding', make(c) {
      const a = c.F.ag.find((x) => ['police', 'dhs', 'doj', 'corr'].includes(x.k));
      if (!a) return null;
      return { prov: { ap: { [a.k]: { opex: rnd(a.opex * pct(0.05, 0.12)), capex: rnd(a.capex * pct(0.05, 0.2)) } } }, title: pick([`Back the Blue: ${a.abbr} Funding Act`, `${a.abbr} Enforcement Surge Act`, 'Safe Communities Act']) };
    } },
    blockgrant: { name: 'Block grant / devolution', make(c) {
      const F = c.F;
      const e = F.ent.medicaid || F.ent.snap;
      if (!e) return null;
      const k = F.ent.medicaid ? 'medicaid' : 'snap';
      return { prov: { ent: { [k]: { benefit: Math.max(70, (e.p.benefit || 100) - rnd(pct(4, 10))) } }, eff: c.ag ? { [c.ag.k]: rnd(pct(1, 4)) } : {} }, title: pick([`${k === 'medicaid' ? 'Medicaid' : 'SNAP'} Block Grant Flexibility Act`, 'State Flexibility & Innovation Act']) };
    } },
    sunset: { name: 'Sunset & consolidate', make(c) {
      const a = c.ag; if (!a) return null;
      return { prov: { ap: { [a.k]: { opex: -rnd(a.opex * pct(0.08, 0.2)) } }, eff: { [a.k]: rnd(pct(-3, 6)) } }, title: pick([`${a.abbr} Sunset Review Act`, `${a.abbr} Consolidation & Streamlining Act`, `Eliminate Duplicative Programs at ${a.abbr} Act`]) };
    } },
    pension: { name: 'Pension reform', make(c) {
      const e = c.F.ent.pension; if (!e) return null;
      const up = c.fac === 'libertarian' ? -5 : rnd(pct(5, 20));
      return { prov: { ent: { pension: { pct: U.clamp(e.p.pct + up, 40, 150) } }, ap: c.fac === 'centrist' ? { gen: { opex: -rnd((c.F.ag.find((a) => a.k === 'gen') || { opex: 0 }).opex * 0.02) } } : {} },
        title: c.fac === 'libertarian' ? 'Defined-Contribution Transition Act' : pick(['Pension Funding Ramp Act', 'Actuarial Integrity Act', 'Retirement System Stabilization Act']) };
    } },
    earmarks: { name: 'Earmark package', make(c) {
      const pool = W().members(c.s, c.body).filter((m) => m.party === c.spon.party);
      const n = U.randInt(3, 8);
      const per = c.size * (c.J.k === 'nation' ? 0.0000035 : 0.00015);
      const ear = U.shuffle(pool).slice(0, n).map((m) => { const ag = c.ag || c.F.ag[0]; return { who: m.id, ag: ag.k, amt: rnd(per * pct(0.6, 1.6)), proj: GR.legis.earmarkName ? GR.legis.earmarkName(c.s, m, ag) : 'Local project' }; });
      return { prov: { ear }, title: pick([`${stShort(c.s, c.J)} Community Projects Act`, 'Hometown Investment Act', `${NOUN[c.crisis] || 'Local'} Projects Appropriations Act`]) };
    } },
  };

  function pickInd(c) {
    const st = GR.STATE_IND[c.s.home.state] || [];
    const pool = GR.INDUSTRIES.filter((x) => st.includes(x.k) || c.J.k === 'nation' || U.chance(0.2));
    return pick(pool.length ? pool : GR.INDUSTRIES);
  }

  // Move an entitlement tied to the target crisis (dir +1 expand, -1 tighten).
  function entMove(c, dir) {
    const F = c.F;
    const T = GR.CRISIS_TYPES[c.crisis] || {};
    const cand = (T.ent || []).filter(([ek]) => F.ent[ek]).concat(Object.keys(F.ent).map((ek) => [ek, null, 1, 1]));
    for (const [ek, pk0, , pdir] of cand) {
      const def = (FX().ENTS[F.lvl] || []).find((x) => x.k === ek);
      if (!def || !def.params.length || ek === 'pension') continue;
      const pd = pk0 ? def.params.find((x) => x[0] === pk0) : pick(def.params);
      if (!pd) continue;
      const pk = pd[0];
      const cur = F.ent[ek].p[pk];
      const costUp = pdir === -1 || ['copay', 'fra', 'age', 'prem', 'work'].includes(pk) ? -1 : 1;
      const step = Math.max(pd[5], Math.abs(cur) * pct(0.06, 0.18));
      const to = U.clamp(U.round(cur + dir * costUp * step, pd[5] < 1 ? 1 : 0), pd[3], pd[4]);
      if (to === cur) continue;
      const verb = dir > 0 ? pick(['Expansion', 'Access', 'Modernization']) : pick(['Accountability', 'Integrity', 'Work & Responsibility']);
      return { prov: { ent: { [ek]: { [pk]: to } } }, title: `${def.name.replace(/\s*\(.*\)/, '')} ${verb} Act` };
    }
    return null;
  }

  // Liberal and progressive spending gets paid for some of the time.
  function payFor(c, prov, amt) {
    const F = c.F;
    if (!['progressive', 'liberal', 'centrist'].includes(c.fac) || !U.chance(0.45)) return;
    const k = F.tax.high != null && F.tax.high > 0 ? 'high' : F.tax.corp != null ? 'corp' : F.tax.prop != null ? 'prop' : null;
    if (!k) return;
    const per = (FX().revenue(c.J)[k] || { amt: 1 }).amt / Math.max(0.5, F.tax[k]);
    prov.tax = prov.tax || {};
    prov.tax[k] = U.round(U.clamp(amt / Math.max(1, per), 0.1, 2.5), 1);
  }

  // Deal one bill for a jurisdiction.
  function deal(s, jur, opts = {}) {
    const J = s.jur[jur];
    const F = J.F;
    const bs = GR.gov.bodiesOf(s, jur);
    const body = opts.body || pick(bs);
    const maj = W().majority(s, body);
    const party = U.chance(0.7) ? maj : GR.other(maj);
    const spon = opts.spon || pick(W().members(s, body).filter((m) => m.party === party && !m.isPlayer));
    if (!spon) return null;
    const fac = opts.fac || factionOf(spon);
    const crises = Object.entries(F.crises).sort((a, b) => b[1].s - a[1].s);
    const crisis = opts.crisis || (crises.length ? U.weighted(crises.slice(0, 6), (x) => x[1].s * x[1].s)[0] : null);
    const links = crisis ? (GR.CRISIS_TYPES[crisis].ag || []).map((x) => F.ag.find((a) => a.k === x[0])).filter(Boolean) : [];
    const size = FX().totals(J).spend;
    for (let tries = 0; tries < 6; tries++) {
      const toolK = opts.tool || U.weighted(Object.keys(FACTIONS[fac].tools), (k) => FACTIONS[fac].tools[k]);
      const ag = opts.ag ? F.ag.find((a) => a.k === opts.ag) : (links.length && U.chance(0.75) ? pick(links) : pick(F.ag));
      const out = TOOLS[toolK].make({ s, J, F, fac, spon, crisis, ag, size, body });
      if (!out) { if (opts.tool) return null; continue; }
      const prov = Object.assign(GR.legis.emptyProv(), out.prov);
      ['tax', 'reg', 'ap', 'ent', 'emerg', 'eff', 'prem', 'sale', 'fee'].forEach((k) => { prov[k] = prov[k] || {}; });
      prov.ear = prov.ear || []; prov.policy = prov.policy || [];
      if (opts.earmark !== false && U.chance(0.25) && toolK !== 'earmarks') {
        const who = pick(W().members(s, body).filter((m) => m.party === spon.party)) || spon;
        const a2 = ag || F.ag[0];
        prov.ear.push({ who: who.id, ag: a2.k, amt: rnd(size * (jur === 'nation' ? 0.000004 : 0.00012) * pct(0.5, 1.5)), proj: GR.legis.earmarkName(s, who, a2) });
      }
      const title = unique(s, J, out.title);
      return { title, prov, spon, fac, tool: toolK, crisis, body };
    }
    return null;
  }

  // Never repeat a title that is pending or was recently enacted.
  function unique(s, J, title) {
    const used = new Set((J.bills || []).map((b) => b.title).concat(J.laws.slice(0, 40).map((l) => l.t.split(':')[0])));
    if (!used.has(title)) return title;
    const y = U.yearOf(s.week);
    for (const suf of [` of ${y}`, ' II', ' III', ` (Amended ${y})`]) if (!used.has(title + suf)) return title + suf;
    return `${title} No. ${U.randInt(2, 99)}`;
  }

  return { FACTIONS, TOOLS, factionOf, deal, unique };
})();
