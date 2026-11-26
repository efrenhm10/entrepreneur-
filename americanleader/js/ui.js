// American Leader: screens and views.

let view = "office";
const ui = { econSel: null, cityK: null, creator: null, lawCat: "all", memberFilter: "swing", billSel: null, lobbyBill: null };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split(/\n\n/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
function showScreen(id) { document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id)); window.scrollTo(0, 0); }
const hue = (g) => `hsl(${Math.round(clamp(g, 0, 1) * 120)}, 62%, 46%)`;
function meter(label, norm, good, disp, title = "") {
    const g = good ? norm : 1 - norm;
    return `<div class="meter" title="${esc(title)}"><div class="meter-top"><span>${label}</span><b>${disp}</b></div><div class="meter-bar"><i style="width:${clamp(norm, 0, 1) * 100}%;background:${hue(g)}"></i></div></div>`;
}
const panel = (title, body, cls = "") => `<section class="panel ${cls}">${title ? `<h3>${title}</h3>` : ""}${body}</section>`;
const partyDot = (p) => `<i class="dot" style="background:${PARTIES[p] ? PARTIES[p].color : "#888"}"></i>`;
const blocDot = (b) => `<i class="dot" style="background:${BLOCS[b] ? BLOCS[b].color : "#888"}"></i>`;
const sgn = (v, d = 0) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}`;
function relBadge(v) { const cls = v >= 40 ? "rel-good" : v >= 15 ? "rel-ok" : v > -15 ? "rel-neutral" : v > -40 ? "rel-warn" : "rel-bad"; return `<span class="rel ${cls}">${v > 0 ? "+" : ""}${Math.round(v)}</span>`; }
function sparkline(key, color = "#6fb3ff") {
    const pts = (G.hist || []).slice(-260).map((h) => h[key]);
    if (pts.length < 3) return `<svg class="spark"></svg>`;
    const lo = Math.min(...pts), hi = Math.max(...pts), w = 200, h = 30;
    const d = pts.map((v, i) => `${i ? "L" : "M"}${(i / (pts.length - 1)) * w},${h - ((v - lo) / Math.max(1, hi - lo)) * (h - 4) - 2}`).join("");
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="${d}" stroke="${color}" fill="none" stroke-width="1.5"/></svg>`;
}
const fxHint = (fx = {}) => {
    const out = [];
    if (fx.a) out.push(`Approval ${sgn(fx.a)}`);
    if (fx.cap) out.push(`Capital ${sgn(fx.cap)}`);
    if (fx.cost) out.push(fx.cost > 0 ? `Costs ${money(fx.cost * J().fin.base)}` : `Raises ${money(-fx.cost * J().fin.base)}`);
    if (fx.m) Object.entries(fx.m).forEach(([k, v]) => out.push(`${metricName(k, G.level)} ${sgn(v)}`));
    if (fx.g) Object.entries(fx.g).filter(([k]) => J().groups[k]).slice(0, 3).forEach(([k, v]) => out.push(`${GROUPS[k].n} ${sgn(v)}`));
    if (fx.gov && G.gov) out.push(`Governor ${sgn(fx.gov)}`);
    if (fx.pres && G.pres) out.push(`President ${sgn(fx.pres)}`);
    if (fx.body) out.push(`${bodyShort()} ${sgn(fx.body)}`);
    if (fx.heat) out.push(`Scandal ${sgn(fx.heat)}`);
    if (fx.press) out.push(`Press ${sgn(fx.press)}`);
    return out.join(" · ");
};

// ── Setup: title, cities, dossier, creator, team ────────────────────
function renderCities() {
    const cards = Object.entries(CITIES).map(([k, c]) => {
        const St = STATES[c.st];
        const ms = ["safety", "housing", "homeless", "economy", "environment", "trust"].map((m) => meter(METRICS[m].n, c.m[m] / 100, true, c.m[m])).join("");
        return `<button class="country-card" data-act="pickCity" data-k="${k}">
            <div class="cc-head"><span class="flag">${c.icon}</span><div><b>${esc(c.name)}, ${c.st}</b><small>${(c.pop / 1e6 >= 1 ? fmt(c.pop / 1e6, 1) + "M" : Math.round(c.pop / 1e3) + "K")} people · metro ${c.metro}</small></div></div>
            <div class="cc-badges"><span class="badge">${c.form === "council" ? "Council-manager" : "Strong mayor"}</span><span class="badge">${c.council.n}-member ${esc(c.council.short)}</span><span class="badge">Gov: ${partyDot(St.gov)}${St.gov}</span>${c.budget.gap > 0.05 ? `<span class="badge" style="background:#4e1f1f">Budget gap ${Math.round(c.budget.gap * 100)}%</span>` : ""}</div>
            <p class="small muted">${esc(c.blurb)}</p>
            <div class="cc-meters">${ms}</div></button>`;
    }).join("");
    $("#cityList").innerHTML = `<div class="country-grid">${cards}</div>`;
}
function renderDossier() {
    const c = CITIES[ui.cityK], St = STATES[c.st];
    const bl = Object.entries(c.council.blocs);
    const tot = sum(bl, (x) => x[1]);
    const seatbar = `<div class="seatbar">${bl.map(([b, n]) => `<i style="width:${n / tot * 100}%;background:${BLOCS[b].color}" title="${BLOCS[b].name}: ${n}"></i>`).join("")}<span class="majority" style="left:50%"></span></div>`;
    const blocs = bl.map(([b, n]) => `<div class="bloc"><div>${blocDot(b)}<b>${BLOCS[b].name}</b> <span class="muted">${n}</span><p class="tiny muted">${esc(BLOCS[b].desc)}</p></div></div>`).join("");
    const issues = c.issues.map(([n, d, m]) => `<li><b>${esc(n)}</b> <span class="tiny muted">(${METRICS[m].n})</span><br><span class="small">${esc(d)}</span></li>`).join("");
    const groups = Object.entries(c.groups).filter(([k]) => GROUPS[k]).sort((a, b) => b[1] - a[1]).map(([k, w]) => `<span class="badge">${GROUPS[k].i} ${GROUPS[k].n}${w >= 1.2 ? " ★" : ""}</span>`).join(" ");
    const b = c.budget;
    $("#dossier").innerHTML = `<div class="setup-head"><div><div class="kicker">STEP 1 OF 3 · DOSSIER</div><h1>${c.icon} ${esc(c.name)}, ${esc(St.name)}</h1><p class="muted">${esc(c.blurb)}</p></div>
        <div class="row"><button class="secondary" data-act="screen" data-s="cities">← All cities</button><button class="primary big" data-act="toCreator">Build your mayor →</button></div></div>
        <div class="cols3">
            <div>${panel("The city", md(c.long))}${panel("The issues", `<ul>${issues}</ul>`)}</div>
            <div>${panel(`The ${esc(c.council.short)}`, `<p class="small">${c.form === "council" ? `Council-manager system: you are one of ${c.council.n + 1} votes and chair the meetings; a city manager runs departments.` : `Strong mayor: you run the departments and propose the budget.`} ${c.veto ? `You can veto ordinances; overriding you takes ${Math.round(c.veto * 100)}%.` : "You have no veto."} ${c.recall ? "Voters can recall you." : "There is no recall."} Terms are ${c.term} years${c.limit ? `, limit ${c.limit}` : ", no term limit"}.</p>${seatbar}${blocs}`)}
                ${panel("Above you", `<p class="small"><b>${esc(St.name)}</b>: ${esc(St.blurb)}</p><p class="small">Governor: ${partyDot(St.gov)}${PARTIES[St.gov].name} · Legislature: ${St.ctrl === "split" ? "split" : St.ctrl === "coalition" ? "bipartisan coalition" : PARTIES[St.ctrl].name} · How hard the state leans on its cities: ${meter("", St.hostile, false, St.hostile > 0.7 ? "Constant preemption" : St.hostile > 0.4 ? "Frequent" : "Rare")}</p><p class="small">Washington: a ${PARTIES[NATION.president].name} President.</p>`)}</div>
            <div>${panel("The money", `<p class="small">General fund: <b>${money(b.gf)}</b> · structural gap: <b class="${b.gap > 0.05 ? "bad" : ""}">${Math.round(b.gap * 100)}%</b> · pensions ${Math.round(b.pension * 100)}% funded · rating <b>${b.rating}</b></p>${b.rev.map(([n, s, ctl]) => `<div class="row small"><span style="flex:1">${esc(n)}</span><b>${Math.round(s * 100)}%</b><span class="tiny muted">${{ council: "council sets", voter: "voters must approve", state: "needs state law", none: "fixed" }[ctl]}</span></div>`).join("")}`)}
                ${panel("Who has power", groups)}
                ${panel("Hazards", c.hazards.map((h) => `<span class="badge">${h}</span>`).join(" "))}
                ${panel("By the numbers", `<p class="small">${c.stats.homicides} homicides a year · ${c.stats.homelessN.toLocaleString()} homeless · median rent $${c.stats.rent.toLocaleString()} · ${c.stats.unemp}% unemployment</p>`)}</div>
        </div>`;
    showScreen("dossierScreen");
}
function creatorDefaults() {
    const c = CITIES[ui.cityK];
    return { name: `${pick(FIRST)} ${pick(LAST)}`, gender: "m", age: 44, party: c.lean < 10 ? "D" : "R", ideo: c.lean < -50 ? -0.5 : c.lean < 0 ? -0.3 : 0.3, bg: "council", traits: ["charismatic", "dealmaker"], skills: { charisma: 2, negotiation: 2, management: 2, policy: 2, fundraising: 2 }, look: { skin: 2, hairColor: 1, hair: 3, facial: 0, glasses: 0, attire: 0, hairF: 1, attireF: 1 } };
}
const ideoLabel = (v) => v < -0.65 ? "Progressive" : v < -0.25 ? "Liberal" : v < 0.15 ? "Moderate" : v < 0.55 ? "Conservative" : "Hard-right";
const LOOK_ALLOWED = { hair: [0, 1, 2, 3, 4, 5, 6, 7], attire: [0, 1], hairF: [0, 1, 2, 3, 4, 5, 6, 7], attireF: [0, 1, 2] };
function renderCreator() {
    const c = ui.creator;
    const sk = sum(Object.values(c.skills));
    const keys = c.gender === "f" ? ["skin", "hairColor", "hairF", "glasses", "attireF"] : ["skin", "hairColor", "hair", "facial", "glasses", "attire"];
    const looks = keys.map((k) => { const opts = LOOK_ALLOWED[k] || LOOK_OPTIONS[k].map((_, i) => i); const v = c.look[k] || 0; const lbl = k === "skin" || k === "hairColor" ? `<span class="swatch" style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${LOOK_OPTIONS[k][v]}"></span>` : esc(LOOK_OPTIONS[k][v]); return `<div class="look-row"><span>${LOOK_LABELS[k]}</span><span><button class="mini" data-act="look" data-k="${k}" data-d="-1">◀</button><small>${lbl}</small><button class="mini" data-act="look" data-k="${k}" data-d="1">▶</button></span></div>`; }).join("");
    $("#creatorBody").innerHTML = `<div class="setup-head"><div><div class="kicker">STEP 2 OF 3 · ${esc(CITIES[ui.cityK].name.toUpperCase())}</div><h1>Build your mayor</h1><p class="muted">You just won the election. Who are you?</p></div><div class="row"><button class="secondary" data-act="pickCity" data-k="${ui.cityK}">← Dossier</button><button class="primary big" data-act="toTeam" ${sk !== SKILL_POINTS || c.traits.length !== 2 ? "disabled" : ""}>Pick your team →</button></div></div>
    <div class="creator">
        <div>${panel("Portrait", `<div class="row center">${portraitSVG(c.look, c.gender, 150)}</div>${looks}`)}</div>
        <div class="cols2">
            <div>
                ${panel("Who you are", `<div class="row"><input id="cName" value="${esc(c.name)}" style="flex:1;padding:7px;background:var(--bg2);color:var(--text);border:1px solid var(--line2);border-radius:6px" data-in="cname"><button class="mini" data-act="randName">🎲</button></div>
                    <div class="row"><span>Gender</span>${["m", "f"].map((g) => `<button class="chip-btn ${c.gender === g ? "on" : ""}" data-act="cset" data-k="gender" data-v="${g}">${g === "m" ? "Man" : "Woman"}</button>`).join("")}</div>
                    <div class="row"><span>Age</span><button class="mini" data-act="cage" data-d="-1">−</button><b>${c.age}</b><button class="mini" data-act="cage" data-d="1">+</button></div>
                    <div class="row"><span>Party</span>${["D", "R", "I"].map((p) => `<button class="chip-btn ${c.party === p ? "on" : ""}" data-act="cset" data-k="party" data-v="${p}">${partyDot(p)}${PARTIES[p].name}</button>`).join("")}</div>
                    <div class="row"><span>Ideology</span><button class="mini" data-act="cideo" data-d="-0.1">◀</button><b>${ideoLabel(c.ideo)}</b><button class="mini" data-act="cideo" data-d="0.1">▶</button></div>
                    <p class="tiny muted">${CITIES[ui.cityK].lean < -40 ? "This city votes heavily Democratic." : CITIES[ui.cityK].lean > 0 ? "This city leans Republican." : "This city is politically mixed."} Most big-city mayors are nominally nonpartisan, but voters know who you are.</p>`)}
                ${panel(`Skills (${sk}/${SKILL_POINTS})`, Object.entries(SKILLS).map(([k, n]) => `<div class="skill-row"><span>${n}</span><span><button class="mini" data-act="cskill" data-k="${k}" data-d="-1">−</button><b>${c.skills[k]}</b><button class="mini" data-act="cskill" data-k="${k}" data-d="1">+</button></span></div>`).join(""))}
            </div>
            <div>
                ${panel("Background", `<div class="choice-list">${Object.entries(BACKGROUNDS).map(([k, b]) => `<button class="choice ${c.bg === k ? "on" : ""}" data-act="cset" data-k="bg" data-v="${k}"><b>${b.i} ${b.n}</b><p class="tiny">${esc(b.d)} Allies: ${b.allies.map((x) => GROUPS[x] ? GROUPS[x].n : x).join(", ")}${b.enemies.length ? `. Enemies: ${b.enemies.map((x) => GROUPS[x] ? GROUPS[x].n : x).join(", ")}` : ""}.</p></button>`).join("")}</div>`)}
                ${panel(`Traits (${c.traits.length}/2)`, `<div class="choice-list two">${Object.entries(TRAITS).map(([k, t]) => `<button class="choice ${c.traits.includes(k) ? "on" : ""}" data-act="ctrait" data-k="${k}"><b>${t.i} ${t.n}</b><p class="tiny">${esc(t.d)}</p></button>`).join("")}</div>`)}
            </div>
        </div>
    </div>`;
    showScreen("creator");
}
function renderTeamSetup() {
    const R = TEAM[G.level];
    $("#teamBody").innerHTML = `<div class="setup-head"><div><div class="kicker">STEP 3 OF 3</div><h1>${G.level === "city" ? "Your administration" : G.level === "state" ? "Your cabinet" : "Your cabinet"}</h1><p class="muted">Each post adds political capital and improves what it oversees. Their ties to power groups win you friends. Watch for scandal risk.</p></div><button class="primary big" data-act="startPlay">Take office →</button></div>
    <div class="cabinet-grid">${R.map((r) => panel(r.n, `<p class="tiny muted">${esc(r.d)}</p>` + G.cands[r.k].map((id) => { const p = P(id); const on = J().team[r.k] === id; return `<button class="choice ${on ? "on" : ""}" data-act="appointSetup" data-r="${r.k}" data-id="${id}"><b>${esc(p.name)}</b> <span class="stars">${"★".repeat(p.skill)}${"☆".repeat(5 - p.skill)}</span><p class="tiny">${esc(p.blurb)} · ${blocDot(p.bloc)}${BLOCS[p.bloc].name} · ties: ${(p.ties || []).map((k) => GROUPS[k].n).join(", ")}${p.scandal > 0.2 ? ' · <span class="bad">baggage</span>' : ""}</p></button>`; }).join(""))).join("")}</div>`;
    showScreen("team");
}

