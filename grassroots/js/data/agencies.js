// Real-world agencies, programs and tax structures by level of government.
// State rows: transportation, corrections, Medicaid agency, Medicaid program, K-12 agency,
// higher-education system, state police, environmental agency, human-services agency,
// cash-assistance (TANF) program, food-assistance (SNAP) program name.
// Tax rows: corporate rate %, state sales tax rate %, carbon price $/ton (cap-and-trade / RGGI), severance tax %.
var GR = globalThis.GR || (globalThis.GR = {});

GR.STATE_AGENCIES = {
  AL: ['ALDOT', 'ADOC', 'Alabama Medicaid Agency', 'Alabama Medicaid', 'ALSDE', 'ACHE', 'ALEA', 'ADEM', 'DHR', 'Family Assistance', 'SNAP'],
  AK: ['DOT&PF', 'Alaska DOC', 'Alaska DOH', 'Alaska Medicaid', 'DEED', 'University of Alaska', 'Alaska State Troopers', 'ADEC', 'Alaska DOH (Public Assistance)', 'ATAP', 'SNAP'],
  AZ: ['ADOT', 'ADCRR', 'AHCCCS', 'AHCCCS', 'ADE', 'Arizona Board of Regents', 'AZDPS', 'ADEQ', 'DES', 'Cash Assistance', 'Nutrition Assistance'],
  AR: ['ARDOT', 'Arkansas DOC', 'Arkansas DHS', 'ARHOME', 'Arkansas DESE', 'ADHE', 'Arkansas State Police', 'Arkansas DEQ', 'Arkansas DHS', 'TEA', 'SNAP'],
  CA: ['Caltrans', 'CDCR', 'DHCS', 'Medi-Cal', 'CDE', 'UC & CSU', 'CHP', 'CalEPA', 'CDSS', 'CalWORKs', 'CalFresh'],
  CO: ['CDOT', 'CDOC', 'HCPF', 'Health First Colorado', 'CDE', 'CDHE', 'Colorado State Patrol', 'CDPHE', 'CDHS', 'Colorado Works', 'SNAP'],
  CT: ['CTDOT', 'CT DOC', 'CT DSS', 'HUSKY Health', 'CSDE', 'CSCU', 'Connecticut State Police', 'DEEP', 'CT DSS', 'Temporary Family Assistance', 'SNAP'],
  DE: ['DelDOT', 'Delaware DOC', 'DHSS', 'Diamond State Health Plan', 'DDOE', 'Delaware Higher Education Office', 'Delaware State Police', 'DNREC', 'DHSS (Social Services)', 'TANF', 'SNAP'],
  DC: ['DDOT', 'DC DOC', 'DHCF', 'DC Medicaid', 'OSSE', 'UDC', 'MPD', 'DOEE', 'DC DHS', 'TANF', 'SNAP'],
  FL: ['FDOT', 'FDC', 'AHCA', 'Florida Medicaid', 'FLDOE', 'State University System', 'Florida Highway Patrol', 'FDEP', 'DCF', 'Temporary Cash Assistance', 'Food Assistance'],
  GA: ['GDOT', 'GDC', 'DCH', 'Georgia Pathways', 'GaDOE', 'University System of Georgia', 'Georgia State Patrol', 'EPD', 'Georgia DHS', 'TANF', 'SNAP'],
  HI: ['HDOT', 'DCR', 'DHS Med-QUEST', 'Med-QUEST', 'HIDOE', 'University of Hawaii', 'DLE', 'DOH Environmental Health', 'Hawaii DHS', 'TANF', 'SNAP'],
  ID: ['ITD', 'IDOC', 'Idaho DHW', 'Idaho Medicaid', 'Idaho SDE', 'Idaho State Board of Education', 'Idaho State Police', 'Idaho DEQ', 'Idaho DHW', 'TAFI', 'SNAP'],
  IL: ['IDOT', 'IDOC', 'HFS', 'HealthChoice Illinois', 'ISBE', 'IBHE', 'Illinois State Police', 'Illinois EPA', 'IDHS', 'TANF', 'SNAP'],
  IN: ['INDOT', 'IDOC', 'FSSA', 'Healthy Indiana Plan', 'IDOE', 'Indiana CHE', 'Indiana State Police', 'IDEM', 'FSSA', 'TANF', 'SNAP'],
  IA: ['Iowa DOT', 'Iowa DOC', 'Iowa HHS', 'IA Health Link', 'Iowa Department of Education', 'Board of Regents', 'Iowa State Patrol', 'Iowa DNR', 'Iowa HHS', 'Family Investment Program', 'Food Assistance'],
  KS: ['KDOT', 'KDOC', 'KDHE', 'KanCare', 'KSDE', 'Kansas Board of Regents', 'Kansas Highway Patrol', 'KDHE Environment', 'DCF', 'TANF', 'Food Assistance'],
  KY: ['KYTC', 'KYDOC', 'CHFS', 'Kentucky Medicaid', 'KDE', 'CPE', 'Kentucky State Police', 'Energy & Environment Cabinet', 'CHFS', 'K-TAP', 'SNAP'],
  LA: ['DOTD', 'DPS&C', 'LDH', 'Healthy Louisiana', 'LDOE', 'Board of Regents', 'Louisiana State Police', 'LDEQ', 'DCFS', 'FITAP', 'SNAP'],
  ME: ['MaineDOT', 'Maine DOC', 'Maine DHHS', 'MaineCare', 'Maine DOE', 'University of Maine System', 'Maine State Police', 'Maine DEP', 'Maine DHHS', 'TANF', 'SNAP'],
  MD: ['MDOT', 'DPSCS', 'MDH', 'Maryland Medicaid', 'MSDE', 'MHEC', 'Maryland State Police', 'MDE', 'Maryland DHS', 'Temporary Cash Assistance', 'Food Supplement Program'],
  MA: ['MassDOT', 'Massachusetts DOC', 'EOHHS', 'MassHealth', 'DESE', 'Department of Higher Education', 'Massachusetts State Police', 'MassDEP', 'DTA', 'TAFDC', 'SNAP'],
  MI: ['MDOT', 'MDOC', 'MDHHS', 'Healthy Michigan Plan', 'MDE', 'MiLEAP', 'Michigan State Police', 'EGLE', 'MDHHS', 'Family Independence Program', 'Food Assistance Program'],
  MN: ['MnDOT', 'Minnesota DOC', 'Minnesota DHS', 'Medical Assistance', 'MDE', 'Minnesota State', 'Minnesota State Patrol', 'MPCA', 'DCYF', 'MFIP', 'SNAP'],
  MS: ['MDOT', 'MDOC', 'Division of Medicaid', 'Mississippi Medicaid', 'MDE', 'IHL', 'Mississippi Highway Patrol', 'MDEQ', 'MDHS', 'TANF', 'SNAP'],
  MO: ['MoDOT', 'MODOC', 'MO DSS', 'MO HealthNet', 'DESE', 'MDHEWD', 'Missouri State Highway Patrol', 'MoDNR', 'MO DSS', 'Temporary Assistance', 'SNAP'],
  MT: ['MDT', 'Montana DOC', 'DPHHS', 'Montana Medicaid', 'OPI', 'Montana University System', 'Montana Highway Patrol', 'Montana DEQ', 'DPHHS', 'TANF', 'SNAP'],
  NE: ['NDOT', 'NDCS', 'Nebraska DHHS', 'Heritage Health', 'NDE', 'University of Nebraska', 'Nebraska State Patrol', 'NDEE', 'Nebraska DHHS', 'Aid to Dependent Children', 'SNAP'],
  NV: ['NDOT', 'NDOC', 'DHCFP', 'Nevada Medicaid', 'NDE', 'NSHE', 'Nevada Highway Patrol', 'NDEP', 'DWSS', 'TANF', 'SNAP'],
  NH: ['NHDOT', 'NHDOC', 'NH DHHS', 'Granite Advantage', 'NHED', 'USNH', 'New Hampshire State Police', 'NHDES', 'NH DHHS', 'FANF', 'SNAP'],
  NJ: ['NJDOT', 'NJDOC', 'NJ DHS', 'NJ FamilyCare', 'NJDOE', 'OSHE', 'New Jersey State Police', 'NJDEP', 'NJ DHS', 'WorkFirst NJ', 'SNAP'],
  NM: ['NMDOT', 'NMCD', 'Health Care Authority', 'Turquoise Care', 'PED', 'HED', 'New Mexico State Police', 'NMED', 'Health Care Authority', 'NM Works', 'SNAP'],
  NY: ['NYSDOT', 'DOCCS', 'NYS DOH', 'NY Medicaid', 'NYSED', 'SUNY & CUNY', 'New York State Police', 'DEC', 'OTDA', 'Family Assistance', 'SNAP'],
  NC: ['NCDOT', 'NCDAC', 'NC DHHS', 'NC Medicaid', 'NCDPI', 'UNC System', 'NC State Highway Patrol', 'NCDEQ', 'NC DHHS', 'Work First', 'Food and Nutrition Services'],
  ND: ['NDDOT', 'ND DOCR', 'ND HHS', 'ND Medicaid', 'NDDPI', 'NDUS', 'ND Highway Patrol', 'ND DEQ', 'ND HHS', 'TANF', 'SNAP'],
  OH: ['ODOT', 'ODRC', 'ODM', 'Ohio Medicaid', 'DEW', 'ODHE', 'Ohio State Highway Patrol', 'Ohio EPA', 'ODJFS', 'Ohio Works First', 'Food Assistance'],
  OK: ['ODOT', 'ODOC', 'OHCA', 'SoonerCare', 'OSDE', 'OSRHE', 'Oklahoma Highway Patrol', 'ODEQ', 'OKDHS', 'TANF', 'SNAP'],
  OR: ['ODOT', 'Oregon DOC', 'OHA', 'Oregon Health Plan', 'ODE', 'HECC', 'Oregon State Police', 'Oregon DEQ', 'ODHS', 'TANF', 'SNAP'],
  PA: ['PennDOT', 'PA DOC', 'PA DHS', 'Medical Assistance', 'PDE', 'PASSHE', 'Pennsylvania State Police', 'PA DEP', 'PA DHS', 'TANF', 'SNAP'],
  RI: ['RIDOT', 'RIDOC', 'EOHHS', 'RI Medicaid', 'RIDE', 'RIOPC', 'Rhode Island State Police', 'RIDEM', 'RI DHS', 'RI Works', 'SNAP'],
  SC: ['SCDOT', 'SCDC', 'SCDHHS', 'Healthy Connections', 'SCDE', 'SC CHE', 'SC Highway Patrol', 'SCDES', 'SC DSS', 'Family Independence', 'SNAP'],
  SD: ['SDDOT', 'SD DOC', 'SD DSS', 'SD Medicaid', 'SDDOE', 'SD Board of Regents', 'SD Highway Patrol', 'DANR', 'SD DSS', 'TANF', 'SNAP'],
  TN: ['TDOT', 'TDOC', 'Division of TennCare', 'TennCare', 'TDOE', 'THEC', 'Tennessee Highway Patrol', 'TDEC', 'TDHS', 'Families First', 'SNAP'],
  TX: ['TxDOT', 'TDCJ', 'HHSC', 'Texas Medicaid (STAR)', 'TEA', 'THECB', 'Texas DPS', 'TCEQ', 'HHSC', 'TANF', 'SNAP'],
  UT: ['UDOT', 'UDC', 'Utah DHHS', 'Utah Medicaid', 'USBE', 'USHE', 'Utah Highway Patrol', 'Utah DEQ', 'DWS', 'Family Employment Program', 'SNAP'],
  VT: ['VTrans', 'Vermont DOC', 'AHS (DVHA)', 'Green Mountain Care', 'Vermont AOE', 'Vermont State Colleges', 'Vermont State Police', 'Vermont DEC', 'Vermont DCF', 'Reach Up', '3SquaresVT'],
  VA: ['VDOT', 'VADOC', 'DMAS', 'Cardinal Care', 'VDOE', 'SCHEV', 'Virginia State Police', 'Virginia DEQ', 'VDSS', 'TANF', 'SNAP'],
  WA: ['WSDOT', 'Washington DOC', 'HCA', 'Apple Health', 'OSPI', 'WSAC', 'Washington State Patrol', 'Ecology', 'DSHS', 'WorkFirst', 'Basic Food'],
  WV: ['WVDOH', 'WVDCR', 'WV DoHS', 'WV Medicaid', 'WVDE', 'HEPC', 'West Virginia State Police', 'WVDEP', 'WV DoHS', 'WV WORKS', 'SNAP'],
  WI: ['WisDOT', 'Wisconsin DOC', 'Wisconsin DHS', 'BadgerCare Plus', 'DPI', 'Universities of Wisconsin', 'Wisconsin State Patrol', 'WDNR', 'DCF', 'Wisconsin Works (W-2)', 'FoodShare'],
  WY: ['WYDOT', 'WDOC', 'WDH', 'Wyoming Medicaid', 'WDE', 'University of Wyoming', 'Wyoming Highway Patrol', 'WY DEQ', 'DFS', 'POWER', 'SNAP'],
};

