// Controlled network stalls expose queue blocking without depending on real
// service latency. The image mocks retain the production UTM33 tile grid.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.DROP_SCREENSHOTS||path.resolve(root,'../watershed-map-loading-review');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/drop-prototype/regions.json'),'utf8'));
const south=manifest.regions.find(r=>r.id==='south').bounds,units=manifest.projection.unitsPerKm/1000;
const origin=[-2500000,9045984],baseSpan=256*21664;
const colors={topo:'#c9dce6',toporaster:'#e1cfaa',relief:'#a0a0a0',elevation:'#78b455'};
let terrainManifest;const verifiedLocalTiles=new Set();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
const intersects=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
const server=http.createServer((q,r)=>{if(!['GET','HEAD'].includes(q.method))return r.writeHead(405).end();if(q.url==='/favicon.ico')return r.writeHead(204).end();const file=path.resolve(root,'.'+new URL(q.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return r.writeHead(403).end();try{r.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');r.end(q.method==='HEAD'?undefined:fs.readFileSync(file));}catch{r.writeHead(404).end();}});

function tileRequest(url){
 const u=new URL(url),cached=u.pathname.match(/\/terrain-cache\/(relief|elevation)-(\d+)-(\d+)-(\d+)-([a-f0-9]+)\.png$/);let kind,z,row,col,left,bottom,right,top;
 if(cached){
  kind=cached[1];[z,row,col]=cached.slice(2,5).map(Number);const span=baseSpan/2**z;
  left=origin[0]+col*span;right=left+span;top=origin[1]-row*span;bottom=top-span;
  const key=[kind,z,row,col].join('/');
  if(!verifiedLocalTiles.has(key)){
   terrainManifest??=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/drop-prototype/terrain-cache/manifest.json'),'utf8'));
   assert.deepEqual(terrainManifest.projection,manifest.projection);assert.deepEqual(terrainManifest.matrix.origin,origin);assert.equal(terrainManifest.matrix.resolution,21664);assert.equal(terrainManifest.matrix.tileSize,256);
   const source=terrainManifest.tiles[key];assert(source,'Every local tile has a pinned original request');assert.equal(source.file,path.basename(u.pathname));
   const file=path.resolve(root,'.'+u.pathname),bytes=fs.readFileSync(file),hash=require('node:crypto').createHash('sha256').update(bytes).digest('hex');
   assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),256);assert.equal(bytes.readUInt32BE(20),256);assert.equal(source.width,256);assert.equal(source.height,256);
   assert.equal(bytes.length,source.bytes);assert.equal(hash,source.sha256);assert(hash.startsWith(cached[5]),'The local terrain tile retains its immutable source bytes');
   const original=tileRequest(source.originalURL);assert.equal(original.kind,kind);assert.equal(original.z,z);assert.equal(original.row,row);assert.equal(original.col,col);
   if(kind==='elevation')assert.deepEqual(JSON.parse(new URL(source.originalURL).searchParams.get('renderingRule')),terrainManifest.elevationRule);
   verifiedLocalTiles.add(key);
  }
 }else if(u.hostname==='cache.kartverket.no'){
  const match=u.pathname.match(/^\/v1\/wmts\/1\.0\.0\/(topo|toporaster)\/default\/utm33n\/(\d{2})\/(\d+)\/(\d+)\.png$/);
  assert(match,'The WMTS layer keeps its official UTM33 grid');kind=match[1];[z,row,col]=match.slice(2).map(Number);
  const span=baseSpan/2**z;left=origin[0]+col*span;right=left+span;top=origin[1]-row*span;bottom=top-span;
 }else{
  const p=u.searchParams,bbox=p.get('bbox');assert(bbox,'Raster requests expose projected bounds');[left,bottom,right,top]=bbox.split(',').map(Number);
  const span=right-left;z=Math.log2(baseSpan/span);row=(origin[1]-top)/span;col=(left-origin[0])/span;
  assert(Math.abs(top-bottom-span)<1e-6,'Raster pixels stay square');
  if(u.hostname==='hoydedata.no'){
   kind='elevation';assert.equal(u.pathname,'/arcgis/rest/services/DTM/ImageServer/exportImage');
   assert.equal(p.get('bboxSR'),'25833');assert.equal(p.get('imageSR'),'25833');assert.equal(p.get('size'),'256,256');assert.equal(p.get('format'),'png32');
   const rule=JSON.parse(p.get('renderingRule')),stretch=rule.rasterFunctionArguments?.Raster;
   assert.equal(rule.rasterFunction,'Colormap');assert.equal(stretch?.rasterFunction,'Stretch');
   assert.equal(stretch.rasterFunctionArguments.DRA,false,'Elevation colors retain one absolute scale');
   assert.deepEqual(stretch.rasterFunctionArguments.Statistics[0].slice(0,2),[0,2500]);
   assert(z>=5,'Height colors retain the existing minimum spatial resolution');
  }else{
   kind='relief';assert.equal(u.origin+u.pathname,'https://wms.geonorge.no/skwms1/wms.hoyde-dtm');
   for(const [key,value]of Object.entries({service:'WMS',version:'1.3.0',request:'GetMap',layers:'DTM:multiskyggerelieff',crs:'EPSG:25833',width:'256',height:'256',format:'image/png'}))assert.equal(p.get(key),value);
  }
 }
 for(const [key,value]of Object.entries({z,row,col}))assert(Number.isFinite(value)&&Math.abs(value-Math.round(value))<1e-6,'Raster '+key+' remains aligned with the UTM33 grid');
 assert(z>=0&&z<=18&&row>=0&&col>=0&&row<2**Math.round(z)&&col<2**Math.round(z));
 const world=[(left-manifest.projection.west)*units,(manifest.projection.north-top)*units,(right-manifest.projection.west)*units,(manifest.projection.north-bottom)*units];
 assert(intersects(world,south),'Every requested tile intersects the selected South region');
 return{kind,z:Math.round(z),row:Math.round(row),col:Math.round(col),world,source:cached?'local':'remote'};
}

(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={cases:[],errors:[],unexpected:[],qualityErrors:[],failures:[]};let browser,base=process.env.BASE_URL;
 try{
  if(!base){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;}
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  async function open(viewport){
   const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage();
   const network={hold:new Set(),requests:[],waiters:new Set(),closing:false};
   network.waitFor=(predicate,message)=>{
    const found=network.requests.find(predicate);if(found)return Promise.resolve(found);
    return new Promise((resolve,reject)=>{const waiter=()=>{const found=network.requests.find(predicate);if(found){clearTimeout(timer);network.waiters.delete(waiter);resolve(found);}},timer=setTimeout(()=>{network.waiters.delete(waiter);reject(new Error(message+'; started: '+network.requests.map(r=>r.kind).join(',')));},10000);network.waiters.add(waiter);});
   };
   network.release=async kind=>{network.hold.delete(kind);await Promise.all(network.requests.filter(r=>r.kind===kind&&r.held&&!r.released).map(r=>r.release()));};
   network.releaseAll=async()=>{network.hold.clear();await Promise.all(network.requests.filter(r=>r.held&&!r.released).map(r=>r.release()));};
   await context.route('**/*',async route=>{
    const request=route.request(),url=request.url();
    if(!['GET','HEAD'].includes(request.method())){report.unexpected.push(request.method()+' '+url);return route.abort();}
    const localTerrain=/\/terrain-cache\/(?:relief|elevation)-\d+-\d+-\d+-[a-f0-9]+\.png(?:\?|$)/.test(url);
    if(!localTerrain&&(url.startsWith(base+'/')||/^(data|blob):/.test(url)))return route.continue();
    if(!localTerrain&&!/^https:\/\/(cache\.kartverket\.no|wms\.geonorge\.no|hoydedata\.no)\//.test(url)){report.unexpected.push(url);return route.abort();}
    let tile;try{tile=tileRequest(url);}catch(error){report.qualityErrors.push(error.message);return route.abort();}
    const record={...tile,url,held:network.hold.has(tile.kind),released:false,started:Date.now()};let resolveHeld;
    const held=new Promise(resolve=>{resolveHeld=resolve;});
    record.release=async()=>{if(record.released)return;record.released=true;record.deliberateFailure=record.source==='local'&&network.failLocal;try{await route.fulfill(record.deliberateFailure?{status:503,body:'deliberate local cache failure'}:{status:200,contentType:'image/svg+xml',headers:{'access-control-allow-origin':'*'},body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="'+colors[record.kind]+'"/></svg>'});}catch(error){if(!network.closing&&!record.cancelled)throw error;}finally{resolveHeld();}};
    network.requests.push(record);for(const waiter of network.waiters)waiter();
    if(!record.held)return record.release();return held;
   });
   page.on('requestfailed',request=>{for(const record of network.requests)if(record.url===request.url()&&!record.released)record.cancelled=true;});
   page.on('pageerror',error=>report.errors.push(error.message));
   await page.goto(base+'/geografi/vassdrag.html');await page.waitForFunction(()=>window.DropPrototype?.snapshot().ready);
   assert.equal(network.requests.length,0,'Dark overview requests no map tiles');
   await page.locator('#map-style > summary').click();
   return{page,context,network,snapshot:()=>page.evaluate(()=>DropPrototype.snapshot()),close:async()=>{network.closing=true;await network.releaseAll();await context.close();}};
  }
  async function painted(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
  async function settled(page){await page.waitForFunction(()=>document.querySelector('#map-status').textContent==='');await painted(page);}
  async function choose(page,kind){await page.locator('#map-layer').selectOption(kind);await page.locator('#show-rivers').uncheck();await painted(page);}
  async function panTo(page,target,zoomSteps=0){
   return page.evaluate(({target,zoomSteps})=>{const c=document.querySelector('#river-map');for(let i=0;i<zoomSteps;i++)c.dispatchEvent(new KeyboardEvent('keydown',{key:'+',bubbles:true}));const p=DropPrototype.worldToScreen(target),delta=[innerWidth/2-p.x,innerHeight/2-p.y];for(const [value,positive,negative]of [[delta[0],'ArrowLeft','ArrowRight'],[delta[1],'ArrowUp','ArrowDown']])for(let i=0;i<Math.round(Math.abs(value)/40);i++)c.dispatchEvent(new KeyboardEvent('keydown',{key:value>0?positive:negative,bubbles:true}));const {camera}=DropPrototype.snapshot();return[-camera.tx/camera.scale,-camera.ty/camera.scale,(c.clientWidth-camera.tx)/camera.scale,(c.clientHeight-camera.ty)/camera.scale];},{target,zoomSteps});
  }
  async function run(name,viewport,check){
   const selected=process.env.LOADER_CASES?.split(',');if(selected&&!selected.includes(name))return;
   const fixture=await open(viewport),record={name,viewport},began=Date.now();
   try{await check(fixture,record);record.success=true;}catch(error){record.success=false;record.error=error.message;report.failures.push({name,error:error.message});}
   finally{record.durationMs=Date.now()-began;record.requests=fixture.network.requests.map(({kind,z,row,col,source,held,cancelled})=>({kind,z,row,col,source,held,cancelled:!!cancelled}));report.cases.push(record);await fixture.close();}
  }
  for(const viewport of [{width:1366,height:900},{width:390,height:844}])await run('relief-fairness-'+viewport.width,viewport,async({page,network,snapshot},record)=>{
   const began=Date.now();network.hold=new Set(['elevation','relief']);await choose(page,'relief');
   await network.waitFor(r=>r.kind==='relief','Physical relief must start while height responses are still held');
   assert(network.requests.filter(r=>r.kind==='elevation').every(r=>!r.released),'Height responses have not been released');
   record.firstWave=network.requests.map(r=>r.kind);
   await page.evaluate(()=>{const c=document.querySelector('#river-map');window.loaderBaseline=c.getContext('2d').getImageData(0,0,c.width,c.height).data;});
   await network.release('relief');
   // The relief multiplies a dark base while height colors are held, so its
   // first pixels can differ only slightly even though the image was painted.
   await page.waitForFunction(()=>{const c=document.querySelector('#river-map'),pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let changed=0;for(let i=0;i<pixels.length;i+=16)if(Math.max(...[0,1,2].map(k=>Math.abs(pixels[i+k]-loaderBaseline[i+k])))>2)changed++;return changed>100;});
   record.physicalReliefVisibleBeforeHeight=true;record.controlledReliefPaintMs=Date.now()-began;
   await network.waitFor(r=>r.kind==='elevation','Requested height colors must start after physical relief can progress');
   assert.notEqual(await page.locator('#map-status').textContent(),'','Loading stays visible while height colors are incomplete');assert(await page.locator('#map-status').isVisible(),'Pending imagery has a visible status');assert(await page.locator('#export-map').isDisabled(),'Export waits for the visible requested layers');
   await network.release('elevation');await settled(page);assert(await page.locator('#export-map').isEnabled());
   const s=await snapshot(),expectedZ=Math.max(0,Math.min(18,Math.round(Math.log2(21664*units*s.camera.scale))));
   assert(network.requests.some(r=>r.kind==='relief'&&r.z===expectedZ),'Relief retains the requested final detail level');assert(network.requests.some(r=>r.kind==='elevation'&&r.z===Math.max(5,expectedZ)),'Height colors retain the requested final detail level');
   assert.equal(s.mapLayer,'relief');assert(s.heightColors);assert.deepEqual(s.regionSummary.selected,['south']);
   record.pendingStatusCorrect=true;record.fullResolution=true;await page.screenshot({path:path.join(out,'relief-loaded-'+viewport.width+'.png')});
  });
  await run('layer-change',{width:1366,height:900},async({page,network,snapshot},record)=>{
   network.hold.add('topo');await choose(page,'topo');await network.waitFor(r=>r.kind==='topo','Old topo requests start');await painted(page);const before=await snapshot();
   const switched=Date.now();await choose(page,'toporaster');const firstNew=await network.waitFor(r=>r.kind==='toporaster','A new layer must start before held old-layer responses are released');record.newLayerRequestMs=firstNew.started-switched;
   assert(network.requests.filter(r=>r.kind==='topo').every(r=>!r.released),'Old topo payloads remain held');await settled(page);
   const after=await snapshot();assert.equal(after.mapLayer,'toporaster');assert.deepEqual(after.camera,before.camera);assert.deepEqual(after.regionSummary.selected,['south']);assert(await page.locator('#export-map').isEnabled(),'An obsolete request does not keep the current layer pending');
   record.newLayerStartsBeforeOldResponse=true;record.staleRequestsDoNotBlockStatus=true;
  });
  await run('pan-change',{width:1366,height:900},async({page,network,snapshot},record)=>{
   const x=(south[0]+south[2])/2,first=[x,south[1]+(south[3]-south[1])*.15],second=[x,south[1]+(south[3]-south[1])*.85];
   const oldView=await panTo(page,first,4);network.hold.add('topo');await choose(page,'topo');await network.waitFor(r=>r.kind==='topo','Old viewport requests start');await painted(page);
   const moved=Date.now(),newView=await panTo(page,second);assert(!intersects(oldView,newView),'The new test viewport is separate from the held viewport');await painted(page);
   const firstNew=await network.waitFor(r=>r.kind==='topo'&&!intersects(r.world,oldView)&&intersects(r.world,newView),'Visible tiles must start before held offscreen responses are released');record.newViewRequestMs=firstNew.started-moved;
   assert(network.requests.filter(r=>r.held).every(r=>!r.released),'The old viewport payloads have not completed');
   await network.release('topo');await settled(page);assert(await page.locator('#export-map').isEnabled());assert.deepEqual((await snapshot()).regionSummary.selected,['south']);
   record.newViewStartsBeforeOldResponse=true;record.currentViewCompletes=true;
  });
  await run('cached-fallback',{width:1366,height:900},async({page,network,snapshot},record)=>{
   network.failLocal=true;await choose(page,'relief');await network.waitFor(r=>r.source==='local'&&r.deliberateFailure,'The test must fail an actual cached terrain request');
   await network.waitFor(r=>r.source==='remote'&&r.kind==='relief','A failed local terrain tile falls back to the original service');await settled(page);
   const failed=network.requests.filter(r=>r.deliberateFailure);assert(failed.length>0);
   for(const local of failed)assert(network.requests.some(remote=>remote.source==='remote'&&['kind','z','row','col'].every(key=>remote[key]===local[key])),'Fallback preserves the exact failed tile layer and matrix coordinates');
   assert(await page.locator('#export-map').isEnabled());const s=await snapshot();assert.equal(s.mapLayer,'relief');assert(s.heightColors);assert.deepEqual(s.regionSummary.selected,['south']);
   record.failedLocalTiles=failed.length;record.exactRemoteFallback=true;record.currentViewCompletes=true;
  });
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.unexpected,[]);assert.deepEqual(report.qualityErrors,[]);assert.deepEqual(report.failures,[]);report.success=true;
  console.log(JSON.stringify({...report,cases:report.cases.map(({requests,...record})=>({...record,requests:requests.length,localRequests:requests.filter(r=>r.source==='local').length,cancelled:requests.filter(r=>r.cancelled).length})),verifiedLocalTiles:verifiedLocalTiles.size}));
 }finally{if(browser)await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});
