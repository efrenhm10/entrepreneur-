// Office tab: what you do once elected.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiOffice = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const G = () => GR.gov;

  const leanLabel = (l) => (Math.abs(l) < 1 ? 'Even' : l > 0 ? 'R+' + Math.round(l) : 'D+' + Math.round(-l));

  function render(s) {
    const me = s.pols.me;
    if (!me.seat) return noOffice(s);
    const seat = s.seats[me.seat];
    const off = GR.OFFICES[seat.off];
    const bk = G().myBody(s);
    const tasks = G().tasks(s).length;
    const steer = s.steer && !s.steer.done && s.steer.body === bk;
    const tabs = [['brief', 'Briefing'], ['bills', 'Bill Constructor'], ['docket', 'Docket', tasks || ''], ['deals', 'Negotiations'], ['rolls', 'Roll Calls'], ['budget', 'Budget'], ['econ', 'Economy']];
    tabs.push(['power', 'Power Bases']);
    if (seat.off !== 'school') tabs.push(['cabinet', off.exec ? 'Cabinet' : 'Staff']);
    if (off.jur !== 'school') tabs.push(['develop', off.exec ? 'Development' : 'District Development']);
    if (bk) tabs.push(['committees', 'Committees', steer ? '!' : ''], ['leadership', 'Leadership'], ['colleagues', 'Colleagues']);
    tabs.push(['district', 'District'], ['schedule', 'Schedule']);
    if (off.exec) tabs.push(['exec', 'Executive Orders']);
    const cur = ui.cur('office', tabs);
    const V = GR.uiGov;
    const body = {
      brief: () => V.briefing(s), bills: () => V.constructor(s), docket: () => V.docket(s), deals: () => V.negotiations(s), rolls: () => V.rolls(s),
      budget: () => V.budgetView(s), econ: () => V.economy(s), power: () => GR.uiExec.power(s), cabinet: () => GR.uiExec.cabinet(s), develop: () => GR.uiExec.develop(s), committees: () => V.committees(s), leadership: () => leadership(s, bk), colleagues: () => colleagues(s, bk),
      district: () => GR.uiExec.dossier(s) + overview(s, seat), schedule: () => schedule(s), exec: () => execOrders(s),
    }[cur] || (() => V.briefing(s));
    return `${ui.tabs('office', tabs)}<div class="sheet">${body()}</div>`;
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
  A('eo', (el, a) => { const [k, to] = a.split('|'); ui.res(G().execOrder(ui.s, k, +to)); });

  return { render };
})();