GR.STATE_TAX = {
  AL: [6.5, 4, 0, 0], AK: [9.4, 0, 0, 12], AZ: [4.9, 5.6, 0, 0], AR: [4.3, 6.5, 0, 0], CA: [8.84, 7.25, 30, 0], CO: [4.4, 2.9, 0, 3],
  CT: [7.5, 6.35, 21, 0], DE: [8.7, 0, 21, 0], DC: [8.25, 6, 0, 0], FL: [5.5, 6, 0, 0], GA: [5.39, 4, 0, 0], HI: [6.4, 4, 0, 0],
  ID: [5.3, 6, 0, 0], IL: [9.5, 6.25, 0, 0], IN: [4.9, 7, 0, 0], IA: [5.5, 6, 0, 0], KS: [6.5, 6.5, 0, 0], KY: [5, 6, 0, 0],
  LA: [5.5, 5, 0, 3], ME: [8.93, 5.5, 21, 0], MD: [8.25, 6, 21, 0], MA: [8, 6.25, 21, 0], MI: [6, 6, 0, 0], MN: [9.8, 6.875, 0, 0],
  MS: [5, 7, 0, 0], MO: [4, 4.225, 0, 0], MT: [6.75, 0, 0, 4], NE: [5.2, 5.5, 0, 0], NV: [0, 6.85, 0, 0], NH: [7.5, 0, 21, 0],
  NJ: [9, 6.625, 21, 0], NM: [5.9, 4.875, 0, 4], NY: [7.25, 4, 21, 0], NC: [2.25, 4.75, 0, 0], ND: [4.31, 5, 0, 10], OH: [0.26, 5.75, 0, 0],
  OK: [4, 4.5, 0, 5], OR: [7.6, 0, 0, 0], PA: [7.99, 6, 0, 0], RI: [7, 7, 21, 0], SC: [5, 6, 0, 0], SD: [0, 4.2, 0, 0],
  TN: [6.5, 7, 0, 0], TX: [0.75, 6.25, 0, 4.6], UT: [4.55, 4.85, 0, 0], VT: [8.5, 6, 21, 0], VA: [6, 5.3, 0, 0], WA: [0, 6.5, 55, 0],
  WV: [6.5, 6, 0, 5], WI: [7.9, 5, 0, 0], WY: [0, 4, 0, 6],
};

