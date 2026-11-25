// American Leader: scenes. Decisions that interrupt the week. Each is built from (id, args) so the
// queue can be saved. Choices carry effects (fx), an optional run(), and result text.

const SCENES = {};
const S = (icon, kicker, title, text, choices) => ({ icon, kicker, title, text, choices });
const ch = (t, fx, res, extra = {}) => Object.assign({ t, fx, res }, extra);
const capOK = (n) => G.capital >= n;
const cname = () => placeName();
const govName = () => (G.gov ? `Governor ${G.gov.name}` : "the governor");
const presName = () => (G.pres ? `President ${G.pres.name}` : "the President");
const kick = (s) => `${dateStr()} · ${s}`;
const randMember = (f = () => true) => pick(bodyMembers().filter(f)) || bodyMembers()[0];
const chief = () => P(J().team.chief || J().team.safety || J().team.ag) || null;
const sameParty = (o) => o && o.party === G.me.party;
const memberTitle = () => (G.level === "city" ? CITY().council.member : G.level === "state" ? "Senator" : "Senator");
const nameWithSeat = (p) => `${G.level === "city" ? CITY().council.member : p.ch === 0 ? "Rep." : "Sen."} ${p.name} (${p.seat}${p.area && p.area !== "Citywide" ? ", " + p.area : ""})`;

// ── Opening and the career ──────────────────────────────────────────
SCENES.welcome = () => {
    const c = CITY(), St = STATE();
    const form = c.form === "council" ? `${c.name} has a council-manager system: you are one vote of ${c.council.n + 1} on the ${c.council.short} and you run its meetings, but a professional city manager runs the departments day to day.` : `${c.name} has a strong-mayor system: you run the departments and propose the budget, and the ${c.council.n}-member ${c.council.short} passes laws and money${c.veto ? `. You can veto ordinances; it takes ${Math.round(c.veto * 100)}% of the ${c.council.short} to override you` : ""}.`;
    return S(c.icon, kick(`Inauguration Day`), `Mayor ${G.me.name}`,
        `${c.long}\n\n**How it works:** ${form}\n\n**Above you:** ${govName()} (${PARTIES[G.gov.party].name}) runs ${St.name}, and ${St.blurb.charAt(0).toLowerCase() + St.blurb.slice(1)} In Washington, ${presName()} (${PARTIES[G.pres.party].name}) is in the White House.\n\n**The road ahead:** you have one term, ${c.term} years, to win reelection in ${G.cityStart + c.term - 1}. Do well, and ${St.name} could make you governor. Then the White House.`,
        [ch("Take the oath of office.", { a: 1 }, "The work starts Monday. Each turn is one week; pick your staff on the Team tab, then press Next week.")]);
};
SCENES.year_report = (a) => {
    const r = G.records[G.records.length - 1] || {};
    const Jx = J();
    const best = MKEYS.slice().sort((x, y) => (Jx.m[y] - Jx.m0[y]) - (Jx.m[x] - Jx.m0[x]));
    const up = best.slice(0, 2).map((k) => `${metricName(k, G.level).toLowerCase()} (${Jx.m[k] - Jx.m0[k] >= 0 ? "+" : ""}${Math.round(Jx.m[k] - Jx.m0[k])})`);
    const down = best.slice(-2).map((k) => `${metricName(k, G.level).toLowerCase()} (${Math.round(Jx.m[k] - Jx.m0[k])})`);
    const grade = r.perf > 6 ? "an excellent year" : r.perf > 2 ? "a good year" : r.perf > -2 ? "a mixed year" : "a bad year";
    return S("📜", kick(`The year in review`), `${a.y}: ${grade}`,
        `Approval ends the year at **${Math.round(G.approval)}%**. Since you took office, the biggest gains are in ${up.join(" and ")}; the biggest losses in ${down.join(" and ")}.\n\nThe budget is running a **${balance() >= 0 ? "surplus" : "deficit"} of ${money(Math.abs(balance()))}** a year; the rainy-day fund holds ${money(Jx.fin.reserve)} and the credit rating is **${Jx.fin.rating}**.`,
        [ch("On to next year.", {}, "")]);
};
SCENES.term_limited = () => S("⌛", kick("Term limits"), "Your last year in this office",
    `You can't run again. ${G.level === "city" && G.terms >= 2 && STATE().govYears.some((y) => y >= yearOf(G.t) && y <= yearOf(G.t) + 1) ? "But the governor's race is coming. Watch for your chance." : "Unless you win another office, your career in public life ends with this term."}`,
    [ch("Make the time count.", { cap: 4 }, "")]);
SCENES.campaign_start = () => {
    const r = G.race;
    const opp = r.opp.map((o) => `**${o.name}** (${PARTIES[o.party].name}), ${o.from}`).join("; ");
    return S("🗳️", kick("Campaign season"), `Your reelection campaign begins`,
        `Your opponents: ${opp}.\n\n${r.rounds.map((x) => `${x.label}: ${dateStr(x.t)}`).join(" · ")}.\n\nThe Campaign tab tracks the polls. Rallies, ads, debates and endorsements from groups that like you all move votes. So does governing well.`,
        [ch("Let's win this.", { rally: 2 }, "Your campaign team opens an office.")]);
};
SCENES.race_round = (a) => a.runoff ? S("🗳️", kick(a.label), "Headed to a runoff", `You finish with **${fmt(a.share, 1)}%**, short of a majority. The runoff is ${dateStr(G.race.rounds[G.race.i].t)}.`, [ch("Back on the trail.", { rally: 2 }, "")]) : S("🗳️", kick(a.label), `You win the ${a.label.toLowerCase()}`, `You take **${fmt(a.share, 1)}%**. On to the next round: ${G.race && G.race.rounds[G.race.i] ? G.race.rounds[G.race.i].label + ", " + dateStr(G.race.rounds[G.race.i].t) : ""}.`, [ch("Keep going.", { rally: 3 }, "")]);
SCENES.reelected = () => S("🎉", kick("Election night"), "Four more years", `Voters gave you another term. Your ${G.level === "city" ? CITY().council.short : bodyShort()} will notice: winners have leverage.${G.level === "city" && STATE().govYears.some((y) => y > yearOf(G.t) && y <= yearOf(G.t) + 4) ? `\n\nThe next race for governor of ${STATE().name} is in ${STATE().govYears.find((y) => y > yearOf(G.t))}. You could be on the ballot.` : ""}`,
    [ch("Back to work.", { cap: 6, body: 6, press: 5 }, "A mandate, for now.")]);
SCENES.offer_governor = () => {
    const St = STATE();
    const y = yearOf(G.t);
    return S("🏛️", kick(`${St.name} · ${y}`), `Run for governor?`,
        `The governor's mansion is on the ballot in ${y}. ${govName()} ${G.gov && G.gov.party === G.me.party ? "is from your own party; you'd face the incumbent's machine in the primary unless they step aside" : "is from the other party"}.\n\nAs mayor of ${CITY().name} you start with a base of about ${Math.round(CITY().pop / St.pop * 100)}% of the state's people. ${St.name} leans **${St.lean > 0 ? "R+" + St.lean : St.lean < 0 ? "D+" + -St.lean : "even"}**. You'd keep running the city while you campaign.`,
        [ch(`Announce for governor.`, { press: 6, cap: -6, funds: 1e6 }, "You announce on the steps of City Hall.", { run: () => { startHigherRace("governor"); queueScene("campaign_higher"); }, req: capOK(6) }),
            ch("Not this time.", {}, "You stay focused on the city.")]);
};
SCENES.offer_president = () => S("🇺🇸", kick("The road to the White House"), "Run for president?",
    `The primaries start in January ${yearOf(G.t) + 1}. Donors, consultants and cable bookers are calling. A governor of ${STATE().name} with ${Math.round(G.approval)}% approval would start ${G.approval > 55 ? "in the top tier" : "as a long shot"}.`,
    [ch("Form an exploratory committee, then announce.", { press: 8, cap: -8, funds: 20e6 }, "You announce in your hometown.", { run: () => { startHigherRace("president"); queueScene("campaign_higher"); }, req: capOK(8) }),
        ch("Not this cycle.", {}, "")]);
