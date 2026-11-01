/* Deterministic fixtures verify registration, separately from actual providers.
   MARINE_LIVE=1 also paints current, TLS-verified Esri hillshade JPEG responses. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),curl=promisify(execFile);
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const landmarks=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/marine-basemap-landmarks.json'))).points;
const references=[
  [10.74609,59.91273,262210.8893177103,6649335.409472278],
  [10.39506,63.43048,270337.87028114265,7041814.199059743],
  [18.96366,69.65455,653706.3816724909,7732337.613037544],
  [5.32598,60.39311,-31875.45436920924,6734370.224750538]
];
const origin=[-2500000,9045984],baseSpan=256*21664;
const colors={topo:['#e4e4dc','#df007f'],toporaster:['#d3e5da','#002bea'],relief:['#b8c5b7','#aa00dc']};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.geojson':'application/geo+json','.css':'text/css; charset=utf-8','.webp':'image/webp'};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/'))return res.writeHead(403).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
function requestedTile(url){
 const u=new URL(url);
 if(u.hostname==='cache.kartverket.no'){
  const match=u.pathname.match(/^\/v1\/wmts\/1\.0\.0\/(topo|toporaster)\/default\/utm33n\/(\d+)\/(\d+)\/(\d+)\.png$/);assert.ok(match,'official UTM33 WMTS URL');
  const [,layer,matrix,rowText,colText]=match,z=Number(matrix),row=Number(rowText),col=Number(colText),span=baseSpan/2**z;
  assert.equal(matrix,String(z),'official WMTS matrix IDs have no zero padding');
  assert.ok(z>=0&&z<=18&&row>=0&&col>=0&&row<2**z&&col<2**z,'valid UTM33 tile indices');
  return {layer,z,row,col,span,left:origin[0]+col*span,top:origin[1]-row*span};
 }
 assert.ok(['whi.maptiles.arcgis.com','wi.maptiles.arcgis.com'].includes(u.hostname),'official Esri WGS84 provider');
 const match=u.pathname.match(/^\/arcgis\/rest\/services\/(World_Hillshade|World_Imagery)\/MapServer\/tile\/(\d+)\/(\d+)\/(\d+)$/);assert.ok(match,'official WGS84 raster tile endpoint');
 const [,service,zText,rowText,colText]=match,z=Number(zText),row=Number(rowText),col=Number(colText),span=180/2**z;
 assert.ok(z>=0&&z<=22&&row>=0&&row<2**z&&col>=0&&col<2**(z+1),'valid two-to-one EPSG4326 tile grid');
 return {layer:'relief',service,z,row,col,span,left:-180+col*span,top:90-row*span,geographic:true};
}
function fixture(tile){
 const [background,marker]=colors[tile.layer];
 const marks=landmarks.map(p=>{const x=((tile.geographic?p.lon:p.easting)-tile.left)/tile.span*256,y=(tile.top-(tile.geographic?p.lat:p.northing))/tile.span*256;return x>=-6&&x<=262&&y>=-6&&y<=262?`<circle cx="${x}" cy="${y}" r="5" fill="${marker}"/>`:'';}).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${background}"/><path d="M0 30L256 170M45 0L120 256" stroke="#75857c" fill="none"/><text x="8" y="18" font-size="9">TESTFLIS · ${tile.layer}</text>${marks}</svg>`;
}
async function settled(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForFunction(()=>{const t=window.marineLimitMap?.getTileState();return t&&(t.layer==='local'||t.visible.length>0)&&t.loading===0&&t.queued===0&&t.failed===0;});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function checkRegistration(page,layer){
 const rgb=colors[layer][1].slice(1).match(/../g).map(v=>parseInt(v,16));
 const found=await page.evaluate(({points,rgb})=>{const c=document.getElementById('map'),ctx=c.getContext('2d'),ratio=c.width/c.clientWidth;return points.map(p=>{const [x,y]=marineLimitMap.project(p.lon,p.lat);if(x<20||y<20||x>c.clientWidth-20||y>c.clientHeight-20)return null;const data=ctx.getImageData(Math.round(x*ratio)-3,Math.round(y*ratio)-3,7,7).data;let marker=false;for(let i=0;i<data.length;i+=4)if(rgb.every((v,j)=>Math.abs(data[i+j]-v)<25))marker=true;return {x,y,marker};}).filter(Boolean);},{points:landmarks,rgb});
 assert.ok(found.length>=3,'at least three independent projected landmarks are visible');if(found.some(p=>!p.marker)){fs.mkdirSync('/workspace/artifacts/marine-detail-qa',{recursive:true});await page.screenshot({path:'/workspace/artifacts/marine-detail-qa/registration-'+layer+'-'+page.viewportSize().width+'.png'});}assert.ok(found.every(p=>p.marker),layer+': fixed UTM map landmarks coincide with independently projected lon/lat: '+JSON.stringify(found.filter(p=>!p.marker)));
}
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});const errors=[],reports=[];
for(const viewport of [{width:1366,height:768},{width:1024,height:768},{width:390,height:844}]){
 const context=await browser.newContext({viewport,hasTouch:viewport.width<700,deviceScaleFactor:viewport.width<700?2:1}),requests=[],tileRequests=[],network={fail:new Set(),noCors:new Set(),hold:false,pending:[],failDetail:false};
 await context.route('**/*',async route=>{const u=route.request().url();requests.push(u);if(u.startsWith(base+'/')){if(network.failDetail&&u.includes('/marine-limit/data/detail/tiles/'))return route.fulfill({status:503,body:'fixture detail unavailable'});return route.continue();}if(!/^https:\/\/(cache\.kartverket\.no|whi\.maptiles\.arcgis\.com|wi\.maptiles\.arcgis\.com)\//.test(u))return route.abort();try{const tile=requestedTile(u);tile.cors=!!route.request().headers().origin;tileRequests.push(tile);if(network.hold)await new Promise(resolve=>network.pending.push(resolve));if(network.fail.has(tile.layer))return route.fulfill({status:503,body:'fixture service unavailable',headers:{'access-control-allow-origin':'*'}});return route.fulfill({status:200,contentType:'image/svg+xml',headers:{'access-control-allow-origin':network.noCors.has(tile.layer)?'https://other-origin.invalid':'*'},body:fixture(tile)});}catch(e){errors.push(e.message);return route.abort();}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/geografi/marin-grense.html');await page.waitForFunction(()=>window.marineLimitMap?.featureCount>=2800);await settled(page);
 assert.equal(await page.locator('#map-layer').inputValue(),'topo','detailed topographic map is the default');assert.ok(tileRequests.some(t=>t.layer==='topo'),'default actually requests detailed tiles');assert.ok(await page.locator('#places option').count()>350);
 if(viewport.width===1366){const urls=await page.evaluate(async()=>{const {tileURL}=await import('/assets/geography/marine-limit/tiles.js?v=20261101-3');return Array.from({length:10},(_,z)=>tileURL({layer:'topo',z,row:0,col:0}));});urls.forEach((url,z)=>assert.equal(new URL(url).pathname.split('/').slice(-3).join('/'),z+'/0/0.png','matrix '+z+' uses the documented numeric identifier'));}
 const projection=await page.evaluate(ref=>ref.map(([lon,lat])=>marineLimitMap.utm(lon,lat)),references);projection.forEach((p,i)=>{assert.ok(Math.hypot(p[0]-references[i][2],p[1]-references[i][3])<.1,'UTM33 projection agrees with pyproj to 10 cm');});
 const home=await page.evaluate(()=>marineLimitMap.getView());await page.locator('#zoom-in').click();await settled(page);assert.ok(await page.evaluate(z=>marineLimitMap.getView().z>z,home.z));await page.locator('#home').click();await settled(page);assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),home);
 await page.locator('#place').fill('Oslo');await page.locator('#place-form button').click();await settled(page);const osloView=await page.evaluate(()=>marineLimitMap.getView());assert.notDeepEqual(osloView,home);
 const c=page.locator('#map'),rect=await c.boundingBox(),at=await page.evaluate(()=>marineLimitMap.project(10.74609,59.91273));await page.mouse.click(rect.x+at[0],rect.y+at[1]);await page.locator('#info:not([hidden])').waitFor();assert.match(await page.locator('#info-title').innerText(),/Kartlagt under marin grense/);await page.locator('#close-info').click();
 await page.locator('#marine-layer').uncheck();await settled(page);
 const registrations={};for(const layer of ['topo','toporaster','relief']){await page.locator('#map-layer').selectOption(layer);await settled(page);assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),osloView,'layer changes preserve the camera');await checkRegistration(page,layer);registrations[layer]=true;}
 await page.locator('#marine-layer').check();const beforeOpacity=await page.evaluate(()=>marineLimitMap.getView());
 await page.waitForFunction(()=>{const d=marineLimitMap.getDetailState();return d.indexState==='ready'&&d.visible.length>0&&d.loaded===d.visible.length;});
 async function overlayPixel(value){await page.locator('#marine-opacity').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);await settled(page);return page.evaluate(()=>{const c=document.getElementById('map'),p=marineLimitMap.project(10.74609,59.91273),r=c.width/c.clientWidth;return [...c.getContext('2d').getImageData(Math.round(p[0]*r),Math.round(p[1]*r),1,1).data];});}
 const noOverlay=await overlayPixel(0),lowOpacity=await overlayPixel(20),highOpacity=await overlayPixel(80);assert.notDeepEqual(lowOpacity,noOverlay,'opacity actually changes the rendered NGU polygon');
 for(let channel=0;channel<3;channel++)assert.ok(Math.abs((highOpacity[channel]-noOverlay[channel])-4*(lowOpacity[channel]-noOverlay[channel]))<=6,'overlay opacity is applied once without accumulating overlapping layers');
 await overlayPixel(20);assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),beforeOpacity,'overlay opacity preserves the map position');assert.equal(await page.locator('#map-layer').inputValue(),'relief','opacity does not change the background layer');
 // The camera supports genuine street-scale tile detail, beyond enlargement of a fixed raster.
 await page.locator('#map-layer').selectOption('topo');await c.focus();for(let i=0;i<7;i++)await page.keyboard.press('+');await settled(page);assert.ok(tileRequests.some(t=>t.layer==='topo'&&t.z>=14),'street-scale navigation requests a finer tile matrix');
 const before=await page.evaluate(()=>marineLimitMap.getView());await page.keyboard.press('ArrowLeft');await settled(page);assert.ok(await page.evaluate(x=>marineLimitMap.getView().x<x,before.x));await page.keyboard.press('Home');await settled(page);assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),home);
 const start=await page.evaluate(()=>marineLimitMap.getView());await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.55);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.5+50,rect.y+rect.height*.55+20,{steps:4});await page.mouse.up();await settled(page);assert.notDeepEqual(await page.evaluate(()=>marineLimitMap.getView()),start,'drag pans');
 await page.locator('#place').fill('Trondheim');await page.locator('#place-form button').click();await settled(page);assert.equal(await page.locator('#status').isVisible(),false,'centre-name alias is accepted');
 if(viewport.width<700){const touch=await context.newCDPSession(page),r=await c.boundingBox(),x=r.x+r.width*.5,y=r.y+r.height*.5,z=await page.evaluate(()=>marineLimitMap.getView().z);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y},{x:x+30,y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-60,y},{x:x+60,y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settled(page);assert.ok(await page.evaluate(z=>marineLimitMap.getView().z>z,z),'two-finger pinch zooms');}
 await page.locator('#theme').click();assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('dark')),true);
 const bounds=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,map:document.querySelector('#map').getBoundingClientRect().toJSON()}));assert.ok(bounds.sw<=bounds.w+1&&bounds.sh<=bounds.h+1,JSON.stringify(bounds));assert.ok(bounds.map.height>350,'map dominates the screen');
 await page.locator('#about').click();assert.match(await page.locator('#about-dialog').innerText(),/ikke målepunkter|ikke påvist marin leire/);await page.keyboard.press('Escape');
 // Local reserve remains usable when the chosen tile service is down.
 const retained=await page.evaluate(()=>marineLimitMap.getView());await page.locator('#map-layer').selectOption('local');await settled(page);const requestCount=tileRequests.length;await c.focus();await page.keyboard.press('+');await settled(page);assert.equal(tileRequests.length,requestCount,'local reserve makes no tile requests');await page.locator('#map-layer').selectOption('topo');await settled(page);
 if(viewport.width===1366){
  // Basemap failure is visible and recoverable without moving the map.
  network.fail.add('relief');await page.locator('#map-layer').selectOption('relief');await page.locator('#place').fill('Bergen');await page.locator('#place-form button').click();
  await page.waitForFunction(()=>{const t=marineLimitMap.getTileState();return t.failed>0&&t.loading===0&&t.queued===0&&document.querySelector('#map-status').textContent.includes('kunne ikke lastes');});const failedCamera=await page.evaluate(()=>marineLimitMap.getView());
  assert.match(await page.locator('#map-status').innerText(),/kunne ikke lastes/);network.fail.clear();await page.locator('#map-layer').selectOption('local');await settled(page);await page.locator('#map-layer').selectOption('relief');await settled(page);
  assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),failedCamera,'recovering the tile service preserves the camera');
  // NGU detail failures keep the overview available; explicit retry fetches the real local chunk.
  network.failDetail=true;await page.locator('#place').fill('Alta');await page.locator('#place-form button').click();
  await page.waitForFunction(()=>marineLimitMap.getDetailState().failed>0);assert.match(await page.locator('#detail-status').innerText(),/Oversiktslaget vises/);assert.equal(await page.evaluate(()=>marineLimitMap.featureCount),2867);
  const detailCamera=await page.evaluate(()=>marineLimitMap.getView());network.failDetail=false;await page.locator('#marine-layer').uncheck();await page.locator('#marine-layer').check();
  await page.waitForFunction(()=>{const d=marineLimitMap.getDetailState();return d.visible.length>0&&d.loading===0&&d.failed===0&&d.loaded===d.visible.length;});
  assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),detailCamera,'retrying detail does not move the camera');
  // Late imagery is always positioned using the current camera.
  network.hold=true;await page.locator('#map-layer').selectOption('toporaster');
  await page.waitForFunction(()=>marineLimitMap.getTileState().loading>0);await c.focus();await page.keyboard.press('ArrowRight');const moved=await page.evaluate(()=>marineLimitMap.getView());
  network.hold=false;for(const release of network.pending.splice(0))release();await settled(page);assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),moved,'late tile responses do not restore an older camera');
  // A genuine provider failure shows a clearly identified, registered relief reserve.
  network.fail.add('topo');await page.locator('#map-layer').selectOption('topo');await page.locator('#place').fill('Tromsø');await page.locator('#place-form button').click();
  await page.waitForFunction(()=>{const t=marineLimitMap.getTileState();return t.layer==='topo'&&t.failed>0&&t.loading===0&&t.queued===0&&t.fallback&&document.querySelector('#map-status').textContent.includes('Viser terrengrelieff');});
  assert.match(await page.locator('#map-status').innerText(),/Kartverket-kartet er utilgjengelig\. Viser terrengrelieff/,'reserve is identified honestly');
  assert.equal(await page.locator('#map-layer').inputValue(),'topo','reserve does not silently change the chosen layer');
  const fallbackCamera=await page.evaluate(()=>marineLimitMap.getView());network.fail.clear();await page.locator('#map-layer').selectOption('local');await settled(page);await page.locator('#map-layer').selectOption('topo');await settled(page);
  assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),fallbackCamera,'returning from reserve preserves the camera');
  // If both providers fail, loading ends with an actionable error and a usable local map.
  network.fail.add('topo');network.fail.add('relief');await page.locator('#place').fill('Kristiansand');await page.locator('#place-form button').click();
  await page.waitForFunction(()=>{const t=marineLimitMap.getTileState();return t.failed>0&&t.loading===0&&t.queued===0&&document.querySelector('#map-status').textContent.includes('Kartbakgrunnene kunne ikke lastes');});
  assert.match(await page.locator('#map-status').innerText(),/prøve igjen.*enkelt reservekart/);const doubleFailureCamera=await page.evaluate(()=>marineLimitMap.getView());await page.locator('#map-layer').selectOption('local');await settled(page);
  assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),doubleFailureCamera);assert.equal(await page.locator('#map-status').isVisible(),false,'local reserve clears the failed remote-provider message');const localRequestCount=tileRequests.length;await c.focus();await page.keyboard.press('ArrowRight');await settled(page);assert.equal(tileRequests.length,localRequestCount,'local navigation after two remote failures needs no network');network.fail.clear();await page.locator('#map-layer').selectOption('topo');await settled(page);
  // If anonymous CORS is denied, ordinary image loading gets one explicit retry.
  const corsStart=tileRequests.length;network.noCors.add('toporaster');await page.locator('#place').fill('Stavanger');await page.locator('#place-form button').click();await settled(page);await page.locator('#map-layer').selectOption('toporaster');await settled(page);
  const corsRequests=tileRequests.slice(corsStart).filter(t=>t.layer==='toporaster');assert.ok(corsRequests.some(t=>t.cors)&&corsRequests.some(t=>!t.cors),'WMTS retries without crossOrigin after a CORS refusal: '+JSON.stringify(corsRequests));network.noCors.clear();
 }
 assert.equal(requests.some(u=>/geo\.ngu\.no/.test(u)),false,'the map never calls NGU servers');reports.push({viewport,registrations,requests:tileRequests.length});await context.close();
}
// A failed local overview reports an actionable error and recovers on reload.
{
 const context=await browser.newContext({viewport:{width:1024,height:768}});let failOverview=true;
 await context.route('**/*',r=>{const u=r.request().url();if(!u.startsWith(base+'/'))return r.abort();if(failOverview&&u.includes('/data/under-marine-limit.geojson'))return r.fulfill({status:503,body:'fixture overview unavailable'});return r.continue();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/geografi/marin-grense.html');await page.waitForFunction(()=>document.getElementById('status').textContent.includes('kunne ikke lastes'));
 assert.equal(await page.locator('#status').isVisible(),true);failOverview=false;await page.reload();await page.waitForFunction(()=>window.marineLimitMap?.featureCount===2867);await page.locator('#map-layer').selectOption('local');await settled(page);assert.equal(await page.locator('#status').isVisible(),false);await context.close();
}
assert.deepEqual(errors,[]);console.log('PASS detailed marine map:',JSON.stringify(reports),'; UTM33 projection, independent tile-landmark registration, layers/camera, street-scale zoom, touch/keyboard and local reserve.');
if(process.env.MARINE_LIVE==='1'){
 // Browser routing transports exact, current provider responses. It never proxies
 // blocked Kartverket/Geonorge hosts and never substitutes fixtures for real JPEGs.
 const context=await browser.newContext({viewport:{width:1366,height:768}}),real=[],liveErrors=[],pending=new Map(),temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'marine-live-'));
 async function actualTile(url){
  if(pending.has(url))return pending.get(url);
  const job=(async()=>{const n=pending.size,headerFile=path.join(temp,n+'.headers'),bodyFile=path.join(temp,n+'.jpg');const {stdout}=await curl('curl',['--fail','--silent','--show-error','--max-time','25','--dump-header',headerFile,'--output',bodyFile,'--write-out','%{http_code} %{content_type}',url],{encoding:'utf8'});assert.equal(stdout.trim(),'200 image/jpeg','live Esri responds with an actual JPEG');const blocks=fs.readFileSync(headerFile,'utf8').split(/\r?\n\r?\n/).filter(s=>/^HTTP\//.test(s)),headers=blocks.at(-1);assert.match(headers,/access-control-allow-origin:\s*\*/i,'provider actually grants anonymous CORS');const body=fs.readFileSync(bodyFile);assert.equal(body[0],255);assert.equal(body[1],216);real.push({url,status:200,contentType:'image/jpeg',cors:'*',bytes:body.length});return body;})();pending.set(url,job);return job;
 }
 try{
  await context.route('**/*',async route=>{const url=route.request().url();if(url.startsWith(base+'/'))return route.continue();if(!url.startsWith('https://whi.maptiles.arcgis.com/arcgis/rest/services/World_Hillshade/MapServer/tile/'))return route.abort();try{requestedTile(url);const body=await actualTile(url);return route.fulfill({status:200,contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'},body});}catch(e){liveErrors.push(e.message);return route.abort();}});
  const page=await context.newPage();page.on('pageerror',e=>liveErrors.push(e.message));await page.goto(base+'/geografi/marin-grense.html');await page.waitForFunction(()=>window.marineLimitMap?.featureCount===2867);await page.locator('#map-layer').selectOption('local');await settled(page);await page.locator('#place').fill('Oslo');await page.locator('#place-form button').click();await settled(page);await page.locator('#marine-layer').uncheck();await page.locator('#map-layer').selectOption('relief');await settled(page);
  const state=await page.evaluate(()=>marineLimitMap.getTileState());assert.equal(state.provider,'esri-hillshade');assert.ok(state.ready>0&&state.failed===0,'current provider JPEGs become ready in the actual renderer');
  const variation=await page.evaluate(()=>{const c=document.getElementById('map'),ctx=c.getContext('2d'),data=ctx.getImageData(0,0,c.width,c.height).data,colors=new Set();for(let i=0;i<data.length;i+=64)colors.add(data[i]+','+data[i+1]+','+data[i+2]);return colors.size;});assert.ok(variation>100,'real hillshade paints varied terrain, rather than a solid placeholder');assert.equal(await page.locator('#map-status').isVisible(),false,'successful live source removes loading/error status');
  fs.mkdirSync('/workspace/artifacts/marine-detail-qa',{recursive:true});await page.screenshot({path:'/workspace/artifacts/marine-detail-qa/live-whi-oslo.png'});fs.writeFileSync('/workspace/artifacts/marine-detail-qa/live-whi-responses.json',JSON.stringify({state,variation,responses:real},null,2));assert.deepEqual(liveErrors,[]);console.log('PASS real provider hillshade:',JSON.stringify({tiles:real.length,bytes:real.reduce((n,r)=>n+r.bytes,0),variation}));
 }finally{await context.close();fs.rmSync(temp,{recursive:true,force:true});}
}
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
