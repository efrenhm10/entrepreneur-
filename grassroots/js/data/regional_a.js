// State dossiers (part 1: Alabama–Iowa). Each state plays differently:
//   powers  state-specific power bases: [key, name, description, prefs]
//           prefs: lean (+ = friendlier to Republicans), taxes/reg (+ = want them low),
//           growth, crime, env (+ = care about the environment), ind (their industry),
//           cr (crises they care about), groups (interest groups whose policy views they share)
//   firms   employers and suitors: [name, sector, size S/M/L, 'hq' if headquartered here]
//   megas   real projects on the table: [type, name, cost in $ billions, years to build]
//   scenes  real issues as decisions: [title, text, [[choice, effects, result], ...]]
// Effects: app (approval), pp, chest (war chest $), money, hours, scan (scandal), integ,
// stand (party standing), resp (respect), rec, pw {power: Δloyalty}, cr {crisis: Δseverity},
// ag {agency or role: {eff, app, deg, op %, cap %}}, cost (share of the annual budget, one-time),
// gap (output gap), jobs (thousands), flag.
var GR = globalThis.GR || (globalThis.GR = {});
GR.REGION = GR.REGION || {};
GR.regionDef = (ab, o) => { GR.REGION[ab] = o; };

GR.regionDef('AL', {
  blurb: 'Auto plants and rocket engineers sit beside some of the deepest rural poverty in the country, and the state prison system is under federal lawsuit.',
  powers: [
    ['autos', 'Auto assembly plants (Mercedes, Hyundai, Honda, Toyota-Mazda)', 'Foreign automakers built a manufacturing belt on incentives. They want low taxes, trained workers and no unions.', { lean: 0.6, taxes: 1, growth: 1, ind: 'manufacturing' }],
    ['rocket', 'Huntsville aerospace & Redstone Arsenal', 'NASA Marshall, Space Command, Army missile programs and the contractors around them.', { lean: 0.4, growth: 1, ind: 'defense', cr: ['education'] }],
    ['church', 'Southern Baptist & evangelical churches', 'The pulpits still shape Alabama politics.', { lean: 0.9, groups: ['life', 'parents'] }],
  ],
  firms: [['Mercedes-Benz U.S. International', 'manufacturing', 'L'], ['Hyundai Motor Manufacturing Alabama', 'manufacturing', 'L'], ['Mazda Toyota Manufacturing', 'manufacturing', 'L'], ['Blue Origin engine plant', 'defense', 'M'], ['Regions Financial', 'finance', 'M', 'hq'], ['Austal USA shipyard', 'defense', 'M']],
  megas: [['prison', 'New 4,000-bed Elmore County prison complex', 1.1, 3], ['port', 'Port of Mobile ship channel deepening', 0.4, 4], ['research', 'Huntsville Cummings Research Park expansion', 0.6, 3], ['broadband', 'Black Belt rural broadband buildout', 0.3, 3]],
  scenes: [
    ['DOJ sues over prison conditions', 'The Justice Department says Alabama\'s men\'s prisons are among the most violent in the nation: overcrowded, understaffed, with record deaths. A federal judge wants a plan.', [['Fund hiring and new prisons', { cost: 0.006, ag: { prisons: { eff: 6, op: 6 } }, cr: { crime: -2 }, pw: { church: 2 } }, 'Guards get raises; construction begins.'], ['Sentencing and parole reform', { ag: { prisons: { op: -3 } }, cr: { crime: 1 }, pw: { police: -6 }, app: -1 }, 'Fewer inmates, angry sheriffs.'], ['Fight the lawsuit', { scan: 3, pw: { press: -5 }, cost: 0.001 }, 'Years of litigation ahead.']]],
    ['A Black Belt hospital is closing', 'Another rural hospital in the Black Belt announces it will close. The nearest ER will be an hour away.', [['Rescue fund for rural hospitals', { cost: 0.002, cr: { health: -2 }, app: 1 }, 'The doors stay open, for now.'], ['Push Medicaid expansion', { cr: { health: -4 }, pw: { party: -8, church: -2 }, app: 2 }, 'Your caucus is furious; hospitals cheer.'], ['Let the market sort it out', { cr: { health: 2 }, app: -2 }, 'The hospital closes in March.']]],
    ['Space Command headquarters', 'The Pentagon is reviewing where U.S. Space Command will live. Huntsville wants it locked in.', [['Lobby hard: incentive package and a delegation trip', { cost: 0.001, pw: { rocket: 8 }, jobs: 1.5, pp: -10 }, 'Huntsville keeps its prize.'], ['Let the congressional delegation handle it', { pw: { rocket: -3 } }, 'You stay out of it.']]],
  ],
});

