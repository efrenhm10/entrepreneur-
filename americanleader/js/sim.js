// American Leader: the week, budget season, elections and the career ladder.

const partyAdj = (p) => ({ D: "Democratic", R: "Republican", I: "Independent", P: "Progressive" }[p] || "");

// ── Scenes queue ────────────────────────────────────────────────────
function queueScene(id, args = {}) { if (!SCENES[id]) return; G.scenes.push({ id, args }); }
const sceneWaiting = (id) => G.scenes.some((s) => s.id === id);

// Effects shared by scenes and actions. Returns chips for the notice.
function applyFx(fx = {}) {
    const out = [];
    const add = (label, v, good) => { if (v) out.push({ label, v: Math.round(v * 10) / 10, good: good != null ? good : v > 0 }); };
    if (fx.a) { G.approval = clamp(G.approval + fx.a, 5, 92); add("Approval", fx.a); }
    if (fx.cap) { G.capital = clamp(G.capital + fx.cap, 0, capitalCap()); add("Capital", fx.cap); }
    if (fx.press) { G.press = clamp(G.press + fx.press, 0, 100); add("Press", fx.press); }
    if (fx.heat) { G.heat = Math.max(0, G.heat + fx.heat); add("Scandal heat", fx.heat, fx.heat < 0); }
    if (fx.rally) { G.rally = (G.rally || 0) + fx.rally; }
    if (fx.funds) { G.funds = Math.max(0, G.funds + fx.funds); out.push({ label: "War chest", v: money(fx.funds), raw: true, good: fx.funds > 0 }); }
    if (fx.cost) { const c = fx.cost * J().fin.base; spendOneTime(c); out.push({ label: c > 0 ? "Cost" : "Revenue", v: money(Math.abs(c)), raw: true, good: c < 0 }); }
    if (fx.m) Object.entries(fx.m).forEach(([k, v]) => { shock(k, v); add(metricName(k, G.level), v); });
    if (fx.g) Object.entries(fx.g).forEach(([k, v]) => { if (J().groups[k]) { groupMove(k, v); add(GROUPS[k].n, v); } });
    if (fx.gov && G.gov) { G.gov.rel = clamp(G.gov.rel + fx.gov, -100, 100); add(`Relations with Gov. ${G.gov.name.split(" ").pop()}`, fx.gov); }
    if (fx.pres && G.pres) { G.pres.rel = clamp(G.pres.rel + fx.pres, -100, 100); add(`Relations with the President`, fx.pres); }
    if (fx.body) { bodyMembers().forEach((p) => { p.loyal = clamp(p.loyal + fx.body * (0.6 + Math.random() * 0.8), -100, 100); }); add(`${bodyShort()} goodwill`, fx.body); }
    if (fx.who) Object.entries(fx.who).forEach(([id, v]) => { const p = P(id); if (p) { p.loyal = clamp(p.loyal + v, -100, 100); add(p.name, v); } });
    if (fx.dept) Object.entries(fx.dept).forEach(([k, v]) => { J().depts[k] = clamp((J().depts[k] || 1) + v, 0.6, 1.4); });
    return out;
}
function sceneChoose(i) {
    const q = G.scenes[0];
    if (!q) return;
    const sc = SCENES[q.id](q.args);
    const c = sc.choices[i];
    if (!c || c.req === false) return;
    G.scenes.shift();
    const changes = applyFx(c.fx || {});
    let res = c.res || "";
    if (c.run) { const r = c.run(); if (typeof r === "string") res = r; else if (Array.isArray(r)) changes.push(...r); }
    if (!G.over) toast(sc.title, res, changes);
    if (res) log(`${sc.title}: ${res}`, "scene");
    save();
    render();
}

