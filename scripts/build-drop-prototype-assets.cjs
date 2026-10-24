// Preserve published prototype assets so cached pages keep compatible map data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/geography/drop-prototype'),check=process.argv.includes('--check');
const read=name=>fs.readFileSync(path.join(dir,name),'utf8').replace(/\r\n/g,'\n');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex').slice(0,12);
const data=read('data.json'),dataFile='data-'+hash(data)+'.json';
const assets=[{file:dataFile,text:data},{file:'style-'+hash(read('style.css'))+'.css',text:read('style.css')}];
const app=read('app.js').replace('drop-prototype/data.json','drop-prototype/'+dataFile);
assets.push({file:'app-'+hash(app)+'.js',text:app});
for(const asset of assets){const file=path.join(dir,asset.file);if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==asset.text)throw Error('Rebuild river prototype assets');}else fs.writeFileSync(file,asset.text);}
const file=path.join(root,'prototypes/folg-drapen.html'),original=fs.readFileSync(file,'utf8');
let html=original;
for(const type of ['style','app']){const asset=assets.find(a=>a.file.startsWith(type+'-'));html=html.replace(new RegExp('drop-prototype/'+type+'(?:-[a-f0-9]{12})?\\.'+(type==='style'?'css':'js'),'g'),'drop-prototype/'+asset.file);}
if(check){if(html!==original)throw Error('Rebuild river prototype page references');}else fs.writeFileSync(file,html);
console.log('PASS '+(check?'verified':'built')+' versioned river prototype assets');
