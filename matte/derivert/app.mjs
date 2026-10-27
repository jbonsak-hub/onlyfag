import {f,derivative,secantSlope,lineSegment,fmt} from './math.mjs';

const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const bounds={xmin:-3.15,xmax:3.35,ymin:-.85,ymax:10.1};
const plot={x:55,y:22,width:790,height:528};
const domain={min:-2.9,max:2.9};
const state={a:1,h:1.6,points:true,secant:true,tangent:true,values:true,triangle:true};
let dragging=null;
const X=x=>plot.x+(x-bounds.xmin)/(bounds.xmax-bounds.xmin)*plot.width;
const Y=y=>plot.y+(bounds.ymax-y)/(bounds.ymax-bounds.ymin)*plot.height;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const node=(tag,attrs={},content)=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);if(content!==undefined)e.textContent=content;return e};
const add=(parent,tag,attrs,content)=>{const e=node(tag,attrs,content);parent.append(e);return e};
const line=(parent,x1,y1,x2,y2,attrs={})=>add(parent,'line',{x1,y1,x2,y2,...attrs});
const text=(parent,x,y,content,cls,anchor='start')=>add(parent,'text',{x,y,class:cls,'text-anchor':anchor},content);
const pathLine=(m,c)=>{const s=lineSegment(m,c,bounds);return s?`M${X(s[0][0])},${Y(s[0][1])}L${X(s[1][0])},${Y(s[1][1])}`:''};

function initializeGraph(){
  const axes=$('axes');axes.replaceChildren();
  line(axes,plot.x,Y(0),plot.x+plot.width+8,Y(0),{class:'axis','marker-end':'url(#axis-arrow)'});
  line(axes,X(0),plot.y+plot.height,X(0),plot.y-5,{class:'axis','marker-end':'url(#axis-arrow)'});
  text(axes,plot.x+plot.width+11,Y(0)+6,'x','axis-label');
  text(axes,X(0)+15,plot.y+7,'f(x)','axis-label');
  const ticks=$('ticks');ticks.replaceChildren();
  for(let x=-3;x<=3;x++){
    line(ticks,X(x),Y(0)-4,X(x),Y(0)+4,{class:'tick'});
    text(ticks,X(x),Y(0)+23,String(x).replace('-','−'),'tick-label','middle');
  }
  for(let y=2;y<=10;y+=2){line(ticks,X(0)-4,Y(y),X(0)+4,Y(y),{class:'tick'});text(ticks,X(0)-13,Y(y)+5,String(y),'tick-label','end')}
  let d='';
  for(let x=bounds.xmin;x<=bounds.xmax+.01;x+=.012){d+=`${d?'L':'M'}${X(x).toFixed(2)},${Y(f(x)).toFixed(2)}`}
  $('curve').setAttribute('d',d);
}