GR.regionDef('AK', {
  blurb: 'Oil money pays everyone a dividend, but production is falling, the budget is always short, and villages are falling into the sea.',
  powers: [
    ['oilgas', 'North Slope oil producers', 'ConocoPhillips and the North Slope fields fund the state. They want lower taxes and new drilling.', { lean: 0.8, taxes: 1, reg: 1, ind: 'energy', groups: ['energy'] }],
    ['natives', 'Alaska Native corporations & tribes', 'Regional corporations are some of the biggest players in the economy, and rural villages need services.', { lean: -0.1, cr: ['infra', 'poverty', 'disaster'] }],
    ['pfd', 'Permanent Fund Dividend voters', 'Every Alaskan gets a yearly check. Touch it at your peril.', { lean: 0.2, taxes: 1 }],
  ],
  firms: [['ConocoPhillips Willow project', 'energy', 'L'], ['Santos Pikka field', 'energy', 'M'], ['Alaska Air Group', 'logistics', 'M'], ['Arctic Slope Regional Corp.', 'construction', 'M', 'hq'], ['GCI', 'tech', 'S', 'hq']],
  megas: [['pipeline', 'Alaska LNG pipeline (North Slope to Nikiski)', 44, 8], ['port', 'Port of Alaska (Anchorage) modernization', 2.0, 6], ['highway', 'Ambler Road to the mining district', 0.5, 4], ['flood', 'Relocation of Newtok and Shishmaref villages', 0.4, 4]],
  scenes: [
    ['The dividend fight', 'The budget is short again. Legislators want to cut this year\'s Permanent Fund Dividend to pay for schools.', [['Full statutory dividend', { app: 3, pw: { pfd: 10 }, cost: 0.03, cr: { education: 2 } }, 'Every Alaskan gets a fat check.'], ['Split the difference', { pw: { pfd: -3 }, cr: { education: -1 } }, 'Nobody is happy, which may mean it was fair.'], ['Small dividend, more for schools', { app: -3, pw: { pfd: -12, teachers: 8 }, cr: { education: -3 } }, 'Talk radio is apoplectic.']]],
    ['A village is washing away', 'Erosion has put homes in an Inupiat village within feet of the sea. Federal relocation money is slow.', [['State relocation funding', { cost: 0.004, pw: { natives: 8 }, cr: { disaster: -2 } }, 'Surveyors arrive for the new townsite.'], ['Lobby Congress for help', { pp: -6, pw: { natives: 3 } }, 'The delegation promises to try.']]],
  ],
});

GR.regionDef('AZ', {
  blurb: 'Chip fabs and data centers are booming in the desert just as the Colorado River runs short. Phoenix is the hottest big city in America.',
  powers: [
    ['chips', 'Semiconductor makers (TSMC, Intel)', 'The biggest foreign investment in state history. They need water, power and engineers.', { lean: 0.1, growth: 1, ind: 'tech', cr: ['water', 'education'] }],
    ['farms', 'Central Arizona farmers & irrigation districts', 'Pinal County alfalfa and cotton growers losing their Colorado River water.', { lean: 0.6, ind: 'ag', cr: ['water'] }],
    ['builders', 'Homebuilders & developers', 'Growth is the business model. Groundwater rules decide where they can build.', { lean: 0.5, reg: 1, growth: 1, ind: 'construction' }],
  ],
  firms: [['TSMC Arizona (Phoenix fabs)', 'tech', 'L'], ['Intel Ocotillo campus', 'tech', 'L'], ['Lucid Motors Casa Grande', 'manufacturing', 'M'], ['Banner Health', 'healthcare', 'L', 'hq'], ['Freeport-McMoRan copper', 'energy', 'M', 'hq'], ['Amkor packaging plant', 'tech', 'M']],
  megas: [['water', 'Sea of Cortez desalination & pipeline (WIFA)', 5.5, 7], ['water', 'Colorado River shortage recharge & conservation program', 1.0, 3], ['hsr', 'Phoenix–Tucson passenger rail', 7, 7], ['fab', 'Phoenix semiconductor workforce & supplier park', 1.2, 4]],
  scenes: [
    ['The river is running dry', 'Federal negotiators want Arizona to absorb deeper Colorado River cuts. Pinal County farms are already fallowing fields.', [['Pay farmers to fallow and buy water rights', { cost: 0.005, cr: { water: -4 }, pw: { farms: 4 } }, 'Expensive, but the cities keep their water.'], ['Fight the cuts in court', { pp: -8, pw: { farms: 6 }, cr: { water: 1 } }, 'California and Nevada dig in too.'], ['Impose groundwater limits on new subdivisions', { cr: { water: -5 }, pw: { builders: -12 }, gap: -0.1 }, 'Developers call it a building moratorium.']]],
    ['Heat deaths hit a record', 'Maricopa County recorded another record year of heat deaths, mostly among people living outside.', [['Cooling centers and a heat officer', { cost: 0.001, cr: { homeless: -2, health: -1 }, app: 1 }, 'Centers open from May to October.'], ['Tree canopy and cool pavement program', { cost: 0.002, cr: { disaster: -1 }, pw: { builders: -1 } }, 'A long-term fix.']]],
  ],
});