// ── The game screen ─────────────────────────────────────────────────
function viewsFor() {
    const body = G.level === "city" ? (CITY().council.short === "Board of Supervisors" ? "Supervisors" : CITY().council.short) : G.level === "state" ? "Legislature" : "Congress";
    return [["office", "🏛️", G.level === "city" ? "City Hall" : G.level === "state" ? "Governor's Office" : "Oval Office"], ["issues", "🎯", "Major Issues"], ["economy", "🏭", "Economy"], ["council", "⚖️", body], ["laws", "📜", G.level === "city" ? "Ordinances" : "Laws"], ["budget", "💰", "Budget"], ["place", G.level === "city" ? "🏙️" : "🗺️", G.level === "city" ? "The City" : G.level === "state" ? "The State" : "The Nation"], ["power", "🤝", "Power"], ["team", "👔", G.level === "city" ? "Team" : "Cabinet"], ["campaign", "🗳️", "Campaign"], ["record", "📖", "Record"]];
}
function render() {
    stateFixup();
    if (!G) return;
    if (G.over) { closeScene(); renderFall(); showScreen("fall"); return; }
    if (!$("#play").classList.contains("active")) showScreen("play");
    renderHud(); renderDock(); renderView(); renderScene();
}
function closeScene() { const el = $("#scene"); if (el) { el.innerHTML = ""; el.classList.remove("open"); } }
function renderHud() {
    const Jx = J(), f = Jx.fin;
    const stat = (label, v, cls, tip, act) => `<div class="hstat ${cls || ""} ${act ? "link" : ""}" title="${esc(tip || "")}" ${act ? `data-act="view" data-v="${act}"` : ""}><small>${label}</small><b>${v}</b></div>`;
    const lvl = (v, good, bad) => (v >= good ? "good" : v <= bad ? "bad" : "");
    const bal = balance();
    $("#hud").innerHTML = `
        <div class="hud-left"><div class="hud-portrait">${portraitSVG(G.me.look, G.me.gender, 46)}</div><div><div class="hud-country">${G.level === "city" ? CITY().icon : G.level === "state" ? "🏛️" : "🇺🇸"} ${esc(G.me.name)}</div><div class="hud-leader">${esc(titleOf())} · ${partyDot(G.me.party)}${PARTIES[G.me.party].name}</div></div></div>
        <div class="hud-stats">
            ${stat("Date", dateStr(), "date")}
            ${stat("Approval", Math.round(G.approval) + "%", lvl(G.approval, 55, 38), "How voters rate you")}
            ${stat("Capital", `${Math.floor(G.capital)} <span class="tiny muted">+${fmt(capitalWeekly(), 1)}/wk</span>`, "capital", `Political capital: the clout you spend on bills, deals, lobbying and pitches. +${fmt(capitalWeekly(), 1)} a week (more when your approval is high and your team is full), plus bonuses when you win: a bill signed, a budget passed, a company landed. Max ${capitalCap()}.`)}
            ${stat("Budget", (bal >= 0 ? "+" : "") + money(bal), bal >= 0 ? "good" : "bad", "Projected surplus or deficit this year", "budget")}
            ${G.level === "nation" ? "" : stat("Rainy day", money(f.reserve), f.reserve < 0 ? "bad" : "", "Reserve fund", "budget")}
            ${stat("Debt", money(f.debt), f.debt > f.base * 2 ? "bad" : "", `${G.level === "nation" ? "National" : "Bonded"} debt. Payments: ${money(debtService())} a year. Click for the Budget tab.`, "budget")}
            ${stat("Rating", f.rating, f.ratingScore >= 10 ? "good" : f.ratingScore <= 5 ? "bad" : "", "Credit rating")}
            ${stat(metricName("safety", G.level), Math.round(Jx.m.safety), lvl(Jx.m.safety, 55, 35), "", "place")}
            ${G.heat > 10 ? stat("Scandal", Math.round(G.heat), "bad", "Scandal heat: how much trouble the press smells") : ""}
            ${G.race ? stat("Poll", `${Math.round(pollShare(G.race.opp.find((o) => (G.race.rounds[G.race.i] || {}).k === "general" ? o.general : !o.general) || G.race.opp[0]))}%`, "", "Your share in the current round", "campaign") : ""}
            ${stat("War chest", money(G.funds), "", "Campaign money", "campaign")}
        </div>
        <div class="hud-right">
            <button class="primary" data-act="next" data-n="1">Next week ▶</button>
            <button class="secondary" data-act="next" data-n="4" title="Advance up to 4 weeks (stops for decisions)">+1 mo</button>
            <button class="secondary" data-act="next" data-n="13" title="Advance up to 13 weeks (stops for decisions)">+3 mo</button>
        </div>`;
}
function renderDock() {
    const badge = { council: G.demands.length + G.bills.filter((b) => b.stage === "desk").length, budget: J().budget && ["drafting", "rejected"].includes(J().budget.status) ? "!" : 0, team: TEAM[G.level].filter((r) => !J().team[r.k]).length };
    $("#dock").innerHTML = viewsFor().map(([k, i, n]) => `<button class="${view === k ? "on" : ""}" data-act="view" data-v="${k}">${i} ${n}${badge[k] ? ` <span class="pill">${badge[k]}</span>` : ""}</button>`).join("");
}
function renderView() {
    const fn = { economy: viewEconomy, issues: viewIssues, office: viewOffice, council: viewCouncil, laws: viewLaws, budget: viewBudget, place: viewPlace, power: viewPower, team: viewTeam, campaign: viewCampaign, record: viewRecord }[view] || viewOffice;
    $("#view").innerHTML = fn();
}
function renderScene() {
    const q = G.scenes[0];
    const el = $("#scene");
    if (!q) { el.innerHTML = ""; el.classList.remove("open"); return; }
    let sc;
    try { sc = SCENES[q.id](q.args); } catch (e) { console.error(e); G.scenes.shift(); return renderScene(); }
    el.classList.add("open");
    el.innerHTML = `<div class="scene-card">
        <div class="scene-icon">${sc.icon}</div>
        <div class="kicker">${esc(sc.kicker)}</div>
        <h2>${esc(sc.title)}</h2>
        <div class="scene-text">${md(sc.text)}</div>
        <div class="scene-choices">${sc.choices.map((c, i) => `<button class="choice-btn" data-act="scene" data-i="${i}" ${c.req === false ? "disabled" : ""}>${i + 1}. ${esc(c.t)}${c.hint || fxHint(c.fx) ? `<small>${esc(c.hint || fxHint(c.fx))}</small>` : ""}</button>`).join("")}</div>
        ${G.scenes.length > 1 ? `<p class="tiny muted">${G.scenes.length - 1} more waiting</p>` : ""}
    </div>`;
}
function toast(title, text, changes = []) {
    const box = $("#toasts");
    if (!box) return;
    const el = document.createElement("div");
    el.className = "toast";
    const chips = (changes || []).slice(0, 10).map((c) => `<span class="chg ${c.good ? "good" : "bad"}">${esc(c.label)} ${c.raw ? c.v : (c.v > 0 ? "+" : "") + c.v}</span>`).join("");
    el.innerHTML = `<b>${esc(title)}</b>${text ? `<p>${esc(text)}</p>` : ""}${chips ? `<div>${chips}</div>` : ""}`;
    box.appendChild(el);
    setTimeout(() => el.classList.add("out"), 5200);
    setTimeout(() => el.remove(), 5800);
    while (box.children.length > (window.innerWidth < 700 ? 2 : 3)) box.firstChild.remove();
}

