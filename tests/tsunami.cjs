// Browser regression for the eleven-step reconstruction of the supplied tsunami animation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {execFileSync} = require('node:child_process');
const pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const ranges = [[1,1],[2,66],[67,109],[110,118],[119,173],[174,220],[221,342],[343,370],[371,423],[424,622],[623,646]];
let exported = null;
const server = http.createServer((req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  if (pathname === '/__tsunami_export__.html' && exported) {
    res.setHeader('Content-Type',mime['.html']); res.end(exported); return;
  }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');res.end(fs.readFileSync(file));}
  catch {res.writeHead(404).end();}
});

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE || undefined});
  try {
    // Reduced-motion browsing gives deterministic scrubbing without racing the playback clock.
    const context = await browser.newContext({viewport:{width:1366,height:646},reducedMotion:'reduce'});
    const errors=[],missing=[];
    context.on('page',p => {
      p.on('pageerror',e => errors.push(e.message));
      p.on('response',r => {if(r.url().startsWith(base) && r.status()>=400)missing.push(r.url());});
    });
    await context.route('**/*',r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    // Complex reference frames contain many original vector paths. Give slower
    // CI runners enough time to finish SVG layout before the next interaction.
    const page=await context.newPage(); page.setDefaultTimeout(20000);
    const shots=process.env.TSUNAMI_SCREENSHOTS;
    if(shots)fs.mkdirSync(shots,{recursive:true});
    await page.goto(base+'/geografi/tsunami.html');
    const scene=page.locator('#tsunami-scene'),range=page.locator('#progress'),select=page.locator('#stage-select');
    assert.equal(await select.locator('option').count(),11);
    assert.equal(await page.locator('.eyebrow').textContent(),'Slik oppstår en tsunami');
    assert.equal(await page.locator('#playback-speed').count(),0);
    assert.equal(await page.locator('#play,#fullscreen,#back').count(),0,'No pause, fullscreen or geography-back controls');
    assert.equal(await select.inputValue(),'1');
    assert.equal(await range.inputValue(),'0','Initial load starts at the beginning');
    assert.equal(await scene.getAttribute('data-playing'),'false','Reduced motion starts paused');
    assert.equal(await page.locator('#previous').isDisabled(),true);
    const titles=[],captions=[];
    for(let stage=1;stage<=11;stage++) {
      await select.selectOption(String(stage));
      assert.equal(await scene.getAttribute('data-stage'),String(stage));
      assert.equal(await range.inputValue(),'0','Each selected step starts at zero');
      assert.equal(await scene.getAttribute('data-playing'),'false');
      assert.equal(await range.isDisabled(),stage===1,'Only the static world-map step has no seekable interval');
      const title=await page.locator('#stage-title').innerText(),caption=await page.locator('#stage-text').innerText();
      titles.push(title);captions.push(caption);
      assert.ok(title.length>10 && caption.length>50,'Each step has an actual title and explanation');
      assert.ok(await page.locator('#scene-content > *').count()>0,'The original vector scene is present');
      const a=ranges[stage-1];
      if(stage>1)await range.fill('20');
      const first={frame:Number(await scene.getAttribute('data-frame')),drawing:await page.locator('#scene-content').innerHTML()};
      if(stage>1)await range.fill('80');
      const later={frame:Number(await scene.getAttribute('data-frame')),drawing:await page.locator('#scene-content').innerHTML()};
      assert.ok(first.frame>=a[0] && later.frame<=a[1],`Step ${stage}: reference frames remain within this step`);
      if(stage>1) {
        assert.ok(later.frame>first.frame,`Step ${stage}: scrubbing advances the original timeline`);
        assert.notEqual(later.drawing,first.drawing,`Step ${stage}: the artwork changes, not only its caption`);
      }
      if(stage>1)await range.fill('20');
      assert.equal(await page.locator('#scene-content').innerHTML(),first.drawing,`Step ${stage}: seeking backward restores the same geometry`);
      if(stage>1)await range.fill('100');
      assert.equal(await scene.getAttribute('data-playing'),'false','Seeking pauses both the timeline and nested motion');
      if(shots)await page.screenshot({path:path.join(shots,`stage-${stage}.png`)});
      console.log('PASS reference scene, reversible scrubbing and explanation:',stage);
    }
    assert.equal(new Set(titles).size,11,'All eleven step titles are distinct');
    assert.equal(new Set(captions).size,11,'All eleven explanations are distinct');
    assert.match(captions[0],/hovedsakelig fast|fast bergart/i);
    assert.match(captions[2],/9[,.]1/);
    assert.doesNotMatch(captions[2],/Richter/i);
    assert.match(captions[5],/delvis smelting/i);
    assert.match(captions[7],/vannsøylen|vannmassene/i);
    assert.match(captions[8],/ikke alltid|ikke nødvendigvis/i);
    assert.match(captions[9],/grunnere|grunna/i);
    assert.equal(await page.locator('#next').isDisabled(),true);
    await page.locator('#previous').click();assert.equal(await select.inputValue(),'10');
    await page.locator('#next').click();assert.equal(await select.inputValue(),'11');
    await page.goto(base+'/geografi/tsunami.html#trinn-8');
    assert.equal(await select.inputValue(),'8','Deep links open the requested step');
    assert.equal(await range.inputValue(),'0');

    // Step navigation starts motion; seeking pauses every loop for inspection.
    await page.emulateMedia({reducedMotion:'no-preference'});
    const featureSnapshot=async id=>page.locator(`[data-reference-id="${id}"]`).first().evaluate(el=>el.outerHTML);
    await select.selectOption('3');
    assert.equal(await scene.getAttribute('data-playing'),'true');
    await page.waitForFunction(()=>Number(document.querySelector('#tsunami-scene').dataset.frame)>67);
    await page.locator('[data-reference-id="71"]').first().waitFor();
    const moving=await featureSnapshot(71);
    await page.waitForTimeout(160);
    assert.notEqual(await featureSnapshot(71),moving,'The original yellow earthquake-ring movie animates during playback');
    await range.fill('60');
    assert.equal(await scene.getAttribute('data-playing'),'false');
    const paused=await page.locator('#scene-content').innerHTML();
    await page.waitForTimeout(160);
    assert.equal(await page.locator('#scene-content').innerHTML(),paused,'Pause freezes the whole scene');
    await select.selectOption('4');
    await page.waitForFunction(()=>Number(document.querySelector('#tsunami-scene').dataset.frame)===118);
    const plateArrows=await featureSnapshot(80);
    await page.waitForTimeout(200);
    assert.notEqual(await featureSnapshot(80),plateArrows,'Blue plate-direction arrows keep moving after the regional map settles');
    await select.selectOption('6');
    await page.waitForFunction(()=>Number(document.querySelector('#tsunami-scene').dataset.frame)===220);
    const held=await page.locator('#scene-content').innerHTML();
    const loops=new Map();
    for(const [id,name] of [[103,'white subduction arrows'],[107,'rising magma'],[113,'volcanic smoke']])loops.set(id,{name,svg:await featureSnapshot(id)});
    await page.locator('[data-reference-id="103"]').first().evaluate(el=>window.retainedPlateArrows=el);
    await page.waitForTimeout(240);
    assert.equal(Number(await scene.getAttribute('data-frame')),220,'The step holds its final camera position');
    assert.notEqual(await page.locator('#scene-content').innerHTML(),held,'Volcano, magma or plate arrows keep moving on the held step');
    for(const [id,feature] of loops)assert.notEqual(await featureSnapshot(id),feature.svg,feature.name+' retain the original nested animation');
    assert.ok(await page.evaluate(()=>window.retainedPlateArrows.isConnected),'Playback retains existing SVG nodes instead of rebuilding the scene every frame');
    await range.fill('100');
    const heldPaused=await page.locator('#scene-content').innerHTML();
    await page.waitForTimeout(160);
    assert.equal(await page.locator('#scene-content').innerHTML(),heldPaused,'Pause also stops nested sprite loops');
    await page.locator('#replay').click();
    assert.equal(await select.inputValue(),'6','Replay keeps the selected step');
    await page.waitForFunction(()=>Number(document.querySelector('#tsunami-scene').dataset.frame)<220 && document.querySelector('#tsunami-scene').dataset.playing==='true');
    await range.fill('55');
    assert.equal(await scene.getAttribute('data-playing'),'false');
    console.log('PASS autoplay, expanding-ring motion, final-frame loops, pause and replay');

    // A slow frame must skip ahead in source time rather than slow the movie.
    await select.selectOption('10');
    await page.waitForFunction(()=>Number(document.querySelector('#tsunami-scene').dataset.elapsed)>1);
    const clock=await page.evaluate(async()=>{
      const scene=document.querySelector('#tsunami-scene');
      const started=performance.now(),before=Number(scene.dataset.elapsed);
      while(performance.now()-started<450){} // Simulate a busy browser task.
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      return {seconds:(performance.now()-started)/1000,frames:Number(scene.dataset.elapsed)-before};
    });
    assert.ok(clock.frames>=clock.seconds*25*.8 && clock.frames<=clock.seconds*25*1.3,'Playback follows elapsed time after a slow frame '+JSON.stringify(clock));
    await range.fill('50');
    console.log('PASS retained SVG nodes and elapsed-time playback');

    // Keep original-style figure, explanation and three round navigation buttons in view.
    await page.emulateMedia({reducedMotion:'reduce'});
    // Start layout checks from a fresh document. This also clears focus left on
    // the range input by the playback test, which Chromium may keep scrolled
    // into view while the viewport is resized.
    await page.goto(base+'/geografi/tsunami.html');
    for(const viewport of [{width:1366,height:646},{width:1024,height:600},{width:390,height:844},{width:360,height:640},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      for(let stage=1;stage<=11;stage++) {
        await select.selectOption(String(stage));if(stage>1)await range.fill('100');
        const fit=await page.evaluate(()=>{
          const ids=['stage-title','tsunami-scene','stage-text','previous','replay','next','progress','stage-select'];
          return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,boxes:Object.fromEntries(ids.map(id=>[id,document.getElementById(id).getBoundingClientRect().toJSON()]))};
        });
        assert.ok(fit.scrollWidth<=fit.width+1 && fit.scrollHeight<=fit.height+1,'No page scrolling '+JSON.stringify({stage,...fit}));
        for(const [id,r] of Object.entries(fit.boxes)) {
          assert.ok(r.width>0&&r.height>0&&r.left>=-1&&r.top>=-1&&r.right<=fit.width+1&&r.bottom<=fit.height+1,id+' stays visible '+JSON.stringify({stage,viewport,r}));
        }
        assert.ok(fit.boxes['tsunami-scene'].height>=95,'The artwork retains usable height in landscape');
        const artwork=fit.boxes['tsunami-scene'];
        assert.ok(Math.abs(artwork.width/artwork.height-440/251)<.02,'The figure retains the original aspect ratio without internal letterboxing '+JSON.stringify({stage,viewport,artwork}));
      }
      if(shots)await page.screenshot({path:path.join(shots,`viewport-${viewport.width}x${viewport.height}.png`)});
      console.log('PASS eleven steps without page scrolling:',viewport.width,viewport.height);
    }

    // Geography integration loads lazily, pauses hidden playback, and reopens from step one.
    await page.setViewportSize({width:1366,height:646});
    await page.evaluate(()=>localStorage.setItem('geoDarkMode','1'));
    await page.goto(base+'/geografi.html#indre-tsunami');
    const tsunamiMenu=page.locator('.submenu-item').filter({hasText:/^Tsunami$/});
    assert.equal(await tsunamiMenu.count(),1);
    assert.deepEqual(await tsunamiMenu.evaluate(el=>[el.previousElementSibling.previousElementSibling.textContent.trim(),el.previousElementSibling.textContent.trim()]),['Plategrenser','Hotspot-vulkanisme']);
    const model=page.frameLocator('#tsunami-model-frame');
    await model.locator('#stage-select').waitFor();
    assert.equal(await model.locator('#stage-select').inputValue(),'1');
    await page.waitForFunction(()=>document.querySelector('#tsunami-model-frame').contentDocument.documentElement.dataset.theme==='dark');
    assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('dark-mode')),'The parent restores its saved dark preference');
    assert.equal(await model.locator('#play,#fullscreen,#back').count(),0);
    await model.locator('#stage-select').selectOption('8');
    await model.locator('#progress').fill('55');
    const darkAppearance=await model.locator('#stage-text').evaluate(el=>({text:getComputedStyle(el).color,panel:getComputedStyle(el.parentElement).backgroundColor}));
    const themedDrawing=await model.locator('#scene-content').innerHTML();
    await page.evaluate(()=>toggleDarkMode());
    await page.waitForFunction(()=>document.querySelector('#tsunami-model-frame').contentDocument.documentElement.dataset.theme==='light');
    const lightAppearance=await model.locator('#stage-text').evaluate(el=>({text:getComputedStyle(el).color,panel:getComputedStyle(el.parentElement).backgroundColor}));
    assert.notEqual(darkAppearance.text,lightAppearance.text,'Dark mode updates explanation text');
    assert.notEqual(darkAppearance.panel,lightAppearance.panel,'Dark mode updates panel backgrounds');
    assert.equal(await model.locator('#scene-content').innerHTML(),themedDrawing,'The original artwork is unchanged by the UI theme');
    await page.evaluate(()=>toggleDarkMode());
    await page.waitForFunction(()=>document.querySelector('#tsunami-model-frame').contentDocument.documentElement.dataset.theme==='dark');
    await model.locator('body').evaluate(()=>window.postMessage({type:'tsunami-model-host',dark:false,visible:false},location.origin));
    await page.waitForTimeout(60);
    assert.equal(await model.locator('html').getAttribute('data-theme'),'dark','Only the trusted parent window controls the embedded theme');
    for(const viewport of [{width:1366,height:646},{width:390,height:844},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      const fit=await model.locator('#progress').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,artwork:document.querySelector('#tsunami-scene').getBoundingClientRect().toJSON()}));
      assert.ok(fit.bottom<=fit.height+1&&fit.scrollHeight<=fit.height+1&&fit.scrollWidth<=fit.width+1,'Embedded figure fits '+JSON.stringify(viewport));
      assert.ok(Math.abs(fit.artwork.width/fit.artwork.height-440/251)<.02,'The embedded figure retains the original aspect ratio '+JSON.stringify({viewport,...fit}));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'The geography page does not scroll around the embedded model');
      if(shots)await page.screenshot({path:path.join(shots,`embedded-${viewport.width}x${viewport.height}.png`)});
    }
    await model.locator('#replay').click();
    assert.equal(await model.locator('#tsunami-scene').getAttribute('data-playing'),'true');
    await page.evaluate(()=>showContent('indre-fagstoff',document.querySelector('[onclick*="indre-fagstoff"]')));
    await page.waitForFunction(()=>document.querySelector('#tsunami-model-frame').contentDocument.querySelector('#tsunami-scene').dataset.playing==='false');
    await page.evaluate(()=>showContent('indre-tsunami',document.querySelector('[onclick*="indre-tsunami"]')));
    await page.waitForFunction(()=>document.querySelector('#tsunami-model-frame').contentDocument.querySelector('#stage-select').value==='1');
    assert.equal(await model.locator('#progress').inputValue(),'0');
    assert.equal(await model.locator('#tsunami-scene').getAttribute('data-playing'),'false');

    // Removing the model's back link must not strand mobile users. Reuse the
    // page's menu control without changing its saved desktop-collapse setting.
    await page.setViewportSize({width:390,height:844});
    const menuButton=page.locator('#sidebar-collapse-toggle');
    const preference=await page.evaluate(()=>localStorage.getItem('geoSidebarCollapsed'));
    assert.ok(await menuButton.isVisible());
    assert.equal(await page.locator('.sidebar').isVisible(),false);
    await menuButton.click();
    assert.equal(await menuButton.getAttribute('aria-expanded'),'true');
    assert.ok(await page.locator('.sidebar').isVisible());
    assert.equal(await page.evaluate(()=>localStorage.getItem('geoSidebarCollapsed')),preference);
    await page.locator('#dark-mode-toggle').click();
    await page.waitForFunction(()=>document.querySelector('#tsunami-model-frame').contentDocument.documentElement.dataset.theme==='light');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.sidebar').isVisible(),false);
    assert.equal(await menuButton.getAttribute('aria-expanded'),'false');
    await menuButton.click();
    await page.locator('.tsunami-menu-backdrop').click({position:{x:380,y:100}});
    assert.equal(await menuButton.getAttribute('aria-expanded'),'false');
    await page.evaluate(()=>{
      document.body.classList.add('sidebar-collapsed');
      localStorage.setItem('geoSidebarCollapsed','1');
    });
    await menuButton.click();
    assert.ok(await page.locator('.sidebar').isVisible(),'The temporary menu also opens when the desktop sidebar is saved collapsed');
    await page.locator('#dark-mode-toggle').click();
    await page.waitForFunction(()=>document.querySelector('#tsunami-model-frame').contentDocument.documentElement.dataset.theme==='dark');
    await page.locator('.submenu-item[onclick*="indre-fagstoff"]').click();
    await page.waitForFunction(()=>document.querySelector('#indre-fagstoff').classList.contains('active'));
    assert.equal(await page.locator('#indre-fagstoff.active').count(),1);
    assert.equal(await page.evaluate(()=>document.body.classList.contains('tsunami-menu-open')),false);
    assert.equal(await page.evaluate(()=>document.body.classList.contains('sidebar-collapsed')),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('geoSidebarCollapsed')),'1');
    assert.equal(await menuButton.textContent(),'☰');
    assert.equal(await menuButton.getAttribute('aria-label'),'Vis venstremeny');
    assert.equal(await menuButton.getAttribute('aria-expanded'),null);
    console.log('PASS geography entry, parent dark/light mode, mobile menu, embedded viewport fit, hide/pause and reopen/reset');

    // Export remains one document: no reference JSON, stylesheet or player script is fetched.
    const directory=fs.mkdtempSync(path.join(os.tmpdir(),'onlyfag-tsunami-export-'));
    const target=path.join(directory,'Tsunami.html');
    execFileSync(process.execPath,[path.join(root,'scripts/export-tsunami.cjs'),target]);
    exported=fs.readFileSync(target);
    const single=await context.newPage(),requests=[];
    single.on('request',r=>requests.push(r.url()));
    await single.goto(base+'/__tsunami_export__.html');
    assert.equal(await single.locator('script[src],link[rel=stylesheet]').count(),0);
    assert.equal(await single.locator('html').getAttribute('data-theme'),'dark','Standalone export follows the saved geography theme');
    for(let stage=1;stage<=11;stage++) {
      await single.locator('#stage-select').selectOption(String(stage));
      if(stage>1)await single.locator('#progress').fill('75');
      assert.ok(await single.locator('#scene-content > *').count()>0);
    }
    assert.deepEqual(requests,[base+'/__tsunami_export__.html'],'The exported file loads no other resources');
    await single.close();fs.rmSync(directory,{recursive:true,force:true});
    assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
    console.log(JSON.stringify({steps:11,viewports:5,reversible:true,autoplay:true,nestedMotion:true,geographyEntry:true,singleFile:true,errors,missing}));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
