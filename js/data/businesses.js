// Business templates. Every business runs on one of five engines:
//   traffic       customers or clients arrive based on market size, competition, awareness, price
//   subscription  members/subscribers accumulate and churn (SaaS, gyms, daycare, newsletters)
//   projects      you build releases (books, games, videos, house flips) that sell over time
//   harvest       you grow or raise something on a cycle tied to your climate and season
//   rnd           research milestones, grants and licensing deals (biotech)
// Prices and costs are national baselines; the game scales them by local cost of living.
var G = globalThis.G || (globalThis.G = {});

G.ROLES = {
  barista: { title: 'Barista', wage: 15.5, kind: 'labor' },
  cook: { title: 'Line cook', wage: 18.5, kind: 'labor' },
  server: { title: 'Server', wage: 12, kind: 'labor' },
  baker: { title: 'Baker', wage: 18, kind: 'labor' },
  bartender: { title: 'Bartender', wage: 14, kind: 'labor' },
  clerk: { title: 'Sales associate', wage: 15.5, kind: 'labor' },
  manager: { title: 'General manager', wage: 28, kind: 'manager' },
  engineer: { title: 'Software engineer', wage: 68, kind: 'dev' },
  designer: { title: 'Designer', wage: 42, kind: 'creative' },
  salesrep: { title: 'Sales rep', wage: 32, kind: 'sales' },
  support: { title: 'Support specialist', wage: 22, kind: 'labor' },
  editor: { title: 'Editor', wage: 33, kind: 'creative' },
  writer: { title: 'Staff writer', wage: 30, kind: 'creative' },
  videoeditor: { title: 'Video editor', wage: 30, kind: 'creative' },
  gamedev: { title: 'Game developer', wage: 45, kind: 'creative' },
  farmhand: { title: 'Farmhand', wage: 17, kind: 'labor' },
  rancher: { title: 'Ranch hand', wage: 17.5, kind: 'labor' },
  scientist: { title: 'Research scientist', wage: 55, kind: 'research' },
  labtech: { title: 'Lab technician', wage: 27, kind: 'labor' },
  cleaner: { title: 'Cleaner', wage: 16.5, kind: 'labor' },
  crew: { title: 'Crew member', wage: 18.5, kind: 'labor' },
  tradesperson: { title: 'Licensed tech', wage: 34, kind: 'labor', cred: 'trade' },
  carpenter: { title: 'Carpenter', wage: 27, kind: 'labor' },
  stylist: { title: 'Stylist', wage: 20, kind: 'labor', cred: 'cosmetology' },
  groomer: { title: 'Groomer', wage: 18, kind: 'labor' },
  coach: { title: 'Fitness coach', wage: 25, kind: 'labor' },
  teacher: { title: 'Lead teacher', wage: 18.5, kind: 'labor' },
  director: { title: 'Center director', wage: 30, kind: 'manager', cred: 'cda' },
  caregiver: { title: 'Caregiver', wage: 17.5, kind: 'labor' },
  driver: { title: 'CDL driver', wage: 31, kind: 'labor', cred: 'cdl' },
  mover: { title: 'Mover', wage: 19, kind: 'labor' },
  mechanic: { title: 'Mechanic', wage: 27, kind: 'labor' },
  maker: { title: 'Craftsperson', wage: 22, kind: 'labor' },
  brewer: { title: 'Brewer', wage: 22, kind: 'labor' },
  distiller: { title: 'Distiller', wage: 24, kind: 'labor' },
  host: { title: 'Game master', wage: 16, kind: 'labor' },
  tutor: { title: 'Tutor', wage: 28, kind: 'labor' },
  consultant: { title: 'Consultant', wage: 55, kind: 'labor' },
  photographer: { title: 'Second shooter', wage: 30, kind: 'labor' },
  installer: { title: 'Solar installer', wage: 25, kind: 'labor' },
  packer: { title: 'Fulfillment associate', wage: 17, kind: 'labor' },
  housekeeper: { title: 'Housekeeper', wage: 16.5, kind: 'labor' },
  eventstaff: { title: 'Event staff', wage: 17, kind: 'labor' },
  pm: { title: 'Project manager', wage: 40, kind: 'manager' },
};

G.SEASONS = {
  flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  coffee: [0.95, 0.95, 1, 1, 1, 0.95, 0.9, 0.9, 1, 1.05, 1.1, 1.15],
  summer: [0.6, 0.65, 0.8, 0.95, 1.1, 1.3, 1.35, 1.3, 1.1, 0.95, 0.75, 0.7],
  holiday: [0.75, 0.75, 0.9, 0.95, 1, 0.95, 0.9, 0.95, 0.95, 1, 1.3, 1.7],
  wedding: [0.35, 0.45, 0.7, 0.95, 1.35, 1.5, 1.3, 1.35, 1.5, 1.4, 0.7, 0.5],
  school: [1.1, 1.15, 1.2, 1.25, 1.2, 0.6, 0.5, 0.8, 1.1, 1.15, 1.15, 0.8],
  yard: [0.25, 0.3, 0.8, 1.4, 1.6, 1.5, 1.4, 1.35, 1.2, 1.1, 0.6, 0.35],
  gym: [1.45, 1.2, 1.05, 1, 0.95, 0.9, 0.85, 0.9, 1, 1, 0.9, 0.8],
  dining: [0.88, 0.9, 1, 1, 1.05, 1.05, 1.05, 1.02, 0.98, 1, 1, 1.1],
  moving: [0.6, 0.65, 0.8, 0.95, 1.2, 1.45, 1.45, 1.35, 1.05, 0.9, 0.75, 0.65],
};

G.CATEGORIES = {
  food: 'Food & Drink', retail: 'Retail', tech: 'Technology', media: 'Publishing & Media', ag: 'Agriculture',
  science: 'Science & Biotech', services: 'Services', trades: 'Trades & Construction', making: 'Making & Manufacturing',
  transport: 'Logistics', hospitality: 'Hospitality & Entertainment', health: 'Health & Care', realestate: 'Real Estate',
};

