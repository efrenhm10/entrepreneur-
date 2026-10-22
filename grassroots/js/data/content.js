// Characters, offices, leadership, committees, staff and interest groups.
var GR = globalThis.GR || (globalThis.GR = {});

GR.PARTIES = {
  D: { k: 'D', name: 'Democratic', noun: 'Democrat', base: -1.05, color: 'var(--dem)' },
  R: { k: 'R', name: 'Republican', noun: 'Republican', base: 1.1, color: 'var(--rep)' },
};
GR.other = (p) => (p === 'D' ? 'R' : 'D');

GR.NAMES = {
  m: ['James', 'Michael', 'Robert', 'John', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Andrew', 'Paul', 'Joshua', 'Kevin', 'Brian', 'Ryan', 'Jacob', 'Gary', 'Eric', 'Jonathan', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Gregory', 'Patrick', 'Raymond', 'Dennis', 'Tyler', 'Aaron', 'Jose', 'Adam', 'Nathan', 'Henry', 'Zachary', 'Kyle', 'Carlos', 'Marcus', 'Luis', 'Jamal', 'Darnell', 'Wei', 'Raj', 'Miguel', 'Terrence', 'Caleb', 'Wyatt', 'Colton', 'Hunter', 'Dale', 'Wade', 'Trent', 'Andre', 'Hector'],
  f: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Laura', 'Sharon', 'Cynthia', 'Amy', 'Angela', 'Rachel', 'Katherine', 'Christine', 'Maria', 'Heather', 'Diane', 'Julie', 'Olivia', 'Megan', 'Hannah', 'Grace', 'Rosa', 'Keisha', 'Tamika', 'Mei', 'Priya', 'Lucia', 'Yolanda', 'Brittany', 'Kayla', 'Tammy', 'Shelby', 'Dana', 'Claire', 'Monica', 'Gloria', 'Natalie', 'Vanessa', 'Alicia', 'Erin', 'Paige'],
  l: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Phillips', 'Evans', 'Turner', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Morris', 'Murphy', 'Cook', 'Rogers', 'Morgan', 'Cooper', 'Peterson', 'Reed', 'Bailey', 'Bell', 'Kelly', 'Howard', 'Ward', 'Cox', 'Richardson', 'Wood', 'Watson', 'Brooks', 'Bennett', 'Gray', 'James', 'Hughes', 'Price', 'Sanders', 'Myers', 'Long', 'Ross', 'Foster', 'Powell', 'Jenkins', 'Perry', 'Russell', 'Sullivan', 'Fisher', 'Henderson', 'Coleman', 'Patterson', 'Jordan', 'Reynolds', 'Hamilton', 'Graham', 'Wallace', 'Hayes', 'Bryant', 'Gibson', 'Ellis', 'Stevens', 'Murray', 'Ford', 'Marshall', 'Owens', 'McDonald', 'Kennedy', 'Wells', 'Vargas', 'Castillo', 'Patel', 'Shah', 'Kim', 'Chen', 'Park', "O'Brien", 'Schultz', 'Novak', 'Lindqvist', 'Whitaker', 'Holloway', 'Pruitt', 'Calloway', 'Delgado', 'Fontaine', 'Mercer', 'Abbott', 'Whitfield', 'Crane', 'Blackwell'],
};

GR.UPBRINGING = [
  { k: 'poor', name: 'Working poor', desc: 'Grew up in a struggling household. Voters connect with your story, but you start broke.', money: 500, debtF: 1.2, network: 2, skill: { grass: 8 }, story: 'raised by a single parent who worked two jobs' },
  { k: 'working', name: 'Working class', desc: 'Union household, hard work, modest means.', money: 4000, debtF: 1.0, network: 4, skill: { grass: 5 }, story: 'raised in a working-class family' },
  { k: 'middle', name: 'Middle class', desc: 'A comfortable suburban upbringing.', money: 15000, debtF: 0.8, network: 6, skill: {}, story: 'raised in a middle-class suburb' },
  { k: 'upper', name: 'Upper middle class', desc: 'Professional parents, good schools, connections.', money: 60000, debtF: 0.4, network: 10, skill: { fund: 4 }, story: 'raised by professional parents' },
  { k: 'wealthy', name: 'Wealthy family', desc: 'Family money and a donor network. Some voters will call you out of touch.', money: 450000, debtF: 0, network: 18, skill: { fund: 8 }, fav: -6, story: 'born into a wealthy family' },
  { k: 'political', name: 'Political family', desc: 'A parent held office. Your surname opens doors and carries baggage.', money: 40000, debtF: 0.5, network: 14, rec: 10, party: 12, skill: { charisma: 3 }, story: 'raised in a political family' },
];