// ── The week ────────────────────────────────────────────────────────
function advance(n) {
    for (let i = 0; i < n; i++) {
        if (G.scenes.length || G.over) break;
        week();
    }
    save();
    render();
}
function week() {
    G.t++;
    const Jx = J();
    weekConditions();
    weekApproval();
    // Money in and out.
    const bal = balance(Jx);
    if (G.level === "nation") Jx.fin.debt -= bal / 52; else Jx.fin.reserve += bal / 52;
    Jx.fin.yr.rev += revenue(Jx) / 52; Jx.fin.yr.spend += spending(Jx) / 52;
    if (mustBalance() && Jx.fin.reserve < 0 && !G.flags.crunch) { G.flags.crunch = G.t; queueScene("cash_crunch"); }
    weekBills().forEach(([type, text]) => { log(text, type); if (type !== "info") toast(text, "", []); });
    budgetSeason();
    electionClock();
    if (newMonth(G.t)) month();
    if (newYear(G.t)) year();
    G.hist.push({ t: G.t, a: Math.round(G.approval), s: Math.round(Jx.m.safety), e: Math.round(Jx.m.economy), h: Math.round(Jx.m.housing), r: Math.round(Jx.fin.reserve) });
    if (G.hist.length > 520) G.hist.shift();
}
// Saves from before the Economy tab.
function ensureEcon(Jx = J()) {
    if (Jx.ec) return;
    initEcon(Jx, G.level === "city" ? CITY_ECON[G.cityK].inds : G.level === "state" ? stateInds(CITY().st) : NATION_INDS);
}
function month() {
    ensureEcon();
    econMonth();
    G.capital = clamp(G.capital + capitalIncome(), 0, capitalCap());
    monthGroups();
    // Demands come due.
    G.demands.filter((d) => d.due <= G.t).forEach((d) => refuseDemand(d.id, true));
    monthDemands();
    if (chance(G.level === "city" ? 0.55 : 0.8)) npcBill();
    G.natEcon = clamp((G.natEcon || 0) * 0.92 + rnd(-0.12, 0.12) + (G.recession ? -0.15 : 0.01), -1, 1);
    if (G.recession && chance(0.12)) { G.recession = false; log("Economists say the recession is over.", "good"); }
    monthIntrigue();
    monthEvents();
    if (G.flags.crunch && G.t - G.flags.crunch > 26) G.flags.crunch = 0;
    // Diversification laws slowly shrink dependence on one industry.
    const Jx = J();
    Jx.laws.forEach((l) => { const p = POLICY[l.k]; if (p && p.div && G.t - l.t < 156) Jx.dep = Math.max(8, (Jx.dep || 12) - p.div / 36); });
}
function year() {
    const Jx = J(), f = Jx.fin;
    // Pensions: full payments slowly heal the fund; skipped ones dig the hole deeper.
    f.pension = clamp(f.pension + (f.pensionPay >= 1 ? 0.012 * f.pensionPay : -0.03) + (G.natEcon || 0) * 0.02, 0.1, 1.05);
    updateRating(Jx);
    f.hist.push({ y: yearOf(G.t) - 1, rev: f.yr.rev, spend: f.yr.spend, reserve: f.reserve, debt: f.debt });
    f.yr = { rev: 0, spend: 0, start: G.t };
    f.oneTime = 0;
    G.me.age++;
    G.records.push({ y: yearOf(G.t) - 1, a: Math.round(G.approval), perf: Math.round(performance(Jx)), level: G.level, m: Object.fromEntries(MKEYS.map((k) => [k, Math.round(Jx.m[k])])) });
    queueScene("year_report", { y: yearOf(G.t) - 1 });
}

