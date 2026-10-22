// Jurisdictional Crises & Needs Matrix. Baseline severities (0-100, higher is worse) reflect
// each state's well-known structural problems in the mid-2020s, rounded for play.
// Each crisis type lists the levers that ease it:
//   ag: agency lines (part: 'all' | 'capex' | 'opex', w: weight)
//   ent: entitlement parameters (dir +1 means raising the value helps)
//   law: policy positions (dir -1 means moving toward option 0 helps)
//   tax: tax rates (dir as above)
// trend: drift per quarter when nothing changes; sal: voter salience; rating: bond-rating weight;
// drag: potential-growth drag per 10 points above baseline; rebel: how strongly affected
// districts break with party leadership when it worsens.
var GR = globalThis.GR || (globalThis.GR = {});

GR.CRISIS_TYPES = {
  housing: { name: 'Housing affordability crisis', sal: 1.3, rating: 0.25, drag: 0.04, trend: 0.25, rebel: 1.0, urban: 1,
    ag: [['hs', 'all', 0.3], ['gen', 'all', 0.15], ['housing', 'all', 0.6], ['hud', 'all', 0.8]], ent: [['htf', 'amt', 0.6, 1], ['vouchers', 'ami', 0.4, 1]], law: [['zoning', 0.5, -1], ['rent', 0.15, -1]] },
  infra: { name: 'Infrastructure backlog', sal: 0.9, rating: 0.5, drag: 0.06, trend: 0.35, rebel: 0.8,
    ag: [['dot', 'capex', 1.0], ['works', 'capex', 0.7], ['transit', 'capex', 0.4], ['facil', 'capex', 1.0], ['doe', 'capex', 0.15]] },
  migration: { name: 'Out-migration & brain drain', sal: 0.8, rating: 0.6, drag: 0.06, trend: 0.15, rebel: 0.6,
    ag: [['hied', 'all', 0.5], ['k12', 'all', 0.2], ['econ', 'all', 0.5]], tax: [['high', 0.15, -1], ['mid', 0.1, -1]], couple: { housing: 0.25 } },
  education: { name: 'Low education rankings', sal: 1.0, rating: 0.1, drag: 0.04, trend: 0.1, rebel: 0.7,
    ag: [['k12', 'opex', 0.9], ['hied', 'all', 0.2], ['instr', 'opex', 0.9], ['sped', 'opex', 0.2], ['ed', 'all', 0.8], ['nsf', 'all', 0.2]], law: [['teacherpay', 0.3, -1]], ent: [['classsize', 'cap', 0.4, -1]] },
  health: { name: 'Health care deficit', sal: 1.2, rating: 0.2, drag: 0.03, trend: 0.2, rebel: 0.9,
    ag: [['mcd', 'all', 0.3], ['gen', 'all', 0.3], ['hhs', 'all', 0.3], ['support', 'all', 0.3]], ent: [['medicaid', 'fpl', 0.9, 1], ['medicaid', 'copay', 0.3, -1], ['aca', 'cap', 0.5, 1]] },
  opioid: { name: 'Opioid & addiction epidemic', sal: 0.8, rating: 0.05, drag: 0.02, trend: 0.15, rebel: 0.6,
    ag: [['gen', 'all', 0.4], ['hs', 'all', 0.3], ['mcd', 'all', 0.2], ['police', 'all', 0.1], ['hhs', 'all', 0.4], ['dhs', 'all', 0.2], ['doj', 'all', 0.2]] },
  crime: { name: 'Violent crime & public safety', sal: 1.1, rating: 0.1, drag: 0.02, trend: 0.08, rebel: 0.8, urban: 0.6,
    ag: [['police', 'all', 0.5], ['corr', 'all', 0.25], ['hs', 'all', 0.2], ['fire', 'all', 0.1], ['doj', 'all', 0.5]], law: [['police', 0.2, 1], ['bail', 0.1, 1]] },
  pension: { name: 'Unfunded pension liabilities', sal: 0.4, rating: 4.0, drag: 0.01, trend: 0.3, rebel: 0.3,
    ent: [['pension', 'pct', 1.6, 1]] },
  disaster: { name: 'Climate & disaster vulnerability', sal: 0.9, rating: 0.6, drag: 0.02, trend: 0.2, rebel: 0.7,
    ag: [['env', 'capex', 0.6], ['dot', 'capex', 0.25], ['water', 'capex', 0.4], ['dhs', 'all', 0.3], ['doi', 'all', 0.2], ['epa', 'all', 0.2]], tax: [['carbon', 0.15, 1]] },
  water: { name: 'Water scarcity & quality', sal: 0.8, rating: 0.3, drag: 0.03, trend: 0.2, rebel: 0.6,
    ag: [['env', 'capex', 0.8], ['water', 'capex', 1.0]] },
  homeless: { name: 'Homelessness', sal: 1.0, rating: 0.05, drag: 0.01, trend: 0.2, rebel: 0.7, urban: 1,
    ag: [['hs', 'all', 0.4], ['housing', 'all', 0.5], ['hud', 'all', 0.6]], ent: [['htf', 'amt', 0.4, 1], ['vouchers', 'ami', 0.4, 1]], couple: { housing: 0.2 } },
  energy: { name: 'Fossil-fuel revenue dependence', sal: 0.4, rating: 0.5, drag: 0.03, trend: 0.08, rebel: 0.5,
    ag: [['hied', 'capex', 0.4], ['econ', 'all', 0.6], ['doe', 'all', 0.8]] },
  poverty: { name: 'Concentrated poverty', sal: 0.9, rating: 0.15, drag: 0.03, trend: 0.05, rebel: 0.7,
    ag: [['hs', 'all', 0.4], ['k12', 'opex', 0.1], ['food', 'all', 0.3], ['dol', 'all', 0.2]], ent: [['tanf', 'benefit', 0.3, 1], ['eitc', 'pct', 0.5, 1], ['snap', 'fpl', 0.4, 1], ['ctc', 'amount', 0.5, 1], ['meals', 'fpl', 0.3, 1]] },
  // Federal-only
  debt: { name: 'Federal debt sustainability', sal: 0.6, rating: 0.6, drag: 0.02, trend: 0, rebel: 0.6, computed: 'debt' },
  ssTrust: { name: 'Social Security trust fund depletion', sal: 1.0, rating: 0.3, drag: 0, trend: 0.45, rebel: 0.8,
    ent: [['ss', 'fra', 0.6, 1], ['ss', 'benefit', 0.4, -1], ['ss', 'cap', 1.2, 1]], tax: [['payroll', 1.5, 1]] },
  medicareTrust: { name: 'Medicare trust fund depletion', sal: 0.9, rating: 0.2, drag: 0, trend: 0.3, rebel: 0.7,
    ent: [['medicare', 'rate', 0.8, -1], ['medicare', 'age', 0.5, 1]], tax: [['payroll', 0.8, 1], ['high', 0.2, 1]] },
  healthcosts: { name: 'Health care costs & coverage', sal: 1.1, rating: 0.1, drag: 0.02, trend: 0.25, rebel: 0.8,
    ag: [['hhs', 'all', 0.3]], ent: [['medicaid', 'fpl', 0.4, 1], ['aca', 'cap', 0.5, 1], ['medicare', 'partd', 0.3, -1]] },
  border: { name: 'Border security & immigration backlog', sal: 1.0, rating: 0, drag: 0, trend: 0.15, rebel: 0.8,
    ag: [['dhs', 'all', 0.9], ['doj', 'all', 0.3]], law: [['border', 0.3, 1]] },
  readiness: { name: 'Military readiness', sal: 0.6, rating: 0, drag: 0, trend: 0.2, rebel: 0.6, ag: [['dod', 'all', 1.0]] },
  veterans: { name: 'VA care backlog', sal: 0.6, rating: 0, drag: 0, trend: 0.2, rebel: 0.5, ag: [['va', 'all', 1.0]] },
};

