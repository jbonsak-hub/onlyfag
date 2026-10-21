// Version each dependency by content. Keep old versions for cached documents.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'assets/geography/routes.js'), 'utf8').match(/window.GEO_QUIZ_ROUTES=([\s\S]*);/)[1]);
const pages = ['geografi.html', ...Object.entries(routes).filter(([mode]) => !['statle','openguessr'].includes(mode)).map(([, [file]]) => file)];
const built = new Map();
for (const page of pages) {
  const file = path.join(root, page), original = fs.readFileSync(file, 'utf8');
  const html = original.replace(/(src|href)="((?:\.\.\/)?assets\/geography\/)([^"?]+\.(?:js|css))"/g, (match, attr, prefix, name) => {
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
  if (!check && html !== original) fs.writeFileSync(file, html);
}
console.log((check ? 'Verified ' : 'Built ') + built.size + ' assets for ' + pages.length + ' pages');
