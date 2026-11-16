// A finite, constant-velocity flyby. Every displayed/heard frequency uses the
// same retarded emission event as the received wavefront.
export const FLIGHT_SOUND_SPEED = 343;
export const FLIGHT_SOURCE_HZ = 100;
// Slow the complete scene together: wave speed/source speed still give the same Mach number.
// The audio oscillator retains the physical, displayed pitch while the flyby is shown slowly.
export const FLIGHT_VISUAL_TIME_SCALE = .35;
export const FLIGHT_EMISSION_START_X = -600;
const PLOT_START_X = -260, PLOT_END_X = 600;
const TAU = 2 * Math.PI;
const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
const fmt = (x,d=0) => x.toLocaleString('nb-NO',{maximumFractionDigits:d});

export function flightPosition(time,{mach=.45,height=100,soundSpeed=FLIGHT_SOUND_SPEED}={}){
  if(!Number.isFinite(time)||!Number.isFinite(mach)||mach<=0||mach>1||!Number.isFinite(height)||height<=0||!(soundSpeed>0))throw new RangeError('Finite time, positive height and 0 < Mach ≤ 1 required');
  const velocity=mach*soundSpeed,duration=(PLOT_END_X-PLOT_START_X)/velocity;
  const elapsed=Math.max(0,time),passIndex=Math.floor(elapsed/duration),local=elapsed-passIndex*duration;
  const sourceX=PLOT_START_X+velocity*local;
  return {sourceX,sourceY:height,velocity,mach,height,passIndex,duration,passTime:(sourceX-FLIGHT_EMISSION_START_X)/velocity};
}

/**
 * Observer at (0,0), source at (sourceX,height), moving right at Mach*c.
 * The source began emitting at emissionStartX. Before the first emitted front
 * arrives, frequency is zero and arrived=false (no fictitious prehistory).
 * δ = hypot(x,sqrt(1−M²)*h) avoids subtracting nearly equal numbers.
 */
export function retardedFlight({sourceX,height,mach,soundSpeed=FLIGHT_SOUND_SPEED,sourceFrequency=FLIGHT_SOURCE_HZ,emissionStartX=FLIGHT_EMISSION_START_X}={}){
  if(![sourceX,height,mach,soundSpeed,sourceFrequency,emissionStartX].every(Number.isFinite)||height<=0||mach<=0||mach>1||soundSpeed<=0||sourceFrequency<=0||emissionStartX>=0)throw new RangeError('Finite geometry, positive height/frequency and 0 < Mach ≤ 1 required');
  const c=soundSpeed,v=mach*c,passTime=(sourceX-emissionStartX)/v,firstArrival=Math.hypot(emissionStartX,height)/c;
  const silent={arrived:false,frequency:0,ratio:0,sourceFrequency,delay:0,emissionTime:0,emissionX:emissionStartX,emissionY:height,distance:0,radialVelocity:0,passTime,firstArrival,reason:'not-arrived'};
  if(passTime<firstArrival-1e-11)return silent;
  const betaSquared=(1-mach)*(1+mach),delta=Math.hypot(sourceX,Math.sqrt(Math.max(0,betaSquared))*height);
  let delay;
  if(mach===1){
    if(sourceX<=0)return silent;
    delay=(sourceX*sourceX+height*height)/(2*c*sourceX);
  }else if(sourceX<0){
    delay=(delta-mach*sourceX)/(c*betaSquared);
  }else{
    delay=(sourceX*sourceX+height*height)/(c*(delta+mach*sourceX));
  }
  if(!Number.isFinite(delay)||delay<0||delay>passTime+1e-8)return silent;
  const emissionTime=Math.max(0,passTime-delay),emissionX=sourceX-v*delay,distance=c*delay;
  // Equivalent to 1/(1−v·u/c), evaluated without cancellation near Mach 1.
  const ratio=c*delay/delta,frequency=sourceFrequency*ratio;
  if(!Number.isFinite(frequency)||frequency<=0)return silent;
  return {arrived:true,frequency,ratio,sourceFrequency,delay,emissionTime,emissionX,emissionY:height,distance,radialVelocity:distance>0?-v*emissionX/distance:0,passTime,firstArrival,reason:'arrived'};
}

