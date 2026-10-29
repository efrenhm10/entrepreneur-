// City dossiers for major cities ('City|ST'). Same format as the state dossiers.
// Smaller cities get scenes generated from their own size, wealth, county and their state's crises.
var GR = globalThis.GR || (globalThis.GR = {});
GR.CITY = GR.CITY || {};
const cityDef = (key, o) => { GR.CITY[key] = o; };
GR.CITY_ALIAS = { 'Brooklyn|NY': 'New York|NY', 'Bronx|NY': 'New York|NY', 'Staten Island|NY': 'New York|NY', 'Flushing|NY': 'New York|NY', 'Jamaica|NY': 'New York|NY', 'Astoria|NY': 'New York|NY', 'Long Island City|NY': 'New York|NY', 'North Hollywood|CA': 'Los Angeles|CA', 'Van Nuys|CA': 'Los Angeles|CA' };

cityDef('New York|NY', {
  blurb: 'Eight million people, a $110 billion budget, congestion pricing, a migrant shelter system bigger than most cities and rents that keep climbing.',
  powers: [['realestate', 'Real Estate Board of New York', 'The developers and landlords who shape the city skyline and its politics.', { lean: 0.2, reg: 1, ind: 'construction' }], ['uft', 'United Federation of Teachers & DC37', 'The city\'s most powerful unions.', { lean: -0.8, groups: ['labor', 'teachers'] }], ['tenants', 'Tenant organizers', 'A million rent-stabilized apartments and their defenders.', { lean: -0.9, cr: ['housing'] }]],
  megas: [['transit', 'Interborough Express light rail', 5.5, 7], ['housing', 'City of Yes: 80,000 new homes', 3, 6], ['flood', 'East Side Coastal Resiliency', 1.45, 4], ['stadium', 'New York City FC stadium in Willets Point', 0.78, 3]],
  scenes: [
    ['Rent Guidelines Board vote', 'The board is about to vote on rent increases for a million stabilized apartments. Landlords say buildings are falling apart; tenants say they can\'t pay.', [['Rent freeze', { pw: { tenants: 12, realestate: -10 }, cr: { housing: -1 }, app: 2 }, 'Tenant groups rally at City Hall.'], ['Modest 2.75% increase', { pw: { tenants: -4, realestate: 3 } }, 'Nobody is thrilled.'], ['Large increase to fix buildings', { pw: { tenants: -12, realestate: 8 }, app: -2 }, 'Protesters storm the hearing.']]],
    ['Subway crime headlines', 'A string of violent incidents on the subway has riders scared.', [['Flood the system with police', { cost: 0.002, cr: { crime: -1 }, pw: { police: 6, press: -2 } }, 'Officers on every platform.'], ['Mental-health outreach teams', { cost: 0.001, cr: { homeless: -1, crime: -1 } }, 'A quieter approach.']]],
    ['A charter revision fight', 'City Council wants more power over land use. Your allies warn it will block housing.', [['Back the housing fast-track', { cr: { housing: -2 }, pw: { realestate: 6, local: -4 } }, 'A ballot fight.'], ['Side with the council', { pw: { realestate: -4, local: 6 } }, 'Housing approvals slow.']]],
  ],
});

cityDef('Los Angeles|CA', {
  blurb: 'Hollywood, the ports and the largest homeless population in the country. The 2025 fires burned Pacific Palisades, and the 2028 Olympics are coming.',
  powers: [['hollywood', 'Studios & entertainment unions', 'Production is leaving for Atlanta and London.', { lean: -0.6, ind: 'tourism' }], ['ports', 'Ports of LA & Long Beach', 'The busiest container complex in the Western Hemisphere.', { lean: -0.2, ind: 'logistics' }]],
  megas: [['stadium', 'LA28 Olympics venues & transportation', 7, 3], ['transit', 'Metro Sepulveda Pass rail', 12, 10], ['housing', 'Palisades & Altadena fire rebuild', 3, 5], ['water', 'Hyperion water recycling (Operation NEXT)', 5, 10]],
  scenes: [
    ['Rebuilding the Palisades', 'Thousands of homes burned. Owners want to rebuild fast, but fire experts want stricter codes.', [['Fast-track permits, keep old rules', { cr: { housing: -2, disaster: 1 }, app: 2 }, 'Construction begins quickly.'], ['Require fire-hardened rebuilding', { cr: { disaster: -3 }, app: -1, pw: { realestate: -4 } }, 'Costs go up.']]],
    ['Inside Safe encampment sweeps', 'Your homelessness program moves people from encampments into motels. Results are mixed.', [['Expand it citywide', { cost: 0.004, cr: { homeless: -3 } }, 'Thousands come inside.'], ['Shift to permanent housing', { cost: 0.006, cr: { homeless: -2, housing: -1 } }, 'Slower, but lasting.']]],
  ],
});

cityDef('Chicago|IL', {
  blurb: 'A global city with a $1 billion budget hole, four pension funds near insolvency, and shootings concentrated on the South and West sides.',
  powers: [['ctu', 'Chicago Teachers Union', 'The union that helped elect the mayor.', { lean: -0.9, groups: ['teachers'] }], ['loop', 'Loop business community', 'The Commercial Club and downtown employers.', { lean: 0.2, taxes: 1, ind: 'finance' }]],
  megas: [['stadium', 'Bears lakefront domed stadium', 4.7, 5], ['transit', 'CTA Red Line Extension', 5.7, 7], ['housing', 'Green Social Housing revolving fund', 1.25, 5]],
  scenes: [
    ['The $1 billion budget gap', 'Chicago faces another billion-dollar hole as pandemic money runs out.', [['Property tax increase', { cost: -0.03, app: -3, pw: { loop: -4 } }, 'Aldermen balk.'], ['Head tax on big employers', { cost: -0.02, pw: { loop: -12 }, app: 1 }, 'Companies threaten to move.'], ['Cut police overtime and city jobs', { cost: -0.015, pw: { police: -8, labor: -6 }, cr: { crime: 1 } }, 'The unions push back.']]],
    ['A violent summer weekend', 'More than 50 people were shot over the Fourth of July weekend.', [['Peacekeepers and summer jobs', { cost: 0.002, cr: { crime: -2 } }, 'Community groups expand.'], ['More police overtime', { cost: 0.002, cr: { crime: -1 }, pw: { police: 6, ctu: -2 } }, 'Officers are exhausted.']]],
  ],
});

