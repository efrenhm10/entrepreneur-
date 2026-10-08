// Acquisitions: buy existing companies in any industry and run a portfolio.
// Each holding is simulated at the level an owner sees it: revenue, margin,
// health, the general manager you put in charge, and your oversight time.
var G = globalThis.G || (globalThis.G = {});

G.hold = (function () {
  const U = G.util;
  const M = (n) => U.money(n);

  // Typical seller's-discretionary-earnings margin by industry.
  const MARGIN = { food: 0.1, retail: 0.08, tech: 0.22, media: 0.16, ag: 0.12, science: 0.15, services: 0.18, trades: 0.14, making: 0.12, transport: 0.09, hospitality: 0.15, health: 0.12, realestate: 0.3 };
  const SIZES = [
    { id: 'main', label: 'Main Street', rev: [300e3, 1.6e6], mult: [2.2, 3.2], fee: 0.1 },
    { id: 'lower', label: 'Lower middle market', rev: [2e6, 12e6], mult: [3.5, 5.5], fee: 0.06 },
    { id: 'middle', label: 'Middle market', rev: [15e6, 90e6], mult: [6, 9], fee: 0.03 },
  ];
  const GMS = {
    none: { label: 'You run it', cost: 0, hours: 6, health: 0 },
    solid: { label: 'Solid GM', cost: 115000, hours: 2, health: 14 },
    star: { label: 'Star operator', cost: 230000, hours: 1, health: 26 },
  };
  const NOTES = {
    good: ['Owner retiring after 22 years', 'Long-tenured staff', 'Recurring contracts with local institutions', 'No debt, clean books', 'Prime location with a long lease', 'Strong online reviews', 'Growing 8% a year'],
    bad: ['Owner is the face of the business', 'Two customers are 40% of revenue', 'Equipment is near end of life', 'Lease expires in 14 months', 'Books are "mostly" in QuickBooks', 'Revenue dipped last year', 'Key employee may leave after the sale'],
  };

  function ensure(s) {
    if (!s.holdings) s.holdings = [];
    if (!s.hmarket) s.hmarket = [];
    if (s.flags.hmarketWeek == null) s.flags.hmarketWeek = -99;
  }

  function unlocked(s) {
    const nw = G.state.netWorth(s);
    const big = s.biz && s.biz.phase === 'open' && G.biz.enterpriseValue(s, s.biz) >= 500000;
    return nw >= 250000 || big || s.pastBiz.some((x) => x.how === 'sold') || (s.holdings && s.holdings.length > 0);
  }
  const unlockText = 'Unlocks at $250k net worth, a business worth $500k, or after you sell a company.';

  function sizesFor(s) {
    const nw = G.state.netWorth(s);
    return SIZES.filter((z, i) => i === 0 || (i === 1 && nw >= 1e6) || (i === 2 && nw >= 8e6));
  }

  function nameFor(t, L) {
    const place = U.pick([L.city, G.loc.state(L.state).name, 'Tri-County', 'Riverside', 'Heritage', 'Summit', 'Pioneer', 'Keystone', 'Eagle', 'Sunrise']);
    const kind = t.name.replace(/\(.*\)/, '').split(/[,/&]/)[0].trim();
    return `${place} ${kind.split(' ').slice(-2).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}`;
  }

  function makeListing(s) {
    const sizes = sizesFor(s);
    const z = U.weighted(sizes, (x, i) => [6, 3, 1][SIZES.indexOf(x)]);
    const t = U.pick(G.BIZ_LIST.filter((x) => x.engine !== 'rnd'));
    const rev = Math.round(U.lerp(z.rev[0], z.rev[1], Math.pow(Math.random(), 1.6)) / 1000) * 1000;
    const margin = U.clamp(MARGIN[t.cat] * (0.7 + Math.random() * 0.6), 0.04, 0.4);
    const sde = Math.round(rev * margin / 1000) * 1000;
    const health = Math.round(U.clamp(62 + U.gauss() * 14, 25, 92));
    const truth = U.clamp(0.95 + U.gauss() * 0.12 - (health < 45 ? 0.1 : 0), 0.6, 1.15);
    const mult = U.lerp(z.mult[0], z.mult[1], Math.random()) * (0.85 + health / 400);
    const notes = [U.pick(NOTES.good), health < 55 ? U.pick(NOTES.bad) : Math.random() < 0.5 ? U.pick(NOTES.bad) : U.pick(NOTES.good)].filter((v, i, a) => a.indexOf(v) === i);
    const sameState = Math.random() < 0.75;
    const st = sameState ? G.loc.state(s.loc.state) : U.pick(G.STATES);
    const city = sameState ? (Math.random() < 0.6 ? s.loc.city : U.pick(st.cities)[0]) : U.pick(st.cities)[0];
    return {
      id: U.uid('deal'), name: nameFor(t, { city, state: st.ab }), tid: t.id, cat: t.cat, size: z.id, city, state: st.ab,
      rev, sde, margin, price: Math.round(sde * mult / 5000) * 5000, health, truth, growth: U.clamp(0.03 + U.gauss() * 0.05, -0.08, 0.15),
      notes, dd: null, listed: s.week, years: U.randInt(4, 40),
    };
  }

  function refreshMarket(s, force) {
    ensure(s);
    if (!force && s.week - s.flags.hmarketWeek < 8) return;
    s.flags.hmarketWeek = s.week;
    s.hmarket = s.hmarket.filter((d) => d.dd && d.dd.state === 'running');
    while (s.hmarket.length < 6) s.hmarket.push(makeListing(s));
  }

  // ---------- Due diligence ----------
  function diligence(s, id) {
    const d = s.hmarket.find((x) => x.id === id);
    if (!d || d.dd) return 'Already done.';
    const cost = Math.round(Math.max(4000, d.price * 0.012) / 500) * 500;
    if (s.p.cash < cost) return `Due diligence costs ${M(cost)} (accountants and lawyers).`;
    s.p.cash -= cost;
    d.dd = { state: 'running', left: d.size === 'main' ? 3 : 6, cost };
    return `Quality-of-earnings review started: ${M(cost)}, about ${d.dd.left} weeks.`;
  }

  // ---------- Buying ----------
  function financing(s, d) {
    const p = s.p;
    const pr = s.econ.rate + 3;
    const out = [{ id: 'cash', label: 'All cash', down: d.price, note: 'No debt. All the risk and all the upside.' }];
    if (d.price <= 5e6 && p.credit >= 680) out.push({ id: 'sba', label: 'SBA 7(a) acquisition loan', down: d.price * 0.1, loan: d.price * 0.9, rate: (pr + 2.75) / 100, weeks: 520, note: `10% down, ${(pr + 2.75).toFixed(2)}% for 10 years, personally guaranteed.` });
    out.push({ id: 'seller', label: 'Bank loan + seller note', down: d.price * 0.25, loan: d.price * 0.55, note2: d.price * 0.2, rate: (pr + 3.5) / 100, weeks: 364, note: `25% down, 55% bank debt, and the seller carries 20% at 6% over 5 years.` });
    return out;
  }

  function buy(s, id, method) {
    ensure(s);
    const d = s.hmarket.find((x) => x.id === id);
    if (!d) return 'That deal is gone.';
    const f = financing(s, d).find((x) => x.id === method);
    if (!f) return 'That financing is not available.';
    const closing = d.price * 0.02;
    const need = f.down + closing;
    if (s.p.cash < need) return `You need ${M(need)} in your personal account (down payment plus about 2% closing costs).`;
    if (method !== 'cash' && Math.random() > U.clamp(0.45 + s.p.skills.finance / 250 + (s.p.credit - 680) / 400 + (d.health - 50) / 200, 0.15, 0.95)) {
      s.p.credit -= 4;
      return 'The bank declined the loan. The business or your finances did not pass underwriting.';
    }
    s.p.cash -= need;
    if (f.loan) s.p.debts.push(G.finance.makeLoan({ name: `Acquisition loan: ${d.name}`, kind: 'acq', acct: 'p', amount: f.loan, rate: f.rate, weeks: f.weeks, guarantee: true }));
    if (f.note2) s.p.debts.push(G.finance.makeLoan({ name: `Seller note: ${d.name}`, kind: 'acq', acct: 'p', amount: f.note2, rate: 0.06, weeks: 260 }));
    s.hmarket = s.hmarket.filter((x) => x !== d);
    const h = Object.assign({}, d, { bought: s.week, cost: d.price, gm: 'none', hist: [], capex: 0, weeks: 0, lastRev: 0, lastProfit: 0, surprise: !d.dd });
    s.holdings.push(h);
    s.stats.jobsCreated += Math.round(d.rev / 120000 * 0.15);
    const kind = G.BIZ[d.tid].name.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
    G.journal.add(s, 'biz', `You buy ${d.name}, ${/^[aeiouAEIOU]/.test(kind) ? 'an' : 'a'} ${kind} in ${d.city}, ${d.state}, for ${M(d.price)}${method === 'cash' ? ' in cash' : ` with ${M(f.down)} down`}. ${G.BIZ[d.tid].cat !== (G.state.tpl(s) || {}).cat ? 'A long way from what you know.' : 'Right in your wheelhouse.'}`);
    if (h.truth < 0.85 && !d.dd) s.flags.surpriseHold = h.id;
    return null;
  }

  // ---------- Running the portfolio ----------
  function oversightHours(s) {
    ensure(s);
    return U.sum(s.holdings, (h) => GMS[h.gm].hours);
  }

  function value(s, h) {
    const run = h.hist.length ? U.avg(h.hist.slice(-13), (x) => x.profit) * 52 : h.sde * h.truth;
    const z = SIZES.find((x) => x.id === h.size);
    const mult = U.lerp(z.mult[0], z.mult[1], 0.5) * (0.75 + h.health / 200);
    const earned = Math.max(h.rev * 0.08, run * mult);
    // Appraisals lean on the purchase price until there is a year of results.
    return U.lerp(h.cost || earned, earned, Math.min(1, (h.weeks || 0) / 52));
  }

  function totalValue(s) {
    ensure(s);
    return U.sum(s.holdings, (h) => value(s, h));
  }

  function week(s, r) {
    ensure(s);
    // Due diligence results.
    for (const d of s.hmarket) {
      if (!d.dd || d.dd.state !== 'running') continue;
      d.dd.left -= 1;
      if (d.dd.left <= 0) {
        d.dd.state = 'done';
        d.dd.trueSde = Math.round(d.sde * d.truth / 1000) * 1000;
        d.dd.verdict = d.truth < 0.85 ? `Earnings are overstated. Real SDE is closer to ${M(d.dd.trueSde)}.` : d.truth > 1.03 ? `The books are conservative. Real SDE is about ${M(d.dd.trueSde)}.` : 'The numbers hold up.';
        r.alerts.push(`Due diligence on ${d.name}: ${d.dd.verdict}`);
      }
    }
    if (!s.holdings.length) return;
    const m = U.monthOf(s.week);
    const mainCat = s.biz && s.biz.phase === 'open' ? G.state.tpl(s).cat : null;
    const capHours = s.p.schedule.biz * (r.prod || 1);
    const needed = oversightHours(s);
    const neglect = needed > 0 ? U.clamp(1 - capHours / needed, 0, 1) : 0;
    let total = 0;
    for (const h of s.holdings) {
      const t = G.BIZ[h.tid];
      const gm = GMS[h.gm];
      h.weeks += 1;
      const target = 52 + gm.health + Math.min(14, h.capex / Math.max(1, h.rev) * 160) - neglect * 30 + (s.p.skills.management - 40) * 0.15;
      h.health = U.clamp(h.health + (target - h.health) * 0.04 + U.gauss() * 1.2, 5, 98);
      h.capex = Math.max(0, h.capex * 0.985);
      h.growth = U.clamp(h.growth + (h.health - 60) * 0.00004 + U.gauss() * 0.0015, -0.15, 0.2);
      h.rev = h.rev * Math.pow(1 + h.growth, 1 / 52);
      const season = t.season[m];
      const rev = h.rev / 52 * season * s.econ.mult * (0.82 + h.health / 450) * (1 + U.gauss() * 0.04);
      const synergy = mainCat === h.cat ? 0.02 : 0;
      const margin = h.margin * h.truth * (0.55 + h.health / 145) + synergy;
      const profit = rev * margin - gm.cost / 52;
      h.lastRev = rev; h.lastProfit = profit;
      h.hist.push({ w: s.week, rev: Math.round(rev), profit: Math.round(profit) });
      if (h.hist.length > 156) h.hist.shift();
      total += profit;
      // Things happen at companies you own.
      if (Math.random() < 0.012) {
        const ev = U.pick(['gmquit', 'contract', 'lawsuit', 'record', 'equipment']);
        if (ev === 'gmquit' && h.gm !== 'none') { h.gm = 'none'; G.journal.add(s, 'biz', `The GM at ${h.name} quits for a competitor. Until you hire again, it is on you.`); r.alerts.push(`${h.name}: GM quit.`); }
        else if (ev === 'contract') { h.rev *= 1.08; G.journal.add(s, 'biz', `${h.name} lands a big new contract. Revenue run-rate up 8%.`); }
        else if (ev === 'lawsuit') { const c = Math.round(h.rev * 0.02); s.p.cash -= c; G.journal.add(s, 'biz', `${h.name} settles a lawsuit for ${M(c)}.`); }
        else if (ev === 'record') { h.health = Math.min(98, h.health + 6); G.journal.add(s, 'biz', `Record month at ${h.name}. The team is proud.`); }
        else { const c = Math.round(h.rev * 0.015); s.p.cash -= c; h.health -= 4; G.journal.add(s, 'biz', `Critical equipment fails at ${h.name}: ${M(c)} to replace.`); }
      }
    }
    // Profits flow to you as pass-through income from your holding company.
    s.p.cash += total;
    s.p.ytd.biz += total;
    r.holdProfit = total;
    if (s.flags.surpriseHold) {
      const h = s.holdings.find((x) => x.id === s.flags.surpriseHold);
      s.flags.surpriseHold = null;
      if (h) { G.journal.add(s, 'biz', `Three weeks in, you learn why ${h.name} was priced to sell: the earnings were inflated by about ${Math.round((1 - h.truth) * 100)}%. Due diligence would have caught it.`); r.alerts.push(`${h.name} is earning less than advertised.`); }
    }
  }

  function setGm(s, id, level) {
    const h = s.holdings.find((x) => x.id === id);
    if (!h || !GMS[level]) return;
    const fee = level === 'none' ? 0 : GMS[level].cost * 0.2;
    if (s.p.cash < fee) return `Recruiting costs about ${M(fee)} (20% of first-year pay).`;
    s.p.cash -= fee;
    h.gm = level;
    G.journal.add(s, 'biz', level === 'none' ? `You take over day-to-day management of ${h.name}.` : `You hire ${G.randName()} as ${level === 'star' ? 'a star operator' : 'general manager'} at ${h.name}.`);
    return null;
  }

  function invest(s, id) {
    const h = s.holdings.find((x) => x.id === id);
    if (!h) return;
    const amt = Math.round(h.rev * 0.05 / 1000) * 1000;
    if (s.p.cash < amt) return `A 5% reinvestment is ${M(amt)}.`;
    s.p.cash -= amt;
    h.capex += amt;
    h.growth = Math.min(0.2, h.growth + 0.015);
    G.journal.add(s, 'biz', `You reinvest ${M(amt)} in ${h.name}: equipment, systems and people.`);
    return null;
  }

  function sell(s, id) {
    const h = s.holdings.find((x) => x.id === id);
    if (!h) return;
    const z = SIZES.find((x) => x.id === h.size);
    const price = value(s, h) * (0.85 + Math.random() * 0.3);
    const fee = price * z.fee;
    s.p.cash += price - fee;
    s.p.ytd.capgain = (s.p.ytd.capgain || 0) + Math.max(0, price - fee - h.cost);
    s.holdings = s.holdings.filter((x) => x !== h);
    G.journal.add(s, 'biz', `You sell ${h.name} for ${M(price)} after ${(h.weeks / 52).toFixed(1)} years (you paid ${M(h.cost)}). ${price - fee > h.cost ? 'A good trade.' : 'Not every deal works.'}`);
    return `Sold for ${M(price)} (${M(fee)} in fees).`;
  }

  return { ensure, unlocked, unlockText, refreshMarket, diligence, financing, buy, week, setGm, invest, sell, value, totalValue, oversightHours, GMS, SIZES };
})();
