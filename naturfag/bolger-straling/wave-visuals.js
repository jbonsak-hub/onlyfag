const TAU = 2 * Math.PI;

export const waveVisualStyle = `<style>
.wb-spatial-model{margin-top:14px!important}
.wb-spatial-frame{position:relative;background:var(--surface-alt,#edf3f3);border-radius:10px;overflow:hidden}
.wb-spatial-frame .animation-surface{position:static}
.wb-spatial-frame .animation-toolbar{inset:8px 8px auto auto;transform:none}
.wb-spatial-frame .wb-mode-buttons{position:relative;z-index:1;margin:0;padding:9px 48px 0 9px}
.wb-scope .wb-visual-canvas{display:block;width:100%;height:auto;border-radius:10px}
.wb-scope #wv-sound{background:var(--surface-alt,#edf3f3)}
.wb-spatial-decoration{position:absolute;right:48px;top:16px;color:var(--muted,#58717a);font-size:.8rem;font-weight:600}
.wb-sound-model .animation-toolbar{inset:8px 8px auto auto;transform:none}
@media(max-width:600px){.wb-spatial-decoration{display:none}.wb-spatial-frame .wb-mode-buttons{padding-right:44px}}
</style>`;

export const spatialMarkup = `<div class="model wb-spatial-model" data-model-layout="custom">
  <div class="wb-spatial-frame">
    <div class="wb-mode-buttons" role="group" aria-label="Bølgetype i 3D">
      <button type="button" data-wb-spatial="transverse" aria-pressed="true">Tversbølge</button>
      <button type="button" data-wb-spatial="longitudinal" aria-pressed="false">Langsbølge</button>
    </div>
    <span class="wb-spatial-decoration">3D-modell</span>
    <canvas id="wv-spatial" class="wb-visual-canvas" width="2000" height="564" role="img" aria-label="En tversbølge brer seg til høyre gjennom en blokk med ruter."></canvas>
  </div>
  <p id="wv-spatial-caption" class="wb-caption">Den oransje ruten svinger opp og ned mens bølgen brer seg mot høyre.</p>
</div>`;

export const soundMarkup = `<canvas id="wv-sound" class="wb-visual-canvas" width="2100" height="804" role="img" aria-label="En høyttaler sender fortetninger og fortynninger gjennom luften og inn i øregangen. Trykkgrafen følger partiklene, og trommehinnen svinger."></canvas>`;

function trace(ctx, points, close = false) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  if (close) ctx.closePath();
}

function polygon(ctx, points, color, edge = color, thickness = 1) {
  trace(ctx, points, true);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = thickness;
  ctx.stroke();
}

function stroke(ctx, points, color, thickness = 1) {
  trace(ctx, points);
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.stroke();
}

function arrow(ctx, x1, y1, x2, y2, color, size = 7) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  stroke(ctx, [[x1,y1], [x2,y2]], color, 1.7);
  polygon(ctx, [[x2,y2], [x2-size*Math.cos(a-.48),y2-size*Math.sin(a-.48)], [x2-size*Math.cos(a+.48),y2-size*Math.sin(a+.48)]], color);
}

function circle(ctx, x, y, r, fill, border = null) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
}

