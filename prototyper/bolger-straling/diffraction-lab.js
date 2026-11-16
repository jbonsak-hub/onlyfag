const fmt=(n,d=2)=>Number(n).toLocaleString('nb-NO',{maximumFractionDigits:d});
export function diffractionEnvelope(angle,aperture,wavelength){const u=Math.PI*aperture/wavelength*Math.sin(angle);return Math.abs(u)<1e-9?1:Math.abs(Math.sin(u)/u);}

// A coherent 2-D aperture integral. Both openings receive the same plane wave.
export function buildApertureField({aperture=1,wavelength=.8,openings=1,separation=2.3,width=304,height=128,domainWidth=16,wallX=5.3}={}){
 if(!(aperture>0&&wavelength>0))throw new RangeError('Positive aperture and wavelength required');
 const count=openings===2?2:1,unit=domainWidth/width,domainHeight=height*unit,centerY=domainHeight/2,k=2*Math.PI/wavelength;
 const centers=count===2?[centerY-separation/2,centerY+separation/2]:[centerY];
 if(count===2&&separation<=aperture)throw new RangeError('The openings must not overlap');
 const intervals=centers.map(c=>[c-aperture/2,c+aperture/2]);
 const real=new Float32Array(width*height),imag=new Float32Array(width*height),columnPeak=new Float32Array(width);
 const samples=Math.max(24,Math.min(144,Math.ceil(aperture/Math.min(wavelength/10,unit/2))));
 const sourceStep=aperture/samples,scale=sourceStep*Math.sqrt(k/(2*Math.PI));
 const sourceY=centers.flatMap(c=>Array.from({length:samples},(_,j)=>c-aperture/2+(j+.5)*sourceStep));
 for(let x=0;x<width;x++){
  const dx=(x+.5)*unit-wallX;let maxSquared=0;
  for(let y=0;y<height;y++){
   const idx=y*width+x;
   if(dx<=0){real[idx]=Math.cos(k*dx);imag[idx]=Math.sin(k*dx);maxSquared=1;continue;}
   const yy=(y+.5)*unit,xx=Math.max(unit/2,dx);let re=0,im=0;
   for(const source of sourceY){const dy=yy-source,r=Math.hypot(xx,dy),weight=xx/(r*Math.sqrt(r)),phase=k*r-Math.PI/4;re+=weight*Math.cos(phase);im+=weight*Math.sin(phase);}
   re*=scale;im*=scale;real[idx]=re;imag[idx]=im;maxSquared=Math.max(maxSquared,re*re+im*im);
  }
  columnPeak[x]=Math.max(.025,Math.sqrt(maxSquared));
 }
 return {width,height,unit,domainWidth,domainHeight,wallX,aperture,wavelength,openings:count,separation,intervals,real,imag,columnPeak,sourceCount:sourceY.length};
}
export function scalarWaveValue(field,xIndex,yIndex,time,speed=2,normalized=false){
 const x=Math.max(0,Math.min(field.width-1,Math.round(xIndex))),y=Math.max(0,Math.min(field.height-1,Math.round(yIndex))),idx=y*field.width+x,phase=2*Math.PI*speed/field.wavelength*time;
 return (field.real[idx]*Math.cos(phase)+field.imag[idx]*Math.sin(phase))/(normalized?field.columnPeak[x]:1);
}
// Intensity is proportional to |sum of complex amplitudes|². The drawing
// compensates the 2-D geometrical 1/r falloff with a fixed distance rule;
// it never rescales each column by its brightest pixel or invents nodal lines.
export function diffractionRelativeIntensity(field,xIndex,yIndex){
 const x=Math.max(0,Math.min(field.width-1,Math.round(xIndex))),y=Math.max(0,Math.min(field.height-1,Math.round(yIndex))),i=y*field.width+x;
 const dx=(x+.5)*field.unit-field.wallX;
 if(dx<=0)return 1;
 const reference=(field.openings*field.aperture)**2;
 return (field.real[i]**2+field.imag[i]**2)*field.wavelength*Math.max(field.unit/2,dx)/reference;
}
const range=(id,label,min,max,value,step)=>`<label class="control" for="${id}"><span class="df-control-head"><span>${label}</span><output id="${id}-value"></output></span><input id="${id}" type="range" min="${min}" max="${max}" value="${value}" step="${step}"></label>`;
export const diffractionSection={title:'Bøyning og interferens gjennom åpninger',body:`<style>
.df-control-head{display:flex;justify-content:space-between;gap:10px}.df-control-head output{font-weight:650;white-space:nowrap}.df-check{display:flex!important;gap:8px;align-items:center}.df-check input{width:16px;height:16px;flex:none!important}.df-legend{display:flex;gap:16px;font-size:11px;color:var(--muted);flex-wrap:wrap;line-height:1.5}.df-legend span{display:inline-flex;gap:5px;align-items:center}.df-legend i{width:15px;height:9px;border:1px solid #b5c9d0;border-radius:3px;flex:none}.df-presets{display:grid;gap:7px}.df-pattern-control{border-top:1px solid var(--line);margin-top:3px;padding-top:9px}.df-model .readout>div{margin:5px 0}.df-model canvas{display:block;width:100%;height:auto;border-radius:12px}.df-pattern-note{font-size:11px;line-height:1.6;color:var(--muted);margin:0}
</style><p>Når åpningen er liten i forhold til bølgelengden, sprer bølgen seg bredt. Med <strong>to åpninger</strong> dannes faste områder med <strong>konstruktiv og destruktiv interferens</strong>.</p>
<div class="model df-model"><canvas id="wv-diffraction" width="760" height="340" role="img" aria-label="Bølgefelt gjennom én eller to åpninger"></canvas><div class="controls">
${range('wv-slit','Åpningens bredde a',.3,4.2,.5,.1)}${range('wv-diff-lambda','Bølgelengde λ',.3,3.2,.8,.1)}
<label class="control df-check"><input id="df-two" type="checkbox">To åpninger</label><div id="df-separation-control" hidden>${range('df-separation','Avstand mellom åpningene',.8,5,3.5,.1)}
<label class="control df-check df-pattern-control"><input id="df-show-pattern" type="checkbox" checked>Vis interferensmønster</label></div>
</div><div class="df-presets"><button type="button" id="wv-diff-wide-spread">Bred spredning</button><button type="button" id="wv-diff-narrow-beam">Nesten rett fram</button></div><div id="wv-diffraction-readout" class="readout" aria-live="polite"></div>
<div id="df-legend" class="df-legend"></div></div>`};

