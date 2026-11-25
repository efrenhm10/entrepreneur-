// American Leader: the economy. Sectors with their needs, public investments you build for them,
// subsidies, homegrown startups, and the investment desk where you court real companies.

// wage: typical hourly pay; vol: boom-and-bust; trend: national growth per year (%);
// needs: conditions it needs to flourish; assets: public investments that help it.
const SECTORS = {
    tech: { n: "Tech & AI", i: "💻", wage: 52, vol: true, trend: 3, needs: { schools: 52, housing: 30, transit: 40 },
        assets: [["incubator", "Innovation district & startup incubator", 0.006, 52], ["datacenter", "AI data-center park with power and fiber", 0.01, 78], ["cs", "University computer-science expansion", 0.004, 52]] },
    semis: { n: "Semiconductors & advanced manufacturing", i: "🔬", wage: 40, trend: 4, needs: { water: 50, streets: 50, schools: 45 },
        assets: [["megasite", "Shovel-ready megasite with power and water", 0.012, 78], ["academy", "Semiconductor technician academy", 0.004, 52], ["reclaim", "Industrial water-recycling plant", 0.01, 104]] },
    evs: { n: "EVs & batteries", i: "🔋", wage: 34, vol: true, trend: 2, needs: { streets: 48, water: 45 },
        assets: [["evsite", "Megasite with rail spur", 0.01, 78], ["evtrain", "Battery and EV training center", 0.003, 52]] },
    life: { n: "Life sciences & biotech", i: "🧬", wage: 46, trend: 3, needs: { schools: 55, housing: 30 },
        assets: [["labs", "Wet-lab space for startups", 0.006, 52], ["medpark", "Medical research park with the university", 0.01, 104]] },
    health: { n: "Health care", i: "🏥", wage: 33, trend: 2, needs: { services: 40 },
        assets: [["nursing", "Nursing and allied-health school expansion", 0.004, 52], ["hospital", "New public hospital wing", 0.01, 104]] },
    edu: { n: "Universities & education", i: "🎓", wage: 32, trend: 0.5, needs: {},
        assets: [["campus", "Downtown university campus", 0.008, 104]] },
    logistics: { n: "Logistics & distribution", i: "📦", wage: 24, trend: 1.5, needs: { streets: 50 },
        assets: [["inland", "Freight rail yard and inland port", 0.01, 104], ["cargo", "Airport air-cargo expansion", 0.008, 78]] },
    port: { n: "Port & maritime", i: "⚓", wage: 34, trend: 1, needs: { streets: 45 },
        assets: [["terminal", "Container terminal expansion", 0.012, 104]] },
    energy: { n: "Oil & gas", i: "🛢️", wage: 44, vol: true, trend: -0.5, needs: {},
        assets: [["lng", "Pipeline and export terminal", 0.01, 104]] },
    clean: { n: "Clean energy", i: "☀️", wage: 32, trend: 4, needs: { environment: 45 },
        assets: [["windport", "Wind and solar manufacturing port", 0.01, 78], ["grid", "Grid upgrade and battery storage", 0.008, 78]] },
    finance: { n: "Finance & insurance", i: "🏦", wage: 45, trend: 1, needs: { safety: 50, transit: 40 },
        assets: [["fintech", "Fintech hub and downtown office conversions", 0.005, 52]] },
    prof: { n: "Professional services", i: "💼", wage: 42, trend: 1.5, needs: { safety: 45, transit: 40 },
        assets: [["downtown", "Downtown revitalization district", 0.006, 52]] },
    tourism: { n: "Tourism & hospitality", i: "🧳", wage: 19, vol: true, trend: 1, needs: { safety: 45, environment: 35 },
        assets: [["convention", "Convention center expansion", 0.012, 104], ["waterfront", "Waterfront and arts district", 0.008, 78], ["arena", "New arena and entertainment district", 0.012, 104]] },
    film: { n: "Film, TV & media", i: "🎬", wage: 34, trend: 2, needs: {},
        assets: [["stages", "Soundstage studio complex", 0.008, 78], ["crew", "Film crew training program", 0.002, 26]] },
    aero: { n: "Aerospace & defense", i: "✈️", wage: 44, trend: 1.5, needs: { schools: 48 },
        assets: [["aerocampus", "Aerospace manufacturing campus", 0.01, 104], ["spaceport", "Spaceport and launch site", 0.012, 104]] },
    manufacturing: { n: "Manufacturing", i: "🏭", wage: 28, trend: 0.5, needs: { streets: 45 },
        assets: [["industrial", "Industrial park and job training center", 0.008, 78]] },
    food: { n: "Food, farms & fisheries", i: "🌾", wage: 20, trend: 0, needs: { water: 40 },
        assets: [["foodhub", "Food processing hub and cold storage", 0.005, 52]] },
    construction: { n: "Construction & real estate", i: "🏗️", wage: 30, vol: true, trend: 1, needs: {}, assets: [] },
    retail: { n: "Retail & local services", i: "🛍️", wage: 18, trend: -0.5, needs: { safety: 40 }, assets: [] },
    gov: { n: "Government & military", i: "🏛️", wage: 33, trend: 0, needs: {}, assets: [] }
};
// Real companies that build in America. [name, sector, size: 1 small · 2 medium · 3 huge]
const COMPANIES = [
    ["TSMC", "semis", 3], ["Samsung", "semis", 3], ["Micron", "semis", 3], ["Intel", "semis", 3], ["GlobalFoundries", "semis", 2], ["Texas Instruments", "semis", 3], ["Applied Materials", "semis", 2],
    ["Nvidia", "tech", 2], ["Microsoft", "tech", 2], ["Google", "tech", 2], ["Amazon Web Services", "tech", 3], ["Meta", "tech", 2], ["Apple", "tech", 2], ["OpenAI", "tech", 1], ["Anthropic", "tech", 1], ["Oracle", "tech", 2], ["Salesforce", "tech", 1],
    ["Hyundai Motor Group", "evs", 3], ["Toyota", "evs", 3], ["Ford BlueOval", "evs", 3], ["General Motors", "evs", 3], ["Rivian", "evs", 2], ["Panasonic Energy", "evs", 3], ["Tesla", "evs", 3], ["Honda", "evs", 2],
    ["Eli Lilly", "life", 3], ["Novo Nordisk", "life", 2], ["Moderna", "life", 2], ["Pfizer", "life", 2], ["Genentech", "life", 2], ["Regeneron", "life", 2], ["Amgen", "life", 2],
    ["HCA Healthcare", "health", 2], ["Mayo Clinic", "health", 2], ["Kaiser Permanente", "health", 2],
    ["Amazon fulfillment", "logistics", 2], ["FedEx", "logistics", 2], ["UPS", "logistics", 2], ["Walmart distribution", "logistics", 2], ["Maersk", "port", 2],
    ["ExxonMobil", "energy", 3], ["Chevron", "energy", 3], ["ConocoPhillips", "energy", 2],
    ["First Solar", "clean", 2], ["Qcells", "clean", 2], ["NextEra Energy", "clean", 2], ["Ørsted", "clean", 2], ["Enphase", "clean", 1],
    ["JPMorgan Chase", "finance", 2], ["Goldman Sachs", "finance", 2], ["Citadel", "finance", 1], ["Fidelity", "finance", 2], ["Visa", "finance", 1],
    ["Deloitte", "prof", 2], ["Accenture", "prof", 2],
    ["Marriott", "tourism", 1], ["MGM Resorts", "tourism", 2], ["Live Nation", "tourism", 1], ["Disney", "tourism", 2],
    ["Netflix", "film", 2], ["Amazon MGM Studios", "film", 1], ["NBCUniversal", "film", 2], ["Tyler Perry Studios", "film", 1],
    ["Boeing", "aero", 3], ["Lockheed Martin", "aero", 2], ["SpaceX", "aero", 2], ["Blue Origin", "aero", 2], ["Northrop Grumman", "aero", 2],
    ["Caterpillar", "manufacturing", 2], ["Siemens", "manufacturing", 2], ["GE Appliances", "manufacturing", 2], ["John Deere", "manufacturing", 2],
    ["Tyson Foods", "food", 2], ["PepsiCo", "food", 2]
];
// What a CEO cares about most, and how to pitch it.
const WANTS = {
    taxes: { n: "low taxes and long tax breaks", pitch: "“We'll give you tax certainty for a decade.”" },
    workforce: { n: "a skilled workforce", pitch: "“Our schools and colleges will train your people.”", check: () => J().m.schools >= 48 },
    sites: { n: "a ready site with power, water and roads", pitch: "“The site will be ready: power, water, roads.”", check: () => J().m.water >= 45 && J().m.streets >= 45 },
    life: { n: "a place their people want to live", pitch: "“Your people will love living here.”", check: () => J().m.safety >= 45 && J().m.housing >= 30 },
    speed: { n: "fast permits", pitch: "“You'll have permits in months, not years.”", check: () => J().m.services >= 45 },
    cash: { n: "cash up front", pitch: "“We'll put real money on the table.”" }
};
const STYLES = { bottomline: "Bottom-line: cares about costs", visionary: "Visionary: wants to build something big", cautious: "Cautious: hates surprises and controversy", civic: "Civic-minded: wants to be a good neighbor" };
// The offer you can make. odds per option; cost as a share of the company's investment.
const OFFER = {
    abate: { n: "Property tax abatement", opts: ["None", "5 years", "10 years", "20 years"], odds: [0, 0.07, 0.13, 0.18], want: "taxes" },
    grant: { n: "Cash grant", opts: ["None", "5% of investment", "15% of investment"], odds: [0, 0.07, 0.14], cost: [0, 0.05, 0.15], want: "cash" },
    site: { n: "Site prep, roads & utilities", opts: ["No", "Yes"], odds: [0, 0.09], cost: [0, 0.03], want: "sites" },
    permits: { n: "Fast-track permits", opts: ["No", "Yes"], odds: [0, 0.06], want: "speed" },
    deal: { n: "Local hiring & union labor agreement", opts: ["No", "Yes"], odds: [0, -0.06] }
};

