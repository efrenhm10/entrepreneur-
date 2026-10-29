// State dossiers (part 2: Kansas–New York). See regional_a.js for the format.
var GR = globalThis.GR || (globalThis.GR = {});

GR.regionDef('KS', {
  blurb: 'Wheat, beef and aircraft. Wichita builds planes, western Kansas is draining the Ogallala Aquifer, and Panasonic just opened a giant battery plant.',
  powers: [
    ['wheat', 'Wheat & cattle producers', 'Western Kansas feedlots and wheat farms, running out of groundwater.', { lean: 0.8, ind: 'ag', cr: ['water'], groups: ['farm'] }],
    ['aviation', 'Wichita aviation (Spirit, Textron)', 'The Air Capital of the World.', { lean: 0.4, ind: 'defense' }],
  ],
  firms: [['Panasonic Energy De Soto battery plant', 'manufacturing', 'L'], ['Spirit AeroSystems (Boeing)', 'defense', 'L'], ['Textron Aviation', 'defense', 'M'], ['Koch Industries', 'energy', 'L', 'hq'], ['Garmin', 'tech', 'M', 'hq']],
  megas: [['water', 'Ogallala Aquifer conservation districts', 0.3, 4], ['stadium', 'STAR bonds stadium to lure the Chiefs and Royals', 3.5, 5], ['highway', 'I-70 & US-69 expansion', 0.8, 4]],
  scenes: [
    ['Steal the Chiefs?', 'Kansas can offer STAR bonds covering 70% of new stadiums if the Chiefs and Royals cross the state line from Missouri.', [['Make the offer', { cost: 0.003, pw: { business: 6, press: -2 }, app: 2 }, 'Missouri scrambles to counter.'], ['Stay out of the bidding war', { pw: { taxpayers: 4 } }, 'Fiscal hawks applaud.']]],
    ['The aquifer is running dry', 'Wells in southwest Kansas are going dry. At current pumping, parts of the Ogallala have decades left.', [['Mandatory pumping cuts', { cr: { water: -4 }, pw: { wheat: -10 } }, 'Irrigators protest in Garden City.'], ['Pay farmers to retire water rights', { cost: 0.002, cr: { water: -2 }, pw: { wheat: 3 } }, 'Expensive but popular.']]],
  ],
});

GR.regionDef('KY', {
  blurb: 'Bourbon, horses and Ford\'s battery plants. Eastern Kentucky\'s coal jobs are gone and the floods of 2022 still haunt it.',
  powers: [
    ['bourbon', 'Bourbon distillers', 'A booming industry fighting a barrel tax and tariffs.', { lean: 0.3, ind: 'manufacturing', taxes: 1 }],
    ['coal', 'Coal counties', 'Eastern Kentucky, its jobs nearly gone.', { lean: 0.8, ind: 'energy', cr: ['poverty', 'opioid'] }],
    ['horses', 'Thoroughbred industry', 'Churchill Downs and the Bluegrass horse farms.', { lean: 0.4, ind: 'tourism' }],
  ],
  firms: [['Ford BlueOval SK battery park', 'manufacturing', 'L'], ['Toyota Georgetown', 'manufacturing', 'L'], ['Humana', 'healthcare', 'L', 'hq'], ['Brown-Forman', 'manufacturing', 'M', 'hq'], ['GE Appliances', 'manufacturing', 'M', 'hq']],
  megas: [['bridge', 'Brent Spence Bridge companion span (Cincinnati–Covington)', 3.6, 7], ['housing', 'Eastern Kentucky flood-safe housing on high ground', 0.4, 3], ['highway', 'Mountain Parkway widening', 0.8, 5]],
  scenes: [
    ['Flood survivors still in campers', 'Two years after the floods, families in Breathitt and Perry counties still live in trailers.', [['Build new communities on higher ground', { cost: 0.002, cr: { disaster: -2, poverty: -1 }, pw: { coal: 6 } }, 'The first homes go up near Hazard.'], ['Direct cash grants', { cost: 0.001, pw: { coal: 3 } }, 'Many rebuild in the same flood plain.']]],
    ['The opioid settlement money', 'Kentucky will receive $800 million from opioid settlements over 18 years.', [['Treatment and recovery centers', { cost: -0.0005, cr: { opioid: -4 } }, 'Clinics open across Appalachia.'], ['Ibogaine research', { cr: { opioid: -1 }, pw: { press: 3 }, scan: 0 }, 'National attention; skeptics abound.'], ['Plug budget holes', { cr: { opioid: 1 }, pw: { press: -5 }, scan: 3 }, 'Families of victims are outraged.']]],
  ],
});

