const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let pw;if(!process.argv.includes('--data-only')){for(const candidate of [process.env.PLAYWRIGHT_MODULE,'playwright',path.resolve(path.dirname(process.execPath),'../node_modules/playwright')].filter(Boolean)){try{pw=require(candidate);break;}catch{}}if(!pw)throw Error('Set PLAYWRIGHT_MODULE to an installed Playwright module.');}
const root=path.resolve(__dirname,'..'),shots=path.resolve(root,'../research/bolger-straling-qa');
const ids=['bolger','fenomener','em','atomer','universet','kommunikasjon','radioaktivitet','stralevern','atmosfaeren'];
const moduleNames=['wave-basics','waves','em-spectrum','em-atoms','radioactivity','cosmos-environment'];
const prototypeIds=ids.filter(id=>id!=='em');
const {publishedIds,modulePath,moduleUrl,browserModuleUrl,rendererPath}=require('./bolger-straling-paths.cjs');
const errors=[],failures=[],warnings=[],coverage=[];
let fixtureClockFactory;
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
  constructor(tag='div',attrs={}){this.tagName=tag.toUpperCase();this.attributes={...attrs};this.id=attrs.id||'';this.parent=null;this.children=[];this.events={};this.style={setProperty(k,v){this[k]=String(v);},removeProperty(k){delete this[k];}};this._text='';this._html='';this._value=attrs.value??'';this.checked='checked'in attrs;this.disabled='disabled'in attrs;this.hidden='hidden'in attrs;this.min=attrs.min||'';this.max=attrs.max||'';this.step=attrs.step||'';this.type=attrs.type||(tag==='select'?'select-one':'');this.dataset={};for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;elements.push(this);if(this.id)idMap.set(this.id,this);const self=this;this.classList={contains:c=>(self.attributes.class||'').split(/\s+/).includes(c),toggle(c,force){const a=new Set((self.attributes.class||'').split(/\s+/).filter(Boolean));const on=force===undefined?!a.has(c):force;on?a.add(c):a.delete(c);self.attributes.class=[...a].join(' ');return on;},add(...c){c.forEach(x=>this.toggle(x,true));},remove(...c){c.forEach(x=>this.toggle(x,false));}};}
  get value(){if(this.tagName==='SELECT'&&this._value===''){const option=this.children.find(e=>e.tagName==='OPTION'&&'selected'in e.attributes)||this.children.find(e=>e.tagName==='OPTION');return option?.value||'';}return String(this._value);}
  set value(v){this._value=String(v);}
  set textContent(v){this._text=String(v);this.children.forEach(e=>e.parent=null);this.children=[];this._html='';}
  get textContent(){return this._text+this.children.map(e=>e.textContent).join('');}
  set innerHTML(v){this.children.forEach(e=>e.parent=null);this.children=[];this._text='';this._html=String(v);parse(this._html,this);}
  get innerHTML(){return this._html||this.children.map(e=>e.serialize()).join('');}
  get options(){return this.children.filter(e=>e.tagName==='OPTION');}
  get parentElement(){return this.parent;}
  get className(){return this.attributes.class||'';}
  set className(value){this.attributes.class=String(value);}
  hasAttribute(key){return key in this.attributes;}
  matches(selector){return selector.split(',').some(s=>matches(this,s));}
  closest(selector){for(let node=this;node;node=node.parent)if(node.matches(selector))return node;return null;}
  showModal(){this.open=true;this.setAttribute('open','');}
  close(){this.open=false;this.removeAttribute('open');this.dispatch('close');}
  focus(){global.document.activeElement=this;}
  setAttribute(k,v){this.attributes[k]=String(v);if(k==='id'){this.id=String(v);idMap.set(this.id,this);}}
  getAttribute(k){return this.attributes[k]??null;}
  removeAttribute(k){delete this.attributes[k];}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
  removeEventListener(k,fn){this.events[k]=(this.events[k]||[]).filter(f=>f!==fn);}
  dispatch(k,init={}){for(const fn of this.events[k]||[])fn({target:this,currentTarget:this,preventDefault(){},...init});}
  getBoundingClientRect(){const box=(this.attributes.viewBox||'0 0 760 320').split(/\s+/).map(Number);return {left:0,top:0,right:box[2],bottom:box[3],width:box[2],height:box[3]};}
  setPointerCapture(){}
  releasePointerCapture(){}
  append(...nodes){for(const e of nodes){if(e.parent){const at=e.parent.children.indexOf(e);if(at>=0)e.parent.children.splice(at,1);}e.parent=this;this.children.push(e);}this._html='';}
  before(node){const parent=this.parent;if(!parent)return;if(node.parent){const at=node.parent.children.indexOf(node);if(at>=0)node.parent.children.splice(at,1);}node.parent=parent;parent.children.splice(parent.children.indexOf(this),0,node);parent._html='';}
  appendChild(e){this.append(e);return e;}
  contains(e){for(;e;e=e.parent)if(e===this)return true;return false;}
  querySelectorAll(s){return elements.filter(e=>e!==this&&this.contains(e)&&s.split(',').some(sel=>matches(e,sel)));}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  getContext(){if(!this.context){this.width=+(this.attributes.width||this.width||760);this.height=+(this.attributes.height||this.height||340);this.context=new Proxy({canvas:this,createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),measureText:t=>({width:String(t).length*7})},{get(o,k){if(k in o)return o[k];if(typeof k==='symbol')return undefined;return(...args)=>{for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+String(k)+' uses finite coordinates');};},set(o,k,v){if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k)+' is finite');o[k]=v;return true;}});}return this.context;}
  serialize(){const at=Object.entries(this.attributes).map(([k,v])=>`${k}="${v}"`).join(' ');return `<${this.tagName.toLowerCase()}${at?' '+at:''}>${this._text}${this.children.map(e=>e.serialize()).join('')}</${this.tagName.toLowerCase()}>`;}
 }
 function parse(html,parent){const stack=[parent],voids=new Set(['input','br','hr','img','meta','link','source']);let last=0;for(const m of html.matchAll(/<!--[^]*?-->|<\/?[a-z][^>]*>/gi)){const current=stack.at(-1);current._text+=decode(html.slice(last,m.index).replace(/<[^>]*>/g,''));last=m.index+m[0].length;if(m[0].startsWith('<!--'))continue;const closing=/^<\//.test(m[0]),tag=m[0].match(/^<\/?([\w-]+)/)[1].toLowerCase();if(closing){if(stack.length>1)stack.pop();continue;}const a=attrMap(m[0].slice(tag.length+1).replace(/\/?\s*>$/,'')),e=new Element(tag,a);current.append(e);if(!voids.has(tag)&&!m[0].endsWith('/>'))stack.push(e);}stack.at(-1)._text+=decode(html.slice(last));}
 const root=new Element('main');parse(topic.sections.map(s=>s.body).join(''),root);
 const previous={document:global.document,matchMedia:global.matchMedia,window:global.window};
 const restore=()=>{global.document=previous.document;global.matchMedia=previous.matchMedia;global.window=previous.window;};
 const documentEvents={};
 global.document={hidden:false,addEventListener(k,fn){(documentEvents[k]??=[]).push(fn);},removeEventListener(k,fn){documentEvents[k]=(documentEvents[k]||[]).filter(f=>f!==fn);},createElementNS:(_,tag)=>new Element(tag),createElement:tag=>new Element(tag),querySelector:s=>root.querySelector(s),getElementById:id=>idMap.get(id)};
 global.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});global.window={matchMedia:global.matchMedia};
 const clock=fixtureClockFactory?.();
 const scope=target=>{const node=typeof target==='string'?root.querySelector(target):target;return node?.closest('.model')||node||root;};
 const api={onFrame(fn,target){if(clock)return clock.onFrame(fn,scope(target));callbacks.push(fn);fn(time);return()=>callbacks.splice(callbacks.indexOf(fn),1);},repaint(target){if(clock){if(arguments.length)clock.repaint(scope(target));else clock.repaint();}else callbacks.forEach(fn=>fn(time));},now:target=>clock?clock.now(scope(target)):time,isPaused:target=>clock?clock.isPaused(scope(target)):false};
 let cleanup;try{cleanup=topic.mount(root,api);}catch(e){restore();throw e;}
 return{root,get:id=>idMap.get(id),dispatchDocument(k,init={}){for(const fn of documentEvents[k]||[])fn({target:global.document,preventDefault(){},...init});},tick(t){if(clock)clock.advance(t-time);time=t;if(!clock)api.repaint();},pause(target,value=true){assert.ok(clock,'Scoped fixture clock is configured');clock.setPaused(scope(target),value);},now:target=>api.now(target),change(id,value,event='input'){const el=idMap.get(id);assert.ok(el,'Missing control '+id);el.value=value;el.dispatch(event);},click(id){const el=idMap.get(id);assert.ok(el,'Missing button '+id);el.dispatch('click');},html:()=>root.serialize(),destroy(){try{if(cleanup)cleanup();if(clock)clock.clear();}finally{restore();}}};
}
const server=http.createServer((req,res)=>{try{let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.extname(file)&&!fs.existsSync(file))file+='.html';if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end('missing');}});
async function attempt(label,fn){try{await fn();coverage.push(label);}catch(e){failures.push(label+': '+e.message);console.error('FAIL '+label+': '+e.message);}}
function assertNumericQuestion(q){
 if(q.fields)assert.ok(q.fields.length>1&&q.fields.every(field=>field.label&&field.unit),q.id);
 for(const field of q.fields??[q])assert.ok(Number.isFinite(field.value)&&(field.tolerance===undefined||field.tolerance>=0),q.id);
}
(async()=>{
 const source=[],sourceModules={};for(const file of moduleNames){sourceModules[file]=await import(moduleUrl(file));source.push(...(sourceModules[file].topics??[sourceModules[file].emTopic]));}
 assert.deepEqual(source.map(t=>t.id).sort(),ids.slice().sort());
 const unique=new Set(),numeric=new Map();
 for(const t of source){assert.ok(t.sections.length&&t.terms.length&&t.questions.length>=10,t.id);for(const q of t.questions){assert.ok(!unique.has(q.id)&&q.prompt&&q.answer,q.id);unique.add(q.id);assert.ok(['mcq','number','open'].includes(q.type),q.id);if(q.type==='mcq')assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,q.id);if(q.type==='number'){assertNumericQuestion(q);numeric.set(q.id,q);}}}
 const expected={'wv-b3':5/2,'wv-b4':1/2.5,'wv-b5':345/440,'wv-b6':4/2,'wv-b9':340*3,'wv-f1':35,'wv-f6':3+3,'em-03':3e8/1e8,'em-04':3e8/(500e-9)/1e14,'atom-05':-.24-(-.54),'atom-12':6.63e-34*5e14/1e-19,'com-04':5*8,'com-10':36000/300000,'ra-q2':220-85,'ra-q9':Math.log2(40/5)*5730,'ra-q10':3000*2**(-12/4),'ra-q11':Math.log2(100/6.25)*5730,'ra-q16':1000*2**(-360/24),'sv-q7':250*20,'sv-q8':2.5*1000,'ce-u-06':2898000/6000,'ce-u-09':656*1.1,'ce-a-08':340*(1-.3),'ce-a-09':238-230};
 for(const [id,value]of Object.entries(expected)){const q=numeric.get(id);assert.ok(q,id);assert.ok(Math.abs(q.value-value)<1e-8*Math.max(1,Math.abs(value)),id+' incorrect answer');}
 assert.deepEqual(numeric.get('wv-b13').fields.map(field=>field.value),[10/15,1.5]);
 assert.deepEqual(numeric.get('wv-b14').fields.map(field=>field.value),[2,3,4,.25,.5]);
 const originalIds=[...Array.from({length:12},(_,i)=>'wv-b'+(i+1)),...Array.from({length:14},(_,i)=>'wv-f'+(i+1)),...['em','atom','com'].flatMap(p=>Array.from({length:12},(_,i)=>p+'-'+String(i+1).padStart(2,'0'))),...Array.from({length:16},(_,i)=>'ra-q'+(i+1)),...Array.from({length:17},(_,i)=>'sv-q'+(i+1)),...['ce-u','ce-a'].flatMap(p=>Array.from({length:14},(_,i)=>p+'-'+String(i+1).padStart(2,'0')))];
 assert.deepEqual([...unique].sort(),[...originalIds,'wv-b13','wv-b14'].sort(),'Preserve every existing question and add both wave calculations.');
 assert.equal(unique.size,125);
 const publicTopics=source.filter(t=>publishedIds.includes(t.id));
 assert.deepEqual(publicTopics.map(t=>t.id),publishedIds);
 assert.deepEqual(publicTopics.map(t=>t.questions.length),[13,12,14]);
 for(const topic of publicTopics)assert.ok(!topic.terms.some(t=>/knut|\bbuk/i.test(t.term)),'Buk and knute are excluded from the published concept lists.');
 for(const [questionId,topicId] of [['wv-b8','em'],['wv-f3','em'],['wv-f13','universet']])assert.equal(source.find(t=>t.questions.some(q=>q.id===questionId))?.id,topicId,'Moved question belongs to its current teaching topic: '+questionId);
 const standingTask=publicTopics[0].questions.find(q=>q.id==='wv-b11');assert.ok(standingTask&&!/knut|\bbuk/i.test(standingTask.prompt+' '+standingTask.answer),'Standing-wave reasoning does not require the excluded glossary terms.');
 const publicEntry=fs.readFileSync(path.join(root,'naturfag/bolger-straling/entry.js'),'utf8');
 assert.deepEqual([...publicEntry.matchAll(/import \{(?:topics as \w+|emTopic)\} from ['"]([^'"]+)['"]/g)].map(m=>m[1].split('?')[0]).sort(),['./em-spectrum.js','./wave-basics.js','./waves.js'],'The published entry imports exactly the three released topic modules.');
 assert.deepEqual(sourceModules['em-atoms'].topics.map(t=>t.id).sort(),['atomer','kommunikasjon'],'The prototype atom entry omits the promoted EM topic.');
 const prototypeEntry=fs.readFileSync(path.join(root,'prototyper/bolger-straling/app.js'),'utf8');
 assert.match(prototypeEntry,/naturfag\/bolger-straling\/wave-basics\.js/);assert.match(prototypeEntry,/naturfag\/bolger-straling\/waves\.js/);
 for(const file of ['wave-basics.js','waves.js','em-spectrum.js','absorption.js'])assert.ok(!fs.existsSync(path.join(root,'prototyper/bolger-straling',file)),'Published modules have one canonical source: '+file);
 const appSource=fs.readFileSync(rendererPath,'utf8');
 assert.ok(!appSource.includes('animation-speed'),'The global animation-speed control was removed.');
 assert.ok(!appSource.includes('id="pause-button"'),'The global pause control was removed.');
 assert.ok(!appSource.includes('id="question-summary"'),'Exercise banks omit the progress summary.');
 const topicRender=appSource.match(/function renderTopic\(\)\{([\s\S]*?)\nfunction resourceHtml/)[1];
 assert.ok(!/t\.(kicker|summary)/.test(topicRender),'Topic content should not repeat its overview kicker or summary.');
 const helperModules={};for(const name of ['atom-lab','waves-rainbow','isotope-data','math-presentation','animation-clock'])helperModules[name]=await import(moduleUrl(name));
 fixtureClockFactory=helperModules['animation-clock'].createAnimationClock;
 const {solutionHtml}=helperModules['math-presentation'];
 assert.equal(numeric.size,26,'All 26 numeric questions receive the shared solution format.');
 for(const q of numeric.values()){const html=solutionHtml(q);assert.ok(html.includes('calc-lines')&&html.includes('calc-row')&&html.includes('calc-rhs'),q.id+' has aligned calculation rows');assert.notEqual(html,q.answer,q.id+' has the shared mathematical presentation');}
 const fallback={id:'not-a-worked-example',answer:'Keep this explanation.'};assert.equal(solutionHtml(fallback),fallback.answer);
 assert.ok(!topicRender.includes('class="section-links"')&&!topicRender.includes('nextHtml('),'Topic chip navigation and next-topic panels are removed.');
 const pageSource=fs.readFileSync(path.join(root,'prototyper/bolger-straling.html'),'utf8');assert.ok(!pageSource.includes('Utforsk sammenhenger. Bruk fagbegrepene.'),'The footer slogan is removed.');
 const wf=sourceModules['wave-basics'].waveFrequency;assert.equal(wf(6,2),3);assert.equal(wf(.5,8),.0625);
 const sum=sourceModules.waves.interferenceDisplacement;
 for(const t of [0,.13,.7,2])for(let i=0;i<40;i++){const x=i/10;assert.ok(Math.abs(sum(x,t,2,2,180,2))<1e-10,'Matched opposite-phase waves cancel everywhere.');assert.ok(Math.abs(sum(x,t,2,2,0,2)-2*Math.sin(2*Math.PI*(x/2-t)))<1e-10,'In-phase sum doubles the component.');}
 const rainbow=helperModules['waves-rainbow'];const normal=rainbow.refractRay([.5,Math.sqrt(.75)],[0,-1],1,1.5);assert.ok(Math.abs(normal[0]-1/3)<1e-10,'Snell law sets the transmitted direction.');
 const red=rainbow.rainbowAngles(1.331),violet=rainbow.rainbowAngles(1.343);assert.ok(red.rainbowDeg>41&&red.rainbowDeg<43&&violet.rainbowDeg>39&&violet.rainbowDeg<42&&red.rainbowDeg>violet.rainbowDeg);
 for(const n of [1.331,1.343]){const ray=rainbow.traceRainbow(n);assert.ok(Math.abs(ray.angleDeg-rainbow.rainbowAngles(n).rainbowDeg)<1e-8);for(const p of [ray.entry,ray.reflection,ray.exit])assert.ok(Math.abs(Math.hypot(...p)-1)<1e-9);}
 for(const order of [1,2])for(const n of [1.331,1.343]){const ray=rainbow.traceRainbow(n,null,order);assert.equal(ray.reflectionPoints.length,order);assert.ok(Math.abs(ray.angleDeg-rainbow.rainbowAngles(n,order).rainbowDeg)<1e-8);for(const p of [ray.entry,...ray.reflectionPoints,ray.exit])assert.ok(Math.abs(Math.hypot(...p)-1)<1e-9);}assert.ok(rainbow.rainbowAngles(1.343,2).rainbowDeg>rainbow.rainbowAngles(1.331,2).rainbowDeg,'Secondary rainbow reverses the primary color order.');
 assert.ok(rainbow.tracePrism(1.53,18).deviationDeg>rainbow.tracePrism(1.50,18).deviationDeg,'Violet is deflected more than red by the prism.');
 const H=6.62607015e-34,C=299792458;
 const iso=helperModules['isotope-data'];assert.equal(iso.verifiedIsotopes.length,51);
 for(const item of iso.verifiedIsotopes){assert.equal(item.a,item.z+item.n);const decay=iso.getPreferredDecay(item.z,item.n);if(item.stable){assert.equal(decay,null);continue;}assert.ok(decay&&decay.daughter.stable);assert.equal(decay.parent.a,decay.daughter.a);assert.equal(decay.daughter.z-decay.parent.z,decay.mode==='beta-'?1:-1);}
 assert.equal(iso.getIsotope(6,5),null,'An unlisted nucleus has unknown status, never inferred stability.');assert.equal(iso.getPreferredDecay(6,5),null);assert.equal(iso.getIsotope(6,6).stable,true);assert.equal(iso.getIsotope(6,8).stable,false);
 const bb=sourceModules['cosmos-environment'].blackbodyPhysics;assert.ok(bb);
 for(const T of [300,2500,5800,12000]){assert.ok(Math.abs(bb.totalExitance(T)/(5.670374419e-8*T**4)-1)<1e-8);const peak=bb.peakWavelength(T);assert.ok(Math.abs(peak*T-2897.771955)<1);for(const um of [.5,1,10]){const metres=um*1e-6,expected=2*Math.PI*H*C*C/(metres**5*Math.expm1(H*C/(metres*1.380649e-23*T)))*1e-6;const actual=bb.spectralExitance(um,T);assert.ok(Math.abs(actual-expected)<=Math.max(1e-200,expected*1e-8),'Absolute spectral exitance including pi and micrometre conversion');}assert.ok(bb.visibleExitance(T)>=0&&bb.visibleExitance(T)<bb.totalExitance(T));}
 assert.ok(bb.spectralExitance(.5,12000)>bb.spectralExitance(.5,5800),'The curves retain their actual temperature-dependent height.');
 for(const [a,b]of [[1,100],[100,1]]){const v=bb.easing(a,b,.1);assert.ok(v>Math.min(a,b)&&v<Math.max(a,b),'Autoscale easing must remain bounded and positive.');}
 const basicFixture=modelFixture(source.find(t=>t.id==='bolger'));
 try{
  assert.equal(source.find(t=>t.id==='bolger').sections.length,3);assert.equal(basicFixture.root.querySelectorAll('[data-wb-mode]').length,2);assert.equal(basicFixture.get('wv-frequency'),undefined,'Frequency is calculated, not independently adjustable.');
  basicFixture.change('wv-wavelength',2);basicFixture.change('wv-speed',6);assert.match(basicFixture.get('wv-travel-readout').textContent,/3 Hz/);
  const wavePath=()=>basicFixture.get('wv-travel').querySelectorAll('path').find(e=>e.getAttribute('stroke-width')==='3.5').getAttribute('d');
  basicFixture.tick(1);const before=wavePath();basicFixture.change('wv-speed',9);assert.equal(basicFixture.get('wv-wavelength').value,'2');assert.equal(wavePath(),before,'Changing speed keeps the current phase and wavelength continuous.');
  for(const button of ['wv-transverse','wv-longitudinal']){basicFixture.click(button);assert.equal(basicFixture.get(button).getAttribute('aria-pressed'),'true');}
  basicFixture.change('wv-harmonic',3);assert.match(basicFixture.get('wb-standing-readout').textContent,/3 buker/);assert.match(basicFixture.get('wb-standing-readout').textContent,/4 knuter/);
  basicFixture.click('wb-examples-open');basicFixture.click('wb-example-water-tab');basicFixture.change('wb-water-depth',.1);const orbit=()=>basicFixture.get('wv-water').querySelectorAll('circle').find(e=>e.getAttribute('stroke-dasharray')==='3 3');const shallow=+orbit().getAttribute('r');basicFixture.change('wb-water-depth',1.3);assert.ok(+orbit().getAttribute('r')<shallow);
  const travel=basicFixture.get('wv-travel'),particles=basicFixture.get('wv-particles');basicFixture.pause(travel);const travelBefore=travel.serialize(),particlesBefore=particles.serialize(),frozenTime=basicFixture.now(travel);basicFixture.tick(1.1);assert.equal(travel.serialize(),travelBefore,'Pausing the travel model freezes only that figure.');assert.notEqual(particles.serialize(),particlesBefore,'Other model clocks keep running.');basicFixture.change('wv-amplitude',1);assert.equal(basicFixture.now(travel),frozenTime);assert.notEqual(travel.serialize(),travelBefore,'Paused controls repaint the same simulation time.');basicFixture.pause(travel,false);basicFixture.tick(1.2);assert.ok(Math.abs(basicFixture.now(travel)-frozenTime-.1)<1e-10);
  for(const t of [2,20]){basicFixture.tick(t);assert.ok(!/NaN|Infinity|undefined/.test(basicFixture.html()));}
 }finally{basicFixture.destroy();}
 const radioFixture=modelFixture(source.find(t=>t.id==='radioaktivitet'));
 try{let radioTime=0;for(const item of iso.verifiedIsotopes.filter(x=>!x.stable)){radioFixture.change('ra-isotope-preset',item.z+','+item.n,'change');assert.equal(radioFixture.get('ra-nuclide-status').getAttribute('data-stability'),'radioactive');const before=radioFixture.get('ra-built-nucleus').getAttribute('transform');radioFixture.tick(radioTime+=.47);assert.notEqual(radioFixture.get('ra-built-nucleus').getAttribute('transform'),before);radioFixture.click('ra-builder-decay');const daughter=iso.getPreferredDecay(item.z,item.n).daughter;assert.equal(+radioFixture.get('ra-protons').value,daughter.z);assert.equal(+radioFixture.get('ra-neutrons').value,daughter.n);assert.equal(radioFixture.get('ra-nuclide-status').getAttribute('data-stability'),'stable');assert.equal(radioFixture.get('ra-builder-decay').disabled,true);}
  radioFixture.change('ra-isotope-preset','6,8','change');radioFixture.pause('#ra-decay-type');const frozenEmission=radioFixture.get('ra-emission').serialize(),movingNucleus=radioFixture.get('ra-built-nucleus').serialize();radioFixture.get('ra-half-run').checked=true;radioFixture.get('ra-half-run').dispatch('change');const halfBefore=+radioFixture.get('ra-half-time').value;radioFixture.tick(radioTime+=.1);assert.equal(radioFixture.get('ra-emission').serialize(),frozenEmission,'The decay animation pauses independently of the builder.');assert.notEqual(radioFixture.get('ra-built-nucleus').serialize(),movingNucleus);assert.ok(+radioFixture.get('ra-half-time').value>halfBefore,'Half-life keeps its own running clock.');
 }finally{radioFixture.destroy();}
 const {spectrumReadouts}=sourceModules['em-spectrum'];for(const region of [2,3,4])assert.match(spectrumReadouts(5e14,region).wavelength,/nm/);assert.match(spectrumReadouts(5e14,3).energy,/J$/);assert.ok(!/eV/.test(spectrumReadouts(5e14,3).energy));
 const comm=modelFixture(source.find(t=>t.id==='kommunikasjon'));
 try{for(const stage of ['auto','0','1','2','3','4','5'])comm.change('ema-flow-stage',stage,'change');for(const direction of ['a-b','b-a'])for(const route of ['direct','reflection']){comm.change('ema-network-direction',direction,'change');comm.change('ema-network-path',route,'change');comm.tick(.8);assert.ok(!/NaN|Infinity|undefined/.test(comm.html()));}
  const signalTime=comm.now('#ema-signal-plot');assert.ok(signalTime>0);comm.pause('#ema-signal-plot');const signalBefore=comm.get('ema-signal-plot').serialize(),networkBefore=comm.get('ema-network-plot').serialize();comm.tick(.9);assert.equal(comm.get('ema-signal-plot').serialize(),signalBefore);assert.equal(comm.now('#ema-signal-plot'),signalTime);assert.ok(comm.now('#ema-network-plot')>signalTime);assert.notEqual(comm.get('ema-network-plot').serialize(),networkBefore,'Pausing the encoding waveform does not pause the radio network.');
 }finally{comm.destroy();}
 const revisionGroups=await require('./bolger-straling-revision.cjs').runRevisionChecks({modelFixture,topics:source});
 assert.ok(revisionGroups.length>=8);
 console.log('Source/model checks passed: 9 distinct topics, 125 questions; 3 published topics, 39 questions; 26 numeric exercises; independent model pause/repaint, Snell constraints, retarded Doppler, swing modes and outcomes, primary/secondary rainbow, atom cascades, isotope decay and absolute Planck units.');
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
 const data=await page.evaluate(async urls=>{const modules=await Promise.all(urls.map(url=>import(url)));return modules.flatMap(m=>m.topics??[m.emTopic]).map(t=>({id:t.id,title:t.title,sections:t.sections.length,questions:t.questions,terms:t.terms.length}));},moduleNames.map(browserModuleUrl));
 await attempt('Complete, distinct, well-formed question data',async()=>{
 assert.equal(data.length,9);const seen=new Set();for(const t of data){assert.ok(t.sections>0&&t.terms>0);assert.ok(t.questions.length>=10,t.id);for(const q of t.questions){assert.ok(!seen.has(q.id),'duplicate '+q.id);seen.add(q.id);assert.ok(q.prompt&&q.answer,q.id);assert.ok(['mcq','number','open'].includes(q.type),q.id);if(q.type==='mcq')assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,q.id);if(q.type==='number')assertNumericQuestion(q);}}});
 async function route(id,view='fagstoff'){await page.goto(url+'#'+id+'/'+view);await page.locator('#topic-content').waitFor();await page.waitForTimeout(70);}
 for(const id of prototypeIds)for(const view of ['fagstoff','oppgaver','begreper'])await attempt('Desktop render '+id+'/'+view,async()=>{
 await route(id,view);assert.ok((await page.locator('h1').innerText()).trim());assert.equal(await page.locator('#main').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'main content overflow');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'document overflow');assert.equal(await page.locator('#animation-speed,#pause-button,.viewbar,.page-head .eyebrow,.page-head .intro,.head-icon').count(),0,'No repeated topic introduction or global animation toolbar');if(view==='fagstoff')assert.ok(await page.locator('.content-section').count());else if(view==='oppgaver')assert.equal(await page.locator('.q-card').count(),data.find(t=>t.id===id).questions.length);});
 // Exercise controls with reduced-motion enabled, so changes cannot be attributed to animation alone.
 for(const id of prototypeIds)await attempt('Working controls '+id,async()=>{
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
 await attempt('Wave relations remain consistent',async()=>{await route('bolger');await page.locator('#wv-wavelength').fill('2');await page.locator('#wv-wavelength').dispatchEvent('input');await page.locator('#wv-speed').fill('6');await page.locator('#wv-speed').dispatchEvent('input');assert.match(await page.locator('#wv-travel-readout').innerText(),/3 Hz/);assert.equal(await page.locator('#wv-frequency').count(),0);});
 await attempt('Refraction, interference and Doppler numerical outputs',async()=>{
 await route('fenomener');await page.locator('#wv-angle').fill('35');await page.locator('#wv-angle').dispatchEvent('input');assert.match(await page.locator('#wv-reflection-readout').innerText(),/35/);
 await page.locator('#wv-interference-antiphase').click();assert.match(await page.locator('#wv-interference-readout').innerText(),/utslokking|kanseller|destruktiv/i);assert.equal(await page.locator('#wv-lambda1,#wv-lambda2').count(),0);await page.locator('#wv-interference-inphase').click();assert.match(await page.locator('#wv-interference-readout').innerText(),/forsterkning|konstruktiv/i);
 await page.locator('#fd-mach').fill('1');await page.locator('#fd-mach').dispatchEvent('input');assert.ok((await page.locator('#fd-status').innerText()).length>10);await page.locator('#rf-medium-top').selectOption('water');await page.locator('#rf-medium-bottom').selectOption('air');await page.locator('#rf-angle').fill('65');await page.locator('#rf-angle').dispatchEvent('input');assert.match(await page.locator('#rf-status').innerText(),/totalrefleksjon/i);
 });
 await attempt('Resonance and Doppler comparisons share their section tabs',async()=>{
  await route('fenomener');
  await page.locator('#resonance-tab-swing').press('ArrowRight');
  await page.locator('.tf-stage #tf-source').waitFor();
  await page.locator('.tf-stage #tf-receiver').selectOption('523');
  assert.equal(await page.locator('#resonance-tab-forks').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#wv-resonance').isVisible(),false);
  await page.locator('#resonance-tab-forks').press('Home');
  assert.equal(await page.locator('#wv-resonance').isVisible(),true);
  await page.locator('#doppler-tab-light').click();
  await page.locator('#ld-scene').waitFor();
  assert.equal(await page.locator('#fd-scene').isVisible(),false);
  assert.equal(await page.locator('#ld-wavelength-A').getAttribute('data-shift'),'blue');
  assert.equal(await page.locator('#ld-wavelength-B').getAttribute('data-shift'),'red');
  await page.locator('#ld-direction-A').selectOption('1');
  assert.equal(await page.locator('#ld-wavelength-A').getAttribute('data-shift'),'red');
  await page.locator('#doppler-tab-sound').click();
  assert.equal(await page.locator('#fd-scene').isVisible(),true);
 });
 await attempt('Atomic transition wavelength and half-life expectation',async()=>{
 await route('atomer');await page.locator('#al-h-upper').selectOption('3');await page.locator('#al-h-lower').selectOption('2');assert.match(await page.locator('#al-h-readout').innerText(),/656/);
 await route('radioaktivitet');await page.locator('#ra-half-time').fill('3');await page.locator('#ra-half-time').dispatchEvent('input');assert.match(await page.locator('#ra-half-expected').innerText(),/25/);assert.equal(await page.locator('.ra-decayed').count()+await page.locator('.ra-population i:not(.ra-decayed)').count(),200);
 });
 await attempt('Photon energy threshold is reflected in the displayed ionization state',async()=>{await route('atomer');for(const [energy,state]of [['2.1','bound'],['2.18','ionized'],['3','ionized']]){await page.locator('#ema-ion-energy').fill(energy);await page.locator('#ema-ion-energy').dispatchEvent('input');assert.equal(await page.locator('#ema-ion-plot').getAttribute('data-state'),'neutral');await page.locator('#ema-ion-send').click();assert.equal(await page.locator('#ema-ion-plot').getAttribute('data-state'),state);await page.locator('#ema-ion-reset').click();assert.equal(await page.locator('#ema-ion-plot').getAttribute('data-state'),'neutral');}});
 const qAll=data.filter(t=>prototypeIds.includes(t.id)).flatMap(t=>t.questions.map(q=>({...q,topic:t.id})));
 const mcq=qAll.find(q=>q.type==='mcq'),num=qAll.find(q=>q.type==='number'),open=qAll.find(q=>q.type==='open');
 const card=q=>page.locator('[data-question="'+q.id+'"]');
 await attempt('MCQ feedback and mastery persist',async()=>{await route(mcq.topic,'oppgaver');await card(mcq).locator('[data-choice="'+mcq.correct+'"]').click();await card(mcq).locator('.q-status').waitFor();assert.match(await card(mcq).locator('.feedback').innerText(),/Riktig/);await page.reload();await card(mcq).locator('.q-status').waitFor();});
 await attempt('Numeric answer handles comma and wrong/empty values',async()=>{await route(num.topic,'oppgaver');const c=card(num);await c.locator('input').fill('');await c.locator('button[type=submit]').click();assert.match(await c.locator('.feedback').innerText(),/tall/);await c.locator('input').fill(String(num.value+1000));await c.locator('button[type=submit]').click();assert.equal(await c.locator('.q-status').isVisible(),false);await c.locator('input').fill(String(num.value).replace('.',','));await c.locator('button[type=submit]').click();assert.match(await c.locator('.feedback').innerText(),/Riktig/);await page.reload();await c.locator('.q-status').waitFor();assert.equal(await c.locator('input').inputValue(),String(num.value).replace('.',','));});
 await attempt('Both wave calculations check each field and preserve drafts',async()=>{
  await route('bolger','oppgaver');
  assert.equal(await page.locator('#question-summary').count(),0);
  for(const [id,values] of [['wv-b13',['0,67','1,5']],['wv-b14',['2','3','4','0,25','0,50']]]){
   const exercise=card({id}),inputs=exercise.locator('input');
   assert.equal(await inputs.count(),values.length);
   await inputs.first().fill(values[0]);
   await exercise.getByRole('button',{name:'Sjekk',exact:true}).click();
   assert.equal(await exercise.locator('.q-number-result').first().innerText(),'Riktig');
   assert.equal(await exercise.locator('.solution').isVisible(),false);
   for(let i=1;i<values.length;i++)await inputs.nth(i).fill(values[i]);
   await exercise.getByRole('button',{name:'Sjekk',exact:true}).click();
   assert.equal(await exercise.locator('.q-number-result[data-correct=true]').count(),values.length);
   await exercise.locator('.q-status').waitFor();
   await page.reload();
   await exercise.locator('.q-status').waitFor();
   for(let i=0;i<values.length;i++)assert.equal(await inputs.nth(i).inputValue(),values[i]);
  }
 });
 await attempt('Open draft, solution, self-assessment and bookmark persist',async()=>{await route(open.topic,'oppgaver');const c=card(open);await c.locator('textarea').fill('Mitt faglige svar.');await c.locator('.show-answer').click();assert.ok(await c.locator('.solution').isVisible());await c.locator('[data-self="again"]').click();assert.equal(await c.locator('.q-bookmark').getAttribute('aria-pressed'),'true');await page.reload();assert.equal(await c.locator('textarea').inputValue(),'Mitt faglige svar.');assert.equal(await c.locator('.q-bookmark').getAttribute('aria-pressed'),'true');});
 await attempt('All questions search, type/topic filters and bookmark list',async()=>{await route('alle','oppgaver');assert.equal(await page.locator('.q-card').count(),qAll.length);await page.locator('#question-type').selectOption('number');assert.equal(await page.locator('.q-card').count(),qAll.filter(q=>q.type==='number').length);await page.locator('#question-type').selectOption('');await page.locator('#question-search').fill('sjeldenord_ingen');assert.equal(await page.locator('.q-card').count(),0);await page.locator('#question-search').fill('');await page.locator('#bookmark-filter').click();assert.ok(await page.locator('.q-card').count()>=1);await page.locator('#bookmark-filter').click();assert.equal(await page.locator('#question-topic option[value="em"]').count(),0);await page.locator('#question-topic').selectOption('atomer');assert.equal(await page.locator('.q-card').count(),data.find(t=>t.id==='atomer').questions.length);});
 await attempt('Automatic graphics respect reduced-motion preference',async()=>{await route('fenomener');const svg=page.locator('#wv-interference');const before=await svg.innerHTML();await page.waitForTimeout(180);assert.equal(await svg.innerHTML(),before);await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();const moving=await svg.innerHTML();await page.waitForTimeout(180);assert.notEqual(await svg.innerHTML(),moving);await page.emulateMedia({reducedMotion:'reduce'});await page.reload();const frozen=await svg.innerHTML();await page.waitForTimeout(180);assert.equal(await svg.innerHTML(),frozen);});
 await attempt('Each animated figure has an independent pause button',async()=>{await page.emulateMedia({reducedMotion:'no-preference'});await route('bolger');const travel=page.locator('#wv-travel'),particles=page.locator('#wv-particles');await travel.evaluate(el=>el.closest('.model').querySelector('.animation-toggle').click());const stopped=await travel.innerHTML(),moving=await particles.innerHTML();await page.waitForTimeout(180);assert.equal(await travel.innerHTML(),stopped);assert.notEqual(await particles.innerHTML(),moving);assert.equal(await travel.evaluate(el=>el.closest('.model').querySelector('.animation-toggle').getAttribute('aria-pressed')),'true');await travel.evaluate(el=>el.closest('.model').querySelector('.animation-toggle').click());await page.waitForTimeout(180);assert.notEqual(await travel.innerHTML(),stopped);await page.emulateMedia({reducedMotion:'reduce'});});
 await attempt('Dark theme survives reload',async()=>{await page.locator('#theme-button').click();assert.ok(await page.locator('body.dark').count());await page.reload();assert.ok(await page.locator('body.dark').count());await page.locator('#theme-button').click();});
 await attempt('Keyboard skip link preserves the current topic',async()=>{await route('atomer');const before=page.url();await page.locator('.skip').focus();await page.keyboard.press('Enter');assert.equal(page.url(),before);assert.equal(await page.evaluate(()=>document.activeElement.id),'main');});
 for(const width of [390,320])for(const id of prototypeIds)await attempt('Mobile '+width+' '+id,async()=>{await page.setViewportSize({width,height:844});await route(id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'document overflow');await route(id,'oppgaver');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'bank overflow');});
 await attempt('Mobile navigation opens/closes and route is keyboard reachable',async()=>{await page.setViewportSize({width:390,height:844});await route('atomer');await page.locator('#menu-button').click();assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');await page.locator('#menu-button').click();await page.locator('[data-route="atomer/oppgaver"]').first().click();await page.locator('.q-card').first().waitFor();assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');});
 await attempt('Published spectrum and existing deep links',async()=>{
  const spectrum=data.find(t=>t.id==='em');
  await page.goto(url+'?legacy-link=1#em/oppgaver');
  await page.waitForURL(/\/naturfag(?:\.html)?#waves\/em\/oppgaver$/);
  const content=page.frameLocator('#waves-module-frame');
  await content.locator('.q-card').first().waitFor();
  assert.equal(await content.locator('.q-card').count(),spectrum.questions.length);
  for(const width of [320,390,1440]){
   await page.setViewportSize({width,height:844});
   await page.goto(base+'/naturfag.html#waves/em/fagstoff');
   await content.locator('.content-section').first().waitFor();
   assert.equal(await content.locator('main').evaluate(e=>e.scrollWidth>e.clientWidth+1),false,'published spectrum overflow');
  }
  await content.locator('.abs-stage #abs-light').selectOption('blue');
  await content.locator('.abs-stage #abs-surface').selectOption('white');
  assert.match(await content.locator('#abs-readout').innerText(),/Reflektert:\s*bl/);
  await content.locator('#ld-one').click();
  await content.locator('#ld-count').filter({hasText:/^1$/}).waitFor();
  await page.goto(base+'/naturfag.html#waves/em/begreper');
  await content.locator('.term').first().waitFor();
  assert.equal(await content.locator('.term').count(),spectrum.terms);
 });
 await page.setViewportSize({width:1440,height:1000});await page.goto(url+'#oversikt');await page.screenshot({path:path.join(shots,'overview-desktop.png'),fullPage:true});
 await route('fenomener');await page.screenshot({path:path.join(shots,'phenomena-desktop.png'),fullPage:true});
 await route('radioaktivitet');await page.screenshot({path:path.join(shots,'radioactivity-desktop.png'),fullPage:true});
 await route('universet');await page.locator('#theme-button').click();await page.screenshot({path:path.join(shots,'universe-dark.png'),fullPage:true});await page.locator('#theme-button').click();
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/naturfag.html#waves/em/fagstoff');await page.frameLocator('#waves-module-frame').locator('.content-section').first().waitFor();await page.screenshot({path:path.join(shots,'em-mobile.png'),fullPage:true});
 if(errors.length)failures.push('Browser errors: '+errors.join('\n'));
 const report={topics:data.map(t=>({id:t.id,questions:t.questions.length,sections:t.sections,terms:t.terms})),totalQuestions:qAll.length,passed:coverage.length,failures,warnings,shots};
 fs.writeFileSync(path.join(shots,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
