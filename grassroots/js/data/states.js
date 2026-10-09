// State data. Figures are approximate mid-2020s values, rounded for play.
// pop: millions. cd: US House seats. lean: partisan lean in points (positive = Republican,
// negative = Democratic, roughly a Cook PVI). lo/up: state house / state senate seats
// (Nebraska is unicameral). sal: state legislator salary ($k/yr). gov: governor election
// cycle (mid = 2030, 2034; pres = 2028, 2032; odd3 = 2027, 2031; odd1 = 2029, 2033; two = every
// even year). gl: consecutive governor terms allowed (0 = no limit). sc: US Senate classes
// (class 1 next up 2030, class 2 in 2032, class 3 in 2028). zip: 3-digit ZIP prefix ranges.

var GR = globalThis.GR || (globalThis.GR = {});

GR.STATES = [
  { ab: 'AL', name: 'Alabama', cap: 'Montgomery', pop: 5.16, cd: 7, lean: 15, lo: 105, up: 35, sal: 50, gov: 'mid', gl: 2, sc: [2,3], col: 88, zip: [[350,369]] },
  { ab: 'AK', name: 'Alaska', cap: 'Juneau', pop: 0.74, cd: 1, lean: 8, lo: 40, up: 20, sal: 84, gov: 'mid', gl: 2, sc: [2,3], col: 125, zip: [[995,999]] },
  { ab: 'AZ', name: 'Arizona', cap: 'Phoenix', pop: 7.58, cd: 9, lean: 3, lo: 60, up: 30, sal: 24, gov: 'mid', gl: 2, sc: [1,3], col: 107, zip: [[850,865]] },
  { ab: 'AR', name: 'Arkansas', cap: 'Little Rock', pop: 3.09, cd: 4, lean: 16, lo: 100, up: 35, sal: 44, gov: 'mid', gl: 2, sc: [2,3], col: 89, zip: [[716,729]] },
  { ab: 'CA', name: 'California', cap: 'Sacramento', pop: 39.4, cd: 52, lean: -12, lo: 80, up: 40, sal: 128, gov: 'mid', gl: 2, sc: [1,3], col: 139, zip: [[900,961]] },
  { ab: 'CO', name: 'Colorado', cap: 'Denver', pop: 5.96, cd: 8, lean: -4, lo: 65, up: 35, sal: 43, gov: 'mid', gl: 2, sc: [2,3], col: 105, zip: [[800,816]] },
  { ab: 'CT', name: 'Connecticut', cap: 'Hartford', pop: 3.68, cd: 5, lean: -7, lo: 151, up: 36, sal: 40, gov: 'mid', gl: 0, sc: [1,3], col: 113, zip: [[60,69]] },
  { ab: 'DE', name: 'Delaware', cap: 'Dover', pop: 1.05, cd: 1, lean: -7, lo: 41, up: 21, sal: 50, gov: 'pres', gl: 2, sc: [1,2], col: 102, zip: [[197,199]] },
  { ab: 'DC', name: 'District of Columbia', cap: 'Washington', pop: 0.70, cd: 0, lean: -40, lo: 0, up: 0, sal: 0, gov: 'none', gl: 0, sc: [], col: 148, zip: [[200,200],[202,205]] },
  { ab: 'FL', name: 'Florida', cap: 'Tallahassee', pop: 23.4, cd: 28, lean: 5, lo: 120, up: 40, sal: 30, gov: 'mid', gl: 2, sc: [1,3], col: 102, zip: [[320,349]] },
  { ab: 'GA', name: 'Georgia', cap: 'Atlanta', pop: 11.2, cd: 14, lean: 2, lo: 180, up: 56, sal: 17, gov: 'mid', gl: 2, sc: [2,3], col: 93, zip: [[300,319],[398,399]] },
  { ab: 'HI', name: 'Hawaii', cap: 'Honolulu', pop: 1.45, cd: 2, lean: -13, lo: 51, up: 25, sal: 72, gov: 'mid', gl: 2, sc: [1,3], col: 186, zip: [[967,968]] },
  { ab: 'ID', name: 'Idaho', cap: 'Boise', pop: 2.0, cd: 2, lean: 19, lo: 70, up: 35, sal: 22, gov: 'mid', gl: 0, sc: [2,3], col: 103, zip: [[832,838]] },
  { ab: 'IL', name: 'Illinois', cap: 'Springfield', pop: 12.7, cd: 17, lean: -6, lo: 118, up: 59, sal: 89, gov: 'mid', gl: 0, sc: [2,3], col: 92, zip: [[600,629]] },
  { ab: 'IN', name: 'Indiana', cap: 'Indianapolis', pop: 6.92, cd: 9, lean: 10, lo: 100, up: 50, sal: 30, gov: 'pres', gl: 2, sc: [1,3], col: 90, zip: [[460,479]] },
  { ab: 'IA', name: 'Iowa', cap: 'Des Moines', pop: 3.24, cd: 4, lean: 7, lo: 100, up: 50, sal: 25, gov: 'mid', gl: 0, sc: [2,3], col: 89, zip: [[500,528]] },
  { ab: 'KS', name: 'Kansas', cap: 'Topeka', pop: 2.97, cd: 4, lean: 9, lo: 125, up: 40, sal: 30, gov: 'mid', gl: 2, sc: [2,3], col: 88, zip: [[660,679]] },
  { ab: 'KY', name: 'Kentucky', cap: 'Frankfort', pop: 4.59, cd: 6, lean: 16, lo: 100, up: 38, sal: 30, gov: 'odd3', gl: 2, sc: [2,3], col: 92, zip: [[400,427]] },
  { ab: 'LA', name: 'Louisiana', cap: 'Baton Rouge', pop: 4.6, cd: 6, lean: 12, lo: 105, up: 39, sal: 23, gov: 'odd3', gl: 2, sc: [2,3], col: 91, zip: [[700,714]] },
  { ab: 'ME', name: 'Maine', cap: 'Augusta', pop: 1.41, cd: 2, lean: -2, lo: 151, up: 35, sal: 16, gov: 'mid', gl: 2, sc: [1,2], col: 112, zip: [[39,49]] },
  { ab: 'MD', name: 'Maryland', cap: 'Annapolis', pop: 6.26, cd: 8, lean: -14, lo: 141, up: 47, sal: 50, gov: 'mid', gl: 2, sc: [1,3], col: 115, zip: [[206,219]] },
  { ab: 'MA', name: 'Massachusetts', cap: 'Boston', pop: 7.14, cd: 9, lean: -14, lo: 160, up: 40, sal: 73, gov: 'mid', gl: 0, sc: [1,2], col: 145, zip: [[10,27]] },
  { ab: 'MI', name: 'Michigan', cap: 'Lansing', pop: 10.1, cd: 13, lean: 0, lo: 110, up: 38, sal: 72, gov: 'mid', gl: 2, sc: [1,2], col: 91, zip: [[480,499]] },
  { ab: 'MN', name: 'Minnesota', cap: 'Saint Paul', pop: 5.79, cd: 8, lean: -2, lo: 134, up: 67, sal: 51, gov: 'mid', gl: 0, sc: [1,2], col: 95, zip: [[550,567]] },
  { ab: 'MS', name: 'Mississippi', cap: 'Jackson', pop: 2.94, cd: 4, lean: 11, lo: 122, up: 52, sal: 23, gov: 'odd3', gl: 2, sc: [1,2], col: 85, zip: [[386,397]] },
  { ab: 'MO', name: 'Missouri', cap: 'Jefferson City', pop: 6.25, cd: 8, lean: 10, lo: 163, up: 34, sal: 39, gov: 'pres', gl: 2, sc: [1,3], col: 89, zip: [[630,658]] },
  { ab: 'MT', name: 'Montana', cap: 'Helena', pop: 1.14, cd: 2, lean: 11, lo: 100, up: 50, sal: 13, gov: 'pres', gl: 2, sc: [1,2], col: 104, zip: [[590,599]] },
  { ab: 'NE', name: 'Nebraska', cap: 'Lincoln', pop: 2.0, cd: 3, lean: 8, lo: 0, up: 49, sal: 12, gov: 'mid', gl: 2, sc: [1,2], col: 92, zip: [[680,693]] },
  { ab: 'NV', name: 'Nevada', cap: 'Carson City', pop: 3.27, cd: 4, lean: 1, lo: 42, up: 21, sal: 20, gov: 'mid', gl: 2, sc: [1,3], col: 101, zip: [[889,898]] },
  { ab: 'NH', name: 'New Hampshire', cap: 'Concord', pop: 1.41, cd: 2, lean: -1, lo: 400, up: 24, sal: 1, gov: 'two', gl: 0, sc: [2,3], col: 113, zip: [[30,38]] },
  { ab: 'NJ', name: 'New Jersey', cap: 'Trenton', pop: 9.5, cd: 12, lean: -4, lo: 80, up: 40, sal: 49, gov: 'odd1', gl: 2, sc: [1,2], col: 114, zip: [[70,89]] },
  { ab: 'NM', name: 'New Mexico', cap: 'Santa Fe', pop: 2.13, cd: 3, lean: -4, lo: 70, up: 42, sal: 1, gov: 'mid', gl: 2, sc: [1,2], col: 93, zip: [[870,884]] },
  { ab: 'NY', name: 'New York', cap: 'Albany', pop: 19.9, cd: 26, lean: -8, lo: 150, up: 63, sal: 142, gov: 'mid', gl: 0, sc: [1,3], col: 125, zip: [[100,149]] },
  { ab: 'NC', name: 'North Carolina', cap: 'Raleigh', pop: 11.0, cd: 14, lean: 2, lo: 120, up: 50, sal: 14, gov: 'pres', gl: 2, sc: [2,3], col: 95, zip: [[270,289]] },
  { ab: 'ND', name: 'North Dakota', cap: 'Bismarck', pop: 0.80, cd: 1, lean: 19, lo: 94, up: 47, sal: 20, gov: 'pres', gl: 2, sc: [1,3], col: 94, zip: [[580,588]] },
  { ab: 'OH', name: 'Ohio', cap: 'Columbus', pop: 11.9, cd: 15, lean: 6, lo: 99, up: 33, sal: 71, gov: 'mid', gl: 2, sc: [1,3], col: 93, zip: [[430,458]] },
  { ab: 'OK', name: 'Oklahoma', cap: 'Oklahoma City', pop: 4.1, cd: 5, lean: 19, lo: 101, up: 48, sal: 47, gov: 'mid', gl: 2, sc: [2,3], col: 86, zip: [[730,749]] },
  { ab: 'OR', name: 'Oregon', cap: 'Salem', pop: 4.27, cd: 6, lean: -6, lo: 60, up: 30, sal: 36, gov: 'mid', gl: 2, sc: [2,3], col: 115, zip: [[970,979]] },
  { ab: 'PA', name: 'Pennsylvania', cap: 'Harrisburg', pop: 13.1, cd: 17, lean: 1, lo: 203, up: 50, sal: 106, gov: 'mid', gl: 2, sc: [1,3], col: 97, zip: [[150,196]] },
  { ab: 'RI', name: 'Rhode Island', cap: 'Providence', pop: 1.11, cd: 2, lean: -8, lo: 75, up: 38, sal: 18, gov: 'mid', gl: 2, sc: [1,2], col: 111, zip: [[28,29]] },
  { ab: 'SC', name: 'South Carolina', cap: 'Columbia', pop: 5.48, cd: 7, lean: 9, lo: 124, up: 46, sal: 10, gov: 'mid', gl: 2, sc: [2,3], col: 95, zip: [[290,299]] },
  { ab: 'SD', name: 'South Dakota', cap: 'Pierre', pop: 0.92, cd: 1, lean: 15, lo: 70, up: 35, sal: 12, gov: 'mid', gl: 2, sc: [2,3], col: 93, zip: [[570,577]] },
  { ab: 'TN', name: 'Tennessee', cap: 'Nashville', pop: 7.23, cd: 9, lean: 14, lo: 99, up: 33, sal: 27, gov: 'mid', gl: 2, sc: [1,2], col: 90, zip: [[370,385]] },
  { ab: 'TX', name: 'Texas', cap: 'Austin', pop: 31.3, cd: 38, lean: 6, lo: 150, up: 31, sal: 7, gov: 'mid', gl: 0, sc: [1,2], col: 93, zip: [[750,799],[885,885]] },
  { ab: 'UT', name: 'Utah', cap: 'Salt Lake City', pop: 3.5, cd: 4, lean: 12, lo: 75, up: 29, sal: 25, gov: 'pres', gl: 0, sc: [1,3], col: 104, zip: [[840,847]] },
  { ab: 'VT', name: 'Vermont', cap: 'Montpelier', pop: 0.65, cd: 1, lean: -16, lo: 150, up: 30, sal: 14, gov: 'two', gl: 0, sc: [1,3], col: 115, zip: [[50,59]] },
  { ab: 'VA', name: 'Virginia', cap: 'Richmond', pop: 8.81, cd: 11, lean: -2, lo: 100, up: 40, sal: 18, gov: 'odd1', gl: 1, sc: [1,2], col: 101, zip: [[201,201],[220,246]] },
  { ab: 'WA', name: 'Washington', cap: 'Olympia', pop: 7.96, cd: 10, lean: -8, lo: 98, up: 49, sal: 61, gov: 'pres', gl: 0, sc: [1,3], col: 116, zip: [[980,994]] },
  { ab: 'WV', name: 'West Virginia', cap: 'Charleston', pop: 1.77, cd: 2, lean: 21, lo: 100, up: 34, sal: 20, gov: 'pres', gl: 2, sc: [1,2], col: 87, zip: [[247,268]] },
  { ab: 'WI', name: 'Wisconsin', cap: 'Madison', pop: 5.96, cd: 8, lean: 0, lo: 99, up: 33, sal: 57, gov: 'mid', gl: 0, sc: [1,3], col: 96, zip: [[530,549]] },
  { ab: 'WY', name: 'Wyoming', cap: 'Cheyenne', pop: 0.59, cd: 1, lean: 23, lo: 62, up: 31, sal: 12, gov: 'mid', gl: 2, sc: [1,2], col: 93, zip: [[820,831]] },
];
GR.STATE = {};
GR.STATES.forEach((s) => { GR.STATE[s.ab] = s; });

// Find the state a ZIP code belongs to (by its first three digits).
GR.stateForZip = function (zip) {
  const p = parseInt(String(zip).slice(0, 3), 10);
  if (isNaN(p)) return null;
  const st = GR.STATES.find((s) => s.zip.some(([a, b]) => p >= a && p <= b));
  return st ? st.ab : null;
};

// A plausible ZIP for a state and city, used when the player leaves it blank.
GR.randomZip = function (ab, seed) {
  const st = GR.STATE[ab];
  const r = GR.util.seeded(seed || ab + Math.random());
  const [a, b] = r.pick(st.zip);
  const p = r.int(a, b);
  return String(p).padStart(3, '0') + String(r.int(1, 99)).padStart(2, '0');
};
