// Builds js/data/states.js. Run from the repository root (it reads cost-of-living data from js/data/locations.js):
//   node grassroots/tools/build-states.js grassroots/js/data/states.js
globalThis.G={};require(process.cwd()+"/js/data/locations.js");
// ab, name, capital, pop(M), US House seats, lean (R+ positive), lower, upper, legislator salary $k, gov cycle, gov term limit, zip ranges
const rows = `AL|Alabama|Montgomery|5.16|7|15|105|35|50|mid|2|350-369
AK|Alaska|Juneau|0.74|1|8|40|20|84|mid|2|995-999
AZ|Arizona|Phoenix|7.58|9|3|60|30|24|mid|2|850-865
AR|Arkansas|Little Rock|3.09|4|16|100|35|44|mid|2|716-729
CA|California|Sacramento|39.4|52|-12|80|40|128|mid|2|900-961
CO|Colorado|Denver|5.96|8|-4|65|35|43|mid|2|800-816
CT|Connecticut|Hartford|3.68|5|-7|151|36|40|mid|0|060-069
DE|Delaware|Dover|1.05|1|-7|41|21|50|pres|2|197-199
DC|District of Columbia|Washington|0.70|0|-40|0|0|0|none|0|200-200,202-205
FL|Florida|Tallahassee|23.4|28|5|120|40|30|mid|2|320-349
GA|Georgia|Atlanta|11.2|14|2|180|56|17|mid|2|300-319,398-399
HI|Hawaii|Honolulu|1.45|2|-13|51|25|72|mid|2|967-968
ID|Idaho|Boise|2.0|2|19|70|35|22|mid|0|832-838
IL|Illinois|Springfield|12.7|17|-6|118|59|89|mid|0|600-629
IN|Indiana|Indianapolis|6.92|9|10|100|50|30|pres|2|460-479
IA|Iowa|Des Moines|3.24|4|7|100|50|25|mid|0|500-528
KS|Kansas|Topeka|2.97|4|9|125|40|30|mid|2|660-679
KY|Kentucky|Frankfort|4.59|6|16|100|38|30|odd3|2|400-427
LA|Louisiana|Baton Rouge|4.6|6|12|105|39|23|odd3|2|700-714
ME|Maine|Augusta|1.41|2|-2|151|35|16|mid|2|039-049
MD|Maryland|Annapolis|6.26|8|-14|141|47|50|mid|2|206-219
MA|Massachusetts|Boston|7.14|9|-14|160|40|73|mid|0|010-027
MI|Michigan|Lansing|10.1|13|0|110|38|72|mid|2|480-499
MN|Minnesota|Saint Paul|5.79|8|-2|134|67|51|mid|0|550-567
MS|Mississippi|Jackson|2.94|4|11|122|52|23|odd3|2|386-397
MO|Missouri|Jefferson City|6.25|8|10|163|34|39|pres|2|630-658
MT|Montana|Helena|1.14|2|11|100|50|13|pres|2|590-599
NE|Nebraska|Lincoln|2.0|3|8|0|49|12|mid|2|680-693
NV|Nevada|Carson City|3.27|4|1|42|21|20|mid|2|889-898
NH|New Hampshire|Concord|1.41|2|-1|400|24|1|two|0|030-038
NJ|New Jersey|Trenton|9.5|12|-4|80|40|49|odd1|2|070-089
NM|New Mexico|Santa Fe|2.13|3|-4|70|42|1|mid|2|870-884
NY|New York|Albany|19.9|26|-8|150|63|142|mid|0|100-149
NC|North Carolina|Raleigh|11.0|14|2|120|50|14|pres|2|270-289
ND|North Dakota|Bismarck|0.80|1|19|94|47|20|pres|2|580-588
OH|Ohio|Columbus|11.9|15|6|99|33|71|mid|2|430-458
OK|Oklahoma|Oklahoma City|4.1|5|19|101|48|47|mid|2|730-749
OR|Oregon|Salem|4.27|6|-6|60|30|36|mid|2|970-979
PA|Pennsylvania|Harrisburg|13.1|17|1|203|50|106|mid|2|150-196
RI|Rhode Island|Providence|1.11|2|-8|75|38|18|mid|2|028-029
SC|South Carolina|Columbia|5.48|7|9|124|46|10|mid|2|290-299
SD|South Dakota|Pierre|0.92|1|15|70|35|12|mid|2|570-577
TN|Tennessee|Nashville|7.23|9|14|99|33|27|mid|2|370-385
TX|Texas|Austin|31.3|38|6|150|31|7|mid|0|750-799,885-885
UT|Utah|Salt Lake City|3.5|4|12|75|29|25|pres|0|840-847
VT|Vermont|Montpelier|0.65|1|-16|150|30|14|two|0|050-059
VA|Virginia|Richmond|8.81|11|-2|100|40|18|odd1|1|201-201,220-246
WA|Washington|Olympia|7.96|10|-8|98|49|61|pres|0|980-994
WV|West Virginia|Charleston|1.77|2|21|100|34|20|pres|2|247-268
WI|Wisconsin|Madison|5.96|8|0|99|33|57|mid|0|530-549
WY|Wyoming|Cheyenne|0.59|1|23|62|31|12|mid|2|820-831`;
const C1="AZ CA CT DE FL HI IN ME MD MA MI MN MS MO MT NE NV NJ NM NY ND OH PA RI TN TX UT VT VA WA WV WI WY".split(" ");
const C2="AL AK AR CO DE GA ID IL IA KS KY LA ME MA MI MN MS MT NE NH NJ NM NC OK OR RI SC SD TN TX VA WV WY".split(" ");
const C3="AL AK AZ AR CA CO CT FL GA HI ID IL IN IA KS KY LA MD MO NV NH NY NC ND OH OK OR PA SC SD UT VT WA WI".split(" ");
const loc={};for(const s of G.STATES)loc[s.ab]=s;
let out=[];let cd=0;
for(const r of rows.split("\n")){
  const [ab,name,cap,pop,h,lean,lo,up,sal,gc,gl,zips]=r.split("|");
  const cls=[1,2,3].filter(c=>[C1,C2,C3][c-1].includes(ab));
  if(ab!=="DC"&&cls.length!==2)throw ab+" classes "+cls;
  cd+=+h;
  const z=zips.split(",").map(x=>x.split("-").map(Number));
  const cities=loc[ab].cities.map(c=>[c[0],c[1],c[2]]);
  out.push(`  { ab: '${ab}', name: '${name}', cap: '${cap}', pop: ${pop}, cd: ${h}, lean: ${lean}, lo: ${lo}, up: ${up}, sal: ${sal}, gov: '${gc}', gl: ${gl}, sc: [${cls}], col: ${loc[ab].col}, zip: ${JSON.stringify(z)} },`);
}
console.error("House seats",cd);
const fs=require("fs");
fs.writeFileSync(process.argv[2], `// State data. Figures are approximate mid-2020s values, rounded for play.
// pop: millions. cd: US House seats. lean: partisan lean in points (positive = Republican,
// negative = Democratic, roughly a Cook PVI). lo/up: state house / state senate seats
// (Nebraska is unicameral). sal: state legislator salary ($k/yr). gov: governor election
// cycle (mid = 2030, 2034; pres = 2028, 2032; odd3 = 2027, 2031; odd1 = 2029, 2033; two = every
// even year). gl: consecutive governor terms allowed (0 = no limit). sc: US Senate classes
// (class 1 next up 2030, class 2 in 2032, class 3 in 2028). zip: 3-digit ZIP prefix ranges.

var GR = globalThis.GR || (globalThis.GR = {});

GR.STATES = [
${out.join("\n")}
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
`);