SCENES.campaign_higher = () => { const r = G.race; return S("🗳️", kick("The campaign"), `Your race for ${r.office}`, `${r.rounds.map((x) => `${x.label}: ${dateStr(x.t)}`).join(" · ")}.\n\nIn the primary you face **${r.opp[0].name}**, ${r.opp[0].from}. The other party's likely nominee is **${r.opp[1].name}**, ${r.opp[1].from}.`, [ch("Hit the trail.", { rally: 2 }, "")]); };
SCENES.won_higher = (a) => S("🎉", kick("Election night"), a.office === "president" ? "President-elect" : "Governor-elect", a.office === "president" ? "You won the presidency. The inauguration is January 20." : `You will be the next governor of ${STATE().name}. You are sworn in in January.`, [ch("Start the transition.", { press: 10 }, "")]);
SCENES.lost_higher = (a) => S("📉", kick("Election night"), "Defeat", `You lost with ${fmt(a.share, 1)}%. ${G.leaving ? "Your current term is ending too." : "You still have your current job, and a lot of fences to mend."}`, [ch("Concede graciously.", { a: -2, press: 2 }, "")]);
SCENES.sworn_governor = () => { const St = STATE(), b = J().body; return S("🏛️", kick(`Inauguration in the capital`), `Governor ${G.me.name}`, `You now run ${St.name}: a ${money(St.budget)} budget, the ${St.legis} (${b.chambers.map((c) => `${c.short}: ${c.members.map(P).filter((p) => p.party === "D").length} D, ${c.members.map(P).filter((p) => p.party === "R").length} R`).join("; ")}), and every mayor in the state will now ask you for money.\n\n${St.blurb}\n\n**On your plate:** ${St.issues.join(", ")}.`, [ch("Pick your cabinet on the Team tab.", { cap: 6 }, "")]); };
SCENES.sworn_president = () => { const b = J().body; return S("🇺🇸", kick("January 20 · the Capitol"), `President ${G.me.name}`, `You lead the most powerful country on earth with a ${money(spending())} budget, a ${money(J().fin.debt)} national debt, and a Congress where ${b.chambers.map((c) => `${c.short} is ${c.party === "D" ? "Democratic" : "Republican"}`).join(" and the ")}. Bills need 60 votes in the Senate.`, [ch("Get to work.", { cap: 10 }, "")]); };
SCENES.midterms = (a) => { const b = J().body; return S("🗳️", kick("Election night"), G.level === "nation" ? "The midterms" : "Legislative elections", `${a.flips} seats changed parties. Control now: ${b.chambers.map((c) => `${c.short}: ${c.party === "D" ? "Democrats" : "Republicans"} (${c.members.map(P).filter((p) => p.party === c.party).length} of ${c.members.length})`).join("; ")}.`, [ch("Count the votes.", {}, "")]); };

// ── The desk: a bill you didn't write ───────────────────────────────
SCENES.desk = (a) => {
    const b = G.bills.find((x) => x.id === a.id && x.stage === "desk");
    if (!b || !POLICY[b.k]) return S("🖋️", "", "Nothing on your desk", "", [ch("OK", {}, "")]);
    const pol = POLICY[b.k], sp = P(b.sponsor);
    const groups = Object.entries(J().groups).map(([k]) => [k, sum(pol.tags, (t) => GROUPS[k].tags[t] || 0)]).filter((x) => Math.abs(x[1]) >= 0.5).sort((x, y) => y[1] - x[1]);
    return S("🖋️", kick("On your desk"), b.title,
        `${pol.d}${sp ? `\n\nSponsored by ${nameWithSeat(sp)}.` : ""}\n\n**For:** ${groups.filter((x) => x[1] > 0).map((x) => GROUPS[x[0]].n).join(", ") || "no organized group"}. **Against:** ${groups.filter((x) => x[1] < 0).map((x) => GROUPS[x[0]].n).join(", ") || "no organized group"}.${pol.cost ? `\n\nIt ${pol.cost > 0 ? "costs" : "raises"} about ${money(Math.abs(pol.cost) * J().fin.base)} a year.` : ""}`,
        [ch("Sign it.", sp ? { who: { [sp.id]: 10 } } : {}, "You sign it into law.", { run: () => { const out = []; enact(b, out); return b.changes; } }),
            ch(`Veto it.`, sp ? { who: { [sp.id]: -18 }, cap: -2 } : { cap: -2 }, "", { run: () => { b.stage = "override"; b.wk = 0; return `You veto the ${b.title}. Its supporters start counting votes for an override (${Math.round(J().body.veto * 100)}% needed).`; }, req: canVeto() && capOK(2) })]);
};

// ── Demands ─────────────────────────────────────────────────────────
SCENES.demand = (a) => {
    const d = G.demands.find((x) => x.id === a.id);
    if (!d) return S("📞", "", "Never mind", "They called back: forget it.", [ch("OK", {}, "")]);
    const p = P(d.who);
    const role = p.role ? `${p.role}, ` : "";
    const why = p.ambition > 0.7 ? "\n\nEveryone knows they want your job someday." : p.loyal < -20 ? "\n\nThey have not been a friend." : p.loyal > 30 ? "\n\nThey have been a reliable ally." : "";
    return S("📞", kick(`A call from ${p.name}`), `${p.name} ${d.text}`,
        `${role}${nameWithSeat(p)}, a ${BLOCS[p.bloc].name.toLowerCase().replace(/s$/, "")} ${PARTIES[p.party].name.toLowerCase()}, ${d.text}.${d.cost ? ` It would cost about **${money(d.cost)}**.` : ""}${d.heat ? "\n\nIt would not look good on the front page." : ""}${why}`,
        [ch("Give them what they want.", {}, "They won't forget it.", { run: () => grantDemand(d.id) }),
            ch("Offer half a loaf.", { cap: -2 }, "", { run: () => { p.loyal = clamp(p.loyal + 6, -100, 100); if (d.cost) spendOneTime(d.cost / 2); G.demands = G.demands.filter((x) => x.id !== d.id); return `${p.name} takes the compromise, grudgingly.`; }, req: capOK(2) }),
            ch("Say no.", {}, "", { run: () => { refuseDemand(d.id); return `${p.name} hangs up angry.${p.ambition > 0.6 ? " Expect to hear from them." : ""}`; } })]);
};