cityDef('Houston|TX', {
  blurb: 'The energy capital and the largest city without zoning. Floods from Harvey and Beryl left scars, and the city faces a structural deficit.',
  powers: [['energy', 'Energy companies', 'Exxon, Chevron and the energy corridor.', { lean: 0.7, ind: 'energy' }], ['medcenter', 'Texas Medical Center', 'The world\'s largest medical complex.', { lean: -0.1, ind: 'healthcare' }]],
  megas: [['flood', 'Coastal Spine (Ike Dike) storm surge barrier', 31, 15], ['highway', 'I-45 North Houston Highway Improvement', 9, 10], ['flood', 'Harris County flood bond projects', 2.5, 6]],
  scenes: [
    ['Hurricane Beryl power outages', 'Two million lost power for days in the July heat. CenterPoint\'s response was a fiasco.', [['Demand accountability and buried lines', { pp: -4, app: 2, pw: { energy: -4 } }, 'CenterPoint\'s CEO resigns.'], ['Cooling centers and generators', { cost: 0.002, cr: { disaster: -1 } }, 'Practical help.']]],
  ],
});

cityDef('Phoenix|AZ', {
  blurb: 'The fastest-growing big city in America and the hottest, with a shrinking water supply and TSMC\'s fabs on the north side.',
  powers: [['builders', 'Homebuilders', 'Master-planned communities on the desert edge.', { lean: 0.5, ind: 'construction' }]],
  megas: [['transit', 'Valley Metro Capitol extension', 0.5, 4], ['water', 'Advanced water purification (recycled wastewater)', 0.8, 5], ['housing', 'Heat-resilient affordable housing', 0.3, 3]],
  scenes: [
    ['Another 118-degree summer', 'Phoenix had over 100 straight days above 110 degrees. Heat deaths spiked.', [['Expand cooling centers and shade', { cost: 0.002, cr: { health: -1, homeless: -1 }, app: 1 }, 'Lives are saved.'], ['Plant 100,000 trees', { cost: 0.002, cr: { disaster: -1 } }, 'Shade in ten years.']]],
  ],
});

cityDef('Philadelphia|PA', {
  blurb: 'Eds and meds, a gun violence crisis that is finally easing, the Kensington open-air drug market and a SEPTA fiscal cliff.',
  powers: [['eds', 'Universities & hospitals', 'Penn, Jefferson and Temple are the biggest employers.', { lean: -0.6, ind: 'healthcare' }], ['wards', 'Ward leaders', 'The Democratic machine.', { lean: -0.9 }]],
  megas: [['stadium', '76ers arena (dropped Market East plan)', 1.5, 4], ['transit', 'Roosevelt Boulevard subway', 3.5, 10], ['highway', 'I-95 CAP park over the highway', 0.33, 4]],
  scenes: [
    ['Kensington', 'Kensington Avenue is the largest open-air drug market on the East Coast.', [['Clear the street with police and treatment beds', { cost: 0.002, cr: { opioid: -2, crime: -1 }, pw: { police: 6 } }, 'Encampments shrink.'], ['Open a supervised consumption site', { cr: { opioid: -2 }, pw: { police: -8, wards: -4 }, app: -2 }, 'The neighborhood is split.']]],
  ],
});

cityDef('San Antonio|TX', {
  blurb: 'Military City USA, with low wages, fast growth and a new Spurs arena fight.',
  powers: [['bases', 'Joint Base San Antonio', 'Military medicine and training.', { lean: 0.3, ind: 'defense' }]],
  megas: [['arena', 'Spurs downtown arena (Project Marvel)', 4, 5], ['transit', 'Green Line bus rapid transit', 0.4, 3]],
  scenes: [['Project Marvel', 'The Spurs want a new downtown arena with a county venue tax.', [['Support the venue tax', { cost: 0.003, pw: { business: 6 }, app: -1 }, 'Voters approve it.'], ['Oppose public money', { pw: { business: -4, taxpayers: 4 } }, 'The Spurs mention Austin.']]]],
});

cityDef('San Diego|CA', {
  blurb: 'Navy, biotech and a border city with the busiest land crossing in the hemisphere. Sewage from Tijuana fouls the beaches.',
  powers: [['navy', 'Navy & defense contractors', 'The Pacific Fleet\'s home port.', { lean: 0.2, ind: 'defense' }]],
  megas: [['water', 'Pure Water San Diego recycling', 5, 6], ['flood', 'Tijuana River sewage treatment fix', 0.6, 4], ['stadium', 'Midway Rising sports arena', 1.5, 4]],
  scenes: [['Sewage on the beaches', 'Imperial Beach has been closed most days for years because of Tijuana River sewage.', [['Demand federal emergency action', { pp: -6, cr: { water: -2 }, app: 2 }, 'The EPA funds plant repairs.'], ['Fund a local diversion', { cost: 0.002, cr: { water: -2 } }, 'Beaches reopen some days.']]]],
});

cityDef('Dallas|TX', {
  blurb: 'A booming corporate relocation magnet with a police staffing crisis and an underfunded pension system.',
  powers: [['corporate', 'Corporate relocations (Goldman, AT&T, Toyota)', 'Y\'all Street.', { lean: 0.5, ind: 'finance' }]],
  megas: [['convention', 'Kay Bailey Hutchison Convention Center rebuild', 3, 6], ['highway', 'I-345 deck park', 1, 6]],
  scenes: [['Police pension crisis', 'The police and fire pension is billions short. Voters passed a charter amendment requiring 4,000 officers.', [['Fund the pension and hiring', { cost: 0.01, cr: { pension: -3, crime: -1 }, pw: { police: 10 } }, 'Other services are cut.'], ['Slow hiring', { pw: { police: -10 }, cr: { crime: 1 } }, 'The union sues.']]]],
});

cityDef('Austin|TX', {
  blurb: 'Tech boomtown turned cautionary tale: rents soared, then fell as the city built faster than anywhere in America.',
  powers: [['tech', 'Tech companies (Tesla, Apple, Oracle)', 'The new Austin.', { lean: 0.1, ind: 'tech' }], ['neighborhoods', 'Neighborhood associations', 'The old guard fighting density.', { lean: -0.4 }]],
  megas: [['transit', 'Project Connect light rail', 7, 9], ['highway', 'I-35 Capital Express Central', 4.5, 7]],
  scenes: [['HOME initiative', 'A proposal to allow three homes on every lot and smaller lots citywide.', [['Pass it', { cr: { housing: -4 }, pw: { neighborhoods: -10, tech: 4 } }, 'Building permits surge.'], ['Water it down', { pw: { neighborhoods: 6 }, cr: { housing: 1 } }, 'Rents tick back up.']]]],
});