// Baseline severities. Unlisted crises default from state data (cost of living, income, lean).
GR.STATE_CRISES = {
  AL: { health: 80, poverty: 75, education: 75, crime: 65, infra: 55, disaster: 60, opioid: 50, pension: 50 },
  AK: { energy: 95, migration: 85, health: 70, education: 80, crime: 70, infra: 70, disaster: 55, pension: 60, housing: 55 },
  AZ: { water: 95, housing: 70, disaster: 70, education: 70, health: 60, homeless: 55, pension: 60 },
  AR: { health: 80, poverty: 75, education: 70, opioid: 55, crime: 60, infra: 50, migration: 50 },
  CA: { housing: 98, homeless: 95, disaster: 85, water: 85, migration: 60, infra: 55, education: 45, health: 35, pension: 65, crime: 45, opioid: 45, poverty: 55 },
  CO: { housing: 80, water: 70, disaster: 60, homeless: 55, education: 40, health: 40, infra: 55 },
  CT: { pension: 85, housing: 55, migration: 55, infra: 60, education: 20, health: 25 },
  DE: { health: 45, opioid: 65, infra: 45, education: 50, pension: 35 },
  DC: { housing: 85, homeless: 70, crime: 75, education: 60, health: 35, infra: 40, pension: 30 },
  FL: { housing: 80, disaster: 95, water: 50, health: 65, education: 35, migration: 5, poverty: 45, opioid: 55, pension: 35, homeless: 45, infra: 45 },
  GA: { health: 75, housing: 50, education: 55, poverty: 55, infra: 50, crime: 55 },
  HI: { housing: 95, infra: 70, migration: 80, homeless: 80, disaster: 60, pension: 70, education: 45, water: 40 },
  ID: { housing: 65, water: 60, education: 60, health: 50, disaster: 50 },
  IL: { pension: 98, migration: 80, infra: 60, crime: 60, opioid: 55, homeless: 45, education: 40, health: 40 },
  IN: { health: 60, opioid: 60, education: 50, infra: 45, migration: 40 },
  IA: { migration: 60, infra: 55, water: 50, health: 35, education: 30 },
  KS: { water: 70, migration: 55, health: 55, education: 40, pension: 45 },
  KY: { pension: 92, opioid: 85, health: 70, poverty: 75, education: 55, infra: 55, energy: 60, migration: 50 },
  LA: { disaster: 95, health: 80, poverty: 85, crime: 80, education: 80, infra: 70, energy: 75, migration: 70, pension: 55, opioid: 50 },
  ME: { migration: 50, health: 45, opioid: 70, housing: 60, infra: 55 },
  MD: { infra: 55, housing: 60, crime: 60, pension: 55, education: 35 },
  MA: { housing: 90, migration: 55, infra: 65, education: 5, health: 15, pension: 50, homeless: 60 },
  MI: { infra: 85, migration: 60, water: 60, health: 45, education: 60, energy: 30, pension: 55, crime: 55 },
  MN: { housing: 45, education: 20, health: 15, migration: 35, infra: 45 },
  MS: { education: 85, health: 95, poverty: 95, infra: 70, migration: 70, crime: 60, water: 50, disaster: 55, pension: 55, opioid: 40 },
  MO: { crime: 75, health: 60, infra: 60, opioid: 60, education: 50 },
  MT: { housing: 70, health: 55, migration: 35, energy: 55, disaster: 55 },
  NE: { water: 55, migration: 45, health: 40, education: 25 },
  NV: { water: 90, housing: 70, education: 80, health: 60, homeless: 60 },
  NH: { housing: 70, opioid: 60, migration: 35, education: 15 },
  NJ: { pension: 90, housing: 75, infra: 70, migration: 60, education: 15, health: 35 },
  NM: { poverty: 85, education: 95, crime: 80, health: 70, water: 85, energy: 75, migration: 45, opioid: 55 },
  NY: { housing: 85, migration: 75, infra: 65, pension: 45, homeless: 75, health: 35, education: 40, crime: 45, opioid: 55, poverty: 55 },
  NC: { health: 55, disaster: 70, housing: 55, education: 50, infra: 50 },
  ND: { energy: 90, migration: 40, health: 40, water: 30 },
  OH: { opioid: 80, infra: 60, migration: 55, health: 50, education: 45, energy: 40 },
  OK: { health: 80, education: 80, energy: 75, disaster: 70, poverty: 65, crime: 55 },
  OR: { housing: 85, homeless: 90, disaster: 70, opioid: 75, migration: 35, education: 55 },
  PA: { infra: 75, pension: 60, opioid: 70, migration: 45, energy: 55, education: 35 },
  RI: { infra: 75, pension: 60, housing: 65, education: 50 },
  SC: { health: 65, education: 70, disaster: 65, poverty: 60, infra: 65 },
  SD: { health: 50, migration: 40, poverty: 45, education: 45 },
  TN: { health: 70, opioid: 70, education: 50, disaster: 45, poverty: 55 },
  TX: { infra: 60, disaster: 70, water: 60, health: 85, education: 55, housing: 50, energy: 70, poverty: 55, crime: 45, pension: 40 },
  UT: { water: 80, housing: 70, education: 50, health: 35 },
  VT: { housing: 75, migration: 65, disaster: 60, education: 20, opioid: 55 },
  VA: { housing: 55, infra: 45, education: 20, health: 35 },
  WA: { housing: 85, homeless: 80, disaster: 55, infra: 60, education: 30 },
  WV: { opioid: 98, migration: 90, health: 85, poverty: 85, energy: 85, education: 75, infra: 75, pension: 40, disaster: 45 },
  WI: { infra: 55, migration: 45, education: 35, health: 30 },
  WY: { energy: 98, migration: 75, health: 55, education: 35 },
};

GR.FED_CRISES = { debt: 75, ssTrust: 85, medicareTrust: 70, infra: 65, healthcosts: 70, housing: 75, border: 60, disaster: 60, readiness: 45, opioid: 75, education: 45, energy: 40, veterans: 55 };

// Which crisis types apply at each level.
GR.CRISIS_LEVELS = {
  state: ['housing', 'infra', 'migration', 'education', 'health', 'opioid', 'crime', 'pension', 'disaster', 'water', 'homeless', 'energy', 'poverty'],
  city: ['housing', 'infra', 'crime', 'homeless', 'water', 'pension', 'disaster', 'poverty'],
  school: ['education', 'infra', 'poverty', 'health'],
  nation: ['debt', 'ssTrust', 'medicareTrust', 'infra', 'healthcosts', 'housing', 'border', 'disaster', 'readiness', 'opioid', 'education', 'energy', 'veterans'],
};
