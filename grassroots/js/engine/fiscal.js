// Public finance and macroeconomics. Every government (school district, city, state, nation)
// carries a fiscal model J.F: agencies with operating and capital lines, tax brackets with
// behavioral responses, entitlement programs with eligibility and benefit parameters,
// debt and a dynamic credit rating, a quarterly macro model (output gap, potential growth
// from public capital stocks, inflation, interest rates, unemployment, confidence), and the
// Jurisdictional Crises & Needs Matrix.
var GR = globalThis.GR || (globalThis.GR = {});

GR.fisc = (function () {
  const U = GR.util;
  const B = 1e9, M = 1e6;

  // ---------- Taxes ----------
  // unit: pp (percentage points), $/t (carbon price), mills (property)
  const TAXES = {
    low: { name: 'Income tax: low bracket', unit: 'pp', sr: 1.0, eti: 0.05, lean: -0.4, min: 0, max: 30 },
    mid: { name: 'Income tax: middle bracket', unit: 'pp', sr: 0.7, eti: 0.1, lean: 0.1, min: 0, max: 45 },
    high: { name: 'Income tax: top bracket', unit: 'pp', sr: 0.3, eti: 0.35, lean: 1, min: 0, max: 70 },
    corp: { name: 'Corporate income tax', unit: 'pp', sr: 0.35, eti: 0.3, lean: 1, min: 0, max: 50 },
    capg: { name: 'Capital gains tax', unit: 'pp', sr: 0.15, eti: 0.8, lean: 1, min: 0, max: 45 },
    payroll: { name: 'Payroll tax (FICA)', unit: 'pp', sr: 0.8, eti: 0.05, lean: 0.4, min: 0, max: 25 },
    sales: { name: 'Sales tax', unit: 'pp', sr: 0.75, eti: 0.1, lean: -0.5, min: 0, max: 12 },
    prop: { name: 'Property tax', unit: 'mills', sr: 0.45, eti: 0.1, lean: 0, min: 0, max: 60 },
    carbon: { name: 'Carbon price (cap-and-trade)', unit: '$/t', sr: 0.5, eti: 0, lean: 1, min: 0, max: 250 },
    sev: { name: 'Severance tax (oil, gas, minerals)', unit: 'pp', sr: 0.3, eti: 0.1, lean: 0.6, min: 0, max: 25 },
  };
  const LEVEL_TAXES = {
    nation: ['low', 'mid', 'high', 'corp', 'capg', 'payroll', 'carbon'],
    state: ['low', 'mid', 'high', 'corp', 'sales', 'carbon', 'sev'],
    city: ['prop', 'sales'],
    school: ['prop'],
  };
  const LEAK = { nation: 1, state: 0.55, city: 0.35, school: 0.3 };

  // ---------- Entitlements ----------
  // Each program: params [key, label, unit, min, max, step], cost(F, p, ctx) relative to cost0, mult (spending multiplier).
  const ENTS = {
    nation: [
      { k: 'ss', name: 'Social Security', ag: 'ssa', c0: 1650 * B, mult: 0.9, people: 71e6, demo: 0.014,
        params: [['benefit', 'Benefit level (index)', '%', 70, 130, 1], ['cola', 'Annual COLA adjustment', 'pp', -3, 3, 0.1], ['fra', 'Full retirement age', 'yrs', 62, 72, 1], ['cap', 'Payroll tax cap', '$', 100000, 1000000, 5000]],
        p0: { benefit: 100, cola: 0, fra: 67, cap: 184500 },
        f: (p, F) => (p.benefit / 100) * (F.colaIdx || 1) * (1 - 0.065 * (p.fra - 67)) },
      { k: 'medicare', name: 'Medicare', ag: 'hhs', c0: 1050 * B, mult: 0.8, people: 68e6, demo: 0.018,
        params: [['age', 'Eligibility age', 'yrs', 60, 70, 1], ['partd', 'Part D out-of-pocket cap', '$', 0, 5000, 100], ['prem', 'Part B premium share', '%', 15, 40, 1], ['rate', 'Provider payment rates (index)', '%', 80, 120, 1]],
        p0: { age: 65, partd: 2100, prem: 25, rate: 100 },
        f: (p) => (1 - 0.05 * (p.age - 65)) * (1 + 0.04 * (2100 - p.partd) / 2100) * (1 - (p.prem - 25) * 0.012) * (p.rate / 100) },
      { k: 'medicaid', name: 'Medicaid & CHIP (federal share)', ag: 'hhs', c0: 640 * B, mult: 1.1, people: 79e6, demo: 0.006,
        params: [['fpl', 'Adult eligibility (% of poverty line)', '%', 0, 300, 5], ['copay', 'Co-pay per visit', '$', 0, 15, 1], ['benefit', 'Covered benefits (index)', '%', 70, 130, 1]],
        p0: { fpl: 138, copay: 0, benefit: 100 },
        f: (p, F) => Math.pow(Math.max(20, p.fpl) / 138, 0.7) * (1 - 0.012 * p.copay) * (p.benefit / 100) * (1 + 0.03 * (F.mac.u - 4.3)) },
      { k: 'snap', name: 'SNAP (food assistance)', ag: 'usda', c0: 100 * B, mult: 1.5, people: 42e6, demo: 0,
        params: [['fpl', 'Gross income limit (% of poverty line)', '%', 100, 200, 5], ['benefit', 'Maximum benefit (index)', '%', 60, 150, 1], ['work', 'Work requirement up to age', 'yrs', 49, 64, 1]],
        p0: { fpl: 130, benefit: 100, work: 54 },
        f: (p, F) => Math.pow(p.fpl / 130, 0.9) * (p.benefit / 100) * (1 + 0.08 * (F.mac.u - 4.3)) * (1 - 0.004 * (p.work - 54)) },
      { k: 'aca', name: 'ACA premium tax credits', ag: 'hhs', c0: 120 * B, mult: 0.8, people: 22e6, demo: 0.01,
        params: [['cap', 'Income cap (% of poverty line)', '%', 250, 800, 25], ['prem', 'Max premium (% of income)', '%', 0, 12, 0.5]],
        p0: { cap: 400, prem: 9.5 },
        f: (p) => Math.pow(p.cap / 400, 0.8) * Math.pow(9.5 / Math.max(1, p.prem), 0.5) },
      { k: 'ctc', name: 'Child Tax Credit & EITC (refundable)', ag: 'treas', c0: 125 * B, mult: 1.0, people: 60e6, demo: 0,
        params: [['amount', 'Credit per child', '$', 0, 5000, 100], ['refund', 'Refundable portion', '$', 0, 5000, 100]],
        p0: { amount: 2200, refund: 1700 },
        f: (p) => 0.55 * p.amount / 2200 + 0.45 * p.refund / 1700 },
      { k: 'ui', name: 'Unemployment insurance', ag: 'dol', c0: 52 * B, mult: 1.6, people: 2e6, demo: 0,
        params: [['weeks', 'Weeks of benefits', 'wks', 12, 52, 1], ['repl', 'Wage replacement rate', '%', 30, 75, 1]],
        p0: { weeks: 26, repl: 45 },
        f: (p, F) => Math.pow(Math.max(1.5, F.mac.u) / 4.3, 1.6) * (p.weeks / 26) * (p.repl / 45) },
      { k: 'vets', name: 'Veterans disability & pensions', ag: 'va', c0: 195 * B, mult: 0.9, people: 6e6, demo: 0.01,
        params: [['benefit', 'Benefit level (index)', '%', 80, 130, 1]], p0: { benefit: 100 }, f: (p) => p.benefit / 100 },
      { k: 'other', name: 'Federal retirement & other mandatory', ag: 'treas', c0: 310 * B, mult: 0.7, people: 0, demo: 0.005, params: [], p0: {}, f: () => 1 },
    ],
    state: [
      { k: 'medicaid', name: 'Medicaid', ag: 'mcd', mult: 1.1, demo: 0.008,
        params: [['fpl', 'Adult eligibility (% of poverty line)', '%', 0, 300, 5], ['copay', 'Co-pay per visit', '$', 0, 10, 1], ['benefit', 'Optional benefits (index)', '%', 70, 130, 1]],
        f: (p, F) => Math.pow(Math.max(15, p.fpl) / Math.max(15, F.ent.medicaid.p0.fpl), 0.45) * (1 - 0.012 * p.copay) * (p.benefit / 100) * (1 + 0.03 * (F.mac.u - F.mac.u0)) },
      { k: 'tanf', name: 'Cash assistance', ag: 'hs', mult: 1.5, demo: 0,
        params: [['benefit', 'Max monthly benefit (family of 3)', '$', 0, 2000, 10], ['limit', 'Lifetime limit', 'mo', 12, 60, 6]],
        f: (p, F) => (p.benefit / Math.max(1, F.ent.tanf.p0.benefit)) * Math.pow(p.limit / 60, 0.3) * (1 + 0.1 * (F.mac.u - F.mac.u0)) },
      { k: 'eitc', name: 'State earned income tax credit', ag: 'gen', mult: 1.2, demo: 0,
        params: [['pct', 'Share of federal EITC', '%', 0, 100, 1]], f: (p, F) => p.pct / Math.max(1, F.ent.eitc.p0.pct || 1) },
      { k: 'childcare', name: 'Child care assistance', ag: 'hs', mult: 1.1, demo: 0,
        params: [['smi', 'Eligibility (% of state median income)', '%', 40, 150, 5]], f: (p) => Math.pow(p.smi / 85, 1.2) },
      { k: 'snap', name: 'SNAP broad-based eligibility', ag: 'hs', mult: 1.5, demo: 0,
        params: [['fpl', 'Gross income limit (% of poverty line)', '%', 100, 200, 5]], f: (p) => Math.pow(p.fpl / 130, 0.5) },
      { k: 'htf', name: 'Housing trust fund', ag: 'hs', mult: 1.0, demo: 0,
        params: [['amt', 'Annual appropriation', '$M', 0, 5000, 10]], f: (p, F) => p.amt * M / Math.max(1, F.ent.htf.c0) },
      { k: 'pension', name: 'Pension contributions', ag: 'gen', mult: 0.3, demo: 0.01,
        params: [['pct', 'Share of actuarial contribution paid', '%', 40, 150, 5]], f: (p) => p.pct / 100 },
    ],
    city: [
      { k: 'vouchers', name: 'Housing vouchers', ag: 'housing', mult: 1.1, demo: 0,
        params: [['ami', 'Eligibility (% of area median income)', '%', 30, 100, 5]], f: (p) => Math.pow(p.ami / 50, 1.3) },
      { k: 'fare', name: 'Transit fare subsidy', ag: 'transit', mult: 0.8, demo: 0,
        params: [['fare', 'Fare level (100 = full fare)', '%', 0, 150, 5]], f: (p) => Math.max(0.05, (150 - p.fare) / 50) },
      { k: 'pension', name: 'Pension contributions', ag: 'admin', mult: 0.3, demo: 0.01,
        params: [['pct', 'Share of actuarial contribution paid', '%', 40, 150, 5]], f: (p) => p.pct / 100 },
    ],
    school: [
      { k: 'meals', name: 'Free school meals', ag: 'food', mult: 1.3, demo: 0,
        params: [['fpl', 'Eligibility (% of poverty line)', '%', 130, 400, 5]], f: (p) => Math.pow(p.fpl / 185, 0.8) },
      { k: 'classsize', name: 'Class-size cap staffing', ag: 'instr', mult: 0.9, demo: 0,
        params: [['cap', 'Maximum class size', 'kids', 15, 35, 1]], f: (p) => Math.pow(24 / p.cap, 2) },
    ],
  };

  // ---------- Credit ratings ----------
  const LADDER = [[95, 'AAA', 0], [88, 'AA+', 0.12], [82, 'AA', 0.22], [76, 'AA-', 0.35], [70, 'A+', 0.5], [64, 'A', 0.65], [58, 'A-', 0.85], [52, 'BBB+', 1.1], [46, 'BBB', 1.4], [40, 'BBB-', 1.8], [33, 'BB', 2.8], [25, 'B', 4.5], [15, 'CCC', 8], [0, 'D', 15]];
  const ratingOf = (score) => LADDER.find((x) => score >= x[0]) || LADDER[LADDER.length - 1];

  // ---------- Build ----------
  function seedR(J, k) { return U.seeded('fisc' + J.k + J.name + k); }

  function init(s, J) {
    const lvl = J.k;
    const ab = s.home.state;
    const st = GR.STATE[ab];
    const r = seedR(J, 'init');
    const col = st ? st.col : 100;
    const lean = J.lean || 0;
    const inc = J.met0 ? J.met0.income / 1000 : 75;
    const F = { lvl, q: 0, ag: [], tax: {}, tax0: {}, base: {}, reg: {}, ent: {}, ear: [], hist: [], crises: {}, P: 1, popIdx: 1, colaIdx: 1, shutdown: 0, audits: {} };
    J.F = F;
    GR.INDUSTRIES.forEach((x) => { F.reg[x.k] = 0; });
    // Economy.
    let gdp, pop = J.pop;
    if (lvl === 'nation') gdp = 33.0e12;
    else gdp = pop * 97000 * Math.pow(Math.max(40, inc) / 80, 1.0) * Math.pow(col / 100, 0.3);
    F.mac = { gdp, gdp0: gdp, real: 100, g: 2.0, pot: 1.9, gap: 0, gapPrev: 0, u: J.met0 ? J.met0.unemp : 4.3, pi: 2.6, cc: 96, i: 3.6, y10: 4.3, effRate: 3.4, K: { infra: 100, rd: 100, hum: 100 }, pipe: [] };
    F.mac.u0 = F.mac.u;
    if (lvl === 'nation') {
      GR.FED_AGENCIES.forEach((a) => F.ag.push(mkAg(J, a.k, a.abbr, a.name, a.cat, a.opex * B, a.capex * B, a.eff, a.deg, { rd: a.rd, irs: a.irs })));
      Object.assign(F.tax, { low: 11, mid: 23, high: 36, corp: 21, capg: 20, payroll: 15.3, carbon: 0 });
      Object.assign(F.base, { low: 2.9e12, mid: 4.78e12, high: 3.42e12, corp: 2.15e12, capg: 0.9e12, payroll: 11.76e12, carbon: 4.9e9 * 0.8 });
      F.other = { 'Customs duties (tariffs)': 0.25e12, 'Excise taxes': 0.1e12, 'Estate & gift taxes': 0.035e12, 'Federal Reserve remittances & other': 0.12e12 };
      F.debt = 31.6e12;
      F.mac.effRate = 3.35;
      ENTS.nation.forEach((e) => { F.ent[e.k] = { p: Object.assign({}, e.p0), p0: Object.assign({}, e.p0), c0: e.c0 }; });
    } else {
      const perCap = lvl === 'state' ? (ab === 'DC' ? 21000 : 8200 * Math.pow(col / 100, 0.55) * (1 + U.clamp(-lean, -25, 30) / 110))
        : lvl === 'city' ? 1500 * Math.pow(Math.max(5000, pop) / 1e5, 0.12) * Math.pow(col / 100, 0.6)
        : 15500 * Math.pow(col / 100, 0.7) * 0.15;
      const total = perCap * pop;
      F.total0 = total;
      const tpl = lvl === 'state' ? GR.STATE_AGENCY_TEMPLATE : lvl === 'city' ? GR.CITY_DEPTS : GR.SCHOOL_DEPTS;
      const names = lvl === 'state' ? (GR.STATE_AGENCIES[ab] || []) : null;
      tpl.forEach((t) => {
        const line = total * t.share * (0.85 + r() * 0.3);
        let abbr = lvl === 'state' ? (t.idx >= 0 ? names[t.idx] : t.name) : t.abbr;
        if (F.ag.some((x) => x.abbr === abbr)) abbr = `${abbr} (${t.role})`;
        const full = lvl === 'state' ? t.role : t.abbr;
        F.ag.push(mkAg(J, t.k, abbr, full, t.cat, line * (1 - t.cap), line * t.cap, 50 + r.int(0, 30), 35 + r.int(0, 25), { rd: t.rd }));
      });
      if (lvl === 'state') {
        const [corp, sales, carbon, sev] = GR.STATE_TAX[ab] || [5, 5, 0, 0];
        const lowR = taxLow(ab), highR = taxHigh(ab);
        Object.assign(F.tax, { low: lowR, mid: U.round((lowR + highR) / 2, 2), high: highR, corp, sales, carbon, sev });
        const PI = gdp * 0.85;
        Object.assign(F.base, { low: PI * 0.25 * 0.45, mid: PI * 0.35 * 0.45, high: PI * 0.25 * 0.45, corp: gdp * 0.06, sales: gdp * (highR > 0 ? 0.18 : 0.27), carbon: pop * 13 * 0.75, sev: gdp * (sev > 0 ? 0.07 : 0.01) });
        F.debt = pop * (2500 + 25 * Math.max(0, col - 90)) * (ab === 'IL' || ab === 'NJ' || ab === 'CT' || ab === 'MA' || ab === 'NY' ? 1.8 : 1);
        F.mac.effRate = 3.0;
        // Programs.
        const st2 = GR.STATE[ab];
        const exp = !'AL FL GA KS MS SC TN TX WI WY'.includes(ab);
        const pov = J.met0 ? J.met0.poverty : 12;
        const enroll = 0.15 + (exp ? 0.07 : 0) + (pov - 12) / 150;
        const perEnr = 8000 * Math.pow(col / 100, 0.4);
        const fmap = U.clamp(1 - 0.5 * Math.pow((st2 ? (J.met0.income / 1000) : 75) / 80, 2), 0.5, 0.78);
        F.fmap = fmap;
        const tanfB = U.round(U.clamp(250 + Math.max(0, col - 85) * 13 - Math.max(0, lean) * 6, 200, 1400), -1);
        const eitcP = lean < -6 ? 30 : lean < -2 ? 15 : 0;
        const pensionS = (GR.STATE_CRISES[ab] || {}).pension || 40;
        const pPct = U.clamp(Math.round(115 - pensionS * 0.5), 60, 105);
        const set = (k, p0, c0) => { F.ent[k] = { p: Object.assign({}, p0), p0: Object.assign({}, p0), c0 }; };
        set('medicaid', { fpl: exp ? 138 : (ab === 'TX' ? 15 : 45), copay: exp ? 0 : 3, benefit: 100 }, pop * enroll * perEnr);
        set('tanf', { benefit: tanfB, limit: 60 }, pop * 0.004 * tanfB * 12);
        set('eitc', { pct: eitcP }, pop * 190 * eitcP / 100 + 1);
        set('childcare', { smi: 85 }, pop * 70);
        set('snap', { fpl: exp ? 200 : 130 }, pop * 3);
        set('htf', { amt: Math.round(pop * (lean < 0 ? 9 : 3) / 1e6) }, Math.max(1, pop * (lean < 0 ? 9 : 3)));
        const adc = total * 0.05 * (1 + (pensionS - 50) / 120);
        set('pension', { pct: pPct }, adc);
      } else if (lvl === 'city') {
        const av = pop * 110000 * Math.pow(col / 100, 1.4);
        const local = U.clamp(((GR.STATE_TAX[ab] || [0, 5])[1] ? 1.5 : 1), 0, 4);
        Object.assign(F.tax, { prop: 11, sales: local });
        Object.assign(F.base, { prop: av, sales: gdp * 0.18 });
        F.debt = total * 0.9;
        F.mac.effRate = 3.2;
        const set = (k, p0, c0) => { F.ent[k] = { p: Object.assign({}, p0), p0: Object.assign({}, p0), c0 }; };
        set('vouchers', { ami: 50 }, pop * 45);
        set('fare', { fare: 100 }, (F.ag.find((a) => a.k === 'transit') || { opex: 0 }).opex * 0.2);
        set('pension', { pct: 95 }, total * 0.06);
      } else {
        const av = pop * 110000 * Math.pow(col / 100, 1.4);
        Object.assign(F.tax, { prop: 13 });
        Object.assign(F.base, { prop: av });
        F.debt = total * 0.6;
        F.mac.effRate = 3.1;
        const set = (k, p0, c0) => { F.ent[k] = { p: Object.assign({}, p0), p0: Object.assign({}, p0), c0 }; };
        const students = J.students || pop * 0.15;
        set('meals', { fpl: 185 }, students * 450);
        set('classsize', { cap: 24 }, total * 0.04);
      }
    }
    F.tax0 = Object.assign({}, F.tax);
    // Balance the starting budget with fees and other revenue (federal: a ~$1.8T deficit).
    const t = totals(J);
    if (lvl === 'nation') F.otherAdj = (t.spend - 1.85e12) - t.rev;
    else F.otherAdj = t.spend * 1.004 - t.rev - t.bond;
    F.otherAdj0 = F.otherAdj;
    F.reserve = lvl === 'nation' ? 0 : t.spend * U.clamp(0.1 - (((GR.STATE_CRISES[ab] || {}).pension || 40) - 40) * 0.0012, 0.01, 0.16);
    F.y10_0 = F.mac.y10;
    // Crises.
    initCrises(s, J);
    const t2 = totals(J);
    F.rating = ratingScore(J, t2);
    F.ratingLabel = ratingOf(F.rating)[1];
    F.last = snapshot(J, t2);
    F.vd0 = dissatisfaction(J);
    return F;
  }

  // Low and top income tax rates for a state (from the state data table).
  function taxHigh(ab) { const t = STATE_INCOME[ab]; return t ? t[1] : 4; }
  function taxLow(ab) { const t = STATE_INCOME[ab]; return t ? t[0] : 2; }
  const STATE_INCOME = { AL: [2, 5], AK: [0, 0], AZ: [2.5, 2.5], AR: [2, 3.9], CA: [1, 13.3], CO: [4.4, 4.4], CT: [2, 6.99], DE: [2.2, 6.6], DC: [4, 10.75], FL: [0, 0], GA: [5.39, 5.39], HI: [1.4, 11], ID: [5.695, 5.695], IL: [4.95, 4.95], IN: [3, 3], IA: [3.8, 3.8], KS: [5.2, 5.58], KY: [4, 4], LA: [3, 3], ME: [5.8, 7.15], MD: [4.75, 9], MA: [5, 9], MI: [4.25, 4.25], MN: [5.35, 9.85], MS: [4.4, 4.4], MO: [2, 4.7], MT: [4.7, 5.9], NE: [2.46, 5.2], NV: [0, 0], NH: [0, 0], NJ: [1.4, 10.75], NM: [1.5, 5.9], NY: [4, 10.9], NC: [4.25, 4.25], ND: [1.95, 2.5], OH: [2.75, 3.5], OK: [0.25, 4.75], OR: [4.75, 9.9], PA: [3.07, 3.07], RI: [3.75, 5.99], SC: [0, 6.2], SD: [0, 0], TN: [0, 0], TX: [0, 0], UT: [4.55, 4.55], VT: [3.35, 8.75], VA: [2, 5.75], WA: [0, 0], WV: [2.22, 4.82], WI: [3.5, 7.65], WY: [0, 0] };

  function mkAg(J, k, abbr, name, cat, opex, capex, eff, deg, extra) {
    const r = seedR(J, 'ag' + k);
    return Object.assign({ k, abbr, name, cat, opex, capex, opex0: opex, capex0: capex, eff, eff0: eff, deg, app: U.clamp(Math.round(62 - (deg - 40) * 0.4 + (eff - 60) * 0.3 + r.gauss() * 4), 25, 80), emerg: 0, cut: 0 }, extra || {});
  }

  // ---------- Crises ----------
  function initCrises(s, J) {
    const F = J.F;
    const lvl = J.k;
    const ab = s.home.state;
    const st = GR.STATE[ab];
    const list = GR.CRISIS_LEVELS[lvl];
    const base = lvl === 'nation' ? GR.FED_CRISES : (GR.STATE_CRISES[ab] || {});
    const def = (k) => {
      if (k === 'housing') return U.clamp(Math.round((st.col - 85) * 1.3 + 25), 10, 90);
      if (k === 'poverty') return U.clamp(Math.round((J.met0 ? J.met0.poverty : 12) * 4.2 - 10), 10, 90);
      if (k === 'homeless') return U.clamp(Math.round((st.col - 90) * 1.2 + 20), 10, 80);
      if (k === 'energy') return (GR.STATE_IND[ab] || []).includes('energy') ? 55 : 15;
      return 35;
    };
    list.forEach((k) => {
      let v = base[k] != null ? base[k] : def(k);
      // Cities and school districts inherit the state's matrix, adjusted for local conditions.
      if (lvl === 'city') {
        const urban = U.clamp((J.pop - 50000) / 500000, 0, 1);
        if (k === 'housing' || k === 'homeless') v = v + urban * 10;
        if (k === 'crime') v = v + urban * 12;
        if (k === 'pension') v = v * 0.8;
      }
      if (lvl === 'school' && k === 'infra') v = U.clamp(v * 0.8 + 10, 0, 100);
      F.crises[k] = { s: U.clamp(Math.round(v), 0, 100), s0: U.clamp(Math.round(v), 0, 100), hist: [] };
    });
  }

  // Funding ratio of an agency line relative to its inflation- and population-adjusted baseline.
  function agRatio(F, a, part) {
    const idx = F.P * F.popIdx;
    const prem = 1 + (a.prem || 0) / 100;
    if (part === 'capex') return (a.capex / prem * (a.eff / Math.max(20, a.eff0))) / Math.max(1, a.capex0 * idx);
    if (part === 'opex') return (a.opex * (0.5 + a.eff / Math.max(20, a.eff0) / 2)) / Math.max(1, a.opex0 * idx);
    return ((a.opex + a.capex / prem) * (0.5 + a.eff / Math.max(20, a.eff0) / 2)) / Math.max(1, (a.opex0 + a.capex0) * idx);
  }

  // How much the current settings ease a crisis (positive = improving), per quarter.
  function mitigation(J, k) {
    const F = J.F;
    const T = GR.CRISIS_TYPES[k];
    let m = 0;
    (T.ag || []).forEach(([ak, part, w]) => { const a = F.ag.find((x) => x.k === ak); if (a) m += w * (agRatio(F, a, part) - 1); });
    (T.ent || []).forEach(([ek, pk, w, dir]) => {
      const e = F.ent[ek];
      if (!e || e.p[pk] == null) return;
      const p0 = e.p0[pk] || 0;
      const rel = ek === 'htf' ? ((e.p[pk] - p0) * 1e6) / Math.max(1, (F.total0 || 1e9) * 0.03) : (e.p[pk] - p0) / Math.max(10, Math.abs(p0));
      m += w * dir * U.clamp(rel, -1, 1.5);
    });
    (T.tax || []).forEach(([tk, w, dir]) => {
      if (F.tax[tk] == null) return;
      const scale = tk === 'carbon' ? 50 : tk === 'payroll' ? 2 : 5;
      m += w * dir * (F.tax[tk] - F.tax0[tk]) / scale;
    });
    (T.law || []).forEach(([lk, w, dir]) => {
      if (J.law[lk] == null || J.law0[lk] == null) return;
      m += w * dir * (J.law[lk] - J.law0[lk]) * -0.25;
    });
    // Earmarked capital projects help infrastructure-type crises.
    if (k === 'infra' || k === 'water' || k === 'disaster') m += U.sum(F.ear, (e) => e.amt) / Math.max(1, totalsCache(J).spend) * 6;
    // Programs aimed at this problem.
    if (GR.prog) m += GR.prog.mitigation(F, k);
    // Diminishing returns: money alone cannot erase a structural crisis overnight.
    return Math.tanh(m * 1.2) / 1.2;
  }

  function stepCrises(J, noise) {
    const F = J.F;
    Object.entries(F.crises).forEach(([k, c]) => {
      const T = GR.CRISIS_TYPES[k];
      let d;
      if (T.computed === 'debt') {
        const dg = (F.debt / F.mac.gdp) * 100;
        const target = U.clamp(20 + (dg - 50) * 1.0 + Math.max(0, (F.last.interest / Math.max(1, F.last.rev)) - 0.12) * 150, 0, 100);
        d = (target - c.s) * 0.2;
      } else {
        // High severity tends to entrench itself; neglect compounds.
        const ent = c.s > 70 ? 0.08 : 0;
        d = T.trend + ent - 4.5 * mitigation(J, k);
        if (T.couple) Object.entries(T.couple).forEach(([ck, w]) => { const cc = F.crises[ck]; if (cc) d += w * (cc.s - cc.s0) / 25; });
        if (k === 'poverty') d += (F.mac.u - F.mac.u0) * 0.4;
        if (k === 'migration') d -= (F.mac.g - 2) * 0.15;
        // Severe neglect has a floor: nothing improves much faster than ~2 points a quarter.
        d = U.clamp(d, -2, 2.5);
      }
      if (noise) d += U.gauss() * 0.3;
      c.s = U.clamp(c.s + d, 0, 100);
      c.hist.push(Math.round(c.s));
      if (c.hist.length > 12) c.hist.shift();
    });
  }

  // Voter dissatisfaction index (0-100) from the crises matrix.
  function dissatisfaction(J) {
    const F = J.F;
    let num = 0, den = 0;
    Object.entries(F.crises).forEach(([k, c]) => {
      const T = GR.CRISIS_TYPES[k];
      const rising = c.hist.length >= 4 ? Math.max(0, c.s - c.hist[c.hist.length - 4]) * 2 : 0;
      num += T.sal * (c.s + rising);
      den += T.sal;
    });
    return den ? U.clamp(num / den, 0, 100) : 0;
  }

  // ---------- Revenue & spending ----------
  function behave(F, k) {
    const T = TAXES[k];
    const r = F.tax[k], r0 = F.tax0[k];
    if (k === 'carbon') return 1;
    if (k === 'sales') return 1 - 0.02 * (r - r0);
    if (k === 'prop') return 1 - 0.004 * (r - r0);
    return Math.pow(Math.max(1, 100 - r) / Math.max(1, 100 - r0), T.eti);
  }

  function emissions(F) {
    const reg = (F.reg.energy || 0) * 0.8 + (F.reg.manufacturing || 0) * 0.3;
    const envK = (F.mac.K.infra - 100) * 0.05;
    return F.base.carbon * F.popIdx * Math.max(0.35, 1 - 0.0024 * F.tax.carbon - reg / 100 - envK / 100);
  }

  function revenue(J) {
    const F = J.F;
    const N = F.mac.gdp / F.mac.gdp0;
    const lines = {};
    const irs = F.ag.find((a) => a.irs);
    const compliance = irs ? 1 + U.clamp((agRatio(F, irs, 'all') - 1) * 0.04, -0.03, 0.05) : 1;
    LEVEL_TAXES[F.lvl].forEach((k) => {
      const T = TAXES[k];
      let base = F.base[k] * N;
      if (k === 'carbon') { lines[k] = { name: T.name, amt: emissions(F) * F.tax.carbon * (F.lvl === 'nation' ? 1 : 1) }; return; }
      if (k === 'payroll' && F.ent.ss) base *= U.clamp(1 + 0.12 * Math.log(F.ent.ss.p.cap / 184500), 0.9, 1.16);
      if (k === 'sev') base *= 1 + 0.2 * Math.sin(F.q / 3);
      let rate = F.tax[k];
      const div = k === 'prop' ? 1000 : 100;
      let amt = base * (rate / div) * behave(F, k);
      if (['low', 'mid', 'high', 'corp', 'capg'].includes(k)) amt *= compliance;
      lines[k] = { name: T.name, amt };
    });
    Object.entries(F.fees || {}).forEach(([name, v]) => { lines['fee:' + name] = { name, amt: v * N }; });
    // Tax abatements granted to companies you recruited.
    const ab = GR.develop && J.dev ? GR.develop.abated(J) : 0;
    if (ab > 0) lines.abate = { name: 'Business tax abatements', amt: -(F.tax.corp != null ? ab * F.tax.corp / 100 * 0.12 : ab * (F.tax.prop || 10) / 1000 * 1.5) };
    if (F.lvl === 'nation') {
      const trade = J.law.trade != null ? J.law.trade : 3;
      const tf = [0.25, 0.45, 0.7, 1.0, 1.5][trade];
      Object.entries(F.other).forEach(([name, v]) => { lines[name] = { name, amt: v * N * (name.startsWith('Customs') ? tf : 1) }; });
      lines.other = { name: 'Other receipts', amt: (F.otherAdj || 0) * N };
    } else if (F.lvl === 'state') {
      const ec = entCosts(J);
      const dot = F.ag.find((a) => a.k === 'dot'), k12 = F.ag.find((a) => a.k === 'k12'), hs = F.ag.find((a) => a.k === 'hs');
      const fmapEff = F.fmap + (0.9 - F.fmap) * U.clamp((F.ent.medicaid.p.fpl - 45) / 93, 0, 1) * 0.3;
      lines.fed = { name: 'Federal aid (Medicaid FMAP, highways, education)', amt: ec.medicaid.cost * fmapEff + (dot ? dot.capex * 0.4 : 0) + (k12 ? k12.opex * 0.1 : 0) + (hs ? hs.opex * 0.55 : 0) + F.total0 * 0.04 * N };
      lines.excise = { name: 'Excise, franchise & insurance taxes', amt: F.mac.gdp * 0.011 };
      lines.other = { name: 'Fees, lottery & other revenue', amt: (F.otherAdj || 0) * N };
    } else if (F.lvl === 'city') {
      lines.aid = { name: 'State aid', amt: F.total0 * 0.18 * N };
      lines.other = { name: 'Fees & utility charges', amt: (F.otherAdj || 0) * N };
    } else {
      lines.aid = { name: 'State aid (foundation formula)', amt: F.total0 * 0.45 * N };
      lines.fed = { name: 'Federal aid (Title I, IDEA)', amt: F.total0 * 0.07 * N };
      lines.other = { name: 'Other local revenue', amt: (F.otherAdj || 0) * N };
    }
    return lines;
  }

  function entCosts(J) {
    const F = J.F;
    const out = {};
    const yrs = F.q / 4;
    (ENTS[F.lvl] || []).forEach((e) => {
      const st = F.ent[e.k];
      if (!st) return;
      const growth = F.P * F.popIdx * Math.pow(1 + (e.demo || 0), yrs);
      const cost = st.c0 * growth * Math.max(0, e.f(st.p, F));
      out[e.k] = { name: e.name, cost, ag: e.ag, mult: e.mult };
    });
    return out;
  }

  let _tc = new WeakMap();
  function totalsCache(J) { return _tc.get(J.F) || totals(J); }

  function totals(J) {
    const F = J.F;
    const rv = revenue(J);
    const ec = entCosts(J);
    const ag = {};
    let opex = 0, capex = 0;
    F.ag.forEach((a) => {
      const shut = F.shutdown ? 0.75 : 1;
      const o = a.opex * shut + (a.emerg || 0);
      ag[a.k] = { opex: o, capex: a.capex, total: o + a.capex };
      opex += o; capex += a.capex;
    });
    const ear = U.sum(F.ear, (e) => e.amt);
    const ent = U.sum(Object.values(ec), (e) => e.cost);
    const interest = F.debt * F.mac.effRate / 100;
    const principal = F.lvl === 'nation' ? 0 : F.debt * 0.05;
    const spend = opex + capex + ear + ent + interest + principal;
    const rev = U.sum(Object.values(rv), (x) => x.amt);
    // States and localities finance part of their capital budgets with bonds.
    const bond = F.lvl === 'nation' ? 0 : 0.4 * (capex + ear);
    const out = { rv, ec, ag, opex, capex, ear, ent, interest, principal, spend, rev, bond, bal: rev + bond - spend,
      sp: Object.assign({}, ...F.ag.map((a) => ({ [a.abbr]: ag[a.k].total })), ...Object.values(ec).map((e) => ({ [e.name]: e.cost })), { 'Debt service': interest + principal }) };
    _tc.set(F, out);
    return out;
  }

  // ---------- Credit rating ----------
  function ratingScore(J, t) {
    const F = J.F;
    let sc;
    if (F.lvl === 'nation') {
      const dg = (F.debt / F.mac.gdp) * 100;
      const def = (-t.bal / F.mac.gdp) * 100;
      sc = 110 - 0.15 * Math.max(0, dg - 50) - 2 * Math.max(0, def - 3) - 25 * Math.max(0, t.interest / t.rev - 0.15) + 0.8 * (F.mac.g - 2);
    } else {
      const dr = F.debt / Math.max(1, t.rev);
      const res = F.reserve / Math.max(1, t.spend);
      sc = 90 - 14 * Math.max(0, dr - 0.6) + 40 * Math.min(0.08, res) - 60 * Math.max(0, -t.bal / t.spend - 0.01) - 2 * Math.min(5, F.forcedBorrow || 0);
    }
    Object.entries(F.crises).forEach(([k, c]) => { sc -= GR.CRISIS_TYPES[k].rating * Math.max(0, c.s - 40) / 10; });
    return U.clamp(sc, 0, 100);
  }

  // ---------- Quarterly step ----------
  function snapshot(J, t) {
    const F = J.F;
    const cat = {};
    F.ag.forEach((a) => {
      const c = cat[a.cat] || (cat[a.cat] = { op: 0, cap: 0 });
      c.op += t.ag[a.k].opex; c.cap += t.ag[a.k].capex;
    });
    if (t.ear) { const c = cat.infra || (cat.infra = { op: 0, cap: 0 }); c.cap += t.ear; }
    const tax = {};
    Object.entries(t.rv).forEach(([k, v]) => { tax[k] = v.amt; });
    const ent = {};
    Object.entries(t.ec).forEach(([k, v]) => { ent[k] = v.cost; });
    return { cat, tax, ent, reg: Object.assign({}, F.reg), rev: t.rev, spend: t.spend, interest: t.interest, gdp: F.mac.gdp };
  }

  // ctx: { nat: nation F (for states/cities), state: state F (for cities/schools), noise }
  function quarter(J, ctx = {}) {
    const F = J.F;
    const m = F.mac;
    const t = totals(J);
    const prev = F.last;
    // Impulse is measured against last quarter's levels: only policy changes and program dynamics count.
    const nomQ = 1;
    // Fiscal impulse relative to last quarter's levels grown at the nominal rate.
    let imp = 0;
    const cat = snapshot(J, t);
    Object.entries(cat.cat).forEach(([ck, v]) => {
      const C = GR.SPEND_CATS[ck] || GR.SPEND_CATS.admin;
      const p = (prev.cat[ck]) || { op: v.op, cap: v.cap };
      imp += C.srOp * (v.op - p.op * nomQ) + C.sr * (v.cap - p.cap * nomQ);
    });
    Object.entries(cat.ent).forEach(([k, v]) => { const e = t.ec[k]; imp += (e ? e.mult : 1) * (v - (prev.ent[k] || v) * nomQ); });
    Object.entries(cat.tax).forEach(([k, v]) => { const T = TAXES[k]; const mult = T ? T.sr : 0.4; imp -= mult * (v - (prev.tax[k] || v) * nomQ); });
    GR.INDUSTRIES.forEach((x) => { imp -= 0.6 * ((F.reg[x.k] || 0) - (prev.reg[x.k] || 0)) / 100 * x.share * m.gdp; });
    if (F.lvl === 'state' && F.ent.snap) imp += 1.5 * J.pop * 300 * (Math.pow(F.ent.snap.p.fpl / 130, 0.9) - Math.pow((prev.snapFpl || F.ent.snap.p.fpl) / 130, 0.9)) / 4;
    const impPct = (imp / m.gdp) * 100 * LEAK[F.lvl];
    // Capital stocks: capital spending (scaled by efficiency) builds infrastructure, research and human capital.
    // Baselines grow with the economy: holding public investment's share of GDP keeps stocks at 100.
    const flows = { infra: [0, 0], rd: [0, 0], hum: [0, 0] };
    const gi = m.gdp / m.gdp0;
    F.ag.forEach((a) => {
      const C = GR.SPEND_CATS[a.cat] || GR.SPEND_CATS.admin;
      if (!C.stock) return;
      const eff = a.eff / Math.max(20, a.eff0);
      const share = C.rdShare || 1;
      const now = (C.stock === 'hum' ? a.opex : a.capex / (1 + (a.prem || 0) / 100)) * eff * share;
      const base0 = (C.stock === 'hum' ? a.opex0 : a.capex0) * share * gi;
      flows[C.stock][0] += now; flows[C.stock][1] += base0;
      if (a.rd) { flows.rd[0] += a.capex * eff * a.rd; flows.rd[1] += a.capex0 * a.rd * gi; }
    });
    flows.infra[0] += t.ear * 0.5; // pork projects are less productive
    m.pipe.push(flows.hum[1] ? flows.hum[0] / flows.hum[1] : 1);
    if (m.pipe.length > 16) m.pipe.shift();
    const humRatio = m.pipe.length >= 12 ? m.pipe[m.pipe.length - 12] : 1;
    m.K.infra += (100 * (flows.infra[1] ? flows.infra[0] / flows.infra[1] : 1) - m.K.infra) * 0.025;
    m.K.rd += (100 * (flows.rd[1] ? flows.rd[0] / flows.rd[1] : 1) - m.K.rd) * 0.02;
    m.K.hum += (100 * humRatio - m.K.hum) * 0.02;
    Object.keys(m.K).forEach((k) => { m.K[k] = U.clamp(m.K[k], 30, 300); });
    // Potential growth.
    const nat = ctx.nat;
    const dtax = (k) => (F.tax[k] != null ? F.tax[k] - F.tax0[k] : 0);
    const priv = -0.05 * dtax('corp') - 0.02 * dtax('capg') - 0.015 * dtax('high') - 0.008 * dtax('mid') - 0.12 * ((F.lvl === 'nation' ? m.y10 : (nat ? nat.mac.y10 : m.y10)) - F.y10_0);
    // Compliance costs drag on growth; deregulation helps, with diminishing returns.
    const regSum = U.sum(GR.INDUSTRIES, (x) => (F.reg[x.k] || 0) * x.share);
    const regDrag = regSum >= 0 ? regSum * 0.25 : -0.2 * Math.tanh(-regSum / 1.5);
    let crisisDrag = 0;
    Object.entries(F.crises).forEach(([k, c]) => { const d = c.s - c.s0; crisisDrag += GR.CRISIS_TYPES[k].drag * (d > 0 ? d : d * 0.4) / 10; });
    crisisDrag = Math.max(-0.35, crisisDrag);
    const privEff = priv > 0 ? 0.5 * Math.tanh(priv / 0.5) : priv;
    const basePot = F.lvl === 'nation' ? 1.9 : (nat ? nat.mac.pot : 1.9);
    // Diminishing returns: each doubling of a stock adds a fixed amount to potential growth.
    const kr = (k) => Math.log(m.K[k] / 100);
    m.pot = basePot + 0.5 * kr('infra') + 0.8 * kr('rd') + 0.7 * kr('hum') + privEff - regDrag - crisisDrag + (GR.prog ? GR.prog.potBoost(F) : 0);
    // Output gap.
    m.gapPrev = m.gap;
    const crowd = F.lvl === 'nation' ? 0.25 * (m.y10 - F.y10_0) : 0;
    m.gap = 0.8 * m.gap + impPct - crowd + (ctx.noise ? U.gauss() * 0.15 : 0) + (ctx.shock || 0);
    if (F.shutdown) m.gap -= 0.15;
    const gapEff = F.lvl === 'nation' ? m.gap : m.gap + (nat ? nat.mac.gap : 0);
    const natCycle = F.lvl === 'nation' || !nat ? 0 : (nat.mac.g - nat.mac.pot);
    m.g = U.clamp(m.pot + 4 * (m.gap - m.gapPrev) + natCycle, -9, 9);
    // Prices, jobs, rates.
    if (F.lvl === 'nation') {
      const defGDP = (-t.bal / m.gdp) * 100;
      const push = 0.004 * F.tax.carbon + ([0, 0, 0.1, 0.3, 0.7][J.law.trade != null ? J.law.trade : 3] - 0.3) * 0.5;
      m.pi = U.clamp(0.72 * m.pi + 0.28 * 2.1 + 0.2 * m.gap + 0.05 * Math.max(0, defGDP - 4) + push * 0.25 + (ctx.noise ? U.gauss() * 0.12 : 0), -2, 15);
      m.i = U.clamp(1.0 + m.pi + 0.5 * (m.pi - 2) + 0.5 * m.gap, 0.25, 12);
      const dg = (F.debt / m.gdp) * 100;
      const y10t = 0.55 * m.i + 1.9 + 0.02 * Math.max(0, dg - 80) + ratingOf(F.rating)[2] * 0.5;
      m.y10 = 0.7 * m.y10 + 0.3 * y10t;
    } else {
      m.pi = nat ? nat.mac.pi + (F.crises.housing ? (F.crises.housing.s - 50) * 0.004 : 0) : m.pi;
      m.i = nat ? nat.mac.i : m.i;
      m.y10 = (nat ? nat.mac.y10 : 4.3) * 0.78 + ratingOf(F.rating)[2];
    }
    m.effRate += (m.y10 - m.effRate) * 0.04;
    const ustar = m.u0 + (F.crises.education ? (F.crises.education.s - F.crises.education.s0) * 0.01 : 0) + regDrag * 0.5 - (GR.develop ? GR.develop.jobsPct(J) * 0.55 : 0);
    m.u = U.clamp(0.75 * m.u + 0.25 * (ustar - 0.45 * gapEff), 1.5, 25);
    m.cc = U.clamp(0.85 * m.cc + 0.15 * (100 + 4 * (m.g - 2) - 6 * (m.u - 4.3) - 4 * (m.pi - 2.5) - (F.shutdown ? 8 : 0) - (dissatisfaction(J) - (F.vd0 || 50)) * 0.3), 20, 160);
    // Levels.
    m.real *= 1 + m.g / 400;
    m.gdp *= 1 + (m.g + m.pi) / 400;
    F.P *= 1 + m.pi / 400;
    F.popIdx *= 1 + (F.lvl === 'nation' ? 0.005 : 0.004 - (F.crises.migration ? (F.crises.migration.s - 50) * 0.00008 : 0)) / 4;
    if (F.q % 4 === 3 && F.ent.ss) F.colaIdx *= 1 + (F.ent.ss.p.cola || 0) / 100;
    // Debt and reserves.
    const t2 = totals(J);
    if (F.lvl === 'nation') F.debt = Math.max(0, F.debt - t2.bal / 4);
    else {
      F.reserve += t2.bal / 4;
      // Rainy-day funds are capped by law; overflow pays down debt.
      if (F.lvl !== 'nation' && F.reserve > t2.spend * 0.2) { const over = F.reserve - t2.spend * 0.2; F.reserve -= over; F.debt = Math.max(0, F.debt - over); }
      F.debt = Math.max(0, F.debt + (t2.bond - t2.principal) / 4);
      // Running out of reserves forces deficit borrowing, which rating agencies punish.
      if (F.reserve < 0) { F.debt += -F.reserve; F.reserve = 0; F.forcedBorrow = (F.forcedBorrow || 0) + 1; }
    }
    // Earmarks expire after a year.
    F.ear = F.ear.filter((e) => --e.q > 0);
    // Agencies.
    F.ag.forEach((a) => stepAgency(F, a, ctx.noise));
    stepCrises(J, ctx.noise);
    F.rating = U.clamp(0.8 * F.rating + 0.2 * ratingScore(J, t2), 0, 100);
    F.ratingLabel = ratingOf(F.rating)[1];
    F.last = snapshot(J, t2);
    F.last.snapFpl = F.ent.snap ? F.ent.snap.p.fpl : null;
    F.q++;
    if (!ctx.sim) {
      F.hist.push({ q: F.q, gdp: m.gdp, g: m.g, u: m.u, pi: m.pi, cc: m.cc, rev: t2.rev, spend: t2.spend, bal: t2.bal, debt: F.debt, y10: m.y10, rating: F.ratingLabel, vd: dissatisfaction(J) });
      if (F.hist.length > 48) F.hist.shift();
    }
  }

  function stepAgency(F, a, noise) {
    const idx = F.P * F.popIdx;
    const frOp = (a.opex * (F.shutdown ? 0.75 : 1) + (a.emerg || 0)) / Math.max(1, a.opex0 * idx);
    const frCap = a.capex / Math.max(1, a.capex0 * idx);
    a.deg = U.clamp(a.deg + 0.9 * (1 - frCap * (a.eff / Math.max(20, a.eff0))) + (frOp < 0.95 ? (0.95 - frOp) * 2 : 0), 0, 100);
    // Rapid growth outpaces an agency's capacity to spend well.
    const grow = a.lastTotal ? (a.opex + a.capex) / a.lastTotal - 1 : 0;
    a.eff = U.clamp(a.eff + (a.eff0 - a.eff) * 0.03 - Math.max(0, grow - 0.04) * 25 + (noise ? U.gauss() * 0.3 : 0), 5, 98);
    a.lastTotal = a.opex + a.capex;
    const target = 50 + 30 * (frOp - 1) + 18 * (frCap - 1) - 0.35 * (a.deg - 40) + 0.25 * (a.eff - 60) - (F.shutdown ? 18 : 0);
    a.app = U.clamp(a.app + (target - a.app) * 0.12 + (noise ? U.gauss() * 0.6 : 0), 3, 97);
    a.emerg = (a.emerg || 0) * 0.5;
    if (Math.abs(a.emerg) < 1) a.emerg = 0;
  }

  // ---------- Bills: application and dynamic scoring ----------
  // A bill's fiscal provisions:
  //   tax: { key: delta } (pp, mills or $/t), reg: { industry: delta % of output },
  //   ap: { agencyKey: { opex: $ delta per year, capex: $ delta per year } },
  //   ent: { program: { param: new value } }, ear: [{ who, ag, amt, proj }], emerg: { agencyKey: $ }.
  function apply(J, bill) {
    const F = J.F;
    const p = bill.prov || {};
    Object.entries(p.tax || {}).forEach(([k, d]) => { if (F.tax[k] != null) F.tax[k] = U.clamp(U.round(F.tax[k] + d, 2), TAXES[k].min, TAXES[k].max); });
    Object.entries(p.reg || {}).forEach(([k, d]) => { F.reg[k] = U.clamp((F.reg[k] || 0) + d, -2, 15); });
    // "Subject to appropriation": authorized, but no money moves until a budget funds it.
    Object.entries(p.approp ? {} : p.ap || {}).forEach(([k, v]) => {
      const a = F.ag.find((x) => x.k === k);
      if (!a) return;
      a.opex = Math.max(0, a.opex + (v.opex || 0));
      a.capex = Math.max(0, a.capex + (v.capex || 0));
    });
    Object.entries(p.ent || {}).forEach(([k, ps]) => { const e = F.ent[k]; if (e) Object.assign(e.p, ps); });
    (p.ear || []).forEach((e) => { F.ear.push({ who: e.who, ag: e.ag, amt: e.amt, proj: e.proj, q: 4 }); });
    Object.entries(p.emerg || {}).forEach(([k, v]) => { const a = F.ag.find((x) => x.k === k); if (a) a.emerg = (a.emerg || 0) + v; });
    // Management reforms change an agency's efficiency rating.
    Object.entries(p.eff || {}).forEach(([k, d]) => { const a = F.ag.find((x) => x.k === k); if (a) { a.eff = U.clamp(a.eff + d, 5, 98); a.eff0 = U.clamp(a.eff0 + d / 2, 5, 95); } });
    // Domestic-content and prevailing-wage mandates raise the cost of each capital dollar.
    Object.entries(p.prem || {}).forEach(([k, d]) => { const a = F.ag.find((x) => x.k === k); if (a) a.prem = U.clamp((a.prem || 0) + d, 0, 60); });
    // Privatizations and asset sales: one-time proceeds pay down debt or fill reserves.
    Object.entries(p.sale || {}).forEach(([k, amt]) => {
      const a = F.ag.find((x) => x.k === k);
      if (a) { a.capex0 *= 0.7; a.opex0 *= 0.8; a.privatized = (a.privatized || 0) + 1; }
      if (F.lvl === 'nation') F.debt = Math.max(0, F.debt - amt); else F.reserve += amt;
    });
    // New user fees, tolls and charges.
    Object.entries(p.fee || {}).forEach(([name, amt]) => { F.fees = F.fees || {}; F.fees[name] = (F.fees[name] || 0) + amt / (F.mac.gdp / F.mac.gdp0); });
    // New programs go on the books.
    if (GR.prog) GR.prog.onApply(J, p);
  }

  function cloneJ(J) {
    const c = { k: J.k, name: J.name, pop: J.pop, law: Object.assign({}, J.law), law0: J.law0, lean: J.lean, students: J.students };
    c.F = JSON.parse(JSON.stringify(J.F));
    return c;
  }

  // Dynamic score: simulate the next N quarters with and without the bill.
  function analyze(s, J, bill) {
    const quarters = J.k === 'nation' ? 40 : 20;
    const nat = J.k === 'nation' ? null : s.jur.nation;
    const run = (withBill) => {
      const c = cloneJ(J);
      if (withBill) { apply(c, bill); (bill.prov && bill.prov.policy || []).forEach((x) => { c.law[x.k] = x.to; }); }
      const out = [];
      const t0 = totals(c);
      out.push({ t: t0, F: null });
      for (let i = 0; i < quarters; i++) {
        quarter(c, { nat: nat ? nat.F && { mac: nat.F.mac } : null, sim: true });
        const t = totals(c);
        out.push({ g: c.F.mac.g, u: c.F.mac.u, pi: c.F.mac.pi, gdp: c.F.mac.real, ngdp: c.F.mac.gdp, debt: c.F.debt, rev: t.rev, spend: t.spend, bal: t.bal, interest: t.interest, rating: c.F.rating, y10: c.F.mac.y10, crises: Object.fromEntries(Object.entries(c.F.crises).map(([k, v]) => [k, v.s])), reserve: c.F.reserve });
      }
      return { out, t0 };
    };
    const a = run(false), b = run(true);
    const yr = (arr, y, key) => U.avg(arr.slice(1 + (y - 1) * 4, 1 + y * 4), (x) => x[key]);
    const static1 = { rev: b.t0.rev - a.t0.rev, spend: b.t0.spend - a.t0.spend };
    const years = quarters / 4;
    let cumDef = 0;
    for (let i = 1; i <= quarters; i++) cumDef += (a.out[i].bal - b.out[i].bal) / 4;
    const last = quarters;
    const dGDP = (y) => (yr(b.out, y, 'gdp') / yr(a.out, y, 'gdp') - 1) * 100;
    const res = {
      years, static: static1, staticDef: (static1.spend - static1.rev),
      cumDef, gdp2: dGDP(2), gdpEnd: dGDP(years), u2: yr(b.out, 2, 'u') - yr(a.out, 2, 'u'), pi2: yr(b.out, 2, 'pi') - yr(a.out, 2, 'pi'),
      debtEnd: b.out[last].debt - a.out[last].debt, debtGDP: (b.out[last].debt / b.out[last].ngdp - a.out[last].debt / a.out[last].ngdp) * 100,
      intEnd: b.out[last].interest - a.out[last].interest, y10: b.out[last].y10 - a.out[last].y10,
      rating: [ratingOf(a.out[last].rating)[1], ratingOf(b.out[last].rating)[1]], ratingD: b.out[last].rating - a.out[last].rating,
      revY1: yr(b.out, 1, 'rev') - yr(a.out, 1, 'rev'), revEnd: b.out[last].rev - a.out[last].rev, spendY1: yr(b.out, 1, 'spend') - yr(a.out, 1, 'spend'),
      crises: Object.fromEntries(Object.keys(a.out[last].crises).map((k) => [k, b.out[last].crises[k] - a.out[last].crises[k]])),
      reserve: (b.out[last].reserve || 0) - (a.out[last].reserve || 0),
      jobs: -(yr(b.out, 2, 'u') - yr(a.out, 2, 'u')) / 100 * J.pop * 0.5,
    };
    return res;
  }

  // Static revenue effect of each tax change, by bracket (for distribution tables).
  function taxDist(J, tax) {
    const F = J.F;
    const out = {};
    Object.entries(tax || {}).forEach(([k, d]) => {
      if (!d) return;
      const c = cloneJ(J);
      const before = (revenue(c)[k] || { amt: 0 }).amt;
      c.F.tax[k] = U.clamp(c.F.tax[k] + d, TAXES[k].min, TAXES[k].max);
      const after = (revenue(c)[k] || { amt: 0 }).amt;
      out[k] = after - before;
    });
    void F;
    return out;
  }

  // ---------- Effects on the older metric set ----------
  function serviceAdj(J) {
    const F = J.F;
    if (!F) return {};
    const adj = {};
    const ag = (k, part = 'all') => { const a = F.ag.find((x) => x.k === k); return a ? agRatio(F, a, part) : 1; };
    const c = (k) => (F.crises[k] ? F.crises[k].s - F.crises[k].s0 : 0);
    adj.crime = 1 - 0.15 * ((ag('police') + ag('corr') + ag('doj')) / 3 - 1) + c('crime') * 0.004;
    adj.grad = (ag('k12', 'opex') - 1) * 4 + (ag('instr', 'opex') - 1) * 5 - c('education') * 0.05;
    adj.uninsured = c('health') * 0.04 + c('healthcosts') * 0.04;
    adj.poverty = c('poverty') * 0.04;
    adj.rent = 1 + c('housing') * 0.004;
    adj.emis = emissions(F) / Math.max(1, F.base.carbon * F.popIdx);
    return adj;
  }

  const fmtB = (v) => U.money(v);

  // Balanced-budget requirement (states, cities, school districts): at the start of each fiscal
  // year a projected gap is closed first from reserves (up to half), then by across-the-board cuts.
  function balanceRule(J) {
    const F = J.F;
    if (F.lvl === 'nation') return null;
    const t = totals(J);
    let gap = -t.bal;
    if (gap <= 0) return null;
    const draw = Math.min(gap, F.reserve * 0.5);
    F.reserve -= draw;
    gap -= draw;
    if (gap <= 0) return { draw, cut: 0 };
    const base = t.opex + t.capex;
    const f = Math.min(0.25, gap / Math.max(1, base));
    F.ag.forEach((a) => { a.opex *= 1 - f; a.capex *= 1 - f; });
    return { draw, cut: f, amt: base * f };
  }

  return { balanceRule, TAXES, LEVEL_TAXES, ENTS, LADDER, ratingOf, init, totals, revenue, entCosts, quarter, apply, analyze, taxDist, cloneJ, mitigation, dissatisfaction, agRatio, serviceAdj, emissions, fmtB, ratingScore };
})();