cityDef('San Jose|CA', {
  blurb: 'Capital of Silicon Valley with sky-high rents and Google\'s scaled-back Downtown West campus.',
  powers: [['tech', 'Silicon Valley employers', 'Apple, Nvidia, Cisco and Adobe.', { lean: -0.1, ind: 'tech' }]],
  megas: [['transit', 'BART Silicon Valley Phase II', 12.7, 10], ['housing', 'Quick-build tiny homes for the homeless', 0.2, 2]],
  scenes: [['Google pauses Downtown West', 'Google paused its 80-acre downtown village.', [['Rezone for other uses', { pp: -4, cr: { housing: -1 } }, 'Developers circle.'], ['Wait for Google', { pw: { tech: 2 } }, 'The lots sit empty.']]]],
});

cityDef('San Francisco|CA', {
  blurb: 'An AI boom in a downtown still emptied by remote work, a fentanyl crisis in the Tenderloin and a recall-happy electorate.',
  powers: [['ai', 'AI startups (OpenAI, Anthropic)', 'The new gold rush.', { lean: -0.3, ind: 'tech' }], ['progressives', 'Progressive activists', 'The left flank of a very left city.', { lean: -1 }]],
  megas: [['transit', 'Downtown Rail Extension (Portal)', 8.3, 10], ['housing', 'Downtown office-to-housing conversions', 1, 5], ['flood', 'Embarcadero seawall', 13, 15]],
  scenes: [['The Tenderloin', 'Open-air drug use in the Tenderloin is the image of the city around the world.', [['Arrest dealers and mandate treatment', { cr: { opioid: -2, crime: -1 }, pw: { progressives: -10, police: 6 } }, 'Tech donors cheer.'], ['More harm reduction', { cr: { opioid: -1 }, pw: { progressives: 6 }, app: -3 }, 'Residents are fed up.']]]],
});

cityDef('Seattle|WA', {
  blurb: 'Amazon and Microsoft\'s hometown, with a JumpStart payroll tax, a homelessness crisis and light rail finally reaching the suburbs.',
  powers: [['amazon', 'Amazon & Microsoft', 'The tech giants that dominate the region.', { lean: -0.2, ind: 'tech' }]],
  megas: [['transit', 'Sound Transit West Seattle & Ballard light rail', 14, 12], ['housing', 'Social housing developer', 0.5, 4], ['arena', 'Climate Pledge Arena district', 0.3, 2]],
  scenes: [['JumpStart tax shortfall', 'The payroll tax on big employers is bringing in less than projected.', [['Raise it', { cost: -0.004, pw: { amazon: -10 } }, 'Amazon pauses hiring downtown.'], ['Cut spending', { pw: { amazon: 4, labor: -6 }, cr: { housing: 1 } }, 'Housing programs shrink.']]]],
});

cityDef('Denver|CO', {
  blurb: 'Mile High City absorbed 40,000 migrants, faces a downtown office slump and is betting on housing the homeless.',
  powers: [['downtown', 'Downtown Denver Partnership', 'Business and real estate.', { lean: 0.1 }]],
  megas: [['highway', 'Burnham Yard & 16th Street redevelopment', 1.5, 5], ['housing', 'All In Mile High micro-communities', 0.2, 2]],
  scenes: [['Migrant buses', 'Thousands of migrants arrived on buses from Texas.', [['Shelter and work program', { cost: 0.006, cr: { homeless: -1 }, app: -2 }, 'Services are stretched.'], ['Limit shelter stays', { pw: { press: -3 }, app: 1 }, 'Advocates protest.']]]],
});

cityDef('Washington|DC', {
  blurb: 'The capital: federal layoffs, an empty downtown and a new stadium deal for the Commanders.',
  powers: [['feds', 'Federal workers', 'The government town.', { lean: -0.8 }]],
  megas: [['stadium', 'Commanders stadium at RFK', 3.7, 5], ['transit', 'Union Station rebuild', 8.8, 10]],
  scenes: [['Congress cuts the budget', 'Congress forced a billion-dollar cut to D.C.\'s budget.', [['Hiring freeze and cuts', { cost: -0.01, pw: { feds: -4 } }, 'Services strain.'], ['Raid the reserve', { cost: 0.01, app: 1 }, 'Bond raters notice.']]]],
});

cityDef('Boston|MA', {
  blurb: 'Universities, hospitals and biotech, the most expensive rents outside New York and California, and an office market that cratered.',
  powers: [['eds', 'Universities & hospitals', 'The PILOT payments fight.', { lean: -0.7, ind: 'healthcare' }]],
  megas: [['transit', 'Red-Blue connector', 1, 6], ['flood', 'Climate Ready Boston harbor protection', 2, 10]],
  scenes: [['Property tax shift', 'Falling office values will push taxes onto homeowners.', [['Shift more burden onto businesses', { pw: { business: -8 }, app: 3 }, 'The legislature balks.'], ['Let homeowners pay', { app: -4 }, 'Tax bills jump.']]]],
});

cityDef('Nashville|TN', {
  blurb: 'Music City is booming, with a new Titans stadium, crushing traffic and a transit referendum that finally passed.',
  powers: [['music', 'Music Row & tourism', 'Broadway honky-tonks and bachelorette parties.', { lean: 0, ind: 'tourism' }]],
  megas: [['stadium', 'New Titans enclosed stadium', 2.1, 4], ['transit', 'Choose How You Move transit program', 3.1, 15]],
  scenes: [['The state preempts the city', 'The legislature passed a law cutting the Metro Council in half.', [['Sue the state', { pp: -4, pw: { local: 6, party: -4 } }, 'The courts strike it down.'], ['Comply quietly', { pw: { local: -6 } }, 'Activists are furious.']]]],
});

cityDef('Memphis|TN', {
  blurb: 'FedEx and the blues, one of the highest murder rates in America, and the Tyre Nichols case that disbanded a police unit.',
  powers: [['fedex', 'FedEx & logistics', 'The world\'s busiest cargo airport.', { lean: 0.3, ind: 'logistics' }]],
  megas: [['arena', 'FedExForum renovation (Grizzlies)', 0.55, 3], ['water', 'Memphis Sand Aquifer protection', 0.1, 2]],
  scenes: [['A police reform consent decree', 'The Justice Department recommends federal oversight of the police department.', [['Accept reforms', { pw: { police: -8, church: 6 }, cr: { crime: 0 } }, 'Trust inches up.'], ['Refuse oversight', { pw: { police: 6, press: -4 } }, 'Activists march.']]]],
});

