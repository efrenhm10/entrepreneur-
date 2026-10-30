// Economic development: courting companies and building megaprojects.
//
// Companies: every six months a few firms are shopping for a site. Who shows up depends on
// your state's real industries and the firms actually circling it (TSMC in Arizona, Hyundai
// in Georgia, Micron in New York). Each has a top priority you learn by visiting. You build an
// incentive package (abatements, grants, training, site work, fast permits, community benefits)
// and make an offer. Winners announce, build, open, hire, and widen your tax base; abatements
// delay the revenue. Some later miss their job targets, and some leave.
//
// Megaprojects: the real projects on your state's or city's table (California High-Speed Rail,
// the Gateway tunnel, a Bears stadium) or generic ones sized to your budget. A feasibility study
// firms up the cost, then you assemble financing from competing sources (bonds that may need a
// referendum, federal grants, P3 concessions, TIF, team owners, state aid), build through
// overruns and lawsuits, and cut the ribbon. Landmarks let you choose an architectural style.
var GR = globalThis.GR || (globalThis.GR = {});

GR.develop = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const SC = () => GR.scenes;
  const PW = () => GR.power;

  // ---------- Companies ----------
  // [name, sector, size, home] — home is a state (HQ) or a country for foreign investors.
  const COMPANIES = [
    ['Amazon', 'logistics', 'L', 'WA'], ['Amazon Web Services', 'tech', 'L', 'WA'], ['Microsoft', 'tech', 'L', 'WA'], ['Google', 'tech', 'L', 'CA'], ['Meta', 'tech', 'L', 'CA'], ['Apple', 'tech', 'L', 'CA'],
    ['Nvidia', 'tech', 'M', 'CA'], ['Intel', 'tech', 'L', 'CA'], ['TSMC', 'tech', 'L', 'Taiwan'], ['Samsung', 'tech', 'L', 'South Korea'], ['Micron', 'tech', 'L', 'ID'], ['GlobalFoundries', 'tech', 'M', 'NY'],
    ['Texas Instruments', 'tech', 'L', 'TX'], ['Oracle', 'tech', 'M', 'TX'], ['Salesforce', 'tech', 'M', 'CA'], ['OpenAI', 'tech', 'M', 'CA'], ['xAI', 'tech', 'M', 'TX'], ['CoreWeave', 'tech', 'M', 'NJ'],
    ['Tesla', 'manufacturing', 'L', 'TX'], ['Ford', 'manufacturing', 'L', 'MI'], ['General Motors', 'manufacturing', 'L', 'MI'], ['Stellantis', 'manufacturing', 'L', 'Netherlands'], ['Toyota', 'manufacturing', 'L', 'Japan'],
    ['Honda', 'manufacturing', 'L', 'Japan'], ['Hyundai', 'manufacturing', 'L', 'South Korea'], ['Kia', 'manufacturing', 'M', 'South Korea'], ['BMW', 'manufacturing', 'L', 'Germany'], ['Mercedes-Benz', 'manufacturing', 'M', 'Germany'],
    ['Rivian', 'manufacturing', 'M', 'CA'], ['Panasonic Energy', 'manufacturing', 'L', 'Japan'], ['LG Energy Solution', 'manufacturing', 'L', 'South Korea'], ['SK On', 'manufacturing', 'L', 'South Korea'], ['Redwood Materials', 'manufacturing', 'M', 'NV'],
    ['Nucor', 'manufacturing', 'L', 'NC'], ['Corning', 'manufacturing', 'M', 'NY'], ['3M', 'manufacturing', 'M', 'MN'], ['Procter & Gamble', 'manufacturing', 'M', 'OH'], ['PepsiCo', 'manufacturing', 'M', 'NY'],
    ['Boeing', 'defense', 'L', 'VA'], ['Lockheed Martin', 'defense', 'L', 'MD'], ['Northrop Grumman', 'defense', 'L', 'VA'], ['RTX', 'defense', 'L', 'VA'], ['General Dynamics', 'defense', 'L', 'VA'], ['Anduril', 'defense', 'M', 'CA'], ['SpaceX', 'defense', 'L', 'TX'], ['Blue Origin', 'defense', 'M', 'WA'],
    ['Eli Lilly', 'healthcare', 'L', 'IN'], ['Pfizer', 'healthcare', 'L', 'NY'], ['Johnson & Johnson', 'healthcare', 'L', 'NJ'], ['Novo Nordisk', 'healthcare', 'L', 'Denmark'], ['Amgen', 'healthcare', 'M', 'CA'], ['Moderna', 'healthcare', 'M', 'MA'], ['HCA Healthcare', 'healthcare', 'M', 'TN'],
    ['JPMorgan Chase', 'finance', 'L', 'NY'], ['Goldman Sachs', 'finance', 'M', 'NY'], ['Bank of America', 'finance', 'L', 'NC'], ['Citadel', 'finance', 'M', 'FL'], ['Charles Schwab', 'finance', 'M', 'TX'], ['Fidelity', 'finance', 'M', 'MA'],
    ['Walmart', 'retail', 'L', 'AR'], ['Target', 'retail', 'M', 'MN'], ['Costco', 'retail', 'M', 'WA'], ['FedEx', 'logistics', 'L', 'TN'], ['UPS', 'logistics', 'L', 'GA'], ['Tyson Foods', 'ag', 'M', 'AR'], ['Cargill', 'ag', 'M', 'MN'],
    ['John Deere', 'manufacturing', 'M', 'IL'], ['Caterpillar', 'manufacturing', 'M', 'TX'], ['ExxonMobil', 'energy', 'L', 'TX'], ['Chevron', 'energy', 'L', 'TX'], ['NextEra Energy', 'energy', 'M', 'FL'], ['First Solar', 'energy', 'M', 'AZ'],
    ['Qcells', 'energy', 'M', 'South Korea'], ['Siemens Energy', 'energy', 'M', 'Germany'], ['Vestas', 'energy', 'M', 'Denmark'], ['TerraPower', 'energy', 'M', 'WA'], ['Netflix', 'tourism', 'M', 'CA'], ['Disney', 'tourism', 'L', 'CA'], ['Marriott', 'tourism', 'M', 'MD'], ['Hilton', 'tourism', 'M', 'VA'],
  ].map(([name, sector, size, home]) => ({ name, sector, size, home }));
  const FOREIGN = (h) => h.length > 2;
  const SIZE = { S: { jobs: 0.3, capex: 0.15e9 }, M: { jobs: 1.2, capex: 0.8e9 }, L: { jobs: 3.5, capex: 4e9 } };
  const PRIORITIES = { taxes: 'low taxes and a long abatement', skills: 'a skilled workforce', infra: 'roads, water and power at the site', speed: 'fast permits', market: 'a large market and talent pool', quality: 'safe, livable communities' };

  // Incentive menus. Costs are a share of the plant's capital cost.
  function incentives(lvl) {
    const nat = lvl === 'nation';
    return {
      abate: { name: nat ? 'Tax credit' : 'Tax abatement', opts: nat ? ['None', 'Investment tax credit', 'Production tax credit (10 yrs)'] : ['None', '5 years', '10 years'], odds: [0, 0.08, 0.15], prio: 'taxes', years: [0, 5, 10] },
      grant: { name: nat ? 'Federal grant (CHIPS/IRA-style)' : 'Cash grant', opts: ['None', '10% of capital cost', '25% of capital cost'], odds: [0, 0.07, 0.15], cost: [0, 0.1, 0.25] },
      train: { name: 'Workforce training', opts: ['None', 'Community college training program'], odds: [0, 0.06], cost: [0, 0.02], prio: 'skills' },
      site: { name: 'Site work', opts: ['None', 'Roads, water & power to the site'], odds: [0, 0.08], cost: [0, 0.05], prio: 'infra' },
      permit: { name: 'Permitting', opts: ['Normal review', 'Fast-track environmental permits'], odds: [0, 0.07], prio: 'speed' },
      cba: { name: 'Community benefits', opts: ['None', 'Local hiring & wage standards'], odds: [0, -0.06] },
    };
  }

  // Development state lives on each government.
  function D(J) { if (!J.dev) J.dev = { firms: [], prospects: [], pW: -1, megas: [], seq: 0, jobs: 0, temp: 0, abate: 0 }; return J.dev; }

  function laborK(J) { return Math.max(1, (J.pop || 1e6) * 0.5 / 1000); }
  function addJobs(J, thousands, temp) {
    const d = D(J);
    if (temp) d.temp += thousands; else d.jobs += thousands;
  }
  // Jobs as a share of the labor force (percentage points), used by the economy.
  function jobsPct(J) { const d = J.dev; return ((d ? d.jobs + d.temp * 0.6 : 0) + (GR.prog ? GR.prog.jobsK(J.F) : 0)) / laborK(J) * 100; }

  function playerJ(s) { const me = s.pols.me; if (!me.seat) return null; const o = GR.OFFICES[s.seats[me.seat].off]; return o.exec && ['city', 'state', 'nation'].includes(o.jur) ? s.jur[o.jur] : null; }

  // The government whose legislature the player sits in (city council, legislature, Congress).
  function legisJ(s) { const me = s.pols.me; if (!me.seat) return null; const o = GR.OFFICES[s.seats[me.seat].off]; return !o.exec && ['city', 'state', 'nation'].includes(o.jur) ? s.jur[o.jur] : null; }
  const execFor = (s, J) => GR.gov.execOf(s, J.k);
  const bodyFor = (s, J) => GR.gov.bodiesOf(s, J.k)[0] || null;

  // Where a plant or project goes: a real ZIP code (and so real districts) in your state.
  function pickZip(s, J, host, mine) {
    const S = GR.geo.state(s.home.state);
    if (J.k === 'nation' && host !== s.home.state) return null;
    const me = s.pols.me;
    if (mine && me.seat && GR.OFFICES[s.seats[me.seat].off].level > 0) { const z = W().pickZipIn(s, s.seats[me.seat]); if (z != null) return z; }
    const pool = J.k === 'city' ? (S.cityZips[s.home.city] || [S.zipIdx[s.home.zip]]) : S.Z.filter((z) => z.pop > 2000).map((z) => z.i);
    const pick = U.weighted(pool.map((i) => [i, 1]), (x) => S.Z[x[0]].pop + 1);
    return pick ? pick[0] : S.zipIdx[s.home.zip];
  }
  function placeOf(s, J, zi, host) {
    if (zi == null) return host ? GR.STATE[host].name : 'the United States';
    const S = GR.geo.state(s.home.state);
    const z = S.Z[zi];
    const city = GR.geo.cityName(S, z.city);
    if (J.k === 'city') return `${city} (ZIP ${z.zip || ''})`.replace(' (ZIP )', '');
    return J.k === 'nation' ? `${city}, ${GR.STATE[s.home.state].name}` : city;
  }
  const seatsAt = (s, zi) => (zi == null ? [] : [].concat(...Object.values(W().homeSeats(s, zi))));
  function inMyDistrict(s, x) { const me = s.pols.me; return !!(me.seat && x && x.seats && x.seats.includes(me.seat)); }
  const needsAuth = (s, J, amt) => !!bodyFor(s, J) && amt > GR.fisc.totals(J).spend * ({ city: 0.01, state: 0.002, nation: 0.0003 }[J.k] || 1);

  // An authorization bill: big incentive deals and megaproject financing need the legislature.
  function authBill(s, J, dev, title, sum, spon) {
    const L = GR.legis;
    const b = L.newBill(s, J.k, { title, prov: L.emptyProv(), spon, dev, kind: 'regular' });
    const ks = Object.keys(s.bodies[b.body].comm || {});
    b.comm = ['approp', 'budget', 'finance', 'commerce', 'ways'].find((k) => ks.includes(k)) || ks[0];
    b.sum = sum;
    L.analysis(s, b);
    (J.bills || (J.bills = [])).push(b);
    return b;
  }
  // How each lawmaker weighs a deal or a project, on top of party and relationships.
  function voteTerms(s, p, b) {
    const d = b.dev, ax = W().axes(p);
    const host = d.seats && p.seat && d.seats.includes(p.seat);
    const hawk = Math.max(0, ax.fis);
    if (d.kind === 'deal') return { it: (ax.fis > 0 ? 0.08 * Math.min(1, ax.fis) - (ax.fis > 1.4 ? 0.12 : 0) : -0.04) - (ax.fis < -0.4 && !d.cba ? 0.1 : 0) + (ax.fis < -0.4 && d.cba ? 0.1 : 0), di: 0.25 + (host ? 0.5 : 0), ae: -d.share * 25 * (0.3 + hawk), pc: host ? 0.2 : 0 };
    return { it: ax.fis > 0 ? -0.1 * ax.fis : 0.06, di: 0.12 + (host ? 0.45 : 0), ae: -d.share * 6 * (0.3 + hawk), pc: host ? 0.2 : 0 };
  }

  function stateOf(s, J) { return J.k === 'nation' ? null : s.home.state; }
  function scaleFor(J) { return J.k === 'city' ? (J.pop > 500000 ? 0.6 : J.pop > 150000 ? 0.35 : 0.2) : J.k === 'state' ? 1 : 1.3; }

  function refresh(s, J, force) {
    const d = D(J);
    if (!force && d.pW >= 0 && s.week - d.pW < 26 && d.prospects.length) return d.prospects;
    d.pW = s.week;
    const ab = stateOf(s, J);
    const inds = ab ? GR.STATE_IND[ab] || [] : [];
    const doss = ab ? (GR.REGION[ab] || {}).firms || [] : [];
    const have = new Set(d.firms.map((f) => f.name));
    const pool = [];
    // Firms already circling this state.
    doss.forEach(([name, sector, size, hq]) => { if (!have.has(name)) pool.push({ name, sector, size, home: hq ? ab : null, w: hq ? 1.2 : 3, suitor: !hq, expand: !!hq }); });
    COMPANIES.forEach((c) => { if (have.has(c.name) || c.home === ab) return; pool.push(Object.assign({}, c, { w: 1 + (inds.includes(c.sector) ? 2 : 0) })); });
    const out = [];
    const sc = scaleFor(J);
    while (out.length < 3 && pool.length) {
      const tot = U.sum(pool, (x) => x.w);
      let r = U.rand() * tot, i = 0;
      for (; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) break; }
      const c = pool.splice(Math.min(i, pool.length - 1), 1)[0];
      let size = c.size;
      if (J.k === 'city' && size === 'L' && J.pop < 300000) size = 'M';
      const z = SIZE[size];
      out.push({ name: c.expand ? `${c.name} expansion` : c.name, base: c.name, sector: c.sector, size, home: c.home, suitor: !!c.suitor, expand: !!c.expand, prio: U.pick(Object.keys(PRIORITIES)), known: false,
        jobs: U.round(z.jobs * (c.expand ? 0.5 : 1) * (0.8 + U.rand() * 0.5) * (J.k === 'city' ? 0.7 : 1), 2), capex: Math.round(z.capex * (c.expand ? 0.4 : 1) * (0.8 + U.rand() * 0.6) * sc),
        inc: { abate: 0, grant: 0, train: 0, site: 0, permit: 0, cba: 0 }, host: J.k === 'nation' ? hostState(s, c) : null });
    }
    // Homegrown startups looking for help.
    d.prospects = out;
    return out;
  }
  function hostState(s, c) {
    const cands = GR.STATES.filter((st) => st.ab !== 'DC' && (GR.STATE_IND[st.ab] || []).includes(c.sector));
    return (U.pick(cands.length ? cands : GR.STATES)).ab;
  }

  // What pushes a company toward yes or no, as [label, change in odds].
  function oddsParts(s, J, p) {
    const F = J.F, me = s.pols.me, parts = [];
    const add = (l, v) => { if (Math.abs(v) >= 0.005) parts.push([l, v]); };
    const dbl = (k) => (p.prio === k ? 2 : 1);
    add('Base interest', p.suitor ? 0.3 : p.expand ? 0.35 : 0.2);
    const inc = incentives(J.k);
    let ins = 0; Object.entries(inc).forEach(([k, x]) => { ins += x.odds[p.inc[k]] * (x.prio ? dbl(x.prio) : 1); }); add('Your incentives', ins);
    const corp = F.tax.corp != null ? F.tax.corp : null;
    if (corp != null) add(`Corporate tax (${U.round(corp, 1)}%)`, U.clamp(((J.k === 'nation' ? 21 : 6) - corp) * (J.k === 'nation' ? 0.008 : 0.02), -0.12, 0.1) * dbl('taxes'));
    if (J.k === 'city' && F.tax.prop != null) add(`Property tax (${U.round(F.tax.prop, 1)} mills)`, U.clamp((F.tax0.prop - F.tax.prop) * 0.01, -0.08, 0.08) * dbl('taxes'));
    const cs = (k) => (F.crises[k] ? F.crises[k].s : 40);
    add('Workforce & schools', (45 - cs('education')) / 250 * dbl('skills') * (['tech', 'healthcare', 'defense', 'finance'].includes(p.sector) ? 1.5 : 1));
    add('Infrastructure', ((45 - cs('infra')) / 300 + (F.mac.K.infra - 100) / 400) * dbl('infra'));
    if (['tech', 'manufacturing', 'energy'].includes(p.sector)) add('Water & power supply', ((40 - cs('water')) / 300 + (40 - cs('energy')) / 400));
    add('Public safety & livability', ((40 - cs('crime')) / 400 + (45 - cs('housing')) / 500) * dbl('quality'));
    add(`Credit rating (${F.ratingLabel})`, (F.rating - 75) / 400);
    const ab = stateOf(s, J);
    if (ab && (GR.STATE_IND[ab] || []).includes(p.sector)) add('Existing industry cluster', 0.08);
    if (J.k === 'nation' && p.host) add(`Fit in ${GR.STATE[p.host].name}`, 0.05);
    add('Market size', U.clamp(Math.log10(Math.max(1e4, J.pop || 1e6)) - 5.5, -0.5, 2.5) * 0.03 * dbl('market'));
    const bonus = U.sum((D(J).megas || []).filter((m) => m.stage === 'done'), (m) => (MEGA[m.type].odds || {})[p.sector] || (MEGA[m.type].odds || {}).all || 0);
    if (bonus) add('Megaprojects & landmarks', bonus);
    add('Your skill', (me.sk.policy - 50) / 500 + (me.sk.charisma - 50) / 600);
    const econ = s.cabinet && s.cabinet.posts && Object.values(s.cabinet.posts).find((c) => c && c.econ);
    if (econ) add(`Your ${econ.title}`, (econ.comp - 3) * 0.02);
    if (p.known) add('You know what they want', 0.05);
    const biz = PW().get(s, 'business');
    if (biz != null) add('Business climate', (biz - 50) / 500);
    return parts;
  }
  const odds = (s, J, p) => U.clamp(U.sum(oddsParts(s, J, p), (x) => x[1]), 0.03, 0.95);

  function packageCost(J, p) {
    const inc = incentives(J.k);
    return p.capex * (inc.grant.cost[p.inc.grant] + inc.train.cost[p.inc.train] + inc.site.cost[p.inc.site]);
  }

  function setInc(s, i, k, v) { const J = playerJ(s); const p = J && D(J).prospects[i]; if (p) p.inc[k] = U.clamp(+v, 0, incentives(J.k)[k].opts.length - 1); }

  function visit(s, i) {
    const J = playerJ(s); const p = J && D(J).prospects[i];
    if (!p || p.known) return { ok: false };
    if (s.hoursLeft < 4) return { ok: false, msg: 'A site visit takes 4 hours.' };
    s.hoursLeft -= 4;
    p.known = true;
    return { ok: true, msg: `${p.base}'s site selection team cares most about ${PRIORITIES[p.prio]}.` };
  }

  function offer(s, i) {
    const J = playerJ(s);
    const d = J && D(J);
    const p = d && d.prospects[i];
    if (!p) return { ok: false };
    const me = s.pols.me;
    const cost = { city: 4, state: 8, nation: 12 }[J.k];
    if (me.pp < cost) return { ok: false, msg: `An offer costs ${cost} political points.` };
    me.pp -= cost;
    const o = odds(s, J, p);
    d.prospects.splice(i, 1);
    if (!U.chance(o)) {
      GR.sim.log(s, `${p.base} chose another site.`);
      return { ok: true, msg: `${p.base} turned you down and chose another ${J.k === 'nation' ? 'country' : 'location'} (${Math.round(o * 100)}% odds).` };
    }
    const pc = packageCost(J, p);
    const f = landFirm(s, J, p, pc, 'me');
    if (f.pending) return { ok: true, msg: `${p.base} agreed in principle. The ${U.money(pc)} incentive package now needs approval from the ${GR.BODIES[bodyFor(s, J)].name}: watch the docket and work the votes.` };
    return { ok: true, msg: `${p.base} accepted! ${U.num(Math.round(f.jobs * 1000))} jobs in ${f.where}, opening ${U.fmtDate(f.openW)}. Incentive package: ${U.money(pc)}.` };
  }

  // Create a firm from an accepted offer (by you or an AI executive). Big packages wait for the legislature.
  function landFirm(s, J, p, pc, spon, opts = {}) {
    const d = D(J);
    const inc = incentives(J.k);
    const zi = opts.zi !== undefined ? opts.zi : pickZip(s, J, p.host, false);
    const f = { id: ++d.seq, name: p.name, base: p.base, sector: p.sector, size: p.size, home: p.home, jobs: p.jobs * (p.inc.cba ? 1.1 : 1), capex: p.capex, out: p.capex * 0.55, zi, seats: seatsAt(s, zi), where: placeOf(s, J, zi, p.host),
      abateYears: inc.abate.years[p.inc.abate], open: false, annW: s.week, cba: !!p.inc.cba, permit: !!p.inc.permit, target: p.jobs, cost: pc, byMe: spon === 'me', years: p.expand ? 1 : p.size === 'L' ? 2.5 : p.size === 'M' ? 1.5 : 1 };
    d.firms.push(f);
    if (needsAuth(s, J, pc)) {
      f.pending = true;
      const b = authBill(s, J, { kind: 'deal', id: f.id, share: pc / GR.fisc.totals(J).spend, cba: f.cba, seats: f.seats }, `${p.base} Economic Development Agreement`, `${U.money(pc)} in incentives for ${p.base} in ${f.where}: ${U.num(Math.round(f.jobs * 1000))} jobs, ${U.money(p.capex)} investment`, spon);
      f.bill = b.id;
      GR.sim.news(s, `${p.base} deal for ${f.where} goes to the ${GR.BODIES[b.body].name}: ${U.money(pc)} in incentives.`, 'econ');
    } else announce(s, J, f);
    return f;
  }
  function announce(s, J, f) {
    f.pending = false;
    f.openW = s.week + Math.round(f.years * 52);
    SC().pay(J, f.cost);
    addJobs(J, f.jobs * 0.35, true);
    f.tempJobs = f.jobs * 0.35;
    const me = s.pols.me;
    if (f.byMe) {
      me.app = U.clamp(me.app + Math.min(4, f.jobs * (J.k === 'nation' ? 0.3 : J.k === 'state' ? 0.8 : 2)), 1, 99);
      PW().shift(s, 'business', 3);
      if (f.permit) PW().shift(s, 'environment', -5);
      if (f.cba) PW().shift(s, 'labor', 4);
      GR.sim.log(s, `Landed ${f.name} in ${f.where}.`);
    } else if (inMyDistrict(s, f)) {
      me.app = U.clamp(me.app + Math.min(3, f.jobs * 1.5), 1, 99);
      PW().shift(s, 'local', 3); PW().shift(s, 'business', 2);
      GR.sim.msgInbox(s, `${f.base} is coming to your district`, `${f.base} will build in ${f.where}, in your district: ${U.num(Math.round(f.jobs * 1000))} jobs. Constituents give you credit.`);
    }
    GR.sim.news(s, `${f.base} picks ${f.where}: ${U.num(Math.round(f.jobs * 1000))} jobs and ${U.money(f.capex)} in investment.`, 'econ');
  }

  // Back homegrown businesses: a small-business grant program or a venture fund.
  function backLocal(s, way) {
    const J = playerJ(s);
    if (!J) return { ok: false };
    const me = s.pols.me;
    if (me.pp < 6) return { ok: false, msg: 'Costs 6 political points.' };
    me.pp -= 6;
    const spend = GR.fisc.totals(J).spend * (way === 'fund' ? 0.002 : 0.0008);
    SC().pay(J, spend);
    const d = D(J);
    const p = way === 'fund' ? 0.55 : 0.75;
    if (!U.chance(p)) return { ok: true, msg: `The ${way === 'fund' ? 'venture fund\'s first bets' : 'grant program'} did not pan out this round (${U.money(spend)} spent).` };
    const inds = J.k === 'nation' ? ['tech', 'manufacturing'] : GR.STATE_IND[s.home.state] || ['manufacturing'];
    const sector = U.pick(inds);
    const suffix = { tech: 'Labs', manufacturing: 'Works', ag: 'Farms Co-op', energy: 'Energy', finance: 'Capital', healthcare: 'Health', defense: 'Systems', tourism: 'Hospitality', logistics: 'Logistics', retail: 'Market', education: 'Learning', construction: 'Builders' }[sector] || 'Co.';
    const name = `${J.k === 'city' ? s.home.cityName : J.k === 'state' ? GR.STATE[s.home.state].name : 'American'} ${suffix}`;
    const jobs = U.round((way === 'fund' ? 0.4 : 0.15) * (J.k === 'city' ? 0.6 : 1) * (0.6 + U.rand()), 2);
    d.firms.push({ id: ++d.seq, name, base: name, sector, size: 'S', home: s.home.state, jobs, capex: spend * 3, out: spend * 2, where: s.home.cityName, abateYears: 0, open: true, openW: s.week, openY: U.yearOf(s.week), local: true, target: jobs });
    addJobs(J, jobs);
    return { ok: true, msg: `${name} took off with state backing: ${U.num(Math.round(jobs * 1000))} jobs.` };
  }

  // ---------- Megaprojects ----------
  // fx: what the finished project does (scene effects vocabulary), K: public capital, odds: company odds bonus by sector.
  const MEGA = {
    hsr: { name: 'High-speed rail', icon: '🚄', years: 8, fx: { cr: { infra: -6, housing: -1 }, app: 3 }, K: { infra: 6 }, jobs: 2, odds: { all: 0.03 }, fin: ['cash', 'go', 'fed', 'p3'], fed: 0.5, prot: 0.3 },
    transit: { name: 'Transit line', icon: '🚇', years: 6, fx: { cr: { infra: -4, housing: -1 }, app: 2 }, K: { infra: 4 }, jobs: 0.6, odds: { tech: 0.03, finance: 0.03 }, fin: ['cash', 'go', 'fed', 'sales', 'p3'], fed: 0.5, prot: 0.2 },
    highway: { name: 'Highway', icon: '🛣️', years: 5, fx: { cr: { infra: -4 }, app: 1 }, K: { infra: 4 }, jobs: 0.4, odds: { logistics: 0.05, manufacturing: 0.03 }, fin: ['cash', 'go', 'fed', 'p3'], fed: 0.5, prot: 0.2 },
    bridge: { name: 'Bridge', icon: '🌉', years: 4, fx: { cr: { infra: -4 }, app: 2 }, K: { infra: 3 }, jobs: 0.2, odds: { logistics: 0.03 }, fin: ['cash', 'go', 'fed', 'p3'], fed: 0.6, landmark: true },
    tunnel: { name: 'Rail tunnel', icon: '🚆', years: 8, fx: { cr: { infra: -5 } }, K: { infra: 5 }, jobs: 0.5, odds: { finance: 0.03 }, fin: ['cash', 'go', 'fed'], fed: 0.6 },
    port: { name: 'Port expansion', icon: '⚓', years: 4, fx: { cr: { infra: -2 } }, K: { infra: 3 }, jobs: 1, odds: { logistics: 0.08, manufacturing: 0.04, energy: 0.03 }, fin: ['cash', 'rev', 'fed', 'p3'], fed: 0.3 },
    airport: { name: 'Airport terminal', icon: '🛫', years: 4, fx: { cr: { infra: -2 }, app: 1 }, K: { infra: 2 }, jobs: 0.6, odds: { tourism: 0.06, finance: 0.03, tech: 0.02 }, fin: ['cash', 'rev', 'fed', 'p3'], fed: 0.3, landmark: true },
    water: { name: 'Water supply', icon: '💧', years: 6, fx: { cr: { water: -8 }, app: 1 }, K: { infra: 2 }, jobs: 0.3, odds: { tech: 0.05, manufacturing: 0.04, ag: 0.04 }, fin: ['cash', 'go', 'rev', 'fed'], fed: 0.4, prot: 0.2 },
    flood: { name: 'Flood protection', icon: '🌊', years: 6, fx: { cr: { disaster: -8, housing: -1 }, app: 2 }, K: { infra: 2 }, jobs: 0.2, odds: { all: 0.02 }, fin: ['cash', 'go', 'fed'], fed: 0.65 },
    grid: { name: 'Power grid', icon: '⚡', years: 4, fx: { cr: { energy: -5, disaster: -1 } }, K: { infra: 2 }, jobs: 0.4, odds: { tech: 0.06, manufacturing: 0.05 }, fin: ['cash', 'rev', 'fed', 'p3'], fed: 0.3 },
    pipeline: { name: 'Pipeline', icon: '🛢️', years: 5, fx: { cr: { energy: -3 } }, jobs: 0.6, odds: { energy: 0.08 }, fin: ['p3', 'rev'], fed: 0, prot: 0.4, envHit: 8 },
    nuclear: { name: 'Nuclear plant', icon: '⚛️', years: 7, fx: { cr: { energy: -6 } }, K: { rd: 2 }, jobs: 0.8, odds: { tech: 0.06, manufacturing: 0.04 }, fin: ['rev', 'fed', 'p3'], fed: 0.3, prot: 0.3 },
    fab: { name: 'Industrial & chip park', icon: '🏭', years: 3, fx: { cr: { migration: -1 } }, K: { rd: 2 }, jobs: 1.5, odds: { tech: 0.12, manufacturing: 0.08 }, fin: ['cash', 'go', 'fed'], fed: 0.3 },
    research: { name: 'Research campus', icon: '🔬', years: 4, fx: { cr: { migration: -2, education: -1 } }, K: { rd: 5, hum: 1 }, jobs: 0.8, odds: { tech: 0.08, healthcare: 0.08, defense: 0.05 }, fin: ['cash', 'go', 'fed'], fed: 0.3 },
    stadium: { name: 'Stadium', icon: '🏟️', years: 4, fx: { app: 4, pw: { business: 4 } }, jobs: 0.5, odds: { tourism: 0.06 }, fin: ['cash', 'go', 'tif', 'owner', 'sales'], fed: 0, landmark: true, prot: 0.2 },
    arena: { name: 'Arena', icon: '🏀', years: 3, fx: { app: 3 }, jobs: 0.3, odds: { tourism: 0.04 }, fin: ['cash', 'go', 'tif', 'owner'], fed: 0, landmark: true },
    convention: { name: 'Convention center', icon: '🏛️', years: 4, fx: { app: 1 }, jobs: 0.5, odds: { tourism: 0.07 }, fin: ['cash', 'rev', 'tif'], fed: 0, landmark: true },
    housing: { name: 'Housing program', icon: '🏘️', years: 5, fx: { cr: { housing: -7, homeless: -3 }, app: 2 }, K: { hum: 1 }, jobs: 0.3, odds: { all: 0.02 }, fin: ['cash', 'go', 'fed', 'tif'], fed: 0.2 },
    broadband: { name: 'Broadband', icon: '📡', years: 3, fx: { cr: { migration: -2, education: -1 } }, K: { infra: 1 }, jobs: 0.2, odds: { tech: 0.04 }, fin: ['cash', 'fed'], fed: 0.7 },
    prison: { name: 'Prison complex', icon: '🏢', years: 3, fx: { cr: { crime: -2 } }, jobs: 0.3, fin: ['cash', 'go'], fed: 0, prot: 0.3 },
    border: { name: 'Border barrier', icon: '🧱', years: 4, fx: { cr: { border: -6 } }, jobs: 0.2, fin: ['cash'], fed: 0, prot: 0.3 },
    park: { name: 'Park', icon: '🌳', years: 2, fx: { app: 2, cr: { crime: -1 } }, jobs: 0.05, odds: { tourism: 0.03 }, fin: ['cash', 'go', 'tif'], fed: 0.1, landmark: true },
    museum: { name: 'Museum', icon: '🖼️', years: 3, fx: { app: 1 }, jobs: 0.1, odds: { tourism: 0.04 }, fin: ['cash', 'go'], fed: 0.1, landmark: true },
    energy: { name: 'Mine', icon: '⛏️', years: 4, fx: {}, jobs: 0.8, odds: { energy: 0.06 }, fin: ['p3'], fed: 0, prot: 0.4, envHit: 10 },
  };
  // Projects every city can consider (sized to the city's budget, in multiples of annual spending).
  const CITY_GENERIC = [['park', 'Downtown riverfront park', 0.04], ['transit', 'Bus rapid transit line', 0.12], ['housing', 'Affordable housing bond program', 0.15], ['water', 'Water treatment plant upgrade', 0.1], ['arena', 'Downtown events arena', 0.25], ['convention', 'Convention center expansion', 0.2], ['bridge', 'Signature pedestrian bridge', 0.05], ['broadband', 'Municipal fiber network', 0.08]];
  const NATION_MEGAS = [['hsr', 'Northeast Corridor high-speed upgrade', 117, 12], ['highway', 'Interstate System rebuild (Interstate 2.0)', 150, 10], ['grid', 'National transmission superhighway', 60, 8], ['nuclear', 'Advanced reactor fleet (SMRs)', 40, 9], ['fab', 'National semiconductor manufacturing parks', 50, 5], ['broadband', 'Universal broadband (BEAD) build-out', 42, 5], ['water', 'Western water security & Colorado River program', 25, 8], ['border', 'Southern border barrier & technology', 25, 4], ['research', 'National AI research cloud & labs', 20, 4], ['flood', 'Coastal resilience & levee program', 30, 10], ['port', 'Ports modernization & shipbuilding program', 20, 6], ['housing', 'National housing supply fund', 50, 8]];

  function options(s) { const J = playerJ(s); return J ? optionsFor(s, J) : []; }
  function optionsFor(s, J) {
    const d = D(J);
    const taken = new Set(d.megas.filter((p) => p.stage !== 'cancelled').map((p) => p.name));
    let list = [];
    if (J.k === 'state') list = ((GR.REGION[s.home.state] || {}).megas || []).map(([type, name, cost, years]) => ({ type, name, cost: cost * 1e9, years, real: true }));
    else if (J.k === 'city') {
      list = ((PW().cityDossier(s) || {}).megas || []).map(([type, name, cost, years]) => ({ type, name, cost: cost * 1e9 * cityShare(s, J), years, real: true }));
      const spend = GR.fisc.totals(J).spend;
      CITY_GENERIC.forEach(([type, name, f]) => list.push({ type, name: `${s.home.cityName} ${name.charAt(0).toLowerCase() + name.slice(1)}`, cost: spend * f, years: MEGA[type].years }));
    } else list = NATION_MEGAS.map(([type, name, cost, years]) => ({ type, name, cost: cost * 1e9, years, real: true }));
    return list.filter((x) => MEGA[x.type] && !taken.has(x.name));
  }
  // A big real project in a city dossier is shared with the state and others: the city pays a slice.
  function cityShare(s, J) { return 0.35; }

  function active(J) { return D(J).megas.filter((p) => !['done', 'cancelled'].includes(p.stage)); }

  function startStudy(s, idx) {
    const J = playerJ(s);
    if (!J) return { ok: false };
    const o = options(s)[idx];
    if (!o) return { ok: false };
    if (active(J).length >= 3) return { ok: false, msg: 'You can run three megaprojects at a time.' };
    const me = s.pols.me;
    const pp = { city: 5, state: 8, nation: 12 }[J.k];
    if (me.pp < pp) return { ok: false, msg: `A feasibility study costs ${pp} political points.` };
    me.pp -= pp;
    SC().pay(J, o.cost * 0.004);
    const d = D(J);
    const zi = J.k === 'nation' ? null : pickZip(s, J, null, false);
    const p = { id: ++d.seq, type: o.type, name: o.name, real: o.real, est: o.cost, years: o.years, stage: 'study', until: s.week + 26, style: 1, fin: {}, startW: s.week, zi, seats: seatsAt(s, zi), where: placeOf(s, J, zi, null), mine: true };
    d.megas.push(p);
    return { ok: true, msg: `Engineers begin a feasibility study for the ${o.name}. Results in six months.` };
  }

  const STYLES = [{ k: 'plain', name: 'Practical', mult: 0.8, appeal: 0.5 }, { k: 'modern', name: 'Contemporary', mult: 1, appeal: 1 }, { k: 'heritage', name: 'Historic revival', mult: 1.1, appeal: 1.15 }, { k: 'star', name: 'Star architect', mult: 1.45, appeal: 1.8 }];
  function setStyle(s, id, k) { const J = playerJ(s); const p = J && D(J).megas.find((x) => x.id === +id); if (p && p.stage === 'financing' && MEGA[p.type].landmark) p.style = U.clamp(+k, 0, STYLES.length - 1); }
  function rename(s, id, name) { const J = playerJ(s); const p = J && D(J).megas.find((x) => x.id === +id); if (p && name && name.trim()) p.name = name.trim().slice(0, 80); }
  const cost = (p) => p.cost * (MEGA[p.type].landmark ? STYLES[p.style].mult : 1);

  // Financing sources open to a project. share: maximum share of the cost.
  function sources(s, J, p) {
    const T = MEGA[p.type];
    const out = [];
    const me = s.pols.me;
    const fedPres = s.pols[s.nat.president];
    const sameParty = fedPres && fedPres.party === me.party;
    const t = GR.fisc.totals(J);
    const big = cost(p) > t.spend * 0.05;
    const add = (o) => out.push(o);
    if (T.fin.includes('cash')) add({ k: 'cash', name: J.k === 'nation' ? 'Treasury borrowing (deficit)' : 'Pay from the budget & reserves', share: J.k === 'nation' ? 1 : U.clamp((J.F.reserve * 0.6) / Math.max(1, cost(p)), 0, 1), note: J.k === 'nation' ? 'Congress must approve the spending. Adds to the deficit.' : `Uses up to 60% of your ${U.money(J.F.reserve)} reserve.`, need: J.k === 'nation' ? 'congress' : null });
    if (T.fin.includes('go') && J.k !== 'nation') add({ k: 'go', name: 'General obligation bonds', share: 0.8, note: big ? 'Voters must approve the bonds in a referendum.' : 'Repaid from general taxes over 30 years.', need: big ? 'vote' : null });
    if (T.fin.includes('rev') && J.k !== 'nation') add({ k: 'rev', name: 'Revenue bonds', share: 0.6, note: 'Repaid from tolls, fares or user fees. Higher interest; no vote needed.' });
    if (T.fin.includes('fed') && J.k !== 'nation' && T.fed > 0) add({ k: 'fed', name: fedName(p.type), share: T.fed, note: `Competitive federal grant. ${sameParty ? 'The President is in your party.' : 'The administration is of the other party.'}`, odds: U.clamp(0.4 + (sameParty ? 0.2 : -0.1) + (me.standing - 50) / 300 + (p.real ? 0.1 : 0), 0.1, 0.9) });
    if (T.fin.includes('p3')) add({ k: 'p3', name: 'Public-private partnership', share: 0.5, note: 'A private consortium builds and operates it for decades, paid by tolls and availability payments. Voters dislike tolls.' });
    if (T.fin.includes('tif') && J.k === 'city') add({ k: 'tif', name: 'Tax increment financing (TIF) district', share: 0.35, note: 'Future property tax growth around the project pays for it.' });
    if (T.fin.includes('owner')) add({ k: 'owner', name: 'Team owner contribution', share: 0.45, note: 'The franchise pays a share in exchange for a long, cheap lease.', odds: 0.75 });
    if (T.fin.includes('sales') && J.k !== 'nation') add({ k: 'sales', name: 'Dedicated sales tax (ballot measure)', share: 1, note: 'A new local sales tax. Voters must approve it.', need: 'vote' });
    if (J.k === 'city') { const gov = GR.gov.execOf(s, 'state'); add({ k: 'state', name: 'State aid', share: 0.3, note: `${gov ? W().fullName(gov) + (gov.party === me.party ? ' is in your party.' : ' is from the other party.') : ''}`, odds: U.clamp(0.4 + (gov && gov.party === me.party ? 0.25 : -0.1), 0.1, 0.85) }); }
    return out;
  }
  function fedName(type) { return { transit: 'FTA Capital Investment Grant', hsr: 'Federal Railroad Administration grant', tunnel: 'Federal rail grant', highway: 'Federal highway grant (IIJA)', bridge: 'Bridge Investment Program grant', water: 'EPA State Revolving Fund', flood: 'Army Corps & FEMA resilience grant', airport: 'FAA Airport Improvement Program', port: 'MARAD port grant', broadband: 'BEAD broadband grant', fab: 'CHIPS Act grant', research: 'NSF/DOE research grant', grid: 'DOE grid resilience grant', housing: 'HUD housing grant', nuclear: 'DOE loan programs office', park: 'Federal recreation grant', museum: 'NEH/NEA grant' }[type] || 'Federal grant'; }

  function setFin(s, id, k, share) {
    const J = playerJ(s); const p = J && D(J).megas.find((x) => x.id === +id);
    if (!p || p.stage !== 'financing') return;
    const src = sources(s, J, p).find((x) => x.k === k);
    if (!src) return;
    const v = U.clamp(+share || 0, 0, Math.round(src.share * 100));
    if (v) p.fin[k] = v; else delete p.fin[k];
  }
  const finTotal = (p) => U.sum(Object.values(p.fin), (v) => v);

  // Close financing: referendums, grant competitions and Congress decide; then construction starts.
  function close(s, id) {
    const J = playerJ(s);
    const p = J && D(J).megas.find((x) => x.id === +id);
    if (!p || p.stage !== 'financing') return { ok: false };
    if (finTotal(p) < 100) return { ok: false, msg: `Financing covers ${finTotal(p)}% of the cost. You need 100%.` };
    const me = s.pols.me;
    const srcs = sources(s, J, p);
    const notes = [];
    const T = MEGA[p.type];
    const C = cost(p);
    for (const [k, pct] of Object.entries(p.fin)) {
      const src = srcs.find((x) => x.k === k);
      if (!src) return { ok: false, msg: 'A financing source is no longer available.' };
      if (src.need === 'vote') {
        const yes = U.clamp(0.45 + (me.app - 50) / 120 + (T.fx.app || 0) * 0.02 - (k === 'sales' ? 0.06 : 0) + U.gauss() * 0.06, 0.2, 0.8);
        if (yes < 0.5) { p.fin = {}; return { ok: true, msg: `Voters rejected the ${src.name.toLowerCase()} for the ${p.name}, ${Math.round(yes * 100)}% yes. Find other financing.` }; }
        notes.push(`Voters approved the ${src.name.toLowerCase()} with ${Math.round(yes * 100)}%.`);
      }
      if (src.odds != null && !U.chance(src.odds)) { delete p.fin[k]; return { ok: true, msg: `The ${src.name} application was turned down. Find another source.` }; }
    }
    // Bonds and budget money above a threshold need the legislature's authorization.
    const pub = ['cash', 'go', 'rev'].reduce((t, k) => t + (p.fin[k] || 0), 0) * C / 100;
    if (needsAuth(s, J, pub) || (J.k === 'nation' && p.fin.cash)) {
      p.stage = 'authorizing';
      const b = authBill(s, J, { kind: 'mega', id: p.id, share: pub / GR.fisc.totals(J).spend, seats: p.seats || [] }, `${p.name} Authorization Act`, `Authorizes ${U.money(pub)} in ${J.k === 'nation' ? 'federal funding' : 'bonds and appropriations'} for the ${p.name}`, me.seat && GR.OFFICES[s.seats[me.seat].off].exec ? 'me' : (execFor(s, J) || {}).id);
      p.bill = b.id;
      return { ok: true, msg: `${notes.join(' ')} The ${p.name} needs authorization from the ${GR.BODIES[b.body].name}. The bill is on the docket: work the votes in Negotiations.` };
    }
    startBuild(s, J, p, true);
    return { ok: true, msg: `${notes.join(' ')} Ground is broken on the ${p.name}. Completion expected ${U.yearOf(p.until)}.` };
  }
  function startBuild(s, J, p, mine) {
    const me = s.pols.me;
    const T = MEGA[p.type];
    const C = cost(p);
    Object.entries(p.fin).forEach(([k, pct]) => {
      const amt = C * pct / 100;
      if (k === 'cash') SC().pay(J, amt);
      if (k === 'go' || k === 'rev') J.F.debt += amt * (k === 'rev' ? 1.1 : 1);
      if (k === 'sales') { if (J.F.tax.sales != null) J.F.tax.sales = U.round(J.F.tax.sales + Math.max(0.1, amt / Math.max(1, GR.fisc.totals(J).spend) * 4), 2); else J.F.tax.prop += 0.5; }
      if (!mine) return;
      if (k === 'p3') { me.app = U.clamp(me.app - 1, 1, 99); PW().shift(s, 'business', 3); }
      if (k === 'owner') PW().shift(s, 'taxpayers', 2);
      if (k === 'tif') PW().shift(s, 'business', 2);
    });
    p.stage = 'building';
    p.buildW = s.week;
    p.until = s.week + Math.round(p.years * 52);
    p.spent = C;
    p.temp = (T.jobs || 0.3) * 0.8 * (J.k === 'city' ? 0.6 : 1);
    addJobs(J, p.temp, true);
    if (mine) { PW().shift(s, 'labor', 4); if (T.envHit) PW().shift(s, 'environment', -T.envHit); }
    else if (inMyDistrict(s, p)) { PW().shift(s, 'local', 3); me.app = U.clamp(me.app + 1, 1, 99); }
    GR.sim.news(s, `Construction begins on the ${p.name}.`, 'econ');
  }

  // A bill carrying a deal or a project passed or died.
  function onEnact(s, b) {
    const J = s.jur[b.jur], d = D(J), x = b.dev;
    if (x.kind === 'deal') { const f = d.firms.find((y) => y.id === x.id); if (f && f.pending) { if (x.cba && !f.cba) { f.cba = true; f.jobs *= 1.1; } announce(s, J, f); } }
    if (x.kind === 'mega') { const p = d.megas.find((y) => y.id === x.id); if (p && p.stage === 'authorizing') startBuild(s, J, p, playerJ(s) === J); }
  }
  function onKill(s, b) {
    const J = s.jur[b.jur], d = D(J), x = b.dev;
    const mine = playerJ(s) === J;
    if (x.kind === 'deal') {
      const f = d.firms.find((y) => y.id === x.id);
      if (!f || !f.pending) return;
      d.firms = d.firms.filter((y) => y !== f);
      GR.sim.news(s, `${f.base} walks away after the ${GR.BODIES[b.body].name} rejected its incentive deal.`, 'econ');
      if (mine) { s.pols.me.app = U.clamp(s.pols.me.app - 1, 1, 99); GR.sim.msgInbox(s, `The ${f.base} deal died`, `The ${GR.BODIES[b.body].name} did not pass the incentive package, and ${f.base} chose another site.`); }
    }
    if (x.kind === 'mega') {
      const p = d.megas.find((y) => y.id === x.id);
      if (!p || p.stage !== 'authorizing') return;
      p.stage = mine ? 'financing' : 'cancelled';
      p.fin = {};
      if (mine) GR.sim.msgInbox(s, `${p.name}: authorization failed`, `The ${GR.BODIES[b.body].name} did not authorize the financing. Rework the package or lobby members and try again.`);
    }
  }

  function cancel(s, id) {
    const J = playerJ(s); const p = J && D(J).megas.find((x) => x.id === +id);
    if (!p || p.stage === 'done') return { ok: false };
    const was = p.stage;
    p.stage = 'cancelled';
    if (was === 'building') { s.pols.me.app = U.clamp(s.pols.me.app - 2, 1, 99); PW().shift(s, 'labor', -6); addJobs(J, -(p.temp || 0), true); }
    return { ok: true, msg: `The ${p.name} is cancelled.` };
  }

  // ---------- AI executives ----------
  // Mayors, governors and presidents you don't control chase deals and projects too.
  function aiWeek(s) {
    ['city', 'state', 'nation'].forEach((k) => {
      const J = s.jur[k];
      const ex = J && execFor(s, J);
      if (!J || !J.F || !ex || ex.isPlayer) return;
      const d = D(J);
      const pitch = s.devPitch && s.devPitch.j === k && s.week - s.devPitch.w < 52;
      if (U.chance(pitch ? 1 / 22 : 1 / 40)) {
        const pool = refreshPool(s, J);
        const p = pool[0];
        if (p) {
          p.inc = { abate: U.randInt(0, 2), grant: U.randInt(0, 2), train: U.randInt(0, 1), site: U.randInt(0, 1), permit: U.randInt(0, 1), cba: ex.party === 'D' ? U.randInt(0, 1) : 0 };
          const mine = pitch && U.chance(0.6);
          if (mine && k === 'nation') p.host = s.home.state;
          const zi = pickZip(s, J, p.host, mine);
          if (mine) s.devPitch = null;
          landFirm(s, J, p, packageCost(J, p), ex.id, { zi });
        }
      }
      if (U.chance(1 / 160) && d.megas.filter((x) => !['done', 'cancelled'].includes(x.stage)).length < 2) {
        const o = U.pick(optionsFor(s, J));
        if (o) {
          const zi = k === 'nation' ? null : pickZip(s, J, null, false);
          const p = { id: ++d.seq, type: o.type, name: o.name, real: o.real, est: o.cost, cost: Math.round(o.cost * (0.95 + U.rand() * 0.4)), years: o.years, stage: 'financing', style: 1, fin: {}, startW: s.week, zi, seats: seatsAt(s, zi), where: placeOf(s, J, zi, null), ai: ex.id };
          d.megas.push(p);
          const T = MEGA[p.type];
          if (T.fed && k !== 'nation') p.fin.fed = Math.round(T.fed * 100 * 0.8);
          const rest = 100 - (p.fin.fed || 0);
          p.fin[T.fin.includes('go') ? 'go' : T.fin.includes('rev') ? 'rev' : T.fin.includes('p3') ? 'p3' : 'cash'] = rest;
          GR.sim.news(s, `${W().fullName(ex)} proposes the ${p.name} (${U.money(cost(p))}).`, 'econ');
          const pub = ['cash', 'go', 'rev'].reduce((t, x) => t + (p.fin[x] || 0), 0) * cost(p) / 100;
          if (bodyFor(s, J) && pub > 0) {
            p.stage = 'authorizing';
            const b = authBill(s, J, { kind: 'mega', id: p.id, share: pub / GR.fisc.totals(J).spend, seats: p.seats }, `${p.name} Authorization Act`, `Authorizes ${U.money(pub)} for the ${p.name}${p.where ? ' in ' + p.where : ''}`, ex.id);
            p.bill = b.id;
          } else startBuild(s, J, p, false);
        }
      }
    });
  }
  // Prospects for an AI executive (not shown to the player).
  function refreshPool(s, J) {
    const d = D(J);
    const keep = d.prospects, keepW = d.pW;
    d.pW = -1;
    const out = refresh(s, J, true);
    d.prospects = keep; d.pW = keepW;
    return out;
  }

  // ---------- Legislators ----------
  // Pitch your district to the executive so the next plant lands there.
  function pitch(s) {
    const J = legisJ(s);
    if (!J) return { ok: false };
    const me = s.pols.me;
    const ex = execFor(s, J);
    if (!ex) return { ok: false, msg: 'There is no executive to lobby.' };
    if (me.pp < 6 || s.hoursLeft < 3) return { ok: false, msg: 'Pitching your district takes 3 hours and 6 political points.' };
    me.pp -= 6; s.hoursLeft -= 3;
    s.devPitch = { j: J.k, w: s.week };
    GR.gov.addRel(s, ex.id, 2);
    return { ok: true, msg: `You walked ${W().fullName(ex)}'s economic development team through your district's sites. The next company they land is likely to come your way.` };
  }
  function pendingBills(s, J) { return (J.bills || []).filter((b) => b.dev && GR.legis.OPEN(b)); }
  function demandCBA(s, id) {
    const J = legisJ(s) || playerJ(s);
    const b = J && pendingBills(s, J).find((x) => x.id === id);
    if (!b || b.dev.kind !== 'deal' || b.dev.cba) return { ok: false };
    const me = s.pols.me;
    if (me.pp < 4) return { ok: false, msg: 'Costs 4 political points.' };
    me.pp -= 4;
    b.dev.cba = true; b._lean = null;
    PW().shift(s, 'labor', 5); PW().shift(s, 'business', -3);
    return { ok: true, msg: 'The deal now carries a community benefits agreement: local hiring and wage standards. Labor is pleased; the company grumbles.' };
  }
  function denounce(s, id) {
    const J = legisJ(s);
    const b = J && pendingBills(s, J).find((x) => x.id === id);
    if (!b) return { ok: false };
    const me = s.pols.me;
    if (s.hoursLeft < 2) return { ok: false, msg: 'Takes 2 hours.' };
    s.hoursLeft -= 2;
    PW().shift(s, 'taxpayers', 5); PW().shift(s, 'business', -4); PW().shift(s, 'press', 2);
    const ex = execFor(s, J); if (ex) GR.gov.addRel(s, ex.id, -5);
    b.dev.share *= 1.25;
    return { ok: true, msg: `Your floor speech against "${b.title}" made the news. Fiscal hawks are listening.` };
  }
  // Jobs that landed in your district.
  function districtJobs(s, J) { return U.sum((D(J).firms || []).filter((f) => f.open && !f.closed && inMyDistrict(s, f)), (f) => f.jobs); }

  // ---------- Weekly ----------
  function week(s) {
    aiWeek(s);
    ['city', 'state', 'nation'].forEach((k) => {
      const J = s.jur[k];
      if (!J || !J.dev) return;
      const d = J.dev;
      const mine = playerJ(s) === J;
      // Plants open.
      d.firms.forEach((f) => {
        if (f.open || f.pending || s.week < f.openW) return;
        f.open = true; f.openY = U.yearOf(s.week);
        addJobs(J, -(f.tempJobs || 0), true);
        addJobs(J, f.jobs);
        f.abateUntil = U.yearOf(s.week) + (f.abateYears || 0);
        J.F.mac.gdp *= 1 + f.out / Math.max(1, J.F.mac.gdp) * 0.5;
        if (mine) SC().post(s, { kicker: 'Ribbon cutting', title: `${f.base} opens in ${f.where}`, text: `The ${f.name} ${['tech', 'finance'].includes(f.sector) ? 'campus' : 'plant'} is open: ${U.num(Math.round(f.jobs * 1000))} jobs and ${U.money(f.capex)} invested.${f.abateYears ? ` Its tax abatement runs until ${f.abateUntil}.` : ''}`, choices: [['Cut the ribbon with the CEO', { app: 2, pw: { business: 3 }, hours: -3 }, 'Great photos.'], ['Send a deputy', {}, 'A quiet opening.']] });
      });
      // Megaprojects.
      d.megas.forEach((p) => {
        if (p.stage === 'study' && s.week >= p.until) {
          p.cost = Math.round(p.est * (0.9 + U.rand() * 0.55));
          p.stage = 'financing';
          if (mine) GR.sim.msgInbox(s, `Feasibility study: ${p.name}`, `Engineers estimate the ${p.name} will cost ${U.money(p.cost)} (first estimate ${U.money(p.est)}) and take ${p.years} years. Assemble financing in Office → Development.`);
        }
        if (p.stage === 'building') {
          if (mine && s.week % 26 === 0 && U.chance(0.35)) buildEvent(s, J, p);
          if (s.week >= p.until) finish(s, J, p, mine);
        }
      });
      // Yearly: closures, missed job targets, abatements ending.
      if (U.isYearStart(s.week)) yearly(s, J, mine);
    });
  }
  function buildEvent(s, J, p) {
    const T = MEGA[p.type];
    const r = U.rand();
    if (r < 0.4) {
      const extra = Math.round(cost(p) * (0.08 + U.rand() * 0.2));
      SC().post(s, { kicker: p.name, title: 'Cost overrun', text: `Contractors say the ${p.name} will cost ${U.money(extra)} more than budgeted: materials, labor and design changes.`, choices: [
        { label: 'Pay it', fx: {}, res: 'Construction continues.', run: 'megaPay', args: { j: J.k, id: p.id, amt: extra } },
        { label: 'Value-engineer the design', fx: { app: -1 }, res: 'Features are cut.', run: 'megaPay', args: { j: J.k, id: p.id, amt: extra * 0.4, cut: true } },
        { label: 'Delay a year and rebid', fx: {}, res: 'Work slows.', run: 'megaDelay', args: { j: J.k, id: p.id, w: 52 } },
      ] });
    } else if (r < 0.65 && T.prot) {
      SC().post(s, { kicker: p.name, title: 'A lawsuit stops work', text: `${T.envHit ? 'Environmental groups' : 'Neighbors'} won an injunction over the ${p.name}'s environmental review.`, choices: [
        { label: 'Settle with mitigation', fx: { cost: 0.0005, pw: { environment: 4 } }, res: 'Work resumes in three months.', run: 'megaDelay', args: { j: J.k, id: p.id, w: 13 } },
        { label: 'Fight it in court', fx: { pw: { environment: -4 } }, res: 'A long fight.', run: 'megaDelay', args: { j: J.k, id: p.id, w: 40 } },
      ] });
    } else if (r < 0.85) {
      SC().post(s, { kicker: p.name, title: 'A contracting scandal', text: `Auditors found a contractor on the ${p.name} billed for work never done, and a donor of yours is involved.`, choices: [
        { label: 'Fire the contractor and refer it to prosecutors', fx: { integ: 3, pw: { press: 4, donors: -4 } }, res: 'Work pauses for a new contractor.', run: 'megaDelay', args: { j: J.k, id: p.id, w: 13 } },
        { label: 'Handle it quietly', fx: { scan: 5, integ: -4 }, res: 'The story might not stay quiet.' },
      ] });
    } else {
      SC().post(s, { kicker: p.name, title: 'Ahead of schedule', text: `Crews on the ${p.name} are ahead of schedule.`, choices: [['Hold a site tour for the press', { app: 1, hours: -2 }, 'Good coverage.'], ['Keep working', {}, '']] });
      p.until -= 13;
    }
  }
  function finish(s, J, p, mine) {
    const T = MEGA[p.type];
    p.stage = 'done';
    p.doneY = U.yearOf(s.week);
    addJobs(J, -(p.temp || 0), true);
    addJobs(J, (T.jobs || 0) * 0.4 * (J.k === 'city' ? 0.6 : 1));
    const appeal = T.landmark ? STYLES[p.style || 1].appeal : 1;
    const fx = JSON.parse(JSON.stringify(T.fx || {}));
    if (fx.app) fx.app *= appeal;
    SC().apply(s, fx, { J, mult: 1, noAsk: !mine });
    Object.entries(T.K || {}).forEach(([k, v]) => { J.F.mac.K[k] = U.clamp(J.F.mac.K[k] + v * Math.min(1.5, cost(p) / Math.max(1, GR.fisc.totals(J).spend) * 6 + 0.3), 30, 300); });
    GR.sim.news(s, `The ${p.name} opens.`, 'econ');
    if (mine) SC().post(s, { kicker: 'Grand opening', title: `The ${p.name} opens`, text: `After ${Math.round((s.week - p.buildW) / 52 * 10) / 10} years of construction the ${p.name} is open to the public.`, choices: [['Lead the ribbon cutting', { app: 2 * appeal, hours: -3, rec: 2 }, 'Crowds turn out.'], ['A quiet opening', {}, '']] });
  }
  function yearly(s, J, mine) {
    const d = J.dev;
    const y = U.yearOf(s.week);
    d.firms.filter((f) => f.open && !f.closed).forEach((f) => {
      // Missed job targets.
      if (mine && !f.checked && y - f.openY >= 2 && U.chance(0.15)) {
        f.checked = true;
        const short = U.round(f.jobs * (0.2 + U.rand() * 0.3), 2);
        SC().post(s, { kicker: 'Economic development', title: `${f.base} missed its job target`, text: `${f.base} promised ${U.num(Math.round(f.target * 1000))} jobs but has ${U.num(Math.round((f.jobs - short) * 1000))}. Your incentive deal allows a clawback.`, choices: [
          { label: 'Claw back the incentives', fx: { cost: -f.cost * 0.3 / Math.max(1, GR.fisc.totals(J).spend), pw: { business: -4, press: 3 } }, res: 'The company pays up and grumbles.', run: 'firmCut', args: { j: J.k, id: f.id, by: short } },
          { label: 'Give them more time', fx: { pw: { business: 3, press: -2 } }, res: 'They promise to hire next year.', run: 'firmCut', args: { j: J.k, id: f.id, by: short * 0.5 } },
        ] });
      }
      // Closures, more likely when the place gets worse.
      const worse = U.sum(Object.values(J.F.crises), (c) => Math.max(0, c.s - c.s0)) / 100;
      if (!f.local && U.chance(0.015 + worse * 0.02) && y - f.openY >= 3) {
        if (mine) SC().post(s, { kicker: 'Economic development', title: `${f.base} plans to close its ${f.where} site`, text: `${f.base} says costs are too high and plans to move ${U.num(Math.round(f.jobs * 1000))} jobs elsewhere.`, choices: [
          { label: 'Offer a retention package', fx: { cost: f.capex * 0.08 / Math.max(1, GR.fisc.totals(J).spend), pw: { business: 2 } }, res: 'They agree to stay five more years.' },
          { label: 'Let them go', fx: { app: -2, pw: { labor: -4 } }, res: 'Layoff notices go out.', run: 'firmClose', args: { j: J.k, id: f.id } },
        ] });
        else { f.closed = true; addJobs(J, -f.jobs); }
      }
    });
  }
  Object.assign(GR.scenes.RUN, {
    megaPay: (s, a) => { const J = s.jur[a.j]; const p = J.dev.megas.find((x) => x.id === a.id); if (!p) return; GR.scenes.pay(J, a.amt); p.spent += a.amt; if (a.cut && MEGA[p.type].fx.app) p.style = Math.max(0, (p.style || 1) - 1); },
    megaDelay: (s, a) => { const J = s.jur[a.j]; const p = J.dev.megas.find((x) => x.id === a.id); if (p) p.until += a.w; },
    firmCut: (s, a) => { const J = s.jur[a.j]; const f = J.dev.firms.find((x) => x.id === a.id); if (f) { f.jobs -= a.by; addJobs(J, -a.by); } },
    firmClose: (s, a) => { const J = s.jur[a.j]; const f = J.dev.firms.find((x) => x.id === a.id); if (f && !f.closed) { f.closed = true; addJobs(J, -f.jobs); GR.sim.news(s, `${f.base} closes its ${f.where} site.`, 'econ'); } },
  });

  // Output whose corporate (or property) taxes are abated this year.
  function abated(J) {
    const d = J.dev;
    if (!d) return 0;
    return U.sum(d.firms.filter((f) => f.open && !f.closed && f.abateYears && f.abateUntil > (d.year || 0)), (f) => f.out);
  }
  function yearTick(s) { ['city', 'state', 'nation'].forEach((k) => { const J = s.jur[k]; if (J && J.dev) J.dev.year = U.yearOf(s.week); }); }

  return { voteTerms, onEnact, onKill, legisJ, pitch, pendingBills, demandCBA, denounce, districtJobs, inMyDistrict, optionsFor, COMPANIES, PRIORITIES, incentives, D, refresh, oddsParts, odds, packageCost, setInc, visit, offer, backLocal, MEGA, STYLES, options, startStudy, setStyle, rename, cost, sources, setFin, finTotal, close, cancel, week, addJobs, jobsPct, abated, yearTick, playerJ, laborK };
})();
