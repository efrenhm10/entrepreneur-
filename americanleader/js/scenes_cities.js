// American Leader: each city's own crises and intrigue.

const cm = (f) => randMember(f);
const C3 = (a, b, c) => [a, b, c].filter(Boolean);

// Atlanta
SCENES.atl_watermain = () => S("🚰", kick("Atlanta Watershed"), "The water system fails again", "A 48-inch main bursts at Joseph E. Boone Boulevard. Downtown hotels, Midtown towers and the West End lose water for four days during a convention, and the boil-water notice goes national.",
    [ch("Announce a $5 billion water infrastructure bond and a utility overhaul.", { cost: 0.01, m: { streets: 5, services: 3 }, g: { trades: 6, homeowners: -3 }, a: 1 }, "Engineers and contractors line up. Water bills will rise."),
        ch("Fire the watershed commissioner.", { press: 3, m: { trust: 1 } }, "A head rolls; the pipes are still old."),
        ch(`Ask the state for help with the repairs.`, { cap: -3, gov: -2 }, "", { run: () => (G.gov.party === G.me.party ? (spendOneTime(-J().fin.base * 0.01), "The state chips in.") : "The legislature's answer: maybe Buckhead should run its own water."), req: capOK(3) })]);
SCENES.atl_buckhead = () => S("🏙️", kick("The Gold Dome"), "Buckhead tries to secede again", "Wealthy Buckhead, about 40% of Atlanta's tax base, is back at the Capitol asking for a bill to create its own city. Rural Republicans love the idea of breaking up Atlanta.",
    [ch("Pour police and services into Buckhead to quiet the movement.", { dept: { police: 0.02 }, m: { safety: 1 }, g: { homeowners: 4, business: 4, progressives: -4, faith: -3 } }, "Buckhead's leaders say they'll wait and see."),
        ch("Rally business leaders and the Chamber to kill it in the Senate.", { cap: -5, g: { business: 3 } }, "", { run: () => (chance(0.65) ? "The bill dies on Sine Die." : (J().fin.base *= 0.9, "It passes and voters approve. Atlanta loses a huge share of its tax base.")), req: capOK(5) }),
        ch("Call it what it is: a racial and economic secession.", { a: 1, g: { faith: 6, homeowners: -6 }, gov: -8, press: 2 }, "")]);
SCENES.atl_coptown = () => S("🌳", kick("South River Forest"), "Protesters return to the training center", "Activists who call it 'Cop City' are back in the forest around the public safety training center. A referendum petition with 116,000 signatures is tied up in court; police want the facility finished.",
    [ch("Finish it and protect the site.", { g: { police: 8, progressives: -10 }, m: { safety: 1, trust: -3 } }, ""),
        ch("Let the referendum go to voters.", { g: { progressives: 8, police: -6, business: -3 }, m: { trust: 3 } }, "", { run: () => (chance(0.5) ? "Voters approve the facility." : "Voters reject it; you have to find another site.") }),
        ch("Add a community oversight board for the center.", { cap: -3, g: { progressives: 3, police: -2 } }, "", { req: capOK(3) })]);
SCENES.atl_beltline = () => S("🚋", kick("The Beltline"), "Rail on the Beltline", "Advocates want light rail on the Beltline's eastside trail; MARTA says it can't afford it, and some neighbors don't want trains next to their new condos.",
    [ch("Fight for Beltline rail.", { cost: 0.004, m: { transit: 4 }, g: { environment: 5, homeowners: -3, developers: 3 } }, ""), ch("Push bus rapid transit instead.", { cost: 0.002, m: { transit: 2 } }, ""), ch("Shelve it.", { g: { environment: -5 } }, "")]);

// Phoenix
SCENES.phx_heat = () => S("🌡️", kick("Phoenix"), "118°F for a week", "The heat office reports deaths among unsheltered people, the elderly and a lineman. Cooling centers are full and APS warns of rolling blackouts.",
    [ch("Open cooling centers 24/7 and send heat teams to the canals and parks.", { cost: 0.0008, m: { homeless: 3 }, g: { progressives: 3, latino: 2 } }, ""), ch("Ban outdoor work in the afternoon heat.", { g: { latino: 5, business: -5, trades: -2 } }, "", { run: () => (STATE().hostile > 0.5 ? "The legislature moves to preempt it." : "") }), ch("Ask residents to conserve power.", {}, "")]);
SCENES.phx_water = () => S("💧", kick("The Colorado River"), "Deeper cuts on the Colorado", "The Bureau of Reclamation announces Arizona must cut its Colorado River use again. Developers on the fringe need water certificates; farmers say cities should sacrifice first.",
    [ch("Cap new subdivisions until water is assured.", { m: { environment: 5, housing: -2 }, g: { environment: 6, developers: -8, homeowners: 2 } }, ""), ch("Invest in water recycling and recharge.", { cost: 0.006, m: { environment: 6 }, g: { trades: 3 } }, ""), ch("Buy water rights from farms in western Arizona.", { cost: 0.004, m: { environment: 3 }, gov: -3 }, "Rural counties call it a water grab.")]);
