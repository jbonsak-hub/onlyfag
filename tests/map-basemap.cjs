const assert=require('node:assert/strict'),test=require('node:test');
const fs=require('node:fs'),path=require('node:path');
const basemap=require('../assets/geography/map-basemap.js');
const close=(actual,expected)=>{assert.equal(actual.length,expected.length);actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-8,`${actual} != ${expected}`));};

test('camera matrix matches SVG meet, slice, none and every alignment',()=>{
  close(basemap.cameraMatrix({viewBox:[10,20,100,50],rect:{width:300,height:300}}),[3,0,0,3,-30,15]);
  close(basemap.cameraMatrix({viewBox:[10,20,100,50],rect:{width:300,height:300},align:1}),[3,0,0,6,-30,-120]);
  close(basemap.cameraMatrix({viewBox:[10,20,100,50],rect:{width:300,height:300},meetOrSlice:2}),[6,0,0,6,-210,-120]);
  for(let align=2;align<=10;align++){
    const matrix=basemap.cameraMatrix({viewBox:[0,0,100,50],rect:{width:300,height:300},align,offsetX:4,offsetY:7});
    close(matrix,[3,0,0,3,4,7+150*Math.floor((align-2)/3)/2]);
    const horizontal=basemap.cameraMatrix({viewBox:[0,0,100,50],rect:{width:600,height:150},align,offsetX:4,offsetY:7});
    close(horizontal,[3,0,0,3,4+300*((align-2)%3)/2,7]);
  }
  assert.equal(basemap.cameraMatrix({viewBox:[0,0,100,50],rect:{width:0,height:0}}),null);
});

test('image matrices apply source bounds before mainland/Alaska/Hawaii transforms',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/geography/us-relief-raster.json'),'utf8'));
  for(const entry of Object.values(manifest.areas)){
    const m=entry.transform,[x,y,w,h]=entry.bounds,combined=basemap.imageMatrix(entry.bounds,m);
    for(const [u,v]of [[0,0],[w,h],[w/2,h/2]]){
      close([combined[0]*u+combined[2]*v+combined[4],combined[1]*u+combined[3]*v+combined[5]],[m[0]*(x+u)+m[2]*(y+v)+m[4],m[1]*(x+u)+m[3]*(y+v)+m[5]]);
    }
  }
  close(basemap.imageMatrix([20,30,40,50],{a:0,b:2,c:-2,d:0,e:5,f:6}),[0,2,-2,0,-55,46]);
});

function fixture(){
  const frames=new Map(),images=[],observers=[],events=new Map(),cameraListeners=new Set();let frameId=0;
  const viewportRect={left:100,top:50,width:900,height:550},svgRect={left:103,top:55,width:900,height:550};
  class Element{
    constructor(tag){this.tagName=tag;this.children=[];this.parentElement=null;this.attrs={};this.dataset={};this.writes=[];this.style=new Proxy({position:'',zIndex:'',willChange:''},{set:(obj,key,value)=>{obj[key]=value;this.writes.push([key,value]);return true;}});this.hidden=false;this.ownerDocument=doc;}
    setAttribute(name,value){this.attrs[name]=value;}
    removeAttribute(name){delete this.attrs[name];if(name==='src'&&this.reject){this.reject(new Error('cancelled decode'));this.reject=null;}}
    append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
    replaceChildren(...nodes){this.children.forEach(n=>{n.parentElement=null;});this.children=[];this.append(...nodes);}
    before(node){const p=this.parentElement,index=p.children.indexOf(this);p.children.splice(index,0,node);node.parentElement=p;}
    remove(){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this),1);this.parentElement=null;}}
    set src(value){this.attrs.src=value;this.srcWrites=(this.srcWrites||0)+1;}
    get src(){return this.attrs.src;}
    decode(){return new Promise((resolve,reject)=>{this.resolve=()=>{this.naturalWidth=100;this.naturalHeight=50;this.reject=null;resolve();};this.reject=reject;});}
  }
  const win={requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),addEventListener(type,fn){if(!events.has(type))events.set(type,new Set());events.get(type).add(fn);},removeEventListener(type,fn){events.get(type)?.delete(fn);},ResizeObserver:class{constructor(fn){this.callback=fn;this.targets=[];observers.push(this);}observe(target){this.targets.push(target);}disconnect(){this.disconnected=true;}},MutationObserver:class{constructor(){throw new Error('Answer/SVG mutations must not be observed when camera subscriptions are present');}}};
  const doc={baseURI:'https://onlyfag.no/geografi/statle.html',defaultView:win,createElement(tag){const el=new Element(tag);if(tag==='img')images.push(el);return el;}};
  const viewport=new Element('div');viewport.getBoundingClientRect=()=>({...viewportRect});viewport.clientLeft=0;viewport.clientTop=0;viewport.scrollLeft=0;viewport.scrollTop=0;
  const svg=new Element('svg');svg.viewBox={baseVal:{x:0,y:0,width:900,height:550}};svg.preserveAspectRatio={baseVal:{align:6,meetOrSlice:1}};svg.getBoundingClientRect=()=>({...svgRect});viewport.append(svg);
  const snapshot=()=>{const v=svg.viewBox.baseVal;return{viewBox:[v.x,v.y,v.width,v.height],rect:{...svgRect},align:6,meetOrSlice:1};};
  const camera={subscribe(fn){cameraListeners.add(fn);fn(snapshot());return()=>cameraListeners.delete(fn);}};
  const emitCamera=()=>{const s=snapshot();for(const fn of cameraListeners)fn(s);};
  const resolveImages=()=>images.forEach(image=>image.resolve?.());
  return{svg,viewport,camera,emitCamera,images,observers,events,frames,cameraListeners,resolveImages,svgRect};
}
const manifest={areas:{main:{image:'main.webp',bounds:[-10,-20,100,50],pixelDimensions:[100,50],transform:[2,0,0,2,5,6]},AK:{image:'alaska.webp',bounds:[0,0,100,50],pixelDimensions:[100,50]}}};