GR.regionDef('LA', {
  blurb: 'Petrochemical plants line the river, the coast is vanishing at a football field every 100 minutes, and insurance and population loss are the crises of the day.',
  powers: [
    ['petro', 'Petrochemical & LNG industry', 'Cancer Alley plants and the Gulf Coast LNG export boom.', { lean: 0.7, reg: 1, ind: 'energy', groups: ['energy'] }],
    ['coast', 'Coastal parishes & fishermen', 'Shrimpers and towns on the vanishing coast.', { lean: 0.6, cr: ['disaster'] }],
    ['nola', 'New Orleans & the tourism economy', 'Music, food and conventions.', { lean: -0.6, ind: 'tourism' }],
  ],
  firms: [['Venture Global LNG (Plaquemines)', 'energy', 'L'], ['Cheniere Sabine Pass', 'energy', 'L'], ['Meta Richland Parish data center', 'tech', 'L'], ['Ochsner Health', 'healthcare', 'M', 'hq'], ['Lamar Advertising', 'tech', 'S', 'hq']],
  megas: [['flood', 'Mid-Barataria Sediment Diversion', 3, 6], ['flood', 'Coastal Master Plan levees & marsh creation', 5, 8], ['bridge', 'New Calcasieu River (I-10) Bridge', 2.1, 6], ['airport', 'Louis Armstrong airport expansion', 0.5, 3]],
  scenes: [
    ['The sediment diversion', 'The $3 billion diversion would rebuild marsh but flood oyster beds with fresh water. Plaquemines fishermen are furious.', [['Go forward', { cr: { disaster: -3 }, pw: { coast: -8, environment: 8 } }, 'The river starts building land.'], ['Cancel it', { cr: { disaster: 2 }, pw: { coast: 8, environment: -10 } }, 'Federal settlement money goes unused.']]],
    ['Cancer Alley permit', 'A new plastics plant wants to locate in St. James Parish, where residents already breathe some of the most toxic air in America.', [['Approve it', { jobs: 1.5, pw: { petro: 8, environment: -8, press: -3 } }, 'Construction jobs arrive; lawsuits follow.'], ['Deny the air permit', { pw: { petro: -12, environment: 6 }, gap: -0.05 }, 'The company picks Texas.']]],
  ],
});

GR.regionDef('ME', {
  blurb: 'The oldest state in America, with lobstermen fighting offshore wind, a housing crunch in Portland and a paper industry that has mostly closed.',
  powers: [
    ['lobster', 'Lobstermen', 'Right-whale rules and offshore wind threaten the iconic fishery.', { lean: 0.4, ind: 'ag', env: 0 }],
    ['mills', 'Mill towns & paper workers', 'Most mills closed; the towns did not.', { lean: 0.5, ind: 'manufacturing', cr: ['poverty', 'opioid'] }],
  ],
  firms: [['Bath Iron Works', 'defense', 'L'], ['IDEXX Laboratories', 'healthcare', 'M', 'hq'], ['L.L.Bean', 'retail', 'M', 'hq'], ['WEX', 'finance', 'S', 'hq']],
  megas: [['port', 'Searsport offshore wind port', 0.5, 4], ['grid', 'New England Clean Energy Connect line', 1.5, 3], ['housing', 'Portland-area workforce housing', 0.2, 3]],
  scenes: [
    ['Offshore wind port at Sears Island', 'The state wants to build a floating offshore wind port. Lobstermen fear losing grounds.', [['Build it with a fishermen\'s fund', { cost: 0.002, pw: { lobster: -3, environment: 6 }, jobs: 0.8 }, 'A compromise.'], ['Pause offshore wind', { pw: { lobster: 8, environment: -8 } }, 'The industry moves to Massachusetts.']]],
  ],
});