// ── Budget season ───────────────────────────────────────────────────
function fyStartWeek(y) { const m = G.level === "nation" ? 9 : J().fy.month; return weekOf(y, m, 1); }
function budgetSeason() {
    const Jx = J();
    const y = yearOf(G.t);
    // The next fiscal year start on or after now.
    let start = fyStartWeek(y);
    if (start < G.t) start = fyStartWeek(y + 1);
    const fy = yearOf(start) + (J().fy.month === 0 && G.level !== "nation" ? 0 : 1);
    const open = start - 13, due = start - 7;
    const B = Jx.budget || (Jx.budget = { status: "closed" });
    if (G.t === open && B.fy !== fy) {
        Jx.budget = { fy, status: "drafting", due, start, depts: Object.assign({}, Jx.depts), rates: Jx.fin.lines.map((l) => l.rate), pensionPay: Jx.fin.pensionPay, draw: 0, tries: 0 };
        queueScene("budget_open");
    }
    const b = Jx.budget;
    if (!b || b.fy !== fy) return;
    if (b.status === "drafting" && G.t >= b.due) { log(`Your budget office sends the ${bodyShort()} a current-services budget for FY${b.fy}.`, "warn"); submitBudget(true); }
    if (b.status === "submitted" && G.t >= b.vote) voteBudget();
    if (["drafting", "submitted", "rejected"].includes(b.status) && G.t >= b.start) {
        b.status = "lapsed"; Jx.fin.cr = true;
        if (G.level === "nation") { G.shutdown = true; queueScene("shutdown"); }
        else { log(`FY${b.fy} begins without a budget. Departments run at last year's levels; rating agencies take note.`, "bad"); G.approval -= 3; queueScene("budget_lapsed"); }
    }
}
// Apply the draft temporarily to see what it costs.
function withDraft(fn) {
    const Jx = J(), b = Jx.budget;
    const keep = { depts: Jx.depts, rates: Jx.fin.lines.map((l) => l.rate), pp: Jx.fin.pensionPay };
    Jx.depts = b.depts; Jx.fin.lines.forEach((l, i) => { l.rate = b.rates[i]; }); Jx.fin.pensionPay = b.pensionPay;
    try { return fn(); } finally { Jx.depts = keep.depts; Jx.fin.lines.forEach((l, i) => { l.rate = keep.rates[i]; }); Jx.fin.pensionPay = keep.pp; }
}
function draftNumbers() {
    const Jx = J(), b = Jx.budget;
    return withDraft(() => {
        const R = revenue(Jx), S = spending(Jx);
        return { R, S, draw: b.draw, gap: R + b.draw - S };
    });
}
const drawMax = () => Math.max(0, J().fin.reserve * 0.5);
function submitBudget(auto) {
    const b = J().budget;
    if (!auto && mustBalance() && draftNumbers().gap < -J().fin.base * 0.001) return `The ${bodyShort()} can't legally pass an unbalanced budget. Close the gap first.`;
    if (auto && mustBalance()) { // Staff balance it with the reserve and across-the-board trims.
        let n = draftNumbers();
        if (n.gap < 0) { b.draw = Math.min(drawMax(), -n.gap); n = draftNumbers(); }
        if (n.gap < 0) { const f = clamp(-n.gap / J().fin.base, 0, 0.1); Object.keys(b.depts).forEach((k) => { b.depts[k] = clamp(b.depts[k] - f, 0.7, 1.3); }); }
    }
    b.status = "submitted"; b.vote = G.t + 3; b.tries++;
    log(`The FY${b.fy} budget goes to the ${bodyShort()}.`, "info");
    return "";
}
// How a member sees the budget: their bloc's priorities, taxes, cuts, their own asks and you.
function budgetScore(p) {
    const b = J().budget;
    if (!b || !b.depts) return 0;
    // Budgets almost always pass in the end: members grumble about pieces, not the whole.
    let s = 0.45;
    const d = (k) => (b.depts[k] != null ? b.depts[k] - 1 : 0);
    const left = -p.ideo;
    if (G.level === "city") s += left * (d("housing") * 3 + d("transit") * 2 + d("parks") - d("police") * 3) + (-left) * (d("police") * 3 - d("housing"));
    else if (G.level === "state") s += left * (d("medicaid") * 2 + d("humansvc") * 2 + d("k12")) + (-left) * (d("corrections") * 2 - d("medicaid") * 2);
    else s += left * (d("health") * 2 + d("hud") * 2 + d("education") * 2 - d("defense")) + (-left) * (d("defense") * 2 - d("hud") * 2 - d("education"));
    const taxUp = J().fin.lines.reduce((s, l, i) => s + ((b.rates[i] || 1) - 1) * l.share, 0);
    s -= taxUp * (p.ideo + 0.6) * 8;
    const dv = Object.values(b.depts);
    const cuts = sum(dv, (v) => Math.min(0, v - 1)) / Math.max(1, dv.length);
    s += cuts * (p.bloc === "mach" || p.bloc === "lib" ? 9 : p.ideo < 0 ? 6 : -3);
    if (b.pensionPay < 1) s -= 0.15;
    s += p.loyal / 100 * 0.8 + (p.party === G.me.party ? 0.3 : -0.3) * partisan();
    G.demands.filter((x) => x.who === p.id && x.kind === "budget" && b.depts[x.dept] != null).forEach((x) => { s += (b.depts[x.dept] - 1) * 6; });
    s += ((hash(p.id + "budget" + b.fy) % 100) / 100 - 0.5) * 0.4;
    return s;
}
function budgetTally() {
    return J().body.chambers.map((ch) => {
        const ms = ch.members.map(P).filter((p) => p && !p.noVote);
        let yes = ms.filter((p) => budgetScore(p) > 0).length;
        const total = ms.length + (J().body.mayorVotes ? 1 : 0);
        if (J().body.mayorVotes) yes++;
        const need = G.level === "nation" && ch.short === "Senate" ? 60 : Math.floor(total / 2) + 1;
        return { ch, yes, total, need, pass: yes >= need };
    });
}
function voteBudget() {
    const Jx = J(), b = Jx.budget;
    const r = budgetTally();
    if (r.every((x) => x.pass)) {
        Jx.depts = Object.assign({}, b.depts);
        Jx.fin.lines.forEach((l, i) => { l.rate = b.rates[i]; });
        Jx.fin.pensionPay = b.pensionPay;
        if (b.draw) { Jx.fin.reserve -= b.draw; }
        b.status = "passed"; Jx.fin.cr = false; G.shutdown = false;
        const taxUp = sum(Jx.fin.lines, (l) => (l.rate - 1) * l.share);
        if (taxUp > 0.005) { groupsReact(["taxup"], taxUp * 40); G.approval -= taxUp * 60; }
        if (taxUp < -0.005) { groupsReact(["taxdown"], -taxUp * 40); G.approval += -taxUp * 30; }
        log(`The FY${b.fy} budget passes (${r.map((x) => `${x.ch.short} ${x.yes}–${x.total - x.yes}`).join(", ")}).`, "good");
        toast(`FY${b.fy} budget passes`, r.map((x) => `${x.ch.short} ${x.yes}–${x.total - x.yes}`).join(" · "), []);
        bodyMembers().forEach((p) => { if (budgetScore(p) < -0.4) p.grudge += 0.5; });
    } else {
        b.status = "rejected";
        log(`The ${bodyShort()} rejects your FY${b.fy} budget (${r.map((x) => `${x.ch.short} ${x.yes}–${x.total - x.yes}`).join(", ")}).`, "bad");
        G.approval -= 1;
        queueScene("budget_rejected", {});
    }
}

