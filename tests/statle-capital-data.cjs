const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=name=>JSON.parse(fs.readFileSync(path.join(root,'assets/geography',name),'utf8'));
const states=read('us-states.json'),capitals=read('us-capitals.json');
assert.equal(Object.keys(capitals).length,50);
for(const state of states){
 const capital=capitals[state.n];assert.ok(capital?.name,state.n+' has a capital');
 assert.ok(Number.isFinite(capital.lat)&&Number.isFinite(capital.lon));
 const [x,y]=capital.p;assert.ok(Number.isFinite(x)&&Number.isFinite(y));
 let inside=false,nearest=Infinity;
 for(const ring of state.d.split('Z')){
  const points=[...ring.matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[i],b=points[j];
   if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
   const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));
   nearest=Math.min(nearest,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
  }
 }
 // Simplified coastlines may omit a harbour or round a point by a fraction of a source pixel.
 assert.ok(inside||nearest<0.7,state.n+' capital marker falls inside its state ('+nearest+')');
}
assert.equal(capitals.Alaska.name,'Juneau');assert.equal(capitals.Hawaii.name,'Honolulu');
assert.equal(capitals['New York'].name,'Albany');assert.equal(capitals.California.name,'Sacramento');
console.log('PASS all 50 capital markers match their state geometry');

const crypto=require('node:crypto'),relief=read('us-relief.json');
for(const area of ['main','AK','HI']){
 const entry=relief.areas[area],image=fs.readFileSync(path.join(root,'assets/geography',entry.image));
 assert.equal(image.subarray(0,4).toString(),'RIFF');assert.equal(image.subarray(8,12).toString(),'WEBP');
 assert.ok(entry.image.includes(crypto.createHash('sha256').update(image).digest('hex').slice(0,12)));
 const [x,y,w,h]=entry.bounds;assert.ok(w>0&&h>0);
 for(const state of states.filter(s=>(['AK','HI'].includes(s.a)?s.a:'main')===area)){
  const [cx,cy]=capitals[state.n].p;
  assert.ok(cx>=x&&cx<=x+w&&cy>=y&&cy<=y+h,state.n+' capital falls inside the matching relief image');
 }
 if(area!=='HI')assert.ok(entry.rivers.length>1000);
}
console.log('PASS mainland, Alaska and Hawaii relief assets and capital alignment');
