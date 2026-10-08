// Personal life simulation: time, work, money, health, relationships, learning.
var G = globalThis.G || (globalThis.G = {});

G.life = (function () {
  const U = G.util;
  const CHORES = 14;

  const has = (p, id) => p.traits.includes(id) || p.flaw === id;

  function commutePerDay(s) {
    const z = s.loc.size;
    let h = { rural: 0.8, town: 0.4, mid: 0.6, large: 0.9, metro: 1.2 }[z] || 0.6;
    if (s.p.transport === 'transit') h *= 1.35;
    if (s.p.transport === 'bike') h *= z === 'metro' || z === 'large' ? 1.2 : 1.5;
    return h;
  }

  function jobHours(s) {
    const j = s.p.job;
    if (!j) return 0;
    return j.flex ? s.p.schedule.gig : j.hours;
  }

  function hours(s) {
    const p = s.p, sc = p.schedule;
    const job = jobHours(s);
    const learn = p.course ? G.COURSES.find((c) => c.id === p.course.id).hours : 0;
    const days = p.job && !p.job.flex ? Math.ceil(job / 8.5) : 0;
    const commute = Math.round(days * commutePerDay(s) * 2) / 2;
    const parts = { sleep: sc.sleep * 7, job, commute, biz: sc.biz, network: sc.network, learn, family: sc.family, chores: CHORES + (p.kids * 5) };
    const used = U.sum(Object.values(parts));
    return Object.assign(parts, { used, leisure: 168 - used });
  }

  function productivity(s) {
    const p = s.p;
    let prod = 1;
    const sl = p.schedule.sleep;
    if (sl < 7) prod -= (7 - sl) * 0.07 * (has(p, 'nightowl') ? 0.5 : 1);
    if (p.stress > 60) prod -= (p.stress - 60) / 120;
    if (p.health < 60) prod -= (60 - p.health) / 150;
    if (p.burnoutWeeks > 0) prod *= 0.25;
    if (p.sickWeeks > 0) prod *= 0.4;
    if (s.flags.hyperfocus) prod *= s.flags.hyperfocus;
    return U.clamp(prod, 0.2, 1.6);
  }

  // Monthly cost of living breakdown.
  function costs(s) {
    const p = s.p, L = s.loc;
    const colF = L.col / 100;
    const partnered = p.rel.status !== 'single';
    const share = partnered && p.housing !== 'family' ? 0.5 : 1;
    const lifeM = { frugal: 0.8, modest: 1, comfortable: 1.25, lavish: 1.7 }[p.lifestyle];
    const frugal = has(p, 'frugal') ? 0.85 : 1;
    const out = {};
    out.housing = { family: 300, roommates: L.rent * 0.62, apartment: L.rent, house: L.rent * 1.75 }[p.housing] * share;
    out.utilities = { family: 0, roommates: 95, apartment: 175, house: 290 }[p.housing] * Math.pow(colF, 0.3) * share;
    out.groceries = (360 * Math.pow(colF, 0.5) * lifeM + p.kids * 230) * frugal;
    out.phone = 110;
    out.transport = { car: 410 * Math.pow(colF, 0.3), transit: ['large', 'metro'].includes(L.size) ? 95 * Math.pow(colF, 0.5) : 260, bike: 30 }[p.transport];
    out.health = healthPremium(s);
    out.kids = p.kids * 650 * colF;
    out.personal = { frugal: 80, modest: 300, comfortable: 800, lavish: 2200 }[p.lifestyle] * Math.pow(colF, 0.5) * (has(p, 'impulsive') ? 1.25 : 1) * frugal;
    out.total = U.sum(Object.values(out));
    return out;
  }

  function healthPremium(s) {
    const p = s.p;
    const a = G.state.age(s);
    const income = G.finance.annualIncome(s);
    const fam = (p.kids ? 1 : 0) + (p.rel.status === 'married' ? 1 : 0);
    switch (p.insurance) {
      case 'employer': return 160 + fam * 220;
      case 'medicaid': return 0;
      case 'none': return 0;
      default: {
        const st = G.loc.state(s.loc.state);
        const full = 390 * (1 + Math.max(0, a - 30) * 0.03) * Math.pow(st.col / 100, 0.6) * (1 + fam * 0.7);
        // 2026: enhanced subsidies have expired; aid stops at 400% of the poverty line.
        if (income < 62600) return Math.min(full, Math.max(20, income * 0.0996 / 12));
        return full;
      }
    }
  }

  function insuranceOptions(s) {
    const p = s.p;
    const st = G.loc.state(s.loc.state);
    const income = G.finance.annualIncome(s);
    const out = [];
    if (p.job && G.jobs.byId[p.job.id].benefits && p.job.hours >= 30) out.push({ id: 'employer', name: 'Employer plan', note: 'Cheapest option while you keep this job.' });
    if (st.mx && income < 21600) out.push({ id: 'medicaid', name: 'Medicaid', note: 'Free coverage because your income is low enough.' });
    else if (!st.mx && income < 21600) out.push({ id: 'medicaid', name: 'Medicaid', note: `${st.name} did not expand Medicaid, so most adults without kids do not qualify.`, disabled: true });
    out.push({ id: 'aca', name: 'ACA marketplace plan', note: income < 62600 ? 'Subsidized because of your income.' : 'Full price. Subsidies stop at 400% of the poverty line.' });
    out.push({ id: 'none', name: 'Go uninsured', note: 'Saves money until something goes wrong.' });
    return out;
  }

  // ---------- Jobs ----------
  function takeJob(s, j, weeksAt = 0) {
    const p = s.p;
    p.job = { id: j.id, title: j.title, wage: G.jobs.wageFor(j, p, s.loc), hours: j.hours, tips: j.tips || 0, flex: !!j.flex, weeks: weeksAt, perf: 60 };
    p.unemployedWeeks = 0;
    if (j.flex && !p.schedule.gig) p.schedule.gig = 20;
    if (j.benefits && j.hours >= 30) p.insurance = 'employer';
  }

  function quitJob(s, reason) {
    const p = s.p;
    if (!p.job) return;
    G.journal.add(s, 'career', reason || `You quit your job as a ${p.job.title.toLowerCase()}.${p.insurance === 'employer' ? ' Your employer health plan ends with it.' : ''}`);
    p.job = null;
    if (p.insurance === 'employer') p.insurance = 'none';
  }

  function refreshJobBoard(s) {
    const p = s.p;
    const pool = U.shuffle(G.JOBS);
    const board = [];
    pool.forEach((j) => { if (board.length < 9 && (Math.random() < 0.7 || j.flex)) board.push(j.id); });
    if (!board.includes('gig')) board.push('gig');
    if (!board.includes('freelance')) board.push('freelance');
    s.jobBoard = board;
    s.flags.boardWeek = s.week;
  }

  function applyJob(s, id) {
    const p = s.p, j = G.jobs.byId[id];
    if (!G.jobs.qualifies(p, j)) return 'You do not meet the requirements.';
    if (j.flex) { takeJob(s, j); G.journal.add(s, 'career', `You sign up as a ${j.title.toLowerCase()}. Flexible hours, no benefits, no tax withholding.`); return 'You can start right away. Set your hours on the Week plan.'; }
    if (s.pending.some((a) => a.kind === 'job' && a.id === id)) return 'Already applied.';
    const skillFit = j.req ? U.avg(Object.keys(G.SKILLS).filter((k) => j.req[k]), (k) => (p.skills[k] - j.req[k]) / 100) : 0.1;
    const chance = U.clamp(0.42 + skillFit + p.network / 250 + (p.xp[j.xp] || 0) / 200 - (p.unemployedWeeks > 26 ? 0.1 : 0) + (s.econ.phase === 'recession' ? -0.15 : 0), 0.1, 0.92);
    s.pending.push({ kind: 'job', id, weeks: U.randInt(1, 3), chance });
    return `Application sent. You should hear back in a week or three.`;
  }

  function tickJobApps(s) {
    const keep = [];
    for (const a of s.pending) {
      if (a.kind !== 'job') { keep.push(a); continue; }
      a.weeks -= 1;
      if (a.weeks > 0) { keep.push(a); continue; }
      const j = G.jobs.byId[a.id];
      if (Math.random() < a.chance) {
        s.eventQueue.push({ id: 'joboffer', data: { jobId: a.id } });
      } else {
        G.journal.add(s, 'career', `The ${j.title.toLowerCase()} job went to someone else.`);
      }
    }
    s.pending = keep;
  }

  // ---------- Weekly tick ----------
  function week(s, r) {
    const p = s.p;
    const H = hours(s);
    const prod = productivity(s);
    r.prod = prod;
    const learnMult = has(p, 'stubborn') ? 0.8 : 1;
    const grow = (k, amt) => { p.skills[k] = U.clamp(p.skills[k] + amt * learnMult * (1 - p.skills[k] / 115), 0, 100); };
    const growXp = (k, amt) => { if (k) p.xp[k] = U.clamp((p.xp[k] || 0) + amt * (1 - (p.xp[k] || 0) / 110), 0, 100); };

    // ----- Work income -----
    let income = 0;
    if (p.job) {
      const j = G.jobs.byId[p.job.id];
      const h = H.job;
      let gross = h * (p.job.wage + p.job.tips * U.clamp(0.7 + U.gauss() * 0.15, 0.3, 1.4));
      if (j.commission) gross += h * j.commission * (p.skills.sales / 50);
      if (j.volatile) gross = gross * Math.max(0, Math.exp(U.gauss() * 0.9) - 0.3);
      if (p.sickWeeks > 0 && !j.benefits) gross *= 0.4;
      if (p.job.flex) {
        const vehicle = (j.costPerHour || 0) * h;
        const net = gross - vehicle;
        p.ytd.gig += net;
        income += net;
        r.lines.push(['Gig income', net]);
      } else {
        const wh = G.finance.withholding(s, gross);
        p.ytd.wages += gross;
        p.ytd.withheld += wh - gross * 0.0765;
        income += gross - wh;
        r.lines.push(['Paycheck (after tax)', gross - wh]);
      }
      p.job.weeks += 1;
      // Performance reflects energy and how stretched you are.
      const stretched = H.job + H.biz > 70 ? (H.job + H.biz - 70) * 0.6 : 0;
      p.job.perf = U.clamp(p.job.perf + (prod * 70 - stretched - p.job.perf) * 0.12 + U.gauss() * 2, 0, 100);
      Object.entries(j.trains || {}).forEach(([k, v]) => grow(k, v * h / 40 * 0.13));
      if (j.id === 'freelance') grow(G.jobs.bestSkill(p), 0.5 * h / 40);
      growXp(j.xp, h / 40 * 0.3);
      if (!p.job.flex && p.job.weeks % 52 === 0 && p.job.perf > 62) {
        const raise = p.job.perf > 80 ? 0.07 : 0.035;
        p.job.wage = Math.round(p.job.wage * (1 + raise) * 100) / 100;
        G.journal.add(s, 'career', `Annual review: a ${Math.round(raise * 100)}% raise. You now make ${U.money(p.job.wage, { cents: true })} an hour.`);
      }
      if (!p.job.flex && p.job.perf < 32 && Math.random() < 0.12) {
        quitJob(s, `You are let go from your job as a ${p.job.title.toLowerCase()}. Your manager says your head "just isn't in it anymore."`);
        r.alerts.push('You lost your job.');
      }
    } else {
      p.unemployedWeeks += 1;
    }
    p.cash += income;
    r.income = income;

    // ----- Living costs -----
    const c = costs(s);
    const weekly = c.total / 4.33;
    p.cash -= weekly;
    r.lines.push(['Living costs', -weekly]);
    r.living = weekly;

    // ----- Personal debts -----
    let debtPay = 0;
    p.debts.filter((d) => d.acct === 'p').forEach((d) => { const x = G.finance.loanWeek(d); debtPay += x.pay; });
    if (p.ccBal > 0) {
      const interest = p.ccBal * 0.24 / 52;
      p.ccBal += interest;
      const minPay = Math.min(p.ccBal, Math.max(8, p.ccBal * 0.008 + interest));
      p.ccBal -= minPay;
      debtPay += minPay;
    }
    p.cash -= debtPay;
    if (debtPay > 0) r.lines.push(['Debt payments', -debtPay]);
    p.debts = p.debts.filter((d) => d.bal > 0.5);

    // ----- Courses -----
    if (p.course) {
      const c2 = G.COURSES.find((x) => x.id === p.course.id);
      Object.entries(c2.skills || {}).forEach(([k, v]) => grow(k, v / c2.weeks));
      Object.entries(c2.xp || {}).forEach(([k, v]) => growXp(k, v / c2.weeks));
      if (c2.network) p.network += c2.network / c2.weeks;
      p.course.left -= 1;
      if (p.course.left <= 0) {
        (c2.creds || []).forEach((cr) => { if (!p.creds.includes(cr)) p.creds.push(cr); });
        G.journal.add(s, 'life', `You finish ${c2.name}.${c2.creds ? ` You now hold a ${G.CREDS[c2.creds[0]]}.` : ''}`);
        r.alerts.push(`Completed: ${c2.name}`);
        p.course = null;
      }
    }

    // ----- Networking -----
    const netGain = p.schedule.network * 0.32 * (has(p, 'connector') ? 2 : 1) * (1 - p.network / 130);
    p.network = U.clamp(p.network + netGain - p.network * 0.004, 0, 100);
    if (p.schedule.network > 0) grow('sales', p.schedule.network * 0.012);

    // ----- Stress, health, happiness -----
    const work = H.job + H.biz + H.learn * 0.6 + H.network * (has(p, 'introvert') ? 1.1 : 0.4);
    let d = (work - 45) * 0.22;
    const sl = p.schedule.sleep;
    d += sl < 7 ? (7 - sl) * 1.8 * (has(p, 'nightowl') ? 0.5 : 1) : -1.2;
    d -= Math.max(0, H.leisure) * 0.06;
    d -= p.schedule.family * (p.rel.status !== 'single' || p.kids ? 0.07 : 0.03);
    const monthCost = c.total;
    if (p.cash < monthCost) d += 2.5;
    if (p.cash < 0) d += 3;
    if (p.ccLimit > 0 && p.ccBal / p.ccLimit > 0.8) d += 1.2;
    if (s.biz && s.biz.phase === 'open' && s.biz.last && s.biz.last.profit < 0) d += 1.2;
    if (s.biz && s.biz.cash < 0) d += 2;
    d += { frugal: 0.4, modest: 0, comfortable: -0.5, lavish: -0.9 }[p.lifestyle];
    const bg = G.BACKGROUNDS.find((b) => b.id === p.bg);
    if (d > 0) {
      d /= bg.grit;
      if (has(p, 'calm')) d *= 0.85;
      if (has(p, 'anxious')) d *= 1.25;
    }
    p.stress = U.clamp(p.stress + d + (25 - p.stress) * 0.03, 0, 100);

    let h = 0;
    if (sl < 6) h -= (6 - sl) * 1.2 * (has(p, 'nightowl') ? 0.5 : 1);
    if (p.stress > 75) h -= (p.stress - 75) * 0.07;
    if (work > 70) h -= (work - 70) * 0.05;
    if (h === 0) h = (0.9 + (p.health < 60 ? 0.6 : 0) + (sl >= 8 ? 0.4 : 0)) * (has(p, 'iron') ? 1.6 : 1);
    const a = G.state.age(s);
    if (a > 50) h -= (a - 50) * 0.012;
    p.health = U.clamp(p.health + h, 5, 100);

    const lifeHappy = { frugal: -6, modest: 0, comfortable: 6, lavish: 10 }[p.lifestyle];
    const relHappy = p.rel.status !== 'single' ? (p.rel.patience - 50) * 0.25 : -2;
    const purpose = s.biz && s.biz.phase !== 'closed' ? 8 : (p.job ? -2 : -6);
    const target = 52 + lifeHappy + relHappy + purpose + (H.leisure - 30) * 0.25 - p.stress * 0.35 + (p.health - 70) * 0.1;
    p.happiness = U.clamp(U.lerp(p.happiness, target, 0.12), 0, 100);

    // Burnout and illness.
    if (p.burnoutWeeks > 0) p.burnoutWeeks -= 1;
    if (p.sickWeeks > 0) p.sickWeeks -= 1;
    if (p.stress >= 96 && p.burnoutWeeks === 0) {
      p.burnoutWeeks = 3;
      p.health = Math.max(5, p.health - 12);
      p.stress -= 25;
      s.eventQueue.push({ id: 'burnout' });
    }
    const sickP = (0.005 + Math.max(0, 75 - p.health) / 1200) * (has(p, 'iron') ? 0.5 : 1);
    if (p.sickWeeks === 0 && Math.random() < sickP) {
      const serious = Math.random() < (p.health < 45 ? 0.25 : 0.08);
      s.eventQueue.push({ id: serious ? 'hospital' : 'sick' });
    }

    // ----- Relationship -----
    if (p.rel.status !== 'single') {
      const needed = 10 + p.kids * 4;
      p.rel.patience = U.clamp(p.rel.patience + (p.schedule.family - needed) * 0.32 - (p.stress > 75 ? 0.8 : 0) + (p.cash < 0 ? -0.6 : 0) + 0.15, 0, 100);
      if (p.rel.patience < 22 && !s.flags.ultimatum) { s.flags.ultimatum = true; s.eventQueue.push({ id: 'ultimatum' }); }
      if (p.rel.patience <= 0) s.eventQueue.push({ id: 'breakup' });
      if (p.rel.patience > 40) s.flags.ultimatum = false;
    }

    // ----- Overdraft handling -----
    settlePersonal(s, r);

    if (s.week - (s.flags.boardWeek || 0) >= 4) refreshJobBoard(s);
    tickJobApps(s);
    if (s.week === p.bday || (s.week > p.bday && (s.week - p.bday) % 52 === 0)) {
      G.journal.add(s, 'life', `Happy birthday. You turn ${G.state.age(s)}.`);
    }
  }

  // If personal cash is negative, lean on the credit card; if that is maxed, it is a missed payment.
  function settlePersonal(s, r) {
    const p = s.p;
    if (p.cash >= 0) return;
    const room = Math.max(0, p.ccLimit - p.ccBal);
    const draw = Math.min(room, -p.cash);
    if (draw > 0) {
      p.ccBal += draw;
      p.cash += draw;
      r.alerts.push(`You put ${U.money(draw)} on your credit card to cover bills.`);
    }
    if (p.cash < 0) {
      p.missed += 1;
      p.credit = Math.max(300, p.credit - 18);
      p.cash -= 35;
      r.alerts.push('You are overdrawn. Bills are going unpaid and your credit score is dropping.');
    }
  }

  return { hours, productivity, costs, healthPremium, insuranceOptions, takeJob, quitJob, refreshJobBoard, applyJob, week, jobHours, commutePerDay, CHORES, has };
})();
