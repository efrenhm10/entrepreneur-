// Leadership fights and the whip. After each November election, open leadership posts (and
// sometimes a sitting leader) are contested. Candidates court you with something concrete: a
// better committee seat, a project in the next budget, a push for your bill, or money for your
// campaign. Back the winner and they deliver; back the loser and the winner remembers. When you
// run yourself, colleagues name their price. Through the session the whip calls before key
// votes when you're drifting from the party line, and leaders get tools of their own: whip
// operations and caucus meetings.
var GR = globalThis.GR || (globalThis.GR = {});

GR.lead = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const G = () => GR.gov;
  const L = () => GR.legis;
  const BODY_OFF = { school: 'school', council: 'council', house: 'statehouse', senate: 'statesenate', ushouse: 'ushouse', ussenate: 'ussenate' };
  const isFed = (bk) => bk === 'ushouse' || bk === 'ussenate';

  // What each post can do (shown on the Leadership screen).
  const POWERS = {
    speaker: 'Presides, refers bills to committee, and decides what reaches the floor. Can call up any bill.',
    protem: 'Leads the Senate: refers bills, appoints committees and decides what reaches the floor.',
    president: 'Runs the meetings, sets the agenda and appoints committee chairs.',
    majleader: 'Runs the floor schedule and the majority\'s legislative strategy. Can call up any bill.',
    minleader: 'Leads the minority: negotiates with the majority and the executive, and can force votes.',
    majwhip: 'Counts votes and enforces the party line. Can run whip operations to lock in votes.',
    minwhip: 'Counts the minority\'s votes and keeps the caucus together. Can run whip operations.',
    majasst: 'Whips a zone of members for the Whip. Runs smaller whip operations.',
    minasst: 'Whips a zone of minority members. Runs smaller whip operations.',
    majcaucus: 'Runs caucus meetings and sets the party\'s message. Can call caucus meetings.',
    mincaucus: 'Runs the minority caucus and its message. Can call caucus meetings.',
    vice: 'Presides when the president is away and helps run the agenda.',
  };
  const OFFERS = {
    committee: (b) => `a seat on ${b === 'council' ? 'the Budget committee' : 'Appropriations'} when steering meets`,
    item: () => 'a project for your district in the next budget',
    bill: () => 'floor time and a push for your next bill',
    money: () => 'a check from their leadership PAC',
  };

  function st(s) { return s.leadRaces || (s.leadRaces = {}); }
  const members = (s, bk, party) => W().members(s, bk).filter((m) => !m.isPlayer && (!party || m.party === party));
  const senior = (s, bk, p) => (p.terms[BODY_OFF[bk]] || 0) + (p.infl || 30) / 30;
  const regionOf = (s, p, bk) => (GR.budget ? GR.budget.regionOf(GR.budget.geoOf(s, p, GR.BODIES[bk].jur)) : 's');

  // ---------- Races ----------
  // When the window opens: which posts are contested, and by whom.
  function setup(s, bk) {
    const R = st(s);
    const y = U.yearOf(s.week);
    if (R[bk] && R[bk].y === y) return R[bk];
    const B = s.bodies[bk];
    const maj = W().majority(s, bk);
    const races = [];
    const leaving = new Set();
    // Holders who lost or retired this year.
    (s.races && s.races[y] || []).forEach((r) => { if (r.inc && r.res && r.res[0] && r.res[0].id !== r.inc) leaving.add(r.inc); if (r.retiring) leaving.add(r.retiring); });
    GR.LEADERSHIP[bk].slice().sort((a, b) => b.rank - a.rank).forEach((post) => {
      const party = post.side === 'maj' ? maj : post.side === 'min' ? GR.other(maj) : maj;
      const h = B.lead[post.k] && s.pols[B.lead[post.k]];
      const open = !h || leaving.has(h.id) || h.party !== party;
      const challenge = !open && !h.isPlayer && U.chance(post.rank >= 3 ? 0.18 : 0.12);
      if (!open && !challenge) return;
      const taken = new Set(races.flatMap((r) => r.cands).concat(['me']));
      const pool = members(s, bk, party).filter((m) => !taken.has(m.id) && !leaving.has(m.id) && (m.terms[BODY_OFF[bk]] || 0) >= post.sen - 1 && (!m.lead || GR.LEADERSHIP[bk].find((x) => x.k === m.lead.post).rank < post.rank)).sort((a, b) => senior(s, bk, b) - senior(s, bk, a));
      const cands = [];
      if (challenge) cands.push(h.id);
      // The next rung down usually runs first; then a rival from another part of the state.
      const lower = pool.find((m) => m.lead && m.lead.body === bk);
      const first = !challenge && lower ? lower : pool[0];
      if (first && !cands.includes(first.id)) cands.push(first.id);
      const rReg = first ? regionOf(s, first, bk) : null;
      const second = pool.find((m) => !cands.includes(m.id) && regionOf(s, m, bk) !== rReg) || pool.find((m) => !cands.includes(m.id));
      if (second && cands.length < 2) cands.push(second.id);
      if (cands.length < 2) return;
      races.push({ post: post.k, party, cands, challenge, inc: h && !open ? h.id : null, pledge: null, offers: {}, whip: {}, asked: {} });
    });
    R[bk] = { y, races };
    const me = s.pols.me;
    const mine = races.filter((r) => r.party === me.party);
    if (mine.length) GR.sim.msgInbox(s, 'Leadership races', `The ${GR.BODIES[bk].name} ${me.party === maj ? 'majority' : 'minority'} caucus will elect its leaders when the new session organizes in January.\n\n${mine.map((r) => `• ${postName(bk, r.post)}: ${r.cands.map((id) => W().fullName(s.pols[id])).join(' vs. ')}${r.challenge ? ' (a challenge to the incumbent)' : ''}`).join('\n')}\n\nExpect calls. Candidates trade favors for votes, and winners remember who stood with them. See Power → Leadership.`);
    return R[bk];
  }
  const postName = (bk, k) => (GR.LEADERSHIP[bk].find((x) => x.k === k) || { name: k }).name;

  // How each caucus member would vote today.
  function tally(s, bk, race) {
    const out = {};
    race.cands.forEach((id) => { out[id] = 0; });
    const cs = race.cands.map((id) => s.pols[id]).filter(Boolean);
    members(s, bk, race.party).forEach((v) => {
      if (race.cands.includes(v.id)) { out[v.id]++; return; }
      const va = W().axes(v);
      const vr = regionOf(s, v, bk);
      let best = null, bx = -1e9;
      cs.forEach((c) => {
        const ca = W().axes(c);
        const x = -Math.abs((va.fis + va.soc) - (ca.fis + ca.soc)) * 0.7 + Math.min(4, senior(s, bk, c)) * 0.05 + (vr === regionOf(s, c, bk) ? 0.5 : 0) + (race.inc === c.id ? 0.3 : 0) + U.seeded(v.id + c.id + race.post)() * 1.3;
        if (x > bx) { bx = x; best = c.id; }
      });
      if (best) out[best]++;
    });
    // Votes you (or the candidates' allies) won over by working the caucus.
    Object.entries(race.whip).forEach(([id, n]) => { const other = race.cands.find((x) => x !== id); const moved = Math.min(n, out[other] || 0); out[id] = (out[id] || 0) + moved; if (other) out[other] -= moved; });
    const me = s.pols.me;
    if (me.party === race.party && G().myBody(s) === bk && !race.cands.includes('me')) {
      const pick = race.pledge || race.cands.slice().sort((a, b) => G().rel(s, b) - G().rel(s, a))[0];
      out[pick] = (out[pick] || 0) + 1;
    }
    return out;
  }

  // A candidate calls you.
  function court(s, bk, race, id) {
    const c = s.pols[id];
    if (!c) return;
    race.asked[id] = true;
    const other = s.pols[race.cands.find((x) => x !== id)];
    const offer = race.offers[id] || (race.offers[id] = U.pick(Object.keys(OFFERS)));
    const pledged = race.pledge && race.pledge !== id;
    GR.scenes.post(s, { kicker: `${postName(bk, race.post)} race`, title: `${W().fullName(c)} wants your vote`, text: `${W().fullName(c)} (${c.party}) is running for ${postName(bk, race.post)}${race.challenge && race.inc === id ? ' to keep their post' : race.challenge ? ` against the sitting ${postName(bk, race.post)}, ${W().fullName(other)}` : ` against ${W().fullName(other)}`}. "I won't forget who stood with me. If I win, you'll get ${OFFERS[offer](bk)}."${pledged ? `\n\nYou already told ${W().fullName(s.pols[race.pledge])} you're with them.` : ''}`, choices: [
      { label: pledged ? `Switch: back ${W().fullName(c)} instead` : `Commit to ${W().fullName(c)}`, fx: {}, res: 'They thank you and mark you down.', run: 'leadPledge', args: { bk, post: race.post, id } },
      { label: 'Hold out for a better offer', fx: {}, res: 'You keep them guessing.', run: 'leadMore', args: { bk, post: race.post, id } },
      { label: pledged ? 'Tell them you are committed elsewhere' : 'Stay neutral for now', fx: {}, res: 'They hang up politely.' },
    ] });
  }
  function find(s, bk, post) { const R = st(s)[bk]; return R && R.races.find((r) => r.post === post); }
  Object.assign(GR.scenes.RUN, {
    leadPledge: (s, a) => {
      const r = find(s, a.bk, a.post);
      if (!r) return;
      const was = r.pledge;
      r.pledge = a.id;
      G().addRel(s, a.id, 6);
      if (was && was !== a.id) { r.switched = was; G().addRel(s, was, -8); return `You switched your support. ${W().fullName(s.pols[was])} is not happy.`; }
      return null;
    },
    leadMore: (s, a) => {
      const r = find(s, a.bk, a.post);
      if (!r) return;
      if (U.chance(0.5)) { r.big = r.big || {}; r.big[a.id] = true; r.pledge = r.pledge || a.id; G().addRel(s, a.id, 2); return `${W().fullName(s.pols[a.id])} sweetens it: ${OFFERS[r.offers[a.id]](a.bk)}, plus their help when you need it. You agree.`; }
      G().addRel(s, a.id, -4);
      return `${W().fullName(s.pols[a.id])} doesn't like being shaken down.`;
    },
  });

  // Work the caucus for your candidate (2 hours: a few votes).
  function whipFor(s, bk, post) {
    const r = find(s, bk, post);
    if (!r || !r.pledge) return { ok: false, msg: 'Commit to a candidate first.' };
    if (s.hoursLeft < 2) return { ok: false, msg: 'Working the phones takes 2 hours.' };
    s.hoursLeft -= 2;
    const gain = Math.max(1, Math.round(((s.pols.me.respect || 20) / 20) + U.rand() * 2));
    r.whip[r.pledge] = (r.whip[r.pledge] || 0) + gain;
    G().addRel(s, r.pledge, 2);
    return { ok: true, msg: `You worked the phones for ${W().fullName(s.pols[r.pledge])}. A few colleagues are coming around.` };
  }

  // In January: elect the winners (before vacancies are filled by promotion).
  function resolve(s, bk) {
    const R = st(s)[bk];
    if (!R || R.done) return;
    R.done = true;
    const B = s.bodies[bk];
    const me = s.pols.me;
    R.races.forEach((r) => {
      if (s.leadBid && s.leadBid.body === bk && s.leadBid.post === r.post) return;
      const t = tally(s, bk, r);
      const order = Object.entries(t).sort((a, b) => b[1] - a[1]);
      const win = s.pols[order[0][0]], lose = s.pols[order[1] && order[1][0]];
      if (!win) return;
      const old = B.lead[r.post] && s.pols[B.lead[r.post]];
      if (old && old.id !== win.id) { old.lead = null; }
      if (win.lead && win.lead.body === bk && win.lead.post !== r.post) delete B.lead[win.lead.post];
      B.lead[r.post] = win.id;
      win.lead = { body: bk, post: r.post };
      win.infl = Math.max(win.infl || 30, GR.LEADERSHIP[bk].find((x) => x.k === r.post).inf + 15);
      const line = `${W().fullName(win)} elected ${postName(bk, r.post)}, ${order[0][1]}-${order[1] ? order[1][1] : 0}${r.challenge && r.inc && r.inc !== win.id ? `, ousting ${W().fullName(s.pols[r.inc])}` : ''}.`;
      GR.sim.news(s, line, 'gov');
      if (me.party !== r.party || G().myBody(s) !== bk) return;
      let note;
      if (r.pledge === win.id) {
        G().addRel(s, win.id, 12);
        note = `You backed the winner. ${deliver(s, bk, r, win)}`;
      } else if (r.pledge && lose && r.pledge === lose.id) {
        G().addRel(s, win.id, -8);
        me.standing = U.clamp(me.standing - 2, 0, 100);
        note = `You backed ${W().fullName(lose)}. ${W().fullName(win)} knows it.`;
      } else note = 'You stayed out of it.';
      GR.sim.msgInbox(s, `${postName(bk, r.post)}: ${W().fullName(win)} wins`, `${line}\n\n${note}`);
    });
  }
  // The winner pays off.
  function deliver(s, bk, r, win) {
    const offer = r.offers[win.id];
    const me = s.pols.me;
    s.leadFavor = { who: win.id, kind: offer, big: !!(r.big && r.big[win.id]), y: U.yearOf(s.week) };
    if (offer === 'money') { const amt = Math.round(GR.elect.scale(s, s.seats[me.seat]) * (r.big && r.big[win.id] ? 0.05 : 0.025) / 100) * 100; me.warChest += amt; return `They sent ${U.money(amt)} to your campaign.`; }
    if (offer === 'committee') return 'They will push steering to give you the seat you want.';
    if (offer === 'item') return 'They will see that your district gets a project in the next budget.';
    return 'They will give your next bill floor time and their push.';
  }
  // Favors owed to you by a leader you helped elect.
  const favor = (s, kind) => (s.leadFavor && s.leadFavor.kind === kind && s.pols[s.leadFavor.who] && s.pols[s.leadFavor.who].lead ? s.leadFavor : null);
  function useFavor(s) { s.leadFavor = null; }

  // ---------- Your own bid: colleagues name their price ----------
  function bidAsks(s, bk) {
    const bid = s.leadBid;
    if (!bid || bid.body !== bk || !U.chance(0.35)) return;
    const c = G().leadCount(s, bk, bid.post);
    bid.bought = bid.bought || {};
    bid.asked = bid.asked || {};
    const fence = c.rows.filter((x) => Math.abs(x.x) < 0.6 && !bid.bought[x.id] && !bid.asked[x.id]).sort((a, b) => Math.abs(a.x) - Math.abs(b.x))[0];
    if (!fence) return;
    bid.asked[fence.id] = true;
    const p = s.pols[fence.id];
    const ask = U.pick(['chair', 'money', 'vote']);
    const me = s.pols.me;
    const gift = Math.max(500, Math.round(GR.elect.scale(s, s.seats[me.seat]) * 0.01 / 100) * 100);
    GR.scenes.post(s, { kicker: `Your race for ${postName(bk, bid.post)}`, title: `${W().fullName(p)} names a price`, text: `${W().fullName(p)} (${p.party}) is undecided. "${ask === 'chair' ? 'I want to chair a committee. Can you make that happen?' : ask === 'money' ? `My race is going to be tight. A ${U.money(gift)} contribution would show me you're serious.` : 'I have a bill coming up that matters to my district. I need your yes.'}"`, choices: [
      { label: ask === 'chair' ? 'Promise them a gavel' : ask === 'money' ? `Send ${U.money(gift)} from your war chest` : 'Promise your vote on their bill', fx: ask === 'money' ? { chest: -gift } : {}, res: 'They are with you.', run: 'bidBuy', args: { id: fence.id, ask } },
      { label: 'Decline', fx: {}, res: 'They say they will think about it.' },
    ] });
  }
  GR.scenes.RUN.bidBuy = (s, a) => {
    const bid = s.leadBid;
    if (!bid) return;
    bid.bought = bid.bought || {};
    bid.bought[a.id] = a.ask;
    G().addRel(s, a.id, 10);
    if (a.ask === 'vote') { s.deals = s.deals || []; const b = L().allBills(s).find((x) => x.spon === a.id && L().OPEN(x)); if (b) s.deals.push({ who: a.id, bill: b.id, w: s.week }); }
  };

  // ---------- The whip ----------
  // Before a floor vote where you're drifting from the party line, the whip calls.
  function whipCalls(s) {
    const bk = G().myBody(s);
    if (!bk) return;
    const me = s.pols.me;
    const B = s.bodies[bk];
    const maj = W().majority(s, bk);
    const whipK = me.party === maj ? 'majwhip' : 'minwhip';
    const whip = B.lead[whipK] && s.pols[B.lead[whipK]];
    if (!whip || whip.isPlayer || (me.lead && me.lead.body === bk)) return;
    G().tasks(s).filter((t) => t.kind === 'vote' && t.b.body === bk).forEach((t) => {
      const b = t.b;
      if (b.whipped) return;
      const line = L().partyLine(s, b, me.party);
      if (!line) return;
      const mine = L().components(s, me, b).score;
      if ((line > 0) === (mine > 0)) return;
      if (b.kind !== 'budget' && !b.agenda && !(b.spon && s.pols[b.spon] && s.pols[b.spon].lead)) return;
      b.whipped = true;
      const carrot = b.prov.bud ? 'a project for your district in this budget' : 'their help getting your next bill to the floor';
      GR.scenes.post(s, { kicker: `${postName(bk, whipK)} ${W().fullName(whip)}`, title: `The whip needs your ${line > 0 ? 'yes' : 'no'}`, text: `"The caucus position on the ${b.title} is ${line > 0 ? 'YES' : 'NO'}, and right now I have you down as a problem. Your district may not love it, but we need you. I can offer ${carrot}. And I remember who was there when it counted."`, choices: [
        { label: `Fine: I'll vote ${line > 0 ? 'yes' : 'no'}`, fx: { stand: 2 }, res: 'The whip marks you down.', run: 'whipYes', args: { bill: b.id, whip: whip.id, line } },
        { label: `Deal, if I get ${carrot}`, fx: {}, res: 'The whip agrees.', run: 'whipDeal', args: { bill: b.id, whip: whip.id, line } },
        { label: 'Vote my district', fx: { stand: -3 }, res: 'The whip goes quiet. That is never good.', run: 'whipNo', args: { whip: whip.id } },
      ] });
    });
  }
  Object.assign(GR.scenes.RUN, {
    whipYes: (s, a) => { G().addRel(s, a.whip, 4); s.deals = s.deals || []; s.deals.push({ who: a.whip, bill: a.bill, w: s.week, whip: a.line }); },
    whipDeal: (s, a) => {
      G().addRel(s, a.whip, 1);
      s.deals = s.deals || []; s.deals.push({ who: a.whip, bill: a.bill, w: s.week, whip: a.line });
      const b = L().findBill(s, a.bill);
      if (b && b.prov.bud && GR.budget) { const J = s.jur[b.jur]; const amt = Math.round(GR.fisc.totals(J).spend * (J.k === 'city' ? 0.0005 : 0.0001)); const ag = J.F.ag.find((x) => x.capex > 0) || J.F.ag[0]; if (!(b.prov.bud.items || []).some((x) => x.who === 'me')) { b.prov.bud.items = b.prov.bud.items || []; b.prov.bud.items.push({ who: 'me', ag: ag.k, amt, proj: L().earmarkName(s, s.pols.me, ag) }); } return 'Your district project is in the budget.'; }
      s.leadFavor = { who: a.whip, kind: 'bill', y: U.yearOf(s.week) };
      return 'The whip will help your next bill.';
    },
    whipNo: (s, a) => { G().addRel(s, a.whip, -6); s.whipNo = (s.whipNo || 0) + 1; },
  });

  // ---------- Tools for leaders ----------
  const myPost = (s) => { const me = s.pols.me; const bk = G().myBody(s); return me.lead && me.lead.body === bk ? me.lead.post : null; };
  // Lock in votes on a bill your party backs.
  function whipOp(s, billId) {
    const post = myPost(s);
    const b = L().findBill(s, billId);
    if (!post || !b || !L().OPEN(b)) return { ok: false };
    if (!/whip|leader|speaker|protem|president|asst/.test(post)) return { ok: false, msg: 'Only leaders and whips run whip operations.' };
    if (s.hoursLeft < 4) return { ok: false, msg: 'A whip operation takes 4 hours.' };
    s.hoursLeft -= 4;
    const me = s.pols.me;
    const n = /asst/.test(post) ? 3 : 6;
    const soft = members(s, b.body, me.party).map((p) => ({ p, sc: L().components(s, p, b).score })).filter((x) => x.sc < 0 && x.sc > -0.15 && !b.pledges[x.p.id]).sort((a, c) => c.sc - a.sc).slice(0, n);
    let got = 0;
    soft.forEach((x) => { if (U.chance(0.4 + G().rel(s, x.p.id) / 200 + (me.respect || 20) / 200)) { b.pledges[x.p.id] = true; got++; } });
    G().addRespect(s, 0.5);
    return { ok: true, msg: `Your whip operation locked in ${got} of ${soft.length} wavering members of your party.` };
  }
  // A caucus meeting: unity and standing.
  function caucusMeeting(s) {
    const post = myPost(s);
    if (!post) return { ok: false, msg: 'Only party leaders call caucus meetings.' };
    if (s.hoursLeft < 3) return { ok: false, msg: 'Takes 3 hours.' };
    if ((s.caucusMet || -99) > s.week - 4) return { ok: false, msg: 'You held one recently.' };
    s.hoursLeft -= 3;
    s.caucusMet = s.week;
    const me = s.pols.me;
    members(s, G().myBody(s), me.party).forEach((p) => G().addRel(s, p.id, 1));
    me.standing = U.clamp(me.standing + 2, 0, 100);
    return { ok: true, msg: 'The caucus met behind closed doors. Members aired grievances; the party is more unified.' };
  }

  // ---------- Weekly ----------
  function week(s) {
    const bk = G().myBody(s);
    if (!bk || isFed(bk)) { whipCalls(s); return; }
    if (G().leadWindowOpen(s, bk)) {
      const R = setup(s, bk);
      const me = s.pols.me;
      // Candidates call over the following weeks.
      R.races.filter((r) => r.party === me.party).forEach((r) => r.cands.forEach((id) => { if (!r.asked[id] && U.chance(0.4)) court(s, bk, r, id); }));
      bidAsks(s, bk);
    }
    whipCalls(s);
  }

  return { POWERS, OFFERS, setup, tally, resolve, whipFor, find, favor, useFavor, whipOp, caucusMeeting, week, postName };
})();
