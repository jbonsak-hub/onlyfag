// Offline prototype snapshot: reuses local flags and country geometry.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const core=read('assets/geography/core.js');
function declaration(text,name){const start=text.search(new RegExp('(?:const|var) '+name+'\\s*='));if(start<0)throw Error(name);return text.slice(start,text.indexOf(';',start)+1).replace(/^(const|var)/,'var');}
function fn(text,name,next){const a=text.indexOf('function '+name+'('),b=text.indexOf('function '+next+'(',a);if(a<0||b<0)throw Error(name);return text.slice(a,b);}
const box={window:{},atob:s=>Buffer.from(s,'base64').toString('binary'),document:{readyState:'loading',addEventListener(){},querySelectorAll(){return[]}},flagHtml(){return''}};
vm.createContext(box);vm.runInContext(read('assets/geography/quiz-data.js'),box);
vm.runInContext(read('assets/geography/flags-simple.js'),box);vm.runInContext(read('assets/geography/flags-extra.js'),box);
vm.runInContext(declaration(core,'COUNTRY_MAP_FILL_B64')+declaration(core,'COUNTRY_MAP_FILL_NAMES')+declaration(core,'COUNTRY_MAP_FEATURE')+fn(core,'countryMapDecodeCompactPolygon','countryMapLandData'),box);
const geometry=vm.runInContext('countryMapDecodeCompactPolygon(COUNTRY_MAP_FILL_B64,COUNTRY_MAP_FILL_NAMES)',box);
const featureNames=vm.runInContext('COUNTRY_MAP_FEATURE',box),flags=vm.runInContext('SIMPLE_FLAGS',box);
const data=box.window.GEO_QUIZ_DATA;
const capitals=JSON.parse(core.match(/const GEO_CAPITAL_TARGETS = (\[[^\n]+\]);/)[1]);
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
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const cities=JSON.parse(read('assets/geography/mapwiz-cities.json')).cities.filter(c=>!capitals.some(t=>norm(t.name)===norm(c.name)||Math.hypot(t.lat-c.lat,t.lon-c.lon)<.08));
const difficulties=JSON.parse(read('assets/geography/mapwiz-difficulties.json'));
if(difficulties.version!==1||difficulties.levels.map(level=>level.id).join(',')!=='easy,medium,hard'||!difficulties.assignments)throw Error('Invalid MapWiz difficulty definitions');
const worldMap=JSON.parse(read('assets/geography/mapwiz-world-map.json'));
if(worldMap.projection!=='mercator'||worldMap.top<81||worldMap.bottom>-58.8||!fs.existsSync(path.join(root,worldMap.image.replace(/^\//,''))))throw Error('Rebuild the MapWiz world map');
const places=JSON.parse(core.match(/const GEO_PLACE_TARGETS = (\[[^\n]+\]);/)[1]);
// The Arctic is an area: use a representative point inside the requested
// world crop while preserving the original source record for cached consumers.
const extraTargets=places.filter(target=>target.category==='Historiske riker og gamle navn'&&!['Levanten','Mesopotamia'].includes(target.name)||['Antarktis','Arktis','Dronning Mauds land'].includes(target.name)).map(target=>target.name==='Arktis'?{...target,lat:80}:target);
if(extraTargets.length!==18||extraTargets.some(target=>difficulties.assignments[target.category==='Historiske riker og gamle navn'?'historical':'regions'][target.name]!=='hard'))throw Error('MapWiz must retain all eighteen approved historical and polar additions');
const result={countries,cities,difficulties,worldMap,extraTargets};
const out='/* Generated by scripts/build-mapwiz-prototype.cjs. Public reference data only. */\nwindow.MAPWIZ_PROTOTYPE_DATA='+JSON.stringify(result)+';\n';
const riverData=JSON.parse(read('assets/geography/mapwiz-river-midpoints.json'));
const outputs={'assets/geography/mapwiz-prototype-data.js':out,'assets/geography/mapwiz-river-data.js':'/* Public Natural Earth main-course midpoint snapshot. See mapwiz-river-midpoints.json. */\nwindow.MAPWIZ_RIVER_MIDPOINTS='+JSON.stringify(riverData.targets)+';\n'};
// Begin the two map downloads while the menu scripts are loading. Keep their
// addresses in sync with the projection manifest and retain cached old assets.
for(const page of ['geografi/mapwiz.html','prototypes/mapwiz.html']){
 const choices={light:[worldMap.image,worldMap.hydrology.image],dark:[worldMap.dark.image,worldMap.dark.hydrology.image]};
 const html=read(page),preloads='<!-- mapwiz-map-preload:start --><script>(()=>{const maps='+JSON.stringify(choices)+';let dark=false;try{dark=localStorage.getItem("geoDarkMode")==="1";}catch{}for(const href of maps[dark?"dark":"light"]){const link=document.createElement("link");link.rel="preload";link.as="image";link.href=href;link.fetchPriority="low";document.head.append(link);}})();</script><!-- mapwiz-map-preload:end -->';
 const updated=html.includes('<!-- mapwiz-map-preload:start -->')?html.replace(/<!-- mapwiz-map-preload:start -->[\s\S]*?<!-- mapwiz-map-preload:end -->/,preloads):html.replace('</head>',preloads+'</head>');
 outputs[page]=updated;
}
for(const [name,content] of Object.entries(outputs)){
 if(process.argv.includes('--check')){if(read(name).replace(/\r\n/g,'\n')!==content)throw Error('Rebuild MapWiz prototype data');}
 else fs.writeFileSync(path.join(root,name),content);
}
console.log(JSON.stringify({countries:countries.length,localFlags:countries.filter(c=>c.flag).length,cities:cities.length}));
