// Legislature: every bill as a row with its stage and odds, and a detail desk for the one you
// pick: the stage tracker, whip count, committee and markup, the executive's position, and
// every lever you have on it. Negotiations: dealing with the executive (or, as the executive,
// with legislative leaders), with individual lawmakers, and the roll-call record.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiLegis = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const G = () => GR.gov;
  const L = () => GR.legis;
  const X = () => GR.xneg;
  const V = () => GR.uiGov;
  const sig = (x) => 1 / (1 + Math.exp(-x));
  const short = (bk) => GR.BODIES[bk].name.replace(/^(U\.S\.|State|City)\s+/, '');
  const myJur = (s) => G().myJur(s) || (s.pols.me.seat && GR.OFFICES[s.seats[s.pols.me.seat].off].jur);
  const isExec = (s) => { const me = s.pols.me; return !!(me.seat && GR.OFFICES[s.seats[me.seat].off].exec); };

  // ---------- Forecasts ----------
  function myVote(s, b, bk) {
    if (G().myBody(s) !== bk) return null;
    if (b.my[bk]) return b.my[bk];
    if (b.spon === 'me' || b.cos.includes('me')) return 'y';
    return L().components(s, s.pols.me, b).score > 0 ? 'y' : 'n';
  }
  // Projected roll in a chamber, cached until something changes.
  function forecast(s, b, bk = b.body) {
    const key = [s.week, s.hoursLeft, Math.round(s.pols.me.pp), (b.amends || []).length, b.stage, b.body, b.execEndorse, b.vetoThreat, Object.keys(b.pledges).length, Object.keys(b.sweet).length, (b.prov.ear || []).length].join('|');
    b._fc = b._fc && b._fc.key === key ? b._fc : { key, by: {} };
    if (b._fc.by[bk]) return b._fc.by[bk];
    const stage = bk === 'ussenate' && b.kind !== 'reconciliation' && b.kind !== 'budget' ? 'cloture' : 'floor';
    const r = L().roll(s, b, bk, { noise: false, myVote: myVote(s, b, bk) });
    const need = L().needed(s, b, bk, stage);
    const p = U.clamp(sig((r.y - need + 0.5) / Math.max(1.2, r.total * 0.03)), 0.01, 0.99);
    return (b._fc.by[bk] = { r, need, p, stage, total: r.total });
  }
  // Committee: will the chair schedule it, and will members report it?
  function commOdds(s, b) {
    const Bd = s.bodies[b.body];
    const cm = Bd && Bd.comm[b.comm];
    if (!cm) return { pChair: 1, pVote: 1 };
    const chair = s.pols[cm.chair];
    const must = ['budget', 'cr'].includes(b.kind);
    let pChair = 1, chairNote = '';
    if (b.stage === 'committee') {
      if (!chair) chairNote = 'No chair';
      else if (chair.isPlayer) { pChair = 1; chairNote = 'You hold the gavel'; }
      else if (must || b.agreed[chair.id] || b.leaderPush === b.body) { pChair = 1; chairNote = 'Chair will schedule it'; }
      else {
        const sc = L().components(s, chair, b).score;
        const th = b.spon === 'me' ? 0.02 : -0.02;
        pChair = U.clamp(sig((sc - th) * 30), 0.03, 0.97);
        chairNote = sc >= th ? 'Chair inclined to schedule' : `Chair is blocking (score ${sc.toFixed(2)})`;
      }
    }
    const r = L().roll(s, b, b.body, { only: cm.members, noise: false, myVote: GR.comm.isMember(s, b.body, b.comm, 'me') ? (b.my['cv' + b.body] || myVote(s, b, b.body)) : null });
    const need = Math.floor((r.y + r.n) / 2) + 1;
    const pVote = must ? 1 : U.clamp(sig((r.y - need + 0.5) / 1.2), 0.02, 0.98);
    return { chair, pChair, chairNote, r, need, pVote };
  }
  function stageOdds(s, b) {
    if (!L().OPEN(b) || b.stage === 'exec') return null;
    if (b.stage === 'committee' || b.stage === 'markup') { const c = commOdds(s, b); return { p: c.pChair * c.pVote, what: 'out of committee' }; }
    return { p: forecast(s, b).p, what: b.stage === 'cloture' ? 'to break a filibuster' : 'on the floor' };
  }

  // ---------- Labels ----------
  function stageLabel(s, b) {
    const ch = b.stage === 'law' || b.stage === 'dead' || b.stage === 'vetoed' ? '' : ` · ${short(b.body)}`;
    return ({ committee: b.blockedBy ? 'Blocked' : b.held ? 'Held' : 'Committee', markup: 'Markup', cloture: 'Cloture', floor: 'Floor', exec: X().exTitle(s, b.jur) + "'s desk", law: 'Law', dead: 'Died', vetoed: 'Vetoed' }[b.stage] || b.stage) + ch;
  }
  const pill = (s, b) => `<span class="pill ${b.blockedBy ? 'blocked' : b.stage}">${esc(stageLabel(s, b))}</span>`;
  const kindChip = (b) => (b.kind !== 'regular' ? `<span class="chip">${esc({ budget: 'Budget', cr: 'CR', reconciliation: 'Reconciliation', supplemental: 'Supplemental' }[b.kind] || b.kind)}</span> ` : '') + (b.dev ? '<span class="chip">Development</span> ' : '') + (b.agenda ? '<span class="chip">Executive priority</span> ' : '');
  const sponsorOf = (s, b) => (b.spon === 'me' ? 'Your bill' : b.spon && s.pols[b.spon] ? `${W().fullName(s.pols[b.spon])} (${s.pols[b.spon].party})` : 'Leadership');

  function tracker(s, b) {
    const bodies = G().bodiesOf(s, b.jur);
    const ex = G().execOf(s, b.jur);
    const steps = [];
    bodies.forEach((bk) => { steps.push({ k: bk + '|c', t: bodies.length > 1 ? `${short(bk)} committee` : 'Committee' }); steps.push({ k: bk + '|f', t: bodies.length > 1 ? `${short(bk)} floor` : 'Floor' }); });
    if (ex) steps.push({ k: 'exec', t: X().exTitle(s, b.jur) });
    steps.push({ k: 'law', t: 'Law' });
    let cur;
    if (b.stage === 'committee' || b.stage === 'markup') cur = b.body + '|c';
    else if (b.stage === 'floor' || b.stage === 'cloture') cur = b.body + '|f';
    else if (b.stage === 'exec' || b.stage === 'vetoed') cur = 'exec';
    else if (b.stage === 'law') cur = 'law';
    else cur = b.body + (/committee|chair|buried|tabled/.test(b.why || '') ? '|c' : '|f');
    const i = Math.max(0, steps.findIndex((x) => x.k === cur));
    const failed = b.stage === 'dead' || b.stage === 'vetoed';
    return `<div class="stages">${steps.map((x, j) => `<span class="${j < i ? 'on' : j === i ? (failed ? 'fail' : b.stage === 'law' ? 'on' : 'cur') : ''}">${esc(x.t)}</span>`).join('')}</div>`;
  }

  function whip(s, b, bk) {
    const f = forecast(s, b, bk);
    const parties = ['D', 'R'].map((p) => { const rs = f.r.rows.filter((x) => x.party === p); return `${ui.chip(p)} ${rs.filter((x) => x.v === 'y').length}/${rs.length}`; }).join(' · ');
    const swing = f.r.rows.filter((x) => x.v === 'n').sort((a, c) => c.final - a.final).slice(0, 5);
    const pct = (v) => U.clamp(v / f.total * 100, 0, 100);
    return `<div style="margin:4px 0 10px">
      <div class="row between small"><b>${esc(GR.BODIES[bk].name)}${f.stage === 'cloture' ? ' (cloture)' : ''}</b><span><b class="num">${f.r.y}</b> yes · ${f.r.n} no · ${f.need} needed · <span class="odds ${f.p > 0.6 ? 'good' : f.p < 0.4 ? 'bad' : 'warn'}">${Math.round(f.p * 100)}%</span></span></div>
      <div class="whipbar"><i class="${f.r.y >= f.need ? 'ok' : ''}" style="width:${pct(f.r.y)}%"></i><span data-l="${f.need}" style="left:${pct(f.need)}%"></span></div>
      <div class="tiny muted">${parties}${swing.length ? ` · closest no votes: ${swing.map((x) => `${ui.pname(s, x.id)} (${x.final.toFixed(2)})`).join(', ')}` : ''}</div>
    </div>`;
  }

  // ---------- Legislature view ----------
  function legislature(s) {
    const me = s.pols.me;
    const jur = myJur(s);
    const J = s.jur[jur];
    const bk = G().myBody(s);
    const exec = isExec(s);
    const all = (J.bills || []).slice().reverse();
    const open = all.filter((b) => L().OPEN(b));
    const tasks = G().tasks(s).filter((t) => t.b.jur === jur);
    const myComms = bk ? GR.comm.commsOf(s, bk, 'me') : [];
    const filters = [['desk', 'Waiting on you', tasks.length], ['mine', exec ? 'Your agenda' : 'Your bills', open.filter((b) => b.spon === 'me' || b.cos.includes('me')).length]];
    if (!exec && G().execOf(s, jur)) filters.push(['agenda', `${X().exTitle(s, jur)}'s agenda`, X().agenda(s, jur).length]);
    if (bk) filters.push(['comm', 'Your committees', open.filter((b) => b.body === bk && ['committee', 'markup'].includes(b.stage) && myComms.includes(b.comm)).length]);
    filters.push(['all', 'All pending', open.length], ['done', 'Decided', all.length - open.length]);
    let f = ui.sel.legf || (tasks.length ? 'desk' : 'mine');
    if (!filters.some((x) => x[0] === f)) f = 'all';
    const list = {
      desk: tasks.map((t) => t.b),
      mine: open.filter((b) => b.spon === 'me' || b.cos.includes('me')),
      agenda: X().agenda(s, jur),
      comm: open.filter((b) => b.body === bk && ['committee', 'markup'].includes(b.stage) && myComms.includes(b.comm)),
      all: open,
      done: all.filter((b) => !L().OPEN(b)),
    }[f];
    const sel = L().findBill(s, ui.sel.leg) || list[0] || null;
    const row = (b) => {
      const o = stageOdds(s, b);
      const t = tasks.find((x) => x.b === b);
      return `<button class="bill-row ${sel === b ? 'on' : ''}" data-act="legsel" data-a="${b.id}"><div style="min-width:0"><b>${esc(b.title)}</b><div class="tiny muted">${kindChip(b)}${esc(sponsorOf(s, b))}${t ? ` · <b class="warn">${t.kind === 'vote' ? 'your vote' : t.kind === 'sign' ? 'your signature' : t.kind === 'comm' ? 'your gavel' : 'markup vote'}</b>` : ''}</div></div>
        <div class="bill-meta">${pill(s, b)}${o ? `<span class="tiny ${o.p > 0.6 ? 'good' : o.p < 0.4 ? 'bad' : 'warn'}">${Math.round(o.p * 100)}% ${esc(o.what)}</span>` : b.votes.length ? `<span class="tiny muted">${b.votes[b.votes.length - 1].y}–${b.votes[b.votes.length - 1].n}</span>` : ''}</div></button>`;
    };
    const chambers = G().bodiesOf(s, jur).map((k) => {
      const c = W().composition(s, k);
      const n = c.D + c.R + (c.I || 0);
      return `<div style="margin-bottom:6px"><div class="row between small"><b>${esc(GR.BODIES[k].name)}</b><span>${c.D} D · ${c.R} R${c.I ? ` · ${c.I} I` : ''} · ${G().inSession(s, k) ? '<span class="good">in session</span>' : '<span class="muted">interim</span>'}</span></div>
        <div class="diverge" style="grid-template-columns:1fr 1fr;padding:0"><span class="l" style="min-height:8px"><i style="width:${c.R / n * 100}%;top:0;bottom:0"></i></span><span class="rr" style="min-height:8px"><i style="width:${c.D / n * 100}%;top:0;bottom:0"></i></span></div></div>`;
    }).join('');
    const left = ui.panel(`${esc(J.name)} · ${open.length} bills pending`, `${chambers}
      <div class="row" style="margin:6px 0">${ui.btn('✍️ Write a bill', 'tab', 'builder', 'bo sm')}${bk ? ui.btn('⚖️ Committees', 'tab', 'committees', 'bgr sm') : ''}${ui.btn('🤝 Negotiations', 'tab', 'nego', 'bgr sm')}</div>
      <div class="tabs-xs">${filters.map(([k, l, n]) => `<button class="tab ${k === f ? 'on' : ''}" data-act="legf" data-a="${k}">${esc(l)}${n ? ` <span class="dot" style="background:var(--panel-3);color:var(--ink)">${n}</span>` : ''}</button>`).join('')}</div>
      ${list.slice(0, 40).map(row).join('') || `<p class="muted small">${f === 'mine' ? 'You have no bills moving. Open the Bill Builder to draft one.' : f === 'desk' ? 'Nothing is waiting on you.' : 'Nothing here.'}</p>`}`);
    const right = sel ? detail(s, sel) : ui.panel('How a bill becomes law', howTo(s, jur));
    return `<div class="vhead"><h2>Legislature</h2><span class="sub">${esc(G().briefingLabel(s))}</span></div><div class="grid2"><div>${left}</div><div>${right}</div></div>`;
  }

  function howTo(s, jur) {
    const two = G().bodiesOf(s, jur).length > 1;
    return `<ol class="small" style="padding-left:18px;margin:0;display:flex;flex-direction:column;gap:6px">
      <li><b>Introduce</b> a bill from the Bill Builder (6 hours and political points). It is referred to the committee that covers its biggest provision.</li>
      <li><b>Committee</b>: the chair decides whether it gets a hearing. Lobby the chair, cut a deal, or file a discharge petition. If you sit on the committee, you write amendments and earmarks in <b>markup</b>, then members vote to report it.</li>
      <li><b>Floor</b>: every member scores the bill on tax ideology, their district, agency performance and political capital. Work the closest no votes with earmarks, amendments, trades and pledges.${two ? ' Then the other chamber repeats the process.' : ''}</li>
      <li><b>${X().exTitle(s, jur)}</b>: signs or vetoes. Ask for a signing commitment early. They may counter with an amendment, your vote on their priority, or a favor. Overriding a veto takes two-thirds.</li></ol>`;
  }

  function detail(s, b) {
    const me = s.pols.me;
    const live = L().OPEN(b);
    if (!b.an) L().analysis(s, b);
    const t = G().tasks(s).find((x) => x.b === b);
    const mine = b.spon === 'me';
    const myC = L().components(s, me, b);
    const line = L().partyLine(s, b, me.party);
    const bodies = G().bodiesOf(s, b.jur);
    const head = `<div class="small muted">${kindChip(b)}${b.fac ? esc(GR.billgen.FACTIONS[b.fac].name) + ' · ' : ''}${b.tool ? esc(GR.billgen.TOOLS[b.tool].name) + ' · ' : ''}${b.crisis ? 'Targets ' + esc(GR.CRISIS_TYPES[b.crisis].name.toLowerCase()) + ' · ' : ''}Sponsor ${b.spon && !mine ? ui.plink(s, b.spon) : mine ? '<b>you</b>' : 'leadership'}${b.cos.length ? ` · ${b.cos.length} co-sponsor${b.cos.length === 1 ? '' : 's'}` : ''}</div>
      ${tracker(s, b)}
      <p class="small">${esc(b.sum || L().describe(s, b).slice(0, 3).join('; '))}</p>
      <div class="ind" style="margin:8px 0">${ui.stat('Your district', `<span class="${myC.di >= 0 ? 'good' : 'bad'}">${myC.di >= 0 ? '+' : ''}${myC.di.toFixed(2)}</span>`)}${ui.stat('Your ideology', `<span class="${myC.it >= 0 ? 'good' : 'bad'}">${myC.it >= 0 ? '+' : ''}${myC.it.toFixed(2)}</span>`)}${ui.stat('Party line', line > 0 ? '<span class="good">Yes</span>' : line < 0 ? '<span class="bad">No</span>' : 'Free vote')}${ui.stat('10-yr deficit', `<span class="${b.an.cumDef > 0 ? 'bad' : 'good'}">${b.an.cumDef >= 0 ? '+' : '−'}${U.money(Math.abs(b.an.cumDef))}</span>`)}</div>
      ${!live ? `<div class="note">${b.stage === 'law' ? `Signed into law ${U.fmtDate(b.done)}${b.override ? ' over a veto' : ''}.` : b.stage === 'vetoed' ? `Vetoed ${U.fmtDate(b.done)}.` : `Died ${U.fmtDate(b.done)}: ${esc(b.why || '')}.`}</div>` : ''}`;
    let act = '';
    if (t) act = ui.panel('Waiting on you', yourMove(s, b, t), 'urgent');
    let floor = '';
    if (live && !['exec'].includes(b.stage)) {
      const rest = bodies.slice(bodies.indexOf(b.body));
      floor = ui.panel('Whip count', rest.map((bk) => whip(s, b, bk)).join('') + `<p class="tiny muted">Projection with no deals: members weigh tax ideology ×0.3, their district ×0.3, agency performance ×0.2 and political capital (earmarks, pledges, the party whip, the executive) ×0.2. Caucuses vote as blocs.</p>`);
    }
    const comm = live && ['committee', 'markup'].includes(b.stage) ? ui.panel(`Committee · ${esc(GR.comm.nameOf(b.body, b.comm))}`, committee(s, b)) : '';
    const exec = live ? execPanel(s, b) : '';
    const levers = live ? ui.panel('Your levers', levers_(s, b)) : '';
    const rolls = (s.rolls || []).filter((r) => r.bill === b.id);
    const record = (b.votes.length || rolls.length) ? ui.panel('Record', b.votes.map((v) => `<div class="small">${U.fmtDate(v.w)} · ${esc(GR.BODIES[v.body].name)} ${esc(v.stage)}: <b class="${v.pass ? 'good' : 'bad'}">${v.y}–${v.n}</b> (${v.need} needed)</div>`).join('') + (rolls.length ? `<div class="row" style="margin-top:6px">${rolls.slice(0, 4).map((r) => ui.btn(`Roll call: ${short(r.body)} ${r.stage}`, 'rollview', r.id, 'bgr sm')).join('')}</div>` : '')) : '';
    return ui.panel(esc(b.title), head) + act + exec + comm + floor + levers + record;
  }

  function yourMove(s, b, t) {
    const c = L().components(s, s.pols.me, b);
    const V0 = V();
    if (t.kind === 'vote') return `<p class="small">${b.stage === 'cloture' ? 'Cloture vote: 60 votes end debate.' : 'Floor vote.'} Your district scores it ${c.di >= 0 ? '+' : ''}${c.di.toFixed(2)}; your party ${L().partyLine(s, b, s.pols.me.party) > 0 ? 'wants a yes' : L().partyLine(s, b, s.pols.me.party) < 0 ? 'wants a no' : 'leaves it to you'}.${(s.deals || []).some((d) => d.bill === b.id) ? ' <b>You promised your vote on this bill.</b>' : ''}</p><div class="row" style="margin-top:6px">${ui.btn('Vote yea', 'decide', `${b.id}|vote|y`, 'bgr yes')}${ui.btn('Vote nay', 'decide', `${b.id}|vote|n`, 'bgr no')}${ui.btn('Present', 'decide', `${b.id}|vote|a`, 'bgr')}</div>`;
    if (t.kind === 'comm') return `<p class="small">You chair the committee. Schedule a hearing and markup, fast-track it to the floor with your endorsement, hold it, or table it.</p><div class="row" style="margin-top:6px">${V0.chairButtons(b)}</div>`;
    if (t.kind === 'cvote') return `<p class="small">Markup is open. Offer amendments in the committee panel below, then vote to report it.</p><div class="row" style="margin-top:6px">${ui.btn('Report favorably', 'decide', `${b.id}|cvote|y`, 'bgr yes')}${ui.btn('Oppose', 'decide', `${b.id}|cvote|n`, 'bgr no')}${ui.btn('Pass', 'decide', `${b.id}|cvote|a`, 'bgr')}</div>`;
    const pr = (s.promises || {})[b.id];
    return `<p class="small">On your desk. Signing a bill your district dislikes costs approval; vetoing a bill its sponsor wanted costs the relationship.${pr ? ` <b>You promised ${esc(W().fullName(s.pols[pr]))} you would sign it.</b>` : ''}</p><div class="row" style="margin-top:6px">${ui.btn('Sign into law', 'decide', `${b.id}|sign|y`, 'bgr yes')}${ui.btn('Veto', 'decide', `${b.id}|sign|n`, 'bgr no')}</div>`;
  }

  function committee(s, b) {
    const c = commOdds(s, b);
    const cm = s.bodies[b.body].comm[b.comm];
    const pct = (v) => U.clamp(v / Math.max(1, c.r.y + c.r.n) * 100, 0, 100);
    return `<div class="row between small"><span>${b.stage === 'committee' ? `<b>${esc(c.chairNote)}</b>` : '<b>Markup underway</b>'}</span><span>Committee vote: <b>${c.r.y}</b>–${c.r.n} · ${c.need} needed</span></div>
      <div class="whipbar"><i class="${c.r.y >= c.need ? 'ok' : ''}" style="width:${pct(c.r.y)}%"></i><span data-l="${c.need}" style="left:${pct(c.need)}%"></span></div>
      <p class="tiny muted" style="margin-bottom:6px">${cm.members.length} members · ${GR.comm.isMember(s, b.body, b.comm, 'me') ? 'you sit on it, so you can write amendments and earmarks in markup' : 'you are not a member: lobby the chair, or ask leadership to push it'}${b.leaderPush === b.body ? ' · <b>leadership is pushing it</b>' : ''}</p>
      ${V().committeePanel(s, b)}`;
  }

  // The executive's position and how to move it.
  function execPanel(s, b) {
    const me = s.pols.me;
    const ex = G().execOf(s, b.jur);
    if (!ex) return '';
    const st = X().stance(s, b);
    const title = X().exTitle(s, b.jur);
    if (ex.isPlayer) {
      const sc = L().components(s, me, b).score;
      const pr = (s.promises || {})[b.id];
      return ui.panel('Your signature', `<p class="small">You score this bill <b class="${sc >= 0 ? 'good' : 'bad'}">${sc >= 0 ? '+' : ''}${sc.toFixed(2)}</b>.${b.vetoThreat ? ' <b>You have threatened to veto it.</b> Your party\'s lawmakers feel the pressure.' : ''}${pr ? ` You promised ${esc(W().fullName(s.pols[pr]))} you would sign it.` : ''}</p>
        <div class="row" style="margin-top:6px">${b.spon !== 'me' && !b.vetoThreat && b.stage !== 'exec' ? ui.btn('Threaten a veto (5 PP)', 'xthreat', b.id, 'bgr sm', me.pp < 5) : ''}${b.kind === 'budget' && !b.summit ? ui.btn('Call a budget summit', 'xsummit', '', 'bgr sm') : ''}${ui.btn('Legislative affairs', 'gotab', 'nego|exec', 'bgr sm')}</div>`);
    }
    const mine = b.spon === 'me' || b.cos.includes('me');
    const x = X().st(s, b.jur);
    let body = `<div class="xstance">${ui.facePol(s, ex)}<div><div class="k">${esc(W().fullName(ex))} ${ui.chip(ex.party)}</div><div class="tiny muted">${esc(title)} · ${G().relLabel(G().rel(s, ex.id))} with you · favors: ${x.favors > 0 ? `they owe you ${x.favors}` : x.favors < 0 ? `you owe them ${-x.favors}` : 'even'}</div></div><span class="stamp ${st.k}" style="margin-left:auto">${esc(st.label.split(' · ')[0])}</span></div>`;
    if (b.vetoThreat) body += '<p class="small bad" style="margin-top:6px">Veto threat issued: their party\'s lawmakers are under pressure to vote no.</p>';
    if (b.execEndorse && st.k === 'sign') body += '<p class="small good" style="margin-top:6px">Publicly endorsed: their party\'s lawmakers lean yes.</p>';
    if (mine && st.k !== 'sign') {
      const cool = (x.cool[b.id] || -99) > s.week - 4;
      body += `<div class="row" style="margin-top:8px">${ui.btn(`Ask ${title.toLowerCase()} to commit to sign (2h)`, 'xask', b.id, 'bb sm', s.hoursLeft < 2 || cool)}${cool ? `<span class="tiny muted">Asked recently. Try again ${U.fmtDate(x.cool[b.id] + 4)}.</span>` : ''}</div>`;
      if (b.xcounter) body += `<div class="tiny muted" style="margin-top:6px">Their staff's counteroffers:</div>${b.xcounter.map((c) => `<div class="counter"><span class="t">${esc(c.label)}</span>${ui.btn('Accept', 'xaccept', `${b.id}|${c.k}`, 'bb sm', c.k === 'capital' && me.pp < c.pp)}</div>`).join('')}`;
    }
    if (b.agenda && b.body === G().myBody(s) && !b.my[b.body]) {
      const promised = (s.deals || []).some((d) => d.bill === b.id);
      body += promised ? '<p class="small" style="margin-top:6px"><b>You promised your vote.</b> Breaking it costs you badly.</p>'
        : `<p class="small" style="margin-top:6px">This is the ${title.toLowerCase()}'s priority. Your vote has a price.</p><div class="row" style="margin-top:4px">${ui.btn('Pledge your vote: they owe you', 'xpledge', `${b.id}|favor`, 'bgr sm', s.hoursLeft < 1)}${ui.btn('Pledge for a district project', 'xpledge', `${b.id}|project`, 'bgr sm', s.hoursLeft < 1)}</div>`;
    }
    return ui.panel(`The ${esc(title.toLowerCase())}`, body);
  }

  function levers_(s, b) {
    const me = s.pols.me;
    const bk = G().myBody(s);
    const mine = b.spon === 'me';
    const leader = me.lead && me.lead.body === b.body;
    const out = [];
    if (mine) {
      const cps = L().counterparties(s, b).slice(0, 7);
      out.push(`<div class="scroll-x"><table class="tbl"><thead><tr><th>Lawmaker</th><th class="r">Score</th><th>Deals (2h each)</th></tr></thead><tbody>${cps.map((x) => `<tr><td class="small">${ui.plink(s, x.id)}<br><span class="tiny muted">${esc(x.role)}${b.agreed[x.id] ? ' · <b class="good">agreed</b>' : ''}${b.pledges[x.id] ? ' · <b class="good">pledged</b>' : ''}</span></td><td class="r num ${x.c.score > 0 ? 'good' : 'bad'}">${x.c.score.toFixed(2)}</td><td><span class="row">${x.role === 'Committee chair' && b.stage === 'committee' && !b.agreed[x.id] ? ui.btn('Hearing', 'nego', `${b.id}|${x.id}|hearing`, 'bb sm', s.hoursLeft < 3) : ''}${[['earmark', 'Earmark'], ['amend', 'Amend'], ['trade', 'Trade'], ['pledge', 'Pledge']].map(([k, l]) => ui.btn(l, 'nego', `${b.id}|${x.id}|${k}`, 'bgr sm', s.hoursLeft < 2 || (k === 'earmark' && !L().canEarmark(s, b)))).join('')}</span></td></tr>`).join('')}</tbody></table></div>`);
    }
    const btns = [];
    if ((mine || leader) && b.stage !== 'exec') btns.push(ui.btn('Call the vote', 'callvote', b.id, 'bb sm'));
    if (mine && ['committee', 'markup'].includes(b.stage) && b.body !== 'ussenate' && bk === b.body) btns.push(ui.btn('Discharge petition', 'discharge', b.id, 'bgr sm'));
    if (!mine && b.spon && !b.cos.includes('me') && bk && b.stage === 'committee') btns.push(ui.btn('Co-sponsor', 'cosp', b.id, 'bgr sm'));
    if (mine) btns.push(ui.btn('All negotiations', 'gonego', b.id, 'bgr sm'));
    // Leaders and whips can lock in their party's wavering members.
    if (me.lead && me.lead.body === b.body && /whip|leader|speaker|protem|president|asst/.test(me.lead.post) && L().partyLine(s, b, me.party) > 0) btns.push(ui.btn('Whip operation (4h)', 'leadwhipop', b.id, 'bb sm', s.hoursLeft < 4));
    btns.push(ui.btn('Full analysis', 'billview', b.id, 'bgr sm'));
    out.push(`<div class="row" style="margin-top:6px">${btns.join('')}</div>`);
    if (!mine) out.push('<p class="tiny muted" style="margin-top:4px">Only a bill\'s sponsor can trade for votes on it. Co-sponsor it to put your name on it, or amend it in markup if you sit on the committee.</p>');
    return out.join('');
  }

  // ---------- Negotiations ----------
  function nego(s) {
    const exec = isExec(s);
    const jur = myJur(s);
    const ex = G().execOf(s, jur);
    const tabs = [];
    if (ex || exec) tabs.push(['exec', exec ? 'Legislative leaders' : `${X().exTitle(s, jur)}'s office`]);
    if (!exec) tabs.push(['members', 'Lawmakers']);
    tabs.push(['rolls', 'Roll calls']);
    const cur = ui.cur('nego', tabs);
    const body = cur === 'exec' ? (exec ? leadersView(s) : execView(s, ex)) : cur === 'members' ? `<div class="sheet">${V().negotiations(s)}</div>` : `<div class="sheet">${V().rolls(s)}</div>`;
    return `<div class="vhead"><h2>${exec ? 'Legislative Affairs' : 'Negotiations'}</h2><span class="sub">${esc(s.jur[jur].name)}</span></div>${ui.tabs('nego', tabs)}${body}`;
  }

  // Legislator → the executive.
  function execView(s, ex) {
    const me = s.pols.me;
    const jur = myJur(s);
    const J = s.jur[jur];
    const title = X().exTitle(s, jur);
    const x = X().st(s, jur);
    const rel = G().rel(s, ex.id);
    const pcool = (x.cool.project || -99) > s.week - 26;
    const mine = (J.bills || []).filter((b) => (b.spon === 'me' || b.cos.includes('me')) && L().OPEN(b));
    const ag = X().agenda(s, jur);
    const left = ui.panel(`The ${esc(title.toLowerCase())}`, `<div class="leader-card">${ui.facePol(s, ex)}<div><b>${esc(W().fullName(ex))}</b> ${ui.chip(ex.party)}<br><span class="small muted">${esc(title)} of ${esc(J.name.replace(/^(State|City) of /, ''))}</span><br><span class="small">${ex.party === me.party ? 'Your party' : 'The other party'} · ${G().relLabel(rel)} with you</span></div></div>
      ${ui.meter('Relationship', (rel + 100) / 200, true, Math.round(rel))}
      ${ui.meter('Favor ledger', (x.favors + 6) / 12, true, x.favors > 0 ? `they owe you ${x.favors}` : x.favors < 0 ? `you owe ${-x.favors}` : 'even')}
      <p class="small" style="margin-top:6px">The ${title.toLowerCase()} signs or vetoes everything you pass. A public commitment to sign also moves their party's lawmakers toward yes; a veto threat moves them to no. Favors you owe get called in when their priorities come up.</p>
      <div class="row" style="margin-top:8px">${ui.btn('Ask for a project in your district (3h)', 'xproject', '', 'bb sm', pcool || s.hoursLeft < 3)}</div>${pcool ? `<p class="tiny muted">You asked within six months. Next chance ${U.fmtDate(x.cool.project + 26)}.</p>` : ''}`);
    const billRows = mine.map((b) => { const st = X().stance(s, b); return `<tr><td><a href="#" data-act="legsel" data-a="${b.id}">${esc(b.title)}</a><br><span class="tiny muted">${esc(stageLabel(s, b))}</span>${b.xcounter ? `<div>${b.xcounter.map((c) => `<div class="counter"><span class="t">${esc(c.label)}</span>${ui.btn('Accept', 'xaccept', `${b.id}|${c.k}`, 'bb sm', c.k === 'capital' && me.pp < c.pp)}</div>`).join('')}</div>` : ''}</td><td><span class="stamp ${st.k}">${esc(st.label.split(' · ')[0])}</span></td><td>${st.k !== 'sign' ? ui.btn('Ask to sign (2h)', 'xask', b.id, 'bgr sm', s.hoursLeft < 2 || (x.cool[b.id] || -99) > s.week - 4) : ''}</td></tr>`; });
    const agRows = ag.map((b) => { const c = L().components(s, me, b); const promised = (s.deals || []).some((d) => d.bill === b.id); const mineChamber = b.body === G().myBody(s) && !b.my[b.body]; return `<tr><td><a href="#" data-act="legsel" data-a="${b.id}">${esc(b.title)}</a><br><span class="tiny muted">${esc(b.sum || '')}</span></td><td class="small">${esc(stageLabel(s, b))}</td><td class="r num ${c.di >= 0 ? 'good' : 'bad'}">${c.di >= 0 ? '+' : ''}${c.di.toFixed(2)}</td><td>${promised ? '<b class="small">Promised</b>' : mineChamber ? `<span class="row">${ui.btn('Pledge: favor', 'xpledge', `${b.id}|favor`, 'bgr sm')}${ui.btn('Pledge: project', 'xpledge', `${b.id}|project`, 'bgr sm')}</span>` : '<span class="tiny muted">Not before you</span>'}</td></tr>`; });
    const right = ui.panel('Your bills and their signature', ui.table(['Bill', 'Position', ''], billRows, { empty: 'You have no bills moving. Write one, then ask for a commitment before it reaches the desk.' }))
      + ui.panel(`${esc(title)}'s priorities`, ui.table(['Bill', 'Stage', { t: 'Your district', c: 'r' }, 'Your vote'], agRows, { empty: `The ${title.toLowerCase()} has no priority bills before the legislature right now.` }));
    return `<div class="grid2"><div>${left}</div><div>${right}</div></div>`;
  }

  // Executive → legislative leaders.
  function leadersView(s) {
    const me = s.pols.me;
    const jur = myJur(s);
    const J = s.jur[jur];
    const ls = X().leaders(s);
    const mine = (J.bills || []).filter((b) => b.spon === 'me' && L().OPEN(b));
    const pick = mine.find((b) => b.id === ui.sel.xmine) || mine[0];
    const sel = mine.length ? `<select class="input" style="max-width:260px" data-ch="xmine">${mine.map((b) => `<option value="${b.id}" ${b === pick ? 'selected' : ''}>${esc(b.title)}</option>`).join('')}</select>` : '<span class="small muted">Write a priority bill first.</span>';
    const left = ui.panel('Legislative leaders', `<p class="small" style="margin-bottom:6px">Leaders control the floor and lean on their chairs. Promise to sign a leader's own bill and they will move yours. Break a promise and they remember.</p>
      <div class="row" style="margin-bottom:6px"><b class="small">Your bill</b>${sel}</div>
      ${ls.map((x) => { const theirs = (J.bills || []).find((b) => b.spon === x.id && L().OPEN(b)); return `<div class="opp"><span class="t">${ui.plink(s, x.id)}<br><span class="tiny muted">${esc(x.post)}, ${esc(GR.BODIES[x.body].name)} · ${G().relLabel(G().rel(s, x.id))}${theirs ? ` · their bill: ${esc(theirs.title)}` : ''}</span></span>${ui.btn('Trade signatures (3h)', 'xtrade', `${x.id}`, 'bb sm', !pick || s.hoursLeft < 3)}</div>`; }).join('') || '<p class="muted small">No leaders are seated.</p>'}`);
    const budget = (J.bills || []).find((b) => b.kind === 'budget' && L().OPEN(b));
    const others = (J.bills || []).filter((b) => b.spon !== 'me' && L().OPEN(b) && b.kind === 'regular').slice(0, 25);
    const promises = Object.entries(s.promises || {}).map(([bid, who]) => { const b = L().findBill(s, bid); return b ? `<div class="small">You promised ${ui.plink(s, who)} to sign the <b>${esc(b.title)}</b> (${esc(stageLabel(s, b))}).</div>` : ''; }).join('');
    const right = (budget ? ui.panel('Budget', `<p class="small">The ${esc(budget.title)} is ${esc(stageLabel(s, budget))}.${budget.summit ? ' You held a summit: it has bipartisan cover.' : ' A summit gives the other side a concession and wins the chairs\' cooperation.'}</p><div class="row" style="margin-top:6px">${budget.summit ? '' : ui.btn('Call a budget summit (6h, 10 PP)', 'xsummit', '', 'bb sm', s.hoursLeft < 6 || me.pp < 10)}${ui.btn('Open', 'legsel', budget.id, 'bgr sm')}</div>`) : '')
      + (promises ? ui.panel('Promises you made', promises) : '')
      + ui.panel('Bills moving without you', ui.table(['Bill', 'Stage', { t: 'You score it', c: 'r' }, ''], others.map((b) => { const sc = L().components(s, me, b).score; return `<tr><td><a href="#" data-act="legsel" data-a="${b.id}">${esc(b.title)}</a><br><span class="tiny muted">${esc(sponsorOf(s, b))}</span></td><td class="small">${esc(stageLabel(s, b))}</td><td class="r num ${sc >= 0 ? 'good' : 'bad'}">${sc >= 0 ? '+' : ''}${sc.toFixed(2)}</td><td>${b.stage === 'exec' ? ui.btn('On your desk', 'legsel', b.id, 'bb sm') : b.vetoThreat ? '<b class="small bad">Veto threatened</b>' : ui.btn('Threaten veto (5 PP)', 'xthreat', b.id, 'bgr sm', me.pp < 5)}</td></tr>`; }), { empty: 'The legislature has nothing else moving.' }));
    return `<div class="grid2"><div>${left}</div><div>${right}</div></div>`;
  }

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  A('legsel', (el, a) => { ui.sel.leg = a; ui.tab = 'legis'; ui.modal = null; const b = L().findBill(ui.s, a); if (b && !L().OPEN(b)) ui.sel.legf = 'done'; else if (b && ui.sel.legf === 'done') ui.sel.legf = 'all'; window.scrollTo(0, 0); });
  A('legf', (el, a) => { ui.sel.legf = a; ui.sel.leg = null; });
  A('leadwhipop', (el, a) => { ui.res(GR.lead.whipOp(ui.s, a)); ui.save(); });
  A('xask', (el, a) => { ui.res(X().askSign(ui.s, a)); ui.save(); });
  A('xaccept', (el, a) => { const [id, k] = a.split('|'); ui.res(X().acceptCounter(ui.s, id, k)); ui.save(); });
  A('xproject', () => { ui.res(X().askProject(ui.s)); ui.save(); });
  A('xpledge', (el, a) => { const [id, k] = a.split('|'); ui.res(X().pledge(ui.s, id, k)); ui.save(); });
  A('xmine', (el) => { ui.sel.xmine = el.value; });
  A('xtrade', (el, a) => { const s = ui.s; const mine = (s.jur[myJur(s)].bills || []).filter((b) => b.spon === 'me' && L().OPEN(b)); const pick = mine.find((b) => b.id === ui.sel.xmine) || mine[0]; if (!pick) return; ui.res(X().tradeSignature(s, a, pick.id)); ui.save(); });
  A('xthreat', (el, a) => { ui.res(X().threaten(ui.s, a)); ui.save(); });
  A('xsummit', () => { ui.res(X().summit(ui.s)); ui.save(); });

  return { legislature, nego, forecast, stageOdds, tracker };
})();
