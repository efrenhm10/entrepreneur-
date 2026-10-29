// State dossiers (part 3: North Carolina–Wyoming). See regional_a.js for the format.
var GR = globalThis.GR || (globalThis.GR = {});

GR.regionDef('NC', {
  blurb: 'Research Triangle tech and banking in Charlotte, still rebuilding the western mountains after Hurricane Helene in 2024.',
  powers: [
    ['banks', 'Charlotte banks (Bank of America, Truist)', 'The second-largest banking center in the country.', { lean: 0.2, ind: 'finance' }],
    ['triangle', 'Research Triangle universities & biotech', 'Duke, UNC, NC State and the pharma cluster.', { lean: -0.4, ind: 'healthcare' }],
    ['hogsfarms', 'Hog & tobacco farmers', 'Eastern North Carolina\'s hog industry and tobacco legacy.', { lean: 0.7, ind: 'ag', groups: ['farm'] }],
  ],
  firms: [['Bank of America', 'finance', 'L', 'hq'], ['Toyota battery plant (Liberty)', 'manufacturing', 'L'], ['Wolfspeed silicon carbide fab', 'tech', 'M'], ['VinFast (Chatham County)', 'manufacturing', 'M'], ['Apple Research Triangle campus', 'tech', 'L'], ['Lowe\'s', 'retail', 'L', 'hq']],
  megas: [['highway', 'Helene recovery: I-40 rebuild in the Pigeon River Gorge', 1.5, 4], ['hsr', 'S-Line Raleigh–Richmond passenger rail', 1.1, 6], ['housing', 'Western NC disaster housing', 0.8, 4], ['port', 'Port of Wilmington harbor deepening', 0.8, 5]],
  scenes: [
    ['Helene recovery', 'Western North Carolina lost roads, homes and whole towns. FEMA help is slow.', [['State-funded rebuild program', { cost: 0.006, cr: { disaster: -3, infra: -2 }, app: 3 }, 'Bulldozers clear the gorge.'], ['Wait on federal dollars', { app: -3, cr: { disaster: 1 } }, 'Mountain counties feel forgotten.']]],
    ['Charlotte gets a new pro team?', 'MLS and NBA groups are pitching new stadium districts.', [['State bonds for a stadium district', { cost: 0.0015, pw: { banks: 4, taxpayers: -4 } }, 'Uptown celebrates.'], ['No public money', { pw: { taxpayers: 4 } }, 'The owners look elsewhere.']]],
  ],
});

GR.regionDef('ND', {
  blurb: 'The Bakken oil boom made North Dakota rich. Now it is courting data centers and carbon pipelines.',
  powers: [
    ['bakken', 'Bakken oil producers', 'Fracking in the Williston Basin.', { lean: 0.9, ind: 'energy', groups: ['energy'] }],
    ['farm', 'Small grains & sugar beet farmers', 'Wheat, canola and the Red River Valley.', { lean: 0.8, ind: 'ag', groups: ['farm'] }],
  ],
  firms: [['Applied Digital data centers', 'tech', 'M'], ['Continental Resources', 'energy', 'L'], ['Marathon Dickinson renewable diesel', 'energy', 'M']],
  megas: [['flood', 'Fargo–Moorhead flood diversion', 3.2, 4], ['water', 'Red River Valley water supply project', 1.2, 7]],
  scenes: [
    ['Oil tax windfall', 'High oil prices filled the Legacy Fund.', [['Property tax relief', { app: 3, cost: 0.01, pw: { taxpayers: 8 } }, 'Homeowners get a big credit.'], ['Invest in water and roads', { cost: 0.01, cr: { infra: -3, water: -2 } }, 'Projects across the state.']]],
  ],
});