SCENES.phx_tsmc = () => S("🔬", kick("North Phoenix"), "TSMC wants more", "TSMC is expanding to six fabs and wants faster permits, more water and housing for 20,000 workers.",
    [ch("Fast-track everything.", { m: { economy: 5, environment: -2, housing: -1 }, g: { business: 6, trades: 6, environment: -4 } }, ""), ch("Make it build housing and recycle water.", { m: { economy: 3 }, g: { environment: 2, business: -2 } }, ""), ch("Slow down; fix water first.", { m: { economy: -2 }, g: { business: -6, environment: 4 } }, "")]);

// Milwaukee
SCENES.mke_lead = () => S("🚰", kick("Milwaukee Water Works"), "Lead in the water", "Tests find high lead in dozens of north side homes; a toddler is hospitalized. 65,000 lead service lines remain.",
    [ch("Replace every line in ten years, city-funded.", { cost: 0.006, m: { services: 5 }, g: { faith: 5, trades: 4 } }, ""), ch("Apply for federal lead money and hand out filters.", { cap: -2, m: { services: 2 } }, "", { req: capOK(2) }), ch("Stay with the current 20-year plan.", { m: { services: -3 }, g: { faith: -5 } }, "")]);
SCENES.mke_act12 = () => S("📜", kick("Madison"), "The Act 12 strings tighten", "Republican legislators say Milwaukee is out of compliance with Act 12's police staffing floor and threaten to withhold shared revenue.",
    [ch("Hire to the floor, whatever it costs.", { dept: { police: 0.03 }, g: { police: 6, progressives: -4 } }, ""), ch("Fight it in court.", { gov: -4, cost: 0.0002 }, "", { run: () => (chance(0.4) ? "A judge sides with the city." : (J().fin.base *= 0.985, "Shared revenue is cut.")) }), ch("Negotiate a waiver.", { cap: -4 }, "", { req: capOK(4) })]);
SCENES.mke_turnout = () => S("🗳️", kick("National politics"), "Both parties are watching Milwaukee", "National operatives say Milwaukee's turnout will decide Wisconsin. Your party wants you campaigning everywhere; the other side is suing over drop boxes.",
    [ch("Throw yourself into the turnout operation.", { funds: 2e5, pres: sameParty(G.pres) ? 6 : -8, g: { faith: 4 } }, ""), ch("Stay above politics: focus on city services.", { press: 3 }, "")]);

// Philadelphia
SCENES.phl_kensington = () => S("💉", kick("Kensington"), "The Kensington Avenue question", "Residents of Kensington are fed up: needles on school routes, tents under the El. A council member wants the avenue cleared; harm reduction groups warn that sweeps kill people.",
    [ch("Clear the avenue and open treatment beds.", { cost: 0.002, m: { homeless: -1, safety: 2 }, g: { homeowners: 6, progressives: -8, police: 4 } }, ""), ch("Open an overdose prevention site.", { m: { homeless: 3 }, g: { progressives: 6, homeowners: -6 }, gov: -6 }, "Harrisburg's Senate threatens to ban it."), ch("A wellness court and outreach first.", { cost: 0.001, m: { homeless: 2, safety: 1 } }, "")]);
SCENES.phl_septa = () => S("🚇", kick("Harrisburg"), "SEPTA's doomsday budget", "SEPTA will cut service by 45% and raise fares 20% unless the state acts. Senate Republicans want SEPTA to fix crime first and won't vote for Philly money without concessions.",
    [ch("Offer city money if the state matches.", { cost: 0.004, m: { transit: 3 }, gov: 4 }, ""), ch("Bus hundreds of riders to the Capitol.", { cap: -4, press: 3 }, "", { run: () => (chance(0.5) ? (shock("transit", 4), "Harrisburg passes a stopgap.") : (shock("transit", -6), "Cuts take effect.")), req: capOK(4) }), ch("Let the cuts happen and blame Harrisburg.", { m: { transit: -6 }, a: -2 }, "")]);
SCENES.phl_strike = () => S("🗑️", kick("District Council 33"), "DC 33 walks out", "Trash collectors, 911 dispatchers and water workers strike. Garbage piles up in July heat, and the union wants a 5% raise each year.",
    [ch("Settle generously.", { cost: 0.004, g: { unions: 10, business: -3 } }, ""), ch("Hold firm and open drop-off sites.", { g: { unions: -12, business: 3 }, m: { services: -5 }, a: -2 }, ""), ch("Split the difference after a week.", { cost: 0.002, g: { unions: 2 }, m: { services: -2 } }, "")]);
SCENES.phl_wards = () => { const p = cm((x) => x.bloc === "mach") || cm(); return S("🎩", kick("The Democratic City Committee"), "The ward bosses want their due", `${nameWithSeat(p)}, a ward leader for 30 years, says the committee expects jobs for its people at the Parking Authority and the Streets Department. Without them, the wards won't turn out for you.`,
    [ch("Take care of the wards.", { heat: 5, g: { mach_bosses: 10 }, who: { [p.id]: 15 } }, ""), ch("Refuse: you'll hire on merit.", { g: { mach_bosses: -10 }, who: { [p.id]: -15 }, m: { trust: 2 } }, ""), ch("A few jobs, quietly.", { heat: 2, g: { mach_bosses: 4 } }, "")]); };

