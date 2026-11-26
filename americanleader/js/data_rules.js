// American Leader: the rules. Conditions, power groups, departments, laws, staff and characters.

const LEVELS = {
    city: { office: "Mayor", body: "council", juris: "city" },
    state: { office: "Governor", body: "legislature", juris: "state" },
    nation: { office: "President", body: "congress", juris: "nation" }
};

// The conditions a government is judged on (0–100, higher is better). Labels change with the level.
const METRICS = {
    safety: { n: "Public safety", i: "🚔", st: "Crime & violence" },
    housing: { n: "Housing affordability", i: "🏠" },
    homeless: { n: "Homelessness response", i: "⛺" },
    streets: { n: "Streets & infrastructure", i: "🛣️", lv: { state: "Roads & bridges", nation: "Infrastructure" } },
    transit: { n: "Transit", i: "🚇", lv: { nation: "Transportation" } },
    schools: { n: "Schools", i: "🏫", lv: { nation: "Education" } },
    economy: { n: "Economy & jobs", i: "💼" },
    environment: { n: "Climate & disaster resilience", i: "🌊" },
    services: { n: "City services", i: "🗑️", lv: { state: "State services & health", nation: "Federal services & health care" } },
    trust: { n: "Public trust", i: "🤝" },
    wages: { n: "Wages & cost of living", i: "💵" },
    food: { n: "Food costs & grocery access", i: "🛒" },
    water: { n: "Water & sewer", i: "🚰" }
};
const MKEYS = Object.keys(METRICS);
const metricName = (k, lvl) => (METRICS[k].lv && METRICS[k].lv[lvl]) || METRICS[k].n;

// Power groups. cares: conditions they judge you on; tags: kinds of policy they love or hate.
const GROUPS = {
    police: { n: "Police union", i: "👮", cares: { safety: 1, wages: 0.2 }, tags: { police: 1.2, reform: -1.2, sweeps: 0.5, austerity: -0.4, immigrant: -0.3 } },
    fire: { n: "Firefighters", i: "🚒", cares: { safety: 0.6, services: 0.5 }, tags: { labor: 0.8, austerity: -1, police: 0.3 } },
    unions: { n: "Public employee unions", i: "🪧", cares: { services: 0.6, wages: 0.6 }, tags: { labor: 1.2, austerity: -1.3, privatize: -1.2, taxup: 0.3, spending: 0.6 } },
    teachers: { n: "Teachers union", i: "🍎", cares: { schools: 1 }, tags: { labor: 1, schools: 1, vouchers: -1.5, austerity: -1, taxup: 0.4, schoolctl: -1.5, police: -0.3 } },
    trades: { n: "Building trades", i: "🏗️", cares: { economy: 0.6, streets: 0.5 }, tags: { growth: 1, labor: 0.8, build: 1.2, green: -0.2 } },
    hospitality: { n: "Culinary & hotel workers", i: "🛎️", cares: { economy: 0.6, housing: 0.5, wages: 0.8 }, tags: { labor: 1.2, tenant: 0.6, tourism: 0.6, immigrant: 0.8 } },
    tourism: { n: "Tourism industry", i: "🧳", cares: { safety: 0.7, economy: 0.8, services: 0.4 }, tags: { tourism: 1.2, taxup: -0.6, sweeps: 0.6, police: 0.4 } },
    business: { n: "Chamber of Commerce", i: "💼", cares: { economy: 1, safety: 0.6 }, tags: { growth: 1, taxup: -1.2, taxdown: 1, labor: -0.6, regulate: -0.8, police: 0.4, sweeps: 0.5, schoolctl: 0.8 } },
    developers: { n: "Developers & real estate", i: "🏢", cares: { economy: 0.6 }, tags: { growth: 1.3, build: 1, tenant: -1.3, regulate: -1, taxup: -0.6 } },
    tech: { n: "Tech industry", i: "💻", cares: { economy: 0.8, housing: 0.4 }, tags: { taxup: -1, bigtax: -1.6, growth: 0.8, build: 0.5, green: 0.3 } },
    homeowners: { n: "Neighborhood associations", i: "🏡", cares: { safety: 0.8, services: 0.5, water: 0.4 }, tags: { taxup: -0.8, upzone: -1.2, police: 0.4, sweeps: 0.6, preserve: 0.8 } },
    progressives: { n: "Progressive activists", i: "✊", cares: { housing: 0.5, homeless: 0.5, trust: 0.4, wages: 0.4 }, tags: { reform: 1.2, tenant: 1.2, police: -1.2, sweeps: -1.3, bigtax: 1, taxup: 0.4, green: 0.8, immigrant: 1, austerity: -0.8, safetynet: 1 } },
    faith: { n: "Black churches & civil rights leaders", i: "⛪", cares: { safety: 0.6, schools: 0.5, food: 0.4, wages: 0.4, trust: 0.6 }, tags: { reform: 0.6, safetynet: 0.8, gentrify: -0.8, jobs: 0.8 } },
    latino: { n: "Latino community leaders", i: "🌮", cares: { wages: 0.6, housing: 0.5, schools: 0.5 }, tags: { immigrant: 1.3, safetynet: 0.6, labor: 0.5, ice: -1.3 } },
    asian: { n: "Asian American community", i: "🏮", cares: { safety: 0.9, schools: 0.7 }, tags: { police: 0.4, ethics: 0.3 } },
    eds_meds: { n: "Universities & hospitals", i: "🎓", cares: { economy: 0.5, safety: 0.5 }, tags: { pilot: -1.4, growth: 0.6, taxup: -0.5 } },
    university: { n: "The university", i: "🎓", cares: { housing: 0.5, safety: 0.4 }, tags: { growth: 0.6, build: 0.5 } },
    energy: { n: "Oil & gas industry", i: "🛢️", cares: { economy: 0.8 }, tags: { green: -1.3, drilling: 1.3, regulate: -1, taxdown: 0.6 } },
    oil: { n: "Oil industry", i: "🛢️", cares: { economy: 0.8 }, tags: { green: -1.2, drilling: 1.3, taxdown: 0.6 } },
    military: { n: "Military community", i: "🎖️", cares: { safety: 0.5, economy: 0.4 }, tags: { military: 1, police: 0.3 } },
    native: { n: "Native community leaders", i: "🪶", cares: { housing: 0.6, environment: 0.6, trust: 0.6 }, tags: { sovereignty: 1.4, green: 0.5, build: -0.3 } },
    film: { n: "Film & TV industry", i: "🎬", cares: { economy: 0.6 }, tags: { filmcredit: 1.4, labor: 0.2 } },
    manufacturing: { n: "Manufacturers", i: "🏭", cares: { economy: 1 }, tags: { growth: 0.8, regulate: -0.8, jobs: 0.6 } },
    autos: { n: "Automakers & the UAW", i: "🚗", cares: { economy: 1 }, tags: { labor: 1, jobs: 1, evs: 0.6, tariffs: 0.4 } },
    retirees: { n: "Retirees", i: "👵", cares: { safety: 0.6, services: 0.6 }, tags: { taxup: -0.8, seniors: 1.2 } },
    environment: { n: "Environmental groups", i: "🌲", cares: { environment: 1, transit: 0.4 }, tags: { green: 1.4, drilling: -1.3, build: -0.2, transit: 0.6 } },
    port: { n: "Port & maritime interests", i: "⚓", cares: { economy: 0.8, streets: 0.5 }, tags: { build: 1, growth: 0.6 } },
    preservation: { n: "Historic preservationists", i: "🏛️", cares: { environment: 0.4 }, tags: { preserve: 1.4, upzone: -0.8, tourism: 0.3 } },
    corporate_hq: { n: "Corporate headquarters", i: "🏙️", cares: { safety: 1, economy: 0.6 }, tags: { taxup: -1, bigtax: -1.4, police: 0.6, sweeps: 0.6, growth: 0.6 } },
    east_african: { n: "Somali & East African community", i: "🕌", cares: { safety: 0.5, economy: 0.6 }, tags: { immigrant: 1.3, ice: -1.4, reform: 0.5 } },
    tenants: { n: "Tenant organizers", i: "🔑", cares: { housing: 1.2 }, tags: { tenant: 1.5, upzone: 0.4, sweeps: -0.6 } },
    orthodox: { n: "Orthodox Jewish community", i: "🕍", cares: { safety: 0.8, schools: 0.4 }, tags: { police: 0.6, vouchers: 0.8 } },
    mach_bosses: { n: "Ward bosses", i: "🎩", cares: { services: 0.6 }, tags: { patronage: 1.4, ethics: -1.2, reform: -0.3 } },
    fishing: { n: "Fishermen & lobstermen", i: "🦞", cares: { economy: 0.6, environment: 0.4 }, tags: { waterfront: 1.2, regulate: -0.6 } },
    labs: { n: "National labs & defense", i: "⚛️", cares: { economy: 0.6, safety: 0.4 }, tags: { military: 0.8, growth: 0.4 } },
    sports: { n: "Sports franchises", i: "🏈", cares: { economy: 0.4 }, tags: { stadium: 1.6 } },
    immigrants: { n: "Immigrant communities", i: "🌍", cares: { housing: 0.6 }, tags: { immigrant: 1.4, ice: -1.4 } },
    // State and national coalitions.
    rural: { n: "Rural voters", i: "🌾", cares: { economy: 0.7, services: 0.5 }, tags: { taxup: -1, guns: 1, citybail: -1, preempt: 0.6, police: 0.5, immigrant: -0.8, rural: 1.3 } },
    suburbs: { n: "Suburban voters", i: "🏘️", cares: { schools: 0.8, safety: 0.8, economy: 0.6 }, tags: { taxup: -0.8, upzone: -0.6, transit: 0.2 } },
    agriculture: { n: "Farm bureau", i: "🚜", cares: { economy: 0.6, environment: 0.3 }, tags: { rural: 1, regulate: -0.8, tariffs: -0.8 } },
    upstate: { n: "Upstate voters", i: "🍎", cares: { economy: 0.8 }, tags: { rural: 0.8, taxup: -0.6 } },
    arab_american: { n: "Arab American community", i: "🕌", cares: { economy: 0.5 }, tags: { immigrant: 0.8 } },
    hollywood: { n: "Hollywood", i: "🎬", cares: { economy: 0.4 }, tags: { filmcredit: 1.4, green: 0.3 } },
    timber: { n: "Timber country", i: "🌲", cares: { economy: 0.8 }, tags: { regulate: -1, rural: 1, green: -0.6 } },
    tribes: { n: "Tribal nations", i: "🪶", cares: { environment: 0.5 }, tags: { sovereignty: 1.4 } },
    evangelicals: { n: "Evangelical Christians", i: "✝️", cares: { safety: 0.6, schools: 0.4 }, tags: { guns: 0.6, vouchers: 1, police: 0.4, immigrant: -0.4, reform: -0.3 } },
    mining: { n: "Mining", i: "⛏️", cares: { economy: 0.8 }, tags: { drilling: 1, regulate: -1 } }
};

