// Business simulation: setup checklist, staffing, the five revenue engines,
// marketing, reputation, books, valuation, fundraising and exits.
var G = globalThis.G || (globalThis.G = {});
G.biz = G.biz || {};

(function (B) {
  const U = G.util;
  const has = (p, id) => p.traits.includes(id) || p.flaw === id;

  B.CHANNELS = {
    digital: { label: 'Digital ads', desc: 'Search and social ads. On online businesses, every dollar buys customers directly.', local: 0.8, online: 1.0 },
    local: { label: 'Local media', desc: 'Flyers, radio, sponsorships, the local paper. Builds neighborhood awareness.', local: 1.0, online: 0.1 },
    events: { label: 'Events & networking', desc: 'Markets, pop-ups, trade shows, chamber mixers. Also grows your network.', local: 0.85, online: 0.35 },
    influencer: { label: 'Influencers & PR', desc: 'Creators and press. Hit-or-miss, with a small chance of going viral.', local: 0.7, online: 0.85 },
  };
  B.TIERS = [
    { label: 'Budget', cogs: 0.82, q: -10 },
    { label: 'Standard', cogs: 1, q: 0 },
    { label: 'Premium', cogs: 1.22, q: 10 },
  ];
  B.ENTITIES = {
    none: 'Not registered', sole: 'Sole proprietorship', llc: 'LLC', scorp: 'LLC taxed as S-corp', ccorp: 'Delaware C-corp',
  };

  const tplOf = (s, b) => G.state.tpl(s, b);
  B.costIndex = (s) => Math.pow(s.loc.col / 100, 0.35);

  B.unitLabel = function (t) {
    if (t.engine === 'subscription') return t.sub.local ? 'members' : 'subscribers';
    if (t.capped) return 'loads';
    if (t.id === 'inn') return 'room-nights';
    if (t.hpu >= 20) return 'jobs';
    if (t.hpu >= 2) return 'appointments';
    if (t.online) return 'orders';
    return 'customers';
  };

  B.buildLabel = function (t) {
    if (t.engine === 'subscription') return t.sub.local ? 'Design programs & pre-sell founding members' : 'Build the MVP';
    if (t.engine === 'projects') return t.id === 'flip' ? 'Line up contractors, lenders & deal flow' : 'Set up your studio & production pipeline';
    if (t.engine === 'harvest') return t.harvest.indoor ? 'Set up and dial in the grow systems' : 'Prepare the land, soil & water';
    if (t.engine === 'rnd') return 'Set up the lab & validate protocols';
    if (t.cat === 'food') return 'Develop the menu & recipes, line up suppliers';
    if (t.online) return 'Develop & test the product';
    return 'Set up operations: suppliers, pricing, processes';
  };

  // ---------- Creation & setup ----------
  B.create = function (s, name) {
    const t = tplOf(s);
    const L = s.loc;
    const b = {
      id: U.uid('biz'), name: name || t.name, tid: t.custom ? 'custom' : t.id, customTpl: t.custom ? t : null,
      phase: 'setup', founded: s.week, opened: null, entity: 'none',
      cash: 0, ar: [], cardLimit: 0, cardBal: 0, invCredit: 0, invAsset: 0,
      tasks: [], space: null, equipValue: 0, equipCond: 100,
      staff: [], candidates: [],
      price: 1, tier: 1, mkt: { budget: 0, channel: t.online ? 'digital' : 'local' }, focus: 0.5, draw: 0,
      awareness: 0, rep: 3.5, reviews: [], reviewsCount: 0, quality: 50, product: 0,
      comps: t.online ? (t.comp || 1000) : Math.max(0, Math.round(G.loc.marketPop(L, t) * (t.cPK || (t.sub && t.sub.local ? t.sub.local.cPK : 0.05)) * (0.7 + Math.random() * 0.6))),
      rival: G.biz.rivalName(t, L),
      subs: 0, backlog: 0, capCarry: 0, custBase: 0, waitlist: 0,
      projects: [], catalog: [], listings: [],
      crop: { units: 0, status: 'idle', prog: 0, health: 100, delay: t.harvest ? (t.harvest.firstDelay || 0) : 0, channel: 'direct', price: t.id === 'ranch' ? 1.1 : 1, cycles: 0, weather: 1 },
      rnd: { pts: 0, ms: 0, funded: {}, val: 0 },
      ins: { gl: false, prop: false, wc: false },
      bookkeeper: false, researched: false,
      equity: 100, investors: [], rounds: [], vc: null,
      last: null, hist: [], ytdProfit: 0, life: { rev: 0, profit: 0, units: 0 },
      flags: {},
    };
    b.tasks = genTasks(s, b, t);
    s.biz = b;
    s.stats.bizStarted += 1;
    G.journal.add(s, 'biz', `You commit to it: ${b.name}${b.name !== t.name ? ` (${t.name.toLowerCase()})` : ''}. Now the checklist begins.`);
    B.refreshCandidates(s, b, 3);
    return b;
  };

  function genTasks(s, b, t) {
    const p = s.p, st = G.loc.state(s.loc.state);
    const ci = B.costIndex(s);
    const sumKind = (k) => Math.round(U.sum(t.startup.filter((x) => x[2] === k), (x) => x[1]) * ci);
    const items = (k) => t.startup.filter((x) => x[2] === k).map((x) => x[0]).join(', ');
    const list = [];
    const add = (o) => list.push(Object.assign({ prog: 0, waitLeft: 0, state: 'todo', after: [], req: true, cost: 0, wait: 0 }, o));
    add({ id: 'research', name: 'Market research', desc: 'Count real competitors, size up demand and see what people pay. Until you do, those numbers are guesses.', hours: 12, req: false });
    add({ id: 'plan', name: 'Write a business plan', desc: 'Lenders, the SBA, USDA and grant programs all ask for one. It also catches bad assumptions early.', hours: Math.round(Math.max(10, 28 - p.skills.finance / 5)), req: false });
    add({ id: 'entity', name: 'Register your business', desc: `Sole proprietorship (a $50 DBA filing) or an LLC (${U.money(st.llc)} in ${st.name}${st.ann ? `, plus ${U.money(st.ann)} a year` : ''}). An LLC protects your personal assets from business lawsuits.`, hours: 3, wait: 2, choice: 'entity' });
    add({ id: 'ein', name: 'EIN & business bank account', desc: 'Free from the IRS. Keeps business money separate from yours.', hours: 2, wait: 1, after: ['entity'] });
    t.licenses.forEach((l, i) => add({ id: 'lic' + i, name: l[0], desc: `${l[1] ? U.money(l[1] * ci) : 'No fee'}, about ${l[2]} week${l[2] > 1 ? 's' : ''} of processing once filed.`, hours: 4, cost: Math.round(l[1] * ci), wait: l[2], after: ['entity'], kind: 'license' }));
    if (t.space) {
      const rate = G.loc.commercialRent(s.loc, t.space.type === 'residential' ? 'retail' : t.space.type);
      const rentMo = Math.round(t.space.sqft * rate / 12);
      add({ id: 'space', name: `Lease ${t.space.sqft.toLocaleString()} sq ft of ${G.SPACE_TYPES[t.space.type] ? G.SPACE_TYPES[t.space.type].label.toLowerCase() : 'space'}`, desc: `About ${U.money(rate, { cents: true })}/sq ft/yr here, so ${U.money(rentMo)}/month on a 3-year lease. Security deposit plus first month due at signing. You will personally guarantee the lease.`, hours: 20, cost: rentMo * 3, wait: 2, rentMo });
    }
    const build = sumKind('build');
    if (build) add({ id: 'buildout', name: 'Build-out & renovation', desc: items('build') + '. Contractors, permits and inspections.', hours: 40, cost: Math.round(build * (has(p, 'handy') ? 0.8 : 1)), wait: t.space ? 6 : 3, after: t.space ? ['space'] : [] });
    const equip = sumKind('equip');
    if (equip) add({ id: 'equip', name: 'Buy equipment', desc: items('equip') + '.', hours: 10, cost: equip, wait: 2, after: t.space ? ['space'] : [], kind: 'equip' });
    const other = sumKind('other');
    if (other) add({ id: 'other', name: 'Other startup costs', desc: items('other') + '.', hours: 6, cost: other });
    add({ id: 'build', name: B.buildLabel(t), desc: 'The real work. Your business hours each week go into this. Skill and experience make it go faster.', hours: Math.round((t.setupHours || 60) * (has(p, 'perfectionist') ? 1.15 : 1)) });
    const brand = sumKind('brand');
    add({ id: 'brand', name: 'Brand, website & signage', desc: brand ? items('brand') + '.' : 'Name, logo, a simple website and social accounts.', hours: 15, cost: brand });
    const inv = sumKind('inv');
    if (inv) add({ id: 'inventory', name: 'Stock opening inventory', desc: items('inv') + '. Inventory is used up as you sell.', hours: 6, cost: inv, after: equip ? ['equip'] : [], kind: 'inv' });
    if (t.harvest) {
      const h = t.harvest;
      add({ id: 'units', name: `Start with ${h.units0} ${h.unit}${h.units0 > 1 ? 's' : ''}`, desc: `${U.money(h.unitCost * ci)} per ${h.unit}${s.p.bg === 'farm' && !h.indoor ? '. You will use family land, so no land lease.' : ''}. You can add more later.`, hours: 10, cost: Math.round(h.unitCost * ci * h.units0), wait: 1 });
    }
    add({ id: 'insurance', name: 'Business insurance', desc: 'General liability (most landlords require it), property and workers\' comp once you hire. Billed monthly.', hours: 2, req: !!t.space });
    return list;
  }

  B.taskAvailable = function (b, task) {
    return task.state === 'todo' && task.after.every((id) => { const d = b.tasks.find((x) => x.id === id); return !d || d.state === 'done'; });
  };

  B.startTask = function (s, id, opt) {
    const b = s.biz, t = tplOf(s), st = G.loc.state(s.loc.state);
    const task = b.tasks.find((x) => x.id === id);
    if (!task || !B.taskAvailable(b, task)) return 'That step is not available yet.';
    let cost = task.cost;
    if (task.choice === 'entity') {
      cost = opt === 'llc' ? st.llc : 50;
      task.entityChoice = opt === 'llc' ? 'llc' : 'sole';
      if (G.BACKGROUNDS.find((x) => x.id === s.p.bg).veteran && opt === 'llc') cost = Math.round(cost * 0.5);
    }
    if (b.cash < cost) return `You need ${U.money(cost)} in the business account. Move money in from your personal account or get financing.`;
    b.cash -= cost;
    b.startupSpent = (b.startupSpent || 0) + cost;
    task.state = task.hours > 0 ? 'active' : 'waiting';
    task.waitLeft = task.wait;
    task.paid = cost;
    if (task.kind === 'equip') b.equipValue += cost;
    if (task.kind === 'inv') b.invCredit += cost;
    if (task.id === 'buildout') b.equipValue += cost * 0.4;
    if (task.id === 'space') b.space = { sqft: t.space.sqft, type: t.space.type, rentMo: task.rentMo, left: 156, deposit: task.rentMo * 2 };
    if (task.id === 'units') { b.crop.units = t.harvest.units0; b.equipValue += cost * 0.6; }
    if (task.id === 'insurance') { b.ins.gl = true; b.ins.prop = b.equipValue > 0; b.ins.wc = b.staff.length > 0; }
    return null;
  };

  // Advance setup tasks with this week's hours.
  function setupWeek(s, b, t, F, r) {
    let hours = F;
    const devHours = U.sum(b.staff.filter((x) => ['dev', 'creative'].includes(G.ROLES[x.role].kind)), (x) => effHours(x));
    const skill = U.sum(Object.entries(t.keys), ([k, w]) => w * s.p.skills[k]);
    const speed = 0.6 + skill / 100 + (s.p.xp[t.xp] || 0) / 200;
    for (const task of b.tasks) {
      if (task.state === 'active') {
        let h = Math.min(hours, task.hours - task.prog);
        let extra = task.id === 'build' ? devHours : 0;
        const add = (h * (task.id === 'build' ? speed : 1)) + extra;
        task.prog += add;
        hours -= h;
        if (task.prog >= task.hours - 0.01) {
          task.prog = task.hours;
          task.state = task.waitLeft > 0 ? 'waiting' : 'done';
          if (task.state === 'done') finishTask(s, b, t, task);
        }
      } else if (task.state === 'waiting') {
        task.waitLeft -= 1;
        if (task.waitLeft <= 0) { task.state = 'done'; finishTask(s, b, t, task); }
      }
    }
    r.setupHoursUsed = F - hours;
  }

  function finishTask(s, b, t, task) {
    const p = s.p;
    if (task.id === 'entity') { b.entity = task.entityChoice || 'sole'; G.journal.add(s, 'biz', `${b.name} is officially registered as ${b.entity === 'llc' ? 'an LLC' : 'a sole proprietorship'} in ${G.loc.state(s.loc.state).name}.`); }
    if (task.id === 'research') { b.researched = true; }
    if (task.id === 'build') {
      const skill = U.sum(Object.entries(t.keys), ([k, w]) => w * p.skills[k]);
      b.product = U.clamp(25 + skill * 0.5 + (p.xp[t.xp] || 0) * 0.2 + (has(p, 'perfectionist') ? 8 : 0) + U.gauss() * 6, 10, 85);
    }
    if (task.id === 'plan') G.journal.add(s, 'biz', 'The business plan is done: 22 pages, three spreadsheets, and one uncomfortable realization about your margins.');
  }

  B.setupProgress = function (b) {
    const req = b.tasks.filter((x) => x.req);
    return req.filter((x) => x.state === 'done').length / req.length;
  };

  B.credOk = function (s, b, t) {
    if (!t.cred) return true;
    return s.p.creds.includes(t.cred) || b.staff.some((x) => G.ROLES[x.role].cred === t.cred);
  };

  B.canLaunch = function (s, b) {
    const t = tplOf(s, b);
    const missing = b.tasks.filter((x) => x.req && x.state !== 'done').map((x) => x.name);
    if (!B.credOk(s, b, t)) missing.push(`Someone with a ${G.CREDS[t.cred]} (you or a hire)`);
    return missing;
  };

  B.launch = function (s, budget) {
    const b = s.biz, t = tplOf(s, b), p = s.p;
    budget = Math.min(budget || 0, Math.max(0, b.cash));
    b.cash -= budget;
    b.phase = 'open';
    b.opened = s.week;
    b.awareness = U.clamp(4 + p.network * 0.25 + 18 * (1 - Math.exp(-budget / (1500 * Math.pow(s.loc.col / 100, 0.5)))), 0, 60);
    if (G.BACKGROUNDS.find((x) => x.id === p.bg).repPenalty) b.awareness *= 0.85;
    b.quality = B.quality(s, b, t, p.schedule.biz);
    b.rep = U.clamp(2 + b.quality / 33, 2.8, 4.6);
    G.journal.add(s, 'biz', `Opening day for ${b.name}. ${budget > 0 ? `You spent ${U.money(budget)} on the launch.` : 'No launch budget, just a sign and hope.'} Startup spending so far: ${U.money(b.startupSpent || 0)}.`);
  };

  // ---------- Staff ----------
  B.rivalName = function (t, L) {
    const a = ['Blue', 'Golden', 'Iron', 'North', 'Common', 'Little', 'Second', 'Oak', 'Red', 'Main Street', 'Union', 'Harbor', 'Summit', 'Prairie', 'Copper'];
    const n = { food: ['Kitchen', 'Table', 'Co.', 'House'], tech: ['Labs', 'Systems', 'AI', 'HQ'], ag: ['Farms', 'Acres', 'Ranch', 'Growers'], media: ['Press', 'Media', 'Studio', 'Books'] }[t.cat] || ['Co.', 'Group', 'Works', 'Partners'];
    return U.pick(a) + ' ' + U.pick(n);
  };

  function wageAsk(s, role, skill) {
    const r = G.ROLES[role];
    const st = G.loc.state(s.loc.state);
    return Math.max(st.mw, Math.round(r.wage * G.loc.wageIndex(s.loc) * (0.82 + skill / 230) * 100) / 100);
  }
  B.marketWage = (s, role) => wageAsk(s, role, 50);

  B.refreshCandidates = function (s, b, n) {
    const t = tplOf(s, b);
    const roles = t.roles.concat(['manager']).filter((v, i, a) => a.indexOf(v) === i);
    b.candidates = [];
    const pull = U.clamp(s.p.network / 4 + (b.rep - 3) * 8 + (s.econ.phase === 'recession' ? 8 : 0), -10, 25);
    for (let i = 0; i < (n || 4); i++) {
      const role = i < t.roles.length && i < 2 ? t.roles[i] : U.pick(roles);
      const skill = Math.round(U.clamp(45 + pull + U.gauss() * 16, 12, 96));
      const blurbs = ['Strong references.', 'Job-hopped a bit.', 'Eager, a little green.', 'Ten years in the industry.', 'Wants flexible hours.', 'Came recommended by a friend.', 'Overqualified, between jobs.', 'Quiet, very reliable.', 'Great energy in the interview.', 'Needs visa sponsorship eventually.'];
      b.candidates.push({ id: U.uid('c'), name: G.randName(), role, skill, ask: wageAsk(s, role, skill), note: U.pick(blurbs) });
    }
  };

  B.hire = function (s, cid, hours) {
    const b = s.biz;
    const c = b.candidates.find((x) => x.id === cid);
    if (!c) return 'That candidate is gone.';
    const onboarding = 300;
    if (b.cash < onboarding) return 'You need about $300 in the business account for background checks and onboarding.';
    b.cash -= onboarding;
    b.staff.push({ id: U.uid('e'), name: c.name, role: c.role, skill: c.skill, wage: c.ask, hours: hours || 40, morale: 72, weeks: 0 });
    b.candidates = b.candidates.filter((x) => x.id !== cid);
    s.stats.jobsCreated += 1;
    if (b.staff.length === 1) G.journal.add(s, 'biz', `You hire your first employee: ${c.name}, ${G.ROLES[c.role].title.toLowerCase()}. Someone else's rent now depends on you.`);
    if (!b.ins.wc && s.loc.state !== 'TX') return `Hired ${c.name.split(' ')[0]}. Workers' comp insurance is required in ${G.loc.state(s.loc.state).name} once you have employees.`;
    return null;
  };

  B.fire = function (s, eid) {
    const b = s.biz;
    const e = b.staff.find((x) => x.id === eid);
    if (!e) return;
    b.cash -= e.wage * e.hours;
    b.staff = b.staff.filter((x) => x.id !== eid);
    b.staff.forEach((x) => { x.morale -= 6; });
    G.journal.add(s, 'biz', `You let ${e.name} go. The rest of the team gets very quiet.`);
  };

  B.giveRaise = function (s, eid) {
    const e = s.biz.staff.find((x) => x.id === eid);
    if (!e) return;
    e.wage = Math.round(e.wage * 1.08 * 100) / 100;
    e.morale = Math.min(100, e.morale + 15);
  };

  function effHours(e) {
    return e.hours * (0.55 + e.skill / 220 + e.morale / 400);
  }
  B.effHours = effHours;
  function staffHours(b, kinds) {
    return U.sum(b.staff.filter((x) => kinds.includes(G.ROLES[x.role].kind)), effHours);
  }
  function staffSkill(b, kinds) {
    const st = b.staff.filter((x) => kinds.includes(G.ROLES[x.role].kind));
    return st.length ? U.avg(st, (x) => x.skill) : null;
  }

  // ---------- Quality ----------
  B.quality = function (s, b, t, F) {
    const p = s.p;
    const founder = U.sum(Object.entries(t.keys), ([k, w]) => w * p.skills[k]);
    const xp = p.xp[t.xp] || 0;
    const sk = staffSkill(b, ['labor', 'creative', 'dev', 'research']);
    const mgr = staffSkill(b, ['manager']);
    let q = 25 + 0.5 * founder + 0.2 * (sk == null ? founder : sk) + 0.25 * xp + B.TIERS[b.tier].q;
    if (mgr != null) q += (mgr - 50) * 0.08;
    if (has(p, 'perfectionist')) q += 6;
    const needed = (t.ownerHours || 40) * 0.5;
    const have = F + b.staff.filter((x) => G.ROLES[x.role].kind === 'manager').length * 40;
    if (have < needed) q -= (1 - have / needed) * 22;
    q -= (100 - b.equipCond) * 0.12;
    if ((t.engine === 'subscription' && !t.sub.local) || (t.online && t.setupHours >= 300)) q = q * 0.45 + b.product * 0.55;
    return U.clamp(q, 5, 99);
  };

  // ---------- Weekly ----------
  B.week = function (s, r) {
    const b = s.biz;
    if (!b || b.phase === 'closed') return;
    const p = s.p, t = tplOf(s, b), L = s.loc;
    const m = U.monthOf(s.week);
    const prod = r.prod;
    // Portfolio companies take their oversight hours off the top.
    let F = Math.max(0, p.schedule.biz * prod - (G.hold ? G.hold.oversightHours(s) : 0));
    if (b.phase === 'open') {
      const admin = b.bookkeeper ? 0 : 1 + b.staff.length * 0.4;
      F = Math.max(0, F - admin);
    }
    const pl = { rev: 0, cogs: 0, payroll: 0, rent: 0, fixed: 0, mkt: 0, ins: 0, fees: 0, interest: 0, other: 0, units: 0, demand: 0, lost: 0 };
    r.biz = pl;

    // Payroll (and morale) runs in both phases.
    const payroll = U.sum(b.staff, (e) => e.wage * e.hours);
    pl.payroll = payroll * 1.092;
    let draw = 0;
    if (b.draw > 0 && b.cash > b.draw && b.phase === 'open') {
      draw = b.draw;
      if (b.entity === 'scorp' || b.entity === 'ccorp') {
        pl.payroll += draw * 1.0765;
        p.ytd.corpSalary += draw;
        const wh = G.finance.withholding(s, draw);
        p.ytd.withheld += wh - draw * 0.0765;
        p.cash += draw - wh;
      } else {
        p.cash += draw;
      }
      b.cash -= draw;
      r.draw = draw;
    }
    if (b.space) pl.rent = b.space.rentMo / 4.33;
    const ci = B.costIndex(s);
    if (b.phase === 'open') pl.fixed = t.fixedMo * ci / 4.33;
    else if (b.space) pl.fixed = t.fixedMo * ci * 0.3 / 4.33;
    if (b.ins.gl) pl.ins += t.glMo * ci / 4.33;
    if (b.ins.prop) pl.ins += b.equipValue * 0.007 / 52;
    if (b.ins.wc) pl.ins += payroll * (t.wcRate || 0.02);
    if (b.bookkeeper) pl.other += 350 / 4.33;
    pl.mkt = b.phase === 'open' ? b.mkt.budget : 0;

    if (b.phase === 'setup') {
      setupWeek(s, b, t, F, r);
      if (b.staff.length) staffWeek(s, b, t, r);
    } else {
      b.quality = U.lerp(b.quality, B.quality(s, b, t, F), 0.3);
      const out = runEngine(s, b, t, F, pl, m, r);
      Object.assign(pl, out);
      if (b.flags.closedWeeks > 0) {
        b.flags.closedWeeks -= 1;
        if (t.engine === 'traffic') { pl.rev = 0; pl.cogs = 0; pl.units = 0; pl.cashRev = 0; pl.closed = true; }
      }
      marketingWeek(s, b, t, pl);
      reputationWeek(s, b, t, pl);
      staffWeek(s, b, t, r);
      b.equipCond = Math.max(20, b.equipCond - 0.12);
      if (pl.units > 0 && (t.cardFees)) pl.fees = pl.rev * 0.029;
    }

    // Inventory credit offsets COGS first.
    if (pl.cogs > 0 && b.invCredit > 0) {
      const used = Math.min(b.invCredit, pl.cogs);
      b.invCredit -= used;
      pl.cashCogs = pl.cogs - used;
    } else pl.cashCogs = pl.cogs;

    // Business loans.
    let principal = 0;
    p.debts.filter((d) => d.acct === 'b').forEach((d) => {
      const x = G.finance.loanWeek(d, pl.rev);
      pl.interest += x.interest;
      principal += x.pay - x.interest;
    });
    if (b.cardBal > 0) { const i = b.cardBal * 0.22 / 52; b.cardBal += i; pl.interest += i; }
    p.debts = p.debts.filter((d) => d.bal > 0.5);

    pl.expenses = pl.cogs + pl.payroll + pl.rent + pl.fixed + pl.mkt + pl.ins + pl.fees + pl.interest + pl.other;
    pl.profit = pl.rev - pl.expenses;
    const cashIn = pl.cashRev != null ? pl.cashRev : pl.rev;
    b.cash += cashIn - (pl.expenses - pl.cogs + pl.cashCogs) - principal;
    b.cash -= (pl.capex || 0);

    // Taxes: pass-through profit lands on your personal return.
    if (b.entity === 'ccorp') b.ytdProfit += pl.profit;
    else p.ytd.biz += pl.profit;
    b.ytdProfit = b.entity === 'ccorp' ? b.ytdProfit : 0;

    b.last = pl;
    if (b.phase === 'open') {
      b.life.rev += pl.rev; b.life.profit += pl.profit; b.life.units += pl.units;
      s.stats.revenue += pl.rev;
      s.stats.customers += pl.units;
      s.stats.weeksOwner += 1;
      s.stats.bestRating = Math.max(s.stats.bestRating, b.reviewsCount >= 10 ? b.rep : 0);
      p.weeksSelfEmployed += p.job ? 0 : 1;
      p.xp[t.xp] = U.clamp((p.xp[t.xp] || 0) + (p.schedule.biz / 40) * 0.35 * (1 - (p.xp[t.xp] || 0) / 110), 0, 100);
      Object.entries(t.keys).forEach(([k, w]) => { p.skills[k] = U.clamp(p.skills[k] + w * (p.schedule.biz / 40) * 0.2 * (1 - p.skills[k] / 115), 0, 100); });
      if (b.staff.length) p.skills.management = U.clamp(p.skills.management + 0.04 * Math.min(10, b.staff.length) * (1 - p.skills.management / 115), 0, 100);
    } else if (p.schedule.biz > 0) {
      Object.entries(t.keys).forEach(([k, w]) => { p.skills[k] = U.clamp(p.skills[k] + w * (p.schedule.biz / 40) * 0.12 * (1 - p.skills[k] / 115), 0, 100); });
    }

    settleBusiness(s, b, r);
    b.hist.push({ w: s.week, rev: Math.round(pl.rev), profit: Math.round(pl.profit), cash: Math.round(b.cash), units: Math.round(pl.units), subs: Math.round(b.subs), aw: Math.round(b.awareness), rep: Math.round(b.rep * 100) / 100 });
    if (b.hist.length > 520) b.hist.shift();
    if (s.week % 2 === 0) B.refreshCandidates(s, b, 4);
  };

  function settleBusiness(s, b, r) {
    if (b.cash >= 0) return;
    const p = s.p;
    const need = -b.cash;
    const room = Math.max(0, b.cardLimit - b.cardBal);
    const card = Math.min(room, need);
    if (card > 0) { b.cardBal += card; b.cash += card; r.alerts.push(`The business put ${U.money(card)} on its credit card.`); }
    if (b.cash < 0 && p.cash > 0) {
      const x = Math.min(p.cash, -b.cash);
      p.cash -= x; b.cash += x;
      r.alerts.push(`You moved ${U.money(x)} of your own money into the business to cover its bills.`);
    }
    if (b.cash < 0) {
      b.flags.crisisWeeks = (b.flags.crisisWeeks || 0) + 1;
      if (!s.eventQueue.some((e) => e.id === 'cashcrisis')) s.eventQueue.push({ id: 'cashcrisis' });
    } else b.flags.crisisWeeks = 0;
  }

  // ---------- Engines ----------
  function founderLabor(s, b, t, F) {
    const credRole = t.roles.find((rid) => G.ROLES[rid].cred && G.ROLES[rid].kind === 'labor');
    if (credRole && !s.p.creds.includes(G.ROLES[credRole].cred)) return 0;
    return F;
  }

  function demandFactors(s, b, t, m) {
    const L = s.loc, st = G.loc.state(L.state);
    let boost = 1;
    L.tags.forEach((tag) => { if (t.boosts[tag]) boost *= t.boosts[tag]; });
    boost = Math.pow(Math.min(boost, 2.6), 0.75);
    const incomeF = t.online ? 1 : Math.pow(st.inc / 75, 0.4) * Math.pow(L.col / Math.max(60, st.col), 0.25);
    return { season: t.season[m], econ: s.econ.mult, boost, incomeF };
  }

  function attractiveness(s, b, t) {
    const el = t.engine === 'subscription' ? (t.el || 1) : t.el;
    return (0.12 + b.awareness / 100 * 1.5) * Math.pow(b.rep / 3.5, 1.6) * Math.pow(b.price, -el) * (0.55 + b.quality / 110);
  }

  function runEngine(s, b, t, F, pl, m, r) {
    switch (t.engine) {
      case 'subscription': return subscriptionEngine(s, b, t, F, pl, m);
      case 'projects': return projectsEngine(s, b, t, F, pl, m, r);
      case 'harvest': return harvestEngine(s, b, t, F, pl, m, r);
      case 'rnd': return rndEngine(s, b, t, F, pl, m, r);
      default: return trafficEngine(s, b, t, F, pl, m);
    }
  }

  function trafficEngine(s, b, t, F, pl, m) {
    const p = s.p, L = s.loc;
    const f = demandFactors(s, b, t, m);
    const pIdx = t.online ? 1 : G.loc.priceIndex(L);
    const price = t.price * pIdx * b.price * (t.capped ? s.econ.freight : 1);
    const labor = founderLabor(s, b, t, F) * 0.8 + staffHours(b, ['labor', 'creative', 'dev']);
    let attract = attractiveness(s, b, t);
    const salesH = staffHours(b, ['sales']);
    if (t.network) attract *= (0.45 + p.network / 55 + p.skills.sales / 200) * (1 + salesH / 120);
    else if (salesH) attract *= 1 + salesH / 200;
    let capacity = labor / t.hpu;
    if (t.unitsCap) capacity = Math.min(capacity, t.unitsCap);
    let demand = 0, paid = 0;
    if (t.capped) {
      const util = U.clamp(0.55 + p.network / 250 + p.skills.sales / 300 + (b.rep - 3) / 10, 0.35, 0.97) * s.econ.freight;
      demand = capacity * util;
    } else if (t.online) {
      // Online, awareness compounds: a known brand gets found without paying for it.
      const market = 335000 * t.mPK * f.season * f.econ;
      const organic = market / t.comp * 0.5 * Math.exp(b.awareness / 18) * Math.pow(b.rep / 3.5, 1.6) * Math.pow(b.price, -t.el) * (0.55 + b.quality / 110);
      if (b.mkt.channel === 'digital' || b.mkt.channel === 'influencer') {
        const cac = t.cac * (b.mkt.channel === 'influencer' ? 1.3 : 1);
        paid = b.mkt.budget / cac * (0.55 + b.quality / 120) * Math.pow(b.rep / 4, 1.2) * Math.pow(b.price, -t.el);
      }
      const repeat = b.custBase * (t.repeat || 0.005);
      demand = U.poisson(organic + paid + repeat);
    } else {
      const mPop = G.loc.marketPop(L, t);
      const catchK = Math.min(mPop, t.catch);
      const market = catchK * t.mPK * f.season * f.econ * f.boost * f.incomeF;
      const compIn = b.comps * (catchK / Math.max(1, mPop));
      const share = attract / (attract + compIn + 0.6);
      demand = U.poisson(market * share);
    }
    pl.demand = demand;
    const openFrac = t.cov ? Math.min(1, labor / t.cov) : 1;
    let served;
    const backlogMode = !t.cov && t.hpu >= 1 && !t.capped;
    if (backlogMode) {
      b.backlog += demand;
      b.capCarry = Math.min(b.capCarry + capacity, Math.max(1, capacity) + 1);
      served = Math.min(b.backlog, Math.floor(b.capCarry));
      b.capCarry -= served;
      b.backlog -= served;
      const maxWait = Math.max(2, capacity * 6);
      if (b.backlog > maxWait) { pl.lost = b.backlog - maxWait; b.backlog = maxWait; }
    } else if (t.capped) {
      b.capCarry = Math.min(b.capCarry + demand, demand + 1);
      served = Math.floor(b.capCarry);
      b.capCarry -= served;
    } else {
      const want = Math.round(demand * openFrac);
      served = Math.min(want, Math.floor(capacity));
      pl.lost = demand - served;
    }
    pl.units = served;
    pl.openFrac = openFrac;
    pl.capacity = capacity;
    pl.paidUnits = paid;
    if (t.online) b.custBase = b.custBase * 0.995 + served * 0.8;
    const rev = served * price;
    pl.rev = rev;
    // Supplies, utilities, repairs and other costs that scale with volume.
    pl.other += rev * (b.space ? 0.06 : 0.03);
    pl.cogs = rev * t.cogs * B.TIERS[b.tier].cogs * (t.capped ? 1 / s.econ.freight : 1);
    collect(s, b, t, pl, t.payLag);
    return pl;
  }

  // Revenue with payment terms goes to receivables.
  function collect(s, b, t, pl, lag) {
    if (!lag) { pl.cashRev = pl.rev; return; }
    if (pl.rev > 0) b.ar.push({ w: s.week + lag, amt: pl.rev });
    let cash = 0;
    b.ar = b.ar.filter((a) => { if (a.w <= s.week) { cash += a.amt; return false; } return true; });
    pl.cashRev = cash;
  }

  function subscriptionEngine(s, b, t, F, pl, m) {
    const p = s.p, L = s.loc, sub = t.sub;
    const f = demandFactors(s, b, t, m);
    const local = !!sub.local;
    // Founder time splits between product and selling.
    const fSales = F * b.focus, fBuild = F * (1 - b.focus);
    const devH = staffHours(b, ['dev', 'creative']) + (local ? 0 : fBuild);
    const devSkill = local ? 50 : (p.skills.tech * 0.6 + p.skills.creative * 0.4);
    if (!local) {
      b.product = U.clamp(b.product + devH * (devSkill / 100) * 0.05 * (1 - b.product / 105) - 0.22, 0, 100);
    }
    let attract = attractiveness(s, b, t);
    const salesH = staffHours(b, ['sales']);
    const salesSkill = staffSkill(b, ['sales']) || p.skills.sales;
    let organic = sub.organic * (local ? attract : attract * Math.exp(b.awareness / 30) / 2) * f.season * f.econ * (local ? f.boost : 1);
    let paid = 0;
    if (b.mkt.channel === 'digital' || (b.mkt.channel === 'influencer' && !local)) paid = b.mkt.budget / sub.cac * (0.4 + b.quality / 110) * f.season;
    const sales = (fSales * p.skills.sales / 50 + salesH * salesSkill / 50) * (sub.salesYield || 0) * (0.5 + b.quality / 100);
    let fresh = organic + paid + sales;
    if (fresh < 3) fresh = U.poisson(fresh); else fresh = Math.round(fresh + U.gauss() * Math.sqrt(fresh) * 0.5);
    let cap = Infinity;
    if (local) {
      const mPop = G.loc.marketPop(L, t);
      const catchK = Math.min(mPop, sub.local.catch);
      const maxMembers = catchK * sub.local.maxPerK * f.boost * f.incomeF;
      const compIn = b.comps * (catchK / Math.max(1, mPop));
      const myCap = maxMembers * attract / (attract + compIn + 0.5);
      fresh = Math.min(fresh, Math.max(0, (myCap - b.subs) * 0.3));
      const laborH = staffHours(b, ['labor']) + founderLabor(s, b, t, fSales + fBuild) * 0.6;
      cap = sub.perStaff * laborH / 40;
      b.waitlist = Math.max(0, Math.round(myCap - cap));
    }
    const churnRate = sub.churn / 4.33 * U.clamp(1.6 - b.quality / 100, 0.5, 1.5) * Math.pow(b.price, 0.8) * (local ? (2 - f.season) : 1) * (s.econ.phase === 'recession' ? 1.25 : 1);
    const churned = b.subs * churnRate;
    b.subs = Math.max(0, Math.min(cap, b.subs + Math.max(0, fresh)) - churned);
    if (local && b.subs >= cap - 0.5) pl.waitlisted = Math.max(0, fresh);
    const pIdx = local ? G.loc.priceIndex(L) : 1;
    pl.rev = b.subs * sub.price * pIdx * b.price / 4.33;
    pl.cogs = pl.rev * sub.cogs * B.TIERS[b.tier].cogs;
    pl.units = Math.max(0, fresh);
    pl.demand = fresh;
    pl.churned = churned;
    pl.cashRev = pl.rev;
    return pl;
  }

  function projectsEngine(s, b, t, F, pl, m, r) {
    const p = s.p;
    let work = F * 0.85 + staffHours(b, ['creative', 'dev', 'labor', 'manager']) * 0.9;
    for (const pr of b.projects) {
      if (work <= 0) break;
      const use = Math.min(work, pr.hours - pr.prog);
      pr.prog += use;
      work -= use;
      if (pr.prog >= pr.hours) completeProject(s, b, t, pr, r);
    }
    b.projects = b.projects.filter((pr) => pr.prog < pr.hours);
    // Catalog sales.
    let rev = 0, cogs = 0, units = 0;
    const el = t.el || 1;
    for (const c of b.catalog) {
      const u = c.units * Math.pow(b.price, -el) * s.econ.mult;
      const sold = u > 50 ? u * (1 + U.gauss() * 0.08) : U.poisson(u);
      rev += sold * c.price * b.price;
      cogs += sold * c.price * b.price * c.cogs;
      units += sold;
      c.total += sold * c.price * b.price;
      c.weeks += 1;
      c.units = Math.max(c.tail, c.units * c.decay);
    }
    // House-flip listings.
    for (const l of b.listings) {
      l.left -= 1;
      pl.other += l.hold;
      if (l.left <= 0) {
        const price = l.value * s.econ.housing / l.housingAtStart * (1 + U.gauss() * 0.04);
        const net = price * 0.94;
        rev += net;
        cogs += l.cost;
        b.invAsset -= l.cost;
        if (l.loanId) {
          const loan = p.debts.find((d) => d.id === l.loanId);
          if (loan) { b.cash -= loan.bal; loan.bal = 0; }
        }
        G.journal.add(s, 'biz', `Sold: ${l.name} for ${U.money(price)}. After commissions and your ${U.money(l.cost)} all-in cost, that is ${U.money(net - l.cost)} before holding costs and interest.`);
        r.alerts.push(`${l.name} sold for ${U.money(price)}.`);
        l.sold = true;
        units += 1;
      }
    }
    b.listings = b.listings.filter((l) => !l.sold);
    pl.rev = rev;
    pl.cogs = cogs;
    pl.units = units;
    pl.cashRev = rev;
    return pl;
  }

  function completeProject(s, b, t, pr, r) {
    const p = s.p;
    const type = t.projects.find((x) => x.id === pr.type);
    const founder = U.sum(Object.entries(t.keys), ([k, w]) => w * p.skills[k]);
    const sk = staffSkill(b, ['creative', 'dev', 'labor']);
    let q = 22 + 0.55 * founder + 0.2 * (sk == null ? founder : sk) + 0.25 * (p.xp[t.xp] || 0) + B.TIERS[b.tier].q + U.gauss() * 12 + (has(p, 'perfectionist') ? 8 : 0);
    q = U.clamp(q, 5, 100);
    if (type.lump) {
      const value = (pr.buy + pr.cost) * (1.1 + q / 520 + U.gauss() * 0.05);
      b.listings.push({ name: pr.name, value, cost: pr.buy + pr.cost, left: Math.round(type.listWeeks * (s.econ.phase === 'recession' ? 2 : 1) * (0.7 + Math.random() * 0.8)), hold: pr.buy * 0.0016, loanId: pr.loanId, housingAtStart: s.econ.housing, q });
      G.journal.add(s, 'biz', `Renovation done on ${pr.name}. It goes on the market.`);
      return;
    }
    const hit = Math.random() < type.hit * (0.5 + q / 100);
    const series = t.id === 'author' ? 1 + Math.min(1, b.catalog.length * 0.06) : 1;
    const launchBoost = 1 + (b.mkt.budget > 0 ? Math.min(1.2, b.mkt.budget / 1500) : 0);
    const reach = t.audience ? Math.exp(b.awareness / 22) : 0.6 + b.awareness / 150;
    let units = type.units * Math.pow(q / 60, 2) * reach * s.econ.mult * series * launchBoost;
    if (hit) units *= U.randInt(8, 25);
    b.catalog.push({ id: pr.id, name: pr.name, q: Math.round(q), units, decay: type.decay, tail: type.tail * Math.pow(q / 60, 1.5) * (hit ? 4 : 1), price: type.price, cogs: type.cogs, weeks: 0, total: 0, hit, unit: type.unit || 'copies', launch: s.week });
    b.awareness = U.clamp(b.awareness + (hit ? 20 : (3 + q / 25) * Math.min(1, pr.hours / 200)), 0, 100);
    const verdict = q >= 80 ? 'Reviewers love it.' : q >= 60 ? 'Solid reviews.' : q >= 40 ? 'Mixed reviews.' : 'It is rough, and the reviews say so.';
    G.journal.add(s, 'biz', `Released: "${pr.name}". ${verdict}${hit ? ' Then it takes off. Nobody saw this coming, least of all you.' : ''}`);
    r.alerts.push(hit ? `"${pr.name}" is a breakout hit!` : `Released "${pr.name}" (quality ${Math.round(q)})`);
  }

  B.startProject = function (s, typeId, title, finance) {
    const b = s.biz, t = tplOf(s, b), p = s.p;
    const type = t.projects.find((x) => x.id === typeId);
    if (!type) return 'Unknown project.';
    if (b.projects.length >= 3) return 'You can only juggle three projects at once.';
    const ci = B.costIndex(s);
    const cost = Math.round(type.cost * ci);
    let buy = type.buy ? Math.round(type.buy * Math.pow(s.loc.col / 100, 1.15) * s.econ.housing / 1000) * 1000 : 0;
    let loanAmt = finance && buy ? Math.round(buy * 0.85) : 0;
    const cashNeeded = cost + buy - loanAmt + (loanAmt ? loanAmt * 0.02 : 0);
    if (b.cash < cashNeeded) return `You need ${U.money(cashNeeded)} in the business account${buy && !finance ? ' (or use hard money financing)' : ''}.`;
    b.cash -= cashNeeded;
    const pr = { id: U.uid('pr'), type: typeId, name: title || type.name, hours: Math.round(type.hours * (has(p, 'perfectionist') ? 1.15 : 1)), prog: 0, cost, buy };
    if (loanAmt) {
      const loan = G.finance.makeLoan({ name: `Hard money: ${pr.name}`, kind: 'hardmoney', acct: 'b', amount: loanAmt, rate: 0.11, weeks: 52, interestOnly: true });
      p.debts.push(loan);
      pr.loanId = loan.id;
    }
    if (buy) b.invAsset += buy + cost;
    b.projects.push(pr);
    return null;
  };

  function climateMonths(s) { return G.CLIMATES[G.loc.state(s.loc.state).clim].months; }
  B.climateMonths = climateMonths;

  function harvestEngine(s, b, t, F, pl, m, r) {
    const p = s.p, h = t.harvest, c = b.crop;
    pl.cashRev = 0;
    if (!c.units) return pl;
    const ci = B.costIndex(s);
    const landF = p.bg === 'farm' && !h.indoor ? 0.7 : 1;
    c.price = U.clamp(c.price * Math.exp(U.gauss() * 0.02) + (1 - c.price) * 0.02, 0.6, 1.5);
    const window = climateMonths(s);
    let growing = false;
    if (h.annual) {
      growing = true;
      c.prog += 1;
      if (c.delay > 0) c.delay -= 1;
    } else {
      if (c.status === 'idle' && (h.indoor || window.includes(m))) { c.status = 'growing'; c.prog = 0; c.health = Math.max(c.health, 85); c.weather = 1; }
      if (c.status === 'growing') {
        growing = true;
        c.prog += 1;
        const late = !h.indoor && !window.includes(m) && !window.includes((m + 11) % 12) && !window.includes((m + 10) % 12);
        if (late) c.health -= 14;
      }
    }
    if (growing) {
      pl.cogs += c.units * h.opex * ci * landF;
      const need = c.units * h.labor * (c.channel === 'direct' && !h.noDirect ? 1.25 : 1);
      const have = founderLabor(s, b, t, F) * 0.85 + staffHours(b, ['labor']);
      const ratio = need > 0 ? Math.min(1, have / need) : 1;
      pl.laborRatio = ratio;
      c.health = U.clamp(c.health + (ratio - 0.85) * 12, 0, 100);
    }
    const ready = c.prog >= h.cycle && c.delay <= 0 && (!h.saleMonths || h.saleMonths.includes(m));
    if (growing && ready) {
      const founder = U.sum(Object.entries(t.keys), ([k, w]) => w * p.skills[k]);
      const skillF = 0.6 + (founder + (p.xp[t.xp] || 0) * 0.5) / 150;
      const direct = c.channel === 'direct' && !h.noDirect;
      const value = c.units * h.value * (c.health / 100) * skillF * c.price * Math.pow(G.loc.priceIndex(s.loc), 0.5) * (direct ? 1 : h.wholesale) * c.weather * B.TIERS[b.tier].cogs * (h.annual ? 1 : 1);
      pl.rev = value;
      pl.units = c.units;
      c.cycles += 1;
      const pct = Math.round(c.health);
      G.journal.add(s, 'biz', `Harvest: ${c.units} ${h.unit}${c.units > 1 ? 's' : ''} brought in ${U.money(value)}${direct ? ' selling direct' : ' wholesale'} (crop health ${pct}%${c.weather < 1 ? ', weather damage' : ''}).`);
      r.alerts.push(`Harvest: ${U.money(value)}`);
      c.prog = 0;
      c.weather = 1;
      c.health = Math.max(c.health, 80);
      if (!h.annual) c.status = 'idle';
    }
    collect(s, b, t, pl, h.payLag || 0);
    return pl;
  }

  B.addUnits = function (s, n) {
    const b = s.biz, t = tplOf(s, b), h = t.harvest;
    const cost = Math.round(h.unitCost * B.costIndex(s) * n);
    if (b.cash < cost) return `That costs ${U.money(cost)}.`;
    b.cash -= cost;
    b.crop.units += n;
    b.equipValue += cost * 0.6;
    return null;
  };

  function rndEngine(s, b, t, F, pl, m, r) {
    const p = s.p, R = b.rnd, ms = t.rnd.milestones;
    pl.cashRev = 0;
    const sciStaff = b.staff.filter((x) => G.ROLES[x.role].kind === 'research');
    const techs = b.staff.filter((x) => x.role === 'labtech');
    let pts = (F * 0.8 * p.skills.science / 50 + U.sum(sciStaff, (x) => effHours(x) * x.skill / 50) + U.sum(techs, (x) => effHours(x) * 0.6 * x.skill / 50)) * (0.75 + b.quality / 200) * (0.8 + b.equipCond / 500);
    pl.cogs = (400 + 750 * (sciStaff.length + techs.length)) * B.costIndex(s);
    const next = ms[R.ms];
    if (!next) return pl;
    const prev = R.ms > 0 ? ms[R.ms - 1].pts : 0;
    if (next.cost && !R.funded[R.ms] && R.pts >= prev + (next.pts - prev) * 0.4) {
      pts = 0;
      R.blocked = true;
    } else R.blocked = false;
    R.pts += pts;
    pl.research = pts;
    if (R.pts >= next.pts) {
      R.ms += 1;
      R.val = next.val;
      b.awareness = U.clamp(b.awareness + 10, 0, 100);
      G.journal.add(s, 'biz', `Milestone reached: ${next.name}. The science is real. Your valuation is now in the ${U.money(next.val, { short: true })} range.`);
      r.alerts.push(`Milestone: ${next.name}`);
      if (next.offer && Math.random() < next.offer.p) s.eventQueue.push({ id: 'licenseoffer', data: { upfront: next.offer.upfront, acquisition: !!next.offer.acquisition } });
    }
    return pl;
  }

  B.fundMilestone = function (s) {
    const b = s.biz, t = tplOf(s, b);
    const next = t.rnd.milestones[b.rnd.ms];
    if (!next || !next.cost) return 'Nothing to fund.';
    if (b.cash < next.cost) return `This phase costs ${U.money(next.cost)}. You will need to raise money.`;
    b.cash -= next.cost;
    b.rnd.funded[b.rnd.ms] = true;
    G.journal.add(s, 'biz', `You commit ${U.money(next.cost)} to the next phase: ${next.name.toLowerCase()}.`);
    return null;
  };

  // ---------- Marketing & reputation ----------
  function marketingWeek(s, b, t, pl) {
    const ch = B.CHANNELS[b.mkt.channel] || B.CHANNELS.local;
    const spend = b.mkt.budget;
    const eff = t.online ? ch.online : ch.local;
    const scale = t.online ? 1500 : 300 * Math.pow(s.loc.col / 100, 0.5);
    const gain = 3 * (1 - Math.exp(-spend * eff / scale));
    const wom = U.clamp(Math.sqrt(Math.max(0, pl.units)) * (b.rep - 2.8) * 0.035, -1.5, 1.5);
    const decay = b.awareness * (t.online ? 0.06 : 0.04);
    b.awareness = U.clamp(b.awareness + gain + wom - decay + (s.p.schedule.network > 4 ? 0.2 : 0), 0, 100);
    if (b.mkt.channel === 'events' && spend > 0) s.p.network = Math.min(100, s.p.network + Math.min(0.6, spend / 2000));
    if (b.mkt.channel === 'influencer' && spend >= 300 && Math.random() < 0.01 + Math.min(0.03, spend / 60000)) {
      s.eventQueue.push({ id: 'viral' });
    }
  }

  function reputationWeek(s, b, t, pl) {
    const lostRatio = pl.demand > 0 ? U.clamp((pl.lost || 0) / pl.demand, 0, 1) : 0;
    const pricePenalty = Math.max(0, b.price - 1.2) * (1 - b.quality / 100) * 3;
    const target = U.clamp(2 + b.quality / 33 - lostRatio * 1.5 - pricePenalty, 1, 5);
    const speed = U.clamp(0.04 + Math.sqrt(Math.max(0, pl.units)) * 0.004, 0.04, 0.15);
    b.rep = U.clamp(b.rep + (target - b.rep) * speed + U.gauss() * 0.03, 1, 5);
    b.rep = U.clamp(b.rep, 1, 5);
    // Customer reviews for consumer-facing businesses.
    if (t.cardFees || t.online || t.engine === 'subscription') {
      const n = U.poisson(Math.min(3, Math.max(0, pl.units) / 90 + (pl.units > 0 ? 0.15 : 0)));
      for (let i = 0; i < n; i++) b.reviews.unshift(G.reviews.make(s, b, t, lostRatio));
      b.reviewsCount += n;
      b.reviews = b.reviews.slice(0, 12);
    }
  }

  function staffWeek(s, b, t, r) {
    const p = s.p;
    const leader = has(p, 'leader') ? 8 : 0;
    for (const e of b.staff) {
      e.weeks += 1;
      const market = B.marketWage(s, e.role) * (0.82 + e.skill / 230) / 0.82 * 0.82;
      const payF = (e.wage / Math.max(1, market) - 1) * 90;
      const target = 58 + payF + p.skills.management * 0.2 + leader - (p.stress > 80 ? 8 : 0) - (b.cash < 0 ? 12 : 0) + (b.rep - 3.5) * 4;
      e.morale = U.clamp(e.morale + (target - e.morale) * 0.1 + U.gauss() * 2, 0, 100);
      e.skill = U.clamp(e.skill + 0.04 * (1 - e.skill / 100), 0, 100);
      const quitP = e.morale < 40 ? (40 - e.morale) / 350 : 0.002;
      if (Math.random() < quitP) {
        e.quit = true;
        G.journal.add(s, 'biz', `${e.name} quits.${e.morale < 30 ? ' They do not even give two weeks.' : ' They give two weeks and a polite excuse.'}`);
        r.alerts.push(`${e.name.split(' ')[0]} quit.`);
      }
      if (e.weeks % 52 === 0 && e.morale < 70) e.morale -= 6;
    }
    b.staff = b.staff.filter((e) => !e.quit);
    b.peakStaff = Math.max(b.peakStaff || 0, b.staff.length);
  }

  // ---------- Valuation & fundraising ----------
  B.trailing = function (b, n, key) {
    const h = b.hist.slice(-n);
    if (!h.length) return 0;
    return U.sum(h, (x) => x[key]) * (n / Math.max(h.length, Math.min(n, 13)));
  };

  B.mrr = function (s, b) {
    const t = tplOf(s, b);
    if (t.engine !== 'subscription') return 0;
    return b.last ? b.last.rev * 4.33 : 0;
  };

  B.enterpriseValue = function (s, b) {
    const t = tplOf(s, b);
    if (b.phase !== 'open') return Math.max(0, b.equipValue * 0.5 + b.invCredit * 0.5);
    const asset = b.equipValue * 0.5 + b.invCredit * 0.7 + b.invAsset + U.sum(b.ar, (a) => a.amt) * 0.9;
    const profit = B.trailing(b, 52, 'profit');
    const rev = B.trailing(b, 52, 'rev');
    if (t.engine === 'rnd') return Math.max(asset, b.rnd.val);
    if (t.engine === 'subscription') {
      const arr = B.mrr(s, b) * 12;
      const h = b.hist;
      const past = h.length > 13 ? h[h.length - 14].subs : 0;
      const growth = past > 0 ? b.subs / past - 1 : 0;
      const mult = t.sub.local ? 1.2 : U.clamp(2.5 + growth * 18, 1.5, 14);
      return Math.max(asset, arr * mult, profit * 3);
    }
    const mult = U.clamp(2.3 + (b.rep - 3.5) * 0.5 + (t.online ? 0.8 : 0), 1.2, 4.5);
    return Math.max(asset, profit * mult, rev * 0.15);
  };

  B.equityValue = function (s, b) {
    const debt = U.sum(s.p.debts.filter((d) => d.acct === 'b'), (d) => d.bal) + b.cardBal;
    return Math.max(0, (B.enterpriseValue(s, b) + b.cash - debt)) * b.equity / 100 - (b.cash < 0 ? -b.cash : 0) * 0;
  };

  B.traction = function (s, b) {
    const t = tplOf(s, b);
    const mrr = B.mrr(s, b);
    const weekly = b.last ? b.last.rev : 0;
    const R = b.rnd || {};
    const done = b.rounds || [];
    let angel = false, angelWhy = '';
    if (t.engine === 'subscription') { angel = mrr >= 2000 || (b.product >= 55 && b.subs >= 10); angelWhy = 'Angels want a working product and about $2k in monthly recurring revenue'; }
    else if (t.engine === 'rnd') { angel = R.ms >= 1; angelWhy = 'Angels want your first research milestone (target validated)'; }
    else { angel = weekly * 4.33 >= 10000; angelWhy = 'Angels want about $10k in monthly revenue first'; }
    if (done.includes('angel')) { angel = false; angelWhy = 'You already raised an angel round'; }
    const stages = [
      { id: 'seed', ok: mrr >= 15000 || R.ms >= 2 || (t.engine === 'traffic' && t.online && weekly * 4.33 >= 60000), amount: 2500000, pre: Math.max(10e6, mrr * 12 * 15, (R.val || 0) * 1.2), why: 'Seed VCs want about $15k MRR (or two research milestones)' },
      { id: 'seriesA', ok: mrr >= 80000 || R.ms >= 3, amount: 12000000, pre: Math.max(40e6, mrr * 12 * 14, (R.val || 0) * 1.1), why: 'Series A investors want about $80k MRR (or an IND-ready package)' },
      { id: 'seriesB', ok: mrr >= 300000 || R.ms >= 4, amount: 40000000, pre: Math.max(150e6, mrr * 12 * 12, (R.val || 0)), why: 'Series B investors want about $300k MRR (or clinical data)' },
    ];
    const next = stages.find((x) => !done.includes(x.id));
    return { angel, angelWhy, round: next && next.ok ? Object.assign({}, next) : null, vcWhy: next ? next.why : 'You have raised every round available', nextStage: next };
  };

  B.closeRound = function (s, a) {
    const b = s.biz, p = s.p;
    if (!b) return;
    const tr = B.traction(s, b);
    let pre, amount = a.amount, stage;
    if (a.opt === 'angel') { stage = 'angel'; pre = Math.max(1.5e6, B.enterpriseValue(s, b) * 1.4) * (p.traits.includes('visionary') ? 1.2 : 1); amount = Math.min(amount, 750000); }
    else { stage = tr.nextStage ? tr.nextStage.id : 'seed'; pre = (tr.nextStage ? tr.nextStage.pre : 10e6) * (p.traits.includes('visionary') ? 1.15 : 1); }
    const post = pre + amount;
    const pct = amount / post * 100;
    if (b.entity !== 'ccorp') { b.entity = 'ccorp'; b.cash -= 2500; }
    b.cash += amount;
    b.equity = b.equity * (1 - pct / 100);
    b.investors.push({ stage, amount, pct, pre });
    b.rounds.push(stage);
    if (stage !== 'angel') b.vc = { stage, week: s.week, mrr: Math.max(1000, B.mrr(s, b)), ms: b.rnd.ms, checked: false };
    s.flags['used_' + a.opt] = false;
    G.journal.add(s, 'money', `${stage === 'angel' ? 'Angel round' : stage === 'seed' ? 'Seed round' : stage === 'seriesA' ? 'Series A' : 'Series B'} closed: ${U.money(amount, { short: true })} at a ${U.money(pre, { short: true })} pre-money valuation. Investors now own ${pct.toFixed(1)}% more of the company; you own ${b.equity.toFixed(1)}%.`);
  };

  // ---------- Exits ----------
  B.listForSale = function (s) {
    const b = s.biz;
    if (s.pending.some((x) => x.kind === 'listing')) return 'Already listed.';
    s.pending.push({ kind: 'listing', weeks: U.randInt(10, 28) });
    G.journal.add(s, 'biz', `You quietly list ${b.name} for sale with a business broker. They will take 10% if it sells.`);
    return 'Listed with a broker. Buyers typically take 3 to 7 months to show up.';
  };

  B.tickListing = function (s) {
    const a = s.pending.find((x) => x.kind === 'listing');
    if (!a || !s.biz) return;
    a.weeks -= 1;
    if (a.weeks <= 0) {
      s.pending = s.pending.filter((x) => x !== a);
      const offer = B.enterpriseValue(s, s.biz) * (0.75 + Math.random() * 0.35);
      s.eventQueue.push({ id: 'buyeroffer', data: { offer: Math.round(offer / 1000) * 1000, broker: true } });
    }
  };

  B.sell = function (s, price, brokerFee) {
    const b = s.biz, p = s.p;
    const fee = price * (brokerFee || 0);
    let proceeds = price - fee + b.cash + U.sum(b.ar, (x) => x.amt) * 0.9 - b.cardBal;
    p.debts.filter((d) => d.acct === 'b').forEach((d) => { proceeds -= d.bal; d.bal = 0; });
    p.debts = p.debts.filter((d) => d.bal > 0.5);
    const mine = proceeds * b.equity / 100;
    p.cash += mine;
    p.ytd.capgain = (p.ytd.capgain || 0) + Math.max(0, mine - (b.startupSpent || 0));
    G.journal.add(s, 'biz', `You sell ${b.name} for ${U.money(price)}. After fees, debts${b.equity < 100 ? ' and investors' : ''}, ${U.money(mine)} lands in your account. ${b.hist.length > 104 ? 'Years of your life, in one wire transfer.' : 'Fast, and a little surreal.'}`);
    endBusiness(s, 'sold', price);
  };

  B.close = function (s) {
    const b = s.biz, p = s.p, t = tplOf(s, b);
    let cash = b.cash + b.equipValue * 0.28 + b.invCredit * 0.4 + U.sum(b.ar, (x) => x.amt) * 0.7 + b.invAsset * 0.85;
    let leaseHit = 0;
    if (b.space && b.space.left > 0) leaseHit = Math.min(6, b.space.left / 4.33) * b.space.rentMo;
    cash -= leaseHit;
    cash -= b.cardBal;
    const bizLoans = p.debts.filter((d) => d.acct === 'b');
    for (const d of bizLoans) {
      const pay = Math.max(0, Math.min(cash, d.bal));
      cash -= pay; d.bal -= pay;
    }
    let shifted = 0, forgiven = 0;
    for (const d of bizLoans) {
      if (d.bal <= 0.5) continue;
      if (d.guarantee || b.entity === 'sole' || b.entity === 'none') { d.acct = 'p'; d.name += ' (personally guaranteed)'; shifted += d.bal; }
      else { forgiven += d.bal; d.bal = 0; }
    }
    if (cash < 0 && (b.entity === 'sole' || b.entity === 'none')) { p.cash += cash; cash = 0; }
    p.cash += Math.max(0, cash) * b.equity / 100;
    p.debts = p.debts.filter((d) => d.bal > 0.5);
    if (forgiven > 0) p.credit = Math.max(300, p.credit - 25);
    G.journal.add(s, 'biz', `You close ${b.name}. ${leaseHit ? `Breaking the lease costs ${U.money(leaseHit)}. ` : ''}${shifted ? `${U.money(shifted)} of business debt you personally guaranteed is now yours. ` : ''}${forgiven ? `The LLC shield absorbs ${U.money(forgiven)} of unguaranteed debt. ` : ''}The equipment sells for pennies on the dollar.`);
    endBusiness(s, 'closed', 0);
  };

  function endBusiness(s, how, price) {
    const b = s.biz;
    const t = tplOf(s, b);
    s.pastBiz.push({ name: b.name, type: t.name, founded: b.founded, opened: b.opened, ended: s.week, how, price, rev: Math.round(b.life.rev), profit: Math.round(b.life.profit), peakStaff: b.peakStaff || b.staff.length, rating: Math.round(b.rep * 10) / 10 });
    s.pending = s.pending.filter((x) => x.kind !== 'listing' && x.kind !== 'crowd');
    b.staff = [];
    s.biz = null;
    s.ideaId = null;
    s.customTpl = null;
  }
})(G.biz);