GR.regionDef('AR', {
  blurb: 'Walmart, Tyson and J.B. Hunt made Northwest Arkansas boom while the Delta empties out. Arkansas leads the nation in some of its worst health numbers.',
  powers: [
    ['walmart', 'Walmart & the Walton family', 'The world\'s largest retailer and its philanthropy shape Bentonville and the state.', { lean: 0.4, taxes: 1, growth: 1, ind: 'retail' }],
    ['poultry', 'Poultry & rice growers (Tyson)', 'Chicken houses and Delta rice fields.', { lean: 0.7, reg: 1, ind: 'ag', groups: ['farm'] }],
  ],
  firms: [['Walmart', 'retail', 'L', 'hq'], ['Tyson Foods', 'ag', 'L', 'hq'], ['J.B. Hunt', 'logistics', 'L', 'hq'], ['U.S. Steel Big River Steel', 'manufacturing', 'L'], ['Dillard\'s', 'retail', 'M', 'hq']],
  megas: [['highway', 'Interstate 49 completion to Texarkana', 1.2, 5], ['prison', 'New 3,000-bed state prison', 0.8, 3], ['research', 'University of Arkansas institute for integrative research', 0.4, 3]],
  scenes: [
    ['Delta towns are emptying', 'The Arkansas Delta has lost a fifth of its people since 2000. Mayors ask for a lifeline.', [['Delta jobs and broadband package', { cost: 0.003, cr: { poverty: -2, migration: -2 } }, 'Grants flow to Helena and Lake Village.'], ['Opportunity zone tax breaks', { pw: { business: 4 }, cr: { poverty: -1 } }, 'Investors circle cautiously.']]],
    ['Chicken plant pollution', 'Poultry runoff is fouling the Illinois River, and Oklahoma is suing again.', [['Tighter litter rules', { cr: { water: -3 }, pw: { poultry: -10, environment: 5 } }, 'Growers grumble.'], ['Voluntary best practices', { pw: { poultry: 3 }, cr: { water: 1 } }, 'Oklahoma\'s attorney general is not impressed.']]],
  ],
});

GR.regionDef('CA', {
  blurb: 'The world\'s fifth-largest economy, with the nation\'s worst housing shortage, the largest homeless population, a high-speed train still under construction and fire seasons that never end.',
  powers: [
    ['tech', 'Silicon Valley & Big Tech', 'Apple, Google, Nvidia, Meta and a thousand startups. They fund campaigns and fight regulation of AI and gig work.', { lean: -0.2, reg: 1, growth: 1, ind: 'tech' }],
    ['hollywood', 'Hollywood & the entertainment unions', 'Studios and the guilds want the film tax credit and their jobs back from Georgia and London.', { lean: -0.7, ind: 'tourism' }],
    ['ag', 'Central Valley agriculture', 'The country\'s fruit and nut basket, fighting for every acre-foot of water.', { lean: 0.5, ind: 'ag', cr: ['water'], groups: ['farm'] }],
    ['yimby', 'Housing advocates (YIMBYs)', 'A new movement demanding the state override local zoning and build.', { lean: -0.3, cr: ['housing', 'homeless'] }],
  ],
  firms: [['Apple', 'tech', 'L', 'hq'], ['Nvidia', 'tech', 'L', 'hq'], ['Alphabet (Google)', 'tech', 'L', 'hq'], ['Tesla Fremont factory', 'manufacturing', 'L'], ['Chevron (moved HQ to Texas)', 'energy', 'L'], ['Kaiser Permanente', 'healthcare', 'L', 'hq'], ['Disney', 'tourism', 'L', 'hq'], ['Anthropic', 'tech', 'M', 'hq']],
  megas: [['hsr', 'California High-Speed Rail: Merced–Bakersfield segment', 35, 9], ['water', 'Delta Conveyance tunnel', 20, 12], ['water', 'Sites Reservoir', 4.5, 7], ['housing', 'State housing bond: 100,000 affordable homes', 10, 6], ['grid', 'Offshore wind transmission at Humboldt Bay', 3.5, 6]],
  scenes: [
    ['Cities refusing to build', 'Dozens of cities are blocking new apartments, defying their state housing targets. Your housing department wants to sue them.', [['Sue the cities and strip their zoning control', { cr: { housing: -4 }, pw: { yimby: 10, local: -10 }, app: -1 }, 'The builder\'s remedy kicks in. Suburbs revolt.'], ['Offer infrastructure money to cities that comply', { cost: 0.002, cr: { housing: -2 }, pw: { yimby: 4 } }, 'Some cities take the deal.'], ['Respect local control', { pw: { yimby: -10, local: 6 }, cr: { housing: 2 } }, 'Rents keep climbing.']]],
    ['Wildfire insurance collapse', 'State Farm and Allstate stopped writing new home policies. Homeowners are being dumped onto the bare-bones FAIR Plan.', [['Let insurers price in wildfire risk', { cr: { housing: 1, disaster: -1 }, pw: { business: 5 }, app: -2 }, 'Premiums jump, but insurers come back.'], ['Fund home hardening and fuel breaks', { cost: 0.002, cr: { disaster: -3 } }, 'Crews clear brush across the foothills.'], ['Order insurers to keep writing policies', { pw: { business: -10 }, app: 2 }, 'Two more insurers announce they will leave.']]],
    ['The high-speed rail bill comes due', 'The rail authority needs billions more to finish the Central Valley line, and federal money was pulled.', [['Commit cap-and-trade money for 20 years', { cost: 0.004, pw: { labor: 6, press: -2 } }, 'Track-laying continues.'], ['Pause and re-scope the project', { pw: { labor: -8 }, app: 1 }, 'Critics call it a train to nowhere.']]],
    ['A tent city on the freeway', 'A camp of hundreds has grown under an overpass. Video of a fire there went viral.', [['Clear it and offer shelter beds', { cost: 0.0005, cr: { homeless: -1 }, pw: { police: 4, press: -3 } }, 'Most people move a few blocks away.'], ['Buy motels for permanent supportive housing', { cost: 0.002, cr: { homeless: -3 } }, 'Homekey adds 600 units.']]],
  ],
});

