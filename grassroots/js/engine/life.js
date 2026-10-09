// Personal life: aging, health, money, jobs, school, dating, marriage and kids.
var GR = globalThis.GR || (globalThis.GR = {});

GR.life = (function () {
  const U = GR.util;

  const me = (s) => s.pols.me;
  const age = (s) => GR.world.ageOf(s, me(s));

  function makePartner(s, cfg, married) {
    const pref = cfg.prefers || (cfg.g === 'm' ? 'f' : cfg.g === 'f' ? 'm' : 'any');
    const g = pref === 'any' ? (U.chance(0.5) ? 'f' : 'm') : pref;
    const a = U.clamp((cfg.age || 30) + U.randInt(-5, 5), 18, 80);
    const job = U.pick(GR.JOBS.filter((j) => j.k !== 'unemployed' && j.edu.length === 0 || U.chance(0.4)));
    return { fn: U.pick(GR.NAMES[g]), ln: married ? cfg.ln : U.pick(GR.NAMES.l), g, by: U.yearOf(s.week) - a, job: job.k, salary: Math.round(job.salary * 1000 * (0.8 + U.rand() * 0.4)), close: married ? 70 : 35, since: s.week, married: married ? s.week : null, look: U.uid('lk') };
  }

  // ---------- Money ----------
  function weeklyIncome(s) {
    const m = me(s);
    let inc = 0;
    const job = GR.JOB[m.job];
    const st = GR.STATE[s.home.state];
    if (job && job.salary && !fullTimeOffice(s)) inc += (job.salary * 1000 * Math.pow(st.col / 100, 0.5)) / 52;
    if (m.seat) inc += officeSalary(s, s.seats[m.seat]) / 52;
    const sp = m.family.spouse;
    if (sp && sp.salary) inc += sp.salary / 52;
    // Take-home pay after federal, state and payroll taxes.
    const gross = inc * 52;
    const rate = 0.12 + Math.min(0.2, gross / 1.5e6) + (GR.POLICY.incometax.rate.s[s.jur.state.law.incometax] || 0) / 200;
    return Math.round(inc * (1 - rate));
  }
  function weeklyCosts(s) {
    const m = me(s);
    const st = GR.STATE[s.home.state];
    const kids = m.family.kids.filter((k) => U.yearOf(s.week) - k.by < 18).length;
    let c = (700 + (m.family.spouse ? 360 : 0) + kids * 300) * (st.col / 100);
    if (m.schoolUntil) c += (GR.EDU[m.schoolEdu].debt / GR.EDU[m.schoolEdu].years) / 52 * 0.4;
    c += (m.debt || 0) * 0.065 / 52 + Math.min(m.debt || 0, Math.max(40, (m.debt || 0) * 0.0035));
    return Math.round(c);
  }
  function officeSalary(s, seat) {
    const o = GR.OFFICES[seat.off];
    if (o.salary) return o.salary;
    const st = GR.STATE[s.home.state];
    const cp = s.city.pop;
    switch (seat.off) {
      case 'school': return cp >= 5e5 ? 25000 : cp >= 1e5 ? 9000 : 0;
      case 'council': return cp >= 1e6 ? 120000 : cp >= 3e5 ? 70000 : cp >= 1e5 ? 35000 : cp >= 25e3 ? 12000 : 4000;
      case 'mayor': return cp >= 1e6 ? 230000 : cp >= 3e5 ? 160000 : cp >= 1e5 ? 110000 : cp >= 25e3 ? 60000 : 15000;
      case 'statehouse': case 'statesenate': return st.sal * 1000 + 8000;
      case 'governor': return Math.round(110000 + st.pop * 2500);
    }
    return 0;
  }
  function fullTimeOffice(s) {
    const m = me(s);
    if (!m.seat) return false;
    const seat = s.seats[m.seat];
    if (GR.OFFICES[seat.off].fullTime) return true;
    if (seat.off === 'mayor') return s.city.pop >= 50000;
    if (seat.off === 'statehouse' || seat.off === 'statesenate') return GR.STATE[s.home.state].sal >= 60;
    return false;
  }

  // ---------- Weekly ----------
  function week(s) {
    const m = me(s);
    const fam = m.family;
    const net = weeklyIncome(s);
    // Lifestyle creeps up with income.
    m.money += net - weeklyCosts(s) - Math.max(0, net - 1300) * 0.45;
    if (m.debt > 0) m.debt = Math.max(0, m.debt - Math.min(m.debt, Math.max(40, m.debt * 0.0035)) + m.debt * 0.065 / 52);
    if (m.money < 0) { m.debt += -m.money; m.money = 0; m.stress = U.clamp(m.stress + 1.5, 0, 100); }
    // Age and health.
    const a = age(s);
    if (s.week % 52 === m.bweek % 52 && s.week > 0) GR.sim.news(s, `Happy birthday! You turned ${a}.`, 'life');
    const decline = a > 50 ? (a - 50) * 0.012 : 0;
    m.health = U.clamp(m.health - decline - (m.stress > 70 ? 0.25 : 0) + (m.stress < 35 ? 0.08 : 0), 0, 100);
    m.stress = U.clamp(m.stress + ((s.hoursSpent || 0) > 45 ? 1.2 : -1.2), 0, 100);
    m.happy = U.clamp(m.happy + (65 - m.stress) * 0.01 + (fam.spouse ? (fam.spouse.close - 50) * 0.01 : -0.05) + (m.seat ? 0.05 : 0), 0, 100);
    // Mortality.
    const q = 0.00045 * Math.exp(0.088 * (a - 30)) * (1 + Math.max(0, 60 - m.health) / 25);
    if (m.health <= 0 || U.chance(q / 52)) { GR.sim.death(s); return; }
    // School.
    if (m.schoolUntil && s.week >= m.schoolUntil) {
      m.edu = m.schoolEdu;
      const e = GR.EDU[m.edu];
      Object.entries(e.skill).forEach(([k, v]) => { m.sk[k] = U.clamp(m.sk[k] + v, 0, 99); });
      m.debt += e.debt * 0.6;
      m.schoolUntil = null;
      GR.sim.msgInbox(s, 'Graduation day', `You earned your ${e.name}. New careers are open to you.`);
    }
    // Relationships.
    if (fam.spouse) {
      fam.spouse.close = U.clamp(fam.spouse.close - 0.45 - (fullTimeOffice(s) ? 0.2 : 0) + (m.traits.includes('family') ? 0.2 : 0), 0, 100);
      if (fam.spouse.close < 15 && U.chance(0.02)) divorce(s, true);
    }
    if (fam.partner) {
      fam.partner.close = U.clamp(fam.partner.close - 0.6, 0, 100);
      if (fam.partner.close < 10) { GR.sim.msgInbox(s, 'Breakup', `${fam.partner.fn} ended things. You haven't had time for each other.`); fam.partner = null; }
    }
    // Pregnancy.
    if (fam.pregnant && s.week >= fam.pregnant.due) birth(s);
    // Kids grow up.
    fam.kids.forEach((k) => {
      k.close = U.clamp((k.close || 60) - 0.2, 0, 100);
      const ka = U.yearOf(s.week) - k.by;
      if (ka === 18 && !k.grown && U.monthOf(s.week) === 5) { k.grown = true; GR.sim.msgInbox(s, `${k.fn} graduates high school`, `${k.fn} is off to ${U.chance(0.6) ? 'college' : 'start a career'}. ${k.close > 60 ? 'They thank you for always being there.' : 'They wish you had been around more.'}`); }
    });
  }

  // ---------- Life actions (hours) ----------
  const ACTS = {
    work: { name: 'Work extra shifts', h: 8, desc: 'Earn more at your job.' },
    family: { name: 'Family time', h: 4, desc: 'Strengthen your marriage and bond with your kids.' },
    date: { name: 'Go on a date', h: 4, desc: 'Meet someone, or spend time with your partner.' },
    rest: { name: 'Rest and exercise', h: 4, desc: 'Lower stress, improve health.' },
    network: { name: 'Community networking', h: 3, desc: 'Grow your donor network and local name recognition.' },
    volunteer: { name: 'Volunteer in the community', h: 4, desc: 'Name recognition and goodwill at home.' },
    party: { name: 'Attend local party meeting', h: 3, desc: 'Political points and party standing.' },
    oped: { name: 'Write an op-ed', h: 3, desc: 'Name recognition, policy skill.' },
    study: { name: 'Study and practice', h: 4, desc: 'Improve a skill of your choice.' },
  };

  function act(s, k, arg) {
    const a = ACTS[k];
    const m = me(s);
    if (!a) return { ok: false };
    if (s.hoursLeft < a.h) return { ok: false, msg: 'Not enough hours left this week.' };
    const fam = m.family;
    let msg = '';
    switch (k) {
      case 'work': {
        const job = GR.JOB[m.job];
        if (!job || !job.salary || fullTimeOffice(s)) return { ok: false, msg: 'You have no job to pick up shifts at.' };
        const amt = Math.round((job.salary * 1000 / 2080) * a.h * 1.3);
        m.money += amt; m.stress = U.clamp(m.stress + 2, 0, 100);
        msg = `Earned ${U.money(amt)} in extra work.`;
        break;
      }
      case 'family': {
        const f = m.traits.includes('family') ? 1.5 : 1;
        if (fam.spouse) fam.spouse.close = U.clamp(fam.spouse.close + 8 * f, 0, 100);
        fam.kids.forEach((x) => { x.close = U.clamp((x.close || 60) + 6 * f, 0, 100); });
        if (!fam.spouse && !fam.kids.length) return { ok: false, msg: 'No family at home yet.' };
        m.stress = U.clamp(m.stress - 4, 0, 100); m.happy = U.clamp(m.happy + 2, 0, 100);
        msg = 'Quality time with family.';
        break;
      }
      case 'date': {
        if (fam.spouse) { fam.spouse.close = U.clamp(fam.spouse.close + 10, 0, 100); msg = `Date night with ${fam.spouse.fn}.`; break; }
        if (fam.partner) { fam.partner.close = U.clamp(fam.partner.close + 9 + m.sk.charisma / 20, 0, 100); msg = `A great date with ${fam.partner.fn}.`; break; }
        if (U.chance(0.35 + m.sk.charisma / 300)) {
          fam.partner = makePartner(s, { prefers: fam.prefers, g: m.g, age: age(s), ln: m.ln }, false);
          msg = `You met ${fam.partner.fn} ${fam.partner.ln}. Sparks flew.`;
        } else msg = 'The date was a dud.';
        m.money -= 80;
        break;
      }
      case 'rest': {
        m.stress = U.clamp(m.stress - 8, 0, 100); m.health = U.clamp(m.health + 1.2, 0, 100); m.happy = U.clamp(m.happy + 1.5, 0, 100);
        msg = 'You recharged.';
        break;
      }
      case 'network': {
        m.network += U.chance(0.5 + m.sk.charisma / 200) ? 1 : 0;
        m.recLocal = U.clamp(m.recLocal + 0.6 * locScale(s), 0, 100);
        m.pp += 1;
        msg = 'You worked the room at a Chamber mixer.';
        break;
      }
      case 'volunteer': {
        m.recLocal = U.clamp(m.recLocal + 0.9 * locScale(s), 0, 100);
        m.fav = U.clamp(m.fav + 0.6, -100, 100);
        m.sk.grass = U.clamp(m.sk.grass + (U.chance(0.2) ? 1 : 0), 0, 99);
        msg = 'Neighbors saw you out helping.';
        break;
      }
      case 'party': {
        m.pp += 3; m.standing = U.clamp(m.standing + 1.5, 0, 100); m.network += U.chance(0.3) ? 1 : 0;
        msg = 'Party activists are getting to know you.';
        break;
      }
      case 'oped': {
        const good = U.chance(0.5 + m.sk.policy / 200);
        m.recLocal = U.clamp(m.recLocal + (good ? 1 : 0.3) * locScale(s), 0, 100);
        m.recState = U.clamp(m.recState + (good ? 0.15 : 0), 0, 100);
        m.sk.policy = U.clamp(m.sk.policy + (U.chance(0.2) ? 1 : 0), 0, 99);
        msg = good ? 'Your op-ed was widely shared.' : 'Your op-ed ran on page 14.';
        break;
      }
      case 'study': {
        const sk = arg && m.sk[arg] != null ? arg : 'policy';
        const gain = m.sk[sk] < 60 ? 1 : U.chance(0.5) ? 1 : 0;
        m.sk[sk] = U.clamp(m.sk[sk] + gain, 0, 99);
        msg = `Practiced ${GR.SKILLS.find((x) => x.k === sk).name.toLowerCase()} (+${gain}).`;
        break;
      }
    }
    s.hoursLeft -= a.h;
    return { ok: true, msg };
  }
  function locScale(s) { return U.clamp(Math.sqrt(40000 / Math.max(5000, s.city.pop)), 0.25, 2.5); }

  function propose(s) {
    const m = me(s);
    const p = m.family.partner;
    if (!p) return { ok: false, msg: 'You are not seeing anyone.' };
    if (p.close < 60 || U.chance(0.25)) { p.close -= 10; return { ok: true, msg: `${p.fn} said they aren't ready yet.` }; }
    const cost = Math.round(18000 * GR.STATE[s.home.state].col / 100);
    m.money -= cost;
    p.married = s.week; p.close = Math.max(p.close, 75);
    if (m.g === 'f' && U.chance(0.5)) { /* keep your name */ } else if (U.chance(0.7)) p.ln = m.ln;
    m.family.spouse = p; m.family.partner = null;
    m.fav = U.clamp(m.fav + 1, -100, 100);
    GR.sim.log(s, `Married ${p.fn} ${p.ln}.`);
    return { ok: true, msg: `${p.fn} said yes! The wedding cost ${U.money(cost)}.` };
  }

  function tryForKid(s, adopt) {
    const m = me(s);
    const sp = m.family.spouse || m.family.partner;
    if (!sp && !adopt) return { ok: false, msg: 'You need a partner first (or adopt).' };
    if (m.family.pregnant) return { ok: false, msg: 'A baby is already on the way.' };
    if (adopt) {
      const cost = 35000;
      if (m.money < cost) return { ok: false, msg: `Adoption costs about ${U.money(cost)}.` };
      m.money -= cost;
      m.family.pregnant = { due: s.week + U.randInt(20, 40), adopt: true };
      return { ok: true, msg: 'Adoption paperwork filed. Your child should arrive within the year.' };
    }
    const a = Math.min(age(s), U.yearOf(s.week) - sp.by);
    const p = a < 35 ? 0.35 : a < 40 ? 0.2 : a < 45 ? 0.07 : 0.01;
    if (U.chance(p)) { m.family.pregnant = { due: s.week + 38 }; return { ok: true, msg: 'Good news: you are expecting a baby!' }; }
    return { ok: true, msg: 'Not this month. Keep trying.' };
  }

  function birth(s) {
    const m = me(s);
    const g = U.chance(0.5) ? 'f' : 'm';
    const kid = { fn: U.pick(GR.NAMES[g]), g, by: U.yearOf(s.week), bw: s.week, close: 75, look: U.uid('lk') };
    m.family.kids.push(kid);
    const adopt = m.family.pregnant.adopt;
    m.family.pregnant = null;
    m.happy = U.clamp(m.happy + 10, 0, 100);
    GR.sim.log(s, `${adopt ? 'Adopted' : 'Welcomed'} a ${g === 'f' ? 'daughter' : 'son'}, ${kid.fn}.`);
    GR.sim.msgInbox(s, `Welcome, ${kid.fn}!`, `Your ${g === 'f' ? 'daughter' : 'son'} ${kid.fn} ${m.ln} has ${adopt ? 'come home' : 'been born'}.`);
  }

  function divorce(s, theirIdea) {
    const m = me(s);
    const sp = m.family.spouse;
    if (!sp) return { ok: false };
    const cost = Math.round(Math.max(0, m.money) * 0.4 + 15000);
    m.money -= cost;
    m.family.spouse = null;
    m.fav = U.clamp(m.fav - 3, -100, 100);
    m.happy = U.clamp(m.happy - 15, 0, 100);
    GR.sim.log(s, `Divorced from ${sp.fn}.`);
    GR.sim.msgInbox(s, 'Divorce', `${theirIdea ? sp.fn + ' filed for divorce.' : 'You and ' + sp.fn + ' are divorcing.'} Legal costs and settlement: ${U.money(cost)}. The tabloids noticed.`);
    return { ok: true, msg: 'Divorce finalized.' };
  }

  function changeJob(s, k) {
    const m = me(s);
    const j = GR.JOB[k];
    if (!j) return { ok: false };
    if (j.edu.length && !j.edu.includes(m.edu)) return { ok: false, msg: `Requires: ${j.edu.map((e) => GR.EDU[e].name).join(' or ')}.` };
    if (k !== 'unemployed' && !U.chance(0.55 + m.network / 100)) return { ok: true, msg: `You didn't get the ${j.name.toLowerCase()} job this time.` };
    m.job = k;
    return { ok: true, msg: k === 'unemployed' ? 'You quit your job.' : `You are now a ${j.name.toLowerCase()}.` };
  }

  function enroll(s, k) {
    const m = me(s);
    const e = GR.EDU[k];
    if (!e || m.schoolUntil) return { ok: false, msg: 'Already enrolled.' };
    const cur = GR.EDU[m.edu];
    const need = { assoc: 0, ba: 0, ma: 2, jd: 2, mba: 2, md: 2, phd: 2 }[k];
    if (cur.lvl < need) return { ok: false, msg: "You need a bachelor's degree first." };
    const years = k === 'ba' && m.edu === 'assoc' ? 2 : Math.max(1, e.years - (cur.lvl >= 2 ? 4 : 0));
    m.schoolUntil = s.week + years * 52;
    m.schoolEdu = k;
    return { ok: true, msg: `Enrolled. You will graduate in ${years} year${years === 1 ? '' : 's'}. Classes take 10 hours a week.` };
  }

  // Moving resets your local base (only possible when not in office or running).
  function move(s, zip, cityIdx, cityName) {
    const m = me(s);
    if (m.seat || s.campaign) return { ok: false, msg: 'You cannot move while holding office or campaigning.' };
    const S = GR.geo.state(s.home.state);
    const zi = S.zipIdx[zip];
    if (zi == null) return { ok: false, msg: 'Unknown ZIP in your state.' };
    const old = s.home.cityName;
    s.home.zip = zip; s.home.zi = zi; m.z = zi;
    if (cityIdx !== s.home.city) {
      // A new city: rebuild local government.
      s.home.city = cityIdx; s.home.cityName = cityName;
      GR.world.clearMemo();
      GR.sim.rebuildCity(s);
      m.recLocal = Math.round(m.recLocal * 0.3);
    }
    m.money -= 4000;
    GR.sim.log(s, `Moved from ${old} to ${cityName} (${zip}).`);
    return { ok: true, msg: `Moved to ${cityName}.` };
  }

  return { makePartner, weeklyIncome, weeklyCosts, officeSalary, fullTimeOffice, week, ACTS, act, propose, tryForKid, divorce, changeJob, enroll, move, age };
})();
