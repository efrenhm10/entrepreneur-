// Main game screen: status strip, tab bar, Next Turn, overlays, News and Profile tabs.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiGame = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;

  const ICON = {
    people: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="7" r="3.6"/><circle cx="16.5" cy="7.5" r="3.2"/><path d="M1.5 21c0-4.4 3-7.6 6.5-7.6s6.5 3.2 6.5 7.6z"/><path d="M13.6 13.8c.9-.5 1.9-.8 2.9-.8 3.3 0 6 2.9 6 7.2h-7.4c0-2.7-.6-4.7-1.5-6.4z"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3 7 7.6.6-5.8 5 1.8 7.4L12 17.9 5.4 21.8l1.8-7.4-5.8-5 7.6-.6z"/></svg>',
    thumb: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 10h4v11H2zM8 21V10l4.6-7.6c1.3-.5 2.6.4 2.4 1.9L14 9h6.2c1.2 0 2.1 1.1 1.8 2.3l-2 8.2c-.3.9-1 1.5-2 1.5z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.5 5.5L12 13l9.5-7.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 11.5l4 4L22 3" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>',
  };
  const TABS = [['office', 'Office'], ['campaign', 'Campaign'], ['politicians', 'Politicians'], ['elections', 'Elections'], ['metrics', 'Metrics'], ['profile', 'Profile'], ['news', 'News']];

  function constituents(s) {
    const me = s.pols.me;
    const seat = me.seat ? s.seats[me.seat] : s.campaign ? s.seats[s.campaign.seat] : null;
    if (seat) return seat.off === 'president' ? 340e6 : W().seatProfile(s, seat).pop;
    return s.city.pop;
  }
  const unread = (s) => s.inbox.filter((x) => !x.done).length;
  const weekOfYear = (s) => { const d = U.dateOf(s.week); return Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 6048e5) + 1; };

  function render() {
    const s = ui.s;
    const me = s.pols.me;
    if (s.over) return overScreen(s);
    const tasks = GR.gov.tasks(s).length;
    const n = unread(s);
    const approval = me.seat ? Math.round(me.app) : Math.round(U.clamp(50 + me.fav / 2, 0, 100));
    let body = '';
    const t = ui.tab;
    if (t === 'office') body = GR.uiOffice.render(s);
    else if (t === 'campaign') body = GR.uiCampaign.render(s);
    else if (t === 'politicians') body = GR.uiWorld.politicians(s);
    else if (t === 'elections') body = GR.uiWorld.elections(s);
    else if (t === 'metrics') body = GR.uiWorld.metrics(s);
    else if (t === 'profile') body = profile(s);
    else body = news(s);
    return `<div class="app">
      <div class="status">
        <span class="st" title="Constituents">${ICON.people}<span class="num">${U.num(constituents(s))}</span></span>
        <span class="st" title="Political points">${ICON.star}<span class="num">${U.num(me.pp)}</span></span>
        <span class="st" title="${me.seat ? 'Approval rating' : 'Favorability'}">${ICON.thumb}<span class="num">${approval}%</span></span>
        <button class="st inbox ${n ? '' : 'clear'}" data-act="gotab" data-a="news|inbox" title="Inbox">${ICON.mail}<span class="num">${n}</span></button>
        <button class="st tasks" data-act="gotab" data-a="office|docket" title="Votes and decisions waiting">${ICON.check}<span class="num">${tasks}</span></button>
        <span class="st small muted" title="Hours left this week">Hours: <b class="num" style="color:var(--ink)">${s.hoursLeft}</b></span>
      </div>
      <div class="mainbar" role="tablist">
        ${TABS.map(([k, l]) => `<button class="tab ${t === k ? 'on' : ''}" role="tab" aria-selected="${t === k}" data-act="tab" data-a="${k}">${l}${k === 'news' && n ? `<span class="dot">${n}</span>` : k === 'office' && tasks ? `<span class="dot">${tasks}</span>` : ''}</button>`).join('')}
        <button class="tab menu" data-act="menu">Menu</button>
        <span class="when">Week ${weekOfYear(s)}, ${U.yearOf(s.week)}</span>
        <button class="next" data-act="nextTurn">Next Turn</button>
        <span class="brk" aria-hidden="true"></span>
      </div>
      <div class="panel">${body}</div>
    </div>`;
  }

  // ---------- Overlays ----------
  function overlay() {
    const s = ui.s;
    if (!s || !ui.modal) return '';
    const m = ui.modal;
    let inner = '';
    if (m.kind === 'msg') {
      const it = s.inbox.find((x) => x.id === m.id);
      if (!it) { ui.modal = null; return ''; }
      inner = `<div class="band">${esc(it.title)}</div><div class="sheet stack"><div class="small muted">${U.fmtDate(it.w, true)}</div><pre class="msgbody">${esc(it.body)}</pre>
        <div class="stack-s">${it.choices.map((c) => ui.btn(esc(c.label), 'choose', it.id + '|' + c.act, 'bb wide')).join('')}</div>
        ${it.data && it.data.race ? ui.btn('View full results', 'viewrace', it.data.year + '|' + it.data.race, 'bgr') : ''}</div>`;
    } else if (m.kind === 'pol') inner = GR.uiWorld.polModal(s, m.id);
    else if (m.kind === 'menu') inner = menu(s);
    else if (m.kind === 'race') inner = GR.uiWorld.raceModal(s, m.year, m.id);
    else if (m.kind === 'bill') inner = GR.uiGov.billModal(s, m.id);
    return `<div class="overlay" data-act="closeOverlay"><div class="modal" role="dialog" aria-modal="true" data-act="stop">${inner}</div></div>`;
  }

  function menu(s) {
    return `<div class="band">Menu</div><div class="sheet stack">
      <div class="stack-s">
        ${ui.btn('Save game', 'msave', '', 'bb wide')}
        ${ui.btn('Copy save code', 'mexport', '', 'bgr wide')}
        ${ui.btn(`Auto-vote on missed votes: ${s.settings.autoVote ? 'On' : 'Off'}`, 'msetting', 'autoVote', 'bgr wide')}
        ${ui.btn(`Use leftover hours automatically: ${s.settings.autoSpend ? 'On' : 'Off'}`, 'msetting', 'autoSpend', 'bgr wide')}
        ${ui.btn('Theme: ' + (document.documentElement.dataset.theme || 'system'), 'mtheme', '', 'bgr wide')}
        ${ui.btn('Retire from politics', 'mretire', '', 'bgr wide')}
        ${ui.btn('Quit to title', 'mquit', '', 'bgr wide')}
      </div>
      ${ui.form.exportCode ? `<textarea class="input" id="expcode" rows="4" readonly>${esc(ui.form.exportCode)}</textarea><p class="small muted">Copied to your clipboard if allowed. Paste it on the title screen to load this career anywhere.</p>` : ''}
      ${ui.form.confirmRetire ? `<div class="note">Retiring ends this career. ${ui.btn('Yes, retire', 'mretire2', '', 'bx')}</div>` : ''}
      <h4>How to play</h4>
      <p class="small">Each Next Turn is one week. Spend your hours in the Campaign, Office and Profile tabs. Declare for an office in the Campaign tab before the filing deadline, win your party's June primary, then the November general. In office, vote on bills, write laws, build relationships and respect, and run for leadership after each election. Your inbox (envelope) holds decisions; the checkbox counts votes waiting on you.</p>
      ${ui.btn('Close', 'closeOverlay', '', 'bgr')}
    </div>`;
  }

  function overScreen(s) {
    const me = s.pols.me;
    const kids = me.family.kids.map((k, i) => ({ k, i, age: U.yearOf(s.week) - k.by })).filter((x) => x.age >= 18);
    return `<div class="app"><div class="panel" style="margin-top:12px"><div class="sheet stack" style="max-width:760px;margin:0 auto">
      <div class="title-c">${s.over.reason === 'death' ? 'In Memoriam' : 'A Career Remembered'}</div>
      <div class="side"><div>${ui.facePol(s, me)}</div><div class="stack">
        <h2>${esc(me.fn + ' ' + me.ln)} (${U.yearOf(s.week) - s.over.age}–${s.over.reason === 'death' ? U.yearOf(s.week) : ''})</h2>
        ${ui.kv([['Highest office', s.stats.peakOffice ? GR.OFFICES[s.stats.peakOffice].name : 'None'], ['Elections', `${s.stats.elections.filter((e) => e.won).length} won, ${s.stats.elections.filter((e) => !e.won).length} lost`], ['Laws passed', s.stats.billsPassed], ['Family', `${me.family.spouse ? 'Married to ' + esc(me.family.spouse.fn) : 'Unmarried'}, ${me.family.kids.length} child${me.family.kids.length === 1 ? '' : 'ren'}`], ['Legacy score', `<b>${U.num(s.over.legacy)}</b>`]])}
      </div></div>
      <div class="band">Career</div>${ui.table(['Year', 'Office'], me.hist.map((h) => `<tr><td>${h.y}</td><td>${esc(h.t)}</td></tr>`), { empty: 'Never held office.' })}
      ${kids.length ? `<div class="band">Continue the dynasty</div><div class="stack-s">${kids.map((x) => ui.btn(`Play as ${esc(x.k.fn)} ${esc(me.ln)}, ${x.age}`, 'heir', String(x.i), 'bb wide')).join('')}</div>` : '<p class="muted">No adult children to carry on the family name.</p>'}
      ${ui.btn('New career', 'newgame', '', 'bgr')}
    </div></div></div>`;
  }

  // ---------- News ----------
  function news(s) {
    const tabs = [['inbox', 'Inbox', unread(s) || ''], ['headlines', 'Headlines'], ['journal', 'Journal']];
    const cur = ui.cur('news', tabs);
    let body = '';
    if (cur === 'inbox') {
      body = ui.table([{ t: '' }, 'Date', 'Message', ''], s.inbox.slice(0, 40).map((it) => `<tr class="click ${it.done ? '' : 'me'}" data-act="openmsg" data-a="${it.id}"><td>${it.done ? '' : '●'}</td><td class="num" style="white-space:nowrap">${U.fmtDate(it.w)}</td><td>${esc(it.title)}</td><td>${it.done ? '' : ui.btn('Open', 'openmsg', it.id, 'bb sm')}</td></tr>`), { empty: 'Your inbox is empty.' });
    } else if (cur === 'headlines') {
      body = ui.table(['Date', 'Headline'], s.news.slice(0, 60).map((n) => `<tr><td class="num" style="white-space:nowrap">${U.fmtDate(n.w)}</td><td>${esc(n.t)}</td></tr>`));
    } else {
      body = `<div class="stack-s">${s.log.slice(0, 120).map((l) => `<p><b class="num">${U.fmtDate(l.w)}</b> · ${esc(l.t)}</p>`).join('') || '<p class="muted">Nothing yet.</p>'}</div>`;
    }
    return `${ui.tabs('news', tabs)}<div class="sheet">${body}</div>`;
  }

  // ---------- Profile ----------
  function profile(s) {
    const me = s.pols.me;
    const tabs = [['char', 'Character'], ['skills', 'Skills'], ['policy', 'Policy'], ['family', 'Family'], ['life', 'Life'], ['career', 'Career']];
    const cur = ui.cur('profile', tabs);
    let body = '';
    const ax = W().axes(me);
    if (cur === 'char') {
      const seat = me.seat && s.seats[me.seat];
      body = `<div class="side"><div class="stack">${ui.facePol(s, me)}</div><div class="stack">
        <div class="title-c">${esc(me.fn + ' ' + me.ln)}</div>
        <div class="secband">Profile</div>
        ${ui.kv([['Name', esc(me.fn + ' ' + me.ln)], ['Age', GR.life.age(s)], ['Hometown', `${esc(s.home.cityName)}, ${s.home.state} ${s.home.zip}${s.home.county ? ' · ' + esc(s.home.county) + ' County' : ''}`], ['Fiscal Ideology', W().ideoLabel(ax.fis)], ['Social Ideology', W().ideoLabel(ax.soc)], ['Caucus', esc(GR.world.CAUCUSES[me.party].find((c) => c.k === me.caucus).name)], ['Traits', me.traits.map((t) => W().TRAITS.find((x) => x.k === t).name).join(', ')]])}
        <div class="secband">Career</div>
        ${ui.kv([['Title', seat ? esc(W().seatTitle(s, seat)) : 'Private citizen'], ['Party', GR.PARTIES[me.party].noun], ['Political Points', U.num(me.pp)], [me.seat ? 'Approval Rating' : 'Favorability', me.seat ? Math.round(me.app) + '%' : (me.fav >= 0 ? '+' : '') + Math.round(me.fav)], ['Respect among colleagues', Math.round(me.respect || 0) + ' / 100'], ['Party standing', Math.round(me.standing) + ' / 100'], ['Leadership', me.lead ? esc(GR.LEADERSHIP[me.lead.body].find((p) => p.k === me.lead.post).name) : '—'], ['Name recognition', `Local ${Math.round(me.recLocal)}% · State ${Math.round(me.recState)}% · National ${Math.round(me.recNat)}%`], ['Donor network', me.network + ' contacts'], ['War chest', U.money(me.warChest)]])}
        <div class="row">${ui.btn('Change caucus', 'caucusNext', '', 'bgr sm')}<span class="small muted">Caucus membership shapes who backs you in leadership races.</span></div>
      </div></div>`;
    } else if (cur === 'skills') {
      body = `<div class="band">Skills</div>${GR.SKILLS.map((x) => ui.mrow(x.name, me.sk[x.k], '', me.sk[x.k])).join('')}
        <p class="small muted" style="margin:6px 0">Skills grow with practice: rallies and interviews build charisma, debates build debate, committee work and bills build policy, donor calls build fundraising and canvassing builds grassroots.</p>
        <div class="band">Practice (4 hours)</div><div>${GR.SKILLS.map((x) => `<div class="act"><span class="t"><b>Study ${x.name.toLowerCase()}</b> <span class="small muted">${esc(x.desc)}</span></span>${ui.btn('Practice', 'lifeact', 'study|' + x.k, 'bb sm', s.hoursLeft < 4)}</div>`).join('')}</div>`;
    } else if (cur === 'policy') {
      const cat = ui.sel.pcat || GR.POLICY_CATS[0];
      const pols = GR.POLICIES.filter((p) => p.cat === cat);
      body = `<div class="row between"><div class="small">Fiscal: <b>${W().ideoLabel(ax.fis)}</b> · Social: <b>${W().ideoLabel(ax.soc)}</b></div><div class="small muted">Changing a position costs 15 political points and some credibility. Voters notice flip-flops during campaigns.</div></div>
        <div class="tabs-xs" style="display:flex;flex-wrap:wrap;gap:2px;margin-top:6px">${GR.POLICY_CATS.map((c) => `<button class="tab ${c === cat ? 'on' : ''}" data-act="pcat" data-a="${c}">${c}</button>`).join('')}</div>
        <div class="polgrid">${pols.map((p) => `<div class="pol"><b>${esc(p.name)}</b><select id="pp${p.k}" data-ch="setpos" data-a="${p.k}">${GR.policyOpts(p, 'n').map((o, i) => `<option value="${i}" ${me.pos[p.k] === i ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`).join('')}</div>`;
    } else if (cur === 'family') body = family(s);
    else if (cur === 'life') body = life(s);
    else {
      body = `<div class="band">Offices held</div>${ui.table(['Year', 'Office'], me.hist.map((h) => `<tr><td>${h.y}</td><td>${esc(h.t)}</td></tr>`), { empty: 'You have not held office yet.' })}
        <div class="band" style="margin-top:8px">Election record</div>${ui.table(['Year', 'Race', 'Stage', 'Result', 'Vote'], s.stats.elections.slice().reverse().map((e) => `<tr><td>${e.y}</td><td>${esc(e.title)}</td><td>${e.stage}</td><td class="${e.won ? 'good' : 'bad'}">${e.won ? 'Won' : 'Lost'}</td><td class="r">${e.pct ? e.pct + '%' : ''}</td></tr>`), { empty: 'No elections yet.' })}
        <div class="band" style="margin-top:8px">Record</div>${ui.kv([['Votes cast', s.stats.votesCast], ['Bills written', s.stats.billsWritten], ['Bills signed into law', s.stats.billsPassed], ['Legacy score so far', U.num(GR.sim.legacy(s))], ['Generation', s.stats.dynasty || 1]])}`;
    }
    return `${ui.tabs('profile', tabs)}<div class="sheet">${body}</div>`;
  }

  function family(s) {
    const me = s.pols.me;
    const f = me.family;
    const y = U.yearOf(s.week);
    const person = (p, role) => `<div class="pcard" style="cursor:default"><div>${esc(p.fn)} ${esc(p.ln || me.ln)}</div>${ui.face(p.look || p.fn, { g: p.g, age: y - p.by, party: '' })}<div class="small">${role} · ${y - p.by}</div>${ui.mrow('Bond', p.close || 0, 'green')}</div>`;
    const cards = [];
    if (f.spouse) cards.push(person(f.spouse, 'Spouse'));
    if (f.partner) cards.push(person(f.partner, 'Dating'));
    f.kids.forEach((k) => cards.push(person(k, k.g === 'f' ? 'Daughter' : 'Son')));
    const acts = [];
    if (!f.spouse) acts.push(`<div class="act"><span class="t"><b>${f.partner ? 'Date ' + esc(f.partner.fn) : 'Go on a date'}</b> <span class="small muted">4 hours · ${f.partner ? 'grow closer' : 'meet someone new'}</span></span>${ui.btn('Go', 'lifeact', 'date', 'bb sm', s.hoursLeft < 4)}</div>`);
    if (f.partner) acts.push(`<div class="act"><span class="t"><b>Propose to ${esc(f.partner.fn)}</b> <span class="small muted">needs a strong bond · wedding costs about ${U.money(18000 * GR.STATE[s.home.state].col / 100)}</span></span>${ui.btn('Propose', 'propose', '', 'bb sm')}</div>`);
    if (f.spouse) acts.push(`<div class="act"><span class="t"><b>Date night with ${esc(f.spouse.fn)}</b> <span class="small muted">4 hours</span></span>${ui.btn('Go', 'lifeact', 'date', 'bb sm', s.hoursLeft < 4)}</div>`);
    if (f.spouse || f.kids.length) acts.push(`<div class="act"><span class="t"><b>Family time</b> <span class="small muted">4 hours · bond with everyone, lower stress</span></span>${ui.btn('Go', 'lifeact', 'family', 'bb sm', s.hoursLeft < 4)}</div>`);
    if ((f.spouse || f.partner) && !f.pregnant) acts.push(`<div class="act"><span class="t"><b>Try for a baby</b></span>${ui.btn('Try', 'kid', '', 'bb sm')}</div>`);
    if (!f.pregnant) acts.push(`<div class="act"><span class="t"><b>Adopt a child</b> <span class="small muted">about $35,000</span></span>${ui.btn('Adopt', 'kid', 'adopt', 'bgr sm')}</div>`);
    if (f.spouse) acts.push(`<div class="act"><span class="t"><b>File for divorce</b> <span class="small muted">costly and public</span></span>${ui.btn('Divorce', 'divorce', '', 'bx')}</div>`);
    return `<div class="cols3">${cards.join('') || '<p class="muted">No family yet. Go on some dates.</p>'}</div>
      ${f.pregnant ? `<p class="note" style="margin-top:8px">A baby is on the way, due ${U.fmtDate(f.pregnant.due)}.</p>` : ''}
      <div class="band" style="margin-top:8px">Family life</div><div>${acts.join('')}</div>`;
  }

  function life(s) {
    const me = s.pols.me;
    const job = GR.JOB[me.job];
    const ft = GR.life.fullTimeOffice(s);
    const inc = GR.life.weeklyIncome(s), cost = GR.life.weeklyCosts(s);
    const jobs = GR.JOBS.filter((j) => !j.edu.length || j.edu.includes(me.edu));
    return `<div class="cols"><div class="stack">
      <div class="band">Finances</div>${ui.kv([['Savings', U.money(me.money)], ['Debt', U.money(me.debt || 0)], ['Take-home pay (week)', U.money(inc)], ['Living costs (week)', U.money(cost)], ['Job', ft ? 'Full-time public office' : esc(job.name)], ['Education', GR.EDU[me.edu].name + (me.schoolUntil ? ` (studying ${GR.EDU[me.schoolEdu].name}, done ${U.fmtDate(me.schoolUntil)})` : '')]])}
      <div class="band">Health</div>${ui.mrow('Health', me.health, me.health < 40 ? 'red' : 'green')}${ui.mrow('Happiness', me.happy, '')}${ui.mrow('Stress', me.stress, me.stress > 65 ? 'red' : 'grey')}
      <div class="band">Career</div>
      <label class="f"><span>Look for a new job</span><div class="row"><select class="input grow" id="jobsel">${jobs.map((j) => `<option value="${j.k}" ${j.k === me.job ? 'selected' : ''}>${esc(j.name)}${j.salary ? ' · ' + U.money(j.salary * 1000) : ''}</option>`).join('')}</select>${ui.btn('Apply', 'job', '', 'bb sm', ft)}</div></label>
      <label class="f"><span>Go back to school (10 hours a week)</span><div class="row"><select class="input grow" id="edusel">${GR.EDUCATION.filter((e) => e.lvl > GR.EDU[me.edu].lvl || (e.lvl === 3 && e.k !== me.edu && GR.EDU[me.edu].lvl >= 2)).map((e) => `<option value="${e.k}">${esc(e.name)}</option>`).join('')}</select>${ui.btn('Enroll', 'enroll', '', 'bb sm', !!me.schoolUntil)}</div></label>
    </div><div class="stack">
      <div class="band">Community & party (hours)</div>
      <div>${['network', 'volunteer', 'party', 'oped', 'work', 'rest'].map((k) => { const a = GR.life.ACTS[k]; return `<div class="act"><span class="t"><b>${a.name}</b> <span class="small muted">${esc(a.desc)}</span></span><span class="h">${a.h}h</span>${ui.btn('Go', 'lifeact', k, 'bb sm', s.hoursLeft < a.h)}</div>`; }).join('')}</div>
      <div class="band">Move</div>
      <div class="row"><input class="input grow" id="movezip" inputmode="numeric" maxlength="5" placeholder="New ZIP in ${s.home.state}">${ui.btn('Move', 'move', '', 'bgr sm', !!(me.seat || s.campaign))}</div>
      <p class="small muted">Moving changes your districts. You cannot move while in office or campaigning.</p>
    </div></div>`;
  }

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  A('tab', (el, a) => { ui.tab = a; window.scrollTo(0, 0); });
  A('gotab', (el, a) => { const [t, sub] = a.split('|'); ui.tab = t; if (sub) ui.sub[t] = sub; });
  A('menu', () => { ui.modal = { kind: 'menu' }; ui.form.exportCode = null; ui.form.confirmRetire = false; });
  A('closeOverlay', (el, a, e) => { if (e && e.target !== el && el.classList.contains('overlay')) return false; ui.modal = null; });
  A('stop', () => false);
  A('openmsg', (el, a) => { ui.modal = { kind: 'msg', id: a }; });
  A('choose', (el, a) => {
    const i = a.indexOf('|');
    const id = a.slice(0, i), act = a.slice(i + 1);
    const out = GR.sim.choose(ui.s, id, act);
    const it = ui.s.inbox.find((x) => x.id === id);
    if (!it || it.done) ui.modal = null;
    if (out) ui.toast(out);
    ui.save();
  });
  A('viewrace', (el, a) => { const [y, id] = a.split('|'); ui.modal = { kind: 'race', year: +y, id }; });
  A('viewpol', (el, a) => { ui.modal = { kind: 'pol', id: a }; });
  A('nextTurn', () => {
    const s = ui.s;
    const tasks = GR.gov.tasks(s).filter((t) => t.kind === 'vote' || t.kind === 'sign');
    const open = s.inbox.filter((x) => !x.done && x.kind === 'debate');
    if ((tasks.length || open.length) && !ui.warned) {
      ui.warned = true;
      ui.toast(tasks.length ? `You have ${tasks.length} vote${tasks.length === 1 ? '' : 's'} or signature${tasks.length === 1 ? '' : 's'} waiting. Press Next Turn again to skip ${s.settings.autoVote ? '(auto-vote is on)' : '(you will miss them)'}.` : 'A debate invitation is waiting in your inbox. Press Next Turn again to skip it.');
      return;
    }
    ui.warned = false;
    s.inbox.forEach((x) => { if (!x.done && x.kind === 'debate') { GR.debate.decline(s, x); x.done = true; } });
    const before = s.inbox.length;
    GR.sim.endTurn(s);
    ui.save();
    const fresh = s.inbox.slice(0, Math.max(0, s.inbox.length - before + 1)).find((x) => !x.done && (x.kind === 'result' || x.kind === 'debate' || x.kind === 'vp' || x.kind === 'event'));
    if (fresh && (fresh.kind === 'result' || fresh.kind === 'debate' || fresh.kind === 'vp')) ui.modal = { kind: 'msg', id: fresh.id };
  });
  A('msave', () => { ui.toast(GR.state.save(ui.s) ? 'Game saved in this browser.' : 'This browser blocked saving. Use Copy save code instead.'); });
  A('mexport', () => {
    const code = GR.state.exportText(ui.s);
    ui.form.exportCode = code;
    try { navigator.clipboard.writeText(code).then(() => ui.toast('Save code copied.'), () => {}); } catch (e) { /* clipboard unavailable */ }
  });
  A('msetting', (el, a) => { ui.s.settings[a] = !ui.s.settings[a]; });
  A('mtheme', () => {
    const r = document.documentElement;
    const next = !r.dataset.theme ? 'light' : r.dataset.theme === 'light' ? 'dark' : '';
    if (next) r.dataset.theme = next; else delete r.dataset.theme;
    try { localStorage.setItem('grassroots_theme', next); } catch (e) { /* storage unavailable */ }
  });
  A('mretire', () => { ui.form.confirmRetire = true; });
  A('mretire2', () => { GR.sim.retire(ui.s); ui.modal = null; ui.save(); });
  A('mquit', () => { ui.save(); ui.modal = null; ui.screen = 'title'; });
  A('heir', (el, a) => { if (GR.sim.heir(ui.s, +a)) { ui.tab = 'news'; ui.save(); } });
  A('caucusNext', () => { const me = ui.s.pols.me; const list = GR.world.CAUCUSES[me.party]; const i = list.findIndex((c) => c.k === me.caucus); me.caucus = list[(i + 1) % list.length].k; ui.toast('You joined the ' + list[(i + 1) % list.length].name + '.'); });
  A('pcat', (el, a) => { ui.sel.pcat = a; });
  A('setpos', (el, a) => {
    const s = ui.s, me = s.pols.me;
    if (me.pp < 15) { ui.toast('Changing a position costs 15 political points.'); return; }
    me.pp -= 15;
    me.pos[a] = +el.value;
    me.integrity = U.clamp((me.integrity || 70) - 2, 0, 100);
    me.caucus = me.caucus || GR.world.caucusOf(me).k;
    const r = GR.camp.race(s);
    if (r && r.cs.me) {
      ['D', 'R', 'I'].forEach((g) => { r.cs.me.base[g] = GR.elect.baseEnth(s, me, r.pr, g, GR.lvlOf(GR.OFFICES[r.off].jur)); r.cs.me.enth[g] -= 1.5; });
      ui.toast('Position changed. Opponents are calling it a flip-flop.');
    } else ui.toast('Position updated.');
  });
  A('lifeact', (el, a) => { const [k, arg] = a.split('|'); ui.res(GR.life.act(ui.s, k, arg)); });
  A('propose', () => ui.res(GR.life.propose(ui.s)));
  A('kid', (el, a) => ui.res(GR.life.tryForKid(ui.s, a === 'adopt')));
  A('divorce', () => ui.res(GR.life.divorce(ui.s)));
  A('job', () => ui.res(GR.life.changeJob(ui.s, document.getElementById('jobsel').value)));
  A('enroll', () => { const v = document.getElementById('edusel'); if (v && v.value) ui.res(GR.life.enroll(ui.s, v.value)); });
  A('move', () => {
    const s = ui.s;
    const z = (document.getElementById('movezip').value || '').trim();
    const S = GR.geo.state(s.home.state);
    const zi = S.zipIdx[z];
    if (zi == null) { ui.toast(`Enter a residential ZIP code in ${GR.STATE[s.home.state].name}.`); return; }
    ui.res(GR.life.move(s, z, S.Z[zi].city, GR.geo.cityName(S, S.Z[zi].city)));
  });

  return { render, overlay };
})();
