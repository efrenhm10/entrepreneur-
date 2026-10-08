// Character-creation data: skills, origin stories, education, traits, motivations.
var G = globalThis.G || (globalThis.G = {});

G.SKILLS = {
  sales: { label: 'Sales', desc: 'Persuasion, closing deals, pitching investors.' },
  management: { label: 'Management', desc: 'Running teams, operations, keeping people.' },
  finance: { label: 'Finance', desc: 'Bookkeeping, taxes, loans, avoiding costly mistakes.' },
  tech: { label: 'Tech', desc: 'Software, websites, automation, building products.' },
  creative: { label: 'Creative', desc: 'Writing, design, branding, storytelling.' },
  craft: { label: 'Craft', desc: 'Hands-on skill: cooking, building, growing, fixing.' },
  science: { label: 'Science', desc: 'Lab work, research, formulation, data.' },
};

// Industry experience keys. Working a job or running a business in an industry builds it.
G.INDUSTRIES = {
  food: 'Food & drink', retail: 'Retail', tech: 'Technology', media: 'Publishing & media', ag: 'Agriculture',
  bio: 'Science & biotech', services: 'Services', trades: 'Trades & construction', making: 'Manufacturing',
  logistics: 'Logistics', hospitality: 'Hospitality', health: 'Health & care', realestate: 'Real estate', finance: 'Finance',
};

G.BACKGROUNDS = [
  { id: 'paycheck', name: 'Paycheck to paycheck', blurb: 'You grew up watching every dollar. Nobody is coming to bail you out, and you know it.',
    cash: 400, credit: 590, skills: { sales: 6, craft: 6 }, grit: 1.25, familyLoan: 0, ccDebt: 1800, perk: 'Stress builds 20% slower. You have been here before.' },
  { id: 'middle', name: 'Middle-class kid', blurb: 'Stable home, a little help when it counts, and parents who still ask when you will get a real job.',
    cash: 4500, credit: 690, skills: { finance: 4, management: 4 }, grit: 1, familyLoan: 12000, perk: 'Family can lend up to $12k, once.' },
  { id: 'familybiz', name: 'Family business kid', blurb: 'You spent your teens behind the counter of the family shop. You know what payroll Fridays feel like.',
    cash: 3500, credit: 670, skills: { management: 8, sales: 6, craft: 4 }, grit: 1.1, familyLoan: 20000, xpChoice: 20, perk: 'Start with 20 industry experience in a field you choose.' },
  { id: 'trust', name: 'Trust fund', blurb: 'Money was never the problem. Being taken seriously is.',
    cash: 65000, credit: 760, skills: { creative: 4, finance: 2 }, grit: 0.8, familyLoan: 120000, repPenalty: true, perk: 'Big cushion and family money. Stress hits you 25% harder.' },
  { id: 'immigrant', name: 'First-generation immigrant', blurb: 'You or your parents rebuilt a life from scratch here. You speak two languages and outwork everyone.',
    cash: 2500, credit: 640, skills: { sales: 8, craft: 6, finance: 4 }, grit: 1.3, familyLoan: 6000, network: 12, perk: 'Tight community network and 30% grit bonus.' },
  { id: 'veteran', name: 'Military veteran', blurb: 'Four years in uniform taught you logistics, leadership, and how to function on four hours of sleep.',
    cash: 9000, credit: 700, skills: { management: 12, craft: 4 }, grit: 1.25, familyLoan: 5000, veteran: true, perk: 'SBA veteran fee waivers and GI Bill tuition help.' },
  { id: 'laidoff', name: 'Laid-off corporate', blurb: 'Twelve years climbing the ladder, then a 15-minute Zoom call. You have severance and something to prove.',
    cash: 28000, credit: 735, skills: { management: 10, finance: 10, sales: 6 }, grit: 1, familyLoan: 0, retirement: 52000, minAge: 30, perk: '$52k in a 401(k) you could raid (with penalties).' },
  { id: 'farm', name: 'Farm kid', blurb: 'Up before dawn since you were nine. Weather, livestock and machinery do not scare you.',
    cash: 5000, credit: 660, skills: { craft: 14, management: 4 }, grit: 1.2, familyLoan: 15000, xp: { ag: 30 }, land: true, perk: 'Ag experience, and family land for farm businesses (no land lease).' },
  { id: 'artist', name: 'Starving artist', blurb: 'Gallery shows, open mics, and a lot of ramen. Your portfolio is great. Your credit is not.',
    cash: 800, credit: 610, skills: { creative: 18 }, grit: 1.1, familyLoan: 2000, ccDebt: 4200, perk: 'Big creative edge.' },
  { id: 'prodigy', name: 'Dropout prodigy', blurb: 'You were shipping code while your classmates were taking midterms.',
    cash: 1500, credit: 640, skills: { tech: 22 }, grit: 1, familyLoan: 3000, perk: 'Strong tech skills without a degree.' },
];