GR.regionDef('MD', {
  blurb: 'The richest state by median income, dependent on federal jobs. The Key Bridge collapsed in 2024, and the budget faces a structural deficit.',
  powers: [
    ['feds', 'Federal workforce & contractors', 'NIH, NSA, Fort Meade and the contractors.', { lean: -0.6, ind: 'defense' }],
    ['port', 'Port of Baltimore', 'Car imports and longshoremen.', { lean: -0.3, ind: 'logistics' }],
  ],
  firms: [['Lockheed Martin', 'defense', 'L', 'hq'], ['Marriott International', 'tourism', 'L', 'hq'], ['Northrop Grumman Linthicum', 'defense', 'L'], ['AstraZeneca Gaithersburg', 'healthcare', 'M'], ['T. Rowe Price', 'finance', 'M', 'hq']],
  megas: [['bridge', 'Francis Scott Key Bridge rebuild', 4.3, 4], ['transit', 'Purple Line light rail', 9.5, 3], ['transit', 'Baltimore Red Line', 6, 8], ['tunnel', 'Frederick Douglass Tunnel (Amtrak)', 6, 8]],
  scenes: [
    ['Federal layoffs hit Maryland', 'Federal agency cuts are hitting Montgomery and Prince George\'s counties.', [['Hire laid-off federal workers into state jobs', { cost: 0.001, pw: { feds: 8 }, app: 1 }, 'A fast-track hiring portal opens.'], ['Hold the line on the budget', { pw: { feds: -6 }, cr: { poverty: 1 } }, 'Unemployment rises in the suburbs.']]],
    ['Blueprint for Maryland\'s Future costs', 'The landmark school reform law costs billions more each year.', [['Fully fund it with new taxes', { cost: -0.003, pw: { teachers: 8, business: -6 }, cr: { education: -2 } }, 'Teachers rejoice.'], ['Slow the phase-in', { pw: { teachers: -10 }, cr: { education: 1 } }, 'The union rallies in Annapolis.']]],
  ],
});

GR.regionDef('MA', {
  blurb: 'Hospitals, universities and biotech make Massachusetts the richest state per capita, and also one of the most expensive. Migrant shelters are overflowing.',
  powers: [
    ['eds', 'Universities & hospitals (eds and meds)', 'Harvard, MIT, Mass General Brigham: the state\'s largest employers.', { lean: -0.6, ind: 'healthcare' }],
    ['biotech', 'Kendall Square biotech', 'The world\'s densest life-science cluster.', { lean: -0.3, ind: 'healthcare', growth: 1 }],
  ],
  firms: [['Moderna', 'healthcare', 'M', 'hq'], ['Vertex Pharmaceuticals', 'healthcare', 'M', 'hq'], ['Raytheon (RTX)', 'defense', 'L'], ['Fidelity Investments', 'finance', 'L', 'hq'], ['General Electric Aerospace', 'manufacturing', 'L', 'hq']],
  megas: [['transit', 'MBTA safety & slow-zone overhaul', 4, 5], ['bridge', 'Cape Cod Bourne & Sagamore bridges replacement', 4.5, 8], ['hsr', 'West–East rail (Boston–Springfield)', 3, 7]],
  scenes: [
    ['Emergency shelters are full', 'Massachusetts\' right-to-shelter law means the state must house families. Thousands of migrant families arrived.', [['Cap shelter stays and add space', { cost: 0.002, pw: { press: -2 }, cr: { homeless: -1 } }, 'Families must leave after 9 months.'], ['Keep the guarantee open-ended', { cost: 0.004, cr: { homeless: -2 }, app: -2 }, 'Costs top $1 billion.']]],
    ['The T is falling apart', 'A third of subway track has speed restrictions. A rider died after being dragged by a train.', [['Massive safety investment', { cost: 0.003, cr: { infra: -3 }, app: 1 }, 'Weekend shutdowns for repairs.'], ['Federal oversight team', { pp: -5, cr: { infra: -1 } }, 'The FTA takes a hard look.']]],
  ],
});