// ── Budget season ───────────────────────────────────────────────────
SCENES.budget_open = () => { const b = J().budget; if (!b || !b.fy) return S("💰", "", "Budget season", "", [ch("OK", {}, "")]); return S("💰", kick("Budget season"), `Draft the FY${b.fy} budget`, `Your budget office has a draft ready. It is due to the ${bodyShort()} by **${dateStr(b.due)}**, and ${mustBalance() ? "**by law it must balance**" : "it needs votes in both chambers"}. The fiscal year starts ${dateStr(b.start)}.\n\nAt current rates, next year is projected to run a **${balance() >= 0 ? "surplus" : "deficit"} of ${money(Math.abs(balance()))}**.`, [ch("Open the Budget tab.", {}, "", { run: () => { view = "budget"; return ""; } }), ch("Later.", {}, "")]); };
SCENES.budget_rejected = () => {
    const b = J().budget;
    if (!b || !b.depts || b.status !== "rejected") return S("💰", "", "The budget fight is over", "That budget is behind you.", [ch("OK", {}, "")]);
    const foes = bodyMembers().filter((p) => !p.noVote && budgetScore(p) <= 0).sort((x, y) => budgetScore(x) - budgetScore(y)).slice(0, 3);
    const asks = foes.map((p) => `${p.name} (${BLOCS[p.bloc].name})`).join(", ");
    return S("💰", kick(`The ${bodyShort()}`), `Your budget goes down`,
        `The loudest no votes: ${asks || "a little of everyone"}. They want ${foes.some((p) => p.ideo < -0.3) ? "cuts restored and more for housing and services" : "lower taxes and more for police"}. The fiscal year starts ${dateStr(b.start)}.`,
        [ch("Accept their amendments.", { body: 6, cap: -3 }, "", { run: () => { foes.forEach((p) => { if (p.ideo < -0.2) { b.depts.housing = clamp((b.depts.housing || b.depts.humansvc || 1) + 0.05, 0.7, 1.3); } else if (b.depts.police) b.depts.police = clamp(b.depts.police + 0.04, 0.7, 1.3); }); const n = draftNumbers(); if (n.gap < 0) b.draw = Math.min(drawMax(), b.draw - n.gap); b.status = "submitted"; b.vote = G.t + 1; return "You fold in their changes and send it back."; }, req: capOK(3) }),
            ch("Revise it yourself and resubmit.", {}, "", { run: () => { b.status = "drafting"; b.due = b.lapsed ? G.t + 3 : Math.max(G.t + 1, Math.min(b.start - 1, G.t + 3)); view = "budget"; return "Back to the drawing board. You have three weeks."; } }),
            ch("Take it to the public: blame the council.", { press: 4, body: -8, cap: -4, a: 1 }, "", { run: () => { b.status = "submitted"; b.vote = G.t + 2; return "You hold a press conference outside their chamber. The vote is next week."; }, req: capOK(4) })]);
};
SCENES.budget_lapsed = () => !J().budget || !J().budget.depts ? S("⏸️", "", "Budget", "", [ch("OK", {}, "")]) : S("⏸️", kick("No budget"), "The fiscal year starts without a budget", `Departments run at last year's levels, new projects stop, and rating agencies have put ${cname()} on watch. The FY${J().budget.fy} budget is still alive: revise it on the Budget tab and send it back, and the penalties end the day it passes.`, [ch("Open the Budget tab.", {}, "", { run: () => { view = "budget"; const b = J().budget; if (b.status === "submitted") return "It's with the " + bodyShort() + "; the vote is " + dateStr(b.vote) + "."; b.status = b.status === "rejected" ? "drafting" : b.status; b.due = Math.max(b.due, G.t + 3); return "Revise it and send it back."; } }), ch("Keep negotiating.", {}, "The budget stays on the table.")]);
SCENES.shutdown = () => S("🚧", kick("Washington"), "The government shuts down", "Congress missed the deadline. Hundreds of thousands of federal workers are furloughed, national parks close and air traffic slows. Everyone is looking for someone to blame.", [ch("Blame Congress and keep negotiating.", { a: -2, press: -2 }, "", { run: () => { const b = J().budget; if (b.status !== "submitted") { b.status = "drafting"; b.due = G.t + 2; } return "The shutdown continues until a budget passes."; } }), ch("Cave: sign a stopgap at their numbers.", { a: -1, cap: -6, body: 8 }, "", { run: () => { const b = J().budget; b.status = "passed"; J().fin.cr = false; G.shutdown = false; return "The government reopens on Congress's terms."; }, req: capOK(6) })]);
SCENES.cash_crunch = () => {
    const f = J().fin;
    return S("🏦", kick("The finance director"), "The rainy-day fund is empty",
        `Cash on hand has run out: the budget is spending ${money(-balance())} a year more than it takes in. ${G.level === "city" ? "Payroll is due in two weeks." : "State payroll is due."}`,
        [ch("Emergency cuts across every department.", { a: -3, g: { unions: -8 } }, "", { run: () => { Object.keys(J().depts).forEach((k) => { J().depts[k] = clamp(J().depts[k] - 0.05, 0.6, 1.4); }); f.reserve = Math.max(0, f.reserve); return "Every department loses 5%. The unions call it a betrayal."; } }),
            ch("Borrow short-term (tax anticipation notes).", { a: -1 }, "", { run: () => { f.debt += Math.abs(f.reserve) + f.base * 0.02; f.reserve = f.base * 0.02; f.ratingScore = Math.max(0, f.ratingScore - 1); f.rating = RATINGS[f.ratingScore]; return `You borrow to make payroll. Moody's downgrades ${cname()} to ${f.rating}.`; } }),
            ch(G.level === "city" ? `Beg ${govName()} for an advance on state aid.` : "Ask Washington for an emergency advance.", { cap: -5 }, "", { run: () => { const o = G.level === "city" ? G.gov : G.pres; if (o && (sameParty(o) || o.rel > 20)) { f.reserve = f.base * 0.03; o.rel -= 5; return "The money arrives, with strings and a lecture."; } f.debt += Math.abs(f.reserve); f.reserve = 0; if (o) o.rel -= 8; return "Turned down, publicly. You borrow anyway."; }, req: capOK(5) })]);
};

// ── Intrigue ────────────────────────────────────────────────────────
SCENES.probe = () => S("🕵️", kick("Federal investigators"), "The FBI subpoenas City Hall",
    `Agents served subpoenas on your office this morning over a contract steered to a politically connected firm. ${G.level === "city" && ["chicago", "philadelphia", "atlanta", "providence", "neworleans"].includes(G.cityK) ? `${cname()} has seen this movie before.` : "Reporters are already outside."}`,
    [ch("Cooperate fully and fire everyone involved.", { heat: -6, press: 2, body: -4, g: { mach_bosses: -8 } }, "You hand over every document. Your allies in the machine feel thrown under the bus."),
        ch("Lawyer up and say nothing.", { heat: 6, press: -6 }, "Silence makes it worse; the story runs for weeks."),
        ch("Call it a political witch hunt.", { heat: 3, press: -4, a: -1, g: { progressives: -3 } }, "Your base rallies; everyone else wonders what you're hiding.", { run: () => { if (G.pres && !sameParty(G.pres)) G.approval += 2; return ""; } })]);
SCENES.staff_scandal = () => {
    const ids = Object.entries(J().team);
    const pair = ids.length ? pick(ids) : null;
    const p = pair && P(pair[1]);
    const role = pair ? TEAM[G.level].find((r) => r.k === pair[0]).n : "aide";
    const what = pick(["took a free trip from a developer with business before the city", "is accused of sexual harassment by two staffers", "used a city credit card for personal expenses", "was caught on tape promising a contract for a campaign donation", "has been driving a city car with a suspended license", "posted something ugly online years ago"]);
    return S("📰", kick("The morning paper"), `Your ${role.toLowerCase()} in trouble`,
        `${p ? p.name : "A senior aide"}, your ${role.toLowerCase()}, ${what}.`,
        [ch("Fire them today.", { heat: -3, press: 3, cap: -2 }, "", { run: () => { if (pair) delete J().team[pair[0]]; return "They're gone by noon. The post is vacant (Team tab)."; } }),
            ch("Stand by them.", { heat: 8, press: -5 }, "", { run: () => { if (p) p.scandal = (p.scandal || 0) + 0.2; return "Loyalty is admirable. The editorial board disagrees."; } }),
            ch("Order an independent review.", { heat: 2, cap: -3 }, "The story cools while lawyers look into it.", { req: capOK(3) })]);
};
SCENES.rival = () => {
    const p = P(G.flags.rivalOut);
    if (!p) return S("🗡️", "", "False alarm", "", [ch("OK", {}, "")]);
    return S("🗡️", kick("A rival"), `${p.name} is coming for your job`,
        `${nameWithSeat(p)} has hired a campaign manager and is raising money for a run against you. They're telling anyone who'll listen that you broke your promises to them.`,
        [ch("Make peace: offer them a big project and a seat at the table.", { who: { [p.id]: 25 }, cap: -6 }, "", { run: () => { p.ambition *= 0.6; G.flags.rivalOut = null; G.flags.rival = null; return `${p.name} stands down, for now.`; }, req: capOK(6) }),
            ch("Go to war: strip their committee post and their ward projects.", { who: { [p.id]: -30 }, body: -3, press: -2, cap: -3 }, "", { run: () => { const b = J().body; Object.keys(b.chairs).forEach((k) => { if (b.chairs[k] === p.id) { const alt = randMember((x) => x.loyal > 10 && !x.role); if (alt) { b.chairs[k] = alt.id; alt.role = p.role; alt.loyal += 15; p.role = null; } } }); return "Allies applaud; others see a mayor who punishes dissent."; }, req: capOK(3) }),
            ch("Ignore them.", {}, "They keep raising money.")]);
};
SCENES.investigation = () => {
    const ring = randMember((x) => x.loyal < -20) || randMember();
    return S("⚖️", kick(`The ${bodyShort()}`), "They open an investigation of your administration",
        `Led by ${nameWithSeat(ring)}, members vote to hold hearings and subpoena your top aides.`,
        [ch("Send your aides to testify and cooperate.", { heat: -4, press: 2, cap: -2 }, "Hours of hostile questions; no smoking gun."),
            ch("Refuse the subpoenas.", { heat: 5, body: -6, press: -4 }, "A legal fight that keeps the story alive."),
            ch("Counterattack: call it a political stunt.", { body: -4, a: 1, press: -1 }, "Your base cheers. The hearings go on without you.")]);
};
SCENES.recall_start = () => S("✍️", kick("Recall"), "A recall petition", `With your approval at ${Math.round(G.approval)}%, activists are gathering signatures to recall you. If they qualify, a special election follows.`,
    [ch("Fight it: spend from your war chest on canvassers.", { funds: -Math.min(G.funds, 4e5), rally: 3 }, "", { run: () => { if (chance(0.5 + (G.approval - 30) / 40)) { G.flags.recall = G.t; return "The petition falls short of the signatures it needs."; } G.flags.recallVote = G.t + 10; return "They qualify. A recall election is set for ten weeks from now."; } }),
        ch("Ignore it.", {}, "", { run: () => { if (chance(0.35)) return "The drive fizzles."; G.flags.recallVote = G.t + 10; return "They qualify. A recall election is set for ten weeks from now."; } })]);