// ── Office ──────────────────────────────────────────────────────────
function advisories() {
    const out = [];
    const Jx = J(), b = Jx.budget;
    if (b && b.status === "drafting") out.push(`💰 Your FY${b.fy} budget is due ${dateStr(b.due)} (Budget tab).`);
    if (b && b.status === "rejected") out.push(b.lapsed ? `💰 Your late FY${b.fy} budget was rejected. Revise and resend it; you're frozen at last year's levels until it passes.` : `💰 The ${bodyShort()} rejected your budget. Revise it before ${dateStr(b.start)}.`);
    if (b && b.lapsed && b.status === "submitted") out.push(`💰 Your late FY${b.fy} budget is with the ${bodyShort()}; the vote is ${dateStr(b.vote)}.`);
    if (Jx.fin.cr) out.push("⏸️ You're running on last year's budget. Pass a new one.");
    if (G.level !== "nation" && G.capital >= 3) { const open = Object.keys(GRANT_PROGRAMS).filter((k) => !grantWait(k) && !(G.grantApps || []).some((a) => a.type === k && a.lvl === G.level)); if (open.length) out.push(`🏗️ Federal grants are open for ${open.map((k) => GRANT_PROGRAMS[k].n.toLowerCase()).join(", ")}. Apply on ${G.level === "city" ? "The City" : "The State"} tab and pick the project when you win.`); }
    const desk = G.bills.filter((x) => x.stage === "desk" && x.sponsor !== "me").length;
    if (desk) out.push(`🖋️ ${desk} bill${desk > 1 ? "s" : ""} on your desk.`);
    if (G.demands.length) out.push(`📞 ${G.demands.length} member${G.demands.length > 1 ? "s" : ""} waiting on an answer (${bodyShort()} tab).`);
    G.bills.filter((x) => x.sponsor === "me" && x.stuck && x.stage === "committee").slice(0, 2).forEach((x) => out.push(`🗄️ The ${x.title} is stuck in committee. Lobby the chair or file a discharge petition.`));
    const vac = TEAM[G.level].filter((r) => !Jx.team[r.k]);
    if (vac.length) out.push(`👔 ${vac.length} post${vac.length > 1 ? "s" : ""} vacant on your team: ${vac.map((r) => r.n).join(", ")}.`);
    if (mustBalance() && balance() < 0) out.push(`💸 You're running a ${money(-balance())} deficit. The reserve covers it until it doesn't.`);
    if (G.approval < 40) out.push("⚠️ Your approval is low. Voters want results on the issues they care about most.");
    if (G.heat > 15) out.push("🕵️ Reporters smell a scandal. Clean house or ride it out.");
    const myY = myElectionYear();
    if (myY && !G.race) out.push(`🗳️ Your next election: November ${myY}${termLimited() ? " (you're term-limited)" : ""}.`);
    if (G.race) out.push(`🗳️ Campaign: ${G.race.rounds[G.race.i] ? G.race.rounds[G.race.i].label + " on " + dateStr(G.race.rounds[G.race.i].t) : ""}.`);
    if (G.capital >= capitalCap() - 2) out.push("💡 Your political capital is maxed out. Spend it.");
    Object.entries(Jx.groups).forEach(([k, g]) => { if (g.l < 25 && g.w >= 1) out.push(`⚠️ ${GROUPS[k].n} are turning against you (${Math.round(g.l)}).`); });
    return out.slice(0, 8);
}
function conditionRows(Jx) {
    const tg = targets(Jx);
    return MKEYS.map((k) => { const v = Jx.m[k], d = v - Jx.m0[k], t = tg[k]; return meter(`${METRICS[k].i} ${metricName(k, G.level)} <span class="tiny ${d >= 0 ? "good" : "bad"}">${sgn(d)}</span> <span class="tiny muted">${t > v + 1 ? "▲" : t < v - 1 ? "▼" : ""}</span>`, v / 100, true, Math.round(v)); }).join("");
}
function viewOffice() {
    const Jx = J(), L = G.me;
    const st = liveStats();
    const issues = (G.level === "city" ? CITY().issues : Jx.issues).map((x) => `<li><b>${esc(x[0])}</b>${x[1] && x[1] !== x[0] ? `<br><span class="tiny muted">${esc(x[1])}</span>` : ""}</li>`).join("");
    const over = [G.gov ? `<div class="minister"><span>${partyDot(G.gov.party)}<b>Gov. ${esc(G.gov.name)}</b></span>${relBadge(G.gov.rel)}</div>` : "", G.pres ? `<div class="minister"><span>${partyDot(G.pres.party)}<b>President ${esc(G.pres.name)}</b></span>${relBadge(G.pres.rel)}</div>` : ""].join("");
    return `<div class="cols3">
        <div>
            ${panel(titleOf(), `<div class="leader-card">${portraitSVG(L.look, L.gender, 96)}<div><b>${esc(L.name)}</b><br><span class="muted">${partyDot(L.party)}${PARTIES[L.party].name} · ${ideoLabel(L.ideo)} · age ${L.age}</span><br>${BACKGROUNDS[L.bg].i} ${BACKGROUNDS[L.bg].n}<br><span class="small">${L.traits.map((t) => TRAITS[t].i + " " + TRAITS[t].n).join(" · ")}</span></div></div>
                ${meter("Approval", G.approval / 100, true, Math.round(G.approval) + "%")}${meter("Press coverage", G.press / 100, true, Math.round(G.press))}${G.heat > 1 ? meter("Scandal heat", Math.min(1, G.heat / 50), false, Math.round(G.heat)) : ""}
                <p class="small">In office ${Math.floor((G.t - (G.levelSince || 0)) / 52)} yrs ${Math.floor(((G.t - (G.levelSince || 0)) % 52) / 4.3)} mo · term ${G.termsHere}${myElectionYear() ? ` · next election ${myElectionYear()}` : ""}</p>`)}
            ${over ? panel("Above you", over + `<p class="tiny muted">Relations shape aid, preemption, troops and takeovers. Work them on the Power tab.</p>`) : ""}
            ${panel("Trends", `<div class="spark-row"><span>Approval</span>${sparkline("a", "#7bd88f")}</div><div class="spark-row"><span>Safety</span>${sparkline("s", "#6fb3ff")}</div><div class="spark-row"><span>Economy</span>${sparkline("e", "#f0c05a")}</div><div class="spark-row"><span>Housing</span>${sparkline("h", "#c39bff")}</div>`)}
        </div>
        <div>
            ${panel(`Conditions in ${esc(placeName())}`, conditionRows(Jx) + `<p class="tiny muted">Change since you took office; ▲▼ where funding, laws and staff are taking it.</p>`)}
            ${st ? panel("By the numbers", `<div class="row small"><div>🔫 <b>${st.homicides}</b> homicides a year</div><div>⛺ <b>${st.homelessN.toLocaleString()}</b> homeless</div></div><div class="row small"><div>🏠 median rent <b>$${st.rent.toLocaleString()}</b></div><div>💼 <b>${fmt(st.unemp, 1)}%</b> unemployment</div></div>`) : ""}
            ${panel("What voters care about", `<ul>${issues}</ul>`)}
        </div>
        <div>
            ${panel("Your staff says", advisories().map((t) => `<p class="advice">${esc(t)}</p>`).join("") || "<p class='muted'>All quiet.</p>")}
            ${panel("Latest", G.log.slice(0, 14).map((l) => `<p class="cable ${l.type}"><small>${dateStr(l.t)}</small> ${esc(l.text)}</p>`).join(""))}
        </div>
    </div>`;
}