GR.regionDef('MI', {
  blurb: 'Detroit is reinventing itself around EVs while the UAW flexes its muscle. Michigan is a perennial swing state with the Great Lakes at its heart.',
  powers: [
    ['uaw', 'United Auto Workers', 'The union that won historic contracts in the 2023 strike.', { lean: -0.6, ind: 'manufacturing', groups: ['labor'] }],
    ['bigthree', 'Detroit automakers', 'Ford, GM and Stellantis betting their future on EVs.', { lean: 0.1, ind: 'manufacturing', growth: 1 }],
  ],
  firms: [['General Motors', 'manufacturing', 'L', 'hq'], ['Ford Motor Company', 'manufacturing', 'L', 'hq'], ['Stellantis North America', 'manufacturing', 'L'], ['Gotion battery plant (Big Rapids)', 'manufacturing', 'M'], ['Stryker', 'healthcare', 'L', 'hq'], ['Dow', 'manufacturing', 'L', 'hq']],
  megas: [['bridge', 'Gordie Howe International Bridge', 5.7, 2], ['tunnel', 'Line 5 pipeline tunnel under the Straits of Mackinac', 1.5, 6], ['fab', 'Michigan battery manufacturing corridor', 1, 4]],
  scenes: [
    ['Line 5 under the Straits', 'Enbridge\'s 70-year-old pipeline runs along the bottom of the Straits of Mackinac. Tribes and environmentalists want it shut.', [['Sue to shut it down', { pw: { environment: 10, business: -6 }, cr: { energy: 2 } }, 'Propane prices in the Upper Peninsula spike.'], ['Approve the tunnel', { pw: { environment: -8, business: 6, labor: 4 } }, 'Construction unions applaud.']]],
    ['A Chinese-owned battery plant', 'Gotion wants subsidies for a plant near Big Rapids. Locals fear Chinese influence.', [['Approve the subsidy', { cost: 0.0008, jobs: 2.3, pw: { press: -4 } }, 'The recall campaign against township officials begins.'], ['Cancel the deal', { pw: { bigthree: -2 }, app: 1 }, 'The jobs go elsewhere.']]],
  ],
});

GR.regionDef('MN', {
  blurb: 'Health care giants, Fortune 500 headquarters and the Mayo Clinic. A big state surplus vanished, and Minneapolis is still rebuilding trust after 2020.',
  powers: [
    ['mayo', 'Mayo Clinic & UnitedHealth', 'Health care is Minnesota\'s biggest industry.', { lean: -0.1, ind: 'healthcare' }],
    ['ironrange', 'Iron Range miners', 'Taconite mines and the copper-nickel fight.', { lean: 0.5, ind: 'energy' }],
  ],
  firms: [['UnitedHealth Group', 'healthcare', 'L', 'hq'], ['Target', 'retail', 'L', 'hq'], ['3M', 'manufacturing', 'L', 'hq'], ['Medtronic operations', 'healthcare', 'L'], ['Cargill', 'ag', 'L', 'hq']],
  megas: [['transit', 'Blue Line light rail extension', 3.2, 6], ['research', 'Destination Medical Center (Rochester)', 1, 5], ['energy', 'Twin Metals copper-nickel mine', 1.7, 5]],
  scenes: [
    ['Copper-nickel mining near the Boundary Waters', 'Twin Metals wants to mine near the wilderness canoe area.', [['Support the mine', { jobs: 0.8, pw: { ironrange: 10, environment: -12 } }, 'The Range cheers.'], ['Protect the Boundary Waters', { pw: { ironrange: -10, environment: 10 } }, 'Outfitters breathe easy.']]],
    ['Child-care fraud scandal', 'Prosecutors say tens of millions in child-nutrition money were stolen through fake meal sites.', [['Independent inspector general', { cost: 0.0003, scan: -2, ag: { admin: { eff: 5 } } }, 'The press praises the move.'], ['Defend the agency', { scan: 4, pw: { press: -6 } }, 'The story keeps growing.']]],
  ],
});