function label(ctx, text, x, y, color, size = 18, weight = 550, align = 'left') {
  ctx.font = `${weight >= 600 ? 'bold' : 'normal'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function frame(ctx, canvas, width, height) {
  const ratio = 2;
  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio;
    canvas.height = height * ratio;
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawMesh(ctx, time, transverse, ink, compact) {
  const n = 37;
  const h = 5;
  const d = 6;
  const k = TAU / 12.5;
  const phase = i => k * i - TAU * .46 * time;
  const displaced = i => Math.sin(phase(i));
  const point = (i, j, z) => {
    const x = i + (transverse ? 0 : 1.3 * displaced(i));
    const y = j + (transverse ? 2.45 * displaced(i) : 0);
    return [65 + x * 22.1 + z * 9.3, 162 + x * 1.06 - y * 13.5 - z * 7.1];
  };
  const boundaries = Array.from({length: n+1}, (_, i) => i);
  const shade = (base, light) => `hsl(${base} ${transverse?36:37}% ${light}%)`;
  const outline = transverse ? '#624232' : '#264e55';
  for (let i = 0; i < n; i++) {
    const light = 8 * Math.cos(phase(i+.5));
    polygon(ctx, [point(i,h,0),point(i+1,h,0),point(i+1,h,d),point(i,h,d)], shade(transverse?32:151,69+light), outline, 1.12);
    polygon(ctx, [point(i,0,0),point(i+1,0,0),point(i+1,h,0),point(i,h,0)], shade(transverse?29:174,49+light*.61), outline, 1.12);
  }
  polygon(ctx, [point(n,0,0),point(n,0,d),point(n,h,d),point(n,h,0)], shade(transverse?27:172,39), outline, 1.12);
  for (let j = 1; j < h; j++) {
    stroke(ctx, boundaries.map(i=>point(i,j,0)), outline, .9);
    stroke(ctx, [point(n,j,0),point(n,j,d)], outline, .9);
  }
  for (let z = 1; z < d; z++) {
    stroke(ctx, boundaries.map(i=>point(i,h,z)), outline, .9);
    stroke(ctx, [point(n,0,z),point(n,h,z)], outline, .9);
  }
  const marker = 18;
  polygon(ctx, [point(marker,2,0),point(marker+1,2,0),point(marker+1,3,0),point(marker,3,0)], '#ffb440', '#fff4d6', 2.3);
  arrow(ctx, 73, 247, 935, 247, ink, 9);
  label(ctx, 'Bølgeretning', 503, 276, ink, compact?33:24, 600, 'center');
}

const particleCount = 930;
const points = (() => {
  let seed = 269;
  const random = () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 2**32);
  return Array.from({length: particleCount}, (_, i)=>[
    153 + (i % 62 + random()) * 9.26,
    86 + (Math.floor(i / 62) + random()) * 9.77,
    .9 + random() * 1.22,
  ]);
})();

function soundPalette(dark) {
  return dark ? {
    ink:'#eef8f5', muted:'#c0d7d1', grid:'#668985', gridSoft:'#456667',
    air:'#10353d', compression:'#42c7d1', particle:'#a2ece9', curve:'#8adce6',
    highlight:'#ffc565', graph:'#1d3c45', case:'#415c64', outline:'#112e37',
  } : {
    ink:'#223a3e', muted:'#43646b', grid:'#8badb1', gridSoft:'#bfd7d9',
    air:'#e0f1f2', compression:'#35a8ae', particle:'#217d88', curve:'#146e7d',
    highlight:'#ef9a22', graph:'#e4f1f2', case:'#415c64', outline:'#1a3944',
  };
}

function speaker(ctx, palette, shift) {
  const { case: frameColor, outline, curve, highlight } = palette;
  polygon(ctx, [[28,79],[45,71],[111,71],[102,81]], '#789096', outline);
  polygon(ctx, [[28,79],[102,79],[102,234],[28,234]], frameColor, outline, 2);
  polygon(ctx, [[102,79],[111,71],[111,226],[102,234]], '#58747d', outline, 2);
  circle(ctx, 58, 107, 13, '#264651', '#80999e');
  circle(ctx, 58, 107, 5, '#96b0b4');
  polygon(ctx, [[63,146],[100,146],[100,195],[63,195]], '#284a55', outline, 2);
  const membraneX = 150 + shift;
  polygon(ctx, [[94,150],[membraneX,100],[membraneX,218],[94,189]], '#a9c1c7', outline, 2.4);
  stroke(ctx, [[101,153],[membraneX,107]], '#e3eef0', 2);
  stroke(ctx, [[membraneX,99],[membraneX,219]], curve, 5.5);
  circle(ctx, membraneX, 157, 5, highlight, outline);
}

function drawPressureGraph(ctx, palette, phi, k, strength, compact) {
  const axis = 318;
  const xStart = 150;
  const xStop = 710;
  const pressure = x => axis - 39 * strength * Math.cos(phi(x));
  const curve = Array.from({length: (xStop-xStart)/2+1}, (_, i)=>[xStart+i*2, pressure(xStart+i*2)]);
  polygon(ctx, [[xStart,axis],...curve,[xStop,axis]], palette.graph);
  stroke(ctx, [[xStart,axis],[xStop,axis]], palette.grid, 1.5);
  arrow(ctx, xStart, 370, xStart, 270, palette.muted, 7);
  arrow(ctx, xStart, 370, xStop, 370, palette.muted, 7);
  stroke(ctx, curve, palette.curve, 3.2);
  label(ctx, 'Lufttrykk', 132, 286, palette.ink, compact?23:17, 650, 'right');
  label(ctx, 'Likevekt', 132, axis+5, palette.muted, compact?22:16, 500, 'right');
  label(ctx, 'Posisjon', xStop, 394, palette.ink, compact?22:17, 550, 'right');

  const wavelength = TAU / k;
  const firstCrest = 150 + ((-phi(150) % TAU) + TAU) % TAU / k;
  const left = firstCrest + (firstCrest + 2*wavelength <= xStop ? wavelength : 0);
  const right = left + wavelength;
  if (right > xStop) return;
  ctx.setLineDash([4,5]);
  for (const x of [left,right]) stroke(ctx, [[x,232],[x,pressure(x)]], palette.grid, 1.3);
  ctx.setLineDash([]);
  const y = Math.min(pressure(left)-9, 283);
  arrow(ctx, (left+right)/2, y, left, y, palette.curve, 6);
  arrow(ctx, (left+right)/2, y, right, y, palette.curve, 6);
  label(ctx, 'Bølgelengde', (left+right)/2, y-7, palette.ink, compact?22:17, 650, 'center');
}

function drawAir(ctx, palette, phi, shift, strength, travel, compact) {
  const xStart = 150;
  const xStop = 728;
  const top = 82;
  const height = 150;
  ctx.save();
  ctx.beginPath();
  ctx.rect(xStart+shift(xStart), top, xStop-xStart-shift(xStart), height);
  ctx.clip();
  ctx.fillStyle = palette.air;
  ctx.fillRect(120, top, xStop-120, height);
  ctx.fillStyle = palette.compression;
  for (let x = 120; x < xStop; x+=4) {
    ctx.globalAlpha = (.12 + .5 * strength) * Math.max(0, Math.cos(phi(x))) ** 1.75;
    ctx.fillRect(x, top, 4.2, height);
  }
  ctx.globalAlpha = .8;
  ctx.fillStyle = palette.particle;
  for (const [x,y,r] of points) ctx.fillRect(x+shift(x), y, r, r);
  ctx.globalAlpha = 1;
  for (const [x,y] of [[273,116], [436,175], [590,208]]) {
    ctx.setLineDash([3,4]);
    stroke(ctx, [[x-travel,y],[x+travel,y]], palette.muted, 1.05);
    ctx.setLineDash([]);
    circle(ctx, x+shift(x), y, 4.3, palette.highlight, palette.outline);
  }
  ctx.restore();
  stroke(ctx, [[xStart+shift(xStart),top],[xStop,top]], palette.gridSoft);
  stroke(ctx, [[xStart+shift(xStart),top+height],[xStop,top+height]], palette.gridSoft);
  arrow(ctx, 350, 49, 647, 49, palette.curve, 9);
  label(ctx, 'Lyden brer seg', 499, 36, palette.ink, compact?28:21, 600, 'center');
  label(ctx, 'Høyttaler', 25, 37, palette.ink, compact?26:20, 650);
}

function earTrace(ctx, drumX, drift) {
  ctx.beginPath();
  ctx.moveTo(738, 119);
  ctx.bezierCurveTo(711, 137, 715, 180, 752, 195);
  ctx.bezierCurveTo(762, 198, 771, 204, 778, 204);
  ctx.bezierCurveTo(807, 194, 832, 191, 851, 198);
  ctx.bezierCurveTo(875, 205, 902, 207, drumX+10, 201+drift*.23);
  ctx.lineTo(drumX, 156-drift*.23);
  ctx.bezierCurveTo(897, 151, 863, 157, 849, 160);
  ctx.bezierCurveTo(822, 167, 787, 156, 772, 163);
  ctx.bezierCurveTo(753, 170, 738, 156, 748, 142);
  ctx.bezierCurveTo(754, 132, 752, 124, 738, 119);
  ctx.closePath();
}

function drawEar(ctx, palette, phi, shift, strength, compact) {
  const drum = 932;
  const drift = shift(drum)*.55;
  const dx = drum+drift;
  const skinEdge = '#9e6556';
  ctx.beginPath();
  ctx.moveTo(742, 223);
  ctx.bezierCurveTo(708, 196, 696, 149, 719, 116);
  ctx.bezierCurveTo(733, 94, 755, 83, 779, 91);
  ctx.bezierCurveTo(796, 98, 800, 113, 791, 128);
  ctx.bezierCurveTo(820, 120, 827, 118, 853, 120);
  ctx.bezierCurveTo(875, 121, 898, 112, 921, 112);
  ctx.bezierCurveTo(949, 111, 977, 102, 1005, 116);
  ctx.bezierCurveTo(1035, 129, 1047, 152, 1035, 189);
  ctx.bezierCurveTo(1028, 213, 1008, 231, 984, 237);
  ctx.bezierCurveTo(960, 245, 960, 242, 939, 233);
  ctx.bezierCurveTo(905, 218, 876, 232, 854, 230);
  ctx.bezierCurveTo(830, 227, 819, 223, 794, 222);
  ctx.bezierCurveTo(796, 243, 762, 258, 742, 223);
  ctx.closePath();
  ctx.fillStyle = '#e5aa8f';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = skinEdge;
  ctx.stroke();

  // The ear canal is open to air and ends at a moving, slanted eardrum.
  earTrace(ctx, dx, drift);
  ctx.fillStyle = palette.air;
  ctx.fill();
  ctx.strokeStyle = skinEdge;
  ctx.lineWidth = 1.45;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = palette.compression;
  for (let x = 716; x < dx+18; x+=3) {
    ctx.globalAlpha = (.18+.52*strength) * Math.max(0,Math.cos(phi(x))) ** 1.6;
    ctx.fillRect(x, 120, 3.2, 90);
  }
  ctx.globalAlpha = .8;
  ctx.fillStyle = palette.particle;
  for (let i=0; i<144; i++) {
    const x = 722 + (i % 31)*7.1 + ((i*23)%9)*.57;
    if (x + shift(x) < dx+6) ctx.fillRect(x+shift(x), 138 + Math.floor(i/31)*14 + ((i*13)%11), 1.7, 1.7);
  }
  ctx.restore();

  polygon(ctx, [[dx,156-drift*.23],[950,141],[971,151],[976,184],[955,209],[dx+10,201+drift*.23]], '#f3ccad', skinEdge, 1.4);
  stroke(ctx, [[dx,156-drift*.23],[dx+4,176],[dx+10,201+drift*.23]], '#65549d', 4.2);
  stroke(ctx, [[dx+6,173],[948+drift*.5,157],[961+drift*.25,163],[973,155]], '#7c5947', 7.6);
  stroke(ctx, [[dx+6,173],[948+drift*.5,157],[961+drift*.25,163],[973,155]], '#ffe9bb', 4.8);
  circle(ctx, 995, 183, 24, '#e8bd7e', '#a57148');
  const spiral = Array.from({length:61},(_,i)=>{
    const a = .42*i;
    const r = 20-i*.3;
    return [995+r*Math.cos(a),183+r*Math.sin(a)];
  });
  stroke(ctx, spiral, '#a57148', 1.8);

  label(ctx, 'Øret', 875, 44, palette.ink, compact?27:22, 650, 'center');
  stroke(ctx, [[835,203],[832,256],[800,256]], palette.muted, 1.2);
  label(ctx, 'Øregang', 795, 261, palette.ink, compact?19:15, 650, 'right');
  stroke(ctx, [[dx+9,199],[941,258],[970,258]], palette.muted, 1.2);
  label(ctx, 'Trommehinne', 968, 280, palette.ink, compact?19:15, 650, 'center');
}

function drawSound(ctx, canvas, time, frequency, strength, dark) {
  const palette = soundPalette(dark);
  const compact = canvas.clientWidth > 0 && canvas.clientWidth < 580;
  frame(ctx,canvas,compact?730:1050,compact?744:402);
  const k = TAU * frequency / (154 * 500);
  const phase = TAU * frequency / 1120 * time;
  const phi = x => k * (x-150) - phase;
  const travel = .56 * strength / k;
  const shift = x => -travel * Math.sin(phi(x));
  drawAir(ctx,palette,phi,shift,strength,travel,compact);
  speaker(ctx,palette,shift(150));
  drawPressureGraph(ctx,palette,phi,k,strength,compact);
  if (compact) {
    ctx.save();
    ctx.translate(147, 402);
    ctx.scale(1.35,1.35);
    ctx.translate(-720,-29);
  }
  drawEar(ctx,palette,phi,shift,strength,compact);
  if (compact) ctx.restore();
}

export function mountWaveVisuals(root, api) {
  const spatial = root.querySelector('#wv-spatial');
  const sound = root.querySelector('#wv-sound');
  const spatialCtx = spatial.getContext?.('2d');
  const soundCtx = sound.getContext?.('2d');
  const modeButtons = root.querySelectorAll('[data-wb-spatial]');
  const caption = root.querySelector('#wv-spatial-caption');
  const frequency = root.querySelector('#wb-sound-frequency');
  const strength = root.querySelector('#wb-sound-amplitude');
  const dark = () => root.ownerDocument?.body?.classList?.contains('dark') ?? false;
  let transverse = true;

  for (const button of modeButtons) button.addEventListener('click', () => {
    transverse = button.dataset.wbSpatial === 'transverse';
    for (const item of modeButtons) item.setAttribute('aria-pressed', String(item === button));
    spatial.setAttribute('aria-label', transverse
      ? 'En tversbølge brer seg til høyre gjennom en blokk med ruter.'
      : 'En langsbølge brer seg til høyre gjennom blokka i form av tettere og glisnere ruter.');
    caption.textContent = transverse
      ? 'Den oransje ruten svinger opp og ned mens bølgen brer seg mot høyre.'
      : 'Den oransje ruten svinger fram og tilbake. Fortetningene brer seg mot høyre.';
    api.repaint(spatial);
  });

  if (spatialCtx) api.onFrame(time => {
    frame(spatialCtx,spatial,1000,282);
    drawMesh(spatialCtx,time,transverse,dark()?'#c8e1dd':'#315e60',spatial.clientWidth<600);
  },spatial);
  if (soundCtx) api.onFrame(time => drawSound(soundCtx,sound,time,Number(frequency.value),Number(strength.value),dark()), sound);

  const observer = typeof ResizeObserver === 'function' && soundCtx
    ? new ResizeObserver(() => { if (sound.clientWidth) api.repaint(sound); })
    : null;
  observer?.observe(sound);
  return () => observer?.disconnect();
}