// ── Intrigue and events ─────────────────────────────────────────────
function monthIntrigue() {
    const Jx = J();
    // Federal investigators circle favors and bad hires.
    const staffRisk = sum(Object.values(Jx.team).map(P).filter(Boolean), (p) => p.scandal || 0);
    if ((G.flags.probe || 0) > 0 && chance(0.12 * G.flags.probe)) { G.flags.probe = 0; queueScene("probe"); }
    else if (chance(0.02 + staffRisk * 0.04 + G.heat / 600)) queueScene("staff_scandal");
    // A rival makes a move.
    if (G.flags.rival && !G.flags.rivalOut && chance(0.15)) { G.flags.rivalOut = G.flags.rival; queueScene("rival"); }
    // A council investigation of your administration.
    const hostile = bodyMembers().filter((p) => p.loyal < -25).length / Math.max(1, bodyMembers().length);
    if (hostile > 0.4 && G.heat > 15 && chance(0.12)) queueScene("investigation");
    // Recall drives where the law allows them.
    if (G.level === "city" && Jx.recall && G.approval < 33 && !G.race && !G.flags.recall && G.t > 26 && chance(0.1)) { G.flags.recall = G.t; queueScene("recall_start"); }
    if (G.flags.recallVote && G.t >= G.flags.recallVote) { G.flags.recallVote = 0; queueScene("recall_vote"); }
    // The overseers.
    if (G.level === "city") {
        if (chance(meddleOdds(G.gov, STATE().hostile))) queueScene(pick(GOV_SCENES));
        if (chance(meddleOdds(G.pres, 0.55) * 0.6)) queueScene(pick(PRES_SCENES_CITY));
    } else if (G.level === "state") {
        if (chance(meddleOdds(G.pres, 0.5) * 0.7)) queueScene(pick(PRES_SCENES_STATE));
        if (chance(0.25)) queueScene("mayor_ask");
    } else if (chance(0.3)) queueScene(pick(NATION_SCENES));
}
// Disasters, violence, strikes and the city's own crises.
function monthEvents() {
    const p = G.level === "city" ? 0.75 : 0.7;
    if (!chance(p)) return;
    const m = monthOf(G.t);
    const pool = [];
    const add = (id, w, args) => { if (SCENES[id] && !(G.seen[id] && G.t - G.seen[id] < 40)) pool.push({ id, w, args }); };
    const hz = G.level === "city" ? CITY().hazards : G.level === "state" ? HAZ_STATE[CITY().st] || [] : ["hurricane", "wildfire", "flood", "quake"];
    hz.forEach((h) => {
        const season = HAZARD_SEASON[h];
        const inSeason = !season || season.includes(m);
        if (inSeason) add("hz_" + h, h === "quake" || h === "earthquake" || h === "tsunami" || h === "volcano" ? 0.25 : 1);
    });
    add("shooting", 1.1); add("police_shooting", 0.6); add("mass_shooting", 0.3); add("strike", 0.5); add("company", 0.6); add("protest", 0.5);
    add("viral", 0.5); add("hz_recession", (J().dep || 10) / 45); add("leak", 0.4); add("overdoses", 0.4); add("infrastructure", 0.6); add("ice_raid", G.pres && G.pres.party !== G.me.party ? 0.5 : 0.15);
    if (G.level === "city") { (CITY().scenes || []).forEach((id) => add(id, 1.3)); add("council_feud", 0.6); add("development", 0.6); }
    if (G.level === "state") { add("st_prison", 0.6); add("st_session", 0.7); add("st_rural", 0.6); add("st_redistrict", 0.25); }
    if (G.level === "nation") { add("nat_foreign", 1); add("nat_court", 0.6); add("nat_debt", 0.4); add("nat_recession", 0.25); }
    if (!pool.length) return;
    const e = weightedPick(pool, (x) => x.w);
    G.seen[e.id] = G.t;
    queueScene(e.id, e.args || {});
}
const HAZARD_SEASON = { hurricane: [5, 6, 7, 8, 9, 10], heat: [5, 6, 7, 8], blizzard: [11, 0, 1, 2], ice: [11, 0, 1], freeze: [0, 1], snow: [11, 0, 1], lake: [10, 11, 0], tornado: [2, 3, 4, 5], flood: [2, 3, 4, 5, 6, 7, 8], wildfire: [5, 6, 7, 8, 9], smoke: [6, 7, 8], drought: [4, 5, 6, 7], dust: [5, 6, 7] };
const HAZ_STATE = { GA: ["hurricane", "tornado", "heat"], AZ: ["heat", "wildfire", "drought"], WI: ["blizzard", "tornado", "flood"], PA: ["flood", "blizzard"], NV: ["heat", "wildfire"], MI: ["blizzard", "flood", "tornado"], CA: ["wildfire", "quake", "flood"], WA: ["wildfire", "quake", "flood"], OR: ["wildfire", "ice", "quake"], TX: ["hurricane", "freeze", "flood", "heat"], IL: ["blizzard", "tornado", "flood"], LA: ["hurricane", "flood"], HI: ["hurricane", "wildfire", "tsunami"], MN: ["blizzard", "tornado"], NY: ["blizzard", "flood", "hurricane"], RI: ["hurricane", "blizzard"], ME: ["blizzard", "flood"], VT: ["flood", "blizzard"], AK: ["quake", "wildfire", "blizzard"], NM: ["wildfire", "drought", "heat"] };

