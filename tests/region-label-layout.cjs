const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,'assets/geography',file),'utf8'));
const maps=read('continent-maps.json').regions,data=read('region-capitals.json').regions,names=read('quiz-english-names.json'),geo=require('../assets/geography/statle-label-layout.js'),layout=require('../assets/geography/region-label-layout.js');
for(const english of [false,true])for(const [region,map]of Object.entries(maps)){
 const measure=(text,size,kind)=>text.length*size*(kind==='state'?.64:.59);
 measure.metrics=(size,kind)=>({fontBoundingBoxAscent:size*1.05,fontBoundingBoxDescent:size*.3});
 const start=performance.now(),caps=data[region].capitals,result=layout.layout({states:map.states,capitalData:caps,countryName:n=>english?(names[n]||n):n,capitalName:(name,row)=>english?row.en:name,fontSize:8,cityFontSize:7,dotRadius:4.5,measure});
 assert.deepEqual(result.issues,[]);assert.equal(result.stateLabels.length,map.states.length);assert.equal(result.cityLabels.length,map.states.length);
 const dots=map.states.map(s=>({x:caps[s.n].p[0],y:caps[s.n].p[1]})),labels=[...result.stateLabels,...result.cityLabels];
 assert.equal(new Set(result.stateLabels.map(l=>l.state)).size,map.states.length);assert.equal(new Set(result.cityLabels.map(l=>l.state)).size,map.states.length);
 for(const label of labels){const metrics=measure.metrics(label.fontSize,label.kind);assert.ok(label.box.y<=label.y-metrics.fontBoundingBoxAscent-1.19);assert.ok(label.box.y+label.box.h>=label.y+(label.lines.length-1)*label.fontSize*1.12+metrics.fontBoundingBoxDescent+1.19);for(const dot of dots)assert.ok(geo.pointBox(dot,label.box)>=4.5,region+' '+label.state+' clears every capital dot');assert.ok(label.box.x>=8&&label.box.y>=8&&label.box.x+label.box.w<=892&&label.box.y+label.box.h<=642);}
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)assert.ok(!geo.intersects(labels[i].box,labels[j].box),region+' '+labels[i].state+' text does not overlap '+labels[j].state);
 for(const label of result.stateLabels.filter(l=>!l.callout)){const s=map.states.find(s=>s.n===label.state),rings=geo.parsePath(s.d);assert.ok(rings.some(r=>geo.boxInside(label.box,r)),region+' '+label.state+' country label is inside its own land');for(let step=0;step<=24;step++)for(const point of [[label.box.x+label.box.w*step/24,label.box.y],[label.box.x+label.box.w*step/24,label.box.y+label.box.h],[label.box.x,label.box.y+label.box.h*step/24],[label.box.x+label.box.w,label.box.y+label.box.h*step/24]])assert.ok(rings.some(r=>geo.contains(point,r)),region+' '+label.state+' every text edge stays inside land');}
 const only=layout.layout({states:map.states,capitalData:caps,showCapitals:false});assert.equal(only.stateLabels.length,map.states.length);assert.equal(only.cityLabels.length,0);assert.deepEqual(only.issues,[]);
 console.log('PASS',region,english?'English':'Norwegian',labels.length,'labels',Math.round(performance.now()-start)+'ms');
}
