// Local, dependency-free build. The attributed SVG is the reviewed geometry
// source; only paths and an interior hint point enter the playable JSON.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/geography/sources/norway-counties-2024.svg'), 'utf8');
const expected = new Map([
  ['03', 'Oslo'], ['11', 'Rogaland'], ['15', 'Møre og Romsdal'],
  ['18', 'Nordland'], ['31', 'Østfold'], ['32', 'Akershus'],
  ['33', 'Buskerud'], ['34', 'Innlandet'], ['39', 'Vestfold'],
  ['40', 'Telemark'], ['42', 'Agder'], ['46', 'Vestland'],
  ['50', 'Trøndelag'], ['55', 'Troms'], ['56', 'Finnmark']
]);
const unescape = value => value.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const rows = [...source.matchAll(/<path\b[^>]*\/>/g)].map(match => {
  const attrs = Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], unescape(a[2])]));
  const row = {n:attrs['data-name'], a:attrs['data-code'], d:attrs.d, c:attrs['data-center'].split(' ').map(Number)};
  if (expected.get(row.a) !== row.n || !row.d || /[^MLZ0-9.\s-]/.test(row.d) || row.c.length !== 2 || row.c.some(n => !Number.isFinite(n))) throw new Error('Unexpected county geometry: ' + row.n);
  // Hint coordinates must lie on the county's land, not in a fjord or lake.
  const rings = row.d.split('Z').filter(Boolean).map(r => r.slice(1).split('L').map(p => p.split(' ').map(Number)));
  let inside = false;
  for (const ring of rings) {
    for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const a=ring[i],b=ring[j],p=row.c;
      if ((a[1]>p[1]) !== (b[1]>p[1]) && p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) inside = !inside;
    }
  }
  if (!inside) throw new Error('Hint point is outside county land: ' + row.n);
  return row;
}).sort((a,b) => a.a.localeCompare(b.a));
if (rows.length !== 15 || new Set(rows.map(r=>r.a)).size !== 15) throw new Error('Expected exactly the current 15 counties');
const output = JSON.stringify(rows) + '\n';
const target = path.join(root, 'assets/geography/norway-counties.json');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== output) throw new Error('Run node scripts/build-norway-county-assets.cjs');
  console.log('PASS Norwegian county geometry: 15 unique counties, interior hint points, current output');
} else {
  fs.writeFileSync(target, output);
  console.log('Built Norwegian county geometry: 15 counties');
}
