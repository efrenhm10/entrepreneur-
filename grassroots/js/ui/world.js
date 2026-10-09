// Politicians, Elections and Metrics tabs, plus politician and race pop-ups.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiWorld = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const G = () => GR.gov;
  const leanLabel = (l) => (Math.abs(l) < 1 ? 'Even' : l > 0 ? 'R+' + Math.round(l) : 'D+' + Math.round(-l));
  const partyColor = (p) => (p === 'R' ? 'var(--rep)' : p === 'D' ? 'var(--dem)' : 'var(--ind)');

  // ---------- Politician detail ----------
  function polDetail(s, p, key = 'pd') {
    if (!p) return '<p class="muted">No one selected.</p>';
    const seat = p.seat && s.seats[p.seat];
    const tabs = [['summary', 'Summary'], ['history', 'History'], ['committees', 'Committees'], ['policy', 'Policy']];
    const cur = ui.cur(key, tabs);
    const ax = W().axes(p);
    const cau = W().CAUCUSES[p.party].find((c) => c.k === (p.caucus || W().caucusOf(p).k));
    let body = '';
    if (cur === 'summary') {
      const title = seat ? W().seatTitle(s, seat) : p.title || (p.retired ? 'Retired' : p.alive ? 'Private citizen' : 'Deceased');
      const relv = G().rel(s, p.id);
      body = `<div class="title-c">${esc(W().fullName(p))}</div>
        <div class="secband">Profile</div>
        ${ui.kv([['Name', esc(W().fullName(p))], ['Age', W().ageOf(s, p)], ['Fiscal Ideology', W().ideoLabel(ax.fis)], ['Social Ideology', W().ideoLabel(ax.soc)], ['Caucus', `<a href="#" data-act="noop">${esc(cau.name)}</a>`]])}
        <div class="secband">Career</div>
        ${ui.kv([['Title', esc(title)], ['Term', seat ? (p.terms[seat.off] || 1) : '—'], ['Party', GR.PARTIES[p.party].noun], ['Political Points', U.num(p.pp)], ['Approval Rating', Math.round(p.app) + '%'], ['Traits', esc((p.isPlayer ? p.traits.map((t) => W().TRAITS.find((x) => x.k === t).name) : p.traits).join(', '))],
          p.lead ? ['Leadership', esc(GR.LEADERSHIP[p.lead.body].find((x) => x.k === p.lead.post).name)] : null,
          !p.isPlayer ? ['Relationship with you', `${G().relLabel(relv)} (${Math.round(relv)})`] : null, seat && seat.off !== 'president' ? ['Next election', seat.next] : null])}`;
    } else if (cur === 'history') {
      body = ui.table(['Year', 'Position'], p.hist.slice().reverse().map((h) => `<tr><td>${h.y}</td><td>${esc(h.t)}</td></tr>`), { empty: 'No history.' });
    } else if (cur === 'committees') {
      const rows = [];
      Object.entries(s.bodies).forEach(([bk, B]) => Object.entries(B.comm).forEach(([k, c]) => { if (c.members.includes(p.id)) rows.push(`<tr><td>${GR.BODIES[bk].name}</td><td>${esc(G().committeeName({ body: bk, comm: k }))}</td><td>${c.chair === p.id ? 'Chair' : 'Member'}</td></tr>`); }));
      body = ui.table(['Chamber', 'Committee', 'Role'], rows, { empty: 'No committee assignments.' });
    } else {
      body = `<div class="polgrid">${GR.POLICIES.filter((x) => x.ideo > 0).map((x) => `<div class="pol"><b>${esc(x.name)}</b><span style="padding:2px 6px;border-left:1px solid var(--line)">${esc(GR.policyOpts(x, 'n')[GR.scoreToIdx(x, W().stance(p, x.k), 'n')])}</span></div>`).join('')}</div>`;
    }
    return `<div class="cols" style="grid-template-columns:minmax(0,1fr) minmax(0,260px)"><div class="stack">${ui.tabs(key, tabs, 'tabs-xs')}<div class="box boxpad" style="margin-top:-1px">${body}</div></div><div>${ui.facePol(s, p)}${!p.isPlayer && G().myBody(s) && p.seat && W().members(s, G().myBody(s)).includes(p) ? `<div class="stack-s" style="margin-top:6px">${ui.btn('Coffee (2h)', 'oact', 'coffee|' + p.id, 'bb wide', s.hoursLeft < 2)}</div>` : ''}</div></div>`;
  }

  function polModal(s, id) {
    const p = s.pols[id];
    return `<div class="band">${p ? esc(W().fullName(p)) : 'Politician'}</div><div class="sheet">${polDetail(s, p, 'pdm')}<div style="margin-top:8px">${ui.btn('Close', 'closeOverlay', '', 'bgr')}</div></div>`;
  }

  // ---------- Politicians tab ----------
  function politicians(s) {
    const lv = [['city', 'City'], ['state', 'State'], ['federal', 'Federal']];
    const L = ui.cur('plv', lv);
    const st = GR.STATE[s.home.state];
    const bodies = {
      city: [['mayor', 'Mayor'], ['council', 'Council'], ['school', 'School Board']],
      state: [st.gov !== 'none' ? ['governor', 'Governor'] : null, s.bodies.house ? ['house', 'House'] : null, s.bodies.senate ? ['senate', st.lo ? 'Senate' : 'Legislature'] : null].filter(Boolean),
      federal: [['president', 'President'], ['ushouse', 'House'], s.bodies.ussenate && st.sc.length ? ['ussenate', 'Senate'] : null].filter(Boolean),
    }[L];
    const bk = ui.cur('pbody' + L, bodies);
    let inner;
    if (['mayor', 'governor', 'president'].includes(bk)) {
      const seat = s.seats[{ mayor: 'mayor', governor: 'gov', president: 'pres' }[bk]];
      const p = seat && s.pols[seat.holder];
      inner = `<div class="sheet">${polDetail(s, p, 'pdx')}</div>`;
    } else {
      const tabs = [['summary', 'Summary'], ['politicians', 'Politicians'], ['committees', 'Committees'], ['caucuses', 'Caucuses'], ['rankings', 'Rankings'], ['districts', 'Districts']];
      const cur = ui.cur('pview', tabs);
      inner = `<div class="panel" style="box-shadow:none">${ui.tabs('pview', tabs, 'tabs-xs')}<div class="sheet">${bodyView(s, bk, cur)}</div></div>`;
    }
    return `${ui.tabs('plv', lv)}<div class="panel" style="box-shadow:none">${ui.tabs('pbody' + L, bodies)}${inner}</div>`;
  }

  function bodyView(s, bk, cur) {
    const B = s.bodies[bk];
    if (!B) return '<p class="muted">This chamber does not exist here.</p>';
    const ms = W().members(s, bk);
    const comp = W().composition(s, bk);
    const fed = G().isFed(bk);
    if (cur === 'summary') {
      const maj = W().majority(s, bk);
      return `<div class="cols"><div class="stack">
        <div class="band">${GR.BODIES[bk].name}${fed ? ' (whole chamber)' : ''}</div>
        <div class="row">${ui.pie([{ v: comp.D, c: 'var(--dem)' }, { v: comp.R, c: 'var(--rep)' }])}<div>${ui.kv([['Democrats', comp.D], ['Republicans', comp.R], ['Majority', GR.PARTIES[maj].name]])}</div></div>
        ${fed ? `<p class="small muted">Your state's delegation: ${ms.length} member${ms.length === 1 ? '' : 's'}.</p>` : ''}
      </div><div class="stack"><div class="band">Leadership</div>
        ${ui.table(['Post', 'Held by'], G().posts(s, bk).map((p) => `<tr><td>${esc(p.name)}</td><td>${p.holder ? (p.holder.isPlayer ? '<b>You</b>' : ui.plink(s, p.holder.id) + (p.holder.ext ? ` <span class="small muted">${esc(p.holder.st)}</span>` : '')) : '—'}</td></tr>`))}</div></div>`;
    }
    if (cur === 'politicians') {
      const sel = ms.find((p) => p.id === ui.sel.pol) || ms[0];
      return `<div class="side" style="grid-template-columns:200px minmax(0,1fr)"><div class="plist">${ms.map((p) => `<button class="pcard ${p === sel ? 'on' : ''}" data-act="pickpol" data-a="${p.id}"><div>${esc(W().fullName(p))}</div>${ui.facePol(s, p)}<div>(${p.party} - ${esc(W().seatTitle(s, s.seats[p.seat]).replace(/^.*?(District|Ward|-)\s*/, '').slice(0, 14))})</div></button>`).join('')}</div><div class="panel" style="box-shadow:none;background:var(--panel)">${polDetail(s, sel, 'pdl')}</div></div>`;
    }
    if (cur === 'committees') {
      const jur = GR.BODIES[bk].jur;
      const list = GR.COMMITTEES[jur === 'school' ? 'school' : jur === 'city' ? 'city' : jur];
      return ui.table(['Committee', 'Covers', 'Chair', 'Members'], list.map((c) => { const cm = B.comm[c.k] || { members: [] }; return `<tr><td>${esc(c.name)}</td><td class="small">${c.cats.join(', ')}</td><td>${cm.chair ? ui.plink(s, cm.chair) : '—'}</td><td class="small">${cm.members.map((id) => ui.pname(s, id)).join(', ')}</td></tr>`; }));
    }
    if (cur === 'caucuses') {
      const rows = [];
      ['D', 'R'].forEach((party) => W().CAUCUSES[party].forEach((c) => { const n = ms.filter((p) => p.party === party && (p.caucus || W().caucusOf(p).k) === c.k).length; rows.push(`<tr><td>${ui.chip(party)} ${esc(c.name)}</td><td class="r">${n}</td><td style="width:40%">${ui.bar(ms.length ? (n / ms.length) * 100 : 0, party === 'D' ? 'dem' : 'red')}</td></tr>`); }));
      return ui.table(['Caucus', 'Members', ''], rows);
    }
    if (cur === 'rankings') {
      const list = ms.slice().sort((a, b) => b.pp - a.pp);
      return ui.table(['#', 'Member', 'Political Points', 'Approval', 'Terms'], list.map((p, i) => `<tr class="${p.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td>${p.isPlayer ? '<b>You</b>' : ui.plink(s, p.id)}</td><td class="r num">${U.num(p.pp)}</td><td class="r">${Math.round(p.app)}%</td><td class="r">${p.terms[G().BODY_OFF[bk]] || 0}</td></tr>`));
    }
    // Districts map: ZIP dots colored by the member's party.
    const S = GR.geo.state(s.home.state);
    const seats = W().bodySeats(s, bk);
    const dots = [];
    seats.forEach((seat) => {
      const p = s.pols[seat.holder];
      W().seatParts(s, seat).forEach(([i, w]) => { const z = S.Z[i]; if (w > 0.3 && z.pop > 0) dots.push({ x: z.x, y: z.y, r: 0.5 + Math.sqrt(z.pop) / 420, fill: p ? partyColor(p.party) : '#ccc', tip: `${W().seatTitle(s, seat)} — ${p ? W().fullName(p) + ' (' + p.party + ')' : 'Vacant'}` }); });
    });
    const city = bk === 'council' || bk === 'school';
    let vb = GR.GEO[s.home.state].vb.join(' ');
    if (city && dots.length) { const xs = dots.map((d) => d.x), ys = dots.map((d) => d.y); const x0 = Math.min(...xs) - 3, y0 = Math.min(...ys) - 3; vb = `${x0} ${y0} ${Math.max(10, Math.max(...xs) - x0 + 3)} ${Math.max(10, Math.max(...ys) - y0 + 3)}`; }
    const home = S.Z[s.home.zi];
    return `<div class="mapbox"><svg class="map" viewBox="${vb}" role="img" aria-label="District map"><path class="outline" d="${GR.GEO[s.home.state].outline}"/><g class="dotz">${dots.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${city ? d.r / 3 : d.r}" fill="${d.fill}"><title>${esc(d.tip)}</title></circle>`).join('')}<circle cx="${home.x}" cy="${home.y}" r="${city ? 1.5 : 4}" fill="#ffd400"><title>Your home</title></circle></g></svg></div>
      <div class="legend"><span><i style="background:var(--dem)"></i>Democrat</span><span><i style="background:var(--rep)"></i>Republican</span><span><i style="background:#ffd400"></i>Your home</span></div>
      <p class="small muted">Each dot is a ZIP code, sized by population and colored by the party of the member who represents it.</p>`;
  }

  // ---------- Elections tab ----------
  function elections(s) {
    const tabs = [['upcoming', 'Upcoming'], ['results', 'Results'], ['president', 'Presidential'], ['national', 'National']];
    const cur = ui.cur('elec', tabs);
    let body;
    const y = U.yearOf(s.week);
    const hs = W().homeSeats(s, s.home.zi);
    const mine = new Set(Object.values(hs).flat());
    const mineOnly = ui.sel.elMine !== false;
    if (cur === 'upcoming') {
      const years = Object.keys(s.races || {}).map(Number).filter((x) => x >= y).sort();
      const list = years.flatMap((yr) => s.races[yr].filter((r) => r.phase !== 'done' && (!mineOnly || mine.has(r.seat) || ['governor', 'ussenate'].includes(r.off))));
      body = `<div class="row between"><p>Elections: primaries ${U.fmtDate(GR.elect.primaryWeek(y))}, general ${U.fmtDate(GR.elect.generalWeek(y))}.</p><div class="seg"><button aria-pressed="${mineOnly}" data-act="elmine" data-a="1">My area</button><button aria-pressed="${!mineOnly}" data-act="elmine" data-a="0">Whole state</button></div></div>
        ${ui.table(['Year', 'Race', 'Incumbent', 'Democrats', 'Republicans'], list.slice(0, 150).map((r) => `<tr class="${r.cands.includes('me') ? 'me' : ''}"><td>${r.year}</td><td>${esc(W().seatTitle(s, s.seats[r.seat]))}</td><td>${r.inc ? ui.pname(s, r.inc) + (r.retiring ? ' <span class="small muted">(retiring)</span>' : r.leaving ? ' <span class="small muted">(seeking higher office)</span>' : '') : '—'}</td><td class="small">${r.prim.D.cands.map((id) => (id === 'me' ? '<b>You</b>' : ui.pname(s, id))).join(', ') || '—'}</td><td class="small">${r.prim.R.cands.map((id) => (id === 'me' ? '<b>You</b>' : ui.pname(s, id))).join(', ') || '—'}</td></tr>`), { empty: 'No races are open yet this year.' })}`;
    } else if (cur === 'results') {
      const years = Object.keys(s.races || {}).map(Number).filter((yr) => (s.races[yr] || []).some((r) => r.phase === 'done')).sort((a, b) => b - a);
      const yr = years.includes(ui.sel.ry) ? ui.sel.ry : years[0];
      const list = yr ? s.races[yr].filter((r) => r.phase === 'done' && (!mineOnly || mine.has(r.seat) || ['governor', 'ussenate'].includes(r.off) || r.cands.includes('me'))) : [];
      body = `<div class="row between"><div class="seg">${years.map((x) => `<button aria-pressed="${x === yr}" data-act="ry" data-a="${x}">${x}</button>`).join('')}</div><div class="seg"><button aria-pressed="${mineOnly}" data-act="elmine" data-a="1">My area</button><button aria-pressed="${!mineOnly}" data-act="elmine" data-a="0">Whole state</button></div></div>
        ${ui.table(['Race', 'Winner', 'Margin', ''], list.map((r) => { const a = r.res && r.res[0], b = r.res && r.res[1]; return `<tr class="${r.cands.includes('me') || (r.res || []).some((x) => x.id === 'me') ? 'me' : ''}"><td>${esc(W().seatTitle(s, s.seats[r.seat]))}</td><td>${a ? ui.plink(s, a.id) : '—'}${r.inc && a && a.id !== r.inc && r.cands.includes(r.inc) ? ' <span class="small bad">(defeated incumbent)</span>' : ''}</td><td class="r">${a && b ? (a.pct - b.pct).toFixed(1) + ' pts' : 'Unopposed'}</td><td>${ui.btn('Details', 'viewrace', yr + '|' + r.id, 'bgr sm')}</td></tr>`; }), { empty: 'No results yet. Elections happen every November.' })}`;
    } else if (cur === 'president') body = presView(s);
    else body = national(s);
    return `${ui.tabs('elec', tabs)}<div class="sheet">${body}</div>`;
  }

  function presView(s) {
    const r = s.presRace;
    if (!r) return '<p>The next presidential race takes shape the year before the 2028 election.</p>';
    if (r.phase === 'done' && r.states) {
      const winP = (ab) => s.pols[r.states[ab].win].party;
      return `<p><b>${r.year}:</b> ${r.res.map((x) => `${ui.plink(s, x.id)} ${x.ev} EV (${x.pct}%)`).join(' · ')}</p><div class="mapbox">${ui.usMap((ab) => partyColor(winP(ab)), { act: 'noop', tip: (ab) => `${GR.elect.EV(ab)} EV` })}</div>`;
    }
    const rows = [];
    ['D', 'R'].forEach((party) => r.prim[party].cands.concat(Object.keys(r.del).filter((id) => s.pols[id] && s.pols[id].party === party && !r.prim[party].cands.includes(id))).forEach((id) => rows.push(`<tr class="${id === 'me' ? 'me' : ''}"><td>${id === 'me' ? '<b>You</b>' : ui.plink(s, id)}</td><td>${ui.chip(party)}</td><td class="small">${esc(s.pols[id].title || '')}</td><td class="r">${r.del[id] || 0}</td><td>${r.prim[party].cands.includes(id) ? 'Running' : 'Withdrew'}</td></tr>`)));
    return `<p>${r.year} race · ${r.phase === 'general' ? 'General election' : 'Nominating contests'}. ${Math.ceil(GR.pres.totalDelegates() / 2)} delegates clinch a nomination.</p>
      ${ui.table(['Candidate', 'Party', 'Background', 'Delegates', 'Status'], rows)}
      ${ui.table(['Contest', 'Date', 'States'], GR.elect.PRES_CAL.map((c, i) => `<tr><td>${esc(c.name)}</td><td class="num">${U.fmtDate(GR.elect.presContestWeek(r.year, i))}</td><td class="small">${c.st.join(', ')}</td></tr>`), { caption: 'Calendar' })}`;
  }

  function national(s) {
    const n = s.nat;
    const pres = s.pols[n.president];
    const h = W().composition(s, 'ushouse'), se = W().composition(s, 'ussenate');
    return `<div class="cols"><div class="stack">${ui.kv([['President', `${ui.plink(s, n.president)} · approval ${Math.round(pres.app)}%`], ['U.S. House', `${h.D} D · ${h.R} R`], ['U.S. Senate', `${se.D} D · ${se.R} R`], ['Generic ballot', n.env > 0 ? 'R+' + n.env : n.env < 0 ? 'D+' + -n.env : 'Even'], ['Economic growth', s.jur.nation.met.growth.toFixed(1) + '%'], ['Unemployment', s.jur.nation.met.unemp.toFixed(1) + '%']])}</div>
      <div class="mapbox">${ui.usMap((ab) => { if (ab === s.home.state) return '#ffd400'; const o = n.other[ab]; if (!o) return 'var(--paper)'; const sv = Object.values(o.sen); const r = sv.filter((x) => x === 'R').length; return sv.length ? (r === 2 ? 'var(--rep)' : r === 0 ? 'var(--dem)' : '#9b6fc2') : 'var(--paper)'; }, { act: 'noop' })}<div class="legend"><span><i style="background:var(--dem)"></i>Two D senators</span><span><i style="background:var(--rep)"></i>Two R senators</span><span><i style="background:#9b6fc2"></i>Split</span><span><i style="background:#ffd400"></i>Your state</span></div></div></div>`;
  }

  function raceModal(s, year, id) {
    const r = id && id.startsWith('pres') ? s.presRace : (s.races[year] || []).find((x) => x.id === id);
    if (!r) return `<div class="band">Results</div><div class="sheet">This race is no longer on record. ${ui.btn('Close', 'closeOverlay', '', 'bgr')}</div>`;
    const title = W().seatTitle(s, s.seats[r.seat] || { off: 'president' });
    const prim = ['D', 'R'].filter((p) => r.prim[p].res && r.prim[p].res.length > 1).map((p) => ui.table(['Candidate', 'Vote', 'Votes'], r.prim[p].res.map((x) => `<tr class="${x.id === 'me' ? 'me' : ''}"><td>${ui.plink(s, x.id)}</td><td class="r">${x.pct}%</td><td class="r num">${U.num(x.votes)}</td></tr>`), { caption: GR.PARTIES[p].name + ' primary' })).join('');
    const gen = r.res ? ui.table(['Candidate', 'Party', 'Vote', 'Votes'], r.res.map((x) => `<tr class="${x.id === 'me' ? 'me' : ''}"><td>${ui.plink(s, x.id)}</td><td>${ui.chip(s.pols[x.id].party)}</td><td class="r">${x.pct}%</td><td class="r num">${U.num(x.votes)}</td></tr>`), { caption: 'General election' }) : '';
    let mapHtml = '';
    if (r.areas && r.areas.length && r.active && r.active.length >= 2) {
      const rid = r.active.find((x) => s.pols[x].party === 'R');
      const share = (row) => { const tot = U.sum(Object.values(row.v)) || 1; return rid ? (row.v[rid] || 0) / tot : 0.5; };
      if (r.off === 'governor' || r.off === 'ussenate') {
        const byK = {}; r.areas.forEach((a) => { byK[a.k] = share(a); });
        mapHtml = ui.stateMap(s, s.home.state, (k) => (byK[k] != null ? ui.marginColor(byK[k]) : 'var(--paper)'), { act: 'noop', tip: (k) => (byK[k] != null ? `R ${Math.round(byK[k] * 100)}%` : '') });
      } else {
        const S = GR.geo.state(s.home.state);
        const dots = r.areas.map((a) => { const z = S.Z[S.zipIdx[a.k]]; return z ? { x: z.x, y: z.y, fill: ui.marginColor(share(a)), tip: a.name + ` — R ${Math.round(share(a) * 100)}%` } : null; }).filter(Boolean);
        if (dots.length) { const xs = dots.map((d) => d.x), ys = dots.map((d) => d.y); const x0 = Math.min(...xs) - 4, y0 = Math.min(...ys) - 4; const w = Math.max(12, Math.max(...xs) - x0 + 4), h = Math.max(12, Math.max(...ys) - y0 + 4); mapHtml = `<svg class="map" viewBox="${x0} ${y0} ${w} ${h}"><path class="outline" d="${GR.GEO[s.home.state].outline}"/><g class="dotz">${dots.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${Math.max(w, h) / 40}" fill="${d.fill}"><title>${esc(d.tip)}</title></circle>`).join('')}</g></svg>`; }
      }
    } else if (r.states) {
      mapHtml = ui.usMap((ab) => partyColor(s.pols[r.states[ab].win].party), { act: 'noop' });
    }
    return `<div class="band">${esc(title)} · ${r.year}</div><div class="sheet stack">${prim}${gen}${r.turnout ? `<p class="small">Turnout: ${U.num(r.turnout)}</p>` : ''}${mapHtml ? `<div class="mapbox">${mapHtml}</div>` : ''}${ui.btn('Close', 'closeOverlay', '', 'bgr')}</div>`;
  }

  // ---------- Metrics tab ----------
  function metrics(s) {
    const lv = [['school', 'Schools'], ['city', 'City'], ['state', 'State'], ['nation', 'Nation']];
    const L = lv.some((x) => x[0] === ui.sub.mlv) ? ui.sub.mlv : 'state';
    ui.sub.mlv = L;
    const J = s.jur[L];
    const cats = [['overview', 'Overview'], ['population', 'Population'], ['education', 'Education'], ['poverty', 'Poverty'], ['economy', 'Economy'], ['taxes', 'Taxes'], ['health', 'Health'], ['crime', 'Crime'], ['environment', 'Environment'], ['budget', 'Budget'], ['laws', 'Laws']];
    const cur = ui.cur('mcat', cats);
    const hist = J.hist.concat([{ y: U.yearOf(s.week), met: J.met }]);
    const xs = hist.map((h) => h.y);
    const chart = (k, color, label) => ui.lines([{ name: label || W().METRICS[k].name, color, values: hist.map((h) => h.met[k]) }], xs, { title: W().METRICS[k].name, fmt: (v) => (W().METRICS[k].unit === '$' ? U.money(v) : W().METRICS[k].unit === '%' ? U.round(v, 1) + '%' : Math.round(v)) });
    const fmtM = (k, v) => { const m = W().METRICS[k]; return m.unit === '$' ? U.money(v) : m.unit === '%' ? v.toFixed(m.d) + '%' : Math.round(v); };
    const delta = (k) => { const d = J.met[k] - J.met0[k]; const m = W().METRICS[k]; const good = d * m.good > 0; return Math.abs(d) < (m.unit === '$' ? 50 : 0.05) ? '<span class="muted">—</span>' : `<span class="${good ? 'good' : 'bad'}">${d > 0 ? '▲' : '▼'} ${m.unit === '$' ? U.money(Math.abs(d)) : Math.abs(d).toFixed(m.d)}</span>`; };
    let body = '';
    const ex = G().execOf(s, L);
    if (cur === 'overview') {
      body = `<div class="cols"><div class="stack">${ui.table(['Metric', 'Now', 'Since 2027'], Object.keys(W().METRICS).filter((k) => J.met[k] != null).map((k) => `<tr><td>${W().METRICS[k].name}</td><td class="r num">${fmtM(k, J.met[k])}</td><td class="r">${delta(k)}</td></tr>`))}</div>
        <div class="stack">${ui.kv([['Government', esc(J.name)], ['Population', U.num(J.pop)], L === 'school' ? ['Students', U.num(J.students)] : null, ['Executive', ex ? ui.plink(s, ex.id) + ` · approval ${Math.round(ex.app)}%` : L === 'school' ? 'Superintendent (appointed)' : '—'], ['Laws passed since 2027', J.laws.length]])}
        <p class="small muted">Metrics respond to the laws and budgets you and your colleagues pass, and to the national economy. Executives are judged on them.</p></div></div>`;
    } else if (cur === 'population') {
      const pr = L === 'nation' ? W().nationProfile() : L === 'state' ? GR.geo.profile(GR.geo.state(s.home.state), GR.geo.state(s.home.state).Z.map((z) => [z.i, 1]), 'state' + s.home.state) : GR.geo.profile(GR.geo.state(s.home.state), (GR.geo.state(s.home.state).cityZips[s.home.city] || []).map((i) => [i, 1]), 'city' + s.home.city);
      body = `<div class="cols">${ui.kv([['Population', U.num(J.pop)], ['Democrats', Math.round(pr.D * 100) + '%'], ['Republicans', Math.round(pr.R * 100) + '%'], ['Independents', Math.round(pr.I * 100) + '%'], ['Urban', pr.urban + '%'], ['Median age', pr.age], ['College graduates', pr.college + '%'], ['White', pr.white + '%'], ['Veterans', pr.veterans + '%']])}<div class="box boxpad">${ui.lines([{ name: 'Population', color: '#1f7fd6', values: J.hist.map((h) => h.pop).concat([J.pop]) }], xs, { title: 'Population', fmt: (v) => U.num(v / 1000) + 'k' })}</div></div>`;
    } else if (cur === 'education') body = `<div class="cols"><div class="box boxpad">${chart('grad', '#11b03c')}</div>${lawTable(s, J, 'Education')}</div>`;
    else if (cur === 'poverty') body = `<div class="cols"><div class="box boxpad">${chart('poverty', '#c000c0')}</div><div class="box boxpad">${chart('income', '#1f7fd6')}</div></div>`;
    else if (cur === 'economy') body = `<div class="cols"><div class="box boxpad">${chart('growth', '#11b03c')}</div><div class="box boxpad">${chart('unemp', '#e0342c')}</div></div>${lawTable(s, J, 'Economy')}`;
    else if (cur === 'taxes') { const t = W().totals(J); body = `<div class="cols">${ui.table([{ t: 'Revenue', c: 'c' }, { t: '', c: 'r' }], Object.entries(t.rv).map(([k, v]) => `<tr><td class="c">${esc(k)}</td><td class="r num">${U.money(v)}</td></tr>`))}${lawTable(s, J, 'Taxes')}</div>`; }
    else if (cur === 'health') body = `<div class="cols"><div class="box boxpad">${chart('uninsured', '#ff2a2a')}</div>${lawTable(s, J, 'Health')}</div>`;
    else if (cur === 'crime') body = `<div class="cols"><div class="box boxpad">${chart('crime', '#5b0f6e')}</div>${lawTable(s, J, 'Justice')}</div>`;
    else if (cur === 'environment') body = `<div class="cols"><div class="box boxpad">${chart('emis', '#555')}</div><div class="box boxpad">${chart('rent', '#e7a51a')}</div></div>`;
    else if (cur === 'budget') {
      const t = W().totals(J);
      const colors = ['#7a0f0f', '#ff2a2a', '#ff4f8b', '#c000c0', '#5b0f6e', '#3a3af0', '#38c0f0', '#11b03c', '#e7a51a', '#777'];
      const cats2 = Object.keys(t.sp);
      body = `<div class="cols">${ui.table([{ t: 'Expenditure by Category', c: 'c' }, { t: '', c: 'r' }], cats2.map((c) => `<tr><td class="c">${esc(c)}</td><td class="r num">${U.money(t.sp[c])}</td></tr>`).concat([`<tr><td class="c">Total</td><td class="r num">${U.money(t.spend)}</td></tr>`]))}
        <div class="box boxpad">${ui.lines(cats2.map((c, i) => ({ name: c, color: colors[i % colors.length], values: J.hist.map((h) => (h.spend[c] || 0)).concat([t.sp[c]]) })), xs, { title: 'Expenditure by Category', fmt: (v) => U.money(v) })}</div></div>
        ${ui.table(['Revenue', 'Expenditure', 'Surplus / Deficit', L === 'nation' ? 'National debt' : 'Reserves'], [`<tr><td class="r num">${U.money(t.rev)}</td><td class="r num">${U.money(t.spend)}</td><td class="r num ${t.bal >= 0 ? 'good' : 'bad'}">${U.money(t.bal)}</td><td class="r num">${U.money(L === 'nation' ? J.budget.debt : J.budget.reserve)}</td></tr>`], { caption: 'Treasury' })}`;
    } else {
      const lvl = GR.lvlOf(L);
      body = `<div class="cols">${ui.table(['Policy', 'Current law'], GR.policiesFor(L).map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(GR.policyOpts(p, lvl)[J.law[p.k]])}${J.law[p.k] !== J.law0[p.k] ? ' <span class="small muted">(changed)</span>' : ''}</td></tr>`))}
        ${ui.table(['Date', 'Recent laws'], J.laws.slice(0, 25).map((l) => `<tr><td class="num" style="white-space:nowrap">${U.fmtDate(l.w)}</td><td class="small">${esc(l.t)}</td></tr>`), { empty: 'No new laws yet.' })}</div>`;
    }
    return `${ui.tabs('mlv', lv)}<div class="panel" style="box-shadow:none">${ui.tabs('mcat', cats, 'tabs-xs')}<div class="sheet">${body}</div></div>`;
  }

  function lawTable(s, J, cat) {
    const lvl = GR.lvlOf(J.k);
    const ps = GR.policiesFor(J.k).filter((p) => p.cat === cat || (cat === 'Justice' && p.cat === 'Guns'));
    if (!ps.length) return '';
    return ui.table(['Policy', 'Current law'], ps.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(GR.policyOpts(p, lvl)[J.law[p.k]])}</td></tr>`));
  }

  const A = (n, fn) => ui.on(n, fn);
  A('pickpol', (el, a) => { ui.sel.pol = a; });
  A('elmine', (el, a) => { ui.sel.elMine = a === '1'; });
  A('ry', (el, a) => { ui.sel.ry = +a; });

  return { politicians, elections, metrics, polModal, raceModal, polDetail };
})();