GR.regionDef('OH', {
  blurb: 'Intel\'s delayed megafab in New Albany, the East Palestine derailment and a rust-belt comeback that hasn\'t reached every town.',
  powers: [
    ['steel', 'Ohio manufacturers & steelworkers', 'Autos, steel and the Honda EV hub.', { lean: 0.3, ind: 'manufacturing', groups: ['labor'] }],
    ['utilities', 'FirstEnergy & utilities', 'Still under the shadow of the HB6 bribery scandal.', { lean: 0.4, ind: 'energy' }],
  ],
  firms: [['Intel Ohio One (New Albany)', 'tech', 'L'], ['Honda EV hub (Marysville)', 'manufacturing', 'L'], ['Procter & Gamble', 'manufacturing', 'L', 'hq'], ['Cleveland Clinic', 'healthcare', 'L', 'hq'], ['Progressive Insurance', 'finance', 'L', 'hq'], ['Anduril Arsenal-1 (Columbus)', 'defense', 'L']],
  megas: [['bridge', 'Brent Spence Bridge corridor', 3.6, 7], ['fab', 'Intel New Albany site infrastructure', 0.7, 4], ['stadium', 'Cleveland Browns domed stadium (Brook Park)', 2.4, 5], ['transit', 'Columbus LinkUS bus rapid transit', 1.8, 6]],
  scenes: [
    ['Intel delays the fab', 'Intel pushed its Ohio fab back to the 2030s. The state spent hundreds of millions on roads and water.', [['Hold Intel to its commitments', { pw: { steel: 3 }, app: 1 }, 'Intel promises to keep building, slowly.'], ['Recruit other chipmakers to the site', { pp: -8, jobs: 1 }, 'A supplier signs on.']]],
    ['Browns want a dome', 'The Browns want to leave the lakefront for a $2.4 billion dome in Brook Park with $600 million in state bonds.', [['Back the bonds', { cost: 0.002, pw: { business: 4, local: -6 } }, 'Cleveland sues under the Art Modell law.'], ['Refuse', { pw: { business: -4, local: 4 } }, 'The team threatens to look elsewhere.']]],
  ],
});

GR.regionDef('OK', {
  blurb: 'Oil, gas, tribes and tornadoes. The McGirt ruling reshaped tribal sovereignty over half the state.',
  powers: [
    ['oilgas', 'Oil & gas industry (Devon, Continental)', 'The state\'s economic backbone.', { lean: 0.9, ind: 'energy', groups: ['energy'] }],
    ['tribes', 'Tribal nations', 'The Cherokee, Chickasaw, Choctaw, Muscogee and Seminole nations.', { lean: 0, cr: ['health', 'poverty'] }],
  ],
  firms: [['Devon Energy', 'energy', 'L', 'hq'], ['Tinker Air Force Base', 'defense', 'L'], ['Google Pryor data center', 'tech', 'L'], ['Canoo (Pryor)', 'manufacturing', 'S']],
  megas: [['highway', 'Turnpike ACCESS expansion', 5, 10], ['research', 'Tulsa Innovation Labs & tech hub', 0.3, 3]],
  scenes: [
    ['Tribal compacts', 'Tribes want to renegotiate gaming and tax compacts after McGirt.', [['Negotiate in good faith', { pw: { tribes: 10 }, app: 1 }, 'New compacts signed.'], ['Fight jurisdiction in court', { pw: { tribes: -12 } }, 'Litigation drags on.']]],
  ],
});

GR.regionDef('OR', {
  blurb: 'Portland\'s fentanyl crisis ended decriminalization, timber towns are struggling and the chip industry wants land to grow.',
  powers: [
    ['timber', 'Timber industry & rural counties', 'Logging towns and wildfire-scarred forests.', { lean: 0.7, ind: 'manufacturing' }],
    ['siliconforest', 'Silicon Forest (Intel Hillsboro)', 'Oregon\'s largest private employer.', { lean: -0.1, ind: 'tech' }],
  ],
  firms: [['Intel Hillsboro', 'tech', 'L'], ['Nike', 'retail', 'L', 'hq'], ['Columbia Sportswear', 'retail', 'M', 'hq'], ['Amazon data centers (Boardman)', 'tech', 'L']],
  megas: [['bridge', 'Interstate Bridge replacement (I-5 Columbia River)', 7.5, 8], ['flood', 'Wildfire resilience & forest thinning', 0.5, 4], ['fab', 'Semiconductor land expansion', 0.3, 3]],
  scenes: [
    ['Recriminalizing drugs', 'Measure 110 decriminalized drug possession. Fentanyl deaths soared and Portland streets filled with open use.', [['Recriminalize with treatment deflection', { cr: { opioid: -2, crime: -1 }, pw: { police: 6 } }, 'Possession is a misdemeanor again.'], ['Keep it and fund treatment', { cost: 0.002, cr: { opioid: -1 }, app: -3 }, 'Voters are losing patience.']]],
  ],
});