GR.EDUCATION = [
  { k: 'hs', name: 'High school diploma', lvl: 0, years: 0, debt: 0, skill: {} },
  { k: 'assoc', name: "Associate's degree", lvl: 1, years: 2, debt: 9000, skill: { policy: 2 } },
  { k: 'ba', name: "Bachelor's degree", lvl: 2, years: 4, debt: 29000, skill: { policy: 5, debate: 2 } },
  { k: 'ma', name: "Master's degree (MPA/MPP)", lvl: 3, years: 6, debt: 55000, skill: { policy: 10, debate: 3 } },
  { k: 'jd', name: 'Law degree (JD)', lvl: 3, years: 7, debt: 120000, skill: { policy: 9, debate: 9 } },
  { k: 'mba', name: 'MBA', lvl: 3, years: 6, debt: 90000, skill: { policy: 5, fund: 8 } },
  { k: 'md', name: 'Medical degree (MD)', lvl: 4, years: 8, debt: 200000, skill: { policy: 10 } },
  { k: 'phd', name: 'Doctorate (PhD)', lvl: 4, years: 9, debt: 30000, skill: { policy: 15, debate: 3 } },
];
GR.EDU = {}; GR.EDUCATION.forEach((e) => { GR.EDU[e.k] = e; });

// salary: $k/yr at US-average costs. edu: education keys allowed (empty = any).
GR.JOBS = [
  { k: 'retail', name: 'Retail manager', salary: 48, edu: [], skill: { grass: 3 }, network: 1, lean: 0 },
  { k: 'trades', name: 'Union electrician', salary: 68, edu: [], skill: { grass: 6 }, network: 3, lean: 0.2, union: true },
  { k: 'farmer', name: 'Farmer / rancher', salary: 55, edu: [], skill: { grass: 5 }, network: 3, lean: 0.6 },
  { k: 'police', name: 'Police officer', salary: 70, edu: [], skill: { grass: 4, debate: 2 }, network: 3, lean: 0.4, fav: 3 },
  { k: 'firefighter', name: 'Firefighter', salary: 62, edu: [], skill: { grass: 5 }, network: 3, lean: 0.1, fav: 6 },
  { k: 'veteran', name: 'Military veteran', salary: 58, edu: [], skill: { charisma: 4, grass: 3 }, network: 4, lean: 0.3, fav: 7 },
  { k: 'smallbiz', name: 'Small business owner', salary: 75, edu: [], skill: { fund: 6, charisma: 3 }, network: 6, lean: 0.3 },
  { k: 'realtor', name: 'Real estate agent', salary: 65, edu: [], skill: { fund: 5, charisma: 4 }, network: 6, lean: 0.2 },
  { k: 'pastor', name: 'Pastor / faith leader', salary: 52, edu: [], skill: { charisma: 8, grass: 4 }, network: 5, lean: 0.3, fav: 4 },
  { k: 'organizer', name: 'Community organizer', salary: 45, edu: [], skill: { grass: 10, charisma: 2 }, network: 4, lean: -0.5 },
  { k: 'nurse', name: 'Nurse', salary: 82, edu: ['assoc', 'ba', 'ma'], skill: { grass: 3, policy: 2 }, network: 2, lean: -0.1, fav: 5 },
  { k: 'teacher', name: 'Public school teacher', salary: 60, edu: ['ba', 'ma', 'phd'], skill: { debate: 3, policy: 4 }, network: 3, lean: -0.3, union: true, fav: 3 },
  { k: 'journalist', name: 'Journalist', salary: 58, edu: ['ba', 'ma'], skill: { debate: 5, policy: 3 }, network: 5, lean: -0.2, rec: 6 },
  { k: 'engineer', name: 'Software engineer', salary: 135, edu: ['ba', 'ma', 'phd', 'mba'], skill: { policy: 4 }, network: 3, lean: -0.2 },
  { k: 'staffer', name: 'Legislative staffer', salary: 62, edu: ['ba', 'ma', 'jd'], skill: { policy: 8, fund: 3 }, network: 9, lean: 0, party: 10 },
  { k: 'nonprofit', name: 'Nonprofit director', salary: 78, edu: ['ba', 'ma', 'mba', 'phd'], skill: { fund: 6, grass: 4 }, network: 6, lean: -0.3 },
  { k: 'lawyer', name: 'Attorney', salary: 150, edu: ['jd'], skill: { debate: 8, fund: 4 }, network: 8, lean: 0 },
  { k: 'prosecutor', name: 'Prosecutor', salary: 98, edu: ['jd'], skill: { debate: 10 }, network: 6, lean: 0.2, fav: 3 },
  { k: 'defender', name: 'Public defender', salary: 85, edu: ['jd'], skill: { debate: 9, grass: 2 }, network: 4, lean: -0.4 },
  { k: 'exec', name: 'Corporate executive', salary: 260, edu: ['ba', 'mba', 'jd', 'ma'], skill: { fund: 12 }, network: 12, lean: 0.4, fav: -3 },
  { k: 'doctor', name: 'Physician', salary: 260, edu: ['md'], skill: { policy: 6 }, network: 7, lean: 0, fav: 6 },
  { k: 'professor', name: 'Professor', salary: 105, edu: ['phd'], skill: { policy: 10, debate: 4 }, network: 4, lean: -0.6 },
  { k: 'consultant', name: 'Political consultant', salary: 95, edu: ['ba', 'ma', 'mba', 'jd'], skill: { fund: 6, debate: 3, charisma: 2 }, network: 10, lean: 0, party: 8 },
  { k: 'tvhost', name: 'Local TV personality', salary: 90, edu: [], skill: { charisma: 12 }, network: 6, lean: 0, rec: 18 },
  { k: 'unemployed', name: 'Between jobs', salary: 0, edu: [], skill: {}, network: 0, lean: 0 },
];
GR.JOB = {}; GR.JOBS.forEach((j) => { GR.JOB[j.k] = j; });

