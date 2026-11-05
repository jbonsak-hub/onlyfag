/* Exercise contrast and state regression; all requests stay on the local server. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const output=process.env.DARK_QA_DIR||'/workspace/artifacts/naturfag-dark-mode';
fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
 catch{res.writeHead(404).end();}
});

function contrastAudit(){
 const cache=new Map(),canvas=document.createElement('canvas');canvas.width=canvas.height=1;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 function color(value){
  if(cache.has(value))return cache.get(value);
  ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);
  const bytes=[...ctx.getImageData(0,0,1,1).data],rgba=[...bytes.slice(0,3),bytes[3]/255];cache.set(value,rgba);return rgba;
 }
 const composite=(top,bottom)=>[...top.slice(0,3).map((n,i)=>n*top[3]+bottom[i]*(1-top[3])),1];
 const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const failures=[],seen=new Set();
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 for(let text=walker.nextNode();text;text=walker.nextNode()){
  const label=text.textContent.trim(),el=text.parentElement;
  if(!label||!el||el.closest('svg,script,style,noscript,.sr-only,.skip,button:disabled,[inert],[aria-hidden="true"]'))continue;
  const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
  if(!el.getClientRects().length||rect.width<1||rect.height<1||style.visibility!=='visible')continue;
  const ancestors=[];let opacity=1;
  for(let node=el;node;node=node.parentElement){ancestors.unshift(node);opacity*=Number(getComputedStyle(node).opacity);}
  if(opacity<.05)continue;
  let bg=[255,255,255,1];
  for(const node of ancestors){
   const surface=getComputedStyle(node);bg=composite(color(surface.backgroundColor),bg);
   const stops=surface.backgroundImage.match(/rgba?\([^)]*\)/g);
   if(stops?.length){
    const colors=stops.map(color),average=colors[0].map((_,i)=>colors.reduce((sum,c)=>sum+c[i],0)/colors.length);
    bg=composite(average,bg);
   }
  }
  const fg=[...color(style.color)];fg[3]*=opacity;
  const actual=ratio(composite(fg,bg),bg),size=parseFloat(style.fontSize),large=size>=24||size>=18.66&&Number(style.fontWeight)>=700;
  const minimum=large?3:4.5;
  if(actual+.02<minimum){
   const key=[el.tagName,el.className,style.color,bg.join(','),minimum].join('|');
   if(!seen.has(key)){seen.add(key);failures.push({text:label.slice(0,100),selector:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.trim().replace(/\s+/g,'.'):''),ratio:+actual.toFixed(2),minimum,foreground:style.color,background:bg.slice(0,3).map(Math.round)});}
  }
 }
 return failures;
}

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,failures=[],errors=[],metrics=[];
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
 try{
  const add=async(target,scope)=>{const rows=await target.evaluate(contrastAudit);for(const row of rows)failures.push({scope,...row});};
  const viewports=process.env.DARK_QA_FAST?[[1366,768,true]]:[[1366,768,true],[390,844,true],[1366,768,false]];
  for(const [width,height,dark] of viewports){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   await context.addInitScript(dark=>localStorage.setItem('chemTheme',dark?'dark':'light'),dark);
   await context.route('**/*',route=>route.request().url().startsWith(base+'/')||/^(data|blob):/.test(route.request().url())?route.continue():route.abort());
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/naturfag.html#nutrition/all');
   const frame=await (await page.locator('#nutrition-module-frame').elementHandle()).contentFrame();
   await frame.locator('[data-question]').waitFor();
   await frame.waitForFunction(dark=>document.body.classList.contains('dark')===dark,dark);
   const questions=await frame.evaluate(async()=>{const {questions}=await import(new URL('ernaering/questions.js',location.href));return questions;});
   for(const q of process.env.DARK_QA_CHEM_ONLY?[]:questions){
    await frame.evaluate(id=>{location.hash=id;},q.id);
    await frame.waitForFunction(id=>document.querySelector('[data-question]')?.dataset.question===id,q.id);
    await add(frame,`${width}/${dark?'dark':'light'}/${q.id}/question`);
    const selected=frame.locator('.option-button,.term-chip,.organ-chip,.process-list button').filter({visible:true}).first();
    if(await selected.count()){await selected.click();await add(frame,`${width}/${dark?'dark':'light'}/${q.id}/selected`);}
    const reveal=frame.locator('#reveal-answer');
    if(await reveal.isVisible())await reveal.click();
    await add(frame,`${width}/${dark?'dark':'light'}/${q.id}/answer`);
    if(dark&&['micro-function-match','protein-folding','structure-glycerol-acid','energy-storage-hormones','nutrient-concept-map','carbs-classification'].includes(q.id))await page.screenshot({path:path.join(output,`${width}-${q.id}.png`),fullPage:true});
   }
   fs.writeFileSync(path.join(output,'contrast-in-progress.json'),JSON.stringify(failures,null,2));
   console.log('Scanned nutrition at '+width+'px; '+failures.length+' contrast findings so far.');
   if(dark){
    for(const [route,selector] of [['#nutrition/flashcards','#flip-flashcard'],['#nutrition/all/concepts','.concept-list'],['#nutrition/all/bank','#bank-search']]){
     await page.evaluate(route=>{location.hash=route;},route);await frame.locator(selector).waitFor();
     await add(frame,`${width}/${route}`);
     if(selector==='#flip-flashcard'){await frame.locator(selector).click();await add(frame,`${width}/flashcard-definition`);}
    }
    await frame.locator('#about-button').click();await frame.locator('#about-dialog[open]').waitFor();await add(frame,`${width}/help`);await frame.locator('#close-dialog').click();
    const automatic=questions.find(q=>q.type==='choice');
    await frame.evaluate(id=>{location.hash=id;},automatic.id);await frame.waitForFunction(id=>document.querySelector('[data-question]')?.dataset.question===id,automatic.id);
    if(await frame.locator('#retry-question').count())await frame.locator('#retry-question').click();
    const wrong=automatic.options.find(option=>option!==automatic.answer);
    await frame.getByRole('button',{name:wrong,exact:true}).click();await frame.locator('#check-answer').click();await add(frame,`${width}/wrong-feedback`);
    const before=await frame.locator('[data-question]').getAttribute('data-question');
    await page.evaluate(()=>document.getElementById('themeBtn').click());await frame.waitForFunction(()=>!document.body.classList.contains('dark'));
    assert.equal(await frame.locator('[data-question]').getAttribute('data-question'),before,'theme switching keeps the current task');
    await page.evaluate(()=>document.getElementById('themeBtn').click());await frame.waitForFunction(()=>document.body.classList.contains('dark'));
    await page.goto(base+'/naturfag.html#chemistry/atom');
    const pages=await page.evaluate(()=>[...document.querySelectorAll('.nav-btn[data-page]')].map(button=>button.dataset.page).filter(id=>id!=='home'&&document.getElementById('page-'+id)));
    for(const id of pages){
     await page.evaluate(id=>openPage(id),id);await page.locator('#page-'+id+'.active').waitFor();
     await page.locator('#page-'+id).evaluate(el=>{
      for(const animation of el.getAnimations({subtree:true}))if(Number.isFinite(animation.effect?.getComputedTiming().endTime))animation.finish();
     });
     await add(page,`${width}/chemistry/${id}`);
     if(id==='elementquiz'){
      await page.locator('#ptStart').click();
      const target=page.locator('#page-elementquiz .pt-cell.selectable:not(.solved)').first();
      if(await target.count())await target.click();
      await page.locator('#page-elementquiz').evaluate(el=>{for(const animation of el.getAnimations({subtree:true}))if(Number.isFinite(animation.effect?.getComputedTiming().endTime))animation.finish();});
      await add(page,`${width}/chemistry/periodic-feedback`);
      const colors=page.locator('#page-elementquiz .quiz-pt-color-btn');
      if(await colors.count()){
       await colors.click();await page.locator('#page-elementquiz').evaluate(el=>{for(const animation of el.getAnimations({subtree:true}))if(Number.isFinite(animation.effect?.getComputedTiming().endTime))animation.finish();});
       await add(page,`${width}/chemistry/periodic-colors-toggle`);
      }
     }
     if(width===1366&&['atom','binding','carbon','balance'].includes(id))await page.screenshot({path:path.join(output,'chemistry-'+id+'.png'),fullPage:true});
    }
    const standalone=await context.newPage();
    await standalone.goto(base+'/prototyper/ernaering.html#micro-function-match');await standalone.locator('[data-question]').waitFor();
    assert.equal(await standalone.locator('html.dark,body.dark').count(),2,'standalone exercises restore the saved theme');
    await add(standalone,`${width}/standalone`);await standalone.close();
   }
   metrics.push({width,dark,questions:questions.length});await context.close();
   console.log('Audited '+questions.length+' nutrition questions at '+width+'px in '+(dark?'dark':'light')+' mode.');
  }
  const grouped=[...new Map(failures.map(row=>[[row.selector,row.foreground,row.background.join(','),row.text].join('|'),row])).values()];
  fs.writeFileSync(path.join(output,'contrast.json'),JSON.stringify({metrics,failures:grouped,errors},null,2));
  console.log(JSON.stringify({metrics,failures:grouped.slice(0,35),failureGroups:grouped.length,errors},null,2));
  if(!process.env.AUDIT_ONLY){assert.deepEqual(errors,[]);assert.deepEqual(grouped,[],'visible text must retain AA contrast in each theme');}
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
