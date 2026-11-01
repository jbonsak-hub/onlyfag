/* Offline marine-limit teaching map: real snapshot, controls and coverage language. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.geojson':'application/geo+json','.css':'text/css; charset=utf-8','.webp':'image/webp'};
const server=http.createServer((req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+'/'))return res.writeHead(403).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{let browser;try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});const errors=[];
for(const viewport of [{width:1366,height:768},{width:1024,height:768},{width:390,height:844}]){
 const context=await browser.newContext({viewport,hasTouch:viewport.width<700});const requests=[];
 await context.route('**/*',r=>{const u=r.request().url();requests.push(u);return u.startsWith(base+'/')?r.continue():r.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/geografi/marin-grense.html');await page.waitForFunction(()=>window.marineLimitMap?.featureCount===2867);
 assert.equal(await page.locator('#status').isVisible(),false);
 assert.ok(await page.locator('#places option').count()>350,'local municipality lookup is available');
 const home=await page.evaluate(()=>marineLimitMap.getView());await page.locator('#zoom-in').click();assert.ok(await page.evaluate(z=>marineLimitMap.getView().z>z,home.z));await page.locator('#home').click();assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),home);
 await page.locator('#place').fill('Oslo');await page.locator('#place-form button').click();assert.ok(await page.evaluate(()=>marineLimitMap.getView().z>10));
 const c=page.locator('#map'),rect=await c.boundingBox(),at=await page.evaluate(()=>marineLimitMap.project(10.74609,59.91273));
 await page.mouse.click(rect.x+at[0],rect.y+at[1]);await page.locator('#info:not([hidden])').waitFor();assert.match(await page.locator('#info-title').innerText(),/Kartlagt under marin grense/,'Oslo centre is inside actual NGU polygon, not an invented height threshold');await page.locator('#close-info').click();
 await c.focus();const before=await page.evaluate(()=>marineLimitMap.getView());await page.keyboard.press('ArrowLeft');assert.ok(await page.evaluate(x=>marineLimitMap.getView().x<x,before.x));await page.keyboard.press('Home');assert.deepEqual(await page.evaluate(()=>marineLimitMap.getView()),home);
 const start=await page.evaluate(()=>marineLimitMap.getView());await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.55);await page.mouse.down();await page.mouse.move(rect.x+rect.width*.5+50,rect.y+rect.height*.55+20,{steps:4});await page.mouse.up();assert.notDeepEqual(await page.evaluate(()=>marineLimitMap.getView()),start,'drag pans');
 await page.locator('#marine-layer').uncheck();assert.equal(await page.locator('#marine-layer').isChecked(),false);await page.locator('#marine-layer').check();
 await page.locator('#place').fill('Trondheim');await page.locator('#place-form button').click();assert.equal(await page.locator('#status').isVisible(),false,'centre-name alias Trondheim is accepted');assert.equal(await page.evaluate(()=>marineLimitMap.getView().z),18);
 if(viewport.width<700){const touch=await context.newCDPSession(page),r=await c.boundingBox(),x=r.x+r.width*.5,y=r.y+r.height*.5;const z=await page.evaluate(()=>marineLimitMap.getView().z);await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y},{x:x+30,y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-60,y},{x:x+60,y}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await page.evaluate(z=>marineLimitMap.getView().z>z,z),'two-finger pinch zooms');}
 await page.locator('#theme').click();assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('dark')),true);
 const bounds=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,map:document.querySelector('#map').getBoundingClientRect().toJSON()}));assert.ok(bounds.sw<=bounds.w+1&&bounds.sh<=bounds.h+1,JSON.stringify(bounds));assert.ok(bounds.map.height>350,'map dominates the screen');
 await page.locator('#about').click();assert.match(await page.locator('#about-dialog').innerText(),/ikke målepunkter|ikke påvist marin leire/);await page.keyboard.press('Escape');
 if(process.env.MARINE_SCREENSHOTS){fs.mkdirSync(process.env.MARINE_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.MARINE_SCREENSHOTS,viewport.width+'-trondheim.png')});await page.locator('#theme').click();await page.locator('#home').click();await page.screenshot({path:path.join(process.env.MARINE_SCREENSHOTS,viewport.width+'-norway.png')});}
 assert.equal(requests.some(u=>/geo\.ngu\.no/.test(u)),false,'the map never calls NGU servers');await context.close();
}
assert.deepEqual(errors,[]);console.log('PASS marine limit: local 2867-feature snapshot, offline municipality search, actual Oslo coverage, pan/zoom/pinch, keyboard, layers, theme and PC/mobile layout.');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