test('decoded HTML images stay outside SVG; answer changes do not touch terrain nodes or image sources',async()=>{
  const f=fixture(),controller=basemap.create({svg:f.svg,viewport:f.viewport,camera:f.camera});
  assert.equal(f.svg.style.willChange,'transform');assert.equal(f.svg.style.transform,undefined,'foreground promotion does not change SVG geometry');
  assert.equal(basemap.create({svg:f.svg,viewport:f.viewport,camera:f.camera}),controller);
  const loading=controller.set(manifest);assert.equal(controller.element.hidden,true);assert.equal(f.images.length,2);assert.equal(f.svg.children.length,0);
  f.resolveImages();assert.equal(await loading,true);controller.show(true);
  const host=controller.element,world=host.children[0];assert.equal(host.hidden,false);assert.equal(f.viewport.children[0],host);assert.deepEqual(world.children,f.images);
  assert.equal(f.images[0].src,'https://onlyfag.no/assets/geography/main.webp');assert.equal(f.images[0].style.width,'100px');assert.equal(f.images[0].naturalWidth,100);
  assert.equal(f.images[0].style.transform,'matrix(2,0,0,2,-15,-34)');
  const oldWrites=world.writes.length,oldSources=f.images.map(i=>i.srcWrites),oldNodes=world.children.slice();
  // Actual answer code changes attributes/classes inside SVG. There is no observer for them.
  f.svg.setAttribute('class','state found correct');f.svg.setAttribute('data-band','0');
  assert.equal(world.writes.length,oldWrites);assert.deepEqual(f.images.map(i=>i.srcWrites),oldSources);assert.deepEqual(world.children,oldNodes);
  f.svg.viewBox.baseVal={x:10,y:5,width:450,height:275};f.emitCamera();assert.equal(world.style.transform,'matrix(2,0,0,2,-17,-5)');
  assert.deepEqual(world.children,oldNodes);assert.deepEqual(f.images.map(i=>i.srcWrites),oldSources);
  const afterCamera=world.writes.length;f.emitCamera();assert.equal(world.writes.length,afterCamera,'unchanged camera skips compositor writes');
  controller.show(false);assert.equal(host.hidden,true);controller.show(true);assert.equal(host.hidden,false);assert.deepEqual(world.children,oldNodes,'toggles reuse decoded images');
  controller.destroy();assert.equal(f.viewport.children.length,1);assert.equal(f.cameraListeners.size,0);assert.ok(f.observers.every(o=>o.disconnected));assert.equal(f.svg.style.position,'');assert.equal(f.svg.style.willChange,'');
});

test('foreground promotion preserves authored compositor hints and restores them on disposal',()=>{
  const f=fixture();f.svg.style.willChange='opacity';f.svg.style.transform='scale(1)';
  const controller=basemap.create({svg:f.svg,viewport:f.viewport,camera:f.camera});
  assert.equal(f.svg.style.willChange,'opacity, transform');assert.equal(f.svg.style.transform,'scale(1)');
  controller.clear();assert.equal(f.svg.style.willChange,'opacity, transform','a region change does not churn the foreground backing');
  controller.destroy();assert.equal(f.svg.style.willChange,'opacity');assert.equal(f.svg.style.transform,'scale(1)');
});

test('clearing or superseding an in-flight region cannot insert stale terrain',async()=>{
  const f=fixture(),controller=basemap.create({svg:f.svg,viewport:f.viewport,camera:f.camera});
  const first=controller.set(manifest);controller.clear();assert.equal(await first,false);assert.equal(controller.visible,false);assert.equal(controller.element.children[0].children.length,0);
  const second=controller.set(manifest),third=controller.set({image:'europe.webp',bounds:[10,20,100,50]});
  f.resolveImages();assert.equal(await second,false);assert.equal(await third,true);controller.show(true);
  assert.equal(controller.element.children[0].children.length,1);assert.ok(controller.element.children[0].children[0].src.endsWith('/europe.webp'));
  const abort=new AbortController(),fourth=controller.set(manifest,{signal:abort.signal});abort.abort();assert.equal(await fourth,false);assert.equal(controller.element.hidden,true);
  controller.destroy();
});
