// Philanthropy: direct gifts, a private foundation, community standing and impact.
var G = globalThis.G || (globalThis.G = {});

G.give = (function () {
  const U = G.util;
  const M = (n) => U.money(n);

  // cost: dollars per unit of impact (rough real-world rates).
  const CAUSES = [
    { id: 'food', name: 'Local food bank', unit: 'meals', cost: 0.1, blurb: 'Food banks turn every dollar into about ten meals.' },
    { id: 'micro', name: 'Microgrants for new founders', unit: 'local businesses funded', cost: 5000, blurb: 'Pay it forward: $5,000 grants to people starting out where you did.', founders: true },
    { id: 'scholar', name: 'College scholarships', unit: 'full scholarships', cost: 22000, blurb: 'First-generation students at in-state public universities.' },
    { id: 'housing', name: 'Affordable housing', unit: 'families housed', cost: 65000, blurb: 'Gap financing for nonprofit housing developers.' },
    { id: 'health', name: 'Medical research', unit: 'research grants', cost: 250000, blurb: 'Early-career scientists working on rare diseases.' },
    { id: 'climate', name: 'Reforestation & climate', unit: 'trees planted', cost: 1.2, blurb: 'Native trees in burned and logged land.' },
    { id: 'arts', name: 'Arts & music education', unit: 'students reached', cost: 160, blurb: 'Instruments and teachers in public schools.' },
    { id: 'animals', name: 'Animal shelter', unit: 'animals adopted', cost: 420, blurb: 'Care, vet bills and adoption events.' },
    { id: 'disaster', name: 'Disaster relief', unit: 'families helped', cost: 1500, blurb: 'Emergency cash and rebuilding after storms, fires and floods.' },
  ];
  const byId = {};
  CAUSES.forEach((c) => { byId[c.id] = c; });

  function ensure(s) {
    if (!s.phil) s.phil = { given: 0, causes: {}, standing: 0, foundation: null, gifts: [], board: false, named: [] };
    if (s.p.ytd.donations == null) s.p.ytd.donations = 0;
  }

  function impactText(c, dollars) {
    const n = dollars / c.cost;
    return `${U.num(n, n < 10 ? 1 : 0)} ${c.unit}`;
  }

  // Standing rises with generosity relative to your means, and with consistency.
  function bump(s, amount) {
    const ph = s.phil;
    const nw = Math.max(50000, G.state.netWorth(s));
    ph.standing = U.clamp(ph.standing + Math.min(25, 4 * Math.log10(1 + amount / 500) + amount / nw * 40), 0, 100);
    s.p.happiness = U.clamp(s.p.happiness + Math.min(12, 2 + Math.log10(1 + amount) * 1.5), 0, 100);
    s.p.stress = Math.max(0, s.p.stress - Math.min(6, Math.log10(1 + amount)));
    s.p.network = Math.min(100, s.p.network + Math.min(8, amount / 50000));
  }

  function credit(s, causeId, amount) {
    const ph = s.phil;
    ph.causes[causeId] = (ph.causes[causeId] || 0) + amount;
    ph.given += amount;
    if (byId[causeId].founders) s.stats.jobsCreated += Math.floor(amount / 5000 * 1.5);
  }

  function donate(s, causeId, amount, honoree) {
    ensure(s);
    const c = byId[causeId];
    amount = Math.round(amount);
    if (!c || !(amount > 0)) return 'Pick a cause and an amount.';
    if (s.p.cash < amount) return 'You do not have that much in your personal account.';
    s.p.cash -= amount;
    s.p.ytd.donations += amount;
    credit(s, causeId, amount);
    bump(s, amount);
    s.phil.gifts.push({ w: s.week, cause: causeId, amount });
    if (s.phil.gifts.length > 200) s.phil.gifts.shift();
    let extra = '';
    if (amount >= 1e6) {
      const thing = { scholar: 'Scholars Program', health: 'Research Fellowship', housing: 'Commons', arts: 'Music Hall', food: 'Community Pantry', micro: 'Founders Fund', climate: 'Forest', animals: 'Adoption Center', disaster: 'Relief Fund' }[causeId];
      const label = `The ${honoree || s.p.name.split(' ').slice(-1)[0]} ${thing}`;
      s.phil.named.push(label);
      extra = ` They will call it ${label}.`;
      if (s.biz) s.biz.awareness = Math.min(100, s.biz.awareness + 10);
    } else if (amount >= 25000 && s.biz && !G.state.tpl(s).online) s.biz.awareness = Math.min(100, s.biz.awareness + 2);
    G.journal.add(s, 'life', `You give ${M(amount)} to ${c.name.toLowerCase()}: about ${impactText(c, amount)}.${extra}`);
    if (s.phil.given >= 100000 && !s.phil.board && !s.eventQueue.some((e) => e.id === 'boardseat')) s.eventQueue.push({ id: 'boardseat' });
    return `Thank you. That is about ${impactText(c, amount)}.${extra}`;
  }

  // ---------- Foundation ----------
  const FOUNDATION_MIN = 250000;
  function createFoundation(s, name, causeId, amount) {
    ensure(s);
    if (s.phil.foundation) return 'You already have a foundation.';
    amount = Math.round(amount);
    const legal = 15000;
    if (amount < FOUNDATION_MIN) return `A private foundation needs at least ${M(FOUNDATION_MIN)} to be worth the overhead.`;
    if (s.p.cash < amount + legal) return `You need ${M(amount + legal)} (endowment plus about ${M(legal)} in legal and IRS filing costs).`;
    s.p.cash -= amount + legal;
    s.p.ytd.donations += amount;
    s.phil.foundation = { name: name || `The ${s.p.name.split(' ').slice(-1)[0]} Family Foundation`, cause: causeId, endowment: amount, granted: 0, created: s.week, contributed: amount };
    bump(s, amount);
    G.journal.add(s, 'life', `${s.phil.foundation.name} is born, with ${M(amount)} in the endowment. By law it must give away at least 5% a year, forever.`);
    return null;
  }

  function fund(s, amount) {
    ensure(s);
    const f = s.phil.foundation;
    amount = Math.round(amount);
    if (!f || !(amount > 0)) return 'Enter an amount.';
    if (s.p.cash < amount) return 'Not enough cash.';
    s.p.cash -= amount;
    s.p.ytd.donations += amount;
    f.endowment += amount;
    f.contributed += amount;
    bump(s, amount * 0.6);
    G.journal.add(s, 'life', `You add ${M(amount)} to ${f.name}.`);
    return null;
  }

  function week(s, r) {
    ensure(s);
    const ph = s.phil;
    ph.standing = Math.max(0, ph.standing - ph.standing * 0.002);
    const f = ph.foundation;
    if (!f) return;
    // A balanced endowment: ~6.5% a year in good times, losses in recessions.
    const drift = { expansion: 0.075, slowdown: 0.03, recession: -0.12, recovery: 0.1 }[s.econ.phase];
    f.endowment *= 1 + drift / 52 + U.gauss() * 0.012;
    // 5% minimum distribution, paid out weekly.
    const grant = f.endowment * (f.rate || 0.05) / 52;
    f.endowment -= grant;
    f.granted += grant;
    credit(s, f.cause, grant);
    ph.standing = Math.min(100, ph.standing + Math.min(0.4, grant / 20000));
    r.grants = grant;
  }

  function summary(s) {
    ensure(s);
    return CAUSES.filter((c) => s.phil.causes[c.id] > 0).map((c) => ({ c, dollars: s.phil.causes[c.id], text: impactText(c, s.phil.causes[c.id]) }));
  }

  return { CAUSES, byId, ensure, donate, createFoundation, fund, week, summary, impactText, FOUNDATION_MIN };
})();
