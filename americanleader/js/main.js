// American Leader: wiring. Every button has data-act; this routes it.

const ACT = {};
const A = (n, f) => { ACT[n] = f; };

// ── Setup ───────────────────────────────────────────────────────────
A("newGame", () => { G = null; renderCities(); showScreen("cities"); });
A("continueGame", () => { if (load()) { view = "office"; render(); } });
A("screen", (el) => showScreen(el.dataset.s));
A("pickCity", (el) => { ui.cityK = el.dataset.k; renderDossier(); });
A("toCreator", () => { ui.creator = creatorDefaults(); renderCreator(); });
A("randName", () => { ui.creator.name = `${pick(FIRST)} ${pick(LAST)}`; renderCreator(); });
A("cset", (el) => { ui.creator[el.dataset.k] = el.dataset.v; renderCreator(); });
A("cage", (el) => { ui.creator.age = clamp(ui.creator.age + +el.dataset.d, 25, 80); renderCreator(); });
A("cideo", (el) => { ui.creator.ideo = clamp(Math.round((ui.creator.ideo + +el.dataset.d) * 10) / 10, -1, 1); renderCreator(); });
A("cskill", (el) => { const c = ui.creator, k = el.dataset.k, d = +el.dataset.d; const tot = sum(Object.values(c.skills)); if (d > 0 && tot >= SKILL_POINTS) return; c.skills[k] = clamp(c.skills[k] + d, 0, 5); renderCreator(); });
A("ctrait", (el) => { const c = ui.creator, k = el.dataset.k; if (c.traits.includes(k)) c.traits = c.traits.filter((x) => x !== k); else if (c.traits.length < 2) c.traits.push(k); renderCreator(); });
A("look", (el) => { const c = ui.creator, k = el.dataset.k; const opts = LOOK_ALLOWED[k] || LOOK_OPTIONS[k].map((_, i) => i); const i = opts.indexOf(c.look[k] || 0); c.look[k] = opts[(i + +el.dataset.d + opts.length) % opts.length]; renderCreator(); });
A("toTeam", () => {
    const c = ui.creator;
    const box = document.getElementById("cName"); if (box && box.value.trim()) c.name = box.value.trim();
    const skills = Object.assign({}, c.skills);
    Object.entries(BACKGROUNDS[c.bg].skills || {}).forEach(([k, v]) => { skills[k] = (skills[k] || 0) + v; });
    newGame(ui.cityK, { name: c.name, gender: c.gender, age: c.age, party: c.party, ideo: c.ideo, bg: c.bg, traits: c.traits.slice(), skills, look: Object.assign({}, c.look) });
    renderTeamSetup();
});
A("appointSetup", (el) => { appoint(el.dataset.r, el.dataset.id); renderTeamSetup(); });
A("startPlay", () => { view = "office"; save(); render(); });