GR.SKILLS = [
  { k: 'charisma', name: 'Charisma', desc: 'Rallies, media and first impressions.' },
  { k: 'debate', name: 'Debate', desc: 'Debates, interviews and floor speeches.' },
  { k: 'policy', name: 'Policy', desc: 'Writing bills, committee work and budgets.' },
  { k: 'fund', name: 'Fundraising', desc: 'Donor calls and fundraisers.' },
  { k: 'grass', name: 'Grassroots', desc: 'Canvassing, volunteers and turnout.' },
];

// Offices from the bottom to the top. jur: which government. body: legislative chamber key.
GR.OFFICES = {
  school: { k: 'school', name: 'School Board Member', short: 'School Board', jur: 'school', body: 'school', level: 1, term: 4, cycle: 'odd', minAge: 18, tier: 'local' },
  council: { k: 'council', name: 'City Council Member', short: 'City Council', jur: 'city', body: 'council', level: 2, term: 4, cycle: 'odd', minAge: 18, tier: 'local' },
  mayor: { k: 'mayor', name: 'Mayor', short: 'Mayor', jur: 'city', exec: true, level: 3, term: 4, cycle: 'odd', minAge: 21, tier: 'local' },
  statehouse: { k: 'statehouse', name: 'State Representative', short: 'State House', jur: 'state', body: 'house', level: 3, term: 2, cycle: 'even', minAge: 21, tier: 'local' },
  statesenate: { k: 'statesenate', name: 'State Senator', short: 'State Senate', jur: 'state', body: 'senate', level: 4, term: 4, cycle: 'stsen', minAge: 25, tier: 'local' },
  ushouse: { k: 'ushouse', name: 'U.S. Representative', short: 'U.S. House', jur: 'nation', body: 'ushouse', level: 5, term: 2, cycle: 'even', minAge: 25, tier: 'local', salary: 174000, fullTime: true },
  governor: { k: 'governor', name: 'Governor', short: 'Governor', jur: 'state', exec: true, level: 7, term: 4, cycle: 'gov', minAge: 30, tier: 'state', fullTime: true },
  ussenate: { k: 'ussenate', name: 'U.S. Senator', short: 'U.S. Senate', jur: 'nation', body: 'ussenate', level: 7, term: 6, cycle: 'class', minAge: 30, tier: 'state', salary: 174000, fullTime: true },
  president: { k: 'president', name: 'President of the United States', short: 'President', jur: 'nation', exec: true, level: 9, term: 4, cycle: 'pres', minAge: 35, tier: 'national', salary: 400000, fullTime: true },
};
GR.OFFICE_ORDER = ['school', 'council', 'mayor', 'statehouse', 'statesenate', 'ushouse', 'governor', 'ussenate', 'president'];