// ── Economy: sectors, investments, subsidies, the investment desk ───
const fmtJobs = (n) => n >= 1e6 ? `${fmt(n / 1e6, 1)} million` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : Math.round(n).toLocaleString();
function sectorRow(k, v, Jx) {
    const S = SECTORS[k], ec = Jx.ec;
    const gaps = sectorGaps(k, Jx);
    const on = ui.econSel === k;
    return `<button class="bill-row ${on ? "on" : ""}" data-act="econSel" data-k="${k}"><span>${S.i} <b>${esc(S.n)}</b>${S.vol ? " ⚠️" : ""}${ec.sub[k] ? ' <span class="pill">subsidized</span>' : ""}<br><span class="tiny muted">${fmtJobs(v / 100 * employed(Jx))} jobs · ~$${S.wage}/hr · fit ${"★".repeat(ec.fit[k])}${"☆".repeat(5 - ec.fit[k])}${gaps.length ? ` · <span class="bad">${gaps.length} need${gaps.length > 1 ? "s" : ""} unmet</span>` : ""}</span></span><span class="small">${fmt(v, 1)}%</span></button>`;
}
function sectorDetail(k, Jx) {
    const S = SECTORS[k], ec = Jx.ec;
    const needs = Object.entries(S.needs).map(([m, v]) => { const ok = Jx.m[m] >= v; return `<span class="badge" style="${ok ? "" : "background:#4e1f1f"}">${ok ? "✓" : "✗"} ${metricName(m, G.level)} ${Math.round(Jx.m[m])}/${v}</span>`; }).join(" ") || '<span class="tiny muted">No special needs.</span>';
    const sub = [0, 1, 2].map((l) => `<button class="mini ${(ec.sub[k] || 0) === l ? "on" : ""}" data-act="econSub" data-k="${k}" data-l="${l}">${["None", "Tax credits", "Aggressive"][l]}${l ? ` (${money(l * 0.0025 * Jx.fin.base)}/yr)` : ""}</button>`).join("");
    const assets = S.assets.map(([a, n, c, wk]) => {
        const built = ec.assets[`${k}:${a}`], b = ec.building.find((x) => x.asset === a && x.sector === k);
        const cost = c * Jx.fin.base * (Jx.kind === "nation" ? 0.05 : 1);
        return `<div class="row small" style="margin:3px 0"><span style="flex:1">${built ? "✅" : b ? "🚧" : "•"} ${esc(n)} <span class="tiny muted">${money(cost)} · ${Math.round(wk / 4.3)} months${b ? ` · opens ${dateStr(b.done)}` : ""}</span></span>${!built && !b ? `<button class="mini" data-act="econBuild" data-k="${k}" data-a="${a}" ${G.capital < 3 ? "disabled" : ""}>Build (3)</button>` : ""}</div>`;
    }).join("") || '<p class="tiny muted">Nothing for the government to build here; it grows with the economy.</p>';
    const starts = ec.startups.filter((s) => s.sector === k);
    return panel(`${S.i} ${esc(S.n)}`, `<p class="small">${fmtJobs((ec.sec[k] || 0) / 100 * employed(Jx))} jobs (${fmt(ec.sec[k] || 0, 1)}%) · typical pay $${S.wage}/hr · natural fit ${"★".repeat(ec.fit[k])}${"☆".repeat(5 - ec.fit[k])} · national trend ${S.trend > 0 ? "+" : ""}${S.trend}%/yr${S.vol ? " · ⚠️ boom and bust" : ""}</p>
        <h4>What it needs to flourish</h4><div>${needs}</div>
        <h4>Subsidies</h4><div class="row">${sub}</div><p class="tiny muted">Ongoing tax credits and incentives grow the sector and draw companies. Business likes them; progressives call them corporate welfare.</p>
        <h4>Build for it</h4>${assets}
        <h4>Homegrown firms</h4><div class="row"><button class="mini" data-act="econStartup" data-k="${k}" ${G.capital < 2 ? "disabled" : ""}>Back a local founder (2 capital, ${money(Jx.fin.base * 0.0006 * (Jx.kind === "nation" ? 0.05 : 1))})</button></div>${starts.map((s) => `<p class="tiny">${s.done ? "•" : "🌱"} ${esc(s.name)} ${s.done ? "" : "(growing)"}</p>`).join("")}`, "bill");
}
function prospectCard(p, Jx) {
    const S = SECTORS[p.sector], t = offerTerms(p), odds = prospectOdds(p);
    const parts = prospectParts(p).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 7);
    const offer = Object.entries(OFFER).map(([k, o]) => `<div class="row small" style="margin:2px 0"><span style="flex:1">${o.n}${o.want && p.known && p.want === o.want ? " ⭐" : ""}</span>${o.opts.map((x, i) => `<button class="mini ${p.offer[k] === i ? "on" : ""}" data-act="econOffer" data-id="${p.id}" data-k="${k}" data-v="${i}">${esc(x)}</button>`).join("")}</div>`).join("");
    return panel(`${S.i} ${esc(p.name)}`, `<p class="small">${esc(S.n)} · <b>${p.jobs.toLocaleString()} jobs</b> at about $${p.wage}/hr · ${money(p.capex)} investment · also looking at <b>${esc(p.rival)}</b> · decides by ${dateStr(p.until)}</p>
        <p class="small">${p.known ? `They care most about <b>${WANTS[p.want].n}</b>.` : "You don't know yet what matters most to them. A visit to headquarters would tell you."} <span class="tiny muted">${STYLES[p.style]}</span></p>
        ${offer}
        <p class="small">Your package costs <b>${money(t.cost)}</b> up front${t.yrs ? ` and forgoes ${t.yrs} years of property taxes` : ""}. Once it's open: about <b>${money(t.tax)}</b> a year in taxes${t.cost ? ` · pays back in about ${fmt(t.payback, 0)} years` : ""}.</p>
        ${meter("Odds they choose you", odds, true, Math.round(odds * 100) + "%")}
        <p class="tiny muted">${parts.map(([l, v]) => `${esc(l)} ${v > 0 ? "+" : "−"}${Math.round(Math.abs(v) * 100)}`).join(" · ")}</p>
        <div class="row">${p.round === 0 ? `<button data-act="econVisit" data-id="${p.id}" ${G.capital < 3 ? "disabled" : ""}>✈️ Visit HQ and pitch the CEO (3)</button>` : `<span class="tiny muted">Pitched: ${p.round}/3</span>`}<button class="primary" data-act="econMakeOffer" data-id="${p.id}" ${G.capital < 4 ? "disabled" : ""}>Make the offer (4)</button></div>`);
}
function viewEconomy() {
    const Jx = J();
    ensureEcon(Jx);
    const ec = Jx.ec;
    const secs = Object.entries(ec.sec).filter(([, v]) => v >= 0.5).sort((a, b) => b[1] - a[1]);
    const others = Object.keys(SECTORS).filter((k) => !secs.some(([s]) => s === k));
    if (!ui.econSel || !SECTORS[ui.econSel]) ui.econSel = (secs.find(([k]) => SECTORS[k].assets.length) || secs[0])[0];
    const st = liveStats();
    const firms = ec.firms.slice().reverse().map((f) => `<div class="minister"><span>${SECTORS[f.sector].i} <b>${esc(f.name)}</b>${f.local ? ' <span class="pill">homegrown</span>' : ""}<br><span class="tiny muted">${f.jobs.toLocaleString()} jobs · $${f.wage}/hr · ${f.open ? (G.t < f.abateTo ? `tax break until ${yearOf(f.abateTo)}` : "paying full taxes") : "under construction"}</span></span></div>`).join("") || "<p class='muted small'>No new employers yet.</p>";
    return `<div class="cols3">
        <div>${panel(`The ${esc(placeName())} economy`, `<div class="row"><div>Jobs<br><b>${fmtJobs(employed(Jx))}</b></div><div>${st ? `Unemployment<br><b>${fmt(st.unemp, 1)}%</b>` : `Economy<br><b>${Math.round(Jx.m.economy)}</b>`}</div><div>${st ? `Typical wage<br><b>$${fmt(st.wage, 2)}</b>` : `Wages<br><b>${Math.round(Jx.m.wages)}</b>`}</div></div>
            ${meter("Dependence on boom-and-bust sectors", Jx.dep / 40, false, Math.round(Jx.dep) + "% of jobs")}
            <p class="tiny muted">The economy is ${G.natEcon >= 0.2 ? "growing nationally" : G.natEcon <= -0.2 ? "slumping nationally" : "steady nationally"}. ⚠️ marks boom-and-bust sectors.</p>`)}
            ${panel("Sectors", secs.map(([k, v]) => sectorRow(k, v, Jx)).join("") + `<h4>Grow something new</h4><div class="filters">${others.map((k) => `<button class="mini ${ui.econSel === k ? "on" : ""}" data-act="econSel" data-k="${k}">${SECTORS[k].i} ${esc(SECTORS[k].n)}</button>`).join("")}</div>`)}
        </div>
        <div>${sectorDetail(ui.econSel, Jx)}${panel("Employers you've landed", firms)}</div>
        <div><div class="row"><h3 style="flex:1;margin:0">Investment desk</h3></div><p class="small muted">Companies scouting sites. Build a package, pitch the CEO, and make your offer before they pick somewhere else. New prospects arrive every few months; investing in a sector draws more of them.</p>${ec.prospects.map((p) => prospectCard(p, Jx)).join("") || panel("", "<p class='muted small'>No one is scouting right now. Check back next quarter.</p>")}</div>
    </div>`;
}

// ── Major issues ────────────────────────────────────────────────────
function issueSeverity(I, Jx = J()) { return I.dep ? clamp((Jx.dep || 10) * 2.4, 0, 100) : 100 - Jx.m[I.m]; }
function issueStat(I) {
    const st = liveStats();
    if (!st) return "";
    return { homeless: `${st.homelessN.toLocaleString()} people homeless`, housing: `median rent $${st.rent.toLocaleString()}`, food: `grocery prices ${st.grocery} (U.S. = 100)`, wages: `typical hourly wage $${fmt(st.wage, 2)}`, diversify: `${Math.round(J().dep)}% of jobs in one boom-and-bust industry`, water: `about ${st.breaks.toLocaleString()} water main breaks a year`, safety: `${st.homicides} homicides a year`, jobs: `${fmt(st.unemp, 1)}% unemployment` }[I.k] || "";
}
function askBtn(p) {
    return `<button class="mini" data-act="askState" data-k="${p.k}" ${G.capital < 5 ? "disabled" : ""} title="Lobby the governor and legislature for the power">🏛️ Ask the state (5) · ${Math.round(askStateOdds(p) * 100)}%</button>`;
}
function leverRow(p, Jx) {
    const law = Jx.laws.some((l) => l.k === p.k);
    const why = blocked(p);
    const moving = G.bills.some((b) => b.k === p.k && !["law", "failed", "vetoed", "withdrawn"].includes(b.stage));
    const fx = Object.entries(p.fx).map(([k, x]) => `${METRICS[k].i}${sgn(x)}`).join(" ");
    const btns = !law && !why ? `<button class="mini" data-act="introduce" data-k="${p.k}" ${G.capital < 3 ? "disabled" : ""}>Introduce</button>${p.exec ? `<button class="mini" data-act="execOrder" data-k="${p.k}" ${G.capital < 5 ? "disabled" : ""}>Order</button>` : ""}` : !law && !moving && needsState(p) ? askBtn(p) : "";
    return `<div class="row small" style="margin:2px 0"><span style="flex:1">${law ? "✅" : moving ? "⏳" : "•"} ${esc(p.n)} <span class="tiny muted">${fx}${p.cost > 0 ? ` · ${money(p.cost * Jx.fin.base)}/yr` : ""}</span>${why && !law && !moving ? ` <span class="tiny bad">${esc(why)}</span>` : ""}</span>${btns}</div>`;
}
function viewIssues() {
    const Jx = J();
    const tg = targets(Jx);
    const local = new Set((G.level === "city" ? CITY().issues : Jx.issues || []).map((x) => x[2]));
    const list = ISSUES.map((I) => ({ I, sev: issueSeverity(I), loc: local.has(I.m) })).sort((a, b) => b.sev + (b.loc ? 12 : 0) - a.sev - (a.loc ? 12 : 0));
    const prio = Jx.prio || [];
    const cards = list.map(({ I, sev, loc }) => {
        const v = Jx.m[I.m], d = v - Jx.m0[I.m], t = tg[I.m];
        const on = prio.includes(I.k);
        const levers = I.levers.map((k) => POLICY[k]).filter((p) => p && p.lvl === G.level);
        const lv = levers.map((p) => leverRow(p, Jx)).join("");
        const trend = I.dep ? "" : `<p class="tiny ${d >= 0 ? "good" : "bad"}">${metricName(I.m, G.level)} ${Math.round(v)} (${sgn(d)} since you took office), heading ${t > v + 1 ? "up ▲" : t < v - 1 ? "down ▼" : "nowhere"}</p>`;
        return `<section class="panel ${on ? "bill" : ""}"><h3>${I.i} ${esc(I.n)} ${on ? '<span class="pill">Priority</span>' : ""} ${loc ? '<span class="pill">Local hot button</span>' : ""}</h3>
            ${meter(I.dep ? "Exposure" : "How bad it is", sev / 100, false, Math.round(sev))}
            <p class="small">${esc(G.level !== "city" && I.ds ? I.ds : I.d)}${issueStat(I) ? ` <b>${esc(issueStat(I))}</b>.` : ""}</p>
            ${trend}
            ${grantRow(I.m)}
            ${I.k === "schools" && schoolGov() ? `<p class="small">🏫 <b>Who runs the schools:</b> ${esc(schoolGov().d)}${schoolCtl() === "mayor" && schoolGov().ctl !== "mayor" ? " <b>Under your new mayoral control, you now run them.</b>" : ""}</p>` : ""}
            ${lv || "<p class='tiny muted'>Nothing you can do about it at this level, except money in the budget.</p>"}
            <div class="row"><button class="mini ${on ? "on" : ""}" data-act="prio" data-k="${I.k}">${on ? "Drop as a priority" : "Make it a priority"}</button></div></section>`;
    }).join("");
    const e = G.level === "city" ? CITY_ECON[G.cityK] : null;
    const st = liveStats();
    const econ = e ? panel(`The ${esc(CITY().name)} economy`, Object.entries(e.inds).sort((a, b) => b[1] - a[1]).map(([n, v]) => meter(`${esc(n)}${VOLATILE.includes(n) ? " ⚠️" : ""}`, v / 35, true, v + "% of jobs")).join("") + `<p class="small">Biggest employers: ${e.emp.map(esc).join(", ")}.</p>${st ? `<p class="small">Typical wage <b>$${fmt(st.wage, 2)}/hr</b> · grocery prices <b>${st.grocery}</b> (U.S. = 100) · rent <b>$${st.rent.toLocaleString()}</b> · unemployment <b>${fmt(st.unemp, 1)}%</b></p>` : ""}<p class="tiny muted">⚠️ boom-and-bust sectors. The more jobs depend on them, the harder a downturn hits.</p>`)
        : panel(`The ${esc(placeName())} economy`, `<p class="small">Economy ${Math.round(Jx.m.economy)} · wages ${Math.round(Jx.m.wages)} · ${Math.round(Jx.dep || 0)}% of jobs in boom-and-bust industries · national economy ${G.natEcon >= 0.2 ? "growing" : G.natEcon <= -0.2 ? "slumping" : "steady"}.</p>`);
    const prioNames = prio.map((k) => ISSUES.find((x) => x.k === k).n).join(", ") || "none yet";
    return `<div class="cols2 wide-left"><div><div class="row"><h2 style="flex:1">Major issues</h2><span class="small muted">Your priorities (${prio.length}/3): ${prioNames}</span></div><div class="cols2">${cards}</div></div>
        <div>${panel("Priorities", `<p class="small">Pick up to three issues to run on. Your staff and departments focus on them (their conditions improve faster), and voters judge you on them more than anything else, so pick ones you can move. Changing priorities after the first three costs 3 capital.</p>`)}${econ}</div></div>`;
}