// Selected fronts represent every 25th cycle of a 100 Hz source. Their emission
// centers and radii are exact; the drawing deliberately shows a readable subset.
export function flightWavefronts(position,{soundSpeed=FLIGHT_SOUND_SPEED,emissionPeriod=.25,lookback=4}={}){
  const fronts=[],start=Math.max(0,Math.ceil((position.passTime-lookback)/emissionPeriod)*emissionPeriod);
  for(let emissionTime=start;emissionTime<=position.passTime+1e-10;emissionTime+=emissionPeriod){
    fronts.push({emissionTime,x:FLIGHT_EMISSION_START_X+position.velocity*emissionTime,y:position.height,radius:soundSpeed*(position.passTime-emissionTime)});
  }
  return fronts;
}

export function playbackFrequencyAllowed(frequency,sampleRate=48000){
  return Number.isFinite(frequency)&&frequency>=25&&frequency<=Math.min(12000,sampleRate*.44);
}

/** Lazy Web Audio engine. Construction is silent and allocates no AudioContext. */
export function createEngineAudio(AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext){
  let context=null,enabled=false,disposed=false,gateOpen=false,nodes=[],oscillator=null,noiseFilter=null,lowpass=null,tremoloOscillator=null,master=null,resumePending=null,targetFrequency=FLIGHT_SOURCE_HZ,playing=false;
  const setParam=(param,value,seconds=.025)=>{
    if(!param||!context)return;
    const now=context.currentTime;
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(now);else param.cancelScheduledValues?.(now);
    if(param.setTargetAtTime)param.setTargetAtTime(value,now,seconds);else param.value=value;
  };
  function build(){
    if(context)return;
    if(!AudioContextClass)throw new Error('Nettleseren støtter ikke lydmodellen.');
    context=new AudioContextClass({latencyHint:'interactive'});
    const sourceGain=context.createGain(),noiseGain=context.createGain(),tremolo=context.createGain(),tremoloDepth=context.createGain(),limiter=context.createDynamicsCompressor();
    master=context.createGain();master.gain.value=0;
    oscillator=context.createOscillator();
    const real=new Float32Array(33),imag=new Float32Array(33);
    for(let h=1;h<33;h++){imag[h]=Math.pow(h,-1.12)*(h%2?.95:.72);real[h]=h>1?.12*Math.pow(h,-1.3):0;}
    oscillator.setPeriodicWave(context.createPeriodicWave(real,imag));
    oscillator.frequency.value=FLIGHT_SOURCE_HZ;sourceGain.gain.value=.46;
    lowpass=context.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=1700;lowpass.Q.value=.55;
    oscillator.connect(sourceGain);sourceGain.connect(lowpass);
    const noise=context.createBufferSource(),buffer=context.createBuffer(1,Math.ceil(context.sampleRate*1.7),context.sampleRate),samples=buffer.getChannelData(0);
    let seed=17071;
    for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=(seed/2147483648-1)*.6;}
    noise.buffer=buffer;noise.loop=true;noiseGain.gain.value=.045;
    noiseFilter=context.createBiquadFilter();noiseFilter.type='bandpass';noiseFilter.frequency.value=400;noiseFilter.Q.value=.5;
    noise.connect(noiseFilter);noiseFilter.connect(noiseGain);noiseGain.connect(lowpass);
    tremolo.gain.value=.88;tremoloOscillator=context.createOscillator();tremoloOscillator.type='sine';tremoloOscillator.frequency.value=6;tremoloDepth.gain.value=.07;
    tremoloOscillator.connect(tremoloDepth);tremoloDepth.connect(tremolo.gain);lowpass.connect(tremolo);
    limiter.threshold.value=-16;limiter.knee.value=8;limiter.ratio.value=16;limiter.attack.value=.004;limiter.release.value=.13;
    tremolo.connect(limiter);limiter.connect(master);master.connect(context.destination);
    nodes=[oscillator,noise,tremoloOscillator,sourceGain,noiseGain,noiseFilter,lowpass,tremolo,tremoloDepth,limiter,master];
    oscillator.start();noise.start();tremoloOscillator.start();
  }
  const suspend=()=>{
    playing=false;
    if(master&&context){master.gain.cancelScheduledValues?.(context.currentTime);master.gain.setValueAtTime?.(0,context.currentTime);master.gain.value=0;}
    if(context&&context.state==='running')Promise.resolve(context.suspend()).catch(()=>{});
  };
  const resume=()=>{
    if(!context||context.state==='closed'||context.state==='running'||resumePending)return;
    resumePending=Promise.resolve(context.resume()).catch(()=>{}).finally(()=>{resumePending=null;if(!enabled||disposed||!gateOpen)suspend();});
  };
  return {
    async enable(){
      if(disposed)return false;
      build();enabled=true;
      await context.resume();
      if(disposed||!enabled){suspend();return false;}
      return true;
    },
    disable(){enabled=false;gateOpen=false;suspend();},
    update({frequency=0,arrived=false,distance=0,paused=false,hidden=false}={}){
      if(!context||disposed||!enabled){playing=false;return;}
      gateOpen=!paused&&!hidden;
      if(!gateOpen){suspend();return;}
      const allowed=arrived&&playbackFrequencyAllowed(frequency,context.sampleRate);
      if(allowed){
        targetFrequency=frequency;
        setParam(oscillator.frequency,frequency);
        setParam(tremoloOscillator.frequency,frequency*.06);
        setParam(noiseFilter.frequency,clamp(frequency*3,100,12000));
        setParam(lowpass.frequency,clamp(frequency*10,800,14500));
      }
      const distanceLevel=.67+.33/(1+Math.max(0,distance)/400),pitchLevel=allowed?Math.min(1,Math.sqrt(FLIGHT_SOURCE_HZ/frequency)):0;
      setParam(master.gain,allowed?.095*distanceLevel*pitchLevel:0,.035);
      playing=allowed;resume();
    },
    mute(){gateOpen=false;suspend();},
    snapshot(){return {created:!!context,enabled,playing,frequency:targetFrequency,contextState:context?.state||'uncreated'};},
    dispose(){
      if(disposed)return;disposed=true;enabled=false;suspend();
      for(const node of nodes){try{node.stop?.();}catch{}try{node.disconnect?.();}catch{}}
      nodes=[];
      if(context&&context.state!=='closed')Promise.resolve(context.close()).catch(()=>{});
    }
  };
}