function updateGraph(){
  const {a,h}=state,b=a+h,fa=f(a),fb=f(b),m=secantSlope(a,h),t=derivative(a),zero=h===0;
  const A={x:X(a),y:Y(fa)},B={x:X(b),y:Y(fb)};
  $('secant').style.display=state.secant&&!zero?'':'none';
  $('secant').setAttribute('d',m===null?'':pathLine(m,fa-m*a));
  $('tangent').style.display=state.tangent?'':'none';
  $('tangent').setAttribute('d',pathLine(t,fa-t*a));
  $('ticks').style.display=state.values?'':'none';
  const projections=$('projections');projections.replaceChildren();
  if(state.values){
    for(const p of [{x:A.x,y:A.y},{x:B.x,y:B.y}]){
      line(projections,p.x,Y(0),p.x,p.y,{class:'guide'});
      line(projections,X(0),p.y,p.x,p.y,{class:'guide'});
    }
    const closeX=Math.abs(B.x-A.x)<110,closeY=Math.abs(B.y-A.y)<42;
    text(projections,A.x,Y(0)+49,'x','projection-label','middle');
    if(!zero)text(projections,B.x,Y(0)+(closeX?77:49),'x + Δx','projection-label','middle');
    const leftA=A.x>=X(0),leftB=B.x>=X(0);
    text(projections,X(0)+(leftA?-16:16),A.y-9,'f(x)','projection-label',leftA?'end':'start');
    if(!zero)text(projections,X(0)+(leftB?-16:16),B.y-(closeY?34:9),'f(x + Δx)','projection-label',leftB?'end':'start');
  }
  const triangle=$('triangle');triangle.replaceChildren();
  const annotations=$('annotations');annotations.replaceChildren();
  if(state.triangle&&!zero){
    add(triangle,'path',{d:`M${A.x},${A.y}H${B.x}V${B.y}Z`,class:'triangle-fill'});
    add(triangle,'path',{d:`M${A.x},${A.y}H${B.x}V${B.y}`,class:'triangle-side'});
    if(Math.abs(B.x-A.x)>29&&Math.abs(B.y-A.y)>17){
      const sx=Math.sign(A.x-B.x)*10,sy=Math.sign(B.y-A.y)*10;
      add(triangle,'path',{d:`M${B.x+sx},${A.y}v${sy}h${-sx}`,fill:'none',stroke:'#b7a04d','stroke-width':1});
    }
    if(Math.abs(B.x-A.x)>38){
      const below=fa>=0,dy=below?25:-16;
      text(annotations,(A.x+B.x)/2,A.y+dy,'Δx','triangle-label','middle');
    }
    if(Math.abs(B.y-A.y)>38)text(annotations,B.x+(h>0?13:-13),(A.y+B.y)/2+7,'Δf(x)','triangle-label',h>0?'start':'end');
  }
  if(state.secant&&!zero){
    const seg=lineSegment(m,fa-m*a,bounds);
    if(seg){const end=seg.reduce((p,q)=>q[1]>p[1]?q:p);text(annotations,clamp(X(end[0])-14,plot.x+14,plot.x+plot.width-70),Y(end[1])+36,'Sekant','line-label','end').setAttribute('fill','#465475')}
  }
  if(state.tangent){
    // Choose a label away from A and the secant, including for horizontal tangents.
    const side=a<0?-1:1;
    let tx=clamp(a+side*1.25,bounds.xmin+.5,bounds.xmax-.5),ty=fa+t*(tx-a);
    if(ty>bounds.ymax-1){ty=bounds.ymax-1;tx=t===0?tx:(ty-fa)/t+a}
    if(ty<bounds.ymin+.8){ty=bounds.ymin+.8;tx=t===0?tx:(ty-fa)/t+a}
    text(annotations,X(tx)+side*11,Y(ty)+27,'Tangent','line-label',side>0?'start':'end').setAttribute('fill','#bd4934');
  }
  for(const [id,p,value,label]of[['point-a',A,a,'A'],['point-b',B,b,'B']]){
    const e=$(id);e.style.display=state.points?'':'none';e.setAttribute('tabindex',state.points?'0':'-1');
    e.setAttribute('transform',`translate(${p.x},${p.y})`);e.setAttribute('aria-valuemin',label==='A'?-2.8:domain.min);e.setAttribute('aria-valuemax',label==='A'?2.8:domain.max);e.setAttribute('aria-valuenow',value.toFixed(4));e.setAttribute('aria-valuetext',`${fmt(value,4)}, f(x) = ${fmt(f(value),4)}`);
    const txt=e.querySelector('text');txt.setAttribute('x',label==='A'?-16:16);txt.setAttribute('y',label==='A'?24:-15);txt.setAttribute('text-anchor',label==='A'?'end':'start');
  }
  $('secant-value').textContent=zero?'Udefinert':fmt(m,4);
  $('tangent-value').textContent=fmt(t,4);
  $('delta-value').textContent=fmt(h,4);
  $('secant-readout').hidden=!state.secant;$('tangent-readout').hidden=!state.tangent;
  $('slope-arrow').hidden=!(state.secant&&state.tangent);
  $('drag-hint').style.visibility=state.points?'visible':'hidden';
  arrangeLabels();
}

function render(){updateGraph()}
function changeA(value){const b=state.a+state.h;state.a=clamp(value,-2.8,2.8);state.h=b-state.a;render()}
function changeH(value){state.h=clamp(value,domain.min-state.a,domain.max-state.a);render()}

