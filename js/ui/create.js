// Title screen and character creation.
var G = globalThis.G || (globalThis.G = {});

G.uiTitle = (function () {
  const U = G.util, esc = U.esc, ui = G.ui;
  const RULES = [
    ['You have 168 hours a week.', 'Sleep, your day job, your commute, your family and your business all compete for them. Burn out and you lose weeks.'],
    ['Where you live changes everything.', 'All 50 states and DC, with real income tax, minimum wage, LLC fees, Medicaid rules, climate and disasters.'],
    ['Build anything.', '59 business types on five different engines, from cafes and cattle ranches to biotech labs and publishing houses, or design your own.'],
    ['Money is not one number.', 'Personal and business accounts, credit scores, SBA loans, investors, quarterly taxes, and personal guarantees that follow you home.'],
  ];
  function render() {
    const meta = G.state.meta('auto');
    const slots = [1, 2, 3].map((n) => ({ n, m: G.state.meta('slot' + n) }));
    const hof = G.state.hallOfFame();
    return `<div class="title-wrap">
      <div class="stack" style="gap:18px">
        <div class="sign title-sign">
          <span class="exit">EXIT 1 · YOUR OWN BOSS</span>
          <h1>Self Made</h1>
          <p>Build a person, pick a town anywhere in the United States, and try to turn an idea into a living. Work the day job, save, borrow, launch, survive.</p>
        </div>
        <div class="rules">${RULES.map((r, i) => `<div class="rule"><span class="mile">${i + 1}</span><div><b>${esc(r[0])}</b><div class="muted small">${esc(r[1])}</div></div></div>`).join('')}</div>
      </div>
      <div class="stack">
        <div class="card stack">
          <h3>Start</h3>
          ${meta ? `<button class="btn btn-go btn-big" data-act="continue" style="justify-content:space-between;width:100%"><span>Continue: ${esc(meta.name)}</span><span class="small" style="font-weight:600;opacity:.85">${esc(meta.city)}, ${esc(meta.state)} · ${esc(U.fmtDate(meta.week))}</span></button>` : ''}
          <button class="btn ${meta ? '' : 'btn-go'} btn-big" data-act="newGame" style="width:100%;justify-content:center">New life</button>
          <button class="btn btn-ghost btn-s" data-act="quickStart" style="align-self:center">Quick start with a random character</button>
        </div>
        <div class="card stack">
          <div class="card-head" style="margin:0"><h3>Saved games</h3><button class="btn btn-ghost btn-s" data-act="importOpen">Import</button></div>
          <div class="saves">${slots.map(({ n, m }) => m ? `<div class="row between"><div class="grow"><b>${esc(m.name)}</b> <span class="muted small">${esc(m.city)}, ${esc(m.state)} · ${esc(U.fmtDate(m.week))}${m.biz ? ' · ' + esc(m.biz) : ''}</span></div><button class="btn btn-s" data-act="loadSlot" data-a="slot${n}">Load</button></div>` : `<div class="faint small">Slot ${n} is empty</div>`).join('')}</div>
        </div>
        ${hof.length ? `<div class="card stack"><h3>Hall of fame</h3>${hof.slice(0, 6).map((h, i) => `<div class="row between small"><span><b>${i + 1}.</b> ${esc(h.name)} <span class="muted">· ${esc(h.title)} · ${esc(h.city)}</span></span><span class="num">${U.num(h.score)}</span></div>`).join('')}</div>` : ''}
      </div>
    </div>`;
  }
  ui.on('continue', () => { const s = G.state.load('auto'); if (s) { ui.s = s; ui.go('game', 'overview'); } return false; });
  ui.on('loadSlot', (el, a) => { const s = G.state.load(a); if (s) { ui.s = s; G.state.save(s, 'auto'); ui.go('game', 'overview'); } return false; });
  ui.on('newGame', () => { G.uiCreate.reset(); ui.go('create'); return false; });
  ui.on('quickStart', () => {
    G.uiCreate.reset(true);
    G.uiCreate.start();
    return false;
  });
  ui.on('importOpen', () => {
    ui.openModal({ html: () => `<div class="overlay"><div class="modal"><div class="modal-top"><h3>Import a saved game</h3><p class="muted small">Paste the save text you exported from the Money tab.</p></div>
      <div class="modal-body"><textarea id="import-text" class="input" rows="8" spellcheck="false"></textarea></div>
      <div class="modal-foot"><button class="btn" data-act="closeModal">Cancel</button><button class="btn btn-go" data-act="importDo">Import</button></div></div></div>` });
    return false;
  });
  ui.on('importDo', () => {
    try {
      const s = G.state.migrate(JSON.parse(document.getElementById('import-text').value));
      if (!s || !s.p || !s.loc) throw new Error('bad');
      ui.s = s; ui.modal = null; G.state.save(s, 'auto'); ui.go('game', 'overview');
    } catch (e) { ui.toast('That does not look like a Self Made save.'); }
    return false;
  });
  ui.on('closeModal', () => { ui.modal = null; });
  return { render };
})();