SCENES.recall_vote = () => { const keep = G.approval + 14 + rnd(-6, 6); return S("🗳️", kick("Recall election"), keep > 50 ? "You survive the recall" : "You are recalled", keep > 50 ? `${fmt(keep, 1)}% voted to keep you.` : `${fmt(100 - keep, 1)}% voted to remove you from office.`, [ch(keep > 50 ? "Back to work." : "Clean out your desk.", keep > 50 ? { cap: 4, press: 3 } : {}, "", { run: () => { if (keep <= 50) gameOver("Voters recalled you from office."); return ""; } })]); };
SCENES.council_feud = () => {
    const a = randMember((x) => x.bloc === "prog"), b = randMember((x) => x.bloc !== "prog" && x.id !== (a && a.id));
    if (!a || !b) return S("🎭", "", "Quiet week", "", [ch("OK", {}, "")]);
    return S("🎭", kick(`The ${bodyShort()}`), "A feud on the floor",
        `${nameWithSeat(a)} and ${nameWithSeat(b)} trade insults during a meeting that ends with a walkout. Both want you on their side.`,
        [ch(`Side with ${a.name}.`, { who: { [a.id]: 15, [b.id]: -15 }, g: { progressives: 3 } }, ""), ch(`Side with ${b.name}.`, { who: { [a.id]: -15, [b.id]: 15 }, g: { progressives: -2, business: 2 } }, ""), ch("Stay out of it.", { press: 1 }, "Both are annoyed with you, a little.", { run: () => { a.loyal -= 3; b.loyal -= 3; return ""; } })]);
};
SCENES.leak = () => S("📨", kick("A leak"), "Your internal memo is on the front page",
    `A draft memo laying out cuts you hadn't announced leaked overnight. Someone close to you is talking to reporters.`,
    [ch("Hunt down the leaker.", { cap: -3, heat: 1 }, "", { run: () => { const ids = Object.entries(J().team); if (ids.length && chance(0.5)) { const [r, id] = pick(ids); delete J().team[r]; return `It was ${P(id).name}. They're gone; the post is vacant.`; } return "You never find out who it was."; }, req: capOK(3) }),
        ch("Own it and explain the plan.", { press: 2, a: -1 }, "You turn it into a speech about hard choices."), ch("Deny everything.", { press: -4 }, "Then the second memo leaks.")]);
SCENES.viral = () => S("📱", kick("Social media"), "You go viral", pick(["A video of you helping push a stuck car out of the snow has ten million views.", "A clip of you snapping at a heckler is everywhere.", "You were filmed eating at a restaurant during a city emergency."]),
    [ch("Lean into it.", { press: 4, a: 1 }, ""), ch("Apologize, if needed.", { press: 1 }, "")]);

// ── Violence ────────────────────────────────────────────────────────
SCENES.shooting = () => { const p = randMember(); const area = p.area || cname(); return S("🚨", kick("Overnight"), `Shooting in ${area}`, `Four teenagers were shot outside a party in ${area}; one died. It's the third shooting there this month. ${nameWithSeat(p)} wants answers.`, [
    ch("Flood the zone with police and promise arrests.", { m: { safety: 2, trust: -1 }, g: { police: 4, progressives: -3 }, who: { [p.id]: 6 }, dept: { police: 0.01 } }, "Overtime patrols start tonight."),
    ch("Fund violence interrupters and summer jobs in the neighborhood.", { cost: 0.0008, m: { safety: 1, trust: 2 }, g: { faith: 4, progressives: 3 }, who: { [p.id]: 4 } }, "Outreach workers and pastors walk the blocks."),
    ch("Hold a vigil with the families.", { a: 1, press: 2, g: { faith: 3 } }, "You stand with the mothers. Some ask what you'll actually do.")]); };
SCENES.police_shooting = () => { const area = randMember().area || cname(); return S("📹", kick("Breaking"), "Police shoot an unarmed man", `Bodycam footage shows an officer shooting a man in ${area} during a traffic stop. Protesters are gathering outside the precinct. The police union says the officer followed training.`, [
    ch("Release the footage now and suspend the officer.", { m: { trust: 4 }, g: { police: -10, progressives: 6, faith: 5 }, press: 3 }, "Transparency calms the street. The union files a grievance."),
    ch("Wait for the investigation.", { m: { trust: -5 }, g: { police: 4, progressives: -8, faith: -5 } }, "", { run: () => { if (chance(0.45)) queueScene("unrest"); return "The protests grow."; } }),
    ch("Call in the state's independent investigators and meet the family.", { cap: -3, m: { trust: 2 }, g: { faith: 4, police: -3 } }, "It buys time and credibility.", { req: capOK(3) })]); };
SCENES.unrest = () => S("🔥", kick("Unrest"), "Protests turn violent", `Windows are smashed downtown and a police car burns. ${G.pres && !sameParty(G.pres) ? `${presName()} posts that he is ready to send in federal troops.` : "Cable news is live from your streets."}`, [
    ch("Impose a curfew and bring in the National Guard.", { m: { safety: 2, trust: -6 }, g: { police: 6, progressives: -10, business: 4 }, gov: 5 }, "The streets go quiet. The anger doesn't."),
    ch("Walk with the protesters and promise reform.", { m: { trust: 4, safety: -2 }, g: { progressives: 8, police: -8, business: -4 }, a: 1 }, ""),
    ch("Let the police handle it.", { m: { safety: -3, trust: -3 }, a: -2 }, "Two more nights of chaos.")]);
SCENES.mass_shooting = () => S("🕯️", kick("Tragedy"), "A mass shooting", `A gunman opened fire ${pick(["at a supermarket", "at a high school football game", "at a nightclub", "at a church", "at a parade", "in an office building"])}. ${rint(5, 12)} people are dead. The country is watching your city.`, [
    ch("Lead the city in mourning and demand state gun laws.", { a: 3, rally: 6, press: 4, g: { progressives: 4 }, gov: G.gov && G.gov.party === "R" ? -6 : 3 }, "Your speech is replayed on every network."),
    ch("Focus on the victims and the investigation.", { a: 2, rally: 5, press: 2 }, ""),
    ch("Announce city gun-safety measures you control: storage rules, buybacks, school security.", { cost: 0.0006, a: 2, m: { safety: 1 }, g: { progressives: 3, police: 2 } }, "Some will be challenged in court under state preemption.")]);

// ── Labor, economy, development ─────────────────────────────────────
SCENES.strike = () => { const u = pick(G.level === "city" ? ["sanitation workers", "bus drivers", "nurses at the public hospital", "911 dispatchers", "school bus drivers"] : G.level === "state" ? ["state prison guards", "public university workers", "state nurses"] : ["air traffic controllers threatening a sickout", "rail workers", "dockworkers at every East and Gulf Coast port"]); return S("🪧", kick("Labor"), `A strike: ${u}`, `The ${u} walked off the job after contract talks collapsed over wages and health care.`, [
    ch("Give them most of what they want.", { cost: 0.004, g: { unions: 8, business: -3 }, m: { services: 2 } }, "Back to work in two days."),
    ch("Hold firm and use replacement contractors.", { g: { unions: -12, business: 4 }, m: { services: -4 }, a: -1 }, "A long, ugly strike."),
    ch("Bring in a mediator and split the difference.", { cost: 0.002, cap: -3, g: { unions: 3 } }, "A deal after a week.", { req: capOK(3) })]); };
SCENES.company = () => { const leaving = chance(0.45); const co = pick(["a Fortune 500 headquarters", "a major bank's regional hub", "an AI company", "a battery plant", "a biotech campus", "a major retailer's offices"]); return leaving
    ? S("📦", kick("Business"), `${co} may leave`, `Executives say crime, taxes and permitting delays have them looking at the suburbs and other states. ${rint(1, 4) * 1000} jobs are at stake.`, [
        ch("Offer a big tax break to stay.", { cost: 0.003, m: { economy: 1 }, g: { business: 5, progressives: -5 } }, "They stay, for ten years."),
        ch("Promise to fix the problems they named.", { cap: -3, g: { business: 2 } }, "", { run: () => { if (chance(0.5)) return "They give you two years."; shock("economy", -3); return "They leave anyway."; }, req: capOK(3) }),
        ch("Let them go.", { m: { economy: -3 }, g: { business: -6, progressives: 2 } }, "The headlines hurt.")])
    : S("🏢", kick("Business"), `${co} wants to come here`, `It would bring ${rint(1, 5) * 1000} jobs, and it wants tax breaks, land and fast permits.`, [
        ch("Roll out the red carpet.", { cost: 0.003, m: { economy: 4, housing: -1 }, g: { business: 6, trades: 4, progressives: -3 } }, "Groundbreaking next spring."),
        ch("Welcome them, but require local hiring and affordable housing.", { m: { economy: 2 }, g: { trades: 3, progressives: 3, business: -1 } }, "", { run: () => chance(0.6) ? "They agree." : (shock("economy", -1), "They pick another city.") }),
        ch("No subsidies.", { g: { progressives: 3, business: -4 } }, "They go elsewhere.")]); };
