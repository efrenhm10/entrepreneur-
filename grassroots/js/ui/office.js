// Office tab: what you do once elected.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiOffice = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const G = () => GR.gov;

  const leanLabel = (l) => (Math.abs(l) < 1 ? 'Even' : l > 0 ? 'R+' + Math.round(l) : 'D+' + Math.round(-l));

  // ---------- Situation Room ----------
  function render(s) {
    const me = s.pols.me;
    if (!me.seat) return noOffice(s);
    const seat = s.seats[me.seat];
    const off = GR.OFFICES[seat.off];
    const jur = G().myJur(s);
    const J = s.jur[jur];
    const y = U.yearOf(s.week);
    const bk = G().myBody(s);
    const post = me.lead ? GR.LEADERSHIP[me.lead.body].find((p) => p.k === me.lead.post) : null;
    const lead = `<div class="leader-card">${ui.facePol(s, me)}<div><b>${esc(me.fn + ' ' + me.ln)}</b> ${ui.chip(me.party)}<br><span class="muted small">${esc(W().seatTitle(s, seat))}</span><br>
      <span class="small">Age ${GR.life.age(s)} · in office since ${me.since || y}</span><br><span class="small">${post ? `<b>${esc(post.name)}</b> · ` : ''}${bk ? esc(GR.comm.myPosts(s).map((x) => x.name + (x.role !== 'Member' ? ` (${x.role})` : '')).join(', ') || 'No committees') : esc(off.exec ? 'Chief executive' : '')}</span><br>
      <span class="small muted">Next election: ${seat.next} (${Math.max(0, Math.round((GR.elect.generalWeek(seat.next) - s.week) / 4.3))} months)</span></div></div>`;
    const meters = ui.meter('Approval', me.app / 100, true, Math.round(me.app) + '%') + ui.meter('Respect of colleagues', (me.respect || 0) / 100, true, Math.round(me.respect || 0)) + ui.meter('Party standing', me.standing / 100, true, Math.round(me.standing))
      + ui.meter('Name recognition', GR.elect.playerRec(s, seat.off) / 100, true, Math.round(GR.elect.playerRec(s, seat.off)) + '%') + ui.meter('Integrity', (me.integrity || 70) / 100, true, Math.round(me.integrity || 70)) + ((me.scandal || 0) > 3 ? ui.meter('Scandal', me.scandal / 100, false, Math.round(me.scandal)) : '');
    const col1 = ui.panel('Your office', lead + meters + `<div class="row" style="margin-top:6px">${ui.btn('District dossier', 'gotab', 'economy|district', 'bgr sm')}${ui.btn('Profile & family', 'tab', 'profile', 'bgr sm')}</div>`)
      + ui.panel('How you could fall', threats(s, seat, off))
      + ui.panel('Power bases', bases(s));
    const col2 = ui.panel(`Key indicators · ${esc(J.name)}`, indicators(s, J))
      + ui.panel('Crises & needs', crises(s, J) + `<div class="row" style="margin-top:6px">${ui.btn('Full briefing', 'gotab', 'economy|brief', 'bgr sm')}${ui.btn('Write a bill', 'tab', 'builder', 'bb sm')}</div>`)
      + programsPanel(s, J)
      + ui.panel('Trends', trends(s, J));
    const col3 = ui.panel('On your desk', desk(s))
      + ui.panel('Advisers say', advisories(s).map(([txt, lbl, act, arg, urgent]) => `<div class="advice ${urgent ? 'urgent' : ''}"><span>${esc(txt)}</span>${lbl ? ui.btn(lbl, act, arg || '', 'bgr sm') : ''}</div>`).join('') || '<p class="muted small">All quiet.</p>')
      + ui.panel('Races to watch', GR.uiCampaign.watchList(s, 4) + `<div class="row" style="margin-top:6px">${ui.btn('All races', 'tab', 'campaign', 'bgr sm')}</div>`)
      + ui.panel('Latest cables', s.news.slice(0, 12).map((n) => `<p class="cable ${n.kind === 'gov' ? 'gov' : ''}"><small>${U.fmtDate(n.w)}</small>${esc(n.t)}</p>`).join('') + `<div class="row" style="margin-top:6px">${ui.btn('All news', 'gotab', 'news|headlines', 'bgr sm')}</div>`);
    return `<div class="vhead"><h2>Situation Room</h2><span class="sub">${esc(G().briefingLabel(s))}</span></div><div class="grid3"><div>${col1}</div><div>${col2}</div><div>${col3}</div></div>`;
  }

  function threats(s, seat, off) {
    const me = s.pols.me;
    const PW = GR.power;
    const base = PW.get(s, 'base'), party = PW.get(s, 'party');
    const y = U.yearOf(s.week);
    const out = [];
    const add = (name, lvl, desc) => { if (lvl > 4) out.push(ui.meter(name, lvl / 100, false, Math.round(lvl) + '%', desc) + `<p class="tiny muted" style="margin-top:-2px">${esc(desc)}</p>`); };
    add('Defeat at the polls', U.clamp((55 - me.app) * 2.4 + 22, 2, 98), `Your seat is up in ${seat.next}. Approval ${Math.round(me.app)}%.`);
    if (base != null) add('Primary challenge', U.clamp((52 - base) * 2.2 + (seat.next - y <= 1 ? 10 : 0), 0, 95), `Your party base sits at ${Math.round(base)}. Below 30 near an election, a challenger files.`);
    const recall = off.jur === 'city' || off.jur === 'school' || (off.jur === 'state' && ['AK', 'AZ', 'CA', 'CO', 'GA', 'ID', 'KS', 'LA', 'MI', 'MN', 'MT', 'NV', 'NJ', 'ND', 'OR', 'WA', 'WI', 'IL', 'RI', 'VA'].includes(s.home.state));
    if (recall) add('Recall', U.clamp((38 - me.app) * 3.2, 0, 90), 'Organizers can force a recall when approval falls below 30%.');
    if (off.k === 'president' || off.k === 'governor') add('Impeachment', U.clamp((me.scandal || 0) * 1.1 + (35 - me.app) * 0.8, 0, 90), 'A hostile legislature can impeach over scandal.');
    add('Indictment', U.clamp(((me.scandal || 0) - 35) * 1.6 + (45 - (me.integrity || 70)), 0, 90), 'Prosecutors look at high scandal and low integrity.');
    if (me.lead && party != null) add('Ouster from leadership', U.clamp((40 - party) * 2.6, 0, 90), `Party establishment at ${Math.round(party)}.`);
    return out.join('') || '<p class="muted small">You are secure for now.</p>';
  }

  function bases(s) {
    const P = s.power;
    if (!P || !P.l) return '<p class="muted small">Your coalition takes shape after your first month in office.</p>';
    const ds = GR.power.defs(s).slice().sort((a, b) => (P.l[a.k] || 0) - (P.l[b.k] || 0));
    return ds.slice(0, 6).map((d) => ui.meter(esc(d.name.split(' (')[0]), (P.l[d.k] || 0) / 100, true, Math.round(P.l[d.k] || 0), d.desc || '')).join('') + `<div class="row" style="margin-top:6px">${ui.btn('All power bases', 'gotab', 'power|bases', 'bgr sm')}</div>`;
  }

  function indicators(s, J) {
    const m = J.F.mac;
    const t = GR.fisc.totals(J);
    const prev = J.F.hist.length >= 5 ? J.F.hist[J.F.hist.length - 5] : null;
    const d = (now, was, good, dig = 1) => (was == null || Math.abs(now - was) < 0.05 ? '' : ` <span class="tiny ${(now - was) * good > 0 ? 'good' : 'bad'}">${now > was ? '▲' : '▼'}${Math.abs(now - was).toFixed(dig)}</span>`);
    const cls = (v, g, b) => (v >= g ? 'good' : v <= b ? 'bad' : '');
    const bal = t.bal / Math.max(1, t.spend) * 100;
    return `<div class="ind">
      ${ui.stat('Growth', `<span class="${cls(m.g, 2.5, 0.5)}">${m.g.toFixed(1)}%</span>${d(m.g, prev && prev.g, 1)}`)}
      ${ui.stat('Unemployment', `<span class="${cls(-m.u, -4.2, -6.5)}">${m.u.toFixed(1)}%</span>${d(m.u, prev && prev.u, -1)}`)}
      ${ui.stat('Inflation', `${m.pi.toFixed(1)}%${d(m.pi, prev && prev.pi, -1)}`)}
      ${ui.stat(J.k === 'nation' ? 'Deficit' : 'Budget balance', `<span class="${bal >= 0 ? 'good' : bal < -12 ? 'bad' : ''}">${U.money(t.bal)}</span>`)}
      ${ui.stat(J.k === 'nation' ? 'Debt / GDP' : 'Debt', J.k === 'nation' ? (J.F.debt / m.gdp * 100).toFixed(0) + '%' : U.money(J.F.debt))}
      ${ui.stat('Credit rating', J.F.ratingLabel)}
      ${ui.stat('Confidence', m.cc.toFixed(0))}
      ${ui.stat('Voter anger', Math.round(GR.fisc.dissatisfaction(J)))}
    </div>
    <p class="small muted" style="margin-top:6px">${esc(J.name)} spends ${U.money(t.spend)} a year and raises ${U.money(t.rev)}. Population ${U.num(J.pop || 0)}.</p>`;
  }

  function crises(s, J) {
    const rows = Object.entries(J.F.crises).sort((a, b) => b[1].s - a[1].s).slice(0, 6);
    return rows.map(([k, c]) => { const d4 = c.hist.length >= 4 ? c.s - c.hist[c.hist.length - 4] : 0; return ui.meter(`${esc(GR.CRISIS_TYPES[k].name)}${Math.abs(d4) >= 0.5 ? ` <span class="tiny ${d4 > 0 ? 'bad' : 'good'}">${d4 > 0 ? '▲' : '▼'}${Math.abs(d4).toFixed(1)}</span>` : ''}`, c.s / 100, false, Math.round(c.s)); }).join('') || '<p class="muted small">No pressing crises.</p>';
  }

  // Programs on the books, yours first, with what they delivered this year.
  function programsPanel(s, J) {
    if (!GR.prog) return '';
    const rows = GR.prog.report(J).sort((a, b) => (b.p.spon === 'me') - (a.p.spon === 'me') || b.p.amt - a.p.amt).slice(0, 6);
    if (!rows.length) return '';
    return ui.panel('Programs on the books', rows.map(({ p, served }) => `<div class="opp"><span class="t"><b class="small">${esc(p.name)}</b>${p.spon === 'me' ? ' <span class="chip">yours</span>' : ''}<br><span class="tiny muted">${U.money(p.amt)} a year · ${U.num(served)} ${esc(p.unit)} · ${esc(p.office)}</span></span></div>`).join(''));
  }

  function trends(s, J) {
    const h = J.F.hist.slice(-24);
    const row = (name, vals, color, fmt) => `<div class="spark-row"><span>${name}</span>${ui.spark(vals, color)}<span class="v">${vals.length ? fmt(vals[vals.length - 1]) : '—'}</span></div>`;
    return row('Approval', s.appHist || [], '#7bd88f', (v) => v + '%') + row('Growth', h.map((x) => x.g), '#6fb3ff', (v) => v.toFixed(1) + '%') + row('Jobless', h.map((x) => x.u), '#f0c05a', (v) => v.toFixed(1) + '%') + row('Balance', h.map((x) => x.bal), '#c39bff', (v) => U.money(v)) + '<p class="tiny muted">Quarterly, last six years.</p>';
  }

  // Votes and decisions waiting this week, with one-click answers.
  function desk(s) {
    const tasks = G().tasks(s);
    const L = GR.legis;
    const scenes = s.inbox.filter((x) => !x.done && (x.kind === 'scene' || x.kind === 'event') && !x.answered);
    const rows = tasks.slice(0, 6).map((t) => {
      const b = t.b;
      const c = L.components(s, s.pols.me, b);
      const line = L.partyLine(s, b, s.pols.me.party);
      const what = t.kind === 'vote' ? (b.stage === 'cloture' ? 'Cloture vote' : 'Floor vote') : t.kind === 'comm' ? 'You chair the committee' : t.kind === 'cvote' ? 'Committee markup vote' : 'Awaiting your signature';
      const btns = t.kind === 'vote' ? ui.btn('Yea', 'decide', `${b.id}|vote|y`, 'bgr sm yes') + ui.btn('Nay', 'decide', `${b.id}|vote|n`, 'bgr sm no')
        : t.kind === 'sign' ? ui.btn('Sign', 'decide', `${b.id}|sign|y`, 'bgr sm yes') + ui.btn('Veto', 'decide', `${b.id}|sign|n`, 'bgr sm no')
        : t.kind === 'cvote' ? ui.btn('Report', 'decide', `${b.id}|cvote|y`, 'bgr sm yes') + ui.btn('Oppose', 'decide', `${b.id}|cvote|n`, 'bgr sm no') : '';
      return `<div class="opp"><span class="t"><b class="small">${esc(b.title)}</b><br><span class="tiny muted">${what} · district ${c.di >= 0 ? '+' : ''}${c.di.toFixed(2)} · party ${line > 0 ? 'yes' : line < 0 ? 'no' : 'free'}</span></span><span class="row">${btns}${ui.btn('Open', 'legsel', b.id, 'bgr sm')}</span></div>`;
    });
    const sc = scenes.slice(0, 3).map((it) => `<div class="opp"><span class="t"><b class="small">${esc(it.title)}</b><br><span class="tiny muted">Decision waiting</span></span>${ui.btn('Decide', 'openmsg', it.id, 'bo sm')}</div>`);
    const more = tasks.length > 6 ? `<p class="tiny muted">${tasks.length - 6} more on the Legislature screen.</p>` : '';
    return rows.concat(sc).join('') + more || `<p class="muted small">Nothing waiting. ${s.hoursLeft} hours to spend this week.</p>`;
  }

  function advisories(s) {
    const me = s.pols.me;
    const L = GR.legis;
    const seat = s.seats[me.seat];
    const off = GR.OFFICES[seat.off];
    const jur = G().myJur(s);
    const J = s.jur[jur];
    const bk = G().myBody(s);
    const out = [];
    const mine = (J.bills || []).filter((b) => b.spon === 'me' && L.OPEN(b));
    if (s.steer && !s.steer.done && s.steer.body === bk) out.push([`Steering is handing out committee seats (meets ${U.fmtDate(s.steer.due)}). Put up capital and favors for the panels you want.`, 'Committees', 'tab', 'committees', true]);
    const due = s.budgetDue && s.budgetDue[jur];
    if (due && off.exec) out.push([`Your FY${due.fy} budget is due ${U.fmtDate(due.due)}. By law it must balance.`, 'Budget Room', 'tab', GR.budget && GR.budget.has(jur) ? 'budget' : 'builder', true]);
    const liveBud = (J.bills || []).find((b) => b.kind === 'budget' && GR.legis.OPEN(b) && b.prov.bud);
    if (liveBud && !off.exec) { const reg = GR.budget.regional(J, liveBud.prov.bud); const g = GR.budget.geoOf(s, me, jur); const i = g.indexOf(Math.max(...g)); out.push([`The ${liveBud.title} is moving. Districts like yours: ${(reg[i] * 100).toFixed(1)}% against current services.`, 'Budget Room', 'tab', 'budget', reg[i] < -0.01]); }
    mine.filter((b) => b.blockedBy).slice(0, 2).forEach((b) => out.push([`The ${b.title} is bottled up in committee by ${W().fullName(s.pols[b.blockedBy])}.`, 'Open', 'legsel', b.id, true]));
    mine.filter((b) => b.vetoThreat).slice(0, 2).forEach((b) => out.push([`The ${GR.xneg.exTitle(s, b.jur).toLowerCase()} threatens to veto your ${b.title}.`, 'Negotiate', 'gotab', 'nego|exec', true]));
    mine.filter((b) => b.xcounter).slice(0, 2).forEach((b) => out.push([`The ${GR.xneg.exTitle(s, b.jur).toLowerCase()}'s staff sent counteroffers on the ${b.title}.`, 'See offers', 'gotab', 'nego|exec']));
    mine.filter((b) => b.filibustered && L.OPEN(b)).slice(0, 1).forEach((b) => out.push([`The ${b.title} is being filibustered.`, 'Open', 'legsel', b.id]));
    if (!off.exec && bk) {
      const ag = GR.xneg.agenda(s, jur).filter((b) => b.body === bk && !b.my[bk]);
      if (ag.length) out.push([`The ${GR.xneg.exTitle(s, jur).toLowerCase()}'s priority, the ${ag[0].title}, is before your chamber. Your vote has a price.`, 'Open', 'legsel', ag[0].id]);
      if (!mine.length && me.pp >= 20) out.push(['You have no bills moving. Write one that answers your district\'s worst crisis.', 'Bill Builder', 'tab', 'builder']);
    }
    if (off.exec) {
      const desk = G().tasks(s).filter((t) => t.kind === 'sign');
      if (desk.length) out.push([`${desk.length} bill${desk.length === 1 ? ' is' : 's are'} on your desk awaiting signature.`, 'Desk', 'tab', 'legis', true]);
      const C = s.cabinet;
      if (C && Object.values(C.posts || {}).some((p) => p && p.acting)) out.push(['Acting officials still hold cabinet posts. Appoint your own people.', 'Cabinet', 'tab', 'cabinet']);
    }
    const w = GR.power.weakest && GR.power.weakest(s);
    const wl = w && s.power.l[w.k];
    if (w && wl < 28) out.push([`${w.name.split(' (')[0]} are turning against you (${Math.round(wl)}).`, 'Power', 'gotab', 'power|bases']);
    if (me.app < 40) out.push([`Approval is ${Math.round(me.app)}%. Deliver for the district and take popular stands.`, '', '']);
    if ((me.scandal || 0) > 30) out.push(['Scandal is building. Integrity and a strong press operation help.', '', '']);
    if (me.pp > 95) out.push(['Your political capital is near the cap and starts eroding above 100. Spend it on bills, deals or seats.', '', '']);
    const y = U.yearOf(s.week);
    if (seat.next === y && !s.campaign && s.week < GR.elect.generalWeek(y)) out.push([`Your seat is up this November. Declare for re-election.`, 'Campaign', 'tab', 'campaign', true]);
    // An open seat a step up, coming soon.
    if (GR.watch) {
      const up = GR.watch.upcoming(s).filter((x) => x.open && x.away <= 1 && x.off.level > off.level && x.canRun.ok !== false).sort((a, b) => a.next - b.next)[0]
        || GR.watch.upcoming(s).filter((x) => x.open && x.away <= 1 && x.off.level > off.level).sort((a, b) => a.next - b.next)[0];
      if (up) out.push([`${up.p ? `${W().fullName(up.p)} is ${up.tags.some((t) => t[0] === 'Term-limited') ? 'term-limited' : 'retiring'}` : 'A seat is vacant'}: the ${up.next} race for ${GR.OFFICES[up.seat.off].name.toLowerCase()} is open.`, 'Races', 'tab', 'campaign']);
    }
    if (s.hoursLeft >= 20) out.push([`${s.hoursLeft} hours unspent this week. Meet colleagues, hold events, or court a power base.`, 'Schedule', 'gotab', 'power|schedule']);
    return out.slice(0, 7);
  }

  function noOffice(s) {
    const me = s.pols.me;
    const job = GR.JOB[me.job];
    const J = s.jur.state;
    return `<div class="vhead"><h2>Home</h2><span class="sub">${esc(s.home.cityName)}, ${s.home.state} ${s.home.zip}</span></div><div class="grid3">
      <div>${ui.panel('Private citizen', `<div class="leader-card">${ui.facePol(s, me)}<div><b>${esc(me.fn + ' ' + me.ln)}</b> ${ui.chip(me.party)}<br><span class="small">${esc(job.name)} · age ${GR.life.age(s)}</span></div></div>
        ${ui.meter('Local name recognition', me.recLocal / 100, true, Math.round(me.recLocal) + '%')}${ui.meter('Party standing', me.standing / 100, true, Math.round(me.standing))}
        <p class="small">You do not hold office yet. Build name recognition and party connections, then declare for a race. Most careers start on the school board or city council, which hold elections in odd-numbered years.</p>
        <div class="row" style="margin-top:8px">${ui.btn('Find a race to run in', 'tab', 'campaign', 'bo')}${ui.btn('Community activities', 'gotab', 'profile|life', 'bgr')}</div>`)}</div>
      <div>${ui.panel(`Key indicators · ${esc(J.name)}`, indicators(s, J))}${ui.panel('Crises & needs', crises(s, J))}</div>
      <div>${ui.panel('Races to watch', GR.uiCampaign.watchList(s, 5) + `<div class="row" style="margin-top:6px">${ui.btn('All races', 'tab', 'campaign', 'bgr sm')}</div>`)}${ui.panel('Your resources', ui.kv([['Political points', U.num(me.pp)], ['War chest', U.money(me.warChest)], ['Savings', U.money(me.money)], ['Donor network', me.network + ' contacts']]))}${ui.panel('Latest cables', s.news.slice(0, 10).map((n) => `<p class="cable"><small>${U.fmtDate(n.w)}</small>${esc(n.t)}</p>`).join('') || '<p class="muted small">Quiet.</p>')}</div>
    </div>`;
  }

  function overview(s, seat) {
    const me = s.pols.me;
    const off = GR.OFFICES[seat.off];
    const pr = W().seatProfile(s, seat);
    const bk = G().myBody(s);
    const B = bk && s.bodies[bk];
    void B;
    const commName = bk ? GR.comm.myPosts(s).map((x) => x.name + (x.role !== 'Member' ? ` (${x.role})` : '')).join(', ') || '—' : '—';
    const post = me.lead ? GR.LEADERSHIP[me.lead.body].find((p) => p.k === me.lead.post) : null;
    const comp = bk ? W().composition(s, bk) : null;
    return `<div class="side"><div class="stack">${ui.facePol(s, me)}<div class="small" style="text-align:center"><b>${esc(me.fn + ' ' + me.ln)}</b><br>${esc(W().seatTitle(s, seat))}</div></div>
      <div class="stack">
        <div class="band">Office</div>
        ${ui.kv([['Title', esc(off.name)], ['Seat', esc(W().seatTitle(s, seat))], ['In office since', me.since || '—'], ['Next election', `${seat.next} (${U.fmtDate(GR.elect.generalWeek(seat.next))})`], ['Salary', U.money(GR.life.officeSalary(s, seat)) + '/yr' + (GR.life.fullTimeOffice(s) ? ' · full time' : ' · part time')], ['Constituents', U.num(pr.pop)],
          bk ? ['Chamber', `${GR.BODIES[bk].name}: ${comp.D} D, ${comp.R} R (${W().majority(s, bk) === me.party ? 'your party has the majority' : 'your party is in the minority'})`] : null,
          bk ? ['Committees', esc(commName)] : null, post ? ['Leadership', `<b>${esc(post.name)}</b>`] : null])}
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
      ${races(s, bk)}
      ${me.lead && me.lead.body === bk ? `<div class="box"><div class="band">Your post: ${esc(GR.LEADERSHIP[bk].find((x) => x.k === me.lead.post).name)}</div><div class="boxpad stack-s"><p class="small">${esc((GR.lead && GR.lead.POWERS[me.lead.post]) || '')}</p><div class="row">${ui.btn('Call a caucus meeting (3h)', 'leadcaucus', '', 'bb sm', s.hoursLeft < 3)}<span class="tiny muted">Whip operations are on each bill in the Legislature screen.</span></div></div></div>` : ''}
      ${ui.table(['Post', 'Held by', 'Party', 'What it does', ''], posts.map((p) => {
        const c = G().canSeek(s, bk, p.k);
        const mine = p.holder && p.holder.isPlayer;
        return `<tr class="${mine ? 'me' : ''}"><td>${esc(p.name)}</td><td>${p.holder ? (mine ? '<b>You</b>' : ui.plink(s, p.holder.id)) : '<span class="muted">Vacant</span>'}</td><td>${p.party ? ui.chip(p.party) : 'Any'}</td><td class="tiny muted" style="max-width:280px">${esc((GR.lead && GR.lead.POWERS[p.k]) || '')}</td><td>${mine ? '' : bid && bid.post === p.k ? '<b>Running</b>' : c.ok ? ui.btn(`Run (${c.cost} pts)`, 'seek', p.k, 'bb sm', !!bid) : `<span class="small muted">${esc(c.why)}</span>`}</td></tr>`;
      }))}
      <div class="band">Your standing in the caucus</div>
      ${ui.mrow('Respect', me.respect || 0, 'green', Math.round(me.respect || 0))}${ui.mrow('Party standing', me.standing, 'grey', Math.round(me.standing))}
      ${G().isFed(bk) ? ui.mrow('Caucus goodwill (other states)', 50 + ((s.fedRel || {})[bk] || 0), '', Math.round((s.fedRel || {})[bk] || 0)) : ''}
      <p class="small muted">Terms served here: ${me.terms[G().BODY_OFF[bk]] || 0}.</p>
    </div>`;
  }

  // This winter's contested leadership races in your caucus.
  function races(s, bk) {
    const R = s.leadRaces && s.leadRaces[bk];
    const me = s.pols.me;
    if (!R || R.done || !GR.lead) return '';
    const mine = R.races.filter((r) => r.party === me.party);
    if (!mine.length) return '';
    return `<div class="box"><div class="band">Leadership races: the caucus votes in January</div><div class="boxpad stack-s">${mine.map((r) => {
      const t = GR.lead.tally(s, bk, r);
      return `<div class="opp"><span class="t"><b class="small">${esc(GR.lead.postName(bk, r.post))}</b>${r.challenge ? ' <span class="chip twarn">challenge</span>' : ' <span class="chip tgood">open seat</span>'}<br>${r.cands.map((id) => `${ui.plink(s, id)} <span class="tiny muted">${t[id] || 0} votes${r.offers[id] ? ` · offers ${esc(GR.lead.OFFERS[r.offers[id]](bk))}` : ''}</span>${r.pledge === id ? ' <b class="tiny good">your pledge</b>' : ''}`).join('<br>')}</span>
        ${r.pledge ? ui.btn('Work the caucus for them (2h)', 'leadwhipfor', r.post, 'bgr sm', s.hoursLeft < 2) : r.cands.map((id) => ui.btn(`Back ${esc(s.pols[id].ln)}`, 'leadpledge', `${r.post}|${id}`, 'bgr sm')).join('')}</div>`;
    }).join('')}<p class="tiny muted">Winners reward the members who stood with them, and remember the ones who didn't. Projected tallies shift as candidates and their backers work the caucus.</p></div></div>`;
  }

  function colleagues(s, bk) {
    const me = s.pols.me;
    let ms = W().members(s, bk).filter((p) => !p.isPlayer);
    // Congress is 535 people: show your delegation, leaders, your committees and anyone you know.
    if (G().isFed(bk)) {
      const mine = new Set(GR.comm.commsOf(s, bk, 'me').flatMap((k) => s.bodies[bk].comm[k].members));
      ms = ms.filter((p) => (p.fed ? p.fed.st === s.home.state : true) || p.lead || Math.abs(G().rel(s, p.id)) >= 5 || (ui.sel.colComm && mine.has(p.id)));
    }
    const sortBy = ui.sel.colSort || 'rel';
    ms.sort((a, b) => (sortBy === 'rel' ? G().rel(s, b.id) - G().rel(s, a.id) : sortBy === 'party' ? a.party.localeCompare(b.party) : a.ln.localeCompare(b.ln)));
    const gift = Math.max(250, Math.round(GR.elect.scale(s, s.seats[me.seat]) * 0.02 / 50) * 50);
    return `<div class="stack">
      <div class="row between"><p>Relationships decide votes. ${G().isFed(bk) ? `Showing your home-state delegation, party leaders and members you know${ui.sel.colComm ? ', plus your committees' : ''}. ${ui.btn(ui.sel.colComm ? 'Hide committee members' : 'Add my committee members', 'colcomm', '', 'bgr sm')}` : ''}</p>
      <div class="seg">${[['rel', 'Relationship'], ['party', 'Party'], ['name', 'Name']].map(([k, l]) => `<button aria-pressed="${sortBy === k}" data-act="colsort" data-a="${k}">${l}</button>`).join('')}</div></div>
      ${ui.table(['Member', 'District', 'Ideology', 'Relationship', ''], ms.map((p) => `<tr><td>${ui.plink(s, p.id)}${p.lead ? '<br><span class="small">' + esc(GR.LEADERSHIP[p.lead.body].find((x) => x.k === p.lead.post).name) + '</span>' : ''}</td><td class="small">${p.fed ? esc(p.fed.st + (p.fed.n ? '-' + String(p.fed.n).padStart(2, '0') : '')) : p.seat ? esc(W().seatTitle(s, s.seats[p.seat]).replace(/^.*?(District|Ward)/, '$1')) : ''}</td><td class="small">${W().ideoLabel((p.fis + p.soc) / 2)}</td><td>${G().relLabel(G().rel(s, p.id))} <span class="small muted">(${Math.round(G().rel(s, p.id))})</span></td><td class="row">${ui.btn('Coffee 2h', 'oact', 'coffee|' + p.id, 'bb sm', s.hoursLeft < 2)}${ui.btn('Give ' + U.money(gift), 'donate', p.id + '|' + gift, 'bgr sm', me.warChest < gift)}</td></tr>`))}
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
  A('decide', (el, a) => { const [id, kind, v] = a.split('|'); G().decide(ui.s, id, kind, v); ui.toast(kind === 'vote' ? `You voted ${v === 'y' ? 'yea' : v === 'n' ? 'nay' : 'present'}.` : kind === 'comm' ? { y: 'Hearing and markup scheduled.', f: 'Fast-tracked to the floor with your endorsement.', h: 'You are holding the bill in committee.', n: 'Tabled.' }[v] : kind === 'cvote' ? 'Committee vote recorded.' : 'Decision recorded.'); ui.save(); });
  A('cosp', (el, a) => ui.res(G().cosponsor(ui.s, a)));
  A('colcomm', () => { ui.sel.colComm = !ui.sel.colComm; });
  A('seek', (el, a) => ui.res(G().seek(ui.s, G().myBody(ui.s), a)));
  A('reqcomm', (el, a) => ui.res(G().requestCommittee(ui.s, a)));
  A('colsort', (el, a) => { ui.sel.colSort = a; });
  A('donate', (el, a) => { const [p, amt] = a.split('|'); ui.res(G().donate(ui.s, p, +amt)); });
  A('leadpledge', (el, a) => { const [post, id] = a.split('|'); GR.scenes.RUN.leadPledge(ui.s, { bk: G().myBody(ui.s), post, id }); ui.toast(`You told ${GR.world.fullName(ui.s.pols[id])} they have your vote.`); ui.save(); });
  A('leadwhipfor', (el, a) => { ui.res(GR.lead.whipFor(ui.s, G().myBody(ui.s), a)); ui.save(); });
  A('leadcaucus', () => { ui.res(GR.lead.caucusMeeting(ui.s)); ui.save(); });
  A('eo', (el, a) => { const [k, to] = a.split('|'); ui.res(G().execOrder(ui.s, k, +to)); });

  return { render, noOffice, overview, schedule, leadership, colleagues, execOrders };
})();
