// Pin the exact public 256-pixel overview responses; never re-encode imagery.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base=path.join(root,'assets/geography/drop-prototype'),dir=path.join(base,'terrain-cache');
const manifestPath=path.join(dir,'manifest.json'),scratch=path.resolve(root,'../watershed-terrain-downloads');
const check=process.argv.includes('--check'),planOnly=process.argv.includes('--plan');
const read=file=>fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const regions=JSON.parse(read(path.join(base,'regions.json'))),app=read(path.join(base,'app.js'));
const palette=app.match(/const heightPalette=([^\n]+);/),rule=app.match(/const elevationRule=([^\n]+);/);
assert(palette&&rule,'The renderer must expose the fixed height palette and rule');
const elevationRule=JSON.parse(vm.runInNewContext('const heightPalette='+palette[1]+';const elevationRule='+rule[1]+';JSON.stringify(elevationRule)',{}, {timeout:1000}));
assert.deepEqual(elevationRule.rasterFunctionArguments.Raster.rasterFunctionArguments.Statistics,[[0,2500,1250,700]]);
assert.equal(elevationRule.rasterFunctionArguments.Raster.rasterFunctionArguments.DRA,false);
const origin=JSON.parse(app.match(/tileOrigin=(\[[^\]]+\])/)[1]),resolution=Number(app.match(/tileResolution=([\d.]+)/)[1]),tileSize=256,{west,north,unitsPerKm}=regions.projection,units=unitsPerKm/1000;
const attribution={name:'© Kartverket',url:'https://www.kartverket.no/',license:'CC BY 4.0',licenseURL:'https://creativecommons.org/licenses/by/4.0/',termsURL:'https://www.kartverket.no/api-og-data/vilkar-for-bruk',termsChecked:'2026-11-05'};
function originalURL(layer,z,row,col){
 const span=tileSize*resolution/2**z,x=origin[0]+col*span,y=origin[1]-row*span;
 if(layer==='elevation')return 'https://hoydedata.no/arcgis/rest/services/DTM/ImageServer/exportImage?'+new URLSearchParams({f:'image',format:'png32',bbox:[x,y-span,x+span,y].join(','),bboxSR:'25833',imageSR:'25833',size:'256,256',interpolation:'RSP_BilinearInterpolation',renderingRule:JSON.stringify(elevationRule)});
 return 'https://wms.geonorge.no/skwms1/wms.hoyde-dtm?'+new URLSearchParams({service:'WMS',version:'1.3.0',request:'GetMap',layers:'DTM:multiskyggerelieff',styles:'',crs:'EPSG:25833',bbox:[x,y-span,x+span,y].join(','),width:'256',height:'256',format:'image/png',transparent:'true'});
}
const expected=new Map();
for(const [layer,levels] of [['relief',[3,4,5]],['elevation',[5]]])for(const z of levels){
 const span=tileSize*resolution/2**z;
 for(const region of regions.regions){
  const [left,top,right,bottom]=region.bounds,minE=west+left/units,maxE=west+right/units,maxN=north-top/units,minN=north-bottom/units;
  for(let row=Math.max(0,Math.floor((origin[1]-maxN)/span));row<=Math.min(2**z-1,Math.floor((origin[1]-minN)/span));row++)for(let col=Math.max(0,Math.floor((minE-origin[0])/span));col<=Math.min(2**z-1,Math.floor((maxE-origin[0])/span));col++){
   const key=[layer,z,row,col].join('/');expected.set(key,{layer,z,row,col,originalURL:originalURL(layer,z,row,col)});
  }
 }
}
const metadata={version:1,projection:regions.projection,matrix:{crs:'EPSG:25833',origin,resolution,tileSize},coverage:regions.regions.map(({id,bounds})=>({id,bounds})),levels:{relief:[3,4,5],elevation:[5]},elevationRule,attribution};
function imageInfo(bytes){
 assert(bytes.length>=45&&bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a','Source must return PNG bytes');
 assert.equal(bytes.toString('ascii',12,16),'IHDR');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);assert.equal(width,256);assert.equal(height,256);
 return{width,height};
}
const filename=(item,digest)=>[item.layer,item.z,item.row,item.col,digest.slice(0,16)].join('-')+'.png';
function valid(record,item){
 try{
  for(const key of ['layer','z','row','col','originalURL'])assert.deepEqual(record[key],item[key]);
  assert.match(record.sha256,/^[a-f0-9]{64}$/);assert.equal(record.file,filename(item,record.sha256));
  const bytes=fs.readFileSync(path.join(dir,record.file));assert.equal(sha(bytes),record.sha256);assert.equal(bytes.length,record.bytes);assert.deepEqual(imageInfo(bytes),{width:record.width,height:record.height});assert(!Number.isNaN(Date.parse(record.fetchedAt)));
  return true;
 }catch{return false;}
}
let manifest=fs.existsSync(manifestPath)?JSON.parse(read(manifestPath)):{...metadata,tiles:{}};
const summary=()=>({tiles:expected.size,byLayer:[...new Set([...expected.values()].map(t=>t.layer))].map(layer=>({layer,tiles:[...expected.values()].filter(t=>t.layer===layer).length})),files:new Set(Object.values(manifest.tiles||{}).map(t=>t.file)).size,bytes:[...new Map(Object.values(manifest.tiles||{}).map(t=>[t.file,t.bytes])).values()].reduce((a,b)=>a+b,0)});
if(planOnly){console.log(JSON.stringify({plan:true,...summary()}));process.exit(0);}
if(check){
 for(const key of Object.keys(metadata))assert.deepEqual(manifest[key],metadata[key],'Cache metadata: '+key);
 assert.deepEqual(Object.keys(manifest.tiles).sort(),[...expected.keys()].sort(),'Complete overview coverage');
 for(const [key,item]of expected)assert(valid(manifest.tiles[key],item),'Invalid cached response: '+key);
 console.log(JSON.stringify({success:true,offline:true,...summary()}));process.exit(0);
}
fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(scratch,{recursive:true});
manifest={...metadata,tiles:Object.fromEntries([...expected].filter(([key,item])=>valid(manifest.tiles?.[key],item)).map(([key])=>[key,manifest.tiles[key]]))};
function persist(){const sorted={...manifest,tiles:Object.fromEntries(Object.entries(manifest.tiles).sort(([a],[b])=>a.localeCompare(b)))};fs.writeFileSync(manifestPath,JSON.stringify(sorted,null,2)+'\n');}
persist();
async function download(item){
 const cacheName=sha(item.originalURL),rawPath=path.join(scratch,cacheName+'.png'),recordPath=path.join(scratch,cacheName+'.json');let bytes,source;
 try{source=JSON.parse(read(recordPath));bytes=fs.readFileSync(rawPath);assert.equal(source.originalURL,item.originalURL);assert.equal(sha(bytes),source.sha256);imageInfo(bytes);}catch{bytes=null;}
 if(!bytes){
  let error;
  for(let attempt=0;attempt<3;attempt++)try{
   const response=await fetch(item.originalURL,{signal:AbortSignal.timeout(90000),headers:{'User-Agent':'OnlyFag-overview-cache/1.0'}});assert(response.ok,'HTTP '+response.status);bytes=Buffer.from(await response.arrayBuffer());imageInfo(bytes);
   source={originalURL:item.originalURL,sha256:sha(bytes),fetchedAt:new Date().toISOString(),contentType:response.headers.get('content-type'),etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified')};
   fs.writeFileSync(rawPath,bytes);fs.writeFileSync(recordPath,JSON.stringify(source,null,2)+'\n');error=null;break;
  }catch(failure){error=failure;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
  if(error)throw error;
 }
 const digest=sha(bytes),file=filename(item,digest);fs.writeFileSync(path.join(dir,file),bytes);
 return{...item,file,sha256:digest,bytes:bytes.length,...imageInfo(bytes),fetchedAt:source.fetchedAt,sourceContentType:source.contentType,sourceETag:source.etag,sourceLastModified:source.lastModified};
}
(async()=>{
 console.log(JSON.stringify({downloading:true,...summary()}));
 const failures=[];
 // Independent service queues, at most two requests to each and four in total.
 await Promise.all(['relief','elevation'].map(async layer=>{
  const pending=[...expected].filter(([key,item])=>item.layer===layer&&!manifest.tiles[key]);let cursor=0;
  await Promise.all([0,1].map(async()=>{while(cursor<pending.length){const[key,item]=pending[cursor++];try{manifest.tiles[key]=await download(item);persist();console.log(key+' '+manifest.tiles[key].bytes+' bytes');}catch(error){failures.push(key+': '+error.message);console.error(key+' FAILED '+error.message);}}}));
 }));
 assert.equal(failures.length,0,failures.join('\n'));assert.equal(Object.keys(manifest.tiles).length,expected.size);persist();console.log(JSON.stringify({success:true,...summary()}));
})().catch(error=>{console.error(error);process.exitCode=1;});
