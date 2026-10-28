// Real-browser regression: geology states, reversible narration, playback and viewport fit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try { res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404).end(); }
});
const modes = ['ocean-continent','ocean-ocean','continent-continent','divergent','transform'];
const exampleMaps = {'ocean-continent':['-22,-70','3'],'ocean-ocean':['18,145','5'],'continent-continent':['31,85','5'],divergent:['42,-30','3'],transform:['36.5,-120','6']};
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await pw.chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE || undefined});
  try {
    const context = await browser.newContext({viewport:{width:1366,height:646}});
    const errors = [], missing = [];
    context.on('page', page => { page.on('pageerror', e => errors.push(e.message)); page.on('response', r => {if (r.status() >= 400) missing.push(r.url());}); });
    // No test visits to analytics or other external services.
    await context.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const page = await context.newPage();
    await page.goto(base + '/geografi/plategrenser.html');
    const range = page.locator('#progress');
    assert.equal(await range.inputValue(),'0','First load starts at zero');
    assert.equal(await page.locator('#progress-value').innerText(),'0 %');
    const set = value => range.fill(String(value));
    const feature = name => page.locator(`[data-feature="${name}"]`);
    const shots = process.env.PLATE_SCREENSHOTS;
    if (shots) fs.mkdirSync(shots,{recursive:true});
    for (const mode of modes) {
      await page.locator(`[data-mode="${mode}"]`).click();
      const mapLink=page.locator('#example-map'),mapUrl=new URL(await mapLink.getAttribute('href'));
      assert.equal(mapUrl.origin+mapUrl.pathname,'https://www.google.com/maps/d/viewer');
      assert.equal(mapUrl.searchParams.get('mid'),'105PobuL643Yr0Gh5O478-RHzWksbtCc');
      assert.deepEqual([mapUrl.searchParams.get('ll'),mapUrl.searchParams.get('z')],exampleMaps[mode],mode+': the map opens at the example with its own zoom');
      assert.equal(await mapLink.getAttribute('target'),'_blank');
      assert.match(await mapLink.getAttribute('rel'),/noopener/);
      assert.equal(await range.inputValue(),'0',mode+': every tab starts at zero');
      await set(0);
      const beginning = await page.locator('#stage-explanation').innerText();
      const before = await page.locator('#drawing').innerHTML();
      if (mode.startsWith('ocean-')) {
        await set(28);
        assert.notEqual(await page.locator('#stage-explanation').innerText(), beginning);
        assert.match(await page.locator('#stage-explanation').innerText(), /skjelv/);
      }
      await set(50);
      assert.notEqual(await page.locator('#stage-explanation').innerText(), beginning, mode + ': narration follows the slider forward');
      await set(100);
      assert.notEqual(await page.locator('#drawing').innerHTML(), before, mode + ': geometry changes');
      assert.equal(await page.locator('#progress-value').innerText(), '100 %');
      assert.match(await range.getAttribute('aria-valuetext'), /^100 prosent/);
      if (mode.startsWith('ocean-')) {
        assert.equal(await page.locator('[data-depth="2"]').count(), 2, 'Deep earthquakes occur within a fully developed subducting slab');
        assert.equal(await feature('eruption').count(), 1);
        assert.equal(await feature('magma').getAttribute('opacity'), '1');
        assert.ok(await page.evaluate(()=>{
          const leader=document.querySelector('[data-feature="trench-leader"]'),marker=document.querySelector('.hotspot[data-topic="0"] circle');
          const target=leader.getPointAtLength(leader.getTotalLength()).matrixTransform(leader.getScreenCTM());
          const center=new DOMPoint(0,0).matrixTransform(marker.getScreenCTM());
          return Math.hypot(target.x-center.x,target.y-center.y)>marker.getBoundingClientRect().width/2+5;
        }),'The numbered marker must leave the actual trench unobscured');
        assert.equal(await feature('terrain-surface').count(),1);
        const grownPrism=await feature('accretion-prism').evaluate(el=>el.getBBox().width);
        await set(0);assert.ok(await feature('accretion-prism').evaluate(el=>el.getBBox().width)<grownPrism,'Scraped-off sediment builds a growing prism');await set(100);
        if(mode==='ocean-ocean')assert.equal(await feature('island-arc').count(),1,'An oceanic arc is shown as multiple receding islands');
      } else if (mode === 'continent-continent') {
        assert.equal(await feature('mountains').count(), 1);
        assert.equal(await feature('crustal-melt').count(),1,'Hot thickened crust can partially melt');
        assert.equal(await feature('eruption').count(),0,'Crustal melting is distinct from a surface volcanic arc');
        assert.ok(await page.evaluate(()=>{
          const intrusion=document.querySelector('[data-feature="granite-intrusion"]'),crust=document.querySelector('[data-feature="mountains"]');
          for(let i=0;i<=40;i++){const point=intrusion.getPointAtLength(intrusion.getTotalLength()*i/40);if(!crust.isPointInFill(point))return false;}return true;
        }),'The closed magma intrusion remains entirely inside continental crust');
        await set(0);assert.equal(await feature('crustal-melt').count(),0,'Melting does not occur automatically on first contact');await set(100);
        assert.ok(await page.locator('.earthquake').count());
        const samples=()=>feature('shortening-sample').evaluateAll(els=>els.map(el=>Number(el.getAttribute('x'))));
        const compressed=await samples();await set(0);const original=await samples();
        assert.ok(compressed[1]-compressed[0]<original[1]-original[0],'Rock samples converge as the crust shortens');await set(100);
      } else if (mode === 'divergent') {
        assert.ok(await feature('age-band').count()>0);
        assert.ok(await feature('abyssal-hill').count()>0,'Spreading creates elongated seafloor relief');
        assert.ok(await feature('normal-fault').count()>0);
        assert.equal(await feature('rift-valley').count(),1);
        assert.equal(await feature('new-crust').count(), 1);
        assert.equal(await page.locator('[data-depth="2"]').count(), 0);
        const surfaceHeight=()=>feature('ridge-surface').evaluate(el=>el.getBBox().height);
        const grownHeight=await surfaceHeight();
        await set(0);assert.ok(await surfaceHeight()<grownHeight,'The ridge grows in relief');assert.equal(await feature('age-band').count(),0);
        await set(40);const earlier=await feature('crust-parcel').evaluateAll(els=>els.map(el=>Number(el.getAttribute('cx'))));
        await set(90);const later=await feature('crust-parcel').evaluateAll(els=>els.map(el=>Number(el.getAttribute('cx'))));
        assert.ok(later[0]<earlier[0]&&later[1]>earlier[1],'The same material moves outward on both plates');
        assert.ok(Math.abs((earlier[0]+earlier[1])-(later[0]+later[1]))<.1,'The paired parcels spread symmetrically');
        await set(100);
      } else {
        assert.equal(await page.locator('#view-kind').innerText(), 'Skrått 3D-utsnitt');
        assert.equal(await feature('quake-wave').count(), 3);
        const radii=()=>feature('quake-wave').evaluateAll(els=>els.map(el=>Number(el.getAttribute('rx'))));
        await set(78);const earlyWaves=await radii();
        await set(90);const laterWaves=await radii();
        assert.ok(laterWaves.every((r,i)=>r>earlyWaves[i]),'Seismic wavefronts expand as the model progresses');
        await set(78);assert.deepEqual(await radii(),earlyWaves,'Scrubbing backward rewinds the wavefronts');await set(100);
        assert.notEqual(await feature('transform-left').getAttribute('transform'), 'translate(0 0)');
        assert.equal(await feature('magma').count(), 0);
        assert.equal(await feature('transform-surface').count(),2,'Both plates have a projected land surface');
        for(const name of ['transform-front-face','transform-side-face','transform-relief']) {
          assert.ok(await feature(name).count(),name+': visible depth and terrain are present');
          assert.ok(await feature(name).first().isVisible());
          assert.ok(await feature(name).first().evaluate(el=>el.getBBox().height)>0,name+': geometry has visible relief');
        }
        // Compare displacement along the fault, independently of the viewing angle.
        // The narrow boundary gap has a fixed cross-fault component even at 0%.
        const landmarkOffset = async kind => page.evaluate(kind => {
          const left=document.querySelector(`[data-feature="${kind}-left"]`),right=document.querySelector(`[data-feature="${kind}-right"]`);
          const a=left.getPointAtLength(left.getTotalLength()).matrixTransform(left.getScreenCTM());
          const b=right.getPointAtLength(0).matrixTransform(right.getScreenCTM());
          const fault=document.querySelector('[data-feature="fault"]');
          const start=fault.getPointAtLength(0).matrixTransform(fault.getScreenCTM());
          const end=fault.getPointAtLength(fault.getTotalLength()).matrixTransform(fault.getScreenCTM());
          const length=Math.hypot(end.x-start.x,end.y-start.y);
          const ux=(end.x-start.x)/length,uy=(end.y-start.y)/length;
          return {along:(b.x-a.x)*ux+(b.y-a.y)*uy,across:(b.x-a.x)*-uy+(b.y-a.y)*ux};
        },kind);
        const slipped={road:await landmarkOffset('road'),river:await landmarkOffset('river')};
        await set(0);
        const original={road:await landmarkOffset('road'),river:await landmarkOffset('river')};
        await set(60);
        for(const kind of ['road','river']) {
          const locked=await landmarkOffset(kind);
          assert.ok(Math.abs(locked.along-original[kind].along)<.2,kind+': locked contact stays joined while the far field deforms');
          assert.ok(Math.abs(slipped[kind].along-original[kind].along)>30,kind+': rupture shifts the landmark along the fault');
          assert.ok(Math.abs(locked.across-original[kind].across)<.2,kind+': strain creates no opening across the fault');
          assert.ok(Math.abs(slipped[kind].across-original[kind].across)<.2,kind+': slip creates no opening across the fault');
        }
        await set(100);
      }
      if (shots) { await range.blur(); await page.screenshot({path:path.join(shots,mode+'.png')}); }
      await set(0);
      assert.equal(await page.locator('#stage-explanation').innerText(), beginning, mode + ': narration follows the slider backward');
      if (mode === 'transform') assert.equal(await feature('quake-wave').count(), 0);
      console.log('PASS reversible development and narration:',mode);
    }
    // Reopening a tab always resets it; keyboard tabs and numbered features stay accessible.
    await page.locator('[data-mode="ocean-continent"]').click(); await set(28);
    await page.locator('[data-mode="divergent"]').click(); assert.equal(await range.inputValue(),'0'); await set(63);
    await page.locator('[data-mode="ocean-continent"]').click(); assert.equal(await range.inputValue(),'0');
    await set(43); await page.locator('[data-mode="ocean-continent"]').click(); assert.equal(await range.inputValue(),'0','Clicking the current tab restarts it too');
    await page.locator('[data-mode="ocean-continent"]').press('ArrowRight');
    assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-mode'),'ocean-ocean');
    assert.equal(await page.locator('[role=tab]:focus').getAttribute('data-mode'),'ocean-ocean');
    assert.equal(await range.inputValue(),'0','Keyboard tab switch starts at zero');
    await set(0); await range.press('ArrowRight'); assert.equal(await range.inputValue(),'1');
    await page.locator('.hotspot[data-topic="1"]').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('.hotspot:focus').getAttribute('data-topic'),'1');
    assert.equal(await page.locator('.process-step[aria-pressed=true]').getAttribute('data-topic'),'1');
    await page.locator('#labels-toggle').click(); assert.equal(await page.locator('.diagram-labels').isVisible(),false);
    await page.locator('#labels-toggle').click(); assert.equal(await page.locator('.diagram-labels').isVisible(),true);
    await page.locator('#play').click();
    await page.waitForFunction(()=>Number(document.querySelector('#progress').value)>2);
    await page.locator('#play').click(); const paused=await range.inputValue(); await page.waitForTimeout(150); assert.equal(await range.inputValue(),paused);
    await page.locator('#play').click(); await page.locator('[data-mode="divergent"]').click(); assert.equal(await page.locator('#play').getAttribute('aria-pressed'),'false');
    await page.locator('#reset').click(); assert.equal(await range.inputValue(),'0');
    await set(99); await page.locator('#play').click();
    await page.waitForFunction(()=>document.querySelector('#play').getAttribute('aria-pressed')==='false'); assert.equal(await range.inputValue(),'100');
    console.log('PASS keyboard, narration selection, layer toggle, playback, pause, reset and automatic stop');
    for (const viewport of [{width:1366,height:646},{width:1024,height:600},{width:390,height:844},{width:360,height:640},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      for (const mode of modes) {
        await page.locator(`[data-mode="${mode}"]`).click(); await set(100);
        const fit = await page.evaluate(()=>{
          const r=document.querySelector('#progress').getBoundingClientRect(), s=document.querySelector('#scene').getBoundingClientRect();
          return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,rangeTop:r.top,rangeBottom:r.bottom,sceneHeight:s.height};
        });
        assert.ok(fit.scrollWidth<=fit.width,JSON.stringify({mode,...fit}));
        assert.ok(fit.scrollHeight<=fit.height+1,JSON.stringify({mode,...fit}));
        assert.ok(fit.rangeTop>=0&&fit.rangeBottom<=fit.height,mode+': slider visible');
        assert.ok(fit.sceneHeight>=95,mode+': drawing visible in short landscape view');
      }
      await page.locator('[data-mode="ocean-continent"]').click();
      await range.blur();
      if(shots) await page.screenshot({path:path.join(shots,`viewport-${viewport.width}x${viewport.height}.png`)});
      console.log('PASS all five models without page scrolling:',viewport.width,viewport.height);
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator('.hotspot[data-topic="1"]').click();
    assert.equal(await page.locator('[role=dialog]').isVisible(),true,'A numbered point opens its explanation on mobile');
    assert.equal(await page.locator('.process-step[aria-pressed=true]').getAttribute('data-topic'),'1');
    await page.keyboard.press('Escape');
    await page.locator('#info-toggle').click();
    assert.equal(await page.locator('[role=dialog]').isVisible(),true);
    await page.locator('.process-step[data-topic="3"]').click();
    assert.equal(await page.locator('.process-step[data-topic="3"]').getAttribute('aria-pressed'),'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[role=dialog]').count(),0);
    assert.equal(await page.locator('#info-toggle').evaluate(el=>document.activeElement===el),true);
    await page.locator('#theme').click(); const theme=await page.locator('html').getAttribute('data-theme');
    if(shots)await page.screenshot({path:path.join(shots,'mobile-theme.png')});
    await page.reload(); assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
    assert.equal(await range.inputValue(),'0','Reload starts at zero while retaining theme');
    await page.goto(base+'/geografi/plategrenser.html#transform');
    assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-mode'),'transform');
    assert.equal(await range.inputValue(),'0','Direct model link starts at zero');
    await page.goto(base+'/geografi/plategrenser.html#constructor');
    assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-mode'),'transform','Unknown fragment is ignored during navigation');
    await page.reload();
    assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-mode'),'ocean-continent');
    await page.goto(base+'/geografi.html#indre-fagstoff');
    await page.locator('#indre-fagstoff a[href="#indre-plategrenser"]').click();
    await page.waitForURL('**/geografi.html#indre-plategrenser');
    const model=page.frameLocator('#plate-model-frame');
    await model.locator('#progress').waitFor();
    assert.equal(await model.locator('#progress').inputValue(),'0','Embedded first open starts at zero');
    await model.locator('#progress').fill('55');
    await page.evaluate(()=>applyDarkMode(true));
    await page.waitForFunction(()=>document.querySelector('#plate-model-frame').contentDocument.documentElement.dataset.theme==='dark');
    assert.equal(await model.locator('#progress').inputValue(),'55','A theme change must not restart an open model');
    for(const viewport of [{width:1366,height:646},{width:1024,height:600},{width:390,height:844},{width:844,height:390}]){
      await page.setViewportSize(viewport);
      await model.locator('[data-mode="divergent"]').click();await model.locator('#progress').fill('100');
      const fit=await model.locator('#progress').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
      assert.ok(fit.bottom<=fit.height&&fit.scrollHeight<=fit.height+1&&fit.scrollWidth<=fit.width,'Embedded module fits '+JSON.stringify(viewport));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'No outer page scrolling');
      if(shots)await page.screenshot({path:path.join(shots,`embedded-${viewport.width}x${viewport.height}.png`)});
    }
    await model.locator('#progress').fill('35');await model.locator('#play').click();
    await page.evaluate(()=>showContent('indre-fagstoff',document.querySelector('[onclick*="indre-fagstoff"]')));
    await page.waitForFunction(()=>!document.body.classList.contains('plate-model-open'));
    await page.waitForFunction(()=>document.querySelector('#plate-model-frame').contentDocument.querySelector('#play').getAttribute('aria-pressed')==='false');
    await page.locator('.sidebar .submenu-item').filter({hasText:/^Plategrenser$/}).click();
    await page.waitForURL('**/geografi.html#indre-plategrenser');
    await page.waitForFunction(()=>document.querySelector('#plate-model-frame').contentDocument.querySelector('#progress').value==='0');
    await model.locator('.back').click();
    await page.waitForURL('**/geografi.html#indre-fagstoff');
    assert.equal(await page.locator('#indre-fagstoff.active').count(),1,'Embedded back button returns to geography without nesting the page');
    assert.deepEqual(errors,[]); assert.deepEqual(missing,[]);
    console.log(JSON.stringify({models:5,viewports:5,narrationBothDirections:true,playback:true,mobileDialog:true,themePersistence:true,geographyEntry:true,errors,missing}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
