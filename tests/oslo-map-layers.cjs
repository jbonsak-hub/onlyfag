/* Three visible Oslo map modes keep one quiz and one geographically aligned camera. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),curl=promisify(execFile);
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const physicalManifest=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/norway-relief.json'),'utf8')).regions.oslo.areas.main;
const map=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/oslo-bydeler/oslo.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/'))return res.writeHead(403).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
const landmarks=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/oslo-photo-landmarks.json'),'utf8')).points;
const projection={};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/geography/wgs84-raster.js'),'utf8'),projection);
for(const point of landmarks){const utm=projection.WGS84Raster.geographicToUTM(...point.lonlat),geographic=projection.WGS84Raster.utmToGeographic(...point.utm);assert.ok(Math.hypot(utm[0]-point.utm[0],utm[1]-point.utm[1])<.002,point.name+' forward projection agrees with independent pyproj reference to 2mm');assert.ok(Math.hypot(geographic[0]-point.lonlat[0],geographic[1]-point.lonlat[1])<1e-9,point.name+' inverse projection agrees with independent pyproj reference');}
(async()=>{let browser;const errors=[],requests=[];try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 for(const viewport of process.env.OSLO_MAP_REAL_ONLY==='1'?[]:[{width:1366,height:768},{width:390,height:844}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<700}),network={fail:new Set()};
  await context.addInitScript(()=>{Math.random=()=>0;});
  await context.route('**/*',async route=>{
   const url=route.request().url();if(url.startsWith(base+'/')||/^(data|blob):/.test(url))return route.continue();
   if(new URL(url).pathname==='/scores')return route.fulfill({status:200,contentType:'application/json',body:'{"rows":[]}'});
   const parsed=new URL(url),match=parsed.pathname.match(/World_Imagery\/MapServer\/tile\/(\d+)\/(\d+)\/(\d+)$/);
   if(parsed.hostname==='wi.maptiles.arcgis.com'&&match){
    const [,zs,rs,cs]=match,z=Number(zs),row=Number(rs),col=Number(cs),span=180/2**z,bbox=[-180+col*span,90-(row+1)*span,-180+(col+1)*span,90-row*span],mode='satellite';
    assert.ok(z>=0&&z<=22&&row>=0&&row<2**z&&col>=0&&col<2**(z+1),'valid EPSG:4326v2 source tile');
    requests.push({mode,url,bbox});if(network.fail.has(mode))return route.fulfill({status:503,contentType:'text/plain',headers:{'access-control-allow-origin':'*'},body:'fixture outage'});
    const points=landmarks.map(p=>({x:(p.lonlat[0]-bbox[0])/span*256,y:(bbox[3]-p.lonlat[1])/span*256})).filter(p=>p.x>=-5&&p.x<=261&&p.y>=-5&&p.y<=261);
    return route.fulfill({status:200,contentType:'image/svg+xml',headers:{'access-control-allow-origin':'*'},body:`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#516347"/><path d="M0 128H256M128 0V256" stroke="#67785c" stroke-width="1"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#ff00ff"/>`).join('')}</svg>`});
   }
   return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/geografi/oslo-bydeler.html');await page.locator('#start:enabled').waitFor();
  const buttons=page.locator('button[data-oslo-basemap]');assert.equal(await buttons.count(),3);
  assert.deepEqual(await buttons.evaluateAll(els=>els.map(el=>el.dataset.osloBasemap)),['original','physical','satellite']);
  const rect=await page.locator('#mapViewport').boundingBox();
  for(const button of await buttons.all()){
   const r=await button.boundingBox();assert.ok(r&&r.width>=36&&r.height>=36);
   assert.ok(r.x>=rect.x&&r.y>=rect.y&&r.x+r.width<=rect.x+rect.width&&r.y<rect.y+70,'all mode icons are visible at the top left of the actual map');
   assert.ok(await button.getAttribute('aria-label'));assert.ok(await button.getAttribute('title'));
   assert.ok(await button.evaluate(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return top===el||el.contains(top);}),'map layers do not cover the controls');
  }
  async function camera(){return page.locator('#map').getAttribute('viewBox');}
  async function settled(){await page.waitForFunction(()=>{if(document.body.dataset.osloBasemap==='physical'){const layer=document.querySelector('.map-basemap-layer:not([hidden])'),image=layer?.querySelector('img');return image?.complete&&image.naturalWidth>0;}const s=window.OsloMapLayers?.get(document.querySelector('#map'))?.snapshot();return s&&s.pending===0&&s.failed===0&&s.tileCount>0;});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
  async function registration(mode){
   if(mode==='physical'){
    const physical=await page.evaluate(entry=>{const image=document.querySelector('.map-basemap-layer:not([hidden]) img'),world=image?.parentElement,svg=document.querySelector('#map'),m=svg.getScreenCTM(),r=document.querySelector('#mapViewport').getBoundingClientRect(),actual=new DOMMatrix(getComputedStyle(world).transform);return {src:new URL(image.src).pathname,dimensions:[image.naturalWidth,image.naturalHeight],matrix:[actual.a,actual.b,actual.c,actual.d,actual.e,actual.f],expected:[m.a,m.b,m.c,m.d,m.e-r.left,m.f-r.top],externalTiles:document.querySelectorAll('.oslo-live-basemap:not([hidden]) img').length};},physicalManifest);
    assert.equal(physical.src,'/assets/geography/'+physicalManifest.image,'physical view restores the exact label-free raster used before the last update');
    assert.deepEqual(physical.dimensions,physicalManifest.pixelDimensions,'the real local image was decoded, not a mocked cartographic tile');
    assert.ok(physical.matrix.every((n,i)=>Math.abs(n-physical.expected[i])<1),'physical raster and answer SVG share one camera');
    assert.equal(physical.externalTiles,0,'physical mode never shows the name-revealing remote topo tiles');
    return;
   }
   const samplePixels=({landmarks,crop,view})=>{
    const svg=document.querySelector('#map'),m=svg.getScreenCTM(),viewport=document.querySelector('#mapViewport').getBoundingClientRect(),canvas=document.querySelector('.oslo-photo-canvas'),r=canvas.getBoundingClientRect(),c=canvas.getContext('2d'),ratio=canvas.width/r.width,samples=[];
    for(const p of landmarks){
     const x=view[0]+(p.utm[0]-crop[0])/(crop[2]-crop[0])*view[2],y=view[1]+(crop[3]-p.utm[1])/(crop[3]-crop[1])*view[3],expected=new DOMPoint(x,y).matrixTransform(m);
     if(expected.x<viewport.left+8||expected.x>viewport.right-8||expected.y<viewport.top+75||expected.y>viewport.bottom-8)continue;
     const px=Math.round((expected.x-r.left)*ratio),py=Math.round((expected.y-r.top)*ratio),data=c.getImageData(px-4,py-4,9,9).data;
     let found=false;for(let i=0;i<data.length;i+=4)if(data[i]>220&&data[i+1]<60&&data[i+2]>220&&data[i+3]>240)found=true;
     let nearest=null;if(!found){const scan=c.getImageData(px-24,py-24,49,49).data;for(let i=0;i<scan.length;i+=4)if(scan[i]>220&&scan[i+1]<60&&scan[i+2]>220&&scan[i+3]>240){const dx=(i/4)%49-24,dy=Math.floor(i/4/49)-24,d=Math.hypot(dx,dy);if(!nearest||d<nearest.distance)nearest={dx,dy,distance:d};}}samples.push({name:p.name,found,screen:[expected.x,expected.y],nearest});
    }return samples;
   };
   let result;for(let frame=0;frame<30;frame++){result=await page.evaluate(samplePixels,{landmarks,crop:map.contextCrop.bounds,view:map.viewBox});if(result.length>=3&&result.every(r=>r.found))break;await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));}
   assert.ok(result.length>=3,mode+' contains multiple independent visible WGS84/UTM reference points');
   if(result.some(r=>!r.found)&&process.env.OSLO_MAP_SCREENSHOTS)await page.screenshot({path:path.join(process.env.OSLO_MAP_SCREENSHOTS,viewport.width+'-registration-failed.png')});
   assert.ok(result.every(r=>r.found),mode+' source texture matches fixed UTM landmarks after reprojection: '+JSON.stringify(result.filter(r=>!r.found)));
   const coverage=await page.locator('.oslo-photo-canvas').evaluate(canvas=>{const {width:w,height:h}=canvas,p=canvas.getContext('2d').getImageData(0,0,w,h).data;let low=0,min=255,total=0;for(let y=8;y<h-8;y+=3)for(let x=8;x<w-8;x+=3){const a=p[(y*w+x)*4+3];total++;min=Math.min(min,a);if(a<250)low++;}return {low,min,total};});
   if(coverage.low&&process.env.OSLO_MAP_SCREENSHOTS){fs.mkdirSync(process.env.OSLO_MAP_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.OSLO_MAP_SCREENSHOTS,viewport.width+'-seams.png')});}
   assert.equal(coverage.low,0,mode+' projected tiles remain opaque between texture triangles: '+JSON.stringify(coverage));

  }
  async function round(){return page.evaluate(()=>({phase:document.body.dataset.phase,target:document.getElementById('targetName').textContent,completed:document.getElementById('completed').textContent,mistakes:document.getElementById('mistakes').textContent,labels:[...document.querySelectorAll('#labelLayer text')].map(el=>el.textContent),found:[...document.querySelectorAll('#states .state[data-band]')].map(el=>[el.dataset.state,el.dataset.band])}));}
  await page.locator('#local-show-names').check();await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
  await page.evaluate(()=>document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
  const initial=await round(),initialCamera=await camera();
  for(const mode of ['physical','satellite','original']){
   await page.locator(`button[data-oslo-basemap="${mode}"]`).click();
   await page.waitForFunction(mode=>document.querySelector(`button[data-oslo-basemap="${mode}"]`)?.getAttribute('aria-pressed')==='true',mode);
   if(mode!=='original'){await settled();await registration(mode);}
   assert.deepEqual(await round(),initial,'mode '+mode+' preserves question, progress, answer colours and labels');assert.equal(await camera(),initialCamera,'mode '+mode+' preserves camera');
   assert.equal(await page.locator('button[data-oslo-basemap][aria-pressed="true"]').count(),1);
  }
  await page.locator('button[data-oslo-basemap="physical"]').click();await settled();await registration('physical');
  assert.equal(await page.locator('button[data-oslo-basemap="physical"]').getAttribute('aria-label'),'Fysisk kart');
  if(process.env.OSLO_MAP_SCREENSHOTS){fs.mkdirSync(process.env.OSLO_MAP_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.OSLO_MAP_SCREENSHOTS,viewport.width+'-physical-restored.png')});}
  await page.locator('button[data-oslo-basemap="satellite"]').click();await settled();
  const target=await page.locator('#targetName').innerText();const source=map.states.find(s=>s.n===target);assert.ok(source);
  const hit=await page.evaluate(c=>{const svg=document.querySelector('#map'),p=new DOMPoint(...c).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y,hit:document.elementFromPoint(p.x,p.y)?.closest('[data-state]')?.dataset.state};},source.c);
  assert.equal(hit.hit,target,'real answer polygon remains topmost over photo');
  if(viewport.width<700)await page.touchscreen.tap(hit.x,hit.y);else await page.mouse.click(hit.x,hit.y);
  await page.waitForFunction(()=>document.querySelector('#completed').textContent==='1');
  await page.waitForFunction(target=>document.querySelector('#targetName').textContent!==target,target);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const answered=await round(),cameraAfter=await camera();
  for(const mode of ['physical','original','satellite']){await page.locator(`button[data-oslo-basemap="${mode}"]`).click();if(mode!=='original')await settled();assert.deepEqual(await round(),answered,'answers and first-attempt colours survive '+mode);assert.equal(await camera(),cameraAfter);}
  const oldCamera=await camera();await page.evaluate(()=>ClickMapZoom.zoom(1.5));await page.waitForFunction(old=>document.querySelector('#map').getAttribute('viewBox')!==old,oldCamera);await settled();await registration('satellite after zoom');
  const zoomed=await camera();await page.locator('button[data-oslo-basemap="original"]').click();await page.locator('button[data-oslo-basemap="satellite"]').click();await settled();assert.equal(await camera(),zoomed,'switching back to photo retains zoom');
  if(process.env.OSLO_MAP_SCREENSHOTS){fs.mkdirSync(process.env.OSLO_MAP_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.OSLO_MAP_SCREENSHOTS,viewport.width+'-satellite-fixture.png')});}
  await page.locator('button[data-oslo-basemap="original"]').click();
  await page.evaluate(()=>ClickMapZoom.zoom(2.3));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const outageCamera=await camera(),outageRound=await round();network.fail.add('satellite');
  await page.locator('button[data-oslo-basemap="satellite"]').click();
  await page.waitForFunction(()=>OsloMapLayers.get(document.querySelector('#map')).snapshot().failed>0&&document.getElementById('oslo-basemap-status').textContent.includes('kunne ikke lastes'));
  assert.match(await page.locator('#oslo-basemap-status').innerText(),/kunne ikke lastes/,'photo failure is clearly reported');assert.deepEqual(await round(),outageRound);assert.equal(await camera(),outageCamera);
  await page.locator('button[data-oslo-basemap="original"]').click();assert.equal(await page.locator('#oslo-basemap-status').isVisible(),false,'the independent green map remains usable during a photo outage');
  network.fail.clear();await page.locator('button[data-oslo-basemap="satellite"]').click();await settled();assert.deepEqual(await round(),outageRound,'retry keeps the current round');assert.equal(await camera(),outageCamera);
  await context.close();
 }
 // Optional real-service smoke: use verified public JPEG bytes, no substitute images.
 if(process.env.OSLO_REAL_PHOTO_CHECK==='1'){
  const context=await browser.newContext({viewport:{width:1366,height:768}}),real=[];
  await context.route('**/*',async route=>{
   const url=route.request().url();if(url.startsWith(base+'/')||/^(data|blob):/.test(url))return route.continue();
   const u=new URL(url);if(u.hostname==='wi.maptiles.arcgis.com'&&/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+$/.test(u.pathname)){
    try{const {stdout}=await curl('curl',['--fail','--silent','--show-error','--location','--max-time','25',url],{encoding:'buffer',maxBuffer:3_000_000});assert.equal(stdout[0],255);assert.equal(stdout[1],216);real.push({url,bytes:stdout.length});return route.fulfill({status:200,contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'},body:stdout});}catch(e){errors.push('Real photo tile: '+e.message);return route.abort();}
   }
   return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/geografi/oslo-bydeler.html');await page.locator('#start:enabled').waitFor();await page.locator('button[data-oslo-basemap="satellite"]').click();
  await page.waitForFunction(()=>{const s=OsloMapLayers.get(document.querySelector('#map')).snapshot();return s.tileCount>0&&s.pending===0&&s.failed===0;},null,{timeout:90000});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const varied=await page.locator('.oslo-photo-canvas').evaluate(canvas=>{const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();for(let i=0;i<pixels.length;i+=4*257)if(pixels[i+3])colors.add(pixels[i]+','+pixels[i+1]+','+pixels[i+2]);return colors.size;});
  assert.ok(real.length>0&&varied>100,'actual satellite JPEGs paint a detailed photograph');
  if(process.env.OSLO_MAP_SCREENSHOTS){fs.mkdirSync(process.env.OSLO_MAP_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.OSLO_MAP_SCREENSHOTS,'1366-satellite-real.png')});}
  console.log('PASS real World Imagery JPEG smoke:',real.length,'visible tiles,',varied,'sampled colours');await context.close();
 }
 if(process.env.OSLO_MAP_REAL_ONLY!=='1')assert.ok(requests.some(r=>r.mode==='satellite'),'satellite requests were exercised');assert.equal(requests.some(r=>r.mode==='physical'),false,'physical mode makes no topographic tile requests');assert.deepEqual(errors,[]);if(process.env.OSLO_MAP_REAL_ONLY!=='1')console.log('PASS Oslo map modes: three visible accessible icons, preserved quiz/camera and desktop/mobile controls.');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