// ── Setup ───────────────────────────────────────────────────────────
function sectorOf(name) {
    const n = name.toLowerCase();
    if (/semicond/.test(n)) return "semis";
    if (/auto|ev/.test(n)) return "evs";
    if (/tech|ai\b/.test(n)) return "tech";
    if (/life sci|biotech|med device/.test(n)) return "life";
    if (/eds & meds|education & health/.test(n)) return "edu";
    if (/health/.test(n)) return "health";
    if (/education|ut\)|universit/.test(n)) return "edu";
    if (/finance|mortgage/.test(n)) return "finance";
    if (/gaming|tourism|casino|hospitality & music/.test(n)) return "tourism";
    if (/retail/.test(n)) return "retail";
    if (/hospitality/.test(n)) return "tourism";
    if (/energy|oil/.test(n)) return "energy";
    if (/port|maritime|shipbuild/.test(n)) return "port";
    if (/logistic|cargo|airport/.test(n)) return "logistics";
    if (/film|media/.test(n)) return "film";
    if (/aerospace|labs/.test(n)) return "aero";
    if (/military|government/.test(n)) return "gov";
    if (/construct|real estate/.test(n)) return "construction";
    if (/professional/.test(n)) return "prof";
    if (/food|fish|agri/.test(n)) return "food";
    return "manufacturing";
}
const employed = (Jx = J()) => Jx.pop * 0.48;
function initEcon(Jx, inds) {
    const sec = {};
    Object.entries(inds).forEach(([name, share]) => { const k = sectorOf(name); sec[k] = (sec[k] || 0) + share; });
    // Natural fit: what this place is already good at (1–5 stars).
    const fit = {};
    Object.keys(SECTORS).forEach((k) => { fit[k] = clamp(Math.round(1 + (sec[k] || 0) / 4), 1, 5); });
    const rest = 100 - sum(Object.values(sec));
    if (rest > 0) sec.retail = (sec.retail || 0) + rest * 0.5, sec.construction = (sec.construction || 0) + rest * 0.3, sec.prof = (sec.prof || 0) + rest * 0.2;
    Jx.ec = { sec, fit, sub: {}, assets: {}, building: [], firms: [], prospects: [], startups: [], t: G.t };
    refreshProspects(Jx, true);
}
function stateInds(stK) {
    const base = Object.assign({}, CITY_ECON[G.cityK].inds);
    const add = { TX: { "Energy": 9 }, LA: { "Energy": 10, "Port & maritime": 4 }, AK: { "Oil & gas": 14, "Fishing & seafood": 4 }, NM: { "Energy": 9 }, GA: { "Agriculture": 4, "Autos & manufacturing": 3 }, WI: { "Agriculture": 6, "Manufacturing": 6 }, MI: { "Autos & manufacturing": 10 }, NV: { "Hospitality & gaming": 6 }, HI: { "Tourism": 6 }, WA: { "Aerospace": 4, "Agriculture": 3 }, OR: { "Agriculture": 4 }, IL: { "Agriculture": 4 }, PA: { "Energy": 3, "Manufacturing": 4 }, MN: { "Agriculture": 4 }, AZ: { "Semiconductors & manufacturing": 3 } }[stK] || {};
    Object.entries(add).forEach(([k, v]) => { base[k] = (base[k] || 0) + v; });
    const tot = sum(Object.values(base));
    Object.keys(base).forEach((k) => { base[k] = base[k] * 100 / tot; });
    return base;
}
const NATION_INDS = { "Health care": 14, "Professional services": 12, "Retail": 11, "Government": 14, "Manufacturing": 8, "Hospitality": 10, "Finance": 6, "Construction & real estate": 7, "Logistics": 6, "Tech": 5, "Energy": 2, "Agriculture": 2, "Education": 3 };

