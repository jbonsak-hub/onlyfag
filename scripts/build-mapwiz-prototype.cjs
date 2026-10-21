// Offline prototype snapshot: reuses the actual GeoGrid predicates, flags and
// country geometry. No duplicate hand-maintained clue rules or runtime lookups.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const core=read('assets/geography/core.js'),maplab=read('assets/geography/maplab.html');
function declaration(text,name){const start=text.search(new RegExp('(?:const|var) '+name+'\\s*='));if(start<0)throw Error(name);return text.slice(start,text.indexOf(';',start)+1).replace(/^(const|var)/,'var');}
function fn(text,name,next){const a=text.indexOf('function '+name+'('),b=text.indexOf('function '+next+'(',a);if(a<0||b<0)throw Error(name);return text.slice(a,b);}
const box={window:{},atob:s=>Buffer.from(s,'base64').toString('binary'),document:{readyState:'loading',addEventListener(){},querySelectorAll(){return[]}},flagHtml(){return''}};
vm.createContext(box);vm.runInContext(read('assets/geography/quiz-data.js'),box);
vm.runInContext(read('assets/geography/flags-simple.js'),box);vm.runInContext(read('assets/geography/flags-extra.js'),box);
vm.runInContext(declaration(core,'COUNTRY_MAP_FILL_B64')+declaration(core,'COUNTRY_MAP_FILL_NAMES')+declaration(core,'COUNTRY_MAP_FEATURE')+fn(core,'countryMapDecodeCompactPolygon','countryMapLandData'),box);
const geometry=vm.runInContext('countryMapDecodeCompactPolygon(COUNTRY_MAP_FILL_B64,COUNTRY_MAP_FILL_NAMES)',box);
const featureNames=vm.runInContext('COUNTRY_MAP_FEATURE',box),flags=vm.runInContext('SIMPLE_FLAGS',box);
const data=box.window.GEO_QUIZ_DATA;
for(const name of ['GEO_GRID_COUNTRIES','GEO_LANDLOCKED','GEO_DOUBLE_LANDLOCKED','GEO_EQUATOR','GEO_CANCER','GEO_CAPRICORN'])vm.runInContext(declaration(maplab,name),box);
for(const name of ['geoNorm','geoHasLang','geoInSet','tradleNormName']){
 const line=maplab.split('\n').find(l=>l.startsWith('function '+name+'('));vm.runInContext(line,box);
}
vm.runInContext(fn(maplab,'geoCriterionPool','geoShuffle'),box);
const criteria=box.geoCriterionPool();
const capitals=JSON.parse(core.match(/const GEO_CAPITAL_TARGETS = (\[[^\n]+\]);/)[1]);
const regions=JSON.parse(declaration(core,'COUNTRY_MAP_REGION_COUNTRIES').match(/=([\s\S]+);/)[1]);
const continent={africa:'Afrika',asia:'Asia',europe:'Europa',northamerica:'Nord-Amerika',southamerica:'Sør-Amerika',oceania:'Oseania'};
const facts=[...box.GEO_GRID_COUNTRIES];
// GeoGrid omits 23 small island states. They must still be considered when
// proving uniqueness. Reuse known country-table facts; treat missing fields as
// potentially matching, rather than silently ruling a country out.
for(const c of data.countries.filter(c=>!facts.some(m=>m.country===c.country))){
 const cap=capitals.find(t=>t.country===c.country),region=Object.keys(regions).find(r=>regions[r].includes(c.country));
 facts.push({country:c.country,capital:c.capital,area:Number(String(c.area).replace(/\s|km²/g,'')),capLat:cap?.lat,capLon:cap?.lon,continent:continent[region]});
}
const borderCriteria=new Set(['manyb','manymanyb','oneb','twob','nob','morebNorway']);
const latitudeCriteria=new Set(['north50','southcap','south20','tropicalcap','eqcap']);
const longitudeCriteria=new Set(['westgreen','east60','east100','west60']);
const languageCriteria=new Set(['eng','fra','spa','ara','por','ger']);
function couldMatch(c,m){
 if(languageCriteria.has(c.id)&&!m.languages)return true;
 if(borderCriteria.has(c.id)&&m.borders==null)return true;
 if(latitudeCriteria.has(c.id)&&m.capLat==null)return true;
 if(longitudeCriteria.has(c.id)&&m.capLon==null)return true;
 return c.test(m);
}
function area(r){return Math.abs(r.reduce((a,p,i)=>{const q=r[(i+1)%r.length];return a+p[0]*q[1]-q[0]*p[1]},0)/2);}
function inside(p,r){let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function inPolygon(p,poly){return inside(p,poly[0])&&!poly.slice(1).some(r=>inside(p,r));}
function center(geom){
 const polys=geom.type==='Polygon'?[geom.coordinates]:geom.coordinates;
 const poly=polys.slice().sort((a,b)=>area(b[0])-area(a[0]))[0],r=poly?.[0];if(!r?.length)return null;
 let s=0,x=0,y=0;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length],k=a[0]*b[1]-b[0]*a[1];s+=k;x+=(a[0]+b[0])*k;y+=(a[1]+b[1])*k;}
 const centroid=[x/(3*s),y/(3*s)];if(!centroid.every(Number.isFinite))return null;
 if(inPolygon(centroid,poly))return {lon:centroid[0],lat:centroid[1]};
 let left=Math.min(...r.map(p=>p[0])),right=Math.max(...r.map(p=>p[0])),bottom=Math.min(...r.map(p=>p[1])),top=Math.max(...r.map(p=>p[1])),best=null,score=Infinity;
 for(let pass=0;pass<4;pass++){
  const dx=(right-left)/32,dy=(top-bottom)/32;
  for(let i=0;i<=32;i++)for(let j=0;j<=32;j++){const p=[left+i*dx,bottom+j*dy],d=(p[0]-centroid[0])**2+(p[1]-centroid[1])**2;if(d<score&&inPolygon(p,poly)){best=p;score=d;}}
  if(!best)continue;left=best[0]-dx;right=best[0]+dx;bottom=best[1]-dy;top=best[1]+dy;
 }
 return best?{lon:best[0],lat:best[1]}:null;
}
const countries=[];
for(const country of data.countries){
 const feature=geometry.features.find(f=>f.properties.name===featureNames[country.country]);if(!feature)continue;
 const point=center(feature.geometry);if(!point)continue;
 const flag=flags[country.flagCode]||country.flag||'';
 countries.push({name:country.country,...point,feature:feature.properties.name,flag:flag.startsWith('data:image/')?flag:null});
}
const matches=criteria.map(c=>new Set(facts.filter(m=>couldMatch(c,m)).map(m=>m.country))),triples=new Map();
function intersect(a,b){return new Set([...a].filter(x=>b.has(x)));}
for(let i=0;i<criteria.length;i++)for(let j=i+1;j<criteria.length;j++){
 const pair=intersect(matches[i],matches[j]);if(pair.size<2)continue;
 for(let k=j+1;k<criteria.length;k++){
  const all=intersect(pair,matches[k]);if(all.size!==1||intersect(matches[i],matches[k]).size<2||intersect(matches[j],matches[k]).size<2)continue;
  const name=[...all][0];if(!countries.some(c=>c.name===name))continue;
  const options=triples.get(name)||[];options.push([i,j,k]);triples.set(name,options);
 }
}
const clues=[];
for(const [name,options] of triples){
 const country=countries.find(c=>c.name===name); // varied deterministic sample, not hundreds of near-identical triples
 const picked=[...new Set([0,Math.floor(options.length/4),Math.floor(options.length/2),options.length-1])];
 for(const index of picked){const ids=options[index];clues.push({name,lat:country.lat,lon:country.lon,clues:ids.map(i=>criteria[i].label),criterionIds:ids.map(i=>criteria[i].id)});}
}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const cities=JSON.parse(read('assets/geography/mapwiz-cities.json')).cities.filter(c=>!capitals.some(t=>norm(t.name)===norm(c.name)||Math.hypot(t.lat-c.lat,t.lon-c.lon)<.08));
const result={countries,clues,cities,criteria:criteria.map((c,i)=>({id:c.id,label:c.label,matches:[...matches[i]]})),factCountries:facts.map(c=>c.country)};
const out='/* Generated by scripts/build-mapwiz-prototype.cjs. Public reference data only. */\nwindow.MAPWIZ_PROTOTYPE_DATA='+JSON.stringify(result)+';\n';
const riverData=JSON.parse(read('assets/geography/mapwiz-river-midpoints.json'));
const outputs={'assets/geography/mapwiz-prototype-data.js':out,'assets/geography/mapwiz-river-data.js':'/* Public Natural Earth main-course midpoint snapshot. See mapwiz-river-midpoints.json. */\nwindow.MAPWIZ_RIVER_MIDPOINTS='+JSON.stringify(riverData.targets)+';\n'};
for(const [name,content] of Object.entries(outputs)){
 if(process.argv.includes('--check')){if(read(name).replace(/\r\n/g,'\n')!==content)throw Error('Rebuild MapWiz prototype data');}
 else fs.writeFileSync(path.join(root,name),content);
}
console.log(JSON.stringify({countries:countries.length,localFlags:countries.filter(c=>c.flag).length,uniqueClueCountries:triples.size,clueVariants:clues.length,cities:cities.length}));