GR.regionDef('MS', {
  blurb: 'The poorest state, with the highest rates of uninsured poverty and maternal death, Jackson\'s broken water system, and a surprising education turnaround.',
  powers: [
    ['delta', 'Delta planters & catfish farmers', 'Cotton, rice, soybeans and catfish ponds.', { lean: 0.7, ind: 'ag', groups: ['farm'] }],
    ['casinos', 'Gulf Coast casinos & shipbuilding', 'Biloxi casinos and Ingalls shipyard.', { lean: 0.3, ind: 'tourism' }],
    ['church', 'Black churches & civil rights leaders', 'The backbone of the state\'s Black political organization.', { lean: -0.8, cr: ['health', 'poverty'] }],
  ],
  firms: [['Ingalls Shipbuilding (HII)', 'defense', 'L'], ['Nissan Canton plant', 'manufacturing', 'L'], ['Amazon Web Services Madison County data centers', 'tech', 'L'], ['Sanderson Farms', 'ag', 'M', 'hq']],
  megas: [['water', 'Jackson water system rebuild', 1.5, 6], ['broadband', 'Delta broadband initiative', 0.3, 3], ['port', 'Port of Gulfport restoration', 0.6, 4]],
  scenes: [
    ['Jackson has no water again', 'The O.B. Curtis plant failed after a freeze. 150,000 people are on bottled water.', [['State takeover and rebuild fund', { cost: 0.004, cr: { water: -5, infra: -2 }, pw: { church: 6 } }, 'Engineers begin replacing pipes.'], ['Leave it to the federal manager', { cr: { water: -1 }, pw: { church: -6 } }, 'Boil notices continue.']]],
    ['Medicaid expansion vote', 'Mississippi is one of ten states that never expanded Medicaid. Rural hospitals are closing.', [['Pass expansion with a work requirement', { cr: { health: -6, poverty: -2 }, pw: { party: -8, church: 8 } }, 'Hospitals get a lifeline.'], ['Hospital tax increase only', { cr: { health: -2 }, pw: { business: -2 } }, 'A stopgap.'], ['Oppose expansion', { cr: { health: 2 }, pw: { party: 6, church: -8 } }, 'Two more hospitals close.']]],
  ],
});

GR.regionDef('MO', {
  blurb: 'Two big cities fighting crime, a rural majority and a cross-state bidding war over the Chiefs and Royals.',
  powers: [
    ['kcsl', 'Kansas City & St. Louis civic leaders', 'Sports teams, hospitals and downtown revival.', { lean: -0.4, cr: ['crime'] }],
    ['farm', 'Missouri Farm Bureau', 'Rural Missouri\'s strongest lobby.', { lean: 0.8, ind: 'ag', groups: ['farm'] }],
  ],
  firms: [['Centene', 'healthcare', 'L', 'hq'], ['Emerson Electric', 'manufacturing', 'L', 'hq'], ['Boeing St. Louis (fighter jets)', 'defense', 'L'], ['Ford Kansas City Assembly', 'manufacturing', 'L'], ['Bayer Crop Science', 'ag', 'M']],
  megas: [['stadium', 'Keep the Chiefs and Royals in Missouri: stadium package', 3, 5], ['highway', 'Rebuild & widen I-70', 2.8, 6], ['airport', 'Kansas City airport (opened 2023) expansion', 0.4, 3]],
  scenes: [
    ['Kansas is poaching the Chiefs', 'Kansas offered to pay for most of a new stadium. Jackson County voters rejected a sales tax.', [['Counteroffer with state bonds', { cost: 0.003, pw: { kcsl: 8 }, app: 2 }, 'The Chiefs stay at Arrowhead.'], ['Let them go', { pw: { kcsl: -12, taxpayers: 4 }, app: -3 }, 'Fans are heartbroken.']]],
  ],
});