(function () {
  const S = G.SEASONS;
  const list = G.BIZ_LIST = [];
  const T = (o) => {
    list.push(Object.assign({
      engine: 'traffic', season: S.flat, boosts: {}, risks: ['liability'], funding: ['sba', 'micro', 'family'],
      space: null, startup: [], licenses: [], setupHours: 60, fixedMo: 300, glMo: 60, wcRate: 0.015, ownerHours: 40,
      cov: 0, payLag: 0, el: 1.1, catch: 100, cardFees: true,
    }, o));
  };
  const bizLicense = ['Local business license', 150, 2];
  const co = ['Certificate of occupancy', 350, 3];
  const health = ['Health department permit', 650, 5];
  const handler = ['Food handler certificates', 180, 1];
  const sellers = ["Seller's permit (sales tax)", 0, 1];

  // ---------- Food & Drink ----------
  T({ id: 'cafe', name: 'Specialty coffee shop', cat: 'food', xp: 'food',
    desc: 'Espresso, pastries and a third place for regulars. Thin margins, early mornings, lots of foot traffic.',
    keys: { craft: 0.4, management: 0.3, sales: 0.3 }, roles: ['barista', 'manager'], ownerHours: 45,
    space: { type: 'retail', sqft: 1200 }, price: 7, cogs: 0.3, el: 1.3, mPK: 250, cPK: 0.3, catch: 60, hpu: 0.1, cov: 84,
    startup: [['Espresso machine & grinders', 28000, 'equip'], ['Build-out & plumbing', 55000, 'build'], ['Furniture & fixtures', 14000, 'equip'], ['POS & tech', 2500, 'equip'], ['Opening inventory', 6000, 'inv'], ['Signage & branding', 4000, 'brand']],
    licenses: [health, co, handler, ['Sign permit', 250, 2]], fixedMo: 1400, glMo: 85, wcRate: 0.025, season: S.coffee,
    boosts: { coffee: 1.3, college: 1.2, tech: 1.1, affluent: 1.15, tourism: 1.1, art: 1.05 }, risks: ['food', 'liability', 'equipment', 'labor'] });

  T({ id: 'restaurant', name: 'Full-service restaurant', cat: 'food', xp: 'food',
    desc: 'Your menu, your dining room. The classic high-risk, high-heart business: food costs, labor and rent eat everything.',
    keys: { craft: 0.45, management: 0.35, sales: 0.2 }, roles: ['cook', 'server', 'manager'], ownerHours: 60,
    space: { type: 'kitchen', sqft: 2800 }, price: 34, cogs: 0.31, el: 1.2, mPK: 420, cPK: 0.6, catch: 80, hpu: 0.6, cov: 200,
    startup: [['Commercial kitchen equipment', 110000, 'equip'], ['Build-out, hood & grease trap', 140000, 'build'], ['Dining room furniture', 35000, 'equip'], ['POS & reservations', 6000, 'equip'], ['Opening food & bar inventory', 12000, 'inv'], ['Branding & signage', 8000, 'brand']],
    licenses: [['Health department permit', 900, 6], ['Liquor license', 4500, 14], co, handler, ['Fire inspection', 200, 2]], setupHours: 160, fixedMo: 3800, glMo: 180, wcRate: 0.03, season: S.dining,
    boosts: { food: 1.35, tourism: 1.25, affluent: 1.2, music: 1.05 }, risks: ['food', 'liability', 'equipment', 'labor'] });

  T({ id: 'foodtruck', name: 'Food truck', cat: 'food', xp: 'food',
    desc: 'A kitchen on wheels. Lower rent than a restaurant, but weather, parking rules and a commissary kitchen run your life.',
    keys: { craft: 0.5, sales: 0.3, management: 0.2 }, roles: ['cook'], ownerHours: 45,
    price: 14, cogs: 0.32, el: 1.2, mPK: 22, cPK: 0.06, catch: 120, hpu: 0.12, cov: 30, unitsCap: 750,
    startup: [['Used food truck (built out)', 70000, 'equip'], ['Truck wrap & menu boards', 4500, 'brand'], ['Smallwares & generator', 6000, 'equip'], ['Opening inventory', 2500, 'inv']],
    licenses: [['Mobile food vendor permit', 600, 4], ['Health permit (mobile unit)', 450, 4], ['Fire inspection', 150, 2], ['Commissary kitchen agreement', 0, 2]], fixedMo: 1500, glMo: 110, season: S.summer,
    boosts: { food: 1.25, college: 1.2, tech: 1.15, music: 1.1, tourism: 1.1 }, risks: ['food', 'liability', 'equipment'] });

  T({ id: 'bakery', name: 'Bakery', cat: 'food', xp: 'food',
    desc: 'Bread at 4 a.m., pastry cases by 7. Wholesale accounts with cafes can smooth out slow days.',
    keys: { craft: 0.55, management: 0.25, sales: 0.2 }, roles: ['baker', 'clerk', 'manager'], ownerHours: 50,
    space: { type: 'kitchen', sqft: 1500 }, price: 11, cogs: 0.3, el: 1.2, mPK: 85, cPK: 0.15, catch: 60, hpu: 0.08, cov: 70,
    startup: [['Deck ovens, mixers & sheeters', 45000, 'equip'], ['Build-out', 50000, 'build'], ['Display cases', 9000, 'equip'], ['POS', 2500, 'equip'], ['Opening inventory', 4000, 'inv'], ['Branding', 4000, 'brand']],
    licenses: [health, co, handler], fixedMo: 1500, glMo: 80, wcRate: 0.025, season: S.holiday.map((x) => 0.6 + x * 0.4),
    boosts: { food: 1.25, affluent: 1.15, tourism: 1.1, artisan: 1.15 }, risks: ['food', 'liability', 'equipment'] });

  T({ id: 'brewery', name: 'Craft brewery & taproom', cat: 'food', xp: 'food',
    desc: 'Brew on site, pour in the taproom. Federal TTB approval alone takes months, and the build-out is heavy.',
    keys: { craft: 0.4, science: 0.2, sales: 0.2, management: 0.2 }, roles: ['brewer', 'bartender', 'manager'], ownerHours: 50,
    space: { type: 'industrial', sqft: 4000 }, price: 18, cogs: 0.25, el: 1.0, mPK: 25, cPK: 0.03, catch: 100, hpu: 0.12, cov: 60,
    startup: [['7-barrel brewhouse', 180000, 'equip'], ['Fermenters & bright tanks', 60000, 'equip'], ['Taproom build-out', 90000, 'build'], ['Kegs & canning line', 25000, 'equip'], ['Grain, hops & opening stock', 8000, 'inv'], ['Brand & label design', 10000, 'brand']],
    licenses: [["TTB Brewer's Notice (federal)", 0, 16], ['State manufacturer license', 1500, 12], ['Health permit', 500, 5], co, ['Zoning approval', 800, 6]], setupHours: 140, fixedMo: 3200, glMo: 160, wcRate: 0.03, season: S.summer.map((x) => 0.5 + x * 0.5),
    boosts: { beer: 1.4, outdoor: 1.2, college: 1.15, tourism: 1.15, music: 1.05 }, risks: ['liability', 'equipment', 'regulatory'], funding: ['sba', 'micro', 'family', 'equipment'] });

  T({ id: 'catering', name: 'Catering company', cat: 'food', xp: 'food',
    desc: 'Weddings, offices and galas. Big tickets, lumpy demand, and corporate clients who pay in 30 days.',
    keys: { craft: 0.4, sales: 0.35, management: 0.25 }, roles: ['cook', 'eventstaff', 'manager'], ownerHours: 40,
    space: { type: 'kitchen', sqft: 1000 }, price: 2400, cogs: 0.35, el: 0.9, mPK: 0.08, cPK: 0.02, catch: 300, hpu: 30, payLag: 2, cardFees: false,
    startup: [['Kitchen equipment', 35000, 'equip'], ['Refrigerated van', 32000, 'equip'], ['Serviceware & linens', 12000, 'equip'], ['Branding & tasting kit', 3000, 'brand']],
    licenses: [health, ['Catering permit', 300, 3], handler], fixedMo: 1100, glMo: 90, wcRate: 0.03, season: S.wedding.map((x) => 0.3 + x * 0.7),
    boosts: { corporate: 1.25, finance: 1.2, affluent: 1.25, government: 1.15, food: 1.1 }, risks: ['food', 'liability'] });

  T({ id: 'foodbrand', name: 'Packaged food brand', cat: 'food', xp: 'food', online: true,
    desc: 'Hot sauce, granola, jerky: a recipe you get into a co-packer and sell online and to stores.',
    keys: { creative: 0.3, sales: 0.45, craft: 0.25 }, roles: ['packer', 'salesrep'], ownerHours: 35,
    price: 28, cogs: 0.42, el: 1.1, mPK: 0.05, comp: 800, cac: 15, hpu: 0.08, repeat: 0.008,
    startup: [['Recipe development & lab testing', 3500, 'other'], ['First co-packer production run', 12000, 'inv'], ['Labels & UPC codes', 2500, 'brand'], ['Website & product photos', 4000, 'brand']],
    licenses: [['FDA food facility registration', 0, 2], ['Process authority review', 600, 4], ['Nutrition facts & label review', 900, 3]], fixedMo: 250, glMo: 70,
    season: S.holiday, risks: ['food', 'liability', 'recall'], funding: ['micro', 'family', 'crowd'] });

  T({ id: 'bar', name: 'Bar & music venue', cat: 'food', xp: 'hospitality',
    desc: 'Cocktails, a small stage and late nights. Liquor license costs vary wildly by state.',
    keys: { sales: 0.35, management: 0.35, craft: 0.3 }, roles: ['bartender', 'eventstaff', 'manager'], ownerHours: 50,
    space: { type: 'retail', sqft: 2500 }, price: 22, cogs: 0.24, el: 1.1, mPK: 60, cPK: 0.3, catch: 80, hpu: 0.1, cov: 70,
    startup: [['Bar build-out', 80000, 'build'], ['Sound system & stage', 22000, 'equip'], ['Furniture & glassware', 18000, 'equip'], ['Opening liquor inventory', 10000, 'inv'], ['Branding', 5000, 'brand']],
    licenses: [['Liquor license', 6000, 16], co, ['Entertainment / cabaret permit', 600, 6], health], fixedMo: 2200, glMo: 220, wcRate: 0.025,
    boosts: { music: 1.4, college: 1.3, tourism: 1.2, food: 1.1 }, risks: ['liability', 'regulatory', 'labor'] });

  // ---------- Retail ----------
  T({ id: 'boutique', name: 'Clothing boutique', cat: 'retail', xp: 'retail',
    desc: 'A curated shop with your taste on every rack. Inventory ties up cash, and the holidays make or break the year.',
    keys: { creative: 0.35, sales: 0.4, finance: 0.25 }, roles: ['clerk', 'manager'], ownerHours: 45,
    space: { type: 'retail', sqft: 1200 }, price: 70, cogs: 0.5, el: 1.2, mPK: 18, cPK: 0.25, catch: 80, hpu: 0.25, cov: 60,
    startup: [['Build-out & fitting rooms', 25000, 'build'], ['Fixtures & racks', 15000, 'equip'], ['Opening inventory', 35000, 'inv'], ['POS', 2500, 'equip'], ['Branding', 5000, 'brand']],
    licenses: [bizLicense, sellers, co], fixedMo: 900, glMo: 60, season: S.holiday,
    boosts: { affluent: 1.3, tourism: 1.2, art: 1.1, fashion: 1.3, college: 1.05 } });

  T({ id: 'bookstore', name: 'Independent bookstore', cat: 'retail', xp: 'media',
    desc: 'Author events, staff picks and a reading nook. Margins are thin since publishers give about a 46% discount.',
    keys: { creative: 0.3, sales: 0.35, management: 0.35 }, roles: ['clerk', 'manager'], ownerHours: 45,
    space: { type: 'retail', sqft: 2000 }, price: 26, cogs: 0.58, el: 1.0, mPK: 12, cPK: 0.03, catch: 100, hpu: 0.2, cov: 60,
    startup: [['Opening book inventory', 60000, 'inv'], ['Shelving & fixtures', 18000, 'equip'], ['Build-out', 20000, 'build'], ['POS & inventory system', 3000, 'equip'], ['Branding', 3000, 'brand']],
    licenses: [bizLicense, sellers, co], fixedMo: 800, glMo: 55, season: S.holiday,
    boosts: { college: 1.3, affluent: 1.2, art: 1.15, publishing: 1.25, tourism: 1.1 } });

  T({ id: 'ecommerce', name: 'E-commerce brand', cat: 'retail', xp: 'retail', online: true,
    desc: 'A direct-to-consumer brand on Shopify. Paid ads are the oxygen, and the platforms take a cut of everything.',
    keys: { sales: 0.45, creative: 0.3, tech: 0.25 }, roles: ['packer', 'designer'], ownerHours: 35,
    price: 48, cogs: 0.38, el: 1.2, mPK: 0.03, comp: 1500, cac: 38, hpu: 0.1,
    startup: [['Product samples & design', 6000, 'other'], ['First inventory order (MOQ)', 18000, 'inv'], ['Store, photography & copy', 3500, 'brand'], ['Brand identity', 3000, 'brand']],
    licenses: [sellers, ['Trademark application', 350, 4]], fixedMo: 350, glMo: 45, season: S.holiday, risks: ['liability', 'platform'], funding: ['micro', 'family', 'crowd', 'rbf'] });

  T({ id: 'plantshop', name: 'Plant shop', cat: 'retail', xp: 'retail',
    desc: 'Monsteras, pottery and repotting workshops. Spring is huge; plants die if you neglect them.',
    keys: { craft: 0.35, creative: 0.3, sales: 0.35 }, roles: ['clerk'], ownerHours: 40,
    space: { type: 'retail', sqft: 900 }, price: 38, cogs: 0.45, el: 1.1, mPK: 5, cPK: 0.04, catch: 60, hpu: 0.15, cov: 50,
    startup: [['Build-out & grow lights', 15000, 'build'], ['Shelving & fixtures', 7000, 'equip'], ['Opening plant & pot inventory', 9000, 'inv'], ['POS', 1500, 'equip'], ['Branding', 2500, 'brand']],
    licenses: [bizLicense, sellers, ['Nursery dealer license', 100, 3]], fixedMo: 700, season: [0.8, 0.85, 1.2, 1.4, 1.35, 1.1, 0.9, 0.85, 0.95, 0.95, 0.9, 1.2],
    boosts: { affluent: 1.25, college: 1.15, art: 1.15, tech: 1.1 } });

  T({ id: 'thrift', name: 'Vintage & resale shop', cat: 'retail', xp: 'retail',
    desc: 'Estate sales at dawn, curated racks by noon. Cheap inventory but sourcing eats your hours.',
    keys: { creative: 0.35, sales: 0.35, craft: 0.3 }, roles: ['clerk'], ownerHours: 45,
    space: { type: 'retail', sqft: 1200 }, price: 32, cogs: 0.3, el: 1.0, mPK: 9, cPK: 0.08, catch: 80, hpu: 0.35, cov: 50,
    startup: [['Fixtures & racks', 9000, 'equip'], ['Build-out', 12000, 'build'], ['Sourced opening inventory', 8000, 'inv'], ['Branding', 2000, 'brand']],
    licenses: [bizLicense, sellers, ['Secondhand dealer permit', 120, 3]], fixedMo: 500,
    boosts: { college: 1.3, art: 1.2, music: 1.1, artisan: 1.15 } });

  T({ id: 'bodega', name: 'Corner store', cat: 'retail', xp: 'retail',
    desc: 'Snacks, lottery, coffee and essentials, open long hours. High volume and razor-thin margins.',
    keys: { management: 0.45, finance: 0.3, sales: 0.25 }, roles: ['clerk', 'manager'], ownerHours: 60,
    space: { type: 'retail', sqft: 1500 }, price: 12, cogs: 0.7, el: 1.1, mPK: 250, cPK: 0.5, catch: 30, hpu: 0.03, cov: 112,
    startup: [['Coolers & shelving', 30000, 'equip'], ['Build-out', 15000, 'build'], ['Opening inventory', 25000, 'inv'], ['POS & security cameras', 5000, 'equip']],
    licenses: [bizLicense, sellers, ['Tobacco & lottery licenses', 450, 6], ['Food retail permit', 300, 4]], fixedMo: 1500, glMo: 90, risks: ['liability', 'theft'] });

  // ---------- Technology ----------
  T({ id: 'saas', name: 'B2B SaaS startup', cat: 'tech', xp: 'tech', engine: 'subscription', online: true,
    desc: 'Software that businesses pay for monthly. Build an MVP, find product-market fit, then grow recurring revenue.',
    keys: { tech: 0.5, sales: 0.3, management: 0.2 }, roles: ['engineer', 'salesrep', 'support', 'designer'], ownerHours: 50,
    sub: { price: 120, cogs: 0.18, churn: 0.03, cac: 1100, organic: 0.6, salesYield: 0.03 }, setupHours: 800, el: 0.7,
    startup: [['Laptop & dev tools', 3500, 'equip'], ['Cloud infrastructure', 2000, 'other'], ['Terms, privacy & contracts (legal)', 1500, 'other'], ['Website & brand', 2500, 'brand']],
    licenses: [], fixedMo: 600, glMo: 60, wcRate: 0.004, cardFees: false, risks: ['data', 'liability'], funding: ['angel', 'vc', 'sbir', 'family'] });

  T({ id: 'app', name: 'Consumer mobile app', cat: 'tech', xp: 'tech', engine: 'subscription', online: true,
    desc: 'A freemium app with paid subscriptions. App stores keep up to 30%, and most users never pay. A viral moment changes everything.',
    keys: { tech: 0.45, creative: 0.35, sales: 0.2 }, roles: ['engineer', 'designer', 'support'], ownerHours: 45,
    sub: { price: 7, cogs: 0.3, churn: 0.09, cac: 14, organic: 8, salesYield: 0 }, setupHours: 600, el: 1.2,
    startup: [['Devices for testing', 2500, 'equip'], ['Developer accounts & tools', 600, 'other'], ['Backend infrastructure', 1500, 'other'], ['Brand & app store assets', 2000, 'brand']],
    licenses: [], fixedMo: 400, glMo: 45, wcRate: 0.004, cardFees: false, risks: ['data', 'platform'], funding: ['angel', 'vc', 'family'] });

  T({ id: 'agency', name: 'Web & software agency', cat: 'tech', xp: 'tech',
    desc: 'Build websites and apps for clients. You get paid for hours, and clients pay on net-30 if you are lucky.',
    keys: { tech: 0.45, sales: 0.35, management: 0.2 }, roles: ['engineer', 'designer', 'salesrep', 'pm'], ownerHours: 45,
    price: 9500, cogs: 0.05, el: 0.8, mPK: 0.004, cPK: 0.008, catch: 1500, hpu: 120, payLag: 4, network: true, cardFees: false,
    startup: [['Laptops & software', 5000, 'equip'], ['Portfolio site & brand', 3000, 'brand'], ['Contracts & legal templates', 1200, 'other']],
    licenses: [bizLicense], fixedMo: 450, glMo: 50, wcRate: 0.004,
    boosts: { tech: 1.3, corporate: 1.2, finance: 1.15, government: 1.1 }, risks: ['clients', 'liability'] });

  T({ id: 'hardware', name: 'Hardware startup', cat: 'tech', xp: 'making', online: true,
    desc: 'A physical gadget. Prototypes, factory tooling and FCC certification come before you sell a single unit.',
    keys: { tech: 0.35, science: 0.25, creative: 0.2, sales: 0.2 }, roles: ['engineer', 'packer', 'designer'], ownerHours: 50,
    price: 189, cogs: 0.48, el: 1.2, mPK: 0.004, comp: 300, cac: 70, hpu: 0.2, setupHours: 900,
    startup: [['Prototyping', 25000, 'other'], ['Factory tooling & molds', 60000, 'equip'], ['First production run', 40000, 'inv'], ['Brand & launch video', 6000, 'brand']],
    licenses: [['FCC / UL certification', 15000, 12]], fixedMo: 800, glMo: 120, risks: ['liability', 'recall', 'supply'], funding: ['angel', 'vc', 'crowd', 'sbir'] });

  T({ id: 'ai', name: 'AI startup', cat: 'tech', xp: 'tech', engine: 'subscription', online: true,
    desc: 'An AI product for businesses. Investors are hungry, compute is expensive, and a frontier lab could ship your feature next month.',
    keys: { tech: 0.55, science: 0.15, sales: 0.3 }, roles: ['engineer', 'salesrep', 'support'], ownerHours: 55,
    sub: { price: 600, cogs: 0.35, churn: 0.04, cac: 2500, organic: 0.25, salesYield: 0.012 }, setupHours: 900, el: 0.8,
    startup: [['GPU credits & infrastructure', 15000, 'other'], ['Laptop & tools', 3500, 'equip'], ['Legal & data agreements', 3000, 'other'], ['Brand & site', 2500, 'brand']],
    licenses: [], fixedMo: 1500, glMo: 80, wcRate: 0.004, cardFees: false, risks: ['data', 'platform'], funding: ['angel', 'vc', 'sbir'] });

  T({ id: 'gamestudio', name: 'Indie game studio', cat: 'tech', xp: 'tech', engine: 'projects', online: true,
    desc: 'Make games and ship them on Steam. Most indie games sell under a thousand copies. A few change their makers\' lives.',
    keys: { tech: 0.4, creative: 0.45, sales: 0.15 }, roles: ['gamedev', 'designer'], ownerHours: 45, setupHours: 40,
    projects: [
      { id: 'small', name: 'Small indie game', hours: 1200, cost: 8000, price: 15, units: 380, decay: 0.9, tail: 12, cogs: 0.35, hit: 0.03 },
      { id: 'mid', name: 'Ambitious indie game', hours: 4000, cost: 60000, price: 25, units: 1400, decay: 0.92, tail: 40, cogs: 0.35, hit: 0.05 },
      { id: 'mobile', name: 'Mobile casual game', hours: 600, cost: 5000, price: 2.5, units: 3000, decay: 0.85, tail: 80, cogs: 0.32, hit: 0.03 },
    ],
    startup: [['Dev PC & software licenses', 4500, 'equip'], ['Engine, assets & audio', 2000, 'other'], ['Studio brand & site', 1500, 'brand']],
    licenses: [], fixedMo: 200, glMo: 35, wcRate: 0.004, cardFees: false, risks: ['platform'], funding: ['angel', 'crowd', 'family'] });

  // ---------- Publishing & Media ----------
  T({ id: 'publisher', name: 'Independent publishing house', cat: 'media', xp: 'media', engine: 'projects', online: true,
    desc: 'Acquire manuscripts, edit, design and print. Distributors and stores take about 55% of list price. BookTok can make a backlist title explode.',
    keys: { creative: 0.45, sales: 0.3, finance: 0.25 }, roles: ['editor', 'designer', 'salesrep'], ownerHours: 40, setupHours: 50,
    projects: [
      { id: 'lit', name: 'Literary novel', hours: 350, cost: 14000, price: 18, units: 260, decay: 0.9, tail: 4, cogs: 0.6, hit: 0.03 },
      { id: 'genre', name: 'Romance / fantasy novel', hours: 260, cost: 9000, price: 16, units: 400, decay: 0.88, tail: 6, cogs: 0.58, hit: 0.06 },
      { id: 'cookbook', name: 'Cookbook / nonfiction', hours: 450, cost: 22000, price: 30, units: 350, decay: 0.92, tail: 5, cogs: 0.6, hit: 0.03 },
      { id: 'kids', name: "Children's picture book", hours: 300, cost: 18000, price: 18, units: 300, decay: 0.93, tail: 6, cogs: 0.6, hit: 0.03 },
    ],
    startup: [['ISBN block & distribution setup', 1500, 'other'], ['Design software & computer', 3000, 'equip'], ['Imprint branding & website', 2000, 'brand']],
    licenses: [bizLicense], fixedMo: 300, glMo: 40, wcRate: 0.004, cardFees: false, boosts: { publishing: 1.2, media: 1.1 }, risks: ['ip'], funding: ['micro', 'family', 'crowd', 'grant'] });

  T({ id: 'author', name: 'Self-published author', cat: 'media', xp: 'media', engine: 'projects', online: true,
    desc: 'Write books and publish them on Amazon KDP with a 70% ebook royalty. Every new book sells the ones before it.',
    keys: { creative: 0.7, sales: 0.3 }, roles: ['editor', 'designer'], ownerHours: 25, setupHours: 10,
    projects: [
      { id: 'novel', name: 'Novel', hours: 600, cost: 2500, price: 5, units: 260, decay: 0.9, tail: 6, cogs: 0.35, hit: 0.03 },
      { id: 'novella', name: 'Novella', hours: 250, cost: 900, price: 3.5, units: 150, decay: 0.88, tail: 4, cogs: 0.35, hit: 0.02 },
      { id: 'audio', name: 'Audiobook of a past title', hours: 40, cost: 4000, price: 14, units: 60, decay: 0.92, tail: 3, cogs: 0.6, hit: 0.01 },
    ],
    startup: [['Laptop & writing software', 1500, 'equip'], ['Author website & mailing list', 400, 'brand']],
    licenses: [], fixedMo: 40, glMo: 0, wcRate: 0, cardFees: false, risks: ['ip', 'platform'], funding: ['family', 'crowd'] });

  T({ id: 'newsletter', name: 'Paid newsletter / digital media', cat: 'media', xp: 'media', engine: 'subscription', online: true,
    desc: 'Independent journalism or niche expertise sold by subscription. Your voice is the product.',
    keys: { creative: 0.6, sales: 0.25, tech: 0.15 }, roles: ['writer', 'editor'], ownerHours: 30,
    sub: { price: 8, cogs: 0.1, churn: 0.05, cac: 40, organic: 6, salesYield: 0 }, setupHours: 80,
    startup: [['Laptop & mic', 1800, 'equip'], ['Brand & landing page', 600, 'brand']],
    licenses: [], fixedMo: 60, glMo: 25, wcRate: 0, cardFees: false, risks: ['ip', 'platform'], funding: ['family'] });

  T({ id: 'creator', name: 'YouTube & podcast studio', cat: 'media', xp: 'media', engine: 'projects', online: true, audience: true,
    desc: 'Make videos and episodes that earn ad revenue per view. Sponsors show up when your audience does.',
    keys: { creative: 0.55, tech: 0.2, sales: 0.25 }, roles: ['videoeditor', 'writer'], ownerHours: 35, setupHours: 30,
    projects: [
      { id: 'video', name: 'Long-form video', hours: 35, cost: 300, price: 0.008, units: 6000, decay: 0.78, tail: 160, cogs: 0, hit: 0.04, unit: 'views' },
      { id: 'pod', name: 'Podcast episode', hours: 12, cost: 80, price: 0.025, units: 450, decay: 0.72, tail: 30, cogs: 0, hit: 0.02, unit: 'downloads' },
      { id: 'doc', name: 'Mini-documentary', hours: 120, cost: 2500, price: 0.009, units: 25000, decay: 0.85, tail: 600, cogs: 0, hit: 0.06, unit: 'views' },
    ],
    startup: [['Camera, lenses & lighting', 4500, 'equip'], ['Microphones & audio interface', 1200, 'equip'], ['Editing computer', 3000, 'equip']],
    licenses: [], fixedMo: 90, glMo: 20, wcRate: 0, cardFees: false, risks: ['platform', 'ip'], funding: ['family'] });

  T({ id: 'videoprod', name: 'Video production company', cat: 'media', xp: 'media',
    desc: 'Commercials, brand videos and corporate shoots. Gear is expensive and clients want it yesterday.',
    keys: { creative: 0.5, sales: 0.3, tech: 0.2 }, roles: ['videoeditor', 'photographer', 'salesrep'], ownerHours: 45,
    price: 6500, cogs: 0.12, el: 0.9, mPK: 0.006, cPK: 0.012, catch: 1500, hpu: 60, payLag: 4, network: true, cardFees: false,
    startup: [['Cinema camera kit', 18000, 'equip'], ['Lighting & grip', 8000, 'equip'], ['Editing workstation', 5000, 'equip'], ['Reel & website', 2500, 'brand']],
    licenses: [bizLicense], fixedMo: 300, glMo: 70,
    boosts: { film: 1.4, media: 1.3, corporate: 1.15, tech: 1.15 }, risks: ['clients', 'equipment'] });

  // ---------- Agriculture ----------
  T({ id: 'marketgarden', name: 'Market garden (vegetables)', cat: 'ag', xp: 'ag', engine: 'harvest',
    desc: 'A few intensively farmed acres selling at farmers markets, through CSA shares and to restaurants. Your season depends on your climate.',
    keys: { craft: 0.5, science: 0.2, sales: 0.3 }, roles: ['farmhand'], ownerHours: 50,
    harvest: { unit: 'acre', units0: 1, unitCost: 9000, opex: 120, labor: 18, cycle: 8, value: 13000, wholesale: 0.5 },
    startup: [['Walk-behind tractor & hand tools', 9000, 'equip'], ['Irrigation system', 6000, 'equip'], ['Wash & pack station', 7000, 'build'], ['Walk-in cooler', 6000, 'equip']],
    licenses: [['Farmers market vendor permit', 150, 2], ['GAP food safety certification', 600, 6]], fixedMo: 250, glMo: 45, wcRate: 0.04,
    boosts: { food: 1.15, affluent: 1.15, college: 1.05 }, risks: ['weather', 'liability'], funding: ['usda', 'micro', 'family', 'grant'] });

  T({ id: 'ranch', name: 'Cattle ranch (cow-calf)', cat: 'ag', xp: 'ag', engine: 'harvest',
    desc: 'Run a herd of mother cows and sell weaned calves each fall. Calf prices are near record highs; so is the cost of a bred cow.',
    keys: { craft: 0.45, management: 0.3, finance: 0.25 }, roles: ['rancher'], ownerHours: 45,
    harvest: { unit: 'cow', units0: 30, unitCost: 3200, opex: 18, labor: 0.25, cycle: 30, value: 1750, wholesale: 1, saleMonths: [9, 10], noDirect: true, annual: true },
    startup: [['Truck & stock trailer', 45000, 'equip'], ['Fencing & water', 25000, 'build'], ['Handling chute & pens', 9000, 'equip']],
    licenses: [['Brand registration', 100, 4], ['Premises ID registration', 0, 2]], fixedMo: 600, glMo: 80, wcRate: 0.05,
    boosts: { cattle: 1.1, ag: 1.05 }, risks: ['weather', 'liability'], funding: ['usda', 'family', 'equipment'] });

  T({ id: 'vertfarm', name: 'Indoor vertical farm', cat: 'ag', xp: 'ag', engine: 'harvest',
    desc: 'Hydroponic greens grown under LEDs, year-round, sold to grocers and restaurants. Electricity is your biggest bill.',
    keys: { science: 0.4, craft: 0.3, sales: 0.3 }, roles: ['farmhand', 'salesrep'], ownerHours: 45,
    space: { type: 'industrial', sqft: 2500 },
    harvest: { unit: 'rack', units0: 6, unitCost: 6500, opex: 55, labor: 3, cycle: 4, value: 2200, wholesale: 0.6, indoor: true },
    startup: [['HVAC & dehumidification', 30000, 'equip'], ['Build-out & electrical', 25000, 'build'], ['Packing & cold storage', 9000, 'equip']],
    licenses: [['Food facility registration', 0, 2], ['Electrical permit', 400, 4]], fixedMo: 1200, glMo: 70, wcRate: 0.03,
    boosts: { food: 1.15, affluent: 1.1, tech: 1.1 }, risks: ['equipment', 'liability'], funding: ['usda', 'sba', 'grant', 'angel'] });

  T({ id: 'vineyard', name: 'Vineyard & winery', cat: 'ag', xp: 'ag', engine: 'harvest',
    desc: 'Plant vines, wait three years for the first real crop, then turn grapes into wine and sell it a year later.',
    keys: { craft: 0.35, science: 0.25, sales: 0.25, finance: 0.15 }, roles: ['farmhand', 'clerk'], ownerHours: 45,
    harvest: { unit: 'acre', units0: 4, unitCost: 35000, opex: 80, labor: 6, cycle: 30, value: 24000, wholesale: 0.18, saleMonths: [8, 9], firstDelay: 104, payLag: 26, annual: true },
    startup: [['Tractor & sprayer', 40000, 'equip'], ['Winery equipment (crush, tanks, barrels)', 70000, 'equip'], ['Tasting room', 45000, 'build'], ['Labels & brand', 6000, 'brand']],
    licenses: [['TTB bonded winery permit', 0, 16], ['State winery license', 1000, 10], ['Health permit (tasting room)', 400, 5]], fixedMo: 900, glMo: 110, wcRate: 0.04,
    boosts: { wine: 1.3, tourism: 1.2, affluent: 1.15 }, risks: ['weather', 'liability', 'regulatory'], funding: ['usda', 'sba', 'family'] });

  T({ id: 'apiary', name: 'Apiary & honey', cat: 'ag', xp: 'ag', engine: 'harvest',
    desc: 'Keep bee colonies, sell raw honey each late summer, and rent hives for almond pollination in February.',
    keys: { craft: 0.45, science: 0.25, sales: 0.3 }, roles: ['farmhand'], ownerHours: 25,
    harvest: { unit: 'hive', units0: 40, unitCost: 450, opex: 2, labor: 0.4, cycle: 26, value: 420, wholesale: 0.4, saleMonths: [7, 8], annual: true },
    startup: [['Extractor & bottling gear', 4500, 'equip'], ['Protective gear & tools', 800, 'equip'], ['Labels & jars', 1500, 'brand']],
    licenses: [['State apiary registration', 25, 2], ['Cottage food / honey house permit', 150, 3]], fixedMo: 80, glMo: 30, wcRate: 0.03,
    risks: ['weather'], funding: ['usda', 'micro', 'family'] });

  T({ id: 'mushroom', name: 'Gourmet mushroom farm', cat: 'ag', xp: 'ag', engine: 'harvest',
    desc: 'Oyster, lion\'s mane and shiitake grown indoors on a six-week cycle for chefs and farmers markets.',
    keys: { science: 0.35, craft: 0.4, sales: 0.25 }, roles: ['farmhand'], ownerHours: 35,
    space: { type: 'industrial', sqft: 1200 },
    harvest: { unit: 'grow rack', units0: 4, unitCost: 3000, opex: 40, labor: 5, cycle: 6, value: 1500, wholesale: 0.55, indoor: true },
    startup: [['Sterilization & lab gear', 12000, 'equip'], ['Grow room build-out', 15000, 'build'], ['Cooler', 5000, 'equip']],
    licenses: [['Food facility registration', 0, 2], ['Farmers market permit', 150, 2]], fixedMo: 500, glMo: 40, wcRate: 0.03,
    boosts: { food: 1.2, affluent: 1.1 }, risks: ['equipment'], funding: ['usda', 'micro', 'family'] });

  T({ id: 'flowerfarm', name: 'Cut flower farm', cat: 'ag', xp: 'ag', engine: 'harvest',
    desc: 'Dahlias, zinnias and peonies for florists, weddings and bouquet subscriptions.',
    keys: { craft: 0.45, creative: 0.25, sales: 0.3 }, roles: ['farmhand'], ownerHours: 45,
    harvest: { unit: 'acre', units0: 1, unitCost: 6000, opex: 100, labor: 20, cycle: 10, value: 12000, wholesale: 0.45 },
    startup: [['Hoop house', 12000, 'build'], ['Irrigation & tools', 6000, 'equip'], ['Cooler', 6000, 'equip']],
    licenses: [['Nursery / florist license', 100, 3]], fixedMo: 200, glMo: 40, wcRate: 0.04,
    boosts: { affluent: 1.2, tourism: 1.1 }, risks: ['weather'], funding: ['usda', 'micro', 'family'] });

  // ---------- Science & Biotech ----------
  T({ id: 'biotech', name: 'Biotech startup (therapeutics)', cat: 'science', xp: 'bio', engine: 'rnd',
    desc: 'Discover a drug candidate. No revenue for years: you live on grants, investors and the occasional pharma licensing deal.',
    keys: { science: 0.65, management: 0.15, sales: 0.2 }, roles: ['scientist', 'labtech'], ownerHours: 55,
    space: { type: 'lab', sqft: 1500 },
    rnd: { milestones: [
      { name: 'Target validated', pts: 2500, cost: 0, val: 2e6 },
      { name: 'Lead candidate identified', pts: 7000, cost: 0, val: 8e6, offer: { p: 0.15, upfront: 1.5e6 } },
      { name: 'Preclinical proof of concept', pts: 16000, cost: 600000, val: 25e6, offer: { p: 0.3, upfront: 6e6 } },
      { name: 'IND-ready package filed with FDA', pts: 30000, cost: 2500000, val: 60e6, offer: { p: 0.45, upfront: 20e6 } },
      { name: 'Phase 1 trial complete', pts: 55000, cost: 9000000, val: 150e6, offer: { p: 0.6, upfront: 250e6, acquisition: true } },
    ] },
    startup: [['Used lab equipment', 120000, 'equip'], ['Biosafety & compliance setup', 15000, 'build'], ['University IP license', 25000, 'other']],
    licenses: [['Institutional biosafety approval', 2500, 8], ['Hazardous waste permit', 800, 4]], setupHours: 120, fixedMo: 2500, glMo: 250, wcRate: 0.01, cardFees: false,
    boosts: { biotech: 1.3, college: 1.1, healthcare: 1.05 }, risks: ['regulatory', 'liability'], funding: ['sbir', 'angel', 'vc', 'grant'] });

  T({ id: 'cro', name: 'Contract testing lab', cat: 'science', xp: 'bio',
    desc: 'Run assays and testing for biotech, food and cannabis companies. Accreditation takes months; clients pay net-45.',
    keys: { science: 0.5, management: 0.25, sales: 0.25 }, roles: ['labtech', 'scientist', 'salesrep'], ownerHours: 45,
    space: { type: 'lab', sqft: 1500 }, price: 3800, cogs: 0.25, el: 0.8, mPK: 0.01, cPK: 0.002, catch: 2000, hpu: 40, payLag: 6, network: true, cardFees: false,
    startup: [['Lab instruments', 90000, 'equip'], ['Lab build-out', 30000, 'build'], ['LIMS software', 6000, 'other']],
    licenses: [['ISO 17025 / CLIA accreditation', 8000, 16], ['Hazardous waste permit', 800, 4]], fixedMo: 1800, glMo: 160,
    boosts: { biotech: 1.6, healthcare: 1.2, college: 1.1, ag: 1.05 }, risks: ['regulatory', 'clients'], funding: ['sba', 'sbir', 'equipment'] });

  T({ id: 'skincare', name: 'Skincare & cosmetics lab', cat: 'science', xp: 'bio', online: true,
    desc: 'Formulate your own products, have a contract manufacturer fill them, and sell online. MoCRA now requires FDA registration.',
    keys: { science: 0.35, creative: 0.35, sales: 0.3 }, roles: ['packer', 'designer'], ownerHours: 35,
    price: 42, cogs: 0.25, el: 1.1, mPK: 0.05, comp: 2500, cac: 32, hpu: 0.08,
    startup: [['Formulation & stability testing', 9000, 'other'], ['First manufacturing batch', 15000, 'inv'], ['Packaging design', 4000, 'brand'], ['Store & photography', 2500, 'brand']],
    licenses: [['MoCRA facility registration & product listing', 0, 3], ['Safety substantiation testing', 3000, 6]], fixedMo: 300, glMo: 90,
    season: S.holiday.map((x) => 0.5 + x * 0.5), risks: ['recall', 'liability', 'platform'], funding: ['micro', 'family', 'crowd'] });

  // ---------- Services ----------
  T({ id: 'cleaning', name: 'Cleaning service', cat: 'services', xp: 'services',
    desc: 'Residential and office cleaning. Almost no startup cost; the business is really about hiring and keeping good people.',
    keys: { management: 0.45, sales: 0.3, craft: 0.25 }, roles: ['cleaner', 'manager'], ownerHours: 40,
    price: 165, cogs: 0.07, el: 1.1, mPK: 3, cPK: 0.1, catch: 200, hpu: 4,
    startup: [['Supplies & equipment', 2500, 'equip'], ['Booking software & site', 900, 'brand'], ['Uniforms & branding', 800, 'brand']],
    licenses: [bizLicense, ['Janitorial bond', 200, 1]], fixedMo: 250, glMo: 70, wcRate: 0.05,
    boosts: { affluent: 1.3, tech: 1.15, finance: 1.1 }, risks: ['liability', 'labor'] });

  T({ id: 'landscaping', name: 'Landscaping company', cat: 'services', xp: 'services',
    desc: 'Mowing, installs and seasonal cleanups. Spring is a frenzy; winter is quiet unless you plow snow.',
    keys: { craft: 0.4, management: 0.35, sales: 0.25 }, roles: ['crew', 'manager'], ownerHours: 45,
    price: 280, cogs: 0.15, el: 1.0, mPK: 2.5, cPK: 0.12, catch: 200, hpu: 4,
    startup: [['Truck & trailer', 38000, 'equip'], ['Mowers & equipment', 18000, 'equip'], ['Branding', 1500, 'brand']],
    licenses: [bizLicense, ['Pesticide applicator license', 250, 6]], fixedMo: 500, glMo: 90, wcRate: 0.07, season: S.yard,
    boosts: { affluent: 1.3, retirement: 1.15 }, risks: ['liability', 'equipment', 'weather'], funding: ['sba', 'micro', 'family', 'equipment'] });

  T({ id: 'salon', name: 'Hair salon', cat: 'services', xp: 'services', cred: 'cosmetology',
    desc: 'Chairs, color and regulars who follow their stylist anywhere. Stylists need a state cosmetology license, and so do you if you cut.',
    keys: { craft: 0.45, sales: 0.3, management: 0.25 }, roles: ['stylist', 'manager'], ownerHours: 40,
    space: { type: 'retail', sqft: 1100 }, price: 62, cogs: 0.12, el: 1.1, mPK: 30, cPK: 0.4, catch: 50, hpu: 1.0,
    startup: [['Stations, chairs & dryers', 18000, 'equip'], ['Build-out & plumbing', 35000, 'build'], ['Opening product', 4000, 'inv'], ['Booking system', 1500, 'equip'], ['Branding', 3000, 'brand']],
    licenses: [['Salon establishment license', 300, 4], co], fixedMo: 900, glMo: 70, wcRate: 0.02,
    boosts: { affluent: 1.25, college: 1.1, fashion: 1.2 } });

  T({ id: 'gym', name: 'Boutique fitness studio', cat: 'services', xp: 'services', engine: 'subscription',
    desc: 'Small-group training with monthly memberships. January is gold; summer churn hurts.',
    keys: { sales: 0.4, management: 0.35, craft: 0.25 }, roles: ['coach', 'manager'], ownerHours: 45,
    space: { type: 'retail', sqft: 2500 },
    sub: { price: 165, cogs: 0.05, churn: 0.045, cac: 120, organic: 4, salesYield: 0.015, local: { maxPerK: 20, cPK: 0.12, catch: 80 }, perStaff: 70 },
    setupHours: 120,
    startup: [['Equipment', 45000, 'equip'], ['Build-out, flooring & showers', 60000, 'build'], ['Sound & AV', 8000, 'equip'], ['Branding', 5000, 'brand']],
    licenses: [co, bizLicense], fixedMo: 1200, glMo: 120, wcRate: 0.02, season: S.gym,
    boosts: { affluent: 1.3, tech: 1.2, college: 1.1, outdoor: 1.1 } });

  T({ id: 'daycare', name: 'Childcare center', cat: 'health', xp: 'health', engine: 'subscription',
    desc: 'Licensed care for kids under five. Waitlists everywhere, but strict staff ratios cap how many kids you can take.',
    keys: { management: 0.45, craft: 0.2, finance: 0.15, sales: 0.2 }, roles: ['teacher', 'director'], ownerHours: 50, cred: 'cda',
    space: { type: 'retail', sqft: 3000 },
    sub: { price: 1250, cogs: 0.08, churn: 0.02, cac: 150, organic: 4, salesYield: 0, local: { maxPerK: 20, cPK: 0.3, catch: 40 }, perStaff: 5.5 },
    setupHours: 140,
    startup: [['Build-out & safety upgrades', 70000, 'build'], ['Furniture & learning materials', 20000, 'equip'], ['Playground', 25000, 'equip'], ['Branding', 3000, 'brand']],
    licenses: [['State child care license', 500, 16], ['Fire & health inspections', 400, 6], ['Staff background checks', 100, 2]], fixedMo: 1400, glMo: 200, wcRate: 0.02,
    boosts: { affluent: 1.15, tech: 1.15, government: 1.1, healthcare: 1.05 }, risks: ['liability', 'regulatory', 'labor'], funding: ['sba', 'micro', 'family', 'grant'] });

  T({ id: 'consulting', name: 'Consulting firm', cat: 'services', xp: 'finance',
    desc: 'Sell your expertise by the engagement. No inventory and almost no startup cost: your network is the business.',
    keys: { sales: 0.4, finance: 0.3, management: 0.3 }, roles: ['consultant', 'salesrep'], ownerHours: 45,
    price: 9000, cogs: 0.03, el: 0.8, mPK: 0.006, cPK: 0.01, catch: 2000, hpu: 70, payLag: 5, network: true, cardFees: false,
    startup: [['Laptop & software', 2500, 'equip'], ['Website & brand', 2000, 'brand'], ['Contracts & E&O setup', 1500, 'other']],
    licenses: [bizLicense], fixedMo: 300, glMo: 90, wcRate: 0.004,
    boosts: { corporate: 1.3, finance: 1.3, government: 1.25, tech: 1.2, healthcare: 1.1 }, risks: ['clients', 'liability'] });

  T({ id: 'photo', name: 'Wedding & event photography', cat: 'services', xp: 'media', tourist: true,
    desc: 'Big days, big tickets. Saturdays from May to October are booked a year out; January is quiet.',
    keys: { creative: 0.6, sales: 0.4 }, roles: ['photographer'], ownerHours: 30,
    price: 3400, cogs: 0.1, el: 0.9, mPK: 0.025, cPK: 0.06, catch: 400, hpu: 35,
    startup: [['Cameras & lenses', 9500, 'equip'], ['Editing computer', 3000, 'equip'], ['Portfolio site', 1500, 'brand']],
    licenses: [bizLicense], fixedMo: 150, glMo: 40, wcRate: 0.004, season: S.wedding,
    boosts: { affluent: 1.25, tourism: 1.3, wine: 1.2 }, risks: ['liability', 'equipment'] });

  T({ id: 'tutoring', name: 'Tutoring & test prep', cat: 'services', xp: 'services',
    desc: 'SAT, math and reading help. Parents in affluent suburbs pay well; summers are dead.',
    keys: { creative: 0.2, sales: 0.35, management: 0.25, science: 0.2 }, roles: ['tutor'], ownerHours: 30,
    price: 75, cogs: 0.02, el: 1.0, mPK: 3, cPK: 0.06, catch: 150, hpu: 1.2,
    startup: [['Materials & software', 1200, 'other'], ['Website & ads', 1000, 'brand']],
    licenses: [bizLicense], fixedMo: 120, glMo: 30, wcRate: 0.004, season: S.school,
    boosts: { affluent: 1.4, college: 1.2, tech: 1.15 } });

  T({ id: 'petcare', name: 'Dog grooming & daycare', cat: 'services', xp: 'services',
    desc: 'Bath, trim and a play yard for dogs while their owners work. People spend more on pets every year.',
    keys: { craft: 0.4, sales: 0.3, management: 0.3 }, roles: ['groomer', 'clerk'], ownerHours: 45,
    space: { type: 'industrial', sqft: 2200 }, price: 70, cogs: 0.1, el: 1.1, mPK: 15, cPK: 0.12, catch: 80, hpu: 1.1, cov: 55,
    startup: [['Tubs, tables & dryers', 15000, 'equip'], ['Build-out & kennels', 45000, 'build'], ['Branding', 3000, 'brand']],
    licenses: [['Kennel license', 300, 6], co], fixedMo: 900, glMo: 90, wcRate: 0.03,
    boosts: { affluent: 1.3, tech: 1.2, outdoor: 1.1 } });

  T({ id: 'homecare', name: 'Home care agency', cat: 'health', xp: 'health',
    desc: 'Non-medical caregivers for older adults at home. The population is aging fast, and finding caregivers is the hard part.',
    keys: { management: 0.5, sales: 0.25, finance: 0.25 }, roles: ['caregiver', 'manager'], ownerHours: 45,
    price: 34, cogs: 0.02, el: 0.9, mPK: 8, cPK: 0.02, catch: 200, hpu: 1.05, payLag: 3, cardFees: false,
    startup: [['Scheduling software', 3000, 'other'], ['Office setup', 5000, 'equip'], ['Branding & referral materials', 2500, 'brand']],
    licenses: [['State home care agency license', 1500, 12], ['Caregiver background checks', 200, 2]], fixedMo: 600, glMo: 140, wcRate: 0.06,
    boosts: { retirement: 1.5, healthcare: 1.2, affluent: 1.1 }, risks: ['liability', 'labor', 'regulatory'] });

  // ---------- Trades ----------
  T({ id: 'remodel', name: 'Remodeling contractor', cat: 'trades', xp: 'trades',
    desc: 'Kitchens, baths and additions. Big jobs, progress payments, and subcontractors who may or may not show up.',
    keys: { craft: 0.45, management: 0.35, sales: 0.2 }, roles: ['carpenter', 'pm'], ownerHours: 50,
    price: 32000, cogs: 0.58, el: 0.8, mPK: 0.015, cPK: 0.03, catch: 300, hpu: 260, payLag: 3, cardFees: false,
    startup: [['Work truck', 42000, 'equip'], ['Tools', 15000, 'equip'], ['Branding & yard signs', 2000, 'brand']],
    licenses: [['State contractor license & exam', 450, 8], ['Surety bond', 500, 1]], fixedMo: 600, glMo: 220, wcRate: 0.08,
    boosts: { affluent: 1.3, retirement: 1.1 }, risks: ['liability', 'clients', 'equipment'], funding: ['sba', 'micro', 'family', 'equipment'] });

  T({ id: 'hvac', name: 'Plumbing & HVAC service', cat: 'trades', xp: 'trades', cred: 'trade',
    desc: 'Emergency calls, installs and maintenance plans. Licensed techs are scarce and the work never stops.',
    keys: { craft: 0.5, sales: 0.25, management: 0.25 }, roles: ['tradesperson', 'manager'], ownerHours: 45,
    price: 480, cogs: 0.3, el: 0.8, mPK: 2, cPK: 0.1, catch: 200, hpu: 3.5,
    startup: [['Service van', 48000, 'equip'], ['Tools & diagnostics', 12000, 'equip'], ['Parts inventory', 6000, 'inv'], ['Branding', 2500, 'brand']],
    licenses: [['State trade contractor license', 300, 4], ['Permit bond', 250, 1]], fixedMo: 700, glMo: 180, wcRate: 0.07,
    season: [1.25, 1.1, 0.9, 0.85, 0.95, 1.2, 1.3, 1.25, 0.95, 0.9, 1, 1.2], risks: ['liability', 'equipment'], funding: ['sba', 'micro', 'family', 'equipment'] });

  T({ id: 'autorepair', name: 'Auto repair shop', cat: 'trades', xp: 'trades',
    desc: 'Brakes, diagnostics and honest estimates. Trust is the whole business.',
    keys: { craft: 0.5, management: 0.3, sales: 0.2 }, roles: ['mechanic', 'manager'], ownerHours: 50,
    space: { type: 'industrial', sqft: 3000 }, price: 520, cogs: 0.42, el: 0.9, mPK: 6, cPK: 0.25, catch: 80, hpu: 3, cov: 50,
    startup: [['Lifts & tools', 55000, 'equip'], ['Diagnostic scanners', 8000, 'equip'], ['Build-out', 15000, 'build'], ['Signage', 3000, 'brand']],
    licenses: [['Auto repair facility registration', 250, 3], ['Hazardous waste (used oil) permit', 300, 4], ['EPA 609 certification', 25, 1]], fixedMo: 1100, glMo: 160, wcRate: 0.06,
    risks: ['liability', 'equipment'], funding: ['sba', 'micro', 'family', 'equipment'] });

  T({ id: 'solar', name: 'Solar installer', cat: 'trades', xp: 'trades',
    desc: 'Residential rooftop solar. The federal homeowner tax credit ended after 2025, so every sale is harder than it was.',
    keys: { craft: 0.35, sales: 0.4, management: 0.25 }, roles: ['installer', 'salesrep', 'tradesperson'], ownerHours: 50,
    price: 26000, cogs: 0.62, el: 1.0, mPK: 0.006, cPK: 0.015, catch: 500, hpu: 120, payLag: 4, cardFees: false,
    startup: [['Truck & ladders', 45000, 'equip'], ['Tools & safety gear', 12000, 'equip'], ['Brand & sales materials', 4000, 'brand']],
    licenses: [['Electrical contractor license', 600, 8], ['Solar installer certification', 1500, 8]], fixedMo: 800, glMo: 200, wcRate: 0.09,
    boosts: { affluent: 1.25 }, risks: ['liability', 'regulatory'], funding: ['sba', 'family', 'equipment'] });

  // ---------- Making ----------
  T({ id: 'furniture', name: 'Custom furniture workshop', cat: 'making', xp: 'making',
    desc: 'Hardwood tables and built-ins, made to order. One craftsperson can only make so many pieces a month.',
    keys: { craft: 0.6, creative: 0.2, sales: 0.2 }, roles: ['maker'], ownerHours: 45,
    space: { type: 'industrial', sqft: 1500 }, price: 1900, cogs: 0.28, el: 0.9, mPK: 0.02, cPK: 0.015, catch: 1000, hpu: 32,
    startup: [['Table saw, planer & jointer', 30000, 'equip'], ['Dust collection', 6000, 'equip'], ['Shop build-out', 8000, 'build'], ['Lumber stock', 6000, 'inv']],
    licenses: [bizLicense, ['Fire inspection', 200, 3]], fixedMo: 500, glMo: 70, wcRate: 0.05,
    boosts: { affluent: 1.3, artisan: 1.2, furniture: 1.2, art: 1.1 }, risks: ['liability', 'equipment'] });

  T({ id: 'apparel', name: 'Apparel brand', cat: 'making', xp: 'making', online: true,
    desc: 'Design clothes, place minimum orders with a factory, and build a brand people want to wear.',
    keys: { creative: 0.45, sales: 0.4, finance: 0.15 }, roles: ['designer', 'packer'], ownerHours: 40,
    price: 58, cogs: 0.36, el: 1.2, mPK: 0.04, comp: 3000, cac: 34, hpu: 0.1,
    startup: [['Samples & patterns', 8000, 'other'], ['First production run (MOQ)', 14000, 'inv'], ['Photography & store', 5000, 'brand']],
    licenses: [sellers, ['Trademark application', 350, 4]], fixedMo: 300, glMo: 45, season: S.holiday,
    boosts: { fashion: 1.15 }, risks: ['platform', 'supply'], funding: ['micro', 'family', 'crowd', 'rbf'] });

  T({ id: 'candles', name: 'Candles & home goods', cat: 'making', xp: 'making', online: true,
    desc: 'Hand-poured candles sold on Etsy and at markets. Start at your kitchen table for almost nothing.',
    keys: { craft: 0.4, creative: 0.35, sales: 0.25 }, roles: ['packer'], ownerHours: 25,
    price: 32, cogs: 0.28, el: 1.1, mPK: 0.05, comp: 6000, cac: 18, hpu: 0.3,
    startup: [['Wax, wicks, scents & vessels', 2500, 'inv'], ['Pouring equipment', 900, 'equip'], ['Shop photos & listings', 600, 'brand']],
    licenses: [sellers], fixedMo: 60, glMo: 25, wcRate: 0.01, season: S.holiday, risks: ['liability', 'platform'], funding: ['family', 'crowd'] });

  T({ id: 'distillery', name: 'Craft distillery', cat: 'making', xp: 'making',
    desc: 'Gin and vodka now, whiskey that ages for years. Federal DSP permits take about six months.',
    keys: { craft: 0.35, science: 0.25, sales: 0.25, management: 0.15 }, roles: ['distiller', 'bartender'], ownerHours: 50,
    space: { type: 'industrial', sqft: 4000 }, price: 38, cogs: 0.25, el: 1.0, mPK: 4, cPK: 0.01, catch: 300, hpu: 0.4, cov: 40,
    startup: [['Still & distilling equipment', 160000, 'equip'], ['Build-out & tasting room', 90000, 'build'], ['Barrels & aging stock', 25000, 'inv'], ['Brand & bottle design', 15000, 'brand']],
    licenses: [['TTB distilled spirits plant permit', 0, 24], ['State distillery license', 3000, 16], ['Zoning approval', 800, 8]], setupHours: 140, fixedMo: 2400, glMo: 180, wcRate: 0.03,
    boosts: { bourbon: 1.4, tourism: 1.25, beer: 1.1 }, risks: ['liability', 'regulatory', 'equipment'], funding: ['sba', 'family', 'equipment'] });

  // ---------- Logistics ----------
  T({ id: 'trucking', name: 'Trucking (owner-operator)', cat: 'transport', xp: 'logistics', cred: 'cdl', capped: true,
    desc: 'Your own truck, your own authority. Freight is always out there, but rates swing with the economy and brokers pay in 30-45 days.',
    keys: { craft: 0.3, management: 0.3, finance: 0.2, sales: 0.2 }, roles: ['driver'], ownerHours: 55,
    price: 3000, cogs: 0.42, el: 0.6, hpu: 30, payLag: 5, cardFees: false,
    startup: [['Used semi truck', 95000, 'equip'], ['Dry van trailer', 35000, 'equip'], ['ELD & equipment', 1500, 'equip']],
    licenses: [['USDOT number', 0, 1], ['MC operating authority', 300, 4], ['UCR, IRP & IFTA', 1500, 3], ['BOC-3 filing', 50, 1]], fixedMo: 2100, glMo: 0, wcRate: 0.06,
    risks: ['liability', 'equipment'], funding: ['equipment', 'family', 'sba'] });

  T({ id: 'moving', name: 'Moving company', cat: 'transport', xp: 'logistics',
    desc: 'Box trucks and strong backs. Summer is chaos, winter is slow, and one broken heirloom costs a fortune.',
    keys: { management: 0.45, sales: 0.3, craft: 0.25 }, roles: ['mover', 'manager'], ownerHours: 45,
    price: 1500, cogs: 0.18, el: 1.0, mPK: 0.5, cPK: 0.03, catch: 300, hpu: 24,
    startup: [['26-ft box truck', 55000, 'equip'], ['Dollies, pads & straps', 3000, 'equip'], ['Branding', 1500, 'brand']],
    licenses: [['USDOT & state mover permit', 300, 4], ['Cargo insurance filing', 150, 2]], fixedMo: 900, glMo: 160, wcRate: 0.09, season: S.moving,
    boosts: { college: 1.15, military: 1.2, tech: 1.1 }, risks: ['liability', 'equipment', 'labor'], funding: ['sba', 'micro', 'family', 'equipment'] });

  // ---------- Hospitality & Entertainment ----------
  T({ id: 'escaperoom', name: 'Escape room', cat: 'hospitality', xp: 'hospitality', tourist: true,
    desc: 'Build puzzle rooms and book groups by the hour. Each room is a creative project; repeat players need new rooms.',
    keys: { creative: 0.45, management: 0.3, sales: 0.25 }, roles: ['host'], ownerHours: 40,
    space: { type: 'retail', sqft: 2500 }, price: 150, cogs: 0.03, el: 1.0, mPK: 0.6, cPK: 0.015, catch: 120, hpu: 1.6,
    startup: [['Three room builds', 60000, 'build'], ['Build-out', 20000, 'build'], ['Booking system', 800, 'other'], ['Branding', 4000, 'brand']],
    licenses: [['Fire & occupancy inspection', 400, 4], bizLicense], fixedMo: 800, glMo: 70,
    boosts: { tourism: 1.3, college: 1.25, tech: 1.15, corporate: 1.1 } });

  T({ id: 'venue', name: 'Event venue', cat: 'hospitality', xp: 'hospitality', tourist: true,
    desc: 'A renovated barn or warehouse for weddings and parties. Fridays and Saturdays in peak season pay for the whole year.',
    keys: { sales: 0.4, management: 0.35, creative: 0.25 }, roles: ['eventstaff', 'manager'], ownerHours: 40,
    space: { type: 'industrial', sqft: 6000 }, price: 6500, cogs: 0.15, el: 0.9, mPK: 0.02, cPK: 0.01, catch: 400, hpu: 40,
    startup: [['Renovation', 120000, 'build'], ['Tables, chairs & AV', 30000, 'equip'], ['Branding & site', 6000, 'brand']],
    licenses: [['Assembly occupancy permit', 800, 8], ['Liquor catering permit', 500, 6]], fixedMo: 1500, glMo: 200, season: S.wedding,
    boosts: { tourism: 1.3, wine: 1.2, affluent: 1.2, rural: 1.1 }, risks: ['liability', 'regulatory'] });

  T({ id: 'inn', name: 'Boutique inn / short-term rentals', cat: 'hospitality', xp: 'hospitality', strBan: true, tourist: true,
    desc: 'Lease and furnish a few units for nightly guests. Some cities tightly restrict short-term rentals; New York City effectively bans them.',
    keys: { management: 0.4, creative: 0.3, sales: 0.3 }, roles: ['housekeeper'], ownerHours: 30,
    space: { type: 'residential', sqft: 3000 }, price: 210, cogs: 0.27, el: 1.2, mPK: 2, cPK: 0.02, catch: 200, hpu: 1.0, unitsCap: 28,
    startup: [['Furnishing four units', 40000, 'equip'], ['Smart locks & tech', 2500, 'equip'], ['Photography & listings', 1500, 'brand']],
    licenses: [['Short-term rental permit', 600, 6], ['Lodging tax registration', 0, 2], ['Fire inspection', 300, 3]], fixedMo: 1600, glMo: 120,
    season: S.summer, boosts: { tourism: 1.9, ski: 1.6, outdoor: 1.2, wine: 1.3 }, risks: ['liability', 'regulatory', 'platform'] });

  // ---------- Real Estate ----------
  T({ id: 'flip', name: 'House flipping', cat: 'realestate', xp: 'realestate', engine: 'projects',
    desc: 'Buy distressed houses, renovate, sell. Profits depend on the buy price, the rehab budget, and mortgage rates when you list.',
    keys: { finance: 0.35, craft: 0.35, management: 0.3 }, roles: ['carpenter', 'pm'], ownerHours: 40, setupHours: 30,
    projects: [
      { id: 'cosmetic', name: 'Cosmetic flip (starter home)', hours: 260, cost: 35000, buy: 220000, lump: true, listWeeks: 6, cogs: 0 },
      { id: 'gut', name: 'Gut renovation', hours: 600, cost: 95000, buy: 160000, lump: true, listWeeks: 8, cogs: 0 },
      { id: 'duplex', name: 'Duplex rehab', hours: 450, cost: 70000, buy: 280000, lump: true, listWeeks: 10, cogs: 0 },
    ],
    startup: [['Tools & trailer', 9000, 'equip'], ['LLC, title & legal setup', 2500, 'other']],
    licenses: [bizLicense], fixedMo: 250, glMo: 120, wcRate: 0.06, cardFees: false, risks: ['liability'], funding: ['hardmoney', 'family'] });
})();

