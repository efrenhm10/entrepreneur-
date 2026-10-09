// Builds js/geo/*.js from public data. In a scratch folder: npm install us-atlas topojson-client topojson-simplify d3-geo zipcode-detail-lookup
// then: node build-geo.js <repo>/grassroots/js/geo
const fs=require('fs'),path=require('path');
const topo=require('topojson-client'),simp=require('topojson-simplify'),d3=require('d3-geo');
const z=require('zipcode-detail-lookup');
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
const STATES='AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const FIPS={AL:1,AK:2,AZ:4,AR:5,CA:6,CO:8,CT:9,DE:10,DC:11,FL:12,GA:13,HI:15,ID:16,IL:17,IN:18,IA:19,KS:20,KY:21,LA:22,ME:23,MD:24,MA:25,MI:26,MN:27,MS:28,MO:29,MT:30,NE:31,NV:32,NH:33,NJ:34,NM:35,NY:36,NC:37,ND:38,OH:39,OK:40,OR:41,PA:42,RI:44,SC:45,SD:46,TN:47,TX:48,UT:49,VT:50,VA:51,WA:53,WV:54,WI:55,WY:56};
// ---- US states map
let us=JSON.parse(fs.readFileSync('node_modules/us-atlas/states-albers-10m.json'));
us=simp.simplify(simp.presimplify(us),0.5);
const gp=d3.geoPath();
const st=topo.feature(us,us.objects.states).features;
const byF={};for(const [k,v] of Object.entries(FIPS))byF[v]=k;
const usOut={};
for(const f of st){const ab=byF[+f.id];if(!ab)continue;const d=gp(f).replace(/(\.\d)\d+/g,'$1');const c=gp.centroid(f).map(v=>Math.round(v));usOut[ab]=[d,c];}
fs.writeFileSync(path.join(OUT,'us.js'),'// U.S. state outlines (Albers USA, 975x610), from the Census Bureau via us-atlas (ISC).\nvar GR = globalThis.GR || (globalThis.GR = {});\nGR.US_MAP = '+JSON.stringify(usOut)+';\n');
// ---- counties
let co=JSON.parse(fs.readFileSync('node_modules/us-atlas/counties-albers-10m.json'));
co=simp.simplify(simp.presimplify(co),0.08);
const cf=topo.feature(co,co.objects.counties).features;
let total=0;
for(const ab of STATES){
  const zs=z.lookupZipsWith({stateAbbreviation:ab}).filter(r=>r.population>0&&!r.militaryZip);
  const counties={},cities={};
  for(const r of zs){
    const cfips=r.county_fips; if(!counties[cfips])counties[cfips]={name:r.county,pop:0,area:0,lat:0,lng:0};
    const C=counties[cfips];C.pop+=r.population;C.area+=r.population/Math.max(r.density,0.5);C.lat+=r.latitude*r.population;C.lng+=r.longitude*r.population;
    const key=r.city+'|'+cfips;
    if(!cities[r.city])cities[r.city]={name:r.city,pop:0,cty:{}};
    cities[r.city].pop+=r.population;cities[r.city].cty[cfips]=(cities[r.city].cty[cfips]||0)+r.population;
  }
  const cList=Object.entries(counties).sort((a,b)=>b[1].pop-a[1].pop);
  const cIdx={};cList.forEach(([f],i)=>cIdx[f]=i);
  const cityList=Object.values(cities).sort((a,b)=>b.pop-a.pop);
  const cityIdx={};cityList.forEach((c,i)=>cityIdx[c.name]=i);
  const proj=d3.geoAlbersUsa().scale(1300).translate([487.5,305]);
  const zrows=zs.sort((a,b)=>a.zip<b.zip?-1:1).map(r=>[r.zip,cityIdx[r.city],r.population,...((p=>p?[Math.round(p[0]*10)/10,Math.round(p[1]*10)/10]:[0,0])(proj([r.longitude,r.latitude]))),Math.round(r.density)].join(',')).join(';');
  const fs2=FIPS[ab];
  const paths={};
  for(const f of cf){if(Math.floor(+f.id/1000)!==fs2)continue;const d=gp(f);if(d)paths[+f.id]=d.replace(/(\.\d)\d+/g,'$1');}
  const sf=st.find(f=>+f.id===fs2);const b=gp.bounds(sf);
  const vb=[Math.floor(b[0][0])-2,Math.floor(b[0][1])-2,Math.ceil(b[1][0]-b[0][0])+4,Math.ceil(b[1][1]-b[0][1])+4];
  const data={ab,vb,outline:gp(sf).replace(/(\.\d)\d+/g,'$1'),
    counties:cList.map(([f,c])=>[+f,c.name,c.pop,Math.round(c.pop/Math.max(c.area,0.01)),paths[+f]||'']),
    cities:cityList.map(c=>{const top=Object.entries(c.cty).sort((a,b)=>b[1]-a[1])[0][0];return [c.name,cIdx[top],c.pop];}),
    zips:zrows};
  const s='GR.geoLoaded('+JSON.stringify(data)+');\n';
  total+=s.length;fs.writeFileSync(path.join(OUT,ab+'.js'),s);
}
console.log('total geo bytes',total, 'us', fs.statSync(path.join(OUT,'us.js')).size);