GR.regionDef('MT', {
  blurb: 'Big Sky country, discovered by remote workers. Home prices in Bozeman doubled and locals are priced out.',
  powers: [
    ['ranch', 'Ranchers & outfitters', 'Cattle, hunting and public lands.', { lean: 0.8, ind: 'ag' }],
    ['coal', 'Colstrip coal plant & mines', 'Eastern Montana energy jobs.', { lean: 0.7, ind: 'energy' }],
  ],
  firms: [['Montana Renewables (Great Falls)', 'energy', 'M'], ['Glacier Bancorp', 'finance', 'S', 'hq'], ['Sibanye-Stillwater platinum mine', 'energy', 'M']],
  megas: [['transit', 'North Coast Hiawatha passenger rail revival', 1.5, 6], ['housing', 'Gallatin Valley workforce housing', 0.2, 3]],
  scenes: [
    ['Locals priced out of Bozeman', 'Teachers and nurses can no longer afford to live in Gallatin County.', [['Statewide zoning reform', { cr: { housing: -3 }, pw: { ranch: -3 } }, 'Duplexes become legal in every city.'], ['Property tax relief for residents', { cost: 0.002, app: 2 }, 'Popular, but home prices keep rising.']]],
  ],
});

GR.regionDef('NE', {
  blurb: 'Beef, corn and Warren Buffett. Nebraska splits its electoral votes and runs the only one-house, officially nonpartisan legislature.',
  powers: [
    ['beef', 'Cattle feeders & meatpackers', 'Tyson, JBS and the feedlots.', { lean: 0.8, ind: 'ag', groups: ['farm'] }],
    ['omaha', 'Omaha business (Berkshire, Union Pacific)', 'Insurance, rail and finance.', { lean: 0.3, ind: 'finance' }],
  ],
  firms: [['Berkshire Hathaway', 'finance', 'L', 'hq'], ['Union Pacific', 'logistics', 'L', 'hq'], ['Mutual of Omaha', 'finance', 'M', 'hq'], ['Meta Sarpy County data center', 'tech', 'L']],
  megas: [['water', 'Perkins County Canal from the South Platte', 0.6, 6], ['highway', 'Expressway system completion', 0.6, 5]],
  scenes: [
    ['The Perkins County Canal', 'Nebraska wants to build a canal to claim South Platte water under a 1923 compact with Colorado.', [['Build it', { cost: 0.006, cr: { water: -3 }, pw: { beef: 6 } }, 'Colorado objects.'], ['Negotiate with Colorado instead', { pw: { beef: -3 } }, 'Talks drag on.']]],
  ],
});

GR.regionDef('NV', {
  blurb: 'Casinos, lithium and the driest big metro in America. Las Vegas keeps adding stadiums while workers can\'t afford rent.',
  powers: [
    ['casinos', 'Casino resorts (MGM, Caesars, Wynn)', 'The Strip runs the state\'s economy.', { lean: 0, ind: 'tourism' }],
    ['culinary', 'Culinary Union Local 226', 'Sixty thousand casino workers, the state\'s most powerful union.', { lean: -0.6, groups: ['labor'], cr: ['housing'] }],
    ['lithium', 'Lithium miners & battery makers', 'Thacker Pass and Tesla\'s Gigafactory near Reno.', { lean: 0.3, ind: 'manufacturing' }],
  ],
  firms: [['Tesla Gigafactory Nevada', 'manufacturing', 'L'], ['Redwood Materials', 'manufacturing', 'M', 'hq'], ['Lithium Americas Thacker Pass', 'energy', 'M'], ['MGM Resorts', 'tourism', 'L', 'hq'], ['Switch data centers', 'tech', 'M', 'hq']],
  megas: [['stadium', 'Athletics ballpark on the Strip', 1.75, 4], ['hsr', 'Brightline West (Las Vegas–Southern California)', 12, 6], ['water', 'Lake Mead low-lake pumping & reuse', 0.8, 4]],
  scenes: [
    ['Public money for the A\'s ballpark', 'The Oakland Athletics want $380 million in public financing for a Strip stadium.', [['Approve it', { cost: 0.002, pw: { casinos: 6, culinary: -3, teachers: -6 }, app: -1 }, 'Groundbreaking on the Tropicana site.'], ['Refuse', { pw: { casinos: -6, teachers: 4 } }, 'The team looks at other cities.']]],
  ],
});