GR.regionDef('PA', {
  blurb: 'Fracking in the west, Philadelphia in the east, steel heritage everywhere, and the biggest swing state in presidential politics.',
  powers: [
    ['fracking', 'Marcellus Shale gas', 'Natural gas drillers and pipeline builders.', { lean: 0.6, ind: 'energy', groups: ['energy'] }],
    ['steelworkers', 'United Steelworkers & the trades', 'U.S. Steel\'s sale to Nippon Steel was a national fight.', { lean: -0.2, ind: 'manufacturing', groups: ['labor'] }],
    ['philly', 'Philadelphia Democratic organization', 'The ward bosses and the city vote.', { lean: -0.9 }],
  ],
  firms: [['U.S. Steel (Nippon Steel)', 'manufacturing', 'L'], ['Comcast', 'tech', 'L', 'hq'], ['UPMC', 'healthcare', 'L', 'hq'], ['Amazon data centers (Salem Twp.)', 'tech', 'L'], ['Microsoft & Constellation: Three Mile Island restart', 'energy', 'L']],
  megas: [['nuclear', 'Three Mile Island Unit 1 restart', 1.6, 3], ['transit', 'SEPTA fleet & King of Prussia rail', 2, 6], ['highway', 'I-95 Philadelphia CAP project', 0.3, 4], ['fab', 'Hydrogen hub (MACH2)', 0.75, 6]],
  scenes: [
    ['SEPTA doomsday', 'SEPTA warns it will cut service by 45% and raise fares unless the state steps in.', [['Permanent transit funding', { cost: 0.002, cr: { infra: -2 }, pw: { philly: 8, taxpayers: -4 } }, 'Trains keep running.'], ['Flex highway money one more year', { cr: { infra: 1 }, pw: { philly: 2 } }, 'A stopgap.']]],
    ['Data centers want cheap power', 'Amazon and Microsoft want gas and nuclear power for huge data centers. Ratepayers worry about bills.', [['Fast-track permits', { jobs: 1, pw: { fracking: 6, business: 5 }, app: -1 }, 'Billions in investment announced.'], ['Make them pay for grid upgrades', { pw: { business: -3 }, app: 2 }, 'Some projects slow down.']]],
  ],
});

GR.regionDef('RI', {
  blurb: 'The smallest state, with the Washington Bridge closure snarling traffic and a housing crunch in Providence.',
  powers: [
    ['providence', 'Providence & the State House insiders', 'Small-state politics where everyone knows everyone.', { lean: -0.6 }],
  ],
  firms: [['CVS Health', 'healthcare', 'L', 'hq'], ['Textron', 'defense', 'L', 'hq'], ['Hasbro', 'manufacturing', 'M', 'hq'], ['General Dynamics Quonset', 'defense', 'M']],
  megas: [['bridge', 'Washington Bridge replacement', 0.4, 3], ['grid', 'Revolution Wind offshore project', 4, 3]],
  scenes: [
    ['The Washington Bridge closes', 'Inspectors found failed steel and closed half of I-195\'s Washington Bridge. Commuters are stuck for hours.', [['Emergency demolition and rebuild', { cost: 0.006, cr: { infra: -3 }, app: 1 }, 'The new bridge opens in 2026.'], ['Order a full investigation first', { scan: -1, app: -2, cr: { infra: 1 } }, 'Months of delay.']]],
  ],
});

GR.regionDef('SC', {
  blurb: 'BMW, Boeing and a booming coast. South Carolina is among the fastest-growing states, with a big nuclear project that failed.',
  powers: [
    ['bmw', 'Upstate manufacturers (BMW, Michelin)', 'The I-85 manufacturing corridor.', { lean: 0.4, ind: 'manufacturing' }],
    ['lowcountry', 'Lowcountry developers & tourism', 'Charleston, Hilton Head and Myrtle Beach.', { lean: 0.5, ind: 'tourism', cr: ['disaster'] }],
  ],
  firms: [['BMW Spartanburg', 'manufacturing', 'L'], ['Boeing North Charleston', 'defense', 'L'], ['Scout Motors (Blythewood)', 'manufacturing', 'L'], ['Volvo Cars Ridgeville', 'manufacturing', 'M'], ['Michelin North America', 'manufacturing', 'M', 'hq']],
  megas: [['port', 'Port of Charleston harbor deepening & Leatherman terminal', 1.5, 5], ['nuclear', 'Revive V.C. Summer reactors', 10, 9], ['flood', 'Charleston peninsula sea wall', 1.3, 8]],
  scenes: [
    ['Finish the abandoned reactors?', 'Santee Cooper is weighing offers to finish the V.C. Summer reactors abandoned in 2017 after a $9 billion fiasco.', [['Pursue a partner', { pw: { bmw: 4, environment: 2 }, pp: -6 }, 'Bids come in from Brookfield.'], ['Close the door for good', { pw: { taxpayers: 4 } }, 'Ratepayers still owe for the last one.']]],
  ],
});