SCENES.development = () => S("🏗️", kick("Development"), "A massive development proposal", `A developer wants to build ${rint(3, 8) * 1000} homes, offices and a hotel on old industrial land in ${randMember().area || cname()}. Neighbors fear traffic and displacement; the building trades want the jobs.`, [
    ch("Back it.", { m: { housing: 3, economy: 2 }, g: { developers: 6, trades: 6, homeowners: -5, progressives: -3 } }, ""),
    ch("Back it with 20% affordable units.", { m: { housing: 2, economy: 1 }, g: { developers: -2, trades: 3, progressives: 3 } }, ""),
    ch("Side with the neighbors.", { g: { homeowners: 6, developers: -6, trades: -4 }, m: { housing: -1 } }, "")]);
SCENES.protest = () => S("📣", kick("Protest"), pick(["Thousands march on City Hall", "Activists occupy the lobby"]), `${pick(["Tenant organizers want a rent freeze", "Climate activists want a fossil fuel ban", "Parents want school safety", "Pro-Palestinian students want divestment", "Small business owners want action on crime"])}. They want to meet you.`, [
    ch("Meet them.", { press: 2, g: { progressives: 3 }, cap: -1 }, ""), ch("Send staff.", {}, ""), ch("Have police clear the lobby.", { g: { progressives: -6, police: 2 }, m: { trust: -2 } }, "")]);
SCENES.overdoses = () => S("💊", kick("Public health"), "An overdose spike", `A batch of fentanyl laced with ${pick(["xylazine", "nitazenes", "medetomidine"])} killed ${rint(8, 25)} people in a week.`, [
    ch("Open an overdose prevention site.", { m: { homeless: 2, trust: 1 }, g: { progressives: 5, homeowners: -6, police: -3 }, gov: G.gov && G.gov.party === "R" ? -8 : 0 }, "", { run: () => (G.gov && G.gov.party === "R" ? "The governor threatens to prosecute staff." : "") }),
    ch("Expand treatment and push naloxone everywhere.", { cost: 0.0008, m: { homeless: 2 }, g: { faith: 2 } }, ""), ch("Crack down on dealers.", { m: { safety: 1 }, g: { police: 4, progressives: -4 } }, "")]);
SCENES.infrastructure = () => S("🌉", kick("Infrastructure"), pick(["A bridge is closed after inspectors find cracks", "A sinkhole swallows a city bus", "A water main bursts downtown"]), "Traffic is snarled and the repair bill is huge.", [
    ch("Emergency repairs, whatever it costs.", { cost: 0.002, m: { streets: 2 }, a: 1 }, "Crews work around the clock."), ch("Patch it and plan.", { m: { streets: -2 } }, ""), ch(`Ask ${G.level === "city" ? govName() : presName()} for emergency money.`, { cap: -2 }, "", { run: () => { const o = G.level === "city" ? G.gov : G.pres; if (o && (sameParty(o) || o.rel > 15)) { shock("streets", 3); return "Help arrives."; } return "No help is coming."; }, req: capOK(2) })]);
SCENES.ice_raid = () => S("🚓", kick("Immigration"), "Federal agents raid a neighborhood", `ICE agents in masks arrested dozens of people at ${pick(["a car wash", "a Home Depot parking lot", "an apartment complex", "a church", "outside a school"])}. Families are terrified and want you to act.`, [
    ch("Condemn the raids and order police not to help.", { g: { latino: 8, immigrants: 6, progressives: 5, police: -3 }, pres: -12, a: 1 }, "", { run: () => (G.pres && !sameParty(G.pres) ? (G.flags.presAngry = (G.flags.presAngry || 0) + 1, "The White House calls you a lawbreaker.") : "") }),
    ch("Open legal aid hotlines and stay quiet otherwise.", { cost: 0.0004, g: { latino: 4, immigrants: 3 } }, ""), ch("Say the law is the law.", { g: { latino: -8, police: 3 }, pres: 6 }, "")]);

// ── Disasters ───────────────────────────────────────────────────────
function hazardScene(icon, title, text, metric, size, extra = {}) {
    const helper = G.level === "city" ? (G.gov ? govName() : "the state") : presName();
    const o = G.level === "city" ? G.gov : G.pres;
    return S(icon, kick("Emergency"), title, text, [
        ch("Declare an emergency and lead from the front.", { cap: -3, rally: 5, a: 2, cost: size * 0.0012, m: { [metric]: -size * 0.4 } }, "You're on the ground with the crews. People notice.", { req: capOK(3) }),
        ch(`Request a disaster declaration from ${helper}.`, { cap: -2, m: { [metric]: -size * 0.6 } }, "", { run: () => { if (!o || sameParty(o) || o.rel > 0 || size >= 8) { spendOneTime(-size * 0.0008 * J().fin.base); if (o) o.rel += 2; return "Aid is approved."; } if (o) o.rel -= 4; G.approval -= 1; return `${helper} slow-walks the request and blames your management.`; }, req: capOK(2) }),
        ch("Let the departments handle it.", { a: -2, m: { [metric]: -size } }, "The response is slow and the criticism is loud.")
    ].concat(extra.more || []));
}
SCENES.hz_hurricane = () => hazardScene("🌀", `A hurricane hits ${cname()}`, "Category 3 winds and a storm surge flood whole neighborhoods. Power is out for hundreds of thousands.", "environment", 9);
SCENES.hz_flood = () => hazardScene("🌊", "Flash flooding", "Torrential rain floods basements, underpasses and homes. Drivers are rescued from cars.", "environment", 6);
SCENES.hz_heat = () => hazardScene("🔥", "A deadly heat wave", "Ten straight days above the record. Hospitals fill with heatstroke patients; unsheltered people are dying.", "homeless", 5);
SCENES.hz_tornado = () => hazardScene("🌪️", "A tornado touches down", "An EF-3 tears through neighborhoods, destroying homes and a school.", "environment", 6);
SCENES.hz_blizzard = () => hazardScene("❄️", "A blizzard buries the city", "Two feet of snow, drifts to the rooftops and stranded drivers. Plows can't keep up.", "services", 6);
SCENES.hz_ice = () => hazardScene("🧊", "An ice storm", "Freezing rain brings down trees and power lines across the city.", "services", 5);
SCENES.hz_snow = SCENES.hz_ice;
SCENES.hz_lake = () => hazardScene("❄️", "Lake-effect snow", "Bands off the lake drop five feet of snow on the south side in two days.", "services", 7);
SCENES.hz_freeze = () => hazardScene("🥶", "A hard freeze and grid failure", "The grid fails in single-digit temperatures; pipes burst and people freeze in their homes.", "services", 8);
SCENES.hz_earthquake = () => hazardScene("🏚️", "An earthquake", "A magnitude 6.4 quake cracks buildings, breaks water mains and sets off fires.", "streets", 9);
SCENES.hz_quake = SCENES.hz_earthquake;
SCENES.hz_wildfire = () => hazardScene("🔥", "Wildfire at the city's edge", "A fast-moving fire forces evacuations of thousands of homes.", "environment", 7);
SCENES.hz_smoke = () => hazardScene("🌫️", "Wildfire smoke", "Smoke from distant fires gives the city the worst air on the planet for a week.", "environment", 3);
SCENES.hz_drought = () => hazardScene("🏜️", "Drought emergency", "Reservoirs and aquifers are at record lows; water managers warn of rationing.", "environment", 4);
SCENES.hz_dust = () => hazardScene("🌪️", "A haboob", "A mile-high wall of dust shuts down the airport and freeways.", "services", 2);
SCENES.hz_chemical = () => hazardScene("☣️", "A chemical plant explodes", "A blast at a petrochemical plant sends a black plume over the East End; residents are told to shelter in place.", "environment", 6);
SCENES.hz_tsunami = () => hazardScene("🌊", "A tsunami warning", "Sirens sound across the island after an earthquake off Alaska. Waikīkī evacuates.", "environment", 4);
SCENES.hz_volcano = () => hazardScene("🌋", "Volcanic ash", "An eruption across Cook Inlet blankets the city in ash; flights stop.", "services", 3);
SCENES.hz_watermain = () => hazardScene("🚰", "Water main breaks", "Two century-old mains burst downtown; a boil-water notice covers half the city.", "streets", 5);
SCENES.hz_recession = () => hazardScene("📉", "The big industry stumbles", `The industry ${cname()} depends on is in a slump; employers lay off thousands. (${Math.round(J().dep)}% of jobs are in one boom-and-bust sector.)`, "economy", Math.round(3 + J().dep / 6));
SCENES.hz_strike = SCENES.strike;
SCENES.hz_terror = () => hazardScene("🚨", "A terror scare", "A bomb threat shuts down the subway at rush hour.", "safety", 3);
SCENES.hz_unrest = SCENES.unrest;

