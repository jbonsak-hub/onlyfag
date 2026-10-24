/* Canada and Mexico supply geographical context without becoming quiz answers. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),states=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/us-states.json'),'utf8'));
// Independently chosen geographic checkpoints, projected into the unchanged
// Census state coordinates. They test actual land/water rather than path count.
const checkpoints=[
  {name:'Canada north of North Dakota (-100,50)',at:[462.708,52.865],country:'Canada'},
  {name:'Northern Canada (-100,60)',at:[469.557691,-109.795786],country:'Canada'},
  {name:'Canada beside Alaska (-138,65)',at:[248.569173,499.510549],country:'Canada',area:'AK'},
  {name:'Ontario north of Huron (-82,46.5)',at:[672.928,101.124],country:'Canada'},
  {name:'Southern Ontario (-80.5,43.5)',at:[698.863,149.253],country:'Canada'},
  {name:'Northern Mexico (-105,30)',at:[374.140,392.022],country:'Mexico'},
  {name:'Southern Mexico (-100,20)',at:[441.082771,566.394178],country:'Mexico'},
  {name:'Canada immediately north of the border (-100,49.05)',at:[462.031895,68.918248],country:'Canada'},
  {name:'North Dakota immediately south of the border (-100,48.95)',at:[461.960563,70.612150],state:'North Dakota'},
  {name:'Lake Superior (-87.5,47.5)',at:[606.680,91.802]},
  {name:'Lake Huron (-82.4,44.7)',at:[672.642,132.385]},
  {name:'Lake Erie (-81,42.1)',at:[696.545,174.118]},
  {name:'Lake Ontario (-77.9,43.65)',at:[730.096,141.046]},
  {name:'Lake Michigan (-87,43.7)',at:[618.656,156.173]}
];
const server=http.createServer((req,res)=>{
  try{const file=path.join(root,new URL(req.url,'http://localhost').pathname);res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/json');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404).end();}
});
async function capture(page,name){if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,name+'.png')});}}
async function realStateClick(page,name){
  const point=await page.evaluate(name=>{
    const shape=[...document.querySelectorAll('path.state')].find(el=>el.dataset.state===name),box=shape.getBBox();
    for(const fy of [.5,.4,.6,.3,.7,.2,.8,.1,.9])for(const fx of [.5,.4,.6,.3,.7,.2,.8,.1,.9]){
      const local=new DOMPoint(box.x+box.width*fx,box.y+box.height*fy);if(!shape.isPointInFill(local))continue;
      const screen=local.matrixTransform(shape.getScreenCTM());
      if(document.elementFromPoint(screen.x,screen.y)?.closest('[data-state]')?.dataset.state===name)return {x:screen.x,y:screen.y};
    }
    const marker=[...document.querySelectorAll('.small-marker')].find(el=>el.dataset.state===name);
    if(marker){const circle=marker.querySelector('circle'),p=new DOMPoint(circle.cx.baseVal.value,circle.cy.baseVal.value).matrixTransform(marker.getScreenCTM());return {x:p.x,y:p.y};}
  },name);
  assert(point,name+' remains a physical click target');await page.mouse.click(point.x,point.y);
}
async function inspectContext(page){
  assert.equal(await page.locator('path.state').count(),50,'Only the 50 states are answer shapes');
  assert.equal(await page.locator('#smallStates [data-state]').count(),8,'Small-state targets are preserved');
  const structure=await page.locator('#us-context').evaluate(el=>({hidden:el.getAttribute('aria-hidden'),events:getComputedStyle(el).pointerEvents,answers:el.querySelectorAll('[data-state],[tabindex],[role="button"]').length,canada:el.querySelectorAll('path[data-country="Canada"][data-area="main"]').length,mexico:el.querySelectorAll('path[data-country="Mexico"][data-area="main"]').length,alaskaCanada:el.querySelectorAll('path[data-country="Canada"][data-area="AK"]').length,invalid:[...el.querySelectorAll('path')].some(p=>!p.getAttribute('d')||/NaN|Infinity/.test(p.getAttribute('d')))}));
  assert.equal(structure.hidden,'true');assert.equal(structure.events,'none');assert.equal(structure.answers,0);assert.equal(structure.canada,1);assert.equal(structure.mexico,1);assert.equal(structure.alaskaCanada,1);assert.equal(structure.invalid,false);
  const shapeSource=await page.locator('path.state').evaluateAll(els=>els.map(el=>[el.dataset.state,el.getAttribute('d')]));
  assert.deepEqual(new Map(shapeSource),new Map(states.map(s=>[s.n,s.d])),'Adding context preserves every existing state outline');
  const layout=await page.evaluate(()=>{
    const state=name=>[...document.querySelectorAll('path.state')].find(el=>el.dataset.state===name),florida=state('Florida').getBoundingClientRect(),hawaii=state('Hawaii').getBoundingClientRect();
    const transform=el=>{const m=el.getCTM();return [m.a,m.b,m.c,m.d,m.e,m.f];};
    return {insetDelta:Math.abs(florida.bottom-hawaii.bottom),overflow:document.documentElement.scrollWidth>innerWidth,main:transform(state('North Dakota')),canada:transform(document.querySelector('#us-context path[data-country="Canada"][data-area="main"]')),mexico:transform(document.querySelector('#us-context path[data-country="Mexico"][data-area="main"]')),alaska:transform(state('Alaska')),alaskaCanada:transform(document.querySelector('#us-context path[data-country="Canada"][data-area="AK"]'))};
  });
  assert(layout.insetDelta<.1,'Hawaii still aligns with Florida');assert.equal(layout.overflow,false);assert.deepEqual(layout.canada,layout.main,'Canada follows the same camera and projection as the states');assert.deepEqual(layout.mexico,layout.main,'Mexico follows the same camera and projection as the states');assert.deepEqual(layout.alaskaCanada,layout.alaska,'Canada beside Alaska follows the inset transform');
  const geography=await page.evaluate(points=>points.map(point=>{
    const area=point.area||'main',p=new DOMPoint(...point.at),countries=[...document.querySelectorAll('#us-context path[data-area="'+area+'"]')].filter(el=>el.isPointInFill(p)).map(el=>el.dataset.country),answers=[...document.querySelectorAll('path.state')].filter(el=>(area==='AK'?el.dataset.state==='Alaska':!['Alaska','Hawaii'].includes(el.dataset.state))&&el.isPointInFill(p)).map(el=>el.dataset.state);
    return {...point,countries,answers};
  }),checkpoints);
  for(const point of geography){assert.deepEqual(point.countries,point.country?[point.country]:[],point.name+' has the correct neighboring land or lake water');assert.deepEqual(point.answers,point.state?[point.state]:[],point.name+' preserves the real international boundary');}
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=process.env.BASE_URL||'http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE}),errors=[];
  try{
    for(const viewport of [{width:1366,height:900},{width:390,height:844}])for(const dark of [false,true]){
      const context=await browser.newContext({viewport});await context.addInitScript(dark=>{localStorage.setItem('geoDarkMode',dark?'1':'0');},dark);
      await context.route('**/*',route=>{const url=route.request().url();if(/analytics|cloudflareinsights/.test(url))return route.abort();if(/online-highscores(?:-[a-f0-9]+)?\.js/.test(url))return route.fulfill({contentType:'text/javascript',body:'/* local geometry test */'});return url.startsWith(base)||/^(data|blob):/.test(url)?route.continue():route.abort();});
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/geografi/statle.html');await page.locator('#start:enabled').waitFor();await inspectContext(page);
      await capture(page,'us-context-'+viewport.width+'-'+(dark?'dark':'light'));
      await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
      const target=await page.locator('#targetName').textContent();
      const canadaPoint=await page.evaluate(()=>{const el=document.querySelector('#us-context path[data-country="Canada"][data-area="main"]'),point=new DOMPoint(672.928,101.124).matrixTransform(el.getScreenCTM());return {x:point.x,y:point.y,answer:document.elementFromPoint(point.x,point.y)?.closest('[data-state]')?.dataset.state};});
      assert.equal(canadaPoint.answer,undefined,'Canadian land never captures an answer target');await page.mouse.click(canadaPoint.x,canadaPoint.y);
      await page.locator('#us-context path[data-country="Canada"]').first().dispatchEvent('click');
      assert.equal(await page.locator('#completed').textContent(),'0');assert.equal(await page.locator('#mistakes').textContent(),'0','Neighbor-country clicks do not submit answers');
      await page.locator('path.state').first().focus();await page.keyboard.press('+');await inspectContext(page);await page.keyboard.press('0');
      await realStateClick(page,target);assert.equal(await page.locator('#completed').textContent(),'1','State answers still work beside the context');
      await context.close();
    }
    const prototype=await browser.newPage({viewport:{width:1366,height:900}});prototype.on('pageerror',e=>errors.push(e.message));await prototype.goto(base+'/prototypes/statle.html');await prototype.locator('#start:enabled').waitFor();await inspectContext(prototype);await prototype.close();
    assert.deepEqual(errors,[]);console.log('PASS USA context: Canada/Mexico, unchanged 50 targets, no neighbor scoring, aligned transforms/insets, light/dark, desktop/mobile, zoom and prototype');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