// Custom business builder: turns a short questionnaire into a template.
G.MODELS = [
  { id: 'walkin', name: 'Walk-in customers', engine: 'traffic', blurb: 'A storefront or location people visit: shops, studios, eateries.', base: { price: 25, cogs: 0.35, el: 1.1, mPK: 40, cPK: 0.15, catch: 80, hpu: 0.25, cov: 60 } },
  { id: 'appointments', name: 'Appointments & jobs', engine: 'traffic', blurb: 'You go to customers or book them: services, repairs, lessons.', base: { price: 150, cogs: 0.12, el: 1.0, mPK: 2.5, cPK: 0.1, catch: 200, hpu: 3, cov: 0 } },
  { id: 'clients', name: 'Business clients', engine: 'traffic', blurb: 'Big-ticket B2B projects with invoices and payment terms.', base: { price: 6000, cogs: 0.1, el: 0.8, mPK: 0.008, cPK: 0.012, catch: 1500, hpu: 60, payLag: 4, network: true, cardFees: false } },
  { id: 'online', name: 'Online orders', engine: 'traffic', blurb: 'You ship products nationwide and buy customers with ads.', base: { price: 40, cogs: 0.35, el: 1.1, mPK: 0.03, comp: 2000, cac: 30, hpu: 0.12, online: true } },
  { id: 'members', name: 'Memberships & subscriptions', engine: 'subscription', blurb: 'People pay monthly: software, clubs, boxes, communities.', base: { sub: { price: 30, cogs: 0.2, churn: 0.05, cac: 60, organic: 3, salesYield: 0.01 }, online: true } },
  { id: 'releases', name: 'Creative releases', engine: 'projects', blurb: 'You make things that sell over time: books, games, music, courses.', base: { projects: [
    { id: 'small', name: 'Small release', hours: 150, cost: 1500, price: 20, units: 120, decay: 0.9, tail: 4, cogs: 0.3, hit: 0.03 },
    { id: 'big', name: 'Major release', hours: 700, cost: 12000, price: 30, units: 500, decay: 0.92, tail: 12, cogs: 0.3, hit: 0.05 } ], online: true } },
  { id: 'grow', name: 'Grow or raise it', engine: 'harvest', blurb: 'Crops, animals, anything with a growing cycle.', base: { harvest: { unit: 'plot', units0: 2, unitCost: 5000, opex: 60, labor: 8, cycle: 10, value: 4500, wholesale: 0.5 } } },
];