const css=`<style>
.fd-model svg{display:block;width:100%;height:auto;overflow:hidden;border-radius:12px;background:var(--sidebar,#eff5f2)}.fd-model svg text{font-family:system-ui,sans-serif;fill:#27464c}.fd-model .fd-range{display:block;min-width:0}.fd-model .fd-range>span{display:flex;justify-content:space-between;gap:10px;font-size:12px}.fd-model input[type=range]{width:100%;accent-color:#327e82}.fd-model output{font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}.fd-model .fd-actions{display:flex;gap:7px;flex-wrap:wrap}.fd-model .fd-actions button{font-size:12px;padding:7px 10px}.fd-model .fd-actions button[aria-pressed=true]{background:#325e7c;color:#fff}.fd-model .fd-status{padding:10px 12px;background:var(--sidebar,#eef4f2);border-radius:8px;font-size:12px;line-height:1.55}.fd-model .fd-readout>div{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:4px 0}.fd-model .fd-readout strong{font-variant-numeric:tabular-nums}.fd-model .fd-audio-copy{font-size:11px;color:var(--muted,#60736b);margin:7px 0 0}.fd-model .fd-legend{display:flex;gap:15px;flex-wrap:wrap;font-size:11px;color:var(--muted,#60736b)}.fd-model .fd-legend i{display:inline-block;width:17px;height:3px;border-radius:3px;vertical-align:middle;margin-right:5px}.fd-model .controls{display:grid;gap:15px}.fd-model .fd-chip-title{font-size:10px;letter-spacing:.5px}.fd-model .fd-chip-value{font-size:14px;font-weight:650}.fd-model .fd-graph-label{font-size:12px}.fd-model .fd-small-text{font-size:10px}
</style>`;

