// American Leader: the people you govern with. Councils, legislatures and Congress; votes, bills,
// vetoes, demands and favors.

// ── People ──────────────────────────────────────────────────────────
const usedNames = new Set();
function personName() {
    for (let i = 0; i < 40; i++) { const n = `${pick(FIRST)} ${pick(LAST)}`; if (!usedNames.has(n)) { usedNames.add(n); return n; } }
    return `${pick(FIRST)} ${pick(LAST)}`;
}
function makePerson(o) {
    const id = uid("p");
    const bl = BLOCS[o.bloc] || BLOCS.lib;
    const p = Object.assign({
        id, name: personName(), bloc: o.bloc, party: o.party || bl.party, ideo: clamp(bl.ideo + rnd(-0.18, 0.18), -1, 1),
        loyal: rint(-10, 15), ambition: Math.random() < 0.18 ? rnd(0.6, 1) : rnd(0, 0.5), grudge: 0, owed: 0,
        corrupt: o.bloc === "mach" ? rnd(0.2, 0.6) : rnd(0, 0.25), pet: null
    }, o);
    const mine = POLICIES.filter((x) => x.lvl === G.level && Math.abs(x.ideo - p.ideo) < 0.35);
    p.pet = mine.length ? pick(mine).k : null;
    G.people[id] = p;
    return p;
}
const P = (id) => G.people[id];