G.uiCreate = (function () {
  const U = G.util, esc = U.esc, ui = G.ui;
  const STEPS = ['You', 'Education', 'Skills & traits', 'Life', 'Location', 'The dream', 'Day job', 'Review'];
  let c;

  function reset(random) {
    const st = random ? U.pick(G.STATES) : G.loc.state('TX');
    c = {
      step: 0, maxStep: 0, name: G.randName(), pronouns: 'they', age: random ? U.randInt(22, 45) : 27,
      bg: random ? U.pick(G.BACKGROUNDS.filter((b) => !b.minAge)).id : 'middle', edu: random ? U.pick(['hs', 'trade', 'assoc', 'bach', 'bach', 'master']) : 'bach', major: 'business',
      alloc: {}, traits: random ? U.shuffle(G.TRAITS).slice(0, 2).map((t) => t.id) : [], flaw: null, xpChoice: 'food',
      relationship: random ? U.pick(['single', 'single', 'partner', 'married']) : 'single', kids: 0, hasCar: true, why: random ? U.pick(G.WHYS).id : 'freedom',
      state: st.ab, city: random ? U.pick(st.cities)[0] : 'Austin', customCity: false, customName: '', customSize: 'town',
      ideaId: random ? U.pick(G.BIZ_LIST).id : null, bizCat: 'food', custom: null, jobId: null,
      cf: { name: '', what: '', model: 'walkin', cat: 'services', price: 40, margin: 0.6, space: 'home', budget: 20000, skills: ['sales', 'craft'], license: false },
    };
    if (random) {
      c.major = U.pick(G.MAJORS).id;
      // Spend skill points on what the business needs.
      const t = G.BIZ[c.ideaId];
      let pool = G.state.pointPool(c);
      const keys = Object.keys(t.keys);
      while (pool > 0) { const k = U.pick(keys); c.alloc[k] = (c.alloc[k] || 0) + 1; pool--; }
      const jobs = availableJobs().filter((j) => !G.JOBS.find((x) => x.id === j).flex);
      c.jobId = jobs.length ? U.pick(jobs) : 'gig';
    }
  }

  function draftPlayer() {
    const skills = G.state.baseSkills(c);
    Object.entries(c.alloc).forEach(([k, v]) => { skills[k] += v; });
    const edu = G.EDUCATION.find((e) => e.id === c.edu);
    return { skills, edu: c.edu, creds: (edu.creds || []).slice(), transport: c.hasCar ? 'car' : 'transit' };
  }
  function draftLoc() {
    return G.loc.make(c.state, c.customCity ? (c.customName || 'Hometown') : c.city, c.customCity ? { size: c.customSize } : null);
  }
  function availableJobs() {
    const p = draftPlayer();
    return G.JOBS.filter((j) => G.jobs.qualifies(p, j)).map((j) => j.id);
  }
  function currentTpl() {
    if (c.ideaId === 'custom') return G.biz.buildCustom(c.cf);
    return c.ideaId ? G.BIZ[c.ideaId] : null;
  }

  // Rough startup estimate for a business in a location.
  function estimate(t, L) {
    const ci = Math.pow(L.col / 100, 0.35);
    let total = U.sum(t.startup, (x) => x[1]) * ci + U.sum(t.licenses, (x) => x[1]) * ci;
    let rentMo = 0;
    if (t.space) { rentMo = t.space.sqft * G.loc.commercialRent(L, t.space.type === 'residential' ? 'retail' : t.space.type) / 12; total += rentMo * 3; }
    if (t.harvest) total += t.harvest.unitCost * t.harvest.units0 * ci;
    total += G.loc.state(L.state).llc;
    return { total, rentMo };
  }

  const ENGINE_LABEL = { traffic: 'Customers', subscription: 'Recurring revenue', projects: 'Releases', harvest: 'Harvests', rnd: 'Research' };

  // ---------- Steps ----------
  function stepYou() {
    const bgs = G.BACKGROUNDS;
    return `<div class="page-head"><div><h2>Who are you?</h2><p>Your origin story sets your starting money, credit, skills and safety net.</p></div></div>
    <div class="card grid g3">
      <label class="field"><span class="label">Name</span><input id="c-name" class="input" data-in="cSet" data-a="name" value="${esc(c.name)}" maxlength="40"></label>
      <div class="field"><span class="label">Pronouns</span><div class="seg">${Object.keys(G.PRONOUNS).map((k) => `<button data-act="cSet" data-a="pronouns:${k}" aria-pressed="${c.pronouns === k}">${k}/${G.PRONOUNS[k].obj}</button>`).join('')}</div></div>
      <label class="field"><span class="label">Age: <b class="num" id="age-v">${c.age}</b></span><input id="c-age" type="range" min="18" max="65" value="${c.age}" data-in="cAge"></label>
    </div>
    <div class="grid g2">${bgs.map((b) => {
      const off = b.minAge && c.age < b.minAge;
      return `<button class="tile" data-act="cSet" data-a="bg:${b.id}" aria-pressed="${c.bg === b.id}" ${off ? 'disabled' : ''}>
        <div class="row between"><b>${esc(b.name)}</b><span class="num small">${U.money(b.cash)}</span></div>
        <span class="small">${esc(b.blurb)}</span>
        <span class="tiny" style="color:var(--road)">${esc(b.perk)}${off ? ` (age ${b.minAge}+)` : ''}</span>
        <span class="tiny faint">Credit ${b.credit}${b.ccDebt ? ` · ${U.money(b.ccDebt)} card debt` : ''}${b.familyLoan ? ` · family can lend ${U.money(b.familyLoan)}` : ' · no family safety net'}</span>
      </button>`;
    }).join('')}</div>
    ${c.bg === 'familybiz' ? `<div class="card"><label class="field"><span class="label">What did your family's business do?</span><select id="c-xp" class="input" data-ch="cSel" data-a="xpChoice">${Object.entries(G.INDUSTRIES).map(([k, v]) => `<option value="${k}" ${c.xpChoice === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label></div>` : ''}`;
  }

  function stepEdu() {
    const e = G.EDUCATION.find((x) => x.id === c.edu);
    return `<div class="page-head"><div><h2>Education</h2><p>Degrees open jobs and add skills, and most of them come with student loans. Debt is reduced if you graduated long ago.</p></div></div>
    <div class="grid g3">${G.EDUCATION.map((x) => `<button class="tile" data-act="cSet" data-a="edu:${x.id}" aria-pressed="${c.edu === x.id}">
      <b>${esc(x.name)}</b><span class="small">${x.debt ? `${U.money(x.debt)} in loans` : 'No student debt'} · +${x.pts} skill points</span>
      ${x.creds ? `<span class="tiny" style="color:var(--road)">Includes a trade license</span>` : ''}</button>`).join('')}</div>
    ${e.major ? `<div class="stack"><h4>Major</h4><div class="grid g3">${G.MAJORS.map((m) => `<button class="tile" data-act="cSet" data-a="major:${m.id}" aria-pressed="${c.major === m.id}"><b>${esc(m.name)}</b><span class="small">${Object.entries(m.skills).map(([k, v]) => `+${v} ${G.SKILLS[k].label}`).join(', ')}</span></button>`).join('')}</div></div>` : ''}`;
  }

  function stepSkills() {
    const base = G.state.baseSkills(c);
    const pool = G.state.pointPool(c) - U.sum(Object.values(c.alloc));
    return `<div class="page-head"><div><h2>Skills & traits</h2><p>Spend your points. Skills grow over time from jobs, courses and running a business, so do not stress about perfection.</p></div>
      <div class="sign" style="padding:8px 14px"><span class="label">Points left</span><div class="num" style="font-size:1.4rem;font-weight:800">${pool}</div></div></div>
    <div class="card stack">${Object.entries(G.SKILLS).map(([k, sk]) => {
      const v = Math.min(100, base[k] + (c.alloc[k] || 0));
      return `<div class="skill-row"><div><b>${esc(sk.label)}</b><div class="tiny faint">${esc(sk.desc)}</div></div><div class="meter"><i style="width:${v}%"></i></div>
        <div class="stepper"><button data-act="cAlloc" data-a="${k}:-1" aria-label="Less ${esc(sk.label)}" ${!(c.alloc[k] > 0) ? 'disabled' : ''}>−</button><b>${v}</b><button data-act="cAlloc" data-a="${k}:1" aria-label="More ${esc(sk.label)}" ${pool <= 0 || v >= 100 ? 'disabled' : ''}>+</button></div></div>`;
    }).join('')}</div>
    <div class="stack"><h4>Pick two traits</h4><div class="grid g3">${G.TRAITS.map((t) => `<button class="tile" data-act="cTrait" data-a="${t.id}" aria-pressed="${c.traits.includes(t.id)}" ${!c.traits.includes(t.id) && c.traits.length >= 2 ? 'disabled' : ''}><b>${esc(t.name)}</b><span class="small">${esc(t.desc)}</span></button>`).join('')}</div></div>
    <div class="stack"><h4>Optional flaw (+6 skill points)</h4><div class="grid g3">${G.FLAWS.map((t) => `<button class="tile" data-act="cFlaw" data-a="${t.id}" aria-pressed="${c.flaw === t.id}"><b>${esc(t.name)}</b><span class="small">${esc(t.desc)}</span></button>`).join('')}</div></div>`;
  }

  function stepLife() {
    return `<div class="page-head"><div><h2>Your life</h2><p>A partner shares rent and needs your time. Kids are expensive and wonderful. A car is freedom with a monthly bill.</p></div></div>
    <div class="card grid g3">
      <div class="field"><span class="label">Relationship</span><div class="seg">${[['single', 'Single'], ['partner', 'Partner'], ['married', 'Married']].map(([k, l]) => `<button data-act="cSet" data-a="relationship:${k}" aria-pressed="${c.relationship === k}">${l}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Kids</span><div class="seg">${[0, 1, 2, 3].map((k) => `<button data-act="cSet" data-a="kids:${k}" aria-pressed="${c.kids === k}">${k}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Car</span><div class="seg"><button data-act="cSet" data-a="hasCar:1" aria-pressed="${c.hasCar}">Own a car</button><button data-act="cSet" data-a="hasCar:0" aria-pressed="${!c.hasCar}">No car</button></div></div>
    </div>
    <div class="stack"><h4>Why are you doing this?</h4><p class="muted small">Your reason decides how your life is scored at the end.</p>
    <div class="grid g3">${G.WHYS.map((w) => `<button class="tile" data-act="cSet" data-a="why:${w.id}" aria-pressed="${c.why === w.id}"><b>${esc(w.name)}</b><span class="small">${esc(w.desc)}</span></button>`).join('')}</div></div>`;
  }

  function stepLocation() {
    const st = G.loc.state(c.state);
    const L = draftLoc();
    const clim = G.CLIMATES[st.clim];
    return `<div class="page-head"><div><h2>Where do you start?</h2><p>Pick any state, then a city, or type in your own town. Taxes, wages, rent, regulations and disasters all follow from this choice.</p></div></div>
    <div class="card"><div class="state-grid" role="group" aria-label="States">${G.STATES.map((x) => `<button class="state-btn" data-act="cState" data-a="${x.ab}" aria-pressed="${c.state === x.ab}" title="${esc(x.name)}">${ui.shield(x.ab, 34)}<span>${esc(x.name === 'District of Columbia' ? 'D.C.' : x.name)}</span></button>`).join('')}</div></div>
    <div class="grid g2" style="align-items:start">
      <div class="card stack">
        <div class="row">${ui.shield(st.ab, 40)}<div><h3>${esc(st.name)}</h3><span class="muted small">${esc(clim.label)} · ${st.ind.map((i) => esc(i)).join(', ')}</span></div></div>
        <div class="facts">
          <div class="fact"><span class="label">Income tax</span><b>${st.tax[1] === 0 ? 'None' : st.tax[0] === st.tax[1] ? st.tax[0] + '%' : st.tax[0] + '–' + st.tax[1] + '%'}</b></div>
          <div class="fact"><span class="label">Sales tax</span><b>${st.st ? st.st + '%' : 'None'}</b></div>
          <div class="fact"><span class="label">Minimum wage</span><b>${U.money(st.mw, { cents: true })}</b></div>
          <div class="fact"><span class="label">LLC filing</span><b>${U.money(st.llc)}${st.ann ? ` + ${U.money(st.ann)}/yr` : ''}</b></div>
          <div class="fact"><span class="label">Cost of living</span><b>${st.col}</b></div>
          <div class="fact"><span class="label">Median household</span><b>${U.money(st.inc * 1000, { short: true })}</b></div>
          <div class="fact"><span class="label">Medicaid expansion</span><b>${st.mx ? 'Yes' : 'No'}</b></div>
          <div class="fact"><span class="label">Hazards</span><b class="small" style="font-family:var(--font-ui)">${st.haz.map((h) => G.HAZARDS[h].label).join(', ')}</b></div>
        </div>
      </div>
      <div class="card stack">
        <h4>City</h4>
        <div class="stack-s">${st.cities.map((ci) => `<button class="tile" data-act="cCity" data-a="${esc(ci[0])}" aria-pressed="${!c.customCity && c.city === ci[0]}" style="padding:8px 12px">
          <div class="row between"><b>${esc(ci[0])}</b><span class="num small">${ci[1] >= 1000 ? (ci[1] / 1000).toFixed(1) + 'M' : ci[1] + 'k'} people</span></div>
          <span class="tiny faint">Cost of living ${ci[2]} · 1BR ${U.money(ci[3])}/mo${ci[4] ? ' · ' + esc(ci[4].split(' ').slice(0, 4).join(', ')) : ''}</span></button>`).join('')}
          <button class="tile" data-act="cCustomCity" aria-pressed="${c.customCity}" style="padding:8px 12px"><b>Somewhere else in ${esc(st.name)}</b><span class="tiny faint">Your hometown, a suburb, the middle of nowhere</span></button>
        </div>
        ${c.customCity ? `<div class="grid g2"><label class="field"><span class="label">Town name</span><input id="c-town" class="input" data-in="cSet" data-a="customName" value="${esc(c.customName)}" placeholder="e.g. Pella" maxlength="40"></label>
          <label class="field"><span class="label">Size</span><select id="c-size" class="input" data-ch="cSel" data-a="customSize">${G.CITY_SIZES.map((z) => `<option value="${z.id}" ${c.customSize === z.id ? 'selected' : ''}>${esc(z.label)}</option>`).join('')}</select></label></div>` : ''}
        <div class="alert info small"><span>${esc(L.city)}: cost of living ${L.col}, a one-bedroom rents for about ${U.money(L.rent)}/mo, retail space about ${U.money(G.loc.commercialRent(L, 'retail'), { cents: true })}/sq ft/yr.</span></div>
      </div>
    </div>`;
  }

  function stepDream() {
    const L = draftLoc();
    const cats = Object.entries(G.CATEGORIES);
    const list = G.BIZ_LIST.filter((t) => t.cat === c.bizCat);
    let body;
    if (c.bizCat === 'custom') {
      const f = c.cf;
      const t = G.biz.buildCustom(f);
      const est = estimate(t, L);
      body = `<div class="card stack">
        <p class="muted">Anything you can imagine. Describe it, pick how it makes money, and the game builds its economics.</p>
        <div class="grid g2">
          <label class="field"><span class="label">Business name</span><input id="cf-name" class="input" data-in="cfSet" data-a="name" value="${esc(f.name)}" placeholder="e.g. Axolotl Acres" maxlength="50"></label>
          <label class="field"><span class="label">Industry</span><select id="cf-cat" class="input" data-ch="cfSel" data-a="cat">${cats.map(([k, v]) => `<option value="${k}" ${f.cat === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
        </div>
        <label class="field"><span class="label">What do you do?</span><input id="cf-what" class="input" data-in="cfSet" data-a="what" value="${esc(f.what)}" placeholder="Breeding and selling axolotls and aquarium supplies" maxlength="140"></label>
        <h4>How does it make money?</h4>
        <div class="grid g3">${G.MODELS.map((m) => `<button class="tile" data-act="cfModel" data-a="${m.id}" aria-pressed="${f.model === m.id}"><b>${esc(m.name)}</b><span class="small">${esc(m.blurb)}</span></button>`).join('')}</div>
        <div class="grid g2">
          <label class="field"><span class="label">${f.model === 'members' ? 'Monthly price' : f.model === 'grow' ? 'Price level (100 = typical)' : 'Average sale'}: <b class="num" id="cf-price-v">${U.money(f.price)}</b></span><input id="cf-price" type="range" min="${f.model === 'clients' ? 500 : 5}" max="${f.model === 'clients' ? 50000 : 2000}" step="5" value="${f.price}" data-in="cfNum" data-a="price"></label>
          <label class="field"><span class="label">Gross margin: <b class="num" id="cf-margin-v">${Math.round(f.margin * 100)}%</b></span><input id="cf-margin" type="range" min="15" max="97" value="${Math.round(f.margin * 100)}" data-in="cfNum" data-a="margin"></label>
          <label class="field"><span class="label">Space</span><select id="cf-space" class="input" data-ch="cfSel" data-a="space">${Object.entries(G.SPACE_TYPES).map(([k, v]) => `<option value="${k}" ${f.space === k ? 'selected' : ''}>${esc(v.label)}${v.sqft ? ` (~${v.sqft.toLocaleString()} sq ft)` : ''}</option>`).join('')}</select></label>
          <label class="field"><span class="label">Equipment & inventory budget: <b class="num" id="cf-budget-v">${U.money(f.budget)}</b></span><input id="cf-budget" type="range" min="1000" max="400000" step="1000" value="${f.budget}" data-in="cfNum" data-a="budget"></label>
        </div>
        <div class="field"><span class="label">Skills that matter most (pick up to 3)</span><div class="row">${Object.entries(G.SKILLS).map(([k, v]) => `<button class="chip" data-act="cfSkill" data-a="${k}" aria-pressed="${f.skills.includes(k)}">${esc(v.label)}</button>`).join('')}</div></div>
        <div class="row"><button class="chip" data-act="cfLicense" aria-pressed="${f.license}">Needs a special license or permit</button></div>
        <div class="alert ${c.ideaId === 'custom' ? 'good' : 'info'}"><span>Estimated startup in ${esc(L.city)}: <b class="num">${U.money(est.total)}</b>${est.rentMo ? `, plus ${U.money(est.rentMo)}/mo rent` : ''}. Engine: ${ENGINE_LABEL[t.engine]}.</span></div>
        <button class="btn ${c.ideaId === 'custom' ? 'btn-go' : ''}" data-act="cIdea" data-a="custom">${c.ideaId === 'custom' ? 'Selected as your dream' : 'Make this my dream'}</button>
      </div>`;
    } else {
      body = `<div class="grid g2">${list.map((t) => {
        const est = estimate(t, L);
        const warn = t.cred ? `Needs ${G.CREDS[t.cred]}` : t.strBan && L.city === 'New York City' ? 'Effectively banned in NYC' : '';
        return `<button class="tile" data-act="cIdea" data-a="${t.id}" aria-pressed="${c.ideaId === t.id}">
          <div class="row between"><b>${esc(t.name)}</b>${ui.pill(ENGINE_LABEL[t.engine], 'info')}</div>
          <span class="small">${esc(t.desc)}</span>
          <span class="tiny"><span class="num">~${U.money(est.total, { short: true })}</span> to start here${est.rentMo ? ` · ${U.money(est.rentMo, { short: true })}/mo rent` : ''}${t.online ? ' · sells nationwide' : ''}${warn ? ` · <span style="color:var(--stop)">${esc(warn)}</span>` : ''}</span>
        </button>`;
      }).join('')}</div>`;
    }
    return `<div class="page-head"><div><h2>The dream</h2><p>What do you want to build? You will not open it right away: first you save, plan and fund it. You can change your mind later.</p></div>
      <button class="btn btn-ghost" data-act="cIdea" data-a="">${c.ideaId ? 'Clear choice' : 'Decide later'}</button></div>
    <div class="biz-cats">${cats.map(([k, v]) => `<button class="chip" data-act="cSet" data-a="bizCat:${k}" aria-pressed="${c.bizCat === k}">${esc(v)}</button>`).join('')}<button class="chip" data-act="cSet" data-a="bizCat:custom" aria-pressed="${c.bizCat === 'custom'}">Your own idea</button></div>
    ${body}`;
  }

  function stepJob() {
    const p = draftPlayer();
    const L = draftLoc();
    const ok = availableJobs();
    const st = G.loc.state(c.state);
    return `<div class="page-head"><div><h2>Your day job</h2><p>The job pays the bills while you save, gives you health insurance if you are lucky, and teaches you an industry. Working at a cafe before opening one is smart.</p></div>
      <button class="btn ${c.jobId === null ? 'btn-go' : ''}" data-act="cSet" data-a="jobId:">${c.jobId === null ? 'Starting unemployed' : 'Start unemployed'}</button></div>
    <div class="grid g2">${G.JOBS.map((j) => {
      const can = ok.includes(j.id);
      const wage = G.jobs.wageFor(j, p, L);
      const req = j.req ? Object.entries(j.req).map(([k, v]) => k === 'edu' ? G.EDUCATION.find((e) => e.id === v).name : k === 'cred' ? G.CREDS[v] : `${G.SKILLS[k].label} ${v}`).join(', ') : '';
      return `<button class="tile" data-act="cSet" data-a="jobId:${j.id}" aria-pressed="${c.jobId === j.id}" ${can ? '' : 'disabled'}>
        <div class="row between"><b>${esc(j.title)}</b><span class="num small">${U.money(wage, { cents: true })}/hr${j.tips ? ' + tips' : ''}</span></div>
        <span class="tiny faint">${j.flex ? 'Flexible hours, paid as a contractor' : `${j.hours} hrs/week`}${j.benefits ? ' · health insurance' : ''}${j.xp ? ' · ' + esc(G.INDUSTRIES[j.xp]) + ' experience' : ''}</span>
        ${!can ? `<span class="tiny" style="color:var(--stop)">Requires ${esc(req || 'a car')}</span>` : ''}
      </button>`;
    }).join('')}</div>
    <p class="tiny faint">${esc(st.name)} minimum wage: ${U.money(st.mw, { cents: true })}/hr.</p>`;
  }

  function stepReview() {
    const L = draftLoc();
    const st = G.loc.state(c.state);
    const bg = G.BACKGROUNDS.find((b) => b.id === c.bg);
    const edu = G.EDUCATION.find((e) => e.id === c.edu);
    const t = currentTpl();
    const p = draftPlayer();
    const j = c.jobId ? G.JOBS.find((x) => x.id === c.jobId) : null;
    return `<div class="page-head"><div><h2>Ready?</h2><p>Here is the life you are starting. You can change jobs, housing and plans once you begin.</p></div></div>
    <div class="grid g2">
      <div class="card stack">
        <div class="row">${ui.shield(st.ab, 44)}<div><h3>${esc(c.name)}, ${c.age}</h3><span class="muted small">${esc(L.city)}, ${esc(st.name)}</span></div></div>
        <div class="facts">
          <div class="fact"><span class="label">Origin</span><b class="small" style="font-family:var(--font-ui)">${esc(bg.name)}</b></div>
          <div class="fact"><span class="label">Education</span><b class="small" style="font-family:var(--font-ui)">${esc(edu.name)}</b></div>
          <div class="fact"><span class="label">Savings</span><b>${U.money(bg.cash)}</b></div>
          <div class="fact"><span class="label">Credit score</span><b>${bg.credit}</b></div>
          <div class="fact"><span class="label">Day job</span><b class="small" style="font-family:var(--font-ui)">${j ? esc(j.title) : 'None'}</b></div>
          <div class="fact"><span class="label">Motivation</span><b class="small" style="font-family:var(--font-ui)">${esc(G.WHYS.find((w) => w.id === c.why).name)}</b></div>
        </div>
      </div>
      <div class="card stack">
        <h4>Skills</h4>
        ${Object.entries(G.SKILLS).map(([k, v]) => ui.meter(v.label, p.skills[k])).join('')}
        <div class="row">${c.traits.map((id) => ui.pill(G.TRAITS.find((t) => t.id === id).name, 'good')).join('')}${c.flaw ? ui.pill(G.FLAWS.find((t) => t.id === c.flaw).name, 'warn') : ''}</div>
      </div>
    </div>
    <div class="card">${t ? `<h4>The dream</h4><p style="margin-top:6px"><b>${esc(t.custom ? t.name : t.name)}</b>. ${esc(t.desc)}</p><p class="small muted" style="margin-top:6px">Estimated startup cost in ${esc(L.city)}: <span class="num">${U.money(estimate(t, L).total)}</span>.</p>` : '<p class="muted">No business picked yet. You can choose one in the game.</p>'}</div>
    <button class="btn btn-go btn-big" data-act="cStart" style="align-self:flex-start">Begin this life →</button>`;
  }

  function render() {
    const steps = [stepYou, stepEdu, stepSkills, stepLife, stepLocation, stepDream, stepJob, stepReview];
    return `<div class="topbar"><div class="topbar-in"><span class="brand"><span class="bm">SM</span>Self Made</span><span class="muted small">New life</span><button class="btn btn-ghost btn-s" data-act="toTitle" style="margin-left:auto">Back to title</button></div></div>
    <div class="wizard">
      <nav class="route" aria-label="Steps">${STEPS.map((n, i) => `<button data-act="cStep" data-a="${i}" class="${i < c.step || i <= c.maxStep && i !== c.step ? 'done' : ''}" ${i === c.step ? 'aria-current="step"' : ''} ${i > c.maxStep ? 'disabled' : ''}><span class="stop"></span>${esc(n)}</button>`).join('')}</nav>
      <section class="step-body">${steps[c.step]()}
        <div class="step-foot">${c.step > 0 ? `<button class="btn" data-act="cStep" data-a="${c.step - 1}">← Back</button>` : '<span></span>'}${c.step < STEPS.length - 1 ? `<button class="btn btn-go" data-act="cStep" data-a="${c.step + 1}" ${!stepValid() ? 'disabled' : ''}>Next: ${esc(STEPS[c.step + 1])} →</button>` : ''}</div>
      </section>
    </div>`;
  }

  function stepValid() {
    if (c.step === 0) return c.name.trim().length > 0 && !(G.BACKGROUNDS.find((b) => b.id === c.bg).minAge > c.age);
    if (c.step === 4) return !c.customCity || c.customName.trim().length > 0;
    return true;
  }

  function start() {
    const t = currentTpl();
    if (c.jobId && !availableJobs().includes(c.jobId)) c.jobId = null;
    const cfg = {
      name: c.name.trim() || 'Founder', pronouns: c.pronouns, age: c.age, bg: c.bg, edu: c.edu, major: G.EDUCATION.find((e) => e.id === c.edu).major ? c.major : null,
      traits: c.traits, flaw: c.flaw, alloc: c.alloc, xpChoice: c.xpChoice, why: c.why, relationship: c.relationship, kids: c.kids, hasCar: c.hasCar,
      state: c.state, city: c.customCity ? (c.customName.trim() || 'Hometown') : c.city, custom: c.customCity ? { size: c.customSize } : null,
      ideaId: c.ideaId && c.ideaId !== 'custom' ? c.ideaId : null, customTpl: c.ideaId === 'custom' ? t : null, jobId: c.jobId,
    };
    ui.s = G.state.newGame(cfg);
    ui.save();
    ui.view = {};
    ui.go('game', 'overview');
  }

  // ---------- Actions ----------
  ui.on('toTitle', () => { ui.go('title'); return false; });
  ui.on('cStep', (el, a) => { c.step = +a; c.maxStep = Math.max(c.maxStep, c.step); window.scrollTo(0, 0); });
  ui.on('cSet', (el, a) => {
    if (el.tagName === 'INPUT') { c[a] = el.value; const btn = document.querySelector('.step-foot .btn-go'); if (btn) btn.disabled = !stepValid(); return false; }
    const i = a.indexOf(':');
    const k = a.slice(0, i), v = a.slice(i + 1);
    if (k === 'kids') c.kids = +v;
    else if (k === 'hasCar') c.hasCar = v === '1';
    else if (k === 'jobId') c.jobId = v || null;
    else c[k] = v;
    if (k === 'edu' || k === 'major') c.alloc = trimAlloc();
  });
  ui.on('cSel', (el, a) => { c[a] = el.value; });
  ui.on('cAge', (el) => { c.age = +el.value; const v = document.getElementById('age-v'); if (v) v.textContent = c.age; return false; });
  ui.on('cAlloc', (el, a) => {
    const [k, d] = a.split(':');
    const pool = G.state.pointPool(c) - U.sum(Object.values(c.alloc));
    const nv = (c.alloc[k] || 0) + +d;
    if (nv < 0 || (+d > 0 && pool <= 0)) return false;
    c.alloc[k] = nv;
  });
  function trimAlloc() {
    const a = Object.assign({}, c.alloc);
    let over = U.sum(Object.values(a)) - G.state.pointPool(c);
    for (const k of Object.keys(a)) { while (over > 0 && a[k] > 0) { a[k]--; over--; } }
    return a;
  }
  ui.on('cTrait', (el, a) => {
    if (c.traits.includes(a)) c.traits = c.traits.filter((x) => x !== a);
    else if (c.traits.length < 2) c.traits.push(a);
  });
  ui.on('cFlaw', (el, a) => { c.flaw = c.flaw === a ? null : a; c.alloc = trimAlloc(); });
  ui.on('cState', (el, a) => { c.state = a; c.city = G.loc.state(a).cities[0][0]; c.customCity = false; });
  ui.on('cCity', (el, a) => { c.city = a; c.customCity = false; });
  ui.on('cCustomCity', () => { c.customCity = true; });
  ui.on('cIdea', (el, a) => { c.ideaId = a || null; });
  ui.on('cfSet', (el, a) => { c.cf[a] = el.value; return false; });
  ui.on('cfSel', (el, a) => { c.cf[a] = el.value; });
  ui.on('cfNum', (el, a) => {
    const v = +el.value;
    c.cf[a] = a === 'margin' ? v / 100 : v;
    const lab = document.getElementById('cf-' + a + '-v');
    if (lab) lab.textContent = a === 'margin' ? v + '%' : U.money(v);
    return false;
  });
  ui.on('cfModel', (el, a) => {
    c.cf.model = a;
    const m = G.MODELS.find((x) => x.id === a);
    c.cf.price = m.base.sub ? m.base.sub.price : m.base.price || 100;
  });
  ui.on('cfSkill', (el, a) => {
    const sk = c.cf.skills;
    if (sk.includes(a)) c.cf.skills = sk.filter((x) => x !== a);
    else if (sk.length < 3) sk.push(a);
  });
  ui.on('cfLicense', () => { c.cf.license = !c.cf.license; });
  ui.on('cStart', () => { start(); return false; });
  if (typeof document !== 'undefined') document.addEventListener('change', (e) => {
    if (e.target && e.target.matches && e.target.matches('#c-age,#cf-price,#cf-margin,#cf-budget')) ui.render();
  });

  return { render, reset, start };
})();
