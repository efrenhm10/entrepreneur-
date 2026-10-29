// Bill Builder. Two ways in: type your own idea in plain English and let the drafting office
// interpret it, or start from one of your jurisdiction's real problems. Either way the drafting
// office walks you through the approach, the scale, how to pay for it and any extra sections,
// writes the bill text as you go, and scores it before you file: cost, committee referral,
// the whip count in your chamber and the executive's likely position.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiDraft = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const G = () => GR.gov;
  const L = () => GR.legis;
  const D = () => GR.drafting;
  const sig = (x) => 1 / (1 + Math.exp(-x));

  const EXAMPLES = {
    city: ['Hire more firefighters and paramedics', 'Fix potholes and repave our worst streets', 'Allow duplexes and ADUs in every neighborhood', 'A small pilot for homeless outreach downtown'],
    state: ['Raise teacher pay and hire more teachers', 'Build affordable housing near transit, paid for by the top bracket', 'Legalize marijuana for adults', 'Audit the prison system to cut waste'],
    nation: ['Lower the price of insulin and prescription drugs', 'Repair bridges and highways without raising taxes', 'Hire more immigration judges to clear the backlog', 'Expand the child tax credit'],
    school: ['Hire reading tutors for every elementary school', 'Repair and modernize old school buildings', 'Raise teacher salaries'],
  };

  function draft(s) {
    const jur = G().myJur(s);
    let d = ui.sel.gd;
    if (!d || d.jur !== jur) d = ui.sel.gd = { jur, idea: '', read: null, issue: null, appr: null, scale: 'standard', pay: null, riders: {}, title: '' };
    return d;
  }
  const key = (d) => JSON.stringify([d.issue, d.appr, d.scale, d.pay, d.riders, d.title, d.idea && d.read ? d.idea : '']);

  function render(s) {
    const jur = G().myJur(s);
    if (!jur || !G().bodiesOf(s, jur).length) return head(s) + ui.panel('', '<p>Your office has no legislature to send bills to.</p>');
    const tabs = [['idea', '✍️ Your own idea'], ['problem', '📋 Start from a problem'], ['advanced', 'Line-item editor (advanced)']];
    const cur = ui.cur('builder', tabs);
    const due = s.budgetDue && s.budgetDue[jur];
    const budgetNote = due ? `<div class="note" style="margin-bottom:10px"><b>Your FY${due.fy} budget is due ${U.fmtDate(due.due)}.</b> Budgets are written line by line: open the line-item editor and choose "FY${due.fy} budget". ${ui.btn('Open the budget', 'sub', 'builder|advanced', 'bb sm')}</div>` : '';
    if (cur === 'advanced') return head(s) + ui.tabs('builder', tabs) + `<div class="sheet">${GR.uiGov.constructor(s)}</div>`;
    const d = draft(s);
    const left = cur === 'idea' ? ideaSteps(s, d) : problemSteps(s, d);
    const right = d.appr ? output(s, d) : ui.panel('How bills get written', `<p class="small">Real bills are narrow. They answer one problem, through one mechanism, at a stated size, with a stated way to pay. Start with your idea in your own words, or pick a problem your ${jur === 'nation' ? 'country' : jur === 'state' ? 'state' : jur === 'city' ? 'city' : 'district'} faces. The drafting office writes the text and scores it as you go.</p>`);
    return head(s) + ui.tabs('builder', tabs) + budgetNote + `<div class="grid2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)"><div>${left}</div><div>${right}</div></div>`;
  }
  const head = (s) => `<div class="vhead"><h2>Bill Builder</h2><span class="sub">${esc(s.jur[G().myJur(s)] ? s.jur[G().myJur(s)].name : '')} · drafting office</span></div>`;
  const step = (n, title, body, done) => ui.panel(`<span><span class="stepn ${done ? 'done' : ''}">${n}</span>${title}</span>`, body);

  // ---------- Your own idea ----------
  function ideaSteps(s, d) {
    const ex = EXAMPLES[d.jur] || EXAMPLES.state;
    let read = '';
    if (d.read) {
      read = d.read.cands.length
        ? `<div class="tiny muted" style="margin:8px 0 4px">The drafting office reads your idea as one of these. Pick the closest:</div>${d.read.cands.map((c) => pickRow(s, d, c.appr, c.issue, c.name, `${c.issueName}${approachDesc(s, d.jur, c.issue, c.appr)}`)).join('')}
          <p class="tiny muted" style="margin-top:4px">Not quite? Reword it, or switch to "Start from a problem".</p>`
        : `<div class="note" style="margin-top:8px">The drafting office couldn't match that to something ${esc(s.jur[d.jur].name)} can legislate. ${/property tax/i.test(d.idea) && d.jur !== 'city' && d.jur !== 'school' ? 'Property taxes are set by cities and school boards, not here. ' : ''}Try naming the problem and what the bill does ("hire more nurses at rural hospitals"), or pick from the list of problems.</div>`;
    }
    const s1 = step(1, 'Your idea', `<textarea class="input" id="gdidea" rows="3" placeholder="Describe your bill in plain English. What does it do, and for whom?" data-in="gdidea">${esc(d.idea)}</textarea>
      <div class="row" style="margin-top:6px">${ui.btn('Send to the drafting office', 'gdread', '', 'bb sm')}<span class="tiny muted">Mention how big and how to pay if you know ("a small pilot", "paid for by the top bracket", "no new taxes").</span></div>
      <div class="row tiny" style="margin-top:6px">${ex.map((x) => `<a href="#" data-act="gdex" data-a="${esc(x)}">“${esc(x)}”</a>`).join(' · ')}</div>${read}`, !!d.appr);
    return s1 + (d.appr ? common(s, d, 2) : '');
  }

  // ---------- Start from a problem ----------
  function problemSteps(s, d) {
    const iss = D().issues(s, d.jur);
    const crisis = iss.filter((x) => x.crisis);
    const other = iss.filter((x) => !x.crisis);
    const s1 = step(1, 'The problem', crisis.map((i) => `<button class="pickrow ${d.issue === i.k ? 'on' : ''}" data-act="gdissue" data-a="${i.k}"><span class="grow">${esc(i.name)}${Math.abs(i.trend) >= 0.5 ? ` <span class="tiny ${i.trend > 0 ? 'bad' : 'good'}">${i.trend > 0 ? '▲ worsening' : '▼ easing'}</span>` : ''}</span><span style="width:110px">${ui.bar(i.sev, i.sev > 65 ? 'red' : i.sev > 45 ? '' : 'green')}</span><span class="num" style="width:26px;text-align:right">${Math.round(i.sev)}</span></button>`).join('')
      + `<div class="tiny muted" style="margin:8px 0 4px">Or a standing subject:</div>${other.map((i) => `<button class="pickrow ${d.issue === i.k ? 'on' : ''}" data-act="gdissue" data-a="${i.k}"><span class="grow"><b>${esc(i.name)}</b> <span class="tiny muted">${esc(i.desc)}</span></span></button>`).join('')}`, !!d.issue);
    if (!d.issue) return s1;
    const as = D().approaches(s, d.jur, d.issue);
    let list;
    if (as.length > 14) {
      const groups = {};
      as.forEach((a) => { const g = a.cat || (a.kind === 'reg' ? 'Industry rules' : a.kind === 'tax' ? 'Tax rates' : 'Options'); (groups[g] || (groups[g] = [])).push(a); });
      list = `<select class="input" data-ch="gdappr"><option value="">Choose…</option>${Object.entries(groups).map(([g, xs]) => `<optgroup label="${esc(g)}">${xs.map((a) => `<option value="${a.id}" ${d.appr === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</optgroup>`).join('')}</select>${d.appr ? `<p class="small muted" style="margin-top:4px">${esc((as.find((a) => a.id === d.appr) || {}).desc || '')}</p>` : ''}`;
    } else list = as.map((a) => pickRow(s, d, a.id, d.issue, a.name, a.desc)).join('');
    const s2 = step(2, 'The approach', list, !!d.appr);
    return s1 + s2 + (d.appr ? common(s, d, 3) : '');
  }

  function approachDesc(s, jur, issue, id) { const a = D().approaches(s, jur, issue).find((x) => x.id === id); return a ? ` · ${a.desc}` : ''; }
  const pickRow = (s, d, id, issue, name, desc) => `<button class="pickrow ${d.appr === id ? 'on' : ''}" data-act="gdpick" data-a="${esc(issue + '|' + id)}"><span class="grow"><b>${esc(name)}</b><br><span class="tiny muted">${esc(desc)}</span></span></button>`;

  // Scale, payment, extra sections and the name: shared by both paths.
  function common(s, d, n) {
    const me = s.pols.me;
    const c = D().compile(s, d.jur, d);
    if (!c) return '';
    const a = c.a;
    const scales = D().SCALES.map((x) => { const cx = D().compile(s, d.jur, Object.assign({}, d, { scale: x.k, pay: 'none' })); return `<button class="pickrow ${d.scale === x.k ? 'on' : ''}" data-act="gdscale" data-a="${x.k}"><span class="grow"><b>${x.name}</b> <span class="tiny muted">${esc(x.desc)}</span></span><span class="small num">${cx.cost > 0 ? U.money(cx.cost) + '/yr' : cx.cost < 0 ? 'saves ' + U.money(-cx.cost) : a.kind === 'law' ? (x.k === 'major' ? 'two steps' : 'one step') : ''}</span></button>`; }).join('');
    const pays = D().payOptions(s, d.jur, D().compile(s, d.jur, Object.assign({}, d, { pay: 'none' })).cost, a);
    const payBody = pays.length ? pays.map((p) => `<button class="pickrow ${d.pay === p.k ? 'on' : ''}" data-act="gdpay" data-a="${esc(p.k)}"><span class="grow"><b>${esc(p.name)}</b><br><span class="tiny muted">${esc(p.desc)}</span></span></button>`).join('')
      : `<p class="small">${c.cost < 0 ? `This bill saves about ${U.money(-c.cost)} a year. The savings go to the general fund.` : 'This bill has no direct cost, so there is nothing to pay for. Its fight is political, not fiscal.'}</p>`;
    const bk = G().myBody(s);
    const capital = ['capex', 'p3'].includes(a.kind);
    const members = bk ? W().members(s, bk).filter((p) => !p.isPlayer).sort((x, y) => G().rel(s, y.id) - G().rel(s, x.id)).slice(0, 80) : [];
    const R = d.riders || {};
    const chk = (k, label, desc, dis) => `<label class="pickrow" style="cursor:${dis ? 'not-allowed' : 'pointer'};opacity:${dis ? 0.5 : 1}"><input type="checkbox" data-ch="gdrider" data-a="${k}" ${R[k] ? 'checked' : ''} ${dis ? 'disabled' : ''}><span class="grow"><b>${label}</b><br><span class="tiny muted">${desc}</span></span></label>`;
    const extras = chk('audit', 'Oversight & audit', 'Annual reports and an independent audit. Fiscal hawks like it; the agency gets more efficient.', !a.ag || a.kind === 'reform')
      + chk('labor', 'Labor standards', 'Prevailing wages, apprenticeships and domestic materials. Unions back it; it costs about 6% more.', !capital)
      + (bk ? chk('mine', 'A project in your district', 'Steer a share to a named project back home. Constituents notice.', false) : '')
      + (bk ? `<div class="pickrow" style="cursor:default"><span class="grow"><b>A project for a colleague</b><br><span class="tiny muted">Put a project in a wavering member's district to win their vote.</span></span><select class="input" style="max-width:220px" data-ch="gdear"><option value="">No one</option>${members.map((p) => `<option value="${p.id}" ${R.ear === p.id ? 'selected' : ''}>${esc(W().fullName(p))} (${p.party}) · ${G().relLabel(G().rel(s, p.id))}</option>`).join('')}</select></div>` : '');
    const name = `<input class="input" id="gdtitle" placeholder="${esc(c.autoTitle)}" value="${esc(d.title)}" data-in="gdtitle"><p class="tiny muted" style="margin-top:4px">Leave blank to use the drafting office's title. Press Update text after typing.</p>${ui.btn('Update text', 'rerender', '', 'bgr sm')}`;
    return step(n, 'How big', scales, true) + step(n + 1, 'Paying for it', payBody, !pays.length || !!d.pay) + step(n + 2, 'Extra sections', extras, true) + step(n + 3, 'Name it', name, true);
  }

  // ---------- Bill text and scorecard ----------
  function output(s, d) {
    const me = s.pols.me;
    const c = D().compile(s, d.jur, d);
    if (!c) return '';
    const J = s.jur[d.jur];
    const b = L().newBill(s, d.jur, { title: c.title, prov: c.prov, spon: 'me', kind: 'regular', crisis: GR.CRISIS_TYPES[d.issue] ? d.issue : null });
    const cost = L().introCost(s, b);
    const err = L().validate(s, b);
    const lead = ({ nation: 'Congress', state: 'the Legislature', city: 'the City Council', school: 'the Board of Education' })[d.jur];
    const text = `<div class="billtext"><div class="bt-h">${esc(GR.BODIES[G().bodiesOf(s, d.jur)[0]].name)}</div><div class="bt-t">A BILL</div>
      <p class="bt-p">${esc(d.idea && d.read ? `To ${d.idea.trim().replace(/^to\s+/i, '').replace(/\.*$/, '').replace(/^./, (c) => c.toLowerCase())}.` : `Relating to ${(GR.CRISIS_TYPES[d.issue] ? GR.CRISIS_TYPES[d.issue].name : c.a.name).toLowerCase()}.`)}</p>
      <p class="bt-p"><i>Be it enacted by ${esc(lead)}:</i></p>
      <p><b>SECTION 1. SHORT TITLE.</b> This Act may be cited as the “${esc(c.title)}.”</p>
      ${c.sections.map((x, i) => `<p><b>SEC. ${i + 2}. ${esc(x[0])}.</b> ${esc(x[1])}</p>`).join('')}</div>`;
    // Scorecard.
    const net = c.net;
    const pop = J.pop || 1;
    const k = key(d);
    const an = d.an && d.anKey === k ? d.an : null;
    const Bd = s.bodies[b.body];
    const cm = Bd && Bd.comm[b.comm];
    const chair = cm && s.pols[cm.chair];
    let chairLine = '';
    if (chair) {
      if (chair.isPlayer) chairLine = '<span class="good">You chair it</span>';
      else { const sc = L().components(s, chair, b).score; chairLine = `${ui.plink(s, chair.id)}: <span class="${sc >= 0.02 ? 'good' : sc > -0.04 ? 'warn' : 'bad'}">${sc >= 0.02 ? 'likely to schedule a hearing' : sc > -0.04 ? 'on the fence' : 'likely to bury it'}</span> (${sc >= 0 ? '+' : ''}${sc.toFixed(2)})`; }
    }
    const bk = b.body;
    const r = L().roll(s, b, bk, { noise: false, myVote: G().myBody(s) === bk ? 'y' : null });
    const need = L().needed(s, b, bk, bk === 'ussenate' ? 'cloture' : 'floor');
    const p = U.clamp(sig((r.y - need + 0.5) / Math.max(1.2, r.total * 0.03)), 0.01, 0.99);
    const ex = G().execOf(s, d.jur);
    let exLine = '<span class="muted">No executive signature needed</span>';
    if (ex && ex.isPlayer) exLine = 'You sign it';
    else if (ex) { const sc = L().components(s, ex, b).score; exLine = `${ui.plink(s, ex.id)}: <span class="${sc > 0.03 ? 'good' : sc > -0.06 ? 'warn' : 'bad'}">${sc > 0.03 ? 'likely to sign' : sc > -0.06 ? 'leaning toward signing' : 'veto risk'}</span>`; }
    const myC = L().components(s, me, b);
    const crisisK = GR.CRISIS_TYPES[d.issue] ? d.issue : null;
    const score = ui.panel('Drafting office scorecard', `<div class="ind">
        ${ui.stat('First-year cost', c.cost > 0 ? U.money(c.cost) : c.cost < 0 ? `<span class="good">saves ${U.money(-c.cost)}</span>` : '—')}
        ${ui.stat('After offsets', `<span class="${net > c.cost * 0.2 && net > 0 ? 'bad' : 'good'}">${net > 0 ? U.money(net) : net < 0 ? '+' + U.money(-net) : 'paid for'}</span>`)}
        ${ui.stat('Per resident', c.cost ? '$' + U.round(Math.abs(c.cost) / pop, 2) : '—')}
        ${ui.stat('Your district', `<span class="${myC.di >= 0 ? 'good' : 'bad'}">${myC.di >= 0 ? '+' : ''}${myC.di.toFixed(2)}</span>`)}
      </div>
      <div class="stack-s small" style="margin-top:10px">
        <div><b>Referred to</b> ${esc(L().committeeName(s, b))}${chair ? ` · chair ${chairLine}` : ''}</div>
        <div><b>${esc(GR.BODIES[bk].name)}</b> (no deals yet): ${r.y} yes, ${r.n} no, ${need} needed · <span class="${p > 0.6 ? 'good' : p < 0.4 ? 'bad' : 'warn'}">${Math.round(p * 100)}% on the floor</span></div>
        <div class="whipbar"><i class="${r.y >= need ? 'ok' : ''}" style="width:${U.clamp(r.y / r.total * 100, 0, 100)}%"></i><span data-l="${need}" style="left:${U.clamp(need / r.total * 100, 0, 100)}%"></span></div>
        <div><b>${esc(GR.xneg.exTitle(s, d.jur))}</b>: ${exLine}</div>
      </div>
      ${an ? `<div class="ind" style="margin-top:10px">${ui.stat(`${an.years}-yr deficit`, `<span class="${an.cumDef > 0 ? 'bad' : 'good'}">${an.cumDef >= 0 ? '+' : '−'}${U.money(Math.abs(an.cumDef))}</span>`)}${ui.stat('GDP, yr ' + an.years, `${an.gdpEnd >= 0 ? '+' : ''}${an.gdpEnd.toFixed(2)}%`)}${ui.stat('Jobs, yr 2', `${an.jobs >= 0 ? '+' : '−'}${U.num(Math.abs(Math.round(an.jobs)))}`)}${crisisK && an.crises[crisisK] != null ? ui.stat(`${GR.CRISIS_TYPES[crisisK].name.split(' ')[0]} severity`, `<span class="${an.crises[crisisK] < 0 ? 'good' : 'bad'}">${an.crises[crisisK] >= 0 ? '+' : ''}${an.crises[crisisK].toFixed(1)}</span>`) : ''}</div>` : `<div class="row" style="margin-top:10px">${ui.btn(`Get the ${fiscalOffice(s, d.jur)} score`, 'gdscore', '', 'bgr sm')}<span class="tiny muted">Multi-year dynamic score: deficit, growth, jobs, and what it does to the problem.</span></div>`}
      <div class="row" style="margin-top:12px">${ui.btn(`Introduce the bill (${cost} PP, 6 hours)`, 'gdintro', '', 'bo', !!err || me.pp < cost || s.hoursLeft < 6)}${err ? `<span class="small bad">${esc(err)}</span>` : me.pp < cost ? '<span class="small bad">Not enough political points.</span>' : s.hoursLeft < 6 ? '<span class="small bad">Not enough hours left this week.</span>' : ''}</div>`);
    return ui.panel('Bill text', text) + score;
  }
  const fiscalOffice = (s, jur) => (jur === 'nation' ? 'CBO' : jur === 'state' ? 'fiscal office' : 'budget office');

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  const reset = (d) => { d.pay = null; d.an = null; };
  A('gdidea', (el) => { draft(ui.s).idea = el.value; return false; });
  A('gdex', (el, a) => { const d = draft(ui.s); d.idea = a; d.read = null; });
  A('gdread', () => {
    const s = ui.s; const d = draft(s);
    const box = document.getElementById('gdidea'); if (box) d.idea = box.value;
    if (!d.idea.trim()) { ui.toast('Describe your idea first: what the bill does, and for whom.'); return; }
    d.read = D().interpret(s, d.jur, d.idea);
    const h = d.read.hints;
    d.appr = null; d.issue = null; reset(d);
    if (d.read.cands.length) { d.issue = d.read.cands[0].issue; d.appr = d.read.cands[0].appr; }
    if (h.scale) d.scale = h.scale;
    d.riders = Object.assign({}, h.riders);
    if (h.title) d.title = h.title;
    d.hintPay = h.pay || null;
    applyPayHint(s, d);
  });
  function applyPayHint(s, d) {
    if (!d.hintPay || !d.appr) return;
    const c = D().compile(s, d.jur, Object.assign({}, d, { pay: 'none' }));
    const opts = D().payOptions(s, d.jur, c ? c.cost : 0, c && c.a);
    const m = d.hintPay === 'cut' ? opts.find((o) => o.k.startsWith('cut:')) : opts.find((o) => o.k === d.hintPay);
    if (m) d.pay = m.k;
  }
  A('gdpick', (el, a) => { const s = ui.s; const d = draft(s); const i = a.indexOf('|'); d.issue = a.slice(0, i); d.appr = a.slice(i + 1); reset(d); applyPayHint(s, d); });
  A('gdissue', (el, a) => { const d = draft(ui.s); if (d.issue !== a) { d.issue = a; d.appr = null; d.read = null; d.idea = ''; reset(d); } });
  A('gdappr', (el) => { const d = draft(ui.s); d.appr = el.value || null; d.read = null; reset(d); });
  A('gdscale', (el, a) => { const d = draft(ui.s); d.scale = a; d.pay = d.pay && d.pay.startsWith('tax:') || d.pay && d.pay.startsWith('cut:') ? d.pay : d.pay; d.an = null; });
  A('gdpay', (el, a) => { const d = draft(ui.s); d.pay = a; d.an = null; });
  A('gdrider', (el, a) => { const d = draft(ui.s); d.riders = Object.assign({}, d.riders, { [a]: el.checked }); d.an = null; });
  A('gdear', (el) => { const d = draft(ui.s); d.riders = Object.assign({}, d.riders, { ear: el.value || null }); d.an = null; });
  A('gdtitle', (el) => { draft(ui.s).title = el.value; return false; });
  A('gdscore', () => {
    const s = ui.s; const d = draft(s);
    const c = D().compile(s, d.jur, d);
    if (!c) return;
    const b = L().newBill(s, d.jur, { title: c.title, prov: c.prov, spon: 'me', kind: 'regular' });
    d.an = L().analysis(s, b); d.anKey = key(d);
  });
  A('gdintro', () => {
    const s = ui.s; const d = draft(s);
    const c = D().compile(s, d.jur, d);
    if (!c) return;
    const r = L().introduce(s, { title: c.title, kind: 'regular', prov: c.prov });
    ui.res(r);
    if (r.ok && r.bill) {
      if (GR.CRISIS_TYPES[d.issue]) r.bill.crisis = d.issue;
      if (d.idea && d.read) r.bill.idea = d.idea;
      ui.sel.gd = null; ui.sel.leg = r.bill.id; ui.sel.legf = 'mine'; ui.tab = 'legis';
      ui.save();
    }
  });

  return { render };
})();