// State industry clusters (used for district industry exposure).
GR.STATE_IND = {"AL":["defense","manufacturing"],"AK":["energy","ag","tourism"],"AZ":["tech","tourism","healthcare"],"AR":["retail","ag","logistics"],"CA":["tech","ag","healthcare"],"CO":["tourism","manufacturing","defense","tech"],"CT":["finance","manufacturing"],"DE":["finance","healthcare","tech"],"DC":["defense","finance","tech"],"FL":["tourism","healthcare","logistics"],"GA":["tech","logistics","ag"],"HI":["tourism","ag","defense"],"ID":["ag","tech","tourism"],"IL":["finance","manufacturing","ag","logistics"],"IN":["manufacturing","logistics","ag"],"IA":["ag","finance","manufacturing"],"KS":["ag","defense","manufacturing"],"KY":["manufacturing","ag"],"LA":["energy","manufacturing","ag","tourism"],"ME":["tourism","ag","manufacturing"],"MD":["healthcare","tech","defense","logistics"],"MA":["healthcare","tech","education"],"MI":["manufacturing"],"MN":["healthcare","manufacturing","finance","ag"],"MS":["ag","manufacturing","tourism"],"MO":["ag","healthcare","tech","logistics"],"MT":["ag","tourism","energy"],"NE":["ag","finance"],"NV":["tourism","logistics"],"NH":["tech","tourism","manufacturing"],"NJ":["healthcare","manufacturing","logistics","finance"],"NM":["energy","defense","tech"],"NY":["finance","tech"],"NC":["healthcare","tech","finance","manufacturing"],"ND":["energy","ag"],"OH":["manufacturing","healthcare"],"OK":["energy","ag","defense","manufacturing"],"OR":["manufacturing","retail","tourism"],"PA":["healthcare","education","manufacturing","energy"],"RI":["healthcare","tourism"],"SC":["manufacturing","tourism"],"SD":["finance","ag","tourism"],"TN":["tourism","healthcare","logistics"],"TX":["energy","tech","ag"],"UT":["tech","tourism"],"VT":["manufacturing","ag","tourism"],"VA":["defense","tech"],"WA":["tech","defense","manufacturing","retail","ag"],"WV":["energy","tourism"],"WI":["manufacturing","ag"],"WY":["energy","ag","tourism"]};