// ── The economy each month ──────────────────────────────────────────
// What a sector needs that this place doesn't have.
function sectorGaps(k, Jx = J()) {
    return Object.entries(SECTORS[k].needs).filter(([m, v]) => Jx.m[m] < v).map(([m, v]) => ({ m, v, now: Math.round(Jx.m[m]) }));
}
function sectorAssets(k, Jx = J()) { return SECTORS[k].assets.filter(([a]) => Jx.ec.assets[`${k}:${a}`]).length; }
function econMonth() {
    const Jx = J();
    if (!Jx.ec) return;
    const ec = Jx.ec;
    // Sectors grow with the national trend, your subsidies and investments, and what they need.
    Object.keys(SECTORS).forEach((k) => {
        const S = SECTORS[k];
        const cur = ec.sec[k] || 0;
        if (cur <= 0 && !ec.sub[k] && !sectorAssets(k)) return;
        const g = S.trend + (ec.sub[k] || 0) * 1.6 + sectorAssets(k) * 1.2 - sectorGaps(k).length * 1.5 + (S.vol ? (G.natEcon || 0) * 6 : (G.natEcon || 0) * 2) + (k === "energy" ? (G.oil || 0) * 6 : 0);
        ec.sec[k] = Math.max(cur > 0 ? 0.3 : 0, cur * (1 + g / 1200)) + (cur <= 0 && (ec.sub[k] || sectorAssets(k)) ? 0.05 : 0);
    });
    const tot = sum(Object.values(ec.sec));
    Object.keys(ec.sec).forEach((k) => { ec.sec[k] = ec.sec[k] * 100 / tot; });
    // Dependence on boom-and-bust sectors.
    Jx.dep = Math.max(6, Math.max(...Object.entries(ec.sec).filter(([k]) => SECTORS[k].vol).map((x) => x[1]), 0));
    // Construction finishes.
    ec.building.filter((b) => G.t >= b.done).forEach((b) => {
        ec.building = ec.building.filter((x) => x !== b);
        if (b.asset) { ec.assets[`${b.sector}:${b.asset}`] = true; log(`${b.name} opens.`, "good"); groupMove("trades", 2); queueScene("ribbon", { name: b.name, sector: b.sector, level: G.level }); }
        if (b.firm) { const f = ec.firms.find((x) => x.id === b.firm); if (f) { f.open = true; log(`${f.name} opens: ${f.jobs.toLocaleString()} jobs at about $${f.wage}/hr.`, "good"); G.approval += Math.min(3, f.jobs / employed() * 300); queueScene("ribbon", { name: f.name, sector: f.sector, firm: f.id, level: G.level }); } }
    });
    // Startups grow, or don't.
    ec.startups.forEach((s) => {
        if (s.done) return;
        if (G.t - s.t > 52 && chance(SECTORS[s.sector].vol ? 0.06 : 0.04)) { s.done = true; if (chance(s.odds)) { const jobs = rint(200, 1500); ec.firms.push({ id: uid("f"), name: s.name, sector: s.sector, jobs, wage: SECTORS[s.sector].wage, t: G.t, abateTo: G.t, open: true, local: true }); ec.sec[s.sector] = (ec.sec[s.sector] || 0) + jobs / employed() * 100; log(`${s.name}, a startup you backed, has grown to ${jobs.toLocaleString()} jobs.`, "good"); } else log(`${s.name}, a startup you backed, has folded.`, "warn"); }
    });
    // New prospects each quarter; old ones lose patience.
    ec.prospects = ec.prospects.filter((p) => p.until > G.t);
    if (monthOf(G.t) % 3 === 0) refreshProspects(Jx);
}
// What the economy adds to conditions.
function econBoost(Jx = J()) {
    const ec = Jx.ec;
    if (!ec) return { economy: 0, wages: 0 };
    const emp = employed(Jx);
    const open = ec.firms.filter((f) => f.open);
    const jobsShare = sum(open, (f) => f.jobs) / emp;
    const avgWage = sum(Object.entries(ec.sec), ([k, v]) => SECTORS[k].wage * v) / 100;
    const startWage = ec.wage0 || (ec.wage0 = avgWage);
    return {
        economy: clamp(jobsShare * 350 + sum(Object.keys(SECTORS), (k) => sectorAssets(k, Jx)) * 0.8 + sum(Object.values(ec.sub), (v) => v) * 0.6, 0, 25),
        wages: clamp((avgWage - startWage) * 1.2 + sum(open, (f) => f.jobs * Math.max(0, f.wage - avgWage)) / emp * 25, -10, 20)
    };
}
// Taxes from new employers once their breaks end, and the cost of subsidies.
function firmRevenue(Jx = J()) {
    const ec = Jx.ec;
    if (!ec) return 0;
    const perJob = Jx.kind === "city" ? 1100 : Jx.kind === "state" ? 2600 : 9000;
    return sum(ec.firms.filter((f) => f.open), (f) => f.jobs * perJob * (G.t >= f.abateTo ? 1 : 0.35));
}
function subsidyCost(Jx = J()) {
    const ec = Jx.ec;
    if (!ec) return 0;
    return sum(Object.entries(ec.sub), ([k, v]) => v * 0.0025 * Jx.fin.base * Math.pow(1.03, years()));
}

