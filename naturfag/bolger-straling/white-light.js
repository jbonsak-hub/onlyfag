import {tracePrism} from './waves-rainbow.js?v=20261125-refraction1';

const wavelengths = [
  [670, '#ff655e'],
  [620, '#ffac64'],
  [580, '#f8da64'],
  [535, '#75da91'],
  [475, '#56caf5'],
  [435, '#7d91ff'],
  [395, '#c598ff']
];
const degrees = Math.PI / 180;
const inclination = -28 * degrees;
const rotate = ([x,y]) => [
  x*Math.cos(inclination)-y*Math.sin(inclination),
  x*Math.sin(inclination)+y*Math.cos(inclination)
];
const coords = ([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`;
const rayPath = points => 'M'+points.map(coords).join('L');

const styles = `<style>
.topic-page #wl-model { padding:8px }
.topic-page #wl-model svg { display:block; width:100%; height:auto; max-height:none; border-radius:7px }
#wl-model text { fill:#eaf4f6; font:650 15px system-ui,sans-serif }
#wl-model .animation-toolbar { padding:1px }
</style>`;

function layout(compact) {
  return compact
    ? {width:420,height:182,center:[137,67],scale:44,sourceX:22,endX:394,spread:13}
    : {width:760,height:243,center:[250,85],scale:61,sourceX:36,endX:721,spread:9.5};
}

function wavePath({start,end,wavelength},time) {
  const dx=end[0]-start[0], dy=end[1]-start[1], length=Math.hypot(dx,dy);
  const period=wavelength/10;
  const points=Array.from({length:101},(_,i)=>{
    const ratio=i/100;
    const offset=3.6*Math.min(1,ratio*6)*Math.sin(2*Math.PI*(ratio*length-time*73)/period);
    return [start[0]+dx*ratio-dy/length*offset,start[1]+dy*ratio+dx/length*offset];
  });
  return rayPath(points);
}

function scene(compact,time) {
  const {width,height,center,scale,sourceX,endX,spread}=layout(compact);
  const map = point => rotate(point).map((value,i)=>center[i]+scale*value);
  const traces = wavelengths.map(([wavelength,color]) => {
    const glass=1.5+.0042/(wavelength/1000)**2;
    const trace=tracePrism(glass);
    const [vx,vy]=rotate(trace.outgoing);
    return {start:map(trace.exit),angle:Math.atan2(vy,vx),wavelength,color,trace};
  });
  const firstAngle=traces[0].angle, lastAngle=traces.at(-1).angle;
  const middleAngle=(firstAngle+lastAngle)/2;
  const rays=traces.map((ray,i)=>{
    // Separate adjacent curves on the teaching diagram while preserving their order.
    const evenAngle=firstAngle+(lastAngle-firstAngle)*i/(traces.length-1);
    const angle=middleAngle+(.4*ray.angle+.6*evenAngle-middleAngle)*spread;
    return {...ray,end:[endX,ray.start[1]+(endX-ray.start[0])*Math.tan(angle)]};
  });
  const central=rays[3], first=rays[0], last=rays.at(-1);
  const prism=central.trace.vertices.map(map);
  const entry=map(central.trace.entry);
  const source=[sourceX,entry[1]+(sourceX-entry[0])*Math.tan(inclination)];
  const outline=prism.map(coords).join(' ');
  const spectrum=[first.start,first.end,last.end,last.start].map(coords).join(' ');
  const fanStops=rays.map((ray,i)=>`<stop offset="${i/(rays.length-1)}" stop-color="${ray.color}"/>`).join('');
  const internal=rayPath([entry,central.start]);
  const beam=rayPath([source,entry]);
  const prismLabelY=Math.max(...prism.map(([,y])=>y))+20;

  return {
    rays,
    viewBox:`0 0 ${width} ${height}`,
    markup:`<title>Hvitt lys gjennom et prisme</title>
      <desc>En hvit lysstråle treffer et glassprisme. På den andre siden sprer lyset seg i alle fargene fra rødt til fiolett. Forskjellene i bølgeretning er forstørret.</desc>
      <defs>
        <linearGradient id="wl-glass" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#8ccee4" stop-opacity=".34"/>
          <stop offset="1" stop-color="#357291" stop-opacity=".62"/>
        </linearGradient>
        <linearGradient id="wl-fan" x1="0" y1="0" x2="0" y2="1">${fanStops}</linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="8" fill="#122a38"/>
      <polygon data-wl-prism points="${outline}" fill="url(#wl-glass)" stroke="#91c1d4" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="${beam}" fill="none" stroke="#acc7d5" stroke-opacity=".34" stroke-width="12" stroke-linecap="round"/>
      <path data-wl-incoming d="${beam}" fill="none" stroke="#fffdf1" stroke-width="6" stroke-linecap="round"/>
      <path d="${internal}" fill="none" stroke="#e2f5f9" stroke-width="4" stroke-linecap="round" stroke-opacity=".86"/>
      <polygon data-wl-spectrum points="${spectrum}" fill="url(#wl-fan)" opacity=".16"/>
      ${rays.map(ray=>`<path data-wl-wave d="${wavePath(ray,time)}" fill="none" stroke="${ray.color}" stroke-width="2.8" stroke-linecap="round"/>`).join('')}
      <text x="${source[0]-3}" y="${source[1]+23}">Hvitt lys</text>
      <text x="${center[0]}" y="${prismLabelY}" text-anchor="middle">Prisme</text>
      <text x="${compact?303:551}" y="${compact?31:43}" text-anchor="middle">Synlig spekter</text>`
  };
}

const initial = scene(false,0);
export const whiteLightSection = {
  title:'Hvitt lys',
  body:`${styles}
    <p>Dagslys er et eksempel på hvitt lys som inneholder alle bølgelengdene i det synlige spekteret. Et prisme bryter lyset ulikt ved ulike bølgelengder, slik at vi kan se fargene hver for seg.</p>
    <div class="model" id="wl-model" data-model-layout="custom">
      <div class="model-visual">
        <svg id="wl-scene" viewBox="${initial.viewBox}" role="img" aria-label="Hvitt lys deles opp i farger ved hjelp av et prisme">${initial.markup}</svg>
      </div>
    </div>`
};

export function mountWhiteLight(root,api) {
  const svg=root.querySelector('#wl-scene');
  if (!svg) return;
  let compact, rays, paths, latestTime=0;
  function resize() {
    const narrow=svg.getBoundingClientRect().width<570;
    if (narrow===compact) return;
    compact=narrow;
    const prepared=scene(compact,latestTime);
    svg.setAttribute('viewBox',prepared.viewBox);
    svg.innerHTML=prepared.markup;
    rays=prepared.rays;
    paths=[...svg.querySelectorAll('[data-wl-wave]')];
  }
  resize();
  const stop=api.onFrame(time=>{
    latestTime=time;
    paths.forEach((path,i)=>path.setAttribute('d',wavePath(rays[i],time)));
  },svg);
  const observer=typeof ResizeObserver==='function' ? new ResizeObserver(resize) : null;
  observer?.observe(svg);
  return ()=>{
    stop?.();
    observer?.disconnect();
  };
}
