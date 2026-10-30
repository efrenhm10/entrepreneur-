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
        if (B) GR.comm.commsOf(s, bk, 'me').forEach((k) => B.comm[k].members.forEach((id) => addRel(s, id, 1.5 / GR.comm.commsOf(s, bk, 'me').length)));
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
      if (isFed(bodyKey) && v.fed) x += ((s.fedRel || {})[bodyKey] || 0) / 18 + (me.recNat - 25) / 80;
      // Caucus rebellion: members from districts hit by worsening crises turn on sitting leaders.
      const J = s.jur[GR.BODIES[bodyKey].jur];
      if (me.lead && me.lead.body === bodyKey) x -= GR.legis.rebellion(s, v, J, GR.legis.ctxOf(s, v)) * 1.2;
      x -= rival ? ((rival.infl || 30) - 40) / 45 + (rival.lead ? 0.6 : 0) + (v.ties || 0) * 0 : -2;
      if (me.traits.includes('loyal')) x += 0.25;
      // Colleagues whose price you paid.
      if (s.leadBid && s.leadBid.bought && s.leadBid.bought[v.id]) x += 2;
      if (me.traits.includes('maverick')) x -= 0.3;
      return { id: v.id, x, lean: x > 0.5 ? 'You' : x > 0 ? 'Leans you' : x > -0.5 ? 'Leans rival' : 'Rival' };
    });
    const you = rows.filter((r) => r.x > 0).length + 1;
    const them = rows.length - rows.filter((r) => r.x > 0).length + (rival ? 1 : 0);
    return { rival, rows, you, them, ext: null };
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
    // Contested races decided by the caucus (the player's own bid is handled below).
    if (GR.lead) GR.lead.resolve(s, bodyKey);
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
    // Committees: seniority, ratios, newcomers, chairs and the player's steering bid.
    GR.comm.reorganize(s, bodyKey);
  }

  // Ask to move to a committee with an open seat mid-session.
  function requestCommittee(s, k) { return GR.comm.transfer(s, k); }

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

  // ---------- Bills (delegated to the legislative engine) ----------
  const L = () => GR.legis;
  const tasks = (s) => L().tasks(s);
  const decide = (s, id, kind, v) => L().decide(s, id, kind, v);
  const allBills = (s) => L().allBills(s);
  const findBill = (s, id) => L().findBill(s, id);
  function cosponsor(s, billId) {
    const b = findBill(s, billId);
    if (!b || b.cos.includes('me') || b.spon === 'me') return { ok: false };
    b.cos.push('me');
    addRel(s, b.spon, 7);
    return { ok: true, msg: `You co-sponsored the ${b.title}.` };
  }
  function execOf(s, jur) {
    const k = s.jur[jur].exec;
    return k && s.seats[k] ? s.pols[s.seats[k].holder] : null;
  }
  function leaderOf(s, bodyKey, post) { const B = s.bodies[bodyKey]; return B && B.lead[post] ? s.pols[B.lead[post]] : null; }

  // ---------- Economy: quarterly macro runs ----------
  const isQuarterStart = (w) => U.isMonthStart(w) && U.monthOf(w) % 3 === 0;
  function quarterRun(s) {
    const nat = s.jur.nation, st = s.jur.state, city = s.jur.city, sch = s.jur.school;
    // Random macro shocks hit the nation; disasters hit states according to their vulnerability.
    const shock = U.chance(0.025) ? -U.round(1 + U.rand() * 2, 1) : 0;
    if (shock) GR.sim.news(s, 'Markets tumble on recession fears; economists slash growth forecasts.', 'econ');
    GR.fisc.quarter(nat, { noise: true, shock });
    GR.fisc.quarter(st, { nat: nat.F, noise: true, shock: disaster(s, st) });
    GR.fisc.quarter(city, { nat: nat.F, noise: true, shock: 0 });
    GR.fisc.quarter(sch, { nat: nat.F, noise: true, shock: 0 });
    // City and school economies follow the state's.
    [city, sch].forEach((J) => { J.F.mac.g = st.F.mac.g + (J.F.mac.g - J.F.mac.pot) * 0.3; J.F.mac.u = st.F.mac.u + (J.F.mac.u0 - st.F.mac.u0); });
    ['nation', 'state', 'city', 'school'].forEach((k) => { const J = s.jur[k]; J.met.growth = J.F.mac.g; J.met.unemp = J.F.mac.u; });
    s.lastQuarter = s.week;
  }
  function disaster(s, J) {
    const c = J.F.crises.disaster;
    if (!c || !U.chance(0.012 + c.s / 2500)) return 0;
    const kind = U.pick((GR.STATE_LEGACY_HAZ || {})[s.home.state] || ['A severe storm', 'Flooding', 'A wildfire', 'A heat wave']);
    const prep = GR.fisc.mitigation(J, 'disaster');
    const hit = U.round((0.4 + c.s / 120) * (1 - U.clamp(prep, -0.5, 0.6)), 2);
    const env = J.F.ag.find((a) => a.cat === 'env'), dot = J.F.ag.find((a) => a.k === 'dot');
    [env, dot].forEach((a) => { if (a) a.deg = U.clamp(a.deg + hit * 6, 0, 100); });
    c.s = U.clamp(c.s + 3, 0, 100);
    GR.sim.news(s, `${kind} strikes ${J.name}. Damage estimates climb; output takes a ${hit.toFixed(1)}-point hit this quarter.`, 'econ');
    const me = s.pols.me;
    if (me.seat && GR.OFFICES[s.seats[me.seat].off].jur === J.k) GR.sim.msgInbox(s, 'Disaster declaration', `${kind} hit ${J.name}. Consider emergency fund transfers (Briefing → Action Menu) or an emergency supplemental to restore damaged infrastructure. Voters will judge the response.`);
    return -hit;
  }

  // ---------- Metrics ----------
  function metricsMonth(s) {
    ['nation', 'state', 'city', 'school'].forEach((jur) => {
      const J = s.jur[jur];
      const t = target(s, J);
      Object.keys(t).forEach((k) => {
        if (k === 'growth' || k === 'unemp') return;
        J.met[k] = J.met[k] + (t[k] - J.met[k]) * 0.08;
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
      Object.entries(pol.fx).forEach(([k, v]) => { if (k !== 'rev' && k !== 'growth' && k !== 'unemp') add(k, v * d); });
    });
    const a = GR.fisc.serviceAdj(J);
    if (a.crime) t.crime *= a.crime;
    if (a.grad) t.grad += a.grad;
    if (a.uninsured) t.uninsured += a.uninsured;
    if (a.poverty) t.poverty += a.poverty + (J.F.mac.u - J.F.mac.u0) * 0.3;
    if (a.rent) t.rent *= a.rent * J.F.P;
    if (a.emis) t.emis = 100 * a.emis;
    t.income = m0.income * J.F.P * (J.F.mac.real / 100);
    return t;
  }

  // Yearly snapshot for charts.
  function yearClose(s) {
    ['nation', 'state', 'city', 'school'].forEach((jur) => {
      const J = s.jur[jur];
      const t = W().totals(J);
      J.hist.push({ y: U.yearOf(s.week) - 1, met: Object.assign({}, J.met), spend: t.sp, rev: t.rv, total: t.spend, revenue: t.rev, debt: J.F.debt, pop: J.pop });
      if (J.hist.length > 40) J.hist.shift();
      J.pop = Math.round(J.pop * (1 + (jur === 'nation' ? 0.005 : 0.004 + (J.met.growth - 2) * 0.002)));
      if (J.k === 'school') J.students = Math.round(J.pop * 0.15);
    });
  }

  // ---------- Approval ----------
  // Executives answer for the economy, agency performance and the crises matrix; legislators
  // answer for their district's crises and how they voted.
  function approvalMonth(s) {
    ['city', 'state', 'nation'].forEach((jur) => {
      const ex = execOf(s, jur);
      if (!ex) return;
      const J = s.jur[jur];
      const m = J.F.mac;
      const vd = GR.fisc.dissatisfaction(J);
      const agApp = U.avg(J.F.ag, (a) => a.app);
      let base = 52 + (m.g - 2) * 3 - (m.u - m.u0) * 2.5 - (m.pi - 2.5) * 2 + (m.cc - 96) * 0.15 - (vd - (J.F.vd0 || 50)) * 0.6 - (vd - 45) * 0.15 + (agApp - 50) * 0.2 - (J.F.shutdown ? 8 : 0);
      const seat = s.seats[J.exec];
      const pr = W().seatProfile(s, seat);
      const ax = W().axes(ex);
      base -= Math.abs((ax.fis + ax.soc) / 2 - pr.lean / 18) * 4;
      if (jur === 'nation') base -= 4;
      ex.app = U.clamp(ex.app + (base - ex.app) * 0.12 + (ex.isPlayer ? 0 : U.gauss() * 1.2), 8, 90);
    });
    Object.values(s.pols).forEach((p) => {
      if (!p.seat || p.isPlayer || GR.OFFICES[s.seats[p.seat] ? s.seats[p.seat].off : 'school'].exec) return;
      p.app = U.clamp(p.app + (52 - p.app) * 0.05 + U.gauss() * 1.5, 20, 85);
    });
    const me = s.pols.me;
    if (me.seat) {
      const seat = s.seats[me.seat];
      const off = GR.OFFICES[seat.off];
      if (off.exec) return;
      const pr = W().seatProfile(s, seat);
      const a = W().axes(me);
      const J = s.jur[off.jur];
      const vd = GR.fisc.dissatisfaction(J);
      let base = 52 - Math.abs((a.fis + a.soc) / 2 - pr.lean / 18) * 5 - (me.scandal || 0) * 0.8 + (me.respect || 20) * 0.05 - (vd - (J.F.vd0 || 50)) * 0.35;
      me.app = U.clamp(me.app + (base - me.app) * 0.12, 1, 99);
    }
  }

  // ---------- Weekly ----------
  function week(s) {
    s.fedRel = s.fedRel || {};
    if (isQuarterStart(s.week)) quarterRun(s);
    GR.legis.week(s);
    if (U.isMonthStart(s.week) && U.monthOf(s.week) === 6) balanceBudgets(s);
    if (U.isMonthStart(s.week)) { metricsMonth(s); approvalMonth(s); }
    if (U.isYearStart(s.week)) yearClose(s);
    if (s.rel && s.week % 4 === 0) Object.keys(s.rel).forEach((k) => { s.rel[k] *= 0.985; if (Math.abs(s.rel[k]) < 0.5) delete s.rel[k]; });
  }

  // Fiscal-year start (July 1): state and local balanced-budget requirements.
  function balanceBudgets(s) {
    ['state', 'city', 'school'].forEach((jur) => {
      const J = s.jur[jur];
      const r = GR.fisc.balanceRule(J);
      if (!r) return;
      if (r.cut > 0.002) {
        GR.sim.news(s, `${J.name}: the balanced-budget requirement forces ${U.round(r.cut * 100, 1)}% across-the-board agency cuts (${U.money(r.amt)})${r.draw > 0 ? ` after draining ${U.money(r.draw)} from reserves` : ''}.`, 'gov');
        J.F.ag.forEach((a) => { a.app = U.clamp(a.app - r.cut * 40, 0, 100); });
        const ex = execOf(s, jur);
        if (ex && ex.isPlayer) GR.sim.msgInbox(s, 'Mandatory budget cuts', `Your FY budget was out of balance. The balanced-budget requirement cut every agency by ${U.round(r.cut * 100, 1)}%. Raise revenue or trim spending in next year's budget to avoid it.`);
      }
    });
  }

  // Current office label for the briefing ("Year 2, Q3 - State Legislative Session").
  function briefingLabel(s) {
    const me = s.pols.me;
    const seat = me.seat && s.seats[me.seat];
    if (!seat) return '';
    const off = GR.OFFICES[seat.off];
    const y = U.yearOf(s.week);
    const termYear = y - (me.since || y) + 1;
    const q = Math.floor(U.monthOf(s.week) / 3) + 1;
    const bk = myBody(s);
    let branch;
    if (off.jur === 'nation') branch = off.exec ? 'Federal Executive Branch' : `${Math.floor((y - 1789) / 2) + 1}th Congress, ${GR.BODIES[bk].name}${inSession(s, bk) ? ' (in session)' : ' (recess)'}`;
    else if (off.jur === 'state') branch = off.exec ? 'State Executive Branch' : `State Legislative Session — ${GR.BODIES[bk].name}${inSession(s, bk) ? '' : ' (interim)'}`;
    else if (off.jur === 'city') branch = off.exec ? 'Municipal Executive' : 'City Council';
    else branch = 'Board of Education';
    return `Year ${termYear}, Q${q} — ${branch}`;
  }

  return {
    JUR_BODIES, BODY_OFF, bodiesOf, isFed, rel, addRel, addRespect, relLabel, myBody, myJur, inSession,
    tasks, decide, allBills, findBill, cosponsor, execOf, leaderOf,
    OFFICE_ACTS, officeAct, donate, bumpRec, posts, leadWindowOpen, canSeek, seek, rivalFor, leadCount, organize, requestCommittee,
    EO_CATS, execOrder, metricsMonth, target, yearClose, approvalMonth, week, quarterRun, briefingLabel, isQuarterStart,
  };
})();