GR.regionDef('SD', {
  blurb: 'Banks moved credit card operations here for the no-usury law. Tribes, ranchers and Mount Rushmore define the rest.',
  powers: [
    ['ranch', 'Ranchers & corn growers', 'West River cattle and East River row crops.', { lean: 0.9, ind: 'ag', groups: ['farm'] }],
    ['tribes', 'Lakota nations', 'Pine Ridge and Rosebud face some of the deepest poverty in America.', { lean: -0.6, cr: ['poverty', 'health'] }],
  ],
  firms: [['Citibank credit cards (Sioux Falls)', 'finance', 'L'], ['Sanford Health', 'healthcare', 'L', 'hq'], ['Smithfield (Sioux Falls)', 'ag', 'M']],
  megas: [['research', 'Black Hills underground science lab expansion', 0.3, 3], ['water', 'Lewis & Clark regional water system', 0.3, 4]],
  scenes: [
    ['Carbon pipeline eminent domain', 'Summit Carbon wants to cross South Dakota farmland. Voters rejected a pro-pipeline law.', [['Ban eminent domain for CO2 pipelines', { pw: { ranch: 8 }, app: 2 }, 'The route is in doubt.'], ['Allow it', { pw: { ranch: -8, ethanol: 4 } }, 'Landowners organize.']]],
  ],
});

GR.regionDef('TN', {
  blurb: 'No income tax, a booming Nashville, Ford\'s BlueOval City in the west, and Memphis struggling with violent crime.',
  powers: [
    ['music', 'Nashville music & tourism', 'Music Row and the bachelorette-party economy.', { lean: 0.1, ind: 'tourism' }],
    ['autos', 'Automakers (Nissan, VW, GM, Ford)', 'The auto corridor from Spring Hill to Smyrna.', { lean: 0.3, ind: 'manufacturing' }],
  ],
  firms: [['Ford BlueOval City', 'manufacturing', 'L'], ['FedEx', 'logistics', 'L', 'hq'], ['HCA Healthcare', 'healthcare', 'L', 'hq'], ['Oracle Nashville campus', 'tech', 'L'], ['xAI Colossus (Memphis)', 'tech', 'L'], ['Volkswagen Chattanooga', 'manufacturing', 'L']],
  megas: [['stadium', 'New enclosed Titans stadium', 2.1, 4], ['highway', 'Choice Lanes toll express lanes', 3, 6], ['transit', 'Nashville transit referendum projects', 3, 8]],
  scenes: [
    ['xAI\'s Memphis supercomputer', 'Elon Musk\'s xAI is running gas turbines to power a giant AI data center in South Memphis. Neighbors complain about the air.', [['Require permits and pollution controls', { pw: { business: -4, environment: 6 }, cr: { health: -1 } }, 'xAI applies for permits.'], ['Welcome the investment', { jobs: 0.5, pw: { business: 6, environment: -6 } }, 'A second data center is announced.']]],
    ['Violence in Memphis', 'Memphis has one of the highest murder rates in America. The governor is under pressure to send state troopers.', [['Surge state troopers', { cost: 0.0005, cr: { crime: -2 }, pw: { police: 6, press: -3 } }, 'Crime dips; complaints rise.'], ['Fund violence interrupters and youth jobs', { cost: 0.0008, cr: { crime: -1 } }, 'A slower approach.']]],
  ],
});