// ── Elections ───────────────────────────────────────────────────────
const electionWeek = (y) => weekOf(y, 10, 2);
// Which offices are on the ballot when.
function electionClock() {
    const y = yearOf(G.t);
    // Your own reelection.
    const myYear = myElectionYear();
    if (myYear && y === myYear && !G.race && G.t === electionWeek(y) - 30) startReelection();
    // Running for higher office.
    if (G.level === "city" && G.terms >= 2 && !G.race && STATE().govYears.includes(y) && G.t === weekOf(y, 1, 1) && myYear !== y) queueScene("offer_governor");
    if (G.level === "city" && G.terms >= 2 && !G.race && STATE().govYears.includes(y) && myYear === y && G.t === electionWeek(y) - 31) queueScene("offer_governor");
    if (G.level === "state" && G.t - G.levelSince > 40 && !G.race && NATION.presYears.includes(y + 1) && G.t === weekOf(y, 3, 1)) queueScene("offer_president");
    // Legislative and congressional elections.
    if (G.t === electionWeek(y) && y % 2 === 0 && G.level !== "city") bodyElection();
    if (G.race) raceClock();
    // Inauguration.
    if (G.pendingOffice && G.t >= G.pendingOffice.t) takeHigherOffice();
    // Leaving office at the end of the term without a next job.
    if (G.leaving && G.t >= G.leaving) gameOver(G.leavingWhy || "Your time in office is over.");
}
function myElectionYear() {
    const since = yearOf(G.levelSince || 0);
    const term = G.level === "city" ? J().term : G.level === "state" ? STATE().govTerm : 4;
    const yrs = G.level === "nation" ? NATION.presYears : G.level === "state" ? STATE().govYears : null;
    if (yrs) return yrs.find((y) => y >= since + term - 1 && y > since) || null;
    return (G.cityStart || 2026) + term * G.termsHere - 1;
}
function termLimited() {
    const lim = G.level === "city" ? J().limit : G.level === "state" ? STATE().limit : 2;
    return lim > 0 && G.termsHere >= lim;
}
function startReelection() {
    const y = yearOf(G.t);
    if (termLimited()) {
        G.leaving = electionWeek(y) + 8;
        G.leavingWhy = `You are term-limited. Your ${G.level === "city" ? "final term as mayor" : G.level === "state" ? "final term as governor" : "second term as president"} ends.`;
        queueScene("term_limited");
        return;
    }
    const office = G.level === "city" ? "mayor" : G.level === "state" ? "governor" : "president";
    const partisan = G.level !== "city" || ["philadelphia", "nyc", "providence", "buffalo", "burlington"].includes(G.cityK);
    G.race = { office, reelect: true, partisan, rounds: partisan ? [{ k: "primary", t: electionWeek(y) - 20, label: `${partyAdj(G.me.party)} primary` }, { k: "general", t: electionWeek(y), label: "General election" }] : [{ k: "first", t: electionWeek(y), label: "First round" }, { k: "runoff", t: electionWeek(y) + 4, label: "Runoff" }], i: 0, opp: makeOpponents(office, partisan), mom: 0, ends: {}, ads: 0 };
    queueScene("campaign_start");
}
function makeOpponents(office, partisan) {
    const out = [];
    const rival = G.flags.rivalOut && P(G.flags.rivalOut);
    const lean = G.level === "city" ? J().lean / 100 : 0;
    const same = { name: rival ? rival.name : personName(), party: G.me.party, ideo: clamp(G.me.ideo + (G.me.ideo > lean ? -0.5 : 0.5), -1, 1), q: rnd(38, 52) + (rival ? 4 : 0), from: rival ? `${rival.role || rival.seat}` : pick(["a former police chief", "a progressive organizer", "a wealthy businessman", "a state senator", "a council member", "a former news anchor"]) };
    out.push(same);
    if (partisan || G.level !== "city") out.push({ name: personName(), party: G.me.party === "D" ? "R" : "D", ideo: G.me.party === "D" ? rnd(0.4, 0.8) : rnd(-0.7, -0.3), q: rnd(44, 54), from: pick(["a businessman", "a former congressman", "a county executive", "a state attorney general", "a sheriff", "a celebrity"]), general: true });
    return out;
}
// Polling: where the race stands this week.
function pollShare(opp) {
    const r = G.race;
    const groupsFor = Object.entries(r.ends).filter(([, v]) => v).length;
    let me = G.approval * 0.6 + 20 + groupsFor * 1.6 + r.mom + Math.min(8, Math.log10(1 + G.funds / 1e5) * 2) + (r.reelect ? 2 : 0) + (r.debate || 0);
    // Incumbents rarely lose their own party's primary.
    if (r.reelect && !opp.general) me += 7;
    let them = opp.q + Math.abs(opp.ideo - (G.level === "city" ? J().lean / 100 : 0)) * -6 + 8;
    if (opp.general) {
        // Partisan lean of the electorate.
        const lean = r.office === "president" ? nationalLean() : r.office === "governor" ? STATE().lean : J().lean / 2;
        const tilt = (G.me.party === "D" ? -lean : lean) * 0.9;
        me += tilt; them -= tilt;
        if (r.office !== "president" && G.pres.party === G.me.party && [2026, 2030, 2034].includes(yearOf(G.t))) me -= 3;
    }
    const share = 100 * me / (me + Math.max(1, them));
    return clamp(share, 8, 92);
}
function raceClock() {
    const r = G.race;
    const round = r.rounds[r.i];
    if (!round) return;
    if (G.t === round.t) {
        const opp = round.k === "general" ? r.opp.find((o) => o.general) : r.opp.find((o) => !o.general);
        if (!opp) { r.i++; return; }
        let share = pollShare(opp) + rnd(-3, 3);
        let won = share > 50, them = 100 - share, note = "";
        // Nonpartisan first rounds have a field: win a majority outright or make the top two.
        if (round.k === "first") {
            const field = rnd(8, 18);
            share = share * (100 - field) / 100; them = them * (100 - field) / 100;
            won = share > 50;
            if (!won) note = ` Nobody topped 50%: a runoff against ${opp.name}.`;
        }
        // Presidents are chosen by the Electoral College.
        if (r.office === "president" && round.k === "general") { const ec = electoralCollege(share); won = ec.mine >= 270; note = ` Electoral votes: ${ec.mine}–${538 - ec.mine}.`; }
        r.results = r.results || [];
        r.results.push({ label: round.label, me: share, them, opp: opp.name, won });
        log(`${round.label}: ${fmt(share, 1)}% to ${fmt(them, 1)}% against ${opp.name}.${note}`, won ? "good" : "info");
        if (round.k === "first") { if (won) { r.i = r.rounds.length; return raceWon(); } r.i++; queueScene("race_round", { label: round.label, share, runoff: true }); return; }
        if (!won) return raceLost(round, share);
        r.i++;
        if (r.i >= r.rounds.length) return raceWon();
        queueScene("race_round", { label: round.label, share });
    }
}
function raceWon() {
    const r = G.race;
    G.race = null;
    if (r.reelect) {
        G.terms++; G.termsHere++;
        G.honeymoon = 12;
        G.approval += 4;
        G.flags.rival = null; G.flags.rivalOut = null;
        queueScene("reelected");
        if (G.level === "city") councilElection();
        return;
    }
    // A new office. Sworn in in January.
    const y = yearOf(G.t);
    G.pendingOffice = { office: r.office, t: r.office === "president" ? weekOf(y + 1, 0, 20) : weekOf(y + 1, 0, 5) };
    queueScene("won_higher", { office: r.office });
}
function raceLost(round, share) {
    const r = G.race;
    G.race = null;
    if (r.reelect) { gameOver(`You lost the ${round.label.toLowerCase()} with ${fmt(share, 1)}% of the vote.`); return; }
    queueScene("lost_higher", { office: r.office, share });
    // Losing a run for higher office: you keep your current job if it continues.
    // You keep your current job until your term runs out.
    if (termLimited() && myElectionYear() === yearOf(G.t)) { G.leaving = Math.max(G.leaving || 0, G.t + 8); G.leavingWhy = "You lost your run for higher office, and your final term is over."; }
}
function startHigherRace(office) {
    const y = office === "president" ? yearOf(G.t) + 1 : yearOf(G.t);
    const ew = electionWeek(y);
    const rounds = office === "president"
        ? [{ k: "primary", t: weekOf(y, 0, 15), label: "Iowa & New Hampshire" }, { k: "primary2", t: weekOf(y, 2, 3), label: "Super Tuesday" }, { k: "general", t: ew, label: "General election" }]
        : [{ k: "primary", t: weekOf(y, 7, 4), label: `${partyAdj(G.me.party)} primary for governor` }, { k: "general", t: ew, label: "General election for governor" }];
    const opp = [{ name: personName(), party: G.me.party, ideo: clamp(G.me.ideo + rnd(-0.5, 0.5), -1, 1), q: rnd(40, 52), from: office === "president" ? pick(["a senator", "a governor", "a billionaire", "a former cabinet secretary"]) : pick(["the attorney general", "a congressman", "a state senator", "the lieutenant governor"]) },
        { name: personName(), party: G.me.party === "D" ? "R" : "D", ideo: G.me.party === "D" ? rnd(0.4, 0.85) : rnd(-0.8, -0.3), q: rnd(45, 55), from: office === "president" ? "the other party's nominee" : "the other party's nominee", general: true }];
    if (office === "president") rounds[1].k = "primary";
    G.race = { office, reelect: false, partisan: true, rounds, i: 0, opp, mom: 0, ends: {}, ads: 0 };
}
// The Electoral College, for presidential generals.
const EC = { AL: [9, 15], AK: [3, 8], AZ: [11, 2], AR: [6, 16], CA: [54, -13], CO: [10, -4], CT: [7, -7], DE: [3, -7], DC: [3, -38], FL: [30, 5], GA: [16, 2], HI: [4, -14], ID: [4, 18], IL: [19, -5], IN: [11, 9], IA: [6, 6], KS: [6, 9], KY: [8, 15], LA: [8, 11], ME: [4, -2], MD: [10, -14], MA: [11, -14], MI: [15, 1], MN: [10, -1], MS: [6, 10], MO: [10, 9], MT: [4, 10], NE: [5, 9], NV: [6, 1], NH: [4, -1], NJ: [14, -4], NM: [5, -3], NY: [28, -8], NC: [16, 3], ND: [3, 18], OH: [17, 6], OK: [7, 19], OR: [8, -6], PA: [19, 1], RI: [4, -8], SC: [9, 8], SD: [3, 15], TN: [11, 14], TX: [40, 6], UT: [6, 11], VT: [3, -16], VA: [13, -2], WA: [12, -8], WV: [4, 21], WI: [10, 0], WY: [3, 23] };
function nationalLean() { return 0; }
function electoralCollege(natShare) {
    // natShare is your national two-party share; each state shifts by its lean.
    let mine = 0;
    const map = {};
    Object.entries(EC).forEach(([st, [ev, lean]]) => {
        let s = natShare + (G.me.party === "D" ? -lean : lean) / 2 + (st === CITY().st ? 3 : 0) + rnd(-1.5, 1.5);
        map[st] = s; if (s > 50) mine += ev;
    });
    return { mine, map };
}