// ── Prospects ───────────────────────────────────────────────────────
function refreshProspects(Jx = J(), first) {
    const ec = Jx.ec;
    const have = new Set(ec.firms.map((f) => f.name).concat(ec.prospects.map((p) => p.name)));
    const n = first ? 3 : rint(1, 2);
    // Plants are sized to the local job market: a small city gets smaller projects.
    const scale = Jx.kind === "city" ? clamp(employed(Jx) / 4e5, 0.25, 2.2) : Jx.kind === "state" ? 1.6 : 3;
    for (let i = 0; i < n && ec.prospects.length < 5; i++) {
        const pool = COMPANIES.filter(([name, s]) => !have.has(name) && (ec.fit[s] >= 2 || ec.sub[s] || sectorAssets(s, Jx) || chance(0.25)));
        if (!pool.length) break;
        const [name, sector, size] = pick(pool);
        have.add(name);
        const jobs = Math.max(80, Math.round(rint(300, 900) * size * size * scale / 10) * 10);
        const capex = jobs * rnd(0.3e6, 1.6e6) * (["semis", "evs", "energy", "clean"].includes(sector) ? 2.5 : 1);
        ec.prospects.push({ id: uid("q"), name, sector, jobs, wage: Math.round(SECTORS[sector].wage * rnd(0.9, 1.25)), capex, want: pick(Object.keys(WANTS)), style: pick(Object.keys(STYLES)), until: G.t + rint(16, 30), offer: { abate: 0, grant: 0, site: 0, permits: 0, deal: 0 }, known: false, round: 0, bonus: 0, said: [], rival: pick(["Nashville", "Columbus", "Raleigh", "Salt Lake City", "Charlotte", "Dallas", "Boise", "Indianapolis", "Kansas City", "Greenville", "a suburb next door", "Mexico", "Ontario"]) });
    }
}
// The odds, part by part.
function prospectParts(p) {
    const Jx = J(), parts = [];
    const add = (l, v) => { if (Math.abs(v) >= 0.005) parts.push([l, v]); };
    const dbl = (k) => (p.want === k ? 2 : 1);
    add("Base interest", 0.18);
    add("Buzz from your ribbon cuttings", (Jx.ec.buzz || {})[p.sector] || 0);
    add(`Fit for ${SECTORS[p.sector].n.toLowerCase()} (${"★".repeat(Jx.ec.fit[p.sector])})`, (Jx.ec.fit[p.sector] - 2) * 0.04);
    let inc = 0; Object.entries(OFFER).forEach(([k, o]) => { inc += o.odds[p.offer[k]] * (o.want ? dbl(o.want) : 1); }); add("Your offer", inc);
    sectorGaps(p.sector).forEach((g) => add(`${metricName(g.m, G.level)} too weak (${g.now} vs ${g.v})`, -0.05));
    add("Workforce (schools)", (Jx.m.schools - 50) / 200 * dbl("workforce"));
    add("Quality of life (safety & housing)", ((Jx.m.safety - 50) + (Jx.m.housing - 40) * 0.5) / 250 * dbl("life"));
    add("Infrastructure (roads & water)", ((Jx.m.streets - 50) + (Jx.m.water - 50)) / 300 * dbl("sites"));
    add("Investments you've built", sectorAssets(p.sector) * 0.05);
    if (G.level === "city" && G.gov) add(`The governor (${G.gov.party === G.me.party ? "an ally" : "the other party"})`, (G.gov.rel / 100) * 0.08 + (STATE().hostile > 0.6 && G.gov.party !== G.me.party ? -0.03 : 0));
    add("Your skills", ((G.me.skills.negotiation || 0) + (G.me.skills.charisma || 0)) * 0.01);
    if (p.known) add("You know what they want", 0.04);
    add("Your pitch", p.bonus);
    add(`Competing offer from ${p.rival}`, -0.06);
    return parts;
}
const prospectOdds = (p) => clamp(sum(prospectParts(p), (x) => x[1]), 0.03, 0.95);
function offerCost(p) { return p.capex * (OFFER.grant.cost[p.offer.grant] + OFFER.site.cost[p.offer.site]); }
function offerTerms(p) {
    const yrs = [0, 5, 10, 20][p.offer.abate];
    const perJob = J().kind === "city" ? 1100 : J().kind === "state" ? 2600 : 9000;
    const tax = p.jobs * perJob;
    const cost = offerCost(p);
    return { yrs, tax, cost, payback: yrs + (tax > 0 ? cost / tax : 99) };
}
function makeOffer(id) {
    const ec = J().ec, p = ec.prospects.find((x) => x.id === id);
    if (!p) return "";
    if (G.capital < 4) return "An offer takes 4 political capital.";
    G.capital -= 4;
    const odds = prospectOdds(p), t = offerTerms(p);
    ec.prospects = ec.prospects.filter((x) => x !== p);
    if (!chance(odds)) { log(`${p.name} picks ${p.rival} over ${placeName()}.`, "bad"); groupMove("business", -2); return `${p.name} chose ${p.rival}.`; }
    if (t.cost) spendOneTime(t.cost);
    const f = { id: uid("f"), name: p.name, sector: p.sector, jobs: p.jobs, wage: p.wage, t: G.t, abateTo: G.t + t.yrs * 52, open: false, deal: !!p.offer.deal };
    ec.firms.push(f);
    ec.building.push({ firm: f.id, name: p.name, sector: p.sector, done: G.t + rint(26, 78) });
    ec.sec[p.sector] = (ec.sec[p.sector] || 0) + p.jobs / employed() * 100;
    // Who cheers and who boos.
    groupMove("business", 4); groupMove("trades", 4);
    if (p.offer.deal) { groupMove("unions", 5); groupMove("progressives", 2); }
    if (t.cost > J().fin.base * 0.01 || p.offer.abate >= 3) { groupMove("progressives", -5); G.press -= 2; }
    if (p.offer.permits) groupMove("environment", -3);
    G.approval += Math.min(3, p.jobs / employed() * 250);
    capitalBonus(4);
    log(`${p.name} will build in ${placeName()}: ${p.jobs.toLocaleString()} jobs at about $${p.wage}/hr${t.cost ? `, with ${money(t.cost)} in incentives` : ""}.`, "good");
    return `${p.name} is coming: ${p.jobs.toLocaleString()} jobs. Construction starts now.`;
}
function buildAsset(sector, a) {
    const Jx = J(), A = SECTORS[sector].assets.find((x) => x[0] === a);
    if (!A) return "";
    if (G.capital < 3) return "Breaking ground takes 3 political capital.";
    const cost = A[2] * Jx.fin.base * (Jx.kind === "nation" ? 0.05 : 1);
    G.capital -= 3;
    spendOneTime(cost);
    Jx.ec.building.push({ asset: a, sector, name: A[1], done: G.t + A[3] });
    groupMove("trades", 3); groupMove("business", 2);
    log(`You break ground on the ${A[1].toLowerCase()} (${money(cost)}).`, "info");
    return `Construction begins: ${money(cost)}, about ${Math.round(A[3] / 4.3)} months.`;
}
function setSubsidy(sector, lvl) {
    const ec = J().ec;
    const was = ec.sub[sector] || 0;
    ec.sub[sector] = lvl;
    if (!lvl) delete ec.sub[sector];
    if (lvl > was) { groupMove("business", 2 * (lvl - was)); groupMove("progressives", -2 * (lvl - was)); }
    return lvl ? `${SECTORS[sector].n}: ${["", "tax credits", "aggressive incentives"][lvl]} (${money(lvl * 0.0025 * J().fin.base)} a year).` : `${SECTORS[sector].n}: subsidies ended.`;
}
function backStartup(sector) {
    const Jx = J();
    if (G.capital < 2) return "Takes 2 political capital.";
    G.capital -= 2;
    const cost = Jx.fin.base * 0.0006 * (Jx.kind === "nation" ? 0.05 : 1);
    spendOneTime(cost);
    const name = `${pick(["Peach", "Summit", "Harbor", "Ironwood", "Bluebird", "Keystone", "Northstar", "Mesa", "Lakeshore", "Cedar", "Pioneer", "Canal", "Bayou", "Aloha", "Granite", "Prairie"])} ${{ tech: "AI", semis: "Photonics", evs: "Battery", life: "Bio", health: "Health", logistics: "Freight", clean: "Solar", finance: "Pay", film: "Pictures", aero: "Aerospace", food: "Foods", manufacturing: "Works", tourism: "Hospitality", prof: "Partners", port: "Marine", energy: "Energy", edu: "Learning" }[sector] || "Labs"}`;
    const odds = clamp(0.25 + Jx.ec.fit[sector] * 0.06 + sectorAssets(sector) * 0.08 - sectorGaps(sector).length * 0.08, 0.05, 0.75);
    Jx.ec.startups.push({ name, sector, t: G.t, odds });
    log(`You back ${name}, a local startup, with ${money(cost)}.`, "info");
    return `${name} gets ${money(cost)}. Odds it grows into a real employer: about ${Math.round(odds * 100)}%.`;
}

