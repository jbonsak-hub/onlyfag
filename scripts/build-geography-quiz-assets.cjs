// Version each dependency by content. Keep old versions for cached documents.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/routes.js'), 'utf8').match(/window.GEO_QUIZ_ROUTES=([\s\S]*);/)[1]);
const pages = ['geografi.html', 'prototypes/mapwiz.html', 'prototypes/statle.html', ...Object.values(routes).map(([file]) => file)];
const mapHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/geography/maplab.html'),'utf8').replace(/\r\n/g,'\n')).digest('hex').slice(0,12);
const built = new Map();
for (const page of pages) {
  const file = path.join(root, page), original = fs.readFileSync(file, 'utf8');
  let html = original.replace(/(src|href)="((?:\.\.\/)?assets\/geography\/)([^"?]+\.(?:js|css))"/g, (match, attr, prefix, name) => {
    const sourceName = name.replace(/^quiz-assets\//, '').replace(/-[a-f0-9]{12}(?=\.(?:js|css)$)/, '');
    // Statle's separate build and maplab resources are outside this pipeline.
    if (sourceName.includes('/')) return match;
    if (!built.has(sourceName)) {
      const content = fs.readFileSync(path.join(root, 'assets/geography', sourceName), 'utf8').replace(/\r\n/g, '\n');
      const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0,12);
      const output = 'quiz-assets/' + sourceName.replace(/\.(js|css)$/, '-' + hash + '.$1');
      built.set(sourceName, {content, output});
    }
    const asset = built.get(sourceName), outputFile = path.join(root, 'assets/geography', asset.output);
    if (check) {
      if ((!asset.checked && (!fs.existsSync(outputFile) || fs.readFileSync(outputFile, 'utf8').replace(/\r\n/g, '\n') !== asset.content)) || name !== asset.output) throw new Error(page + ': run node scripts/build-geography-quiz-assets.cjs');
      asset.checked = true;
    } else if (!asset.written) {
      fs.mkdirSync(path.dirname(outputFile), {recursive:true});
      fs.writeFileSync(outputFile, asset.content);
      asset.written = true;
    }
    return attr + '="' + prefix + asset.output + '"';
  });
  html = html.replace(/(src="(?:\.\.\/)?assets\/geography\/maplab\.html\?quiz=(?:globle|travle|tradle|geogrid))(?:&(?:amp;)?v=[a-f0-9]+)?"/g, '$1&amp;v=' + mapHash + '"');
  if (check && html !== original) throw new Error(page + ': run node scripts/build-geography-quiz-assets.cjs');
  if (!check && html !== original) fs.writeFileSync(file, html);
}
console.log((check ? 'Verified ' : 'Built ') + built.size + ' assets for ' + pages.length + ' pages');
