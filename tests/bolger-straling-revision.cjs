const assert=require('node:assert/strict'),fs=require('node:fs');
const {moduleUrl,rendererPath}=require('./bolger-straling-paths.cjs');
const near=(actual,expected,tolerance=1e-9,message='')=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),message||`${actual} differs from ${expected}`);
const plain=html=>String(html).replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ');

async function runRevisionChecks({modelFixture,topics}={}){
 const names=['flight-doppler','light-doppler','refraction-lab','refraction-examples','diffraction-lab','resonance-swing','resonance-tuning-forks','atom-lab','hydrogen-series','hydrogen-series-quiz','element-spectra','element-spectra-data','spectra-lab','spectra-lab-data','animation-clock','waves-rainbow','math-presentation','cosmology-timeline','bigbang-evidence'];
 const modules={};for(const name of names)modules[name]=await import(moduleUrl(name));
 const flight=modules['flight-doppler'],optics=modules['refraction-lab'],diff=modules['diffraction-lab'],swing=modules['resonance-swing'],atom=modules['atom-lab'],elements=modules['element-spectra'],data=modules['element-spectra-data'],examples=modules['refraction-examples'];
 const groups=[];

 // Arrival and heard pitch are derived from the same retarded emission event.
 for(const mach of [.05,.45,.9,.99,1])for(const height of [20,100,300])for(const sourceX of [-260,-100,0,30,100,400]){
  const r=flight.retardedFlight({sourceX,height,mach});
  assert.ok(Number.isFinite(r.frequency)&&r.frequency>=0);
  if(!r.arrived){assert.equal(r.frequency,0);continue;}
  near(Math.hypot(r.emissionX,height),flight.FLIGHT_SOUND_SPEED*r.delay,1e-9);
  near(r.emissionTime+r.delay,r.passTime,1e-9);assert.ok(r.emissionTime>=0);
  const epsilon=1e-5,v=mach*flight.FLIGHT_SOUND_SPEED;
  const before=flight.retardedFlight({sourceX:sourceX-v*epsilon,height,mach}),after=flight.retardedFlight({sourceX:sourceX+v*epsilon,height,mach});
  if(before.arrived&&after.arrived)near(r.frequency,flight.FLIGHT_SOURCE_HZ*(after.emissionTime-before.emissionTime)/(2*epsilon),2e-6);
 }
 const arrivalX=Math.hypot(flight.FLIGHT_EMISSION_START_X,100)+flight.FLIGHT_EMISSION_START_X;
 assert.equal(flight.retardedFlight({sourceX:0,height:100,mach:1}).arrived,false,'At Mach 1 the first finite-history front has not reached the observer at overflight.');
 assert.equal(flight.retardedFlight({sourceX:arrivalX-1e-5,height:100,mach:1}).arrived,false);
 assert.equal(flight.retardedFlight({sourceX:arrivalX+1e-5,height:100,mach:1}).arrived,true);
 assert.ok(flight.retardedFlight({sourceX:0,height:100,mach:.45}).frequency>flight.FLIGHT_SOURCE_HZ,'Arrival delay preserves the approaching tone briefly after geometric overflight.');
 const p=flight.flightPosition(1,{mach:.45,height:100}),fronts=flight.flightWavefronts(p);
 for(const front of fronts){near(front.x,flight.FLIGHT_EMISSION_START_X+p.velocity*front.emissionTime);near(front.radius,flight.FLIGHT_SOUND_SPEED*(p.passTime-front.emissionTime));assert.ok(front.radius>=0);}
 assert.match(flight.flightSection.body,/id="fd-audio"[^>]*aria-pressed="false"/);assert.match(flight.flightSection.body,/Lyd av/);
 assert.equal(flight.playbackFrequencyAllowed(0),false);assert.equal(flight.playbackFrequencyAllowed(25000),false);assert.equal(flight.playbackFrequencyAllowed(243.17),true);
 let contexts=0,oscillators=[];
 class Param{constructor(){this.value=0;}cancelScheduledValues(){}setTargetAtTime(v){this.value=v;}setValueAtTime(v){this.value=v;}}
 class AudioNode{constructor(){for(const key of ['gain','frequency','Q','threshold','knee','ratio','attack','release'])this[key]=new Param();}connect(){}disconnect(){}start(){}stop(){}setPeriodicWave(){}}
 class AudioContext{constructor(){contexts++;this.currentTime=0;this.sampleRate=48000;this.state='suspended';this.destination={};}createGain(){return new AudioNode();}createOscillator(){const node=new AudioNode();oscillators.push(node);return node;}createBiquadFilter(){return new AudioNode();}createDynamicsCompressor(){return new AudioNode();}createBufferSource(){return new AudioNode();}createPeriodicWave(){return {};}createBuffer(_,length){return {getChannelData:()=>new Float32Array(length)};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}}
 const engine=flight.createEngineAudio(AudioContext);assert.equal(contexts,0);assert.deepEqual(engine.snapshot().enabled,false);engine.update({frequency:300,arrived:true});assert.equal(contexts,0,'Audio remains unallocated and silent until explicitly enabled.');
 await engine.enable();engine.update({frequency:243.17,arrived:true,distance:100});near(oscillators[0].frequency.value,243.17);assert.equal(engine.snapshot().playing,true);
 engine.update({frequency:243.17,arrived:true,paused:true});assert.equal(engine.snapshot().playing,false);assert.equal(engine.snapshot().contextState,'suspended');engine.disable();assert.equal(engine.snapshot().enabled,false);engine.dispose();
 groups.push('finite-history Mach 1 arrival, retarded pitch and default-muted audio');

 const {observedLightWavelength}=modules['light-doppler'];
 assert.equal(observedLightWavelength(550,0),550);
 for(const speed of [100,1800,3000]){
  const nearer=observedLightWavelength(550,-speed),farther=observedLightWavelength(550,speed);
  assert.ok(nearer<550&&farther>550);
  near(nearer*farther,550**2);
 }
 near(observedLightWavelength(550,299792.458*.6),1100);
 groups.push('relativistic redshift and blueshift with fixed emitted wavelength');

 // Independent Fresnel power checks, including equal-media and total-reflection limits.
 for(const upper of ['air','water','glass'])for(const lower of ['air','water','glass'])for(const angle of [0,15,45,65,80,89.99]){
  const first=optics.materialIndex(upper,550),second=optics.materialIndex(lower,550),r=optics.fresnelPower(first,second,angle);
  near(r.R+r.T,1,1e-12);assert.ok(r.R>=0&&r.T>=0&&r.R<=1&&r.T<=1);
  if(upper===lower){assert.equal(r.R,0);assert.equal(r.T,1);near(r.transmittedAngle,angle);}
  else if(r.totalReflection){assert.equal(r.R,1);assert.equal(r.T,0);assert.equal(r.transmittedAngle,null);assert.ok(first>second);}
  else near(first*Math.sin(angle*Math.PI/180),second*Math.sin(r.transmittedAngle*Math.PI/180),1e-9);
 }
 const normal=optics.fresnelPower(1,1.5,0);near(normal.R,.04,1e-12);near(normal.T,.96,1e-12);
 assert.equal(optics.fresnelPower(1,1.5,80).totalReflection,false);assert.equal(optics.fresnelPower(1.5,1,60).totalReflection,true);
 const white=optics.refractionLabState({upper:'air',lower:'glass',white:true,angleDegrees:60});assert.ok(white.rays.length>2&&white.minAngle<white.maxAngle);near(white.R+white.T,1);
 assert.ok(!/brytningsindeks|\bn\s*=/.test(plain(optics.refractionSectionHtml)),'The pupil interface does not introduce refractive index.');
 groups.push('Fresnel power, equal media, dispersion and total reflection');

 // The two-aperture solution must be a coherent sum, not two masked single-slit pictures.
 const single=diff.buildApertureField({aperture:.4,wavelength:.8,openings:1,width:96,height:96});
 const double=diff.buildApertureField({aperture:.4,wavelength:.8,openings:2,separation:2,width:96,height:96});
 assert.equal(double.intervals.length,2);assert.equal(double.sourceCount,2*single.sourceCount);
 const shift=Math.round(1/single.unit);
 for(const x of [40,60,90])for(const y of [20,35,48,65,75])for(const part of ['real','imag'])near(double[part][y*96+x],single[part][(y-shift)*96+x]+single[part][(y+shift)*96+x],2e-5);
 const fringes=diff.buildApertureField({aperture:.35,wavelength:.8,openings:2,separation:3,width:128,height:64}),x=127;
 const intensity=y=>fringes.real[y*128+x]**2+fringes.imag[y*128+x]**2,central=Math.max(intensity(31),intensity(32));
 assert.ok(intensity(43)<.01*central,'A genuine dark interference fringe lies between adjacent bright bands.');assert.ok(intensity(55)>.5*central);
 assert.throws(()=>diff.buildApertureField({openings:2,aperture:2,separation:1}),RangeError);
 for(const time of [0,.13,3])near(diff.scalarWaveValue(double,80,48,time),diff.scalarWaveValue(double,80,48,time+.4),1e-5);
 groups.push('coherent two-slit superposition and resolved dark fringes');

 // Arm lengths remain anatomical; phase changes and the cartoon departure do not teleport the wrist.
 const g=swing.swingGeometry;
 for(let theta=-.7;theta<.7;theta+=.01){const back=swing.swingBackPoint(theta),arm=swing.solveSwingArm(back.x,back.y);near(Math.hypot(arm.elbowX-g.shoulderX,arm.elbowY-g.shoulderY),g.upperArm,1e-9);near(Math.hypot(arm.handX-arm.elbowX,arm.handY-arm.elbowY),g.forearm,1e-9);}
 await require('./bolger-straling-resonance.cjs').runResonanceChecks();
 groups.push('continuous arm reach, bounded damped motion and delayed undamped rope break');

 const forks=modules['resonance-tuning-forks'];
 for(const [sourceHz,otherHz] of [[262,330],[330,392],[392,440],[440,523],[523,262]]){
  assert.equal(forks.forkResponse(.3,sourceHz,sourceHz).second,0,'The receiving fork waits for the wave.');
  const matched=forks.forkResponse(1.6,sourceHz,sourceHz);
  const unmatched=forks.forkResponse(1.6,sourceHz,otherHz);
  assert.equal(unmatched.second,0,'A mismatched fork stays still.');
  assert.ok(matched.second>0&&matched.level>unmatched.level,'Resonance adds audible amplitude.');
  assert.equal(forks.forkResponse(8,sourceHz,sourceHz).level,0,'The sound dies away.');
 }
 assert.notEqual(forks.airMotion(.3,0,440).offset,0,'Air near the first fork moves immediately.');
 assert.equal(forks.airMotion(.3,1,440).offset,0,'Air near the second fork is initially undisturbed.');
 assert.notEqual(forks.airMotion(.9,1,440).offset,0,'The wave reaches the far side.');
 assert.equal(forks.airMotion(8,.5,440).offset,0,'Each particle returns to its starting point.');
 groups.push('air-wave propagation, matched tuning forks and audible buildup');

 // Atom energies use aJ throughout. Hydrogen stays fixed; the model atom is explicitly editable.
 const H=6.62607015e-34,C=299792458;
 near(atom.hydrogenEnergy(1),-2.17896022224,1e-12);near(atom.hydrogenEnergy(2),atom.hydrogenEnergy(1)/4,1e-12);assert.throws(()=>atom.hydrogenEnergy(0),RangeError);
 for(let upper=1;upper<=6;upper++){
  assert.equal(atom.possibleTransitions(upper).length,upper*(upper-1)/2);
  for(let lower=1;lower<=6;lower++){const transition=atom.transition(upper,lower);near(transition.energyJ,transition.energyAJ*1e-18,1e-30);if(upper===lower){assert.equal(transition.type,'none');continue;}near(transition.energyJ,H*C/(transition.wavelengthNM*1e-9),1e-25);assert.equal(transition.type,upper>lower?'emission':'absorption');}
  if(upper>1)assert.equal(atom.excitationForEnergy(atom.transition(1,upper).energyAJ).level,upper);
 }
 for(const [n,nm]of [[3,656],[4,486],[5,434],[6,410]])assert.ok(Math.abs(atom.transition(n,2).wavelengthNM-nm)<1);
 assert.equal(atom.transition(2,1).region,'UV');assert.equal(atom.transition(4,3).region,'IR');assert.equal(atom.excitationForEnergy(.5).kind,'no-match');assert.equal(atom.excitationForEnergy(2.3).kind,'ionization');
 for(const preset of Object.values(atom.CUSTOM_LEVEL_PRESETS))for(let target=1;target<preset.levels.length;target++){
  const paths=atom.customCascadePaths(target),transitions=atom.customTransitions(preset.levels,target),seen=new Set();assert.equal(paths.length,2**(target-1));assert.equal(transitions.length,target*(target+1)/2);
  for(const cascade of paths){assert.equal(cascade[0],target);assert.equal(cascade.at(-1),0);let energy=0;for(let i=1;i<cascade.length;i++){assert.ok(cascade[i]<cascade[i-1]);energy+=preset.levels[cascade[i-1]]-preset.levels[cascade[i]];seen.add(cascade[i-1]+'-'+cascade[i]);}near(energy,preset.levels[target]);}assert.equal(seen.size,transitions.length);
 }
 const original=[0,.4,.9,1.5],moved=atom.moveCustomLevel(original,1,10);assert.deepEqual(original,[0,.4,.9,1.5]);assert.ok(moved[1]<=moved[2]-atom.MIN_LEVEL_GAP_AJ);assert.equal(atom.moveCustomLevel(original,0,1)[0],0);
 assert.ok(atom.atomLabSection.body.includes('id="al-h-spectrum-controls"'));
 assert.ok(atom.customAtomSection.body.includes('id="al-custom-handles"'));
 assert.match(atom.customAtomSection.title,/^Hva med andre atomer\?$/);
 assert.doesNotMatch(atom.customAtomSection.body,/data-excite-level|id="al-custom-targets"/);
 const series=modules['hydrogen-series'].hydrogenSeriesSection;
 const {atomTopic,ionizationOutcome}=await import(moduleUrl('atom-topic'));
 assert.deepEqual(atomTopic.sections[1],series,'The spectroscopy model has its own section after the introduction.');
 assert.match(series.body,/id="hs-board"/);
 const threshold=-atom.HYDROGEN_GROUND_AJ;
 assert.equal(ionizationOutcome(2.1).ionizes,false);
 assert.equal(ionizationOutcome(threshold).ionizes,true);
 near(ionizationOutcome(threshold).kineticAJ,0);
 near(ionizationOutcome(3).kineticAJ,3-threshold);
 const {hydrogenQuiz}=modules['hydrogen-series-quiz'];
 const seriesKeys=atom.possibleTransitions(6).filter(t=>t.to<=3).map(t=>`${t.from}-${t.to}`).sort();
 assert.deepEqual(Object.keys(hydrogenQuiz),['mild','medium','spicy']);
 for(const clues of Object.values(hydrogenQuiz)){
  assert.deepEqual(clues.map(([key])=>key).sort(),seriesKeys);
 }
 const clueTexts=Object.values(hydrogenQuiz).flatMap(clues=>clues.map(([,clue])=>clue));
 assert.equal(new Set(clueTexts).size,36);
 for(const clue of clueTexts)assert.doesNotMatch(clue,/[<>≤≥]|\b(?:mellom|over|under|mer enn|mindre enn|høyere enn|lavere enn|lengre enn|kortere enn)\s+\d|\d\s*[-–]\s*\d\s*(?:nm|aJ|Hz)/iu);
 groups.push('hydrogen aJ values, Balmer lines, editable levels and all cascade paths');

 // The UI has 118 elements. Missing NIST data remains empty, never generated by a placeholder formula.
 assert.equal(elements.spectralElements.length,118);assert.equal(new Set(elements.spectralElements.map(e=>`${e.row}:${e.col}`)).size,118);
 assert.equal((elements.elementSpectraHtml.match(/data-es-z=/g)||[]).length,118);
 assert.ok(data.elementSpectraData.length>=99&&data.elementSpectraData.length<=118);assert.deepEqual(data.elementSpectraMeta.failed,[]);
 for(const row of data.elementSpectraData){assert.ok(row.z>=1&&row.z<=118);assert.match(row.source,/^https:\/\/physics\.nist\.gov\//);for(const [stage,key]of [['I','n'],['II','i']]){assert.strictEqual(data.getElementEmissionLines(row.z,stage),row[key]);assert.ok(row[key].length<=data.elementSpectraMeta.maxLinesPerStage);for(const [nm,intensity,medium]of row[key])assert.ok(nm>=380&&nm<=780&&intensity>0&&Number.isFinite(intensity)&&[0,1].includes(medium));}}
 for(const [z,nm]of [[1,656.28],[1,486.13],[11,589]])assert.ok(data.getElementEmissionLines(z,'I').some(line=>Math.abs(line[0]-nm)<.2));
 assert.deepEqual(data.getElementEmissionLines(118,'I'),[]);assert.deepEqual(data.getElementEmissionLines(0,'I'),[]);assert.deepEqual(data.getElementEmissionLines(1,'combined'),[]);assert.ok(!/<line\b/.test(elements.renderEmissionSpectrum([])));
 assert.doesNotMatch(elements.elementSpectraHtml,/id="es-stage"|<option\b[^>]*value="II"/);
 groups.push('118 periodic positions, traceable NIST lines and a neutral-only spectrum viewer');
 const gases=modules['spectra-lab-data'].spectraLabElements;
 assert.deepEqual(atomTopic.sections[3],modules['spectra-lab'].spectraLabSection);
 assert.deepEqual(gases.map(({symbol})=>symbol).sort(),['H','He','N','Na','Ne','O']);
 for(const gas of gases){
  const {z}=elements.spectralElements.find(element=>element.symbol===gas.symbol);
  const original=data.elementSpectraData.find(row=>row.z===z);
  assert.ok(original&&gas.lines.length>0);
  assert.equal(gas.lineSource,original.source);
  for(const [wavelength,relativeStrength] of gas.lines){
   assert.ok(original.n.some(line=>line[0]===wavelength));
   assert.ok(relativeStrength>0&&relativeStrength<=1);
  }
 }
 groups.push('six discharge gases with matched, traceable neutral wavelengths');

 // The practical analogies are tested against direction, contacts and continuity.
 for(const angleDeg of [15,40,60])for(const slowRatio of [.35,.75]){
  const field=examples.createShoreField(angleDeg,slowRatio),plan=examples.toyCarPlan({angleDeg,slowRatio}),state=examples.toyCarState(plan.firstTime+plan.turnTime/2,{angleDeg,slowRatio});
  assert.ok(field.finalAngleDeg<angleDeg);assert.notEqual(state.positiveSlow,state.negativeSlow);near(plan.finalAngleDeg,field.finalAngleDeg);assert.ok(examples.shoreWavefronts(field,.3).length>2);
  for(const boundary of [plan.firstTime,plan.firstTime+plan.turnTime]){const a=examples.toyCarState(boundary-1e-7,{angleDeg,slowRatio}),b=examples.toyCarState(boundary+1e-7,{angleDeg,slowRatio});assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-4);}
 }
 groups.push('coastal refraction and continuous differential-wheel motion');

 if(!topics){
  topics=[];
  for(const name of ['wave-basics','waves','em-spectrum','atom-topic','communication','radioactivity','cosmos-environment']){
   const source=await import(moduleUrl(name));
   topics.push(...(source.topics??[source.emTopic??source.atomTopic]));
  }
 }
 const visible=topics.flatMap(topic=>[...topic.sections.map(s=>s.body),...topic.terms.map(t=>`${t.term} ${t.definition}`),...topic.questions.map(q=>`${q.prompt} ${q.answer} ${modules['math-presentation'].solutionHtml(q)} ${q.hint||''} ${(q.choices||[]).join(' ')} ${q.unit||''}`)]).map(plain).join('\n');
 assert.ok(!/\beV\b/.test(visible),'Visible topic content uses joules/prefixes rather than standalone eV.');
 const numeric=topics.flatMap(t=>t.questions).find(q=>q.id==='atom-05');assert.equal(numeric.unit,'aJ');near(numeric.value,-.24-(-.54));
 const app=fs.readFileSync(rendererPath,'utf8');assert.ok(!/class="viewbar"|class="view-tabs"/.test(app));

 if(modelFixture){
  const rf=modelFixture({sections:[{body:optics.refractionSectionHtml}],mount:optics.mountRefraction});
  try{for(const medium of ['air','water','glass']){rf.change('rf-medium-top',medium);rf.change('rf-medium-bottom',medium);assert.match(rf.get('rf-reflected-value').textContent,/0\s*%/);}rf.change('rf-medium-top','water');rf.change('rf-medium-bottom','air');rf.change('rf-angle',65);assert.match(rf.get('rf-status').textContent,/totalrefleksjon/i);rf.get('rf-white').checked=true;rf.change('rf-white','on');assert.ok(!/NaN|Infinity/.test(rf.html()));}finally{rf.destroy();}
  const coast=modelFixture({sections:[{body:examples.refractionExampleHtml}],mount(root,api){
   const cleanup=examples.mountRefractionExample(root,api);
   cleanup.selectMode('coast');
   return cleanup;
  }});
  try{
   const question=coast.get('re-shore-question'),feedback=coast.get('re-shore-feedback');
   assert.ok(question.closest('.model-panel'));
   assert.equal(question.hidden,false);
   assert.equal(coast.get('re-car-controls').hidden,true);
   assert.match(coast.get('re-readout').textContent,/40 %/);
   assert.doesNotMatch(coast.get('re-readout').textContent,/°/);
   question.querySelector('[name="re-frequency"][value="unchanged"]').checked=true;
   question.dispatch('change');
   assert.equal(feedback.hidden,true);
   question.querySelector('[name="re-wavelength"][value="down"]').checked=true;
   question.dispatch('change');
   assert.equal(feedback.hidden,false);
   assert.match(feedback.textContent,/Begge svarene stemmer/);
  }finally{coast.destroy();}
  const previousAudioContext=globalThis.AudioContext,oscillatorStart=oscillators.length;globalThis.AudioContext=AudioContext;
  const f=modelFixture({sections:[flight.flightSection],mount:flight.mountFlight});
  try{assert.equal(f.get('fd-audio').getAttribute('aria-pressed'),'false');f.change('fd-mach',1);f.click('fd-audio');await Promise.resolve();await Promise.resolve();const beforeSteps=Math.floor(7/flight.FLIGHT_VISUAL_TIME_SCALE),afterSteps=Math.ceil(8/flight.FLIGHT_VISUAL_TIME_SCALE);for(let i=1;i<=beforeSteps;i++)f.tick(i/10);assert.equal(f.get('fd-scene').closest('.model').dataset.flightPhase,'waiting');for(let i=beforeSteps+1;i<=afterSteps;i++)f.tick(i/10);assert.notEqual(f.get('fd-scene').closest('.model').dataset.flightPhase,'waiting');near(oscillators[oscillatorStart].frequency.value,Number(f.get('fd-scene').closest('.model').dataset.observedFrequency));f.pause('#fd-scene');const before=f.get('fd-scene').serialize();f.tick((afterSteps+1)/10);assert.equal(f.get('fd-scene').serialize(),before);}finally{f.destroy();globalThis.AudioContext=previousAudioContext;}
  const af=modelFixture(topics.find(t=>t.id==='atomer'),{reducedMotion:false});
  try{
   const hydrogen=af.get('al-hydrogen-svg'), lineButtons=af.get('al-h-spectrum-controls');
   const model=af.get('al-hydrogen-model');
   assert.equal(model.getAttribute('data-levels-revealed'),'false');
   assert.equal(hydrogen.getAttribute('data-h-phase'),'ground');
   assert.equal(lineButtons.hidden,true);
   assert.equal(lineButtons.querySelectorAll('[data-h-line]').length,0);
   assert.equal(hydrogen.querySelectorAll('circle[fill=none]').length,1);
   af.click('al-h-reveal');
   assert.equal(model.getAttribute('data-levels-revealed'),'true');
   assert.equal(lineButtons.hidden,false);
   assert.equal(lineButtons.querySelectorAll('[data-h-line]').length,4);
   assert.equal(hydrogen.querySelectorAll('circle[fill=none]').length,6);
   assert.equal(hydrogen.getAttribute('data-transition'),null);
   assert.equal(af.get('al-h-readout').hidden,true);
   lineButtons.dispatch('click',{target:lineButtons.querySelector('[data-h-line="6"]')});
   assert.equal(hydrogen.getAttribute('data-transition'),'6-2');
   assert.equal(hydrogen.getAttribute('data-h-phase'),'excitation');
   assert.ok(hydrogen.querySelector('[data-h-excitation-arrow]'));
   assert.equal(hydrogen.getAttribute('data-photon-arrived'),'false');
   for(let step=1;step<=23;step++) af.tick(step/10);
   assert.equal(hydrogen.getAttribute('data-h-phase'),'excited');
   for(let step=24;step<=38;step++) af.tick(step/10);
   assert.equal(hydrogen.getAttribute('data-h-phase'),'emission');
   assert.ok(hydrogen.querySelector('[data-h-emitted-photon]'));
   for(let step=39;step<=50;step++) af.tick(step/10);
   assert.equal(hydrogen.getAttribute('data-h-phase'),'settled');
   assert.equal(hydrogen.getAttribute('data-photon-arrived'),'true');
   assert.match(af.get('al-h-readout').textContent,/410/);
   const preset=af.get('al-custom-preset'),spectrum=af.get('al-custom-spectrum'),custom=af.get('al-custom-svg');
   const handles=af.get('al-custom-handles'),firstHandle=()=>handles.querySelector('[data-custom-index="1"]');
   const lineCount=()=>spectrum.querySelectorAll('[data-custom-line]').length;
   assert.equal(preset.value,'sodium');
   assert.equal(lineCount(),4);
   const sodium=spectrum.serialize();
   af.change('al-custom-preset','lithium','change');
   assert.equal(lineCount(),4);
   assert.notEqual(spectrum.serialize(),sodium);
   assert.doesNotMatch(custom.textContent,/\b(?:aJ|eV)\b/);
   const lithium=spectrum.serialize(),old=Number(firstHandle().getAttribute('aria-valuenow'));
   handles.dispatch('keydown',{target:firstHandle(),key:'ArrowUp'});
   assert.equal(preset.value,'custom');
   assert.ok(Number(firstHandle().getAttribute('aria-valuenow'))>old);
   assert.notEqual(spectrum.serialize(),lithium);
   af.change('al-custom-preset','lithium','change');
   assert.equal(spectrum.serialize(),lithium);
   handles.dispatch('pointerdown',{target:firstHandle(),button:0,clientY:160,pointerId:2});
   af.dispatchDocument('pointermove',{clientY:145,pointerId:2});
   af.dispatchDocument('pointerup',{pointerId:2});
   assert.equal(preset.value,'custom');
   assert.ok(Number(firstHandle().getAttribute('aria-valuenow'))>old);
   assert.equal(lineCount(),4);
   lineButtons.dispatch('click',{target:lineButtons.querySelector('[data-h-line="3"]')});
   af.pause('#al-hydrogen-svg');
   const h=hydrogen.serialize();
   af.tick(5.15);
   af.change('al-custom-preset','sodium','change');
   assert.equal(spectrum.serialize(),sodium);
   assert.equal(hydrogen.serialize(),h);
   af.click('es-open');
   assert.equal(af.get('es-dialog').open,true);
   assert.equal(af.get('es-stage'),undefined);
   const periodic=af.get('es-periodic');
   assert.equal(periodic.querySelectorAll('[data-es-z]').length,118);
   periodic.dispatch('click',{target:periodic.querySelector('[data-es-z="118"]')});
   assert.match(af.get('es-status').textContent,/ingen tabell.*kan likevel ha spektrallinjer/i);
   af.click('es-info-open');
   assert.equal(af.get('es-info-dialog').open,true);
   af.click('es-info-close');
   assert.equal(af.get('es-info-dialog').open,false);
   assert.equal(af.get('es-dialog').open,true);
   af.click('es-close');
   assert.equal(af.get('es-dialog').open,false);
  }finally{af.destroy();}
  groups.push('mounted media, Mach 1 controls, clickable spectra, editable levels and independent atom clocks');
 }

 // The pause button must survive models that replace their whole SVG on redraw.
 if(modelFixture){
  let frameApi;
  const pf=modelFixture({sections:[{body:'<div class="model"><div class="model-visual"><div id="pause-dynamic"></div></div></div>'}],mount(root,api){frameApi=api;return api.onFrame(t=>{root.querySelector('#pause-dynamic').innerHTML='<svg viewBox="0 0 760 300"><text>'+t+'</text></svg>';},'#pause-dynamic');}});
  try{
   const scope=pf.get('pause-dynamic').closest('.model'),buttons=new Map();
   const clock={scopes:()=>[scope],isPaused:s=>frameApi.isPaused(s),toggle:s=>pf.pause(s,!frameApi.isPaused(s)),repaint:s=>frameApi.repaint(s)};
   const source=app.slice(app.indexOf('function syncAnimationButton('),app.indexOf("document.addEventListener('visibilitychange'"));
   const install=new Function('animationClock','animationButtons','document','overviewScope','startFrames',source+';return installAnimationControls;')(clock,buttons,globalThis.document,{},()=>{});
   install();const button=scope.querySelector('.animation-toggle');assert.ok(button);
   pf.tick(.1);assert.ok(scope.contains(button),'A frame redraw must not remove its pause button.');
   button.dispatch('click');const frozen=pf.get('pause-dynamic').serialize();pf.tick(.2);assert.equal(pf.get('pause-dynamic').serialize(),frozen);
   button.dispatch('click');pf.tick(.3);assert.notEqual(pf.get('pause-dynamic').serialize(),frozen);
  }finally{pf.destroy();}
  groups.push('pause toolbar survives complete SVG replacement and still pauses/resumes');
 }

 // The cosmic timeline preserves causality; expansion stretches the same photons.
 const timeline=modules['cosmology-timeline'],evidence=modules['bigbang-evidence'].bigBangEvidencePhysics;
 assert.equal(timeline.universeEpochs.length,8);
 for(let i=0;i<timeline.universeEpochs.length;i++){
  const e=timeline.universeEpochs[i];assert.ok(e.seconds>0&&e.temperature>0);
  if(i){assert.ok(e.seconds>timeline.universeEpochs[i-1].seconds);assert.ok(e.temperature<timeline.universeEpochs[i-1].temperature);}
 }
 assert.equal(timeline.getUniverseEpoch(-100),timeline.universeEpochs[0]);
 assert.equal(timeline.getUniverseEpoch(100),timeline.universeEpochs.at(-1));
 for(const scale of [1,1.5,2.6]){const red=evidence.redshift(scale);near(red.wavelength/486.13,scale);near(red.z,scale-1);}
 near(evidence.cmb(0).temperature,3000);near(evidence.cmb(1).temperature,2.725);
 for(const p of [0,.01,.3,.6,1]){const cmb=evidence.cmb(p);near(cmb.temperature*cmb.wavelengthUm,3000);near(cmb.temperature*cmb.scale,3000);}
 near(evidence.abundance('mass').hydrogen,.75);near(evidence.abundance('mass').helium,.25);
 near(evidence.abundance('count').helium,1/13);near(evidence.abundance('count').hydrogen,12/13);
 for(const mode of ['mass','count']){const a=evidence.abundance(mode);near(a.hydrogen+a.helium,1);}
 groups.push('ordered cosmic eras, expansion/redshift, CMB cooling and mass/count abundance');

 if(modelFixture){
  const uf=modelFixture(topics.find(t=>t.id==='universet'));
  try{
   for(let i=0;i<timeline.universeEpochs.length;i++){uf.change('ct-epoch',i);assert.equal(uf.get('ct-age').textContent,timeline.universeEpochs[i].age);uf.tick((i+1)/10);assert.ok(!/NaN|Infinity|undefined/.test(uf.html()));}
   uf.click('ct-previous');assert.equal(uf.get('ct-epoch').value,'6');uf.click('ct-next');assert.equal(uf.get('ct-epoch').value,'7');
   for(const scale of [1,1.6,2.6]){uf.change('bb-redshift-scale',scale);for(const observer of ['0','1','2'])uf.change('bb-observer',observer,'change');assert.ok(!/NaN|Infinity|undefined/.test(uf.html()));}
   for(const p of [0,1,300,1000]){uf.change('bb-cmb-time',p);assert.ok(!/NaN|Infinity|undefined/.test(uf.html()));}
   assert.match(uf.get('bb-cmb-readout').textContent,/2,725/);
   const map=uf.get('bb-cmb-scene').querySelector('image');assert.ok(map);uf.tick(.85);assert.strictEqual(uf.get('bb-cmb-scene').querySelector('image'),map,'The real CMB map stays mounted across animation frames.');
   for(const p of [0,50,100])uf.change('bb-nuclei-progress',p);
   uf.click('bb-by-count');assert.match(uf.get('bb-abundance-readout').textContent,/92 % H/);
   uf.click('bb-by-mass');assert.match(uf.get('bb-abundance-readout').textContent,/75 % H/);
   const frozen=uf.get('bb-redshift-scene'),moving=uf.get('ct-scene'),beforeFrozen=frozen.serialize(),beforeMoving=moving.serialize();
   uf.pause('#bb-redshift-scene');uf.tick(.9);assert.equal(frozen.serialize(),beforeFrozen);assert.notEqual(moving.serialize(),beforeMoving);
   uf.change('bb-redshift-scale',2);assert.notEqual(frozen.serialize(),beforeFrozen,'A paused model still redraws input changes.');
  }finally{uf.destroy();}
  groups.push('mounted cosmic controls, all eras and separate evidence pause clocks');
 }

 return groups;
}

module.exports={runRevisionChecks};
if(require.main===module)runRevisionChecks().then(groups=>console.log('Revision checks passed: '+groups.join('; ')+'.')).catch(error=>{console.error(error);process.exitCode=1;});