G.SPACE_TYPES = {
  home: { label: 'Home-based', sqft: 0 },
  retail: { label: 'Storefront', sqft: 1200 },
  office: { label: 'Office', sqft: 800 },
  industrial: { label: 'Workshop / warehouse', sqft: 2500 },
  kitchen: { label: 'Commercial kitchen', sqft: 1200 },
  lab: { label: 'Lab space', sqft: 1200 },
};

G.biz = G.biz || {};

G.biz.buildCustom = function (o) {
  // o: { name, what, model, price, margin, space, budget, skills:[a,b], license, cat }
  const model = G.MODELS.find((m) => m.id === o.model) || G.MODELS[0];
  const base = JSON.parse(JSON.stringify(model.base));
  const keys = {};
  const sk = (o.skills && o.skills.length ? o.skills : ['sales', 'management']).slice(0, 3);
  sk.forEach((k, i) => { keys[k] = [0.5, 0.3, 0.2][i]; });
  const space = o.space && o.space !== 'home' ? { type: o.space, sqft: G.SPACE_TYPES[o.space].sqft } : null;
  const budget = o.budget || 20000;
  const startup = [];
  if (space) startup.push(['Build-out', Math.round(budget * 0.35), 'build']);
  startup.push(['Equipment & tools', Math.round(budget * (space ? 0.35 : 0.55)), 'equip']);
  startup.push(['Opening inventory & supplies', Math.round(budget * (space ? 0.18 : 0.3)), 'inv']);
  startup.push(['Brand & website', Math.round(budget * 0.12), 'brand']);
  const t = Object.assign({
    id: 'custom', custom: true, name: o.name || 'My business', cat: o.cat || 'services', xp: G.CAT_XP[o.cat || 'services'],
    desc: o.what || 'Your own idea.', engine: model.engine, keys, roles: ['crew', 'manager'], ownerHours: 45,
    space, startup, licenses: [['Local business license', 150, 2]].concat(o.license ? [['Industry license / permit', 1200, 8]] : []).concat(space ? [['Certificate of occupancy', 350, 3]] : []),
    setupHours: model.engine === 'subscription' ? 300 : 80, fixedMo: space ? 900 : 200, glMo: 70, wcRate: 0.02, season: G.SEASONS.flat,
    boosts: {}, risks: ['liability'], funding: ['sba', 'micro', 'family', 'crowd', 'angel'], cardFees: true, cov: 0, payLag: 0, el: 1.1, catch: 100,
  }, base);
  if (o.price) {
    if (t.engine === 'subscription') t.sub.price = o.price;
    else if (t.engine === 'projects') t.projects.forEach((p, i) => { p.price = o.price * (i ? 1.4 : 1); });
    else if (t.engine === 'harvest') t.harvest.value = Math.round(t.harvest.value * o.price / 100);
    else {
      // Keep revenue per customer-hour sensible when the ticket size changes.
      const ratio = o.price / t.price;
      t.price = o.price;
      t.mPK = t.mPK / ratio;
      t.hpu = t.hpu * Math.sqrt(ratio);
      if (t.cac) t.cac = t.cac * Math.sqrt(ratio);
    }
  }
  if (o.margin != null) {
    const cogs = G.util.clamp(1 - o.margin, 0.02, 0.85);
    if (t.engine === 'subscription') t.sub.cogs = cogs;
    else if (t.engine === 'projects') t.projects.forEach((p) => { p.cogs = cogs; });
    else t.cogs = cogs;
  }
  if (t.engine === 'harvest') t.roles = ['farmhand'];
  if (t.engine === 'subscription') t.roles = ['engineer', 'salesrep', 'support', 'coach'];
  if (t.engine === 'projects') t.roles = ['writer', 'designer', 'gamedev'];
  if (model.id === 'clients') t.roles = ['consultant', 'salesrep', 'pm'];
  if (model.id === 'online') t.roles = ['packer', 'designer'];
  if (space && t.engine === 'subscription') t.sub.local = { maxPerK: 6, cPK: 0.12, catch: 80 };
  if (space && t.engine === 'subscription') { t.online = false; t.sub.perStaff = 60; t.roles = ['coach', 'manager']; }
  return t;
};

G.CAT_XP = { food: 'food', retail: 'retail', tech: 'tech', media: 'media', ag: 'ag', science: 'bio', services: 'services', trades: 'trades', making: 'making', transport: 'logistics', hospitality: 'hospitality', health: 'health', realestate: 'realestate' };

G.BIZ = {};
G.BIZ_LIST.forEach((t) => { G.BIZ[t.id] = t; });
