// Decorative hub illustrations. Real map outlines and flag geometry reuse the
// site's existing sources; all other artwork is authored here as local SVG.
// Preserve previous content hashes so cached pages keep their artwork.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets/geography/quiz-card-art');
const checking = process.argv.includes('--check');
const palette = {
  sage: '#e9eee5', sea: '#dcebef', sand: '#f0e8d9', forest: '#285b4a',
  leaf: '#719985', pale: '#bfd0bb', ink: '#294953', rust: '#bb7154',
  gold: '#d7ad63', white: '#fffdf5', blue: '#314e6a',
};
const p = palette;
const number = n => String(Number(n.toFixed(2)));
const rect = (x, y, width, height, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${extra}/>`;
const stroke = (d, colour, width, extra = '') =>
  `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const shape = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const svg = (title, background, content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" role="img" aria-labelledby="title"><title id="title">${title}</title>${rect(0, 0, 240, 90, background)}${content}</svg>\n`;

// Ramer-Douglas-Peucker in display coordinates keeps silhouettes crisp while
// omitting details too small to be seen in a 153-pixel thumbnail.
function simplify(points, tolerance) {
  if (points.length < 4) return points;
  const first = points[0], last = points.at(-1);
  const dx = last[0] - first[0], dy = last[1] - first[1], length = dx * dx + dy * dy;
  let farthest = tolerance * tolerance, index = -1;
  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    const t = length ? Math.max(0, Math.min(1, ((point[0] - first[0]) * dx + (point[1] - first[1]) * dy) / length)) : 0;
    const distance = (point[0] - first[0] - t * dx) ** 2 + (point[1] - first[1] - t * dy) ** 2;
    if (distance > farthest) { farthest = distance; index = i; }
  }
  return index < 0 ? [first, last] :
    simplify(points.slice(0, index + 1), tolerance).slice(0, -1).concat(simplify(points.slice(index), tolerance));
}
const ringPath = ring => ring.map(([x, y], i) => `${i ? 'L' : 'M'}${number(x)} ${number(y)}`).join('') + 'Z';

// Evaluate only the existing flag definitions, before their DOM integration.
const flagSource = fs.readFileSync(path.join(root, 'assets/geography/flags-simple.js'), 'utf8');
const flags = vm.runInNewContext(flagSource.slice(0, flagSource.indexOf('function upgradeSimpleFlags')) + '\nSIMPLE_FLAGS;');
function flag(code, x, y, width, height) {
  const source = decodeURIComponent(flags[code].split(',').slice(1).join(','));
  const match = source.match(/^<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>$/);
  assert(match, `Existing vector flag ${code}`);
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${match[1]}">${match[2]}</svg>`;
}

const europe = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/continent-maps.json'))).regions.europe;
const france = europe.states.find(state => state.n === 'Frankrike');
assert(france && !france.marker, 'Real France outline');
const franceRings = (france.d.match(/M[^M]+/g) || []).map(d => {
  assert(!/[ACHQSTV]/i.test(d), 'Country source uses polygon segments');
  const values = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  return Array.from({length: values.length / 2}, (_, i) => values.slice(i * 2, i * 2 + 2));
});
const francePoints = franceRings.flat();
const franceBounds = [Math.min(...francePoints.map(point => point[0])), Math.min(...francePoints.map(point => point[1])),
  Math.max(...francePoints.map(point => point[0])), Math.max(...francePoints.map(point => point[1]))];
const franceScale = 83 / (franceBounds[3] - franceBounds[1]);
const francePath = franceRings.map(ring => ringPath(simplify(ring.map(([x, y]) =>
  [86 + (x - franceBounds[0]) * franceScale, 3.5 + (y - franceBounds[1]) * franceScale]), .38))).join('');

// Reuse the public-domain Natural Earth compact polygons already shipped in
// core.js, using the same decoder extraction as build-circulation-map.cjs.
const core = fs.readFileSync(path.join(root, 'assets/geography/core.js'), 'utf8');
function declaration(name) {
  const start = core.search(new RegExp('const ' + name + '\\s*='));
  assert(start >= 0, `Map declaration ${name}`);
  let quote = null, escaped = false;
  for (let i = start; i < core.length; i++) {
    const c = core[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === ';') return core.slice(start, i + 1).replace(/^const/, 'var');
  }
  throw Error(`Incomplete map declaration ${name}`);
}
const sandbox = {atob: value => Buffer.from(value, 'base64').toString('binary')};
vm.createContext(sandbox);
for (const name of ['COUNTRY_MAP_FILL_B64', 'COUNTRY_MAP_FILL_NAMES']) vm.runInContext(declaration(name), sandbox);
vm.runInContext(core.slice(core.indexOf('function countryMapDecodeCompactPolygon('), core.indexOf('function countryMapLandData(')), sandbox);
const world = vm.runInContext('countryMapDecodeCompactPolygon(COUNTRY_MAP_FILL_B64,COUNTRY_MAP_FILL_NAMES)', sandbox);
assert(world.features.length > 150, 'Existing world map includes countries');
function worldArtwork() {
  const shapes = [];
  for (const feature of world.features) {
    if (feature.properties.name === 'Antarctica') continue;
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) {
      const rings = polygon.map(ring => {
        let previous = ring[0][0];
        return ring.map(([longitude, latitude]) => {
          let lon = longitude;
          while (lon - previous > 180) lon -= 360;
          while (lon - previous < -180) lon += 360;
          previous = lon;
          return [lon, latitude];
        });
      });
      const west = Math.min(...rings[0].map(point => point[0])), east = Math.max(...rings[0].map(point => point[0]));
      for (const shift of [-360, 0, 360]) {
        if (east + shift < -180 || west + shift > 180) continue;
        const displayRings = rings.map(ring => simplify(ring.map(([lon, lat]) =>
          [Number((-3 + (lon + shift + 180) / 360 * 248).toFixed(1)),
            Number((3 + (83 - lat) / 145 * 84).toFixed(1))]), .65));
        const area = ring => Math.abs(ring.reduce((sum, point, i) => {
          const next = ring[(i + 1) % ring.length];
          return sum + point[0] * next[1] - next[0] * point[1];
        }, 0) / 2);
        if (area(displayRings[0]) < .3) continue;
        const d = displayRings.filter((ring, i) => i === 0 || area(ring) >= .3).map(ringPath).join('');
        shapes.push(shape(d, feature.properties.name === 'Brazil' ? p.rust : p.leaf,
          ` fill-rule="evenodd" stroke="${p.sea}" stroke-width=".45" stroke-linejoin="round"`));
      }
    }
  }
  return shapes.join('');
}

