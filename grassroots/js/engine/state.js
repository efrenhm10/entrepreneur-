// Game state: new game from character creation, save and load.
var GR = globalThis.GR || (globalThis.GR = {});

GR.state = (function () {
  const U = GR.util;
  const KEY = 'grassroots_save_v2';

  // cfg comes from character creation.
  function newGame(cfg) {
    const s = {
      v: 1, week: 0, pols: {}, inbox: [], news: [], log: [], results: [], campaign: null, lastActs: [],
      home: { state: cfg.state, zip: cfg.zip, city: cfg.city, cityName: cfg.cityName },
      stats: { votesCast: 0, billsPassed: 0, billsWritten: 0, elections: [], peakOffice: null },
      settings: { autoVote: false },
    };
    const S = GR.geo.state(cfg.state);
    s.home.zi = S.zipIdx[cfg.zip];
    const co = GR.geo.countyOfCity(S, cfg.city);
    s.home.county = co ? co[1] : '';
    GR.world.create(s);

    const up = GR.UPBRINGING.find((u) => u.k === cfg.upbringing) || GR.UPBRINGING[2];
    const edu = GR.EDU[cfg.edu] || GR.EDU.hs;
    const job = GR.JOB[cfg.job] || GR.JOB.unemployed;
    const sk = {};
    GR.SKILLS.forEach((x) => {
      sk[x.k] = U.clamp(Math.round(22 + (cfg.skills[x.k] || 0) + (up.skill[x.k] || 0) + (edu.skill[x.k] || 0) + (job.skill[x.k] || 0)), 5, 90);
    });
    const me = {
      id: 'me', isPlayer: true, fn: cfg.fn, ln: cfg.ln, g: cfg.g, by: U.yearOf(0) - cfg.age, bweek: U.randInt(0, 51),
      party: cfg.party, pos: Object.assign({}, cfg.pos), sk, traits: cfg.traits.slice(0, 2), q: 50,
      pp: 25 + (up.party || 0) + (job.party || 0), rec: 0, recLocal: 3 + (up.rec || 0) + (job.rec || 0), recState: 1 + Math.round((up.rec || 0) / 3), recNat: 0,
      app: 50, fav: (up.fav || 0) + (job.fav || 0), standing: 30 + (up.party || 0) + (job.party || 0), network: up.network + job.network,
      seat: null, z: s.home.zi, st: cfg.state, hist: [], terms: {}, amb: 1, alive: true, ties: 5, infl: 0, look: cfg.look,
      money: up.money - Math.round(edu.debt * up.debtF * 0.35), debt: Math.round(edu.debt * up.debtF * 0.65),
      job: job.k, edu: edu.k, up: up.k, health: 92, happy: 70, stress: 20, scandal: 0, integrity: 70,
      family: { spouse: cfg.married ? GR.life.makePartner(s, cfg, true) : null, partner: null, kids: [], pregnant: null, prefers: cfg.prefers || 'any' },
      warChest: 0, schoolUntil: null, schoolEdu: null,
    };
    me.money = Math.max(me.money, 200);
    if (me.family.spouse) me.family.spouse.married = 0;
    me.caucus = GR.world.caucusOf(me).k;
    s.pols.me = me;
    s.me = 'me';
    s.hoursLeft = GR.sim.hoursFor(s);
    s.log.push({ w: 0, t: `${cfg.fn} ${cfg.ln}, ${cfg.age}, a ${GR.PARTIES[cfg.party].noun} ${up.story} in ${cfg.cityName}, ${GR.STATE[cfg.state].name} (ZIP ${cfg.zip}), sets out to build a political career.` });
    GR.sim.news(s, `Welcome to ${cfg.cityName}. Your journey starts at the bottom: check the Campaign tab for races you can enter, and build name recognition in the meantime.`, 'tip');
    GR.sim.inboxWelcome(s);
    return s;
  }

  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  }
  function load() {
    try { const t = localStorage.getItem(KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; }
  }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ } }
  const hasSave = () => { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
  const exportText = (s) => btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  const importText = (t) => JSON.parse(decodeURIComponent(escape(atob(t.trim()))));

  return { newGame, save, load, clear, hasSave, exportText, importText };
})();
