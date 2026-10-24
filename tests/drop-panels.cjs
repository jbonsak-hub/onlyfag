const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:58390',out=process.env.DROP_SCREENSHOTS||path.resolve(__dirname,'../../panel-validation');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});const report={cases:[],errors:[]};try{
 for(const viewport of [{width:1366,height:900},{width:1000,height:643},{width:390,height:844}]){
  const context=await browser.newContext({viewport,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base+'/prototypes/folg-drapen.html');await page.waitForFunction(()=>window.DropPrototype?.snapshot().ready);await page.waitForTimeout(100);
  const snapshot=()=>page.evaluate(()=>DropPrototype.snapshot()),original=await snapshot();assert.equal(await page.locator('#map-focus').count(),0);
  async function move(panel,handle,dx,dy,touch=false){const before=await page.locator(panel).boundingBox(),h=await page.locator(handle).boundingBox(),x=h.x+h.width/2,y=h.y+h.height/2;
   if(touch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/5,y:y+dy*i/5}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
   else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:6});await page.mouse.up();}
   await page.waitForTimeout(80);const after=await page.locator(panel).boundingBox();assert(Math.hypot(after.x-before.x,after.y-before.y)>60,'The panel follows its drag handle');assert(after.x>=7&&after.y>=7&&after.x+after.width<=viewport.width-7&&after.y+after.height<=viewport.height-7,'Panel stays inside the viewport');assert.deepEqual((await snapshot()).camera,original.camera,'Moving a panel never moves the map');return after;
  }
  const movedPlayer=await move('#player','#player-grip',viewport.width<600?0:230,-150,viewport.width<600);
  await page.locator('#toggle-player').click();assert(await page.locator('#player').isHidden());assert.equal(await page.locator('#toggle-player').getAttribute('aria-expanded'),'false');await page.locator('#toggle-player').click();assert.deepEqual(await page.locator('#player').boundingBox(),movedPlayer,'Player position survives hide/show');
  await page.locator('#map-style summary').click();await page.locator('#style-panel').waitFor({state:'visible'});assert(await page.locator('#player').isVisible(),'Both panels can be open together');
  const movedStyle=await move('#style-panel','#style-grip',-220,120,viewport.width<600);
  await page.locator('#map-style summary').click();await page.locator('#style-panel').waitFor({state:'hidden'});await page.locator('#map-style summary').click();await page.locator('#style-panel').waitFor({state:'visible'});assert.deepEqual(await page.locator('#style-panel').boundingBox(),movedStyle,'Style position survives hide/show');
  await page.locator('#style-grip').focus();await page.keyboard.press('ArrowUp');const keyboardMoved=await page.locator('#style-panel').boundingBox();assert(Math.abs(keyboardMoved.y-movedStyle.y+10)<1,'Keyboard moves the focused panel');
  await page.locator('#map-style summary').click();await page.locator('#river-map').focus();for(let i=0;i<12;i++)await page.keyboard.press('-');assert((await snapshot()).zoom<.5,'The map can zoom out beyond its initial fitted view');await page.keyboard.press('0');assert.equal((await snapshot()).zoom,1);
  assert.deepEqual((await snapshot()).route,original.route);assert.equal((await snapshot()).progress,original.progress);
  await page.setViewportSize({width:320,height:568});await page.waitForTimeout(100);await page.locator('#map-style summary').click();await page.locator('#style-panel').waitFor({state:'visible'});for(const panel of ['#player','#style-panel']){const r=await page.locator(panel).boundingBox();assert(r.x>=7&&r.y>=7&&r.x+r.width<=313&&r.y+r.height<=561,'Dragged panel remains reachable after resizing: '+panel+' '+JSON.stringify(r));}
  await page.screenshot({path:path.join(out,'panels-'+viewport.width+'.png')});report.cases.push({viewport,drag:true,touch:viewport.width<600,independentToggles:true,retainsPosition:true,keyboard:true,zoomOut:true,resize:true});await context.close();
 }
 assert.deepEqual(report.errors,[]);report.success=true;console.log(JSON.stringify(report));
}finally{await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