GR.regionDef('NH', {
  blurb: 'Live Free or Die: no income or sales tax, a 400-member House, and the most expensive housing crunch in New England after Massachusetts.',
  powers: [
    ['libertarians', 'Free State libertarians', 'Activists who moved here to shrink government.', { lean: 0.9, taxes: 1, reg: 1, groups: ['taxpayers'] }],
    ['ski', 'Tourism & ski areas', 'Lakes Region and the White Mountains.', { lean: 0.2, ind: 'tourism' }],
  ],
  firms: [['BAE Systems Nashua', 'defense', 'L'], ['Fidelity Merrimack campus', 'finance', 'M'], ['Dartmouth Health', 'healthcare', 'M', 'hq']],
  megas: [['transit', 'Capitol Corridor commuter rail to Boston', 0.8, 5], ['housing', 'InvestNH housing fund', 0.2, 3]],
  scenes: [
    ['School funding lawsuit', 'Courts ruled the state underfunds schools, leaving towns to rely on property taxes.', [['Raise state aid with a statewide property tax', { pw: { libertarians: -12, teachers: 8 }, cr: { education: -3 } }, 'Rich towns revolt.'], ['Expand education freedom accounts', { pw: { libertarians: 6, teachers: -8 } }, 'Public school advocates sue again.']]],
  ],
});

GR.regionDef('NJ', {
  blurb: 'The most densely populated state, with the highest property taxes, the worst commutes into Manhattan and a fight over New York\'s congestion pricing.',
  powers: [
    ['pharma', 'Pharmaceutical industry', 'Johnson & Johnson, Merck and the Medicine Chest of the World.', { lean: 0, ind: 'healthcare' }],
    ['bosses', 'County party bosses', 'The county line system that let bosses pick candidates until a court struck it down.', { lean: -0.4 }],
  ],
  firms: [['Johnson & Johnson', 'healthcare', 'L', 'hq'], ['Merck', 'healthcare', 'L', 'hq'], ['Prudential Financial', 'finance', 'L', 'hq'], ['Amazon fulfillment network', 'logistics', 'L'], ['Bristol Myers Squibb', 'healthcare', 'L', 'hq']],
  megas: [['tunnel', 'Gateway Hudson River tunnel', 16, 10], ['transit', 'Portal North Bridge & NJ Transit fleet', 2.3, 4], ['port', 'Port Newark expansion', 1, 5]],
  scenes: [
    ['NJ Transit is broke', 'NJ Transit faces a billion-dollar gap. Trains break down weekly on the Northeast Corridor.', [['Corporate transit fee', { cost: -0.003, cr: { infra: -2 }, pw: { pharma: -6, business: -6 } }, 'A dedicated revenue stream at last.'], ['Fare hike', { cr: { infra: -1 }, app: -3 }, 'Commuters fume.']]],
    ['Congestion pricing in Manhattan', 'New Jersey commuters now pay $9 to enter Manhattan, and none of the money comes to NJ Transit.', [['Sue New York', { pp: -4, app: 2 }, 'A political win, a legal long shot.'], ['Negotiate a revenue share', { pp: -8, cr: { infra: -1 } }, 'Albany offers crumbs.']]],
  ],
});