GR.INDUSTRIES = [
  { k: 'energy', name: 'Oil, gas & mining', share: 0.03 },
  { k: 'manufacturing', name: 'Manufacturing', share: 0.11 },
  { k: 'ag', name: 'Agriculture', share: 0.02 },
  { k: 'tech', name: 'Technology & media', share: 0.09 },
  { k: 'finance', name: 'Finance & insurance', share: 0.08 },
  { k: 'healthcare', name: 'Health care', share: 0.09 },
  { k: 'defense', name: 'Defense & government contracting', share: 0.04 },
  { k: 'tourism', name: 'Tourism & hospitality', share: 0.05 },
  { k: 'logistics', name: 'Transportation & logistics', share: 0.05 },
  { k: 'construction', name: 'Construction', share: 0.05 },
  { k: 'retail', name: 'Retail', share: 0.06 },
  { k: 'education', name: 'Education', share: 0.03 },
];

// Spending categories and how they move the economy.
//   sr: short-run multiplier per dollar; stock: which long-run capital stock the capital budget builds.
GR.SPEND_CATS = {
  infra: { name: 'Infrastructure', sr: 1.0, srOp: 0.8, stock: 'infra', ind: { construction: 1, logistics: 0.6, manufacturing: 0.2 } },
  rnd: { name: 'Research & development', sr: 0.7, srOp: 0.7, stock: 'rd', ind: { tech: 1, healthcare: 0.4, education: 0.4 } },
  edu: { name: 'Education', sr: 0.9, srOp: 0.9, stock: 'hum', ind: { education: 1 } },
  health: { name: 'Health', sr: 0.9, srOp: 0.9, stock: 'hum', ind: { healthcare: 1 } },
  social: { name: 'Social services', sr: 1.2, srOp: 1.2, stock: null, ind: { retail: 0.4 } },
  safety: { name: 'Public safety', sr: 0.7, srOp: 0.7, stock: null, ind: { defense: 0.2 } },
  defense: { name: 'Defense', sr: 0.6, srOp: 0.6, stock: 'rd', rdShare: 0.3, ind: { defense: 1, manufacturing: 0.4 } },
  env: { name: 'Environment & energy', sr: 0.8, srOp: 0.7, stock: 'infra', ind: { energy: 0.5, construction: 0.4, ag: 0.2 } },
  admin: { name: 'General government', sr: 0.5, srOp: 0.5, stock: null, ind: {} },
  agri: { name: 'Agriculture', sr: 0.9, srOp: 0.9, stock: null, ind: { ag: 1 } },
};

