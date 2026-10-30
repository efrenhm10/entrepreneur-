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
    const numbers = numbersPanel(s, J, bud, o, mode === 'draft');
    if (mode === 'none') {
      return head + `<div class="grid2"><div>${numbers}${agencyPanel(s, J, null, 'none')}${ui.panel('Where things stand', `<p class="small">${J.bud && J.bud.fyDone ? `The FY${J.bud.fyDone} budget is law.` : 'No budget is moving right now.'} The next one starts with the ${GR.xneg.exTitle(s, jur).toLowerCase()}'s proposal (${jur === 'state' ? 'mid-January' : 'mid-April'}). Until then, line up support for what your district needs: requests that were authorized "subject to appropriation" compete for money in it.</p>`)}${requestsPanel(s, J, null)}</div><div>${ui.panel('Last year’s lines', lineTable(s, J, null, o, false))}</div></div><div class="sheet" style="margin-top:12px">${GR.uiGov.budgetView(s)}</div>`;
    }
    const reg = B().regional(J, bud);
    const left = numbers + regionPanel(s, J, b, bud, reg) + (mode === 'draft' ? draftTools(s, J, bud) : movesPanel(s, J, b)) + agencyPanel(s, J, bud, mode) + requestsPanel(s, J, mode === 'draft' ? bud : null);
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

  function numbersPanel(s, J, bud, o, mine) {
    const bal = bud ? B().balance(J, bud) : null;
    const csCash = B().cash(J, o.cs);
    const avail = o.rev - o.mand;
    // With a budget on the table, every figure is this version's: tax changes, the rainy-day draw and each line.
    const ty = bud ? B().taxYield(J, bud.tax) : 0;
    const delta = (v) => (Math.abs(v) >= 1 ? ` <span class="tiny ${v > 0 ? 'good' : 'bad'}">${v > 0 ? '+' : '−'}${U.money(Math.abs(v))}</span>` : '');
    const stats = bal ? `
      ${ui.stat('Revenue', U.money(o.rev + ty) + delta(ty))}
      ${ui.stat('Locked in', U.money(o.mand))}
      ${ui.stat((bud.draw || 0) < 0 ? 'Into rainy day' : 'From rainy day', U.money(Math.abs(bud.draw || 0)))}
      ${ui.stat('For agencies', U.money(bal.avail))}
      ${ui.stat('This version spends', U.money(bal.spend) + delta(csCash - bal.spend))}
      ${ui.stat(bal.gap >= -1 ? 'Left over' : 'Short', `<span class="${bal.gap >= -1 ? 'good' : 'bad'}">${U.money(Math.abs(bal.gap))}</span>`)}
      ${ui.stat('Status quo cost', U.money(csCash))}
      ${ui.stat('Rainy day after', U.money(Math.max(0, o.reserve - (bud.draw || 0))))}
      ${bud.debtPay > 0 ? ui.stat('Debt payment', `<span class="good">${U.money(bud.debtPay)}</span>`) : ''}
      ${ui.stat(bud.debtPay > 0 ? 'Debt after' : 'Debt', U.money(Math.max(0, o.debt - (bud.debtPay || 0))))}` : `
      ${ui.stat('Revenue', U.money(o.rev))}
      ${ui.stat('Locked in', U.money(o.mand))}
      ${ui.stat('For agencies', U.money(avail))}
      ${ui.stat('Status quo cost', U.money(csCash))}
      ${ui.stat(avail >= csCash ? 'Room to grow' : 'Shortfall', `<span class="${avail >= csCash ? 'good' : 'bad'}">${U.money(Math.abs(avail - csCash))}</span>`)}
      ${ui.stat('Rainy day', U.money(o.reserve))}
      ${ui.stat('Debt', U.money(o.debt))}`;
    // This fiscal year as it actually runs: revenue and spending move every quarter with the economy.
    const fy = L().fiscalYear(s, J.k);
    const tt = GR.fisc.totals(J);
    const now = `<div class="row between small" style="margin-bottom:8px;padding:6px 8px;background:var(--panel-2);border-radius:4px"><span><b>FY${fy}, now running</b> · revenue ${U.money(tt.rev)} · spending ${U.money(tt.spend)}</span><span class="${tt.bal >= 0 ? 'good' : 'bad'}">${tt.bal >= 0 ? `on track for a ${U.money(tt.bal)} surplus` : `on track for a ${U.money(-tt.bal)} shortfall`}${J.F.owed > 0 ? `<span class="tiny muted"> · ${U.money(J.F.owed)} of it already spent on unplanned costs</span>` : ''}</span></div>`;
    // The headline while you work: what is left to spend, falling as you add.
    const head = bal ? `<div class="budhead ${bal.gap >= -1 ? 'ok' : 'over'}"><div class="row between"><span>${bal.gap >= -1 ? (mine ? 'Left to spend' : 'Left over in this version') : 'Over budget by'}</span><b>${U.money(Math.abs(bal.gap))}</b></div>
      <div class="bar"><i style="width:${U.clamp(bal.spend / Math.max(1, bal.avail) * 100, 0, 100)}%"></i></div>
      <div class="tiny muted">${U.money(bal.spend)} spent of ${U.money(bal.avail)} available${(bud.draw || 0) < 0 ? ` after setting aside ${U.money(-bud.draw)} for the rainy-day fund` : (bud.draw || 0) > 0 ? `, including ${U.money(bud.draw)} drawn from the rainy-day fund` : ''}${bud.debtPay > 0 ? `; ${U.money(bud.debtPay)} of it pays down debt` : ''}</div></div>` : '';
    // Why the debt moves.
    const df = B().debtFlow(J, bud);
    const debtLine = `<div class="small" style="margin-top:8px;padding:6px 8px;background:var(--panel-2);border-radius:4px"><b>Debt ${bud ? 'under this version' : 'this year'}:</b> <span class="${df.net > 0 ? 'bad' : 'good'}">${df.net > 0 ? 'rises' : 'falls'} ${U.money(Math.abs(df.net))}</span>
      <div class="tiny muted">+${U.money(df.bonds)} new bonds for construction (${Math.round(df.bs * 100)}% borrowed) · −${U.money(df.principal)} regular principal${df.extra ? ` · −${U.money(df.extra)} extra payment` : ''}${df.sur ? ` · −${U.money(df.sur)} surplus to debt` : ''}${df.net > 0 && df.bs > 0 ? '. To stop it rising, borrow less for construction or send surpluses to the debt.' : ''}</div></div>`;
    return ui.panel(bal ? `FY${fy + 1} budget: this version` : `FY${fy + 1} outlook`, `${head}${now}<div class="ind">${stats}
    </div>${debtLine}
    <p class="tiny muted" style="margin-top:6px">Revenue is the official (cautious) estimate. Locked in: benefits, pensions and debt service the law already requires. Status quo cost ("current services") is what it costs to keep doing exactly what agencies do now (prices, enrollment and caseloads rise). Capital lines are partly financed with bonds (${Math.round(B().bondShare(J, bud && bud.bondShare) * 100)}% now).</p>
    ${bal ? `<div class="row between" style="margin-top:8px"><b>This version</b><span class="${bal.gap >= -1 ? 'good' : 'bad'}">${bal.gap >= -1 ? `balanced with ${U.money(bal.gap)} to spare` : `${U.money(-bal.gap)} out of balance`}</span></div>
      <div class="small muted">${Object.entries(bud.tax || {}).filter(([, v]) => v).map(([k, v]) => `${GR.fisc.TAXES[k].name}: ${v > 0 ? '+' : ''}${v}`).join(' · ') || 'No tax changes'}${bud.draw > 0 ? ` · ${U.money(bud.draw - (bud.oneTime || 0))} from the rainy-day fund` : bud.draw < 0 ? ` · ${U.money(-bud.draw)} saved in the rainy-day fund` : ''}${bud.oneTime ? ` · ${U.money(bud.oneTime)} in one-time gimmicks (deferred payments, fund sweeps)` : ''}</div>` : ''}`);
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
    // A fixed order (largest lines first, by their current-services size) so a line stays put while you edit it.
    rows.sort((a, c) => c.cs - a.cs || c.now - a.now || (a.l.k < c.l.k ? -1 : 1));
    const ag = (k) => (J.F.ag.find((a) => a.k === k) || { abbr: k }).abbr;
    return `<div class="scroll-x"><table class="tbl"><thead><tr><th>Line</th><th>Who it helps</th><th class="r">${bud ? 'Current services' : 'Amount'}</th>${bud ? '<th class="r">This version</th><th class="r">Change</th>' : ''}${edit ? '<th></th>' : ''}</tr></thead><tbody>${rows.map((x) => `<tr class="${bud && Math.abs(x.r) > 0.0005 ? 'changed' : ''}"><td class="small"><b>${esc(x.l.name)}</b>${x.l.prog != null ? ' <span class="chip">program</span>' : ''}<br><span class="tiny muted">${esc(ag(x.l.ag))} · ${x.l.part === 'capex' ? 'capital' : 'operating'}</span></td><td>${geoBar(x.l.geo)}</td><td class="r num small">${U.money(bud ? x.cs : x.now)}</td>${bud ? `<td class="r num small">${U.money(x.now)}</td><td class="r num small ${x.r < -0.005 ? 'bad' : x.r > 0.005 ? 'good' : ''}">${pct(x.r)}</td>` : ''}${edit ? `<td><span class="row" style="flex-wrap:nowrap">${[-0.05, -0.01, 0.01, 0.05].map((f) => `<button class="bgr sm" data-act="budadj" data-a="${esc(x.l.k)}|${f}">${f > 0 ? '+' : '−'}${Math.abs(f * 100)}%</button>`).join('')}</span></td>` : ''}</tr>`).join('')}</tbody></table></div>
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
      <div class="tiny muted" style="margin:10px 0 4px">Rainy-day fund · holds ${U.money(o.reserve)}</div>
      <div class="row between small"><span>${(bud.draw || 0) < 0 ? `<b class="good">Deposit ${U.money(-bud.draw)}</b>` : (bud.draw || 0) > 0 ? `<b class="warn">Draw ${U.money(bud.draw)}</b> of ${U.money(o.drawMax)} allowed` : 'No deposit or draw'}</span><span class="row">${ui.btn('Save more', 'buddraw', 'dep', 'bgr sm')}${ui.btn('Draw more', 'buddraw', 'draw', 'bgr sm')}</span></div>
      <div class="row" style="gap:6px;margin-top:4px"><input class="input num" style="max-width:150px" id="buddep" type="number" step="1" placeholder="Deposit, $ millions">${ui.btn('Set deposit', 'buddepset', '', 'bgr sm')}</div>
      <p class="tiny muted" style="margin-top:4px">A deposit is money you leave unspent on purpose; it lands in the fund as the year runs. The fund is capped at 20% of spending; anything above pays down debt.</p>
      <div class="tiny muted" style="margin:10px 0 4px">Pay down debt · ${U.money(o.debt)} owed</div>
      <div class="row between small"><span>${bud.debtPay > 0 ? `<b class="good">Extra payment ${U.money(bud.debtPay)}</b> · saves ~${U.money(bud.debtPay * o.svc)}/yr in debt service` : 'Regular payments only'}</span><span class="row">${ui.btn('Pay more', 'buddebt', '+', 'bgr sm', o.debt <= (bud.debtPay || 0))}${ui.btn('Less', 'buddebt', '-', 'bgr sm', !(bud.debtPay > 0))}</span></div>
      <div class="row" style="gap:6px;margin-top:4px;flex-wrap:wrap"><input class="input num" style="max-width:150px" id="buddebtamt" type="number" step="1" placeholder="Payment, $ millions">${ui.btn('Set payment', 'buddebtset', '', 'bgr sm')}${ui.btn('Put everything left over toward debt', 'buddebt', 'all', 'bgr sm', B().balance(J, bud).gap <= 1)}</div>
      <p class="tiny muted" style="margin-top:4px">A one-time extra payment on principal. It has to fit in the budget like any other spending, and every dollar retired saves about ${(o.svc * 100).toFixed(1)}¢ a year in interest and principal from then on. Rating agencies like it.</p>
      <div class="tiny muted" style="margin:10px 0 4px">Borrowing for construction</div>
      <div class="seg">${[[0.4, '40%'], [0.2, '20% (usual)'], [0.1, '10%'], [0, 'Pay cash']].map(([v, l]) => `<button aria-pressed="${Math.abs(B().bondShare(J, bud.bondShare) - v) < 0.01}" data-act="budbond" data-a="${v}">${l}</button>`).join('')}</div>
      <p class="tiny muted" style="margin-top:4px">States and cities usually borrow part of what they spend on construction. Paying cash costs more this year but stops the debt from growing.</p>
      <div class="tiny muted" style="margin:10px 0 4px">Where a surplus goes</div>
      <div class="seg">${[['reserve', 'Rainy-day fund'], ['split', 'Half and half'], ['debt', 'Pay down debt']].map(([v, l]) => `<button aria-pressed="${(bud.surplusTo || o.surplusTo) === v}" data-act="budsurto" data-a="${v}">${l}</button>`).join('')}</div>
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

  // What departments asked for this budget season, and what this version gives them.
  function agencyPanel(s, J, bud, mode) {
    const bd = J.bud || {};
    const reqs = bd.agReq || [];
    if (!reqs.length || (mode === 'none' && bd.fyDone >= bd.agFy)) return '';
    const cs = (bud && bud.cs) || B().outlook(J).cs;
    const ex = GR.xneg.exTitle(s, J.k).toLowerCase();
    const rows = reqs.map((r) => {
      const sh = bud ? B().reqShare(r, bud.amt, cs) : 0;
      const status = !bud ? `<span class="tiny muted">waiting on the ${esc(ex)}'s budget</span>` : `<span class="tiny ${sh >= 0.95 ? 'good' : sh >= 0.3 ? 'warn' : 'bad'}">${sh >= 0.95 ? 'fully funded' : sh > 0.02 ? `${Math.round(sh * 100)}% funded` : 'not funded'}</span>`;
      const btns = mode === 'draft' ? `<span class="row" style="gap:4px;flex-wrap:nowrap">${ui.btn('Full', 'budagreq', r.k + '|1', sh >= 0.95 ? 'bb sm' : 'bgr sm')}${ui.btn('Half', 'budagreq', r.k + '|0.5', sh > 0.4 && sh < 0.6 ? 'bb sm' : 'bgr sm')}${ui.btn('No', 'budagreq', r.k + '|0', sh <= 0.02 ? 'bb sm' : 'bgr sm')}</span>` : '';
      return `<div class="opp ${r.urgent ? 'urgent' : ''}"><span class="t"><b class="small">${esc(r.abbr)}: ${esc(r.line)}</b> <b class="small">+${U.money(r.ask)}</b> <span class="tiny muted">(+${(r.ask / r.base * 100).toFixed(1)}%)</span>${r.urgent ? ' <span class="chip tbad">urgent</span>' : ''}<br>
        <span class="tiny">Because ${esc(r.why)}. Without it, ${esc(r.risk)}.</span><br>${status}</span>${btns}</div>`;
    }).join('');
    const tot = U.sum(reqs, (r) => r.ask);
    const got = bud ? U.sum(reqs, (r) => r.ask * B().reqShare(r, bud.amt, cs)) : 0;
    return ui.panel(`Agency requests · FY${bd.agFy}`, `<p class="tiny muted" style="margin-bottom:6px">Departments asked for ${U.money(tot)} above current services${bud ? `; this version gives them ${U.money(got)}` : ''}. ${mode === 'draft' ? 'Fund each in full, by half, or not at all; the totals above update as you go.' : `The ${esc(ex)} decides what goes in the budget; lawmakers can move money toward a request in markup.`}</p>${rows}`);
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
  A('budagreq', (el, a) => { const [k, f] = a.split('|'); const d = ui.sel.budDraft; if (!d) return; const J = dJ(); const r = (J.bud.agReq || []).find((x) => x.k === k); if (!r) return; const cs = (d.bud.cs || {})[k] || r.base; d.bud.amt[k] = cs + r.ask * +f; });
  A('budadj', (el, a) => { const [k, f] = a.split('|'); const d = ui.sel.budDraft; if (!d) return; d.bud.amt[k] = Math.max(0, (d.bud.amt[k] || 0) * (1 + +f)); });
  A('budtax', (el, a) => { const [k, dir] = a.split('|'); const d = ui.sel.budDraft; if (!d) return; const step = GR.fisc.TAXES[k].step || (GR.fisc.TAXES[k].unit === 'mills' ? 0.5 : GR.fisc.TAXES[k].unit === '$/t' ? 5 : 0.1); d.bud.tax[k] = U.round((d.bud.tax[k] || 0) + (dir === '+' ? step : -step), 2); });
  // Positive draw takes money out of the rainy-day fund; negative is a deposit.
  const depMax = (J) => GR.fisc.totals(J).spend * 0.05;
  A('budbond', (el, a) => { const d = ui.sel.budDraft; if (d) d.bud.bondShare = +a; });
  A('budsurto', (el, a) => { const d = ui.sel.budDraft; if (d) d.bud.surplusTo = a; });
  A('buddebt', (el, a) => { const d = ui.sel.budDraft; if (!d) return; const J = dJ(); const debt = J.F.debt; const cur = d.bud.debtPay || 0;
    if (a === 'all') { const gap = B().balance(J, d.bud).gap; d.bud.debtPay = Math.round(Math.min(debt, cur + Math.max(0, gap))); return; }
    const step = Math.max(1e6, Math.min(debt * 0.02, GR.fisc.totals(J).spend * 0.005));
    d.bud.debtPay = U.clamp(Math.round(cur + (a === '+' ? step : -step)), 0, debt); });
  A('buddebtset', () => { const d = ui.sel.budDraft; if (!d) return; const J = dJ(); const v = +(document.getElementById('buddebtamt') || {}).value; if (!(v >= 0)) { ui.toast('Enter an amount in millions.'); return; } d.bud.debtPay = Math.round(U.clamp(v * 1e6, 0, J.F.debt)); });
  A('buddraw', (el, a) => { const d = ui.sel.budDraft; if (!d) return; const J = dJ(); const o = B().outlook(J); const step = Math.max(o.drawMax / 5, depMax(J) / 10); d.bud.draw = U.clamp(U.round((d.bud.draw || 0) + (a === 'draw' || a === '+' ? step : -step), -5), -depMax(J), o.drawMax); });
  A('buddepset', () => { const d = ui.sel.budDraft; if (!d) return; const J = dJ(); const v = +(document.getElementById('buddep') || {}).value; if (!(v >= 0)) { ui.toast('Enter an amount in millions.'); return; } d.bud.draw = -U.clamp(v * 1e6, 0, depMax(J)); });
  A('budreset', (el, a) => { const s = ui.s; const J = dJ(); const due = s.budgetDue[J.k]; const o = B().outlook(J); ui.sel.budDraft = { fy: due.fy, jur: J.k, bud: a === 'office' ? Object.assign(B().propose(s, J, s.pols.me), { cs: o.cs }) : { amt: Object.assign({}, o.cs), tax: {}, draw: 0, cs: o.cs } }; });
  A('budfund', (el, a) => { const J = dJ(); const d = ui.sel.budDraft; if (!d) return; const open = (J.bud.requests || []).filter((x) => !x.funded); let tot = 0, title = ''; a.split(',').forEach((i) => { const r = open[+i]; if (!r || r.inProp) return; d.bud.amt[r.line] = (d.bud.amt[r.line] || 0) + r.amt; r.inProp = true; tot += r.amt; title = r.title; }); if (tot) ui.toast(`Added ${U.money(tot)} for the ${title}.`); });
  A('budsubmit', () => { const s = ui.s; const d = ui.sel.budDraft; if (!d) return; const r = L().submitBudget(s, { bud: d.bud }); ui.res(r); if (r.ok) { ui.sel.budDraft = null; ui.save(); } });
  A('buditem', (el, a) => { const [id, k] = a.split('|'); const b = L().findBill(ui.s, id); if (!b) return; ui.res(B().askItem(ui.s, b, k)); ui.save(); });
  A('budmove', (el, a) => { const f = document.getElementById('budfrom').value, t = document.getElementById('budto').value, amt = document.getElementById('budamt').value; if (f === t) { ui.toast('Pick two different lines.'); return; } ui.res(GR.comm.markup(ui.s, a, `bud:${f}:${t}:${Math.round(+amt)}`)); ui.save(); });
  A('budveto', (el, a) => { const [id, k] = a.split('|'); const b = L().findBill(ui.s, id); if (!b) return; const v = new Set(b.my.itemVeto || []); if (el.checked) v.add(k); else v.delete(k); b.my.itemVeto = [...v]; });

  return { render };
})();