// Las Vegas
SCENES.lv_culinary = () => S("🛎️", kick("The Culinary Union"), "The Culinary Union wants a deal", "The 60,000-member Culinary Union wants the city to require hotels and casinos to restore daily room cleaning and protect workers from layoffs during downturns. The resorts say it will cost jobs.",
    [ch("Back the union.", { g: { hospitality: 10, tourism: -6, latino: 4 } }, ""), ch("Broker a deal between them.", { cap: -4, g: { hospitality: 4, tourism: 2 } }, "", { req: capOK(4) }), ch("Stay out of it.", { g: { hospitality: -6 } }, "")]);
SCENES.lv_tunnels = () => S("🕳️", kick("Las Vegas"), "The flood tunnels", "Hundreds of people live in the storm drains under the city. A flash flood is forecast this weekend.",
    [ch("Send outreach teams and open emergency shelter.", { cost: 0.0006, m: { homeless: 3 } }, ""), ch("Clear the tunnels with police under the camping ban.", { m: { homeless: -2, safety: 1 }, g: { progressives: -5, tourism: 3 } }, ""), ch("Issue warnings.", {}, "", { run: () => (chance(0.4) ? (shock("homeless", -4), "The flood kills two people.") : "The storm passes.") })]);
SCENES.lv_stadium = () => S("🏟️", kick("Sports"), "A team wants a stadium", "A major league franchise wants public money for a new arena near downtown. Fans love it; economists don't.",
    [ch("Offer hotel-tax bonds.", { cost: 0.004, m: { economy: 2 }, g: { tourism: 6, sports: 8, progressives: -4 } }, ""), ch("Offer land, no cash.", { g: { tourism: 2 } }, ""), ch("Say no.", { g: { tourism: -4, progressives: 3 } }, "")]);

// Detroit
SCENES.det_lvt = () => S("🏚️", kick("Lansing"), "The land value tax", "Your plan to tax land more and buildings less, punishing speculators who sit on vacant lots, needs approval from the legislature in Lansing.",
    [ch("Lobby hard in Lansing.", { cap: -5, gov: 2 }, "", { run: () => (chance(0.5) ? (shock("housing", 3), shock("economy", 2), "It passes. Speculators start selling.") : "It stalls in the House."), req: capOK(5) }), ch("Cut rates the old way, with less revenue.", { g: { homeowners: 6 }, cost: 0.003 }, ""), ch("Drop it.", {}, "")]);
SCENES.det_flood = () => S("🌊", kick("Detroit"), "Basements flood again", "Four inches of rain backs up the combined sewers into 20,000 basements on the east side. Residents want compensation.",
    [ch("Pay claims and build green infrastructure.", { cost: 0.004, m: { environment: 4 }, g: { faith: 4, homeowners: 4 } }, ""), ch("Blame the regional water authority.", { press: -1 }, ""), ch("Seek federal disaster aid.", { cap: -2 }, "", { run: () => (sameParty(G.pres) ? (spendOneTime(-J().fin.base * 0.003), "FEMA approves aid.") : "FEMA denies individual assistance."), req: capOK(2) })]);
SCENES.det_uaw = () => S("🚗", kick("The Big Three"), "Layoffs at the Jefferson North plant", "Stellantis announces 2,000 layoffs as it delays an EV launch. The UAW wants the city to pressure the company.",
    [ch("March with the UAW.", { g: { autos: 6, unions: 6, business: -3 } }, ""), ch("Offer tax incentives to bring a new model.", { cost: 0.003, m: { economy: 3 }, g: { autos: 4, progressives: -3 } }, ""), ch("Retrain workers for other jobs.", { cost: 0.001, m: { economy: 1 } }, "")]);

// San Francisco
SCENES.sf_housing = () => S("🏘️", kick("Sacramento"), "The state threatens to take over your zoning", "California's housing department says San Francisco is too slow approving homes. Miss the target and the 'builder's remedy' lets developers bypass city zoning entirely.",
    [ch("Upzone the west side and kill discretionary review.", { m: { housing: 6 }, g: { homeowners: -10, developers: 8, tech: 4, progressives: -3 } }, "Neighborhood groups vow a referendum."), ch("Do the minimum.", { gov: -6 }, "", { run: () => { G.preempted = (G.preempted || []); return "The state puts you on notice."; } }), ch("Sue the state.", { gov: -10, g: { homeowners: 6 } }, "")]);
SCENES.sf_tenderloin = () => S("💊", kick("The Tenderloin"), "Fentanyl deaths hit a record", "More than 70 people died of overdoses last month. Moderates want arrests and forced treatment; progressives want safe consumption sites.",
    [ch("A police surge on dealers and mandatory treatment.", { m: { safety: 2, homeless: -1 }, g: { business: 5, progressives: -8, asian: 4 } }, ""), ch("Open a supervised consumption site.", { m: { homeless: 3 }, g: { progressives: 6, business: -4 }, pres: -6 }, "Federal prosecutors warn they'll intervene."), ch("Both: arrest dealers, fund treatment beds.", { cost: 0.001, m: { safety: 1, homeless: 1 } }, "")]);
