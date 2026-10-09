// Governing: bills and votes, relationships and respect, committees, leadership
// elections, budgets, executive powers, metrics and approval.
var GR = globalThis.GR || (globalThis.GR = {});

GR.gov = (function () {
  const U = GR.util;
  const W = () => GR.world;

  const JUR_BODIES = { school: ['school'], city: ['council'], state: ['house', 'senate'], nation: ['ushouse', 'ussenate'] };
  const bodiesOf = (s, jur) => JUR_BODIES[jur].filter((b) => s.bodies[b]);
  const BODY_OFF = { school: 'school', council: 'council', house: 'statehouse', senate: 'statesenate', ushouse: 'ushouse', ussenate: 'ussenate' };
  const isFed = (b) => b === 'ushouse' || b === 'ussenate';

  // ---------- Relationships and respect ----------
  const rel = (s, id) => (s.rel && s.rel[id]) || 0;
  function addRel(s, id, d) {
    if (!id || id === 'me') return;
    s.rel = s.rel || {};
    s.rel[id] = U.clamp(Math.round(((s.rel[id] || 0) + d) * 10) / 10, -100, 100);
  }
  function addRespect(s, d) { const m = s.pols.me; const r = m.respect || 20; m.respect = U.clamp(r + (d > 0 ? d * Math.max(0.05, 1 - r / 105) : d), 0, 100); }
  const relLabel = (v) => (v >= 60 ? 'Close ally' : v >= 30 ? 'Friendly' : v >= 10 ? 'Cordial' : v > -10 ? 'Neutral' : v > -30 ? 'Cool' : v > -60 ? 'Hostile' : 'Enemy');

  function myBody(s) {
    const m = s.pols.me;
    if (!m.seat) return null;
    const off = s.seats[m.seat].off;
    return Object.keys(BODY_OFF).find((b) => BODY_OFF[b] === off) || null;
  }
  function myJur(s) {
    const m = s.pols.me;
    if (!m.seat) return null;
    return GR.OFFICES[s.seats[m.seat].off].jur;
  }

  // ---------- Sessions ----------
  function inSession(s, b) {
    const mo = U.monthOf(s.week);
    if (b === 'house' || b === 'senate') return mo <= 4 || (mo === 5 && U.chance(0.3));
    if (isFed(b)) return mo !== 7 && !(mo === 11 && U.dateOf(s.week).getUTCDate() > 18);
    return s.week % 2 === 0;
  }

  // ---------- Bills ----------
  function policyBill(s, jur, k, to, spon) {
    const J = s.jur[jur];
    const pol = GR.POLICY[k];
    const lvl = GR.lvlOf(jur);
    const opts = GR.policyOpts(pol, lvl);
    const from = J.law[k];
    const body0 = bodiesOf(s, jur)[0];
    const comm = committeeFor(s, body0, pol.cat);
    return {
      id: U.uid('b'), jur, k, from, to, title: `${pol.name} Act`, sub: `${opts[from]} → ${opts[to]}`, spon, cos: [],
      stage: 'committee', body: body0, comm, w: s.week, due: s.week + U.randInt(1, 3), votes: [], my: {}, pledges: {},
    };
  }

  function committeeFor(s, b, cat) {
    const B = s.bodies[b];
    if (!B) return null;
    const jur = GR.BODIES[b].jur;
    const list = GR.COMMITTEES[jur === 'school' ? 'school' : jur === 'city' ? 'city' : jur];
    const c = list.find((x) => x.cats.includes(cat)) || list[0];
    return c.k;
  }

  // AI members introduce bills that move the law toward their views.
  function npcBills(s) {
    ['school', 'city', 'state', 'nation'].forEach((jur) => {
      const bs = bodiesOf(s, jur);
      if (!bs.length || !inSession(s, bs[0])) return;
      const J = s.jur[jur];
      const pending = (J.bills || []).filter((x) => !['law', 'dead', 'vetoed'].includes(x.stage)).length;
      if (pending > 8 || !U.chance(jur === 'nation' || jur === 'state' ? 0.45 : 0.3)) return;
      const maj = W().majority(s, bs[0]);
      const party = U.chance(0.72) ? maj : GR.other(maj);
      let spon = U.pick(W().members(s, bs[0]).filter((m) => m.party === party && !m.isPlayer));
      if (!spon && isFed(bs[0])) spon = W().extMember(s, party, bs[0]);
      if (!spon && jur === 'school') spon = U.pick(W().members(s, 'school').filter((m) => !m.isPlayer));
      if (!spon) return;
      const lvl = GR.lvlOf(jur);
      const cands = GR.policiesFor(jur).map((pol) => {
        const cur = GR.optScore(pol, J.law[pol.k], lvl);
        const want = W().stance(spon, pol.k);
        return { pol, gap: want - cur };
      }).filter((x) => Math.abs(x.gap) > 0.8);
      const busy = new Set((J.bills || []).filter((x) => !['law', 'dead', 'vetoed'].includes(x.stage)).map((x) => x.k));
      const open = cands.filter((x) => !busy.has(x.pol.k));
      if (!open.length) return;
      const c = U.weighted(open, (x) => Math.abs(x.gap) * x.pol.sal);
      const to = U.clamp(J.law[c.pol.k] + (c.gap > 0 ? 1 : -1), 0, GR.policyOpts(c.pol, lvl).length - 1);
      if (to === J.law[c.pol.k]) return;
      const b = policyBill(s, jur, c.pol.k, to, spon.id);
      J.bills = J.bills || [];
      J.bills.push(b);
    });
  }

  // A member's inclination to vote yes (positive) on a bill.
  function inclination(s, p, b, bodyKey) {
    const J = s.jur[b.jur];
    let v = 0;
    if (b.budget) {
      const fis = W().axes(p).fis;
      v = 0.6 - fis * b.budget.change * 12 - (b.budget.taxUp ? fis * 0.6 : 0);
      const ex = execOf(s, b.jur);
      if (ex) v += ex.party === p.party ? 0.8 : -0.5;
    } else {
      const pol = GR.POLICY[b.k];
      const lvl = GR.lvlOf(b.jur);
      const st = W().stance(p, b.k);
      const dFrom = Math.abs(st - GR.optScore(pol, b.from, lvl));
      const dTo = Math.abs(st - GR.optScore(pol, b.to, lvl));
      v = (dFrom - dTo) * 1.4;
      // District pressure.
      const seat = s.seats[p.seat];
      if (seat && seat.off !== 'president') {
        const pr = W().seatProfile(s, seat);
        const id = GR.elect.ideal(pr, 'I', pol) * 0.6 + GR.elect.ideal(pr, p.party, pol) * 0.4;
        v += (Math.abs(id - GR.optScore(pol, b.from, lvl)) - Math.abs(id - GR.optScore(pol, b.to, lvl))) * 0.5;
      }
    }
    // Party whip: leadership backs bills its party sponsored.
    const sp = s.pols[b.spon];
    if (sp) v += sp.party === p.party ? 0.55 : -0.35;
    if (p.traits && p.traits.includes('Bipartisan')) v += 0.2;
    // Relationships and respect for the player's bills.
    if (b.spon === 'me' || b.agenda) {
      v += rel(s, p.id) / 35 + ((s.pols.me.respect || 20) - 40) / 70;
      if (b.pledges[p.id]) v += 1.6;
    } else if (b.cos.includes('me')) v += rel(s, p.id) / 120;
    return v;
  }

  function execOf(s, jur) {
    const k = s.jur[jur].exec;
    return k && s.seats[k] ? s.pols[s.seats[k].holder] : null;
  }

  // Vote count in a body. Returns individual votes for home members and totals.
  function tally(s, b, bodyKey, noise = true) {
    const ms = W().members(s, bodyKey);
    const votes = {};
    let y = 0, n = 0;
    ms.forEach((p) => {
      if (p.isPlayer) return;
      const v = inclination(s, p, b, bodyKey) + (noise ? U.gauss() * 0.45 : 0);
      votes[p.id] = v > 0 ? 'y' : 'n';
      v > 0 ? y++ : n++;
    });
    if (isFed(bodyKey)) {
      // Members from other states, by party.
      const nat = bodyKey === 'ushouse' ? s.nat.house : s.nat.senate;
      ['D', 'R'].forEach((party) => {
        const pseudo = { party, fis: GR.PARTIES[party].base, soc: GR.PARTIES[party].base, sd: 'agg' + party, traits: [], id: 'agg' };
        const base = inclination(s, pseudo, b, bodyKey) + (b.spon === 'me' ? ((s.fedRel || {})[bodyKey] || 0) / 40 : 0);
        const frac = U.ncdf(base / 0.75);
        const yy = Math.round(nat[party] * frac);
        y += yy; n += nat[party] - yy;
      });
    }
    const me = s.pols.me;
    if (myBody(s) === bodyKey && b.my[bodyKey]) { if (b.my[bodyKey] === 'y') y++; else if (b.my[bodyKey] === 'n') n++; }
    return { y, n, votes };
  }

  // Projected support for a bill (the whip count).
  function whipCount(s, b, bodyKey) {
    const ms = W().members(s, bodyKey).filter((p) => !p.isPlayer);
    const rows = ms.map((p) => ({ id: p.id, v: inclination(s, p, b, bodyKey) })).map((r) => ({ ...r, lean: r.v > 0.6 ? 'Yes' : r.v > 0 ? 'Lean yes' : r.v > -0.6 ? 'Lean no' : 'No' }));
    const t = tally(s, b, bodyKey, false);
    return { rows, y: t.y + (b.my[bodyKey] === 'y' || (b.spon === 'me' && myBody(s) === bodyKey) ? (b.my[bodyKey] ? 0 : 1) : 0), n: t.n, total: t.y + t.n + (myBody(s) === bodyKey ? 1 : 0) };
  }

  // Advance bills one week.
  function billsWeek(s) {
    npcBills(s);
    ['school', 'city', 'state', 'nation'].forEach((jur) => {
      const J = s.jur[jur];
      (J.bills || []).forEach((b) => stepBill(s, J, b));
      J.bills = (J.bills || []).filter((b) => !(['law', 'dead', 'vetoed'].includes(b.stage) && s.week - (b.done || s.week) > 10));
    });
  }

  function leaderOf(s, bodyKey, post) { const B = s.bodies[bodyKey]; return B && B.lead[post] ? s.pols[B.lead[post]] : null; }

  function stepBill(s, J, b) {
    if (['law', 'dead', 'vetoed'].includes(b.stage)) return;
    if (s.week < b.due) return;
    // Another law may have changed this policy while the bill was pending.
    if (!b.budget && J.law[b.k] !== b.from) {
      if (J.law[b.k] === b.to) { kill(s, b, 'became moot when the law changed'); return; }
      const opts = GR.policyOpts(GR.POLICY[b.k], GR.lvlOf(b.jur));
      b.from = J.law[b.k];
      b.sub = `${opts[b.from]} → ${opts[b.to]}`;
    }
    const me = s.pols.me;
    const B = s.bodies[b.body];
    if (!B) { b.stage = 'dead'; return; }
    if (!inSession(s, b.body) && b.stage !== 'exec') { b.due = s.week + 1; return; }
    if (b.stage === 'committee') {
      const cm = B.comm[b.comm];
      const chair = cm && s.pols[cm.chair];
      if (chair && chair.isPlayer && !b.my.comm) { task(s, b, 'comm'); b.due = s.week + 1; return; }
      let adv;
      if (chair && chair.isPlayer) adv = b.my.comm === 'y';
      else if (b.budget) adv = true;
      else {
        const inc = chair ? inclination(s, chair, b, b.body) : 0.3;
        adv = inc + (b.spon === 'me' ? rel(s, chair && chair.id) / 40 : 0) + U.gauss() * 0.5 > -0.2;
      }
      if (!adv) { kill(s, b, `died in the ${committeeName(b)} committee`); return; }
      // Floor leaders decide what gets a vote.
      const lead = leaderOf(s, b.body, b.body === 'house' || b.body === 'ushouse' ? 'speaker' : b.body === 'school' || b.body === 'council' ? 'president' : 'majleader');
      if (lead && lead.isPlayer && !b.my.floor) { task(s, b, 'floor'); b.due = s.week + 1; return; }
      if (lead && lead.isPlayer && b.my.floor === 'n') { kill(s, b, 'was kept off the floor by leadership'); return; }
      if (lead && !lead.isPlayer && !b.budget && inclination(s, lead, b, b.body) + (b.spon === 'me' ? rel(s, lead.id) / 30 : 0) < -0.9 && U.chance(0.7)) { kill(s, b, 'was blocked from a floor vote by leadership'); return; }
      b.stage = 'floor';
      b.due = s.week + 1;
      if (myBody(s) === b.body) task(s, b, 'vote');
      return;
    }
    if (b.stage === 'floor') {
      if (myBody(s) === b.body && !b.my[b.body]) {
        // Missed vote: auto-vote with your inclination when auto-vote is on, otherwise abstain.
        b.my[b.body] = s.settings.autoVote ? (inclination(s, me, b, b.body) > 0 ? 'y' : 'n') : 'a';
        if (b.my[b.body] === 'a') { addRespect(s, -0.3); }
        recordVote(s, b, b.body, b.my[b.body]);
      }
      const t = tally(s, b, b.body);
      const pass = t.y > t.n;
      b.votes.push({ body: b.body, y: t.y, n: t.n, pass, w: s.week, ind: myBody(s) === b.body ? t.votes : null });
      clearTask(s, b);
      if (!pass) { kill(s, b, `failed in the ${GR.BODIES[b.body].name} ${t.y}-${t.n}`); return; }
      const bs = bodiesOf(s, b.jur);
      const next = bs[bs.indexOf(b.body) + 1];
      if (next) {
        b.body = next;
        b.stage = 'committee';
        b.comm = b.budget ? committeeFor(s, next, 'Budget') : committeeFor(s, next, GR.POLICY[b.k].cat);
        b.due = s.week + 1;
        return;
      }
      b.stage = 'exec';
      b.due = s.week + 1;
      const ex = execOf(s, b.jur);
      if (ex && ex.isPlayer) task(s, b, 'sign');
      return;
    }
    if (b.stage === 'exec') {
      const ex = execOf(s, b.jur);
      let sign;
      if (!ex) sign = true;
      else if (ex.isPlayer) {
        if (!b.my.sign) { b.my.sign = 'y'; GR.sim.news(s, `The ${b.title} became law without your signature.`, 'gov'); }
        sign = b.my.sign === 'y';
      } else if (b.budget) sign = U.chance(0.93);
      else sign = inclination(s, ex, b, null) + U.gauss() * 0.4 > -0.3;
      clearTask(s, b);
      if (sign) { enact(s, b); return; }
      // Veto: override needs two-thirds in every chamber.
      const over = bodiesOf(s, b.jur).every((bk) => { const t = tally(s, b, bk); return t.y >= (t.y + t.n) * 2 / 3; });
      if (over) { b.override = true; enact(s, b); GR.sim.news(s, `Veto overridden: the ${b.title} becomes law.`, 'gov'); return; }
      b.stage = 'vetoed';
      b.done = s.week;
      GR.sim.news(s, `${ex ? W().fullName(ex) : 'The executive'} vetoed the ${b.title}.`, 'gov');
      if (b.spon === 'me') GR.sim.msgInbox(s, 'Your bill was vetoed', `${W().fullName(ex)} vetoed your ${b.title}. Override votes fell short.`);
    }
  }

  const committeeName = (b) => {
    const jur = GR.BODIES[b.body].jur;
    const list = GR.COMMITTEES[jur === 'school' ? 'school' : jur === 'city' ? 'city' : jur];
    const c = list.find((x) => x.k === b.comm);
    return c ? c.name : 'committee';
  };

  function kill(s, b, why) {
    b.stage = 'dead';
    b.why = why;
    b.done = s.week;
    clearTask(s, b);
    if (b.spon === 'me') {
      GR.sim.msgInbox(s, 'Your bill failed', `Your ${b.title} ${why}.`);
      addRespect(s, -1);
    }
  }

  function enact(s, b) {
    const J = s.jur[b.jur];
    b.stage = 'law';
    b.done = s.week;
    if (b.budget) {
      Object.assign(J.budget.mult, b.budget.mult);
      Object.assign(J.budget.revMult, b.budget.revMult || {});
      J.budget.passed = U.yearOf(s.week);
      J.laws.unshift({ w: s.week, t: `${U.yearOf(s.week)} budget enacted`, spon: b.spon });
      GR.sim.news(s, `${J.name}: the ${U.yearOf(s.week)} budget is law.`, 'gov');
    } else {
      J.law[b.k] = b.to;
      J.laws.unshift({ w: s.week, t: `${b.title}: ${b.sub}`, spon: b.spon });
      GR.sim.news(s, `New law in ${J.name}: ${GR.POLICY[b.k].name} is now "${GR.policyOpts(GR.POLICY[b.k], GR.lvlOf(b.jur))[b.to]}".`, 'gov');
    }
    if (J.laws.length > 60) J.laws.pop();
    if (b.spon === 'me') {
      s.stats.billsPassed++;
      addRespect(s, 3);
      s.pols.me.pp += 15;
      GR.sim.log(s, `Your ${b.title} became law (${b.sub}).`);
      GR.sim.msgInbox(s, 'Your bill is law!', `The ${b.title} was signed into law. ${b.sub}.`);
    }
  }

  // Votes on others' bills shape relationships and approval back home.
  function recordVote(s, b, bodyKey, v) {
    const me = s.pols.me;
    s.stats.votesCast++;
    const sp = s.pols[b.spon];
    if (sp && b.spon !== 'me') addRel(s, b.spon, v === 'y' ? 6 : v === 'n' ? -6 : -1);
    // Deals.
    (s.deals || []).forEach((d) => {
      if (d.bill === b.id && d.mine === 'vote') {
        if (v === 'y') { d.kept = true; addRel(s, d.who, 8); addRespect(s, 1); }
        else { d.broken = true; addRel(s, d.who, -40); addRespect(s, -8); GR.sim.msgInbox(s, 'You broke a deal', `${W().fullName(s.pols[d.who])} is furious that you went back on your word. Word gets around.`); }
      }
    });
    // Party loyalty.
    if (sp && !b.budget) {
      const withParty = (sp.party === me.party) === (v === 'y');
      me.standing = U.clamp(me.standing + (withParty ? 0.3 : -1.2) * (me.traits.includes('loyal') ? 1.4 : 1), 0, 100);
      W().members(s, bodyKey).forEach((p) => { if (p.party === me.party && !p.isPlayer) addRel(s, p.id, withParty ? 0.4 : -0.8); });
    }
    // Constituents.
    const seat = s.seats[me.seat];
    if (seat && !b.budget && v !== 'a') {
      const pr = W().seatProfile(s, seat);
      const pol = GR.POLICY[b.k];
      const lvl = GR.lvlOf(b.jur);
      const id = GR.elect.ideal(pr, 'I', pol) * 0.5 + GR.elect.ideal(pr, pr.lean > 0 ? 'R' : 'D', pol) * 0.5;
      const good = Math.abs(id - GR.optScore(pol, b.to, lvl)) < Math.abs(id - GR.optScore(pol, b.from, lvl));
      const agree = (v === 'y') === good;
      me.app = U.clamp(me.app + (agree ? 0.5 : -0.8) * pol.sal, 1, 99);
      s.voteLog = s.voteLog || [];
      s.voteLog.unshift({ w: s.week, t: b.title, sub: b.sub, v, agree });
      if (s.voteLog.length > 80) s.voteLog.pop();
    }
  }

  function task(s, b, kind) { b.task = kind; }
  function clearTask(s, b) { b.task = null; }

  // Player's open tasks (the checkbox count).
  function tasks(s) {
    const out = [];
    ['school', 'city', 'state', 'nation'].forEach((jur) => (s.jur[jur].bills || []).forEach((b) => {
      if (b.task === 'vote' && myBody(s) === b.body && !b.my[b.body]) out.push({ b, kind: 'vote' });
      else if (b.task === 'comm' && !b.my.comm) out.push({ b, kind: 'comm' });
      else if (b.task === 'floor' && !b.my.floor) out.push({ b, kind: 'floor' });
      else if (b.task === 'sign' && !b.my.sign) out.push({ b, kind: 'sign' });
    }));
    return out;
  }

  // Player decisions on bills.
  function decide(s, billId, kind, v) {
    const b = findBill(s, billId);
    if (!b) return { ok: false };
    if (kind === 'vote') { b.my[b.body] = v; recordVote(s, b, b.body, v); }
    else if (kind === 'comm') { b.my.comm = v; if (b.spon !== 'me') addRel(s, b.spon, v === 'y' ? 8 : -10); }
    else if (kind === 'floor') { b.my.floor = v; if (b.spon !== 'me') addRel(s, b.spon, v === 'y' ? 6 : -12); }
    else if (kind === 'sign') {
      b.my.sign = v;
      const ex = s.pols.me;
      const seat = s.seats[ex.seat];
      if (seat && !b.budget) {
        const pr = W().seatProfile(s, seat);
        const pol = GR.POLICY[b.k];
        const lvl = GR.lvlOf(b.jur);
        const id = GR.elect.ideal(pr, 'I', pol);
        const good = Math.abs(id - GR.optScore(pol, b.to, lvl)) < Math.abs(id - GR.optScore(pol, b.from, lvl));
        ex.app = U.clamp(ex.app + ((v === 'y') === good ? 0.8 : -1.2) * pol.sal, 1, 99);
      }
      if (b.spon !== 'me') addRel(s, b.spon, v === 'y' ? 10 : -15);
    }
    return { ok: true };
  }

  function findBill(s, id) {
    for (const jur of ['school', 'city', 'state', 'nation']) { const b = (s.jur[jur].bills || []).find((x) => x.id === id); if (b) return b; }
    return null;
  }

  // Cost in political points to introduce a bill.
  function billCost(s, jur, k, to) {
    const J = s.jur[jur];
    const steps = Math.abs(to - J.law[k]);
    const lvl = s.pols.me.seat ? GR.OFFICES[s.seats[s.pols.me.seat].off].level : 1;
    let c = (10 + steps * steps * 8) * (0.6 + lvl * 0.4);
    if (s.pols.me.traits.includes('wonk')) c *= 0.7;
    return Math.round(c);
  }

  // Player writes a bill (legislators) or sends an agenda bill (executives).
  function writeBill(s, k, to) {
    const me = s.pols.me;
    const jur = myJur(s);
    if (!jur) return { ok: false, msg: 'You need to hold office to write laws.' };
    const pol = GR.POLICY[k];
    if (!pol.lv.includes(GR.lvlOf(jur))) return { ok: false, msg: 'That issue is not handled at this level of government.' };
    const J = s.jur[jur];
    if (J.law[k] === to) return { ok: false, msg: 'That is already the law.' };
    if ((J.bills || []).some((b) => b.k === k && !['law', 'dead', 'vetoed'].includes(b.stage))) return { ok: false, msg: 'A bill on this issue is already moving.' };
    const cost = billCost(s, jur, k, to);
    if (me.pp < cost) return { ok: false, msg: `You need ${cost} political points.` };
    if (s.hoursLeft < 6) return { ok: false, msg: 'Drafting a bill takes 6 hours.' };
    const isExec = GR.OFFICES[s.seats[me.seat].off].exec;
    if (!bodiesOf(s, jur).length) return { ok: false, msg: 'There is no legislature here.' };
    me.pp -= cost;
    s.hoursLeft -= 6;
    const b = policyBill(s, jur, k, to, 'me');
    if (isExec) b.agenda = true;
    const steps = Math.abs(to - J.law[k]);
    b.title = (isExec ? 'The ' + (s.pols.me.ln) + ' ' : '') + pol.name + (steps > 1 ? ' Reform Act' : ' Act');
    J.bills = J.bills || [];
    J.bills.push(b);
    s.stats.billsWritten++;
    me.sk.policy = U.clamp(me.sk.policy + (U.chance(0.4) ? 1 : 0), 0, 99);
    return { ok: true, msg: `Introduced the ${b.title}. It goes to the ${committeeName(b)} committee.` };
  }

  // Ask a colleague to commit to your bill.
  function askPledge(s, billId, pid) {
    const b = findBill(s, billId);
    const p = s.pols[pid];
    if (!b || !p) return { ok: false };
    if (s.hoursLeft < 1) return { ok: false, msg: 'No hours left this week.' };
    s.hoursLeft -= 1;
    const v = inclination(s, p, Object.assign({}, b, { pledges: {} }), b.body);
    const pr = U.clamp(0.5 + v * 0.3 + rel(s, pid) / 150, 0.03, 0.95);
    if (U.chance(pr)) { b.pledges[pid] = true; addRel(s, pid, 1); return { ok: true, msg: `${W().fullName(p)} pledged to vote yes.` }; }
    // Offer a trade instead.
    if (U.chance(0.45)) {
      const theirs = allBills(s).find((x) => x.spon === pid && ['committee', 'floor'].includes(x.stage) && x.body === myBody(s));
      if (theirs) {
        s.offer = { bill: b.id, who: pid, theirs: theirs.id, w: s.week };
        return { ok: true, msg: `${W().fullName(p)} will back your bill if you vote for their ${theirs.title}. (See Office → Legislation to accept.)` };
      }
    }
    addRel(s, pid, -1);
    return { ok: true, msg: `${W().fullName(p)} would not commit.` };
  }

  function acceptTrade(s) {
    const o = s.offer;
    if (!o) return { ok: false };
    const b = findBill(s, o.bill);
    if (b) b.pledges[o.who] = true;
    s.deals = s.deals || [];
    s.deals.push({ who: o.who, bill: o.theirs, mine: 'vote', w: s.week });
    s.offer = null;
    addRel(s, o.who, 5);
    return { ok: true, msg: 'Deal struck. Keep your word on their bill.' };
  }

  const allBills = (s) => ['school', 'city', 'state', 'nation'].flatMap((j) => s.jur[j].bills || []);

  function cosponsor(s, billId) {
    const b = findBill(s, billId);
    if (!b || b.cos.includes('me') || b.spon === 'me') return { ok: false };
    b.cos.push('me');
    addRel(s, b.spon, 7);
    return { ok: true, msg: `You co-sponsored the ${b.title}.` };
  }

  // ---------- Office activities (hours) ----------
  const OFFICE_ACTS = {
    coffee: { name: 'Coffee with a colleague', h: 2, desc: 'Build a relationship one-on-one.', who: true },
    caucus: { name: 'Attend caucus meeting', h: 3, desc: 'Better relationships with your party and party standing.' },
    bipartisan: { name: 'Bipartisan dinner', h: 3, desc: 'Get to know members across the aisle.' },
    committee: { name: 'Committee work', h: 4, desc: 'Earn respect and influence on your committee.' },
    speech: { name: 'Floor speech', h: 2, desc: 'Respect, name recognition and debate practice.' },
    constituents: { name: 'Constituent services', h: 4, desc: 'Help people back home. Raises approval.' },
    townhall: { name: 'District town hall', h: 3, desc: 'Approval and name recognition, with some risk.' },
    press: { name: 'Press conference', h: 2, desc: 'Get your name in the news.' },
    lobby: { name: 'Meet with lobbyists', h: 3, desc: 'Money for your war chest. Ethics watchdogs notice.' },
    donors: { name: 'Fundraise for re-election', h: 4, desc: 'Build your war chest between campaigns.' },
    help: { name: 'Campaign for a colleague', h: 4, desc: 'Big relationship boost, needs an election year.', who: true },
  };

  function officeAct(s, k, pid) {
    const a = OFFICE_ACTS[k];
    const me = s.pols.me;
    if (!a) return { ok: false };
    if (s.hoursLeft < a.h) return { ok: false, msg: 'Not enough hours left this week.' };
    const seat = me.seat && s.seats[me.seat];
    const bk = myBody(s);
    const ch = me.sk.charisma / 100;
    let msg = '';
    switch (k) {
      case 'coffee': {
        const p = s.pols[pid];
        if (!p) return { ok: false, msg: 'Pick a colleague.' };
        const d = 6 + ch * 10 + (p.party === me.party ? 2 : 0) + (me.traits.includes('charismatic') ? 2 : 0);
        addRel(s, pid, d);
        if (isFed(bk)) s.fedRel[bk] = U.clamp((s.fedRel[bk] || 0) + 0.6, -50, 60);
        msg = `Coffee with ${W().fullName(p)} went well (+${Math.round(d)} relationship).`;
        break;
      }
      case 'caucus': {
        const ms = bk ? W().members(s, bk).filter((p) => p.party === me.party && !p.isPlayer) : [];
        ms.forEach((p) => addRel(s, p.id, 1.5 + ch * 2));
        me.standing = U.clamp(me.standing + 2 * (me.traits.includes('loyal') ? 1.4 : 1), 0, 100);
        if (isFed(bk)) s.fedRel[bk] = U.clamp((s.fedRel[bk] || 0) + 1.5, -50, 60);
        me.pp += 2;
        msg = 'Caucus colleagues appreciated your presence.';
        break;
      }
      case 'bipartisan': {
        const ms = bk ? W().members(s, bk).filter((p) => p.party !== me.party) : [];
        ms.forEach((p) => addRel(s, p.id, 1.5 + ch * 2));
        me.standing = U.clamp(me.standing - 0.5, 0, 100);
        msg = 'You made friends across the aisle.';
        break;
      }
      case 'committee': {
        addRespect(s, 0.8 + me.sk.policy / 100);
        me.infl = U.clamp((me.infl || 0) + 1.2, 0, 100);
        me.sk.policy = U.clamp(me.sk.policy + (U.chance(0.2) ? 1 : 0), 0, 99);
        const B = bk && s.bodies[bk];
        if (B && me.comm && B.comm[me.comm]) B.comm[me.comm].members.forEach((id) => addRel(s, id, 1.5));
        me.pp += 3;
        msg = 'Your committee work is getting noticed.';
        break;
      }
      case 'speech': {
        const good = U.chance(0.55 + me.sk.debate / 250);
        addRespect(s, good ? 1 : -0.3);
        bumpRec(s, seat, good ? 1.2 : 0.4);
        me.sk.debate = U.clamp(me.sk.debate + (U.chance(0.25) ? 1 : 0), 0, 99);
        msg = good ? 'Your floor speech was well received.' : 'Your floor speech fell flat.';
        break;
      }
      case 'constituents': {
        me.app = U.clamp(me.app + 1.4 * Math.max(0.1, (90 - me.app) / 40), 1, 99);
        bumpRec(s, seat, 0.3);
        msg = 'Your office helped dozens of constituents this week.';
        break;
      }
      case 'townhall': {
        const good = U.chance(0.62 + me.sk.debate / 300);
        me.app = U.clamp(me.app + (good ? 1.8 * Math.max(0.1, (90 - me.app) / 40) : -1.5), 1, 99);
        bumpRec(s, seat, 0.8);
        msg = good ? 'The town hall went well.' : 'Angry constituents dominated your town hall.';
        break;
      }
      case 'press': {
        bumpRec(s, seat, 1 + ch);
        me.pp += 1;
        msg = 'Your press conference made the evening news.';
        break;
      }
      case 'lobby': {
        const amt = Math.round(GR.elect.scale(s, seat) * 0.03 * (0.6 + U.rand()));
        me.warChest += amt;
        me.integrity = U.clamp((me.integrity || 70) - 2, 0, 100);
        me.pp += 2;
        if (U.chance(0.04)) GR.events.fire(s, 'ethics');
        msg = `Lobbyists' PACs gave ${U.money(amt)} to your war chest.`;
        break;
      }
      case 'donors': {
        const amt = Math.round(GR.elect.scale(s, seat) * 0.018 * (0.5 + me.sk.fund / 100) * (1 + me.network / 60) * (me.traits.includes('rainmaker') ? 1.2 : 1));
        me.warChest += amt;
        msg = `Raised ${U.money(amt)} for your war chest.`;
        break;
      }
      case 'help': {
        const p = s.pols[pid];
        if (!p || !p.running) return { ok: false, msg: 'They are not on the ballot this year.' };
        addRel(s, pid, 15 + ch * 10);
        me.standing = U.clamp(me.standing + 1, 0, 100);
        const r = (s.races[U.yearOf(s.week)] || []).find((x) => x.id === p.running);
        if (r && r.cs[pid]) { r.cs[pid].rec = U.clamp(r.cs[pid].rec + 2, 0, 99); r.cs[pid].enth[p.party] += 1.5; }
        msg = `You campaigned for ${W().fullName(p)}. They will remember it.`;
        break;
      }
    }
    s.hoursLeft -= a.h;
    return { ok: true, msg };
  }

  // Give from your war chest to a colleague's campaign.
  function donate(s, pid, amt) {
    const me = s.pols.me;
    const p = s.pols[pid];
    if (!p || me.warChest < amt) return { ok: false, msg: 'Not enough in your war chest.' };
    me.warChest -= amt;
    const sc = p.seat ? GR.elect.scale(s, s.seats[p.seat]) : 50000;
    addRel(s, pid, U.clamp((amt / sc) * 120, 2, 30));
    me.pp += Math.round(amt / sc * 20);
    return { ok: true, msg: `${W().fullName(p)} thanks you for the contribution.` };
  }

  function bumpRec(s, seat, v) {
    const me = s.pols.me;
    if (!seat) return;
    const t = GR.OFFICES[seat.off].tier;
    const pr = W().seatProfile(s, seat);
    const k = U.clamp(Math.sqrt(150000 / Math.max(5000, pr.pop)), 0.15, 2.5);
    if (t === 'national') me.recNat = U.clamp(me.recNat + v * 0.4, 0, 100);
    else if (t === 'state') me.recState = U.clamp(me.recState + v * k, 0, 100);
    else me.recLocal = U.clamp(me.recLocal + v * k, 0, 100);
  }

  // ---------- Leadership ----------
  function posts(s, bodyKey) {
    const B = s.bodies[bodyKey];
    const maj = W().majority(s, bodyKey);
    return GR.LEADERSHIP[bodyKey].map((p) => ({ ...p, party: p.side === 'maj' ? maj : p.side === 'min' ? GR.other(maj) : null, holder: B.lead[p.k] ? s.pols[B.lead[p.k]] : null }));
  }

  // Leadership races happen when a chamber organizes (January after its elections).
  const leadWindowOpen = (s, bodyKey) => {
    const mo = U.monthOf(s.week);
    const y = U.yearOf(s.week);
    const elect = isFed(bodyKey) || bodyKey === 'house' || bodyKey === 'senate' ? y % 2 === 0 : y % 2 === 1;
    return elect && (mo === 10 || mo === 11) && s.week > GR.elect.generalWeek(y);
  };

  function canSeek(s, bodyKey, postK) {
    const me = s.pols.me;
    if (myBody(s) !== bodyKey) return { ok: false, why: 'Not your chamber.' };
    const post = GR.LEADERSHIP[bodyKey].find((p) => p.k === postK);
    const terms = me.terms[BODY_OFF[bodyKey]] || 0;
    if (terms < post.sen) return { ok: false, why: `Needs ${post.sen} term${post.sen === 1 ? '' : 's'} of seniority (you have ${terms}).` };
    const maj = W().majority(s, bodyKey);
    if (post.side === 'maj' && me.party !== maj) return { ok: false, why: 'Only the majority party holds this post.' };
    if (post.side === 'min' && me.party === maj) return { ok: false, why: 'Only the minority party holds this post.' };
    if (!leadWindowOpen(s, bodyKey)) return { ok: false, why: 'Leadership elections are held after the November election, before the new session.' };
    const cost = Math.round((15 + post.rank * 20) * (0.6 + GR.OFFICES[BODY_OFF[bodyKey]].level * 0.4));
    if (me.pp < cost) return { ok: false, why: `Costs ${cost} political points to run.` };
    return { ok: true, cost };
  }

  function seek(s, bodyKey, postK) {
    const c = canSeek(s, bodyKey, postK);
    if (!c.ok) return { ok: false, msg: c.why };
    s.pols.me.pp -= c.cost;
    s.leadBid = { body: bodyKey, post: postK, w: s.week };
    return { ok: true, msg: 'You are running. Work the caucus: relationships decide leadership elections.' };
  }

  // Rival for a post: its holder or the next person up the ladder.
  function rivalFor(s, bodyKey, postK, party) {
    const B = s.bodies[bodyKey];
    const h = B.lead[postK] && s.pols[B.lead[postK]];
    if (h && !h.isPlayer && h.party === party && h.seat) return h;
    if (h && !h.isPlayer && isFed(bodyKey) && h.party === party) return h;
    const post = GR.LEADERSHIP[bodyKey].find((p) => p.k === postK);
    const lower = GR.LEADERSHIP[bodyKey].filter((p) => p.rank < post.rank).sort((a, b) => b.rank - a.rank);
    for (const l of lower) { const x = B.lead[l.k] && s.pols[B.lead[l.k]]; if (x && !x.isPlayer && x.party === party) return x; }
    if (isFed(bodyKey)) return W().extMember(s, party, bodyKey);
    const pool = W().members(s, bodyKey).filter((m) => m.party === party && !m.isPlayer && !m.lead).sort((a, b) => (b.terms[BODY_OFF[bodyKey]] || 0) - (a.terms[BODY_OFF[bodyKey]] || 0));
    return pool[0] || null;
  }

  // How the caucus would vote today: each member weighs you against the rival.
  function leadCount(s, bodyKey, postK) {
    const me = s.pols.me;
    const party = me.party;
    const rival = rivalFor(s, bodyKey, postK, party);
    const post = GR.LEADERSHIP[bodyKey].find((p) => p.k === postK);
    const voters = W().members(s, bodyKey).filter((m) => (post.side === 'any' ? true : m.party === party) && !m.isPlayer && m !== rival);
    const ma = W().axes(me);
    const rows = voters.map((v) => {
      const va = W().axes(v);
      const ra = rival ? W().axes(rival) : { fis: 0, soc: 0 };
      const dMe = Math.abs((va.fis + va.soc) - (ma.fis + ma.soc)) / 2;
      const dR = Math.abs((va.fis + va.soc) - (ra.fis + ra.soc)) / 2;
      let x = rel(s, v.id) / 22 + ((me.respect || 20) - 45) / 25 + (dR - dMe) * 0.9 + ((me.standing || 30) - 50) / 60;
      x -= rival ? ((rival.infl || 30) - 40) / 45 + (rival.lead ? 0.6 : 0) + (v.ties || 0) * 0 : -2;
      if (me.traits.includes('loyal')) x += 0.25;
      if (me.traits.includes('maverick')) x -= 0.3;
      return { id: v.id, x, lean: x > 0.5 ? 'You' : x > 0 ? 'Leans you' : x > -0.5 ? 'Leans rival' : 'Rival' };
    });
    let ext = null;
    if (isFed(bodyKey)) {
      const nat = bodyKey === 'ushouse' ? s.nat.house : s.nat.senate;
      const total = (post.side === 'any' ? nat.D + nat.R : nat[party]);
      const f = U.ncdf((((s.fedRel || {})[bodyKey] || 0) / 15 + ((me.respect || 20) - 50) / 22 + (me.recNat - 30) / 40 + ((me.standing || 30) - 55) / 30 - ((rival && rival.infl) || 40) / 60) / 1.0);
      ext = { you: Math.round(total * f), them: total - Math.round(total * f) };
    }
    const you = rows.filter((r) => r.x > 0).length + (ext ? ext.you : 0) + 1;
    const them = rows.length - rows.filter((r) => r.x > 0).length + (ext ? ext.them : 0) + (rival ? 1 : 0);
    return { rival, rows, you, them, ext };
  }

  // Organize a chamber: committees, chairs and leadership (with the player's bid).
  function organize(s, bodyKey) {
    const B = s.bodies[bodyKey];
    if (!B) return;
    const maj = W().majority(s, bodyKey);
    const prevMaj = B.maj;
    B.maj = maj;
    const me = s.pols.me;
    // Leaders who left the chamber, or are now on the wrong side, step aside.
    GR.LEADERSHIP[bodyKey].forEach((post) => {
      const id = B.lead[post.k];
      const p = id && s.pols[id];
      const party = post.side === 'maj' ? maj : post.side === 'min' ? GR.other(maj) : null;
      const gone = !p || (!isFed(bodyKey) && (!p.seat || BODY_OFF[bodyKey] !== s.seats[p.seat].off)) || (p.isPlayer && (!p.seat || myBody(s) !== bodyKey));
      if (gone || (party && p.party !== party)) {
        if (p && party && p.party !== party && prevMaj && prevMaj !== maj) {
          // Majority flipped: leaders swap to the matching minority/majority post.
          const swap = post.k.replace(/^maj/, 'MIN').replace(/^min/, 'maj').replace(/^MIN/, 'min');
          const swapK = post.k === 'speaker' || post.k === 'protem' ? 'minleader' : swap;
          if (GR.LEADERSHIP[bodyKey].some((x) => x.k === swapK) && !B.lead[swapK]) { B.lead[swapK] = p.id; p.lead = { body: bodyKey, post: swapK }; }
        }
        if (B.lead[post.k] === id) delete B.lead[post.k];
        if (p && p.lead && p.lead.post === post.k) p.lead = null;
      }
    });
    // Player's bid.
    if (s.leadBid && s.leadBid.body === bodyKey) {
      const bid = s.leadBid;
      s.leadBid = null;
      const c = leadCount(s, bodyKey, bid.post);
      const swing = U.gauss() * Math.max(1, (c.you + c.them) * 0.04);
      const win = c.you + swing > c.them;
      const post = GR.LEADERSHIP[bodyKey].find((p) => p.k === bid.post);
      const you = Math.max(0, Math.round(c.you + swing)), them = Math.max(0, c.you + c.them - you);
      if (win) {
        if (me.lead && s.bodies[me.lead.body]) delete s.bodies[me.lead.body].lead[me.lead.post];
        const old = B.lead[bid.post] && s.pols[B.lead[bid.post]];
        if (old) { old.lead = null; addRel(s, old.id, -25); }
        B.lead[bid.post] = 'me';
        me.lead = { body: bodyKey, post: bid.post };
        addRespect(s, 6);
        me.pp += 20;
        GR.sim.log(s, `Elected ${post.name} of the ${GR.BODIES[bodyKey].name}, ${you}-${them}.`);
        GR.sim.msgInbox(s, `You are the new ${post.name}!`, `Your colleagues elected you ${post.name}, ${you} votes to ${them}. Relationships paid off.`);
        GR.sim.news(s, `${me.fn} ${me.ln} elected ${post.name} of the ${GR.BODIES[bodyKey].name}.`, 'gov');
      } else {
        if (c.rival) addRel(s, c.rival.id, -10);
        addRespect(s, -2);
        GR.sim.msgInbox(s, `Leadership bid fell short`, `You lost the race for ${post.name}, ${you}-${them}${c.rival ? ' to ' + W().fullName(c.rival) : ''}. Build more relationships and try again.`);
        GR.sim.log(s, `Lost the race for ${post.name}, ${you}-${them}.`);
      }
    }
    // Fill empty posts by promotion.
    GR.LEADERSHIP[bodyKey].slice().sort((a, b) => b.rank - a.rank).forEach((post) => {
      if (B.lead[post.k]) return;
      const party = post.side === 'maj' ? maj : post.side === 'min' ? GR.other(maj) : maj;
      let p = null;
      const lower = GR.LEADERSHIP[bodyKey].filter((x) => x.rank < post.rank && (x.side === post.side)).sort((a, b) => b.rank - a.rank);
      for (const l of lower) { const x = B.lead[l.k] && s.pols[B.lead[l.k]]; if (x && !x.isPlayer && x.party === party) { p = x; delete B.lead[l.k]; break; } }
      if (!p) {
        if (isFed(bodyKey)) p = W().extMember(s, party, bodyKey);
        else p = W().members(s, bodyKey).filter((m) => m.party === party && !m.isPlayer && !m.lead).sort((a, b) => (b.terms[BODY_OFF[bodyKey]] || 0) + b.infl / 25 - (a.terms[BODY_OFF[bodyKey]] || 0) - a.infl / 25)[0];
      }
      if (p) { B.lead[post.k] = p.id; p.lead = { body: bodyKey, post: post.k }; }
    });
    // Second pass for any posts emptied by promotion.
    GR.LEADERSHIP[bodyKey].forEach((post) => {
      if (B.lead[post.k]) return;
      const party = post.side === 'min' ? GR.other(maj) : maj;
      const p = isFed(bodyKey) ? W().extMember(s, party, bodyKey) : W().members(s, bodyKey).filter((m) => m.party === party && !m.isPlayer && !m.lead)[0];
      if (p) { B.lead[post.k] = p.id; p.lead = { body: bodyKey, post: post.k }; }
    });
    // Committees: assign newcomers, pick chairs by seniority in the majority.
    const ms = W().members(s, bodyKey);
    Object.keys(B.comm).forEach((k) => { B.comm[k].members = B.comm[k].members.filter((id) => ms.some((m) => m.id === id)); });
    ms.forEach((m) => {
      if (Object.values(B.comm).some((c) => c.members.includes(m.id))) return;
      let k = m.isPlayer && s.commPref && B.comm[s.commPref] ? s.commPref : U.pick(Object.keys(B.comm));
      B.comm[k].members.push(m.id);
      m.comm = k;
    });
    Object.keys(B.comm).forEach((k) => {
      const pool = B.comm[k].members.map((id) => s.pols[id]).filter((m) => m && m.party === maj).sort((a, b) => (b.terms[BODY_OFF[bodyKey]] || 0) * 10 + (b.isPlayer ? (b.respect || 0) / 10 : b.infl / 10) - ((a.terms[BODY_OFF[bodyKey]] || 0) * 10 + (a.isPlayer ? (a.respect || 0) / 10 : a.infl / 10)));
      const prev = B.comm[k].chair;
      B.comm[k].chair = pool[0] ? pool[0].id : null;
      if (B.comm[k].chair === 'me' && prev !== 'me') GR.sim.msgInbox(s, 'Committee chair', `Seniority has made you chair of the ${(GR.COMMITTEES[GR.BODIES[bodyKey].jur === 'school' ? 'school' : GR.BODIES[bodyKey].jur === 'city' ? 'city' : GR.BODIES[bodyKey].jur].find((c) => c.k === k) || {}).name} committee. Bills in your committee move only if you advance them.`);
    });
  }

  // Ask to switch committees (takes effect immediately at a cost).
  function requestCommittee(s, k) {
    const bk = myBody(s);
    const B = bk && s.bodies[bk];
    const me = s.pols.me;
    if (!B || !B.comm[k]) return { ok: false };
    const cost = 25;
    if (me.pp < cost) return { ok: false, msg: `Costs ${cost} political points.` };
    const lead = leaderOf(s, bk, bk === 'house' || bk === 'ushouse' ? 'speaker' : bk === 'school' || bk === 'council' ? 'president' : 'majleader');
    const p = lead && !lead.isPlayer ? U.clamp(0.45 + rel(s, lead.id) / 100 + ((me.respect || 20) - 30) / 150 + (lead.party === me.party ? 0.15 : -0.1), 0.05, 0.95) : 1;
    me.pp -= cost;
    if (!U.chance(p)) return { ok: true, msg: 'Leadership turned down your request.' };
    Object.values(B.comm).forEach((c) => { c.members = c.members.filter((id) => id !== 'me'); if (c.chair === 'me') c.chair = null; });
    B.comm[k].members.push('me');
    me.comm = k;
    s.commPref = k;
    return { ok: true, msg: 'Committee assignment approved.' };
  }

  // ---------- Budgets ----------
  const BUDGET_WEEK = { nation: 6, state: 5, city: 18, school: 16 };

  function budgetWeek(s) {
    const woy = s.week - U.weekOfMD(U.yearOf(s.week), 0, 1);
    ['school', 'city', 'state', 'nation'].forEach((jur) => {
      if (woy !== BUDGET_WEEK[jur]) return;
      if (!bodiesOf(s, jur).length) return;
      const ex = execOf(s, jur);
      if (ex && ex.isPlayer) {
        s.budgetDue = s.budgetDue || {};
        s.budgetDue[jur] = s.week + 3;
        GR.sim.msgInbox(s, 'Submit your budget', `Your ${U.yearOf(s.week)} budget for ${s.jur[jur].name} is due in 3 weeks. Open Office → Budget to set spending and taxes, then send it to the legislature.`);
        return;
      }
      submitBudget(s, jur, npcBudget(s, jur, ex), ex ? ex.id : null);
    });
    // Player missed the deadline: staff submit a status-quo budget.
    Object.entries(s.budgetDue || {}).forEach(([jur, due]) => {
      if (s.week >= due) { delete s.budgetDue[jur]; submitBudget(s, jur, { mult: Object.assign({}, s.jur[jur].budget.mult), revMult: Object.assign({}, s.jur[jur].budget.revMult) }, 'me'); }
    });
  }

  function npcBudget(s, jur, ex) {
    const J = s.jur[jur];
    const mult = Object.assign({}, J.budget.mult);
    const revMult = Object.assign({}, J.budget.revMult);
    const fis = ex ? W().axes(ex).fis : 0;
    Object.keys(mult).forEach((c) => {
      if (c === 'Interest on Debt') return;
      let d = 0.006 - fis * 0.012 + U.gauss() * 0.008;
      if (c === 'Military' || c === 'Police' || c === 'Public Safety') d += fis * 0.02;
      mult[c] = U.clamp(U.round(mult[c] * (1 + d), 3), 0.5, 2);
    });
    // Federal deficits: AI presidents trim spending and raise revenue when deficits balloon.
    if (jur === 'nation') {
      const t = W().totals(Object.assign({}, J, { budget: Object.assign({}, J.budget, { mult, revMult }) }));
      const gap = -t.bal / t.spend;
      if (gap > 0.22) {
        Object.keys(mult).forEach((c) => { if (c !== 'Interest on Debt') mult[c] = U.round(mult[c] * (1 - Math.min(0.04, gap * 0.08)), 3); });
        revMult.Other = U.round(revMult.Other * (1 + Math.min(0.15, gap * 0.25)), 3);
        revMult['Income Tax'] = U.round(revMult['Income Tax'] * (1 + Math.min(0.04, gap * 0.05)), 3);
      }
    }
    // Surpluses get spent or returned.
    if (jur !== 'nation') {
      const t = W().totals(Object.assign({}, J, { budget: Object.assign({}, J.budget, { mult, revMult }) }));
      if (t.bal > t.spend * 0.03) {
        if (fis > 0.3) { const key = jur === 'state' ? 'Sales Tax' : jur === 'city' ? 'Property Tax' : 'Local Levy'; revMult[key] = U.round(revMult[key] * (1 - (t.bal * 0.7) / (t.rv[key] || t.rev)), 3); }
        else { const f = 1 + (t.bal * 0.7) / t.spend; Object.keys(mult).forEach((c) => { mult[c] = U.round(mult[c] * f, 3); }); }
      }
    }
    // Balance rules for states, cities and schools.
    if (jur !== 'nation') {
      const t = W().totals(Object.assign({}, J, { budget: Object.assign({}, J.budget, { mult, revMult }) }));
      if (t.bal < 0) {
        const key = jur === 'state' ? 'Sales Tax' : jur === 'city' ? 'Property Tax' : 'Local Levy';
        const base = t.rv[key] || 1;
        const need = -t.bal * (fis > 0.5 ? 0.4 : 0.85);
        revMult[key] = U.round(revMult[key] * (1 + need / base), 3);
        if (fis > 0.5) { const f = 1 - (-t.bal * 0.6) / t.spend; Object.keys(mult).forEach((c) => { mult[c] = U.round(mult[c] * f, 3); }); }
      }
    }
    return { mult, revMult };
  }

  function submitBudget(s, jur, plan, spon) {
    const J = s.jur[jur];
    const old = W().totals(J);
    const nb = W().totals(Object.assign({}, J, { budget: Object.assign({}, J.budget, plan) }));
    const change = (nb.spend - old.spend) / old.spend;
    const taxUp = nb.rev > old.rev * 1.01;
    const b = {
      id: U.uid('b'), jur, budget: { mult: plan.mult, revMult: plan.revMult, change, taxUp }, title: `${U.yearOf(s.week)} ${J.name} Budget`, sub: `Spending ${change >= 0 ? '+' : ''}${(change * 100).toFixed(1)}%${taxUp ? ', tax increase' : ''}`,
      spon: spon || null, cos: [], stage: 'committee', body: bodiesOf(s, jur)[0], comm: committeeFor(s, bodiesOf(s, jur)[0], 'Budget'), w: s.week, due: s.week + 2, votes: [], my: {}, pledges: {},
    };
    if (spon === 'me') b.agenda = true;
    J.bills = J.bills || [];
    J.bills.push(b);
    return b;
  }

  // ---------- Executive orders ----------
  const EO_CATS = ['Immigration', 'Environment', 'Elections', 'Education', 'Justice', 'Health', 'Defense', 'Housing'];
  function execOrder(s, k, to) {
    const me = s.pols.me;
    const seat = me.seat && s.seats[me.seat];
    if (!seat || !GR.OFFICES[seat.off].exec) return { ok: false, msg: 'Only executives can issue orders.' };
    const jur = GR.OFFICES[seat.off].jur;
    const pol = GR.POLICY[k];
    const J = s.jur[jur];
    if (!EO_CATS.includes(pol.cat) || !pol.lv.includes(GR.lvlOf(jur))) return { ok: false, msg: 'Executive orders cannot change that.' };
    if (Math.abs(to - J.law[k]) !== 1) return { ok: false, msg: 'Orders can move a policy only one step.' };
    const cost = 30;
    if (me.pp < cost) return { ok: false, msg: `Costs ${cost} political points.` };
    if (s.hoursLeft < 4) return { ok: false, msg: 'Takes 4 hours.' };
    me.pp -= cost;
    s.hoursLeft -= 4;
    if (U.chance(0.18)) { me.pp += 5; return { ok: true, msg: 'A court blocked your executive order.' }; }
    const b = { jur, k, from: J.law[k], to, title: 'Executive Order', sub: '', spon: 'me' };
    J.law[k] = to;
    J.laws.unshift({ w: s.week, t: `Executive order: ${pol.name} → ${GR.policyOpts(pol, GR.lvlOf(jur))[to]}`, spon: 'me' });
    const pr = W().seatProfile(s, seat);
    const id = GR.elect.ideal(pr, 'I', pol);
    const good = Math.abs(id - GR.optScore(pol, b.to, GR.lvlOf(jur))) < Math.abs(id - GR.optScore(pol, b.from, GR.lvlOf(jur)));
    me.app = U.clamp(me.app + (good ? 1 : -1.5), 1, 99);
    return { ok: true, msg: `Executive order signed: ${pol.name} is now "${GR.policyOpts(pol, GR.lvlOf(jur))[to]}".` };
  }

  // ---------- Metrics ----------
  function metricsMonth(s) {
    const nat = s.nat;
    // National business cycle.
    const e = nat.econ;
    e.cycle = U.clamp(e.cycle * 0.92 + U.gauss() * 0.25 + (U.chance(0.006) ? -3 : 0), -5, 3);
    ['nation', 'state', 'city', 'school'].forEach((jur) => {
      const J = s.jur[jur];
      const t = target(s, J);
      Object.keys(t).forEach((k) => {
        const rate = k === 'growth' || k === 'unemp' ? 0.35 : 0.08;
        J.met[k] = J.met[k] + (t[k] - J.met[k]) * rate + (k === 'growth' ? U.gauss() * 0.08 : 0);
      });
    });
  }

  function target(s, J) {
    const lvl = GR.lvlOf(J.k);
    const m0 = J.met0;
    const t = Object.assign({}, m0);
    const pct = { income: 1, crime: 1, rent: 1, emis: 1 };
    const add = (k, v) => { if (t[k] == null) return; t[k] += pct[k] ? (m0[k] * v) / 100 : v; };
    GR.policiesFor(J.k).forEach((pol) => {
      const d = GR.optScore(pol, J.law[pol.k], lvl) - GR.optScore(pol, J.law0[pol.k], lvl);
      if (!d) return;
      Object.entries(pol.fx).forEach(([k, v]) => { if (k !== 'rev') add(k, v * d); });
    });
    const b = J.budget;
    const sp = (k) => (b.mult[k] || 1) - 1;
    if (J.k === 'nation') { add('uninsured', -sp('Health Care') * 8); add('poverty', -sp('Human Services') * 4 - sp('Social Security') * 3); add('growth', sp('Infrastructure') * 1.5); add('grad', sp('Education') * 3); add('crime', -sp('Security & Safety') * 8); }
    if (J.k === 'state') { add('grad', sp('K-12 Education') * 8); add('uninsured', -sp('Medicaid & Health') * 10); add('crime', -sp('Public Safety') * 15); add('poverty', -sp('Human Services') * 5); add('growth', sp('Transportation') * 1.2 + sp('Higher Education') * 0.8); }
    if (J.k === 'city') { add('crime', -sp('Police') * 20 - sp('Parks & Libraries') * 3); add('rent', -sp('Housing') * 6); add('growth', sp('Roads & Transit') * 0.8); }
    if (J.k === 'school') { add('grad', sp('Instruction') * 10 + sp('Student Support') * 5); }
    // Business cycle and debt drag.
    const cyc = s.nat.econ.cycle;
    t.growth = (t.growth || 2) + cyc;
    t.unemp = Math.max(2, (t.unemp || 4) - cyc * 0.55);
    t.poverty = Math.max(2, (t.poverty || 10) - cyc * 0.25);
    if (J.k !== 'nation') {
      // Local economies track the nation.
      t.growth += (s.jur.nation.met.growth - 2) * 0.5;
    }
    const tt = W().totals(J);
    if (tt.bal < 0 && J.k !== 'nation') t.growth -= Math.min(1, (-tt.bal / tt.spend) * 4);
    return t;
  }

  // Yearly snapshot and debt/reserves.
  function yearClose(s) {
    ['nation', 'state', 'city', 'school'].forEach((jur) => {
      const J = s.jur[jur];
      const t = W().totals(J);
      if (jur === 'nation') J.budget.debt = Math.max(0, J.budget.debt - t.bal);
      else { J.budget.reserve += t.bal; if (J.budget.reserve < 0) { J.budget.debt += -J.budget.reserve; J.budget.reserve = 0; } }
      J.hist.push({ y: U.yearOf(s.week) - 1, met: Object.assign({}, J.met), spend: t.sp, rev: t.rv, total: t.spend, revenue: t.rev, debt: J.budget.debt, pop: J.pop });
      if (J.hist.length > 40) J.hist.shift();
      J.pop = Math.round(J.pop * (1 + (jur === 'nation' ? 0.005 : 0.004 + (J.met.growth - 2) * 0.002)));
      if (J.k === 'school') J.students = Math.round(J.pop * 0.15);
      // Budgets grow with population and inflation.
      Object.keys(J.budget.base).forEach((c) => { J.budget.base[c] *= 1.028; });
      Object.keys(J.budget.revBase).forEach((c) => { J.budget.revBase[c] *= 1.03 + (J.met.growth - 2) * 0.004; });
    });
  }

  // ---------- Approval ----------
  function approvalMonth(s) {
    // Executives: judged on the economy, crime and budget.
    ['city', 'state', 'nation'].forEach((jur) => {
      const ex = execOf(s, jur);
      if (!ex) return;
      const J = s.jur[jur];
      const m = J.met, m0 = J.met0;
      let base = 50 + (m.growth - 2) * 3 - (m.unemp - m0.unemp) * 2.5 - ((m.crime - m0.crime) / m0.crime) * 30 - ((m.poverty - m0.poverty)) * 1.5;
      const seat = s.seats[J.exec];
      const pr = W().seatProfile(s, seat);
      const a = W().axes(ex);
      base -= Math.abs((a.fis + a.soc) / 2 - pr.lean / 18) * 4;
      if (jur === 'nation') base -= 4;
      ex.app = U.clamp(ex.app + (base - ex.app) * 0.12 + U.gauss() * 1.2, 15, 85);
    });
    // NPC legislators drift; the player's approval reflects fit with the district.
    Object.values(s.pols).forEach((p) => {
      if (!p.seat || p.isPlayer || GR.OFFICES[s.seats[p.seat] ? s.seats[p.seat].off : 'school'].exec) return;
      p.app = U.clamp(p.app + (52 - p.app) * 0.05 + U.gauss() * 1.5, 20, 85);
    });
    const me = s.pols.me;
    if (me.seat) {
      const seat = s.seats[me.seat];
      const pr = W().seatProfile(s, seat);
      const a = W().axes(me);
      let base = 52 - Math.abs((a.fis + a.soc) / 2 - pr.lean / 18) * 5 - (me.scandal || 0) * 0.8 + (me.respect || 20) * 0.05;
      if (GR.OFFICES[seat.off].exec) {
        const J = s.jur[GR.OFFICES[seat.off].jur];
        base += (J.met.growth - 2) * 3 - (J.met.unemp - J.met0.unemp) * 2.5 - ((J.met.crime - J.met0.crime) / J.met0.crime) * 30;
      }
      me.app = U.clamp(me.app + (base - me.app) * 0.15, 1, 99);
    }
  }

  // ---------- Weekly ----------
  function week(s) {
    s.fedRel = s.fedRel || {};
    billsWeek(s);
    budgetWeek(s);
    if (U.isMonthStart(s.week)) { metricsMonth(s); approvalMonth(s); }
    if (U.isYearStart(s.week)) yearClose(s);
    // Relationships slowly fade without contact.
    if (s.rel && s.week % 4 === 0) Object.keys(s.rel).forEach((k) => { s.rel[k] *= 0.985; if (Math.abs(s.rel[k]) < 0.5) delete s.rel[k]; });
    // Expire stale deals and offers.
    if (s.offer && s.week - s.offer.w > 3) s.offer = null;
    if (s.deals) s.deals = s.deals.filter((d) => !d.kept && !d.broken && s.week - d.w < 30);
  }

  return {
    JUR_BODIES, BODY_OFF, bodiesOf, isFed, rel, addRel, addRespect, relLabel, myBody, myJur, inSession, policyBill, inclination, tally, whipCount,
    billsWeek, tasks, decide, findBill, billCost, writeBill, askPledge, acceptTrade, cosponsor, allBills, OFFICE_ACTS, officeAct, donate, bumpRec,
    posts, leadWindowOpen, canSeek, seek, rivalFor, leadCount, organize, requestCommittee, BUDGET_WEEK, submitBudget, npcBudget, EO_CATS, execOrder,
    metricsMonth, target, yearClose, approvalMonth, week, execOf, committeeName, leaderOf,
  };
})();
