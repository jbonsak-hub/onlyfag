/* Current river inventory, geographic courses and the current top ten. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),asset=name=>path.join(root,'assets/geography/physical-maps',name);
const legacyBytes=fs.readFileSync(asset('world-water.json')),legacy=JSON.parse(legacyBytes),current=JSON.parse(fs.readFileSync(asset('world-water-v2.json'),'utf8'));
const oldRivers=legacy.regions.rivers.states,rivers=current.regions.rivers.states;
const removed=['Mackenzie','Ohio','Paraguay','Uruguay','Jenisej','Don','Loire','Limpopo','Glomma','Elbe'];
const additions=['Irrawaddy','Jordan'];
function paths(d){
  const tokens=d.match(/[MLZmlz]|-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/g)||[],out=[];let x=0,y=0,current;
  for(let i=0;i<tokens.length;){
    const command=tokens[i++];assert(/[MLml]/.test(command),'A river contains only open linear SVG courses');
    const a=Number(tokens[i++]),b=Number(tokens[i++]);assert(Number.isFinite(a)&&Number.isFinite(b),'Finite river coordinates');
    if(command===command.toLowerCase()){x+=a;y+=b;}else{x=a;y=b;}
    if(/[Mm]/.test(command)){current=[];out.push(current);}assert(current,'A course starts with a move');current.push([x,y]);
  }
  return out;
}
function segmentDistance(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
function distanceToCourse(point,lines){
  let distance=Infinity;for(const line of lines)for(let i=1;i<line.length;i++)distance=Math.min(distance,segmentDistance(point,line[i-1],line[i]));return distance;
}
const toLonLat=([x,y])=>[x/1000*360-180,84-y/540*154];
function bounds(state){
  const p=paths(state.d).flat().map(toLonLat);return [Math.min(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[0])),Math.max(...p.map(p=>p[1]))];
}
function dataChecks(){
  // Pin the complete legacy file, including the 49 names and their geometry.
  assert.equal(crypto.createHash('sha256').update(legacyBytes).digest('hex'),'e70efb54a9af9045cba6ddf193c5c985e4a62d4b4f8d6705e459fc8424031f95','The archived 49-river asset remains byte-for-byte intact');
  assert.equal(oldRivers.length,49);assert.equal(rivers.length,41);assert.equal(current.regions.rivers.variant,'rivers-v2');
  assert.deepEqual(rivers.map(s=>s.n).sort(),oldRivers.filter(s=>!removed.includes(s.n)).map(s=>s.n).concat(additions).sort(),'The chosen inventory makes exactly the authorized ten removals and two additions');
  assert(rivers.some(s=>s.n==='Lena'),'Lena remains in the current selection');
  for(const name of ['Ob','Orange','Senegal'])assert(rivers.some(s=>s.n===name),name+' remains included');
  for(const name of removed)assert(!rivers.some(s=>s.n===name),name+' is absent from the active map');
  assert.equal(new Set(rivers.map(s=>s.n)).size,41);assert.equal(new Set(rivers.map(s=>s.en)).size,41);
  for(const state of rivers){
    assert.equal(state.kind,'river');assert(['northAmerica','southAmerica','europe','asia','africa','oceania'].includes(state.continent));
    const lines=paths(state.d);assert(lines.length&&lines.every(line=>line.length>=2),state.n+' has real geographic courses');
    assert(lines.flat().every(([x,y])=>x>=-.01&&x<=1000.01&&y>=-.01&&y<=540.01),state.n+' stays within the map');
    assert(distanceToCourse(state.c,lines)<.05,state.n+' answer/hint anchor lies on its actual river');
    const previous=oldRivers.find(s=>s.n===state.n);if(previous)assert.deepEqual(state,previous,state.n+' keeps its existing geographic shape and metadata');
  }
  // Other water quizzes share this asset; their contents must not change when
  // the river teaching selection changes.
  for(const region of ['lakes','seas'])assert.deepEqual(current.regions[region],legacy.regions[region],region+' inventory and geometry stay unchanged');
  assert.deepEqual(current.background,legacy.background,'The existing land/lake background stays unchanged');
  const irrawaddy=rivers.find(s=>s.n==='Irrawaddy'),jordan=rivers.find(s=>s.n==='Jordan');
  for(const state of [irrawaddy,jordan]){assert.equal(state.en,state.n);assert.equal(state.continent,'asia');assert.equal(state.hitWidth,9);assert.equal(paths(state.d).length,1,state.n+' is a continuous main course');}
  const ib=bounds(irrawaddy);assert(ib[0]>94.6&&ib[0]<94.9&&ib[1]>16.1&&ib[1]<16.4&&ib[2]>97.4&&ib[2]<97.7&&ib[3]>25.5&&ib[3]<25.9,'Irrawaddy reaches its Myanmar delta and northern confluence: '+ib);
  const jb=bounds(jordan);assert(jb[0]>35.4&&jb[0]<35.7&&jb[1]>31.6&&jb[1]<31.9&&jb[2]>35.7&&jb[2]<36&&jb[3]>33.4&&jb[3]<33.8,'Jordan reaches the northern headwaters and the northern Dead Sea shore: '+jb);
  const galilee=[(35.58+180)/360*1000,(84-32.8)/154*540];
  assert(distanceToCourse(galilee,paths(jordan.d))<.5,'Jordan remains continuous through the Sea of Galilee');
  console.log('PASS river data: current41, preserved legacy49, exact removals/additions, unchanged existing geometry, complete Irrawaddy/Jordan courses and anchors');
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((request,response)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep))return response.writeHead(403).end();
  try{response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));}catch{response.writeHead(404).end();}
});
async function pointer(page,state){
  const point=await page.evaluate(state=>{
    const shape=[...document.querySelectorAll('.physical-target')].find(el=>el.dataset.state===state.n);
    const p=new DOMPoint(...state.c).matrixTransform(shape.getScreenCTM());
    return {x:p.x,y:p.y,hit:document.elementFromPoint(p.x,p.y)?.closest('[data-state]')?.dataset.state};
  },state);
  assert.equal(point.hit,state.n,state.n+' exposes its real course to mouse/touch hit testing');
  await page.mouse.click(point.x,point.y);
}
async function browserChecks(){
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE}),errors=[],missing=[];
  try{
    for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
      const context=await browser.newContext({viewport}),sessions=[],boards=[],answers=[];
      await context.addInitScript(()=>localStorage.setItem('onlyfag-geo-language','no'));
      await context.route('**/*',async route=>{
        const request=route.request(),url=request.url();
        if(/\/score-service(?:-[a-f0-9]+)?\.js/.test(url))return route.fulfill({contentType:'text/javascript',body:"window.GEO_SCORE_API='https://river-scores.test';"});
        if(url.startsWith('https://river-scores.test')){
          const endpoint=new URL(url),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
          if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
          let result,status=200;
          if(endpoint.pathname==='/scores'){
            const config=JSON.parse(endpoint.searchParams.get('config'));boards.push(config);
            result={rows:[{nickname:'Current River Explorer',score:4100,time_ms:120000}]};
          }else if(endpoint.pathname==='/session'){
            const {requestId,...config}=JSON.parse(request.postData());sessions.push(config);
            const names=['Jordan','Irrawaddy',...rivers.map(s=>s.n).filter(n=>!additions.includes(n))];
            result={token:'isolated-river-session',config,complete:false,total:0,timeMs:0,questions:names.map((target,index)=>({id:'river-'+index,target,index,options:[]}))};status=201;
          }else if(endpoint.pathname==='/answer'){
            const input=JSON.parse(request.postData());answers.push(input);result={complete:false,total:answers.length*100,feedback:{correct:true,points:100}};
          }else if(endpoint.pathname==='/next')result={complete:false};
          else{status=404;result={error:'unexpected_test_endpoint'};}
          return route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(result)});
        }
        return url.startsWith(base)||/^(data|blob):/.test(url)?route.continue():route.abort();
      });
      const page=await context.newPage();page.setDefaultTimeout(10000);
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.url().startsWith(base)&&response.status()>=400)missing.push(response.url());});
      await page.goto(base+'/geografi/kart.html?region=rivers');await page.locator('#start:enabled').waitFor();
      assert.equal(await page.locator('body').getAttribute('data-river-variant'),'rivers-v2');
      assert.deepEqual((await page.locator('.physical-target').evaluateAll(els=>els.map(el=>el.dataset.state))).sort(),rivers.map(s=>s.n).sort(),'The actual board renders exactly the 41 chosen rivers');
      assert.match(await page.locator('#total-count').textContent(),/41/);
      for(const state of rivers.filter(s=>additions.includes(s.n))){
        await pointer(page,state);await page.waitForFunction(name=>document.querySelector('#labelLayer text')?.textContent===name,state.n);
      }
      assert.equal(sessions.length,0,'Discovering new rivers does not start a ranked game');
      const scoreResponse=()=>page.waitForResponse(response=>new URL(response.url()).hostname==='river-scores.test'&&new URL(response.url()).pathname==='/scores');
      let response=scoreResponse();await page.locator('#statle-top-ten').click();await response;
      const board=page.locator('#geo-online-board[open]');
      await board.getByText('Current River Explorer',{exact:true}).waitFor();
      assert.equal(await board.locator('select,.river-ranking-selection').count(),0,'The river top ten has no old-selection control');
      assert(!/49 elver|Previous selection|Tidligere utvalg/.test(await board.innerText()),'The current board does not offer the former 49-river selection');
      assert.equal(boards.at(-1).variant,'rivers-v2');assert.equal(boards.at(-1).scoring,'attempts-v1');
      assert(boards.every(config=>config.game==='kart'&&config.region==='rivers'&&config.variant==='rivers-v2'),'Every visible ranking request uses the current river selection');
      await board.locator('.mapwiz-top-ten-close').click();
      await page.locator('#start').click();await page.waitForFunction(()=>document.body.dataset.phase==='playing');
      assert.equal(sessions.length,1);assert.equal(sessions[0].game,'kart');assert.equal(sessions[0].region,'rivers');assert.equal(sessions[0].variant,'rivers-v2');assert.equal(sessions[0].scoring,'attempts-v1');
      assert.equal(await page.locator('#targetName').textContent(),'Jordan','The current server plan accepts a newly added river');
      let answerResponse=page.waitForResponse(response=>new URL(response.url()).hostname==='river-scores.test'&&new URL(response.url()).pathname==='/answer');
      await pointer(page,rivers.find(s=>s.n==='Jordan'));await answerResponse;await page.waitForFunction(()=>document.querySelector('#completed').textContent==='1');
      await page.waitForFunction(()=>document.querySelector('#targetName').textContent==='Irrawaddy');
      answerResponse=page.waitForResponse(response=>new URL(response.url()).hostname==='river-scores.test'&&new URL(response.url()).pathname==='/answer');
      await pointer(page,rivers.find(s=>s.n==='Irrawaddy'));await answerResponse;await page.waitForFunction(()=>document.querySelector('#completed').textContent==='2');
      await page.waitForFunction(()=>document.querySelector('.physical-target[data-state="Irrawaddy"]').classList.contains('found'));
      assert.deepEqual(answers.slice(0,2).map(answer=>answer.choice),['Jordan','Irrawaddy'],'Both added courses submit their own exact river names');
      assert.equal(await page.locator('.physical-target').count(),41,'Ranked play preserves the selected inventory');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'The river quiz and ranking fit the viewport');
      if(process.env.RIVER_SELECTION_SCREENSHOTS){fs.mkdirSync(process.env.RIVER_SELECTION_SCREENSHOTS,{recursive:true});await page.screenshot({path:path.join(process.env.RIVER_SELECTION_SCREENSHOTS,'rivers41-'+viewport.width+'.png')});}
      await context.close();
    }
    assert.deepEqual(errors,[],'No page errors');assert.deepEqual(missing,[],'Every local dependency loads');
    console.log('PASS river browser: all41 targets, real Jordan/Irrawaddy discovery and answers, rivers-v2 session, current ranking without archived-selection controls on desktop/mobile; all external requests mocked');
  }finally{await browser.close();}
}
(async()=>{dataChecks();if(!process.argv.includes('--data-only'))await browserChecks();})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>server.close());