export const flightSection={
  title:'Dopplereffekt: flyet passerer',
  body:`${css}<p>Motorens grunntone er hele tiden <strong>100 Hz</strong>. Når bølgefrontene når personen tettere, høres en lysere tone. Når de kommer sjeldnere, blir tonen mørkere. Endre flyets høyde og fart, og lytt til samme overflyging.</p><div class="model fd-model"><svg id="fd-scene" viewBox="0 0 760 420" role="img" aria-labelledby="fd-title fd-desc"><title id="fd-title">Et fly passerer én person</title><desc id="fd-desc">Flyet beveger seg vannrett med konstant fart. Sirkulære lydfronter er sentrert der flyet var da lyden ble sendt. Du kan variere høyde og fart helt opp til lydfarten. Lyd er av til du selv slår den på.</desc></svg><div class="controls"><label class="control fd-range" for="fd-mach"><span>Flyets fart <output id="fd-mach-value" for="fd-mach">Mach 0,45</output></span><input type="range" id="fd-mach" min="0.05" max="1" step="0.01" value="0.45"></label><label class="control fd-range" for="fd-height"><span>Høyde over personen <output id="fd-height-value" for="fd-height">100 m</output></span><input type="range" id="fd-height" min="20" max="300" step="5" value="100"></label></div><div class="fd-actions"><button type="button" id="fd-audio" aria-pressed="false">Slå på motorlyd</button><button type="button" id="fd-restart" class="secondary">Ny overflyging</button></div><p id="fd-audio-copy" class="fd-audio-copy">Lyd av. Slå den på for å høre motorens tone hos personen.</p><div id="fd-readout" class="readout fd-readout" aria-live="off"></div><div id="fd-status" class="fd-status" aria-live="polite"></div><div class="fd-legend"><span><i style="background:#438f9c"></i>Utvalgte lydfronter</span></div><p class="model-note">Lyden bruker tid. Tonen du hører nå, kommer fra et sted flyet var tidligere. Derfor kan tonen fortsatt være lys rett etter at flyet er over personen.</p></div>`
};