// ── Bodies ──────────────────────────────────────────────────────────
// A body has one or two chambers of named members, leaders and committee chairs.
function makeBody(Jx) {
    Object.keys(G.people).forEach((id) => { if (G.people[id].body) delete G.people[id]; });
    if (Jx.kind === "city") return makeCouncil(Jx);
    if (Jx.kind === "state") return makeLegislature(Jx);
    return makeCongress(Jx);
}
function makeCouncil(Jx) {
    const c = CITY(), C = c.council;
    const blocs = [];
    Object.entries(C.blocs).forEach(([b, n]) => { for (let i = 0; i < n; i++) blocs.push(b); });
    const order = shuffle(blocs);
    const members = order.map((b, i) => {
        const party = b === "con" ? "R" : b === "ind" ? "P" : b === "mod" && Math.abs(c.lean) < 25 && chance(0.4) ? "R" : "D";
        return makePerson({ bloc: b, party, body: "council", ch: 0, seat: `${C.unit} ${i + 1}`, area: c.hoods[i % c.hoods.length] });
    }).map((p) => p.id);
    const ch = { name: C.name, short: C.short, member: C.member, members, need: 0.5 };
    // Leadership: a separately elected council president, or one the members choose.
    let pres;
    if (C.presSep) pres = makePerson({ bloc: pick(["lib", "mod"]), party: "D", body: "council", ch: 0, seat: "Council President (citywide)", area: "Citywide", role: "Council President", ambition: rnd(0.6, 1), loyal: rint(-15, 5), noVote: true });
    else if (!C.mayorVotes) { pres = P(pick(members)); pres.role = "Council President"; pres.ambition = Math.max(pres.ambition, rnd(0.5, 0.9)); }
    const rest = members.map(P).filter((p) => !p.role);
    const chair = (title) => { const p = rest.splice(Math.floor(Math.random() * rest.length), 1)[0]; if (p) p.role = title; return p ? p.id : null; };
    Jx.body = {
        kind: "council", name: C.name, chambers: [ch], pres: pres ? pres.id : null,
        chairs: { budget: chair("Chair, Budget & Finance"), safety: chair("Chair, Public Safety"), land: chair("Chair, Zoning & Land Use") },
        mayorVotes: !!C.mayorVotes, veto: c.veto
    };
}
// Majority party and seats in a state chamber.
function chamberSplit(stK, which) {
    const St = STATES[stK];
    const [name, n, maj] = St[which];
    let party = St.ctrl === "R" || St.ctrl === "D" ? St.ctrl : null;
    if (St.ctrl === "split") party = { PA: { lower: "D", upper: "R" }, MI: { lower: "R", upper: "D" }, MN: { lower: "R", upper: "D" } }[stK][which];
    if (St.ctrl === "coalition") party = "D";
    if (stK === "PA" && which === "lower") return { name, n, party: "D", seats: 102 };
    return { name, n, party, seats: maj };
}
function partyBlocs(party, n, lean) {
    const out = [];
    const dShare = party === "D" ? [lean < -10 ? 0.35 : 0.22, 0.5, lean < -10 ? 0.15 : 0.28] : [0.32, 0.48, 0.2];
    const keys = party === "D" ? ["prog", "lib", "mod"] : ["freedom", "con", "rural"];
    keys.forEach((k, i) => { for (let j = 0; j < Math.round(n * dShare[i]); j++) out.push(k); });
    while (out.length < n) out.push(keys[1]);
    return out.slice(0, n);
}
function makeLegislature(Jx) {
    const stK = CITY().st, St = STATES[stK];
    const chambers = ["lower", "upper"].map((w, ci) => {
        const sp = chamberSplit(stK, w);
        const other = sp.party === "D" ? "R" : "D";
        const list = partyBlocs(sp.party, sp.seats, St.lean).map((b) => ({ b, party: sp.party })).concat(partyBlocs(other, sp.n - sp.seats, St.lean).map((b) => ({ b, party: other })));
        const regions = [...St.cities, CITY().name, "rural " + St.name, "the suburbs"];
        const members = list.map((x, i) => makePerson({ bloc: x.b, party: x.party, body: "legislature", ch: ci, seat: `District ${i + 1}`, area: pick(regions) }).id);
        return { name: `State ${sp.name}`, short: sp.name, member: ci === 0 ? "Representative" : "Senator", members, need: 0.5, party: sp.party };
    });
    const lead = (ci, title, party) => { const c = chambers[ci]; const p = shuffle(c.members.map(P)).find((x) => x.party === party && !x.role); if (p) { p.role = title; p.ambition = Math.max(p.ambition, rnd(0.5, 1)); } return p ? p.id : null; };
    Jx.body = {
        kind: "legislature", name: St.legis, chambers,
        pres: lead(0, chambers[0].short === "House" ? "Speaker of the House" : `Speaker of the ${chambers[0].short}`, chambers[0].party),
        senLead: lead(1, "Senate Majority Leader", chambers[1].party),
        chairs: { budget: lead(0, "Chair, Appropriations", chambers[0].party), safety: lead(1, "Chair, Senate Finance", chambers[1].party) },
        minority: lead(0, "Minority Leader", chambers[0].party === "D" ? "R" : "D"),
        veto: 2 / 3
    };
}
function makeCongress(Jx) {
    const mk = ([name, n, maj, party], ci) => {
        const other = party === "D" ? "R" : "D";
        const list = partyBlocs(party, maj, 0).map((b) => ({ b, party })).concat(partyBlocs(other, n - maj, 0).map((b) => ({ b, party: other })));
        const sts = Object.keys(STATES);
        return { name, short: ci === 0 ? "House" : "Senate", member: ci === 0 ? "Representative" : "Senator", members: list.map((x, i) => makePerson({ bloc: x.b, party: x.party, body: "congress", ch: ci, seat: ci === 0 ? `District ${i + 1}` : "Senator", area: STATES[sts[i % sts.length]].name }).id), need: ci === 1 ? 0.6 : 0.5, party };
    };
    const chambers = [mk(G.congress.house, 0), mk(G.congress.senate, 1)];
    const lead = (ci, title, party) => { const p = shuffle(chambers[ci].members.map(P)).find((x) => x.party === party && !x.role); if (p) { p.role = title; p.ambition = Math.max(p.ambition, 0.6); } return p ? p.id : null; };
    Jx.body = {
        kind: "congress", name: "Congress", chambers,
        pres: lead(0, "Speaker of the House", chambers[0].party), senLead: lead(1, "Senate Majority Leader", chambers[1].party),
        chairs: { budget: lead(0, "Chair, Ways & Means", chambers[0].party), safety: lead(1, "Chair, Senate Judiciary", chambers[1].party) },
        minority: lead(0, "House Minority Leader", chambers[0].party === "D" ? "R" : "D"), veto: 2 / 3
    };
}
const bodyMembers = (Jx = J()) => Jx.body.chambers.flatMap((c) => c.members).map(P).filter(Boolean);
const bodyName = () => J().body.chambers.length === 1 ? J().body.chambers[0].name : J().body.name;
const bodyShort = () => G.level === "city" ? CITY().council.short : G.level === "state" ? "Legislature" : "Congress";

