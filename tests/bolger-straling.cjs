const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let pw;if(!process.argv.includes('--data-only')){for(const candidate of [process.env.PLAYWRIGHT_MODULE,'playwright',path.resolve(path.dirname(process.execPath),'../node_modules/playwright')].filter(Boolean)){try{pw=require(candidate);break;}catch{}}if(!pw)throw Error('Set PLAYWRIGHT_MODULE to an installed Playwright module.');}
const root=path.resolve(__dirname,'..'),shots=path.resolve(root,'../research/bolger-straling-qa');
const ids=['bolger','fenomener','em','atomer','universet','kommunikasjon','radioaktivitet','stralevern','atmosfaeren'];
const moduleNames=['wave-basics','waves','em-spectrum','atom-topic','communication','radioactivity','cosmos-environment'];
const prototypeIds=ids.filter(id=>id!=='em'&&id!=='atomer');
const bankFigureAttributes={bolger:'data-wave-basics-figure',fenomener:'data-phenomenon-figure',em:'data-em-figure',atomer:'data-atom-figure'};
const physicsOneQuestions=['atom-05','atom-12','atom-13','atom-14'];
const {publishedIds,modulePath,moduleUrl,browserModuleUrl,rendererPath}=require('./bolger-straling-paths.cjs');
const errors=[],failures=[],warnings=[],coverage=[];
let fixtureClockFactory;
// A limited DOM fixture for running the actual model controllers and examining
// generated SVG geometry. It does not claim browser/layout verification.
function modelFixture(topic,{reducedMotion=true}={}){
 const elements=[],idMap=new Map(),callbacks=[];let time=0;
 const decode=s=>String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 const attrMap=s=>{const a={};for(const m of s.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))a[m[1]]=decode(m[2]??m[3]??m[4]??'');return a;};
 function matches(el,selector){
  if(selector.trim().endsWith(':checked')&&!el.checked)return false;
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
  get ownerDocument(){return global.document;}
  get parentElement(){return this.parent;}
  get lastElementChild(){return this.children.at(-1)??null;}
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
 const previous={document:global.document,matchMedia:global.matchMedia,window:global.window,ResizeObserver:global.ResizeObserver};
 const restore=()=>Object.assign(global,previous);
 const documentEvents={};
 global.document={hidden:false,addEventListener(k,fn){(documentEvents[k]??=[]).push(fn);},removeEventListener(k,fn){documentEvents[k]=(documentEvents[k]||[]).filter(f=>f!==fn);},createElementNS:(_,tag)=>new Element(tag),createElement:tag=>new Element(tag),querySelector:s=>root.querySelector(s),getElementById:id=>idMap.get(id)};
 global.matchMedia=()=>({matches:reducedMotion,addEventListener(){},removeEventListener(){}});global.window={matchMedia:global.matchMedia};
 global.ResizeObserver=class{observe(){}disconnect(){}};
 const clock=fixtureClockFactory?.();
 const scope=target=>{const node=typeof target==='string'?root.querySelector(target):target;return node?.closest('.model')||node||root;};
 const api={onFrame(fn,target){if(clock)return clock.onFrame(fn,scope(target));callbacks.push(fn);fn(time);return()=>callbacks.splice(callbacks.indexOf(fn),1);},repaint(target){if(clock){if(arguments.length)clock.repaint(scope(target));else clock.repaint();}else callbacks.forEach(fn=>fn(time));},now:target=>clock?clock.now(scope(target)):time,isPaused:target=>clock?clock.isPaused(scope(target)):false,play(target){clock?.setPaused(scope(target),false);}};
 let cleanup;try{cleanup=topic.mount(root,api);}catch(e){restore();throw e;}
 return{root,get:id=>idMap.get(id),dispatchDocument(k,init={}){for(const fn of documentEvents[k]||[])fn({target:global.document,preventDefault(){},...init});},tick(t){if(clock)clock.advance(t-time);time=t;if(!clock)api.repaint();},pause(target,value=true){assert.ok(clock,'Scoped fixture clock is configured');clock.setPaused(scope(target),value);},now:target=>api.now(target),change(id,value,event='input'){const el=idMap.get(id);assert.ok(el,'Missing control '+id);el.value=value;el.dispatch(event);},click(id){const el=idMap.get(id);assert.ok(el,'Missing button '+id);el.dispatch('click');},html:()=>root.serialize(),destroy(){try{if(cleanup)cleanup();if(clock)clock.clear();}finally{restore();}}};
}
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.join(root,pathname);
  // GitHub Pages serves /naturfag from naturfag.html alongside the naturfag directory.
  if(!pathname.endsWith('/')&&!path.extname(file)&&fs.existsSync(file+'.html'))file+='.html';
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404);res.end('missing');}
});
async function attempt(label,fn){try{await fn();coverage.push(label);}catch(e){failures.push(label+': '+e.message);console.error('FAIL '+label+': '+e.message);}}
function assertNumericQuestion(q){
 if(q.fields)assert.ok(q.fields.length>1&&q.fields.every(field=>field.label&&field.unit),q.id);
 for(const field of q.fields??[q])assert.ok(Number.isFinite(field.value)&&(field.tolerance===undefined||field.tolerance>=0),q.id);
}
(async()=>{
 const source=[],sourceModules={};for(const file of moduleNames){sourceModules[file]=await import(moduleUrl(file));const m=sourceModules[file];source.push(...(m.topics??[m.emTopic??m.atomTopic]));}
 assert.deepEqual(source.map(t=>t.id).sort(),ids.slice().sort());
 const unique=new Set(),numeric=new Map();
 for(const t of source){assert.ok(t.sections.length&&t.terms.length&&t.questions.length>=10,t.id);for(const q of t.questions){assert.ok(!unique.has(q.id)&&q.prompt&&q.answer,q.id);unique.add(q.id);assert.ok(['mcq','number','open'].includes(q.type),q.id);if(q.type==='mcq')assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,q.id);if(q.type==='number'){assertNumericQuestion(q);numeric.set(q.id,q);}}}
 const expected={'wv-b3':5/2,'wv-b4':1/2.5,'wv-b5':345/440,'wv-b6':4/2,'wv-b9':340*3,'wv-f1':35,'wv-f6':3+3,'em-03':3e8/1e8,'em-04':3e8/(500e-9)/1e14,'atom-05':-.24-(-.54),'atom-12':6.63e-34*5e14/1e-19,'com-04':5*8,'com-10':36000/300000,'ra-q2':220-85,'ra-q9':Math.log2(40/5)*5730,'ra-q10':3000*2**(-12/4),'ra-q11':Math.log2(100/6.25)*5730,'ra-q16':1000*2**(-360/24),'sv-q7':250*20,'sv-q8':2.5*1000,'ce-u-06':2898000/6000,'ce-u-09':656*1.1,'ce-a-08':340*(1-.3),'ce-a-09':238-230};
 for(const [id,value]of Object.entries(expected)){const q=numeric.get(id);assert.ok(q,id);assert.ok(Math.abs(q.value-value)<1e-8*Math.max(1,Math.abs(value)),id+' incorrect answer');}
 assert.deepEqual(numeric.get('wv-b13').fields.map(field=>field.value),[10/15,1.5]);
 assert.deepEqual(numeric.get('wv-b14').fields.map(field=>field.value),[2,3,4,.25,.5]);
 const originalIds=[...Array.from({length:12},(_,i)=>'wv-b'+(i+1)),...Array.from({length:14},(_,i)=>'wv-f'+(i+1)),...['em','atom','com'].flatMap(p=>Array.from({length:12},(_,i)=>p+'-'+String(i+1).padStart(2,'0'))),...Array.from({length:16},(_,i)=>'ra-q'+(i+1)),...Array.from({length:17},(_,i)=>'sv-q'+(i+1)),...['ce-u','ce-a'].flatMap(p=>Array.from({length:14},(_,i)=>p+'-'+String(i+1).padStart(2,'0')))];
 assert.deepEqual([...unique].sort(),[...originalIds,'wv-b13','wv-b14','atom-13','atom-14','atom-15','atom-16'].sort(),'Preserve existing questions and add the new exercises.');
 assert.equal(unique.size,129);
 const publicTopics=source.filter(t=>publishedIds.includes(t.id));
 assert.deepEqual(publicTopics.map(t=>t.id),publishedIds);
 assert.deepEqual(publicTopics.map(t=>t.questions.length),[13,12,14,16]);
 for(const topic of publicTopics)for(const question of topic.questions){
  const figureAttribute=bankFigureAttributes[topic.id];
  assert.match(question.figure,new RegExp('<svg[^>]*'+figureAttribute+'="'+question.id+'"'));
  assert.match(question.figure,/<desc\b[^>]*>[^<]+<\/desc>|aria-label="[^"]+"/);
 }
 for(const topic of publicTopics)assert.ok(!topic.terms.some(t=>/knut|\bbuk/i.test(t.term)),'Buk and knute are excluded from the published concept lists.');
 for(const [questionId,topicId] of [['wv-b8','em'],['wv-f3','em'],['wv-f13','universet']])assert.equal(source.find(t=>t.questions.some(q=>q.id===questionId))?.id,topicId,'Moved question belongs to its current teaching topic: '+questionId);
 const standingTask=publicTopics[0].questions.find(q=>q.id==='wv-b11');assert.ok(standingTask&&!/knut|\bbuk/i.test(standingTask.prompt+' '+standingTask.answer),'Standing-wave reasoning does not require the excluded glossary terms.');
 const publicEntry=fs.readFileSync(path.join(root,'naturfag/bolger-straling/entry.js'),'utf8');
 assert.deepEqual([...publicEntry.matchAll(/import \{(?:topics as \w+|emTopic|atomTopic)\} from ['"]([^'"]+)['"]/g)].map(m=>m[1].split('?')[0]).sort(),['./atom-topic.js','./em-spectrum.js','./wave-basics.js','./waves.js'],'The published entry imports exactly the four released topic modules.');
 const {atomTopic}=sourceModules['atom-topic'];
 assert.equal(atomTopic.id,'atomer');
 assert.equal(atomTopic.sections[0].title,'Spekteret til hydrogen');
 assert.equal(atomTopic.sections.length,4);
 assert.ok(atomTopic.sections.every(section=>!/Nordlyset forteller|Kan ett foton ionisere/.test(section.title)));
 assert.equal(atomTopic.resources.filter(resource=>new URL(resource.url).hostname==='ndla.no').length,3);
 assert.deepEqual(atomTopic.questions.slice(-4).map(question=>question.id),physicsOneQuestions);
 assert.deepEqual(atomTopic.questions.filter(question=>question.course==='Fysikk 1').map(question=>question.id),physicsOneQuestions);
 const discharge=atomTopic.questions.find(question=>question.id==='atom-08');
 assert.equal(discharge.type,'open');
 assert.match(discharge.prompt,/gass(?:en)? i røret|gassrør/i);
 assert.deepEqual(sourceModules.communication.topics.map(t=>t.id),['kommunikasjon'],'Only communication remains in this prototype module.');
 const prototypeEntry=fs.readFileSync(path.join(root,'prototyper/bolger-straling/app.js'),'utf8');
 assert.match(prototypeEntry,/naturfag\/bolger-straling\/wave-basics\.js/);assert.match(prototypeEntry,/naturfag\/bolger-straling\/waves\.js/);
 for(const file of ['wave-basics.js','waves.js','em-spectrum.js','absorption.js','em-atoms.js','atom-lab.js','element-spectra.js','element-spectra-data.js'])assert.ok(!fs.existsSync(path.join(root,'prototyper/bolger-straling',file)),'Published modules have one canonical source: '+file);
 const appSource=fs.readFileSync(rendererPath,'utf8');
 assert.ok(!appSource.includes('animation-speed'),'The global animation-speed control was removed.');
 assert.ok(!appSource.includes('id="pause-button"'),'The global pause control was removed.');
 assert.ok(!appSource.includes('class="filterbar"'),'Exercise banks omit the filters.');
 assert.ok(!appSource.includes('Begrepene du trenger for å forklare sammenhengene.'),'Concept lists start directly with the terms.');
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
  const wave2d=basicFixture.get('wv-particles'),wave3d=basicFixture.get('wv-spatial');
  assert.strictEqual(wave2d.closest('.model'),wave3d.closest('.model'));
  assert.strictEqual(basicFixture.get('wv-show-2d').closest('.wb-wave-stage'),wave2d.closest('.wb-wave-stage'));
  assert.equal(wave2d.hasAttribute('hidden'),false);
  assert.equal(wave3d.hasAttribute('hidden'),true);
  basicFixture.click('wv-show-3d');
  assert.equal(basicFixture.get('wv-show-3d').getAttribute('aria-pressed'),'true');
  assert.equal(wave2d.hasAttribute('hidden'),true);
  assert.equal(wave3d.hasAttribute('hidden'),false);
  assert.equal(basicFixture.get('wv-longitudinal').getAttribute('aria-pressed'),'true','The selected wave type survives switching views.');
  assert.equal(basicFixture.now(wave2d),basicFixture.now(wave3d),'Both views use the same clock.');
  basicFixture.click('wv-show-2d');
  assert.equal(basicFixture.get('wv-show-2d').getAttribute('aria-pressed'),'true');
  assert.equal(wave2d.hasAttribute('hidden'),false);
  assert.equal(wave3d.hasAttribute('hidden'),true);
  assert.equal(basicFixture.get('wv-sound').tagName,'CANVAS');
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
 const {skyScatteringState}=await import('../naturfag/bolger-straling/sky-scattering.js');
 let previous=skyScatteringState(90).direct;
 for(const elevation of [60,30,10,5,0]){
  const {direct}=skyScatteringState(elevation);
  assert.ok(direct.every((amount,i)=>amount>0&&amount<previous[i]),'Less direct light reaches the observer when the sun is lower.');
  assert.ok(direct[2]<direct[1]&&direct[1]<direct[0],'Molecular scattering removes more blue than red light from the direct beam.');
  previous=direct;
 }
 const spectrumFixture=modelFixture(source.find(t=>t.id==='em'));
 try{
  const slider=spectrumFixture.get('ema-wavelength');
  const graph=spectrumFixture.get('ema-spectrum-plot');
  const ionizing=spectrumFixture.get('ema-ionizing-toggle');
  const note=spectrumFixture.get('ema-ionizing-note');
  assert.equal(slider.getAttribute('dir'),null);
  assert.match(slider.getAttribute('aria-valuetext'),/nm$/);
  const markerX=()=>Number(graph.innerHTML.match(/class="ema-wavelength-marker" d="M([\d.]+)/)[1]);
  const energy=()=>{
   const value=spectrumFixture.get('ema-energy-output');
   return Number(value._text.match(/^[\d,]+/)[0].replace(',','.'))*10**Number(value.children[0].textContent);
  };
  spectrumFixture.change('ema-wavelength','-8');
  const shortX=markerX(),highEnergy=energy();
  spectrumFixture.change('ema-wavelength','-5');
  assert.ok(markerX()>shortX,'Longer wavelengths move the marker right.');
  assert.ok(energy()<highEnergy,'Longer wavelengths carry less energy per photon.');
  assert.ok(note.hidden);
  assert.equal(graph.querySelector('.ema-ionizing-range'),null);
  spectrumFixture.click('ema-ionizing-toggle');
  assert.equal(ionizing.getAttribute('aria-pressed'),'true');
  assert.ok(!note.hidden);
  const band=graph.querySelector('.ema-ionizing-range');
  assert.match(band.textContent,/124 nm/);
  assert.ok(Number(band.querySelector('rect').getAttribute('width'))>shortX-14);
  spectrumFixture.click('ema-ionizing-toggle');
  assert.ok(note.hidden);
  assert.equal(graph.querySelector('.ema-ionizing-range'),null);
  assert.ok(!spectrumFixture.root.querySelector('details.ld-more').hasAttribute('open'));
  assert.ok(spectrumFixture.get('ld-pe-scene'));
  let photoTime=0;
  for(const [nm,intensity,emitted] of [[650,5,0],[440,1,2],[440,5,10]]){
   spectrumFixture.change('ld-pe-wavelength',nm,'change');
   spectrumFixture.change('ld-pe-intensity',intensity);
   spectrumFixture.click('ld-pe-run');
   for(let step=0;step<24;step++)spectrumFixture.tick(photoTime+=.1);
   assert.equal(Number(spectrumFixture.get('ld-pe-count').textContent),emitted);
  }
  const sky=spectrumFixture.get('sky-dialog'),launcher=spectrumFixture.get('sky-open');
  spectrumFixture.click('sky-open');
  assert.equal(sky.open,true);
  assert.equal(launcher.getAttribute('aria-expanded'),'true');
  const sun=spectrumFixture.get('sky-sun'),disc=spectrumFixture.get('sky-disc'),path=spectrumFixture.get('sky-beam-direct');
  const before=[sun.getAttribute('transform'),disc.getAttribute('fill'),path.getAttribute('x1')];
  spectrumFixture.change('sky-elevation','0');
  assert.match(spectrumFixture.get('sky-angle').textContent,/0°/);
  assert.ok([sun.getAttribute('transform'),disc.getAttribute('fill'),path.getAttribute('x1')].every((value,i)=>value!==before[i]));
  spectrumFixture.click('sky-close');
  assert.equal(sky.open,false);
  assert.equal(launcher.getAttribute('aria-expanded'),'false');
 }finally{spectrumFixture.destroy();}
 const comm=modelFixture(source.find(t=>t.id==='kommunikasjon'));
 try{for(const stage of ['auto','0','1','2','3','4','5'])comm.change('ema-flow-stage',stage,'change');for(const direction of ['a-b','b-a'])for(const route of ['direct','reflection']){comm.change('ema-network-direction',direction,'change');comm.change('ema-network-path',route,'change');comm.tick(.8);assert.ok(!/NaN|Infinity|undefined/.test(comm.html()));}
  const signalTime=comm.now('#ema-signal-plot');assert.ok(signalTime>0);comm.pause('#ema-signal-plot');const signalBefore=comm.get('ema-signal-plot').serialize(),networkBefore=comm.get('ema-network-plot').serialize();comm.tick(.9);assert.equal(comm.get('ema-signal-plot').serialize(),signalBefore);assert.equal(comm.now('#ema-signal-plot'),signalTime);assert.ok(comm.now('#ema-network-plot')>signalTime);assert.notEqual(comm.get('ema-network-plot').serialize(),networkBefore,'Pausing the encoding waveform does not pause the radio network.');
 }finally{comm.destroy();}
 const revisionGroups=await require('./bolger-straling-revision.cjs').runRevisionChecks({modelFixture,topics:source});
 assert.ok(revisionGroups.length>=8);
 console.log('Source/model checks passed: 9 distinct topics, 129 questions; 4 published topics, 55 questions; 26 numeric exercises; independent model pause/repaint, Snell constraints, retarded Doppler, swing modes and outcomes, primary/secondary rainbow, atom cascades, isotope decay and absolute Planck units.');
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
 const data=await page.evaluate(async urls=>{const modules=await Promise.all(urls.map(url=>import(url)));return modules.flatMap(m=>m.topics??[m.emTopic??m.atomTopic]).map(t=>({id:t.id,title:t.title,sections:t.sections.length,questions:t.questions,terms:t.terms.length}));},moduleNames.map(browserModuleUrl));
 await attempt('Complete, distinct, well-formed question data',async()=>{
 assert.equal(data.length,9);const seen=new Set();for(const t of data){assert.ok(t.sections>0&&t.terms>0);assert.ok(t.questions.length>=10,t.id);for(const q of t.questions){assert.ok(!seen.has(q.id),'duplicate '+q.id);seen.add(q.id);assert.ok(q.prompt&&q.answer,q.id);assert.ok(['mcq','number','open'].includes(q.type),q.id);if(q.type==='mcq')assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,q.id);if(q.type==='number')assertNumericQuestion(q);}}});
 async function route(id,view='fagstoff'){await page.goto(url+'#'+id+'/'+view);await page.locator('#topic-content').waitFor();await page.waitForTimeout(70);}
 const besideHydrogenModes=panel=>panel.evaluate(el=>{
  const bounds=el.getBoundingClientRect();
  const modes=el.closest('#hs-model').querySelector('.hs-modes').getBoundingClientRect();
  return bounds.left>=modes.right-1&&bounds.top<modes.bottom&&bounds.bottom>modes.top;
 });
 const drawingBounds=(origin,selectors)=>origin.evaluate((el,ids)=>{
  const base=el.getBoundingClientRect();
  return ids.map(selector=>{
   const box=el.querySelector(selector).getBoundingClientRect();
   return [box.x-base.x,box.y-base.y,box.width,box.height].map(Math.round);
  });
 },selectors);
 async function hydrogenSeries(mode,{difficulty}={}){
  await page.goto(base+'/naturfag.html?hydrogen='+mode+'#waves/atomer/fagstoff');
  const topic=page.frameLocator('#waves-module-frame');
  const model=topic.locator('#hs-model');
  await model.locator('[data-series-mode="all"]').waitFor();
  const board=model.locator('#hs-board'),spectrum=model.locator('#hs-spectrum');
  const chooser=topic.locator('#hs-quiz-options[open]');
  const selectMode=value=>model.locator('[data-series-mode="'+value+'"]').click();
  const selectDifficulty=value=>chooser.locator('[data-series-difficulty="'+value+'"]').click();
  const targets=part=>model.locator('[data-series-action="transition"][data-series-part="'+part+'"]');
  const target=(part,key)=>targets(part).and(model.locator('[data-series-key="'+key+'"]'));
  const lineKeys=()=>spectrum.locator('[data-series-line]').evaluateAll(lines=>lines.map(line=>line.dataset.seriesLine).sort());
  const phase=value=>topic.locator('#hs-model[data-phase="'+value+'"]').waitFor();
  if(mode!=='all')await selectMode(mode);
  if(difficulty)await selectDifficulty(difficulty);
  return {topic,model,board,spectrum,chooser,selectMode,selectDifficulty,targets,target,lineKeys,phase};
 }
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
  assert.equal(await page.locator('#ld-direction-A,#ld-direction-B,#ld-speed').count(),0);
  assert.match(await page.locator('#ld-wavelength-A').innerText(),/544,5 nm/);
  assert.match(await page.locator('#ld-wavelength-B').innerText(),/555,5 nm/);
  await page.locator('#doppler-tab-sound').click();
  assert.equal(await page.locator('#fd-scene').isVisible(),true);
 });
 await attempt('Half-life expectation',async()=>{
 await route('radioaktivitet');await page.locator('#ra-half-time').fill('3');await page.locator('#ra-half-time').dispatchEvent('input');assert.match(await page.locator('#ra-half-expected').innerText(),/25/);assert.equal(await page.locator('.ra-decayed').count()+await page.locator('.ra-population i:not(.ra-decayed)').count(),200);
 });
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
 await attempt('Question banks omit the filter row and concept lists start with terms',async()=>{
  await route('alle','oppgaver');
  assert.equal(await page.locator('.q-card').count(),qAll.length);
  assert.equal(await page.locator('.q-card.q-has-figure').count(),qAll.filter(question=>question.figure).length);
  assert.equal(await page.locator('.filterbar').count(),0);
  await route('kommunikasjon','oppgaver');
  assert.equal(await page.locator('.q-card').count(),data.find(t=>t.id==='kommunikasjon').questions.length);
  assert.equal(await page.locator('.q-card.q-has-figure').count(),0);
  assert.equal(await page.locator('.filterbar').count(),0);
  await route('kommunikasjon','begreper');
  assert.equal(await page.locator('#topic-content > .terms-list').count(),1);
  assert.equal(await page.locator('.question-summary').count(),0);
 });
 await attempt('Automatic graphics respect reduced-motion preference',async()=>{await route('fenomener');const svg=page.locator('#wv-interference');const before=await svg.innerHTML();await page.waitForTimeout(180);assert.equal(await svg.innerHTML(),before);await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();const moving=await svg.innerHTML();await page.waitForTimeout(180);assert.notEqual(await svg.innerHTML(),moving);await page.emulateMedia({reducedMotion:'reduce'});await page.reload();const frozen=await svg.innerHTML();await page.waitForTimeout(180);assert.equal(await svg.innerHTML(),frozen);});
 await attempt('Each animated figure has an independent pause button',async()=>{await page.emulateMedia({reducedMotion:'no-preference'});await route('bolger');const travel=page.locator('#wv-travel'),particles=page.locator('#wv-particles');await travel.evaluate(el=>el.closest('.model').querySelector('.animation-toggle').click());const stopped=await travel.innerHTML(),moving=await particles.innerHTML();await page.waitForTimeout(180);assert.equal(await travel.innerHTML(),stopped);assert.notEqual(await particles.innerHTML(),moving);assert.equal(await travel.evaluate(el=>el.closest('.model').querySelector('.animation-toggle').getAttribute('aria-pressed')),'true');await travel.evaluate(el=>el.closest('.model').querySelector('.animation-toggle').click());await page.waitForTimeout(180);assert.notEqual(await travel.innerHTML(),stopped);await page.emulateMedia({reducedMotion:'reduce'});});
 await attempt('Dark theme survives reload',async()=>{await page.locator('#theme-button').click();assert.ok(await page.locator('body.dark').count());await page.reload();assert.ok(await page.locator('body.dark').count());await page.locator('#theme-button').click();});
 await attempt('Keyboard skip link preserves the current topic',async()=>{await route('kommunikasjon');const before=page.url();await page.locator('.skip').focus();await page.keyboard.press('Enter');assert.equal(page.url(),before);assert.equal(await page.evaluate(()=>document.activeElement.id),'main');});
 for(const width of [390,320])for(const id of prototypeIds)await attempt('Mobile '+width+' '+id,async()=>{await page.setViewportSize({width,height:844});await route(id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'document overflow');await route(id,'oppgaver');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'bank overflow');});
 await attempt('Mobile navigation opens/closes and route is keyboard reachable',async()=>{await page.setViewportSize({width:390,height:844});await route('kommunikasjon');await page.locator('#menu-button').click();assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');await page.locator('#menu-button').click();await page.locator('[data-route="kommunikasjon/oppgaver"]').first().click();await page.locator('.q-card').first().waitFor();assert.equal(await page.locator('#menu-button').getAttribute('aria-expanded'),'false');});
 await attempt('The published atom topic supports all views and legacy routes',async()=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(url+'#oversikt');
  await page.locator('.topic-card').first().waitFor();
  assert.equal(await page.locator('.topic-card[href="#atomer/fagstoff"]').count(),0);
  await page.goto(base+'/naturfag.html#waves/fenomener/fagstoff');
  const nav=page.locator('[data-waves-toggle="atomer"]');
  assert.equal(await nav.innerText(),'Stråling fra atomet');
  await nav.click();
  await page.waitForURL(/#waves\/atomer\/fagstoff$/);
  const atom=page.frameLocator('#waves-module-frame');
  const firstSection=atom.locator('.content-section').first();
  assert.equal(await atom.locator('.content-section').count(),4);
  assert.equal(await firstSection.getByRole('heading',{name:'Spekteret til hydrogen',exact:true}).isVisible(),true);
  assert.match(await firstSection.locator('p').first().innerText(),/Bohrs atommodell.*grunntilstanden.*lavest mulig energi/);
  const model=firstSection.locator('#al-hydrogen-model'),stage=firstSection.locator('#al-hydrogen-svg');
  const controls=firstSection.locator('#al-h-spectrum-controls'),reveal=firstSection.locator('#al-h-reveal');
  const rings=stage.locator('circle[fill=none]');
  const onInnerShell=()=>stage.locator('[data-h-atom]').evaluate(el=>{
   const inner=el.querySelector('circle[fill=none]');
   const electron=Array.from(el.querySelectorAll('circle')).at(-1);
   const distance=Math.hypot(electron.cx.baseVal.value-inner.cx.baseVal.value,electron.cy.baseVal.value-inner.cy.baseVal.value);
   return Math.abs(distance-inner.r.baseVal.value)<.01;
  });
  const figures=['#al-hydrogen-svg'];
  const originalBounds=await drawingBounds(firstSection,figures);
  assert.equal(await model.getAttribute('data-levels-revealed'),'false');
  assert.equal(await rings.count(),1);
  assert.equal(await onInnerShell(),true);
  assert.equal(await stage.getAttribute('aria-label'),'Hydrogenatom i grunntilstanden');
  assert.equal(await stage.getAttribute('data-transition'),null);
  assert.equal(await stage.locator('.al-band').count(),0);
  assert.doesNotMatch(await stage.textContent(),/Energinivåer/);
  assert.equal(await controls.isVisible(),false);
  assert.equal(await controls.locator('[data-h-line]').count(),0);
  assert.equal(await firstSection.locator('#al-h-readout').isVisible(),false);
  assert.match(await reveal.innerText(),/Vis andre skall elektronet kan være i/i);
  await reveal.click();
  const revealedBounds=await drawingBounds(firstSection,figures);
  assert.deepEqual(revealedBounds[0].slice(0,3),originalBounds[0].slice(0,3));
  assert.ok(revealedBounds[0][3]>originalBounds[0][3]);
  assert.equal(await reveal.isVisible(),false);
  assert.equal(await stage.evaluate(el=>el.ownerDocument.activeElement===el),true);
  assert.equal(await model.getAttribute('data-levels-revealed'),'true');
  assert.equal(await rings.count(),6);
  assert.equal(await onInnerShell(),true);
  assert.match(await stage.textContent(),/Energinivåer/);
  assert.equal(await stage.locator('.al-band').count(),1);
  assert.equal(await stage.locator('[data-h-emission-arrow]').count(),0);
  assert.equal(await stage.getAttribute('data-transition'),null);
  assert.equal(await controls.locator('[data-h-line][aria-pressed=false]').count(),4);
  assert.match(await firstSection.locator('.al-h-spectrum-intro').innerText(),/nivå 2.*synlig lys.*emisjonsspekter/);
  const guide=firstSection.locator('#al-h-spectrum-guide');
  assert.match(await guide.innerText(),/←\s*Velg en spektrallinje for å se overgangen/);
  assert.equal(await guide.evaluate(el=>el.getBoundingClientRect().left>=document.querySelector('#al-hydrogen-svg').getBoundingClientRect().right),true);
  assert.equal(await guide.evaluate(el=>getComputedStyle(el).animationName),'none','The cue respects reduced motion.');
  const wavelength=firstSection.locator('#al-h-readout [data-al-wavelength-example]');
  assert.equal(await wavelength.isVisible(),false);
  assert.equal(await firstSection.locator('#al-h-show-energy').count(),0);
  assert.doesNotMatch(await firstSection.locator('#al-h-readout').innerText(),/ΔE/);
  await firstSection.locator('#al-h-spectrum-controls [data-h-line="6"]').click();
  assert.match(await wavelength.innerText(),/410,2\s*nm/);
  assert.equal(await firstSection.locator('#al-hydrogen-svg').getAttribute('data-photon-arrived'),'true');
  assert.equal(await atom.locator('#ema-ion-plot').count(),0);
  await wavelength.click();
  const calculation=firstSection.locator('#al-h-calculation-dialog[open]');
  assert.equal(await calculation.isVisible(),true);
  for(const step of ['1. Finn energinivåene med Bohrs formel','2. Finn energien til fotonet','3. Finn bølgelengden']){
   assert.equal(await calculation.getByRole('heading',{name:step,exact:true}).isVisible(),true);
  }
  const steps=await calculation.innerText();
  assert.match(steps,/1\s*aJ\s*=\s*10/);
  assert.match(steps,/410,2\s*nm/);
  assert.match(steps,/Fysikk 1/i);
  assert.deepEqual(await drawingBounds(firstSection,figures),revealedBounds);
  await page.keyboard.press('Escape');
  await calculation.waitFor({state:'hidden'});
  assert.equal(await wavelength.evaluate(el=>el.ownerDocument.activeElement===el),true);
  for(const [view, selector, count] of [['fagstoff','#al-hydrogen-svg',1],['oppgaver','.q-card',16],['begreper','.term',data.find(t=>t.id==='atomer').terms]]){
   await page.goto(url+'?legacy-atom=1#atomer/'+view);
   await page.waitForURL(new RegExp('/naturfag(?:\\.html)?#waves/atomer/'+view+'$'));
   await atom.locator(selector).first().waitFor();
   assert.equal(await atom.locator(selector).count(),count);
   assert.equal(await page.locator('[data-waves-topic="atomer"][data-waves-view="'+view+'"]').getAttribute('aria-current'),'page');
  }
 });
 await attempt('The published question banks render figures and preserve shared answer behavior',async()=>{
  await page.setViewportSize({width:1366,height:768});
  await page.goto(base+'/naturfag.html#waves/atomer/oppgaver');
  const atom=page.frameLocator('#waves-module-frame');
  const questions=data.find(topic=>topic.id==='atomer').questions;
  const card=id=>atom.locator('.q-card[data-question="'+id+'"]');
  await card('atom-01').waitFor();
  assert.equal(await atom.locator('.q-card.q-has-figure').count(),16);
  assert.deepEqual((await atom.locator('.q-card').evaluateAll(cards=>cards.map(card=>card.dataset.question))).slice(-4),physicsOneQuestions);
  assert.equal(await atom.locator('.q-course').count(),4);
  for(const id of physicsOneQuestions)assert.equal(await card(id).locator('.q-course').innerText(),'(fra Fysikk 1)');
  assert.match(await card('atom-12').locator('.q-prompt').innerText(),/E\s*=\s*h\s*f/);
  for(const {id} of questions){
   const svg=card(id).locator('.q-figure svg[data-atom-figure="'+id+'"]');
   assert.equal(await svg.count(),1);
   assert.ok(await svg.getAttribute('viewBox'));
  }
  const multipleChoice=card('atom-13');
  const position=question=>question.evaluate(el=>{
   const box=selector=>el.querySelector(selector).getBoundingClientRect().toJSON();
   return {prompt:box('.q-prompt'),figure:box('.q-figure'),controls:box('.q-controls')};
  });
  const desktop=await position(multipleChoice);
  assert.ok(desktop.prompt.right<=desktop.figure.left&&desktop.controls.right<=desktop.figure.left,'The drawing sits to the right of the prompt and choices.');
  const geometry=await drawingBounds(multipleChoice,['.q-figure svg']);
  await multipleChoice.locator('[data-choice="0"]').click();
  assert.match(await multipleChoice.locator('.feedback').innerText(),/stemmer ikke/i);
  assert.equal(await multipleChoice.locator('.q-status').isVisible(),false);
  await multipleChoice.locator('[data-choice="1"]').click();
  assert.equal(await multipleChoice.locator('.feedback').innerText(),'Riktig!');
  assert.equal(await multipleChoice.locator('.q-status').isVisible(),true);
  assert.deepEqual(await drawingBounds(multipleChoice,['.q-figure svg']),geometry,'Showing feedback does not move the drawing.');

  const numeric=card('atom-05');
  await numeric.locator('input').fill('0,30');
  await numeric.getByRole('button',{name:'Sjekk',exact:true}).click();
  assert.equal(await numeric.locator('.feedback').innerText(),'Riktig!');
  assert.equal(await numeric.locator('.solution .calc-lines').isVisible(),true);

  const draw=card('atom-10').locator('.q-figure');
  const diagram=draw.locator('.q-energy-diagram');
  const drawStatus=draw.locator('#atom-10-drawing-status');
  const level=n=>diagram.locator('[data-energy-level="'+n+'"]');
  const arrows=()=>diagram.locator('path[data-energy-arrow]').evaluateAll(paths=>paths.map(path=>path.dataset.energyArrow));
  const undo=draw.getByRole('button',{name:'Angre',exact:true}),clear=draw.getByRole('button',{name:'Tøm',exact:true});
  assert.match(await draw.locator('#atom-10-drawing-instruction').innerText(),/Velg to nivåer/);
  assert.equal(await drawStatus.getAttribute('role'),'status');
  assert.equal(await drawStatus.innerText(),'0 piler tegnet');
  assert.equal(await undo.isDisabled(),true);
  assert.equal(await clear.isDisabled(),true);
  const drawGeometry=await drawingBounds(draw,['svg']);
  await level(4).press('Enter');
  await level(2).press('Enter');
  assert.deepEqual(await arrows(),['4-2']);
  assert.equal(await diagram.locator('path[data-energy-arrow="4-2"]').evaluate(path=>path.getPointAtLength(path.getTotalLength()).y>path.getPointAtLength(0).y),true);
  assert.equal(await drawStatus.innerText(),'1 pil tegnet');
  await level(2).click();
  await level(4).click();
  assert.deepEqual(await arrows(),['4-2'],'One pair of levels counts once in either order.');
  await level(1).click();
  await level(3).click();
  assert.deepEqual((await arrows()).sort(),['3-1','4-2']);
  assert.equal(await drawStatus.innerText(),'2 piler tegnet');
  await undo.click();
  assert.deepEqual(await arrows(),['4-2']);
  assert.equal(await drawStatus.innerText(),'1 pil tegnet');
  await clear.click();
  assert.deepEqual(await arrows(),[]);
  assert.equal(await drawStatus.innerText(),'0 piler tegnet');
  assert.deepEqual(await drawingBounds(draw,['svg']),drawGeometry);

  const open=card('atom-16');
  assert.equal(await open.locator('.solution').isVisible(),false);
  await open.getByRole('button',{name:'Vis veiledende svar',exact:true}).click();
  assert.equal(await open.locator('.solution').isVisible(),true);
  assert.equal(await open.getByRole('button',{name:'Dette fikk jeg til',exact:true}).isVisible(),true);
  for(const width of [320,390]){
   await page.setViewportSize({width,height:844});
   const mobile=await position(multipleChoice);
   assert.ok(mobile.prompt.bottom<=mobile.figure.top&&mobile.figure.bottom<=mobile.controls.top,'The drawing precedes the choices on mobile.');
   assert.equal(await atom.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Atom question bank fits '+width+'px.');
  }
  await level(4).click();
  await level(1).click();
  assert.deepEqual(await arrows(),['4-1']);
  for(const topicId of ['bolger','fenomener','em']){
   await page.setViewportSize({width:1366,height:768});
   await page.goto(base+'/naturfag.html#waves/'+topicId+'/oppgaver');
   const otherQuestions=data.find(topic=>topic.id===topicId).questions;
   const sample=card(otherQuestions[0].id);
   await sample.waitFor();
   assert.equal(await atom.locator('.q-card.q-has-figure').count(),otherQuestions.length);
   assert.equal(await sample.locator('.q-figure svg['+bankFigureAttributes[topicId]+']').count(),1);
   const wide=await position(sample);
   assert.ok(wide.prompt.right<=wide.figure.left&&wide.controls.right<=wide.figure.left,`${topicId} places its figure to the right.`);
   await page.setViewportSize({width:320,height:844});
   const narrow=await position(sample);
   assert.ok(narrow.prompt.bottom<=narrow.figure.top&&narrow.figure.bottom<=narrow.controls.top,`${topicId} places its figure before the controls on mobile.`);
   assert.equal(await atom.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,`${topicId} question bank fits 320px.`);
  }
 });
 await attempt('Hydrogen transitions play from the atom, energy diagram and spectrum',async()=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  try{
   await page.setViewportSize({width:1366,height:768});
   const {topic,model,board,spectrum,targets,target,lineKeys,phase}=await hydrogenSeries('all');
   const keys=['2-1','3-1','3-2','4-1','4-2','4-3','5-1','5-2','5-3','6-1','6-2','6-3'];
   assert.equal(await model.getAttribute('data-mode'),'all');
   assert.equal(await model.locator('[data-series-mode]').count(),3);
   assert.equal(await topic.locator('.content-section').nth(0).locator('#hs-model').count(),0);
   assert.equal(await topic.locator('.content-section').nth(1).locator('#hs-model').count(),1);
   assert.equal(await topic.locator('.animation-toggle').count(),0,'Animation controls are omitted throughout the atom topic.');
   await topic.locator('#al-h-reveal').click();
   assert.deepEqual(await topic.locator('#al-h-spectrum-guide').evaluate(el=>{
    const style=getComputedStyle(el);
    return [style.animationName,style.animationIterationCount];
   }),['al-h-guide-cue','3']);
   await topic.locator('#al-h-spectrum-controls [data-h-line="6"]').click();
   await topic.locator('#al-hydrogen-svg[data-transition="6-2"][data-photon-arrived="false"]').waitFor();
   await topic.locator('#al-hydrogen-svg[data-transition="6-2"][data-photon-arrived="true"]').waitFor();
   const selection=model.locator('#hs-selection');
   assert.equal(await selection.isVisible(),true);
   assert.match(await selection.innerText(),/klikk på en pil eller en spektrallinje/i);
   assert.equal(await besideHydrogenModes(selection),true,'The overview readout sits beside the mode controls.');
   assert.deepEqual(await lineKeys(),keys);
   for(const part of ['atom','diagram','spectrum'])assert.equal(await targets(part).count(),12);
   assert.doesNotMatch(await board.textContent(),/15 mulige hopp|Andre/);
   await model.evaluate(el=>el.closest('section').scrollIntoView());
   assert.equal(await spectrum.evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),true,'The full spectrum fits below the figures at 100% zoom.');
   for(const [part,key] of [['diagram','6-1'],['atom','3-2'],['spectrum','5-2']]){
    const atomArrow=target('atom',key).locator('.hs-mark');
    await target(part,key).click();
    await phase('emission');
    assert.equal(await model.getAttribute('data-selected'),key);
    const [from,to]=key.split('-');
    const details=await selection.innerText();
    assert.match(details,new RegExp('Overgang\\s*n\\s*=\\s*'+from+'\\s*→\\s*(?:n\\s*=\\s*)?'+to));
    assert.match(details,/Bølgelengde\s*λ\s*=\s*\d+(?:[,.]\d+)?\s*nm/);
    assert.equal(await atomArrow.count(),0);
    await board.locator('.hs-motion path').first().waitFor();
    await phase('idle');
    assert.equal(await atomArrow.count(),1);
    assert.equal(await spectrum.locator('[data-series-line="'+key+'"].hs-selected').count(),1);
   }
  }finally{await page.emulateMedia({reducedMotion:'reduce'});}
 });
 await attempt('Hydrogen excitation reveals downhill transitions from bound levels and ionizes at infinity',async()=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  try{
   const {topic,model,board,selectMode,targets,target,lineKeys,phase}=await hydrogenSeries('excite');
   const explainControls=model.locator('#hs-explain-controls');
   const explainTrigger=explainControls.getByRole('button',{name:'Hvorfor gir ett innkommende foton så mange overganger ut?',exact:true});
   const help=model.locator('[data-series-excitation-help]');
   const helpDialog=topic.locator('#hs-excitation-help[open]');
   const summary=model.locator('#hs-excitation-summary');
   const sceneBounds=()=>drawingBounds(model,['#hs-board','#hs-spectrum']);
   assert.equal(await model.getAttribute('data-mode'),'excite');
   assert.deepEqual(await model.locator('[data-series-level]:visible').evaluateAll(levels=>levels.map(level=>level.dataset.seriesLevel)),['2','3','4','5','6','Infinity']);
   const exciteControls=model.locator('#hs-excite');
   assert.equal(await exciteControls.isVisible(),true);
   assert.equal(await besideHydrogenModes(exciteControls),true,'The excitation panel sits beside the mode controls.');
   assert.equal(await model.locator('#hs-selection').isVisible(),false);
   assert.equal(await summary.isVisible(),false);
   assert.equal(await explainControls.isVisible(),false);
   assert.equal(await explainTrigger.isVisible(),false);
   assert.deepEqual(await lineKeys(),[]);
   assert.equal(await targets('atom').count(),0);
   assert.equal(await targets('diagram').count(),0);
   const finiteBounds=await sceneBounds();
   assert.equal(await help.isVisible(),true);
   assert.equal(await help.evaluate(el=>{
    const button=el.getBoundingClientRect();
    const mode=el.closest('#hs-model').querySelector('[data-series-mode="excite"]').getBoundingClientRect();
    return button.top>=mode.bottom&&Math.abs(button.left+button.width/2-mode.left-mode.width/2)<=2;
   }),true,'Excitation help is centered below the Exciter button.');
   await help.click();
   await helpDialog.waitFor();
   assert.match(await helpDialog.innerText(),/foton/i);
   assert.match(await helpDialog.innerText(),/energi/i);
   assert.deepEqual(await sceneBounds(),finiteBounds);
   await page.keyboard.press('Escape');
   await helpDialog.waitFor({state:'hidden'});
   await model.locator('[data-series-level="5"]').click();
   await phase('absorb');
   assert.deepEqual(await lineKeys(),[]);
   assert.equal(await model.getAttribute('data-excited'),'5');
   assert.equal(await board.locator('[data-series-excited-row="5"]').count(),1);
   await phase('burst');
   const keys=['2-1','3-1','3-2','4-1','4-2','4-3','5-1','5-2','5-3','5-4'];
   assert.deepEqual(await lineKeys(),keys);
   for(const part of ['atom','diagram','spectrum']){
    assert.deepEqual(await targets(part).evaluateAll(nodes=>nodes.map(node=>node.dataset.seriesKey).sort()),keys);
   }
   await phase('idle');
   assert.deepEqual(await lineKeys(),keys);
   assert.equal(await explainTrigger.isVisible(),true);
   const chosenSummary=await summary.innerText();
   const summaryTitle=summary.locator('.hs-excitation-level-title'),summaryCount=summary.locator('.hs-excitation-count');
   assert.equal(await summaryTitle.innerText(),'Eksitasjon opp til n = 5.');
   assert.equal(await summaryCount.innerText(),'Gir 10 overganger:');
   assert.equal(await summaryTitle.evaluate(el=>getComputedStyle(el).textDecorationLine.includes('underline')),true);
   assert.equal(await summaryCount.evaluate(el=>el.getBoundingClientRect().top>=el.previousElementSibling.getBoundingClientRect().bottom-1),true);
   assert.deepEqual(await sceneBounds(),finiteBounds,'Showing the explanation control keeps both drawings in place.');
   await target('diagram','5-4').press('Space');
   await phase('emission');
   assert.equal(await model.getAttribute('data-selected'),'5-4');
   assert.equal(await model.locator('#hs-selection').isVisible(),false);
   assert.equal(await summary.innerText(),chosenSummary);
   assert.equal(await explainTrigger.isVisible(),true);
   assert.equal(await model.evaluate(el=>el.querySelector('.hs-legend').getBoundingClientRect().bottom<=el.querySelector('#hs-explain-controls').getBoundingClientRect().top),true);
   await explainTrigger.click();
   const explanation=topic.locator('#hs-explanation[open]');
   await explanation.waitFor();
   assert.match(await explanation.innerText(),/mange hydrogenatomer/i);
   await page.keyboard.press('Escape');
   await explanation.waitFor({state:'hidden'});
   const ionize=model.getByRole('button',{name:'n = ∞',exact:true});
   const ionization=model.locator('#hs-ionization');
   await phase('idle');
   assert.deepEqual(await sceneBounds(),finiteBounds,'Selecting an emitted line keeps both drawings in place.');
   await ionize.click();
   await phase('ionize');
   assert.equal(await model.getAttribute('data-excited'),'Infinity');
   assert.deepEqual(await lineKeys(),[]);
   assert.equal(await targets('atom').count()+await targets('diagram').count(),0);
   assert.equal(await board.locator('[data-series-excited-row="Infinity"]').count(),1);
   assert.match(await board.textContent(),/n\s*=\s*∞/);
   await board.locator('[data-series-ionizing-photon]').waitFor();
   await board.locator('[data-series-escaping-electron]').waitFor();
   await phase('idle');
   assert.equal(await board.locator('[data-series-ionized]').count(),1);
   assert.match(await board.textContent(),/H⁺/);
   assert.equal(await ionization.isVisible(),true);
   assert.equal(await summary.isVisible(),false);
   assert.equal(await help.isVisible(),true);
   assert.equal(await explainControls.isVisible(),false);
   assert.deepEqual(await sceneBounds(),finiteBounds,'Ionization keeps the atom, energy diagram and spectrum in place.');
   assert.equal(await model.evaluate(el=>{
    const bounds=selector=>el.querySelector(selector).getBoundingClientRect();
    return bounds('#hs-side').left>=bounds('#hs-board').right&&bounds('#hs-ionization').bottom+25<=bounds('.hs-legend').top;
   }),true,'Ionization status has space before the legend.');
   assert.deepEqual(await lineKeys(),[]);
   await selectMode('all');
   await selectMode('excite');
   assert.deepEqual(await lineKeys(),[]);
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.setViewportSize({width:390,height:844});
   assert.equal(await explainControls.isVisible(),false);
   await model.locator('[data-series-level="2"]').click();
   await phase('idle');
   assert.deepEqual(await lineKeys(),['2-1']);
   assert.equal(await explainControls.isVisible(),false);
   assert.equal(await summaryTitle.innerText(),'Eksitasjon opp til n = 2.');
   assert.equal(await summaryCount.innerText(),'Gir 1 overgang:');
   const mobileFiniteBounds=await sceneBounds();
   for(const level of [3,4,5,6]){
    await model.locator('[data-series-level="'+level+'"]').click();
    await phase('idle');
    assert.equal(await explainTrigger.isVisible(),true);
    assert.equal((await lineKeys()).length,level*(level-1)/2);
    assert.deepEqual(await sceneBounds(),mobileFiniteBounds);
    assert.equal(await summaryTitle.innerText(),`Eksitasjon opp til n = ${level}.`);
    assert.equal(await summaryCount.innerText(),`Gir ${level*(level-1)/2} overganger:`);
    if(level===4){
     const wavelengths=await summary.innerText();
     assert.match(wavelengths,/UV[^\d]*97,\s*103,\s*122\s*nm/i);
     assert.match(wavelengths,/Synlig[^\d]*486,\s*656\s*nm/i);
     assert.match(wavelengths,/(?:IR|Infrarødt)[^\d]*1\s*875\s*nm/i);
    }
   }
   await ionize.click();
   await phase('idle');
   assert.equal(await board.locator('[data-series-ionized]').count(),1);
   assert.equal(await explainControls.isVisible(),false);
   assert.deepEqual(await sceneBounds(),mobileFiniteBounds,'Ionization keeps both drawings in place on mobile.');
   assert.deepEqual(await lineKeys(),[]);
   await model.locator('[data-series-level="2"]').click();
   assert.equal(await ionization.isVisible(),false);
   assert.equal(await explainControls.isVisible(),false);
   assert.equal(await board.locator('[data-series-ionized]').count(),0);
   assert.deepEqual(await lineKeys(),['2-1']);
  }finally{await page.emulateMedia({reducedMotion:'reduce'});}
 });
 await attempt('Hydrogen quiz reshuffles all 12 and keeps missed clues in retry order',async()=>{
  await page.setViewportSize({width:390,height:844});
  const {hydrogenQuiz}=await import(moduleUrl('hydrogen-series-quiz'));
  const {topic,model,board,spectrum,chooser,selectMode,selectDifficulty,targets,target,lineKeys,phase}=await hydrogenSeries('quiz');
  const clue=model.locator('#hs-clue'),progress=model.locator('#hs-progress'),feedback=model.locator('#hs-feedback');
  const instruction=model.locator('#hs-quiz-instruction'),progressPanel=model.locator('#hs-side #hs-quiz-progress');
  const formulas=model.locator('#hs-formulas');
  const difficulty=model.locator('#hs-difficulty-value'),restart=model.locator('[data-series-reset]');
  const choose=key=>target('diagram',key).press('Enter');
  const clueHasFocus=()=>clue.evaluate(el=>el.ownerDocument.activeElement===el);
  const fitsViewport=()=>topic.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+1);
  const allKeys=hydrogenQuiz.mild.map(([key])=>key);
  const setQuizSeed=seed=>model.evaluate((el,value)=>{
   el.ownerDocument.defaultView.Math.random=()=>{
    value=(1664525*value+1013904223)>>>0;
    return value/2**32;
   };
  },seed);
  async function question(level='mild'){
   const prompt=await clue.textContent();
   const entry=hydrogenQuiz[level].find(([,text])=>text===prompt);
   assert.ok(entry,'Expected a clue in the '+level+' bank.');
   return {key:entry[0],prompt};
  }
  const solved=[];
  async function solve(key){
   assert.equal(solved.includes(key),false);
   await choose(key);
   await phase('idle');
   solved.push(key);
   assert.equal(await clueHasFocus(),true);
   assert.equal(await targets('diagram').and(board.locator('.hs-solved')).count(),solved.length);
   assert.deepEqual(await lineKeys(),[...solved].sort());
  }
  async function restartWith(level){
   await restart.click();
   await selectDifficulty(level);
   await chooser.waitFor({state:'hidden'});
  }
  assert.equal(await fitsViewport(),true,'Hydrogen diagrams fit the phone width.');
  assert.deepEqual(await chooser.locator('[data-series-difficulty]').allTextContents(),['Mild','Småspicy','Vindaloo']);
  assert.equal(await chooser.evaluate(el=>el.matches(':modal')),true);
  await page.keyboard.press('Tab');
  assert.equal(await chooser.evaluate(el=>el.contains(el.ownerDocument.activeElement)),true,'The modal keeps keyboard focus on the difficulty choices.');
  for(const element of [restart,instruction,clue,progress,difficulty,formulas])assert.equal(await element.isVisible(),false);
  for(const element of [board,spectrum])assert.equal(await element.isVisible(),true);
  const previousLines=await lineKeys();
  assert.equal(previousLines.length,12);
  await page.keyboard.press('Escape');
  await chooser.waitFor({state:'hidden'});
  assert.equal(await model.getAttribute('data-mode'),'all','Cancelling the first chooser keeps the previous mode.');
  assert.deepEqual(await lineKeys(),previousLines);
  await selectMode('quiz');
  await setQuizSeed(1);
  await chooser.getByRole('button',{name:'Mild',exact:true}).press('Enter');
  await chooser.waitFor({state:'hidden'});
  assert.equal(await instruction.isVisible(),true);
  assert.match(await instruction.innerText(),/Finn overgangen og klikk på riktig pil/i);
  assert.equal(await model.locator('#hs-quiz #hs-quiz-instruction').count(),0);
  assert.equal(await difficulty.innerText(),'(Mild)');
  assert.equal(await progressPanel.isVisible(),true);
  assert.match(await progressPanel.locator('#hs-progress').innerText(),/^0\s*(?:av|\/)\s*12\b/);
  assert.equal(await progressPanel.locator('#hs-difficulty-value').count(),1);
  assert.equal(await model.locator('[data-series-difficulty]:visible').count(),0);
  assert.equal(await restart.isVisible(),true);
  assert.equal(await feedback.isVisible(),false);
  for(const element of [clue,progress,board,spectrum])assert.equal(await element.isVisible(),true);
  assert.equal(await targets('diagram').count(),12);
  assert.doesNotMatch(await board.textContent(),/aJ/);
  assert.equal(await formulas.isVisible(),false);
  assert.deepEqual(await lineKeys(),[]);
  const first=await question();
  const initialProgress=await progress.textContent();
  await choose(allKeys.find(key=>key!==first.key));
  const second=await question();
  assert.notEqual(second.key,first.key);
  assert.equal(await clueHasFocus(),true);
  assert.equal(await progress.textContent(),initialProgress);
  assert.deepEqual(await lineKeys(),[]);
  assert.equal(await feedback.isVisible(),true);
  assert.match(await feedback.textContent(),/ledetråden kommer tilbake/i);

  await solve(second.key);
  const third=await question();
  const progressAfterOne=await progress.textContent();
  await selectMode('all');
  await selectMode('quiz');
  assert.equal(await chooser.isVisible(),false,'Returning to a started quiz does not reopen the chooser.');
  assert.equal(await clue.textContent(),third.prompt);
  assert.equal(await progress.textContent(),progressAfterOne);
  assert.equal(await difficulty.innerText(),'(Mild)');
  assert.deepEqual(await lineKeys(),[second.key]);
  await restart.click();
  await chooser.waitFor();
  assert.equal(await board.isVisible(),true);
  assert.deepEqual(await lineKeys(),[second.key]);
  await page.keyboard.press('Escape');
  await chooser.waitFor({state:'hidden'});
  assert.equal(await clue.textContent(),third.prompt);
  assert.equal(await progress.textContent(),progressAfterOne);
  assert.equal(await difficulty.innerText(),'(Mild)');
  assert.deepEqual(await lineKeys(),[second.key]);
  const originalOrder=[first.key,second.key,third.key];
  await choose(allKeys.find(key=>!originalOrder.includes(key)));
  assert.notEqual(await clue.textContent(),third.prompt);
  assert.equal(await clueHasFocus(),true);
  assert.equal(await progress.textContent(),progressAfterOne);
  assert.deepEqual(await lineKeys(),[second.key]);
  while(originalOrder.length<allKeys.length){
   const {key}=await question();
   assert.equal(originalOrder.includes(key),false,'A missed clue waits until the rest of the original round is attempted.');
   originalOrder.push(key);
   await solve(key);
  }
  assert.equal(await clue.textContent(),first.prompt,'The first missed clue returns after the original round.');
  const retryProgress=await progress.textContent();
  for(const [key,next] of [[third.key,third.prompt],[first.key,first.prompt]]){
   await choose(key);
   assert.equal(await clue.textContent(),next,'The missed clues return in the order they were attempted.');
   assert.equal(await clueHasFocus(),true);
   assert.equal(await progress.textContent(),retryProgress);
   assert.deepEqual(await lineKeys(),[...solved].sort());
  }
  await solve(first.key);
  assert.equal(await clue.textContent(),third.prompt);
  const finalProgress=await progress.textContent();
  await choose(first.key);
  assert.equal(await clue.textContent(),third.prompt,'Reviewing a solved arrow preserves the last pending clue.');
  assert.equal(await progress.textContent(),finalProgress);
  assert.deepEqual(await lineKeys(),[...solved].sort());
  await solve(third.key);
  assert.match(await progress.textContent(),/12\s*(?:av|\/)\s*12/);

  await setQuizSeed(2);
  await restartWith('mild');
  assert.equal(await progress.textContent(),initialProgress);
  assert.equal(await difficulty.innerText(),'(Mild)');
  assert.deepEqual(await lineKeys(),[]);
  solved.length=0;
  for(let index=0;index<allKeys.length;index++)await solve((await question()).key);
  assert.notDeepEqual(solved,originalOrder,'Restart shuffles the same clue bank with fresh randomness.');

  await setQuizSeed(1);
  await restartWith('medium');
  assert.equal(await difficulty.innerText(),'(Småspicy)');
  const firstMedium=(await question('medium')).prompt;
  assert.equal(await formulas.isVisible(),false);
  await restartWith('spicy');
  assert.equal(await difficulty.innerText(),'(Vindaloo)');
  assert.match(await board.textContent(),/\d[,.]\d+\s*aJ/);
  assert.deepEqual(await lineKeys(),[]);
  assert.equal(await formulas.isVisible(),true);
  const formulaText=await formulas.innerText();
  const formulaLines=await Promise.all([
   formulas.getByText(/ΔE\s*=\s*E\s*øvre\s*−\s*E\s*nedre/).boundingBox(),
   formulas.getByText('ΔE = hf',{exact:true}).boundingBox(),
   formulas.getByText('c = λf',{exact:true}).boundingBox()
  ]);
  assert.ok(formulaLines.every(Boolean));
  assert.ok(formulaLines.every((line,i)=>i===0||line.y>=formulaLines[i-1].y+formulaLines[i-1].height-1),'Each equation has its own row.');
  assert.match(formulaText,/ΔE\s*=\s*h\s*[·⋅×]?\s*f/);
  assert.match(formulaText,/c\s*=\s*λ\s*[·⋅×]?\s*f/);
  assert.match(formulaText,/h\s*[=≈]\s*6[,.]6\d*/);
  assert.match(formulaText,/c\s*[=≈]\s*[23][,.]\d+/);
  const worked=model.locator('#hs-worked-solution');
  assert.equal(await worked.isVisible(),false);
  const firstSpicy=await question('spicy');
  await choose(allKeys.find(key=>key!==firstSpicy.key));
  assert.equal(await worked.isVisible(),false,'An incorrect answer does not reveal a worked solution.');
  const {key:spicyAnswer}=await question('spicy');
  await choose(spicyAnswer);
  assert.equal(await worked.isVisible(),true);
  const workedText=(await worked.innerText()).replace(/\s+/g,' ');
  const {transition}=await import(moduleUrl('atom-lab'));
  const [from,to]=spicyAnswer.split('-').map(Number);
  const actual=transition(from,to);
  const wavelength=actual.wavelengthNM.toLocaleString('nb-NO',{maximumFractionDigits:1}).replace(/\s+/g,' ');
  assert.match(workedText,/ΔE/);
  assert.match(workedText,/f\s*=\s*ΔE\s*\/\s*h/);
  assert.match(workedText,/λ\s*=\s*c\s*\/\s*f/);
  assert.ok(workedText.includes(wavelength+' nm'),'The worked answer gives the wavelength of the chosen transition.');
  assert.equal(await formulas.evaluate(el=>{
   const side=el.ownerDocument.getElementById('hs-side');
   const solution=el.ownerDocument.getElementById('hs-worked-solution');
   return side.contains(el)&&side.contains(solution)&&solution.getBoundingClientRect().bottom<=el.getBoundingClientRect().top;
  }),true,'The solved calculation appears above the formulas in the side panel.');
  assert.equal(await fitsViewport(),true,'Vindaloo formulas fit the phone width.');
  const nextSpicy=await question('spicy');
  await choose(allKeys.find(key=>key!==nextSpicy.key&&key!==spicyAnswer));
  assert.equal(await worked.isVisible(),false,'Incorrect feedback clears the previous worked solution.');
  await setQuizSeed(2);
  await restartWith('medium');
  assert.notEqual((await question('medium')).prompt,firstMedium,'Selecting the same difficulty after another difficulty starts a newly shuffled round.');
  assert.doesNotMatch(await board.textContent(),/aJ/);
  assert.equal(await formulas.isVisible(),false);
  assert.equal(await worked.isVisible(),false);
  await restartWith('mild');
  const {key}=await question();
  await target('atom',key).press('Space');
  assert.deepEqual(await lineKeys(),[key]);
 });
 await attempt('Hydrogen quiz keeps its drawing and side panel readable at desktop and phone widths',async()=>{
  await page.setViewportSize({width:1366,height:768});
  const {hydrogenQuiz}=await import(moduleUrl('hydrogen-series-quiz'));
  const {topic,model,target,chooser,selectDifficulty}=await hydrogenSeries('quiz',{difficulty:'mild'});
  const restart=model.locator('[data-series-reset]');
  const position=()=>model.evaluate(el=>{
   const bounds=selector=>el.querySelector(selector).getBoundingClientRect().toJSON();
   return {
    mode:bounds('[data-series-mode="quiz"]'),
    restart:bounds('[data-series-reset]'),
    difficulty:bounds('#hs-difficulty-value'),
    progress:bounds('#hs-progress'),
    progressPanel:bounds('#hs-quiz-progress'),
    instruction:bounds('#hs-quiz-instruction'),
    prompt:bounds('#hs-quiz'),
    board:bounds('#hs-board'),
    spectrum:bounds('#hs-spectrum'),
    side:bounds('#hs-side'),
    feedback:bounds('#hs-quiz-feedback'),
    formulas:bounds('#hs-formulas')
   };
  });
  await target('diagram','3-2').press('Enter');
  const desktop=await position();
  assert.ok(desktop.mode.right<=desktop.restart.left&&desktop.mode.top<desktop.restart.bottom&&desktop.restart.top<desktop.mode.bottom,'Restart sits beside the mode controls.');
  assert.ok(Math.abs(desktop.instruction.right-desktop.prompt.right)<=2&&desktop.instruction.bottom<=desktop.prompt.top+1,'Instruction sits directly above the prompt, aligned on the right.');
  assert.ok(desktop.prompt.bottom<=desktop.board.top,'The quiz prompt stays above the drawing.');
  assert.ok(desktop.difficulty.top<desktop.progress.bottom&&desktop.progress.top<desktop.difficulty.bottom,'Difficulty and progress share a row.');
  assert.ok(desktop.board.right<=desktop.side.left&&desktop.side.left<=desktop.feedback.left,'Feedback belongs in the panel to the right of the drawing.');
  assert.ok(desktop.progressPanel.top>=desktop.feedback.bottom&&desktop.side.left<=desktop.progressPanel.left,'Progress belongs below feedback in the sidebar.');
  await restart.click();
  await selectDifficulty('spicy');
  const prompt=await model.locator('#hs-clue').textContent();
  const matching=hydrogenQuiz.spicy.find(([,text])=>text===prompt);
  assert.ok(matching);
  await target('diagram',matching[0]).press('Enter');
  const advanced=await position();
  assert.ok(advanced.side.top<=advanced.board.top+1&&advanced.side.bottom>=advanced.spectrum.bottom-1,'Vindaloo side panel spans both drawings.');
  assert.ok(advanced.feedback.bottom<=advanced.progressPanel.top&&advanced.progressPanel.bottom<=advanced.formulas.top&&Math.abs(advanced.side.bottom-advanced.formulas.bottom)<=8,'Progress separates worked feedback from the formula panel at the bottom right.');

  for(const width of [320,390]){
   await page.setViewportSize({width,height:844});
   const mobile=await position();
   assert.ok(Math.abs(mobile.instruction.right-mobile.prompt.right)<=2&&mobile.instruction.bottom<=mobile.prompt.top+1,'Instruction stays above the prompt on mobile.');
   assert.ok(mobile.prompt.bottom<=mobile.board.top,'The question stays above the drawing on mobile.');
   assert.ok(Math.max(mobile.board.bottom,mobile.spectrum.bottom)<=mobile.side.top,'The side panel wraps below both drawings on mobile.');
   assert.equal(await topic.locator('main').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Hydrogen quiz fits '+width+'px without horizontal overflow.');
   await restart.click();
   assert.equal(await chooser.evaluate(el=>{
    const box=el.getBoundingClientRect();
    return box.left>=0&&box.right<=el.ownerDocument.defaultView.innerWidth;
   }),true,'The difficulty chooser fits '+width+'px.');
   await page.keyboard.press('Escape');
   await chooser.waitFor({state:'hidden'});
  }
 });
 await attempt('Hydrogen custom atom presets reset the spectrum and edits make an arbitrary atom',async()=>{
  await page.setViewportSize({width:1366,height:768});
  const {topic}=await hydrogenSeries('all');
  const model=topic.locator('#al-custom-model');
  const preset=model.locator('#al-custom-preset'),diagram=model.locator('#al-custom-svg');
  const spectrum=model.locator('#al-custom-spectrum'),handle=model.locator('[data-custom-index="1"]');
  const lines=()=>spectrum.locator('[data-custom-line]').evaluateAll(items=>items.map(item=>item.innerHTML));
  assert.equal(await topic.getByRole('heading',{name:'Hva med andre atomer?',exact:true}).isVisible(),true);
  assert.equal(await model.locator('[data-excite-level],#al-custom-targets').count(),0);
  assert.deepEqual(await preset.locator('option').allTextContents(),['Natrium','Litium','Vilkårlig atom']);
  assert.equal(await preset.inputValue(),'sodium');
  const sodium=await lines();
  assert.equal(sodium.length,4);
  assert.match(await spectrum.locator('[data-custom-line="1-0"] title').textContent(),/589,2\s*nm/);
  await preset.selectOption('lithium');
  assert.equal(await diagram.getAttribute('data-atom'),'lithium');
  const lithium=await lines();
  assert.equal(lithium.length,4);
  assert.notDeepEqual(lithium,sodium);
  assert.match(await spectrum.locator('[data-custom-line="1-0"] title').textContent(),/671\s*nm/);
  assert.doesNotMatch(await diagram.textContent(),/\b(?:aJ|eV)\b/);
  await handle.click();
  assert.equal(await preset.inputValue(),'lithium','Only moving a level changes the preset.');
  await handle.scrollIntoViewIfNeeded();
  const box=await handle.boundingBox();
  assert.ok(box);
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x,y-20,{steps:5});
  await page.mouse.up();
  assert.equal(await preset.inputValue(),'custom');
  assert.equal(await diagram.getAttribute('data-atom'),'custom');
  const edited=await lines();
  assert.equal(edited.length,lithium.length);
  assert.notDeepEqual(edited,lithium);
  await preset.selectOption('lithium');
  assert.deepEqual(await lines(),lithium);
  await handle.press('ArrowUp');
  assert.equal(await preset.inputValue(),'custom');
  assert.notDeepEqual(await lines(),lithium);
  for(const width of [320,390]){
   await page.setViewportSize({width,height:844});
   assert.equal(await model.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Custom atom fits '+width+'px.');
   assert.equal(await handle.isVisible(),true);
  }
 });
 await attempt('Hydrogen periodic table fills each tile with a neutral spectrum beneath its symbol',async()=>{
  await page.setViewportSize({width:1366,height:768});
  const {topic}=await hydrogenSeries('all');
  const {getElementEmissionLines}=await import(moduleUrl('element-spectra-data'));
  const launcher=topic.locator('#es-open'),dialog=topic.locator('#es-dialog[open]');
  const tile=z=>dialog.locator('[data-es-z="'+z+'"]');
  const graph=dialog.locator('#es-spectrum .es-spectrum-area svg');
  await launcher.click();
  assert.equal(await dialog.locator('select,#es-stage').count(),0);
  assert.equal(await dialog.locator('[data-es-z]').count(),118);
  for(const z of [1,11])assert.equal(await tile(z).locator('.es-swatch line').count(),getElementEmissionLines(z,'I').length);
  assert.equal(await graph.locator('line').count(),getElementEmissionLines(1,'I').length);
  const tileGeometry=z=>tile(z).evaluate(el=>{
   const bounds=selector=>el.querySelector(selector).getBoundingClientRect();
   const tile=el.getBoundingClientRect(),swatch=bounds('.es-swatch'),plot=bounds('.es-swatch svg'),symbol=bounds('.es-symbol');
   const fill=getComputedStyle(el.querySelector('.es-swatch rect')).fill.match(/\d+/g).slice(0,3).map(Number);
   return {
    fillsTile:swatch.width>=tile.width-2.5&&swatch.height>=tile.height-2.5&&plot.width>=swatch.width-1&&plot.height>=swatch.height-1,
    topLeft:symbol.left>=plot.left&&symbol.top>=plot.top&&symbol.left<=plot.left+4&&symbol.top<=plot.top+4,
    smallOverlay:symbol.width>0&&symbol.height>0&&symbol.right<=plot.right+1&&symbol.height<=plot.height*.4,
    dark:fill.every(channel=>channel<36)};
  });
  async function checkTiles(){
   for(const z of [1,11,118])assert.deepEqual(await tileGeometry(z),{fillsTile:true,topLeft:true,smallOverlay:true,dark:true});
  }
  await checkTiles();
  await tile(11).click();
  assert.match(await dialog.locator('#es-selected-title').innerText(),/natrium/i);
  assert.equal(await graph.locator('line').count(),getElementEmissionLines(11,'I').length);
  await dialog.locator('#es-info-open').click();
  const source=topic.locator('#es-info-dialog[open]');
  assert.match(await source.locator('#es-line-values').innerText(),/589[,.]\d+/);
  await page.keyboard.press('Escape');
  await source.waitFor({state:'hidden'});
  await tile(11).press('End');
  assert.match(await dialog.locator('#es-status').innerText(),/ingen tabell/i);
  assert.equal(await graph.locator('line').count(),0);
  await tile(118).press('Home');
  assert.match(await dialog.locator('#es-selected-title').innerText(),/hydrogen/i);
  for(const width of [320,390]){
   await page.setViewportSize({width,height:844});
   await checkTiles();
   assert.equal(await dialog.locator('.es-periodic-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Periodic table fits '+width+'px.');
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await topic.locator('#es-open:focus').waitFor();
 });
 await attempt('Hydrogen lesson compares continuous, emission and absorption spectra',async()=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  try{
   await page.setViewportSize({width:1366,height:768});
   const {topic}=await hydrogenSeries('all');
   const model=topic.locator('#sl-model'),overview=model.locator('#sl-overview');
   const detail=model.locator('#sl-absorption-detail'),toggle=model.locator('#sl-absorption-toggle');
   const darkExplanation=model.locator('#sl-dark-open');
   const gasButtons=model.locator('[data-spectra-gas]');
   const band=kind=>overview.locator('[data-spectra-case="'+kind+'"]');
   const wavelengths=kind=>band(kind).locator('[data-spectra-wavelength]').evaluateAll(marks=>marks.map(mark=>Number(mark.dataset.spectraWavelength.replace(',','.'))).sort((a,b)=>a-b));
   const scene=()=>drawingBounds(model,['#sl-overview','.sl-controls']);
   assert.equal(await model.getAttribute('data-gas'),'Ne');
   assert.deepEqual((await gasButtons.evaluateAll(buttons=>buttons.map(button=>button.dataset.spectraGas))).sort(),['H','He','N','Na','Ne','O']);
   for(const name of ['continuous','emission','absorption'])assert.equal(await band(name).count(),1);
   const phase=await overview.locator('[data-spectra-beam]').evaluateAll(beams=>beams.map(beam=>beam.outerHTML).join(''));
   const frame=await (await overview.elementHandle()).ownerFrame();
   await frame.waitForFunction(previous=>{
    const beams=[...document.querySelectorAll('#sl-overview [data-spectra-beam]')];
    return beams.length>0&&beams.map(beam=>beam.outerHTML).join('')!==previous;
   },phase);
   const baseline=await scene();
   const representative={H:[486.13615,656.28518],He:[587.56148],N:[575.25],Na:[588.995,589.5924],Ne:[585.24879],O:[777.194]};
   const glows=new Set();
   for(const [gas,expected] of Object.entries(representative)){
    const button=gasButtons.and(model.locator('[data-spectra-gas="'+gas+'"]'));
    await button.click();
    assert.equal(await model.getAttribute('data-gas'),gas);
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert.equal(await gasButtons.and(model.locator('[aria-pressed=true]')).count(),1);
    glows.add(await overview.locator('[data-spectra-glow]').getAttribute('fill'));
    const emission=await wavelengths('emission');
    assert.deepEqual(await wavelengths('absorption'),emission);
    for(const wavelength of expected)assert.ok(emission.some(actual=>Math.abs(actual-wavelength)<.05),`${gas} has a line at ${wavelength} nm.`);
    assert.deepEqual(await scene(),baseline);
   }
   assert.equal(glows.size,6);
   assert.equal(await detail.isVisible(),false);
   await toggle.click();
   assert.equal(await detail.locator('#sl-absorption-figure').isVisible(),true);
   assert.deepEqual(await scene(),baseline,'Opening the absorption figure leaves the comparison fixed.');
   await detail.locator('[data-spectrum-detail="incoming-photon"]').waitFor();
   await detail.locator('[data-spectrum-detail="reemitted-photon"]').waitFor();
   await darkExplanation.click();
   const dialog=topic.locator('#sl-dark-dialog[open]');
   await dialog.waitFor();
   assert.match(await dialog.locator('#sl-dark-figure').textContent(),/Lysstyrke over 0/);
   assert.deepEqual(await scene(),baseline,'Opening the dialog leaves the comparison fixed.');
   await page.keyboard.press('Escape');
   await dialog.waitFor({state:'hidden'});
   assert.equal(await darkExplanation.evaluate(el=>el.ownerDocument.activeElement===el),true);
   await toggle.click();
   assert.equal(await detail.isVisible(),false);
   assert.deepEqual(await scene(),baseline);
   for(const width of [320,390]){
    await page.setViewportSize({width,height:844});
    await toggle.click();
    const narrow=await scene();
    assert.equal(await model.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Spectra comparison fits '+width+'px.');
    await toggle.click();
    assert.deepEqual(await scene(),narrow);
   }
  }finally{await page.emulateMedia({reducedMotion:'reduce'});}
 });
 await attempt('Wave views share the original figure and controls',async()=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'/naturfag.html#waves/bolger/fagstoff');
  const wave=page.frameLocator('#waves-module-frame');
  const front=wave.locator('.wb-wave-stage');
  await front.waitFor();
  assert.equal(await front.locator('#wv-particles').isVisible(),true);
  assert.equal(await front.locator('#wv-spatial').isVisible(),false);
  await wave.locator('#wv-longitudinal').click();
  await front.locator('#wv-show-3d').click();
  assert.equal(await front.locator('#wv-particles').isVisible(),false);
  assert.equal(await front.locator('#wv-spatial').isVisible(),true);
  assert.equal(await wave.locator('#wv-longitudinal').getAttribute('aria-pressed'),'true');
  await front.locator('#wv-show-2d').click();
  assert.equal(await front.locator('#wv-particles').isVisible(),true);
 });
 await attempt('Coastal response controls appear next to the shore figure',async()=>{
  await page.goto(base+'/naturfag.html#waves/fenomener/fagstoff');
  const waves=page.frameLocator('#waves-module-frame');
  await waves.locator('#ex-open').click();
  await waves.locator('#ex-tab-coast').click();
  const panel=waves.locator('#ex-refraction-panel .model-panel');
  assert.equal(await panel.locator('#re-shore-question').isVisible(),true);
  assert.equal(await panel.locator('#re-car-controls').isVisible(),false);
  assert.doesNotMatch(await panel.locator('#re-readout').innerText(),/°/);
  await panel.locator('[name="re-frequency"][value="unchanged"]').check();
  await panel.locator('[name="re-wavelength"][value="down"]').check();
  assert.match(await panel.locator('#re-shore-feedback').innerText(),/Begge svarene stemmer/);
  await page.keyboard.press('Escape');
 });
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
  await content.locator('.ld-more summary').click();
  await content.locator('#ld-one').click();
  await content.locator('#ld-count').filter({hasText:/^1$/}).waitFor();
  await page.goto(base+'/naturfag.html#waves/em/begreper');
  await content.locator('.term').first().waitFor();
  assert.equal(await content.locator('.term').count(),spectrum.terms);
 });
 await attempt('Sky scattering dialog works on a phone and runs the sunset',async()=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/naturfag#waves/em/fagstoff');
  const content=page.frameLocator('#waves-module-frame');
  const launcher=content.locator('#sky-open'),dialog=content.locator('#sky-dialog');
  await launcher.click();
  await content.locator('#sky-dialog[open]').waitFor();
  assert.equal(await launcher.getAttribute('aria-expanded'),'true');
  assert.equal(await dialog.evaluate(d=>d.scrollWidth>d.clientWidth+1),false,'Dialog fits the phone width.');
  const disc=content.locator('#sky-disc'),daylight=await disc.getAttribute('fill');
  await content.locator('#sky-elevation').press('Home');
  assert.equal(await content.locator('#sky-angle').innerText(),'0°');
  assert.notEqual(await disc.getAttribute('fill'),daylight);
  await content.locator('#sky-play').click();
  await content.locator('#sky-angle').filter({hasNotText:/^0°$/}).waitFor();
  await page.keyboard.press('Escape');
  await content.locator('#sky-dialog[open]').waitFor({state:'hidden'});
  await content.locator('#sky-open:focus').waitFor();
  assert.equal(await launcher.getAttribute('aria-expanded'),'false');
 });
 await attempt('Interference link opens two slits and the fixed pattern',async()=>{
  await page.setViewportSize({width:1440,height:1000});
  const hash='#waves/fenomener/fagstoff/to-spalter';
  await page.goto(base+'/naturfag#waves/em/fagstoff');
  const content=page.frameLocator('#waves-module-frame');
  await content.locator('.ld-more summary').click();
  const link=content.locator('.ld-interference-link');
  assert.equal(await link.getAttribute('href'),'/naturfag'+hash);
  await link.click();
  await page.waitForURL('**/naturfag'+hash);
  await content.locator('#wave-anchor-to-spalter:focus').waitFor();
  assert.ok(await content.locator('#df-two').isChecked());
  assert.ok(await content.locator('#df-show-pattern').isChecked());
  assert.match(await content.locator('#wv-diffraction').getAttribute('aria-label'),/Fast interferensmønster/);
  await page.reload();
  await content.locator('#wave-anchor-to-spalter:focus').waitFor();
  assert.ok(await content.locator('#df-two').isChecked());
  await page.goto(base+'/naturfag#waves/fenomener/fagstoff/interferens');
  await content.locator('#wave-anchor-interferens:focus').waitFor();
  assert.equal(await content.locator('#df-two').isChecked(),false);
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