cityDef('Detroit|MI', {
  blurb: 'Out of bankruptcy and growing again for the first time since the 1950s, with Ford\'s Michigan Central Station reborn.',
  powers: [['uaw', 'UAW & the auto plants', 'Detroit\'s heart.', { lean: -0.7, groups: ['labor'] }], ['ilitch', 'Downtown developers (Gilbert, Ilitch)', 'The billionaires rebuilding downtown.', { lean: 0, ind: 'construction' }]],
  megas: [['housing', 'Land Bank home renovations', 0.3, 4], ['highway', 'I-375 removal & boulevard', 0.3, 4], ['transit', 'Woodward Avenue bus rapid transit', 0.4, 4]],
  scenes: [['Land value tax', 'A proposal would tax land more and buildings less, punishing speculators sitting on vacant lots.', [['Support it', { cr: { housing: -2 }, pw: { ilitch: -6 } }, 'Speculators sell.'], ['Oppose it', { pw: { ilitch: 4 } }, 'Vacant lots stay vacant.']]]],
});

cityDef('Portland|OR', {
  blurb: 'A city remaking itself: a new expanded council, a reversed drug decriminalization and a downtown trying to come back.',
  powers: [['downtown', 'Downtown businesses', 'Retailers who left after 2020.', { lean: 0.1 }]],
  megas: [['bridge', 'Burnside Bridge earthquake rebuild', 0.9, 5], ['housing', 'Homeless shelter villages', 0.1, 2]],
  scenes: [['Camping ban', 'After the Supreme Court\'s Grants Pass ruling, cities may ban camping.', [['Enforce with shelter offers', { cost: 0.001, cr: { homeless: -1 }, pw: { downtown: 8, press: -3 } }, 'Downtown sidewalks clear.'], ['Don\'t enforce', { pw: { downtown: -8 } }, 'Businesses keep leaving.']]]],
});

cityDef('Las Vegas|NV', {
  blurb: 'Raiders, Golden Knights, and soon the A\'s. Tourism is booming but Lake Mead is low and rents are climbing.',
  powers: [['strip', 'The Strip', 'Casino resorts.', { lean: 0, ind: 'tourism' }], ['culinary', 'Culinary Union', 'Casino workers.', { lean: -0.6 }]],
  megas: [['stadium', 'A\'s ballpark at the Tropicana', 1.75, 4], ['hsr', 'Brightline West station', 0.4, 4]],
  scenes: [['Short-term rentals near the Strip', 'Party houses are flooding neighborhoods.', [['Strict caps', { cr: { housing: -1 }, pw: { strip: 3 } }, 'Neighbors cheer.'], ['Light rules', { pw: { business: 3 }, app: -1 }, 'Complaints continue.']]]],
});

cityDef('Baltimore|MD', {
  blurb: 'Rebuilding the Key Bridge, with homicides falling sharply, 13,000 vacant row houses and a port getting back on its feet.',
  powers: [['hopkins', 'Johns Hopkins', 'The city\'s largest private employer.', { lean: -0.5, ind: 'healthcare' }]],
  megas: [['housing', 'Vacant row house rehab program', 3, 10], ['transit', 'Red Line light rail', 6, 8], ['stadium', 'Harborplace redevelopment', 0.9, 5]],
  scenes: [['Vacant houses', '13,000 vacant row houses blight entire neighborhoods.', [['Massive acquisition and rehab plan', { cost: 0.005, cr: { housing: -2, crime: -1 } }, 'Whole blocks are revived.'], ['Demolish the worst', { cost: 0.001, cr: { crime: -1 } }, 'Gaps in the row homes.']]]],
});

cityDef('Milwaukee|WI', {
  blurb: 'Brewers, the Bucks, the 2024 Republican convention, and a 1% sales tax the state finally allowed.',
  powers: [['mfg', 'Manufacturers', 'Harley-Davidson and the industrial base.', { lean: 0.3, ind: 'manufacturing' }]],
  megas: [['stadium', 'American Family Field upgrades', 0.5, 4], ['transit', 'The Hop streetcar extension', 0.2, 3]],
  scenes: [['Lead pipes', 'Thousands of homes still get water through lead pipes.', [['Accelerate replacement', { cost: 0.004, cr: { water: -3, health: -1 } }, 'Crews dig up whole blocks.'], ['Filters and a 70-year plan', { cr: { water: -1 } }, 'Advocates are outraged.']]]],
});

cityDef('Atlanta|GA', {
  blurb: 'The capital of the New South, with a BeltLine reshaping neighborhoods, the controversial public safety training center and failing water mains.',
  powers: [['corporate', 'Corporate Atlanta', 'Delta, Coca-Cola and Home Depot.', { lean: 0, ind: 'logistics' }]],
  megas: [['transit', 'BeltLine streetcar', 2.5, 7], ['water', 'Water main replacement after the 2024 breaks', 1, 5], ['stadium', 'World Cup 2026 upgrades', 0.3, 2]],
  scenes: [['Cop City', 'Protesters oppose the police training center in the South River Forest.', [['Finish it', { pw: { police: 8, press: -4 } }, 'It opens behind fences.'], ['Pause and review', { pw: { police: -8 } }, 'Police morale drops.']]]],
});

cityDef('Miami|FL', {
  blurb: 'A Latin American finance hub where tech and hedge funds moved in, condos crack, and sea level rise floods streets on sunny days.',
  powers: [['condo', 'Condo developers', 'The skyline keeps rising.', { lean: 0.4, ind: 'construction' }], ['exiles', 'Cuban & Venezuelan exile community', 'Hardline on Havana and Caracas.', { lean: 0.7 }]],
  megas: [['flood', 'Stormwater pumps & raised roads', 3, 8], ['transit', 'Northeast Corridor commuter rail', 0.9, 5], ['stadium', 'Inter Miami Freedom Park', 1, 3]],
  scenes: [['King tides', 'Sunny-day flooding is closing streets in Brickell and Little River.', [['Stormwater fee for pumps', { cost: -0.002, cr: { disaster: -2 }, app: -1 }, 'The pumps run.'], ['Raise roads in phases', { cost: 0.002, cr: { disaster: -1 } }, 'Shops end up below grade.']]]],
});