// Budget departments at each level. m: what funding moves. share: of discretionary spending.
const DEPTS = {
    city: [
        { k: "police", n: "Police", i: "🚔", share: 0.30, m: { safety: 1, trust: -0.2 }, grp: { police: 1 } },
        { k: "fire", n: "Fire & EMS", i: "🚒", share: 0.14, m: { safety: 0.4, services: 0.3 }, grp: { fire: 1 } },
        { k: "streets", n: "Streets, water & sewer", i: "🛣️", share: 0.14, m: { streets: 1, water: 0.7 }, grp: { trades: 0.5, homeowners: 0.3 } },
        { k: "transit", n: "Transit & transportation", i: "🚌", share: 0.06, m: { transit: 1 }, grp: { environment: 0.3, unions: 0.2 } },
        { k: "housing", n: "Housing & homelessness", i: "🏠", share: 0.08, m: { homeless: 1, housing: 0.5 }, grp: { progressives: 0.5, tenants: 0.5 } },
        { k: "sanitation", n: "Sanitation & 311", i: "🗑️", share: 0.09, m: { services: 1, environment: 0.2 }, grp: { unions: 0.6, homeowners: 0.4 } },
        { k: "parks", n: "Parks, libraries & youth", i: "🌳", share: 0.07, m: { trust: 0.5, schools: 0.4, safety: 0.2 }, grp: { faith: 0.3, homeowners: 0.3 } },
        { k: "econdev", n: "Economic development & workforce", i: "💼", share: 0.04, m: { economy: 1, wages: 0.4 }, grp: { business: 0.5 } },
        { k: "resilience", n: "Emergency management & climate", i: "🌊", share: 0.04, m: { environment: 1 }, grp: { environment: 0.5 } },
        { k: "admin", n: "Administration & IT", i: "🖥️", share: 0.04, m: { services: 0.4, trust: 0.2 }, grp: { unions: 0.3 } }
    ],
    state: [
        { k: "k12", n: "K–12 school aid", i: "🏫", share: 0.30, m: { schools: 1 }, grp: { teachers: 1, suburbs: 0.4 } },
        { k: "medicaid", n: "Medicaid & health", i: "🏥", share: 0.25, m: { services: 1, homeless: 0.2 }, grp: { unions: 0.3 } },
        { k: "higher", n: "Universities & colleges", i: "🎓", share: 0.08, m: { economy: 0.4, schools: 0.4 }, grp: { eds_meds: 0.5, university: 0.5 } },
        { k: "roads", n: "Transportation & water infrastructure", i: "🛣️", share: 0.09, m: { streets: 1, transit: 0.4, water: 0.4 }, grp: { trades: 0.6, rural: 0.4 } },
        { k: "corrections", n: "State police & prisons", i: "🚔", share: 0.08, m: { safety: 0.8, trust: -0.1 }, grp: { police: 0.8, rural: 0.2 } },
        { k: "humansvc", n: "Human services, housing & SNAP", i: "🤝", share: 0.08, m: { homeless: 0.8, housing: 0.4, food: 0.4 }, grp: { progressives: 0.5 } },
        { k: "aid", n: "Aid to cities & counties", i: "🏙️", share: 0.06, m: { services: 0.4, safety: 0.2 }, grp: {} },
        { k: "environment", n: "Environment & emergency management", i: "🌲", share: 0.03, m: { environment: 1 }, grp: { environment: 0.5 } },
        { k: "econdev", n: "Economic development & workforce", i: "💼", share: 0.03, m: { economy: 1, wages: 0.4 }, grp: { business: 0.5 } }
    ],
    nation: [
        { k: "defense", n: "Defense", i: "🎖️", share: 0.42, m: { safety: 0.6, economy: 0.1 }, grp: { military: 1 } },
        { k: "health", n: "Health (NIH, CDC, ACA)", i: "🏥", share: 0.12, m: { services: 1 }, grp: { eds_meds: 0.4 } },
        { k: "homeland", n: "Homeland security & justice", i: "🛂", share: 0.10, m: { safety: 0.6, trust: -0.1 }, grp: { police: 0.6 } },
        { k: "veterans", n: "Veterans", i: "🇺🇸", share: 0.08, m: { services: 0.4 }, grp: { military: 0.6 } },
        { k: "transport", n: "Transportation & infrastructure", i: "🛣️", share: 0.08, m: { streets: 1, transit: 0.6, water: 0.4 }, grp: { trades: 0.6 } },
        { k: "education", n: "Education", i: "🏫", share: 0.06, m: { schools: 1 }, grp: { teachers: 0.8 } },
        { k: "hud", n: "Housing & nutrition (HUD, SNAP)", i: "🏠", share: 0.06, m: { housing: 0.6, homeless: 0.6, food: 0.5 }, grp: { progressives: 0.4 } },
        { k: "energy", n: "Energy & environment", i: "🌲", share: 0.05, m: { environment: 1 }, grp: { environment: 0.6 } },
        { k: "science", n: "Science & commerce", i: "🔬", share: 0.03, m: { economy: 0.8 }, grp: { tech: 0.5 } }
    ]
};

