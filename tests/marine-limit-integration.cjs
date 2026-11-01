/* Geography navigation and host integration for the locally served marine map. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
  try{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  }catch{res.writeHead(404).end();}
});
(async()=>{
  let browser;const errors=[];
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
    for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
      const context=await browser.newContext({viewport,reducedMotion:'reduce'});
      await context.route('**/*',route=>route.request().url().startsWith(base+'/')||/^(data|blob):/.test(route.request().url())?route.continue():route.abort());
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      const menu=page.locator('#sidebar-collapse-toggle');
      await page.goto(base+'/geografi.html#ytre-fagstoff');
      const frameElement=page.locator('#marine-limit-frame');
      assert.equal(await frameElement.getAttribute('src'),null,'inactive marine map is lazy loaded');
      assert.equal(await page.locator('.submenu-item').filter({hasText:/^Marin grense$/}).count(),1,'one direct map choice in Ytre krefter');
      await page.goto(base+'/geografi.html#ytre-marin-grense');
      await frameElement.waitFor();
      await page.waitForFunction(()=>document.body.classList.contains('marine-limit-open'));
      assert.match(await frameElement.getAttribute('src'),/geografi\/marin-grense\.html\?embedded=1/);
      const frame=await (await frameElement.elementHandle()).contentFrame();
      await frame.waitForLoadState('domcontentloaded');
      assert.match(await frame.title(),/Marin grense/i);
      const geometry=await frameElement.boundingBox();
      assert.ok(geometry.height>=viewport.height-2&&geometry.width>0,'the iframe uses the full workspace height');
      await frame.evaluate(()=>{window.__marineHostMessages=[];addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent)window.__marineHostMessages.push(event.data);});});
      await page.evaluate(()=>document.body.classList.add('dark-mode'));
      await frame.waitForFunction(()=>window.__marineHostMessages.some(message=>message.type==='marine-limit-host'&&message.visible&&message.dark));
      await page.evaluate(()=>document.body.classList.remove('dark-mode'));
      await frame.waitForFunction(()=>window.__marineHostMessages.some(message=>message.type==='marine-limit-host'&&message.visible&&!message.dark));
      if(viewport.width<1000){
        assert.equal(await menu.getAttribute('aria-expanded'),'false');
        const stored=await page.evaluate(()=>localStorage.getItem('geoSidebarCollapsed'));
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'),'true');
        assert.equal(await page.locator('.marine-limit-menu-backdrop').isVisible(),true);
        assert.equal(await frameElement.evaluate(frame=>frame.inert),true,'the covered map is not keyboard accessible');
        assert.ok(await page.locator('.submenu-item[tabindex="0"]').count()>0,'mobile menu exposes keyboard controls');
        await menu.focus();await page.keyboard.press('Shift+Tab');
        assert.notEqual(await page.evaluate(()=>document.activeElement.id),'sidebar-collapse-toggle','keyboard focus wraps into the menu');
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'),'false');
        assert.equal(await frameElement.evaluate(frame=>frame.inert),false);
        assert.equal(await page.evaluate(()=>document.activeElement.id),'sidebar-collapse-toggle');
        await menu.click();
        await page.locator('.submenu-item').filter({hasText:/^Marin grense$/}).focus();await page.keyboard.press('Enter');
        assert.equal(await menu.getAttribute('aria-expanded'),'false','selecting a subject closes the overlay');
        assert.equal(await page.evaluate(()=>localStorage.getItem('geoSidebarCollapsed')),stored,'the mobile overlay preserves the desktop collapse preference');
      }
      await page.evaluate(()=>{location.hash='ytre-fagstoff';});
      await page.waitForFunction(()=>!document.body.classList.contains('marine-limit-open'));
      await frame.waitForFunction(()=>window.__marineHostMessages.some(message=>message.type==='marine-limit-host'&&!message.visible));
      assert.equal(await page.locator('.marine-limit-menu-backdrop').isVisible(),false);
      await page.evaluate(()=>{location.hash='ytre-marin-grense';});await frameElement.waitFor();
      await page.waitForFunction(()=>document.body.classList.contains('marine-limit-open'));
      assert.equal(await page.locator('#marine-limit-frame').count(),1,'reopening reuses the map');
      await context.close();
    }
    for(const filename of fs.readdirSync(path.join(root,'geografi')).filter(name=>name.endsWith('.html'))){
      const source=fs.readFileSync(path.join(root,'geografi',filename),'utf8');
      if(source.includes('../geografi.html#ytre-fagstoff'))assert.ok(source.includes('../geografi.html#ytre-marin-grense'),filename+' includes the shared map link');
    }
    assert.deepEqual(errors,[],'navigation has no browser exceptions');
    console.log('PASS marine map integration: Ytre krefter, direct links, lazy loading, full workspace, theme, desktop/mobile navigation and menu keyboard use.');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