SCENES.sf_recall = () => { const p = cm((x) => x.bloc === "prog"); return S("✍️", kick("San Francisco politics"), "A recall campaign against a supervisor", `Tech-funded moderates are bankrolling a recall of ${p ? nameWithSeat(p) : "a progressive supervisor"}. They want you to endorse it.`,
    [ch("Endorse the recall.", { g: { tech: 6, progressives: -8 }, who: p ? { [p.id]: -30 } : {} }, "", { run: () => (p && chance(0.55) ? (replaceMember(p, makePerson({ bloc: "mod", party: "D", body: "council", ch: 0, seat: p.seat, area: p.area })), "The recall succeeds; you appoint a moderate replacement.") : "The recall fails.") }), ch("Oppose it.", { g: { progressives: 6, tech: -5 }, who: p ? { [p.id]: 20 } : {} }, ""), ch("Stay neutral.", {}, "")]); };
SCENES.sf_downtown = () => S("🏙️", kick("Downtown"), "The 'doom loop'", "Office vacancy is 35%; a flagship mall has closed. AI companies are leasing, but want a tax break on gross receipts.",
    [ch("Give AI firms a tax break.", { cost: 0.003, m: { economy: 4 }, g: { tech: 8, progressives: -5 } }, ""), ch("Convert offices to housing.", { cost: 0.002, m: { housing: 2, economy: 1 } }, ""), ch("Clean streets and more police downtown.", { dept: { police: 0.01, sanitation: 0.02 }, g: { business: 6 } }, "")]);

// Seattle
SCENES.sea_jumpstart = () => S("💼", kick("Seattle City Hall"), "Raise the JumpStart tax?", "Progressives want to raise the payroll tax on big employers to close the budget gap. Amazon hints it will keep growing in Bellevue instead.",
    [ch("Raise it.", { cost: -0.015, m: { economy: -2 }, g: { progressives: 8, tech: -12, business: -8 } }, ""), ch("Cut spending instead.", { dept: { parks: -0.03, admin: -0.03 }, g: { unions: -5, business: 4 } }, ""), ch("A smaller tax on all businesses.", { cost: -0.006, g: { business: -6, tech: -2 } }, "")]);
SCENES.sea_quake = () => SCENES.hz_earthquake();
SCENES.sea_spd = () => S("👮", kick("Seattle Police"), "911 response times hit a record", "Priority 1 calls wait more than eight minutes. The police guild wants a raise; a federal monitor still oversees the department.",
    [ch("A big raise and hiring bonuses.", { cost: 0.004, m: { safety: 3 }, g: { police: 10, progressives: -5 } }, ""), ch("Expand civilian responders instead.", { cost: 0.002, m: { safety: 1, trust: 2 }, g: { progressives: 4, police: -5 } }, ""), ch("Both, slowly.", { cost: 0.003, m: { safety: 2 } }, "")]);

// Portland
SCENES.pdx_council = () => S("🏛️", kick("The new council"), "Who runs Portland?", "Under the new charter, twelve councilors and a city administrator share power with you. The council president is building a majority to set the agenda without you.",
    [ch("Court the moderates for a governing majority.", { cap: -4, body: 6 }, "", { req: capOK(4) }), ch("Go over their heads to voters.", { press: 3, body: -6 }, ""), ch("Let it play out.", {}, "")]);
SCENES.pdx_cef = () => S("⚡", kick("The Clean Energy Fund"), "Raid the Clean Energy Fund?", "The voter-approved tax on big retailers raises $200 million a year, far more than expected. Budget writers want to spend some on police and homelessness; climate groups say no.",
    [ch("Redirect some to homelessness and safety.", { cost: -0.04, g: { environment: -10, business: 3 }, m: { homeless: 2 } }, ""), ch("Keep it for climate.", { g: { environment: 6 }, m: { environment: 3 } }, ""), ch("Ask voters.", { cap: -2 }, "", { req: capOK(2) })]);
SCENES.pdx_protest = () => S("📣", kick("Portland"), "Nightly protests at the ICE facility", "Protesters and federal agents clash outside the ICE building every night. The President calls Portland 'war-ravaged' and threatens troops.",
    [ch("Defend the protesters' rights.", { g: { progressives: 6 }, pres: -10 }, ""), ch("Have police keep the peace firmly.", { g: { police: 4, progressives: -4 }, m: { safety: 1 } }, ""), ch("Ask the feds to stand down.", { cap: -3, pres: -2 }, "", { req: capOK(3) })]);

