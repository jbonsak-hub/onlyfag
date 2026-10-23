// Exercise Oslo's mixed area/lake/place map, overlaps, navigation and scoring.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const legacyHtml = cp.execFileSync('git',['show','54ead85:geografi/oslo-bydeler.html'],{cwd:root});
const map = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/oslo-bydeler/oslo.json'), 'utf8'));
const legacyMap = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/oslo-bydeler/map.json'), 'utf8'));
assert.equal(legacyMap.states.length,16,'The original sixteen-target map remains available to cached pages');
const additions = ['Fornebu','Lysaker','Bekkestua','Sandvika','Nesodden','Lørenskog','Bogstadvannet','Sognsvann','Maridalsvannet','Nordmarka','Østmarka','Bygdøy'];
const lakes = ['Bogstadvannet','Sognsvann','Maridalsvannet'];
const places = ['Fornebu','Lysaker','Bekkestua','Sandvika'];
const forests = ['Nordmarka','Østmarka'];
assert.equal(map.title, 'Oslo');
assert.equal(map.states.length, 28);
assert.equal(new Set(map.states.map(item => item.n)).size, 28);
for (const name of ['Gamle Oslo','Grünerløkka','Sagene','Frogner','Søndre Nordstrand','Sentrum',...additions]) assert(map.states.some(item => item.n === name), name + ' is present');
assert(!map.states.some(item => item.n === 'Marka'), 'The two named forest areas replace a vague combined Marka target');
for(const name of lakes){const target=map.states.find(item=>item.n===name);assert(target.kind==='lake'||target.kind==='place'&&target.category==='lake'&&target.marker,name+' uses a sourced lake polygon or an honest water-place marker');}
for(const name of [...places,...forests])assert.equal(map.states.find(item=>item.n===name).marker,true,name+' uses an honest place marker rather than a made-up boundary');
const aspect = map.viewBox[2] / map.viewBox[3];
assert(aspect >= .65 && aspect <= 1.55, 'The geographical map extent remains balanced rather than becoming a long narrow strip');
assert(map.boundaries.length && map.context.length && map.water.length, 'Detailed borders, surrounding land and water are included');
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json'};
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  if(url.pathname==='/geografi/oslo-bydeler.html'&&url.searchParams.has('legacy')){response.setHeader('Content-Type',mime['.html']);return response.end(legacyHtml);}
  try { response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); response.end(fs.readFileSync(file)); }
  catch (_) { response.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  const page = await browser.newPage({viewport:{width:1366, height:768}, hasTouch:true});
  const errors = [], missing = [], boards = [], loadedMaps = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if(response.url().startsWith(base)&&response.status()>=400)missing.push(response.url());
    const pathname=new URL(response.url()).pathname;
    if(pathname.includes('/oslo-bydeler/')&&pathname.endsWith('.json'))loadedMaps.push(pathname);
  });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (new URL(url).pathname === '/scores') {
      boards.push(JSON.parse(new URL(url).searchParams.get('config')));
      return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({rows:[]})});
    }
    return url.startsWith(base) || /^(data|blob):/.test(url) ? route.continue() : route.abort();
  });
  const targets = page.locator('#states .state[data-state]');
  const choose = name => targets.evaluateAll((elements, name) => {
    const element = elements.find(element => element.dataset.state === name);
    if (!element) throw Error('Missing Oslo target: ' + name);
    element.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
  }, name);
  const advance = () => page.clock.fastForward(700);
  const clickTarget = async (name, touch=false) => {
    // When Frogner is requested, deliberately click inside its child Bygdøy.
    // A valid parent answer must remain reachable through overlapping shapes.
    const coordinates = map.states.find(state=>state.n===name).c;
    const point = await page.evaluate(({name,coordinates,bygdoy})=>{
      const svg=document.querySelector('#map');
      const target=[...document.querySelectorAll('#states .state[data-state]')].find(el=>el.dataset.state===name);
      const ownShape=target?.matches('path')?target:target?.querySelector('path');
      const c=name==='Frogner'&&ownShape?.isPointInFill(new DOMPoint(...bygdoy))?bygdoy:coordinates;
      const screen=new DOMPoint(...c).matrixTransform(svg.getScreenCTM());
      const viewport=document.querySelector('#mapViewport').getBoundingClientRect();
      return {x:screen.x,y:screen.y,visible:screen.x>=viewport.left&&screen.x<=viewport.right&&screen.y>=viewport.top&&screen.y<=viewport.bottom,hit:!!document.elementFromPoint(screen.x,screen.y)?.closest('[data-state]')};
    },{name,coordinates,bygdoy:map.states.find(state=>state.n==='Bygdøy').c});
    assert(point.visible,name+' has a visible answer point inside the compact map');
    assert(point.hit,name+' has a painted clickable shape/marker at its representative point');
    const before=Number(await page.locator('#completed').textContent());
    if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
    assert.equal(Number(await page.locator('#completed').textContent()),before+1,name+' accepts a real '+(touch?'touch':'mouse')+' answer, including target overlaps');
  };
  const capture = async name => {
    if (!process.env.OSLO_BOROUGH_SCREENSHOTS) return;
    fs.mkdirSync(process.env.OSLO_BOROUGH_SCREENSHOTS, {recursive:true});
    await page.screenshot({path:path.join(process.env.OSLO_BOROUGH_SCREENSHOTS, name + '.png')});
  };
  try {
    await page.clock.install();
    // Serve the actual previously published HTML, with its original hashed
    // JavaScript, against today's files. Cached pages must still load and play
    // their sixteen-target map while new pages use the immutable expanded map.
    await page.goto(base+'/geografi/oslo-bydeler.html?legacy=1');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await targets.count(),16,'Previously published HTML still loads its sixteen-target quiz');
    assert.equal(await page.locator('#total-count').textContent(),' / 16');
    assert(loadedMaps.includes('/assets/geography/oslo-bydeler/map.json'),'The old bundle reads its preserved original map');
    await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
    await choose(await page.locator('#targetName').textContent());
    assert.equal(await page.locator('#completed').textContent(),'1','The cached sixteen-target game still accepts an answer');
    await capture('legacy-sixteen-targets');
    await page.goto(base + '/geografi/kart.html');
    assert.deepEqual(await page.locator('.kart-map-groups section:first-child [data-card]').evaluateAll(elements => elements.map(element => element.dataset.card)), ['europe','asia','northAmerica','southAmerica','africa','oceania','fylker','usa','bydeler','municipalities'], 'Continents precede counties/states, then Oslo and municipalities in DOM and keyboard order');
    const municipalities = await page.locator('[data-card="municipalities"]').boundingBox();
    const entry = page.locator('[data-card="bydeler"]'), box = await entry.boundingBox();
    assert(Math.abs(box.y - municipalities.y) < 1 && box.x < municipalities.x, 'Oslo sits to the left of municipalities');
    assert.equal((await entry.locator('strong').textContent()).trim(),'Oslo','The quiz card has its new short name');
    await capture('map-menu');
    await entry.click();
    await page.waitForURL('**/geografi/oslo-bydeler.html');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await targets.count(), 28);
    assert.equal(await page.locator('#total-count').textContent(), ' / 28');
    assert.equal(await page.locator('.panel-header .brand').textContent(),'Oslo');
    assert.equal(await page.locator('#targetName').textContent(),'Oslo');
    assert(loadedMaps.some(path=>/\/oslo-[a-f0-9]+\.json$/.test(path)),'The expanded quiz loads its own immutable map file');
    assert.equal(await page.locator('#map text').count(), 0, 'Map does not reveal answers');
    assert.equal(await page.locator('#skip').count(), 0);
    assert.match(await page.locator('.borough-reform-note').textContent(), /8.*1\. januar 2028/);
    assert(await page.locator('#statle-top-ten').isVisible());
    await page.locator('#statle-top-ten').click();
    await page.locator('#geo-online-board').waitFor();
    await page.waitForFunction(() => document.querySelector('#geo-online-content')?.textContent.includes('Ingen resultater'));
    assert.equal(boards.at(-1).game, 'bydeler', 'The borough quiz requests its own leaderboard');
    assert.equal(boards.at(-1).variant,'oslo-28','The expanded Oslo map has its own ranking rather than mixing old sixteen-target scores');
    await page.locator('#geo-online-board button').click();
    const checkHierarchy = async () => {
      const styles = await page.evaluate(() => {
        const css = selector => getComputedStyle(document.querySelector(selector));
        const border = css('.municipality-border-line'), context = css('.municipality-context'), land = css('.municipality[data-kind="land"]');
        const river = document.querySelector('.municipality-river');
        const lakes=[...document.querySelectorAll('.municipality[data-kind="lake"]')].map(el=>({fill:getComputedStyle(el).fill,events:getComputedStyle(el).pointerEvents}));
        return {borderWidth:parseFloat(border.strokeWidth), riverWidth:river ? parseFloat(getComputedStyle(river).strokeWidth) : 0, context:context.fill, land:land.fill, lakes, water:css('#mapViewport').backgroundColor, contextPointer:context.pointerEvents, waterPointer:css('#municipality-water').pointerEvents};
      });
      assert(styles.borderWidth >= styles.riverWidth * 2.5, 'Borough boundaries dominate rivers');
      assert.notEqual(styles.context, styles.land, 'Outside land differs from the quiz boroughs');
      assert.notEqual(styles.context, styles.water, 'Outside land differs from water');
      assert.equal(styles.contextPointer, 'none');
      assert.equal(styles.waterPointer, 'none', 'Water cannot steal answer clicks');
      assert.equal(styles.lakes.length,map.states.filter(state=>state.kind==='lake').length,'Every sourced lake polygon is an interactive water target');
      for(const lake of styles.lakes){assert.notEqual(lake.fill,styles.land,'Lake targets retain a distinct water colour before answering');assert.notEqual(lake.events,'none','A named lake remains clickable');}
    };
    await checkHierarchy();
    await capture('boroughs-light');
    const initial = await targets.evaluateAll(elements => Object.fromEntries(elements.map(element => [element.dataset.state, getComputedStyle(element.matches('g')?element.querySelector('.visible'):element).fill])));
    await page.locator('#start').click();
    await page.waitForFunction(() => document.body.dataset.phase === 'playing');
    const slow = new Set(['Fornebu','Bogstadvannet']), seen = new Set();
    for (let i = 0; i < 28; i++) {
      const name = await page.locator('#targetName').textContent();seen.add(name);
      if(slow.has(name))await page.clock.fastForward(6000);
      await clickTarget(name);await advance();
    }
    assert(seen.has('Sentrum'),'Sentrum is included in the full quiz round');
    for(const name of additions)assert(seen.has(name),name+' is asked and answered in the full round');
    assert.equal(seen.size, 28, 'A complete round asks all original and additional Oslo targets');
    assert.equal(await page.locator('body').getAttribute('data-phase'), 'finished');
    assert.equal(await page.locator('#targetName').textContent(), 'Alle stedene er fullført.');
    await page.locator('#repeat-practice-start').click();
    assert.equal(await page.locator('#states .mastered').count(), 26);
    assert.equal(await page.locator('#states .retry-pending').count(),2,'Only the slow place marker and lake return to practice');
    await page.waitForFunction(initial => [...document.querySelectorAll('#states .retry-pending')].every(element => getComputedStyle(element.matches('g')?element.querySelector('.visible'):element).fill === initial[element.dataset.state]), initial);
    const retried=new Set();
    for(let i=0;i<2;i++){const name=await page.locator('#targetName').textContent();assert(slow.has(name));retried.add(name);await choose(name);await advance();}
    assert.deepEqual([...retried].sort(),[...slow].sort(),'Both marker and water targets can be practised using the keyboard');
    assert.equal(await page.locator('#targetName').textContent(), 'Alle er grønne!');
    await page.reload(); await page.locator('#start:enabled').waitFor();
    const beforeZoom = await page.locator('#map').getAttribute('viewBox');
    await page.evaluate(() => ClickMapZoom.zoom(1.5));
    assert.notEqual(await page.locator('#map').getAttribute('viewBox'), beforeZoom);
    await page.evaluate(() => ClickMapZoom.reset());
    await page.locator('.map-theme-toggle:visible').first().click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await checkHierarchy();
    await capture('boroughs-dark');
    await page.reload(); await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'Dark mode persists');
    for (const viewport of [{width:390,height:844}, {width:844,height:390}]) {
      await page.setViewportSize(viewport);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      const mapBox = await page.locator('#mapViewport').boundingBox();
      assert(mapBox.width > 100 && mapBox.height > 100 && mapBox.y + mapBox.height <= viewport.height + 1, 'Map remains usable inside the viewport');
      const header = await page.locator('.panel-header').boundingBox();
      const brand = await page.locator('.panel-header .brand').boundingBox();
      assert(brand.x + brand.width <= header.x + header.width + 1, 'Header fits without clipping');
      // Representative points for all twenty-eight answers remain on screen,
      // even on the narrow mobile map, without requiring a pan before starting.
      const missingPoints=await page.evaluate(states=>{
        const svg=document.querySelector('#map'),box=document.querySelector('#mapViewport').getBoundingClientRect();
        return states.filter(state=>{const p=new DOMPoint(...state.c).matrixTransform(svg.getScreenCTM());return p.x<box.left||p.x>box.right||p.y<box.top||p.y>box.bottom;}).map(state=>state.n);
      },map.states);
      assert.deepEqual(missingPoints,[],'All answer points fit the '+viewport.width+'px map');
      await capture('boroughs-' + viewport.width);
      if(viewport.width===390){
        await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
        const tapped=new Set();
        for(let i=0;i<28;i++){
          const name=await page.locator('#targetName').textContent();
          if(additions.includes(name)){await clickTarget(name,true);tapped.add(name);}else await choose(name);
          await advance();
        }
        assert.deepEqual([...tapped].sort(),[...additions].sort(),'All new areas, lakes and place markers accept real mobile taps');
        assert.equal(await page.locator('body').getAttribute('data-phase'),'finished');
        await page.reload();await page.locator('#start:enabled').waitFor();
      }
    }
    await page.locator('#kart-back').click();
    await page.waitForURL('**/geografi/kart.html');
    assert(await page.locator('#kart-selection').isVisible());
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    console.log('PASS Oslo quiz: 28 areas/lakes/places, real pointer overlap answers, complete round and coloured retry, separate scoreboard, dark mode, compact extent and all12 mobile touch targets');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
