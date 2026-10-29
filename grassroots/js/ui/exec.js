// Office screens: power bases, cabinet & staff, economic development, and the local dossier.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiExec = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const PW = () => GR.power;
  const CB = () => GR.cabinet;
  const DV = () => GR.develop;
  const bar = (v, color) => `<div class="pbar"><i style="width:${U.clamp(v, 0, 100)}%;background:${color || (v >= 60 ? 'var(--good)' : v < 35 ? 'var(--bad)' : '#c58a00')}"></i></div>`;
  const stars = (n) => `<span class="stars">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
  const leanTxt = (l) => (l == null || Math.abs(l) < 0.25 ? 'Nonpartisan' : l > 0 ? 'Leans Republican' : 'Leans Democratic');

  // ---------- Dossier ----------
  function dossier(s) {
    const c = GR.scenes.ctx(s);
    if (!c) return '';
    const st = PW().stateDossier(s), ct = PW().cityDossier(s);
    const parts = [];
    if ((c.jur === 'city' || c.jur === 'school') && ct) parts.push(`<p><b>${esc(s.home.cityName)}:</b> ${esc(ct.blurb)}</p>`);
    if (st) parts.push(`<p><b>${esc(GR.STATE[s.home.state].name)}:</b> ${esc(st.blurb)}</p>`);
    if (!parts.length) return '';
    return `<div class="note">${parts.join('')}</div>`;
  }

  // ---------- Power bases ----------
  function power(s) {
    const ds = PW().ensure(s);
    const P = s.power;
    if (!ds.length) return '<p>You have no power bases outside office.</p>';
    const hist = (P.hist || []).slice(-7, -6)[0];
    const rows = ds.slice().sort((a, b) => b.w - a.w).map((d) => {
      const l = P.l[d.k];
      const prev = hist && hist.l[d.k] != null ? l - hist.l[d.k] : 0;
      const t = PW().target(s, d);
      const [label, h, pp] = d.act || ['Meet with them', 3, 3];
      return `<tr><td><b>${esc(d.name)}</b>${d.generic ? '' : ' <span class="chip">Local power</span>'}<br><span class="small muted">${esc(d.desc)}</span></td>
        <td style="min-width:120px">${bar(l)}<span class="small">${Math.round(l)} / 100 ${prev ? `<span class="${prev > 0 ? 'good' : 'bad'}">${prev > 0 ? '▲' : '▼'}${Math.abs(Math.round(prev))}</span>` : ''}</span></td>
        <td class="small">${Math.round(t)}<br><span class="muted">${leanTxt(d.prefs && d.prefs.lean)}</span></td><td class="r small">${U.round(d.w, 1)}</td>
        <td>${ui.btn(`${esc(label)} (${h}h, ${pp} PP)`, 'court', d.k, 'bgr sm', s.hoursLeft < h || s.pols.me.pp < pp)}</td></tr>`;
    });
    const T = s.threat || {};
    const me = s.pols.me;
    const warn = [];
    if ((P.l.base != null && P.l.base < 30)) warn.push('Your primary voters are restless: a challenger may emerge before your next election.');
    if (me.app < 32) warn.push('With approval this low, a recall petition or a strong challenger is likely.');
    if ((me.scandal || 0) > 40) warn.push('Scandal is building. Investigators and the opposition are circling.');
    if (me.lead && P.l.party != null && P.l.party < 25) warn.push('Your caucus is unhappy with your leadership. A motion to remove you is possible.');
    if (s.primaryThreat) warn.push(`A primary challenger is preparing to run (strength ${Math.round(s.primaryThreat * 100)}%).`);
    return `<div class="stack">${dossier(s)}
      <p class="small">Each base's loyalty drifts toward a target set by conditions in your jurisdiction, your positions and your record. Loyal bases lift your approval, fill your war chest and hand out political capital. Hostile ones fund challengers, leak and organize recalls. The weight column is how much each base matters in your office.</p>
      ${warn.length ? `<div class="note bad">${warn.map(esc).join('<br>')}</div>` : ''}
      ${ui.table(['Power base', 'Loyalty', 'Heading to', { t: 'Weight', c: 'r' }, ''], rows)}
      ${T.recall || T.impeach || T.indict ? `<p class="small muted">${[T.recall ? 'Recall attempt survived or pending' : '', T.impeach ? 'Impeachment inquiry opened' : '', T.indict ? 'Indicted' : ''].filter(Boolean).join(' · ')}</p>` : ''}
    </div>`;
  }

  // ---------- Cabinet ----------
  function cabinet(s) {
    const c = GR.scenes.ctx(s);
    const C = CB().ensure(s);
    const posts = CB().posts(s);
    if (!posts.length) return '<p>School board members have no personal staff. The board hires the superintendent together.</p>';
    const sel = ui.sel.cabPost;
    const rows = posts.map((p) => {
      const a = C.posts[p.k];
      const ag = p.ag ? c.J.F.ag.find((x) => x.k === p.ag) : null;
      return `<tr class="${sel === p.k ? 'me' : ''}"><td><b>${esc(p.title)}</b>${ag ? `<br><span class="small muted">${esc(ag.name)} · audit ${Math.round(ag.eff)} · approval ${Math.round(ag.app)}%</span>` : p.desc ? `<br><span class="small muted">${esc(p.desc)}</span>` : ''}</td>
        <td>${a ? (a.acting ? '<span class="muted">Acting official</span>' : `${esc(a.name)} <span class="chip ${a.party}">${a.party}</span><br><span class="small muted">${esc(a.typeName)}, ${esc(a.flavor)}</span>`) : '<b class="bad">Vacant</b>'}</td>
        <td>${a ? stars(a.comp) : ''}</td><td class="small">${a && !a.acting ? `Loyalty ${Math.round(a.loyalty)}<br>Integrity ${Math.round(a.integ)}` : ''}</td>
        <td class="row">${ui.btn(a && !a.acting ? 'Replace' : 'Appoint', 'cabsel', p.k, 'bb sm')}${a && !a.acting ? ui.btn('Fire', 'cabfire', p.k, 'bgr sm') : ''}</td></tr>`;
    });
    let pick = '';
    if (sel && posts.some((p) => p.k === sel)) {
      const post = posts.find((p) => p.k === sel);
      const cands = CB().candidates(s, sel);
      const conf = c.jur === 'nation' && sel.startsWith('ag:') ? 'Needs Senate confirmation.' : c.jur === 'state' && sel.startsWith('ag:') && s.bodies.senate ? 'Needs confirmation by the State Senate.' : '';
      pick = `<div class="box"><div class="band">Candidates for ${esc(post.title)}</div><div class="boxpad stack-s"><p class="small">${conf} Competence improves the agency's audit rating, approval and upkeep. Loyalists rarely leak; career officials and experts run things best; donors please your funders but carry risk; a bipartisan pick eases confirmation but annoys your base.</p>
        ${ui.table(['Candidate', 'Background', 'Competence', 'Loyalty', 'Integrity', 'Pleases', ''], cands.map((x, i) => `<tr><td><b>${esc(x.name)}</b> <span class="chip ${x.party}">${x.party}</span></td><td class="small">${esc(x.typeName)}<br><span class="muted">${esc(x.flavor)}</span></td><td>${stars(x.comp)}</td><td>${x.loyalty}</td><td>${x.integ}</td><td class="small">${x.base ? esc((PW().defs(s).find((d) => d.k === x.base) || { name: x.base }).name) : ''}</td><td>${ui.btn('Appoint', 'cabapp', `${sel}|${i}`, 'bb sm')}</td></tr>`))}
        ${ui.btn('Close', 'cabsel', '', 'bgr sm')}</div></div>`;
    }
    return `<div class="stack"><p class="small">${c.exec ? 'Appoint the people who run your agencies. Each month competent appointees raise their agency\'s audit rating and approval.' : 'Hire your office staff. A strong chief of staff buys you hours and political capital; a legislative director makes bills cheaper.'}</p>${pick}${ui.table([c.exec ? 'Post' : 'Staff role', 'Appointee', 'Competence', '', ''], rows)}</div>`;
  }

  // ---------- Development ----------
  function develop(s) {
    const J = DV().playerJ(s);
    if (!J) return DV().legisJ(s) ? legisDev(s, DV().legisJ(s)) : '<p>Economic development is run by mayors, governors, the President and their legislatures.</p>';
    const d = DV().D(J);
    const view = ui.sel.devView || 'firms';
    const seg = `<div class="seg">${[['firms', 'Companies'], ['megas', 'Megaprojects'], ['portfolio', 'Your record']].map(([k, l]) => `<button aria-pressed="${view === k}" data-act="devview" data-a="${k}">${l}</button>`).join('')}</div>`;
    let body = '';
    if (view === 'firms') body = firms(s, J, d);
    else if (view === 'megas') body = megas(s, J, d);
    else body = portfolio(s, J, d);
    return `<div class="stack">${dossier(s)}${seg}${body}</div>`;
  }

  function firms(s, J, d) {
    const ps = DV().refresh(s, J);
    const inc = DV().incentives(J.k);
    const cards = ps.map((p, i) => {
      const parts = DV().oddsParts(s, J, p);
      const o = DV().odds(s, J, p);
      const pc = DV().packageCost(J, p);
      return `<div class="box"><div class="band">${esc(p.name)} ${p.suitor ? '<span class="chip">Already scouting here</span>' : ''}${p.expand ? '<span class="chip">Expansion</span>' : ''}</div><div class="boxpad stack-s">
        <div class="small">${esc((GR.INDUSTRIES.find((x) => x.k === p.sector) || {}).name || p.sector)} · ${U.num(Math.round(p.jobs * 1000))} jobs · ${U.money(p.capex)} investment${p.home ? ` · from ${esc(p.home.length === 2 ? GR.STATE[p.home].name : p.home)}` : ''}${p.host ? ` · would locate in <b>${esc(GR.STATE[p.host].name)}</b>` : ''}</div>
        <div class="small">Top priority: ${p.known ? `<b>${esc(DV().PRIORITIES[p.prio])}</b>` : `unknown ${ui.btn('Visit their HQ (4h)', 'devvisit', i, 'bgr sm', s.hoursLeft < 4)}`}</div>
        <div class="cols">${Object.entries(inc).map(([k, x]) => `<label class="f"><span>${esc(x.name)}</span><select class="input" data-ch="devinc" data-a="${i}|${k}">${x.opts.map((o2, j) => `<option value="${j}" ${p.inc[k] === j ? 'selected' : ''}>${esc(o2)}</option>`).join('')}</select></label>`).join('')}</div>
        <div class="small">${parts.map(([l, v]) => `<span class="ichip ${v > 0 ? 'good' : 'bad'}">${esc(l)} ${v > 0 ? '+' : ''}${Math.round(v * 100)}</span>`).join(' ')}</div>
        <div class="row"><b>Odds ${Math.round(o * 100)}%</b><span class="small">Package cost ${U.money(pc)}</span>${ui.btn(`Make the offer (${{ city: 4, state: 8, nation: 12 }[J.k]} PP)`, 'devoffer', i, 'bb sm')}</div>
      </div></div>`;
    });
    return `<p class="small">Site selectors are looking. Build an incentive package around what each company wants, then make an offer. New prospects arrive every six months (next ${U.fmtDate(d.pW + 26)}).</p>
      ${cards.join('') || '<p class="muted">No prospects right now.</p>'}
      <div class="box"><div class="band">Grow your own</div><div class="boxpad row">${ui.btn('Small-business grant program (6 PP)', 'devlocal', 'grant', 'bgr sm')}${ui.btn('Public venture fund (6 PP)', 'devlocal', 'fund', 'bgr sm')}</div></div>`;
  }

  function megas(s, J, d) {
    const opts = DV().options(s);
    const act = d.megas.filter((p) => p.stage !== 'cancelled' && p.stage !== 'done');
    const T = DV().MEGA;
    const projCards = act.filter((p) => !p.ai).map((p) => {
      const M = T[p.type];
      let inner = '';
      if (p.stage === 'study') inner = `<p class="small">Feasibility study under way. Results ${U.fmtDate(p.until)}.</p>`;
      if (p.stage === 'financing') {
        const srcs = DV().sources(s, J, p);
        const C = DV().cost(p);
        inner = `<p class="small">Estimated cost <b>${U.money(C)}</b> over ${p.years} years. Assemble financing that covers 100%.</p>
          ${M.landmark ? `<div class="row"><b>Design</b><select class="input" data-ch="megastyle" data-a="${p.id}">${DV().STYLES.map((st, i) => `<option value="${i}" ${p.style === i ? 'selected' : ''}>${esc(st.name)} (cost ×${st.mult}, appeal ×${st.appeal})</option>`).join('')}</select><input class="input grow" value="${esc(p.name)}" data-in="meganame" data-a="${p.id}"></div>` : ''}
          ${ui.table(['Source', { t: 'Max', c: 'r' }, { t: 'Your share %', c: 'r' }, 'Terms'], srcs.map((x) => `<tr><td><b>${esc(x.name)}</b>${x.odds != null ? ` <span class="small muted">(${Math.round(x.odds * 100)}% odds)</span>` : ''}</td><td class="r">${Math.round(x.share * 100)}%</td><td class="r"><input class="input num" style="max-width:70px" type="number" min="0" max="${Math.round(x.share * 100)}" value="${p.fin[x.k] || 0}" data-in="megafin" data-a="${p.id}|${x.k}"></td><td class="small">${esc(x.note)}</td></tr>`))}
          <div class="row"><b class="${DV().finTotal(p) >= 100 ? 'good' : 'bad'}">${DV().finTotal(p)}% financed</b>${ui.btn('Update total', 'rerender', '', 'bgr sm')}${ui.btn('Close financing & break ground', 'megaclose', p.id, 'bb sm')}${ui.btn('Cancel', 'megacancel', p.id, 'bgr sm')}</div>`;
      }
      if (p.stage === 'authorizing') { const b = GR.legis.findBill(s, p.bill); inner = `<p class="small">Waiting on the legislature: <b>${esc(b ? b.title : 'authorization bill')}</b>${b ? ` (${esc(b.stage)})` : ''}. Work the votes in Negotiations.</p>${b ? ui.btn('Bill details', 'billview', b.id, 'bgr sm') + ui.btn('Negotiate', 'gonego', b.id, 'bb sm') : ''}`; }
      if (p.stage === 'building') { const pct = U.clamp((s.week - p.buildW) / Math.max(1, p.until - p.buildW) * 100, 0, 100); inner = `${bar(pct, 'var(--dem)')}<p class="small">${Math.round(pct)}% built · opens ${U.fmtDate(p.until)} · cost so far ${U.money(p.spent)}</p>${ui.btn('Cancel', 'megacancel', p.id, 'bgr sm')}`; }
      return `<div class="box"><div class="band">${M.icon} ${esc(p.name)} <span class="chip">${esc(p.stage)}</span></div><div class="boxpad stack-s">${inner}</div></div>`;
    });
    const list = opts.map((o, i) => { const M = T[o.type]; return `<tr><td>${M.icon} <b>${esc(o.name)}</b>${o.real ? ' <span class="chip">Real project</span>' : ''}<br><span class="small muted">${esc(M.name)}${M.landmark ? ' · landmark' : ''}</span></td><td class="r num">${U.money(o.cost)}</td><td class="r">${o.years} yrs</td><td class="small">${esc(effText(M))}</td><td>${ui.btn('Commission a study', 'megastudy', i, 'bb sm', act.length >= 3)}</td></tr>`; });
    return `<p class="small">Big, defining projects. A feasibility study firms up the cost, then you assemble financing (some sources need a referendum, a grant competition or Congress), build through overruns and lawsuits, and cut the ribbon. Up to three at a time.</p>${projCards.join('')}${ui.table(['Project', { t: 'Est. cost', c: 'r' }, { t: 'Build', c: 'r' }, 'When finished', ''], list, { empty: 'Nothing else on the table.' })}`;
  }
  function effText(M) {
    const p = [];
    Object.entries((M.fx && M.fx.cr) || {}).forEach(([k, v]) => p.push(`${(GR.CRISIS_TYPES[k] || { name: k }).name.toLowerCase()} ${v}`));
    if (M.fx && M.fx.app) p.push(`approval +${M.fx.app}`);
    Object.entries(M.K || {}).forEach(([k, v]) => p.push(`${{ infra: 'infrastructure', rd: 'R&D', hum: 'human' }[k]} capital +${v}`));
    if (M.jobs) p.push('jobs');
    Object.keys(M.odds || {}).forEach((k) => p.push(`draws ${k === 'all' ? 'investors' : k}`));
    return p.join(', ');
  }

  function portfolio(s, J, d) {
    const f = d.firms.slice().reverse();
    const m = d.megas.filter((p) => p.stage === 'done' || p.stage === 'cancelled').reverse();
    return `${ui.kv([['Jobs added by companies you recruited', U.num(Math.round(DV().D(J).jobs * 1000))], ['Construction jobs now', U.num(Math.round(DV().D(J).temp * 1000))], ['Effect on unemployment', `−${U.round(DV().jobsPct(J) * 0.55, 2)} pts`], ['Business tax abatements', U.money(DV().abated(J))]])}
      ${ui.table(['Company', 'Where', { t: 'Jobs', c: 'r' }, 'Status'], f.map((x) => `<tr><td><b>${esc(x.name)}</b><br><span class="small muted">${esc((GR.INDUSTRIES.find((i) => i.k === x.sector) || {}).name || '')}</span></td><td class="small">${esc(x.where)}</td><td class="r num">${U.num(Math.round(x.jobs * 1000))}</td><td class="small">${x.pending ? 'Awaiting legislative approval' : x.closed ? 'Closed' : x.open ? `Open since ${x.openY}${x.abateYears ? ` · abatement to ${x.abateUntil}` : ''}` : `Under construction, opens ${U.fmtDate(x.openW)}`}</td></tr>`), { empty: 'No companies landed yet.' })}
      ${ui.table(['Project', 'Status'], m.map((p) => `<tr><td>${DV().MEGA[p.type].icon} ${esc(p.name)}</td><td class="small">${p.stage === 'done' ? `Opened ${p.doneY}` : 'Cancelled'}</td></tr>`), { empty: 'No megaprojects finished yet.' })}`;
  }

  // ---------- Development from the legislature ----------
  function legisDev(s, J) {
    const d = DV().D(J);
    const ex = GR.gov.execOf(s, J.k);
    const pend = DV().pendingBills(s, J);
    const mineD = (x) => (DV().inMyDistrict(s, x) ? ' <span class="chip">Your district</span>' : '');
    const firms = d.firms.slice().reverse().slice(0, 25);
    const megas = d.megas.filter((p) => p.stage !== 'cancelled').slice().reverse();
    const pitchOn = s.devPitch && s.devPitch.j === J.k && s.week - s.devPitch.w < 52;
    return `<div class="stack">${dossier(s)}
      <p class="small">${ex ? `${esc(GR.world.fullName(ex))} (${ex.party}) runs economic development` : 'The executive runs economic development'}. Big incentive deals and project financing come to your chamber as authorization bills. Pitch your district, extract concessions, or fight what you see as corporate welfare.</p>
      ${ui.kv([['Jobs landed in your district', GR.util.num(Math.round(DV().districtJobs(s, J) * 1000))], ['Your district pitch', pitchOn ? 'Active: the next company is likely to come to you' : 'None']])}
      <div class="row">${ui.btn('Pitch your district to the executive (3h, 6 PP)', 'devpitch', '', 'bb sm', pitchOn)}</div>
      <div class="band">Deals & projects awaiting a vote</div>
      ${ui.table(['Bill', 'Stage', ''], pend.map((b) => `<tr><td><b>${esc(b.title)}</b>${b.dev.seats && b.dev.seats.includes(s.pols.me.seat) ? ' <span class="chip">Your district</span>' : ''}<br><span class="small muted">${esc(b.sum || '')}${b.dev.cba ? ' · community benefits agreement' : ''}</span></td><td class="small">${esc(b.stage)} · ${esc(GR.BODIES[b.body].name)}</td><td class="row">${ui.btn('Details', 'billview', b.id, 'bgr sm')}${b.dev.kind === 'deal' && !b.dev.cba ? ui.btn('Demand local hiring (4 PP)', 'devcba', b.id, 'bgr sm') : ''}${ui.btn('Denounce (2h)', 'devdenounce', b.id, 'bgr sm', s.hoursLeft < 2)}</td></tr>`), { empty: 'Nothing pending.' })}
      <div class="band">Companies</div>
      ${ui.table(['Company', 'Where', { t: 'Jobs', c: 'r' }, 'Status'], firms.map((x) => `<tr><td><b>${esc(x.name)}</b>${mineD(x)}</td><td class="small">${esc(x.where || '')}</td><td class="r num">${GR.util.num(Math.round(x.jobs * 1000))}</td><td class="small">${x.pending ? 'Awaiting approval' : x.closed ? 'Closed' : x.open ? 'Open' : 'Under construction'}</td></tr>`), { empty: 'No deals yet.' })}
      <div class="band">Megaprojects</div>
      ${ui.table(['Project', 'Where', 'Status'], megas.map((p) => `<tr><td>${DV().MEGA[p.type].icon} <b>${esc(p.name)}</b>${mineD(p)}</td><td class="small">${esc(p.where || '')}</td><td class="small">${p.stage === 'done' ? 'Open' : p.stage === 'building' ? `Building, opens ${GR.util.fmtDate(p.until)}` : esc(p.stage)}</td></tr>`), { empty: 'No megaprojects yet.' })}
    </div>`;
  }

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  A('rerender', () => {});
  A('devpitch', () => { ui.res(DV().pitch(ui.s)); ui.save(); });
  A('devcba', (el, a) => { ui.res(DV().demandCBA(ui.s, a)); ui.save(); });
  A('devdenounce', (el, a) => { ui.res(DV().denounce(ui.s, a)); ui.save(); });
  A('court', (el, a) => { ui.res(PW().court(ui.s, a)); ui.save(); });
  A('cabsel', (el, a) => { ui.sel.cabPost = a || null; });
  A('cabapp', (el, a) => { const [k, i] = a.split('|'); const r = CB().appoint(ui.s, k, +i); ui.res(r); if (r.ok && !/rejected/.test(r.msg)) ui.sel.cabPost = null; ui.save(); });
  A('cabfire', (el, a) => { ui.res(CB().fire(ui.s, a)); ui.sel.cabPost = a; ui.save(); });
  A('devview', (el, a) => { ui.sel.devView = a; });
  A('devinc', (el, a) => { const [i, k] = a.split('|'); DV().setInc(ui.s, +i, k, el.value); });
  A('devvisit', (el, a) => ui.res(DV().visit(ui.s, +a)));
  A('devoffer', (el, a) => { ui.res(DV().offer(ui.s, +a)); ui.save(); });
  A('devlocal', (el, a) => { ui.res(DV().backLocal(ui.s, a)); ui.save(); });
  A('megastudy', (el, a) => { ui.res(DV().startStudy(ui.s, +a)); ui.save(); });
  A('megastyle', (el, a) => { DV().setStyle(ui.s, a, el.value); });
  A('meganame', (el, a) => { DV().rename(ui.s, a, el.value); return false; });
  A('megafin', (el, a) => { const [id, k] = a.split('|'); DV().setFin(ui.s, id, k, el.value); return false; });
  A('megaclose', (el, a) => { ui.res(DV().close(ui.s, a)); ui.save(); });
  A('megacancel', (el, a) => { ui.res(DV().cancel(ui.s, a)); ui.save(); });

  return { power, cabinet, develop, dossier };
})();