GR.BODIES = {
  school: { k: 'school', name: 'School Board', jur: 'school', member: 'Board Member' },
  council: { k: 'council', name: 'City Council', jur: 'city', member: 'Council Member' },
  house: { k: 'house', name: 'State House', jur: 'state', member: 'Representative' },
  senate: { k: 'senate', name: 'State Senate', jur: 'state', member: 'Senator' },
  ushouse: { k: 'ushouse', name: 'U.S. House', jur: 'nation', member: 'Representative' },
  ussenate: { k: 'ussenate', name: 'U.S. Senate', jur: 'nation', member: 'Senator' },
};

// Leadership posts. side: maj/min/any. rank orders the ladder. sen: terms served needed.
GR.LEADERSHIP = {
  house: [
    { k: 'speaker', name: 'Speaker of the House', side: 'maj', rank: 5, sen: 3, inf: 40 },
    { k: 'majleader', name: 'Majority Leader', side: 'maj', rank: 4, sen: 3, inf: 30 },
    { k: 'majwhip', name: 'Majority Whip', side: 'maj', rank: 3, sen: 2, inf: 22 },
    { k: 'majasst', name: 'Assistant Majority Whip', side: 'maj', rank: 1, sen: 1, inf: 10 },
    { k: 'majcaucus', name: 'Majority Caucus Chair', side: 'maj', rank: 2, sen: 2, inf: 14 },
    { k: 'minleader', name: 'Minority Leader', side: 'min', rank: 4, sen: 3, inf: 26 },
    { k: 'minwhip', name: 'Minority Whip', side: 'min', rank: 3, sen: 2, inf: 18 },
    { k: 'minasst', name: 'Assistant Minority Whip', side: 'min', rank: 1, sen: 1, inf: 8 },
    { k: 'mincaucus', name: 'Minority Caucus Chair', side: 'min', rank: 2, sen: 2, inf: 12 },
  ],
  senate: [
    { k: 'protem', name: 'President pro Tempore', side: 'maj', rank: 5, sen: 2, inf: 36 },
    { k: 'majleader', name: 'Majority Leader', side: 'maj', rank: 4, sen: 2, inf: 34 },
    { k: 'majwhip', name: 'Majority Whip', side: 'maj', rank: 3, sen: 1, inf: 20 },
    { k: 'majasst', name: 'Assistant Majority Whip', side: 'maj', rank: 1, sen: 1, inf: 10 },
    { k: 'minleader', name: 'Minority Leader', side: 'min', rank: 4, sen: 2, inf: 28 },
    { k: 'minwhip', name: 'Minority Whip', side: 'min', rank: 3, sen: 1, inf: 18 },
    { k: 'minasst', name: 'Assistant Minority Whip', side: 'min', rank: 1, sen: 1, inf: 8 },
  ],
  council: [
    { k: 'president', name: 'Council President', side: 'maj', rank: 3, sen: 1, inf: 30 },
    { k: 'vice', name: 'Council Vice President', side: 'any', rank: 1, sen: 0, inf: 12 },
  ],
  school: [
    { k: 'president', name: 'Board President', side: 'maj', rank: 3, sen: 1, inf: 30 },
    { k: 'vice', name: 'Board Vice President', side: 'any', rank: 1, sen: 0, inf: 12 },
  ],
};
GR.LEADERSHIP.ushouse = GR.LEADERSHIP.house.map((x) => ({ ...x, sen: x.sen + 1 }));
GR.LEADERSHIP.ussenate = GR.LEADERSHIP.senate.map((x) => ({ ...x, sen: x.sen + (x.k === 'protem' ? 3 : 0) }));

