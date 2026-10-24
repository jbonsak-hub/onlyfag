// Cartographic controls must change the actual image while preserving the
// chosen river. Uniform remote-map mocks make alpha composition measurable.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.DROP_SCREENSHOTS||path.resolve(root,'../drop-map-style-validation');
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/drop-prototype/data.json'),'utf8'));
const report={viewports:[],requests:[],errors:[],unexpected:[],mutations:[]};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server=http.createServer((request,response)=>{
 if(!['GET','HEAD'].includes(request.method)){report.mutations.push(request.method+' '+request.url);return response.writeHead(405).end();}
 if(request.url==='/favicon.ico')return response.writeHead(204).end();
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
 try{response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(request.method==='HEAD'?undefined:fs.readFileSync(file));}catch{return response.writeHead(404).end();}
});
const snapshot=page=>page.evaluate(()=>DropPrototype.snapshot());
function journey(state){return {camera:state.camera,zoom:state.zoom,pan:state.pan,route:state.route,selectedSegment:state.selectedSegment,basin:state.basin,progress:state.progress};}
async function painted(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function settled(page){await page.waitForFunction(()=>document.getElementById('map-status').textContent==='');await painted(page);}
async function range(page,id,value){const input=page.locator('#'+id);await input.scrollIntoViewIfNeeded();await input.evaluate((element,value)=>{element.value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));},value);await painted(page);}
async function styleOpen(page){if(!(await page.locator('#map-style').evaluate(element=>element.open)))await page.locator('#map-style > summary').click();await painted(page);}
async function storePixels(page,name){await page.evaluate(name=>{const c=document.getElementById('river-map');window[name]=new Uint8ClampedArray(c.getContext('2d').getImageData(0,0,c.width,c.height).data);},name);}
async function pixelStats(page){return page.evaluate(()=>{const c=document.getElementById('river-map'),pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0,energy=0;for(let i=0;i<pixels.length;i+=4){const delta=Math.max(pixels[i]-styleBackdrop[i],pixels[i+1]-styleBackdrop[i+1],pixels[i+2]-styleBackdrop[i+2]);if(delta>15)count++;energy+=Math.max(0,delta);}return {count,energy};});}
async function controlFits(page,id){const input=page.locator('#'+id);await input.scrollIntoViewIfNeeded();const rect=await input.boundingBox();assert(rect&&rect.width>0&&rect.height>0,id+' is visible');assert(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=await page.evaluate(()=>innerWidth)+1&&rect.y+rect.height<=await page.evaluate(()=>innerHeight)+1,id+' can be reached inside the viewport');}
(async()=>{
 fs.mkdirSync(out,{recursive:true});let browser;
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
  for(const [viewport,dpr] of [[{width:1366,height:900},1],[{width:390,height:844},2]]){
   const context=await browser.newContext({viewport,deviceScaleFactor:dpr,reducedMotion:'reduce'}),requests=[],network={hold:false,pending:[]};
   await context.route('**/*',route=>{
    const request=route.request(),url=request.url();
    if(!['GET','HEAD'].includes(request.method())){report.mutations.push(request.method()+' '+url);return route.abort();}
    if(url.startsWith(base+'/')||/^(data|blob):/.test(url))return route.continue();
    if(!/^https:\/\/(cache\.kartverket\.no|wms\.geonorge\.no|hoydedata\.no)\//.test(url)){report.unexpected.push(url);return route.abort();}
    const u=new URL(url),layers=u.searchParams.get('layers')||u.pathname.split('/')[4],height=u.hostname==='hoydedata.no';
    if(height){
     assert.equal(u.pathname,'/arcgis/rest/services/DTM/ImageServer/exportImage');
     const rule=JSON.parse(u.searchParams.get('renderingRule')),stretch=rule.rasterFunctionArguments?.Raster;
     assert.equal(rule.rasterFunction,'Colormap');assert.equal(stretch?.rasterFunction,'Stretch');
     assert.equal(stretch.rasterFunctionArguments.DRA,false,'Elevation colours use no per-tile dynamic range adjustment');
     assert.deepEqual(stretch.rasterFunctionArguments.Statistics[0].slice(0,2),[0,2500],'The same absolute elevation range is used for every coloured tile');
    }
    requests.push({url,layers,height});report.requests.push({url,layers,height});
    const color=height?'#78b455':layers==='DTM:multiskyggerelieff'?'#a0a0a0':'#d0e0e8';
    const fulfill=()=>route.fulfill({status:200,contentType:'image/svg+xml',headers:{'access-control-allow-origin':'*'},body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="'+color+'"/></svg>'});
    if(network.hold)return new Promise(resolve=>network.pending.push(async()=>{await fulfill();resolve();}));
    return fulfill();
   });
   const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
   await page.addInitScript(()=>{window.exportText=[];const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(!this.canvas.id)window.exportText.push(String(text));return fill.call(this,text,...args);};});
   await page.goto(base+'/prototypes/folg-drapen.html');await page.waitForFunction(()=>window.DropPrototype?.snapshot().ready);await settled(page);
   const initial=journey(await snapshot(page));assert.equal(requests.length,0,'The initial dark map makes no remote requests');
   await styleOpen(page);assert.deepEqual(journey(await snapshot(page)),initial,'Opening style controls does not move the map or selected journey');
   for(const id of ['river-width','river-intensity','map-opacity','height-colors','isolate-basin','map-layer','show-rivers'])await controlFits(page,id);
   assert(await page.locator('#height-colors').isDisabled(),'Elevation colours are enabled only for terrain relief');
   // A real keyboard action must reach and change the accessible range.
   await page.locator('#river-width').focus();const widthBefore=(await snapshot(page)).riverWidth;await page.keyboard.press('ArrowRight');assert((await snapshot(page)).riverWidth>widthBefore,'The width slider works with the keyboard');
   await page.locator('#map-layer').selectOption('topo');await settled(page);await range(page,'map-opacity',0);
   await page.locator('#show-rivers').uncheck();await painted(page);await storePixels(page,'styleBackdrop');
   await page.locator('#show-rivers').check();await range(page,'river-intensity',100);await range(page,'river-width',.5);const thin=await pixelStats(page);
   await range(page,'river-width',4);const thick=await pixelStats(page);assert(thick.count>thin.count*1.4,'A thick river setting visibly increases the river footprint: '+JSON.stringify({thin,thick}));
   await range(page,'river-width',1.4);await range(page,'river-intensity',20);const faint=await pixelStats(page);await range(page,'river-intensity',100);const bright=await pixelStats(page);assert(bright.energy>faint.energy*1.5,'River intensity visibly changes image brightness: '+JSON.stringify({faint,bright}));
   assert.deepEqual(journey(await snapshot(page)),initial,'Styling preserves camera, route and paused progress');
   // Isolating the chosen basin removes visible other-basin geometry while
   // retaining the chosen river and its route.
   const all=await pixelStats(page);await page.locator('#isolate-basin').check();await painted(page);const isolated=await pixelStats(page);assert(isolated.count<all.count*.95&&isolated.count>100,'Basin isolation removes other river families without blanking the chosen one');assert.deepEqual(journey(await snapshot(page)),initial);await page.locator('#isolate-basin').uncheck();
   // Load two map resolutions before measuring opacity. The halfway result
   // must blend once, even when coarse fallback tiles and detailed tiles overlap.
   await page.locator('#show-rivers').uncheck();await range(page,'map-opacity',100);await settled(page);await page.locator('#river-map').focus();await page.keyboard.press('+');await page.keyboard.press('+');await settled(page);
   await range(page,'map-opacity',0);await storePixels(page,'styleZero');await range(page,'map-opacity',100);await storePixels(page,'styleFull');await range(page,'map-opacity',50);
   const blend=await page.evaluate(()=>{const c=document.getElementById('river-map'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let maxError=0,changed=0;for(const x of [.21,.47,.79])for(const y of [.19,.43,.73]){const i=(Math.round(y*(c.height-1))*c.width+Math.round(x*(c.width-1)))*4;for(let k=0;k<3;k++){maxError=Math.max(maxError,Math.abs(p[i+k]-(styleZero[i+k]+styleFull[i+k])/2));changed=Math.max(changed,Math.abs(styleFull[i+k]-styleZero[i+k]));}}return {maxError,changed};});
   assert(blend.changed>50,'Opacity changes the actual map pixels');assert(blend.maxError<=3,'A 50% map is blended once against the dark background: '+JSON.stringify(blend));
   // Colouring must use elevation imagery, be reversible, and retain location.
   await page.locator('#map-layer').selectOption('relief');await range(page,'map-opacity',100);await settled(page);assert(!(await page.locator('#height-colors').isDisabled()));const terrainJourney=journey(await snapshot(page));await storePixels(page,'styleMono');
   await page.locator('#height-colors').check();await settled(page);assert((await snapshot(page)).heightColors);assert(requests.some(request=>request.height),'Elevation colour uses a height-data image');await page.locator('#map-style > summary').click();await painted(page);assert(await page.locator('#height-legend').isVisible(),'Coloured elevation has a visible height legend');
   const colourChange=await page.evaluate(()=>{const c=document.getElementById('river-map'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let changed=0;for(let i=0;i<p.length;i+=4)if(Math.max(...[0,1,2].map(k=>Math.abs(p[i+k]-styleMono[i+k])))>20)changed++;return changed;});assert(colourChange>viewport.width*viewport.height*.1,'The height effect changes a substantial part of the terrain');assert.deepEqual(journey(await snapshot(page)),terrainJourney);
   await styleOpen(page);await range(page,'map-opacity',0);await page.locator('#map-style > summary').click();await painted(page);assert(await page.locator('#height-legend').isHidden(),'A hidden terrain background does not show a misleading height legend');await styleOpen(page);
   const beforeHiddenHeightText=await page.evaluate(()=>exportText.length),hiddenHeightDownloadPromise=page.waitForEvent('download');await page.locator('#export-map').scrollIntoViewIfNeeded();await page.locator('#export-map').click();const hiddenHeightDownload=await hiddenHeightDownloadPromise,hiddenHeightFile=path.join(out,'style-export-hidden-height-'+viewport.width+'.png');await hiddenHeightDownload.saveAs(hiddenHeightFile);const hiddenHeightPNG=fs.readFileSync(hiddenHeightFile);assert.equal(hiddenHeightPNG.readUInt32BE(20),(viewport.height+132)*dpr,'A zero-opacity height background adds no elevation-legend footer');const hiddenHeightText=await page.evaluate(start=>exportText.slice(start).join(' '),beforeHiddenHeightText);assert(!/2\s?500 m|Høyde over havet/.test(hiddenHeightText),'An exported river-only map contains no misleading elevation legend');
   await range(page,'map-opacity',100);await settled(page);
   await page.locator('#height-colors').uncheck();await settled(page);assert(!(await snapshot(page)).heightColors);assert(await page.locator('#height-legend').isHidden());
   const monoReturn=await page.evaluate(()=>{const c=document.getElementById('river-map'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let maximum=0;for(let i=0;i<p.length;i++)maximum=Math.max(maximum,Math.abs(p[i]-styleMono[i]));return maximum;});assert(monoReturn<=1,'Turning colour off restores the original monochrome relief');
   await page.locator('#show-rivers').check();await range(page,'map-opacity',85);await range(page,'river-intensity',95);await painted(page);await page.locator('#map-style > summary').click();
   const beforeToggle=journey(await snapshot(page));await page.locator('#toggle-player').click();assert(await page.locator('#player').isHidden());assert.equal((await snapshot(page)).playerVisible,false);await styleOpen(page);await controlFits(page,'river-width');await page.locator('#map-style > summary').click();await page.locator('#toggle-player').click();await painted(page);assert(await page.locator('#player').isVisible());assert.deepEqual(journey(await snapshot(page)),beforeToggle,'Toggling the panel preserves the camera and journey');
   // PNG is a useful cartographic deliverable, and its source credit must be
   // drawn into the image rather than existing only in the surrounding HTML.
   await styleOpen(page);await page.locator('#export-map').scrollIntoViewIfNeeded();const beforeExport=journey(await snapshot(page)),journeyMessage=await page.locator('#status').textContent(),downloadPromise=page.waitForEvent('download');await page.locator('#export-map').click();const download=await downloadPromise,file=path.join(out,'style-export-'+viewport.width+'.png');assert(/\.png$/i.test(download.suggestedFilename()));await download.saveAs(file);const png=fs.readFileSync(file);assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');const dimensions={width:png.readUInt32BE(16),height:png.readUInt32BE(20)};assert(dimensions.width>=viewport.width&&dimensions.height>=viewport.height,'The PNG preserves the visible map dimensions');const credits=await page.evaluate(()=>exportText.join(' '));assert(/Kartverket/.test(credits)&&/NVE/.test(credits),'Exported image contains map and river-source attribution');assert.deepEqual(journey(await snapshot(page)),beforeExport,'Export does not move the map');assert.equal(await page.locator('#status').textContent(),journeyMessage,'Export feedback preserves the current journey message');assert.match(await page.locator('#export-status').textContent(),/lagret|PNG/i);
   // A background made fully transparent must not prevent exporting the
   // visible river map while unrelated background requests are still pending.
   network.hold=true;await page.locator('#map-layer').selectOption('toporaster');await painted(page);
   for(let attempt=0;attempt<100&&!network.pending.length;attempt++)await page.waitForTimeout(10);
   assert(network.pending.length>0,'The test has held real in-flight background requests');assert(await page.locator('#export-map').isDisabled(),'Export waits when the visible map is incomplete');
   await range(page,'map-opacity',0);assert(await page.locator('#export-map').isEnabled(),'A fully hidden background does not block a river-only export');await page.locator('#export-map').scrollIntoViewIfNeeded();const hiddenDownloadPromise=page.waitForEvent('download',{timeout:10000});await page.locator('#export-map').click();const hiddenDownload=await hiddenDownloadPromise;await hiddenDownload.saveAs(path.join(out,'style-export-hidden-background-'+viewport.width+'.png'));
   network.hold=false;await Promise.all(network.pending.splice(0).map(release=>release()));await painted(page);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'The settings and actions do not create horizontal page overflow');await page.screenshot({path:path.join(out,'map-style-'+viewport.width+'.png')});report.viewports.push({viewport,dpr,riverFootprint:{thin:thin.count,thick:thick.count},riverIntensity:{faint:faint.energy,bright:bright.energy},opacityBlend:blend,heightColors:true,basinIsolation:true,panelToggle:true,hiddenBackgroundExport:true,export:dimensions});await context.close();
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.unexpected,[]);assert.deepEqual(report.mutations,[]);report.success=true;console.log(JSON.stringify({success:true,viewports:report.viewports,requests:report.requests.length}));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'map-style-results.json'),JSON.stringify(report,null,2)+'\n');}
})().catch(error=>{console.error(error);process.exitCode=1;});