const mixColor=(from,to,value)=>from.map((n,c)=>Math.round(n+(to[c]-n)*Math.max(0,Math.min(1,value))));
const intensityColor=value=>mixColor([9,28,41],[115,236,214],Math.pow(Math.max(0,Math.min(1,value)),.6));
export function mountDiffraction(root,api){
 const q=id=>root.querySelector('#'+id),canvas=q('wv-diffraction'),ctx=canvas.getContext('2d',{alpha:false});
 const width=456,height=192,buffer=document.createElement('canvas');buffer.width=width;buffer.height=height;
 const bc=buffer.getContext('2d',{alpha:false}),image=bc?.createImageData(width,height),listeners=[];
 let field=null,key='',last=-Infinity,force=true;
 const listen=(node,type,handler)=>{node.addEventListener(type,handler);listeners.push(()=>node.removeEventListener(type,handler));};
 function update(){
  const two=q('df-two').checked,a=q('wv-slit'),d=q('df-separation'),pattern=two&&q('df-show-pattern').checked;
  a.max=two?'2':'4.2';if(+a.value>+a.max)a.value=a.max;
  d.min=String(+a.value+.3);d.max=String(6.3-+a.value);if(+d.value<+d.min)d.value=d.min;if(+d.value>+d.max)d.value=d.max;
  q('df-separation-control').hidden=!two;
  for(const id of ['wv-slit','wv-diff-lambda','df-separation'])q(id+'-value').textContent=fmt(+q(id).value)+' m';
  const ratio=+a.value/+q('wv-diff-lambda').value;
  q('wv-diffraction-readout').innerHTML=`<div><span class="frac"><span class="num">a</span><span class="den">λ</span></span> = <strong>${fmt(ratio)}</strong></div><div>${two?pattern?'Lyst: konstruktiv interferens.<br>Mørkt: destruktiv interferens.':'Bølgene beveger seg. Mønsteret av forsterkning og svekking blir på samme sted.':ratio<=1?'Liten åpning i forhold til bølgen: bred spredning.':ratio>7?'Mange bølgelengder over åpningen: bølgen går nesten rett fram.':'Bølgen bøyes ved kantene av åpningen.'}</div>${two?'<div>Lengre bølgelengde gir større avstand mellom stripene.</div>':''}`;
  q('df-legend').innerHTML=pattern?'<span><i style="background:#73ecd6"></i>Konstruktiv interferens</span><span><i style="background:#091c29"></i>Destruktiv interferens</span><span>Skjermen viser styrken ved høyre kant.</span>':'<span><i style="background:#219fa8"></i>Topp (+)</span><span><i style="background:#e4eef0"></i>Null</span><span><i style="background:#315b9a"></i>Bunn (−)</span>';
  canvas.setAttribute('aria-label',pattern?'Fast interferensmønster fra to åpninger. Lyse striper viser konstruktiv interferens, mørke striper destruktiv interferens.':'Bølger brer seg gjennom '+(two?'to åpninger':'én åpning')+'. Turkis viser topper, blått bunner.');
  force=true;api.repaint(canvas);
 }
 for(const id of ['wv-slit','wv-diff-lambda','df-separation','df-two','df-show-pattern'])listen(q(id),'input',update);
 listen(q('wv-diff-wide-spread'),'click',()=>{q('wv-slit').value='.5';q('wv-diff-lambda').value='1.2';update();});
 listen(q('wv-diff-narrow-beam'),'click',()=>{q('wv-slit').value=q('df-two').checked?'1.8':'4';q('wv-diff-lambda').value='.3';update();});
 const removeFrame=api.onFrame(t=>{
  if(!ctx||!bc||!image)return;
  const k=[q('wv-slit').value,q('wv-diff-lambda').value,q('df-two').checked,q('df-separation').value].join('|');
  if(k!==key){key=k;field=buildApertureField({aperture:+q('wv-slit').value,wavelength:+q('wv-diff-lambda').value,openings:q('df-two').checked?2:1,separation:+q('df-separation').value,width,height});force=true;}
  if(!force&&t-last<1/25&&t>=last)return;const redrawPattern=force;force=false;last=t;
  const pattern=field.openings===2&&q('df-show-pattern').checked,phase=4*Math.PI/field.wavelength*t,cp=Math.cos(phase),sp=Math.sin(phase),data=image.data,zero=[228,238,240],peak=[33,159,168],trough=[49,91,154];
  for(let y=0;y<field.height;y++)for(let x=0;x<field.width;x++){
   const i=y*field.width+x,dx=(x+.5)*field.unit-field.wallX;
   let low=zero,high,a;
   if(pattern&&dx>0){
    if(!redrawPattern)continue;
    low=[9,28,41];high=[115,236,214];a=Math.pow(Math.max(0,Math.min(1,diffractionRelativeIntensity(field,x,y))),.6);
   }
   else{
    // Correct geometrical spreading smoothly, without independently boosting columns.
    const correction=dx>0?Math.sqrt(field.wavelength*Math.max(field.unit/2,dx))/(field.openings*field.aperture):1;
    const u=(field.real[i]*cp+field.imag[i]*sp)*correction;a=Math.pow(Math.min(1,Math.abs(u)),.8);high=u>=0?peak:trough;
   }
   for(let c=0;c<3;c++)data[4*i+c]=Math.round(low[c]+(high[c]-low[c])*a);data[4*i+3]=255;
  }
  bc.putImageData(image,0,0);
  const rx=14,ry=27,rw=pattern?646:732,rh=rw*field.height/field.width,wall=rx+field.wallX/field.domainWidth*rw;
  ctx.fillStyle='#f1f7f8';ctx.fillRect(0,0,760,340);ctx.imageSmoothingEnabled=false;ctx.drawImage(buffer,rx,ry,rw,rh);
  ctx.fillStyle='#385560';let previous=0;
  for(const [a,b] of field.intervals){const y1=ry+a/field.domainHeight*rh,y2=ry+b/field.domainHeight*rh;ctx.fillRect(wall-4,ry+previous/field.domainHeight*rh,8,y1-(ry+previous/field.domainHeight*rh));previous=b;}
  ctx.fillRect(wall-4,ry+previous/field.domainHeight*rh,8,ry+rh-(ry+previous/field.domainHeight*rh));
  ctx.strokeStyle='#a8c0c9';ctx.lineWidth=1;ctx.strokeRect(rx+.5,ry+.5,rw-1,rh-1);
  ctx.fillStyle='#244653';ctx.font='12px system-ui,sans-serif';ctx.textAlign='left';ctx.fillText('Innkommende bølge',28,18);
  ctx.fillText(pattern?'Fast interferensmønster':field.openings===2?'Bølgene møtes bak åpningene':'Bølgefelt bak åpningen',wall+20,18);
  if(pattern){
   const screenX=694,screenW=31;
   ctx.fillStyle='#091c29';ctx.fillRect(screenX,ry,screenW,rh);
   for(let y=0;y<field.height;y++){const color=intensityColor(diffractionRelativeIntensity(field,field.width-1,y));ctx.fillStyle='rgb('+color.join(',')+')';ctx.fillRect(screenX,ry+y/field.height*rh,screenW,rh/field.height+.5);}
   ctx.strokeStyle='#6c8a93';ctx.strokeRect(screenX+.5,ry+.5,screenW-1,rh-1);
   ctx.fillStyle='#244653';ctx.font='11px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText('Skjerm',screenX+screenW/2,ry+rh+21);
   ctx.textAlign='left';ctx.font='11px system-ui,sans-serif';ctx.fillText('Stripene står stille selv om bølgetoppene beveger seg.',28,ry+rh+21);
  }
 },canvas);update();
 return ()=>{removeFrame?.();listeners.forEach(remove=>remove());};
}