export function mountFlight(root,api){
  const q=id=>root.querySelector('#'+id),scene=q('fd-scene');
  if(!scene)return ()=>{};
  const machControl=q('fd-mach'),heightControl=q('fd-height'),audioButton=q('fd-audio'),audioCopy=q('fd-audio-copy'),status=q('fd-status'),readout=q('fd-readout');
  const scope=scene.closest?.('.model')||scene;
  const engine=createEngineAudio();let requestedAudio=false,disposed=false,resetAt=api.now?api.now(scene):0,lastFrameTime=resetAt,lastPosition=null,lastHeard=null,lastStatus='',lastReadout='',lastPass=-1,audioError='';
  const getSettings=()=>({mach:Number(machControl.value),height:Number(heightControl.value)});
  const hidden=()=>!!document.hidden||scene.isConnected===false||!!scene.closest?.('[hidden]');
  const paused=()=>api.isPaused?api.isPaused(scene):false;
  const syncAudio=()=>{
    if(disposed)return;
    engine.update({frequency:lastHeard?.frequency||0,arrived:!!lastHeard?.arrived,distance:lastHeard?.distance||0,paused:paused(),hidden:hidden()});
    const sound=engine.snapshot();scope.dataset.audioState=requestedAudio?(sound.playing?'playing':paused()||hidden()?'paused':'waiting'):'off';
    audioButton.setAttribute('aria-pressed',String(requestedAudio));audioButton.textContent=requestedAudio?'Slå av motorlyd':'Slå på motorlyd';
    const text=audioError||(!requestedAudio?'Lyd av. Slå den på for å høre motorens tone hos personen.':paused()?'Lyden er pauset sammen med animasjonen.':hidden()?'Lyden er pauset.':!lastHeard?.arrived?'Motorlyden har ikke nådd personen ennå.':!playbackFrequencyAllowed(lastHeard.frequency)?'Den beregnede tonen ligger over området som spilles av.':'Du hører motoren slik personen på bakken hører den.');
    if(audioCopy.textContent!==text)audioCopy.textContent=text;
  };
  const repaint=()=>api.repaint(scene);
  const restart=()=>{resetAt=api.now?api.now(scene):lastFrameTime;lastPass=-1;engine.mute();repaint();};
  machControl.addEventListener('input',restart);heightControl.addEventListener('input',restart);q('fd-restart').addEventListener('click',restart);
  const toggleAudio=async()=>{
    if(requestedAudio){requestedAudio=false;engine.disable();syncAudio();return;}
    requestedAudio=true;audioError='';audioButton.disabled=true;
    try{await engine.enable();}catch{requestedAudio=false;audioError='Lydmodellen er ikke tilgjengelig i denne nettleseren.';}
    if(disposed)return;audioButton.disabled=false;syncAudio();
  };
  audioButton.addEventListener('click',toggleAudio);
  const visibilityChanged=()=>syncAudio();
  const pageHide=()=>engine.mute();
  const clickSync=()=>queueMicrotask(syncAudio);
  document.addEventListener('visibilitychange',visibilityChanged);
  document.addEventListener('click',clickSync);
  globalThis.addEventListener?.('pagehide',pageHide);
  globalThis.addEventListener?.('pageshow',visibilityChanged);
  const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  reducedMotion?.addEventListener?.('change',visibilityChanged);
  const xToPx=x=>380+x*.9,yToPx=y=>340-y*.9;
  const layer=document.createElementNS('http://www.w3.org/2000/svg','g');scene.append(layer);
  const draw=time=>{
    if(disposed)return;
    lastFrameTime=time;
    const modelTime=Math.max(0,time-resetAt)*FLIGHT_VISUAL_TIME_SCALE;
    const settings=getSettings(),position=flightPosition(modelTime,settings),heard=retardedFlight({sourceX:position.sourceX,height:position.height,mach:position.mach});
    lastPosition=position;lastHeard=heard;
    if(lastPass!==position.passIndex){lastPass=position.passIndex;engine.mute();}
    q('fd-mach-value').textContent='Mach '+fmt(position.mach,2);q('fd-height-value').textContent=fmt(position.height)+' m';
    scope.dataset.observedFrequency=String(heard.frequency);scope.dataset.sourceFrequency=String(FLIGHT_SOURCE_HZ);scope.dataset.flightMach=String(position.mach);
    const receivedPhase=!heard.arrived?'waiting':Math.abs(heard.frequency-FLIGHT_SOURCE_HZ)<1?'same':heard.frequency>FLIGHT_SOURCE_HZ?'higher':'lower';
    scope.dataset.flightPhase=receivedPhase;
    const note=!heard.arrived?'Lyden har ikke nådd personen ennå.':receivedPhase==='same'?'Omtrent samme tone som motorens grunntone.':receivedPhase==='higher'?'Tettere ankomst av bølgefronter: høyere frekvens og lysere tone.':'Sjeldnere ankomst av bølgefronter: lavere frekvens og mørkere tone.';
    if(note!==lastStatus){lastStatus=note;status.textContent=note;}
    const frequencyText=heard.arrived?fmt(heard.frequency)+' Hz':'Ingen ankomst ennå';
    const stats=`<div><span>Motorens grunntone:</span><strong>${FLIGHT_SOURCE_HZ} Hz</strong></div><div><span>Personen mottar:</span><strong>${frequencyText}</strong></div><div><span>Flyets fart:</span><strong>${fmt(position.velocity,1)} m/s</strong></div><div><span>Lydfarten:</span><strong>${FLIGHT_SOUND_SPEED} m/s</strong></div>`;
    if(stats!==lastReadout){lastReadout=stats;readout.innerHTML=stats;}
    let wavefrontMarkup='';
    for(const front of flightWavefronts(position)){
      const cx=xToPx(front.x),cy=yToPx(front.y),r=front.radius*.9;
      wavefrontMarkup+=`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="#438f9c" stroke-width="1.5" opacity="${clamp(.52-r/1800,.14,.52).toFixed(3)}"/>`;
    }
    const px=xToPx(position.sourceX),py=yToPx(position.height);
    const toneColor=receivedPhase==='higher'?'#b97842':receivedPhase==='lower'?'#5475a3':'#406b69';
    const propellerHalf=2+7*Math.abs(Math.cos(modelTime*31));
    let grid='';for(const y of [100,200,300])grid+=`<line x1="20" x2="740" y1="${yToPx(y)}" y2="${yToPx(y)}" stroke="#d2e0df" stroke-width="1"/><text x="27" y="${yToPx(y)-5}" class="fd-small-text">${y} m</text>`;
    layer.innerHTML=`<defs><clipPath id="fd-flight-clip"><rect x="20" y="48" width="720" height="292" rx="5"/></clipPath><linearGradient id="fd-sky" x2="0" y2="1"><stop stop-color="#e9f3f4"/><stop offset="1" stop-color="#f8faf4"/></linearGradient></defs><rect width="760" height="420" rx="12" fill="#f1f6f2"/><rect x="20" y="48" width="720" height="292" rx="5" fill="url(#fd-sky)"/>${grid}<text x="28" y="25" class="fd-chip-title">MOTORENS GRUNNTONE</text><text x="207" y="26" class="fd-chip-value">${FLIGHT_SOURCE_HZ} Hz</text><text x="451" y="25" class="fd-chip-title">HØRT PÅ BAKKEN</text><text x="574" y="26" class="fd-chip-value" style="fill:${toneColor}">${heard.arrived?fmt(heard.frequency)+' Hz':'Venter på lyd'}</text><g clip-path="url(#fd-flight-clip)">${wavefrontMarkup}<line x1="20" x2="740" y1="${py.toFixed(2)}" y2="${py.toFixed(2)}" stroke="#a6b8b9" stroke-dasharray="3 6" stroke-width=".8" opacity=".5"/><g id="fd-plane" transform="translate(${(px-30).toFixed(2)} ${py.toFixed(2)})"><path d="M-28 1 -20-2 -28-14 -22-14 -9-3 18-3Q27-2 29 1 25 5 16 5H-23Z" fill="#84959d" stroke="#536d7a" stroke-width="1.2"/><path d="M-7 1 1-18 8-18 5 2M-5 3 3 14 10 14 5 3" fill="#a5b3b8" stroke="#536d7a" stroke-width="1"/><path d="M13-3 18-9 24-8 25-2" fill="#6ba2b8" stroke="#536d7a" stroke-width="1"/><line x1="30" x2="30" y1="${-propellerHalf}" y2="${propellerHalf}" stroke="#5c727d" stroke-width="2.2"/><circle cx="30" cy="0" r="2" fill="#526c78"/></g></g><path d="M20 340H740" stroke="#89a184" stroke-width="2"/><path d="M20 341H740V405H20Z" fill="#dfebd6"/><g id="fd-observer" transform="translate(380 340)"><circle cx="0" cy="-6" r="1.6" fill="#d9a989"/><path d="M-1.5-4h3l.5 2h-4Z" fill="#7890aa"/><path d="M-.8-2-1.5 0m2-2 1.5 2M-1.5-4l-2 2m5-2 2 2" stroke="#5e6d7b" stroke-width="1.2" stroke-linecap="round"/></g><path d="M380 346v13" stroke="#89a184"/><rect x="292" y="360" width="176" height="34" rx="9" fill="#f9fbf6" stroke="#c2d2bf"/><circle cx="313" cy="375" r="8" fill="#e7bc9b"/><path d="M305 375q-1-12 9-10 9 1 7 10l-5-5-9 3" fill="#7d6654"/><path d="M312 379q3 3 6-1" fill="none" stroke="#a26d5c" stroke-width="1.2"/><circle cx="316" cy="375" r=".9" fill="#44555a"/><text x="336" y="381" class="fd-graph-label">Du står her</text><text x="24" y="415" class="fd-small-text">Mach 1 = lydfarten · Bevegelsen vises i rolig tempo.</text>`;
    syncAudio();
  };
  const removeFrame=api.onFrame(draw,scene);
  return ()=>{
    if(disposed)return;disposed=true;requestedAudio=false;
    removeFrame?.();engine.dispose();
    document.removeEventListener('visibilitychange',visibilityChanged);document.removeEventListener('click',clickSync);
    globalThis.removeEventListener?.('pagehide',pageHide);globalThis.removeEventListener?.('pageshow',visibilityChanged);
    reducedMotion?.removeEventListener?.('change',visibilityChanged);
    audioButton.removeEventListener('click',toggleAudio);
  };
}