// Laws, ordinances and orders. cost: share of the budget per year (negative raises money).
// fx: how much each condition moves over a year. tags: who loves and hates it.
// ideo: −1 left … +1 right. preempt: states whose law forbids it. exec: can be done by executive order.
const POLICIES = [
    // ── City ──
    { k: "hire_police", lvl: "city", cat: "Public safety", n: "Hire 200 more police officers", d: "A hiring and retention bonus drive to rebuild the force.", cost: 0.012, fx: { safety: 5, trust: -1 }, tags: ["police", "spending"], ideo: 0.4 },
    { k: "oversight", lvl: "city", cat: "Public safety", n: "Civilian police oversight board", d: "An independent board with subpoena power to investigate misconduct.", cost: 0.001, fx: { trust: 6, safety: -1 }, tags: ["reform"], ideo: -0.6, preempt: ["TX"] },
    { k: "violence_int", lvl: "city", cat: "Public safety", n: "Community violence interrupters", d: "Fund outreach workers who mediate disputes before they turn into shootings.", cost: 0.003, fx: { safety: 3, trust: 2 }, tags: ["reform", "safetynet"], ideo: -0.4 },
    { k: "crisis_teams", lvl: "city", cat: "Public safety", n: "Mental health crisis response teams", d: "Send clinicians, not police, to 911 calls about mental health.", cost: 0.004, fx: { trust: 4, homeless: 2, safety: 1 }, tags: ["reform", "safetynet"], ideo: -0.5 },
    { k: "curfew", lvl: "city", cat: "Public safety", n: "Youth curfew", d: "Teenagers off the streets after 10 p.m. on weekends, enforced by police.", cost: 0.0005, fx: { safety: 2, trust: -3 }, tags: ["police"], ideo: 0.5, exec: true },
    { k: "cameras", lvl: "city", cat: "Public safety", n: "Speed and red-light cameras", d: "Automated enforcement on the most dangerous corridors.", cost: -0.002, fx: { safety: 2, streets: 1, trust: -1 }, tags: ["police"], ideo: 0, preempt: ["TX"] },
    { k: "consent", lvl: "city", cat: "Public safety", n: "Comply fully with police reform agreement", d: "Body cameras, use-of-force rules, training and data, under a monitor.", cost: 0.004, fx: { trust: 5, safety: 0 }, tags: ["reform"], ideo: -0.4 },
    { k: "upzone", lvl: "city", cat: "Housing", n: "End single-family-only zoning", d: "Allow duplexes, triplexes and apartments near transit across the city.", cost: 0, fx: { housing: 5, economy: 1 }, tags: ["upzone", "build", "growth"], ideo: -0.1 },
    { k: "rent_control", lvl: "city", cat: "Housing", n: "Rent stabilization", d: "Cap annual rent increases on existing apartments.", cost: 0.001, fx: { housing: 3, economy: -1 }, tags: ["tenant", "regulate"], ideo: -0.8, preempt: ["TX", "GA", "AZ", "WI", "LA", "MI", "IL", "PA", "NV", "AK", "NM"], stateNote: { NY: "Rent rules for stabilized units are set by the Rent Guidelines Board under state law." } },
    { k: "right_counsel", lvl: "city", cat: "Housing", n: "Right to counsel for tenants", d: "Free lawyers for every tenant facing eviction.", cost: 0.003, fx: { housing: 2, homeless: 2 }, tags: ["tenant", "safetynet"], ideo: -0.7 },
    { k: "housing_bond", lvl: "city", cat: "Housing", n: "Affordable housing bond", d: "Borrow to build and preserve thousands of affordable homes.", cost: 0.01, fx: { housing: 4, homeless: 2 }, tags: ["build", "spending"], ideo: -0.4 },
    { k: "vacancy_tax", lvl: "city", cat: "Housing", n: "Vacant property tax", d: "Tax empty storefronts and apartments held off the market.", cost: -0.002, fx: { housing: 2, economy: 1 }, tags: ["taxup", "tenant"], ideo: -0.5, preempt: ["TX", "GA", "AZ"] },
    { k: "str_limits", lvl: "city", cat: "Housing", n: "Short-term rental limits", d: "Cap Airbnb-style rentals to return homes to residents.", cost: 0, fx: { housing: 2, economy: -1 }, tags: ["tenant", "regulate"], ideo: -0.3, preempt: ["AZ", "TX"] },
    { k: "adu", lvl: "city", cat: "Housing", n: "Fast-track permits for new housing", d: "Permits in 60 days for housing that meets the code, no hearings.", cost: 0, fx: { housing: 3, services: 1 }, tags: ["build", "growth"], ideo: 0.1 },
    { k: "camping_ban", lvl: "city", cat: "Homelessness", n: "Ban street camping", d: "After the Supreme Court's Grants Pass ruling, clear encampments and fine those who refuse shelter.", cost: 0.001, fx: { homeless: -2, safety: 1, trust: -2 }, tags: ["sweeps", "police"], ideo: 0.5, exec: true },
    { k: "housing_first", lvl: "city", cat: "Homelessness", n: "Housing First supportive housing", d: "Permanent apartments with services for the chronically homeless.", cost: 0.008, fx: { homeless: 6, safety: 1 }, tags: ["safetynet", "spending"], ideo: -0.5 },
    { k: "tiny_homes", lvl: "city", cat: "Homelessness", n: "Sanctioned tiny-home villages", d: "Quick shelters with doors that lock, run by nonprofits.", cost: 0.003, fx: { homeless: 4 }, tags: ["safetynet"], ideo: -0.2 },
    { k: "min_wage", lvl: "city", cat: "Economy", n: "Raise the city minimum wage to $20", d: "Phased in over three years for all employers.", cost: 0, fx: { wages: 5, economy: -1, trust: 1 }, tags: ["labor"], ideo: -0.7, preempt: ["TX", "GA", "AZ", "WI", "LA", "PA", "MI", "NV", "AK", "IL", "HI", "RI", "ME", "VT", "NY"] },
    { k: "stadium", lvl: "city", cat: "Economy", n: "Stadium and arena district deal", d: "Public money and tax breaks for a new stadium, hotels and housing around it.", cost: 0.008, fx: { economy: 2, trust: -1 }, tags: ["stadium", "growth", "spending"], ideo: 0.1 },
    { k: "hq_abatement", lvl: "city", cat: "Economy", n: "Tax breaks for headquarters", d: "Ten-year property tax abatements for employers that bring 1,000 jobs.", cost: 0.004, fx: { economy: 3 }, tags: ["growth", "taxdown"], ideo: 0.4 },
    { k: "small_biz", lvl: "city", cat: "Economy", n: "Small business and corridor grants", d: "Grants for storefronts on neighborhood commercial streets.", cost: 0.002, fx: { economy: 2, trust: 1 }, tags: ["jobs"], ideo: -0.1 },
    { k: "big_biz_tax", lvl: "city", cat: "Economy", n: "Payroll tax on big employers", d: "A tax on high salaries at the largest companies, Seattle's JumpStart model.", cost: -0.03, fx: { economy: -2 }, tags: ["bigtax", "taxup"], ideo: -0.8, preempt: ["TX", "GA", "AZ", "WI", "LA", "PA", "NV", "MI", "NY", "NM"] },
    { k: "permit_reform", lvl: "city", cat: "Economy", n: "Permit and licensing overhaul", d: "One-stop permits and inspections within two weeks.", cost: 0.001, fx: { economy: 2, services: 2 }, tags: ["growth"], ideo: 0.2 },
    { k: "bag_ban", lvl: "city", cat: "Environment", n: "Plastic bag ban", d: "Ban single-use plastic bags in stores.", cost: 0, fx: { environment: 1 }, tags: ["green", "regulate"], ideo: -0.3, preempt: ["TX", "AZ", "WI", "MN", "MI", "GA", "LA"] },
    { k: "building_perf", lvl: "city", cat: "Environment", n: "Building emissions standards", d: "Require big buildings to cut emissions or pay fines.", cost: 0.001, fx: { environment: 3, economy: -1 }, tags: ["green", "regulate"], ideo: -0.6, preempt: ["TX", "GA", "AZ"] },
    { k: "resilience_bond", lvl: "city", cat: "Environment", n: "Flood and storm resilience bond", d: "Drainage, pumps, sea walls and green infrastructure.", cost: 0.008, fx: { environment: 6, streets: 2 }, tags: ["build", "spending"], ideo: -0.1 },
    { k: "cooling", lvl: "city", cat: "Environment", n: "Heat action plan", d: "Cooling centers, shade trees and heat-relief teams in the hottest neighborhoods.", cost: 0.002, fx: { environment: 2, homeless: 2 }, tags: ["safetynet", "green"], ideo: -0.2 },
    { k: "bus_lanes", lvl: "city", cat: "Transportation", n: "Bus rapid transit lanes", d: "Red bus-only lanes on the ten busiest corridors.", cost: 0.003, fx: { transit: 4, streets: -1 }, tags: ["transit", "green"], ideo: -0.3 },
    { k: "vision_zero", lvl: "city", cat: "Transportation", n: "Vision Zero street redesigns", d: "Narrower lanes, bike lanes and safer crossings on deadly streets.", cost: 0.003, fx: { safety: 2, streets: 2, transit: 1 }, tags: ["transit"], ideo: -0.3 },
    { k: "fare_free", lvl: "city", cat: "Transportation", n: "Fare-free buses", d: "Make city buses free to ride.", cost: 0.006, fx: { transit: 3, trust: 1 }, tags: ["transit", "safetynet", "spending"], ideo: -0.7 },
    { k: "rail_measure", lvl: "city", cat: "Transportation", n: "Light rail ballot measure", d: "Ask voters for a sales tax to build light rail.", cost: 0.004, fx: { transit: 6, economy: 1 }, tags: ["transit", "build", "taxup"], ideo: -0.4 },
    { k: "sanctuary", lvl: "city", cat: "Governance", n: "Sanctuary city policy", d: "Police and jails won't help federal immigration enforcement without a warrant.", cost: 0, fx: { trust: 3 }, tags: ["immigrant"], ideo: -0.7, preempt: ["TX", "GA", "LA", "AZ"], exec: true },
    { k: "ethics", lvl: "city", cat: "Governance", n: "Ethics and campaign finance reform", d: "Ban contractor donations, publish meetings, empower the inspector general.", cost: 0.001, fx: { trust: 5 }, tags: ["ethics"], ideo: -0.2 },
    { k: "rcv", lvl: "city", cat: "Governance", n: "Ranked-choice voting", d: "Rank candidates in city elections; no more runoffs.", cost: 0, fx: { trust: 2 }, tags: ["reform"], ideo: -0.4, preempt: ["TX", "GA", "AZ", "LA", "AK"] },
    { k: "participatory", lvl: "city", cat: "Governance", n: "Participatory budgeting", d: "Let residents vote on how to spend part of the capital budget.", cost: 0.001, fx: { trust: 3 }, tags: ["reform"], ideo: -0.5 },
    { k: "living_wage", lvl: "city", cat: "Wages & jobs", n: "Living wage for city workers and contractors", d: "Everyone the city pays, directly or through a contract, earns at least a living wage.", cost: 0.003, fx: { wages: 3 }, tags: ["labor", "spending"], ideo: -0.5 },
    { k: "job_hubs", lvl: "city", cat: "Wages & jobs", n: "Apprenticeships and job-training hubs", d: "Paid training with employers and unions in health care, trades and tech.", cost: 0.002, fx: { wages: 3, economy: 1 }, tags: ["jobs", "labor"], ideo: -0.2, exec: true },
    { k: "diversify_city", lvl: "city", cat: "Wages & jobs", n: "Economic diversification fund", d: "Recruit and grow new industries (life sciences, advanced manufacturing, clean energy) so the city isn't hostage to one.", cost: 0.004, fx: { economy: 2, wages: 1 }, tags: ["growth", "jobs"], ideo: 0, div: 6 },
    { k: "grocery", lvl: "city", cat: "Food", n: "Grocery stores for food deserts", d: "Land, tax breaks and loans to open full-service groceries in neighborhoods without one.", cost: 0.002, fx: { food: 5, economy: 1 }, tags: ["jobs"], ideo: -0.1 },
    { k: "muni_grocery", lvl: "city", cat: "Food", n: "City-owned grocery stores", d: "Public, nonprofit grocery stores in every borough or district, selling at cost.", cost: 0.003, fx: { food: 4 }, tags: ["safetynet", "spending"], ideo: -0.75 },
    { k: "food_access", lvl: "city", cat: "Food", n: "Food bank and SNAP enrollment drive", d: "Fund food banks and sign up every eligible family for SNAP and WIC.", cost: 0.001, fx: { food: 3, homeless: 1 }, tags: ["safetynet"], ideo: -0.3, exec: true },
    { k: "sewer_bond", lvl: "city", cat: "Water & sewer", n: "Water and sewer overhaul bond", d: "Replace century-old mains and separate combined sewers over ten years. Water bills go up.", cost: 0.009, fx: { water: 8, streets: 1, environment: 1 }, tags: ["build", "spending"], ideo: 0 },
    { k: "lead_lines", lvl: "city", cat: "Water & sewer", n: "Replace every lead service line", d: "Find and replace every lead pipe in ten years, free to homeowners.", cost: 0.005, fx: { water: 5, services: 1 }, tags: ["build", "safetynet"], ideo: -0.2 },
    // ── City revenue: the creative ways cities raise money ──
    // stateOK: states where cities already have the power; elsewhere it needs state permission
    // (ask the governor). preempt: states that ban it outright. ballot: voters must approve it.
    // once: one-time money (share of the budget) into the rainy-day fund.
    { k: "luxury_sticker", lvl: "city", cat: "Revenue", n: "Tiered vehicle sticker: more for luxury and heavy cars", d: "Raise the annual city vehicle sticker for large SUVs, trucks and luxury cars, Chicago-style, and keep it low for small cars.", cost: -0.004, fx: { streets: 1 }, tags: ["taxup", "bigtax"], ideo: -0.3, stateOK: ["IL", "WI", "WA", "MN", "ME", "AK"], payer: "owners of big and luxury vehicles" },
    { k: "head_tax", lvl: "city", cat: "Revenue", n: "Head tax on big employers", d: "A monthly fee for every worker at companies with 100 or more employees (Chicago proposed $21 a head in 2025).", cost: -0.012, fx: { economy: -2 }, tags: ["bigtax", "taxup"], ideo: -0.7, stateOK: ["IL", "WA", "CA", "OR"], preempt: ["TX", "AZ", "GA", "LA"], payer: "large employers" },
    { k: "streaming_tax", lvl: "city", cat: "Revenue", n: "Amusement tax on streaming and cloud services", d: "Extend the amusement and lease taxes to Netflix, Spotify, gaming and cloud computing, as Chicago did.", cost: -0.004, fx: {}, tags: ["taxup"], ideo: -0.4, stateOK: ["IL"], preempt: ["TX"], payer: "subscribers and businesses using cloud software" },
    { k: "social_tax", lvl: "city", cat: "Revenue", n: "Social media tax on big platforms", d: "A monthly charge per local user on platforms with over 100,000 users. Expect a lawsuit.", cost: -0.003, fx: {}, tags: ["bigtax"], ideo: -0.5, stateOK: ["IL"], preempt: ["TX", "GA", "AZ", "LA"], payer: "tech platforms" },
    { k: "betting_tax", lvl: "city", cat: "Revenue", n: "Local tax on sports bets", d: "A city tax on every sports wager placed here, like Chicago's 10.25%.", cost: -0.003, fx: {}, tags: ["taxup"], ideo: -0.2, stateOK: ["IL"], preempt: ["TX", "GA", "CA", "MN", "HI", "AK", "VT", "WA", "NM"], payer: "sportsbooks and bettors" },
    { k: "rideshare_fee", lvl: "city", cat: "Revenue", n: "Per-ride fee on Uber and Lyft", d: "A congestion fee on every ride-hail trip, higher downtown.", cost: -0.002, fx: { transit: 1 }, tags: ["taxup"], ideo: -0.3, stateOK: ["IL", "WA", "CA", "MN", "NY"], preempt: ["TX", "AZ", "GA"], payer: "ride-hail riders" },
    { k: "liquor_tax", lvl: "city", cat: "Revenue", n: "Raise the city liquor tax", d: "A higher tax on beer, wine and spirits sold in the city.", cost: -0.002, fx: {}, tags: ["taxup"], ideo: -0.1, stateOK: ["IL", "MN", "NM", "AK"], payer: "drinkers and bars" },
    { k: "soda_tax", lvl: "city", cat: "Revenue", n: "Tax on sugary drinks", d: "A penny-and-a-half per ounce on soda and sweetened drinks, Philadelphia's model, to fund pre-K.", cost: -0.003, fx: { schools: 1 }, tags: ["taxup"], ideo: -0.4, stateOK: ["PA", "IL", "MN", "NM", "CO"], preempt: ["CA", "WA", "AZ", "MI"], payer: "soda buyers (heavily low-income)" },
    { k: "mansion_tax", lvl: "city", cat: "Revenue", n: "Mansion tax on sales over $1 million", d: "A higher real estate transfer tax on expensive sales, earmarked for homelessness (LA's Measure ULA, Chicago's failed Bring Chicago Home).", cost: -0.006, fx: { homeless: 2, housing: 1 }, tags: ["bigtax", "taxup"], ideo: -0.6, stateOK: ["IL", "CA", "PA", "WA"], preempt: ["TX", "GA", "AZ"], ballot: true, payer: "buyers and sellers of expensive property" },
    { k: "hotel_tax", lvl: "city", cat: "Revenue", n: "Raise the hotel tax", d: "Two more points on hotel rooms, paid mostly by visitors.", cost: -0.003, fx: {}, tags: ["taxup"], ideo: -0.1, stateOK: ["IL", "PA", "NV", "MI", "CA", "WA", "OR", "MN", "NY", "AZ", "WI", "RI", "ME", "VT", "AK", "NM", "HI"], payer: "visitors" },
    { k: "str_tax", lvl: "city", cat: "Revenue", n: "Tax on short-term rentals", d: "Charge Airbnb and Vrbo stays the hotel tax plus a surcharge for housing.", cost: -0.0015, fx: { housing: 1 }, tags: ["taxup", "tenant"], ideo: -0.3, preempt: ["AZ", "TX"], payer: "short-term rental guests and hosts" },
    { k: "impact_fees", lvl: "city", cat: "Revenue", n: "Developer impact and linkage fees", d: "Charge new buildings for the roads, parks and affordable housing they need.", cost: -0.003, fx: { housing: -1, streets: 1 }, tags: ["regulate"], ideo: -0.3, preempt: ["TX"], payer: "developers" },
    { k: "parking_tax", lvl: "city", cat: "Revenue", n: "Raise the parking garage tax", d: "A higher tax on paid parking downtown.", cost: -0.002, fx: { transit: 1 }, tags: ["taxup"], ideo: -0.2, payer: "drivers who park downtown" },
    { k: "garbage_fee", lvl: "city", cat: "Revenue", n: "Raise the garbage collection fee", d: "Charge households closer to what trash pickup actually costs.", cost: -0.003, fx: {}, tags: ["taxup"], ideo: 0.2, payer: "every household" },
    { k: "stormwater_fee", lvl: "city", cat: "Revenue", n: "Stormwater fee on paved surfaces", d: "Bill property owners for the rain that runs off roofs and parking lots, as Philadelphia does, to pay for sewers.", cost: -0.003, fx: { water: 2, environment: 1 }, tags: ["taxup", "green"], ideo: -0.2, payer: "owners of big parking lots and roofs" },
    { k: "cannabis_tax", lvl: "city", cat: "Revenue", n: "Local cannabis sales tax", d: "A city tax on legal cannabis sales.", cost: -0.0015, fx: {}, tags: ["taxup"], ideo: -0.1, stateOK: ["IL", "CA", "OR", "NY", "NM", "RI", "AK", "AZ", "MN", "MI", "NV"], preempt: ["TX", "GA", "WI", "PA", "LA", "HI", "WA"], payer: "cannabis buyers" },
    { k: "pilot_law", lvl: "city", cat: "Revenue", n: "Require payments from big tax-exempt nonprofits", d: "Make universities and hospitals pay toward city services they use (PILOTs), instead of asking nicely.", cost: -0.004, fx: {}, tags: ["pilot", "bigtax"], ideo: -0.4, stateOK: [], payer: "universities and hospitals" },
    { k: "land_value", lvl: "city", cat: "Revenue", n: "Land value tax", d: "Tax land more and buildings less, so speculators sitting on empty lots pay and homeowners pay less (Detroit's plan).", cost: -0.002, fx: { housing: 2, economy: 1 }, tags: ["taxup"], ideo: -0.2, stateOK: [], payer: "owners of vacant land and parking lots" },
    { k: "congestion_fee", lvl: "city", cat: "Revenue", n: "Downtown congestion pricing", d: "Charge cars to enter downtown at rush hour, and spend it on transit (New York's model).", cost: -0.006, fx: { transit: 4, environment: 1 }, tags: ["taxup", "transit"], ideo: -0.4, stateOK: [], payer: "drivers into downtown" },
    { k: "naming_rights", lvl: "city", cat: "Revenue", n: "Sell naming rights and advertising", d: "Sell names on arenas, stations and parks, and ads on city property.", cost: -0.001, fx: {}, tags: ["privatize"], ideo: 0.3, payer: "sponsors" },
    { k: "tif_sweep", lvl: "city", cat: "Revenue", n: "Sweep TIF surplus into the general fund", d: "Declare unspent tax-increment financing money surplus. Chicago does it every year. One-time money.", cost: 0, once: 0.015, fx: {}, tags: [], ideo: -0.2, preempt: ["CA", "AZ"], payer: "nobody, this year" },
    { k: "meter_lease", lvl: "city", cat: "Revenue", n: "Lease the parking meters to investors", d: "A huge one-time payment for 75 years of meter revenue. Chicago did it in 2008 and has regretted it ever since.", cost: 0.004, once: 0.08, fx: { trust: -2 }, tags: ["privatize"], ideo: 0.5, payer: "drivers, for 75 years" },
    { k: "income_surcharge", lvl: "city", cat: "Revenue", n: "Millionaire surcharge on the city income tax", d: "A higher city income or wage tax rate on incomes over $1 million.", cost: -0.008, fx: { economy: -1 }, tags: ["bigtax", "taxup"], ideo: -0.7, stateOK: ["PA", "MI"], preempt: ["TX", "GA", "AZ", "LA", "NV", "WA", "AK", "WI", "IL", "MN", "VT", "NH", "ME", "RI", "HI", "OR", "CA", "NM"], payer: "millionaires" },
    { k: "ceo_pay_tax", lvl: "city", cat: "Revenue", n: "Surtax on companies with overpaid CEOs", d: "A higher business tax on companies whose CEO makes more than 100 times their typical worker, like Portland's 2016 surtax and San Francisco's Overpaid Executive Tax.", cost: -0.003, fx: { wages: 1 }, tags: ["bigtax"], ideo: -0.6, stateOK: ["OR", "CA"], preempt: ["TX", "AZ", "GA", "LA", "NV"], payer: "big companies whose CEO makes 100+ times their typical worker" },
    { k: "vacancy_tax", lvl: "city", cat: "Revenue", n: "Empty homes tax", d: "An annual tax on homes and storefronts left empty most of the year, to push them back onto the market (Oakland's vacant property tax, San Francisco's Prop M, which a court struck down in 2024, and Vancouver's).", cost: -0.0015, fx: { housing: 2 }, tags: ["taxup", "tenant"], ideo: -0.4, stateOK: ["CA", "HI", "WA"], preempt: ["TX", "AZ", "GA"], ballot: true, payer: "owners of empty homes and storefronts" },
    { k: "city_prek", lvl: "city", cat: "Education", n: "Universal pre-K for 4-year-olds", d: "City-funded pre-K in every neighborhood, whoever runs the schools (Seattle, San Antonio's Pre-K 4 SA, Denver, New York's 3-K).", cost: 0.008, fx: { schools: 3, wages: 1 }, tags: ["schools", "safetynet", "spending"], ideo: -0.4 },
    { k: "tutoring", lvl: "city", cat: "Education", n: "High-dosage tutoring corps", d: "Pay college students and retirees to tutor kids who are behind in reading and math, three times a week.", cost: 0.002, fx: { schools: 2 }, tags: ["schools"], ideo: -0.1 },
    { k: "summer_jobs", lvl: "city", cat: "Education", n: "Summer jobs and after-school programs", d: "A paid summer job for every teenager who wants one, and after-school programs in rec centers and libraries.", cost: 0.003, fx: { schools: 1, safety: 2 }, tags: ["schools", "jobs"], ideo: -0.3 },
    { k: "community_schools", lvl: "city", cat: "Education", n: "Community schools partnership", d: "Put city health clinics, food pantries and social workers inside struggling schools, run jointly with the district.", cost: 0.003, fx: { schools: 2, homeless: 1 }, tags: ["schools", "safetynet"], ideo: -0.4 },
    { k: "city_promise", lvl: "city", cat: "Education", n: "Promise scholarship: free college for city grads", d: "The city pays community-college tuition for every public high school graduate (Detroit Promise, Chicago's Star Scholarship).", cost: 0.002, fx: { schools: 1, wages: 1 }, tags: ["schools"], ideo: -0.3 },
    { k: "teacher_housing", lvl: "city", cat: "Education", n: "Housing for teachers", d: "Build affordable apartments for teachers and school staff on city land, as San Francisco did, so schools can keep them.", cost: 0.002, fx: { schools: 1, housing: 1 }, tags: ["schools"], ideo: -0.2 },
    { k: "safe_routes", lvl: "city", cat: "Education", n: "Safe routes to school", d: "Crossing guards, school-zone speed cameras and safe walking routes, to cut chronic absenteeism.", cost: 0.001, fx: { schools: 1, streets: 1 }, tags: ["schools"], ideo: 0 },
    { k: "school_cops", lvl: "city", cat: "Education", n: "Police officers in schools", d: "Fund school resource officers in every high school. Parents are split; students and activists mostly oppose it.", cost: 0.002, fx: { safety: 1, trust: -1 }, tags: ["police"], ideo: 0.4 },
    { k: "mayoral_control", lvl: "city", cat: "Education", n: "Take over the schools: mayoral control", d: "Ask the state to put the school district under the mayor, as New York did in 2002 and Chicago in 1995. You'd appoint the leadership, fund it from the city budget and own the results.", cost: 0, fx: { schools: 3, trust: -2 }, tags: ["schoolctl"], ideo: 0.1, stateOK: [], preempt: ["HI"], unless: () => schoolUnless(), payer: "the city budget, about 3% more a year" },
    { k: "hiring_freeze", lvl: "city", cat: "Governance", n: "Hiring freeze", d: "Freeze all non-public-safety hiring to save money.", cost: -0.01, fx: { services: -3 }, tags: ["austerity"], ideo: 0.5, exec: true },
    { k: "privatize_trash", lvl: "city", cat: "Governance", n: "Contract out trash collection", d: "Hand garbage routes to private haulers.", cost: -0.006, fx: { services: 1, trust: -1 }, tags: ["privatize", "austerity"], ideo: 0.6 },

    // ── State ──
    { k: "medicaid_exp", lvl: "state", cat: "Health", n: "Expand Medicaid", d: "Cover adults up to 138% of poverty; Washington pays 90%.", cost: 0.012, fx: { services: 6, economy: 1 }, tags: ["safetynet", "spending"], ideo: -0.6 },
    { k: "preempt_cities", lvl: "state", cat: "Local control", n: "Preempt local ordinances", d: "Void city rules stricter than state law on labor, business and policing.", cost: 0, fx: { economy: 1, trust: -2 }, tags: ["preempt", "regulate"], ideo: 0.8 },
    { k: "vouchers", lvl: "state", cat: "Education", n: "Universal school vouchers", d: "Every family gets public money for private or home school.", cost: 0.02, fx: { schools: -1 }, tags: ["vouchers", "spending"], ideo: 0.8 },
    { k: "teacher_pay", lvl: "state", cat: "Education", n: "Teacher pay raise", d: "Raise every teacher's salary by $5,000.", cost: 0.012, fx: { schools: 5 }, tags: ["schools", "labor", "spending"], ideo: -0.3 },
    { k: "school_meals", lvl: "state", cat: "Education", n: "Free school meals for all", d: "Breakfast and lunch for every public school student.", cost: 0.004, fx: { schools: 2, homeless: 1 }, tags: ["safetynet"], ideo: -0.5 },
    { k: "state_min_wage", lvl: "state", cat: "Economy", n: "$17 state minimum wage", d: "Phase in a higher minimum wage statewide.", cost: 0, fx: { wages: 5, economy: -1 }, tags: ["labor"], ideo: -0.6 },
    { k: "income_tax_cut", lvl: "state", cat: "Taxes", n: "Income tax cut", d: "Cut the top income tax rate and flatten brackets.", cost: 0.03, fx: { economy: 2 }, tags: ["taxdown"], ideo: 0.8, stWhy: { TX: "Texas has no personal income tax", NV: "Nevada has no personal income tax", WA: "Washington has no personal income tax", AK: "Alaska has no personal income tax" } },
    { k: "gas_tax", lvl: "state", cat: "Taxes", n: "Raise the gas tax for roads", d: "Ten cents a gallon, dedicated to roads and bridges.", cost: -0.015, fx: { streets: 5 }, tags: ["taxup", "build"], ideo: -0.1 },
    { k: "millionaire_tax", lvl: "state", cat: "Taxes", n: "Millionaire's tax", d: "A 4% surtax on income above $1 million.", cost: -0.02, fx: { economy: -1 }, tags: ["bigtax", "taxup"], ideo: -0.8, stWhy: { TX: "Texas's constitution bans a personal income tax", NV: "Nevada's constitution bans a personal income tax", WA: "Washington's courts treat income as property; try a capital gains tax" }, ballotSt: ["IL", "PA", "MI"], payer: "people making over $1 million" },
    { k: "housing_mandate", lvl: "state", cat: "Housing", n: "Statewide housing mandate", d: "Require every city to allow apartments near transit and permit its share of homes.", cost: 0, fx: { housing: 5 }, tags: ["upzone", "build", "preempt"], ideo: -0.1 },
    { k: "transit_fund", lvl: "state", cat: "Transportation", n: "Big-city transit rescue", d: "New state money for transit systems facing a fiscal cliff.", cost: 0.006, fx: { transit: 6 }, tags: ["transit", "spending", "citybail"], ideo: -0.4 },
    { k: "red_flag", lvl: "state", cat: "Public safety", n: "Red flag gun law", d: "Courts can temporarily take guns from people judged a danger.", cost: 0.0005, fx: { safety: 2 }, tags: ["gunsafety"], ideo: -0.5 },
    { k: "permitless", lvl: "state", cat: "Public safety", n: "Permitless carry", d: "Carry a handgun without a license.", cost: 0, fx: { safety: -1 }, tags: ["guns"], ideo: 0.8 },
    { k: "bail_reform", lvl: "state", cat: "Public safety", n: "End cash bail", d: "Release people awaiting trial unless a judge finds them dangerous.", cost: -0.001, fx: { trust: 2, safety: -1 }, tags: ["reform"], ideo: -0.6 },
    { k: "tough_crime", lvl: "state", cat: "Public safety", n: "Tough-on-crime package", d: "Longer sentences for repeat violent and gun offenders, more state troopers.", cost: 0.004, fx: { safety: 3, trust: -2 }, tags: ["police"], ideo: 0.6 },
    { k: "state_takeover", lvl: "state", cat: "Local control", n: "State oversight of a city's finances", d: "A state board to review the city's budget and contracts.", cost: 0, fx: { trust: -2 }, tags: ["preempt"], ideo: 0.5 },
    { k: "cannabis", lvl: "state", cat: "Economy", n: "Legalize cannabis", d: "Legal adult-use sales with a 15% tax.", cost: -0.004, fx: { economy: 1, trust: 1 }, tags: ["reform"], ideo: -0.4, stWhy: { AZ: "Already legal in Arizona", MI: "Already legal in Michigan", CA: "Already legal in California", WA: "Already legal in Washington", OR: "Already legal in Oregon", IL: "Already legal in Illinois", NY: "Already legal in New York", RI: "Already legal in Rhode Island", ME: "Already legal in Maine", VT: "Already legal in Vermont", AK: "Already legal in Alaska", NM: "Already legal in New Mexico", MN: "Already legal in Minnesota", NV: "Already legal in Nevada" } },
    { k: "renewables", lvl: "state", cat: "Environment", n: "100% clean electricity by 2040", d: "A renewable portfolio standard for utilities.", cost: 0.002, fx: { environment: 5, economy: -1 }, tags: ["green", "regulate"], ideo: -0.6 },
    { k: "paid_leave", lvl: "state", cat: "Economy", n: "Paid family and medical leave", d: "Twelve weeks of paid leave, funded by a small payroll premium.", cost: 0, fx: { economy: 0, trust: 2 }, tags: ["labor", "safetynet"], ideo: -0.6 },
    { k: "film_credit", lvl: "state", cat: "Economy", n: "Film and TV tax credit", d: "A 30% credit for productions that shoot in the state.", cost: 0.003, fx: { economy: 1 }, tags: ["filmcredit"], ideo: 0 },
    { k: "property_relief", lvl: "state", cat: "Taxes", n: "Property tax relief", d: "State money to buy down local school property taxes.", cost: 0.02, fx: { housing: 1 }, tags: ["taxdown"], ideo: 0.4 },
    { k: "rural_hospitals", lvl: "state", cat: "Health", n: "Rural hospital rescue fund", d: "Keep small-town hospitals and maternity wards open.", cost: 0.003, fx: { services: 2 }, tags: ["rural", "spending"], ideo: 0 },
    { k: "state_water", lvl: "state", cat: "Water & sewer", n: "State water and sewer infrastructure fund", d: "Low-interest loans and grants for cities to fix pipes, plants and sewers.", cost: 0.004, fx: { water: 6 }, tags: ["build", "citybail"], ideo: -0.1 },
    { k: "grocery_tax", lvl: "state", cat: "Food", n: "End the sales tax on groceries", d: "No state sales tax on food bought at the store.", cost: 0.006, fx: { food: 5 }, tags: ["taxdown"], ideo: 0.1 },
    // ── State revenue ── stWhy: states where it can't happen, and why. ballotSt: needs a constitutional amendment.
    { k: "cap_gains", lvl: "state", cat: "Revenue", n: "Surtax on capital gains over $250,000", d: "A 7% tax on big stock and investment profits, as Washington passed in 2021 and voters upheld in 2024.", cost: -0.005, fx: { schools: 1 }, tags: ["bigtax", "taxup"], ideo: -0.6, stWhy: { TX: "Texas's constitution bans taxing personal income", NV: "Nevada's constitution bans taxing personal income", WA: "Washington already has one" }, payer: "wealthy investors" },
    { k: "loopholes", lvl: "state", cat: "Revenue", n: "Close corporate tax loopholes", d: "Combined reporting, so big companies can't shift profits to subsidiaries in Delaware and overseas.", cost: -0.004, fx: {}, tags: ["bigtax"], ideo: -0.4, stWhy: { TX: "Texas has no corporate income tax to fix", NV: "Nevada has no corporate income tax", WA: "Washington has no corporate income tax", CA: "California already requires combined reporting", IL: "Illinois already requires combined reporting", NY: "New York already requires combined reporting", MN: "Minnesota already requires combined reporting" }, payer: "multistate corporations" },
    { k: "digital_ads", lvl: "state", cat: "Revenue", n: "Tax on digital advertising", d: "A tax on ad revenue earned by giant tech platforms from users here, Maryland's first-in-the-nation model. Expect a lawsuit.", cost: -0.002, fx: {}, tags: ["bigtax"], ideo: -0.5, payer: "Google, Meta and Amazon" },
    { k: "sports_bet_state", lvl: "state", cat: "Revenue", n: "Legalize and tax sports betting", d: "Licensed mobile sportsbooks with a 20% tax on their revenue.", cost: -0.002, fx: { economy: 1 }, tags: ["growth"], ideo: 0, stWhy: { AZ: "Already legal and taxed in Arizona", PA: "Already legal and taxed in Pennsylvania", NV: "Nevada has had legal sports betting for decades", MI: "Already legal and taxed in Michigan", IL: "Already legal and taxed in Illinois", LA: "Already legal and taxed in Louisiana", NY: "Already legal and taxed in New York", RI: "Already legal in Rhode Island", ME: "Already legal in Maine", VT: "Already legal in Vermont", OR: "Already legal in Oregon", WI: "Only the tribes can offer it under their compacts", WA: "Only the tribes can offer it under their compacts", NM: "Only the tribes can offer it under their compacts" }, ballotSt: ["TX", "CA", "GA"], payer: "sportsbooks and bettors" },
    { k: "sin_taxes", lvl: "state", cat: "Revenue", n: "Raise tobacco and vaping taxes", d: "A dollar more per pack and a tax on vapes, earmarked for health.", cost: -0.002, fx: { services: 1 }, tags: ["taxup"], ideo: -0.1, payer: "smokers (heavily low-income)" },
    { k: "luxury_reg", lvl: "state", cat: "Revenue", n: "Surcharge on registering luxury vehicles", d: "A yearly fee on registering cars worth over $60,000.", cost: -0.0015, fx: { streets: 1 }, tags: ["taxup"], ideo: -0.3, payer: "owners of luxury cars" },
    { k: "ev_fee", lvl: "state", cat: "Revenue", n: "Road fee on electric vehicles", d: "EV owners pay no gas tax; charge them $200 a year for the roads.", cost: -0.001, fx: { streets: 1, environment: -1 }, tags: ["taxup"], ideo: 0.3, payer: "electric car owners" },
    { k: "severance", lvl: "state", cat: "Revenue", n: "Raise the oil and gas severance tax", d: "Take a bigger share of every barrel and cubic foot pumped out of the ground.", cost: -0.006, fx: { environment: 1, economy: -1 }, tags: ["bigtax", "regulate"], ideo: -0.5, stWhy: { GA: "Georgia has no oil and gas to tax", WI: "Wisconsin has no oil and gas to tax", NV: "Nevada has little oil and gas", WA: "Washington has no oil and gas to tax", OR: "Oregon has no oil and gas to tax", HI: "Hawaii has no oil and gas", MN: "Minnesota has no oil and gas", NY: "New York banned fracking", RI: "Rhode Island has no oil and gas", ME: "Maine has no oil and gas", VT: "Vermont has no oil and gas", AZ: "Arizona has little oil and gas", IL: "Illinois has little oil and gas left" }, payer: "oil and gas companies" },
    { k: "cap_invest", lvl: "state", cat: "Revenue", n: "Cap-and-invest: make polluters buy permits", d: "Big polluters buy permits for every ton of carbon; the money goes to transit and clean energy (California, Washington).", cost: -0.006, fx: { environment: 4, economy: -1, transit: 1 }, tags: ["green", "regulate"], ideo: -0.6, stWhy: { CA: "California already has cap-and-trade", WA: "Washington already has cap-and-invest" }, payer: "refineries, utilities and, at the pump, drivers" },
    { k: "casinos", lvl: "state", cat: "Revenue", n: "License new casinos", d: "Auction licenses for new casinos in the big cities.", cost: -0.002, fx: { economy: 1 }, tags: ["growth"], ideo: 0.1, stWhy: { NV: "Nevada has casinos already, to put it mildly", HI: "Hawaii bans all gambling by law" }, ballotSt: ["TX", "GA", "CA", "MN"], payer: "gamblers" },
    { k: "mansion_state", lvl: "state", cat: "Revenue", n: "State mansion tax on home sales over $1 million", d: "A higher transfer tax on expensive home sales, for affordable housing.", cost: -0.003, fx: { housing: 1 }, tags: ["bigtax", "taxup"], ideo: -0.5, stWhy: { NY: "New York already has one" }, payer: "buyers of expensive homes" },
    { k: "toll_lease", lvl: "state", cat: "Revenue", n: "Lease a toll road to investors", d: "A giant one-time payment for 75 years of tolls, as Indiana did in 2006. Tolls will go up every year.", cost: 0.002, once: 0.04, fx: { trust: -1 }, tags: ["privatize"], ideo: 0.5, payer: "drivers, for 75 years" },
    { k: "state_homeless", lvl: "state", cat: "Housing", n: "Statewide homelessness and supportive housing fund", d: "Money for cities to buy motels, build supportive housing and run outreach, with strings attached (California's Homekey, Oregon's emergency fund).", cost: 0.006, fx: { homeless: 5, housing: 1 }, tags: ["safetynet", "spending"], ideo: -0.4 },
    { k: "mental_beds", lvl: "state", cat: "Health", n: "Mental health and addiction treatment beds", d: "Open crisis centers and treatment beds so people in crisis go somewhere other than jail or the street.", cost: 0.004, fx: { homeless: 3, safety: 1, services: 1 }, tags: ["safetynet"], ideo: -0.2 },
    { k: "deal_fund", lvl: "state", cat: "Wages & jobs", n: "Deal-closing fund for big employers", d: "A governor's fund to land factories and headquarters (Texas Enterprise Fund, Georgia's megasite deals).", cost: 0.003, fx: { economy: 3 }, tags: ["growth", "corpwelfare"], ideo: 0.3 },
    { k: "small_biz_state", lvl: "state", cat: "Wages & jobs", n: "Small-business loans and Main Street grants", d: "Cheap loans and grants for small businesses in struggling downtowns and rural towns.", cost: 0.002, fx: { economy: 2, wages: 1 }, tags: ["growth"], ideo: 0 },
    { k: "police_standards", lvl: "state", cat: "Public safety", n: "Statewide police standards and body cameras", d: "Body cameras for every officer, a statewide misconduct database and decertification for bad cops.", cost: 0.001, fx: { trust: 4 }, tags: ["reform"], ideo: -0.3 },
    { k: "ethics_state", lvl: "state", cat: "Government", n: "Ethics reform: ban gifts and cap lobbyist money", d: "Ban gifts from lobbyists, cap contributions and create an independent ethics commission.", cost: 0, fx: { trust: 3 }, tags: ["ethics"], ideo: -0.1 },
    { k: "dmv_modern", lvl: "state", cat: "Government", n: "Modernize the DMV and benefits systems", d: "Replace 40-year-old computer systems so licenses, Medicaid and unemployment are handled online in days, not months.", cost: 0.002, fx: { services: 4, trust: 1 }, tags: ["spending"], ideo: 0 },
    { k: "state_diversify", lvl: "state", cat: "Wages & jobs", n: "Economic diversification and innovation fund", d: "A state fund to grow new industries, research parks and startups beyond the state's old mainstays.", cost: 0.004, fx: { economy: 2, wages: 1 }, tags: ["growth", "jobs"], ideo: 0, div: 5 },
    { k: "workforce_state", lvl: "state", cat: "Wages & jobs", n: "Free community college and apprenticeships", d: "Tuition-free community college and paid apprenticeships for in-demand jobs.", cost: 0.005, fx: { wages: 3, schools: 1, economy: 1 }, tags: ["jobs", "schools"], ideo: -0.3 },
    { k: "resilience_fund", lvl: "state", cat: "Environment", n: "Climate resilience fund", d: "Flood control, wildfire prevention and grid hardening.", cost: 0.004, fx: { environment: 5 }, tags: ["build"], ideo: -0.2 },

    // ── Federal ──
    { k: "infrastructure", lvl: "nation", cat: "Economy", n: "Infrastructure bill", d: "$1.2 trillion for roads, bridges, broadband, water pipes and transit over ten years.", cost: 0.02, fx: { streets: 6, transit: 3, water: 4, economy: 1 }, tags: ["build", "spending"], ideo: -0.2 },
    { k: "tax_cut_fed", lvl: "nation", cat: "Taxes", n: "Tax cut extension", d: "Extend and expand individual and business tax cuts.", cost: 0.06, fx: { economy: 2 }, tags: ["taxdown"], ideo: 0.8 },
    { k: "wealth_tax", lvl: "nation", cat: "Taxes", n: "Billionaire minimum tax", d: "A 25% minimum tax on the incomes of the very richest households.", cost: -0.01, fx: { trust: 1 }, tags: ["bigtax", "taxup"], ideo: -0.8 },
    { k: "public_option", lvl: "nation", cat: "Health", n: "Public option for health insurance", d: "A government plan anyone can buy on the exchanges.", cost: 0.02, fx: { services: 6 }, tags: ["safetynet", "spending"], ideo: -0.7 },
    { k: "drug_prices", lvl: "nation", cat: "Health", n: "Negotiate prescription drug prices", d: "Let Medicare negotiate prices for hundreds of drugs.", cost: -0.005, fx: { services: 3 }, tags: ["safetynet", "regulate"], ideo: -0.4 },
    { k: "border_bill", lvl: "nation", cat: "Immigration", n: "Border security act", d: "More agents, a faster asylum system and new limits on crossings.", cost: 0.004, fx: { safety: 2 }, tags: ["police", "ice"], ideo: 0.5 },
    { k: "immigration_reform", lvl: "nation", cat: "Immigration", n: "Comprehensive immigration reform", d: "A path to citizenship for long-time undocumented residents, more visas and border funding.", cost: 0.002, fx: { economy: 2, trust: 1 }, tags: ["immigrant"], ideo: -0.4 },
    { k: "mass_deport", lvl: "nation", cat: "Immigration", n: "Mass deportation program", d: "Expand ICE, detention camps and workplace raids.", cost: 0.006, fx: { economy: -2, trust: -3 }, tags: ["ice", "police"], ideo: 0.9 },
    { k: "background_checks", lvl: "nation", cat: "Public safety", n: "Universal background checks", d: "Background checks on every gun sale.", cost: 0.0005, fx: { safety: 2 }, tags: ["gunsafety"], ideo: -0.5 },
    { k: "police_act", lvl: "nation", cat: "Public safety", n: "National police reform act", d: "Ban chokeholds, create a misconduct registry, limit qualified immunity.", cost: 0.001, fx: { trust: 4 }, tags: ["reform"], ideo: -0.6 },
    { k: "cops_grants", lvl: "nation", cat: "Public safety", n: "Fund 100,000 police officers", d: "COPS grants to hire officers nationwide.", cost: 0.003, fx: { safety: 3 }, tags: ["police", "spending"], ideo: 0.3 },
    { k: "fed_min_wage", lvl: "nation", cat: "Economy", n: "$15 federal minimum wage", d: "Raise the federal minimum wage from $7.25.", cost: 0, fx: { wages: 5, economy: -1 }, tags: ["labor"], ideo: -0.6 },
    { k: "child_credit", lvl: "nation", cat: "Economy", n: "Expanded child tax credit", d: "$3,600 per child, paid monthly.", cost: 0.015, fx: { homeless: 2, economy: 1 }, tags: ["safetynet", "spending"], ideo: -0.5 },
    { k: "housing_act", lvl: "nation", cat: "Housing", n: "National housing supply act", d: "Grants to cities that legalize apartments and tax credits to build millions of homes.", cost: 0.006, fx: { housing: 5 }, tags: ["build", "upzone"], ideo: -0.2 },
    { k: "climate_bill", lvl: "nation", cat: "Environment", n: "Clean energy investment act", d: "Tax credits for clean power, EVs and heat pumps.", cost: 0.01, fx: { environment: 5, economy: 1 }, tags: ["green", "spending"], ideo: -0.6 },
    { k: "drilling", lvl: "nation", cat: "Environment", n: "Expand oil and gas drilling", d: "Open federal lands and waters to leasing.", cost: -0.002, fx: { economy: 1, environment: -3 }, tags: ["drilling"], ideo: 0.7 },
    { k: "tariffs", lvl: "nation", cat: "Economy", n: "Across-the-board tariffs", d: "A 15% tariff on most imports.", cost: -0.01, fx: { economy: -2 }, tags: ["tariffs"], ideo: 0.6 },
    { k: "student_debt", lvl: "nation", cat: "Education", n: "Student debt relief", d: "Cancel up to $20,000 of federal student debt per borrower.", cost: 0.01, fx: { economy: 1 }, tags: ["safetynet", "spending"], ideo: -0.6 },
    { k: "voting_rights", lvl: "nation", cat: "Governance", n: "Voting rights act", d: "Restore preclearance and set national standards for early and mail voting.", cost: 0, fx: { trust: 3 }, tags: ["reform"], ideo: -0.7 },
    { k: "spending_cuts", lvl: "nation", cat: "Taxes", n: "Discretionary spending cuts", d: "Cut non-defense agencies by 10%.", cost: -0.015, fx: { services: -3 }, tags: ["austerity"], ideo: 0.8 },
    { k: "food_prices", lvl: "nation", cat: "Food", n: "Grocery price and meatpacker antitrust crackdown", d: "Go after price gouging and the four meatpackers and grocery chains that dominate the market.", cost: 0.0005, fx: { food: 4 }, tags: ["regulate"], ideo: -0.4 },
    { k: "aid_cities", lvl: "nation", cat: "Economy", n: "Aid to cities and states", d: "Flexible federal money for local governments, police and transit.", cost: 0.008, fx: { services: 3, transit: 2 }, tags: ["citybail", "spending"], ideo: -0.4 }
];
const POLICY = Object.fromEntries(POLICIES.map((p) => [p.k, p]));