G.EDUCATION = [
  { id: 'none', name: 'No diploma / GED', debt: 0, pts: 0, skills: {} },
  { id: 'hs', name: 'High school diploma', debt: 0, pts: 3, skills: {} },
  { id: 'trade', name: 'Trade certificate', debt: 9000, pts: 6, skills: { craft: 12 }, creds: ['trade'], years: 1 },
  { id: 'assoc', name: "Associate's degree", debt: 14000, pts: 6, skills: { finance: 3, management: 3 }, years: 2 },
  { id: 'bach', name: "Bachelor's degree", debt: 29000, pts: 8, major: true, years: 4 },
  { id: 'master', name: "Master's / MBA", debt: 68000, pts: 12, major: true, skills: { management: 8, finance: 8 }, years: 6 },
  { id: 'phd', name: 'PhD', debt: 22000, pts: 14, major: true, skills: { science: 12 }, years: 9 },
];

G.MAJORS = [
  { id: 'business', name: 'Business', skills: { management: 8, finance: 8, sales: 4 } },
  { id: 'cs', name: 'Computer Science', skills: { tech: 18 } },
  { id: 'biology', name: 'Biology / Chemistry', skills: { science: 18 } },
  { id: 'english', name: 'English / Journalism', skills: { creative: 14, sales: 4 } },
  { id: 'ag', name: 'Agricultural Science', skills: { science: 8, craft: 8 }, xp: { ag: 15 } },
  { id: 'art', name: 'Art & Design', skills: { creative: 18 } },
  { id: 'engineering', name: 'Engineering', skills: { tech: 10, science: 6, craft: 4 } },
  { id: 'nursing', name: 'Nursing / Health', skills: { science: 10, management: 4 }, xp: { health: 10 } },
  { id: 'hospitality', name: 'Hospitality / Culinary', skills: { craft: 10, management: 6 }, xp: { food: 12 } },
  { id: 'finance', name: 'Finance / Accounting', skills: { finance: 18 } },
];

G.TRAITS = [
  { id: 'silver', name: 'Silver tongue', desc: '+10 Sales. Investors and customers like you.', skills: { sales: 10 } },
  { id: 'nightowl', name: 'Night owl', desc: 'Lose less health and focus on short sleep.', },
  { id: 'iron', name: 'Iron constitution', desc: 'Health recovers faster and you rarely get sick.' },
  { id: 'frugal', name: 'Frugal', desc: 'Groceries and personal spending cost 15% less.' },
  { id: 'connector', name: 'Connector', desc: 'Networking builds contacts twice as fast.' },
  { id: 'numbers', name: 'Numbers person', desc: '+10 Finance. You catch billing errors and fraud.', skills: { finance: 10 } },
  { id: 'perfectionist', name: 'Perfectionist', desc: '+8 product quality, but projects take 15% longer.' },
  { id: 'visionary', name: 'Visionary', desc: 'Better odds and terms when pitching investors.' },
  { id: 'handy', name: 'Handy', desc: '+8 Craft. Repairs and build-outs cost 20% less.', skills: { craft: 8 } },
  { id: 'calm', name: 'Steady nerves', desc: 'Stress builds 15% slower.' },
  { id: 'hyperfocus', name: 'Hyperfocus', desc: 'Some weeks you get twice as much done. Some weeks you do not.' },
  { id: 'leader', name: 'Natural leader', desc: '+8 Management. Staff morale stays higher.', skills: { management: 8 } },
];

G.FLAWS = [
  { id: 'anxious', name: 'Anxious', desc: 'Stress builds 25% faster.' },
  { id: 'impulsive', name: 'Impulsive spender', desc: 'Lifestyle costs 25% more. Occasional splurges.' },
  { id: 'stubborn', name: 'Stubborn', desc: 'You learn new skills 20% slower.' },
  { id: 'introvert', name: 'Deep introvert', desc: 'Networking is draining: it adds stress.' },
  { id: 'disorganized', name: 'Disorganized', desc: 'More paperwork mistakes, missed deadlines and fines.' },
];

G.WHYS = [
  { id: 'freedom', name: 'Freedom', desc: 'Never answer to a boss again. Scored on years self-employed and free time.' },
  { id: 'wealth', name: 'Wealth', desc: 'Generational money. Scored on peak net worth.' },
  { id: 'impact', name: 'Impact', desc: 'Change your community. Scored on jobs created and customers served.' },
  { id: 'legacy', name: 'Legacy', desc: 'Build something that outlasts you. Scored on business value and years open.' },
  { id: 'proveit', name: 'Prove them wrong', desc: 'Everyone said you would fail. Scored on revenue milestones.' },
  { id: 'mastery', name: 'Mastery', desc: 'Be the best at your craft. Scored on quality and ratings.' },
];

G.PRONOUNS = {
  they: { sub: 'they', obj: 'them', pos: 'their' },
  she: { sub: 'she', obj: 'her', pos: 'her' },
  he: { sub: 'he', obj: 'him', pos: 'his' },
};

