// The presidency: nominating contests state by state, delegates, the convention,
// running mates, the Electoral College, and inauguration.
var GR = globalThis.GR || (globalThis.GR = {});

GR.pres = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const E = () => GR.elect;

  const stateProfile = (ab) => GR.geo.mkProfile({ ab }, GR.STATE[ab].pop * 1e6, GR.STATE[ab].lean, 2.2, 0, 0, 'st' + ab);
  const totalDelegates = () => U.sum(GR.STATES, (st) => E().delegates(st.ab));

  function makeRace(s, year) {
    const race = {
      id: 'pres' + year, seat: 'pres', off: 'president', year, inc: s.seats.pres.holder, cands: [], cs: {}, prim: { D: { cands: [] }, R: { cands: [] } },
      nom: {}, phase: 'primary', polls: [], env: s.nat.env || 0, del: {}, contest: 0, results: [], scale: E().scale(s, s.seats.pres), pr: W().nationProfile(),
    };
    return race;
  }

  // Field of candidates for each party.
  function openPres(s, year) {
    if (s.presRace && s.presRace.year === year) return s.presRace;
    const race = makeRace(s, year);
    s.presRace = race;
    ['D', 'R'].forEach((party) => {
      const inc = s.pols[s.seats.pres.holder];
      if (inc && inc.party === party && !E().termLimited(s, inc, 'president') && !inc.isPlayer && W().ageOf(s, inc) < 80) {
        addCand(s, race, inc);
        if (U.chance(0.3)) addCand(s, race, W().extPol(s, party, null, U.pick(['Governor', 'U.S. Senator'])));
        return;
      }
      if (inc && inc.isPlayer && inc.party === party) return;
      const n = U.randInt(3, 6);
      // Home-state heavyweights with ambition may run too.
      Object.values(s.pols).filter((p) => p.party === party && !p.isPlayer && p.seat && ['governor', 'ussenate'].includes(s.seats[p.seat].off) && p.amb > 0.75 && W().ageOf(s, p) >= 35 && W().ageOf(s, p) < 75).slice(0, 1).forEach((p) => addCand(s, race, p));
      while (race.prim[party].cands.length < n) addCand(s, race, W().extPol(s, party, null, U.pick(['Governor', 'U.S. Senator', 'U.S. Senator', 'Former Governor', 'U.S. Representative', 'Businessperson'])));
    });
    return race;
  }

  function addCand(s, race, p, detailed) {
    race.cands.push(p.id);
    race.prim[p.party].cands.push(p.id);
    const c = E().candStats(s, race, p, !!detailed);
    if (!p.isPlayer) { c.rec = U.clamp(p.rec + (p.title && /Governor|Senator/.test(p.title) ? 8 : 0), 5, 85); c.funds = race.scale * 0.1 * (p.q / 50); }
    race.cs[p.id] = c;
    race.del[p.id] = 0;
    p.running = race.id;
  }

  function declare(s, year) {
    const me = s.pols.me;
    const race = openPres(s, year);
    if (race.cands.includes('me')) return { ok: false, why: 'Already running.' };
    addCand(s, race, me, true);
    race.cs.me.funds = me.warChest;
    me.warChest = 0;
    race.detail = true;
    race.cands.forEach((id) => { if (id !== 'me') { const c = race.cs[id]; const f = E().candStats(s, race, s.pols[id], true); c.enth = f.enth; c.base = f.base; } });
    s.campaign = { pres: true, presRace: race, race: race.id, year, seat: 'pres', staff: {}, ads: { tv: 0, radio: 0, digital: 0, mail: 0 }, tone: 'positive', target: null, themes: [], promoted: {}, opinion: {}, opps: [], ledger: [], msgs: [], prepped: 0, polls: [], started: s.week, overhead: 0 };
    GR.sim.log(s, `Announced a campaign for President of the United States (${year}).`);
    GR.sim.news(s, `${me.fn} ${me.ln} (${me.party}) announces a run for President.`, 'campaign');
    GR.camp.makeOpps(s);
    return { ok: true };
  }

  function withdraw(s) {
    const r = s.presRace;
    if (!r) return;
    r.prim[s.pols.me.party].cands = r.prim[s.pols.me.party].cands.filter((x) => x !== 'me');
    r.cands = r.cands.filter((x) => x !== 'me');
    s.pols.me.warChest += Math.max(0, Math.round(r.cs.me.funds));
    s.campaign = null;
    s.pols.me.running = null;
    GR.sim.log(s, 'Ended the presidential campaign.');
  }

  // One nominating contest night.
  function contest(s, race, i) {
    const cal = E().PRES_CAL[i];
    const night = { i, name: cal.name, st: {} };
    ['D', 'R'].forEach((party) => {
      const cands = race.prim[party].cands;
      if (!cands.length) return;
      cal.st.forEach((ab) => {
        const pr = stateProfile(ab);
        let sh;
        if (cands.length === 1) { sh = { share: { [cands[0]]: 1 } }; }
        else {
          // Home-state candidates get a boost.
          const noise = E().shocks(cands, 0.22);
          cands.forEach((id) => { if (s.pols[id].st === ab) noise[id] += 0.8; });
          sh = E().shares(s, race, cands, pr, { primary: party, noise, area: ab });
        }
        const D = E().delegates(ab);
        const elig = cands.filter((id) => sh.share[id] >= 0.15);
        const tot = U.sum(elig, (id) => sh.share[id]) || 1;
        const res = cands.map((id) => ({ id, pct: U.round(sh.share[id] * 100, 1), del: elig.includes(id) ? Math.round((sh.share[id] / tot) * D) : 0 })).sort((a, b) => b.pct - a.pct);
        res.forEach((r) => { race.del[r.id] = (race.del[r.id] || 0) + r.del; });
        night.st[ab] = night.st[ab] || {};
        night.st[ab][party] = res;
        const w = race.cs[res[0].id];
        if (w) { w.momentum = Math.min(2, w.momentum + 0.25 + D / 400); w.rec = U.clamp(w.rec + 1.5, 0, 98); }
      });
      // Candidates who are far behind drop out.
      if (i >= 1) {
        const lead = Math.max(...cands.map((id) => race.del[id] || 0));
        race.prim[party].cands = cands.filter((id) => {
          if (id === 'me') return true;
          const d = race.del[id] || 0;
          const out = (i >= 3 && d < lead * 0.2) || (i >= 6 && d < lead * 0.5) || (i >= 1 && race.cs[id].rec < 12 && d === 0);
          if (out) { s.pols[id].running = null; GR.sim.news(s, `${W().fullName(s.pols[id])} drops out of the ${GR.PARTIES[party].name} presidential race.`, 'campaign'); }
          return !out;
        });
      }
    });
    race.results.push(night);
    if (race.cands.includes('me')) {
      const meRes = Object.entries(night.st).map(([ab, x]) => x[s.pols.me.party] && x[s.pols.me.party].find((r) => r.id === 'me') && { ab, r: x[s.pols.me.party] }).filter(Boolean);
      const wins = meRes.filter((x) => x.r[0].id === 'me').map((x) => x.ab);
      GR.sim.msgInbox(s, `${cal.name} results`, `You won ${wins.length ? wins.join(', ') : 'no states'} tonight. You now have ${race.del.me} delegates (${Math.ceil(totalDelegates() / 2)} needed to clinch).`);
    }
  }

  function convention(s, race) {
    ['D', 'R'].forEach((party) => {
      const cands = race.prim[party].cands;
      if (!cands.length) return;
      const win = cands.slice().sort((a, b) => (race.del[b] || 0) - (race.del[a] || 0) || race.cs[b].rec - race.cs[a].rec)[0];
      race.nom[party] = win;
      cands.forEach((id) => { if (id !== win && s.pols[id]) s.pols[id].running = null; });
      GR.sim.news(s, `${W().fullName(s.pols[win])} accepts the ${GR.PARTIES[party].name} nomination for President.`, 'campaign');
    });
    race.active = ['D', 'R'].map((p) => race.nom[p]).filter(Boolean);
    race.phase = 'general';
    const me = s.pols.me;
    if (race.cands.includes('me')) {
      if (race.nom[me.party] === 'me') {
        s.stats.elections.push({ y: race.year, off: 'president', title: 'Presidential nomination', won: true, pct: 0, stage: 'primary' });
        const opts = [0, 1, 2].map(() => W().extPol(s, me.party, null, U.pick(['Governor', 'U.S. Senator', 'U.S. Senator'])));
        s.vpChoice = opts.map((p) => p.id);
        GR.sim.inbox(s, { title: 'Choose your running mate', body: 'The convention awaits your pick for Vice President. A running mate helps in their home state and with voters who share their views.', kind: 'vp', choices: opts.map((p) => ({ label: `${W().fullName(p)}, ${p.title} — ${W().ideoLabel((p.fis + p.soc) / 2)}`, act: 'vp:' + p.id })) });
        race.cs.me.momentum += 1;
      } else {
        s.stats.elections.push({ y: race.year, off: 'president', title: 'Presidential nomination', won: false, pct: 0, stage: 'primary' });
        GR.sim.msgInbox(s, 'The nomination slips away', `${W().fullName(s.pols[race.nom[me.party]])} won the nomination with ${race.del[race.nom[me.party]]} delegates. You had ${race.del.me}.`);
        GR.camp.lost(s, race, 'primary');
        race.cands = race.cands.filter((x) => x !== 'me');
      }
    }
  }

  function pickVP(s, id) {
    const race = s.presRace;
    if (!race) return;
    race.vp = id;
    const p = s.pols[id];
    race.cs.me.enth.I += Math.abs((p.fis + p.soc) / 2) < 0.8 ? 2 : 0;
    race.cs.me.enth[s.pols.me.party] += Math.abs((p.fis + p.soc) / 2) >= 0.8 ? 2.5 : 0.5;
    race.cs.me.presence[p.st] = (race.cs.me.presence[p.st] || 0) + 12;
    GR.sim.news(s, `${s.pols.me.fn} ${s.pols.me.ln} picks ${W().fullName(p)} as running mate.`, 'campaign');
    s.vpChoice = null;
  }

  // Election Day: state by state.
  function general(s, year) {
    if (year % 4 !== 0) return;
    const race = s.presRace && s.presRace.year === year ? s.presRace : openPres(s, year);
    if (!race.active || race.active.length < 2) { if (race.phase === 'primary') convention(s, race); }
    const cands = race.active;
    if (!cands || !cands.length) return;
    const noise = E().shocks(cands, 0.12);
    race.ec = {};
    race.states = {};
    const ev = {}, pv = {};
    cands.forEach((id) => { ev[id] = 0; pv[id] = 0; });
    GR.STATES.forEach((st) => {
      const pr = stateProfile(st.ab);
      const n = Object.assign({}, noise);
      const sw = U.gauss() * 0.1;
      cands.forEach((id) => { n[id] += (s.pols[id].party === 'R' ? sw : -sw) + (s.pols[id].st === st.ab ? 0.35 : 0) + (race.vp && id === 'me' && s.pols[race.vp].st === st.ab ? 0.18 : 0); });
      const r = E().shares(s, race, cands, pr, { noise: n, area: st.ab });
      const votes = st.pop * 1e6 * 0.74 * 0.64 * r.turnout;
      const row = {};
      cands.forEach((id) => { row[id] = Math.round(r.share[id] * votes); pv[id] += row[id]; });
      const win = cands.slice().sort((a, b) => row[b] - row[a])[0];
      ev[win] += E().EV(st.ab);
      race.states[st.ab] = { v: row, win };
    });
    const tot = U.sum(Object.values(pv)) || 1;
    race.res = cands.map((id) => ({ id, votes: pv[id], pct: U.round((pv[id] / tot) * 100, 1), ev: ev[id] })).sort((a, b) => b.ev - a.ev);
    race.winner = race.res[0].id;
    race.phase = 'done';
    const w = s.pols[race.winner];
    GR.sim.news(s, `${W().fullName(w)} (${w.party}) wins the presidency with ${race.res[0].ev} electoral votes.`, 'election');
    if (cands.includes('me')) {
      const won = race.winner === 'me';
      s.stats.elections.push({ y: year, off: 'president', title: 'President of the United States', won, pct: (race.res.find((x) => x.id === 'me') || {}).pct, stage: 'general' });
      GR.sim.inbox(s, { title: won ? 'You won the presidency!' : 'Defeated for President', body: `${won ? 'You' : W().fullName(w)} won ${race.res[0].ev} electoral votes and ${race.res[0].pct}% of the popular vote.`, kind: 'result' });
      if (won) GR.camp.won(s, race); else GR.camp.lost(s, race, 'general');
    }
    cands.forEach((id) => { if (s.pols[id]) s.pols[id].running = null; });
  }

  function inaugurate(s, year) {
    const race = s.presRace;
    if (!race || race.year !== year - 1 || !race.winner) return;
    const seat = s.seats.pres;
    const old = s.pols[seat.holder];
    const win = s.pols[race.winner];
    if (old && old !== win) { old.seat = null; old.title = 'Former President'; if (old.isPlayer) GR.sim.leaveOffice(s, seat); }
    if (win.seat && win.seat !== 'pres') {
      const prev = s.seats[win.seat];
      if (win.isPlayer) GR.sim.leaveOffice(s, prev);
      if (win.lead) E().clearLead(s, win);
      prev.holder = null;
      if (prev) { const p = W().fillSeat(s, prev, GR.OFFICES[prev.off].level); GR.sim.news(s, `${W().fullName(p)} appointed to fill ${W().seatTitle(s, prev)}.`, 'gov'); }
    }
    if (old !== win) {
      win.seat = 'pres';
      win.since = year;
      win.app = 55;
      win.title = 'President';
      win.hist.push({ y: year, t: 'President of the United States', seat: 'pres' });
      if (win.isPlayer) GR.sim.takeOffice(s, seat);
    }
    win.terms.president = (win.terms.president || 0) + 1;
    seat.holder = win.id;
    seat.next = year + 3;
    s.nat.president = win.id;
    s.nat.presParty = win.party;
  }

  function week(s, y) {
    const ny = y % 4 === 0 ? y : null;
    // Fields form a year ahead.
    if (y % 4 === 3 && U.monthOf(s.week) >= 5 && (!s.presRace || s.presRace.year !== y + 1)) openPres(s, y + 1);
    if (!ny) return;
    const race = openPres(s, ny);
    if (race.phase === 'primary') {
      E().PRES_CAL.forEach((c, i) => { if (s.week === E().presContestWeek(ny, i)) contest(s, race, i); });
      if (s.week === E().conventionWeek(ny)) convention(s, race);
      // AI campaigns.
      race.cands.forEach((id) => {
        if (id === 'me') return;
        const c = race.cs[id];
        c.funds += race.scale / 40 * (s.pols[id].q / 50);
        const sp = c.funds * 0.06; c.funds -= sp; c.spent += sp;
        c.rec = U.clamp(c.rec + 0.2, 0, 95);
      });
    } else if (race.phase === 'general') {
      race.active.forEach((id) => {
        if (id === 'me') return;
        const c = race.cs[id];
        c.funds += race.scale / 22 * (s.pols[id].q / 50);
        const sp = c.funds * 0.12; c.funds -= sp; c.spent += sp;
        c.rec = U.clamp(c.rec + 0.6, 0, 97);
      });
    }
  }

  // Electoral-vote projection for the campaign map.
  function projectEC(s) {
    const race = s.presRace;
    if (!race) return null;
    const cands = race.phase === 'general' ? race.active : [race.nom.D || race.prim.D.cands[0], race.nom.R || race.prim.R.cands[0]].filter(Boolean);
    if (race.cands.includes('me') && race.phase !== 'general') cands[s.pols.me.party === 'D' ? 0 : 1] = 'me';
    const out = {};
    GR.STATES.forEach((st) => { out[st.ab] = E().shares(s, race, cands, stateProfile(st.ab), { area: st.ab }).share; });
    return { cands, st: out };
  }

  return { openPres, declare, withdraw, contest, convention, pickVP, general, inaugurate, week, projectEC, stateProfile, totalDelegates };
})();