// Your staff. Each post adds political capital and strengthens what it oversees.
const TEAM = {
    city: [
        { k: "cos", n: "Chief of Staff", d: "Runs your office and your relationships with the council.", m: {}, cap: 1.2 },
        { k: "deputy", n: "First Deputy Mayor", d: "Runs the departments day to day.", m: { services: 1 }, cap: 0.6 },
        { k: "chief", n: "Police Chief", d: "Leads the police department.", m: { safety: 1, trust: 0.5 }, cap: 0.4 },
        { k: "budget", n: "Budget Director", d: "Writes the budget and finds the money.", m: { services: 0.3 }, cap: 0.4, fiscal: true },
        { k: "comms", n: "Communications Director", d: "Handles the press and your message.", m: { trust: 0.5 }, cap: 0.6, press: true },
        { k: "housing", n: "Deputy Mayor for Housing", d: "Housing, homelessness and development.", m: { housing: 0.6, homeless: 0.8 }, cap: 0.3 },
        { k: "econ", n: "Deputy Mayor for Economic Development", d: "Business recruitment and jobs.", m: { economy: 1 }, cap: 0.3 }
    ],
    state: [
        { k: "cos", n: "Chief of Staff", d: "Runs your office and your relationships with the legislature.", m: {}, cap: 1.3 },
        { k: "budget", n: "Budget Director", d: "Writes the state budget.", m: { services: 0.3 }, cap: 0.5, fiscal: true },
        { k: "health", n: "Health & Human Services Secretary", d: "Medicaid, public health and human services.", m: { services: 1, homeless: 0.5 }, cap: 0.3 },
        { k: "edu", n: "Education Commissioner", d: "School funding and standards.", m: { schools: 1 }, cap: 0.3 },
        { k: "safety", n: "Public Safety Commissioner", d: "State police, prisons and emergencies.", m: { safety: 1, environment: 0.4 }, cap: 0.3 },
        { k: "transport", n: "Transportation Secretary", d: "Roads, bridges and transit.", m: { streets: 1, transit: 0.5 }, cap: 0.3 },
        { k: "comms", n: "Communications Director", d: "Your message statewide.", m: { trust: 0.5 }, cap: 0.6, press: true }
    ],
    nation: [
        { k: "cos", n: "White House Chief of Staff", d: "Runs the West Wing and your dealings with Congress.", m: {}, cap: 1.5 },
        { k: "treasury", n: "Treasury Secretary", d: "Taxes, debt and markets.", m: { economy: 0.6 }, cap: 0.5, fiscal: true },
        { k: "ag", n: "Attorney General", d: "The Justice Department and the FBI.", m: { safety: 0.6, trust: 0.6 }, cap: 0.4 },
        { k: "dhs", n: "Homeland Security Secretary", d: "The border, FEMA and disasters.", m: { safety: 0.5, environment: 0.6 }, cap: 0.3 },
        { k: "hhs", n: "Health & Human Services Secretary", d: "Health care, Medicare and Medicaid.", m: { services: 1 }, cap: 0.3 },
        { k: "defense", n: "Secretary of Defense", d: "The Pentagon.", m: { safety: 0.3 }, cap: 0.4 },
        { k: "press", n: "Press Secretary", d: "The briefing room.", m: { trust: 0.5 }, cap: 0.6, press: true }
    ]
};