const civicBuilding = (x = 0, y = 0, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">` +
  shape('M0 65H80V33H0Z', p.forest) + shape('M-5 33 40 12 85 33Z', p.leaf) +
  shape('M25 15a15 15 0 0 1 30 0Z', p.forest) + rect(37, -2, 6, 8, p.forest) +
  [10, 27, 44, 61].map(left => rect(left, 39, 8, 22, p.sage)).join('') +
  rect(-5, 65, 90, 5, p.ink) + '</g>';
const pin = (x, y, colour, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})">` +
  shape('M0 17C-4 10-12 3-12-5a12 12 0 1 1 24 0C12 3 4 10 0 17Z', colour) + circle(0, -5, 4.2, p.white) + '</g>';
const mapLines = stroke('M-12 74 56 21 128 44 195 4 252 29M-6 15 52 43 95 5M52 43 78 102M128 44 156 103M195 4 205 91', p.white, 2.3);

const cards = {
  'flaggquiz.html': ['flags', svg('Flag quiz', p.sage,
    rect(17, 13, 93.5, 68, '#b5c3b3') + rect(129, 13, 102, 68, '#b5c3b3') +
    flag('no', 14, 9, 93.5, 68) + flag('jp', 126, 9, 102, 68))],

  'hovedstadsquiz.html': ['capitals', svg('Capital cities', p.sage,
    shape('M0 89V57H18V44H39V67H68V36H87V89M166 89V47H185V29H205V56H222V44H240V90Z', p.pale) +
    shape('M25 90V34H45V90ZM28 34V22H42V34ZM31 22 35 8 39 22Z', p.leaf) +
    circle(35, 42, 5, p.sage) + stroke('M35 38v4l3 2', p.forest, 1.5) +
    civicBuilding(89, 19, 1) + rect(0, 87, 240, 3, p.forest) +
    rect(192, 53, 22, 34, p.leaf) + rect(197, 42, 12, 11, p.leaf))],

  'flagg-og-hovedstad.html': ['flagcapital', svg('Flags and capital cities', p.sage,
    flag('fr', 14, 15, 84, 56) +
    stroke('M110 34h21m-6-6 6 6-6 6M131 56h-21m6-6-6 6 6 6', p.ink, 2.8) +
    civicBuilding(151, 17, .93) + rect(140, 83, 100, 3, p.forest))],

  'worldle.html': ['worldle', svg('Country outline challenge', p.sea,
    circle(120, 45, 66, '#c9dddc') +
    stroke('M0 22H240M0 45H240M0 68H240M40 0V90M80 0V90M120 0V90M160 0V90M200 0V90', '#a9c7c6', .7) +
    shape(francePath, p.forest, ` stroke="${p.white}" stroke-width="1.4" stroke-linejoin="round"`) +
    stroke('M28 45h31m-10-10 10 10-10 10', p.rust, 4) +
    shape('M198 22 208 46 198 41 188 46Z', p.ink) +
    shape('M198 67 188 43 198 48 208 43Z', '#91b3b4'))],

  'jeopardy.html': ['jeopardy', svg('Geography quiz board', p.blue,
    Array.from({length: 6}, (_, index) => {
      const x = (index % 3) * 81 - 1, y = Math.floor(index / 3) * 46 - 1;
      const selected = index === 4;
      return rect(x, y, 79, 44, selected ? p.gold : '#3c607c') +
        `<text x="${x + 39.5}" y="${y + 29}" text-anchor="middle" fill="${selected ? p.ink : '#efcf89'}" font-family="Arial,sans-serif" font-size="23" font-weight="700">${(Math.floor(index / 3) + 1) * 100}</text>`;
    }).join(''))],

  'landquiz.html': ['countries', svg('Countries of the world', p.sea,
    stroke('M0 27H240M0 55H240M0 83H240M40 0V90M80 0V90M120 0V90M160 0V90M200 0V90', '#c1d7dc', .6) +
    worldArtwork())],

  'stedsquiz.html': ['places', svg('Recognisable places around the world', p.sand,
    circle(202, 20, 25, '#e5c68d') +
    shape('M132 90 181 22 239 90ZM171 37 181 22 194 39 184 35 179 42Z', p.pale) +
    shape('M98 83 139 29 181 83Z', p.gold) + shape('M139 29 151 83H181Z', '#b68c51') +
    shape('M18 90 43 33 47 1 51 33 77 90H63L47 54 31 90Z', p.ink) +
    rect(26, 63, 42, 5, p.ink) + rect(37, 37, 21, 4, p.ink) +
    shape('M36 89a11 14 0 0 1 22 0Z', p.sand) +
    shape('M171 90 198 55 240 90Z', p.leaf) + rect(0, 86, 240, 4, p.forest))],

  'mapwiz.html': ['mapwiz', svg('Locate places on the map', p.sea,
    shape('M-10-5H170L151 16 173 34 156 57 120 60 103 88 69 100H-10Z', '#abc2a8') +
    shape('M180 96 194 69 220 60 244 74V100Z', p.pale) + mapLines +
    stroke('M28 69C62 36 87 77 122 43S160 27 180 36', p.forest, 2.4, ' stroke-dasharray="3 6"') +
    circle(125, 52, 29, 'none', ` stroke="${p.forest}" stroke-width="1.4" opacity=".45"`) +
    circle(125, 52, 19, 'none', ` stroke="${p.forest}" stroke-width="1.4" opacity=".45"`) +
    stroke('M125 16v10M125 78v10M89 52H99M151 52H161', p.forest, 2) + pin(125, 41, p.rust, 1.2))],

  'geoguessr.html': ['geoguessr', svg('Recognise a place from the landscape', p.sea,
    circle(192, 16, 17, '#ead7a6') +
    shape('M-10 51 28 18 67 49 104 29 150 59 194 31 250 61V90H-10Z', p.pale) +
    shape('M-10 62Q45 25 111 61T250 53V90H-10Z', p.leaf) +
    shape('M-5 94 113 44 128 44 251 94Z', '#88938d') +
    shape('M20 94 114 44H117L37 94ZM220 94 125 44H128L236 94Z', p.white) +
    stroke('M121 52v5M122 65l1 11M124 87v8', p.white, 2.8) +
    shape('M37 71V37M37 43H66L59 35H37', p.forest, ` stroke="${p.forest}" stroke-width="3" stroke-linejoin="round"`) +
    shape('M211 77V49M200 61l11-23 11 23Z', p.forest))],
};

