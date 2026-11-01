/* Real local geology data with Geography navigation, theme and mobile controls.
   Basemap services are blocked here; provider rendering is checked separately. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  try{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
});
const settle=frame=>frame.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
(async()=>{
  let browser;const errors=[],reports=[];
  try{
    assert.ok(fs.existsSync(path.join(root,'assets/geography/geology/data/manifest.json')),'real geology manifest must exist before this integration test');
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
    for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
      const context=await browser.newContext({viewport,reducedMotion:'reduce'});
      await context.route('**/*',route=>route.request().url().startsWith(base+'/')||/^(data|blob):/.test(route.request().url())?route.continue():route.abort());
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      const menu=page.locator('#sidebar-collapse-toggle');
      await page.goto(base+'/geografi.html#indre-fagstoff');
      const frameElement=page.locator('#geology-map-frame');
      assert.equal(await frameElement.getAttribute('src'),null,'inactive geology map is lazy loaded');
      const item=page.locator('.submenu-item').filter({hasText:/^Berggrunn og løsmasser$/});
      assert.equal(await item.count(),1,'one direct map choice under Indre krefter');
      assert.match(await item.locator('..').locator('..').locator('.menu-header').innerText(),/Indre krefter/);
      await page.goto(base+'/geografi.html#indre-geologiske-kart');
      await page.waitForFunction(()=>document.body.classList.contains('geology-map-open'));
      assert.match(await frameElement.getAttribute('src'),/geografi\/geologiske-kart\.html\?embedded=1/);
      assert.equal(await item.locator('..').evaluate(element=>element.classList.contains('open')),true,'the route opens its subject group');
      const frame=await (await frameElement.elementHandle()).contentFrame();
      await frame.waitForFunction(()=>window.geologyMap?.featureCounts?.bedrock>0&&window.geologyMap?.featureCounts?.superficial>0,{},{timeout:90000});
      await frame.waitForFunction(()=>geologyMap.getOverlayState().bedrock.overviewState==='ready',{},{timeout:90000});
      await frame.evaluate(()=>{window.__geologyHostMessages=[];addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent)window.__geologyHostMessages.push(event.data);});});
      await frame.locator('#map-layer').selectOption('local');await settle(frame);
      assert.match(await frame.title(),/Berggrunn og løsmasser/i);
      assert.equal(await frame.locator('.back').isVisible(),false,'embedded map shares the site navigation');
      assert.equal(await frame.locator('#theme').isVisible(),false,'embedded map shares the site theme control');
      const geometry=await frameElement.boundingBox();
      assert.ok(geometry.height>=viewport.height-2&&geometry.width>0,'iframe fills the workspace');
      const sizes=await frame.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,mapHeight:document.getElementById('map').getBoundingClientRect().height}));
      assert.ok(sizes.scrollWidth<=sizes.width+1&&sizes.scrollHeight<=sizes.height+1,JSON.stringify(sizes));
      assert.ok(sizes.mapHeight>viewport.height*.8,'map dominates the available screen');
      const before=await frame.evaluate(()=>geologyMap.getView());
      await frame.locator('#superficial-layer').check();await settle(frame);
      await frame.waitForFunction(()=>geologyMap.getOverlayState().superficial.overviewState==='ready',{},{timeout:90000});
      assert.equal(await frame.locator('#bedrock-layer').isChecked(),true,'checking superficial does not uncheck bedrock');
      assert.equal(await frame.evaluate(()=>Object.values(geologyMap.getOverlayState()).every(layer=>layer.shown)),true,'both real local overlays may be visible together');
      for(const [id,value] of [['bedrock',20],['superficial',80],['background',30]]){
        await frame.locator('#'+id+'-opacity').evaluate((element,value)=>{element.value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));},value);
        assert.equal(await frame.locator('#'+id+'-opacity-value').innerText(),value+' %');
      }
      await settle(frame);assert.deepEqual(await frame.evaluate(()=>geologyMap.getView()),before,'opacity controls preserve the camera');
      await frame.locator('#legend').evaluate(element=>element.open=true);
      assert.equal(await frame.locator('#legend-content h3').count(),2);
      assert.ok(await frame.locator('#legend-content li').count()>1,'real data supplies legend entries');
      assert.equal(await frame.locator('[data-legend-layer]:visible').count(),2,'both checked layers have visible legends');
      await frame.locator('#bedrock-layer').uncheck();
      assert.equal(await frame.locator('[data-legend-layer]:visible h3').first().innerText(),'Løsmasser','the only enabled geology layer is shown first');
      assert.equal(await frame.locator('[data-legend-layer="bedrock"]').isVisible(),false,'unchecked bedrock does not obscure the active superficial legend');
      await frame.locator('#bedrock-layer').check();
      await frame.locator('#legend').evaluate(element=>element.open=false);
      if(viewport.width<720){
        const map=await frame.locator('#map').boundingBox();
        await page.mouse.click(map.x+20,map.y+map.height*.55);await frame.locator('#info:not([hidden])').waitFor();
        await frame.locator('#legend').evaluate(element=>element.open=true);
        await frame.waitForFunction(()=>document.getElementById('info').hidden);
        assert.equal(await frame.locator('#legend').evaluate(element=>element.open),true,'legend replaces point information on a narrow map');
        await page.mouse.click(map.x+20,map.y+map.height*.55);await frame.locator('#info:not([hidden])').waitFor();
        assert.equal(await frame.locator('#legend').evaluate(element=>element.open),false,'point information closes the overlapping legend on a narrow map');
        await frame.locator('#close-info').click();
      }
      await frame.locator('#about').click();await frame.locator('#about-dialog[open]').waitFor();
      assert.match(await frame.locator('#about-dialog').innerText(),/løsmassene øverst/);
      await frame.locator('#close-about').click();
      await page.evaluate(()=>document.body.classList.add('dark-mode'));await frame.locator('body.dark').waitFor();
      await page.evaluate(()=>document.body.classList.remove('dark-mode'));await frame.waitForFunction(()=>!document.body.classList.contains('dark'));
      await frame.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://other.invalid',source:parent,data:{type:'geology-map-host',dark:true,visible:false}})));
      assert.equal(await frame.locator('body').evaluate(element=>element.classList.contains('dark')),false,'host messages require matching origin');
      if(viewport.width<1000){
        assert.equal(await menu.getAttribute('aria-expanded'),'false');
        const stored=await page.evaluate(()=>localStorage.getItem('geoSidebarCollapsed'));
        await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');
        assert.equal(await page.locator('.geology-map-menu-backdrop').isVisible(),true);
        assert.equal(await frameElement.evaluate(element=>element.inert),true,'covered map is not keyboard accessible');
        await menu.focus();await page.keyboard.press('Shift+Tab');
        assert.notEqual(await page.evaluate(()=>document.activeElement.id),'sidebar-collapse-toggle','focus wraps into the subject menu');
        await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
        assert.equal(await frameElement.evaluate(element=>element.inert),false);
        assert.equal(await page.evaluate(()=>document.activeElement.id),'sidebar-collapse-toggle');
        await menu.click();await item.focus();await page.keyboard.press('Enter');
        assert.equal(await menu.getAttribute('aria-expanded'),'false','selecting the subject closes the overlay menu');
        assert.equal(await page.evaluate(()=>localStorage.getItem('geoSidebarCollapsed')),stored,'mobile menu preserves the desktop preference');
      }
      const artifacts='/workspace/artifacts/geology-integration';fs.mkdirSync(artifacts,{recursive:true});
      await page.screenshot({path:path.join(artifacts,viewport.width+'-embedded.png')});
      await page.evaluate(()=>location.hash='indre-fagstoff');
      await page.waitForFunction(()=>!document.body.classList.contains('geology-map-open'));
      await frame.waitForFunction(()=>window.__geologyHostMessages.some(message=>message.type==='geology-map-host'&&!message.visible));
      assert.equal(await page.locator('.geology-map-menu-backdrop').isVisible(),false);
      await page.evaluate(()=>location.hash='ytre-marin-grense');
      await page.waitForFunction(()=>document.body.classList.contains('marine-limit-open'));
      assert.equal(await page.locator('body').evaluate(element=>element.classList.contains('geology-map-open')),false,'the two map layouts do not remain active together');
      if(viewport.width<1000){assert.equal(await menu.getAttribute('aria-expanded'),'false');assert.equal(await menu.innerText(),'☰','marine menu keeps its mobile icon after switching maps');}
      await page.evaluate(()=>location.hash='indre-geologiske-kart');
      await page.waitForFunction(()=>document.body.classList.contains('geology-map-open'));
      if(viewport.width<1000){assert.equal(await menu.getAttribute('aria-expanded'),'false');assert.equal(await menu.innerText(),'☰','geology menu keeps its mobile icon after switching back');}
      assert.equal(await page.locator('#geology-map-frame').count(),1,'reopening reuses the map');
      await frame.waitForFunction(()=>Object.values(geologyMap.getOverlayState()).every(layer=>layer.shown));
      assert.deepEqual(await frame.evaluate(()=>geologyMap.getView()),before,'reopening preserves the camera');
      reports.push({viewport,geometry,sizes,features:await frame.evaluate(()=>geologyMap.featureCounts)});
      await context.close();
    }
    assert.deepEqual(errors,[],'navigation and actual local map engine have no browser exceptions');
    console.log(JSON.stringify(reports));
    console.log('PASS geology integration: actual local data, Indre krefter route, independent layer controls, legend, theme, shared mobile navigation and map switching.');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