const BACKGROUNDS = {
    organizer: { n: "Community organizer", i: "✊", d: "Years of knocking doors, tenant meetings and protests.", allies: ["progressives", "tenants", "faith"], enemies: ["police", "developers"], skills: { charisma: 1 }, lean: -0.5 },
    prosecutor: { n: "Former prosecutor", i: "⚖️", d: "You put people in prison and promise to keep the streets safe.", allies: ["police", "business", "homeowners"], enemies: ["progressives"], skills: { policy: 1 }, lean: 0.3 },
    business: { n: "Business executive", i: "💼", d: "You ran a company and promise to run the city like one.", allies: ["business", "developers", "tech"], enemies: ["unions", "progressives"], skills: { management: 1, fundraising: 1 }, lean: 0.3 },
    council: { n: "City councilmember", i: "🏛️", d: "You know every alderman's price and every ward boss's grudge.", allies: ["mach_bosses", "unions"], enemies: [], skills: { negotiation: 1 }, lean: 0 },
    legislator: { n: "State legislator", i: "📜", d: "You come from the state capitol, with friends (and enemies) there.", allies: ["unions", "business"], enemies: [], skills: { negotiation: 1 }, lean: 0, stateTies: true },
    union: { n: "Union leader", i: "🪧", d: "You led a local and walked picket lines.", allies: ["unions", "trades", "hospitality", "teachers"], enemies: ["business", "developers"], skills: { charisma: 1 }, lean: -0.4 },
    teacher: { n: "Teacher", i: "🍎", d: "Twenty years in public school classrooms.", allies: ["teachers", "faith"], enemies: [], skills: { policy: 1 }, lean: -0.3 },
    pastor: { n: "Pastor", i: "⛪", d: "Your church is the center of a neighborhood.", allies: ["faith", "homeowners"], enemies: [], skills: { charisma: 1 }, lean: -0.1 },
    officer: { n: "Police officer", i: "👮", d: "You wore the badge for twenty years.", allies: ["police", "fire", "homeowners"], enemies: ["progressives"], skills: { management: 1 }, lean: 0.4 },
    tech: { n: "Tech founder", i: "💻", d: "You sold a startup and want to modernize government.", allies: ["tech", "business"], enemies: ["unions", "mach_bosses"], skills: { management: 1, fundraising: 1 }, lean: 0 },
    veteran: { n: "Veteran", i: "🎖️", d: "You served overseas and came home to serve again.", allies: ["military", "police"], enemies: [], skills: { management: 1 }, lean: 0.3 },
    doctor: { n: "Doctor", i: "🩺", d: "An ER physician who saw what poverty does to people.", allies: ["eds_meds", "progressives"], enemies: [], skills: { policy: 1 }, lean: -0.2 }
};