// Austin
SCENES.aus_preempt = () => S("🤠", kick("The Texas Capitol"), "The 'Death Star' strikes", "The Legislature passes a law voiding city rules that go beyond state law on labor, agriculture, business and property. Your water-break ordinance for construction workers is dead.",
    [ch("Join Houston and San Antonio in a lawsuit.", { cost: 0.0002, gov: -8, press: 2 }, "", { run: () => (chance(0.3) ? "A Travis County judge blocks it; the state appeals." : "The Texas Supreme Court upholds it.") }), ch("Comply and work through incentives instead.", { g: { progressives: -4, business: 3 } }, ""), ch("Defy it.", { gov: -14, g: { progressives: 6 } }, "", { run: () => (chance(0.5) ? (G.heat += 5, "The attorney general sues you personally.") : "") })]);
SCENES.aus_sixth = () => S("🎸", kick("Sixth Street"), "A shooting on Sixth Street", "A crowded Saturday night ends with gunfire on Dirty Sixth. The governor offers to send DPS troopers, who already patrol parts of the city.",
    [ch("Accept DPS help.", { m: { safety: 2, trust: -2 }, gov: 6, g: { progressives: -5 } }, ""), ch("Close Sixth to cars and add APD and lighting.", { cost: 0.0005, m: { safety: 2 }, g: { business: 2 } }, ""), ch("Refuse the state.", { gov: -6 }, "")]);
SCENES.aus_freeze = () => SCENES.hz_freeze();

// Houston
SCENES.hou_beryl = () => S("🌀", kick("Houston"), "Two million without power", "A hurricane knocks out CenterPoint's lines across the city in July heat. People are dying in hot homes; the utility says it could be two weeks.",
    [ch("Open cooling centers and hammer CenterPoint publicly.", { cost: 0.001, a: 2, m: { environment: -2 }, g: { homeowners: 4 } }, "", { run: () => "The governor orders an investigation of the utility." }), ch("Coordinate quietly with the utility.", { m: { environment: -3 } }, ""), ch("Demand the state let the city bury power lines.", { cap: -3, gov: -3 }, "", { req: capOK(3) })]);
SCENES.hou_firefighters = () => S("🚒", kick("Houston Fire"), "The firefighter settlement bill comes due", "You owe firefighters $650 million in back pay and raises from an eight-year dispute, on top of a structural deficit. The controller says the money isn't there.",
    [ch("Issue judgment bonds.", { g: { fire: 6 } }, "", { run: () => { J().fin.debt += J().fin.base * 0.2; return "Paid, with interest, for 20 years."; } }), ch("Ask voters to lift the revenue cap.", { cap: -5 }, "", { run: () => (chance(0.45) ? (J().fin.base *= 1.04, "Voters lift the cap.") : "Voters say no."), req: capOK(5) }), ch("Cut other departments.", { dept: { parks: -0.05, sanitation: -0.04 }, g: { unions: -6 } }, "")]);
SCENES.hou_chemical = () => SCENES.hz_chemical();

// Chicago
SCENES.chi_pension = () => S("📉", kick("The pension funds"), "The pension bill comes due", "The four pension funds are 25% funded. This year's payment jumps by $300 million under state law. Springfield just sweetened police and fire pensions without paying for it.",
    [ch("Make the full payment with a property tax hike.", { g: { homeowners: -10, unions: 4, business: -6 }, a: -3 }, "", { run: () => { J().fin.lines[0].rate *= 1.08; J().fin.pension += 0.03; return "The funds get their money. Homeowners get the bill."; } }), ch("Skip part of the payment.", { a: 1 }, "", { run: () => { J().fin.pension -= 0.04; J().fin.ratingScore = Math.max(0, J().fin.ratingScore - 1); J().fin.rating = RATINGS[J().fin.ratingScore]; return "Rating agencies downgrade Chicago."; } }), ch("Ask Springfield for a casino tax share.", { cap: -5 }, "", { run: () => (chance(0.4) ? (J().fin.base *= 1.02, "Springfield gives a little.") : "The governor says Chicago must fix its own mess."), req: capOK(5) })]);
SCENES.chi_privilege = () => { const p = cm((x) => x.bloc === "mach") || cm(); return S("🎩", kick("Aldermanic privilege"), `An alderman blocks affordable housing in his ward`, `${nameWithSeat(p)} is using aldermanic privilege to block a 200-unit affordable building. Federal housing officials have warned the practice violates fair housing law.`,
    [ch("Push an ordinance to end aldermanic privilege.", { body: -8, m: { housing: 2, trust: 3 }, g: { progressives: 5, mach_bosses: -10 }, who: { [p.id]: -20 } }, ""), ch("Negotiate the project down.", { who: { [p.id]: 6 } }, ""), ch("Respect the tradition.", { who: { [p.id]: 10 }, g: { mach_bosses: 4, progressives: -5 } }, "")]); };
SCENES.chi_bears = () => S("🏈", kick("Soldier Field"), "The Bears want a stadium", "The Bears want a domed lakefront stadium (or will move to Arlington Heights) and want public money for infrastructure.",
    [ch("Back the lakefront plan with public infrastructure money.", { cost: 0.004, g: { sports: 8, trades: 6, progressives: -6 } }, ""), ch("No public money.", { g: { sports: -8, progressives: 4 } }, "The Bears buy land in the suburbs."), ch("Offer the old Michael Reese site.", { cap: -3, g: { sports: 3 } }, "", { req: capOK(3) })]);
