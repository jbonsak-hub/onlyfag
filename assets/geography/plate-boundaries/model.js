/* Schematic teaching models, not simulations of geologic time or earthquake forecasts.
   Subduction geometry and material tracers build on the supplied Subduksjonsmodell.html. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = n => Math.max(0, Math.min(1, n));
  const ramp = (p, a, b) => clamp((p - a) / (b - a));
  const f = n => Number(n.toFixed(2));
  const models = {
    'ocean-continent': {
      title: 'Havbunn møter kontinent', kind: 'Konvergerende · subduksjon', view: 'Tverrsnitt',
      summary: 'En havbunnsplate synker under et kontinent og former et helt landskap.',
      stages: ['Havbunnsplaten bøyes ned', 'Platen synker – skjelv følger platen', 'Vann bidrar til oppsmelting', 'Magma stiger – fjellkjeden vokser'],
      narration: [
        'Den kalde havbunnsplaten bøyes ned under kontinentet. Ved kanten dannes en dyphavsgrop. Følg den lyse havbunnsskorpa ned i mantelen.',
        'Havbunnsplaten synker videre. Gule punkter viser mulige grunne skjelv. Dypere skjelv skjer inne i den kalde platen, ikke langs en friksjonsflate hele veien ned.',
        'Vannrike væsker frigjøres fra mineraler i den synkende platen. Vannet senker smeltetemperaturen i mantelkilen over platen, slik at noe av mantelen smelter.',
        'Magma stiger gjennom kontinentalplaten og kan danne vulkaner. Samtidig presses skorpa sammen og heves. Vulkanisme og sammenpressing bygger fjellkjeden sammen.'
      ],
      steps: [
        ['En plate synker', 'Kald havbunnslitosfære er tett og kan synke. Nedbøyningen danner en dyphavsgrop.'],
        ['Vann frigjøres', 'Vann fra mineraler i platen senker smeltetemperaturen i mantelkilen. En del av mantelen smelter.'],
        ['Vulkaner og fjell', 'Magma stiger og bygger vulkaner. Sammenpressing og fortykkelse av skorpa bygger også fjell.'],
        ['Skjelv på ulike dyp', 'Grunne skjelv kan skje ved platekontakten. Dypere skjelv skjer inne i den kalde, synkende platen.']
      ],
      result: 'Dyphavsgrop · vulkansk fjellkjede · grunne og dype jordskjelv',
      example: ['Andesfjellene', 'Nazcaplaten synker under den søramerikanske platen.'],
      map: {center: '-21,-70', zoom: 5},
      caveat: 'Magmaen kommer her fra mantelkilen, ikke fra en havbunnsplate som smelter. Foldene ved gropa viser sedimenter som kan skrapes av og hope seg opp; mengden varierer mellom subduksjonssoner. Skjelvsymbolene er mulige fokus, ikke samtidige skjelv. Gult: grunt, korall: mellomdypt, lilla: dypt (i noen soner ned mot 700 km).'
    },
    'ocean-ocean': {
      title: 'To havbunnsplater møtes', kind: 'Konvergerende · subduksjon', view: 'Tverrsnitt',
      summary: 'Én havbunnsplate synker under en annen. Vulkanene kan danne en øybue.',
      stages: ['Den kalde platen bøyes ned', 'Subduksjonen fortsetter', 'Vann bidrar til oppsmelting', 'En vulkansk øybue vokser fram'],
      narration: [
        'To havbunnsplater møtes. Den eldre og kaldere platen er vanligvis tettest og synker under den andre. Der den bøyes ned, dannes en dyphavsgrop.',
        'Den synkende platen når større dyp. Skjelvfokusene følger platen nedover: grunne skjelv nær gropa, mellomdype og dype skjelv lenger inn under den øvre platen.',
        'Den synkende platen frigjør vannrike væsker. Vannet bidrar til delvis oppsmelting av mantelen over platen. Magmaen kan begynne å stige.',
        'Vulkaner bygges opp på den øvre havbunnsplaten. De kan vokse over havnivå og danne en vulkansk øybue. Gropa ligger fortsatt utenfor øybuen.'
      ],
      steps: [
        ['Ulik alder og tetthet', 'Den eldre, kaldere og tettere havbunnsplaten synker vanligvis under den yngre. En dyphavsgrop dannes.'],
        ['Magma under havet', 'Vann fra den synkende platen bidrar til delvis oppsmelting i mantelkilen over den.'],
        ['Vulkansk øybue', 'Magma trenger opp gjennom den øvre havbunnsplaten. Vulkanene kan til slutt bli øyer.'],
        ['Skjelv følger platen', 'Grunne skjelv ved grensen og dypere skjelv i den synkende platen viser retningen den synker i.']
      ],
      result: 'Dyphavsgrop · vulkansk øybue · grunne og dype jordskjelv',
      example: ['Marianegropa og Marianene', 'Stillehavsplaten synker under Marianedelen av den filippinske havplaten.'],
      map: {center: '18,147.5', zoom: 6},
      caveat: 'Alder og temperatur påvirker tettheten, men geometrien og platens historie spiller også inn. En øybue ligger på den øvre platen, et stykke fra gropa. De bakre øyene viser skjematisk at buen fortsetter bak tverrsnittet. Foldene ved gropa viser sedimenter som kan skrapes av; ikke alle soner bygger et stort sedimentprism. Skjelvsymbolene viser mulige fokus: gult = grunt, korall = mellomdypt, lilla = dypt.'
    },
    'continent-continent': {
      title: 'To kontinenter kolliderer', kind: 'Konvergerende · kontinentkollisjon', view: 'Tverrsnitt',
      summary: 'To kontinenter møtes etter at havet mellom dem er lukket. Skorpa forkortes, foldes og fortykkes.',
      stages: ['Kontinentene møtes', 'Skorpa presses sammen', 'Fjell og en dyp skorperot vokser', 'Delvis smelting i den dype skorpa'],
      narration: [
        'Havet mellom kontinentene er lukket, og to kontinenter møtes. Den lette kontinentalskorpa motstår å synke dypt. I stedet begynner den å deformeres.',
        'Bevegelsen fortsetter: berglag foldes og skyves over hverandre. Skorpa forkortes og fortykkes. Brudd langs forkastninger kan utløse jordskjelv.',
        'En høy fjellkjede og en dyp skorperot vokser fram. Den ene kontinentalplaten skyves inn under den andre. Den fortykkede skorpa kan varmes opp over lang tid.',
        'Blir den dype kontinental­skorpa varm nok, kan den smelte delvis. Her samles magma inne i skorpa og kan størkne til granitt. Den har ingen kanal til overflaten: kontinentkollisjon gir vanligvis ingen vulkansk bue.'
      ],
      steps: [
        ['Kontinent møter kontinent', 'Kontinentalskorpa har lav tetthet og motstår å synke dypt. Den ene platen kan skyves inn under den andre.'],
        ['Skorpa forkortes', 'Lag foldes og skyves over hverandre langs overskyvninger. Skorpa blir tykkere.'],
        ['Fjell med røtter', 'Høye fjell bygges opp over en dyp skorperot. Bevegelse langs forkastninger kan utløse store jordskjelv.'],
        ['Smelting og granitt i dypet', 'Deler av varm, fortykket kontinental­skorpe kan smelte. Magma kan samle seg og størkne inne i skorpa som granitt, uten vulkanutbrudd.']
      ],
      result: 'Foldede fjellkjeder · tykk skorpe · jordskjelv · mulig granittdannelse i dypet',
      example: ['Himalaya og Tibet', 'Den indiske platen kolliderer med den eurasiske platen.'],
      map: {center: '31,85', zoom: 5},
      caveat: 'Smelting er en mulighet når deler av den fortykkede kontinental­skorpa blir varme nok, ikke en automatisk følge av økt trykk eller enhver kollisjon. I dette eksemplet blir magmaen i skorpa; Himalayas lyse granitter viser at slik smelting har skjedd. Kontinentkollisjon gir vanligvis ingen vulkansk bue, men vulkanisme kan forekomme i enkelte kollisjons- og etterkollisjonsmiljøer. Tidligere subduksjon av havbunn er ikke med. Erosjon former fjellene mens de heves.'
    },
    divergent: {
      title: 'En midthavsrygg bygges opp', kind: 'Divergerende · havbunnsspredning', view: 'Havbunn + tverrsnitt',
      summary: 'Se ryggen vokse. Følg ny havbunn fra spredningsaksen og utover på begge sider.',
      stages: ['Platene trekkes fra hverandre', 'Magma bygger opp ryggen', 'Rygger og søkk flyttes utover'],
      narration: [
        'Platene trekkes fra hverandre. Varm mantel stiger, og lavere trykk gir delvis oppsmelting. Vannet er skjult i figuren, så du kan se havbunnen ovenfra og lagene i snitt.',
        'Magma stiger og størkner til ny havbunn ved aksen. Den varme ryggen ligger høyt. Strekk og normalforkastninger lager en sentral riftdal og trinn på flankene.',
        'Ny havbunn skyver det eldre materialet utover. Følg de to lyse markørene! Langstrakte rygger og søkk følger med platene. Havbunnen kjøles, tykner og synker bort fra aksen.'
      ],
      steps: [
        ['Riftdal og rygg', 'Varmt materiale og tilførsel av ny skorpe bygger en høy rygg. Strekk kan senke en riftdal langs aksen.'],
        ['Ny skorpe i midten', 'Trykkavlastning gir delvis oppsmelting i mantelen. Magma stiger og størkner ved spredningsaksen.'],
        ['Rygger og søkk følger platen', 'Normalforkastninger og vulkanisme lager ujevn havbunn. Langstrakte åser og søkk flyttes ut fra ryggen når ny havbunn dannes.']
      ],
      result: 'Midthavsrygg · ny havbunn · vulkanisme · grunne jordskjelv',
      example: ['Den midtatlantiske ryggen', 'På Island ligger deler av spredningssonen over havnivå.'],
      map: {center: '32,-33', zoom: 4},
      caveat: 'Modellen viser en langsomt spredende rygg, som deler av Den midtatlantiske ryggen, med riftdal og tydelige forkastningstrinn. Raskt spredende rygger har ofte en jevnere, opphøyd akse uten stor riftdal. Havbunnens farge viser relativ alder og avkjøling, ikke magnetiske polvendinger. Toppen viser havbunnen uten vann; fronten er skåret opp for å vise lagene. Terrenget er sterkt forenklet.'
    },
    transform: {
      title: 'Platene glir forbi hverandre', kind: 'Transform · glidegrense', view: 'Skrått 3D-utsnitt',
      summary: 'Platene beveger seg sidelengs langs en forkastning. De kan låses, lagre spenning og så gli brått.',
      stages: ['Platekontakten er låst', 'Spenningen bygger seg opp', 'Brudd – et jordskjelv utløses'],
      narration: [
        'Her ser du et skrått utsnitt av platene. De beveger seg sidelengs langs forkastningen, men friksjon kan holde kontakten fastlåst. Veien og elva krysser grensen.',
        'Kontakten holder igjen mens platene fortsetter å bevege seg. Berggrunnen bøyes og lagrer elastisk energi. Veien deformeres nær forkastningen.',
        'Den låste delen brister og platene glir brått forbi hverandre. Energi frigjøres som jordskjelvbølger. Legg merke til hvordan de to delene av veien er forskjøvet.'
      ],
      steps: [
        ['Sidelengs bevegelse', 'Pilene viser motsatt bevegelse langs grensen. Det skrå utsnittet viser landskapet og berglagene under. Platene forskyves sideveis, uten vertikal bevegelse i dette eksemplet.'],
        ['Fastlåsing og spenning', 'Friksjon kan låse deler av forkastningen. Berggrunnen rundt deformeres mens platene fortsetter å bevege seg.'],
        ['Plutselig glidning', 'Når en låst del brister, frigjøres energi som jordskjelvbølger. Veier og elveløp kan forskyves.']
      ],
      result: 'Sideveis forskyvning · forkastning · grunne jordskjelv',
      example: ['San Andreas-forkastningen', 'Stillehavsplaten og den nordamerikanske platen glir forbi hverandre i California.'],
      map: {center: '36.6,-120.2', zoom: 7},
      caveat: 'Sideflatene er skåret åpne for å vise berglagene i et begrenset modellutsnitt; de er ikke stup eller åpne sprekker i landskapet. Platene har konstant tykkelse og beveger seg bare sidelengs. Ingen litosfære dannes eller forbrukes ved en ren glidegrense. Vulkanisme er ikke et typisk resultat. Glideren viser ett tenkt forløp fra fastlåsing til brudd, ikke når neste jordskjelv vil skje. Noen forkastningsdeler glir også langsomt uten store skjelv.'
    }
  };

  const colors = {ocean: '#72adb0', continent: '#d0aa7d', water: '#84d9ec', magma: '#f4a461', quake: '#e9c773', young:'#edbd83',parcel:'#fff1ad'};
  const knownMode = key => Object.hasOwn(models, key);
  let mode = 'ocean-continent', topic = 0, narratedStage = -1, playing = false, frame = null, last = null, labels = true;
  const progress = Object.fromEntries(Object.keys(models).map(key => [key, 0]));
  let mobile = false, height = 540;
  const Y = n => f(22 + (n - 22) * (height - 44) / 496);
  const path = (d, fill, attributes = '') => `<path d="${d}" fill="${fill}" ${attributes}/>`;
  const line = points => points.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)} ${f(p.y)}`).join(' ');
  const text = (x, y, label, extra = '') => `<text x="${x}" y="${Y(y)}" class="svg-label ${extra}">${label}</text>`;
  const caption = (x, y, label, extra = '') => text(x, y, label, `svg-small ${extra}`);
  const arrow = (x, y, dx, dy = 0) => `<path class="motion" d="M${x} ${Y(y)}l${dx} ${Y(y + dy) - Y(y)}"/>`;
  const hotspot = (n, x, y) => `<g class="hotspot${topic === n - 1 ? ' active' : ''}" data-topic="${n - 1}" role="button" tabindex="0" aria-label="${n}. ${models[mode].steps[n - 1][0]}" aria-pressed="${topic === n - 1}" transform="translate(${x} ${Y(y)})"><circle class="hotspot-number" r="${mobile ? 27 : 16}"/><text text-anchor="middle" dominant-baseline="central">${n}</text></g>`;
  const quake = (x, y, depth = 0) => {
    const shape = depth === 0 ? '<circle r="5"/>' : `<rect x="-4.5" y="-4.5" width="9" height="9"${depth === 1 ? ' transform="rotate(45)"' : ''}/>`;
    return `<g class="earthquake" data-depth="${depth}" fill="${['#f4d776','#ed9a80','#c4a4f3'][depth]}" stroke="#434743" stroke-width="1.5" transform="translate(${f(x)} ${Y(y)})"><circle r="10" fill="none" opacity=".65"/>${shape}</g>`;
  };
  const earth = () => `<rect width="1000" height="${height}" class="sky"/><path d="M0 ${Y(230)}H1000V${height}H0Z" fill="url(#mantle)"/><path d="M0 ${Y(230)}H1000V${height}H0Z" fill="url(#rock)"/>`;
  const sea = (full = false) => `<path d="M0 ${Y(158)}H${full ? 1000 : 520}V${Y(248)}H0Z" fill="url(#water)"/><path d="M0 ${Y(158)}q22-4 44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0${full ? 't44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0t44 0' : ''}" stroke="#a0d3da" fill="none" opacity=".7"/>`;

  // The supplied model's sampled slab and moving tracers, reflowed to this viewport.
  const points = [];
  for (let x = -100; x <= 340; x += 10) points.push({x, y: 216});
  for (let i = 1; i <= 24; i++) {
    const t = i / 24, u = 1 - t;
    points.push({x: u ** 3 * 340 + 3 * u * u * t * 391 + 3 * u * t * t * 414 + t ** 3 * 450,
      y: u ** 3 * 216 + 3 * u * u * t * 216 + 3 * u * t * t * 232 + t ** 3 * 260});
  }
  for (let i = 1; i <= 64; i++) points.push({x: 450 + 460 * i / 64, y: 260 + 250 * i / 64});
  points[0].distance = 0;
  for (let i = 1; i < points.length; i++) points[i].distance = points[i - 1].distance + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  const total = points.at(-1).distance, bend = points[68].distance;
  function pointAt(distance) {
    const d = Math.max(0, Math.min(total, distance));
    const index = Math.max(1, points.findIndex(p => p.distance >= d));
    const a = points[index - 1], b = points[index], t = (d - a.distance) / (b.distance - a.distance);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, nx: Math.sin(angle), ny: -Math.cos(angle)};
  }
  const offset = (p, n) => ({x: p.x + p.nx * n, y: p.y + p.ny * n});
  const plotLine = pts => line(pts.map(p => ({x: p.x, y: Y(p.y)})));
  const band = (pts, outer, inner) => plotLine(pts.map(p => offset(p, outer))) + plotLine(pts.map(p => offset(p, inner)).reverse()).replace(/^M/, 'L') + 'Z';

  function artContext() {
    return {Y,path,line,text,caption,arrow,hotspot,quake,earth,sea,band,points,pointAt,plotLine,total,bend,offset,mobile,labels,height,mode,clamp,ramp,f};
  }
  function subduction(p, ocean) { return window.PlateBoundaryArt.subduction(p,ocean,artContext()); }
  function collision(p) { return window.PlateBoundaryArt.collision(p,artContext()); }

  function divergent(p) {
    const growth = ramp(p, .02, .5), travel = p * 322;
    // Material is created at the axis and advected outwards, without wrapping.
    const ridges = [];
    for (let born = 0; born <= p; born += .105) {
      const distance = 24 + (p - born) * 322;
      if (distance > 31) ridges.push(distance);
    }
    const surface = x => {
      const d = Math.abs(x - 500);
      const dome = 81 * growth * Math.exp(-d / 126);
      const valley = 31 * growth * Math.exp(-((d / 21) ** 2));
      const hills = ridges.reduce((sum, r) => sum + 9 * growth * Math.exp(-(((d - r) / 8) ** 2)), 0);
      return 285 - dome + valley - hills;
    };
    const base = x => 376 - 76 * growth * Math.exp(-Math.abs(x - 500) / 170);
    const projection = (x, y, z = 0) => ({x:f(x + 72 * z),y:Y(y - 115 * z)});
    const profile = (start, end, z = 0, depth = 0) => {
      const pts = [], n = Math.ceil(Math.abs(end - start) / 5);
      for (let i = 0; i <= n; i++) {const x = start + (end - start) * i / n; pts.push(projection(x, surface(x) + depth, z));}
      return pts;
    };
    const polygon = pts => line(pts) + 'Z';
    const strip = (a, b) => polygon([...profile(a,b),...profile(b,a,1)]);
    const front = profile(60,900);
    const lower = [];
    for (let x = 900; x >= 60; x -= 5) lower.push(projection(x,base(x)));
    let art = `<rect width="1000" height="${height}" class="sky"/>`;
    art += path(polygon([...front,projection(900,474),projection(60,474)]),'url(#mantle)');
    art += path(polygon([...front,projection(900,474),projection(60,474)]),'url(#rock)');
    art += path(polygon([projection(900,surface(900)),projection(900,surface(900),1),projection(900,474,1),projection(900,474)]),'#3f5861');
    art += path(polygon([...front,...lower]),'url(#ocean-plate)','data-feature="ridge-cross-section"');
    art += path(polygon([...profile(60,900),...profile(900,60,1)]),'#548b92','data-feature="ridge-surface"');
    // Colored parcels have a paired birth time on the two plates; warm means young.
    const palette = ['#edbd83','#c9d4aa','#a2c5b1','#82b3aa','#6a9fa3','#578c98','#477b8b','#3e7183','#396879','#345e70'];
    for (let i = 0; i < 10; i++) {
      const outer = travel - i * 32.2, inner = Math.max(0,outer - 32.2);
      if (outer <= 0) continue;
      const color = palette[Math.min(9,Math.floor(inner / 34))];
      for (const sign of [-1,1]) art += path(strip(500 + sign * inner,500 + sign * outer),color,`data-feature="age-band" data-side="${sign}" data-birth="${i}"`);
    }
    // Long abyssal hills and their neighboring troughs lie parallel to the ridge.
    for (const r of ridges) for (const sign of [-1,1]) {
      const x = 500 + sign * r;
      art += path(line([projection(x,surface(x)),projection(x,surface(x),1)]),'none','stroke="#d8e5c3" stroke-width="2.5" data-feature="abyssal-hill"');
      art += path(line([projection(x + sign*8,surface(x+sign*8)),projection(x+sign*8,surface(x+sign*8),1)]),'none','stroke="#234f63" stroke-width="3" opacity=".45"');
    }
    art += path(polygon([...profile(60,900),...profile(900,60,0,9)]),'#9ec5b4','data-feature="seafloor-crust"');
    // A central valley and normal-fault steps, typical of a slow-spreading ridge.
    if (growth > 0) {
      art += path(strip(488,512),'#395a65',`opacity="${growth}" data-feature="rift-valley"`);
      for (const sign of [-1,1]) for (const d of [32,65,102]) {
        const x=500+sign*d;
        art += path(line([projection(x,surface(x)),projection(x+sign*23,surface(x)+42)]),'none',`stroke="#345764" stroke-width="2" opacity="${growth}" data-feature="normal-fault"`);
      }
    }
    const melt = ramp(p,.07,.4);
    art += `<g opacity="${melt}" data-feature="melt"><ellipse cx="500" cy="${Y(371)}" rx="86" ry="${Y(422)-Y(371)}" fill="url(#melt)"/>`;
    art += path(`M488 ${Y(384)}Q479 ${Y(324)} 494 ${Y(surface(500)+4)}L506 ${Y(surface(500)+4)}Q522 ${Y(324)} 512 ${Y(384)}Z`,'#f5ab69','data-feature="new-crust"');
    art += path(`M500 ${Y(417)}V${Y(surface(500)+20)}`,'none','class="magma-flow"') + '</g>';
    art += path(`M398 ${Y(446)}Q406 ${Y(393)} 448 ${Y(376)}`,'none','class="motion"') + path(`M602 ${Y(446)}Q594 ${Y(393)} 552 ${Y(376)}`,'none','class="motion"');
    art += arrow(318,211,-86) + arrow(746,211,86);
    if (p > .12) for (const sign of [-1,1]) {
      const x=500+sign*(25+travel*.88);
      const a=projection(x,surface(x)-2,.5);
      art += `<circle cx="${a.x}" cy="${a.y}" r="${mobile?7:5}" fill="#fff1ad" stroke="#3a655f" stroke-width="2" data-feature="crust-parcel" data-side="${sign}"/>`;
    }
    if (p > .2) art += quake(465,surface(465)+18) + quake(535,surface(535)+18);
    art += `<g class="diagram-labels"${labels?'':' hidden'}>`;
    if (growth > .1) art += text(320,55,'Midthavsrygg') + path(`M496 ${Y(63)}L558 ${Y(surface(500)-96)}`,'none','class="callout-line"') + text(625,103,'Riftdal') + path(`M636 ${Y(110)}L548 ${Y(surface(500)-77)}`,'none','class="callout-line"');
    art += text(73,153,mobile?'Eldre':'Eldre havbunn') + text(mobile?779:758,139,mobile?'Eldre':'Eldre havbunn');
    art += text(94,333,'Havbunnsplate','terrain-label');
    if (melt > .1) art += text(645,419,mobile?'Delvis smelting':'Delvis oppsmelting','terrain-label');
    if (p > .3) art += text(mobile?715:720,300,mobile?'Åser og søkk':'Rygger og søkk','terrain-label');
    if (!mobile) art += caption(94,440,'Mantelen er hovedsakelig fast','terrain-label');
    return art + '</g>' + hotspot(1,629,170) + hotspot(2,587,355) + hotspot(3,780,258);
  }

  function transform(p) { return window.PlateBoundaryArt.transform(p,artContext()); }

  function stageIndex(p) { return mode.startsWith('ocean-') ? p < .22 ? 0 : p < .44 ? 1 : p < .7 ? 2 : 3 : mode === 'continent-continent' ? p < .3 ? 0 : p < .6 ? 1 : p < .8 ? 2 : 3 : mode === 'transform' ? p < .3 ? 0 : p < .74 ? 1 : 2 : p < .3 ? 0 : p < .65 ? 1 : 2; }
  function draw() {
    const p = progress[mode] / 100, model = models[mode], index = stageIndex(p), stage = model.stages[index];
    if (narratedStage !== index) {
      narratedStage = index;
      topic = mode.startsWith('ocean-') ? [0, 3, 1, 2][index] : index;
      document.querySelectorAll('.process-step').forEach((el, i) => el.setAttribute('aria-pressed', String(i === topic)));
      $('stage-number').textContent = String(index + 1).padStart(2, '0');
      $('stage-explanation').textContent = model.narration[index];
    }
    $('drawing').innerHTML = mode.startsWith('ocean-') ? subduction(p, mode === 'ocean-ocean') : mode === 'continent-continent' ? collision(p) : mode === 'divergent' ? divergent(p) : transform(p);
    const value = Math.floor(progress[mode]);
    $('progress').value = value;
    $('progress-value').textContent = `${value} %`;
    $('progress').setAttribute('aria-valuetext', `${value} prosent. ${stage}.`);
    if ($('stage-name').textContent !== stage) $('stage-name').textContent = stage;
    $('diagram-description').textContent = `${model.summary} ${stage}. Modellforløp ${value} prosent. ${model.view}. Avstander og tid er ikke i målestokk.`;
  }
  function selectTopic(n, source) {
    topic = n;
    document.querySelectorAll('.process-step').forEach((el, i) => el.setAttribute('aria-pressed', String(i === n)));
    // Preserve keyboard focus in SVG when a hotspot is replaced by draw().
    draw();
    if (source === 'hotspot') {
      if (innerWidth <= 900) openInfo();
      else $('drawing').querySelector(`[data-topic="${n}"]`)?.focus();
    }
  }
  function selectMode(next, focus = false) {
    if (!knownMode(next)) return;
    stop(); mode = next; progress[mode] = 0; topic = 0; narratedStage = -1;
    const model = models[mode];
    document.querySelectorAll('[role=tab]').forEach(el => { const selected = el.dataset.mode === mode; el.setAttribute('aria-selected', String(selected)); el.tabIndex = selected ? 0 : -1; if (selected && focus) el.focus(); });
    $('model-panel').setAttribute('aria-labelledby', `tab-${mode}`);
    $('model-title').textContent = model.title;
    $('diagram-title').textContent = model.title;
    $('boundary-kind').textContent = model.kind;
    $('view-kind').textContent = model.view;
    $('summary').textContent = model.summary;
    $('result').textContent = model.result;
    $('example-title').textContent = model.example[0];
    $('example-detail').textContent = model.example[1];
    const mapUrl = new URL('https://www.google.com/maps/d/viewer');
    mapUrl.search = new URLSearchParams({mid:'105PobuL643Yr0Gh5O478-RHzWksbtCc',ll:model.map.center,z:String(model.map.zoom)});
    $('example-map').href = mapUrl.href;
    $('example-map').setAttribute('aria-label', 'Se ' + model.example[0] + ' i plategrensekartet');
    $('model-caveat').textContent = model.caveat;
    $('collision-source').hidden = mode !== 'continent-continent';
    $('process-steps').innerHTML = model.steps.map(([title, body], i) => `<button class="process-step" data-topic="${i}" type="button" aria-pressed="${i === topic}"><span class="step-number">${i + 1}</span><span><strong>${title}</strong><span class="step-detail">${body}</span></span></button>`).join('');
    const legend = mode === 'transform' ? [['continent','Plateoverflate'],['quake','Jordskjelv']] : mode === 'continent-continent' ? [['continent','Kontinentalskorpe'],['magma','Delvis smelting'],['quake','Jordskjelv']] : mode === 'divergent' ? [['ocean','Havbunnsplate'],['young','Ung skorpe'],['parcel','Følg bergarten'],['magma','Magma']] : [['ocean','Havbunnsplate'], ...(mode === 'ocean-continent' ? [['continent','Kontinentalskorpe']] : []), ['water','Vannrike væsker'],['magma','Magma']];
    $('legend-items').innerHTML = legend.map(([key, label]) => `<span class="legend-item"><i class="swatch" style="--swatch:${colors[key]}"></i>${label}</span>`).join('');
    // Only recognized fragment values are used; opening a link never executes data.
    try { history.replaceState(null, '', `#${mode}`); } catch { /* file:// may disallow history changes */ }
    draw();
  }
  function stop() {
    playing = false; if (frame !== null) cancelAnimationFrame(frame); frame = null; last = null;
    $('play').innerHTML = '<span aria-hidden="true">▶</span> Spill av';
    $('play').setAttribute('aria-pressed', 'false'); $('play').setAttribute('aria-label', 'Spill av utviklingen');
  }
  function tick(now) {
    if (!playing) return;
    if (last !== null) progress[mode] = Math.min(100, progress[mode] + Math.min(now - last, 100) / 230);
    last = now; draw();
    if (progress[mode] >= 100) stop(); else frame = requestAnimationFrame(tick);
  }
  $('progress').addEventListener('input', e => { stop(); progress[mode] = Number(e.target.value); draw(); });
  $('play').addEventListener('click', () => {
    if (playing) return stop();
    if (progress[mode] >= 100) progress[mode] = 0;
    playing = true; last = null;
    $('play').innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
    $('play').setAttribute('aria-pressed', 'true'); $('play').setAttribute('aria-label', 'Sett utviklingen på pause');
    frame = requestAnimationFrame(tick);
  });
  $('reset').addEventListener('click', () => { stop(); progress[mode] = 0; selectTopic(0); });
  $('labels-toggle').addEventListener('click', () => { labels = !labels; $('labels-toggle').setAttribute('aria-pressed', String(labels)); $('labels-toggle').textContent = labels ? 'Skjul navn' : 'Vis navn'; draw(); });
  document.querySelector('.boundary-tabs').addEventListener('click', e => { const tab = e.target.closest('[data-mode]'); if (tab) selectMode(tab.dataset.mode); });
  document.querySelector('.boundary-tabs').addEventListener('keydown', e => {
    const tabs = [...document.querySelectorAll('[role=tab]')], index = tabs.indexOf(e.target);
    if (index < 0 || !['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectMode(tabs[next].dataset.mode, true);
  });
  $('process-steps').addEventListener('click', e => { const step = e.target.closest('[data-topic]'); if (step) selectTopic(Number(step.dataset.topic)); });
  $('drawing').addEventListener('click', e => { const step = e.target.closest('[data-topic]'); if (step) selectTopic(Number(step.dataset.topic), 'hotspot'); });
  $('drawing').addEventListener('keydown', e => { const step = e.target.closest('[data-topic]'); if (step && ['Enter',' '].includes(e.key)) { e.preventDefault(); selectTopic(Number(step.dataset.topic), 'hotspot'); } });

  function closeInfo() { $('explanation').classList.remove('open'); $('explanation').removeAttribute('role'); $('explanation').removeAttribute('aria-modal'); $('info-backdrop').hidden = true; $('info-toggle').focus(); }
  function openInfo() { stop(); $('explanation').classList.add('open'); $('explanation').setAttribute('role', 'dialog'); $('explanation').setAttribute('aria-modal', 'true'); $('info-backdrop').hidden = false; $('info-close').focus(); }
  $('info-toggle').addEventListener('click', openInfo);
  $('info-close').addEventListener('click', closeInfo); $('info-backdrop').addEventListener('click', closeInfo);
  document.addEventListener('keydown', e => {
    if (!$('explanation').classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeInfo(); }
    if (e.key === 'Tab') {
      const nodes = [...$('explanation').querySelectorAll('button,summary,a[href]')].filter(el => el.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('theme').setAttribute('aria-pressed', String(dark)); $('theme').setAttribute('aria-label', dark ? 'Bytt til lys visning' : 'Bytt til mørk visning');
  }
  let dark = matchMedia('(prefers-color-scheme:dark)').matches;
  try { const stored = localStorage.getItem('onlyfag-plate-model-theme'); if (stored) dark = stored === 'dark'; } catch { /* Storage may be unavailable in private/file contexts. */ }
  applyTheme(dark);
  const embedded = window.parent !== window && new URLSearchParams(location.search).get('embedded') === '1';
  if (embedded) {
    let hostVisible = false;
    document.documentElement.classList.add('embedded');
    const back = document.querySelector('.back');
    back.textContent = '← Geografi / Meny';
    back.addEventListener('click', event => { event.preventDefault(); stop(); parent.postMessage({type:'plate-model-back'}, location.origin); });
    addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'plate-model-host') return;
      if (!event.data.visible) stop();
      if (event.data.visible && !hostVisible) { stop(); progress[mode] = 0; narratedStage = -1; draw(); }
      hostVisible = Boolean(event.data.visible);
      if (typeof event.data.dark === 'boolean') { dark = event.data.dark; applyTheme(dark); }
    });
  }
  $('theme').addEventListener('click', () => { dark = !dark; applyTheme(dark); try { localStorage.setItem('onlyfag-plate-model-theme', dark ? 'dark' : 'light'); } catch {} });
  if (!document.fullscreenEnabled) $('fullscreen').hidden = true;
  $('fullscreen').addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { $('fullscreen').setAttribute('aria-label', 'Fullskjerm er ikke tilgjengelig i denne nettleseren'); }
  });
  document.addEventListener('fullscreenchange', () => $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Avslutt fullskjerm' : 'Åpne fullskjerm'));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change', stop);
  addEventListener('hashchange', () => { if (knownMode(location.hash.slice(1))) selectMode(location.hash.slice(1)); });
  new ResizeObserver(() => {
    const rect = $('scene').getBoundingClientRect();
    mobile = rect.width < 600;
    // Reflow vertical coordinates, not text: wide screens use the full figure width.
    height = 1000 * rect.height / Math.max(1, rect.width);
    $('scene').classList.toggle('short', height < 360);
    $('diagram').setAttribute('viewBox', `0 0 1000 ${height}`);
    if (innerWidth > 900 && $('explanation').classList.contains('open')) closeInfo();
    draw();
  }).observe($('scene'));
  selectMode(knownMode(location.hash.slice(1)) ? location.hash.slice(1) : mode);
})();
