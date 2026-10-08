// Main game screen: header, navigation, tabs and in-game modals.
var G = globalThis.G || (globalThis.G = {});

G.uiGame = (function () {
  const U = G.util, esc = U.esc, ui = G.ui, M = (n, o) => U.money(n, o);
  const TABS = [
    ['overview', 'Overview'], ['plan', 'Week plan'], ['business', 'Business'], ['deals', 'Acquisitions'], ['money', 'Money'], ['giving', 'Giving'],
    ['career', 'Career & learning'], ['life', 'Life'], ['city', 'City & economy'], ['journal', 'Journal'],
  ];
  const v = () => ui.view;
  const S = () => ui.s;
  const tpl = () => G.state.tpl(S());

  // ---------- Alerts ----------
  function alerts(s) {
    const p = s.p, b = s.biz, out = [];
    const H = G.life.hours(s);
    const monthly = G.life.costs(s).total;
    if (H.leisure < 0) out.push(['bad', `Your week is overbooked by ${Math.ceil(-H.leisure)} hours.`, 'plan']);
    if (p.cash < 0) out.push(['bad', 'You are overdrawn. Bills are going unpaid and your credit is dropping.', 'money']);
    else if (p.cash < monthly && !p.job) out.push(['warn', `Less than a month of living costs in your account (${M(monthly)}/mo).`, 'money']);
    if (p.insurance === 'none') out.push(['warn', 'You have no health insurance. One emergency could cost $30k+.', 'life']);
    if (p.ccLimit > 0 && p.ccBal / p.ccLimit > 0.7) out.push(['warn', `Credit card is ${Math.round(p.ccBal / p.ccLimit * 100)}% used. That drags your credit score.`, 'money']);
    if (p.stress > 80) out.push(['bad', 'Stress is dangerously high. Burnout costs you weeks.', 'plan']);
    if (p.health < 40) out.push(['bad', 'Your health is poor. Sleep more and work less.', 'plan']);
    if (p.rel.status !== 'single' && p.rel.patience < 35) out.push(['warn', `${p.rel.partner} feels neglected. More family time.`, 'plan']);
    if (p.job && !p.job.flex && p.job.perf < 40) out.push(['warn', 'Your boss is unhappy with your work.', 'career']);
    if (b) {
      const t = tpl();
      const burn = b.last ? Math.max(0, -b.last.profit) : 0;
      if (b.cash < 0) out.push(['bad', `${b.name} is out of cash.`, 'business']);
      else if (burn > 0 && b.cash < burn * 4) out.push(['warn', `${b.name} has about ${Math.max(0, Math.floor(b.cash / burn))} weeks of cash at this burn rate.`, 'business']);
      if (b.phase === 'setup') {
        const avail = b.tasks.filter((x) => G.biz.taskAvailable(b, x)).length;
        if (avail) out.push(['info', `${avail} setup step${avail > 1 ? 's are' : ' is'} ready to start.`, 'business']);
        if (!G.biz.canLaunch(s, b).length) out.push(['good', 'Everything is ready. You can open for business.', 'business']);
        if (p.schedule.biz === 0) out.push(['warn', 'You have 0 business hours planned, so setup work will not move.', 'plan']);
      }
      if (b.phase === 'open' && b.last) {
        if (b.last.openFrac != null && b.last.openFrac < 0.95) out.push(['warn', `Not enough staff to stay open: you covered ${Math.round(b.last.openFrac * 100)}% of opening hours.`, 'business']);
        if (b.last.lost > Math.max(3, b.last.demand * 0.15)) out.push(['warn', `You turned away ${U.num(b.last.lost)} ${G.biz.unitLabel(t)} last week. Hire or work more hours.`, 'business']);
        if (b.staff.length && !b.ins.wc && s.loc.state !== 'TX') out.push(['warn', 'You have employees but no workers\' comp insurance.', 'business']);
        if (b.staff.some((e) => e.morale < 40)) out.push(['warn', 'Some staff are unhappy and may quit.', 'business']);
        if (t.engine === 'rnd' && b.rnd.blocked) out.push(['warn', 'Research is stalled until you fund the next phase.', 'business']);
        if (t.engine === 'projects' && !b.projects.length && !b.listings.length) out.push(['info', 'No project in progress. Start your next one.', 'business']);
      }
    } else if (s.ideaId || s.customTpl) out.push(['info', 'Your idea is waiting. Start setting up the business when you are ready.', 'business']);
    if (s.holdings && s.holdings.length && G.hold.oversightHours(s) > p.schedule.biz * G.life.productivity(s)) out.push(['warn', `Your companies need ${G.hold.oversightHours(s)} hours of oversight a week. Hire managers or plan more business hours.`, 'deals']);
    if (s.holdings && s.holdings.some((h) => h.health < 40)) out.push(['warn', 'One of your companies is in poor health.', 'deals']);
    if (!s.flags.sawDeals && G.hold.unlocked(s)) out.push(['good', 'You are big enough to buy other companies now, in any industry.', 'deals']);
    const ret = G.finance.computeReturn(s, p.ytd);
    if (ret.due > 3000 && !p.estimates) out.push(['warn', `You will owe about ${M(ret.due)} in taxes for ${U.yearOf(s.week)}. Consider quarterly payments.`, 'money']);
    return out;
  }

  // ---------- Header & shell ----------
  function header(s) {
    const p = s.p, b = s.biz;
    const st = G.loc.state(s.loc.state);
    return `<header class="topbar"><div class="topbar-in">
      <span class="brand"><span class="bm">SM</span><span>Self Made</span></span>
      <span class="marker" title="Week ${s.week + 1}"><small>WEEK</small><b>${s.week + 1}</b></span>
      <div class="stack-s" style="gap:0"><b>${esc(U.fmtDate(s.week, true))}</b><span class="muted small">${esc(s.loc.city)}, ${esc(st.ab)} · age ${G.state.age(s)}</span></div>
      <div class="wallets">
        <div class="wallet"><span class="label">You</span><b class="${p.cash < 0 ? 'neg' : ''}">${M(p.cash)}</b></div>
        ${b ? `<div class="wallet"><span class="label">${esc(b.name.length > 18 ? 'Business' : b.name)}</span><b class="${b.cash < 0 ? 'neg' : ''}">${M(b.cash)}</b></div>` : ''}
        <div class="wallet"><span class="label">Net worth</span><b>${M(G.state.netWorth(s), { short: true })}</b></div>
        <div class="next-wrap">
          <button class="next-btn" data-act="nextWeek" ${G.sim.canAdvance(s).ok ? '' : 'disabled'} title="${esc(G.sim.canAdvance(s).why || 'Advance one week (N)')}">Next week <span class="arrow">→</span></button>
          <button class="btn btn-s" data-act="skip4" ${G.sim.canAdvance(s).ok ? '' : 'disabled'} title="Advance up to 4 weeks, stopping for any decision">×4</button>
        </div>
      </div>
    </div></header>`;
  }

  function render() {
    const s = S();
    if (!s) return '';
    if (s.ended) return header(s) + `<div class="shell"><div></div><main class="main">${legacyPage(s)}</main></div>`;
    const al = alerts(s);
    const tabs = { overview, plan, business, deals, money, giving, career, life, city, journal };
    return header(s) + `<div class="shell">
      <nav class="nav" aria-label="Sections">${TABS.map(([id, n]) => {
        const c = al.filter((a) => a[2] === id && a[0] !== 'info' && a[0] !== 'good').length;
        return `<button data-act="tab" data-a="${id}" ${ui.tab === id ? 'aria-current="page"' : ''}>${esc(n)}${c ? `<span class="count">${c}</span>` : ''}</button>`;
      }).join('')}
        <div class="nav-foot"><button class="btn btn-ghost btn-s" data-act="saveMenu">Save game</button><button class="btn btn-ghost btn-s" data-act="themeToggle">Light / dark</button><button class="btn btn-ghost btn-s" data-act="toTitle">Quit to title</button></div>
      </nav>
      <main class="main">${tabs[ui.tab] ? tabs[ui.tab](s, al) : ''}</main>
    </div>`;
  }

  // ---------- Overview ----------
  function overview(s, al) {
    const p = s.p, b = s.biz, r = s.lastReport;
    const initials = p.name.split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
    const hist = s.hist.slice(-104);
    const recent = s.journal.slice(-6).reverse();
    return `<div class="page-head"><div><h2>${esc(p.name)}</h2><p>${esc(G.BACKGROUNDS.find((x) => x.id === p.bg).name)} · ${p.job ? esc(p.job.title) : 'No day job'}${b ? ` · ${b.phase === 'open' ? 'Owner of' : 'Building'} ${esc(b.name)}` : ''}</p></div></div>
    ${al.length ? `<div class="stack-s">${al.slice(0, 6).map(([k, t, tab]) => `<button class="alert ${k === 'bad' ? 'bad' : k === 'good' ? 'good' : k === 'info' ? 'info' : ''}" data-act="tab" data-a="${tab}" style="border:0;text-align:left;cursor:pointer"><span class="dot" style="margin-top:7px;color:${k === 'bad' ? 'var(--stop)' : k === 'good' ? 'var(--good)' : k === 'info' ? 'var(--shield)' : 'var(--caution)'}"></span><span class="grow">${esc(t)}</span><span class="small muted">${esc(TABS.find((x) => x[0] === tab)[1])} →</span></button>`).join('')}</div>` : ''}
    <div class="grid g2" style="align-items:start">
      <div class="stack">
        ${r ? `<div class="card"><div class="card-head"><h3>Last week</h3><span class="muted small">${esc(U.fmtDate(r.week))}</span></div>
          <div class="grid g3">
            ${ui.kpi('Personal cash change', ui.signed(r.cash1 - r.cash0))}
            ${b ? ui.kpi('Business cash change', ui.signed(r.bcash1 - r.bcash0)) : ui.kpi('Living costs', M(r.living || 0))}
            ${b && b.last && b.phase === 'open' ? ui.kpi('Business profit', ui.signed(b.last.profit)) : ui.kpi('Productivity', Math.round((r.prod || 1) * 100) + '%')}
          </div>
          ${r.alerts.length ? `<ul class="small" style="margin:12px 0 0;padding-left:18px">${r.alerts.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
        </div>` : `<div class="card stack"><h3>Welcome to ${esc(s.loc.city)}</h3><p class="muted">Plan your week, check your budget, and look at the business you want to build. When you are ready, press <b>Next week</b>. Every week is a turn.</p><div class="row">${ui.btn('Plan my week', 'tab', 'plan')}${ui.btn('Look at the business', 'tab', 'business', 'btn-go')}</div></div>`}
        <div class="card"><div class="card-head"><h3>Net worth</h3><span class="num">${M(G.state.netWorth(s))}</span></div>
          ${ui.chart('nw', [{ name: 'Net worth', values: hist.map((h) => h.nw), color: 'var(--road)', area: true }], hist.map((h) => h.w))}
        </div>
      </div>
      <div class="stack">
        <div class="card stack">
          <div class="row"><div style="width:46px;height:46px;border-radius:50%;background:var(--road);color:#fff;display:grid;place-items:center;font-weight:900">${esc(initials)}</div>
            <div class="grow"><b>${esc(p.name)}</b><div class="muted small">${G.state.age(s)} · ${esc(G.PRONOUNS[p.pronouns].sub)}/${esc(G.PRONOUNS[p.pronouns].obj)} · credit ${p.credit}</div></div>
            ${ui.pill(G.WHYS.find((w) => w.id === p.why).name, 'info')}</div>
          ${ui.meter('Health', p.health)}${ui.meter('Stress', p.stress, true)}${ui.meter('Happiness', p.happiness)}
          ${p.rel.status !== 'single' ? ui.meter(p.rel.partner, p.rel.patience) : ''}
          <hr class="divider">
          <div class="grid g2" style="gap:6px 16px">${Object.entries(G.SKILLS).map(([k, sk]) => `<div class="row between small"><span class="muted">${esc(sk.label)}</span><span class="num">${Math.round(p.skills[k])}</span></div>`).join('')}<div class="row between small"><span class="muted">Network</span><span class="num">${Math.round(p.network)}</span></div></div>
        </div>
        <div class="card"><div class="card-head"><h3>Recent</h3>${ui.btn('Full journal', 'tab', 'journal', 'btn-ghost btn-s')}</div><div class="log">${recent.map(logItem).join('')}</div></div>
      </div>
    </div>`;
  }

  function logItem(j) {
    const kinds = { biz: 'Business', money: 'Money', econ: 'Economy', career: 'Career', life: 'Life' };
    return `<div class="log-item"><span class="when">${esc(U.fmtDate(j.w))}</span><span class="what"><span class="k k-${j.k}">${kinds[j.k] || j.k}</span>${esc(j.t)}</span></div>`;
  }

  // ---------- Week plan ----------
  function plan(s) {
    const p = s.p, H = G.life.hours(s), sc = p.schedule;
    const order = [['sleep', 'Sleep'], ['job', 'Day job'], ['commute', 'Commute'], ['biz', 'Business'], ['network', 'Networking'], ['learn', 'Classes'], ['family', 'Family & friends'], ['chores', 'Chores & errands'], ['leisure', 'Free time']];
    const prod = G.life.productivity(s);
    const sl = (id, label, val, min, max, step, unit, help) => `<div class="slider-row"><div><b>${esc(label)}</b>${help ? `<div class="tiny faint">${esc(help)}</div>` : ''}</div>
      <input id="sl-${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}" data-in="sched" data-a="${id}" aria-label="${esc(label)}"><span class="v" id="slv-${id}">${val}${unit}</span></div>`;
    const flex = p.job && p.job.flex;
    return `<div class="page-head"><div><h2>Week plan</h2><p>Everyone gets 168 hours. Business hours drive setup and operations; sleep and free time keep you healthy enough to use them well.</p></div></div>
    <div class="card stack">
      <div class="hours-bar" aria-label="Hours in your week">${order.map(([k]) => `<span class="hb-${k}" style="width:${Math.max(0, H[k]) / 168 * 100}%" title="${k}: ${Math.round(H[k])}h"></span>`).join('')}</div>
      <div class="legend">${order.map(([k, n]) => `<span><i class="hb-${k}" style="${k === 'leisure' ? 'border:1px solid var(--line)' : ''}"></i>${esc(n)} <span class="num">${Math.round(H[k])}h</span></span>`).join('')}</div>
      ${H.leisure < 0 ? `<div class="alert bad"><b>Overbooked by ${Math.ceil(-H.leisure)} hours.</b>&nbsp;Cut something before you can advance.</div>` : H.leisure < 15 ? `<div class="alert">Only ${Math.round(H.leisure)} free hours. Stress will climb.</div>` : ''}
    </div>
    <div class="card stack">
      ${sl('sleep', 'Sleep per night', sc.sleep, 4, 10, 0.5, 'h', 'Under 7 hurts focus and health')}
      ${sl('biz', 'Business hours', sc.biz, 0, 100, 1, 'h', s.biz ? (s.biz.phase === 'setup' ? 'Moves your setup checklist forward' : 'Your labor, management and attention') : 'Research and prep, before you start a business')}
      ${flex ? sl('gig', p.job.id === 'gig' ? 'Driving hours' : 'Paid freelance hours', sc.gig, 0, 70, 1, 'h', 'Paid by the hour, no tax withheld') : ''}
      ${sl('network', 'Networking', sc.network, 0, 25, 1, 'h', 'Contacts lead to mentors, clients, investors and hires')}
      ${sl('family', 'Family & friends', sc.family, 0, 50, 1, 'h', p.rel.status !== 'single' ? `${p.rel.partner} wants at least ${10 + p.kids * 4}h` : 'Lowers stress')}
      <div class="row small muted"><span>Fixed: day job ${H.job}h${H.commute ? `, commute ${H.commute}h` : ''}${H.learn ? `, classes ${H.learn}h` : ''}, chores ${H.chores}h.</span></div>
    </div>
    <div class="grid g3">
      <div class="card">${ui.kpi('Free time', `${Math.round(H.leisure)}h`, 'What is left after everything')}</div>
      <div class="card">${ui.kpi('Productivity', Math.round(prod * 100) + '%', 'From sleep, stress and health')}</div>
      <div class="card">${ui.kpi('Effective business hours', `${Math.round(sc.biz * prod)}h`)}</div>
    </div>`;
  }

  // ---------- Business ----------
  function business(s) {
    const b = s.biz;
    if (!b) return noBusiness(s);
    if (b.phase === 'setup') return setupView(s, b);
    return openView(s, b);
  }

  function ideaPicker(s) {
    const cat = v().pickCat || 'food';
    const L = s.loc;
    const list = G.BIZ_LIST.filter((t) => t.cat === cat);
    return `<div class="card stack"><div class="card-head" style="margin:0"><h3>Pick a business</h3>${ui.btn('Cancel', 'pickIdea', '0', 'btn-ghost btn-s')}</div>
      <div class="biz-cats">${Object.entries(G.CATEGORIES).map(([k, n]) => `<button class="chip" data-act="pickCat" data-a="${k}" aria-pressed="${cat === k}">${esc(n)}</button>`).join('')}<button class="chip" data-act="pickCat" data-a="custom" aria-pressed="${cat === 'custom'}">Your own idea</button></div>
      ${cat === 'custom' ? customForm(s) : `<div class="grid g2">${list.map((t) => {
        const ci = G.biz.costIndex(s);
        const est = U.sum(t.startup, (x) => x[1]) * ci + (t.space ? t.space.sqft * G.loc.commercialRent(L, t.space.type === 'residential' ? 'retail' : t.space.type) / 4 : 0) + (t.harvest ? t.harvest.unitCost * t.harvest.units0 * ci : 0);
        return `<button class="tile" data-act="setIdea" data-a="${t.id}"><div class="row between"><b>${esc(t.name)}</b><span class="num small">~${M(est, { short: true })}</span></div><span class="small">${esc(t.desc)}</span>${t.cred ? `<span class="tiny" style="color:var(--stop)">Needs ${esc(G.CREDS[t.cred])}</span>` : ''}</button>`;
      }).join('')}</div>`}</div>`;
  }

  function customForm(s) {
    const f = v().cf || (v().cf = { name: '', what: '', model: 'walkin', cat: 'services', price: 40, margin: 0.6, space: 'home', budget: 20000, skills: ['sales', 'craft'], license: false });
    return `<div class="stack">
      <div class="grid g2"><label class="field"><span class="label">Name</span><input id="gcf-name" class="input" data-in="gcf" data-a="name" value="${esc(f.name)}" maxlength="50"></label>
      <label class="field"><span class="label">Industry</span><select id="gcf-cat" class="input" data-ch="gcf" data-a="cat">${Object.entries(G.CATEGORIES).map(([k, n]) => `<option value="${k}" ${f.cat === k ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label></div>
      <label class="field"><span class="label">What do you do?</span><input id="gcf-what" class="input" data-in="gcf" data-a="what" value="${esc(f.what)}" maxlength="140"></label>
      <div class="grid g3">${G.MODELS.map((m) => `<button class="tile" data-act="gcfModel" data-a="${m.id}" aria-pressed="${f.model === m.id}"><b>${esc(m.name)}</b><span class="small">${esc(m.blurb)}</span></button>`).join('')}</div>
      <div class="grid g2">
        <label class="field"><span class="label">Average sale / price ($)</span><input id="gcf-price" class="input num" type="number" min="1" data-ch="gcfNum" data-a="price" value="${f.price}"></label>
        <label class="field"><span class="label">Gross margin (%)</span><input id="gcf-margin" class="input num" type="number" min="10" max="97" data-ch="gcfNum" data-a="margin" value="${Math.round(f.margin * 100)}"></label>
        <label class="field"><span class="label">Space</span><select id="gcf-space" class="input" data-ch="gcf" data-a="space">${Object.entries(G.SPACE_TYPES).map(([k, x]) => `<option value="${k}" ${f.space === k ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></label>
        <label class="field"><span class="label">Equipment & inventory budget ($)</span><input id="gcf-budget" class="input num" type="number" min="500" step="500" data-ch="gcfNum" data-a="budget" value="${f.budget}"></label>
      </div>
      <div class="row">${Object.entries(G.SKILLS).map(([k, x]) => `<button class="chip" data-act="gcfSkill" data-a="${k}" aria-pressed="${f.skills.includes(k)}">${esc(x.label)}</button>`).join('')}</div>
      ${ui.btn('Use this idea', 'setIdea', 'custom', 'btn-go')}
    </div>`;
  }

  function noBusiness(s) {
    const t = tpl();
    if (v().picking || !t) return `<div class="page-head"><div><h2>Business</h2><p>${s.pastBiz.length ? 'Ready for the next one?' : 'Every business starts as an idea that will not leave you alone.'}</p></div></div>${ideaPicker(s)}${pastList(s)}`;
    const ci = G.biz.costIndex(s);
    const est = U.sum(t.startup, (x) => x[1]) * ci + U.sum(t.licenses, (x) => x[1]) * ci;
    return `<div class="page-head"><div><h2>The idea</h2><p>Starting the setup does not cost anything by itself. Each step on the checklist has its own cost and time.</p></div></div>
    <div class="card stack">
      <div class="row between"><h3>${esc(t.name)}</h3>${ui.btn('Change idea', 'pickIdea', '1', 'btn-ghost btn-s')}</div>
      <p>${esc(t.desc)}</p>
      <div class="facts">
        <div class="fact"><span class="label">Startup items</span><b>${M(est)}</b></div>
        ${t.space ? `<div class="fact"><span class="label">Space</span><b>${t.space.sqft.toLocaleString()} sq ft</b></div><div class="fact"><span class="label">Rent here</span><b>${M(t.space.sqft * G.loc.commercialRent(s.loc, t.space.type === 'residential' ? 'retail' : t.space.type) / 12)}/mo</b></div>` : '<div class="fact"><span class="label">Space</span><b>None needed</b></div>'}
        <div class="fact"><span class="label">Licenses</span><b>${t.licenses.length}</b></div>
        <div class="fact"><span class="label">Key skills</span><b class="small" style="font-family:var(--font-ui)">${Object.keys(t.keys).map((k) => G.SKILLS[k].label).join(', ')}</b></div>
        <div class="fact"><span class="label">Your experience</span><b>${Math.round(s.p.xp[t.xp] || 0)}/100</b></div>
      </div>
      ${t.cred && !s.p.creds.includes(t.cred) ? `<div class="alert">You will need a ${esc(G.CREDS[t.cred])}, or to hire someone who has one.</div>` : ''}
      <div class="row"><input id="biz-name" class="input" style="max-width:320px" placeholder="Name your business" value="${esc(v().bizName || '')}" data-in="bizName" maxlength="50">${ui.btn('Start setting it up', 'createBiz', '', 'btn-go')}</div>
    </div>${pastList(s)}`;
  }

  function pastList(s) {
    if (!s.pastBiz.length) return '';
    return `<div class="card"><h3>Past businesses</h3><table class="ledger" style="margin-top:8px"><tr><th>Name</th><th>Outcome</th><th class="r">Revenue</th><th class="r">Profit</th></tr>${s.pastBiz.map((x) => `<tr><td>${esc(x.name)}<div class="tiny faint">${esc(x.type)}</div></td><td>${x.how === 'sold' ? ui.pill('Sold for ' + M(x.price, { short: true }), 'good') : ui.pill('Closed', 'bad')}</td><td class="r">${M(x.rev, { short: true })}</td><td class="r">${M(x.profit, { short: true })}</td></tr>`).join('')}</table></div>`;
  }

  function transferBox(s) {
    return `<div class="row"><input id="xfer-amt" class="input num" style="max-width:150px" type="number" min="0" step="100" placeholder="Amount" value="${v().xfer || ''}" data-in="xferAmt">
      ${ui.btn('Move to business →', 'xfer', 'in', 'btn-s')}${ui.btn('← Pay yourself', 'xfer', 'out', 'btn-s')}</div>`;
  }

  function setupView(s, b) {
    const t = tpl();
    const prog = G.biz.setupProgress(b);
    const remaining = U.sum(b.tasks.filter((x) => x.state === 'todo'), (x) => x.cost);
    const missing = G.biz.canLaunch(s, b);
    const st = G.loc.state(s.loc.state);
    const taskRow = (x) => {
      const avail = G.biz.taskAvailable(b, x);
      const cls = x.state === 'done' ? 'done' : x.state === 'active' ? 'active' : x.state === 'waiting' ? 'waiting' : avail ? '' : 'locked';
      let status = '';
      if (x.state === 'done') status = ui.pill('Done', 'good');
      else if (x.state === 'active') status = `<span class="small muted num">${Math.round(x.prog)}/${x.hours}h</span>`;
      else if (x.state === 'waiting') status = ui.pill(`Waiting ${x.waitLeft} wk`, 'info');
      let action = '';
      if (avail) {
        if (x.choice === 'entity') action = `<div class="row">${ui.btn(`Sole prop · $50`, 'startTask', 'entity:sole', 'btn-s')}${ui.btn(`LLC · ${M(st.llc)}`, 'startTask', 'entity:llc', 'btn-s btn-go')}</div>`;
        else action = ui.btn(x.cost ? `Start · ${M(x.cost)}` : 'Start', 'startTask', x.id, 'btn-s btn-go', b.cash < x.cost, b.cash < x.cost ? 'Not enough in the business account' : '');
      }
      return `<div class="task ${cls}"><span class="chk">${x.state === 'done' ? '✓' : ''}</span>
        <div class="grow"><div class="row"><b>${esc(x.name)}</b>${x.req ? '' : ui.pill('Optional')}</div><div class="small muted">${esc(x.desc)}</div>
        <div class="tiny faint">${x.hours ? `${x.hours} business hours` : ''}${x.hours && x.wait ? ' · ' : ''}${x.wait ? `${x.wait} week${x.wait > 1 ? 's' : ''} of waiting` : ''}</div>
        ${x.state === 'active' ? `<div class="prog"><i style="width:${x.prog / x.hours * 100}%"></i></div>` : ''}</div>
        <div>${status}${action}</div></div>`;
    };
    return `<div class="page-head"><div><h2>${esc(b.name)}</h2><p>${esc(t.name)} · setting up · started ${esc(U.fmtDate(b.founded))}</p></div>${ui.btn('Abandon', 'abandonBiz', '', 'btn-danger btn-s')}</div>
    <div class="grid g3">
      <div class="card">${ui.kpi('Setup progress', Math.round(prog * 100) + '%')}<div class="prog"><i style="width:${prog * 100}%"></i></div></div>
      <div class="card">${ui.kpi('Business account', M(b.cash), 'Fund it from your savings or a loan')}</div>
      <div class="card">${ui.kpi('Still to pay', M(remaining), `Spent so far: ${M(b.startupSpent || 0)}`)}</div>
    </div>
    <div class="card stack"><h3>Fund the business</h3>${transferBox(s)}<p class="small muted">Need more? Loans, grants and investors are on the ${ui.btn('Money tab', 'tab', 'money', 'btn-ghost btn-s')}</p></div>
    <div class="card"><div class="card-head"><h3>Launch checklist</h3><span class="small muted">Your ${s.p.schedule.biz} business hours a week go to active steps, top to bottom.</span></div>${b.tasks.map(taskRow).join('')}</div>
    ${staffCard(s, b)}
    <div class="card stack"><h3>Open for business</h3>
      ${missing.length ? `<p class="muted small">Still needed: ${missing.map(esc).join(', ')}.</p>` : `<p>Everything is in place. How much will you spend on the grand opening?</p>
      <div class="row">${[0, 1000, 3000, 8000].map((x) => ui.btn(x ? `Launch with ${M(x)}` : 'Soft launch (free)', 'launch', String(x), x === 1000 ? 'btn-go' : '', b.cash < x)).join('')}</div>`}
    </div>`;
  }

  function staffCard(s, b) {
    const t = tpl();
    const roleNote = t.roles.map((r) => G.ROLES[r].title).join(', ');
    return `<div class="card stack"><div class="card-head" style="margin:0"><h3>Team</h3><span class="small muted">Payroll ${M(U.sum(b.staff, (e) => e.wage * e.hours) * 1.092)}/wk incl. payroll taxes</span></div>
      ${b.staff.length ? b.staff.map((e) => `<div class="staff-row"><div class="grow"><b>${esc(e.name)}</b> <span class="muted small">${esc(G.ROLES[e.role].title)} · ${e.hours}h · ${M(e.wage, { cents: true })}/hr</span>
        <div class="row small"><span class="muted">Skill <span class="num">${Math.round(e.skill)}</span></span><span class="muted">Morale</span><div class="meter ${e.morale < 40 ? 'bad' : e.morale < 55 ? 'warn' : ''}" style="width:80px"><i style="width:${e.morale}%"></i></div></div></div>
        <div class="row">${ui.btn('Raise 8%', 'raise', e.id, 'btn-s')}${ui.btn('Let go', 'fire', e.id, 'btn-s btn-danger')}</div></div>`).join('') : `<p class="muted small">No employees yet. Roles for this business: ${esc(roleNote)}, plus managers.</p>`}
      <h4 style="margin-top:6px">Candidates</h4>
      ${b.candidates.map((c) => `<div class="staff-row"><div class="grow"><b>${esc(c.name)}</b> <span class="muted small">${esc(G.ROLES[c.role].title)}${G.ROLES[c.role].cred ? ` · ${esc(G.CREDS[G.ROLES[c.role].cred])}` : ''}</span><div class="small muted">Skill <span class="num">${c.skill}</span> · asks ${M(c.ask, { cents: true })}/hr · ${esc(c.note)}</div></div>
        <div class="row">${ui.btn('Hire full-time', 'hire', c.id + ':40', 'btn-s btn-go')}${ui.btn('Part-time', 'hire', c.id + ':20', 'btn-s')}</div></div>`).join('')}
      <p class="tiny faint">New candidates every two weeks. A bigger network and a better reputation bring stronger people.</p>
    </div>`;
  }

  function openView(s, b) {
    const t = tpl(), p = s.p, L = b.last || {};
    const hist = b.hist.slice(-52);
    const unit = G.biz.unitLabel(t);
    const ev = G.biz.enterpriseValue(s, b);
    const listing = s.pending.find((x) => x.kind === 'listing');
    const mo = U.sum(b.hist.slice(-4), (h) => h.rev);
    let kpis = [
      ui.kpi('Revenue last week', M(L.rev || 0), `${M(mo, { short: true })} last 4 weeks`),
      ui.kpi('Profit last week', ui.signed(L.profit || 0), `${M(B12(b, 'profit'), { short: true })} last 12 weeks`),
      ui.kpi(t.engine === 'subscription' ? (t.sub.local ? 'Members' : 'Subscribers') : t.engine === 'harvest' ? (t.harvest.unit[0].toUpperCase() + t.harvest.unit.slice(1) + 's') : t.engine === 'rnd' ? 'Milestones' : t.engine === 'projects' ? 'Catalog' : unit[0].toUpperCase() + unit.slice(1) + ' last week',
        t.engine === 'subscription' ? U.num(Math.floor(b.subs)) : t.engine === 'harvest' ? U.num(b.crop.units) : t.engine === 'rnd' ? `${b.rnd.ms}/${t.rnd.milestones.length}` : t.engine === 'projects' ? U.num(b.catalog.length) : U.num(L.units || 0),
        t.engine === 'subscription' ? `${M(G.biz.mrr(s, b))} MRR` : ''),
      ui.kpi('Rating', `${b.rep.toFixed(1)}`, `${ui.stars(b.rep)} · ${b.reviewsCount} reviews`),
      ui.kpi('Awareness', Math.round(b.awareness) + '/100', 'How many people know you'),
      ui.kpi('Value', M(ev, { short: true }), `You own ${b.equity.toFixed(b.equity < 100 ? 1 : 0)}%`),
    ];
    return `<div class="page-head"><div><h2>${esc(b.name)}</h2><p>${esc(t.name)} · open since ${esc(U.fmtDate(b.opened))} · ${esc(G.biz.ENTITIES[b.entity])}${listing ? ' · listed for sale' : ''}</p></div>
      <div class="row">${ui.pill(`Quality ${Math.round(b.quality)}`, b.quality > 65 ? 'good' : b.quality > 45 ? '' : 'bad')}${L.closed ? ui.pill('Closed last week', 'bad') : ''}</div></div>
    <div class="card"><div class="grid g3">${kpis.join('')}</div></div>
    <div class="card"><div class="card-head"><h3>Revenue & profit</h3><span class="small muted">Weekly, last ${hist.length} weeks</span></div>
      ${ui.chart('biz', [{ name: 'Revenue', values: hist.map((h) => h.rev), color: 'var(--road)', area: true }, { name: 'Profit', values: hist.map((h) => h.profit), color: 'var(--shield)' }], hist.map((h) => h.w))}</div>
    <div class="grid g2" style="align-items:start">
      <div class="stack">${operations(s, b, t)}${engineCard(s, b, t)}</div>
      <div class="stack">${plCard(s, b)}${adminCard(s, b, t)}</div>
    </div>
    ${staffCard(s, b)}
    ${b.reviews.length ? `<div class="card"><div class="card-head"><h3>Reviews</h3>${ui.stars(b.rep)}</div>${b.reviews.slice(0, 6).map((r) => `<div class="review"><div class="row between small"><span>${ui.stars(r.stars)} <b>${esc(r.who)}</b></span><span class="faint">${esc(U.fmtDate(r.w))}</span></div><p>${esc(r.text)}</p></div>`).join('')}</div>` : ''}
    <div class="card stack"><h3>Exit</h3><p class="small muted">Sell through a broker (10% fee, months to find a buyer), or close: equipment sells for about a quarter of its value, leases have penalties, and personally guaranteed debt becomes yours.</p>
      <div class="row">${ui.btn(listing ? 'Listed with a broker' : 'List for sale', 'listSale', '', '', !!listing)}${ui.btn('Close the business', 'closeBiz', '', 'btn-danger')}</div></div>`;
  }
  function B12(b, k) { return U.sum(b.hist.slice(-12), (h) => h[k]); }

  function operations(s, b, t) {
    const pIdx = t.online ? 1 : G.loc.priceIndex(s.loc);
    let base = t.engine === 'subscription' ? t.sub.price * (t.sub.local ? pIdx : 1) : t.engine === 'traffic' ? t.price * pIdx : null;
    const ch = G.biz.CHANNELS;
    return `<div class="card stack"><h3>Operations</h3>
      <div class="field"><span class="label">Price: <b class="num" id="pv">${Math.round(b.price * 100)}%</b> of the going rate${base ? ` <span class="num muted" id="pv2">(${M(base * b.price, { cents: base * b.price < 100 })})</span>` : ''}</span>
        <input id="ops-price" type="range" min="60" max="160" step="1" value="${Math.round(b.price * 100)}" data-in="opsPrice" data-ch="opsPriceC" data-base="${base || ''}"></div>
      <div class="field"><span class="label">Quality level</span><div class="seg">${G.biz.TIERS.map((x, i) => `<button data-act="tier" data-a="${i}" aria-pressed="${b.tier === i}">${x.label}</button>`).join('')}</div><span class="tiny faint">Premium raises costs about 22% and quality by 10.</span></div>
      <div class="field"><span class="label">Marketing: <b class="num" id="mv">${M(b.mkt.budget)}</b>/week</span>
        <input id="ops-mkt" type="range" min="0" max="${t.online ? 10000 : 3000}" step="${t.online ? 50 : 25}" value="${b.mkt.budget}" data-in="opsMkt" data-ch="opsMktC"></div>
      <div class="grid g2" style="gap:6px">${Object.entries(ch).map(([k, c]) => `<button class="tile" data-act="channel" data-a="${k}" aria-pressed="${b.mkt.channel === k}" style="padding:8px 10px"><b class="small">${esc(c.label)}</b><span class="tiny">${esc(c.desc)}</span></button>`).join('')}</div>
      ${t.engine === 'subscription' ? `<div class="field"><span class="label">Your time: <b id="fv">${Math.round((1 - b.focus) * 100)}% product · ${Math.round(b.focus * 100)}% selling</b></span><input id="ops-focus" type="range" min="0" max="100" value="${Math.round(b.focus * 100)}" data-in="opsFocus" data-ch="opsFocusC"></div>` : ''}
    </div>`;
  }

  function engineCard(s, b, t) {
    const L = b.last || {};
    if (t.engine === 'traffic') {
      const ar = U.sum(b.ar, (a) => a.amt);
      const unit = G.biz.unitLabel(t);
      return `<div class="card stack"><h3>Demand</h3><div class="grid g3">
        ${ui.kpi('Demand', U.num(L.demand || 0), unit)}${ui.kpi('Served', U.num(L.units || 0))}${ui.kpi('Turned away', U.num(L.lost || 0), '', (L.lost || 0) > 0 ? 'neg' : '')}
        ${ui.kpi('Capacity', U.num(L.capacity || 0, (L.capacity || 0) < 10 ? 1 : 0), 'per week with current hours')}
        ${t.cov ? ui.kpi('Open hours covered', Math.round((L.openFrac || 0) * 100) + '%', `${t.cov} labor hours/week to stay open`) : ''}
        ${b.backlog >= 1 ? ui.kpi('Backlog', U.num(b.backlog, 1)) : ''}
        ${ar ? ui.kpi('Unpaid invoices', M(ar), 'Clients pay on terms') : ''}
        ${t.online ? ui.kpi('Customer base', U.num(b.custBase), 'Some reorder') : ''}
      </div>
      <p class="tiny faint">${t.online ? `Online, every digital ad dollar buys customers at about ${M(t.cac)} each, and awareness compounds.` : `${b.researched ? `${U.num(b.comps)} competitors in your market, including ${esc(b.rival)}.` : 'Do market research to learn how many competitors you face.'}`}</p></div>`;
    }
    if (t.engine === 'subscription') {
      return `<div class="card stack"><h3>${t.sub.local ? 'Membership' : 'Subscriptions'}</h3><div class="grid g3">
        ${ui.kpi('MRR', M(G.biz.mrr(s, b)))}${ui.kpi('New last week', U.num(L.units || 0, 1))}${ui.kpi('Churned', U.num(L.churned || 0, 1))}
        ${t.sub.local ? ui.kpi('Waitlist demand', U.num(b.waitlist || 0), 'More staff = more capacity') : ui.kpi('Product', Math.round(b.product) + '/100', 'Grows with build hours')}
      </div></div>`;
    }
    if (t.engine === 'projects') return projectsCard(s, b, t);
    if (t.engine === 'harvest') return harvestCard(s, b, t);
    if (t.engine === 'rnd') return rndCard(s, b, t);
    return '';
  }

  function projectsCard(s, b, t) {
    const pt = v().ptype || t.projects[0].id;
    const type = t.projects.find((x) => x.id === pt) || t.projects[0];
    const ci = G.biz.costIndex(s);
    const buy = type.buy ? Math.round(type.buy * Math.pow(s.loc.col / 100, 1.15) * s.econ.housing / 1000) * 1000 : 0;
    return `<div class="card stack"><h3>${t.id === 'flip' ? 'Properties' : 'Projects'}</h3>
      ${b.projects.map((pr) => `<div><div class="row between"><b>${esc(pr.name)}</b><span class="num small">${Math.round(pr.prog)}/${pr.hours}h</span></div><div class="prog"><i style="width:${pr.prog / pr.hours * 100}%"></i></div></div>`).join('') || '<p class="small muted">Nothing in progress.</p>'}
      ${b.listings.map((l) => `<div class="row between small"><span><b>${esc(l.name)}</b> listed</span><span class="muted">~${l.left} wk to sell · ${M(l.value * s.econ.housing / l.housingAtStart, { short: true })}</span></div>`).join('')}
      <hr class="divider">
      <div class="field"><span class="label">Start a new ${t.id === 'flip' ? 'property' : 'project'}</span><select id="ptype" class="input" data-ch="ptype">${t.projects.map((x) => `<option value="${x.id}" ${x.id === pt ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
      <p class="small muted">${type.hours} hours of work · ${M(type.cost * ci)} ${t.id === 'flip' ? 'renovation budget' : 'production cost'}${buy ? ` · purchase about ${M(buy)}` : ''}</p>
      <div class="row"><input id="ptitle" class="input" style="max-width:260px" placeholder="${t.id === 'flip' ? '1412 Elm St' : 'Working title'}" value="${esc(v().ptitle || '')}" data-in="ptitle" maxlength="60">
        ${t.id === 'flip' ? `${ui.btn('Buy with cash', 'startProject', '0', 'btn-s')}${ui.btn('Buy with hard money (85%)', 'startProject', '1', 'btn-s btn-go')}` : ui.btn('Start', 'startProject', '0', 'btn-go btn-s')}</div>
      ${b.catalog.length ? `<div class="scroll-x"><table class="ledger"><tr><th>Title</th><th class="r">Quality</th><th class="r">Per week</th><th class="r">Earned</th></tr>${b.catalog.slice().reverse().slice(0, 12).map((c) => `<tr><td>${esc(c.name)}${c.hit ? ' ' + ui.pill('Hit', 'good') : ''}</td><td class="r">${c.q}</td><td class="r">${U.num(c.units)} ${esc(c.unit === 'copies' ? '' : c.unit)}</td><td class="r">${M(c.total, { short: true })}</td></tr>`).join('')}</table></div>` : ''}
    </div>`;
  }

  function harvestCard(s, b, t) {
    const h = t.harvest, c = b.crop;
    const months = G.biz.climateMonths(s).map((m) => U.MON3[m]).join(', ');
    const status = h.annual ? (c.delay > 0 ? `Establishing: ${c.delay} weeks until the first harvest` : `Next sale window: ${h.saleMonths.map((m) => U.MON3[m]).join('/')}`) : c.status === 'growing' ? `Growing: week ${c.prog} of ${h.cycle}` : h.indoor ? 'Ready to start the next cycle' : `Idle. Planting window here: ${months}`;
    return `<div class="card stack"><h3>${esc(h.unit[0].toUpperCase() + h.unit.slice(1))}s</h3>
      <p class="small">${esc(status)}</p>
      ${!h.annual && c.status === 'growing' ? `<div class="prog"><i style="width:${c.prog / h.cycle * 100}%"></i></div>` : ''}
      <div class="grid g3">${ui.kpi('Units', U.num(c.units))}${ui.kpi('Crop health', Math.round(c.health) + '%')}${ui.kpi('Market price', Math.round(c.price * 100) + '%')}</div>
      ${!h.noDirect ? `<div class="field"><span class="label">Sales channel</span><div class="seg"><button data-act="channelCrop" data-a="direct" aria-pressed="${c.channel === 'direct'}">Direct (markets, CSA)</button><button data-act="channelCrop" data-a="wholesale" aria-pressed="${c.channel === 'wholesale'}">Wholesale</button></div><span class="tiny faint">Direct pays full price but needs 25% more labor. Wholesale pays about ${Math.round(h.wholesale * 100)}%.</span></div>` : ''}
      <div class="row">${ui.btn(`Add 1 ${h.unit} · ${M(h.unitCost * G.biz.costIndex(s))}`, 'addUnits', '1', 'btn-s')}${ui.btn(`Add 5`, 'addUnits', '5', 'btn-s')}</div>
      <p class="tiny faint">Labor needed: about ${Math.round(c.units * h.labor)} hours a week. ${b.last && b.last.laborRatio != null && b.last.laborRatio < 0.95 ? `You covered ${Math.round(b.last.laborRatio * 100)}% of it last week.` : ''}</p>
    </div>`;
  }

  function rndCard(s, b, t) {
    const ms = t.rnd.milestones, R = b.rnd;
    return `<div class="card stack"><h3>Research pipeline</h3>
      ${ms.map((m, i) => {
        const prev = i ? ms[i - 1].pts : 0;
        const pct = i < R.ms ? 100 : i === R.ms ? U.clamp((R.pts - prev) / (m.pts - prev) * 100, 0, 100) : 0;
        return `<div><div class="row between small"><b>${esc(m.name)}</b><span class="muted">${i < R.ms ? 'Done' : m.cost ? `needs ${M(m.cost, { short: true })}${R.funded[i] ? ' (funded)' : ''}` : ''}</span></div><div class="prog"><i style="width:${pct}%"></i></div></div>`;
      }).join('')}
      ${R.blocked ? `<div class="alert">Research stopped: the next phase needs ${M(ms[R.ms].cost)}. ${ui.btn('Fund it', 'fundMs', '', 'btn-s btn-go', b.cash < ms[R.ms].cost)}</div>` : ''}
      <p class="tiny faint">Progress last week: ${U.num(b.last && b.last.research || 0)} points. Scientists and your own Science skill drive it.</p></div>`;
  }

  function plCard(s, b) {
    const sumK = (n, k) => U.sum(b.hist.slice(-n), (h) => h[k]);
    const L = b.last || {};
    const rows = [['Revenue', L.rev], ['Cost of goods', -L.cogs], ['Payroll', -L.payroll], ['Rent', -L.rent], ['Utilities & overhead', -(L.fixed + L.other)], ['Marketing', -L.mkt], ['Insurance', -L.ins], ['Card fees', -L.fees], ['Interest', -L.interest]];
    return `<div class="card"><div class="card-head"><h3>Profit & loss</h3><span class="small muted">Last week</span></div>
      <table class="ledger">${rows.filter((r) => Math.abs(r[1] || 0) > 0.5 || r[0] === 'Revenue').map((r) => `<tr><td>${r[0]}</td><td class="r">${M(r[1] || 0)}</td></tr>`).join('')}
      <tr class="total"><td>Profit</td><td class="r ${L.profit < 0 ? 'neg' : ''}">${M(L.profit || 0)}</td></tr></table>
      <div class="grid g3" style="margin-top:12px">${ui.kpi('4 weeks', M(sumK(4, 'profit'), { short: true }))}${ui.kpi('52 weeks', M(sumK(52, 'profit'), { short: true }))}${ui.kpi('Lifetime', M(b.life.profit, { short: true }))}</div>
      <p class="tiny faint" style="margin-top:8px">Profit is before your own pay. ${b.entity === 'ccorp' ? 'Your C-corp pays 21% federal corporate tax on it.' : 'All of it lands on your personal tax return whether you take it out or not.'}</p></div>`;
  }

  function adminCard(s, b, t) {
    const canScorp = b.entity === 'llc';
    return `<div class="card stack"><h3>Admin</h3>
      <div class="field"><span class="label">Pay yourself: <b class="num" id="dv">${M(b.draw)}</b>/week${b.entity === 'scorp' || b.entity === 'ccorp' ? ' (salary)' : ' (owner draw)'}</span><input id="adm-draw" type="range" min="0" max="${Math.max(3000, Math.round(b.draw * 1.5 / 100) * 100)}" step="25" value="${b.draw}" data-in="drawIn" data-ch="drawC"><span class="tiny faint">Living costs run about ${M(G.life.costs(s).total / 4.33)}/week.</span></div>
      <div class="stack-s">
        ${[['gl', 'General liability', 'Lawsuits from customers and the public'], ['prop', 'Property', 'Fire, storms, theft of equipment'], ['wc', 'Workers\' comp', s.loc.state === 'TX' ? 'Optional in Texas' : 'Required once you have employees']].map(([k, n, d]) => `<label class="row small" style="cursor:pointer"><input type="checkbox" data-ch="ins" data-a="${k}" ${b.ins[k] ? 'checked' : ''}> <b>${n}</b> <span class="muted">${d}</span></label>`).join('')}
        <label class="row small" style="cursor:pointer"><input type="checkbox" data-ch="bookkeeper" ${b.bookkeeper ? 'checked' : ''}> <b>Bookkeeper</b> <span class="muted">$350/mo. Saves you admin hours and audit pain.</span></label>
      </div>
      <div class="row small"><span class="muted">Entity: ${esc(G.biz.ENTITIES[b.entity])}</span>${canScorp ? ui.btn('Elect S-corp taxation', 'scorp', '', 'btn-s', false, 'Saves self-employment tax once profits are healthy. About $1,800/yr in payroll and accounting.') : ''}${b.entity === 'sole' ? ui.btn(`Convert to LLC · ${M(G.loc.state(s.loc.state).llc)}`, 'toLlc', '', 'btn-s') : ''}</div>
      ${transferBox(s)}
    </div>`;
  }

  // ---------- Money ----------
  function money(s) {
    const p = s.p, b = s.biz;
    const c = G.life.costs(s);
    const opts = G.finance.options(s);
    const ret = G.finance.computeReturn(s, p.ytd);
    const debts = p.debts;
    const pend = s.pending.filter((x) => ['loan', 'grant', 'equity', 'crowd'].includes(x.kind));
    return `<div class="page-head"><div><h2>Money</h2><p>Your accounts, debts, taxes and every way to fund a business.</p></div></div>
    <div class="card"><div class="grid g4">
      ${ui.kpi('Your cash', M(p.cash), '', p.cash < 0 ? 'neg' : '')}
      ${b ? ui.kpi('Business cash', M(b.cash), b.cardLimit ? `Biz card ${M(b.cardBal)} / ${M(b.cardLimit)}` : '', b.cash < 0 ? 'neg' : '') : ''}
      ${ui.kpi('Credit card', M(p.ccBal), `of ${M(p.ccLimit)} limit · 24% APR`)}
      ${ui.kpi('Credit score', String(p.credit), p.credit >= 740 ? 'Excellent' : p.credit >= 670 ? 'Good' : p.credit >= 580 ? 'Fair' : 'Poor', p.credit < 580 ? 'neg' : '')}
      ${ui.kpi('Retirement', M(p.retirement))}
      ${ui.kpi('Total debt', M(U.sum(debts, (d) => d.bal) + p.ccBal))}
    </div>
    ${p.ccBal > 0 ? `<div class="row" style="margin-top:12px"><span class="small muted">Pay down the card:</span>${[500, 2000].map((x) => ui.btn(M(x), 'payCard', String(x), 'btn-s', p.cash < x)).join('')}${ui.btn('All', 'payCard', 'all', 'btn-s', p.cash <= 0)}</div>` : ''}
    ${b ? `<div style="margin-top:12px">${transferBox(s)}</div>` : ''}</div>
    <div class="grid g2" style="align-items:start">
      <div class="card"><div class="card-head"><h3>Monthly budget</h3><span class="num">${M(c.total)}</span></div>
        <table class="ledger">${[['Housing', c.housing], ['Utilities', c.utilities], ['Groceries', c.groceries], ['Phone & internet', c.phone], ['Transportation', c.transport], ['Health insurance', c.health], ['Kids', c.kids], ['Personal spending', c.personal]].filter((x) => x[1] > 0).map(([n, x]) => `<tr><td>${n}</td><td class="r">${M(x)}</td></tr>`).join('')}
        <tr><td>Debt payments</td><td class="r">${M(U.sum(debts.filter((d) => d.acct === 'p'), (d) => d.pmt) * 4.33 + p.ccBal * 0.03)}</td></tr></table>
        <p class="tiny faint" style="margin-top:8px">${p.rel.status !== 'single' && p.housing !== 'family' ? `${esc(p.rel.partner)} splits housing and utilities with you. ` : ''}Change housing, transport and lifestyle on the Life tab.</p></div>
      <div class="card"><div class="card-head"><h3>Debts</h3></div>
        ${debts.length ? `<div class="scroll-x"><table class="ledger"><tr><th>Loan</th><th class="r">Balance</th><th class="r">Rate</th><th class="r">Weekly</th><th></th></tr>${debts.map((d) => `<tr><td>${esc(d.name)}<div class="tiny faint">${d.acct === 'b' ? 'Business' : 'Personal'}${d.guarantee ? ' · personally guaranteed' : ''}</div></td><td class="r">${M(d.bal)}</td><td class="r">${(d.rate * 100).toFixed(1)}%</td><td class="r">${d.revShare ? Math.round(d.revShare * 100) + '% of sales' : M(d.interestOnly ? d.bal * d.rate / 52 : d.pmt)}</td><td>${ui.btn('Pay off', 'payoff', d.id, 'btn-s', (d.acct === 'b' ? (b ? b.cash : 0) : p.cash) < d.bal)}</td></tr>`).join('')}</table></div>` : '<p class="muted small">Debt-free.</p>'}
      </div>
    </div>
    <div class="card stack"><div class="card-head" style="margin:0"><h3>Taxes ${U.yearOf(s.week)}</h3><label class="row small" style="cursor:pointer"><input type="checkbox" data-ch="estimates" ${p.estimates ? 'checked' : ''}> Pay quarterly estimated taxes automatically</label></div>
      <div class="grid g4">${ui.kpi('Income so far', M(ret.wages + ret.gig + ret.biz + ret.other))}${ui.kpi('Tax so far', M(ret.total))}${ui.kpi('Already paid', M(ret.paid))}${ui.kpi(ret.due > 0 ? 'You would owe' : 'Refund so far', M(Math.abs(ret.due)), '', ret.due > 0 ? 'neg' : 'pos')}</div>
      <p class="small muted">Federal brackets with the ${M(G.finance.STD_DED)} standard deduction, 15.3% self-employment tax on business profit, the 20% qualified business income deduction, and ${esc(G.loc.state(s.loc.state).name)} income tax. Returns are due April 15.${p.lastReturn ? ` Last return (${p.lastReturn.year}): ${p.lastReturn.due > 0 ? 'owed ' + M(p.lastReturn.due) : 'refund ' + M(-p.lastReturn.due)}.` : ''}</p></div>
    ${pend.length ? `<div class="card"><h3>Pending</h3>${pend.map((a) => `<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><b>${esc(a.name || 'Crowdfunding campaign')}</b>${a.amount ? ' · ' + M(a.amount) : ''}</span><span class="muted">${a.weeks} week${a.weeks === 1 ? '' : 's'} left</span></div>`).join('')}</div>` : ''}
    <div class="card stack"><h3>Funding options</h3>
      ${opts.map((o) => `<div class="staff-row"><div class="grow"><div class="row"><b>${esc(o.name)}</b><span class="muted small">${esc(o.who)}</span>${o.ok ? '' : ui.pill('Not eligible', 'bad')}${o.equity ? ui.pill('Equity', 'info') : o.grant ? ui.pill('Grant', 'good') : ''}</div>
        <div class="small muted">${esc(o.desc)}</div>
        <div class="tiny faint">${o.max ? `Up to ${M(o.max)}` : ''}${o.rate ? ` · ${(o.rate * 100).toFixed(1)}%` : ''}${o.weeks ? ` · ${Math.round(o.weeks / 52)} years` : ''}${o.chance != null && o.chance < 1 && o.ok ? ` · approval odds ~${Math.round(o.chance * 100)}%` : ''}${!o.ok && o.reason ? ` · ${esc(o.reason)}` : ''}</div></div>
        ${o.info ? '' : o.ok ? `<div class="row">${o.max && !o.campaign ? `<input id="amt-${o.id}" class="input num" style="width:120px" type="number" min="0" max="${o.max}" step="500" value="${Math.min(o.max, v()['amt_' + o.id] || o.max)}" data-in="amtIn" data-a="${o.id}">` : ''}${ui.btn(o.campaign ? 'Launch' : 'Apply', 'applyFin', o.id, 'btn-s btn-go')}</div>` : ''}</div>`).join('')}
    </div>
    <div class="card stack"><h3>Save</h3><div class="row">${[1, 2, 3].map((n) => ui.btn(`Save to slot ${n}`, 'saveSlot', 'slot' + n, 'btn-s')).join('')}${ui.btn('Copy save text', 'exportSave', '', 'btn-s')}</div><p class="tiny faint">The game also autosaves every week in this browser.</p></div>`;
  }

  // ---------- Acquisitions ----------
  function deals(s) {
    const H = G.hold;
    H.ensure(s);
    if (!H.unlocked(s)) {
      return `<div class="page-head"><div><h2>Acquisitions</h2><p>Buy existing companies in any industry and build a portfolio.</p></div></div>
      <div class="card stack"><div class="row">${ui.pill('Locked', 'warn')}<b>${esc(H.unlockText)}</b></div>
        <p class="muted">Most small businesses in America change hands when an owner retires. Buying one means revenue from day one, but also someone else's problems. Grow your net worth to get a seat at the table.</p>
        <div class="grid g3">${ui.kpi('Your net worth', M(G.state.netWorth(s)))}${ui.kpi('Needed', M(250000))}</div></div>`;
    }
    H.refreshMarket(s);
    const owned = s.holdings;
    const oversight = H.oversightHours(s);
    const totalProfit = U.sum(owned, (h) => h.lastProfit);
    const nextRefresh = 8 - (s.week - s.flags.hmarketWeek);
    return `<div class="page-head"><div><h2>Acquisitions</h2><p>Buy companies in any industry. Profits flow to you as pass-through income. Each one needs a manager, or your time.</p></div></div>
    ${owned.length ? `<div class="card"><div class="grid g4">${ui.kpi('Companies owned', String(owned.length))}${ui.kpi('Portfolio value', M(H.totalValue(s), { short: true }))}${ui.kpi('Portfolio profit last week', ui.signed(totalProfit))}${ui.kpi('Your oversight', oversight + 'h/week', s.p.schedule.biz * G.life.productivity(s) < oversight ? '<span class="neg">More than your business hours</span>' : 'Taken from your business hours')}</div></div>
    <div class="stack">${owned.map((h) => holdingCard(s, h)).join('')}</div>` : ''}
    <div class="card"><div class="card-head"><h3>For sale</h3><span class="small muted">New listings in ${Math.max(1, nextRefresh)} week${nextRefresh === 1 ? '' : 's'}</span></div>
      <div class="stack">${s.hmarket.map((d) => dealCard(s, d)).join('')}</div>
      <p class="tiny faint" style="margin-top:10px">Listings show the seller's numbers. Due diligence (a quality-of-earnings review) tells you what is real. Bigger deals appear as your net worth grows.</p>
    </div>`;
  }

  function dealCard(s, d) {
    const t = G.BIZ[d.tid];
    const fin = G.hold.financing(s, d);
    const size = G.hold.SIZES.find((z) => z.id === d.size);
    const dd = d.dd;
    const sde = dd && dd.state === 'done' ? dd.trueSde : d.sde;
    const mult = d.price / Math.max(1, sde);
    const sameCat = s.biz && G.state.tpl(s) && G.state.tpl(s).cat === d.cat;
    return `<div class="card pad-s stack" style="gap:8px">
      <div class="row between"><div><b>${esc(d.name)}</b> <span class="muted small">${esc(t.name)} · ${esc(d.city)}, ${esc(d.state)} · ${d.years} years old</span></div><div class="row">${ui.pill(size.label, 'info')}${sameCat ? ui.pill('Synergy with your business', 'good') : ui.pill(G.CATEGORIES[d.cat])}</div></div>
      <div class="grid g4">${ui.kpi('Asking price', M(d.price, { short: true }))}${ui.kpi('Revenue', M(d.rev, { short: true }), 'per year')}${ui.kpi(dd && dd.state === 'done' ? 'Verified earnings' : 'Seller-reported earnings', M(sde, { short: true }), `${mult.toFixed(1)}× multiple`)}${ui.kpi('Growth', (d.growth * 100).toFixed(1) + '%', 'per year')}</div>
      <div class="small">${d.notes.map((n) => `<span class="muted">• ${esc(n)}</span>`).join('&nbsp; ')}</div>
      ${dd ? `<div class="alert ${dd.state === 'running' ? 'info' : d.truth < 0.85 ? 'bad' : 'good'} small">${dd.state === 'running' ? `Due diligence in progress: ${dd.left} week${dd.left === 1 ? '' : 's'} left.` : esc(dd.verdict)}</div>` : ''}
      <div class="row">${!dd ? ui.btn(`Due diligence · ${M(Math.round(Math.max(4000, d.price * 0.012) / 500) * 500)}`, 'ddDeal', d.id, 'btn-s') : ''}
        ${fin.map((f) => ui.btn(`${esc(f.label)} · ${M(f.down + d.price * 0.02, { short: true })} down`, 'buyDeal', d.id + ':' + f.id, f.id === 'cash' ? 'btn-s btn-go' : 'btn-s', s.p.cash < f.down + d.price * 0.02, f.note)).join('')}</div>
    </div>`;
  }

  function holdingCard(s, h) {
    const t = G.BIZ[h.tid];
    const hist = h.hist.slice(-52);
    const yr = U.sum(h.hist.slice(-52), (x) => x.profit) * 52 / Math.max(1, Math.min(52, h.hist.length));
    return `<div class="card stack"><div class="row between"><div><h3>${esc(h.name)}</h3><span class="muted small">${esc(t.name)} · ${esc(h.city)}, ${esc(h.state)} · owned ${(h.weeks / 52).toFixed(1)} years · paid ${M(h.cost, { short: true })}</span></div>${ui.pill('Health ' + Math.round(h.health), h.health > 65 ? 'good' : h.health > 45 ? 'warn' : 'bad')}</div>
      <div class="grid g4">${ui.kpi('Revenue run-rate', M(h.rev, { short: true }))}${ui.kpi('Profit, annualized', ui.signed(yr, { short: true }))}${ui.kpi('Value', M(G.hold.value(s, h), { short: true }))}${ui.kpi('Growth', (h.growth * 100).toFixed(1) + '%')}</div>
      ${hist.length > 3 ? ui.chart('h_' + h.id, [{ name: 'Profit', values: hist.map((x) => x.profit), color: 'var(--road)', area: true }], hist.map((x) => x.w), { h: 90 }) : ''}
      <div class="field"><span class="label">Who runs it</span><div class="seg">${Object.entries(G.hold.GMS).map(([k, g]) => `<button data-act="setGm" data-a="${h.id}:${k}" aria-pressed="${h.gm === k}">${esc(g.label)}${g.cost ? ` · ${M(g.cost / 1000)}k/yr` : ''}</button>`).join('')}</div><span class="tiny faint">${G.hold.GMS[h.gm].hours} hours a week of your oversight. Better managers raise health over time.</span></div>
      <div class="row">${ui.btn(`Reinvest 5% · ${M(Math.round(h.rev * 0.05 / 1000) * 1000, { short: true })}`, 'investHold', h.id, 'btn-s')}${ui.btn('Sell', 'sellHold', h.id, 'btn-s btn-danger')}</div></div>`;
  }

  // ---------- Giving ----------
  function giving(s) {
    const Gv = G.give;
    Gv.ensure(s);
    const ph = s.phil, f = ph.foundation;
    const sel = v().cause || 'food';
    const amt = v().giveAmt || 500;
    const sum = Gv.summary(s);
    const ret = G.finance.computeReturn(s, s.p.ytd);
    return `<div class="page-head"><div><h2>Giving</h2><p>Give back to the people and places that got you here. Gifts are tax-deductible, build your standing in the community, and count toward your legacy.</p></div></div>
    <div class="card"><div class="grid g4">${ui.kpi('Given so far', M(ph.given))}${ui.kpi('Community standing', Math.round(ph.standing) + '/100')}${ui.kpi(`Deducted in ${U.yearOf(s.week)}`, M(s.p.ytd.donations), ret.itemized ? 'You are itemizing' : 'Standard deduction + $1k')}${f ? ui.kpi('Foundation endowment', M(f.endowment, { short: true })) : ui.kpi('Named gifts', String(ph.named.length))}</div>
      ${ph.named.length ? `<p class="small" style="margin-top:10px">Your name is on: ${ph.named.map(esc).join(', ')}.</p>` : ''}</div>
    <div class="card stack"><h3>Make a gift</h3>
      <div class="grid g3">${Gv.CAUSES.map((c) => `<button class="tile" data-act="cause" data-a="${c.id}" aria-pressed="${sel === c.id}"><b>${esc(c.name)}</b><span class="small">${esc(c.blurb)}</span>${ph.causes[c.id] ? `<span class="tiny" style="color:var(--road)">${esc(Gv.impactText(c, ph.causes[c.id]))} so far</span>` : ''}</button>`).join('')}</div>
      <div class="row"><input id="give-amt" class="input num" style="max-width:160px" type="number" min="1" step="100" value="${amt}" data-in="giveAmt">
        ${[100, 1000, 10000, 100000, 1000000].filter((x) => x <= Math.max(1000, s.p.cash)).map((x) => ui.btn(M(x, { short: true }), 'giveQuick', String(x), 'btn-s')).join('')}
        ${ui.btn('Give', 'give', '', 'btn-go')}</div>
      <p class="small muted">${esc(Gv.byId[sel].name)}: ${M(amt)} is about <b>${esc(Gv.impactText(Gv.byId[sel], amt))}</b>.${amt >= 1e6 ? ' Gifts of $1M or more come with naming rights.' : ''}</p>
    </div>
    <div class="card stack"><h3>${f ? esc(f.name) : 'Start a private foundation'}</h3>
      ${f ? `<div class="grid g4">${ui.kpi('Endowment', M(f.endowment))}${ui.kpi('Granted so far', M(f.granted))}${ui.kpi('You put in', M(f.contributed))}${ui.kpi('Focus', esc(Gv.byId[f.cause].name))}</div>
        <p class="small muted">The endowment is invested and must pay out at least 5% a year. It keeps giving after you are gone.</p>
        <div class="row">${ui.btn('Add $100k', 'fundF', '100000', 'btn-s', s.p.cash < 100000)}${ui.btn('Add $1M', 'fundF', '1000000', 'btn-s', s.p.cash < 1e6)}<select id="f-cause" class="input" style="max-width:260px" data-ch="fCause">${Gv.CAUSES.map((c) => `<option value="${c.id}" ${f.cause === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>`
      : `<p class="muted small">A foundation turns a lump of money into giving that lasts. You get the tax deduction now; the foundation invests the money and grants at least 5% a year. Minimum ${M(Gv.FOUNDATION_MIN)}, plus about $15k in legal costs.</p>
        <div class="row"><input id="f-name" class="input" style="max-width:280px" placeholder="The ${esc(s.p.name.split(' ').slice(-1)[0])} Family Foundation" value="${esc(v().fName || '')}" data-in="fName" maxlength="60">${ui.btn(`Endow with ${M(Gv.FOUNDATION_MIN)} for ${esc(Gv.byId[sel].name.toLowerCase())}`, 'makeF', String(Gv.FOUNDATION_MIN), 'btn-go btn-s', s.p.cash < Gv.FOUNDATION_MIN + 15000)}${ui.btn('Endow with $1M', 'makeF', '1000000', 'btn-s', s.p.cash < 1015000)}</div>`}
    </div>
    ${sum.length ? `<div class="card"><h3>Your impact</h3><table class="ledger" style="margin-top:8px">${sum.map((x) => `<tr><td>${esc(x.c.name)}</td><td>${esc(x.text)}</td><td class="r">${M(x.dollars)}</td></tr>`).join('')}</table></div>` : ''}`;
  }

  // ---------- Career ----------
  function career(s) {
    const p = s.p;
    const board = s.jobBoard.map((id) => G.jobs.byId[id]).filter(Boolean);
    const applied = (id) => s.pending.some((a) => a.kind === 'job' && a.id === id);
    const course = p.course ? G.COURSES.find((c) => c.id === p.course.id) : null;
    return `<div class="page-head"><div><h2>Career & learning</h2><p>A day job is runway. Courses and credentials unlock businesses and make you better at running them.</p></div></div>
    <div class="card stack">${p.job ? `<div class="row between"><div><h3>${esc(p.job.title)}</h3><span class="muted small">${M(p.job.wage, { cents: true })}/hr${p.job.tips ? ' + tips' : ''} · ${p.job.flex ? 'flexible hours' : p.job.hours + ' hrs/week'} · ${Math.floor(p.job.weeks / 52)}y ${p.job.weeks % 52}w</span></div>${ui.btn('Quit', 'quitJob', '', 'btn-danger btn-s')}</div>
      ${!p.job.flex ? ui.meter('Performance', p.job.perf) : ''}
      ${!p.job.flex && G.JOBS.find((j) => j.id === p.job.id).hours >= 30 ? `<div class="row small"><span class="muted">Ask to change hours:</span>${[20, 30, G.JOBS.find((j) => j.id === p.job.id).hours].filter((x, i, a) => a.indexOf(x) === i).map((h) => ui.btn(h + 'h', 'jobHours', String(h), 'btn-s', p.job.hours === h)).join('')}<span class="tiny faint">Under 30 hours usually loses benefits.</span></div>` : ''}`
      : `<h3>No day job</h3><p class="muted small">${p.unemployedWeeks > 8 ? `${p.unemployedWeeks} weeks without a paycheck.` : 'Living off savings or the business.'}</p>`}</div>
    <div class="card"><div class="card-head"><h3>Job board</h3><span class="small muted">Refreshes monthly</span></div>
      ${board.map((j) => { const ok = G.jobs.qualifies(p, j); const w = G.jobs.wageFor(j, p, s.loc); return `<div class="staff-row"><div class="grow"><b>${esc(j.title)}</b> <span class="small muted">${M(w, { cents: true })}/hr${j.tips ? ' + tips' : ''} · ${j.flex ? 'flexible' : j.hours + 'h'}${j.benefits ? ' · benefits' : ''}${j.xp ? ' · ' + esc(G.INDUSTRIES[j.xp]) : ''}</span></div>${p.job && p.job.id === j.id ? ui.pill('Current') : applied(j.id) ? ui.pill('Applied', 'info') : ui.btn(j.flex ? 'Sign up' : 'Apply', 'applyJob', j.id, 'btn-s', !ok, ok ? '' : 'You do not meet the requirements')}</div>`; }).join('')}
    </div>
    <div class="card stack"><div class="card-head" style="margin:0"><h3>Courses</h3>${course ? `<span class="small">Enrolled: <b>${esc(course.name)}</b>, ${p.course.left} weeks left</span>` : ''}</div>
      ${G.COURSES.map((c) => { const ok = !c.req || Object.entries(c.req).every(([k, val]) => p.skills[k] >= val); const owned = c.creds && c.creds.every((cr) => p.creds.includes(cr)); return `<div class="staff-row"><div class="grow"><b>${esc(c.name)}</b> <span class="small muted">${M(c.cost)} · ${c.weeks} weeks · ${c.hours}h/week</span><div class="tiny faint">${[Object.entries(c.skills || {}).map(([k, x]) => `+${x} ${G.SKILLS[k].label}`).join(', '), c.creds ? G.CREDS[c.creds[0]] : '', c.network ? `+${c.network} network` : ''].filter(Boolean).join(' · ')}</div></div>${owned ? ui.pill('Have it', 'good') : ui.btn('Enroll', 'enroll', c.id, 'btn-s', !!p.course || !ok || p.cash < c.cost, !ok ? 'Need more skill first' : '')}</div>`; }).join('')}
      ${G.BACKGROUNDS.find((x) => x.id === p.bg).veteran ? '<p class="tiny" style="color:var(--road)">GI Bill: the VA covers 60% of course costs for you.</p>' : ''}
    </div>
    <div class="grid g2" style="align-items:start">
      <div class="card stack"><h3>Skills</h3>${Object.entries(G.SKILLS).map(([k, x]) => ui.meter(x.label, p.skills[k])).join('')}${ui.meter('Network', p.network)}</div>
      <div class="card stack"><h3>Industry experience</h3>${Object.entries(G.INDUSTRIES).filter(([k]) => p.xp[k] > 0.5).map(([k, x]) => ui.meter(x, p.xp[k])).join('') || '<p class="muted small">None yet. Jobs and businesses build it.</p>'}
        <h4>Credentials</h4><div class="row">${p.creds.length ? p.creds.map((c) => ui.pill(G.CREDS[c], 'good')).join('') : '<span class="muted small">None</span>'}</div></div>
    </div>`;
  }

  // ---------- Life ----------
  function life(s) {
    const p = s.p, L = s.loc;
    const ins = G.life.insuranceOptions(s);
    const housing = [['family', 'Live with family', 'Contribute $300/mo. Cheapest by far.'], ['roommates', 'Roommates', `About ${M(L.rent * 0.62)}/mo`], ['apartment', 'Own apartment', `About ${M(L.rent)}/mo`], ['house', 'Rent a house', `About ${M(L.rent * 1.75)}/mo`]];
    const tr = [['car', 'Car', 'Insurance, gas, maintenance'], ['transit', 'Transit', ['large', 'metro'].includes(L.size) ? 'Monthly pass' : 'Spotty here; rideshares add up'], ['bike', 'Bike & walk', 'Cheap; slow commutes']];
    return `<div class="page-head"><div><h2>Life</h2><p>Cut your cost of living and every dollar goes further. Push it too far and stress and your relationships pay for it.</p></div></div>
    <div class="card stack"><h3>Housing</h3><div class="grid g4">${housing.map(([k, n, d]) => `<button class="tile" data-act="housing" data-a="${k}" aria-pressed="${p.housing === k}"><b>${n}</b><span class="small">${d}</span></button>`).join('')}</div><p class="tiny faint">Moving costs about $1,500.</p></div>
    <div class="grid g2" style="align-items:start">
      <div class="card stack"><h3>Getting around</h3><div class="grid g3">${tr.map(([k, n, d]) => `<button class="tile" data-act="transport" data-a="${k}" aria-pressed="${p.transport === k}" ${k === 'car' && p.transport !== 'car' ? '' : ''}><b>${n}</b><span class="small">${esc(d)}</span></button>`).join('')}</div>${p.transport !== 'car' ? '<p class="tiny faint">Buying a used car costs about $9,000.</p>' : ''}</div>
      <div class="card stack"><h3>Lifestyle</h3><div class="seg">${['frugal', 'modest', 'comfortable', 'lavish'].map((k) => `<button data-act="lifestyle" data-a="${k}" aria-pressed="${p.lifestyle === k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div><p class="small muted">Frugal saves money but wears on you. Comfortable keeps you happier.</p></div>
    </div>
    <div class="card stack"><h3>Health insurance</h3><div class="grid g4">${ins.map((o) => `<button class="tile" data-act="insurance" data-a="${o.id}" aria-pressed="${p.insurance === o.id}" ${o.disabled ? 'disabled' : ''}><b>${esc(o.name)}</b><span class="small">${esc(o.note)}</span></button>`).join('')}</div>
      <p class="small muted">Your premium: <b class="num">${M(G.life.healthPremium(s))}</b>/month.</p></div>
    <div class="grid g2" style="align-items:start">
      <div class="card stack"><h3>Wellbeing</h3>${ui.meter('Health', p.health)}${ui.meter('Stress', p.stress, true)}${ui.meter('Happiness', p.happiness)}
        <div class="row">${ui.btn('Weekend away · $600', 'vacation', 'short', 'btn-s', p.cash < 600)}${ui.btn('Real vacation · $2,500', 'vacation', 'long', 'btn-s', p.cash < 2500)}${ui.btn('Therapy · $180', 'vacation', 'therapy', 'btn-s', p.cash < 180)}</div></div>
      <div class="card stack"><h3>Family</h3>
        <p>${p.rel.status === 'single' ? 'Single.' : `${p.rel.status === 'married' ? 'Married to' : 'Seeing'} <b>${esc(p.rel.partner)}</b>.`} ${p.kids ? `${p.kids} kid${p.kids > 1 ? 's' : ''}.` : ''}</p>
        ${p.rel.status !== 'single' ? ui.meter('Relationship', p.rel.patience) : ''}
        <p class="tiny faint">Family time on your Week plan keeps relationships healthy.</p></div>
    </div>
    <div class="card stack"><h3>End this story</h3><p class="small muted">Retire and see how your life scored against your reason: ${esc(G.WHYS.find((w) => w.id === p.why).name.toLowerCase())}.</p><div>${ui.btn('Retire and see my legacy', 'retire', '', 'btn-danger btn-s')}</div></div>`;
  }

  // ---------- City ----------
  function city(s) {
    const L = s.loc, st = G.loc.state(L.state), e = s.econ, b = s.biz, t = tpl();
    return `<div class="page-head"><div class="row">${ui.shield(st.ab, 44)}<div><h2>${esc(L.city)}, ${esc(st.name)}</h2><p>${esc(G.CITY_SIZES.find((z) => z.id === L.size).label)} · ${L.pop >= 1000 ? (L.pop / 1000).toFixed(1) + ' million' : U.num(L.pop) + ',000'} people · ${L.tags.map(esc).join(', ')}</p></div></div></div>
    <div class="card"><div class="facts">
      <div class="fact"><span class="label">Cost of living</span><b>${L.col}</b></div>
      <div class="fact"><span class="label">1BR rent</span><b>${M(L.rent)}</b></div>
      <div class="fact"><span class="label">Retail space</span><b>${M(G.loc.commercialRent(L, 'retail'), { cents: true })}/sf/yr</b></div>
      <div class="fact"><span class="label">Minimum wage</span><b>${M(st.mw, { cents: true })}</b></div>
      <div class="fact"><span class="label">State income tax</span><b>${st.tax[1] === 0 ? 'None' : st.tax[0] + '–' + st.tax[1] + '%'}</b></div>
      <div class="fact"><span class="label">Sales tax</span><b>${st.st ? st.st + '%' : 'None'}</b></div>
      <div class="fact"><span class="label">LLC fee</span><b>${M(st.llc)}${st.ann ? ' + ' + M(st.ann) + '/yr' : ''}</b></div>
      <div class="fact"><span class="label">Growing season</span><b class="small" style="font-family:var(--font-ui)">${G.biz.climateMonths(s).map((m) => U.MON3[m]).join(' ')}</b></div>
    </div><p class="small muted" style="margin-top:10px">Natural hazards: ${st.haz.map((h) => `${G.HAZARDS[h].label} (${G.HAZARDS[h].months.length === 12 ? 'any time' : G.HAZARDS[h].months.map((m) => U.MON3[m]).join(', ')})`).join('; ')}.</p></div>
    <div class="card stack"><div class="card-head" style="margin:0"><h3>The economy</h3>${ui.pill(G.econ.label(s), { expansion: 'good', slowdown: 'warn', recession: 'bad', recovery: 'info' }[e.phase])}</div>
      <div class="grid g4">${ui.kpi('Fed funds rate', e.rate.toFixed(2) + '%')}${ui.kpi('Prime rate', (e.rate + 3).toFixed(2) + '%', 'Business loans price off this')}${ui.kpi('Inflation', e.infl.toFixed(1) + '%')}${ui.kpi('Consumer demand', Math.round(e.mult * 100) + '%')}${ui.kpi('Consumer confidence', String(e.confidence))}${ui.kpi('Home prices', Math.round(e.housing * 100) + '%', 'Index, start = 100')}${ui.kpi('Freight rates', Math.round(e.freight * 100) + '%')}</div>
      ${e.last ? `<p class="small muted">${esc(e.last)}</p>` : ''}</div>
    ${b && b.phase !== 'closed' && t ? `<div class="card stack"><h3>Your market</h3>${t.online ? `<p class="small">You sell nationwide against roughly ${U.num(b.comps)} competitors. Awareness and ads matter more than location.</p>` : b.researched ? `<p class="small">${U.num(b.comps)} competitors in your area. The one to watch: <b>${esc(b.rival)}</b>.</p>` : `<p class="small muted">You have not done market research yet, so you only have a rough sense of the competition (somewhere around ${U.num(Math.round(b.comps * (0.6 + Math.random() * 0.8)))}).</p>`}
      <p class="small muted">Local boosts for this business: ${Object.entries(t.boosts).filter(([k]) => L.tags.includes(k)).map(([k, x]) => `${k} ×${x}`).join(', ') || 'none here'}.</p></div>` : ''}`;
  }

  // ---------- Journal ----------
  function journal(s) {
    const f = v().jf || 'all';
    const items = s.journal.filter((j) => f === 'all' || j.k === f).slice().reverse();
    return `<div class="page-head"><div><h2>Journal</h2><p>The story so far, written as it happens.</p></div></div>
    <div class="row">${[['all', 'Everything'], ['life', 'Life'], ['biz', 'Business'], ['money', 'Money'], ['career', 'Career'], ['econ', 'Economy']].map(([k, n]) => `<button class="chip" data-act="jf" data-a="${k}" aria-pressed="${f === k}">${n}</button>`).join('')}</div>
    <div class="card"><div class="log">${items.slice(0, 200).map(logItem).join('') || '<p class="muted">Nothing yet.</p>'}</div></div>`;
  }

  // ---------- Legacy ----------
  function legacyPage(s) {
    const L = G.sim.legacy(s);
    const p = s.p;
    const why = G.WHYS.find((w) => w.id === p.why);
    return `<div class="sign title-sign stack" style="gap:6px"><span class="exit">END OF THE ROAD</span><h1 style="font-size:clamp(2rem,6vw,3.4rem)">${esc(p.name)}</h1><p>${esc(L.title)} · ${L.years.toFixed(1)} years in ${esc(s.loc.city)}</p></div>
    <div class="card"><div class="grid g4">${ui.kpi('Legacy score', U.num(L.score))}${ui.kpi('Net worth', M(L.nw, { short: true }))}${ui.kpi('Jobs created', U.num(s.stats.jobsCreated))}${ui.kpi('Customers served', U.num(s.stats.customers))}${ui.kpi('Lifetime revenue', M(s.stats.revenue, { short: true }))}${ui.kpi('Businesses', U.num(L.all.length))}${ui.kpi('Happiness', Math.round(p.happiness) + '/100')}${ui.kpi(why.name + ' score', U.num(Math.round(L.scores[p.why])))}</div></div>
    <div class="card"><h3>The story</h3><div class="log" style="margin-top:8px">${s.journal.filter((j) => j.k === 'biz' || j.k === 'life').slice(-14).map(logItem).join('')}</div></div>
    <div class="row">${ui.btn('Add to hall of fame & start over', 'hallOfFame', '', 'btn-go btn-big')}${s.ended && !s.flags.retired ? '' : ui.btn('Keep playing', 'unretire', '', 'btn-big')}</div>`;
  }

  // ---------- Modals ----------
  function modal() {
    const s = S();
    if (!s) return '';
    if (ui.modal) return ui.modal.html();
    const res = v().eventResult;
    if (res) {
      return `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="ev-t"><div class="modal-top"><div class="event-sign"><div class="event-diamond ${res.kind === 'biz' ? 'biz' : res.kind === 'money' ? 'money' : ''}"><span>!</span></div><h3 id="ev-t">${esc(res.title)}</h3></div></div>
        <div class="modal-body"><div class="result">${esc(res.text || 'Done.')}</div></div>
        <div class="modal-foot"><button class="btn btn-go" data-act="evContinue" autofocus>Continue</button></div></div></div>`;
    }
    const ev = s.event;
    if (!ev) return '';
    return `<div class="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="ev-t"><div class="modal-top"><div class="event-sign"><div class="event-diamond ${ev.kind === 'biz' ? 'biz' : ev.kind === 'money' ? 'money' : ''}"><span>${ev.kind === 'money' ? '$' : '!'}</span></div><div><span class="label">${esc(U.fmtDate(s.week))}</span><h3 id="ev-t">${esc(ev.title)}</h3></div></div></div>
      <div class="modal-body"><p class="event-text">${esc(ev.text)}</p>
        <div class="stack-s">${ev.choices.map((c, i) => `<button class="btn choice" data-act="evChoose" data-a="${i}" ${c.disabled ? 'disabled' : ''}><span>${esc(c.label)}</span>${c.hint ? `<span class="hint">${esc(c.hint)}</span>` : ''}</button>`).join('')}</div></div></div></div>`;
  }

  // ---------- Actions ----------
  function after() { ui.save(); }
  ui.on('tab', (el, a) => { ui.tab = a; v().picking = false; if (a === 'deals' && G.hold.unlocked(S())) S().flags.sawDeals = true; window.scrollTo(0, 0); });
  ui.on('jf', (el, a) => { v().jf = a; });
  ui.on('nextWeek', () => {
    const s = S();
    const r = G.sim.advance(s);
    if (!r) { ui.toast(G.sim.canAdvance(s).why); return; }
    after();
  });
  ui.on('skip4', () => {
    const s = S();
    for (let i = 0; i < 4; i++) {
      if (!G.sim.canAdvance(s).ok) break;
      G.sim.advance(s);
      if (s.event) break;
    }
    after();
  });
  ui.on('evChoose', (el, a) => {
    const s = S();
    const ev = s.event;
    const text = G.events.choose(s, +a);
    v().eventResult = { title: ev.title, kind: ev.kind, text };
    after();
  });
  ui.on('evContinue', () => { v().eventResult = null; G.events.next(S()); after(); });
  ui.on('sched', (el, a) => {
    const s = S();
    s.p.schedule[a] = +el.value;
    const lab = document.getElementById('slv-' + a);
    if (lab) lab.textContent = el.value + 'h';
    if (!ui._schedT) ui._schedT = setTimeout(() => { ui._schedT = null; ui.render(); }, 250);
    return false;
  });
  ui.on('pickIdea', (el, a) => { v().picking = a === '1'; });
  ui.on('pickCat', (el, a) => { v().pickCat = a; });
  ui.on('setIdea', (el, a) => {
    const s = S();
    if (a === 'custom') { s.customTpl = G.biz.buildCustom(v().cf); s.ideaId = null; } else { s.ideaId = a; s.customTpl = null; }
    v().picking = false;
    G.journal.add(s, 'biz', `A new idea takes hold: ${a === 'custom' ? s.customTpl.name : G.BIZ[a].name.toLowerCase()}.`);
    after();
  });
  ui.on('gcf', (el, a) => { v().cf[a] = el.value; return el.tagName === 'SELECT' ? undefined : false; });
  ui.on('gcfNum', (el, a) => { v().cf[a] = a === 'margin' ? U.clamp(+el.value, 10, 97) / 100 : Math.max(1, +el.value); return false; });
  ui.on('gcfModel', (el, a) => { v().cf.model = a; const m = G.MODELS.find((x) => x.id === a); v().cf.price = m.base.sub ? m.base.sub.price : m.base.price || 100; });
  ui.on('gcfSkill', (el, a) => { const f = v().cf; if (f.skills.includes(a)) f.skills = f.skills.filter((x) => x !== a); else if (f.skills.length < 3) f.skills.push(a); });
  ui.on('bizName', (el) => { v().bizName = el.value; return false; });
  ui.on('createBiz', () => { G.biz.create(S(), (v().bizName || '').trim() || null); after(); });
  ui.on('abandonBiz', () => {
    ui.openModal({ html: () => confirmBox('Abandon this business?', 'Money already spent is gone. Any lease or loans stay with you or the business.', 'abandonYes') });
    return false;
  });
  ui.on('abandonYes', () => { ui.modal = null; G.biz.close(S()); after(); });
  ui.on('xferAmt', (el) => { v().xfer = +el.value; return false; });
  ui.on('xfer', (el, a) => {
    const s = S(), b = s.biz;
    const amt = Math.round(v().xfer || 0);
    if (!b || amt <= 0) { ui.toast('Enter an amount first.'); return; }
    if (a === 'in') {
      if (s.p.cash < amt) { ui.toast('You do not have that much in your personal account.'); return; }
      s.p.cash -= amt; b.cash += amt;
      ui.toast(`Moved ${M(amt)} into ${b.name}.`);
    } else {
      if (b.cash < amt) { ui.toast('The business does not have that much.'); return; }
      b.cash -= amt; s.p.cash += amt;
      if (b.entity === 'scorp' || b.entity === 'ccorp') { s.p.ytd.corpSalary += amt; s.p.ytd.withheld += G.finance.withholding(s, amt) - amt * 0.0765; s.p.cash -= G.finance.withholding(s, amt); }
      ui.toast(`Paid yourself ${M(amt)}.`);
    }
    v().xfer = 0;
    after();
  });
  ui.on('startTask', (el, a) => {
    const s = S();
    const [id, opt] = a.split(':');
    const err = G.biz.startTask(s, id, opt);
    if (err) ui.toast(err);
    after();
  });
  ui.on('launch', (el, a) => { G.biz.launch(S(), +a); ui.toast('You are open for business.'); after(); });
  ui.on('hire', (el, a) => { const [id, h] = a.split(':'); const msg = G.biz.hire(S(), id, +h); if (msg) ui.toast(msg); after(); });
  ui.on('fire', (el, a) => { G.biz.fire(S(), a); after(); });
  ui.on('raise', (el, a) => { G.biz.giveRaise(S(), a); after(); });
  ui.on('opsPrice', (el) => {
    const x = +el.value; document.getElementById('pv').textContent = x + '%';
    const base = +el.dataset.base; const p2 = document.getElementById('pv2'); if (p2 && base) p2.textContent = `(${M(base * x / 100, { cents: base * x / 100 < 100 })})`;
    return false;
  });
  ui.on('opsPriceC', (el) => { S().biz.price = +el.value / 100; after(); });
  ui.on('opsMkt', (el) => { document.getElementById('mv').textContent = M(+el.value); return false; });
  ui.on('opsMktC', (el) => { S().biz.mkt.budget = +el.value; after(); });
  ui.on('opsFocus', (el) => { const x = +el.value; document.getElementById('fv').textContent = `${100 - x}% product · ${x}% selling`; return false; });
  ui.on('opsFocusC', (el) => { S().biz.focus = +el.value / 100; after(); });
  ui.on('tier', (el, a) => { S().biz.tier = +a; after(); });
  ui.on('channel', (el, a) => { S().biz.mkt.channel = a; after(); });
  ui.on('channelCrop', (el, a) => { S().biz.crop.channel = a; after(); });
  ui.on('addUnits', (el, a) => { const e = G.biz.addUnits(S(), +a); if (e) ui.toast(e); after(); });
  ui.on('fundMs', () => { const e = G.biz.fundMilestone(S()); if (e) ui.toast(e); after(); });
  ui.on('ptype', (el) => { v().ptype = el.value; });
  ui.on('ptitle', (el) => { v().ptitle = el.value; return false; });
  ui.on('startProject', (el, a) => {
    const s = S(), t = tpl();
    const id = v().ptype || t.projects[0].id;
    const e = G.biz.startProject(s, id, (v().ptitle || '').trim() || null, a === '1');
    if (e) ui.toast(e); else { v().ptitle = ''; ui.toast('Project started.'); }
    after();
  });
  ui.on('drawIn', (el) => { document.getElementById('dv').textContent = M(+el.value); return false; });
  ui.on('drawC', (el) => { S().biz.draw = +el.value; after(); });
  ui.on('ins', (el, a) => { S().biz.ins[a] = el.checked; after(); });
  ui.on('bookkeeper', (el) => { S().biz.bookkeeper = el.checked; after(); });
  ui.on('scorp', () => { const b = S().biz; b.entity = 'scorp'; G.journal.add(S(), 'money', `${b.name} elects S-corp tax status. You will pay yourself a salary through payroll.`); after(); });
  ui.on('toLlc', () => {
    const s = S(), b = s.biz, fee = G.loc.state(s.loc.state).llc;
    if (b.cash < fee) { ui.toast(`You need ${M(fee)} in the business account.`); return; }
    b.cash -= fee; b.entity = 'llc'; G.journal.add(s, 'biz', `${b.name} becomes an LLC. Your house is no longer on the line if a customer sues.`); after();
  });
  ui.on('listSale', () => { ui.toast(G.biz.listForSale(S())); after(); });
  ui.on('closeBiz', () => { ui.openModal({ html: () => confirmBox(`Close ${S().biz.name}?`, 'This cannot be undone. Equipment is liquidated, the lease is broken, and personally guaranteed debts become yours.', 'closeYes') }); return false; });
  ui.on('closeYes', () => { ui.modal = null; G.biz.close(S()); after(); });
  ui.on('payCard', (el, a) => { const p = S().p; const amt = a === 'all' ? Math.min(p.cash, p.ccBal) : Math.min(+a, p.ccBal, p.cash); p.cash -= amt; p.ccBal -= amt; after(); });
  ui.on('payoff', (el, a) => {
    const s = S(), p = s.p, d = p.debts.find((x) => x.id === a);
    if (!d) return;
    const src = d.acct === 'b' ? s.biz : p;
    if (!src || src.cash < d.bal) { ui.toast('Not enough cash.'); return; }
    src.cash -= d.bal; d.bal = 0; p.debts = p.debts.filter((x) => x.bal > 0.5);
    G.journal.add(s, 'money', `Paid off: ${d.name}.`);
    after();
  });
  ui.on('estimates', (el) => { S().p.estimates = el.checked; after(); });
  ui.on('amtIn', (el, a) => { v()['amt_' + a] = +el.value; return false; });
  ui.on('applyFin', (el, a) => { const amt = v()['amt_' + a]; ui.toast(G.finance.apply(S(), a, amt)); after(); });
  ui.on('saveSlot', (el, a) => { G.state.save(S(), a); ui.toast('Saved.'); });
  ui.on('exportSave', () => {
    const txt = JSON.stringify(S());
    const done = () => ui.toast('Save copied. Keep it somewhere safe; paste it into Import on the title screen.');
    try { navigator.clipboard.writeText(txt).then(done, () => showExport(txt)); } catch (e) { showExport(txt); }
    return false;
  });
  function showExport(txt) {
    ui.openModal({ html: () => `<div class="overlay"><div class="modal"><div class="modal-top"><h3>Your save</h3><p class="small muted">Select all and copy this text.</p></div><div class="modal-body"><textarea class="input" rows="8" readonly onfocus="this.select()">${esc(txt)}</textarea></div><div class="modal-foot"><button class="btn" data-act="closeModal">Close</button></div></div></div>` });
  }
  ui.on('saveMenu', () => { ui.tab = 'money'; setTimeout(() => { const el = document.querySelector('[data-act="saveSlot"]'); if (el) el.scrollIntoView({ block: 'center' }); }, 30); });
  ui.on('themeToggle', () => {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('mainstreet_theme', r.dataset.theme); } catch (e) { /* ignore */ }
    return false;
  });
  ui.on('quitJob', () => { ui.openModal({ html: () => confirmBox('Quit your job?', S().p.insurance === 'employer' ? 'Your paycheck and your employer health plan both stop.' : 'Your paycheck stops.', 'quitYes') }); return false; });
  ui.on('quitYes', () => { ui.modal = null; G.life.quitJob(S()); after(); });
  ui.on('jobHours', (el, a) => {
    const p = S().p;
    if (Math.random() < 0.6 + p.job.perf / 300) { p.job.hours = +a; if (+a < 30 && p.insurance === 'employer') { p.insurance = 'none'; ui.toast('Approved. You lose your employer health plan below 30 hours.'); } else ui.toast('Approved.'); }
    else { p.job.perf -= 5; ui.toast('Your manager says no.'); }
    after();
  });
  ui.on('applyJob', (el, a) => { ui.toast(G.life.applyJob(S(), a)); after(); });
  ui.on('enroll', (el, a) => {
    const p = S().p, c = G.COURSES.find((x) => x.id === a);
    const cost = G.BACKGROUNDS.find((x) => x.id === p.bg).veteran ? c.cost * 0.4 : c.cost;
    if (p.cash < cost) { ui.toast('Not enough cash.'); return; }
    p.cash -= cost; p.course = { id: a, left: c.weeks };
    G.journal.add(S(), 'life', `You enroll in ${c.name}.`);
    after();
  });
  ui.on('housing', (el, a) => { const p = S().p; if (p.housing === a) return; if (a === 'family' && p.rel.status === 'married') { ui.toast('Moving back in with your parents, married? Not happening.'); return; } p.cash -= 1500; p.housing = a; G.journal.add(S(), 'life', `You move: ${{ family: 'back in with family', roommates: 'into a place with roommates', apartment: 'into your own apartment', house: 'into a rented house' }[a]}.`); after(); });
  ui.on('transport', (el, a) => {
    const p = S().p; if (p.transport === a) return;
    if (a === 'car') { if (p.cash < 9000) { ui.toast('A decent used car costs about $9,000.'); return; } p.cash -= 9000; }
    if (p.transport === 'car') p.cash += 5000;
    p.transport = a;
    if (a !== 'car' && p.job && p.job.id === 'gig') G.life.quitJob(S(), 'No car, no gig driving.');
    after();
  });
  ui.on('lifestyle', (el, a) => { S().p.lifestyle = a; after(); });
  ui.on('insurance', (el, a) => { S().p.insurance = a; after(); });
  ui.on('vacation', (el, a) => {
    const p = S().p;
    const o = { short: [600, 12, 4, 'A weekend away. You sleep in and remember what sunlight feels like.'], long: [2500, 30, 10, 'A real vacation. You check email only twice. Okay, five times.'], therapy: [180, 8, 3, 'A therapy session. Not magic, but it helps.'] }[a];
    p.cash -= o[0]; p.stress = Math.max(0, p.stress - o[1]); p.happiness = Math.min(100, p.happiness + o[2]);
    if (p.rel.status !== 'single' && a !== 'therapy') p.rel.patience = Math.min(100, p.rel.patience + o[2]);
    G.journal.add(S(), 'life', o[3]);
    after();
  });
  ui.on('retire', () => { ui.openModal({ html: () => confirmBox('Retire?', 'This ends the story and shows your legacy. You can keep playing afterwards if you change your mind.', 'retireYes') }); return false; });
  ui.on('retireYes', () => { ui.modal = null; const s = S(); s.ended = true; s.flags.retired = true; G.journal.add(s, 'life', `${s.p.name} retires at ${G.state.age(s)}.`); after(); });
  ui.on('unretire', () => { const s = S(); s.ended = false; s.flags.retired = false; after(); });
  ui.on('hallOfFame', () => {
    const s = S(), L = G.sim.legacy(s);
    G.state.addToHall({ name: s.p.name, city: `${s.loc.city}, ${s.loc.state}`, title: L.title, score: L.score, nw: Math.round(L.nw), at: Date.now() });
    G.state.remove('auto');
    ui.s = null;
    ui.go('title');
    return false;
  });

  ui.on('ddDeal', (el, a) => { ui.toast(G.hold.diligence(S(), a)); after(); });
  ui.on('buyDeal', (el, a) => {
    const [id, how] = a.split(':');
    const d = S().hmarket.find((x) => x.id === id);
    if (!d) return;
    const f = G.hold.financing(S(), d).find((x) => x.id === how);
    ui.openModal({ html: () => confirmBox(`Buy ${d.name}?`, `${M(d.price)} total. ${f.note} You pay ${M(f.down + d.price * 0.02)} today including about 2% closing costs.${d.dd ? '' : ' You have not done due diligence.'}`, 'buyYes', id + ':' + how) });
    return false;
  });
  ui.on('buyYes', (el, a) => { ui.modal = null; const [id, how] = a.split(':'); const e = G.hold.buy(S(), id, how); ui.toast(e || 'Deal closed. It is yours.'); if (!e) G.events.next(S()); after(); });
  ui.on('setGm', (el, a) => { const [id, lv] = a.split(':'); const e = G.hold.setGm(S(), id, lv); if (e) ui.toast(e); after(); });
  ui.on('investHold', (el, a) => { const e = G.hold.invest(S(), a); if (e) ui.toast(e); after(); });
  ui.on('sellHold', (el, a) => { const h = S().holdings.find((x) => x.id === a); ui.openModal({ html: () => confirmBox(`Sell ${h.name}?`, `It is worth about ${M(G.hold.value(S(), h))} right now. Brokers and bankers take their cut, and gains are taxed in April.`, 'sellHoldYes', a) }); return false; });
  ui.on('sellHoldYes', (el, a) => { ui.modal = null; ui.toast(G.hold.sell(S(), a)); after(); });
  ui.on('cause', (el, a) => { v().cause = a; });
  ui.on('giveAmt', (el) => { v().giveAmt = Math.max(0, +el.value); return false; });
  ui.on('giveQuick', (el, a) => { v().giveAmt = +a; });
  ui.on('give', () => { ui.toast(G.give.donate(S(), v().cause || 'food', v().giveAmt || 500)); G.events.next(S()); after(); });
  ui.on('fName', (el) => { v().fName = el.value; return false; });
  ui.on('makeF', (el, a) => { const e = G.give.createFoundation(S(), (v().fName || '').trim() || null, v().cause || 'food', +a); ui.toast(e || 'Foundation established.'); after(); });
  ui.on('fundF', (el, a) => { const e = G.give.fund(S(), +a); if (e) ui.toast(e); after(); });
  ui.on('fCause', (el) => { S().phil.foundation.cause = el.value; after(); });

  function confirmBox(title, body, act, arg) {
    return `<div class="overlay"><div class="modal" role="dialog" aria-modal="true"><div class="modal-top"><h3>${esc(title)}</h3></div><div class="modal-body"><p>${esc(body)}</p></div>
      <div class="modal-foot"><button class="btn" data-act="closeModal">Cancel</button><button class="btn btn-danger" data-act="${act}" data-a="${esc(arg || '')}">Yes, do it</button></div></div></div>`;
  }

  return { render, modal, alerts };
})();