cityDef('Orlando|FL', {
  blurb: 'Disney, Universal\'s Epic Universe and tourism, plus some of the worst affordable-housing shortages for service workers.',
  powers: [['parks', 'Theme parks', 'Disney and Universal.', { lean: 0, ind: 'tourism' }]],
  megas: [['transit', 'SunRail extension to the airport', 0.8, 5], ['arena', 'Kia Center & entertainment district', 0.5, 3]],
  scenes: [['Workers can\'t afford to live here', 'Theme park workers commute two hours.', [['Inclusionary zoning', { cr: { housing: -2 }, pw: { business: -4 } }, 'Developers grumble.'], ['Ask Disney to build housing', { pp: -4, cr: { housing: -1 } }, 'Disney builds 1,300 units.']]]],
});

cityDef('Jacksonville|FL', {
  blurb: 'The largest city by area in the lower 48, renovating the Jaguars\' stadium with $775 million in public money.',
  powers: [['jags', 'Jaguars & the downtown owners', 'Shad Khan\'s plans.', { lean: 0.2 }]],
  megas: [['stadium', 'EverBank Stadium of the Future', 1.4, 4], ['port', 'JAXPORT harbor deepening', 0.4, 4]],
  scenes: [['Downtown is still empty', 'The riverfront remains vacant despite decades of plans.', [['Incentives for riverfront towers', { cost: 0.002, pw: { jags: 6 } }, 'Cranes appear.'], ['Parks first', { cost: 0.001, app: 1 }, 'A new riverwalk opens.']]]],
});

cityDef('Minneapolis|MN', {
  blurb: 'Five years after George Floyd, under a consent decree, with downtown recovering and a police force still short-staffed.',
  powers: [['activists', 'Police reform activists', 'Born in 2020.', { lean: -1 }]],
  megas: [['transit', 'Blue Line light rail extension', 3.2, 6], ['housing', 'Citywide fourplex zoning build-out', 0.2, 4]],
  scenes: [['Consent decree costs', 'The police consent decree requires hiring, training and monitoring.', [['Fully comply', { cost: 0.002, pw: { activists: 8, police: -4 } }, 'The monitor reports progress.'], ['Ask for relief from the decree', { pw: { activists: -10, police: 6 } }, 'The judge says no.']]]],
});

cityDef('Saint Louis|MO', {
  blurb: 'Half the population it had in 1950, a downtown hollowed out, high crime, and a new MLS stadium drawing crowds.',
  powers: [['county', 'St. Louis County leaders', 'The city-county divide.', { lean: -0.2 }]],
  megas: [['transit', 'MetroLink Green Line', 1.2, 6], ['housing', 'North St. Louis revitalization', 0.4, 5]],
  scenes: [['Merge city and county?', 'A proposal to rejoin the city and county has resurfaced.', [['Back the merger', { pp: -8, pw: { county: -6 }, cr: { crime: -1 } }, 'The fight is on.'], ['Stay separate', { pw: { county: 4 } }, 'The status quo holds.']]]],
});

cityDef('Kansas City|MO', {
  blurb: 'Chiefs, Royals, a new airport and a streetcar, with the Royals threatening to move across the state line.',
  powers: [['teams', 'Chiefs & Royals owners', 'The stadium fight.', { lean: 0.1 }]],
  megas: [['stadium', 'Royals downtown ballpark', 2, 4], ['transit', 'Streetcar extension to UMKC', 0.35, 3]],
  scenes: [['Royals downtown ballpark', 'The Royals want a downtown stadium; Kansas is offering bonds.', [['Offer city land and a TIF', { cost: 0.003, pw: { teams: 10 } }, 'The Royals stay.'], ['Refuse', { pw: { teams: -12 } }, 'The Royals sign with Kansas.']]]],
});

cityDef('New Orleans|LA', {
  blurb: 'Music and tourism, levees and pumps, an aging water system and violent crime falling from post-pandemic peaks.',
  powers: [['tourism', 'Tourism & hospitality', 'Bourbon Street to the Superdome.', { lean: -0.3, ind: 'tourism' }]],
  megas: [['water', 'Sewerage & Water Board pump overhaul', 1.2, 5], ['airport', 'Airport connector road', 0.2, 2]],
  scenes: [['Pumps fail in a storm', 'The pumps failed during a summer downpour, flooding Mid-City.', [['Emergency pump repairs', { cost: 0.003, cr: { infra: -2, disaster: -2 } }, 'The pumps are rebuilt.'], ['Blame the utility board', { app: -2 }, 'The flooding repeats.']]]],
});

cityDef('Cleveland|OH', {
  blurb: 'Cleveland Clinic and lakefront plans, a Browns move to the suburbs and lead in old housing.',
  powers: [['clinic', 'Cleveland Clinic', 'The city\'s largest employer.', { lean: -0.2, ind: 'healthcare' }]],
  megas: [['stadium', 'Lakefront redevelopment after the Browns leave', 1, 6], ['housing', 'Lead-safe housing program', 0.1, 3]],
  scenes: [['The Browns are leaving', 'The Browns are moving to Brook Park.', [['Sue under the Modell law', { pp: -6, pw: { local: 6 }, app: 2 }, 'A long legal fight.'], ['Negotiate a settlement for lakefront development', { pp: -3 }, 'The lakefront plan gets money.']]]],
});

cityDef('Pittsburgh|PA', {
  blurb: 'From steel to robotics and medicine, with an aging population, 400 bridges and a tight budget.',
  powers: [['meds', 'UPMC & Carnegie Mellon', 'Eds, meds and robotics.', { lean: -0.4, ind: 'healthcare' }]],
  megas: [['bridge', 'Bridge repair program', 0.4, 5], ['transit', 'Downtown-Uptown-Oakland bus rapid transit', 0.3, 3]],
  scenes: [['UPMC pays no property tax', 'The giant nonprofit owns tax-exempt land worth billions.', [['Challenge their tax exemption', { pp: -6, pw: { meds: -10 }, cost: -0.003 }, 'UPMC agrees to a PILOT.'], ['Ask nicely', { pw: { meds: 2 } }, 'A small donation.']]]],
});

cityDef('Cincinnati|OH', {
  blurb: 'Procter & Gamble, the Reds and the Brent Spence Bridge finally being built.',
  powers: [['pg', 'Procter & Gamble & Kroger', 'Corporate Cincinnati.', { lean: 0.2 }]],
  megas: [['bridge', 'Brent Spence Bridge corridor', 3.6, 7], ['stadium', 'Paycor Stadium renovation (Bengals)', 0.5, 3]],
  scenes: [['Sell the railroad?', 'The city owns a railroad; voters approved selling it for $1.6 billion.', [['Invest the proceeds in infrastructure', { cr: { infra: -3 } }, 'Roads get repaved.'], ['Use it to plug the budget', { pw: { press: -3 } }, 'Critics complain.']]]],
});

