// The player's campaign: events, marketing, staff, volunteers, endorsements,
// policy messaging, opponents' campaigns, debates and outcomes.
var GR = globalThis.GR || (globalThis.GR = {});

GR.camp = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const E = () => GR.elect;

  const race = (s) => E().playerRace(s);
  const me = (s) => s.pols.me;
  const C = (s) => race(s).cs.me;
  const has = (s, k) => !!(s.campaign && s.campaign.staff[k]);
  const trait = (s, k) => me(s).traits.includes(k);
  const sk = (s, k) => me(s).sk[k] / 100;

  // Areas you can campaign in: counties (statewide), neighborhoods (districts), states (President).
  function areas(s) {
    const r = race(s);
    if (!r) return [];
    if (r._areas) return r._areas;
    let a;
    if (r.off === 'president') a = GR.STATES.map((st) => ({ k: st.ab, name: st.name, pop: st.pop * 1e6, pr: GR.geo.mkProfile({ ab: st.ab }, st.pop * 1e6, st.lean, 2.2, 0, 0, 'st' + st.ab) }));
    else if (r.off === 'governor' || r.off === 'ussenate') a = GR.geo.counties(GR.geo.state(s.home.state)).map((c) => ({ k: c.k, name: c.name + ' County', pop: c.prof.pop, pr: c.prof }));
    else a = E().zipAreas(s, r);
    a.sort((x, y) => y.pop - x.pop);
    Object.defineProperty(r, '_areas', { value: a, enumerable: false, configurable: true, writable: true });
    return a;
  }

  // How much a single campaign stop moves a district of this size.
  function reach(s, pop) { return U.clamp(Math.sqrt(60000 / Math.max(2000, pop)), 0.12, 3); }

  function spendCash(s, amt) {
    const c = C(s);
    if (c.funds < amt) return false;
    c.funds -= amt;
    c.spent += amt;
    return true;
  }
  function addFunds(s, amt, src) {
    const c = C(s);
    amt = Math.round(amt);
    c.funds += amt;
    c.raised += amt;
    s.campaign.ledger.push({ w: s.week, src, amt });
    if (s.campaign.ledger.length > 80) s.campaign.ledger.shift();
    return amt;
  }

  function fundFactor(s) {
    const m = me(s);
    const r = race(s);
    let f = (0.45 + sk(s, 'fund')) * (1 + m.network / 60) * (0.75 + m.standing / 200) * (0.6 + r.cs.me.rec / 160);
    if (r.inc === 'me') f *= 1.35;
    if (has(s, 'finance')) f *= 1.35;
    if (trait(s, 'rainmaker')) f *= 1.2;
    if (has(s, 'manager')) f *= 1.1;
    return f;
  }
  const mgr = (s) => (has(s, 'manager') ? 1.1 : 1);

  // ---------- Actions (each costs hours) ----------
  const ACTIONS = {
    calls: { name: 'Call time with donors', h: 4, desc: 'Dial for dollars from your donor network.' },
    fundraiser: { name: 'Host a fundraising dinner', h: 6, desc: 'A big-ticket event. Costs money up front, raises more.' },
    rally: { name: 'Hold a rally', h: 6, area: true, desc: 'Fire up your base and boost name recognition in an area.' },
    townhall: { name: 'Town hall meeting', h: 4, area: true, desc: 'Win over independents. Tough questions can go badly.' },
    doors: { name: 'Knock on doors', h: 5, area: true, desc: 'Retail politics. Strong in small districts, builds your ground game.' },
    interview: { name: 'Media interview', h: 2, desc: 'Free press. Risk of a gaffe.' },
    debateprep: { name: 'Debate prep', h: 4, desc: 'Practice for upcoming debates.' },
    oppo: { name: 'Opposition research', h: 2, desc: 'Hire researchers to dig into your opponents.' },
  };

  function act(s, k, area) {
    const a = ACTIONS[k];
    const r = race(s);
    if (!r || !a) return { ok: false, msg: 'No active campaign.' };
    if (s.hoursLeft < a.h) return { ok: false, msg: 'Not enough hours left this week.' };
    const c = r.cs.me;
    const m = me(s);
    const A = area ? areas(s).find((x) => String(x.k) === String(area)) : null;
    if (a.area && !A) return { ok: false, msg: 'Choose where to campaign.' };
    const rch = A ? reach(s, A.pop) : reach(s, r.pr.pop);
    let msg = '';
    switch (k) {
      case 'calls': {
        const amt = addFunds(s, r.scale * 0.022 * fundFactor(s) * (0.7 + U.rand() * 0.6), 'Donor calls');
        m.network += U.chance(0.25) ? 1 : 0;
        msg = `Raised ${U.money(amt)} from donor calls.`;
        break;
      }
      case 'fundraiser': {
        const cost = Math.round(r.scale * 0.006);
        if (c.funds < cost && m.money < cost) return { ok: false, msg: `You need ${U.money(cost)} to host it.` };
        if (c.funds >= cost) { c.funds -= cost; } else m.money -= cost;
        const amt = addFunds(s, r.scale * 0.07 * fundFactor(s) * (0.6 + U.rand() * 0.8), 'Fundraising dinner');
        msg = `The dinner raised ${U.money(amt)} (cost ${U.money(cost)}).`;
        break;
      }
      case 'rally': {
        const cost = Math.round(r.scale * 0.0025);
        if (!spendCash(s, cost)) return { ok: false, msg: `A rally costs ${U.money(cost)} in campaign funds.` };
        const ch = (0.5 + sk(s, 'charisma')) * (trait(s, 'charismatic') ? 1.15 : 1) * mgr(s);
        c.presence[A.k] = U.clamp((c.presence[A.k] || 0) + 6 * rch * ch, 0, 35);
        c.rec = U.clamp(c.rec + 1.6 * ch * Math.sqrt(A.pop / r.pr.pop) * Math.min(2, rch) + 0.4, 0, 100);
        c.enth[m.party] = U.clamp(c.enth[m.party] + 1.4 * ch, 0, 99);
        c.enth.I = U.clamp(c.enth.I + 0.3 * ch, 0, 99);
        const small = addFunds(s, r.scale * 0.006 * ch * (has(s, 'digital') ? 1.35 : 1), 'Small-dollar donations at rally');
        msg = `Rally in ${A.name}: the crowd was energized. ${U.money(small)} in small donations.`;
        break;
      }
      case 'townhall': {
        const ch = (0.4 + (sk(s, 'debate') + sk(s, 'policy')) / 2) * mgr(s);
        const bad = U.chance(0.16 - sk(s, 'debate') * 0.1 - (has(s, 'comms') ? 0.05 : 0));
        if (bad) {
          c.enth.I = U.clamp(c.enth.I - 2.5, 0, 99);
          m.fav -= 1;
          msg = `A heated exchange at your ${A.name} town hall went viral for the wrong reasons.`;
        } else {
          c.enth.I = U.clamp(c.enth.I + 2 * ch, 0, 99);
          c.enth[GR.other(m.party)] = U.clamp(c.enth[GR.other(m.party)] + 0.6 * ch, 0, 99);
          c.presence[A.k] = U.clamp((c.presence[A.k] || 0) + 3 * rch, 0, 35);
          c.rec = U.clamp(c.rec + 0.6 * Math.min(2, rch), 0, 100);
          msg = `Town hall in ${A.name}: voters appreciated your straight answers.`;
        }
        break;
      }
      case 'doors': {
        const ch = (0.45 + sk(s, 'grass')) * (has(s, 'field') ? 1.4 : 1) * mgr(s);
        c.presence[A.k] = U.clamp((c.presence[A.k] || 0) + 5 * rch * ch, 0, 35);
        c.ground += r.scale * 0.006 * ch;
        c.rec = U.clamp(c.rec + 1.1 * ch * Math.min(2.5, rch) * Math.sqrt(A.pop / r.pr.pop) + 0.15, 0, 100);
        c.enth.I = U.clamp(c.enth.I + 0.4 * ch, 0, 99);
        m.sk.grass = U.clamp(m.sk.grass + (U.chance(0.15) ? 1 : 0), 0, 99);
        msg = `You knocked on ${Math.round(110 * ch)} doors in ${A.name}.`;
        break;
      }
      case 'interview': {
        const ch = (0.45 + sk(s, 'charisma') * 0.5 + sk(s, 'debate') * 0.5) * (has(s, 'comms') ? 1.3 : 1) * mgr(s);
        const gaffe = U.chance(0.12 - sk(s, 'debate') * 0.08 - (has(s, 'comms') ? 0.05 : 0));
        if (gaffe) { c.enth.I -= 3; c.momentum -= 0.3; m.fav -= 2; msg = 'You stumbled over a question and the clip is making the rounds.'; }
        else { c.rec = U.clamp(c.rec + 1.5 * ch * reach(s, r.pr.pop), 0, 100); c.enth.I += 0.6 * ch; msg = 'The interview went well and boosted your profile.'; }
        break;
      }
      case 'debateprep': {
        s.campaign.prepped = Math.min(6, s.campaign.prepped + 1);
        m.sk.debate = U.clamp(m.sk.debate + (U.chance(0.3) ? 1 : 0), 0, 99);
        msg = `Debate prep session ${s.campaign.prepped}/6 complete.`;
        break;
      }
      case 'oppo': {
        const cost = Math.round(r.scale * 0.02);
        if (!spendCash(s, cost)) return { ok: false, msg: `Opposition research costs ${U.money(cost)}.` };
        const opps = r.cands.filter((id) => id !== 'me' && (r.phase === 'primary' ? s.pols[id].party === m.party : r.active.includes(id)));
        if (U.chance(0.4) && opps.length) {
          const t = U.pick(opps);
          s.campaign.dirt = { id: t, w: s.week };
          msg = `Your researchers found damaging material on ${W().fullName(s.pols[t])}. Your next attack ad on them will hit much harder.`;
        } else msg = `Researchers spent ${U.money(cost)} but found nothing usable.`;
        break;
      }
    }
    s.hoursLeft -= a.h;
    c.enth.I = U.clamp(c.enth.I, 0, 99);
    return { ok: true, msg };
  }

  // Promote a policy position (the Policy sub-tab). Voters who agree get more excited,
  // those who disagree get less so, and public opinion nudges toward you (at most 10%).
  function promote(s, k) {
    const r = race(s);
    if (!r) return { ok: false, msg: 'No active campaign.' };
    if (s.hoursLeft < 3) return { ok: false, msg: 'Promoting a position takes 3 hours.' };
    const pol = GR.POLICY[k];
    const m = me(s);
    const c = r.cs.me;
    const score = W().stance(m, k);
    const op = s.campaign.opinion;
    const ch = (0.5 + sk(s, 'charisma') * 0.5 + sk(s, 'policy') * 0.5) * mgr(s);
    const fx = {};
    ['D', 'R', 'I'].forEach((g) => {
      const ag = E().groupAgree(r.pr, g, pol, score, (op[k] || 0) * (score < 0 ? -1 : 1));
      const d = ((ag - 50) / 50) * 2.4 * ch * pol.sal * (r.phase === 'primary' && g !== m.party ? 0.3 : 1);
      c.enth[g] = U.clamp(c.enth[g] + d, 1, 99);
      fx[g] = d;
    });
    const dir = score === 0 ? 0 : score > 0 ? 1 : -1;
    op[k] = U.clamp((op[k] || 0) + 0.04 * ch * Math.abs(dir), 0, 0.25);
    s.campaign.promoted[k] = (s.campaign.promoted[k] || 0) + 1;
    s.campaign.lastPromote = { k, fx };
    s.hoursLeft -= 3;
    return { ok: true, msg: `You campaigned on ${pol.name.toLowerCase()}: Democrats ${sign(fx.D)}, Republicans ${sign(fx.R)}, Independents ${sign(fx.I)} enthusiasm.` };
  }
  const sign = (v) => (v >= 0 ? '+' : '') + v.toFixed(1);

  // ---------- Staff ----------
  function staffCost(s, k) {
    const st = GR.STAFF.find((x) => x.k === k);
    const r = race(s);
    return Math.round(Math.max(st.min, r.scale * st.cost));
  }
  function toggleStaff(s, k) {
    const cs = s.campaign.staff;
    if (cs[k]) { delete cs[k]; return { ok: true, msg: 'Staffer let go.' }; }
    const cost = staffCost(s, k);
    if (C(s).funds < cost * 2) return { ok: false, msg: `You need at least ${U.money(cost * 2)} on hand to hire.` };
    cs[k] = { since: s.week, name: U.pick(GR.NAMES[U.chance(0.5) ? 'f' : 'm']) + ' ' + U.pick(GR.NAMES.l), g: U.chance(0.5) ? 'f' : 'm', sd: U.uid('st') };
    return { ok: true, msg: `Hired ${cs[k].name}.` };
  }

  // ---------- Volunteers ----------
  function officeCost(s) { return Math.round(Math.max(400, race(s).scale * 0.008)); }
  function openOffice(s, area) {
    const cost = officeCost(s);
    if (!spendCash(s, cost)) return { ok: false, msg: `Opening an office costs ${U.money(cost)}.` };
    const c = C(s);
    c.offices[area] = (c.offices[area] || 0) + 1;
    return { ok: true, msg: 'Volunteer office opened.' };
  }

  // ---------- Endorsements ----------
  // Interest groups and officeholders you can ask for support.
  function endorsers(s) {
    const r = race(s);
    const m = me(s);
    const list = [];
    GR.GROUPS.forEach((g) => {
      if (g.rural && r.pr.urban > 70) return;
      let fit = 0, n = 0;
      Object.entries(g.care).forEach(([k, dir]) => { fit += W().stance(m, k) * dir; n++; });
      fit = n ? fit / n : 0.6 - Math.abs(W().axes(m).fis + W().axes(m).soc) / 4;
      const opp = r.cands.filter((id) => id !== 'me').map((id) => { let f = 0; Object.entries(g.care).forEach(([k, dir]) => { f += W().stance(s.pols[id], k) * dir; }); return n ? f / n : 0; });
      const best = opp.length ? Math.max(...opp) : -2;
      list.push({ k: 'g:' + g.k, name: g.name, kind: 'Interest group', fit, best, w: 0.35 + g.w * 0.45, money: g.money });
    });
    // Officeholders of your party.
    Object.values(s.seats).forEach((seat) => {
      const p = s.pols[seat.holder];
      if (!p || p.isPlayer || p.party !== m.party || p.id === r.inc) return;
      if (GR.OFFICES[seat.off].level < Math.max(2, GR.OFFICES[r.off].level - 1) && !['mayor', 'governor', 'ussenate', 'ushouse'].includes(seat.off)) return;
      if (r.cands.includes(p.id)) return;
      const fit = 1.4 - Math.abs((W().axes(p).fis + W().axes(p).soc) / 2 - (W().axes(m).fis + W().axes(m).soc) / 2);
      list.push({ k: 'p:' + p.id, name: W().fullName(p), kind: W().seatTitle(s, seat), fit, best: 0, w: 0.4 + GR.OFFICES[seat.off].level * 0.18, money: 0.5, pol: p.id });
    });
    const got = new Set(r.cs.me.endorse.map((e) => e.k));
    list.forEach((e) => {
      e.have = got.has(e.k);
      e.taken = r.cands.some((id) => id !== 'me' && r.cs[id].endorse.some((x) => x.k === e.k));
      const pollShare = latestShare(s);
      e.p = U.clamp(0.25 + (e.fit - Math.max(0, e.best)) * 0.35 + (pollShare - 0.4) * 0.8 + me(s).standing / 300 + (e.kind === 'Interest group' ? 0 : -0.1), 0.03, 0.92);
      if (e.taken) e.p = 0;
      e.pp = Math.round(5 + e.w * 12);
    });
    return list.sort((a, b) => b.w - a.w);
  }

  function latestShare(s) {
    const pl = s.campaign && s.campaign.polls[s.campaign.polls.length - 1];
    if (!pl) return 0.4;
    const t = U.sum(Object.values(pl.v)) || 1;
    return (pl.v.me || 0) / t;
  }

  function askEndorse(s, key) {
    const e = endorsers(s).find((x) => x.k === key);
    const m = me(s);
    if (!e || e.have) return { ok: false, msg: 'Not available.' };
    if (s.hoursLeft < 3) return { ok: false, msg: 'Meetings take 3 hours.' };
    if (m.pp < e.pp) return { ok: false, msg: `You need ${e.pp} political points.` };
    s.hoursLeft -= 3;
    m.pp -= e.pp;
    if (U.chance(e.p)) {
      C(s).endorse.push({ k: e.k, name: e.name, w: e.w });
      const cash = e.money ? addFunds(s, race(s).scale * 0.03 * e.money, `${e.name} PAC`) : 0;
      GR.sim.news(s, `${e.name} endorses ${m.fn} ${m.ln}.`, 'campaign');
      if (e.pol) s.pols[e.pol].ties = (s.pols[e.pol].ties || 0) + 1;
      return { ok: true, msg: `${e.name} endorsed you!${cash ? ' Their PAC chipped in ' + U.money(cash) + '.' : ''}` };
    }
    return { ok: true, msg: `${e.name} decided not to endorse right now.` };
  }

  // ---------- Opponents and campaign opportunities ----------
  function makeOpps(s) {
    const m = me(s);
    const y = s.campaign.year;
    const list = (s.races[y] || []).filter((r) => r.id !== s.campaign.race && r.cands.some((id) => s.pols[id].party === m.party));
    const opps = [];
    U.shuffle(list).slice(0, 3).forEach((r) => {
      const id = r.nom[m.party] || r.cands.find((x) => s.pols[x].party === m.party);
      const p = s.pols[id];
      if (!p) return;
      const kind = U.chance(0.5) ? 'Rally' : 'Fundraiser';
      const title = p.seat === r.seat ? GR.OFFICES[r.off].name.replace('Member', 'Member') : 'Candidate for ' + GR.OFFICES[r.off].short;
      opps.push({ id: U.uid('o'), kind, who: id, label: `${kind} with ${title} ${W().fullName(p)} (${W().seatTitle(s, s.seats[r.seat]).replace(/^.*?(District|Ward)/, '$1')})`, w: s.week });
    });
    s.campaign.opps = opps.slice(0, 4);
  }

  function takeOpp(s, id) {
    const o = s.campaign.opps.find((x) => x.id === id);
    if (!o) return { ok: false };
    if (s.hoursLeft < 4) return { ok: false, msg: 'This takes 4 hours.' };
    s.hoursLeft -= 4;
    const m = me(s);
    const p = s.pols[o.who];
    const c = C(s);
    m.pp += 6 + Math.round((p.pp || 100) / 2000);
    p.ties = (p.ties || 0) + 1;
    m.network += 1;
    if (o.kind === 'Rally') { c.rec = U.clamp(c.rec + 1.2, 0, 100); c.enth[m.party] += 1; }
    else addFunds(s, race(s).scale * 0.03 * fundFactor(s), `Joint fundraiser with ${W().fullName(p)}`);
    s.campaign.opps = s.campaign.opps.filter((x) => x.id !== id);
    m.standing = U.clamp(m.standing + 1.5, 0, 100);
    return { ok: true, msg: `${o.kind} with ${W().fullName(p)} done. +political points, +party standing.` };
  }
  function dropOpp(s, id) { s.campaign.opps = s.campaign.opps.filter((x) => x.id !== id); return { ok: true }; }

  // ---------- Weekly campaign tick ----------
  function week(s) {
    const r = race(s);
    if (!r || !s.campaign) return;
    const m = me(s);
    const c = r.cs.me;
    const cp = s.campaign;
    const phaseEnd = r.phase === 'primary' || r.phase === 'filing' ? (r.off === 'president' ? E().conventionWeek(r.year) : E().primaryWeek(r.year)) : E().generalWeek(r.year);
    const wl = Math.max(0, phaseEnd - s.week);
    // Overhead: staff and office rent.
    let over = 0;
    Object.keys(cp.staff).forEach((k) => { over += staffCost(s, k); });
    const nOff = U.sum(Object.values(c.offices));
    over += nOff * Math.round(officeCost(s) * 0.12);
    cp.overhead = over;
    if (c.funds >= over) { c.funds -= over; c.spent += over * 0.4; } else {
      c.funds = 0;
      if (Object.keys(cp.staff).length) { const k = Object.keys(cp.staff)[0]; delete cp.staff[k]; GR.sim.msg(cp, `Out of money: your ${GR.STAFF.find((x) => x.k === k).name.toLowerCase()} quit.`); }
    }
    // Volunteers recruit and work.
    if (nOff) {
      const rec = nOff * (0.6 + sk(s, 'grass')) * (c.enth[m.party] / 50) * (has(s, 'field') ? 1.4 : 1) * 2.2;
      c.vols = Math.round((c.vols || 0) * 0.94 + rec);
      Object.entries(c.offices).forEach(([k, n]) => { const A = areas(s).find((x) => String(x.k) === k); c.presence[k] = U.clamp((c.presence[k] || 0) + 0.8 * n * (A ? reach(s, A.pop) : 1), 0, 35); });
      c.ground += c.vols * r.scale * 0.00009;
      c.rec = U.clamp(c.rec + Math.min(1.2, c.vols * 0.01), 0, 100);
    }
    // Ads.
    let adSpend = 0;
    GR.ADS.forEach((ad) => {
      let amt = cp.ads[ad.k] || 0;
      if (!amt) return;
      if (ad.k === 'tv' && r.scale < ad.minScale) amt = 0;
      amt = Math.min(amt, c.funds);
      if (amt <= 0) return;
      c.funds -= amt; c.spent += amt; adSpend += amt;
      let eff = (amt / r.scale) * ad.eff * (ad.k === 'digital' && has(s, 'digital') ? 1.35 : 1) * (trait(s, 'charismatic') ? 1.1 : 1);
      if (cp.tone === 'positive') {
        c.rec = U.clamp(c.rec + eff * 120, 0, 100);
        c.enth[m.party] = U.clamp(c.enth[m.party] + eff * 25, 0, 99);
        c.enth.I = U.clamp(c.enth.I + eff * 18, 0, 99);
      } else {
        const t = r.cs[cp.target] ? cp.target : (r.active || r.cands).find((id) => id !== 'me' && (r.phase !== 'primary' || s.pols[id].party === m.party));
        if (!t) return;
        const dirt = cp.dirt && cp.dirt.id === t ? 2 : 1;
        const hit = eff * (cp.tone === 'attack' ? 30 : 16) * dirt * (trait(s, 'competitive') ? 1.15 : 1);
        const tc = r.cs[t];
        tc.enth.I = U.clamp(tc.enth.I - hit, 1, 99);
        tc.enth[s.pols[t].party] = U.clamp(tc.enth[s.pols[t].party] - hit * 0.35, 1, 99);
        c.rec = U.clamp(c.rec + eff * 50, 0, 100);
        if (cp.tone === 'attack' && U.chance(0.04 + (s.pols[t].traits.includes('Chivalrous') ? 0.05 : 0))) { c.enth.I -= 2.5; GR.sim.msg(cp, 'Voters are turned off by your negative ads. (Backlash)'); }
        if (dirt > 1 && cp.tone === 'attack') { cp.dirt = null; GR.sim.msg(cp, `Your attack ad exposing ${W().fullName(s.pols[t])} is dominating the news.`); }
      }
    });
    cp.adSpend = adSpend;
    // Presence fades slowly; enthusiasm drifts toward baseline.
    Object.keys(c.presence).forEach((k) => { c.presence[k] *= 0.985; });
    ['D', 'R', 'I'].forEach((g) => { c.enth[g] = U.clamp(c.enth[g] + (c.base[g] - c.enth[g]) * 0.012, 1, 99); });
    c.momentum *= 0.9;
    c.debate *= 0.97;
    // Opponents campaign.
    const opps = r.cands.filter((id) => id !== 'me' && (r.phase !== 'general' || r.active.includes(id)));
    opps.forEach((id) => npcWeek(s, r, id, wl));
    // Pollster: free polls every two weeks.
    if (has(s, 'pollster') && s.week % 2 === 0 && (r.phase === 'primary' || r.phase === 'general')) takePoll(s, true);
    // Campaign opportunities refresh.
    if (U.chance(0.3) || !cp.opps.length) makeOpps(s);
    // Debates.
    GR.debate.schedule(s, r, wl);
    // Grassroots small-dollar trickle.
    addFunds(s, r.scale * 0.002 * (c.enth[m.party] / 60) * (has(s, 'digital') ? 1.5 : 1), 'Online donations');
    // Name recognition carries over to the player.
    syncRec(s, r);
    if (r.phase === 'filing' && s.week >= E().filingWeek(r.year, r.off)) r.phase = 'primary';
  }

  function npcWeek(s, r, id, wl) {
    const p = s.pols[id];
    const c = r.cs[id];
    const inc = r.inc === id;
    const raise = (r.scale / 32) * (p.q / 50) * (inc ? 1.35 : 1) * (0.6 + U.rand() * 0.8) * (r.phase === 'filing' ? 0.6 : 1);
    c.funds += raise; c.raised += raise;
    const sp = c.funds * (wl <= 10 ? 0.14 : wl <= 20 ? 0.05 : 0.02);
    c.funds -= sp; c.spent += sp;
    c.rec = U.clamp(c.rec + 0.25 + (sp / r.scale) * 70 * (p.q / 55), 0, 96);
    c.ground += r.scale * 0.003 * (p.q / 50);
    ['D', 'R', 'I'].forEach((g) => { c.enth[g] = U.clamp(c.enth[g] + (c.base[g] - c.enth[g]) * 0.03 + (g === p.party ? 0.12 : 0), 1, 99); });
    if (U.chance(0.04 * (p.q / 50))) {
      const k = U.pick(Object.keys(GR.POLICY).filter((x) => Math.abs(W().stance(s.pols.me, x) - W().stance(p, x)) > 1.5)) || 'incometax';
      if (r.cs.me && (r.phase !== 'primary' || p.party === s.pols.me.party)) {
        r.cs.me.enth.I = U.clamp(r.cs.me.enth.I - 1.2, 1, 99);
        GR.sim.msg(s.campaign, `${W().fullName(p)} has run an ad campaign attacking your policy regarding ${GR.POLICY[k].name.toLowerCase()}.`);
      }
    }
    if (U.chance(0.015)) {
      const e = U.pick(GR.GROUPS);
      if (!Object.values(r.cs).some((x) => x.endorse.some((y) => y.k === 'g:' + e.k))) c.endorse.push({ k: 'g:' + e.k, name: e.name, w: 0.4 });
    }
  }

  function syncRec(s, r) {
    const m = me(s);
    const v = r.cs.me.rec;
    const t = GR.OFFICES[r.off].tier;
    if (t === 'national') m.recNat = Math.max(m.recNat, v);
    else if (t === 'state') { m.recState = Math.max(m.recState, v); m.recLocal = Math.max(m.recLocal, v * 0.8); }
    else { const share = U.clamp(Math.sqrt(r.pr.pop / Math.max(s.city.pop, r.pr.pop)), 0.25, 1); m.recLocal = Math.max(m.recLocal, v * share); m.recState = Math.max(m.recState, v * (r.pr.pop / (GR.STATE[s.home.state].pop * 1e6)) * 0.5); }
  }

  function takePoll(s, free) {
    const r = race(s);
    if (!r) return { ok: false };
    const cost = Math.round(Math.max(500, r.scale * 0.015));
    if (!free) { if (!spendCash(s, cost)) return { ok: false, msg: `A poll costs ${U.money(cost)}.` }; }
    r.pollParty = s.pols.me.party;
    if (r.phase === 'filing') r.phase = 'primary';
    const pl = E().poll(s, r, has(s, 'pollster') ? 2.8 : 4.2);
    if (r.phase === 'primary' && !r.prim[s.pols.me.party].cands.filter((id) => id !== 'me').length && r.active) {
      /* uncontested primary: poll the general instead */
    }
    if (pl) { pl.phase = r.phase; s.campaign.polls.push(pl); }
    return { ok: true, msg: 'New poll results are in.' };
  }

  // Projected result with no noise (the "Predict Election" button).
  function predict(s) {
    const r = race(s);
    if (!r) return null;
    const m = me(s);
    const prim = r.phase !== 'general' && r.prim[m.party].cands.length > 1;
    const cands = prim ? r.prim[m.party].cands : (r.active && r.active.length ? r.active : r.cands.filter((id) => id === 'me' || s.pols[id].party !== m.party || false));
    const list = prim ? cands : [...new Set(['me', ...['D', 'R'].map((p) => p === m.party ? 'me' : (r.nom[p] || r.prim[p].cands.slice().sort((a, b) => r.cs[b].rec - r.cs[a].rec)[0])).filter(Boolean)])];
    const out = E().shares(s, r, list, r.pr, prim ? { primary: m.party } : {});
    return { prim, list, share: out.share };
  }

  // ---------- Outcomes ----------
  function won(s, r) {
    const m = me(s);
    const c = r.cs.me;
    m.warChest += Math.max(0, Math.round(c.funds));
    m.pp += 20 + GR.OFFICES[r.off].level * 15;
    m.standing = U.clamp(m.standing + 8, 0, 100);
    GR.sim.log(s, `Won the election for ${W().seatTitle(s, s.seats[r.seat])} with ${(r.res.find((x) => x.id === 'me') || {}).pct}% of the vote.`);
    s.campaign = null;
    m.running = null;
  }

  function lost(s, r, stage) {
    const m = me(s);
    const c = r.cs.me;
    m.warChest += Math.max(0, Math.round(c.funds));
    m.pp += 5;
    if (stage === 'primary') {
      s.stats.elections.push({ y: r.year, off: r.off, title: W().seatTitle(s, s.seats[r.seat]), won: false, pct: (r.prim[m.party].res.find((x) => x.id === 'me') || {}).pct || 0, stage: 'primary' });
      r.cands = r.cands.filter((id) => id !== 'me');
    }
    GR.sim.log(s, `Lost the ${stage} for ${W().seatTitle(s, s.seats[r.seat])}.`);
    s.campaign = null;
    m.running = null;
  }

  function withdraw(s) {
    const r = race(s);
    if (!r) return;
    if (s.campaign.pres) { GR.pres.withdraw(s); return; }
    r.cands = r.cands.filter((id) => id !== 'me');
    ['D', 'R'].forEach((p) => { r.prim[p].cands = r.prim[p].cands.filter((id) => id !== 'me'); if (r.nom[p] === 'me') r.nom[p] = null; });
    if (r.active) r.active = r.active.filter((id) => id !== 'me');
    me(s).warChest += Math.max(0, Math.round(r.cs.me.funds));
    delete r.cs.me;
    GR.sim.log(s, `Withdrew from the race for ${W().seatTitle(s, s.seats[r.seat])}.`);
    s.campaign = null;
    me(s).running = null;
  }

  function transfer(s, amt) {
    const m = me(s);
    amt = Math.min(amt, m.money);
    if (amt <= 0) return { ok: false, msg: 'No personal money to transfer.' };
    m.money -= amt;
    addFunds(s, amt, 'Self-funding');
    return { ok: true, msg: `Moved ${U.money(amt)} of your own money into the campaign.` };
  }

  return { ACTIONS, areas, act, promote, staffCost, toggleStaff, officeCost, openOffice, endorsers, askEndorse, makeOpps, takeOpp, dropOpp, week, takePoll, predict, won, lost, withdraw, transfer, race, fundFactor };
})();
