// Export the teaching module as one offline HTML file, like the supplied original.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.argv[2];
if (!output) {
  console.error('Usage: node scripts/export-plate-boundaries.cjs /path/to/Plategrenser.html');
  process.exit(1);
}
const source = path.join(root, 'geografi/plategrenser.html');
const target = path.resolve(output);
if (target === source) throw new Error('Choose an output path other than the website source.');
const css = fs.readFileSync(path.join(root, 'assets/geography/plate-boundaries/model.css'), 'utf8');
const scripts = ['subduction-art.js','collision-transform-art.js','model.js'];
const js = scripts.map(file => fs.readFileSync(path.join(root, 'assets/geography/plate-boundaries', file), 'utf8')).join('\n;\n');
const html = fs.readFileSync(source, 'utf8')
  .replace('<link rel="stylesheet" href="../assets/geography/plate-boundaries/model.css">', () => '<style>\n' + css + '\n</style>')
  .replace('  <script src="../assets/analytics.js" defer></script>\n', '')
  .replace(/  <script src="\.\.\/assets\/geography\/plate-boundaries\/(?:subduction-art|collision-transform-art|model)\.js" defer><\/script>\n/g, '')
  .replaceAll('../geografi.html#indre-fagstoff', 'https://onlyfag.no/geografi.html#indre-fagstoff')
  .replace('</body>', () => '<script>\n' + js.replaceAll('</script', '<\\/script') + '\n</script>\n</body>');
fs.mkdirSync(path.dirname(target), {recursive:true});
fs.writeFileSync(target, html);
console.log('Exported standalone plate-boundary model to ' + target);