SCENES.chi_ctu = () => S("🍎", kick("Chicago Public Schools"), "The Teachers Union wants a loan", "CPS is out of money. The CTU wants the board to borrow $300 million for the contract and pension payments. The schools CEO refuses and the union wants him fired.",
    [ch("Side with the CTU.", { g: { teachers: 10, business: -6 }, m: { schools: 1 } }, "", { run: () => { J().fin.debt += J().fin.base * 0.05; return "Borrowed money, for now."; } }), ch("Back fiscal discipline.", { g: { teachers: -12, business: 5 } }, ""), ch("Ask the state for more school money.", { cap: -4 }, "", { req: capOK(4) })]);

// New Orleans
SCENES.nola_pumps = () => S("🌧️", kick("Sewerage & Water Board"), "The pumps fail", "Two turbines at the power plant fail during a summer storm. Mid-City floods knee-deep and the boil-water notice comes the next day.",
    [ch("Emergency repairs and a new power plant.", { cost: 0.006, m: { environment: 4, services: 3 } }, ""), ch("Fire the SWBNO director.", { press: 2 }, ""), ch("Ask the state for an emergency fund.", { cap: -3, gov: 2 }, "", { run: () => (G.gov.rel > 0 ? (spendOneTime(-J().fin.base * 0.004), "The state helps, with a state-appointed board member.") : "The legislature wants control of the board."), req: capOK(3) })]);
SCENES.nola_statepolice = () => S("🚓", kick("Baton Rouge"), "State Police in the French Quarter", "The governor has stationed a permanent State Police unit in the French Quarter and says he'll expand it unless NOPD cleans up.",
    [ch("Embrace the partnership.", { m: { safety: 3 }, gov: 8, g: { tourism: 6, progressives: -5 } }, ""), ch("Demand it answer to NOPD.", { gov: -6 }, ""), ch("Push your own Quarter plan.", { cost: 0.001, m: { safety: 2 } }, "")]);
SCENES.nola_mardigras = () => S("🎭", kick("Carnival"), "Security for Mardi Gras", "After the Bourbon Street attack, federal officials want concrete barriers, drones and a huge security perimeter. Krewes and residents fear Carnival will feel like an airport.",
    [ch("Full security.", { cost: 0.002, m: { safety: 3 }, g: { tourism: 2 } }, ""), ch("Targeted security.", { cost: 0.001, m: { safety: 1 } }, "", { run: () => (chance(0.1) ? (shock("safety", -6), "An incident on the parade route.") : "Carnival goes off smoothly.") })]);

// Honolulu
SCENES.hnl_redhill = () => S("⛽", kick("Red Hill"), "The Navy's fuel tanks", "The Navy is closing the Red Hill tanks, but families sickened by the leak want cleanup, compensation and a say over the aquifer.",
    [ch("Demand the Navy fund a full cleanup.", { g: { native: 6, environment: 6, military: -6 }, pres: -3 }, ""), ch("Work quietly with the Navy.", { g: { military: 4, native: -4 } }, "")]);
SCENES.hnl_rail = () => S("🚆", kick("Skyline"), "Finish the rail line?", "The last segment to Ala Moana costs billions more. Without it, the line ends short of the city's biggest destinations.",
    [ch("Build to Ala Moana.", { cost: 0.006, m: { transit: 5 }, g: { unions: 4, developers: 4 } }, ""), ch("Stop at Civic Center.", { m: { transit: 2 } }, ""), ch("Ask Washington for more money.", { cap: -4 }, "", { run: () => (sameParty(G.pres) ? (shock("transit", 3), "The FTA adds money.") : "The administration says no."), req: capOK(4) })]);
SCENES.hnl_tsunami = () => SCENES.hz_tsunami();

// Minneapolis
SCENES.mpls_police = () => S("👮", kick("Minneapolis"), "The police consent decree", "The state court-supervised settlement requires new use-of-force rules and training; officers keep leaving and the federal decree may be dropped.",
    [ch("Comply fully and fund recruitment.", { cost: 0.003, m: { trust: 4, safety: 2 }, g: { progressives: 4, police: 2 } }, ""), ch("Slow-walk the reforms.", { m: { trust: -4 }, g: { police: 4, progressives: -6 } }, "")]);
SCENES.mpls_target = () => S("🎯", kick("Nicollet Mall"), "Target moves staff out of downtown", "Target tells 3,000 headquarters workers to work from the suburbs, citing safety. Other employers may follow.",
    [ch("Visible police and cleanup downtown.", { dept: { police: 0.02 }, g: { corporate_hq: 6, progressives: -4 } }, ""), ch("Offer tax breaks to stay.", { cost: 0.002, g: { corporate_hq: 4 } }, ""), ch("Let them go.", { m: { economy: -2 } }, "")]);
SCENES.mpls_ice = () => S("🚓", kick("Cedar-Riverside"), "ICE targets the Somali community", "Federal agents are making arrests around Cedar-Riverside; families are hiding.",
    [ch("Stand with the community.", { g: { east_african: 8, progressives: 4 }, pres: -8 }, ""), ch("Stay quiet.", { g: { east_african: -6 } }, "")]);

