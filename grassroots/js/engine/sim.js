// The weekly turn, hours, political points, news/inbox/journal, taking and leaving
// office, death and dynasties.
var GR = globalThis.GR || (globalThis.GR = {});

GR.sim = (function () {
  const U = GR.util;
  const W = () => GR.world;

  // ---------- Messages ----------
  function news(s, t, kind = 'news') { s.news.unshift({ w: s.week, t, kind }); if (s.news.length > 150) s.news.pop(); }
  function log(s, t) { s.log.unshift({ w: s.week, t }); if (s.log.length > 400) s.log.pop(); }
  function msg(cp, t) { if (!cp) return; cp.msgs.unshift(t); if (cp.msgs.length > 8) cp.msgs.pop(); }
  function inbox(s, it) {
    const item = Object.assign({ id: U.uid('m'), w: s.week, done: false, choices: [{ label: 'OK', act: 'close' }], data: {} }, it);
    s.inbox.unshift(item);
    if (s.inbox.length > 60) s.inbox.pop();
    return item;
  }
  const msgInbox = (s, title, body) => inbox(s, { title, body, kind: 'info' });
  function inboxWelcome(s) {
    const me = s.pols.me;
    inbox(s, {
      title: 'Welcome to Grassroots', kind: 'info',
      body: `You are ${me.fn} ${me.ln}, a ${GR.PARTIES[me.party].noun} in ${s.home.cityName}, ${GR.STATE[s.home.state].name}.\n\nEach week you have a limited number of hours. Spend them in the Campaign, Office and Profile tabs, then press Next Turn.\n\nStart small: school board and city council races are held in odd years, legislative and federal races in even years. Declare in the Campaign tab before the filing deadline (mid-March), win your primary in June and the general election in November.\n\nOnce elected, relationships and respect decide your votes and your rise through leadership.`,
    });
  }
  function inboxResult(s, race, stage, won) {
    const title = W().seatTitle(s, s.seats[race.seat] || { off: 'president' });
    const res = stage === 'primary' ? race.prim[s.pols.me.party].res : race.res;
    const lines = (res || []).map((r) => `${W().fullName(s.pols[r.id])} (${s.pols[r.id].party}) — ${r.pct}%${r.votes ? ' · ' + U.num(r.votes) + ' votes' : ''}`).join('\n');
    inbox(s, { title: `${won ? 'Victory' : 'Defeat'}: ${stage === 'primary' ? 'primary for ' : ''}${title}`, body: `${won ? (stage === 'primary' ? 'You won the primary! On to November.' : 'You won! You take office in January.') : 'You lost this one.'}\n\n${lines}`, kind: 'result', data: { race: race.id, year: race.year } });
  }

  // ---------- Hours ----------
  function hoursFor(s) {
    const me = s.pols.me;
    let h = 40;
    if (me.traits.includes('workhorse')) h += 6;
    if (me.seat && GR.cabinet) h += GR.cabinet.hoursBonus(s);
    const job = GR.JOB[me.job];
    if (job && job.salary && !GR.life.fullTimeOffice(s)) h -= 18;
    if (me.schoolUntil) h -= 10;
    h -= me.family.kids.filter((k) => U.yearOf(s.week) - k.by < 5).length * 2;
    if (me.seat && !GR.life.fullTimeOffice(s) && GR.gov.myBody(s) && GR.gov.inSession(s, GR.gov.myBody(s))) h -= 4;
    if (s.campaign && s.campaign.staff.manager) h += 5;
    if (me.health < 40) h -= 8;
    return Math.max(8, h);
  }

  // Political points earned each week.
  function ppIncome(s) {
    const me = s.pols.me;
    let v = 1 + me.standing / 50;
    if (me.seat) {
      const o = GR.OFFICES[s.seats[me.seat].off];
      v += o.level * 0.9 + (me.app - 50) / 15;
      if (me.lead) { const post = GR.LEADERSHIP[me.lead.body].find((p) => p.k === me.lead.post); v += post ? post.rank * 2.5 : 0; }
    }
    v += (me.respect || 0) / 25 + me.recLocal / 60 + me.recState / 40 + me.recNat / 25;
    return Math.max(1, Math.round(v));
  }

  // ---------- Offices ----------
  function takeOffice(s, seat) {
    const me = s.pols.me;
    const o = GR.OFFICES[seat.off];
    me.seat = seat.id;
    me.app = 56;
    me.respect = Math.max(me.respect || 15, 15 + o.level * 3);
    if (GR.life.fullTimeOffice(s) && me.job !== 'unemployed') { me.prevJob = me.job; me.job = 'unemployed'; msgInbox(s, 'A full-time job', `Serving as ${o.name} is a full-time job. You left your work as a ${GR.JOB[me.prevJob].name.toLowerCase()}.`); }
    if (!s.stats.peakOffice || GR.OFFICES[s.stats.peakOffice].level < o.level) s.stats.peakOffice = seat.off;
    log(s, `Sworn in as ${W().seatTitle(s, seat)}.`);
    msgInbox(s, `Sworn in: ${o.name}`, `Congratulations! You are now ${W().seatTitle(s, seat)}. See the Office tab for your schedule, legislation${o.exec ? ', budget and executive powers' : ', committees and leadership'}.`);
    news(s, `${me.fn} ${me.ln} sworn in as ${W().seatTitle(s, seat)}.`, 'gov');
  }
  function leaveOffice(s, seat) {
    const me = s.pols.me;
    if (me.seat !== seat.id) return;
    me.seat = null;
    if (me.lead) { const B = s.bodies[me.lead.body]; if (B) delete B.lead[me.lead.post]; me.lead = null; }
    Object.values(s.bodies).forEach((B) => Object.values(B.comm).forEach((c) => { c.members = c.members.filter((id) => id !== 'me'); if (c.chair === 'me') c.chair = null; if (c.rank === 'me') c.rank = null; if (c.sen) delete c.sen.me; }));
    me.comm = null;
    s.steer = null;
    s.whipDebt = null;
    if (me.prevJob && me.job === 'unemployed') { me.job = me.prevJob; me.prevJob = null; }
    log(s, `Left office as ${W().seatTitle(s, seat)}.`);
  }

  function resign(s) {
    const me = s.pols.me;
    const seat = me.seat && s.seats[me.seat];
    if (!seat) return { ok: false };
    leaveOffice(s, seat);
    const p = W().fillSeat(s, seat, GR.OFFICES[seat.off].level, me.party);
    const cb = { school: 'school', council: 'council', statehouse: 'house', statesenate: 'senate', ushouse: 'ushouse', ussenate: 'ussenate' }[seat.off];
    if (cb) GR.comm.join(s, cb, p);
    news(s, `${me.fn} ${me.ln} resigns. ${W().fullName(p)} appointed to fill ${W().seatTitle(s, seat)}.`, 'gov');
    if (s.presRace && seat.off === 'president') s.nat.president = p.id;
    return { ok: true, msg: 'You resigned from office.' };
  }

  // ---------- NPC upkeep ----------
  function npcYear(s) {
    Object.values(s.pols).forEach((p) => {
      if (p.isPlayer || !p.alive) return;
      const a = W().ageOf(s, p);
      if (U.chance(0.00045 * Math.exp(0.088 * (a - 30)))) {
        p.alive = false;
        if (p.seat && s.seats[p.seat] && p.seat !== 'pres') {
          const seat = s.seats[p.seat];
          seat.holder = null;
          if (p.lead) GR.elect.clearLead(s, p);
          const n = W().fillSeat(s, seat, GR.OFFICES[seat.off].level, p.party);
          const cb = { school: 'school', council: 'council', statehouse: 'house', statesenate: 'senate' }[seat.off];
          if (cb) GR.comm.inherit(s, cb, p.id, n.id);
          news(s, `${W().fullName(p)} (${p.party}) has died. ${W().fullName(n)} appointed to ${W().seatTitle(s, seat)}.`, 'gov');
        }
        p.seat = null;
      }
      if (!p.alive && p.fed) {
        const f = p.fed;
        const n = W().fedMember(s, f.body, f.st, f.n, f.cls, f.lean, p.party, true);
        const o = s.nat.other[f.st];
        if (f.body === 'ushouse' && o) { const d = o.cds.find((x) => x.id === p.id); if (d) d.id = n.id; }
        if (f.body === 'ussenate' && o) o.sen[f.cls] = n.id;
        const list = s.nat.fed[f.body]; const i = list.indexOf(p.id); if (i >= 0) list[i] = n.id;
        GR.comm.inherit(s, f.body, p.id, n.id);
        if (p.lead) GR.elect.clearLead(s, p);
        p.fed = null;
      }
      if (p.seat) { p.pp += Math.round(GR.OFFICES[s.seats[p.seat].off].level * 60 * (0.5 + U.rand())); p.infl = U.clamp(p.infl + 2, 0, 100); }
      if (p.fed) { p.pp += Math.round(300 * (0.5 + U.rand())); p.infl = U.clamp(p.infl + 1, 0, 100); }
    });
    // Forget long-gone, minor politicians to keep saves small.
    const keep = new Set(Object.keys(s.rel || {}));
    Object.values(s.races || {}).flat().forEach((r) => r.cands.forEach((id) => keep.add(id)));
    if (s.presRace) s.presRace.cands.forEach((id) => keep.add(id));
    Object.values(s.bodies).forEach((B) => Object.values(B.lead).forEach((id) => keep.add(id)));
    Object.values(s.pols).forEach((p) => { if (!p.isPlayer && !p.seat && !p.fed && !keep.has(p.id) && !p.lead && (!p.alive || p.retired || p.hist.length <= 1 || W().ageOf(s, p) > 75)) delete s.pols[p.id]; });
  }

  // Rebuild city-level government after moving to a new city.
  function rebuildCity(s) {
    const old = Object.values(s.seats).filter((x) => ['school', 'council', 'mayor'].includes(x.off));
    old.forEach((seat) => { const p = s.pols[seat.holder]; if (p && !p.isPlayer) p.seat = null; delete s.seats[seat.id]; });
    const S = GR.geo.state(s.home.state);
    const cp = GR.geo.cityPop(S, s.home.city);
    Object.assign(s.city, { name: s.home.cityName, pop: cp, nCouncil: cp >= 1e6 ? 15 : cp >= 3e5 ? 11 : cp >= 1e5 ? 9 : cp >= 25e3 ? 7 : 5, nSchool: cp >= 1e5 ? 9 : cp >= 2e4 ? 7 : 5, mayorYear: U.hash(s.home.cityName + s.home.state) % 2 ? 2027 : 2029 });
    for (let i = 1; i <= s.city.nSchool; i++) W().makeSeat(s, 'school-' + i, 'school', i);
    for (let i = 1; i <= s.city.nCouncil; i++) W().makeSeat(s, 'council-' + i, 'council', i);
    W().makeSeat(s, 'mayor', 'mayor', 0);
    Object.values(s.seats).filter((x) => ['school', 'council', 'mayor'].includes(x.off)).forEach((seat) => { W().fillSeat(s, seat, GR.OFFICES[seat.off].level); seat.next = W().nextElection(s, seat, U.yearOf(s.week)); });
    ['school', 'council'].forEach((b) => { s.bodies[b] = { k: b, lead: {}, comm: {}, docket: [] }; W().setupLeadership(s, b); W().setupCommittees(s, b); });
    const parts = (S.cityZips[s.home.city] || []).map((i) => [i, 1]);
    const pr = GR.geo.profile(S, parts.length ? parts : [[s.home.zi, 1]], 'city' + s.home.city);
    s.jur.school = W().makeJur(s, 'school', s.home.cityName + ' Public Schools', cp, pr, pr.lean, 'school' + s.home.city);
    s.jur.city = W().makeJur(s, 'city', s.home.cityName, cp, pr, pr.lean, 'city' + s.home.city);
    s.jur.city.exec = 'mayor';
    Object.values(s.races || {}).forEach((list) => list.forEach((r) => { if (['school', 'council', 'mayor'].includes(r.off)) r.phase = 'done'; }));
  }
  // ---------- Death and dynasties ----------
  function legacy(s) {
    const me = s.pols.me;
    let sc = 0;
    const offices = me.hist.filter((h) => h.seat);
    offices.forEach((h) => { const o = Object.values(GR.OFFICES).find((x) => x.name === h.t); sc += o ? o.level * o.level * 10 : 10; });
    Object.entries(me.terms).forEach(([k, n]) => { sc += n * GR.OFFICES[k].level * 15; });
    sc += s.stats.billsPassed * 25 + (me.respect || 0) * 2 + me.family.kids.length * 20 + (me.family.spouse ? 30 : 0);
    if (me.lead) sc += 100;
    return Math.round(sc);
  }
  function death(s) {
    const me = s.pols.me;
    me.alive = false;
    s.over = { w: s.week, age: GR.life.age(s), legacy: legacy(s), reason: 'death' };
    log(s, `${me.fn} ${me.ln} died at age ${s.over.age}.`);
    news(s, `${me.fn} ${me.ln}, ${s.over.age}, has died. Tributes pour in from across ${GR.STATE[s.home.state].name}.`, 'life');
  }
  function retire(s) {
    const me = s.pols.me;
    if (me.seat) resign(s);
    s.over = { w: s.week, age: GR.life.age(s), legacy: legacy(s), reason: 'retired' };
    log(s, `${me.fn} ${me.ln} retired from public life.`);
  }
  // Continue as an adult child, inheriting the family name and some of its advantages.
  function heir(s, idx) {
    const old = s.pols.me;
    const kid = old.family.kids[idx];
    if (!kid) return false;
    const age = U.yearOf(s.week) - kid.by;
    if (age < 18) return false;
    if (old.seat) { const seat = s.seats[old.seat]; leaveOffice(s, seat); W().fillSeat(s, seat, GR.OFFICES[seat.off].level, old.party); }
    const ghost = Object.assign({}, old, { id: U.uid('p'), isPlayer: false, seat: null, alive: s.over.reason !== 'death', retired: true });
    delete ghost.family; delete ghost.pos;
    ghost.fis = W().axes(old).fis; ghost.soc = W().axes(old).soc; ghost.sd = U.uid('s');
    s.pols[ghost.id] = ghost;
    const sk = {};
    GR.SKILLS.forEach((x) => { sk[x.k] = U.clamp(Math.round(28 + U.gauss() * 6 + (old.sk[x.k] - 30) * 0.2), 10, 70); });
    const m = {
      id: 'me', isPlayer: true, fn: kid.fn, ln: old.ln, g: kid.g, by: kid.by, bweek: kid.bw % 52, party: old.party, pos: Object.assign({}, old.pos), sk,
      traits: old.traits.slice(0, 1).concat(['family']), q: 50, pp: Math.round(old.pp * 0.2) + 30, rec: 0, recLocal: Math.round(old.recLocal * 0.35), recState: Math.round(old.recState * 0.3), recNat: Math.round(old.recNat * 0.25),
      app: 50, fav: 0, standing: 45, network: Math.round(old.network * 0.5) + 6, seat: null, z: s.home.zi, st: s.home.state, hist: [], terms: {}, amb: 1, alive: true, ties: 5, infl: 0, respect: 15,
      money: Math.round(Math.max(0, old.money) * 0.5) + Math.round(old.warChest * 0.2), debt: 0, job: kid.job || 'staffer', edu: 'ba', up: 'political', health: 95, happy: 70, stress: 20, scandal: 0, integrity: 70,
      family: { spouse: null, partner: null, kids: [], pregnant: null, prefers: 'any' }, warChest: 0, look: kid.look, parent: ghost.id,
    };
    m.caucus = W().caucusOf(m).k;
    s.pols.me = m;
    s.rel = {};
    s.campaign = null;
    s.over = null;
    s.leadBid = null;
    s.deals = [];
    s.stats = { votesCast: 0, billsPassed: 0, billsWritten: 0, elections: [], peakOffice: null, dynasty: ((s.stats && s.stats.dynasty) || 1) + 1 };
    log(s, `${m.fn} ${m.ln} carries on the family name in politics.`);
    msgInbox(s, `The ${m.ln} dynasty continues`, `You now play as ${m.fn} ${m.ln}, ${age}. You inherit part of the family fortune, its donor network and some of its name recognition.`);
    s.hoursLeft = hoursFor(s);
    return true;
  }

  // ---------- Autopilot: spend leftover hours sensibly ----------
  function autoSpend(s) {
    const me = s.pols.me;
    let guard = 20;
    while (s.hoursLeft >= 2 && guard--) {
      let r = { ok: false };
      if (s.campaign) {
        const race = GR.camp.race(s);
        const areas = GR.camp.areas(s);
        const c = race && race.cs.me;
        if (c && c.funds < race.scale * 0.1 && s.hoursLeft >= 4) r = GR.camp.act(s, 'calls');
        else if (s.hoursLeft >= 5 && areas.length) r = GR.camp.act(s, 'doors', U.pick(areas.slice(0, 6)).k);
        else if (s.hoursLeft >= 4) r = GR.camp.act(s, 'calls');
        else r = GR.camp.act(s, 'interview');
      } else if (me.seat) {
        const k = s.hoursLeft >= 4 ? U.pick(['constituents', 'committee', 'donors']) : U.pick(['speech', 'press']);
        r = GR.gov.officeAct(s, k);
      } else {
        r = GR.life.act(s, s.hoursLeft >= 4 ? U.pick(['volunteer', 'network']) : 'party');
      }
      if (!r.ok) break;
    }
  }

  // ---------- The turn ----------
  function endTurn(s) {
    if (s.over) return;
    if (s.settings.autoSpend) autoSpend(s);
    s.hoursSpent = hoursFor(s) - s.hoursLeft;
    const me = s.pols.me;
    // End-of-week effects.
    if (s.campaign) GR.camp.week(s);
    GR.life.week(s);
    if (s.over) return;
    if (s.hoursLeft > 4) { me.stress = U.clamp(me.stress - s.hoursLeft * 0.1, 0, 100); }
    me.pp += ppIncome(s);
    // Political capital is use-it-or-lose-it: hoards above 100 erode.
    if (me.pp > 100) me.pp = 100 + (me.pp - 100) * 0.98;
    // Advance the calendar.
    s.week++;
    const y = U.yearOf(s.week);
    GR.elect.week(s);
    GR.gov.week(s);
    if (U.isYearStart(s.week)) npcYear(s);
    GR.events.week(s);
    GR.develop.week(s);
    if (U.isMonthStart(s.week) && me.seat) { GR.power.month(s); GR.cabinet.month(s); GR.scenes.month(s); }
    if (U.isYearStart(s.week)) { GR.develop.yearTick(s); if (me.seat) GR.scenes.report(s); }
    GR.scenes.week(s);
    // Recognition fades a little without activity.
    if (s.week % 4 === 0) { me.recLocal = U.clamp(me.recLocal * 0.995, 0, 100); me.recState = U.clamp(me.recState * 0.996, 0, 100); }
    me.scandal = Math.max(0, (me.scandal || 0) - 0.15);
    me.integrity = U.clamp(me.integrity || 70, 0, 100);
    me.fav = U.clamp(me.fav, -100, 100);
    me.standing = U.clamp(me.standing, 0, 100);
    s.hoursLeft = hoursFor(s);
    // Filing deadline reminder.
    if (!s.campaign && !me.running && s.week === GR.elect.filingWeek(y, 'x') - 3) msgInbox(s, 'Filing deadline approaching', `The deadline to file for ${y} races is ${U.fmtDate(GR.elect.filingWeek(y, 'x'))}. See the Campaign tab.`);
  }

  // Resolve an inbox choice.
  function choose(s, id, act) {
    const it = s.inbox.find((x) => x.id === id);
    if (!it) return null;
    let out = '';
    if (act === 'close') { it.done = true; return null; }
    if (act.startsWith('sc:')) {
      const i = +act.slice(3);
      if (it.choices[i] && it.choices[i].dis && !GR.scenes.canPay(s, it.data.sc.choices[i].fx)) return 'You cannot afford that right now.';
      out = GR.scenes.resolve(s, it, i);
      it.body += '\n\n→ ' + it.data.sc.choices[i].label + '. ' + out.split('\n')[0];
      it.choices = [{ label: 'OK', act: 'close' }];
      it.answered = true;
      return out;
    }
    if (act.startsWith('ev:')) {
      const [, key, i] = act.split(':');
      out = GR.events.resolve(s, key, +i, it.data);
      it.body += '\n\n→ ' + it.choices[+i].label + '. ' + out;
      it.choices = [{ label: 'OK', act: 'close' }];
      it.answered = true;
      return out;
    }
    if (act.startsWith('debate:')) {
      const k = act.slice(7);
      if (!GR.camp.race(s)) { it.done = true; return null; }
      if (k === 'start') GR.debate.start(s, it);
      else if (k === 'decline') GR.debate.decline(s, it);
      else GR.debate.answer(s, it, k);
      return null;
    }
    if (act.startsWith('vp:')) { GR.pres.pickVP(s, act.slice(3)); it.done = true; return 'Running mate chosen.'; }
    it.done = true;
    return out;
  }

  return { choose, news, log, msg, inbox, msgInbox, inboxWelcome, inboxResult, hoursFor, ppIncome, takeOffice, leaveOffice, resign, npcYear, rebuildCity, legacy, death, retire, heir, autoSpend, endTurn };
})();
