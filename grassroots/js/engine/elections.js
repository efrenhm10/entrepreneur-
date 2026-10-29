// Elections: calendar, who runs, the vote model, primaries, general elections,
// polls, results by county/neighborhood, and the presidential race.
var GR = globalThis.GR || (globalThis.GR = {});

GR.elect = (function () {
  const U = GR.util;
  const W = () => GR.world;

  // ---------- Calendar ----------
  const filingWeek = (y, off) => (off === 'president' ? U.weekOfMD(y - 1, 11, 15) : U.weekOfMD(y, 2, 15));
  const primaryWeek = (y) => U.weekOfMD(y, 5, 2);
  const generalWeek = (y) => U.electionWeek(y);
  const declareOpenWeek = (y) => U.weekOfMD(y - 2, 10, 15);
  // Presidential nominating contests (week offset from Jan 1 of the election year).
  const PRES_CAL = [
    { w: 2, name: 'Iowa caucuses', st: ['IA'] },
    { w: 4, name: 'New Hampshire primary', st: ['NH'] },
    { w: 6, name: 'Nevada & South Carolina', st: ['NV', 'SC'] },
    { w: 8, name: 'Michigan primary', st: ['MI'] },
    { w: 9, name: 'Super Tuesday', st: ['AL', 'AR', 'CA', 'CO', 'ME', 'MA', 'MN', 'NC', 'OK', 'TN', 'TX', 'UT', 'VT', 'VA'] },
    { w: 11, name: 'March contests', st: ['GA', 'MS', 'WA', 'ID', 'MO', 'ND', 'HI'] },
    { w: 12, name: 'Big Tuesday', st: ['FL', 'IL', 'OH', 'AZ', 'KS'] },
    { w: 15, name: 'April primaries', st: ['WI', 'NY', 'LA', 'AK', 'WY'] },
    { w: 17, name: 'Acela primaries', st: ['PA', 'CT', 'DE', 'RI', 'MD'] },
    { w: 19, name: 'May primaries', st: ['IN', 'NE', 'WV', 'KY', 'OR'] },
    { w: 22, name: 'Final primaries', st: ['NJ', 'NM', 'MT', 'SD', 'DC'] },
  ];
  const presContestWeek = (y, i) => U.weekOfMD(y, 0, 1) + PRES_CAL[i].w;
  const conventionWeek = (y) => U.weekOfMD(y, 7, 15);
  const EV = (ab) => (ab === 'DC' ? 3 : GR.STATE[ab].cd + 2);
  const delegates = (ab) => Math.max(10, Math.round(EV(ab) * 8.5));

  // Typical amount a competitive campaign spends.
  const PER_CAP = { school: 0.08, council: 0.25, mayor: 1.0, statehouse: 1.2, statesenate: 1.5, ushouse: 2.6, governor: 1.5, ussenate: 2.0, president: 2.6 };
  const FLOOR = { school: 3000, council: 6000, mayor: 20000, statehouse: 30000, statesenate: 60000, ushouse: 450000, governor: 1500000, ussenate: 2500000, president: 1.2e8 };
  function scale(s, seat) {
    const pr = W().seatProfile(s, seat);
    return Math.round(Math.max(FLOOR[seat.off], pr.pop * PER_CAP[seat.off]));
  }

  // ---------- Voter groups and enthusiasm ----------
  // Where each voter group stands on a policy (score -2..2) in an area.
  function ideal(pr, g, pol) {
    const shift = pr.lean / 25;
    if (pol.ideo === 0) return U.clamp(pol.bias + U.seeded('id' + pol.k + Math.round(pr.lean)).gauss() * 0.3, -2, 2);
    const b = pol.bias || 0;
    if (g === 'D') return U.clamp(-0.95 + shift + b * 0.5, -2, 2);
    if (g === 'R') return U.clamp(0.95 + shift + b * 0.5, -2, 2);
    return U.clamp(shift * 1.4 + b, -2, 2);
  }

  // Share of a voter group that agrees with a position (0-100).
  function groupAgree(pr, g, pol, score, shift) {
    const id = ideal(pr, g, pol) + (shift || 0);
    return Math.round(100 * (1 - U.ncdf((Math.abs(score - id) - 0.9) / 0.6)));
  }

  // Baseline enthusiasm for a candidate among a group, from how close their positions are.
  function baseEnth(s, p, pr, g, lvl, emph) {
    let tot = 0, wsum = 0;
    const pols = lvl ? GR.POLICIES.filter((x) => x.lv.includes(lvl) || x.lv.includes('n')) : GR.POLICIES;
    pols.forEach((pol) => {
      const w = pol.sal * (emph && emph[pol.cat] ? 1.8 : 1) * (pol.ideo === 0 ? 0.3 : 1);
      tot += Math.abs(W().stance(p, pol.k) - ideal(pr, g, pol)) * w;
      wsum += w;
    });
    const dist = tot / wsum;
    return U.clamp(Math.round(84 - dist * 30 + (p.party === g ? 4 : 0)), 3, 96);
  }
  // Fast version for AI-only races.
  function fastEnth(p, pr, g) {
    const v = (p.fis + p.soc) / 2;
    const id = g === 'D' ? -0.95 + pr.lean / 25 : g === 'R' ? 0.95 + pr.lean / 25 : pr.lean / 18;
    return U.clamp(Math.round(80 - Math.abs(v - id) * 30 + (p.party === g ? 4 : 0)), 3, 96);
  }

  // Campaign stats for a candidate in a race.
  function candStats(s, race, p, detailed) {
    const seat = s.seats[race.seat] || { off: 'president' };
    const pr = race.pr || W().seatProfile(s, seat);
    const inc = race.inc === p.id;
    const lvl = GR.lvlOf(GR.OFFICES[race.off].jur);
    const sc = race.scale;
    const rec = p.isPlayer ? playerRec(s, race.off) : U.clamp(inc ? 45 + (p.terms[race.off] || 0) * 6 + GR.OFFICES[race.off].level * 3 : p.rec * 0.6 + (p.seat ? 15 : 0), 3, 95);
    const enth = {};
    ['D', 'R', 'I'].forEach((g) => { enth[g] = detailed ? baseEnth(s, p, pr, g, lvl) : fastEnth(p, pr, g); });
    return {
      id: p.id, rec: Math.round(rec), enth, base: Object.assign({}, enth), funds: p.isPlayer ? 0 : Math.round(sc * (inc ? 0.35 : 0.08) * (p.q / 50)),
      raised: 0, spent: 0, ground: 0, endorse: [], debate: 0, attack: 0, momentum: 0, presence: {}, vols: 0, offices: {},
    };
  }

  function playerRec(s, off) {
    const me = s.pols.me;
    const t = GR.OFFICES[off].tier;
    if (t === 'national') return Math.max(me.recNat, me.recState * 0.25);
    if (t === 'state') return Math.max(me.recState, me.recLocal * 0.35);
    if (off === 'ushouse' || off === 'statesenate') return Math.max(me.recLocal * 0.7, me.recState);
    return Math.max(me.recLocal, me.recState);
  }

  // ---------- Vote model ----------
  // Share of each candidate's vote in an area. cs: candidate stats; parties: ids -> party.
  // primary: only that party's voters (with a few independents).
  function shares(s, race, cands, pr, opts = {}) {
    const groups = opts.primary ? [[opts.primary, 0.88], ['I', 0.12]] : [['D', pr.D], ['R', pr.R], ['I', pr.I]];
    const totals = {};
    cands.forEach((id) => { totals[id] = 0; });
    let turnout = 0;
    const env = race.env || 0;
    groups.forEach(([g, frac]) => {
      const us = cands.map((id) => {
        const p = s.pols[id], c = race.cs[id];
        const loyal = opts.primary ? 0 : g === 'I' ? 0 : g === p.party ? 1.25 : -1.25;
        const kE = opts.primary ? 1.7 : 1.15, kR = opts.primary ? 2.1 : 0.85;
        const pres = (opts.area && c.presence[opts.area]) || 0;
        const rec = U.clamp(c.rec + pres, 0, 100);
        let u = loyal + (kE * (c.enth[g] - 50)) / 50 + (kR * (rec - 50)) / 50 + bonus(s, race, id) / 5;
        if (!opts.primary) u += (p.party === 'R' ? env : -env) / 9;
        if (opts.noise) u += opts.noise[id] || 0;
        return u;
      });
      const mx = Math.max(...us);
      const ex = us.map((u) => Math.exp(u - mx));
      const sum = U.sum(ex);
      const maxE = Math.max(...cands.map((id) => race.cs[id].enth[g]));
      const t = frac * (0.82 + (0.36 * maxE) / 100);
      turnout += t;
      cands.forEach((id, i) => { totals[id] += (t * ex[i]) / sum; });
    });
    const out = {};
    cands.forEach((id) => { out[id] = totals[id] / turnout; });
    return { share: out, turnout };
  }

  // Money, ground game, endorsements, incumbency, debates and scandals, in points.
  function bonus(s, race, id) {
    const c = race.cs[id], p = s.pols[id];
    const ids = race.active || Object.keys(race.cs);
    const avg = U.avg(ids, (x) => race.cs[x].spent) || 0;
    const k = race.scale * 0.15;
    let b = U.clamp(1.7 * Math.log2((c.spent + k) / (avg + k)), -3.5, 3.5);
    b += U.clamp((c.ground / race.scale) * 6, 0, 2.5);
    b += U.clamp(U.sum(c.endorse, (e) => e.w || 0.5), 0, 3.5);
    if (race.inc === id) b += 1.4 + ((p.app || 50) - 50) / 14;
    b += c.debate + c.momentum - c.attack;
    if (p.isPlayer) b -= (p.scandal || 0) / 8;
    if (p.isPlayer && p.traits.includes('maverick')) b += 0.3;
    return b;
  }

  // Poll: expected shares with sampling error and undecideds.
  function poll(s, race, err = 3.5) {
    const cands = race.phase === 'primary' ? race.prim[race.pollParty || s.pols.me.party].cands : race.active;
    if (!cands || !cands.length) return null;
    const pr = race.pr;
    const r = shares(s, race, cands, pr, race.phase === 'primary' ? { primary: race.pollParty || s.pols.me.party } : {});
    const wks = Math.max(0, (race.phase === 'primary' ? primaryWeek(race.year) : generalWeek(race.year)) - s.week);
    const und = U.clamp(4 + wks * 0.45 + (100 - U.avg(cands, (id) => race.cs[id].rec)) * 0.12, 3, 40);
    const out = {};
    let left = 100 - und;
    cands.forEach((id) => { out[id] = U.clamp(r.share[id] * left + U.gauss() * err * 0.6, 0, 100); });
    const tot = U.sum(Object.values(out));
    cands.forEach((id) => { out[id] = U.round((out[id] / tot) * left, 1); });
    return { w: s.week, v: out, und: U.round(und, 1), moe: err };
  }

  // ---------- Who runs ----------
  function homeSeatsOf(s, p) {
    if (p.z == null) return {};
    if (!p._hs || p._hsz !== p.z) { Object.defineProperty(p, '_hs', { value: W().homeSeats(s, p.z), writable: true, enumerable: false, configurable: true }); p._hsz = p.z; }
    return p._hs;
  }
  const levelOf = (off) => GR.OFFICES[off].level;

  function termLimited(s, p, off) {
    if (off === 'president') return (p.terms.president || 0) >= 2;
    if (off === 'governor') { const gl = GR.STATE[s.home.state].gl; return gl > 0 && (p.terms.governor || 0) >= gl; }
    return false;
  }

  function makeRace(s, seat, year) {
    const race = { id: 'r' + year + seat.id, seat: seat.id, off: seat.off, year, inc: seat.holder, cands: [], cs: {}, prim: { D: { cands: [] }, R: { cands: [] } }, nom: {}, phase: 'filing', polls: [], env: 0 };
    race.scale = scale(s, seat);
    race.pr = W().seatProfile(s, seat);
    return race;
  }

  // At the start of an election year: open races and decide who runs.
  function openYear(s, year) {
    s.races = s.races || {};
    if (s.races[year]) return;
    const seats = Object.values(s.seats).filter((x) => x.next === year && x.off !== 'president');
    const races = seats.map((seat) => makeRace(s, seat, year));
    s.races[year] = races;
    const pres = year % 4 === 0;
    s.nat.env = nationalEnv(s, year);
    races.forEach((r) => { r.env = s.nat.env; });
    // Incumbents decide first.
    const byLevel = races.slice().sort((a, b) => levelOf(b.off) - levelOf(a.off));
    byLevel.forEach((race) => {
      const inc = s.pols[race.inc];
      if (!inc || inc.isPlayer) return;
      const age = W().ageOf(s, inc);
      const retire = termLimited(s, inc, race.off) || (age >= 78 ? U.chance(0.8) : age >= 70 ? U.chance(0.4) : U.chance(0.06)) || (inc.app < 38 && U.chance(0.3));
      if (retire) { race.retiring = inc.id; return; }
      addCand(s, race, inc);
    });
    // Ambitious officeholders run for open or vulnerable higher seats.
    byLevel.forEach((race) => {
      const open = !race.cands.length;
      const lvl = levelOf(race.off);
      const pool = Object.values(s.pols).filter((p) => p.alive && !p.isPlayer && !p.ext && p.seat && p.seat !== race.seat && !p.running && levelOf(s.seats[p.seat].off) < lvl && levelOf(s.seats[p.seat].off) >= lvl - 3);
      const eligible = pool.filter((p) => livesIn(s, p, race) && W().ageOf(s, p) >= GR.OFFICES[race.off].minAge && W().ageOf(s, p) < 72);
      ['D', 'R'].forEach((party) => {
        const pr = race.pr;
        const lean = party === 'R' ? pr.lean : -pr.lean;
        const hasInc = race.cands.some((id) => s.pols[id].party === party && id === race.inc);
        let want = hasInc ? (U.chance(0.18) ? 1 : 0) : open ? U.randInt(1, 3) : lean > -12 ? U.randInt(1, 2) : (U.chance(lean > -25 ? 0.8 : 0.45) ? 1 : 0);
        const cand = eligible.filter((p) => p.party === party).sort((a, b) => b.amb * (b.q + b.rec) - a.amb * (a.q + a.rec));
        for (const p of cand) {
          if (want <= 0) break;
          if (p.amb < 0.35 || !U.chance(open ? 0.55 : 0.25)) continue;
          const own = s.seats[p.seat];
          if (own.next === year) { const ownRace = races.find((r) => r.seat === own.id); if (ownRace) { ownRace.cands = ownRace.cands.filter((x) => x !== p.id); ownRace.leaving = p.id; } }
          addCand(s, race, p);
          want--;
        }
        while (want-- > 0) addCand(s, race, W().newPol(s, { party, lean: race.pr.lean, level: lvl - 1, z: W().pickZipIn(s, s.seats[race.seat]), rec: U.randInt(8, 30) + lvl * 2, age: U.randInt(28, 64) }));
      });
    });
    if (pres) GR.pres.openPres(s, year);
    GR.scenes.openYearHook(s, year, races);
  }

  function livesIn(s, p, race) {
    const hs = homeSeatsOf(s, p);
    const k = race.off;
    if (k === 'governor' || k === 'ussenate' || k === 'mayor') return k !== 'mayor' || hs.council != null;
    return hs[k] === race.seat;
  }

  function addCand(s, race, p) {
    if (race.cands.includes(p.id)) return;
    race.cands.push(p.id);
    race.prim[p.party].cands.push(p.id);
    race.cs[p.id] = candStats(s, race, p, false);
    p.running = race.id;
  }

  // Generic-ballot environment: positive favors Republicans.
  function nationalEnv(s, year) {
    const pp = s.nat.presParty;
    const mid = year % 4 === 2;
    const econ = s.jur ? (s.jur.nation.met.growth - 2) * 1.2 - (s.jur.nation.met.unemp - 4.3) * 1.2 : 0;
    const presApp = s.pols[s.nat.president] ? s.pols[s.nat.president].app : 50;
    let v = U.gauss() * 2.2 + (mid ? 2.5 : 0.8) * (pp === 'R' ? -1 : 1);
    v += (econ + (presApp - 47) / 4) * (pp === 'R' ? 1 : -1) * 0.6;
    return U.round(U.clamp(v, -9, 9), 1);
  }

  // ---------- Player candidacy ----------
  function canRun(s, seatId) {
    const me = s.pols.me;
    const seat = s.seats[seatId];
    if (!seat) return { ok: false, why: 'No such office.' };
    const off = GR.OFFICES[seat.off];
    const year = seat.next;
    const age = W().ageOf(s, me) + (year - U.yearOf(s.week));
    if (age < off.minAge) return { ok: false, why: `Must be ${off.minAge} by election day.` };
    if (s.campaign) return { ok: false, why: 'You are already running for office.' };
    if (s.week < declareOpenWeek(year)) return { ok: false, why: `Filing opens ${U.fmtDate(declareOpenWeek(year))}.` };
    if (s.week > filingWeek(year, seat.off)) return { ok: false, why: 'The filing deadline has passed.' };
    if (me.seat === seatId && year === seat.next && s.seats[seatId].holder === 'me') return { ok: true, re: true, year };
    if (seat.off === 'governor' && termLimited(s, me, 'governor') && me.seat === 'gov') return { ok: false, why: 'Term-limited.' };
    if (seat.off === 'president' && termLimited(s, me, 'president')) return { ok: false, why: 'Term-limited.' };
    return { ok: true, year };
  }

  function filingFee(s, seat) { return Math.round(Math.min(5000, Math.max(50, scale(s, seat) * 0.004)) / 10) * 10; }

  function declare(s, seatId) {
    const chk = canRun(s, seatId);
    if (!chk.ok) return chk;
    const seat = s.seats[seatId];
    const me = s.pols.me;
    const year = seat.next;
    if (seat.off === 'president') return GR.pres.declare(s, year);
    openYear(s, year);
    const race = s.races[year].find((r) => r.seat === seatId);
    const fee = filingFee(s, seat);
    if (me.money + me.warChest < fee && fee > 500) return { ok: false, why: `The filing fee is ${U.money(fee)}.` };
    if (me.warChest >= fee) me.warChest -= fee; else { me.money -= fee; if (me.money < 0) { me.debt = (me.debt || 0) - me.money; me.money = 0; } }
    race.cands.push('me');
    race.prim[me.party].cands.push('me');
    race.cs.me = candStats(s, race, me, true);
    race.detail = true;
    race.cands.forEach((id) => { if (id !== 'me') { const c = race.cs[id]; const fresh = candStats(s, race, s.pols[id], true); c.enth = fresh.enth; c.base = fresh.base; } });
    race.cs.me.funds = me.warChest;
    me.warChest = 0;
    me.running = race.id;
    s.campaign = { race: race.id, year, seat: seatId, staff: {}, ads: { tv: 0, radio: 0, digital: 0, mail: 0 }, tone: 'positive', target: null, themes: [], promoted: {}, opinion: {}, opps: [], ledger: [], msgs: [], prepped: 0, polls: [], started: s.week, overhead: 0 };
    GR.sim.log(s, `Declared candidacy for ${W().seatTitle(s, seat)} (${year}).`);
    GR.sim.news(s, `${me.fn} ${me.ln} (${me.party}) files to run for ${W().seatTitle(s, seat)}.`, 'campaign');
    GR.camp.makeOpps(s);
    return { ok: true };
  }

  function playerRace(s) {
    if (!s.campaign) return null;
    if (s.campaign.pres) return s.campaign.presRace;
    return (s.races[s.campaign.year] || []).find((r) => r.id === s.campaign.race) || null;
  }

  // ---------- Resolving elections ----------
  function shocks(cands, sd) { const o = {}; cands.forEach((id) => { o[id] = U.gauss() * sd; }); return o; }

  function runPrimaries(s, year) {
    (s.races[year] || []).forEach((race) => {
      ['D', 'R'].forEach((party) => {
        const P = race.prim[party];
        P.cands = P.cands.filter((id) => race.cands.includes(id));
        if (!P.cands.length) return;
        if (P.cands.length === 1) { P.winner = P.cands[0]; P.res = [{ id: P.cands[0], pct: 100, votes: 0 }]; race.nom[party] = P.cands[0]; return; }
        race.active = P.cands;
        const r = shares(s, race, P.cands, race.pr, { primary: party, noise: shocks(P.cands, race.detail ? 0.18 : 0.3) });
        const vot = Math.round(race.pr.pop * 0.74 * 0.22 * (party === 'D' ? race.pr.D : race.pr.R) * 1.4);
        P.res = P.cands.map((id) => ({ id, pct: U.round(r.share[id] * 100, 1), votes: Math.round(r.share[id] * vot) })).sort((a, b) => b.pct - a.pct);
        P.winner = P.res[0].id;
        race.nom[party] = P.winner;
        P.cands.forEach((id) => { if (id !== P.winner) { s.pols[id].running = null; } });
      });
      race.active = ['D', 'R'].map((p) => race.nom[p]).filter(Boolean);
      race.phase = 'general';
      const meIn = race.cands.includes('me');
      if (meIn) {
        const P = race.prim[s.pols.me.party];
        const won = P.winner === 'me';
        if (P.cands.length > 1) GR.sim.inboxResult(s, race, 'primary', won);
        if (!won) GR.camp.lost(s, race, 'primary');
      }
    });
  }

  function runGenerals(s, year) {
    const races = s.races[year] || [];
    races.forEach((race) => {
      const cands = race.active && race.active.length ? race.active : ['D', 'R'].map((p) => race.nom[p]).filter(Boolean);
      race.active = cands;
      if (!cands.length) { race.winner = null; race.phase = 'done'; return; }
      if (cands.length === 1) { race.winner = cands[0]; race.res = [{ id: cands[0], pct: 100, votes: Math.round(race.pr.pop * 0.3) }]; race.phase = 'done'; race.uncontested = true; return; }
      const noise = shocks(cands, race.detail ? 0.16 : 0.24);
      const turnRate = year % 4 === 0 ? 0.64 : year % 2 === 0 ? 0.48 : 0.24;
      const statewide = race.off === 'governor' || race.off === 'ussenate';
      const areas = statewide ? GR.geo.counties(GR.geo.state(s.home.state)).map((c) => ({ k: c.k, name: c.name, pr: c.prof, pop: c.prof.pop })) : (race.detail || race.off === 'mayor' || race.off === 'ushouse') ? zipAreas(s, race) : null;
      let votes = {};
      cands.forEach((id) => { votes[id] = 0; });
      let tv = 0;
      if (areas) {
        race.areas = [];
        areas.forEach((a) => {
          const an = Object.assign({}, noise);
          const sw = U.gauss() * 0.12;
          cands.forEach((id) => { an[id] += s.pols[id].party === 'R' ? sw : -sw; });
          const r = shares(s, race, cands, a.pr, { noise: an, area: a.k });
          const n = a.pop * 0.76 * turnRate * r.turnout;
          const row = { k: a.k, name: a.name, v: {} };
          cands.forEach((id) => { const v = Math.round(r.share[id] * n); votes[id] += v; row.v[id] = v; });
          tv += n;
          race.areas.push(row);
        });
      } else {
        const r = shares(s, race, cands, race.pr, { noise });
        const n = race.pr.pop * 0.76 * turnRate * r.turnout;
        cands.forEach((id) => { votes[id] = Math.round(r.share[id] * n); });
        tv = n;
      }
      const tot = U.sum(Object.values(votes)) || 1;
      race.res = cands.map((id) => ({ id, votes: votes[id], pct: U.round((votes[id] / tot) * 100, 1) })).sort((a, b) => b.votes - a.votes);
      race.winner = race.res[0].id;
      race.turnout = Math.round(tv);
      race.phase = 'done';
    });
    // Other states' congressional and Senate races.
    if (year % 2 === 0) otherStates(s, year);
    races.forEach((race) => {
      race.cands.forEach((id) => { const p = s.pols[id]; if (p) p.running = null; });
      if (race.cands.includes('me')) {
        const won = race.winner === 'me';
        s.stats.elections.push({ y: year, off: race.off, title: W().seatTitle(s, s.seats[race.seat]), won, pct: (race.res.find((x) => x.id === 'me') || {}).pct || 0, stage: 'general' });
        GR.sim.inboxResult(s, race, 'general', won);
        if (won) GR.camp.won(s, race); else GR.camp.lost(s, race, 'general');
      }
    });
    s.lastResults = year;
    GR.sim.news(s, `Election night ${year}: ${races.filter((r) => r.winner && r.inc && r.winner !== r.inc && r.cands.includes(r.inc)).length} incumbents defeated across ${GR.STATE[s.home.state].name}. Generic ballot: ${s.nat.env > 0 ? 'R+' + s.nat.env : s.nat.env < 0 ? 'D+' + -s.nat.env : 'even'}.`, 'election');
  }

  // Neighborhood-level results for district and city races (grouped ZIP codes).
  function zipAreas(s, race) {
    const S = GR.geo.state(s.home.state);
    const parts = W().seatParts(s, s.seats[race.seat]);
    return parts.filter(([i, w]) => S.Z[i].pop * w > 50).map(([i, w]) => {
      const z = S.Z[i];
      const pr = GR.geo.mkProfile(S, z.pop * w, z.lean, Math.log10(z.dens), z.x, z.y, 'z' + z.zip);
      return { k: z.zip, name: z.zip + ' ' + GR.geo.cityName(S, z.city), pr, pop: z.pop * w };
    });
  }

  // Every other state's House and Senate races; winners replace losing or retiring members.
  function otherStates(s, year) {
    const env = s.nat.env;
    let flips = 0;
    Object.keys(s.nat.other).forEach((ab) => {
      const o = s.nat.other[ab];
      o.cds.forEach((d, i) => {
        const p = s.pols[d.id];
        const incParty = p ? p.party : 'R';
        const retire = !p || !p.alive || W().ageOf(s, p) > 79 || U.chance(0.07);
        const inc = retire ? 0 : incParty === 'R' ? 2 : -2;
        const party = d.lean + env + inc + U.gauss() * 3.5 > 0 ? 'R' : 'D';
        if (retire || party !== incParty) {
          if (p) { p.fed = null; p.retired = true; p.lead && GR.elect.clearLead(s, p); }
          const n = W().fedMember(s, 'ushouse', ab, i + 1, null, d.lean, party, true);
          replaceFed(s, 'ushouse', d.id, n.id);
          d.id = n.id;
          if (party !== incParty) flips++;
        } else p.terms.ushouse = (p.terms.ushouse || 0) + 1;
      });
      const st = GR.STATE[ab];
      st.sc.forEach((c) => {
        if ((year - { 1: 2030, 2: 2032, 3: 2028 }[c]) % 6 !== 0) return;
        const p = s.pols[o.sen[c]];
        const incParty = p ? p.party : 'R';
        const retire = !p || !p.alive || W().ageOf(s, p) > 80 || U.chance(0.12);
        const inc = retire ? 0 : incParty === 'R' ? 2.5 : -2.5;
        const party = st.lean + env + inc + U.gauss() * 4.5 > 0 ? 'R' : 'D';
        if (retire || party !== incParty) {
          if (p) { p.fed = null; p.retired = true; p.lead && GR.elect.clearLead(s, p); }
          const n = W().fedMember(s, 'ussenate', ab, 0, c, st.lean, party, true);
          replaceFed(s, 'ussenate', o.sen[c], n.id);
          o.sen[c] = n.id;
        } else p.terms.ussenate = (p.terms.ussenate || 0) + 1;
      });
    });
    return flips;
  }
  function replaceFed(s, body, oldId, newId) {
    const list = s.nat.fed[body];
    const i = list.indexOf(oldId);
    if (i >= 0) list[i] = newId; else list.push(newId);
    GR.comm.inherit(s, body, oldId, newId);
  }

  // ---------- Taking office (first week of January) ----------
  function inaugurate(s, year) {
    const races = (s.races[year - 1] || []).filter((r) => r.phase === 'done');
    const vacated = [];
    races.forEach((race) => {
      const seat = s.seats[race.seat];
      const old = s.pols[seat.holder];
      const win = s.pols[race.winner];
      if (old && old !== win) {
        old.seat = null;
        if (old.lead) clearLead(s, old);
        if (!old.isPlayer) old.retired = race.retiring === old.id || !race.cands.includes(old.id) ? true : old.retired;
        if (old.isPlayer) GR.sim.leaveOffice(s, seat);
      }
      seat.next = W().nextElection(s, seat, year + W().termYears(s, seat.off) - 1);
      if (!win) { seat.holder = null; return; }
      if (win.seat && win.seat !== seat.id) {
        const prev = s.seats[win.seat];
        vacated.push(prev);
        if (win.isPlayer) GR.sim.leaveOffice(s, prev);
        if (win.lead) clearLead(s, win);
        prev.holder = null;
      }
      if (old !== win) {
        win.seat = seat.id;
        win.since = year;
        win.app = win.isPlayer ? 55 : U.randInt(48, 60);
        win.hist.push({ y: year, t: GR.OFFICES[seat.off].name, seat: seat.id });
        if (win.isPlayer) GR.sim.takeOffice(s, seat);
        if (!win.isPlayer) joinCommittee(s, win, seat);
      }
      win.terms[seat.off] = (win.terms[seat.off] || 0) + 1;
      seat.holder = win.id;
    });
    // Appointments to fill seats vacated by winners of higher office.
    vacated.forEach((seat) => {
      if (seat.holder) return;
      const p = W().fillSeat(s, seat, GR.OFFICES[seat.off].level);
      p.terms[seat.off] = 0;
      joinCommittee(s, p, seat);
      GR.sim.news(s, `${W().fullName(p)} (${p.party}) appointed to fill the vacancy in ${W().seatTitle(s, seat)}.`, 'gov');
    });
    // Organize each chamber that held elections.
    Object.keys(s.bodies).forEach((b) => GR.gov.organize(s, b));
  }

  function joinCommittee(s, p, seat) {
    const bk = { school: 'school', council: 'council', statehouse: 'house', statesenate: 'senate', ushouse: 'ushouse', ussenate: 'ussenate' }[seat.off];
    if (bk && s.bodies[bk]) GR.comm.join(s, bk, p);
  }

  function clearLead(s, p) {
    const B = s.bodies[p.lead.body];
    if (B && B.lead[p.lead.post] === p.id) delete B.lead[p.lead.post];
    p.lead = null;
  }

  // ---------- Weekly ----------
  function week(s) {
    const y = U.yearOf(s.week);
    // Races open at the start of the year before the filing deadline (or earlier for the player).
    if (!s.races || !s.races[y]) openYear(s, y);
    if (s.week === primaryWeek(y)) runPrimaries(s, y);
    if (s.week === generalWeek(y)) { runGenerals(s, y); GR.pres.general(s, y); }
    if (U.isYearStart(s.week)) {
      inaugurate(s, y);
      GR.pres.inaugurate(s, y);
      // Drop old race data, keep summaries.
      Object.keys(s.races).forEach((k) => { if (+k < y - 1) delete s.races[k]; });
      // Keep only results from finished AI races; full campaign data only for your own.
      (s.races[y - 1] || []).forEach((r) => { if (!r.detail && r.phase === 'done') { r.cs = {}; r.cands = (r.res || []).map((x) => x.id); } });
    }
    GR.pres.week(s, y);
  }

  return {
    PRES_CAL, filingWeek, primaryWeek, generalWeek, declareOpenWeek, presContestWeek, conventionWeek, EV, delegates, scale,
    ideal, groupAgree, baseEnth, candStats, playerRec, shares, bonus, poll, openYear, makeRace, addCand, canRun, filingFee, declare, playerRace,
    runPrimaries, runGenerals, inaugurate, nationalEnv, termLimited, week, zipAreas, shocks, homeSeatsOf, clearLead, otherStates,
  };
})();
