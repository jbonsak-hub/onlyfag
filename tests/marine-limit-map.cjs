/* Deterministic projected map integration. Remote fixture images contain fixed
   pyproj landmarks: they verify placement, not live map-service availability. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
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
  const match=u.pathname.match(/^\/v1\/wmts\/1\.0\.0\/(topo|toporaster)\/default\/utm33n\/(\d{2})\/(\d+)\/(\d+)\.png$/);assert.ok(match,'official UTM33 WMTS URL');
  const [,layer,matrix,rowText,colText]=match,z=Number(matrix),row=Number(rowText),col=Number(colText),span=baseSpan/2**z;
  assert.ok(z>=0&&z<=18&&row>=0&&col>=0&&row<2**z&&col<2**z,'valid UTM33 tile indices');
  return {layer,z,row,col,span,left:origin[0]+col*span,top:origin[1]-row*span};
 }
 assert.equal(u.origin+u.pathname,'https://wms.geonorge.no/skwms1/wms.hoyde-dtm');
 const p=u.searchParams;for(const [k,v] of Object.entries({service:'WMS',version:'1.3.0',request:'GetMap',layers:'DTM:multiskyggerelieff',styles:'',crs:'EPSG:25833',width:'256',height:'256',format:'image/png',transparent:'true'}))assert.equal(p.get(k),v,'relief WMS '+k);
 const [left,bottom,right,top]=p.get('bbox').split(',').map(Number),span=right-left,z=Math.log2(baseSpan/span),row=(origin[1]-top)/span,col=(left-origin[0])/span;
 assert.ok(Math.abs(top-bottom-span)<1e-5,'square metric WMS bounds');for(const value of [z,row,col])assert.ok(Math.abs(value-Math.round(value))<1e-5,'WMS imagery is aligned to the WMTS UTM33 grid');
 return {layer:'relief',z:Math.round(z),row:Math.round(row),col:Math.round(col),span,left,top};
}
function fixture(tile){
 const [background,marker]=colors[tile.layer];
 const marks=landmarks.map(p=>{const x=(p.easting-tile.left)/tile.span*256,y=(tile.top-p.northing)/tile.span*256;return x>=-6&&x<=262&&y>=-6&&y<=262?`<circle cx="${x}" cy="${y}" r="5" fill="${marker}"/>`:'';}).join('');
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
 const context=await browser.newContext({viewport,hasTouch:viewport.width<700,deviceScaleFactor:viewport.width<700?2:1}),requests=[],tileRequests=[],network={fail:new Set(),hold:false,pending:[],failDetail:false};
 await context.route('**/*',async route=>{const u=route.request().url();requests.push(u);if(u.startsWith(base+'/')){if(network.failDetail&&u.includes('/marine-limit/data/detail/tiles/'))return route.fulfill({status:503,body:'fixture detail unavailable'});return route.continue();}if(!/^https:\/\/(cache\.kartverket\.no|wms\.geonorge\.no)\//.test(u))return route.abort();try{const tile=requestedTile(u);tileRequests.push(tile);if(network.hold)await new Promise(resolve=>network.pending.push(resolve));if(network.fail.has(tile.layer))return route.fulfill({status:503,body:'fixture service unavailable',headers:{'access-control-allow-origin':'*'}});return route.fulfill({status:200,contentType:'image/svg+xml',headers:{'access-control-allow-origin':'*'},body:fixture(tile)});}catch(e){errors.push(e.message);return route.abort();}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/geografi/marin-grense.html');await page.waitForFunction(()=>window.marineLimitMap?.featureCount>=2800);await settled(page);
 assert.equal(await page.locator('#map-layer').inputValue(),'topo','detailed topographic map is the default');assert.ok(tileRequests.some(t=>t.layer==='topo'),'default actually requests detailed tiles');assert.ok(await page.locator('#places option').count()>350);
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
  await page.waitForFunction(()=>marineLimitMap.getTileState().failed>0);const failedCamera=await page.evaluate(()=>marineLimitMap.getView());
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
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
