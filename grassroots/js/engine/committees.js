// Committee system: the gatekeepers between a bill and the floor.
// - Rosters with real party ratios and (in Congress) real committee sizes.
// - Committee seniority decides chairs and ranking members unless someone wins the gavel
//   from the party steering committee.
// - At the start of every session the player bids for assignments (and gavels) by spending
//   political capital and trading favors with party leadership: loyalty pledges, party dues,
//   carrying the leader's priority. Every member can hold at least two assignments; only a
//   limited number of them may be exclusive panels.
// - Chairs control the agenda (hearing, fast-track, hold, table). Members get the exclusive
//   markup phase: earmarks, crisis amendments, rewrites and pay-fors, adopted by committee vote.
var GR = globalThis.GR || (globalThis.GR = {});

GR.comm = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const G = () => GR.gov;
  const L = () => GR.legis;
  const BODY_OFF = { school: 'school', council: 'council', house: 'statehouse', senate: 'statesenate', ushouse: 'ushouse', ussenate: 'ussenate' };
  const isFed = (b) => b === 'ushouse' || b === 'ussenate';
  const sig = (x) => 1 / (1 + Math.exp(-x));

  // ---------- Definitions ----------
  function listFor(bodyKey) {
    const jur = GR.BODIES[bodyKey].jur;
    return GR.COMMITTEES[jur === 'school' ? 'school' : jur === 'city' ? 'city' : jur];
  }
  function def(bodyKey, k) { return listFor(bodyKey).find((c) => c.k === k) || null; }
  function nameOf(bodyKey, k) { const n = (GR.COMMITTEE_NAMES[bodyKey] || {})[k]; const d = def(bodyKey, k); return n || (d ? d.name : 'Committee'); }
  const tierOf = (bodyKey, k) => (def(bodyKey, k) || {}).tier || 'B';
  const slotCost = () => 1;
  const maxA = (bodyKey) => GR.COMMITTEE_MAX_A[bodyKey] || 1;
  const countA = (bodyKey, ks) => ks.filter((k) => tierOf(bodyKey, k) === 'A').length;
  const isMoney = (k) => ['approp', 'budget', 'finance'].includes(k);

  function sizeOf(bodyKey, k, n) {
    const fixed = (GR.COMMITTEE_SIZE[bodyKey] || {})[k];
    if (fixed) return fixed;
    if (bodyKey === 'school' || bodyKey === 'council') return Math.max(3, Math.min(n, Math.round(n * (tierOf(bodyKey, k) === 'A' ? 0.6 : 0.45))));
    return Math.max(5, Math.min(n, Math.round(n * GR.COMMITTEE_TIERS[tierOf(bodyKey, k)].frac)));
  }

  // Seats per party: the majority gets at least its chamber share plus one, as in practice.
  function quota(s, bodyKey, k) {
    const B = s.bodies[bodyKey];
    const c = B.comm[k];
    const ms = W().members(s, bodyKey);
    const maj = W().majority(s, bodyKey);
    const share = ms.filter((m) => m.party === maj).length / Math.max(1, ms.length);
    const majSeats = Math.min(c.sz, Math.max(Math.floor(c.sz / 2) + 1, Math.round(c.sz * share)));
    return { [maj]: majSeats, [GR.other(maj)]: c.sz - majSeats, maj };
  }
  function partyCount(s, c, party) { return c.members.filter((id) => s.pols[id] && s.pols[id].party === party).length; }
  function openSeats(s, bodyKey, k, party) { const c = s.bodies[bodyKey].comm[k]; return quota(s, bodyKey, k)[party] - partyCount(s, c, party); }

  function commsOf(s, bodyKey, id) {
    const B = s.bodies[bodyKey];
    if (!B) return [];
    return Object.keys(B.comm).filter((k) => B.comm[k].members.includes(id));
  }
  const usedSlots = (s, bodyKey, id) => U.sum(commsOf(s, bodyKey, id), (k) => slotCost(bodyKey, k));
  function isMember(s, bodyKey, k, id) { const B = s.bodies[bodyKey]; return !!(B && B.comm[k] && B.comm[k].members.includes(id)); }
  function primary(s, bodyKey, id) {
    const ks = commsOf(s, bodyKey, id);
    return ks.sort((a, b) => 'ABC'.indexOf(tierOf(bodyKey, a)) - 'ABC'.indexOf(tierOf(bodyKey, b)))[0] || null;
  }
  function syncPrimary(s, bodyKey, p) { if (p) p.comm = primary(s, bodyKey, p.id); }

  function add(s, bodyKey, k, id) {
    const c = s.bodies[bodyKey].comm[k];
    if (c.members.includes(id)) return;
    c.members.push(id);
    c.sen[id] = c.sen[id] || 0;
    syncPrimary(s, bodyKey, s.pols[id]);
  }
  function remove(s, bodyKey, k, id) {
    const c = s.bodies[bodyKey].comm[k];
    c.members = c.members.filter((x) => x !== id);
    delete c.sen[id];
    if (c.chair === id) c.chair = null;
    if (c.rank === id) c.rank = null;
    if (c.vice === id) c.vice = null;
    syncPrimary(s, bodyKey, s.pols[id]);
  }

  // Committee seniority, then chamber seniority, then influence.
  function senScore(s, bodyKey, k, p) {
    const c = s.bodies[bodyKey].comm[k];
    return (c.sen[p.id] || 0) * 10 + (p.terms[BODY_OFF[bodyKey]] || 0) * 3 + (p.isPlayer ? (p.respect || 20) / 20 : (p.infl || 30) / 20);
  }
  function seniorityRank(s, bodyKey, k, id) {
    const c = s.bodies[bodyKey].comm[k];
    const p = s.pols[id];
    if (!p) return null;
    const same = c.members.map((x) => s.pols[x]).filter((m) => m && m.party === p.party).sort((a, b) => senScore(s, bodyKey, k, b) - senScore(s, bodyKey, k, a));
    return { rank: same.findIndex((m) => m.id === id) + 1, of: same.length };
  }

  // An NPC's committee wish list: money panels for the senior and ambitious, district-matched panels otherwise.
  function wishes(s, bodyKey, p) {
    const list = listFor(bodyKey).slice();
    const seniority = (p.terms[BODY_OFF[bodyKey]] || 0) + (p.infl || 30) / 30;
    return list.map((c) => ({ k: c.k, w: (c.tier === 'A' ? 0.4 + seniority * 0.35 : c.tier === 'B' ? 1 : 0.5) * (0.6 + U.rand() * 0.8) })).sort((a, b) => b.w - a.w).map((x) => x.k);
  }

  // Fill an NPC's open slots with seats their party still has.
  function fillNPC(s, bodyKey, p) {
    const slots = GR.COMMITTEE_SLOTS[bodyKey] || 2;
    for (const k of wishes(s, bodyKey, p)) {
      if (usedSlots(s, bodyKey, p.id) + slotCost(bodyKey, k) > slots) continue;
      if (isMember(s, bodyKey, k, p.id)) continue;
      if (tierOf(bodyKey, k) === 'A' && countA(bodyKey, commsOf(s, bodyKey, p.id)) >= maxA(bodyKey)) continue;
      if (openSeats(s, bodyKey, k, p.party) <= 0) continue;
      add(s, bodyKey, k, p.id);
    }
    // Members left over sit on panels not modeled here (Congress has ~20 committees per chamber).
  }

  function pickChairs(s, bodyKey, quiet) {
    const B = s.bodies[bodyKey];
    const maj = W().majority(s, bodyKey);
    Object.keys(B.comm).forEach((k) => {
      const c = B.comm[k];
      const prevChair = c.chair, prevRank = c.rank, prevVice = c.vice;
      const best = (party, keep, not) => {
        if (keep && s.pols[keep] && s.pols[keep].party === party && c.members.includes(keep)) return keep;
        const pool = c.members.map((id) => s.pols[id]).filter((m) => m && m.party === party && m.id !== not && !(m.isPlayer && s.steerNoGavel && !not));
        // The sitting vice chair is first in line for the gavel.
        pool.sort((a, b) => senScore(s, bodyKey, k, b) + (!not && b.id === prevVice ? 1.5 : 0) - senScore(s, bodyKey, k, a) - (!not && a.id === prevVice ? 1.5 : 0));
        return pool[0] ? pool[0].id : null;
      };
      // Gavels won in steering are kept for the session; otherwise seniority rules.
      c.chair = best(maj, c.chairWon ? c.chair : null);
      c.rank = best(GR.other(maj), c.rankWon ? c.rank : null);
      // The vice chair: the majority's next most senior member.
      c.vice = best(maj, prevVice && prevVice !== c.chair ? prevVice : null, c.chair);
      if (!quiet && c.vice === 'me' && prevVice !== 'me' && c.chair !== 'me') GR.sim.msgInbox(s, `Vice chair of ${nameOf(bodyKey, k)}`, `You are now vice chair of the ${GR.BODIES[bodyKey].name} ${nameOf(bodyKey, k)} Committee. You preside when the chair is away, the chair leans on you to manage the markup, and you are first in line for the gavel.`);
      if (!quiet && c.chair === 'me' && prevChair !== 'me') GR.sim.msgInbox(s, `Chair of ${nameOf(bodyKey, k)}`, `Seniority has made you chair of the ${GR.BODIES[bodyKey].name} ${nameOf(bodyKey, k)} Committee. Every bill referred to it moves only if you schedule it, and you control the markup.`);
      if (!quiet && c.rank === 'me' && prevRank !== 'me') GR.sim.msgInbox(s, `Ranking member of ${nameOf(bodyKey, k)}`, `You are now the ranking minority member on ${nameOf(bodyKey, k)}. You lead your party's side in markup.`);
    });
  }

  // Initial rosters.
  function setup(s, bodyKey) {
    const B = s.bodies[bodyKey];
    const ms = W().members(s, bodyKey);
    B.comm = {};
    listFor(bodyKey).forEach((c) => { B.comm[c.k] = { chair: null, rank: null, members: [], sen: {}, sz: sizeOf(bodyKey, c.k, ms.length) }; });
    ms.filter((m) => !m.isPlayer).sort((a, b) => (b.terms[BODY_OFF[bodyKey]] || 0) + (b.infl || 0) / 30 - (a.terms[BODY_OFF[bodyKey]] || 0) - (a.infl || 0) / 30).forEach((m) => {
      fillNPC(s, bodyKey, m);
      commsOf(s, bodyKey, m.id).forEach((k) => { B.comm[k].sen[m.id] = Math.max(0, Math.round((m.terms[BODY_OFF[bodyKey]] || 0) * (0.5 + U.rand() * 0.6))); });
    });
    pickChairs(s, bodyKey, true);
  }

  // Older saves stored one committee per member and no seniority.
  function migrate(s, bodyKey) {
    const B = s.bodies[bodyKey];
    if (!B || !B.comm) return;
    const ms = W().members(s, bodyKey);
    const maj = W().majority(s, bodyKey);
    Object.keys(B.comm).forEach((k) => {
      const c = B.comm[k]; c.sen = c.sen || {}; c.sz = c.sz || sizeOf(bodyKey, k, ms.length); if (c.rank === undefined) c.rank = null;
      // Older saves predate vice chairs.
      if (c.vice === undefined) { const pool = c.members.map((id) => s.pols[id]).filter((m) => m && m.party === maj && m.id !== c.chair).sort((x, y) => senScore(s, bodyKey, k, y) - senScore(s, bodyKey, k, x)); c.vice = pool[0] ? pool[0].id : null; }
    });
  }

  // Start of a session: seniority accrues, ratios rebalance, newcomers are placed, chairs set.
  function reorganize(s, bodyKey) {
    const B = s.bodies[bodyKey];
    if (!B) return;
    migrate(s, bodyKey);
    const ms = W().members(s, bodyKey);
    const ids = new Set(ms.map((m) => m.id));
    const y = U.yearOf(s.week);
    Object.keys(B.comm).forEach((k) => {
      const c = B.comm[k];
      c.sz = sizeOf(bodyKey, k, ms.length);
      c.members.filter((id) => !ids.has(id)).forEach((id) => remove(s, bodyKey, k, id));
      if (c.senYear !== y) { c.members.forEach((id) => { c.sen[id] = (c.sen[id] || 0) + 1; }); c.senYear = y; }
      c.chairWon = false; c.rankWon = false;
      // A party over its quota loses its most junior members.
      [W().majority(s, bodyKey), GR.other(W().majority(s, bodyKey))].forEach((party) => {
        let over = -openSeats(s, bodyKey, k, party);
        const juniors = c.members.map((id) => s.pols[id]).filter((m) => m && m.party === party && !m.isPlayer).sort((a, b) => senScore(s, bodyKey, k, a) - senScore(s, bodyKey, k, b));
        while (over > 0 && juniors.length) { remove(s, bodyKey, k, juniors.shift().id); over--; }
        if (over > 0 && c.members.includes('me')) { remove(s, bodyKey, k, 'me'); GR.sim.msgInbox(s, 'Bumped from committee', `Your party lost seats on ${nameOf(bodyKey, k)} when the chamber's ratio changed, and as its most junior member you lost your spot.`); }
      });
    });
    ms.filter((m) => !m.isPlayer && usedSlots(s, bodyKey, m.id) < (GR.COMMITTEE_SLOTS[bodyKey] || 2)).forEach((m) => fillNPC(s, bodyKey, m));
    pickChairs(s, bodyKey, true);
    // The player goes before the steering committee.
    if (G().myBody(s) === bodyKey) openSteering(s, bodyKey);
  }

  // Placement for a single new member (special elections, appointments).
  function join(s, bodyKey, p) {
    const B = s.bodies[bodyKey];
    if (!B || !B.comm || p.isPlayer) return;
    migrate(s, bodyKey);
    fillNPC(s, bodyKey, p);
  }

  // A successor takes over a departed member's seats (no seniority; gavels go by seniority).
  function inherit(s, bodyKey, oldId, newId) {
    const B = s.bodies[bodyKey];
    if (!B || !B.comm) return;
    let lostGavel = false;
    Object.values(B.comm).forEach((c) => {
      const i = c.members.indexOf(oldId);
      if (i < 0) return;
      c.members[i] = newId;
      if (c.sen) { delete c.sen[oldId]; c.sen[newId] = 0; }
      if (c.chair === oldId || c.rank === oldId || c.vice === oldId) { if (c.chair === oldId) c.chair = null; if (c.rank === oldId) c.rank = null; if (c.vice === oldId) c.vice = null; lostGavel = true; }
    });
    syncPrimary(s, bodyKey, s.pols[newId]);
    if (lostGavel) pickChairs(s, bodyKey, false);
  }

  // ---------- Steering: the player's assignment and gavel bids ----------
  function steerLeader(s, bodyKey) {
    const me = s.pols.me;
    const maj = W().majority(s, bodyKey);
    const post = me.party === maj ? (bodyKey === 'house' || bodyKey === 'ushouse' ? 'speaker' : bodyKey === 'school' || bodyKey === 'council' ? 'president' : 'majleader') : 'minleader';
    return G().leaderOf(s, bodyKey, post) || G().leaderOf(s, bodyKey, 'majleader') || null;
  }
  function duesAmount(bodyKey) { return { school: 500, council: 2500, house: 10000, senate: 20000, ushouse: 150000, ussenate: 350000 }[bodyKey] || 5000; }

  function openSteering(s, bodyKey) {
    const me = s.pols.me;
    const fresh = !commsOf(s, bodyKey, 'me').length;
    // Freshmen are parked on a minor committee until steering meets.
    if (fresh) {
      const k = listFor(bodyKey).map((c) => c.k).sort((a, b) => 'CBA'.indexOf(tierOf(bodyKey, a)) - 'CBA'.indexOf(tierOf(bodyKey, b)) || openSeats(s, bodyKey, b, me.party) - openSeats(s, bodyKey, a, me.party))[0];
      if (k) add(s, bodyKey, k, 'me');
      const k2 = listFor(bodyKey).map((c) => c.k).filter((x) => x !== k && tierOf(bodyKey, x) !== 'A').sort((a, b) => openSeats(s, bodyKey, b, me.party) - openSeats(s, bodyKey, a, me.party))[0];
      if (k2 && (GR.COMMITTEE_SLOTS[bodyKey] || 2) > 1) add(s, bodyKey, k2, 'me');
    }
    const keep = commsOf(s, bodyKey, 'me');
    s.steer = { body: bodyKey, w: s.week, due: s.week + 3, picks: fresh ? [] : keep.slice(), pp: 0, favors: {}, gavel: null, gavelPP: 0, fresh };
    const lead = steerLeader(s, bodyKey);
    GR.sim.msgInbox(s, 'Steering committee: committee assignments', `The ${GR.BODIES[bodyKey].name} is organizing for the new session. ${lead ? W().fullName(lead) + ' and the ' + me.party + ' steering committee' : 'Your party\'s steering committee'} will hand out committee seats in ${s.steer.due - s.week} weeks.\n\nOpen Office → Committees to rank the committees you want, spend political capital, and trade favors with leadership: pledge your vote on leadership priorities, pay party dues, or carry the leader's bill. You can sit on ${GR.COMMITTEE_SLOTS[bodyKey] || 2} committees, including ${maxA(bodyKey) === 1 ? 'one' : maxA(bodyKey)} exclusive panel${maxA(bodyKey) === 1 ? '' : 's'}; Appropriations and ${nameOf(bodyKey, 'ways')} control the purse strings and are hard to get. Members with seniority can bid for a gavel.`);
  }

  // Odds that steering grants a seat on committee k.
  function seatOdds(s, bodyKey, k, st) {
    const me = s.pols.me;
    st = st || s.steer || { pp: 0, favors: {} };
    if (isMember(s, bodyKey, k, 'me') && !st.fresh) return 1;
    const t = tierOf(bodyKey, k);
    const open = openSeats(s, bodyKey, k, me.party);
    const lead = steerLeader(s, bodyKey);
    const terms = me.terms[BODY_OFF[bodyKey]] || 0;
    let x = t === 'A' ? -2.0 : t === 'B' ? -0.4 : 1.0;
    x += Math.min(4, terms) * 0.45;
    // A leader you helped elect pushes for you; defying the whip costs you.
    if (GR.lead && GR.lead.favor(s, 'committee') && t === 'A') x += 1.6;
    x -= Math.min(3, s.whipNo || 0) * 0.3;
    x += ((me.respect || 20) - 30) / 25;
    x += (me.standing - 50) / 30;
    x += lead && !lead.isPlayer ? G().rel(s, lead.id) / 30 : 0.5;
    x += st.pp / 22;
    x += favorBonus(s, bodyKey, st);
    x += open > 0 ? Math.log(1 + open) * 0.45 : -1.6;
    if (me.traits.includes('loyal')) x += 0.3;
    if (me.traits.includes('maverick')) x -= 0.4;
    return U.clamp(sig(x), 0.02, 0.97);
  }
  function favorBonus(s, bodyKey, st) {
    const f = st.favors || {};
    return (f.loyalty ? 0.9 : 0) + (f.dues ? 0.7 : 0) + (f.carry ? 0.5 : 0);
  }

  // Odds of winning a gavel (chair or ranking member) over the most senior rival.
  function gavelOdds(s, bodyKey, k, st) {
    const me = s.pols.me;
    st = st || s.steer || { gavelPP: 0, favors: {} };
    const c = s.bodies[bodyKey].comm[k];
    const maj = W().majority(s, bodyKey);
    const post = me.party === maj ? 'chair' : 'rank';
    const holder = c[post] && c[post] !== 'me' ? s.pols[c[post]] : null;
    const rival = holder || c.members.map((id) => s.pols[id]).filter((m) => m && m.party === me.party && !m.isPlayer).sort((a, b) => senScore(s, bodyKey, k, b) - senScore(s, bodyKey, k, a))[0];
    if (!rival) return { p: 0.95, rival: null, post };
    const lead = steerLeader(s, bodyKey);
    let x = (senScore(s, bodyKey, k, me) - senScore(s, bodyKey, k, rival)) / 14;
    x += lead && !lead.isPlayer ? (G().rel(s, lead.id) - 10) / 30 : 0.4;
    x += (st.gavelPP || 0) / 25 + favorBonus(s, bodyKey, st) * 0.7;
    x += ((me.respect || 20) - 45) / 30;
    x -= G().rel(s, rival.id) > 30 ? 0.2 : 0;
    return { p: U.clamp(sig(x - 0.6), 0.02, 0.95), rival, post };
  }
  function canBidGavel(s, bodyKey, k) {
    const c = s.bodies[bodyKey].comm[k];
    const small = bodyKey === 'school' || bodyKey === 'council';
    const willSit = s.steer && s.steer.picks.includes(k);
    return (isMember(s, bodyKey, k, 'me') || willSit) && ((c.sen.me || 0) >= 1 || small);
  }

  // Player edits to the steering request.
  function setSteer(s, patch) {
    const st = s.steer;
    if (!st || st.done) return { ok: false, msg: 'Steering is not meeting right now.' };
    const slots = GR.COMMITTEE_SLOTS[st.body] || 2;
    if (patch.toggle) {
      const k = patch.toggle;
      if (st.picks.includes(k)) st.picks = st.picks.filter((x) => x !== k);
      else {
        const used = U.sum(st.picks, (x) => slotCost(st.body, x));
        if (used + slotCost(st.body, k) > slots) return { ok: false, msg: `You can request ${slots} committees. Drop one first.` };
        if (tierOf(st.body, k) === 'A' && countA(st.body, st.picks) >= maxA(st.body)) return { ok: false, msg: `Members may sit on ${maxA(st.body) === 1 ? 'only one exclusive committee' : 'at most ' + maxA(st.body) + ' exclusive committees'}.` };
        st.picks.push(k);
      }
      if (st.gavel && !st.picks.includes(st.gavel) && !isMember(s, st.body, st.gavel, 'me')) st.gavel = null;
    }
    if (patch.up) { const i = st.picks.indexOf(patch.up); if (i > 0) { st.picks.splice(i, 1); st.picks.splice(i - 1, 0, patch.up); } }
    if (patch.pp != null) st.pp = U.clamp(Math.round(+patch.pp || 0), 0, 200);
    if (patch.gavelPP != null) st.gavelPP = U.clamp(Math.round(+patch.gavelPP || 0), 0, 200);
    if (patch.gavel !== undefined) st.gavel = patch.gavel || null;
    if (patch.favor) st.favors[patch.favor] = !st.favors[patch.favor];
    return { ok: true };
  }

  // Steering meets: seats are granted in order of preference.
  function resolveSteering(s) {
    const st = s.steer;
    if (!st || st.done) return { ok: false };
    const bodyKey = st.body;
    const B = s.bodies[bodyKey];
    const me = s.pols.me;
    if (!B || G().myBody(s) !== bodyKey) { s.steer = null; return { ok: false }; }
    const spend = st.pp + (st.gavel ? st.gavelPP : 0);
    if (me.pp < spend) return { ok: false, msg: `You pledged ${spend} political points but only have ${Math.floor(me.pp)}.` };
    const dues = duesAmount(bodyKey);
    if (st.favors.dues && me.warChest < dues) return { ok: false, msg: `Party dues are ${U.money(dues)}; your war chest has ${U.money(me.warChest)}.` };
    me.pp -= spend;
    const lead = steerLeader(s, bodyKey);
    if (st.favors.dues) { me.warChest -= dues; if (lead) G().addRel(s, lead.id, 6); }
    if (st.favors.loyalty) s.whipDebt = { body: bodyKey, leader: lead ? lead.id : null, n: 3, breaches: 0, w: s.week };
    if (st.favors.carry && lead && !lead.isPlayer) { s.deals = s.deals || []; s.deals.push({ who: lead.id, bill: null, future: true, w: s.week, steer: true }); }
    const slots = GR.COMMITTEE_SLOTS[bodyKey] || 2;
    const lines = [];
    const want = st.picks.slice();
    // Seats you hold but did not re-request are given up.
    commsOf(s, bodyKey, 'me').forEach((k) => { if (!want.includes(k) && !(st.fresh && want.length === 0)) { remove(s, bodyKey, k, 'me'); lines.push(`Gave up your seat on ${nameOf(bodyKey, k)}.`); } });
    let granted = 0;
    want.forEach((k) => {
      if (isMember(s, bodyKey, k, 'me') && !st.fresh) { lines.push(`Kept your seat on ${nameOf(bodyKey, k)}.`); granted++; return; }
      if (st.fresh && isMember(s, bodyKey, k, 'me')) { lines.push(`Kept your seat on ${nameOf(bodyKey, k)}.`); granted++; return; }
      const p = seatOdds(s, bodyKey, k, st);
      if (U.chance(p)) {
        if (openSeats(s, bodyKey, k, me.party) <= 0) {
          // Leadership bumps a junior member to make room.
          const c = B.comm[k];
          const j = c.members.map((id) => s.pols[id]).filter((m) => m && m.party === me.party && !m.isPlayer && c.chair !== m.id && c.rank !== m.id).sort((a, b) => senScore(s, bodyKey, k, a) - senScore(s, bodyKey, k, b))[0];
          if (j) { remove(s, bodyKey, k, j.id); fillNPC(s, bodyKey, j); G().addRel(s, j.id, -12); }
        }
        add(s, bodyKey, k, 'me');
        lines.push(`Won a seat on ${nameOf(bodyKey, k)} (${Math.round(p * 100)}% odds).`);
        granted++;
      } else lines.push(`Denied a seat on ${nameOf(bodyKey, k)} (${Math.round(p * 100)}% odds).`);
    });
    // Leftover freshman placeholders stay; trim to slot capacity.
    while (usedSlots(s, bodyKey, 'me') > slots) { const ks = commsOf(s, bodyKey, 'me').filter((k) => !want.includes(k)); const k = ks[0] || commsOf(s, bodyKey, 'me').slice(-1)[0]; remove(s, bodyKey, k, 'me'); }
    if (st.fresh && want.length && granted) commsOf(s, bodyKey, 'me').forEach((k) => { if (!want.includes(k) && usedSlots(s, bodyKey, 'me') > slotCost(bodyKey, k) && tierOf(bodyKey, k) === 'C') remove(s, bodyKey, k, 'me'); });
    // Steering fills any slots still empty with the open seats it has left.
    const spare = listFor(bodyKey).map((c) => c.k).filter((k) => tierOf(bodyKey, k) !== 'A' && !isMember(s, bodyKey, k, 'me')).sort((a, b) => openSeats(s, bodyKey, b, me.party) - openSeats(s, bodyKey, a, me.party) || 'CBA'.indexOf(tierOf(bodyKey, b)) - 'CBA'.indexOf(tierOf(bodyKey, a)));
    while (usedSlots(s, bodyKey, 'me') < slots && spare.length) {
      const k = spare.shift();
      add(s, bodyKey, k, 'me');
      lines.push(`Steering assigned you to ${nameOf(bodyKey, k)}.`);
    }
    // Gavel race.
    if (st.gavel && isMember(s, bodyKey, st.gavel, 'me')) {
      const g = gavelOdds(s, bodyKey, st.gavel, st);
      const c = B.comm[st.gavel];
      const title = g.post === 'chair' ? 'Chair' : 'Ranking Member';
      if (U.chance(g.p)) {
        if (g.rival && c[g.post] === g.rival.id) G().addRel(s, g.rival.id, -20);
        c[g.post] = 'me';
        c[g.post + 'Won'] = true;
        G().addRespect(s, 3);
        lines.push(`Won the ${title.toLowerCase()}'s gavel on ${nameOf(bodyKey, st.gavel)} over ${g.rival ? W().fullName(g.rival) : 'no one'} (${Math.round(g.p * 100)}% odds).`);
        GR.sim.news(s, `${me.fn} ${me.ln} wins the ${title.toLowerCase()} post on the ${GR.BODIES[bodyKey].name} ${nameOf(bodyKey, st.gavel)} Committee.`, 'gov');
      } else {
        if (g.rival) G().addRel(s, g.rival.id, -8);
        lines.push(`Lost the race for ${title.toLowerCase()} of ${nameOf(bodyKey, st.gavel)}${g.rival ? ' to ' + W().fullName(g.rival) : ''} (${Math.round(g.p * 100)}% odds).`);
      }
    }
    pickChairs(s, bodyKey, false);
    syncPrimary(s, bodyKey, me);
    if (spend) lines.push(`Spent ${spend} political points.`);
    if (st.favors.dues) lines.push(`Paid ${U.money(dues)} in party dues.`);
    if (st.favors.loyalty) lines.push('Pledged your vote on the next 3 leadership priorities. Breaking that pledge will cost you.');
    if (st.favors.carry) lines.push('Agreed to carry the leader\'s next priority bill.');
    st.done = true;
    st.result = lines;
    GR.sim.msgInbox(s, 'Committee assignments are out', lines.map((x) => '• ' + x).join('\n'));
    GR.sim.log(s, `Committee assignments: ${commsOf(s, bodyKey, 'me').map((k) => nameOf(bodyKey, k)).join(', ')}.`);
    return { ok: true, msg: lines.join(' ') };
  }

  // Mid-session transfer to an open seat (costly, needs leadership's blessing).
  function transfer(s, k) {
    const bodyKey = G().myBody(s);
    const B = bodyKey && s.bodies[bodyKey];
    const me = s.pols.me;
    if (!B || !B.comm[k]) return { ok: false };
    if (s.steer && !s.steer.done) return { ok: false, msg: 'Steering is meeting; put your request in there.' };
    if (isMember(s, bodyKey, k, 'me')) return { ok: false, msg: 'You already sit on that committee.' };
    if (openSeats(s, bodyKey, k, me.party) <= 0) return { ok: false, msg: `Your party has no open seats on ${nameOf(bodyKey, k)}. Wait for the next session's steering committee.` };
    const cost = 25 + (tierOf(bodyKey, k) === 'A' ? 30 : 0);
    const keepA = commsOf(s, bodyKey, 'me').filter((x) => tierOf(bodyKey, x) === 'A');
    if (tierOf(bodyKey, k) === 'A' && keepA.length >= maxA(bodyKey)) return { ok: false, msg: `You already hold the maximum number of exclusive committees. Give one up at the next steering meeting.` };
    if (me.pp < cost) return { ok: false, msg: `Costs ${cost} political points.` };
    me.pp -= cost;
    const p = seatOdds(s, bodyKey, k, { pp: 0, favors: {} }) * 0.8;
    if (!U.chance(p)) { G().addRespect(s, -0.5); return { ok: true, msg: `Leadership turned down your request (${Math.round(p * 100)}% odds).` }; }
    const slots = GR.COMMITTEE_SLOTS[bodyKey] || 2;
    while (usedSlots(s, bodyKey, 'me') + slotCost(bodyKey, k) > slots) {
      const drop = commsOf(s, bodyKey, 'me').sort((a, b) => 'CBA'.indexOf(tierOf(bodyKey, a)) - 'CBA'.indexOf(tierOf(bodyKey, b)))[0];
      if (!drop) break;
      remove(s, bodyKey, drop, 'me');
    }
    add(s, bodyKey, k, 'me');
    s.commPref = k;
    return { ok: true, msg: `Leadership approved your move to ${nameOf(bodyKey, k)}.` };
  }

  // Breaking a steering loyalty pledge on a party-line vote.
  function onPartyVote(s, bodyKey, withParty) {
    const d = s.whipDebt;
    if (!d || d.body !== bodyKey) return;
    if (withParty) { d.n--; if (d.n <= 0) { s.whipDebt = null; GR.sim.msgInbox(s, 'Pledge fulfilled', 'You delivered the votes you promised leadership for your committee seats. The slate is clean.'); } return; }
    d.breaches++;
    if (d.leader) G().addRel(s, d.leader, -15);
    const me = s.pols.me;
    me.standing = U.clamp(me.standing - 4, 0, 100);
    if (d.breaches >= 2) {
      const k = commsOf(s, bodyKey, 'me').sort((a, b) => 'ABC'.indexOf(tierOf(bodyKey, a)) - 'ABC'.indexOf(tierOf(bodyKey, b)))[0];
      if (k && commsOf(s, bodyKey, 'me').length > 1) {
        remove(s, bodyKey, k, 'me');
        GR.sim.msgInbox(s, 'Stripped of your committee seat', `You broke your pledge to leadership twice. The steering committee removed you from ${nameOf(bodyKey, k)}.`);
        GR.sim.news(s, `${me.fn} ${me.ln} stripped of a seat on ${nameOf(bodyKey, k)} after defying party leadership.`, 'gov');
        pickChairs(s, bodyKey, true);
      }
      s.whipDebt = null;
    } else GR.sim.msgInbox(s, 'Leadership noticed', 'You voted against the party on a leadership priority after pledging your vote for committee seats. Do it again and you will lose a seat.');
  }

  // ---------- Markup ----------
  // Only members of the committee holding the bill (and the leadership) may amend in markup.
  function canMarkup(s, b) {
    if (!b || !['committee', 'markup'].includes(b.stage)) return false;
    return isMember(s, b.body, b.comm, 'me');
  }
  const cloneBill = (b) => Object.assign({}, b, { prov: JSON.parse(JSON.stringify(b.prov)), an: b.an, _lean: null, _line: null, _reg: null, _auth: null, pledges: b.pledges, sweet: b.sweet, agreed: b.agreed });
  function earmarkSize(J) { return Math.round(GR.fisc.totals(J).spend * (J.k === 'nation' ? 0.000008 : 0.0003)); }

  // The menu of markup amendments for a bill.
  function markupOptions(s, b) {
    const J = s.jur[b.jur];
    const out = [];
    if (b.prov.bud && GR.budget) return GR.budget.moveOptions(s, b);
    const ear = earmarkSize(J);
    out.push({ k: 'pork:me', group: 'Earmark', label: `${U.money(ear)} earmark for a project in your own district`, cost: 4 });
    // Earmarks to buy undecided committee members.
    const c = s.bodies[b.body].comm[b.comm];
    c.members.filter((id) => id !== 'me').map((id) => ({ p: s.pols[id], sc: L().components(s, s.pols[id], b).score })).filter((x) => x.p && Math.abs(x.sc) < 0.08).sort((a, x) => Math.abs(a.sc) - Math.abs(x.sc)).slice(0, 4)
      .forEach((x) => out.push({ k: 'pork:' + x.p.id, group: 'Earmark', label: `${U.money(ear)} earmark for ${W().fullName(x.p)} (${x.p.party}, score ${x.sc.toFixed(2)})`, cost: 4 }));
    // Crisis amendments: fund the lever that eases an active crisis.
    Object.entries(J.F.crises).sort((a, x) => x[1].s - a[1].s).slice(0, 4).forEach(([ck, cr]) => {
      const T = GR.CRISIS_TYPES[ck];
      const lever = (T.ag || []).map(([ak, part, w]) => ({ a: J.F.ag.find((x) => x.k === ak), part, w })).filter((x) => x.a).sort((a, x) => x.w - a.w)[0];
      if (lever) out.push({ k: 'crisis:' + ck, group: 'Crisis', label: `Address ${T.name.toLowerCase()} (severity ${Math.round(cr.s)}): +${U.money(crisisAmt(lever, J))} to ${lever.a.abbr} ${lever.part === 'opex' ? 'operations' : 'capital'}`, cost: 6 });
    });
    // Rewrites of existing provisions.
    Object.entries(b.prov.tax || {}).forEach(([k, d]) => {
      out.push({ k: `scale:tax:${k}:0.5`, group: 'Rewrite', label: `Halve the ${GR.fisc.TAXES[k].name.toLowerCase()} change (${d > 0 ? '+' : ''}${d} → ${U.round(d / 2, 2)})`, cost: 3 });
      out.push({ k: `strike:tax:${k}`, group: 'Strike', label: `Strike the ${GR.fisc.TAXES[k].name.toLowerCase()} change`, cost: 3 });
    });
    Object.entries(b.prov.ap || {}).forEach(([k, v]) => {
      const a = J.F.ag.find((x) => x.k === k);
      const n = a ? a.abbr : k;
      out.push({ k: `scale:ap:${k}:0.5`, group: 'Rewrite', label: `Cut the ${n} line in half`, cost: 3 });
      out.push({ k: `scale:ap:${k}:1.5`, group: 'Rewrite', label: `Plus-up the ${n} line by 50%`, cost: 3 });
      void v;
    });
    Object.keys(b.prov.ent || {}).forEach((k) => out.push({ k: `strike:ent:${k}`, group: 'Strike', label: `Strike the ${k} entitlement changes`, cost: 3 }));
    Object.keys(b.prov.reg || {}).forEach((k) => out.push({ k: `scale:reg:${k}:0.5`, group: 'Rewrite', label: `Halve new compliance costs on ${k}`, cost: 3 }));
    (b.prov.ear || []).forEach((e, i) => { if (e.who !== 'me') out.push({ k: `strike:ear:${i}`, group: 'Strike', label: `Strike the earmark: ${e.proj}`, cost: 3 }); });
    // Pay-fors.
    const an = b.an;
    if (an && an.cumDef > 0) {
      const tk = J.F.tax.high != null ? 'high' : J.F.tax.corp != null ? 'corp' : Object.keys(J.F.tax)[0];
      out.push({ k: `offset:${tk}`, group: 'Pay-for', label: `Pay for it: +${tk === 'prop' ? '0.5 mills' : '0.5 pp'} on the ${GR.fisc.TAXES[tk].name.toLowerCase()}`, cost: 4 });
      const adm = J.F.ag.slice().sort((a, x) => a.eff - x.eff)[0];
      if (adm) out.push({ k: `offset:cut:${adm.k}`, group: 'Pay-for', label: `Pay for it: 3% across-the-board cut to ${adm.abbr} operations (audit rating ${Math.round(adm.eff)})`, cost: 4 });
    }
    // The vice chair manages the markup for the chair: amendments cost less.
    const cm = s.bodies[b.body].comm[b.comm];
    if (cm && cm.vice === 'me') out.forEach((o) => { o.cost = Math.max(1, o.cost - 1); });
    return out;
  }
  // Sized to the agency, capped at a slice of the whole budget (0.15% federal, 0.6% state/local).
  function crisisAmt(lever, J) {
    const a = lever.a;
    const raw = lever.part === 'opex' ? a.opex * 0.05 : lever.part === 'capex' ? Math.max(a.capex * 0.1, a.opex * 0.02) : a.opex * 0.03 + a.capex * 0.06;
    return Math.round(Math.min(raw, GR.fisc.totals(J).spend * (J.k === 'nation' ? 0.0015 : 0.006)));
  }

  // Apply an amendment to a bill object (real or a clone). Returns a label or null.
  function applyAmend(s, b, key) {
    const J = s.jur[b.jur];
    const prov = b.prov;
    const [kind, a1, a2, a3] = key.split(':');
    if (kind === 'bud' && prov.bud && GR.budget) { const moved = GR.budget.move(J, prov.bud, a1, a2, +a3); GR.budget.compile(J, prov); b._reg = null; const lf = GR.budget.lineOf(J, a1), lt = GR.budget.lineOf(J, a2); return moved ? `Moved ${U.money(moved)} from ${lf.name.toLowerCase()} to ${lt.name.toLowerCase()}` : null; }
    if (kind === 'pork') {
      const who = a1 === 'me' ? s.pols.me : s.pols[a1];
      if (!who) return null;
      const ag = J.F.ag.find((x) => ['dot', 'works', 'facil', 'water', 'env', 'hied', 'transit', 'doe', 'usda'].includes(x.k)) || J.F.ag[0];
      const proj = L().earmarkName(s, who, ag);
      prov.ear.push({ who: who.id, ag: ag.k, amt: earmarkSize(J), proj, markup: true });
      return `Earmark: ${proj}`;
    }
    if (kind === 'crisis') {
      const T = GR.CRISIS_TYPES[a1];
      const lever = (T.ag || []).map(([ak, part, w]) => ({ a: J.F.ag.find((x) => x.k === ak), part, w })).filter((x) => x.a).sort((a, x) => x.w - a.w)[0];
      if (!lever) return null;
      const amt = crisisAmt(lever, J);
      const line = prov.ap[lever.a.k] || (prov.ap[lever.a.k] = {});
      if (lever.part === 'opex') line.opex = (line.opex || 0) + amt;
      else if (lever.part === 'capex') line.capex = (line.capex || 0) + amt;
      else { line.opex = (line.opex || 0) + Math.round(amt * 0.4); line.capex = (line.capex || 0) + Math.round(amt * 0.6); }
      return `Crisis amendment: +${U.money(amt)} to ${lever.a.abbr} for ${T.name.toLowerCase()}`;
    }
    if (kind === 'scale') {
      const f = +a3;
      if (a1 === 'tax' && prov.tax[a2] != null) { prov.tax[a2] = U.round(prov.tax[a2] * f, 2); return `${GR.fisc.TAXES[a2].name} change scaled ×${f}`; }
      if (a1 === 'reg' && prov.reg[a2] != null) { prov.reg[a2] = U.round(prov.reg[a2] * f, 2); return `Compliance costs on ${a2} scaled ×${f}`; }
      if (a1 === 'ap' && prov.ap[a2]) { const v = prov.ap[a2]; if (v.opex) v.opex = Math.round(v.opex * f); if (v.capex) v.capex = Math.round(v.capex * f); const ag = J.F.ag.find((x) => x.k === a2); return `${ag ? ag.abbr : a2} line scaled ×${f}`; }
      return null;
    }
    if (kind === 'strike') {
      if (a1 === 'ear') { const e = prov.ear[+a2]; if (!e) return null; prov.ear.splice(+a2, 1); return `Struck earmark: ${e.proj}`; }
      if (prov[a1] && prov[a1][a2] != null) { delete prov[a1][a2]; return `Struck the ${a1 === 'tax' ? GR.fisc.TAXES[a2].name.toLowerCase() : a2} provision`; }
      return null;
    }
    if (kind === 'offset') {
      if (a1 === 'cut') { const ag = J.F.ag.find((x) => x.k === a2); if (!ag) return null; const line = prov.ap[a2] || (prov.ap[a2] = {}); line.opex = (line.opex || 0) - Math.round(ag.opex * 0.03); return `Pay-for: 3% cut to ${ag.abbr} operations`; }
      prov.tax[a1] = U.round((prov.tax[a1] || 0) + 0.5, 2);
      return `Pay-for: +0.5 on the ${GR.fisc.TAXES[a1].name.toLowerCase()}`;
    }
    return null;
  }

  // Committee vote on an amendment: each member compares the bill with and without it.
  function amendVote(s, b, trial, by) {
    const c = s.bodies[b.body].comm[b.comm];
    const byP = s.pols[by];
    let y = 0, n = 0;
    const rows = [];
    c.members.forEach((id) => {
      const p = s.pols[id];
      if (!p || p.isPlayer) return;
      const d = L().components(s, p, trial).score - L().components(s, p, b).score;
      const tilt = byP ? (byP.party === p.party ? 0.02 : -0.025) + (by === 'me' ? U.clamp(G().rel(s, id) / 1500, -0.03, 0.03) : 0) : 0;
      const v = d + tilt + U.gauss() * 0.012 > 0 ? 'y' : 'n';
      v === 'y' ? y++ : n++;
      rows.push({ id, v, d });
    });
    if (c.members.includes('me') && by === 'me') y++;
    return { y, n, rows };
  }

  // The player offers an amendment during markup.
  function markup(s, billId, key) {
    const b = L().findBill(s, billId);
    const me = s.pols.me;
    if (!canMarkup(s, b)) return { ok: false, msg: 'Only members of the committee holding the bill can offer amendments in markup.' };
    // Budget moves can name any two lines.
    const opt = markupOptions(s, b).find((o) => o.k === key) || (b && b.prov.bud && /^bud:[^:]+:[^:]+:\d+$/.test(key) ? { k: key, cost: 4 } : null);
    if (!opt) return { ok: false, msg: 'That amendment is no longer in order.' };
    if (s.hoursLeft < 2) return { ok: false, msg: 'Offering an amendment takes 2 hours.' };
    if (me.pp < opt.cost) return { ok: false, msg: `Costs ${opt.cost} political points.` };
    s.hoursLeft -= 2;
    me.pp -= opt.cost;
    const c = s.bodies[b.body].comm[b.comm];
    const trial = cloneBill(b);
    const label = applyAmend(s, trial, key);
    if (!label) return { ok: false, msg: 'The amendment could not be drafted.' };
    L().analysis(s, trial);
    const chair = s.pols[c.chair];
    b.amends = b.amends || [];
    let res;
    if (c.chair === 'me') res = { y: c.members.length, n: 0, chair: true };
    else {
      // A hostile chair can rule an amendment out of order.
      const chairD = chair ? L().components(s, chair, trial).score - L().components(s, chair, b).score : 0;
      if (chair && chair.party !== me.party && chairD < -0.04 && G().rel(s, chair.id) < 25) {
        b.amends.push({ by: 'me', label, ok: false, why: 'ruled non-germane by the chair', w: s.week });
        G().addRel(s, chair.id, -1);
        return { ok: true, msg: `${W().fullName(chair)} ruled your amendment non-germane. Build a better relationship with the chair, or win the gavel yourself.` };
      }
      res = amendVote(s, b, trial, 'me');
    }
    const pass = res.y > res.n;
    b.amends.push({ by: 'me', label, ok: pass, y: res.y, n: res.n, w: s.week });
    if (!pass) return { ok: true, msg: `Amendment rejected in committee, ${res.y}-${res.n}: ${label}.` };
    applyAmend(s, b, key);
    b.an = trial.an;
    b._lean = null; b._line = null;
    b.sum = L().describe(s, b).slice(0, 3).join('; ');
    if (key === 'pork:me') { me.app = U.clamp(me.app + 0.8, 1, 99); }
    else if (key.startsWith('pork:')) G().addRel(s, key.slice(5), 6);
    else if (key.startsWith('crisis:')) G().addRespect(s, 0.5);
    G().addRespect(s, 0.3);
    return { ok: true, msg: `${res.chair ? 'As chair, you adopted' : `Adopted ${res.y}-${res.n}:`} ${label}. Dynamic score updated.` };
  }

  // NPC chairs write a "chairman's mark": earmarks for wavering members of their party.
  function chairsMark(s, b) {
    const c = s.bodies[b.body].comm[b.comm];
    const chair = s.pols[c.chair];
    if (!chair || chair.isPlayer || ['cr'].includes(b.kind)) return;
    const J = s.jur[b.jur];
    b.amends = b.amends || [];
    const soft = c.members.map((id) => s.pols[id]).filter((p) => p && !p.isPlayer && p.party === chair.party).map((p) => ({ p, sc: L().components(s, p, b).score })).filter((x) => x.sc < 0.02 && x.sc > -0.12).slice(0, J.k === 'nation' ? 3 : 2);
    soft.forEach((x) => { if (U.chance(0.6)) { const lbl = applyAmend(s, b, 'pork:' + x.p.id); if (lbl) b.amends.push({ by: chair.id, label: lbl + ' (chairman\'s mark)', ok: true, w: s.week }); } });
    // Sometimes the chair also addresses the worst crisis.
    if (U.chance(0.25)) {
      const worst = Object.entries(J.F.crises).sort((a, x) => x[1].s - a[1].s)[0];
      if (worst) { const lbl = applyAmend(s, b, 'crisis:' + worst[0]); if (lbl) b.amends.push({ by: chair.id, label: lbl + ' (chairman\'s mark)', ok: true, w: s.week }); }
    }
    if (b.amends.some((a) => a.by === chair.id)) { L().analysis(s, b); b.sum = L().describe(s, b).slice(0, 3).join('; '); }
  }

  // Lobby a chair whose committee you do not sit on to give your bill a hearing.
  function lobbyHearing(s, billId) {
    const b = L().findBill(s, billId);
    const me = s.pols.me;
    if (!b || b.stage !== 'committee') return { ok: false, msg: 'Only bills waiting in committee need a hearing.' };
    const c = s.bodies[b.body].comm[b.comm];
    const chair = s.pols[c.chair];
    if (!chair || chair.isPlayer) return { ok: false, msg: 'You hold that gavel yourself.' };
    if (b.agreed[chair.id]) return { ok: false, msg: 'The chair has already agreed to hear it.' };
    const lvl = GR.OFFICES[s.seats[me.seat].off].level;
    const cost = 6 + lvl * 3;
    if (s.hoursLeft < 3) return { ok: false, msg: 'Lobbying a chair takes 3 hours.' };
    if (me.pp < cost) return { ok: false, msg: `Costs ${cost} political points.` };
    s.hoursLeft -= 3;
    me.pp -= cost;
    const sc = L().components(s, chair, b).score;
    const member = isMember(s, b.body, b.comm, 'me');
    const vice = s.pols[c.vice];
    const x = sc * 9 + G().rel(s, chair.id) / 28 + ((me.respect || 20) - 35) / 30 + (chair.party === me.party ? 0.5 : -0.6) + (member ? 0.6 : 0) - 0.4 + (c.vice === 'me' ? 0.9 : vice && b.agreed[vice.id] ? 0.6 : 0);
    const p = U.clamp(sig(x), 0.03, 0.95);
    if (U.chance(p)) { b.agreed[chair.id] = true; G().addRel(s, chair.id, 2); return { ok: true, msg: `${W().fullName(chair)} agreed to schedule a hearing and markup on your ${b.title} (${Math.round(p * 100)}% odds).` }; }
    G().addRel(s, chair.id, -2);
    return { ok: true, msg: `${W().fullName(chair)} would not commit to a hearing (${Math.round(p * 100)}% odds). Try a deal in Negotiations, or a discharge petition.` };
  }

  // Committee vote to report a bill to the floor.
  function reportVote(s, b) {
    const c = s.bodies[b.body].comm[b.comm];
    const r = L().roll(s, b, b.body, { only: c.members, myVote: b.my['cv' + b.body] });
    return r;
  }

  // ---------- Weekly ----------
  function week(s) {
    const mb = G().myBody(s);
    if (mb) migrate(s, mb);
    if (s.steer && !s.steer.done && s.week >= s.steer.due) {
      const r = resolveSteering(s);
      if (!r.ok && s.steer) { s.steer.pp = 0; s.steer.gavelPP = 0; s.steer.favors.dues = false; resolveSteering(s); }
    }
    if (s.steer && s.steer.done && s.week - s.steer.due > 8) s.steer = null;
    if (s.steer && G().myBody(s) !== s.steer.body) s.steer = null;
  }

  // Summary of the player's committee posts.
  function myPosts(s) {
    const bodyKey = G().myBody(s);
    if (!bodyKey || !s.bodies[bodyKey]) return [];
    return commsOf(s, bodyKey, 'me').map((k) => {
      const c = s.bodies[bodyKey].comm[k];
      return { k, name: nameOf(bodyKey, k), tier: tierOf(bodyKey, k), role: c.chair === 'me' ? 'Chair' : c.vice === 'me' ? 'Vice Chair' : c.rank === 'me' ? 'Ranking Member' : 'Member', sen: c.sen.me || 0, rank: seniorityRank(s, bodyKey, k, 'me') };
    });
  }
  const isChair = (s, bodyKey, k) => !!(s.bodies[bodyKey] && s.bodies[bodyKey].comm[k] && s.bodies[bodyKey].comm[k].chair === 'me');
  const chairsMoney = (s) => { const bk = G().myBody(s); return !!bk && Object.keys(s.bodies[bk].comm).some((k) => isMoney(k) && s.bodies[bk].comm[k].chair === 'me'); };

  return {
    listFor, def, nameOf, tierOf, slotCost, sizeOf, quota, openSeats, commsOf, usedSlots, isMember, primary, seniorityRank, setup, migrate, reorganize, join, inherit, add, remove,
    steerLeader, duesAmount, maxA, openSteering, seatOdds, gavelOdds, canBidGavel, setSteer, resolveSteering, transfer, onPartyVote,
    canMarkup, markupOptions, markup, chairsMark, lobbyHearing, reportVote, week, myPosts, isChair, isMoney, chairsMoney, pickChairs,
  };
})();
