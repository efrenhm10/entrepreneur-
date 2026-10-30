// Decision scenes: situations that interrupt the week and demand a choice. They come from
// your state's and city's dossiers (their real issues), from templates filled with local data
// (your county, your agencies, your worst crises), from the federal agenda, and from threats
// to your hold on office (primary challengers, recalls, impeachment, indictments, ouster from
// leadership). Every choice says what it moves: approval, power bases, crises, agencies, money.
// Executives decide; legislators take a position and push, so the effects on the government
// scale with how much power you have.
var GR = globalThis.GR || (globalThis.GR = {});

GR.scenes = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const G = () => GR.gov;
  const PW = () => GR.power;

  // ---------- Who you are right now ----------
  function ctx(s) {
    const me = s.pols.me;
    if (!me.seat) return null;
    const seat = s.seats[me.seat];
    const off = GR.OFFICES[seat.off];
    const jur = off.jur;
    const body = G().myBody(s);
    const post = me.lead && me.lead.body === body ? me.lead.post : null;
    const leader = ['speaker', 'majleader', 'president', 'protem'].includes(post);
    const mult = off.exec ? 1 : leader ? 0.6 : 0.3;
    const where = jur === 'nation' ? 'the United States' : jur === 'state' ? GR.STATE[s.home.state].name : jur === 'city' ? s.home.cityName : `${s.home.cityName} schools`;
    return { me, seat, off, jur, J: s.jur[jur], exec: off.exec, body, leader, mult, where, title: W().seatTitle(s, seat) };
  }

  // ---------- Effects ----------
  // Role names that map onto each government's real agencies.
  const SEM = {
    roads: { nation: 'dot', state: 'dot', city: 'works', school: 'facil' },
    transit: { nation: 'dot', state: 'dot', city: 'transit', school: 'trans' },
    police: { nation: 'doj', state: 'police', city: 'police' },
    prisons: { nation: 'doj', state: 'corr', city: 'police' },
    schools: { nation: 'ed', state: 'k12', city: 'admin', school: 'instr' },
    colleges: { nation: 'ed', state: 'hied' },
    health: { nation: 'hhs', state: 'mcd', city: 'admin', school: 'support' },
    welfare: { nation: 'hud', state: 'hs', city: 'housing', school: 'food' },
    housing: { nation: 'hud', state: 'hs', city: 'housing' },
    env: { nation: 'epa', state: 'env', city: 'water', school: 'facil' },
    water: { nation: 'epa', state: 'env', city: 'water', school: 'facil' },
    fire: { nation: 'dhs', state: 'env', city: 'fire' },
    admin: { nation: 'treas', state: 'gen', city: 'admin', school: 'admin' },
    econ: { nation: 'doc', state: 'gen', city: 'econ' },
    defense: { nation: 'dod' }, border: { nation: 'dhs' }, vets: { nation: 'va' }, farm: { nation: 'usda', state: 'gen' },
  };
  function agencyOf(J, key) {
    if (!J || !J.F) return null;
    const direct = J.F.ag.find((a) => a.k === key);
    if (direct) return direct;
    const m = SEM[key] && SEM[key][J.k];
    return m ? J.F.ag.find((a) => a.k === m) || null : null;
  }
  const CR_NAME = (k) => (GR.CRISIS_TYPES[k] ? GR.CRISIS_TYPES[k].name.replace(/ crisis$/i, '') : k);

  // Apply an effects object. Returns impact chips: [{t, good}].
  function apply(s, fx, o = {}) {
    if (!fx) return [];
    const me = s.pols.me;
    const c = o.ctx || ctx(s);
    const J = o.J || (c && c.J);
    const m = o.mult != null ? o.mult : c ? c.mult : 1;
    const chips = [];
    const chip = (t, v, goodIfUp = true, digits = 0) => { if (!v) return; const r = U.round(v, digits); if (!r) return; chips.push({ t: `${t} ${r > 0 ? '+' : ''}${r}`, good: (r > 0) === goodIfUp }); };
    if (fx.app) { const v = fx.app * (c && !c.exec ? 0.8 : 1); me.app = U.clamp(me.app + v, 1, 99); chip('Approval', v, true, 1); }
    if (fx.pp) { me.pp += fx.pp; chip('Political points', fx.pp); }
    if (fx.chest) { me.warChest = Math.max(0, me.warChest + fx.chest); chips.push({ t: `War chest ${fx.chest > 0 ? '+' : '−'}${U.money(Math.abs(fx.chest))}`, good: fx.chest > 0 }); }
    if (fx.money) { me.money += fx.money; chips.push({ t: `Savings ${fx.money > 0 ? '+' : '−'}${U.money(Math.abs(fx.money))}`, good: fx.money > 0 }); }
    if (fx.hours) { s.hoursLeft = Math.max(0, s.hoursLeft + fx.hours); chip('Hours', fx.hours); }
    if (fx.scan) { me.scandal = Math.max(0, (me.scandal || 0) + fx.scan); chip('Scandal', fx.scan, false); }
    if (fx.integ) { me.integrity = U.clamp((me.integrity || 70) + fx.integ, 0, 100); chip('Integrity', fx.integ); }
    if (fx.stand) { me.standing = U.clamp(me.standing + fx.stand, 0, 100); chip('Party standing', fx.stand); }
    if (fx.resp) { G().addRespect(s, fx.resp); chip('Respect', fx.resp); }
    if (fx.rec) { const tier = c ? c.off.tier : 'local'; if (tier === 'national') me.recNat = U.clamp(me.recNat + fx.rec, 0, 100); else if (tier === 'state') me.recState = U.clamp(me.recState + fx.rec, 0, 100); else me.recLocal = U.clamp(me.recLocal + fx.rec, 0, 100); chip('Name recognition', fx.rec); }
    if (fx.pw) Object.entries(fx.pw).forEach(([k, v]) => { if (PW().shift(s, k, v)) { const d = PW().defs(s).find((x) => x.k === k); chip(d ? d.name.split(' (')[0] : k, v); } });
    if (J && J.F) {
      const F = J.F;
      if (fx.cr) Object.entries(fx.cr).forEach(([k, v]) => { const cr = F.crises[k]; if (!cr) return; const d = v * m; cr.s = U.clamp(cr.s + d, 0, 100); chip(CR_NAME(k), d, false, 1); });
      if (fx.ag) Object.entries(fx.ag).forEach(([k, e]) => {
        const a = agencyOf(J, k);
        if (!a) return;
        if (e.eff) { a.eff = U.clamp(a.eff + e.eff * m, 5, 98); chip(`${a.abbr} audit rating`, e.eff * m, true, 1); }
        if (e.app) a.app = U.clamp(a.app + e.app * m, 0, 100);
        if (e.deg) { a.deg = U.clamp(a.deg + e.deg * m, 0, 100); chip(`${a.abbr} degradation`, e.deg * m, false, 1); }
        if (e.op) { a.opex *= 1 + e.op * m / 100; chip(`${a.abbr} operations %`, e.op * m, true, 1); }
        if (e.cap) { a.capex *= 1 + e.cap * m / 100; chip(`${a.abbr} capital %`, e.cap * m, true, 1); }
      });
      if (fx.cost) {
        const amt = fx.cost * m * GR.fisc.totals(J).spend;
        pay(J, amt);
        chips.push({ t: `${amt >= 0 ? 'Cost' : 'Revenue'} ${U.money(Math.abs(amt))}`, good: amt < 0 });
        // A balanced budget means it has to come from somewhere: ask where.
        if (amt > 0 && F.lvl !== 'nation' && !o.noAsk) payFrom(s, J, amt, o.what);
      }
      if (fx.gap) { F.mac.gap += fx.gap * m; chip('Economy', fx.gap * m * 10, true, 1); }
      if (fx.jobs && GR.develop) { const k = fx.jobs * m * (J.k === 'city' ? 0.5 : 1); GR.develop.addJobs(J, k); chips.push({ t: `Jobs +${U.num(Math.round(k * 1000))}`, good: true }); }
    }
    if (fx.xrel && J) { const ex = G().execOf(s, J.k); if (ex && !ex.isPlayer) { G().addRel(s, ex.id, fx.xrel); chip(`Relationship with ${W().fullName(ex)}`, fx.xrel); } }
    if (fx.pitch && GR.develop) { s.devPitch = { j: J ? J.k : 'state', w: s.week }; chips.push({ t: 'Next company steered to your district', good: true }); }
    if (fx.flag) { s.flags = s.flags || {}; s.flags[fx.flag] = s.week; }
    return chips;
  }
  // One-time spending (positive) or revenue (negative) for a government.
  // A cost that came up mid-year: it is fronted from the rainy-day fund, then you decide where it really comes from.
  function payFrom(s, J, amt, what) {
    const F = J.F;
    const big = F.ag.filter((a) => a.opex > amt * 5).sort((a, b) => b.opex - a.opex).slice(0, 2);
    const cap = U.sum(F.ag, (a) => a.capex);
    post(s, { jur: J.k, kicker: `Budget office · ${J.name}`, title: `Paying for it: ${U.money(amt)}`,
      text: `${what ? `“${what}” costs` : 'That decision costs'} ${U.money(amt)} this year, and the budget must balance. For now it has been fronted from the rainy-day fund (${U.money(F.reserve)} left). Where should it really come from?`,
      choices: [
        { label: 'Leave it on the rainy-day fund', fx: {}, res: 'The reserve covers it. Rating agencies watch how fast it is shrinking.', run: 'payKeep', args: { jur: J.k, amt } },
        { label: 'Agencies absorb it: small cuts across the board', fx: { pw: { labor: -2 } }, run: 'payAbsorb', args: { jur: J.k, amt } },
        cap > amt * 3 ? { label: 'Delay construction projects to cover it', fx: { pw: { business: -1 } }, run: 'payDelay', args: { jur: J.k, amt } } : null,
      ].concat(big.map((a) => ({ label: `Take it out of ${a.abbr}'s budget`, fx: {}, run: 'payAg', args: { jur: J.k, amt, ag: a.k } }))).filter(Boolean) });
  }

  function pay(J, amt) {
    const F = J.F;
    if (F.lvl === 'nation') { F.debt += amt; return; }
    F.reserve -= amt;
    if (F.reserve < 0) { F.debt += -F.reserve; F.reserve = 0; }
  }

  // ---------- The queue ----------
  function canPay(s, fx) {
    const me = s.pols.me;
    if (!fx) return true;
    if (fx.pp < 0 && me.pp < -fx.pp) return false;
    if (fx.chest < 0 && me.warChest < -fx.chest) return false;
    if (fx.money < 0 && me.money < -fx.money) return false;
    if (fx.hours < 0 && s.hoursLeft < -fx.hours) return false;
    return true;
  }
  function reqText(fx) {
    if (!fx) return '';
    const r = [];
    if (fx.pp < 0) r.push(`${-fx.pp} PP`);
    if (fx.chest < 0) r.push(U.money(-fx.chest) + ' war chest');
    if (fx.money < 0) r.push(U.money(-fx.money));
    if (fx.hours < 0) r.push(`${-fx.hours}h`);
    return r.length ? ` (${r.join(', ')})` : '';
  }

  // Post a scene. choices: [{label, fx, res, run, args}] or the compact [label, fx, res] form.
  function post(s, sc) {
    const c = ctx(s);
    const choices = sc.choices.map((x) => (Array.isArray(x) ? { label: x[0], fx: x[1], res: x[2] } : x));
    const kicker = sc.kicker || (c ? (c.exec ? `As ${c.title}` : sc.home ? `Back home · ${c.title}` : `${c.title} · where do you stand?`) : '');
    const it = GR.sim.inbox(s, {
      title: sc.title, kind: 'scene',
      body: `${kicker ? kicker + '\n\n' : ''}${sc.text}`,
      choices: choices.map((ch, i) => ({ label: ch.label + reqText(ch.fx), act: `sc:${i}`, dis: !canPay(s, ch.fx) })),
      data: { sc: { choices, jur: sc.jur || (c && c.jur), mult: sc.mult, key: sc.key } },
    });
    if (sc.key) { s.seen = s.seen || {}; s.seen[sc.key] = s.week; }
    return it;
  }

  function resolve(s, it, i) {
    const sc = it.data && it.data.sc;
    if (!sc) return '';
    const ch = sc.choices[i];
    if (!ch) return '';
    if (!canPay(s, ch.fx)) return 'You cannot afford that right now.';
    const c = ctx(s);
    const J = sc.jur ? s.jur[sc.jur] : c && c.J;
    const chips = apply(s, ch.fx, { J, mult: sc.mult != null ? sc.mult : c ? c.mult : 1, what: `${it.title}: ${ch.label}` });
    let res = ch.res || '';
    if (ch.run && RUN[ch.run]) { const r = RUN[ch.run](s, ch.args || {}, chips); if (typeof r === 'string') res = r; }
    it.chips = chips;
    return res + (chips.length ? '\n' + chips.map((x) => x.t).join(' · ') : '');
  }

  // ---------- Timed follow-ups (recall votes, trials, ribbon cuttings) ----------
  function later(s, weeks, run, args) { s.timed = s.timed || []; s.timed.push({ w: s.week + weeks, run, args }); }
  function timed(s) {
    if (!s.timed || !s.timed.length) return;
    const due = s.timed.filter((t) => t.w <= s.week);
    s.timed = s.timed.filter((t) => t.w > s.week);
    due.forEach((t) => { if (RUN[t.run]) RUN[t.run](s, t.args || {}); });
  }

  // ---------- Named outcomes ----------
  const RUN = {};
  // Where a mid-year cost comes from. The fund fronted it; these pay the fund back.
  const refill = (J, amt) => { J.F.reserve += amt; };
  RUN.payKeep = () => {};
  RUN.payAbsorb = (s, a) => { const J = s.jur[a.jur]; const op = U.sum(J.F.ag, (x) => x.opex); J.F.ag.forEach((x) => { x.opex -= a.amt * x.opex / Math.max(1, op); }); refill(J, a.amt); return `Agencies trim ${(a.amt / op * 100).toFixed(2)}% from operations to cover it. The rainy-day fund is made whole.`; };
  RUN.payDelay = (s, a) => { const J = s.jur[a.jur]; const cap = U.sum(J.F.ag, (x) => x.capex); J.F.ag.forEach((x) => { x.capex -= a.amt * x.capex / Math.max(1, cap); }); refill(J, a.amt); return `Projects slip to cover it (${(a.amt / cap * 100).toFixed(1)}% of capital spending). Roads and buildings wait a little longer.`; };
  RUN.payAg = (s, a) => { const J = s.jur[a.jur]; const x = J.F.ag.find((g) => g.k === a.ag); if (!x) return; x.opex -= a.amt; refill(J, a.amt); GR.sim.news(s, `${x.abbr} absorbs a ${U.money(a.amt)} cut to cover an unplanned cost.`, 'gov'); return `${x.abbr} gives up ${U.money(a.amt)} (${(a.amt / (x.opex + a.amt) * 100).toFixed(1)}% of its operations). Its director is not pleased.`; };
  RUN.recallVote = (s, a) => {
    const me = s.pols.me;
    if (!me.seat || me.seat !== a.seat) return;
    const base = PW().get(s, 'base') || 50, press = PW().get(s, 'press') || 50;
    const p = U.clamp(0.5 + (me.app - 40) / 25 + (base - 50) / 120 + (press - 50) / 150 + (a.fight || 0) * 0.12, 0.05, 0.97);
    const title = W().seatTitle(s, s.seats[me.seat]);
    if (U.chance(p)) {
      const pct = Math.round(52 + p * 16);
      GR.sim.inbox(s, { title: 'You survived the recall', kind: 'result', body: `Voters rejected the recall of the ${title}, ${pct}% to ${100 - pct}%. You come out stronger.` });
      me.app = U.clamp(me.app + 5, 1, 99); PW().shift(s, 'base', 6);
      GR.sim.news(s, `${me.fn} ${me.ln} survives recall election.`, 'gov');
    } else {
      GR.sim.inbox(s, { title: 'Recalled', kind: 'result', body: `Voters removed you from office. A majority voted yes on the recall of the ${title}.` });
      GR.sim.news(s, `${me.fn} ${me.ln} recalled from office.`, 'gov');
      GR.sim.log(s, `Recalled as ${title}.`);
      GR.sim.resign(s);
    }
  };
  RUN.impeach = (s, a) => {
    const me = s.pols.me;
    if (!me.seat) return;
    const off = s.seats[me.seat].off;
    const house = off === 'president' ? 'ushouse' : 'house';
    const senate = off === 'president' ? 'ussenate' : 'senate';
    if (!s.bodies[house]) return;
    const hc = W().composition(s, house), sc = W().composition(s, senate);
    const opp = GR.other(me.party);
    const scan = me.scandal || 0;
    const partyL = PW().get(s, 'party') || 50;
    const hYes = Math.round(hc[opp] * U.clamp(0.75 + scan / 200 - (a.coop ? 0.15 : 0), 0, 1) + hc[me.party] * U.clamp((scan - 40) / 200 + (40 - partyL) / 150, 0, 0.4));
    const hTot = hc.D + hc.R;
    if (hYes <= hTot / 2) { GR.sim.inbox(s, { title: 'Impeachment fails', kind: 'result', body: `The ${GR.BODIES[house].name} voted ${hYes}-${hTot - hYes}. Articles of impeachment fail.` }); PW().shift(s, 'base', 8); return; }
    const sTot = sc.D + sc.R;
    const need = Math.ceil(sTot * 2 / 3);
    const sYes = Math.round(sc[opp] * U.clamp(0.85 + scan / 300, 0, 1) + sc[me.party] * U.clamp((scan - 50) / 150 + (35 - partyL) / 120, 0, 0.6));
    if (sYes >= need) {
      GR.sim.inbox(s, { title: 'Removed from office', kind: 'result', body: `Impeached ${hYes}-${hTot - hYes} and convicted in the ${GR.BODIES[senate] ? GR.BODIES[senate].name : 'Senate'} ${sYes}-${sTot - sYes}. You are removed from office.` });
      GR.sim.news(s, `${me.fn} ${me.ln} removed from office after impeachment trial.`, 'gov');
      me.scandal = (me.scandal || 0) + 20;
      GR.sim.resign(s);
    } else {
      GR.sim.inbox(s, { title: 'Acquitted', kind: 'result', body: `Impeached ${hYes}-${hTot - hYes}, but the Senate vote of ${sYes}-${sTot - sYes} fell short of the ${need} needed to convict.` });
      me.app = U.clamp(me.app - 3, 1, 99); PW().shift(s, 'base', 10); PW().shift(s, 'press', -8);
    }
  };
  RUN.trial = (s, a) => {
    const me = s.pols.me;
    const p = U.clamp(0.25 + (me.scandal || 0) / 150 - ((me.integrity || 50) - 40) / 120 - (a.lawyers ? 0.15 : 0), 0.05, 0.9);
    if (U.chance(p)) {
      GR.sim.inbox(s, { title: 'Convicted', kind: 'result', body: 'A jury found you guilty. You must leave office.' });
      GR.sim.news(s, `${me.fn} ${me.ln} convicted on corruption charges.`, 'gov');
      me.money -= 40000; me.integrity = Math.max(0, (me.integrity || 50) - 25);
      if (me.seat) GR.sim.resign(s);
    } else {
      GR.sim.inbox(s, { title: 'Acquitted', kind: 'result', body: 'The jury acquitted you on all counts.' });
      me.scandal = Math.max(0, (me.scandal || 0) - 20);
    }
  };
  RUN.ouster = (s) => {
    const me = s.pols.me;
    if (!me.lead) return;
    const partyL = PW().get(s, 'party') || 50;
    if (U.chance(U.clamp(0.7 - partyL / 60, 0.1, 0.9))) {
      const B = s.bodies[me.lead.body];
      const post = GR.LEADERSHIP[me.lead.body].find((x) => x.k === me.lead.post);
      if (B) delete B.lead[me.lead.post];
      me.lead = null;
      GR.sim.inbox(s, { title: 'Ousted from leadership', kind: 'result', body: `Your caucus voted to remove you as ${post ? post.name : 'leader'}.` });
      GR.sim.news(s, `${me.fn} ${me.ln} ousted from leadership.`, 'gov');
    } else GR.sim.inbox(s, { title: 'You hold on', kind: 'result', body: 'The motion to remove you failed. Your caucus is restless but you survive.' });
  };
  RUN.primary = (s, a) => { s.primaryThreat = U.clamp((s.primaryThreat || 0) + (a.add || 0.5), 0, 1.2); };
  RUN.later = (s, a) => { later(s, a.weeks, a.then, a.args); };

  // ---------- Generic, data-driven scenes ----------
  function hazard(s) { return U.pick((GR.STATE_LEGACY_HAZ[s.home.state] || ['A severe storm'])); }
  function worstCrisis(J) { return Object.entries(J.F.crises).sort((a, b) => b[1].s - a[1].s)[0]; }
  function countyName(s) { return s.home.county ? s.home.county + ' County' : 'the county'; }

  const GEN = {
    school: [
      (s, c) => ({ key: 'sch_books', title: 'A book challenge', text: `Parents at ${s.home.cityName} High want a novel with sexual content pulled from the library. The meeting is packed.`, choices: [['Remove it pending review', { pw: { parents: 8, teachers: -6, press: -3 } }, 'The book is pulled.'], ['Keep it; parents can opt out', { pw: { parents: -8, teachers: 4, press: 2 } }, 'The opt-out policy holds.'], ['Create a review committee', { hours: -3, pw: { parents: 2 } }, 'A committee is formed.']] }),
      (s, c) => ({ key: 'sch_strike', title: 'Teachers threaten to strike', text: 'The union wants an 8% raise and smaller classes. The district says it cannot afford it without cuts.', choices: [['Meet them at 6%', { cost: 0.02, pw: { teachers: 10, taxpayers: -6 }, cr: { education: -1 } }, 'A deal is struck.'], ['Hold at 3%', { pw: { teachers: -12, taxpayers: 6 } }, 'Picket lines form.'], ['Go to mediation', { hours: -4, pw: { teachers: 2 } }, 'Talks continue.']] }),
      (s, c) => ({ key: 'sch_close', title: 'Enrollment is falling', text: `Enrollment has dropped 12% since 2019. Two elementary schools are half empty.`, choices: [['Close and consolidate', { cost: -0.02, pw: { parents: -10, teachers: -4 }, ag: { facil: { deg: -3 } } }, 'Families protest the closures.'], ['Keep them open', { cost: 0.01, pw: { parents: 4, taxpayers: -4 } }, 'The budget gap grows.']] }),
      (s, c) => ({ key: 'sch_phones', title: 'Cell phone ban', text: 'Teachers want phones locked away during the school day.', choices: [['Bell-to-bell ban', { pw: { teachers: 6, parents: 2 }, cr: { education: -1 } }, 'Lunchrooms are loud again.'], ['Leave it to each school', { pw: { teachers: -2 } }, 'Nothing changes.']] }),
      (s, c) => ({ key: 'sch_mold', title: 'Mold in the classrooms', text: 'Inspectors found mold and failing HVAC systems in three buildings.', choices: [['Emergency repairs', { cost: 0.015, ag: { facil: { deg: -6 } }, pw: { parents: 4 } }, 'Students move to portables for a month.'], ['Put a bond on the ballot', { pw: { taxpayers: -4 } }, 'The vote is in November.']] }),
      (s, c) => ({ key: 'sch_scores', title: 'Test scores drop', text: 'State test results show reading proficiency down again.', choices: [['Science of reading curriculum and tutors', { cost: 0.01, cr: { education: -2 }, pw: { parents: 4 } }, 'Phonics is back.'], ['Blame the state test', { pw: { teachers: 3, parents: -5 } }, 'Parents are unconvinced.']] }),
    ],
    city: [
      (s, c) => ({ key: 'city_main', title: 'A water main breaks', text: `A 100-year-old main burst downtown, flooding streets and leaving neighborhoods without water. The utility says a third of ${s.home.cityName}'s pipes are past their life.`, choices: [['Accelerate pipe replacement', { cost: 0.01, ag: { water: { deg: -6 } }, cr: { infra: -2 }, app: 1 }, 'Rates go up to pay for it.'], ['Patch and move on', { cost: 0.001, cr: { infra: 1 } }, 'Another one will break.']] }),
      (s, c) => ({ key: 'city_video', title: 'A police video', text: 'Body camera footage shows officers violently arresting an unarmed man. Protesters are gathering outside City Hall.', choices: [['Release the video and suspend the officers', { pw: { police: -10, press: 6 }, app: 1 }, 'Protests stay peaceful.'], ['Wait for the investigation', { pw: { police: 4, press: -6 }, app: -2 }, 'Protests grow.'], ['Civilian oversight board', { hours: -4, pw: { police: -6, press: 4 } }, 'A new board is created.']] }),
      (s, c) => ({ key: 'city_rezone', title: 'A developer wants to build', text: `A developer proposes 400 apartments on a strip mall site. Neighbors are furious about traffic and height.`, choices: [['Approve it', { cr: { housing: -2 }, pw: { business: 6, neighborhoods: -10 }, jobs: 0.3 }, 'Cranes go up next spring.'], ['Cut it to 150 units', { cr: { housing: -1 }, pw: { business: -3, neighborhoods: 3 } }, 'The developer grumbles.'], ['Reject it', { pw: { business: -8, neighborhoods: 8 }, cr: { housing: 1 } }, 'The lot stays a strip mall.']] }),
      (s, c) => ({ key: 'city_potholes', title: 'Pothole season', text: 'Residents filed 10,000 pothole complaints this spring. A viral video shows a car disappearing into one.', choices: [['Pothole blitz', { cost: 0.004, ag: { roads: { deg: -4 } }, pw: { neighborhoods: 6 } }, 'Crews work overtime.'], ['Repave the worst corridors', { cost: 0.01, ag: { roads: { deg: -8 } }, cr: { infra: -2 } }, 'A five-year plan.']] }),
      (s, c) => ({ key: 'city_union', title: 'City union contract', text: 'The firefighters and sanitation workers want raises to match inflation.', choices: [['Give them raises', { cost: 0.01, pw: { labor: 10, taxpayers: -4 } }, 'Contracts are signed.'], ['Offer less and risk a slowdown', { pw: { labor: -10 } }, 'Trash piles up.']] }),
      (s, c) => ({ key: 'city_camp', title: 'An encampment in the park', text: 'Tents fill the city\'s main park. Business owners demand action.', choices: [['Clear it with shelter beds', { cost: 0.003, cr: { homeless: -1 }, pw: { business: 6, press: -2 } }, 'The park reopens.'], ['Permanent supportive housing', { cost: 0.008, cr: { homeless: -2, housing: -1 } }, 'A motel conversion begins.']] }),
      (s, c) => ({ key: 'city_cyber', title: 'Ransomware hits City Hall', text: 'Hackers encrypted city systems and demand $2 million in bitcoin. Permits, payroll and 911 dispatch are affected.', choices: [['Refuse and rebuild', { cost: 0.004, ag: { admin: { eff: 4 } }, app: -1 }, 'Weeks of paper forms.'], ['Pay the ransom', { cost: 0.001, scan: 3, pw: { press: -6 } }, 'Systems come back fast. The press is not kind.']] }),
      (s, c) => ({ key: 'city_haz', title: `${hazard(s)} hits ${s.home.cityName}`, text: `Emergency crews are stretched and hundreds of homes are damaged across ${countyName(s)}.`, choices: [['Lead the response on the ground', { hours: -8, cost: 0.004, app: 4, cr: { disaster: -1 } }, 'Your leadership earns praise.'], ['Request state and federal aid', { cost: 0.001, app: 1 }, 'Help arrives in a week.']] }),
    ],
    state: [
      (s, c) => { const a = agencyOf(c.J, 'roads'); return { key: 'st_dmv', title: `Backlogs at ${a ? a.abbr : 'the transportation department'}`, text: `${a ? a.name : 'The agency'} is months behind on licenses, permits and contracts. Lawmakers are getting angry calls.`, choices: [['Emergency staffing and new software', { cost: 0.0008, ag: { roads: { eff: 6, app: 6 } } }, 'Wait times fall.'], ['Audit the agency', { hours: -2, ag: { roads: { eff: 3 } }, pw: { press: 2 } }, 'Auditors find waste.']] }; },
      (s, c) => { const a = agencyOf(c.J, 'prisons'); return { key: 'st_prison', title: `Violence in the ${a ? a.abbr : 'state'} prisons`, text: `Understaffed prisons run by ${a ? a.name : 'the corrections department'} saw a riot and three deaths this month.`, choices: [['Raise guard pay and hire', { cost: 0.0015, ag: { prisons: { eff: 5, op: 4 } }, pw: { police: 4 } }, 'Vacancies fall.'], ['Early release for elderly and low-risk inmates', { ag: { prisons: { op: -2 } }, pw: { police: -6 }, cr: { crime: 1 } }, 'Prison population falls.']] }; },
      (s, c) => { const a = agencyOf(c.J, 'colleges'); return { key: 'st_tuition', title: 'Tuition protest', text: `Students at ${a ? a.name : 'the state universities'} are protesting a 9% tuition increase.`, choices: [['Buy down the increase', { cost: 0.001, pw: { teachers: 3 }, cr: { migration: -1 } }, 'Tuition rises 3%.'], ['Let it stand', { pw: { press: -2 }, cr: { migration: 1 } }, 'Students rally at the Capitol.']] }; },
      (s, c) => { const a = agencyOf(c.J, 'health'); return { key: 'st_medicaid', title: 'Medicaid paperwork purge', text: `${a ? a.name : 'The Medicaid agency'} dropped thousands of eligible people for paperwork reasons during renewals.`, choices: [['Pause disenrollments and fix the system', { cost: 0.0008, cr: { health: -1 }, ag: { health: { eff: 3 } } }, 'Coverage is restored.'], ['Proceed: they can reapply', { cr: { health: 2 }, pw: { taxpayers: 3, press: -3 } }, 'Hospitals see more uninsured patients.']] }; },
      (s, c) => { const w = worstCrisis(c.J); const T = GR.CRISIS_TYPES[w[0]]; return { key: 'st_worst_' + w[0], title: `${T.name}: a breaking point`, text: `A new report says ${GR.STATE[s.home.state].name}'s ${T.name.toLowerCase()} is among the worst in the country (severity ${Math.round(w[1].s)}). Every paper in the state ran it on the front page.`, choices: [['Declare an emergency and fund a response', { cost: 0.003, cr: { [w[0]]: -4 }, app: 2 }, 'A task force is formed.'], ['Appoint a blue-ribbon commission', { hours: -2, cr: { [w[0]]: -1 } }, 'A report is due next year.'], ['Push back on the rankings', { pw: { press: -4 } }, 'Critics call it denial.']] }; },
      (s, c) => ({ key: 'st_haz', title: `${hazard(s)} hits ${GR.STATE[s.home.state].name}`, text: 'Thousands are displaced. Local officials want the state to step in.', choices: [['State of emergency and the National Guard', { cost: 0.002, cr: { disaster: -1 }, app: 3, pw: { local: 6 } }, 'The response is swift.'], ['Ask for a federal disaster declaration', { app: 1 }, 'FEMA approves it in ten days.']] }),
      (s, c) => ({ key: 'st_lobby', title: 'A lobbyist\'s dinner', text: 'A lobbyist for a utility invites you to a private dinner and mentions a generous PAC.', choices: [['Go and take the money', { chest: 25000, scan: 4, integ: -4, pw: { business: 4 } }, 'Your war chest grows.'], ['Decline', { integ: 2, pw: { press: 1 } }, 'You stay clean.']] }),
    ],
    nation: [
      (s, c) => ({ key: 'n_fed', title: 'Choose a Federal Reserve chair', text: 'The Fed chair\'s term is ending. Markets are watching.', choices: [['Reappoint the incumbent', { pw: { business: 6 }, gap: 0 }, 'Markets rally.'], ['A dove who will cut rates', { gap: 0.3, pw: { labor: 4, business: -4 } }, 'Bond yields jump.'], ['A hawk to fight inflation', { gap: -0.3, pw: { donors: 4, labor: -4 } }, 'Stocks wobble.']] }),
      (s, c) => ({ key: 'n_ports', title: 'Port strike', text: 'Dockworkers walked off the job at every East and Gulf Coast port. Shelves are emptying.', choices: [['Invoke Taft-Hartley', { gap: 0.1, pw: { labor: -12, business: 8 } }, 'The ports reopen under court order.'], ['Broker a deal at the White House', { hours: -6, pw: { labor: 8, business: -2 } }, 'A raise and limits on automation.'], ['Stay out of it', { gap: -0.2, app: -2 }, 'The strike drags on for weeks.']] }),
      (s, c) => ({ key: 'n_bank', title: 'A bank run', text: 'A large regional bank collapsed overnight after depositors pulled billions.', choices: [['Guarantee all deposits', { pw: { business: 6, base: -4 }, gap: 0.1 }, 'The panic ends.'], ['Only insured deposits', { gap: -0.3, pw: { donors: -6 } }, 'Two more banks wobble.']] }),
      (s, c) => ({ key: 'n_cyber', title: 'Cyberattack on the power grid', text: 'Foreign hackers knocked out power across three states.', choices: [['Retaliate in cyberspace', { pw: { military: 6 }, app: 2 }, 'The attacks stop, for now.'], ['Harden the grid', { cost: 0.0005, ag: { dhs: { eff: 4 } } }, 'A long-term fix.']] }),
      (s, c) => ({ key: 'n_hurricane', title: 'A major hurricane', text: 'A Category 4 storm devastated the Gulf Coast. FEMA is stretched thin.', choices: [['Go to the disaster zone and surge FEMA', { hours: -8, cost: 0.002, app: 4 }, 'Your response wins praise.'], ['Approve aid from Washington', { cost: 0.001, app: 1 }, 'Help is slow.']] }),
      (s, c) => ({ key: 'n_outbreak', title: 'A new virus spreads', text: 'A novel respiratory virus is spreading in three cities. The CDC wants guidance.', choices: [['Testing and vaccine push', { cost: 0.0008, ag: { hhs: { eff: 3 } }, app: 2 }, 'Cases peak quickly.'], ['Downplay it to protect the economy', { gap: 0.1, scan: 3, pw: { press: -6 } }, 'Cases climb.']] }),
      (s, c) => ({ key: 'n_ai', title: 'AI safety standoff', text: 'AI labs warn about dangerous capabilities; tech CEOs want no new rules.', choices: [['Executive order on frontier AI testing', { pw: { business: -4, press: 4 } }, 'Labs agree to share test results.'], ['Light-touch voluntary commitments', { pw: { business: 6 } }, 'Critics say it is toothless.']] }),
      (s, c) => ({ key: 'n_shooting', title: 'A mass shooting', text: 'A gunman killed 14 people at a shopping mall. The country demands answers.', choices: [['Push for universal background checks', { pw: { base: c.me.party === 'R' ? -8 : 6 }, app: 2 }, 'The bill heads to Congress.'], ['Focus on mental health and school security', { pw: { base: c.me.party === 'R' ? 4 : -6 } }, 'A narrower package.']] }),
      (s, c) => ({ key: 'n_border', title: 'A surge at the border', text: 'Crossings spiked to the highest level in two years.', choices: [['Emergency border deployment', { cost: 0.0004, ag: { border: { op: 3 } }, pw: { base: c.me.party === 'R' ? 8 : -4 } }, 'Crossings fall.'], ['Speed up asylum courts', { cost: 0.0003, ag: { border: { eff: 4 } } }, 'Backlogs shrink slowly.']] }),
    ],
    legis: [
      (s, c) => ({ key: 'lg_whip', title: 'Leadership demands your vote', text: 'Your party\'s leaders need your vote on a procedural motion your district dislikes.', choices: [['Vote with leadership', { stand: 4, pw: { party: 6 }, app: -1 }, 'Leadership owes you one.'], ['Vote your district', { stand: -4, pw: { party: -6 }, app: 2 }, 'The whip is not pleased.']] }),
      (s, c) => ({ key: 'lg_mayor', title: 'A mayor needs a project', text: 'A mayor in your district asks you to get money for a new water treatment plant.', choices: [['Push for it in the budget', { pp: -5, pw: { local: 8 }, app: 1 }, 'You promise to fight for it.'], ['Explain the budget is tight', { pw: { local: -4 } }, 'The mayor is disappointed.']] }),
      (s, c) => {
        const ex = G().execOf(s, c.jur);
        if (!ex || ex.isPlayer || !['senate', 'ussenate'].includes(c.body)) return null;
        const a = U.pick(c.J.F.ag);
        const title = c.jur === 'nation' ? ({ dod: 'Secretary of Defense', doj: 'Attorney General', state: 'Secretary of State', treas: 'Secretary of the Treasury', hhs: 'Secretary of Health and Human Services', dhs: 'Secretary of Homeland Security' }[a.k] || `head of ${a.abbr}`) : `director of ${a.abbr}`;
        const g = U.chance(0.5) ? 'f' : 'm';
        const nom = `${U.pick(GR.NAMES[g])} ${U.pick(GR.NAMES.l)}`;
        const same = ex.party === c.me.party;
        const flaw = U.pick(['a thin résumé and close ties to the governor\'s donors', 'past comments that offended many voters', 'a strong record but a lobbying past', 'solid experience and bipartisan praise']);
        return { key: 'lg_confirm_' + a.k, title: `Confirmation vote: ${nom}`, text: `${W().fullName(ex)} (${ex.party}) nominated ${nom} as ${title} (${a.name}). The nominee has ${flaw}. ${same ? 'Your party expects your vote.' : 'The other party\'s leaders want you to oppose.'}`, choices: [
          ['Vote to confirm', { xrel: 6, stand: same ? 2 : -3, pw: { party: same ? 3 : -4, press: flaw.startsWith('solid') ? 1 : -2 } }, 'The nominee is confirmed.'],
          ['Vote no', { xrel: -8, stand: same ? -5 : 3, pw: { party: same ? -6 : 4, press: flaw.startsWith('solid') ? -1 : 3 } }, 'You put your no on the record.'],
          ['Trade your vote for a project in your district', { xrel: 2, pp: -4, pw: { local: 6 }, pitch: 1 }, 'The administration promises to remember your district.'],
        ] };
      },
      (s, c) => {
        const a = c.J.F.ag.slice().sort((x, y) => (x.eff - x.deg) - (y.eff - y.deg))[0];
        if (!a) return null;
        const ex = G().execOf(s, c.jur);
        const same = ex && ex.party === c.me.party;
        return { key: 'lg_oversight_' + a.k, title: `Oversight hearing: ${a.abbr}`, text: `${a.name} has an audit rating of ${Math.round(a.eff)} and a degradation index of ${Math.round(a.deg)}. Your committee called its leadership to testify.${ex ? ` They answer to ${W().fullName(ex)} (${ex.party}).` : ''}`, choices: [
          ['Grill them on camera', { rec: 2, pw: { press: 5, party: same ? -4 : 3 }, ag: { [a.k]: { eff: 4 } }, xrel: same ? -4 : -6 }, 'The clip goes viral. The agency promises reforms.'],
          ['Subpoena their records', { pw: { press: 6, party: same ? -6 : 4 }, ag: { [a.k]: { eff: 6 } }, xrel: -10, hours: -3 }, 'Documents reveal waste. Reforms follow.'],
          ['Go easy and work behind the scenes', { pw: { party: same ? 3 : -1 }, ag: { [a.k]: { eff: 2 } }, xrel: 3 }, 'The agency appreciates the quiet help.'],
        ] };
      },
      (s, c) => ({ key: 'lg_scout', title: 'A company is scouting your district', text: `Site selectors for a ${U.pick(['battery plant', 'distribution center', 'data center', 'hospital network', 'food processing plant', 'aerospace supplier'])} are touring sites in your district. The ${c.jur === 'city' ? 'mayor\'s' : c.jur === 'state' ? 'governor\'s' : 'administration\'s'} economic development team is deciding where to steer them.`, choices: [
        ['Lobby the executive hard', { pp: -6, hours: -2, pitch: 1, xrel: 2 }, 'Your district is at the top of their list.'],
        ['Host the tour yourself', { hours: -3, pw: { local: 4, business: 3 }, pitch: 1 }, 'Local leaders appreciate it.'],
        ['Let it play out', {}, 'They look at other districts too.'],
      ] }),
      (s, c) => ({ key: 'lg_leak', title: 'A reporter calls about a colleague', text: 'A reporter is digging into a colleague\'s shady contracts and wants you on background.', choices: [['Talk to the reporter', { pw: { press: 6, party: -6 }, integ: 2 }, 'The story runs.'], ['Decline to comment', { pw: { party: 2 } }, 'You stay out of it.']] }),
    ],
  };

  // Scenes from the dossiers for your state or city.
  function regional(s, c) {
    const out = [];
    const take = (arr, tag, home) => (arr || []).forEach((x, i) => out.push({ key: `${tag}_${i}`, title: x[0], text: x[1], choices: x[2], home }));
    if (c.jur === 'state') take((PW().stateDossier(s) || {}).scenes, 'R' + s.home.state);
    if (c.jur === 'city') take((PW().cityDossier(s) || {}).scenes, 'C' + PW().cityKey(s));
    if (c.jur === 'nation' && c.off.k !== 'president') take((PW().stateDossier(s) || {}).scenes, 'R' + s.home.state, true);
    return out;
  }

  // Weekly: maybe one scene.
  function week(s) {
    timed(s);
    // Unanswered decisions resolve themselves after six weeks: the last option, usually doing nothing.
    s.inbox.forEach((it) => {
      if (it.kind !== 'scene' || it.done || it.answered || s.week - it.w < 6 || !it.data || !it.data.sc) return;
      const i = it.data.sc.choices.length - 1;
      const out = resolve(s, it, i);
      it.body += '\n\n→ You never decided. ' + it.data.sc.choices[i].label + '. ' + out;
      it.choices = [{ label: 'OK', act: 'close' }];
      it.answered = true;
    });
    const c = ctx(s);
    if (!c) return;
    if (s.inbox.filter((x) => !x.done && !x.answered && x.kind === 'scene').length >= 2) return;
    if (!U.chance(c.exec ? 0.16 : 0.09)) return;
    const seen = s.seen || {};
    const fresh = (sc) => sc && (!seen[sc.key] || s.week - seen[sc.key] > 156);
    let pool = regional(s, c).filter(fresh);
    const gens = (GEN[c.jur] || []).concat(c.exec ? [] : GEN.legis);
    const gpool = gens.map((f) => f(s, c)).filter((x) => x && fresh(x));
    // Regional scenes come first; generic ones fill in.
    const pick = pool.length && U.chance(0.6) ? U.pick(pool) : gpool.length ? U.pick(gpool) : U.pick(pool);
    if (!pick) return;
    if (pick.home) { pick.kicker = `Back home in ${GR.STATE[s.home.state].name}`; pick.jur = 'state'; pick.mult = 0; }
    post(s, pick);
  }

  // Monthly: threats to your hold on office.
  const RECALL_STATES = ['AK', 'AZ', 'CA', 'CO', 'GA', 'ID', 'KS', 'LA', 'MI', 'MN', 'MT', 'NV', 'NJ', 'ND', 'OR', 'WA', 'WI', 'IL', 'RI', 'VA'];
  function month(s) {
    const c = ctx(s);
    if (!c) return;
    const me = c.me;
    s.threat = s.threat || {};
    const T = s.threat;
    const base = PW().get(s, 'base'), party = PW().get(s, 'party'), press = PW().get(s, 'press');
    const y = U.yearOf(s.week);
    const nextElect = c.seat.next || y + 2;
    // Primary challenger.
    if (base != null && base < 30 && nextElect - y <= 1 && !T.primary && U.chance(0.35)) {
      T.primary = y;
      post(s, { key: 'th_primary', kicker: 'Party politics', title: 'A primary challenger emerges', text: `A well-funded ${me.party === 'R' ? 'conservative' : 'progressive'} insurgent says you have abandoned the party and will challenge you in the primary. Activists are signing up.`, choices: [
        { label: 'Tack toward the base', fx: { pw: { base: 10, press: -3 }, app: -2 }, res: 'The challenger loses some steam.', run: 'primary', args: { add: 0.2 } },
        { label: 'Build a war chest to bury them', fx: { pp: -10, pw: { donors: 4 } }, res: 'Donors open their wallets.', run: 'primary', args: { add: 0.4 } },
        { label: 'Ignore them', fx: {}, res: 'They file paperwork.', run: 'primary', args: { add: 0.8 } },
      ] });
    }
    // Recall.
    const recallOK = c.jur === 'city' || c.jur === 'school' || (c.jur === 'state' && RECALL_STATES.includes(s.home.state));
    if (recallOK && me.app < 30 && (!T.recall || s.week - T.recall > 104) && nextElect - y >= 1 && U.chance(0.18)) {
      T.recall = s.week;
      post(s, { key: 'th_recall', kicker: 'A threat to your office', title: 'A recall campaign qualifies', text: `Organizers gathered enough signatures to force a recall election against you. The vote is in eight weeks. Your approval is ${Math.round(me.app)}%.`, choices: [
        { label: 'Fight it with everything', fx: { chest: -Math.min(me.warChest, 50000 * c.off.level), hours: -6 }, res: 'Your campaign mobilizes.', run: 'later', args: { weeks: 8, then: 'recallVote', args: { seat: me.seat, fight: 2 } } },
        { label: 'Campaign on your record', fx: { hours: -4 }, res: 'You hit the road.', run: 'later', args: { weeks: 8, then: 'recallVote', args: { seat: me.seat, fight: 1 } } },
        { label: 'Resign before the vote', fx: {}, res: 'You step down.', run: 'resign' },
      ] });
    }
    // Impeachment.
    if ((c.off.k === 'president' || c.off.k === 'governor') && !T.impeach) {
      const house = c.off.k === 'president' ? 'ushouse' : 'house';
      const hostile = s.bodies[house] && W().majority(s, house) !== me.party;
      if (hostile && ((me.scandal || 0) > 40 || (press != null && press < 18 && me.app < 35)) && U.chance(0.2)) {
        T.impeach = s.week;
        post(s, { key: 'th_impeach', kicker: 'Constitutional crisis', title: 'An impeachment inquiry', text: `The opposition majority in the ${GR.BODIES[house].name} has opened an impeachment inquiry. A vote on articles is expected within two months.`, choices: [
          { label: 'Cooperate with the inquiry', fx: { pw: { press: 6, base: -6 } }, res: 'You turn over documents.', run: 'later', args: { weeks: 8, then: 'impeach', args: { coop: true } } },
          { label: 'Stonewall and fight', fx: { pw: { base: 8, press: -8 }, scan: 4 }, res: 'You invoke executive privilege.', run: 'later', args: { weeks: 8, then: 'impeach', args: {} } },
        ] });
      }
    }
    // Indictment.
    if ((me.scandal || 0) > 65 && (me.integrity || 70) < 35 && !T.indict && U.chance(0.12)) {
      T.indict = s.week;
      post(s, { key: 'th_indict', kicker: 'Breaking news', title: 'You are indicted', text: 'A grand jury indicted you on bribery and fraud charges.', choices: [
        { label: 'Fight the charges with top lawyers', fx: { money: -Math.min(me.money, 150000), pw: { base: 4 } }, res: 'Your trial is set.', run: 'later', args: { weeks: 26, then: 'trial', args: { lawyers: true } } },
        { label: 'Plead not guilty and keep working', fx: { pw: { press: -6 } }, res: 'Your trial is set.', run: 'later', args: { weeks: 26, then: 'trial', args: {} } },
        { label: 'Resign and take a plea deal', fx: { scan: -20 }, res: 'You leave office.', run: 'resign' },
      ] });
    }
    // Ouster from leadership.
    if (me.lead && party != null && party < 22 && (!T.ouster || s.week - T.ouster > 52) && U.chance(0.3)) {
      T.ouster = s.week;
      post(s, { key: 'th_ouster', kicker: 'Your caucus', title: 'A motion to remove you', text: 'Disgruntled members of your caucus filed a motion to remove you from leadership.', choices: [
        { label: 'Cut deals to save your post', fx: { pp: -15, pw: { party: 8 } }, res: 'You work the phones all night.', run: 'ouster' },
        { label: 'Call their bluff', fx: {}, res: 'The vote is called.', run: 'ouster' },
      ] });
    }
  }
  RUN.resign = (s) => { const me = s.pols.me; GR.sim.news(s, `${me.fn} ${me.ln} resigns.`, 'gov'); GR.sim.resign(s); return 'You resigned.'; };

  // A challenger the primary threat creates when the race opens.
  function openYearHook(s, year, races) {
    if (!s.primaryThreat) return;
    const me = s.pols.me;
    const r = races.find((x) => x.seat === me.seat);
    if (!r) return;
    const p = W().newPol(s, { party: me.party, lean: r.pr.lean, level: GR.OFFICES[r.off].level, boost: 10 + s.primaryThreat * 25, rec: 20 + s.primaryThreat * 20, z: W().pickZipIn(s, s.seats[r.seat]) });
    p.fis = me.party === 'R' ? Math.max(p.fis, 1.2) : Math.min(p.fis, -1.2);
    p.soc = me.party === 'R' ? Math.max(p.soc, 1.2) : Math.min(p.soc, -1.2);
    GR.elect.addCand(s, r, p);
    GR.sim.msgInbox(s, 'Your primary challenger is official', `${W().fullName(p)} filed to run against you in the ${me.party === 'R' ? 'Republican' : 'Democratic'} primary.`);
    s.primaryThreat = 0;
  }

  // ---------- State of the City / State / Union ----------
  function report(s) {
    const c = ctx(s);
    if (!c) return;
    const J = c.J, F = J.F, H = F.hist;
    const y = U.yearOf(s.week) - 1;
    const old = H.length >= 5 ? H[H.length - 5] : H[0];
    const now = H[H.length - 1];
    if (!old || !now) return;
    const lines = [];
    const dd = (a, b, unit, good) => { const d = b - a; return `${d >= 0 ? '+' : ''}${U.round(d, 1)}${unit} ${(d >= 0) === good ? '✓' : '✗'}`; };
    lines.push(`Economy: growth ${now.g.toFixed(1)}%, unemployment ${now.u.toFixed(1)}% (${dd(old.u, now.u, ' pts', false)}), inflation ${now.pi.toFixed(1)}%.`);
    lines.push(`Budget: ${now.bal >= 0 ? 'surplus' : 'deficit'} of ${U.money(Math.abs(now.bal))}; debt ${U.money(now.debt)}; credit rating ${F.ratingLabel}.`);
    const cr = Object.entries(F.crises).map(([k, v]) => [k, v.s - (v.hist.length >= 5 ? v.hist[v.hist.length - 5] : v.s0)]).sort((a, b) => a[1] - b[1]);
    if (cr.length) {
      const best = cr[0], worst = cr[cr.length - 1];
      if (best[1] < -0.5) lines.push(`Progress: ${GR.CRISIS_TYPES[best[0]].name} improved ${U.round(-best[1], 1)} points.`);
      if (worst[1] > 0.5) lines.push(`Warning: ${GR.CRISIS_TYPES[worst[0]].name} worsened ${U.round(worst[1], 1)} points.`);
    }
    const dev = J.dev;
    if (dev) {
      const opened = (dev.firms || []).filter((f) => f.openY === y);
      if (opened.length) lines.push(`New employers: ${opened.map((f) => `${f.name} (${U.num(Math.round(f.jobs * 1000))} jobs)`).join(', ')}.`);
      const done = (dev.megas || []).filter((p) => p.doneY === y);
      if (done.length) lines.push(`Opened: ${done.map((p) => p.name).join(', ')}.`);
    }
    const laws = (J.laws || []).filter((l) => U.yearOf(l.w) === y);
    lines.push(`Laws enacted last year: ${laws.length}${laws.filter((l) => l.spon === 'me').length ? ` (${laws.filter((l) => l.spon === 'me').length} of them yours)` : ''}.`);
    const wk = PW().weakest(s);
    if (wk) lines.push(`Your weakest base: ${wk.name} (${Math.round(s.power.l[wk.k])}).`);
    const name = c.jur === 'nation' ? 'State of the Union' : c.jur === 'state' ? 'State of the State' : c.jur === 'city' ? 'State of the City' : 'State of the Schools';
    if (c.exec) {
      post(s, { kicker: `${name} · ${y + 1}`, title: `The ${name} address`, text: `Your staff prepared the year in review:\n\n• ${lines.join('\n• ')}\n\nHow will you set the tone?`, choices: [
        { label: 'Optimistic vision for the future', fx: { app: 2, pw: { press: 2 } }, res: 'The speech is well received.' },
        { label: 'Call for bipartisan cooperation', fx: { pw: { press: 4, base: -3 }, resp: 1 }, res: 'The other party applauds, a little.' },
        { label: 'Fire up your party', fx: { pw: { base: 8, party: 4, press: -4 } }, res: 'Your side gives you a standing ovation.' },
        { label: 'Level with them about hard choices', fx: { integ: 3, app: -1, pw: { press: 5 } }, res: 'Editorial boards praise your candor.' },
      ] });
    } else GR.sim.inbox(s, { title: `Your ${y} in review`, kind: 'info', body: `${c.title}\n\n• ${lines.join('\n• ')}` });
  }

  return { ctx, SEM, agencyOf, apply, pay, post, resolve, week, month, report, later, RUN, GEN, openYearHook, canPay };
})();
