// The state and city budget fight. Budgets here must balance: the revenue estimate, minus the
// costs nobody can touch (benefits, pensions, debt service), is all there is. Spending is split
// into real line items, each tied to an agency and to the places it helps (big cities, suburbs,
// rural and small-town areas; in a city, the core, the neighborhoods and the outer districts).
// Every dollar moved is a dollar some region loses, so lawmakers vote on how their region fares
// against current services, regional caucuses make demands, chairs tilt the budget toward their
// own regions, failed budgets get reworked, and governors can veto individual lines.
var GR = globalThis.GR || (globalThis.GR = {});

GR.budget = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const G = () => GR.gov;
  const L = () => GR.legis;
  const FX = () => GR.fisc;

  // [key, name, agency, part, share of the agency's part, [urban, suburban, rural], constituency, lean]
  // lean: +1 the left fights for it, -1 the right does.
  const CAT = {
    state: [
      ['k12_formula', 'School funding formula', 'k12', 'opex', 0.76, [0.32, 0.43, 0.25], 'teachers', 0.2],
      ['k12_rural', 'Rural & small-school aid', 'k12', 'opex', 0.06, [0, 0.15, 0.85], 'teachers', -0.1],
      ['k12_urban', 'High-poverty school aid', 'k12', 'opex', 0.07, [0.75, 0.2, 0.05], 'parents', 0.6],
      ['k12_pay', 'Teacher pay supplement', 'k12', 'opex', 0.08, [0.33, 0.37, 0.3], 'teachers', 0.3],
      ['k12_prek', 'Pre-K', 'k12', 'opex', 0.03, [0.4, 0.4, 0.2], 'parents', 0.5],
      ['k12_build', 'School construction', 'k12', 'capex', 1, [0.3, 0.45, 0.25], 'parents', 0.1],
      ['he_univ', 'University operating aid', 'hied', 'opex', 0.68, [0.55, 0.3, 0.15], 'business', 0.2],
      ['he_cc', 'Community & technical colleges', 'hied', 'opex', 0.2, [0.2, 0.4, 0.4], 'labor', 0],
      ['he_aid', 'Need-based scholarships', 'hied', 'opex', 0.12, [0.4, 0.35, 0.25], 'parents', 0.4],
      ['he_build', 'Campus construction', 'hied', 'capex', 1, [0.55, 0.3, 0.15], 'business', 0],
      ['dot_maint', 'Highway maintenance', 'dot', 'opex', 0.8, [0.12, 0.38, 0.5], 'local', -0.3],
      ['dot_transit', 'Public transit operating aid', 'dot', 'opex', 0.2, [0.8, 0.18, 0.02], 'neighborhoods', 0.7],
      ['dot_hwy', 'Highway construction', 'dot', 'capex', 0.62, [0.15, 0.55, 0.3], 'business', -0.3],
      ['dot_ucap', 'Urban transit capital', 'dot', 'capex', 0.18, [0.88, 0.12, 0], 'neighborhoods', 0.7],
      ['dot_rural', 'Rural roads & bridges', 'dot', 'capex', 0.2, [0, 0.15, 0.85], 'farm', -0.4],
      ['mcd_core', 'Medicaid provider rates & administration', 'mcd', 'opex', 0.8, [0.42, 0.28, 0.3], 'labor', 0.4],
      ['mcd_rural', 'Rural hospital support', 'mcd', 'opex', 0.08, [0, 0.1, 0.9], 'local', -0.1],
      ['mcd_bh', 'Behavioral health', 'mcd', 'opex', 0.12, [0.45, 0.35, 0.2], 'parents', 0.3],
      ['mcd_cap', 'Health facilities', 'mcd', 'capex', 1, [0.4, 0.3, 0.3], 'local', 0.1],
      ['hs_child', 'Child welfare & foster care', 'hs', 'opex', 0.35, [0.45, 0.3, 0.25], 'parents', 0.2],
      ['hs_assist', 'Family assistance', 'hs', 'opex', 0.3, [0.5, 0.2, 0.3], 'church', 0.6],
      ['hs_aging', 'Aging & disability services', 'hs', 'opex', 0.35, [0.3, 0.38, 0.32], 'seniors', 0.2],
      ['hs_cap', 'Human-services facilities', 'hs', 'capex', 1, [0.4, 0.3, 0.3], 'local', 0.1],
      ['corr_prison', 'Prisons', 'corr', 'opex', 0.88, [0.05, 0.2, 0.75], 'police', -0.6],
      ['corr_reentry', 'Probation, parole & reentry', 'corr', 'opex', 0.12, [0.6, 0.3, 0.1], 'church', 0.4],
      ['corr_cap', 'Prison construction & repair', 'corr', 'capex', 1, [0.05, 0.2, 0.75], 'police', -0.5],
      ['sp_patrol', 'State patrol & investigations', 'police', 'opex', 1, [0.15, 0.35, 0.5], 'police', -0.6],
      ['sp_cap', 'Public-safety equipment', 'police', 'capex', 1, [0.2, 0.35, 0.45], 'police', -0.5],
      ['env_protect', 'Environmental protection', 'env', 'opex', 0.6, [0.4, 0.35, 0.25], 'environment', 0.7],
      ['env_ag', 'Agriculture & water programs', 'env', 'opex', 0.4, [0, 0.2, 0.8], 'farm', -0.3],
      ['env_water', 'Water & sewer infrastructure', 'env', 'capex', 1, [0.3, 0.35, 0.35], 'local', 0],
      ['gen_local', 'Aid to cities & counties', 'gen', 'opex', 0.25, [0.45, 0.33, 0.22], 'local', 0.1],
      ['gen_econ', 'Economic development', 'gen', 'opex', 0.12, [0.35, 0.45, 0.2], 'business', -0.2],
      ['gen_health', 'Public health', 'gen', 'opex', 0.18, [0.4, 0.35, 0.25], 'parents', 0.4],
      ['gen_ops', 'General government', 'gen', 'opex', 0.45, [0.33, 0.34, 0.33], 'taxpayers', -0.2],
      ['gen_cap', 'State buildings & capital projects', 'gen', 'capex', 1, [0.4, 0.35, 0.25], 'local', 0],
    ],
    city: [
      ['c_patrol', 'Police patrol', 'police', 'opex', 0.82, [0.4, 0.35, 0.25], 'police', -0.6],
      ['c_cvi', 'Violence prevention & crisis response', 'police', 'opex', 0.18, [0.65, 0.25, 0.1], 'neighborhoods', 0.6],
      ['c_police_cap', 'Police stations & equipment', 'police', 'capex', 1, [0.35, 0.35, 0.3], 'police', -0.4],
      ['c_fire', 'Fire & EMS', 'fire', 'opex', 1, [0.34, 0.33, 0.33], 'police', 0],
      ['c_fire_cap', 'Fire stations & trucks', 'fire', 'capex', 1, [0.3, 0.3, 0.4], 'police', 0],
      ['c_streets', 'Street maintenance', 'works', 'opex', 0.6, [0.25, 0.35, 0.4], 'neighborhoods', -0.2],
      ['c_lights', 'Sidewalks, lighting & trees', 'works', 'opex', 0.4, [0.4, 0.35, 0.25], 'neighborhoods', 0.2],
      ['c_paving', 'Street repaving', 'works', 'capex', 0.65, [0.2, 0.35, 0.45], 'neighborhoods', -0.2],
      ['c_bridges', 'Bridges & drainage', 'works', 'capex', 0.35, [0.3, 0.3, 0.4], 'local', 0],
      ['c_bus', 'Bus & rail service', 'transit', 'opex', 1, [0.65, 0.3, 0.05], 'neighborhoods', 0.6],
      ['c_transit_cap', 'Transit capital', 'transit', 'capex', 1, [0.7, 0.25, 0.05], 'business', 0.5],
      ['c_water', 'Water & sewer operations', 'water', 'opex', 1, [0.33, 0.33, 0.34], 'local', 0],
      ['c_water_cap', 'Water mains & treatment', 'water', 'capex', 1, [0.35, 0.3, 0.35], 'local', 0],
      ['c_parks', 'Parks & recreation', 'parks', 'opex', 0.6, [0.35, 0.4, 0.25], 'parents', 0.2],
      ['c_libraries', 'Libraries & youth programs', 'parks', 'opex', 0.4, [0.45, 0.4, 0.15], 'parents', 0.4],
      ['c_parks_cap', 'Parks & community centers', 'parks', 'capex', 1, [0.35, 0.4, 0.25], 'parents', 0.2],
      ['c_homeless', 'Homeless services & shelters', 'housing', 'opex', 0.55, [0.85, 0.12, 0.03], 'neighborhoods', 0.6],
      ['c_afford', 'Affordable housing & tenant aid', 'housing', 'opex', 0.45, [0.6, 0.3, 0.1], 'neighborhoods', 0.7],
      ['c_housing_cap', 'Affordable housing construction', 'housing', 'capex', 1, [0.6, 0.3, 0.1], 'neighborhoods', 0.6],
      ['c_trash', 'Trash, recycling & street cleaning', 'sanit', 'opex', 1, [0.4, 0.33, 0.27], 'neighborhoods', 0],
      ['c_sanit_cap', 'Sanitation facilities', 'sanit', 'capex', 1, [0.3, 0.3, 0.4], 'local', 0],
      ['c_econ', 'Economic development & small business', 'econ', 'opex', 1, [0.55, 0.3, 0.15], 'business', -0.2],
      ['c_econ_cap', 'Downtown & corridor projects', 'econ', 'capex', 1, [0.7, 0.2, 0.1], 'business', -0.1],
      ['c_admin', 'City administration', 'admin', 'opex', 1, [0.34, 0.33, 0.33], 'taxpayers', -0.2],
      ['c_admin_cap', 'City buildings & technology', 'admin', 'capex', 1, [0.34, 0.33, 0.33], 'taxpayers', 0],
    ],
  };
  const REGIONS = {
    state: [['u', 'Big-city'], ['s', 'Suburban'], ['r', 'Rural & small-town']],
    city: [['u', 'Downtown & inner city'], ['s', 'Neighborhoods'], ['r', 'Outer districts']],
  };
  const RI = { u: 0, s: 1, r: 2 };
  const has = (jur) => jur === 'state' || jur === 'city';
  // Governors' line-item veto (all but six states).
  const NO_ITEM_VETO = ['IN', 'NV', 'NH', 'NC', 'RI', 'VT'];
  const itemVeto = (s, jur) => jur === 'state' && !NO_ITEM_VETO.includes(s.home.state);

  // ---------- Where members' districts sit ----------
  // Soft membership in each region from how urban the district is.
  function geoOf(s, p, jur) {
    const seat = p.seat && s.seats[p.seat];
    if (!seat) return [1 / 3, 1 / 3, 1 / 3];
    const pr = W().seatProfile(s, seat);
    if (jur === 'city') {
      const d = pr.dens || 5000;
      const u = U.clamp((d - 9000) / 9000, 0, 1), r = U.clamp((5000 - d) / 3500, 0, 1);
      return [u, Math.max(0, 1 - u - r), r];
    }
    const u = U.clamp((pr.urban - 62) / 28, 0, 1), r = U.clamp((52 - pr.urban) / 34, 0, 1);
    return [u, Math.max(0, 1 - u - r), r];
  }
  const regionOf = (g) => ['u', 's', 'r'][g.indexOf(Math.max(...g))];
  function regionName(jur, k) { return (REGIONS[jur].find((x) => x[0] === k) || [k, k])[1]; }

  // ---------- The ledger ----------
  // J.bud: { lines: [{k,name,ag,part,geo,con,lean,prog?}], share: {k: fraction of agency part}, enacted: {k: $}, requests: [] }
  function ensure(J) {
    if (!has(J.k)) return null;
    if (J.bud && J.bud.lines) return J.bud;
    const bud = J.bud = { lines: [], share: {}, requests: [], fyDone: null };
    const cat = CAT[J.k];
    J.F.ag.forEach((a) => {
      ['opex', 'capex'].forEach((part) => {
        let rows = cat.filter((x) => x[2] === a.k && x[3] === part);
        if (!rows.length && a[part] > 0) rows = [[`${a.k}_${part}`, `${a.abbr} ${part === 'opex' ? 'operations' : 'capital'}`, a.k, part, 1, [0.34, 0.33, 0.33], 'local', 0]];
        const tot = U.sum(rows, (x) => x[4]) || 1;
        rows.forEach((x) => { bud.lines.push({ k: x[0], name: x[1], ag: x[2], part: x[3], geo: x[5], con: x[6], lean: x[7] }); bud.share[x[0]] = x[4] / tot; });
      });
    });
    return bud;
  }
  const progKey = (p, i) => `prog:${i}:${p.k}`;
  const progGeo = (p) => ({ urban: [0.6, 0.3, 0.1], rural: [0.05, 0.2, 0.75], poverty: [0.5, 0.2, 0.3], age: [0.3, 0.4, 0.3], young: [0.35, 0.45, 0.2], vets: [0.25, 0.4, 0.35] }[p.tilt] || [0.34, 0.33, 0.33]);
  // Current line amounts, read off the agencies (programs carved out as their own lines).
  function current(J) {
    const bud = ensure(J);
    const out = {};
    const progs = J.F.programs || [];
    const carve = {};
    progs.forEach((p, i) => { const part = GR.prog.MECH[p.mech] ? GR.prog.MECH[p.mech].part : 'opex'; const key = p.ag + '|' + part; carve[key] = (carve[key] || 0) + (p.amt || 0); out[progKey(p, i)] = p.amt || 0; });
    J.F.ag.forEach((a) => ['opex', 'capex'].forEach((part) => {
      const rest = Math.max(0, a[part] - (carve[a.k + '|' + part] || 0));
      bud.lines.filter((l) => l.ag === a.k && l.part === part).forEach((l) => { out[l.k] = rest * (bud.share[l.k] || 0); });
    }));
    return out;
  }
  // All lines, programs included, as display rows.
  function lines(J) {
    const bud = ensure(J);
    const progs = (J.F.programs || []).map((p, i) => ({ k: progKey(p, i), name: p.name, ag: p.ag, part: GR.prog.MECH[p.mech] ? GR.prog.MECH[p.mech].part : 'opex', geo: progGeo(p), con: Object.keys(p.bases || {})[0] || 'local', lean: p.lean || 0, prog: i }));
    return bud.lines.concat(progs);
  }
  const lineOf = (J, k) => lines(J).find((l) => l.k === k);

  // The year's numbers: revenue estimate, untouchable costs, and what is left.
  function outlook(J) {
    const F = J.F;
    const t = FX().totals(J);
    const m = F.mac;
    const g = U.clamp((m.g + m.pi) / 100, -0.06, 0.09);
    const infl = Math.max(0.015, (m.pi + 0.6) / 100);
    // The consensus revenue estimate is cautious, and this year's forecast can miss either way.
    const fe = (J.bud && J.bud.fe) || 0;
    const rev = t.rev * (1 + g * 0.6 + fe);
    // Benefits and pensions grow faster than prices.
    const mand = t.ent * (1 + infl + 0.025) + t.interest + t.principal + t.ear;
    const cs = {};
    const cur = current(J);
    // Current services: what it costs to keep doing the same things next year.
    const drift = { k12_formula: 0.01, mcd_core: 0.03, corr_prison: 0.01, hs_child: 0.01, c_patrol: 0.01, c_fire: 0.01, c_homeless: 0.02 };
    Object.entries(cur).forEach(([k, v]) => { cs[k] = v * (1 + infl + (drift[k] || 0.004)); });
    const drawMax = Math.max(0, F.reserve * 0.35);
    return { rev, mand, cur, cs, infl, g, drawMax, reserve: F.reserve };
  }
  // Cash cost of a set of lines: capital is 40% bond-financed.
  function cash(J, amt) { return U.sum(lines(J), (l) => (amt[l.k] || 0) * (l.part === 'capex' ? 0.6 : 1)); }
  // Revenue from tax changes in the budget.
  function taxYield(J, tax) {
    let v = 0;
    Object.entries(tax || {}).forEach(([k, d]) => { const per = FX().perPoint(J, k); if (per) v += per * d; });
    return v;
  }
  function balance(J, bud) {
    const o = outlook(J);
    const avail = o.rev + taxYield(J, bud.tax) + (bud.draw || 0) - o.mand;
    const spend = cash(J, bud.amt);
    return { avail, spend, gap: avail - spend, o };
  }

  // How each region fares against current services (fraction).
  function regional(J, bud) {
    const csAll = bud.cs || outlook(J).cs;
    const ls = lines(J);
    const base = [0, 0, 0], now = [0, 0, 0];
    ls.forEach((l) => { const cs = csAll[l.k] || 0, a = bud.amt[l.k] != null ? bud.amt[l.k] : cs; for (let i = 0; i < 3; i++) { base[i] += cs * l.geo[i]; now[i] += a * l.geo[i]; } });
    return base.map((b, i) => (b ? (now[i] - b) / b : 0));
  }
  // A member's view of the budget: how their region does, and how their district's taxes move.
  function memberScore(s, p, b) {
    const J = s.jur[b.jur];
    const bud = b.prov.bud;
    if (!bud) return 0;
    const reg = b._reg || (b._reg = regional(J, bud));
    const g = geoOf(s, p, b.jur);
    // What matters is who loses more (your region against the average), then the budget as a
    // whole against the alternative: no budget, flat funding and automatic cuts.
    const avg = (reg[0] + reg[1] + reg[2]) / 3;
    const mine = g[0] * reg[0] + g[1] * reg[1] + g[2] * reg[2];
    const alt = -0.035;
    let x = (mine - avg) * 1.6 + (avg - alt) * 0.5;
    // Each failed vote raises the pressure to get it done.
    x += (b.reworks || 0) * 0.004;
    // Lines a member's side fights for.
    const ax = W().axes(p);
    const fis = ax.fis || 0;
    const csAll = bud.cs || outlook(J).cs;
    let tilt = 0, tot = 0;
    lines(J).forEach((l) => { const cs = csAll[l.k] || 0; if (!cs) return; const d = ((bud.amt[l.k] != null ? bud.amt[l.k] : cs) - cs) / cs; tilt += d * l.lean * cs; tot += cs; });
    if (tot) x += -fis * (tilt / tot) * 0.6;
    return Math.tanh(x * 22) * 0.9;
  }

  // ---------- Building budgets ----------
  // Recompute the agency appropriations and tax provisions from the line amounts.
  function compile(J, prov) {
    const bud = prov.bud;
    const cur = current(J);
    const ls = lines(J);
    prov.ap = {};
    ls.forEach((l) => {
      const d = (bud.amt[l.k] != null ? bud.amt[l.k] : cur[l.k] || 0) - (cur[l.k] || 0);
      if (!d) return;
      const v = prov.ap[l.ag] || (prov.ap[l.ag] = {});
      v[l.part] = (v[l.part] || 0) + Math.round(d);
    });
    prov.tax = Object.assign({}, bud.tax || {});
    prov.budProg = Object.fromEntries(ls.filter((l) => l.prog != null).map((l) => [l.prog, bud.amt[l.k] != null ? bud.amt[l.k] : cur[l.k]]));
    return prov;
  }
  // An executive's proposal: current services, then priorities, closed to balance.
  function propose(s, J, ex, opts = {}) {
    ensure(J).fe = U.clamp(U.gauss() * 0.012, -0.03, 0.03);
    const o = outlook(J);
    const ls = lines(J);
    const amt = Object.assign({}, o.cs);
    const fis = ex ? W().axes(ex).fis : 0;
    const exGeo = ex ? (ex.party === 'R' ? [0.15, 0.4, 0.45] : [0.5, 0.38, 0.12]) : [1 / 3, 1 / 3, 1 / 3];
    const top = Object.entries(J.F.crises).sort((a, c) => c[1].s - a[1].s).slice(0, 3).map((x) => x[0]);
    const crisisAg = new Set(top.flatMap((k) => (GR.CRISIS_TYPES[k].ag || []).map((x) => x[0])));
    // Priority of each line for this executive.
    const pri = {};
    ls.forEach((l) => { pri[l.k] = -fis * l.lean * 0.8 + (l.geo[0] * exGeo[0] + l.geo[1] * exGeo[1] + l.geo[2] * exGeo[2]) * 1.2 + (crisisAg.has(l.ag) ? 0.5 : 0) + (U.gauss() * 0.15); });
    const bud = { amt, tax: {}, draw: 0, cs: o.cs };
    // Requests the executive takes up.
    (J.bud.requests || []).filter((r) => !r.funded).forEach((r) => { const l = ls.find((x) => x.k === r.line); if (l && pri[l.k] > 0.6 && U.chance(0.5)) { amt[l.k] = (amt[l.k] || 0) + r.amt; r.inProp = true; } });
    // Agency requests: funded by priority while there is room; in a lean year only the urgent ones, in part.
    let room = balance(J, bud).gap;
    (J.bud.agReq || []).slice().sort((x, y) => (pri[y.k] || 0) + (y.urgent ? 0.6 : 0) - (pri[x.k] || 0) - (x.urgent ? 0.6 : 0)).forEach((r) => {
      const l = ls.find((x) => x.k === r.k);
      if (!l) return;
      const c = l.part === 'capex' ? 0.6 : 1;
      const want = r.ask * ((pri[r.k] || 0) > 0.6 || r.urgent ? 1 : 0.5);
      const give = room > 0 ? Math.min(want, room * 0.6 / c) : r.urgent && fis < 0.5 ? want * 0.35 : 0;
      if (give <= 0) return;
      amt[r.k] = (amt[r.k] || 0) + give; room -= give * c;
    });
    let gap = balance(J, bud).gap;
    const disc = U.sum(Object.values(o.cs));
    const csCash = cash(J, o.cs);
    if (gap < 0) {
      // Shortfall: cuts first (deeper for low priorities), then the rainy-day fund, then revenue.
      cutTo(J, bud, Math.min(-gap * (fis > 0.3 ? 0.7 : 0.5), csCash * 0.045), pri);
      gap = balance(J, bud).gap;
      if (gap < 0) { bud.draw = Math.min(o.drawMax, -gap * 0.7); gap = balance(J, bud).gap; }
      if (gap < 0) {
        const key = J.k === 'state' ? (fis < 0 && J.F.tax.high != null && J.F.tax.high > 0 ? 'high' : 'sales') : 'prop';
        const per = taxYield(J, { [key]: 1 });
        if (per > 0) bud.tax[key] = U.round(U.clamp((-gap * (fis > 0.3 ? 0.4 : 0.8)) / per, 0, J.k === 'state' ? 1 : 2.5), 2);
        gap = balance(J, bud).gap;
      }
      if (gap < 0) gap = -cutTo(J, bud, -gap, pri);
      // What's left is papered over with one-time measures: deferred payments and fund sweeps.
      if (gap < -1) { bud.draw = (bud.draw || 0) - gap; bud.oneTime = -gap; }
    } else if (gap > csCash * 0.002) {
      // Surplus: grow priorities by at most a few percent; bank the rest, or return it as a tax cut.
      const spend = Math.min(gap * (fis > 0.3 ? 0.45 : 0.7), csCash * 0.03);
      addTo(J, bud, spend, pri);
      const left = gap - spend;
      // A full rainy-day fund: windfalls go to one-time projects or tax relief instead of the bank.
      const full = o.reserve > FX().totals(J).spend * 0.12;
      if (fis > 0.3) { const key = J.k === 'state' ? (J.F.tax.mid != null ? 'mid' : 'sales') : 'prop'; const per = taxYield(J, { [key]: 1 }); if (per > 0) bud.tax[key] = -U.round(Math.min(full ? 1 : 0.5, left * (full ? 0.8 : 0.5) / per), 2); }
      else if (full) { const caps = lines(J).filter((l) => l.part === 'capex').sort((a, c) => pri[c.k] - pri[a.k]).slice(0, 5); caps.forEach((l) => { bud.amt[l.k] = (bud.amt[l.k] || 0) + left * 0.6 / caps.length / 0.6; }); }
    }
    void disc;
    return bud;
  }
  // Targeted cuts on low priorities first, then across the board; no line loses more than 15%.
  function cutTo(J, bud, need, pri) {
    const ls = lines(J).filter((l) => (bud.amt[l.k] || 0) > 0);
    const c = (l) => (l.part === 'capex' ? 0.6 : 1);
    const floor = {};
    ls.forEach((l) => { floor[l.k] = ((bud.cs || {})[l.k] || bud.amt[l.k]) * 0.85; });
    let left = need;
    const sorted = ls.slice().sort((a, b) => pri[a.k] - pri[b.k]);
    const med = pri[sorted[Math.floor(sorted.length / 2)].k];
    for (const l of sorted) {
      if (left <= 1) break;
      const room = Math.max(0, bud.amt[l.k] - floor[l.k]);
      const cut = Math.min(bud.amt[l.k] * (pri[l.k] < med ? 0.07 : 0.025), room, left / c(l));
      bud.amt[l.k] -= cut; left -= cut * c(l);
    }
    if (left > 1) {
      const tot = U.sum(ls, (l) => Math.max(0, bud.amt[l.k] - floor[l.k]) * c(l));
      const f = Math.min(1, left / Math.max(1, tot));
      ls.forEach((l) => { const cut = Math.max(0, bud.amt[l.k] - floor[l.k]) * f; bud.amt[l.k] -= cut; left -= cut * c(l); });
    }
    return Math.max(0, left);
  }
  function addTo(J, bud, spend, pri) {
    const ls = lines(J).slice().sort((a, b) => pri[b.k] - pri[a.k]).slice(0, 8);
    const w = U.sum(ls, (l) => Math.max(0.1, pri[l.k]));
    ls.forEach((l) => { bud.amt[l.k] = (bud.amt[l.k] || 0) + spend * Math.max(0.1, pri[l.k]) / w; });
  }

  // Move money between lines (zero-sum, cash-neutral).
  function move(J, bud, from, to, amt) {
    const lf = lineOf(J, from), lt = lineOf(J, to);
    if (!lf || !lt || from === to) return 0;
    const have = bud.amt[from] || 0;
    const take = Math.max(0, Math.min(amt, have * 0.5));
    const cf = lf.part === 'capex' ? 0.6 : 1, ct = lt.part === 'capex' ? 0.6 : 1;
    bud.amt[from] = have - take;
    bud.amt[to] = (bud.amt[to] || 0) + take * cf / ct;
    return take;
  }
  const disc = (J) => U.sum(Object.values(outlook(J).cs));

  // A chair rewrites the budget toward their region and side (the chairman's mark).
  function chairMark(s, b, chair) {
    const J = s.jur[b.jur];
    const bud = b.prov.bud;
    const g = geoOf(s, chair, b.jur);
    const fis = W().axes(chair).fis;
    const ls = lines(J);
    const val = (l) => l.geo[0] * g[0] + l.geo[1] * g[1] + l.geo[2] * g[2] - fis * l.lean * 0.4;
    const sorted = ls.slice().sort((a, c) => val(c) - val(a));
    const total = disc(J) * (0.004 + U.rand() * 0.004);
    const winners = sorted.slice(0, 4), losers = sorted.slice(-6);
    let moved = 0;
    losers.forEach((lf, i) => { const lt = winners[i % winners.length]; moved += move(J, bud, lf.k, lt.k, total / losers.length); });
    compile(J, b.prov);
    b._reg = null; b._lean = null; b._line = null;
    b.amends = b.amends || [];
    if (moved > 0) b.amends.push({ by: chair.id, label: `Chairman's mark: ${U.money(moved)} shifted toward ${winners.slice(0, 2).map((l) => l.name.toLowerCase()).join(' and ')}, out of ${losers.slice(0, 2).map((l) => l.name.toLowerCase()).join(' and ')}`, ok: true, w: s.week });
  }

  // A budget failed on the floor: leaders buy back the region with the most defectors.
  function rework(s, b, r) {
    const J = s.jur[b.jur];
    const bud = b.prov.bud;
    const maj = W().majority(s, b.body);
    const nays = [0, 0, 0], ayes = [0, 0, 0];
    r.rows.forEach((x) => { const p = s.pols[x.id]; if (!p) return; const g = geoOf(s, p, b.jur); const tgt = x.v === 'n' && p.party === maj ? nays : x.v === 'y' ? ayes : null; if (tgt) g.forEach((v, i) => { tgt[i] += v; }); });
    const want = nays.indexOf(Math.max(...nays));
    const give = ayes.map((v, i) => (i === want ? -1 : v)).indexOf(Math.max(...ayes.map((v, i) => (i === want ? -1 : v))));
    const ls = lines(J);
    const to = ls.slice().sort((a, c) => c.geo[want] - a.geo[want]).slice(0, 2);
    const from = ls.slice().sort((a, c) => (c.geo[give] - c.geo[want]) - (a.geo[give] - a.geo[want])).slice(0, 3);
    const amt = disc(J) * 0.004;
    let moved = 0;
    // When every region is underwater, reshuffling can't win votes: leaders find money.
    const reg = regional(J, bud);
    const avg = (reg[0] + reg[1] + reg[2]) / 3;
    let found = '';
    if (avg < -0.025) {
      const o = outlook(J);
      const extra = disc(J) * 0.01;
      const room = Math.max(0, o.reserve * 0.5 - (bud.draw || 0));
      if (room > extra * 0.5) { bud.draw = (bud.draw || 0) + Math.min(room, extra); found = 'from the rainy-day fund'; }
      else { const key = J.k === 'state' ? (J.F.tax.sales != null ? 'sales' : 'high') : 'prop'; const per = taxYield(J, { [key]: 1 }); if (per > 0) { bud.tax = bud.tax || {}; bud.tax[key] = U.round((bud.tax[key] || 0) + extra / per, 2); found = `by raising the ${FX().TAXES[key].name.toLowerCase()}`; } }
      if (found) { const ls2 = lines(J).filter((l) => l.geo[want] > 0.3); const w = U.sum(ls2, (l) => l.geo[want]); ls2.forEach((l) => { bud.amt[l.k] = (bud.amt[l.k] || 0) + extra * l.geo[want] / w / (l.part === 'capex' ? 0.6 : 1); }); moved += extra; }
    }
    if (!found) from.forEach((lf, i) => { moved += move(J, bud, lf.k, to[i % to.length].k, amt / from.length); });
    compile(J, b.prov);
    b._reg = null; b._line = null;
    b.reworks = (b.reworks || 0) + 1;
    const rn = regionName(b.jur, ['u', 's', 'r'][want]);
    b.amends = b.amends || [];
    b.amends.push({ by: 'lead', label: found ? `Leaders found ${U.money(moved)} ${found} for ${rn.toLowerCase()} districts` : `Leaders reworked the budget: ${U.money(moved)} moved to ${to.map((l) => l.name.toLowerCase()).join(' and ')} to win back ${rn.toLowerCase()} members`, ok: true, w: s.week });
    GR.sim.news(s, `The ${J.name} budget failed ${r.y}-${r.n}. Leaders ${found ? `find ${U.money(moved)} ${found}` : `move ${U.money(moved)}`} for ${rn.toLowerCase()} districts and try again.`, 'gov');
    return rn;
  }

  // Line-item veto: an AI governor cuts lines the legislature raised above the proposal.
  function aiItemVeto(s, b, ex) {
    const J = s.jur[b.jur];
    if (!itemVeto(s, b.jur) || !b.prov.bud || !b.prov.bud.gov) return [];
    const bud = b.prov.bud;
    const fis = W().axes(ex).fis;
    const out = [];
    lines(J).forEach((l) => {
      const was = bud.gov[l.k], now = bud.amt[l.k];
      if (was == null || now == null || now <= was * 1.03) return;
      if (-fis * l.lean < 0.1 && U.chance(0.6)) out.push(l.k);
    });
    return out.slice(0, 6);
  }
  function applyItemVetoes(s, b, keys) {
    const J = s.jur[b.jur];
    const bud = b.prov.bud;
    let saved = 0;
    keys.forEach((k) => { const was = bud.gov[k]; if (was == null) return; saved += (bud.amt[k] - was) * ((lineOf(J, k) || {}).part === 'capex' ? 0.6 : 1); bud.amt[k] = was; });
    compile(J, b.prov);
    b._reg = null;
    b.itemVetoes = keys.map((k) => (lineOf(J, k) || { name: k }).name);
    return saved;
  }

  // After enactment: record shares so next year's lines start from what was won.
  function onEnact(s, J, b) {
    const bud = ensure(J);
    if (!b.prov.bud) return;
    const amt = b.prov.bud.amt;
    // Programs take their new funding.
    Object.entries(b.prov.budProg || {}).forEach(([i, v]) => { const p = (J.F.programs || [])[+i]; if (p && v != null) { if (!p.amt && v > 0) p.q0 = J.F.q || 0; p.amt = Math.max(0, v); if (p.auth && p.amt >= p.auth * 0.8) p.auth = 0; } });
    J.F.ag.forEach((a) => ['opex', 'capex'].forEach((part) => {
      const ls = bud.lines.filter((l) => l.ag === a.k && l.part === part);
      const tot = U.sum(ls, (l) => Math.max(0, amt[l.k] || 0));
      if (tot > 0) ls.forEach((l) => { bud.share[l.k] = Math.max(0, amt[l.k] || 0) / tot; });
    }));
    (bud.requests || []).forEach((r) => { if (r.inProp || (amt[r.line] || 0) > (b.prov.bud.cs[r.line] || 0) + r.amt * 0.5) r.funded = true; });
    bud.requests = (bud.requests || []).filter((r) => !r.funded && s.week - r.w < 104);
    bud.fyDone = b.fy;
    // Agencies that were turned down say so.
    if (bud.agFy === b.fy) (bud.agReq || []).map((r) => Object.assign(r, { got: reqShare(r, amt, b.prov.bud.cs) })).filter((r) => r.got < 0.3 && r.ask > 0).sort((x, y) => y.ask - x.ask).slice(0, 2)
      .forEach((r) => GR.sim.news(s, `${r.abbr} warns that without the ${U.money(r.ask)} it asked for in ${r.line.toLowerCase()}, ${r.risk}. The FY${b.fy} budget gives it ${Math.round(r.got * 100)}% of its request.`, 'gov'));
    // Member items become earmarks.
    (b.prov.bud.items || []).forEach((it) => { J.F.ear.push({ who: it.who, ag: it.ag, amt: it.amt, proj: it.proj, q: 4 }); if (it.who === 'me') { const me = s.pols.me; me.app = U.clamp(me.app + 1.2, 1, 99); GR.sim.msgInbox(s, 'Your project is funded', `The ${it.proj} (${U.money(it.amt)}) made it into the budget. Your district will hear about it.`); } });
  }

  // Bills "subject to appropriation" queue up for the next budget.
  function addRequest(s, J, b) {
    const bud = ensure(J);
    if (!bud) return;
    const ls = lines(J);
    Object.entries(b.prov.ap || {}).forEach(([ag, v]) => ['opex', 'capex'].forEach((part) => {
      if (!(v[part] > 0)) return;
      const prog = (J.F.programs || []).findIndex((p) => p.law === b.title || ((b.prov.prog || []).some((x) => x.name === p.name) && p.auth));
      const line = prog >= 0 ? progKey(J.F.programs[prog], prog) : (ls.find((l) => l.ag === ag && l.part === part && !l.prog) || {}).k;
      if (line) bud.requests.push({ line, amt: v[part], title: b.title, spon: b.spon, w: s.week });
    }));
  }

  // The budget bill itself.
  function makeBill(s, jur, fy, ex, bud, opts = {}) {
    const J = s.jur[jur];
    ensure(J);
    const o = outlook(J);
    bud.cs = o.cs;
    bud.gov = Object.assign({}, bud.amt);
    bud.items = bud.items || [];
    const prov = compile(J, Object.assign(L().emptyProv(), { bud }));
    const title = jur === 'state' ? `FY${fy} General Appropriations Act` : `FY${fy} ${J.name} Operating & Capital Budget`;
    const b = L().newBill(s, jur, { title, prov, spon: ex ? ex.id : null, kind: 'budget', due: s.week + 3 });
    if (ex && ex.isPlayer) b.spon = 'me';
    b.fy = fy;
    b.sum = `Funds every agency for FY${fy}; must balance`;
    return b;
  }

  // ---------- Regional caucuses ----------
  // After each version, a region that loses ground complains loudly; if it's yours, your caucus
  // asks you to hold out.
  function caucusCheck(s, b) {
    const J = s.jur[b.jur];
    const reg = regional(J, b.prov.bud);
    b._reg = reg;
    const R = REGIONS[b.jur];
    reg.forEach((v, i) => {
      if (v > -0.012) return;
      const name = R[i][1];
      const worst = lines(J).filter((l) => l.geo[i] > 0.5).map((l) => ({ l, d: ((b.prov.bud.amt[l.k] || 0) - (b.prov.bud.cs[l.k] || 0)) })).sort((a, c) => a.d - c.d)[0];
      GR.sim.news(s, `${name} lawmakers revolt: the ${b.title} leaves their districts ${Math.abs(v * 100).toFixed(1)}% below current services${worst && worst.d < 0 ? `, with ${worst.l.name.toLowerCase()} cut ${U.money(-worst.d)}` : ''}.`, 'gov');
    });
    const me = s.pols.me;
    if (G().myBody(s) !== b.body || b.my['caucus' + b.body]) return;
    const g = geoOf(s, me, b.jur);
    const i = g.indexOf(Math.max(...g));
    if (reg[i] > -0.01) return;
    b.my['caucus' + b.body] = 'asked';
    const name = R[i][1];
    GR.scenes.post(s, { kicker: `The ${name} Caucus`, title: 'Hold the line on the budget?', text: `The ${b.title} leaves ${name.toLowerCase()} districts like yours ${Math.abs(reg[i] * 100).toFixed(1)}% below what it takes to keep current services. The caucus is asking every member to vote no until the money is restored. Leadership is asking for unity.`, choices: [
      { label: 'Stand with the caucus: vote no until it is fixed', fx: { pw: { local: 4, party: -4 }, stand: -2 }, res: 'The caucus counts you as a firm no.', run: 'budHold', args: { bill: b.id, region: i } },
      { label: 'Stick with leadership', fx: { pw: { party: 4, local: -4 }, stand: 2 }, res: 'Leadership notes your loyalty.' },
      { label: 'Use it as leverage: trade your vote for a district project', fx: { hours: -2 }, res: 'You open talks with the Appropriations chair.', run: 'budLever', args: { bill: b.id } },
    ] });
  }
  // ---------- Agency requests ----------
  // Every budget season departments ask for more than current services: to keep up with workload,
  // answer a crisis, or fix what is wearing out. The executive decides what to fund.
  function agencyRequests(s, J, fy) {
    const bud = ensure(J);
    if (bud.agFy === fy && bud.agReq) return bud.agReq;
    const F = J.F;
    const o = outlook(J);
    const crisisOf = {};
    Object.entries(F.crises).forEach(([k, c]) => (GR.CRISIS_TYPES[k].ag || []).forEach(([ak]) => { if (c.s > 40 && (!crisisOf[ak] || F.crises[crisisOf[ak]].s < c.s)) crisisOf[ak] = k; }));
    const reqs = [];
    bud.lines.forEach((l) => {
      const base = o.cs[l.k] || 0;
      const a = F.ag.find((x) => x.k === l.ag);
      if (base <= 0 || !a) return;
      const ratio = FX().agRatio(F, a, l.part);
      const ck = crisisOf[a.k];
      const cr = ck && F.crises[ck];
      let f = 0.01 + Math.max(0, 1 - ratio) * 0.3 + (cr ? Math.max(0, cr.s - 50) / 100 * 0.12 : 0) + (l.part === 'capex' ? Math.max(0, a.deg - 45) / 100 * 0.12 : 0) + U.rand() * 0.025;
      f = U.clamp(f, 0.01, 0.12);
      const why = [];
      if (cr) why.push(`the ${GR.CRISIS_TYPES[ck].name.toLowerCase()} is rated ${Math.round(cr.s)} of 100`);
      if (ratio < 0.95) why.push(`its workload has outgrown its funding by ${Math.round((1 - ratio) * 100)}%`);
      if (l.part === 'capex' && a.deg > 50) why.push('its buildings and equipment are wearing out');
      if (!why.length) why.push('staff, fuel and contract costs keep rising');
      const risk = cr ? `the ${GR.CRISIS_TYPES[ck].name.toLowerCase()} gets worse` : ratio < 0.95 ? 'waits and backlogs grow' : l.part === 'capex' ? 'repairs are deferred again' : 'services get trimmed';
      reqs.push({ k: l.k, ag: a.k, abbr: a.abbr, line: l.name, base: Math.round(base), ask: Math.round(base * f), why: why.slice(0, 2).join(', and '), risk, urgent: false, sev: (cr ? cr.s : 0) + (1 - ratio) * 200 });
    });
    reqs.sort((x, y) => y.ask / y.base - x.ask / x.base);
    bud.agReq = reqs.slice(0, 10);
    // Only the two or three that really are emergencies get flagged.
    bud.agReq.slice().sort((x, y) => y.sev - x.sev).slice(0, 3).forEach((r) => { if (r.sev > 70) r.urgent = true; });
    bud.agFy = fy;
    const tot = U.sum(bud.agReq, (r) => r.ask);
    GR.sim.news(s, `${J.name} agencies submit FY${fy} budget requests: ${U.money(tot)} more than current services. The ${GR.xneg.exTitle(s, J.k).toLowerCase()} decides what to fund.`, 'gov');
    return bud.agReq;
  }
  // How much of each request a budget funds (0 … 1).
  function reqShare(r, amt, cs) { return r.ask > 0 ? U.clamp(((amt[r.k] || 0) - (cs[r.k] || r.base)) / r.ask, 0, 1) : 0; }

  // ---------- Mid-year shortfalls ----------
  // When revenue falls short mid-year, executives act: across-the-board cuts, hiring freezes and
  // delayed projects, a revenue package sent to the legislature, or riding it out on the reserve.
  function trim(J, amt, capFirst) {
    const F = J.F;
    let left = amt;
    if (capFirst) { const cap = U.sum(F.ag, (a) => a.capex); const f = Math.min(0.15, left * 0.6 / Math.max(1, cap)); F.ag.forEach((a) => { left -= a.capex * f; a.capex *= 1 - f; }); }
    const op = U.sum(F.ag, (a) => a.opex);
    const f = U.clamp(left / Math.max(1, op), 0, 0.05);
    F.ag.forEach((a) => { a.opex *= 1 - f; });
    return f;
  }
  function revenuePlan(s, jur, fac) {
    const b = L().npcBill(s, jur, { tool: 'deficit', fac });
    if (!b) return null;
    b.xreq = true;
    b.sum = `Requested by the ${jur === 'state' ? 'governor' : 'mayor'} · ` + b.sum;
    s.jur[jur].bills.push(b);
    return b;
  }
  function shortfall(s) {
    ['state', 'city'].forEach((jur) => {
      const J = s.jur[jur];
      if (!J || !J.F) return;
      const press = FX().pressure(J);
      const fy = L().fiscalYear(s, jur);
      J.sf = J.sf || {};
      if (press < 0.35 || J.sf.fy === fy) return;
      J.sf.fy = fy;
      const t = FX().totals(J);
      const gap = Math.max(0, -t.bal);
      const resLow = (J.F.reserve || 0) < t.spend * 0.04;
      const office = jur === 'state' ? 'Governor' : 'Mayor';
      GR.sim.news(s, `${J.name} budget office: revenue is running ${U.money(gap)} short of spending this year (${(gap / t.spend * 100).toFixed(1)}%)${resLow ? ', and the rainy-day fund is nearly empty' : ''}. The budget must balance.`, 'gov');
      const ex = G().execOf(s, jur);
      if (!ex) return;
      if (ex.isPlayer) {
        GR.scenes.post(s, { jur, kicker: `Budget office · ${J.name}`, title: `A ${U.money(gap)} hole in this year's budget`,
          text: `Revenue is coming in ${U.money(gap)} below what the budget spends. The law requires a balanced budget${resLow ? ' and the rainy-day fund is nearly gone' : `; the rainy-day fund holds ${U.money(J.F.reserve || 0)}`}. Rating agencies, legislators and the press want to know your plan.`,
          choices: [
            { label: `Order across-the-board cuts (about ${(Math.min(gap, t.spend * 0.03) / t.spend * 100).toFixed(1)}% of operations)`, fx: { app: -2, pw: { labor: -4, business: 2 } }, run: 'sfCut', args: { jur, amt: Math.min(gap, t.spend * 0.03) } },
            { label: 'Freeze hiring and delay construction projects', fx: { app: -1, pw: { labor: -2 } }, run: 'sfFreeze', args: { jur, amt: Math.min(gap * 0.6, t.spend * 0.02) } },
            { label: 'Send the legislature a revenue package', fx: { pp: -5, pw: { business: -3 } }, run: 'sfRev', args: { jur }, res: 'Your package goes to the legislature. You can also write your own in the Bill Builder under "Taxes, revenue & the economy".' },
            { label: 'Ride it out on the rainy-day fund', fx: {}, run: 'sfRide', args: { jur } },
          ] });
        return;
      }
      // An AI executive: conservatives cut, liberals cut less and ask for revenue.
      const fis = W().axes(ex).fis;
      const share = U.clamp(0.55 + fis * 0.35, 0.2, 0.9);
      const f = trim(J, Math.min(gap * share, t.spend * 0.03), fis > 0.3);
      GR.sim.news(s, `${office} ${W().fullName(ex)} orders ${(f * 100).toFixed(1)}% mid-year cuts to state agencies${fis > 0.3 ? ', freezes hiring and delays construction' : ''} to close the gap.`.replace('state agencies', jur === 'state' ? 'state agencies' : 'city departments'), 'gov');
      if (share < 0.75 || U.chance(0.4)) { const b = revenuePlan(s, jur, GR.billgen.factionOf(ex)); if (b) GR.sim.news(s, `${office} ${W().fullName(ex)} sends lawmakers the ${b.title}.`, 'gov'); }
    });
  }

  if (GR.scenes) Object.assign(GR.scenes.RUN, {
    sfCut: (s, a) => { const f = trim(s.jur[a.jur], a.amt, false); GR.sim.news(s, `${s.pols.me.fn} ${s.pols.me.ln} orders ${(f * 100).toFixed(1)}% across-the-board cuts to close the budget gap.`, 'gov'); return `Agencies cut operations ${(f * 100).toFixed(1)}%. Unions and agency heads are unhappy; the budget office breathes easier.`; },
    sfFreeze: (s, a) => { trim(s.jur[a.jur], a.amt, true); GR.sim.news(s, `${s.pols.me.fn} ${s.pols.me.ln} freezes hiring and delays construction to close the budget gap.`, 'gov'); return 'Hiring is frozen and projects slip a year. It closes part of the gap without layoffs.'; },
    sfRev: (s, a) => { const b = revenuePlan(s, a.jur, U.chance(0.5) ? 'liberal' : 'centrist'); if (b) GR.sim.news(s, `${s.pols.me.fn} ${s.pols.me.ln} sends lawmakers the ${b.title}.`, 'gov'); },
    sfRide: (s, a) => { const J = s.jur[a.jur]; J.F.watch = (J.F.watch || 0) + 1; GR.sim.news(s, `Rating agencies warn ${J.name} after leaders decline to close a mid-year budget gap.`, 'gov'); return 'The reserve absorbs the gap for now. Rating agencies are watching, and next year\'s budget starts deeper in the hole.'; },
  });
  if (GR.scenes) Object.assign(GR.scenes.RUN, {
    budHold: (s, a) => { const b = L().findBill(s, a.bill); if (!b) return; b.my.hold = a.region; s.caucusRel = s.caucusRel || {}; s.caucusRel[a.region] = (s.caucusRel[a.region] || 0) + 10; },
    budLever: (s, a) => { const b = L().findBill(s, a.bill); if (!b || !L().OPEN(b)) return; s.hoursLeft += 3; const r = askItem(s, b, U.pick(['school', 'road', 'water', 'park'])); return r.msg; },
  });

  // ---------- Your asks ----------
  // A project for your district in the budget: the Appropriations chair decides.
  function askItem(s, b, kind) {
    const me = s.pols.me;
    const J = s.jur[b.jur];
    const bud = b.prov.bud;
    if (!bud) return { ok: false };
    if ((bud.items || []).some((x) => x.who === 'me')) return { ok: false, msg: 'You already have a request in this budget.' };
    if (s.hoursLeft < 3) return { ok: false, msg: 'Making the case takes 3 hours.' };
    const Bd = s.bodies[b.body];
    const cm = Bd && Bd.comm[b.comm];
    const chair = cm && s.pols[cm.chair];
    s.hoursLeft -= 3;
    const ag = J.F.ag.find((a) => a.k === ({ school: 'k12', road: J.k === 'city' ? 'works' : 'dot', water: J.k === 'city' ? 'water' : 'env', park: J.k === 'city' ? 'parks' : 'gen' }[kind])) || J.F.ag[0];
    const amt = Math.round(FX().totals(J).spend * (J.k === 'city' ? 0.0006 : 0.00012));
    let p = 1;
    if (chair && !chair.isPlayer) {
      const loyal = me.standing / 100, onComm = GR.comm.isMember(s, b.body, b.comm, 'me');
      const fav = GR.lead && GR.lead.favor(s, 'item');
      if (fav) GR.lead.useFavor(s);
      p = U.clamp((fav ? 0.45 : 0) + 0.25 + G().rel(s, chair.id) / 120 + (chair.party === me.party ? 0.2 : -0.15) + (onComm ? 0.2 : 0) + (loyal - 0.4) * 0.5 + (me.lead ? 0.15 : 0), 0.05, 0.92);
    }
    if (!U.chance(p)) { if (chair) G().addRel(s, chair.id, -1); return { ok: true, msg: `${chair ? W().fullName(chair) : 'The chair'} left your project out (${Math.round(p * 100)}% odds). Loyalty to leadership and a seat on Appropriations help next time.` }; }
    const proj = L().earmarkName(s, me, ag);
    bud.items = bud.items || [];
    bud.items.push({ who: 'me', ag: ag.k, amt, proj });
    // Paid for out of the line with the least to lose for your region.
    const g = geoOf(s, me, b.jur);
    const from = lines(J).filter((l) => (bud.amt[l.k] || 0) > amt * 4).sort((a, c) => (a.geo[0] * g[0] + a.geo[1] * g[1] + a.geo[2] * g[2]) - (c.geo[0] * g[0] + c.geo[1] * g[1] + c.geo[2] * g[2]))[0];
    if (from) bud.amt[from.k] -= amt / (from.part === 'capex' ? 0.6 : 1);
    compile(J, b.prov);
    b._reg = null;
    return { ok: true, msg: `${chair ? W().fullName(chair) : 'The chair'} put the ${proj} (${U.money(amt)}) in the budget (${Math.round(p * 100)}% odds), taken out of ${from ? from.name.toLowerCase() : 'other lines'}. Leadership will expect your vote.` };
  }
  // Markup: move money between two lines (members vote on it in committee).
  function moveOptions(s, b) {
    const J = s.jur[b.jur];
    const me = s.pols.me;
    const g = geoOf(s, me, b.jur);
    const bud = b.prov.bud;
    const val = (l) => l.geo[0] * g[0] + l.geo[1] * g[1] + l.geo[2] * g[2];
    const ls = lines(J).filter((l) => (bud.amt[l.k] || 0) > 0);
    const mine = ls.slice().sort((a, c) => val(c) - val(a)).slice(0, 4);
    const theirs = ls.slice().sort((a, c) => val(a) - val(c)).slice(0, 4);
    const amt = Math.round(disc(J) * 0.003);
    const out = [];
    mine.forEach((lt, i) => { const lf = theirs[i]; if (lf && lf.k !== lt.k) out.push({ k: `bud:${lf.k}:${lt.k}:${amt}`, group: 'Budget', label: `Move ${U.money(amt)} from ${lf.name.toLowerCase()} to ${lt.name.toLowerCase()}`, cost: 4 }); });
    return out;
  }

  return { agencyRequests, reqShare, shortfall, caucusCheck, CAT, REGIONS, has, itemVeto, geoOf, regionOf, regionName, ensure, current, lines, lineOf, outlook, cash, taxYield, balance, regional, memberScore, compile, propose, move, chairMark, rework, aiItemVeto, applyItemVetoes, onEnact, addRequest, makeBill, askItem, moveOptions, disc };
})();