GR.regionDef('TX', {
  blurb: 'The energy capital and a tech boomtown, with no income tax, the busiest border, a standalone power grid that failed in 2021, and water running short.',
  powers: [
    ['oilgas', 'Oil & gas industry', 'The Permian Basin and the Houston energy corridor.', { lean: 0.9, ind: 'energy', groups: ['energy'] }],
    ['tech', 'Texas tech (Austin)', 'Tesla, Samsung, Apple, Oracle and a startup scene that fled California.', { lean: 0.2, ind: 'tech', growth: 1 }],
    ['border', 'Border security hawks', 'They want Operation Lone Star and the wall.', { lean: 1, groups: ['border'] }],
    ['ranchers', 'Ranchers & farmers', 'Cattle, cotton and water.', { lean: 0.8, ind: 'ag', cr: ['water'], groups: ['farm'] }],
  ],
  firms: [['Samsung Taylor fab', 'tech', 'L'], ['Tesla Gigafactory Texas', 'manufacturing', 'L', 'hq'], ['ExxonMobil', 'energy', 'L', 'hq'], ['Texas Instruments Sherman fabs', 'tech', 'L', 'hq'], ['Oracle', 'tech', 'L', 'hq'], ['Charles Schwab', 'finance', 'L', 'hq'], ['SpaceX Starbase', 'defense', 'L']],
  megas: [['water', 'Texas Water Fund: reservoirs & desalination', 20, 10], ['grid', 'Texas Energy Fund: new gas plants & grid hardening', 10, 5], ['hsr', 'Texas Central bullet train (Dallas–Houston)', 30, 9], ['border', 'State border barrier', 3, 5], ['port', 'Port of Corpus Christi channel deepening', 0.7, 4]],
  scenes: [
    ['Winter storm warning', 'An Arctic blast is coming. ERCOT warns of rolling blackouts. Memories of 2021, when 246 people died, are fresh.', [['Order mandatory weatherization and conservation', { cost: 0.0008, cr: { energy: -2, disaster: -1 }, pw: { oilgas: -3 } }, 'The grid holds this time.'], ['Trust the market and ERCOT', { cr: { disaster: 1 }, pw: { oilgas: 3 } }, 'You hope it holds.']]],
    ['Operation Lone Star renewal', 'The border mission costs over $11 billion. Hawks want it extended; budget writers want cuts.', [['Extend it', { cost: 0.004, pw: { border: 10, press: -3 } }, 'More razor wire, more buoys in the Rio Grande.'], ['Scale it back as crossings fall', { pw: { border: -12 } }, 'The base grumbles.']]],
    ['Water for 30 million Texans', 'The state water plan says Texas faces a 7-million-acre-foot shortfall by 2070.', [['Ask voters for a $20 billion water fund', { cost: 0.006, cr: { water: -4 }, pw: { ranchers: 6 } }, 'Proposition passes easily.'], ['Leave it to cities', { cr: { water: 2 } }, 'The shortfall grows.']]],
    ['School vouchers', 'The education savings account push finally has the votes.', [['Sign universal ESAs', { pw: { parents: 10, teachers: -12 }, cr: { education: 0 } }, 'Thousands apply in the first week.'], ['Veto: protect rural schools', { pw: { parents: -10, teachers: 8, party: -8 } }, 'The governor\'s allies are livid.']]],
  ],
});

GR.regionDef('UT', {
  blurb: 'The youngest state, with a booming Silicon Slopes tech scene, a shrinking Great Salt Lake and the 2034 Winter Olympics coming.',
  powers: [
    ['lds', 'The Church of Jesus Christ of Latter-day Saints', 'The Church\'s positions carry enormous weight with legislators and voters.', { lean: 0.6, groups: ['life', 'parents'] }],
    ['slopes', 'Silicon Slopes tech', 'Qualtrics, Adobe and fintech startups along the Wasatch Front.', { lean: 0.3, ind: 'tech', growth: 1 }],
  ],
  firms: [['Adobe Lehi campus', 'tech', 'L'], ['Qualtrics', 'tech', 'M', 'hq'], ['Northrop Grumman Sentinel ICBM', 'defense', 'L'], ['Intermountain Health', 'healthcare', 'L', 'hq'], ['Meta Eagle Mountain data center', 'tech', 'L']],
  megas: [['water', 'Great Salt Lake rescue: water leasing & conservation', 1, 5], ['stadium', 'Olympic venues for 2034', 2.8, 7], ['transit', 'FrontRunner double tracking', 1, 5], ['highway', 'Little Cottonwood Canyon gondola', 0.7, 5]],
  scenes: [
    ['The Great Salt Lake is shrinking', 'The lake hit record lows, exposing arsenic-laden dust that blows into Salt Lake City.', [['Buy water rights to refill the lake', { cost: 0.003, cr: { water: -4, health: -1 }, pw: { farm: -4 } }, 'Inflows rise.'], ['Emergency conservation rules', { cr: { water: -2 }, pw: { business: -2 } }, 'Lawns turn brown.']]],
  ],
});