// Federal cabinet-level and major agencies (FY2027 estimates, $ billions: operations, capital).
// eff: audit/efficiency rating; deg: infrastructure/operational degradation index (higher = worse).
GR.FED_AGENCIES = [
  { k: 'dod', abbr: 'DOD', name: 'Department of Defense', cat: 'defense', opex: 545, capex: 330, eff: 34, deg: 44 },
  { k: 'hhs', abbr: 'HHS', name: 'Health and Human Services (NIH, CDC, FDA)', cat: 'health', opex: 95, capex: 48, eff: 58, deg: 38, rd: 0.6 },
  { k: 'ssa', abbr: 'SSA', name: 'Social Security Administration', cat: 'admin', opex: 15, capex: 1, eff: 70, deg: 52 },
  { k: 'dot', abbr: 'DOT', name: 'Department of Transportation', cat: 'infra', opex: 22, capex: 92, eff: 61, deg: 55 },
  { k: 'doe', abbr: 'DOE', name: 'Department of Energy', cat: 'rnd', opex: 22, capex: 30, eff: 55, deg: 47 },
  { k: 'ed', abbr: 'ED', name: 'Department of Education', cat: 'edu', opex: 76, capex: 4, eff: 57, deg: 35 },
  { k: 'dhs', abbr: 'DHS', name: 'Department of Homeland Security', cat: 'safety', opex: 86, capex: 21, eff: 46, deg: 42 },
  { k: 'doj', abbr: 'DOJ', name: 'Department of Justice', cat: 'safety', opex: 38, capex: 3, eff: 63, deg: 40 },
  { k: 'va', abbr: 'VA', name: 'Department of Veterans Affairs', cat: 'health', opex: 128, capex: 10, eff: 52, deg: 58 },
  { k: 'usda', abbr: 'USDA', name: 'Department of Agriculture', cat: 'agri', opex: 36, capex: 5, eff: 60, deg: 41 },
  { k: 'hud', abbr: 'HUD', name: 'Housing and Urban Development', cat: 'social', opex: 62, capex: 10, eff: 50, deg: 61 },
  { k: 'nasa', abbr: 'NASA', name: 'NASA', cat: 'rnd', opex: 10, capex: 15, eff: 62, deg: 45 },
  { k: 'nsf', abbr: 'NSF', name: 'National Science Foundation', cat: 'rnd', opex: 2, capex: 7, eff: 74, deg: 30 },
  { k: 'epa', abbr: 'EPA', name: 'Environmental Protection Agency', cat: 'env', opex: 6, capex: 3, eff: 59, deg: 39 },
  { k: 'state', abbr: 'State', name: 'Department of State & USAID', cat: 'admin', opex: 50, capex: 4, eff: 56, deg: 37 },
  { k: 'treas', abbr: 'Treasury', name: 'Treasury (IRS)', cat: 'admin', opex: 15, capex: 1, eff: 54, deg: 63, irs: true },
  { k: 'doi', abbr: 'DOI', name: 'Department of the Interior', cat: 'env', opex: 12, capex: 6, eff: 58, deg: 57 },
  { k: 'doc', abbr: 'Commerce', name: 'Department of Commerce (NOAA, Census)', cat: 'rnd', opex: 9, capex: 3, eff: 60, deg: 43 },
  { k: 'dol', abbr: 'DOL', name: 'Department of Labor', cat: 'social', opex: 14, capex: 1, eff: 61, deg: 39 },
];