const TRAITS = {
    charismatic: { n: "Charismatic", i: "✨", d: "Rallies and speeches work better." },
    dealmaker: { n: "Dealmaker", i: "🤝", d: "Lobbying council members costs less and works better." },
    wonk: { n: "Policy wonk", i: "📊", d: "Your bills and budgets are tighter; departments run better." },
    fighter: { n: "Street fighter", i: "🥊", d: "You win public fights with governors and presidents, but make enemies." },
    clean: { n: "Squeaky clean", i: "🧼", d: "Scandals are rarer and do less damage." },
    workhorse: { n: "Workhorse", i: "🐎", d: "More political capital every month." },
    media: { n: "Media darling", i: "📺", d: "Better press; approval recovers faster." },
    hothead: { n: "Thin-skinned", i: "🌶️", d: "You hit back hard. Sometimes too hard." }
};
const SKILLS = { charisma: "Charisma", negotiation: "Negotiation", management: "Management", policy: "Policy", fundraising: "Fundraising" };
const SKILL_POINTS = 10;

// Name pools for the people of American politics.
const FIRST = ["James", "Maria", "Michael", "Jennifer", "David", "Patricia", "Robert", "Linda", "Carlos", "Keisha", "William", "Elizabeth", "Andre", "Sofia", "Thomas", "Aisha", "Daniel", "Nancy", "Kevin", "Rosa", "Brian", "Denise", "Luis", "Grace", "Marcus", "Hannah", "Jamal", "Megan", "Anthony", "Lauren", "Darnell", "Mei", "Joseph", "Fatima", "Ryan", "Tamika", "Raj", "Ashley", "Jorge", "Brenda", "Tyrone", "Nicole", "Victor", "Erin", "Hassan", "Monica", "Peter", "Yolanda", "Samuel", "Gabriela", "Frank", "Lakisha", "Juan", "Rachel", "Derek", "Imani", "Paul", "Christine", "Omar", "Diane", "Kenji", "Leilani", "Sean", "Marisol", "Gregory", "Deborah", "Ahmed", "Kristen", "Terrence", "Alicia", "Ricardo", "Shanice", "Kyle", "Teresa", "Vincent", "Amara", "Edward", "Valerie", "Malik", "Ingrid"];
const LAST = ["Johnson", "Garcia", "Williams", "Nguyen", "Brown", "Martinez", "Jones", "Lee", "Davis", "Rodriguez", "Miller", "Washington", "Wilson", "Hernandez", "Moore", "Kim", "Taylor", "Lopez", "Anderson", "Patel", "Thomas", "Jackson", "White", "Harris", "Robinson", "Clark", "Lewis", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Hill", "Ramirez", "Campbell", "Mitchell", "Roberts", "Carter", "Phillips", "Evans", "Turner", "Torres", "Parker", "Collins", "Edwards", "Stewart", "Flores", "Morris", "Murphy", "Rivera", "Cook", "Rogers", "Morgan", "Peterson", "Cooper", "Reed", "Bailey", "Bell", "Gomez", "Kelly", "Howard", "Ward", "Cox", "Diaz", "Richardson", "Wood", "Watson", "Brooks", "Bennett", "Gray", "James", "Reyes", "Cruz", "Hughes", "Price", "Myers", "Long", "Foster", "Sanders", "Ross", "Morales", "Powell", "Sullivan", "Russell", "Ortiz", "Jenkins", "Gutierrez", "Perry", "Butler", "Barnes", "Fisher", "Henderson", "Coleman", "Simmons", "Patterson", "Kahananui", "O'Brien", "Kowalski", "Okafor", "Abdi", "Begay", "Yazzie", "Castillo", "Moreno", "Chen", "Haddad", "Fitzgerald", "Russo", "DeLuca", "Murray"];

// Major issues: what Americans actually worry about, each tied to a condition and the laws and
// orders that move it. You can make up to three your priorities.
const ISSUES = [
    { k: "homeless", n: "Homelessness", i: "⛺", m: "homeless", d: "People living in tents, cars and shelters, and the encampments, overdoses and deaths that come with it.", ds: "Tens of thousands without homes across the state, and mayors begging the capitol for money and treatment beds.", levers: ["state_homeless", "mental_beds", "housing_first", "tiny_homes", "camping_ban", "crisis_teams", "right_counsel", "humansvc", "child_credit"] },
    { k: "housing", n: "Housing costs", i: "🏠", m: "housing", d: "Rents and home prices that outrun paychecks, and not enough homes being built.", levers: ["upzone", "adu", "housing_bond", "rent_control", "str_limits", "vacancy_tax", "housing_mandate", "property_relief", "housing_act"] },
    { k: "food", n: "Food costs & grocery deserts", i: "🛒", m: "food", d: "Grocery bills up a quarter since 2020, and neighborhoods with no supermarket at all.", levers: ["grocery", "muni_grocery", "food_access", "grocery_tax", "school_meals", "food_prices", "child_credit"] },
    { k: "wages", n: "Low wages", i: "💵", m: "wages", d: "Paychecks that don't cover rent, child care and groceries, even with two jobs.", levers: ["min_wage", "living_wage", "job_hubs", "state_min_wage", "workforce_state", "paid_leave", "fed_min_wage"] },
    { k: "diversify", n: "Economic diversification", i: "🧩", m: "economy", dep: true, d: "Depending on one industry (casinos, oil, autos, tourism, tech) means one bad year can sink the whole economy.", levers: ["diversify_city", "small_biz", "permit_reform", "hq_abatement", "state_diversify", "film_credit"] },
    { k: "infra", n: "Roads & bridges", i: "🛣️", m: "streets", d: "Potholes, crumbling bridges and traffic.", ds: "Interstates, rural roads and thousands of bridges rated in poor condition.", levers: ["vision_zero", "gas_tax", "infrastructure", "resilience_bond"] },
    { k: "water", n: "Water & sewer", i: "🚰", m: "water", d: "Century-old water mains that burst, sewers that back up into basements, and lead in the pipes.", ds: "Aging water systems in big cities and small towns alike, lead pipes and sewage overflows. Most of the money flows through the state.", levers: ["sewer_bond", "lead_lines", "state_water", "infrastructure"] },
    { k: "safety", n: "Crime & public safety", i: "🚔", m: "safety", d: "Shootings, car thefts, retail theft and slow 911 response.", ds: "Violent crime, the state police, and prisons that are overcrowded and understaffed.", levers: ["hire_police", "violence_int", "cameras", "curfew", "red_flag", "tough_crime", "background_checks", "cops_grants"] },
    { k: "trust", n: "Police & public trust", i: "🤝", m: "trust", d: "Whether people trust the police and City Hall to treat them fairly.", ds: "Whether people trust the police, the courts and the statehouse to treat them fairly.", levers: ["police_standards", "ethics_state", "oversight", "consent", "ethics", "police_act", "bail_reform"] },
    { k: "schools", n: "Schools", i: "🏫", m: "schools", d: "Test scores, chronic absenteeism and teacher shortages.", ds: "The state writes most of the checks: the school funding formula, teacher pay, standards and tests.", levers: ["city_prek", "tutoring", "summer_jobs", "community_schools", "city_promise", "teacher_housing", "safe_routes", "mayoral_control", "teacher_pay", "school_meals", "vouchers", "workforce_state"] },
    { k: "transit", n: "Transit & traffic", i: "🚇", m: "transit", d: "Buses that don't come, transit agencies facing fiscal cliffs, and long commutes.", ds: "Big-city transit agencies facing fiscal cliffs, and commuter rail that only the state can fund.", levers: ["bus_lanes", "fare_free", "rail_measure", "transit_fund", "infrastructure"] },
    { k: "climate", n: "Disasters & climate", i: "🌊", m: "environment", d: "Floods, heat, fires and storms that are getting worse.", levers: ["resilience_bond", "cooling", "building_perf", "renewables", "resilience_fund", "climate_bill"] },
    { k: "jobs", n: "Jobs & the economy", i: "💼", m: "economy", d: "Unemployment, layoffs and whether new employers are coming.", levers: ["deal_fund", "small_biz_state", "small_biz", "permit_reform", "hq_abatement", "stadium", "job_hubs", "infrastructure"] },
    { k: "services", n: "Basic services", i: "🗑️", m: "services", d: "Trash pickup, 311, permits, the DMV, Medicaid and everything else people expect to just work.", ds: "The DMV, Medicaid enrollment, unemployment checks and state hospitals: everything people expect to just work.", levers: ["dmv_modern", "privatize_trash", "permit_reform", "medicaid_exp", "public_option", "drug_prices"] }
];
