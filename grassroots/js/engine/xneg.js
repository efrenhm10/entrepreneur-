// Executive–legislative bargaining.
// As a legislator you deal with the mayor, governor or President: ask for a signing commitment
// on your bill (they may counter with an amendment, your vote on their priority, or a favor you
// will owe), request a project for your district, and take their calls when they need your vote.
// Executives introduce priority bills and issue veto threats that move their party's members.
// As an executive you deal with legislative leaders: promise to sign their priority in exchange
// for moving yours, call a budget summit, or threaten a veto.
// A favor ledger per government remembers who owes whom.
var GR = globalThis.GR || (globalThis.GR = {});

GR.xneg = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const G = () => GR.gov;
  const L = () => GR.legis;
  const PW = () => GR.power;
  const sig = (x) => 1 / (1 + Math.exp(-x));

  function st(s, jur) { s.xneg = s.xneg || {}; return s.xneg[jur] || (s.xneg[jur] = { favors: 0, commit: {}, cool: {} }); }
  const execOf = (s, jur) => G().execOf(s, jur);
  const exTitle = (s, jur) => ({ city: 'Mayor', state: 'Governor', nation: 'President', school: 'Superintendent' }[jur] || 'Executive');

  // How the executive is likely to act on a bill.
  function stance(s, b) {
    const ex = execOf(s, b.jur);
    if (!ex) return { k: 'none', label: 'No executive signature needed' };
    if (ex.isPlayer) return { k: 'you', label: 'Your signature' };
    const x = st(s, b.jur);
    if (x.commit[b.id] === 'sign') return { k: 'sign', label: `${exTitle(s, b.jur)} committed to sign`, sc: 1 };
    if (x.commit[b.id] === 'veto') return { k: 'veto', label: `${exTitle(s, b.jur)} committed to veto`, sc: -1 };
    const sc = score(s, b, ex);
    const k = sc > 0.03 ? 'likely' : sc > -0.06 ? 'lean' : sc > -0.15 ? 'doubt' : 'threat';
    return { k, sc, label: { likely: 'Likely to sign', lean: 'Leaning toward signing', doubt: 'Undecided, leaning veto', threat: 'Veto likely' }[k] + (b.vetoThreat ? ' · veto threat issued' : '') };
  }
  function score(s, b, ex) {
    const x = st(s, b.jur);
    let sc = L().components(s, ex, b).score;
    if (b.spon === 'me' || (b.cos || []).includes('me')) sc += x.favors * 0.02 + G().rel(s, ex.id) / 1500;
    return sc;
  }
  // Final decision at the executive stage (called from the bill pipeline).
  function decide(s, b, ex) {
    const x = st(s, b.jur);
    if (x.commit[b.id] === 'sign') return true;
    if (x.commit[b.id] === 'veto') return false;
    const sc = score(s, b, ex);
    return sc > -0.06 || b.kind === 'cr' || (b.kind === 'budget' && sc > -0.15) || (b.summit && sc > -0.25);
  }

  // A bill cleared its first chamber: the executive weighs in.
  function afterChamber(s, b) {
    const ex = execOf(s, b.jur);
    if (!ex || ex.isPlayer || b.vetoThreat || b.kind !== 'regular') return;
    const x = st(s, b.jur);
    if (x.commit[b.id]) return;
    if (score(s, b, ex) < -0.08) {
      b.vetoThreat = true; b._line = null;
      GR.sim.news(s, `${W().fullName(ex)} threatens to veto the ${b.title}.`, 'gov');
      if (b.spon === 'me') GR.sim.msgInbox(s, 'Veto threat', `${W().fullName(ex)} (${ex.party}) says they will veto your ${b.title} as written. Their party's lawmakers are now under pressure to oppose it. Negotiate on the Legislature tab: an amendment, a vote trade or a favor may turn them around.`);
    }
  }

  // ---------- Legislator → executive ----------
  function askSign(s, id) {
    const b = L().findBill(s, id);
    if (!b || !L().OPEN(b)) return { ok: false };
    const ex = execOf(s, b.jur);
    if (!ex || ex.isPlayer) return { ok: false, msg: 'There is no executive to lobby.' };
    if (s.hoursLeft < 2) return { ok: false, msg: 'A meeting with the executive takes 2 hours.' };
    const x = st(s, b.jur);
    if (x.commit[b.id] === 'sign') return { ok: false, msg: 'They already committed to sign it.' };
    if ((x.cool[b.id] || -99) > s.week - 4) return { ok: false, msg: 'You asked recently. Give it a few weeks, or accept one of their offers.' };
    s.hoursLeft -= 2;
    x.cool[b.id] = s.week;
    const me = s.pols.me;
    const sc = score(s, b, ex);
    const p = U.clamp(sig((sc + 0.06) * 14 + G().rel(s, ex.id) / 30 + x.favors * 0.35 + (ex.party === me.party ? 0.4 : -0.35) + ((me.respect || 20) - 40) / 60), 0.04, 0.95);
    if (U.chance(p)) { commit(s, b, 'sign'); return { ok: true, msg: `${W().fullName(ex)} agreed to sign the ${b.title} and will say so publicly (${Math.round(p * 100)}% odds).` }; }
    b.xcounter = counters(s, b, ex);
    G().addRel(s, ex.id, -1);
    return { ok: true, msg: `${W().fullName(ex)} won't commit yet (${Math.round(p * 100)}% odds), but their staff made ${b.xcounter.length} counteroffer${b.xcounter.length === 1 ? '' : 's'}.` };
  }
  function counters(s, b, ex) {
    const out = [];
    const am = L().amendFor(s, b, ex);
    if (am) out.push({ k: 'amend', label: `Accept their amendment: ${am.label}` });
    const pri = agenda(s, b.jur).find((x) => x.body === G().myBody(s) && !x.my[x.body]);
    if (pri) out.push({ k: 'vote', label: `Promise your vote for their priority, the ${pri.title}`, bill: pri.id });
    const x = st(s, b.jur);
    if (x.favors > -4) out.push({ k: 'favor', label: 'Owe them a favor (they will call it in)' });
    const pp = capCost(s, b, ex);
    out.push({ k: 'capital', label: `Spend political capital (${pp} PP)`, pp });
    return out;
  }
  // The further apart you are, the more capital it takes.
  const capCost = (s, b, ex) => Math.round(U.clamp(12 + Math.max(0, -score(s, b, ex)) * 160, 12, 45));
  function acceptCounter(s, id, k) {
    const b = L().findBill(s, id);
    if (!b || !b.xcounter) return { ok: false };
    const c = b.xcounter.find((x) => x.k === k);
    if (!c) return { ok: false };
    const ex = execOf(s, b.jur);
    const x = st(s, b.jur);
    const me = s.pols.me;
    if (k === 'amend') { const am = L().amendFor(s, b, ex); if (am) { am.apply(); b._lean = null; b._line = null; L().analysis(s, b); b.sum = L().describe(s, b).slice(0, 3).join('; '); } }
    if (k === 'vote') { s.deals = s.deals || []; s.deals.push({ who: ex.id, bill: c.bill, w: s.week, exec: true }); }
    if (k === 'favor') x.favors -= 2;
    if (k === 'capital') { if (me.pp < c.pp) return { ok: false, msg: `You need ${c.pp} political points.` }; me.pp -= c.pp; }
    b.xcounter = null;
    commit(s, b, 'sign');
    return { ok: true, msg: `Deal. ${W().fullName(ex)} will sign the ${b.title}.${k === 'vote' ? ' Keep your word on their bill.' : ''}` };
  }
  function commit(s, b, how) {
    const ex = execOf(s, b.jur);
    st(s, b.jur).commit[b.id] = how;
    if (how === 'sign') { b.execEndorse = true; b.vetoThreat = false; }
    b._line = null;
    if (ex) { G().addRel(s, ex.id, 3); GR.sim.news(s, `${W().fullName(ex)} endorses the ${b.title}.`, 'gov'); }
  }

  // Ask the executive for a capital project in your district.
  function askProject(s) {
    const me = s.pols.me;
    const jur = G().myJur(s);
    if (!jur || !G().myBody(s)) return { ok: false };
    const ex = execOf(s, jur);
    if (!ex || ex.isPlayer) return { ok: false, msg: 'There is no executive to ask.' };
    const x = st(s, jur);
    if ((x.cool.project || -99) > s.week - 26) return { ok: false, msg: `You asked within the last six months. Next chance ${U.fmtDate(x.cool.project + 26)}.` };
    if (s.hoursLeft < 3) return { ok: false, msg: 'Takes 3 hours.' };
    s.hoursLeft -= 3;
    x.cool.project = s.week;
    const p = U.clamp(sig(G().rel(s, ex.id) / 25 + x.favors * 0.4 + (ex.party === me.party ? 0.5 : -0.5) + (me.standing - 50) / 50), 0.05, 0.9);
    if (U.chance(p)) return { ok: true, msg: grantProject(s, jur, ex, -1) };
    const pri = agenda(s, jur).find((b) => b.body === G().myBody(s) && !b.my[b.body]);
    if (pri) {
      GR.scenes.post(s, { kicker: `${exTitle(s, jur)}'s office`, title: 'A project, for a price', text: `${W().fullName(ex)}'s chief of staff says the project for your district can happen, if you vote for the ${pri.title}.`, choices: [
        { label: 'Deal: your vote for the project', fx: { xrel: 4 }, res: 'Groundbreaking is scheduled.', run: 'xProject', args: { jur, bill: pri.id } },
        { label: 'No deal', fx: { xrel: -2 }, res: 'The project goes elsewhere.' },
      ] });
      return { ok: true, msg: 'They named a price. See the decision waiting for you.' };
    }
    return { ok: true, msg: `${W().fullName(ex)} turned you down this time (${Math.round(p * 100)}% odds).` };
  }
  function grantProject(s, jur, ex, owe) {
    const J = s.jur[jur];
    const me = s.pols.me;
    const kinds = { city: ['works', 'parks', 'water', 'transit'], state: ['dot', 'hied', 'env', 'k12'], nation: ['dot', 'epa', 'usda', 'va'] }[jur] || [];
    const a = J.F.ag.find((y) => y.k === U.pick(kinds)) || J.F.ag[0];
    const amt = GR.fisc.totals(J).spend * ({ city: 0.002, state: 0.0006, nation: 0.000008 }[jur] || 0.001);
    a.capex += amt;
    const proj = L().earmarkName(s, me, a);
    st(s, jur).favors += owe;
    me.app = U.clamp(me.app + 1.5, 1, 99);
    PW().shift(s, 'local', 5); PW().shift(s, 'neighborhoods', 4);
    me.recLocal = U.clamp(me.recLocal + 1, 0, 100);
    GR.sim.news(s, `${W().fullName(ex)} announces a ${U.money(amt)} ${proj}.`, 'gov');
    return `${W().fullName(ex)} is funding a ${U.money(amt)} ${proj}. Constituents credit you.`;
  }

  // ---------- The executive's agenda ----------
  const agenda = (s, jur) => (s.jur[jur].bills || []).filter((b) => b.agenda && L().OPEN(b));
  function aiAgenda(s) {
    ['city', 'state', 'nation'].forEach((jur) => {
      const ex = execOf(s, jur);
      const bs = G().bodiesOf(s, jur);
      if (!ex || ex.isPlayer || !bs.length || !G().inSession(s, bs[0])) return;
      if (agenda(s, jur).length >= 2 || !U.chance(1 / 26)) return;
      const d = GR.billgen.deal(s, jur, { spon: ex, fac: GR.billgen.factionOf(ex), body: bs[0] });
      if (!d) return;
      const b = L().newBill(s, jur, { title: d.title, prov: d.prov, spon: ex.id, kind: 'regular', body: bs[0], fac: d.fac, tool: d.tool, crisis: d.crisis, agenda: true });
      b.sum = L().describe(s, b).slice(0, 3).join('; ');
      L().analysis(s, b);
      s.jur[jur].bills.push(b);
      st(s, jur).commit[b.id] = 'sign';
      b.execEndorse = true;
      GR.sim.news(s, `${W().fullName(ex)} unveils a priority bill: the ${b.title}.`, 'gov');
    });
  }
  // The executive calls when their priority is close in your chamber.
  function calls(s) {
    const body = G().myBody(s);
    const jur = G().myJur(s);
    if (!body || !jur) return;
    const ex = execOf(s, jur);
    if (!ex || ex.isPlayer) return;
    const x = st(s, jur);
    agenda(s, jur).forEach((b) => {
      if (b.body !== body || b.my[body] || x.cool['call' + b.id] || !['floor', 'cloture', 'markup'].includes(b.stage)) return;
      if ((s.deals || []).some((d) => d.bill === b.id)) return;
      x.cool['call' + b.id] = s.week;
      const mine = L().components(s, s.pols.me, b);
      GR.scenes.post(s, { kicker: `A call from the ${exTitle(s, jur)}`, title: `${W().fullName(ex)} needs your vote`, text: `${W().fullName(ex)} (${ex.party}) is calling about the ${b.title}: ${b.sum || ''}. Your district scores it ${mine.di >= 0 ? '+' : ''}${mine.di.toFixed(2)}. "I'll remember who stood with me."`, choices: [
        { label: 'Commit your vote: they will owe you', fx: { xrel: 8 }, res: 'They thank you warmly.', run: 'xCommit', args: { jur, bill: b.id, favor: 1 } },
        { label: 'Name your price: a project for your district', fx: { xrel: 3 }, res: 'They agree to fund a project.', run: 'xProject', args: { jur, bill: b.id } },
        { label: 'Tell them you are a no', fx: { xrel: -8, pw: { party: ex.party === s.pols.me.party ? -4 : 3 } }, res: 'The call ends coldly.' },
        { label: 'Stay noncommittal', fx: { xrel: -2 }, res: 'They hang up unsatisfied.' },
      ] });
    });
  }
  const RUNS = {
    xCommit: (s, a) => { const ex = execOf(s, a.jur); if (!ex) return; s.deals = s.deals || []; s.deals.push({ who: ex.id, bill: a.bill, w: s.week, exec: true }); st(s, a.jur).favors += a.favor || 0; },
    xProject: (s, a) => { const ex = execOf(s, a.jur); if (!ex) return; s.deals = s.deals || []; s.deals.push({ who: ex.id, bill: a.bill, w: s.week, exec: true }); return grantProject(s, a.jur, ex, 0); },
  };
  Object.assign(GR.scenes.RUN, RUNS);

  // Pledge your vote on the executive's priority, for a favor or a project.
  function pledge(s, id, price) {
    const b = L().findBill(s, id);
    const body = G().myBody(s);
    if (!b || !b.agenda || !L().OPEN(b) || !body || b.my[body]) return { ok: false, msg: 'That vote is no longer open.' };
    const ex = execOf(s, b.jur);
    if (!ex || ex.isPlayer) return { ok: false };
    if ((s.deals || []).some((d) => d.bill === b.id)) return { ok: false, msg: 'You already gave your word on this bill.' };
    if (s.hoursLeft < 1) return { ok: false, msg: 'Takes an hour on the phone.' };
    s.hoursLeft -= 1;
    const x = st(s, b.jur);
    if (price === 'project') {
      if ((x.cool.project || -99) > s.week - 13) return { ok: false, msg: 'They funded a project for you recently. Take the favor instead.' };
      x.cool.project = s.week;
      s.deals = s.deals || [];
      s.deals.push({ who: ex.id, bill: b.id, w: s.week, exec: true });
      G().addRel(s, ex.id, 3);
      return { ok: true, msg: `You pledged your vote. ${grantProject(s, b.jur, ex, 0)} Keep your word on the floor.` };
    }
    RUNS.xCommit(s, { jur: b.jur, bill: b.id, favor: 1 });
    G().addRel(s, ex.id, 8);
    return { ok: true, msg: `You told ${W().fullName(ex)} you are a yes. They owe you one.` };
  }

  // ---------- Executive → legislature ----------
  function leaders(s) {
    const me = s.pols.me;
    const off = me.seat && GR.OFFICES[s.seats[me.seat].off];
    if (!off || !off.exec) return [];
    const out = [];
    G().bodiesOf(s, off.jur).forEach((bk) => {
      const B = s.bodies[bk];
      Object.entries(B.lead || {}).forEach(([post, id]) => {
        const p = s.pols[id];
        const def = GR.LEADERSHIP[bk].find((x) => x.k === post);
        if (p && def && def.rank >= 3) out.push({ id, p, body: bk, post: def.name });
      });
    });
    return out;
  }
  // Promise to sign a leader's bill; they move yours.
  function tradeSignature(s, leaderId, myBillId) {
    const me = s.pols.me;
    const L0 = leaders(s).find((x) => x.id === leaderId);
    const mine = L().findBill(s, myBillId);
    if (!L0 || !mine || !L().OPEN(mine)) return { ok: false };
    const theirs = (s.jur[mine.jur].bills || []).find((b) => b.spon === leaderId && L().OPEN(b));
    if (s.hoursLeft < 3) return { ok: false, msg: 'A leadership meeting takes 3 hours.' };
    s.hoursLeft -= 3;
    const p = U.clamp(sig(G().rel(s, leaderId) / 25 + (L0.p.party === me.party ? 1 : -0.4) + (me.app - 50) / 30), 0.05, 0.92);
    if (!U.chance(p)) { G().addRel(s, leaderId, -2); return { ok: true, msg: `${W().fullName(L0.p)} would not deal (${Math.round(p * 100)}% odds).` }; }
    if (theirs) { s.promises = s.promises || {}; s.promises[theirs.id] = leaderId; }
    mine.leaderPush = L0.body; mine.agreed = mine.agreed || {};
    const cm = s.bodies[L0.body].comm[mine.comm];
    if (cm && cm.chair) mine.agreed[cm.chair] = true;
    G().addRel(s, leaderId, 6);
    return { ok: true, msg: `${W().fullName(L0.p)} will move your ${mine.title} through the ${GR.BODIES[L0.body].name}${theirs ? `. In return you promised to sign their ${theirs.title}` : ''}.` };
  }
  // Threaten a veto: your party's lawmakers feel it, and the sponsor may amend.
  function threaten(s, id) {
    const b = L().findBill(s, id);
    const me = s.pols.me;
    if (!b || !L().OPEN(b)) return { ok: false };
    if (b.vetoThreat) return { ok: false, msg: 'You already threatened to veto it.' };
    if (me.pp < 5) return { ok: false, msg: 'Costs 5 political points.' };
    me.pp -= 5;
    b.vetoThreat = true; b._line = null;
    st(s, b.jur).commit[b.id] = 'veto';
    const sp = s.pols[b.spon];
    let msg = `You threatened to veto the ${b.title}.`;
    if (sp && !sp.isPlayer && U.chance(0.5)) { const am = L().amendFor(s, b, me); if (am) { am.apply(); b._lean = null; L().analysis(s, b); delete st(s, b.jur).commit[b.id]; b.vetoThreat = false; msg += ` ${W().fullName(sp)} amended it to win your signature: ${am.label}.`; } }
    if (sp) G().addRel(s, sp.id, -5);
    GR.sim.news(s, `${me.fn} ${me.ln} threatens to veto the ${b.title}.`, 'gov');
    return { ok: true, msg };
  }
  // A budget summit with both parties' leaders.
  function summit(s) {
    const me = s.pols.me;
    const jur = G().myJur(s);
    const b = jur && (s.jur[jur].bills || []).find((x) => x.kind === 'budget' && L().OPEN(x));
    if (!b) return { ok: false, msg: 'No budget is pending.' };
    if (b.summit) return { ok: false, msg: 'You already held a summit on this budget.' };
    if (s.hoursLeft < 6 || me.pp < 10) return { ok: false, msg: 'A budget summit takes 6 hours and 10 political points.' };
    s.hoursLeft -= 6; me.pp -= 10;
    const opp = leaders(s).find((x) => x.p.party !== me.party);
    let msg = 'Leaders of both parties sat down with you.';
    if (opp) { const am = L().amendFor(s, b, opp.p); if (am) { am.apply(); msg += ` You gave the other side: ${am.label}.`; } G().addRel(s, opp.id, 6); }
    b.summit = true; b._line = null; b._lean = null;
    L().analysis(s, b);
    leaders(s).forEach((x) => { const cm = s.bodies[x.body].comm[b.comm]; if (cm && cm.chair) b.agreed[cm.chair] = true; });
    return { ok: true, msg: msg + ' The deal has bipartisan cover.' };
  }

  function week(s) { aiAgenda(s); if (s.week % 2 === 0) calls(s); }

  return { st, stance, decide, afterChamber, askSign, acceptCounter, askProject, agenda, leaders, tradeSignature, pledge, capCost, threaten, summit, week, exTitle, favors: (s, jur) => st(s, jur).favors };
})();