GR.regionDef('CO', {
  blurb: 'A purple-turned-blue state with Rocky Mountain resorts, a booming Front Range, oil fields up north and a Taxpayer Bill of Rights that caps what the state can spend.',
  powers: [
    ['oilgas', 'Weld County oil & gas', 'Fracking in the Denver Basin and its air-quality fights.', { lean: 0.7, reg: 1, ind: 'energy', groups: ['energy'] }],
    ['tabor', 'TABOR defenders', 'Voters must approve every tax increase, and surplus revenue goes back as refunds.', { lean: 0.6, taxes: 1, groups: ['taxpayers'] }],
    ['ski', 'Ski resorts & mountain towns', 'Vail and Aspen worry about climate, I-70 traffic and housing for their workers.', { lean: -0.4, ind: 'tourism', env: 1, cr: ['housing'] }],
  ],
  firms: [['Lockheed Martin Space', 'defense', 'L'], ['Vestas blade factories', 'manufacturing', 'M'], ['Palantir', 'tech', 'M', 'hq'], ['Molson Coors', 'manufacturing', 'M'], ['Ball Corporation', 'manufacturing', 'M', 'hq'], ['Vail Resorts', 'tourism', 'M', 'hq']],
  megas: [['hsr', 'Front Range passenger rail (Fort Collins–Pueblo)', 5, 8], ['highway', 'I-70 mountain corridor improvements', 2, 6], ['water', 'Colorado River shortage conservation program', 0.5, 3]],
  scenes: [
    ['TABOR refunds or roads?', 'The state collected more than TABOR allows. The surplus must be refunded unless voters let you keep it.', [['Ask voters to keep it for schools and roads', { pp: -10, pw: { tabor: -8, teachers: 6 }, cost: -0.01 }, 'The measure narrowly passes.'], ['Send the refund checks', { app: 2, pw: { tabor: 6 }, cr: { infra: 1 } }, 'Everyone gets a few hundred dollars.']]],
    ['Ozone over the Front Range', 'The EPA downgraded Denver to "severe" ozone nonattainment. Drilling permits in Weld County are blamed.', [['Pause summer drilling permits', { cr: { disaster: -1 }, pw: { oilgas: -12, environment: 8 }, gap: -0.05 }, 'Operators threaten to leave.'], ['Electrify the oil fields with incentives', { cost: 0.001, pw: { oilgas: 2 } }, 'A slower, friendlier fix.']]],
  ],
});

GR.regionDef('CT', {
  blurb: 'One of the richest states, with insurance giants in Hartford, hedge funds in Greenwich, submarine yards in Groton, and tens of billions in unfunded pensions.',
  powers: [
    ['insurance', 'Hartford insurers & Greenwich finance', 'Aetna, Travelers, The Hartford and the hedge funds of Fairfield County.', { lean: 0.2, taxes: 1, ind: 'finance' }],
    ['subs', 'Electric Boat & Pratt & Whitney', 'Submarines and jet engines: thousands of union defense jobs.', { lean: 0, ind: 'defense' }],
    ['stateunions', 'State employee unions (SEBAC)', 'A powerful coalition that negotiates pensions and benefits.', { lean: -0.8, cr: ['pension'], groups: ['labor'] }],
  ],
  firms: [['General Dynamics Electric Boat', 'defense', 'L'], ['Pratt & Whitney (RTX)', 'defense', 'L'], ['Travelers', 'finance', 'L', 'hq'], ['Sikorsky', 'defense', 'M'], ['Cigna', 'healthcare', 'L', 'hq']],
  megas: [['transit', 'Hartford Line & New Haven Line speed upgrades', 1.5, 5], ['highway', 'I-84 Hartford viaduct replacement', 4, 9], ['housing', 'Transit-oriented housing fund', 0.4, 4]],
  scenes: [
    ['The fiscal guardrails', 'Strict spending caps let Connecticut pay down pensions, but advocates say they starve schools and housing.', [['Keep the guardrails', { cr: { pension: -3 }, pw: { stateunions: -4, insurance: 6 } }, 'Rating agencies upgrade the state.'], ['Loosen them for housing and child care', { cr: { housing: -2, pension: 2 }, pw: { stateunions: 6, insurance: -6 } }, 'Moody\'s issues a warning.']]],
    ['Electric Boat needs workers', 'The Navy wants submarines faster, and Electric Boat needs 5,000 more welders and pipefitters.', [['Fund a manufacturing pipeline at community colleges', { cost: 0.0015, pw: { subs: 8, labor: 4 }, jobs: 3 }, 'New training centers open in Groton.'], ['Leave it to the company', { pw: { subs: -4 } }, 'Delays mount.']]],
  ],
});

