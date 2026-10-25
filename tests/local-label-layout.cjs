const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,'assets/geography',file),'utf8'));
const layout=require('../assets/geography/local-label-layout.js'),geo=require('../assets/geography/statle-label-layout.js');
const index=read('municipalities/index-v3.json'),maps=index.counties.map(c=>[c.name,read('municipalities/'+c.file)]);
maps.push(['Oslo local',read('oslo-bydeler/oslo.json')]);
const measure=(text,size)=>text.length*size*.63;
measure.metrics=size=>({fontBoundingBoxAscent:size*1.05,fontBoundingBoxDescent:size*.3});
function check(name,map,viewBox,fontSize,all){
  const started=performance.now(),result=layout.layout({states:map.states,viewBox,fontSize,measure});
  assert.deepEqual(result.issues,[],name+' every visible label fits');
  assert.equal(result.cityLabels.length,0);
  assert.equal(new Set(result.stateLabels.map(l=>l.state)).size,result.stateLabels.length);
  if(all)assert.equal(result.stateLabels.length,map.states.length,name+' every target appears at full extent');
  for(const label of result.stateLabels){
    const b=label.box;assert.ok(b.x>=viewBox[0]&&b.y>=viewBox[1]&&b.x+b.w<=viewBox[0]+viewBox[2]&&b.y+b.h<=viewBox[1]+viewBox[3]);
    assert.equal(label.lines.join(' '),label.state);
    const state=map.states.find(s=>s.n===label.state),rings=geo.parsePath(state.d);
    if(label.callout){const p=[label.leader.x1,label.leader.y1];assert.ok(rings.reduce((hit,r)=>hit!==geo.contains(p,r),false),name+' '+label.state+' leader starts in own shape');}
    else for(const px of [b.x,b.x+b.w/2,b.x+b.w])for(const py of [b.y,b.y+b.h/2,b.y+b.h])assert.ok(rings.reduce((hit,r)=>hit!==geo.contains([px,py],r),false),name+' '+label.state+' label stays in own shape');
  }
  for(let i=0;i<result.stateLabels.length;i++)for(let j=i+1;j<result.stateLabels.length;j++)assert.ok(!geo.intersects(result.stateLabels[i].box,result.stateLabels[j].box),name+' names do not overlap');
  console.log('PASS',name,result.stateLabels.length,'labels',Math.round(performance.now()-started)+'ms');return result;
}
for(const[name,map]of maps)check(name,map,map.viewBox,Math.min(map.viewBox[2],map.viewBox[3])/55,true);
const oslo=maps.at(-1)[1],center=oslo.camera.center,home=[center[0]-oslo.camera.minWidth/2,center[1]-oslo.camera.height/2,oslo.camera.minWidth,oslo.camera.height];
const homeResult=check('Oslo home',oslo,home,3.5,false);assert.ok(homeResult.stateLabels.length>20&&homeResult.stateLabels.length<=43);
const mobile=[center[0]-100,center[1]-210,200,420],mobileResult=check('Oslo mobile',oslo,mobile,5.2,false);assert.ok(mobileResult.stateLabels.length>15);
// A hole or a later, visible nested target must not receive its parent's label.
const nested={viewBox:[0,0,200,150],states:[{n:'Parent',d:'M10 10L190 10L190 140L10 140Z',c:[100,70]},{n:'Inner area',d:'M70 40L140 40L140 100L70 100Z',c:[110,65]}]};
const nestedResult=check('Nested areas',nested,nested.viewBox,10,true),parent=nestedResult.stateLabels.find(l=>l.state==='Parent');
assert.ok(parent.callout||!geo.intersects(parent.box,{x:70,y:40,w:70,h:60}));
const zoomed=layout.layout({states:nested.states,viewBox:[72,42,60,50],fontSize:5,measure});assert.deepEqual(zoomed.stateLabels.map(l=>l.state),['Inner area']);
console.log('PASS offscreen labels are omitted and overlapping geographic levels remain distinct');