GR.regionDef('VT', {
  blurb: 'Small, rural and green. Vermont faces devastating floods, the oldest housing stock and some of the highest property taxes for schools.',
  powers: [
    ['dairy', 'Dairy farmers', 'Iconic, struggling family farms.', { lean: 0.2, ind: 'ag' }],
    ['ski', 'Ski resorts & tourism', 'Stowe, Killington and the leaf-peepers.', { lean: 0, ind: 'tourism' }],
  ],
  firms: [['GlobalFoundries Essex Junction fab', 'tech', 'M'], ['Ben & Jerry\'s', 'manufacturing', 'S', 'hq'], ['BETA Technologies', 'defense', 'M', 'hq']],
  megas: [['flood', 'Montpelier & Barre flood resilience', 0.5, 5], ['housing', 'Rural housing improvement program', 0.1, 3]],
  scenes: [
    ['Property taxes jump 15%', 'School costs drove the biggest property tax increase in decades. Towns voted down budgets.', [['Overhaul the education funding formula', { pp: -10, pw: { teachers: -3 }, app: 2 }, 'Consolidation fights loom.'], ['One-time relief', { cost: 0.003, app: 2 }, 'A reprieve, not a fix.']]],
  ],
});

GR.regionDef('VA', {
  blurb: 'The data-center capital of the world in Loudoun County, the Pentagon and Navy shipyards, and a fight over the electric bills those data centers cause.',
  powers: [
    ['datacenters', 'Data center industry', 'Northern Virginia handles a large share of the world\'s internet traffic.', { lean: 0.1, ind: 'tech', growth: 1 }],
    ['navy', 'Naval Station Norfolk & shipyards', 'The largest naval base in the world.', { lean: 0.3, ind: 'defense' }],
  ],
  firms: [['Amazon HQ2 (Arlington)', 'tech', 'L'], ['Microsoft & Google data centers (Loudoun)', 'tech', 'L'], ['Huntington Ingalls Newport News', 'defense', 'L', 'hq'], ['Capital One', 'finance', 'L', 'hq'], ['Micron Manassas', 'tech', 'M']],
  megas: [['transit', 'Long Bridge rail crossing to D.C.', 2.3, 6], ['grid', 'Dominion offshore wind (CVOW)', 10, 3], ['highway', 'Hampton Roads Bridge-Tunnel expansion', 3.9, 6]],
  scenes: [
    ['Data centers and power bills', 'Dominion wants new gas plants and transmission lines to feed data centers. Residential rates are climbing.', [['Make data centers pay more for the grid', { pw: { datacenters: -10 }, app: 3 }, 'A new rate class.'], ['Keep courting them', { jobs: 2, pw: { datacenters: 8 }, app: -2 }, 'Loudoun approves another campus.']]],
  ],
});

GR.regionDef('WA', {
  blurb: 'Boeing and Microsoft, Amazon and Starbucks, a capital-gains tax fight and Seattle\'s homelessness crisis.',
  powers: [
    ['boeing', 'Boeing & the Machinists', 'Puget Sound\'s aerospace backbone, after a strike and safety scandals.', { lean: -0.2, ind: 'defense', groups: ['labor'] }],
    ['bigtech', 'Microsoft & Amazon', 'Two of the most valuable companies in the world.', { lean: -0.3, ind: 'tech' }],
    ['eastside', 'Eastern Washington farmers', 'Apples, wheat and hydropower dams.', { lean: 0.8, ind: 'ag', groups: ['farm'] }],
  ],
  firms: [['Microsoft', 'tech', 'L', 'hq'], ['Amazon', 'retail', 'L', 'hq'], ['Boeing Everett & Renton', 'defense', 'L'], ['Costco', 'retail', 'L', 'hq'], ['Starbucks', 'retail', 'L', 'hq']],
  megas: [['bridge', 'Interstate Bridge replacement (I-5 Columbia River)', 7.5, 8], ['transit', 'Sound Transit 3 light rail expansion', 54, 15], ['flood', 'Snake River dam breaching & salmon restoration', 33, 12], ['hsr', 'Cascadia high-speed rail', 40, 15]],
  scenes: [
    ['Breach the Snake River dams?', 'Tribes and salmon advocates want four dams removed to save salmon. Farmers rely on the barges and power.', [['Support removal studies and replacement power', { pw: { eastside: -10, environment: 10 } }, 'Eastern Washington erupts.'], ['Protect the dams', { pw: { eastside: 8, environment: -8 } }, 'Tribes sue.']]],
  ],
});

