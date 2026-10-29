// Guided bill drafting. A bill starts the way real ones do: a problem your jurisdiction actually
// has, one concrete approach drawn from the levers that problem responds to (a capital program,
// staffing, a program change, a change in law, a tax change, an accountability reform), a scale,
// and a way to pay for it. Optional sections add an audit requirement, labor standards, or a
// project in a colleague's district to win their vote. The draft compiles to exact provisions
// and to bill text that reads like a statute.
var GR = globalThis.GR || (globalThis.GR = {});

GR.drafting = (function () {
  const U = GR.util;
  const FX = () => GR.fisc;
  const L = () => GR.legis;
  const W = () => GR.world;

  const SCALES = [
    { k: 'pilot', name: 'Pilot', desc: 'A small, targeted start. Easy to pass, modest results.' },
    { k: 'standard', name: 'Standard', desc: 'A serious commitment that moves the problem.' },
    { k: 'major', name: 'Major', desc: 'A landmark effort. Big results, big fight.' },
  ];
  const SC = { pilot: 0, standard: 1, major: 2 };

  // What capital money and operating money buy, by problem.
  const BUILD = { housing: 'affordable housing construction', infra: 'road, bridge and facility repairs', migration: 'campus and research facilities', education: 'school construction and modernization', health: 'clinic and hospital capacity', opioid: 'treatment and recovery centers', crime: 'public-safety facilities and equipment', disaster: 'flood control and disaster resilience projects', water: 'water and sewer system upgrades', homeless: 'supportive housing units', energy: 'research parks and industry diversification', poverty: 'community facilities in high-poverty neighborhoods', border: 'border infrastructure and technology', readiness: 'military construction and procurement', veterans: 'VA medical facilities', healthcosts: 'community health centers', debt: 'deferred maintenance' };
  const STAFF = { housing: 'housing counseling and code enforcement', infra: 'maintenance crews and inspections', migration: 'faculty, research grants and scholarships', education: 'teacher hiring, tutoring and smaller classes', health: 'public-health nurses and clinics', opioid: 'addiction treatment and recovery services', crime: 'officer hiring and violence-interruption programs', disaster: 'emergency management and forestry crews', water: 'water-quality testing and leak repair crews', homeless: 'street outreach and shelter operations', energy: 'workforce retraining', poverty: 'caseworkers and job training', border: 'border agents and immigration judges', readiness: 'training and maintenance', veterans: 'VA doctors and claims processors', healthcosts: 'price transparency enforcement', debt: 'collections and auditing' };
  const NOUN = { housing: 'Affordable Housing', infra: 'Infrastructure Repair', migration: 'Talent Retention', education: 'Student Achievement', health: 'Health Access', opioid: 'Opioid Recovery', crime: 'Safe Communities', pension: 'Pension Solvency', disaster: 'Disaster Resilience', water: 'Clean Water', homeless: 'Homelessness Response', energy: 'Economic Diversification', poverty: 'Economic Opportunity', debt: 'Fiscal Responsibility', ssTrust: 'Social Security Solvency', medicareTrust: 'Medicare Solvency', healthcosts: 'Lower Health Costs', border: 'Border Security', readiness: 'Military Readiness', veterans: 'Veterans Care' };

  const placeName = (s, J) => (J.k === 'state' ? GR.STATE[s.home.state].name : J.k === 'nation' ? 'American' : J.k === 'city' ? s.home.cityName : `${s.home.cityName} Schools`);
  const body = (J) => ({ nation: 'Congress', state: 'the Legislature', city: 'the City Council', school: 'the Board' }[J.k]);
  const agName = (a) => (a.name && a.name !== a.abbr && !a.abbr.includes(a.name) ? `${a.name} (${a.abbr})` : a.abbr);
  const entDef = (J, k) => (FX().ENTS[J.F.lvl] || []).find((e) => e.k === k);
  const lvl = (J) => GR.lvlOf(J.k);
  const tcase = (x) => String(x).replace(/\b([a-z])([a-z]*)/g, (m, a, b) => (['and', 'of', 'the', 'for', 'or', 'to', 'in', 'on'].includes(m) ? m : a.toUpperCase() + b));
  const ORD = ['the most', 'the second most', 'the third most', 'the fourth most', 'the fifth most'];

  // ---------- Problems ----------
  // The jurisdiction's crises, worst first, plus three standing subjects.
  function issues(s, jur) {
    const J = s.jur[jur];
    const F = J.F;
    const out = Object.entries(F.crises).sort((a, b) => b[1].s - a[1].s).map(([k, c], i) => {
      const T = GR.CRISIS_TYPES[k];
      const d4 = c.hist.length >= 4 ? c.s - c.hist[c.hist.length - 4] : 0;
      return { k, name: T.name, sev: c.s, trend: d4, rank: i + 1, sal: T.sal, crisis: true };
    });
    for (let i = out.length - 1; i >= 0; i--) if (!approaches(s, jur, out[i].k).length) out.splice(i, 1);
    out.push({ k: '_tax', name: 'Taxes & the economy', desc: 'Cut or raise a tax, or change the rules for an industry.' });
    out.push({ k: '_law', name: 'Change a law', desc: 'Social and policy law: guns, abortion, policing, elections, labor, schools.' });
    out.push({ k: '_gov', name: 'Government performance', desc: 'Audits, management reform, privatization and spending cuts.' });
    // Policy areas: start a new program from the library, or design your own.
    if (GR.prog) Object.entries(GR.prog.AREAS).forEach(([k, A]) => { if (A.ag[J.k]) out.push({ k: '_a:' + k, name: A.name, area: true, n: GR.prog.forLevel(jur).filter((p) => p.area === k).length }); });
    return out;
  }

  // ---------- Approaches ----------
  const progApproach = (J, p, w) => ({ id: `prog:${p.k}`, kind: 'prog', prog: p.k, area: p.area, w, ag: GR.prog.agencyFor(J, p.area).k, name: p.name, desc: `${GR.prog.MECH[p.mech].name} · ${p.desc[0].toUpperCase() + p.desc.slice(1)}.` });
  const customApproach = (J, area) => ({ id: `custom:${area}`, kind: 'custom', area, w: 0, ag: GR.prog.agencyFor(J, area).k, name: 'Design your own program', desc: `A new ${GR.prog.AREAS[area].name.toLowerCase()} program: you decide what it does, how the money moves, who runs it and what it targets.` });
  function approaches(s, jur, issue) {
    const J = s.jur[jur];
    const F = J.F;
    const out = [];
    if (String(issue).startsWith('_a:')) {
      const area = issue.slice(3);
      if (!GR.prog || !GR.prog.AREAS[area]) return out;
      GR.prog.forLevel(jur).filter((p) => p.area === area).forEach((p) => out.push(progApproach(J, p, 1)));
      out.push(customApproach(J, area));
      return out;
    }
    const T = GR.CRISIS_TYPES[issue];
    if (T) {
      (T.ag || []).forEach(([ak, part, w]) => {
        const a = F.ag.find((x) => x.k === ak);
        if (!a) return;
        if (part !== 'opex' && a.capex > 0) out.push({ id: `cap:${ak}`, kind: 'capex', ag: ak, w, name: `Build: ${BUILD[issue] || 'capital projects'}`, desc: `New construction and repairs through ${agName(a)}, now ${U.money(a.capex)} a year in capital spending.` });
        if (part !== 'capex' && a.opex > 0) out.push({ id: `ops:${ak}`, kind: 'opex', ag: ak, w, name: `Staff up: ${STAFF[issue] || 'more services'}`, desc: `Expand operations at ${agName(a)} (${U.money(a.opex)} a year today).` });
        if (part !== 'opex' && a.capex > 0 && ['infra', 'water', 'disaster'].includes(issue) && J.k !== 'school') out.push({ id: `p3:${ak}`, kind: 'p3', ag: ak, w: w * 0.7, name: 'Public–private partnership', desc: `A private partner builds and operates projects for ${a.abbr}, repaid with tolls or availability payments.` });
      });
      (T.ent || []).forEach(([ek, pk, w, dir]) => {
        const def = entDef(J, ek);
        if (!def || !F.ent[ek]) return;
        const pd = def.params.find((x) => x[0] === pk);
        if (!pd) return;
        out.push({ id: `ent:${ek}:${pk}:${dir}`, kind: 'ent', ent: ek, pk, dir, w, name: `${dir > 0 ? 'Expand' : 'Reform'} ${def.name.replace(/\s*\(.*\)/, '')}`, desc: `${pd[1]}: now ${L().fmtParam(pd, F.ent[ek].p[pk])}.` });
      });
      (T.law || []).forEach(([pk, w, dir]) => {
        const pol = GR.POLICY[pk];
        if (!pol || J.law[pk] == null) return;
        const opts = GR.policyOpts(pol, lvl(J));
        const to = J.law[pk] + dir;
        if (to < 0 || to >= opts.length) return;
        out.push({ id: `law:${pk}:${dir}`, kind: 'law', pol: pk, dir, w, name: `Change the law: ${pol.name.toLowerCase()}`, desc: `From "${opts[J.law[pk]]}" toward "${opts[to]}".` });
      });
      (T.tax || []).forEach(([tk, w, dir]) => {
        if (F.tax[tk] == null) return;
        out.push({ id: `tax:${tk}:${dir}`, kind: 'tax', tax: tk, dir, w, name: `${dir < 0 ? 'Cut' : 'Raise'} the ${FX().TAXES[tk].name.toLowerCase()}`, desc: `Now ${L().fmtTax(tk, F.tax[tk])}.` });
      });
      out.forEach((x) => { if (x.ent === 'pension') { x.name = 'Pay down the pension debt'; x.desc = `Raise employer contributions toward the actuarial requirement (now ${F.ent.pension.p.pct}%).`; } });
      // Programs from the library aimed at this problem, and room to design your own.
      if (GR.prog) {
        const ps = GR.prog.forLevel(jur).map((p) => [p, (GR.prog.AREAS[p.area].tgt[issue] || 0) + ((p.tgt || {})[issue] || 0)]).filter((x) => x[1] >= 0.15).sort((a, b) => b[1] - a[1]).slice(0, 6);
        ps.forEach(([p, w]) => out.push(progApproach(J, p, w)));
        if (ps.length) out.push(customApproach(J, ps[0][0].area));
      }
      out.sort((a, b) => b.w - a.w);
    } else if (issue === '_tax') {
      FX().LEVEL_TAXES[J.k].filter((k) => F.tax[k] != null).forEach((k) => {
        const Tx = FX().TAXES[k];
        out.push({ id: `tax:${k}:-1`, kind: 'tax', tax: k, dir: -1, name: `Cut the ${Tx.name.toLowerCase()}`, desc: `Now ${L().fmtTax(k, F.tax[k])}.` });
        out.push({ id: `tax:${k}:1`, kind: 'tax', tax: k, dir: 1, name: `Raise the ${Tx.name.toLowerCase()}`, desc: `Now ${L().fmtTax(k, F.tax[k])}. The money goes to the general fund.` });
      });
      if (J.k !== 'school' && J.k !== 'city') GR.INDUSTRIES.forEach((x) => {
        out.push({ id: `reg:${x.k}:-1`, kind: 'reg', ind: x.k, dir: -1, name: `Cut red tape: ${x.name.toLowerCase()}`, desc: `Streamline permits and compliance (now ${U.round(F.reg[x.k] || 0, 1)}% of output).` });
        out.push({ id: `reg:${x.k}:1`, kind: 'reg', ind: x.k, dir: 1, name: `New safeguards: ${x.name.toLowerCase()}`, desc: 'Consumer, worker and environmental protections that raise compliance costs.' });
      });
    } else if (issue === '_law') {
      GR.policiesFor(J.k).filter((p) => !['incometax', 'corptax', 'capgains', 'estatetax', 'propertytax'].includes(p.k) && J.law[p.k] != null).forEach((p) => {
        const opts = GR.policyOpts(p, lvl(J));
        [-1, 1].forEach((dir) => { const to = J.law[p.k] + dir; if (to >= 0 && to < opts.length) out.push({ id: `law:${p.k}:${dir}`, kind: 'law', pol: p.k, dir, cat: p.cat, name: `${p.name}: ${opts[to]}`, desc: `${p.cat} · now "${opts[J.law[p.k]]}".` }); });
      });
    } else if (issue === '_gov') {
      F.ag.forEach((a) => {
        out.push({ id: `ref:${a.k}`, kind: 'reform', ag: a.k, name: `Accountability reform: ${a.abbr}`, desc: `Independent audit, performance metrics and management changes (audit score ${Math.round(a.eff)}).` });
        out.push({ id: `cut:${a.k}`, kind: 'cut', ag: a.k, name: `Spending cut: ${a.abbr}`, desc: `Trim the ${U.money(a.opex)} operating budget.` });
        if (a.capex > a.opex * 0.3 && J.k !== 'school') out.push({ id: `sale:${a.k}`, kind: 'sale', ag: a.k, name: `Sell or lease assets: ${a.abbr}`, desc: 'Lease or sell public assets to a private operator for a one-time payment.' });
      });
    }
    return out;
  }

  // ---------- Compile ----------
  const perPoint = (J, k) => { const r = FX().revenue(J)[k]; return r && J.F.tax[k] > 0 ? r.amt / J.F.tax[k] : null; };
  function staticCost(s, J, prov) {
    const c = FX().cloneJ(J);
    const t0 = FX().totals(c);
    FX().apply(c, { prov });
    const t1 = FX().totals(c);
    return (t1.spend - t0.spend) - (t1.rev - t0.rev);
  }
  // The main section's provisions and text.
  function mainSection(s, J, a, scale, d) {
    const F = J.F;
    const i = SC[scale] || 0;
    const prov = L().emptyProv();
    const ag = a.ag && F.ag.find((x) => x.k === a.ag);
    let head = '', text = '', title = '';
    const where = placeName(s, J);
    if (a.kind === 'prog' || a.kind === 'custom') {
      let spec;
      if (a.kind === 'prog') spec = { k: a.prog, scale };
      else {
        const c = (d && d.custom) || {};
        const raw = String(c.desc || '').trim().replace(/\.*$/, '').replace(/^(to|a program to|a program that|create a program to|create a program that)\s+/i, '');
        const desc = raw ? (/^\w+ing\b/i.test(raw) ? `work toward ${raw.replace(/^./, (x) => x.toLowerCase())}` : raw.replace(/^./, (x) => x.toLowerCase())) : '';
        const tg = Array.isArray(c.tgt) ? c.tgt.filter((k) => F.crises[k]) : null;
        const per = tg && tg.length ? [0, 0.45, 0.35, 0.28][Math.min(3, tg.length)] : 0;
        spec = { name: c.name || 'New Program', desc, area: a.area, mech: c.mech || 'services', ag: c.ag || null, scale, tgtOnly: tg ? Object.fromEntries(tg.map((k) => [k, per])) : null };
      }
      const ds = GR.prog.design(s, J, spec);
      GR.prog.provFor(J, ds, prov);
      a.ag = ds.ag;
      a.capital = GR.prog.MECH[ds.mech].part === 'capex';
      a.design = ds;
      head = 'NEW PROGRAM';
      text = GR.prog.sectionText(J, ds);
      title = `${where === 'American' ? '' : where + ' '}${ds.name.replace(/\s+Act$/, '')} Act`;
    } else if (a.kind === 'capex') {
      const amt = Math.round(ag.capex * [0.06, 0.15, 0.32][i]);
      prov.ap[ag.k] = { capex: amt };
      head = 'CAPITAL APPROPRIATION';
      text = `There is appropriated ${U.money(amt)} a year to ${agName(ag)} for ${BUILD[a.issue] || 'capital projects'}, an increase of ${[6, 15, 32][i]}% in its capital budget.`;
      title = `${where} ${NOUN[a.issue] || 'Capital'} ${['Pilot', 'Investment', 'Bond & Investment'][i]} Act`;
    } else if (a.kind === 'opex') {
      const amt = Math.round(ag.opex * [0.02, 0.05, 0.1][i]);
      prov.ap[ag.k] = { opex: amt };
      head = 'OPERATING APPROPRIATION';
      text = `There is appropriated ${U.money(amt)} a year to ${agName(ag)} for ${STAFF[a.issue] || 'expanded services'}, an increase of ${[2, 5, 10][i]}% in its operating budget.`;
      title = `${where} ${NOUN[a.issue] || 'Services'} ${['Pilot Program', 'Workforce Act', 'Expansion Act'][i]}`.replace(/Program$/, 'Program Act');
    } else if (a.kind === 'p3') {
      const amt = Math.round(ag.capex * [0.08, 0.18, 0.35][i]);
      prov.ap[ag.k] = { capex: amt };
      prov.fee[`${ag.abbr} availability payments & tolls`] = Math.round(amt * 0.55);
      prov.eff[ag.k] = [2, 3, 4][i];
      head = 'PUBLIC–PRIVATE PARTNERSHIP';
      text = `${agName(ag)} may contract with private partners to finance, build and operate ${U.money(amt)} a year in projects, repaid in part by ${U.money(amt * 0.55)} a year in tolls and availability payments. Contracts must meet performance standards.`;
      title = `${where} ${NOUN[a.issue] || 'Infrastructure'} Partnership Act`;
    } else if (a.kind === 'ent') {
      const def = entDef(J, a.ent);
      const pd = def.params.find((x) => x[0] === a.pk);
      const cur = F.ent[a.ent].p[a.pk];
      const step = Math.max(pd[5], Math.abs(cur) * [0.05, 0.12, 0.22][i]);
      const rounding = pd[5] < 1 ? 1 : 0;
      let to = U.clamp(U.round(cur + a.dir * step, rounding), pd[3], pd[4]);
      if (to === cur) to = U.clamp(U.round(cur + a.dir * pd[5] * (i + 1), rounding), pd[3], pd[4]);
      prov.ent[a.ent] = { [a.pk]: to };
      head = 'PROGRAM CHANGES';
      text = `${def.name}: the ${pd[1].toLowerCase()} changes from ${L().fmtParam(pd, cur)} to ${L().fmtParam(pd, to)}.`;
      title = `${where} ${tcase(def.name.replace(/\s*\(.*\)/, ''))} ${a.dir > 0 ? ['Access', 'Expansion', 'Guarantee'][i] : ['Integrity', 'Reform', 'Modernization'][i]} Act`;
    } else if (a.kind === 'law') {
      const pol = GR.POLICY[a.pol];
      const opts = GR.policyOpts(pol, lvl(J));
      const steps = scale === 'major' ? 2 : 1;
      const to = U.clamp(J.law[a.pol] + a.dir * steps, 0, opts.length - 1);
      prov.policy.push({ k: a.pol, to });
      head = 'CHANGE IN LAW';
      text = `${pol.name}: the law of ${where === 'American' ? 'the United States' : where} changes from "${opts[J.law[a.pol]]}" to "${opts[to]}".`;
      title = `${tcase(opts[to].replace(/[^\w\s'-]/g, ' ')).split(/\s+/).filter(Boolean).slice(0, 6).join(' ')} Act`;
    } else if (a.kind === 'tax') {
      const Tx = FX().TAXES[a.tax];
      const base = Tx.unit === '$/t' ? [5, 15, 30][i] : Tx.unit === 'mills' ? [0.5, 1.5, 3][i] : [0.25, 0.6, 1.25][i];
      const d = a.dir * Math.min(base, a.dir < 0 ? F.tax[a.tax] : 99);
      prov.tax[a.tax] = U.round(d, 2);
      head = 'TAX RATES';
      text = `The ${Tx.name.toLowerCase()} changes from ${L().fmtTax(a.tax, F.tax[a.tax])} to ${L().fmtTax(a.tax, F.tax[a.tax] + d)}.`;
      title = a.dir < 0 ? `${where} ${{ high: 'Top Rate Relief', mid: 'Middle-Class Tax Relief', low: 'Working Families Tax Relief', corp: 'Jobs & Competitiveness', sales: 'Sales Tax Relief', prop: 'Property Tax Relief', capg: 'Investment Growth', payroll: 'Paycheck Relief', carbon: 'Energy Cost Relief', sev: 'Energy Production' }[a.tax] || 'Tax Relief'} Act` : `${where} ${{ high: 'Fair Share', corp: 'Corporate Accountability', carbon: 'Clean Air', sev: 'Resource Dividend', sales: 'Revenue', prop: 'Community Investment' }[a.tax] || 'Revenue'} Act`;
    } else if (a.kind === 'reg') {
      const d = a.dir * [0.2, 0.5, 1][i];
      const ind = GR.INDUSTRIES.find((x) => x.k === a.ind);
      prov.reg[a.ind] = U.round(d, 2);
      head = a.dir < 0 ? 'REGULATORY RELIEF' : 'SAFEGUARDS';
      text = a.dir < 0 ? `Permitting and compliance rules for ${ind.name.toLowerCase()} are streamlined, cutting compliance costs by ${Math.abs(d)}% of output.` : `New consumer, worker and environmental protections apply to ${ind.name.toLowerCase()}, raising compliance costs by ${d}% of output.`;
      title = a.dir < 0 ? `${ind.name} Permitting Reform Act` : `${ind.name} Accountability & Safety Act`;
    } else if (a.kind === 'reform') {
      prov.eff[ag.k] = [4, 7, 11][i];
      prov.ap[ag.k] = { opex: -Math.round(ag.opex * [0.005, 0.01, 0.02][i]) };
      head = 'ACCOUNTABILITY';
      text = `${agName(ag)} must undergo an independent performance audit, publish quarterly metrics and consolidate duplicative offices, saving ${[0.5, 1, 2][i]}% of its operating budget.`;
      title = `${ag.abbr} Accountability & Performance Act`;
    } else if (a.kind === 'cut') {
      prov.ap[ag.k] = { opex: -Math.round(ag.opex * [0.02, 0.05, 0.1][i]) };
      head = 'SPENDING REDUCTION';
      text = `The operating appropriation for ${agName(ag)} is reduced by ${[2, 5, 10][i]}% (${U.money(ag.opex * [0.02, 0.05, 0.1][i])} a year).`;
      title = `${ag.abbr} Spending Reduction Act`;
    } else if (a.kind === 'sale') {
      const amt = Math.round((ag.capex + ag.opex) * [0.05, 0.12, 0.25][i]);
      prov.sale[ag.k] = amt;
      prov.ap[ag.k] = { opex: -Math.round(ag.opex * [0.01, 0.03, 0.06][i]) };
      head = 'ASSET LEASE';
      text = `${agName(ag)} may lease or sell public assets to a private operator for about ${U.money(amt)}, with service standards written into the contract.`;
      title = `${ag.abbr} Asset Recycling Act`;
    }
    return { prov, head, text, title };
  }

  // How the bill pays for itself.
  function payOptions(s, jur, cost, a) {
    const J = s.jur[jur];
    const F = J.F;
    if (!(cost > 0)) return [];
    const out = [{ k: 'none', name: J.k === 'nation' ? 'Deficit-financed' : 'Draw on reserves and borrowing', desc: J.k === 'nation' ? 'Adds to the debt. Fiscal hawks object.' : 'No offset. Hurts the balance and possibly the credit rating.' }];
    FX().LEVEL_TAXES[J.k].filter((k) => F.tax[k] != null && !(a && a.kind === 'tax' && a.tax === k)).forEach((k) => {
      const per = perPoint(J, k);
      if (!per) return;
      const d = cost / per;
      const Tx = FX().TAXES[k];
      if (d > (Tx.unit === 'mills' ? 6 : Tx.unit === '$/t' ? 60 : 3)) return;
      out.push({ k: `tax:${k}`, name: `Raise the ${Tx.name.toLowerCase()} by ${Tx.unit === '$/t' ? '$' + U.round(d, 0) + '/ton' : U.round(d, 2) + (Tx.unit === 'mills' ? ' mills' : ' points')}`, desc: `Raises about ${U.money(cost)} a year.` });
    });
    F.ag.filter((g) => g.opex > cost * 4 && g.k !== (a && a.ag)).sort((x, y) => y.opex - x.opex).slice(0, 6).forEach((g) => {
      out.push({ k: `cut:${g.k}`, name: `Cut ${g.abbr} operations by ${U.round(cost / g.opex * 100, 1)}%`, desc: `Takes ${U.money(cost)} a year from ${agName(g)}.` });
    });
    if (a && (a.kind === 'capex') && J.k !== 'school') out.push({ k: 'fee', name: 'User fees cover half', desc: 'Tolls, fares or connection fees repay half the cost.' });
    // Lead with what your side would reach for: progressive taxes on the left, cuts on the right.
    const fis = W().axes(s.pols.me).fis;
    const rank = (o) => (o.k === 'none' ? 0 : o.k.startsWith('cut:') ? fis * 2 : o.k.startsWith('tax:') ? -fis * 2 + (FX().TAXES[o.k.slice(4)].lean || 0) * -fis * -1 : 0.5);
    const head = out.shift();
    out.sort((x, y) => rank(y) - rank(x));
    return [head].concat(out);
  }
  function applyPay(s, J, prov, cost, pay, a) {
    if (!pay || pay === 'none' || !(cost > 0)) return '';
    const F = J.F;
    if (pay.startsWith('tax:')) {
      const k = pay.slice(4);
      const per = perPoint(J, k);
      if (!per) return '';
      const d = U.round(cost / per, FX().TAXES[k].unit === '$/t' ? 0 : 2);
      prov.tax[k] = U.round((prov.tax[k] || 0) + d, 2);
      return `To pay for this Act, the ${FX().TAXES[k].name.toLowerCase()} rises from ${L().fmtTax(k, F.tax[k])} to ${L().fmtTax(k, F.tax[k] + d)}.`;
    }
    if (pay.startsWith('cut:')) {
      const g = F.ag.find((x) => x.k === pay.slice(4));
      if (!g) return '';
      const v = prov.ap[g.k] || (prov.ap[g.k] = {});
      v.opex = (v.opex || 0) - Math.round(cost);
      return `To pay for this Act, the operating appropriation for ${agName(g)} is reduced by ${U.money(cost)} a year.`;
    }
    if (pay === 'fee' && a && a.ag) {
      const g = F.ag.find((x) => x.k === a.ag);
      prov.fee[`${g.abbr} user fees`] = Math.round(cost * 0.5);
      return `${agName(g)} shall set user fees, tolls or fares sufficient to repay half the cost, about ${U.money(cost * 0.5)} a year.`;
    }
    return '';
  }

  // The whole draft: { issue, appr, scale, pay, riders:{audit, labor, ear, mine}, title, kind }.
  function compile(s, jur, d) {
    const J = s.jur[jur];
    const F = J.F;
    const list = approaches(s, jur, d.issue);
    const a = list.find((x) => x.id === d.appr);
    if (!a) return null;
    a.issue = d.issue;
    const m = mainSection(s, J, a, d.scale || 'standard', d);
    const prov = m.prov;
    const sections = [];
    const T = GR.CRISIS_TYPES[d.issue];
    const cr = T && F.crises[d.issue];
    // A new program's findings name the worst problem it targets.
    if (!cr && a.design) { const top = Object.entries(a.design.tgt).filter(([k]) => F.crises[k]).sort((x, y) => F.crises[y[0]].s * y[1] - F.crises[x[0]].s * x[1])[0]; if (top) { d = Object.assign({}, d, { _find: top[0] }); } }
    const fk = cr ? d.issue : d._find;
    const findings = fk && !cr ? `${body(J)[0].toUpperCase() + body(J).slice(1)} finds that ${J.name} faces ${GR.CRISIS_TYPES[fk].name.toLowerCase().replace(/^/, /^[aeiou]/i.test(GR.CRISIS_TYPES[fk].name) ? 'an ' : 'a ')}, rated ${Math.round(F.crises[fk].s)} of 100 in severity, and that ${GR.prog.AREAS[a.area].name.toLowerCase()} programs are needed to address it.` : cr ? `${body(J)[0].toUpperCase() + body(J).slice(1)} finds that ${J.name} faces a ${T.name.toLowerCase()}, rated ${Math.round(cr.s)} of 100 in severity, ${ORD[issues(s, jur).findIndex((x) => x.k === d.issue)] ? ORD[issues(s, jur).findIndex((x) => x.k === d.issue)] + ' serious problem' : 'one of the serious problems'} facing the ${J.k === 'nation' ? 'country' : J.k === 'state' ? 'state' : 'city'}.` : `${body(J)[0].toUpperCase() + body(J).slice(1)} finds that this Act serves the public interest.`;
    sections.push(['FINDINGS', findings]);
    if (d.idea && d.idea.trim()) sections.push(['PURPOSE', `The purpose of this Act is ${d.idea.trim().replace(/^(to\s+)?/i, 'to ').replace(/\.*$/, '').replace(/^to (.)/, (m, c) => 'to ' + c.toLowerCase())}.`]);
    sections.push([m.head, m.text]);
    // Riders.
    const R = d.riders || {};
    const ag = a.ag && F.ag.find((x) => x.k === a.ag);
    if (R.audit && ag && a.kind !== 'reform') { prov.eff[ag.k] = (prov.eff[ag.k] || 0) + 3; sections.push(['OVERSIGHT', `${agName(ag)} must report results to ${body(J)} each year and submit to an independent audit of funds under this Act.`]); }
    if (R.labor && ag && (['capex', 'p3'].includes(a.kind) || a.capital)) { prov.prem[ag.k] = 6; sections.push(['LABOR STANDARDS', `Projects funded by this Act must pay prevailing wages, use apprenticeship programs and buy domestic materials.`]); }
    const earAg = ag || F.ag.find((x) => x.capex > 0) || F.ag[0];
    const earAmt = Math.round(FX().totals(J).spend * (J.k === 'nation' ? 0.000004 : 0.00012));
    if (R.ear && s.pols[R.ear]) { const p = s.pols[R.ear]; prov.ear.push({ who: p.id, ag: earAg.k, amt: earAmt, proj: L().earmarkName(s, p, earAg) }); sections.push(['COMMUNITY PROJECT', `${U.money(earAmt)} is directed to the ${prov.ear[prov.ear.length - 1].proj}, at the request of ${W().fullName(p)}.`]); }
    if (R.mine) { const me = s.pols.me; prov.ear.push({ who: 'me', ag: earAg.k, amt: earAmt, proj: L().earmarkName(s, me, earAg) }); sections.push(['COMMUNITY PROJECT', `${U.money(earAmt)} is directed to the ${prov.ear[prov.ear.length - 1].proj} in the sponsor's district.`]); }
    const cost = staticCost(s, J, prov);
    const payText = applyPay(s, J, prov, cost, d.pay, a);
    if (payText) sections.push(['OFFSET', payText]);
    else if (cost > 0) sections.push(['FINANCING', J.k === 'nation' ? 'Costs under this Act are not offset.' : 'Costs under this Act are paid from reserves and bond proceeds.']);
    sections.push(['EFFECTIVE DATE', `This Act takes effect at the start of fiscal year ${L().fiscalYear(s, jur) + 1}${a.kind === 'law' ? ', except that changes in law take effect on enactment' : ''}.`]);
    const net = staticCost(s, J, prov);
    return { a, prov, title: d.title || GR.billgen.unique(s, J, m.title), autoTitle: m.title, sections, cost, net };
  }

  // ---------- Your own idea ----------
  // The drafting office reads a plain-English idea and proposes how to write it: the problem it
  // answers, the mechanism, the scale, and any hints about paying for it.
  const LEX = {
    housing: 'housing rent rents renters home homes homeownership apartment apartments afford affordable affordability zoning landlord landlords tenant tenants mortgage adu adus duplex starter',
    homeless: 'homeless homelessness shelter shelters unhoused encampment encampments unsheltered',
    infra: 'road roads bridge bridges pothole potholes highway highways infrastructure interstate traffic transit bus buses rail train trains subway metro broadband',
    education: 'school schools teacher teachers student students classroom classrooms tutoring literacy reading math education kindergarten prek pre-k preschool curriculum',
    migration: 'college colleges university universities graduates graduate talent scholarship scholarships research tuition young',
    health: 'health hospital hospitals clinic clinics medicaid insurance uninsured doctor doctors nurses rural coverage mental',
    healthcosts: 'drug drugs prescription prescriptions insulin premiums premium medical bills costs',
    opioid: 'opioid opioids fentanyl addiction overdose overdoses recovery treatment naloxone narcan',
    crime: 'crime police officer officers cops violence violent shooting shootings guns gun safety safe carjacking theft jail prosecutors',
    disaster: 'flood floods flooding hurricane hurricanes wildfire wildfires storm storms climate resilience disaster disasters heat levee levees seawall',
    water: 'water sewer drought pipes pipe lead drinking reservoir aquifer wastewater',
    poverty: 'poverty poor low-income childcare child care daycare food hunger snap welfare families family wages paycheck working',
    energy: 'oil gas coal diversify diversification energy renewable renewables solar wind jobs industry manufacturing',
    pension: 'pension pensions retirement retirees retiree',
    debt: 'debt deficit deficits balanced balance surplus spending',
    veterans: 'veteran veterans va',
    border: 'border immigration immigrants migrants asylum wall',
    readiness: 'military defense troops navy army readiness weapons',
    ssTrust: 'social security',
    medicareTrust: 'medicare seniors',
  };
  const KIND = {
    capex: 'build building construct construction new repair repairs fix rebuild upgrade upgrades modernize modernization facility facilities project projects units centers center bond bonds expand capacity',
    opex: 'hire hiring staff staffing workers teachers officers nurses raise raises salaries salary pay services program programs outreach tutoring training counselors',
    ent: 'eligibility benefit benefits credit credits subsidy subsidies voucher vouchers assistance coverage expand expansion contributions',
    law: 'ban legalize legal require requires allow allows prohibit mandate law laws permit rights restrict protect protections end abolish',
    tax: 'tax taxes rate rates relief',
    reform: 'audit audits accountability waste efficiency transparency oversight performance',
    cut: 'cut cuts reduce slash eliminate trim',
    p3: 'partnership private toll tolls p3',
    reg: 'regulation regulations red tape permitting deregulate safeguards',
    sale: 'sell lease privatize privatization',
  };
  const words = (x) => String(x).toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
  const STOP = new Set('the a an and or of to in on for with by from at is are be our my we i it this that more less new all every state city'.split(' '));
  function nameFromIdea(text) {
    let x = String(text).trim().replace(/[^\w\s'&-]/g, ' ');
    for (let i = 0; i < 4; i++) x = x.replace(/^(i want to|we should|we need to|let's|lets|please|create|creating|start|starting|establish|establishing|fund|funding|launch|launching|set up|make|a|an|the|new|statewide|citywide|national|program|programs|initiative|to|for|that)\s+/i, '');
    // Stop at a clause ("so kids…", "that…", "because…") and drop trailing small words.
    let ws = x.split(/\s+/).filter(Boolean);
    const cut = ws.findIndex((w, i) => i >= 2 && /^(so|that|which|because|who|where|when|by|while)$/i.test(w));
    if (cut > 0) ws = ws.slice(0, cut);
    ws = ws.slice(0, 7);
    while (ws.length > 1 && /^(to|for|in|the|of|and|a|an|on|at|with|so|from)$/i.test(ws[ws.length - 1])) ws.pop();
    if (!ws.length) return 'New Program';
    const name = ws.map((w) => (/[A-Z]{2,}/.test(w) ? w : tcase(w.toLowerCase()))).join(' ').replace(/^(\w)(\w*) /, (m, a, b) => a.toUpperCase() + b + ' ');
    return /\b(program|fund|initiative|grants?|services|act)$/i.test(name) ? name : name + ' Program';
  }
  function interpret(s, jur, text) {
    const ws = words(text).filter((w) => !STOP.has(w));
    if (!ws.length) return { cands: [], hints: {} };
    const set = new Set(ws);
    const has = (list) => list.split(' ').filter((w) => set.has(w));
    const phrase = (p) => String(text).toLowerCase().includes(p);
    const down = has('cut cuts lower lowering reduce reducing relief eliminate end repeal freeze').length > 0 || phrase('no new tax');
    const up = has('raise raising increase increasing hike tax-the-rich millionaire millionaires billionaires wealthy surcharge').length > 0 || phrase('fair share') || phrase('tax the rich');
    const issueScore = {};
    Object.entries(LEX).forEach(([k, l]) => { const h = has(l); issueScore[k] = h.length; });
    const kindScore = {};
    Object.entries(KIND).forEach(([k, l]) => { kindScore[k] = has(l).length; });
    const all = issues(s, jur);
    const cands = [];
    all.forEach((iss) => {
      approaches(s, jur, iss.k).forEach((a) => {
        let sc = 0;
        const why = [];
        const im = issueScore[iss.k] || 0;
        if (im) { sc += 2 + im; why.push(iss.name.toLowerCase()); }
        const km = kindScore[a.kind] || 0;
        if (km) sc += 1.8 * km;
        // A clear verb for a different mechanism ("build", "hire") counts against this one.
        const lead = Object.entries(kindScore).sort((x, y) => y[1] - x[1])[0];
        if (lead[1] >= 1 && lead[0] !== a.kind && !km && !(lead[0] === 'capex' && a.kind === 'p3')) sc -= 1.5;
        const aw = new Set(words(a.name + ' ' + a.desc).filter((w) => !STOP.has(w) && w.length > 3));
        const overlap = ws.filter((w) => aw.has(w));
        sc += overlap.length * 0.8;
        if (a.kind === 'law') {
          const pol = GR.POLICY[a.pol];
          const opts = GR.policyOpts(pol, lvl(s.jur[jur]));
          const to = s.jur[jur].law[a.pol] + a.dir;
          const pw = new Set(words(pol.name + ' ' + pol.cat));
          const tw = new Set(words(opts[to] || ''));
          const pm = ws.filter((w) => pw.has(w)).length;
          const tm = ws.filter((w) => tw.has(w)).length;
          if (!pm && !tm) return;
          sc += pm * 2.5 + tm * 1.1 - (tm ? 0 : 1.5);
          why.push(pol.name.toLowerCase());
        }
        if (a.kind === 'tax') { const tw = words(FX().TAXES[a.tax].name); const tm = ws.filter((w) => tw.includes(w) && w !== 'tax').length; if (!set.has('tax') && !set.has('taxes') && !tm) return; if (!tm && has('property sales income corporate payroll carbon capital gains severance gas').length) return; sc += tm * 2 + (a.dir < 0 ? (down ? 2 : -1) : (up ? 2 : -1)); }
        if (a.kind === 'reg') { if (!kindScore.reg && !overlap.length) return; sc += a.dir < 0 ? (down ? 1 : 0) : (has('protect safeguards safety').length ? 1 : 0); }
        if (a.kind === 'cut' || a.kind === 'sale' || a.kind === 'reform') { if (!km) return; }
        if (a.kind === 'ent') { const def = entDef(s.jur[jur], a.ent); const nw = words(a.ent + ' ' + (def ? def.name : '')); if (ws.some((w) => nw.includes(w) && w.length > 3)) sc += 3; }
        if (a.ag) { const g = s.jur[jur].F.ag.find((x) => x.k === a.ag); if (g && ws.some((w) => w === g.abbr.toLowerCase() || words(g.name || '').includes(w) && w.length > 4)) sc += 1.5; }
        if (iss.crisis) sc += iss.sev / 200;
        if (sc >= 2.4) cands.push({ issue: iss.k, appr: a.id, sc, name: a.name, issueName: iss.name, why });
      });
    });
    cands.sort((x, y) => y.sc - x.sc);
    // Scale, payment and extras the idea mentions.
    const hints = {};
    if (has('pilot small test trial modest').length) hints.scale = 'pilot';
    else if (has('major massive huge historic landmark sweeping billions bold').length || phrase('billion')) hints.scale = 'major';
    if (has('millionaire millionaires billionaires wealthy rich').length || phrase('fair share')) hints.pay = 'tax:high';
    else if (has('corporations corporate companies').length && up) hints.pay = 'tax:corp';
    else if (has('toll tolls fees fee fares').length) hints.pay = 'fee';
    else if (phrase('no new tax') || phrase('without raising taxes') || phrase('cutting waste')) hints.pay = 'cut';
    else if (has('borrow bonds bond').length) hints.pay = 'none';
    hints.riders = {};
    if (has('audit audits accountability oversight').length) hints.riders.audit = true;
    if (has('union unions prevailing apprenticeship apprenticeships local').length || phrase('american-made') || phrase('made in america')) hints.riders.labor = true;
    if (has('district neighborhood hometown').length) hints.riders.mine = true;
    // Seen as a name if the idea is short and has no verb-like opener.
    const m = String(text).match(/"([^"]{4,80})"/);
    hints.title = m ? m[1] : null;
    // Programs from the library, and the option to write it as a program of your own.
    if (GR.prog) {
      const pm = GR.prog.match(s, jur, text);
      pm.progs.forEach((x) => cands.push({ issue: '_a:' + x.p.area, appr: 'prog:' + x.p.k, sc: x.sc + 1, name: x.p.name, issueName: GR.prog.AREAS[x.p.area].name, why: [] }));
      cands.sort((x, y) => y.sc - x.sc);
      const area = pm.area || (cands[0] && cands[0].issue.startsWith('_a:') ? cands[0].issue.slice(3) : null);
      hints.custom = { name: nameFromIdea(text), desc: String(text).trim(), mech: GR.prog.mechOf(text), area };
    }
    const seen = new Set();
    return { cands: cands.filter((c) => { const k = c.appr; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6), hints };
  }

  return { SCALES, issues, approaches, compile, payOptions, staticCost, placeName, interpret };
})();
