import {f,derivative,secantSlope,lineSegment,fmt} from './math.mjs';

const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const bounds={xmin:-1.5,xmax:3.35,ymin:-.85,ymax:10.1};
const plot={x:55,y:22,width:790,height:528};
const domain={min:-1.5,max:2.9};
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
  for(let x=-1;x<=3;x++){
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

  }
  const triangle=$('triangle');triangle.replaceChildren();
  if(state.triangle&&!zero){
    add(triangle,'path',{d:`M${A.x},${A.y}H${B.x}V${B.y}Z`,class:'triangle-fill'});
    add(triangle,'path',{d:`M${A.x},${A.y}H${B.x}V${B.y}`,class:'triangle-side'});
    if(Math.abs(B.x-A.x)>29&&Math.abs(B.y-A.y)>17){
      const sx=Math.sign(A.x-B.x)*10,sy=Math.sign(B.y-A.y)*10;
      add(triangle,'path',{d:`M${B.x+sx},${A.y}v${sy}h${-sx}`,fill:'none',stroke:'#b7a04d','stroke-width':1});
    }
  }
  for(const [id,p,value,label]of[['point-a',A,a,'A'],['point-b',B,b,'B']]){
    const e=$(id);e.style.display=state.points?'':'none';e.setAttribute('tabindex',state.points?'0':'-1');
    e.setAttribute('transform',`translate(${p.x},${p.y})`);e.setAttribute('aria-valuemin',domain.min);e.setAttribute('aria-valuemax',label==='A'?2.8:domain.max);e.setAttribute('aria-valuenow',value.toFixed(4));e.setAttribute('aria-valuetext',`${fmt(value,4)}, f(x) = ${fmt(f(value),4)}`);
    const txt=e.querySelector('text');txt.setAttribute('x',label==='A'?-16:16);txt.setAttribute('y',label==='A'?24:-15);txt.setAttribute('text-anchor',label==='A'?'end':'start');
  }
  $('secant-value').textContent=zero?'Udefinert':fmt(m,4);
  $('tangent-value').textContent=fmt(t,4);
  $('delta-value').textContent=fmt(h,4);
  $('secant-readout').hidden=!state.secant;$('tangent-readout').hidden=!state.tangent;
  $('slope-arrow').hidden=!(state.secant&&state.tangent);
  $('drag-hint').style.visibility=state.points?'visible':'hidden';
  $('point-key').hidden=!state.points;
  $('triangle-key').hidden=!state.triangle;
}

function render(){updateGraph()}
function changeA(value){const b=state.a+state.h;state.a=clamp(value,domain.min,2.8);state.h=b-state.a;render()}
function changeH(value){state.h=clamp(value,domain.min-state.a,domain.max-state.a);render()}

for(const [key,id]of[['points','show-points'],['secant','show-secant'],['tangent','show-tangent'],['values','show-values'],['triangle','show-triangle']])$(id).addEventListener('change',e=>{state[key]=e.target.checked;render()});
function svgX(event){const p=$('graph').createSVGPoint();p.x=event.clientX;p.y=event.clientY;const matrix=$('graph').getScreenCTM();if(!matrix)return state.a;return bounds.xmin+(p.matrixTransform(matrix.inverse()).x-plot.x)/plot.width*(bounds.xmax-bounds.xmin)}
for(const [id,name]of[['point-a','a'],['point-b','b']]){
  const point=$(id);
  point.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();dragging=name;point.setPointerCapture(e.pointerId);point.focus()});
  point.addEventListener('pointermove',e=>{if(dragging!==name)return;e.preventDefault();const x=Math.round(svgX(e)*1000)/1000;if(name==='a')changeA(x);else changeH(clamp(x,domain.min,domain.max)-state.a)});
  point.addEventListener('pointerup',()=>{dragging=null});point.addEventListener('pointercancel',()=>{dragging=null});point.addEventListener('lostpointercapture',()=>{dragging=null});
  point.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?.1:.01;let value=name==='a'?state.a:state.a+state.h;value=e.key==='Home'?(domain.min):e.key==='End'?(name==='a'?2.8:domain.max):Math.round((value+(e.key==='ArrowLeft'?-step:step))*1000)/1000;if(name==='a')changeA(value);else changeH(value-state.a)});
}

$('reset').addEventListener('click',()=>{Object.assign(state,{a:1,h:1.6,points:true,secant:true,tangent:true,values:true,triangle:true});for(const id of['show-points','show-secant','show-tangent','show-values','show-triangle'])$(id).checked=true;render()});
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
