/* Small local region illustrations, derived from the existing Natural Earth maps. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),geo=path.join(root,'assets/geography');
const checking=process.argv.includes('--check');
const symbols=fs.readFileSync(path.join(geo,'kart-cards.svg'),'utf8');
const round=n=>Number(n.toFixed(2));
function area(points){return Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;}
function simplify(points,tolerance){
  if(points.length<4)return points;
  const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  let greatest=tolerance*tolerance,index=-1;
  for(let i=1;i<points.length-1;i++){
    const p=points[i],t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
    const distance=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2;
    if(distance>greatest){greatest=distance;index=i;}
  }
  return index<0?[a,b]:simplify(points.slice(0,index+1),tolerance).slice(0,-1).concat(simplify(points.slice(index),tolerance));
}
function rings(d){
  const output=[];
  for(const part of d.matchAll(/M([^Z]+)Z/g)){
    let cursor=[0,0],points=[];
    for(const item of ('M'+part[1]).matchAll(/([MLl])([^MLl]+)/g)){
      const values=item[2].match(/-?\d+(?:\.\d+)?/g).map(Number);
      for(let i=0;i<values.length;i+=2){
        cursor=item[1]==='l'?[cursor[0]+values[i],cursor[1]+values[i+1]]:[values[i],values[i+1]];
        points.push(cursor);
      }
    }
    if(points.length>=3)output.push(points);
  }
  return output;
}
function pathData(polygons){return polygons.map(points=>points.map((p,i)=>(i?'L':'M')+p.map(round).join(' ')).join('')+'Z').join('');}
function shell(title,content){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 96" role="img" aria-label="${title}"><circle cx="60" cy="48" r="42" fill="#eaf1e2"/>${content}</svg>\n`;}
const outputs=new Map();
for(const [source,name,title] of [
  ['asia','asia','Asia'],['europe','europe','Europa'],['northAmerica','northamerica','Nord- og Mellom-Amerika'],
  ['southAmerica','southamerica','Sør-Amerika'],['oceania','oceania','Oseania'],['africa','africa','Afrika']
]){
  const symbol=symbols.match(new RegExp(`<symbol id="${source}"[^>]*>([\\s\\S]*?)</symbol>`));assert(symbol,'Existing Kart region '+source);
  const paths=[...symbol[1].matchAll(/\bd="([^"]+)"/g)].flatMap(match=>rings(match[1])).filter(points=>area(points)>.3);
  assert(paths.length,'Real polygon geometry for '+name);
  const points=paths.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
  const scale=Math.min(84/width,70/height),x=60-(left+width/2)*scale,y=48-(top+height/2)*scale;
  const transformed=paths.map(ring=>ring.map(p=>[p[0]*scale+x,p[1]*scale+y]));
  outputs.set(name,shell(title,`<path d="${pathData(transformed)}" fill="#245845" fill-rule="evenodd" stroke="#245845" stroke-width=".45" stroke-linejoin="round"/><path d="M91 24h7m-3.5-3.5v7" fill="none" stroke="#9dbb8d" stroke-width="1.25" stroke-linecap="round"/>`));
}
// The frozen world background supplies the same real coastlines used by the
// river quiz. It remains independent of changes to the current river selection.
const water=JSON.parse(fs.readFileSync(path.join(geo,'physical-maps/world-water.json'),'utf8'));
const land=water.background.filter(layer=>layer.kind==='land').flatMap(layer=>rings(layer.d))
  .filter(points=>area(points)>4).map(points=>simplify(points,1.4).map(([x,y])=>[26+x*.068,23+y*.0889]));
assert(land.length>10,'World illustration keeps the major land masses and islands');
outputs.set('world',shell('Hele verden',`<defs><clipPath id="globe"><circle cx="60" cy="48" r="34"/></clipPath></defs><circle cx="60" cy="48" r="34" fill="#fffefa"/><g clip-path="url(#globe)"><path d="${pathData(land)}" fill="#245845" fill-rule="evenodd"/><g fill="none" stroke="#9dbb8d" stroke-width=".7" opacity=".65"><ellipse cx="60" cy="48" rx="15" ry="34"/><path d="M26 48h68M29 36h62M29 60h62"/></g></g><circle cx="60" cy="48" r="34" fill="none" stroke="#245845" stroke-width="1.3"/><path d="m94 18 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="#9dbb8d"/>`));
const directory=path.join(geo,'quiz-regions');
if(!checking)fs.mkdirSync(directory,{recursive:true});
for(const [name,svg] of outputs){
  const destination=path.join(directory,name+'.svg');
  if(checking)assert.equal(fs.readFileSync(destination,'utf8'),svg,'Rebuild region illustration '+name);
  else fs.writeFileSync(destination,svg);
}
console.log((checking?'PASS verified':'Built')+' 7 local region illustrations from existing Natural Earth outlines');