// ── The council / legislature / Congress ────────────────────────────
function seatbarFor(ch) {
    const ms = ch.members.map(P).filter(Boolean);
    const order = ["prog", "ind", "lib", "mach", "mod", "bluedog", "con", "rural", "freedom"];
    const counts = order.map((b) => [b, ms.filter((p) => p.bloc === b).length]).filter((x) => x[1]);
    return `<div class="seatbar">${counts.map(([b, n]) => `<i style="width:${n / ms.length * 100}%;background:${BLOCS[b].color}" title="${BLOCS[b].name}: ${n}"></i>`).join("")}<span class="majority" style="left:50%"></span></div><div class="row tiny">${counts.map(([b, n]) => `<span>${blocDot(b)}${BLOCS[b].name} ${n}</span>`).join(" ")}</div>`;
}
function memberRow(p, b) {
    const s = b ? voteScore(p, b) : null;
    const lean = s == null ? "" : `<b class="${s > 0.15 ? "good" : s < -0.15 ? "bad" : "warn"}">${s > 0.15 ? "Yes" : s < -0.15 ? "No" : s > 0 ? "Lean yes" : "Lean no"}</b>`;
    return `<tr><td>${partyDot(p.party)}<b>${esc(p.name)}</b>${p.role ? ` <span class="pill">${esc(p.role)}</span>` : ""}${p.ambition > 0.7 ? ' <span title="Ambitious">👑</span>' : ""}${p.grudge >= 2 ? ' <span title="Holds a grudge">😠</span>' : ""}<br><span class="tiny muted">${esc(p.seat)}${p.area && p.area !== "Citywide" ? " · " + esc(p.area) : ""}</span></td>
        <td>${blocDot(p.bloc)}<span class="tiny">${BLOCS[p.bloc].name}</span></td><td>${relBadge(p.loyal)}</td><td class="tiny">${p.pet && POLICY[p.pet] ? esc(POLICY[p.pet].n) : ""}</td><td>${lean}</td>
        <td style="white-space:nowrap"><button class="mini" data-act="lobby" data-id="${p.id}" data-h="meet" title="Meet one-on-one (2 capital)">☕</button><button class="mini" data-act="lobby" data-id="${p.id}" data-h="pork" title="Promise a project in their district">🏗️</button><button class="mini" data-act="lobby" data-id="${p.id}" data-h="lean" title="Lean on them (3 capital; they'll resent it)">💪</button></td></tr>`;
}
function viewCouncil() {
    const Jx = J(), B = Jx.body;
    const bills = G.bills.filter((b) => !["law", "failed", "vetoed", "withdrawn"].includes(b.stage));
    const sel = bills.find((b) => b.id === ui.billSel) || bills.find((b) => b.sponsor === "me") || bills[0];
    if (sel) ui.billSel = sel.id;
    const leaders = [B.pres, B.senLead, B.minority, ...Object.values(B.chairs)].filter(Boolean).map(P).filter(Boolean);
    const demands = G.demands.map((d) => { const p = P(d.who); return p ? `<div class="opt"><div><b>${esc(p.name)}</b> <span class="tiny muted">${esc(p.seat)} · ${BLOCS[p.bloc].name}</span><p class="small">${esc(d.text)}${d.cost ? ` (${money(d.cost)})` : ""}</p><p class="tiny muted">Answer by ${dateStr(d.due)}${d.heat ? ' · <span class="bad">risky</span>' : ""}</p></div><div class="col-btns"><button class="mini" data-act="grant" data-id="${d.id}">Yes</button><button class="mini danger" data-act="refuse" data-id="${d.id}">No</button></div></div>` : ""; }).join("") || "<p class='muted small'>No one is asking for anything. For now.</p>";
    const billList = bills.map((b) => { const t = b.stage === "committee" || b.stage === "floor" ? tally(b, b.ci) : null; return `<button class="bill-row ${sel && sel.id === b.id ? "on" : ""}" data-act="billSel" data-id="${b.id}"><span><b>${esc(b.title)}</b><br><span class="tiny muted">${b.sponsor === "me" ? "Your bill" : P(b.sponsor) ? P(b.sponsor).name : ""} · ${b.stage}${b.stuck ? " (stuck)" : ""}${J().body.chambers.length > 1 ? " · " + J().body.chambers[b.ci].short : ""}</span></span>${t ? `<span class="${t.pass ? "good" : "bad"}">${t.yes}–${t.no}</span>` : `<span class="pill">${b.stage}</span>`}</button>`; }).join("") || "<p class='muted small'>Nothing moving.</p>";
    let detail = "";
    if (sel) {
        const pol = POLICY[sel.k];
        const t = tally(sel, sel.ci);
        const chair = chairOf(sel);
        const swing = t.rows.slice().sort((a, b) => Math.abs(a.s) - Math.abs(b.s)).slice(0, 14).map((r) => memberRow(r.p, sel)).join("");
        detail = panel(esc(sel.title), `<p class="small">${esc(pol.d)}</p>
            <p class="small">Stage: <b>${sel.stage}</b>${chair ? ` · committee chair ${esc(chair.name)} (${voteScore(chair, sel) > -0.05 ? '<span class="good">will move it</span>' : '<span class="bad">is blocking it</span>'})` : ""}</p>
            <div class="whipbar"><i style="width:${t.yes / t.total * 100}%"></i><span style="left:${t.need / t.total * 100}%"></span></div>
            <p class="small"><b>${t.yes}</b> yes, <b>${t.no}</b> no; <b>${t.need}</b> needed${G.level === "nation" && sel.ci === 1 ? " (60 to beat a filibuster)" : ""}.</p>
            ${sel.sponsor === "me" || sel.position === "for" ? `<div class="row"><button data-act="whip" data-id="${sel.id}" ${G.capital < 4 ? "disabled" : ""}>📣 Whip the vote (4)</button>${sel.stage === "committee" ? `<button data-act="discharge" data-id="${sel.id}" ${G.capital < 6 ? "disabled" : ""}>📤 Discharge petition (6)</button>` : ""}${sel.sponsor === "me" && !sel.water ? `<button data-act="water" data-id="${sel.id}">💧 Water it down</button>` : ""}${sel.sponsor === "me" ? `<button class="danger" data-act="withdraw" data-id="${sel.id}">Withdraw</button>` : ""}</div>` : `<div class="row"><button data-act="position" data-id="${sel.id}" data-p="for">Support it</button><button data-act="position" data-id="${sel.id}" data-p="against">Oppose it</button><span class="tiny muted">${sel.position ? "You " + (sel.position === "for" ? "support" : "oppose") + " it." : ""}</span></div>`}
            <h4>Swing votes</h4><div class="table-wrap"><table class="whip"><tr><th>Member</th><th>Bloc</th><th>Loyalty</th><th>Pet issue</th><th>Vote</th><th></th></tr>${swing}</table></div>`, "bill");
    }
    const ms = bodyMembers().filter((p) => !p.noVote);
    const filtered = ui.memberFilter === "allies" ? ms.filter((p) => p.loyal > 20) : ui.memberFilter === "foes" ? ms.filter((p) => p.loyal < -15 || p.grudge >= 2) : ui.memberFilter === "leaders" ? ms.filter((p) => p.role) : ms.filter((p) => Math.abs(p.loyal) < 25);
    const list = filtered.slice(0, 60).map((p) => memberRow(p, null)).join("");
    return `<div class="cols2 wide-right">
        <div>
            ${panel(esc(bodyName()), B.chambers.map((ch) => `<h4>${esc(ch.name)} · ${ch.members.length} members</h4>${seatbarFor(ch)}`).join("") + `<p class="small">${G.level === "city" ? (B.mayorVotes ? "You vote and chair the meetings; ordinances need a majority." : `Ordinances need a majority; ${canVeto() ? `you can veto, and ${Math.round(B.veto * 100)}% overrides you` : "you have no veto"}.`) : `Bills must pass both chambers, then you sign or veto (${Math.round(B.veto * 100)}% overrides).`}</p>`)}
            ${panel("Leadership", leaders.map((p) => `<div class="minister"><span>${partyDot(p.party)}<b>${esc(p.name)}</b> <span class="tiny muted">${esc(p.role)}</span>${p.ambition > 0.7 ? " 👑" : ""}</span>${relBadge(p.loyal)}</div>`).join(""))}
            ${panel(`Demands (${G.demands.length})`, demands)}
        </div>
        <div>
            ${panel("Bills", billList)}
            ${detail}
            ${panel("Members", `<div class="filters">${[["swing", "Persuadable"], ["allies", "Allies"], ["foes", "Foes"], ["leaders", "Leaders"]].map(([k, n]) => `<button class="mini ${ui.memberFilter === k ? "on" : ""}" data-act="mfilter" data-k="${k}">${n}</button>`).join("")}</div><div class="table-wrap"><table><tr><th>Member</th><th>Bloc</th><th>Loyalty</th><th>Pet issue</th><th></th><th>Work them</th></tr>${list}</table></div><p class="tiny muted">☕ meet (2 capital) · 🏗️ promise a project (costs money) · 💪 lean on them (3 capital, they'll resent it)</p>`)}
        </div>
    </div>`;
}

// ── Laws ────────────────────────────────────────────────────────────
function policyReact(pol) {
    const rs = Object.keys(J().groups).map((k) => [k, sum(pol.tags, (t) => GROUPS[k].tags[t] || 0)]).filter((x) => Math.abs(x[1]) >= 0.5);
    const f = rs.filter((x) => x[1] > 0).map((x) => GROUPS[x[0]].i).join("");
    const a = rs.filter((x) => x[1] < 0).map((x) => GROUPS[x[0]].i).join("");
    return `${f ? `<span class="good" title="For">👍${f}</span>` : ""} ${a ? `<span class="bad" title="Against">👎${a}</span>` : ""}`;
}
function viewLaws() {
    const pols = POLICIES.filter((p) => p.lvl === G.level);
    const cats = ["all", ...new Set(pols.map((p) => p.cat))];
    const list = pols.filter((p) => ui.lawCat === "all" || p.cat === ui.lawCat).map((p) => {
        const law = J().laws.find((l) => l.k === p.k);
        const why = blocked(p);
        const preview = !why ? tally({ id: "preview" + p.k, k: p.k, sponsor: "me", pork: {}, lean: {}, whip: 0 }, 0) : null;
        const fx = Object.entries(p.fx).map(([k, v]) => `${METRICS[k].i}${sgn(v)}`).join(" ");
        return `<div class="opt ${law ? "cur" : ""}"><div><b>${esc(p.n)}</b> <span class="tiny muted">${esc(p.cat)}</span>${law ? ' <span class="pill">Law</span>' : ""}${law && law.water ? ' <span class="pill">watered down</span>' : ""}<p class="small">${esc(p.d)}</p><p class="tiny">${fx} · ${p.once ? `one-time ${money(p.once * J().fin.base)}${p.cost > 0 ? `, then loses ${money(p.cost * J().fin.base)}/yr` : ""}` : p.cost ? (p.cost > 0 ? `costs ${money(p.cost * J().fin.base)}/yr` : `raises ${money(-p.cost * J().fin.base)}/yr`) : "no cost"}${p.payer ? ` · paid by ${esc(p.payer)}` : ""}${p.ballot ? " · needs voter approval" : ""} · ${policyReact(p)}${preview ? ` · whip count <b class="${preview.pass ? "good" : "bad"}">${preview.yes}–${preview.no}</b> (need ${preview.need})` : ""}</p>${why && !law ? `<p class="tiny bad">${esc(why)}</p>` : ""}</div>
            <div class="col-btns">${law ? `<button class="mini" data-act="repealLaw" data-k="${p.k}" ${G.capital < 4 ? "disabled" : ""}>Repeal (4)</button>` : !why ? `<button class="mini" data-act="introduce" data-k="${p.k}" ${G.capital < 3 ? "disabled" : ""}>Introduce (3)</button>${p.exec ? `<button class="mini" data-act="execOrder" data-k="${p.k}" ${G.capital < 5 ? "disabled" : ""}>Executive order (5)</button>` : ""}` : needsState(p) ? askBtn(p) : ""}</div></div>`;
    }).join("");
    return `<div class="cols2 wide-left"><div>${panel(G.level === "city" ? "Ordinances and executive orders" : "Bills", `<div class="filters">${cats.map((c) => `<button class="mini ${ui.lawCat === c ? "on" : ""}" data-act="lawcat" data-k="${c}">${c === "all" ? "All" : esc(c)}</button>`).join("")}</div>${list}`)}</div>
        <div>${panel("How laws get made", `<p class="small">Introduce a bill and it goes to committee, where the chair can bury it, then to a floor vote${J().body.chambers.length > 1 ? " in each chamber" : ""}. The whip count shows where it stands today; work members on the ${bodyShort()} tab. Some policies can be done by executive order, skipping the ${bodyShort()}, at a price in capital and goodwill.</p>${G.level === "city" ? `<p class="small">${esc(STATE().name)} law forbids some city policies (shown in red). Preemption is how states keep cities in line.</p>` : ""}`)}
        ${panel("On the books", J().laws.map((l) => `<p class="small">• ${esc(POLICY[l.k] ? POLICY[l.k].n : l.k)} <span class="tiny muted">since ${dateStr(l.t)}</span></p>`).join("") || "<p class='muted small'>Nothing yet.</p>")}</div></div>`;
}

// ── Budget ──────────────────────────────────────────────────────────
function viewBudget() {
    const Jx = J(), f = Jx.fin, b = Jx.budget;
    const editing = b && ["drafting", "rejected"].includes(b.status);
    const R = revenue(), Sp = spending();
    let draft = "";
    if (editing) {
        const n = draftNumbers();
        const tal = withDraft(() => budgetTally());
        const depts = deptList().map((d) => { const v = b.depts[d.k] != null ? b.depts[d.k] : 1; return `<div class="budget-row"><span>${d.i} ${d.n}</span><span><button class="mini" data-act="bdept" data-k="${d.k}" data-d="-0.05">−5%</button><button class="mini" data-act="bdept" data-k="${d.k}" data-d="-0.01">−1</button><button class="mini" data-act="bdept" data-k="${d.k}" data-d="0.01">+1</button><button class="mini" data-act="bdept" data-k="${d.k}" data-d="0.05">+5%</button></span><b class="${v > 1.001 ? "good" : v < 0.999 ? "bad" : ""}">${Math.round(v * 100)}%</b><span class="tiny muted">${Object.keys(d.m).map((k) => METRICS[k].i).join("")}</span></div>`; }).join("");
        const rates = f.lines.map((l, i) => { const ok = l.ctl === "council"; return `<div class="budget-row"><span class="small">${esc(l.n)}</span><span>${ok ? `<button class="mini" data-act="brate" data-i="${i}" data-d="-0.02">−2%</button><button class="mini" data-act="brate" data-i="${i}" data-d="0.02">+2%</button>` : `<span class="tiny muted">${{ voter: "voters must approve", state: "needs state law", none: "fixed" }[l.ctl]}</span>`}</span><b class="${b.rates[i] > 1.001 ? "bad" : b.rates[i] < 0.999 ? "good" : ""}">${Math.round(b.rates[i] * 100)}%</b><span class="tiny muted">${money(l.share * f.base * Math.pow(1.03, years()))}</span></div>`; }).join("");
        draft = panel(`Your FY${b.fy} budget ${b.status === "rejected" ? '<span class="pill">Rejected — revise</span>' : ""}${b.lapsed ? ' <span class="pill">Late</span>' : ""}`, `${b.lapsed ? `<p class="small bad">The fiscal year started without a budget. Departments are frozen at last year's levels until this passes; send it to the ${esc(bodyShort())} as soon as it balances.</p>` : ""}
            <div class="row"><div>Revenue <b>${money(n.R)}</b></div><div>Spending <b>${money(n.S)}</b></div><div>From reserve <b>${money(n.draw)}</b></div><div>Balance <b class="${n.gap >= 0 ? "good" : "bad"}">${n.gap >= 0 ? "+" : ""}${money(n.gap)}</b></div></div>
            ${mustBalance() && n.gap < 0 ? `<p class="bad small">By law the budget must balance. Cut, raise revenue or draw on the reserve.</p>` : ""}
            <h4>Departments (funding vs. last year)</h4>${depts}
            <h4>Revenue rates</h4>${rates}
            <h4>Pensions & reserve</h4>
            <div class="row small">Pension payment: ${[[0.8, "Skip 20%"], [1, "Full"], [1.2, "Catch up"]].map(([v, l]) => `<button class="mini ${b.pensionPay === v ? "on" : ""}" data-act="bpension" data-v="${v}">${l}</button>`).join("")}<span class="tiny muted">funds ${Math.round(f.pension * 100)}% funded</span></div>
            <div class="row small">Draw from the rainy-day fund: <button class="mini" data-act="bdraw" data-d="-1">−</button><b>${money(b.draw)}</b><button class="mini" data-act="bdraw" data-d="1">+</button><span class="tiny muted">up to ${money(drawMax())}</span></div>
            <h4>Whip count</h4>${tal.map((x) => `<p class="small">${esc(x.ch.short)}: <b class="${x.pass ? "good" : "bad"}">${x.yes}–${x.total - x.yes}</b> (need ${x.need})</p>`).join("")}
            <div class="row"><button class="primary" data-act="submitBudget">Send it to the ${esc(bodyShort())}</button><span class="tiny muted">Due ${dateStr(b.due)} · fiscal year starts ${dateStr(b.start)}</span></div>`, "bill");
    } else if (b && b.status === "submitted") draft = panel(`FY${b.fy} budget`, `<p class="small">With the ${esc(bodyShort())}. The vote is ${dateStr(b.vote)}.</p>${withDraft(() => budgetTally()).map((x) => `<p class="small">${esc(x.ch.short)}: <b class="${x.pass ? "good" : "bad"}">${x.yes}–${x.total - x.yes}</b> (need ${x.need})</p>`).join("")}`);
    const sg = schoolGov(Jx);
    const depts = `<p class="tiny muted">Any time of year you can hold money back (ask a department to cut). Adding money mid-year needs the ${esc(bodyShort())}.</p>` + deptList().map((d) => `<div class="budget-row"><span>${d.i} ${d.n}<br><span class="tiny muted">${money(d.share * Jx.fin.base * (1 - Jx.fin.fixed) * (Jx.depts[d.k] || 1))}/yr</span></span><span><button class="mini" data-act="deptCut" data-k="${d.k}" title="Ask for a 5% cut">✂️ −5%</button><button class="mini" data-act="deptAdd" data-k="${d.k}" ${G.capital < 3 ? "disabled" : ""} title="Ask the ${esc(bodyShort())} for 5% more (3 capital)">➕ +5% (3)</button></span><b class="${(Jx.depts[d.k] || 1) > 1.001 ? "good" : (Jx.depts[d.k] || 1) < 0.999 ? "bad" : ""}">${Math.round((Jx.depts[d.k] || 1) * 100)}%</b></div>`).join("") + `<div class="row"><button data-act="deptCut" data-k="all">✂️ Ask every department for 3% savings</button></div>` + (sg && !deptList().some((d) => d.k === "schools") ? `<p class="tiny muted">🏫 No school line: ${esc(sg.n)} ${sg.ctl === "state" ? "is run by the state" : sg.ctl === "county" ? "is run county-wide" : "has its own budget and taxes"}. See Major Issues for what the city can still do.</p>` : "");
    const next = b && b.start > G.t ? "" : `<p class="small muted">Budget season opens about three months before the fiscal year starts.</p>`;
    return `<div class="cols2"><div>${draft}${panel("This year's money", `
        <div class="row"><div>Revenue<br><b>${money(R)}</b></div><div>Spending<br><b>${money(Sp)}</b></div><div>${R - Sp >= 0 ? "Surplus" : "Deficit"}<br><b class="${R - Sp >= 0 ? "good" : "bad"}">${money(R - Sp)}</b></div></div>
        <div class="row"><div>${G.level === "nation" ? "National debt" : "Rainy-day fund"}<br><b>${money(G.level === "nation" ? f.debt : f.reserve)}</b></div><div>Pensions<br><b>${Math.round(f.pension * 100)}% funded</b></div><div>Rating<br><b>${f.rating}</b></div></div>
        ${f.lines.map((l) => `<div class="row small"><span style="flex:1">${esc(l.n)}</span><b>${money(l.share * f.base * Math.pow(1.03, years()) * l.rate)}</b></div>`).join("")}
        <p class="tiny muted">Costs (wages, health care, pensions) grow faster than revenue: every year the gap widens unless the economy grows or you act.</p>${next}`)}</div>
        <div>${panel(G.level === "city" ? "Department funding" : "Agencies and their funding", depts)}${revenuePanel(Jx)}${debtPanel(Jx)}${panel("Past years", (f.hist || []).slice(-6).map((h) => `<p class="small">${h.y}: revenue ${money(h.rev)} · spending ${money(h.spend)} · ${G.level === "nation" ? "debt " + money(h.debt) : "reserve " + money(h.reserve)}</p>`).join("") || "<p class='muted small'>No history yet.</p>")}</div></div>`;
}

// New ways to raise money: what this city may do under state law.
function revenuePanel(Jx) {
    if (G.level === "nation") return "";
    const st = CITY().st;
    const banned = (p) => (G.level === "city" ? (p.preempt || []).includes(st) : !!(p.stWhy && p.stWhy[st]));
    const rank = (p) => Jx.laws.some((l) => l.k === p.k) ? 3 : !blocked(p) ? 0 : needsState(p) ? 1 : banned(p) ? 4 : 2;
    const rows = POLICIES.filter((p) => p.lvl === G.level && (p.cat === "Revenue" || (G.level === "state" && p.cat === "Taxes"))).sort((a, b) => rank(a) - rank(b)).map((p) => {
        const law = Jx.laws.some((l) => l.k === p.k);
        const bill = G.bills.find((b) => b.k === p.k && !["law", "failed", "vetoed", "withdrawn"].includes(b.stage));
        const why = blocked(p);
        const amt = p.once ? `one-time ${money(p.once * Jx.fin.base)}${p.cost > 0 ? `, then −${money(p.cost * Jx.fin.base)}/yr` : ""}` : p.cost > 0 ? `<span class="bad">−${money(p.cost * Jx.fin.base)}/yr</span>` : `+${money(-p.cost * Jx.fin.base)}/yr`;
        const status = law ? '<span class="pill">In effect</span>' : bill ? `<span class="pill">${bill.stage === "ballot" ? "On the ballot" : bill.stage === "desk" ? "On your desk" : "In the " + esc(bodyShort())}</span>` : why ? `<span class="tiny ${needsState(p) ? "" : "bad"}">${needsState(p) ? "⚠️ " : "⛔ "}${esc(why)}</span>` : "";
        const btn = law || bill ? "" : needsState(p) ? askBtn(p) : !why ? `<button class="mini" data-act="introduce" data-k="${p.k}" ${G.capital < 3 ? "disabled" : ""}>Introduce (3)</button>` : "";
        return `<div class="opt ${law ? "cur" : ""}" style="${banned(p) ? "opacity:.6" : ""}"><div><b>${esc(p.n)}</b> <b class="good small">${amt}</b>${needsBallot(p) ? ' <span class="pill">Ballot</span>' : ""}<p class="tiny muted">Paid by ${esc(p.payer || "taxpayers")} · ${policyReact(p)}</p>${status}</div><div class="col-btns">${btn}</div></div>`;
    }).join("");
    const auth = (G.stateAuth || []).length;
    return panel(G.level === "city" ? "New revenue" : "Taxes and new revenue", G.level === "city" ? `<p class="tiny muted">Ways cities raise money without touching the property tax. Cities can only use the powers ${esc(STATE().name)} gives them: some are allowed, some need permission from the governor and ${esc(STATE().legis)}, and some are banned outright.${auth ? ` The state has granted you ${auth} new power${auth > 1 ? "s" : ""}.` : ""}</p>${rows}` : `<p class="tiny muted">Ways ${esc(STATE().name)} can raise money, or give it back. Each needs the ${esc(STATE().legis)}; a few would amend the state constitution and go to the voters, and some don't fit ${esc(STATE().name)} at all. You can also change tax rates when you draft the budget.</p>${rows}`);
}

function debtPanel(Jx) {
    const f = Jx.fin;
    const per = f.debt / Math.max(1, Jx.pop);
    const pg = pensionGap(Jx);
    const step = f.base * 0.02;
    const hist = (f.hist || []).slice(-6).map((h) => `${h.y}: ${money(h.debt)}`).join(" · ");
    return panel("Debt", `<div class="row"><div>${G.level === "nation" ? "National debt" : "Bonded debt"}<br><b>${money(f.debt)}</b></div><div>Per resident<br><b>$${Math.round(per).toLocaleString()}</b></div><div>Payments a year<br><b>${money(debtService(Jx))}</b></div></div>
        ${G.level !== "nation" ? `<div class="row"><div>Unfunded pensions<br><b class="${pg > f.base ? "bad" : ""}">${money(pg)}</b></div><div>Pensions funded<br><b>${Math.round(f.pension * 100)}%</b></div><div>Rating<br><b>${f.rating}</b></div></div>` : `<div class="row"><div>Debt vs. revenue<br><b>${fmt(f.debt / Math.max(1, revenue(Jx)), 1)} years</b></div><div>Rating<br><b>${f.rating}</b></div></div>`}
        ${meter("Debt load", clamp(f.debt / (f.base * (G.level === "nation" ? 10 : 3)), 0, 1), false, `${fmt(f.debt / Math.max(1, f.base), 1)}× a year's revenue`)}
        ${hist ? `<p class="tiny muted">Past years: ${hist}</p>` : ""}
        ${G.level !== "nation" ? `<div class="row"><button data-act="debtIssue" ${G.capital < 3 ? "disabled" : ""}>💵 Issue ${money(step)} in bonds (3)</button><button data-act="debtPay" ${f.reserve <= 0 ? "disabled" : ""}>✂️ Pay down ${money(Math.min(step, Math.max(0, f.reserve)))} from the rainy-day fund</button></div>
        <p class="tiny muted">Bonds fill the rainy-day fund now and cost about ${Math.round(debtRate(Jx) * 100 * 10) / 10}% of the amount every year for 20 years. Paying debt down early frees up those payments. Rating agencies watch your debt, your reserves and your pensions.</p>` : `<p class="tiny muted">Washington borrows to cover every deficit. Interest is about ${fmt(debtRate(Jx) * 100, 1)}% a year.</p>`}`);
}

// ── The place ───────────────────────────────────────────────────────
function viewPlace() {
    const Jx = J();
    const tg = targets(Jx);
    const drivers = MKEYS.map((k) => {
        const laws = Jx.laws.filter((l) => POLICY[l.k] && POLICY[l.k].fx[k]).map((l) => `${POLICY[l.k].n} ${sgn(POLICY[l.k].fx[k])}`);
        const depts = deptList().filter((d) => d.m[k] && Math.abs((Jx.depts[d.k] || 1) - 1) > 0.005).map((d) => `${d.n} funding ${Math.round(((Jx.depts[d.k] || 1) - 1) * 100)}%`);
        const pjs = (Jx.projects || []).filter((p) => G.t >= p.done && (p.m === k || p.m2 === k)).map((p) => `${p.name} +${fmt(p.m === k ? p.boost : p.boost * 0.35, 1)}`);
        return `<div class="driver">${meter(`${METRICS[k].i} ${metricName(k, G.level)}`, Jx.m[k] / 100, true, `${Math.round(Jx.m[k])} → ${Math.round(tg[k])}`)}<p class="tiny muted">${[...pjs, ...laws, ...depts].join(" · ") || "Nothing pushing it yet."}</p></div>`;
    }).join("");
    const areas = G.level === "city" ? CITY().hoods.slice(0, Math.min(CITY().hoods.length, 20)).map((h) => { const p = bodyMembers().find((m) => m.area === h); return `<div class="minister"><span>${esc(h)}</span><span class="tiny">${p ? `${partyDot(p.party)}${esc(p.name)} ${relBadge(p.loyal)}` : ""}</span></div>`; }).join("")
        : G.level === "state" ? mayorsList() : Object.keys(STATES).map((s) => `<span class="badge">${s}</span>`).join(" ");
    return `<div class="cols2"><div>${grantsPanel(Jx)}${panel("What's moving conditions", drivers)}</div><div>${panel(G.level === "city" ? "Neighborhoods and their members" : G.level === "state" ? "Cities and their mayors" : "States", areas)}${G.level === "city" ? panel("Hazards", CITY().hazards.map((h) => `<span class="badge">${h}</span>`).join(" ")) : ""}</div></div>`;
}

// ── Power ───────────────────────────────────────────────────────────
function viewPower() {
    const Jx = J();
    const gs = Object.entries(Jx.groups).sort((a, b) => b[1].w - a[1].w).map(([k, g]) => {
        const Gr = GROUPS[k];
        const cares = Object.keys(Gr.cares).map((m) => METRICS[m].i).join("");
        const loves = Object.entries(Gr.tags).filter((x) => x[1] > 0.6).map((x) => x[0]).slice(0, 3).join(", ");
        return `<div class="pillar">${meter(`${Gr.i} ${Gr.n}${g.w >= 1.2 ? " ★" : ""}`, g.l / 100, true, Math.round(g.l))}<p class="tiny muted">Cares about ${cares} · wants ${esc(loves)}${G.race ? (G.race.ends[k] ? ' · <span class="good">endorsed you</span>' : "") : ""}</p></div>`;
    }).join("");
    const o = (x, k) => x ? panel(`${x.title}`, `<div class="leader-card"><div><b>${esc(x.name)}</b><br>${partyDot(x.party)}${PARTIES[x.party].name} · ${ideoLabel(x.ideo)}<br>Relations ${relBadge(x.rel)}</div></div>
        <div class="row"><button data-act="ovr" data-o="${k}" data-h="call" ${G.capital < 2 ? "disabled" : ""}>📞 Call (2)</button><button data-act="ovr" data-o="${k}" data-h="ask" ${G.capital < 4 ? "disabled" : ""}>💵 Ask for money (4)</button><button data-act="ovr" data-o="${k}" data-h="attack">🎤 Attack publicly</button><button data-act="ovr" data-o="${k}" data-h="praise">🤝 Praise publicly</button></div>
        <p class="tiny muted">${x.party !== G.me.party ? "From the other party: attacks play well with your base, but they control money and laws you need." : "Same party: they expect loyalty."}</p>`) : "";
    return `<div class="cols2"><div>${panel("Power groups", gs + `<p class="tiny muted">Groups drift toward what your record deserves: the conditions they care about, the laws you pass, your budget and who's on your team.</p>`)}</div><div>${o(G.gov, "gov")}${o(G.pres, "pres")}${panel("The press", meter("Coverage", G.press / 100, true, Math.round(G.press)) + `<div class="row"><button data-act="presser" ${G.capital < 2 ? "disabled" : ""}>🎙️ Press conference (2)</button><button data-act="townhall" ${G.capital < 3 ? "disabled" : ""}>🏫 Town hall (3)</button></div>`)}</div></div>`;
}

// ── Team ────────────────────────────────────────────────────────────
function viewTeam() {
    const rows = TEAM[G.level].map((r) => {
        const p = P(J().team[r.k]);
        const cands = (G.cands[r.k] || []).filter((id) => id !== J().team[r.k]).map(P).filter(Boolean);
        return panel(r.n, `<p class="tiny muted">${esc(r.d)}</p>${p ? `<div class="minister"><span><b>${esc(p.name)}</b> <span class="stars">${"★".repeat(p.skill)}</span><br><span class="tiny muted">${esc(p.blurb || "")} · ties: ${(p.ties || []).map((k) => GROUPS[k] ? GROUPS[k].n : k).join(", ")}</span></span><button class="mini danger" data-act="fire" data-r="${r.k}">Fire</button></div>` : `<p class="bad small">Vacant</p>`}
            ${cands.map((c) => `<div class="minister"><span>${esc(c.name)} <span class="stars">${"★".repeat(c.skill)}</span><br><span class="tiny muted">${esc(c.blurb || "")}${c.scandal > 0.2 ? ' · <span class="bad">baggage</span>' : ""}</span></span><button class="mini" data-act="appoint" data-r="${r.k}" data-id="${c.id}" ${G.capital < 2 ? "disabled" : ""}>Appoint (2)</button></div>`).join("")}
            <div class="row"><button class="mini" data-act="search" data-r="${r.k}" ${G.capital < 1 ? "disabled" : ""}>🔍 Look for other candidates (1)</button></div>`);
    }).join("");
    return `<div class="cabinet-grid">${rows}</div>`;
}

// ── Campaign ────────────────────────────────────────────────────────
function viewCampaign() {
    const r = G.race;
    const fundraise = `<div class="row"><button data-act="fundraise" ${G.capital < 2 ? "disabled" : ""}>💵 Fundraiser (2 capital)</button><span class="tiny muted">War chest: ${money(G.funds)}</span></div>`;
    if (!r) {
        const y = myElectionYear();
        return `<div class="cols2"><div>${panel("Between elections", `<p class="small">${y ? `Your next election is in November ${y}${termLimited() ? ", but you're term-limited" : ""}.` : ""} Campaign season starts about seven months before.</p>${G.level === "city" && G.terms < 2 ? `<p class="small">Win reelection and you can run for governor of ${esc(STATE().name)} (next races: ${STATE().govYears.filter((x) => x > yearOf(G.t)).slice(0, 2).join(", ")}).</p>` : ""}${G.level === "state" ? `<p class="small">Presidential elections: ${NATION.presYears.filter((x) => x > yearOf(G.t)).slice(0, 2).join(", ")}.</p>` : ""}${fundraise}`)}</div><div>${panel("Career", G.career.map((c) => `<p class="small">${dateStr(c.t)}: ${esc(c.office)}</p>`).join(""))}</div></div>`;
    }
    const round = r.rounds[r.i];
    const opp = round && (round.k === "general" ? r.opp.find((o) => o.general) : r.opp.find((o) => !o.general));
    const share = opp ? pollShare(opp) : 50;
    const ends = Object.entries(J().groups).map(([k, g]) => `<div class="minister"><span>${GROUPS[k].i} ${GROUPS[k].n} ${relBadge(g.l - 50)}</span>${r.ends[k] ? '<span class="good tiny">Endorsed you</span>' : `<button class="mini" data-act="endorse" data-k="${k}" ${G.capital < 2 || g.l < 50 ? "disabled" : ""}>Ask (2)</button>`}</div>`).join("");
    return `<div class="cols2"><div>${panel(`Running for ${r.office}`, `${r.rounds.map((x, i) => `<p class="small ${i < r.i ? "muted" : ""}">${i === r.i ? "▶ " : ""}${esc(x.label)}: ${dateStr(x.t)}</p>`).join("")}
        ${opp ? `<h4>vs. ${esc(opp.name)} (${PARTIES[opp.party].name}), ${esc(opp.from)}</h4>${meter("Your share", share / 100, true, fmt(share, 1) + "%")}` : ""}
        ${(r.results || []).map((x) => `<p class="small">${esc(x.label)}: ${fmt(x.me, 1)}% ${x.won ? "✅" : "❌"}</p>`).join("")}
        <div class="row"><button data-act="rally" ${G.capital < 2 ? "disabled" : ""}>📣 Rally (2)</button><button data-act="ads" ${G.funds < 2e5 ? "disabled" : ""}>📺 Ad buy (${money(Math.max(2e5, G.funds * 0.25))})</button><button data-act="debate" ${G.capital < 3 || r.debated === r.i ? "disabled" : ""}>🎤 Debate prep (3)</button></div>${fundraise}`)}</div>
        <div>${panel("Endorsements", ends)}</div></div>`;
}

// ── Record ──────────────────────────────────────────────────────────
function viewRecord() {
    return `<div class="cols2"><div>${panel("Career", G.career.map((c) => `<p class="small">${dateStr(c.t)}: <b>${esc(c.office)}</b></p>`).join("") + (G.past || []).map((x) => `<p class="tiny muted">${esc(x.name)}: left with ${x.approval}% approval</p>`).join(""))}${panel("Years", G.records.map((r) => `<p class="small">${r.y}: approval ${r.a}% · progress ${r.perf >= 0 ? "+" : ""}${r.perf}</p>`).join("") || "<p class='muted small'>Your first year isn't over.</p>")}</div><div>${panel("The log", G.log.slice(0, 120).map((l) => `<p class="cable ${l.type}"><small>${dateStr(l.t)}</small> ${esc(l.text)}</p>`).join(""))}</div></div>`;
}

// ── The end ─────────────────────────────────────────────────────────
function renderFall() {
    const o = G.over;
    $("#fallBody").innerHTML = `<div class="fall"><div class="kicker">${dateStr(o.t)}</div><h1>${esc(G.me.name)}</h1><p class="lede">${esc(o.why)}</p>
        ${panel("Legacy", `<p class="legacy-score">${o.score}</p><p class="small">${G.career.map((c) => esc(c.office)).join(" → ")}</p><p class="small">${o.score >= 80 ? "A historic career." : o.score >= 60 ? "A career people will remember." : o.score >= 40 ? "A mixed record." : "A cautionary tale."}</p>`)}
        <div class="row center"><button class="primary big" data-act="newGame">Play again</button></div></div>`;
}

// Federal grants and the projects they pay for.
function grantsPanel(Jx) {
    if (G.level === "nation") return "";
    const apps = (G.grantApps || []).filter((a) => a.lvl === G.level);
    const btns = Object.entries(GRANT_PROGRAMS).map(([k, Gp]) => { const w = grantWait(k), pend = apps.some((a) => a.type === k); return `<div class="opt"><div><b>${Gp.i} ${esc(Gp.n)}</b> <span class="tiny muted">${esc(Gp.agency)}</span><p class="tiny muted">${pend ? "⏳ Application pending" : w ? `Next round in ${w} weeks` : `Odds about ${Math.round(grantOdds(k) * 100)}% · ${metricName(Gp.m, G.level)} now ${Math.round(Jx.m[Gp.m])}`}</p></div><div class="col-btns"><button class="mini" data-act="applyGrant" data-k="${k}" ${G.capital < 3 || w || pend ? "disabled" : ""}>Apply (3)</button></div></div>`; }).join("");
    const pj = (Jx.projects || []).slice().reverse().map((p) => {
        const done = G.t >= p.done, frac = clamp((G.t - p.start) / Math.max(1, p.done - p.start), 0, 1);
        return `<div class="driver">${meter(`${done ? "✅" : "🚧"} ${p.name}`, frac, true, done ? "Open" : `${Math.round(frac * 100)}%`)}<p class="tiny muted">${money(p.amt)} · ${esc(p.prog)} · ${metricName(p.m, G.level)} ${done ? "+" + fmt(p.boost, 1) : `+${fmt(p.boost, 1)} when it opens around ${dateStr(p.done)}${G.t - p.start > 8 ? " (construction detours −0.4 for now)" : ""}`}</p></div>`;
    }).join("");
    return panel("Federal grants & projects", `<p class="tiny muted">Apply for federal money. Win, and you choose the project and the ${G.level === "city" ? "neighborhood" : "city"}; the ${G.level === "city" ? "city" : "state"} puts up a ${Math.round(MATCH * 100)}% local match. Finished projects lift conditions for good. Relations with the White House and your priorities help your odds.</p>${btns}${pj ? `<h4>Projects</h4>${pj}` : ""}`);
}

// A grant button on the matching issue card.
function grantRow(m) {
    if (G.level === "nation") return "";
    const k = Object.keys(GRANT_PROGRAMS).find((x) => GRANT_PROGRAMS[x].m === m);
    if (!k) return "";
    const Gp = GRANT_PROGRAMS[k], w = grantWait(k), pend = (G.grantApps || []).some((a) => a.type === k && a.lvl === G.level);
    const pj = (J().projects || []).filter((p) => p.type === k && G.t < p.done).length;
    return `<div class="row small" style="margin:4px 0"><span style="flex:1">🏛️ <b>Federal ${esc(Gp.n.toLowerCase())} grant</b> <span class="tiny muted">${pend ? "application pending" : w ? `next round in ${w} weeks` : `odds about ${Math.round(grantOdds(k) * 100)}%`}${pj ? ` · ${pj} project${pj > 1 ? "s" : ""} under construction` : ""}</span></span><button class="mini" data-act="applyGrant" data-k="${k}" ${G.capital < 3 || w || pend ? "disabled" : ""}>Apply (3)</button></div>`;
}

function mayorsList() {
    if (!G.mayors) makeMayors();
    return `<p class="tiny muted">Mayors can make you look good or bad. Send aid and they'll thank you on TV; pick fights and rural voters cheer while the cities fume.</p>` + G.mayors.map((my) => `<div class="minister"><span>${partyDot(my.party)}<b>${esc(my.city)}</b>: Mayor ${esc(my.name)} ${relBadge(Math.round(my.rel))}${my.note ? ` <span class="tiny muted">(${esc(my.note)})</span>` : ""}</span><span><button class="mini" data-act="mayorAid" data-id="${my.id}" ${G.capital < 2 ? "disabled" : ""}>💵 Send aid (2)</button><button class="mini" data-act="mayorFight" data-id="${my.id}" ${G.capital < 1 ? "disabled" : ""}>📢 Call out (1)</button></span></div>`).join("");
}