const manifest = {};
if (!checking) fs.mkdirSync(output, {recursive: true});
for (const [route, [name, content]] of Object.entries(cards)) {
  assert(!/<(?:image|foreignObject|script)\b|(?:href|src)="https?:|data:image/i.test(content), 'Self-contained vector artwork');
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  const filename = `${name}-${hash}.svg`;
  const file = path.join(output, filename);
  manifest[route] = 'assets/geography/quiz-card-art/' + filename;
  if (checking) assert.equal(fs.readFileSync(file, 'utf8'), content, `Rebuild ${route} artwork`);
  else fs.writeFileSync(file, content);
}
const manifestContent = JSON.stringify(manifest, null, 2) + '\n';
const manifestFile = path.join(output, 'manifest.json');
if (checking) assert.equal(fs.readFileSync(manifestFile, 'utf8'), manifestContent, 'Rebuild hub artwork manifest');
else fs.writeFileSync(manifestFile, manifestContent);

// Update only the nine hub previews, keeping routes, order, labels, event
// handlers, and the independently maintained Kart/GeoGrid artwork untouched.
const htmlFile = path.join(root, 'geografi.html');
const html = fs.readFileSync(htmlFile, 'utf8').replace(/\r\n/g, '\n');
const replaced = new Set();
const updated = html.replace(/<button\b[^>]*onclick="location\.href='geografi\/([^']+)'"[^>]*>[\s\S]*?<\/button>/g,
  (button, route) => {
    if (!Object.hasOwn(manifest, route)) return button;
    assert(!replaced.has(route), `One hub card per ${route}`);
    const opening = /<span\b[^>]*class="[^"]*\bgeoquiz-preview\b[^"]*"[^>]*>/.exec(button);
    assert(opening, `Hub preview for ${route}`);
    const spans = /<span\b[^>]*>|<\/span\s*>/g;
    spans.lastIndex = opening.index;
    let depth = 0, end = -1, token;
    while ((token = spans.exec(button))) {
      depth += /^<\/span/.test(token[0]) ? -1 : 1;
      if (!depth) { end = spans.lastIndex; break; }
    }
    assert(end > opening.index, `Complete preview span for ${route}`);
    replaced.add(route);
    return button.slice(0, opening.index) +
      `<span class="geoquiz-preview image-preview geoquiz-art"><img alt="" src="${manifest[route]}"/></span>` +
      button.slice(end);
  });
assert.equal(replaced.size, Object.keys(cards).length, 'All nine hub previews updated');
if (checking) assert.equal(html, updated, 'Rebuild geography hub preview references');
else fs.writeFileSync(htmlFile, updated);
console.log(`PASS ${checking ? 'verified' : 'built'} ${Object.keys(cards).length} full-bleed geography hub illustrations`);
