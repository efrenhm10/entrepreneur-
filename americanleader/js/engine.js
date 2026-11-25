// American Leader: the core engine. Time, conditions, approval, money, power groups, overseers.

let G = null;
const SAVE_KEY = "americanleader_v1";

// ── Helpers ─────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const chance = (p) => Math.random() < p;
const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = (v, d = 0) => Number(v).toFixed(d);
const uid = (p) => p + Math.random().toString(36).slice(2, 9);
function money(v) {
    const a = Math.abs(v), s = v < 0 ? "−" : "";
    if (a >= 1e12) return `${s}$${(a / 1e12).toFixed(a >= 1e13 ? 1 : 2)}T`;
    if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(a >= 1e10 ? 1 : 2)}B`;
    if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M`;
    if (a >= 1e3) return `${s}$${Math.round(a / 1e3)}K`;
    return `${s}$${Math.round(a)}`;
}

// ── The calendar: week 0 is the first Monday of 2026 ────────────────
const T0 = Date.UTC(2026, 0, 5);
const dateOf = (t) => new Date(T0 + t * 7 * 864e5);
const yearOf = (t) => dateOf(t).getUTCFullYear();
const monthOf = (t) => dateOf(t).getUTCMonth();
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function dateStr(t = G.t) { const d = dateOf(t); return `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; }
// First week on or after a date.
function weekOf(y, m, d = 1) { return Math.ceil((Date.UTC(y, m, d) - T0) / (7 * 864e5)); }
const newMonth = (t) => monthOf(t) !== monthOf(t - 1);
const newYear = (t) => yearOf(t) !== yearOf(t - 1);

// ── Who and where ───────────────────────────────────────────────────
const CITY = () => CITIES[G.cityK];
const STATE = () => STATES[CITY().st];
const J = () => G.J;
const LV = () => G.level;
const office = () => LEVELS[G.level].office;
const titleOf = () => G.level === "city" ? `Mayor of ${CITY().name}` : G.level === "state" ? `Governor of ${STATE().name}` : "President of the United States";
const placeName = () => G.level === "city" ? CITY().name : G.level === "state" ? STATE().name : "the United States";
function log(text, type = "info") { G.log.unshift({ t: G.t, text, type }); if (G.log.length > 300) G.log.pop(); }

// ── A new game: you were just elected mayor ─────────────────────────
function newGame(cityK, me) {
    const c = CITIES[cityK];
    G = {
        v: 1, t: 0, cityK, level: "city", me, capital: 12, funds: 0.4e6 * Math.max(1, Math.log10(c.pop / 1e5) * 2), press: 55, heat: 0,
        people: {}, scenes: [], log: [], demands: [], bills: [], hist: [], laws: [], career: [{ t: 0, office: `Mayor of ${c.name}` }],
        terms: 1, termsHere: 1, levelSince: 0, cityStart: 2026, honeymoon: 26, over: false, flags: {}, seen: {}, records: []
    };
    G.J = makeCity(c);
    makeOverseers();
    makeBody(G.J);
    makeTeamCandidates();
    G.approval = 54 + (me.traits.includes("media") ? 3 : 0);
    log(`${me.name} is sworn in as mayor of ${c.name}.`, "good");
    queueScene("welcome");
    return G;
}

function makeCity(c) {
    const St = STATES[c.st];
    const fin = makeFinance(c.budget.gf, c.budget.gap, c.budget.rev.map(([n, share, ctl]) => ({ n, share, ctl, rate: 1 })), c.budget);
    const m = fullCityM(G.cityK);
    const Jx = { kind: "city", name: c.name, pop: c.pop, lean: c.lean, m: Object.assign({}, m), m0: Object.assign({}, m), dep: cityDependence(G.cityK), prio: [], shock: {}, depts: {}, fin, groups: {}, team: {}, laws: [], term: c.term, limit: c.limit, form: c.form, veto: c.veto, recall: c.recall, issues: c.issues };
    DEPTS.city.forEach((d) => { Jx.depts[d.k] = 1; });
    Object.keys(c.groups).forEach((k) => { if (GROUPS[k]) Jx.groups[k] = { w: c.groups[k], l: 50 + rint(-6, 6) }; });
    applyBackground(Jx);
    initEcon(Jx, CITY_ECON[G.cityK].inds);
    Jx.fy = { month: FYM[G ? G.cityK : ""] != null ? FYM[G.cityK] : 6 };
    Jx.electionYear = 2026 + c.term - 1;
    void St;
    return Jx;
}
// Every condition for a city, including the kitchen-table ones from its economic profile.
function fullCityM(k) {
    const c = CITIES[k], e = CITY_ECON[k] || {};
    return Object.assign({}, c.m, { wages: e.wages != null ? e.wages : 48, food: e.food != null ? e.food : 48, water: e.water != null ? e.water : 48 });
}
// How much the economy leans on one boom-and-bust industry (its share of jobs, %).
function cityDependence(k) {
    const inds = (CITY_ECON[k] || {}).inds || {};
    const vol = Object.entries(inds).filter(([n]) => VOLATILE.includes(n)).map((x) => x[1]);
    return Math.max(8, ...vol, Math.max(0, ...Object.values(inds)) * 0.6);
}
// Fiscal years that don't start in July.
const FYM = { seattle: 0, chicago: 0, neworleans: 0, minneapolis: 0, anchorage: 0, milwaukee: 0, austin: 9, honolulu: 6, burlington: 6 };

function makeFinance(gf, gap, lines, b = {}) {
    const fixed = 0.1 + (1 - (b.pension != null ? b.pension : 0.8)) * 0.18 + (b.debt || 1) * 0.03;
    return {
        base: gf, lines, spend0: gf * (1 + gap), fixed, pension: b.pension != null ? b.pension : 0.8, pensionPay: 1,
        reserve: gf * (b.reserve != null ? b.reserve : 0.1), debt: gf * (b.debt || 1), rating: b.rating || "AA", ratingScore: ratingToScore(b.rating || "AA"),
        oneTime: 0, yr: { rev: 0, spend: 0, start: 0 }, hist: [], cr: false
    };
}
const RATINGS = ["CCC", "B", "BB", "BBB-", "BBB", "BBB+", "A-", "A", "A+", "AA-", "AA", "AA+", "AAA"];
const ratingToScore = (r) => Math.max(0, RATINGS.indexOf(r));

// When you become mayor your background shapes your allies and enemies.
function applyBackground(Jx) {
    const bg = BACKGROUNDS[G ? G.me.bg : "council"];
    if (!bg) return;
    bg.allies.forEach((k) => { if (Jx.groups[k]) Jx.groups[k].l += 14; });
    bg.enemies.forEach((k) => { if (Jx.groups[k]) Jx.groups[k].l -= 12; });
}

// ── Money ───────────────────────────────────────────────────────────
const years = () => G.t / 52;
// Revenue this year at current rates: the base grows with the economy and inflation.
function revenue(Jx = J()) {
    const f = Jx.fin;
    const econ = 1 + (Jx.m.economy - Jx.m0.economy) / 160;
    return f.base * Math.pow(1.03, years()) * econ * sum(f.lines, (l) => l.share * Math.pow(l.rate, 0.9)) + firmRevenue(Jx);
}
// Spending: costs rise a bit faster than revenue (wages, health care, pensions).
function spending(Jx = J()) {
    const f = Jx.fin;
    const grow = Math.pow(1.034, years());
    const depts = DEPTS[Jx.kind];
    const disc = sum(depts, (d) => d.share * (Jx.depts[d.k] || 1));
    const fixed = f.fixed * (f.pensionPay > 1 ? 1.12 : f.pensionPay < 1 ? 0.88 : 1) * (1 + (0.8 - f.pension) * 0.4 * Math.min(1, years() / 4));
    const lawCost = sum(Jx.laws, (l) => (POLICY[l.k] ? POLICY[l.k].cost : 0)) * f.base * Math.pow(1.03, years());
    return f.spend0 * grow * (fixed + (1 - f.fixed) * disc) + lawCost + subsidyCost(Jx) + newDebtService(Jx);
}
function balance(Jx = J()) { return revenue(Jx) - spending(Jx); }

// ── Debt ────────────────────────────────────────────────────────────
// The debt you inherited is already paid for in the budget; anything you add costs interest and
// principal every year (about 8.5% for 20-year bonds). Washington only pays interest.
const debt0 = (f) => (f.debt0 != null ? f.debt0 : (f.debt0 = f.debt));
const debtRate = (Jx = J()) => (Jx.kind === "nation" ? 0.034 : 0.085);
function newDebtService(Jx = J()) { const f = Jx.fin; return Math.max(0, f.debt - debt0(f)) * debtRate(Jx) * (Jx.kind === "nation" ? 0 : 1); }
function debtService(Jx = J()) { return Jx.fin.debt * debtRate(Jx); }
// Pensions promised but not yet paid for: debt in all but name.
function pensionGap(Jx = J()) { const f = Jx.fin; const liability = f.base * (Jx.kind === "city" ? 3.2 : Jx.kind === "state" ? 2 : 0); return liability * Math.max(0, 1 - f.pension); }
function issueBonds(amt) {
    const f = J().fin;
    if (G.capital < 3) return "Issuing bonds takes 3 political capital.";
    G.capital -= 3;
    debt0(f); f.debt += amt; f.reserve += amt;
    log(`${J().name} sells ${money(amt)} in bonds. Debt payments rise by ${money(amt * debtRate())} a year.`, "warn");
    return `Sold ${money(amt)} in bonds. Payments go up ${money(amt * debtRate())} a year for 20 years.`;
}
function payDownDebt(amt) {
    const f = J().fin;
    debt0(f);
    amt = Math.min(amt, f.reserve, f.debt);
    if (amt <= 0) return "There's nothing in the rainy-day fund to pay it with.";
    f.reserve -= amt; f.debt -= amt;
    // Retiring old debt frees up the payments built into the budget.
    if (f.debt < f.debt0) { f.spend0 -= (f.debt0 - f.debt) * debtRate() * 0.8; f.debt0 = f.debt; }
    log(`${J().name} pays off ${money(amt)} of debt early.`, "good");
    return `Paid off ${money(amt)}. That saves about ${money(amt * debtRate())} a year.`;
}
// Can this level borrow to cover a deficit? Only Washington.
const mustBalance = () => G.level !== "nation";
function updateRating(Jx = J()) {
    const f = Jx.fin;
    const sp = spending(Jx);
    let s = f.ratingScore;
    const target = clamp(6 + (f.reserve / sp) * 30 + (f.pension - 0.6) * 8 - Math.max(0, f.debt / f.base - 1) * 2 + (balance(Jx) >= 0 ? 1 : -2) + (f.cr ? -2 : 0), 0, RATINGS.length - 1);
    if (target > s + 0.8) s += 1; else if (target < s - 0.8) s -= 1;
    if (s !== f.ratingScore) {
        const up = s > f.ratingScore;
        f.ratingScore = s; f.rating = RATINGS[s];
        log(`${up ? "Upgrade" : "Downgrade"}: rating agencies move ${Jx.name} to ${f.rating}.`, up ? "good" : "bad");
        G.approval += up ? 1 : -2;
    }
}

// ── Conditions ──────────────────────────────────────────────────────
// Where each condition is heading: the starting point, plus funding, laws, staff and recent shocks.
function targets(Jx = J()) {
    const out = {};
    MKEYS.forEach((k) => { out[k] = Jx.m0[k]; });
    DEPTS[Jx.kind].forEach((d) => Object.entries(d.m).forEach(([k, w]) => { out[k] += ((Jx.depts[d.k] || 1) - 1) * 40 * w; }));
    Jx.laws.forEach((l) => { const p = POLICY[l.k]; if (!p) return; const ramp = clamp((G.t - l.t) / 52, 0, 1.5); Object.entries(p.fx).forEach(([k, v]) => { out[k] += v * ramp; }); });
    Object.entries(Jx.team).forEach(([role, id]) => {
        const p = G.people[id]; const R = TEAM[Jx.kind].find((x) => x.k === role);
        if (!p || !R) return;
        Object.entries(R.m).forEach(([k, w]) => { out[k] += (p.skill - 3) * 2 * w; });
    });
    if (G.me.traits.includes("wonk")) out.services += 2;
    // Your priorities: staff and departments focus on them.
    (Jx.prio || []).forEach((k) => { const I = ISSUES.find((x) => x.k === k); if (I) out[I.m] += 4 + (G.me.skills.policy || 0) * 0.5; });
    const mg = (G.me.skills.management || 0);
    out.services += mg * 0.6;
    // Funding cuts forced by a missed budget.
    if (Jx.fin.cr) MKEYS.forEach((k) => { out[k] -= 2; });
    // Washington's economy lifts or sinks everyone.
    out.economy += (G.natEcon || 0) * 6 * (1 + (Jx.dep || 12) / 25);
    // New employers, investments and subsidies.
    const eb = econBoost(Jx);
    out.economy += eb.economy; out.wages += eb.wages;
    MKEYS.forEach((k) => { out[k] = clamp(out[k] + (Jx.shock[k] || 0), 2, 98); });
    return out;
}
function weekConditions() {
    const Jx = J();
    const tg = targets(Jx);
    MKEYS.forEach((k) => {
        Jx.m[k] += (tg[k] - Jx.m[k]) * 0.035 + rnd(-0.25, 0.25);
        Jx.m[k] = clamp(Jx.m[k], 1, 99);
        if (Jx.shock[k]) { Jx.shock[k] *= 0.94; if (Math.abs(Jx.shock[k]) < 0.2) delete Jx.shock[k]; }
    });
}
// A hit (or boost) that fades over a few months.
function shock(k, v, Jx = J()) { if (!METRICS[k]) return; Jx.shock[k] = (Jx.shock[k] || 0) + v; Jx.m[k] = clamp(Jx.m[k] + v * 0.5, 1, 99); }

// Real-world numbers that move with the conditions.
function liveStats() {
    const Jx = J();
    if (Jx.kind !== "city") return null;
    const s = CITY().stats;
    const r = (k, inv) => { const d = (Jx.m[k] - Jx.m0[k]) / 100; return inv ? Math.max(0.2, 1 - d * 1.6) : 1 + d * 1.2; };
    return {
        homicides: Math.round(s.homicides * r("safety", true)),
        homelessN: Math.round(s.homelessN * r("homeless", true)),
        rent: Math.round(s.rent * Math.max(0.6, 1 - (Jx.m.housing - Jx.m0.housing) / 140) * Math.pow(1.03, years())),
        unemp: Math.max(2, s.unemp - (Jx.m.economy - Jx.m0.economy) / 9),
        wage: Math.round((14 + (Jx.m.wages / 100) * 22) * Math.pow(1.03, years()) * 100) / 100,
        grocery: Math.round(100 + (60 - Jx.m.food) * 0.8),
        breaks: Math.max(0, Math.round((100 - Jx.m.water) * CITY().pop / 1e5 * 0.9))
    };
}

// ── Approval ────────────────────────────────────────────────────────
// Voters judge you on change since you took office, weighted toward what this place cares about most.
function issueWeights(Jx = J()) {
    const w = Object.fromEntries(MKEYS.map((k) => [k, 1]));
    (Jx.issues || []).forEach((x) => { w[x[2]] = (w[x[2]] || 1) + 0.6; });
    // Kitchen-table issues weigh on everyone; your declared priorities weigh most.
    w.wages += 0.3; w.food += 0.2;
    (Jx.prio || []).forEach((k) => { const I = ISSUES.find((x) => x.k === k); if (I) w[I.m] = (w[I.m] || 1) + 1.2; });
    w.safety += 0.4; w.economy += 0.3;
    return w;
}
function performance(Jx = J()) {
    const w = issueWeights(Jx);
    const tot = sum(MKEYS, (k) => w[k]);
    return sum(MKEYS, (k) => (Jx.m[k] - Jx.m0[k]) * w[k]) / tot;
}
function approvalTarget() {
    const Jx = J();
    let a = 50 + performance(Jx) * 1.6;
    a += Math.max(0, G.honeymoon) * 0.3;
    a += (G.press - 50) * 0.18;
    a -= G.heat * 0.35;
    // Fit with the electorate: your ideology against the place's lean.
    const fit = -Math.abs(G.me.ideo * 40 + Jx.lean * 0.4) * 0.12;
    a += fit + 4;
    // Groups talk to their members.
    const gs = Object.values(Jx.groups);
    if (gs.length) a += (sum(gs, (g) => (g.l - 50) * g.w) / sum(gs, (g) => g.w)) * 0.15;
    if (mustBalance() && balance(Jx) < 0 && Jx.fin.reserve <= 0) a -= 4;
    if (Jx.fin.cr) a -= 3;
    a += G.rally || 0;
    return clamp(a, 8, 88);
}
function weekApproval() {
    G.approval += (approvalTarget() - G.approval) * 0.06 + rnd(-0.4, 0.4);
    G.approval = clamp(G.approval, 5, 92);
    if (G.honeymoon > 0) G.honeymoon -= 1;
    if (G.rally) { G.rally *= 0.9; if (Math.abs(G.rally) < 0.3) G.rally = 0; }
    G.heat = Math.max(0, G.heat - (G.me.traits.includes("clean") ? 0.5 : 0.3));
    G.press += (55 - G.press) * 0.02 + (G.me.traits.includes("media") ? 0.08 : 0);
}

// ── Power groups ────────────────────────────────────────────────────
function groupTarget(k) {
    const Jx = J(), Gr = GROUPS[k];
    let t = 50;
    Object.entries(Gr.cares).forEach(([m, w]) => { t += (Jx.m[m] - Jx.m0[m]) * w * 1.2; });
    Jx.laws.forEach((l) => { const p = POLICY[l.k]; if (!p) return; p.tags.forEach((tg) => { t += (Gr.tags[tg] || 0) * 6; }); });
    // Budget choices they notice.
    DEPTS[Jx.kind].forEach((d) => { if (d.grp[k]) t += ((Jx.depts[d.k] || 1) - 1) * 60 * d.grp[k]; });
    (Jx.fin.lines || []).forEach((l) => { if (l.rate > 1.001) t += (Gr.tags.taxup || 0) * 40 * (l.rate - 1) / 0.1 * l.share; });
    // Your staff: their people at the table.
    Object.values(Jx.team).forEach((id) => { const p = G.people[id]; if (p && p.ties && p.ties.includes(k)) t += 5; });
    return clamp(t + (Jx.groups[k].bonus || 0), 2, 98);
}
function monthGroups() {
    const Jx = J();
    Object.entries(Jx.groups).forEach(([k, g]) => {
        g.l += (groupTarget(k) - g.l) * 0.18 + rnd(-1, 1);
        g.l = clamp(g.l, 1, 99);
        if (g.bonus) { g.bonus *= 0.85; if (Math.abs(g.bonus) < 0.5) g.bonus = 0; }
    });
}
function groupMove(k, v) { const g = J().groups[k]; if (!g) return 0; g.l = clamp(g.l + v, 1, 99); g.bonus = (g.bonus || 0) + v * 0.7; return v; }
// React to a policy by its tags; returns the changes for the notice.
function groupsReact(tags, mult = 1) {
    const out = [];
    Object.entries(J().groups).forEach(([k, g]) => {
        const v = sum(tags, (t) => GROUPS[k].tags[t] || 0) * 6 * mult;
        if (Math.abs(v) >= 1) { groupMove(k, v); out.push({ label: GROUPS[k].n, v: Math.round(v), good: v > 0 }); }
    });
    return out;
}

// ── Political capital ───────────────────────────────────────────────
// Political capital comes in every week: more when you're popular and well staffed.
function capitalIncome() {
    let c = 2.5 + (G.approval - 50) / 25;
    Object.entries(J().team).forEach(([role, id]) => { const p = G.people[id]; const R = TEAM[G.level].find((x) => x.k === role); if (p && R) c += R.cap * (p.skill / 4); });
    if (G.me.traits.includes("workhorse")) c += 1;
    return Math.max(0.5, c);
}
const capitalWeekly = () => capitalIncome() * 0.55;
const capitalCap = () => 40 + (G.level === "state" ? 10 : G.level === "nation" ? 20 : 0);
// Wins build momentum.
function capitalBonus(v, why) { G.capital = clamp(G.capital + v, 0, capitalCap()); if (why) log(`${why}: +${v} political capital.`, "good"); }

// ── Overseers: the governor and the president ───────────────────────
function makeOverseers() {
    const St = STATE();
    G.gov = { name: personName(), party: St.gov, rel: 0, ideo: St.gov === "R" ? rnd(0.4, 0.85) : rnd(-0.7, -0.2), title: `Governor of ${St.name}` };
    G.pres = { name: personName(), party: NATION.president, rel: 0, ideo: NATION.president === "R" ? rnd(0.6, 0.95) : rnd(-0.7, -0.3), title: "President" };
    const myParty = G.me.party;
    G.gov.rel = myParty === G.gov.party ? rint(10, 30) : rint(-25, 0);
    G.pres.rel = myParty === G.pres.party ? rint(5, 25) : rint(-35, -10);
    G.natEcon = 0;
}
// How likely an overseer is to meddle this month.
function meddleOdds(o, hostile) {
    const diff = o.party !== G.me.party;
    return clamp((hostile * (diff ? 1 : 0.35) + (o.rel < -30 ? 0.15 : 0) - (o.rel > 40 ? 0.1 : 0)) * 0.22, 0.01, 0.3);
}

// ── Save ────────────────────────────────────────────────────────────
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) { /* storage full or blocked */ } }
function load() { try { const s = localStorage.getItem(SAVE_KEY); if (s) { G = JSON.parse(s); return true; } } catch (e) { /* unreadable */ } return false; }
const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