cityDef('Columbus|OH', {
  blurb: 'The fastest-growing city in the Midwest, waiting on Intel, building its first rapid transit and adding housing fast.',
  powers: [['osu', 'Ohio State University', 'The giant at the center.', { lean: -0.2, ind: 'education' }]],
  megas: [['transit', 'LinkUS bus rapid transit', 1.8, 6], ['housing', '$500 million housing bond', 0.5, 4]],
  scenes: [['Growth is outpacing housing', 'Central Ohio expects a million new people by 2050.', [['Zoning overhaul', { cr: { housing: -3 }, pw: { local: -3 } }, 'Apartments rise near transit.'], ['Slow growth', { cr: { housing: 2 } }, 'Prices keep climbing.']]]],
});

cityDef('Indianapolis|IN', {
  blurb: 'Lilly\'s hometown, the Indy 500 and a downtown betting on sports tourism.',
  powers: [['lilly', 'Eli Lilly', 'Indianapolis\'s biggest corporate citizen.', { lean: 0.1, ind: 'healthcare' }]],
  megas: [['stadium', 'Indy Eleven soccer stadium', 0.6, 3], ['transit', 'IndyGo Blue Line', 0.4, 4]],
  scenes: [['A homicide spike', 'Homicides hit a record in the downtown core.', [['Group violence intervention', { cost: 0.001, cr: { crime: -1 } }, 'Shootings decline.'], ['Hire 200 more officers', { cost: 0.002, cr: { crime: -1 }, pw: { police: 6 } }, 'Recruiting is hard.']]]],
});

cityDef('Charlotte|NC', {
  blurb: 'Banking capital with fast growth and a one-cent transit tax in play.',
  powers: [['banks', 'Big banks', 'Bank of America and Truist.', { lean: 0.1, ind: 'finance' }]],
  megas: [['transit', 'Silver Line light rail', 8, 12], ['stadium', 'Bank of America Stadium renovation (Panthers)', 0.8, 4]],
  scenes: [['Transit sales tax', 'The county wants voters to approve a sales tax for rail and roads.', [['Campaign for it', { pp: -6, cr: { infra: -2 } }, 'It passes.'], ['Stay out', { cr: { infra: 1 } }, 'Gridlock grows.']]]],
});

cityDef('Raleigh|NC', {
  blurb: 'The Research Triangle\'s capital, adding a new resident every few minutes.',
  powers: [['triangle', 'Research Triangle Park', 'Tech and biotech.', { lean: -0.2, ind: 'tech' }]],
  megas: [['transit', 'Bus rapid transit network', 0.4, 4], ['housing', 'Missing-middle housing program', 0.1, 3]],
  scenes: [['Annexation fights', 'Suburban towns fight the capital over growth and water.', [['Regional water deal', { pp: -4, cr: { water: -1 } }, 'A compact is signed.'], ['Go it alone', { cr: { water: 1 } }, 'Tension grows.']]]],
});

cityDef('Oklahoma City|OK', {
  blurb: 'Thunder basketball, oil money and MAPS: a penny sales tax that rebuilt downtown.',
  powers: [['thunder', 'Thunder ownership', 'The city\'s pride.', { lean: 0.4 }]],
  megas: [['arena', 'New Thunder arena (MAPS 5)', 0.9, 5], ['transit', 'MAPS 4 bus rapid transit', 0.3, 3]],
  scenes: [['MAPS 5', 'A new penny tax for an arena and neighborhood projects.', [['Put it on the ballot', { pp: -4, pw: { thunder: 10 } }, 'Voters approve it.'], ['Skip the arena', { pw: { thunder: -12 } }, 'The Thunder look at Seattle.']]]],
});

cityDef('Tulsa|OK', {
  blurb: 'Pays remote workers to move here, reckoning with the 1921 Race Massacre and the Greenwood district.',
  powers: [['kaiser', 'George Kaiser Family Foundation', 'The philanthropy remaking Tulsa.', { lean: -0.1 }]],
  megas: [['park', 'Gathering Place park expansion', 0.1, 2], ['research', 'Tulsa Innovation Labs', 0.2, 3]],
  scenes: [['Greenwood reparations', 'Descendants of the 1921 massacre ask for reparations.', [['Fund a Greenwood trust', { cost: 0.002, pw: { church: 8 }, app: 1 }, 'A historic step.'], ['Memorials only', { app: -1 }, 'Descendants are disappointed.']]]],
});

cityDef('Louisville|KY', {
  blurb: 'Bourbon, the Derby and UPS Worldport, still healing from the Breonna Taylor case.',
  powers: [['ups', 'UPS Worldport', 'The city\'s largest employer.', { lean: 0, ind: 'logistics' }]],
  megas: [['housing', 'West End revitalization', 0.3, 4], ['bridge', 'Ohio River bridges', 0.3, 3]],
  scenes: [['Police consent decree', 'The DOJ found a pattern of unconstitutional policing.', [['Sign the decree', { pw: { police: -6, church: 6 } }, 'Reform begins.'], ['Local reform plan only', { pw: { police: 6, church: -6 } }, 'Activists object.']]]],
});

cityDef('Salt Lake City|UT', {
  blurb: 'Preparing for the 2034 Olympics, an NHL team and a downtown rebuilt around a new arena district.',
  powers: [['miller', 'Smith Entertainment Group', 'Owners of the Jazz and the new NHL team.', { lean: 0.3 }]],
  megas: [['arena', 'Delta Center & downtown sports district', 0.9, 4], ['stadium', 'Olympic village & venues', 1, 6]],
  scenes: [['Sales tax for the arena district', 'The state let Salt Lake raise sales taxes for an arena district.', [['Approve it', { cost: -0.002, pw: { miller: 10 }, app: -1 }, 'The NHL team stays downtown.'], ['Refuse', { pw: { miller: -10 } }, 'The team considers the suburbs.']]]],
});

cityDef('Honolulu|HI', {
  blurb: 'A rail line years late and billions over budget, the highest homelessness rate per capita and a military that owns much of the land.',
  powers: [['hotels', 'Waikiki hotels', 'The visitor economy.', { lean: -0.1, ind: 'tourism' }]],
  megas: [['transit', 'Skyline rail to Civic Center', 10, 6], ['housing', 'Kauhale tiny home villages', 0.1, 2]],
  scenes: [['Rail overruns', 'The rail line is $12 billion and counting.', [['Finish it', { cost: 0.006, cr: { infra: -2 } }, 'Trains reach downtown.'], ['Stop at Civic Center', { pw: { hotels: -3 } }, 'Ala Moana waits.']]]],
});