GR.regionDef('DE', {
  blurb: 'Tiny, rich in corporate charters, and anxious that Elon Musk and others are reincorporating in Texas and Nevada.',
  powers: [
    ['bar', 'Corporate bar & the Court of Chancery', 'Two-thirds of the Fortune 500 are incorporated here, and franchise fees fund a fifth of the budget.', { lean: 0, ind: 'finance' }],
    ['chickens', 'Delmarva poultry', 'Sussex County chicken farms and processors.', { lean: 0.7, ind: 'ag' }],
  ],
  firms: [['DuPont', 'manufacturing', 'M', 'hq'], ['Bank of America card operations', 'finance', 'M'], ['ChristianaCare', 'healthcare', 'M', 'hq'], ['Incyte', 'healthcare', 'M', 'hq']],
  megas: [['flood', 'Delaware Bay coastal resilience', 0.6, 5], ['bridge', 'Indian River Inlet & Route 1 upgrades', 0.4, 4]],
  scenes: [
    ['DExit', 'High-profile companies are moving their charters to Texas and Nevada after rulings against executives in the Court of Chancery.', [['Amend the corporate law to favor boards', { pw: { bar: 8, press: -4 }, scan: 1 }, 'Defectors pause; shareholder advocates cry foul.'], ['Defend the court\'s independence', { pw: { bar: -6, press: 4 } }, 'Franchise revenue starts to wobble.']]],
  ],
});

GR.regionDef('DC', {
  blurb: 'A city-state without a vote in Congress, whose budget Congress can overrule. Downtown offices are empty after remote work.',
  powers: [
    ['feds', 'Federal workforce & contractors', 'Agencies and the Beltway contracting economy.', { lean: -0.6, ind: 'defense' }],
    ['statehood', 'Statehood movement', '700,000 residents and no senators.', { lean: -0.9 }],
  ],
  firms: [['Amazon HQ2 (Arlington)', 'tech', 'L'], ['Booz Allen Hamilton', 'defense', 'M'], ['Danaher', 'healthcare', 'M', 'hq']],
  megas: [['stadium', 'RFK campus stadium for the Commanders', 3.7, 5], ['transit', 'Union Station expansion', 8.8, 10]],
  scenes: [
    ['Congress overrules the council', 'House Republicans moved to block a D.C. criminal code rewrite.', [['Fight it publicly', { pw: { statehood: 8 }, app: 1 }, 'Statehood advocates rally.'], ['Withdraw the bill', { pw: { statehood: -10, police: 4 } }, 'Activists feel betrayed.']]],
  ],
});

