// Game state creation, persistence and common derived values.
var G = globalThis.G || (globalThis.G = {});

G.state = (function () {
  const U = G.util;
  const SAVE_PREFIX = 'mainstreet_save_';

  function baseSkills(cfg) {
    const skills = {};
    Object.keys(G.SKILLS).forEach((k) => { skills[k] = 10; });
    const add = (o) => Object.entries(o || {}).forEach(([k, v]) => { skills[k] = (skills[k] || 0) + v; });
    const bg = G.BACKGROUNDS.find((b) => b.id === cfg.bg);
    const edu = G.EDUCATION.find((e) => e.id === cfg.edu);
    add(bg.skills); add(edu.skills);
    if (edu.major && cfg.major) add(G.MAJORS.find((m) => m.id === cfg.major).skills);
    (cfg.traits || []).forEach((id) => add((G.TRAITS.find((t) => t.id === id) || {}).skills));
    return skills;
  }

  function pointPool(cfg) {
    const edu = G.EDUCATION.find((e) => e.id === cfg.edu);
    return 20 + (edu ? edu.pts : 0) + (cfg.flaw ? 6 : 0);
  }

  function newGame(cfg) {
    const bg = G.BACKGROUNDS.find((b) => b.id === cfg.bg);
    const edu = G.EDUCATION.find((e) => e.id === cfg.edu);
    const skills = baseSkills(cfg);
    Object.entries(cfg.alloc || {}).forEach(([k, v]) => { skills[k] += v; });
    Object.keys(skills).forEach((k) => { skills[k] = U.clamp(skills[k], 0, 100); });

    const xp = {};
    Object.keys(G.INDUSTRIES).forEach((k) => { xp[k] = 0; });
    Object.entries(bg.xp || {}).forEach(([k, v]) => { xp[k] += v; });
    if (edu.major && cfg.major) Object.entries(G.MAJORS.find((m) => m.id === cfg.major).xp || {}).forEach(([k, v]) => { xp[k] += v; });
    if (bg.xpChoice && cfg.xpChoice) xp[cfg.xpChoice] += bg.xpChoice;
    // Older founders bring some life experience.
    const yearsWorking = Math.max(0, cfg.age - 22);
    skills.management = U.clamp(skills.management + Math.min(10, yearsWorking * 0.4), 0, 100);

    const loc = G.loc.make(cfg.state, cfg.city, cfg.custom);
    const st = G.loc.state(cfg.state);
    const debts = [];
    if (edu.debt > 0) {
      const yearsSince = Math.max(0, cfg.age - 18 - (edu.years || 0));
      const remaining = Math.max(0, edu.debt * (1 - Math.min(0.9, yearsSince / 10)));
      if (remaining > 500) debts.push(G.finance.makeLoan({ name: 'Federal student loans', kind: 'student', acct: 'p', amount: Math.round(remaining), rate: 0.065, weeks: Math.round(Math.max(52, 520 - yearsSince * 52)) }));
    }
    let cash = bg.cash + (bg.id === 'paycheck' || bg.id === 'artist' ? 0 : Math.min(15000, yearsWorking * 350));
    const partnered = cfg.relationship !== 'single';

    const p = {
      name: cfg.name, pronouns: cfg.pronouns || 'they', age: cfg.age, bday: U.randInt(1, 52),
      bg: cfg.bg, edu: cfg.edu, major: cfg.major || null, traits: cfg.traits || [], flaw: cfg.flaw || null, why: cfg.why,
      skills, xp, creds: (edu.creds || []).slice(), network: 5 + (bg.network || 0), brand: 0,
      health: 82, stress: 25, happiness: 60,
      cash, retirement: bg.retirement || 0, credit: bg.credit, ccBal: bg.ccDebt || 0, ccLimit: 0,
      debts, familyLoanUsed: false, missed: 0,
      job: null, jobPerf: 60, unemployedWeeks: 0,
      housing: partnered ? 'apartment' : (cfg.age < 25 ? 'family' : 'roommates'),
      transport: cfg.hasCar ? 'car' : (['large', 'metro'].includes(loc.size) ? 'transit' : 'bike'),
      insurance: 'aca', lifestyle: 'modest',
      schedule: { sleep: 7, biz: 10, network: 2, learn: 0, family: partnered || cfg.kids ? 10 : 4, gig: 0 },
      course: null,
      rel: { status: cfg.relationship || 'single', partner: partnered ? G.randName().split(' ')[0] : null, patience: 72, income: 0 },
      kids: cfg.kids || 0,
      ytd: { wages: 0, withheld: 0, gig: 0, biz: 0, est: 0, other: 0, penalty: 0, corpSalary: 0, capgain: 0, donations: 0 },
      taxYear: 2026, lastReturn: null, estimates: false,
      weeksSelfEmployed: 0, burnoutWeeks: 0, sickWeeks: 0,
    };
    p.ccLimit = G.finance.ccLimitFor(p.credit);
    if (partnered) p.rel.income = Math.round(st.inc * 1000 * 0.55 / 52);

    const s = {
      v: 1, id: U.uid('game'), created: Date.now(), week: 0,
      p, loc, ideaId: cfg.ideaId || null, customTpl: cfg.customTpl || null,
      biz: null, pastBiz: [],
      econ: G.econ.init(),
      journal: [], hist: [], pending: [], event: null, eventQueue: [], flags: {},
      stats: { peakNW: 0, jobsCreated: 0, customers: 0, revenue: 0, bizStarted: 0, bestRating: 0, weeksOwner: 0 },
      jobBoard: [], lastReport: null, ended: false,
      holdings: [], hmarket: [],
    };
    G.give.ensure(s);
    if (cfg.jobId) {
      const j = G.jobs.byId[cfg.jobId];
      if (j && G.jobs.qualifies(p, j)) G.life.takeJob(s, j, 26);
    }
    p.insurance = p.job && G.jobs.byId[p.job.id].benefits ? 'employer' : 'aca';
    G.life.refreshJobBoard(s);
    const why = G.WHYS.find((w) => w.id === p.why);
    G.journal.add(s, 'life', `${p.name}, ${p.age}, starts a new chapter in ${loc.city}, ${st.name}. ${cash < 2000 ? 'There is barely anything in the bank.' : `There is ${U.money(cash)} in the bank.`} The goal: ${why ? why.name.toLowerCase() : 'something of their own'}.`);
    if (cfg.ideaId || cfg.customTpl) {
      const t = cfg.customTpl || G.BIZ[cfg.ideaId];
      G.journal.add(s, 'biz', `The idea that will not go away: ${t.custom ? t.name : 'a ' + t.name.toLowerCase()}.`);
    }
    G.state.recordHistory(s);
    return s;
  }

  // Template for the active business or the current idea.
  function tpl(s, b) {
    b = b || s.biz;
    if (b) return b.customTpl || G.BIZ[b.tid];
    return s.customTpl || (s.ideaId ? G.BIZ[s.ideaId] : null);
  }

  function age(s) { const p = s.p; return p.age + (s.week >= p.bday ? 1 + Math.floor((s.week - p.bday) / 52) : 0); }

  function netWorth(s) {
    const p = s.p;
    let nw = p.cash + p.retirement * 0.7 - p.ccBal;
    p.debts.forEach((d) => { nw -= d.bal; });
    if (s.biz && s.biz.phase !== 'closed') nw += G.biz.equityValue(s, s.biz);
    if (p.transport === 'car') nw += 5000;
    if (s.holdings && s.holdings.length) nw += G.hold.totalValue(s);
    return nw;
  }

  function recordHistory(s) {
    const nw = netWorth(s);
    s.stats.peakNW = Math.max(s.stats.peakNW, nw);
    const b = s.biz;
    s.hist.push({ w: s.week, nw: Math.round(nw), pc: Math.round(s.p.cash), bc: b ? Math.round(b.cash) : 0, rev: b && b.last ? Math.round(b.last.rev || 0) : 0, profit: b && b.last ? Math.round(b.last.profit || 0) : 0 });
    if (s.hist.length > 1500) s.hist.shift();
  }

  // ---- persistence ----
  function store() { try { return globalThis.localStorage || null; } catch (e) { return null; } }
  function save(s, slot = 'auto') {
    const ls = store();
    if (!ls) return false;
    try {
      ls.setItem(SAVE_PREFIX + slot, JSON.stringify(s));
      ls.setItem(SAVE_PREFIX + 'meta_' + slot, JSON.stringify({ name: s.p.name, city: s.loc.city, state: s.loc.state, week: s.week, biz: s.biz ? s.biz.name : null, nw: Math.round(netWorth(s)), at: Date.now() }));
      return true;
    } catch (e) { return false; }
  }
  function load(slot = 'auto') {
    const ls = store();
    if (!ls) return null;
    try { const raw = ls.getItem(SAVE_PREFIX + slot); return raw ? migrate(JSON.parse(raw)) : null; } catch (e) { return null; }
  }
  // Fill in fields added after a save was made.
  function migrate(s) {
    if (!s) return s;
    G.hold.ensure(s);
    G.give.ensure(s);
    return s;
  }
  function meta(slot) {
    const ls = store();
    if (!ls) return null;
    try { const raw = ls.getItem(SAVE_PREFIX + 'meta_' + slot); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function remove(slot) { const ls = store(); if (!ls) return; try { ls.removeItem(SAVE_PREFIX + slot); ls.removeItem(SAVE_PREFIX + 'meta_' + slot); } catch (e) { /* ignore */ } }
  function hallOfFame() { const ls = store(); if (!ls) return []; try { return JSON.parse(ls.getItem(SAVE_PREFIX + 'hof') || '[]'); } catch (e) { return []; } }
  function addToHall(entry) {
    const ls = store(); if (!ls) return;
    try { const h = hallOfFame(); h.push(entry); h.sort((a, b) => b.score - a.score); ls.setItem(SAVE_PREFIX + 'hof', JSON.stringify(h.slice(0, 20))); } catch (e) { /* ignore */ }
  }

  return { newGame, tpl, age, netWorth, recordHistory, save, load, migrate, meta, remove, hallOfFame, addToHall, baseSkills, pointPool };
})();

G.journal = {
  add(s, kind, text) {
    s.journal.push({ w: s.week, k: kind, t: text });
    if (s.journal.length > 600) s.journal.shift();
  },
};
