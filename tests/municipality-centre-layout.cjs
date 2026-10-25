const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,'assets/geography',file),'utf8'));
const layout=require('../assets/geography/local-label-layout.js'),geo=require('../assets/geography/statle-label-layout.js');
const atlas=read('municipality-centres.json'),index=read('municipalities/index-v3.json');
const measure=(text,size,kind)=>text.length*size*(kind==='city'?.6:.63);
measure.metrics=size=>({fontBoundingBoxAscent:size*1.05,fontBoundingBoxDescent:size*.3});
for(const county of index.counties)for(const [screenName,screenWidth,screenHeight]of [['desktop',1020,720],['mobile',390,400]]){
  const map=read('municipalities/'+county.file),centres=atlas.regions['county-'+county.code].centres;
  const cities=new Map(map.states.map(s=>[s.n,{name:centres[s.n].name,x:centres[s.n].p[0],y:centres[s.n].p[1],locations:centres[s.n].locations}]));
  const scale=Math.min(screenWidth/map.viewBox[2],screenHeight/map.viewBox[3]),fontSize=10/scale;
  const viewBox=[map.viewBox[0]-(screenWidth/scale-map.viewBox[2])/2,map.viewBox[1]-(screenHeight/scale-map.viewBox[3])/2,screenWidth/scale,screenHeight/scale];
  const result=layout.layout({states:map.states,viewBox,cities,fontSize,measure});
  assert.deepEqual(result.issues,[],county.name+' places every label');
  assert.equal(result.stateLabels.length,map.states.length);
  const expected=map.states.reduce((n,s)=>n+(centres[s.n].locations?.length||1),0);
  assert.equal(result.cityLabels.length,expected,county.name+' includes every actual centre');
  const labels=[...result.stateLabels,...result.cityLabels];
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++)assert.ok(!geo.intersects(labels[i].box,labels[j].box),county.name+' labels do not overlap');
  for(const label of labels)for(const city of cities.values())for(const p of city.locations?.length?city.locations.map(c=>c.p):[[city.x,city.y]]){
    const b=label.box,r=fontSize*.4;
    assert.ok(p[0]+r<=b.x||p[0]-r>=b.x+b.w||p[1]+r<=b.y||p[1]-r>=b.y+b.h,county.name+' '+label.lines.join(' ')+' leaves every centre dot clear');
  }
  for(const label of result.cityLabels){const city=cities.get(label.state),locations=city.locations?.length?city.locations:[{name:city.name,p:[city.x,city.y]}];assert.ok(locations.some(p=>p.name===label.lines.join(' ')&&Math.hypot(p.p[0]-label.leader.x1,p.p[1]-label.leader.y1)<.001));}
  console.log('PASS',county.name,screenName,result.stateLabels.length,'municipalities',result.cityLabels.length,'centres; no overlaps or covered dots');
}
const synthetic=[{n:'Kommune',d:'M0 0L300 0L300 200L0 200Z',c:[150,100]}];
const cities=new Map([['Kommune',{name:'First / Second',x:60,y:80,locations:[{name:'First',p:[60,80]},{name:'Second',p:[250,80]}]}]]);
const close=layout.layout({states:synthetic,viewBox:[20,30,110,120],cities,fontSize:8,measure});
assert.deepEqual(close.cityLabels.map(l=>l.lines.join(' ')),['First'],'zoom omits offscreen centre labels');
assert.equal(close.stateLabels.length,1);
console.log('PASS multiple centres and camera filtering retain distinct point ownership');