GR.regionDef('FL', {
  blurb: 'America\'s fastest-growing big state, with no income tax, the most retirees, a property-insurance market in collapse and hurricanes every fall.',
  powers: [
    ['retirees', 'Retirees & The Villages', 'They vote in huge numbers and care about Social Security, Medicare and property taxes.', { lean: 0.5, taxes: 1, groups: ['seniors'] }],
    ['tourism', 'Disney & tourism', 'Theme parks, cruise lines and beach towns: the state\'s biggest industry.', { lean: 0.1, ind: 'tourism', cr: ['disaster'] }],
    ['sugar', 'Big Sugar & citrus growers', 'U.S. Sugar and the Fanjuls are among the biggest political donors in Tallahassee.', { lean: 0.6, ind: 'ag', groups: ['farm'] }],
    ['developers', 'Developers & homebuilders', 'Growth is Florida\'s business model.', { lean: 0.7, reg: 1, growth: 1, ind: 'construction' }],
  ],
  firms: [['NextEra Energy', 'energy', 'L', 'hq'], ['Publix', 'retail', 'L', 'hq'], ['Lockheed Martin Orlando', 'defense', 'M'], ['Citadel (moved HQ to Miami)', 'finance', 'M'], ['SpaceX Cape Canaveral', 'defense', 'L'], ['Royal Caribbean', 'tourism', 'L', 'hq']],
  megas: [['water', 'Everglades Agricultural Area Reservoir', 4, 7], ['hsr', 'Brightline Orlando–Tampa extension', 6, 6], ['flood', 'Miami-Dade Back Bay storm surge barriers', 6, 10], ['port', 'Port Everglades & PortMiami expansion', 1.5, 5]],
  scenes: [
    ['The insurance market is collapsing', 'Insurers are leaving Florida and premiums average triple the national rate. Citizens Property Insurance has over a million policies.', [['Tort reform and a reinsurance fund', { cost: 0.004, pw: { business: 8 }, cr: { housing: -2 } }, 'Two new insurers enter the market.'], ['Shift policies out of Citizens', { app: -3, cr: { housing: 1 }, pw: { retirees: -6 } }, 'Homeowners get takeout letters.'], ['Cap premium increases', { pw: { business: -10, retirees: 8 }, app: 3 }, 'Another carrier goes insolvent.']]],
    ['A Category 4 is in the Gulf', 'The cone points at the Gulf Coast. Evacuation orders must go out in hours.', [['Early mandatory evacuations', { cost: 0.0005, app: 1, pw: { tourism: -3 } }, 'Traffic is a nightmare, but no one dies on the barrier islands.'], ['Wait for a better forecast', { app: -1 }, 'A gamble.']]],
    ['Condo collapse fears', 'Since Surfside, aging condo towers face expensive mandatory repairs. Retirees can\'t pay the special assessments.', [['Low-interest repair loans', { cost: 0.002, pw: { retirees: 8 } }, 'Thousands of owners keep their homes.'], ['Hold the line on safety rules', { pw: { retirees: -6 }, cr: { housing: 1 } }, 'Prices of older condos crash.']]],
  ],
});

GR.regionDef('GA', {
  blurb: 'Atlanta\'s boom made Georgia a swing state. Hyundai, Rivian and Qcells are building a clean-energy manufacturing belt across the rural south.',
  powers: [
    ['evbelt', 'EV & battery manufacturers', 'The Hyundai Metaplant, SK Battery, Qcells solar and Rivian.', { lean: 0, growth: 1, ind: 'manufacturing' }],
    ['atlanta', 'Atlanta business establishment', 'Coca-Cola, Delta, Home Depot and the Chamber.', { lean: 0, growth: 1, ind: 'logistics' }],
    ['farmers', 'Peanut, poultry & cotton farmers', 'South Georgia\'s farm economy.', { lean: 0.8, ind: 'ag', groups: ['farm'] }],
  ],
  firms: [['Hyundai Motor Group Metaplant', 'manufacturing', 'L'], ['Qcells solar factory (Dalton & Cartersville)', 'manufacturing', 'M'], ['Rivian (Stanton Springs)', 'manufacturing', 'L'], ['Delta Air Lines', 'logistics', 'L', 'hq'], ['Coca-Cola', 'manufacturing', 'L', 'hq'], ['Home Depot', 'retail', 'L', 'hq']],
  megas: [['port', 'Port of Savannah Garden City expansion', 2, 5], ['highway', 'Georgia 400 express lanes', 4.6, 6], ['transit', 'Atlanta BeltLine rail', 2.5, 7], ['nuclear', 'Plant Vogtle-style new nuclear reactors', 15, 9]],
  scenes: [
    ['Rivian wants its incentives back on track', 'Rivian paused its Georgia plant. Local residents fought the site from the start.', [['Renegotiate and add a training center', { cost: 0.0015, pw: { evbelt: 6 }, jobs: 4 }, 'Groundbreaking is rescheduled.'], ['Claw back the incentives', { pw: { evbelt: -6, farmers: 4 } }, 'The site sits empty.']]],
    ['Hospital deserts in rural Georgia', 'Several rural hospitals are near closure. Georgia never fully expanded Medicaid.', [['Expand Pathways with fewer work rules', { cr: { health: -3 }, pw: { party: -5 } }, 'Enrollment doubles.'], ['Rural hospital tax credit', { cost: 0.001, cr: { health: -1 }, pw: { business: 3 } }, 'Donors get tax credits; hospitals get a little help.']]],
  ],
});