// ── Play ────────────────────────────────────────────────────────────
A("next", (el) => advance(+el.dataset.n));
A("view", (el) => { view = el.dataset.v; render(); window.scrollTo(0, 0); });
A("scene", (el) => sceneChoose(+el.dataset.i));
A("grant", (el) => { const ch = grantDemand(el.dataset.id); toast("Done", "", ch); });
A("refuse", (el) => { const ch = refuseDemand(el.dataset.id); toast("Refused", "", ch); });
A("billSel", (el) => { ui.billSel = el.dataset.id; });
A("mfilter", (el) => { ui.memberFilter = el.dataset.k; });
A("lawcat", (el) => { ui.lawCat = el.dataset.k; });
A("lobby", (el) => { toast("", lobby(el.dataset.id, el.dataset.h, ui.billSel), []); });
A("whip", (el) => toast("", whip(el.dataset.id), []));
A("discharge", (el) => toast("", discharge(el.dataset.id), []));
A("water", (el) => { const b = G.bills.find((x) => x.id === el.dataset.id); if (b) { b.water = true; toast("Watered down", "Weaker, but easier to pass.", []); } });
A("withdraw", (el) => { const b = G.bills.find((x) => x.id === el.dataset.id); if (b) { b.stage = "withdrawn"; G.approval -= 0.3; } });
A("position", (el) => { const b = G.bills.find((x) => x.id === el.dataset.id); if (b) { b.position = el.dataset.p; const sp = P(b.sponsor); if (sp) sp.loyal += el.dataset.p === "for" ? 8 : -8; } });
A("introduce", (el) => {
    const pol = POLICY[el.dataset.k];
    if (G.capital < 3 || blocked(pol)) return;
    G.capital -= 3;
    const b = introduce(pol.k, "me");
    ui.billSel = b.id;
    log(`You send the ${b.title} to the ${bodyShort()}.`, "info");
    toast("Bill introduced", `It goes to committee. Whip count: ${tally(b, 0).yes}–${tally(b, 0).no}.`, []);
});
A("applyGrant", (el) => toast("Federal grant", applyGrant(el.dataset.k), []));
A("askState", (el) => { const pol = POLICY[el.dataset.k]; const r = askState(el.dataset.k); if (r) toast(`${STATE().name} capitol`, r, []); });
A("execOrder", (el) => {
    const pol = POLICY[el.dataset.k];
    if (G.capital < 5 || blocked(pol)) return;
    G.capital -= 5;
    const b = introduce(pol.k, "me");
    const out = [];
    enact(b, out);
    bodyMembers().forEach((p) => { if (Math.abs(p.ideo - pol.ideo) > 0.6) p.loyal -= 4; });
    toast("Executive order signed", `${pol.n}. Some on the ${bodyShort()} resent being bypassed.`, b.changes || []);
});
A("repealLaw", (el) => {
    const pol = POLICY[el.dataset.k];
    if (G.capital < 4) return;
    G.capital -= 4;
    repeal(pol.k);
    const ch = groupsReact(pol.tags, -0.6);
    log(`${pol.n} is repealed.`, "warn");
    toast("Repealed", pol.n, ch);
});
// Budget drafting.
A("bdept", (el) => { const b = J().budget; b.depts[el.dataset.k] = clamp(Math.round(((b.depts[el.dataset.k] != null ? b.depts[el.dataset.k] : 1) + +el.dataset.d) * 100) / 100, 0.7, 1.3); });
A("brate", (el) => { const b = J().budget, i = +el.dataset.i; b.rates[i] = clamp(Math.round((b.rates[i] + +el.dataset.d) * 100) / 100, 0.8, 1.3); });
A("bpension", (el) => { J().budget.pensionPay = +el.dataset.v; });
A("bdraw", (el) => { const b = J().budget; const step = Math.max(J().fin.base * 0.005, drawMax() / 8); b.draw = clamp(b.draw + +el.dataset.d * step, 0, drawMax()); });
A("submitBudget", () => { const err = submitBudget(false); if (err) toast("Can't submit", err, []); else toast("Budget sent", `The ${bodyShort()} votes ${dateStr(J().budget.vote)}.`, []); });
// Overseers and the press.
A("ovr", (el) => {
    const o = el.dataset.o === "gov" ? G.gov : G.pres;
    if (!o) return;
    const h = el.dataset.h, diff = o.party !== G.me.party;
    let msg = "", ch = [];
    if (h === "call") { G.capital -= 2; const v = rint(4, 9) + (G.me.skills.negotiation || 0); o.rel = clamp(o.rel + v, -100, 100); msg = `A cordial call. Relations +${v}.`; }
    if (h === "ask") { G.capital -= 4; if (!diff || o.rel > 10 || chance(0.2)) { spendOneTime(-J().fin.base * 0.006); o.rel -= 3; msg = `They send ${money(J().fin.base * 0.006)}.`; } else { o.rel -= 4; msg = "They say no, and leak that you asked."; } }
    if (h === "attack") { o.rel = clamp(o.rel - 12, -100, 100); ch = applyFx({ a: diff ? 1.2 : -1, press: 2 }); if (G.me.traits.includes("fighter")) G.approval += 0.8; msg = diff ? "Your base loves it." : "Attacking your own party's leader raises eyebrows."; }
    if (h === "praise") { o.rel = clamp(o.rel + 7, -100, 100); if (diff) ch = applyFx({ g: { progressives: -2 } }); msg = "They'll remember it."; }
    toast(o.title, msg, ch);
});
A("prio", (el) => {
    const Jx = J(), k = el.dataset.k;
    Jx.prio = Jx.prio || [];
    if (Jx.prio.includes(k)) { Jx.prio = Jx.prio.filter((x) => x !== k); return; }
    if (Jx.prio.length >= 3) { toast("Three priorities max", "Drop one first.", []); return; }
    if (Jx.prioSet && G.capital < 3) { toast("Not enough capital", "Changing priorities costs 3.", []); return; }
    if (Jx.prioSet) G.capital -= 3;
    Jx.prio.push(k);
    if (Jx.prio.length >= 3) Jx.prioSet = true;
    const I = ISSUES.find((x) => x.k === k);
    log(`You make ${I.n.toLowerCase()} a priority.`, "info");
    toast("New priority", `${I.n}: your team is on it, and voters will judge you on it.`, applyFx({ press: 1 }));
});
A("econSel", (el) => { ui.econSel = el.dataset.k; });
A("econSub", (el) => toast("Subsidies", setSubsidy(el.dataset.k, +el.dataset.l), []));
A("econBuild", (el) => toast("Groundbreaking", buildAsset(el.dataset.k, el.dataset.a), []));
A("econStartup", (el) => toast("A local founder", backStartup(el.dataset.k), []));
A("econOffer", (el) => { const p = J().ec.prospects.find((x) => x.id === el.dataset.id); if (p) p.offer[el.dataset.k] = +el.dataset.v; });
A("econVisit", (el) => { if (G.capital < 3) return; G.capital -= 3; queueScene("ceo_visit", { id: el.dataset.id }); });
A("econMakeOffer", (el) => toast("Your offer", makeOffer(el.dataset.id), []));
A("debtIssue", () => toast("Bonds", issueBonds(J().fin.base * 0.02), []));
A("debtPay", () => toast("Debt", payDownDebt(J().fin.base * 0.02), []));
A("presser", () => { G.capital -= 2; toast("Press conference", "", applyFx({ press: 5, a: 0.5 })); });
A("townhall", () => { G.capital -= 3; const k = pick(Object.keys(J().groups)); toast("Town hall", `${GROUPS[k].n} turn out in force.`, applyFx({ a: 1, g: { [k]: 4 } })); });
// Team.
A("fire", (el) => { const id = J().team[el.dataset.r]; delete J().team[el.dataset.r]; const p = P(id); if (p) (p.ties || []).forEach((k) => groupMove(k, -4)); refreshCandidates(el.dataset.r); toast("Fired", p ? `${p.name} is out. A new slate of candidates applies.` : "", []); });
A("search", (el) => { if (G.capital < 1) return; G.capital -= 1; refreshCandidates(el.dataset.r); toast("Search firm", "Three new candidates.", []); });
A("appoint", (el) => { if (G.capital < 2) return; G.capital -= 2; const p = appoint(el.dataset.r, el.dataset.id); G.cands[el.dataset.r] = (G.cands[el.dataset.r] || []).filter((id) => id !== p.id); G.cands[el.dataset.r].push(newCandidate(el.dataset.r)); toast("Appointed", p.name, []); });
// Campaigns.
A("fundraise", () => { G.capital -= 2; const base = G.level === "city" ? 1.5e5 : G.level === "state" ? 1.5e6 : 3e7; const v = base * (1 + (G.me.skills.fundraising || 0) * 0.15) * (0.6 + G.approval / 100); G.funds += v; G.heat += 0.4; toast("Fundraiser", `You raise ${money(v)}.`, []); });
A("rally", () => { const r = G.race; if (!r) return; G.capital -= 2; const v = 0.5 + (G.me.skills.charisma || 0) * 0.15 + (G.me.traits.includes("charismatic") ? 0.3 : 0); r.mom = Math.min(8, r.mom + v); toast("Rally", `A big crowd. Momentum +${fmt(v, 1)}.`, []); });
A("ads", () => { const r = G.race; if (!r) return; const c = Math.max(2e5, G.funds * 0.25); if (G.funds < c) return; G.funds -= c; const v = Math.min(2, Math.log10(1 + c / 1e5)); r.mom = Math.min(10, r.mom + v); toast("Ad buy", `${money(c)} on the air. Momentum +${fmt(v, 1)}.`, []); });
A("debate", () => { const r = G.race; if (!r) return; G.capital -= 3; r.debated = r.i; const v = rnd(-1.5, 3) + (G.me.skills.charisma || 0) * 0.4; r.debate = (r.debate || 0) + v; toast("The debate", v > 1 ? "You won the debate." : v < 0 ? "A rough night." : "A draw.", []); });
A("endorse", (el) => { const r = G.race, k = el.dataset.k, g = J().groups[k]; if (!r || !g) return; G.capital -= 2; if (g.l > 60 || (g.l > 50 && chance(0.5))) { r.ends[k] = true; toast("Endorsement", `${GROUPS[k].n} endorse you.`, []); } else toast("No endorsement", `${GROUPS[k].n} stay neutral.`, []); });

// ── Events ──────────────────────────────────────────────────────────
document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    const f = ACT[el.dataset.act];
    if (!f) return;
    f(el, e);
    if (G && $("#play").classList.contains("active")) { save(); render(); }
});
document.addEventListener("input", (e) => { if (e.target.dataset.in === "cname" && ui.creator) ui.creator.name = e.target.value; });
document.addEventListener("keydown", (e) => {
    if (!G || !$("#play").classList.contains("active") || e.target.tagName === "INPUT") return;
    if (e.key === " ") { e.preventDefault(); if (!G.scenes.length) advance(1); }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9 && G.scenes.length) sceneChoose(n - 1);
});
if (hasSave()) { const b = document.getElementById("continueBtn"); if (b) b.style.display = ""; } else { const b = document.getElementById("continueBtn"); if (b) b.style.display = "none"; }