// State agency templates: share of total state spending and the capital share of each line.
GR.STATE_AGENCY_TEMPLATE = [
  { k: 'mcd', idx: 2, role: 'Medicaid administration', cat: 'health', share: 0.025, cap: 0.05 },
  { k: 'k12', idx: 4, role: 'K-12 education', cat: 'edu', share: 0.22, cap: 0.06 },
  { k: 'hied', idx: 5, role: 'Higher education & research', cat: 'rnd', share: 0.10, cap: 0.16, rd: 0.5 },
  { k: 'dot', idx: 0, role: 'Transportation', cat: 'infra', share: 0.085, cap: 0.65 },
  { k: 'corr', idx: 1, role: 'Corrections', cat: 'safety', share: 0.035, cap: 0.08 },
  { k: 'police', idx: 6, role: 'State police', cat: 'safety', share: 0.014, cap: 0.08 },
  { k: 'env', idx: 7, role: 'Environmental protection', cat: 'env', share: 0.018, cap: 0.35 },
  { k: 'hs', idx: 8, role: 'Human services', cat: 'social', share: 0.045, cap: 0.02 },
  { k: 'gen', idx: -1, role: 'General government', cat: 'admin', share: 0.075, cap: 0.12, name: 'General Government & Public Health' },
];

GR.CITY_DEPTS = [
  { k: 'police', abbr: 'Police Dept.', cat: 'safety', share: 0.26, cap: 0.05 },
  { k: 'fire', abbr: 'Fire & EMS', cat: 'safety', share: 0.13, cap: 0.08 },
  { k: 'works', abbr: 'Public Works', cat: 'infra', share: 0.14, cap: 0.6 },
  { k: 'transit', abbr: 'Transit Authority', cat: 'infra', share: 0.08, cap: 0.45 },
  { k: 'water', abbr: 'Water & Sewer Utility', cat: 'env', share: 0.1, cap: 0.55 },
  { k: 'parks', abbr: 'Parks & Recreation', cat: 'social', share: 0.06, cap: 0.3 },
  { k: 'housing', abbr: 'Housing Authority', cat: 'social', share: 0.07, cap: 0.35 },
  { k: 'sanit', abbr: 'Sanitation', cat: 'env', share: 0.06, cap: 0.15 },
  { k: 'econ', abbr: 'Economic Development', cat: 'rnd', share: 0.03, cap: 0.4 },
  { k: 'admin', abbr: 'City Administration', cat: 'admin', share: 0.07, cap: 0.05 },
];

