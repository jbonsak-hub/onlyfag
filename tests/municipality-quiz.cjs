// Real-browser coverage for the county chooser and shared municipality game.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/municipalities/index-v2.json'), 'utf8'));
const legacyHtml = cp.execFileSync('git',['show','095d022:geografi/kommuner.html'],{cwd:root});
for(const file of ['index.json','county-03.json'])assert.equal(cp.execFileSync('git',['hash-object','--no-filters','assets/geography/municipalities/'+file],{cwd:root,encoding:'utf8'}).trim(),cp.execFileSync('git',['rev-parse','095d022:assets/geography/municipalities/'+file],{cwd:root,encoding:'utf8'}).trim(),file+' retains its published 54-target bytes');
const osloMap = JSON.parse(fs.readFileSync(path.join(root,'assets/geography/municipalities',index.counties.find(county=>county.code==='03').file),'utf8'));
const osloCount = osloMap.states.length;
assert.equal(osloCount,30,'Oslo and surroundings is a compact thirty-municipality quiz');
const compactNames=['Asker','Aurskog-Høland','Bærum','Drammen','Enebakk','Frogn','Gjerdrum','Hole','Holmestrand','Indre Østfold','Jevnaker','Lier','Lillestrøm','Lunner','Lørenskog','Modum','Moss','Nannestad','Nes','Nesodden','Nittedal','Nordre Follo','Oslo','Rælingen','Skiptvet','Ullensaker','Vestby','Våler','Ås','Øvre Eiker'];
assert.deepEqual(osloMap.states.map(state=>state.n).sort(),compactNames.toSorted(),'The compact map contains the agreed thirty municipalities');
assert.equal(index.counties.find(county=>county.code==='03').variant,'oslo-surroundings-v2');
const counties = new Map(index.counties.map(county => [county.code, county]));
assert.equal(counties.size, 15, 'All current counties are selectable');
assert.equal(index.counties.reduce((sum, county) => sum + county.count, 0), 357, 'The chooser shows the official municipality counts');
assert.equal(counties.get('03').count, 1, 'Oslo is one municipality even though its quiz includes the surrounding area');
for(const county of index.counties){
  const map=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/municipalities',county.file),'utf8'));
  assert(map.boundaries?.length>0,county.name+' has separate inland municipality borders');
  assert(map.context?.length>0,county.name+' includes surrounding land');
}

