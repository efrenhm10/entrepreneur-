// Cabinet and staff: the people who run your government.
// Executives appoint the heads of their real agencies: a mayor picks the police chief and the
// public works director; a governor picks whoever runs Caltrans or TxDOT; the President names
// the Secretary of Defense and the Attorney General, who must be confirmed by the Senate.
// Legislators hire a personal staff. Each appointee has competence (1-5 stars), loyalty,
// integrity and a background that pleases one of your power bases. Competent appointees raise
// their agency's audit rating and approval; disloyal ones leak; crooked ones become scandals.
var GR = globalThis.GR || (globalThis.GR = {});

GR.cabinet = (function () {
  const U = GR.util;
  const W = () => GR.world;
  const SC = () => GR.scenes;
  const PW = () => GR.power;

  const FED_TITLES = { dod: 'Secretary of Defense', hhs: 'Secretary of Health and Human Services', ssa: 'Commissioner of Social Security', dot: 'Secretary of Transportation', doe: 'Secretary of Energy', ed: 'Secretary of Education', dhs: 'Secretary of Homeland Security', doj: 'Attorney General', va: 'Secretary of Veterans Affairs', usda: 'Secretary of Agriculture', hud: 'Secretary of Housing and Urban Development', nasa: 'NASA Administrator', nsf: 'Director of the National Science Foundation', epa: 'EPA Administrator', state: 'Secretary of State', treas: 'Secretary of the Treasury', doi: 'Secretary of the Interior', doc: 'Secretary of Commerce', dol: 'Secretary of Labor' };
  const CITY_TITLES = { police: 'Police Chief', fire: 'Fire Chief', works: 'Public Works Director', transit: 'Transit General Manager', water: 'Water Utility Director', parks: 'Parks & Recreation Director', housing: 'Housing Authority Director', sanit: 'Sanitation Commissioner', econ: 'Economic Development Director', admin: 'City Administrator' };
  const STATE_ROLE_TITLE = { mcd: 'Medicaid Director', k12: 'Superintendent of Public Instruction', hied: 'Higher Education Commissioner', dot: 'Transportation Secretary', corr: 'Corrections Secretary', police: 'State Police Superintendent', env: 'Environmental Protection Secretary', hs: 'Human Services Secretary', gen: 'Secretary of Administration' };
  // Personal staff (all offices) and legislators' office staff.
  const STAFF = {
    exec: [['cos', 'Chief of Staff', 'More hours and political capital each week.'], ['comms', 'Communications Director', 'Better press and name recognition.'], ['budget', 'Budget Director', 'Agencies run more efficiently.']],
    legis: [['cos', 'Chief of Staff', 'More hours and political capital each week.'], ['ld', 'Legislative Director', 'Cheaper, better-scored bills.'], ['comms', 'Communications Director', 'Better press and name recognition.'], ['district', 'District Director', 'Constituent services raise approval.']],
  };

  const TYPES = [
    { k: 'career', name: 'Career civil servant', comp: [3.5, 5.4], loy: [40, 60], integ: [70, 95], base: 'press', flavor: ['30-year agency veteran', 'former deputy director', 'respected technocrat'] },
    { k: 'loyalist', name: 'Campaign loyalist', comp: [1.5, 4], loy: [75, 95], integ: [45, 85], base: 'party', flavor: ['your campaign manager', 'longtime aide', 'old college friend'] },
    { k: 'donor', name: 'Donor & industry executive', comp: [2, 4.2], loy: [50, 75], integ: [30, 75], base: 'donors', flavor: ['major donor', 'retired CEO', 'industry lobbyist'] },
    { k: 'expert', name: 'Academic expert', comp: [3.5, 5.4], loy: [40, 65], integ: [70, 95], base: 'press', flavor: ['university professor', 'think-tank scholar', 'former inspector general'] },
    { k: 'advocate', name: 'Advocate', comp: [2.5, 4.5], loy: [50, 75], integ: [60, 90], base: null, flavor: ['union leader', 'community organizer', 'nonprofit director'] },
    { k: 'cross', name: 'Bipartisan pick', comp: [3, 5], loy: [30, 55], integ: [60, 90], base: 'press', other: true, flavor: ['former official of the other party', 'moderate from the other side'] },
  ];

  function ctx(s) { return SC().ctx(s); }

  // Posts for the player's office.
  function posts(s) {
    const c = ctx(s);
    if (!c) return [];
    const out = [];
    if (c.exec && c.jur !== 'school') {
      c.J.F.ag.forEach((a) => {
        let title;
        if (c.jur === 'nation') title = FED_TITLES[a.k] || `Head of ${a.abbr}`;
        else if (c.jur === 'city') title = CITY_TITLES[a.k] || `Director, ${a.abbr}`;
        else title = `${STATE_ROLE_TITLE[a.k] || 'Director'} (${a.abbr})`;
        out.push({ k: 'ag:' + a.k, ag: a.k, title, agency: a.name, econ: a.k === 'econ' || a.k === 'doc' || (c.jur === 'state' && a.k === 'gen') });
      });
      STAFF.exec.forEach(([k, title, desc]) => out.push({ k: 'st:' + k, staff: k, title: c.jur === 'nation' && k === 'cos' ? 'White House Chief of Staff' : c.jur === 'nation' && k === 'budget' ? 'Director of the Office of Management and Budget' : title, desc }));
    } else if (!c.exec) STAFF.legis.forEach(([k, title, desc]) => out.push({ k: 'st:' + k, staff: k, title, desc }));
    return out;
  }

  function cab(s) {
    const me = s.pols.me;
    s.cabinet = s.cabinet || { seat: null, posts: {}, cands: {} };
    if (s.cabinet.seat !== me.seat) { s.cabinet = { seat: me.seat, posts: {}, cands: {} }; }
    return s.cabinet;
  }

  function makeCand(s, post) {
    const c = ctx(s);
    const me = s.pols.me;
    const ty = U.pick(TYPES);
    const g = U.chance(0.45) ? 'f' : 'm';
    const party = ty.other ? GR.other(me.party) : U.chance(0.85) ? me.party : GR.other(me.party);
    const base = ty.base || (post.ag ? advocateBase(post.ag) : 'labor');
    return {
      name: `${U.pick(GR.NAMES[g])} ${U.pick(GR.NAMES.l)}`, g, type: ty.k, typeName: ty.name, flavor: U.pick(ty.flavor), party,
      comp: U.clamp(Math.round(ty.comp[0] + U.rand() * (ty.comp[1] - ty.comp[0])), 1, 5), loyalty: Math.round(ty.loy[0] + U.rand() * (ty.loy[1] - ty.loy[0])),
      integ: Math.round(ty.integ[0] + U.rand() * (ty.integ[1] - ty.integ[0])), base, post: post.k, title: post.title, econ: !!post.econ, since: s.week,
      _c: c ? c.jur : null,
    };
  }
  function advocateBase(ag) { return { police: 'police', fire: 'labor', corr: 'police', doj: 'police', k12: 'teachers', ed: 'teachers', instr: 'teachers', env: 'environment', epa: 'environment', water: 'environment', usda: 'farm', dod: 'military', va: 'military', housing: 'labor', hud: 'labor', hs: 'labor' }[ag] || 'labor'; }

  function candidates(s, k) {
    const C = cab(s);
    if (!C.cands[k] || !C.cands[k].length) {
      const post = posts(s).find((p) => p.k === k);
      if (!post) return [];
      C.cands[k] = [makeCand(s, post), makeCand(s, post), makeCand(s, post)];
    }
    return C.cands[k];
  }

  // Appoint a candidate. The President's cabinet (and some governors' picks) needs confirmation.
  function appoint(s, k, i) {
    const C = cab(s);
    const c = ctx(s);
    const cand = candidates(s, k)[i];
    if (!cand || !c) return { ok: false };
    const me = s.pols.me;
    const old = C.posts[k];
    if (old && !old.acting) {
      if (me.pp < 5) return { ok: false, msg: 'Replacing an appointee costs 5 political points.' };
      me.pp -= 5;
    }
    let note = '';
    const senate = c.jur === 'nation' && cand.post.startsWith('ag:') ? 'ussenate' : c.jur === 'state' && cand.post.startsWith('ag:') && s.bodies.senate ? 'senate' : null;
    if (senate) {
      const v = confirmVote(s, senate, cand);
      if (!v.ok) { C.cands[k] = C.cands[k].filter((x) => x !== cand); PW().shift(s, 'party', -2); return { ok: true, msg: `The ${GR.BODIES[senate].name} rejected ${cand.name}, ${v.y}-${v.n}. Pick someone else.` }; }
      note = ` Confirmed ${v.y}-${v.n}.`;
    }
    C.posts[k] = Object.assign({}, cand, { since: s.week });
    delete C.cands[k];
    PW().shift(s, cand.base, 4);
    if (cand.type === 'loyalist') PW().shift(s, 'press', -2);
    if (cand.type === 'cross') PW().shift(s, 'base', -4);
    if (old && !old.acting) PW().shift(s, old.base, -3);
    return { ok: true, msg: `${cand.name} is your ${cand.title}.${note}` };
  }
  function confirmVote(s, body, cand) {
    const ms = W().members(s, body);
    const me = s.pols.me;
    let y = 0, n = 0;
    const sameParty = cand.party === me.party;
    ms.forEach((m) => {
      if (m.isPlayer) return;
      let x = 0.25 + (m.party === me.party ? 0.5 : -0.35) + (cand.comp - 3) * 0.12 + (cand.type === 'cross' ? 0.5 : 0) + (cand.type === 'loyalist' ? -0.15 : 0) + (cand.integ - 65) / 200 + (sameParty ? 0 : 0.2) + U.gauss() * 0.25;
      if (m.fed && GR.gov.rel(s, m.id)) x += GR.gov.rel(s, m.id) / 200;
      x > 0 ? y++ : n++;
    });
    return { ok: y > n, y, n };
  }

  function fire(s, k) {
    const C = cab(s);
    const p = C.posts[k];
    if (!p) return { ok: false };
    C.posts[k] = null;
    PW().shift(s, p.base, -5);
    return { ok: true, msg: `${p.name} is out. Appoint a replacement.` };
  }

  // On taking office: an acting official holds each post until you appoint someone.
  function ensure(s) {
    const C = cab(s);
    posts(s).forEach((p) => {
      if (C.posts[p.k] === undefined) C.posts[p.k] = { name: 'Acting official', acting: true, comp: 2, loyalty: 50, integ: 70, title: p.title, post: p.k, base: null, since: s.week };
    });
    return C;
  }

  // Monthly: appointees improve (or neglect) their agencies, and cause trouble.
  function month(s) {
    const c = ctx(s);
    if (!c) return;
    const C = ensure(s);
    const me = s.pols.me;
    Object.entries(C.posts).forEach(([k, p]) => {
      if (!p) return;
      if (k.startsWith('ag:')) {
        const a = c.J.F.ag.find((x) => x.k === k.slice(3));
        if (a) {
          a.eff = U.clamp(a.eff + (35 + p.comp * 11 - a.eff) * 0.03, 5, 98);
          a.app = U.clamp(a.app + (p.comp - 3) * 0.25, 0, 100);
          a.deg = U.clamp(a.deg - (p.comp - 3) * 0.08, 0, 100);
        }
      }
      if (p.acting) return;
      p.loyalty = U.clamp(p.loyalty + (me.app - 50) * 0.02 + U.gauss() * 0.8, 0, 100);
      if (p.loyalty < 22 && U.chance(0.08)) disloyal(s, k, p);
      else if (U.chance((100 - p.integ) / 4000)) scandal(s, k, p);
      else if (me.app < 35 && U.chance(0.01)) resign(s, k, p);
    });
    // Staff effects.
    const cos = C.posts['st:cos'];
    if (cos && !cos.acting) me.pp += Math.round((cos.comp - 2) * 0.8);
    const comms = C.posts['st:comms'];
    if (comms && !comms.acting) { me.recLocal = U.clamp(me.recLocal + (comms.comp - 2) * 0.05, 0, 100); }
    const dist = C.posts['st:district'];
    if (dist && !dist.acting) me.app = U.clamp(me.app + (dist.comp - 3) * 0.08, 1, 99);
    const bud = C.posts['st:budget'];
    if (bud && !bud.acting) c.J.F.ag.forEach((a) => { a.eff = U.clamp(a.eff + (bud.comp - 3) * 0.05, 5, 98); });
  }
  function hoursBonus(s) {
    const C = s.cabinet;
    const cos = C && C.seat === s.pols.me.seat && C.posts['st:cos'];
    return cos && !cos.acting ? Math.max(0, cos.comp - 2) : 0;
  }
  function billDiscount(s) {
    const C = s.cabinet;
    const ld = C && C.seat === s.pols.me.seat && C.posts['st:ld'];
    return ld && !ld.acting ? (ld.comp - 2) * 0.07 : 0;
  }

  function disloyal(s, k, p) {
    SC().post(s, { kicker: 'Your administration', title: `Your ${p.title} is leaking`, text: `${p.name} has been briefing reporters against you and meeting your rivals.`, choices: [
      { label: 'Fire them', fx: { pw: { [p.base || 'press']: -3 } }, res: 'They are out. Appoint a replacement.', run: 'cabFire', args: { k } },
      { label: 'Win them back with more authority', fx: { pp: -6 }, res: 'They are back on side, for now.', run: 'cabLoyal', args: { k, v: 30 } },
      { label: 'Keep your enemies close', fx: { scan: 2 }, res: 'The leaks continue.' },
    ] });
  }
  function scandal(s, k, p) {
    SC().post(s, { kicker: 'Breaking news', title: `Scandal: your ${p.title}`, text: `${p.name} is accused of steering contracts to a former business partner.`, choices: [
      { label: 'Demand their resignation', fx: { scan: 1, pw: { press: 3 } }, res: 'They resign. Appoint a replacement.', run: 'cabFire', args: { k } },
      { label: 'Stand by them pending an investigation', fx: { scan: 6, pw: { press: -6 } }, res: 'The investigation drags on.' },
    ] });
  }
  function resign(s, k, p) {
    GR.sim.msgInbox(s, `${p.title} resigns`, `${p.name} resigned to "spend more time with family". Appoint a replacement in Office → Cabinet.`);
    const C = cab(s);
    C.posts[k] = null;
  }
  Object.assign(GR.scenes.RUN, {
    cabFire: (s, a) => { const C = cab(s); C.posts[a.k] = null; },
    cabLoyal: (s, a) => { const C = cab(s); const p = C.posts[a.k]; if (p) p.loyalty = U.clamp(p.loyalty + a.v, 0, 100); },
  });

  return { posts, cab, candidates, appoint, fire, ensure, month, hoursBonus, billDiscount, TYPES };
})();
