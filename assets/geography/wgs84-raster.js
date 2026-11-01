/* Project official WGS84 raster tiles into an ETRS89/UTM33 map with a texture mesh. */
(function(root){
 'use strict';
 const A=6378137,F=1/298.257222101,K=.9996,E=Math.sqrt(F*(2-F)),N=F/(2-F),M=A/(1+N)*(1+N*N/4+N**4/64+N**6/256),PADDING=8;
 const alpha=[0,N/2-2*N*N/3+5*N**3/16+41*N**4/180-127*N**5/288+7891*N**6/37800,13*N*N/48-3*N**3/5+557*N**4/1440+281*N**5/630-1983433*N**6/1935360,61*N**3/240-103*N**4/140+15061*N**5/26880+167603*N**6/181440,49561*N**4/161280-179*N**5/168+6601661*N**6/7257600,34729*N**5/80640-3418889*N**6/1995840,212378941*N**6/319334400];
 function geographicToUTM(lon,lat){
  const l=(lon-15)*Math.PI/180,t=Math.tan(lat*Math.PI/180),s=Math.sinh(E*Math.atanh(E*t/Math.hypot(1,t))),tp=t*Math.hypot(1,s)-s*Math.hypot(1,t),xp=Math.atan2(tp,Math.cos(l)),ep=Math.asinh(Math.sin(l)/Math.hypot(tp,Math.cos(l)));
  let x=xp,e=ep;for(let j=1;j<=6;j++){x+=alpha[j]*Math.sin(2*j*xp)*Math.cosh(2*j*ep);e+=alpha[j]*Math.cos(2*j*xp)*Math.sinh(2*j*ep);}return [500000+K*M*e,K*M*x];
 }
 function utmToGeographic(easting,northing){
  let lat=northing/111000,lon=15+(easting-500000)/(111320*Math.max(.1,Math.cos(lat*Math.PI/180)));
  for(let i=0;i<9;i++){
   const p=geographicToUTM(lon,lat),dx=easting-p[0],dy=northing-p[1];if(Math.hypot(dx,dy)<.000001)break;
   const step=.00001,a=geographicToUTM(lon+step,lat),b=geographicToUTM(lon,lat+step),ax=(a[0]-p[0])/step,ay=(a[1]-p[1])/step,bx=(b[0]-p[0])/step,by=(b[1]-p[1])/step,det=ax*by-bx*ay;
   if(!Number.isFinite(det)||Math.abs(det)<1)return null;lon+=(dx*by-bx*dy)/det;lat+=(ax*dy-dx*ay)/det;
  }
  return Number.isFinite(lon)&&Number.isFinite(lat)&&Math.abs(lat)<89.9?[lon,lat]:null;
 }
 function triangle(ctx,image,source,dest){
  const [s0,s1,s2]=source,[p0,p1,p2]=dest,du1=s1[0]-s0[0],dv1=s1[1]-s0[1],du2=s2[0]-s0[0],dv2=s2[1]-s0[1],det=du1*dv2-du2*dv1;if(Math.abs(det)<1e-9)return;
  const a=((p1[0]-p0[0])*dv2-(p2[0]-p0[0])*dv1)/det,c=((p2[0]-p0[0])*du1-(p1[0]-p0[0])*du2)/det,b=((p1[1]-p0[1])*dv2-(p2[1]-p0[1])*dv1)/det,d=((p2[1]-p0[1])*du1-(p1[1]-p0[1])*du2)/det;
  // Cover each edge by one CSS pixel, including the long, narrow polar triangles.
  const mid=[(p0[0]+p1[0]+p2[0])/3,(p0[1]+p1[1]+p2[1])/3],distance=Math.min(...dest.map((p,i)=>{const q=dest[(i+1)%3],dx=q[0]-p[0],dy=q[1]-p[1];return Math.abs(dx*(mid[1]-p[1])-dy*(mid[0]-p[0]))/Math.hypot(dx,dy);})),scale=1+1/Math.max(distance,.001),expanded=dest.map(p=>[mid[0]+(p[0]-mid[0])*scale,mid[1]+(p[1]-mid[1])*scale]);
  ctx.save();ctx.beginPath();ctx.moveTo(...expanded[0]);ctx.lineTo(...expanded[1]);ctx.lineTo(...expanded[2]);ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,p0[0]-a*s0[0]-c*s0[1],p0[1]-b*s0[0]-d*s0[1]);ctx.drawImage(image,-PADDING,-PADDING);ctx.restore();
 }
 function create({sourceURL,project,repaint,status=()=>{},maxZoom=22,maxTiles=120}){
  const cache=new Map();let visible=new Set(),active=0,enabled=true,disposed=false,level=0;
  const base=sourceURL.replace(/\/$/,'');
  function report(){const list=[...visible].map(key=>cache.get(key)).filter(Boolean);status(!enabled?'':list.some(t=>t.status==='error')?'Kartbildene kunne ikke lastes. Velg kartlaget på nytt for å prøve igjen.':list.some(t=>t.status!=='ready')?'Laster kartbilder …':'');}
  function buildMesh(tile){
   const mesh=[],steps=8,span=180/2**tile.z,west=-180+tile.col*span,north=90-tile.row*span;
   for(let y=0;y<=steps;y++)for(let x=0;x<=steps;x++)mesh.push(project(west+x/steps*span,north-y/steps*span));tile.mesh=mesh;
   // Duplicate edge texels so expanded mesh clips also cover boundaries between tiles.
   const texture=root.document.createElement('canvas'),ctx=texture.getContext('2d'),size=256,p=PADDING;texture.width=texture.height=size+2*p;
   ctx.drawImage(tile.image,0,0,size,size,p,p,size,size);
   ctx.drawImage(tile.image,0,0,1,size,0,p,p,size);ctx.drawImage(tile.image,size-1,0,1,size,p+size,p,p,size);
   ctx.drawImage(tile.image,0,0,size,1,p,0,size,p);ctx.drawImage(tile.image,0,size-1,size,1,p,p+size,size,p);
   for(const x of [0,size-1])for(const y of [0,size-1])ctx.drawImage(tile.image,x,y,1,1,x===0?0:p+size,y===0?0:p+size,p,p);tile.texture=texture;
  }
  function load(){
   if(!enabled||disposed)return;
   for(const key of visible){if(active>=8)break;const tile=cache.get(key);if(tile.status!=='queued')continue;tile.status='loading';tile.attempts++;active++;
    const image=new Image();image.crossOrigin='anonymous';tile.image=image;let ended=false;
    const finish=value=>{if(ended)return;ended=true;clearTimeout(timer);active--;image.onload=image.onerror=null;tile.status=value==='error'&&tile.attempts<2?'queued':value;if(value==='ready')buildMesh(tile);report();repaint();load();};
    const timer=setTimeout(()=>{finish('error');image.removeAttribute('src');},15000);tile.cancel=()=>{finish('queued');image.removeAttribute('src');};
    image.onload=()=>finish('ready');image.onerror=()=>finish('error');image.src=base+'/tile/'+tile.z+'/'+tile.row+'/'+tile.col;
   }
  }
  function draw(ctx,{width,height,utmBounds,pixelsPerMetre,screen}){
   if(!enabled||disposed)return;
   const [west,south,east,north]=utmBounds,geographic=[];
   for(let y=0;y<=2;y++)for(let x=0;x<=2;x++){const p=utmToGeographic(west+(east-west)*x/2,south+(north-south)*y/2);if(p)geographic.push(p);}
   if(!geographic.length)return;
   const center=utmToGeographic((west+east)/2,(south+north)/2),cos=Math.max(.08,Math.cos((center?.[1]||60)*Math.PI/180));
   level=Math.max(0,Math.min(maxZoom,Math.round(Math.log2(180*111320*Math.sqrt(cos)*pixelsPerMetre/256))));
   const span=180/2**level,rows=2**level,cols=2*rows,lons=geographic.map(p=>p[0]),lats=geographic.map(p=>p[1]);
   const c0=Math.max(0,Math.floor((Math.min(...lons)+180)/span)),c1=Math.min(cols-1,Math.floor((Math.max(...lons)+180)/span)),r0=Math.max(0,Math.floor((90-Math.max(...lats))/span)),r1=Math.min(rows-1,Math.floor((90-Math.min(...lats))/span));
   visible=new Set();const pending=[];
   for(let row=r0;row<=r1;row++)for(let col=c0;col<=c1;col++)pending.push({row,col,distance:(col-(c0+c1)/2)**2+(row-(r0+r1)/2)**2});
   pending.sort((a,b)=>a.distance-b.distance);
   for(const {row,col} of pending.slice(0,256)){const key=[level,row,col].join('/');visible.add(key);if(!cache.has(key))cache.set(key,{z:level,row,col,status:'queued',attempts:0});cache.get(key).used=performance.now();}
   for(const [key,tile] of cache)if(tile.status==='loading'&&!visible.has(key))tile.cancel();
   for(const [key,tile] of cache){if(!visible.has(key)||tile.status!=='ready')continue;const points=tile.mesh.map(p=>screen(...p));
    const bounds=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];if(bounds[2]<0||bounds[0]>width||bounds[3]<0||bounds[1]>height)continue;
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
     const a=y*9+x,b=a+1,c=a+9,d=c+1,s0=[x*32,y*32],s1=[(x+1)*32,y*32],s2=[x*32,(y+1)*32],s3=[(x+1)*32,(y+1)*32];
     triangle(ctx,tile.texture,[s0,s1,s3],[points[a],points[b],points[d]]);triangle(ctx,tile.texture,[s0,s3,s2],[points[a],points[d],points[c]]);
    }
   }
   for(const [key,tile] of [...cache].sort((a,b)=>(a[1].used||0)-(b[1].used||0))){if(cache.size<=maxTiles)break;if(!visible.has(key)&&tile.status!=='loading')cache.delete(key);}
   load();report();
  }
  return {draw,retry(){for(const tile of cache.values())if(tile.status==='error'){tile.status='queued';tile.attempts=0;}repaint();},setVisible(value){enabled=!!value;if(!enabled){for(const tile of cache.values())if(tile.status==='loading')tile.cancel();visible.clear();}else load();report();repaint();},snapshot(){const list=[...visible].map(key=>cache.get(key));return {level,tileCount:list.length,pending:list.filter(t=>t.status==='queued'||t.status==='loading').length,failed:list.filter(t=>t.status==='error').length,ready:list.filter(t=>t.status==='ready').length,cached:cache.size,tiles:list.map(t=>({z:t.z,row:t.row,col:t.col,status:t.status}))};},destroy(){disposed=true;enabled=false;for(const tile of cache.values())if(tile.status==='loading')tile.cancel();cache.clear();visible.clear();}};
 }
 root.WGS84Raster={create,geographicToUTM,utmToGeographic};
})(typeof window==='undefined'?globalThis:window);
