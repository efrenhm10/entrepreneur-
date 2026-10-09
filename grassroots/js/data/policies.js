// Policy positions. Each policy lists its options from the most progressive (left)
// to the most conservative (right); an option's ideology score runs -2 .. +2.
// lv: where it can be legislated: b = school board, c = city, s = state, n = federal.
// fx: change in metric targets per step to the right (+1 score). Metrics:
//   unemp (pts), growth (pts), income (% of median), poverty (pts), crime (% of rate),
//   uninsured (pts), grad (pts), rent (% of rent), emis (% of emissions), rev (% of revenue).
// bias: where public opinion sits relative to the area's partisan lean (negative = more
// progressive than the area otherwise is). sal: how much voters care (1 = typical).
// fed: index of current federal law; st: how states/cities start (bias added to their lean).
// ideo: 0 for issues that do not split along party lines.
var GR = globalThis.GR || (globalThis.GR = {});

GR.POLICY_CATS = ['Economy', 'Taxes', 'Health', 'Social', 'Guns', 'Immigration', 'Justice', 'Education', 'Environment', 'Housing', 'Elections', 'Defense'];

GR.POLICIES = [
  // ---------- Taxes ----------
  { k: 'incometax', cat: 'Taxes', name: 'Top income tax rate', lv: 'sn', sal: 1.2, bias: -0.3, fed: 3,
    opts: { s: ['12%', '9%', '6.5%', '4%', 'No income tax'], n: ['50%', '45%', '39.6%', '37%', '30%'] },
    rate: { s: [12, 9, 6.5, 4, 0], n: [50, 45, 39.6, 37, 30] }, fx: { growth: 0.12, poverty: 0.25, income: 0.4 } },
  { k: 'corptax', cat: 'Taxes', name: 'Corporate tax rate', lv: 'sn', sal: 0.8, bias: -0.4, fed: 2,
    opts: { s: ['10%', '8%', '6%', '4%', 'None'], n: ['35%', '28%', '21%', '18%', '15%'] },
    rate: { s: [10, 8, 6, 4, 0], n: [35, 28, 21, 18, 15] }, fx: { growth: 0.1, unemp: -0.05 } },
  { k: 'capgains', cat: 'Taxes', name: 'Capital gains tax', lv: 'n', sal: 0.6, bias: -0.2, fed: 2,
    opts: ['Taxed as ordinary income', '28% top rate', '20% top rate (current)', '15% flat', 'Eliminated'], fx: { growth: 0.05, rev: -1 } },
  { k: 'estatetax', cat: 'Taxes', name: 'Estate tax', lv: 'sn', sal: 0.5, bias: 0.2, fed: 2,
    opts: ['55% over $1M', '45% over $3.5M', '40% over ~$14M', '20% over $25M', 'Abolished'], fx: { rev: -0.6 } },
  { k: 'propertytax', cat: 'Taxes', name: 'Property tax relief', lv: 'cs', sal: 0.9, bias: 0.3, fed: 2,
    opts: ['Raise levies for services', 'Homestead credits for low incomes', 'Current assessments', 'Assessment caps', 'Hard levy freeze'],
    fx: { rev: -2.5 } },
  // ---------- Economy ----------
  { k: 'minwage', cat: 'Economy', name: 'Minimum wage', lv: 'csn', sal: 1.1, bias: -0.5, fed: 4,
    opts: ['$20/hr', '$17/hr', '$15/hr', '$12/hr', '$7.25/hr (federal floor)'], fx: { unemp: -0.1, income: -1, poverty: 0.4 } },
  { k: 'unions', cat: 'Economy', name: 'Labor unions', lv: 'sn', sal: 0.8, bias: -0.1, fed: 2,
    opts: ['Card-check recognition, sectoral bargaining', 'Strengthen collective bargaining', 'Current law', 'Right-to-work', 'Right-to-work, end public-sector bargaining'],
    fx: { growth: 0.04, income: -0.8 } },
  { k: 'paidleave', cat: 'Economy', name: 'Paid family leave', lv: 'sn', sal: 0.8, bias: -0.5, fed: 3,
    opts: ['16 weeks paid', '12 weeks paid', '6 weeks paid', 'Unpaid leave only (FMLA)', 'No mandate'], fx: { poverty: 0.15 } },
  { k: 'gig', cat: 'Economy', name: 'Gig workers', lv: 'sn', sal: 0.4, bias: 0, fed: 3,
    opts: ['Employees with full benefits', 'Employees unless truly independent', 'Portable benefits fund', 'Contractors with pay floor', 'Independent contractors'],
    fx: { unemp: -0.03, uninsured: 0.15 } },
  { k: 'welfare', cat: 'Economy', name: 'Safety-net work requirements', lv: 'sn', sal: 0.8, bias: 0.3, fed: 2,
    opts: ['Expand benefits, no requirements', 'Modest requirements, more aid', 'Current law', 'Strict work requirements', 'Block grants with time limits'],
    fx: { poverty: 0.5, unemp: -0.05 } },
  { k: 'socsec', cat: 'Economy', name: 'Social Security', lv: 'n', sal: 1.1, bias: -0.4, fed: 2,
    opts: ['Expand benefits, lift payroll cap', 'Lift payroll cap', 'Keep as is', 'Raise retirement age', 'Personal accounts'], fx: { poverty: 0.35 } },
  { k: 'trade', cat: 'Economy', name: 'Tariffs and trade', lv: 'n', sal: 0.7, bias: 0, fed: 3,
    opts: ['Free trade agreements', 'Low tariffs, labor standards', 'Targeted tariffs on rivals', 'Broad tariffs', 'High universal tariffs'],
    fx: { growth: -0.08, unemp: 0.02, rev: 0.6 } },
  // ---------- Health ----------
  { k: 'healthsys', cat: 'Health', name: 'Health care system', lv: 'sn', sal: 1.3, bias: -0.1, fed: 2,
    opts: ['Single-payer', 'Public option', 'Strengthen the ACA', 'Market-based reforms', 'Repeal the ACA'], fx: { uninsured: 2.2 } },
  { k: 'medicaid', cat: 'Health', name: 'Medicaid eligibility', lv: 's', sal: 0.9, bias: -0.3, fed: 2,
    opts: ['Cover all low-income residents', 'Full ACA expansion', 'Expansion with work rules', 'No expansion', 'Cut eligibility'], fx: { uninsured: 1.4, poverty: 0.2 } },
  { k: 'drugprices', cat: 'Health', name: 'Prescription drug prices', lv: 'sn', sal: 0.9, bias: -0.7, fed: 2,
    opts: ['Price caps on all drugs', 'Negotiate prices for all drugs', 'Negotiate for some drugs', 'Market pricing', 'Deregulate and fast-track approvals'], fx: { uninsured: 0.2 } },
  { k: 'abortion', cat: 'Health', name: 'Abortion', lv: 'sn', sal: 1.4, bias: -0.3, fed: 2,
    opts: ['Legal through viability, codified', 'Legal with few limits', '15-week limit', '6-week limit', 'Near-total ban'], fx: {} },
  { k: 'vaccines', cat: 'Health', name: 'Vaccine requirements', lv: 'bsn', sal: 0.5, bias: 0.2, fed: 2,
    opts: ['Required for school and work', 'Required for school, few exemptions', 'Required for school, easy exemptions', 'Optional', 'Ban mandates'], fx: {} },
  // ---------- Social ----------
  { k: 'marijuana', cat: 'Social', name: 'Marijuana', lv: 'sn', sal: 0.7, bias: -0.7, fed: 3,
    opts: ['Legal, records expunged', 'Legal for adults', 'Decriminalized', 'Medical only', 'Illegal'], fx: { rev: -0.4 } },
  { k: 'deathpenalty', cat: 'Social', name: 'Death penalty', lv: 'sn', sal: 0.5, bias: 0.2, fed: 3,
    opts: ['Abolished', 'Moratorium', 'Rarely used', 'Current law', 'Expanded'], fx: {} },
  { k: 'lgbt', cat: 'Social', name: 'Transgender policy', lv: 'bsn', sal: 0.8, bias: 0.3, fed: 2,
    opts: ['Full protections, including care for minors', 'Anti-discrimination protections', 'Current law', 'Restrict care for minors', 'Broad restrictions'], fx: {} },
  { k: 'religion', cat: 'Social', name: 'Religion in public schools', lv: 'bs', sal: 0.5, bias: 0.1, fed: 2,
    opts: ['Strict separation', 'Elective courses only', 'Current law', 'Allow posted Ten Commandments', 'Teacher-led prayer allowed'], fx: {} },
  { k: 'gambling', cat: 'Social', name: 'Sports betting & gambling', lv: 'sn', sal: 0.3, bias: 0, ideo: 0, fed: 2,
    opts: ['Legal everywhere, online', 'Legal at venues and online', 'Venues only', 'Tribal casinos only', 'Banned'], fx: { rev: -0.4 } },
  // ---------- Guns ----------
  { k: 'assaultweapons', cat: 'Guns', name: 'Assault-style weapons', lv: 'sn', sal: 1.1, bias: 0, fed: 3,
    opts: ['Ban with buyback', 'Ban new sales', 'Raise purchase age to 21', 'Current law', 'Repeal restrictions'], fx: { crime: 0.6 } },
  { k: 'carry', cat: 'Guns', name: 'Concealed carry', lv: 'sn', sal: 0.9, bias: 0.1, fed: 2,
    opts: ['Strict may-issue permits', 'Shall-issue with training', 'Shall-issue permits', 'Permitless carry', 'Permitless carry, national reciprocity'], fx: { crime: 0.4 } },
  { k: 'background', cat: 'Guns', name: 'Background checks', lv: 'sn', sal: 0.8, bias: -0.8, fed: 3,
    opts: ['Universal checks + licensing', 'Universal checks + red-flag law', 'Universal checks', 'Dealer sales only', 'Loosen checks'], fx: { crime: 0.5 } },
  // ---------- Immigration ----------
  { k: 'citizenship', cat: 'Immigration', name: 'Undocumented immigrants', lv: 'n', sal: 1.1, bias: 0.1, fed: 3,
    opts: ['Citizenship for most', 'Path for long-term residents', 'Protect DACA recipients', 'No legal status', 'Mass deportation'], fx: { growth: -0.06 } },
  { k: 'border', cat: 'Immigration', name: 'Border security', lv: 'n', sal: 1.1, bias: 0.4, fed: 3,
    opts: ['Reduce enforcement', 'Current enforcement', 'More agents and technology', 'Finish the border wall', 'Deploy the military'], fx: {} },
  { k: 'sanctuary', cat: 'Immigration', name: 'Cooperation with ICE', lv: 'csn', sal: 0.8, bias: 0.4, fed: 3,
    opts: ['Sanctuary: no cooperation', 'Limited cooperation', 'Case by case', 'Full cooperation', 'Mandatory cooperation with penalties'], fx: {} },
  { k: 'legalimm', cat: 'Immigration', name: 'Legal immigration levels', lv: 'n', sal: 0.6, bias: 0.2, fed: 2,
    opts: ['Increase greatly', 'Increase', 'Keep current', 'Reduce', 'Reduce greatly'], fx: { growth: -0.08 } },
  // ---------- Justice ----------
  { k: 'police', cat: 'Justice', name: 'Policing', lv: 'cs', sal: 1.0, bias: 0.3, fed: 2,
    opts: ['Shift funds to social services', 'Civilian responders, oversight boards', 'Current approach', 'Hire more officers', 'Major expansion, aggressive enforcement'], fx: { crime: -2.5 } },
  { k: 'bail', cat: 'Justice', name: 'Cash bail', lv: 'sn', sal: 0.8, bias: 0.4, fed: 2,
    opts: ['Abolish cash bail', 'Limit cash bail', 'Current law', 'Stricter bail', 'Mandatory detention for violent charges'], fx: { crime: -1.5 } },
  { k: 'sentencing', cat: 'Justice', name: 'Sentencing', lv: 'sn', sal: 0.7, bias: 0.1, fed: 2,
    opts: ['End mandatory minimums', 'Reduce minimums', 'Current law', 'Longer sentences', 'Three-strikes laws'], fx: { crime: -1.2 } },
  { k: 'prisons', cat: 'Justice', name: 'Private prisons', lv: 'sn', sal: 0.4, bias: -0.2, fed: 2,
    opts: ['Banned', 'Phased out', 'Current use', 'Expanded', 'Most prisons privatized'], fx: {} },
  // ---------- Education ----------
  { k: 'schoolchoice', cat: 'Education', name: 'School choice', lv: 'bs', sal: 1.0, bias: 0.1, fed: 2,
    opts: ['Limit charters, no vouchers', 'Cap new charters', 'Current charters', 'Voucher program', 'Universal education savings accounts'], fx: { grad: 0.1, rev: -0.8 } },
  { k: 'curriculum', cat: 'Education', name: 'Curriculum standards', lv: 'bs', sal: 0.9, bias: 0.2, fed: 2,
    opts: ['Inclusive curriculum mandates', 'Statewide diversity standards', 'Local control', 'Parental review rights', 'Strict content restrictions'], fx: {} },
  { k: 'teacherpay', cat: 'Education', name: 'Teacher pay', lv: 'bs', sal: 0.9, bias: -0.5, fed: 2,
    opts: ['Raise 15%', 'Raise 8%', 'Cost-of-living raises', 'Freeze', 'Merit pay only'], fx: { grad: -0.5, rev: 0.6 } },
  { k: 'phones', cat: 'Education', name: 'Phones in schools', lv: 'bs', sal: 0.5, bias: 0.4, ideo: 0, fed: 1,
    opts: ['Allowed', 'Teacher discretion', 'Off during class', 'Locked away all day', 'Banned from campus'], fx: { grad: 0.25 } },
  { k: 'schoolstart', cat: 'Education', name: 'School start times', lv: 'b', sal: 0.3, bias: 0, ideo: 0, fed: 2,
    opts: ['High school starts 9:00', 'Starts 8:30', 'Starts 8:00', 'Starts 7:30', 'Starts 7:15'], fx: { grad: -0.15 } },
  { k: 'freecollege', cat: 'Education', name: 'Public college tuition', lv: 'sn', sal: 0.8, bias: -0.2, fed: 3,
    opts: ['Free public college', 'Free community college', 'Expanded grants', 'Current aid', 'Cut subsidies'], fx: { income: 0.2, rev: 0.6 } },
  { k: 'studentdebt', cat: 'Education', name: 'Student debt', lv: 'n', sal: 0.7, bias: 0.3, fed: 3,
    opts: ['Cancel all federal debt', 'Cancel up to $50k', 'Income-driven forgiveness', 'Current repayment', 'End federal student loans'], fx: {} },
  // ---------- Environment ----------
  { k: 'carbon', cat: 'Environment', name: 'Carbon pricing', lv: 'sn', sal: 0.8, bias: 0, fed: 3,
    opts: ['Carbon tax, $100/ton', 'Cap-and-trade', 'Clean-energy tax credits', 'No carbon pricing', 'Roll back environmental rules'], fx: { emis: 5, growth: 0.03 } },
  { k: 'renewables', cat: 'Environment', name: 'Clean electricity', lv: 'sn', sal: 0.7, bias: -0.3, fed: 3,
    opts: ['100% clean by 2035', '100% clean by 2050', '50% clean by 2040', 'Voluntary goals', 'Favor fossil fuels'], fx: { emis: 4 } },
  { k: 'drilling', cat: 'Environment', name: 'Oil, gas and fracking', lv: 'sn', sal: 0.7, bias: 0.1, fed: 3,
    opts: ['Ban fracking', 'No new leases', 'Regulate current drilling', 'Expand drilling', 'Open federal lands and offshore'], fx: { emis: 2, growth: 0.05, unemp: -0.03 } },
  { k: 'evs', cat: 'Environment', name: 'Electric vehicles', lv: 'sn', sal: 0.5, bias: 0.3, fed: 3,
    opts: ['Phase out gas car sales by 2035', 'Large EV subsidies', 'Modest EV credits', 'No incentives', 'Extra fee on EVs'], fx: { emis: 1.5 } },
  // ---------- Housing & transport ----------
  { k: 'rent', cat: 'Housing', name: 'Rent regulation', lv: 'cs', sal: 0.8, bias: -0.2, fed: 3,
    opts: ['Strict rent control', 'Rent stabilization', 'Tenant protections only', 'No rent rules', 'Ban local rent control'], fx: { rent: 0.8 } },
  { k: 'zoning', cat: 'Housing', name: 'Zoning', lv: 'cs', sal: 0.7, bias: 0.3, ideo: 0.4, fed: 2,
    opts: ['End single-family-only zoning', 'Upzone near transit', 'Modest reforms', 'Preserve neighborhoods', 'Strict growth limits'], fx: { rent: 2.5 } },
  { k: 'transit', cat: 'Housing', name: 'Public transit', lv: 'csn', sal: 0.6, bias: 0, fed: 2,
    opts: ['Fare-free, major expansion', 'Expand service', 'Maintain service', 'Roads first', 'Cut transit funding'], fx: { emis: 1.2, growth: -0.02, rev: 0.4 } },
  // ---------- Elections & government ----------
  { k: 'voterid', cat: 'Elections', name: 'Voter ID', lv: 'sn', sal: 0.8, bias: 0.6, fed: 2,
    opts: ['Automatic registration, no ID', 'Same-day registration, ID optional', 'Any ID or signature', 'Strict photo ID', 'Photo ID + proof of citizenship'], fx: {} },
  { k: 'mailvote', cat: 'Elections', name: 'Mail-in voting', lv: 'sn', sal: 0.6, bias: 0, fed: 1,
    opts: ['All-mail elections', 'No-excuse mail voting', 'Excuse required', 'Limited absentee voting', 'In person only'], fx: {} },
  { k: 'campfinance', cat: 'Elections', name: 'Campaign finance', lv: 'csn', sal: 0.5, bias: -0.6, fed: 3,
    opts: ['Public financing, strict limits', 'Lower limits, full disclosure', 'Disclosure rules', 'Current law', 'No contribution limits'], fx: {} },
  { k: 'termlimits', cat: 'Elections', name: 'Legislative term limits', lv: 'csn', sal: 0.4, bias: -0.2, ideo: 0, fed: 4,
    opts: ['Strict term limits (6 years)', '12-year limits', '16-year limits', 'Voters decide', 'No term limits'], fx: {} },
  // ---------- Defense & foreign policy ----------
  { k: 'defense', cat: 'Defense', name: 'Defense spending', lv: 'n', sal: 0.8, bias: 0, fed: 2,
    opts: ['Cut 20%', 'Cut 10%', 'Hold flat', 'Increase 5%', 'Increase 15%'], fx: {} },
  { k: 'foreignaid', cat: 'Defense', name: 'Foreign aid', lv: 'n', sal: 0.5, bias: 0.4, fed: 2,
    opts: ['Increase', 'Maintain', 'Cut 25%', 'Cut 50%', 'Eliminate'], fx: {} },
  { k: 'alliances', cat: 'Defense', name: 'Alliances', lv: 'n', sal: 0.6, bias: -0.2, fed: 2,
    opts: ['Deepen alliances and treaties', 'Keep current commitments', 'Demand burden-sharing', 'Reduce commitments', 'Withdraw from alliances'], fx: {} },
];

GR.POLICY = {};
GR.POLICIES.forEach((p) => {
  GR.POLICY[p.k] = p;
  if (p.ideo == null) p.ideo = 1;
});

GR.policyOpts = (p, lvl) => (Array.isArray(p.opts) ? p.opts : (p.opts[lvl] || p.opts.s || p.opts.n));
GR.optScore = (p, idx, lvl) => { const n = GR.policyOpts(p, lvl).length; return -2 + (4 * idx) / (n - 1); };
GR.scoreToIdx = (p, score, lvl) => { const n = GR.policyOpts(p, lvl).length; return Math.max(0, Math.min(n - 1, Math.round(((score + 2) * (n - 1)) / 4))); };
// Level code for a jurisdiction kind.
GR.lvlOf = (jur) => ({ city: 'c', school: 'b', state: 's', nation: 'n' }[jur]);
GR.policiesFor = (jur) => GR.POLICIES.filter((p) => p.lv.includes(GR.lvlOf(jur)));
