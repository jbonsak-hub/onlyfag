// Exercise the tightly cropped Oslo area map, real polygons, legacy pages and scoring.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const historicalMaps = [
  {count:16,commit:'54ead85',file:'map.json',variant:undefined},
  {count:28,commit:'c876d0f',file:'oslo-00fc86a8a4bf.json',variant:'oslo-28'},
  {count:57,commit:'f3ca0f1',file:'oslo-fa9842cf0c7a.json',variant:'oslo-areas-v3'},
  {count:35,commit:'42a7ecf',file:'oslo-8350eadb74db.json',variant:'oslo-areas-v4'}
];
const legacyHtml = new Map(historicalMaps.map(({count,commit})=>[String(count),cp.execFileSync('git',['show',commit+':geografi/oslo-bydeler.html'],{cwd:root})]));
const map = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/oslo-bydeler/oslo.json'), 'utf8'));
for(const {count,file} of historicalMaps){
  const historicalMap=JSON.parse(fs.readFileSync(path.join(root,'assets/geography/oslo-bydeler',file),'utf8'));
  assert.equal(historicalMap.states.length,count,'The published '+count+'-target map remains available to cached pages');
}
const publishedMap = JSON.parse(fs.readFileSync(path.join(root,'assets/geography/oslo-bydeler/oslo-fa9842cf0c7a.json'),'utf8'));
const islands = ['Langøyene','Gressholmen','Lindøya','Malmøya','Ulvøya','Ormøya','Hovedøya','Nakholmen','Bleikøya'];
const additions = ['Nesodden','Lørenskog','Nordre Follo','Nittedal','Lillestrøm','Bogstadvannet','Sognsvann','Maridalsvannet','Lutvann','Nøklevann','Nordmarka','Østmarka','Bygdøy',...islands];
const lakes = ['Bogstadvannet','Sognsvann','Maridalsvannet','Lutvann','Nøklevann'];
const postalAreas = ['Eiksmarka','Jar','Lysaker'];
const westernContextNames = ['Sandvika','Blommenholm','Gjettum','Kolsås'];
const forests = map.states.filter(state => state.kind === 'forest').map(state => state.n);
const total = map.states.length;
assert.equal(map.title, 'Oslo');
assert.equal(map.ruleset,'oslo-areas-v5');
assert.equal(total,43,'The revised map has 43 playable targets');
assert(total>35,'The requested neighbours, lakes and islands expand the published 35-target pool');
assert.equal(new Set(map.states.map(item => item.n)).size,total);
for (const name of ['Gamle Oslo','Grünerløkka','Sagene','Frogner','Søndre Nordstrand','Sentrum',...additions]) assert(map.states.some(item => item.n === name), name + ' is present');
assert(!map.states.some(item => item.n === 'Marka'), 'Named forest areas replace a vague combined Marka target');
for(const state of map.states){assert.equal(typeof state.d,'string');assert(/M.+Z/.test(state.d),state.n+' has a closed area outline');assert(['land','forest','lake'].includes(state.kind),state.n+' is a real area, forest or lake');assert(!state.marker,state.n+' never substitutes a point marker for its area');}
for(const name of lakes)assert.equal(map.states.find(item=>item.n===name).kind,'lake',name+' has an actual lake outline');
for(const name of forests)assert.equal(map.states.find(item=>item.n===name).kind,'forest',name+' has an actual forest outline');
assert.deepEqual(map.states.filter(state=>state.boundaryType==='poststed').map(state=>state.n).sort(),postalAreas.toSorted(),'Only postal areas bordering Ullern or Vestre Aker are quiz targets');
for(const name of postalAreas){const area=map.states.find(state=>state.n===name);assert.equal(area.kind,'land');assert.equal(area.category,'postal-area');}
assert.deepEqual(map.states.filter(state=>state.kind==='lake').map(state=>state.n).sort(),lakes.toSorted(),'Only the five selected lake targets remain');
for(const name of islands)assert.equal(map.states.find(state=>state.n===name).kind,'land',name+' is a real island polygon');
for(const name of [...publishedMap.states.filter(state=>state.boundaryType==='poststed'&&!postalAreas.includes(state.n)).map(state=>state.n),'Østre Bærum','Malmøykalven','Rælingen','Enebakk',...westernContextNames])assert(!map.states.some(state=>state.n===name),name+' is not a separate quiz target');
assert.equal(map.crop.crs,'EPSG:25833');
assert.equal(map.contextCrop.crs,'EPSG:25833');
assert(map.contextCrop.bounds[2]-map.contextCrop.bounds[0]>map.crop.bounds[2]-map.crop.bounds[0],'Physical context extends beyond the playable crop');
assert(map.boundaries.length && map.context.length, 'Quiz borders and surrounding land are included');
assert.deepEqual(map.water,[],'Unselected decorative water is omitted from the map');
const canvasScale = map.viewBox[2]/(map.contextCrop.bounds[2]-map.contextCrop.bounds[0]);
const canvasPoint = ([x,y]) => [map.viewBox[0]+(x-map.contextCrop.bounds[0])*canvasScale,map.viewBox[1]+(map.contextCrop.bounds[3]-y)*canvasScale];
const osloAnchor = canvasPoint([262543.3285,6649176.6709]);
const quietIsland = canvasPoint([257329.237126,6649416.725219]);
const malmoykalven = canvasPoint([261777.349608,6644014.139025]);
assert(Math.hypot(map.camera.center[0]-osloAnchor[0],map.camera.center[1]-osloAnchor[1])<.05,'The camera is anchored at Oslo S');
assert(Math.abs(map.camera.height/canvasScale-27000)<2,'The desktop camera starts with 27 km of vertical context');
assert(map.camera.minWidth/canvasScale>=34251,'The home camera fits the playable east and west extent');
const publishedPoint = name => {
  const state=publishedMap.states.find(state=>state.n===name);
  assert(state,'The published map includes reference geometry for '+name);
  const [oldWest,oldSouth,oldEast,oldNorth]=publishedMap.crop.bounds;
  const projectedX=oldWest+(state.c[0]-publishedMap.viewBox[0])/publishedMap.viewBox[2]*(oldEast-oldWest);
  const projectedY=oldNorth-(state.c[1]-publishedMap.viewBox[1])/publishedMap.viewBox[3]*(oldNorth-oldSouth);
  return canvasPoint([projectedX,projectedY]);
};
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json'};
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  if(url.pathname==='/geografi/oslo-bydeler.html'&&legacyHtml.has(url.searchParams.get('legacy'))){response.setHeader('Content-Type',mime['.html']);return response.end(legacyHtml.get(url.searchParams.get('legacy')));}
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
    await page.evaluate(()=>ClickMapZoom.reset());
    // Frogner remains answerable at an actual overlapping part of Bygdøy.
    const coordinates=name==='Malmøya'&&!touch?malmoykalven:map.states.find(state=>state.n===name).c;
    const inspect=()=>page.evaluate(({name,coordinates,bygdoy})=>{
      const svg=document.querySelector('#map');
      const target=[...document.querySelectorAll('#states path.state[data-state]')].find(el=>el.dataset.state===name);
      const c=name==='Frogner'&&target.isPointInFill(new DOMPoint(...bygdoy))?bygdoy:coordinates;
      const matrix=svg.getScreenCTM(),screen=new DOMPoint(...c).matrixTransform(matrix);
      const viewport=document.querySelector('#mapViewport').getBoundingClientRect();
      // Estimate the actual filled radius, not the bounding box of a thin or
      // concave area. Small areas can use the same zoom control as a learner.
      let radius=24;
      for(let a=0;a<16;a++)for(let r=1;r<=radius;r++){
        const x=c[0]+Math.cos(a*Math.PI/8)*r/matrix.a,y=c[1]+Math.sin(a*Math.PI/8)*r/matrix.d;
        if(!target.isPointInFill(new DOMPoint(x,y))){radius=Math.min(radius,r-.5);break;}
      }
      return {x:screen.x,y:screen.y,radius,inside:target.isPointInFill(new DOMPoint(...c)),visible:screen.x>=viewport.left&&screen.x<=viewport.right&&screen.y>=viewport.top&&screen.y<=viewport.bottom,hit:!!document.elementFromPoint(screen.x,screen.y)?.closest('[data-state]')};
    },{name,coordinates,bygdoy:map.states.find(state=>state.n==='Bygdøy').c});
    let point=await inspect();
    assert(point.inside,name+' has an answer point inside its real polygon');
    const desired=touch?9:3;
    if(point.radius<desired){
      await page.evaluate(({factor,point})=>ClickMapZoom.zoom(factor,point),{factor:Math.min(14,desired/Math.max(.1,point.radius)),point:{x:point.x,y:point.y}});
      point=await inspect();
    }
    assert(point.visible,name+' stays visible when zooming to its real area');
    assert(point.hit,name+' has a painted polygon beneath the pointer');
    assert(point.radius>=(touch?2:1),name+' remains usable as an area at the supported zoom');
    const before=Number(await page.locator('#completed').textContent());
    if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
    assert.equal(Number(await page.locator('#completed').textContent()),before+1,name+' accepts a real '+(touch?'touch':'mouse')+' answer through the actual polygon');
  };
  const capture = async name => {
    if (!process.env.OSLO_BOROUGH_SCREENSHOTS) return;
    fs.mkdirSync(process.env.OSLO_BOROUGH_SCREENSHOTS, {recursive:true});
    await page.screenshot({path:path.join(process.env.OSLO_BOROUGH_SCREENSHOTS, name + '.png')});
  };
  try {
    await page.clock.install();
    // All previously published pages keep their own original code and map.
    // Serving them against today's files reproduces a real cached-HTML visit.
    for(const {count,variant,file} of historicalMaps){
      await page.goto(base+'/geografi/oslo-bydeler.html?legacy='+count);
      await page.locator('#start:enabled').waitFor();
      assert.equal(await targets.count(),count,'The previously published '+count+'-target page still loads');
      assert.equal(await page.locator('#total-count').textContent(),' / '+count);
      await page.locator('#statle-top-ten').click();
      await page.waitForFunction(()=>document.querySelector('#geo-online-content')?.textContent.includes('Ingen resultater'));
      assert.equal(boards.at(-1).game,'bydeler');
      assert.equal(boards.at(-1).variant,variant,'The cached '+count+'-target page retains its original score variant');
      await page.locator('#geo-online-board button').click();
      await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
      await choose(await page.locator('#targetName').textContent());
      assert.equal(await page.locator('#completed').textContent(),'1','The cached '+count+'-target game still accepts an answer');
      await capture('legacy-'+count+'-targets');
      assert(loadedMaps.includes('/assets/geography/oslo-bydeler/'+file),'The cached '+count+'-target page loads its preserved map');
    }
    assert(loadedMaps.includes('/assets/geography/oslo-bydeler/map.json'),'The old sixteen-target bundle reads its preserved map');
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
    assert.equal(await targets.count(),total);
    assert.equal(await page.locator('#states path.state[data-state]').count(),total,'Every current target is rendered as an actual polygon');
    assert.equal(await page.locator('#states circle,#states .map-place').count(),0,'The current quiz contains no point markers');
    assert.equal(await page.locator('#total-count').textContent(),' / '+total);
    assert.equal(await page.locator('.panel-header .brand').textContent(),'Oslo');
    assert.equal(await page.locator('#targetName').textContent(),'Oslo');
    assert(await page.locator('.oslo-map-credit').isVisible(),'OSM attribution is visible on the map');
    assert(loadedMaps.some(path=>/\/oslo-[a-f0-9]+\.json$/.test(path)),'The expanded quiz loads its own immutable map file');
    assert.equal(await page.locator('#map text').count(), 0, 'Map does not reveal answers');
    assert.equal(await page.locator('#skip').count(), 0);
    assert.match(await page.locator('.borough-reform-note').textContent(), /8.*1\. januar 2028/);
    assert(await page.locator('#statle-top-ten').isVisible());
    await page.locator('#statle-top-ten').click();
    await page.locator('#geo-online-board').waitFor();
    await page.waitForFunction(() => document.querySelector('#geo-online-content')?.textContent.includes('Ingen resultater'));
    assert.equal(boards.at(-1).game, 'bydeler', 'The borough quiz requests its own leaderboard');
    assert.equal(boards.at(-1).variant,'oslo-areas-v5','The current map has a separate ranking from every previous edition');
    await page.locator('#geo-online-board button').click();
    await capture('boroughs-current-desktop');
    const checkHierarchy = async () => {
      const styles = await page.evaluate(() => {
        const css = selector => getComputedStyle(document.querySelector(selector));
        const border = css('.municipality-border-line'), context = css('.municipality-context'), land = css('.municipality[data-kind="land"]');
        const river = document.querySelector('.municipality-river');
        const lakes=[...document.querySelectorAll('.municipality[data-kind="lake"]')].map(el=>({fill:getComputedStyle(el).fill,events:getComputedStyle(el).pointerEvents}));
        const forests=[...document.querySelectorAll('.municipality[data-kind="forest"]')].map(el=>({fill:getComputedStyle(el).fill,events:getComputedStyle(el).pointerEvents}));
        return {borderWidth:parseFloat(border.strokeWidth), riverWidth:river ? parseFloat(getComputedStyle(river).strokeWidth) : 0, context:context.fill, land:land.fill, lakes, forests, water:css('#mapViewport').backgroundColor, contextPointer:context.pointerEvents, waterPointer:css('#municipality-water').pointerEvents};
      });
      assert(styles.borderWidth >= styles.riverWidth * 2.5, 'Borough boundaries dominate rivers');
      assert.notEqual(styles.context, styles.land, 'Outside land differs from the quiz boroughs');
      assert.notEqual(styles.context, styles.water, 'Outside land differs from water');
      assert.equal(styles.contextPointer, 'none');
      assert.equal(styles.waterPointer, 'none', 'Water cannot steal answer clicks');
      assert.equal(await page.locator('#municipality-water path').count(),0,'No decorative water paths are drawn');
      assert.equal(styles.lakes.length,map.states.filter(state=>state.kind==='lake').length,'Every sourced lake polygon is an interactive water target');
      for(const lake of styles.lakes){assert.notEqual(lake.fill,styles.land,'Lake targets retain a distinct water colour before answering');assert.notEqual(lake.events,'none','A named lake remains clickable');}
      const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
      assert.equal(styles.forests.length,map.states.filter(state=>state.kind==='forest').length);
      for(const forest of styles.forests){assert(contrast(forest.fill,styles.land)>1.1,'Forest areas differ visibly from neighbouring quiz land');assert.notEqual(forest.fill,styles.context,'A forest target differs from outside land');assert.notEqual(forest.events,'none');}
      for(const name of forests){
        const forest=page.locator('#states path.state[data-state="'+name+'"]');
        const before=await forest.evaluate(el=>getComputedStyle(el).filter);
        const point=await page.evaluate(c=>{const p=new DOMPoint(...c).matrixTransform(document.querySelector('#map').getScreenCTM());return {x:p.x,y:p.y};},map.states.find(state=>state.n===name).c);
        await page.mouse.move(point.x,point.y);
        await page.waitForFunction(({name,before})=>{const el=[...document.querySelectorAll('#states path.state[data-state]')].find(el=>el.dataset.state===name);return getComputedStyle(el).filter!==before;},{name,before});
        await page.mouse.move(20,20);
      }
    };
    const easternContextPoint=await page.evaluate(()=>{
      const svg=document.querySelector('#map'),matrix=svg.getScreenCTM().inverse(),box=document.querySelector('#mapViewport').getBoundingClientRect();
      const region=[...document.querySelectorAll('.oslo-context-region')].find(el=>el.querySelector('title')?.textContent==='Øvrig Akershus');
      const targets=[...document.querySelectorAll('#states path.state[data-state]')];
      for(const x of [.96,.9,.8,.7])for(const y of [.15,.3,.5,.7,.85]){
        const p=new DOMPoint(box.x+box.width*x,box.y+box.height*y).matrixTransform(matrix);
        if(region.isPointInFill(p)&&targets.every(el=>!el.isPointInFill(p)))return [p.x,p.y];
      }
      throw Error('No visible eastern Akershus background outside the quiz polygons');
    });
    const contextSamples=[...westernContextNames.map(name=>({name,label:'Øvrig Bærum',point:publishedPoint(name)})),{name:'eastern Akershus',label:'Øvrig Akershus',point:easternContextPoint}];
    const checkContextAreas = async () => {
      const result=await page.evaluate(({samples,quietIsland,malmoykalven})=>{
        const contexts=[...document.querySelectorAll('.municipality-context')];
        const targetPaths=[...document.querySelectorAll('#states path.state[data-state]')];
        const contains=(el,point)=>el.isPointInFill(new DOMPoint(...point));
        const inspect=(name,point)=>{
          const context=contexts.filter(el=>contains(el,point));
          const screen=new DOMPoint(...point).matrixTransform(document.querySelector('#map').getScreenCTM());
          return {name,targets:targetPaths.filter(el=>contains(el,point)).map(el=>el.dataset.state),fills:context.map(el=>getComputedStyle(el).fill),titles:context.map(el=>el.querySelector('title')?.textContent).filter(Boolean),screen:{x:screen.x,y:screen.y}};
        };
        return {
          samples:samples.map(({name,point})=>inspect(name,point)),
          quietIsland:inspect('unnamed island',quietIsland),
          malmoykalven:inspect('Malmøykalven',malmoykalven),
          selectableContexts:contexts.filter(el=>el.hasAttribute('data-state')||el.getAttribute('role')==='button'||el.hasAttribute('tabindex')).length,
          dark:document.documentElement.dataset.theme==='dark'
        };
      },{samples:contextSamples,quietIsland,malmoykalven});
      assert.equal(result.selectableContexts,0,'Context is never a keyboard or quiz target');
      for(const [i,area] of result.samples.entries()){
        assert.deepEqual(area.targets,[],area.name+' is background rather than a mainland quiz target');
        assert(area.titles.includes(contextSamples[i].label),area.name+' has its truthful regional hover label');
        if(!result.dark)assert(area.fills.every(fill=>fill==='rgb(255, 255, 255)'),area.name+' is white background');
        await page.mouse.move(area.screen.x,area.screen.y);
        const hovered=await page.evaluate(({x,y})=>{const el=document.elementFromPoint(x,y)?.closest('.oslo-context-region');return {title:el?.querySelector('title')?.textContent,target:document.elementFromPoint(x,y)?.closest('[data-state]')?.dataset.state};},area.screen);
        assert.equal(hovered.title,contextSamples[i].label,'The real pointer reaches the native context title');
        assert.equal(hovered.target,undefined);
      }
      assert.deepEqual(result.quietIsland.targets,[],'An unnamed island belongs to no mainland or island answer');
      assert.deepEqual(result.quietIsland.titles,[],'An unnamed island belongs to no labelled context region');
      assert(result.quietIsland.fills.length>0,'The unnamed island remains visible as land');
      if(!result.dark)assert(result.quietIsland.fills.every(fill=>fill==='rgb(255, 255, 255)'),'The unnamed island is white background');
      assert.deepEqual(result.malmoykalven.targets,['Malmøya'],'Malmøykalven belongs to Malmøya and no mainland answer');
      await page.mouse.move(20,20);
    };
    const checkCamera = async () => {
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const view=await page.evaluate(anchor=>{
        const svg=document.querySelector('#map'),matrix=svg.getScreenCTM(),box=document.querySelector('#mapViewport').getBoundingClientRect(),v=svg.viewBox.baseVal;
        const p=new DOMPoint(...anchor).matrixTransform(matrix),start=new DOMPoint(v.x,v.y).matrixTransform(matrix),end=new DOMPoint(v.x+v.width,v.y+v.height).matrixTransform(matrix);
        return {centerError:[p.x-box.x-box.width/2,p.y-box.y-box.height/2],scaleX:Math.hypot(matrix.a,matrix.b),scaleY:Math.hypot(matrix.c,matrix.d),edges:[start.x-box.left,start.y-box.top,end.x-box.right,end.y-box.bottom],panelWidth:document.querySelector('.game-panel').getBoundingClientRect().width};
      },osloAnchor);
      assert(view.centerError.every(error=>Math.abs(error)<1),'Oslo S stays at the visible map centre: '+JSON.stringify(view.centerError));
      assert(Math.abs(view.scaleX/view.scaleY-1)<.001,'Map projection keeps the same scale on both axes');
      assert(view.edges.every(gap=>Math.abs(gap)<1),'Physical map fills the available width and height without letterboxing: '+JSON.stringify(view.edges));
      return view;
    };
    const checkPanelCamera = async () => {
      const handle=page.getByRole('separator',{name:'Bredde på spillpanelet'});
      await handle.focus();await page.keyboard.press('Home');
      const before=await checkCamera(),box=await handle.boundingBox();
      await page.mouse.move(box.x+box.width/2,100);await page.mouse.down();await page.mouse.move(box.x+box.width/2+160,100,{steps:8});await page.mouse.up();
      await page.waitForFunction(width=>Math.abs(document.querySelector('.game-panel').getBoundingClientRect().width-width-160)<2,before.panelWidth);
      await checkCamera();await capture('boroughs-panel-wide');
      await handle.focus();await page.keyboard.press('Home');
      await page.waitForFunction(width=>Math.abs(document.querySelector('.game-panel').getBoundingClientRect().width-width)<2,before.panelWidth);
      await checkCamera();
    };
    await checkHierarchy();
    await checkContextAreas();
    await checkPanelCamera();
    await capture('boroughs-light');
    const initial = await targets.evaluateAll(elements => Object.fromEntries(elements.map(element => [element.dataset.state, getComputedStyle(element).fill])));
    await page.locator('#start').click();
    await page.waitForFunction(() => document.body.dataset.phase === 'playing');
    const backgroundBefore=await page.locator('#completed,#mistakes').allTextContents();
    for(const point of [contextSamples[0].point,contextSamples.at(-1).point,quietIsland]){
      const screen=await page.evaluate(point=>{const p=new DOMPoint(...point).matrixTransform(document.querySelector('#map').getScreenCTM());return {x:p.x,y:p.y};},point);
      await page.mouse.click(screen.x,screen.y);
      assert.deepEqual(await page.locator('#completed,#mistakes').allTextContents(),backgroundBefore,'Background clicks never answer a question or add a mistake');
    }
    const slow = new Set(['Jar','Bogstadvannet']), seen = new Set();
    for (let i = 0; i < total; i++) {
      const name = await page.locator('#targetName').textContent();seen.add(name);
      if(postalAreas.includes(name))assert.equal(await page.locator('#targetVerb').textContent(),'Postområde · klikk på','The bordering Bærum polygons use the truthful postal-area prompt');
      if(slow.has(name))await page.clock.fastForward(6000);
      await clickTarget(name);await advance();
    }
    assert(seen.has('Sentrum'),'Sentrum is included in the full quiz round');
    for(const name of additions)assert(seen.has(name),name+' is asked and answered in the full round');
    assert.equal(seen.size,total,'A complete round asks every real area in the cropped map');
    assert.equal(await page.locator('body').getAttribute('data-phase'), 'finished');
    assert.equal(await page.locator('#targetName').textContent(), 'Alle stedene er fullført.');
    await page.locator('#repeat-practice-start').click();
    assert.equal(await page.locator('#states .mastered').count(),total-2);
    assert.equal(await page.locator('#states .retry-pending').count(),2,'Only the slow postal area and lake return to practice');
    await page.waitForFunction(initial => [...document.querySelectorAll('#states .retry-pending')].every(element => getComputedStyle(element).fill === initial[element.dataset.state]), initial);
    const retried=new Set();
    for(let i=0;i<2;i++){const name=await page.locator('#targetName').textContent();assert(slow.has(name));retried.add(name);await choose(name);await advance();}
    assert.deepEqual([...retried].sort(),[...slow].sort(),'Both land and water areas can be practised using the keyboard');
    assert.equal(await page.locator('#targetName').textContent(), 'Alle er grønne!');
    await page.reload(); await page.locator('#start:enabled').waitFor();
    const beforeZoom = await page.locator('#map').getAttribute('viewBox');
    await page.evaluate(() => ClickMapZoom.zoom(1.5));
    assert.notEqual(await page.locator('#map').getAttribute('viewBox'), beforeZoom);
    await page.evaluate(() => ClickMapZoom.reset());
    await page.locator('.map-theme-toggle:visible').first().click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await checkHierarchy();
    await checkContextAreas();
    await checkCamera();
    await capture('boroughs-dark');
    await page.reload(); await page.locator('#start:enabled').waitFor();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'Dark mode persists');
    await page.evaluate(()=>localStorage.setItem('onlyfag-geo-language','en'));
    await page.reload();await page.locator('#start:enabled').waitFor();
    await page.waitForFunction(()=>window.QuizLanguage?.language==='en');
    for (const viewport of [{width:390,height:844}, {width:844,height:390}]) {
      await page.setViewportSize(viewport);
      await page.evaluate(()=>ClickMapZoom.reset());
      await checkCamera();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
      const mapBox = await page.locator('#mapViewport').boundingBox();
      assert(mapBox.width > 100 && mapBox.height > 100 && mapBox.y + mapBox.height <= viewport.height + 1, 'Map remains usable inside the viewport');
      const credit = page.locator('.oslo-map-credit');
      assert(await credit.isVisible(),'OSM attribution remains visible on mobile');
      const creditBox = await credit.boundingBox();
      assert(creditBox.x>=mapBox.x&&creditBox.x+creditBox.width<=mapBox.x+mapBox.width&&creditBox.y>=mapBox.y&&creditBox.y+creditBox.height<=mapBox.y+mapBox.height,'Attribution stays inside the visible map');
      const header = await page.locator('.panel-header').boundingBox();
      const brand = await page.locator('.panel-header .brand').boundingBox();
      assert(brand.x + brand.width <= header.x + header.width + 1, 'Header fits without clipping');
      // Representative points for all clipped areas remain on screen,
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
        for(let i=0;i<total;i++){
          const name=await page.evaluate(states=>{
            const shown=document.querySelector('#targetName').textContent;
            const state=states.find(state=>shown===state.n||shown===QuizLanguage.translate(state.n));
            if(!state)throw Error('Unknown English map target: '+shown);
            return state.n;
          },map.states);
          if(postalAreas.includes(name))assert.equal(await page.locator('#targetVerb').textContent(),'Postal area · click on','The English prompt identifies the real postal areas');
          await clickTarget(name,true);tapped.add(name);
          await advance();
        }
        assert.deepEqual([...tapped].sort(),map.states.map(state=>state.n).sort(),'Every real area, forest and lake accepts mobile taps with zoom as needed');
        assert.equal(await page.locator('body').getAttribute('data-phase'),'finished');
        await page.reload();await page.locator('#start:enabled').waitFor();
      }
    }
    await page.locator('#kart-back').click();
    await page.waitForURL('**/geografi/kart.html');
    assert(await page.locator('#kart-selection').isVisible());
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    console.log('PASS revised Oslo quiz: '+total+' real polygons, nine island targets including Malmøykalven in Malmøya, quiet islands and labelled white context, stable centred camera through panel drag, cached16/28/57/35 pages, actual mouse/touch answers, separate v5 scores and dark mode');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
