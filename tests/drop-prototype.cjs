// Follow real downstream links while exercising the standalone canvas controls.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const out = process.env.DROP_SCREENSHOTS || '/workspace/artifacts/drop-prototype-validation';
const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/drop-prototype/data.json'), 'utf8'));
const segments = data.segments.map(segment => ({...segment, id:String(segment.id), basin:String(segment.basin), next:segment.next == null ? null : String(segment.next)}));
const byId = new Map(segments.map(segment => [segment.id, segment]));
const basins = new Map(data.basins.map(basin => [String(basin.id), basin]));
assert.equal(byId.size, segments.length, 'Every river segment has a unique ID');
assert(basins.size >= 2, 'The pilot contains distinct drainage systems');
assert(data.starts.length >= 2, 'Keyboard users have a choice of starting places');

const terminalById = new Map();
for (const segment of segments) {
  assert(basins.has(segment.basin), segment.id + ' belongs to a known basin');
  assert(segment.points.length >= 2 && segment.points.every(point => point.length === 2 && point.every(Number.isFinite)), 'River geometry is finite');
  if (segment.next !== null) {
    assert(byId.has(segment.next), segment.id + ' has an existing downstream link');
    assert.equal(byId.get(segment.next).basin, segment.basin, 'Downstream links never cross a drainage divide');
  }
  const seen = new Set(), trail = [];
  let current = segment;
  while (!terminalById.has(current.id)) {
    assert(!seen.has(current.id), 'Downstream links form no cycle');
    seen.add(current.id);trail.push(current.id);
    if (current.next === null) {terminalById.set(current.id, current.id);break;}
    current = byId.get(current.next);
  }
  const terminal = terminalById.get(current.id);
  for (const key of trail) terminalById.set(key, terminal);
}
for(const segment of segments.filter(segment=>segment.routable!==false))assert.equal(terminalById.get(segment.id),String(basins.get(segment.basin).outletSegment),'Every routable river reaches its declared main outlet');

function expectedRoute(start) {
  const route = [];
  for (let segment = byId.get(start); segment; segment = segment.next === null ? null : byId.get(segment.next)) route.push(segment.id);
  return route;
}

function along(points, fraction) {
  const lengths = points.slice(1).map((point, i) => Math.hypot(point[0] - points[i][0], point[1] - points[i][1]));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * fraction;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const ratio = lengths[i] ? remaining / lengths[i] : 0;
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * ratio, points[i][1] + (points[i + 1][1] - points[i][1]) * ratio];
    }
    remaining -= lengths[i];
  }
}

const candidates = segments.filter(segment => segment.next !== null && segment.routable !== false).flatMap(segment => [.35, .65].map(fraction => ({id:segment.id, basin:segment.basin, point:along(segment.points, fraction)})));
const decorativeCandidates = segments.filter(segment=>segment.routable===false).flatMap(segment=>[.35,.65].map(fraction=>({id:segment.id,point:along(segment.points,fraction)})));
const report = {segments:segments.length, basins:basins.size, viewports:[], errors:[], missing:[], blocked:[]};
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml'};
const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) return response.writeHead(405).end();
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try {response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');response.end(request.method === 'HEAD' ? undefined : fs.readFileSync(file));}
  catch {response.writeHead(404).end('missing');}
});

