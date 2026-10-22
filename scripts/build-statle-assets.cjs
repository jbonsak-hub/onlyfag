// Changed CSS/JS get new URLs so cached HTML never runs incompatible code.
// Retain previously published files: cached HTML may still reference them.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const checking = process.argv.includes('--check');
const assets = ['statle.css', 'statle.js', 'panel-resize.js', 'map-zoom.js'].map(source => {
  const extension = source.split('.').pop(), stem = source.slice(0,-extension.length-1);
  let content = fs.readFileSync(path.join(root, 'assets/geography/' + source), 'utf8').replace(/\r\n/g, '\n');
  if (source === 'statle.js') {
    for (const dataFile of ['us-states.json', 'norway-counties.json', 'continent-maps.json', 'physical-maps/world-water.json', 'physical-maps/mountain-europe.json']) {
      const data = fs.readFileSync(path.join(root, 'assets/geography', dataFile), 'utf8').replace(/\r\n/g, '\n');
      const revision = crypto.createHash('sha256').update(data).digest('hex').slice(0,12);
      content = content.split(dataFile).join(dataFile + '?v=' + revision);
    }
  }
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  return {extension, stem, content, relative:'assets/geography/statle-assets/' + stem + '-' + hash + '.' + extension};
});
for (const asset of assets) {
  const file = path.join(root, asset.relative);
  if (checking) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== asset.content) throw new Error('Run node scripts/build-statle-assets.cjs');
  } else {
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.writeFileSync(file, asset.content);
  }
}
for (const page of ['geografi/statle.html', 'geografi/fylker.html', 'geografi/kart.html', 'prototypes/statle.html']) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');
  for (const asset of assets) {
    const expected = '../' + asset.relative;
    if (checking) {
      if (!html.includes('"' + expected + '"')) throw new Error(page + ': run node scripts/build-statle-assets.cjs');
    } else {
      const pattern = new RegExp('../assets/geography/(?:statle-assets/)?' + asset.stem + '(?:-[a-f0-9]+)?\\.' + asset.extension, 'g');
      if (!pattern.test(html)) throw new Error('Missing Statle asset reference in ' + page);
      html = html.replace(pattern, expected);
    }
  }
  if (!checking) fs.writeFileSync(file, html);
}
console.log(checking ? 'PASS Statle asset versions match their source' : 'Built versioned Statle assets');
