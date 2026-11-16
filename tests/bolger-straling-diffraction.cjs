const assert=require('node:assert/strict');
const {moduleUrl}=require('./bolger-straling-paths.cjs');
(async()=>{
 const m=await import(moduleUrl('diffraction-lab'));
 const field=m.buildApertureField({aperture:.3,wavelength:.8,openings:2,separation:3.5,width:240,height:160,domainWidth:48,wallX:1});
 const x=field.width-1,profile=Array.from({length:field.height},(_,y)=>m.diffractionRelativeIntensity(field,x,y)),center=Math.max(profile[79],profile[80]);
 const firstMinimum=Math.min(...profile.slice(101,113)),nextMaximum=Math.max(...profile.slice(127,145));
 assert.ok(center>.9&&center<1.1,'The far-field central maximum has the expected reference amplitude.');
 assert.ok(firstMinimum<center*.002,'A stable dark fringe is resolved, rather than a low-contrast phase crossing.');
 assert.ok(nextMaximum>center*.7,'A bright fringe follows the dark fringe.');
 for(const y of [30,60,80,107,135]){
  const period=field.wavelength/2,steps=48;
  let temporalMean=0;
  for(let i=0;i<steps;i++)temporalMean+=m.scalarWaveValue(field,x,y,period*i/steps)**2/steps;
  const distance=(x+.5)*field.unit-field.wallX,relativeFromMean=2*temporalMean*field.wavelength*distance/(field.openings*field.aperture)**2;
  assert.ok(Math.abs(relativeFromMean-profile[y])<1e-10,'The stationary pattern equals the time-average of the actual moving wave, not an added mask.');
 }
 const lowerLambda=m.buildApertureField({aperture:.3,wavelength:.4,openings:2,separation:3.5,width:240,height:160,domainWidth:48,wallX:1});
 const minIndex=(f,a,b)=>{let min=Infinity,index=a;for(let y=a;y<b;y++){const v=m.diffractionRelativeIntensity(f,x,y);if(v<min){min=v;index=y;}}return index;};
 assert.ok(minIndex(lowerLambda,85,101)<minIndex(field,101,113),'Shorter wavelength moves the first dark fringe closer to the center.');
 assert.match(m.diffractionSection.body,/id="df-show-pattern"[^>]*checked/);
 console.log('Diffraction checks passed: stationary contrast, time-average identity and wavelength-dependent fringe spacing.');
})().catch(error=>{console.error(error);process.exitCode=1;});