// ── The governor meddles ────────────────────────────────────────────
const GOV_SCENES = ["gov_preempt", "gov_takeover", "gov_aid", "gov_troopers", "gov_deal"];
SCENES.gov_preempt = () => {
    const mine = J().laws.map((l) => POLICY[l.k]).filter((p) => p && p.lvl === "city" && p.ideo < 0);
    const target = mine.length ? pick(mine) : null;
    return S("🏛️", kick(`The state capitol`), target ? `The legislature moves to overturn your ${target.n.toLowerCase()}` : "A bill to strip cities of power",
        `${govName()} is backing a bill in the ${STATE().legis} ${target ? `that would void ${cname()}'s ${target.n.toLowerCase()}` : "that would ban cities from regulating employers, policing and housing beyond state law"}. Rural legislators love it.`,
        [ch("Fight it in the capitol: lobby legislators and testify.", { cap: -5, gov: -6 }, "", { run: () => { const odds = 0.35 + (G.me.traits.includes("fighter") ? 0.15 : 0) - STATE().hostile * 0.25; if (chance(odds)) return "You peel off enough votes; it dies in committee."; if (target) { repeal(target.k); G.preempted = (G.preempted || []).concat([target.k]); return `It passes. Your ${target.n.toLowerCase()} is void.`; } G.preempted = (G.preempted || []).concat(["oversight", "min_wage", "rent_control"]); return "It passes. Your hands are tied on labor and policing."; }, req: capOK(5) }),
            ch("Sue the state.", { cost: 0.0002, press: 2 }, "", { run: () => (chance(0.35) ? "A judge blocks the law." : (target && (repeal(target.k), 0), "You lose in court.")) }),
            ch("Negotiate: offer to water it down yourself.", { gov: 8, g: { progressives: -5 } }, "", { run: () => { if (target) { const l = J().laws.find((x) => x.k === target.k); if (l) l.water = true; } return "A face-saving compromise."; } })]);
};
SCENES.gov_takeover = () => {
    const what = pick(G.cityK === "neworleans" ? ["the French Quarter's policing", "the Sewerage and Water Board"] : ["the police department", "the public schools", "the city's finances", "the transit authority"]);
    return S("🛑", kick(`The state capitol`), `The governor threatens to take over ${what}`,
        `${govName()} says ${cname()} has failed and the state will appoint a board to run ${what}. ${G.gov.party !== G.me.party ? "It's a popular message in the rest of the state." : "Even your own party's governor has lost patience."}`,
        [ch("Rally the city against the power grab.", { a: 3, press: 4, gov: -12, rally: 3 }, "", { run: () => (chance(0.55) ? "The bill stalls after a huge rally at the capitol." : (shock("trust", -4), `The takeover passes. A state board now runs ${what}.`)) }),
            ch("Offer a partnership instead: joint oversight.", { gov: 10, cap: -4, g: { progressives: -4 } }, "The governor accepts, for now.", { req: capOK(4) }),
            ch("Fix what they're complaining about, fast.", { cost: 0.002, gov: 4 }, "Money and attention buy you a year.")]);
};
SCENES.gov_aid = () => S("✂️", kick(`The state budget`), "The state cuts aid to the city", `The ${STATE().legis}'s budget cuts ${money(J().fin.base * 0.02)} in aid to ${cname()}. ${govName()} says the city should manage its money better.`,
    [ch("Accept it and find the money.", {}, "", { run: () => { J().fin.base *= 0.985; return "The hole is yours to fill."; } }),
        ch("Lobby to restore it.", { cap: -4 }, "", { run: () => (sameParty(G.gov) || G.gov.rel > 10 ? "Most of it is restored." : (J().fin.base *= 0.985, "No luck.")), req: capOK(4) }),
        ch("Attack the governor publicly.", { gov: -10, a: 1, press: 2 }, "", { run: () => { J().fin.base *= 0.985; return "Satisfying, but the money is gone."; } })]);
SCENES.gov_troopers = () => S("🚔", kick("The state capitol"), "The governor sends in state troopers", `${govName()} is deploying state police to patrol ${pick(["downtown", "the entertainment district", "the highways through the city", "public transit"])}, saying your police can't keep order.`,
    [ch("Welcome the help.", { m: { safety: 2 }, gov: 8, g: { police: 2, progressives: -6 } }, ""), ch("Object: it's a political stunt.", { gov: -8, g: { progressives: 5, police: -3 }, press: 1 }, ""), ch("Negotiate the terms: under your chief's command.", { cap: -3, gov: 3, m: { safety: 1 } }, "", { req: capOK(3) })]);
SCENES.gov_deal = () => S("🤝", kick("The state capitol"), "The governor offers a deal", `${govName()} will support ${money(J().fin.base * 0.015)} for a project in ${cname()} if you endorse ${G.gov.party === G.me.party ? "the governor's reelection" : "the governor's tax plan"} and stop criticizing the state.`,
    [ch("Take the deal.", { cost: -0.015, gov: 15, g: { progressives: G.gov.party !== G.me.party ? -6 : 0 } }, "Ribbon-cutting with the governor next spring."), ch("Decline.", { gov: -4 }, "")]);
SCENES.mayor_ask = () => { const c = pick(STATE().cities.concat([CITY().name])); return S("🏙️", kick("The mayors"), `The mayor of ${c} wants money`, `The mayor of ${c} wants ${money(J().fin.base * rnd(0.002, 0.006))} for ${pick(["police", "transit", "a stadium", "homeless shelters", "flood control", "schools"])}, and is happy to say so on TV.`,
    [ch("Send the money.", { cost: 0.004, g: { suburbs: -2 } }, "A grateful mayor."), ch("Promise to look at it in the budget.", {}, ""), ch("Say no: the state isn't an ATM.", { g: { rural: 3 }, press: -1 }, "")]); };

// ── The President meddles ───────────────────────────────────────────
const PRES_SCENES_CITY = ["pres_guard", "pres_grants", "pres_doj", "pres_infra"];
const PRES_SCENES_STATE = ["pres_guard", "pres_grants", "pres_medicaid", "pres_infra"];
SCENES.pres_guard = () => S("🪖", kick("The White House"), "The President threatens to send troops", `${presName()} says ${cname()} is "out of control" and threatens to federalize the National Guard and send it into the streets.`,
    [ch("Defy him: sue and rally the public.", { pres: -15, a: 2, press: 4, g: { progressives: 6, police: -2 }, rally: 3 }, "", { run: () => (chance(0.5) ? "A federal judge blocks the deployment." : "Troops arrive anyway; the lawsuit goes on.") }),
        ch("Quietly negotiate: more federal agents, no troops.", { pres: 6, cap: -4, g: { progressives: -4 } }, "Agents arrive; the Guard stays home.", { req: capOK(4) }),
        ch("Invite the help.", { pres: 12, g: { progressives: -12, police: 4 }, m: { trust: -4, safety: 1 } }, "")]);
SCENES.pres_grants = () => S("💸", kick("Washington"), "Federal grants frozen", `The administration freezes ${money(J().fin.base * 0.02)} in grants to ${cname()}, citing its ${J().laws.some((l) => l.k === "sanctuary") ? "sanctuary policy" : "policies"}.`,
    [ch("Sue.", { cost: 0.0002, pres: -6, press: 2 }, "", { run: () => (chance(0.6) ? "Courts order the money released." : (J().fin.base *= 0.99, "The freeze holds.")) }), ch("Comply with their conditions.", { pres: 8, g: { progressives: -6, immigrants: -4, latino: -3 } }, "The money flows again."), ch("Absorb the loss.", {}, "", { run: () => { J().fin.base *= 0.99; return "You cut elsewhere."; } })]);
SCENES.pres_doj = () => S("⚖️", kick("The Justice Department"), pick(["DOJ drops your police consent decree", "DOJ opens an investigation of your police"]), "The Justice Department's decision upends years of plans for your police department.",
    [ch("Keep the reforms going on your own.", { cost: 0.001, m: { trust: 2 }, g: { progressives: 4, police: -3 } }, ""), ch("Use the moment to reset with the police union.", { g: { police: 6, progressives: -5 }, m: { trust: -2 } }, "")]);
SCENES.pres_infra = () => { const type = pick(Object.keys(GRANT_PROGRAMS)), Gp = GRANT_PROGRAMS[type]; return S("🏗️", kick("Washington"), "A federal grant opportunity", `The ${Gp.agency} opens a new round of ${pick(Gp.progs)} funding for ${Gp.n.toLowerCase()}. Competition is stiff, and the politics matter. Your odds: about **${Math.round(grantOdds(type) * 100)}%**, more if you court the administration.`,
    [ch("Apply, and court the administration.", { pres: 4 }, "", { run: () => { G.grantT && delete G.grantT[type]; G.capital += 3; return applyGrant(type, 0.12); } }), ch("Apply on the merits.", {}, "", { run: () => { G.grantT && delete G.grantT[type]; G.capital += 3; return applyGrant(type); } }), ch("Skip it.", {}, "")]); };