// Generated customer reviews.
G.reviews = (function () {
  const U = G.util;
  const THING = { food: 'food', retail: 'shop', tech: 'app', media: 'work', ag: 'produce', science: 'products', services: 'service', trades: 'work', making: 'craftsmanship', transport: 'service', hospitality: 'experience', health: 'care', realestate: 'house' };
  const GOOD = ['Best {thing} in {city}. Not even close.', 'Finally, a place that gets it right. Will be back.', 'The owner clearly cares. You can feel it.', 'Worth every penny. Told all my friends.', 'Consistently great. My new go-to.', 'Hidden gem. Please never change.', 'Five stars, and I am stingy with stars.', 'Fast, friendly and honest. Rare these days.'];
  const OK = ['Pretty good. A little pricey for what it is.', 'Solid {thing}, nothing life-changing.', 'Good, but the wait was long.', 'Nice people. Inconsistent from visit to visit.', 'Decent. I would come back if I was nearby.'];
  const BAD = ['Waited forever and nobody apologized.', 'Overpriced and underwhelming.', 'Used to be good. Something changed.', 'Rude staff. Will not return.', 'Not worth the hype at all.', 'They clearly need more help. Chaos.'];
  function make(s, b, t, lostRatio) {
    let stars = Math.round(U.clamp(b.rep + U.gauss() * 0.9 - lostRatio, 1, 5));
    const bank = stars >= 4 ? GOOD : stars === 3 ? OK : BAD;
    let text = U.pick(bank).replace('{thing}', THING[t.cat] || 'service').replace('{city}', s.loc.city);
    if (stars <= 2 && lostRatio > 0.2) text = U.pick(['Waited forever and nobody apologized.', 'They clearly need more help. Chaos.', 'Tried three times, could never get in.']);
    return { stars, text, who: G.randName().split(' ')[0] + ' ' + G.randName().split(' ')[1][0] + '.', w: s.week };
  }
  return { make };
})();