GR.regionDef('HI', {
  blurb: 'Paradise with the highest cost of living in America. Lahaina is still rebuilding after the 2023 fire, and Native Hawaiians are being priced off the islands.',
  powers: [
    ['visitors', 'Visitor industry & resorts', 'Tourism is a quarter of the economy.', { lean: -0.2, ind: 'tourism' }],
    ['military', 'Military commands (INDOPACOM)', 'Pearl Harbor and the Red Hill fuel leak.', { lean: 0.2, ind: 'defense' }],
    ['kanaka', 'Native Hawaiian community', 'Land, water and housing for Kānaka Maoli.', { lean: -0.6, cr: ['housing', 'migration'], env: 1 }],
  ],
  firms: [['Hawaiian Electric', 'energy', 'M', 'hq'], ['Alaska-Hawaiian Airlines', 'logistics', 'M'], ['Queen\'s Health System', 'healthcare', 'M', 'hq']],
  megas: [['transit', 'Honolulu rail (Skyline) to Ala Moana', 10, 6], ['housing', 'Lahaina rebuild & workforce housing', 3, 6], ['grid', 'Oahu grid battery & solar build-out', 1.2, 4]],
  scenes: [
    ['Short-term rentals', 'Maui wants to phase out thousands of vacation rentals to house Lahaina survivors and locals.', [['Back the phase-out', { cr: { housing: -4, migration: -2 }, pw: { visitors: -10, kanaka: 10 } }, 'Rental owners sue.'], ['Tax them heavily instead', { cr: { housing: -1 }, pw: { visitors: -3 }, cost: -0.002 }, 'Revenue rises; housing barely moves.']]],
    ['Red Hill fuel cleanup', 'The Navy is draining Red Hill, but families still distrust the water.', [['Demand an independent monitoring board', { pp: -5, pw: { military: -4, kanaka: 6 }, cr: { water: -2 } }, 'The Navy agrees under pressure.'], ['Trust the Navy\'s plan', { pw: { military: 4, kanaka: -6 } }, 'Activists protest at the Capitol.']]],
  ],
});

GR.regionDef('ID', {
  blurb: 'One of the fastest-growing states, as Californians pour into Boise. Micron is building a giant fab, and ranchers watch home prices soar.',
  powers: [
    ['micron', 'Micron Technology', 'The memory-chip giant is building America\'s largest fab in Boise.', { lean: 0.2, ind: 'tech', growth: 1 }],
    ['ranchers', 'Ranchers & potato growers', 'Water and federal land.', { lean: 0.9, ind: 'ag', cr: ['water'], groups: ['farm'] }],
    ['freedom', 'Idaho Freedom Foundation', 'A hard-right faction pushing the GOP caucus.', { lean: 1, taxes: 1, groups: ['taxpayers', 'parents'] }],
  ],
  firms: [['Micron Technology', 'tech', 'L', 'hq'], ['Albertsons', 'retail', 'L', 'hq'], ['Simplot', 'ag', 'M', 'hq'], ['Idaho National Laboratory', 'energy', 'M']],
  megas: [['fab', 'Micron Boise fab support infrastructure', 1, 4], ['nuclear', 'INL small modular reactor demonstration', 4, 7], ['water', 'Treasure Valley water supply plan', 0.6, 5]],
  scenes: [
    ['OB-GYNs are leaving', 'Under the abortion ban, a quarter of Idaho\'s obstetricians have left, and rural maternity wards are closing.', [['Add clear medical exceptions', { cr: { health: -2 }, pw: { freedom: -10, church: -4 }, app: 2 }, 'Doctors cautiously welcome it.'], ['Recruitment bonuses only', { cost: 0.001, cr: { health: -1 } }, 'Few takers.']]],
  ],
});

GR.regionDef('IL', {
  blurb: 'Chicago\'s global economy carries a state with the worst-funded pensions in America, falling population downstate, and a boom in quantum computing.',
  powers: [
    ['chicagoboss', 'Chicago machine & aldermen', 'The Cook County Democratic organization still delivers votes.', { lean: -0.8 }],
    ['downstate', 'Downstate farmers & towns', 'Corn, soybeans and resentment of Chicago.', { lean: 0.8, ind: 'ag', groups: ['farm'] }],
    ['traders', 'LaSalle Street traders (CME, Citadel)', 'Finance threatens to leave over taxes and crime.', { lean: 0.2, taxes: 1, ind: 'finance' }],
    ['publicunions', 'Teachers & public unions', 'Chicago Teachers Union and AFSCME.', { lean: -0.9, cr: ['pension'], groups: ['labor', 'teachers'] }],
  ],
  firms: [['Boeing (moved HQ to Arlington)', 'defense', 'L'], ['Caterpillar (moved HQ to Texas)', 'manufacturing', 'L'], ['Abbott Laboratories', 'healthcare', 'L', 'hq'], ['PsiQuantum (Illinois Quantum Park)', 'tech', 'M'], ['CME Group', 'finance', 'M', 'hq'], ['Rivian Normal plant', 'manufacturing', 'L'], ['Deere & Co.', 'manufacturing', 'L', 'hq']],
  megas: [['research', 'Illinois Quantum & Microelectronics Park', 1, 5], ['transit', 'CTA Red Line Extension', 5.7, 7], ['airport', 'O\'Hare 21 terminal rebuild', 8.5, 8], ['stadium', 'Chicago Bears lakefront/Arlington Heights stadium', 5, 5]],
  scenes: [
    ['The pension ramp', 'Illinois pensions are less than half funded. The statutory ramp eats a quarter of the budget.', [['Pension bonds to smooth payments', { cr: { pension: -2 }, scan: 0, pw: { traders: -3 }, cost: -0.01 }, 'Wall Street calls it kicking the can.'], ['Constitutional amendment to trim benefits', { cr: { pension: -6 }, pw: { publicunions: -15 }, app: -2 }, 'The unions mobilize.'], ['Raise revenue with a progressive income tax', { cr: { pension: -4 }, pw: { traders: -10, publicunions: 6 } }, 'Voters rejected this once before.']]],
    ['Transit fiscal cliff', 'Chicago-area transit faces a $770 million hole when federal pandemic money runs out.', [['Regional sales tax increase', { cost: -0.002, cr: { infra: -2 }, pw: { business: -4 } }, 'Trains keep running.'], ['Merge CTA, Metra and Pace', { pp: -8, cr: { infra: -1 } }, 'A fight over governance.'], ['Let service be cut', { cr: { infra: 3 }, app: -3 }, 'Ridership collapses.']]],
  ],
});

