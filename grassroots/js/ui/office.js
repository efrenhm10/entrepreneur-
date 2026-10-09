// Office tab: what you do once elected.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiOffice = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const G = () => GR.gov;

  const leanLabel = (l) => (Math.abs(l) < 1 ? 'Even' : l > 0 ? 'R+' + Math.round(l) : 'D+' + Math.round(-l));
  const stageLabel = (b) => ({ committee: 'In committee', floor: 'Floor vote', exec: 'Awaiting signature', law: 'Law', dead: 'Failed', vetoed: 'Vetoed' }[b.stage] || b.stage);

  function render(s) {
    const me = s.pols.me;
    if (!me.seat) return noOffice(s);
    const seat = s.seats[me.seat];
    const off = GR.OFFICES[seat.off];
    const bk = G().myBody(s);
    const tasks = G().tasks(s).length;
    const tabs = [['overview', 'Overview'], ['schedule', 'Schedule'], ['legis', 'Legislation', tasks || ''], ['write', off.exec ? 'Agenda' : 'Write Bill'], ['budget', 'Budget']];
    if (bk) tabs.push(['leadership', 'Leadership'], ['committees', 'Committees'], ['colleagues', 'Colleagues']);
    if (off.exec) tabs.push(['exec', 'Executive Orders']);
    const cur = ui.cur('office', tabs);
    let body;
    if (cur === 'overview') body = overview(s, seat);
    else if (cur === 'schedule') body = schedule(s);
    else if (cur === 'legis') body = legislation(s);
    else if (cur === 'write') body = writeBill(s);
    else if (cur === 'budget') body = budget(s);
    else if (cur === 'leadership') body = leadership(s, bk);
    else if (cur === 'committees') body = committees(s, bk);
    else if (cur === 'colleagues') body = colleagues(s, bk);
    else body = execOrders(s);
    return `${ui.tabs('office', tabs)}<div class="sheet">${body}</div>`;
  }

  function noOffice(s) {
    const me = s.pols.me;
    const job = GR.JOB[me.job];
    return `${ui.tabs('office', [['overview', 'Overview']])}<div class="sheet stack">
      <div class="title-c">Private Citizen</div>
      <div class="side"><div>${ui.facePol(s, me)}</div><div class="stack">
        <p>You do not hold public office yet. You work as a <b>${esc(job.name.toLowerCase())}</b> in ${esc(s.home.cityName)}.</p>
        <p>Build name recognition and party connections from the Profile → Life tab, then declare for a race in the Campaign tab. Most careers start on the school board or city council, which hold elections in odd-numbered years.</p>
        <div class="row">${ui.btn('Find a race to run in', 'gotab', 'campaign', 'bb pill')}${ui.btn('Community activities', 'gotab', 'profile|life', 'bgr')}</div>
        ${ui.kv([['Local name recognition', Math.round(me.recLocal) + '%'], ['Political points', U.num(me.pp)], ['Party standing', Math.round(me.standing) + ' / 100'], ['War chest', U.money(me.warChest)]])}
      </div></div></div>`;
  }

  function overview(s, seat) {
    const me = s.pols.me;
    const off = GR.OFFICES[seat.off];
    const pr = W().seatProfile(s, seat);
    const bk = G().myBody(s);
    const B = bk && s.bodies[bk];
    const comm = B && me.comm && B.comm[me.comm];
    const commName = comm ? G().committeeName({ body: bk, comm: me.comm }) : '—';
    const post = me.lead ? GR.LEADERSHIP[me.lead.body].find((p) => p.k === me.lead.post) : null;
    const comp = bk ? W().composition(s, bk) : null;
    return `<div class="side"><div class="stack">${ui.facePol(s, me)}<div class="small" style="text-align:center"><b>${esc(me.fn + ' ' + me.ln)}</b><br>${esc(W().seatTitle(s, seat))}</div></div>
      <div class="stack">
        <div class="band">Office</div>
        ${ui.kv([['Title', esc(off.name)], ['Seat', esc(W().seatTitle(s, seat))], ['In office since', me.since || '—'], ['Next election', `${seat.next} (${U.fmtDate(GR.elect.generalWeek(seat.next))})`], ['Salary', U.money(GR.life.officeSalary(s, seat)) + '/yr' + (GR.life.fullTimeOffice(s) ? ' · full time' : ' · part time')], ['Constituents', U.num(pr.pop)],
          bk ? ['Chamber', `${GR.BODIES[bk].name}: ${comp.D} D, ${comp.R} R (${W().majority(s, bk) === me.party ? 'your party has the majority' : 'your party is in the minority'})`] : null,
          bk ? ['Committee', esc(commName) + (comm && comm.chair === 'me' ? ' (Chair)' : '')] : null, post ? ['Leadership', `<b>${esc(post.name)}</b>`] : null])}
        <div class="band">Standing</div>
        ${ui.mrow('Approval', me.app, me.app < 40 ? 'red' : '')}${ui.mrow('Respect', me.respect || 0, 'green', Math.round(me.respect || 0))}${ui.mrow('Party standing', me.standing, 'grey', Math.round(me.standing))}${ui.mrow('Name recognition', GR.elect.playerRec(s, seat.off), '')}
        <div class="band">District profile</div>
        <div class="cols">${ui.kv([['Partisan lean', leanLabel(pr.lean)], ['Democrats', Math.round(pr.D * 100) + '%'], ['Republicans', Math.round(pr.R * 100) + '%'], ['Independents', Math.round(pr.I * 100) + '%'], ['Population', U.num(pr.pop)], ['Density', U.num(pr.dens) + ' / sq mi'], ['Urban', pr.urban + '%'], ['Median age', pr.age]])}
        ${ui.kv([['Median household income', U.money(pr.income * 1000)], ['Poverty', pr.poverty + '%'], ['Unemployment', pr.unemp + '%'], ['College graduates', pr.college + '%'], ['Veterans', pr.veterans + '%'], ['Gun owners', pr.guns + '%'], ['Union members', pr.union + '%'], ['Weekly churchgoers', pr.religious + '%']])}</div>
      </div></div>`;
  }

  function hoursBox(s) { return `<div class="hours ${s.hoursLeft > 10 ? 'ok' : ''}"><div>Hours Remaining:</div><b>${s.hoursLeft}</b></div>`; }

  function memberOptions(s, filter) {
    const bk = G().myBody(s);
    let ms = bk ? W().members(s, bk).filter((p) => !p.isPlayer) : [];
    if (filter) ms = ms.filter(filter);
    return ms.sort((a, b) => a.ln.localeCompare(b.ln)).map((p) => `<option value="${p.id}">${esc(W().fullName(p))} (${p.party}) · ${G().relLabel(G().rel(s, p.id))}</option>`).join('');
  }

  function schedule(s) {
    const me = s.pols.me;
    const bk = G().myBody(s);
    const acts = Object.entries(G().OFFICE_ACTS).filter(([k]) => bk || !['coffee', 'caucus', 'bipartisan', 'committee', 'speech'].includes(k));
    const pick = ui.sel.colleague || '';
    const runners = Object.values(s.pols).filter((p) => p.running && !p.isPlayer && p.party === me.party && p.seat);
    return `<div class="side"><div class="stack">${hoursBox(s)}<p class="small muted">Each week you get a fixed number of hours. Unused hours lower your stress.</p></div><div class="stack">
      <div class="band">Office schedule</div>
      ${bk ? `<label class="f"><span>Colleague (for coffee)</span><select class="input" id="colsel" data-ch="selcol"><option value="">Choose…</option>${memberOptions(s)}</select></label>` : ''}
      <div>${acts.map(([k, a]) => {
        let extra = '';
        let arg = k;
        if (k === 'coffee') arg = k + '|' + pick;
        if (k === 'help') { if (!runners.length) return ''; extra = `<select class="input" id="helpsel" style="max-width:220px">${runners.map((p) => `<option value="${p.id}">${esc(W().fullName(p))}</option>`).join('')}</select>`; arg = 'help|*'; }
        return `<div class="act"><span class="t"><b>${a.name}</b> <span class="small muted">${esc(a.desc)}</span></span>${extra}<span class="h">${a.h}h</span>${ui.btn('Do it', 'oact', arg, 'bb sm', s.hoursLeft < a.h || (k === 'coffee' && !pick))}</div>`;
      }).join('')}</div>
      <div class="band">War chest</div>
      <p>${U.money(me.warChest)} saved for future campaigns. It moves into your campaign account when you declare.</p>
    </div></div>`;
  }

  function voteButtons(t) {
    const b = t.b;
    if (t.kind === 'vote') return `${ui.btn('Yea', 'decide', `${b.id}|vote|y`, 'bgr sm yes')}${ui.btn('Nay', 'decide', `${b.id}|vote|n`, 'bgr sm no')}${ui.btn('Abstain', 'decide', `${b.id}|vote|a`, 'bgr sm')}`;
    if (t.kind === 'comm') return `${ui.btn('Advance', 'decide', `${b.id}|comm|y`, 'bgr sm yes')}${ui.btn('Table it', 'decide', `${b.id}|comm|n`, 'bgr sm no')}`;
    if (t.kind === 'floor') return `${ui.btn('Schedule vote', 'decide', `${b.id}|floor|y`, 'bgr sm yes')}${ui.btn('Block', 'decide', `${b.id}|floor|n`, 'bgr sm no')}`;
    return `${ui.btn('Sign', 'decide', `${b.id}|sign|y`, 'bgr sm yes')}${ui.btn('Veto', 'decide', `${b.id}|sign|n`, 'bgr sm no')}`;
  }

  // How your district feels about a bill.
  function districtView(s, b) {
    if (b.budget) return '';
    const me = s.pols.me;
    const seat = s.seats[me.seat];
    const pr = W().seatProfile(s, seat);
    const pol = GR.POLICY[b.k];
    const lvl = GR.lvlOf(b.jur);
    const sTo = GR.optScore(pol, b.to, lvl);
    const sup = Math.round(U.avg(['D', 'R', 'I'], (g) => GR.elect.groupAgree(pr, g, pol, sTo) * ({ D: pr.D, R: pr.R, I: pr.I }[g]) * 3));
    const mine = W().stance(me, b.k);
    const youLike = Math.abs(mine - sTo) < Math.abs(mine - GR.optScore(pol, b.from, lvl));
    return `<span class="small">District support ~${sup}% · You ${youLike ? '<span class="good">favor</span>' : '<span class="bad">oppose</span>'} this change</span>`;
  }

  function legislation(s) {
    const me = s.pols.me;
    const jur = G().myJur(s);
    const J = s.jur[jur];
    const tasks = G().tasks(s);
    const bk = G().myBody(s);
    const bills = (J.bills || []).slice().reverse();
    const mine = bills.filter((b) => b.spon === 'me');
    const offer = s.offer && G().findBill(s, s.offer.theirs);
    const sel = ui.sel.whip && G().findBill(s, ui.sel.whip);
    const deals = (s.deals || []).filter((d) => !d.kept && !d.broken);
    return `<div class="stack">
      ${tasks.length ? `<div class="band">Waiting on you (${tasks.length})</div><div>${tasks.map((t) => `<div class="act"><span class="t"><b>${esc(t.b.title)}</b> <span class="small">${esc(t.b.sub)}</span><br><span class="small muted">${t.kind === 'vote' ? 'Floor vote' : t.kind === 'comm' ? 'Your committee decides whether this advances' : t.kind === 'floor' ? 'As floor leader you decide if it gets a vote' : 'On your desk'} · Sponsor: ${ui.pname(s, t.b.spon)}${t.b.spon && s.pols[t.b.spon] ? ' (' + s.pols[t.b.spon].party + ', ' + G().relLabel(G().rel(s, t.b.spon)).toLowerCase() + ')' : ''}</span><br>${districtView(s, t.b)}</span><span class="row">${voteButtons(t)}</span></div>`).join('')}</div>` : '<div class="note">No votes are waiting on you this week.</div>'}
      ${offer ? `<div class="note">${ui.pname(s, s.offer.who)} offers a trade: they back your bill if you vote yes on their ${esc(offer.title)}. ${ui.btn('Accept deal', 'trade', '', 'bb sm')}</div>` : ''}
      ${deals.length ? `<div class="note small">Deals you owe: ${deals.map((d) => { const b = G().findBill(s, d.bill); return `vote yes on ${b ? esc(b.title) : 'their bill'} for ${ui.pname(s, d.who)}`; }).join('; ')}. Breaking your word costs respect.</div>` : ''}
      <div class="band">Your bills</div>
      ${ui.table(['Bill', 'Change', 'Stage', 'Votes', ''], mine.map((b) => `<tr><td><b>${esc(b.title)}</b></td><td class="small">${esc(b.sub)}</td><td>${stageLabel(b)}${b.why ? '<br><span class="small muted">' + esc(b.why) + '</span>' : ''}</td><td class="small">${b.votes.map((v) => `${GR.BODIES[v.body].name}: ${v.y}-${v.n}`).join('<br>')}</td><td>${['committee', 'floor'].includes(b.stage) && bk ? ui.btn('Whip count', 'whip', b.id, 'bb sm') : ''}</td></tr>`), { empty: 'You have not introduced any bills. Use the Write Bill tab.' })}
      ${sel ? whipPanel(s, sel) : ''}
      <div class="band">Docket: ${esc(J.name)}</div>
      ${ui.table(['Bill', 'Change', 'Sponsor', 'Stage', 'Last vote', ''], bills.filter((b) => b.spon !== 'me').slice(0, 25).map((b) => `<tr><td>${esc(b.title)}</td><td class="small">${esc(b.sub)}</td><td class="small">${b.spon ? ui.plink(s, b.spon) : '—'}</td><td>${stageLabel(b)}</td><td class="small">${b.votes.length ? b.votes[b.votes.length - 1].y + '-' + b.votes[b.votes.length - 1].n : ''}</td><td>${['committee'].includes(b.stage) && bk && !b.cos.includes('me') && b.spon ? ui.btn('Co-sponsor', 'cosp', b.id, 'bgr sm') : b.cos.includes('me') ? '<span class="small">Co-sponsor</span>' : ''}</td></tr>`), { empty: 'No bills pending.' })}
      <div class="band">Recent laws</div>
      ${ui.table(['Date', 'Law'], J.laws.slice(0, 12).map((l) => `<tr><td class="num" style="white-space:nowrap">${U.fmtDate(l.w)}</td><td>${esc(l.t)}${l.spon === 'me' ? ' <b>(yours)</b>' : ''}</td></tr>`), { empty: 'No new laws yet.' })}
    </div>`;
  }

  function whipPanel(s, b) {
    const bk = b.body;
    const me = s.pols.me;
    if (G().myBody(s) !== bk && !b.agenda) return `<div class="note">This bill is now in the ${GR.BODIES[bk].name}.</div>`;
    const wc = G().whipCount(s, b, bk);
    const need = Math.floor(wc.total / 2) + 1;
    const rows = wc.rows.sort((a, c) => c.v - a.v).map((r) => {
      const p = s.pols[r.id];
      const cls = r.v > 0 ? 'good' : 'bad';
      return `<tr><td>${ui.plink(s, r.id)}</td><td class="small">${esc(W().seatTitle(s, s.seats[p.seat]).replace(/^.*?(District|Ward)/, '$1'))}</td><td>${G().relLabel(G().rel(s, r.id))} <span class="small muted">(${Math.round(G().rel(s, r.id))})</span></td><td class="${cls}">${b.pledges[r.id] ? '<b>Pledged</b>' : r.lean}</td><td>${!b.pledges[r.id] ? ui.btn('Ask', 'pledge', b.id + '|' + r.id, 'bb sm', s.hoursLeft < 1) : ''}</td></tr>`;
    });
    return `<div class="box"><div class="band">Whip count: ${esc(b.title)} · ${GR.BODIES[bk].name}</div><div class="boxpad stack">
      <p>Projected: <b class="${wc.y >= need ? 'good' : 'bad'}">${wc.y} yes</b> to ${wc.n} no (${need} needed). Members weigh their views, their district, their party and <b>their relationship with you</b>. Ask for a pledge (1 hour each), have coffee with fence-sitters, or trade votes.</p>
      ${rows.length ? ui.table(['Member', 'District', 'Relationship', 'Leaning', ''], rows) : '<p class="muted">Members from other states vote by party, ideology and your standing in the caucus.</p>'}
      ${ui.btn('Close', 'whip', '', 'bgr sm')}</div></div>`;
  }

  function writeBill(s) {
    const me = s.pols.me;
    const seat = s.seats[me.seat];
    const jur = G().myJur(s);
    const J = s.jur[jur];
    const lvl = GR.lvlOf(jur);
    const pols = GR.policiesFor(jur);
    const cats = [...new Set(pols.map((p) => p.cat))];
    const cat = cats.includes(ui.sel.wcat) ? ui.sel.wcat : cats[0];
    const inCat = pols.filter((p) => p.cat === cat);
    const pk = inCat.some((p) => p.k === ui.sel.wpol) ? ui.sel.wpol : inCat[0].k;
    const pol = GR.POLICY[pk];
    const opts = GR.policyOpts(pol, lvl);
    const cur = J.law[pk];
    const to = ui.sel.wto != null && ui.sel.wto !== cur && ui.sel.wto < opts.length ? ui.sel.wto : (cur > 0 ? cur - 1 : cur + 1);
    const cost = G().billCost(s, jur, pk, to);
    const mine = GR.scoreToIdx(pol, W().stance(me, pk), lvl);
    const noLeg = !G().bodiesOf(s, jur).length;
    return `<div class="stack">
      <p>${GR.OFFICES[seat.off].exec ? 'Send an agenda bill to the legislature. Leaders and members who like and respect you are more likely to pass it.' : 'Write a bill to change the law. Bigger changes cost more political points and are harder to pass.'} Laws here apply to <b>${esc(J.name)}</b>.</p>
      ${noLeg ? '<div class="note">There is no legislature at this level.</div>' : ''}
      <div class="tabs-xs" style="display:flex;flex-wrap:wrap;gap:2px">${cats.map((c) => `<button class="tab ${c === cat ? 'on' : ''}" data-act="wcat" data-a="${c}">${c}</button>`).join('')}</div>
      <div class="cols">
        <div class="stack">
          <label class="f"><span>Policy</span><select class="input" id="wpol" data-ch="wpol">${inCat.map((p) => `<option value="${p.k}" ${p.k === pk ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
          ${ui.kv([['Current law', esc(opts[cur])], ['Your position', esc(opts[mine])]])}
          <label class="f"><span>Change it to</span><select class="input" id="wto" data-ch="wto">${opts.map((o, i) => (i === cur ? '' : `<option value="${i}" ${i === to ? 'selected' : ''}>${esc(o)}</option>`)).join('')}</select></label>
          <div class="row">${ui.btn(`Introduce bill (${cost} pts, 6 hours)`, 'writebill', pk + '|' + to, 'bb pill', noLeg || me.pp < cost || s.hoursLeft < 6)}</div>
        </div>
        <div class="stack"><div class="band">Expected effects</div>
          ${effects(pol, cur, to, lvl)}
          <div class="band">Public opinion in your district</div>
          ${opinion(s, pol, lvl)}
        </div>
      </div></div>`;
  }

  function effects(pol, from, to, lvl) {
    const d = GR.optScore(pol, to, lvl) - GR.optScore(pol, from, lvl);
    const rows = Object.entries(pol.fx).filter(([k]) => k !== 'rev').map(([k, v]) => {
      const m = W().METRICS[k];
      const ch = v * d;
      const good = ch * m.good > 0;
      return `<tr><td>${m.name}</td><td class="${good ? 'good' : 'bad'}">${ch > 0 ? '+' : ''}${U.round(ch, 2)}${['income', 'crime', 'rent', 'emis'].includes(k) ? '%' : ' pts'}</td></tr>`;
    });
    if (pol.fx.rev) rows.push(`<tr><td>Government revenue</td><td>${pol.fx.rev * d > 0 ? '+' : ''}${U.round(pol.fx.rev * d, 1)}%</td></tr>`);
    return rows.length ? `<table class="tbl"><tbody>${rows.join('')}</tbody></table>` : '<p class="small muted">Mostly a values question: no major effect on the metrics, but voters care.</p>';
  }

  function opinion(s, pol, lvl) {
    const me = s.pols.me;
    const pr = W().seatProfile(s, s.seats[me.seat]);
    const opts = GR.policyOpts(pol, lvl);
    return opts.map((o, i) => {
      const sc = GR.optScore(pol, i, lvl);
      const sup = Math.round(pr.D * GR.elect.groupAgree(pr, 'D', pol, sc) + pr.R * GR.elect.groupAgree(pr, 'R', pol, sc) + pr.I * GR.elect.groupAgree(pr, 'I', pol, sc));
      return ui.mrow(esc(o), sup, sup >= 50 ? '' : 'red');
    }).join('');
  }

  function budget(s) {
    const me = s.pols.me;
    const jur = G().myJur(s);
    const J = s.jur[jur];
    const t = W().totals(J);
    const seat = s.seats[me.seat];
    const isExec = GR.OFFICES[seat.off].exec;
    const due = s.budgetDue && s.budgetDue[jur];
    const draft = ui.sel.bdraft && ui.sel.bdraft.jur === jur ? ui.sel.bdraft : null;
    const hist = J.hist.slice(-8);
    const cats = Object.keys(t.sp);
    const colors = ['#7a0f0f', '#ff2a2a', '#ff4f8b', '#c000c0', '#5b0f6e', '#3a3af0', '#38c0f0', '#11b03c', '#e7a51a', '#777'];
    const chart = ui.lines(cats.map((c, i) => ({ name: c, color: colors[i % colors.length], values: hist.map((h) => (h.spend[c] || 0) / 1e9) })), hist.map((h) => h.y), { title: 'Expenditure by Category', fmt: (v) => U.money(v * 1e9) });
    let editor = '';
    if (isExec && due) {
      const d = draft || { jur, mult: Object.assign({}, J.budget.mult), revMult: Object.assign({}, J.budget.revMult) };
      ui.sel.bdraft = d;
      const nt = W().totals(Object.assign({}, J, { budget: Object.assign({}, J.budget, d) }));
      const taxKey = jur === 'nation' ? 'Income Tax' : jur === 'state' ? 'Sales Tax' : jur === 'city' ? 'Property Tax' : 'Local Levy';
      editor = `<div class="box"><div class="band">Your ${U.yearOf(s.week)} budget proposal · due ${U.fmtDate(due)}</div><div class="boxpad stack">
        ${Object.keys(d.mult).filter((c) => c !== 'Interest on Debt').map((c) => { const pct = Math.round((d.mult[c] / J.budget.mult[c] - 1) * 100); return `<label class="f"><span>${esc(c)}: ${pct >= 0 ? '+' : ''}${pct}% (${U.money(nt.sp[c])})</span><input type="range" min="-15" max="15" value="${pct}" id="bm${c.replace(/\W/g, '')}" data-in="bmult" data-a="${esc(c)}"></label>`; }).join('')}
        <label class="f"><span>${taxKey} rate: ${Math.round((d.revMult[taxKey] / J.budget.revMult[taxKey] - 1) * 100)}% (${U.money(nt.rv[taxKey])})</span><input type="range" min="-15" max="15" value="${Math.round((d.revMult[taxKey] / J.budget.revMult[taxKey] - 1) * 100)}" id="btax" data-in="btax" data-a="${taxKey}"></label>
        <p>Spending ${U.money(nt.spend)} · Revenue ${U.money(nt.rev)} · <b class="${nt.bal >= 0 ? 'good' : 'bad'}">${nt.bal >= 0 ? 'Surplus' : 'Deficit'} ${U.money(Math.abs(nt.bal))}</b>${jur !== 'nation' && nt.bal < 0 ? ' — deficits drain reserves and slow the economy.' : ''}</p>
        <p class="small muted">Legislators vote on your budget based on how much it grows spending and taxes, their party, and their relationship with you.</p>
        ${ui.btn('Send budget to the legislature', 'bsubmit', '', 'bb pill')}</div></div>`;
    }
    return `<div class="stack">${editor}<div class="cols">
      <div class="stack">${ui.table([{ t: 'Expenditure by Category', c: 'c' }, { t: '', c: 'r' }], cats.map((c) => `<tr><td class="c">${esc(c)}</td><td class="r num">${U.money(t.sp[c])}</td></tr>`).concat([`<tr><td class="c"><b>Total</b></td><td class="r num"><b>${U.money(t.spend)}</b></td></tr>`]))}
      ${ui.table([{ t: 'Revenue', c: 'c' }, { t: '', c: 'r' }], Object.keys(t.rv).map((c) => `<tr><td class="c">${esc(c)}</td><td class="r num">${U.money(t.rv[c])}</td></tr>`).concat([`<tr><td class="c"><b>Total</b></td><td class="r num"><b>${U.money(t.rev)}</b></td></tr>`, `<tr><td class="c">${t.bal >= 0 ? 'Surplus' : 'Deficit'}</td><td class="r num ${t.bal >= 0 ? 'good' : 'bad'}">${U.money(t.bal)}</td></tr>`, `<tr><td class="c">${jur === 'nation' ? 'National debt' : 'Reserves / debt'}</td><td class="r num">${jur === 'nation' ? U.money(J.budget.debt) : U.money(J.budget.reserve) + ' / ' + U.money(J.budget.debt)}</td></tr>`]))}</div>
      <div class="box boxpad">${chart}</div></div>
      ${!isExec ? `<p class="small muted">The ${jur === 'school' ? 'superintendent' : 'executive'} proposes a budget each year and it comes to your chamber for a vote under Legislation.</p>` : !due ? `<p class="small muted">You propose a new budget each year in ${U.MONTHS[U.monthOf(U.weekOfMD(2027, 0, 1) + G().BUDGET_WEEK[jur])]}.</p>` : ''}
    </div>`;
  }

  function leadership(s, bk) {
    const me = s.pols.me;
    const posts = G().posts(s, bk);
    const open = G().leadWindowOpen(s, bk);
    const bid = s.leadBid && s.leadBid.body === bk ? s.leadBid : null;
    let count = '';
    if (bid) {
      const c = G().leadCount(s, bk, bid.post);
      const post = GR.LEADERSHIP[bk].find((p) => p.k === bid.post);
      count = `<div class="box"><div class="band">Your race for ${esc(post.name)}</div><div class="boxpad stack">
        <p>Against ${c.rival ? ui.plink(s, c.rival.id) : 'no one'}. Projected caucus vote: <b class="${c.you > c.them ? 'good' : 'bad'}">${c.you}</b> for you, ${c.them} for your rival. The vote is held when the new session organizes in January.</p>
        ${c.ext ? `<p class="small">Members from other states: ${c.ext.you} lean your way. Raise it with caucus meetings, coffee and donations to colleagues.</p>` : ''}
        ${c.rows.length ? ui.table(['Member', 'Relationship', 'Leaning', ''], c.rows.sort((a, b2) => b2.x - a.x).map((r) => `<tr><td>${ui.plink(s, r.id)}</td><td>${G().relLabel(G().rel(s, r.id))} (${Math.round(G().rel(s, r.id))})</td><td class="${r.x > 0 ? 'good' : 'bad'}">${r.lean}</td><td>${ui.btn('Coffee', 'oact', 'coffee|' + r.id, 'bb sm', s.hoursLeft < 2)}</td></tr>`)) : ''}
      </div></div>`;
    }
    return `<div class="stack">
      <p>Leadership races are decided by your colleagues, and they vote for people they like and respect. Seniority unlocks each rung: Assistant Whip, then Whip, then Leader, then Speaker. Races open after the November election and are decided when the chamber organizes in January.</p>
      ${!open ? '<div class="note">The leadership election window is closed. It opens after the next general election for this chamber.</div>' : ''}
      ${count}
      ${ui.table(['Post', 'Held by', 'Party', ''], posts.map((p) => {
        const c = G().canSeek(s, bk, p.k);
        const mine = p.holder && p.holder.isPlayer;
        return `<tr class="${mine ? 'me' : ''}"><td>${esc(p.name)}</td><td>${p.holder ? (mine ? '<b>You</b>' : ui.plink(s, p.holder.id)) : '<span class="muted">Vacant</span>'}</td><td>${p.party ? ui.chip(p.party) : 'Any'}</td><td>${mine ? '' : bid && bid.post === p.k ? '<b>Running</b>' : c.ok ? ui.btn(`Run (${c.cost} pts)`, 'seek', p.k, 'bb sm', !!bid) : `<span class="small muted">${esc(c.why)}</span>`}</td></tr>`;
      }))}
      <div class="band">Your standing in the caucus</div>
      ${ui.mrow('Respect', me.respect || 0, 'green', Math.round(me.respect || 0))}${ui.mrow('Party standing', me.standing, 'grey', Math.round(me.standing))}
      ${G().isFed(bk) ? ui.mrow('Caucus goodwill (other states)', 50 + ((s.fedRel || {})[bk] || 0), '', Math.round((s.fedRel || {})[bk] || 0)) : ''}
      <p class="small muted">Terms served here: ${me.terms[G().BODY_OFF[bk]] || 0}.</p>
    </div>`;
  }

  function committees(s, bk) {
    const B = s.bodies[bk];
    const me = s.pols.me;
    const jur = GR.BODIES[bk].jur;
    const list = GR.COMMITTEES[jur === 'school' ? 'school' : jur === 'city' ? 'city' : jur];
    return `<div class="stack"><p>Committees decide which bills reach the floor. Chairs come from the majority party by seniority. Bills in your committee's areas get your extra influence.</p>
      ${ui.table(['Committee', 'Covers', 'Chair', 'Members', ''], list.map((c) => {
        const cm = B.comm[c.k] || { members: [] };
        const meIn = cm.members.includes('me');
        return `<tr class="${meIn ? 'me' : ''}"><td>${esc(c.name)}</td><td class="small">${c.cats.join(', ')}</td><td>${cm.chair ? (cm.chair === 'me' ? '<b>You</b>' : ui.plink(s, cm.chair)) : '—'}</td><td>${cm.members.length}</td><td>${meIn ? '<b>Member</b>' : ui.btn('Request (25 pts)', 'reqcomm', c.k, 'bgr sm', me.pp < 25)}</td></tr>`;
      }))}</div>`;
  }

  function colleagues(s, bk) {
    const me = s.pols.me;
    const ms = W().members(s, bk).filter((p) => !p.isPlayer);
    const sortBy = ui.sel.colSort || 'rel';
    ms.sort((a, b) => (sortBy === 'rel' ? G().rel(s, b.id) - G().rel(s, a.id) : sortBy === 'party' ? a.party.localeCompare(b.party) : a.ln.localeCompare(b.ln)));
    const gift = Math.max(250, Math.round(GR.elect.scale(s, s.seats[me.seat]) * 0.02 / 50) * 50);
    return `<div class="stack">
      <div class="row between"><p>Relationships decide votes. ${G().isFed(bk) ? 'Only your home-state delegation is listed; the rest of the caucus is tracked as caucus goodwill.' : ''}</p>
      <div class="seg">${[['rel', 'Relationship'], ['party', 'Party'], ['name', 'Name']].map(([k, l]) => `<button aria-pressed="${sortBy === k}" data-act="colsort" data-a="${k}">${l}</button>`).join('')}</div></div>
      ${ui.table(['Member', 'District', 'Ideology', 'Relationship', ''], ms.map((p) => `<tr><td>${ui.plink(s, p.id)}${p.lead ? '<br><span class="small">' + esc(GR.LEADERSHIP[p.lead.body].find((x) => x.k === p.lead.post).name) + '</span>' : ''}</td><td class="small">${esc(W().seatTitle(s, s.seats[p.seat]).replace(/^.*?(District|Ward)/, '$1'))}</td><td class="small">${W().ideoLabel((p.fis + p.soc) / 2)}</td><td>${G().relLabel(G().rel(s, p.id))} <span class="small muted">(${Math.round(G().rel(s, p.id))})</span></td><td class="row">${ui.btn('Coffee 2h', 'oact', 'coffee|' + p.id, 'bb sm', s.hoursLeft < 2)}${ui.btn('Give ' + U.money(gift), 'donate', p.id + '|' + gift, 'bgr sm', me.warChest < gift)}</td></tr>`))}
    </div>`;
  }

  function execOrders(s) {
    const me = s.pols.me;
    const jur = G().myJur(s);
    const J = s.jur[jur];
    const lvl = GR.lvlOf(jur);
    const pols = GR.policiesFor(jur).filter((p) => G().EO_CATS.includes(p.cat));
    return `<div class="stack"><p>Executive orders move a policy one step without the legislature (30 political points, 4 hours). Courts strike some down.</p>
      ${ui.table(['Policy', 'Current', 'Order', ''], pols.map((p) => {
        const opts = GR.policyOpts(p, lvl);
        const cur = J.law[p.k];
        return `<tr><td>${esc(p.name)}</td><td class="small">${esc(opts[cur])}</td><td class="small">${cur > 0 ? ui.btn('← ' + esc(opts[cur - 1]), 'eo', p.k + '|' + (cur - 1), 'bgr sm', me.pp < 30 || s.hoursLeft < 4) : ''} ${cur < opts.length - 1 ? ui.btn(esc(opts[cur + 1]) + ' →', 'eo', p.k + '|' + (cur + 1), 'bgr sm', me.pp < 30 || s.hoursLeft < 4) : ''}</td><td></td></tr>`;
      }))}</div>`;
  }

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  A('selcol', (el) => { ui.sel.colleague = el.value; });
  A('oact', (el, a) => {
    let [k, pid] = a.split('|');
    if (pid === '*') { const h = document.getElementById('helpsel'); pid = h && h.value; }
    ui.res(G().officeAct(ui.s, k, pid));
  });
  A('decide', (el, a) => { const [id, kind, v] = a.split('|'); G().decide(ui.s, id, kind, v); ui.toast(kind === 'vote' ? `You voted ${v === 'y' ? 'yea' : v === 'n' ? 'nay' : 'present'}.` : 'Decision recorded.'); });
  A('trade', () => ui.res(G().acceptTrade(ui.s)));
  A('whip', (el, a) => { ui.sel.whip = a || null; });
  A('pledge', (el, a) => { const [b, p] = a.split('|'); ui.res(G().askPledge(ui.s, b, p)); });
  A('cosp', (el, a) => ui.res(G().cosponsor(ui.s, a)));
  A('wcat', (el, a) => { ui.sel.wcat = a; ui.sel.wpol = null; ui.sel.wto = null; });
  A('wpol', (el) => { ui.sel.wpol = el.value; ui.sel.wto = null; });
  A('wto', (el) => { ui.sel.wto = +el.value; });
  A('writebill', (el, a) => { const [k, to] = a.split('|'); const r = G().writeBill(ui.s, k, +to); ui.res(r); if (r.ok) { ui.sub.office = 'legis'; } });
  A('bmult', (el, a) => { const d = ui.sel.bdraft; const J = ui.s.jur[d.jur]; d.mult[a] = J.budget.mult[a] * (1 + +el.value / 100); ui.render(); });
  A('btax', (el, a) => { const d = ui.sel.bdraft; const J = ui.s.jur[d.jur]; d.revMult[a] = J.budget.revMult[a] * (1 + +el.value / 100); ui.render(); });
  A('bsubmit', () => {
    const s = ui.s;
    const d = ui.sel.bdraft;
    G().submitBudget(s, d.jur, { mult: d.mult, revMult: d.revMult }, 'me');
    delete s.budgetDue[d.jur];
    ui.sel.bdraft = null;
    ui.toast('Budget sent to the legislature. Track it under Legislation.');
  });
  A('seek', (el, a) => ui.res(G().seek(ui.s, G().myBody(ui.s), a)));
  A('reqcomm', (el, a) => ui.res(G().requestCommittee(ui.s, a)));
  A('colsort', (el, a) => { ui.sel.colSort = a; });
  A('donate', (el, a) => { const [p, amt] = a.split('|'); ui.res(G().donate(ui.s, p, +amt)); });
  A('eo', (el, a) => { const [k, to] = a.split('|'); ui.res(G().execOrder(ui.s, k, +to)); });

  return { render };
})();