cityDef('Anchorage|AK', {
  blurb: 'Half of Alaska\'s population, with a port falling into the inlet and a homelessness crisis in a subarctic climate.',
  powers: [['port', 'Port of Alaska', 'Nearly all of Alaska\'s goods arrive here.', { lean: 0.2, ind: 'logistics' }]],
  megas: [['port', 'Port of Alaska modernization', 2, 6], ['housing', 'Winter shelter capacity', 0.05, 1]],
  scenes: [['Winter shelter', 'With temperatures below zero, hundreds of people have nowhere to sleep.', [['Open a mass shelter in a sports arena', { cost: 0.002, cr: { homeless: -2 } }, 'Lives saved.'], ['Navigation center only', { cr: { homeless: -1 } }, 'Many sleep outside.']]]],
});

cityDef('Birmingham|AL', {
  blurb: 'Civil rights history, UAB medicine and a homicide rate among the highest in the country.',
  powers: [['uab', 'UAB', 'The state\'s largest employer.', { lean: -0.3, ind: 'healthcare' }]],
  megas: [['transit', 'Birmingham Xpress bus rapid transit', 0.2, 2], ['stadium', 'Protective Stadium & district', 0.2, 2]],
  scenes: [['Homicides surge', 'The city recorded its deadliest year in decades.', [['Federal partnership and gun task force', { cost: 0.001, cr: { crime: -2 }, pw: { police: 6 } }, 'Arrests rise.'], ['Community violence interrupters', { cost: 0.001, cr: { crime: -1 } }, 'Neighborhood groups expand.']]]],
});

cityDef('Jackson|MS', {
  blurb: 'A majority-Black capital that lost its water system to a federal manager and a fifth of its population.',
  powers: [['churches', 'Black churches', 'The city\'s civic backbone.', { lean: -0.8 }]],
  megas: [['water', 'Water treatment plant rebuild', 1, 5], ['housing', 'Downtown revitalization', 0.1, 3]],
  scenes: [['The state takes over the airport', 'The legislature tried to seize the airport and create a separate court district.', [['Fight it in court', { pp: -4, pw: { churches: 8 } }, 'A court blocks it.'], ['Negotiate', { pw: { churches: -6 } }, 'You lose control of the airport.']]]],
});

cityDef('Omaha|NE', {
  blurb: 'Warren Buffett, Union Pacific and the College World Series, building its first streetcar.',
  powers: [['buffett', 'Omaha business leaders', 'Berkshire and the Heritage Omaha philanthropists.', { lean: 0.3 }]],
  megas: [['transit', 'Omaha streetcar', 0.4, 4], ['park', 'RiverFront revitalization', 0.3, 3]],
  scenes: [['Streetcar costs', 'The streetcar is over budget.', [['Keep building with TIF money', { cost: 0.001, pw: { buffett: 4 } }, 'The line opens on time.'], ['Scale it back', { pw: { buffett: -4 } }, 'A shorter line.']]]],
});

cityDef('Buffalo|NY', {
  blurb: 'A new Bills stadium funded by the state, blizzards that kill, and East Side neighborhoods still recovering from the 2022 Tops massacre.',
  powers: [['bills', 'Bills fans & ownership', 'The heart of Western New York.', { lean: 0.2 }]],
  megas: [['stadium', 'New Highmark Stadium', 1.7, 3], ['highway', 'Kensington Expressway cap', 1, 6]],
  scenes: [['A killer blizzard', 'A blizzard trapped motorists and killed dozens.', [['Emergency driving ban and response overhaul', { cost: 0.001, cr: { disaster: -2 }, app: 1 }, 'Ready for the next storm.'], ['Status quo', { cr: { disaster: 1 } }, 'Critics demand answers.']]]],
});

cityDef('Newark|NJ', {
  blurb: 'Replaced every lead service line in under three years, home to a busy airport and port, with Prudential and Panasonic downtown.',
  powers: [['airport', 'Newark airport & port', 'Air traffic control meltdowns and port jobs.', { lean: -0.3, ind: 'logistics' }]],
  megas: [['airport', 'Newark Terminal A & air traffic upgrades', 2.7, 3], ['housing', 'Downtown affordable housing', 0.2, 3]],
  scenes: [['Air traffic meltdown', 'Radar outages snarled flights at Newark for weeks.', [['Demand FAA action', { pp: -4, app: 1 }, 'The FAA adds staff.'], ['Push to privatize air traffic control', { pw: { airport: 3 }, app: -1 }, 'Unions object.']]]],
});

cityDef('Providence|RI', {
  blurb: 'Brown and RISD, a rebuilt downtown and one of the highest property taxes in New England.',
  powers: [['brown', 'Brown University', 'Pays voluntary PILOTs.', { lean: -0.6, ind: 'education' }]],
  megas: [['park', 'I-195 District redevelopment', 0.3, 4]],
  scenes: [['Brown\'s tax payments', 'Brown pays a fraction of what it would owe in property taxes.', [['Push for a bigger PILOT', { pp: -4, pw: { brown: -6 }, cost: -0.003 }, 'Brown agrees to pay more.'], ['Leave it alone', {}, 'Nothing changes.']]]],
});

cityDef('Boise|ID', {
  blurb: 'One of the fastest-growing cities in America, with Micron\'s fab and Californians driving up home prices.',
  powers: [['micron', 'Micron', 'The giant fab south of downtown.', { lean: 0.2, ind: 'tech' }]],
  megas: [['fab', 'Micron fab utilities', 0.5, 4], ['housing', 'Missing-middle housing', 0.1, 3]],
  scenes: [['The legislature limits city taxes', 'The state legislature capped local property tax growth.', [['Cut services', { cr: { infra: 1 } }, 'Parks hours shrink.'], ['Lobby for local option taxes', { pp: -6 }, 'A long shot.']]]],
});

cityDef('Fort Worth|TX', {
  blurb: 'Cowtown is booming, passing San Francisco in population, with sprawl stretching to the Panther Island flood project.',
  powers: [['ranchers', 'Old Fort Worth money', 'The Basses and the ranching families.', { lean: 0.6 }]],
  megas: [['flood', 'Panther Island flood control', 1.2, 6], ['transit', 'TEXRail extension', 0.3, 3]],
  scenes: [['Panther Island stalls', 'Federal funding for the Trinity River flood project was delayed for years.', [['Local bonds to finish it', { cost: 0.003, cr: { disaster: -2 } }, 'The channel opens.'], ['Wait for Washington', { cr: { disaster: 1 } }, 'Developers wait too.']]]],
});

