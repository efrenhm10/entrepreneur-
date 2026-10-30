// Budget Room (states and cities). The year's numbers, how each region fares, every line item
// against current services, and what you can do from where you sit: write the budget as the
// executive, move money in markup, ask for a district project, keep faith with your caucus,
// or veto line items before signing.
var GR = globalThis.GR || (globalThis.GR = {});

GR.uiBudget = (function () {
  const U = GR.util;
  const ui = GR.ui;
  const esc = U.esc;
  const W = () => GR.world;
  const G = () => GR.gov;
  const L = () => GR.legis;
  const B = () => GR.budget;

  const pct = (v, d = 1) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(d)}%`;
  const geoBar = (g) => `<span class="geobar" title="Big city ${Math.round(g[0] * 100)}% · suburban ${Math.round(g[1] * 100)}% · rural ${Math.round(g[2] * 100)}%"><i style="width:${g[0] * 100}%;background:var(--blue)"></i><i style="width:${g[1] * 100}%;background:var(--accent)"></i><i style="width:${g[2] * 100}%;background:var(--good)"></i></span>`;

  // Which budget we are looking at: your draft, the bill in play, or the last one enacted.
  function current(s, J) {
    const open = (J.bills || []).find((b) => b.kind === 'budget' && L().OPEN(b) && b.prov.bud);
    return open || null;
  }

  function render(s) {
    const jur = G().myJur(s);
    const J = s.jur[jur];
    if (!B().has(jur)) return `<div class="vhead"><h2>Budget</h2><span class="sub">${esc(J.name)}</span></div><div class="sheet">${GR.uiGov.budgetView(s)}</div>`;
    B().ensure(J);
    const me = s.pols.me;
    const off = GR.OFFICES[s.seats[me.seat].off];
    const due = s.budgetDue && s.budgetDue[jur];
    const b = current(s, J);
    let bud, mode;
    if (due && off.exec) { mode = 'draft'; bud = draft(s, J, due); }
    else if (b) { mode = 'bill'; bud = b.prov.bud; }
    else mode = 'none';
    const o = B().outlook(J);
    const head = `<div class="vhead"><h2>Budget Room</h2><span class="sub">${esc(J.name)} · ${jur === 'state' ? 'the constitution requires a balanced budget' : 'the city charter requires a balanced budget'}</span></div>`;
    const numbers = numbersPanel(s, J, bud, o);
    if (mode === 'none') {
      return head + `<div class="grid2"><div>${numbers}${ui.panel('Where things stand', `<p class="small">${J.bud && J.bud.fyDone ? `The FY${J.bud.fyDone} budget is law.` : 'No budget is moving right now.'} The next one starts with the ${GR.xneg.exTitle(s, jur).toLowerCase()}'s proposal (${jur === 'state' ? 'mid-January' : 'mid-April'}). Until then, line up support for what your district needs: requests that were authorized "subject to appropriation" compete for money in it.</p>`)}${requestsPanel(s, J, null)}</div><div>${ui.panel('Last year’s lines', lineTable(s, J, null, o, false))}</div></div><div class="sheet" style="margin-top:12px">${GR.uiGov.budgetView(s)}</div>`;
    }
    const reg = B().regional(J, bud);
    const left = numbers + regionPanel(s, J, b, bud, reg) + (mode === 'draft' ? draftTools(s, J, bud) : movesPanel(s, J, b)) + requestsPanel(s, J, mode === 'draft' ? bud : null);
    const right = (b ? ui.panel(esc(b.title), `${GR.uiLegis.tracker(s, b)}${b.amends && b.amends.length ? `<div class="stack-s">${b.amends.slice(-5).map((a) => `<div class="small">• ${esc(a.label)}</div>`).join('')}</div>` : ''}${b.itemVetoes ? `<p class="small bad" style="margin-top:6px">Line-item vetoes: ${esc(b.itemVetoes.join(', '))}.</p>` : ''}`) : '')
      + ui.panel(mode === 'draft' ? 'Your budget, line by line' : 'Line items: this version against current services', lineTable(s, J, bud, o, mode === 'draft'));
    return head + `<div class="grid2"><div>${left}</div><div>${right}</div></div>`;
  }

  function draft(s, J, due) {
    let d = ui.sel.budDraft;
    if (!d || d.fy !== due.fy || d.jur !== J.k) {
      const o = B().outlook(J);
      d = ui.sel.budDraft = { fy: due.fy, jur: J.k, bud: { amt: Object.assign({}, o.cs), tax: {}, draw: 0, cs: o.cs } };
    }
    return d.bud;
  }

  function numbersPanel(s, J, bud, o) {
    const bal = bud ? B().balance(J, bud) : null;
    const csCash = B().cash(J, o.cs);
    const avail = o.rev - o.mand;
    return ui.panel('The year’s numbers', `<div class="ind">
      ${ui.stat('Revenue', U.money(o.rev))}
      ${ui.stat('Locked in', U.money(o.mand))}
      ${ui.stat('For agencies', U.money(avail))}
      ${ui.stat('Status quo cost', U.money(csCash))}
      ${ui.stat(avail >= csCash ? 'Room to grow' : 'Shortfall', `<span class="${avail >= csCash ? 'good' : 'bad'}">${U.money(Math.abs(avail - csCash))}</span>`)}
      ${ui.stat('Rainy day', U.money(o.reserve))}
    </div>
    <p class="tiny muted" style="margin-top:6px">Revenue is the official (cautious) estimate. Locked in: benefits, pensions and debt service the law already requires. Status quo cost ("current services") is what it costs to keep doing exactly what agencies do now (prices, enrollment and caseloads rise). Capital lines are 40% financed with bonds.</p>
    ${bal ? `<div class="row between" style="margin-top:8px"><b>This version</b><span class="${bal.gap >= -1 ? 'good' : 'bad'}">${bal.gap >= -1 ? `balanced with ${U.money(bal.gap)} to spare` : `${U.money(-bal.gap)} out of balance`}</span></div>
      <div class="small muted">${Object.entries(bud.tax || {}).filter(([, v]) => v).map(([k, v]) => `${GR.fisc.TAXES[k].name}: ${v > 0 ? '+' : ''}${v}`).join(' · ') || 'No tax changes'}${bud.draw ? ` · ${U.money(bud.draw - (bud.oneTime || 0))} from the rainy-day fund` : ''}${bud.oneTime ? ` · ${U.money(bud.oneTime)} in one-time gimmicks (deferred payments, fund sweeps)` : ''}</div>` : ''}`);
  }

  function regionPanel(s, J, b, bud, reg) {
    const me = s.pols.me;
    const bk = G().myBody(s);
    const R = B().REGIONS[J.k];
    const mineG = B().geoOf(s, me, J.k);
    const mine = mineG.indexOf(Math.max(...mineG));
    const avg = (reg[0] + reg[1] + reg[2]) / 3;
    let counts = null;
    if (b && bk && G().bodiesOf(s, J.k).includes(b.body)) {
      const f = GR.uiLegis.forecast(s, b, b.body);
      counts = [0, 1, 2].map(() => ({ y: 0, n: 0 }));
      f.r.rows.forEach((x) => { const p = s.pols[x.id]; if (!p) return; const g = B().geoOf(s, p, J.k); const i = g.indexOf(Math.max(...g)); counts[i][x.v === 'y' ? 'y' : 'n']++; });
    }
    return ui.panel('Who wins, who loses', R.map(([k, name], i) => `<div class="opp ${i === mine ? 'openseat' : ''}"><span class="t"><b class="small">${esc(name)}</b>${i === mine && !GR.OFFICES[s.seats[me.seat].off].exec ? ' <span class="chip">your district</span>' : ''}<br>
      <span class="tiny muted">${pct(reg[i])} against current services · ${reg[i] - avg >= 0 ? 'ahead of' : 'behind'} the average by ${Math.abs((reg[i] - avg) * 100).toFixed(1)} pts${counts ? ` · in the ${esc(GR.BODIES[b.body].name)}: ${counts[i].y} yes, ${counts[i].n} no` : ''}</span></span>
      <b class="${reg[i] >= avg ? 'good' : 'bad'}">${pct(reg[i])}</b></div>`).join('') + `<p class="tiny muted" style="margin-top:6px">Lawmakers vote on how their region does against the others, and on the budget as a whole against the alternative: no budget, flat funding and automatic cuts.${b && b.my.hold != null ? ` <b>You promised the ${esc(R[b.my.hold][1])} Caucus you'd hold out.</b>` : ''}</p>`);
  }

  function lineTable(s, J, bud, o, edit) {
    const ls = B().lines(J);
    const cur = o.cur;
    const rows = ls.map((l) => {
      const cs = (bud && bud.cs ? bud.cs[l.k] : o.cs[l.k]) || 0;
      const now = bud ? (bud.amt[l.k] != null ? bud.amt[l.k] : cs) : cur[l.k] || 0;
      return { l, cs, now, d: now - cs, r: cs ? (now - cs) / cs : 0 };
    }).filter((x) => x.cs > 0 || x.now > 0);
    rows.sort((a, c) => (bud ? a.r - c.r : c.now - a.now));
    const ag = (k) => (J.F.ag.find((a) => a.k === k) || { abbr: k }).abbr;
    return `<div class="scroll-x"><table class="tbl"><thead><tr><th>Line</th><th>Who it helps</th><th class="r">${bud ? 'Current services' : 'Amount'}</th>${bud ? '<th class="r">This version</th><th class="r">Change</th>' : ''}${edit ? '<th></th>' : ''}</tr></thead><tbody>${rows.map((x) => `<tr><td class="small"><b>${esc(x.l.name)}</b>${x.l.prog != null ? ' <span class="chip">program</span>' : ''}<br><span class="tiny muted">${esc(ag(x.l.ag))} · ${x.l.part === 'capex' ? 'capital' : 'operating'}</span></td><td>${geoBar(x.l.geo)}</td><td class="r num small">${U.money(bud ? x.cs : x.now)}</td>${bud ? `<td class="r num small">${U.money(x.now)}</td><td class="r num small ${x.r < -0.005 ? 'bad' : x.r > 0.005 ? 'good' : ''}">${pct(x.r)}</td>` : ''}${edit ? `<td><span class="row" style="flex-wrap:nowrap">${[-0.05, -0.01, 0.01, 0.05].map((f) => `<button class="bgr sm" data-act="budadj" data-a="${esc(x.l.k)}|${f}">${f > 0 ? '+' : '−'}${Math.abs(f * 100)}%</button>`).join('')}</span></td>` : ''}</tr>`).join('')}</tbody></table></div>
      <div class="legend" style="margin-top:6px"><span><i style="background:var(--blue)"></i>${esc(B().REGIONS[J.k][0][1])}</span><span><i style="background:var(--accent)"></i>${esc(B().REGIONS[J.k][1][1])}</span><span><i style="background:var(--good)"></i>${esc(B().REGIONS[J.k][2][1])}</span></div>`;
  }

  // ---------- The executive writes the budget ----------
  function draftTools(s, J, bud) {
    const o = B().outlook(J);
    const taxes = GR.fisc.LEVEL_TAXES[J.k].filter((k) => J.F.tax[k] != null);
    const bal = B().balance(J, bud);
    return ui.panel('Write your budget', `<p class="small">Start from current services and make it balance: cut lines, raise revenue, or draw on the rainy-day fund (up to ${U.money(o.drawMax)} this year). Every line shows which places it helps; the legislature will judge your budget region by region.</p>
      <div class="row" style="margin-top:8px">${ui.btn('Start from current services', 'budreset', 'cs', 'bgr sm')}${ui.btn('Use the budget office’s balanced draft', 'budreset', 'office', 'bgr sm')}</div>
      <div class="tiny muted" style="margin:10px 0 4px">Revenue</div>
      ${taxes.map((k) => `<div class="row between small" style="margin-bottom:4px"><span>${esc(GR.fisc.TAXES[k].name)} · ${L().fmtTax(k, J.F.tax[k] + (bud.tax[k] || 0))}${bud.tax[k] ? ` (${bud.tax[k] > 0 ? '+' : ''}${bud.tax[k]})` : ''}</span><span class="row">${ui.btn('−', 'budtax', `${k}|-`, 'bgr sm')}${ui.btn('+', 'budtax', `${k}|+`, 'bgr sm')}</span></div>`).join('')}
      <div class="tiny muted" style="margin:10px 0 4px">Rainy-day fund</div>
      <div class="row between small"><span>Draw ${U.money(bud.draw || 0)} of ${U.money(o.drawMax)} allowed</span><span class="row">${ui.btn('−', 'buddraw', '-', 'bgr sm')}${ui.btn('+', 'buddraw', '+', 'bgr sm')}</span></div>
      <div class="row" style="margin-top:12px">${ui.btn(bal.gap >= -1 ? 'Submit the budget to the legislature' : `Out of balance by ${U.money(-bal.gap)}`, 'budsubmit', '', 'bo', bal.gap < -GR.fisc.totals(J).spend * 0.001)}</div>`);
  }

  // ---------- What a legislator can do ----------
  function movesPanel(s, J, b) {
    const me = s.pols.me;
    const bk = G().myBody(s);
    const out = [];
    const t = G().tasks(s).find((x) => x.b === b);
    if (t && t.kind === 'vote') out.push(`<div class="row" style="margin-bottom:8px"><b class="small">Floor vote:</b>${ui.btn('Vote yea', 'decide', `${b.id}|vote|y`, 'bgr sm yes')}${ui.btn('Vote nay', 'decide', `${b.id}|vote|n`, 'bgr sm no')}</div>`);
    if (t && t.kind === 'sign') out.push(itemVetoPanel(s, J, b));
    if (bk && !GR.OFFICES[s.seats[me.seat].off].exec && G().bodiesOf(s, J.k).includes(bk) && b.stage !== 'exec') {
      const mineItem = (b.prov.bud.items || []).find((x) => x.who === 'me');
      out.push(mineItem ? `<p class="small good">Your ${esc(mineItem.proj)} (${U.money(mineItem.amt)}) is in this budget.</p>` : `<div class="small"><b>Ask for a project in your district</b> <span class="tiny muted">3 hours · the Appropriations chair decides; loyalty and a seat on the committee help</span></div><div class="row" style="margin:4px 0 8px">${[['school', 'School repairs'], ['road', 'Road & bridge work'], ['water', 'Water system'], ['park', 'Park or community center']].map(([k, l]) => ui.btn(l, 'buditem', `${b.id}|${k}`, 'bgr sm', s.hoursLeft < 3)).join('')}</div>`);
      if (GR.comm.canMarkup(s, b) && b.stage === 'markup') {
        const ls = B().lines(J).filter((l) => (b.prov.bud.amt[l.k] || 0) > 0);
        const amt = Math.round(B().disc(J) * 0.003);
        out.push(`<div class="small"><b>Move money in markup</b> <span class="tiny muted">you sit on ${esc(GR.comm.nameOf(b.body, b.comm))}; the committee votes on each move</span></div>
          <div class="row" style="margin-top:4px"><select class="input" id="budfrom" style="max-width:220px">${ls.map((l) => `<option value="${esc(l.k)}">From: ${esc(l.name)}</option>`).join('')}</select><select class="input" id="budto" style="max-width:220px">${ls.map((l, i) => `<option value="${esc(l.k)}" ${i === 1 ? 'selected' : ''}>To: ${esc(l.name)}</option>`).join('')}</select>
          <select class="input" id="budamt" style="max-width:120px">${[1, 2, 4].map((m) => `<option value="${amt * m}">${U.money(amt * m)}</option>`).join('')}</select>${ui.btn('Offer (4 PP, 2h)', 'budmove', b.id, 'bb sm', s.hoursLeft < 2 || me.pp < 4)}</div>`);
      } else if (['committee', 'markup'].includes(b.stage)) out.push(`<p class="tiny muted">Only members of ${esc(GR.comm.nameOf(b.body, b.comm))} can move money in markup. Everyone else asks the chair, or bargains with their vote on the floor.</p>`);
    }
    if (!out.length) out.push(GR.OFFICES[s.seats[me.seat].off].exec ? '<p class="small muted">Your budget is in the legislature. Each chamber\'s Appropriations chair will tilt it toward their own region; when it reaches your desk you can sign it, veto it, or strike individual lines.</p>' : '<p class="small muted">The budget is out of your chamber for now. Watch how the other chamber reshapes it.</p>');
    return ui.panel('Your moves', out.join(''));
  }
  function itemVetoPanel(s, J, b) {
    const bud = b.prov.bud;
    const ls = B().lines(J).filter((l) => bud.gov && bud.gov[l.k] != null && (bud.amt[l.k] || 0) > bud.gov[l.k] * 1.02);
    const sel = b.my.itemVeto || [];
    if (!B().itemVeto(s, J.k) || !ls.length) return `<div class="row" style="margin-bottom:8px"><b class="small">On your desk:</b>${ui.btn('Sign the budget', 'decide', `${b.id}|sign|y`, 'bgr sm yes')}${ui.btn('Veto it', 'decide', `${b.id}|sign|n`, 'bgr sm no')}</div>`;
    return `<div class="small"><b>Line-item veto</b> <span class="tiny muted">strike what the legislature added beyond your proposal, then sign</span></div>
      ${ls.map((l) => `<label class="pickrow"><input type="checkbox" data-ch="budveto" data-a="${b.id}|${esc(l.k)}" ${sel.includes(l.k) ? 'checked' : ''}><span class="grow small">${esc(l.name)}: ${U.money(bud.gov[l.k])} → ${U.money(bud.amt[l.k])}</span>${geoBar(l.geo)}</label>`).join('')}
      <div class="row" style="margin:6px 0 8px">${ui.btn(sel.length ? `Sign with ${sel.length} line-item veto${sel.length === 1 ? '' : 'es'}` : 'Sign the budget', 'decide', `${b.id}|sign|y`, 'bgr sm yes')}${ui.btn('Veto the whole budget', 'decide', `${b.id}|sign|n`, 'bgr sm no')}</div>`;
  }

  function requestsPanel(s, J, bud) {
    const all = (J.bud && J.bud.requests || []).filter((r) => !r.funded);
    if (!all.length) return '';
    // One row per law, however many lines it touches.
    const by = {};
    all.forEach((r, i) => { const g = by[r.title] || (by[r.title] = { title: r.title, spon: r.spon, amt: 0, lines: [], idx: [] }); g.amt += r.amt; g.lines.push(r.line); g.idx.push(i); });
    const reqs = Object.values(by).map((g) => ({ title: g.title, spon: g.spon, amt: g.amt, line: g.lines[0], idx: g.idx.join(',') }));
    return ui.panel('Waiting for money', `<p class="tiny muted" style="margin-bottom:6px">Laws passed "subject to appropriation": authorized, but nothing flows until a budget funds them.</p>${reqs.slice(0, 8).map((r, i) => { const l = B().lineOf(J, r.line); return `<div class="opp"><span class="t small"><b>${esc(r.title)}</b>${r.spon === 'me' ? ' <span class="chip">yours</span>' : ''}<br><span class="tiny muted">${U.money(r.amt)} a year · ${esc(l ? l.name : r.line)}</span></span>${bud ? ui.btn('Fund it', 'budfund', r.idx, 'bgr sm') : ''}</div>`; }).join('')}`);
  }

  // ---------- Actions ----------
  const A = (n, fn) => ui.on(n, fn);
  const dJ = () => ui.s.jur[G().myJur(ui.s)];
  A('budadj', (el, a) => { const [k, f] = a.split('|'); const d = ui.sel.budDraft; if (!d) return; d.bud.amt[k] = Math.max(0, (d.bud.amt[k] || 0) * (1 + +f)); });
  A('budtax', (el, a) => { const [k, dir] = a.split('|'); const d = ui.sel.budDraft; if (!d) return; const step = GR.fisc.TAXES[k].step || (GR.fisc.TAXES[k].unit === 'mills' ? 0.5 : GR.fisc.TAXES[k].unit === '$/t' ? 5 : 0.1); d.bud.tax[k] = U.round((d.bud.tax[k] || 0) + (dir === '+' ? step : -step), 2); });
  A('buddraw', (el, a) => { const d = ui.sel.budDraft; if (!d) return; const o = B().outlook(dJ()); const step = o.drawMax / 5; d.bud.draw = U.clamp((d.bud.draw || 0) + (a === '+' ? step : -step), 0, o.drawMax); });
  A('budreset', (el, a) => { const s = ui.s; const J = dJ(); const due = s.budgetDue[J.k]; const o = B().outlook(J); ui.sel.budDraft = { fy: due.fy, jur: J.k, bud: a === 'office' ? Object.assign(B().propose(s, J, s.pols.me), { cs: o.cs }) : { amt: Object.assign({}, o.cs), tax: {}, draw: 0, cs: o.cs } }; });
  A('budfund', (el, a) => { const J = dJ(); const d = ui.sel.budDraft; if (!d) return; const open = (J.bud.requests || []).filter((x) => !x.funded); let tot = 0, title = ''; a.split(',').forEach((i) => { const r = open[+i]; if (!r || r.inProp) return; d.bud.amt[r.line] = (d.bud.amt[r.line] || 0) + r.amt; r.inProp = true; tot += r.amt; title = r.title; }); if (tot) ui.toast(`Added ${U.money(tot)} for the ${title}.`); });
  A('budsubmit', () => { const s = ui.s; const d = ui.sel.budDraft; if (!d) return; const r = L().submitBudget(s, { bud: d.bud }); ui.res(r); if (r.ok) { ui.sel.budDraft = null; ui.save(); } });
  A('buditem', (el, a) => { const [id, k] = a.split('|'); const b = L().findBill(ui.s, id); if (!b) return; ui.res(B().askItem(ui.s, b, k)); ui.save(); });
  A('budmove', (el, a) => { const f = document.getElementById('budfrom').value, t = document.getElementById('budto').value, amt = document.getElementById('budamt').value; if (f === t) { ui.toast('Pick two different lines.'); return; } ui.res(GR.comm.markup(ui.s, a, `bud:${f}:${t}:${Math.round(+amt)}`)); ui.save(); });
  A('budveto', (el, a) => { const [id, k] = a.split('|'); const b = L().findBill(ui.s, id); if (!b) return; const v = new Set(b.my.itemVeto || []); if (el.checked) v.add(k); else v.delete(k); b.my.itemVeto = [...v]; });

  return { render };
})();
