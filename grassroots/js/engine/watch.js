// Open seats. Term limits for state legislators (the 16 states that have them) and for
// big-city mayors and councils with charter limits; incumbents who decide a year or more ahead
// whether to retire, and announce it; and a list of every seat you could run for with what
// makes it a good (or bad) time.
var GR = globalThis.GR || (globalThis.GR = {});

GR.watch = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const E = () => GR.elect;

  // State legislative term limits in years: h/s per chamber (consecutive), t = lifetime total.
  const LEG = {
    AZ: { h: 8, s: 8 }, AR: { t: 16 }, CA: { t: 12 }, CO: { h: 8, s: 8 }, FL: { h: 8, s: 8 }, LA: { h: 12, s: 12 }, ME: { h: 8, s: 8 }, MI: { t: 12 },
    MO: { h: 8, s: 8 }, MT: { h: 8, s: 8 }, NE: { h: 8, s: 8 }, NV: { h: 12, s: 12 }, OH: { h: 8, s: 8 }, OK: { t: 12 }, SD: { h: 8, s: 8 },
  };
  // Mayors and council members: terms allowed by city charter (cities not listed have no limit).
  const MAYOR = { 'New York|NY': 2, 'Los Angeles|CA': 2, 'Houston|TX': 2, 'Phoenix|AZ': 2, 'Philadelphia|PA': 2, 'San Antonio|TX': 2, 'San Diego|CA': 2, 'Dallas|TX': 2, 'Austin|TX': 2, 'Jacksonville|FL': 2, 'San Francisco|CA': 2, 'Denver|CO': 3, 'Nashville|TN': 2, 'El Paso|TX': 2, 'Las Vegas|NV': 3, 'Memphis|TN': 2, 'Louisville|KY': 3, 'Baltimore|MD': 2, 'Fresno|CA': 2, 'Kansas City|MO': 2, 'Mesa|AZ': 2, 'Atlanta|GA': 2, 'Colorado Springs|CO': 2, 'Long Beach|CA': 3, 'Miami|FL': 2, 'Oakland|CA': 2, 'Tampa|FL': 2, 'New Orleans|LA': 2, 'Cincinnati|OH': 2, 'Honolulu|HI': 2, 'Orlando|FL': 3, 'Tucson|AZ': 0, 'Sacramento|CA': 2, 'Arlington|TX': 3, 'Aurora|CO': 2, 'Santa Ana|CA': 3, 'Anaheim|CA': 2, 'Corpus Christi|TX': 2, 'Bakersfield|CA': 0, 'Riverside|CA': 2, 'Fort Worth|TX': 0, 'Columbus|OH': 0, 'Charlotte|NC': 0, 'Seattle|WA': 0, 'Chicago|IL': 0, 'Boston|MA': 0, 'Detroit|MI': 0 };
  const COUNCIL = { 'New York|NY': 2, 'Los Angeles|CA': 3, 'San Francisco|CA': 2, 'Houston|TX': 2, 'Phoenix|AZ': 2, 'Austin|TX': 2, 'Denver|CO': 3, 'Dallas|TX': 2, 'San Antonio|TX': 2, 'San Diego|CA': 2, 'Miami|FL': 2, 'Las Vegas|NV': 3, 'Atlanta|GA': 0, 'Kansas City|MO': 2, 'El Paso|TX': 2, 'Tampa|FL': 2, 'Jacksonville|FL': 2, 'Long Beach|CA': 3 };

  function cityKey(s) {
    const k = `${s.home.cityName}|${s.home.state}`;
    return (GR.CITY_ALIAS && GR.CITY_ALIAS[k]) || k;
  }
  // The limit that applies to an office here: { terms } in that office, or { total } years across both chambers.
  function limit(s, off) {
    if (off === 'statehouse' || off === 'statesenate') {
      const L = LEG[s.home.state];
      if (!L) return null;
      if (L.t) return { total: L.t };
      const yrs = off === 'statehouse' ? L.h : L.s;
      return yrs ? { terms: Math.max(1, Math.round(yrs / GR.OFFICES[off].term)), years: yrs } : null;
    }
    if (off === 'mayor') { const n = MAYOR[cityKey(s)]; return n ? { terms: n } : null; }
    if (off === 'council') { const n = COUNCIL[cityKey(s)]; return n ? { terms: n } : null; }
    return null;
  }
  // Has this person used up the terms the law allows in this office?
  function limited(s, p, off) {
    const L = limit(s, off);
    if (!L) return false;
    if (L.terms) return (p.terms[off] || 0) >= L.terms;
    const yrs = (p.terms.statehouse || 0) * GR.OFFICES.statehouse.term + (p.terms.statesenate || 0) * GR.OFFICES.statesenate.term;
    return yrs + GR.OFFICES[off].term > L.total;
  }
  const limitText = (s, off) => {
    const L = off === 'governor' ? (GR.STATE[s.home.state].gl ? { terms: GR.STATE[s.home.state].gl } : null) : off === 'president' ? { terms: 2 } : limit(s, off);
    if (!L) return 'No term limit';
    if (L.total) return `${L.total}-year lifetime limit across both chambers`;
    return `${L.terms} term${L.terms === 1 ? '' : 's'}${L.years ? ` (${L.years} years)` : ''}`;
  };

  // The seats that cover your home.
  function homeSeatIds(s) {
    const hs = W().homeSeats(s, s.home.zi);
    const out = [];
    GR.OFFICE_ORDER.forEach((off) => { let ids = hs[off]; if (!ids) return; (Array.isArray(ids) ? ids : [ids]).forEach((id) => { if (s.seats[id]) out.push(id); }); });
    return out;
  }

  // ---------- Incumbents decide ----------
  function planFor(s, seatId, year) {
    const seat = s.seats[seatId];
    const p = seat && seat.plan;
    return p && p.y === year && p.who === seat.holder ? p : null;
  }
  function decide(s, seat, p, quiet) {
    const age = W().ageOf(s, p) + Math.max(0, seat.next - U.yearOf(s.week));
    let kind = 'run';
    if (E().termLimited(s, p, seat.off)) kind = 'limit';
    else if (seat.off !== 'president' && ((age >= 78 ? U.chance(0.8) : age >= 70 ? U.chance(0.4) : U.chance(0.09)) || ((p.app || 50) < 38 && U.chance(0.3)))) kind = 'retire';
    seat.plan = { y: seat.next, kind, who: p.id, w: s.week };
  }
  // Monthly: incumbents up next cycle make up their minds, term limits first.
  function month(s) {
    const y = U.yearOf(s.week);
    const first = !s.watchInit;
    s.watchInit = true;
    Object.values(s.seats).forEach((seat) => {
      const p = s.pols[seat.holder];
      if (!p || p.isPlayer || !seat.next) return;
      if (planFor(s, seat.id, seat.next)) return;
      const gap = seat.next - y;
      if (gap < 0) return;
      // A term limit is known the day the final term begins.
      if (E().termLimited(s, p, seat.off)) { decide(s, seat, p); return; }
      if (seat.off === 'president' || gap > 1) return;
      // Everyone else decides over the year before the election, or right away in an election year.
      if (gap === 1 && !first && !U.chance(U.monthOf(s.week) >= 9 ? 0.45 : 0.12)) return;
      decide(s, seat, p);
    });
    // Open seats are announced from the year before the election (term limits) or when decided.
    const digest = [];
    Object.values(s.seats).forEach((seat) => {
      const plan = planFor(s, seat.id, seat.next);
      const p = s.pols[seat.holder];
      if (!plan || plan.kind === 'run' || plan.ann || !p || seat.next - y > 1) return;
      plan.ann = true;
      if (first) { if (homeSeatIds(s).includes(seat.id)) digest.push(`• ${W().seatTitle(s, seat)} (${seat.next}): ${W().fullName(p)} (${p.party}) ${plan.kind === 'limit' ? 'is term-limited' : 'is retiring'}.`); return; }
      announce(s, seat, p, plan.kind);
    });
    if (first) {
      const later = upcoming(s).filter((x) => x.open && x.away > 1).map((x) => `• ${W().seatTitle(s, x.seat)} (${x.next}): ${x.p ? `${W().fullName(x.p)} (${x.p.party}) is term-limited` : 'vacant'}.`);
      if (digest.length || later.length) GR.sim.msgInbox(s, 'Races to watch', `Open seats are the best time to run: no incumbent, no incumbent's name recognition, donors or staff.\n\n${digest.length ? 'Coming up soon:\n' + digest.join('\n') + '\n\n' : ''}${later.length ? 'Further out:\n' + later.join('\n') + '\n\n' : ''}Every seat that covers your home, with who holds it and why it might be a good time, is under Campaign → Races to watch.`);
    }
  }

  function announce(s, seat, p, kind) {
    const mine = homeSeatIds(s).includes(seat.id);
    const big = ['governor', 'ussenate', 'president', 'mayor'].includes(seat.off);
    if (!mine && !big) return;
    const title = W().seatTitle(s, seat);
    const who = `${W().fullName(p)} (${p.party})`;
    const y = seat.next;
    const head = kind === 'limit' ? `${who} is term-limited: ${title} is an open seat in ${y}` : `${who} will retire: ${title} opens up in ${y}`;
    GR.sim.news(s, head + '.', 'gov');
    if (!mine) return;
    const pr = seat.off === 'president' ? null : W().seatProfile(s, seat);
    const me = s.pols.me;
    const lean = pr ? pr.lean : 0;
    const fav = me.party === 'R' ? lean : -lean;
    const filing = seat.off === 'president' ? '' : `Filing opens ${U.fmtDate(E().declareOpenWeek(y))} and closes ${U.fmtDate(E().filingWeek(y, seat.off))}.`;
    const why = kind === 'limit' ? `${W().fullName(p)} has served the ${limitText(s, seat.off).toLowerCase()} the law allows and cannot run again.` : `${W().fullName(p)}, ${W().ageOf(s, p)}, announced they will not seek re-election.`;
    GR.sim.msgInbox(s, `Open seat: ${GR.OFFICES[seat.off].name}`, `${why}\n\nThe ${y} race for ${title} will have no incumbent. Open seats are the best time to move up: no one has the incumbent's name recognition, donors or staff.\n\n${pr ? `The district ${Math.abs(lean) < 2 ? 'is evenly split' : fav > 0 ? `leans your way (${me.party === 'R' ? 'R' : 'D'}+${Math.round(Math.abs(lean))})` : `leans against your party (${lean > 0 ? 'R' : 'D'}+${Math.round(Math.abs(lean))})`}. ` : ''}${filing}\n\nSee Campaign → Races to watch.`);
  }

  // An incumbent gives up their seat to run for a higher one.
  function leaving(s, seat, p, race) {
    if (!homeSeatIds(s).includes(seat.id)) return;
    const title = W().seatTitle(s, seat);
    GR.sim.news(s, `${W().fullName(p)} (${p.party}) is running for ${GR.OFFICES[race.off].name.toLowerCase()}, leaving ${title} open in ${seat.next}.`, 'gov');
    GR.sim.msgInbox(s, `Open seat: ${GR.OFFICES[seat.off].name}`, `${W().fullName(p)} is giving up ${title} to run for ${W().seatTitle(s, s.seats[race.seat])}. The ${seat.next} race will have no incumbent.\n\nFiling closes ${U.fmtDate(E().filingWeek(seat.next, seat.off))}. See Campaign → Races to watch.`);
  }

  // ---------- What's coming up near you ----------
  function upcoming(s) {
    const me = s.pols.me;
    const y = U.yearOf(s.week);
    return homeSeatIds(s).map((id) => {
      const seat = s.seats[id];
      const p = s.pols[seat.holder];
      const off = GR.OFFICES[seat.off];
      const pr = seat.off === 'president' ? null : W().seatProfile(s, seat);
      const lean = pr ? pr.lean : 0;
      const fav = me.party === 'R' ? lean : -lean;
      const plan = planFor(s, id, seat.next);
      const tags = [];
      let open = false, score = 0;
      if (!p) { tags.push(['Vacant', 'good']); open = true; }
      else if (p.isPlayer) tags.push(['Your seat', '']);
      else {
        if (E().termLimited(s, p, seat.off)) { tags.push(['Term-limited', 'good']); open = true; }
        else if (plan && plan.kind === 'retire') { tags.push(['Retiring', 'good']); open = true; }
        else if (plan && plan.kind === 'run') tags.push(['Running again', '']);
        else if (W().ageOf(s, p) >= 72) tags.push([`Age ${W().ageOf(s, p)}: may retire`, 'warn']);
        const app = p.app || 50;
        if (!open && app < 42) { tags.push([`Vulnerable: ${Math.round(app)}% approval`, 'good']); score += 1.5; }
        if (!open && p.party !== me.party) tags.push(['Other party holds it', '']);
        if (!open && p.party === me.party) { tags.push(['Your party holds it: primary', 'warn']); score -= 1; }
      }
      if (pr) tags.push([Math.abs(lean) < 2 ? 'Even district' : fav > 0 ? `Leans ${me.party} +${Math.round(Math.abs(lean))}` : `Leans ${me.party === 'R' ? 'D' : 'R'} +${Math.round(Math.abs(lean))}`, fav > 4 ? 'good' : fav < -6 ? 'bad' : '']);
      const lim = limit(s, seat.off);
      if (lim && p && !p.isPlayer && !open) { const used = lim.terms ? `${p.terms[seat.off] || 0} of ${lim.terms} terms served` : null; if (used) tags.push([used, '']); }
      const away = seat.next - y;
      if (open) score += 3;
      score += U.clamp(fav / 6, -2, 1.5) - Math.max(0, away - 1) * 0.6;
      return { id, seat, off, p, next: seat.next, away, open, tags, score, canRun: E().canRun(s, id) };
    }).filter((x) => x.p ? !x.p.isPlayer : true).sort((a, b) => a.next - b.next || a.off.level - b.off.level);
  }

  return { LEG, MAYOR, COUNCIL, limit, limited, limitText, homeSeatIds, planFor, month, upcoming, cityKey, leaving };
})();
