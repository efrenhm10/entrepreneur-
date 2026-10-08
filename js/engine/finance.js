// Taxes, loans, credit and the financing marketplace.
var G = globalThis.G || (globalThis.G = {});

G.finance = (function () {
  const U = G.util;

  // ---------- Taxes (2026, single filer, simplified) ----------
  const FED = [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]];
  const STD_DED = 16100;
  const SS_BASE = 184500;

  function fedTax(taxable) {
    let tax = 0, prev = 0;
    for (const [cap, r] of FED) {
      if (taxable <= prev) break;
      tax += (Math.min(taxable, cap) - prev) * r;
      prev = cap;
    }
    return Math.max(0, tax);
  }
  function marginalFed(taxable) {
    for (const [cap, r] of FED) if (taxable <= cap) return r;
    return 0.37;
  }
  function stateTax(ab, taxable) {
    const st = G.loc.state(ab);
    if (!st || taxable <= 0) return 0;
    const [lo, hi] = st.tax;
    const eff = (lo + (hi - lo) * Math.pow(Math.min(1, taxable / 300000), 0.7) * 0.85) / 100;
    return taxable * eff;
  }
  function seTax(net) {
    if (net <= 400) return 0;
    const base = net * 0.9235;
    return Math.min(base, SS_BASE) * 0.124 + base * 0.029;
  }

  // Full-year return. y = ytd ledger; entity of the business during the year.
  function computeReturn(s, y) {
    const entity = y.entity || (s.biz ? s.biz.entity : 'sole');
    const passThrough = entity !== 'ccorp';
    const bizIncome = passThrough ? y.biz : 0;
    const se = (entity === 'sole' || entity === 'llc') ? seTax(Math.max(0, bizIncome)) : 0;
    const wages = y.wages + (y.corpSalary || 0);
    const gross = wages + y.gig + bizIncome + y.other;
    const agi = gross - se / 2;
    const qbiBase = Math.max(0, bizIncome - se / 2) + Math.max(0, y.gig * 0.7);
    // Charitable gifts: itemize when it beats the standard deduction (2026 rules:
    // 0.5%-of-AGI floor, 60% of AGI cap, $40k SALT cap); non-itemizers get up to $1,000.
    const don = y.donations || 0;
    const itemized = Math.min(Math.max(0, don - agi * 0.005), agi * 0.6) + Math.min(40000, stateTax(s.loc.state, Math.max(0, agi - 5000)));
    const deduction = Math.max(STD_DED + Math.min(1000, don), itemized);
    const preQbi = Math.max(0, agi - deduction);
    const qbi = Math.min(qbiBase * 0.2, preQbi * 0.2);
    const taxable = Math.max(0, preQbi - qbi);
    const fed = fedTax(taxable);
    const gigSe = seTax(y.gig * 0.7); // ~30% of gig gross goes to vehicle costs
    const state = stateTax(s.loc.state, Math.max(0, agi - 5000));
    const cap = y.capgain || 0;
    const capTax = cap > 0 ? cap * (taxable + cap > 545500 ? 0.2 : 0.15) + stateTax(s.loc.state, cap) : 0;
    const total = fed + state + se + gigSe + y.penalty + capTax;
    const paid = y.withheld + y.est;
    return { wages, gig: y.gig, biz: bizIncome, other: y.other, cap, capTax, donations: don, itemized: itemized > STD_DED + Math.min(1000, don), se: se + gigSe, agi, qbi, taxable, fed, state: state, penalty: y.penalty, total, paid, due: total - paid };
  }

  // Weekly withholding on a W-2 paycheck (income tax + FICA).
  function withholding(s, weeklyWage) {
    const annual = weeklyWage * 52;
    const taxable = Math.max(0, annual - STD_DED);
    const inc = (fedTax(taxable) + stateTax(s.loc.state, Math.max(0, annual - 5000))) / 52;
    const fica = weeklyWage * 0.0765;
    return inc + fica;
  }

  // ---------- Loans ----------
  function makeLoan(o) {
    const weeklyRate = o.rate / 52;
    const pmt = o.interestOnly ? o.amount * weeklyRate : U.payment(o.amount, weeklyRate, o.weeks);
    return {
      id: U.uid('loan'), name: o.name, kind: o.kind || 'loan', acct: o.acct || 'p', bal: o.amount, orig: o.amount,
      rate: o.rate, pmt, weeksLeft: o.weeks, guarantee: !!o.guarantee, interestOnly: !!o.interestOnly, lender: o.lender || '',
      revShare: o.revShare || 0, cap: o.cap || 0, missed: 0,
    };
  }

  // Charge one week of a loan. Returns the payment amount due (caller debits it).
  function loanWeek(l, weeklyRevenue) {
    if (l.bal <= 0.5) return { pay: 0, interest: 0 };
    if (l.revShare) {
      const pay = Math.min(l.bal, weeklyRevenue * l.revShare);
      l.bal -= pay;
      return { pay, interest: 0 };
    }
    const interest = l.bal * l.rate / 52;
    let pay = Math.min(l.pmt, l.bal + interest);
    if (l.interestOnly) pay = interest;
    l.bal = l.bal + interest - pay;
    l.weeksLeft = Math.max(0, l.weeksLeft - 1);
    if (l.weeksLeft === 0 && !l.interestOnly && l.bal > 1) { pay += l.bal; l.bal = 0; }
    return { pay, interest };
  }

  const ccLimitFor = (credit) => credit < 560 ? 300 : Math.round(Math.min(25000, 500 + (credit - 560) * 45) / 100) * 100;
  const prime = (s) => s.econ.rate + 3;

  function creditRate(credit, base, spread) {
    return (base + Math.max(0, 780 - credit) * spread) / 100;
  }

  function annualIncome(s) {
    const p = s.p;
    let w = p.job ? p.job.wage * (p.job.hours || p.schedule.gig) * 52 : 0;
    const recent = s.hist.slice(-12);
    if (s.biz && s.biz.phase === 'open' && recent.length) w += Math.max(0, U.avg(recent, (h) => h.profit)) * 52 * 0.6;
    return w + p.ytd.gig;
  }

  function debtLoad(s) {
    return U.sum(s.p.debts, (d) => d.pmt) * 52 + s.p.ccBal * 0.03 * 12;
  }

  // ---------- Financing marketplace ----------
  // Each option: id, name, who, desc, max, rate, weeks (term), wait, acct, ok, reason, chance
  function options(s) {
    const p = s.p, b = s.biz, t = G.state.tpl(s);
    const out = [];
    const income = annualIncome(s);
    const planDone = b && b.tasks.some((x) => x.id === 'plan' && x.done);
    const pr = prime(s);
    const hasApp = (id) => s.pending.some((x) => x.opt === id) || (s.flags['used_' + id]);
    const fund = (t && t.funding) || [];
    const bizOpenWeeks = b && b.opened != null ? s.week - b.opened : 0;
    const bg = G.BACKGROUNDS.find((x) => x.id === p.bg);

    // Personal
    out.push({ id: 'personal', name: 'Personal loan', who: 'Online lender', acct: 'p', desc: 'Unsecured, fixed rate, five years. Approval depends on credit and income.',
      max: Math.round(Math.min(50000, Math.max(0, income * 0.35 - debtLoad(s) * 0.5)) / 500) * 500, rate: creditRate(p.credit, 7.5, 0.11), weeks: 260, wait: 1,
      ok: p.credit >= 600 && income > 15000, reason: p.credit < 600 ? 'Needs a 600+ credit score' : 'Needs steady income above $15k a year',
      chance: U.clamp(0.55 + (p.credit - 660) / 300 - debtLoad(s) / Math.max(1, income), 0.08, 0.95) });
    if (bg.familyLoan > 0) out.push({ id: 'family', name: 'Loan from family', who: 'Family', acct: 'p', desc: 'Zero interest, paid back over three years. Missing payments strains the relationship.',
      max: bg.familyLoan, rate: 0, weeks: 156, wait: 1, ok: !p.familyLoanUsed, reason: 'You already borrowed from family', chance: 1 });
    if (p.retirement > 1000) out.push({ id: 'k401', name: '401(k) early withdrawal', who: 'Your retirement account', acct: 'p', desc: 'Cash now, but it counts as income at tax time plus a 10% penalty.',
      max: Math.round(p.retirement), rate: 0, weeks: 0, wait: 1, ok: true, chance: 1, withdrawal: true });

    if (!b) return out;
    const injection = b.cash >= 0;
    // Business
    if (fund.includes('micro')) out.push({ id: 'micro', name: 'SBA Microloan', who: 'Nonprofit lender', acct: 'b', desc: 'Up to $50k for new small businesses. Requires a business plan. Personally guaranteed.',
      max: 50000, rate: (pr + 3) / 100, weeks: 312, wait: 5, guarantee: true, ok: planDone && p.credit >= 575, reason: !planDone ? 'Finish your business plan first' : 'Needs a 575+ credit score',
      chance: U.clamp(0.55 + p.skills.finance / 300 + (p.credit - 620) / 400, 0.15, 0.92) });
    if (fund.includes('sba')) {
      const exp = Math.max(p.xp[t.xp] || 0, p.skills.management);
      out.push({ id: 'sba', name: 'SBA 7(a) loan', who: 'Bank (SBA-guaranteed)', acct: 'b', desc: 'The classic small-business loan. 10-year term. Needs a plan, 680+ credit, 10% of the loan already in the business, and relevant experience.',
        max: 750000, rate: (pr + 2.75) / 100, weeks: 520, wait: 8, guarantee: true, fee: 0.03, inject: 0.1,
        ok: planDone && p.credit >= 680 && exp >= 25 && injection, reason: !planDone ? 'Finish your business plan first' : p.credit < 680 ? 'Needs a 680+ credit score' : 'Lenders want 25+ management skill or industry experience',
        chance: U.clamp(0.35 + p.skills.finance / 250 + exp / 250 + (p.credit - 680) / 400 + (p.traits.includes('silver') ? 0.05 : 0), 0.1, 0.9) });
    }
    if (fund.includes('equipment') || t.startup.some((x) => x[2] === 'equip' && x[1] > 20000)) {
      const equip = U.sum(t.startup.filter((x) => x[2] === 'equip'), (x) => x[1]) * G.biz.costIndex(s);
      out.push({ id: 'equipment', name: 'Equipment financing', who: 'Equipment lender', acct: 'b', desc: 'Up to 90% of your equipment cost, secured by the equipment itself. Five years.',
        max: Math.round(equip * 0.9 / 1000) * 1000, rate: creditRate(p.credit, 8.5, 0.06), weeks: 260, wait: 2, guarantee: true,
        ok: p.credit >= 620 && equip > 5000, reason: 'Needs a 620+ credit score', chance: U.clamp(0.6 + (p.credit - 650) / 300, 0.2, 0.95) });
    }
    if (fund.includes('usda')) out.push({ id: 'usda', name: 'USDA FSA beginning farmer loan', who: 'Farm Service Agency', acct: 'b', desc: 'Low-rate federal loans for new farmers and ranchers. Slow paperwork, generous terms.',
      max: 400000, rate: 0.0525, weeks: 364, wait: 10, guarantee: true, ok: planDone && p.credit >= 600, reason: !planDone ? 'Finish your business plan first' : 'Needs a 600+ credit score',
      chance: U.clamp(0.5 + (p.xp.ag || 0) / 150 + p.skills.finance / 300, 0.2, 0.9) });
    if (fund.includes('hardmoney')) out.push({ id: 'hardmoney', name: 'Hard money (per flip)', who: 'Private lender', acct: 'b', desc: 'When you buy a property, borrow up to 85% of the price at 11% interest-only. Repaid when it sells.',
      max: 0, rate: 0.11, ok: true, info: true });
    if (b.entity !== 'none' && b.tasks.some((x) => x.id === 'ein' && x.done)) out.push({ id: 'bizcard', name: 'Business credit card', who: 'Card issuer', acct: 'b', desc: 'Revolving credit at 22% APR. Personally guaranteed. Good for float, terrible for long-term debt.',
      max: Math.round(Math.min(30000, Math.max(2000, (p.credit - 600) * 120)) / 500) * 500, rate: 0.22, weeks: 156, wait: 1, guarantee: true, ok: p.credit >= 640, reason: 'Needs a 640+ credit score', chance: 0.85 });
    if (bizOpenWeeks >= 52) {
      const annRev = U.sum(b.hist.slice(-52), (h) => h.rev);
      out.push({ id: 'loc', name: 'Business line of credit', who: 'Community bank', acct: 'b', desc: 'For businesses with a year of history. Borrow against your revenue.',
        max: Math.round(annRev * 0.12 / 1000) * 1000, rate: (pr + 3) / 100, weeks: 156, wait: 3, guarantee: true, ok: annRev > 100000 && p.credit >= 650, reason: 'Needs $100k+ annual revenue and 650+ credit', chance: U.clamp(0.4 + p.skills.finance / 200, 0.2, 0.9) });
    }
    if (fund.includes('rbf') || (t.online && t.engine === 'traffic')) {
      const monthly = U.sum(b.hist.slice(-4), (h) => h.rev);
      out.push({ id: 'rbf', name: 'Revenue-based financing', who: 'Fintech lender', acct: 'b', desc: 'An advance of about 3x monthly revenue, repaid as 8% of sales until you have paid back 1.12x.',
        max: Math.round(monthly * 3 / 500) * 500, rate: 0, weeks: 0, wait: 1, ok: monthly > 8000, reason: 'Needs $8k+ in monthly online revenue', chance: 0.85, rbf: true });
    }
    // Equity & non-dilutive
    if (fund.includes('crowd')) out.push({ id: 'crowd', name: 'Crowdfunding campaign', who: 'Kickstarter', acct: 'b', desc: 'A 5-week all-or-nothing campaign. Pre-sales, not debt, but you must deliver the product. Uses 15 business hours a week.',
      max: 0, ok: b.phase !== 'closed' && !hasApp('crowd'), reason: 'Campaign already running', campaign: true });
    if (fund.includes('sbir')) out.push({ id: 'sbir', name: 'SBIR Phase I grant', who: 'NSF / NIH', acct: 'b', desc: 'Up to $275k of non-dilutive federal R&D money. About 1 in 6 applications win. Decision in ~20 weeks.',
      max: 275000, wait: 20, ok: (p.skills.science + p.skills.tech) >= 70 && !hasApp('sbir'), reason: s.flags.used_sbir ? 'Already awarded' : 'Needs 70+ combined Science and Tech skill', grant: true,
      chance: U.clamp(0.12 + (p.skills.science + p.skills.tech - 70) / 400 + (b.rnd && b.rnd.ms > 0 ? 0.06 : 0), 0.08, 0.35) });
    out.push({ id: 'localgrant', name: 'Local small-business grant', who: 'City economic development office', acct: 'b', desc: 'A competitive $10k grant for new local businesses. Takes 6 weeks to decide.',
      max: 10000, wait: 6, ok: planDone && !hasApp('localgrant') && !t.online, reason: t.online ? 'Only for businesses with a local presence' : !planDone ? 'Finish your business plan first' : 'Already applied this year', grant: true,
      chance: U.clamp(0.18 + p.skills.creative / 400 + p.network / 300, 0.1, 0.45) });
    if (fund.includes('angel') || fund.includes('vc')) {
      const tr = G.biz.traction(s, b);
      out.push({ id: 'angel', name: 'Angel round', who: 'Local angel investors', acct: 'b', desc: 'Sell 10-20% of the company for $150k-$750k. Requires converting to a Delaware C-corp and a real product.',
        max: 750000, equity: true, wait: 6, ok: tr.angel && p.network >= 15, reason: !tr.angel ? tr.angelWhy : 'Build your network to 15+ to get investor intros', chance: U.clamp(0.25 + p.skills.sales / 250 + p.network / 250 + (p.traits.includes('visionary') ? 0.1 : 0), 0.1, 0.8) });
      if (fund.includes('vc')) out.push({ id: 'vc', name: 'Venture capital round', who: 'VC firm', acct: 'b', desc: 'Millions in exchange for 20-25% and a board seat. Investors expect roughly 3x growth a year.',
        max: tr.round ? tr.round.amount : 0, equity: true, wait: 8, ok: !!tr.round && p.network >= 25, reason: !tr.round ? tr.vcWhy : 'Build your network to 25+ for warm VC intros', chance: U.clamp(0.2 + p.skills.sales / 300 + p.network / 300 + (p.traits.includes('visionary') ? 0.1 : 0), 0.1, 0.7) });
    }
    return out;
  }

  // Start an application. Returns a message.
  function apply(s, optId, amount) {
    const opt = options(s).find((o) => o.id === optId);
    if (!opt || !opt.ok) return 'Not eligible right now.';
    const p = s.p, b = s.biz;
    amount = Math.round(amount || opt.max);
    if (opt.max && amount > opt.max) amount = opt.max;
    if (opt.campaign) {
      s.pending.push({ opt: 'crowd', kind: 'crowd', weeks: 5, amount: 0 });
      G.journal.add(s, 'money', 'You launch a crowdfunding campaign. Five weeks of posting, emailing and refreshing the page.');
      return 'Campaign launched. It runs for 5 weeks and needs about 15 business hours a week.';
    }
    if (opt.withdrawal) {
      amount = Math.min(amount, p.retirement);
      p.retirement -= amount;
      p.cash += amount;
      p.ytd.other += amount;
      p.ytd.penalty += amount * 0.1;
      G.journal.add(s, 'money', `You pull ${U.money(amount)} out of your 401(k). Future-you sighs. It will be taxed in April, plus a 10% penalty.`);
      return `Withdrew ${U.money(amount)}. Expect income tax plus a ${U.money(amount * 0.1)} penalty at tax time.`;
    }
    if (opt.id === 'sba' && b.cash < amount * opt.inject) return `The bank wants ${U.money(amount * opt.inject)} (10%) already in the business account.`;
    if (amount <= 0) return 'Enter an amount.';
    if (!opt.grant && !opt.equity) p.credit = Math.max(300, p.credit - 4); // hard inquiry
    s.pending.push({ opt: opt.id, kind: opt.equity ? 'equity' : opt.grant ? 'grant' : 'loan', weeks: opt.wait || 1, amount, chance: opt.chance, rate: opt.rate, term: opt.weeks, acct: opt.acct, guarantee: !!opt.guarantee, fee: opt.fee || 0, name: opt.name, rbf: !!opt.rbf });
    return `Application sent for ${U.money(amount)}. Decision in about ${opt.wait || 1} week${(opt.wait || 1) > 1 ? 's' : ''}.`;
  }

  // Resolve pending applications. Called once per week.
  function tickPending(s) {
    const p = s.p;
    const keep = [];
    for (const a of s.pending) {
      if (a.kind === 'job' || a.kind === 'listing') { keep.push(a); continue; }
      a.weeks -= 1;
      if (a.kind === 'crowd') {
        if (a.weeks > 0) { keep.push(a); continue; }
        resolveCrowd(s, a);
        continue;
      }
      if (a.weeks > 0) { keep.push(a); continue; }
      const ok = Math.random() < a.chance;
      if (a.opt === 'family' || a.opt === 'k401') {/* instant paths */}
      if (!ok) {
        G.journal.add(s, 'money', `${a.name}: declined.`);
        G.ui && G.ui.toast && G.ui.toast(`${a.name} was declined.`);
        if (a.opt === 'localgrant') s.flags['used_localgrant'] = true;
        continue;
      }
      if (a.kind === 'grant') {
        if (s.biz) s.biz.cash += a.amount;
        if (s.biz) s.biz.grants = (s.biz.grants || 0) + a.amount;
        s.flags['used_' + a.opt] = true;
        G.journal.add(s, 'money', `${a.name} awarded: ${U.money(a.amount)} of non-dilutive money. You read the email four times.`);
        continue;
      }
      if (a.kind === 'equity') { G.biz.closeRound(s, a); continue; }
      const net = a.amount * (1 - (a.fee || 0));
      if (a.rbf) {
        s.biz.cash += a.amount;
        p.debts.push(makeLoan({ name: 'Revenue-based advance', kind: 'rbf', acct: 'b', amount: a.amount * 1.12, rate: 0, weeks: 520, revShare: 0.08 }));
        G.journal.add(s, 'money', `Revenue-based advance funded: ${U.money(a.amount)}. They take 8% of sales until ${U.money(a.amount * 1.12)} is repaid.`);
        continue;
      }
      if (a.opt === 'bizcard') {
        s.biz.cardLimit = a.amount;
        G.journal.add(s, 'money', `Business credit card approved with a ${U.money(a.amount)} limit.`);
        continue;
      }
      const loan = makeLoan({ name: a.name, kind: a.opt, acct: a.acct, amount: a.amount, rate: a.rate, weeks: a.term, guarantee: a.guarantee });
      p.debts.push(loan);
      if (a.acct === 'b' && s.biz) s.biz.cash += net; else p.cash += net;
      if (a.opt === 'family') p.familyLoanUsed = true;
      G.journal.add(s, 'money', `${a.name} approved: ${U.money(a.amount)} at ${(a.rate * 100).toFixed(1)}%${a.fee ? `, minus a ${U.money(a.amount * a.fee)} guarantee fee` : ''}.${a.guarantee ? ' You signed a personal guarantee.' : ''}`);
    }
    s.pending = keep;
  }

  function resolveCrowd(s, a) {
    const p = s.p, b = s.biz;
    if (!b) return;
    const t = G.state.tpl(s);
    const goal = 15000;
    const raised = Math.max(0, (1500 + b.awareness * 300 + p.network * 220 + (b.reviewsCount || 0) * 5) * (0.4 + p.skills.creative / 90) * (0.7 + p.skills.sales / 200) * Math.exp(U.gauss() * 0.45));
    s.flags.used_crowd = true;
    if (raised >= goal) {
      const cogs = t.engine === 'projects' ? 0.25 : (t.cogs || 0.3);
      const net = raised * (1 - 0.08 - cogs);
      b.cash += net;
      b.awareness = Math.min(100, b.awareness + 12);
      G.journal.add(s, 'money', `The crowdfunding campaign closes at ${U.money(raised)} from ${Math.round(raised / 55)} backers. After fees and fulfillment costs you keep about ${U.money(net)}.`);
    } else {
      b.awareness = Math.min(100, b.awareness + 4);
      G.journal.add(s, 'money', `The campaign ends at ${U.money(raised)} of a ${U.money(goal)} goal. All-or-nothing means nothing. At least people heard of you.`);
    }
  }

  // Monthly credit score drift.
  function creditMonth(s) {
    const p = s.p;
    const util = p.ccLimit > 0 ? p.ccBal / p.ccLimit : 0;
    let d = 0;
    if (p.missed > 0) d -= 10;
    else d += 3;
    if (util > 0.7) d -= 6; else if (util > 0.3) d -= 2; else d += 1;
    p.credit = U.clamp(Math.round(p.credit + d), 300, 850);
    p.missed = Math.max(0, p.missed - 1);
    // Card issuers adjust limits occasionally.
    if (Math.random() < 0.12) p.ccLimit = Math.max(p.ccLimit, ccLimitFor(p.credit));
  }

  return { fedTax, stateTax, seTax, marginalFed, computeReturn, withholding, makeLoan, loanWeek, ccLimitFor, creditRate, options, apply, tickPending, creditMonth, annualIncome, STD_DED, prime };
})();