// ── The CEO visit: three rounds of pitching ─────────────────────────
function pitch(id, k) {
    const p = J().ec.prospects.find((x) => x.id === id);
    if (!p || p.round >= 3) return "";
    p.round++;
    const W = WANTS[k];
    const truth = W.check ? W.check() : true;
    let d, reply;
    if (k === p.want && truth) { d = 0.1; reply = "That is exactly what we need to hear."; p.known = true; }
    else if (k === p.want) { d = 0.02; reply = "That matters to us, but our site selectors have seen your numbers. They don't back you up."; p.known = true; }
    else if (!truth) { d = -0.06; reply = "Our people checked that claim. It isn't true, and now I wonder what else isn't."; }
    else { d = 0.02; reply = "Good to know, but it isn't what keeps me up at night."; }
    if (p.style === "bottomline" && ["taxes", "cash"].includes(k)) d += 0.03;
    if (p.style === "visionary" && k === "life") d += 0.03;
    if (p.style === "cautious" && G.heat > 15) d -= 0.03;
    if (p.style === "civic" && k === "workforce") d += 0.03;
    d += (G.me.skills.charisma || 0) * 0.008 + (G.me.traits.includes("charismatic") ? 0.01 : 0);
    p.bonus += d;
    p.said.push({ k, reply, d });
    if (p.round === 3 && !p.known) { p.known = true; p.said.push({ k: null, reply: `As you leave, an aide lets slip what really matters to them: ${WANTS[p.want].n}.`, d: 0 }); }
    return reply;
}