const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json'};
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try {
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    if(url.pathname==='/geografi/kommuner.html'&&url.searchParams.get('legacy')==='54')return response.end(legacyHtml);
    response.end(fs.readFileSync(file));
  } catch (_) { response.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE});
  const page = await browser.newPage({viewport:{width:1366, height:768},hasTouch:true});
  const errors = [], missing = [], scoringRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) missing.push(response.url()); });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (/\/session(?:\?|$)|\/scores\?|\/publish(?:\?|$)/.test(url)) scoringRequests.push({url,body:route.request().postDataJSON(),legacy:new URL(page.url()).searchParams.get('legacy')==='54'});
    if(new URL(url).pathname==='/scores')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({rows:Array.from({length:10},(_,i)=>({nickname:'Kartspiller '+(i+1),score:3000-i*100,time_ms:60000+i*1000}))})});
    return url.startsWith(base) || /^(data|blob):/.test(url) ? route.continue() : route.abort();
  });
  const targets = page.locator('#states .municipality[data-state]');
  const choose = name => targets.evaluateAll((elements, name) => {
    const element = elements.find(element => element.dataset.state === name);
    if (!element) throw Error('Missing municipality: ' + name);
    element.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true}));
  }, name);
  const nextName = () => page.locator('#targetName').textContent();
  const advance = () => page.clock.fastForward(700);
  const clickMunicipality = async (name,touch=false) => {
    await page.evaluate(()=>ClickMapZoom.reset());
    const inspect=()=>page.evaluate(({name,states})=>{
      const state=states.find(state=>state.n===name),el=[...document.querySelectorAll('#states .municipality[data-state]')].find(el=>el.dataset.state===name),svg=document.querySelector('#map'),matrix=svg.getScreenCTM();
      const point=new DOMPoint(...state.c),screen=point.matrixTransform(matrix),viewport=document.querySelector('#mapViewport').getBoundingClientRect();
      let radius=24;
      for(let a=0;a<16;a++)for(let r=1;r<=radius;r++)if(!el.isPointInFill(new DOMPoint(point.x+Math.cos(a*Math.PI/8)*r/matrix.a,point.y+Math.sin(a*Math.PI/8)*r/matrix.d))){radius=Math.min(radius,r-.5);break;}
      return {x:screen.x,y:screen.y,radius,inside:el.isPointInFill(point),visible:screen.x>=viewport.left&&screen.x<=viewport.right&&screen.y>=viewport.top&&screen.y<=viewport.bottom,hit:document.elementFromPoint(screen.x,screen.y)?.closest('[data-state]')?.dataset.state};
    },{name,states:osloMap.states});
    let point=await inspect();assert(point.inside,name+' has an interior answer point');
    const desired=touch?9:3;if(point.radius<desired){await page.evaluate(({factor,point})=>ClickMapZoom.zoom(factor,point),{factor:Math.min(14,desired/Math.max(.1,point.radius)),point:{x:point.x,y:point.y}});point=await inspect();}
    assert(point.visible,name+' remains visible with zoom');assert.equal(point.hit,name,name+' is directly reachable through decorative water');
    const before=Number(await page.locator('#completed').textContent());if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
    assert.equal(Number(await page.locator('#completed').textContent()),before+1,name+' accepts a real '+(touch?'touch':'mouse')+' answer');
  };
  const capture = async name => {
    if (!process.env.MUNICIPALITY_SCREENSHOTS) return;
    fs.mkdirSync(process.env.MUNICIPALITY_SCREENSHOTS, {recursive:true});
    await page.screenshot({path:path.join(process.env.MUNICIPALITY_SCREENSHOTS, name + '.png')});
  };
  const checkFilledHighscores = async width => {
    const originalTheme=await page.locator('html').getAttribute('data-theme');
    for(const theme of ['light','dark']){
      if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('.map-theme-toggle:visible').first().click();
      await page.locator('#statle-top-ten').click();await page.locator('#geo-online-board tbody tr').nth(9).waitFor();
      assert.equal(await page.locator('#geo-online-board tbody tr').count(),10,'A filled leaderboard shows all ten rows');
      const appearance=await page.locator('#geo-online-board').evaluate(dialog=>{
        const rgba=color=>{const values=color.match(/[\d.]+/g).map(Number);return {rgb:values.slice(0,3),alpha:values.length===4?values[3]:1};};
        const luminance=color=>color.map(value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;}).reduce((sum,value,i)=>sum+value*[.2126,.7152,.0722][i],0);
        return [dialog,dialog.querySelector('table'),...dialog.querySelectorAll('th,td'),dialog.querySelector('.mapwiz-top-ten-close')].map(el=>{const style=getComputedStyle(el),background=rgba(style.backgroundColor),text=rgba(style.color),a=luminance(background.rgb),b=luminance(text.rgb);return {tag:el.tagName,alpha:background.alpha,opacity:Number(style.opacity),contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
      });
      for(const element of appearance){assert.equal(element.alpha,1,theme+' '+element.tag+' background is opaque');assert.equal(element.opacity,1);assert(element.contrast>=4.5,theme+' '+element.tag+' text has readable contrast');}
      const close=page.locator('#geo-online-board .mapwiz-top-ten-close');
      assert(await close.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&(hit===el||el.contains(hit));}),'The leaderboard close button is visible and unobstructed');
      await capture('oslo-highscores-'+theme+'-'+width);await close.click();assert.equal(await page.locator('#geo-online-board').count(),0,'Closing the filled leaderboard returns to the map');
    }
    if(await page.locator('html').getAttribute('data-theme')!==originalTheme)await page.locator('.map-theme-toggle:visible').first().click();
  };
  try {
    await page.clock.install();
    await page.goto(base + '/geografi/kart.html');
    const entry = page.locator('[data-card="municipalities"]');
    const africaBox = await page.locator('[data-card="africa"]').boundingBox();
    const entryBox = await entry.boundingBox();
    assert(entryBox.y >= africaBox.y + africaBox.height, 'The municipality entry is below Africa');
    assert(entryBox.x > africaBox.x, 'The municipality entry occupies the right column beside Oslo');
    assert.equal(new URL(await entry.getAttribute('href'), page.url()).pathname, '/geografi/kommuner.html');
    await capture('map-menu-entry');
    await entry.click();
    await page.waitForURL('**/geografi/kommuner.html');
    await page.locator('#municipality-list [data-county]').last().waitFor();
    assert.equal(await page.locator('#municipality-map [data-county]').count(), 15);
    assert.equal(await page.locator('#municipality-list [data-county]').count(), 15);
    assert.equal(await page.locator('#kart-game').isVisible(), false);
    for (const county of index.counties) {
      const button = page.locator('#municipality-list [data-county="' + county.code + '"]');
      assert.match(await button.textContent(), new RegExp('\\(' + county.quizCount + '\\)'));
      assert.match(await button.textContent(), new RegExp(county.quizTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(await page.locator('#municipality-list [data-county="03"]').textContent(), new RegExp('Oslo og omegn\\s*\\('+osloCount+'\\)'));
    assert.equal(await page.locator('#municipality-map [data-county="03"]').getAttribute('aria-label'), 'Oslo og omegn ('+osloCount+')');
    const mapCounty = page.locator('#municipality-map [data-county="39"]');
    const listCounty = page.locator('#municipality-list [data-county="39"]');
    const original = await mapCounty.evaluate(element => getComputedStyle(element).fill);
    const waitForHighlight = async () => {
      assert(await mapCounty.evaluate(element => element.classList.contains('is-highlighted')), 'The county map receives the shared highlight state');
      assert(await listCounty.evaluate(element => element.classList.contains('is-highlighted')), 'The county list receives the shared highlight state');
      // The game clock controls timers, not the browser's CSS transition paint.
      await page.waitForFunction(original => getComputedStyle(document.querySelector('#municipality-map [data-county="39"]')).fill !== original, original);
    };
    await listCounty.hover();
    await waitForHighlight();
    await listCounty.focus();
    await page.mouse.move(1350, 750);
    await waitForHighlight();
    await listCounty.evaluate(element => element.blur());
    await mapCounty.dispatchEvent('pointerenter');
    assert(await listCounty.evaluate(element => element.classList.contains('is-highlighted')), 'Hovering the map highlights its list entry');
    await capture('county-overview');

    await page.goto(base+'/geografi/kommuner.html?legacy=54&fylke=03');await page.locator('#start:enabled').waitFor();
    assert.equal(await targets.count(),54,'The published cached page still loads its original 54-target map');
    await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');await choose(await nextName());
    assert.equal(await page.locator('#completed').textContent(),'1','A cached 54-target game still accepts answers');await capture('legacy-oslo-54');
    await page.goto(base+'/geografi/kommuner.html');await page.locator('#municipality-list [data-county="39"]').waitFor();

    // Enter from the list, complete a full round, then practise the one slow answer.
    await listCounty.click();
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('body').getAttribute('data-county'), '39');
    assert.equal(new URL(page.url()).searchParams.get('fylke'), '39');
    assert.equal(await targets.count(), counties.get('39').count);
    assert.equal(await page.locator('#map text').count(), 0, 'Municipalities have no answer labels before the game');
    assert.equal(await page.locator('#skip').count(), 0);
    assert.equal(await page.locator('#statle-top-ten').isVisible(), true, 'Each county exposes its own highscore list');
    const initialColors = await targets.evaluateAll(elements => Object.fromEntries(elements.map(element => [element.dataset.state, getComputedStyle(element).fill])));
    assert(Object.values(initialColors).every(color=>color==='rgb(32, 129, 79)'),'Quiz targets retain their green base colour; grey is reserved for surrounding land');
    const water = page.locator('#municipality-water');
    assert(await water.locator('.municipality-lake').count(), 'Lakes remain visible on the county map');
    assert.equal(await water.evaluate(element => getComputedStyle(element).pointerEvents), 'none', 'Water never steals municipal answer clicks');
    assert.match(await water.getAttribute('clip-path'), /url\(#municipality-extent\)/, 'Hydrography is clipped to the visible land');
    assert.equal(await page.locator('.municipality-boundaries').evaluate(element => getComputedStyle(element).pointerEvents), 'none');
    const checkMapHierarchy=async()=>{
      const style=await page.evaluate(()=>{
        const css=selector=>getComputedStyle(document.querySelector(selector));
        const border=css('.municipality-border-line'),river=css('.municipality-river'),context=css('.municipality-context');
        return {border:border.stroke,borderWidth:parseFloat(border.strokeWidth),river:river.stroke,riverWidth:parseFloat(river.strokeWidth),riverOpacity:parseFloat(river.opacity),land:css('.municipality:not([data-band])').fill,context:context.fill,contextPointer:context.pointerEvents,water:css('#mapViewport').backgroundColor};
      });
      const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
      assert(style.borderWidth>=style.riverWidth*2.5,'Municipal boundaries are substantially thicker than rivers');
      assert(contrast(style.border,style.land)>contrast(style.river,style.land)*2,'Municipal borders have much stronger contrast than rivers');
      assert(style.riverOpacity<1,'River lines remain subdued');
      assert.notEqual(style.context,style.water,'Surrounding land differs from water');
      assert.notEqual(style.context,style.land,'Surrounding land differs from the quiz targets');
      assert.equal(style.contextPointer,'none','Surrounding land cannot become an answer');
      const contextVisible=await page.evaluate(()=>{
        const map=document.querySelector('#map'),context=map.querySelector('.municipality-context'),r=map.getBoundingClientRect(),inverse=map.getScreenCTM().inverse();
        for(let y=1;y<20;y++)for(let x=1;x<20;x++)if(context.isPointInFill(new DOMPoint(r.x+r.width*x/20,r.y+r.height*y/20).matrixTransform(inverse)))return true;
        return false;
      });
      assert(contextVisible,'Actual surrounding land is visible inside the map viewport');
    };
    await checkMapHierarchy();
    await capture('municipality-boundaries-light');
    assert.equal(await page.locator('#feedback').textContent(), '');
    await page.locator('#start').click();
    await page.waitForFunction(()=>document.body.dataset.phase==='playing');
    const slow = await nextName();
    await page.clock.fastForward(6000);
    await choose(slow);
    await advance();
    const remaining = await targets.count();
    for (let i = 1; i < remaining; i++) { await choose(await nextName()); await advance(); }
    assert.equal(await page.locator('body').getAttribute('data-phase'), 'finished');
    assert.equal(await page.locator('#feedback').textContent(),'','County completion omits the redundant time/colour summary');
    assert(await page.locator('#repeat-practice-start').isVisible());
    await page.locator('#repeat-practice-start').click();
    assert.equal(await nextName(), slow);
    assert.equal(await page.locator('#states .retry-pending').count(), 1);
    assert.equal(await page.locator('#states .mastered').count(), remaining - 1);
    await page.waitForFunction(initial => [...document.querySelectorAll('#states .retry-pending')].every(element => getComputedStyle(element).fill === initial[element.dataset.state]), initialColors);
    assert.equal(await page.locator('#mistakes').textContent(), '0');
    assert.equal(await page.locator('#feedback').textContent(), '');
    await choose(slow); await advance();
    assert.equal(await page.locator('#repeat-practice').isVisible(), false);
    assert.equal(await page.locator('#targetName').textContent(), 'Alle er grønne!');
    assert.equal(await page.locator('#feedback').textContent(),'','Practice completion keeps its title without the redundant summary');
    await capture('municipalities-complete');
    await page.locator('#kart-back').click();
    assert(await page.locator('#municipality-selection').isVisible());
    assert.equal(await page.locator('#kart-game').isVisible(), false);

    // A map click opens the same county as a list click; direct URLs also work.
    await page.locator('#municipality-map [data-county="31"]').dispatchEvent('click');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('body').getAttribute('data-county'), '31');
    assert.equal(await targets.count(), counties.get('31').count);
    await page.goto(base + '/geografi/kommuner.html?fylke=03');
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('body').getAttribute('data-county'), '03');
    assert((await targets.count()) > 1, 'Oslo opens an actual Oslo-and-surroundings quiz');
    assert.match(await page.locator('#targetName').textContent(), /Oslo.*omegn/i);
    assert(await page.locator('#states [data-state="Oslo"]').count());
    assert.equal(await targets.count(),osloCount);
    for(const name of ['Sør-Odal','Kongsvinger','Ringerike'])assert.equal(await page.locator('#states [data-state="'+name+'"]').count(),0,name+' is outside the compact Oslo-area quiz');
    await checkFilledHighscores(1366);await capture('oslo-compact-light');

    // Real mouse clicks still reach the land through the decorative hydrography.
    await page.locator('#start').click();
    await page.waitForFunction(()=>document.body.dataset.phase==='playing');
    const seen=new Set();
    for(let i=0;i<osloCount;i++){const name=await nextName();seen.add(name);if(name==='Oslo')await page.clock.fastForward(6000);await clickMunicipality(name);await advance();}
    assert.deepEqual([...seen].sort(),compactNames.toSorted(),'Every compact-area municipality accepts a real desktop click');
    assert.equal(await page.locator('body').getAttribute('data-phase'),'finished');
    assert.equal(await page.locator('#feedback').textContent(),'','Oslo completion omits the redundant summary');
    assert(await page.locator('#repeat-practice-start').isVisible(),'The slower Oslo answer still offers practice');
    await page.locator('#repeat-practice-start').click();assert.equal(await nextName(),'Oslo');assert.equal(await page.locator('#states .retry-pending').count(),1);
    await choose('Oslo');await advance();assert.equal(await nextName(),'Alle er grønne!');assert.equal(await page.locator('#feedback').textContent(),'');await capture('oslo-compact-complete');
    await page.reload();await page.locator('#start:enabled').waitFor();
    const beforeZoom = await page.locator('#map').getAttribute('viewBox');
    await page.evaluate(() => ClickMapZoom.zoom(1.5));
    assert.notEqual(await page.locator('#map').getAttribute('viewBox'), beforeZoom);
    await page.evaluate(() => ClickMapZoom.reset());

    await page.locator('.map-theme-toggle:visible').first().click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await checkMapHierarchy();
    assert.notEqual(await page.locator('#mapViewport').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(171, 210, 217)');
    await capture('oslo-dark');
    await page.reload();
    await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'Theme persists through direct county links');
    await page.locator('#kart-back').click();
    for (const viewport of [{width:390,height:844}, {width:844,height:390}]) {
      await page.setViewportSize(viewport);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal chooser overflow');
      await page.locator('#municipality-list [data-county="55"]').click();
      await page.locator('#start:enabled').waitFor();
      assert.equal(await targets.count(), counties.get('55').count);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal game overflow');
      const box = await page.locator('#mapViewport').boundingBox();
      assert(box.width > 100 && box.height > 100 && box.y + box.height <= viewport.height + 1, 'Map stays usable within the viewport');
      await page.locator('#start').click();
      await page.waitForFunction(()=>document.body.dataset.phase==='playing');
      const restart = await page.locator('#restart').boundingBox(), back = await page.locator('#kart-back').boundingBox();
      assert(restart.y + restart.height <= back.y + 1, 'Restart remains above choose-county');
      await capture('municipalities-' + viewport.width);
      await page.locator('#kart-back').click();
      await page.locator('#municipality-list [data-county="03"]').click();await page.locator('#start:enabled').waitFor();assert.equal(await targets.count(),osloCount);
      await checkFilledHighscores(viewport.width);await capture('oslo-compact-'+viewport.width);
      if(viewport.width===390){
        await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');const tapped=new Set();
        for(let i=0;i<osloCount;i++){const name=await nextName();tapped.add(name);await clickMunicipality(name,true);await advance();}
        assert.deepEqual([...tapped].sort(),compactNames.toSorted(),'Every compact-area municipality accepts a real mobile tap');assert.equal(await page.locator('body').getAttribute('data-phase'),'finished');assert.equal(await page.locator('#feedback').textContent(),'','Mobile completion omits the redundant summary');await capture('oslo-compact-mobile-complete');
      }
      await page.locator('#kart-back').click();
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    assert(scoringRequests.length>0,'Municipality rounds use the highscore service');
    for(const request of scoringRequests){
      const url=new URL(request.url),config=url.pathname==='/scores'?JSON.parse(url.searchParams.get('config')):request.body;
      assert.equal(config.game,'kommuner');assert(counties.has(config.county),'Municipality rounds always select their own county leaderboard');
      assert.equal(config.variant,config.county==='03'&&!request.legacy?'oslo-surroundings-v2':undefined,'Only the current Oslo-area quiz selects the new score variant');
    }
    console.log('PASS municipality chooser: 15 counties, 357 municipalities, linked hover/focus, map/list navigation and Oslo surroundings');
    console.log('PASS shared municipality game: compact Oslo30 desktop/mobile full rounds, preserved cached54, empty completion feedback with practice, ten-row opaque highscore dialogs in both themes, hydrography, zoom and mobile controls');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
