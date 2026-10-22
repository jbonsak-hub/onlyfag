// Offline equirectangular land mask from the site's public-domain Natural Earth data.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/geography/core.js'),'utf8');
function declaration(name){const start=source.search(new RegExp('const '+name+'\\s*='));let quote=null,escaped=false;for(let i=start;i<source.length;i++){const c=source[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;}else if(c==='"'||c==="'")quote=c;else if(c===';')return source.slice(start,i+1).replace(/^const/,'var');}throw Error(name);}
const box={atob:s=>Buffer.from(s,'base64').toString('binary')};vm.createContext(box);for(const name of ['COUNTRY_MAP_FILL_B64','COUNTRY_MAP_FILL_NAMES'])vm.runInContext(declaration(name),box);vm.runInContext(source.slice(source.indexOf('function countryMapDecodeCompactPolygon('),source.indexOf('function countryMapLandData(')),box);const world=vm.runInContext('countryMapDecodeCompactPolygon(COUNTRY_MAP_FILL_B64,COUNTRY_MAP_FILL_NAMES)',box);
const paths=[];
for(const f of world.features){
  const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  for(const poly of polygons){
    const rings=poly.map(ring=>{let previous=ring[0][0];return ring.map(([longitude,latitude])=>{let lon=longitude;while(lon-previous>180)lon-=360;while(lon-previous<-180)lon+=360;previous=lon;return [lon,latitude];});});
    const longitudes=rings[0].map(p=>p[0]),west=Math.min(...longitudes),east=Math.max(...longitudes);
    for(const shift of [-360,0,360]){
      if(east+shift<=-180||west+shift>=180)continue;
      let d='';for(const ring of rings){for(let i=0;i<ring.length;i++){const x=(ring[i][0]+shift+180)/360*2048,y=(90-ring[i][1])/180*1024;d+=(i?'L':'M')+Number(x.toFixed(1))+' '+Number(y.toFixed(1));}d+='Z';}
      paths.push('<path d="'+d+'"/>');
    }
  }
}
const result='<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1024" viewBox="0 0 2048 1024"><rect width="2048" height="1024" fill="black"/><g fill="white" fill-rule="evenodd">'+paths.join('')+'</g></svg>\n';const target=path.join(root,'assets/geography/global-circulation/earth-mask.svg');if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n')!==result)throw Error('Run scripts/build-circulation-map.cjs');}else fs.writeFileSync(target,result);console.log('PASS equirectangular land mask');