(async () => {
  fs.mkdirSync(out, {recursive:true});
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
    async function context(options) {
      const context = await browser.newContext(options);
      context.on('page', page => {
        page.on('pageerror', error => report.errors.push(error.message));
        page.on('response', response => {if (response.url().startsWith(base) && response.status() >= 400) report.missing.push({url:response.url(), status:response.status()});});
      });
      await context.route('**/*', route => {
        const request = route.request(), url = request.url();
        if ((url.startsWith(base + '/') || /^(data|blob):/.test(url)) && ['GET', 'HEAD'].includes(request.method())) return route.continue();
        report.blocked.push({url, method:request.method()});return route.abort();
      });
      return context;
    }
    const snapshot = page => page.evaluate(() => DropPrototype.snapshot());
    async function routeCheck(page) {
      const state = await snapshot(page);
      assert(byId.has(state.selectedSegment), 'The displayed journey starts on an actual river segment');
      assert.notEqual(byId.get(state.selectedSegment).routable,false,'The selected river has a verified route to the main outlet');
      assert.deepEqual(state.route, expectedRoute(state.selectedSegment), 'The displayed route follows every downstream link to its outlet');
      assert(state.route.every(key => byId.get(key).basin === state.basin), 'A journey remains in its own drainage system');
      assert.equal(state.outlet, terminalById.get(state.selectedSegment), 'The journey ends at the independently calculated outlet');
      assert.equal(state.outlet,String(basins.get(state.basin).outletSegment),'The route reaches the declared basin mouth rather than an unmatched internal endpoint');
      assert.equal(await page.locator('#basin-name').textContent(), basins.get(state.basin).name);
      assert.match(await page.locator('#distance').textContent(), /km/);
      if (basins.get(state.basin).outletLabel) assert((await page.locator('#route-stages').textContent()).includes(basins.get(state.basin).outletLabel));
      return state;
    }
    async function pause(page) {if (!(await snapshot(page)).paused) await page.locator('#pause').click();}
    async function layoutCheck(page, viewport) {
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight + 1), 'The prototype has no page overflow');
      const clipped = await page.locator('#pause,#replay,#reset,#speed,#start-point,#mode-flow,#mode-basin').evaluateAll(elements => elements.filter(element => {const rect=element.getBoundingClientRect();return rect.x < 0 || rect.y < 0 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1;}).map(element => element.id));
      assert.deepEqual(clipped, [], 'All controls fit the ' + viewport.width + 'px viewport');
      const map = await page.locator('#river-map').boundingBox();
      assert.equal(map.width, viewport.width);assert.equal(map.height, viewport.height);
    }
    async function visibleCandidate(page, otherThan) {
      const candidate = await page.evaluate(({candidates, otherThan}) => {
        const canvas = document.getElementById('river-map');
        for (const candidate of candidates) {
          if (candidate.basin === otherThan) continue;
          const screen = DropPrototype.worldToScreen(candidate.point);
          if (screen.x > 16 && screen.x < innerWidth - 16 && screen.y > 85 && screen.y < innerHeight - 30 && document.elementFromPoint(screen.x, screen.y) === canvas) return {...candidate, screen};
        }
        return null;
      }, {candidates, otherThan});
      assert(candidate, 'A river in another basin is visible and reachable outside the controls');
      return candidate;
    }
    async function clickRiver(page, touch) {
      const before = await snapshot(page), candidate = await visibleCandidate(page, before.basin);
      if (touch) await page.touchscreen.tap(candidate.screen.x, candidate.screen.y);else await page.mouse.click(candidate.screen.x, candidate.screen.y);
      await page.waitForFunction(basin => DropPrototype.snapshot().basin === basin, candidate.basin);
      const after = await routeCheck(page);
      assert.notEqual(after.selectedSegment, before.selectedSegment, 'A real river click selects a different downstream journey');
      await pause(page);await page.clock.runFor(40);
      const painted = await page.evaluate(point => {
        const canvas=document.getElementById('river-map'),rect=canvas.getBoundingClientRect(),screen=DropPrototype.worldToScreen(point),x=Math.round((screen.x-rect.x)*canvas.width/rect.width),y=Math.round((screen.y-rect.y)*canvas.height/rect.height);
        const pixels=canvas.getContext('2d').getImageData(x-2,y-2,5,5).data;
        return Array.from({length:25},(_,i)=>Math.max(pixels[i*4],pixels[i*4+1],pixels[i*4+2])).some(value=>value>40);
      }, candidate.point);
      assert(painted, 'The selected river is painted on the canvas');
      return after;
    }
    async function checkDecorativeRiver(page,touch){
      if(!decorativeCandidates.length)return;
      const candidate=await page.evaluate(candidates=>{
        const canvas=document.getElementById('river-map');
        for(const candidate of candidates){const screen=DropPrototype.worldToScreen(candidate.point);if(screen.x>16&&screen.x<innerWidth-16&&screen.y>85&&screen.y<innerHeight-30&&document.elementFromPoint(screen.x,screen.y)===canvas)return {...candidate,screen};}
        return null;
      },decorativeCandidates);
      assert(candidate,'A decorative river is visible for the unmatched-route check');
      const before=await snapshot(page);if(touch)await page.touchscreen.tap(candidate.screen.x,candidate.screen.y);else await page.mouse.click(candidate.screen.x,candidate.screen.y);
      const after=await snapshot(page);assert.deepEqual(after.route,before.route,'An unmatched physical river never invents a route to another river');assert.equal(after.selectedSegment,before.selectedSegment);assert.match(await page.locator('#status').textContent(),/ikke klar/i);
    }
    async function zoomAndPan(page, touch, context) {
      const original = await routeCheck(page);
      const point = await page.evaluate(() => {
        const canvas=document.getElementById('river-map');
        for(const [x,y] of [[innerWidth*.75,innerHeight*.35],[innerWidth*.5,innerHeight*.3],[innerWidth*.25,innerHeight*.3]])if(document.elementFromPoint(x,y)===canvas)return {x,y};
      });
      assert(point, 'An unobstructed map area is available for navigation');
      await page.mouse.move(point.x,point.y);await page.mouse.wheel(0,-180);
      await page.waitForFunction(() => DropPrototype.snapshot().zoom > 1);
      const beforePan = await snapshot(page);
      if (touch) {
        const cdp=await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
        for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+i*8,y:point.y+i*4}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
      } else {
        await page.mouse.down();await page.mouse.move(point.x+60,point.y+30,{steps:6});await page.mouse.up();
      }
      const panned = await snapshot(page);
      assert(Math.hypot(panned.pan[0]-beforePan.pan[0],panned.pan[1]-beforePan.pan[1])>30, 'Dragging pans the map');
      assert.deepEqual(panned.route, original.route, 'Map navigation never selects a new river');
      await page.locator('#reset').click();
      assert.equal((await snapshot(page)).zoom,1);assert.deepEqual((await snapshot(page)).pan,[0,0]);
    }

    for (const viewport of [{width:1366,height:900},{width:390,height:844}]) {
      const current = await context({viewport, hasTouch:true});
      const page = await current.newPage();await page.clock.install();page.setDefaultTimeout(10000);
      await page.goto(base + '/prototypes/folg-drapen.html');await page.waitForFunction(() => window.DropPrototype?.snapshot().ready);
      await pause(page);await page.clock.runFor(40);await layoutCheck(page, viewport);
      const initial = await routeCheck(page);
      assert.deepEqual(initial.dataSummary,{segments:segments.length,basins:basins.size});
      await page.screenshot({path:path.join(out,'drop-ready-'+viewport.width+'.png')});

      const values = await page.locator('#start-point option').evaluateAll(options => options.map(option => option.value).filter(Boolean));
      for(const start of data.starts){
        await page.locator('#start-point').selectOption(String(start.id));await pause(page);
        const selected=await routeCheck(page);assert.equal(selected.selectedSegment,String(start.segment),'Every listed starting place selects its own verified river');
      }
      await page.locator('#start-point').selectOption(values[0]);await page.locator('#start-point').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
      const keyboardValue = await page.locator('#start-point').inputValue();
      assert.notEqual(keyboardValue,values[0],'The start-point picker works from the keyboard');
      assert.equal((await routeCheck(page)).selectedStart,keyboardValue);
      await pause(page);
      const pausedProgress = (await snapshot(page)).progress;await page.clock.runFor(800);
      assert.equal((await snapshot(page)).progress,pausedProgress,'Pause stops the drop while time passes');
      await page.locator('#pause').focus();await page.keyboard.press('Space');await page.clock.runFor(800);
      assert((await snapshot(page)).progress>pausedProgress,'Keyboard playback resumes the drop');
      await pause(page);const journey=await routeCheck(page);
      await page.locator('#replay').click();await pause(page);
      assert((await snapshot(page)).progress<.03,'Replay restarts at the selected river point');
      assert.deepEqual((await snapshot(page)).route,journey.route);

      await clickRiver(page,viewport.width<700);
      await checkDecorativeRiver(page,viewport.width<700);
      await page.locator('#mode-basin').click();assert.equal((await snapshot(page)).mode,'basin');
      assert.equal(await page.locator('#mode-basin').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#mode-flow').getAttribute('aria-pressed'),'false');
      if(!data.basins.some(basin=>basin.rings))assert.match(await page.locator('#mode-basin').textContent(),/sideelv/i,'A river-only model does not claim to show catchment boundaries');
      await routeCheck(page);await page.clock.runFor(40);await page.screenshot({path:path.join(out,'drop-basin-'+viewport.width+'.png')});
      await page.locator('#mode-flow').click();assert.equal((await snapshot(page)).mode,'flow');
      await zoomAndPan(page,viewport.width<700,current);
      await page.locator('#river-map').focus();await page.keyboard.press('+');assert((await snapshot(page)).zoom>1);await page.keyboard.press('ArrowLeft');assert.notDeepEqual((await snapshot(page)).pan,[0,0]);await page.keyboard.press('0');assert.equal((await snapshot(page)).zoom,1);assert.deepEqual((await snapshot(page)).pan,[0,0]);
      if(viewport.width<700){
        const client=await page.context().newCDPSession(page),x=viewport.width/2,y=viewport.height*.25;
        const send=(type,points)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y}))});
        await send('touchStart',[[1,x-30,y],[2,x+30,y]]);
        await send('touchMove',[[1,x,y],[2,x+60,y]]);
        let gesture=await snapshot(page);assert(Math.abs(gesture.zoom-1)<.01,'Two-finger translation keeps the scale');assert(Math.abs(gesture.pan[0]-30)<1,'Two fingers move the map together');
        await send('touchMove',[[1,x-30,y],[2,x+90,y]]);
        // Chromium coalesces native touch moves on compositor frames, outside
        // the page's fake clock. Wait for the actual input state to settle.
        for(let attempt=0;attempt<30;attempt++){gesture=await snapshot(page);if(Math.abs(gesture.zoom-2)<.02)break;await page.waitForTimeout(16);}
        assert(Math.abs(gesture.zoom-2)<.02,'Pinching doubles the map scale');
        await send('touchEnd',[]);await client.detach();await page.locator('#reset').click();
      }

      await page.locator('#speed').selectOption('4');assert.equal((await snapshot(page)).speed,4);
      if((await snapshot(page)).paused)await page.locator('#pause').click();
      await page.clock.runFor(12000);
      const complete = await routeCheck(page);
      assert(complete.completed && complete.paused,'The journey completes and stops at its outlet');
      assert.equal(complete.progress,1);assert.equal(await page.locator('#progress').evaluate(progress=>progress.value),1);
      assert((await page.locator('#status').textContent()).includes(basins.get(complete.basin).outletLabel || 'utløp'),'Completion names the correct outlet');
      const outletLight=await page.evaluate(point=>{
        const canvas=document.getElementById('river-map'),rect=canvas.getBoundingClientRect(),screen=DropPrototype.worldToScreen(point),x=Math.round((screen.x-rect.x)*canvas.width/rect.width),y=Math.round((screen.y-rect.y)*canvas.height/rect.height),pixels=canvas.getContext('2d').getImageData(x-2,y-2,5,5).data;
        return Math.max(...Array.from({length:25},(_,i)=>Math.min(pixels[i*4],pixels[i*4+1],pixels[i*4+2])));
      },byId.get(complete.outlet).points.at(-1));
      assert(outletLight>210,'The visible drop reaches the graph outlet on the canvas');
      await page.screenshot({path:path.join(out,'drop-complete-'+viewport.width+'.png')});
      await page.locator('#rain').click();let raining=await snapshot(page);assert(raining.rain&&!raining.completed&&!raining.paused,'Rain explicitly starts a new animated journey after completion');
      assert.equal(await page.locator('#rain').getAttribute('aria-pressed'),'true');await page.clock.runFor(500);assert((await snapshot(page)).progress>0);await page.screenshot({path:path.join(out,'drop-rain-'+viewport.width+'.png')});
      await pause(page);await page.locator('#rain').click();assert.equal((await snapshot(page)).rain,false,'Rain can be switched off');
      await page.locator('#replay').click();await pause(page);assert.equal((await snapshot(page)).completed,false);
      await layoutCheck(page,viewport);
      report.viewports.push({viewport,presets:data.starts.length,keyboard:true,riverClick:true,pause:true,replay:true,speed:4,basinMode:true,pan:true,zoomReset:true,correctOutlet:complete.outlet});
      await current.close();
    }

    const reduced = await context({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
    const page = await reduced.newPage();await page.clock.install();await page.goto(base+'/prototypes/folg-drapen.html');await page.waitForFunction(()=>window.DropPrototype?.snapshot().ready);
    const still=await routeCheck(page);assert(still.paused && !still.rain,'Reduced motion starts paused with rain disabled');await page.clock.runFor(1500);assert.equal((await snapshot(page)).progress,still.progress,'Reduced motion does not autoplay');
    await page.locator('#pause').focus();await page.keyboard.press('Space');await page.clock.runFor(600);assert((await snapshot(page)).progress>still.progress,'Playback remains an explicit keyboard choice');await pause(page);await layoutCheck(page,{width:390,height:844});await page.screenshot({path:path.join(out,'drop-reduced-motion.png')});
    report.reducedMotion=true;await reduced.close();
    assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);report.success=true;
    console.log(JSON.stringify(report));
  } finally {
    if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