cityDef('El Paso|TX', {
  blurb: 'A border city of crossings and migrant shelters, Fort Bliss and some of the cleanest-run budgets in Texas.',
  powers: [['bliss', 'Fort Bliss', 'One of the Army\'s largest installations.', { lean: 0.2, ind: 'defense' }]],
  megas: [['water', 'Kay Bailey Hutchison desalination expansion', 0.15, 3], ['arena', 'Downtown arena (stalled)', 0.18, 3]],
  scenes: [['Migrants sleeping downtown', 'Hundreds of migrants are sleeping on the streets around Sacred Heart Church.', [['Open city shelters', { cost: 0.002, cr: { homeless: -2 }, app: -1 }, 'Federal reimbursements follow.'], ['Bus migrants onward', { cost: 0.001, pw: { press: -4 } }, 'Other cities complain.']]]],
});

cityDef('Sacramento|CA', {
  blurb: 'The capital, with a downtown hurt by remote state workers, the Kings\' arena and homelessness along the American River.',
  powers: [['stateworkers', 'State workers', 'Return-to-office fights.', { lean: -0.6 }]],
  megas: [['housing', 'Railyards redevelopment', 1, 6], ['flood', 'American River levee improvements', 1.8, 8]],
  scenes: [['Return to office', 'The governor ordered state workers back four days a week. Downtown businesses are thrilled.', [['Support it', { pw: { stateworkers: -10, business: 6 } }, 'Downtown fills up.'], ['Push for hybrid', { pw: { stateworkers: 8, business: -4 } }, 'Downtown stays quiet.']]]],
});

cityDef('Oakland|CA', {
  blurb: 'Lost the A\'s, the Warriors and the Raiders; faces a budget crisis, a recalled mayor and car break-ins on every corner.',
  powers: [['port', 'Port of Oakland', 'A major Pacific gateway.', { lean: -0.4, ind: 'logistics' }]],
  megas: [['stadium', 'Coliseum site redevelopment', 1, 6], ['transit', 'Oakland Alameda Access', 0.4, 4]],
  scenes: [['A budget hole and no teams', 'Oakland faces a $130 million deficit after the Coliseum sale fell through.', [['Layoffs and closed fire stations', { cost: -0.02, cr: { crime: 1 }, pw: { labor: -8 } }, 'Brownouts at fire stations.'], ['Sales tax measure', { cost: -0.015, app: -1 }, 'Voters approve it.']]]],
});

cityDef('Albuquerque|NM', {
  blurb: 'Breaking Bad tourism, Sandia Labs, Netflix studios and a struggle with property crime and homelessness.',
  powers: [['netflix', 'Netflix & NBCUniversal studios', 'Film tax credits made Albuquerque a production hub.', { lean: -0.3, ind: 'tourism' }]],
  megas: [['housing', 'Gateway Center homeless shelter', 0.1, 2], ['transit', 'ART bus rapid transit upgrades', 0.1, 2]],
  scenes: [['Gateway Center', 'A large shelter is opening in a former hospital. Neighbors object.', [['Open it', { cost: 0.001, cr: { homeless: -2 } }, 'Hundreds of beds.'], ['Disperse to smaller sites', { cost: 0.0015, cr: { homeless: -1 } }, 'Slower progress.']]]],
});

cityDef('Tucson|AZ', {
  blurb: 'A university town in the desert with Raytheon missiles, water scarcity and a plan to plant a million trees.',
  powers: [['raytheon', 'Raytheon Missiles & Defense', 'Tucson\'s largest private employer.', { lean: 0.1, ind: 'defense' }]],
  megas: [['water', 'Recharge & recycled water program', 0.3, 4], ['park', 'Tucson Million Trees', 0.05, 5]],
  scenes: [['Raytheon wants to expand', 'Raytheon wants land near the airport for a new missile plant.', [['Approve the land deal', { jobs: 2, pw: { raytheon: 8 } }, 'Jobs and controversy.'], ['Require community benefits', { pw: { raytheon: -2 } }, 'Talks continue.']]]],
});

cityDef('Richmond|VA', {
  blurb: 'Removed its Confederate monuments, lost its water system twice in 2025 and is betting on a new ballpark district.',
  powers: [['vcu', 'VCU Health', 'The city\'s biggest employer.', { lean: -0.4, ind: 'healthcare' }]],
  megas: [['water', 'Water treatment plant overhaul', 0.4, 3], ['stadium', 'Diamond District ballpark', 0.2, 2]],
  scenes: [['The water plant failed', 'A power failure at the treatment plant left 230,000 people under a boil notice.', [['Fire the director and rebuild', { cost: 0.002, cr: { water: -3 }, ag: { water: { eff: 6 } } }, 'Backup power is installed.'], ['Commission a report', { app: -2 }, 'It happens again.']]]],
});

cityDef('Des Moines|IA', {
  blurb: 'Insurance capital and political crossroads, with water utility fights over farm runoff.',
  powers: [['insurers', 'Insurance companies', 'Principal and the insurers.', { lean: 0.2, ind: 'finance' }]],
  megas: [['water', 'Nitrate removal expansion', 0.15, 2], ['stadium', 'USL soccer stadium', 0.1, 2]],
  scenes: [['Lawn watering ban', 'The water utility banned lawn watering because of nitrate levels.', [['Sue upstream counties', { pp: -4, pw: { farm: -6 }, cr: { water: -1 } }, 'The fight goes statewide.'], ['Build more treatment', { cost: 0.002, cr: { water: -2 } }, 'Water bills rise.']]]],
});

cityDef('Spokane|WA', {
  blurb: 'Eastern Washington\'s hub, with a downtown homeless camp that became a statewide flashpoint.',
  powers: [['downtown', 'Downtown Spokane Partnership', 'Business owners.', { lean: 0.3 }]],
  megas: [['housing', 'Trent Resource and Assistance Center', 0.05, 1]],
  scenes: [['Camp Hope', 'The largest homeless camp in the state sits on state land next to the freeway.', [['Clear it with shelter offers', { cost: 0.001, cr: { homeless: -1 }, pw: { downtown: 8 } }, 'The camp closes.'], ['Work with the state on housing first', { cost: 0.002, cr: { homeless: -2 } }, 'Slow but steady.']]]],
});