GR.SCHOOL_DEPTS = [
  { k: 'instr', abbr: 'Instruction', cat: 'edu', share: 0.55, cap: 0.01 },
  { k: 'sped', abbr: 'Special Education', cat: 'edu', share: 0.13, cap: 0.01 },
  { k: 'support', abbr: 'Student Services', cat: 'health', share: 0.07, cap: 0.01 },
  { k: 'trans', abbr: 'Pupil Transportation', cat: 'infra', share: 0.05, cap: 0.25 },
  { k: 'facil', abbr: 'Facilities & Construction', cat: 'infra', share: 0.1, cap: 0.6 },
  { k: 'food', abbr: 'Food Services', cat: 'social', share: 0.04, cap: 0.05 },
  { k: 'tech', abbr: 'Technology', cat: 'rnd', share: 0.02, cap: 0.5 },
  { k: 'admin', abbr: 'District Administration', cat: 'admin', share: 0.04, cap: 0.02 },
];

GR.STATE_NAMES_FULL = (ab) => (GR.STATE[ab] ? GR.STATE[ab].name : ab);

// Natural hazards by state (for disaster events).
GR.STATE_LEGACY_HAZ = {"AL":["A hurricane","A tornado outbreak"],"AK":["An earthquake","A crippling blizzard"],"AZ":["An extreme heat wave","A wildfire","A severe drought"],"AR":["A tornado outbreak","Major flooding"],"CA":["A wildfire","An earthquake","A severe drought"],"CO":["A wildfire","A crippling blizzard","A severe drought"],"CT":["A hurricane","A crippling blizzard"],"DE":["A hurricane","Major flooding"],"DC":["Major flooding","An extreme heat wave"],"FL":["A hurricane","Major flooding","An extreme heat wave"],"GA":["A hurricane","A tornado outbreak","An extreme heat wave"],"HI":["A hurricane","A wildfire"],"ID":["A wildfire","A crippling blizzard"],"IL":["A tornado outbreak","A crippling blizzard"],"IN":["A tornado outbreak","A crippling blizzard"],"IA":["A tornado outbreak","Major flooding","A crippling blizzard"],"KS":["A tornado outbreak","A severe drought"],"KY":["Major flooding","A tornado outbreak"],"LA":["A hurricane","Major flooding","An extreme heat wave"],"ME":["A crippling blizzard","Major flooding"],"MD":["A hurricane","Major flooding"],"MA":["A crippling blizzard","A hurricane"],"MI":["A crippling blizzard","Major flooding"],"MN":["A crippling blizzard","A tornado outbreak","Major flooding"],"MS":["A hurricane","A tornado outbreak","Major flooding"],"MO":["A tornado outbreak","Major flooding"],"MT":["A wildfire","A crippling blizzard","A severe drought"],"NE":["A tornado outbreak","A crippling blizzard","A severe drought"],"NV":["An extreme heat wave","A severe drought","An earthquake"],"NH":["A crippling blizzard","Major flooding"],"NJ":["A hurricane","Major flooding"],"NM":["A wildfire","A severe drought","An extreme heat wave"],"NY":["A crippling blizzard","Major flooding","A hurricane"],"NC":["A hurricane","Major flooding"],"ND":["A crippling blizzard","Major flooding","A severe drought"],"OH":["A tornado outbreak","A crippling blizzard","Major flooding"],"OK":["A tornado outbreak","A severe drought","An extreme heat wave"],"OR":["A wildfire","An earthquake"],"PA":["Major flooding","A crippling blizzard"],"RI":["A hurricane","A crippling blizzard"],"SC":["A hurricane","Major flooding"],"SD":["A crippling blizzard","A tornado outbreak","A severe drought"],"TN":["A tornado outbreak","Major flooding"],"TX":["A hurricane","An extreme heat wave","A severe drought","A tornado outbreak"],"UT":["A severe drought","An earthquake","A wildfire"],"VT":["Major flooding","A crippling blizzard"],"VA":["A hurricane","Major flooding"],"WA":["An earthquake","A wildfire"],"WV":["Major flooding"],"WI":["A crippling blizzard","A tornado outbreak","Major flooding"],"WY":["A crippling blizzard","A wildfire","A severe drought"]};