for(const [key,id]of[['points','show-points'],['secant','show-secant'],['tangent','show-tangent'],['values','show-values'],['triangle','show-triangle']])$(id).addEventListener('change',e=>{state[key]=e.target.checked;render()});
function svgX(event){const p=$('graph').createSVGPoint();p.x=event.clientX;p.y=event.clientY;const matrix=$('graph').getScreenCTM();if(!matrix)return state.a;return bounds.xmin+(p.matrixTransform(matrix.inverse()).x-plot.x)/plot.width*(bounds.xmax-bounds.xmin)}
for(const [id,name]of[['point-a','a'],['point-b','b']]){
  const point=$(id);
  point.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();dragging=name;point.setPointerCapture(e.pointerId);point.focus()});
  point.addEventListener('pointermove',e=>{if(dragging!==name)return;e.preventDefault();const x=Math.round(svgX(e)*1000)/1000;if(name==='a')changeA(x);else changeH(clamp(x,domain.min,domain.max)-state.a)});
  point.addEventListener('pointerup',()=>{dragging=null});point.addEventListener('pointercancel',()=>{dragging=null});point.addEventListener('lostpointercapture',()=>{dragging=null});
  point.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?.1:.01;let value=name==='a'?state.a:state.a+state.h;value=e.key==='Home'?(name==='a'?-2.8:domain.min):e.key==='End'?(name==='a'?2.8:domain.max):Math.round((value+(e.key==='ArrowLeft'?-step:step))*1000)/1000;if(name==='a')changeA(value);else changeH(value-state.a)});
}

$('reset').addEventListener('click',()=>{Object.assign(state,{a:1,h:1.6,points:true,secant:true,tangent:true,values:true,triangle:true});for(const id of['show-points','show-secant','show-tangent','show-values','show-triangle'])$(id).checked=true;render()});
function arrangeLabels(){
  const svg=$('graph'), w=svg.viewBox.baseVal.width,h=svg.viewBox.baseVal.height;
  const movable=[...$('projections').querySelectorAll('text'),...$('annotations').querySelectorAll('text')];
  const reserved=[...svg.querySelectorAll('.point-label,.axis-label,.tick-label')].filter(e=>e.getBoundingClientRect().width>0);
  const origin=svg.getBoundingClientRect();
  const rect=e=>{const b=e.getBoundingClientRect();return{x:b.x-origin.x,y:b.y-origin.y,width:b.width,height:b.height}};
  const overlap=(a,b)=>a.x<b.x+b.width+7&&a.x+a.width+7>b.x&&a.y<b.y+b.height+7&&a.y+a.height+7>b.y;
  for(const label of movable){
    const x=+label.getAttribute('x'),y=+label.getAttribute('y');
    let best=null;
    for(const [dx,dy]of [[0,0],[0,28],[0,-28],[-35,20],[35,20],[-65,40],[0,55],[0,-55],[65,-40],[-90,-30],[90,30]]){
      label.setAttribute('x',x+dx);label.setAttribute('y',y+dy);
      const b=rect(label);let cost=0;
      if(b.x<8||b.x+b.width>w-8||b.y<8||b.y+b.height>h-8)cost+=10000;
      for(const e of reserved)if(overlap(b,rect(e)))cost+=1000;
      for(let i=0;i<=12;i++){
        const px=b.x+b.width*i/12,ux=bounds.xmin+(px-plot.x)/plot.width*(bounds.xmax-bounds.xmin);
        const ys=[Y(f(ux))];
        if(state.tangent)ys.push(Y(f(state.a)+derivative(state.a)*(ux-state.a)));
        if(state.secant&&state.h!==0)ys.push(Y(f(state.a)+secantSlope(state.a,state.h)*(ux-state.a)));
        if(ys.some(py=>py>b.y-4&&py<b.y+b.height+4))cost+=20;
      }
      if(state.triangle&&state.h!==0){
        const ax=X(state.a),bx=X(state.a+state.h),ay=Y(f(state.a)),by=Y(f(state.a+state.h));
        if(bx>b.x-6&&bx<b.x+b.width+6&&b.y<Math.max(ay,by)+5&&b.y+b.height>Math.min(ay,by)-5)cost+=300;
        if(ay>b.y-6&&ay<b.y+b.height+6&&b.x<Math.max(ax,bx)+5&&b.x+b.width>Math.min(ax,bx)-5)cost+=300;
      }
      cost+=Math.abs(dx)*.02+Math.abs(dy)*.02;
      if(!best||cost<best.cost)best={dx,dy,cost};
      if(cost===0)break;
    }
    label.setAttribute('x',x+best.dx);label.setAttribute('y',y+best.dy);reserved.push(label);
  }
}
function resizeGraph(){
  const graph=$('graph'), box=graph.getBoundingClientRect();
  graph.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
  Object.assign(plot,{x:box.width<500?45:75,y:30,width:Math.max(100,box.width-(box.width<500?85:130)),height:Math.max(80,box.height-115)});
  const clip=$('plot-clip').firstElementChild;
  for(const [k,v]of Object.entries({x:plot.x,y:plot.y,width:plot.width,height:plot.height}))clip.setAttribute(k,v);
  initializeGraph();render();
}
new ResizeObserver(resizeGraph).observe($('graph'));
resizeGraph();