GR.regionDef('WV', {
  blurb: 'Coal country in decline, with the highest overdose death rate in America, the oldest workforce and a shrinking population.',
  powers: [
    ['coal', 'Coal operators & miners', 'A shadow of the past, still powerful in Charleston.', { lean: 0.9, ind: 'energy', cr: ['poverty'] }],
    ['gas', 'Natural gas producers', 'The Marcellus and Utica shale fields.', { lean: 0.8, ind: 'energy' }],
  ],
  firms: [['Form Energy battery factory (Weirton)', 'manufacturing', 'M'], ['Toyota Buffalo engine plant', 'manufacturing', 'M'], ['Nucor steel mill (Mason County)', 'manufacturing', 'L']],
  megas: [['highway', 'Corridor H completion', 1.4, 6], ['broadband', 'Statewide broadband build', 0.5, 3]],
  scenes: [
    ['Coal plants want a lifeline', 'Utilities want to retire coal plants. Miners want the state to keep them open.', [['Require coal plants to stay open', { pw: { coal: 10, environment: -6 }, app: 1 }, 'Power bills rise.'], ['Let them close with transition aid', { cost: 0.002, pw: { coal: -8 } }, 'Retraining centers open in the coalfields.']]],
  ],
});

GR.regionDef('WI', {
  blurb: 'Dairy farms, paper mills and Milwaukee\'s factories. The ultimate swing state, where the state supreme court decides the biggest fights.',
  powers: [
    ['dairy', 'Dairy farmers', 'America\'s Dairyland, losing a family farm a day.', { lean: 0.7, ind: 'ag', groups: ['farm'] }],
    ['mfg', 'Wisconsin manufacturers', 'Harley-Davidson, Kohler, Oshkosh and the WMC lobby.', { lean: 0.5, ind: 'manufacturing' }],
  ],
  firms: [['Microsoft Mount Pleasant AI data center', 'tech', 'L'], ['Foxconn Mount Pleasant', 'manufacturing', 'M'], ['Northwestern Mutual', 'finance', 'L', 'hq'], ['Epic Systems', 'tech', 'L', 'hq'], ['Oshkosh Corp.', 'defense', 'M', 'hq']],
  megas: [['highway', 'I-94 East-West Milwaukee rebuild', 1.5, 6], ['stadium', 'American Family Field renovations (Brewers)', 0.5, 4], ['water', 'PFAS cleanup program', 0.2, 3]],
  scenes: [
    ['PFAS in the wells', 'Forever chemicals are showing up in private wells near Marinette and military sites.', [['Statewide PFAS standards and cleanup fund', { cost: 0.001, cr: { water: -3 }, pw: { mfg: -6, environment: 8 } }, 'Testing begins.'], ['Bottled water and voluntary testing', { cr: { water: 1 }, pw: { mfg: 3 } }, 'Residents sue.']]],
  ],
});

GR.regionDef('WY', {
  blurb: 'The least populous state, living off coal, oil, gas and trona. As coal declines, Wyoming is betting on nuclear and carbon capture.',
  powers: [
    ['energy', 'Coal, oil & gas producers', 'Mineral severance taxes pay for nearly everything.', { lean: 0.95, ind: 'energy', groups: ['energy'] }],
    ['ranch', 'Ranchers', 'Cattle, sheep and water rights.', { lean: 0.9, ind: 'ag' }],
  ],
  firms: [['TerraPower Natrium reactor (Kemmerer)', 'energy', 'L'], ['Microsoft Cheyenne data centers', 'tech', 'M'], ['Genesis Alkali trona mines', 'energy', 'M']],
  megas: [['nuclear', 'Natrium advanced reactor at Kemmerer', 4, 6], ['research', 'Carbon capture & coal research center', 0.2, 3]],
  scenes: [
    ['Coal revenues are falling', 'Severance taxes from coal are shrinking every year. The budget relies on them.', [['Diversify: nuclear, carbon capture, data centers', { pw: { energy: -3 }, jobs: 0.4 }, 'New industries look at Wyoming.'], ['Sue other states for blocking coal exports', { pp: -4, pw: { energy: 8 } }, 'Legal fees mount.']]],
  ],
});