// ── Votes ───────────────────────────────────────────────────────────
// Partisanship rises with the level of government.
const partisan = () => (G.level === "city" ? 0.35 : G.level === "state" ? 0.9 : 1.3);
// A member's lean on a bill: ideology, party, loyalty to you, pork, pressure, grudges.
function voteScore(p, b) {
    const pol = POLICY[b.k];
    const ideo = b.ideo != null ? b.ideo : pol ? pol.ideo : 0;
    let s = 0.75 - Math.abs(p.ideo - ideo) * 1.25;
    const mine = b.sponsor === "me";
    const yourSide = mine || b.position === "for" ? 1 : b.position === "against" ? -1 : 0;
    if (yourSide) {
        s += yourSide * (p.loyal / 100) * 0.7;
        s += yourSide * (p.party === G.me.party ? 0.25 : -0.3) * partisan();
        s -= yourSide * p.grudge * 0.15;
    }
    if (b.sponsor && b.sponsor !== "me") { const sp = P(b.sponsor); if (sp && sp.party === p.party) s += 0.2 * partisan(); if (sp && sp.id === p.id) s += 2; }
    if (b.pork && b.pork[p.id]) s += 0.55 * yourSide;
    if (b.lean && b.lean[p.id]) s += b.lean[p.id] * yourSide;
    s += (b.whip || 0) * 0.05 * yourSide;
    if (b.water) s += Math.sign(p.ideo - ideo) * Math.sign(ideo || 0.01) * -0.25 + 0.1;
    // Deficit hawks in a deficit.
    if (pol && pol.cost > 0 && mustBalance() && balance() < 0) s -= Math.max(0, p.ideo + 0.2) * 0.4;
    // A small, stable personal wobble.
    s += ((hash(p.id + b.id) % 100) / 100 - 0.5) * 0.35;
    if (p.pet === b.k) s += 0.6;
    return s;
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function tally(b, ci) {
    const ch = J().body.chambers[ci];
    const rows = ch.members.map(P).filter((p) => p && !p.noVote).map((p) => ({ p, s: voteScore(p, b) }));
    let yes = rows.filter((r) => r.s > 0).length;
    const total = rows.length + (J().body.mayorVotes ? 1 : 0);
    if (J().body.mayorVotes) yes += b.sponsor === "me" || b.position === "for" ? 1 : 0;
    const need = ci === 1 && G.level === "nation" && !b.recon ? 60 : Math.floor(total * ch.need) + 1;
    return { yes, no: total - yes, total, need, rows, pass: yes >= need, ch };
}

// ── Bills ───────────────────────────────────────────────────────────
// Stages: committee → floor → (second chamber) → desk → law. Committee chairs can bury bills.
function introduce(k, sponsor = "me", extra = {}) {
    const pol = POLICY[k];
    const b = Object.assign({ id: uid("b"), k, title: billTitle(pol), sponsor, stage: "committee", ci: 0, wk: 0, pork: {}, lean: {}, whip: 0, t: G.t }, extra);
    G.bills.push(b);
    return b;
}
function billTitle(pol) {
    const kind = G.level === "city" ? "Ordinance" : "Act";
    return pol.n.replace(/^(Raise|Hire|Ban|End|Expand|Legalize|Negotiate|Fund|Extend|Cut|Create|Comply|Contract|Make|Let|Ask)\b/, (m) => m) + ` ${kind}`;
}
function chairOf(b) {
    const body = J().body;
    const pol = POLICY[b.k];
    const key = pol && ["Public safety", "Immigration"].includes(pol.cat) ? "safety" : pol && ["Taxes", "Economy"].includes(pol.cat) ? "budget" : G.level === "city" ? "land" : "budget";
    const id = body.chairs[key] || body.chairs.budget;
    const p = P(id);
    if (!p) return null;
    if (G.level !== "city" && p.ch !== b.ci) { const alt = Object.values(body.chairs).map(P).find((x) => x && x.ch === b.ci); return alt || null; }
    return p;
}
function weekBills() {
    const out = [];
    G.bills.filter((b) => ["committee", "floor", "override"].includes(b.stage)).forEach((b) => {
        b.wk++;
        if (b.stage === "committee") {
            const chair = chairOf(b);
            const ok = !chair || voteScore(chair, b) > -0.05 || b.discharged;
            if (b.wk >= 2 && ok) { b.stage = "floor"; b.wk = 0; }
            else if (b.wk >= 3 && !ok && !b.stuck) { b.stuck = true; if (b.sponsor === "me") out.push(["bad", `${chair.name} is sitting on the ${b.title} in committee.`]); }
            if (b.wk > 26) { b.stage = "failed"; b.why = "Died in committee"; }
        } else if (b.stage === "floor" && b.wk >= 1) {
            const r = tally(b, b.ci);
            if (r.pass) {
                if (b.ci === 0 && J().body.chambers.length > 1) { b.ci = 1; b.stage = "committee"; b.wk = 0; b.stuck = false; b.discharged = false; out.push(["good", `The ${b.title} passes the ${r.ch.short} ${r.yes}–${r.no}.`]); }
                else { b.stage = "desk"; b.wk = 0; out.push(["good", `The ${b.title} passes ${r.yes}–${r.no}.`]); if (b.sponsor === "me" || !canVeto()) enact(b, out); else queueScene("desk", { id: b.id }); }
            } else { b.stage = "failed"; b.why = `Failed ${r.yes}–${r.no} in the ${r.ch.short}`; out.push([b.sponsor === "me" ? "bad" : "info", `The ${b.title} fails ${r.yes}–${r.no} in the ${r.ch.short}.`]); if (b.sponsor === "me") G.approval -= 0.8; }
        } else if (b.stage === "override" && b.wk >= 1) {
            let ok = true; const counts = [];
            J().body.chambers.forEach((ch, ci) => { const r = tally(Object.assign({}, b, { position: "against" }), ci); const yes = r.total - r.yes; counts.push(`${yes}–${r.total - yes}`); if (yes < Math.ceil(r.total * J().body.veto)) ok = false; });
            if (ok) { out.push(["bad", `Veto overridden: the ${b.title} becomes law over your objection (${counts.join(", ")}).`]); enact(b, out, true); G.approval -= 1.5; G.capital = Math.max(0, G.capital - 3); }
            else { b.stage = "vetoed"; out.push(["good", `Your veto of the ${b.title} stands (${counts.join(", ")}).`]); }
        }
    });
    G.bills = G.bills.filter((b) => !(["law", "failed", "vetoed", "withdrawn"].includes(b.stage) && G.t - b.t > 104));
    return out;
}
function canVeto() { return G.level !== "city" || (J().veto || 0) > 0; }
function enact(b, out, overridden) {
    const pol = POLICY[b.k];
    b.stage = "law"; b.done = G.t;
    if (!pol) return;
    if (J().laws.some((l) => l.k === pol.k)) return;
    // Some taxes have to go to the voters first.
    if (pol.ballot && G.level === "city" && !b.voted) { b.stage = "ballot"; queueScene("ballot", { id: b.id }); if (out) out.push(["info", `The ${b.title} goes to the voters.`]); return; }
    J().laws.push({ k: pol.k, t: G.t, water: !!b.water });
    const yr = Math.floor(years());
    if (pol.once && (J().onceYr || {})[pol.k] !== yr) { J().onceYr = Object.assign(J().onceYr || {}, { [pol.k]: yr }); spendOneTime(-pol.once * J().fin.base); log(`${pol.n}: ${money(pol.once * J().fin.base)} lands in the rainy-day fund.`, "good"); }
    const ch = groupsReact(pol.tags, b.water ? 0.6 : 1);
    // The public's view: how far the law sits from where this place leans.
    const pub = J().lean / 100;
    const fit = 0.6 - Math.abs(pol.ideo - pub * 1.2);
    G.approval += fit * 2.5 * (b.sponsor === "me" ? 1 : 0.4);
    if (pol.cost < 0) log(`${pol.n}: raises about ${money(-pol.cost * J().fin.base)} a year.`, "good");
    if (out) out.push([overridden ? "bad" : "good", `${b.title} is now law.`]);
    log(`${b.title} becomes law.`, "good");
    if (b.sponsor === "me" && !overridden) capitalBonus(3);
    b.changes = ch;
}
function repeal(k) { const i = J().laws.findIndex((l) => l.k === k); if (i >= 0) J().laws.splice(i, 1); }

// Can this policy even be proposed here?
function blocked(pol) {
    if (pol.lvl !== G.level) return "Not at this level of government";
    if (J().laws.some((l) => l.k === pol.k)) return "Already law";
    if (G.bills.some((b) => b.k === pol.k && !["law", "failed", "vetoed", "withdrawn"].includes(b.stage))) return "Already moving";
    if (G.level === "city" && pol.preempt && pol.preempt.includes(CITY().st)) return `${STATE().name} law forbids it`;
    if (G.level === "city" && needsState(pol)) return `Needs permission from the state of ${STATE().name}`;
    if (G.level === "city" && (G.preempted || []).includes(pol.k)) return `Preempted by the state`;
    return null;
}

// Some city powers exist only where the state has granted them.
function needsState(pol) { return G.level === "city" && pol.stateOK && !pol.stateOK.includes(CITY().st) && !(G.stateAuth || []).includes(pol.k) && !(pol.preempt || []).includes(CITY().st); }
// Ask the governor and legislature for the power. The odds depend on party, relations and how the state treats its cities.
function askStateOdds(pol) {
    const g = G.gov, St = STATE();
    return clamp(0.3 + (g ? g.rel / 150 + (g.party === G.me.party ? 0.15 : -0.1) : 0) + (St.ctrl === G.me.party ? 0.1 : St.ctrl === "split" ? 0 : -0.1) - St.hostile * 0.35 - (pol.ideo < -0.5 && St.lean > 0 ? 0.15 : 0), 0.03, 0.85);
}
function askState(k) {
    const pol = POLICY[k];
    if (!pol || !needsState(pol)) return "";
    if (G.capital < 5) return "Lobbying the capitol takes 5 political capital.";
    G.capital -= 5;
    const odds = askStateOdds(pol);
    if (chance(odds)) {
        G.stateAuth = (G.stateAuth || []).concat([k]);
        if (G.gov) G.gov.rel -= 3;
        log(`The ${STATE().legis} gives ${CITY().name} the power to adopt the ${pol.n.toLowerCase()}.`, "good");
        return `The state says yes. You can now introduce the ${pol.n.toLowerCase()}.`;
    }
    if (G.gov) G.gov.rel -= 2;
    log(`${STATE().name} refuses to let ${CITY().name} adopt the ${pol.n.toLowerCase()}.`, "warn");
    return `The bill dies in the ${STATE().legis}. Rural lawmakers call it a "${CITY().name} money grab."`;
}

// ── NPC bills: members introduce their own ordinances ───────────────
function npcBill() {
    const ms = bodyMembers().filter((p) => !p.noVote);
    if (!ms.length) return;
    const p = pick(ms);
    const opts = POLICIES.filter((x) => x.lvl === G.level && !blocked(x) && Math.abs(x.ideo - p.ideo) < 0.4);
    if (!opts.length) return;
    const pol = pick(opts);
    const b = introduce(pol.k, p.id, { ci: G.level === "city" ? 0 : p.ch });
    b.hostile = Math.abs(pol.ideo - G.me.ideo) > 0.8;
    log(`${p.name} (${p.seat}) introduces the ${b.title}.`, b.hostile ? "warn" : "info");
}

// ── Demands ─────────────────────────────────────────────────────────
const DEMAND_KINDS = {
    project: { w: { lib: 3, mach: 3, mod: 2, con: 2, prog: 1, ind: 1, freedom: 1, rural: 3 } },
    policy: { w: { prog: 3, lib: 1, mod: 1, con: 2, ind: 3, freedom: 2, rural: 1, mach: 0.5 } },
    job: { w: { mach: 4, lib: 1, mod: 0.5, con: 0.5, rural: 0.5 } },
    police: { w: { mod: 2, con: 3, lib: 1, mach: 1, freedom: 1, rural: 1 } },
    contract: { w: { mach: 3, mod: 1, con: 1, lib: 0.5 } },
    budget: { w: { prog: 2, lib: 2, con: 2, freedom: 2, mod: 1 } }
};
const PROJECTS_CITY = ["a new recreation center", "repaving every street", "a new branch library", "streetlights on every block", "a youth jobs program", "a police substation", "a senior center", "a new park and splash pad", "flood drainage", "a health clinic"];
const PROJECTS_STATE = ["a highway interchange", "a new community college campus", "a rural hospital rescue", "a state park", "a bridge replacement", "broadband for their district"];
function makeDemand(p) {
    const kinds = Object.keys(DEMAND_KINDS);
    const k = weightedPick(kinds, (x) => DEMAND_KINDS[x].w[p.bloc] || 0.3);
    const area = p.area || "their district";
    const base = J().fin.base;
    let d = { id: uid("d"), who: p.id, kind: k, t: G.t, due: G.t + 6 };
    if (k === "project") { const what = pick(G.level === "city" ? PROJECTS_CITY : PROJECTS_STATE); d.text = `wants ${what} for ${area}`; d.cost = base * rnd(0.0015, 0.004) * (G.level === "nation" ? 0.05 : 1); d.what = what; }
    else if (k === "policy") { const pol = POLICY[p.pet] || pick(POLICIES.filter((x) => x.lvl === G.level && !blocked(x))); if (!pol || blocked(pol)) return null; d.text = `wants you to back the ${pol.n.toLowerCase()} (${pol.cat.toLowerCase()})`; d.policy = pol.k; }
    else if (k === "job") { d.text = `wants a political ally hired as a deputy commissioner`; d.heat = 4; }
    else if (k === "police") { d.text = `wants more police patrols in ${area} after a spate of shootings`; d.cost = base * 0.0008; }
    else if (k === "contract") { d.text = `wants a city contract steered to a firm in ${area}`; d.heat = 8; d.cost = base * 0.001; }
    else if (k === "budget") { const dept = pick(DEPTS[G.level]); d.text = `wants ${dept.n.toLowerCase()} spared from cuts and boosted next budget`; d.dept = dept.k; }
    if (!d.text) return null;
    return d;
}
function weightedPick(arr, w) { const ws = arr.map(w); let r = Math.random() * sum(ws); for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; }
function monthDemands() {
    const ms = bodyMembers().filter((p) => !G.demands.some((d) => d.who === p.id));
    const n = G.level === "city" ? rint(1, 2) : rint(1, 3);
    for (let i = 0; i < n; i++) {
        const p = weightedPick(ms, (x) => 0.3 + x.ambition + (x.role ? 1 : 0) + Math.max(0, -x.loyal) / 40);
        if (!p) continue;
        const d = makeDemand(p);
        if (d) { G.demands.push(d); if (p.role || p.ambition > 0.7) queueScene("demand", { id: d.id }); }
    }
}
function grantDemand(id) {
    const d = G.demands.find((x) => x.id === id);
    if (!d) return [];
    const p = P(d.who);
    const out = [];
    if (!p) { G.demands = G.demands.filter((x) => x.id !== id); return out; }
    if (d.cost) { spendOneTime(d.cost); out.push({ label: "Cost", v: money(d.cost), raw: true, good: false }); }
    if (d.policy) { const b = introduce(d.policy, "me"); b.lean[p.id] = 1; out.push({ label: "Bill introduced", v: POLICY[d.policy].n, raw: true, good: true }); }
    if (d.kind === "job") { groupMove("mach_bosses", 6); groupMove("progressives", -3); }
    if (d.kind === "police") { shock("safety", 1); groupMove("police", 2); }
    if (d.kind === "budget") { J().depts[d.dept] = clamp((J().depts[d.dept] || 1) + 0.03, 0.7, 1.3); }
    if (d.heat) { G.heat += d.heat; d.risk = true; if (chance(d.kind === "contract" ? 0.25 : 0.12)) G.flags.probe = (G.flags.probe || 0) + 1; }
    p.loyal = clamp(p.loyal + 18, -100, 100); p.grudge = Math.max(0, p.grudge - 1); p.owed += 1;
    out.push({ label: p.name, v: 18, good: true });
    // Others notice favors.
    bodyMembers().filter((x) => x.id !== p.id && x.ambition > 0.6 && chance(0.25)).slice(0, 2).forEach((x) => { x.loyal -= 3; });
    G.demands = G.demands.filter((x) => x.id !== id);
    log(`You give ${p.name} what they asked: ${d.text.replace(/^wants /, "")}.`, "info");
    return out;
}
function refuseDemand(id, quiet) {
    const d = G.demands.find((x) => x.id === id);
    if (!d) return [];
    const p = P(d.who);
    if (!p) { G.demands = G.demands.filter((x) => x.id !== id); return []; }
    p.loyal = clamp(p.loyal - 14, -100, 100); p.grudge += 1;
    G.demands = G.demands.filter((x) => x.id !== id);
    if (!quiet) log(`You turn down ${p.name}.`, "warn");
    if (p.grudge >= 3 && p.ambition > 0.5) G.flags.rival = p.id;
    return [{ label: p.name, v: -14, good: false }];
}
function spendOneTime(amt) { J().fin.reserve -= amt; J().fin.oneTime += amt; }

// ── Working members ─────────────────────────────────────────────────
function lobby(id, how, billId) {
    const p = P(id);
    const b = billId && G.bills.find((x) => x.id === billId);
    const neg = (G.me.skills.negotiation || 0) + (G.me.traits.includes("dealmaker") ? 2 : 0);
    if (how === "meet") { if (G.capital < 2) return "Not enough political capital."; G.capital -= 2; const v = rint(4, 9) + neg; p.loyal = clamp(p.loyal + v, -100, 100); return `${p.name} appreciates the time. Loyalty +${v}.`; }
    if (how === "pork") { const c = J().fin.base * (G.level === "nation" ? 0.00002 : 0.0012); spendOneTime(c); p.loyal = clamp(p.loyal + 10, -100, 100); if (b) b.pork[p.id] = 1; return `You promise ${p.name} ${money(c)} for a project in ${p.area}.`; }
    if (how === "lean") { if (G.capital < 3) return "Not enough political capital."; G.capital -= 3; p.loyal = clamp(p.loyal - 8, -100, 100); p.grudge += 1; if (b) b.lean[p.id] = (b.lean[p.id] || 0) + 0.7; return `You lean on ${p.name}: their vote is likelier, but they won't forget it.`; }
    return "";
}
function whip(billId) { const b = G.bills.find((x) => x.id === billId); if (!b || G.capital < 4) return "Not enough political capital."; G.capital -= 4; b.whip += 3 + (G.me.skills.negotiation || 0) * 0.5; return `Your team works the phones for the ${b.title}.`; }
function discharge(billId) { const b = G.bills.find((x) => x.id === billId); if (!b || G.capital < 6) return "Not enough political capital."; G.capital -= 6; const ms = bodyMembers().filter((p) => p.ch === b.ci); const sigs = ms.filter((p) => voteScore(p, b) > 0.1).length; if (sigs > ms.length / 2) { b.discharged = true; return `${sigs} members sign the discharge petition. The bill heads to the floor.`; } return `Only ${sigs} members signed. The chair keeps it bottled up.`; }

// ── Your staff ──────────────────────────────────────────────────────
function makeTeamCandidates() {
    G.cands = {};
    const grpKeys = Object.keys(J().groups);
    TEAM[G.level].forEach((R) => {
        G.cands[R.k] = [0, 1, 2].map(() => {
            const bloc = pick(["prog", "lib", "mod", G.level === "city" ? "mach" : "con"]);
            const p = makePerson({ bloc, party: bloc === "con" ? "R" : "D", staff: true, skill: rint(2, 5), ties: shuffle(grpKeys).slice(0, 2), scandal: rnd(0, 0.3) });
            p.blurb = pick(["a veteran of the last administration", "a rising star from the campaign", "a former agency head", "a nonprofit leader", "an outside expert from another city", "a former council staffer", "a corporate executive", "a union-backed organizer"]);
            return p.id;
        });
    });
}
function appoint(role, id) {
    const old = J().team[role];
    J().team[role] = id;
    const p = P(id);
    (p.ties || []).forEach((k) => groupMove(k, 5));
    if (old && old !== id) { const o = P(old); if (o) (o.ties || []).forEach((k) => groupMove(k, -3)); }
    return p;
}
