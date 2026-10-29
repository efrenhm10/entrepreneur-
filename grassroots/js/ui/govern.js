// Governing screens: the four-part briefing, Bill Constructor, docket, negotiations,
// roll calls, budget detail and the economy dashboard.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiGov = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const G = () => GR.gov;
  const L = () => GR.legis;
  const FX = () => GR.fisc;
  const pctS = (v, d = 1) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
  const arrow = (d, goodUp) => (Math.abs(d) < 0.05 ? '<span class="muted">—</span>' : `<span class="${(d > 0) === goodUp ? 'good' : 'bad'}">${d > 0 ? '▲' : '▼'}</span>`);
  const cls = (v, good) => (v * good > 0 ? 'good' : v * good < 0 ? 'bad' : '');
  const fiscalOffice = (s, jur) => (jur === 'nation' ? 'Congressional Budget Office' : jur === 'state' ? ({ CA: "Legislative Analyst's Office", TX: 'Legislative Budget Board', NY: 'Senate Finance Committee staff', FL: 'Office of Economic & Demographic Research' }[s.home.state] || 'Legislative Fiscal Office') : jur === 'city' ? 'Independent Budget Office' : 'District Finance Office');
  const myJ = (s) => s.jur[G().myJur(s)];

  // ---------- 1. Briefing ----------
  function briefing(s) {
    const me = s.pols.me;
    const seat = s.seats[me.seat];
    const off = GR.OFFICES[seat.off];
    const J = myJ(s);
    const F = J.F;
    const t = FX().totals(J);
    const bk = G().myBody(s);
    const comp = bk ? W().composition(s, bk) : null;
    const tasks = G().tasks(s).length;
    const vd = FX().dissatisfaction(J);
    const prev = F.hist.length >= 2 ? F.hist[F.hist.length - 2] : null;
    const yr = F.hist.length >= 5 ? F.hist[F.hist.length - 5] : null;
    const fy = L().fiscalYear(s, J.k);
    const due = s.budgetDue && s.budgetDue[J.k];
    const myBills = (J.bills || []).filter((b) => b.spon === 'me' && L().OPEN(b));
    const reb = bk ? U.avg(W().members(s, bk).filter((p) => p.party === me.party && !p.isPlayer).slice(0, 120), (p) => L().rebellion(s, p, J, L().ctxOf(s, p))) : 0;
    // Part 1.
    const p1 = `<div class="band" style="font-size:1.25rem">1. OFFICE & AGENCY STATUS BRIEFING</div>
      <div class="secband" style="font-size:1.05rem">${esc(G().briefingLabel(s))}</div>
      <div class="cols"><div>${ui.kv([['Office', esc(W().seatTitle(s, seat))], ['Government', `${esc(J.name)} · FY${fy}${J.F.shutdown ? ' · <b class="bad">SHUTDOWN</b>' : ''}`], bk ? ['Chamber', `${GR.BODIES[bk].name}: ${comp.D} D · ${comp.R} R · ${W().members(s, bk).length} seats${bk === 'ussenate' ? ' · 60 for cloture' : ''}`] : ['Legislature', G().bodiesOf(s, J.k).map((b) => { const c = W().composition(s, b); return `${GR.BODIES[b].name} ${c.D}D–${c.R}R`; }).join(' · ')],
        ['Your standing', `Approval ${Math.round(me.app)}% · Respect ${Math.round(me.respect || 0)} · ${U.num(me.pp)} political points · ${s.hoursLeft} hours left`],
        bk ? ['Committees', committeeLine(s, bk)] : null,
        ['On your desk', `${tasks} vote${tasks === 1 ? '' : 's'}/decision${tasks === 1 ? '' : 's'} · ${myBills.length} of your bills moving${due ? ` · <b>Budget due ${U.fmtDate(due.due)}</b>` : ''}`]].filter(Boolean))}</div>
      <div>${ui.kv([['Voter dissatisfaction index', `${Math.round(vd)} / 100 ${arrow(vd - (F.vd0 || vd), false)}`], ['Caucus rebellion risk', `${Math.round(reb * 100)}%`], ['Credit rating', `<b>${F.ratingLabel}</b> (${F.rating.toFixed(0)}/100)`], ['Agency approval (avg.)', Math.round(U.avg(F.ag, (a) => a.app)) + '%']])}</div></div>
      <div class="subhead">Jurisdictional Crises & Needs Matrix</div>
      ${crisisTable(s, J)}`;
    // Part 2.
    const row = (name, now, last, ago, fmt, good) => `<tr><td>${name}</td><td class="r num">${fmt(now)}</td><td class="r num">${last != null ? fmt(last) : '—'}</td><td class="r num ${last != null ? cls(now - last, good) : ''}">${last != null ? (typeof now === 'number' ? (fmt === money ? (now - last >= 0 ? '+' : '−') + U.money(Math.abs(now - last)) : pctS(now - last, 2)) : '') : '—'}</td><td class="r num">${ago != null ? fmt(ago) : '—'}</td></tr>`;
    const money = (v) => U.money(v);
    const pc = (v) => v.toFixed(1) + '%';
    const m = F.mac;
    const p2 = `<div class="band" style="font-size:1.25rem">2. SYSTEMIC ECONOMIC & FISCAL LEDGER</div>
      ${ui.table(['Indicator', { t: 'Current', c: 'r' }, { t: 'Last quarter', c: 'r' }, { t: 'Change', c: 'r' }, { t: 'Year ago', c: 'r' }], [
        row(J.k === 'nation' ? 'GDP (nominal, annual)' : `${J.k === 'state' ? 'State' : 'Local'} GDP (nominal)`, m.gdp, prev && prev.gdp, yr && yr.gdp, money, 1),
        row('Real GDP growth (annualized)', m.g, prev && prev.g, yr && yr.g, pc, 1),
        row('Revenue', t.rev, prev && prev.rev, yr && yr.rev, money, 1),
        row('Expenditures', t.spend, prev && prev.spend, yr && yr.spend, money, -1),
        row('Net surplus / deficit', t.bal, prev && prev.bal, yr && yr.bal, money, 1),
        row(J.k === 'nation' ? 'National debt (held by public)' : 'Outstanding debt', F.debt, prev && prev.debt, yr && yr.debt, money, -1),
        row('Debt service', t.interest + t.principal, null, null, money, -1),
        J.k !== 'nation' ? `<tr><td>Rainy-day reserves</td><td class="r num">${U.money(F.reserve)}</td><td class="r">—</td><td class="r">—</td><td class="r">—</td></tr>` : `<tr><td>Debt-to-GDP</td><td class="r num">${(F.debt / m.gdp * 100).toFixed(1)}%</td><td class="r">—</td><td class="r">—</td><td class="r">—</td></tr>`,
        row('Unemployment', m.u, prev && prev.u, yr && yr.u, pc, -1),
        row('Inflation (CPI)', m.pi, prev && prev.pi, yr && yr.pi, pc, -1),
        row('Consumer confidence (index)', m.cc, prev && prev.cc, yr && yr.cc, (v) => v.toFixed(0), 1),
        row(J.k === 'nation' ? '10-year Treasury yield' : 'Municipal bond yield', m.y10, prev && prev.y10, yr && yr.y10, (v) => v.toFixed(2) + '%', -1),
        `<tr><td>Potential growth · public capital (infra / R&D / human)</td><td class="r num">${m.pot.toFixed(2)}%</td><td class="r num" colspan="3">${Object.values(m.K).map((x) => x.toFixed(0)).join(' / ')} (100 = baseline)</td></tr>`,
      ])}`;
    // Part 3.
    const ec = t.ec;
    const p3 = `<div class="band" style="font-size:1.25rem">3. GRANULAR AGENCY BUDGET & COMPLIANCE REPORT</div>
      ${agencyTable(s, J, t)}
      ${ui.table(['Entitlement / program', { t: 'Annual cost', c: 'r' }, 'Key parameters'], Object.entries(ec).map(([k, e]) => { const def = (FX().ENTS[J.k] || []).find((x) => x.k === k); return `<tr><td>${esc(e.name)}</td><td class="r num">${U.money(e.cost)}</td><td class="small">${def ? def.params.map((pd) => `${esc(pd[1])}: <b>${L().fmtParam(pd, F.ent[k].p[pd[0]])}</b>`).join(' · ') : ''}</td></tr>`; }), { cls: '' })}`;
    // Part 4.
    const isExec = off.exec;
    const chairApprop = GR.comm.chairsMoney(s);
    const blocked = myBills.filter((b) => b.blockedBy || b.filibustered);
    const p4 = `<div class="band" style="font-size:1.25rem">4. ACTION MENU</div>
      <div class="stack-s">
        <div class="act"><span class="t"><b>Launch the Bill Constructor</b> <span class="small muted">Revenue & regulatory architecture, line-item appropriations, entitlement triggers, earmarks. ${due ? '<b>Your budget is due.</b>' : ''}</span></span>${ui.btn('Open', 'sub', 'office|bills', 'bb sm')}</div>
        ${bk ? `<div class="act"><span class="t"><b>Committee power</b> <span class="small muted">${s.steer && !s.steer.done && s.steer.body === bk ? '<b>Steering is handing out committee seats now.</b> Spend political capital and trade favors with leadership.' : 'Your assignments, gavels, committee dockets and markup.'}</span></span>${ui.btn('Committees', 'sub', 'office|committees', 'bb sm')}</div>` : ''}
        <div class="act"><span class="t"><b>Backroom negotiations</b> <span class="small muted">${blocked.length ? `${blocked.length} of your bills are blocked by a chair or filibuster.` : 'Cut deals with committee chairs, floor leaders and swing votes.'}</span></span>${ui.btn('Negotiate', 'sub', 'office|deals', 'bb sm', !myBills.length)}</div>
        <div class="act"><span class="t"><b>Reallocate emergency agency funds</b> <span class="small muted">${isExec || chairApprop ? 'Transfer up to 5% of one agency\'s annual funding to another\'s operations.' : 'Requires executive transfer authority or the Appropriations gavel.'}</span></span>
          ${isExec || chairApprop ? `<select class="input" id="rfrom" style="max-width:160px">${F.ag.map((a) => `<option value="${a.k}">${esc(a.abbr)}</option>`).join('')}</select><span>→</span><select class="input" id="rto" style="max-width:160px">${F.ag.map((a, i) => `<option value="${a.k}" ${i === 1 ? 'selected' : ''}>${esc(a.abbr)}</option>`).join('')}</select><input class="input" id="ramt" style="max-width:110px" placeholder="$ millions" inputmode="numeric">${ui.btn('Transfer', 'realloc', '', 'bb sm')}` : ''}</div>
        <div class="act"><span class="t"><b>Commission an agency audit</b> <span class="small muted">Raises the agency's audit/efficiency rating and can expose waste (4 hours).</span></span><select class="input" id="audsel" style="max-width:220px">${F.ag.map((a) => `<option value="${a.k}">${esc(a.abbr)} · ${Math.round(a.eff)}</option>`).join('')}</select>${ui.btn('Audit', 'audit', '', 'bb sm', s.hoursLeft < 4)}</div>
        <div class="act"><span class="t"><b>Advance the turn</b> <span class="small muted">Runs the quarterly economic calculators and any scheduled roll-call floor votes. Stops early if a vote needs you.</span></span>${ui.btn('Advance to next quarter', 'advq', '', 'next')}</div>
      </div>`;
    return `<div class="stack">${p1}${p2}${p3}${p4}</div>`;
  }

  function committeeLine(s, bk) {
    const posts = GR.comm.myPosts(s);
    const st = s.steer && s.steer.body === bk && !s.steer.done ? ` · <b>Steering meets ${U.fmtDate(s.steer.due)}</b>` : '';
    return (posts.map((x) => `${esc(x.name)}${x.role !== 'Member' ? ` (<b>${x.role}</b>)` : ''}`).join(', ') || 'None') + st;
  }

  function crisisTable(s, J) {
    const F = J.F;
    const rows = Object.entries(F.crises).sort((a, b) => b[1].s - a[1].s).map(([k, c]) => {
      const T = GR.CRISIS_TYPES[k];
      const d4 = c.hist.length >= 4 ? c.s - c.hist[c.hist.length - 4] : c.s - c.s0;
      const links = (T.ag || []).map(([ak]) => F.ag.find((a) => a.k === ak)).filter(Boolean).map((a) => a.abbr).concat((T.ent || []).filter(([ek]) => F.ent[ek]).map(([ek]) => ((FX().ENTS[J.k] || []).find((e) => e.k === ek) || {}).name)).filter(Boolean);
      const effects = [T.sal >= 1 ? 'Voter anger' : null, T.rebel >= 0.8 ? 'Caucus revolt' : null, T.rating >= 0.5 ? 'Credit risk' : null].filter(Boolean).join(', ');
      return `<tr><td>${esc(T.name)}</td><td style="min-width:120px">${ui.bar(c.s, c.s > 70 ? 'red' : c.s > 45 ? '' : 'green')}</td><td class="r num">${Math.round(c.s)}</td><td class="r">${arrow(d4, false)} ${d4 ? pctS(d4, 1) : ''}</td><td class="small">${esc([...new Set(links)].slice(0, 4).join(', ') || '—')}</td><td class="small">${effects}</td></tr>`;
    });
    return ui.table(['Crisis / need', 'Severity', '', { t: 'Last 4 qtrs', c: 'r' }, 'Levers', 'If ignored'], rows);
  }

  function agencyTable(s, J, t) {
    const F = J.F;
    return ui.table(['Agency', 'Mission', { t: 'Operations', c: 'r' }, { t: 'Capital', c: 'r' }, { t: 'Funding vs. need', c: 'r' }, { t: 'Degradation', c: 'r' }, { t: 'Audit rating', c: 'r' }, { t: 'Approval', c: 'r' }], F.ag.map((a) => {
      const fr = FX().agRatio(F, a, 'all');
      return `<tr><td><b>${esc(a.abbr)}</b>${a.privatized ? ' <span class="chip">partly privatized</span>' : ''}${a.prem ? ` <span class="chip">+${a.prem}% mandate</span>` : ''}</td><td class="small">${esc(a.name)}</td><td class="r num">${U.money(t.ag[a.k].opex)}</td><td class="r num">${U.money(a.capex)}</td><td class="r num ${fr < 0.95 ? 'bad' : fr > 1.05 ? 'good' : ''}">${Math.round(fr * 100)}%</td><td class="r num ${a.deg > 60 ? 'bad' : a.deg < 35 ? 'good' : ''}">${Math.round(a.deg)}</td><td class="r num ${a.eff < 45 ? 'bad' : a.eff > 70 ? 'good' : ''}">${Math.round(a.eff)}</td><td class="r num">${Math.round(a.app)}%</td></tr>`;
    }));
  }

  // ---------- 2. Bill Constructor ----------
  function draftFor(s) {
    const jur = G().myJur(s);
    let d = ui.sel.draft;
    if (!d || d.jur !== jur) {
      d = ui.sel.draft = { jur, kind: 'regular', title: '', tax: {}, reg: {}, ap: {}, ent: {}, ear: [], policy: [], sale: {}, prem: {}, eff: {}, fee: {}, an: null };
    }
    return d;
  }

  function toProv(s, d) {
    const J = s.jur[d.jur];
    const F = J.F;
    const p = L().emptyProv();
    Object.entries(d.tax).forEach(([k, v]) => { if (+v) p.tax[k] = +v; });
    Object.entries(d.reg).forEach(([k, v]) => { if (+v) p.reg[k] = +v; });
    Object.entries(d.ap).forEach(([k, v]) => { const a = F.ag.find((x) => x.k === k); if (!a) return; const o = Math.round(a.opex * (+v.opex || 0) / 100), c = Math.round(a.capex * (+v.capex || 0) / 100); if (o || c) p.ap[k] = { opex: o, capex: c }; });
    Object.entries(d.ent).forEach(([k, ps]) => { const e = F.ent[k]; if (!e) return; const ch = {}; Object.entries(ps).forEach(([pk, v]) => { if (v !== '' && v != null && +v !== e.p[pk]) ch[pk] = +v; }); if (Object.keys(ch).length) p.ent[k] = ch; });
    p.ear = d.ear.slice();
    p.policy = d.policy.slice();
    Object.entries(d.sale).forEach(([k, v]) => { if (+v) p.sale[k] = +v * 1e6; });
    Object.entries(d.prem).forEach(([k, v]) => { if (+v) p.prem[k] = +v; });
    Object.entries(d.eff).forEach(([k, v]) => { if (+v) p.eff[k] = +v; });
    Object.entries(d.fee).forEach(([k, v]) => { if (+v) p.fee[k] = +v * 1e6; });
    return p;
  }

  function constructor(s) {
    const d = draftFor(s);
    const J = s.jur[d.jur];
    const F = J.F;
    const me = s.pols.me;
    const due = s.budgetDue && s.budgetDue[d.jur];
    const prov = toProv(s, d);
    const b = L().newBill(s, d.jur, { title: d.title || 'Draft', prov, spon: 'me', kind: d.kind === 'budget' ? 'budget' : d.kind });
    const cost = L().introCost(s, b);
    const err = d.kind === 'budget' ? null : L().validate(s, b);
    const taxes = FX().LEVEL_TAXES[J.k].filter((k) => F.tax[k] != null);
    const inp = (id, act, arg, val, step, w = 80) => `<input class="input num" style="max-width:${w}px" type="number" step="${step}" id="${id}" value="${val === 0 || val ? esc(val) : ''}" data-in="${act}" data-a="${esc(arg)}">`;
    const entDefs = FX().ENTS[J.k] || [];
    const bk = G().myBody(s);
    const earMembers = bk ? W().members(s, bk).filter((p) => !p.isPlayer).sort((a, b2) => G().rel(s, b2.id) - G().rel(s, a.id)).slice(0, 80) : [];
    const lvl = GR.lvlOf(J.k);
    const ridePols = GR.policiesFor(J.k).filter((p) => !['incometax', 'corptax', 'capgains', 'estatetax', 'propertytax'].includes(p.k));
    const fac = Object.keys(GR.billgen.FACTIONS);
    const tools = Object.keys(GR.billgen.TOOLS);
    return `<div class="stack">
      <div class="box boxpad stack-s" style="background:var(--row)">
        <div class="row"><b>Bill type</b><div class="seg">${[['regular', 'Regular order'], J.k === 'nation' ? ['reconciliation', 'Budget reconciliation'] : null, ['supplemental', 'Emergency supplemental'], due ? ['budget', `FY${due.fy} budget`] : null].filter(Boolean).map(([k, l]) => `<button aria-pressed="${d.kind === k}" data-act="dkind" data-a="${k}">${l}</button>`).join('')}</div>
        <input class="input grow" id="dtitle" placeholder="Bill title (optional)" value="${esc(d.title)}" data-in="dtitle"></div>
        <div class="row small"><b>Draw from the policy deck:</b>
          <select class="input" id="dfac" style="max-width:150px">${fac.map((k) => `<option value="${k}">${GR.billgen.FACTIONS[k].name}</option>`).join('')}</select>
          <select class="input" id="dtool" style="max-width:190px"><option value="">Any tool</option>${tools.map((k) => `<option value="${k}">${esc(GR.billgen.TOOLS[k].name)}</option>`).join('')}</select>
          <select class="input" id="dag" style="max-width:190px"><option value="">Any agency</option>${F.ag.map((a) => `<option value="${a.k}">${esc(a.abbr)}</option>`).join('')}</select>
          <select class="input" id="dcri" style="max-width:220px"><option value="">Top crisis</option>${Object.keys(F.crises).map((k) => `<option value="${k}">${esc(GR.CRISIS_TYPES[k].name)}</option>`).join('')}</select>
          ${ui.btn('Draw card', 'ddraw', '', 'bgr sm')}${due ? ui.btn('Start from current-services budget', 'dbudget', '', 'bgr sm') : ''}${ui.btn('Clear', 'dclear', '', 'bgr sm')}</div>
      </div>
      <div class="cols"><div class="stack">
        <div class="band">1. Revenue & Regulatory Architecture</div>
        ${ui.table(['Tax', { t: 'Current', c: 'r' }, 'Change', { t: 'New', c: 'r' }], taxes.map((k) => { const T = FX().TAXES[k]; const v = d.tax[k] || 0; return `<tr><td>${esc(T.name)}</td><td class="r num">${L().fmtTax(k, F.tax[k])}</td><td>${inp('dt' + k, 'dtax', k, v || '', T.unit === '$/t' ? 5 : T.unit === 'mills' ? 0.5 : 0.1)} <span class="small muted">${T.unit === 'pp' ? 'pp' : T.unit}</span></td><td class="r num">${L().fmtTax(k, U.clamp(F.tax[k] + (+v || 0), T.min, T.max))}</td></tr>`; }))}
        ${ui.table(['Industry compliance costs', { t: 'Current', c: 'r' }, 'Change (% of output)'], GR.INDUSTRIES.map((x) => `<tr><td>${esc(x.name)}</td><td class="r num">${U.round(F.reg[x.k] || 0, 1)}%</td><td>${inp('dr' + x.k, 'dreg', x.k, d.reg[x.k] || '', 0.1)}</td></tr>`))}
        <div class="band">3. Entitlement & Policy Triggers</div>
        ${ui.table(['Program', 'Parameter', { t: 'Current', c: 'r' }, 'New value'], entDefs.filter((e) => F.ent[e.k]).flatMap((e) => e.params.map((pd, i) => `<tr><td>${i === 0 ? '<b>' + esc(e.name) + '</b>' : ''}</td><td class="small">${esc(pd[1])}</td><td class="r num">${L().fmtParam(pd, F.ent[e.k].p[pd[0]])}</td><td>${inp(`de${e.k}${pd[0]}`, 'dent', e.k + '|' + pd[0], (d.ent[e.k] || {})[pd[0]] != null ? d.ent[e.k][pd[0]] : '', pd[5], 100)}</td></tr>`)))}
        <div class="subhead">Policy riders</div>
        <div class="row"><select class="input grow" id="dpk">${ridePols.map((p) => `<option value="${p.k}">${esc(p.name)}: ${esc(GR.policyOpts(p, lvl)[J.law[p.k]])}</option>`).join('')}</select><select class="input" id="dpto" style="max-width:120px">${[0, 1, 2, 3, 4].map((i) => `<option value="${i}">Option ${i + 1}</option>`).join('')}</select>${ui.btn('Add rider', 'drider', '', 'bgr sm')}</div>
        ${d.policy.map((x, i) => { const pol = GR.POLICY[x.k]; return `<div class="opp"><span class="t">${esc(pol.name)} → ${esc(GR.policyOpts(pol, lvl)[x.to] || '')}</span>${ui.btn('X', 'drmrider', String(i), 'bx')}</div>`; }).join('')}
      </div><div class="stack">
        <div class="band">2. Departmental Appropriations</div>
        <p class="small muted">Change each agency's annual operating (salaries, maintenance) and capital (new projects) lines, in percent. Capital spending builds long-run multipliers; inefficient agencies waste part of every dollar.</p>
        ${ui.table(['Agency', { t: 'Operations', c: 'r' }, 'Δ ops %', { t: 'Capital', c: 'r' }, 'Δ cap %', { t: 'Audit', c: 'r' }], F.ag.map((a) => { const v = d.ap[a.k] || {}; return `<tr><td><b>${esc(a.abbr)}</b></td><td class="r num small">${U.money(a.opex)}</td><td>${inp('dao' + a.k, 'dap', a.k + '|opex', v.opex || '', 0.5, 70)}</td><td class="r num small">${U.money(a.capex)}</td><td>${inp('dac' + a.k, 'dap', a.k + '|capex', v.capex || '', 0.5, 70)}</td><td class="r num ${a.eff < 45 ? 'bad' : ''}">${Math.round(a.eff)}</td></tr>`; }))}
        <div class="subhead">Structural tools</div>
        <div class="row small"><select class="input" id="dsag" style="max-width:170px">${F.ag.map((a) => `<option value="${a.k}">${esc(a.abbr)}</option>`).join('')}</select>
          <select class="input" id="dstool" style="max-width:220px"><option value="sale">Privatize assets ($M proceeds)</option><option value="prem">Domestic-content / prevailing-wage mandate (% cost)</option><option value="eff">Management reform (efficiency points)</option><option value="fee">New user fee / toll ($M per year)</option></select>
          <input class="input num" id="dsval" style="max-width:100px" type="number" placeholder="value">${ui.btn('Add', 'dstruct', '', 'bgr sm')}</div>
        ${['sale', 'prem', 'eff', 'fee'].flatMap((k) => Object.entries(d[k]).map(([ak, v]) => `<div class="opp"><span class="t">${{ sale: 'Privatize', prem: 'Procurement mandate', eff: 'Management reform', fee: 'User fee' }[k]}: ${esc(k === 'fee' ? ak : (F.ag.find((a) => a.k === ak) || {}).abbr)} ${k === 'sale' || k === 'fee' ? U.money(v * 1e6) : v}</span>${ui.btn('X', 'drmstruct', k + '|' + ak, 'bx')}</div>`)).join('')}
        <div class="band">4. Earmarks (pork-barrel projects)</div>
        <p class="small muted">Directing a project to a colleague's district is the fastest way to buy their vote.</p>
        ${bk ? `<div class="row"><select class="input grow" id="demem">${earMembers.map((p) => `<option value="${p.id}">${esc(W().fullName(p))} (${p.party}${p.fed ? '-' + p.fed.st : ''}) · ${G().relLabel(G().rel(s, p.id))}</option>`).join('')}</select><input class="input num" id="deamt" style="max-width:110px" type="number" placeholder="$ millions"><select class="input" id="deag" style="max-width:140px">${F.ag.filter((a) => a.capex > 0).map((a) => `<option value="${a.k}">${esc(a.abbr)}</option>`).join('')}</select>${ui.btn('Add', 'dear', '', 'bgr sm')}</div>` : '<p class="small muted">Executives earmark through their budget.</p>'}
        ${d.ear.map((e, i) => `<div class="opp"><span class="t">${esc(e.proj)} — ${U.money(e.amt)} (${ui.pname(s, e.who)})</span>${ui.btn('X', 'drmear', String(i), 'bx')}</div>`).join('')}
      </div></div>
      <div class="band">${esc(fiscalOffice(s, d.jur))} score & whip projection</div>
      <div class="row">${ui.btn('Run the numbers', 'danalyze', '', 'bb pill')}${d.kind === 'budget' ? ui.btn('Submit budget to the legislature', 'dsubmitbudget', '', 'next') : ui.btn(`Introduce bill (${cost} pts, 6 hours)`, 'dintro', '', 'next', !!err || me.pp < cost || s.hoursLeft < 6)}${err ? `<span class="small bad">${esc(err)}</span>` : ''}</div>
      ${d.an ? analysisPanel(s, d.an, b) : '<p class="small muted">Set provisions, then run the numbers to see the dynamic score and how every lawmaker would vote.</p>'}
    </div>`;
  }

  function analysisPanel(s, an, b) {
    const J = s.jur[b.jur];
    const yrs = an.years;
    const desc = L().describe(s, b);
    const crises = Object.entries(an.crises).filter(([, v]) => Math.abs(v) >= 0.5).sort((a, c) => a[1] - c[1]);
    const chambers = G().bodiesOf(s, b.jur);
    const whips = chambers.map((bk) => { const r = L().roll(s, b, bk, { noise: false, myVote: G().myBody(s) === bk ? 'y' : null }); return { bk, r }; });
    return `<div class="cols"><div class="stack">
      ${ui.table(['Provision'], desc.map((x) => `<tr><td class="small">${esc(x)}</td></tr>`), { empty: 'No provisions yet.' })}
      ${ui.kv([
        ['First-year revenue change (static)', U.money(an.static.rev)], ['First-year spending change (static)', U.money(an.static.spend)],
        [`${yrs}-year deficit impact (dynamic)`, `<b class="${an.cumDef > 0 ? 'bad' : 'good'}">${an.cumDef >= 0 ? '+' : '−'}${U.money(Math.abs(an.cumDef))}</b>`],
        ['Real GDP, year 2 / year ' + yrs, `${pctS(an.gdp2, 2)}% / <b class="${an.gdpEnd >= 0 ? 'good' : 'bad'}">${pctS(an.gdpEnd, 2)}%</b>`],
        ['Unemployment, year 2', `${pctS(an.u2, 2)} pts (${an.jobs >= 0 ? '+' : '−'}${U.num(Math.abs(Math.round(an.jobs)))} jobs)`], ['Inflation, year 2', `${pctS(an.pi2, 2)} pts`],
        [J.k === 'nation' ? 'Debt-to-GDP, year ' + yrs : 'Debt, year ' + yrs, J.k === 'nation' ? `${pctS(an.debtGDP, 2)} pts` : U.money(an.debtEnd)], ['Interest costs, year ' + yrs, U.money(an.intEnd)],
        ['Credit rating, year ' + yrs, `${an.rating[0]} → <b>${an.rating[1]}</b>`],
      ])}
      ${Object.keys(an.dist || {}).length ? ui.table(['Tax change by bracket', { t: 'Annual revenue', c: 'r' }], Object.entries(an.dist).map(([k, v]) => `<tr><td>${esc(FX().TAXES[k].name)}</td><td class="r num ${v > 0 ? '' : 'good'}">${v >= 0 ? '+' : '−'}${U.money(Math.abs(v))}</td></tr>`)) : ''}
      ${crises.length ? ui.table(['Crisis impact after ' + yrs + ' years', { t: 'Severity', c: 'r' }], crises.map(([k, v]) => `<tr><td>${esc(GR.CRISIS_TYPES[k].name)}</td><td class="r num ${v < 0 ? 'good' : 'bad'}">${pctS(v, 1)}</td></tr>`)) : ''}
    </div><div class="stack">${whips.map(({ bk, r }) => whipBox(s, b, bk, r)).join('')}</div></div>`;
  }

  // Vote projection broken down by party, caucus and the four score components.
  function whipBox(s, b, bk, r) {
    const need = L().needed(s, b, bk, b.body === 'ussenate' && bk === 'ussenate' && b.kind !== 'reconciliation' && b.kind !== 'budget' ? 'cloture' : 'floor');
    const groups = {};
    r.rows.forEach((x) => { const k = x.party + '|' + x.caucus; const g = groups[k] || (groups[k] = { n: 0, y: 0, it: 0, di: 0, ae: 0, pc: 0 }); g.n++; if (x.v === 'y') g.y++; g.it += x.c.it; g.di += x.c.di; g.ae += x.c.ae; g.pc += x.c.pc; });
    const cName = (k) => { const [p, c] = k.split('|'); const cc = W().CAUCUSES[p].find((x) => x.k === c); return `${ui.chip(p)} ${esc(cc ? cc.name : c)}`; };
    const swing = r.rows.filter((x) => x.v === 'n').sort((a, c) => c.final - a.final).slice(0, 6);
    const cloture = bk === 'ussenate' && b.kind !== 'reconciliation';
    return `<div class="box"><div class="band">${GR.BODIES[bk].name}: <span class="${r.y >= need ? '' : ''}">${r.y} yes – ${r.n} no</span> · ${need} needed${cloture ? ' (cloture)' : ''}</div><div class="boxpad stack-s">
      ${ui.table(['Bloc', { t: 'Yes', c: 'r' }, { t: 'Tax ideology ×0.3', c: 'r' }, { t: 'District ×0.3', c: 'r' }, { t: 'Agency audit ×0.2', c: 'r' }, { t: 'Capital/earmarks ×0.2', c: 'r' }], Object.entries(groups).sort((a, c) => c[1].n - a[1].n).map(([k, g]) => `<tr><td class="small">${cName(k)}</td><td class="r num">${g.y}/${g.n}</td><td class="r num ${cls(g.it, 1)}">${(g.it / g.n).toFixed(2)}</td><td class="r num ${cls(g.di, 1)}">${(g.di / g.n).toFixed(2)}</td><td class="r num ${cls(g.ae, 1)}">${(g.ae / g.n).toFixed(2)}</td><td class="r num ${cls(g.pc, 1)}">${(g.pc / g.n).toFixed(2)}</td></tr>`))}
      ${swing.length ? `<div class="small"><b>Closest no votes:</b> ${swing.map((x) => `${ui.pname(s, x.id)} (${x.final.toFixed(2)})`).join(', ')}</div>` : ''}
    </div></div>`;
  }

  // ---------- 3. Docket ----------
  function docket(s) {
    const J = myJ(s);
    const tasks = G().tasks(s);
    const bills = (J.bills || []).slice().reverse();
    const mine = bills.filter((b) => b.spon === 'me');
    const others = bills.filter((b) => b.spon !== 'me');
    const stage = (b) => ({ committee: b.blockedBy ? `Blocked in committee` : b.held ? 'Held by the chair' : 'Awaiting hearing', markup: 'Committee markup', cloture: 'Cloture vote', floor: 'Floor vote', exec: 'Awaiting signature', law: 'Law', dead: 'Failed', vetoed: 'Vetoed' }[b.stage]) + (b.stage !== 'law' && b.stage !== 'dead' && b.stage !== 'vetoed' ? ` · ${GR.BODIES[b.body].name}` : '');
    const tag = (b) => `${b.fac ? `<span class="chip">${esc(GR.billgen.FACTIONS[b.fac].name)}</span> ` : ''}${b.kind !== 'regular' ? `<span class="chip">${esc({ budget: 'Budget', cr: 'CR', reconciliation: 'Reconciliation', supplemental: 'Supplemental' }[b.kind])}</span>` : ''}`;
    const vb = (t) => { const b = t.b; if (t.kind === 'vote') return `${ui.btn('Yea', 'decide', `${b.id}|vote|y`, 'bgr sm yes')}${ui.btn('Nay', 'decide', `${b.id}|vote|n`, 'bgr sm no')}${ui.btn('Present', 'decide', `${b.id}|vote|a`, 'bgr sm')}`; if (t.kind === 'comm') return chairButtons(b); if (t.kind === 'cvote') return `${ui.btn('Report favorably', 'decide', `${b.id}|cvote|y`, 'bgr sm yes')}${ui.btn('Oppose', 'decide', `${b.id}|cvote|n`, 'bgr sm no')}${ui.btn('Pass', 'decide', `${b.id}|cvote|a`, 'bgr sm')}`; return `${ui.btn('Sign', 'decide', `${b.id}|sign|y`, 'bgr sm yes')}${ui.btn('Veto', 'decide', `${b.id}|sign|n`, 'bgr sm no')}`; };
    return `<div class="stack">
      ${tasks.length ? `<div class="band">Waiting on you (${tasks.length})</div><div>${tasks.map((t) => { const c = L().components(s, s.pols.me, t.b); return `<div class="act"><span class="t">${tag(t.b)}<b>${esc(t.b.title)}</b><br><span class="small">${esc(t.b.sum || '')}</span><br><span class="small muted">${t.kind === 'vote' ? (t.b.stage === 'cloture' ? 'Cloture vote' : 'Floor vote') : t.kind === 'comm' ? `You chair ${esc(GR.comm.nameOf(t.b.body, t.b.comm))}: schedule it, fast-track it, hold it, or table it` : t.kind === 'cvote' ? `Markup in ${esc(GR.comm.nameOf(t.b.body, t.b.comm))}: amend it (Details), then vote to report it` : 'On your desk'} · Sponsor ${t.b.spon ? ui.pname(s, t.b.spon) : 'leadership'} · Your district score ${c.di.toFixed(2)}, party line ${L().partyLine(s, t.b, s.pols.me.party) > 0 ? 'yes' : L().partyLine(s, t.b, s.pols.me.party) < 0 ? 'no' : 'free vote'}</span></span><span class="row">${ui.btn('Details', 'billview', t.b.id, 'bgr sm')}${vb(t)}</span></div>`; }).join('')}</div>` : '<div class="note">No votes are waiting on you this week.</div>'}
      <div class="band">Your legislation</div>
      ${ui.table(['Bill', 'Stage', 'Votes', ''], mine.map((b) => `<tr><td>${tag(b)}<b>${esc(b.title)}</b><br><span class="small">${esc(b.sum || '')}</span></td><td class="small">${stage(b)}${b.why ? '<br><span class="muted">' + esc(b.why) + '</span>' : ''}${b.blockedBy ? '<br>by ' + ui.pname(s, b.blockedBy) : ''}</td><td class="small">${b.votes.map((v) => `${GR.BODIES[v.body].name} ${v.stage === 'cloture' ? 'cloture ' : ''}${v.y}-${v.n}`).join('<br>')}</td><td class="row">${ui.btn('Details', 'billview', b.id, 'bgr sm')}${L().OPEN(b) ? ui.btn('Negotiate', 'gonego', b.id, 'bb sm') + (b.stage === 'committee' && hearingNeeded(s, b) ? ui.btn('Lobby chair', 'nego', `${b.id}|${s.bodies[b.body].comm[b.comm].chair}|hearing`, 'bgr sm', s.hoursLeft < 3) : '') + ui.btn('Call vote', 'callvote', b.id, 'bgr sm') + (['committee', 'markup'].includes(b.stage) && b.body !== 'ussenate' ? ui.btn('Discharge', 'discharge', b.id, 'bgr sm') : '') : ''}</td></tr>`), { empty: 'You have not introduced legislation. Open the Bill Constructor.' })}
      <div class="band">Docket: ${esc(J.name)} (${others.filter((b) => L().OPEN(b)).length} pending)</div>
      ${ui.table(['Bill', 'Sponsor', 'Stage', 'Last vote', ''], others.slice(0, 40).map((b) => `<tr><td>${tag(b)}${esc(b.title)}<br><span class="small muted">${esc(b.sum || '')}</span></td><td class="small">${b.spon ? ui.plink(s, b.spon) : 'Leadership'}</td><td class="small">${stage(b)}${b.why ? '<br><span class="muted">' + esc(b.why) + '</span>' : ''}</td><td class="small">${b.votes.length ? b.votes[b.votes.length - 1].y + '-' + b.votes[b.votes.length - 1].n : ''}</td><td class="row">${ui.btn(GR.comm.canMarkup(s, b) ? 'Markup' : 'Details', 'billview', b.id, GR.comm.canMarkup(s, b) ? 'bb sm' : 'bgr sm')}${b.stage === 'committee' && G().myBody(s) && b.spon && !b.cos.includes('me') ? ui.btn('Co-sponsor', 'cosp', b.id, 'bgr sm') : ''}</td></tr>`), { empty: 'Nothing on the docket yet. Legislatures meet in session.' })}
      <div class="band">Recent laws</div>
      ${ui.table(['Date', 'Law'], J.laws.slice(0, 15).map((l) => `<tr><td class="num" style="white-space:nowrap">${U.fmtDate(l.w)}</td><td class="small">${esc(l.t)}${l.spon === 'me' ? ' <b>(yours)</b>' : ''}</td></tr>`), { empty: 'No new laws yet.' })}
    </div>`;
  }

  function billModal(s, id) {
    const b = L().findBill(s, id);
    if (!b) return `<div class="band">Bill</div><div class="sheet">This bill is no longer on the docket. ${ui.btn('Close', 'closeOverlay', '', 'bgr')}</div>`;
    if (!b.an) L().analysis(s, b);
    const rolls = (s.rolls || []).filter((r) => r.bill === b.id);
    return `<div class="band">${esc(b.title)}</div><div class="sheet stack">
      <div class="small">${b.fac ? `${esc(GR.billgen.FACTIONS[b.fac].name)} bill · ` : ''}${b.tool ? esc(GR.billgen.TOOLS[b.tool].name) + ' · ' : ''}${b.crisis ? 'Targets ' + esc(GR.CRISIS_TYPES[b.crisis].name.toLowerCase()) + ' · ' : ''}Sponsor ${b.spon ? ui.plink(s, b.spon) : 'leadership'} · Referred to ${esc(L().committeeName(s, b))}</div>
      ${committeePanel(s, b)}
      ${analysisPanel(s, b.an, b)}
      ${rolls.length ? `<div class="band">Roll calls</div>${rolls.map((r) => `<div class="opp"><span class="t">${GR.BODIES[r.body].name} ${r.stage}: ${r.y}-${r.n} (${r.need} needed)</span>${ui.btn('View roll call', 'rollview', r.id, 'bgr sm')}</div>`).join('')}` : ''}
      ${ui.btn('Close', 'closeOverlay', '', 'bgr')}</div>`;
  }

  // ---------- Committees ----------
  const CM = () => GR.comm;
  const hearingNeeded = (s, b) => { const c = s.bodies[b.body] && s.bodies[b.body].comm[b.comm]; return !!(c && c.chair && c.chair !== 'me' && !b.agreed[c.chair]); };
  function chairButtons(b) {
    const must = ['budget', 'cr'].includes(b.kind);
    return `${ui.btn('Hearing & markup', 'decide', `${b.id}|comm|y`, 'bgr sm yes')}${ui.btn('Fast-track', 'decide', `${b.id}|comm|f`, 'bgr sm yes')}${must ? '' : ui.btn('Hold', 'decide', `${b.id}|comm|h`, 'bgr sm') + ui.btn('Table', 'decide', `${b.id}|comm|n`, 'bgr sm no')}`;
  }

  // Committee box inside the bill view: who holds the gavel, the markup record, and your amendments.
  function committeePanel(s, b) {
    const Bd = s.bodies[b.body];
    if (!Bd || !Bd.comm[b.comm] || !L().OPEN(b)) return '';
    const c = Bd.comm[b.comm];
    const role = c.chair === 'me' ? 'You chair this committee' : c.rank === 'me' ? 'You are the ranking member' : CM().isMember(s, b.body, b.comm, 'me') ? 'You sit on this committee' : 'You are not on this committee';
    const am = b.amends || [];
    const inComm = ['committee', 'markup'].includes(b.stage);
    let opts = '';
    if (CM().canMarkup(s, b)) {
      const os = CM().markupOptions(s, b);
      const groups = {};
      os.forEach((o) => { (groups[o.group] || (groups[o.group] = [])).push(o); });
      opts = `<div class="band">Markup: offer an amendment (2 hours each)</div>${Object.entries(groups).map(([g, list]) => `<div class="small"><b>${esc(g)}</b></div>${list.map((o) => `<div class="opp"><span class="t small">${esc(o.label)}</span>${ui.btn(`Offer (${o.cost} PP)`, 'markup', `${b.id}|${o.k}`, 'bgr sm', s.hoursLeft < 2 || s.pols.me.pp < o.cost)}</div>`).join('')}`).join('')}
        <p class="small muted">${c.chair === 'me' ? 'As chair you control the markup: your amendments are adopted without a vote.' : 'Each amendment is put to a committee vote: members compare their score on the bill with and without it. A chair from the other party can rule hostile amendments non-germane.'}</p>`;
    }
    return `<div class="box"><div class="band">${esc(L().committeeName(s, b))} · ${b.stage === 'markup' ? 'Markup underway' : b.stage === 'committee' ? (b.held ? 'Held by the chair' : b.blockedBy ? 'Chair refuses to schedule it' : 'Awaiting a hearing') : 'Reported to the floor'}</div><div class="boxpad stack-s">
      <div class="small">Chair ${c.chair ? ui.plink(s, c.chair) : '—'} · Ranking member ${c.rank ? ui.plink(s, c.rank) : '—'} · ${c.members.length} members · <b>${role}</b></div>
      ${inComm && c.chair === 'me' && b.stage === 'committee' ? `<div class="row">${chairButtons(b)}</div>` : ''}
      ${inComm && hearingNeeded(s, b) && b.spon === 'me' ? `<div class="row">${ui.btn('Lobby the chair for a hearing', 'nego', `${b.id}|${c.chair}|hearing`, 'bb sm', s.hoursLeft < 3)}</div>` : ''}
      ${am.length ? ui.table(['Amendment', 'Offered by', 'Result'], am.map((a) => `<tr><td class="small">${esc(a.label)}</td><td class="small">${a.by === 'me' ? 'You' : ui.pname(s, a.by)}</td><td class="small ${a.ok ? 'good' : 'bad'}">${a.ok ? 'Adopted' : 'Rejected'}${a.y != null ? ` ${a.y}-${a.n}` : ''}${a.why ? ' · ' + esc(a.why) : ''}</td></tr>`)) : '<div class="small muted">No amendments yet.</div>'}
      ${opts}
    </div></div>`;
  }

  // Office → Committees: steering bids, your posts, dockets, and every committee in the chamber.
  function committees(s) {
    const bk = G().myBody(s);
    const B = bk && s.bodies[bk];
    if (!B) return '<p>Your office has no committees.</p>';
    CM().migrate(s, bk);
    const me = s.pols.me;
    const list = CM().listFor(bk);
    const tierChip = (t) => `<span class="chip">${esc(GR.COMMITTEE_TIERS[t].name)}</span>`;
    const pct = (p) => `${Math.round(p * 100)}%`;
    const st = s.steer && s.steer.body === bk ? s.steer : null;
    let steer = '';
    if (st && !st.done) {
      const slots = GR.COMMITTEE_SLOTS[bk] || 2;
      const used = U.sum(st.picks, (k) => CM().slotCost(bk, k));
      const lead = CM().steerLeader(s, bk);
      const dues = CM().duesAmount(bk);
      const elig = list.filter((c) => CM().canBidGavel(s, bk, c.k));
      const g = st.gavel ? CM().gavelOdds(s, bk, st.gavel, st) : null;
      steer = `<div class="box"><div class="band">Steering Committee: assignments for the new session · meets ${U.fmtDate(st.due)}</div><div class="boxpad stack-s">
        <p class="small">${lead ? `${ui.plink(s, lead.id)} runs the ${me.party} steering committee (${G().relLabel(G().rel(s, lead.id)).toLowerCase()} with you). ` : ''}You can sit on <b>${slots}</b> committees (${used} requested), at most <b>${CM().maxA(bk)}</b> of them exclusive. Seats go by seniority, respect, your standing with the party, the political capital you put up, and the favors you trade with leadership.</p>
        ${ui.table(['Committee', 'Tier', { t: 'Seats', c: 'r' }, { t: 'Open for ' + me.party, c: 'r' }, 'Covers', { t: 'Odds', c: 'r' }, ''], list.map((c) => { const on = st.picks.includes(c.k); const q = CM().quota(s, bk, c.k); const open = CM().openSeats(s, bk, c.k, me.party); return `<tr><td><b>${esc(CM().nameOf(bk, c.k))}</b>${CM().isMember(s, bk, c.k, 'me') ? ' <span class="small muted">(current)</span>' : ''}</td><td>${tierChip(c.tier)}</td><td class="r num">${B.comm[c.k].sz} (${q[q.maj]}-${B.comm[c.k].sz - q[q.maj]})</td><td class="r num ${open > 0 ? 'good' : 'bad'}">${open}</td><td class="small">${esc(c.cats.join(', '))}</td><td class="r num">${pct(CM().seatOdds(s, bk, c.k, st))}</td><td class="row">${ui.btn(on ? 'Requested' : 'Request', 'steer', `toggle|${c.k}`, on ? 'bb sm' : 'bgr sm')}${on && st.picks.indexOf(c.k) > 0 ? ui.btn('↑', 'steer', `up|${c.k}`, 'bgr sm') : ''}</td></tr>`; }))}
        <div class="small"><b>Your requests in priority order:</b> ${st.picks.map((k) => esc(CM().nameOf(bk, k))).join(' → ') || 'none'}</div>
        <div class="band">Trade favors with leadership</div>
        ${[['loyalty', 'Loyalty pledge', 'Vote with leadership on its next 3 party-line priorities. Break it twice and you lose a seat.'], ['dues', `Pay party dues (${U.money(dues)})`, `From your war chest (${U.money(me.warChest)}).`], ['carry', 'Carry the leader\'s bill', 'You owe the leader a yes vote on their next priority.']].map(([k, n, d]) => `<div class="opp"><span class="t"><b>${n}</b><br><span class="small">${d}</span></span>${ui.btn(st.favors[k] ? 'Offered' : 'Offer', 'steer', `favor|${k}`, st.favors[k] ? 'bb sm' : 'bgr sm', k === 'dues' && me.warChest < dues && !st.favors[k])}</div>`).join('')}
        <div class="row"><b>Political capital to spend on seats</b><input class="input num" style="max-width:90px" type="number" min="0" step="5" value="${st.pp}" data-in="steerpp"><span class="small muted">You have ${Math.floor(me.pp)} PP</span></div>
        <div class="band">Bid for a gavel</div>
        ${elig.length ? `<div class="row"><select class="input" data-ch="steergavel"><option value="">No gavel bid</option>${elig.map((c) => `<option value="${c.k}" ${st.gavel === c.k ? 'selected' : ''}>${esc(CM().nameOf(bk, c.k))} ${W().majority(s, bk) === me.party ? 'chair' : 'ranking member'}</option>`).join('')}</select><b>PP</b><input class="input num" style="max-width:90px" type="number" min="0" step="5" value="${st.gavelPP}" data-in="steergpp"></div>${g ? `<div class="small">Odds ${pct(g.p)} against ${g.rival ? ui.plink(s, g.rival.id) + ` (${CM().seniorityRank(s, bk, st.gavel, g.rival.id) ? 'committee seniority ' + (B.comm[st.gavel].sen[g.rival.id] || 0) : ''})` : 'no rival'}. Your committee seniority: ${B.comm[st.gavel].sen.me || 0}.</div>` : ''}` : '<div class="small muted">You need at least one session on a committee before you can bid for its gavel.</div>'}
        <div class="row">${ui.btn('Submit to steering now', 'steergo', '', 'bb')}</div>
      </div></div>`;
    } else if (st && st.done && st.result) steer = `<div class="note"><b>Steering results:</b><br>${st.result.map(esc).join('<br>')}</div>`;
    const posts = CM().myPosts(s);
    const mine = posts.map((x) => x.k);
    const J = s.jur[GR.BODIES[bk].jur];
    const pend = (J.bills || []).filter((b) => L().OPEN(b) && b.body === bk && ['committee', 'markup'].includes(b.stage) && mine.includes(b.comm));
    const dk = pend.map((b) => { const c = B.comm[b.comm]; return `<tr><td><b>${esc(b.title)}</b><br><span class="small muted">${esc(b.sum || '')}</span></td><td class="small">${esc(CM().nameOf(bk, b.comm))}</td><td class="small">${b.spon ? ui.plink(s, b.spon) : 'Leadership'}</td><td class="small">${b.stage === 'markup' ? 'Markup' : b.held ? 'Held' : c.chair === 'me' ? 'Awaiting your decision' : b.blockedBy ? 'Chair blocking' : 'Awaiting hearing'}</td><td class="row">${c.chair === 'me' && b.stage === 'committee' && !b.my['comm' + b.body] ? chairButtons(b) : ''}${ui.btn(CM().canMarkup(s, b) ? 'Markup' : 'Details', 'billview', b.id, 'bb sm')}</td></tr>`; });
    const maj = W().majority(s, bk);
    return `<div class="stack">
      ${steer}
      <p class="small">Committees are the gatekeepers. A bill reaches the floor only if its chair schedules a hearing and the committee votes it out after markup. Chairs have agenda control: they can fast-track, hold or table anything referred to them. Members get the markup, where earmarks and amendments are written. Everyone else has to lobby the chair.</p>
      <div class="band">Your committee posts</div>
      ${ui.table(['Committee', 'Tier', 'Role', { t: 'Seniority', c: 'r' }, { t: 'Party rank', c: 'r' }, 'Chair', 'Ranking'], posts.map((x) => { const c = B.comm[x.k]; return `<tr><td><b>${esc(x.name)}</b></td><td>${tierChip(x.tier)}</td><td>${x.role === 'Member' ? 'Member' : `<b>${x.role}</b>`}</td><td class="r num">${x.sen} session${x.sen === 1 ? '' : 's'}</td><td class="r num">${x.rank ? `${x.rank.rank} of ${x.rank.of}` : ''}</td><td class="small">${c.chair ? ui.plink(s, c.chair) : '—'}</td><td class="small">${c.rank ? ui.plink(s, c.rank) : '—'}</td></tr>`; }), { empty: 'No committee assignments yet.' })}
      ${s.whipDebt ? `<div class="note">You owe leadership ${s.whipDebt.n} more party-line vote${s.whipDebt.n === 1 ? '' : 's'} for your committee seats${s.whipDebt.breaches ? ` (${s.whipDebt.breaches} broken already)` : ''}.</div>` : ''}
      <div class="band">Your committee dockets (${pend.length})</div>
      ${ui.table(['Bill', 'Committee', 'Sponsor', 'Status', ''], dk, { empty: 'No bills are pending in your committees.' })}
      <div class="band">All committees: ${esc(GR.BODIES[bk].name)}</div>
      ${ui.table(['Committee', 'Tier', 'Chair', 'Ranking', { t: 'Seats ' + maj + '-' + GR.other(maj), c: 'r' }, { t: 'Open for ' + me.party, c: 'r' }, ''], list.map((c) => { const cm = B.comm[c.k]; const a = cm.members.filter((id) => s.pols[id] && s.pols[id].party === maj).length; const open = CM().openSeats(s, bk, c.k, me.party); return `<tr><td>${esc(CM().nameOf(bk, c.k))}</td><td>${tierChip(c.tier)}</td><td class="small">${cm.chair ? ui.plink(s, cm.chair) : '—'}</td><td class="small">${cm.rank ? ui.plink(s, cm.rank) : '—'}</td><td class="r num">${a}-${cm.members.length - a}</td><td class="r num">${open}</td><td>${CM().isMember(s, bk, c.k, 'me') ? '<span class="small">Member</span>' : open > 0 && !(st && !st.done) ? ui.btn(`Transfer (${25 + (c.tier === 'A' ? 30 : 0)} PP)`, 'reqcomm', c.k, 'bgr sm') : ''}</td></tr>`; }))}
    </div>`;
  }

  // ---------- 4. Negotiations ----------
  function negotiations(s) {
    const J = myJ(s);
    const mine = (J.bills || []).filter((b) => b.spon === 'me' && L().OPEN(b));
    if (!mine.length) return '<p>You have no bills moving. Introduce one with the Bill Constructor, then come back to work the votes.</p>';
    const b = mine.find((x) => x.id === ui.sel.nego) || mine[0];
    const cps = L().counterparties(s, b);
    return `<div class="stack">
      <div class="row"><b>Bill</b><select class="input grow" id="negosel" data-ch="negosel">${mine.map((x) => `<option value="${x.id}" ${x === b ? 'selected' : ''}>${esc(x.title)} — ${esc(x.stage)}</option>`).join('')}</select></div>
      <p class="small">${b.stage === 'committee' || b.stage === 'markup' ? `Your bill sits in ${esc(L().committeeName(s, b))}. ${GR.comm.isMember(s, b.body, b.comm, 'me') ? 'You are on this committee, so you can write earmarks and amendments into it in markup.' : 'You do not sit on this committee: lobby the chair for a hearing, and leave earmarks to its members.'} ` : ''}Every deal changes how that lawmaker scores your bill: earmarks raise their political-capital component, amendments shift their ideological and district scores, trades and political capital add direct support. A committee chair who reaches a positive score agrees to release the bill.</p>
      ${ui.table(['Lawmaker', 'Role', { t: 'Score', c: 'r' }, { t: 'Ideol.', c: 'r' }, { t: 'District', c: 'r' }, { t: 'Audit', c: 'r' }, { t: 'Capital', c: 'r' }, 'Deals'], cps.map((x) => { const p = s.pols[x.id]; return `<tr><td>${ui.plink(s, x.id)}${p.fed ? ` <span class="small muted">${p.fed.st}</span>` : ''}<br><span class="small">${G().relLabel(G().rel(s, x.id))}</span></td><td class="small">${esc(x.role)}${b.agreed[x.id] ? ' · <b class="good">agreed</b>' : ''}${b.pledges[x.id] ? ' · <b class="good">pledged</b>' : ''}</td><td class="r num ${x.c.score > 0 ? 'good' : 'bad'}">${x.c.score.toFixed(2)}</td><td class="r num">${x.c.it.toFixed(2)}</td><td class="r num">${x.c.di.toFixed(2)}</td><td class="r num">${x.c.ae.toFixed(2)}</td><td class="r num">${x.c.pc.toFixed(2)}</td><td class="row">${x.role === 'Committee chair' && b.stage === 'committee' && !b.agreed[x.id] ? ui.btn('Lobby for hearing', 'nego', `${b.id}|${x.id}|hearing`, 'bb sm', s.hoursLeft < 3) : ''}${['earmark', 'amend', 'trade', 'capital', 'pledge'].map((k) => ui.btn({ earmark: 'Earmark', amend: 'Amend', trade: 'Trade', capital: 'Capital', pledge: 'Pledge' }[k], 'nego', `${b.id}|${x.id}|${k}`, 'bgr sm', s.hoursLeft < 2 || (k === 'earmark' && !L().canEarmark(s, b)))).join('')}</td></tr>`; }))}
      <div class="row">${ui.btn('Call the vote', 'callvote', b.id, 'bb sm')}${['committee', 'markup'].includes(b.stage) && b.body !== 'ussenate' ? ui.btn('File discharge petition', 'discharge', b.id, 'bgr sm') : ''}${ui.btn(GR.comm.canMarkup(s, b) ? 'Open markup' : 'Bill details', 'billview', b.id, 'bgr sm')}</div>
    </div>`;
  }

  // ---------- 5. Roll calls ----------
  function rolls(s) {
    const list = s.rolls || [];
    if (!list.length) return '<p>No recorded roll calls yet. Votes in your chamber and on your bills appear here.</p>';
    const r = list.find((x) => x.id === ui.sel.roll) || list[0];
    return `<div class="stack"><div class="row"><select class="input grow" id="rollsel" data-ch="rollsel">${list.map((x) => `<option value="${x.id}" ${x === r ? 'selected' : ''}>${U.fmtDate(x.w)} · ${esc(x.title)} · ${GR.BODIES[x.body].name} ${x.stage} ${x.y}-${x.n}</option>`).join('')}</select></div>${rollDetail(s, r)}</div>`;
  }
  function rollDetail(s, r) {
    const sort = ui.sel.rsort || 'score';
    const rows = r.rows.slice().sort((a, b) => (sort === 'score' ? b[2] - a[2] : sort === 'party' ? (s.pols[a[0]] ? s.pols[a[0]].party : '').localeCompare(s.pols[b[0]] ? s.pols[b[0]].party : '') : 0));
    const by = {};
    r.rows.forEach((x) => { const p = s.pols[x[0]]; if (!p) return; const k = p.party; const g = by[k] || (by[k] = { y: 0, n: 0 }); x[1] === 'y' ? g.y++ : g.n++; });
    return `<div class="box"><div class="band">${esc(r.title)} — ${GR.BODIES[r.body].name} ${r.stage}: ${r.y} yes, ${r.n} no (${r.need} needed) · ${r.y >= r.need ? 'Passed' : 'Failed'}</div><div class="boxpad stack-s">
      <div class="row">${Object.entries(by).map(([p, g]) => `${ui.chip(p)} ${g.y} yes · ${g.n} no`).join(' &nbsp; ')}${r.my ? ` · You voted <b>${r.my === 'y' ? 'yes' : r.my === 'n' ? 'no' : 'present'}</b>` : ''}</div>
      <div class="seg">${[['score', 'By score'], ['party', 'By party']].map(([k, l]) => `<button aria-pressed="${sort === k}" data-act="rsort" data-a="${k}">${l}</button>`).join('')}</div>
      ${ui.table(['Member', 'Vote', { t: 'Score', c: 'r' }, { t: 'Tax ideology', c: 'r' }, { t: 'District', c: 'r' }, { t: 'Agency audit', c: 'r' }, { t: 'Capital', c: 'r' }, { t: 'Rebellion', c: 'r' }], rows.slice(0, 120).map((x) => { const p = s.pols[x[0]]; return `<tr><td class="small">${p ? ui.plink(s, x[0]) + (p.fed ? ' ' + p.fed.st : '') : 'Former member'}</td><td class="${x[1] === 'y' ? 'good' : 'bad'}">${x[1] === 'y' ? 'Yea' : 'Nay'}</td><td class="r num">${x[2].toFixed(2)}</td><td class="r num">${x[3].toFixed(2)}</td><td class="r num">${x[4].toFixed(2)}</td><td class="r num">${x[5].toFixed(2)}</td><td class="r num">${x[6].toFixed(2)}</td><td class="r num">${x[7] ? Math.round(x[7] * 100) + '%' : ''}</td></tr>`; }))}
      ${rows.length > 120 ? `<p class="small muted">Showing 120 of ${rows.length} members.</p>` : ''}</div></div>`;
  }

  // ---------- 6. Budget & 7. Economy ----------
  function budgetView(s) {
    const J = myJ(s);
    const F = J.F;
    const t = FX().totals(J);
    return `<div class="stack">
      <div class="cols">${ui.table([{ t: 'Revenue line', c: '' }, { t: 'Rate', c: 'r' }, { t: 'Annual', c: 'r' }], Object.entries(t.rv).map(([k, v]) => `<tr><td>${esc(v.name)}</td><td class="r num">${F.tax[k] != null ? L().fmtTax(k, F.tax[k]) : ''}</td><td class="r num">${U.money(v.amt)}</td></tr>`).concat([`<tr><td><b>Total revenue</b></td><td></td><td class="r num"><b>${U.money(t.rev)}</b></td></tr>`]))}
      ${ui.table(['Spending', { t: 'Annual', c: 'r' }], [`<tr><td>Agency operations</td><td class="r num">${U.money(t.opex)}</td></tr>`, `<tr><td>Agency capital</td><td class="r num">${U.money(t.capex)}</td></tr>`, `<tr><td>Earmarked projects</td><td class="r num">${U.money(t.ear)}</td></tr>`, `<tr><td>Entitlements & programs</td><td class="r num">${U.money(t.ent)}</td></tr>`, `<tr><td>Interest</td><td class="r num">${U.money(t.interest)}</td></tr>`, J.k !== 'nation' ? `<tr><td>Bond principal</td><td class="r num">${U.money(t.principal)}</td></tr>` : '', J.k !== 'nation' ? `<tr><td>Bond-financed capital (financing)</td><td class="r num">−${U.money(t.bond)}</td></tr>` : '', `<tr><td><b>Total spending</b></td><td class="r num"><b>${U.money(t.spend)}</b></td></tr>`, `<tr><td>${t.bal >= 0 ? 'Surplus' : 'Deficit'}</td><td class="r num ${t.bal >= 0 ? 'good' : 'bad'}">${U.money(t.bal)}</td></tr>`])}</div>
      ${agencyTable(s, J, t)}
      ${Object.keys(F.fees || {}).length ? ui.table(['User fees & tolls', { t: 'Annual', c: 'r' }], Object.entries(t.rv).filter(([k]) => k.startsWith('fee:')).map(([, v]) => `<tr><td>${esc(v.name)}</td><td class="r num">${U.money(v.amt)}</td></tr>`)) : ''}
      ${ui.table(['Industry', { t: 'Compliance cost (% of output)', c: 'r' }], GR.INDUSTRIES.filter((x) => F.reg[x.k]).map((x) => `<tr><td>${esc(x.name)}</td><td class="r num">${U.round(F.reg[x.k], 1)}%</td></tr>`), { empty: 'No changes to regulatory compliance costs yet.' })}
    </div>`;
  }

  function economy(s) {
    const J = myJ(s);
    const F = J.F;
    const H = F.hist;
    if (H.length < 2) return '<p>The quarterly economic calculators have not run yet. Come back after the next quarter starts.</p>';
    const xs = H.map((h, i) => { const q = (h.q - 1) % 4 + 1; return `Q${q}`; });
    const line = (title, series) => `<div class="box boxpad">${ui.lines(series, xs, { title, fmt: (v) => (Math.abs(v) >= 1e6 ? U.money(v) : U.round(v, 1)) })}</div>`;
    const cris = Object.entries(F.crises).sort((a, b) => b[1].s - a[1].s).slice(0, 5);
    const colors = ['#e0342c', '#1f7fd6', '#f5a41c', '#2ea043', '#8e44ad'];
    return `<div class="cols">
      ${line('Real growth & unemployment', [{ name: 'Growth', color: '#2ea043', values: H.map((h) => h.g) }, { name: 'Unemployment', color: '#e0342c', values: H.map((h) => h.u) }])}
      ${line('Inflation & bond yield', [{ name: 'Inflation', color: '#f5a41c', values: H.map((h) => h.pi) }, { name: 'Yield', color: '#1f7fd6', values: H.map((h) => h.y10) }])}
      ${line('Revenue vs. spending', [{ name: 'Revenue', color: '#2ea043', values: H.map((h) => h.rev) }, { name: 'Spending', color: '#e0342c', values: H.map((h) => h.spend) }])}
      ${line('Debt', [{ name: 'Debt', color: '#5b0f6e', values: H.map((h) => h.debt) }])}
      ${line('Consumer confidence & dissatisfaction', [{ name: 'Confidence', color: '#1f7fd6', values: H.map((h) => h.cc) }, { name: 'Voter anger', color: '#e0342c', values: H.map((h) => h.vd) }])}
      <div class="box boxpad">${ui.lines(cris.map(([k, c], i) => ({ name: GR.CRISIS_TYPES[k].name.split(' ')[0], color: colors[i], values: c.hist })), cris[0] ? cris[0][1].hist.map((_, i) => 'Q' + (i + 1)) : [], { title: 'Top crises (last 12 quarters)', min: 0 })}</div>
    </div>
    ${ui.table(['Quarter', { t: 'Growth', c: 'r' }, { t: 'Unemp.', c: 'r' }, { t: 'Inflation', c: 'r' }, { t: 'Deficit', c: 'r' }, { t: 'Debt', c: 'r' }, 'Rating'], H.slice().reverse().slice(0, 12).map((h) => `<tr><td>Q${(h.q - 1) % 4 + 1}</td><td class="r num">${h.g.toFixed(1)}%</td><td class="r num">${h.u.toFixed(1)}%</td><td class="r num">${h.pi.toFixed(1)}%</td><td class="r num">${U.money(h.bal)}</td><td class="r num">${U.money(h.debt)}</td><td>${h.rating}</td></tr>`))}`;
  }

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  const D = () => ui.sel.draft;
  const dirty = () => { if (D()) D().an = null; };
  A('dkind', (el, a) => { draftFor(ui.s).kind = a; dirty(); });
  A('dtitle', (el) => { draftFor(ui.s).title = el.value; return false; });
  A('dtax', (el, a) => { draftFor(ui.s).tax[a] = el.value; dirty(); return false; });
  A('dreg', (el, a) => { draftFor(ui.s).reg[a] = el.value; dirty(); return false; });
  A('dap', (el, a) => { const [k, part] = a.split('|'); const d = draftFor(ui.s); d.ap[k] = d.ap[k] || {}; d.ap[k][part] = el.value; dirty(); return false; });
  A('dent', (el, a) => { const [k, pk] = a.split('|'); const d = draftFor(ui.s); d.ent[k] = d.ent[k] || {}; d.ent[k][pk] = el.value; dirty(); return false; });
  A('drider', () => { const d = draftFor(ui.s); const k = document.getElementById('dpk').value; const to = +document.getElementById('dpto').value; const J = ui.s.jur[d.jur]; const n = GR.policyOpts(GR.POLICY[k], GR.lvlOf(J.k)).length; if (to >= n || to === J.law[k]) { ui.toast('Pick a different option for that policy.'); return; } d.policy = d.policy.filter((x) => x.k !== k).concat([{ k, to }]); dirty(); });
  A('drmrider', (el, a) => { draftFor(ui.s).policy.splice(+a, 1); dirty(); });
  A('dstruct', () => { const d = draftFor(ui.s); const ag = document.getElementById('dsag').value; const k = document.getElementById('dstool').value; const v = +document.getElementById('dsval').value; if (!v) { ui.toast('Enter a value.'); return; } const J = ui.s.jur[d.jur]; const a = J.F.ag.find((x) => x.k === ag); if (k === 'fee') d.fee[`${a.abbr} user fees`] = v; else d[k][ag] = v; dirty(); });
  A('drmstruct', (el, a) => { const [k, ak] = a.split('|'); delete draftFor(ui.s)[k][ak]; dirty(); });
  A('dear', () => { const s = ui.s; const d = draftFor(s); const who = document.getElementById('demem').value; const amt = +document.getElementById('deamt').value; const ag = document.getElementById('deag').value; if (!who || !amt) { ui.toast('Pick a member and an amount in millions.'); return; } const J = s.jur[d.jur]; const a = J.F.ag.find((x) => x.k === ag); d.ear.push({ who, ag, amt: amt * 1e6, proj: L().earmarkName(s, s.pols[who], a) }); dirty(); });
  A('drmear', (el, a) => { draftFor(ui.s).ear.splice(+a, 1); dirty(); });
  A('dclear', () => { ui.sel.draft = null; });
  A('danalyze', () => { const s = ui.s; const d = draftFor(s); const b = L().newBill(s, d.jur, { title: d.title || 'Draft', prov: toProv(s, d), spon: 'me', kind: d.kind }); d.an = L().analysis(s, b); });
  A('dintro', () => { const s = ui.s; const d = draftFor(s); const r = L().introduce(s, { title: d.title, kind: d.kind, prov: toProv(s, d) }); ui.res(r); if (r.ok) { ui.sel.draft = null; ui.sub.office = 'docket'; ui.save(); } });
  A('dsubmitbudget', () => { const s = ui.s; const d = draftFor(s); const r = L().submitBudget(s, { title: d.title, prov: toProv(s, d) }); ui.res(r); if (r.ok) { ui.sel.draft = null; ui.sub.office = 'docket'; ui.save(); } });
  A('dbudget', () => {
    const s = ui.s; const d = draftFor(s); const J = s.jur[d.jur]; const due = s.budgetDue[d.jur];
    const b = L().budgetBill(s, d.jur, due.fy, s.pols.me, true);
    d.kind = 'budget'; d.title = b.title; d.ap = {};
    Object.entries(b.prov.ap).forEach(([k, v]) => { const a = J.F.ag.find((x) => x.k === k); d.ap[k] = { opex: U.round((v.opex || 0) / Math.max(1, a.opex) * 100, 1), capex: U.round((v.capex || 0) / Math.max(1, a.capex) * 100, 1) }; });
    dirty();
  });
  A('ddraw', () => {
    const s = ui.s; const d = draftFor(s); const J = s.jur[d.jur];
    const opts = { spon: s.pols.me, fac: document.getElementById('dfac').value, earmark: false, body: G().bodiesOf(s, d.jur)[0] };
    const tool = document.getElementById('dtool').value, ag = document.getElementById('dag').value, cri = document.getElementById('dcri').value;
    if (tool) opts.tool = tool; if (ag) opts.ag = ag; if (cri) opts.crisis = cri;
    const c = GR.billgen.deal(s, d.jur, opts);
    if (!c) { ui.toast('That combination does not produce a bill here. Try another tool or agency.'); return; }
    const p = c.prov;
    Object.assign(d, { title: c.title, tax: Object.assign({}, p.tax), reg: Object.assign({}, p.reg), ent: JSON.parse(JSON.stringify(p.ent)), ear: [], policy: p.policy.slice(), sale: {}, prem: Object.assign({}, p.prem), eff: Object.assign({}, p.eff), fee: {}, ap: {} });
    Object.entries(p.ap).forEach(([k, v]) => { const a = J.F.ag.find((x) => x.k === k); d.ap[k] = { opex: U.round((v.opex || 0) / Math.max(1, a.opex) * 100, 1), capex: U.round((v.capex || 0) / Math.max(1, a.capex) * 100, 1) }; });
    Object.entries(p.sale).forEach(([k, v]) => { d.sale[k] = Math.round(v / 1e6); });
    Object.entries(p.fee).forEach(([k, v]) => { d.fee[k] = Math.round(v / 1e6); });
    d.an = null;
    ui.toast(`Drew a ${GR.billgen.FACTIONS[c.fac].name} card: ${c.title}.`);
  });
  A('billview', (el, a) => { ui.modal = { kind: 'bill', id: a }; });
  A('markup', (el, a) => { const i = a.indexOf('|'); ui.res(GR.comm.markup(ui.s, a.slice(0, i), a.slice(i + 1))); ui.save(); });
  A('steer', (el, a) => { const [k, v] = a.split('|'); const r = GR.comm.setSteer(ui.s, { [k]: v }); if (!r.ok) ui.toast(r.msg); });
  A('steerpp', (el) => { GR.comm.setSteer(ui.s, { pp: el.value }); return false; });
  A('steergpp', (el) => { GR.comm.setSteer(ui.s, { gavelPP: el.value }); return false; });
  A('steergavel', (el) => { GR.comm.setSteer(ui.s, { gavel: el.value }); });
  A('steergo', () => { const r = GR.comm.resolveSteering(ui.s); if (!r.ok && r.msg) ui.toast(r.msg); ui.save(); });
  A('rollview', (el, a) => { ui.sel.roll = a; ui.modal = null; ui.tab = 'office'; ui.sub.office = 'rolls'; });
  A('rollsel', (el) => { ui.sel.roll = el.value; });
  A('rsort', (el, a) => { ui.sel.rsort = a; });
  A('gonego', (el, a) => { ui.sel.nego = a; ui.sub.office = 'deals'; });
  A('negosel', (el) => { ui.sel.nego = el.value; });
  A('nego', (el, a) => { const [b, p, k] = a.split('|'); ui.res(L().negotiate(ui.s, b, p, k)); });
  A('callvote', (el, a) => { const s = ui.s; const before = (s.rolls || [])[0]; const r = L().callVote(s, a); ui.res(r); if (r.ok && (s.rolls || [])[0] !== before) { ui.sel.roll = s.rolls[0].id; ui.sub.office = 'rolls'; } ui.save(); });
  A('discharge', (el, a) => ui.res(L().discharge(ui.s, a)));
  A('realloc', () => { const v = +(document.getElementById('ramt').value || 0) * 1e6; ui.res(L().reallocate(ui.s, document.getElementById('rfrom').value, document.getElementById('rto').value, v)); });
  A('audit', () => ui.res(L().audit(ui.s, document.getElementById('audsel').value)));
  A('advq', () => {
    const s = ui.s;
    const q0 = Math.floor(GR.util.monthOf(s.week) / 3);
    let guard = 14;
    do {
      GR.sim.endTurn(s);
      if (s.over) break;
      if (G().tasks(s).some((t) => t.kind === 'vote' || t.kind === 'sign' || t.kind === 'comm' || t.kind === 'cvote') && !s.settings.autoVote) { ui.toast('A vote needs you. Stopped early.'); break; }
      if (s.inbox.some((x) => !x.done && (x.kind === 'result' || x.kind === 'debate' || x.kind === 'vp'))) break;
    } while (Math.floor(GR.util.monthOf(s.week) / 3) === q0 && --guard > 0);
    ui.save();
    ui.toast('Economic calculators updated for the new quarter.');
  });

  return { briefing, constructor, docket, negotiations, rolls, budgetView, economy, billModal, crisisTable, agencyTable, committees, committeePanel, chairButtons, whipBox, hearingNeeded, analysisPanel };
})();
