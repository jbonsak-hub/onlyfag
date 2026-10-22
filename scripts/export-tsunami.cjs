// A self-contained copy for review or classroom use, with no Flash runtime.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),output=process.argv[2];
if(!output)throw new Error('Usage: node scripts/export-tsunami.cjs /path/to/Tsunami.html');
const source=path.join(root,'geografi/tsunami.html'),target=path.resolve(output);
if(target===source)throw new Error('Choose an output path other than the website source.');
const dir=path.join(root,'assets/geography/tsunami');
const css=fs.readFileSync(path.join(dir,'model.css'),'utf8');
const scripts=['reference-data.js','reference-renderer.js','model.js'];
const js=scripts.map(name=>fs.readFileSync(path.join(dir,name),'utf8')).join('\n;\n');
const html=fs.readFileSync(source,'utf8')
  .replace(/<link rel="stylesheet" href="\.\.\/assets\/geography\/tsunami\/model\.css(?:\?[^"\s]*)?">/,()=>'<style>\n'+css+'\n</style>')
  .replace(/  <script src="\.\.\/assets\/analytics\.js" defer><\/script>\n/,'')
  .replace(/  <script src="\.\.\/assets\/geography\/tsunami\/(?:reference-data|reference-renderer|model)\.js(?:\?[^"\s]*)?" defer><\/script>\n/g,'')
  .replaceAll('../geografi.html#indre-fagstoff','https://onlyfag.no/geografi.html#indre-fagstoff')
  .replace('</body>',()=>'<script>\n'+js.replaceAll('</script','<\\/script')+'\n</script>\n</body>');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html);
console.log('Exported self-contained tsunami module to '+target);