// Course catalog. Hours are per week while enrolled.
G.COURSES = [
  { id: 'books', name: 'Read business books', cost: 60, weeks: 6, hours: 4, skills: { management: 3, finance: 2, sales: 2 } },
  { id: 'acct', name: 'Community college accounting', cost: 520, weeks: 12, hours: 6, skills: { finance: 10 } },
  { id: 'marketing', name: 'Online marketing certificate', cost: 400, weeks: 8, hours: 5, skills: { sales: 7, creative: 4, tech: 2 } },
  { id: 'bootcamp', name: 'Coding bootcamp (part-time)', cost: 13500, weeks: 24, hours: 20, skills: { tech: 28 } },
  { id: 'design', name: 'Graphic design course', cost: 900, weeks: 10, hours: 6, skills: { creative: 10, tech: 2 } },
  { id: 'servsafe', name: 'ServSafe Manager certification', cost: 180, weeks: 2, hours: 8, skills: { craft: 2 }, creds: ['servsafe'], xp: { food: 4 } },
  { id: 'culinary', name: 'Culinary night classes', cost: 3200, weeks: 16, hours: 8, skills: { craft: 12 }, xp: { food: 8 } },
  { id: 'cdl', name: 'CDL truck driving school', cost: 5500, weeks: 6, hours: 35, creds: ['cdl'], xp: { logistics: 6 } },
  { id: 'cosmo', name: 'Cosmetology school (evenings)', cost: 14000, weeks: 40, hours: 25, skills: { craft: 12, creative: 6 }, creds: ['cosmetology'], xp: { services: 10 } },
  { id: 'tradeschool', name: 'Electrical / plumbing apprenticeship program', cost: 4000, weeks: 40, hours: 15, skills: { craft: 16 }, creds: ['trade'], xp: { trades: 12 } },
  { id: 'contractor', name: 'Contractor license prep & exam', cost: 900, weeks: 8, hours: 8, creds: ['contractor'], xp: { trades: 3 }, req: { craft: 35 } },
  { id: 'realestate', name: 'Real estate license course', cost: 650, weeks: 8, hours: 10, creds: ['realestate'], skills: { sales: 3 }, xp: { realestate: 6 } },
  { id: 'cda', name: 'Child Development Associate (CDA)', cost: 450, weeks: 12, hours: 10, creds: ['cda'], xp: { health: 4 } },
  { id: 'mastergardener', name: 'Master Gardener program', cost: 250, weeks: 12, hours: 5, skills: { craft: 5, science: 3 }, xp: { ag: 8 } },
  { id: 'biolab', name: 'Lab techniques certificate', cost: 2200, weeks: 14, hours: 8, skills: { science: 12 }, xp: { bio: 6 } },
  { id: 'mba', name: 'Part-time MBA', cost: 58000, weeks: 104, hours: 15, skills: { management: 18, finance: 16, sales: 8 }, network: 30 },
  { id: 'publishing', name: 'Publishing & editing certificate', cost: 1800, weeks: 12, hours: 6, skills: { creative: 8 }, xp: { media: 8 } },
  { id: 'nabcep', name: 'Solar PV installer certification', cost: 1500, weeks: 6, hours: 10, skills: { craft: 5, tech: 3 }, creds: ['solar'], xp: { trades: 4 } },
];

G.CREDS = {
  trade: 'Licensed tradesperson', servsafe: 'ServSafe Manager', cdl: 'Commercial driver license', cosmetology: 'Cosmetology license',
  contractor: 'Contractor license', realestate: 'Real estate license', cda: 'Child Development Associate', solar: 'Solar installer certification',
};

G.FIRST_NAMES = ['Maya', 'Jordan', 'Luis', 'Priya', 'Andre', 'Sofia', 'Marcus', 'Elena', 'Darius', 'Hannah', 'Kenji', 'Aaliyah', 'Tomás', 'Grace', 'Omar', 'Riley', 'Mei', 'Jamal', 'Chloe', 'Diego', 'Fatima', 'Noah', 'Lucia', 'Ethan', 'Zoe', 'Malik', 'Ava', 'Sam', 'Nadia', 'Caleb', 'Ines', 'Theo', 'Keisha', 'Ivan', 'Rosa', 'Wes', 'Amara', 'Cole', 'Yara', 'Dev', 'June', 'Hector', 'Tess', 'Bao', 'Lena', 'Rafael', 'Quinn', 'Asha', 'Felix', 'Nora'];
G.LAST_NAMES = ['Nguyen', 'Garcia', 'Patel', 'Johnson', 'Kim', 'Okafor', 'Rossi', 'Martinez', 'Chen', 'Williams', 'Haddad', 'Silva', 'Brown', 'Kowalski', "O'Brien", 'Tanaka', 'Mendez', 'Davis', 'Ali', 'Fischer', 'Reyes', 'Thompson', 'Singh', 'Lopez', 'Baker', 'Moreau', 'Jackson', 'Novak', 'Clark', 'Ortiz', 'Walker', 'Park', 'Hughes', 'Delgado', 'Yilmaz', 'Brooks', 'Ivanova', 'Cruz', 'Bell', 'Abbott'];
G.randName = () => G.util.pick(G.FIRST_NAMES) + ' ' + G.util.pick(G.LAST_NAMES);
