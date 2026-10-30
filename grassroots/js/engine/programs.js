// Public programs. A library of real-world program designs across policy areas (child welfare,
// small business, economic diversification, workforce, rural, seniors, mental health, justice
// reform, early childhood and more), plus programs players invent. A program is administered by
// a named office, paid for out of a real budget line, and once enacted lives on the books in
// F.programs: it eases the problems it targets (scaled by funding and the agency's efficiency),
// creates jobs, can lift potential growth, and reports what it delivers each year.
var GR = globalThis.GR || (globalThis.GR = {});

GR.prog = (function () {
  const U = GR.util;
  const FX = () => GR.fisc;

  // How the money moves. jobs: thousand jobs per $1B a year; repay: share returned (loan funds).
  const MECH = {
    grants: { name: 'Competitive grants', part: 'opex', jobs: 9, verb: 'award competitive grants to', lean: 0.1 },
    services: { name: 'Direct services & staff', part: 'opex', jobs: 11, verb: 'hire staff and deliver services to', lean: 0.2 },
    payments: { name: 'Payments to people', part: 'opex', jobs: 4, verb: 'make direct payments to', lean: 0.4 },
    loans: { name: 'Revolving loan fund', part: 'capex', jobs: 18, verb: 'make loans to', lean: -0.1 },
    capital: { name: 'Capital construction', part: 'capex', jobs: 8, verb: 'build and repair facilities for', lean: 0.1 },
    credit: { name: 'Tax credit', part: 'opex', jobs: 6, verb: 'provide refundable tax credits to', lean: -0.3 },
  };

  // Loan terms. rec: what comes back each year once the fund matures, per dollar lent a year
  // (after defaults and forgiveness); years: how long until the first loans are fully repaying.
  const TERMS = {
    low: { name: 'Low-interest loans (2%)', desc: 'Below-market loans that banks would not make. Most are repaid; defaults and the interest subsidy cost about 15%.', rec: 0.85, years: 5, jobs: 1, lean: 0 },
    market: { name: 'Market-rate loans', desc: 'Priced like a bank, so the fund earns a little over time. Fewer borrowers qualify, so it does less good.', rec: 1.04, years: 5, jobs: 0.7, lean: -0.3 },
    forgive: { name: 'Forgivable loans', desc: 'Forgiven if the borrower meets goals (stays open, hires, stays in the state). Most never come back.', rec: 0.3, years: 4, jobs: 1.15, lean: 0.3 },
  };

  // Policy areas: who runs programs at each level (budget line + the office named in the bill),
  // the problems the area touches, and the words people use for it.
  const AREAS = {
    children: { name: 'Children & families', ag: { state: ['hs'], nation: ['hhs'], city: ['parks', 'admin'], school: ['support'] }, office: { state: 'Division of Family & Children Services', nation: 'Administration for Children and Families', city: 'Office of Children & Families', school: 'Student Services Office' }, tgt: { poverty: 0.4, opioid: 0.1 }, tilt: 'poverty', kw: 'child children kids kid family families foster adoption custody abuse neglect welfare parenting parents youth' },
    smallbiz: { name: 'Small business', ag: { state: ['gen'], nation: ['doc'], city: ['econ'] }, office: { state: 'Department of Economic Development', nation: 'Small Business Administration', city: 'Office of Small Business' }, tgt: { poverty: 0.15, migration: 0.15 }, tilt: 'none', kw: 'small business businesses entrepreneur entrepreneurs entrepreneurship startup startups storefront storefronts shop shops main street restaurant restaurants owners microloan microloans' },
    diversify: { name: 'Economic development & diversification', ag: { state: ['hied', 'gen'], nation: ['doc', 'doe'], city: ['econ'] }, office: { state: 'Department of Economic Development', nation: 'Economic Development Administration', city: 'Economic Development Department' }, tgt: { energy: 0.6, migration: 0.35 }, tilt: 'none', kw: 'diversify diversification economy economic development industry industries cluster clusters manufacturing semiconductor semiconductors biotech innovation recruit investment growth' },
    workforce: { name: 'Workforce & job training', ag: { state: ['hied', 'gen'], nation: ['dol'], city: ['econ'], school: ['instr'] }, office: { state: 'Workforce Development Board', nation: 'Employment and Training Administration', city: 'Workforce Development Office', school: 'Career & Technical Education Office' }, tgt: { poverty: 0.3, migration: 0.2, energy: 0.15 }, tilt: 'poverty', kw: 'job jobs training apprentice apprenticeship apprenticeships workforce skills credential credentials trade trades vocational career careers retrain retraining reskilling employment unemployed workers' },
    rural: { name: 'Agriculture & rural communities', ag: { state: ['gen', 'env'], nation: ['usda'] }, office: { state: 'Department of Agriculture', nation: 'Department of Agriculture', city: 'Office of Neighborhoods' }, tgt: { poverty: 0.15, migration: 0.2 }, tilt: 'rural', kw: 'rural farm farms farmer farmers farming agriculture agricultural ranch ranchers food small-town towns countryside' },
    seniors: { name: 'Seniors & aging', ag: { state: ['hs', 'mcd'], nation: ['hhs'], city: ['parks', 'admin'] }, office: { state: 'Division of Aging Services', nation: 'Administration for Community Living', city: 'Department of Aging' }, tgt: { health: 0.25, poverty: 0.15 }, tilt: 'age', kw: 'senior seniors elderly aging older retirees grandparents nursing caregivers caregiver' },
    disability: { name: 'Disability services', ag: { state: ['mcd', 'hs'], nation: ['hhs', 'ssa'], city: ['admin'], school: ['sped'] }, office: { state: 'Division of Developmental Disabilities', nation: 'Administration for Community Living', city: 'Mayor\'s Office for People with Disabilities', school: 'Special Education Office' }, tgt: { health: 0.25, poverty: 0.15 }, tilt: 'none', kw: 'disability disabilities disabled autism special needs accessibility accessible wheelchair' },
    mental: { name: 'Mental health & addiction', ag: { state: ['mcd', 'gen'], nation: ['hhs'], city: ['fire', 'admin'], school: ['support'] }, office: { state: 'Department of Behavioral Health', nation: 'Substance Abuse and Mental Health Services Administration', city: 'Office of Behavioral Health', school: 'Student Wellness Office' }, tgt: { opioid: 0.45, health: 0.25, homeless: 0.2, crime: 0.1 }, tilt: 'none', kw: 'mental health behavioral therapy therapist therapists counseling counselors suicide crisis psychiatric depression anxiety addiction substance' },
    justice: { name: 'Criminal justice reform & reentry', ag: { state: ['corr'], nation: ['doj'], city: ['police', 'admin'] }, office: { state: 'Department of Corrections', nation: 'Department of Justice', city: 'Office of Violence Prevention' }, tgt: { crime: 0.35, poverty: 0.1 }, tilt: 'urban', kw: 'prison prisons jail jails reentry recidivism incarceration incarcerated sentencing parole probation inmates expungement justice reform diversion court courts' },
    publichealth: { name: 'Public health', ag: { state: ['gen', 'mcd'], nation: ['hhs'], city: ['fire', 'admin'] }, office: { state: 'Department of Public Health', nation: 'Centers for Disease Control and Prevention', city: 'Health Department' }, tgt: { health: 0.4 }, tilt: 'poverty', kw: 'public health maternal mothers pregnancy prenatal infant hospital hospitals clinic clinics vaccine vaccines disease obesity diabetes dental doctors nurses' },
    highered: { name: 'Higher education & student debt', ag: { state: ['hied'], nation: ['ed'] }, office: { state: 'Board of Regents', nation: 'Department of Education', city: 'Office of Education' }, tgt: { migration: 0.4, education: 0.15 }, tilt: 'young', kw: 'college colleges university universities tuition student students loan loans debt scholarship scholarships degree graduates campus' },
    k12: { name: 'K-12 schools', ag: { state: ['k12'], nation: ['ed'], school: ['instr'], city: ['parks'] }, office: { state: 'Department of Education', nation: 'Department of Education', school: 'Office of Teaching & Learning', city: 'Office of Education' }, tgt: { education: 0.5 }, tilt: 'young', kw: 'school schools teacher teachers student students classroom classrooms reading literacy math tutoring tutors curriculum learning' },
    earlyed: { name: 'Early childhood & child care', ag: { state: ['hs', 'k12'], nation: ['hhs', 'ed'], city: ['parks'], school: ['instr'] }, office: { state: 'Department of Early Care and Learning', nation: 'Office of Child Care', city: 'Office of Early Childhood', school: 'Early Learning Office' }, tgt: { education: 0.3, poverty: 0.3 }, tilt: 'young', kw: 'child care childcare daycare day care pre-k prek preschool pre-kindergarten toddlers infants early childhood head start babies' },
    housing: { name: 'Housing', ag: { state: ['hs', 'gen'], nation: ['hud'], city: ['housing'] }, office: { state: 'Housing Finance Authority', nation: 'Department of Housing and Urban Development', city: 'Housing Department' }, tgt: { housing: 0.45, homeless: 0.15 }, tilt: 'urban', kw: 'housing home homes homeowners homebuyers rent renters tenants eviction evictions apartment apartments mortgage down payment vacant blight landlord' },
    transport: { name: 'Transportation & transit', ag: { state: ['dot'], nation: ['dot'], city: ['transit', 'works'], school: ['trans'] }, office: { state: 'Department of Transportation', nation: 'Department of Transportation', city: 'Transportation Department', school: 'Transportation Office' }, tgt: { infra: 0.4 }, tilt: 'urban', kw: 'transit bus buses rail train trains subway bike bikes biking sidewalk sidewalks street streets traffic pedestrian commute commuters fare fares' },
    broadband: { name: 'Broadband & technology', ag: { state: ['gen', 'dot'], nation: ['doc'], city: ['works', 'econ'], school: ['tech'] }, office: { state: 'Broadband Office', nation: 'National Telecommunications and Information Administration', city: 'Department of Technology', school: 'Technology Office' }, tgt: { migration: 0.25, education: 0.1, poverty: 0.1 }, tilt: 'rural', kw: 'broadband internet wifi wi-fi digital technology tech computers laptops devices connectivity online cyber cybersecurity' },
    environment: { name: 'Environment & conservation', ag: { state: ['env'], nation: ['epa', 'doi'], city: ['parks', 'water'] }, office: { state: 'Department of Environmental Protection', nation: 'Environmental Protection Agency', city: 'Department of the Environment' }, tgt: { disaster: 0.3, water: 0.25 }, tilt: 'none', kw: 'environment environmental conservation parks park trees tree canopy wildlife pollution clean air lead pipes rivers lakes forests forest wildfire wildfires heat climate green' },
    energy: { name: 'Energy', ag: { state: ['env'], nation: ['doe'], city: ['works'] }, office: { state: 'State Energy Office', nation: 'Department of Energy', city: 'Office of Sustainability' }, tgt: { energy: 0.3, disaster: 0.15 }, tilt: 'none', kw: 'energy solar wind electric electricity grid power utility utilities efficiency weatherization batteries battery nuclear geothermal' },
    veterans: { name: 'Veterans', ag: { state: ['gen', 'hs'], nation: ['va'], city: ['admin'] }, office: { state: 'Department of Veterans Services', nation: 'Department of Veterans Affairs', city: 'Office of Veterans Affairs' }, tgt: { veterans: 0.4, homeless: 0.1 }, tilt: 'vets', kw: 'veteran veterans va military service members troops gold star' },
    arts: { name: 'Arts, culture & tourism', ag: { state: ['gen'], nation: ['doi', 'doc'], city: ['parks', 'econ'] }, office: { state: 'Council on the Arts & Tourism Office', nation: 'National Endowment for the Arts', city: 'Office of Arts & Culture' }, tgt: { migration: 0.15 }, tilt: 'urban', kw: 'arts art artists culture cultural music museum museums theater tourism tourists festival festivals film creative history historic' },
    safety: { name: 'Policing & public safety', ag: { state: ['police'], nation: ['doj', 'dhs'], city: ['police', 'fire'] }, office: { state: 'State Patrol', nation: 'Department of Justice', city: 'Police Department' }, tgt: { crime: 0.45 }, tilt: 'urban', kw: 'police officers officer cops law enforcement safety 911 dispatch firefighters paramedics ems emergency response body cameras' },
    gov: { name: 'Government reform & ethics', ag: { state: ['gen'], nation: ['treas', 'state'], city: ['admin'], school: ['admin'] }, office: { state: 'Office of Planning and Budget', nation: 'Office of Management and Budget', city: 'Office of the City Administrator', school: 'Business Office' }, tgt: { debt: 0.2 }, tilt: 'none', kw: 'government ethics transparency corruption lobbying lobbyists accountability modernize modernization digital permits permitting efficiency waste bureaucracy' },
    food: { name: 'Hunger & nutrition', ag: { state: ['hs'], nation: ['usda'], city: ['parks', 'admin'], school: ['food'] }, office: { state: 'Division of Family Assistance', nation: 'Food and Nutrition Service', city: 'Office of Food Policy', school: 'School Nutrition Office' }, tgt: { poverty: 0.3, health: 0.1 }, tilt: 'poverty', kw: 'food hunger hungry meals meal nutrition pantry pantries grocery groceries desert deserts snap wic lunch breakfast' },
    immigrants: { name: 'Immigrant integration', ag: { state: ['hs'], nation: ['dhs', 'state'], city: ['admin'] }, office: { state: 'Office of New Americans', nation: 'U.S. Citizenship and Immigration Services', city: 'Office of Immigrant Affairs' }, tgt: { poverty: 0.15, migration: 0.15, border: 0.1 }, tilt: 'urban', kw: 'immigrant immigrants immigration refugees refugee citizenship newcomers asylum english language' },
  };

  // The library: [key, area, name, what it does, mechanism, extras].
  // extras: tgt (adds to the area's), lv (levels allowed), size (× the standard size), pot (growth),
  // lean (-1 right … +1 left), unit/cost (what $ buys, for reports), bases (power-base reactions), kw.
  const P = (k, area, name, desc, mech, x = {}) => Object.assign({ k, area, name, desc, mech }, x);
  const CATALOG = [
    // Children & families / child welfare
    P('cw_workforce', 'children', 'Child Welfare Workforce & Caseload Caps', 'hire child-protective caseworkers, cap caseloads at 15 families, and raise caseworker pay to cut turnover', 'services', { lv: ['state', 'nation'], unit: 'children with a caseworker under the cap', cost: 9000, kw: 'caseworker caseworkers caseload caseloads cps protective services dfcs reform', bases: { labor: 2, parents: 2 } }),
    P('cw_prevention', 'children', 'Family Preservation & Prevention Services', 'fund in-home parenting, mental-health and addiction services that keep children safely with their families instead of in foster care', 'services', { lv: ['state', 'nation'], tgt: { opioid: 0.15 }, unit: 'families served', cost: 7500, kw: 'prevention preservation in-home family first keep together reunification', lean: 0.2 }),
    P('cw_kinship', 'children', 'Kinship Care & Foster Family Support', 'pay monthly stipends to grandparents and relatives raising children, and recruit and train more foster families', 'payments', { lv: ['state', 'nation'], unit: 'children placed with kin or foster families', cost: 6000, kw: 'kinship grandparents relatives foster parents stipend stipends recruit', bases: { church: 2, parents: 2 } }),
    P('cw_agingout', 'children', 'Extended Foster Care to Age 21', 'let youth stay in foster care to 21 with housing, college and job help as they age out', 'payments', { lv: ['state', 'nation'], tgt: { homeless: 0.2 }, unit: 'young adults supported', cost: 18000, kw: 'aging out age out 21 former foster youth transition' }),
    P('cw_reform', 'children', 'Child Welfare Accountability & Reform', 'create an independent child-welfare ombudsman, publish outcomes, and modernize the case-management system', 'services', { lv: ['state', 'nation', 'city'], size: 0.35, eff: 4, lean: 0, unit: 'cases reviewed', cost: 1500, kw: 'ombudsman accountability oversight reform overhaul fix broken system modernize', bases: { press: 2 } }),
    P('cw_homevisit', 'children', 'Nurse Home Visiting for New Parents', 'send nurses to visit first-time, low-income parents through a child\'s second birthday', 'services', { tgt: { health: 0.15 }, unit: 'families visited', cost: 5500, kw: 'home visiting nurses newborn newborns new parents mothers' }),
    // Small business
    P('sb_loans', 'smallbiz', 'Small Business Revolving Loan Fund', 'capitalize a loan fund, run with community lenders, that lends to small businesses that banks turn down', 'loans', { lv: ['state', 'nation', 'city'], unit: 'businesses financed', cost: 60000, kw: 'loan loans lending credit capital cdfi microloan microloans access', bases: { business: 3 }, ind: { retail: 0.5, finance: 0.3 } }),
    P('sb_grants', 'smallbiz', 'Main Street Small Business Grants', 'award grants of up to $50,000 to small businesses for equipment, expansion and hiring', 'grants', { unit: 'businesses funded', cost: 35000, kw: 'grant grants main street storefront relief help support', bases: { business: 3, local: 2 }, ind: { retail: 0.6 }, lean: 0 }),
    P('sb_equity', 'smallbiz', 'Minority & Women-Owned Business Accelerator', 'fund technical assistance, mentoring, contracting set-asides and startup capital for minority- and women-owned businesses', 'grants', { tgt: { poverty: 0.15 }, unit: 'businesses accelerated', cost: 25000, kw: 'minority women women-owned black-owned latino disadvantaged equity accelerator incubator', lean: 0.5, bases: { business: 1, base: 2 } }),
    P('sb_startup', 'smallbiz', 'Startup & Innovation Fund', 'match federal SBIR grants and co-invest with private venture funds in young technology companies', 'loans', { lv: ['state', 'nation', 'city'], tgt: { migration: 0.2, energy: 0.1 }, pot: 0.02, unit: 'startups backed', cost: 400000, kw: 'startup startups venture innovation tech technology sbir seed angel founders', ind: { tech: 0.8 }, bases: { business: 2 } }),
    P('sb_storefront', 'smallbiz', 'Storefront Improvement Program', 'pay for façade, accessibility and code upgrades in older commercial corridors', 'capital', { lv: ['city', 'state'], tgt: { crime: 0.05 }, unit: 'storefronts improved', cost: 45000, kw: 'storefront facade corridor corridors downtown vacant retail', bases: { business: 2, neighborhoods: 2 } }),
    P('sb_licensing', 'smallbiz', 'Small Business Red Tape Relief', 'create a one-stop permit and licensing portal and waive first-year fees for new businesses', 'services', { size: 0.3, eff: 3, unit: 'new businesses registered', cost: 900, kw: 'red tape permit permits licensing license licenses fees one-stop regulations', lean: -0.4, bases: { business: 3 } }),
    // Diversification & economic development
    P('dv_cluster', 'diversify', 'Advanced Industries Cluster Initiative', 'build industry clusters in semiconductors, biotech, aerospace and advanced manufacturing with site-readiness grants, supplier development and university partnerships', 'grants', { lv: ['state', 'nation', 'city'], pot: 0.04, tgt: { energy: 0.2 }, unit: 'jobs supported', cost: 45000, kw: 'cluster clusters semiconductor semiconductors chips biotech aerospace advanced manufacturing recruit', ind: { manufacturing: 0.8, tech: 0.4 }, bases: { business: 3, labor: 1 } }),
    P('dv_research', 'diversify', 'University Research Commercialization Fund', 'fund university research labs and the spinout companies that commercialize their discoveries', 'capital', { lv: ['state', 'nation'], pot: 0.05, tgt: { migration: 0.25 }, unit: 'research projects', cost: 900000, kw: 'research university universities lab labs innovation commercialization patents science', ind: { tech: 0.6, education: 0.5 } }),
    P('dv_sites', 'diversify', 'Shovel-Ready Industrial Sites Program', 'buy, permit and connect utilities to industrial sites so companies can build quickly', 'capital', { lv: ['state', 'city'], pot: 0.02, unit: 'acres made site-ready', cost: 120000, kw: 'sites site shovel-ready industrial park megasite land utilities', ind: { construction: 0.6, manufacturing: 0.5 }, bases: { business: 2 } }),
    P('dv_transition', 'diversify', 'Energy Communities Transition Fund', 'help coal, oil and gas towns replace lost jobs and tax base with new employers, retraining and bridge payments to local governments', 'grants', { lv: ['state', 'nation'], tgt: { energy: 0.4, poverty: 0.15 }, tilt: 'rural', unit: 'workers retrained or placed', cost: 30000, kw: 'coal oil gas transition energy communities miners mining towns diversify diversification', bases: { labor: 3, local: 2 } }),
    P('dv_tourism', 'diversify', 'Tourism & Outdoor Recreation Economy Fund', 'market the region and build trails, waterfronts and visitor facilities to grow the visitor economy', 'grants', { tgt: { energy: 0.15 }, unit: 'visitor projects', cost: 1500000, kw: 'tourism tourists outdoor recreation trails visitors hospitality', ind: { hospitality: 0.8 }, bases: { business: 2 } }),
    // Workforce
    P('wf_apprentice', 'workforce', 'Registered Apprenticeship Expansion', 'pay employers to train apprentices in skilled trades, health care and technology, with union and community-college partners', 'grants', { unit: 'apprentices trained', cost: 12000, kw: 'apprentice apprentices apprenticeship apprenticeships trades skilled union', bases: { labor: 4, business: 1 } }),
    P('wf_credential', 'workforce', 'Short-Term Credential Scholarships', 'pay tuition for short certificate programs in high-demand fields like nursing, welding, trucking and IT', 'payments', { unit: 'workers earning credentials', cost: 5000, kw: 'credential credentials certificate certificates nursing welding trucking cdl it scholarships community college', bases: { business: 1 } }),
    P('wf_youth', 'workforce', 'Youth Summer Jobs Program', 'give teenagers paid summer jobs and mentoring in public agencies, nonprofits and local businesses', 'payments', { lv: ['city', 'state', 'nation'], tgt: { crime: 0.15 }, tilt: 'urban', unit: 'youth employed', cost: 3200, kw: 'youth teen teens teenagers summer jobs young people', bases: { parents: 2 } }),
    P('wf_retrain', 'workforce', 'Displaced Worker Retraining', 'help workers laid off by automation, plant closures or trade retrain and find new jobs', 'services', { tgt: { energy: 0.1 }, unit: 'workers retrained', cost: 8000, kw: 'laid off layoffs displaced automation ai plant closure retrain retraining reskill', bases: { labor: 3 } }),
    P('wf_cte', 'workforce', 'Career & Technical Education in High Schools', 'expand career academies, dual enrollment and industry certifications in high schools', 'grants', { lv: ['school', 'state', 'nation'], tgt: { education: 0.2 }, unit: 'students in career programs', cost: 2500, kw: 'cte career technical vocational high school dual enrollment academies shop', bases: { parents: 2, business: 1 } }),
    // Rural & agriculture
    P('ru_farmers', 'rural', 'Beginning Farmer & Local Food Program', 'help new farmers buy land and equipment and connect farms to schools, hospitals and grocery stores', 'grants', { lv: ['state', 'nation'], unit: 'farms supported', cost: 40000, kw: 'farmer farmers beginning young farm local food farmland', ind: { ag: 1 }, bases: { farm: 4 } }),
    P('ru_water', 'rural', 'Farm Water Conservation Cost-Share', 'share the cost of drip irrigation, soil-moisture sensors and water-saving practices on farms', 'grants', { lv: ['state', 'nation'], tgt: { water: 0.4 }, unit: 'acres conserved', cost: 400, kw: 'irrigation water conservation drought aquifer soil', ind: { ag: 0.8 }, bases: { farm: 3, environment: 2 } }),
    P('ru_hospital', 'rural', 'Rural Hospital Stabilization Fund', 'keep struggling rural hospitals open with stabilization grants and help converting to rural emergency hospitals', 'grants', { lv: ['state', 'nation'], tgt: { health: 0.35 }, unit: 'hospitals stabilized', cost: 4000000, kw: 'rural hospital hospitals closing closures emergency care', ind: { healthcare: 0.6 }, bases: { local: 3, seniors: 2 } }),
    P('ru_mainstreet', 'rural', 'Small Town Revitalization Grants', 'fund downtown revitalization, water systems and community buildings in towns under 20,000 people', 'capital', { lv: ['state', 'nation'], unit: 'towns funded', cost: 800000, kw: 'small town towns downtown revitalization community', bases: { local: 3 } }),
    // Seniors
    P('sr_home', 'seniors', 'Aging in Place: Home Care for Seniors', 'pay for in-home care aides, home modifications and caregiver respite so seniors can stay home instead of nursing homes', 'services', { unit: 'seniors served at home', cost: 14000, kw: 'home care aging in place caregivers respite aides nursing home', bases: { seniors: 4, labor: 1 } }),
    P('sr_meals', 'seniors', 'Senior Meals & Nutrition Expansion', 'expand Meals on Wheels and congregate meals at senior centers', 'services', { tgt: { poverty: 0.05 }, unit: 'meals a year', cost: 9, kw: 'meals on wheels senior centers nutrition', bases: { seniors: 3, church: 1 } }),
    P('sr_property', 'seniors', 'Senior Property Tax Relief', 'give low- and fixed-income seniors a credit against rising property taxes', 'credit', { lv: ['state', 'city'], unit: 'households relieved', cost: 900, kw: 'property tax relief fixed income homeowners circuit breaker freeze', lean: -0.2, bases: { seniors: 4, taxpayers: 2 } }),
    // Disability
    P('ds_waitlist', 'disability', 'Clear the Disability Services Waitlist', 'fund home- and community-based services for people with intellectual and developmental disabilities now on the waitlist', 'services', { lv: ['state', 'nation'], unit: 'people taken off the waitlist', cost: 45000, kw: 'waitlist waiting list waiver hcbs developmental intellectual', bases: { parents: 2 } }),
    P('ds_employment', 'disability', 'Employment First for People with Disabilities', 'fund job coaches and employer incentives to hire people with disabilities at competitive wages', 'grants', { unit: 'people employed', cost: 9000, kw: 'employment job coaches hire hiring competitive wages' }),
    // Mental health & addiction
    P('mh_crisis', 'mental', '988 Crisis Line & Mobile Crisis Teams', 'staff the 988 crisis line and send mental-health teams, not police, to people in crisis', 'services', { tgt: { crime: 0.1 }, unit: 'crisis calls answered', cost: 450, kw: '988 crisis line mobile teams responders hotline suicide', lean: 0.3, bases: { police: 1 } }),
    P('mh_clinics', 'mental', 'Community Behavioral Health Clinics', 'build and staff clinics that offer same-day mental health and addiction treatment regardless of ability to pay', 'capital', { lv: ['state', 'nation', 'city'], unit: 'patients treated', cost: 3500, kw: 'clinic clinics ccbhc treatment centers outpatient', ind: { healthcare: 0.6 } }),
    P('mh_schools', 'mental', 'School-Based Mental Health Counselors', 'put a counselor or social worker in every school', 'services', { lv: ['school', 'state', 'nation'], tgt: { education: 0.15 }, unit: 'students with access to a counselor', cost: 250, kw: 'school counselors social workers students teens youth', bases: { parents: 3, teachers: 2 } }),
    P('mh_recovery', 'mental', 'Addiction Treatment & Recovery Housing', 'expand medication-assisted treatment and certified recovery housing', 'services', { tgt: { opioid: 0.25, homeless: 0.1 }, unit: 'people in treatment', cost: 7000, kw: 'treatment recovery rehab detox medication-assisted suboxone methadone sober housing' }),
    // Justice reform
    P('cj_reentry', 'justice', 'Reentry & Second Chance Employment', 'give people leaving prison job placement, housing help, ID and record clearing so they do not return', 'services', { lv: ['state', 'nation', 'city'], tgt: { poverty: 0.1 }, unit: 'people reentering', cost: 6000, kw: 'reentry second chance returning citizens recidivism released record clearing expungement', lean: 0.3, bases: { church: 2 } }),
    P('cj_diversion', 'justice', 'Drug Courts & Pretrial Diversion', 'route low-level, nonviolent defendants with addiction or mental illness into treatment instead of jail', 'services', { tgt: { opioid: 0.2 }, unit: 'people diverted', cost: 5000, kw: 'drug court courts diversion pretrial treatment instead jail nonviolent', lean: 0.2 }),
    P('cj_cvi', 'justice', 'Community Violence Intervention', 'fund street outreach workers and hospital-based programs that interrupt cycles of shootings', 'grants', { lv: ['city', 'state', 'nation'], tgt: { crime: 0.15 }, unit: 'high-risk people reached', cost: 9000, kw: 'violence interrupters interruption outreach shootings gun violence community', lean: 0.4 }),
    P('cj_victims', 'justice', 'Crime Victims Services & Rape Kit Backlog', 'clear the rape-kit backlog and fund victim advocates, shelters and compensation', 'services', { unit: 'victims served', cost: 3000, kw: 'victims victim rape kit backlog domestic violence shelters advocates', lean: -0.1, bases: { police: 2 } }),
    P('cj_prison', 'justice', 'Prison Education & Job Training', 'offer GED, college and job-training programs inside prisons', 'services', { lv: ['state', 'nation'], tgt: { education: 0.05 }, unit: 'incarcerated students', cost: 4000, kw: 'prison education inmates ged college behind bars training', lean: 0.3 }),
    // Public health
    P('ph_maternal', 'publichealth', 'Maternal Health & Postpartum Care', 'extend postpartum coverage, fund doulas and midwives, and open maternity care in places that lost it', 'services', { unit: 'mothers served', cost: 4000, kw: 'maternal mothers moms pregnancy postpartum doulas midwives birth infant mortality', bases: { parents: 2 } }),
    P('ph_dental', 'publichealth', 'Community Health Centers & Dental Access', 'expand community health centers and mobile dental clinics in underserved areas', 'capital', { unit: 'patients served', cost: 1200, kw: 'community health centers dental dentists teeth underserved primary care', ind: { healthcare: 0.7 } }),
    P('ph_workforce', 'publichealth', 'Doctors & Nurses for Underserved Areas', 'repay student loans for doctors, nurses and dentists who practice in shortage areas', 'payments', { tgt: { migration: 0.1 }, unit: 'clinicians placed', cost: 60000, kw: 'doctor doctors nurse nurses shortage loan repayment physicians', bases: { local: 2 } }),
    P('ph_prevention', 'publichealth', 'Chronic Disease Prevention', 'fund diabetes, heart-disease and obesity prevention through clinics, schools and community groups', 'grants', { unit: 'people reached', cost: 300, kw: 'prevention chronic diabetes obesity heart disease wellness smoking' }),
    // Higher education
    P('he_promise', 'highered', 'College Promise Scholarships', 'cover tuition and fees at public colleges for students from families earning under $100,000', 'payments', { lv: ['state', 'nation', 'city'], unit: 'students', cost: 4500, kw: 'promise free tuition scholarships college affordable', lean: 0.4, bases: { parents: 3 } }),
    P('he_loans', 'highered', 'Student Loan Repayment for Public Service', 'repay student loans for teachers, nurses, social workers and others who stay and work in the state', 'payments', { tgt: { education: 0.1 }, unit: 'borrowers helped', cost: 8000, kw: 'student loan loans debt repayment forgiveness public service teachers nurses stay', lean: 0.3 }),
    P('he_completion', 'highered', 'College Completion & Student Success', 'fund advisers, emergency grants and child care so students who start college finish', 'services', { lv: ['state', 'nation'], unit: 'students supported', cost: 2000, kw: 'completion graduate graduation dropout advisers success retention' }),
    // K-12
    P('k12_tutoring', 'k12', 'High-Dosage Tutoring', 'give struggling students tutoring three times a week in small groups during the school day', 'services', { unit: 'students tutored', cost: 1800, kw: 'tutoring tutors struggling behind catch up learning loss', bases: { parents: 3, teachers: 1 } }),
    P('k12_literacy', 'k12', 'Science of Reading Literacy Initiative', 'retrain teachers in phonics-based reading instruction and put reading coaches in early grades', 'services', { unit: 'students reached', cost: 350, kw: 'reading literacy phonics read third grade coaches', bases: { parents: 3 } }),
    P('k12_pay', 'k12', 'Teacher Pay & Recruitment', 'raise teacher salaries and pay signing bonuses in hard-to-staff schools and subjects', 'services', { size: 1.6, unit: 'teachers', cost: 6000, kw: 'teacher teachers pay salary salaries raise raises bonuses recruit shortage', bases: { teachers: 5, labor: 1 } }),
    P('k12_meals', 'k12', 'Free School Meals for All', 'serve free breakfast and lunch to every student', 'services', { tgt: { poverty: 0.2 }, unit: 'students fed', cost: 900, kw: 'free meals lunch breakfast universal hungry students', lean: 0.4, bases: { parents: 3 } }),
    P('k12_afterschool', 'k12', 'After-School & Summer Learning', 'fund after-school and summer programs in tutoring, coding, robotics, arts and sports', 'grants', { tgt: { crime: 0.05 }, unit: 'students enrolled', cost: 1500, kw: 'after-school afterschool after school summer coding code computer science stem robotics enrichment camps', bases: { parents: 3 } }),
    P('k12_buildings', 'k12', 'School Building Repair & Safety', 'fix roofs, heating, air quality and security in aging schools', 'capital', { unit: 'schools repaired', cost: 2500000, kw: 'school buildings repair hvac air conditioning roofs security safety facilities', ind: { construction: 0.6 }, bases: { parents: 2 } }),
    // Early childhood
    P('ee_prek', 'earlyed', 'Universal Pre-K', 'offer free, full-day pre-kindergarten to every four-year-old', 'services', { size: 1.4, tgt: { education: 0.15 }, unit: 'four-year-olds enrolled', cost: 10000, kw: 'pre-k prek preschool four-year-olds universal kindergarten', lean: 0.4, bases: { parents: 4, teachers: 1 } }),
    P('ee_childcare', 'earlyed', 'Child Care Affordability & Provider Grants', 'cap child care costs for working families and give providers grants to raise pay and open more slots', 'payments', { unit: 'children in care', cost: 9000, kw: 'child care childcare daycare affordable providers slots working parents', bases: { parents: 4, business: 1 } }),
    // Housing
    P('ho_downpay', 'housing', 'First-Time Homebuyer Down-Payment Assistance', 'give first-time buyers forgivable loans for down payments and closing costs', 'payments', { unit: 'families buying homes', cost: 25000, kw: 'first-time homebuyer homebuyers down payment closing costs buy homeownership', bases: { neighborhoods: 2 } }),
    P('ho_landbank', 'housing', 'Land Bank & Vacant Home Rehab', 'acquire vacant and tax-delinquent properties, rehab them, and sell them to owner-occupants', 'capital', { lv: ['city', 'state'], tgt: { crime: 0.05 }, unit: 'homes rehabbed', cost: 90000, kw: 'land bank vacant blight abandoned rehab tax-delinquent', bases: { neighborhoods: 3 } }),
    P('ho_repair', 'housing', 'Home Repair & Weatherization', 'pay for roofs, furnaces, accessibility and weatherization for low-income and senior homeowners', 'capital', { tgt: { poverty: 0.1 }, unit: 'homes repaired', cost: 15000, kw: 'repair repairs weatherization roofs furnace homeowners fix up', bases: { seniors: 2, neighborhoods: 2 } }),
    P('ho_counsel', 'housing', 'Right to Counsel in Eviction Court', 'guarantee tenants facing eviction a lawyer', 'services', { lv: ['city', 'state'], tgt: { homeless: 0.2 }, unit: 'tenants represented', cost: 2500, kw: 'eviction evictions counsel lawyer tenants right', lean: 0.6, bases: { neighborhoods: 2, business: -2 } }),
    P('ho_rental', 'housing', 'Emergency Rental Assistance', 'help families behind on rent with one-time payments that prevent eviction', 'payments', { tgt: { homeless: 0.15 }, unit: 'households kept housed', cost: 4500, kw: 'rental assistance behind on rent emergency', lean: 0.3 }),
    // Transportation
    P('tr_fare', 'transport', 'Reduced-Fare Transit', 'cut fares for low-income riders, students and seniors and fund more frequent service', 'payments', { lv: ['city', 'state'], tgt: { poverty: 0.1 }, unit: 'riders', cost: 400, kw: 'fare fares free transit bus riders frequency service', lean: 0.4 }),
    P('tr_safety', 'transport', 'Safe Streets (Vision Zero)', 'redesign dangerous roads with crosswalks, protected bike lanes and traffic calming', 'capital', { unit: 'miles redesigned', cost: 1500000, kw: 'safe streets vision zero crosswalks pedestrians bike lanes traffic deaths speeding' }),
    P('tr_rural', 'transport', 'Rural Roads & Bridges Fund', 'repair county roads and small bridges in rural areas', 'capital', { lv: ['state', 'nation'], tilt: 'rural', unit: 'bridges and road miles', cost: 1200000, kw: 'rural roads county bridges potholes', bases: { local: 3, farm: 2 } }),
    // Broadband & technology
    P('bb_rural', 'broadband', 'Broadband for Every Home', 'build high-speed internet to unserved homes and businesses', 'capital', { unit: 'homes connected', cost: 6000, kw: 'broadband internet unserved high-speed fiber rural connect', ind: { tech: 0.4, construction: 0.4 }, bases: { local: 3, farm: 2 } }),
    P('bb_digital', 'broadband', 'Digital Skills & Device Access', 'give low-income families devices and digital-skills training', 'grants', { unit: 'people trained', cost: 500, kw: 'digital literacy skills devices laptops computers divide' }),
    P('bb_cyber', 'broadband', 'Cybersecurity for Local Governments & Schools', 'protect local governments, schools and hospitals from ransomware', 'services', { eff: 2, unit: 'agencies protected', cost: 120000, kw: 'cyber cybersecurity ransomware hackers attacks' }),
    // Environment & energy
    P('en_lead', 'environment', 'Lead Pipe Replacement', 'replace every lead service line feeding homes and schools', 'capital', { tgt: { water: 0.35, health: 0.1 }, unit: 'lead lines replaced', cost: 10000, kw: 'lead pipes pipe service lines drinking water poisoning', ind: { construction: 0.6 }, bases: { parents: 2, environment: 2 } }),
    P('en_trees', 'environment', 'Urban Tree Canopy & Heat Resilience', 'plant trees and build cooling centers in the hottest neighborhoods', 'capital', { lv: ['city', 'state'], tgt: { disaster: 0.15 }, unit: 'trees planted', cost: 600, kw: 'trees tree canopy heat cooling shade urban', bases: { environment: 3, neighborhoods: 2 } }),
    P('en_wildfire', 'environment', 'Wildfire Prevention & Forest Health', 'thin overgrown forests, clear brush near towns and hire seasonal crews', 'services', { lv: ['state', 'nation'], tgt: { disaster: 0.35 }, unit: 'acres treated', cost: 1500, kw: 'wildfire wildfires forest forests thinning brush fire prevention', bases: { local: 2, environment: 1 } }),
    P('en_land', 'environment', 'Parks & Conservation Land Fund', 'buy and protect open space, river corridors and parks', 'capital', { unit: 'acres protected', cost: 8000, kw: 'parks park conservation open space land protect rivers trails', bases: { environment: 4 } }),
    P('en_flood', 'environment', 'Flood Buyouts & Resilience', 'buy out homes that flood repeatedly and restore wetlands to absorb storms', 'capital', { tgt: { disaster: 0.3 }, unit: 'homes bought out', cost: 250000, kw: 'flood floods flooding buyouts wetlands storm surge resilience' }),
    P('eg_rebates', 'energy', 'Home Energy Efficiency & Solar Rebates', 'pay rebates for heat pumps, insulation and rooftop solar, with bigger rebates for low-income households', 'payments', { tgt: { disaster: 0.05 }, unit: 'homes upgraded', cost: 4000, kw: 'rebates heat pumps insulation solar rooftop efficiency bills', lean: 0.4, bases: { environment: 3 }, ind: { construction: 0.4 } }),
    P('eg_grid', 'energy', 'Grid Reliability & Storage', 'harden the power grid and add battery storage to prevent blackouts', 'capital', { lv: ['state', 'nation'], tgt: { disaster: 0.2 }, unit: 'megawatts of storage', cost: 1200000, kw: 'grid blackouts outages reliability storage batteries power', ind: { energy: 0.5, construction: 0.4 }, bases: { business: 2 } }),
    // Veterans
    P('vt_homeless', 'veterans', 'End Veteran Homelessness', 'house every homeless veteran with vouchers, case managers and supportive housing', 'services', { tgt: { homeless: 0.15 }, unit: 'veterans housed', cost: 22000, kw: 'homeless veterans housing', bases: { military: 3 } }),
    P('vt_jobs', 'veterans', 'Veterans Jobs & Licensing', 'turn military training into civilian licenses and pay employers to hire veterans', 'grants', { unit: 'veterans hired', cost: 6000, kw: 'jobs hiring licensing licenses employment transition', bases: { military: 3, business: 1 } }),
    P('vt_mental', 'veterans', 'Veteran Mental Health & Suicide Prevention', 'fund peer counselors and community care for veterans with PTSD', 'services', { tgt: { opioid: 0.05 }, unit: 'veterans served', cost: 5000, kw: 'ptsd suicide mental health peer counselors', bases: { military: 4 } }),
    // Arts & tourism
    P('ar_grants', 'arts', 'Arts & Culture Grants', 'fund local arts organizations, artists and cultural festivals', 'grants', { unit: 'organizations funded', cost: 30000, kw: 'arts artists culture museums theater music festivals', lean: 0.4, ind: { hospitality: 0.4 } }),
    P('ar_film', 'arts', 'Film & Creative Industries Incentive', 'offer rebates to film, TV, music and game productions that hire locally', 'credit', { lv: ['state', 'city'], unit: 'productions', cost: 1500000, kw: 'film movies tv television production studio music games', ind: { hospitality: 0.3, tech: 0.3 }, bases: { business: 2 } }),
    // Public safety
    P('ps_recruit', 'safety', 'Police Recruitment & Retention', 'pay hiring and retention bonuses and expand the academy to fill officer vacancies', 'services', { unit: 'officers hired or kept', cost: 30000, kw: 'police officers recruit recruitment retention hiring bonuses academy vacancies', lean: -0.4, bases: { police: 5, neighborhoods: 1 } }),
    P('ps_cameras', 'safety', 'Body Cameras & De-escalation Training', 'equip every officer with a body camera and fund de-escalation training', 'services', { size: 0.4, eff: 2, unit: 'officers equipped and trained', cost: 4000, kw: 'body cameras bodycams de-escalation training accountability', lean: 0.2 }),
    P('ps_911', 'safety', '911 & Emergency Response Modernization', 'modernize 911 dispatch and cut emergency response times', 'capital', { unit: 'calls handled', cost: 60, kw: '911 dispatch response times emergency ambulance ems firefighters', bases: { police: 2 } }),
    // Government reform
    P('gv_digital', 'gov', 'Digital Government & Permit Modernization', 'put permits, licenses and benefits online and cut processing times in half', 'capital', { size: 0.6, eff: 4, pot: 0.01, unit: 'transactions moved online', cost: 25, kw: 'digital online permits licenses modernize modernization backlog processing', lean: -0.1, bases: { business: 2, taxpayers: 1 } }),
    P('gv_ethics', 'gov', 'Ethics, Lobbying & Transparency Reform', 'create an independent ethics commission, require real-time lobbying disclosure and post all spending online', 'services', { size: 0.15, eff: 2, unit: 'filings reviewed', cost: 800, kw: 'ethics lobbying lobbyists transparency corruption disclosure watchdog', bases: { press: 3, donors: -2 } }),
    P('gv_rainy', 'gov', 'Rainy-Day Fund & Pension Reserve', 'set aside money each year in a reserve for recessions and pension debt', 'capital', { lv: ['state', 'city'], size: 1.5, tgt: { pension: 0.3, debt: 0.2 }, unit: 'dollars reserved', cost: 1, kw: 'rainy day reserve reserves savings fund pension debt', lean: -0.3, bases: { taxpayers: 2 } }),
    // Hunger
    P('fd_banks', 'food', 'Food Bank & Pantry Grants', 'fund food banks and pantries and buy food from local farms', 'grants', { unit: 'meals provided', cost: 3, kw: 'food bank banks pantry pantries hunger', bases: { church: 3, farm: 1 } }),
    P('fd_deserts', 'food', 'Healthy Food Access in Food Deserts', 'help grocery stores open in neighborhoods without one', 'loans', { lv: ['city', 'state', 'nation'], tgt: { health: 0.1 }, unit: 'stores opened', cost: 2000000, kw: 'food desert deserts grocery store stores fresh', bases: { neighborhoods: 3 } }),
    // Immigrant integration
    P('im_legal', 'immigrants', 'Immigrant Legal Services & Citizenship', 'fund legal help, citizenship classes and English instruction', 'services', { unit: 'people served', cost: 2500, kw: 'legal services citizenship naturalization english classes lawyers deportation', lean: 0.7 }),
    P('im_credential', 'immigrants', 'Credential Recognition for Immigrant Professionals', 'help immigrant doctors, nurses and engineers get licensed to work in their fields', 'grants', { unit: 'professionals licensed', cost: 6000, kw: 'credential credentials licensed licensing professionals doctors engineers', lean: 0.3, bases: { business: 1 } }),
  ];
  const BYK = Object.fromEntries(CATALOG.map((p) => [p.k, p]));

  // Standard (annual) size as a share of the government's total spending.
  const SIZE = { nation: 0.0003, state: 0.0012, city: 0.004, school: 0.004 };
  const SCALE = { pilot: 0.35, standard: 1, major: 2.5 };

  const lvOk = (p, jur) => (!p.lv || p.lv.includes(jur)) && !!AREAS[p.area].ag[jur];
  function forLevel(jur) { return CATALOG.filter((p) => lvOk(p, jur)); }
  function agencyFor(J, area) {
    const A = AREAS[area];
    const keys = (A && A.ag[J.k]) || [];
    return keys.map((k) => J.F.ag.find((a) => a.k === k)).find(Boolean) || J.F.ag.find((a) => a.cat === 'admin') || J.F.ag[0];
  }
  const officeFor = (J, area) => (AREAS[area] && AREAS[area].office[J.k]) || 'the responsible agency';

  // A program design → the record kept on the books (also used for programs players invent).
  // spec: { k?, name, desc, area, mech, scale, tgt?, ag? }
  function design(s, J, spec) {
    const base = spec.k ? BYK[spec.k] : null;
    const area = spec.area || (base && base.area);
    const A = AREAS[area] || AREAS.gov;
    const M = MECH[spec.mech || (base && base.mech)] || MECH.services;
    const loan = M === MECH.loans ? (TERMS[spec.terms] ? spec.terms : 'low') : null;
    const Tm = loan && TERMS[loan];
    const full = Math.round(FX().totals(J).spend * SIZE[J.k] * ((base && base.size) || 1));
    const amt = Math.round(full * (SCALE[spec.scale] || 1));
    const ag = (spec.ag && J.F.ag.find((a) => a.k === spec.ag)) || agencyFor(J, area);
    const tgt = spec.tgtOnly ? Object.assign({}, spec.tgtOnly) : Object.assign({}, A.tgt, (base && base.tgt) || {});
    Object.keys(tgt).forEach((k) => { if (!J.F.crises[k]) delete tgt[k]; });
    return {
      k: spec.k || 'custom', name: spec.name || (base && base.name) || 'New Program', desc: spec.desc || (base && base.desc) || '', area, mech: spec.mech || (base && base.mech), ag: ag.k,
      office: officeFor(J, area), amt, full, tgt, jobs: M.jobs * (Tm ? Tm.jobs : 1) * amt / 1e9, jpb: M.jobs * (Tm ? Tm.jobs : 1), pot: ((base && base.pot) || 0) * Math.sqrt(amt / Math.max(1, full)),
      lean: U.clamp(((base && base.lean) != null ? base.lean : M.lean) + (Tm ? Tm.lean : 0), -1, 1), tilt: (base && base.tilt) || A.tilt, eff: ((base && base.eff) || 0) + (M.eff || 0),
      unit: (base && base.unit) || 'people served', cost: (base && base.cost) || 5000, bases: (base && base.bases) || {}, ind: (base && base.ind) || {},
      terms: loan, rec: Tm ? Tm.rec : 0, years: Tm ? Tm.years : 0,
    };
  }
  // Provisions that fund it: the appropriation, loan repayments, and management effects.
  function provFor(J, d, prov) {
    const M = MECH[d.mech] || MECH.services;
    const v = prov.ap[d.ag] || (prov.ap[d.ag] = {});
    v[M.part] = (v[M.part] || 0) + d.amt;
    if (d.eff) prov.eff[d.ag] = (prov.eff[d.ag] || 0) + Math.round(d.eff * Math.sqrt(d.amt / Math.max(1, d.full)));
    prov.prog = (prov.prog || []).concat([d]);
    return prov;
  }
  function sectionText(J, d) {
    const M = MECH[d.mech] || MECH.services;
    const who = d.desc ? d.desc.replace(/\.$/, '') : `${M.verb} eligible people and organizations`;
    const Tm = d.terms && TERMS[d.terms];
    const loans = Tm ? ` Loans are made as ${Tm.name.toLowerCase().replace(/ \(.*\)/, '')}${d.terms === 'low' ? ' at 2% interest' : ''}${d.terms === 'forgive' ? ', forgiven when the borrower meets the program\'s goals' : ''}. Repayments of principal and interest, expected to reach about ${U.money(d.amt * d.rec)} a year within ${d.years} years, are deposited in the general fund.` : '';
    return `There is established within the ${d.office} the ${d.name}, which shall ${who}. There is appropriated ${U.money(d.amt)} a year for the program.${loans} The ${d.office} shall report each year on the number of ${d.unit} and on results.`;
  }

  // ---------- On the books ----------
  const list = (J) => (J.F.programs || []);
  // Funding relative to the standard design, with diminishing returns, times how well the agency runs.
  function strength(F, p) {
    const a = F.ag.find((x) => x.k === p.ag);
    return Math.pow(U.clamp(p.amt / Math.max(1, p.full), 0, 2.5), 0.7) * (0.6 + (a ? a.eff : 60) / 150);
  }
  // Called from the crisis model: how much programs ease crisis k this quarter.
  function mitigation(F, k) { let m = 0; (F.programs || []).forEach((p) => { if (p.tgt[k]) m += p.tgt[k] * 0.06 * strength(F, p); }); return m; }
  function potBoost(F) { return Math.tanh(U.sum(F.programs || [], (p) => p.pot) * 4) / 4; }
  function jobsK(F) { return U.sum(F.programs || [], (p) => (p.jpb != null ? p.jpb * (p.amt || 0) / 1e9 : p.jobs)); }
  function onApply(J, prov) {
    if (!prov.prog || !prov.prog.length) return;
    // Unfunded authorizations start at zero and wait for the budget.
    J.F.programs = (J.F.programs || []).concat(prov.prog.map((p) => Object.assign({}, p, { q0: J.F.q || 0 }, prov.approp ? { auth: p.amt, amt: 0, jobs: 0 } : {})));
  }
  // Loan repayments this year: each year's loans start repaying the next, building to amt × rec.
  function repaid(F, p, q) { return p.rec ? p.amt * p.rec * U.clamp(((q != null ? q : F.q || 0) - (p.q0 || 0)) / 4 / p.years, 0, 1) : 0; }
  function repayments(F) { return U.sum(F.programs || [], (p) => repaid(F, p)); }
  // What each program delivered this year.
  function report(J) { return list(J).map((p) => ({ p, served: Math.round(p.amt / Math.max(1, p.cost)) })); }

  // ---------- Matching ideas ----------
  const words = (x) => String(x).toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
  const STOP = new Set('the a an and or of to in on for with by from at is are be our my we i it this that more less new all every state city program programs fund funding create make help give provide support'.split(' '));
  function match(s, jur, text) {
    const ws = words(text).filter((w) => !STOP.has(w));
    const set = new Set(ws);
    const areaHits = {};
    Object.entries(AREAS).forEach(([k, A]) => { areaHits[k] = words(A.kw).filter((w) => set.has(w)).length; });
    const out = forLevel(jur).map((p) => {
      const kw = new Set(words(p.kw + ' ' + p.name).filter((w) => !STOP.has(w)));
      const own = ws.filter((w) => kw.has(w)).length;
      const sc = own * 2 + (areaHits[p.area] || 0) * 1.2 + (own && areaHits[p.area] ? 1 : 0);
      return { p, sc };
    }).filter((x) => x.sc >= 2).sort((a, b) => b.sc - a.sc);
    const bestArea = Object.entries(areaHits).filter(([k]) => AREAS[k].ag[jur]).sort((a, b) => b[1] - a[1])[0];
    return { progs: out.slice(0, 6), area: bestArea && bestArea[1] > 0 ? bestArea[0] : null };
  }
  // Which mechanism a free-text idea implies.
  function mechOf(text) {
    const t = String(text).toLowerCase();
    if (/\bloan|revolving|lend|financ/.test(t)) return 'loans';
    if (/\btax credit|credit against|rebate/.test(t)) return 'credit';
    if (/\bbuild|construct|repair|renovat|facilit|center\b|centers\b|clinic/.test(t)) return 'capital';
    if (/\bstipend|payment|pay families|cash|voucher|scholarship|subsid|assistance/.test(t)) return 'payments';
    if (/\bgrant/.test(t)) return 'grants';
    return 'services';
  }

  return { TERMS, repaid, repayments, MECH, AREAS, CATALOG, BYK, SCALE, forLevel, agencyFor, officeFor, design, provFor, sectionText, list, strength, mitigation, potBoost, jobsK, onApply, report, match, mechOf };
})();