SCENES.pres_medicaid = () => S("🏥", kick("Washington"), "Federal Medicaid cuts", `Congress and the President cut federal Medicaid money; ${STATE().name} loses ${money(J().fin.base * 0.03)} a year.`,
    [ch("Backfill it with state money.", {}, "", { run: () => { J().fin.spend0 *= 1.02; return "Coverage holds; the budget is tighter."; } }), ch("Cut enrollment.", { m: { services: -5 }, g: { progressives: -6, unions: -3 } }, "")]);

// ── Statehouse and national events ──────────────────────────────────
SCENES.st_prison = () => S("⛓️", kick("Corrections"), "Violence in the state prisons", "A riot at an understaffed prison leaves two guards hurt and an inmate dead; the Justice Department is asking questions.", [ch("Fund guard raises and hiring.", { cost: 0.002, g: { police: 4 } }, ""), ch("Reduce the prison population with parole reform.", { g: { progressives: 5, rural: -4 }, m: { trust: 2 } }, ""), ch("Investigate, quietly.", {}, "")]);
SCENES.st_session = () => { const p = J().body.pres && P(J().body.pres); return S("🏛️", kick("The legislature"), "The Speaker wants a deal", `${p ? p.name : "The Speaker"} will move your priorities if you sign ${p && p.party !== G.me.party ? "their tax cut" : "their pet project"}.`, [ch("Deal.", { cost: 0.003, body: 6, who: p ? { [p.id]: 15 } : {} }, ""), ch("No deal.", { who: p ? { [p.id]: -10 } : {} }, "")]); };
SCENES.st_rural = () => S("🌾", kick("Rural " + J().name), "A rural hospital is closing", "The only hospital in three counties is closing its doors.", [ch("Rescue it.", { cost: 0.001, g: { rural: 6 } }, ""), ch("Let it close.", { g: { rural: -6 }, m: { services: -1 } }, "")]);
SCENES.st_redistrict = () => S("🗺️", kick("Redistricting"), "A map fight", "Your party could redraw the legislative and congressional maps to its advantage.", [ch("Gerrymander.", { body: 5, press: -4, g: { progressives: -2 } }, ""), ch("Back an independent commission.", { press: 4, body: -4, m: { trust: 3 } }, "")]);
const NATION_SCENES = ["nat_govdefy", "nat_hearing", "nat_scotus"];
SCENES.nat_foreign = () => S("🌍", kick("The Situation Room"), pick(["A crisis in the Taiwan Strait", "A war in the Middle East escalates", "Russia threatens a NATO ally", "A hostage crisis"]), "Your national security team lays out the options.", [ch("Show strength.", { a: 2, rally: 4, g: { military: 6, progressives: -4 } }, ""), ch("Lead with diplomacy.", { press: 2, g: { progressives: 3 } }, ""), ch("Stay out of it.", { a: -1 }, "")]);
SCENES.nat_court = () => S("⚖️", kick("The Supreme Court"), "The Court strikes down your policy", "A 6–3 ruling throws out one of your executive actions.", [ch("Attack the Court.", { press: -2, g: { progressives: 4 } }, ""), ch("Comply and try Congress.", {}, "")]);
SCENES.nat_debt = () => S("💵", kick("Congress"), "The debt ceiling", "The Treasury will hit the debt limit in weeks; the other party wants spending cuts to raise it.", [ch("Negotiate cuts.", { body: 6, g: { progressives: -4 } }, "", { run: () => { J().fin.spend0 *= 0.99; return "A deal, with cuts."; } }), ch("Refuse to negotiate.", { press: -2 }, "", { run: () => (chance(0.7) ? "They blink at the last minute." : (shock("economy", -5), "Markets panic before a last-second deal.")) })]);
SCENES.nat_recession = () => S("📉", kick("The economy"), "A recession", "Unemployment is rising and markets are falling.", [ch("Push a stimulus.", { cost: 0.03, m: { economy: 3 }, body: -2 }, "", { run: () => { G.recession = true; return ""; } }), ch("Hold steady.", { m: { economy: -2 } }, "", { run: () => { G.recession = true; return ""; } })]);
SCENES.nat_govdefy = () => S("🏛️", kick("The states"), "Governors defy you", `A bloc of governors from the other party refuses to carry out one of your policies and is suing.`, [ch("Cut their federal funds.", { press: -2, g: { rural: 2 } }, ""), ch("Negotiate.", { cap: -3 }, "", { req: capOK(3) })]);
SCENES.nat_hearing = () => S("📺", kick("Congress"), "Oversight hearings", "House committees subpoena your aides over a scandal at an agency.", [ch("Cooperate.", { heat: -2 }, ""), ch("Claim executive privilege.", { heat: 4, press: -3 }, "")]);
SCENES.nat_scotus = () => S("⚖️", kick("The Supreme Court"), "A Supreme Court vacancy", "A justice retires. Your nominee needs 51 votes in the Senate.", [ch("Nominate a consensus pick.", { press: 3, body: 2 }, ""), ch("Nominate a bold pick for your base.", { g: { progressives: G.me.party === "D" ? 8 : -6, faith: 2 }, body: -4 }, "")]);

// ── Courting a company: the visit to headquarters ───────────────────
SCENES.ceo_visit = (a) => {
    const p = J().ec && J().ec.prospects.find((x) => x.id === a.id);
    if (!p) return S("🏢", "", "They've moved on", "The company has already decided.", [ch("OK", {}, "")]);
    const last = p.said[p.said.length - 1];
    const intro = p.round === 0 ? `You fly to ${p.name}'s headquarters to meet the CEO, who is weighing ${placeName()} against ${p.rival} for ${p.jobs.toLocaleString()} jobs at about $${p.wage} an hour. ${STYLES[p.style]}.\n\nYou get three pitches. Their site-selection team will check every claim against the facts.` : `**You:** ${WANTS[last.k] ? WANTS[last.k].pitch : ""}\n\n**CEO:** “${last.reply}”${p.said.length > p.round ? `\n\n${p.said[p.said.length - 1].reply}` : ""}`;
    if (p.round >= 3) return S("🏢", kick(`${p.name} headquarters`), "The meeting ends", `${intro}\n\nYour odds now: **${Math.round(prospectOdds(p) * 100)}%**. Make your offer on the Economy tab.`, [ch("Fly home.", {}, "")]);
    return S("🏢", kick(`${p.name} headquarters · pitch ${p.round + 1} of 3`), `Meeting the CEO of ${p.name}`, intro,
        Object.entries(WANTS).map(([k, W]) => ch(W.pitch, {}, "", { run: () => { pitch(p.id, k); queueScene("ceo_visit", { id: p.id }); return ""; } })));
};

// ── A tax on the ballot ─────────────────────────────────────────────
SCENES.ballot = (a) => {
    const b = G.bills.find((x) => x.id === a.id);
    const pol = b && POLICY[b.k];
    if (!pol) return S("🗳️", "", "No measure", "", [ch("OK", {}, "")]);
    const base = 0.5 + (G.approval - 50) / 120 - J().lean / 400 - (pol.ideo + 0.2) * 0.15;
    const decide = (boost) => { const yes = clamp(base + boost + rnd(-0.06, 0.06), 0.1, 0.9); b.voted = true; if (yes > 0.5) { const out = []; enact(b, out); return `Voters approve it, ${Math.round(yes * 100)}% to ${100 - Math.round(yes * 100)}%.`; } b.stage = "failed"; b.why = "Voters said no"; G.approval -= 1; return `Voters reject it, ${100 - Math.round(yes * 100)}% to ${Math.round(yes * 100)}%.`; };
    return S("🗳️", kick("Ballot measure"), `Voters decide: ${pol.n}`, `The ${bodyShort()} passed it, but it needs voter approval. ${pol.payer ? `Opponents, led by ${pol.payer}, are spending heavily against it.` : ""} Early polling has it at about **${Math.round(clamp(base, 0.1, 0.9) * 100)}%**.`,
        [ch("Campaign hard for it.", { cap: -5, funds: -Math.min(G.funds, 2e5) }, "", { run: () => decide(0.07), req: capOK(5) }), ch("Let the voters decide.", {}, "", { run: () => decide(0) })]);
};