// Buffalo
SCENES.buf_blizzard = () => S("❄️", kick("Buffalo"), "A blizzard bears down", "Forecasters warn of a Christmas-week blizzard like 2022's, which killed 47 people. You must decide when to impose a driving ban.",
    [ch("Impose a driving ban early and open warming centers.", { cost: 0.001, a: 2, g: { business: -2 } }, "", { run: () => "Lives are saved; businesses lose a holiday week." }), ch("Wait to see how bad it gets.", {}, "", { run: () => (chance(0.5) ? (shock("services", -6), G.approval -= 4, "People die in stranded cars.") : "It isn't as bad as forecast.") })]);
SCENES.buf_albany = () => S("🏛️", kick("Albany"), "Albany shortchanges Buffalo", "The state budget gives New York City billions for migrants and the MTA, and Buffalo's aid stays flat.",
    [ch("Make noise with upstate legislators.", { cap: -3, gov: -3 }, "", { run: () => (chance(0.5) ? (J().fin.base *= 1.01, "You win a little more aid.") : "Nothing."), req: capOK(3) }), ch("Ask quietly for a waterfront grant.", { gov: 3 }, "", { run: () => (chance(0.5) ? "The governor announces a grant at Canalside." : "") })]);
SCENES.buf_kensington = () => S("🛣️", kick("The East Side"), "Cap the Kensington Expressway?", "The state wants to cover part of the highway that split the East Side; residents want it filled in entirely and are suing.",
    [ch("Back the state's tunnel plan.", { gov: 6, g: { faith: -3 } }, ""), ch("Side with residents: fill it in.", { g: { faith: 6 }, gov: -6 }, "")]);

// New York City
SCENES.nyc_rentboard = () => S("🏢", kick("The Rent Guidelines Board"), "Freeze the rent?", "Your appointees on the Rent Guidelines Board decide this year's increase for a million stabilized apartments. Tenants want a freeze; landlords say buildings are going bankrupt.",
    [ch("A rent freeze.", { m: { housing: 3 }, g: { tenants: 10, developers: -10, progressives: 6 } }, ""), ch("A modest increase.", { g: { tenants: -3, developers: 2 } }, ""), ch("A large increase.", { m: { housing: -2 }, g: { tenants: -10, developers: 8 } }, "")]);
SCENES.nyc_albany = () => S("🏛️", kick("Albany"), "Ask Albany to raise taxes on the rich", "You need the state's permission to raise the city income tax on millionaires. The governor is running for reelection and hates tax increases.",
    [ch("Push publicly.", { cap: -5, gov: -6, g: { progressives: 8, business: -8 } }, "", { run: () => (chance(0.35) ? (J().fin.base *= 1.03, "Albany approves a surcharge.") : "The governor says no."), req: capOK(5) }), ch("Trade: support her budget for more school aid.", { gov: 8 }, "", { run: () => { J().fin.base *= 1.01; return "A deal."; } })]);
SCENES.nyc_subway = () => S("🚇", kick("The subway"), "An attack on the subway", "A woman is pushed onto the tracks at a Midtown station. The tabloids blame mentally ill homeless people; advocates warn against a crackdown.",
    [ch("Involuntary removal of the seriously ill.", { m: { safety: 2, trust: -2 }, g: { progressives: -6, business: 4 } }, ""), ch("More outreach teams and psychiatric beds.", { cost: 0.0008, m: { homeless: 2 } }, ""), ch("Cops on every train.", { cost: 0.001, m: { safety: 2 }, g: { police: 4 } }, "")]);
SCENES.nyc_migrants = () => S("🧳", kick("The shelters"), "Buses of asylum seekers", "Another governor is busing thousands of asylum seekers to Port Authority. The right-to-shelter law requires you to house them.",
    [ch("Open emergency shelters and demand federal money.", { cost: 0.004, m: { homeless: -2 }, g: { immigrants: 6 }, pres: -3 }, ""), ch("Limit shelter stays to 30 days.", { g: { immigrants: -6, homeowners: 3 } }, ""), ch("Ask courts to suspend right to shelter.", { g: { progressives: -8 } }, "")]);

// Providence
SCENES.pvd_pilot = () => S("🎓", kick("College Hill"), "Negotiate the PILOT", "Brown, RISD and the hospitals pay about $14 million a year in voluntary PILOTs. Brown's deal is up. Councilors want triple; the university says it already gives enough.",
    [ch("Play hardball: threaten a state law taxing their land.", { cap: -5, g: { eds_meds: -10, progressives: 5 } }, "", { run: () => (chance(0.5) ? (J().fin.base *= 1.02, "Brown doubles its payment.") : "Brown walks away and lobbies the State House."), req: capOK(5) }), ch("A modest increase plus campus housing commitments.", { g: { eds_meds: 2 } }, "", { run: () => { J().fin.base *= 1.008; shock("housing", 1); return "A deal."; } }), ch("Renew as is.", { g: { eds_meds: 4, progressives: -4 } }, "")]);
