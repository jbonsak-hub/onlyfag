/* Mild geographic rejection sampling. Start with ordinary random rounds;
   no continent is guaranteed a slot and no small region is filled by quota. */
(() => {
 'use strict';
 function distance(a,b){
  const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;
  const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
  return 12742*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));
 }
 function analyse(targets){
  const distances=targets.map(a=>targets.map(b=>distance(a,b)));
  const nearby=Math.max(0,...distances.map(row=>row.filter(km=>km<1800).length));
  const span=Math.max(0,...distances.flat());let threeAreas=false;
  for(let i=0;i<targets.length&&!threeAreas;i++)for(let j=i+1;j<targets.length&&!threeAreas;j++){
   if(distances[i][j]<2500)continue;
   for(let k=j+1;k<targets.length;k++)if(distances[i][k]>=2500&&distances[j][k]>=2500){threeAreas=true;break;}
  }
  const penalty=Math.max(0,nearby-5)*3+Math.max(0,6500-span)/2000+(threeAreas?0:2);
  return {nearby,span,threeAreas,penalty};
 }
 function spread(draw){
  let best=null,bestPenalty=Infinity;
  // Redraw a crowded round as a whole. Do not specifically select a distant
  // island to repair it, which would overuse the same small pools of places.
  for(let attempt=0;attempt<24;attempt++){
   const round=draw(),quality=analyse(round);
   if(quality.penalty===0)return round;
   if(quality.penalty<bestPenalty){best=round;bestPenalty=quality.penalty;}
  }
  // A bounded fallback also supports old or unusually narrow target pools.
  return best;
 }
 globalThis.MapWizSampling=Object.freeze({spread,analyse,distance});
})();
