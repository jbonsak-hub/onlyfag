/* Targeted, offline browser checks for the new molecule and applied figures. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
 try{
  const filename=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!filename.startsWith(root+path.sep))return res.writeHead(403).end();
  res.setHeader('Content-Type',mime[path.extname(filename)]||'application/octet-stream');
  res.end(fs.readFileSync(filename));
 }catch{res.writeHead(404).end();}
});
const screenshots=process.env.NUTRITION_FIGURE_QA_DIR;
if(screenshots)fs.mkdirSync(screenshots,{recursive:true});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const errors=[],overflows=[],unreadable=[],clipped=[],collisions=[],metrics=[];
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium'});
  async function geometry(frame){return frame.evaluate(()=>({
   width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
   bounds:Object.fromEntries(['.prompt','.mini-figure','.visual-response','.task-actions','.feedback'].map(selector=>{
    const r=document.querySelector(selector)?.getBoundingClientRect();
    return [selector,r&&r.width>0&&r.height>0?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null];
   }))
  }));}
  function checkBounds(id,viewport,stage,g){
   const outside=Object.entries(g.bounds).filter(([,r])=>r&&(r.left<-.5||r.top<-.5||r.right>g.width+.5||r.bottom>g.height+.5));
   if(g.scrollWidth>g.width+1||g.scrollHeight>g.height+1||outside.length)overflows.push({id,viewport,stage,...g,outside});
  }
  async function answer(frame,q){
   if(q.type==='choice'||q.type==='multi'){
    for(const value of q.type==='choice'?[q.answer]:q.answer)await frame.getByRole('button',{name:value,exact:true}).click();
   }else if(['match','sort','fill'].includes(q.type)){
    const values=q.type==='match'?q.pairs.map(p=>p.right):q.type==='sort'?q.items.map(item=>item.group):q.blanks.map(blank=>blank.answers[0]);
    for(const [i,value] of values.entries()){
     const control=frame.locator('#row-'+i);
     if(q.type==='fill')await control.fill(value);else await control.selectOption(value);
    }
   }else throw new Error(q.id+': this figure should use an automatic answer control');
   await frame.locator('#check-answer').click();
   assert.match(await frame.locator('#feedback-title').innerText(),/Riktig uten hjelp/,q.id+': the visible answer controls accept the scientific key');
  }
  for(const [width,height] of [[1366,768],[1280,720],[1024,720],[390,844]]){
   const viewport={width,height};
   const context=await browser.newContext({viewport,reducedMotion:'reduce'});
   await context.route('**/*',route=>{
    const req=route.request(),url=req.url();
    return ['GET','HEAD'].includes(req.method())&&(url.startsWith(base+'/')||/^(data|blob):/.test(url))?route.continue():route.abort();
   });
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'/naturfag.html#nutrition/all');
   await page.locator('#nutrition-module-frame').waitFor();
   const frame=await (await page.locator('#nutrition-module-frame').elementHandle()).contentFrame();
   await frame.locator('[data-question]').waitFor();
   const questions=await frame.evaluate(async()=>{
    const {questions}=await import(new URL('ernaering/questions.js',location.href).href);
    return questions.filter(q=>/^(recognition|applied)-/.test(q.id));
   });
   assert.equal(questions.filter(q=>q.id.startsWith('recognition-')).length,8,'eight molecule recognition questions are integrated');
   assert.equal(questions.filter(q=>q.id.startsWith('applied-')).length,5,'exactly five further applied figure questions are integrated');
   let minimumText=Infinity,maxScrollHeight=0;
   for(const q of questions){
    await frame.evaluate(id=>{location.hash=id;},q.id);
    await frame.waitForFunction(id=>document.querySelector('[data-question]')?.dataset.question===id,q.id);
    assert.equal(await frame.locator('.mini-figure svg:visible').count(),1,q.id+': one readable figure variant is shown');
    assert.equal(await frame.locator('.feedback,.open-model,.exercise .correct').count(),0,q.id+': no solution or correctness is shown before answering');
    const before=await geometry(frame);checkBounds(q.id,viewport,'before',before);
    maxScrollHeight=Math.max(maxScrollHeight,before.scrollHeight);
    const labels=await frame.locator('.mini-figure').evaluate(figure=>[...figure.querySelectorAll('svg text')].flatMap(text=>{
     const r=text.getBoundingClientRect(),svg=text.closest('svg').getBoundingClientRect(),matrix=text.getScreenCTM();
     if(!text.textContent.trim()||!r.width||!r.height||!matrix)return [];
     return [{text:text.textContent.trim(),pixels:parseFloat(getComputedStyle(text).fontSize)*Math.hypot(matrix.a,matrix.b),outside:r.left<svg.left-.5||r.top<svg.top-.5||r.right>svg.right+.5||r.bottom>svg.bottom+.5,bounds:{left:r.left,top:r.top,right:r.right,bottom:r.bottom}}];
    }));
    assert.ok(labels.length,q.id+': the figure has readable data labels');
    for(const label of labels){
     minimumText=Math.min(minimumText,label.pixels);
     if(label.pixels<12-.01)unreadable.push({id:q.id,viewport,...label});
     if(label.outside)clipped.push({id:q.id,viewport,...label});
    }
    for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
     const a=labels[i].bounds,b=labels[j].bounds;
     const overlapWidth=Math.min(a.right,b.right)-Math.max(a.left,b.left),overlapHeight=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
     if(overlapWidth>1&&overlapHeight>1)collisions.push({id:q.id,viewport,labels:[labels[i].text,labels[j].text],overlapWidth,overlapHeight});
    }
    if(screenshots&&[1366,390].includes(width))await page.screenshot({path:path.join(screenshots,width+'-'+q.id+'.png'),fullPage:true});
    await answer(frame,q);
    const after=await geometry(frame);checkBounds(q.id,viewport,'answered',after);
    maxScrollHeight=Math.max(maxScrollHeight,after.scrollHeight);
    // Reveal is a separate supported flow and can add different feedback.
    await frame.locator('#retry-question').click();
    await frame.locator('#reveal-answer').click();
    checkBounds(q.id,viewport,'revealed',await geometry(frame));
    const host=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,bounds:{frame:(()=>{const r=document.getElementById('nutrition-module-frame').getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};})()}}));
    checkBounds(q.id,viewport,'host',host);
   }
   metrics.push({width,height,questions:questions.length,states:questions.length*3,minimumTextPixels:Math.round(minimumText*100)/100,maxScrollHeight});
   await context.close();
  }
  console.log(JSON.stringify({metrics,overflows,unreadable,clipped,collisions,errors},null,2));
  assert.deepEqual(errors,[],'no browser exceptions');
  assert.deepEqual(overflows,[],'all new figures, controls and feedback fit together in the shared host');
  assert.deepEqual(unreadable,[],'all visible figure labels render at least 12px');
  assert.deepEqual(clipped,[],'figure labels remain inside the SVG viewport');
  assert.deepEqual(collisions,[],'distinct figure labels do not overlap');
  console.log('All 13 new figure questions: answer controls, shared-host layouts, readable labels and reveal flows passed.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