SCENES.pvd_barrier = () => S("🌊", kick("Fox Point"), "The hurricane barrier needs work", "The Army Corps says the 1966 barrier needs $100 million in repairs to protect downtown from a major storm.",
    [ch("Fund it.", { cost: 0.01, m: { environment: 6 } }, ""), ch("Wait for federal money.", { cap: -2 }, "", { req: capOK(2) })]);
SCENES.pvd_wards = () => { const p = cm((x) => x.bloc === "mach") || cm(); return S("🍝", kick("Federal Hill"), "A councilor's favor", `${nameWithSeat(p)} wants the city to buy a vacant lot in his ward from a friend, well above value, for a "community garden."`,
    [ch("Do it.", { heat: 6, who: { [p.id]: 15 } }, ""), ch("Refuse.", { who: { [p.id]: -12 }, m: { trust: 1 } }, "")]); };

// Portland, Maine
SCENES.pme_wharf = () => S("🦞", kick("The working waterfront"), "Condos or lobster boats?", "A developer wants to put a hotel on a wharf where lobstermen tie up; the waterfront zone forbids it unless the council changes the rules.",
    [ch("Protect the working waterfront.", { g: { fishing: 8, developers: -6 } }, ""), ch("Allow mixed use with space for boats.", { m: { economy: 2 }, g: { developers: 4, fishing: -3 } }, "")]);
SCENES.pme_asylum = () => S("🧳", kick("Portland"), "Asylum seekers arrive", "Hundreds of families from Angola and Congo arrive in a week. The shelters are full.",
    [ch("Open the Expo center.", { cost: 0.002, g: { immigrants: 6 } }, ""), ch("Ask the state to share the load.", { cap: -2, gov: 2 }, "", { req: capOK(2) })]);

// Burlington
SCENES.btv_church = () => S("🛍️", kick("Church Street"), "Downtown merchants revolt", "Shoplifting and public drug use are driving stores off Church Street. Merchants want more police; Progressives want a drop-in center.",
    [ch("Add officers downtown.", { dept: { police: 0.03 }, g: { business: 6, progressives: -6 } }, ""), ch("Open a drop-in center.", { cost: 0.001, g: { progressives: 6, business: -3 } }, "")]);
SCENES.btv_flood = () => SCENES.hz_flood();

// Albuquerque
SCENES.abq_cars = () => S("🚗", kick("Albuquerque"), "The car theft capital", "A new report ranks Albuquerque near the top for auto theft again. Councilors want a crackdown; the state's laws make repeat offenders easy to release.",
    [ch("A regional auto-theft task force.", { cost: 0.0008, m: { safety: 3 }, g: { police: 5 } }, ""), ch("Push Santa Fe for pretrial detention reform.", { cap: -3, gov: 2 }, "", { req: capOK(3) }), ch("Steering-wheel locks and trackers for residents.", { cost: 0.0002, m: { safety: 1 } }, "")]);
SCENES.abq_gateway = () => S("🏥", kick("The International District"), "The Gateway Center", "Neighbors of the Gateway Center shelter say crime and camping have spilled onto their streets.",
    [ch("Expand Gateway with medical respite and services.", { cost: 0.002, m: { homeless: 4 }, g: { homeowners: -4 } }, ""), ch("Add security and enforce camping rules nearby.", { m: { safety: 1 }, g: { homeowners: 4, progressives: -4 } }, "")]);
SCENES.abq_film = () => S("🎬", kick("Netflix Studios"), "Netflix wants to expand", "Netflix wants to double its studio and needs the state's film incentive raised.",
    [ch("Lobby Santa Fe for a bigger film credit.", { cap: -3, m: { economy: 3 }, g: { film: 8 } }, "", { req: capOK(3) }), ch("Offer city land.", { m: { economy: 2 }, g: { film: 4 } }, "")]);

// Anchorage
SCENES.anc_cold = () => S("🥶", kick("Anchorage"), "Twenty below and no beds", "A cold snap hits and the shelters are full. People will die outside without emergency space. The Assembly and your administration fought all fall over a mass shelter.",
    [ch("Open the Sullivan Arena tonight.", { cost: 0.001, m: { homeless: 3 }, body: 4 }, ""), ch("Hotel vouchers.", { cost: 0.0015, m: { homeless: 2 } }, ""), ch("Rely on the churches.", { m: { homeless: -3 }, a: -3 }, "")]);
SCENES.anc_port = () => S("⚓", kick("The Port of Alaska"), "The port is crumbling", "Engineers say the docks could fail in a big earthquake. The rebuild costs $2 billion; the state and military use it too.",
    [ch("Push the state and the Pentagon to pay their share.", { cap: -4, gov: 2 }, "", { run: () => (chance(0.5) ? (spendOneTime(-J().fin.base * 0.02), "The state and military commit money.") : "Only promises."), req: capOK(4) }), ch("Raise port tariffs.", { cost: -0.004, g: { business: -4, port: -4 } }, "")]);
SCENES.anc_quake = () => SCENES.hz_quake();