GR.regionDef('NM', {
  blurb: 'An oil boom in the Permian Basin pays for free college and pre-K, while New Mexico still ranks last in child well-being.',
  powers: [
    ['permian', 'Permian Basin oil producers', 'The source of a historic budget surplus.', { lean: 0.6, ind: 'energy', groups: ['energy'] }],
    ['pueblos', 'Pueblos, tribes & Hispano communities', 'Water rights, land grants and sovereignty.', { lean: -0.5, cr: ['water', 'poverty'] }],
    ['labs', 'Los Alamos & Sandia national labs', 'Nuclear weapons research and Intel\'s Rio Rancho fab.', { lean: -0.2, ind: 'defense' }],
  ],
  firms: [['Los Alamos National Laboratory', 'defense', 'L'], ['Sandia National Laboratories', 'defense', 'L'], ['Intel Rio Rancho', 'tech', 'L'], ['Maxeon solar factory', 'manufacturing', 'M']],
  megas: [['research', 'Quantum & national lab tech park', 0.4, 4], ['water', 'Strategic water supply (brackish desalination)', 0.5, 5], ['grid', 'SunZia wind transmission line', 11, 3]],
  scenes: [
    ['Spend the oil windfall', 'New Mexico has a multi-billion-dollar surplus from oil royalties.', [['Endow early childhood education', { cost: 0.01, cr: { education: -3, poverty: -2 } }, 'Universal pre-K and child care.'], ['Save it in a trust fund', { app: -1, pw: { permian: 3 } }, 'Prudent and unpopular.'], ['Rebate checks', { app: 3, cost: 0.01 }, 'Every New Mexican gets $500.']]],
  ],
});

GR.regionDef('NY', {
  blurb: 'Wall Street and upstate fabs, the highest taxes and the most debt per person, a migrant crisis in the city and congestion pricing at last.',
  powers: [
    ['wallst', 'Wall Street', 'Finance pays a fifth of state income taxes.', { lean: 0.1, taxes: 1, ind: 'finance' }],
    ['upstate', 'Upstate towns & farms', 'Dairy farms and Rust Belt cities from Buffalo to Syracuse.', { lean: 0.5, ind: 'ag' }],
    ['unions', 'Building trades & public unions', '1199SEIU, the teachers and the trades.', { lean: -0.6, groups: ['labor', 'teachers'] }],
  ],
  firms: [['Micron (Clay megafab)', 'tech', 'L'], ['JPMorgan Chase', 'finance', 'L', 'hq'], ['IBM', 'tech', 'L', 'hq'], ['Regeneron', 'healthcare', 'L', 'hq'], ['GlobalFoundries Malta fab', 'tech', 'L'], ['PepsiCo', 'manufacturing', 'L', 'hq']],
  megas: [['transit', 'Second Avenue Subway Phase 2', 7.7, 8], ['tunnel', 'Gateway Hudson River tunnel', 16, 10], ['transit', 'Penn Station reconstruction', 7, 8], ['fab', 'Micron Clay fab infrastructure', 0.5, 4], ['highway', 'I-81 Syracuse viaduct removal', 2.2, 6]],
  scenes: [
    ['Migrants in the shelters', 'Over 200,000 migrants arrived in New York City. The state pays for part of the bill.', [['Fund city shelters and work permits push', { cost: 0.003, cr: { homeless: -2 }, app: -2 }, 'The city gets $2.4 billion.'], ['Limit the right to shelter', { pw: { unions: -3, press: -4 }, app: 1 }, 'Advocates sue.']]],
    ['Bail reform again', 'After a high-profile crime, the tabloids demand you roll back bail reform.', [['Give judges more discretion', { cr: { crime: -1 }, pw: { police: 6, unions: -2 } }, 'Progressives are furious.'], ['Defend the law', { pw: { police: -6 }, app: -2 }, 'The Post runs a front-page attack.']]],
  ],
});