GR.regionDef('IN', {
  blurb: 'The most manufacturing-heavy state in America, now building battery plants and data centers, with low taxes and a Republican supermajority.',
  powers: [
    ['steelauto', 'Steel mills & auto plants', 'Northwest Indiana steel and plants from Toyota to Stellantis.', { lean: 0.3, ind: 'manufacturing' }],
    ['pharma', 'Eli Lilly', 'The Indianapolis drug giant is booming on weight-loss drugs.', { lean: 0.1, ind: 'healthcare', growth: 1 }],
  ],
  firms: [['Eli Lilly', 'healthcare', 'L', 'hq'], ['Stellantis-Samsung StarPlus battery plant', 'manufacturing', 'L'], ['Cummins', 'manufacturing', 'L', 'hq'], ['Toyota Princeton plant', 'manufacturing', 'L'], ['Amazon Web Services New Carlisle data centers', 'tech', 'L']],
  megas: [['research', 'LEAP Lebanon innovation district', 2, 5], ['water', 'Wabash River aquifer pipeline to LEAP', 1.5, 5], ['highway', 'I-69 Finish Line', 1.5, 5]],
  scenes: [
    ['Piping water to a megasite', 'The state plans to pipe millions of gallons a day from Tippecanoe County to the LEAP district for Lilly and chip plants. Farmers are alarmed.', [['Build the pipeline', { cost: 0.002, pw: { pharma: 6, farm: -8 }, jobs: 4 }, 'Lilly breaks ground on a new plant.'], ['Study the aquifer first', { pw: { pharma: -4 } }, 'Two years of hydrology.']]],
  ],
});

GR.regionDef('IA', {
  blurb: 'Corn, hogs, ethanol and wind turbines. Iowa\'s water carries some of the highest nitrate levels in the nation, and small towns are shrinking.',
  powers: [
    ['corn', 'Corn growers & ethanol plants', 'Renewable fuel standards keep rural Iowa afloat.', { lean: 0.6, ind: 'ag', groups: ['farm'] }],
    ['hogs', 'Hog confinement operations', 'Iowa raises a third of America\'s pigs.', { lean: 0.8, reg: 1, ind: 'ag' }],
    ['wind', 'Wind energy developers', 'Over 60% of Iowa\'s power comes from wind.', { lean: 0.1, ind: 'energy' }],
  ],
  firms: [['John Deere Waterloo works', 'manufacturing', 'L'], ['Principal Financial', 'finance', 'L', 'hq'], ['Casey\'s', 'retail', 'M', 'hq'], ['Microsoft West Des Moines data centers', 'tech', 'L'], ['Summit Carbon pipeline', 'energy', 'M']],
  megas: [['pipeline', 'Summit Carbon CO2 pipeline', 5.5, 4], ['water', 'Des Moines nitrate removal & watershed program', 0.4, 4], ['broadband', 'Rural broadband Empower program', 0.4, 3]],
  scenes: [
    ['Nitrates in the water', 'Des Moines Water Works ran its nitrate-removal plant around the clock and asked residents to stop watering lawns.', [['Mandatory farm runoff limits', { cr: { water: -4 }, pw: { corn: -8, hogs: -10, environment: 8 } }, 'Farm groups call it an attack on agriculture.'], ['Fund voluntary conservation', { cost: 0.001, cr: { water: -1 }, pw: { corn: 3 } }, 'Cover crops spread slowly.']]],
    ['Eminent domain for the CO2 pipeline', 'Landowners are fighting Summit Carbon\'s use of eminent domain for its pipeline.', [['Ban eminent domain for CO2 pipelines', { pw: { corn: -4, landowners: 0 }, app: 2 }, 'The project stalls.'], ['Let it proceed', { pw: { corn: 6 }, app: -2 }, 'Ethanol plants cheer; farmers are furious.']]],
  ],
});
