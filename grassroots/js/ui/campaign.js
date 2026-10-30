// Campaign tab.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiCampaign = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const E = () => GR.elect;
  const C = () => GR.camp;
  const leanLabel = (l) => (Math.abs(l) < 1 ? 'Even' : l > 0 ? 'R+' + Math.round(l) : 'D+' + Math.round(-l));
  const COLORS = ['#1f7fd6', '#e0342c', '#f5a41c', '#2ea043', '#8e44ad', '#555', '#00a6a6'];

  function render(s) {
    if (!s.campaign) return runList(s);
    const r = C().race(s);
    if (!r || !r.cs.me) { s.campaign = null; return runList(s); }
    const tabs = [['overview', 'Overview'], ['events', 'Events'], ['marketing', 'Marketing'], ['opponents', 'Opponents'], ['polls', 'Poll Data'], ['finance', 'Finance'], ['contacts', 'Contacts'], ['staff', 'Staff'], ['policy', 'Policy'], ['volunteers', 'Volunteers'], ['map', 'Campaign Map']];
    const cur = ui.cur('campaign', tabs);
    const f = { overview, events, marketing, opponents, polls, finance, contacts, staff, policy, volunteers, map }[cur];
    return `${ui.tabs('campaign', tabs)}<div class="sheet">${f(s, r)}</div>`;
  }

  // ---------- Races to watch ----------
  // Every seat covering your home: who holds it, when it's up, and what makes it a good time.
  const oddsChip = (o) => `<span class="chip ${o.k === 'favored' ? 'tgood' : o.k === 'competitive' ? 'twarn' : 'tbad'}" title="${esc(o.why.join('. '))}">${esc(o.label)}</span>`;
  const tagHtml = (tags) => tags.map(([t, c]) => `<span class="chip ${c === 'good' ? 'tgood' : c === 'bad' ? 'tbad' : c === 'warn' ? 'twarn' : ''}">${esc(t)}</span>`).join(' ');
  function watchList(s, n) {
    if (!GR.watch) return '';
    // Officeholders only care about lateral moves and step-ups, not a seat below the one they hold.
    const my = s.pols.me.seat && s.seats[s.pols.me.seat];
    const lvl = my ? GR.OFFICES[my.off].level : 0;
    const all = GR.watch.upcoming(s).filter((x) => !x.tooYoung && (!my || (x.id !== s.pols.me.seat && x.off.level >= lvl)));
    // Realistic chances first, sooner first.
    const list = n ? all.slice().sort((a, b) => b.score - a.score - (b.away - a.away) * 0.3).slice(0, n) : all;
    if (!list.length) return '<p class="muted small">No races near you.</p>';
    return list.map((x) => `<div class="opp${x.open ? ' openseat' : ''}"><span class="t"><b class="small">${esc(x.off.name)}</b> <span class="tiny muted">${esc(W().seatTitle(s, x.seat))}</span> ${oddsChip(x.odds)}<br>
      <span class="tiny">${x.next} · ${x.away <= 0 ? 'this year' : x.away === 1 ? 'next year' : `in ${x.away} years`} · ${x.p ? `${ui.plink(s, x.p.id)}` : 'vacant'}</span><br>${tagHtml(x.tags)}${x.odds.why.length ? `<div class="tiny muted" style="margin-top:3px">${esc(x.odds.why.slice(0, 2).join(' · '))}</div>` : ''}</span>
      ${x.canRun.ok ? ui.btn('Declare', 'declare', x.id, 'bb sm') : `<span class="tiny muted" style="max-width:130px;text-align:right">${esc(x.canRun.why)}</span>`}</div>`).join('');
  }

  // ---------- Not running: the list of races ----------
  function runList(s) {
    const me = s.pols.me;
    const hs = W().homeSeats(s, s.home.zi);
    const rows = [];
    GR.OFFICE_ORDER.forEach((off) => {
      let ids = hs[off];
      if (!ids) return;
      if (!Array.isArray(ids)) ids = [ids];
      ids.forEach((id) => {
        const seat = s.seats[id];
        if (!seat) return;
        const inc = s.pols[seat.holder];
        const chk = E().canRun(s, id);
        const y = seat.next;
        const fee = E().filingFee(s, seat);
        const pr = seat.off === 'president' ? null : W().seatProfile(s, seat);
        const w = GR.watch ? GR.watch.upcoming(s).find((x) => x.id === id) : null;
        if (w && w.tooYoung) w.tags = w.tags.concat([['Too young yet', '']]);
        rows.push(`<tr class="${seat.holder === 'me' ? 'me' : ''}"><td><b>${esc(GR.OFFICES[off].name)}</b><br><span class="small">${esc(W().seatTitle(s, seat))}</span></td><td>${inc ? (inc.isPlayer ? '<b>You</b>' : ui.plink(s, inc.id)) : '<span class="muted">Vacant</span>'}${w ? `<br>${w.tooYoung ? '' : oddsChip(w.odds) + ' '}${tagHtml(w.tags.filter((t) => !/^Leans|^Even/.test(t[0])))}` : ''}</td><td class="small">${pr ? leanLabel(pr.lean) + '<br>' + U.num(pr.pop) + ' people' : 'Nation'}</td><td>${y}<br><span class="small muted">file by ${U.fmtDate(E().filingWeek(y, off))}</span></td><td>${chk.ok ? ui.btn(chk.re ? 'Run for re-election' : `Declare (${U.money(fee)})`, 'declare', id, 'bb sm') : `<span class="small muted">${esc(chk.why)}</span>`}</td></tr>`);
      });
    });
    return `${ui.tabs('campaign', [['run', 'Run for Office']])}<div class="sheet stack">
      <p>You can run for any office that covers your home (${esc(s.home.cityName)}, ZIP ${s.home.zip}). Declare before the filing deadline, win your party's primary in June, then the general election in November. Your war chest (${U.money(me.warChest)}) becomes campaign money when you declare.</p>
      <div class="band">Races to watch</div>
      <p class="small muted">Open seats (term-limited or retiring incumbents) and vulnerable incumbents are the best openings. Incumbents announce their plans up to a year ahead; term limits are known as soon as the final term begins.</p>
      <div>${watchList(s, 5)}</div>
      <div class="band">Every office that covers your home</div>
      ${ui.table(['Office', 'Incumbent', 'District', 'Election', ''], rows)}
      <p class="small muted">Term limits here: state legislature ${esc(GR.watch ? GR.watch.limitText(s, 'statehouse').toLowerCase() : '')}; governor ${esc(GR.watch ? GR.watch.limitText(s, 'governor').toLowerCase() : '')}; mayor ${esc(GR.watch ? GR.watch.limitText(s, 'mayor').toLowerCase() : '')}; city council ${esc(GR.watch ? GR.watch.limitText(s, 'council').toLowerCase() : '')}.</p>
      <p class="small muted">School board and city council elections are in odd years; state legislature, Congress and most governors in even years. Starting small builds the name recognition and donor network that bigger races need.</p>
    </div>`;
  }

  function weeksLeft(s, r) {
    const end = r.phase === 'general' ? E().generalWeek(r.year) : r.off === 'president' ? E().conventionWeek(r.year) : E().primaryWeek(r.year);
    return Math.max(0, end - s.week);
  }
  const phaseName = (r) => (r.phase === 'general' ? 'general election' : r.off === 'president' ? 'nominating contests' : 'primary');

  // ---------- Overview ----------
  function overview(s, r) {
    const me = s.pols.me;
    const c = r.cs.me;
    const cp = s.campaign;
    const mgr = cp.staff.manager;
    const wl = weeksLeft(s, r);
    const pred = ui.sel.predict ? C().predict(s) : null;
    const opps = cp.opps.filter((o) => o.kind === 'Rally');
    const funds = cp.opps.filter((o) => o.kind === 'Fundraiser');
    const opRow = (o) => `<div class="opp"><span class="t">${esc(o.label)}</span>${ui.btn('Continue', 'opp', o.id, 'bb sm', s.hoursLeft < 4)}${ui.btn('X', 'oppx', o.id, 'bx')}</div>`;
    const prim = r.phase !== 'general' && (r.prim[me.party].cands.length > 1 || r.off === 'president');
    const op = cp.opinion;
    const cats = ['Economy', 'Education', 'Taxes', 'Health', 'Justice', 'Guns', 'Environment', 'Immigration', 'Defense', 'Social'];
    const catShift = (cat) => { const ks = GR.POLICIES.filter((p) => p.cat === cat).map((p) => p.k); const v = U.sum(ks, (k) => (op[k] || 0) * (W().stance(me, k) === 0 ? 0 : 1)); const prom = U.sum(ks, (k) => cp.promoted[k] || 0); return prom ? Math.min(10, v * 40) : 0; };
    return `<div class="side">
      <div class="box boxpad stack" style="align-items:center;background:var(--row)">
        <b>Campaign Manager</b>
        ${mgr ? `<div style="width:100%">${ui.face(mgr.sd, { g: mgr.g, party: '', age: 38 })}</div><b>${esc(mgr.name)}</b>` : `<p class="small" style="text-align:center">No campaign manager. Hire one under Staff for 5 more hours a week.</p>`}
        ${ui.btn('Schedule', 'sub', 'campaign|events', 'bb wide')}${ui.btn('Marketing', 'sub', 'campaign|marketing', 'bb wide')}${ui.btn('Concepts', 'sub', 'campaign|policy', 'bb wide')}${ui.btn('Withdraw', 'withdraw', '', 'bb wide')}
        ${ui.form.confirmWithdraw ? `<div class="note small">Withdraw from the race? ${ui.btn('Yes, withdraw', 'withdraw2', '', 'bx')}</div>` : ''}
        <div style="border-top:1px solid var(--rule);width:100%;text-align:center;padding-top:4px">Hours Remaining: <b>${s.hoursLeft}</b></div>
      </div>
      <div class="stack">
        <div class="band" style="font-size:1.35rem">Campaign Overview</div>
        <div class="band">General Information</div>
        <p>${esc(W().seatTitle(s, s.seats[r.seat] || { off: 'president' }))} · ${r.year}. The ${phaseName(r)} takes place in <b>${wl}</b> week${wl === 1 ? '' : 's'}${r.phase === 'filing' || (r.phase === 'primary' && s.week < E().filingWeek(r.year, r.off)) ? ` (filing closes ${U.fmtDate(E().filingWeek(r.year, r.off))})` : ''}.${prim ? '' : r.phase !== 'general' ? ' Your primary is uncontested so far.' : ''}</p>
        ${cp.msgs.length ? `<p>Campaign Messages:</p><div class="small">${cp.msgs.slice(0, 5).map((m) => '- ' + esc(m)).join('<br>')}</div>` : ''}
        <div class="band">Campaign Opportunities</div>
        ${opps.length ? `<div class="subhead">Rallies</div>${opps.map(opRow).join('')}` : ''}
        ${funds.length ? `<div class="subhead">Fundraisers</div>${funds.map(opRow).join('')}` : ''}
        ${!cp.opps.length ? '<p class="small muted">No invitations this week.</p>' : ''}
        <div class="band">Finances</div>
        ${ui.table([{ t: 'Campaign Funds', c: 'c' }, { t: 'Campaign Overhead', c: 'c' }, { t: 'Remaining Funds', c: 'c' }], [`<tr><td class="c num">${U.money(c.funds + cp.overhead)}</td><td class="c num bad">${U.money(cp.overhead)}</td><td class="c num">${U.money(c.funds)}</td></tr>`])}
        <div class="band">Campaign Metrics</div>
        ${ui.mrow('<b>Name Recognition</b>', c.rec)}
        <div class="box"><div class="secband" style="text-align:center;font-size:1.1rem;background:var(--row);color:var(--ink);border-bottom:1px solid var(--line)">Voter Enthusiasm</div>
          <p class="boxpad small">Voter enthusiasm is the share of each group that supports your campaign's message. Promote ideas voters like and it rises; promote ideas they dislike and it falls.</p>
          ${ui.mrow('Democrats', c.enth.D, 'dem')}${ui.mrow('Republicans', c.enth.R, 'red')}${ui.mrow('Independents', c.enth.I, 'grey')}</div>
        <div class="box"><div class="secband" style="text-align:center;font-size:1.1rem;background:var(--row);color:var(--ink);border-bottom:1px solid var(--line)">Effect on Public Opinion</div>
          <p class="boxpad small">How public opinion has moved toward your positions during the campaign. Most voters' minds are made up: at most, opinion moves 10%.</p>
          ${cats.map((cat) => { const v = catShift(cat); return `<div class="diverge"><span>${cat}</span><span class="l">${v < 0 ? `<i style="width:${Math.min(100, -v * 10)}%"></i>` : ''}</span><span class="rr">${v > 0 ? `<i style="width:${Math.min(100, v * 10)}%"></i>` : ''}</span><span class="small">${v ? (v > 0 ? '+' : '') + Math.round(v) + '%' : ''}</span></div>`; }).join('')}</div>
        <div class="row">${ui.btn('Predict Election', 'predict', '', 'bb pill')}${ui.btn('Commission a poll', 'poll', '', 'bgr')}</div>
        ${pred ? predictBox(s, r, pred) : ''}
      </div></div>`;
  }

  function predictBox(s, r, pred) {
    const rows = pred.list.map((id) => { const p = s.pols[id]; return `<tr class="${id === 'me' ? 'me' : ''}"><td>${id === 'me' ? '<b>You</b>' : ui.plink(s, id)}</td><td>${ui.chip(p.party)}</td><td class="r">${(pred.share[id] * 100).toFixed(1)}%</td></tr>`; });
    return `<div class="box"><div class="band">Projected ${pred.prim ? 'primary' : 'general election'} result (if held today)</div>${ui.table(['Candidate', 'Party', 'Vote'], rows)}<p class="boxpad small muted">Projections ignore late swings, debates and turnout surprises.</p></div>`;
  }

  // ---------- Events ----------
  function events(s, r) {
    const areas = C().areas(s);
    const sel = areas.some((a) => String(a.k) === String(ui.sel.area)) ? ui.sel.area : (areas[0] && areas[0].k);
    const A = areas.find((a) => String(a.k) === String(sel));
    return `<div class="side"><div class="stack">${hours(s)}<p class="small muted">Rallies, town halls and door-knocking work in one ${r.off === 'president' ? 'state' : r.off === 'governor' || r.off === 'ussenate' ? 'county' : 'neighborhood'} at a time. Smaller places move faster.</p></div><div class="stack">
      <label class="f"><span>Location</span><select class="input" id="areasel" data-ch="area">${areas.slice(0, 300).map((a) => `<option value="${esc(a.k)}" ${String(a.k) === String(sel) ? 'selected' : ''}>${esc(a.name)} · ${U.num(a.pop)}${r.cs.me.presence[a.k] ? ' · presence ' + Math.round(r.cs.me.presence[a.k]) : ''}</option>`).join('')}</select></label>
      ${A ? `<p class="small">${esc(A.name)}: ${leanLabel(A.pr.lean)} · ${Math.round(A.pr.D * 100)}% D, ${Math.round(A.pr.R * 100)}% R, ${Math.round(A.pr.I * 100)}% I</p>` : ''}
      <div class="band">Schedule</div>
      <div>${Object.entries(C().ACTIONS).map(([k, a]) => `<div class="act"><span class="t"><b>${a.name}</b>${a.area ? ' <span class="small">in ' + esc(A ? A.name : '') + '</span>' : ''} <span class="small muted">${esc(a.desc)}</span></span><span class="h">${a.h}h</span>${ui.btn('Go', 'cact', k + '|' + (a.area ? sel : ''), 'bb sm', s.hoursLeft < a.h)}</div>`).join('')}</div>
      ${s.campaign.dirt ? `<div class="note">You have damaging research on ${ui.pname(s, s.campaign.dirt.id)}. Run attack ads against them to use it.</div>` : ''}
    </div></div>`;
  }
  function hours(s) { return `<div class="hours ${s.hoursLeft > 10 ? 'ok' : ''}"><div>Hours Remaining:</div><b>${s.hoursLeft}</b></div>`; }

  // ---------- Marketing ----------
  function marketing(s, r) {
    const cp = s.campaign;
    const c = r.cs.me;
    const opps = (r.phase === 'general' ? r.active : r.prim[s.pols.me.party].cands).filter((id) => id !== 'me');
    const step = Math.max(50, Math.round(r.scale * 0.002 / 50) * 50);
    const max = step * 25;
    return `<div class="stack">
      <p>Ads run every week until you change them, paid from campaign funds (${U.money(c.funds)} on hand). Positive ads build name recognition and enthusiasm; contrast and attack ads drive down an opponent's support, with some risk of backlash.</p>
      <div class="row"><b>Tone</b><div class="seg">${[['positive', 'Positive'], ['contrast', 'Contrast'], ['attack', 'Attack']].map(([k, l]) => `<button aria-pressed="${cp.tone === k}" data-act="tone" data-a="${k}">${l}</button>`).join('')}</div>
      ${cp.tone !== 'positive' ? `<label class="row"><b>Target</b><select class="input" id="tgt" data-ch="target" style="max-width:260px">${opps.map((id) => `<option value="${id}" ${cp.target === id ? 'selected' : ''}>${ui.pname(s, id)}</option>`).join('')}</select></label>` : ''}</div>
      ${ui.table(['Medium', 'Weekly budget', ''], GR.ADS.map((ad) => {
        const off = ad.k === 'tv' && r.scale < ad.minScale;
        return `<tr><td><b>${ad.name}</b>${off ? '<br><span class="small muted">Too small a race for TV</span>' : ''}</td><td style="min-width:180px"><input type="range" min="0" max="${max}" step="${step}" value="${cp.ads[ad.k] || 0}" id="ad${ad.k}" data-in="ad" data-a="${ad.k}" ${off ? 'disabled' : ''}></td><td class="num r">${U.money(cp.ads[ad.k] || 0)}/wk</td></tr>`;
      }))}
      <p>Total: <b>${U.money(U.sum(GR.ADS, (a) => cp.ads[a.k] || 0))}</b> per week · Last week you spent ${U.money(cp.adSpend || 0)} on ads.</p>
    </div>`;
  }

  // ---------- Opponents ----------
  function opponents(s, r) {
    const me = s.pols.me;
    const ids = r.cands.filter((id) => id !== 'me');
    if (!ids.length) return '<p>No opponents have filed yet. More may enter before the filing deadline.</p>';
    return `<div class="cols3">${ids.map((id) => {
      const p = s.pols[id];
      const c = r.cs[id];
      const active = r.phase === 'general' ? r.active.includes(id) : true;
      const diffs = GR.POLICIES.filter((x) => x.ideo > 0).map((x) => ({ x, d: W().stance(p, x.k) - W().stance(me, x.k) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 4);
      return `<div class="box"><div class="band c">${esc(W().fullName(p))}</div><div class="boxpad stack-s" style="${active ? '' : 'opacity:.55'}">
        <div style="max-width:150px;margin:0 auto;width:100%">${ui.facePol(s, p)}</div>
        <div class="small">${GR.PARTIES[p.party].noun}${r.inc === id ? ' · <b>Incumbent</b>' : ''}${p.seat && r.inc !== id ? ' · ' + esc(W().seatTitle(s, s.seats[p.seat])) : ''}${!active ? ' · <b>Eliminated</b>' : ''}</div>
        ${ui.mrow('Name rec.', c.rec)}${ui.mrow('Dem enth.', c.enth.D, 'dem')}${ui.mrow('Rep enth.', c.enth.R, 'red')}${ui.mrow('Ind enth.', c.enth.I, 'grey')}
        <div class="small">Raised ~${U.money(Math.round(c.raised + c.funds + c.spent * 0) / 1000 * 1000)} · Spent ~${U.money(c.spent)}</div>
        ${c.endorse.length ? `<div class="small">Endorsed by ${c.endorse.slice(0, 3).map((e) => esc(e.name)).join(', ')}</div>` : ''}
        <div class="small"><b>Biggest differences with you:</b><br>${diffs.map((x) => `${esc(x.x.name)}: ${esc(GR.policyOpts(x.x, 'n')[GR.scoreToIdx(x.x, W().stance(p, x.x.k), 'n')])}`).join('<br>')}</div>
        ${ui.btn('Profile', 'viewpol', id, 'bgr sm')}
      </div></div>`;
    }).join('')}</div>`;
  }

  // ---------- Polls ----------
  function polls(s, r) {
    const ps = s.campaign.polls;
    const ids = [...new Set(ps.flatMap((p) => Object.keys(p.v)))];
    const series = ids.map((id, i) => ({ name: id === 'me' ? 'You' : s.pols[id] ? s.pols[id].ln : '?', color: id === 'me' ? (s.pols.me.party === 'D' ? '#1f7fd6' : '#e0342c') : COLORS[(i + 2) % COLORS.length], values: ps.map((p) => (p.v[id] == null ? null : p.v[id])) }));
    const pollCost = Math.round(Math.max(500, r.scale * 0.015));
    return `<div class="stack">
      <div class="row">${ui.btn(`Commission a poll (${U.money(pollCost)})`, 'poll', '', 'bb pill')}<span class="small muted">${s.campaign.staff.pollster ? 'Your pollster runs a free poll every two weeks.' : 'Hire a pollster for regular, more accurate polls.'}</span></div>
      ${ps.length ? `<div class="box boxpad">${ui.lines(series, ps.map((p) => U.MON3[U.monthOf(p.w)] + ' ' + U.dateOf(p.w).getUTCDate()), { title: 'Poll Results', fmt: (v) => Math.round(v) + '%', min: 0 })}</div>` : ''}
      ${ui.table(['Date', 'Race', ...ids.map((id) => (id === 'me' ? 'You' : esc(s.pols[id] ? s.pols[id].ln : '?'))), 'Undecided', '±'], ps.slice().reverse().map((p) => `<tr><td class="num">${U.fmtDate(p.w)}</td><td>${p.phase === 'general' ? 'General' : 'Primary'}</td>${ids.map((id) => `<td class="r num">${p.v[id] != null ? p.v[id] + '%' : '—'}</td>`).join('')}<td class="r num">${p.und}%</td><td class="r num">${p.moe}</td></tr>`), { empty: 'No polls yet.' })}
    </div>`;
  }

  // ---------- Finance ----------
  function finance(s, r) {
    const me = s.pols.me;
    const c = r.cs.me;
    const led = s.campaign.ledger.slice().reverse();
    const by = {};
    s.campaign.ledger.forEach((l) => { by[l.src.replace(/ with .*$/, '').replace(/ PAC$/, ' PACs')] = (by[l.src.replace(/ with .*$/, '').replace(/ PAC$/, ' PACs')] || 0) + l.amt; });
    return `<div class="cols"><div class="stack">
      ${ui.kv([['Cash on hand', U.money(c.funds)], ['Raised this campaign', U.money(c.raised)], ['Spent this campaign', U.money(c.spent)], ['Weekly overhead (staff, offices)', U.money(s.campaign.overhead)], ['Typical cost of this race', U.money(r.scale)], ['Your personal savings', U.money(me.money)]])}
      <div class="band">Self-fund</div>
      <div class="row"><input class="input grow" id="selffund" inputmode="numeric" placeholder="Amount">${ui.btn('Transfer', 'selffund', '', 'bb sm')}</div>
    </div><div class="stack">
      ${ui.table(['Source', 'Total'], Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="r num">${U.money(v)}</td></tr>`), { caption: 'Donations by source', empty: 'No donations yet.' })}
      ${ui.table(['Week', 'Source', 'Amount'], led.slice(0, 20).map((l) => `<tr><td class="num">${U.fmtDate(l.w)}</td><td class="small">${esc(l.src)}</td><td class="r num">${U.money(l.amt)}</td></tr>`), { caption: 'Recent donations' })}
    </div></div>`;
  }

  // ---------- Contacts ----------
  function contacts(s, r) {
    const list = C().endorsers(s);
    const c = r.cs.me;
    return `<div class="stack">
      <p>Endorsements from interest groups and fellow ${GR.PARTIES[s.pols.me.party].noun}s bring votes, credibility and sometimes PAC money. Each meeting costs 3 hours and political points. Groups back candidates who share their views and look viable.</p>
      ${c.endorse.length ? `<div class="note"><b>Your endorsements:</b> ${c.endorse.map((e) => esc(e.name)).join(', ')}</div>` : ''}
      ${ui.table(['Contact', 'Type', 'Chance', 'Cost', ''], list.filter((e) => !e.have).slice(0, 40).map((e) => `<tr><td>${e.pol ? ui.plink(s, e.pol) : esc(e.name)}</td><td class="small">${esc(e.kind)}</td><td class="r">${e.taken ? '<span class="muted">Backing a rival</span>' : Math.round(e.p * 100) + '%'}</td><td class="r">${e.pp} pts</td><td>${e.taken ? '' : ui.btn('Ask', 'endorse', e.k, 'bb sm', s.hoursLeft < 3 || s.pols.me.pp < e.pp)}</td></tr>`))}
    </div>`;
  }

  // ---------- Staff ----------
  function staff(s) {
    const cp = s.campaign;
    return `<div class="stack"><p>Staff are paid weekly from campaign funds (your overhead). If the money runs out, they quit.</p>
      ${ui.table(['Role', 'What they do', 'Weekly pay', 'Staffer', ''], GR.STAFF.map((st) => { const h = cp.staff[st.k]; return `<tr><td><b>${st.name}</b></td><td class="small">${esc(st.desc)}</td><td class="r num">${U.money(C().staffCost(s, st.k))}</td><td>${h ? `<span class="mini">${ui.face(h.sd, { g: h.g, age: 36 }).replace('class="face"', '')}<span>${esc(h.name)}</span></span>` : '<span class="muted">Open</span>'}</td><td>${ui.btn(h ? 'Let go' : 'Hire', 'staff', st.k, h ? 'bgr sm' : 'bb sm')}</td></tr>`; }))}</div>`;
  }

  // ---------- Policy ----------
  function policy(s, r) {
    const me = s.pols.me;
    const lvl = GR.lvlOf(GR.OFFICES[r.off].jur);
    const pols = GR.POLICIES.filter((p) => p.lv.includes(lvl) || p.lv.includes('n'));
    const cats = [...new Set(pols.map((p) => p.cat))];
    const cat = cats.includes(ui.sel.ccat) ? ui.sel.ccat : cats[0];
    const lp = s.campaign.lastPromote;
    return `<div class="stack">
      <p>Promote a position (3 hours) to make it part of your campaign message. Each group's enthusiasm moves with how much they agree. The percentages show how many of each group agree with you here.</p>
      ${lp ? `<div class="note small">Last message, ${esc(GR.POLICY[lp.k].name)}: Democrats ${lp.fx.D >= 0 ? '+' : ''}${lp.fx.D.toFixed(1)}, Republicans ${lp.fx.R >= 0 ? '+' : ''}${lp.fx.R.toFixed(1)}, Independents ${lp.fx.I >= 0 ? '+' : ''}${lp.fx.I.toFixed(1)}.</div>` : ''}
      <div class="tabs-xs" style="display:flex;flex-wrap:wrap;gap:2px">${cats.map((c) => `<button class="tab ${c === cat ? 'on' : ''}" data-act="ccat2" data-a="${c}">${c}</button>`).join('')}</div>
      ${ui.table(['Your position', 'Dem', 'Rep', 'Ind', 'Times', ''], pols.filter((p) => p.cat === cat).map((p) => {
        const sc = W().stance(me, p.k);
        const g = (x) => GR.elect.groupAgree(r.pr, x, p, sc);
        const cell = (v) => `<td class="r ${v >= 55 ? 'good' : v < 40 ? 'bad' : ''}">${v}%</td>`;
        return `<tr><td><b>${esc(p.name)}:</b> ${esc(GR.policyOpts(p, 'n')[me.pos[p.k]])}</td>${cell(g('D'))}${cell(g('R'))}${cell(g('I'))}<td class="r">${s.campaign.promoted[p.k] || ''}</td><td>${ui.btn('Promote', 'promote', p.k, 'bb sm', s.hoursLeft < 3)}</td></tr>`;
      }))}
      <p class="small muted">To change a position, use Profile → Policy. Changing positions mid-campaign costs enthusiasm.</p>
    </div>`;
  }

  // ---------- Volunteers ----------
  function volunteers(s, r) {
    const c = r.cs.me;
    const areas = C().areas(s);
    const sel = areas.some((a) => String(a.k) === String(ui.sel.varea)) ? ui.sel.varea : areas[0] && areas[0].k;
    const offices = Object.entries(c.offices).map(([k, n]) => ({ a: areas.find((x) => String(x.k) === k), n })).filter((x) => x.a);
    return `<div class="stack">
      ${ui.kv([['Active volunteers', U.num(c.vols || 0)], ['Volunteer offices', U.sum(offices, (x) => x.n)], ['Ground game', Math.round((c.ground / r.scale) * 100) + '% of a full operation']])}
      <p>Offices recruit volunteers every week. Volunteers knock doors and make calls, building your presence where the office is. Recruiting is stronger when your own party's voters are enthusiastic.</p>
      <div class="row"><select class="input grow" id="vsel" data-ch="varea">${areas.slice(0, 300).map((a) => `<option value="${esc(a.k)}" ${String(a.k) === String(sel) ? 'selected' : ''}>${esc(a.name)} · ${U.num(a.pop)}</option>`).join('')}</select>${ui.btn(`Open office (${U.money(C().officeCost(s))})`, 'office', String(sel), 'bb sm')}</div>
      ${ui.table(['Location', 'Offices', 'Your presence'], offices.map((x) => `<tr><td>${esc(x.a.name)}</td><td class="r">${x.n}</td><td>${ui.bar((c.presence[x.a.k] || 0) / 35 * 100)}</td></tr>`), { empty: 'No volunteer offices yet.' })}
    </div>`;
  }

  // ---------- Map ----------
  function map(s, r) {
    const me = s.pols.me;
    if (r.off === 'president') return presMap(s, r);
    const pred = C().predict(s);
    const opp = pred.list.find((id) => id !== 'me' && s.pols[id].party !== me.party) || pred.list.find((id) => id !== 'me');
    const areas = C().areas(s);
    const share = (pr, k) => {
      if (!opp) return 0.5;
      const out = E().shares(s, r, ['me', opp], pr, pred.prim ? { primary: me.party, area: k } : { area: k });
      const rv = s.pols[opp].party === 'R' && me.party === 'D' ? out.share[opp] : me.party === 'R' ? out.share.me : out.share[opp];
      return pred.prim ? (me.party === 'D' ? 1 - out.share.me : out.share.me) : rv;
    };
    const sel = ui.sel.marea;
    const A = areas.find((a) => String(a.k) === String(sel)) || areas[0];
    let mapHtml;
    if (r.off === 'governor' || r.off === 'ussenate') {
      const byK = {};
      areas.forEach((a) => { byK[a.k] = share(a.pr, a.k); });
      mapHtml = ui.stateMap(s, s.home.state, (k) => ui.marginColor(byK[k] != null ? byK[k] : 0.5), { act: 'marea', tip: (k) => `${me.party === 'R' ? 'You' : 'Opponent'} ${Math.round((byK[k] || 0.5) * 100)}% (R share)` });
    } else {
      const S = GR.geo.state(s.home.state);
      const dots = areas.map((a) => { const z = S.Z[S.zipIdx[a.k]]; return z ? { x: z.x, y: z.y, r: 2 + Math.sqrt(a.pop) / 60, fill: ui.marginColor(share(a.pr, a.k)), tip: a.name } : null; }).filter(Boolean);
      const xs = dots.map((d) => d.x), ys = dots.map((d) => d.y);
      const pad = 6;
      const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(20, Math.max(...xs) - x0 + pad), h = Math.max(20, Math.max(...ys) - y0 + pad);
      mapHtml = `<svg class="map" viewBox="${x0} ${y0} ${w} ${h}" role="img" aria-label="District map"><path class="outline" d="${GR.GEO[s.home.state].outline}"/><g class="dotz">${dots.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${Math.min(d.r, Math.max(w, h) / 25)}" fill="${d.fill}"><title>${esc(d.tip)}</title></circle>`).join('')}</g></svg>`;
    }
    return `<div class="cols"><div class="stack"><div class="mapbox">${mapHtml}</div><div class="legend"><span><i style="background:${ui.marginColor(0.2)}"></i>Strong D</span><span><i style="background:${ui.marginColor(0.45)}"></i>Lean D</span><span><i style="background:${ui.marginColor(0.55)}"></i>Lean R</span><span><i style="background:${ui.marginColor(0.8)}"></i>Strong R</span></div></div>
      <div class="stack">${A ? `<div class="box boxpad stack" style="background:var(--row)"><h3>${esc(A.name)}</h3><div class="row">${ui.pie([{ v: A.pr.D, c: 'var(--dem)' }, { v: A.pr.R, c: 'var(--rep)' }, { v: A.pr.I, c: 'var(--ind)' }])}<div class="small">Population: ${U.num(A.pop)}<br>Lean: ${leanLabel(A.pr.lean)}<br>Democrats: ${Math.round(A.pr.D * 100)}%<br>Republicans: ${Math.round(A.pr.R * 100)}%<br>Independents: ${Math.round(A.pr.I * 100)}%<br>Your presence: ${Math.round(r.cs.me.presence[A.k] || 0)}</div></div>
        <label class="f"><span>Area</span><select class="input" id="maparea" data-ch="marea2">${areas.slice(0, 300).map((a) => `<option value="${esc(a.k)}" ${a === A ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label></div>` : ''}
        ${ui.btn('Predict Election', 'predict', '', 'bb wide')}${ui.sel.predict ? predictBox(s, r, pred) : ''}</div></div>`;
  }

  function presMap(s, r) {
    const me = s.pols.me;
    const sel = ui.sel.mstate || s.home.state;
    const P = GR.pres.projectEC(s);
    const share = (ab) => { const sh = P.st[ab]; const rid = P.cands.find((id) => s.pols[id].party === 'R'); return rid ? sh[rid] || 0.5 : 0.5; };
    const st = GR.STATE[sel];
    const pr = GR.pres.stateProfile(sel);
    const next = E().PRES_CAL.map((c, i) => ({ c, i, w: E().presContestWeek(r.year, i) })).find((x) => x.w >= s.week);
    const cal = E().PRES_CAL.findIndex((c) => c.st.includes(sel));
    let ev = { me: 0, them: 0 };
    GR.STATES.forEach((x) => { const m = P.st[x.ab]; const mine = m.me != null ? m.me : 0; const best = Math.max(...Object.values(m)); if (mine >= best && m.me != null) ev.me += E().EV(x.ab); else ev.them += E().EV(x.ab); });
    return `<div class="cols"><div class="stack"><div class="mapbox">${ui.usMap((ab) => ui.marginColor(share(ab)), { act: 'mstate', sel, tip: (ab) => `${E().EV(ab)} electoral votes` })}</div>
      <p class="small">${r.phase === 'general' ? `Projected electoral votes: <b>you ${ev.me}</b>, opponent ${ev.them}. 270 to win.` : `Delegates: <b>${r.del.me || 0}</b> of ${Math.ceil(GR.pres.totalDelegates() / 2)} needed.${next ? ` Next: ${next.c.name}, ${U.fmtDate(next.w)}.` : ''}`}</p></div>
      <div class="box boxpad stack" style="background:var(--row)"><h3>${esc(st.name)}</h3><div class="row">${ui.pie([{ v: pr.D, c: 'var(--dem)' }, { v: pr.R, c: 'var(--rep)' }, { v: pr.I, c: 'var(--ind)' }])}<div class="small">Delegates: ${E().delegates(sel)}<br>Distribution: Proportional<br>${cal >= 0 ? `Primary: ${esc(E().PRES_CAL[cal].name)} (${U.fmtDate(E().presContestWeek(r.year, cal))})` : ''}<br>Electoral votes: ${E().EV(sel)}<br>Democrats: ${Math.round(pr.D * 100)}%<br>Republicans: ${Math.round(pr.R * 100)}%<br>Independents: ${Math.round(pr.I * 100)}%<br>Your presence: ${Math.round(r.cs.me.presence[sel] || 0)}</div></div>
        ${ui.btn('Campaign here (Events)', 'campstate', sel, 'bb wide')}${ui.btn('Predict Election', 'predict', '', 'bb wide')}${ui.sel.predict ? predictBox(s, r, C().predict(s)) : ''}</div></div>`;
  }

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  A('declare', (el, a) => {
    const r = E().declare(ui.s, a);
    if (!r.ok) ui.toast(r.why || r.msg);
    else { ui.toast('You are officially a candidate!'); ui.sub.campaign = 'overview'; ui.save(); }
  });
  A('withdraw', () => { ui.form.confirmWithdraw = true; });
  A('withdraw2', () => { C().withdraw(ui.s); ui.form.confirmWithdraw = false; ui.toast('You withdrew from the race.'); });
  A('opp', (el, a) => ui.res(C().takeOpp(ui.s, a)));
  A('oppx', (el, a) => { C().dropOpp(ui.s, a); });
  A('predict', () => { ui.sel.predict = !ui.sel.predict; });
  A('poll', () => { const r = C().takePoll(ui.s); ui.res(r); if (r.ok) ui.sub.campaign = 'polls'; });
  A('area', (el) => { ui.sel.area = el.value; });
  A('cact', (el, a) => { const [k, area] = a.split('|'); ui.res(C().act(ui.s, k, area || null)); });
  A('tone', (el, a) => { ui.s.campaign.tone = a; });
  A('target', (el) => { ui.s.campaign.target = el.value; });
  A('ad', (el, a) => { ui.s.campaign.ads[a] = +el.value; ui.render(); });
  A('selffund', () => { const v = +(document.getElementById('selffund').value || '').replace(/[^\d]/g, ''); ui.res(C().transfer(ui.s, v)); });
  A('endorse', (el, a) => ui.res(C().askEndorse(ui.s, a)));
  A('staff', (el, a) => ui.res(C().toggleStaff(ui.s, a)));
  A('ccat2', (el, a) => { ui.sel.ccat = a; });
  A('promote', (el, a) => ui.res(C().promote(ui.s, a)));
  A('varea', (el) => { ui.sel.varea = el.value; });
  A('office', (el, a) => ui.res(C().openOffice(ui.s, a)));
  A('marea', (el, a) => { const S = GR.geo.state(ui.s.home.state); void S; ui.sel.marea = a; });
  A('marea2', (el) => { ui.sel.marea = el.value; });
  A('mstate', (el, a) => { ui.sel.mstate = a; });
  A('campstate', (el, a) => { ui.sel.area = a; ui.sub.campaign = 'events'; });

  // The best realistic first (or next) race, and what it takes.
  function nextStep(s) {
    if (!GR.watch) return '';
    const me = s.pols.me;
    const all = GR.watch.upcoming(s).filter((x) => !x.tooYoung && (!me.seat || x.off.level > GR.OFFICES[s.seats[me.seat].off].level));
    if (!all.length) return '<p class="small muted">No races within reach right now.</p>';
    const best = all.slice().sort((a, b) => (b.odds.z - b.away * 0.35) - (a.odds.z - a.away * 0.35))[0];
    const y = U.yearOf(s.week);
    const fw = E().filingWeek(best.next, best.seat.off);
    const ow = E().declareOpenWeek(best.next);
    const wk = (w) => Math.max(0, Math.round((w - s.week)));
    const when = s.week < ow ? `Filing opens ${U.fmtDate(ow)} (${wk(ow)} weeks)` : s.week <= fw ? `<b class="warn">Filing closes ${U.fmtDate(fw)} (${wk(fw)} weeks)</b>` : 'Filing has closed';
    const o = best.odds;
    const rec = Math.round(o.myRec), need = Math.round(Math.min(90, o.oppRec * 0.8));
    return `<div class="opp openseat"><span class="t"><b>${esc(best.off.name)}</b> <span class="tiny muted">${esc(W().seatTitle(s, best.seat))}</span> ${oddsChip(o)}<br><span class="tiny">Election ${best.next} · ${when}</span><br><span class="tiny muted">${esc(o.why.join(' · ') || 'A realistic place to start.')}</span></span>${best.canRun.ok ? ui.btn('Declare', 'declare', best.id, 'bo sm') : ''}</div>
      <div class="tiny muted" style="margin:8px 0 4px">To be ready</div>
      ${ui.meter('Name recognition', rec / 100, true, `${rec}% of ~${need}%`)}
      ${ui.meter('Money saved before declaring', Math.min(1, me.warChest / Math.max(1, o.cost * 0.4)), true, `${U.money(me.warChest)} of ~${U.money(o.cost * 0.4)}`)}<p class="tiny muted">A full race costs about ${U.money(o.cost)}; saving ~40% up front lets you raise the rest on the trail.</p>
      ${ui.meter('Party standing (for the primary)', me.standing / 100, true, Math.round(me.standing))}
      <p class="tiny muted" style="margin-top:4px">Raise recognition and money through community work (Life & Family → Life): networking, volunteering, party events and op-eds. Your war chest moves into the campaign when you declare.</p>`;
  }

  return { render, watchList, nextStep, oddsChip };
})();
