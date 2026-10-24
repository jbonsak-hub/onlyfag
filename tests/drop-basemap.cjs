// Deterministic basemap integration: projected landmark images replace remote
// maps, so registration, late responses and failure recovery run offline.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.DROP_SCREENSHOTS||path.resolve(root,'../drop-basemap-validation');
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/drop-prototype/data.json'),'utf8'));
assert.equal(data.source.crs,'EPSG:25833');assert.equal(data.yUp,false);
const [west,,,north]=data.source.projectedBounds,unitsPerMetre=data.unitsPerKm/1000;
const byId=new Map(data.segments.map(segment=>[String(segment.id),segment]));
// These are fixed points on real source rivers, independent of tile requests.
const landmarks=[...data.starts.map(start=>byId.get(String(start.segment)).points[0]),...data.segments.filter((_,i)=>i%131===0).map(segment=>segment.points[Math.floor(segment.points.length/2)])].map(raw=>({raw,easting:west+raw[0]/unitsPerMetre,northing:north-raw[1]/unitsPerMetre}));
const colors={topo:['#dde6cc','#ff0033'],toporaster:['#c8dedf','#0033ff'],relief:['#b1b9b5','#ff00ff']};
const report={viewports:[],requests:[],errors:[],unexpected:[],mutations:[]};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((request,response)=>{
 if(!['GET','HEAD'].includes(request.method)){report.mutations.push(request.method+' '+request.url);return response.writeHead(405).end();}
 if(request.url==='/favicon.ico')return response.writeHead(204).end();
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
 try{response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(request.method==='HEAD'?undefined:fs.readFileSync(file));}catch{return response.writeHead(404).end();}
});
function requestedTile(url){
 const u=new URL(url),origin=[-2500000,9045984],baseSpan=256*21664;
 if(u.hostname==='cache.kartverket.no'){
  const match=u.pathname.match(/^\/v1\/wmts\/1\.0\.0\/(topo|toporaster)\/default\/utm33n\/(\d{2})\/(\d+)\/(\d+)\.png$/);
  assert(match,'The WMTS URL uses the official UTM33 matrix and padded matrix ID');
  const [,layer,matrix,rowText,colText]=match,z=Number(matrix),row=Number(rowText),col=Number(colText),span=baseSpan/2**z;
  assert(z>=0&&z<=18&&row>=0&&col>=0&&row<2**z&&col<2**z,'WMTS indices fit their matrix');
  return {layer,z,row,col,left:origin[0]+col*span,top:origin[1]-row*span,span};
 }
 assert.equal(u.origin+u.pathname,'https://wms.geonorge.no/skwms1/wms.hoyde-dtm');
 const p=u.searchParams;
 for(const [key,value] of Object.entries({service:'WMS',version:'1.3.0',request:'GetMap',layers:'DTM:multiskyggerelieff',styles:'',crs:'EPSG:25833',width:'256',height:'256',format:'image/png',transparent:'true'}))assert.equal(p.get(key),value,'WMS '+key);
 const bbox=p.get('bbox').split(',').map(Number);assert(bbox.length===4&&bbox.every(Number.isFinite),'WMS bbox has four projected coordinates');
 const [left,bottom,right,top]=bbox,span=right-left,z=Math.log2(baseSpan/span),col=(left-origin[0])/span,row=(origin[1]-top)/span;
 assert(Math.abs(top-bottom-span)<1e-6,'WMS EPSG:25833 bbox uses easting/northing and square pixels');
 for(const [key,value] of Object.entries({z,row,col}))assert(Math.abs(value-Math.round(value))<1e-6,'WMS '+key+' aligns with the UTM33 grid');
 return {layer:'relief',z:Math.round(z),row:Math.round(row),col:Math.round(col),left,top,span,bbox};
}
function mockImage(tile){
 const [background,marker]=colors[tile.layer];
 const circles=landmarks.map(point=>{const x=(point.easting-tile.left)/tile.span*256,y=(tile.top-point.northing)/tile.span*256;return x>=-6&&x<=262&&y>=-6&&y<=262?'<circle cx="'+x+'" cy="'+y+'" r="4" fill="'+marker+'"/>':'';}).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="'+background+'"/>'+circles+'</svg>';
}
const snapshot=page=>page.evaluate(()=>DropPrototype.snapshot());
function journey(state){return {camera:state.camera,zoom:state.zoom,pan:state.pan,route:state.route,selectedSegment:state.selectedSegment,basin:state.basin,progress:state.progress};}
async function settled(page){await page.waitForFunction(()=>document.getElementById('map-status').textContent==='');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function registration(page,layer){
 const rgb=colors[layer][1].slice(1).match(/../g).map(value=>parseInt(value,16));
 const result=await page.evaluate(({points,rgb})=>{
  const canvas=document.getElementById('river-map'),context=canvas.getContext('2d'),ratio=canvas.width/canvas.clientWidth,visible=[];
  for(const point of points){const p=DropPrototype.worldToScreen(point.raw);if(p.x<20||p.x>innerWidth-20||p.y<20||p.y>innerHeight-20)continue;
   const x=Math.round(p.x*ratio),y=Math.round(p.y*ratio),pixels=context.getImageData(x-2,y-2,5,5).data;
   let found=false;for(let i=0;i<pixels.length;i+=4)if(rgb.every((value,j)=>Math.abs(pixels[i+j]-value)<20))found=true;
   visible.push({raw:point.raw,screen:p,found});
  }return visible;
 },{points:landmarks,rgb});
 assert(result.length>=3,'At least three independent river landmarks are visible');
 assert(result.every(point=>point.found),'Projected basemap landmarks coincide with worldToScreen river positions: '+JSON.stringify(result.filter(point=>!point.found)));
 return result.length;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  async function open(viewport,deviceScaleFactor=1){
   const context=await browser.newContext({viewport,deviceScaleFactor,reducedMotion:'reduce'}),network={hold:false,pending:[],fail:new Set()};
   await context.route('**/*',async route=>{
    const request=route.request(),url=request.url();
    if(!['GET','HEAD'].includes(request.method())){report.mutations.push(request.method()+' '+url);return route.abort();}
    if(url.startsWith(base+'/')||/^(data|blob):/.test(url))return route.continue();
    if(!/^https:\/\/(cache\.kartverket\.no|wms\.geonorge\.no)\//.test(url)){report.unexpected.push(url);return route.abort();}
    try{
     const tile=requestedTile(url);report.requests.push({method:request.method(),url,...tile});
     if(network.hold)await new Promise(resolve=>network.pending.push({tile,resolve}));
     if(network.fail.has(tile.layer))return route.fulfill({status:503,contentType:'text/plain',headers:{'access-control-allow-origin':'*'},body:'mock unavailable'});
     return route.fulfill({status:200,contentType:'image/svg+xml',headers:{'access-control-allow-origin':'*'},body:mockImage(tile)});
    }catch(error){report.errors.push(error.message);return route.abort();}
   });
   const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
   await page.goto(base+'/prototypes/folg-drapen.html');await page.waitForFunction(()=>window.DropPrototype?.snapshot().ready);await settled(page);
   return {page,context,network};
  }
  for(const [viewport,dpr] of [[{width:1366,height:900},1],[{width:390,height:844},2]]){
   const {page,context}=await open(viewport,dpr);const initial=await snapshot(page),beforeRequests=report.requests.length;
   assert.equal(initial.mapLayer,'dark');assert(initial.showRivers&&initial.paused);assert(await page.locator('#show-rivers').isDisabled());assert(await page.locator('#basemap-credit').isHidden());
   await page.locator('#river-map').focus();await page.keyboard.press('+');await page.keyboard.press('ArrowLeft');await settled(page);
   assert.equal(report.requests.length,beforeRequests,'The default dark map makes no external tile requests, including during navigation');
   const retained=journey(await snapshot(page)),registrations={};
   for(const layer of ['topo','toporaster','relief']){
    await page.locator('#map-layer').selectOption(layer);await page.locator('#show-rivers').uncheck();await settled(page);
    const state=await snapshot(page);assert.deepEqual(journey(state),retained,'Changing '+layer+' keeps the selected river and camera');assert.equal(state.showRivers,false);assert(await page.locator('#basemap-credit').isVisible());
    registrations[layer]=await registration(page,layer);await page.screenshot({path:path.join(out,'basemap-'+layer+'-'+viewport.width+'.png')});
   }
   const layers=report.requests.slice(beforeRequests).map(request=>request.layer);for(const layer of ['topo','toporaster','relief'])assert(layers.includes(layer),'The '+layer+' layer requested its own imagery');
   await page.locator('#map-layer').selectOption('dark');await settled(page);const dark=await snapshot(page);assert.deepEqual(journey(dark),retained);assert(dark.showRivers);assert(await page.locator('#show-rivers').isChecked());assert(await page.locator('#show-rivers').isDisabled());assert(await page.locator('#basemap-credit').isHidden());
   report.viewports.push({viewport,dpr,registrations,darkHasNoExternalRequests:true,retainsJourney:true});await context.close();
  }
  // All initial responses are delayed until the camera has moved. They must be
  // drawn at their geographic location under the new camera, never old pixels.
  {
   const {page,context,network}=await open({width:1366,height:900});network.hold=true;
   await page.locator('#map-layer').selectOption('topo');await page.locator('#show-rivers').uncheck();
   await page.waitForFunction(()=>document.getElementById('map-status').textContent.includes('Laster'));
   for(let attempt=0;attempt<100&&!network.pending.length;attempt++)await page.waitForTimeout(10);
   assert(network.pending.length>0,'The test delays real in-flight map requests');const original=await snapshot(page);
   await page.locator('#river-map').focus();for(let i=0;i<6;i++)await page.keyboard.press('ArrowRight');
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));const moved=await snapshot(page);assert(Math.abs(moved.pan[0]-original.pan[0])>=200);
   network.hold=false;for(const pending of network.pending.splice(0))pending.resolve();await settled(page);
   assert.deepEqual(journey(await snapshot(page)),journey(moved),'Late tile responses never change the current camera or journey');
   report.delayedResponseLandmarks=await registration(page,'topo');await context.close();
  }
  {
   const {page,context,network}=await open({width:1366,height:900});network.fail.add('relief');const initial=journey(await snapshot(page));
   await page.locator('#map-layer').selectOption('relief');await page.waitForFunction(()=>document.getElementById('map-status').textContent.includes('kunne ikke lastes'));
   assert.deepEqual(journey(await snapshot(page)),initial,'A tile service failure preserves the river and camera');assert(!(await page.locator('#start-point').isDisabled()));
   const current=await snapshot(page),alternative=data.starts.find(start=>String(start.id)!==current.selectedStart);
   await page.locator('#start-point').selectOption(String(alternative.id));assert.equal((await snapshot(page)).selectedStart,String(alternative.id),'River controls still work during a tile service failure');
   await page.locator('#map-layer').selectOption('dark');await settled(page);assert((await snapshot(page)).showRivers);assert.equal(await page.locator('#map-status').textContent(),'');
   network.fail.clear();await page.locator('#map-layer').selectOption('relief');await page.locator('#show-rivers').uncheck();await settled(page);await registration(page,'relief');
   report.failureRecovery=true;await context.close();
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.unexpected,[]);assert.deepEqual(report.mutations,[]);report.success=true;
  console.log(JSON.stringify({success:true,viewports:report.viewports,requests:report.requests.length,delayedResponseLandmarks:report.delayedResponseLandmarks,failureRecovery:report.failureRecovery}));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'basemap-results.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(error=>{console.error(error);process.exitCode=1;});
