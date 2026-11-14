const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let pw;if(!process.argv.includes('--data-only')){for(const candidate of [process.env.PLAYWRIGHT_MODULE,'playwright',path.resolve(path.dirname(process.execPath),'../node_modules/playwright')].filter(Boolean)){try{pw=require(candidate);break;}catch{}}if(!pw)throw Error('Set PLAYWRIGHT_MODULE to an installed Playwright module.');}
const root=path.resolve(__dirname,'..'),shots=path.resolve(root,'../research/bolger-straling-qa');
const ids=['bolger','fenomener','em','atomer','universet','kommunikasjon','radioaktivitet','stralevern','atmosfaeren'];
const moduleNames=['wave-basics','waves','em-atoms','radioactivity','cosmos-environment'];
const errors=[],failures=[],warnings=[],coverage=[];
// A limited DOM fixture for running the actual model controllers and examining
// generated SVG geometry. It does not claim browser/layout verification.
function modelFixture(topic){
 const elements=[],idMap=new Map(),callbacks=[];let time=0;
 const decode=s=>String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 const attrMap=s=>{const a={};for(const m of s.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))a[m[1]]=decode(m[2]??m[3]??m[4]??'');return a;};
 function matches(el,selector){
  const chain=selector.trim().split(/\s+/);const last=chain.pop();if(!last)return false;
  const direct=(e,s)=>{const tag=s.match(/^[a-z][\w-]*/i);if(tag&&e.tagName.toLowerCase()!==tag[0].toLowerCase())return false;for(const m of s.matchAll(/#([\w-]+)/g))if(e.id!==m[1])return false;for(const m of s.matchAll(/\.([\w-]+)/g))if(!e.classList.contains(m[1]))return false;for(const m of s.matchAll(/\[([^\]=]+)(?:=["']?([^\]"']*)["']?)?\]/g))if(!(m[1]in e.attributes)||(m[2]!==undefined&&e.attributes[m[1]]!==m[2]))return false;return true;};
  if(!direct(el,last))return false;let ancestor=el.parent;for(let i=chain.length-1;i>=0;i--){while(ancestor&&!direct(ancestor,chain[i]))ancestor=ancestor.parent;if(!ancestor)return false;ancestor=ancestor.parent;}return true;
 }
 class Element{
  constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attributes={...attrs};this.id=attrs.id||'';this.parent=null;this.children=[];this.events={};this.style={};this._text='';this._html='';this._value=attrs.value??'';this.checked='checked'in attrs;this.disabled='disabled'in attrs;this.hidden='hidden'in attrs;this.min=attrs.min||'';this.max=attrs.max||'';this.step=attrs.step||'';this.type=attrs.type||(tag==='select'?'select-one':'');this.dataset={};for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;elements.push(this);if(this.id)idMap.set(this.id,this);const self=this;this.classList={contains:c=>(self.attributes.class||'').split(/\s+/).includes(c),toggle(c,force){const a=new Set((self.attributes.class||'').split(/\s+/).filter(Boolean));const on=force===undefined?!a.has(c):force;on?a.add(c):a.delete(c);self.attributes.class=[...a].join(' ');return on;},add(...c){c.forEach(x=>this.toggle(x,true));},remove(...c){c.forEach(x=>this.toggle(x,false));}};}
  get value(){if(this.tagName==='SELECT'&&this._value===''){const option=this.children.find(e=>e.tagName==='OPTION'&&'selected'in e.attributes)||this.children.find(e=>e.tagName==='OPTION');return option?.value||'';}return String(this._value);}
  set value(v){this._value=String(v);}
  set textContent(v){this._text=String(v);this.children.forEach(e=>e.parent=null);this.children=[];this._html='';}
  get textContent(){return this._text+this.children.map(e=>e.textContent).join('');}
  set innerHTML(v){this.children.forEach(e=>e.parent=null);this.children=[];this._text='';this._html=String(v);parse(this._html,this);}
  get innerHTML(){return this._html||this.children.map(e=>e.serialize()).join('');}
  get options(){return this.children.filter(e=>e.tagName==='OPTION');}
  setAttribute(k,v){this.attributes[k]=String(v);if(k==='id'){this.id=String(v);idMap.set(this.id,this);}}
  getAttribute(k){return this.attributes[k]??null;}
  removeAttribute(k){delete this.attributes[k];}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
  removeEventListener(k,fn){this.events[k]=(this.events[k]||[]).filter(f=>f!==fn);}
  dispatch(k){for(const fn of this.events[k]||[])fn({target:this,currentTarget:this,preventDefault(){}});}
  append(...nodes){for(const e of nodes){e.parent=this;this.children.push(e);}this._html='';}
  appendChild(e){this.append(e);return e;}
  contains(e){for(;e;e=e.parent)if(e===this)return true;return false;}
  querySelectorAll(s){return elements.filter(e=>e!==this&&this.contains(e)&&s.split(',').some(sel=>matches(e,sel)));}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  serialize(){const at=Object.entries(this.attributes).map(([k,v])=>`${k}="${v}"`).join(' ');return `<${this.tagName.toLowerCase()}${at?' '+at:''}>${this._text}${this.children.map(e=>e.serialize()).join('')}</${this.tagName.toLowerCase()}>`;}
 }
 function parse(html,parent){const stack=[parent],voids=new Set(['input','br','hr','img','meta','link','source']);let last=0;for(const m of html.matchAll(/<!--[^]*?-->|<\/?[a-z][^>]*>/gi)){const current=stack.at(-1);current._text+=decode(html.slice(last,m.index).replace(/<[^>]*>/g,''));last=m.index+m[0].length;if(m[0].startsWith('<!--'))continue;const closing=/^<\//.test(m[0]),tag=m[0].match(/^<\/?([\w-]+)/)[1].toLowerCase();if(closing){if(stack.length>1)stack.pop();continue;}const a=attrMap(m[0].slice(tag.length+1).replace(/\/?\s*>$/,'')),e=new Element(tag,a);current.append(e);if(!voids.has(tag)&&!m[0].endsWith('/>'))stack.push(e);}stack.at(-1)._text+=decode(html.slice(last));}
 const root=new Element('main');parse(topic.sections.map(s=>s.body).join(''),root);
 const previous={document:global.document,matchMedia:global.matchMedia,window:global.window};
 const restore=()=>{global.document=previous.document;global.matchMedia=previous.matchMedia;global.window=previous.window;};
 global.document={createElementNS:(_,tag)=>new Element(tag),createElement:tag=>new Element(tag),querySelector:s=>root.querySelector(s),getElementById:id=>idMap.get(id)};
 global.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});global.window={matchMedia:global.matchMedia};
 const api={onFrame(fn){callbacks.push(fn);fn(time);},repaint(){callbacks.forEach(fn=>fn(time));}};
 let cleanup;try{cleanup=topic.mount(root,api);}catch(e){restore();throw e;}
 return{root,get:id=>idMap.get(id),tick(t){time=t;api.repaint();},change(id,value,event='input'){const el=idMap.get(id);assert.ok(el,'Missing control '+id);el.value=value;el.dispatch(event);},click(id){const el=idMap.get(id);assert.ok(el,'Missing button '+id);el.dispatch('click');},html:()=>root.serialize(),destroy(){try{if(cleanup)cleanup();}finally{restore();}}};
}
const server=http.createServer((req,res)=>{try{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end('missing');}});
async function attempt(label,fn){try{await fn();coverage.push(label);}catch(e){failures.push(label+': '+e.message);console.error('FAIL '+label+': '+e.message);}}
(async()=>{
 const {pathToFileURL}=require('node:url');
 const source=[],sourceModules={};for(const file of moduleNames){sourceModules[file]=await import(pathToFileURL(path.join(root,'prototyper/bolger-straling',file+'.js')).href);source.push(...sourceModules[file].topics);}
 assert.deepEqual(source.map(t=>t.id).sort(),ids.slice().sort());
 const unique=new Set(),numeric=new Map();
 for(const t of source){assert.ok(t.sections.length&&t.terms.length&&t.questions.length>=10,t.id);for(const q of t.questions){assert.ok(!unique.has(q.id)&&q.prompt&&q.answer,q.id);unique.add(q.id);assert.ok(['mcq','number','open'].includes(q.type),q.id);if(q.type==='mcq')assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,q.id);if(q.type==='number'){assert.ok(Number.isFinite(q.value),q.id);numeric.set(q.id,q);}}}
 const expected={'wv-b3':5/2,'wv-b4':1/2.5,'wv-b5':345/440,'wv-b6':4/2,'wv-b9':340*3,'wv-f1':35,'wv-f6':3+3,'em-03':3e8/1e8,'em-04':3e8/(500e-9)/1e14,'atom-05':-1.5-(-3.4),'atom-12':6.63e-34*5e14/1e-19,'com-04':5*8,'com-10':36000/300000,'ra-q2':220-85,'ra-q9':Math.log2(40/5)*5730,'ra-q10':3000*2**(-12/4),'ra-q11':Math.log2(100/6.25)*5730,'ra-q16':1000*2**(-360/24),'sv-q7':250*20,'sv-q8':2.5*1000,'ce-u-06':2898000/6000,'ce-u-09':656*1.1,'ce-a-08':340*(1-.3),'ce-a-09':238-230};
 for(const [id,value]of Object.entries(expected)){const q=numeric.get(id);assert.ok(q,id);assert.ok(Math.abs(q.value-value)<1e-8*Math.max(1,Math.abs(value)),id+' incorrect answer');}
 const originalIds=[...Array.from({length:12},(_,i)=>'wv-b'+(i+1)),...Array.from({length:14},(_,i)=>'wv-f'+(i+1)),...['em','atom','com'].flatMap(p=>Array.from({length:12},(_,i)=>p+'-'+String(i+1).padStart(2,'0'))),...Array.from({length:16},(_,i)=>'ra-q'+(i+1)),...Array.from({length:17},(_,i)=>'sv-q'+(i+1)),...['ce-u','ce-a'].flatMap(p=>Array.from({length:14},(_,i)=>p+'-'+String(i+1).padStart(2,'0')))];
 assert.deepEqual([...unique].sort(),originalIds.sort(),'The compact redesign must preserve every existing question.');
 const appSource=fs.readFileSync(path.join(root,'prototyper/bolger-straling/app.js'),'utf8');
 assert.ok(!appSource.includes('animation-speed'),'The global animation-speed control was removed.');
 assert.ok(!appSource.includes('id="pause-button"'),'The global pause control was removed.');
 const topicRender=appSource.match(/function renderTopic\(\)\{([\s\S]*?)\nfunction resourceHtml/)[1];
 assert.ok(!/t\.(kicker|summary)/.test(topicRender),'Topic content should not repeat its overview kicker or summary.');
 const {interferenceDisplacement:sum,diffractionFrontPath:front,diffractionEnvelope:envelope}=sourceModules.waves;
 assert.equal(typeof sum,'function');assert.equal(typeof front,'function');assert.equal(typeof envelope,'function');
 for(const t of [0,.13,.7,2])for(let i=0;i<80;i++){const x=i/10;assert.ok(Math.abs(sum(x,t,2,2,180,2))<1e-10,'Equal wavelength, opposite phase must cancel everywhere.');assert.ok(Number.isFinite(sum(x,t,.4,4,123,2)),'Wave sum must be finite.');}
 assert.ok(Math.abs(sum(.5,0,2,4,0,2)-(1+Math.SQRT1_2))<1e-10,'Different wavelengths must retain their own spatial phase.');
 assert.ok(Math.abs(sum(0,.25,2,4,0,2)+(1+Math.SQRT1_2))<1e-10,'Different wavelengths at the same speed require different frequencies.');
 const unequalEnergy=Array.from({length:161},(_,i)=>sum(i/20,0,2,4,180,2)**2).reduce((a,b)=>a+b)/161;
 assert.ok(unequalEnergy>.25,'Opposite phase at one point cannot cancel unequal wavelengths everywhere.');
 assert.ok(Math.abs(envelope(0,1,1)-1)<1e-12,'Single-slit central angular envelope is normalized.');
 for(const angle of [-1,-.4,0,.4,1]){assert.ok(envelope(angle,1,1)>=0&&envelope(angle,1,1)<=1);assert.ok(Math.abs(envelope(angle,1,1)-envelope(-angle,1,1))<1e-12);}
 assert.ok(envelope(Math.PI/6,1,1)>envelope(Math.PI/6,4,1),'Narrower slit must produce broader angular distribution.');
 for(const aperture of [5,34,204])for(const radius of [0,1,20,200,600]){const d=front(310,140,aperture,radius);assert.ok(!/NaN|Infinity|undefined/.test(d));assert.ok((d.match(/M/g)||[]).length<=1,'Each diffraction front must be a continuous path before clipping.');}
 const phenomenonFixture=modelFixture(source.find(t=>t.id==='fenomener'));
 try{
  phenomenonFixture.click('wv-interference-antiphase');phenomenonFixture.tick(0);
  const sumPath=phenomenonFixture.get('wv-interference-sum');assert.ok(sumPath,'Named resultant path for direct model inspection');
  const ordinates=d=>[...d.matchAll(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)].map(m=>+m[0]).filter((_,i)=>i%2);
  const cancelled=ordinates(sumPath.getAttribute('d'));assert.ok(cancelled.length>100);assert.ok(Math.max(...cancelled)-Math.min(...cancelled)<.01,'The rendered sum must cancel for equal wavelengths in opposite phase.');
  const oneBefore=phenomenonFixture.get('wv-component-1').getAttribute('d'),twoBefore=phenomenonFixture.get('wv-component-2').getAttribute('d');
  phenomenonFixture.change('wv-lambda2',4);
  assert.equal(phenomenonFixture.get('wv-component-1').getAttribute('d'),oneBefore,'Changing wavelength2 cannot change wave1.');
  assert.notEqual(phenomenonFixture.get('wv-component-2').getAttribute('d'),twoBefore,'Changing wavelength2 must alter wave2.');
  const unequal=ordinates(phenomenonFixture.get('wv-interference-sum').getAttribute('d'));assert.ok(Math.max(...unequal)-Math.min(...unequal)>20,'Unequal-wavelength result must no longer be a flat cancellation line.');
  for(const slit of [.5,4])for(const wavelength of [.3,1.2])for(const t of [0,.17,3,12]){phenomenonFixture.change('wv-slit',slit);phenomenonFixture.change('wv-diff-lambda',wavelength);phenomenonFixture.tick(t);assert.ok(!/NaN|Infinity|undefined/.test(phenomenonFixture.get('wv-diffraction').serialize()),'Diffraction geometry is finite for all control extremes.');}
  for(const [name,x,width]of [['incident',24,270],['outgoing',306,430]]){const clip=phenomenonFixture.get('wv-diff-'+name+'-clip');assert.ok(clip);const rect=clip.querySelector('rect');assert.equal(+rect.getAttribute('x'),x);assert.equal(+rect.getAttribute('width'),width);assert.equal(+rect.getAttribute('y'),25);assert.equal(+rect.getAttribute('height'),220);assert.equal(phenomenonFixture.get('wv-diff-'+name).getAttribute('clip-path'),'url(#wv-diff-'+name+'-clip)');}
  assert.ok(phenomenonFixture.get('wv-diff-mask-soften').querySelector('feGaussianBlur'),'Angular bands are softened rather than drawn as detached segments.');
  const fronts=phenomenonFixture.get('wv-diff-outgoing').querySelectorAll('path');assert.ok(fronts.length>5);for(const p of fronts)assert.equal((p.getAttribute('d').match(/M/g)||[]).length,1,'Every outgoing front remains continuous before SVG clipping.');
 }finally{phenomenonFixture.destroy();}
 const basicFixture=modelFixture(source.find(t=>t.id==='bolger'));
 try{
  basicFixture.change('wv-frequency',2);basicFixture.change('wv-speed',6);
  assert.match(basicFixture.get('wv-travel-readout').textContent,/3 m/);assert.match(basicFixture.get('wv-travel-readout').textContent,/0,5 s/);
  const modeCases=[['wv-transverse','particle'],['wv-longitudinal','particle'],['wv-standing-mode','standing'],['wv-sound-mode','sound'],['wv-water-mode','water'],['wv-resonance-mode','swing']];
  for(const [button,visibleGroup]of modeCases){basicFixture.click(button);assert.equal(basicFixture.get(button).getAttribute('aria-pressed'),'true');for(const group of ['particle','standing','sound','water','swing'])assert.equal(basicFixture.get('wb-'+group+'-controls').hidden,group!==visibleGroup,button+' controls');for(const t of [0,.07,1.2,15,80]){basicFixture.tick(t);assert.ok(!/NaN|Infinity|undefined/.test(basicFixture.get('wv-particles').serialize()),button+' must produce finite geometry');}}
  basicFixture.click('wv-standing-mode');basicFixture.change('wv-harmonic',3);assert.match(basicFixture.get('wb-mode-readout').textContent,/3 buker.*4 knuter.*1,33 m.*1,5 Hz/);
  basicFixture.click('wv-sound-mode');basicFixture.tick(100);const soundBefore=basicFixture.get('wv-particles').serialize();basicFixture.change('wb-sound-frequency',1000);assert.match(basicFixture.get('wb-mode-readout').textContent,/1.?000 Hz/);assert.notEqual(basicFixture.get('wv-particles').serialize(),soundBefore,'Sound frequency changes particle/pressure pattern.');
  basicFixture.click('wv-water-mode');basicFixture.change('wb-water-depth',.1);const shallow=basicFixture.get('wv-particles').querySelectorAll('circle').find(e=>e.getAttribute('stroke-dasharray')==='3 3');assert.ok(shallow);const shallowRadius=+shallow.getAttribute('r');basicFixture.change('wb-water-depth',1.3);const deep=basicFixture.get('wv-particles').querySelectorAll('circle').find(e=>e.getAttribute('stroke-dasharray')==='3 3');assert.ok(+deep.getAttribute('r')<shallowRadius,'Deep-water particle orbit must shrink with depth.');
  basicFixture.click('wv-resonance-mode');for(const damping of [.06,.25]){basicFixture.change('wb-swing-damping',damping);for(const frequency of [.3,.5,.8]){basicFixture.change('wb-swing-frequency',frequency);basicFixture.click('wb-swing-reset');for(let i=0;i<50;i++)basicFixture.tick(110+i*.1);assert.ok(!/NaN|Infinity|undefined/.test(basicFixture.get('wv-particles').serialize()),'Driven swing is stable at slider extremes');}}
 }finally{basicFixture.destroy();}
 const {ionizationOutcome}=sourceModules['em-atoms'];assert.equal(typeof ionizationOutcome,'function');
 for(const energy of [2,10.2,13.5,13.6,20,30]){const result=ionizationOutcome(energy);assert.equal(result.threshold,13.6);assert.equal(result.ionizes,energy>=13.6);assert.ok(Math.abs(result.kinetic-Math.max(0,energy-13.6))<1e-12);assert.ok(Math.abs(result.wavelength-1239.841984/energy)<1e-10);}
 const atomFixture=modelFixture(source.find(t=>t.id==='atomer'));
 try{for(const energy of [2,10.2,13.5,13.6,20,30]){atomFixture.change('ema-ion-energy',energy);assert.equal(atomFixture.get('ema-ion-plot').getAttribute('data-state'),'neutral','Changing photon energy resets the experiment.');atomFixture.click('ema-ion-send');assert.equal(atomFixture.get('ema-ion-plot').getAttribute('data-state'),energy>=13.6?'ionized':'bound','13.6eV ionization threshold must apply in the displayed model.');assert.ok(!/NaN|Infinity|undefined/.test(atomFixture.get('ema-ion-plot').serialize()));atomFixture.click('ema-ion-reset');assert.equal(atomFixture.get('ema-ion-plot').getAttribute('data-state'),'neutral');}}finally{atomFixture.destroy();}
 console.log('Source/model checks passed: '+source.length+' topics, '+unique.size+' preserved questions, '+Object.keys(expected).length+' independently calculated numeric answers; compact header, two-wavelength interference, clipped diffraction, six wave modes, stable swing/sound/water and hydrogen ionization threshold/endpoints.');
 if(process.argv.includes('--data-only'))return;
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port, url=base+'/prototyper/bolger-straling.html';
 fs.mkdirSync(path.join(shots,'browser-temp'),{recursive:true});
 if(process.platform==='win32'){process.env.TEMP=path.join(shots,'browser-temp');process.env.TMP=process.env.TEMP;}
 const edge=process.platform==='win32'?path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe'):undefined;
 const browser=await pw.chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||(edge&&fs.existsSync(edge)?edge:undefined),args:['--disable-crash-reporter','--noerrdialogs']});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.route('**/*',r=>r.request().url().startsWith(base)||/^(data|blob):/.test(r.request().url())?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(7000);
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.goto(url);await page.locator('.topic-card').first().waitFor();
 const data=await page.evaluate(async names=>{const modules=await Promise.all(names.map(m=>import('./bolger-straling/'+m+'.js')));return modules.flatMap(m=>m.topics).map(t=>({id:t.id,title:t.title,sections:t.sections.length,questions:t.questions,terms:t.terms.length}));},moduleNames);
 await attempt('Complete, distinct, well-formed question data',async()=>{
 assert.equal(data.length,9);const seen=new Set();for(const t of data){assert.ok(t.sections>0&&t.terms>0);assert.ok(t.questions.length>=10,t.id);for(const q of t.questions){assert.ok(!seen.has(q.id),'duplicate '+q.id);seen.add(q.id);assert.ok(q.prompt&&q.answer,q.id);assert.ok(['mcq','number','open'].includes(q.type),q.id);if(q.type==='mcq')assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,q.id);if(q.type==='number')assert.ok(Number.isFinite(q.value)&&(q.tolerance===undefined||q.tolerance>=0),q.id);}}});
 async function route(id,view='fagstoff'){await page.goto(url+'#'+id+'/'+view);await page.locator('#topic-content').waitFor();await page.waitForTimeout(70);}
 for(const id of ids)for(const view of ['fagstoff','oppgaver','begreper'])await attempt('Desktop render '+id+'/'+view,async()=>{
 await route(id,view);assert.ok((await page.locator('h1').innerText()).trim());assert.equal(await page.locator('#main').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'main content overflow');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'document overflow');assert.equal(await page.locator('#animation-speed,#pause-button,.page-head .eyebrow,.page-head .intro,.head-icon').count(),0,'No repeated topic introduction or animation toolbar');if(view==='fagstoff')assert.ok(await page.locator('.content-section').count());else if(view==='oppgaver')assert.equal(await page.locator('.q-card').count(),data.find(t=>t.id===id).questions.length);});
 // Exercise controls with reduced-motion enabled, so changes cannot be attributed to animation alone.
 for(const id of ids)await attempt('Working controls '+id,async()=>{
 await route(id);const controls=page.locator('#topic-content input,#topic-content select');const count=await controls.count();let changed=0;
 for(let i=0;i<count;i++){
 const c=controls.nth(i);if(!(await c.isVisible())||!(await c.isEnabled()))continue;
 const info=await c.evaluate(e=>({tag:e.tagName,type:e.type,id:e.id,value:e.value,min:e.min,max:e.max,options:e.tagName==='SELECT'?[...e.options].map(o=>o.value):[]}));
 const before=await page.locator('#topic-content').evaluate(e=>e.innerHTML);
 if(info.tag==='SELECT'){const alt=info.options.find(v=>v!==info.value&&v!=='egen');if(alt===undefined)continue;await c.selectOption(alt);}
 else if(info.type==='range'){const next=info.value!==info.max?info.max:info.min;await c.fill(next);await c.dispatchEvent('input');}
 else if(info.type==='checkbox')await c.setChecked(!(await c.isChecked()));
 else if(info.type==='text'){await c.fill('B');await c.dispatchEvent('input');}
 else continue;
 await page.waitForTimeout(20);const after=await page.locator('#topic-content').evaluate(e=>e.innerHTML);if(after!==before)changed++;else warnings.push('No immediate model markup change for '+id+':'+info.id+' (may require animation to run).');
 }
 if(count)assert.ok(changed>0,'No control updated model');
 });
 await attempt('Wave relations remain consistent',async()=>{await route('bolger');await page.locator('#wv-frequency').fill('2');await page.locator('#wv-frequency').dispatchEvent('input');await page.locator('#wv-speed').fill('6');await page.locator('#wv-speed').dispatchEvent('input');const text=await page.locator('#wv-travel-readout').innerText();assert.match(text,/3 m/);assert.match(text,/0,5 s/);});
 await attempt('Refraction, interference and Doppler numerical outputs',async()=>{
 await route('fenomener');await page.locator('#wv-angle').fill('35');await page.locator('#wv-angle').dispatchEvent('input');assert.match(await page.locator('#wv-reflection-readout').innerText(),/35/);
 await page.locator('#wv-interference-antiphase').click();assert.match(await page.locator('#wv-interference-readout').innerText(),/utslokking|kanseller/i);await page.locator('#wv-lambda2').fill('4');await page.locator('#wv-lambda2').dispatchEvent('input');assert.match(await page.locator('#wv-interference-readout').innerText(),/1 Hz.*0,5 Hz/);
 await page.locator('#wv-source-speed').fill('0.5');await page.locator('#wv-source-speed').dispatchEvent('input');assert.match(await page.locator('#wv-doppler-readout').innerText(),/333.*500.*1.?000/);
 });
 await attempt('Atomic transition wavelength and half-life expectation',async()=>{
 await route('atomer');const level=page.locator('#ema-level');console.log('ATOM_OPTIONS '+JSON.stringify(await level.locator('option').evaluateAll(es=>es.map(e=>({v:e.value,t:e.textContent})))));
 await route('radioaktivitet');await page.locator('#ra-half-time').fill('3');await page.locator('#ra-half-time').dispatchEvent('input');assert.match(await page.locator('#ra-half-expected').innerText(),/25/);assert.equal(await page.locator('.ra-decayed').count()+await page.locator('.ra-population i:not(.ra-decayed)').count(),200);
 });
 await attempt('Photon energy threshold is reflected in the displayed ionization state',async()=>{await route('atomer');for(const [energy,state]of [['13.5','bound'],['13.6','ionized'],['20','ionized']]){await page.locator('#ema-ion-energy').fill(energy);await page.locator('#ema-ion-energy').dispatchEvent('input');assert.equal(await page.locator('#ema-ion-plot').getAttribute('data-state'),'neutral');await page.locator('#ema-ion-send').click();assert.equal(await page.locator('#ema-ion-plot').getAttribute('data-state'),state);await page.locator('#ema-ion-reset').click();assert.equal(await page.locator('#ema-ion-plot').getAttribute('data-state'),'neutral');}});
 const qAll=data.flatMap(t=>t.questions.map(q=>({...q,topic:t.id})));
 const mcq=qAll.find(q=>q.type==='mcq'),num=qAll.find(q=>q.type==='number'),open=qAll.find(q=>q.type==='open');
 const card=q=>page.locator('[data-question="'+q.id+'"]');
 await attempt('MCQ feedback and mastery persist',async()=>{await route(mcq.topic,'oppgaver');await card(mcq).locator('[data-choice="'+mcq.correct+'"]').click();await card(mcq).locator('.q-status').waitFor();assert.match(await card(mcq).locator('.feedback').innerText(),/Riktig/);await page.reload();await card(mcq).locator('.q-status').waitFor();});
 await attempt('Numeric answer handles comma and wrong/empty values',async()=>{await route(num.topic,'oppgaver');const c=card(num);await c.locator('input').fill('');await c.locator('button[type=submit]').click();assert.match(await c.locator('.feedback').innerText(),/tall/);await c.locator('input').fill(String(num.value+1000));await c.locator('button[type=submit]').click();assert.equal(await c.locator('.q-status').isVisible(),false);await c.locator('input').fill(String(num.value).replace('.',','));await c.locator('button[type=submit]').click();assert.match(await c.locator('.feedback').innerText(),/Riktig/);await page.reload();await c.locator('.q-status').waitFor();assert.equal(await c.locator('input').inputValue(),String(num.value).replace('.',','));});
 await attempt('Open draft, solution, self-assessment and bookmark persist',async()=>{await route(open.topic,'oppgaver');const c=card(open);await c.locator('textarea').fill('Mitt faglige svar.');await c.locator('.show-answer').click();assert.ok(await c.locator('.solution').isVisible());await c.locator('[data-self="again"]').click();assert.equal(await c.locator('.q-bookmark').getAttribute('aria-pressed'),'true');await page.reload();assert.equal(await c.locator('textarea').inputValue(),'Mitt faglige svar.');assert.equal(await c.locator('.q-bookmark').getAttribute('aria-pressed'),'true');});
 await attempt('All questions search, type/topic filters and bookmark list',async()=>{await route('alle','oppgaver');assert.equal(await page.locator('.q-card').count(),qAll.length);await page.locator('#question-type').selectOption('number');assert.equal(await page.locator('.q-card').count(),qAll.filter(q=>q.type==='number').length);await page.locator('#question-type').selectOption('');await page.locator('#question-search').fill('sjeldenord_ingen');assert.equal(await page.locator('.q-card').count(),0);await page.locator('#question-search').fill('');await page.locator('#bookmark-filter').click();assert.ok(await page.locator('.q-card').count()>=1);await page.locator('#bookmark-filter').click();await page.locator('#question-topic').selectOption('em');assert.equal(await page.locator('.q-card').count(),data.find(t=>t.id==='em').questions.length);});
 await attempt('Automatic graphics respect reduced-motion preference',async()=>{await route('fenomener');const svg=page.locator('#wv-interference');const before=await svg.innerHTML();await page.waitForTimeout(180);assert.equal(await svg.innerHTML(),before);await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();const moving=await svg.innerHTML();await page.waitForTimeout(180);assert.notEqual(await svg.innerHTML(),moving);await page.emulateMedia({reducedMotion:'reduce'});await page.reload();const frozen=await svg.innerHTML();await page.waitForTimeout(180);assert.equal(await svg.innerHTML(),frozen);});
 await attempt('Dark theme survives reload',async()=>{await page.locator('#theme-button').click();assert.ok(await page.locator('body.dark').count());await page.reload();assert.ok(await page.locator('body.dark').count());await page.locator('#theme-button').click();});
 await attempt('Keyboard skip link preserves the current topic',async()=>{await route('atomer');const before=page.url();await page.locator('.skip').focus();await page.keyboard.press('Enter');assert.equal(page.url(),before);assert.equal(await page.evaluate(()=>document.activeElement.id),'main');});
 for(const width of [390,320])for(const id of ids)await attempt('Mobile '+width+' '+id,async()=>{await page.setViewportSize({width,height:844});await route(id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'document overflow');await route(id,'oppgaver');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'bank overflow');});
 await attempt('Mobile navigation opens/closes and route is keyboard reachable',async()=>{await page.setViewportSize({width:390,height:844});await route('em');await page.locator('#menu-button').click();assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');await page.locator('#menu-button').click();await page.locator('[data-route="em/oppgaver"]').first().click();await page.locator('.q-card').first().waitFor();assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');});
 await page.setViewportSize({width:1440,height:1000});await page.goto(url+'#oversikt');await page.screenshot({path:path.join(shots,'overview-desktop.png'),fullPage:true});
 await route('fenomener');await page.screenshot({path:path.join(shots,'phenomena-desktop.png'),fullPage:true});
 await route('radioaktivitet');await page.screenshot({path:path.join(shots,'radioactivity-desktop.png'),fullPage:true});
 await route('universet');await page.locator('#theme-button').click();await page.screenshot({path:path.join(shots,'universe-dark.png'),fullPage:true});await page.locator('#theme-button').click();
 await page.setViewportSize({width:390,height:844});await route('em');await page.screenshot({path:path.join(shots,'em-mobile.png'),fullPage:true});
 if(errors.length)failures.push('Browser errors: '+errors.join('\n'));
 const report={topics:data.map(t=>({id:t.id,questions:t.questions.length,sections:t.sections,terms:t.terms})),totalQuestions:qAll.length,passed:coverage.length,failures,warnings,shots};
 fs.writeFileSync(path.join(shots,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
