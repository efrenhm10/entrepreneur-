// Deep legislative architecture: fiscal bills built from revenue/regulatory changes,
// line-item appropriations, entitlement triggers and earmarks; dynamic scoring; a vectorized
// voting engine where every lawmaker scores every bill as
//   Vote Score = 0.3 x Ideological Tax Alignment + 0.3 x District Demographics & Local Industry
//              + 0.2 x Agency Efficiency/Audit Ratings + 0.2 x Political Capital & Earmarks
// plus caucus blocs, committee chairs, filibusters, backroom negotiations, the annual budget
// cycle with continuing resolutions and shutdowns, emergency transfers and audits.
var GR = globalThis.GR || (globalThis.GR = {});

GR.legis = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const G = () => GR.gov;
  const FX = () => GR.fisc;
  const OPEN = (b) => !['law', 'dead', 'vetoed'].includes(b.stage);
  const WEIGHTS = { it: 0.3, di: 0.3, ae: 0.2, pc: 0.2 };

  // ---------- Bill basics ----------
  function emptyProv() { return { tax: {}, reg: {}, ap: {}, ent: {}, ear: [], emerg: {}, policy: [], eff: {}, prem: {}, sale: {}, fee: {}, prog: [] }; }
  const provCount = (p) => ['tax', 'reg', 'ap', 'ent', 'emerg', 'eff', 'prem', 'sale', 'fee'].reduce((n, k) => n + Object.keys(p[k] || {}).length, 0) + (p.ear || []).length + (p.policy || []).length;
  const allBills = (s) => ['school', 'city', 'state', 'nation'].flatMap((j) => s.jur[j].bills || []);
  const findBill = (s, id) => allBills(s).find((b) => b.id === id) || null;
  const budgetSize = (J) => FX().totals(J).spend;
  const fyStartWeek = (s, jur, y) => (jur === 'nation' ? U.weekOfMD(y, 9, 1) : U.weekOfMD(y, 6, 1));

  function newBill(s, jur, o) {
    const B = G().bodiesOf(s, jur);
    const b = Object.assign({
      id: U.uid('b'), jur, title: 'Untitled Act', kind: 'regular', spon: null, cos: [], prov: emptyProv(), body: B[0], stage: 'committee',
      w: s.week, due: s.week + 1, votes: [], my: {}, pledges: {}, sweet: {}, agreed: {}, task: null,
    }, o);
    b.comm = committeeFor(s, b);
    return b;
  }

  // Which committee a bill goes to.
  function committeeFor(s, b) {
    const body = b.body;
    const Bd = s.bodies[body];
    if (!Bd) return null;
    const ks = Object.keys(Bd.comm);
    const p = b.prov || {};
    const pick = (...keys) => keys.find((k) => ks.includes(k)) || ks[0];
    if (b.kind === 'budget' || b.kind === 'cr' || b.kind === 'supplemental' || Object.keys(p.ap || {}).length > 2) return pick('approp', 'budget', 'finance');
    if (Object.keys(p.tax || {}).length) return pick('ways', 'budget', 'finance');
    if (Object.keys(p.ent || {}).length) { const e = Object.keys(p.ent)[0]; return pick(e === 'ss' ? 'ways' : 'health', 'energy', 'ways', 'budget', 'finance'); }
    if (Object.keys(p.reg || {}).length) return pick('commerce', 'energy', 'environment', 'land');
    if (Object.keys(p.ap || {}).length) return pick('approp', 'budget', 'finance');
    if ((p.policy || []).length) {
      const cat = GR.POLICY[p.policy[0].k].cat;
      const jur = GR.BODIES[body].jur;
      const list = GR.COMMITTEES[jur === 'school' ? 'school' : jur === 'city' ? 'city' : jur];
      const c = list.find((x) => x.cats.includes(cat));
      return c ? c.k : ks[0];
    }
    return ks[0];
  }

  // Human-readable list of provisions.
  function describe(s, b) {
    const J = s.jur[b.jur];
    const F = J.F;
    const p = b.prov;
    const out = [];
    Object.entries(p.tax || {}).forEach(([k, d]) => { if (d) out.push(`${FX().TAXES[k].name}: ${fmtTax(k, F.tax[k])} → ${fmtTax(k, F.tax[k] + d)}`); });
    Object.entries(p.reg || {}).forEach(([k, d]) => { if (d) out.push(`Compliance costs on ${GR.INDUSTRIES.find((x) => x.k === k).name.toLowerCase()}: ${d > 0 ? '+' : ''}${U.round(d, 2)}% of output`); });
    Object.entries(p.ap || {}).forEach(([k, v]) => {
      const a = F.ag.find((x) => x.k === k);
      if (!a) return;
      const parts = [];
      if (v.opex) parts.push(`operations ${v.opex > 0 ? '+' : '−'}${U.money(Math.abs(v.opex))}`);
      if (v.capex) parts.push(`capital ${v.capex > 0 ? '+' : '−'}${U.money(Math.abs(v.capex))}`);
      if (parts.length) out.push(`${a.abbr}: ${parts.join(', ')} per year`);
    });
    Object.entries(p.ent || {}).forEach(([k, ps]) => {
      const def = (FX().ENTS[J.k] || []).find((e) => e.k === k);
      if (!def) return;
      Object.entries(ps).forEach(([pk, v]) => {
        const pd = def.params.find((x) => x[0] === pk);
        const cur = F.ent[k].p[pk];
        if (pd && v !== cur) out.push(`${def.name} — ${pd[1]}: ${fmtParam(pd, cur)} → ${fmtParam(pd, v)}`);
      });
    });
    (p.prog || []).forEach((x) => out.push(`New program: ${x.name} (${U.money(x.amt)} a year, run by the ${x.office})`));
    (p.ear || []).forEach((e) => { const who = s.pols[e.who]; out.push(`Earmark: ${e.proj} (${U.money(e.amt)})${who ? ' for ' + W().fullName(who) : ''}`); });
    Object.entries(p.emerg || {}).forEach(([k, v]) => { const a = F.ag.find((x) => x.k === k); if (a) out.push(`Emergency funds to ${a.abbr}: ${U.money(v)}`); });
    (p.policy || []).forEach((x) => { const pol = GR.POLICY[x.k]; const o = GR.policyOpts(pol, GR.lvlOf(b.jur)); out.push(`${pol.name}: ${o[J.law[x.k]]} → ${o[x.to]}`); });
    const agName = (k) => (F.ag.find((x) => x.k === k) || { abbr: k }).abbr;
    Object.entries(p.sale || {}).forEach(([k, v]) => out.push(`Privatize ${agName(k)} assets: ${U.money(v)} one-time proceeds`));
    Object.entries(p.prem || {}).forEach(([k, v]) => out.push(`${agName(k)} procurement mandate: capital costs +${v}% per project`));
    Object.entries(p.eff || {}).forEach(([k, v]) => out.push(`${agName(k)} management reform: efficiency rating ${v >= 0 ? '+' : ''}${v}`));
    Object.entries(p.fee || {}).forEach(([k, v]) => out.push(`New revenue: ${k} (${U.money(v)}/yr)`));
    return out;
  }
  function fmtTax(k, v) { const T = FX().TAXES[k]; return T.unit === '$/t' ? `$${U.round(v, 0)}/ton` : T.unit === 'mills' ? `${U.round(v, 2)} mills` : `${U.round(v, 2)}%`; }
  function fmtParam(pd, v) { const u = pd[2]; return u === '$' ? U.money(v) : u === '$M' ? U.money(v * 1e6) : u === '%' ? `${v}%` : `${v} ${u}`; }

  // Fiscal direction of a bill: positive = more government (liberal), negative = less (conservative).
  function leanOf(s, b) {
    if (b._lean != null) return b._lean;
    const J = s.jur[b.jur];
    const F = J.F;
    const p = b.prov;
    const size = budgetSize(J);
    let L = 0, soc = 0;
    Object.entries(p.tax || {}).forEach(([k, d]) => { const T = FX().TAXES[k]; const sc = T.unit === '$/t' ? 0.006 : T.unit === 'mills' ? 0.03 : 0.12; L += T.lean * d * sc; });
    const Ltax = L;
    const catLean = { social: 1, health: 1, edu: 0.9, env: 1, rnd: 0.6, infra: 0.4, admin: 0.3, agri: 0, defense: -0.9, safety: -0.6 };
    Object.entries(p.ap || {}).forEach(([k, v]) => { const a = F.ag.find((x) => x.k === k); if (a) L += ((v.opex || 0) + (v.capex || 0)) / size * 12 * (catLean[a.cat] || 0.3); });
    const c0 = FX().entCosts(J);
    const c = FX().cloneJ(J);
    Object.entries(p.ent || {}).forEach(([k, ps]) => { if (c.F.ent[k]) Object.assign(c.F.ent[k].p, ps); });
    const c1 = FX().entCosts(c);
    Object.keys(p.ent || {}).forEach((k) => { if (k !== 'pension' && c0[k]) L += (c1[k].cost - c0[k].cost) / size * 14; });
    Object.values(p.reg || {}).forEach((d) => { L += d * 0.15; });
    Object.values(p.sale || {}).forEach((v) => { L -= 0.35 + v / size * 4; });
    Object.values(p.fee || {}).forEach((v) => { L -= v / size * 6; });
    Object.entries(p.prem || {}).forEach(() => { L += 0.12; });
    (p.prog || []).forEach((x) => { L += x.lean * x.amt / size * 12; });
    (p.policy || []).forEach((x) => {
      const pol = GR.POLICY[x.k];
      const lvl = GR.lvlOf(b.jur);
      const d = GR.optScore(pol, x.to, lvl) - GR.optScore(pol, J.law[x.k], lvl);
      if (W().isFiscal(pol)) L += -d * 0.3; else soc += -d * 0.35;
    });
    b._lean = Math.tanh(L);
    b._leanNT = Math.tanh(L - Ltax);
    b._soc = Math.tanh(soc);
    return b._lean;
  }

  // ---------- Member context (district profile, industries, crisis exposure) ----------
  const cache = new WeakMap();
  function ctxOf(s, p) {
    let c = cache.get(p);
    if (c) return c;
    let pr, ab = p.st || s.home.state;
    const seat = p.seat && s.seats[p.seat];
    if (seat && seat.off !== 'president') pr = W().seatProfile(s, seat);
    else if (p.fed) pr = GR.geo.mkProfile({ ab: p.fed.st }, p.fed.body === 'ussenate' ? GR.STATE[p.fed.st].pop * 1e6 : 760000, p.fed.lean, 2.45 - p.fed.lean / 28, 0, 0, 'm' + p.id);
    else pr = W().nationProfile();
    const ind = {};
    const hasState = GR.STATE_IND[ab] || [];
    GR.INDUSTRIES.forEach((x) => {
      let v = 0.25 + (hasState.includes(x.k) ? 1 : 0);
      if (['tech', 'finance', 'healthcare'].includes(x.k)) v *= 0.5 + pr.urban / 100;
      if (['ag', 'energy'].includes(x.k)) v *= 1.6 - pr.urban / 100;
      if (x.k === 'defense') v *= 1 + pr.veterans / 15;
      ind[x.k] = v;
    });
    const tot = U.sum(Object.values(ind));
    Object.keys(ind).forEach((k) => { ind[k] /= tot; });
    const base = p.fed ? (GR.STATE_CRISES[p.fed.st] || {}) : null;
    c = { pr, ind, base, hawk: U.clamp((W().axes(p).fis + 1) / 3, 0, 1) };
    cache.set(p, c);
    return c;
  }

  // How exposed a member's district is to a crisis (0-100).
  function exposure(s, p, J, k, cx) {
    const c = J.F.crises[k];
    let sev = c ? c.s : (cx.base && cx.base[k] != null ? cx.base[k] : 35);
    if (cx.base && cx.base[k] != null && J.k === 'nation') sev = (sev + (c ? c.s : sev)) / 2;
    const pr = cx.pr;
    const T = GR.CRISIS_TYPES[k];
    let f = 1;
    if (T.urban) f *= 0.6 + (pr.urban / 100) * T.urban * 0.8;
    if (k === 'opioid' || k === 'migration' || k === 'energy') f *= 1.4 - pr.urban / 100;
    if (k === 'health' || k === 'poverty' || k === 'healthcosts') f *= U.clamp(pr.poverty / 12, 0.5, 2);
    if (k === 'ssTrust' || k === 'medicareTrust') f *= U.clamp(pr.age / 40, 0.7, 1.4);
    return U.clamp(sev * f, 0, 100);
  }

  // ---------- The vote score ----------
  function components(s, p, b, opts = {}) {
    const J = s.jur[b.jur];
    const F = J.F;
    const cx = ctxOf(s, p);
    const pr = cx.pr;
    const prov = b.prov;
    const an = b.an || analysis(s, b);
    const size = budgetSize(J);
    const ax = W().axes(p);
    // 1. Ideological tax alignment.
    leanOf(s, b);
    const L = b._leanNT;
    // Tax rates are judged against each member's ideal rate (an ideal point, not just a direction):
    // conservatives want progressive taxes below the starting rate, progressives above it, and
    // nobody keeps cutting (or raising) once a rate has passed their ideal.
    let taxU = 0;
    Object.entries(prov.tax || {}).forEach(([k, d]) => {
      const T = FX().TAXES[k];
      const cur = F.tax[k] != null ? F.tax[k] : 0;
      const base = F.tax0[k] != null ? F.tax0[k] : cur;
      const dir = ax.fis * Math.sign(T.lean || 1);
      let ideal = Math.max(0, base * (1 - 0.35 * dir));
      if (T.unit === '$/t') ideal = Math.max(0, base + 45 * -ax.fis);
      const unit = T.unit === '$/t' ? 25 : 3;
      taxU -= (Math.abs(cur + d - ideal) - Math.abs(cur - ideal)) / unit * 0.45;
      if (d > 0) taxU -= 0.03 * d * (T.unit === 'pp' ? 1 : 0.1);
    });
    let it = Math.tanh(-ax.fis * L * 1.2 + taxU) - (ax.soc / 1.3) * (b._soc || 0);
    if (b.kind === 'cr' || b.kind === 'budget') it *= 0.6;
    it = U.clamp(it, -1, 1);
    // 2. District demographics & local industry impact.
    let di = 0;
    const indImpact = {};
    GR.INDUSTRIES.forEach((x) => { indImpact[x.k] = -(prov.reg[x.k] || 0) * 0.4; });
    const tx = prov.tax || {};
    if (tx.carbon) { const d = tx.carbon / 50; indImpact.energy -= d; indImpact.manufacturing -= d * 0.5; indImpact.ag -= d * 0.3; indImpact.logistics -= d * 0.3; }
    if (tx.corp) { indImpact.finance -= tx.corp / 3 * 0.6; indImpact.tech -= tx.corp / 3 * 0.6; indImpact.manufacturing -= tx.corp / 3 * 0.4; }
    if (tx.capg) indImpact.finance -= tx.capg / 4;
    if (tx.sev) indImpact.energy -= tx.sev / 3;
    Object.entries(prov.ap || {}).forEach(([k, v]) => {
      const a = F.ag.find((x) => x.k === k);
      if (!a) return;
      const C = GR.SPEND_CATS[a.cat] || {};
      const amt = ((v.opex || 0) + (v.capex || 0)) / size * 15;
      Object.entries(C.ind || {}).forEach(([ik, w]) => { indImpact[ik] += amt * w; });
    });
    Object.entries(prov.prem || {}).forEach(([k, v]) => { const a = F.ag.find((x) => x.k === k); if (a) { const amt = a.capex * v / 100 / size * 15; indImpact.manufacturing += amt * 1.5; indImpact.construction += amt; } });
    (prov.prog || []).forEach((x) => { const amt = x.amt / size * 15; Object.entries(x.ind || {}).forEach(([ik, w]) => { if (indImpact[ik] != null) indImpact[ik] += amt * w; }); });
    Object.values(prov.sale || {}).forEach(() => { indImpact.finance += 0.05; });
    GR.INDUSTRIES.forEach((x) => { di += (cx.ind[x.k] || 0) * indImpact[x.k] * 4; });
    if (Object.keys(prov.sale || {}).length) di -= pr.union / 40;
    if (Object.keys(prov.prem || {}).length) di += pr.union / 60;
    Object.values(prov.fee || {}).forEach((v) => { di -= v / size * 10; });
    const rich = pr.income / 75 - 1;
    di += -(tx.high || 0) * 0.08 * (0.3 + rich * 2) - (tx.mid || 0) * 0.12 - (tx.low || 0) * 0.08 * (1 + pr.poverty / 15) - (tx.sales || 0) * 0.12 * (1 + pr.poverty / 20) - (tx.prop || 0) * 0.02 - (tx.payroll || 0) * 0.1;
    // Entitlements: poorer and older districts gain more from expansions.
    if (an && an.entByProg) Object.entries(an.entByProg).forEach(([k, d]) => {
      const rel = d / size * 20;
      const tilt = ['ss', 'medicare'].includes(k) ? pr.age / 40 : ['medicaid', 'snap', 'tanf', 'eitc', 'ctc', 'aca', 'meals', 'vouchers', 'childcare'].includes(k) ? pr.poverty / 12 : 1;
      di += rel * tilt * 0.8 * (p.party === 'R' ? 0.5 : 1);
    });
    // New programs: who they reach.
    (prov.prog || []).forEach((x) => {
      const tilt = { poverty: pr.poverty / 12, urban: 0.4 + pr.urban / 80, rural: 0.4 + (100 - pr.urban) / 80, age: pr.age / 40, young: 1.4 - pr.age / 80, vets: pr.veterans / 7 }[x.tilt] || 1;
      di += x.amt / size * 18 * U.clamp(tilt, 0.3, 2) * (p.party === 'R' ? 0.6 : 1);
    });
    // Crises: districts reward bills that ease the crises they live with.
    if (an && an.crises) Object.entries(an.crises).forEach(([k, d]) => { di += Math.tanh(-d / 25) * (exposure(s, p, J, k, cx) / 100) * GR.CRISIS_TYPES[k].sal * 0.5; });
    // Policy riders: constituent opinion.
    (prov.policy || []).forEach((x) => {
      const pol = GR.POLICY[x.k];
      const lvl = GR.lvlOf(b.jur);
      const id = GR.elect.ideal(pr, 'I', pol) * 0.5 + GR.elect.ideal(pr, p.party, pol) * 0.5;
      di += (Math.abs(id - GR.optScore(pol, J.law[x.k], lvl)) - Math.abs(id - GR.optScore(pol, x.to, lvl))) * 0.35;
    });
    // Budgets: how the member's region fares against current services.
    if (prov.bud && GR.budget) di += GR.budget.memberScore(s, p, b) * 2;
    di = Math.tanh(di);
    // 3. Agency efficiency / audit ratings and fiscal soundness.
    let effN = 0, effD = 0;
    Object.entries(prov.ap || {}).forEach(([k, v]) => {
      const a = F.ag.find((x) => x.k === k);
      if (!a) return;
      const amt = (v.opex || 0) + (v.capex || 0);
      // Money for an agency already far above its need reads as waste; starving one below need reads as neglect.
      const fr = FX().agRatio(F, a, 'all');
      effN += amt * ((a.eff - 55) / 30 - 1.5 * Math.max(0, fr - 1.15) + Math.max(0, 0.85 - fr));
      effD += Math.abs(amt);
    });
    const yrs = an ? an.years : 5;
    const fiscal = an ? -Math.tanh((an.cumDef / Math.max(1, size * yrs)) * 10) * (0.4 + 0.8 * cx.hawk) + U.clamp(an.ratingD / 10, -0.3, 0.3) : 0;
    let ae = effD ? 0.6 * (effN / effD) + 0.4 * fiscal : fiscal;
    ae = U.clamp(ae, -1, 1);
    // 4. Political capital & earmarks.
    let pc = 0;
    const myEar = U.sum((prov.ear || []).filter((e) => e.who === p.id), (e) => e.amt);
    if (myEar) pc += Math.tanh(myEar / (size * (J.k === 'nation' ? 0.000006 : 0.00025))) * 0.9;
    const otherEar = U.sum(prov.ear || [], (e) => e.amt) - myEar;
    if (otherEar) pc -= cx.hawk * 0.15 * Math.tanh(otherEar / (size * (J.k === 'nation' ? 0.00003 : 0.001)));
    const spon = s.pols[b.spon];
    if (spon && spon.isPlayer) pc += G().rel(s, p.id) / 110 + ((s.pols.me.respect || 20) - 40) / 120;
    else if (spon) pc += spon.party === p.party ? 0.08 : -0.04;
    if (b.pledges[p.id]) pc += 1.2;
    if (b.endorse && b.endorse.body === b.body && b.endorse.party === p.party) pc += b.endorse.w;
    if (b.sweet[p.id]) pc += b.sweet[p.id];
    // Party whip, weakened by rebellion when crises go unaddressed.
    const reb = rebellion(s, p, J, cx);
    const whip = partyLine(s, b, p.party);
    pc += whip * 0.45 * (1 - reb);
    const ex = G().execOf(s, b.jur);
    if (ex && ex.party === p.party && (b.spon === ex.id || b.kind === 'budget')) pc -= reb * 0.4;
    // The executive's public position moves their party's lawmakers.
    if (ex && ex.id !== p.id) {
      if (b.execEndorse) pc += ex.party === p.party ? 0.06 : -0.02;
      if (b.vetoThreat) pc += ex.party === p.party ? -0.08 : 0.01;
    }
    pc = U.clamp(pc, -1, 1);
    // Economic development deals and megaproject authorizations.
    if (b.dev && GR.develop) { const x = GR.develop.voteTerms(s, p, b); it = U.clamp(it + x.it, -1, 1); di = U.clamp(di + x.di, -1, 1); ae = U.clamp(x.ae, -1, 1); pc = U.clamp(pc + x.pc, -1, 1); }
    const score = WEIGHTS.it * it + WEIGHTS.di * di + WEIGHTS.ae * ae + WEIGHTS.pc * pc;
    return { it, di, ae, pc, score, reb };
  }

  // Party leadership's position on a bill: +1 support, -1 oppose, 0 free vote.
  function partyLine(s, b, party) {
    b._line = b._line || {};
    if (b._line[party] != null) return b._line[party];
    const spon = s.pols[b.spon];
    const L = leanOf(s, b);
    let v = party === 'D' ? L : -L;
    if (spon) v += b.dev ? (spon.party === party ? 0.3 : -0.05) : spon.party === party ? 0.6 : -0.3;
    if (b.kind === 'cr') v += 0.5;
    if (b.kind === 'budget') { const ex = G().execOf(s, b.jur); if (ex) v += ex.party === party ? 0.7 : -0.4; }
    const line = v > 0.2 ? 1 : v < -0.2 ? -1 : 0;
    b._line[party] = line;
    return line;
  }

  // Caucus rebellion: members break with leadership when crises at home worsen.
  function rebellion(s, p, J, cx) {
    const F = J.F;
    let r = 0;
    Object.entries(F.crises).forEach(([k, c]) => {
      const rise = c.s - c.s0 + (c.hist.length >= 4 ? c.s - c.hist[c.hist.length - 4] : 0);
      if (rise > 0) r += (rise / 30) * (exposure(s, p, J, k, cx) / 100) * GR.CRISIS_TYPES[k].rebel;
    });
    const vd = FX().dissatisfaction(J);
    r += Math.max(0, vd - (F.vd0 || 50)) / 60;
    if (p.caucus === 'freedom' || p.caucus === 'prog') r += 0.1;
    // Saturates: many slowly worsening crises raise the risk, but never to unanimous revolt.
    return U.clamp(0.75 * Math.tanh(r / 1.4), 0, 0.85);
  }

  // ---------- Analysis ----------
  function analysis(s, b) {
    const J = s.jur[b.jur];
    const an = FX().analyze(s, J, b);
    // Entitlement cost changes by program (first year).
    const c0 = FX().entCosts(J);
    const c = FX().cloneJ(J);
    Object.entries(b.prov.ent || {}).forEach(([k, ps]) => { if (c.F.ent[k]) Object.assign(c.F.ent[k].p, ps); });
    const c1 = FX().entCosts(c);
    an.entByProg = {};
    Object.keys(b.prov.ent || {}).forEach((k) => { if (c0[k]) an.entByProg[k] = c1[k].cost - c0[k].cost; });
    an.dist = FX().taxDist(J, b.prov.tax);
    b.an = an;
    b._lean = null; b._line = null;
    return an;
  }

  // Roll call across a chamber. Returns per-member scores and totals.
  function roll(s, b, bodyKey, opts = {}) {
    let ms = W().members(s, bodyKey);
    if (opts.only) { const set = new Set(opts.only); ms = ms.filter((m) => set.has(m.id)); }
    const rows = [];
    ms.forEach((p) => {
      if (p.isPlayer) return;
      const c = components(s, p, b);
      rows.push({ id: p.id, party: p.party, caucus: p.caucus || W().caucusOf(p).k, c });
    });
    // Caucus blocs: members move toward their caucus's average position.
    const byC = {};
    rows.forEach((r) => { const k = r.party + r.caucus; (byC[k] || (byC[k] = [])).push(r.c.score); });
    const mean = {};
    Object.entries(byC).forEach(([k, arr]) => { mean[k] = U.avg(arr); });
    let y = 0, n = 0;
    rows.forEach((r) => {
      const final = 0.72 * r.c.score + 0.28 * mean[r.party + r.caucus] + (opts.noise === false ? 0 : U.gauss() * 0.025) + (opts.bias || 0);
      r.final = final;
      r.v = final > 0 ? 'y' : 'n';
      r.v === 'y' ? y++ : n++;
    });
    const me = s.pols.me;
    if (G().myBody(s) === bodyKey && (!opts.only || opts.only.includes('me'))) {
      const mv = opts.only ? opts.myVote : opts.myVote || b.my[bodyKey];
      if (mv === 'y') y++; else if (mv === 'n') n++;
    }
    return { rows, y, n, total: ms.length };
  }

  // Votes needed in a chamber for a stage.
  function needed(s, b, bodyKey, stage) {
    const total = W().members(s, bodyKey).length;
    if (stage === 'cloture') return 60;
    if (stage === 'override') return Math.ceil(total * 2 / 3);
    return Math.floor(total / 2) + 1;
  }
  const needsCloture = (b) => b.body === 'ussenate' && b.kind !== 'reconciliation';

  // ---------- Pipeline ----------
  function toFloor(s, b, fast) {
    b.stage = needsCloture(b) ? 'cloture' : 'floor';
    b.due = s.week + (fast || b.spon === 'me' ? (fast ? 0 : 1) : U.randInt(1, 2));
    b.task = G().myBody(s) === b.body ? 'vote' : null;
  }
  function stepBill(s, J, b) {
    if (!OPEN(b) || s.week < b.due) return;
    const Bd = s.bodies[b.body];
    if (!Bd) { kill(s, b, 'had no chamber to consider it'); return; }
    if (!G().inSession(s, b.body) && b.stage !== 'exec' && !['budget', 'cr', 'supplemental'].includes(b.kind)) { b.due = s.week + 1; return; }
    if (!b.an) analysis(s, b);
    if (b.stage === 'committee') {
      const cm = Bd.comm[b.comm];
      const chair = cm && s.pols[cm.chair];
      const must = ['budget', 'cr'].includes(b.kind);
      if (chair && chair.isPlayer) {
        // Agenda control: hearing and markup, fast-track, hold, or table.
        let d = b.my['comm' + b.body];
        if (!d && b.spon === 'me') d = b.my['comm' + b.body] = 'f';
        if (!d) { b.task = 'comm'; b.due = s.week + 1; return; }
        if (must && (d === 'n' || d === 'h')) d = 'y';
        if (d === 'n') { kill(s, b, `was tabled by you as chair of ${committeeName(s, b)}`); return; }
        if (d === 'h') {
          b.task = null; b.held = true;
          if (s.week - b.w > 10) kill(s, b, `was buried in ${committeeName(s, b)}: you never scheduled it`);
          else b.due = s.week + 1;
          return;
        }
        b.task = null;
        if (d === 'f') { b.endorse = { party: chair.party, body: b.body, w: 0.08 }; toFloor(s, b, true); return; }
      } else if (chair && b.leaderPush === b.body) {
        // Leadership cut a deal with the executive: the chair moves it.
        b.agreed[chair.id] = true;
      } else if (chair && !b.agreed[chair.id]) {
        const c = components(s, chair, b);
        // Chairs usually hear their own caucus's bills; the other side's need real support.
        const sp = s.pols[b.spon];
        let bar = b.spon === 'me' ? 0.02 : sp && sp.party === chair.party ? -0.09 : -0.02;
        // A vice chair in your corner (or holding the post yourself) softens the chair.
        if (cm.vice && (cm.vice === 'me' ? b.spon === 'me' : b.agreed[cm.vice])) bar -= 0.03;
        if (c.score < bar && !must) {
          b.blockedBy = chair.id;
          if (b.spon === 'me' && !b.warnedChair) { b.warnedChair = true; GR.sim.msgInbox(s, 'Committee chair is blocking your bill', `${W().fullName(chair)} (${chair.party}), chair of ${committeeName(s, b)}, will not schedule a hearing on your ${b.title} (score ${c.score.toFixed(2)}).${GR.comm.isMember(s, b.body, b.comm, 'me') ? '' : ' You do not sit on that committee, so you are at the chair\'s mercy.'} Lobby the chair for a hearing, cut a deal in Negotiations, or file a discharge petition.`); }
          if (s.week - b.w > 10) kill(s, b, `died in ${committeeName(s, b)} when chair ${W().fullName(chair)} refused to schedule it`);
          else b.due = s.week + 1;
          return;
        }
      }
      // Hearing held: the bill goes to markup, where committee members amend it.
      b.blockedBy = null;
      b.stage = 'markup';
      b.markupW = s.week;
      b.due = s.week + 1;
      if (b.prov.bud && GR.budget) { if (chair && !chair.isPlayer) GR.budget.chairMark(s, b, chair); if (GR.budget.caucusCheck) GR.budget.caucusCheck(s, b); } else GR.comm.chairsMark(s, b);
      if (GR.comm.isMember(s, b.body, b.comm, 'me')) {
        if (b.spon === 'me' || (chair && chair.isPlayer)) b.my['cv' + b.body] = 'y';
        else b.task = 'cvote';
      }
      return;
    }
    if (b.stage === 'markup') {
      const cm = Bd.comm[b.comm];
      const must = ['budget', 'cr'].includes(b.kind);
      if (GR.comm.isMember(s, b.body, b.comm, 'me') && !b.my['cv' + b.body]) {
        if (s.settings.autoVote) b.my['cv' + b.body] = components(s, s.pols.me, b).score > 0 ? 'y' : 'n';
        else if (s.week < b.markupW + 3) { b.task = 'cvote'; b.due = s.week + 1; return; }
        else b.my['cv' + b.body] = 'a';
      }
      const r = GR.comm.reportVote(s, b);
      const need = Math.floor((r.y + r.n) / 2) + 1;
      record(s, b, b.body, r, 'committee', need);
      b.task = null;
      if (r.y < need && !must) { kill(s, b, `was voted down in ${committeeName(s, b)}, ${r.y}-${r.n}`); return; }
      const chair = cm && s.pols[cm.chair];
      if (chair && !b.endorse) b.endorse = { party: chair.party, body: b.body, w: 0.03 };
      toFloor(s, b, false);
      return;
    }
    if (b.stage === 'cloture') {
      const r = roll(s, b, b.body);
      const need = needed(s, b, b.body, 'cloture');
      record(s, b, b.body, r, 'cloture', need);
      if (r.y < need) {
        b.filibustered = (b.filibustered || 0) + 1;
        if (b.spon === 'me' && b.filibustered === 1) GR.sim.msgInbox(s, 'Filibustered', `Cloture failed on your ${b.title}, ${r.y}-${r.n} (60 needed). Negotiate with wavering senators, convert fiscal provisions into a budget reconciliation bill, or try again.`);
        if (b.filibustered >= (b.kind === 'cr' || b.kind === 'budget' ? 99 : 3)) { kill(s, b, `was filibustered (${r.y}-${r.n} on cloture)`); return; }
        b.due = s.week + 2;
        return;
      }
      b.stage = 'floor';
      b.due = s.week;
      return;
    }
    if (b.stage === 'floor') {
      if (G().myBody(s) === b.body && !b.my[b.body]) {
        b.my[b.body] = s.settings.autoVote ? (components(s, s.pols.me, b).score > 0 ? 'y' : 'n') : 'a';
        if (b.my[b.body] === 'a') G().addRespect(s, -0.3);
        afterMyVote(s, b, b.body, b.my[b.body]);
      }
      const r = roll(s, b, b.body);
      const need = needed(s, b, b.body, 'floor');
      record(s, b, b.body, r, 'floor', need);
      b.task = null;
      if (r.y < need && b.prov.bud && GR.budget && (b.reworks || 0) < 5) { GR.budget.rework(s, b, r); b.due = s.week + 1; if (G().myBody(s) === b.body) { delete b.my[b.body]; b.task = 'vote'; } return; }
      if (r.y < need) { kill(s, b, `failed in the ${GR.BODIES[b.body].name}, ${r.y}-${r.n}`); return; }
      if (GR.xneg) GR.xneg.afterChamber(s, b);
      const bs = G().bodiesOf(s, b.jur);
      const next = bs[bs.indexOf(b.body) + 1];
      if (next) { b.body = next; b.stage = 'committee'; b.comm = committeeFor(s, b); b.due = s.week + 1; b.warnedChair = false; b.held = false; b.agreed = b.agreed || {}; return; }
      b.stage = 'exec';
      b.due = s.week + 1;
      const ex = G().execOf(s, b.jur);
      if (ex && ex.isPlayer) b.task = 'sign';
      return;
    }
    if (b.stage === 'exec') {
      const ex = G().execOf(s, b.jur);
      let sign;
      if (!ex) sign = true;
      else if (ex.isPlayer) { if (!b.my.sign) { b.my.sign = 'y'; } sign = b.my.sign === 'y'; if (sign && b.prov.bud && b.my.itemVeto && b.my.itemVeto.length && GR.budget) GR.budget.applyItemVetoes(s, b, b.my.itemVeto); }
      else if (GR.xneg) {
        // Governors with a line-item veto strike lines the legislature raised.
        if (b.prov.bud && GR.budget && ex && !ex.isPlayer) { const keys = GR.budget.aiItemVeto(s, b, ex); if (keys.length) { const saved = GR.budget.applyItemVetoes(s, b, keys); GR.sim.news(s, `${W().fullName(ex)} line-item vetoed ${keys.length} budget item${keys.length === 1 ? '' : 's'} (${U.money(saved)}): ${b.itemVetoes.slice(0, 3).join(', ')}.`, 'gov'); } }
        sign = GR.xneg.decide(s, b, ex);
      }
      else { const c = components(s, ex, b); sign = c.score > -0.06 || b.kind === 'cr' || (b.kind === 'budget' && c.score > -0.15); }
      b.task = null;
      if (sign) { enact(s, J, b); return; }
      // Veto override: two-thirds of every chamber.
      const over = G().bodiesOf(s, b.jur).every((bk) => roll(s, b, bk).y >= needed(s, b, bk, 'override'));
      if (over) { b.override = true; enact(s, J, b); GR.sim.news(s, `Veto overridden: the ${b.title} becomes law.`, 'gov'); return; }
      b.stage = 'vetoed'; b.done = s.week;
      GR.sim.news(s, `${ex ? W().fullName(ex) : 'The executive'} vetoed the ${b.title}.`, 'gov');
      if (b.spon === 'me') GR.sim.msgInbox(s, 'Your bill was vetoed', `${W().fullName(ex)} vetoed your ${b.title}. The override vote fell short of two-thirds.`);
      if (b.kind === 'budget') budgetFailed(s, b.jur);
    }
  }

  function record(s, b, bodyKey, r, stage, need) {
    const v = { body: bodyKey, stage, y: r.y, n: r.n, need, pass: r.y >= need, w: s.week };
    b.votes.push(v);
    // Keep full roll calls for bills you care about.
    if (b.spon === 'me' || G().myBody(s) === bodyKey || b.kind === 'budget') {
      s.rolls = s.rolls || [];
      s.rolls.unshift({ id: U.uid('rc'), bill: b.id, title: b.title, body: bodyKey, stage, y: r.y, n: r.n, need, w: s.week, my: b.my[bodyKey] || null,
        rows: r.rows.map((x) => [x.id, x.v, U.round(x.final, 3), U.round(x.c.it, 2), U.round(x.c.di, 2), U.round(x.c.ae, 2), U.round(x.c.pc, 2), U.round(x.c.reb, 2)]) });
      if (s.rolls.length > 8) s.rolls.pop();
      if (b.spon === 'me') s.lastRoll = s.rolls[0].id;
    }
  }

  function kill(s, b, why) {
    if (b.dev && GR.develop) GR.develop.onKill(s, b);
    b.stage = 'dead'; b.why = why; b.done = s.week; b.task = null;
    if (b.spon === 'me') { GR.sim.msgInbox(s, 'Your bill failed', `Your ${b.title} ${why}.`); G().addRespect(s, -1); }
    if (b.kind === 'budget') budgetFailed(s, b.jur);
    if (b.kind === 'cr') crFailed(s, b.jur);
  }

  function enact(s, J, b) {
    if (b.dev && GR.develop) GR.develop.onEnact(s, b);
    // Spending "subject to appropriation" waits for the budget.
    if (b.prov.approp && GR.budget && GR.budget.has(b.jur)) GR.budget.addRequest(s, s.jur[b.jur], b);
    b.stage = 'law'; b.done = s.week;
    FX().apply(J, b);
    (b.prov.prog || []).forEach((x) => { const p = (J.F.programs || []).slice().reverse().find((q) => q.name === x.name && !q.since); if (p) { p.since = s.week; p.spon = b.spon; p.law = b.title; } });
    (b.prov.policy || []).forEach((x) => { J.law[x.k] = x.to; });
    J.laws.unshift({ w: s.week, t: `${b.title}${b.sum ? ': ' + b.sum : ''}`, spon: b.spon });
    if (J.laws.length > 80) J.laws.pop();
    GR.sim.news(s, `${J.name}: the ${b.title} is now law.`, 'gov');
    if (b.prov.bud && GR.budget) GR.budget.onEnact(s, J, b);
    if (b.kind === 'budget' || b.kind === 'cr') { J.fy = J.fy || {}; J.fy.passed = fiscalYear(s, J.k); J.F.shutdown = 0; if (J.fy.shutdownSince) { GR.sim.news(s, `The ${J.name} government shutdown is over after ${s.week - J.fy.shutdownSince} weeks.`, 'gov'); J.fy.shutdownSince = null; } }
    if (b.kind === 'reconciliation') { s.recon = s.recon || {}; s.recon[fiscalYear(s, 'nation')] = true; }
    if (b.spon === 'me' && GR.power) (b.prov.prog || []).forEach((x) => Object.entries(x.bases || {}).forEach(([k, v]) => GR.power.shift(s, k, v)));
    if (b.spon === 'me') {
      s.stats.billsPassed++;
      G().addRespect(s, 3);
      s.pols.me.pp += 15;
      GR.sim.log(s, `Your ${b.title} became law.`);
      GR.sim.msgInbox(s, 'Your bill is law!', `The ${b.title} was signed into law.\n\n${describe(s, b).map((x) => '• ' + x).join('\n')}`);
    }
    (b.deals || []).forEach(() => {});
  }

  const fiscalYear = (s, jur) => { const y = U.yearOf(s.week); return s.week >= fyStartWeek(s, jur, y) ? y + 1 : y; };

  function afterMyVote(s, b, bodyKey, v) {
    s.stats.votesCast++;
    const sp = s.pols[b.spon];
    if (sp && b.spon !== 'me') G().addRel(s, b.spon, v === 'y' ? 6 : v === 'n' ? -6 : -1);
    (s.deals || []).forEach((d) => {
      if (d.bill !== b.id) return;
      // A promise to the whip can be a promise to vote no.
      if (d.whip != null) { if ((d.whip > 0) === (v === 'y') && v !== 'a') { d.kept = true; G().addRel(s, d.who, 6); } else { d.broken = true; G().addRel(s, d.who, -30); G().addRespect(s, -5); s.whipNo = (s.whipNo || 0) + 2; GR.sim.msgInbox(s, 'You crossed the whip', `You told ${W().fullName(s.pols[d.who])} you'd vote with the caucus on the ${b.title}, then didn't. Leadership will remember at steering time.`); } return; }
      if (v === 'y') { d.kept = true; G().addRel(s, d.who, 8); G().addRespect(s, 1); }
      else { d.broken = true; G().addRel(s, d.who, -40); G().addRespect(s, -8); GR.sim.msgInbox(s, 'You broke a deal', `${W().fullName(s.pols[d.who])} is furious that you went back on your word. Word gets around the caucus.`); }
    });
    const me = s.pols.me;
    // You told your regional caucus you'd hold out on this budget.
    if (b.my.hold != null && v === 'y' && b.prov.bud && GR.budget) {
      const reg = GR.budget.regional(s.jur[b.jur], b.prov.bud)[b.my.hold];
      if (reg < -0.006) { s.caucusRel = s.caucusRel || {}; s.caucusRel[b.my.hold] = (s.caucusRel[b.my.hold] || 0) - 25; G().addRespect(s, -3); if (GR.power) GR.power.shift(s, 'local', -6); GR.sim.msgInbox(s, 'Your caucus feels betrayed', `You promised the ${GR.budget.REGIONS[b.jur][b.my.hold][1]} Caucus you would hold out, then voted for the ${b.title} while their districts were still short. They will remember when you need them.`); }
    }
    const line = partyLine(s, b, me.party);
    if (line) {
      const withParty = (line > 0) === (v === 'y');
      me.standing = U.clamp(me.standing + (withParty ? 0.3 : -1.2) * (me.traits.includes('loyal') ? 1.4 : 1), 0, 100);
      if (v !== 'a') GR.comm.onPartyVote(s, bodyKey, withParty);
      W().members(s, bodyKey).forEach((p) => { if (p.party === me.party && !p.isPlayer && !p.fed) G().addRel(s, p.id, withParty ? 0.3 : -0.6); });
    }
    // Constituents judge you on what the bill does for your district.
    const c = components(s, me, b);
    if (v !== 'a') {
      const agree = (v === 'y') === (c.di > 0);
      me.app = U.clamp(me.app + (agree ? 0.4 : -0.7) * Math.min(1.5, Math.abs(c.di) * 3 + 0.3), 1, 99);
      s.voteLog = s.voteLog || [];
      s.voteLog.unshift({ w: s.week, t: b.title, v, agree });
      if (s.voteLog.length > 80) s.voteLog.pop();
    }
  }

  // ---------- Player actions ----------
  function tasks(s) {
    const out = [];
    allBills(s).forEach((b) => {
      if (!OPEN(b)) return;
      if (b.task === 'vote' && G().myBody(s) === b.body && !b.my[b.body] && ['floor', 'cloture'].includes(b.stage)) out.push({ b, kind: 'vote' });
      else if (b.task === 'comm' && b.stage === 'committee' && !b.my['comm' + b.body]) out.push({ b, kind: 'comm' });
      else if (b.task === 'cvote' && b.stage === 'markup' && !b.my['cv' + b.body] && GR.comm.isMember(s, b.body, b.comm, 'me')) out.push({ b, kind: 'cvote' });
      else if (b.task === 'sign' && !b.my.sign) out.push({ b, kind: 'sign' });
    });
    return out;
  }

  function decide(s, id, kind, v) {
    const b = findBill(s, id);
    if (!b) return { ok: false };
    if (kind === 'vote') { b.my[b.body] = v; afterMyVote(s, b, b.body, v); }
    else if (kind === 'comm') {
      b.my['comm' + b.body] = v;
      if (b.spon && b.spon !== 'me') G().addRel(s, b.spon, v === 'y' || v === 'f' ? 8 : v === 'h' ? -4 : -10);
      b.due = s.week;
      if (v === 'f' || v === 'n') stepBill(s, s.jur[b.jur], b);
    } else if (kind === 'cvote') {
      b.my['cv' + b.body] = v;
      b.task = null;
      if (b.spon && b.spon !== 'me' && v !== 'a') G().addRel(s, b.spon, v === 'y' ? 4 : -4);
    }
    else if (kind === 'sign') {
      b.my.sign = v;
      const c = components(s, s.pols.me, b);
      const me = s.pols.me;
      me.app = U.clamp(me.app + ((v === 'y') === (c.di > 0) ? 0.8 : -1.2), 1, 99);
      if (b.spon && b.spon !== 'me') G().addRel(s, b.spon, v === 'y' ? 10 : -15);
      // Promises made to legislative leaders.
      const pr = (s.promises || {})[b.id];
      if (pr) {
        delete s.promises[b.id];
        if (v === 'y') { G().addRel(s, pr, 10); G().addRespect(s, 1); }
        else { G().addRel(s, pr, -35); G().addRespect(s, -6); GR.sim.msgInbox(s, 'You broke your word', `You promised ${W().fullName(s.pols[pr])} you would sign the ${b.title}, then vetoed it. Leadership will remember.`); }
      }
    }
    return { ok: true };
  }

  // Cost in political points to introduce a bill.
  function introCost(s, b) {
    const me = s.pols.me;
    const lvl = me.seat ? GR.OFFICES[s.seats[me.seat].off].level : 1;
    const p = b.prov;
    const n = provCount(p);
    let c = (8 + n * 4) * (0.6 + lvl * 0.35);
    if (b.kind === 'reconciliation') c *= 1.5;
    if (me.traits.includes('wonk')) c *= 0.7;
    c *= 1 - (GR.cabinet ? GR.cabinet.billDiscount(s) : 0);
    return Math.round(c);
  }

  function validate(s, b) {
    const J = s.jur[b.jur];
    const p = b.prov;
    const n = provCount(p);
    if (!n) return 'The bill does not change anything yet.';
    if (b.kind === 'reconciliation') {
      if (b.jur !== 'nation') return 'Budget reconciliation only exists in Congress.';
      if (p.policy.length || Object.keys(p.reg).length || Object.keys(p.prem || {}).length) return 'Reconciliation bills may only change taxes, spending and entitlements (the Byrd rule strikes policy and regulatory provisions).';
      if ((s.recon || {})[fiscalYear(s, 'nation')]) return 'Congress has already used reconciliation this fiscal year.';
    }
    if (!G().bodiesOf(s, b.jur).length) return 'There is no legislature at this level.';
    // States and cities must balance: new costs need an offset, or wait for the budget.
    if ((J.k === 'state' || J.k === 'city') && b.kind === 'regular' && !p.approp) {
      const cost = GR.drafting ? GR.drafting.staticCost(s, J, p) : 0;
      if (cost > FX().totals(J).spend * 0.0002) return `Balanced-budget requirement: this bill adds ${U.money(cost)} a year with no way to pay for it. Add an offset, or make it subject to appropriation.`;
    }
    if (b.kind === 'budget' && p.bud && GR.budget) { const bal = GR.budget.balance(J, p.bud); if (bal.gap < -FX().totals(J).spend * 0.001) return `The budget is ${U.money(-bal.gap)} out of balance. Cut, raise revenue or draw reserves before submitting.`; }
    return null;
  }

  function introduce(s, draft) {
    const me = s.pols.me;
    const jur = G().myJur(s);
    if (!jur) return { ok: false, msg: 'You need to hold office to introduce legislation.' };
    const b = newBill(s, jur, { title: draft.title || autoTitle(s, jur, draft.prov), kind: draft.kind || 'regular', prov: JSON.parse(JSON.stringify(draft.prov)), spon: 'me' });
    const err = validate(s, b);
    if (err) return { ok: false, msg: err };
    const cost = introCost(s, b);
    if (me.pp < cost) return { ok: false, msg: `You need ${cost} political points.` };
    if (s.hoursLeft < 6) return { ok: false, msg: 'Drafting and filing a bill takes 6 hours.' };
    me.pp -= cost;
    s.hoursLeft -= 6;
    const seat = s.seats[me.seat];
    if (GR.OFFICES[seat.off].exec) b.agenda = true;
    b.sum = describe(s, b).slice(0, 3).join('; ');
    analysis(s, b);
    // A leader who owes you puts their weight behind this bill.
    const fav = GR.lead && GR.lead.favor(s, 'bill');
    if (fav) { b.leaderPush = b.body; const cm = s.bodies[b.body] && s.bodies[b.body].comm[b.comm]; if (cm && cm.chair) b.agreed[cm.chair] = true; GR.lead.useFavor(s); GR.sim.msgInbox(s, 'A favor repaid', `${W().fullName(s.pols[fav.who])} is putting leadership's weight behind your ${b.title}: the chair will hear it and it will get floor time.`); }
    (s.jur[jur].bills || (s.jur[jur].bills = [])).push(b);
    s.stats.billsWritten++;
    me.sk.policy = U.clamp(me.sk.policy + (U.chance(0.4) ? 1 : 0), 0, 99);
    return { ok: true, msg: `Introduced the ${b.title}. Referred to ${committeeName(s, b)}.`, bill: b };
  }

  function committeeName(s, b) {
    if (!GR.BODIES[b.body]) return 'the committee';
    return `the ${GR.BODIES[b.body].name} ${GR.comm.nameOf(b.body, b.comm)} Committee`;
  }

  // Who you can negotiate with on a bill: the blocking chair, floor leaders, wavering members.
  function counterparties(s, b) {
    const out = [];
    const Bd = s.bodies[b.body];
    if (!Bd) return out;
    const cm = Bd.comm[b.comm];
    const add = (id, role) => { const p = s.pols[id]; if (p && !p.isPlayer && !out.some((x) => x.id === id)) out.push({ id, role, c: components(s, p, b) }); };
    if (cm && cm.chair) add(cm.chair, 'Committee chair');
    if (cm && cm.vice) add(cm.vice, 'Vice chair');
    if (cm && cm.rank) add(cm.rank, 'Ranking member');
    ['speaker', 'majleader', 'minleader', 'president'].forEach((k) => { if (Bd.lead[k]) add(Bd.lead[k], GR.LEADERSHIP[b.body].find((x) => x.k === k).name); });
    // Swing votes: the members closest to flipping.
    const r = roll(s, b, b.body, { noise: false });
    r.rows.filter((x) => x.v === 'n').sort((a, c) => c.final - a.final).slice(0, 10).forEach((x) => add(x.id, 'Swing vote'));
    return out;
  }

  // Backroom negotiation with one member.
  function negotiate(s, billId, pid, kind, arg) {
    const b = findBill(s, billId);
    const p = s.pols[pid];
    const me = s.pols.me;
    if (!b || !p || !OPEN(b)) return { ok: false, msg: 'That bill is no longer moving.' };
    if (kind === 'hearing') return GR.comm.lobbyHearing(s, billId);
    if (kind === 'earmark' && !canEarmark(s, b)) return { ok: false, msg: `Earmarks are written in markup. Only members of ${committeeName(s, b)} (or appropriators and floor leaders) can add them while the bill is in committee.` };
    if (s.hoursLeft < 2) return { ok: false, msg: 'Negotiations take 2 hours.' };
    const J = s.jur[b.jur];
    const before = components(s, p, b).score;
    s.hoursLeft -= 2;
    let msg = '';
    if (kind === 'earmark') {
      const amt = +arg || Math.round(budgetSize(J) * (J.k === 'nation' ? 0.000008 : 0.0003));
      const ag = pickEarmarkAgency(J);
      const proj = earmarkName(s, p, ag);
      b.prov.ear.push({ who: pid, ag: ag.k, amt, proj });
      analysis(s, b);
      msg = `Added a ${U.money(amt)} earmark: ${proj}.`;
    } else if (kind === 'capital') {
      const cost = Math.round(15 + (GR.OFFICES[s.seats[me.seat].off].level) * 6);
      if (me.pp < cost) { s.hoursLeft += 2; return { ok: false, msg: `Costs ${cost} political points.` }; }
      me.pp -= cost;
      b.sweet[pid] = U.clamp((b.sweet[pid] || 0) + 0.35 + me.sk.charisma / 400, 0, 1);
      msg = `You spent ${cost} political points leaning on ${W().fullName(p)}.`;
    } else if (kind === 'trade') {
      const theirs = allBills(s).find((x) => x.spon === pid && OPEN(x) && x.body === G().myBody(s));
      s.deals = s.deals || [];
      if (theirs) { s.deals.push({ who: pid, bill: theirs.id, w: s.week }); msg = `Deal: you will vote yes on their ${theirs.title}.`; }
      else { s.deals.push({ who: pid, bill: null, future: true, w: s.week }); msg = 'Deal: you owe them a vote on their next priority.'; }
      b.sweet[pid] = U.clamp((b.sweet[pid] || 0) + 0.6, 0, 1.2);
      G().addRel(s, pid, 4);
    } else if (kind === 'amend') {
      const ch = amendFor(s, b, p);
      if (!ch) { s.hoursLeft += 2; return { ok: false, msg: 'They have no amendment to offer.' }; }
      ch.apply();
      b._lean = null; b._line = null;
      analysis(s, b);
      b.sum = describe(s, b).slice(0, 3).join('; ');
      msg = `Accepted their amendment: ${ch.label}.`;
    } else if (kind === 'pledge') {
      const c = components(s, p, b);
      const pr = U.clamp(0.45 + c.score * 2 + G().rel(s, pid) / 150, 0.03, 0.95);
      if (U.chance(pr)) { b.pledges[pid] = true; msg = `${W().fullName(p)} pledged to vote yes.`; }
      else { G().addRel(s, pid, -1); msg = `${W().fullName(p)} would not commit.`; }
    }
    const after = components(s, p, b).score;
    const Bd = s.bodies[b.body];
    const chairId = Bd && Bd.comm[b.comm] && Bd.comm[b.comm].chair;
    if (pid === chairId && after > 0.02) { b.agreed[pid] = true; msg += ` ${W().fullName(p)} agrees to move the bill out of committee.`; }
    const viceId = Bd && Bd.comm[b.comm] && Bd.comm[b.comm].vice;
    if (pid === viceId && after > 0.02 && !b.agreed[pid] && ['committee', 'markup'].includes(b.stage)) { b.agreed[pid] = true; msg += ` ${W().fullName(p)}, the vice chair, will press the chair to hear it.`; }
    return { ok: true, msg: `${msg} Their score: ${before.toFixed(2)} → ${after.toFixed(2)}.` };
  }

  // Earmarks: committee members in markup, appropriators, and floor leaders (manager's amendment).
  function canEarmark(s, b) {
    const me = s.pols.me;
    if (G().myBody(s) !== b.body) return false;
    if (me.lead && me.lead.body === b.body && ['speaker', 'majleader', 'minleader', 'president', 'protem'].includes(me.lead.post)) return true;
    if (['committee', 'markup'].includes(b.stage) && GR.comm.isMember(s, b.body, b.comm, 'me')) return true;
    return GR.comm.commsOf(s, b.body, 'me').some((k) => GR.comm.isMoney(k));
  }

  function pickEarmarkAgency(J) {
    const pref = ['dot', 'works', 'facil', 'doe', 'env', 'water', 'hied', 'usda', 'transit'];
    return J.F.ag.find((a) => pref.includes(a.k)) || J.F.ag[0];
  }
  function earmarkName(s, p, ag) {
    const where = p.fed ? `${p.fed.st}${p.fed.n ? '-' + String(p.fed.n).padStart(2, '0') : ''}` : p.seat ? W().seatTitle(s, s.seats[p.seat]).replace(/^.*?(District|Ward)/, '$1') : 'the district';
    const kinds = { infra: ['bridge replacement', 'highway interchange', 'road resurfacing', 'transit station'], env: ['water treatment plant', 'flood control levee', 'wildfire fuel break'], rnd: ['university research center', 'innovation hub'], edu: ['school modernization'], agri: ['rural broadband & irrigation'], health: ['community health center'], admin: ['municipal facilities'], social: ['affordable housing complex'], safety: ['public safety training center'], defense: ['base modernization'] };
    return `${U.pick(kinds[ag.cat] || kinds.infra)} in ${where}`;
  }

  // The change a member would most like to see.
  function amendFor(s, b, p) {
    const prov = b.prov;
    const ax = W().axes(p);
    const opts = [];
    Object.entries(prov.tax).forEach(([k, d]) => {
      const T = FX().TAXES[k];
      const dislikes = (ax.fis > 0.3 && T.lean * d > 0) || (ax.fis < -0.3 && T.lean * d < 0);
      if (dislikes) opts.push({ label: `scale the ${T.name.toLowerCase()} change back by half`, w: Math.abs(T.lean * d), apply: () => { prov.tax[k] = U.round(d / 2, 2); } });
    });
    Object.entries(prov.ap).forEach(([k, v]) => {
      const a = s.jur[b.jur].F.ag.find((x) => x.k === k);
      const tot = (v.opex || 0) + (v.capex || 0);
      if ((ax.fis > 0.3 && tot > 0) || (a && a.eff < 50 && tot > 0)) opts.push({ label: `trim the ${a ? a.abbr : k} increase by 40% and require an audit`, w: 0.5, apply: () => { v.opex = Math.round((v.opex || 0) * 0.6); v.capex = Math.round((v.capex || 0) * 0.6); if (a) a.eff = Math.min(98, a.eff + 3); } });
    });
    Object.entries(prov.ent).forEach(([k, ps]) => {
      if (ax.fis > 0.3) opts.push({ label: `phase in the ${k} changes halfway`, w: 0.6, apply: () => { const cur = s.jur[b.jur].F.ent[k].p; Object.keys(ps).forEach((pk) => { ps[pk] = U.round(cur[pk] + (ps[pk] - cur[pk]) / 2, 0); }); } });
    });
    Object.entries(prov.reg).forEach(([k, d]) => { if (d > 0 && ax.fis > -0.5) opts.push({ label: `halve the new compliance costs on ${k}`, w: d * 0.3, apply: () => { prov.reg[k] = U.round(d / 2, 2); } }); });
    if (ax.fis < -0.3) Object.entries(prov.tax).forEach(([k, d]) => { if (FX().TAXES[k].lean * d < 0) opts.push({ label: `pay for it: add +0.5 pp to the top bracket`, w: 0.4, apply: () => { if (s.jur[b.jur].F.tax.high != null) prov.tax.high = (prov.tax.high || 0) + 0.5; } }); });
    if (!opts.length) return null;
    return opts.sort((a, c) => c.w - a.w)[0];
  }

  // Discharge petition: a majority of members can force a bill out of committee.
  function discharge(s, billId) {
    const b = findBill(s, billId);
    const me = s.pols.me;
    if (!b || !['committee', 'markup'].includes(b.stage)) return { ok: false, msg: 'Only bills stuck in committee can be discharged.' };
    if (G().myBody(s) !== b.body) return { ok: false, msg: 'You can only sign petitions in your own chamber.' };
    const cost = 20 + GR.OFFICES[s.seats[me.seat].off].level * 5;
    if (me.pp < cost) return { ok: false, msg: `Costs ${cost} political points.` };
    me.pp -= cost;
    const r = roll(s, b, b.body, { noise: false, bias: -0.05 });
    const need = needed(s, b, b.body, 'floor');
    const sigs = r.y + (b.my[b.body] ? 0 : 1);
    if (sigs >= need) {
      b.stage = needsCloture(b) ? 'cloture' : 'floor'; b.due = s.week; b.task = 'vote'; b.blockedBy = null;
      G().addRel(s, Bd(s, b).comm[b.comm] ? Bd(s, b).comm[b.comm].chair : null, -15);
      return { ok: true, msg: `Discharge petition succeeded with ${sigs} signatures. The bill goes to the floor.` };
    }
    return { ok: true, msg: `Only ${sigs} of ${need} members signed the discharge petition.` };
  }
  const Bd = (s, b) => s.bodies[b.body];

  // Leaders (and bill sponsors in small bodies) can force an immediate floor vote.
  function callVote(s, billId) {
    const b = findBill(s, billId);
    if (!b || !OPEN(b)) return { ok: false };
    const me = s.pols.me;
    const post = me.lead && me.lead.body === b.body ? me.lead.post : null;
    const leader = ['speaker', 'majleader', 'president', 'protem'].includes(post);
    if (['committee', 'markup'].includes(b.stage) && !leader) return { ok: false, msg: 'The bill is still in committee. Negotiate with the chair or file a discharge petition.' };
    if (!leader && b.spon !== 'me') return { ok: false, msg: 'Only floor leaders can call up other members\' bills.' };
    if (['committee', 'markup'].includes(b.stage)) { b.stage = needsCloture(b) ? 'cloture' : 'floor'; }
    b.due = s.week;
    if (G().myBody(s) === b.body && !b.my[b.body] && b.spon === 'me') { b.my[b.body] = 'y'; afterMyVote(s, b, b.body, 'y'); }
    stepBill(s, s.jur[b.jur], b);
    if (OPEN(b) && b.stage === 'floor') stepBill(s, s.jur[b.jur], b);
    return { ok: true, msg: 'The clerk calls the roll.' };
  }

  // ---------- Executive tools ----------
  // Transfer authority: move up to 5% of one agency's annual funding to another's operations.
  function reallocate(s, from, to, amt) {
    const me = s.pols.me;
    const seat = me.seat && s.seats[me.seat];
    const jur = G().myJur(s);
    const J = jur && s.jur[jur];
    const isExec = seat && GR.OFFICES[seat.off].exec;
    const B0 = G().myBody(s);
    const chair = B0 && GR.comm.chairsMoney(s);
    if (!isExec && !chair) return { ok: false, msg: 'Only executives (or an appropriations chair) can reallocate emergency funds.' };
    const A = J.F.ag.find((a) => a.k === from), B = J.F.ag.find((a) => a.k === to);
    if (!A || !B || A === B) return { ok: false, msg: 'Choose two different agencies.' };
    const max = (A.opex + A.capex) * 0.05;
    amt = Math.min(amt, max);
    const cost = 10 + GR.OFFICES[seat.off].level * 2;
    if (me.pp < cost) return { ok: false, msg: `Costs ${cost} political points.` };
    me.pp -= cost;
    A.opex = Math.max(0, A.opex - amt * 0.6); A.capex = Math.max(0, A.capex - amt * 0.4);
    B.emerg = (B.emerg || 0) + amt * 4;
    const ac = s.bodies[G().bodiesOf(s, jur)[0]];
    if (ac && isExec) { const ch = ac.comm.approp || ac.comm.budget || ac.comm.finance; if (ch && ch.chair) G().addRel(s, ch.chair, -5); }
    A.app = U.clamp(A.app - 2, 0, 100);
    return { ok: true, msg: `Moved ${U.money(amt)} from ${A.abbr} to ${B.abbr} for emergency operations. Appropriators grumble about executive overreach.` };
  }

  // Commission an audit of an agency: improves its efficiency rating and may recover waste.
  function audit(s, k) {
    const me = s.pols.me;
    const jur = G().myJur(s);
    const J = s.jur[jur];
    const a = J.F.ag.find((x) => x.k === k);
    if (!a) return { ok: false };
    if (s.hoursLeft < 4) return { ok: false, msg: 'Audits take 4 hours of oversight work.' };
    const cost = 8 + GR.OFFICES[s.seats[me.seat].off].level * 2;
    if (me.pp < cost) return { ok: false, msg: `Costs ${cost} political points.` };
    if ((J.F.audits[k] || -99) > s.week - 26) return { ok: false, msg: `${a.abbr} was audited recently.` };
    me.pp -= cost; s.hoursLeft -= 4;
    J.F.audits[k] = s.week;
    const gain = 4 + Math.round((100 - a.eff) / 12 + U.rand() * 4);
    a.eff = U.clamp(a.eff + gain, 0, 98);
    a.eff0 = U.clamp(a.eff0 + gain / 2, 0, 95);
    const waste = Math.round((a.opex * (1 - a.eff / 100)) * 0.03);
    let msg = `Audit of ${a.abbr}: efficiency rating +${gain}.`;
    if (U.chance(0.3)) { a.app = U.clamp(a.app - 4, 0, 100); msg += ` Auditors uncovered ${U.money(waste)} in improper payments. Headlines follow.`; G().addRespect(s, 1); me.app = U.clamp(me.app + 0.5, 1, 99); }
    return { ok: true, msg };
  }

  // ---------- AI bills ----------
  function npcBills(s) {
    ['school', 'city', 'state', 'nation'].forEach((jur) => {
      const bs = G().bodiesOf(s, jur);
      if (!bs.length || !G().inSession(s, bs[0])) return;
      const J = s.jur[jur];
      J.bills = J.bills || [];
      const pending = J.bills.filter(OPEN).length;
      // Legislatures in session move a steady stream of bills; councils and boards fewer.
      const rate = jur === 'nation' ? 0.95 : jur === 'state' ? 0.95 : jur === 'city' ? 0.7 : 0.3;
      let n = U.chance(rate) ? (jur === 'nation' ? U.randInt(2, 3) : jur === 'state' ? U.randInt(2, 3) : 1) : 0;
      if (pending > ({ nation: 32, state: 28, city: 14, school: 8 }[jur] || 14)) n = 0;
      for (let i = 0; i < n; i++) {
        const b = npcBill(s, jur);
        if (b) J.bills.push(b);
      }
    });
  }

  // AI legislation is dealt from the policy deck (see billgen.js).
  function npcBill(s, jur) {
    // Bills start in either chamber; tilt toward yours so you see them while they are live.
    const mine = G().myBody(s);
    const d = GR.billgen.deal(s, jur, mine && G().bodiesOf(s, jur).includes(mine) && U.chance(0.6) ? { body: mine } : {});
    if (!d) return null;
    const recon = jur === 'nation' && U.chance(0.12) && !d.prov.policy.length && !Object.keys(d.prov.reg).length && !Object.keys(d.prov.prem).length && !(s.recon || {})[fiscalYear(s, 'nation')];
    const b = newBill(s, jur, { title: d.title, prov: d.prov, spon: d.spon.id, kind: recon ? 'reconciliation' : 'regular', body: d.body, due: s.week + U.randInt(1, 3), fac: d.fac, tool: d.tool, crisis: d.crisis });
    b.comm = committeeFor(s, b);
    // Balanced-budget law: unfunded spending becomes an authorization that waits for the budget.
    if ((jur === 'state' || jur === 'city') && GR.drafting && GR.drafting.staticCost(s, s.jur[jur], b.prov) > FX().totals(s.jur[jur]).spend * 0.0002) b.prov.approp = true;
    b.sum = describe(s, b).slice(0, 3).join('; ') + (b.prov.approp ? ' (subject to appropriation)' : '');
    return b;
  }

  function crisisTitle(s, J, ck, lib, prov) {
    const st = J.k === 'state' ? GR.STATE[s.home.state].name : J.k === 'nation' ? 'American' : J.name;
    const main = Object.keys(prov.ap)[0];
    const a = main && J.F.ag.find((x) => x.k === main);
    const T = {
      housing: [`${st} Housing Supply & Affordability Act`, 'Homes for Working Families Act'], infra: [`${a ? a.abbr + ' ' : ''}Infrastructure Renewal Act`, 'Fix Our Roads & Bridges Act'],
      migration: ['Talent Retention & Opportunity Act', 'Stay & Thrive Act'], education: ['Classroom Investment & Teacher Pay Act', 'Student Achievement Act'],
      health: ['Health Access & Affordability Act', 'Rural Health Care Rescue Act'], opioid: ['Opioid Crisis Response Act', 'Fentanyl Emergency Act'],
      crime: ['Safe Streets Act', 'Public Safety Investment Act'], pension: ['Pension Stabilization Act', 'Retirement Security Act'],
      disaster: ['Climate Resilience & Disaster Preparedness Act', 'Disaster Readiness Act'], water: ['Water Security Act', 'Clean Water Infrastructure Act'],
      homeless: ['Housing First & Homelessness Reduction Act', 'Ending Street Homelessness Act'], energy: ['Economic Diversification Act', 'Energy Communities Transition Act'],
      poverty: ['Opportunity & Mobility Act', 'Family Economic Security Act'], ssTrust: ['Social Security Solvency Act'], medicareTrust: ['Medicare Trust Fund Protection Act'],
      healthcosts: ['Lower Health Costs Act'], border: ['Border Security Supplemental Appropriations Act'], readiness: ['National Defense Readiness Act'], veterans: ['Veterans Care Backlog Act'], debt: ['Fiscal Responsibility Act'],
    }[ck] || ['Omnibus Reform Act'];
    return lib ? T[0] : T[T.length - 1];
  }

  function autoTitle(s, jur, prov) {
    const J = s.jur[jur];
    const ap = Object.keys(prov.ap || {});
    if (ap.length === 1) { const a = J.F.ag.find((x) => x.k === ap[0]); if (a) return `${a.abbr} Funding Act`; }
    if (Object.keys(prov.tax || {}).length) return Object.values(prov.tax).some((d) => d > 0) ? 'Revenue & Investment Act' : 'Tax Relief Act';
    if (Object.keys(prov.ent || {}).length) return 'Safety Net Reform Act';
    return 'Omnibus Reform Act';
  }

  // ---------- The annual budget ----------
  const PROPOSE = { nation: [1, 6], state: [0, 20], city: [3, 15], school: [3, 1] };

  function budgetCycle(s) {
    const y = U.yearOf(s.week);
    ['school', 'city', 'state', 'nation'].forEach((jur) => {
      const J = s.jur[jur];
      if (!G().bodiesOf(s, jur).length) return;
      J.fy = J.fy || {};
      const [m, d] = PROPOSE[jur];
      const fy = jur === 'nation' ? y + 1 : y + 1;
      // Proposal.
      if (s.week === U.weekOfMD(y, m, d) && J.fy.proposed !== fy) {
        J.fy.proposed = fy;
        const ex = G().execOf(s, jur);
        if (ex && ex.isPlayer) {
          s.budgetDue = s.budgetDue || {};
          s.budgetDue[jur] = { due: s.week + 4, fy };
          GR.sim.msgInbox(s, `Submit your FY${fy} budget`, `Your FY${fy} budget for ${J.name} is due in 4 weeks. ${GR.budget && GR.budget.has(jur) ? 'Open the Budget screen: start from current services, then cut, add, raise revenue or draw reserves. By law it must balance, and every region will judge what it gets.' : 'Open the Bill Builder\'s line-item editor and choose the annual budget to set every agency\'s operating and capital lines, tax rates and program parameters.'}`);
        } else if (GR.budget && GR.budget.has(jur)) J.bills.push(GR.budget.makeBill(s, jur, fy, ex, GR.budget.propose(s, J, ex)));
        else J.bills.push(budgetBill(s, jur, fy, ex));
      }
      // Missed deadline: staff submit a current-services budget.
      if (s.budgetDue && s.budgetDue[jur] && s.week >= s.budgetDue[jur].due) { const fy2 = s.budgetDue[jur].fy; delete s.budgetDue[jur]; J.bills.push(GR.budget && GR.budget.has(jur) ? GR.budget.makeBill(s, jur, fy2, s.pols.me, GR.budget.propose(s, J, s.pols.me)) : budgetBill(s, jur, fy2, s.pols.me, true)); }
      // Fiscal year begins without a budget.
      const start = fyStartWeek(s, jur, y);
      if (s.week === start && J.fy.passed !== fy && J.fy.passed !== y + 1) {
        J.bills.filter((b) => b.kind === 'budget' && OPEN(b)).forEach((b) => { b.lateFy = true; });
        if (jur === 'nation') crIntroduce(s, jur, fy);
        else GR.sim.news(s, `${J.name} starts the fiscal year without a budget; agencies operate at last year's levels.`, 'gov');
      }
      if (jur === 'nation' && J.F.shutdown && s.week % 2 === 0 && !J.bills.some((b) => b.kind === 'cr' && OPEN(b))) crIntroduce(s, jur, fiscalYear(s, jur));
    });
  }

  // Executive budget proposal: current services plus the executive's priorities.
  function budgetBill(s, jur, fy, ex, currentServices) {
    const J = s.jur[jur];
    const F = J.F;
    const prov = emptyProv();
    const grow = Math.max(0.02, (F.mac.pi + (jur === 'nation' ? 0.5 : 0.4)) / 100);
    const fis = ex ? W().axes(ex).fis : 0;
    const top = Object.entries(F.crises).sort((a, c) => c[1].s - a[1].s).slice(0, 3).map((x) => x[0]);
    const priority = new Set(top.flatMap((k) => (GR.CRISIS_TYPES[k].ag || []).map((x) => x[0])));
    F.ag.forEach((a) => {
      let g = grow;
      if (!currentServices) {
        g += -fis * 0.012 + (U.gauss() * 0.008);
        if (a.cat === 'defense' || a.cat === 'safety') g += fis * 0.02;
        if (priority.has(a.k)) g += 0.025;
        if (a.eff < 45) g -= 0.01;
      }
      prov.ap[a.k] = { opex: Math.round(a.opex * g), capex: Math.round(a.capex * (g + (priority.has(a.k) ? 0.02 : 0))) };
    });
    // Balanced-budget rules: states and localities must close projected gaps.
    if (jur !== 'nation') {
      const c = FX().cloneJ(J);
      FX().apply(c, { prov });
      const t = FX().totals(c);
      if (t.bal < 0) {
        const gap = -t.bal;
        if (fis > 0.3 || !ex) { const f = gap / Math.max(1, t.opex); Object.values(prov.ap).forEach((v) => { v.opex -= Math.round((v.opex + 1) * 0) ; }); F.ag.forEach((a) => { prov.ap[a.k].opex -= Math.round(a.opex * Math.min(0.06, f)); }); }
        else {
          const key = jur === 'state' ? (F.tax.high != null && F.tax.high > 0 ? 'high' : 'sales') : 'prop';
          const per = (FX().revenue(c)[key] || { amt: 1 }).amt / Math.max(0.5, F.tax[key]);
          prov.tax[key] = U.round(Math.min(jur === 'state' ? 1.5 : 2, gap / Math.max(1, per)), 2);
        }
      }
    } else if (ex && fis > 0.6) {
      // Conservative presidents propose non-defense cuts.
      F.ag.forEach((a) => { if (!['defense', 'safety'].includes(a.cat)) prov.ap[a.k].opex -= Math.round(a.opex * 0.03); });
    }
    const title = jur === 'nation' ? `Consolidated Appropriations Act, ${fy}` : jur === 'state' ? `FY${fy} General Appropriations Act` : jur === 'city' ? `FY${fy} ${J.name} Operating & Capital Budget` : `${fy - 1}-${String(fy).slice(2)} District Budget`;
    const b = newBill(s, jur, { title, prov, spon: ex ? ex.id : null, kind: 'budget', due: s.week + 3 });
    if (ex && ex.isPlayer) b.spon = 'me';
    b.fy = fy;
    b.sum = `Funds every ${jur === 'nation' ? 'federal agency' : 'agency'} for FY${fy}`;
    return b;
  }

  // Player-built budget (from the Bill Constructor in budget mode).
  function submitBudget(s, draft) {
    const jur = G().myJur(s);
    const due = s.budgetDue && s.budgetDue[jur];
    if (!due) return { ok: false, msg: 'No budget is due right now.' };
    let b;
    if (draft.bud && GR.budget && GR.budget.has(jur)) {
      const J = s.jur[jur];
      const bal = GR.budget.balance(J, draft.bud);
      if (bal.gap < -FX().totals(J).spend * 0.001) return { ok: false, msg: `Your budget is ${U.money(-bal.gap)} out of balance. The law requires it to balance.` };
      b = GR.budget.makeBill(s, jur, due.fy, s.pols.me, JSON.parse(JSON.stringify(draft.bud)));
      b.due = s.week + 2;
    } else b = newBill(s, jur, { title: draft.title || `FY${due.fy} Budget`, prov: JSON.parse(JSON.stringify(draft.prov)), spon: 'me', kind: 'budget', due: s.week + 2 });
    b.fy = due.fy;
    b.agenda = true;
    b.sum = describe(s, b).slice(0, 3).join('; ');
    analysis(s, b);
    s.jur[jur].bills.push(b);
    delete s.budgetDue[jur];
    return { ok: true, msg: `Your FY${due.fy} budget went to the legislature.`, bill: b };
  }

  function crIntroduce(s, jur, fy) {
    const J = s.jur[jur];
    const prov = emptyProv();
    const b = newBill(s, jur, { title: `Continuing Appropriations Act, ${fy}`, prov, spon: null, kind: 'cr', due: s.week });
    b.fy = fy;
    b.sum = 'Funds the government at current levels';
    J.bills.push(b);
  }

  function crFailed(s, jur) {
    const J = s.jur[jur];
    if (jur !== 'nation' || J.F.shutdown) return;
    J.F.shutdown = 1;
    J.fy.shutdownSince = s.week;
    GR.sim.news(s, 'The federal government shuts down after Congress fails to pass a funding bill.', 'gov');
    GR.sim.msgInbox(s, 'Government shutdown', 'Congress failed to fund the government. Agencies are running on essential staff, approval of every agency is falling, and the economy loses momentum each week. Pass a continuing resolution or an omnibus to reopen.');
  }
  function budgetFailed(s, jur) {
    GR.sim.news(s, `The ${s.jur[jur].name} budget failed; negotiations continue.`, 'gov');
  }

  // ---------- Weekly ----------
  function week(s) {
    GR.comm.week(s);
    npcBills(s);
    budgetCycle(s);
    ['school', 'city', 'state', 'nation'].forEach((jur) => {
      const J = s.jur[jur];
      (J.bills || []).forEach((b) => stepBill(s, J, b));
      J.bills = (J.bills || []).filter((b) => OPEN(b) || s.week - (b.done || s.week) <= 12);
    });
    if (s.deals) s.deals = s.deals.filter((d) => !d.kept && !d.broken && s.week - d.w < 40);
  }

  return {
    WEIGHTS, emptyProv, allBills, findBill, newBill, describe, leanOf, components, roll, needed, analysis, stepBill, tasks, decide, introCost, validate, introduce,
    committeeName, committeeFor, counterparties, negotiate, canEarmark, earmarkName, amendFor, provCount, ctxOf, discharge, callVote, reallocate, audit, npcBills, budgetBill, submitBudget, week, fiscalYear, fmtTax, fmtParam, partyLine, rebellion, exposure, OPEN,
  };
})();