// ── Promotions ──────────────────────────────────────────────────────
function takeHigherOffice() {
    const o = G.pendingOffice.office;
    G.pendingOffice = null;
    G.leaving = null;
    const prev = { level: G.level, name: J().name, approval: Math.round(G.approval), perf: Math.round(performance()), laws: J().laws.map((l) => POLICY[l.k] ? POLICY[l.k].n : l.k) };
    G.past = (G.past || []).concat([prev]);
    if (o === "governor") becomeGovernor(); else becomePresident();
}
function becomeGovernor() {
    const St = STATE(), stK = CITY().st;
    G.level = "state"; G.levelSince = G.t; G.termsHere = 1; G.terms++;
    const cityM = fullCityM(G.cityK);
    const m = {}; MKEYS.forEach((k) => { m[k] = clamp(cityM[k] + ({ housing: 14, homeless: 12, safety: 10, transit: -8, trust: 5 }[k] || 0) - St.lean * 0.1, 15, 85); });
    const noIncome = ["TX", "NV", "WA", "AK"].includes(stK);
    const lines = stK === "AK" ? [["Oil & gas revenue", 0.55, "council"], ["Permanent Fund earnings", 0.3, "none"], ["Fees & other", 0.15, "council"]]
        : stK === "NM" ? [["Oil & gas revenue", 0.35, "none"], ["Gross receipts tax", 0.3, "council"], ["Personal income tax", 0.18, "council"], ["Other", 0.17, "council"]]
        : noIncome ? [["Sales tax", 0.55, "council"], ["Business taxes", 0.18, "council"], ["Fees & other", 0.27, "council"]]
        : [["Personal income tax", 0.45, "council"], ["Sales tax", 0.3, "council"], ["Corporate tax", 0.07, "council"], ["Fees & other", 0.18, "council"]];
    G.J = { kind: "state", name: St.name, pop: St.pop, lean: -St.lean * 2, dep: { AK: 35, NV: 25, HI: 25, LA: 20, NM: 22, TX: 15, MI: 18, WA: 14 }[stK] || 12, prio: [], m: Object.assign({}, m), m0: Object.assign({}, m), shock: {}, depts: {}, fin: makeFinance(St.budget, 0.02, lines.map(([n, share, ctl]) => ({ n, share, ctl, rate: 1 })), { pension: 0.7, debt: 0.4, reserve: St.rainy, rating: "AA" }), groups: {}, team: {}, laws: [], fy: { month: stK === "NY" ? 3 : stK === "TX" ? 8 : stK === "MI" ? 9 : 6 }, issues: St.issues.map((x) => [x, x, "economy"]) };
    DEPTS.state.forEach((d) => { G.J.depts[d.k] = 1; });
    initEcon(G.J, stateInds(stK));
    const gk = Object.assign({}, St.groups, { police: 0.8, unions: 1, business: 1, progressives: 0.8 });
    Object.keys(gk).forEach((k) => { if (GROUPS[k]) G.J.groups[k] = { w: gk[k], l: 50 + rint(-5, 5) }; });
    G.gov = null;
    makeBody(G.J); makeTeamCandidates();
    G.demands = []; G.bills = []; G.honeymoon = 26; G.approval = Math.max(50, G.approval);
    G.career.push({ t: G.t, office: `Governor of ${St.name}` });
    log(`You are sworn in as governor of ${St.name}.`, "good");
    queueScene("sworn_governor");
}
function becomePresident() {
    G.level = "nation"; G.levelSince = G.t; G.termsHere = 1; G.terms++;
    const m = Object.fromEntries(MKEYS.map((k) => [k, 50 + rint(-6, 6)]));
    G.J = { kind: "nation", name: "the United States", pop: 340e6, lean: 0, dep: 8, prio: [], m: Object.assign({}, m), m0: Object.assign({}, m), shock: {}, depts: {}, fin: makeFinance(NATION.revenue, 0.32, [["Individual income tax", 0.5, "council"], ["Payroll taxes", 0.34, "none"], ["Corporate tax", 0.1, "council"], ["Tariffs & other", 0.06, "council"]].map(([n, share, ctl]) => ({ n, share, ctl, rate: 1 })), { pension: 0.9, debt: 7, reserve: 0, rating: "AA+" }), groups: {}, team: {}, laws: [], fy: { month: 9 }, issues: [["The national debt", "", "services"], ["The cost of living", "", "housing"], ["Crime", "", "safety"]] };
    G.J.fin.debt = NATION.debt;
    DEPTS.nation.forEach((d) => { G.J.depts[d.k] = 1; });
    initEcon(G.J, NATION_INDS);
    ["unions", "business", "police", "progressives", "faith", "latino", "rural", "suburbs", "tech", "energy", "military", "environment", "retirees", "teachers", "evangelicals"].forEach((k) => { if (GROUPS[k]) G.J.groups[k] = { w: 1, l: 50 + rint(-5, 5) }; });
    // Your coattails decide Congress.
    const swing = (G.approval - 50) / 4;
    const myD = G.me.party === "D";
    const hD = clamp(215 + (myD ? swing : -swing) * 3, 180, 260), sD = clamp(47 + (myD ? swing : -swing) * 0.6, 40, 58);
    G.congress = { house: ["House of Representatives", 435, Math.round(hD >= 218 ? hD : 435 - hD), hD >= 218 ? "D" : "R"], senate: ["Senate", 100, Math.round(sD >= 50 ? sD : 100 - sD), sD >= 50 ? "D" : "R"] };
    G.pres = null;
    makeBody(G.J); makeTeamCandidates();
    G.demands = []; G.bills = []; G.honeymoon = 30; G.approval = Math.max(52, G.approval);
    G.career.push({ t: G.t, office: "President of the United States" });
    log("You take the oath of office as President of the United States.", "good");
    queueScene("sworn_president");
}
// Council turnover at your reelection; legislative and congressional elections every two years.
function councilElection() {
    bodyMembers().forEach((p) => {
        if (p.role === "Council President" && p.id === G.flags.rival) return;
        if (chance(0.22)) { const fresh = makePerson({ bloc: p.bloc, party: p.party, body: p.body, ch: p.ch, seat: p.seat, area: p.area }); replaceMember(p, fresh); }
    });
    log(`New ${CITY().council.member.toLowerCase()}s are sworn in after the election.`, "info");
}
function bodyElection() {
    const ms = bodyMembers();
    const myParty = G.me.party;
    const swing = (G.approval - 50) / 100 - (G.level === "nation" && [2026, 2030, 2034, 2038].includes(yearOf(G.t)) ? 0.05 : 0);
    let flips = 0;
    ms.forEach((p) => {
        if (p.ch === 1 && chance(0.66)) return; // Senators serve staggered terms.
        const flipOdds = 0.05 + Math.abs(swing) * 0.4;
        if ((p.party === myParty) === (swing < 0) && chance(flipOdds)) {
            const party = p.party === "D" ? "R" : "D";
            const bloc = party === "D" ? pick(["lib", "lib", "mod", "prog"]) : pick(["con", "con", "freedom", "rural"]);
            replaceMember(p, makePerson({ bloc, party, body: p.body, ch: p.ch, seat: p.seat, area: p.area })); flips++;
        } else if (chance(0.12)) replaceMember(p, makePerson({ bloc: p.bloc, party: p.party, body: p.body, ch: p.ch, seat: p.seat, area: p.area }));
    });
    J().body.chambers.forEach((c) => {
        const ms2 = c.members.map(P);
        const d = ms2.filter((p) => p.party === "D").length;
        c.party = d > ms2.length / 2 ? "D" : "R";
    });
    queueScene("midterms", { flips });
}
function replaceMember(old, fresh) {
    const Jx = J();
    Jx.body.chambers.forEach((c) => { const i = c.members.indexOf(old.id); if (i >= 0) c.members[i] = fresh.id; });
    if (old.role) fresh.role = old.role;
    Object.entries(Jx.body.chairs).forEach(([k, id]) => { if (id === old.id) Jx.body.chairs[k] = fresh.id; });
    ["pres", "senLead", "minority"].forEach((k) => { if (Jx.body[k] === old.id) Jx.body[k] = fresh.id; });
    delete G.people[old.id];
}

// ── The end ─────────────────────────────────────────────────────────
function legacyScore() {
    const past = G.past || [];
    const perf = sum(past, (x) => x.perf) + performance();
    const ladder = { city: 1, state: 2, nation: 3 }[G.level];
    return Math.round(clamp(40 + perf * 1.5 + ladder * 12 + (G.terms - 1) * 6 + (G.approval - 50) * 0.3, 0, 100));
}
function gameOver(why) {
    G.over = { why, t: G.t, score: legacyScore() };
    log(why, "bad");
    save();
}