// Committees. cats: policy categories they handle. Budget bills go to Appropriations.
GR.COMMITTEES = {
  state: [
    { k: 'approp', name: 'Appropriations', cats: ['Budget'], tier: 'A' },
    { k: 'ways', name: 'Ways & Means', cats: ['Taxes'], tier: 'A' },
    { k: 'commerce', name: 'Commerce & Labor', cats: ['Economy'], tier: 'B' },
    { k: 'health', name: 'Health & Human Services', cats: ['Health'], tier: 'B' },
    { k: 'judiciary', name: 'Judiciary', cats: ['Justice', 'Guns', 'Social'], tier: 'B' },
    { k: 'education', name: 'Education', cats: ['Education'], tier: 'B' },
    { k: 'environment', name: 'Environment & Energy', cats: ['Environment'], tier: 'B' },
    { k: 'housing', name: 'Housing & Transportation', cats: ['Housing'], tier: 'B' },
    { k: 'stateaffairs', name: 'State Affairs & Elections', cats: ['Elections', 'Immigration'], tier: 'C' },
  ],
  nation: [
    { k: 'approp', name: 'Appropriations', cats: ['Budget'], tier: 'A' },
    { k: 'ways', name: 'Ways & Means', cats: ['Taxes', 'Economy'], tier: 'A' },
    { k: 'energy', name: 'Energy & Commerce', cats: ['Environment', 'Health'], tier: 'A' },
    { k: 'judiciary', name: 'Judiciary', cats: ['Justice', 'Guns', 'Social', 'Immigration'], tier: 'B' },
    { k: 'armed', name: 'Armed Services', cats: ['Defense'], tier: 'B' },
    { k: 'education', name: 'Education & Workforce', cats: ['Education'], tier: 'B' },
    { k: 'homeland', name: 'Homeland Security', cats: ['Immigration'], tier: 'B' },
    { k: 'transport', name: 'Transportation & Infrastructure', cats: ['Housing'], tier: 'B' },
    { k: 'admin', name: 'Administration & Elections', cats: ['Elections'], tier: 'C' },
  ],
  city: [
    { k: 'budget', name: 'Budget & Finance', cats: ['Budget', 'Taxes'], tier: 'A' },
    { k: 'safety', name: 'Public Safety', cats: ['Justice', 'Immigration'], tier: 'B' },
    { k: 'land', name: 'Land Use & Housing', cats: ['Housing', 'Economy'], tier: 'B' },
    { k: 'rules', name: 'Rules & Government', cats: ['Elections', 'Environment'], tier: 'C' },
  ],
  school: [
    { k: 'finance', name: 'Finance', cats: ['Budget'], tier: 'A' },
    { k: 'curriculum', name: 'Curriculum & Instruction', cats: ['Education', 'Social', 'Health'], tier: 'B' },
  ],
};
// Chamber-specific committee names (the U.S. Senate and state senates use their own).
GR.COMMITTEE_NAMES = {
  senate: { ways: 'Finance' },
  ussenate: { ways: 'Finance', energy: 'Commerce, Science & Transportation', education: 'Health, Education, Labor & Pensions', transport: 'Environment & Public Works', homeland: 'Homeland Security & Governmental Affairs', admin: 'Rules & Administration' },
};
// Real committee sizes in Congress (118th/119th); state and local sizes scale with the chamber.
GR.COMMITTEE_SIZE = {
  ushouse: { approp: 61, ways: 43, energy: 52, judiciary: 26, armed: 59, education: 45, homeland: 33, transport: 67, admin: 9 },
  ussenate: { approp: 29, ways: 28, energy: 28, judiciary: 21, armed: 27, education: 21, homeland: 15, transport: 19, admin: 17 },
};
// Committee assignments per member (everyone can sit on at least two), and how many of them
// may be exclusive (tier A) panels like Appropriations or Ways & Means.
GR.COMMITTEE_SLOTS = { school: 2, council: 2, house: 2, senate: 3, ushouse: 2, ussenate: 3 };
GR.COMMITTEE_MAX_A = { school: 1, council: 1, house: 1, senate: 2, ushouse: 1, ussenate: 2 };
GR.COMMITTEE_TIERS = { A: { name: 'Exclusive', frac: 0.3 }, B: { name: 'Major', frac: 0.17 }, C: { name: 'Minor', frac: 0.1 } };

GR.STAFF = [
  { k: 'manager', name: 'Campaign Manager', desc: '+1 action per week and +10% to every campaign action.', cost: 0.0045, min: 120 },
  { k: 'finance', name: 'Finance Director', desc: '+35% from donor calls and fundraisers.', cost: 0.0035, min: 90 },
  { k: 'field', name: 'Field Director', desc: '+40% from canvassing and volunteer offices.', cost: 0.003, min: 80 },
  { k: 'comms', name: 'Communications Director', desc: '+30% from media, fewer gaffes, better ad response.', cost: 0.003, min: 80 },
  { k: 'pollster', name: 'Pollster', desc: 'Accurate internal polls every two weeks at no extra cost.', cost: 0.002, min: 60 },
  { k: 'digital', name: 'Digital Director', desc: '+35% from digital ads and small-dollar online donations.', cost: 0.0025, min: 60 },
];

