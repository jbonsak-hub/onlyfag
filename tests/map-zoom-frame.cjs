const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

// Exercise the real camera with an in-memory SVG/DOM and deterministic frames.
// No browser, timers, network or synthetic browser instrumentation is used.
function fixture(){
  const frames=new Map(),globalEvents=new Map();let frameId=0;
  const eventTarget=()=>({listeners:new Map(),addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);},emit(type,event={}){for(const fn of this.listeners.get(type)||[])fn(event);}});
  const marker={writes:[],circle:{cx:{baseVal:{value:867}},cy:{baseVal:{value:162}}},querySelector(selector){assert.equal(selector,'circle');return this.circle;},setAttribute(name,value){this.writes.push({name,value});}};
  const rect={left:0,top:0,width:900,height:550};
  const svg=Object.assign(eventTarget(),{
    viewBox:{baseVal:{x:0,y:0,width:900,height:550}},
    preserveAspectRatio:{baseVal:{align:6}},writes:[],classes:new Set(),
    classList:{toggle(name,enabled){enabled?svg.classes.add(name):svg.classes.delete(name);}},
    getBoundingClientRect(){return {...rect};},
    getScreenCTM(){const v=this.viewBox.baseVal,s=Math.min(rect.width/v.width,rect.height/v.height);return {a:s,b:0,c:0,d:s,e:-v.x*s,f:-v.y*s,inverse(){return {a:1/s,b:0,c:0,d:1/s,e:v.x,f:v.y};}};},
    querySelectorAll(selector){assert.equal(selector,'.small-marker');return [marker];},
    setAttribute(name,value){this.writes.push({name,value});assert.equal(name,'viewBox');const [x,y,width,height]=value.split(' ').map(Number);this.viewBox.baseVal={x,y,width,height};}
  });
  const elements={map:svg,'map-zoom-value':{textContent:''}};
  for(const name of ['map-zoom-out','map-zoom-in','map-zoom-reset'])elements[name]=Object.assign(eventTarget(),{disabled:false});
  class DOMPoint{constructor(x,y){this.x=x;this.y=y;}matrixTransform(m){return new DOMPoint(m.a*this.x+m.c*this.y+m.e,m.b*this.x+m.d*this.y+m.f);}}
  const sandbox={document:{getElementById:id=>elements[id]||null},DOMPoint,performance:{now:()=>1000},
    requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id;},
    addEventListener(type,fn){if(!globalEvents.has(type))globalEvents.set(type,[]);globalEvents.get(type).push(fn);}
  };
  sandbox.window=sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/geography/map-zoom.js'),'utf8'),sandbox,{filename:'map-zoom.js'});
  const flush=()=>{const scheduled=[...frames.values()];frames.clear();scheduled.forEach(fn=>fn(1000));};
  const emit=(type,event={})=>{for(const fn of globalEvents.get(type)||[])fn(event);};
  const clearWrites=()=>{svg.writes.length=0;marker.writes.length=0;};
  return {svg,marker,elements,api:sandbox.ClickMapZoom,rect,frames,flush,emit,clearWrites};
}
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const check=(name,fn)=>{fn();console.log('PASS '+name);};

check('zoom bursts coalesce into one viewBox paint per animation frame',()=>{
  const f=fixture();assert.equal(f.frames.size,1);f.flush();f.clearWrites();
  for(let i=0;i<12;i++)f.api.zoom(1.03);
  assert.equal(f.frames.size,1);assert.equal(f.svg.writes.length,0);assert.equal(f.marker.writes.length,0);
  f.flush();assert.equal(f.svg.writes.length,1);assert.equal(f.marker.writes.length,1);
  close(f.svg.viewBox.baseVal.width,900/(1.03**12));
  for(let i=0;i<8;i++)f.api.zoom(1.01);
  assert.equal(f.frames.size,1);f.flush();assert.equal(f.svg.writes.length,2);
});
check('repeated unchanged paints avoid viewBox and marker writes',()=>{
  const f=fixture();f.flush();f.clearWrites();
  for(let i=0;i<20;i++){f.api.zoom(1);f.emit('resize');}
  assert.equal(f.frames.size,1);f.flush();assert.equal(f.svg.writes.length,0);assert.equal(f.marker.writes.length,0);
  f.emit('resize');f.flush();assert.equal(f.svg.writes.length,0);assert.equal(f.marker.writes.length,0);
});
check('pan-only changes retain marker scale without rewriting transforms',()=>{
  const f=fixture();f.flush();f.api.zoom(2);f.flush();f.clearWrites();
  f.svg.emit('pointerdown',{button:0,pointerId:1,clientX:450,clientY:275});
  f.emit('pointermove',{pointerId:1,clientX:460,clientY:280});
  f.emit('pointermove',{pointerId:1,clientX:480,clientY:290});
  assert.equal(f.frames.size,1);f.flush();assert.equal(f.svg.writes.length,1);assert.equal(f.marker.writes.length,0);
  close(f.svg.viewBox.baseVal.width,450);close(f.svg.viewBox.baseVal.x,210);close(f.svg.viewBox.baseVal.y,130);
  f.emit('pointerup',{pointerId:1,type:'pointerup'});
});
check('reset restores the declared base after zoom and pan',()=>{
  const f=fixture();f.flush();f.api.zoom(3);f.flush();f.clearWrites();
  f.api.reset();assert.equal(f.frames.size,1);f.flush();
  assert.deepEqual({...f.svg.viewBox.baseVal},{x:0,y:0,width:900,height:550});
  assert.equal(f.elements['map-zoom-value'].textContent,'100%');assert.ok(!f.svg.classes.has('map-is-zoomed'));
  assert.equal(f.elements['map-zoom-out'].disabled,true);assert.equal(f.marker.writes.length,1);
  f.clearWrites();f.api.reset();f.flush();assert.equal(f.svg.writes.length,0);assert.equal(f.marker.writes.length,0);
});
check('responsive camera and reset retain its center and minimum width',()=>{
  const f=fixture();f.flush();f.api.setBase({center:[100,200],height:600,minWidth:1200});f.flush();
  let v=f.svg.viewBox.baseVal;close(v.width,1200);close(v.height,1200*550/900);close(v.x+v.width/2,100);close(v.y+v.height/2,200);
  f.api.zoom(2);f.flush();f.rect.width=1200;f.rect.height=800;f.emit('resize');f.flush();
  v=f.svg.viewBox.baseVal;close(v.width,600);close(v.height,400);close(v.x+v.width/2,100);close(v.y+v.height/2,200);
  f.api.reset();f.flush();v=f.svg.viewBox.baseVal;close(v.width,1200);close(v.height,800);close(v.x,-500);close(v.y,-200);
});