// ── Ribbon cuttings: you built it, now take the stage ──────────────
SCENES.ribbon = (a) => {
    const Jx = J(), ec = Jx.ec;
    if (a.level !== G.level || !ec) return S("✂️", "", "The ribbon is cut", "Your successor cuts the ribbon on a project you started.", [ch("OK", {}, "")]);
    const f = a.firm && ec.firms.find((x) => x.id === a.firm);
    const Sec = SECTORS[a.sector];
    // The local member whose district it sits in, picked once.
    if (!a.member) { const m = pick(bodyMembers()); a.member = m ? m.id : null; }
    const m = a.member && P(a.member);
    const where = m && m.area ? m.area : placeName();
    const big = f && f.abateTo > G.t + 52 * 5;
    const boss = G.level === "city" ? G.gov : G.level === "state" ? G.pres : null;
    const bossName = G.level === "city" ? govName() : "the President";
    const sameSide = boss && boss.party === G.me.party;
    const text = f
        ? `${f.name} opens its doors in ${where}: **${f.jobs.toLocaleString()} jobs** at about $${f.wage} an hour. There's a stage, a giant pair of scissors and every TV station in town. The CEO speaks first and thanks “our partners in ${placeName()}.” ${m ? `${m.name}, who represents the area, is in the front row hoping to be called up.` : ""}${big ? " Outside the fence, a few protesters hold signs about the tax break." : ""}\n\nThen it's your turn at the podium.`
        : `The **${a.name}** is finished, ${a.over == null ? (a.over = chance(0.3)) : a.over, a.over ? "a little over budget, but open" : "on time"}. Hard hats, union crews, neighbors and cameras crowd in front of a ribbon in ${where}. ${Sec.i} ${Sec.n} leaders say it puts ${placeName()} on the map. ${m ? `${m.name}, who represents the area, fought for it too.` : ""}\n\nYou step up to the podium.`;
    const credit = f ? `“I promised ${placeName()} good jobs, and today ${f.name} proves we delivered.”` : `“They said ${placeName()} couldn't build big things anymore. Look behind me.”`;
    const choices = [
        ch(`Take the credit. ${credit}`, { a: 1.5, press: 4, cap: 3, ...(m ? { who: { [m.id]: -8 } } : {}), ...(big ? { g: { progressives: -2 } } : {}) }, `The clip leads the evening news.${m ? ` ${m.name} isn't mentioned, and notices.` : ""}`),
        ch(`Thank the workers. “Every beam here was set by ${placeName()} hands.”`, { a: 1, press: 2, g: { trades: 4, unions: 3 } }, "The building trades cheer loudest. Their newsletter runs your photo on the cover."),
    ];
    if (m) choices.push(ch(`Call ${m.name} up to cut the ribbon with you.`, { a: 0.6, press: 1, who: { [m.id]: 15 }, body: 2 }, `${m.name} beams. You'll get that vote back someday.`));
    if (boss) choices.push(ch(`Invite ${bossName} to share the stage.`, { a: sameSide ? 0.5 : 0.2, press: 1, [G.level === "city" ? "gov" : "pres"]: 10 }, sameSide ? `${bossName} flies in and takes half the credit, but owes you one.` : `${bossName} shows up, praises “bipartisan partnership” and leaves before the Q&A. Relations thaw a little.`));
    choices.push(ch(`Use the moment to pitch ${placeName()} to other ${Sec.n.toLowerCase()} companies (better odds of landing the next one).`, { press: 2 }, "", { run: () => { ec.buzz = ec.buzz || {}; ec.buzz[a.sector] = Math.min(0.12, (ec.buzz[a.sector] || 0) + 0.05); ec.sec[a.sector] = (ec.sec[a.sector] || 0) + 0.2; return "Site-selection consultants take note. Companies in the sector look harder at " + placeName() + "."; } }));
    choices.push(ch("Skip it and send a deputy.", { press: -1, cap: 1 }, "The papers run a photo of the ribbon with an empty spot where you should be."));
    return S("✂️", kick("Ribbon cutting"), f ? `${f.name} opens` : `Opening day: ${a.name}`, text, choices);
};

// ── Federal grants: choosing the project, and opening day ──────────
SCENES.grant_won = (a) => {
    const g = a.g, Gp = GRANT_PROGRAMS[g.type], match = g.amt * MATCH;
    if (a.lvl && a.lvl !== G.level) return S("💸", "", "The grant moves on", "", [ch("OK", {}, "")]);
    const b = grantBoost(g.amt);
    const who = (o) => { const m = areaMember(o.h); return m ? ` ${m.name}'s district.` : ""; };
    const go = (opt, share, label) => () => {
        spendOneTime(match);
        const pj = startProject(g, opt, share, label);
        groupMove("trades", 3);
        log(`Construction starts: ${pj.name} (${money(g.amt * share)}).`, "good");
        return `Shovels in the ground. ${pj.name} should open around ${dateStr(pj.done)}.`;
    };
    const choices = g.opts.map((o) => { const m = areaMember(o.h); return ch(`${o.name}.`, { press: 2, ...(m ? { who: { [m.id]: 14 } } : {}) }, "", { run: go(o, 1) }); });
    choices.forEach((c, i) => { c.t += ` ${Gp.i} ${metricName(Gp.m, G.level)} +${fmt(b, 1)} when done · about ${Math.round(g.opts[i].wk / 4.3)} months.${who(g.opts[i])}`; });
    choices.push(ch(`Split it between the first two projects: +${fmt(b * 0.45, 1)} each, so ${metricName(Gp.m, G.level)} +${fmt(b * 0.9, 1)} in all.`, { press: 1, body: 1, ...(areaMember(g.opts[0].h) && areaMember(g.opts[1].h) ? { who: { [areaMember(g.opts[0].h).id]: 6, [areaMember(g.opts[1].h).id]: 6 } } : {}) }, "", { run: () => { go(g.opts[0], 0.5)(); return go(g.opts[1], 0.5)(); } }));
    choices.push(ch(`Spread it across the whole ${G.level === "city" ? "city" : "state"}: a little for every ${G.level === "city" ? "district" : "region"}. ${metricName(Gp.m, G.level)} +${fmt(b * 0.8, 1)} in about a year.`, { body: 4, press: -1 }, "", { run: go(null, 1, `${Gp.n} upgrades across ${placeName()}`) }));
    if (J().fin.reserve < match) choices.push(ch(`Turn it down: you can't cover the ${money(match)} local match.`, { press: -3, a: -0.5 }, "The money goes to another city. The papers notice."));
    return S("💸", kick(Gp.agency), `You won a ${money(g.amt)} federal ${g.prog}`, `The ${Gp.agency} is sending ${placeName()} **${money(g.amt)}** for ${Gp.n.toLowerCase()}. The city has to put up a **${money(match)} local match**. Every council member wants it in their district. Where does it go?`, choices);
};
SCENES.project_open = (a) => {
    const p = (J().projects || []).find((x) => x.id === a.id);
    if (!p || a.level !== G.level) return S("✂️", "", "The ribbon is cut", "Your successor cuts the ribbon on a project you started.", [ch("OK", {}, "")]);
    const Gp = GRANT_PROGRAMS[p.type], m = p.h && areaMember(p.h);
    const fedName = G.pres ? `the ${Gp.agency === "EPA" ? "EPA Administrator" : Gp.agency === "FEMA" ? "FEMA Administrator" : "Transportation Secretary"}` : "federal officials";
    return S("✂️", kick("Ribbon cutting"), `Opening day: ${p.name}`, `It's done: **${p.name}**, ${money(p.amt)} from the federal ${p.prog} and your local match. ${metricName(p.m, G.level)} gets a lasting lift of **+${fmt(p.boost, 1)}**. Neighbors, construction crews and cameras gather${p.h ? ` in ${p.h}` : ""}. ${m ? `${m.name}, who represents the area, is at the front of the crowd.` : ""}`, [
        ch(`Take the credit. “I said we'd fix it, and we fixed it.”`, { a: 1.2, press: 4, cap: 3, ...(m ? { who: { [m.id]: -6 } } : {}) }, "It leads the evening news."),
        ch("Thank the workers who built it.", { a: 0.8, press: 2, g: { trades: 4, unions: 3 } }, "The building trades cheer loudest."),
        ...(m ? [ch(`Call ${m.name} up to cut the ribbon with you.`, { a: 0.5, press: 1, who: { [m.id]: 15 }, body: 2 }, `${m.name} beams. That's a vote you can count on.`)] : []),
        ch(`Invite ${fedName} and thank Washington.`, { a: 0.3, press: 2, pres: 8 }, sameParty(G.pres) ? "The administration loves the photo op, and remembers who said thanks." : "A rare bipartisan photo. The White House notices."),
        ch("Skip it and send a deputy.", { press: -1, cap: 1 }, "The papers run a photo of the ribbon with an empty spot where you should be.")
    ]);
};