GR.ADS = [
  { k: 'tv', name: 'TV', eff: 1.0, minScale: 200000 },
  { k: 'radio', name: 'Radio', eff: 0.7, minScale: 0 },
  { k: 'digital', name: 'Digital', eff: 0.85, minScale: 0 },
  { k: 'mail', name: 'Direct mail', eff: 0.8, minScale: 0 },
];

// Interest groups. care: { policy: preferred direction (-1 left, +1 right) }.
GR.GROUPS = [
  { k: 'labor', name: 'State Federation of Labor', care: { unions: -1, minwage: -1, paidleave: -1, trade: 1 }, w: 1.2, money: 1 },
  { k: 'teachers', name: 'Education Association (teachers)', care: { teacherpay: -1, schoolchoice: -1 }, w: 1.1, money: 0.8 },
  { k: 'chamber', name: 'Chamber of Commerce', care: { corptax: 1, minwage: 1, unions: 1, trade: -1 }, w: 1.1, money: 1.6 },
  { k: 'smallbiz', name: 'Small Business Federation', care: { minwage: 1, incometax: 1, paidleave: 1 }, w: 0.8, money: 0.8 },
  { k: 'farm', name: 'Farm Bureau', care: { trade: -1, drilling: 1, estatetax: 1 }, w: 0.8, money: 0.7, rural: true },
  { k: 'gunrights', name: 'Gun Owners Association', care: { assaultweapons: 1, carry: 1, background: 1 }, w: 1.1, money: 0.9 },
  { k: 'gunsafety', name: 'Moms for Gun Safety', care: { assaultweapons: -1, background: -1, carry: -1 }, w: 0.9, money: 0.8 },
  { k: 'environment', name: 'League of Conservation Voters', care: { carbon: -1, renewables: -1, drilling: -1, evs: -1 }, w: 0.9, money: 1 },
  { k: 'energy', name: 'Energy Producers Alliance', care: { drilling: 1, carbon: 1, renewables: 1 }, w: 0.8, money: 1.5 },
  { k: 'police', name: 'Fraternal Order of Police', care: { police: 1, bail: 1, sentencing: 1 }, w: 1.0, money: 0.6 },
  { k: 'choice', name: 'Reproductive Freedom PAC', care: { abortion: -1 }, w: 1.0, money: 1 },
  { k: 'life', name: 'Right to Life Committee', care: { abortion: 1 }, w: 1.0, money: 0.8 },
  { k: 'taxpayers', name: 'Taxpayers League', care: { incometax: 1, propertytax: 1, corptax: 1, welfare: 1 }, w: 0.9, money: 1.1 },
  { k: 'immigrants', name: 'Immigrant Rights Coalition', care: { citizenship: -1, sanctuary: -1, border: -1 }, w: 0.7, money: 0.5 },
  { k: 'border', name: 'Secure Borders Coalition', care: { border: 1, sanctuary: 1, citizenship: 1 }, w: 0.7, money: 0.5 },
  { k: 'seniors', name: 'Retirees Association', care: { socsec: -1, drugprices: -1 }, w: 1.0, money: 0.6 },
  { k: 'parents', name: 'Parents for Education Freedom', care: { schoolchoice: 1, curriculum: 1 }, w: 0.8, money: 0.7 },
  { k: 'veterans', name: 'Veterans of Foreign Wars Post', care: { defense: 1 }, w: 0.7, money: 0.3, neutral: true },
  { k: 'paper', name: 'Local newspaper editorial board', care: {}, w: 1.0, money: 0, paper: true },
];
GR.GROUP = {}; GR.GROUPS.forEach((g) => { GR.GROUP[g.k] = g; });

// Platform themes a campaign can emphasize (each maps to policies voters weigh more).
GR.THEMES = [
  { k: 'economy', name: 'Jobs and the economy', cats: ['Economy', 'Taxes'] },
  { k: 'health', name: 'Health care costs', cats: ['Health'] },
  { k: 'safety', name: 'Public safety', cats: ['Justice', 'Guns'] },
  { k: 'schools', name: 'Better schools', cats: ['Education'] },
  { k: 'border', name: 'Immigration', cats: ['Immigration'] },
  { k: 'climate', name: 'Climate and energy', cats: ['Environment'] },
  { k: 'housing', name: 'Housing costs', cats: ['Housing'] },
  { k: 'values', name: 'Values and freedom', cats: ['Social'] },
  { k: 'reform', name: 'Clean up government', cats: ['Elections'] },
];
