// The weekly turn: orchestrates life, business, money, the calendar and events.
var G = globalThis.G || (globalThis.G = {});

G.sim = (function () {
  const U = G.util;

  function canAdvance(s) {
    if (s.ended) return { ok: false, why: 'This life story has ended.' };
    if (s.event) return { ok: false, why: 'Resolve the decision in front of you first.' };
    const H = G.life.hours(s);
    if (H.leisure < 0) return { ok: false, why: `Your week is overbooked by ${Math.ceil(-H.leisure)} hours. Adjust your plan.` };
    return { ok: true };
  }

  function advance(s) {
    const chk = canAdvance(s);
    if (!chk.ok) return null;
    const p = s.p;
    const r = { week: s.week, lines: [], alerts: [], prod: 1, cash0: p.cash, bcash0: s.biz ? s.biz.cash : 0 };
    const hyper = p.traits.includes('hyperfocus');
    s.flags.hyperfocus = hyper ? (Math.random() < 0.15 ? 1.7 : Math.random() < 0.18 ? 0.6 : 1) : null;
    if (s.flags.hyperfocus === 1.7) r.alerts.push('Hyperfocus week: you got twice as much done.');

    G.hold.ensure(s); G.give.ensure(s);
    G.life.week(s, r);
    if (s.biz) G.biz.week(s, r);
    G.hold.week(s, r);
    G.give.week(s, r);
    if (G.hold.unlocked(s)) G.hold.refreshMarket(s);
    G.finance.tickPending(s);
    G.biz.tickListing(s);

    s.week += 1;
    calendar(s, r);

    // Events for the coming week.
    const hz = G.events.rollHazard(s);
    if (hz) s.eventQueue.push(hz);
    const ev = G.events.rollRandom(s);
    if (ev) s.eventQueue.push(ev);
    G.events.next(s);

    G.state.recordHistory(s);
    r.cash1 = p.cash;
    r.bcash1 = s.biz ? s.biz.cash : 0;
    r.nw = G.state.netWorth(s);
    s.lastReport = r;

    if (G.state.age(s) >= 85 && !s.ended) {
      s.ended = true;
      G.journal.add(s, 'life', 'At 85, you finally put down the work for good.');
    }
    return r;
  }

  function calendar(s, r) {
    const p = s.p, b = s.biz, w = s.week;
    if (b && b.space) {
      b.space.left -= 1;
      if (b.space.left === 0) { s.flags.leaseBump = U.randInt(4, 14) / 100; s.eventQueue.push({ id: 'renewal' }); }
    }
    if (U.isMonthStart(w)) {
      G.econ.month(s);
      G.finance.creditMonth(s);
      if (b) b.equipValue *= 0.985;
    }
    if (U.isYearStart(w)) newYear(s, r);
    // Quarterly estimated taxes (Apr 15, Jun 15, Sep 15 for this year; Jan 15 for last year).
    const dueQ = [[3, 15], [5, 15], [8, 15], [0, 15]].find(([m, d]) => U.weekContains(w, m, d));
    if (dueQ && p.estimates) {
      const lastYear = dueQ[0] === 0 && p.prevYtd;
      const y = lastYear ? p.prevYtd : p.ytd;
      const ret = G.finance.computeReturn(s, y);
      const pay = Math.max(0, Math.round(ret.total - ret.paid));
      if (pay > 0) {
        p.cash -= pay;
        y.est += pay;
        r.alerts.push(`Paid ${U.money(pay)} in quarterly estimated taxes.`);
      }
    }
    if (U.weekContains(w, 3, 15) && p.prevYtd && !p.prevYtd.filed) {
      p.prevYtd.filed = true;
      const ret = G.finance.computeReturn(s, p.prevYtd);
      if (ret.due > 1000 && p.prevYtd.est < ret.total * 0.5) {
        const pen = Math.round(ret.due * 0.05);
        ret.penalty += pen; ret.total += pen; ret.due += pen;
      }
      const corp = p.prevYtd.corpProfit > 0 ? Math.round(p.prevYtd.corpProfit * 0.26) : 0;
      p.lastReturn = Object.assign({ year: p.prevYtd.year }, ret);
      s.eventQueue.push({ id: 'taxday', data: { r: ret, year: p.prevYtd.year, corp } });
    }
    // VC board check-ins.
    if (b && b.vc && w - b.vc.week >= 52) {
      const t = G.state.tpl(s, b);
      const grew = t.engine === 'rnd' ? b.rnd.ms > b.vc.ms : G.biz.mrr(s, b) >= b.vc.mrr * 2.2;
      b.vc.week = w;
      b.vc.mrr = Math.max(1000, G.biz.mrr(s, b));
      b.vc.ms = b.rnd.ms;
      if (!grew) s.eventQueue.push({ id: 'vcboard' });
      else G.journal.add(s, 'biz', 'Board meeting goes well. Growth is on plan, and your investors are already talking about the next round.');
    }
  }

  function newYear(s, r) {
    const p = s.p, b = s.biz;
    const year = U.yearOf(s.week) - 1;
    p.prevYtd = Object.assign({}, p.ytd, { year, entity: b ? b.entity : 'sole', corpProfit: b && b.entity === 'ccorp' ? b.ytdProfit : 0, filed: false });
    p.ytd = { wages: 0, withheld: 0, gig: 0, biz: 0, est: 0, other: 0, penalty: 0, corpSalary: 0, capgain: 0, donations: 0 };
    if (b) b.ytdProfit = 0;
    const infl = s.econ.infl / 100;
    s.loc.rent = Math.round(s.loc.rent * (1 + infl * 1.1));
    if (b && b.phase !== 'closed') {
      const st = G.loc.state(s.loc.state);
      let fees = 0;
      if (b.entity === 'llc' || b.entity === 'scorp') fees += st.ann;
      if (b.entity === 'scorp') fees += 1800;
      if (b.entity === 'ccorp') fees += 2400;
      if (fees) { b.cash -= fees; r.alerts.push(`Annual entity fees and filings: ${U.money(fees)}.`); }
    }
    G.journal.add(s, 'life', `${year + 1} begins. Net worth: ${U.money(G.state.netWorth(s))}. ${b && b.phase === 'open' ? `${b.name} did ${U.money(U.sum(b.hist.slice(-52), (h) => h.rev))} in revenue last year.` : ''}`);
  }

  // ---------- Legacy ----------
  function legacy(s) {
    const p = s.p, st = s.stats;
    const nw = G.state.netWorth(s);
    const years = s.week / 52;
    const all = s.pastBiz.slice();
    if (s.biz) all.push({ name: s.biz.name, rev: Math.round(s.biz.life.rev), how: 'running' });
    const scores = {
      wealth: Math.max(0, st.peakNW) / 10000,
      freedom: p.weeksSelfEmployed / 5 + Math.max(0, nw) / 50000,
      impact: st.jobsCreated * 12 + st.customers / 500 + (s.phil ? s.phil.given / 5000 + s.phil.standing : 0),
      legacy: (s.biz ? G.biz.enterpriseValue(s, s.biz) / 20000 : 0) + (s.holdings ? G.hold.totalValue(s) / 40000 : 0) + (s.phil && s.phil.foundation ? s.phil.foundation.endowment / 20000 : 0) + U.sum(s.pastBiz, (x) => (x.ended - (x.opened || x.ended)) / 26 + (x.price || 0) / 20000),
      proveit: st.revenue / 25000,
      mastery: st.bestRating * 20 + U.avg(Object.values(p.skills)) / 2,
    };
    const why = scores[p.why] || 0;
    const given = s.phil ? s.phil.given : 0;
    const score = Math.round(why * 2 + Math.max(0, nw) / 20000 + st.jobsCreated * 4 + p.happiness / 2 + given / 10000);
    const empire = s.holdings && s.holdings.length >= 3;
    const title = given >= 1e6 || (given >= 100000 && given >= st.peakNW * 0.25) ? 'Philanthropist' : empire && nw > 5e6 ? 'Conglomerate builder' : nw > 10e6 ? 'Tycoon' : nw > 1e6 ? 'Self-made millionaire' : st.jobsCreated > 20 ? 'Community pillar' : all.length > 2 ? 'Serial entrepreneur' : all.length ? 'Small business owner' : 'Dreamer';
    return { score, title, nw, years, scores, all, given };
  }

  return { canAdvance, advance, legacy };
})();
