/* Three visible Oslo map modes keep one quiz and one geographically aligned camera. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const tileOrigin=[-2500000,9045984],resolution=21664;
const map=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/oslo-bydeler/oslo.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/'))return res.writeHead(403).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
const landmarks=[{name:'Oslo S',utm:[262543.3285,6649176.6709]},...map.states.filter((_,i)=>i%5===0).map(s=>({name:s.n,utm:[map.contextCrop.bounds[0]+(s.c[0]-map.viewBox[0])/map.viewBox[2]*(map.contextCrop.bounds[2]-map.contextCrop.bounds[0]),map.contextCrop.bounds[3]-(s.c[1]-map.viewBox[1])/map.viewBox[3]*(map.contextCrop.bounds[3]-map.contextCrop.bounds[1])]}))];
(async()=>{let browser;const errors=[],requests=[];try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
 for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<700}),network={fail:new Set()};
  await context.addInitScript(()=>{Math.random=()=>0;});
  await context.route('**/*',async route=>{
   const url=route.request().url();if(url.startsWith(base+'/')||/^(data|blob):/.test(url))return route.continue();
   if(new URL(url).pathname==='/scores')return route.fulfill({status:200,contentType:'application/json',body:'{"rows":[]}'});
   const parsed=new URL(url);let bbox,mode;
   const wmts=parsed.pathname.match(/\/topo\/default\/utm33n\/(\d+)\/(\d+)\/(\d+)\.png$/);
   if(parsed.hostname==='cache.kartverket.no'&&wmts){const [,zs,rs,cs]=wmts,z=Number(zs),row=Number(rs),col=Number(cs),span=256*resolution/2**z;assert.ok(z>=0&&z<=18);bbox=[tileOrigin[0]+col*span,tileOrigin[1]-(row+1)*span,tileOrigin[0]+(col+1)*span,tileOrigin[1]-row*span];mode='physical';}
   else if(parsed.hostname==='services.arcgisonline.com'&&/World_Imagery\/MapServer\/export$/.test(parsed.pathname)){
    assert.equal(parsed.searchParams.get('bboxSR'),'25833');assert.equal(parsed.searchParams.get('imageSR'),'25833');assert.equal(parsed.searchParams.get('size'),'256,256');bbox=parsed.searchParams.get('bbox').split(',').map(Number);mode='satellite';
   }
   if(bbox){requests.push({mode,url,bbox});if(network.fail.has(mode))return route.fulfill({status:503,contentType:'text/plain',headers:{'access-control-allow-origin':'*'},body:'fixture outage'});const fill=mode==='satellite'?'#516347':'#dde6cc',points=landmarks.map(p=>({x:(p.utm[0]-bbox[0])/(bbox[2]-bbox[0])*256,y:(bbox[3]-p.utm[1])/(bbox[3]-bbox[1])*256})).filter(p=>p.x>=0&&p.x<=256&&p.y>=0&&p.y<=256);return route.fulfill({status:200,contentType:'image/svg+xml',headers:{'access-control-allow-origin':'*'},body:`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${fill}"/><path d="M0 128H256M128 0V256" stroke="#ddd" stroke-width="2"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#ff00ff"/>`).join('')}</svg>`});}
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
  async function settled(){await page.waitForFunction(()=>{const s=window.OsloMapLayers?.get(document.querySelector('#map'))?.snapshot();return s&&s.pending===0&&s.failed===0&&s.tileCount>0;});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
  async function registration(mode){
   const result=await page.evaluate(({landmarks,crop,view})=>{const svg=document.querySelector('#map'),m=svg.getScreenCTM(),viewport=document.querySelector('#mapViewport').getBoundingClientRect(),samples=[];for(const p of landmarks){const x=view[0]+(p.utm[0]-crop[0])/(crop[2]-crop[0])*view[2],y=view[1]+(crop[3]-p.utm[1])/(crop[3]-crop[1])*view[3],expected=new DOMPoint(x,y).matrixTransform(m);if(expected.x<viewport.left+2||expected.x>viewport.right-2||expected.y<viewport.top+2||expected.y>viewport.bottom-2)continue;for(const img of document.querySelectorAll('.oslo-map-tile')){const r=img.getBoundingClientRect();if(!r.width||!r.height)continue;const b=JSON.parse(img.dataset.bbox);if(p.utm[0]<b[0]||p.utm[0]>b[2]||p.utm[1]<b[1]||p.utm[1]>b[3])continue;const actual={x:r.x+(p.utm[0]-b[0])/(b[2]-b[0])*r.width,y:r.y+(b[3]-p.utm[1])/(b[3]-b[1])*r.height};samples.push({name:p.name,error:Math.hypot(actual.x-expected.x,actual.y-expected.y)});break;}}return samples;},{landmarks,crop:map.contextCrop.bounds,view:map.viewBox});
   assert.ok(result.length>=2,mode+' contains at least two independent visible UTM reference points');assert.ok(result.every(r=>r.error<.8),mode+' imagery lines up with SVG answer geometry: '+JSON.stringify(result));
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
  await page.waitForFunction(()=>OsloMapLayers.get(document.querySelector('#map')).snapshot().failed>0);
  assert.match(await page.locator('#oslo-basemap-status').innerText(),/kunne ikke lastes/,'photo failure is clearly reported');assert.deepEqual(await round(),outageRound);assert.equal(await camera(),outageCamera);
  await page.locator('button[data-oslo-basemap="original"]').click();assert.equal(await page.locator('#oslo-basemap-status').isVisible(),false,'the independent green map remains usable during a photo outage');
  network.fail.clear();await page.locator('button[data-oslo-basemap="satellite"]').click();await settled();assert.deepEqual(await round(),outageRound,'retry keeps the current round');assert.equal(await camera(),outageCamera);
  await context.close();
 }
 assert.ok(requests.some(r=>r.mode==='physical')&&requests.some(r=>r.mode==='satellite'),'both real tile service contracts were exercised');assert.deepEqual(errors,[]);console.log('PASS Oslo map modes: three visible accessible icons, preserved quiz/camera and desktop/mobile controls.');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
