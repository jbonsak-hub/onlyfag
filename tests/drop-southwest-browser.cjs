// Exercise real southern/western journeys and navigating the expanded start list.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.DROP_SCREENSHOTS||path.resolve(root,'../drop-southwest-validation');
const data=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/drop-prototype/data.json'),'utf8'));
const byId=new Map(data.segments.map(segment=>[String(segment.id),segment])),basins=new Map(data.basins.map(basin=>[String(basin.id),basin]));
const startIds=data.starts.map(start=>String(start.id)).sort(),regions=['Østlandet','Sørlandet','Vestlandet'];
for(const region of regions)assert(data.basins.some(basin=>basin.region===region),'The source includes '+region);
const startFor=basin=>data.starts.find(start=>String(start.id)===String(basin.id))||data.starts.find(start=>String(byId.get(String(start.segment)).basin)===String(basin.id));
const samples=['Sørlandet','Vestlandet'].map(region=>{
  const basin=data.basins.filter(basin=>basin.region===region&&startFor(basin)).sort((a,b)=>(b.mainCatchmentAreaKm2||0)-(a.mainCatchmentAreaKm2||0))[0];
  assert(basin,'An accessible main journey exists in '+region);return {region,basin,start:startFor(basin)};
});
function expectedRoute(start){const result=[],seen=new Set();for(let s=byId.get(String(start));s;s=s.next==null?null:byId.get(String(s.next))){assert(!seen.has(String(s.id)),'No cycle in the independent route walk');seen.add(String(s.id));result.push(String(s.id));}return result;}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((request,response)=>{
  if(!['GET','HEAD'].includes(request.method))return response.writeHead(405).end();
  if(request.url==='/favicon.ico')return response.writeHead(204).end();
  const file=path.resolve(root,'.'+new URL(request.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
  try{response.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');response.end(request.method==='HEAD'?undefined:fs.readFileSync(file));}catch{return response.writeHead(404).end();}
});
(async()=>{
  fs.mkdirSync(out,{recursive:true});let browser,base=process.env.BASE_URL;const report={cases:[],errors:[],missing:[],external:[]};
  try{
    if(!base){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;}
    browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
    for(const viewport of [{width:1366,height:900},{width:390,height:844},{width:320,height:568}]){
      const context=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await context.newPage();
      await context.route('**/*',route=>{const q=route.request();if(['GET','HEAD'].includes(q.method())&&(q.url().startsWith(base+'/')||/^(data|blob):/.test(q.url())))return route.continue();report.external.push(q.url());return route.abort();});
      page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.missing.push(r.url());});
      await page.clock.install();await page.goto(base+'/prototyper/folg-drapen.html');await page.waitForFunction(()=>window.DropPrototype?.snapshot().ready);
      const snapshot=()=>page.evaluate(()=>DropPrototype.snapshot()),options=()=>page.locator('#start-point option').evaluateAll(es=>es.map(e=>e.value).filter(Boolean).sort());
      assert.deepEqual(await options(),startIds,'Every supplied start remains selectable, without duplicate values');
      for(const region of regions)assert(await page.locator('#start-point optgroup[label="'+region+'"]').count());
      const original=await snapshot();await page.locator('#start-search').fill('zzzzzzzzzz');assert.equal(await page.locator('#start-point').inputValue(),original.selectedStart,'Filtering never removes the active start');
      assert.equal(await page.locator('#start-search-count').textContent(),'0 treff');assert.deepEqual((await snapshot()).route,original.route);assert.deepEqual((await snapshot()).camera,original.camera);
      await page.locator('#start-search').press('Escape');assert.equal(await page.locator('#start-search').inputValue(),'');assert.deepEqual(await options(),startIds,'Clearing restores all starts');
      await page.locator('#start-search').fill('sorlandet');assert(await page.locator('#start-point optgroup[label="Sørlandet"]').count(),'Norwegian letters can be searched without diacritics');assert.equal(await page.locator('#start-point').inputValue(),original.selectedStart);
      await page.locator('#start-search').press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'start-point','Enter moves keyboard users to the results');await page.locator('#start-search').fill('');
      for(const id of ['player-grip','start-search','start-point','pause']){const box=await page.locator('#'+id).boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,id+' remains inside '+viewport.width+'px');}
      const journeys=[];
      for(const sample of samples){
        await page.locator('#start-search').fill('');await page.locator('#reset').click();
        // Start with Glomma selected, then zoom and pan to an eastern view.
        await page.locator('#start-point').selectOption('002-34');await page.locator('#river-map').focus();for(let i=0;i<6;i++)await page.keyboard.press('+');for(let i=0;i<40;i++)await page.keyboard.press('ArrowRight');
        const expected=expectedRoute(sample.start.segment),points=expected.flatMap(id=>byId.get(id).points),before=await snapshot();
        const visibleBefore=await page.evaluate(points=>points.some(point=>{const p=DropPrototype.worldToScreen(point);return p.x>=0&&p.x<=innerWidth&&p.y>=0&&p.y<=innerHeight;}),points);
        assert.equal(visibleBefore,false,'The target starts entirely outside the current eastern view');
        await page.locator('#start-search').fill(sample.basin.name);await page.locator('#start-point').selectOption(String(sample.start.id));
        const selected=await snapshot();assert.equal(selected.basin,String(sample.basin.id));assert.deepEqual(selected.route,expected);assert.equal(selected.outlet,String(sample.basin.outletSegment));assert.notDeepEqual(selected.camera,before.camera,'An offscreen preset brings its basin into view');
        const visibleAfter=await page.evaluate(points=>points.some(point=>{const p=DropPrototype.worldToScreen(point);return p.x>12&&p.x<innerWidth-12&&p.y>85&&p.y<innerHeight-20&&document.elementFromPoint(p.x,p.y)?.id==='river-map';}),points);
        assert(visibleAfter,'The selected '+sample.region+' journey is visible outside the controls');
        await page.locator('#speed').selectOption('4');await page.locator('#pause').click();await page.clock.runFor(12000);const complete=await snapshot();assert(complete.completed&&complete.paused);assert.equal(complete.progress,1);assert.equal(complete.outlet,String(sample.basin.outletSegment));
        assert((await page.locator('#status').textContent()).includes(sample.basin.outletLabel||'utløp'),'Completion names the selected outlet');
        journeys.push({region:sample.region,basin:sample.basin.name,segments:expected.length,outlet:complete.outlet});
      }
      // A direct river click preserves the camera after preset navigation.
      await page.locator('#start-search').fill('');const west=samples[1],clickable=data.segments.filter(s=>String(s.basin)===String(west.basin.id)&&s.routable!==false).flatMap(s=>s.points.map(point=>({point,id:String(s.id)})));
      const click=await page.evaluate(candidates=>{for(const candidate of candidates){const p=DropPrototype.worldToScreen(candidate.point);if(p.x>20&&p.x<innerWidth-20&&p.y>90&&p.y<innerHeight-25&&document.elementFromPoint(p.x,p.y)?.id==='river-map')return p;}},clickable);
      assert(click,'A real western river is reachable on the map');const cameraBeforeClick=(await snapshot()).camera;await page.mouse.click(click.x,click.y);assert.deepEqual((await snapshot()).camera,cameraBeforeClick,'Map clicks keep the current camera');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1));
      await page.screenshot({path:path.join(out,'southwest-'+viewport.width+'.png')});report.cases.push({viewport,starts:startIds.length,regionalGroups:true,search:true,retainsSelection:true,presetAutoFit:true,mapClickPreservesCamera:true,journeys});await context.close();
    }
    assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);assert.deepEqual(report.external,[]);report.success=true;console.log(JSON.stringify(report));
  }finally{if(browser)await browser.close();if(server.listening)await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1;});
